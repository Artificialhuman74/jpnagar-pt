// Service pages on the phone: tap a problem to see where it happens, then step through how it's treated.
// The treatment scenes and bodies come from ../desktop (anatomy.js, scenes.js); everything the page says is in its HTML.
ensureSceneDefs();
const svcId = document.body.dataset.service;

/* ---------- where each problem happens ---------- */
// The stage is either a body map (the treated places light up, front or back) or a treatment scene.
const mapStage = $('[data-map-stage]'), conds = $$('[data-cond]'), condRow = $('.cond-row');
let setStageFor;
if (mapStage.dataset.mode === 'scene') {
  const host = el('div', { class: 'scene-host' });
  mapStage.append(host);
  setStageFor = b => showScene(host, b.dataset.scene);
} else {
  // a spot is "knee-a" (a body-map area and side) or "120:40" (a point on the 240×480 figure). Its place is an outer
  // group, so the pop-in (a CSS transform on the inner one) can't override the translate and flash it at the corner
  const xy = s => s.includes(':') ? s.split(':').map(Number) : spotXY('male', ...s.split('-'));
  const spots = (b, face) => (b.dataset.face === face ? b.dataset.spots.split(',') : []).map(s => { const [x, y] = xy(s.trim()); return `<g transform="translate(${x} ${y})"><g class="bm-spot"><circle r="30" fill="url(#glowS)"/><circle class="where-ring" r="10" fill="none" stroke="#00A8EC" stroke-width="2.2"/><circle r="5" fill="#00A8EC" stroke="#fff" stroke-width="2.2"/></g></g>`; }).join('');
  // the shaded body (front and back) and the pulsing spots are separate drawings, so the pulse never makes the
  // browser redraw the body, and turning the body round is a plain crossfade
  const vb = '34 6 172 452';
  const faces = ['front', 'back'].map(face => svgEl({ class: 'bm bm-fig', viewBox: vb, 'data-face': face, 'aria-hidden': 'true' }, FIG.male[face]));
  const dots = svgEl({ class: 'bm bm-dots', viewBox: vb, role: 'img', 'aria-label': 'A body, lit where the chosen problem happens' },
    ['front', 'back'].map(face => conds.map((b, i) => `<g class="bm-spots" data-i="${i}" data-face="${face}">${spots(b, face)}</g>`).join('')).join(''));
  mapStage.append(...faces, dots, el('span', { class: 'bm-side', 'aria-hidden': 'true' }));
  setStageFor = b => {
    faces.forEach(f => f.classList.toggle('on', f.dataset.face === b.dataset.face));
    dots.querySelectorAll('.bm-spots').forEach(g => g.classList.toggle('on', conds[+g.dataset.i] === b && g.dataset.face === b.dataset.face));
    $('.bm-side', mapStage).textContent = b.dataset.face === 'back' ? 'Seen from behind' : 'Seen from the front';
  };
}
let cond = null, condTimer;
// runs fn once the browser has drawn the current change (two frames), so a tap shows before heavy work starts
const afterPaint = fn => requestAnimationFrame(() => requestAnimationFrame(fn));
function setCond(b, fromUser) {
  if (cond === b) return;
  cond = b;
  conds.forEach(c => c.setAttribute('aria-pressed', String(c === b)));
  // the chip answers the tap first; a treatment scene (heavier drawing) follows on the next frame
  if (mapStage.dataset.mode === 'scene') afterPaint(() => cond === b && setStageFor(b)); else setStageFor(b);
  $('[data-cond-name]').textContent = b.textContent;
  $('[data-cond-text]').textContent = b.dataset.text;
  // keep the chosen chip in view without moving the page
  const left = b.offsetLeft - (condRow.clientWidth - b.offsetWidth) / 2;
  condRow.scrollTo({ left, behavior: fromUser && !reduceMotion ? 'smooth' : 'auto' });
}
function stopCond() { clearInterval(condTimer); condTimer = null; }
// captions keep the height of their longest text, so changing what they say never nudges the page below
function holdHeight(box, texts, put) {
  const fit = () => { box.style.minHeight = ''; let h = 0; texts.forEach(t => { put(t); h = Math.max(h, box.offsetHeight); }); box.style.minHeight = h + 'px'; };
  fit(); addEventListener('resize', fit);
}
holdHeight($('.where-cap'), conds, b => { $('[data-cond-name]').textContent = b.textContent; $('[data-cond-text]').textContent = b.dataset.text; });
conds.forEach(b => b.addEventListener('click', () => { stopCond(); setCond(b, true); }));
mapStage.addEventListener('pointerdown', stopCond);
condRow.addEventListener('pointerdown', stopCond);
// when the stage shows treatments, don't open on the same one the story below starts with
const ch0 = document.querySelector('.chapter'), storyFirst = ch0 && (ch0.dataset.scene || (ch0.querySelector('.subtab') || {}).dataset?.scene);
setCond(mapStage.dataset.mode === 'scene' && conds[1] && conds[0].dataset.scene === storyFirst ? conds[1] : conds[0]);
// until someone taps one, the stage walks through them by itself
const mapSeen = onView(mapStage);
if (!reduceMotion) condTimer = setInterval(() => mapSeen() && setCond(conds[(conds.indexOf(cond) + 1) % conds.length]), mapStage.dataset.mode === 'scene' ? 7000 : 3400);

