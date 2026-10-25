// Service pages (all but Spine & Back Care, which has its own spine map): point at a problem to see where it happens,
// then scroll through how it's treated; the stage on the left follows the chapter you're reading.
// Everything the page shows is in its HTML; this script only wires it up.
ensureSceneDefs();
const svcId = document.body.dataset.service;

/* ---------- where each problem happens ---------- */
// The stage is either a body map (the treated places light up, front or back) or a treatment scene.
const mapStage = $('[data-map-stage]'), conds = $$('[data-cond]');
let setStageFor;
if (mapStage.dataset.mode === 'scene') {
  const host = el('div', { class: 'scene-host' });
  mapStage.prepend(host);
  setStageFor = b => showScene(host, b.dataset.scene);
} else {
  const k = 1.02, place = `translate(${(200 - 120 * k).toFixed(1)} ${(262 - 236 * k).toFixed(1)}) scale(${k})`;
  // a spot is "knee-a" (a body-map area and side) or "120:40" (a point on the 240×480 figure)
  const xy = s => s.includes(':') ? s.split(':').map(Number) : spotXY('male', ...s.split('-'));
  const spots = (b, face) => (b.dataset.face === face ? b.dataset.spots.split(',') : []).map(s => { const [x, y] = xy(s.trim()); return `<g class="spot" transform="translate(${x} ${y})"><circle r="34" fill="url(#glowS)"/><circle class="where-ring" r="11" fill="none" stroke="#00A8EC" stroke-width="2.4"/><circle r="5.5" fill="#00A8EC" stroke="#fff" stroke-width="2.4"/></g>`; }).join('');
  const map = svgEl({ class: 'bodymap', viewBox: '0 0 400 520', role: 'img', 'aria-label': 'A body, lit where the chosen problem happens' },
    ['front', 'back'].map(face => `<g class="face" data-face="${face}" transform="${place}">${FIG.male[face]}${conds.map((b, i) => `<g class="spots" data-i="${i}">${spots(b, face)}</g>`).join('')}</g>`).join(''));
  mapStage.prepend(map);
  setStageFor = b => {
    map.querySelectorAll('.face').forEach(f => f.classList.toggle('on', f.dataset.face === b.dataset.face));
    map.querySelectorAll('.spots').forEach(g => g.classList.toggle('on', conds[+g.dataset.i] === b));
  };
}
let cond = null, condTimer;
function setCond(b) {
  if (cond === b) return;
  cond = b; setStageFor(b);
  conds.forEach(c => c.setAttribute('aria-pressed', String(c === b)));
  $('[data-cond-name]').textContent = b.textContent;
  $('[data-cond-text]').textContent = b.dataset.text;
}
function stopCond() { clearInterval(condTimer); condTimer = null; }
conds.forEach(b => ['mouseenter', 'focus', 'click'].forEach(ev => b.addEventListener(ev, () => { stopCond(); setCond(b); })));
mapStage.addEventListener('pointerenter', stopCond);
// when the stage shows treatments, don't open on the same one the story below starts with
const ch0 = document.querySelector('.chapter'), storyFirst = ch0 && (ch0.dataset.scene || (ch0.querySelector('.subtab') || {}).dataset?.scene);
setCond(mapStage.dataset.mode === 'scene' && conds[1] && conds[0].dataset.scene === storyFirst ? conds[1] : conds[0]);
// until someone points at one, the stage walks through them by itself
const mapSeen = onView(mapStage);
if (!reduceMotion) condTimer = setInterval(() => mapSeen() && setCond(conds[(conds.indexOf(cond) + 1) % conds.length]), mapStage.dataset.mode === 'scene' ? 7000 : 3400);

/* ---------- the next free time, straight into booking ---------- */
const area = document.body.dataset.area || '';
nextFreeBlock((b, day, s) => `book.html?branch=${b.id}&day=${dayISO(day)}&slot=${s.t}&service=${svcId}${area ? `&area=${area}` : ''}`);

/* ---------- how we treat it: the stage follows the chapter you're reading ---------- */
const host = $('[data-story-host]'), chapters = $$('.chapter'), stepBtns = $$('[data-goto]'), storySeen = onView(host);
// each chapter shows one scene, or one per sub-tab
const STEPS = chapters.map(c => { const subs = $$('.subtab', c); return subs.length ? subs.map(s => [s.dataset.scene, s.dataset.cap]) : [[c.dataset.scene, c.dataset.cap]]; });
let step = -1, cycle;
const sub = STEPS.map(() => 0), picked = STEPS.map(() => false);
function showSub() {
  const [name, cap] = STEPS[step][sub[step]];
  showScene(host, name);
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

/* ---------- who treats it ---------- */
$('[data-who]').replaceChildren(...TEAM.map((t, i) => el('article', { class: 'mini-prof' },
  (() => { const p = el('div', { class: 'photo', role: 'img', 'aria-label': t.photo ? `Portrait of ${t.short}` : `Portrait of ${t.short}, to be shot` }); paintPhoto(p, t.photo); return p; })(),
  el('div', {}, el('b', {}, t.name), el('small', {}, t.card), degChips(t.deg.slice(0, 3), true),
    el('a', { class: 'link', href: `book.html?therapist=${i}&service=${svcId}${area ? `&area=${area}` : ''}` }, `Book with ${t.first}`, icon('chevron'))))));
paintIcons();
