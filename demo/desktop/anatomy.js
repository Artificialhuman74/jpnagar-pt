// Anatomy kit for the treatment scenes: porcelain bodies, ivory bones and the physiotherapist's hands, all drawn from
// measured adult proportions in centimetres (hands in hundredths of their own length) and framed by a camera.
// One small clock plays every scene on the page and pauses the ones that are off screen. scenes.js composes them.

/* ---------- maths ---------- */
const RAD = Math.PI / 180;
const n2 = v => Math.round(v * 100) / 100;
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
const mix = (a, b, t) => a + (b - a) * t;
const span = (t, a, b) => clamp01((t - a) / (b - a));
const inOut = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const outExpo = t => t >= 1 ? 1 : 1 - 2 ** (-10 * t);
const outCubic = t => 1 - (1 - t) ** 3;
const vplus = (a, b) => [a[0] + b[0], a[1] + b[1]], vtimes = (a, k) => [a[0] * k, a[1] * k];
const vturn = ([x, y], deg) => { const c = Math.cos(deg * RAD), s = Math.sin(deg * RAD); return [x * c - y * s, x * s + y * c]; };
const vdir = deg => [Math.sin(deg * RAD), -Math.cos(deg * RAD)]; // 0° points up, clockwise from there
const mirrorY = pts => pts.map(([x, y]) => [x, -y]);
// a smooth path through points: Catmull–Rom written as cubic Béziers
function curve(pts, closed = true) {
  const n = pts.length, at = i => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  let d = `M${n2(pts[0][0])} ${n2(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    d += `C${n2(p1[0] + (p2[0] - p0[0]) / 6)} ${n2(p1[1] + (p2[1] - p0[1]) / 6)} ${n2(p2[0] - (p3[0] - p1[0]) / 6)} ${n2(p2[1] - (p3[1] - p1[1]) / 6)} ${n2(p2[0])} ${n2(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
}
// smooth runs joined by straight edges, closed: for outlines with a few real corners
const runs = (...rs) => rs.map((r, i) => i ? curve(r, false).replace('M', 'L') : curve(r, false)).join('') + 'Z';
// is p inside the polygon? and the nearest point to p on a polygon's edge
function insidePoly([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside; }
  return inside;
}
function nearestOn(p, poly) {
  let best = poly[0], bd = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], dx = b[0] - a[0], dy = b[1] - a[1], k = clamp01(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)), q = [a[0] + dx * k, a[1] + dy * k], d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;
    if (d < bd) { bd = d; best = q; }
  }
  return best;
}
let SID = 0;
const uid = p => `${p}${++SID}`;

/* ---------- phones, and calm scenes ---------- */
// Labels grow on phones, where the stage is drawn at about 70% size, so their text stays readable.
// Every screen plays the scenes calmly: once the camera arrives it holds still and the patient doesn't breathe, so
// between moves only the small part that is moving is redrawn, not the whole shaded body. A slow drift or a breath
// moves the whole scene, and Safari then recomputes every blur and shading filter on every frame, which stutters
// even on a fast Mac (Chrome hides it by doing the same work on the graphics card).
const UI = matchMedia('(max-width: 600px)').matches ? 1.25 : 1, CALM = true;
// setting an SVG attribute to the value it already has still makes the browser redraw, so skip those
const svgSet = Element.prototype.setAttribute;
SVGElement.prototype.setAttribute = function (k, v) { v = String(v); if (this.getAttribute(k) !== v) svgSet.call(this, k, v); };

// whether something is on screen, for timers that should only change what someone can actually see
const seenIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { e.target._seen = e.isIntersecting; })) : null;
function onView(n) { if (seenIO) { n._seen = false; seenIO.observe(n); } else n._seen = true; return () => n._seen; }

/* ---------- the clock ---------- */
// Each scene registers a tick(t) that draws it at t seconds since it first came into view. Off-screen scenes
// keep their frame and stop counting; with reduced motion a scene shows one considered frame and never moves.
const LIVE = new Set();
let clockId = 0, clockLast = 0;
// the clock only runs while a scene is on screen; with none in view it stops completely until one scrolls back
const onScreen = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
  e.target._vis = e.isIntersecting; e.target.classList.toggle('off', !e.isIntersecting);
  if (e.isIntersecting) wakeClock();
}), { rootMargin: '120px' }) : null;
function wakeClock() { if (!clockId && LIVE.size) { clockLast = performance.now(); clockId = requestAnimationFrame(clockFrame); } }
function play(svg, tick, poster) {
  svg._t = 0; svg._tick = tick; svg._born = performance.now();
  if (reduceMotion) { tick(poster); return; }
  tick(0);
  if (onScreen) onScreen.observe(svg); else svg._vis = true;
  LIVE.add(svg);
  wakeClock();
}
function clockFrame(now) {
  const dt = Math.min(now - clockLast, 50) / 1000;
  clockLast = now;
  let any = false;
  LIVE.forEach(s => {
    // a scene is dropped once it stops or has been out of the page for a moment (it's drawn before it's attached)
    if (s._stop || (!s.isConnected && now - s._born > 1000)) { LIVE.delete(s); onScreen && onScreen.unobserve(s); return; }
    if (!s._vis && s.isConnected) return;
    any = true;
    if (s._vis) { s._t += dt; s._tick(s._t); }
  });
  clockId = any ? requestAnimationFrame(clockFrame) : 0;
}
// named parts of a scene, from data-r attributes
function parts(svg) { const r = {}; svg.querySelectorAll('[data-r]').forEach(n => { r[n.dataset.r] = n; }); return r; }
const setAttrs = (n, a) => { for (const k in a) n.setAttribute(k, a[k]); };

