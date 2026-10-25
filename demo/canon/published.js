// What the admin has published. The real site serves this as one small static file that is rebuilt only when the
// admin taps Publish, so a visit never reads the database. In the demo it sits in this browser (admin/admin.js
// writes it). With nothing published, every page keeps the content it ships with.
const PUBLISHED = (() => {
  // the server's published file (canon/published-data.js) is what every device sees; a copy kept in this browser
  // only counts when it is newer (a publish that couldn't reach the server)
  let local = null; try { local = JSON.parse(localStorage.getItem('jp-published') || 'null'); } catch (_) {}
  const server = window.PUBLISHED_DATA || null;
  if (!server) return local; if (!local) return server;
  return (local.at || 0) > (server.at || 0) ? local : server;
})();

// which kinds of care a doctor's "what they treat" covers, so booking can tag who suits the problem
const CARE_WORDS = [[/ortho|joint|muscle|fracture/i, ['Orthopaedic']], [/sport/i, ['Sports']], [/neuro|stroke|nerve|parkinson/i, ['Neurological']],
  [/spine|back|neck|posture/i, ['Spine & Back Care']], [/surgery|post-op|rehab/i, ['Post-Operative Rehab']], [/replacement/i, ['Joint Replacement Rehab']],
  [/geri|elder|older/i, ['Geriatric']], [/home/i, ['Home Care']], [/women|pregnan|pelvic|delivery/i, ['Women’s Health', "Women's Health"]], [/child|paed|kid/i, ['Paediatric']]];
function careOf(treats) { const out = new Set(); (treats || []).forEach(t => CARE_WORDS.forEach(([re, cs]) => { if (re.test(t)) cs.forEach(c => out.add(c)); })); return [...out]; }
const pubShort = d => d.name.replace(/\s*\(PT\)\s*$/, '');
const pubFirst = d => { const s = pubShort(d).replace(/^Dr\.?\s*/, ''), w = s.split(/\s+/).filter(x => !/^[A-Z]\.?$/.test(x)); return `Dr. ${w[0] || s}`; };

