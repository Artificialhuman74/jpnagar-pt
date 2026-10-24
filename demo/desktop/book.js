// Booking: four steps on the left; the ticket on the right fills in as you choose.
// Confirming hands the booking to booked.html, where the same ticket prints.
ensureFigDefs();
const q = new URLSearchParams(location.search);
const S = { gender: 'male', areas: new Set(), reasons: new Set(), service: null, story: '', b: 0, day: null, sess: 0, slot: null, ther: -1, therSet: false, name: '', phone: '', email: '' };

/* ---------- arriving from the home bar, a service, a branch or a profile ---------- */
const bi = BRANCHES.findIndex(b => b.id === q.get('branch'));
S.b = bi >= 0 ? bi : nearestIndex();
const qDay = fromISO(q.get('day'));
S.day = qDay && qDay >= startOfDay(nowIST()) && freeSlots(BRANCHES[S.b], qDay).length ? qDay : firstOpenDay(BRANCHES[S.b]);
const qSlot = parseFloat(q.get('slot'));
S.slot = freeSlots(BRANCHES[S.b], S.day).find(s => s.t === qSlot) || null;
pickSession();
const qTher = q.get('therapist');
if (qTher !== null && TEAM[+qTher]) { S.ther = +qTher; S.therSet = true; }
const SVC_REASON = { postop: 'surgery', neuro: 'neuro', paeds: 'child', geri: 'elder', home: 'elder', women: 'women' };
S.service = SERVICES.find(s => s.id === q.get('service')) || null;
if (S.service && SVC_REASON[S.service.id]) S.reasons.add(SVC_REASON[S.service.id]);
// ?area=lower or ?area=lower~back,knee-right~back picks spots ahead, the way a service page's "Book for back pain" links
const KEYS = new Set(['front', 'back'].flatMap(face => REGIONS.map(([type, pos]) => spotKey(face, type, pos))));
(q.get('area') || '').split(',').map(a => a.includes('~') ? a : `${a}~back`).filter(k => KEYS.has(k)).forEach(k => S.areas.add(k));

function pickSession() {
  const b = BRANCHES[S.b];
  if (S.slot) { S.sess = b.sessions.findIndex(([s, e]) => S.slot.t >= s && S.slot.t < e); return; }
  const i = b.sessions.findIndex((_, si) => slotsFor(b, S.day, si).some(s => !s.taken));
  S.sess = i < 0 ? 0 : i;
}