/* ---------- how we treat it: three stages, one stage at a time ---------- */
// (Therapies has none: its treatments are the explorer at the top)
if ($('[data-story-host]')) {
  const host = $('[data-story-host]'), storySeen = onView(host), chapters = $$('.chapter'), tabs = $$('[data-goto]'), seg = $('.seg'), ind = $('.seg-ind'), slot = $('[data-sub-slot]');
  // a stage's treatments sit as small numbered buttons right under the animation, in the order they're shown
  const SUBS = chapters.map(c => $('.subtabs', c));
  SUBS.forEach(c => c && c.prepend(el('span', { class: 'sub-ind', 'aria-hidden': 'true' }), el('span', { class: 'sub-ind', 'aria-hidden': 'true' })));
  // The treatments differ in width, so the highlight crossfades: the second (pre-coloured) layer is placed under the
  // chosen one and fades in while the first fades out, opacity only. The track scrolls it into view if they don't fit.
  function placeSubInd(animate) {
    const c = SUBS[step]; if (!c) return;
    const on = $$('.subtab', c)[sub[step]], [a, b] = $$('.sub-ind', c), cur = c._ind || a;
    const next = animate && !reduceMotion && cur.classList.contains('on') ? (cur === a ? b : a) : cur;
    next.style.width = on.offsetWidth + 'px'; next.style.transform = `translateX(${on.offsetLeft}px)`;
    if (next !== cur) cur.classList.remove('on');
    next.classList.add('on'); c._ind = next;
    if (c.scrollWidth > c.clientWidth) c.scrollTo({ left: on.offsetLeft - (c.clientWidth - on.offsetWidth) / 2, behavior: animate && !reduceMotion ? 'smooth' : 'auto' });
  }
  // each stage shows one scene, or one per treatment in it
  const STEPS = chapters.map(c => { const s = $$('.subtab', c); return s.length ? s.map(b => [b.dataset.scene, b.dataset.cap]) : [[c.dataset.scene, c.dataset.cap]]; });
  let step = -1, cycle;
  const sub = STEPS.map(() => 0), picked = STEPS.map(() => false);
  function showSub() {
    const [name, cap] = STEPS[step][sub[step]], at = [step, sub[step]];
    // the buttons answer the tap first; the scene (the heavier drawing) follows once that has been drawn
    afterPaint(() => { if (at[0] === step && at[1] === sub[step]) showScene(host, name); });
    $('[data-story-cap]').textContent = cap;
    $$(`[data-subs="${step}"] .subtab`).forEach((b, j) => {
      b.setAttribute('aria-pressed', String(j === sub[step]));
      b.classList.remove('run'); void b.offsetWidth;
      b.classList.toggle('run', j === sub[step] && !picked[step] && !reduceMotion);
    });
    placeSubInd(true);
  }
  function placeInd() { const t = tabs[step]; ind.style.width = t.offsetWidth + 'px'; ind.style.transform = `translateX(${t.offsetLeft}px)`; }
  function setStep(i) {
    if (i === step) return;
    const from = step; step = i;
    chapters.forEach((c, j) => {
      c.hidden = j !== i;
      if (j === i && from >= 0 && !reduceMotion) { c.style.animation = 'none'; void c.offsetWidth; c.style.animation = `${i > from ? 'from-r' : 'from-l'} .5s var(--ease)`; }
    });
    tabs.forEach((b, j) => { b.setAttribute('aria-selected', String(j === i)); b.tabIndex = j === i ? 0 : -1; });
    slot.replaceChildren(...(SUBS[i] ? [SUBS[i]] : []));
    placeInd(); showSub(); placeSubInd(false);
    clearInterval(cycle);
    if (STEPS[i].length > 1 && !reduceMotion) cycle = setInterval(() => {
      if (picked[step] || !storySeen()) return;
      sub[step] = (sub[step] + 1) % STEPS[step].length; showSub();
    }, 7000);
  }
  tabs.forEach((b, j) => b.addEventListener('click', () => setStep(j)));
  seg.addEventListener('keydown', e => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault(); setStep((step + d + 3) % 3); tabs[step].focus();
  });
  $$('.subtab').forEach(b => b.addEventListener('click', () => {
    const s = +b.closest('[data-subs]').dataset.subs;
    picked[s] = true; sub[s] = +b.dataset.sub; showSub();
  }));
  // swipe the stage sideways to move between stages
  let sx = null, sy = 0;
  const stage = $('[data-story-stage]');
  stage.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
  stage.addEventListener('pointerup', e => {
    if (sx === null) return;
    const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) setStep(Math.min(2, Math.max(0, step + (dx < 0 ? 1 : -1))));
  });
  stage.addEventListener('pointercancel', () => { sx = null; });
  addEventListener('resize', () => { placeInd(); placeSubInd(false); });
  setStep(0);
}

