// Home: the booking bar in the hero (branch, day, the next free times), the drifting gallery and live branch hours.

/* ---------- booking bar ---------- */
const H = { b: nearestIndex(), day: null, slot: null };
const segs = { branch: $('[data-open="branch"]'), day: $('[data-open="day"]') };
const pops = { branch: $('[data-pop="branch"]'), day: $('[data-pop="day"]') };
let activePop = null;

function goHref() {
  const b = BRANCHES[H.b];
  return `book.html?branch=${b.id}&day=${dayISO(H.day)}${H.slot ? `&slot=${H.slot.t}` : ''}`;
}
function renderBar() {
  const b = BRANCHES[H.b], loading = !diaryReady(b, H.day), free = loading ? [] : freeSlots(b, H.day);
  // a time picked before the day's real times arrived, and since taken, gives way to the first free one
  if (!loading && H.slot && !free.some(s => s.t === H.slot.t)) H.slot = free[0] || null;
  $('[data-qb-blabel]').textContent = savedKm() && H.b === nearestIndex() ? 'Nearest branch' : 'Branch';
  $('[data-qb-branch]').textContent = b.short;
  $('[data-qb-day]').textContent = dayShort(H.day);
  const status = $('[data-qb-status]');
  if (isToday(H.day)) paintLive(status, b);
  else { status.classList.remove('closed'); status.replaceChildren(el('i'), el('span', {}, `${DAYS[H.day.getDay()]} · ${hoursText(b, H.day)}`)); }
  const chips = free.slice(0, 5).map(s => {
    const on = H.slot && H.slot.t === s.t;
    const c = el('button', { class: 'tchip', type: 'button', role: 'radio', 'aria-checked': String(!!on) }, `${s.label} ${s.suffix}`);
    c.addEventListener('click', () => { H.slot = s; renderBar(); });
    return c;
  });
  $('[data-qb-chips]').setAttribute('aria-busy', String(loading));
  $('[data-qb-chips]').replaceChildren(...(loading ? skelChips(5) : chips.length ? chips : [el('p', { class: 'qb-none' }, 'No free times left this day. ', (() => {
    const n = el('button', { type: 'button' }, 'See the next open day'); n.addEventListener('click', () => { H.day = nextOpenAfter(b, H.day); H.slot = freeSlots(b, H.day)[0] || null; renderBar(); }); return n;
  })())]));
  const go = $('[data-qb-go]');
  go.href = goHref();
  go.firstElementChild.textContent = H.slot && !loading ? `Book ${H.slot.label} ${H.slot.suffix}` : 'Book a visit';
  $('[data-qb-all]').href = `book.html?branch=${b.id}&day=${dayISO(H.day)}`;
}
function nextOpenAfter(b, d) { for (let i = 1; i < 21; i++) { const x = addDays(d, i); if (freeSlots(b, x).length) return x; } return addDays(d, 1); }
function pickBranch(i) {
  H.b = i;
  if (!freeSlots(BRANCHES[i], H.day).length) H.day = firstOpenDay(BRANCHES[i]);
  H.slot = freeSlots(BRANCHES[i], H.day)[0] || null;
  closePopover(); renderBar(); segs.branch.focus();
}
function pickDay(d) { H.day = d; H.slot = freeSlots(BRANCHES[H.b], d)[0] || null; closePopover(); renderBar(); segs.day.focus(); }

