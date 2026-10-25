// J.P. Nagar Physio desktop site: shared data, page chrome (header status, dock, floating contact, footer)
// and the small components the pages share. Sample data matches the mobile demo; the WordPress build
// replaces it with the clinic's own.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg', parser = new DOMParser();
const page = document.body.dataset.page;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = matchMedia('(hover: hover)').matches;
if (!reduceMotion) document.documentElement.classList.add('motion');

function el(tag, attrs, ...kids) {
  const n = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([k, v]) => { if (v != null && v !== false) n.setAttribute(k, v === true ? '' : v); });
  n.append(...kids.flat().filter(k => k != null && k !== false));
  return n;
}
function svgNodes(markup) {
  const doc = parser.parseFromString(`<svg xmlns="${NS}">${markup}</svg>`, 'image/svg+xml');
  return [...doc.documentElement.childNodes].map(n => document.importNode(n, true));
}
function svgEl(attrs, markup = '') {
  const s = document.createElementNS(NS, 'svg');
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  s.append(...svgNodes(markup));
  return s;
}
const ICON = {
  home: '<path d="M3.5 10.5 12 3.8l8.5 6.7V19a1.5 1.5 0 0 1-1.5 1.5h-4.2v-5.8H9.2v5.8H5A1.5 1.5 0 0 1 3.5 19z"/>',
  services: '<rect x="3.8" y="3.8" width="7" height="7" rx="2"/><rect x="13.2" y="3.8" width="7" height="7" rx="2"/><rect x="3.8" y="13.2" width="7" height="7" rx="2"/><rect x="13.2" y="13.2" width="7" height="7" rx="2"/>',
  book: '<rect x="3.8" y="5" width="16.4" height="15.2" rx="2.6"/><path d="M3.8 9.6h16.4M8.2 3v4M15.8 3v4M9 14.6l2.1 2.1 4-4"/>',
  branches: '<path d="M12 20.8s-6.6-5.8-6.6-11A6.6 6.6 0 0 1 18.6 9.8c0 5.2-6.6 11-6.6 11z"/><circle cx="12" cy="9.8" r="2.4"/>',
  team: '<circle cx="9" cy="8.2" r="3.2"/><path d="M3.4 19.6c0-3.2 2.5-5.6 5.6-5.6s5.6 2.4 5.6 5.6"/><path d="M15.6 5.1a3.1 3.1 0 0 1 0 6.2M17.6 14.3c1.8.6 3 2.5 3 5.3"/>',
  phone: '<path d="M5.2 3.6h3l1.6 4.1-2 1.3a10.6 10.6 0 0 0 7.2 7.2l1.3-2 4.1 1.6v3a1.6 1.6 0 0 1-1.6 1.6A16.4 16.4 0 0 1 3.6 5.2 1.6 1.6 0 0 1 5.2 3.6z"/>',
  whatsapp: '<path d="M4.2 19.8l1.1-3.9A8.2 8.2 0 1 1 8.4 19z"/><path d="M9.2 8.3c.2-.4.5-.5.8-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .5-.1.6l-.5.6c.6 1.1 1.5 2 2.6 2.6l.6-.5c.2-.2.4-.2.6-.1l1.6.7c.3.1.4.3.4.5v.5c0 .3-.1.6-.5.8-.6.4-1.4.6-2.2.3-2.3-.8-4.1-2.6-4.9-4.9-.3-.8-.1-1.6.3-2.2z"/>',
  tick: '<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.7 2.7L16.2 9.4"/>',
  check: '<circle cx="12" cy="12" r="9.5"/><path d="m7.6 12.4 3 3 5.8-6.2"/>',
  mark: '<path d="m6 12.5 4 4 8-9"/>',
  star: '<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  arrow: '<path d="M4.5 12h15M13.5 6l6 6-6 6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  pin: '<path d="M12 20.8s-6.6-5.8-6.6-11A6.6 6.6 0 0 1 18.6 9.8c0 5.2-6.6 11-6.6 11z"/><circle cx="12" cy="9.8" r="2.4"/>',
  calendar: '<rect x="3.8" y="5" width="16.4" height="15.2" rx="2.6"/><path d="M3.8 9.6h16.4M8.2 3v4M15.8 3v4"/>',
  print: '<path d="M7 8V3.8h10V8"/><rect x="3.8" y="8" width="16.4" height="8.4" rx="2"/><path d="M7 13.8h10v6.4H7z"/>',
  share: '<path d="M12 3.8v11M7.8 8 12 3.8 16.2 8"/><path d="M5 12.5v5.7A1.8 1.8 0 0 0 6.8 20h10.4a1.8 1.8 0 0 0 1.8-1.8v-5.7"/>',
  locate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.4"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4"/>',
  shield: '<path d="M12 3.4 5 6v5.2c0 4.3 2.9 8.1 7 9.4 4.1-1.3 7-5.1 7-9.4V6z"/><path d="m9 12 2.2 2.2L15.4 10"/>',
  search: '<circle cx="11" cy="11" r="6.6"/><path d="m16 16 4.2 4.2"/>',
  turn: '<path d="M4.6 10.2A7.6 7.6 0 0 1 18 6.6l1.6 1.6"/><path d="M19.6 3.8v4.4h-4.4"/><path d="M19.4 13.8A7.6 7.6 0 0 1 6 17.4l-1.6-1.6"/><path d="M4.4 20.2v-4.4h4.4"/>'
};
function icon(name, fill) {
  return svgEl({ viewBox: '0 0 24 24', fill: fill ? 'currentColor' : 'none', stroke: 'currentColor', 'stroke-width': '1.7', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' }, ICON[name]);
}
function paintIcons(root = document) { $$('[data-icon]', root).forEach(n => n.replaceChildren(icon(n.dataset.icon, n.hasAttribute('data-fill')))); }

const TEAM = [
  { name: 'Dr. P. Senthil (PT)', short: 'Dr. P. Senthil', first: 'Dr. P. Senthil', role: 'Founder · Chief Consultant Physiotherapist', years: '27+ years', card: 'Founder · 27+ yrs', deg: ['MPT', 'MD(A.M)', 'D.ACU', 'COMT', 'MIAP'],
    treat: ['Orthopaedic and sports injuries', 'Neurological conditions', 'Long-term and complex pain', 'Acute and chronic joint and muscle problems'],
    bg: ['BPT and MPT (Sports & Musculoskeletal), Rajah Muthiah Medical College', 'Certified Orthopaedic Manual Therapist', 'Advanced training in acupuncture and alternative medicine', 'Founded the clinic in 2012'] },
  { name: 'Dr. Vanitha Senthil (PT)', short: 'Dr. Vanitha Senthil', first: 'Dr. Vanitha', role: 'Senior Consultant Physiotherapist', card: 'Senior Consultant', deg: ['MPT', 'COMT', 'MIAP'],
    treat: ['Restoring mobility', 'Reducing pain', 'Structured rehabilitation programmes', 'Guided therapeutic exercise'],
    bg: ['Master of Physiotherapy', 'Certified Orthopaedic Manual Therapist', 'Known for compassionate, patient-centred care'] },
  { name: 'Dr. Jeya Chitra Devi (PT)', short: 'Dr. Jeya Chitra Devi', first: 'Dr. Jeya', role: 'HOD & Senior Consultant Physiotherapist · Arekere', years: '15+ years', card: 'HOD, Arekere · 15+ yrs', deg: ['BPT'],
    treat: ['Orthopaedic and post-surgery rehab', 'Sports physiotherapy', 'Neurological rehabilitation', 'Posture and work-related (ergonomic) problems'],
    bg: ['BPT, Dr. MGR Medical University', 'Head of Department at the Arekere branch', 'Focus on long-term recovery, not just temporary relief'] }
];
// Which body areas each service treats is a sample until the clinic confirms it.
const SERVICES = [
  { id: 'spine', name: 'Spine & Back Care', page: 'spine.html', helps: ['Back and neck pain', 'Slip disc and sciatica', 'Posture problems'], tags: ['back'], areas: ['neck', 'upper', 'lower'] },
  { id: 'ortho', page: 'ortho.html', name: 'Orthopaedic Physiotherapy', helps: ['Joint and muscle pain', 'Frozen shoulder', 'Fracture recovery'], tags: ['joints'], areas: ['shoulder', 'elbow', 'hand', 'hip', 'knee', 'foot'] },
  { id: 'sports', page: 'sports.html', name: 'Sports Physiotherapy', helps: ['Sprains and ligament tears', 'Running and gym injuries', 'Safe return to sport'], tags: ['sports', 'joints'], areas: ['shoulder', 'elbow', 'knee', 'foot'] },
  { id: 'postop', page: 'postop.html', name: 'Post-Operative Rehab', helps: ['After knee or hip replacement', 'After fracture surgery', 'After spine surgery'], tags: ['surgery'], areas: ['shoulder', 'hip', 'knee', 'lower'] },
  { id: 'neuro', page: 'neuro.html', name: 'Neurological Physiotherapy', helps: ['Stroke recovery', 'Parkinson’s and balance', 'Nerve injuries'], tags: ['neuro'], areas: [] },
  { id: 'women', page: 'women.html', name: 'Women’s Health', helps: ['Pregnancy back pain', 'After delivery recovery', 'Pelvic floor care'], tags: ['women'], areas: ['lower', 'hip'] },
  { id: 'paeds', page: 'paeds.html', name: 'Paediatric Physiotherapy', helps: ['Delayed walking or crawling', 'Posture in children', 'Sports injuries in teens'], tags: ['children'], areas: [] },
  { id: 'geri', page: 'geri.html', name: 'Geriatric Physiotherapy', helps: ['Arthritis', 'Balance and fall prevention', 'Staying mobile'], tags: ['elderly', 'joints'], areas: ['hip', 'knee', 'lower'] },
  { id: 'home', page: 'homecare.html', name: 'Home Care Physiotherapy', helps: ['When travel is hard', 'After a hospital stay', 'Bedside rehab'], tags: ['elderly', 'surgery'], areas: [] },
  { id: 'therapies', page: 'therapies.html', name: 'Therapies & Equipment', helps: ['Manual therapy and exercise', 'IFT, TENS and ultrasound', 'Traction and heat therapy'], tags: [], areas: [] }
];
const PHONE = '+91 99161 16625', PHONE_TEL = 'tel:+919916116625', WA = 'https://wa.me/919916116625';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function isToday(d) { return sameDay(d, nowIST()); }
function dayISO(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function fromISO(s) { const m = (s || '').match(/^(\d{4})-(\d\d)-(\d\d)$/); return m ? new Date(+m[1], m[2] - 1, +m[3]) : null; }
function dayShort(d) {
  if (isToday(d)) return `Today, ${DOW[d.getDay()]} ${d.getDate()}`;
  if (sameDay(d, addDays(nowIST(), 1))) return `Tomorrow, ${DOW[d.getDay()]} ${d.getDate()}`;
  return `${DOW[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
function dayLong(d) { return `${isToday(d) ? 'Today · ' : ''}${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; }
function timeText(t) { const h = Math.floor(t), m = Math.round((t - h) * 60); return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'pm' : 'am'}`; }
// a day's hours (today unless given)
function hoursText(b, d = nowIST()) { return sessText(sessionsOn(b, d)) || 'Closed'; }
// the same hours, but each session stays on one line when it wraps
// the week, one line per group of days; a narrow column wraps between sessions, never inside a time
function hoursNodes(b) {
  return weekText(b).split('; ').map(g => {
    const [days, hours] = g.split(' · ');
    return el('span', { class: 'wk' }, el('span', { class: 'nw' }, `${days} · `), ...(hours || '').split(', ').flatMap((h, i) => [i ? ', ' : null, el('span', { class: 'nw' }, h)]));
  });
}
function worksDays(b) {
  const d = [1, 2, 3, 4, 5, 6, 0].filter(n => worksOn(b, n));
  if (d.length === 7) return 'Every day';
  if (d.length === 6 && !d.includes(0)) return 'Mon–Sat';
  return d.map(x => DOW_SHORT[x]).join(', ');
}
function liveLine(b) { const st = branchStatus(b); return st.open ? `${b.short} open now · till ${st.text.split('till ')[1]}` : `${b.short} ${st.text[0].toLowerCase()}${st.text.slice(1)}`; }
function freeSlots(b, day) { return sessionsOn(b, day).flatMap((_, si) => slotsFor(b, day, si)).filter(s => !s.taken); }
// false while the live diary is still reading that day (always true without it), so a component can show loading
const diaryReady = (b, day) => typeof DIARY === 'undefined' || !DIARY || DIARY.ready(b.id, day);
// A placeholder line or chip row while live times are on their way: the component keeps its shape, then fills in whole.
const skelLine = w => el('span', { class: 'skel', 'aria-hidden': 'true', style: `display:inline-block;vertical-align:middle;width:${w};height:1em` });
const skelChips = n => [...Array(n)].map(() => el('span', { class: 'skel tchip-skel', 'aria-hidden': 'true' }));
/* "How we treat it" on a service page: the stage follows the chapter being read, and a chapter's treatments take turns
   on it until one is picked. The steps come from the chapters' data-scene and data-cap, unless a page gives its own. */
function storyStepper(steps) {
  const host = $('[data-story-host]'), chapters = $$('.chapter'), stepBtns = $$('[data-goto]'), storySeen = onView(host);
  // each chapter shows one scene, or one per sub-tab
  const STEPS = steps || chapters.map(c => { const subs = $$('.subtab', c); return subs.length ? subs.map(s => [s.dataset.scene, s.dataset.cap]) : [[c.dataset.scene, c.dataset.cap]]; });
  let step = -1, cycle;
  const sub = STEPS.map(() => 0), picked = STEPS.map(() => false);
  function showSub() {
    const [name, cap] = STEPS[step][sub[step]], at = [step, sub[step]];
    // the buttons answer first; the scene (the heavier drawing) follows once that has been drawn
    requestAnimationFrame(() => requestAnimationFrame(() => { if (at[0] === step && at[1] === sub[step]) showScene(host, name); }));
    $('[data-story-cap]').textContent = cap;
    $$(`[data-subs="${step}"] .subtab`).forEach((b, j) => {
      b.setAttribute('aria-pressed', String(j === sub[step]));
      b.classList.remove('run'); void b.offsetWidth;
      b.classList.toggle('run', j === sub[step] && !picked[step] && !reduceMotion);
    });
  }
  function setStep(i) {
    if (i === step) return;
    step = i;
    chapters.forEach((c, j) => c.classList.toggle('on', j === i));
    stepBtns.forEach((b, j) => b.setAttribute('aria-current', j === i ? 'step' : 'false'));
    showSub();
    clearInterval(cycle);
    if (STEPS[i].length > 1 && !reduceMotion) cycle = setInterval(() => {
      if (picked[step] || !storySeen()) return;
      sub[step] = (sub[step] + 1) % STEPS[step].length; showSub();
    }, 7000);
  }
  $$('.subtab').forEach(b => b.addEventListener('click', () => {
    const s = +b.closest('[data-subs]').dataset.subs;
    picked[s] = true; sub[s] = +b.dataset.sub;
    if (step !== s) setStep(s); else showSub();
  }));
  stepBtns.forEach((b, j) => b.addEventListener('click', () => chapters[j].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })));
  const chapterIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setStep(+e.target.dataset.step); }), { rootMargin: '-45% 0px -45% 0px' });
  chapters.forEach(c => chapterIO.observe(c));
  setStep(0);
}
/* "Who treats it" on a service page: each physiotherapist with their published photo, and a link to book with them */
function whoTreats(bookHref) {
  $('[data-who]').replaceChildren(...TEAM.map((t, i) => el('article', { class: 'mini-prof' },
    (() => { const p = el('div', { class: 'photo', role: 'img', 'aria-label': t.photo ? `Portrait of ${t.short}` : `Portrait of ${t.short}, to be shot` }); paintPhoto(p, t.photo); return p; })(),
    el('div', {}, el('b', {}, t.name), el('small', {}, t.card), degChips(t.deg.slice(0, 3), true),
      el('a', { class: 'link', href: bookHref(i) }, `Book with ${t.first}`, icon('chevron'))))));
}
/* "Next free at …" on a service page: the line under the title and the box beside the story, at the starting branch
   (the nearest once the visitor has shared where they are, else JP Nagar). While that day's real times are on their
   way both show loading, and they are drawn again when the times arrive (moving on a day if it has filled up). */
function nextFreeBlock(hrefFor) {
  const near = BRANCHES[nearestIndex()], next = $('[data-next]'), title = $('[data-go-title]'), times = $('[data-go-times]');
  const paint = () => {
    const day = firstOpenDay(near), loading = !diaryReady(near, day), free = loading ? [] : freeSlots(near, day);
    [next, title, times].forEach(n => n && n.setAttribute('aria-busy', String(loading)));
    if (loading) {
      if (next) next.replaceChildren(skelLine('16em'));
      if (title) title.replaceChildren(skelLine('12em'));
      if (times) times.replaceChildren(...skelChips(5));
      return;
    }
    if (!free.length) { if (next) next.replaceChildren(); if (title) title.textContent = 'Next free times'; if (times) times.replaceChildren(); return; }
    const href = s => hrefFor(near, day, s);
    if (next) next.replaceChildren(`Next free at ${near.short}`, el('a', { href: href(free[0]) }, `${dayShort(day)} · ${free[0].label} ${free[0].suffix}`));
    if (title) title.textContent = `Next free at ${near.short}, ${dayShort(day).toLowerCase().startsWith('today') ? 'today' : dayShort(day)}`;
    if (times) times.replaceChildren(...free.slice(0, 5).map(s => el('a', { class: 'tchip', href: href(s) }, `${s.label} ${s.suffix}`)));
  };
  paint();
  document.addEventListener('jpn:slots', paint);
}
function firstOpenDay(b) { const d0 = startOfDay(nowIST()); for (let i = 0; i < 14; i++) { const d = addDays(d0, i); if (freeSlots(b, d).length) return d; } return addDays(d0, 1); }
/* ---------- distances: never guessed. They appear only once the visitor has said where they are (on Branches),
   and are kept for the rest of the visit ---------- */

// keep the pinned demo clock when moving between pages
function withT(href) {
  if (!DEMO_T) return href;
  const u = new URL(href, location.href);
  if (u.origin !== location.origin || u.searchParams.has('t')) return href;
  u.searchParams.set('t', DEMO_T);
  return u.pathname.split('/').pop() + u.search + u.hash;
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]'), h = a && a.getAttribute('href');
  if (!h || !DEMO_T || a.target === '_blank' || /^(https?:|tel:|mailto:|#|blob:)/.test(h)) return;
  a.setAttribute('href', withT(h));
}, true);

/* ---------- toast ---------- */
const toastEl = el('div', { class: 'toast', role: 'status' });
document.body.append(toastEl);
let toastTimer;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400); }

/* ---------- header: is the nearest branch open? ---------- */
function paintLive(n, b) { const st = branchStatus(b); n.classList.toggle('closed', !st.open); n.replaceChildren(el('i'), el('span', {}, liveLine(b))); }
// the header shows the branch booking starts at: the nearest once shared, else JP Nagar
$$('[data-live]').forEach(n => paintLive(n, BRANCHES[nearestIndex()]));

/* ---------- dialogs (sheets, the photo viewer): while closed one can't be reached and is out of the accessibility
   tree; while open, the rest of the page can't be reached, so aria-modal holds ---------- */
function setModal(dialog, open) {
  dialog.inert = !open; dialog.toggleAttribute('aria-hidden', !open);
  if (open) {
    dialog._inerted = [...document.body.children].filter(n => n !== dialog && !n.contains(dialog) && !n.inert && n.tagName !== 'SCRIPT' && !n.matches('.toast, .scrim'));
    dialog._inerted.forEach(n => { n.inert = true; });
  } else if (dialog._inerted) { dialog._inerted.forEach(n => { n.inert = false; }); dialog._inerted = null; }
}

/* ---------- dock: equal items, a sliding indicator that remembers where you came from ---------- */
const DOCK = [['home', 'Home', 'home.html'], ['services', 'Services', 'services.html'], ['book', 'Book', 'book.html'], ['branches', 'Branches', 'branches.html'], ['team', 'Team', 'team.html']];
$$('nav.dock').forEach(nav => {
  const idx = DOCK.findIndex(d => d[0] === nav.dataset.active);
  const ind = el('span', { class: 'ind', 'aria-hidden': 'true' });
  nav.setAttribute('aria-label', 'Main');
  // optimistic: the highlight moves to the clicked item straight away and the page changes a beat later
  const links = DOCK.map(([k, label, href], i) => {
    const a = el('a', { href, 'aria-current': i === idx ? 'page' : null }, icon(k), el('span', {}, label));
    a.addEventListener('click', e => {
      if (i === idx || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
      e.preventDefault();
      mark(i); place(i, !reduceMotion);
      setTimeout(() => location.assign(a.href), reduceMotion ? 0 : 140);
    });
    return a;
  });
  nav.replaceChildren(ind, ...links);
  const mark = i => links.forEach((l, j) => { if (j === i) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current'); });
  // the items are equal (86px), so the width is set once and the highlight only slides
  const place = (i, animate) => {
    const a = links[i]; ind.style.transition = animate ? '' : 'none';
    if (!ind.style.width || !animate) ind.style.width = a.offsetWidth + 'px';
    ind.style.transform = `translateX(${a.offsetLeft - 6}px)`;
  };
  if (idx >= 0) requestAnimationFrame(() => place(idx, false));
  addEventListener('resize', () => idx >= 0 && place(idx, false));
  // back to this page from the browser's memory: the highlight returns to this page's item
  addEventListener('pageshow', e => { if (e.persisted && idx >= 0) { mark(idx); place(idx, false); } });
  // the icons swell toward the pointer, like a desktop dock
  if (!reduceMotion && canHover) {
    const svgs = links.map(a => a.querySelector('svg'));
    nav.addEventListener('pointermove', e => svgs.forEach(s => {
      const r = s.getBoundingClientRect(), k = Math.max(0, 1 - Math.abs(e.clientX - (r.left + r.width / 2)) / 130);
      s.style.transform = `translateY(${(-4 * k).toFixed(2)}px) scale(${(1 + .22 * k).toFixed(3)})`;
    }));
    nav.addEventListener('pointerleave', () => svgs.forEach(s => { s.style.transform = ''; }));
  }
});

/* ---------- preload: the dock's pages are fetched once this page has settled, and any page as the pointer reaches its
   link, so moving around the site doesn't wait on the network ---------- */
(() => {
  if (!$('nav.dock') || (navigator.connection && navigator.connection.saveData)) return;
  const got = new Set([location.pathname]);
  const fetchPage = href => {
    let u; try { u = new URL(href, location.href); } catch (_) { return; }
    if (u.origin !== location.origin || !u.pathname.endsWith('.html') || got.has(u.pathname)) return;
    got.add(u.pathname);
    fetch(u.pathname, { credentials: 'same-origin', priority: 'low' }).catch(() => {});
  };
  const ahead = () => DOCK.forEach(d => fetchPage(d[2]));
  addEventListener('load', () => ('requestIdleCallback' in window ? requestIdleCallback(ahead, { timeout: 3000 }) : setTimeout(ahead, 1200)), { once: true });
  const near = e => { const a = e.target.closest && e.target.closest('a[href]'); if (a) fetchPage(a.getAttribute('href')); };
  addEventListener('pointerover', near, { passive: true });
  addEventListener('pointerdown', near, { passive: true, capture: true });
})();

/* ---------- call and WhatsApp float in once the header's own links scroll away ---------- */
$$('.fab').forEach(f => {
  f.replaceChildren(
    el('a', { href: PHONE_TEL, 'aria-label': `Call ${PHONE}` }, icon('phone'), el('span', {}, PHONE)),
    el('a', { href: WA, target: '_blank', rel: 'noopener', 'aria-label': 'WhatsApp the clinic' }, icon('whatsapp'), el('span', {}, 'WhatsApp us')));
  const hd = $('.hd');
  if (!hd) { f.classList.add('show'); return; }
  new IntersectionObserver(([e]) => f.classList.toggle('show', !e.isIntersecting)).observe(hd);
});

/* ---------- footer ---------- */
$$('[data-footer]').forEach(ft => {
  const base = el('div', { class: 'ft-base' },
    el('span', {}, `© ${nowIST().getFullYear()} J.P. Nagar Medical & Physiotherapy Centre`),
    el('span', {}, 'Demo: photos, reviews, distances and taken slots are samples'));
  if (ft.dataset.footer === 'slim') { ft.classList.add('ft--slim'); ft.replaceChildren(el('div', { class: 'wrap' }, base)); return; }
  const brand = el('div', { class: 'ft-brand' },
    el('img', { src: '../canon/logo.webp', alt: 'J.P. Nagar Medical & Physiotherapy Centre' }),
    el('p', {}, 'Physiotherapy only, since 2012. Founder-led by Dr. P. Senthil (PT), with three branches in South Bangalore.'),
    el('div', { class: 'ft-contact' }, el('a', { href: PHONE_TEL }, PHONE), el('a', { href: 'mailto:jpnagarmedicalandphysio@gmail.com' }, 'jpnagarmedicalandphysio@gmail.com')));
  const cols = BRANCHES.map(b => el('div', { class: 'ft-br' },
    el('h3', {}, b.name), el('address', {}, b.addr), el('p', {}, weekText(b)),
    el('div', { class: 'row' }, el('a', { href: `tel:${b.phone}` }, b.phoneText), el('a', { href: mapsLink(b), target: '_blank', rel: 'noopener' }, 'Directions'))));
  const svcs = el('nav', { class: 'ft-svcs', 'aria-label': 'Services' }, ...SERVICES.map(s => el('a', { href: s.page || `services.html#${s.id}` }, s.name)));
  ft.replaceChildren(el('div', { class: 'wrap' }, el('div', { class: 'ft-grid' }, brand, ...cols), svcs, base));
});

paintIcons();

/* ---------- small behaviours ---------- */
// only what starts below the screen reveals as it scrolls in; what is on screen when the page opens is simply there,
// so arriving on a page never looks like it changed a moment later
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .25 });
const showSettled = n => { n.classList.add('in', 'no-motion'); requestAnimationFrame(() => requestAnimationFrame(() => n.classList.remove('no-motion'))); };
$$('[data-inview]').forEach(n => (n.getBoundingClientRect().top < innerHeight ? showSettled(n) : io.observe(n)));
function tilt(c, max = 8) {
  if (reduceMotion || !canHover) return;
  c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    c.style.transform = `perspective(900px) rotateY(${(x * max).toFixed(2)}deg) rotateX(${(-y * max).toFixed(2)}deg)`;
  });
  c.addEventListener('pointerleave', () => { c.style.transform = ''; });
}
function degChips(list, focusable) { return el('span', { class: 'deg' }, ...list.map(d => el('em', { 'data-tip': DEGREES[d] || d, tabindex: focusable ? '0' : null }, d))); }
function tickList(items) { return el('ul', { class: 'ticks' }, ...items.map(x => el('li', {}, icon('tick'), el('span', {}, x)))); }

