// Branches: nearest first (from an area, a pincode or the visitor's location), live open/closed, the week's hours,
// and a map beside the list. Hovering a card lifts its pin; hovering a pin outlines its card.
const known = savedKm(), BR = BRANCHES.map(b => ({ b, km: known ? known[b.id] : null }));
const map = $('[data-map]'), list = $('[data-bcards]'), found = $('[data-found]'), inp = $('#area-in');
let from = null;
// the map preview spans lat 12.844–12.914 and lng 77.567–77.621, with the branches a little above the middle
const proj = (lat, lng) => [(lng - 77.567) / .054 * 600, (12.9136 - lat) / .07 * 800];
function place(node, lat, lng, keepInside) {
  const W = map.clientWidth, H = map.clientHeight, k = Math.max(W / 600, H / 800), [x, y] = proj(lat, lng);
  let px = (W - 600 * k) / 2 + x * k, py = (H - 800 * k) / 2 + y * k;
  if (keepInside) { px = Math.min(Math.max(px, 28), W - 28); py = Math.min(Math.max(py, 28), H - 48); }
  node.style.left = px.toFixed(1) + 'px';
  node.style.top = py.toFixed(1) + 'px';
}

/* ---------- cards ---------- */
function card({ b, km }, near) {
  const st = branchStatus(b), today = nowIST().getDay();
  const week = el('div', { class: 'week' }, ...[1, 2, 3, 4, 5, 6, 0].map(d => el('div', { class: [d === today && 'today', d === 0 && 'off'].filter(Boolean).join(' ') || null },
    el('span', {}, DAYS[d] + (d === today ? ' · today' : '')), el('span', {}, hoursText(b, d)))));
  const c = el('article', { class: 'bcard', 'data-id': b.id },
    el('div', { class: 'photo', role: 'img', 'aria-label': `Photo: ${b.short} entrance (to be shot)` }),
    el('div', { class: 'bcard-in' },
      el('div', { class: 'bcard-h' }, el('h2', {}, b.name), near && km != null ? el('span', { class: 'near-tag' }, 'Nearest') : null),
      el('div', { class: 'bcard-meta' }, el('span', { class: 'live' + (st.open ? '' : ' closed') }, el('i'), el('span', {}, st.text)), km != null ? el('span', { class: 'km' }, `${km.toFixed(1)} km`) : null, el('span', {}, b.landmark)),
      el('address', {}, b.addr),
      el('details', {}, el('summary', {}, 'Hours this week', icon('chevron')), week),
      el('div', { class: 'bcard-acts' },
        el('a', { class: 'btn btn--act btn--sm', href: `book.html?branch=${b.id}` }, 'Book here'),
        el('a', { class: 'btn btn--line btn--sm', href: mapsLink(b), target: '_blank', rel: 'noopener' }, icon('pin'), 'Directions'),
        el('a', { class: 'btn btn--line btn--sm', href: `tel:${b.phone}` }, icon('phone'), b.phoneText))));
  c.addEventListener('mouseenter', () => hl(b.id, true));
  c.addEventListener('mouseleave', () => hl(b.id, false));
  return c;
}
function render() {
  const order = BR[0].km == null ? [...BR] : [...BR].sort((x, y) => x.km - y.km);
  const before = new Map($$('.bcard', list).map(c => [c.dataset.id, c.getBoundingClientRect().top]));
  list.replaceChildren(...order.map((r, i) => card(r, i === 0)));
  if (!reduceMotion) $$('.bcard', list).forEach(c => {
    const t = before.get(c.dataset.id); if (t == null) return;
    const dy = t - c.getBoundingClientRect().top;
    if (dy) c.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)' });
  });
  pins.forEach(({ b, p }) => { const km = BR.find(r => r.b === b).km; p.classList.toggle('near', km != null && b === order[0].b); p.querySelector('small').textContent = km != null ? `${km.toFixed(1)} km` : ''; });
  layout();
}

/* ---------- map pins ---------- */
const pins = BRANCHES.map(b => {
  const p = el('button', { class: 'pin', type: 'button', 'aria-label': `${b.name} on the map` }, el('span', { class: 'pin-l' }, b.short, el('small')), el('i', { class: 'pin-d' }));
  p.addEventListener('mouseenter', () => hl(b.id, true));
  p.addEventListener('mouseleave', () => hl(b.id, false));
  p.addEventListener('click', () => {
    const c = $(`.bcard[data-id="${b.id}"]`);
    c.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    c.animate([{ boxShadow: '0 0 0 3px #00A8EC' }, { boxShadow: '0 0 0 1px #E2E4EA' }], { duration: 1400, easing: 'ease-out' });
  });
  map.append(p);
  return { b, p };
});
const you = el('span', { class: 'you', hidden: true }, el('span', {}, 'You'));
map.append(you);
function hl(id, on) {
  pins.forEach(({ b, p }) => p.classList.toggle('hl', on && b.id === id));
  $$('.bcard', list).forEach(c => c.classList.toggle('hl', on && c.dataset.id === id));
}
function layout() {
  pins.forEach(({ b, p }) => place(p, b.lat, b.lng));
  if (from) { place(you, from.lat, from.lng, true); you.hidden = false; }
}
addEventListener('resize', layout);

/* ---------- nearest first ---------- */
function sortFrom(lat, lng, label) {
  from = { lat, lng };
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
