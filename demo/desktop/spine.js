// Spine & Back Care: point at a problem to see where it happens on the spine, then scroll through how it's treated;
// the stage on the left changes with each stage of care.
ensureSceneDefs();

/* ---------- where each problem happens ---------- */
const COND = {
  lower: ['Lower back pain', 'Pain in the muscles, joints and discs low in the back.'],
  neck: ['Neck pain', 'Often from posture, strain, or stiff joints and muscles in the neck.'],
  disc: ['Slip disc', 'A disc between two vertebrae bulges out and can press on a nerve.'],
  sciatica: ['Sciatica', 'An irritated nerve low in the back sends pain down the back of the leg.'],
  stiff: ['Stiffness', 'Joints along the spine that have stopped moving freely.'],
  posture: ['Posture from desk work', 'Long hours at a desk load the neck and upper back.'],
  pregnancy: ['Pain in pregnancy', 'The growing bump shifts posture and loads the lower back and pelvis.']
};
// highlight layers, in the body figure's own coordinates
const GLOWS = `<ellipse class="hl hl-lower" cx="120" cy="196" rx="40" ry="34" fill="url(#glowS)"/><ellipse class="hl hl-neck" cx="120" cy="76" rx="26" ry="22" fill="url(#glowS)"/>
  <ellipse class="hl hl-upper" cx="120" cy="104" rx="56" ry="30" fill="url(#glowS)"/><ellipse class="hl hl-pelvis" cx="120" cy="230" rx="46" ry="28" fill="url(#glowS)"/>
  <path class="hl hl-nerve-glow" d="M116 214 C110 224 104 232 102 246 C100 270 100 296 99 326 C98 356 99 390 99 428"/><path class="hl hl-nerve" d="M116 214 C110 224 104 232 102 246 C100 270 100 296 99 326 C98 356 99 390 99 428"/>`;
const MARKS = `<g class="hl hl-disc"><ellipse class="bulge" cx="120" cy="210.4" rx="8" ry="2.4" fill="#00A8EC"/></g>
  <g class="hl hl-tension"><path d="M114 88 C102 92 90 96 78 101"/><path d="M126 88 C138 92 150 96 162 101"/></g>
  <g class="hl hl-si" fill="#00A8EC"><ellipse cx="110.5" cy="229" rx="3" ry="6.5"/><ellipse cx="129.5" cy="229" rx="3" ry="6.5"/></g>`;
const k = 1.05, stage = $('[data-spine-stage]');
const spine = svgEl({ class: 'spine', viewBox: '0 0 400 520', role: 'img', 'aria-label': 'The back of a body with the spine drawn in, lighting up where the chosen problem happens', 'data-on': 'lower' },
  `<g transform="translate(${(200 - 120 * k).toFixed(1)} ${(262 - 230 * k).toFixed(1)}) scale(${k})">${FIG.male.back}${GLOWS}${spineMarkup()}${MARKS}</g>`);
stage.prepend(spine);
// "Stiff back": the vertebrae light up in a wave. A cyan copy of each sits on top and only its opacity changes, so the
// colour itself never animates; and every loop here pauses while the figure is off screen
spine.querySelectorAll('.v').forEach(v => { const c = v.cloneNode(); c.setAttribute('class', 'v-hot'); c.setAttribute('aria-hidden', 'true'); v.after(c); });
new IntersectionObserver(([e]) => spine.classList.toggle('off', !e.isIntersecting)).observe(stage);
let cond = 'lower', condTimer;
function setCond(c) {
  cond = c; spine.dataset.on = c;
  $$('[data-cond]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cond === c)));
  $('[data-cond-name]').textContent = COND[c][0];
  $('[data-cond-text]').textContent = COND[c][1];
}
function stopCond() { clearInterval(condTimer); condTimer = null; }
$$('[data-cond]').forEach(b => ['mouseenter', 'focus', 'click'].forEach(ev => b.addEventListener(ev, () => { stopCond(); setCond(b.dataset.cond); })));
stage.addEventListener('pointerenter', stopCond);
// until someone points at one, the stage walks through them by itself
const mapSeen = onView(stage);
if (!reduceMotion) condTimer = setInterval(() => { if (!mapSeen()) return; const keys = Object.keys(COND); setCond(keys[(keys.indexOf(cond) + 1) % keys.length]); }, 3400);

/* ---------- the next free time, straight into booking ---------- */
nextFreeBlock((b, day, s) => `book.html?branch=${b.id}&day=${dayISO(day)}&slot=${s.t}&service=spine&area=lower`);

/* ---------- how we treat it: the stage follows the chapter you're reading ---------- */
const STEPS = [['assess'], ['manual', 'ift', 'traction'], ['catcow', 'bridge']];
const CAPS = { assess: 'Day one: posture, movement and strength checks', manual: 'Manual therapy: steady pressure from the hands',
  ift: 'IFT: two gentle currents crossing where it hurts', traction: 'Traction: a slow pull that eases the lower spine',
  catcow: 'Cat–cow: round, then gently dip the back', bridge: 'Bridge: lift the hips, hold, lower slowly' };
storyStepper(STEPS.map(r => r.map(n => [n, CAPS[n]])));

/* ---------- who treats it ---------- */
whoTreats(i => `book.html?therapist=${i}&service=spine&area=lower`);
paintIcons();