/* ---------- side drawer: profiles on the team and booking pages ---------- */
const drawer = (() => {
  let scrim, box, body, opener;
  function build() {
    scrim = el('div', { class: 'scrim' });
    const x = el('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Close' }, icon('close'));
    body = el('div', { class: 'drawer-body' });
    box = el('aside', { class: 'drawer', role: 'dialog', 'aria-modal': 'true' }, el('div', { class: 'drawer-bar' }, x), body);
    document.body.append(scrim, box);
    scrim.addEventListener('click', close); x.addEventListener('click', close);
    addEventListener('keydown', e => { if (e.key === 'Escape' && box.classList.contains('is-open')) close(); });
  }
  function open(label, ...nodes) {
    if (!box) build();
    opener = document.activeElement;
    box.setAttribute('aria-label', label); body.replaceChildren(...nodes); body.scrollTop = 0;
    $$('body > *').forEach(n => { if (n !== box && n !== scrim && n !== toastEl) n.inert = true; });
    box.classList.add('is-open'); scrim.classList.add('is-open'); document.documentElement.classList.add('locked');
    box.querySelector('.iconbtn').focus();
  }
  function close() {
    if (!box) return;
    $$('body > *').forEach(n => { n.inert = false; });
    box.classList.remove('is-open'); scrim.classList.remove('is-open'); document.documentElement.classList.remove('locked');
    if (opener && opener.focus) opener.focus();
  }
  return { open, close };
})();
function profile(t, action) {
  return el('article', { class: 'pf' },
    el('div', { class: 'pf-who' }, (() => { const p = el('div', { class: 'photo', role: 'img', 'aria-label': t.photo ? `Photo of ${t.short}` : `Photo of ${t.short} (to be shot)` }); if (typeof paintPhoto === 'function') paintPhoto(p, t.photo); return p; })(),
      el('div', {}, el('h2', {}, t.name), el('p', { class: 'role' }, t.role + (t.years ? ` · ${t.years}` : '')), degChips(t.deg, true))),
    el('h3', {}, 'Treats'), tickList(t.treat), el('h3', {}, 'Background'), tickList(t.bg), action);
}