/* ---------- shared paint ---------- */
const INK = {
  skin: ['#F9FAFC', '#D6DBE8'], hand: ['#FBFBFD', '#D8DDEA'], handLine: '#9DA5BC', crease: '#AEB5CA',
  hair: ['#C9CEDC', '#B0B7CB'], bone: '#FFFFFF', boneLine: '#A3ACC4', disc: '#B9E8FA',
  couch: ['#E8EBF2', '#DDE2EB'], couchEdge: '#C4CBD9', shade: '#2B3192',
  sky: '#00A8EC', skyDeep: '#0079B8', skySoft: '#E6F6FD', heat: '#FF8A4C', heatSoft: '#FFE3D2', ink: '#565A6E'
};
// filters work in the units of the element they sit on: "Cm" for bodies drawn in centimetres
const ANATOMY_DEFS = `
<linearGradient id="aSkin" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${INK.skin[0]}"/><stop offset="1" stop-color="${INK.skin[1]}"/></linearGradient>
<linearGradient id="aSkinProne" gradientUnits="userSpaceOnUse" x1="20" y1="-34" x2="52" y2="36"><stop offset="0" stop-color="${INK.skin[0]}"/><stop offset="1" stop-color="${INK.skin[1]}"/></linearGradient>
<linearGradient id="aHand" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="${INK.hand[0]}"/><stop offset="1" stop-color="${INK.hand[1]}"/></linearGradient>
<linearGradient id="aHair" x1="0" y1="0" x2="1" y2=".4"><stop offset="0" stop-color="${INK.hair[0]}"/><stop offset="1" stop-color="${INK.hair[1]}"/></linearGradient>
<linearGradient id="aCouch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${INK.couch[0]}"/><stop offset="1" stop-color="${INK.couch[1]}"/></linearGradient>
<linearGradient id="aBone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#ECEFF6"/></linearGradient>
<linearGradient id="aNail" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E6E9F2"/></linearGradient>
<radialGradient id="aGlow"><stop offset="0" stop-color="${INK.sky}" stop-opacity=".55"/><stop offset=".5" stop-color="${INK.sky}" stop-opacity=".18"/><stop offset="1" stop-color="${INK.sky}" stop-opacity="0"/></radialGradient>
<radialGradient id="aHeat"><stop offset="0" stop-color="${INK.heat}" stop-opacity=".6"/><stop offset=".55" stop-color="${INK.heat}" stop-opacity=".2"/><stop offset="1" stop-color="${INK.heat}" stop-opacity="0"/></radialGradient>
<radialGradient id="aLens"><stop offset="0" stop-color="#fff"/><stop offset=".62" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<filter id="aClayCm" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB">
<feOffset in="SourceAlpha" dx="-1" dy="-1.3"/><feGaussianBlur stdDeviation="1.6" result="ob"/>
<feComposite in="SourceAlpha" in2="ob" operator="out" result="sm"/>
<feFlood flood-color="${INK.shade}" flood-opacity=".2"/><feComposite in2="sm" operator="in" result="shade"/>
<feOffset in="SourceAlpha" dx=".7" dy=".9"/><feGaussianBlur stdDeviation="1" result="hb"/>
<feComposite in="SourceAlpha" in2="hb" operator="out" result="hm"/>
<feFlood flood-color="#FFFFFF" flood-opacity=".95"/><feComposite in2="hm" operator="in" result="hi"/>
<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="shade"/><feMergeNode in="hi"/></feMerge>
</filter>
<filter id="aClaySm" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
<feOffset in="SourceAlpha" dx="-.45" dy="-.6"/><feGaussianBlur stdDeviation=".6" result="ob"/>
<feComposite in="SourceAlpha" in2="ob" operator="out" result="sm"/>
<feFlood flood-color="${INK.shade}" flood-opacity=".24"/><feComposite in2="sm" operator="in" result="shade"/>
<feOffset in="SourceAlpha" dx=".3" dy=".4"/><feGaussianBlur stdDeviation=".4" result="hb"/>
<feComposite in="SourceAlpha" in2="hb" operator="out" result="hm"/>
<feFlood flood-color="#FFFFFF" flood-opacity=".9"/><feComposite in2="hm" operator="in" result="hi"/>
<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="shade"/><feMergeNode in="hi"/></feMerge>
</filter>
<linearGradient id="aArmFadeG" gradientUnits="userSpaceOnUse" x1="0" y1="8" x2="0" y2="44"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
<mask id="aArmFade" maskUnits="userSpaceOnUse" x="-300" y="-300" width="600" height="600"><rect x="-300" y="-300" width="600" height="600" fill="url(#aArmFadeG)"/></mask>
<filter id="aOutline" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feMorphology in="SourceAlpha" operator="dilate" radius=".28" result="d"/><feComposite in="d" in2="SourceAlpha" operator="out" result="edge"/><feFlood flood-color="${INK.sky}"/><feComposite in2="edge" operator="in"/></filter>
<filter id="aSoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".45"/></filter>
<filter id="aSofter" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.2"/></filter>
<filter id="aSoftH" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.5"/></filter>
<filter id="aBlur" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.4"/></filter>`;
function ensureAnatomyDefs() {
  if ($('#anatomy-defs')) return;
  ensureFigDefs();
  document.body.prepend(svgEl({ id: 'anatomy-defs', width: '0', height: '0', 'aria-hidden': 'true', focusable: 'false', style: 'position:absolute' }, `<defs>${ANATOMY_DEFS}</defs>`));
}
// union outline: every piece stroked underneath, then filled on top, so overlaps merge into one clean contour
const solid = (ds, fill, line, w) => `<g fill="none" stroke="${line}" stroke-width="${w}" stroke-linejoin="round">${ds.map(d => `<path d="${d}"/>`).join('')}</g><g fill="${fill}">${ds.map(d => `<path d="${d}"/>`).join('')}</g>`;

/* ---------- the patient lying face down, seen from above ---------- */
// Centimetres: x runs from the crown toward the feet, y across the body (0 is the spine). Landmarks follow an adult:
// C7 at the base of the neck, the scapulae from T2 to T7, the iliac crests level with L4, the sacral dimples at S2.
const SPINE_X = { C7: 27, T1: 29, T2: 31.2, T3: 33.4, T4: 35.6, T5: 37.8, T6: 40, T7: 42.3, T8: 44.6, T9: 47, T10: 49.5, T11: 52.1, T12: 54.8, L1: 57.9, L2: 61.6, L3: 65.4, L4: 69.2, L5: 72.9, S1: 76.4 };
// One outline for the whole body, arms included, so the shoulders flow into the arms with no joins. The arms lie
// relaxed along the sides, palms up: the deltoid is the widest point of the upper body, the arm rests against the
// chest wall down to the armpit, then a gap opens toward the waist. The hands are separate but share the surface.
const PRONE_SIDE = [[17.5, 5.3], [22, 5.6], [25.4, 6.6], [27.4, 9.6], [28.8, 13.8], [30.2, 17.6], [32.2, 21], [35, 23.3], [40, 24.5], [48, 25.6], [56, 26.9], [60, 27.5],
  [66, 28.3], [72, 28.4], [78, 28], [84.6, 27.6], [84.6, 23.2], [78, 22.7], [72, 22], [66, 21.4], [60, 20.9], [55, 20.1], [51, 19.2], [48.2, 18.6], [50.2, 17.8], [54, 16.5],
  [57.5, 15.3], [62, 14.6], [67, 15.6], [73, 17.3], [80, 18.3], [87, 18.8], [94, 18.4], [102, 17.5], [112, 16.5], [126, 15.3], [150, 13.9]];