function fillBranches() {
  pops.branch.replaceChildren(...BRANCHES.map((b, i) => {
    const st = branchStatus(b);
    const o = el('button', { class: 'opt', type: 'button', role: 'option', 'aria-selected': String(i === H.b) },
      el('b', {}, b.name), el('span', { class: 'live' + (st.open ? '' : ' closed') }, el('i'), el('span', {}, st.text)),
      el('span', { class: 'km' }, kmText(b), icon('mark')));
    o.addEventListener('click', () => pickBranch(i));
    return o;
  }));
}
function fillDays() { calendar(pops.day, { selected: H.day, works: d => worksOn(BRANCHES[H.b], d), worksText: worksDays(BRANCHES[H.b]), isOpen: d => freeSlots(BRANCHES[H.b], d).length > 0, onPick: pickDay }); }
function openPopover(which) {
  if (activePop === which) { closePopover(); return; }
  closePopover();
  which === 'branch' ? fillBranches() : fillDays();
  const seg = segs[which], pop = pops[which];
  pop.style.left = seg.offsetLeft + 'px';
  // open upwards when the space below is taken by the dock
  pop.classList.remove('up');
  if (seg.getBoundingClientRect().bottom + pop.offsetHeight + 110 > innerHeight) pop.classList.add('up');
  pop.classList.add('is-open'); seg.setAttribute('aria-expanded', 'true'); activePop = which;
  (pop.querySelector('[aria-selected="true"], [aria-pressed="true"]') || pop.querySelector('button:not(:disabled)')).focus({ preventScroll: true });
}
function closePopover() {
  if (!activePop) return;
  pops[activePop].classList.remove('is-open'); segs[activePop].setAttribute('aria-expanded', 'false'); activePop = null;
}
Object.entries(segs).forEach(([k, s]) => s.addEventListener('click', () => openPopover(k)));
document.addEventListener('click', e => { if (activePop && !e.target.closest('.qb-row')) closePopover(); });
addEventListener('keydown', e => {
  if (!activePop) return;
  if (e.key === 'Escape') { const s = segs[activePop]; closePopover(); s.focus(); }
  if (activePop === 'branch' && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    const opts = $$('.opt', pops.branch), i = opts.indexOf(document.activeElement);
    opts[(i + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length].focus(); e.preventDefault();
  }
});

H.day = firstOpenDay(BRANCHES[H.b]);
H.slot = freeSlots(BRANCHES[H.b], H.day)[0] || null;
document.addEventListener('jpn:slots', () => renderBar());
renderBar();

/* ---------- gallery: photos on a gentle convex arc (carousel.js); the glow takes the colour of the photo in front ---------- */
const LABELS = galleryLabels(['JP Nagar · reception', 'JP Nagar · treatment room', 'Bannerghatta · exercise area', 'Bannerghatta · traction', 'Arekere · treatment room', 'Arekere · waiting area']);
gradientCarousel($('[data-gcar]'), { labels: LABELS, groups: galleryGroups(LABELS), onOpen: i => openViewer(i) });
const frame = el('div', { class: 'frame photo' }), count = el('p', { class: 'count' });
const mk = (cls, label, ic) => el('button', { class: cls, type: 'button', 'aria-label': label }, icon(ic));
const bClose = mk('close', 'Close', 'close'), bPrev = mk('prev', 'Previous photo', 'chevron'), bNext = mk('next', 'Next photo', 'chevron');
const viewer = el('div', { class: 'viewer', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Clinic photos' }, count, frame, bClose, bPrev, bNext, el('p', { class: 'keys' }, 'Use ← and → to move, Esc to close'));
document.body.append(viewer);
let cur = 0, lastFocus;
function show(i) { cur = (i + LABELS.length) % LABELS.length; frame.dataset.label = LABELS[cur]; count.textContent = `${cur + 1} / ${LABELS.length}`; paintPhoto(frame, clinicPhoto(cur)); }
function openViewer(i) { lastFocus = document.activeElement; show(i); viewer.classList.add('is-open'); setModal(viewer, true); document.documentElement.classList.add('locked'); bClose.focus(); }
function closeViewer() { viewer.classList.remove('is-open'); setModal(viewer, false); document.documentElement.classList.remove('locked'); if (lastFocus) lastFocus.focus(); }
setModal(viewer, false);
bClose.addEventListener('click', closeViewer); bPrev.addEventListener('click', () => show(cur - 1)); bNext.addEventListener('click', () => show(cur + 1));
viewer.addEventListener('click', e => { if (e.target === viewer) closeViewer(); });
addEventListener('keydown', e => {
  if (!viewer.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeViewer();
  if (e.key === 'ArrowRight') show(cur + 1);
  if (e.key === 'ArrowLeft') show(cur - 1);
});

/* ---------- ready when you are: live hours per branch ---------- */
$('[data-ready]').replaceChildren(...BRANCHES.map(b => {
  const st = branchStatus(b);
  return el('li', {}, el('b', {}, b.short), el('span', { class: 'live' + (st.open ? '' : ' closed') }, el('i'), el('span', {}, st.text)),
    el('span', {}, ...hoursNodes(b)), el('a', { class: 'link', href: `book.html?branch=${b.id}` }, 'Book here', icon('chevron')));
}));
