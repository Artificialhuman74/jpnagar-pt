// Shared mock behaviour: icons, dock, floating buttons, live branch hours, reveal and tilt.
const ICON = {
  home: '<path d="M3.5 10.5 12 3.8l8.5 6.7V19a1.5 1.5 0 0 1-1.5 1.5h-4.2v-5.8H9.2v5.8H5A1.5 1.5 0 0 1 3.5 19z"/>',
  services: '<rect x="3.8" y="3.8" width="7" height="7" rx="2"/><rect x="13.2" y="3.8" width="7" height="7" rx="2"/><rect x="3.8" y="13.2" width="7" height="7" rx="2"/><rect x="13.2" y="13.2" width="7" height="7" rx="2"/>',
  book: '<rect x="3.8" y="5" width="16.4" height="15.2" rx="2.6"/><path d="M3.8 9.6h16.4M8.2 3v4M15.8 3v4M9 14.6l2.1 2.1 4-4"/>',
  branches: '<path d="M12 20.8s-6.6-5.8-6.6-11A6.6 6.6 0 0 1 18.6 9.8c0 5.2-6.6 11-6.6 11z"/><circle cx="12" cy="9.8" r="2.4"/>',
  team: '<circle cx="9" cy="8.2" r="3.2"/><path d="M3.4 19.6c0-3.2 2.5-5.6 5.6-5.6s5.6 2.4 5.6 5.6"/><path d="M15.6 5.1a3.1 3.1 0 0 1 0 6.2M17.6 14.3c1.8.6 3 2.5 3 5.3"/>',
  phone: '<path d="M5.2 3.6h3l1.6 4.1-2 1.3a10.6 10.6 0 0 0 7.2 7.2l1.3-2 4.1 1.6v3a1.6 1.6 0 0 1-1.6 1.6A16.4 16.4 0 0 1 3.6 5.2 1.6 1.6 0 0 1 5.2 3.6z"/>',
  whatsapp: '<path d="M4.2 19.8l1.1-3.9A8.2 8.2 0 1 1 8.4 19z"/><path d="M9.2 8.3c.2-.4.5-.5.8-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .5-.1.6l-.5.6c.6 1.1 1.5 2 2.6 2.6l.6-.5c.2-.2.4-.2.6-.1l1.6.7c.3.1.4.3.4.5v.5c0 .3-.1.6-.5.8-.6.4-1.4.6-2.2.3-2.3-.8-4.1-2.6-4.9-4.9-.3-.8-.1-1.6.3-2.2z"/>',
  tick: '<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.7 2.7L16.2 9.4"/>',
  star: '<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  arrow: '<path d="M4.5 12h15M13.5 6l6 6-6 6"/>',
  back: '<path d="m15 5-7 7 7 7"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  pin: '<path d="M12 20.8s-6.6-5.8-6.6-11A6.6 6.6 0 0 1 18.6 9.8c0 5.2-6.6 11-6.6 11z"/><circle cx="12" cy="9.8" r="2.4"/>',
  check: '<circle cx="12" cy="12" r="9.5"/><path d="m7.6 12.4 3 3 5.8-6.2"/>',
  turn: '<path d="M4.6 10.2A7.6 7.6 0 0 1 18 6.6l1.6 1.6"/><path d="M19.6 3.8v4.4h-4.4"/><path d="M19.4 13.8A7.6 7.6 0 0 1 6 17.4l-1.6-1.6"/><path d="M4.4 20.2v-4.4h4.4"/>',
  calendar: '<rect x="3.8" y="5" width="16.4" height="15.2" rx="2.6"/><path d="M3.8 9.6h16.4M8.2 3v4M15.8 3v4"/>'
};
const parser = new DOMParser();
function icon(name, fill) {
  const doc = parser.parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`,
    'image/svg+xml');
  return document.importNode(doc.documentElement, true);
}
function el(tag, attrs, ...kids) {
  const n = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, v));
  kids.forEach(k => n.append(k));
  return n;
}
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion) document.documentElement.classList.add('motion');

document.querySelectorAll('[data-icon]').forEach(n => n.replaceChildren(icon(n.dataset.icon, n.hasAttribute('data-fill'))));

/* ---------- toast ---------- */
const toastEl = el('div', { class: 'toast', role: 'status' });
document.body.append(toastEl);
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg; toastEl.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

/* ---------- dock: equal items, a sliding indicator that remembers where you came from ---------- */
const DOCK = [['home', 'Home', 'home.html'], ['services', 'Services', 'services.html'], ['book', 'Book', 'book.html'], ['branches', 'Branches', 'branches.html'], ['team', 'Team', 'team.html']];
document.querySelectorAll('nav.dock').forEach(nav => {
  const active = nav.dataset.active || 'home';
  const ind = el('span', { class: 'ind', 'aria-hidden': 'true' });
  nav.setAttribute('aria-label', 'Main');
  const links = DOCK.map(([k, label, href]) => {
    const a = el('a', { href: href || '#' }, icon(k), el('span', {}, label));
    if (k === active) a.setAttribute('aria-current', 'page');
    a.addEventListener('click', e => {
      a.classList.remove('pop'); void a.offsetWidth; a.classList.add('pop');
      if (!href) { e.preventDefault(); toast(`${label} comes in the next round of mockups`); return; }
      try { sessionStorage.setItem('dockFrom', String(DOCK.findIndex(d => d[0] === active))); } catch (_) {}
    });
    return a;
  });
  nav.replaceChildren(ind, ...links);
  const idx = DOCK.findIndex(d => d[0] === active);
  const place = (i, animate) => {
    const a = links[i];
    ind.style.transition = animate ? '' : 'none';
    ind.style.width = a.offsetWidth + 'px';
    ind.style.transform = `translateX(${a.offsetLeft - 6}px)`;
  };
  let from = idx;
  try { const f = sessionStorage.getItem('dockFrom'); if (f !== null) from = +f; sessionStorage.removeItem('dockFrom'); } catch (_) {}
  requestAnimationFrame(() => {
    place(from, false);
    requestAnimationFrame(() => requestAnimationFrame(() => place(idx, !reduceMotion)));
  });
  addEventListener('resize', () => place(idx, false));
});

document.querySelectorAll('.fab').forEach(f => f.replaceChildren(
  el('a', { href: 'tel:+919916116625', 'aria-label': 'Call the clinic' }, icon('phone')),
  el('a', { href: 'https://wa.me/919916116625', 'aria-label': 'WhatsApp the clinic' }, icon('whatsapp'))
));

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .2 });
document.querySelectorAll('[data-reveal],[data-inview]').forEach(n => io.observe(n));

/* ---------- 3D tilt ---------- */
if (!reduceMotion && matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.tilt').forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = `perspective(900px) rotateY(${x * 9}deg) rotateX(${-y * 9}deg) translateZ(6px)`;
    });
    c.addEventListener('pointerleave', () => { c.style.transform = ''; });
  });
}

/* ---------- branches and real opening hours (IST) ---------- */
// Coordinates are approximate locality pins until the clinic confirms exact ones.
const BRANCHES = [
  { id: 'arekere', name: 'Arekere MICO Layout', short: 'Arekere', sessions: [[9, 13], [16, 21]], lat: 12.8886, lng: 77.6022,
    addr: 'No. 129, 1st Floor, Lakshmi Nivas, 3rd Cross, near L&T South City, Bannerghatta Main Rd, Arekere MICO Layout 2nd Stage, Bengaluru 560076',
    phone: '+918026489922', landmark: 'Near L&T South City' },
  { id: 'bannerghatta', name: 'Bannerghatta Road', short: 'Bannerghatta', sessions: [[8, 12], [16, 20]], lat: 12.8775, lng: 77.5975,
    addr: 'No. 22, 1st Floor, above Greens Vegetable Shop, behind Meenakshi Temple, Classic Orchards Layout, Kalena Agrahara, Bengaluru 560076',
    phone: '+919916116625', landmark: 'Behind Meenakshi Temple' },
  { id: 'jpnagar', name: 'JP Nagar 7th Phase', short: 'JP Nagar', sessions: [[9, 13], [17, 21]], lat: 12.8937, lng: 77.5855,
    addr: 'No. 2/8, 1st Floor, Puttenahalli Rd, opp. Govt. Primary School, JP Nagar 7th Phase, Bengaluru 560078',
    phone: '+918026656988', landmark: 'Opposite Govt. Primary School' }
];
const AREAS = [
  ['JP Nagar', 12.9063, 77.5857], ['Arekere', 12.8869, 77.5998], ['Hulimavu', 12.8775, 77.6011], ['BTM Layout', 12.9166, 77.6101],
  ['Bannerghatta Road', 12.8890, 77.5970], ['Gottigere', 12.8569, 77.5880], ['Jayanagar', 12.9299, 77.5824], ['Bilekahalli', 12.8986, 77.6050]
];
/* ---------- distances: never guessed. They appear only once the visitor has said where they are (on Branches),
   and are kept for the rest of the visit ---------- */
function savedKm() { try { return JSON.parse(sessionStorage.getItem('jp-km') || 'null'); } catch (_) { return null; } }
function saveKm(km) { try { sessionStorage.setItem('jp-km', JSON.stringify(km)); } catch (_) {} }
function kmText(b) { const k = savedKm(); return k && k[b.id] != null ? `${k[b.id].toFixed(1)} km` : ''; }
function nearestIndex() { const k = savedKm(); if (!k) return 0; return BRANCHES.reduce((best, b, i) => (k[b.id] < k[BRANCHES[best].id] ? i : best), 0); }
function kmBetween(a, b, c, d) {
  const R = 6371, r = x => x * Math.PI / 180, dl = r(c - a), dg = r(d - b);
  const h = Math.sin(dl / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dg / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function mapsLink(b) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('J.P. Nagar Medical and Physiotherapy Centre ' + b.name)}`; }