const PRONE_INNER = [[150, 2.8], [128, 1.7], [114, .8], [105, 0]];
const PRONE_OUTLINE = runs(PRONE_SIDE, [[150, 13.9], ...PRONE_INNER], [[105, 0], ...mirrorY(PRONE_INNER).reverse(), [150, -13.9]], [[150, -13.9], ...mirrorY(PRONE_SIDE).reverse()]);
const PRONE_HEAD = curve([[.6, 0], [1.5, -4.5], [4.6, -7.2], [9.4, -8], [14, -7.4], [17.6, -5.4], [19.8, -2.5], [20.4, 0], [19.8, 2.5], [17.6, 5.4], [14, 7.4], [9.4, 8], [4.6, 7.2], [1.5, 4.5]]);
const PRONE_HAIR = curve([[.5, 0], [1.4, -4.6], [4.6, -7.4], [9.4, -8.2], [13.8, -7.5], [16.4, -5.8], [17.4, -3.4], [16.9, -1.2], [17.5, 0], [16.9, 1.2], [17.4, 3.4], [16.4, 5.8], [13.8, 7.5], [9.4, 8.2], [4.6, 7.4], [1.4, 4.6]]);
// soft surface anatomy, as shading rather than lines: grooves sink, ridges catch the light
const GROOVES = [
  ['M30 0 L46 0', .5, .14], ['M46 0 L78 0', .9, .2], // the furrow between the two columns of back muscle
  ['M80.5 0 C88 0 98 0 106 0', .6, .32], // gluteal cleft
  ['M103 1 C106.4 5 106.2 11.5 101.4 16.6', .7, .18], ['M103 -1 C106.4 -5 106.2 -11.5 101.4 -16.6', .7, .18],
  ['M32 6.8 C36.4 7.2 40.6 8.2 43.4 9.8', 1.6, .06], ['M32 -6.8 C36.4 -7.2 40.6 -8.2 43.4 -9.8', 1.6, .06], // medial borders of the scapulae
  ['M37 21.2 C41 21.6 45 21.2 48.4 18.8', .8, .12], ['M37 -21.2 C41 -21.6 45 -21.2 48.4 -18.8', .8, .12], // the arm resting against the chest wall
  ['M67.8 7.8 C69 10.6 71 13.6 74.2 16.4', .45, .14], ['M67.8 -7.8 C69 -10.6 71 -13.6 74.2 -16.4', .45, .14], // iliac crests
  ['M46 15.4 C52 12.6 58 11.6 63 12', .45, .1], ['M46 -15.4 C52 -12.6 58 -11.6 63 -12', .45, .1] // edge of the lats
];
const RIDGES = [['M50 3.4 L76 3.6', 1.4, .55], ['M50 -3.4 L76 -3.6', 1.4, .55], ['M33 10.4 C36 10.6 39.6 11.6 41.6 13', 2.2, .4], ['M33 -10.4 C36 -10.6 39.6 -11.6 41.6 -13', 2.2, .4], ['M36 23 L58 25.4', 2.4, .35], ['M36 -23 L58 -25.4', 2.4, .35]];
function proneBody() {
  const clip = uid('bodyClip');
  const palm = handBack({ thumb: -16, thumbLen: 47, curl: .55, splay: .55, arm: 16, palm: true });
  const hp = left => ({ x: 83.8, y: left ? -25.4 : 25.4, deg: 90, size: 17.5, left });
  const handPaths = [false, true].map(left => `<path d="${handOutlineAt(palm, hp(left))}"/>`).join('');
  const handLines = [false, true].map(left => { const q = hp(left), k = q.size / 100; return `<g transform="translate(${q.x} ${q.y}) rotate(90) scale(${left ? -k : k} ${k})">${palm.detail}</g>`; }).join('');
  const groove = ([d, w, o]) => `<path d="${d}" stroke="${INK.shade}" stroke-width="${w}" opacity="${o}"/>`;
  const ridge = ([d, w, o]) => `<path d="${d}" stroke="#fff" stroke-width="${w}" opacity="${o}"/>`;
  return `<defs><clipPath id="${clip}"><path d="${PRONE_OUTLINE}"/></clipPath></defs>
    <rect x="-18" y="-35" width="200" height="70" rx="5" fill="url(#aCouch)"/><rect x="-18" y="35" width="200" height="2.8" rx="1.4" fill="${INK.couchEdge}"/>
    <rect x="-16.4" y="-33.4" width="200" height="66.8" rx="4" fill="none" stroke="#fff" stroke-width=".35" opacity=".9"/>
    <g data-r="breathe"><g opacity=".22" filter="url(#aSofter)" fill="${INK.shade}" transform="translate(.5 1.4)"><path d="${PRONE_OUTLINE}"/><path d="${PRONE_HEAD}"/>${handPaths}</g>
    <g filter="url(#aClayCm)" fill="url(#aSkinProne)"><ellipse cx="12.6" cy="7.7" rx="2.7" ry="1.25"/><ellipse cx="12.6" cy="-7.7" rx="2.7" ry="1.25"/><path d="${PRONE_OUTLINE}"/><path d="${PRONE_HEAD}"/>${handPaths}</g>${handLines}
    <g clip-path="url(#${clip})" fill="none" stroke-linecap="round"><g filter="url(#aSoft)">${GROOVES.map(groove).join('')}</g><g filter="url(#aSofter)">${RIDGES.map(ridge).join('')}</g>
      <ellipse cx="78.6" cy="4.5" rx="1" ry=".75" fill="${INK.shade}" opacity=".22" filter="url(#aSoft)"/><ellipse cx="78.6" cy="-4.5" rx="1" ry=".75" fill="${INK.shade}" opacity=".22" filter="url(#aSoft)"/>
      <ellipse cx="93" cy="9" rx="7" ry="5.4" fill="#fff" opacity=".35" filter="url(#aSofter)"/><ellipse cx="93" cy="-9" rx="7" ry="5.4" fill="#fff" opacity=".35" filter="url(#aSofter)"/></g>
    <g filter="url(#aClayCm)"><path d="${PRONE_HAIR}" fill="url(#aHair)"/></g>
    <ellipse cx="7.4" cy="-2.6" rx="4.6" ry="3" fill="#fff" opacity=".35" filter="url(#aSofter)"/></g>
    <g fill="none" stroke="#7A829E" stroke-width=".35" stroke-linecap="round" opacity=".16" filter="url(#aSoft)">${[-150, -115, -80, -45, -10, 25, 60, 95, 130, 165].map(a => { const d = vdir(a + 90); return `<path d="M${n2(11 + d[0] * 1.2)} ${n2(d[1] * 1.2)}Q${n2(11 + d[0] * 4 - d[1] * 1.5)} ${n2(d[1] * 4 + d[0] * 1.5)} ${n2(11 + d[0] * 6.4)} ${n2(d[1] * 6.2)}"/>`; }).join('')}</g>`;
}

/* ---------- bones, seen from behind ---------- */
// One vertebra at a time, centred on its body: u runs down the spine, v across it. Lumbar ones are broad with short,
// square spinous processes; thoracic ones are smaller, with long spinous processes that slope down over the next one.
const roundRect = (u0, u1, v0, v1, r) => `M${n2(u0 + r)} ${n2(v0)}H${n2(u1 - r)}Q${n2(u1)} ${n2(v0)} ${n2(u1)} ${n2(v0 + r)}V${n2(v1 - r)}Q${n2(u1)} ${n2(v1)} ${n2(u1 - r)} ${n2(v1)}H${n2(u0 + r)}Q${n2(u0)} ${n2(v1)} ${n2(u0)} ${n2(v1 - r)}V${n2(v0 + r)}Q${n2(u0)} ${n2(v0)} ${n2(u0 + r)} ${n2(v0)}Z`;
const oval = (u, v, ru, rv) => `M${n2(u - ru)} ${n2(v)}A${ru} ${rv} 0 1 0 ${n2(u + ru)} ${n2(v)}A${ru} ${rv} 0 1 0 ${n2(u - ru)} ${n2(v)}Z`;
function vertebraBack(level) {
  const lumbar = level[0] === 'L', i = +level.slice(1);
  if (lumbar) {
    const tp = [3.4, 3.8, 4.3, 4, 3.7][i - 1], tilt = i === 5 ? -.5 : 0;
    const transverse = s => `M${n2(-.95 + tilt)} ${n2(s * 1.5)}L${n2(-.95 + tilt * 1.6)} ${n2(s * (tp - .2))}Q${n2(-.6 + tilt * 1.6)} ${n2(s * (tp + .25))} ${n2(-.2 + tilt * 1.6)} ${n2(s * (tp - .15))}L${n2(.15 + tilt)} ${n2(s * 1.5)}Z`;
    return [roundRect(-1.35, 1.35, -2.45, 2.45, .8), transverse(1), transverse(-1), roundRect(-1.15, 1.05, -1.75, 1.75, .6),
      roundRect(-.7, 2.05, -.62, .62, .5), oval(1.55, 0, .62, .82), oval(-1.6, 1.72, .62, .55), oval(-1.6, -1.72, .62, .55), oval(1.38, 1.12, .58, .48), oval(1.38, -1.12, .58, .48)];
  }
  const s = .82 + i * .012;
  const transverse = k => `M${n2(-.55 * s)} ${n2(k * 1.1 * s)}L${n2(-1.1 * s)} ${n2(k * 2.75 * s)}Q${n2(-.85 * s)} ${n2(k * 3.15 * s)} ${n2(-.35 * s)} ${n2(k * 2.85 * s)}L${n2(.35 * s)} ${n2(k * 1.1 * s)}Z`;
  return [roundRect(-.95 * s, .95 * s, -1.75 * s, 1.75 * s, .55 * s), transverse(1), transverse(-1), roundRect(-.85 * s, .75 * s, -1.25 * s, 1.25 * s, .5 * s),
    `M${n2(-.35 * s)} ${n2(-.4 * s)}L${n2(2.5 * s)} ${n2(-.26 * s)}Q${n2(2.95 * s)} 0 ${n2(2.5 * s)} ${n2(.26 * s)}L${n2(-.35 * s)} ${n2(.4 * s)}Z`];
}
// the spine from one level to another, with the discs between the vertebral bodies
function spineBack(from = 'T10', to = 'L5') {
  const order = Object.keys(SPINE_X), lv = order.slice(order.indexOf(from), order.indexOf(to) + 1).filter(l => l !== 'S1' && l !== 'C7');
  const discs = lv.slice(1).map((l, j) => { const a = SPINE_X[lv[j]], b = SPINE_X[l], th = l[0] === 'L' ? .95 : .5, w = l[0] === 'L' ? 2.3 : 1.55; return `<rect x="${n2((a + b) / 2 - th / 2)}" y="${-w}" width="${th}" height="${w * 2}" rx="${th / 2}" fill="${INK.disc}" stroke="#7FD3F5" stroke-width=".12"/>`; }).join('');
  return discs + lv.map(l => `<g data-r="${l}" transform="translate(${SPINE_X[l]} 0)">${solid(vertebraBack(l), 'url(#aBone)', INK.boneLine, .2)}</g>`).join('');
}

