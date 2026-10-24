// Services: find care by where it hurts (a small back-view body map) or by situation.
// The map and the cards light each other up: point at an area to see what helps it, point at a card to see what it treats.
ensureFigDefs();
const AREA_NAMES = { neck: 'Neck', shoulder: 'Shoulder', upper: 'Upper back', lower: 'Lower back', elbow: 'Elbow', hand: 'Wrist & hand', hip: 'Hip', knee: 'Knee', foot: 'Ankle & foot' };
const FILTERS = [['all', 'All'], ['back', 'Back & neck'], ['joints', 'Joints'], ['sports', 'Sports'], ['surgery', 'After surgery'], ['neuro', 'Stroke & nerves'], ['women', 'Women'], ['children', 'Children'], ['elderly', 'Elderly']];
const cards = SERVICES.map(s => ({ s, n: document.getElementById(s.id) }));
const V = { area: null, tag: 'all' };

const fmFig = $('[data-fm]');
fmFig.append(svgEl({ viewBox: '0 0 240 480', 'aria-hidden': 'true' }, FIG.male.back));
const spots = REGIONS.map(([type, pos]) => {
  const [x, y] = spotXY('male', type, pos);
  const h = el('button', { class: 'hs', type: 'button', tabindex: '-1', 'aria-label': AREA_NAMES[type], 'data-area': type }, el('span', { class: 'tip', 'aria-hidden': 'true' }, AREA_NAMES[type]));
  h.style.left = (x / 240 * 100) + '%'; h.style.top = (y / 480 * 100) + '%';
  fmFig.append(h);
  return h;
});
const regionBtns = Object.keys(AREA_NAMES).map(a => el('button', { type: 'button', 'aria-pressed': 'false', 'data-area': a }, AREA_NAMES[a], el('span', {}, String(SERVICES.filter(s => s.areas.includes(a)).length))));
$('[data-regions]').replaceChildren(...regionBtns);
const filterBtns = FILTERS.map(([k, label]) => {
  const n = k === 'all' ? SERVICES.length : SERVICES.filter(s => s.tags.includes(k)).length;
  const b = el('button', { type: 'button', role: 'radio', 'aria-checked': String(k === 'all'), 'data-tag': k }, label, el('span', {}, String(n)));
  b.addEventListener('click', () => { V.tag = k; V.area = null; apply(); });
  return b;
});
$('[data-filters]').replaceChildren(...filterBtns);

function preview(a) {
  spots.forEach(h => h.classList.toggle('hl', !!a && h.dataset.area === a));
  regionBtns.forEach(b => b.classList.toggle('hl', !!a && b.dataset.area === a));
  if (!V.area) cards.forEach(({ s, n }) => n.classList.toggle('dim', !!a && !s.areas.includes(a)));
}
function apply() {
  spots.forEach(h => h.classList.toggle('on', h.dataset.area === V.area));
  regionBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.area === V.area)));
  filterBtns.forEach(b => b.setAttribute('aria-checked', String(b.dataset.tag === V.tag)));
  let n = 0;
  cards.forEach(({ s, n: c }) => {
    const show = V.area ? s.areas.includes(V.area) : V.tag === 'all' || s.tags.includes(V.tag);
    c.hidden = !show; c.classList.remove('dim'); if (show) n++;
  });
  const what = V.area ? ` for ${AREA_NAMES[V.area].toLowerCase()} pain` : V.tag !== 'all' ? ` · ${FILTERS.find(f => f[0] === V.tag)[1]}` : '';
  $('[data-count]').replaceChildren(el('b', {}, String(n)), ` ${n === 1 ? 'area' : 'areas'} of care${what}`);
  $('[data-clear]').hidden = !V.area && V.tag === 'all';
}
[...spots, ...regionBtns].forEach(b => {
  const a = b.dataset.area;
  b.addEventListener('mouseenter', () => preview(a)); b.addEventListener('focus', () => preview(a));
  b.addEventListener('mouseleave', () => preview(null)); b.addEventListener('blur', () => preview(null));
  b.addEventListener('click', () => { V.area = V.area === a ? null : a; V.tag = 'all'; preview(null); apply(); });
});
cards.forEach(({ s, n }) => {
  n.addEventListener('mouseenter', () => spots.forEach(h => h.classList.toggle('hl', s.areas.includes(h.dataset.area))));
  n.addEventListener('mouseleave', () => spots.forEach(h => h.classList.remove('hl')));
});
$('[data-clear]').addEventListener('click', () => { V.area = null; V.tag = 'all'; apply(); });
apply();

/* ---------- treatments: point at one to watch how it's done ---------- */
const txList = $('[data-tx-list]'), txStage = $('[data-tx-stage]'), txPanel = $('[data-tx-panel]');
let tx = -1, txAuto = !reduceMotion, txTimer, txHover;
const txTabs = TREATMENTS.map((t, i) => {
  const b = el('button', { class: 'tx-tab', type: 'button', role: 'tab', id: `tx-${t.id}`, 'aria-selected': 'false', 'aria-controls': 'tx-panel', tabindex: '-1' },
    el('b', {}, t.name), el('span', {}, t.short), el('i', { class: 'bar', 'aria-hidden': 'true' }));
  b.addEventListener('click', () => { stopTx(); pickTx(i); });
  b.addEventListener('mouseenter', () => { clearTimeout(txHover); txHover = setTimeout(() => { stopTx(); pickTx(i); }, 120); });
  b.addEventListener('mouseleave', () => clearTimeout(txHover));
  return b;
});
txList.replaceChildren(...txTabs);
txList.addEventListener('keydown', e => {
  const n = TREATMENTS.length, to = { ArrowDown: tx + 1, ArrowUp: tx - 1, Home: 0, End: n - 1 }[e.key];
  if (to === undefined) return;
  e.preventDefault(); stopTx(); pickTx((to + n) % n); txTabs[tx].focus();
});
function pickTx(i) {
  tx = i;
  const t = TREATMENTS[i];
  txTabs.forEach((b, j) => {
    b.setAttribute('aria-selected', String(j === i)); b.tabIndex = j === i ? 0 : -1;
    b.classList.remove('run'); void b.offsetWidth; b.classList.toggle('run', j === i && txAuto);
  });
  showScene(txStage, t.scene);
  $('[data-tx-name]').textContent = t.name;
  const full = $('[data-tx-full]'); full.hidden = !t.full; full.textContent = t.full || '';
  $('[data-tx-what]').textContent = t.what;
  $('[data-tx-feels]').textContent = t.feels;
  $('[data-tx-used]').replaceChildren(...t.used.map(id => { const s = SERVICES.find(x => x.id === id); return el('a', { class: 'pill', href: s.page || `#${s.id}` }, s.name); }));
  txPanel.setAttribute('aria-labelledby', `tx-${t.id}`);
}
function stopTx() { txAuto = false; clearInterval(txTimer); txTabs.forEach(b => b.classList.remove('run')); }
pickTx(0);
// plays through the treatments by itself while on screen, until someone picks one
if (txAuto) new IntersectionObserver(([e]) => {
  clearInterval(txTimer);
  if (e.isIntersecting && txAuto) txTimer = setInterval(() => pickTx((tx + 1) % TREATMENTS.length), 7500);
}, { threshold: .4 }).observe(txPanel);
