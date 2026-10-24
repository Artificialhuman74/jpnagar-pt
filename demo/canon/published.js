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
    ['phone', 'addr', 'landmark'].forEach(k => { if (x[k]) b[k] = x[k]; });
    if (x.sessions && x.sessions.length) b.sessions = x.sessions.map(s => [...s]);
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
const clinicPhoto = i => { const ph = PUBLISHED && PUBLISHED.photos; return ph && ph.length ? ph[i % ph.length].src : null; };
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
  if (PUBLISHED.home) { set('.hero .copy h1, #hero-h', PUBLISHED.home.headline); set('.hero .copy > p, .hero-copy .lead', PUBLISHED.home.intro); }
  const svc = document.body.dataset.service || document.body.dataset.page, id = svc === 'home' ? 'homecare' : svc;
  if (id && PUBLISHED.services && PUBLISHED.services[id]) set('.phead > p, .svc-hero .lead', PUBLISHED.services[id]);
  document.querySelectorAll('.gcar-card .photo').forEach((p, i) => { if (clinicPhoto(i)) paintPhoto(p, clinicPhoto(i)); });
  // the desktop Team page's cards are written into the page, so they are matched by name
  document.querySelectorAll('.tilted-card__img[aria-label^="Portrait of "]').forEach(n => { const src = doctorPhoto(n.getAttribute('aria-label').replace(/^Portrait of /, '').replace(/, to be shot$/, '')); if (src) paintPhoto(n, src); });
});

/* ---------- the clinic's real diary ----------
   Only when the demo runs on WordPress (bash start.sh --wp sets window.JPN_API). Free times then come from the
   plugin instead of the sample ones: each day is fetched once, slotsFor() answers from what has arrived, and a
   'jpn:slots' event tells the page to redraw when a day comes in. Confirming a booking saves it in WordPress. */
const LIVE = window.JPN_API ? (() => {
  const days = new Map(), isoOf = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const url = (route, q = {}) => window.JPN_API + route + Object.entries(q).map(([k, v]) => `&${k}=${encodeURIComponent(v)}`).join('');
  function load(branch, date) {
    const key = `${branch}|${date}`;
    days.set(key, null);
    fetch(url('/slots', { branch, date }), { cache: 'no-store' }).then(r => r.ok ? r.json() : { times: [] }).catch(() => ({ times: [] })).then(j => {
      days.set(key, new Map((j.times || []).map(x => [x.t, x.doctors])));
      document.dispatchEvent(new CustomEvent('jpn:slots', { detail: { branch, date } }));
    });
  }
  return {
    isoOf,
    // minute of the day -> free doctor ids, or undefined while the day is still on its way
    free(branch, day) { const key = `${branch}|${isoOf(day)}`; if (!days.has(key)) load(branch, isoOf(day)); return days.get(key) || undefined; },
    refresh(branch, day) { load(branch, isoOf(day)); },
    // resolves to { ok, status, data }: data is the booking, or WordPress's error with a message to show
    book(b) {
      return fetch(url('/bookings'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })
        .then(r => r.json().catch(() => ({})).then(data => ({ ok: r.ok, status: r.status, data })))
        .catch(() => ({ ok: false, status: 0, data: { message: 'No connection. Please try again, or call the clinic.' } }));
    }
  };
})() : null;
if (LIVE && typeof slotsFor === 'function') {
  const sampleSlots = slotsFor;
  // the same slot list the page always drew, with "taken" from the real diary (a time nobody is free for is taken);
  // until the day has arrived nothing is marked taken, and the page redraws on 'jpn:slots'
  slotsFor = function (b, day, si) {
    const free = LIVE.free(b.id, day);
    return sampleSlots(b, day, si).map(x => { const docs = free && free.get(Math.round(x.t * 60)); return { ...x, taken: free ? !docs : false, doctors: docs || [] }; });
  };
}