/* ---------- the physiotherapist's hand, seen from the back ---------- */
// A right hand, wrist crease at 0,0, fingers pointing up (−y), in hundredths of its length (wrist to middle fingertip,
// about 18.5 cm). Measured proportions: the middle finger longest, the ring finger a little longer than the index,
// the little finger reaching the ring finger's last crease, finger joints at 46% and 76%. The whole hand is one
// silhouette, from forearm round every finger and the thumb, so it reads as a sculpted hand rather than parts.
const DIGITS = [ // knuckle, length, width, direction°, curve°
  [[-14.2, -51], 46, 10.6, -7, 3], [[-3.8, -54], 51, 11.1, -1.5, 1], [[6.5, -52], 48, 10.5, 4.5, -2], [[15.6, -47], 38.5, 9.1, 11, -5]];
const DIGIT_W = [[0, 1.02], [.2, 1], [.35, .93], [.46, .95], [.6, .86], [.76, .83], [.87, .79]];
const widthAt = t => { for (let i = 1; i < DIGIT_W.length; i++) if (t <= DIGIT_W[i][0]) return mix(DIGIT_W[i - 1][1], DIGIT_W[i][1], (t - DIGIT_W[i - 1][0]) / (DIGIT_W[i][0] - DIGIT_W[i - 1][0])); return .79; };
// a finger (or thumb) as a curved centreline with a width: side(t, ±1) walks its edges, tip() rounds it off
function digitGeo(base, len, w, deg, bend = 0, wf = widthAt) {
  const c = t => { let p = base; const n = 8; for (let i = 0; i < n; i++) p = vplus(p, vtimes(vdir(deg + bend * (i + .5) / n * t), len * t / n)); return p; };
  const nrm = t => { const d = vdir(deg + bend * t); return [-d[1], d[0]]; };
  const side = (t, k) => vplus(c(t), vtimes(nrm(t), k * w * wf(t) / 2));
  const r = w * wf(.87) / 2, tc = 1 - r * .9 / len;
  const tip = dir => [60, 30, 0, -30, -60].map(a => a * dir).map(a => { const d = vdir(deg + bend * tc + a); return vplus(c(tc), [d[0] * r * (a === 0 ? .95 : 1), d[1] * r * (a === 0 ? .95 : 1)]); });
  return { c, side, nrm, tip, end: c(1) };
}
function handBack(o = {}) {
  const thumbDeg = o.thumb ?? -40, splay = o.splay ?? 1, arm = o.arm ?? 110, fold = o.curl ?? 0;
  const F = DIGITS.map(([b, len, w, deg, bend]) => ({ g: digitGeo(b, len * (1 - .08 * fold), w, deg * splay, bend), w }));
  const TW = [[0, 1.3], [.22, 1.08], [.45, 1], [.6, .95], [.75, .94], [.87, .88]];
  const T = digitGeo([-15.2, -12], o.thumbLen ?? 53, 12.4, thumbDeg, 4, t => { for (let i = 1; i < TW.length; i++) if (t <= TW[i][0]) return mix(TW[i - 1][1], TW[i][1], (t - TW[i - 1][0]) / (TW[i][0] - TW[i - 1][0])); return .88; });
  const up = [.2, .35, .46, .6, .76, .87], down = [...up].reverse();
  const pts = [], pushAll = a => a.forEach(p => pts.push(p));
  const fw = arm, fx = t => mix(16, o.flare ?? 24, t);
  pushAll([[fx(span(fw, 0, 150)), fw], [fx(.4 * span(fw, 0, 150)), fw * .55], [18.2, 22], [16.8, 6], [17.2, -3], [18.6, -10], [19.8, -21], [20.6, -32], [20.9, -41]]);
  F.slice().reverse().forEach(({ g }, i, arr) => {
    pushAll(up.map(t => g.side(t, 1))); pushAll(g.tip(1)); pushAll(down.map(t => g.side(t, -1)));
    const next = arr[i + 1];
    if (next) { const a = g.side(.2, -1), b = next.g.side(.2, 1); pts.push(vplus(vtimes(vplus(a, b), .5), [0, 2.2])); }
  });
  const ib = F[0].g.side(.12, -1), ti = T.side(.42, 1), mid = vplus(vtimes(vplus(ib, ti), .5), vtimes(vplus([-5, -30], vtimes(vplus(ib, ti), -.5)), .28));
  pushAll([F[0].g.side(.08, -1), [-20.4, -44.5], mid]);
  pushAll([.42, .55, .66, .76, .87].map(t => T.side(t, 1))); pushAll(T.tip(1)); pushAll([.87, .76, .62, .45, .3, .15, 0].map(t => T.side(t, -1)));
  const th0 = T.side(0, -1);
  pushAll([[mix(th0[0], -16.6, .55) - 1.4, mix(th0[1], 5, .55)], [-16.6, 6], [-17.6, 22], [-fx(.4 * span(fw, 0, 150)), fw * .55], [-fx(span(fw, 0, 150)), fw]]);
  const outline = curve(pts, false) + 'Z';
  const all = [...F.map(f => ({ g: f.g, w: f.w })), { g: T, w: 12.4 }];
  // light comes from the upper left: a soft sheen down the lit side of each finger, shade along the far side
  const sheen = all.map(({ g, w }) => curve([.24, .46, .7, .9].map(t => g.side(t, -.32)), false)).join('');
  const shade = F.map(({ g, w }) => curve([.2, .46, .72, .9].map(t => g.side(t, .62)), false)).join('');
  const ridges = F.map(({ g }, i) => curve([[-7 + i * 4.6, -4], [mix(-7 + i * 4.6, g.c(0)[0], .55), -26], vplus(g.c(0), [0, 3])], false)).join('');
  const valleys = F.slice(1).map(({ g }, i) => { const a = vtimes(vplus(F[i].g.side(.16, 1), g.side(.16, -1)), .5); return `M${n2(a[0])} ${n2(a[1])}L${n2(a[0] + (i - 1) * .8)} ${n2(a[1] + 13)}`; }).join('');
  const nails = all.map(({ g, w }, i) => { const k = i === 4 ? .42 : .52, sh = i === 4 ? -.14 : 0; return curve([[.83, -1], [.9, -1.08], [.955, -.92], [.985, -.4], [.99, 0], [.985, .4], [.955, .92], [.9, 1.08], [.83, 1], [.815, 0]].map(([t, s]) => g.side(t, (s * k + sh)))); }).join('');
  const knuckles = F.map(({ g }) => { const p = g.c(.02); return `<ellipse cx="${n2(p[0])}" cy="${n2(p[1] + .5)}" rx="4.4" ry="3.2"/>`; }).join('');
  const joints = F.map(({ g }) => [.46, .76].map(t => curve([g.side(t, -.5), vplus(g.c(t), vtimes(vdir(0), -.6)), g.side(t, .5)], false)).join('')).join('');
  const thumbTip = T.c(1);
  const palmLines = curve([[-12, -14], [-8, -22], [-6.5, -30], [-8.6, -38]], false) + curve([[-17.5, -36], [-6, -38.5], [6, -40], [14, -36.5]], false) + curve([[-4, -43.5], [6, -46.5], [15, -46], [20, -41]], false)
    + F.map(({ g }) => [.22, .48, .76].map(t => curve([g.side(t, -.42), g.side(t, .42)], false)).join('')).join('');
  if (o.palm) return { pts, shapes: [outline], thumbTip: T.c(1), detail: `<path d="${palmLines}" fill="none" stroke="${INK.shade}" stroke-width="1" stroke-linecap="round" opacity=".1" filter="url(#aSoftH)"/>
    <path d="${curve([.3, .55, .8].map(t => T.side(t, -.3)), false)}${F.map(({ g }) => curve([.3, .6, .88].map(t => g.side(t, -.3)), false)).join('')}" fill="none" stroke="#fff" stroke-width="3" opacity=".7" filter="url(#aSoftH)"/>` };
  const detail = `<g fill="none" stroke-linecap="round"><path d="${shade}" stroke="${INK.shade}" stroke-width="3.2" opacity=".1" filter="url(#aSoftH)"/>
      <path d="${sheen}" stroke="#fff" stroke-width="3.4" opacity=".85" filter="url(#aSoftH)"/><path d="${ridges}" stroke="#fff" stroke-width="2.4" opacity=".35" filter="url(#aSoftH)"/><path d="${valleys}" stroke="${INK.shade}" stroke-width="2" opacity=".13" filter="url(#aSoftH)"/><path d="${joints}" stroke="${INK.shade}" stroke-width="1.6" opacity=".1" filter="url(#aSoftH)"/></g>
    <g fill="#fff" opacity=".7" filter="url(#aSoftH)">${knuckles}</g>
    <path d="${nails}" fill="url(#aNail)" stroke="#C6CCDB" stroke-width=".45"/>`;
  return { pts, shapes: [outline], thumbTip, tips: F.map(f => f.g.end), detail, markup: `<path d="${outline}" fill="url(#aHand)" stroke="#BCC3D5" stroke-width=".7"/>${detail}` };
}
// the same hand's silhouette already placed in the scene, so it can share one surface with the arm it belongs to
const handOutlineAt = (h, place) => curve(h.pts.map(p => handPoint(p, place)), false) + 'Z';
// places a hand in the scene (cm): at x,y, turned deg, size cm long; left hands are mirror images.
// Shading sits outside the mirror so the light falls the same way on both hands.
// fade: the forearm dissolves as it rises out of the picture toward the physiotherapist
function placeHand(h, { x, y, deg = 0, size = 18.5, left = false, r, fade }) {
  const k = size / 100;
  return `<g ${r ? `data-r="${r}"` : ''} transform="translate(${n2(x)} ${n2(y)}) rotate(${n2(deg)})"><g filter="url(#aClaySm)"><g transform="scale(${left ? -k : k} ${k})"${fade ? ' mask="url(#aArmFade)"' : ''}>${h.markup}</g></g></g>`;
}
// where a point of the hand (in its own units) lands in the scene
function handPoint(p, { x, y, deg = 0, size = 18.5, left = false }) { const k = size / 100, q = vturn([p[0] * (left ? -k : k), p[1] * k], deg); return [x + q[0], y + q[1]]; }
// the hand's shadow on the skin, for the same placement
function handShadow(h, place, r) {
  const k = place.size / 100 || .185;
  return `<g data-r="${r}" opacity=".3"><g transform="translate(${n2(place.x)} ${n2(place.y)}) rotate(${n2(place.deg || 0)})"><g transform="scale(${place.left ? -k : k} ${k})" fill="${INK.shade}">${h.shapes.map(d => `<path d="${d}"/>`).join('')}</g></g></g>`;
}