const DEGREES = {
  MPT: 'Master of Physiotherapy', BPT: 'Bachelor of Physiotherapy', COMT: 'Certified Orthopaedic Manual Therapist',
  MIAP: 'Member, Indian Association of Physiotherapists', 'MD(A.M)': 'MD in Alternative Medicine', 'D.ACU': 'Diploma in Acupuncture'
};
// ?t=16:40 pins the clock for demos and screenshots
const DEMO_T = new URLSearchParams(location.search).get('t');
function nowIST() {
  const d = new Date(), ist = new Date(d.getTime() + (330 + d.getTimezoneOffset()) * 60000);
  if (DEMO_T) { const [h, m] = DEMO_T.split(':').map(Number); ist.setHours(h, m || 0, 0, 0); }
  return ist;
}
function fmtHour(h) { const hh = Math.floor(h), m = Math.round((h - hh) * 60); const p = hh >= 12 ? 'pm' : 'am'; const x = hh % 12 || 12; return m ? `${x}:${String(m).padStart(2, '0')} ${p}` : `${x} ${p}`; }
function branchStatus(b, d = nowIST()) {
  const h = d.getHours() + d.getMinutes() / 60;
  if (d.getDay() !== 0) {
    for (const [s, e] of b.sessions) if (h >= s && h < e) return { open: true, text: `Open now · till ${fmtHour(e)}` };
    for (const [s] of b.sessions) if (h < s) return { open: false, text: `Opens ${fmtHour(s)} today` };
  }
  const tomorrowSunday = d.getDay() === 6;
  return { open: false, text: `Closed · opens ${tomorrowSunday ? 'Mon' : 'tomorrow'} ${fmtHour(b.sessions[0][0])}` };
}
function greeting(d = nowIST()) { const h = d.getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
function hash(s) { let x = 0; for (const c of s) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x; }
// Slots every 30 minutes; some marked taken (sample data); past times today are hidden.
function slotsFor(b, day, sessionIdx) {
  const [s, e] = b.sessions[sessionIdx];
  const now = nowIST(); const today = day.toDateString() === now.toDateString();
  const out = [];
  for (let t = s; t < e; t += .5) {
    if (today && t <= now.getHours() + now.getMinutes() / 60 + .25) continue;
    const hh = Math.floor(t) % 12 || 12, mm = t % 1 ? '30' : '00';
    out.push({ t, label: `${hh}:${mm}`, suffix: t >= 12 ? 'pm' : 'am', taken: hash(b.id + day.toDateString() + t) % 4 === 0 });
  }
  return out;
}
function nextFree(b) {
  const d = nowIST();
  for (let i = 0; i < 7; i++) {
    const day = new Date(d); day.setDate(d.getDate() + i);
    if (day.getDay() === 0) continue;
    for (let si = 0; si < b.sessions.length; si++) {
      const f = slotsFor(b, day, si).find(x => !x.taken);
      if (f) return { day, slot: f, today: i === 0 };
    }
  }
  return null;
}
