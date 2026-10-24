// Treatment scenes: how each treatment is done, drawn to adult proportions and played as smooth, short loops.
// Each opens on the whole patient, then the camera settles on the area being treated. anatomy.js draws the bodies,
// bones and hands; the services page explorer and the Spine & Back Care page use these scenes.
// The wording is general physiotherapy information for the clinic to check before launch.

const TREATMENTS = [
  { id: 'manual', name: 'Manual therapy', short: 'Hands-on', scene: 'manual',
    what: 'Your physiotherapist uses their hands to move stiff joints and work on tight muscles.',
    feels: 'Firm, steady pressure. Tell them if anything feels sharp.', used: ['spine', 'ortho', 'sports'] },
  { id: 'exercise', name: 'Exercise therapy', short: 'Guided movement', scene: 'catcow',
    what: 'Exercises picked for you to build strength and get you moving again: first in the clinic, then at home.',
    feels: 'Like a workout sized to you.', used: ['spine', 'postop', 'geri'] },
  { id: 'ift', name: 'IFT', full: 'Interferential therapy', short: 'Crossing currents', scene: 'ift',
    what: 'Four small pads go on the skin. Two gentle currents cross where it hurts, and where they meet they make a slow, soothing pulse deep in the tissue.',
    feels: 'A comfortable tingling or pulsing.', used: ['spine', 'ortho', 'sports'] },
  { id: 'ultrasound', name: 'Ultrasound', short: 'Sound waves', scene: 'ultrasound',
    what: 'A small probe with gel glides in slow circles over the area, sending sound waves you can’t hear into the tissue below.',
    feels: 'Usually nothing, or mild warmth.', used: ['sports', 'ortho'] },
  { id: 'tens', name: 'TENS', full: 'Transcutaneous electrical nerve stimulation', short: 'Mild pulses', scene: 'tens',
    what: 'Two pads send mild electrical pulses through the skin to calm the pain signals on their way to the brain.',
    feels: 'A light buzzing or tingling.', used: ['spine', 'neuro', 'geri'] },
  { id: 'swd', name: 'Short wave diathermy', short: 'Deep warmth', scene: 'swd',
    what: 'Two plates on either side of the joint gently warm the tissue deep inside, to relax muscles and ease stiffness.',
    feels: 'A gentle, even warmth.', used: ['ortho', 'geri'] },
  { id: 'traction', name: 'Lumbar traction', short: 'Gentle pull', scene: 'traction',
    what: 'You lie comfortably while padded belts give a slow, controlled pull that eases pressure on the lower spine.',
    feels: 'A steady stretch in the lower back.', used: ['spine'] },
  { id: 'myofascial', name: 'Myofascial release', short: 'Slow pressure', scene: 'myofascial',
    what: 'Slow, sustained pressure along tight bands of tissue (fascia) until they soften and let go.',
    feels: 'A deep, slow stretch under the hands.', used: ['spine', 'sports'] },
  { id: 'hotcold', name: 'Hot and cold therapy', short: 'Heat or ice', scene: 'hotcold',
    what: 'Heat relaxes tight muscles; cold calms swelling after a fresh injury. We use the one that suits the stage you’re at.',
    feels: 'Soothing warmth, or a cool numbness.', used: ['sports', 'ortho'] },
  { id: 'stretching', name: 'Stretching', short: 'Lengthening', scene: 'stretch',
    what: 'Guided stretches that lengthen tight muscles and help joints move through their full range.',
    feels: 'A gentle pull you hold. Not pain.', used: ['sports', 'geri', 'spine'] }
];

// the Spine & Back Care page's map uses the glow and the simple spine below
const SCENE_DEFS = `<radialGradient id="glowS"><stop offset="0" stop-color="#00A8EC" stop-opacity=".55"/><stop offset=".55" stop-color="#00A8EC" stop-opacity=".16"/><stop offset="1" stop-color="#00A8EC" stop-opacity="0"/></radialGradient>`;
function ensureSceneDefs() {
  ensureAnatomyDefs();
  if ($('#scene-defs')) return;
  document.body.prepend(svgEl({ id: 'scene-defs', width: '0', height: '0', 'aria-hidden': 'true', focusable: 'false', style: 'position:absolute' }, `<defs>${SCENE_DEFS}</defs>`));
}
// the spine as vertebrae, in the body figure's own coordinates (midline x = 120)
function spineMarkup() {
  const v = [];
  for (let i = 0; i < 7; i++) v.push(`<rect class="v v-c" style="--i:${i}" x="115.5" y="${(64 + i * 3.6).toFixed(1)}" width="9" height="2.6" rx="1.2"/>`);
  for (let i = 0; i < 12; i++) v.push(`<rect class="v v-t${i < 6 ? ' up' : ''}" style="--i:${i + 7}" x="114.5" y="${(90 + i * 6.8).toFixed(1)}" width="11" height="4.8" rx="1.6"/>`);
  for (let i = 0; i < 5; i++) v.push(`<rect class="v v-l${i > 2 ? ' l45' : ''}" style="--i:${i + 19}" x="112.5" y="${172 + i * 10}" width="15" height="7" rx="2.2"/>`);
  const discs = [0, 1, 2, 3].map(i => `<rect class="disc" x="113.5" y="${179.6 + i * 10}" width="13" height="1.8" rx=".9"/>`).join('');
  return `<g class="spine-bones">${v.join('')}${discs}<path class="sacrum" d="M111 220 Q120 218 129 220 L122.5 242 Q120 245 117.5 242 Z"/></g>`;
}

/* ---------- staging ---------- */
const mount = (svg, markup) => { svg.append(...svgNodes(markup)); return parts(svg); };
const fade = (n, v) => n.setAttribute('opacity', n2(clamp01(v)));
const WIDE = [60, 0, 3.45];
// every scene opens on the whole patient, glides in to the area being treated, then keeps drifting in very slowly
const settle = t => inOut(span(t, .35, 2.1));
function camTo(r, t, C, W = WIDE) {
  const k = settle(t), drift = CALM ? 1 : 1 + .022 * inOut(span(t, 2.1, 13));
  r.cam.setAttribute('transform', camera(mix(W[0], C[0], k), mix(W[1], C[1], k), mix(W[2], C[2], k) * drift));
}
// the x-ray lens: a soft window that opens over the anatomy being treated, its edge sweeping out as a fine ring
const lensMarkup = (id, [x, y], inner, tint = .3) => `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="-300" y="-300" width="800" height="700"><circle data-r="lens" cx="${x}" cy="${y}" r="0" fill="url(#aLens)"/></mask></defs>
  <g mask="url(#${id})"><circle cx="${x}" cy="${y}" r="80" fill="#A9B3CE" opacity="${tint}"/>${inner}</g><circle data-r="lensRing" cx="${x}" cy="${y}" r="0" fill="none" stroke="${INK.sky}" stroke-width=".22" opacity="0"/>`;
function openLens(r, t, R, at = 1.5) {
  const k = outExpo(span(t, at, at + 1.4));
  r.lens.setAttribute('r', n2(R * k)); r.lensRing.setAttribute('r', n2(R * .86 * k));
  fade(r.lensRing, span(t, at, at + .15) * (1 - span(t, at + .5, at + 1.5)) * .9);
}
// vertebrae arrive one level at a time, from the bottom of the lens upward, as it opens
const boneStagger = (r, levels, t, at) => levels.slice().reverse().forEach((l, i) => r[l] && fade(r[l], span(t, at + i * .07, at + .4 + i * .07)));
// a pointer arrives in order: the dot lands on the anatomy, the hairline draws out, then the label settles into place
function reveal(n, k) {
  if (!n._p) n._p = [...n.children];
  const [line, dot, label] = n._p, a = outExpo(span(k, 0, .35)), b = inOut(span(k, .1, .6)), c = outExpo(span(k, .45, 1));
  n.setAttribute('opacity', k > 0 ? 1 : 0);
  dot.setAttribute('r', n2(3.2 * a)); line.setAttribute('stroke-dashoffset', n2(1 - b));
  label.setAttribute('opacity', n2(c)); label.setAttribute('transform', `translate(0 ${n2(6 * (1 - c))})`);
}
// patients breathe: about thirteen breaths a minute
const breathIn = t => CALM ? 0 : .5 - .5 * Math.cos(t * Math.PI * 2 / 4.6), breathSide = t => CALM ? 0 : Math.sin(t * Math.PI * 2 / 4.6);
const breatheProne = (r, t) => { const b = breathIn(t); r.breathe.setAttribute('transform', `translate(60 0) scale(${n2(1 + .003 * b)} ${n2(1 + .012 * b)}) translate(-60 0)`); };
// a soft ring that spreads once from a point of contact
const ripple = (n, t, at, R) => { const k = span(t, at, at + 1.1); n.setAttribute('r', n2(R * outCubic(k))); fade(n, (1 - k) * (k > 0 ? .8 : 0)); };
// a path sampled into points, so dots can travel along it at an even speed
function track(pts) {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = L[L.length - 1];
  return { d: 'M' + pts.map(p => p.map(n2).join(' ')).join('L'), at: u => {
    const s = clamp01(u) * total; let i = 1;
    while (i < L.length - 1 && L[i] < s) i++;
    const k = (s - L[i - 1]) / (L[i] - L[i - 1] || 1);
    return [mix(pts[i - 1][0], pts[i][0], k), mix(pts[i - 1][1], pts[i][1], k)];
  } };
}
const bez = (a, b, c, d, n = 24) => [...Array(n + 1)].map((_, i) => { const t = i / n, u = 1 - t; return [0, 1].map(k => u * u * u * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t * t * t * d[k]); });
const at2 = (n, [x, y]) => { n.setAttribute('cx', n2(x)); n.setAttribute('cy', n2(y)); };
// holds at both ends of a swing: −1 … 1 with a pause at each extreme
const swing = (t, period) => Math.tanh(2.4 * Math.cos(t / period * Math.PI * 2)) / Math.tanh(2.4);
// blends two #rrggbb colours
const tint = (a, b, k) => '#' + [1, 3, 5].map(i => Math.round(mix(parseInt(a.slice(i, i + 2), 16), parseInt(b.slice(i, i + 2), 16), clamp01(k))).toString(16).padStart(2, '0')).join('');
// a card in the top right of the stage, for read-outs
const card = (r, h, inner) => `<g data-r="${r}" opacity="0" transform="translate(${n2(462 - 162 * UI)} 18) scale(${UI})"><rect width="162" height="${h}" rx="18" fill="#fff" fill-opacity=".92" stroke="#E2E4EA"/>${inner}</g>`;

