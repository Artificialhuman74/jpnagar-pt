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

/* ---------- distances: never guessed. They appear only once the visitor has said where they are (on Branches),
   and are kept for the rest of the visit ---------- */
function greeting(d = nowIST()) { const h = d.getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
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
