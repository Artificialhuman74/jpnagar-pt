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

/* ---------- clinic data (same sample set as the mobile demo) ---------- */
// Coordinates are approximate locality pins until the clinic confirms exact ones.
const BRANCHES = [
  { id: 'arekere', code: 'ARK', name: 'Arekere MICO Layout', short: 'Arekere', sessions: [[9, 13], [16, 21]], lat: 12.8886, lng: 77.6022,
    addr: 'No. 129, 1st Floor, Lakshmi Nivas, 3rd Cross, near L&T South City, Bannerghatta Main Rd, Arekere MICO Layout 2nd Stage, Bengaluru 560076',
    phone: '+918026489922', phoneText: '080 2648 9922', landmark: 'Near L&T South City' },
  { id: 'bannerghatta', code: 'BGR', name: 'Bannerghatta Road', short: 'Bannerghatta', sessions: [[8, 12], [16, 20]], lat: 12.8775, lng: 77.5975,
    addr: 'No. 22, 1st Floor, above Greens Vegetable Shop, behind Meenakshi Temple, Classic Orchards Layout, Kalena Agrahara, Bengaluru 560076',
    phone: '+919916116625', phoneText: '+91 99161 16625', landmark: 'Behind Meenakshi Temple' },
  { id: 'jpnagar', code: 'JPN', name: 'JP Nagar 7th Phase', short: 'JP Nagar', sessions: [[9, 13], [17, 21]], lat: 12.8937, lng: 77.5855,
    addr: 'No. 2/8, 1st Floor, Puttenahalli Rd, opp. Govt. Primary School, JP Nagar 7th Phase, Bengaluru 560078',
    phone: '+918026656988', phoneText: '080 2665 6988', landmark: 'Opposite Govt. Primary School' }
];
const AREAS = [
  ['JP Nagar', 12.9063, 77.5857, '560078'], ['Arekere', 12.8869, 77.5998, '560076'], ['Hulimavu', 12.8775, 77.6011, '560076'], ['BTM Layout', 12.9166, 77.6101, '560068'],
  ['Bannerghatta Road', 12.8890, 77.5970, '560076'], ['Gottigere', 12.8569, 77.5880, '560083'], ['Jayanagar', 12.9299, 77.5824, '560041'], ['Bilekahalli', 12.8986, 77.6050, '560076']
];
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
const DEGREES = {
  MPT: 'Master of Physiotherapy', BPT: 'Bachelor of Physiotherapy', COMT: 'Certified Orthopaedic Manual Therapist',
  MIAP: 'Member, Indian Association of Physiotherapists', 'MD(A.M)': 'MD in Alternative Medicine', 'D.ACU': 'Diploma in Acupuncture'
};
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

