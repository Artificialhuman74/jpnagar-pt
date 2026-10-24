// Gradient carousel: photos on a gentle convex arc. The front photo is full size; up to two on each side step back,
// turn outward and fade. Arrows (in front of the cards), swipe, drag and arrow keys move it; each move slides the
// arc round and fades the next photo into the centre. A soft glow behind takes the front photo's colour, blending
// smoothly from one to the next. Shared by the desktop and mobile home pages; markup is .gcar (see the CSS).
function gradientCarousel(root, o) {
  const LABELS = o.labels, N = LABELS.length, [S1, S2] = o.step || [360, 300], DRAG = o.dragPx || 340;
  // each photo's glow is one colour from the logo's own blues: cyan, deep sky, periwinkle, navy and light sky
  const TINTS = o.tints || ['#00A8EC', '#5B63C9', '#0079B8', '#7C83D6', '#2B3192', '#4FC3F2'];
  const q = s => root.querySelector(s), stage = q('[data-gcar-stage]'), glows = [...root.querySelectorAll('.gcar-glow i')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let at = 0, drag = 0, moved = false, shown = reduced || !('IntersectionObserver' in window), auto = !reduced, timer;
  const lastD = LABELS.map((_, i) => { const d = (i + N) % N; return d > N / 2 ? d - N : d; });
  const cards = LABELS.map((l, i) => {
    const card = document.createElement('div'); card.className = 'photo'; card.dataset.label = l;
    const b = document.createElement('button'); b.className = 'gcar-card'; b.type = 'button'; b.setAttribute('aria-label', `Open photo: ${l}`); b.append(card);
    b.addEventListener('click', () => { if (moved) return; stopAuto(); if (i === at) o.onOpen && o.onOpen(i); else go(i); });
    if (typeof tilt === 'function') tilt(card, 8);
    stage.append(b);
    return b;
  });
  // where a card sits for its offset from the front: further round the arc it steps back, turns outward and fades;
  // at most two show on each side, the next one waits just out of sight
  function pose(d) {
    const a = Math.abs(d), s = Math.sign(d);
    const x = s * (Math.min(a, 1) * S1 + Math.max(0, a - 1) * S2), z = -(a * 120 + a * a * 34), ry = -s * Math.min(a, 2.6) * 17;
    const op = a <= 2 ? 1 - a * .3 : Math.max(0, .4 - (a - 2) * .4);
    return { t: `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${shown ? 0 : 46}px, ${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg)`, op: shown ? op : 0, };
  }
  const offset = i => { let d = ((i - at) % N + N) % N; if (d > N / 2) d -= N; return d; };
  function place(stagger) {
    cards.forEach((b, i) => {
      let d = offset(i);
      // the card that drops out of sight stays on the side it left from, so nothing flies across the middle
      if (Math.abs(d) >= N / 2) d = Math.sign(lastD[i] || d) * N / 2;
      const apply = v => { const p = pose(v + drag); b.style.transform = p.t; b.style.opacity = p.op.toFixed(3); };
      if (Math.abs(d - lastD[i]) > 2.5) { b.style.transition = 'none'; apply(Math.sign(d) * N / 2); void b.offsetWidth; }
      b.style.transition = drag ? 'none' : '';
      b.style.transitionDelay = stagger ? `${Math.abs(d) * 90}ms` : '';
      apply(d);
      b.style.zIndex = String(20 - Math.round(Math.abs(d) * 4));
      b.toggleAttribute('data-front', d === 0);
      b.tabIndex = d === 0 ? 0 : -1;
      b.setAttribute('aria-hidden', String(Math.abs(d) > 2));
      lastD[i] = d;
    });
  }
  function caption() {
    const cap = q('.gcar-cap');
    q('[data-gcar-label]').textContent = LABELS[at]; q('[data-gcar-count]').textContent = `${at + 1} / ${N}`;
    cap.classList.remove('swap'); void cap.offsetWidth; cap.classList.add('swap');
  }
  // two glow layers trade places: the new colour fades in over the old one, then the old one lets go. Only opacity
  // changes, which the browser can do without repainting, so the cards keep moving smoothly
  let layer = 0;
  const glow = first => { if (!first) { glows[layer].classList.remove('on'); layer ^= 1; } glows[layer].style.setProperty('--a', TINTS[at % TINTS.length]); glows[layer].classList.add('on'); };
  function go(i) { at = ((i % N) + N) % N; place(); caption(); glow(); }
  function stopAuto() { auto = false; clearInterval(timer); }
  function startAuto() { clearInterval(timer); if (auto && shown) timer = setInterval(() => go(at + 1), 5200); }
  q('[data-gcar-prev]').addEventListener('click', () => { stopAuto(); go(at - 1); });
  q('[data-gcar-next]').addEventListener('click', () => { stopAuto(); go(at + 1); });
  root.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); stopAuto(); go(at + (e.key === 'ArrowRight' ? 1 : -1)); } });
  root.addEventListener('mouseenter', () => clearInterval(timer)); root.addEventListener('mouseleave', startAuto);
  // drag or swipe: the arc follows the finger, then settles on the nearest photo; the pointer is only captured once
  // a real drag starts, so a plain tap still reaches the photo and opens it
  let x0 = null;
  stage.addEventListener('pointerdown', e => { x0 = e.clientX; moved = false; });
  stage.addEventListener('pointermove', e => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    if (Math.abs(dx) > 6 && !moved) { moved = true; stage.classList.add('is-dragging'); stage.setPointerCapture(e.pointerId); }
    if (moved) { drag = Math.max(-2.4, Math.min(2.4, dx / DRAG)); place(); }
  });
  const release = () => {
    if (x0 === null) return;
    x0 = null; stage.classList.remove('is-dragging');
    if (moved) { stopAuto(); const k = Math.round(drag); drag = 0; go(at - k); setTimeout(() => { moved = false; }, 0); }
  };
  stage.addEventListener('pointerup', release); stage.addEventListener('pointercancel', release);
  glow(true);
  place(); caption();
  // the photos rise and fade in from the centre outward the first time the carousel comes into view
  if (!shown) new IntersectionObserver(([e], io) => { if (!e.isIntersecting) return; io.disconnect(); shown = true; place(true); setTimeout(() => cards.forEach(b => { b.style.transitionDelay = ''; }), 1200); startAuto(); }, { threshold: .35 }).observe(root);
  else startAuto();
  new IntersectionObserver(([e]) => { if (e.isIntersecting) startAuto(); else clearInterval(timer); }).observe(root);
}