/* ---------- day picker: three weeks from this Monday; days the branch doesn't work and past days are off ---------- */
// Built once, then updated in place on every pick: the grid never rebuilds, so nothing flickers or loses focus
function calendar(root, { selected, isOpen, onPick, works = d => d.getDay() !== 0, worksText = 'Mon–Sat' }) {
  const today = startOfDay(nowIST()), start = addDays(today, -((today.getDay() + 6) % 7));
  root._pick = onPick;
  if (root._start !== +start) {
    const days = [...Array(21)].map((_, i) => addDays(start, i)), last = days[20];
    const title = today.getMonth() === last.getMonth() ? `${MONTHS_LONG[today.getMonth()]} ${today.getFullYear()}` : `${MONTHS[today.getMonth()]} – ${MONTHS[last.getMonth()]} ${last.getFullYear()}`;
    root._cells = days.map(d => {
      const b = el('button', { type: 'button', class: [sameDay(d, today) && 'today', !works(d) && 'sun'].filter(Boolean).join(' ') || null }, String(d.getDate()));
      b.addEventListener('click', () => root._pick(d));
      return [b, d];
    });
    root.replaceChildren(el('div', { class: 'cal-head' }, el('b', {}, title), el('small', { 'data-works': '' }, worksText)),
      el('div', { class: 'cal', role: 'group', 'aria-label': 'Choose a day' }, ...['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => el('span', { class: 'dow', 'aria-hidden': 'true' }, d)), ...root._cells.map(c => c[0])));
    root._start = +start;
  }
  root.querySelector('[data-works]').textContent = worksText;
  root._cells.forEach(([b, d]) => {
    const past = d < today, off = !works(d), ok = !past && !off && isOpen(d);
    b.classList.toggle('sun', off);
    const why = off ? `Closed on ${DAYS[d.getDay()]}s` : past ? null : ok ? null : 'No times left';
    b.setAttribute('aria-pressed', String(sameDay(d, selected)));
    b.setAttribute('aria-label', `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS_LONG[d.getMonth()]}${why ? `, ${why.toLowerCase()}` : ''}`);
    if (why && !past) b.dataset.tip = why; else delete b.dataset.tip;
    b.disabled = !ok;
  });
}

/* ---------- the booking hand-off between pages ---------- */
function saveBooking(b) { try { sessionStorage.setItem('jp-booking', JSON.stringify(b)); } catch (_) {} }
function loadBooking() { try { return JSON.parse(sessionStorage.getItem('jp-booking') || 'null'); } catch (_) { return null; } }

const TYPE = { neck: 'neck', shoulder: 'shoulder', upper: 'upper back', lower: 'lower back', elbow: 'elbow', hand: 'wrist & hand', hip: 'hip', knee: 'knee', foot: 'ankle & foot' };
const TORSO = { front: { upper: 'Chest', lower: 'Stomach' }, back: { upper: 'Upper back', lower: 'Lower back' } };
// From the back the viewer's left is the person's left; from the front it is their right.
function sideOf(face, pos) { return pos ? ((face === 'back') === (pos === 'a') ? 'left' : 'right') : ''; }
// Every spot belongs to one face: the back of the hip is a different choice from the front of the hip.
// Keys look like "hip-left~back", "neck~front", "upper~back".
function spotKey(face, type, pos) { const s = sideOf(face, pos); return `${type}${s ? '-' + s : ''}~${face}`; }
function labelOf(key) {
  const [base, face] = key.split('~'), [type, side] = base.split('-');
  if (TORSO[face][type]) return TORSO[face][type];
  const name = TYPE[type];
  return side ? `${side[0].toUpperCase() + side.slice(1)} ${name} (${face})` : `${name[0].toUpperCase() + name.slice(1)} (${face})`;
}
function keyXY(gender, key) {
  const [base, face] = key.split('~'), [type, side] = base.split('-');
  if (!side) return spotXY(gender, type);
  return spotXY(gender, type, (face === 'back') === (side === 'left') ? 'a' : 'b');
}
// small front or back figure with a dot on each chosen spot, for the ticket
function miniFigure(gender, face, keys) {
  const p = gender === 'female' ? 'f' : 'm', mine = keys.filter(k => k.endsWith('~' + face));
  // porcelain, a shade deeper than the body map so it reads on the ticket's grey panel; no SVG filter, because Safari
  // won't draw one inside the ticket (it has its own shadow and cut-out notches) and the figure would vanish
  const gid = `tkSkin-${face}`, defs = `<defs><linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="480"><stop offset="0" stop-color="#DCE0EB"/><stop offset="1" stop-color="#BFC5D6"/></linearGradient></defs>`;
  const hair = `<use href="#${p}-hair" fill="#A9B0C6"/>`, skin = `<use href="#${p}-body" fill="url(#${gid})" stroke="#AEB4C8" stroke-width="2.5"/>`;
  const body = face === 'front' ? hair + skin : skin + hair;
  const dots = mine.map(k => { const [x, y] = keyXY(gender, k); return `<circle cx="${x}" cy="${y}" r="30" fill="rgba(0,168,236,.25)"/><circle cx="${x}" cy="${y}" r="13" fill="#00A8EC" stroke="#fff" stroke-width="5"/>`; }).join('');
  return el('figure', { class: mine.length ? null : 'none' }, svgEl({ viewBox: '0 0 240 480', 'aria-hidden': 'true' }, defs + body + dots), el('figcaption', {}, face === 'front' ? 'Front' : 'Back'));
}
// likely care for what was tapped or picked (a sample mapping until the clinic confirms it)
const CARE = {
  neck: ['Spine & Back Care', 'Orthopaedic'], shoulder: ['Orthopaedic', 'Sports', 'Post-Operative Rehab'],
  upper: ['Spine & Back Care', 'Orthopaedic'], lower: ['Spine & Back Care', 'Orthopaedic', 'Women’s Health'],
  elbow: ['Orthopaedic', 'Sports'], hand: ['Orthopaedic', 'Post-Operative Rehab'], hip: ['Orthopaedic', 'Joint Replacement Rehab', 'Geriatric'],
  knee: ['Orthopaedic', 'Sports', 'Joint Replacement Rehab'], foot: ['Sports', 'Orthopaedic'],
  surgery: ['Post-Operative Rehab'], neuro: ['Neurological'], child: ['Paediatric'], elder: ['Geriatric', 'Home Care'], women: ['Women’s Health']
};
const REASON = { surgery: 'After surgery', neuro: 'Stroke or nerve problem', child: 'For my child', elder: 'For an elderly parent', women: 'Pregnancy or after delivery' };

function arriveBy(t) { return timeText(t - 1 / 6); }
// fits the ticket's side notches onto its perforations
// (only when a notch has actually moved: the notches are the ticket's mask, and resetting it makes Safari redraw the
// whole ticket, shadow and all, on every change)
function fitNotches(tk) { $$('.tk-perf', tk).forEach((p, i) => { const k = `--n${i + 1}`, v = (p.offsetTop + 1) + 'px'; if (tk.style.getPropertyValue(k) !== v) tk.style.setProperty(k, v); }); }