/* ---------- the next free times at the nearest branch, straight into booking ---------- */
// Until the live diary has that day's times, the block shows them loading; it is drawn again when they arrive (and
// moves to a later day if that one has filled up).
const near = BRANCHES[nearestIndex()], area = document.body.dataset.area || '';
function paintNextFree() {
  const nf = nextFree(near), box = $('[data-nextfree]');
  if (!nf) { box.hidden = true; return; }
  box.hidden = false;
  const day = nf.day, loading = !!DIARY && !DIARY.ready(near.id, day);
  box.setAttribute('aria-busy', String(loading));
  if (loading) {
    $('[data-nf-title]').replaceChildren(el('span', { class: 'skel', style: 'display:inline-block;width:15em;max-width:100%;height:1.1em;vertical-align:middle' }));
    $('[data-nf-times]').replaceChildren(el('span', { class: 'nf-skel', 'aria-hidden': 'true' }, ...[0, 1, 2, 3].map(() => el('span', { class: 'skel' }))));
    return;
  }
  const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  const times = sessionsOn(near, day).flatMap((_, si) => slotsFor(near, day, si)).filter(s => !s.taken).slice(0, 4);
  const href = s => `book.html?branch=${near.id}&day=${iso}&slot=${s.t}&service=${svcId}${area ? `&area=${area}` : ''}`;
  $('[data-nf-title]').textContent = `Next free at ${near.short}, ${nf.today ? 'today' : day.toLocaleDateString('en-IN', { weekday: 'long' })}`;
  $('[data-nf-times]').replaceChildren(...times.map(s => el('a', { class: 'pill', href: href(s) }, `${s.label} ${s.suffix}`)));
}
paintNextFree();
if (DIARY) document.addEventListener('jpn:slots', paintNextFree);