/* ---------- the body from the side ---------- */
// A rig in centimetres for a body facing +x. Angles are degrees clockwise from straight up, so a positive bend curls
// forward (flexion). The pelvis carries the hips and the base of the spine; 24 segments run from L5 to the skull,
// each with its length and how far the skin lies behind and in front of it; arms and legs are two-bone chains.
const SEGS = [ // level, length, skin behind, skin in front
  ['L5', 4, 7, 9.6], ['L4', 4, 7.4, 10.4], ['L3', 3.9, 7.5, 11], ['L2', 3.8, 7.4, 11.6], ['L1', 3.6, 7.2, 12.4],
  ['T12', 3.2, 7, 13.6], ['T11', 3, 6.9, 15], ['T10', 2.8, 6.9, 16.4], ['T9', 2.65, 7, 17.6], ['T8', 2.55, 7.2, 19], ['T7', 2.45, 7.4, 19.3], ['T6', 2.35, 7.5, 19.1],
  ['T5', 2.25, 7.5, 18.5], ['T4', 2.15, 7.4, 17.4], ['T3', 2.05, 7.2, 15.7], ['T2', 2, 6.8, 13.3], ['T1', 2, 6.3, 10.9],
  ['C7', 1.75, 5.7, 8.4], ['C6', 1.6, 5.1, 7.2], ['C5', 1.55, 4.8, 6.6], ['C4', 1.55, 4.6, 6.2], ['C3', 1.6, 4.5, 6], ['C2', 2, 4.6, 5.8], ['C1', 1.6, 4.8, 5.4]];
const SEG_I = Object.fromEntries(SEGS.map(([l], i) => [l, i]));
// the neutral standing curves, as a bend per segment: lumbar lordosis, thoracic kyphosis, cervical lordosis
const NEUTRAL = SEGS.map(([l], i) => l[0] === 'L' ? (i === 0 ? 0 : -12.5) : l[0] === 'T' ? 2.2 : -2.4);
const S1_AT = [-5.4, -10.6], SACRAL_SLOPE = 38; // S1 from the hip joint with the pelvis upright
// the pelvis as one rounded solid, from the hip joint with the pelvis upright: the groin in front, round under the hip
// joint to the fold of the buttock, up the buttock, and across the top; it stays inside the belly, which the spine draws
const PELVIS_SOLID = [[5.6, -13.4], [7.2, -8], [7.6, -2.6], [6.4, 2.2], [4.6, 6.2], [1.2, 9.1], [-3, 10.9], [-7.4, 11.4], [-11.4, 9.8], [-14.3, 5.6], [-15.3, 0], [-15, -5.4], [-13.4, -10.4], [-10.4, -14.4], [-4.6, -16.2], [.4, -16.2], [3.8, -15.2]];
// the head from the side, from the joint at the base of the skull: nape, round the crown and face, to under the jaw
const HEAD_SIDE = [[-5.4, 1.6], [-7.9, -2.2], [-8.8, -7.6], [-5.8, -12.9], [1.4, -15.3], [7.2, -12.8], [10, -8.8], [10.7, -5.4], [10.3, -3.6], [11.1, -1.6], [12.2, .5],
  [11.6, 1.5], [10.6, 1.9], [11.1, 2.8], [10.8, 3.6], [11, 4.6], [10.5, 6.3], [9.1, 7.6], [6.4, 7.8], [3.6, 7]];
