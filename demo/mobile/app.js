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
    // optimistic: the highlight moves to the tapped item straight away and the page changes a beat later, so the
    // dock answers the tap before the next page has loaded (it was fetched ahead, see preload below)
    a.addEventListener('click', e => {
      a.classList.remove('pop'); void a.offsetWidth; a.classList.add('pop');
      if (!href) { e.preventDefault(); toast(`${label} comes in the next round of mockups`); return; }
      const i = links.indexOf(a);
      if (i === idx || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
      e.preventDefault();
      mark(i); place(i, !reduceMotion);
      setTimeout(() => location.assign(a.href), reduceMotion ? 0 : 140);
    });
    return a;
  });
  nav.replaceChildren(ind, ...links);
  const idx = DOCK.findIndex(d => d[0] === active);
  const mark = i => links.forEach((l, j) => { if (j === i) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current'); });
  // the items are equal, so only the first placing sets the width; after that the highlight just slides
  const place = (i, animate) => {
    const a = links[i];
    ind.style.transition = animate ? '' : 'none';
    if (!ind.style.width || !animate) ind.style.width = a.offsetWidth + 'px';
    ind.style.transform = `translateX(${a.offsetLeft - 6}px)`;
  };
  requestAnimationFrame(() => place(idx, false));
  addEventListener('resize', () => place(idx, false));
  // back to this page from the browser's memory (the back button): the highlight returns to this page's item
  addEventListener('pageshow', e => { if (e.persisted) { mark(idx); place(idx, false); } });
});

/* ---------- preload: the dock's pages are fetched once this page has settled, and any page as a finger lands on its
   link, so moving around the site doesn't wait on the network ---------- */
(() => {
  const got = new Set([location.pathname]);
  const fetchPage = href => {
    let u; try { u = new URL(href, location.href); } catch (_) { return; }
    if (u.origin !== location.origin || !u.pathname.endsWith('.html') || got.has(u.pathname)) return;
    got.add(u.pathname);
    fetch(u.pathname, { credentials: 'same-origin', priority: 'low' }).catch(() => {});
  };
  const ahead = () => DOCK.forEach(d => fetchPage(d[2]));
  // only on the patient pages (the admin shares this file but has its own dock), and never on a data-saver connection
  if (!document.querySelector('nav.dock') || (navigator.connection && navigator.connection.saveData)) return;
  addEventListener('load', () => ('requestIdleCallback' in window ? requestIdleCallback(ahead, { timeout: 3000 }) : setTimeout(ahead, 1200)), { once: true });
  addEventListener('pointerdown', e => { const a = e.target.closest && e.target.closest('a[href]'); if (a) fetchPage(a.getAttribute('href')); }, { passive: true, capture: true });
})();

document.querySelectorAll('.fab').forEach(f => f.replaceChildren(
  el('a', { href: 'tel:+919916116625', 'aria-label': 'Call the clinic' }, icon('phone')),
  el('a', { href: 'https://wa.me/919916116625', 'aria-label': 'WhatsApp the clinic' }, icon('whatsapp'))
));
// they float over the page, so they step aside while a Book button or the closing panel passes underneath them
(() => {
  const fab = document.querySelector('.fab'); if (!fab || !('IntersectionObserver' in window)) return;
  // the band of screen the buttons sit in: from 60% down to just above the dock
  const under = new Set(), io = new IntersectionObserver(es => {
    es.forEach(e => e.isIntersecting ? under.add(e.target) : under.delete(e.target));
    fab.classList.toggle('is-away', under.size > 0);
  }, { rootMargin: '-60% 0px -8% 0px' });
  // after the page's own script has built its cards. A button on the hidden back of a team card doesn't count. The
  // first state is set before the page is drawn (no fade on arrival); after that they fade aside and back.
  addEventListener('DOMContentLoaded', () => {
    const targets = [...document.querySelectorAll('.btn--act, .close-cta, .bcard .acts, .tx-link')].filter(n => !n.closest('.dock, .fab, .tilted-card__back'));
    const inBand = n => { const r = n.getBoundingClientRect(); return r.height > 0 && r.bottom > innerHeight * .6 && r.top < innerHeight * .92; };
    if (targets.some(inBand)) { fab.style.transition = 'none'; fab.classList.add('is-away'); requestAnimationFrame(() => requestAnimationFrame(() => { fab.style.transition = ''; })); }
    targets.forEach(n => io.observe(n));
  });
})();