/* ---------- time in India (?t=16:40 pins the clock for demos) ---------- */
const DEMO_T = new URLSearchParams(location.search).get('t');
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad = n => String(n).padStart(2, '0');
function nowIST() {
  const d = new Date(), ist = new Date(d.getTime() + (330 + d.getTimezoneOffset()) * 60000);
  if (DEMO_T) { const [h, m] = DEMO_T.split(':').map(Number); ist.setHours(h, m || 0, 0, 0); }
  return ist;
}
function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function sameDay(a, b) { return !!a && !!b && a.toDateString() === b.toDateString(); }
function isToday(d) { return sameDay(d, nowIST()); }
function dayISO(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function fromISO(s) { const m = (s || '').match(/^(\d{4})-(\d\d)-(\d\d)$/); return m ? new Date(+m[1], m[2] - 1, +m[3]) : null; }
function dayShort(d) {
  if (isToday(d)) return `Today, ${DOW[d.getDay()]} ${d.getDate()}`;
  if (sameDay(d, addDays(nowIST(), 1))) return `Tomorrow, ${DOW[d.getDay()]} ${d.getDate()}`;
  return `${DOW[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
function dayLong(d) { return `${isToday(d) ? 'Today · ' : ''}${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; }
function fmtHour(h) { const hh = Math.floor(h), m = Math.round((h - hh) * 60), p = hh >= 12 ? 'pm' : 'am', x = hh % 12 || 12; return m ? `${x}:${pad(m)} ${p}` : `${x} ${p}`; }
function timeText(t) { const h = Math.floor(t), m = Math.round((t - h) * 60); return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'pm' : 'am'}`; }
function hoursText(b) { return b.sessions.map(([s, e]) => `${fmtHour(s)}–${fmtHour(e)}`).join(', '); }
// the same hours, but each session stays on one line when it wraps
function hoursNodes(b) { return b.sessions.flatMap(([s, e], i) => [i ? ' ' : null, el('span', { class: 'nw' }, `${fmtHour(s)}–${fmtHour(e)}${i < b.sessions.length - 1 ? ',' : ''}`)]); }
function branchStatus(b, d = nowIST()) {
  const h = d.getHours() + d.getMinutes() / 60;
  if (d.getDay() !== 0) {
    for (const [s, e] of b.sessions) if (h >= s && h < e) return { open: true, text: `Open now · till ${fmtHour(e)}` };
    for (const [s] of b.sessions) if (h < s) return { open: false, text: `Opens ${fmtHour(s)} today` };
  }
  return { open: false, text: `Closed · opens ${d.getDay() === 6 ? 'Mon' : 'tomorrow'} ${fmtHour(b.sessions[0][0])}` };
}
function liveLine(b) { const st = branchStatus(b); return st.open ? `${b.short} open now · till ${st.text.split('till ')[1]}` : `${b.short} ${st.text[0].toLowerCase()}${st.text.slice(1)}`; }
function hash(s) { let x = 0; for (const c of s) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x; }
// Slots every 30 minutes; some marked taken (sample data); past times today are left out.
function slotsFor(b, day, si) {
  const [s, e] = b.sessions[si], now = nowIST(), today = sameDay(day, now), out = [];
  for (let t = s; t < e; t += .5) {
    if (today && t <= now.getHours() + now.getMinutes() / 60 + .25) continue;
    const hh = Math.floor(t) % 12 || 12;
    out.push({ t, label: `${hh}:${t % 1 ? '30' : '00'}`, suffix: t >= 12 ? 'pm' : 'am', taken: hash(b.id + day.toDateString() + t) % 4 === 0 });
  }
  return out;
}
function freeSlots(b, day) { return day.getDay() === 0 ? [] : b.sessions.flatMap((_, si) => slotsFor(b, day, si)).filter(s => !s.taken); }
function firstOpenDay(b) { const d0 = startOfDay(nowIST()); for (let i = 0; i < 14; i++) { const d = addDays(d0, i); if (freeSlots(b, d).length) return d; } return addDays(d0, 1); }
/* ---------- distances: never guessed. They appear only once the visitor has said where they are (on Branches),
   and are kept for the rest of the visit ---------- */
function savedKm() { try { return JSON.parse(sessionStorage.getItem('jp-km') || 'null'); } catch (_) { return null; } }
function saveKm(km) { try { sessionStorage.setItem('jp-km', JSON.stringify(km)); } catch (_) {} }
function kmText(b) { const k = savedKm(); return k && k[b.id] != null ? `${k[b.id].toFixed(1)} km` : ''; }
function nearestIndex() { const k = savedKm(); if (!k) return 0; return BRANCHES.reduce((best, b, i) => (k[b.id] < k[BRANCHES[best].id] ? i : best), 0); }
function kmBetween(a, b, c, d) {
  const r = x => x * Math.PI / 180, h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}
function mapsLink(b) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('J.P. Nagar Medical and Physiotherapy Centre ' + b.name)}`; }

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
$$('[data-live]').forEach(n => paintLive(n, BRANCHES[0]));

/* ---------- dock: equal items, a sliding indicator that remembers where you came from ---------- */
const DOCK = [['home', 'Home', 'home.html'], ['services', 'Services', 'services.html'], ['book', 'Book', 'book.html'], ['branches', 'Branches', 'branches.html'], ['team', 'Team', 'team.html']];
$$('nav.dock').forEach(nav => {
  const idx = DOCK.findIndex(d => d[0] === nav.dataset.active);
  const ind = el('span', { class: 'ind', 'aria-hidden': 'true' });
  nav.setAttribute('aria-label', 'Main');
  const links = DOCK.map(([k, label, href], i) => {
    const a = el('a', { href, 'aria-current': i === idx ? 'page' : null }, icon(k), el('span', {}, label));
    a.addEventListener('click', () => { try { sessionStorage.setItem('dockFrom', String(idx)); } catch (_) {} });
    return a;
  });
  nav.replaceChildren(ind, ...links);
  const place = (i, animate) => {
    const a = links[i]; ind.style.transition = animate ? '' : 'none';
    ind.style.width = a.offsetWidth + 'px'; ind.style.transform = `translateX(${a.offsetLeft - 6}px)`;
  };
  let from = idx;
  try { const f = sessionStorage.getItem('dockFrom'); if (f !== null && +f >= 0) from = +f; sessionStorage.removeItem('dockFrom'); } catch (_) {}
  requestAnimationFrame(() => { place(from, false); requestAnimationFrame(() => requestAnimationFrame(() => place(idx, !reduceMotion))); });
  addEventListener('resize', () => place(idx, false));
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
    el('h3', {}, b.name), el('address', {}, b.addr), el('p', {}, `Mon–Sat · ${hoursText(b)}`),
    el('div', { class: 'row' }, el('a', { href: `tel:${b.phone}` }, b.phoneText), el('a', { href: mapsLink(b), target: '_blank', rel: 'noopener' }, 'Directions'))));
  const svcs = el('nav', { class: 'ft-svcs', 'aria-label': 'Services' }, ...SERVICES.map(s => el('a', { href: s.page || `services.html#${s.id}` }, s.name)));
  ft.replaceChildren(el('div', { class: 'wrap' }, el('div', { class: 'ft-grid' }, brand, ...cols), svcs, base));
});