const HAIR_SIDE = [[8.2, -11.4], [6.8, -13.8], [1.4, -15.9], [-6.1, -13.6], [-9.3, -7.8], [-8.6, -2.4], [-6.2, .6], [-4.6, -.6], [-3, -4.6], [-.4, -6.2], [2.6, -6.6], [4, -4.6], [5.2, -8.4], [7.2, -9.6]];
const limbW = { // posterior then anterior half-widths along the bone, at t = 0, .15, .35, .55, .75, .9, 1
  thigh: [[6.8, 8, 7.6, 7.1, 6.2, 5.6, 5.3], [6.6, 7.9, 7.8, 7.2, 6.4, 5.7, 5.5]], shin: [[5.3, 6.2, 6.3, 5.3, 4, 3.1, 2.9], [5.2, 4.6, 4.3, 3.9, 3.3, 3, 3]],
  upper: [[5.4, 5, 4.8, 4.4, 3.9, 3.5, 3.4], [4.8, 4.5, 4.5, 4.2, 3.7, 3.3, 3.3]], fore: [[3.5, 3.9, 3.8, 3.4, 3, 2.7, 2.6], [3.4, 3.8, 3.7, 3.3, 2.9, 2.6, 2.5]] };
const LIMB_T = [0, .15, .35, .55, .75, .9, 1];
const LEN = { thigh: 43, shin: 42, upper: 30, fore: 25.5 };
// feet and hands from the side, from the ankle or wrist, x along the foot or hand, +y toward the sole or palm
const FOOT_SIDE = [[-4.6, -3.2], [-5.6, .4], [-5.5, 4], [-4.2, 6.6], [-.6, 7.3], [6, 6.6], [13.6, 7.4], [18.2, 7.4], [20.2, 7], [21.1, 6.1], [21, 5.1], [20.1, 4.4], [18.4, 4], [12.8, 3], [6.4, .4], [2.6, -2.4], [.8, -3.6]];
// Seen from the thumb side: the middle finger makes the tip of the silhouette, the index finger and its nail sit just
// inside it, and the thumb lies along the near side. Flat is palm down on a surface; soft is relaxed and hanging.
const HAND_FLAT = [[0, -2.5], [3.5, -2.9], [7.5, -2.8], [9.6, -2.5], [11.2, -2.05], [13, -1.9], [14.8, -1.45], [16.6, -1.2], [18.2, -.75], [19.2, -.05], [19.1, .65], [18, 1.05], [15.8, 1.1], [13.8, 1.25], [12.2, 1.55], [10.6, 1.95], [9.4, 2.35], [6.8, 2.8], [3.6, 2.95], [1.2, 2.7], [0, 2.4]];
const HAND_FLAT_LINES = [ // index finger, its nail, the thumb and its nail, the knuckle crease
  [[10.2, -1.5], [12.6, -1.2], [15, -.9], [17, -.6], [18.15, -.1], [18.1, .5]], [[16.6, -.95], [17.6, -.7], [18.1, -.2]],
  [[1.6, -.9], [4.4, -1.35], [7.6, -.8], [9.8, -.05], [11, .7], [10.6, 1.35], [8.6, 1.3], [5.4, .95], [2.6, .7]], [[9.4, -.1], [10.5, .45], [10.6, .95]], [[12.4, -1.6], [12.9, -.6]]];
const HAND_SOFT = [[0, -2.5], [4.2, -2.8], [8.6, -2.5], [10.4, -2], [12.6, -1.3], [14.4, -.2], [15.6, 1.3], [16, 2.8], [15.4, 4.2], [14.4, 4.7], [13.3, 4.2], [12.4, 3.1], [11, 2.6], [9.2, 2.6], [6.4, 2.9], [3, 2.9], [0, 2.4]];
const HAND_SOFT_LINES = [[[10, -1.4], [12.2, -.7], [13.8, .6], [14.7, 2.2], [14.5, 3.5]], [[13.9, 1.7], [14.6, 2.6], [14.6, 3.4]],
  [[1.6, -.8], [4.6, -1.2], [7.8, -.4], [9.8, .6], [10.6, 1.6], [10, 2.2], [8, 1.8], [5, 1.2], [2.4, .8]], [[9.2, .5], [10.2, 1.2], [10.3, 1.8]]];
// the foot from the side, with the big toe's nail, the toe crease and the ankle bone
const FOOT_LINES = [[[17.6, 4.1], [19.4, 4.3], [20.3, 4.9]], [[15.8, 4.4], [16.4, 5.8], [16.2, 7]], [[-1.4, -1.2], [-.2, -1.9], [1, -1.2], [.2, -.3], [-1, -.4]]];
// a limb segment from a to b, with posterior and anterior half-widths along it
function limbPts(a, b, [wb, wf]) {
  const th = Math.atan2(b[0] - a[0], -(b[1] - a[1])) / RAD, len = Math.hypot(b[0] - a[0], b[1] - a[1]), d = vdir(th), nb = vdir(th + 90), nf = vdir(th - 90);
  const at = (t, n, w) => vplus(vplus(a, vtimes(d, t * len)), vtimes(n, w));
  return { back: LIMB_T.map((t, i) => at(t, nb, wb[i])), front: LIMB_T.map((t, i) => at(t, nf, wf[i])), th };
}
const limbPath = seg => curve([...seg.back, ...seg.front.slice().reverse()]);
// one light across a whole figure: a gradient in the scene's own centimetres
const skinGrad = (id, [x1, y1], [x2, y2]) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${INK.skin[0]}"/><stop offset="1" stop-color="${INK.skin[1]}"/></linearGradient>`;
const circlePath = ([x, y], r) => `M${n2(x - r)} ${n2(y)}A${r} ${r} 0 1 0 ${n2(x + r)} ${n2(y)}A${r} ${r} 0 1 0 ${n2(x - r)} ${n2(y)}Z`;
// a shape given in its own frame (x along th, +y to the side `side` = ±1), placed at o
const placed = (pts, o, th, side = 1) => pts.map(([x, y]) => vplus(o, vplus(vtimes(vdir(th), x), vtimes(vdir(th + 90 * side), y))));
// two-bone reach: where the middle joint sits for a chain from root to tip; bend +1 or −1 picks the side it folds to
function reach(root, tip, a, b, bend) {
  const dx = tip[0] - root[0], dy = tip[1] - root[1], d = Math.min(Math.hypot(dx, dy), (a + b) * .9995), th = Math.atan2(dx, -dy) / RAD;
  const ang = Math.acos(clamp01((a * a + d * d - b * b) / (2 * a * d) * .5 + .5) * 2 - 1) / RAD;
  return vplus(root, vtimes(vdir(th + bend * ang), a));
}
// the whole body for a pose; returns outlines and the joints scenes need
// pose: hip, phi (pelvis tilt, 0 upright, + tips forward), bends (per segment, added to neutral), breath (−1…1), stretch (cm per
// lumbar disc), head (extra nod), legs/arms as [near, far] of { knee|elbow, ankle|wrist, foot|hand angle }
function sideBody(o) {
  const bends = NEUTRAL.map((b, i) => b + (o.bends ? o.bends[i] || 0 : 0));
  let th = o.phi + SACRAL_SLOPE, p = vplus(o.hip, vturn(S1_AT, o.phi));
  const segs = SEGS.map(([lvl, len, back, front], i) => {
    th += bends[i];
    const L = len + (lvl[0] === 'L' ? o.stretch || 0 : 0), c = vplus(p, vtimes(vdir(th), L / 2)), q = p;
    p = vplus(p, vtimes(vdir(th), L));
    const swell = o.breath ? o.breath * (i >= 2 && i <= 14 ? (i <= 6 ? .03 : .045) : 0) : 0;
    return { lvl, th, p0: q, c, len: L, back: vplus(c, vtimes(vdir(th - 90), back)), front: vplus(c, vtimes(vdir(th + 90), front * (1 + swell))) };
  });
  const headTh = th + (o.head || 0), ao = p, T3 = segs[SEG_I.T3], shoulder = vplus(vplus(T3.c, vtimes(vdir(T3.th + 90), 3.6)), vtimes(vdir(T3.th), 1.6));
  // lite: just the skeleton, for solvers that only need to know where a joint lands
  if (o.lite) return { segs, ao, headTh, shoulder, hip: o.hip, phi: o.phi };
  const head = HEAD_SIDE.map(([x, y]) => vplus(ao, vplus(vtimes(vdir(headTh + 90), x), vtimes(vdir(headTh + 180), y))));
  const hair = HAIR_SIDE.map(([x, y]) => vplus(ao, vplus(vtimes(vdir(headTh + 90), x), vtimes(vdir(headTh + 180), y))));
  const pel = pts => pts.map(q => vplus(o.hip, vturn(q, o.phi)));
  // The torso ends inside the pelvis, and the pelvis is its own rounded solid (buttock, lower belly, a smooth underside).
  // The back and belly lines stop exactly where they reach the pelvis's surface and then turn inside it, so wherever
  // the spine and pelvis move relative to each other they meet in a soft crease and nothing can poke out.
  const blob = pel(PELVIS_SOLID), inBlob = p => insidePoly(p, blob);
  let bi = 0, fi = 1;
  while (bi < 5 && inBlob(segs[bi].back)) bi++;
  while (fi < 5 && inBlob(segs[fi].front)) fi++;
  const trunk = curve([vplus(o.hip, vturn([-4, -9], o.phi)), nearestOn(segs[bi].back, blob), ...segs.slice(bi, 22).map(s => s.back), ...head,
    ...segs.slice(fi, 21).map(s => s.front).reverse().filter((q, i) => i >= 1), nearestOn(segs[fi].front, blob), vplus(o.hip, vturn([3, -9], o.phi))]);
  const pelvis = curve(pel(PELVIS_SOLID));
  const limb = (root, mid, end, kind1, kind2, joint, endShape, endTh, endSide) => {
    const a = limbPts(root, mid, limbW[kind1]), b = limbPts(mid, end, limbW[kind2]);
    const tipPts = placed(endShape, end, endTh, endSide);
    const ends = kind1 === 'thigh' ? circlePath(root, 7.6) + circlePath(end, 3.1) : circlePath(root, 4.7) + circlePath(end, 2.4);
    return { d: limbPath(a) + limbPath(b) + circlePath(mid, joint) + ends + curve(tipPts), a, b, tip: tipPts, lines: lines => lines.map(l => curve(placed(l, end, endTh, endSide), false)).join('') };
  };
  // legs carry a kneecap on the front of the knee, just above the joint line
  const legs = (o.legs || []).map(L => {
    const l = limb(o.hip, L.knee, L.ankle, 'thigh', 'shin', 5.2, FOOT_SIDE, L.foot, L.sole || 1), th = l.a.th;
    l.d += circlePath(vplus(vplus(L.knee, vtimes(vdir(th - 90), 3.5)), vtimes(vdir(th), -1.1)), 2.7);
    l.detail = l.lines(FOOT_LINES); return l;
  });
  const arms = (o.arms || []).map(A => { const l = limb(shoulder, A.elbow, A.wrist, 'upper', 'fore', 3.6, A.soft ? HAND_SOFT : HAND_FLAT, A.hand, A.palm || 1); l.detail = l.lines(A.soft ? HAND_SOFT_LINES : HAND_FLAT_LINES); return l; });
  return { trunk, pelvis, hair: curve(hair), head, ao, headTh, segs, shoulder, legs, arms, hip: o.hip, phi: o.phi };
}