// A magnified side view of L3 to L5, as if the lens were turned sideways: the back above (face down) or below (face up).
// Vertebrae sit on their discs, so the discs visibly shear, stretch or close as the bones move.
function lumbarInset(cx, cy, faceUp, k = 7.2, mid = 2.9) {
  const clip = uid('ins'), flip = faceUp ? -1 : 1;
  const v = l => `<g data-r="i${l}">${solid(vertebraSide(l, 3.9).shapes, 'url(#aBone)', INK.boneLine, .16)}</g>`;
  return `<g data-r="inset" opacity="0" transform="translate(${cx} ${cy})"><defs><clipPath id="${clip}"><circle r="60"/></clipPath></defs><circle r="64" fill="#fff" stroke="#E2E4EA"/>
    <g clip-path="url(#${clip})"><rect x="-70" y="-70" width="140" height="140" fill="#F3F5F9"/>
      <g transform="translate(0 ${n2(flip * mid * k)}) scale(${k} ${k * flip})"><path data-r="iSkin" fill="#E8EBF3" stroke="#D3D8E4" stroke-width=".1"/>
        <g data-r="iDiscs" fill="${INK.disc}" stroke="#7FD3F5" stroke-width=".08"><path/><path/></g>${v('L3')}${v('L4')}${v('L5')}<g data-r="iMark"></g></g></g>
    <circle r="60" fill="none" stroke="#fff" stroke-width="3"/></g>`;
}
// places the inset's vertebrae: centres along the spine (x, head to the left) and how far each sits forward (y)
function setInset(r, xs, ys, tilts = [0, 0, 0]) {
  const h = 3.9 - .95, D = 3.7;
  ['L3', 'L4', 'L5'].forEach((l, i) => r[`i${l}`].setAttribute('transform', `translate(${n2(xs[i])} ${n2(ys[i])}) rotate(${n2(-tilts[i])}) matrix(0 1 1 0 0 0)`));
  const edge = (i, end, s) => vplus([xs[i], ys[i]], vturn([end * h / 2, s * D / 2 * .9], -tilts[i]));
  [...r.iDiscs.children].forEach((d, j) => d.setAttribute('d', `M${edge(j, 1, -1).map(n2).join(' ')}L${edge(j + 1, -1, -1).map(n2).join(' ')}L${edge(j + 1, -1, 1).map(n2).join(' ')}L${edge(j, 1, 1).map(n2).join(' ')}Z`));
}

/* ---------- lying on the back, side view ---------- */
// the rig with the head brought to rest on the couch: the neck and upper back take up whatever angle the trunk has
function supine(o) {
  const base = sideBody({ ...o, arms: [], legs: [], lite: true }), want = -90 - (o.chin || 0);
  const fix = (want - base.headTh) / 10, bends = SEGS.map(([l], i) => (o.bends ? o.bends[i] || 0 : 0) + (i >= SEG_I.T3 ? fix : 0));
  return sideBody({ ...o, bends });
}
const tableTop = b => Math.max(...b.segs.slice(0, 18).map(s => s.back[1]), ...PELVIS_SOLID.slice(6, 12).map(q => vplus(b.hip, vturn(q, b.phi))[1]));
const couchSide = (x0, x1, y, legs = true) => `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="7" rx="2.4" fill="url(#aCouch)"/><rect x="${x0 + 1}" y="${y + 6.2}" width="${x1 - x0 - 2}" height="1.6" rx=".8" fill="${INK.couchEdge}"/>
  ${legs ? `<rect x="${x0 + 10}" y="${y + 7.6}" width="3.2" height="62" rx="1.4" fill="#D5DAE5"/><rect x="${x1 - 13}" y="${y + 7.6}" width="3.2" height="62" rx="1.4" fill="#D5DAE5"/>` : ''}`;
const armsAlong = (sh, y) => ({ elbow: [sh[0] + 28.5, y - 4.2], wrist: [sh[0] + 53, y - 3.4], hand: 90 });
// a pose's silhouette, filled faintly: the far end of a movement, shown while the body travels toward it
const ghostOf = (b, legs = 1) => [b.trunk, b.pelvis, ...b.legs.slice(0, legs).map(l => l.d)].map(d => `<path d="${d}"/>`).join('');