if (PUBLISHED) {
  if (typeof BRANCHES !== 'undefined' && PUBLISHED.branches) BRANCHES.forEach(b => {
    const x = PUBLISHED.branches[b.id]; if (!x) return;
    ['phone', 'addr', 'landmark', 'plus'].forEach(k => { if (x[k]) b[k] = x[k]; });
    if (x.sessions && x.sessions.length) b.sessions = x.sessions.map(s => [...s]);
    if (Array.isArray(x.days)) b.days = [...x.days];
    if (x.slot) b.slot = x.slot;
    // each weekday's own hours (a list or a {day: hours} map, depending on which days are open)
    if (x.week && typeof x.week === 'object') b.week = Object.fromEntries(Object.entries(x.week).map(([k, v]) => [k, v.map(s => [...s])]));
  });
  // the desktop site's team list (it carries a short "card" line)
  if (typeof TEAM !== 'undefined' && Array.isArray(TEAM) && TEAM.length && 'card' in TEAM[0] && PUBLISHED.doctors)
    TEAM.splice(0, TEAM.length, ...PUBLISHED.doctors.map(d => ({ id: d.id, name: d.name, short: pubShort(d), first: pubFirst(d), role: d.role, years: d.years,
      card: [d.role.split(/[·,]/)[0].trim(), d.years && d.years.replace(' years', ' yrs')].filter(Boolean).join(' · '), deg: d.deg, treat: d.treats, bg: d.bg,
      photo: d.photo, branches: d.branches, care: careOf(d.treats) })));
}
// puts a published photo on a placeholder (and takes it off again when there is none)
function paintPhoto(node, src) {
  if (!node) return;
  node.classList.toggle('is-real', !!src);
  const lab = node.getAttribute('aria-label'); if (lab && src) node.setAttribute('aria-label', lab.replace(/,? \(?to be shot\)?$/, ''));
  node.style.backgroundImage = src ? `url("${src}")` : ''; node.style.backgroundSize = src ? 'cover' : ''; node.style.backgroundPosition = src ? 'center' : '';
}
// the gallery's photos in branch order (JP Nagar, then Bannerghatta, then Arekere), each branch's main photo first
const GALLERY_ORDER = ['jpnagar', 'bannerghatta', 'arekere'];
// a branch with no photos yet keeps one placeholder card, so every branch has its tab and its place in the circle
const galleryPhotos = () => {
  const ph = (PUBLISHED && PUBLISHED.photos) || [];
  if (!ph.length) return [];
  return GALLERY_ORDER.flatMap(id => { const mine = ph.filter(p => p.branch === id); return mine.length ? mine : [{ branch: id, src: null, label: 'photos coming soon' }]; });
};
const clinicPhoto = i => { const ph = galleryPhotos(); return ph.length ? ph[i % ph.length].src : null; };
// a branch's photos in order; the first is its main photo
const branchPhotos = id => ((PUBLISHED && PUBLISHED.photos) || []).filter(p => p.branch === id);
const servicePhoto = id => (PUBLISHED && PUBLISHED.service_photos && PUBLISHED.service_photos[id]) || null;
// The days the clinic is open, in words, from the branches' schedules: "Monday to Saturday", "every day", or the days
// every branch shares plus who opens on more ("Monday to Saturday (Arekere on Sundays too)").
function openDaysText() {
  const NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], WEEK = [1, 2, 3, 4, 5, 6, 0];
  const per = BRANCHES.map(b => ({ b, days: WEEK.filter(n => worksOn(b, n)) }));
  const shared = WEEK.filter(n => per.every(x => x.days.includes(n)));
  const words = list => {
    if (list.length === 7) return 'every day';
    const runs = []; list.forEach(n => { const r = runs[runs.length - 1]; if (r && WEEK.indexOf(n) === WEEK.indexOf(r[r.length - 1]) + 1) r.push(n); else runs.push([n]); });
    const parts = runs.map(r => r.length > 2 ? `${NAMES[r[0]]} to ${NAMES[r[r.length - 1]]}` : r.map(n => NAMES[n]).join(' and '));
    return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0] || 'by appointment';
  };
  const extra = per.map(x => ({ b: x.b, more: x.days.filter(n => !shared.includes(n)) })).filter(x => x.more.length);
  if (!extra.length) return words(shared);
  return `${words(shared)} (${extra.map(x => `${x.b.short} on ${x.more.map(n => NAMES[n] + 's').join(' and ')} too`).join('; ')})`;
}
// "Inside our clinics": every published photo, labelled with its branch; the page's own labels until there are any
function galleryLabels(fallback) {
  const ph = galleryPhotos();
  if (!ph.length) return fallback;
  const name = id => { const b = typeof BRANCHES !== 'undefined' && BRANCHES.find(x => x.id === id); return b ? b.short : 'Our clinics'; };
  return ph.map(p => name(p.branch) + (p.label ? ` · ${p.label}` : ''));
}
// the gallery's branch tabs: consecutive photos of one branch make a group ([{ label, start, count }])
function galleryGroups(labels) {
  const out = [];
  labels.forEach((l, i) => {
    const b = typeof BRANCHES !== 'undefined' && BRANCHES.find(x => l.startsWith(x.short)); if (!b) return;
    const g = out[out.length - 1];
    if (g && g.label === b.short && g.start + g.count === i) g.count++; else out.push({ label: b.short, start: i, count: 1 });
  });
  return out;
}
const doctorPhoto = name => { const d = PUBLISHED && (PUBLISHED.doctors || []).find(x => name && (x.name === name || pubShort(x) === name || name.includes(pubShort(x)))); return d && d.photo || null; };
// the phone site's team page and booking list call these with what they ship as the fallback
function publishedTeam(fallback) {
  if (!PUBLISHED || !PUBLISHED.doctors) return fallback;
  return PUBLISHED.doctors.map((d, i) => ({ id: d.id, name: d.name, short: pubShort(d), role: d.role, years: d.years, deg: d.deg, treat: d.treats, bg: d.bg, feature: i === 0, photo: d.photo, branches: d.branches }));
}
function publishedDocs(fallback) {
  if (!PUBLISHED || !PUBLISHED.doctors) return fallback;
  return [fallback[0], ...PUBLISHED.doctors.map(d => ({ id: d.id, name: pubShort(d), role: [d.role.split(/[·,]/)[0].trim(), d.years].filter(Boolean).join(' · '), deg: d.deg.slice(0, 2), care: careOf(d.treats), branches: d.branches, photo: d.photo }))];
}
// text and photos already on the page
if (PUBLISHED) document.addEventListener('DOMContentLoaded', () => {
  const set = (sel, text) => { if (!text) return; document.querySelectorAll(sel).forEach(n => { n.textContent = text; }); };
  if (PUBLISHED.home) { set('[data-home-headline], #hero-h', PUBLISHED.home.headline); set('[data-home-intro], .hero-copy .lead', PUBLISHED.home.intro); }
  const svc = document.body.dataset.service || document.body.dataset.page, id = svc === 'home' ? 'homecare' : svc;
  if (id && PUBLISHED.services && PUBLISHED.services[id]) set('.phead > p, .svc-hero .lead', PUBLISHED.services[id]);
  document.querySelectorAll('.gcar-card .photo').forEach((p, i) => { if (clinicPhoto(i)) paintPhoto(p, clinicPhoto(i)); });
  // a branch's main photo wherever a branch photo goes; "start" is the branch the site starts at (nearest, else JP Nagar)
  document.querySelectorAll('[data-branch-photo]').forEach(n => {
    // the home page's own photo, when the clinic has set one, goes where the starting branch's would
    if (n.dataset.branchPhoto === 'start' && PUBLISHED.home && PUBLISHED.home.photo) { paintPhoto(n, PUBLISHED.home.photo); n.setAttribute('role', 'img'); n.setAttribute('aria-label', 'Inside J.P. Nagar Physio'); n.dataset.label = ''; return; }
    const id = n.dataset.branchPhoto === 'start' && typeof nearestIndex === 'function' ? BRANCHES[nearestIndex()].id : n.dataset.branchPhoto;
    const p = branchPhotos(id)[0], b = typeof BRANCHES !== 'undefined' && BRANCHES.find(x => x.id === id);
    if (p) { paintPhoto(n, p.src); if (b) { n.setAttribute('aria-label', `${b.name} clinic`); n.setAttribute('role', 'img'); n.dataset.label = ''; } }
  });
  if (typeof worksOn === 'function' && typeof BRANCHES !== 'undefined') document.querySelectorAll('[data-open-days]').forEach(n => { n.textContent = openDaysText(); });
  document.querySelectorAll('[data-service-photo]').forEach(n => { const src = servicePhoto(n.dataset.servicePhoto); if (src) paintPhoto(n, src); });
  // the desktop Team page's cards are written into the page, so they are matched by name
  document.querySelectorAll('.tilted-card__img[aria-label^="Portrait of "]').forEach(n => { const src = doctorPhoto(n.getAttribute('aria-label').replace(/^Portrait of /, '').replace(/, to be shot$/, '')); if (src) paintPhoto(n, src); });
});