// bones from the side, in each segment's own frame (x forward, y down the spine): body, pedicle, facets, spinous process
const VSIDE = new Map();
function vertebraSide(lvl, len) {
  const key = lvl + n2(len);
  if (!VSIDE.has(key)) VSIDE.set(key, vertebraShape(lvl, len));
  return VSIDE.get(key);
}
function vertebraShape(lvl, len) {
  const k = lvl[0], D = k === 'L' ? 3.7 : k === 'T' ? 2.5 + (+lvl.slice(1)) * .07 : 1.7, disc = k === 'L' ? .95 : k === 'T' ? .5 : .4, h = len - disc;
  const body = `M${n2(-D / 2)} ${n2(-h / 2)}Q${n2(0)} ${n2(-h / 2 + .25)} ${n2(D / 2)} ${n2(-h / 2)}Q${n2(D / 2 - .3)} 0 ${n2(D / 2)} ${n2(h / 2)}Q0 ${n2(h / 2 - .25)} ${n2(-D / 2)} ${n2(h / 2)}Q${n2(-D / 2 + .2)} 0 ${n2(-D / 2)} ${n2(-h / 2)}Z`;
  const b0 = -D / 2;
  const arch = `M${n2(b0 + .1)} ${n2(-h * .32)}L${n2(b0 - 1.3)} ${n2(-h * .45)}L${n2(b0 - 2.4)} ${n2(-h * .5 - .2)}L${n2(b0 - 2.8)} ${n2(h * .5 + .2)}L${n2(b0 - 1.3)} ${n2(h * .42)}L${n2(b0 + .1)} ${n2(h * .2)}Z`;
  const spin = k === 'L' ? `M${n2(b0 - 2.2)} ${n2(-h * .36)}L${n2(b0 - 5.4)} ${n2(-h * .3)}Q${n2(b0 - 5.9)} 0 ${n2(b0 - 5.4)} ${n2(h * .34)}L${n2(b0 - 2.2)} ${n2(h * .38)}Z`
    : k === 'T' ? `M${n2(b0 - 2.1)} ${n2(h * .3)}L${n2(b0 - 4.6)} ${n2(h * 1.3)}Q${n2(b0 - 5.1)} ${n2(h * 1.45)} ${n2(b0 - 4.7)} ${n2(h * 1)}L${n2(b0 - 2.4)} ${n2(-h * .45)}Z`
    : `M${n2(b0 - 2.2)} ${n2(-h * .3)}L${n2(b0 - (lvl === 'C7' ? 4.4 : 3.4))} ${n2(-h * .5)}L${n2(b0 - (lvl === 'C7' ? 4.4 : 3.4))} ${n2(h * .1)}L${n2(b0 - 2.4)} ${n2(h * .4)}Z`;
  return { shapes: [body, arch, spin], h, D };
}
// the sacrum from the side, in the pelvis's frame (hip joint at 0,0, standing upright)
const SACRUM_SIDE = curve([[-7.21, -12.10], [-9.15, -9.53], [-10.86, -6.52], [-11.87, -3.28], [-12.12, -0.65], [-11.87, 0.32], [-11.15, 0.82], [-10.30, 0.64], [-9.68, -0.15], [-8.93, -2.32], [-7.54, -4.68], [-5.65, -6.87], [-3.59, -9.10]]);
// the figure as markup, so a scene can redraw it each frame with drawSide()
function sideMarkup(g, o = {}) {
  return `<g data-r="farLimbs" filter="url(#aClayCm)" fill="#D2D7E4"><path data-r="farLeg"/><path data-r="farArm"/></g>
    <g data-r="body" filter="url(#aClayCm)" fill="url(#${g})"><path data-r="trunk"/><path data-r="pelvis"/><path data-r="nearLeg"/></g>
    ${o.bones ? `<g data-r="bones" opacity="${o.bones}"><path data-r="spineShade" fill="none" stroke="${INK.shade}" stroke-width="5" stroke-linecap="round" opacity=".08" filter="url(#aSofter)"/>
<path data-r="sacrum" fill="url(#aBone)" stroke="${INK.boneLine}" stroke-width=".2"/>
      <g data-r="discs" fill="${INK.disc}" stroke="#7FD3F5" stroke-width=".12"></g><g data-r="verts"></g></g>` : ''}
    <path data-r="legLines" fill="none" stroke="${INK.crease}" stroke-width=".22" stroke-linecap="round" opacity=".8"/>
    <g data-r="nearArm" filter="url(#aClayCm)" fill="url(#${g})"><path data-r="arm"/></g><path data-r="armLines" fill="none" stroke="${INK.crease}" stroke-width=".18" stroke-linecap="round" opacity=".6"/>
    <g filter="url(#aClayCm)"><path data-r="hair" fill="url(#aHair)"/></g>
    <g data-r="face" fill="none" stroke="${INK.crease}" stroke-linecap="round"><path data-r="ear" stroke-width=".35"/><path data-r="eye" stroke-width=".3"/></g>`;
}
// draws a sideBody() result into the parts made by sideMarkup()
function drawSide(r, b, o = {}) {
  r.trunk.setAttribute('d', b.trunk); r.pelvis.setAttribute('d', b.pelvis);
  r.nearLeg.setAttribute('d', b.legs[0] ? b.legs[0].d : '');
  r.arm.setAttribute('d', b.arms[0] ? b.arms[0].d : '');
  r.armLines.setAttribute('d', b.arms[0] ? b.arms[0].detail : ''); r.legLines.setAttribute('d', b.legs[0] ? b.legs[0].detail : '');
  r.hair.setAttribute('d', b.hair);
  const H = ([x, y]) => vplus(b.ao, vplus(vtimes(vdir(b.headTh + 90), x), vtimes(vdir(b.headTh + 180), y)));
  r.ear.setAttribute('d', curve([[-.4, -5], [1.6, -5.4], [2.6, -3.6], [2.2, -1], [1, 1], [-.2, .8], [.2, -1.6], [1.2, -3.4]].map(H), false));
  r.eye.setAttribute('d', curve([[6.6, -4.1], [7.7, -3.6], [8.8, -3.9]].map(H), false));
  r.farLeg.setAttribute('d', b.legs[1] ? b.legs[1].d : ''); r.farArm.setAttribute('d', b.arms[1] ? b.arms[1].d : '');
  if (!r.verts) return;
  if (!r.verts.childNodes.length) {
    r.verts.append(...svgNodes(b.segs.map(s => `<g data-lvl="${s.lvl}">${solid(vertebraSide(s.lvl, s.len).shapes, 'url(#aBone)', INK.boneLine, .2)}</g>`).join('')));
    r.discs.append(...svgNodes(b.segs.slice(0, -1).map(() => '<path/>').join('')));
  }
  [...r.verts.children].forEach((g, i) => { const s = b.segs[i]; g.setAttribute('transform', `translate(${n2(s.c[0])} ${n2(s.c[1])}) rotate(${n2(s.th)})`); });
  // discs fill the gap between each body and the next, so they stretch and wedge as the spine moves
  [...r.discs.children].forEach((d, i) => {
    const a = b.segs[i], c = b.segs[i + 1], A = vertebraSide(a.lvl, a.len), C = vertebraSide(c.lvl, c.len);
    const top = s => vplus(a.c, vplus(vtimes(vdir(a.th), A.h / 2), vtimes(vdir(a.th + 90), s * A.D / 2 * .92)));
    const bot = s => vplus(c.c, vplus(vtimes(vdir(c.th), -C.h / 2), vtimes(vdir(c.th + 90), s * C.D / 2 * .92)));
    d.setAttribute('d', `M${top(-1).map(n2).join(' ')}L${top(1).map(n2).join(' ')}L${bot(1).map(n2).join(' ')}L${bot(-1).map(n2).join(' ')}Z`);
  });
  const pel = d => d.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (m, x, y) => vplus(b.hip, vturn([+x, +y], b.phi)).map(n2).join(' '));
  r.sacrum.setAttribute('d', pel(SACRUM_SIDE));
  r.spineShade.setAttribute('d', curve(b.segs.map(s => s.c), false));
}