paintIcons();

/* ---------- small behaviours ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .25 });
$$('[data-inview]').forEach(n => io.observe(n));
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

/* ---------- day picker: three weeks from this Monday; Sundays and past days are off ---------- */
// Built once, then updated in place on every pick: the grid never rebuilds, so nothing flickers or loses focus
function calendar(root, { selected, isOpen, onPick }) {
  const today = startOfDay(nowIST()), start = addDays(today, -((today.getDay() + 6) % 7));
  root._pick = onPick;
  if (root._start !== +start) {
    const days = [...Array(21)].map((_, i) => addDays(start, i)), last = days[20];
    const title = today.getMonth() === last.getMonth() ? `${MONTHS_LONG[today.getMonth()]} ${today.getFullYear()}` : `${MONTHS[today.getMonth()]} – ${MONTHS[last.getMonth()]} ${last.getFullYear()}`;
    root._cells = days.map(d => {
      const b = el('button', { type: 'button', class: [sameDay(d, today) && 'today', d.getDay() === 0 && 'sun'].filter(Boolean).join(' ') || null }, String(d.getDate()));
      b.addEventListener('click', () => root._pick(d));
      return [b, d];
    });
    root.replaceChildren(el('div', { class: 'cal-head' }, el('b', {}, title), el('small', {}, 'Mon–Sat')),
      el('div', { class: 'cal', role: 'group', 'aria-label': 'Choose a day' }, ...['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => el('span', { class: 'dow', 'aria-hidden': 'true' }, d)), ...root._cells.map(c => c[0])));
    root._start = +start;
  }
  root._cells.forEach(([b, d]) => {
    const past = d < today, sun = d.getDay() === 0, ok = !past && !sun && isOpen(d);
    const why = sun ? 'Closed on Sundays' : past ? null : ok ? null : 'No times left';
    b.setAttribute('aria-pressed', String(sameDay(d, selected)));
    b.setAttribute('aria-label', `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS_LONG[d.getMonth()]}${why ? `, ${why.toLowerCase()}` : ''}`);
    if (why && !past) b.dataset.tip = why; else delete b.dataset.tip;
    b.disabled = !ok;
  });
}

/* ---------- the booking hand-off between pages ---------- */
function saveBooking(b) { try { sessionStorage.setItem('jp-booking', JSON.stringify(b)); } catch (_) {} }
function loadBooking() { try { return JSON.parse(sessionStorage.getItem('jp-booking') || 'null'); } catch (_) { return null; } }

/* ---------- the body figure (2D, front and back; male and female) ---------- */
const FIG_DEFS = `
<linearGradient id="skin" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="480"><stop offset="0" stop-color="#F1F3F9"/><stop offset="1" stop-color="#D9DDEA"/></linearGradient>
<linearGradient id="hair" gradientUnits="userSpaceOnUse" x1="0" y1="10" x2="0" y2="96"><stop offset="0" stop-color="#C3C8D9"/><stop offset="1" stop-color="#AEB4C9"/></linearGradient>
<filter id="vol" x="-15%" y="-8%" width="130%" height="116%" color-interpolation-filters="sRGB">
<feOffset in="SourceAlpha" dx="-7" dy="-5"/><feGaussianBlur stdDeviation="7" result="ob"/>
<feComposite in="SourceAlpha" in2="ob" operator="out" result="shadeMask"/>
<feFlood flood-color="#2B3192" flood-opacity=".2"/><feComposite in2="shadeMask" operator="in" result="shade"/>
<feOffset in="SourceAlpha" dx="5" dy="4"/><feGaussianBlur stdDeviation="5" result="hb"/>
<feComposite in="SourceAlpha" in2="hb" operator="out" result="hiMask"/>
<feFlood flood-color="#FFFFFF" flood-opacity=".9"/><feComposite in2="hiMask" operator="in" result="hi"/>
<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="shade"/><feMergeNode in="hi"/></feMerge>
</filter>
<g id="m-body"><ellipse cx="120" cy="42" rx="22" ry="28"/><ellipse cx="97.5" cy="45" rx="4" ry="7"/><ellipse cx="142.5" cy="45" rx="4" ry="7"/><path d="M110 64 L130 64 L133 88 L107 88 Z"/><path d="M107 86 C96 89 80 91 72 98 C66 104 66 114 70 124 L77 148 C81 164 85 174 86 182 C84 196 81 210 82 224 L120 246 L158 224 C159 210 156 196 154 182 C155 174 159 164 163 148 L170 124 C174 114 174 104 168 98 C160 91 144 89 133 86 Z"/><path d="M70 101 C60 114 56 140 56 170 C54 196 51 218 48 240 L61 242 C64 220 67 198 70 176 C73 152 77 132 80 122 Z"/><path d="M170 101 C180 114 184 140 184 170 C186 196 189 218 192 240 L179 242 C176 220 173 198 170 176 C167 152 163 132 160 122 Z"/><ellipse cx="54" cy="256" rx="8.5" ry="16" transform="rotate(8 54 256)"/><ellipse cx="186" cy="256" rx="8.5" ry="16" transform="rotate(-8 186 256)"/><path d="M82 216 C78 262 82 298 86 330 C88 362 90 396 92 428 L106 428 C106 396 108 362 110 330 C114 300 119 276 119 244 Z"/><path d="M158 216 C162 262 158 298 154 330 C152 362 150 396 148 428 L134 428 C134 396 132 362 130 330 C126 300 121 276 121 244 Z"/></g>
<path id="m-hair" d="M97 44 C95 12 145 12 143 44 C143 56 139 65 133 70 L107 70 C101 65 97 56 97 44 Z"/>
<path id="m-fringe" d="M98 40 C97 13 143 13 142 40 C137 29 129 25 120 25 C111 25 103 29 98 40 Z"/>
<g id="f-body"><ellipse cx="120" cy="43" rx="20" ry="27"/><ellipse cx="100" cy="46" rx="3.5" ry="6"/><ellipse cx="140" cy="46" rx="3.5" ry="6"/><path d="M112 64 L128 64 L130 88 L110 88 Z"/><path d="M110 86 C100 89 88 91 81 98 C76 104 76 114 79 124 L85 148 C89 162 92 170 92 178 C89 194 80 208 78 222 L120 248 L162 222 C160 208 151 194 148 178 C148 170 151 162 155 148 L161 124 C164 114 164 104 159 98 C152 91 140 89 130 86 Z"/><path d="M79 101 C70 116 66 142 66 170 C64 196 61 218 58 240 L70 242 C73 220 76 198 78 176 C81 152 84 134 87 122 Z"/><path d="M161 101 C170 116 174 142 174 170 C176 196 179 218 182 240 L170 242 C167 220 164 198 162 176 C159 152 156 134 153 122 Z"/><ellipse cx="63" cy="256" rx="7.5" ry="14.5" transform="rotate(8 63 256)"/><ellipse cx="177" cy="256" rx="7.5" ry="14.5" transform="rotate(-8 177 256)"/><path d="M78 218 C73 264 79 300 87 332 C89 364 92 398 94 428 L106 428 C106 398 108 364 110 332 C114 302 119 280 119 248 Z"/><path d="M162 218 C167 264 161 300 153 332 C151 364 148 398 146 428 L134 428 C134 398 132 364 130 332 C126 302 121 280 121 248 Z"/></g>
<path id="f-hair" d="M99 44 C97 13 143 13 141 44 C142 62 146 80 149 92 C146 99 135 102 120 102 C105 102 94 99 91 92 C94 80 98 62 99 44 Z"/>
<path id="f-fringe" d="M100 42 C99 15 141 15 140 42 C136 31 130 27 122 27 C114 30 106 33 100 42 Z"/>`;
function ensureFigDefs() {
  if ($('#fig-defs')) return;
  document.body.prepend(svgEl({ id: 'fig-defs', width: '0', height: '0', 'aria-hidden': 'true', focusable: 'false', style: 'position:absolute' }, `<defs>${FIG_DEFS}</defs>`));
}
const LINES = 'fill="none" stroke="#B2B8CC" stroke-width="1.5" stroke-linecap="round"';
const FIG = {
  male: {
    front: `<use filter="url(#vol)" fill="url(#hair)" href="#m-hair"/><g filter="url(#vol)" fill="url(#skin)"><use href="#m-body"/><ellipse cx="97" cy="438" rx="13" ry="9"/><ellipse cx="143" cy="438" rx="13" ry="9"/></g><use filter="url(#vol)" fill="url(#hair)" href="#m-fringe"/><g ${LINES}><path d="M104 93 C96 96 86 97 79 99"/><path d="M136 93 C144 96 154 97 161 99"/><path d="M90 130 C100 142 113 142 119 135"/><path d="M150 130 C140 142 127 142 121 135"/><path d="M120 150 L120 176"/><path d="M92 214 C104 226 114 238 120 244"/><path d="M148 214 C136 226 126 238 120 244"/><path d="M92 327 C95 320 104 320 106 328"/><path d="M148 327 C145 320 136 320 134 328"/></g>`,
    back: `<g filter="url(#vol)" fill="url(#skin)"><use href="#m-body"/><ellipse cx="99" cy="434" rx="9" ry="8"/><ellipse cx="141" cy="434" rx="9" ry="8"/></g><use filter="url(#vol)" fill="url(#hair)" href="#m-hair"/><g ${LINES}><path d="M120 90 L120 210" stroke-dasharray="2 5"/><path d="M96 110 C91 122 93 136 104 144"/><path d="M144 110 C149 122 147 136 136 144"/><path d="M120 218 L120 240"/><path d="M88 236 C95 249 111 251 119 243"/><path d="M152 236 C145 249 129 251 121 243"/><path d="M93 334 C97 337 103 337 107 334"/><path d="M147 334 C143 337 137 337 133 334"/></g>`
  },
  female: {
    front: `<use filter="url(#vol)" fill="url(#hair)" href="#f-hair"/><g filter="url(#vol)" fill="url(#skin)"><use href="#f-body"/><ellipse cx="99" cy="438" rx="11" ry="8"/><ellipse cx="141" cy="438" rx="11" ry="8"/></g><use filter="url(#vol)" fill="url(#hair)" href="#f-fringe"/><g ${LINES}><path d="M108 93 C100 96 92 97 86 99"/><path d="M132 93 C140 96 148 97 154 99"/><path d="M93 130 C98 145 112 147 118 138"/><path d="M147 130 C142 145 128 147 122 138"/><path d="M90 214 C103 228 114 240 120 248"/><path d="M150 214 C137 228 126 240 120 248"/><path d="M93 329 C96 322 104 322 106 330"/><path d="M147 329 C144 322 136 322 134 330"/></g>`,
    back: `<g filter="url(#vol)" fill="url(#skin)"><use href="#f-body"/><ellipse cx="100" cy="434" rx="8" ry="7"/><ellipse cx="140" cy="434" rx="8" ry="7"/></g><use filter="url(#vol)" fill="url(#hair)" href="#f-hair"/><g ${LINES}><path d="M120 104 L120 210" stroke-dasharray="2 5"/><path d="M100 112 C96 122 98 134 106 142"/><path d="M140 112 C144 122 142 134 134 142"/><path d="M120 220 L120 243"/><path d="M84 236 C92 252 110 254 119 246"/><path d="M156 236 C148 252 130 254 121 246"/><path d="M94 336 C98 339 103 339 107 336"/><path d="M146 336 C142 339 137 339 133 336"/></g>`
  }
};
// hotspots: [type, viewer side]; "a" is the viewer's left
const REGIONS = [['neck'], ['shoulder', 'a'], ['shoulder', 'b'], ['upper'], ['lower'], ['elbow', 'a'], ['elbow', 'b'], ['hand', 'a'], ['hand', 'b'], ['hip', 'a'], ['hip', 'b'], ['knee', 'a'], ['knee', 'b'], ['foot', 'a'], ['foot', 'b']];
const POS = {
  male: { neck: [120, 78], shoulder: [74, 106], upper: [120, 134], lower: [120, 194], elbow: [58, 174], hand: [54, 256], hip: [94, 226], knee: [97, 328], foot: [98, 434] },
  female: { neck: [120, 78], shoulder: [82, 106], upper: [120, 136], lower: [120, 196], elbow: [67, 174], hand: [63, 256], hip: [90, 228], knee: [98, 330], foot: [99, 434] }
};
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
function spotXY(gender, type, pos) { let [x, y] = POS[gender][type]; if (pos === 'b') x = 240 - x; return [x, y]; }
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

/* ---------- ticket bits shared by the booking preview and the printed ticket ---------- */
function bookingId(b, day, t) { const h = Math.floor(t), m = t % 1 ? 30 : 0; return `JP-${b.code}-${pad(day.getDate())}${pad(day.getMonth() + 1)}-${pad(h)}${pad(m)}`; }
function arriveBy(t) { return timeText(t - 1 / 6); }
// fits the ticket's side notches onto its perforations
function fitNotches(tk) { $$('.tk-perf', tk).forEach((p, i) => tk.style.setProperty(`--n${i + 1}`, (p.offsetTop + 1) + 'px')); }
// Code 128 (set B), so the stub carries a real barcode of the booking ID
const C128 = ['212222','222122','222221','121223','121322','131222','122213','122312','132212','221213','221312','231212','112232','122132','122231','113222','123122','123221','223211','221132','221231','213212','223112','312131','311222','321122','321221','312212','322112','322211','212123','212321','232121','111323','131123','131321','112313','132113','132311','211313','231113','231311','112133','112331','132131','113123','113321','133121','313121','211331','231131','213113','213311','213131','311123','311321','331121','312113','312311','332111','314111','221411','431111','111224','111422','121124','121421','141122','141221','112214','112412','122114','122411','142112','142211','241211','221114','413111','241112','134111','111242','121142','121241','114212','124112','124211','411212','421112','421211','212141','214121','412121','111143','111341','131141','114113','114311','411113','411311','113141','114131','311141','411131','211412','211214','211232','2331112'];
function drawBarcode(svg, text) {
  const vals = [104, ...[...text].map(c => c.charCodeAt(0) - 32)];
  const check = vals.reduce((sum, v, i) => sum + v * (i || 1), 0) % 103;
  const widths = [...vals, check, 106].map(v => C128[v]).join(''), quiet = 10, bars = [];
  let x = quiet;
  [...widths].forEach((w, i) => {
    if (i % 2 === 0) { const r = document.createElementNS(NS, 'rect'); [['x', x], ['y', 0], ['width', +w], ['height', 48]].forEach(([k, v]) => r.setAttribute(k, v)); bars.push(r); }
    x += +w;
  });
  svg.setAttribute('viewBox', `0 0 ${x + quiet} 48`); svg.setAttribute('preserveAspectRatio', 'none');
  svg.replaceChildren(...bars);
}
