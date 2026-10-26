// Clinic admin on WordPress. Loaded before admin.js; does nothing unless the page runs on WordPress (bash start.sh --wp
// sets window.JPN_API, as the real admin subdomain will). Then the owner signs in with his WordPress login, every
// change goes to the clinic plugin's API, and the plugin's data is turned into the shapes admin.js already draws
// (hours as decimals, a doctor's photo as a URL), and back.
const WP = window.JPN_API ? (() => {
  const H = m => m / 60, M = h => Math.round(h * 60);
  let nonce = '', pushed = '', pushTimer = 0, pushing = Promise.resolve(true), uploadMax = 2 * 1024 * 1024;
  const days = new Set();

  function login() { location.href = `/wp-login.php?redirect_to=${encodeURIComponent(location.href)}`; return new Promise(() => {}); }
  // WordPress hands a signed-in user a REST nonce; "0" means nobody is signed in
  async function getNonce() {
    const r = await fetch('/wp-admin/admin-ajax.php?action=rest-nonce', { credentials: 'same-origin', cache: 'no-store' }).catch(() => null);
    const t = r && r.ok ? (await r.text()).trim() : '0';
    if (!t || t === '0') return login();
    nonce = t;
  }
  // Resolves to { ok, status, data }. Signed out (401) goes back to the sign-in page; a nonce that has lapsed while
  // the page stayed open (403 rest_cookie_invalid_nonce) is renewed once and the request tried again; any other
  // refusal comes back as an error to show.
  async function call(method, route, body, query = {}, retried) {
    const url = window.JPN_API + route + Object.entries(query).map(([k, v]) => `&${k}=${encodeURIComponent(v)}`).join('');
    const opts = { method, credentials: 'same-origin', headers: { 'X-WP-Nonce': nonce } };
    if (body instanceof FormData) opts.body = body;
    else if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    const r = await fetch(url, opts).catch(() => null);
    if (!r) return { ok: false, status: 0, data: { message: 'No connection. Check the internet and try again.' } };
    if (r.status === 401) return login();
    const data = await r.json().catch(() => ({}));
    if (r.status === 403 && data.code === 'rest_cookie_invalid_nonce' && !retried) { await getNonce(); return call(method, route, body, query, true); }
    return { ok: r.ok, status: r.status, data };
  }
  // A photo as WebP (or JPEG where the browser can't write WebP, as older Safari can't) under `limit` bytes: the
  // quality steps down first, then the size, so an ordinary photo goes up untouched and only a heavy one is squeezed.
  async function fitUpload(dataUrl, limit) {
    const first = await (await fetch(dataUrl)).blob();
    if (first.size <= limit && /^image\/(webp|jpeg)$/.test(first.type)) return first;
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl; }).catch(() => null);
    if (!img) return null;
    const c = document.createElement('canvas'), toBlob = (type, q) => new Promise(res => c.toBlob(res, type, q));
    let w = img.naturalWidth, h = img.naturalHeight;
    for (let round = 0; round < 8; round++) {
      c.width = Math.round(w); c.height = Math.round(h); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      for (const q of [.82, .72, .62, .52]) {
        let b = await toBlob('image/webp', q);
        if (!b || b.type !== 'image/webp') b = await toBlob('image/jpeg', q);
        if (b && b.size <= limit) return b;
      }
      w *= .8; h *= .8;
    }
    return null;
  }
  const fail = r => toast((r.data && r.data.message) || 'That didn’t save. Please try again.');
  // the change was made, but the latest state couldn't be read back: say so rather than show an older one as current
  const stale = () => toast('Done, but the latest schedule couldn’t be loaded. Reload the page before making more changes.');

  /* ---------- the plugin's shapes <-> the admin's ---------- */
  // timings carry each weekday's own sessions (t.week, a list or a {day: sessions} map); older ones only days + sessions
  const hrs = list => (list || []).map(([a, b]) => [H(a), H(b)]), mins = list => list.map(([a, b]) => [M(a), M(b)]);
  const timingsIn = t => ({ days: [...(t.days || [])], sessions: hrs(t.sessions), slot: t.slot || 30,
    ...(t.week ? { week: Object.fromEntries(Object.entries(t.week).map(([k, v]) => [k, hrs(v)])) } : {}) });
  const timingsOut = t => ({ week: Object.fromEntries(Object.entries(t.week || {}).map(([k, v]) => [k, mins(v)])), slot: t.slot });
  function contentIn(c, urls) {
    return {
      home: { headline: '', intro: '', ...(c.home || {}), photoId: (c.home && c.home.photo) || 0, photo: c.home && c.home.photo ? urls[c.home.photo] || null : null }, services: Array.isArray(c.services) ? {} : { ...(c.services || {}) },
      branches: Object.fromEntries(Object.entries(c.branches || {}).map(([k, v]) => [k, { ...v }])),
      doctors: (c.doctors || []).map(d => ({ ...d, photoId: d.photo || 0, photo: d.photo ? urls[d.photo] || null : null })),
      photos: (c.photos || []).map(p => ({ id: p.id, src: urls[p.id], label: p.label || '', branch: p.branch || null })).filter(p => p.src),
      // service id -> { id, src }
      servicePhotos: Object.fromEntries(Object.entries(c.service_photos || {}).map(([k, id]) => [k, { id, src: urls[id] }]).filter(([, v]) => v.src))
    };
  }
  const contentOut = c => ({ home: { headline: c.home.headline, intro: c.home.intro, photo: c.home.photoId || 0 }, services: c.services, branches: c.branches,
    doctors: c.doctors.map(({ photoId, photo, ...d }) => ({ ...d, photo: photoId || 0 })), photos: c.photos.map(p => ({ id: p.id, label: p.label || '', branch: p.branch })),
    service_photos: Object.fromEntries(Object.entries(c.servicePhotos || {}).map(([k, v]) => [k, v.id])) });
  const bookingIn = r => ({ id: +r.id, name: r.name, phone: r.phone, branch: r.branch, doc: r.doctor, date: r.slot_date, t: H(+r.slot_time),
    problem: r.problem, note: r.note, status: r.status, source: r.source, reason: r.reason });

  // the next draft save, after any still on its way; resolves true once the server has the current draft
  function pushDraft() {
    pushing = pushing.catch(() => false).then(async () => {
      const body = contentOut(S.content), json = JSON.stringify(body);
      if (json === pushed) return true;
      const r = await call('PUT', '/admin/content', body);
      if (!r.ok) { fail(r); return false; }
      pushed = json; return true;
    });
    return pushing;
  }

  // The state again after a change made on the server (timings, leave, closed days). Content edits still waiting to go
  // up are sent first: reading the server's draft before they arrive would put the older one back on screen.
  async function reload() {
    clearTimeout(pushTimer);
    if (!await pushDraft()) return false;
    return load();
  }

  /* ---------- loading ---------- */
  async function load() {
    const r = await call('GET', '/admin/state');
    if (!r.ok) { fail(r); return false; }
    const s = r.data, urls = s.photo_urls || {};
    S.schedule = Object.fromEntries(Object.entries(s.schedule).map(([b, sc]) => [b, { ...timingsIn(sc), own: Object.fromEntries(Object.entries(sc.own || {}).map(([d, t]) => [d, timingsIn(t)])) }]));
    S.leave = (s.leave || []).map(l => ({ doc: l.doctor, branch: l.branch, date: l.date, cancelled: l.cancelled }));
    S.closed = (s.closed || []).map(c => ({ ...c }));
    S.content = contentIn(s.draft, urls); S.live = contentIn(s.live, urls);
    S.publishedAt = s.published ? parseInt(s.published, 10) * 1000 : null;
    if (s.upload_max > 0) uploadMax = s.upload_max;
    pushed = JSON.stringify(contentOut(S.content));
    return true;
  }
  // a day's bookings from the server; asking again while one request is on its way shares it. Resolves true when the
  // day's list changed (or arrived for the first time).
  const loading = new Map();
  function loadDay(date) {
    if (loading.has(date)) return loading.get(date);
    const sig = () => JSON.stringify(S.bookings.filter(x => x.date === date)), was = days.has(date) ? sig() : null;
    const p = call('GET', '/admin/bookings', undefined, { date }).then(r => {
      if (!r.ok) { fail(r); return false; }
      S.bookings = S.bookings.filter(x => x.date !== date).concat(r.data.map(bookingIn));
      days.add(date);
      return sig() !== was;
    }).finally(() => loading.delete(date));
    loading.set(date, p);
    return p;
  }

  return {
    async boot() { await getNonce(); S.bookings = []; return load(); },
    load, loadDay, hasDay: date => days.has(date),
    // the calendar: { 'YYYY-MM-DD': standing bookings } for a month (YYYY-MM), for one branch or all of them
    async month(ym, branch) {
      const r = await call('GET', '/admin/bookings/month', undefined, branch ? { month: ym, branch } : { month: ym });
      if (!r.ok) { fail(r); return null; }
      return r.data || {};
    },
    // reloads every day already on screen, after something that can change bookings on several days
    async reloadDays() { for (const d of [...days]) await loadDay(d); },
    // The content draft is saved a moment after the last edit. Saves go one at a time, in order, each sending the
    // draft as it is when its turn comes, so an older draft can never land after a newer one; publishing waits its turn.
    saveDraft() {
      if (JSON.stringify(contentOut(S.content)) === pushed) return;
      clearTimeout(pushTimer);
      pushTimer = setTimeout(() => { pushDraft(); }, 400);
    },
    async publish() {
      clearTimeout(pushTimer);
      if (!await pushDraft()) return false;
      const r = await call('POST', '/admin/publish', {});
      if (!r.ok) { fail(r); return false; }
      return load();
    },
    async setStatus(x, status) {
      const r = await call('POST', `/admin/bookings/${x.id}/status`, { status });
      if (!r.ok) { fail(r); return false; }
      Object.assign(x, bookingIn(r.data)); return true;
    },
    async addBooking(b) {
      const r = await call('POST', '/admin/bookings', { branch: b.branch, date: b.date, time: M(b.t), doctor: b.doc, name: b.name, phone: b.phone, problem: b.problem });
      if (!r.ok) { fail(r); return false; }
      await loadDay(b.date); return true;
    },
    // free times at a branch on a day: minute of the day -> free doctor ids (the same diary patients book from)
    async freeTimes(branch, date) {
      const r = await call('GET', '/slots', undefined, { branch, date });
      return new Map(r.ok ? r.data.times.map(x => [x.t, x.doctors]) : []);
    },
    async branchTimings(branch, t) {
      const r = await call('PUT', `/admin/schedule/${branch}`, { timings: timingsOut(t) });
      if (!r.ok) { fail(r); return false; }
      return reload();
    },
    async ownTimings(branch, doc, t) {
      const r = await call('PUT', `/admin/schedule/${branch}/own/${doc}`, { timings: t ? timingsOut(t) : null });
      if (!r.ok) { fail(r); return false; }
      return reload();
    },
    // leave and closed days answer with the bookings they cancelled (to call) and any that couldn't be
    async leave(add, doc, branch, date) {
      clearTimeout(pushTimer); if (!await pushDraft()) return null;
      const r = await call(add ? 'POST' : 'DELETE', '/admin/leave', { doctor: doc, branch, date });
      if (!r.ok) { fail(r); return null; }
      if (!await reload()) stale();
      await this.reloadDays();
      return { cancelled: (r.data.cancelled || []).map(bookingIn), failed: r.data.failed || [], notRestored: r.data.not_restored || [] };
    },
    async closed(add, branch, date, reason) {
      clearTimeout(pushTimer); if (!await pushDraft()) return null;
      const r = await call(add ? 'POST' : 'DELETE', '/admin/closed', { branch, date, reason });
      if (!r.ok) { fail(r); return null; }
      if (!await reload()) stale();
      await this.reloadDays();
      return { cancelled: (r.data.cancelled || []).map(bookingIn), failed: r.data.failed || [], notRestored: r.data.not_restored || [] };
    },
    // the cropped photo goes up small enough for the server (shrunk here first if it has to be); the plugin checks it,
    // resizes it and keeps only its own WebP copy. Resolves to { id, url } or { error } with the reason to show.
    async photo(dataUrl, kind) {
      const blob = await fitUpload(dataUrl, Math.floor(uploadMax * .9));
      if (!blob) return { error: `This photo couldn’t be made smaller than ${Math.round(uploadMax / 1048576)} MB. Try another photo.` };
      const form = new FormData();
      form.append('kind', kind); form.append('photo', blob, `${kind}.${blob.type === 'image/webp' ? 'webp' : 'jpg'}`);
      const r = await call('POST', '/admin/photos', form);
      if (!r.ok) return { error: (r.data && r.data.message) || `The upload failed (error ${r.status}). Please try again.` };
      return r.data;
    }
  };
})() : null;
