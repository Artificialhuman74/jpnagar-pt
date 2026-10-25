// Branches: nearest first (from an area, a pincode or the visitor's location), live open/closed, the week's hours,
// and a real Google map beside the list showing one branch: the nearest (else JP Nagar), or the one picked.
const known = savedKm(), BR = BRANCHES.map(b => ({ b, km: known ? known[b.id] : null }));
const map = $('[data-map]'), list = $('[data-bcards]'), found = $('[data-found]'), inp = $('#area-in');
/* ---------- the map: one branch at a time ---------- */
let shown = null;
function showOnMap(b) {
  if (shown === b.id) return;
  shown = b.id;
  const old = map.querySelector('iframe'), f = mapEmbed(b);
  old ? old.replaceWith(f) : map.prepend(f);
  $('[data-map-note]').textContent = `Showing ${b.name}`;
  $$('.bcard', list).forEach(c => c.classList.toggle('on-map', c.dataset.id === b.id));
}

/* ---------- cards ---------- */
// Each card is built once. Sorting moves the cards and updates their distance and "Nearest" tag in place, so an open
// "Hours this week" stays open and nothing is rebuilt.
function card({ b }) {
  const st = branchStatus(b), today = nowIST().getDay();
  const week = el('div', { class: 'week' }, ...[1, 2, 3, 4, 5, 6, 0].map(d => el('div', { class: [d === today && 'today', !worksOn(b, d) && 'off'].filter(Boolean).join(' ') || null },
    el('span', {}, DAYS[d] + (d === today ? ' · today' : '')), el('span', {}, hoursText(b, d)))));
  const c = el('article', { class: 'bcard', 'data-id': b.id },
    el('div', { class: 'photo', role: 'img', 'aria-label': `Photo: ${b.short} entrance (to be shot)`, 'data-branch-photo': b.id }),
    el('div', { class: 'bcard-in' },
      el('div', { class: 'bcard-h' }, el('h2', {}, b.name), el('span', { class: 'near-tag', hidden: '' }, 'Nearest')),
      el('div', { class: 'bcard-meta' }, el('span', { class: 'live' + (st.open ? '' : ' closed') }, el('i'), el('span', {}, st.text)), el('span', { class: 'km', hidden: '' }), el('span', {}, b.landmark)),
      el('address', {}, b.addr),
      el('details', {}, el('summary', {}, 'Hours this week', icon('chevron')), week),
      el('div', { class: 'bcard-acts' },
        el('a', { class: 'btn btn--act btn--sm', href: `book.html?branch=${b.id}` }, 'Book here'),
        el('a', { class: 'btn btn--line btn--sm', href: mapsLink(b), target: '_blank', rel: 'noopener' }, icon('pin'), 'Directions'),
        (() => { const m = el('button', { class: 'btn btn--line btn--sm', type: 'button' }, 'Show on map'); m.addEventListener('click', () => showOnMap(b)); return m; })(),
        el('a', { class: 'btn btn--line btn--sm', href: `tel:${b.phone}` }, icon('phone'), b.phoneText))));
  return c;
}
const CARDS = new Map(BR.map(r => [r.b.id, card(r)]));
function render() {
  const order = BR[0].km == null ? [...BR] : [...BR].sort((x, y) => x.km - y.km);
  const before = new Map($$('.bcard', list).map(c => [c.dataset.id, c.getBoundingClientRect().top]));
  order.forEach((r, i) => {
    const c = CARDS.get(r.b.id), kmEl = $('.km', c), tag = $('.near-tag', c);
    kmEl.hidden = r.km == null; kmEl.textContent = r.km == null ? '' : `${r.km.toFixed(1)} km`;
    tag.hidden = !(i === 0 && r.km != null);
    list.append(c); // moves the card into its place (or puts it there the first time)
  });
  if (!reduceMotion) $$('.bcard', list).forEach(c => {
    const t = before.get(c.dataset.id); if (t == null) return;
    const dy = t - c.getBoundingClientRect().top;
    if (dy) c.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)' });
  });
  // the map follows the nearest branch once the visitor has said where they are; until then the starting one
  const start = BR[0].km == null ? BRANCHES[nearestIndex()] : order[0].b;
  shown = null; showOnMap(start);
}

/* ---------- nearest first ---------- */
function sortFrom(lat, lng, label) {
  BR.forEach(r => { r.km = kmBetween(lat, lng, r.b.lat, r.b.lng); });
  saveKm(Object.fromEntries(BR.map(r => [r.b.id, r.km])));
  render();
  const near = [...BR].sort((x, y) => x.km - y.km)[0];
  found.textContent = `${label}: ${near.b.name} is closest, ${near.km.toFixed(1)} km away.`;
}
function findArea(text) {
  const q = text.trim().toLowerCase();
  if (!q) return null;
  return AREAS.find(a => a[0].toLowerCase() === q) || AREAS.find(a => a[3] === q) || AREAS.find(a => a[0].toLowerCase().includes(q));
}
function useArea(a) {
  $$('[data-areas] .pill').forEach(p => p.setAttribute('aria-pressed', String(p.textContent === a[0])));
  sortFrom(a[1], a[2], `From ${a[0]}`);
}
$('[data-area-list]').replaceChildren(...AREAS.map(a => el('option', { value: a[0] }, a[3])));
$('[data-areas]').replaceChildren(...AREAS.map(a => {
  const p = el('button', { class: 'pill', type: 'button', 'aria-pressed': 'false' }, a[0]);
  p.addEventListener('click', () => { inp.value = ''; useArea(a); });
  return p;
}));
inp.addEventListener('change', () => {
  const a = findArea(inp.value);
  if (a) useArea(a);
  else if (inp.value.trim()) found.textContent = 'We don’t know that area yet. All three branches are below; pick the one that suits you.';
});
inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.dispatchEvent(new Event('change')); });
$('[data-locate]').addEventListener('click', () => {
  if (!navigator.geolocation) { toast('Location isn’t available here. Type your area instead.'); return; }
  found.textContent = 'Finding you…';
  navigator.geolocation.getCurrentPosition(p => sortFrom(p.coords.latitude, p.coords.longitude, 'From where you are'),
    () => { found.textContent = 'No problem. Type your area or pick one below.'; inp.focus(); }, { timeout: 8000 });
});

// no guessed starting point: distances appear once the visitor says where they are (or from earlier in the visit)
render();
if (!known) found.textContent = 'Type your area or pincode, or use your location, to see which branch is closest.';
