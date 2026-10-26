// Clinic admin (demo): one person on a phone, four jobs in the dock: Today, Schedule, Doctors, Content.
// On WordPress (bash start.sh --wp, and the real site) every change goes to the clinic plugin through admin/wp.js,
// behind his WordPress login. As a plain demo it all lives in this browser, and "Publish to website" writes the
// snapshot the patient demo pages read (canon/published.js), the way the real site serves a static file that is
// rebuilt only when he publishes.
const $ = s => document.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
Object.assign(ICON, {
  plus: '<path d="M12 5v14M5 12h14"/>',
  clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.6V12l3 2"/>',
  edit: '<path d="M4.5 19.5h4l10-10a2.8 2.8 0 0 0-4-4l-10 10z"/><path d="m13.5 6.5 4 4"/>',
  photo: '<rect x="3.8" y="5.5" width="16.4" height="13" rx="2.6"/><circle cx="9" cy="10.4" r="1.7"/><path d="m4.5 17 4.6-4.4 3.4 3 2.6-2.4 4.4 3.8"/>',
  info: '<circle cx="12" cy="12" r="8.6"/><path d="M12 11v5M12 8h.01"/>',
  minus: '<path d="M5 12h14"/>',
  leave: '<rect x="3.8" y="5" width="16.4" height="15.2" rx="2.6"/><path d="M3.8 9.6h16.4M8.2 3v4M15.8 3v4M9.6 13.2l4.8 4.8M14.4 13.2l-4.8 4.8"/>'
});