/* ---------- reveal on scroll: only what starts below the screen. What is on screen when the page opens is simply
   there (its finished state, no entrance motion), so arriving on a page never looks like it changed a moment later ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .2 });
const showSettled = n => { n.classList.add('in', 'no-motion'); requestAnimationFrame(() => requestAnimationFrame(() => n.classList.remove('no-motion'))); };
document.querySelectorAll('[data-reveal],[data-inview]').forEach(n => (n.getBoundingClientRect().top < innerHeight ? showSettled(n) : io.observe(n)));

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
  { id: 'arekere', plus: '7J4VVHQR+7X', name: 'Arekere MICO Layout', short: 'Arekere', sessions: [[9, 13], [16, 21]], lat: 12.8886, lng: 77.6022,
    addr: 'No. 129, 1st Floor, Lakshmi Nivas, 3rd Cross, near L&T South City, Bannerghatta Main Rd, Arekere MICO Layout 2nd Stage, Bengaluru 560076',
    phone: '+918026489922', landmark: 'Near L&T South City' },
  { id: 'bannerghatta', plus: '7J4VVHFV+W6', name: 'Bannerghatta Road', short: 'Bannerghatta', sessions: [[8, 12], [16, 20]], lat: 12.8775, lng: 77.5975,
    addr: 'No. 22, 1st Floor, above Greens Vegetable Shop, behind Meenakshi Temple, Classic Orchards Layout, Kalena Agrahara, Bengaluru 560076',
    phone: '+919916116625', landmark: 'Behind Meenakshi Temple' },
  { id: 'jpnagar', plus: '7J4VVHXJ+2X', name: 'JP Nagar 7th Phase', short: 'JP Nagar', sessions: [[9, 13], [17, 21]], lat: 12.8937, lng: 77.5855,
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
// The branch booking starts at: the nearest once the visitor has shared where they are (never guessed), else JP Nagar,
// then Bannerghatta, then Arekere.
const PREFERRED = ['jpnagar', 'bannerghatta', 'arekere'];
function nearestIndex() {
  const k = savedKm();
  if (!k) { const i = PREFERRED.map(id => BRANCHES.findIndex(b => b.id === id)).find(x => x >= 0); return i === undefined ? 0 : i; }
  return BRANCHES.reduce((best, b, i) => (k[b.id] < k[BRANCHES[best].id] ? i : best), 0);
}
// Asks the browser where the visitor is (only when they tap to), keeps each branch's distance for the visit, and
// resolves to the nearest branch's index; rejects with a message to show if it can't.
function locateNearest() {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) { rej('Location isn’t available on this device. Pick your branch instead.'); return; }
    navigator.geolocation.getCurrentPosition(p => {
      saveKm(Object.fromEntries(BRANCHES.map(b => [b.id, kmBetween(p.coords.latitude, p.coords.longitude, b.lat, b.lng)])));
      res(nearestIndex());
    }, e => rej(e.code === 1 ? 'Location is off for this site. Pick your branch instead.' : 'Couldn’t find where you are. Pick your branch instead.'),
    { timeout: 10000, maximumAge: 600000 });
  });
}
function kmBetween(a, b, c, d) {
  const R = 6371, r = x => x * Math.PI / 180, dl = r(c - a), dg = r(d - b);
  const h = Math.sin(dl / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dg / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
// What Google Maps searches for a branch: its plus code, an exact spot (the clinic's name alone matches all three
// branches, and some addresses still match several); without a code, the clinic's name and the branch's address.
const mapQuery = b => b && b.plus ? b.plus : `J.P. Nagar Medical and Physiotherapy Centre, ${b ? b.addr || b.name : 'Bengaluru'}`;
function mapsLink(b) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery(b))}`; }
// A real Google map in the page (Google's own embed, no key needed), loaded only once it scrolls near: one branch, or
// with none, the clinic's branches.
function mapEmbed(b, title) {
  const f = el('iframe', { class: 'gmap is-loading', src: `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery(b))}&z=${b ? 16 : 13}&output=embed`,
    title: title || (b ? `Map: ${b.name}` : 'Map of our three branches'), loading: 'lazy', referrerpolicy: 'no-referrer-when-downgrade' });
  // the box pulses until Google's map has arrived, then the map fades in (see .gmap in base.css)
  f.addEventListener('load', () => f.classList.remove('is-loading'), { once: true });
  return f;
}
const DEGREES = {
  MPT: 'Master of Physiotherapy', BPT: 'Bachelor of Physiotherapy', COMT: 'Certified Orthopaedic Manual Therapist',
  MIAP: 'Member, Indian Association of Physiotherapists', 'MD(A.M)': 'MD in Alternative Medicine', 'D.ACU': 'Diploma in Acupuncture'
};
// ?t=16:40 pins the clock for demos and screenshots
const DEMO_T = new URLSearchParams(location.search).get('t');
function nowIST() {
  const d = new Date(), ist = new Date(d.getTime() + (330 + d.getTimezoneOffset()) * 60000);
  // the pinned demo clock (?t=16:40) is ignored on WordPress, where the diary keeps the real time
  if (DEMO_T && !window.JPN_API) { const [h, m] = DEMO_T.split(':').map(Number); ist.setHours(h, m || 0, 0, 0); }
  return ist;
}
function fmtHour(h) { const hh = Math.floor(h), m = Math.round((h - hh) * 60); const p = hh >= 12 ? 'pm' : 'am'; const x = hh % 12 || 12; return m ? `${x}:${String(m).padStart(2, '0')} ${p}` : `${x} ${p}`; }
// A branch's hours on a day (Sunday is 0), as [[from, to], ...] in hours: that weekday's own hours when the clinic has
// set them (b.week, copied in by published.js), else its usual sessions on the days it works (Mon–Sat until told).
// Takes a date or a day number.
function sessionsOn(b, d) {
  const n = typeof d === 'number' ? d : d.getDay();
  if (b.week) return b.week[n] || [];
  return (b.days || [1, 2, 3, 4, 5, 6]).includes(n) ? b.sessions : [];
}
function worksOn(b, d) { return sessionsOn(b, d).length > 0; }
const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// the next day the branch works, as words ("tomorrow", or the weekday) and that day's first opening hour
function nextOpen(b, d) {
  for (let i = 1; i <= 7; i++) { const x = new Date(d); x.setDate(d.getDate() + i); const s = sessionsOn(b, x); if (s.length) return { when: i === 1 ? 'tomorrow' : DOW_SHORT[x.getDay()], at: s[0][0] }; }
  return null;
}
const sessText = list => list.map(([s, e]) => `${fmtHour(s)}–${fmtHour(e)}`).join(', ');
// the week in one line, days with the same hours grouped: "Mon–Sat · 9 am–1 pm, 4 pm–8 pm" or
// "Mon–Fri · 9 am–1 pm, 4 pm–9 pm; Sat · 9 am–1 pm"
function weekText(b) {
  const groups = [];
  [1, 2, 3, 4, 5, 6, 0].forEach(n => {
    const s = sessionsOn(b, n), key = JSON.stringify(s), last = groups[groups.length - 1];
    if (!s.length) return;
    if (last && last.key === key && last.to === (n + 6) % 7) last.to = n; else groups.push({ key, from: n, to: n, s });
  });
  return groups.map(g => `${g.from === g.to ? DOW_SHORT[g.from] : `${DOW_SHORT[g.from]}–${DOW_SHORT[g.to]}`} · ${sessText(g.s)}`).join('; ') || 'Closed';
}
function branchStatus(b, d = nowIST()) {
  const h = d.getHours() + d.getMinutes() / 60;
  if (worksOn(b, d)) {
    for (const [s, e] of sessionsOn(b, d)) if (h >= s && h < e) return { open: true, text: `Open now · till ${fmtHour(e)}` };
    for (const [s] of sessionsOn(b, d)) if (h < s) return { open: false, text: `Opens ${fmtHour(s)} today` };
  }
  const nx = nextOpen(b, d);
  return { open: false, text: nx ? `Closed · opens ${nx.when} ${fmtHour(nx.at)}` : 'Closed' };
}
function greeting(d = nowIST()) { const h = d.getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
function hash(s) { let x = 0; for (const c of s) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x; }
// Slots every 30 minutes; some marked taken (sample data); past times today are hidden.
function slotsFor(b, day, sessionIdx) {
  const ss = sessionsOn(b, day); if (!ss[sessionIdx]) return [];
  const [s, e] = ss[sessionIdx];
  const now = nowIST(); const today = day.toDateString() === now.toDateString();
  const out = [];
  // one time per appointment length (the clinic sets it; half an hour until it says otherwise)
  const step = (b.slot || 30) / 60;
  for (let t = s; t + step <= e + 1e-6; t = +(t + step).toFixed(4)) {
    if (today && t <= now.getHours() + now.getMinutes() / 60 + .25) continue;
    const hh = Math.floor(t) % 12 || 12, mm = String(Math.round((t % 1) * 60)).padStart(2, '0');
    out.push({ t, label: `${hh}:${mm}`, suffix: t >= 12 ? 'pm' : 'am', taken: hash(b.id + day.toDateString() + t) % 4 === 0 });
  }
  return out;
}
function nextFree(b) {
  const d = nowIST();
  for (let i = 0; i < 7; i++) {
    const day = new Date(d); day.setDate(d.getDate() + i);
    if (!worksOn(b, day)) continue;
    for (let si = 0; si < sessionsOn(b, day).length; si++) {
      const f = slotsFor(b, day, si).find(x => !x.taken);
      if (f) return { day, slot: f, today: i === 0 };
    }
  }
  return null;
}
