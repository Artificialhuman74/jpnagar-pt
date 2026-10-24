// Shared mock UI: dock, floating buttons, icons, 3D tilt.
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
  pin: '<path d="M12 20.8s-6.6-5.8-6.6-11A6.6 6.6 0 0 1 18.6 9.8c0 5.2-6.6 11-6.6 11z"/><circle cx="12" cy="9.8" r="2.4"/>'
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

document.querySelectorAll('[data-icon]').forEach(n => n.replaceChildren(icon(n.dataset.icon, n.hasAttribute('data-fill'))));

document.querySelectorAll('nav.dock').forEach(nav => {
  const items = [['home', 'Home'], ['services', 'Services'], ['book', 'Book'], ['branches', 'Branches'], ['team', 'Team']];
  const active = nav.dataset.active || 'home';
  nav.setAttribute('aria-label', 'Main');
  nav.replaceChildren(...items.map(([k, label]) => {
    const a = el('a', { href: `#${k}` }, icon(k), el('span', {}, label));
    if (k === active) a.setAttribute('aria-current', 'page');
    return a;
  }));
  nav.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a) return; e.preventDefault();
    nav.querySelectorAll('a').forEach(x => x.removeAttribute('aria-current'));
    a.setAttribute('aria-current', 'page');
  });
});

document.querySelectorAll('.fab').forEach(f => f.replaceChildren(
  el('a', { href: 'tel:+919916116625', 'aria-label': 'Call the clinic' }, icon('phone')),
  el('a', { href: 'https://wa.me/919916116625', 'aria-label': 'WhatsApp the clinic' }, icon('whatsapp'))
));

document.querySelectorAll('.slots').forEach(g => g.addEventListener('click', e => {
  const s = e.target.closest('.slot'); if (!s || s.classList.contains('is-taken')) return;
  g.querySelectorAll('.slot').forEach(x => x.classList.remove('is-on')); s.classList.add('is-on');
  const cta = g.closest('[data-booking]')?.querySelector('[data-cta]');
  if (cta) cta.textContent = `Book ${s.dataset.time || s.textContent.trim()} pm`;
}));

document.querySelectorAll('.days').forEach(g => g.addEventListener('click', e => {
  const d = e.target.closest('.day'); if (!d || d.classList.contains('is-off')) return;
  g.querySelectorAll('.day').forEach(x => x.classList.remove('is-on')); d.classList.add('is-on');
}));

if (!matchMedia('(prefers-reduced-motion: reduce)').matches && matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.tilt').forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(4px)`;
    });
    c.addEventListener('pointerleave', () => { c.style.transform = ''; });
  });
}