/* ---------- dates ---------- */
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], DOWL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => { const d = nowIST(); d.setHours(0, 0, 0, 0); return d; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fromIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const dayLabel = d => { const o = Math.round((d - today()) / 864e5); return o === 0 ? 'Today' : o === 1 ? 'Tomorrow' : o === -1 ? 'Yesterday' : `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`; };
const longDate = d => `${DOWL[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
const timeOf = t => { const h = Math.floor(t), m = Math.round((t - h) * 60); return { label: `${h % 12 || 12}:${pad(m)}`, suffix: h >= 12 ? 'pm' : 'am' }; };
const timeText = t => { const x = timeOf(t); return `${x.label} ${x.suffix}`; };
const nowHours = () => { const d = nowIST(); return d.getHours() + d.getMinutes() / 60; };

/* ---------- state: kept in this browser for the demo ---------- */
const STORE = 'jp-admin-v1', PUB = 'jp-published';
const SERVICE_NAMES = ['Spine & Back Care', 'Orthopaedic', 'Sports', 'Neurological', 'Post-Operative Rehab', 'Joint Replacement Rehab', 'Women’s Health', 'Paediatric', 'Geriatric', 'Home Care'];
const SERVICE_IDS = ['spine', 'ortho', 'sports', 'neuro', 'postop', 'postop-joint', 'women', 'paeds', 'geri', 'homecare'];
const PAGES = [['spine', 'Spine & Back Care'], ['ortho', 'Orthopaedic Physiotherapy'], ['sports', 'Sports Physiotherapy'], ['postop', 'Post-Operative Rehab'], ['neuro', 'Neurological Physiotherapy'], ['women', 'Women’s Health'], ['paeds', 'Paediatric Physiotherapy'], ['geri', 'Geriatric Physiotherapy'], ['homecare', 'Home Care Physiotherapy'], ['therapies', 'Therapies & Equipment']];
const QUALS = ['MPT', 'BPT', 'COMT', 'MIAP', 'MD(A.M)', 'D.ACU'];

function seed() {
  // The doctors are the clinic's real team; which branches they work at is a sample until the clinic confirms
  // (only Dr. Jeya Chitra Devi at Arekere is confirmed).
  const doctors = [
    { id: 'senthil', name: 'Dr. P. Senthil (PT)', role: 'Founder · Chief Consultant Physiotherapist', years: '27+ years', deg: ['MPT', 'MD(A.M)', 'D.ACU', 'COMT', 'MIAP'],
      treats: ['Orthopaedic', 'Sports', 'Neurological', 'Spine & Back Care', 'Long-term and complex pain'],
      bg: ['BPT and MPT (Sports & Musculoskeletal), Rajah Muthiah Medical College', 'Certified Orthopaedic Manual Therapist', 'Advanced training in acupuncture and alternative medicine', 'Founded the clinic in 2012'],
      branches: ['jpnagar', 'arekere', 'bannerghatta'], photo: null },
    { id: 'vanitha', name: 'Dr. Vanitha Senthil (PT)', role: 'Senior Consultant Physiotherapist', years: '', deg: ['MPT', 'COMT', 'MIAP'],
      treats: ['Post-Operative Rehab', 'Joint Replacement Rehab', 'Geriatric', 'Home Care'],
      bg: ['Master of Physiotherapy', 'Certified Orthopaedic Manual Therapist', 'Known for compassionate, patient-centred care'], branches: ['jpnagar', 'bannerghatta'], photo: null },
    { id: 'jeya', name: 'Dr. Jeya Chitra Devi (PT)', role: 'HOD & Senior Consultant Physiotherapist', years: '15+ years', deg: ['BPT'],
      treats: ['Orthopaedic', 'Post-Operative Rehab', 'Sports', 'Neurological', 'Spine & Back Care'],
      bg: ['BPT, Dr. MGR Medical University', 'Head of Department at the Arekere branch', 'Focus on long-term recovery, not just temporary relief'], branches: ['arekere'], photo: null }
  ];
  const info = Object.fromEntries(BRANCHES.map(b => [b.id, { name: b.name, phone: b.phone, addr: b.addr, landmark: b.landmark }]));
  const schedule = Object.fromEntries(BRANCHES.map(b => [b.id, { days: [1, 2, 3, 4, 5, 6], sessions: b.sessions.map(s => [...s]), slot: 30, own: {} }]));
  const content = {
    doctors, branches: info,
    home: { headline: 'Feel better, sooner.', intro: 'Expert physiotherapy at 3 branches in South Bangalore.' },
    // each service page's text as the website shows it today
    services: {"ortho": "For joints and muscles that hurt, stiffen, or haven’t been the same since an injury.", "sports": "For sprains, strains and injuries from running, the gym or the field, and getting you back to it safely.", "postop": "Getting moving again after surgery, at a pace that suits your operation.", "neuro": "Rebuilding movement, balance and independence after a stroke and other nerve conditions.", "women": "Care for the back, pelvis and pelvic floor through pregnancy, after delivery, and beyond.", "paeds": "Helping children move, play and grow with confidence.", "geri": "Staying strong, steady and independent as you get older.", "therapies": "Hands-on treatment, exercise and gentle machines. See how each one works.", "spine": "For back and neck pain that won’t go away, or keeps coming back.", "homecare": "The same care, at home, when getting to the clinic is hard."}, photos: [], servicePhotos: {}
  };
  return { v: 4, content, live: null, schedule, leave: [], closed: [], bookings: sampleBookings(doctors, schedule), publishedAt: null };
}
// sample bookings so the demo has a day to look at: same names every time, labelled sample on screen
function sampleBookings(doctors, schedule) {
  const names = ['Priya R.', 'Ramesh K.', 'Lakshmi N.', 'Arjun M.', 'Meena S.', 'Kiran B.', 'Suresh P.', 'Divya H.', 'Anil G.', 'Kavya T.', 'Mohan R.', 'Shalini V.', 'Naveen D.', 'Asha K.'];
  const probs = ['Lower back', 'Neck', 'Knee', 'Shoulder', 'After surgery', 'Hip', 'Ankle', 'Sports injury'];
  const out = []; let n = 0;
  for (let o = -1; o < 7; o++) {
    const d = addDays(today(), o);
    BRANCHES.forEach(b => {
      if (!schedule[b.id].days.includes(d.getDay())) return;
      const docs = doctors.filter(x => x.branches.includes(b.id)), sc = schedule[b.id];
      const times = sc.sessions.flatMap(([s, e]) => { const r = []; for (let t = s; t < e; t += sc.slot / 60) r.push(t); return r; });
      const count = 3 + (hash(b.id + iso(d)) % 3);
      for (let i = 0; i < count; i++) {
        const k = hash(`${b.id}${iso(d)}${i}`), t = times[k % times.length], doc = k % 4 === 0 ? null : docs[k % docs.length].id;
        if (out.some(x => x.date === iso(d) && x.branch === b.id && x.t === t && (x.doc === doc || !doc || !x.doc))) continue;
        const past = o < 0 || (o === 0 && t < nowHours());
        out.push({ id: `s${n++}`, name: names[k % names.length], phone: `98${String(k % 1e8).padStart(8, '0')}`, branch: b.id, doc, date: iso(d), t,
          problem: probs[(k % 89) % probs.length], status: past ? (k % 5 === 0 ? 'cancelled' : 'arrived') : 'booked', source: k % 3 === 0 ? 'desk' : 'online' });
      }
    });
  }
  return out;
}
let S;
try { S = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (_) { S = null; }
if (!S || S.v !== 4) S = seed();
if (!S.live) S.live = clone(S.content);
// whatever the website shows now comes first: if something newer was published (from another device), start from it
(() => {
  const w = window.PUBLISHED_DATA; if (WP || !w || (w.at || 0) <= (S.publishedAt || 0)) return;
  const c = { doctors: w.doctors.map(d => ({ ...d })), branches: Object.fromEntries(Object.entries(w.branches).map(([k, v]) => [k, { name: v.name, phone: v.phone, addr: v.addr, landmark: v.landmark }])),
    home: w.home, services: w.services, photos: w.photos || [] };
  const unsaved = JSON.stringify(S.content) !== JSON.stringify(S.live);
  if (!unsaved) S.content = clone(c);
  S.live = c; S.publishedAt = w.at;
  Object.entries(w.branches).forEach(([k, v]) => { if (S.schedule[k] && v.sessions) { S.schedule[k].sessions = v.sessions; if (v.days) S.schedule[k].days = v.days; if (v.week) S.schedule[k].week = v.week; } });
})();
function clone(x) { return JSON.parse(JSON.stringify(x)); }
function save() {
  if (WP) { WP.saveDraft(); paintPub(); return; }
  try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (_) { toast('This browser is out of space for photos. Try a smaller photo.'); } paintPub();
}

/* ---------- lookups ---------- */
const BR = id => BRANCHES.find(b => b.id === id);
const docById = id => S.content.doctors.find(d => d.id === id);
const shortName = d => d.name.replace(/\s*\(PT\)\s*$/, '');
// rows use the short form, e.g. "Dr. Jeya" or "Dr. Senthil"
const rowName = d => { const w = shortName(d).replace(/^Dr\.?\s*/, '').split(/\s+/).filter(x => !/^[A-Z]\.?$/.test(x)); return `Dr. ${w[0] || shortName(d)}`; };
const initials = d => shortName(d).replace(/^Dr\.?\s*/, '').split(/\s+/).filter(w => /^[A-Za-z]/.test(w) && w.length > 1).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'Dr';
const docsAt = b => S.content.doctors.filter(d => d.branches.includes(b));
const timingsFor = (b, docId) => S.schedule[b].own[docId] || S.schedule[b];
// a branch is open on a day if its timings, or any doctor's own timings there, include that weekday
const branchWorks = (b, d) => [S.schedule[b], ...Object.values(S.schedule[b].own || {})].some(t => sessionsOnDay(t, d.getDay()).length);
const onLeave = (docId, b, date) => S.leave.some(l => l.doc === docId && l.branch === b && l.date === date);
const isClosed = (b, date) => S.closed.some(c => c.branch === b && c.date === date);
// the times a doctor works at a branch on a day (none on leave, closed days or days off)
function docTimes(b, docId, d) {
  const date = iso(d), tm = timingsFor(b, docId);
  if (isClosed(b, date) || onLeave(docId, b, date)) return [];
  return sessionsOnDay(tm, d.getDay()).flatMap(([s, e]) => { const r = []; for (let t = s; t + tm.slot / 60 <= e + 1e-6; t += tm.slot / 60) r.push(+t.toFixed(4)); return r; });
}
const live = x => x.status !== 'cancelled';
// one patient per doctor per slot; "Any" bookings take whichever doctor is still free
function freeDocsAt(b, d, t) {
  const date = iso(d), here = S.bookings.filter(x => live(x) && x.branch === b && x.date === date && Math.abs(x.t - t) < 1e-6);
  const working = docsAt(b).filter(doc => docTimes(b, doc.id, d).some(x => Math.abs(x - t) < 1e-6));
  const free = working.filter(doc => !here.some(x => x.doc === doc.id));
  const anyTaken = here.filter(x => !x.doc).length;
  // Each "any doctor" booking needs one of the free doctors, but not a particular one, so while free doctors outnumber
  // those bookings every free doctor can still be booked; once they don't, none can.
  return free.length > anyTaken ? free : [];
}

/* ---------- shell: the patient site's liquid dock, four jobs ---------- */
const TABS = [['today', 'Today', 'calendar'], ['schedule', 'Schedule', 'clock'], ['doctors', 'Doctors', 'team'], ['content', 'Content', 'edit']];
const dock = $('[data-dock]'), ind = el('span', { class: 'ind', 'aria-hidden': 'true' });
const tabLinks = TABS.map(([k, label, ic]) => el('a', { href: `#${k}` }, icon(ic), el('span', {}, label)));
dock.replaceChildren(ind, ...tabLinks);
function placeInd(animate) {
  const a = tabLinks.find(x => x.getAttribute('aria-current') === 'page'); if (!a) return;
  ind.style.transition = animate && !reduceMotion ? '' : 'none';
  ind.style.width = a.offsetWidth + 'px'; ind.style.transform = `translateX(${a.offsetLeft - 6}px)`;
}
addEventListener('resize', () => placeInd(false));
const V = { day: 0, branch: 'all', sBranch: BRANCHES[0].id, dBranch: 'all' };
const view = $('#view');
function route(first) {
  const k = (location.hash || '#today').slice(1), tab = TABS.find(t => t[0] === k) ? k : 'today';
  tabLinks.forEach((a, i) => { if (TABS[i][0] === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  ({ today: renderToday, schedule: renderSchedule, doctors: renderDoctors, content: renderContent })[tab]();
  if (tab === 'today' && !first) freshDay();
  placeInd(!first);
  if (!first) { scrollTo(0, 0); view.focus({ preventScroll: true }); }
}
addEventListener('hashchange', () => { closeSheet(); route(false); });
// draws the tab on screen again after a change made from a sheet or a notice
const redraw = () => { const k = (location.hash || '#today').slice(1); ({ today: renderToday, schedule: renderSchedule, doctors: renderDoctors, content: renderContent }[k] || renderToday)(); };

const head = (small, title, extra) => el('header', { class: 'ahead' }, small ? el('div', { class: 'ahead-top' }, el('small', {}, small), extra || '') : '', el('h1', {}, title));
function branchTabs(cur, withAll, onPick) {
  const opts = (withAll ? [['all', 'All branches']] : []).concat(BRANCHES.map(b => [b.id, b.short]));
  return el('div', { class: 'btabs', role: 'group', 'aria-label': 'Branch' }, ...opts.map(([id, label]) => {
    const p = el('button', { class: 'pill', type: 'button', 'aria-pressed': String(id === cur) }, label);
    p.addEventListener('click', () => onPick(id)); return p;
  }));
}
const notice = (text, ic = 'info') => el('p', { class: 'notice' }, icon(ic), el('span', {}, text));

/* ---------- Today: the day sheet ---------- */
// Every switch to a day asks WordPress again (the day's bookings and the month's counts). A day already seen shows at
// once and is redrawn only if the answer differs; one not seen yet shows its rows loading until it arrives.
function freshDay() {
  todayCal.sync(true);
  if (!WP) return;
  const date = iso(addDays(today(), V.day));
  WP.loadDay(date).then(r => { if (r.changed && (location.hash || '#today') === '#today' && iso(addDays(today(), V.day)) === date) renderToday(); });
}

/* ---------- the calendar on Today: every day of the month, the days with bookings in the accent with how many ---------- */
// One card, kept across redraws (so nothing on it is rebuilt by a redraw of the list). Picking a day marks it at once
// and the day's bookings load below; every switch of day or month asks WordPress for the month's counts again, and a
// month already seen shows its last counts meanwhile.
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ymOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const todayCal = (() => {
  let shown = null, branch = null, counts;
  const seen = new Map(); // 'YYYY-MM|branch' -> the counts last read
  const title = el('p', { class: 'cal-month', 'aria-live': 'polite' }), grid = el('div', { class: 'cal-grid' });
  const arrow = (c, label, k) => { const b = el('button', { class: `chipbtn2 icon ${c}`, type: 'button', 'aria-label': label }, icon('chevron')); b.addEventListener('click', () => show(new Date(shown.getFullYear(), shown.getMonth() + k, 1))); return b; };
  const node = el('section', { class: 'card cal-card', 'aria-label': 'Calendar' }, el('div', { class: 'cal-head' }, arrow('prev', 'Previous month', -1), title, arrow('next', 'Next month', 1)), grid);
  const key = () => `${ymOf(shown)}|${branch}`;
  // the demo counts its own bookings
  const local = () => { const ym = ymOf(shown), out = {}; S.bookings.filter(x => live(x) && x.date.startsWith(ym) && (branch === 'all' || x.branch === branch)).forEach(x => { out[x.date] = (out[x.date] || 0) + 1; }); return out; };
  function load() {
    if (!WP) { counts = local(); draw(); return; }
    const k = key(), ym = ymOf(shown);
    WP.month(ym, branch === 'all' ? null : branch).then(c => {
      if (key() !== k) return;
      if (!c) { if (counts === undefined) { counts = {}; draw(); } return; }
      seen.set(k, c);
      if (JSON.stringify(c) !== JSON.stringify(counts)) { counts = c; draw(); }
    });
  }
  function show(month) { shown = month; title.textContent = `${MONTH_NAMES[shown.getMonth()]} ${shown.getFullYear()}`; counts = WP ? seen.get(key()) : undefined; draw(); load(); }
  // the whole month at once: while its counts are on their way every day shows loading (and can still be picked)
  // The month's buttons are built when the month changes; after that each one is updated in place (selection, counts,
  // loading), so the button being tapped keeps its focus and nothing jumps. While the counts are on their way every
  // day shows loading (and can still be picked).
  let built = null, cells = [];
  function draw() {
    const ym = ymOf(shown), loading = counts === undefined, sel = iso(addDays(today(), V.day)), now = iso(today());
    if (built !== ym) {
      built = ym;
      const n = new Date(shown.getFullYear(), shown.getMonth() + 1, 0).getDate();
      cells = [...Array(n)].map((_, i) => {
        const d = new Date(shown.getFullYear(), shown.getMonth(), i + 1), k = iso(d), num = el('small');
        const b = el('button', { type: 'button', class: 'cal-d' }, el('b', {}, String(i + 1)), num);
        b.addEventListener('click', () => { if (k === iso(addDays(today(), V.day))) return; V.day = Math.round((d - today()) / 864e5); renderToday(); freshDay(); });
        return { d, k, b, num };
      });
      grid.replaceChildren(...DOW.map(w => el('span', { class: 'cal-w', 'aria-hidden': 'true' }, w.slice(0, 2))), ...[...Array(shown.getDay())].map(() => el('span')), ...cells.map(c => c.b));
    }
    grid.setAttribute('aria-busy', String(loading));
    cells.forEach(({ d, k, b, num }) => {
      const c = loading ? 0 : counts[k] || 0;
      b.className = ['cal-d', loading && 'skel', c && 'has', k === now && 'today', k === sel && 'on'].filter(Boolean).join(' ');
      b.setAttribute('aria-pressed', String(k === sel));
      b.setAttribute('aria-label', `${longDate(d)}${loading ? '' : c ? `, ${c} booking${c === 1 ? '' : 's'}` : ', no bookings'}`);
      num.textContent = c ? String(c) : ''; num.hidden = !c;
    });
  }
  return {
    node,
    // after a redraw of Today: follows the chosen day's month and branch; with fresh, asks for the month again
    sync(fresh) {
      const sel = addDays(today(), V.day), m = new Date(sel.getFullYear(), sel.getMonth(), 1);
      if (!shown || +m !== +shown || branch !== V.branch) { branch = V.branch; show(m); return; }
      draw(); if (fresh) load();
    }
  };
})();

// a day's bookings still on their way: the same rows, greyed and pulsing, so the list never says "no bookings" first
const skelRows = n => el('div', { class: 'card', 'aria-busy': 'true' }, ...[...Array(n)].map(() => el('div', { class: 'row row-skel', 'aria-hidden': 'true' },
  el('span', { class: 'skel', style: 'width:44px;height:30px' }), el('span', {}, el('span', { class: 'skel', style: 'display:block;width:60%;height:15px' }), el('span', { class: 'skel', style: 'display:block;width:85%;height:12px;margin-top:7px' })), el('span'))));
// the first screen while the admin signs in to WordPress and reads its state
const skelView = () => view.replaceChildren(el('header', { class: 'ahead' }, el('span', { class: 'skel', style: 'display:block;width:40%;height:14px' }), el('span', { class: 'skel', style: 'display:block;width:70%;height:30px;margin-top:8px' })), skelRows(4));
const dayFailed = new Set(); // days whose bookings couldn't be read: they show a retry, not another request on every redraw
function renderToday() {
  const d = addDays(today(), V.day), date = iso(d), ready = !WP || WP.hasDay(date), failed = !ready && dayFailed.has(date);
  if (!ready && !failed) WP.loadDay(date).then(() => {
    if (!WP.hasDay(date)) dayFailed.add(date);
    if ((location.hash || '#today') === '#today' && iso(addDays(today(), V.day)) === date) renderToday();
  });
  // the days either side are fetched ahead, so the arrows open them at once
  if (WP) [-1, 1].forEach(k => { const o = iso(addDays(d, k)); if (!WP.hasDay(o)) WP.loadDay(o); });
  const list = S.bookings.filter(x => x.date === date && (V.branch === 'all' || x.branch === V.branch)).sort((a, b) => a.t - b.t || a.branch.localeCompare(b.branch));
  const n = list.filter(live).length;
  // days are picked on the calendar below; from another day, one tap back to today
  const nav = V.day === 0 ? '' : (() => { const b = el('button', { class: 'chipbtn2', type: 'button' }, 'Today'); b.addEventListener('click', () => { V.day = 0; renderToday(); freshDay(); }); return b; })();
  todayCal.sync();
  const notes = [];
  BRANCHES.filter(b => V.branch === 'all' || b.id === V.branch).forEach(b => {
    if (isClosed(b.id, date)) notes.push(notice(`${b.short} is closed ${dayLabel(d).toLowerCase() === 'today' ? 'today' : 'this day'}.`, 'leave'));
    S.leave.filter(l => l.branch === b.id && l.date === date).forEach(l => {
      const doc = docById(l.doc); if (!doc) return;
      const undo = el('button', { class: 'chipbtn2', type: 'button', 'aria-label': `Take ${shortName(doc)} off leave ${dayLabel(d).toLowerCase()}` }, 'Undo');
      undo.addEventListener('click', async () => { undo.disabled = true; const msg = await removeLeave(l.doc, b.id, date); if (msg) toast(msg); });
      const n = notice(`${shortName(doc)} is on leave at ${b.short}.`, 'leave'); n.append(undo); notes.push(n);
    });
  });
  BRANCHES.filter(b => (V.branch === 'all' || b.id === V.branch) && !branchWorks(b.id, d)).forEach(b => notes.push(notice(`${b.short} doesn’t open on ${DOWL[d.getDay()]}s.`, 'leave')));
  const isToday = V.day === 0, nowT = nowHours();
  const rows = []; let nowPlaced = !isToday;
  list.forEach(x => {
    if (!nowPlaced && x.t > nowT) { rows.push(el('div', { class: 'now', 'aria-label': `Now, ${timeText(nowT)}` }, `NOW ${timeOf(nowT).label}`)); nowPlaced = true; }
    rows.push(bookingRow(x, isToday && x.t < nowT));
  });
  if (!nowPlaced && list.length) rows.push(el('div', { class: 'now' }, `NOW ${timeOf(nowT).label}`));
  const add = el('button', { class: 'btn btn--act bigact pinned', type: 'button' }, icon('plus'), 'Add a booking');
  add.addEventListener('click', () => openAdd(d));
  view.replaceChildren(
    head(longDate(d), ready ? `${dayLabel(d)} · ${n} booking${n === 1 ? '' : 's'}` : dayLabel(d), nav),
    todayCal.node,
    branchTabs(V.branch, true, id => { V.branch = id; renderToday(); }),
    ...notes,
    failed ? (() => { const again = btn('Try again', 'btn--line', () => { dayFailed.delete(date); renderToday(); });
      return el('div', { class: 'card' }, el('p', { class: 'empty' }, el('b', {}, 'Couldn’t load this day'), 'Check the internet, then try again.', el('span', { style: 'display:block;margin-top:12px' }, again))); })()
      : !ready ? skelRows(3) : list.length ? el('div', { class: 'card' }, ...rows) : el('div', { class: 'card' }, el('p', { class: 'empty' }, el('b', {}, 'No bookings'), 'Online and front-desk bookings for this day show up here.')),
    add,
    WP ? '' : el('p', { class: 'note' }, 'Sample bookings for the demo. On the real site these come from patients booking online and from the front desk.'));
}
function bookingRow(x, past) {
  const b = BR(x.branch), doc = x.doc && docById(x.doc), tm = timeOf(x.t);
  const st = x.status === 'arrived' ? el('span', { class: 'st arrived' }, 'Arrived') : x.status === 'cancelled' ? el('span', { class: 'st cancelled' }, 'Cancelled') : el('span', { class: 'go' }, icon('chevron'));
  const sub = [b.short, doc ? rowName(doc) : 'Any doctor', x.problem, x.source === 'desk' ? 'Front desk' : ''].filter(Boolean).join(' · ');
  const r = el('button', { class: 'row' + (past ? ' is-past' : '') + (x.status === 'cancelled' ? ' is-cancelled' : ''), type: 'button' },
    el('span', { class: 't' }, tm.label, el('small', {}, tm.suffix)),
    el('span', {}, el('b', {}, x.name), el('span', { class: 'sub' }, sub)), st);
  r.addEventListener('click', () => openBooking(x));
  return r;
}

/* ---------- sheets ---------- */
const sheet = $('[data-sheet]'), scrim = $('[data-scrim]');
let sheetOpener = null;
// While a sheet is open the page behind it can't be reached (so aria-modal holds); while it is closed the sheet itself
// is out of reach and out of the accessibility tree, though it stays in the page for its slide.
const behind = () => [$('#view'), dock, $('[data-pubbar]')].filter(Boolean);
const setSheetOpen = open => { sheet.inert = !open; sheet.toggleAttribute('aria-hidden', !open); behind().forEach(n => { n.inert = open; }); };
setSheetOpen(false);
function openSheet(title, ...kids) {
  sheetOpener = document.activeElement;
  const x = el('button', { class: 'iconbtn x', type: 'button', 'aria-label': 'Close' }, icon('close'));
  x.addEventListener('click', closeSheet);
  sheet.replaceChildren(el('div', { class: 'grab', 'aria-hidden': 'true' }), x, el('h2', { id: 'sheet-h', tabindex: '-1' }, title), ...kids);
  sheet.scrollTop = 0; sheet.classList.add('is-open'); scrim.classList.add('is-open'); setSheetOpen(true);
  requestAnimationFrame(() => $('#sheet-h').focus({ preventScroll: true }));
}
function closeSheet() {
  if (!sheet.classList.contains('is-open')) return;
  sheet.classList.remove('is-open'); scrim.classList.remove('is-open'); setSheetOpen(false);
  if (sheetOpener && sheetOpener.isConnected) sheetOpener.focus({ preventScroll: true });
}
scrim.addEventListener('click', closeSheet);
addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
const btn = (label, cls, onClick, ic) => { const b = el('button', { class: `btn ${cls}`, type: 'button' }, ...(ic ? [icon(ic)] : []), label); b.addEventListener('click', onClick); return b; };
const telLink = p => el('a', { class: 'btn btn--line', href: `tel:+91${p}` }, icon('phone'), 'Call');
const waLink = (p, text) => el('a', { class: 'btn btn--line', href: `https://wa.me/91${p}?text=${encodeURIComponent(text || '')}`, target: '_blank', rel: 'noopener' }, icon('whatsapp'), 'WhatsApp');
// a destructive step asks once, inline, right where the button was
function confirmInline(host, text, yesLabel, onYes) {
  const keep = btn('Keep', 'btn--line', () => box.replaceWith(host)), yes = btn(yesLabel, 'btn--danger', onYes);
  const box = el('div', { class: 'confirm', role: 'alert' }, el('p', {}, text), el('div', { class: 'two' }, keep, yes));
  host.replaceWith(box); yes.focus();
}

function openBooking(x) {
  const b = BR(x.branch), doc = x.doc && docById(x.doc), d = fromIso(x.date);
  const facts = el('dl', { class: 'facts' }, ...[['Branch', b.name], ['Doctor', doc ? shortName(doc) : 'Any doctor'], ['Problem', x.problem || 'Not said'], ['Note', x.note || 'Nothing written'], ['Mobile', `+91 ${x.phone.slice(0, 5)} ${x.phone.slice(5)}`], ['Booked', x.source === 'desk' ? 'At the front desk' : 'Online']]
    .map(([k, v]) => el('div', {}, el('dt', {}, k), el('dd', {}, v))));
  const actions = [];
  // Marking someone arrived (or undoing it) only changes the front desk's view, so it shows at once and is put back
  // if WordPress can't save it. Cancelling and restoring change a patient's appointment (a restored slot may have been
  // taken), so those are saved first, with the button saying so, and the sheet closes once WordPress has agreed.
  const setStatus = async (status, msg, button) => {
    if (!WP) { x.status = status; save(); closeSheet(); renderToday(); if (msg) toast(msg); return; }
    if (status === 'arrived' || (status === 'booked' && x.status === 'arrived')) {
      const was = x.status; x.status = status; closeSheet(); renderToday(); if (msg) toast(msg); // arriving doesn't change the counts
      if (!await WP.setStatus(x, status)) { x.status = was; renderToday(); toast(`Couldn't save that for ${x.name}. It's back as it was.`); }
      return;
    }
    const label = button && button.textContent;
    if (button) { button.disabled = true; button.textContent = 'Saving…'; }
    const ok = await WP.setStatus(x, status);
    if (button) { button.disabled = false; button.textContent = label; }
    if (!ok) return;
    closeSheet(); renderToday(); todayCal.sync(true); if (msg) toast(msg); // cancelling or restoring changes the day's count
  };
  if (x.status === 'booked') actions.push(btn('Mark as arrived', 'btn--act btn--block', () => setStatus('arrived', `${x.name} marked as arrived`), 'check'));
  if (x.status === 'arrived') actions.push(btn('Undo arrived', 'btn--line btn--block', () => setStatus('booked')));
  if (x.status !== 'cancelled') {
    const c = btn('Cancel this booking', 'btn--danger btn--block', () => confirmInline(c, `Cancel ${x.name}'s ${timeText(x.t)} booking? Let them know by call or WhatsApp.`, 'Yes, cancel', e => setStatus('cancelled', 'Booking cancelled', e.currentTarget)));
    actions.push(c);
  } else actions.push(btn('Restore this booking', 'btn--line btn--block', e => setStatus('booked', 'Booking restored', e.currentTarget)));
  openSheet(x.name, el('p', { class: 'lead2' }, `${dayLabel(d)}, ${timeText(x.t)}${x.status === 'cancelled' ? ' · cancelled' : ''}`), facts,
    el('div', { class: 'two' }, telLink(x.phone), waLink(x.phone, `Hello ${x.name}, this is J.P. Nagar Physio about your visit on ${dayLabel(d)} at ${timeText(x.t)}.`)), ...actions);
}

/* ---------- add a walk-in or phone booking ---------- */
function openAdd(startDay) {
  const A = { b: V.branch !== 'all' ? V.branch : BRANCHES[0].id, doc: null, day: startDay < today() ? today() : startDay, t: null, problem: '' };
  const nm = el('input', { id: 'a-nm', autocomplete: 'off', placeholder: 'e.g. Ramesh K.' });
  const ph = el('input', { id: 'a-ph', type: 'tel', inputmode: 'numeric', placeholder: 'e.g. 98765 43210', maxlength: '11' });
  ph.addEventListener('input', () => { const v = ph.value.replace(/\D/g, '').slice(0, 10); ph.value = v.length > 5 ? v.slice(0, 5) + ' ' + v.slice(5) : v; check(); });
  nm.addEventListener('input', check);
  const brBox = el('div', { class: 'picks' }), docBox = el('div', { class: 'picks' }), dayBox = el('div', { class: 'days' }), slotBox = el('div', { class: 'slots' }), probBox = el('div', { class: 'picks' });
  const saveBtn = btn('Save booking', 'btn--act btn--block', async () => {
    const phone = ph.value.replace(/\D/g, '');
    if (WP) {
      saveBtn.disabled = true;
      const ok = await WP.addBooking({ name: nm.value.trim(), phone, branch: A.b, doc: A.doc, date: iso(A.day), t: A.t, problem: A.problem });
      saveBtn.disabled = false;
      if (!ok) { diary = null; paint(); return; }
    } else {
      let doc = A.doc; if (!doc) { const free = freeDocsAt(A.b, A.day, A.t); doc = null; if (!free.length) return; }
      S.bookings.push({ id: `d${Date.now()}`, name: nm.value.trim(), phone, branch: A.b, doc, date: iso(A.day), t: A.t, problem: A.problem, status: 'booked', source: 'desk' });
      save();
    }
    closeSheet(); V.day = Math.round((A.day - today()) / 864e5); V.branch = 'all'; location.hash === '#today' ? (renderToday(), todayCal.sync(true)) : (location.hash = '#today');
    toast(`Booked: ${nm.value.trim()}, ${dayLabel(A.day)} ${timeText(A.t)} at ${BR(A.b).short}`);
  });
  const field = (label, ...kids) => el('div', { class: 'field' }, el('label', {}, label), ...kids);
  function picks(box, opts, cur, on) {
    box.replaceChildren(...opts.map(([v, label, disabled]) => {
      const p = el('button', { class: 'pill', type: 'button', 'aria-pressed': String(v === cur) }, label);
      if (disabled) p.disabled = true;
      p.addEventListener('click', () => on(v)); return p;
    }));
  }
  function paint() {
    picks(brBox, BRANCHES.map(b => [b.id, b.short]), A.b, v => { A.b = v; A.doc = null; A.t = null; paint(); });
    const docs = docsAt(A.b).map(doc => [doc.id, shortName(doc) + (onLeave(doc.id, A.b, iso(A.day)) ? ' (on leave)' : ''), onLeave(doc.id, A.b, iso(A.day))]);
    picks(docBox, [[null, 'Any doctor'], ...docs], A.doc, v => { A.doc = v; A.t = null; paint(); });
    dayBox.replaceChildren(...[...Array(7)].map((_, i) => {
      const d = addDays(today(), i), off = isClosed(A.b, iso(d)) || !(A.doc ? [A.doc] : docsAt(A.b).map(x => x.id)).some(id => sessionsOnDay(timingsFor(A.b, id), d.getDay()).length);
      const b = el('button', { class: 'day' + (iso(d) === iso(A.day) ? ' is-on' : '') + (off ? ' is-off' : ''), type: 'button', 'aria-pressed': String(iso(d) === iso(A.day)) }, el('small', {}, i === 0 ? 'Today' : DOW[d.getDay()]), el('b', {}, String(d.getDate())));
      if (off) b.disabled = true;
      b.addEventListener('click', () => { A.day = d; A.t = null; paint(); }); return b;
    }));
    // on WordPress the times come from the same diary patients book from (fetched once per branch and day)
    const key = `${A.b}|${iso(A.day)}`;
    if (WP && (!diary || diary.key !== key)) { diary = { key, times: null }; WP.freeTimes(A.b, iso(A.day)).then(m => { if (diary && diary.key === key) { diary.times = m; paint(); } }); }
    const isTodayPick = iso(A.day) === iso(today());
    const times = WP ? [...((diary && diary.times) || new Map()).entries()].filter(([, docs]) => !A.doc || docs.includes(A.doc)).map(([m]) => m / 60)
      : [...new Set((A.doc ? [A.doc] : docsAt(A.b).map(x => x.id)).flatMap(id => docTimes(A.b, id, A.day)))].sort((a, b) => a - b).filter(t => !isTodayPick || t > nowHours());
    slotBox.replaceChildren(...(times.length ? times.map(t => {
      const free = WP ? true : A.doc ? !S.bookings.some(x => live(x) && x.branch === A.b && x.date === iso(A.day) && Math.abs(x.t - t) < 1e-6 && x.doc === A.doc) && freeDocsAt(A.b, A.day, t).some(d => d.id === A.doc)
        : freeDocsAt(A.b, A.day, t).length > 0;
      const s = el('button', { class: 'slot' + (A.t === t ? ' is-on' : ''), type: 'button', 'aria-pressed': String(A.t === t) }, timeText(t));
      if (!free) s.disabled = true;
      s.addEventListener('click', () => { A.t = t; paint(); }); return s;
    }) : [el('p', { class: 'empty', style: 'grid-column:1/-1' }, WP && !(diary && diary.times) ? 'Loading times…' : 'No free times this day. Try another day or doctor.')]));
    picks(probBox, ['Lower back', 'Neck', 'Knee', 'Shoulder', 'After surgery', 'Other'].map(p => [p, p]), A.problem, v => { A.problem = A.problem === v ? '' : v; paint(); });
    check();
  }
  let diary = null;
  function check() { saveBtn.disabled = !(nm.value.trim().length > 1 && /^[6-9]\d{9}$/.test(ph.value.replace(/\D/g, '')) && A.t != null); }
  openSheet('Add a booking', el('p', { class: 'lead2' }, 'For someone who calls or walks in.'),
    field('Name', el('div', { class: 'input' }, nm)), field('Mobile number', el('div', { class: 'input' }, el('span', {}, '+91'), ph)),
    field('Branch', brBox), field('Doctor', docBox), field('Day', dayBox), field('Time', slotBox), field('Problem (optional)', probBox), saveBtn);
  paint();
}

/* ---------- Schedule: timings for everyone, each doctor's own, leave, closed days ---------- */
// Timings are a week: each weekday's own sessions in hours ([[9, 13], [16, 20]]), plus the slot length. Older timings
// (one set of sessions on chosen days) read as those sessions on each of those days.
const ORDER = [1, 2, 3, 4, 5, 6, 0];
function weekOf(tm) {
  if (tm.week) return Object.fromEntries(ORDER.map(n => [n, (tm.week[n] || []).map(s => [...s])]));
  return Object.fromEntries(ORDER.map(n => [n, (tm.days || []).includes(n) ? (tm.sessions || []).filter(Boolean).map(s => [...s]) : []]));
}
const sessionsOnDay = (tm, n) => weekOf(tm)[n] || [];
const hoursLine = list => list.map(([s, e]) => `${timeText(s).replace(':00', '')}–${timeText(e).replace(':00', '')}`).join(', ');

/* The week, drawn: one row per day with its hours as blocks on a 6 am – 10 pm track. Drag a block to move it, drag
   its ends to change the hours, tap an empty part of a row to add hours there, tap the day to open or close it.
   Everything snaps to half hours. Keyboard: a block moves with the arrows and its end with Shift+arrows; Delete
   removes it; + adds hours after it. */
const TRACK = [6, 22], SPAN = TRACK[1] - TRACK[0], STEP = .5, MIN_LEN = 1, MAX_SESS = 3;
const pct = h => `${(h - TRACK[0]) / SPAN * 100}%`;
const snap = h => Math.round(h / STEP) * STEP;
const shortH = h => timeOf(h).label.replace(':00', '');
function timingsForm(tm, onChange) {
  const T = { week: weekOf(tm), slot: tm.slot };
  const kept = {}; // a day that is closed and reopened gets its hours back
  let sel = null, edited = null;
  const rows = {};
  const copyAll = el('button', { class: 'wk-copy', type: 'button', hidden: '' });
  copyAll.addEventListener('click', () => {
    ORDER.forEach(n => { if (n !== edited && T.week[n].length) { T.week[n] = T.week[edited].map(s => [...s]); paint(n); } });
    copyAll.hidden = true; changed(null);
  });
  function changed(n) {
    if (n != null) { edited = n; copyAll.hidden = !T.week[n].length || ORDER.filter(x => T.week[x].length).length < 2; copyAll.textContent = `Use ${DOWL[n]}’s hours on every open day`; }
    onChange(T);
  }
  const hourAt = (track, x) => { const r = track.getBoundingClientRect(); return TRACK[0] + Math.min(1, Math.max(0, (x - r.left) / r.width)) * SPAN; };
  // the free stretch around an hour on a day (between the blocks either side), or null if the hour is inside a block
  function gapAt(n, h) {
    let from = TRACK[0], to = TRACK[1];
    for (const [s, e] of T.week[n]) { if (h >= s && h < e) return null; if (e <= h) from = Math.max(from, e); if (s > h) to = Math.min(to, s); }
    return [from, to];
  }
  function add(n, h) {
    if (T.week[n].length >= MAX_SESS) { toast('Up to three sessions a day'); return; }
    const g = gapAt(n, h); if (!g || g[1] - g[0] < MIN_LEN) return;
    let s = snap(h - 1), e = s + 2; if (s < g[0]) { s = g[0]; e = s + 2; } if (e > g[1]) { e = g[1]; s = Math.max(g[0], e - 2); }
    T.week[n].push([s, e]); T.week[n].sort((a, b) => a[0] - b[0]);
    sel = { n, i: T.week[n].findIndex(x => x[0] === s) }; paint(n); changed(n); focusSel();
  }
  function toggleDay(n) {
    if (T.week[n].length) { kept[n] = T.week[n]; T.week[n] = []; }
    else T.week[n] = kept[n] || weekOf(tm)[n].length && weekOf(tm)[n] || [[9, 13], [16, 20]];
    sel = null; paint(n); changed(n);
  }
  function remove(n, i) { T.week[n].splice(i, 1); sel = null; paint(n); changed(n); rows[n].day.focus(); }
  // a block's new hours, kept inside the day and clear of its neighbours, at least an hour long
  function place(n, i, s, e, mode) {
    const list = T.week[n], lo = i ? list[i - 1][1] : TRACK[0], hi = i < list.length - 1 ? list[i + 1][0] : TRACK[1];
    if (mode === 'move') { const len = e - s; s = Math.min(Math.max(lo, s), hi - len); e = s + len; }
    if (mode === 'start') s = Math.min(Math.max(lo, s), e - MIN_LEN);
    if (mode === 'end') e = Math.max(Math.min(hi, e), s + MIN_LEN);
    list[i] = [snap(s), snap(e)];
  }
  const focusSel = () => { if (sel) { const b = rows[sel.n].track.querySelectorAll('.wk-block')[sel.i]; if (b) b.focus({ preventScroll: true }); } };
  function blockLabel(n, [s, e]) { return `${DOWL[n]}, ${timeText(s)} to ${timeText(e)}. Drag or use the arrows to move; Shift with arrows changes the end; Delete removes.`; }
  function setBlock(b, n, s) {
    b.style.left = pct(s[0]); b.style.width = `${(s[1] - s[0]) / SPAN * 100}%`;
    // the hours as "9–1"; a block too short for that shows only when it starts (the full hours are in its label)
    const full = `${shortH(s[0])}–${shortH(s[1])}`, room = (s[1] - s[0]) / SPAN * (rows[n].track.clientWidth || 300);
    b.firstChild.textContent = room >= full.length * 7.5 + 20 ? full : shortH(s[0]); b.setAttribute('aria-label', blockLabel(n, s));
  }
  function paint(n) {
    const { day, track } = rows[n], list = T.week[n], open = list.length > 0;
    day.setAttribute('aria-pressed', String(open)); day.setAttribute('aria-label', `${DOWL[n]}: ${open ? hoursLine(list) : 'closed'}. Tap to ${open ? 'close' : 'open'} this day`);
    track.classList.toggle('is-closed', !open);
    track.replaceChildren(...list.map((s, i) => {
      const b = el('button', { class: 'wk-block' + (sel && sel.n === n && sel.i === i ? ' is-sel' : ''), type: 'button' }, el('span', {}), el('i', { class: 'wk-grip s', 'data-end': 'start', 'aria-hidden': 'true' }), el('i', { class: 'wk-grip e', 'data-end': 'end', 'aria-hidden': 'true' }));
      setBlock(b, n, s);
      b.addEventListener('pointerdown', e => drag(e, n, i, b));
      b.addEventListener('keydown', e => key(e, n, i));
      return b;
    }), ...(sel && sel.n === n && list[sel.i] ? [(() => {
      const x = el('button', { class: 'wk-x', type: 'button', 'aria-label': `Remove ${hoursLine([list[sel.i]])} on ${DOWL[n]}`, style: `left:${pct(list[sel.i][1])}` }, icon('close'));
      x.addEventListener('click', () => remove(n, sel.i)); return x;
    })()] : []));
  }
  function drag(e, n, i, b) {
    e.preventDefault(); b.setPointerCapture(e.pointerId);
    const mode = e.target.dataset.end || 'move', track = rows[n].track, w = track.getBoundingClientRect().width, x0 = e.clientX, orig = [...T.week[n][i]];
    let moved = false;
    b.classList.add('is-drag');
    const onMove = ev => {
      const dh = (ev.clientX - x0) / w * SPAN; if (Math.abs(ev.clientX - x0) > 4) moved = true; if (!moved) return;
      place(n, i, orig[0] + (mode !== 'end' ? dh : 0), orig[1] + (mode !== 'start' ? dh : 0), mode);
      setBlock(b, n, T.week[n][i]);
    };
    const onUp = () => {
      b.removeEventListener('pointermove', onMove); b.removeEventListener('pointerup', onUp); b.removeEventListener('pointercancel', onUp);
      b.classList.remove('is-drag');
      // a tap selects the block (and shows its remove button); a drag saves the new hours
      sel = moved ? sel : (sel && sel.n === n && sel.i === i ? null : { n, i });
      paint(n); if (moved) changed(n); focusSel();
    };
    b.addEventListener('pointermove', onMove); b.addEventListener('pointerup', onUp); b.addEventListener('pointercancel', onUp);
  }
  function key(e, n, i) {
    const s = T.week[n][i], d = e.key === 'ArrowRight' ? STEP : e.key === 'ArrowLeft' ? -STEP : 0;
    if (d) { e.preventDefault(); e.shiftKey ? place(n, i, s[0], s[1] + d, 'end') : place(n, i, s[0] + d, s[1] + d, 'move'); sel = { n, i }; paint(n); changed(n); focusSel(); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); remove(n, i); }
    else if (e.key === '+') { e.preventDefault(); add(n, s[1] + 1.5); }
  }
  const grid = el('div', { class: 'hrs-week', role: 'group', 'aria-label': 'Hours on each day' },
    el('div', { class: 'wk-marks', 'aria-hidden': 'true' }, el('span'), el('div', {}, ...[9, 12, 15, 18].map(h => el('i', { style: `left:${pct(h)}` }, `${h % 12 || 12} ${h < 12 ? 'am' : 'pm'}`)))),
    ...ORDER.map(n => {
      const day = el('button', { class: 'wk-day', type: 'button' }, DOW[n]), track = el('div', { class: 'wk-track' });
      day.addEventListener('click', () => toggleDay(n));
      // tapping the empty part of a row adds two hours there
      track.addEventListener('click', e => { if (e.target === track && T.week[n].length) add(n, hourAt(track, e.clientX)); else if (e.target === track) toggleDay(n); });
      rows[n] = { day, track };
      return el('div', { class: 'wk-row' }, day, track);
    }));
  ORDER.forEach(paint);
  const slen = el('div', { class: 'slen', role: 'group', 'aria-label': 'Slot length' }, ...[15, 20, 30, 45, 60].map(m => {
    const p = el('button', { class: 'pill', type: 'button', 'aria-pressed': String(m === T.slot) }, `${m} min`);
    p.addEventListener('click', () => { T.slot = m; $$('.pill', slen).forEach(x => x.setAttribute('aria-pressed', String(x === p))); onChange(T); }); return p;
  }));
  onChange(T);
  return el('div', {}, el('h3', {}, 'Hours'), grid, copyAll, el('p', { class: 'wk-hint' }, 'Drag to change · tap a row to add hours · tap a day to close it'), el('h3', {}, 'Each appointment'), slen);
}
// the form's week as saved timings: the week, plus the days worked and the most common day's hours
const pack = T => {
  const week = Object.fromEntries(ORDER.filter(n => T.week[n].length).map(n => [n, T.week[n].map(s => [...s])]));
  const counts = {}; Object.values(week).forEach(l => { const k = JSON.stringify(l); counts[k] = (counts[k] || 0) + 1; });
  const common = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return { days: Object.keys(week).map(Number).sort((a, b) => a - b), sessions: common ? JSON.parse(common[0]) : [], week, slot: T.slot };
};
// one line: "Mon–Sat · 9 am–1 pm, 4 pm–8 pm · 30 min", or the days grouped when their hours differ
const describe = tm => {
  const w = weekOf(tm), groups = [];
  ORDER.forEach(n => {
    const k = JSON.stringify(w[n]), g = groups[groups.length - 1];
    if (!w[n].length) return;
    if (g && g.k === k && ORDER.indexOf(g.to) === ORDER.indexOf(n) - 1) g.to = n; else groups.push({ k, from: n, to: n, s: w[n] });
  });
  const text = groups.map(g => `${g.from === g.to ? DOW[g.from] : `${DOW[g.from]}–${DOW[g.to]}`} ${hoursLine(g.s)}`).join('; ');
  return `${text || 'Closed every day'} · ${tm.slot} min`;
};
// "Any doctor" bookings a day's slots can no longer hold once a doctor is gone (on leave or removed): one patient per
// doctor per slot, so where fewer free doctors are left at a time than "any" bookings, the later bookings can't stay
function anySurplus(b, date) {
  const d = fromIso(date), day = S.bookings.filter(x => live(x) && x.branch === b && x.date === date), out = [];
  [...new Set(day.filter(x => !x.doc).map(x => x.t))].forEach(t => {
    const here = day.filter(x => Math.abs(x.t - t) < 1e-6);
    const working = docsAt(b).filter(doc => !onLeave(doc.id, b, date) && docTimes(b, doc.id, d).some(y => Math.abs(y - t) < 1e-6));
    const free = working.filter(doc => !here.some(x => x.doc === doc.id)).length;
    out.push(...here.filter(x => !x.doc).slice(free));
  });
  return out;
}
// the doctor goes on leave: their bookings at this branch that day are cancelled, and the patients are listed to call
async function applyLeave(docId, b, date) {
  if (onLeave(docId, b, date)) return;
  let hit; const warn = [];
  if (WP) {
    const r = await WP.leave(true, docId, b, date); if (!r) return;
    hit = r.cancelled; redraw();
    if (r.failed.length) warn.push(`${r.failed.length} booking${r.failed.length === 1 ? '' : 's'} couldn’t be cancelled. Check the Today list.`);
    if (!r.current) warn.push('The booking list couldn’t be refreshed: reload the page to see it.');
  } else {
    hit = S.bookings.filter(x => x.doc === docId && x.branch === b && x.date === date && x.status === 'booked');
    hit.forEach(x => { x.status = 'cancelled'; x.reason = 'leave'; });
    const entry = { doc: docId, branch: b, date, cancelled: hit.map(x => x.id) };
    S.leave.push(entry);
    // with one doctor fewer, "any doctor" bookings beyond the doctors still free at a time are cancelled too
    const extra = anySurplus(b, date);
    extra.forEach(x => { x.status = 'cancelled'; x.reason = 'leave'; });
    hit = hit.concat(extra); entry.cancelled = hit.map(x => x.id);
    save(); redraw();
  }
  const doc = docById(docId), d = fromIso(date);
  if (!hit.length) { toast([`${shortName(doc)} is on leave ${dayLabel(d).toLowerCase()}. No bookings to move.`, ...warn].join(' ')); return; }
  showAffected(`${shortName(doc)} is on leave`, `${dayLabel(d)} at ${BR(b).short}. These ${hit.length} booking${hit.length === 1 ? ' was' : 's were'} cancelled. Let them know:`, hit,
    ...warn.map(w => notice(w)),
    btn('Undo leave', 'btn--line btn--block', async () => { const msg = await removeLeave(docId, b, date); closeSheet(); toast(msg); }));
}
// undoing leave or a closed day puts back the bookings it cancelled, unless the slot has gone or the day is still off
const restoredText = (n, what) => n ? `${what}. ${n} booking${n === 1 ? '' : 's'} couldn’t be put back: the time is taken or still off.` : `${what}. Bookings restored.`;
async function removeLeave(docId, b, date) {
  if (WP) {
    const r = await WP.leave(false, docId, b, date); redraw();
    if (!r) return '';
    return restoredText(r.notRestored.length, 'Leave undone') + (r.current ? '' : ' The booking list couldn’t be refreshed: reload the page to see it.');
  }
  const l = S.leave.find(x => x.doc === docId && x.branch === b && x.date === date); if (!l) return '';
  // the doctor is back first; then each booking returns only if it still fits (an "any doctor" one needs a free doctor
  // at its time, and others may have been booked since). Those that don't stay cancelled, to be called.
  S.leave = S.leave.filter(x => x !== l);
  const back = [], kept = [];
  S.bookings.filter(x => l.cancelled.includes(x.id) && x.status === 'cancelled').forEach(x => {
    x.status = 'booked';
    const at = y => Math.abs(y.t - x.t) < 1e-6;
    // a doctor's own booking: that doctor still works then (at this branch, in their hours) and nobody else has the time;
    // an "any doctor" one: with it back, that time holds no more "any doctor" bookings than it has free doctors
    // and either way the time must still hold every "any doctor" booking (a doctor's own patient takes that doctor)
    const fits = (x.doc
      ? docsAt(b).some(d => d.id === x.doc) && docTimes(b, x.doc, fromIso(date)).some(t => Math.abs(t - x.t) < 1e-6) && !S.bookings.some(y => y !== x && live(y) && y.doc === x.doc && y.branch === x.branch && y.date === x.date && at(y))
      : true) && !anySurplus(b, date).some(at);
    if (fits) { delete x.reason; back.push(x); } else { x.status = 'cancelled'; kept.push(x); }
  });
  save(); redraw();
  return restoredText(kept.length, 'Leave undone');
}
function showAffected(title, lead, list, ...extra) {
  openSheet(title, el('p', { class: 'lead2' }, lead), el('div', { class: 'affected' }, ...list.map(x => el('div', {},
    el('span', {}, el('b', {}, x.name), el('small', {}, timeText(x.t))),
    el('a', { class: 'chipbtn2 icon', href: `tel:+91${x.phone}`, 'aria-label': `Call ${x.name}` }, icon('phone')),
    el('a', { class: 'chipbtn2 icon', href: `https://wa.me/91${x.phone}?text=${encodeURIComponent(`Hello ${x.name}, your physiotherapy visit at ${timeText(x.t)} needs to be moved. Please reply and we will find you a new time.`)}`, target: '_blank', rel: 'noopener', 'aria-label': `WhatsApp ${x.name}` }, icon('whatsapp'))))), ...extra);
}
function renderSchedule() {
  const b = V.sBranch, sc = S.schedule[b], docs = docsAt(b), date = iso(today()), owners = docs.filter(d => sc.own[d.id]);
  let draft = null;
  const pub = btn(docs.length === 1 ? 'Publish to the doctor' : docs.length === 2 ? 'Publish to both doctors' : `Publish to all ${docs.length} doctors`, 'btn--act btn--block', async () => {
    if (WP) { pub.disabled = true; const ok = await WP.branchTimings(b, pack(draft)); pub.disabled = false; if (!ok) return; renderSchedule(); }
    else {
      Object.assign(sc, pack(draft)); sc.own = {}; save(); renderSchedule();
      if (!await writeSnapshot().catch(() => false)) { toast('Saved here, but the website couldn’t be updated. Try again.'); return; }
    }
    toast(`New timings published for every doctor at ${BR(b).short}`);
  });
  const everyone = el('section', { class: 'card', 'aria-labelledby': 'h-every' },
    el('div', { class: 'card-h' }, el('h2', { id: 'h-every' }, 'Everyone’s timings'), el('p', {}, BR(b).short)),
    el('div', { class: 'tform' }, timingsForm(sc, T => { draft = T; }), pub,
      owners.length ? el('p', { class: 'note', style: 'margin:10px 0 0' }, `${owners.map(shortName).join(' and ')} ${owners.length === 1 ? 'has' : 'have'} different timings now; publishing gives everyone these.`) : ''));
  const docRows = docs.length ? docs.map(doc => {
    const leave = onLeave(doc.id, b, date), own = sc.own[doc.id];
    const lv = el('button', { class: 'chipbtn2 ' + (leave ? 'on-leave' : 'leave'), type: 'button' }, ...(leave ? ['On leave', icon('close')] : ['Leave today']));
    lv.setAttribute('aria-label', leave ? `${shortName(doc)} is on leave today. Tap to undo` : `Put ${shortName(doc)} on leave today`);
    lv.addEventListener('click', async () => { if (leave) { const msg = await removeLeave(doc.id, b, date); if (msg) toast(msg); } else applyLeave(doc.id, b, date); });
    const ed = el('button', { class: 'chipbtn2', type: 'button', 'aria-label': `Hours and leave for ${shortName(doc)}` }, icon('clock'), 'Hours & leave');
    ed.addEventListener('click', () => openDocTimings(doc, b));
    // leave coming up shows on the row; it is taken off in "Hours & leave"
    const ahead = S.leave.filter(l => l.doc === doc.id && l.branch === b && l.date > date).map(l => l.date).sort().slice(0, 2).map(x => dayLabel(fromIso(x)).replace(/^Tomorrow$/, 'tomorrow'));
    const subText = [leave ? 'On leave today' : own ? `Own timings · ${describe(own)}` : 'Same as everyone', ahead.length ? `Leave ${ahead.join(', ')}` : ''].filter(Boolean).join(' · ');
    return el('div', { class: 'drow' }, avatar(doc), el('span', {}, el('b', {}, shortName(doc)), el('span', { class: 'sub' + (ahead.length ? ' has-leave' : '') }, subText)), el('span', { class: 'acts' }, lv, ed));
  }) : [el('p', { class: 'empty' }, el('b', {}, 'No doctors here yet'), 'Add doctors to this branch in the Doctors tab.')];
  const upcomingClosed = S.closed.filter(c => c.branch === b && c.date >= date).sort((x, y) => x.date.localeCompare(y.date));
  const closeBtn = btn('Close the branch for a day', 'btn--line btn--block', () => openCloseDay(b));
  view.replaceChildren(
    head('', 'Timings & leave'),
    branchTabs(b, false, id => { V.sBranch = id; renderSchedule(); }),
    everyone,
    el('section', { class: 'card', 'aria-labelledby': 'h-docs' }, el('div', { class: 'card-h' }, el('h2', { id: 'h-docs' }, 'Doctors'), el('p', {}, 'Leave cancels their bookings for the day')), ...docRows),
    el('section', { class: 'card', 'aria-labelledby': 'h-closed' }, el('div', { class: 'card-h' }, el('h2', { id: 'h-closed' }, 'Closed days'), el('p', {}, 'Holidays and other days off')),
      ...upcomingClosed.map(c => { const r = el('div', { class: 'drow' }, el('span', { class: 'av' }, icon('leave')), el('span', {}, el('b', {}, longDate(fromIso(c.date))), el('span', { class: 'sub' }, c.reason || 'Closed')),
        (() => { const u = el('button', { class: 'chipbtn2', type: 'button' }, 'Reopen'); u.addEventListener('click', () => { reopenDay(c); }); return u; })()); return r; }),
      el('div', { class: 'tform' }, closeBtn)),
    el('p', { class: 'note' }, 'Which doctors work at which branch is a sample until the clinic confirms it.'));
}
function openDocTimings(doc, b) {
  const sc = S.schedule[b]; let mode = sc.own[doc.id] ? 'own' : 'same', draft = null;
  const formHost = el('div', {});
  const seg = el('div', { class: 'picks' }), paintSeg = () => {
    seg.replaceChildren(...[['same', 'Same as everyone'], ['own', 'Different timings']].map(([v, label]) => {
      const p = el('button', { class: 'pill', type: 'button', 'aria-pressed': String(v === mode) }, label);
      p.addEventListener('click', () => { mode = v; paintSeg(); }); return p;
    }));
    formHost.replaceChildren(mode === 'own' ? timingsForm(sc.own[doc.id] || sc, T => { draft = T; }) : el('p', { class: 'lead2', style: 'margin-top:12px' }, describe(sc)));
  };
  paintSeg();
  const saveT = btn('Save timings', 'btn--act btn--block', async () => {
    if (WP) { if (!await WP.ownTimings(b, doc.id, mode === 'own' && draft ? pack(draft) : null)) return; }
    else { if (mode === 'own' && draft) sc.own[doc.id] = pack(draft); else delete sc.own[doc.id]; save(); }
    renderSchedule(); closeSheet(); toast(`Timings saved for ${shortName(doc)}`);
  });
  // leave on a day: tap a day to put them on leave, or tap a day already on leave (marked) to take it off
  let pick = null;
  const dayBox = el('div', { class: 'days' }), leaveBtn = btn('Apply leave', 'btn--danger btn--block', async () => {
    if (!pick) return;
    const date = iso(pick);
    if (onLeave(doc.id, b, date)) { leaveBtn.disabled = true; const msg = await removeLeave(doc.id, b, date); closeSheet(); if (msg) toast(msg); }
    else { closeSheet(); applyLeave(doc.id, b, date); }
  });
  const paintDays = () => dayBox.replaceChildren(...[...Array(14)].map((_, i) => {
    const d = addDays(today(), i), off = !sessionsOnDay(timingsFor(b, doc.id), d.getDay()).length, on = onLeave(doc.id, b, iso(d)), picked = !!pick && iso(pick) === iso(d);
    const x = el('button', { class: 'day' + (picked ? ' is-on' : '') + (off && !on ? ' is-off' : '') + (on ? ' is-leave' : ''), type: 'button', 'aria-pressed': String(picked),
      'aria-label': `${longDate(d)}${on ? ', on leave. Tap to take the leave off' : off ? ', not working' : ''}` },
      el('small', {}, i === 0 ? 'Today' : DOW[d.getDay()]), el('b', {}, String(d.getDate())), on ? el('small', {}, 'Leave') : '');
    if (off && !on) x.disabled = true;
    x.addEventListener('click', () => {
      pick = d; leaveBtn.disabled = false;
      leaveBtn.className = `btn ${on ? 'btn--line' : 'btn--danger'} btn--block`;
      leaveBtn.textContent = on ? `Take off leave · ${dayLabel(d)}` : `Apply leave · ${dayLabel(d)}`;
      paintDays();
    }); return x;
  }));
  leaveBtn.disabled = true; paintDays();
  openSheet(shortName(doc), el('p', { class: 'lead2' }, `At ${BR(b).name}`), el('div', { class: 'field' }, el('label', {}, 'Timings'), seg), formHost, saveT,
    el('div', { class: 'field', style: 'margin-top:26px' }, el('label', {}, 'Leave'), el('p', { class: 'note', style: 'margin:0 0 10px' }, 'Tap a day for leave. Days marked Leave can be tapped to take it off.'), dayBox), leaveBtn);
}
function openCloseDay(b) {
  let pick = null; const rs = el('input', { placeholder: 'e.g. Diwali', maxlength: '40' });
  const dayBox = el('div', { class: 'days' }), go = btn('Close the branch', 'btn--danger btn--block', async () => {
    if (!pick) return;
    const date = iso(pick); let hit; const warn = [];
    if (WP) {
      go.disabled = true; const r = await WP.closed(true, b, date, rs.value.trim()); go.disabled = false; if (!r) return;
      hit = r.cancelled; renderSchedule(); closeSheet();
      if (r.failed.length) warn.push(`${r.failed.length} booking${r.failed.length === 1 ? '' : 's'} couldn’t be cancelled. Check the Today list.`);
      if (!r.current) warn.push('The booking list couldn’t be refreshed: reload the page to see it.');
    } else {
      hit = S.bookings.filter(x => x.branch === b && x.date === date && x.status === 'booked');
      hit.forEach(x => { x.status = 'cancelled'; x.reason = 'closed'; });
      S.closed.push({ branch: b, date, reason: rs.value.trim(), cancelled: hit.map(x => x.id) }); save(); renderSchedule(); closeSheet();
    }
    if (hit.length) showAffected(`${BR(b).short} closed ${dayLabel(pick).toLowerCase()}`, `These ${hit.length} booking${hit.length === 1 ? ' was' : 's were'} cancelled. Let them know:`, hit, ...warn.map(w => notice(w)));
    else toast([`${BR(b).short} closed on ${longDate(pick)}`, ...warn].join(' '));
  });
  go.disabled = true;
  const paint = () => dayBox.replaceChildren(...[...Array(30)].map((_, i) => {
    const d = addDays(today(), i), off = !branchWorks(b, d) || isClosed(b, iso(d));
    const x = el('button', { class: 'day' + (pick && iso(pick) === iso(d) ? ' is-on' : '') + (off ? ' is-off' : ''), type: 'button' }, el('small', {}, i === 0 ? 'Today' : DOW[d.getDay()]), el('b', {}, String(d.getDate())));
    if (off) x.disabled = true;
    x.addEventListener('click', () => { pick = d; go.disabled = false; go.textContent = `Close ${BR(b).short} · ${dayLabel(d)}`; paint(); }); return x;
  }));
  paint();
  openSheet('Close for a day', el('p', { class: 'lead2' }, `${BR(b).name}. Bookings that day are cancelled and listed for you to call.`),
    el('div', { class: 'field' }, el('label', {}, 'Day'), dayBox), el('div', { class: 'field' }, el('label', {}, 'Reason (optional)'), el('div', { class: 'input' }, rs)), go);
}
async function reopenDay(c) {
  if (WP) {
    const r = await WP.closed(false, c.branch, c.date); renderSchedule(); if (!r) return;
    toast(restoredText(r.notRestored.length, `${BR(c.branch).short} reopened on ${longDate(fromIso(c.date))}`) + (r.current ? '' : ' The booking list couldn’t be refreshed: reload the page to see it.'));
    return;
  }
  S.bookings.forEach(x => { if ((c.cancelled || []).includes(x.id) && x.status === 'cancelled') { x.status = 'booked'; delete x.reason; } });
  S.closed = S.closed.filter(x => x !== c); save(); renderSchedule(); toast(`${BR(c.branch).short} reopened on ${longDate(fromIso(c.date))}`);
}

/* ---------- Doctors: add, edit, remove ---------- */
function avatar(doc) { return el('span', { class: 'av', 'aria-hidden': 'true' }, doc.photo ? el('img', { src: doc.photo, alt: '' }) : initials(doc)); }
function renderDoctors() {
  const list = S.content.doctors.filter(d => V.dBranch === 'all' || d.branches.includes(V.dBranch));
  const add = el('button', { class: 'btn btn--act bigact', type: 'button' }, icon('plus'), 'Add a doctor');
  add.addEventListener('click', () => openDoctor(null));
  view.replaceChildren(
    head('', `${S.content.doctors.length} doctor${S.content.doctors.length === 1 ? '' : 's'}`),
    branchTabs(V.dBranch, true, id => { V.dBranch = id; renderDoctors(); }),
    list.length ? el('div', { class: 'card' }, ...list.map(doc => {
      const r = el('button', { class: 'row doc', type: 'button' }, avatar(doc),
        el('span', {}, el('b', {}, shortName(doc)), el('span', { class: 'sub' }, `${doc.role || 'Physiotherapist'} · ${doc.branches.map(id => BR(id).short).join(', ') || 'No branch yet'}`)), el('span', { class: 'go' }, icon('chevron')));
      r.addEventListener('click', () => openDoctor(doc)); return r;
    })) : el('div', { class: 'card' }, el('p', { class: 'empty' }, el('b', {}, 'No doctors at this branch'), 'Add one, or pick this branch on a doctor’s card.')),
    add,
    el('p', { class: 'note' }, 'Changes here show on the website after you publish.'));
}
// the shape of the cards each kind of photo sits in, so a crop here is exactly what the site shows
const CROP = { portrait: { aspect: 4 / 5, out: 800, label: 'Doctor photo' }, clinic: { aspect: 15 / 19, out: 1050, label: 'Clinic photo' }, service: { aspect: 4 / 5, out: 800, label: 'Service photo' }, home: { aspect: 4 / 5, out: 1200, label: 'Home page photo' } };
// A phone-first cropper. The frame is the card's shape and starts filled and centred; drag to move, pinch (or the
// slider, or a mouse wheel) to zoom. The chosen part is saved as a compressed WebP at the card's size.
function cropPhoto(file, kind) {
  const { aspect, out, label } = CROP[kind];
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); reject(); };
    img.onload = () => {
      const W = img.naturalWidth, H = img.naturalHeight;
      const frame = el('div', { class: 'crop-frame' }), stage = el('div', { class: 'crop-stage' }, frame);
      img.className = 'crop-img'; img.alt = ''; img.draggable = false; stage.prepend(img);
      const zoom = el('input', { type: 'range', min: '1', max: '4', step: '0.01', value: '1', 'aria-label': 'Zoom' });
      const cancel = el('button', { class: 'crop-cancel', type: 'button' }, 'Cancel'), use = el('button', { class: 'btn btn--act', type: 'button' }, 'Use photo');
      const ui = el('div', { class: 'cropper', role: 'dialog', 'aria-modal': 'true', 'aria-label': `Crop ${label.toLowerCase()}` },
        el('header', {}, cancel, el('b', {}, label), use), stage,
        el('div', { class: 'crop-zoom' }, el('span', { 'aria-hidden': 'true' }, icon('minus')), zoom, el('span', { 'aria-hidden': 'true' }, icon('plus'))),
        el('p', { class: 'crop-hint' }, 'Drag to move · pinch or slide to zoom'));
      document.body.append(ui); document.documentElement.classList.add('locked');
      let fw = 0, fh = 0, fx = 0, fy = 0, base = 1, z = 1, x = 0, y = 0;
      const scale = () => base * z;
      const clampPos = () => { const s = scale(); x = Math.min(0, Math.max(fw - W * s, x)); y = Math.min(0, Math.max(fh - H * s, y)); };
      const paint = () => { clampPos(); img.style.transform = `translate(${(fx + x).toFixed(2)}px, ${(fy + y).toFixed(2)}px) scale(${scale().toFixed(5)})`; zoom.value = z; };
      // the frame fills the stage at the card's shape; the photo starts covering it, centred
      const layout = keep => {
        const r = stage.getBoundingClientRect(), maxW = r.width - 40, maxH = r.height - 40;
        const cx = keep ? (fw / 2 - x) / scale() : W / 2, cy = keep ? (fh / 2 - y) / scale() : H / 2;
        fw = Math.min(maxW, maxH * aspect); fh = fw / aspect; fx = (r.width - fw) / 2; fy = (r.height - fh) / 2;
        Object.assign(frame.style, { width: fw + 'px', height: fh + 'px', left: fx + 'px', top: fy + 'px' });
        base = Math.max(fw / W, fh / H); x = fw / 2 - cx * scale(); y = fh / 2 - cy * scale(); paint();
      };
      const zoomAt = (nz, px, py) => { const s0 = scale(); z = Math.min(4, Math.max(1, nz)); const k = scale() / s0; x = px - (px - x) * k; y = py - (py - y) * k; paint(); };
      layout(false);
      const onResize = () => layout(true); addEventListener('resize', onResize);
      zoom.addEventListener('input', () => zoomAt(+zoom.value, fw / 2, fh / 2));
      stage.addEventListener('wheel', e => { e.preventDefault(); const r = stage.getBoundingClientRect(); zoomAt(z * Math.exp(-e.deltaY / 400), e.clientX - r.left - fx, e.clientY - r.top - fy); }, { passive: false });
      const pts = new Map(); let pinch = null;
      stage.addEventListener('pointerdown', e => { stage.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); pinch = null; });
      stage.addEventListener('pointermove', e => {
        if (!pts.has(e.pointerId)) return;
        const prev = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
        if (pts.size === 1) { x += e.clientX - prev[0]; y += e.clientY - prev[1]; paint(); return; }
        const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), r = stage.getBoundingClientRect();
        const mx = (a[0] + b[0]) / 2 - r.left - fx, my = (a[1] + b[1]) / 2 - r.top - fy;
        if (pinch) { x += mx - pinch.mx; y += my - pinch.my; zoomAt(pinch.z * d / pinch.d, mx, my); } else pinch = { d, z };
        pinch = { ...pinch, mx, my };
      });
      const lift = e => { pts.delete(e.pointerId); pinch = null; };
      stage.addEventListener('pointerup', lift); stage.addEventListener('pointercancel', lift);
      const close = () => { removeEventListener('resize', onResize); removeEventListener('keydown', onKey, true); ui.remove(); document.documentElement.classList.remove('locked'); URL.revokeObjectURL(url); };
      const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); resolve(null); } };
      addEventListener('keydown', onKey, true);
      cancel.addEventListener('click', () => { close(); resolve(null); });
      use.addEventListener('click', () => {
        const s = scale(), c = document.createElement('canvas'), w = Math.round(Math.min(out, (fw / s))), h = Math.round(w / aspect);
        c.width = w; c.height = h; c.getContext('2d').drawImage(img, -x / s, -y / s, fw / s, fh / s, 0, 0, w, h);
        const data = c.toDataURL('image/webp', .82); close();
        resolve({ data, kb: Math.round(data.length * .75 / 1024), webp: data.startsWith('data:image/webp') });
      });
      use.focus();
    };
    img.src = url;
  });
}
// says why a picked file can't be used: iPhone HEIC photos open only in Safari, other files aren't photos at all
function unreadable(file) {
  const heic = /hei[cf]$/i.test(file.name) || /hei[cf]/i.test(file.type);
  return heic ? 'This browser can’t open iPhone HEIC photos. Use Safari, or set the iPhone camera to “Most Compatible” (JPEG).'
    : `That file (${file.type || file.name.split('.').pop() || 'unknown type'}) isn’t a photo this browser can open. Pick a JPEG, PNG or WebP.`;
}
// photos are shrunk and saved as WebP in the browser before they are stored: small, sharp and quick to load
function toWebP(file, max = 900, q = .82) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      const data = c.toDataURL('image/webp', q);
      res({ data, kb: Math.round(data.length * .75 / 1024), webp: data.startsWith('data:image/webp') });
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(); };
    img.src = url;
  });
}
function tagEditor(values, suggestions, placeholder, label) {
  const V2 = [...values], box = el('div', {}), list = el('div', { class: 'taglist' }), sug = el('div', { class: 'picks', style: 'margin-top:8px' });
  const inp = el('input', { placeholder, 'aria-label': label }), addB = el('button', { class: 'chipbtn2', type: 'button' }, 'Add');
  const add = v => { v = v.trim(); if (v && !V2.includes(v)) V2.push(v); inp.value = ''; paint(); };
  addB.addEventListener('click', () => add(inp.value)); inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); add(inp.value); } });
  function paint() {
    list.replaceChildren(...V2.map(v => { const p = el('button', { class: 'pill', type: 'button', 'aria-label': `Remove ${v}` }, v, icon('close')); p.addEventListener('click', () => { V2.splice(V2.indexOf(v), 1); paint(); }); return p; }));
    sug.replaceChildren(...suggestions.filter(s => !V2.includes(s)).map(s => { const p = el('button', { class: 'pill', type: 'button' }, `+ ${s}`); p.addEventListener('click', () => add(s)); return p; }));
  }
  paint(); box.append(list, el('div', { class: 'chipadd' }, el('div', { class: 'input' }, inp), addB), sug);
  return { box, values: () => V2 };
}
function openDoctor(doc) {
  const isNew = !doc, D = doc ? clone(doc) : { id: `doc${Date.now()}`, name: '', role: 'Physiotherapist', years: '', deg: [], treats: [], bg: [], branches: V.dBranch !== 'all' ? [V.dBranch] : [], photo: null };
  const f = (id, label, input, hint) => el('div', { class: 'field' }, el('label', { for: id }, label), input, hint ? el('small', { style: 'font-size:13px;color:var(--ink-3)' }, hint) : '');
  const nm = el('input', { id: 'd-nm', value: D.name, placeholder: 'e.g. Dr. Asha Rao (PT)', autocomplete: 'off' });
  const rl = el('input', { id: 'd-rl', value: D.role, placeholder: 'e.g. Senior Physiotherapist' });
  const yr = el('input', { id: 'd-yr', value: D.years, placeholder: 'e.g. 10+ years' });
  const bg = el('textarea', { id: 'd-bg', rows: '4', placeholder: 'One line each, e.g. MPT, Manipal University' }); bg.value = D.bg.join('\n');
  const quals = tagEditor(D.deg, QUALS, 'Add a qualification', 'Qualification'), treats = tagEditor(D.treats, SERVICE_NAMES, 'Add something they treat', 'Treats');
  const brBox = el('div', { class: 'picks' }), paintBr = () => brBox.replaceChildren(...BRANCHES.map(b => {
    const p = el('button', { class: 'pill', type: 'button', 'aria-pressed': String(D.branches.includes(b.id)) }, b.short);
    p.addEventListener('click', () => { D.branches = D.branches.includes(b.id) ? D.branches.filter(x => x !== b.id) : [...D.branches, b.id]; paintBr(); }); return p;
  }));
  paintBr();
  const av = el('span', { class: 'av' }), info = el('small', {}, D.photo ? 'Saved as WebP' : 'You’ll crop it to fit the Team page card');
  const paintAv = () => av.replaceChildren(D.photo ? el('img', { src: D.photo, alt: '' }) : (initials({ name: nm.value || 'Dr' })));
  paintAv(); nm.addEventListener('input', paintAv);
  const file = el('input', { type: 'file', accept: 'image/*', id: 'd-photo' });
  file.addEventListener('change', async () => {
    const fl = file.files[0]; if (!fl) return;
    try {
      const r = await cropPhoto(fl, 'portrait'); file.value = ''; if (!r) return;
      if (WP) { info.textContent = 'Uploading…'; const up = await WP.photo(r.data, 'portrait'); if (up.error) { info.textContent = up.error; toast(up.error); return; } D.photo = up.url; D.photoId = up.id; }
      else D.photo = r.data;
      info.textContent = `${r.webp ? 'Saved as WebP' : 'Saved'} · ${r.kb} KB (from ${Math.round(fl.size / 1024)} KB)`; paintAv();
    }
    catch (_) { info.textContent = unreadable(fl); }
  });
  const err = el('p', { class: 'confirm', role: 'alert', hidden: '' });
  const saveB = btn(isNew ? 'Add doctor' : 'Save changes', 'btn--act btn--block', () => {
    D.name = nm.value.trim(); D.role = rl.value.trim(); D.years = yr.value.trim(); D.deg = quals.values(); D.treats = treats.values();
    D.bg = bg.value.split('\n').map(s => s.trim()).filter(Boolean);
    if (D.name.length < 3) { err.textContent = 'Add the doctor’s name.'; err.hidden = false; nm.focus(); return; }
    if (!D.branches.length) { err.textContent = 'Pick at least one branch.'; err.hidden = false; return; }
    if (isNew) S.content.doctors.push(D); else Object.assign(doc, D);
    save(); renderDoctors(); closeSheet(); toast(isNew ? `${shortName(D)} added. Publish to show them on the website.` : 'Saved. Publish to show it on the website.');
  });
  const kids = [
    el('div', { class: 'photo-edit' }, av, el('div', {}, el('label', { for: 'd-photo' }, icon('photo'), doc && doc.photo ? 'Change photo' : 'Add a photo'), file, info)),
    f('d-nm', 'Full name', el('div', { class: 'input' }, nm)), f('d-rl', 'Title', el('div', { class: 'input' }, rl)), f('d-yr', 'Experience (optional)', el('div', { class: 'input' }, yr)),
    el('div', { class: 'field' }, el('label', {}, 'Qualifications'), quals.box),
    el('div', { class: 'field' }, el('label', {}, 'What they treat'), treats.box),
    f('d-bg', 'Background', el('div', { class: 'input area' }, bg), 'One point per line'),
    el('div', { class: 'field' }, el('label', {}, 'Works at'), brBox), err, saveB];
  if (!isNew) {
    // on WordPress their bookings stay in the diary under their name (see Today) for the front desk to move
    const upcoming = WP ? [] : S.bookings.filter(x => x.doc === doc.id && x.status === 'booked' && x.date >= iso(today()));
    const rm = btn(`Remove ${shortName(doc)}`, 'btn--danger btn--block', () => confirmInline(rm, `Remove ${shortName(doc)} from the clinic and the website?${upcoming.length ? ` Their ${upcoming.length} upcoming booking${upcoming.length === 1 ? '' : 's'} will move to "Any doctor".` : ''}`, 'Yes, remove', () => {
      upcoming.forEach(x => { x.doc = null; });
      S.content.doctors = S.content.doctors.filter(d => d !== doc);
      Object.values(S.schedule).forEach(sc => delete sc.own[doc.id]); S.leave = S.leave.filter(l => l.doc !== doc.id);
      // where the doctors left can't see every moved patient at their time, those bookings are cancelled to call
      const gone = [...new Set(upcoming.map(x => `${x.branch}|${x.date}`))].flatMap(k => anySurplus(...k.split('|')));
      gone.forEach(x => { x.status = 'cancelled'; x.reason = 'doctor removed'; });
      save(); renderDoctors(); closeSheet();
      if (gone.length) showAffected(`${shortName(doc)} removed`, `No other doctor is free at these ${gone.length} time${gone.length === 1 ? '' : 's'}, so ${gone.length === 1 ? 'the booking was' : 'the bookings were'} cancelled. Let them know:`, gone);
      else toast(`${shortName(doc)} removed. Publish to update the website.`);
    }));
    kids.push(rm);
  }
  openSheet(isNew ? 'Add a doctor' : shortName(doc), ...kids);
}