const SCENES = {
  /* manual therapy: thumbs on the spinous process of L4, small rhythmic pressures (a central PA mobilisation) */
  manual: svg => {
    const C = [69, -5, 5.6], target = [SPINE_X.L4 + 1.2, 0], levels = ['T11', 'T12', 'L1', 'L2', 'L3', 'L4', 'L5'];
    const hand = handBack({ thumb: -70, thumbLen: 44, splay: 1.2, curl: .15, arm: 150, flare: 21 });
    const place = left => { const deg = left ? 12 : -12, tip = handPoint(hand.thumbTip, { x: 0, y: 0, deg, left }); return { x: target[0] + (left ? -.5 : .5) - tip[0], y: -tip[1], deg, left }; };
    const L = place(true), R = place(false);
    const r = mount(svg, `<g data-r="cam">${proneBody()}${lensMarkup(uid('lens'), [68, 0], spineBack('T11', 'L5'))}
      <ellipse data-r="press" cx="${target[0]}" cy="0" rx="6" ry="4.4" fill="url(#aGlow)" opacity="0"/><ellipse data-r="dent" cx="${target[0]}" cy=".3" rx="3" ry="2" fill="${INK.shade}" opacity="0" filter="url(#aSoft)"/>
      <circle data-r="touch" cx="${target[0]}" cy="0" r="0" fill="none" stroke="${INK.sky}" stroke-width=".3" opacity="0"/>
      <g data-r="shadow" filter="url(#aSofter)" opacity="0">${handShadow(hand, L, 's1')}${handShadow(hand, R, 's2')}</g>
      <g data-r="hands" opacity="0">${placeHand(hand, L)}${placeHand(hand, R)}</g></g>
      ${lumbarInset(392, 112, false, 5.3, 7.7)}${pill('insetCap', [392, 200], 'L4 glides a little', 0)}
      ${pointer('note', toStage(...C, target), [470, 352], 'Gentle pressure on L4', 'end')}${whereChip('Lower back', 'lower')}`);
    // the thumb on the skin above L4, in the inset's centimetres
    r.iMark.append(...svgNodes(`<path data-r="iThumb" d="M-1.5 -12.6C-1.5 -10.8 -.9 -9.7 0 -9.7S1.5 -10.8 1.5 -12.6Z" fill="url(#aHand)" stroke="#B9C0D3" stroke-width=".1"/>
      <path data-r="iArrow" d="M0 -17.4V-14.2M-.8 -15L0 -14.1L.8 -15" fill="none" stroke="${INK.sky}" stroke-width=".26" stroke-linecap="round" stroke-linejoin="round"/>`));
    Object.assign(r, parts(svg));
    return [t => {
      camTo(r, t, C); openLens(r, t, 14.5); boneStagger(r, levels, t, 1.55); breatheProne(r, t);
      const on = outExpo(span(t, 1.9, 2.9)), lift = 1 - on, c = t - 3.1, cyc = ((c % 4.4) + 4.4) % 4.4;
      // seven small oscillations, a breath, again
      const press = c > 0 && cyc < 3.5 ? .5 - .5 * Math.cos(cyc / 3.5 * 7 * Math.PI * 2) : 0;
      r.hands.setAttribute('transform', `translate(${target[0]} ${n2(lift * 10)}) scale(${n2(1 + lift * .08 - press * .016)}) translate(${-target[0]} 0)`);
      fade(r.hands, inOut(span(t, 1.9, 2.6)));
      r.shadow.setAttribute('transform', `translate(${n2(.5 + lift * 3 + (1 - press) * .4)} ${n2(1 + lift * 13 + (1 - press) * .6)})`);
      fade(r.shadow, on * (.7 + press * .3));
      ripple(r.touch, t, 2.75, 9);
      fade(r.press, press * .9); r.press.setAttribute('rx', n2(5 + press * 2.6)); fade(r.dent, press * .16);
      // the inset: the thumb presses the skin, the arrow pulses, L4 glides forward a little and the discs shear
      fade(r.inset, span(t, 3, 3.6)); fade(r.insetCap, span(t, 3.4, 3.9));
      const g = press * .34, dip = press * .55;
      r.iSkin.setAttribute('d', `M-12 -9.6C-6 -9.6 -3 -9.6 -2 ${n2(-9.6 + dip * .3)}C-1 ${n2(-9.6 + dip)} 1 ${n2(-9.6 + dip)} 2 ${n2(-9.6 + dip * .3)}C3 -9.6 6 -9.6 12 -9.6V-30H-12Z`);
      r.iThumb.setAttribute('transform', `translate(0 ${n2(dip)})`); r.iArrow.setAttribute('transform', `translate(0 ${n2(dip * 1.6)})`); fade(r.iArrow, .45 + .55 * press);
      setInset(r, [-3.9, 0, 3.9], [g * .2, g, g * .2], [-press * 1.4, 0, press * 1.4]);
      reveal(r.note, span(t, 3.3, 4.1));
    }, 4.15];
  },

  /* IFT: four pads in a square, two medium-frequency currents crossing; where they meet they beat slowly */
  ift: svg => {
    const C = [70, -3, 5.2], P = [[62.5, -7.5], [77.5, -7.5], [77.5, 7.5], [62.5, 7.5]], mid = [70, 0], levels = ['T12', 'L1', 'L2', 'L3', 'L4', 'L5'];
    const pad = ([x, y], i) => `<g data-r="pad${i}" transform="translate(${x} ${y})" opacity="0"><g data-r="padIn${i}"><rect x="-2.7" y="-2.7" width="5.4" height="5.4" rx="1.2" fill="#FBFCFE" stroke="#B9C0D3" stroke-width=".16"/>
      <rect x="-2.1" y="-2.1" width="4.2" height="4.2" rx=".8" fill="#EDF0F6"/><circle r=".8" fill="${i % 2 ? INK.skyDeep : INK.sky}"/><circle r=".3" fill="#fff"/></g><circle data-r="snap${i}" r="0" fill="none" stroke="${INK.sky}" stroke-width=".22"/></g>`;
    // each channel spreads between its two pads like a spindle
    const spindle = (a, b) => [-2, -1, 0, 1, 2].map(k => { const m = vtimes(vplus(a, b), .5), d = [b[0] - a[0], b[1] - a[1]], len = Math.hypot(...d), c = vplus(m, vtimes([-d[1] / len, d[0] / len], k * 3)); return `<path d="M${a.join(' ')}Q${n2(c[0])} ${n2(c[1])} ${b.join(' ')}"/>`; }).join('');
    const cable = ([x, y], up, i) => `<path d="M${x} ${y}C${x - 3} ${y + (up ? -9 : 9)} ${x - 8 + i * 3} ${up ? -26 : 26} ${x - 12 + i * 6} ${up ? -48 : 48}" fill="none" stroke="#C3C9D8" stroke-width=".7" stroke-linecap="round"/>`;
    // the interference is strongest on the lines between the two currents: a four-leaf shape
    const clover = [0, 90, 180, 270].map(a => { const d = vdir(a); return `<ellipse cx="${n2(mid[0] + d[0] * 3.3)}" cy="${n2(mid[1] + d[1] * 3.3)}" rx="${a % 180 ? 3.9 : 2.5}" ry="${a % 180 ? 2.5 : 3.9}"/>`; }).join('');
    const r = mount(svg, `<g data-r="cam">${proneBody()}${lensMarkup(uid('lens'), [70, 0], spineBack('T12', 'L5'))}
      <g data-r="cables" opacity="0">${cable(P[0], true, 0)}${cable(P[1], true, 1)}${cable(P[2], false, 1)}${cable(P[3], false, 0)}</g>
      <g data-r="clover" fill="url(#aGlow)" opacity="0">${clover}</g>
      <g data-r="field" fill="none" stroke-linecap="round" opacity="0"><g stroke-width=".22" stroke-opacity=".45"><g stroke="${INK.sky}">${spindle(P[0], P[2])}</g><g stroke="${INK.skyDeep}">${spindle(P[1], P[3])}</g></g>
        <g stroke-width=".42" stroke-dasharray="2.4 30"><g data-r="c1" stroke="${INK.sky}">${spindle(P[0], P[2])}</g><g data-r="c2" stroke="${INK.skyDeep}">${spindle(P[1], P[3])}</g></g></g>
      ${P.map(pad).join('')}</g>
      ${card('card', 78, `<svg x="14" y="8" width="134" height="46" viewBox="0 0 134 46" overflow="hidden"><path data-r="wa" fill="none" stroke="#C3C9D8" stroke-width="1.2"/><path data-r="wb" fill="none" stroke="${INK.skyDeep}" stroke-opacity=".45" stroke-width="1.2"/>
        <path data-r="env" fill="none" stroke="${INK.sky}" stroke-opacity=".3" stroke-width="1" stroke-dasharray="2 2"/><path data-r="sum" fill="none" stroke="${INK.sky}" stroke-width="1.6" stroke-linejoin="round"/></svg>
        <text x="81" y="68" text-anchor="middle" style="font-size:11.5px">Two currents, one slow beat</text>`)}
      ${pointer('note', toStage(...C, mid), [470, 340], 'Where the currents cross', 'end')}${whereChip('Lower back', 'lower')}`);
    const wave = (f, ph, y0, amp, fn) => 'M' + [...Array(68)].map((_, i) => { const x = i * 2; return `${x} ${n2(y0 + amp * fn(x, f, ph))}`; }).join('L');
    return [t => {
      camTo(r, t, C); openLens(r, t, 13, 1.6); boneStagger(r, levels, t, 1.65); breatheProne(r, t);
      P.forEach((_, i) => { const at = 1.9 + i * .16, k = outExpo(span(t, at, at + .5)); fade(r[`pad${i}`], span(t, at, at + .15)); r[`padIn${i}`].setAttribute('transform', `scale(${n2(1.3 - .3 * k)})`); ripple(r[`snap${i}`], t, at + .2, 5); });
      fade(r.cables, span(t, 2.4, 2.9));
      const on = span(t, 2.9, 3.7), beat = .5 + .5 * Math.cos((t - 2.9) * Math.PI * 2 * .8);
      fade(r.field, on * .9);
      // two alternating currents a little apart in frequency: each flickers along its channel, together they beat
      r.c1.setAttribute('stroke-dashoffset', n2(-t * 14 % 32.4)); r.c2.setAttribute('stroke-dashoffset', n2(t * 13 % 32.4));
      fade(r.clover, on * (.2 + .8 * beat));
      r.clover.setAttribute('transform', `translate(70 0) scale(${n2(.82 + .3 * beat)}) translate(-70 0)`);
      // the read-out: the two currents, and their sum swelling and fading at the beat frequency
      fade(r.card, span(t, 3.2, 3.8));
      const s1 = (x, f, p) => Math.sin(x * f + p), ph = t * 7;
      r.wa.setAttribute('d', wave(.3, ph, 10, 5, s1)); r.wb.setAttribute('d', wave(.345, ph * 1.12, 10, 5, s1));
      const env = x => Math.abs(Math.cos(x * .0225 + ph * .06));
      r.sum.setAttribute('d', wave(0, ph, 33, 5.2, x => s1(x, .3, ph) + s1(x, .345, ph * 1.12)));
      r.env.setAttribute('d', wave(0, ph, 33, 10.4, env) + wave(0, ph, 33, -10.4, env));
      reveal(r.note, span(t, 3.9, 4.7));
    }, 4.8];
  },

  /* TENS: two pads beside the spine; quick pulses travel the nerves and quieten the pain signal at the spinal cord */
  tens: svg => {
    const C = [66, -3, 5], levels = ['T11', 'T12', 'L1', 'L2', 'L3', 'L4', 'L5'];
    const nerve = k => track(bez([71.5, k * 5.4], [70.8, k * 3.6], [69.8, k * 2.2], [68, k * 1.4]).concat(bez([68, k * 1.4], [64, k * 1.2], [60, k * 1], [55.5, k * .9]).slice(1)));
    const N = [nerve(-1), nerve(1)], pain = track(bez([76.2, 3.6], [73.4, 2.9], [70.8, 1.9], [68.2, 1.2]).concat(bez([68.2, 1.2], [64, 1], [60, .8], [55.5, .7]).slice(1)));
    const pad = (y, i) => `<g><rect x="64.5" y="${y - 2.3}" width="9" height="4.6" rx="1" fill="#FBFCFE" stroke="#B9C0D3" stroke-width=".16"/><rect x="65.1" y="${y - 1.7}" width="7.8" height="3.4" rx=".7" fill="#EDF0F6"/>
      <circle cx="69" cy="${y}" r=".7" fill="${INK.sky}"/><ellipse data-r="flash${i}" cx="69" cy="${y}" rx="6" ry="3.6" fill="url(#aGlow)" opacity="0"/></g>`;
    const cable = (y, k) => `<path d="M69 ${y}C${k < 0 ? 63 : 66} ${y + (k < 0 ? -3 : 4)} ${k < 0 ? 60 : 64} ${k < 0 ? 4 : 14} ${k < 0 ? 58.6 : 60.4} 48" fill="none" stroke="#C3C9D8" stroke-width=".7" stroke-linecap="round"/>`;
    // each signal is a bright head with a short fading tail
    const dots = (r, n, fill, rad) => [...Array(n)].map((_, i) => `<g data-r="${r}${i}" opacity="0"><circle r="${rad * 1.9}" fill="${fill}" opacity=".18"/><circle r="${rad}" fill="${fill}"/></g>`).join('');
    // the unit's readout, in stage pixels: a biphasic pulse train
    const pulses = [...Array(12)].map((_, i) => `M${i * 18} 0h6v-12h2.4v20h2.4v-8h7.2`).join('');
    const r = mount(svg, `<g data-r="cam">${proneBody()}${lensMarkup(uid('lens'), [70, 0], `${spineBack('T11', 'L5')}<g fill="none" stroke-linecap="round"><path d="${N[0].d}" stroke="#C9B37A" stroke-width=".4" opacity=".7"/><path d="${N[1].d}" stroke="#C9B37A" stroke-width=".4" opacity=".7"/><path d="${pain.d}" stroke="#C9B37A" stroke-width=".3" opacity=".6"/></g>`)}
      <circle data-r="hurt" cx="76.2" cy="3.6" r="3" fill="url(#aHeat)" opacity="0"/>
      <g data-r="kit" opacity="0">${cable(-6.1, -1)}${cable(6.1, 1)}${pad(-6.1, 0)}${pad(6.1, 1)}</g>
      <circle data-r="gate" cx="68.2" cy="1.2" r="2.2" fill="none" stroke="${INK.sky}" stroke-width=".26" opacity="0"/>
      ${dots('p', 3, INK.heat, .55)}${dots('a', 3, INK.sky, .5)}${dots('b', 3, INK.sky, .5)}</g>
      ${card('card', 64, `<svg x="14" y="10" width="134" height="26" viewBox="0 0 134 26" overflow="hidden"><path data-r="wave" d="${pulses}" transform="translate(0 15)" fill="none" stroke="${INK.sky}" stroke-width="1.6" stroke-linejoin="round"/></svg>
        <circle cx="20" cy="49" r="3.5" fill="${INK.heat}"/><text x="28" y="53" style="font-size:11.5px">Pain</text><circle cx="78" cy="49" r="3.5" fill="${INK.sky}"/><text x="86" y="53" style="font-size:11.5px">TENS pulses</text>`)}
      ${pointer('note', toStage(...C, [68.2, 1.2]), [470, 340], 'The pain signal quietens here', 'end')}${whereChip('Lower back', 'lower')}`);
    const put = (n, p) => n.setAttribute('transform', `translate(${n2(p[0])} ${n2(p[1])})`);
    return [t => {
      camTo(r, t, C); openLens(r, t, 16, 1.4); boneStagger(r, levels, t, 1.45); breatheProne(r, t);
      const kit = span(t, 1.9, 2.5), on = span(t, 3.2, 3.6), gate = inOut(span(t, 3.4, 5));
      fade(r.kit, kit); fade(r.card, span(t, 2.4, 2.9)); fade(r.hurt, span(t, 1.6, 2.4) * (1 - .55 * gate) * (.7 + .3 * Math.sin(t * 3)));
      // pain signals climb toward the brain; once the pulses run, they fade where the nerve meets the spinal cord
      [0, 1, 2].forEach(i => {
        const u = ((t - 1.6) / 2.6 + i / 3) % 1, stop = gate * span(u, .42, .55);
        put(r[`p${i}`], pain.at(u)); fade(r[`p${i}`], span(t, 1.6, 2.2) * span(u, 0, .05) * (1 - span(u, .8, 1)) * (1 - stop));
      });
      ['a', 'b'].forEach((k, n) => [0, 1, 2].forEach(i => {
        const u = ((t - 3.2) / .8 + i / 3) % 1;
        put(r[k + i], N[n].at(u)); fade(r[k + i], on * span(u, 0, .04) * (1 - span(u, .75, 1)));
      }));
      // the gate: a ring that tightens where the nerve enters the cord, once the pulses have arrived
      r.gate.setAttribute('r', n2(mix(2.6, 1.2, gate))); fade(r.gate, span(t, 3.5, 3.9) * (.5 + .3 * Math.sin(t * 4)));
      const flash = on * Math.max(0, Math.cos((t - 3.2) / .8 * 3 * Math.PI * 2)) ** 6;
      fade(r.flash0, flash); fade(r.flash1, flash);
      r.wave.setAttribute('transform', `translate(${n2(-((t * 30) % 18) * on)} 15)`); fade(r.wave, .25 + .75 * on);
      reveal(r.note, span(t, 4.6, 5.4));
    }, 5.6];
  },

  /* myofascial release: crossed hands sink in and slowly draw apart; the fascia beneath softens and lengthens */
  myofascial: svg => {
    const C = [46, -4, 5.6], hand = handBack({ thumb: -34, splay: .9, curl: .1, arm: 70, flare: 20 });
    const A = { x: 41.5, y: 1.4, deg: -66 }, B = { x: 48.5, y: 1.4, deg: 66, left: true };
    const fibres = [...Array(9)].map((_, i) => `<path data-r="f${i}"/>`).join(''), drag = [...Array(5)].map((_, i) => `<path data-r="s${i}"/>`).join('');
    const r = mount(svg, `<g data-r="cam">${proneBody()}${lensMarkup(uid('lens'), [45, -1], `<g data-r="fascia" fill="none" stroke-linecap="round" stroke-width=".32">${fibres}</g>`, .25)}
      <g data-r="skin" fill="none" stroke="#fff" stroke-width=".35" stroke-linecap="round" filter="url(#aSoft)" opacity="0">${drag}</g>
      <circle data-r="touch" cx="45" cy="-1" r="0" fill="none" stroke="${INK.sky}" stroke-width=".3" opacity="0"/>
      <g data-r="shadow" filter="url(#aSofter)" opacity="0"><g data-r="shB">${handShadow(hand, B, 'x')}</g><g data-r="shA">${handShadow(hand, A, 'y')}</g></g>
      <g data-r="hands" opacity="0"><g data-r="hB">${placeHand(hand, { ...B, fade: true })}</g><g data-r="hA">${placeHand(hand, { ...A, fade: true })}</g></g></g>
      ${pointer('note', toStage(...C, [45, -6]), [470, 340], 'Fascia letting go', 'end')}${whereChip('Upper back', 'upper')}`);
    return [t => {
      camTo(r, t, C); openLens(r, t, 12.5, 1.5); breatheProne(r, t);
      const on = outExpo(span(t, 1.9, 2.9)), lift = 1 - on, c = Math.max(0, t - 3), part = .5 - .5 * Math.cos(c / 9 * Math.PI * 2), sink = inOut(span(t, 2.6, 3.2));
      const dx = part * 2.6, z = 1 + lift * .08 - sink * .012;
      r.hA.setAttribute('transform', `translate(${n2(-dx)} 0)`); r.hB.setAttribute('transform', `translate(${n2(dx)} 0)`);
      r.shA.setAttribute('transform', `translate(${n2(-dx)} 0)`); r.shB.setAttribute('transform', `translate(${n2(dx)} 0)`);
      r.hands.setAttribute('transform', `translate(45 ${n2(lift * 10)}) scale(${n2(z)}) translate(-45 0)`); fade(r.hands, inOut(span(t, 1.9, 2.6)));
      r.shadow.setAttribute('transform', `translate(${n2(.4 + lift * 3)} ${n2(.8 + lift * 13 + (1 - sink) * .5)})`); fade(r.shadow, on * .85);
      ripple(r.touch, t, 2.8, 10);
      // the skin between the hands is drawn out into fine tension lines
      for (let i = 0; i < 5; i++) { const y = -4.4 + i * 1.6, half = 1.6 + dx * 1.1; r[`s${i}`].setAttribute('d', `M${n2(45 - half)} ${y}Q45 ${n2(y + .25 * Math.sin(i))} ${n2(45 + half)} ${y}`); }
      fade(r.skin, sink * (.15 + .5 * part));
      // crimped collagen straightens as the tissue is drawn out, and warms from grey to cyan
      const amp = mix(.75, .12, part);
      for (let i = 0; i < 9; i++) {
        const y = -7 + i * 1.6, ph = i * 1.7, pts = [...Array(31)].map((_, j) => { const x = 35 + j * (20 / 30) - dx * (1 - j / 15) * .25; return [x, y + Math.sin(j * .9 + ph - c * .6) * amp * (1 - Math.abs(j - 15) / 30)]; });
        r[`f${i}`].setAttribute('d', curve(pts, false)); r[`f${i}`].setAttribute('stroke', tint('#AEB6CB', INK.sky, inOut(part))); fade(r[`f${i}`], .55 + .45 * part);
      }
      reveal(r.note, span(t, 3.6, 4.4));
    }, 6];
  },

  /* hot and cold: a pack on the lower back; under the skin the small vessels open with heat and narrow with cold */
  hotcold: svg => {
    const C = [70, -3, 5.2], period = 8, clip = uid('mag');
    const frost = [[61, -7], [66, -9], [74, -8], [79, -5], [63, 3], [70, 6], [77, 8], [72, -2]].map(([x, y], i) => `<path data-r="ice${i}" d="M${x} ${y - .9}V${y + .9}M${x - .78} ${y - .45}L${x + .78} ${y + .45}M${x - .78} ${y + .45}L${x + .78} ${y - .45}" stroke="#fff" stroke-width=".22" stroke-linecap="round" opacity="0"/>`).join('');
    // warmth rising off the pack: soft wavering strands that drift and fade
    const wisps = [62, 66.5, 71, 75.5, 79].map((x, i) => `<path data-r="w${i}" fill="none" stroke="#fff" stroke-width=".5" stroke-linecap="round" opacity="0" filter="url(#aSoft)"/>`).join('');
    // the magnified skin: a small artery in the dermis with capillary loops reaching up toward the surface, a vein deeper
    const loops = [-34, -6, 22].map(x => `M${x} -6C${x} -27 ${x + 12} -27 ${x + 12} -5`).join('');
    const flow = [...Array(10)].map((_, i) => `<circle data-r="d${i}" r="1.3" fill="#fff" opacity=".85"/>`).join('');
    const r = mount(svg, `<g data-r="cam">${proneBody()}
      <g data-r="pack" opacity="0"><rect x="58" y="-11.5" width="24" height="23" rx="3.2" fill="${INK.shade}" opacity=".16" filter="url(#aSofter)" transform="translate(.6 1.2)"/>
        <rect data-r="towel" x="58" y="-11.5" width="24" height="23" rx="3.2" fill="#FFF7F1" stroke="#D9DDE8" stroke-width=".18"/>
        <path d="M59.6 -9.4H80.4M59.6 -8.2H80.4M59.6 8.2H80.4M59.6 9.4H80.4" stroke="#E4E7EF" stroke-width=".35"/>
        <rect data-r="warm" x="58" y="-11.5" width="24" height="23" rx="3.2" fill="url(#aHeat)" opacity="0"/><rect data-r="cool" x="58" y="-11.5" width="24" height="23" rx="3.2" fill="url(#aGlow)" opacity="0"/>${frost}${wisps}</g></g>
      <g data-r="mag" opacity="0"><path data-r="lead" stroke="${INK.ink}" stroke-width="1" stroke-dasharray="2 3" opacity=".4" fill="none"/>
        <g transform="translate(392 118)"><defs><clipPath id="${clip}"><circle r="62"/></clipPath></defs><circle r="65" fill="#fff" stroke="#E2E4EA"/>
          <g clip-path="url(#${clip})"><rect x="-70" y="-70" width="140" height="140" fill="#FBF3F1"/><rect data-r="surf" x="-70" y="-70" width="140" height="30" fill="#F7F4F3"/><path d="M-70 -40C-40 -42 -20 -38 0 -40S50 -42 70 -40" stroke="#EADAD6" stroke-width="1" fill="none"/>
            <rect x="-70" y="14" width="140" height="60" fill="#FBF7EE"/>${[[-44, 30], [-16, 36], [14, 28], [42, 38], [-30, 52], [2, 54], [32, 56]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="none" stroke="#F0E6D2" stroke-width="1"/>`).join('')}
            <g fill="none" stroke-linecap="round"><path data-r="loops" d="${loops}" stroke="#E7A49B"/><path data-r="art" d="M-70 -4C-40 -10 -16 0 10 -6S50 -2 70 -8" stroke="#E2958C"/><path data-r="vein" d="M-70 10C-30 4 10 16 70 8" stroke="#C9A3B8"/></g>${flow}</g>
          <circle r="62" fill="none" stroke="#fff" stroke-width="3"/></g></g>
      ${pill('heat', [392, 210], 'Heat: vessels open', 0)}${pill('cold', [392, 210], 'Cold: vessels narrow', 0)}${whereChip('Lower back', 'lower')}`);
    const art = track(bez([-70, -4], [-40, -10], [-16, 0], [10, -6]).concat(bez([10, -6], [36, -12], [50, -2], [70, -8]).slice(1)));
    const vein = track(bez([70, 8], [10, 16], [-30, 4], [-70, 10]));
    let pace = 0, lastT = 0;
    return [t => {
      camTo(r, t, C); breatheProne(r, t);
      const show = span(t, 1.9, 2.6), ph = Math.max(0, t - 2.4) % period;
      const k = ph < period / 2 ? inOut(span(ph, 0, .8)) * (1 - inOut(span(ph, period / 2 - .6, period / 2))) : -inOut(span(ph, period / 2, period / 2 + .8)) * (1 - inOut(span(ph, period - .6, period)));
      fade(r.pack, show); fade(r.mag, span(t, 2.6, 3.2));
      r.pack.setAttribute('transform', `translate(0 ${n2((1 - outExpo(span(t, 1.9, 2.7))) * -6)})`);
      fade(r.warm, Math.max(0, k) * .9); fade(r.cool, Math.max(0, -k) * .9);
      r.towel.setAttribute('fill', tint('#FFF7F1', '#EEF7FD', clamp01(-k)));
      for (let i = 0; i < 8; i++) fade(r[`ice${i}`], Math.max(0, -k) * (.5 + .5 * Math.sin(t * 2.4 + i * 1.3)));
      for (let i = 0; i < 5; i++) {
        const u = ((t * .35) + i * .23) % 1, x = 62 + i * 4.5, y0 = 6 - u * 14;
        r[`w${i}`].setAttribute('d', `M${n2(x)} ${n2(y0)}c${n2(.9 * Math.sin(t * 2 + i))} -1.6 ${n2(-.9 * Math.sin(t * 2 + i))} -3.2 0 -4.8`); fade(r[`w${i}`], Math.max(0, k) * Math.sin(u * Math.PI) * .9);
      }
      const p0 = toStage(...C, [76, -8]);
      r.lead.setAttribute('d', `M${n2(p0[0])} ${n2(p0[1])}L${n2(392 - 44)} ${n2(118 + 47)}`);
      // vessel calibre follows temperature, and blood moves faster through open vessels
      r.art.setAttribute('stroke-width', n2(4.4 + 2.2 * k)); r.loops.setAttribute('stroke-width', n2(2 + 1.3 * k)); r.vein.setAttribute('stroke-width', n2(5 + 1.8 * k));
      r.surf.setAttribute('fill', tint(tint('#F7F4F3', '#FBE9E2', Math.max(0, k)), '#EEF5FA', Math.max(0, -k)));
      pace += (t - lastT) * (1 + .85 * k); lastT = t;
      for (let i = 0; i < 10; i++) { const n = r[`d${i}`]; at2(n, (i < 6 ? art : vein).at(((pace * .2) + (i % 6) / 6) % 1)); n.setAttribute('r', n2(1 + .45 * k)); }
      fade(r.heat, show * Math.max(0, k) * 1.2); fade(r.cold, show * Math.max(0, -k) * 1.2);
    }, 4];
  }
};

// finds where f changes sign between lo and hi: used to keep hands, feet and shoulders where the pose needs them
function solve(f, lo, hi, n = 18) {
  let flo = f(lo);
  for (let i = 0; i < n; i++) { const m = (lo + hi) / 2, fm = f(m); if ((fm > 0) === (flo > 0)) { lo = m; flo = fm; } else hi = m; }
  return (lo + hi) / 2;
}

/* ---------- the knee ---------- */
// The knee from the side, each bone in its own frame (x along the bone away from the joint, y toward the back):
// femur with its condyles, kneecap in front, tibia with the plateau and the bump the tendon attaches to, fibula behind.
const FEMUR_SIDE = curve([[30, -1.6], [9, -1.8], [4.6, -2.7], [2, -2.8], [.2, -1.6], [-.5, .4], [.2, 2.4], [2.4, 3.4], [5.2, 2.7], [9, 1.7], [30, 1.5]]);
const TIBIA_SIDE = curve([[30, -1.3], [8, -1.7], [5.8, -2.8], [3.6, -2.5], [1.1, -3.1], [.5, -1.6], [.5, 1.2], [1, 3.1], [3.4, 2.5], [8, 1.6], [30, 1.3]]);
const FIBULA_SIDE = curve([[2.8, 1.9], [3.4, 3.6], [5, 3.4], [30, 2.6], [30, 1.9], [5.4, 2.2]]);
function kneeBones(K, thTh, shTh) {
  const fF = `translate(${n2(K[0])} ${n2(K[1])}) rotate(${n2(thTh + 90)}) scale(1 -1)`, fT = `translate(${n2(K[0])} ${n2(K[1])}) rotate(${n2(shTh - 90)})`;
  const inF = ([x, y]) => vplus(K, vplus(vtimes(vdir(thTh + 180), x), vtimes(vdir(thTh + 90), y))), inT = ([x, y]) => vplus(K, vplus(vtimes(vdir(shTh), x), vtimes(vdir(shTh + 90), y)));
  const top = inF([.6, -4.1]), tub = inT([5.9, -2.7]), d = vdir(shTh - 90), w = .55;
  const tendon = `M${vplus(top, vtimes(d, w)).map(n2).join(' ')}L${vplus(tub, vtimes(d, w)).map(n2).join(' ')}L${vplus(tub, vtimes(d, -w)).map(n2).join(' ')}L${vplus(top, vtimes(d, -w)).map(n2).join(' ')}Z`;
  return { tendonAt: vtimes(vplus(top, tub), .5), markup: `<g transform="${fT}">${solid([TIBIA_SIDE, FIBULA_SIDE], 'url(#aBone)', INK.boneLine, .2)}<g fill="${INK.disc}" stroke="#7FD3F5" stroke-width=".1"><path d="M.2 -3L.6 -1.4L-.2 -1.6Z"/><path d="M.2 2.9L.6 1.2L-.2 1.5Z"/></g></g>
    <g transform="${fF}">${solid([FEMUR_SIDE], 'url(#aBone)', INK.boneLine, .2)}</g>
    <path d="${tendon}" fill="#EFE4D6" stroke="#D3BFA6" stroke-width=".12"/><g transform="${fF}">${solid([`M4.6 -4.1C4.6 -3.2 1 -2.9 -.4 -3.5C-.6 -4.4 .8 -5.2 2.4 -5.1C3.8 -5 4.6 -4.7 4.6 -4.1Z`], 'url(#aBone)', INK.boneLine, .2)}</g>` };
}
// a clip that keeps whatever lies on one side of a line (used where a hand wraps out of sight round a limb)
const halfPlane = (p, d, n) => { const a = vplus(p, vtimes(d, -200)), b = vplus(p, vtimes(d, 200)); return `M${a.map(n2).join(' ')}L${b.map(n2).join(' ')}L${vplus(b, vtimes(n, 300)).map(n2).join(' ')}L${vplus(a, vtimes(n, 300)).map(n2).join(' ')}Z`; };

Object.assign(SCENES, {
  /* ultrasound: a probe with gel glides in small circles over the patellar tendon; sound waves travel in and fade */
  ultrasound: svg => {
    const g = uid('sk'), hip = [0, 0], phi = -90, bends = SEGS.map(([l]) => l[0] === 'L' ? 3 : 0), thTh = 84;
    const b0 = supine({ hip, phi, bends }), floor = tableTop(b0);
    const knee = vplus(hip, vtimes(vdir(thTh), 43)), ay = floor - 5.4, ankle = [knee[0] + Math.sqrt(42 * 42 - (ay - knee[1]) ** 2), ay];
    const legs = [{ knee, ankle, foot: 14 }, { knee: vplus(knee, [1.2, -.5]), ankle: vplus(ankle, [1.2, -.3]), foot: 14 }];
    const arms = [armsAlong(b0.shoulder, floor), armsAlong(vplus(b0.shoulder, [1, -.4]), floor)];
    const shTh = Math.atan2(ankle[0] - knee[0], -(ankle[1] - knee[1])) / RAD, uT = vdir(shTh), antT = vdir(shTh - 90);
    const kb = kneeBones(knee, thTh, shTh), contact = vplus(vplus(knee, vtimes(uT, 3.4)), vtimes(antT, 4.7)), axis = shTh - 90;
    const bol = (floor - (knee[1] + 5.4)) / 2, W = [-6, -6, 2.25], C = [knee[0] + 5, knee[1] - 3, 4.8];
    const probe = `<path d="M0 -13C0 -24 6 -32 18 -44" fill="none" stroke="#C3C9D8" stroke-width=".7" stroke-linecap="round"/>
      <rect x="-1.5" y="-13.4" width="3" height="10.4" rx="1.4" fill="#FBFCFE" stroke="#AEB5C9" stroke-width=".15"/><path d="M-1.5 -3.8L-2.4 -1.6H2.4L1.5 -3.8Z" fill="#F1F3F8" stroke="#AEB5C9" stroke-width=".15"/>
      <rect x="-2.6" y="-1.8" width="5.2" height="1.8" rx=".7" fill="#F4F6FA" stroke="#AEB5C9" stroke-width=".15"/><rect data-r="face" x="-2.1" y="-.45" width="4.2" height=".45" rx=".22" fill="${INK.sky}" opacity=".7"/><path d="M-.8 -12.2V-4.6" stroke="#fff" stroke-width=".45" stroke-linecap="round"/>`;
    const waves = [...Array(5)].map((_, i) => `<path data-r="w${i}" fill="none" stroke="${INK.sky}" stroke-width=".24" stroke-linecap="round"/>`).join('');
    // deep in the tendon the sound sets up a fine vibration, shown as sparks that flicker where the beam passes
    const sparks = [...Array(7)].map((_, i) => `<circle data-r="k${i}" r=".22" fill="#fff" opacity="0"/>`).join('');
    const r = mount(svg, `<defs>${skinGrad(g, [-60, -40], [40, 30])}<linearGradient id="${g}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${INK.sky}" stop-opacity=".3"/><stop offset="1" stop-color="${INK.sky}" stop-opacity="0"/></linearGradient></defs>
      <g data-r="cam">${couchSide(-120, 110, floor)}<rect x="${n2(knee[0] - 13)}" y="${n2(floor - 2 * bol)}" width="20" height="${n2(2 * bol)}" rx="${n2(bol)}" fill="#E3E7EF" stroke="#D0D6E2" stroke-width=".2"/>
        ${sideMarkup(g)}${lensMarkup(uid('lens'), vplus(knee, vtimes(antT, 1)), `${kb.markup}<path data-r="beam" fill="url(#${g}b)"/>${waves}${sparks}`, .32)}
        <circle data-r="touch" r="0" fill="none" stroke="${INK.sky}" stroke-width=".22" opacity="0"/>
        <g data-r="probe" opacity="0"><g data-r="gelG"><ellipse rx="3.2" ry=".8" fill="#E9F7FD" stroke="#fff" stroke-width=".2" opacity=".9"/><ellipse data-r="glint" cx="-1" cy="-.3" rx=".7" ry=".18" fill="#fff"/></g><g data-r="tool">${probe}</g></g></g>
      ${pointer('note', toStage(...C, kb.tendonAt), [470, 336], 'Patellar tendon', 'end')}${whereChip('Knee', 'knee', 'front')}`);
    at2(r.touch, contact);
    return [t => {
      camTo(r, t, C, W); openLens(r, t, 10.5, 1.7);
      drawSide(r, supine({ hip, phi, bends, legs, arms, breath: breathSide(t) }));
      const on = outExpo(span(t, 2, 2.9)), w = (t - 2.8) * Math.PI * 2 / 2.4, glide = t > 2.8 ? Math.sin(w) * 1 : 0, tilt = t > 2.8 ? Math.cos(w) * 4 : 0;
      const at = vplus(contact, vtimes(uT, glide)), lift = (1 - on) * 9;
      r.tool.setAttribute('transform', `translate(${n2(at[0] + antT[0] * lift)} ${n2(at[1] + antT[1] * lift)}) rotate(${n2(axis + tilt)})`);
      r.gelG.setAttribute('transform', `translate(${n2(at[0])} ${n2(at[1])}) rotate(${n2(axis)})`); fade(r.probe, inOut(span(t, 2, 2.5)));
      r.glint.setAttribute('cx', n2(-1.2 + Math.sin(w * .5) * .8)); ripple(r.touch, t, 2.75, 6);
      // a beam that runs parallel for a short depth, then spreads; each wavefront fades as the tissue absorbs it
      const into = vtimes(antT, -1), depth = 6.4, B = (d, k) => vplus(vplus(at, vtimes(into, d)), vtimes(uT, k * (d < 2.6 ? 2.1 : 2.1 + (d - 2.6) * .45)));
      const run = span(t, 2.9, 3.3);
      r.beam.setAttribute('d', `M${B(0, -1).map(n2).join(' ')}L${B(2.6, -1).map(n2).join(' ')}L${B(depth, -1).map(n2).join(' ')}L${B(depth, 1).map(n2).join(' ')}L${B(2.6, 1).map(n2).join(' ')}L${B(0, 1).map(n2).join(' ')}Z`); fade(r.beam, run);
      for (let i = 0; i < 5; i++) { const d = ((t * 3) + i * depth / 5) % depth; r[`w${i}`].setAttribute('d', `M${B(d, -1).map(n2).join(' ')}Q${vplus(B(d, 0), vtimes(into, .45)).map(n2).join(' ')} ${B(d, 1).map(n2).join(' ')}`); fade(r[`w${i}`], run * (1 - d / depth) * span(d, 0, .4)); }
      for (let i = 0; i < 7; i++) { const d = 1.2 + (i * 2.7) % 3.6, k = ((i * .37) % 1) * 1.6 - .8; at2(r[`k${i}`], B(d, k)); fade(r[`k${i}`], run * Math.max(0, Math.sin(t * 9 + i * 2.1)) ** 3); }
      fade(r.face, .5 + .5 * run * (.6 + .4 * Math.sin(t * 20)));
      reveal(r.note, span(t, 3.4, 4.2));
    }, 4.4];
  },

  /* shortwave diathermy: two plates either side of the knee, a gentle field between them warming deep in the joint */
  swd: svg => {
    const g = uid('sk'), C = [-1, 4, 6], R = 10, Lf = -13;
    const thighW = [[8.8, 8.4, 7.9, 7.2, 6.4, 5.8, 5.6], [8.8, 8.4, 7.9, 7.2, 6.4, 5.8, 5.6]], shinW = [[5.5, 5.9, 5.8, 5, 4, 3.4, 3.2], [5.5, 5.9, 5.8, 5, 4, 3.4, 3.2]];
    // lying on the back seen from above: thigh, knee and shin, running out of the picture
    const leg = y => limbPath(limbPts([-72, y + .8], [0, y], thighW)) + limbPath(limbPts([0, y], [42, y + .4], shinW)) + circlePath([0, y], 5.8);
    // the right knee from the front: femoral condyles, patella over them, tibial plateau, fibula on the outer side
    const femur = curve([[-40, R - 1.7], [-9, R - 2], [-4, R - 4.2], [-1.2, R - 4.6], [.2, R - 3], [-.4, R - .4], [.2, R + 2.6], [-1, R + 4.6], [-4, R + 4.4], [-9, R + 2], [-40, R + 1.7]]);
    const tibia = curve([[40, R - 1.5], [8, R - 2], [3.2, R - 4.4], [1, R - 4.5], [.6, R - 1.6], [1.4, R], [.6, R + 1.6], [1, R + 4.4], [3.2, R + 4.4], [8, R + 2.2], [40, R + 1.5]]);
    const fib = curve([[2.8, R + 4.9], [4.8, R + 5.6], [40, R + 4.3], [40, R + 3.4], [6, R + 3.9]]);
    const patella = curve([[-4.2, R - 2.6], [-.6, R - 2.8], [.6, R], [-.6, R + 2.8], [-4.2, R + 2.6], [-5, R]]);
    const field = [-4.4, -2.2, 0, 2.2, 4.4].map(x => `<path d="M${x * 1.15} ${R - 9.4}C${x * 1.5} ${R - 3} ${x * 1.5} ${R + 3} ${x * 1.15} ${R + 9.4}"/>`).join('');
    // each plate hangs from a slim jointed arm that comes in from outside the couch
    const plate = (y, up) => { const k = up ? -1 : 1, j = [-9, y + k * 14]; return `<path d="M0 ${y + k * 1.3}L-2 ${y + k * 6}L${j[0]} ${j[1]}L-15 ${y + k * 40}" fill="none" stroke="#D9DDE7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${j[0]}" cy="${j[1]}" r="1.4" fill="#EEF1F6" stroke="#C9CFDC" stroke-width=".2"/><rect x="-6.6" y="${y - 1.3}" width="13.2" height="2.6" rx="1.3" fill="#FBFCFE" stroke="#AEB5C9" stroke-width=".18"/>
      <rect data-r="glow${up ? 1 : 2}" x="-5.6" y="${y + (up ? .5 : -1)}" width="11.2" height=".5" rx=".25" fill="${INK.sky}" opacity=".55"/>`; };
    const rings = [0, 1, 2].map(i => `<ellipse data-r="h${i}" cx="-.6" cy="${R}" rx="1" ry=".85" fill="none" stroke="${INK.heat}" stroke-width=".22" opacity="0"/>`).join('');
    const r = mount(svg, `<defs>${skinGrad(g, [-40, -30], [30, 40])}</defs><g data-r="cam"><rect x="-110" y="-40" width="240" height="88" rx="5" fill="url(#aCouch)"/>
      <g opacity=".2" filter="url(#aSofter)" fill="${INK.shade}" transform="translate(.5 1.3)"><path d="${leg(R)}"/><path d="${leg(Lf)}"/></g>
      <g filter="url(#aClayCm)" fill="url(#${g})"><path d="${leg(Lf)}"/><path d="${leg(R)}"/></g>
      <g fill="none" stroke-linecap="round" filter="url(#aSoft)">${[R, Lf].map(y => `<ellipse cx="-1.4" cy="${y}" rx="3.3" ry="2.9" stroke="${INK.shade}" stroke-width=".5" opacity=".13"/><ellipse cx="-1.8" cy="${y - .4}" rx="2" ry="1.6" fill="#fff" opacity=".7"/>`).join('')}
        <path d="M-9.4 ${R - 4.6}C-6.6 ${R - 6.4} -4 ${R - 5.8} -3.2 ${R - 3.8}" stroke="#fff" stroke-width="1.4" opacity=".5"/></g>
      ${lensMarkup(uid('lens'), [0, R], `${solid([femur, tibia, fib], 'url(#aBone)', INK.boneLine, .22)}${solid([patella], 'url(#aBone)', INK.boneLine, .2)}`, .32)}
      <ellipse data-r="heat" cx="-.6" cy="${R}" rx="5" ry="4.2" fill="url(#aHeat)" opacity="0"/>${rings}
      <g data-r="field" fill="none" stroke="${INK.sky}" stroke-width=".26" stroke-dasharray=".8 1.6" opacity="0">${field}</g>
      <g data-r="p1" opacity="0">${plate(R - 10.7, true)}</g><g data-r="p2" opacity="0">${plate(R + 10.7, false)}</g></g>
      ${pointer('note', toStage(...C, [-.6, R]), [470, 344], 'Gentle warmth deep in the joint', 'end')}${whereChip('Knee', 'knee', 'front')}`);
    return [t => {
      r.cam.setAttribute('transform', camera(C[0], C[1], C[2] * mix(.86, 1, outExpo(span(t, .2, 1.8))) * (CALM ? 1 : 1 + .02 * inOut(span(t, 1.8, 12)))));
      openLens(r, t, 8.4, 1);
      [r.p1, r.p2].forEach((p, i) => { const s = outExpo(span(t, 1.4 + i * .2, 2.4 + i * .2)); fade(p, span(t, 1.4 + i * .2, 1.7 + i * .2)); p.setAttribute('transform', `translate(0 ${n2((i ? 1 : -1) * (1 - s) * 6)})`); });
      const on = span(t, 2.4, 3), warm = (Math.max(0, t - 2.4) % 7) / 7, swell = inOut(span(warm, 0, .7)) * (1 - inOut(span(warm, .88, 1)));
      fade(r.field, on * (.55 + .35 * Math.sin(t * 7))); r.field.setAttribute('stroke-dashoffset', n2(Math.sin(t * 11) * 1.2));
      [r.glow1, r.glow2].forEach(n => fade(n, .4 + .6 * on * (.6 + .4 * Math.sin(t * 7))));
      fade(r.heat, on * (.2 + .8 * swell)); r.heat.setAttribute('transform', `translate(-.6 ${R}) scale(${n2(.7 + .5 * swell)}) translate(.6 ${-R})`);
      // warmth radiating from deep in the joint, in slow rings
      for (let i = 0; i < 3; i++) { const u = ((t - 2.6) / 2.4 + i / 3) % 1; r[`h${i}`].setAttribute('rx', n2(1.2 + u * 6.4)); r[`h${i}`].setAttribute('ry', n2(1 + u * 5.4)); fade(r[`h${i}`], on * swell * Math.sin(u * Math.PI) * .8); }
      reveal(r.note, span(t, 3.4, 4.2));
    }, 6.4];
  },

  /* lumbar traction: lying with hips and knees bent over a stool, belts at the ribs and pelvis, a slow steady pull */
  traction: svg => {
    const g = uid('sk'), phi = -95, bends = SEGS.map(([l]) => l[0] === 'L' ? 4.2 : 0);
    const knee0 = vtimes(vdir(4), 43), ankle0 = vplus(knee0, vtimes(vdir(93), 42));
    const floor = tableTop(supine({ hip: [0, 0], phi, bends })), stoolY = knee0[1] + 5.8;
    // the lumbar discs lengthen by `st` each; the pelvis, legs and sliding half of the table move with them
    const pose = (st, breath = 0) => {
      const s = [st * 5, 0], hip = s, k = vplus(knee0, s), a = vplus(ankle0, s);
      const legs = [{ knee: k, ankle: a, foot: 28 }, { knee: vplus(k, [1, -.4]), ankle: vplus(a, [1, -.3]), foot: 28 }];
      const sh = supine({ hip, phi, bends, stretch: st, lite: true }).shoulder;
      return supine({ hip, phi, bends, stretch: st, breath, legs, arms: [armsAlong(sh, floor), armsAlong(vplus(sh, [1, -.4]), floor)] });
    };
    const W = [-8, 8, 2.4], C = [-12, 0, 2.7];
    const r = mount(svg, `<defs>${skinGrad(g, [-60, -50], [40, 20])}</defs><g data-r="cam">
      <rect x="-128" y="${floor}" width="102" height="7" rx="2.4" fill="url(#aCouch)"/><g data-r="slide"><rect x="-25" y="${floor}" width="62" height="7" rx="2.4" fill="url(#aCouch)"/></g>
      <rect x="-128" y="${floor + 7}" width="165" height="2.6" rx="1.3" fill="${INK.couchEdge}"/><rect x="-110" y="${floor + 9}" width="4" height="58" rx="1.6" fill="#D5DAE5"/><rect x="12" y="${floor + 9}" width="4" height="58" rx="1.6" fill="#D5DAE5"/>
      <path d="M12 ${floor}L19 ${n2(stoolY + 4)}M50 ${floor}L43 ${n2(stoolY + 4)}" stroke="#CDD3DF" stroke-width="2" stroke-linecap="round"/><rect x="12" y="${n2(stoolY)}" width="40" height="5" rx="2.2" fill="#E3E7EF" stroke="#D0D6E2" stroke-width=".2"/>
      <rect x="-133" y="${floor - 30}" width="4" height="37" rx="1.6" fill="#D5DAE5"/>
      <g transform="translate(64 ${floor - 42})"><rect width="18" height="108" rx="4" fill="#F4F6FA" stroke="#C9CFDC" stroke-width=".25"/><rect x="3" y="5" width="12" height="9" rx="1.6" fill="${INK.skySoft}"/><rect data-r="gauge" x="4.4" y="10.6" width="9.2" height="1.6" rx=".8" fill="${INK.sky}"/><circle cx="9" cy="26" r="2.4" fill="#E3E7EF" stroke="#C9CFDC" stroke-width=".25"/></g>
      ${sideMarkup(g, { bones: .92 })}
      <path data-r="rope" fill="none" stroke="#9AA3BC" stroke-width=".55" stroke-linecap="round"/><path data-r="glint" fill="none" stroke="#fff" stroke-width=".7" stroke-linecap="round" pathLength="1" stroke-dasharray=".06 1" opacity="0"/>
      <path data-r="strap" fill="none" stroke="#8A92B2" stroke-width=".7" stroke-linecap="round"/>
      <ellipse data-r="space" rx="7" ry="10" fill="url(#aGlow)" opacity="0"/>
      <g fill="#5E6592" fill-opacity=".3" stroke="#5E6592" stroke-width=".3" stroke-opacity=".8"><path data-r="beltT"/><path data-r="beltP"/></g></g>
      ${lumbarInset(96, 304, true)}${pill('insetCap', [96, 384], 'More room for the discs', 0)}
      ${pointer('note', toStage(...C, pose(0).segs[SEG_I.L4].c), [470, 334], 'The lower spine, gently lengthened', 'end')}${whereChip('Lower back', 'lower')}`);
    r.iMark.append(...svgNodes(`<g fill="none" stroke="${INK.sky}" stroke-width=".26" stroke-linecap="round" stroke-linejoin="round"><path data-r="iArrL" d="M-9.6 -.6H-12.6M-11.8 -1.4L-12.7 -.6L-11.8 .2"/><path data-r="iArrR" d="M9.6 -.6H12.6M11.8 -1.4L12.7 -.6L11.8 .2"/></g>`));
    Object.assign(r, parts(svg));
    const belt = (b, lvl, w) => {
      const s = b.segs[SEG_I[lvl]], d = vdir(s.th), out = vdir(s.th + 90), a = vplus(s.back, vtimes(d, -w / 2)), b2 = vplus(s.back, vtimes(d, w / 2)), c = vplus(s.front, vtimes(d, w / 2)), e = vplus(s.front, vtimes(d, -w / 2));
      // a padded belt: rounded at every corner, bowing slightly round the body
      const k = (p, q, t) => vplus(p, vtimes([q[0] - p[0], q[1] - p[1]], t)), side = (p, q) => [k(p, q, .12), k(p, q, .5), k(p, q, .88)];
      const bow = pts => pts.map((p, i) => i === 1 ? vplus(p, vtimes(out, -.6)) : p);
      return { d: curve([...side(a, b2), ...bow(side(b2, c)), ...side(c, e), ...bow(side(e, a))]), mid: vtimes(vplus(s.back, s.front), .5) };
    };
    return [t => {
      camTo(r, t, C, W);
      const c = Math.max(0, t - 2.8) % 7, pull = inOut(span(c, 0, 1.8)) * (1 - inOut(span(c, 4.4, 6.2))), st = pull * .55;
      const b = pose(st, breathSide(t));
      drawSide(r, b);
      r.slide.setAttribute('transform', `translate(${n2(st * 5)} 0)`);
      const T = belt(b, 'T10', 7), P = belt(b, 'L5', 6.5);
      r.beltT.setAttribute('d', T.d); r.beltP.setAttribute('d', P.d);
      r.strap.setAttribute('d', `M-131 ${floor - 22}L${n2(T.mid[0])} ${n2(T.mid[1])}`);
      const rope = `M${n2(P.mid[0])} ${n2(P.mid[1])}L73 ${n2(floor - 16)}`;
      r.rope.setAttribute('d', rope); r.rope.setAttribute('stroke', tint('#9AA3BC', INK.sky, pull));
      // while the pull builds, a glint runs along the rope toward the patient
      r.glint.setAttribute('d', rope); r.glint.setAttribute('stroke-dashoffset', n2(-(1 - (c % 1.8) / 1.8))); fade(r.glint, c < 1.8 ? Math.sin(c / 1.8 * Math.PI) : 0);
      r.gauge.setAttribute('width', n2(1.6 + 7.6 * pull));
      at2(r.space, b.segs[SEG_I.L3].c); r.space.setAttribute('transform', `rotate(${n2(b.segs[SEG_I.L3].th)} ${n2(b.segs[SEG_I.L3].c[0])} ${n2(b.segs[SEG_I.L3].c[1])})`); fade(r.space, pull * .85);
      // the inset: the vertebrae draw apart and the discs between them gain height
      fade(r.inset, span(t, 3, 3.6)); fade(r.insetCap, span(t, 3.4, 3.9));
      const s = pull * .5; setInset(r, [-3.9 - s, 0, 3.9 + s], [0, 0, 0]);
      r.iArrL.setAttribute('transform', `translate(${n2(-s * 1.6)} 0)`); r.iArrR.setAttribute('transform', `translate(${n2(s * 1.6)} 0)`); fade(r.iArrL, pull); fade(r.iArrR, pull);
      reveal(r.note, span(t, 3.4, 4.2));
    }, 5];
  },

  /* exercise: cat–cow on all fours, the spine rounding and dipping one segment at a time */
  catcow: svg => {
    const g = uid('sk'), hip = [-22, 0], floor = 47.5, knee = [-21, 42.6], ankle = [-62.5, 44.2], shoulderY = -8.5;
    const legs = [{ knee, ankle, foot: 270 }, { knee: vplus(knee, [1.6, -.8]), ankle: vplus(ankle, [1.6, -.8]), foot: 270 }];
    // cow (c = 1) arches the low back and lifts the head; cat (c = −1) rounds the whole spine and tucks the chin
    const shape = c => {
      const phi = 90 + (c > 0 ? 9 : 13) * c, bend = l => l[0] === 'L' ? (c > 0 ? -2.6 : -8.6) * c : l[0] === 'T' ? (c > 0 ? -1.2 : -1.8) * c : (c > 0 ? -3 : -3.6) * c;
      const withBase = m => SEGS.map(([l], j) => bend(l) + (j === 0 ? m : 0));
      const m = solve(m => sideBody({ hip, phi, bends: withBase(m), lite: true }).shoulder[1] - shoulderY, -85, 30);
      return { hip, phi, bends: withBase(m), head: c > 0 ? -8 * c : -14 * c };
    };
    const wrist = [sideBody(shape(0)).shoulder[0] + 1, floor - 2.8], wr = [wrist, vplus(wrist, [2, -.8])];
    const armFor = (sh, i) => { const s = i ? vplus(sh, [2, -.8]) : sh; return { elbow: reach(s, wr[i], 30, 25.5, 1), wrist: wr[i], hand: 90 }; };
    const full = (c, breath = 0) => { const p = shape(c), sh = sideBody({ ...p, lite: true }).shoulder; return sideBody({ ...p, breath, legs, arms: [armFor(sh, 0), armFor(sh, 1)] }); };
    // the two ends of the movement, held faintly behind the body as it travels between them
    const ghosts = `<g data-r="ghost" opacity="0"><g filter="url(#aOutline)" fill="#fff">${ghostOf(full(1))}</g><g filter="url(#aOutline)" fill="#fff">${ghostOf(full(-1))}</g></g>`;
    const r = mount(svg, `<defs>${skinGrad(g, [-40, -30], [20, 50])}</defs><g data-r="cam"><rect x="-82" y="${floor}" width="140" height="1.8" rx=".9" fill="#DCE6F1"/>
      <ellipse cx="-14" cy="${floor + .2}" rx="56" ry="1.6" fill="${INK.shade}" opacity=".08" filter="url(#aSofter)"/>${ghosts}${sideMarkup(g, { bones: .95 })}</g>
      ${pill('cow', [384, 46], 'Breathe in: dip and look up', 0)}${pill('cat', [384, 46], 'Breathe out: round the back', 0)}${whereChip('Spine', ['upper', 'lower'])}`);
    let prev = 0;
    return [t => {
      camTo(r, t, [-10, 11, 3.1], [-10, 11, 2.9]);
      const c = swing(Math.max(0, t - 1.2), 6.4), moving = clamp01(Math.abs(c - prev) * 30); prev = c;
      drawSide(r, full(c, c * .9));
      fade(r.ghost, .4 * span(t, 1.4, 2.4));
      // a wave runs through the discs, tail to head, while the spine is moving: it moves one segment at a time
      const u = (((t - 1.2) % 3.2) + 3.2) % 3.2 / 3.2 * 26 - 2;
      [...r.discs.children].forEach((d, i) => d.setAttribute('fill', tint(INK.disc, INK.sky, moving * Math.exp(-(((i - u) / 2.2) ** 2)))));
      fade(r.cow, span(c, .2, .7)); fade(r.cat, span(-c, .2, .7));
    }, 1.2];
  },

  /* exercise: the bridge, lifting the hips until shoulders, hips and knees line up, then lowering slowly */
  bridge: svg => {
    const g = uid('sk'), floor = 30, feet = [36, floor - 6.6];
    const glute = [[-12.8, -9.6], [-15.4, -3], [-15.6, 3], [-13, 8.2], [-8, 10.6], [-4.6, 7], [-6.4, -1.4], [-9.4, -7.6]];
    // the shoulders stay on the mat: solve the pelvis tilt that keeps them there for each hip height, then slide to match
    const body = (L, anchorX) => {
      const hy = floor - 9.6 - 17 * L, bends = SEGS.map(([l]) => l[0] === 'L' ? 4 - 2 * L : 0);
      const phi = solve(m => supine({ hip: [0, hy], phi: m, bends, lite: true }).segs[SEG_I.T3].back[1] - floor, -150, -80);
      const x0 = supine({ hip: [0, hy], phi, bends, lite: true }).segs[SEG_I.T3].back[0], hip = [anchorX === undefined ? 0 : anchorX - x0, hy];
      return { hip, phi, bends };
    };
    const rest = body(0), ax = supine(rest).segs[SEG_I.T3].back[0];
    const full = (L, breath = 0) => {
      const p = body(L, ax), sh = supine({ ...p, lite: true }).shoulder, knee = reach(p.hip, feet, 43, 42, -1);
      const arms = [{ elbow: [sh[0] + 28, floor - 4.4], wrist: [sh[0] + 53, floor - 3.2], hand: 90 }, { elbow: [sh[0] + 29, floor - 4.8], wrist: [sh[0] + 54, floor - 3.6], hand: 90 }];
      const legs = [{ knee, ankle: feet, foot: 90 }, { knee: vplus(knee, [1.2, -.6]), ankle: vplus(feet, [1.2, -.6]), foot: 90 }];
      return { b: supine({ ...p, legs, arms, breath }), p, sh, knee };
    };
    const top = full(1);
    const r = mount(svg, `<defs>${skinGrad(g, [-90, -10], [40, 40])}</defs><g data-r="cam"><rect x="-110" y="${floor}" width="170" height="1.8" rx=".9" fill="#DCE6F1"/>
      <g data-r="ghost" opacity="0" filter="url(#aOutline)" fill="#fff">${ghostOf(top.b)}</g>
      ${sideMarkup(g)}<path data-r="glute" fill="url(#aGlow)" opacity="0"/><path data-r="line" fill="none" stroke="${INK.sky}" stroke-width=".35" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>
      <circle data-r="dotS" r=".9" fill="${INK.sky}" opacity="0"/><circle data-r="dotH" r=".9" fill="${INK.sky}" opacity="0"/><circle data-r="dotK" r=".9" fill="${INK.sky}" opacity="0"/></g>
      ${pill('up', [400, 46], 'Squeeze, lift and hold', 0)}${pill('down', [400, 46], 'Lower slowly', 0)}${whereChip('Hips and lower back', ['hip', 'lower'])}`);
    return [t => {
      camTo(r, t, [-21, 4, 2.85], [-21, 6, 2.65]);
      const c = Math.max(0, t - 1.4) % 6.4, L = inOut(span(c, 0, 1.6)) * (1 - inOut(span(c, 3.6, 5.6)));
      const { b, p, sh, knee } = full(L, breathSide(t));
      drawSide(r, b);
      // the target, shown faintly until the hips reach it
      fade(r.ghost, .55 * span(t, 1.2, 1.8) * (1 - L));
      // the glutes do the lifting: they glow as they work and pulse gently through the hold
      r.glute.setAttribute('d', curve(glute.map(q => vplus(p.hip, vturn(q, p.phi))))); fade(r.glute, L * (.7 + .25 * Math.sin(t * 5)));
      // at the top, shoulders, hips and knees line up: the line draws through them
      const line = span(L, .85, 1);
      r.line.setAttribute('d', `M${n2(sh[0])} ${n2(sh[1])}L${n2(knee[0])} ${n2(knee[1])}`); r.line.setAttribute('stroke-dashoffset', n2(1 - inOut(line)));
      [[r.dotS, sh], [r.dotH, p.hip], [r.dotK, knee]].forEach(([n, q], i) => { at2(n, q); fade(n, span(line, i * .3, i * .3 + .3)); });
      fade(r.up, span(c, .2, .6) * (1 - span(c, 3.4, 3.7))); fade(r.down, span(c, 3.6, 3.9) * (1 - span(c, 5.6, 6)));
    }, 3];
  },

  /* stretching: a guided hamstring stretch, the straight leg raised slowly by the physiotherapist and held */
  stretch: svg => {
    const g = uid('sk'), hip = [0, 0], phi = -90, b0 = supine({ hip, phi }), floor = tableTop(b0), cA = uid('clip'), cB = uid('clip');
    const far = { knee: [43.2, floor - 8.2], ankle: [85, floor - 6.4], foot: 8 };
    const hand = handBack({ thumb: -30, splay: .7, curl: .3, arm: 60, flare: 20 });
    const sh = b0.shoulder, arms = [armsAlong(sh, floor), armsAlong(vplus(sh, [1, -.4]), floor)];
    const legAt = k => { const th = 90 - (4 + 66 * k), d = vdir(th), knee = vplus(hip, vtimes(d, 43)); return { th, d, knee, ankle: vplus(knee, vtimes(d, 42)) }; };
    const end = legAt(1), endBody = supine({ hip, phi: phi - 3, legs: [{ knee: end.knee, ankle: end.ankle, foot: end.th - 90, sole: 1 }], arms: [] });
    const r = mount(svg, `<defs>${skinGrad(g, [-70, -60], [60, 20])}<clipPath id="${cA}"><path data-r="clipA"/></clipPath><clipPath id="${cB}"><path data-r="clipB"/></clipPath></defs>
      <g data-r="cam">${couchSide(-120, 105, floor)}<g data-r="ghost" opacity="0" filter="url(#aOutline)" fill="#fff"><path d="${endBody.legs[0].d}"/></g>
      <path data-r="arc" fill="none" stroke="${INK.sky}" stroke-width=".35" stroke-linecap="round" stroke-dasharray=".6 1.2" opacity="0"/>${sideMarkup(g)}<path data-r="ham" fill="url(#aGlow)" opacity="0"/>
      <g data-r="fib" fill="none" stroke="${INK.sky}" stroke-width=".3" stroke-linecap="round" opacity="0"><path data-r="f0"/><path data-r="f1"/><path data-r="f2"/></g>
      <g data-r="hands" opacity="0"><g clip-path="url(#${cA})">${placeHand(hand, { x: 0, y: 0, size: 17.5, left: true, r: 'hK', fade: true })}</g><g clip-path="url(#${cB})">${placeHand(hand, { x: 0, y: 0, size: 17.5, r: 'hH', fade: true })}</g></g></g>
      <g data-r="hold" opacity="0" transform="translate(392 368)"><rect x="-72" y="-16" width="144" height="32" rx="16" fill="#fff" fill-opacity=".94" stroke="#E2E4EA"/><text text-anchor="middle" y="1">Hold the stretch</text>
        <rect x="-44" y="7" width="88" height="2.4" rx="1.2" fill="${INK.skySoft}"/><rect data-r="holdBar" x="-44" y="7" width="0" height="2.4" rx="1.2" fill="${INK.sky}"/></g>
      ${whereChip('Back of the thigh', [[96, 280]])}`);
    return [t => {
      camTo(r, t, [-20, -30, 2.55], [-20, -26, 2.35]);
      const c = Math.max(0, t - 1.4) % 7.2, k = inOut(span(c, 0, 2.2)) * (1 - inOut(span(c, 5, 7))), { th, d, knee, ankle } = legAt(k), ant = vdir(th - 90), post = vdir(th + 90);
      const p = phi - 3 * span(k, .6, 1);
      const b = supine({ hip, phi: p, legs: [{ knee, ankle, foot: th - 90, sole: 1 }, far], arms, breath: breathSide(t) });
      drawSide(r, b);
      // where the leg is heading, and the arc it travels
      fade(r.ghost, .55 * span(t, 1.2, 1.8) * (1 - k));
      const R0 = 70, a0 = 86 * RAD, a1 = th * RAD;
      r.arc.setAttribute('d', `M${n2(hip[0] + R0 * Math.sin(a0))} ${n2(hip[1] - R0 * Math.cos(a0))}A${R0} ${R0} 0 0 0 ${n2(hip[0] + R0 * Math.sin(a1))} ${n2(hip[1] - R0 * Math.cos(a1))}`); fade(r.arc, span(k, .05, .3) * .7);
      // the hamstrings run from the sitting bone to just below the knee, along the underside of the raised thigh
      const back = b.legs[0].a.back, isch = vplus(hip, vturn([-6.6, 7.6], p)), below = vplus(vplus(knee, vtimes(d, 4)), vtimes(post, 3.6));
      r.ham.setAttribute('d', curve([isch, ...back.slice(1).map(q => vplus(q, vtimes(ant, .5))), below, ...back.slice(1).map((q, i) => vplus(q, vtimes(ant, [4.6, 5, 5, 4.4, 3.6, 2.8][i]))).reverse()]));
      fade(r.ham, .15 + .75 * span(k, .3, 1) * (.85 + .15 * Math.sin(t * 3)));
      [0, 1, 2].forEach(i => { const q = j => vplus(vplus(hip, vtimes(d, 7 + j * 31)), vtimes(post, 5 - i * 1.3)); r[`f${i}`].setAttribute('d', `M${q(0).map(n2).join(' ')}L${q(1).map(n2).join(' ')}`); r[`f${i}`].setAttribute('stroke-dasharray', `${n2(1.4 + 1.4 * k)} 1.4`); r[`f${i}`].setAttribute('stroke-dashoffset', n2(-k * 3)); });
      fade(r.fib, span(k, .5, 1));
      // one hand on the front of the thigh above the knee, one cupping the heel; fingers wrap out of sight round the leg
      const kh = vplus(vplus(hip, vtimes(d, 35)), vtimes(ant, 6.2)), hh = vplus(vplus(hip, vtimes(d, 84)), vtimes(post, 5.6));
      r.hK.setAttribute('transform', `translate(${n2(kh[0])} ${n2(kh[1])}) rotate(${n2(th + 90)})`);
      r.hH.setAttribute('transform', `translate(${n2(hh[0])} ${n2(hh[1])}) rotate(${n2(th - 90)})`);
      r.clipA.setAttribute('d', halfPlane(vplus(knee, vtimes(post, 5.2)), d, ant)); r.clipB.setAttribute('d', halfPlane(vplus(ankle, vtimes(ant, 3.6)), d, post));
      fade(r.hands, span(t, 1.2, 1.8));
      fade(r.hold, span(c, 2.2, 2.6) * (1 - span(c, 4.8, 5.2))); r.holdBar.setAttribute('width', n2(88 * span(c, 2.3, 4.9)));
    }, 3.8];
  },

  /* assessment: a scan down the standing body against a plumb line, a forward bend to see how the spine moves, then strength */
  assess: svg => {
    const g = uid('sk'), floor = 91.6, ankle = [0, 85], mark = ['ear', 'shoulder', 'hip', 'knee', 'ankle'];
    const upright = sideBody({ hip: [0, 0], phi: 0, legs: [{ knee: reach([0, 0], ankle, 43, 42, -1), ankle, foot: 90 }] });
    const r = mount(svg, `<defs>${skinGrad(g, [-30, -90], [30, 95])}<linearGradient id="${g}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${INK.sky}" stop-opacity="0"/><stop offset="1" stop-color="${INK.sky}" stop-opacity=".22"/></linearGradient></defs>
      <g data-r="cam"><rect x="-60" y="${floor}" width="120" height="1.4" rx=".7" fill="#DCE6F1"/>
      <g data-r="ghost" opacity="0" filter="url(#aOutline)" fill="#fff">${ghostOf(upright)}</g>
      <path data-r="plumb" d="M1.3 -92V${floor}" stroke="${INK.sky}" stroke-width=".3" stroke-dasharray="1 1.2" opacity="0"/>
      ${sideMarkup(g, { bones: .9 })}<path data-r="arc" fill="none" stroke="${INK.sky}" stroke-width=".45" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>
      <g data-r="musc" opacity="0" fill="url(#aGlow)"><path data-r="m1"/><path data-r="m2"/></g>
      <g data-r="scan" opacity="0"><rect x="-40" y="-10" width="80" height="10" fill="url(#${g}s)"/><rect x="-40" y="-.2" width="80" height=".4" fill="${INK.sky}"/></g>
      ${mark.map(m => `<g data-r="${m}" opacity="0"><circle data-r="${m}R" r="1.3" fill="none" stroke="${INK.sky}" stroke-width=".25"/><circle r="1.1" fill="${INK.sky}" stroke="#fff" stroke-width=".45"/></g>`).join('')}</g>
      ${pill('t0', [402, 60], 'Posture', 0)}${pill('t1', [402, 60], 'Movement', 0)}${pill('t2', [402, 60], 'Strength', 0)}${whereChip('Whole body', ['upper', 'lower'])}`);
    return [t => {
      const c = t % 10.5, bend = inOut(span(c, 3.6, 5.2)) * (1 - inOut(span(c, 6, 7.6)));
      r.cam.setAttribute('transform', camera(2, 1, 2.08 * mix(.96, 1, outExpo(span(t, 0, 1.6)))));
      const hip = [-7 * bend, 0], phi = 58 * bend, bends = SEGS.map(([l]) => l[0] === 'L' ? 9.5 * bend : l[0] === 'T' ? 1.6 * bend : 2 * bend), head = 6 * bend;
      const sh = sideBody({ hip, phi, bends, head, lite: true }).shoulder, arm = s => ({ elbow: vplus(s, [-.6 + 1.4 * bend, 29.6]), wrist: vplus(s, [1.2 + 1.4 * bend, 55]), hand: 178, soft: true, palm: -1 });
      const legs = [{ knee: reach(hip, ankle, 43, 42, -1), ankle, foot: 90 }, { knee: reach(vplus(hip, [-1.4, 0]), vplus(ankle, [-1.6, 0]), 43, 42, -1), ankle: vplus(ankle, [-1.6, 0]), foot: 90 }];
      const b = sideBody({ hip, phi, bends, head, legs, arms: [arm(sh), arm(vplus(sh, [-1.6, -.4]))], breath: breathSide(t) * (1 - bend) });
      drawSide(r, b);
      // posture: a scan sweeps down the body; each landmark lights as it passes, all on one plumb line
      const scanY = mix(-90, floor, inOut(span(c, .3, 2.7)));
      r.scan.setAttribute('transform', `translate(1.3 ${n2(scanY)})`); fade(r.scan, span(c, .3, .5) * (1 - span(c, 2.6, 3)));
      r.plumb.setAttribute('stroke-dashoffset', '0'); r.plumb.setAttribute('d', `M1.3 -92V${n2(Math.max(-92, scanY))}`); fade(r.plumb, span(c, .3, .5) * (1 - span(c, 3.2, 3.6)) * .9);
      const ear = vplus(b.ao, vplus(vtimes(vdir(b.headTh + 90), 1), vtimes(vdir(b.headTh + 180), -2)));
      const pts = { ear, shoulder: b.shoulder, hip, knee: vplus(legs[0].knee, [1, 0]), ankle: vplus(ankle, [1, 0]) };
      mark.forEach(m => {
        const lit = span(scanY, pts[m][1] - 1, pts[m][1] + 3), k = lit * (1 - span(c, 3.2, 3.6));
        r[m].setAttribute('transform', `translate(${n2(pts[m][0])} ${n2(pts[m][1])})`); fade(r[m], k);
        const ring = span(scanY, pts[m][1], pts[m][1] + 14); r[`${m}R`].setAttribute('r', n2(1.3 + ring * 2.6)); fade(r[`${m}R`], 1 - ring);
      });
      // movement: the spine rolls forward from the hips, the upright pose stays behind faintly, the arc measures the bend
      fade(r.ghost, .55 * bend);
      const a1 = (phi + 26 * bend) * RAD;
      r.arc.setAttribute('d', `M${n2(hip[0])} ${n2(hip[1] - 26)}A26 26 0 0 1 ${n2(hip[0] + 26 * Math.sin(a1))} ${n2(hip[1] - 26 * Math.cos(a1))}`);
      r.arc.setAttribute('stroke-dashoffset', n2(1 - span(c, 3.7, 4.4))); fade(r.arc, 1 - span(c, 7.2, 7.7));
      // strength: the muscles that hold the spine light up and pulse as they work
      const back = b.segs.slice(0, 14).map(s => vplus(s.back, vtimes(vdir(s.th + 90), 2.4)));
      r.m1.setAttribute('d', curve([...back, ...back.slice().reverse().map((q, i) => vplus(q, vtimes(vdir(b.segs[13 - i].th + 90), 3.2)))]));
      r.m2.setAttribute('d', curve([[-13, -9], [-15.2, -2], [-15, 4], [-12.6, 9], [-7.6, 10.6], [-5, 5], [-7, -3], [-9.6, -8]].map(q => vplus(hip, vturn(q, phi)))));
      fade(r.musc, span(c, 7.9, 8.4) * (1 - span(c, 10, 10.5)) * (.6 + .4 * Math.abs(Math.sin(t * 3))));
      fade(r.t0, span(c, .1, .4) * (1 - span(c, 3.3, 3.6))); fade(r.t1, span(c, 3.6, 3.9) * (1 - span(c, 7.4, 7.7))); fade(r.t2, span(c, 7.7, 8) * (1 - span(c, 10.2, 10.5)));
    }, 2.2];
  }
});

const SCENE_LABEL = {
  manual: 'A physiotherapist’s thumbs pressing gently, in a slow rhythm, on one vertebra of the lower back',
  ift: 'Four pads on the lower back, two gentle currents crossing in the middle',
  tens: 'Two pads beside the lower spine sending quick pulses that quieten the pain signal',
  ultrasound: 'A probe with gel moving in small circles over the tendon below the kneecap, sound waves going in',
  swd: 'Two plates either side of the knee, warming the joint from deep inside',
  traction: 'Lying with hips and knees bent while belts at the ribs and pelvis gently stretch the lower spine',
  myofascial: 'Crossed hands slowly drawing apart on the upper back as the layer beneath softens',
  hotcold: 'A pack on the lower back switching between heat, which opens small vessels, and cold, which narrows them',
  catcow: 'The cat–cow exercise on all fours, the spine rounding and dipping',
  bridge: 'The bridge exercise: lifting the hips from lying on the back, holding, then lowering',
  stretch: 'A physiotherapist raising a straight leg to stretch the back of the thigh, then holding',
  assess: 'A body seen from the side while posture, movement and strength are checked'
};

function scene(name) {
  ensureSceneDefs();
  const s = svgEl({ class: 'scene', viewBox: '0 0 480 400', role: 'img', 'aria-label': `Animation: ${SCENE_LABEL[name]}` });
  const [tick, poster] = SCENES[name](s);
  play(s, tick, poster);
  return s;
}
// swaps the scene in a host with a short crossfade
function showScene(host, name) {
  if (host.dataset.scene === name) return;
  host.dataset.scene = name;
  const next = scene(name), old = [...host.querySelectorAll('.scene')];
  next.classList.add('enter');
  host.append(next);
  requestAnimationFrame(() => requestAnimationFrame(() => next.classList.remove('enter')));
  // the old scene freezes on its last frame while it fades, so only one scene is ever being drawn
  old.forEach(o => { o._stop = true; o.classList.add('leave'); setTimeout(() => o.remove(), 500); });
}