/* ---------- framing ---------- */
// a camera over a centimetre world: centre cx,cy fills the 480×400 stage at s px per cm
const camera = (cx, cy, s) => `translate(240 200) scale(${n2(s)}) translate(${n2(-cx)} ${n2(-cy)})`;
const toStage = (cx, cy, s, [x, y]) => [240 + (x - cx) * s, 200 + (y - cy) * s];
const fitX = (x, w) => Math.min(472 - w / 2, Math.max(8 + w / 2, x));
// "where": a small chip with a body, the treated area lit on it, and its name; areas are body-map keys or [x, y]
function whereChip(label, areas, face = 'back') {
  const k = .082, w = Math.round(label.length * 7.3 + 58);
  const dots = [].concat(areas).map(a => { const [px, py] = typeof a === 'string' ? POS.male[a] : a; return `<circle class="where-ring" cx="${px}" cy="${py}" r="34" fill="none" stroke="${INK.sky}" stroke-width="10"/><circle cx="${px}" cy="${py}" r="20" fill="${INK.sky}" stroke="#fff" stroke-width="8"/>`; }).join('');
  return `<g transform="translate(18 18) scale(${UI})"><rect width="${w}" height="44" rx="22" fill="#fff" fill-opacity=".9" stroke="#E2E4EA"/>
    <g transform="translate(12 3) scale(${k})">${face === 'back' ? '<use href="#m-body" fill="#C3C8D7"/><use href="#m-hair" fill="#A9B0C6"/>' : '<use href="#m-hair" fill="#A9B0C6"/><use href="#m-body" fill="#C3C8D7"/>'}${dots}</g>
    <text x="42" y="27.5">${label}</text></g>`;
}
// a labelled pointer in stage pixels: a dot on the anatomy, a hairline, and the label in a pill (scenes draw it on)
function pointer(r, [ax, ay], [lx, ly], text, anchor = 'start') {
  const w = Math.round(text.length * 6.9 + 24), x0 = anchor === 'start' ? lx : lx - w;
  // on phones the label is scaled about where the line meets it, then nudged back inside the stage
  const shift = UI === 1 ? 0 : anchor === 'start' ? Math.min(0, 472 - (lx + w * UI)) : Math.max(0, 8 - (lx - w * UI));
  const big = UI === 1 ? '' : ` transform="translate(${n2(lx + shift)} ${n2(ly)}) scale(${UI}) translate(${n2(-lx)} ${n2(-ly)})"`;
  return `<g data-r="${r}" opacity="0"><path d="M${n2(ax)} ${n2(ay)}L${n2(lx)} ${n2(ly)}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1" fill="none" stroke="${INK.ink}" stroke-width="1" stroke-opacity=".45"/>
    <circle cx="${n2(ax)}" cy="${n2(ay)}" r="0" fill="${INK.sky}" stroke="#fff" stroke-width="1.6"/>
    <g opacity="0"><g${big}><rect x="${n2(x0)}" y="${n2(ly - 13)}" width="${w}" height="26" rx="13" fill="#fff" fill-opacity=".94" stroke="#E2E4EA"/><text x="${n2(x0 + w / 2)}" y="${n2(ly + 4.5)}" text-anchor="middle">${text}</text></g></g></g>`;
}
// a pill label in stage pixels, for phases like "Heat" and "Cold"
function pill(r, [x, y], text, o = 0) {
  const w = Math.round(text.length * 7.3 + 30);
  return `<g data-r="${r}" opacity="${o}" transform="translate(${n2(fitX(x, w * UI))} ${n2(y)}) scale(${UI})"><rect x="${-w / 2}" y="-15" width="${w}" height="30" rx="15" fill="#fff" fill-opacity=".94" stroke="#E2E4EA"/><text text-anchor="middle" y="4.5">${text}</text></g>`;
}