/* ---------- Content: everything the website says, published when ready ---------- */
function changes() {
  const a = S.content, b = S.live, n = [];
  if (JSON.stringify(a.home) !== JSON.stringify(b.home)) n.push('home page');
  if (JSON.stringify(a.doctors) !== JSON.stringify(b.doctors)) n.push('doctors');
  if (JSON.stringify(a.branches) !== JSON.stringify(b.branches)) n.push('branch details');
  if (JSON.stringify(a.services) !== JSON.stringify(b.services)) n.push('service text');
  if (JSON.stringify(a.photos) !== JSON.stringify(b.photos)) n.push('clinic photos');
  if (JSON.stringify(a.servicePhotos || {}) !== JSON.stringify(b.servicePhotos || {})) n.push('service photos');
  return n;
}
function paintPub() {
  const n = changes(), bar = $('[data-pubbar]');
  bar.hidden = !n.length; document.body.classList.toggle('has-pub', !!n.length);
  if (n.length) $('[data-pub-text]').textContent = `Not on the website yet: ${n.join(', ')}`;
}
// the website's copy: one small file, rebuilt only when something is published or the timings change
function writeSnapshot() {
  const c = S.live;
  const snap = { v: 1, at: S.publishedAt, home: c.home, services: c.services, photos: c.photos,
    service_photos: Object.fromEntries(Object.entries(c.servicePhotos || {}).map(([k, v]) => [k, v.src])),
    branches: Object.fromEntries(BRANCHES.map(b => [b.id, { ...c.branches[b.id], sessions: S.schedule[b.id].sessions, days: pack({ week: weekOf(S.schedule[b.id]), slot: 30 }).days, week: weekOf(S.schedule[b.id]), slot: S.schedule[b.id].slot || 30 }])),
    doctors: c.doctors.map(d => ({ id: d.id, name: d.name, role: d.role, years: d.years, deg: d.deg, treats: d.treats, bg: d.bg, branches: d.branches, photo: d.photo })) };
  try { localStorage.setItem(PUB, JSON.stringify(snap)); } catch (_) {}
  // the server writes it to the one static file every device's website loads
  return fetch('/api/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(snap) }).then(r => r.ok);
}
$('[data-publish]').addEventListener('click', async e => {
  if (WP) {
    const b = e.currentTarget; b.disabled = true; const ok = await WP.publish(); b.disabled = false;
    if (!ok) return;
    if ((location.hash || '#today') === '#content') renderContent();
    paintPub(); toast('Published. The website now shows your changes.'); return;
  }
  S.live = clone(S.content); S.publishedAt = nowIST().getTime(); save();
  const ok = await writeSnapshot().catch(() => false);
  if ((location.hash || '#today') === '#content') renderContent();
  toast(ok ? 'Published. The website now shows your changes.' : 'Published on this phone only: start the demo with start.sh so other devices see it.');
});
const photosLine = () => {
  const n = S.content.photos.length, b = new Set(S.content.photos.map(p => p.branch)).size;
  return n ? `${n} photo${n === 1 ? '' : 's'} at ${b} branch${b === 1 ? '' : 'es'}` : 'None yet: add photos for each branch';
};
function renderContent() {
  const when = S.publishedAt ? new Date(S.publishedAt) : null;
  const row = (title, sub, on, ic = 'edit') => { const r = el('button', { class: 'row doc', type: 'button' }, el('span', { class: 'av' }, icon(ic)), el('span', {}, el('b', {}, title), el('span', { class: 'sub' }, sub)), el('span', { class: 'go' }, icon('chevron'))); r.addEventListener('click', on); return r; };
  view.replaceChildren(
    head('', 'Website content'),
    (when ? el('p', { class: 'lastpub' }, 'Last published ', el('b', {}, `${dayLabel(new Date(when.getFullYear(), when.getMonth(), when.getDate()))}, ${timeText(when.getHours() + when.getMinutes() / 60)}`)) : el('p', { class: 'lastpub' }, 'Nothing published from here yet. The website shows its current text.')),
    el('div', { class: 'card' },
      row('Home page', S.content.home.headline, openHome),
      row('Doctors', `${S.content.doctors.length} on the Team page`, () => { location.hash = '#doctors'; }, 'team'),
      row('Branches', 'Addresses, phone numbers, landmarks', openBranches, 'pin'),
      row('Services', `10 pages: the text at the top, and a photo for each (${Object.keys(S.content.servicePhotos || {}).length} of 10)`, openServices, 'services'),
      row('Clinic photos', photosLine(), () => openPhotos(), 'photo')),
    el('p', { class: 'note' }, 'Edits wait here until you tap Publish to website. Opening hours come from the Schedule tab.'));
  paintPub();
}
const fieldIn = (label, value, opts = {}) => {
  const inp = opts.area ? el('textarea', { rows: String(opts.rows || 3), maxlength: String(opts.max || 300) }) : el('input', { maxlength: String(opts.max || 120) });
  inp.value = value || ''; if (opts.placeholder) inp.placeholder = opts.placeholder;
  return { inp, node: el('div', { class: 'field' }, el('label', {}, label), el('div', { class: 'input' + (opts.area ? ' area' : '') }, inp)) };
};
// the home page: its headline, the line under it, and the big photo beside them (without one, the nearest branch's
// main photo shows)
function openHome() {
  const H = S.content.home, h = fieldIn('Main headline', H.headline, { max: 60 }), i = fieldIn('Line under it', H.intro, { area: true, max: 160 });
  const box = el('div', { class: 'svc-photo' }), inp = el('input', { type: 'file', accept: 'image/*', id: 'home-ph' });
  const paint = () => {
    const kids = [el('label', { for: 'home-ph', class: 'ph-add' }, H.photo ? el('img', { src: H.photo, alt: 'Home page photo' }) : el('span', {}, icon('plus'), el('br'), 'Add a photo'), inp)];
    kids.push(el('div', {}, el('small', {}, H.photo ? 'Tap the photo to change it' : 'Until you add one, the branch’s main photo shows'),
      ...(H.photo ? [btn('Remove photo', 'btn--line', () => { H.photo = null; H.photoId = 0; save(); paint(); renderContent(); })] : [])));
    box.replaceChildren(...kids);
  };
  inp.addEventListener('change', async () => {
    const f = inp.files; if (!f.length) return;
    await addPhotos([f[0]], 'home', p => { H.photo = p.src; H.photoId = p.id || 0; save(); paint(); renderContent(); });
    inp.value = '';
  });
  paint();
  openSheet('Home page', el('div', { class: 'field' }, el('label', {}, 'Big photo on the home page'), box), h.node, i.node,
    btn('Save', 'btn--act btn--block', () => { H.headline = h.inp.value.trim(); H.intro = i.inp.value.trim(); save(); renderContent(); closeSheet(); toast('Saved. Publish when you’re ready.'); }));
}
function openBranches() {
  openSheet('Branches', el('div', { class: 'card', style: 'margin:16px 0 0' }, ...BRANCHES.map(b => {
    const r = el('button', { class: 'row doc', type: 'button' }, el('span', { class: 'av' }, icon('pin')), el('span', {}, el('b', {}, b.name), el('span', { class: 'sub' }, S.content.branches[b.id].landmark)), el('span', { class: 'go' }, icon('chevron')));
    r.addEventListener('click', () => openBranch(b)); return r;
  })));
}
function openBranch(b) {
  const c = S.content.branches[b.id], ph = fieldIn('Phone', c.phone, { max: 20 }), lm = fieldIn('Landmark', c.landmark, { max: 60 }), ad = fieldIn('Address', c.addr, { area: true, max: 240 });
  // the exact spot "Directions" and the maps open: Google Maps shows it under the branch's address (e.g. VHQR+7X)
  const pl = fieldIn('Google Maps plus code', c.plus || b.plus || '', { max: 40, placeholder: 'e.g. 7J4VVHQR+7X' });
  openSheet(b.name, ph.node, lm.node, ad.node, pl.node,
    el('p', { class: 'note', style: 'margin:12px 0 0' }, 'The plus code is shown in Google Maps under the branch’s address. Opening hours come from the Schedule tab.'),
    btn('Save', 'btn--act btn--block', () => { Object.assign(c, { phone: ph.inp.value.trim(), landmark: lm.inp.value.trim(), addr: ad.inp.value.trim(), plus: pl.inp.value.trim().toUpperCase() }); save(); renderContent(); closeSheet(); toast('Saved. Publish when you’re ready.'); }));
}
function openServices() {
  openSheet('Services', el('div', { class: 'card', style: 'margin:16px 0 0' }, ...PAGES.map(([id, name]) => {
    const r = el('button', { class: 'row doc', type: 'button' }, el('span', { class: 'av' }, icon('services')), el('span', {}, el('b', {}, name), el('span', { class: 'sub' }, S.content.services[id] || 'No text yet')), el('span', { class: 'go' }, icon('chevron')));
    r.addEventListener('click', () => openService(id, name)); return r;
  })));
}
// Clinic photos: as many as he likes, each at a branch. A branch's first photo is its main one (on the Branches page,
// its branch page and the home page); all of them show in "Inside our clinics". Picking several photos crops and
// uploads them one after another.
async function addPhotos(files, kind, onEach) {
  const list = [...files];
  for (let i = 0; i < list.length; i++) {
    const f = list[i];
    let r;
    try { r = await cropPhoto(f, kind); } catch (_) { toast(unreadable(f)); continue; }
    if (!r) continue; // skipped in the cropper
    if (WP) {
      toast(list.length > 1 ? `Uploading ${i + 1} of ${list.length}…` : 'Uploading…');
      const up = await WP.photo(r.data, kind);
      if (up.error) { toast(up.error); continue; }
      onEach({ id: up.id, src: up.url });
    } else onEach({ src: r.data });
  }
}
// the branch the site starts at when the visitor hasn't shared where they are
const PREFERRED_BRANCH = () => ['jpnagar', 'bannerghatta', 'arekere'].find(id => BRANCHES.some(b => b.id === id)) || BRANCHES[0].id;
function openPhotos(branch = V.pBranch || PREFERRED_BRANCH()) {
  V.pBranch = branch;
  const mine = () => S.content.photos.filter(p => p.branch === branch);
  const grid = el('div', { class: 'gallery' }), tabs = el('div', { class: 'picks' });
  const inp = el('input', { type: 'file', accept: 'image/*', multiple: '', id: 'ph-add' });
  inp.addEventListener('change', async () => {
    const files = inp.files; if (!files.length) return;
    await addPhotos(files, 'clinic', p => { S.content.photos.push({ ...p, label: '', branch }); save(); paint(); });
    inp.value = ''; renderContent();
  });
  function paint() {
    tabs.replaceChildren(...BRANCHES.map(b => {
      const n = S.content.photos.filter(p => p.branch === b.id).length;
      const t = el('button', { class: 'pill', type: 'button', 'aria-pressed': String(b.id === branch) }, b.short + (n ? ` · ${n}` : ''));
      t.addEventListener('click', () => { branch = V.pBranch = b.id; paint(); }); return t;
    }));
    const list = mine();
    grid.replaceChildren(...list.map((p, i) => {
      const main = i === 0;
      const star = el('button', { class: 'ph-act', type: 'button', 'aria-label': main ? 'Main photo' : `Make photo ${i + 1} the main photo` }, main ? 'Main' : 'Make main');
      if (main) star.disabled = true;
      // the main photo is simply the branch's first: moving a photo to just before the current first makes it main
      star.addEventListener('click', () => { const all = S.content.photos; all.splice(all.indexOf(p), 1); all.splice(all.indexOf(list[0]), 0, p); save(); paint(); });
      const rm = el('button', { class: 'ph-x', type: 'button', 'aria-label': `Remove photo ${i + 1}` }, icon('close'));
      rm.addEventListener('click', () => { S.content.photos.splice(S.content.photos.indexOf(p), 1); save(); paint(); renderContent(); });
      return el('div', { class: 'ph' + (main ? ' is-main' : '') }, el('img', { src: p.src, alt: `${BR(branch).short} photo ${i + 1}` }), star, rm);
    }), el('label', { for: 'ph-add', class: 'ph-add' }, el('span', {}, icon('plus'), el('br'), list.length ? 'Add photos' : 'Add the first photo'), inp));
  }
  paint();
  openSheet('Clinic photos', el('p', { class: 'lead2' }, 'Pick a branch, then add as many photos as you like. The first one is the branch’s main photo. They’re shrunk and saved as WebP so the site stays fast.'), tabs, grid);
}
// a service's short text, and its photo (on its card on the Services page)
function openService(id, name) {
  const t = fieldIn('Short text at the top of the page', S.content.services[id], { area: true, rows: 4, max: 220 });
  S.content.servicePhotos = S.content.servicePhotos || {};
  const box = el('div', { class: 'svc-photo' }), inp = el('input', { type: 'file', accept: 'image/*', id: 'svc-ph' });
  const paint = () => {
    const p = S.content.servicePhotos[id];
    const kids = [el('label', { for: 'svc-ph', class: 'ph-add' }, p ? el('img', { src: p.src, alt: `${name} photo` }) : el('span', {}, icon('plus'), el('br'), 'Add a photo'), inp)];
    if (p) {
      const rm = btn('Remove photo', 'btn--line', () => { delete S.content.servicePhotos[id]; save(); paint(); renderContent(); });
      kids.push(el('div', {}, el('small', {}, 'Tap the photo to change it'), rm));
    }
    box.replaceChildren(...kids);
  };
  inp.addEventListener('change', async () => {
    const f = inp.files; if (!f.length) return;
    await addPhotos([f[0]], 'service', p => { S.content.servicePhotos[id] = p; save(); paint(); renderContent(); });
    inp.value = '';
  });
  paint();
  openSheet(name, el('div', { class: 'field' }, el('label', {}, 'Photo on the Services page'), box), t.node,
    btn('Save', 'btn--act btn--block', () => { S.content.services[id] = t.inp.value.trim(); save(); renderContent(); closeSheet(); toast('Saved. Publish when you’re ready.'); }));
}

// on WordPress nothing is drawn until his data has arrived (or he has been sent to sign in)
if (WP) { skelView(); WP.boot().then(ok => { if (ok) { route(true); paintPub(); } }); }
else { route(true); paintPub(); }