/* ---------- step 1: body map, front and back side by side ---------- */
const HS = [];
['front', 'back'].forEach(face => {
  const stage = $(`[data-fig="${face}"]`);
  stage.prepend(svgEl({ viewBox: '0 0 240 480', 'aria-hidden': 'true' }, FIG[S.gender][face]));
  REGIONS.forEach(([type, pos]) => {
    const key = spotKey(face, type, pos), label = labelOf(key);
    const h = el('button', { class: 'hs', type: 'button', 'aria-pressed': 'false', 'aria-label': label, 'data-key': key },
      el('span', { class: 'tip', 'aria-hidden': 'true' }, label.replace(/ \((front|back)\)$/, '')));
    h.addEventListener('click', () => toggleArea(key, h));
    stage.append(h); HS.push({ h, type, pos });
  });
});
function placeSpots() {
  HS.forEach(({ h, type, pos }) => { const [x, y] = spotXY(S.gender, type, pos); h.style.left = (x / 240 * 100) + '%'; h.style.top = (y / 480 * 100) + '%'; });
}
function toggleArea(key, h) {
  S.areas.has(key) ? S.areas.delete(key) : S.areas.add(key);
  if (h && S.areas.has(key)) { h.classList.remove('pulse'); void h.offsetWidth; h.classList.add('pulse'); }
  paintPicked(); update();
}
function toggleReason(r) {
  S.reasons.has(r) ? S.reasons.delete(r) : S.reasons.add(r);
  $$('[data-reason]').forEach(p => p.setAttribute('aria-pressed', String(S.reasons.has(p.dataset.reason))));
  paintPicked(); update();
}
function chip(text, remove, key) {
  const b = el('button', { type: 'button', 'aria-label': `Remove ${text}` }, text, icon('close'));
  b.addEventListener('click', remove);
  if (key) ['mouseenter', 'focus'].forEach(ev => b.addEventListener(ev, () => hl(key, true)));
  if (key) ['mouseleave', 'blur'].forEach(ev => b.addEventListener(ev, () => hl(key, false)));
  return b;
}
function hl(key, on) { const h = $(`.hs[data-key="${key}"]`); if (h) h.classList.toggle('hl', on); }
function careList() {
  const out = new Set();
  S.areas.forEach(k => (CARE[k.split(/[-~]/)[0]] || []).forEach(c => out.add(c)));
  S.reasons.forEach(r => CARE[r].forEach(c => out.add(c)));
  return [...out].slice(0, 4);
}
function paintPicked() {
  $$('.hs[data-key]').forEach(h => { const on = S.areas.has(h.dataset.key); h.classList.toggle('on', on); h.setAttribute('aria-pressed', String(on)); });
  const chips = [...S.areas].map(k => chip(labelOf(k), () => { hl(k, false); toggleArea(k); }, k))
    .concat([...S.reasons].map(r => chip(REASON[r], () => toggleReason(r))))
    .concat(S.service ? [chip(S.service.name, () => { S.service = null; paintPicked(); update(); })] : []);
  $('[data-picked]').replaceChildren(...(chips.length ? chips : [el('span', { class: 'none' }, 'Nothing yet. Tap a spot on the body, or skip this step.')]));
  const care = careList(), c = $('[data-care]');
  c.hidden = !care.length;
  c.replaceChildren('We’ll likely start with ', el('b', {}, care.join(' · ')));
}
function setGender(g) {
  if (g === S.gender) return;
  S.gender = g;
  $$('[data-gender]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.gender === g)));
  ['front', 'back'].forEach(face => {
    const stage = $(`[data-fig="${face}"]`);
    stage.classList.add('swap');
    setTimeout(() => {
      stage.querySelector(':scope > svg').replaceWith(svgEl({ viewBox: '0 0 240 480', 'aria-hidden': 'true' }, FIG[g][face]));
      stage.classList.remove('swap');
    }, reduceMotion ? 0 : 220);
  });
  placeSpots(); update();
}
$$('[data-gender]').forEach(b => b.addEventListener('click', () => setGender(b.dataset.gender)));
$$('[data-reason]').forEach(p => p.addEventListener('click', () => toggleReason(p.dataset.reason)));
$$('[data-reason]').forEach(p => p.setAttribute('aria-pressed', String(S.reasons.has(p.dataset.reason))));
const story = $('#story');
story.addEventListener('input', () => { S.story = story.value.trim(); update(); });
$$('[data-starters] .pill').forEach(p => p.addEventListener('click', () => {
  const t = p.textContent, v = story.value.trim();
  if (!v.toLowerCase().includes(t.toLowerCase())) story.value = (v ? v.replace(/[.\s]*$/, '. ') : '') + t + '.';
  p.setAttribute('aria-pressed', 'true'); S.story = story.value.trim(); update(); story.focus();
}));

/* ---------- step 2: branch, day, session, time ---------- */
// The branch cards, calendar and session switch are built once and updated in place, so picking only changes what's
// chosen. The times are rebuilt only when the day, session or branch changes, fading in, and their area keeps the
// height of the longest session so the page below never jumps.
const brBtns = BRANCHES.map((x, i) => {
  const n = el('button', { class: 'bropt', type: 'button', role: 'radio' },
    el('span', { class: 'bropt-h' }, el('b', {}, x.short), el('span', { class: 'km' }, kmText(x))),
    el('span', { class: 'live' }, el('i'), el('span')), el('small', {}, x.landmark));
  n.addEventListener('click', () => {
    if (S.b === i) return;
    S.b = i; S.slot = null;
    if (!freeSlots(x, S.day).length) S.day = firstOpenDay(x);
    pickSession(); renderWhen(); update();
  });
  return n;
});
$('[data-branches]').replaceChildren(...brBtns);
let sessBtns = [], timesKey = '';
function renderWhen() {
  const b = BRANCHES[S.b];
  brBtns.forEach((n, i) => {
    const st = branchStatus(BRANCHES[i]), live = n.querySelector('.live');
    n.setAttribute('aria-checked', String(i === S.b)); live.classList.toggle('closed', !st.open); live.lastChild.textContent = st.text;
  });
  calendar($('[data-cal]'), { selected: S.day, isOpen: d => freeSlots(b, d).length > 0, onPick: d => { if (sameDay(d, S.day)) return; S.day = d; S.slot = null; pickSession(); renderWhen(); update(); } });
  $('[data-slot-title]').textContent = `Times ${isToday(S.day) ? 'today' : `on ${DAYS[S.day.getDay()]}`}, ${S.day.getDate()} ${MONTHS[S.day.getMonth()]}`;
  if (sessBtns.length !== b.sessions.length) {
    sessBtns = b.sessions.map((_, si) => { const n = el('button', { type: 'button', role: 'radio' }); n.addEventListener('click', () => { if (S.sess === si) return; S.sess = si; renderWhen(); }); return n; });
    $('[data-sessions]').replaceChildren(...sessBtns);
  }
  sessBtns.forEach((n, si) => {
    const [s, e] = b.sessions[si];
    n.textContent = `${si ? 'Evening' : 'Morning'} · ${fmtHour(s)}–${fmtHour(e)}`;
    n.setAttribute('aria-checked', String(si === S.sess));
    n.disabled = !slotsFor(b, S.day, si).some(x => !x.taken);
  });
  const grid = $('[data-slots]'), key = `${S.b}|${dayISO(S.day)}|${S.sess}`;
  if (key === timesKey) { grid.querySelectorAll('.slot').forEach(n => n.setAttribute('aria-checked', String(!!S.slot && S.slot.t === +n.dataset.t))); return; }
  timesKey = key;
  const rows = Math.ceil(Math.max(...b.sessions.map(([s, e]) => (e - s) * 2)) / 4);
  grid.style.minHeight = `${rows * 52 + (rows - 1) * 10}px`;
  const list = slotsFor(b, S.day, S.sess);
  grid.replaceChildren(...(list.length ? list.map((x, i) => {
    const n = el('button', { class: 'slot', type: 'button', role: 'radio', 'data-t': x.t, style: `--i:${i}`, 'aria-checked': String(!!S.slot && S.slot.t === x.t), 'aria-label': `${x.label} ${x.suffix}${x.taken ? ', taken' : ''}` }, `${x.label} ${x.suffix}`);
    n.disabled = x.taken;
    n.addEventListener('click', () => { S.slot = x; renderWhen(); update(); });
    return n;
  }) : [el('p', { class: 'empty' }, 'No times left in this session. Try the other session or another day.')]));
  grid.classList.remove('swap'); void grid.offsetWidth; grid.classList.add('swap');
}

/* ---------- step 3: who ---------- */
// which physiotherapists treat what was picked, from each one's "What they treat" (a sample until the clinic confirms)
const THER_CARE = [
  ['Orthopaedic', 'Sports', 'Neurological', 'Spine & Back Care', 'Joint Replacement Rehab'],
  ['Post-Operative Rehab', 'Joint Replacement Rehab', 'Geriatric', 'Home Care'],
  ['Orthopaedic', 'Post-Operative Rehab', 'Sports', 'Neurological', 'Spine & Back Care']
];
function paintFit() {
  const care = careList();
  $$('[data-docs] .doc[data-i]').forEach(n => {
    const hit = (TEAM[+n.dataset.i].care || THER_CARE[+n.dataset.i] || []).filter(c => care.includes(c));
    const tag = n.querySelector('.fit'); tag.hidden = !hit.length; tag.title = hit.join(', ');
  });
}
function renderDocs() {
  const card = (on, pic, name, sub, extra, pick) => {
    const n = el('button', { class: 'doc', type: 'button', role: 'radio', 'aria-checked': String(on) }, pic, el('span', { class: 'tick', 'aria-hidden': 'true' }, icon('mark')), el('b', {}, name), el('small', {}, sub), extra);
    n.addEventListener('click', () => { pick(); S.therSet = true; renderDocs(); update(); });
    return n;
  };
  $('[data-docs]').replaceChildren(
    card(S.ther < 0, el('span', { class: 'ph any', 'aria-hidden': 'true' }, el('i', { class: 'photo' }), el('i', { class: 'photo' }), el('i', { class: 'photo' })), 'Any available', 'Gets you the earliest slot', null, () => { S.ther = -1; }),
    ...TEAM.map((t, i) => { const ph = el('span', { class: 'ph photo', 'aria-hidden': 'true' }); paintPhoto(ph, t.photo); const n = card(S.ther === i, ph, t.short, t.card, degChips(t.deg.slice(0, 2)), () => { S.ther = i; }); n.dataset.i = i; n.append(el('span', { class: 'fit', hidden: true }, icon('mark'), 'Treats this')); return n; }));
  paintFit();
}
$('[data-meet]').addEventListener('click', () => drawer.open('Our physiotherapists', ...TEAM.map((t, i) => {
  const b = el('button', { class: 'btn btn--act btn--block', type: 'button' }, `Choose ${t.short}`);
  b.addEventListener('click', () => { S.ther = i; S.therSet = true; renderDocs(); update(); drawer.close(); toast(`${t.short} is on your ticket`); });
  return profile(t, b);
})));

/* ---------- step 4: details ---------- */
const F = { name: $('#nm'), phone: $('#ph'), email: $('#em') };
const VALID = { name: () => S.name.length > 1, phone: () => /^[6-9]\d{9}$/.test(S.phone), email: () => !S.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(S.email) };
function read() { S.name = F.name.value.trim(); S.phone = F.phone.value.replace(/\D/g, ''); S.email = F.email.value.trim(); }
// a field's error is shown and also announced: the input is marked invalid and points at its message
function check(k) {
  read(); const ok = VALID[k](), f = $(`[data-f="${k}"]`), msg = f.querySelector('.msg');
  f.classList.toggle('err', !ok); msg.id = `msg-${k}`;
  if (ok) { F[k].removeAttribute('aria-invalid'); F[k].removeAttribute('aria-describedby'); } else { F[k].setAttribute('aria-invalid', 'true'); F[k].setAttribute('aria-describedby', msg.id); }
  return ok;
}
F.phone.addEventListener('input', () => { const d = F.phone.value.replace(/\D/g, '').slice(0, 10); F.phone.value = d.length > 5 ? d.slice(0, 5) + ' ' + d.slice(5) : d; });
Object.entries(F).forEach(([k, inp]) => {
  inp.addEventListener('input', () => { inp.closest('.field').classList.remove('err'); inp.removeAttribute('aria-invalid'); inp.removeAttribute('aria-describedby'); read(); update(); });
  inp.addEventListener('blur', () => { if (inp.value.trim()) check(k); });
});

/* ---------- the ticket fills in; a changed line flashes once ---------- */
const T = { day: $('[data-tk-day]'), branch: $('[data-tk-branch]'), landmark: $('[data-tk-landmark]'), ther: $('[data-tk-ther]'), arrive: $('[data-tk-arrive]'), name: $('[data-tk-name]'), phone: $('[data-tk-phone]') };
const seen = {};
const ph = t => el('span', { class: 'ph-text' }, t);
function setLine(k, sig, ...nodes) {
  if (seen[k] === sig) return;
  const first = !(k in seen); seen[k] = sig;
  T[k].replaceChildren(...nodes);
  if (!first) { T[k].classList.remove('flash'); void T[k].offsetWidth; T[k].classList.add('flash'); }
}
function listText(a) { return a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`; }
function update() {
  paintFit();
  const b = BRANCHES[S.b], tsig = S.slot ? String(S.slot.t) : '';
  setLine('day', dayISO(S.day), dayLong(S.day));
  if (seen.time !== tsig) {
    const first = !('time' in seen); seen.time = tsig;
    const time = $('[data-tk-time]');
    time.classList.toggle('is-empty', !S.slot);
    time.replaceChildren(...(S.slot ? [el('span', { class: first ? null : 'roll' }, S.slot.label), el('em', {}, S.slot.suffix)] : ['Pick a time']));
  }
  setLine('branch', b.id, b.name);
  setLine('landmark', b.id, b.landmark);
  setLine('ther', String(S.ther), S.ther < 0 ? 'Any available' : TEAM[S.ther].short);
  setLine('arrive', tsig, S.slot ? arriveBy(S.slot.t) : ph('After you pick a time'));
  setLine('name', S.name, S.name || ph('Your name'));
  setLine('phone', S.phone, S.phone ? `+91 ${S.phone.slice(0, 5)} ${S.phone.slice(5)}`.trim() : ph('Your number'));
  const keys = [...S.areas];
  const labels = keys.map(labelOf).concat([...S.reasons].map(r => REASON[r]), S.service ? [S.service.name] : []);
  $('[data-tk-figs]').replaceChildren(miniFigure(S.gender, 'front', keys), miniFigure(S.gender, 'back', keys));
  $('[data-tk-hurt]').classList.toggle('no-figs', !keys.length);
  $('[data-tk-chips]').replaceChildren(...(labels.length ? labels.map(l => el('span', {}, l)) : [el('span', { class: 'ph-text' }, 'Not sure yet? That’s fine, we’ll assess you.')]));
  const note = $('[data-tk-note]'); note.hidden = !S.story; note.textContent = S.story;
  $('#step-where').classList.toggle('is-done', labels.length > 0 || !!S.story);
  $('#step-when').classList.toggle('is-done', !!S.slot);
  $('#step-who').classList.toggle('is-done', S.therSet);
  $('#step-you').classList.toggle('is-done', VALID.name() && VALID.phone() && VALID.email());
  const miss = [!S.slot && 'a time', !VALID.name() && 'your name', !VALID.phone() && 'your mobile number'].filter(Boolean);
  $('[data-todo]').replaceChildren(...(miss.length ? ['Still needed: ', el('b', {}, listText(miss))] : ['All set. You can still change anything above.']));
  $('[data-progress]').textContent = miss.length ? 'Fills in as you choose' : 'Ready to confirm';
  requestAnimationFrame(() => fitNotches($('[data-tk]')));
}

/* ---------- confirm ---------- */
function attn(sel, msg) {
  const s = $(sel);
  s.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  s.classList.remove('attn'); void s.offsetWidth; s.classList.add('attn');
  if (msg) toast(msg);
}
$('[data-confirm]').addEventListener('click', e => {
  read();
  if (!S.slot) { attn('#step-when', 'Pick a time first'); const free = $('[data-slots] .slot:not(:disabled)'); (free || $('#h-when')).focus({ preventScroll: true }); return; }
  const bad = ['name', 'phone', 'email'].find(k => !check(k));
  if (bad) { attn('#step-you'); F[bad].focus({ preventScroll: true }); return; }
  const btn = e.currentTarget, b = BRANCHES[S.b];
  if (btn.classList.contains('is-busy')) return;
  btn.classList.add('is-busy'); btn.firstElementChild.textContent = 'Booking';
  const booking = { id: bookingId(b, S.day, S.slot.t), b: b.id, day: dayISO(S.day), t: S.slot.t, ther: S.ther, gender: S.gender, areas: [...S.areas], reasons: [...S.reasons],
    service: S.service ? S.service.id : null, story: S.story, name: S.name, phone: S.phone, email: S.email };
  const done = () => { saveBooking(booking); setTimeout(() => { location.href = withT('booked.html'); }, reduceMotion ? 0 : 700); };
  if (!LIVE) return done();
  // on WordPress the slot is reserved for real: the clinic's number for it goes on the ticket, and "Any available"
  // shows whoever the diary gave the patient
  const problem = [...S.areas].map(labelOf).concat([...S.reasons].map(r => REASON[r]), S.service ? [S.service.name] : []).join(', ');
  LIVE.book({ branch: b.id, date: dayISO(S.day), time: Math.round(S.slot.t * 60), doctor: S.ther >= 0 ? TEAM[S.ther].id : null,
    name: S.name, phone: S.phone, email: S.email, problem, note: S.story }).then(r => {
    if (r.ok) { booking.id = `JP-${b.code}-${String(r.data.id).padStart(5, '0')}`; booking.ther = TEAM.findIndex(t => t.id === r.data.doctor); return done(); }
    btn.classList.remove('is-busy'); btn.firstElementChild.textContent = 'Confirm booking';
    toast((r.data && r.data.message) || 'That didn’t go through. Please try again, or call the clinic.');
    if (r.status === 409) { LIVE.refresh(b.id, S.day); S.slot = null; update(); attn('#step-when'); }
  });
});
// the real diary arrives a day at a time; redraw the times when one comes in
if (LIVE) document.addEventListener('jpn:slots', () => { timesKey = ''; if (S.slot && slotsFor(BRANCHES[S.b], S.day, S.sess).some(x => x.t === S.slot.t && x.taken)) S.slot = null; renderWhen(); update(); });

placeSpots(); paintPicked(); renderWhen(); renderDocs(); paintIcons(); update();