/* ---------- the clinic's real diary ----------
   Only when the demo runs on WordPress (bash start.sh --wp sets window.JPN_API). Free times then come from the
   plugin instead of the sample ones: each day is fetched once, slotsFor() answers from what has arrived, and a
   'jpn:slots' event tells the page to redraw when a day comes in. Confirming a booking saves it in WordPress. */
const DIARY = window.JPN_API ? (() => {
  const days = new Map(), asked = new Map(), isoOf = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const url = (route, q = {}) => window.JPN_API + route + Object.entries(q).map(([k, v]) => `&${k}=${encodeURIComponent(v)}`).join('');
  let watched = null, timer = 0;
  // A day's free times. While a newer answer is on its way the last one stays in use (nothing flips to free), and an
  // answer that arrives after a newer request is dropped. The page hears 'jpn:slots' only when something changed.
  function load(branch, date) {
    const key = `${branch}|${date}`, n = (asked.get(key) || 0) + 1;
    asked.set(key, n); if (!days.has(key)) days.set(key, undefined);
    fetch(url('/slots', { branch, date }), { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null).then(j => {
      if (!j || asked.get(key) !== n) return;
      const next = new Map((j.times || []).map(x => [x.t, x.doctors])), prev = days.get(key);
      days.set(key, next);
      if (!prev || JSON.stringify([...prev]) !== JSON.stringify([...next])) document.dispatchEvent(new CustomEvent('jpn:slots', { detail: { branch, date } }));
    });
  }
  // other patients book too: the day on screen is checked again every 30 seconds while the page is visible, and at
  // once when the visitor comes back to it, so a time someone else has just taken stops being offered
  function tick() { clearTimeout(timer); if (watched && document.visibilityState === 'visible') { load(...watched); timer = setTimeout(tick, 30000); } }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tick(); else clearTimeout(timer); });
  return {
    isoOf,
    // the doctor the visitor has picked (an id), or null for "Any available": times that doctor isn't free count as taken
    want: null,
    // minute of the day -> free doctor ids, or undefined while the day is still on its way
    free(branch, day) {
      const date = isoOf(day), key = `${branch}|${date}`;
      if (!days.has(key)) load(branch, date);
      return days.get(key);
    },
    // keep this day fresh while it is on screen
    watch(branch, day) {
      const w = [branch, isoOf(day)];
      if (!watched || watched[0] !== w[0] || watched[1] !== w[1]) { watched = w; clearTimeout(timer); timer = setTimeout(tick, 30000); }
    },
    refresh(branch, day) { load(branch, isoOf(day)); },
    // resolves to { ok, status, data }: data is the booking, or WordPress's error with a message to show
    book(b) {
      return fetch(url('/bookings'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })
        .then(r => r.json().catch(() => ({})).then(data => ({ ok: r.ok, status: r.status, data })))
        .catch(() => ({ ok: false, status: 0, data: { message: 'No connection. Please try again, or call the clinic.' } }));
    }
  };
})() : null;
if (DIARY && typeof slotsFor === 'function') {
  const sampleSlots = slotsFor;
  // the same slot list the page always drew, with "taken" from the real diary: a time is taken when no doctor is free
  // then, since each doctor sees one patient per slot;
  // until the day has arrived nothing is marked taken, and the page redraws on 'jpn:slots'
  slotsFor = function (b, day, si) {
    const free = DIARY.free(b.id, day);
    // with a doctor picked, a time is free only if that doctor is
    return sampleSlots(b, day, si).map(x => {
      const docs = free && free.get(Math.round(x.t * 60));
      return { ...x, taken: free ? !docs || (!!DIARY.want && !docs.includes(DIARY.want)) : false, doctors: docs || [] };
    });
  };
}
