// Tilted cards: a card that leans toward the cursor on a soft spring, catches the light across its face and along
// its edge, casts a shadow that shifts as it lifts, and flips over to show its back. A plain-JavaScript port of
// React Bits' TiltedCard (the markup lives in the page; this adds the motion). Any [data-tilt] element is wired up.
(() => {
  const FLIP_THRESHOLD = 6;
  const lim = (v, a, b) => Math.min(b, Math.max(a, v));
  const smoother = t => { const x = lim(t, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };
  // a damped spring, stepped finely so it stays stable at any frame rate; returns true while still moving
  function spring(s, key, target, omega, zeta, dt) {
    const v = `v${key}`, steps = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / steps;
    for (let i = 0; i < steps; i++) { s[v] += (omega * omega * (target - s[key]) - 2 * zeta * omega * s[v]) * h; s[key] += s[v] * h; }
    const settled = Math.abs(target - s[key]) < .001 && Math.abs(s[v]) < .01;
    if (settled) { s[key] = target; s[v] = 0; }
    return !settled;
  }

  function tiltedCard(figure, o = {}) {
    const body = figure.querySelector('.tilted-card__body'), shade = figure.querySelector('.tilted-card__shadow'), caption = figure.querySelector('.tilted-card__caption');
    // the loading overlay (shown by CSS while the portrait is on its way): flat, on top, outside the 3D body
    if (!figure.querySelector('.tilted-card__skel')) { const sk = document.createElement('span'); sk.className = 'tilted-card__skel'; sk.setAttribute('aria-hidden', 'true'); figure.append(sk); }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const set = {
      amplitude: lim(o.rotateAmplitude ?? 10, 0, 60), scale: o.scaleOnHover ?? 1.03, smoothness: lim(o.smoothness ?? .6, 0, 1), glare: lim(o.glare ?? .45, 0, 1),
      shadow: lim(o.shadow ?? .5, 0, 1), parallax: o.parallax ?? 1, intro: o.intro ?? true, introDelay: o.introDelay || 0,
      flippable: !!figure.querySelector('.tilted-card__back'), tooltip: !!caption
    };
    const S = { rx: 0, vrx: 0, ry: 0, vry: 0, lift: 0, vlift: 0, ty: 0, vty: 0, flip: 0, vflip: 0, press: 0, vpress: 0, tip: 0, vtip: 0, shown: 0, vshown: 0, tx: 0, tyy: 0 };
    const pointer = { nx: 0, ny: 0, x: 0, y: 0, inside: false, mouse: false, vx: 0, last: 0 }, press = { active: false, x: 0, y: 0, moved: false };
    let flipped = false, opacity = 1, entered = true, introAt = -1, focused = false, raf = 0, last = 0, visible = true;
    // the card turns over from its own buttons (one on each face), so the links and buttons on the back stay usable
    const flips = [...figure.querySelectorAll('[data-flip]')];
    // iOS Safari can draw a card flat (both faces in one plane, the back on top, mirrored), so the face turned away is
    // hidden outright rather than left to backface-visibility. The swap happens edge-on, where neither face shows.
    const faceFront = figure.querySelector('.tilted-card__front'), faceBack = figure.querySelector('.tilted-card__back');
    let backShown = false;
    const showFace = (turn, force) => {
      const b = Math.cos(turn * Math.PI / 180) < 0;
      if (!faceBack || (!force && b === backShown)) return;
      backShown = b; faceFront.style.visibility = b ? 'hidden' : ''; faceBack.style.visibility = b ? '' : 'hidden';
    };
    showFace(0, true);
    if (set.flippable) { figure.toggleAttribute('data-interactive', true); flips.forEach(b => b.setAttribute('aria-expanded', 'false')); }
    // the intro (fade and tilt in) only for a card that starts below the screen; one already on screen is just there
    // The fade is on the card's outer frame, never on its 3D body: opacity on anything inside the 3D card makes Safari
    // draw both faces, so the back would show through the front while it fades in.
    if (set.intro && !reduced && figure.getBoundingClientRect().top >= innerHeight) { entered = false; opacity = 0; S.rx = 16; S.ty = 22; figure.style.opacity = '0'; }

    const frame = now => {
      raf = 0;
      const dt = lim((now - last) / 1000 || 0, 0, .05);
      last = Math.max(last, now);
      let busy = false;
      const amp = set.amplitude * (reduced ? .3 : 1), hovering = pointer.inside && pointer.mouse, touching = press.active && !pointer.mouse;
      const following = hovering || touching, inX = following ? pointer.nx : 0, inY = following ? pointer.ny : 0;
      const omega = 20 * Math.pow(.2, set.smoothness), zeta = 1 - .3 * set.smoothness, lifted = hovering || touching || focused ? 1 : 0;
      if (!entered && introAt >= 0 && now >= introAt) entered = true;
      const settle = entered || !set.intro || reduced;
      busy = spring(S, 'rx', settle ? -inY * amp : S.rx, omega, zeta, dt) || busy;
      busy = spring(S, 'ry', settle ? inX * amp : S.ry, omega, zeta, dt) || busy;
      busy = spring(S, 'ty', settle ? 0 : S.ty, omega * .8, .9, dt) || busy;
      busy = spring(S, 'lift', lifted, omega, Math.max(zeta, .85), dt) || busy;
      busy = spring(S, 'flip', flipped ? 180 : 0, reduced ? 18 : 9.5, .72, dt) || busy;
      busy = spring(S, 'press', press.active && !press.moved && set.flippable ? 1 : 0, 26, .8, dt) || busy;
      if (settle && opacity < 1) { opacity = Math.min(1, opacity + dt / .45); busy = true; }

      figure.toggleAttribute('data-active', lifted > 0 || S.lift > .01);
      const scale = 1 + (set.scale - 1) * S.lift - .02 * S.press, rx = S.rx, ry = S.ry, rX = rx * Math.PI / 180, rY = ry * Math.PI / 180;
      body.style.transform = `translate3d(0, ${S.ty.toFixed(2)}px, 0) rotateX(${rx.toFixed(3)}deg) rotateY(${(ry + S.flip).toFixed(3)}deg) scale(${scale.toFixed(4)})`;
      showFace(ry + S.flip);
      figure.style.opacity = opacity < 1 ? smoother(opacity).toFixed(3) : '';
      body.style.setProperty('--tc-px', (Math.sin(rY) * set.parallax).toFixed(4));
      body.style.setProperty('--tc-py', (-Math.sin(rX) * set.parallax).toFixed(4));
      const reach = Math.max(amp, 1);
      body.style.setProperty('--tc-gx', `${(50 + ry / reach * 46).toFixed(2)}%`);
      body.style.setProperty('--tc-gy', `${(50 - rx / reach * 46).toFixed(2)}%`);
      body.style.setProperty('--tc-glare', (set.glare * Math.max(S.lift, Math.min(1, Math.hypot(rx, ry) / reach)) * (opacity < 1 ? smoother(opacity) : 1)).toFixed(3));
      // the shadow falls away from the tilt and spreads as the card lifts; it narrows as the card turns edge-on
      const strength = set.shadow * (opacity < 1 ? smoother(opacity) : 1), turn = Math.abs(Math.cos(S.flip * Math.PI / 180)), spread = scale * (.86 + .04 * S.lift);
      shade.style.transform = `translate3d(${(-Math.sin(rY) * 22).toFixed(2)}px, ${(12 + 16 * S.lift + Math.sin(rX) * 18 - S.ty * .6).toFixed(2)}px, 0) scale(${(spread * (.2 + .8 * turn)).toFixed(4)}, ${spread.toFixed(4)})`;
      shade.style.opacity = (strength * (.6 + .4 * S.lift)).toFixed(3);
      // a small tag follows the cursor and swings as it moves
      if (caption) {
        busy = spring(S, 'shown', set.tooltip && hovering && !flipped ? 1 : 0, 16, 1, dt) || busy;
        const follow = 1 - Math.exp(-dt / .035);
        S.tx += (pointer.x - S.tx) * follow; S.tyy += (pointer.y - S.tyy) * follow;
        if (Math.abs(pointer.x - S.tx) + Math.abs(pointer.y - S.tyy) > .2) busy = true;
        pointer.vx *= Math.exp(-dt / .08);
        busy = spring(S, 'tip', reduced ? 0 : lim(-pointer.vx * .012, -14, 14), 18, .62, dt) || busy;
        caption.style.transform = `translate3d(${S.tx.toFixed(1)}px, ${S.tyy.toFixed(1)}px, 0) rotate(${S.tip.toFixed(2)}deg)`;
        caption.style.opacity = Math.max(0, S.shown).toFixed(3);
      }
      if ((busy || (!settle && set.intro)) && visible) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (raf || !visible) return; last = performance.now(); raf = requestAnimationFrame(frame); };
    const locate = e => { const r = figure.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, w: Math.max(1, r.width), h: Math.max(1, r.height) }; };
    const track = e => {
      const p = locate(e), now = performance.now(), el = Math.max(8, now - (pointer.last || now - 16)) / 1000;
      pointer.vx += ((p.x - pointer.x) / el - pointer.vx) * .5; pointer.last = now;
      pointer.x = p.x; pointer.y = p.y; pointer.nx = lim((p.x - p.w / 2) / (p.w / 2), -1, 1); pointer.ny = lim((p.y - p.h / 2) / (p.h / 2), -1, 1);
    };
    const begin = e => { const p = locate(e); pointer.x = S.tx = p.x; pointer.y = S.tyy = p.y; pointer.vx = 0; };
    figure.addEventListener('pointerenter', e => { pointer.inside = true; pointer.mouse = e.pointerType === 'mouse' || e.pointerType === 'pen'; begin(e); track(e); wake(); });
    figure.addEventListener('pointermove', e => {
      pointer.mouse = e.pointerType === 'mouse' || e.pointerType === 'pen';
      if (!pointer.inside && pointer.mouse) { pointer.inside = true; begin(e); }
      track(e);
      if (press.active && Math.hypot(e.clientX - press.x, e.clientY - press.y) > FLIP_THRESHOLD) press.moved = true;
      wake();
    });
    figure.addEventListener('pointerleave', () => { pointer.inside = false; pointer.vx = 0; wake(); });
    figure.addEventListener('pointerdown', e => {
      Object.assign(press, { active: true, moved: false, x: e.clientX, y: e.clientY });
      pointer.mouse = e.pointerType === 'mouse' || e.pointerType === 'pen';
      if (!pointer.mouse) { pointer.inside = true; track(e); }
      wake();
    });
    addEventListener('pointerup', e => { if (!press.active) return; press.active = false; if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') pointer.inside = false; wake(); }, { passive: true });
    addEventListener('pointercancel', () => { press.active = false; press.moved = true; pointer.inside = false; wake(); }, { passive: true });
    figure.addEventListener('focusin', () => { focused = !!figure.querySelector(':focus-visible'); wake(); });
    figure.addEventListener('focusout', () => { focused = false; wake(); });
    // flipping: a click or tap (not a drag) on the card, or Enter or Space; links and buttons on the card still work
    const flip = () => {
      const kb = !!document.activeElement && !!document.activeElement.closest('[data-flip]');
      flipped = !flipped; figure.toggleAttribute('data-flipped', flipped);
      flips.forEach(b => b.setAttribute('aria-expanded', String(flipped)));
      const front = figure.querySelector('.tilted-card__front'), back = figure.querySelector('.tilted-card__back');
      front.inert = flipped; back.inert = !flipped;
      // keyboard users land on the turn button of the face that's now showing
      if (kb) { const b = (flipped ? back : front).querySelector('[data-flip]'); if (b) b.focus({ preventScroll: true }); }
      wake();
    };
    if (set.flippable) {
      figure.querySelector('.tilted-card__back').inert = true;
      figure.addEventListener('click', e => { if (press.moved || (e.target.closest('a, button') && !e.target.closest('[data-flip]'))) return; flip(); });
    }
    new IntersectionObserver(es => {
      visible = es.some(e => e.isIntersecting);
      figure.classList.toggle('is-away', !visible); // the loading pulse rests while the card is off screen
      if (visible && !entered && introAt < 0) introAt = performance.now() + set.introDelay;
      wake();
    }).observe(figure);
    wake();
  }
  $$('[data-tilt]').forEach((f, i) => tiltedCard(f, { introDelay: i * 140, rotateAmplitude: +f.dataset.tilt || 10 }));
})();
