// Makes the desktop design pages clickable: one-choice groups, the body map, service filters,
// branch sorting, the team "Know more" sheet and the gallery viewer. Sample data matches the mobile demo.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg', parser = new DOMParser();
const page = document.body.dataset.page;

function frag(markup) {
  const doc = parser.parseFromString(`<svg xmlns="${NS}">${markup}</svg>`, 'image/svg+xml');
  return [...doc.documentElement.childNodes].map(n => document.importNode(n, true));
}
function icon(markup) {
  const s = document.createElementNS(NS, 'svg');
  [['viewBox', '0 0 24 24'], ['fill', 'none'], ['stroke', 'currentColor'], ['stroke-width', '1.7'], ['stroke-linecap', 'round'], ['stroke-linejoin', 'round'], ['aria-hidden', 'true']].forEach(([k, v]) => s.setAttribute(k, v));
  s.append(...frag(markup)); return s;
}
function el(tag, attrs, ...kids) { const n = document.createElement(tag); Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, v)); n.append(...kids); return n; }
const ICON = {
  check: '<circle cx="12" cy="12" r="9.5"/><path d="m7.6 12.4 3 3 5.8-6.2"/>',
  tick: '<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.7 2.7L16.2 9.4"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>'
};
const toastEl = el('div', { class: 'toast', role: 'status' }); document.body.append(toastEl);
let toastT;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2200); }

/* ---------- one choice per group ---------- */
const TAB_ON = 'background: #fff; box-shadow: 0 2px 8px -3px rgba(20,22,41,.25)';
function pick(b) {
  const sel = b.matches('.slot') ? '.slot' : b.matches('.day') ? '.day' : b.matches('.tab') ? '.tab' : b.matches('.doc') ? '.doc' : 'button';
  const onCls = b.matches('.slot,.day,.tab') ? 'is-on' : 'on';
  [...b.parentElement.children].filter(x => x.matches(sel)).forEach(x => {
    x.classList.remove(onCls); if (x.hasAttribute('role')) x.setAttribute('aria-checked', 'false');
    if (x.matches('.tab')) x.removeAttribute('style');
    if (x.matches('.doc')) x.querySelector('.tick')?.remove();
  });
  b.classList.add(onCls); if (b.hasAttribute('role')) b.setAttribute('aria-checked', 'true');
  if (b.matches('.tab')) b.setAttribute('style', TAB_ON);
  if (b.matches('.doc')) b.querySelector('.ph').after(el('span', { class: 'tick', 'aria-hidden': 'true' }, icon(ICON.check)));
}
document.addEventListener('click', e => {
  const b = e.target.closest('.slot, .day, button.tab, .doc, .sessions button, .seg button, .filters .pill');
  if (!b || b.disabled || b.classList.contains('is-taken') || b.classList.contains('is-off')) return;
  pick(b);
  if (b.matches('.slot')) {
    const t = b.textContent.trim();
    const cta = b.closest('.bk')?.querySelector('a.btn'); if (cta) cta.textContent = `Book ${t} pm`;
  }
  if (b.matches('.seg button') && page === 'book') setGender(b.textContent.trim().toLowerCase());
  if (b.matches('.filters .pill') && page === 'services') filterServices(b);
  summary();
});
document.addEventListener('click', e => {
  const p = e.target.closest('.also .pill'); if (p) p.classList.toggle('on');
  const s = e.target.closest('.starters .pill');
  if (s) {
    const ta = $('#story'), t = s.textContent.trim(), v = ta.value.trim();
    if (!v.toLowerCase().includes(t.toLowerCase())) ta.value = (v ? v.replace(/[.\s]*$/, '. ') : '') + t + '.';
    s.classList.add('on');
  }
});
function summary() {
  const p = $('.confirm-row p'); if (!p) return;
  const day = $('.day.is-on'), slot = $('.slot.is-on'), tab = $('.tab.is-on b'), doc = $('.doc.on b');
  const dayTxt = day ? (day.querySelector('small').textContent === 'Today' ? 'Today' : `${day.querySelector('small').textContent} ${day.querySelector('b').textContent}`) : '';
  const b = el('b', { style: 'color: #141629' }, `${dayTxt}, ${slot ? slot.textContent.trim() : '—'} pm`);
  p.replaceChildren(b, ` · ${tab ? tab.textContent : ''} · ${doc ? doc.textContent : 'Any available'}`);
}

/* ---------- body map on the booking page ---------- */
const ORDER = ['neck', 'shoulder-a', 'shoulder-b', 'upper', 'lower', 'elbow-a', 'elbow-b', 'hand-a', 'hand-b', 'hip-a', 'hip-b', 'knee-a', 'knee-b', 'foot-a', 'foot-b'];
const POS = {
  male: { neck: [120, 78], shoulder: [74, 106], upper: [120, 134], lower: [120, 194], elbow: [58, 174], hand: [54, 256], hip: [94, 226], knee: [97, 328], foot: [98, 434] },
  female: { neck: [120, 78], shoulder: [82, 106], upper: [120, 136], lower: [120, 196], elbow: [67, 174], hand: [63, 256], hip: [90, 228], knee: [98, 330], foot: [99, 434] }
};
const NAME = { neck: 'Neck', shoulder: 'shoulder', elbow: 'elbow', hand: 'wrist & hand', hip: 'hip', knee: 'knee', foot: 'ankle & foot' };
const TORSO = { front: { upper: 'Chest', lower: 'Stomach' }, back: { upper: 'Upper back', lower: 'Lower back' } };
function spotLabel(face, key) {
  const [type, pos] = key.split('-');
  if (TORSO[face][type]) return TORSO[face][type];
  if (!pos) return `${NAME[type]} (${face})`;
  const left = (face === 'back') === (pos === 'a');
  return `${left ? 'Left' : 'Right'} ${NAME[type]} (${face})`;
}
const FEMALE_DEFS = `<g id="f-body"><ellipse cx="120" cy="43" rx="20" ry="27"/><ellipse cx="100" cy="46" rx="3.5" ry="6"/><ellipse cx="140" cy="46" rx="3.5" ry="6"/><path d="M112 64 L128 64 L130 88 L110 88 Z"/><path d="M110 86 C100 89 88 91 81 98 C76 104 76 114 79 124 L85 148 C89 162 92 170 92 178 C89 194 80 208 78 222 L120 248 L162 222 C160 208 151 194 148 178 C148 170 151 162 155 148 L161 124 C164 114 164 104 159 98 C152 91 140 89 130 86 Z"/><path d="M79 101 C70 116 66 142 66 170 C64 196 61 218 58 240 L70 242 C73 220 76 198 78 176 C81 152 84 134 87 122 Z"/><path d="M161 101 C170 116 174 142 174 170 C176 196 179 218 182 240 L170 242 C167 220 164 198 162 176 C159 152 156 134 153 122 Z"/><ellipse cx="63" cy="256" rx="7.5" ry="14.5" transform="rotate(8 63 256)"/><ellipse cx="177" cy="256" rx="7.5" ry="14.5" transform="rotate(-8 177 256)"/><path d="M78 218 C73 264 79 300 87 332 C89 364 92 398 94 428 L106 428 C106 398 108 364 110 332 C114 302 119 280 119 248 Z"/><path d="M162 218 C167 264 161 300 153 332 C151 364 148 398 146 428 L134 428 C134 398 132 364 130 332 C126 302 121 280 121 248 Z"/></g><path id="f-hair" d="M99 44 C97 13 143 13 141 44 C142 62 146 80 149 92 C146 99 135 102 120 102 C105 102 94 99 91 92 C94 80 98 62 99 44 Z"/><path id="f-fringe" d="M100 42 C99 15 141 15 140 42 C136 31 130 27 122 27 C114 30 106 33 100 42 Z"/>`;
const LINES = 'fill="none" stroke="#B2B8CC" stroke-width="1.5" stroke-linecap="round"';
const FEMALE_FIG = {
  front: `<use filter="url(#vol)" fill="url(#hair)" href="#f-hair"/><g filter="url(#vol)" fill="url(#skin)"><use href="#f-body"/><ellipse cx="99" cy="438" rx="11" ry="8"/><ellipse cx="141" cy="438" rx="11" ry="8"/></g><use filter="url(#vol)" fill="url(#hair)" href="#f-fringe"/><g ${LINES}><path d="M108 93 C100 96 92 97 86 99"/><path d="M132 93 C140 96 148 97 154 99"/><path d="M93 130 C98 145 112 147 118 138"/><path d="M147 130 C142 145 128 147 122 138"/><path d="M90 214 C103 228 114 240 120 248"/><path d="M150 214 C137 228 126 240 120 248"/><path d="M93 329 C96 322 104 322 106 330"/><path d="M147 329 C144 322 136 322 134 330"/></g>`,
  back: `<g filter="url(#vol)" fill="url(#skin)"><use href="#f-body"/><ellipse cx="100" cy="434" rx="8" ry="7"/><ellipse cx="140" cy="434" rx="8" ry="7"/></g><use filter="url(#vol)" fill="url(#hair)" href="#f-hair"/><g ${LINES}><path d="M120 104 L120 210" stroke-dasharray="2 5"/><path d="M100 112 C96 122 98 134 106 142"/><path d="M140 112 C144 122 142 134 134 142"/><path d="M120 220 L120 243"/><path d="M84 236 C92 252 110 254 119 246"/><path d="M156 236 C148 252 130 254 121 246"/><path d="M94 336 C98 339 103 339 107 336"/><path d="M146 336 C142 339 137 339 133 336"/></g>`
};
let gender = 'male', maleFig = null;
if (page === 'book') {
  $('defs').append(...frag(FEMALE_DEFS));
  const figs = $$('.fig-row figure');
  maleFig = figs.map(f => [...f.querySelector('svg').childNodes].map(n => n.cloneNode(true)));
  figs.forEach((f, fi) => {
    const face = fi === 0 ? 'front' : 'back';
    $$('.spot', f).forEach((s, i) => {
      s.dataset.key = ORDER[i]; s.setAttribute('role', 'button'); s.tabIndex = 0;
      s.setAttribute('aria-label', spotLabel(face, ORDER[i])); s.setAttribute('aria-pressed', s.classList.contains('on'));
      const toggle = () => { s.classList.toggle('on'); s.setAttribute('aria-pressed', s.classList.contains('on')); chips(); };
      s.addEventListener('click', toggle);
      s.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    });
  });
  chips();
}
function chips() {
  const out = [];
  $$('.fig-row figure').forEach((f, fi) => {
    const face = fi === 0 ? 'front' : 'back', on = $$('.spot.on', f);
    f.classList.toggle('on', on.length > 0);
    on.forEach(s => out.push(spotLabel(face, s.dataset.key)));
  });
  $('.chosen').replaceChildren(...(out.length ? out : ['Tap a spot on the body']).map(t => el('span', {}, t)));
}
function setGender(g) {
  if (g === gender || !POS[g]) return; gender = g;
  $$('.fig-row figure').forEach((f, fi) => {
    const face = fi === 0 ? 'front' : 'back', svg = f.querySelector('svg');
    svg.replaceChildren(...(g === 'male' ? maleFig[fi].map(n => n.cloneNode(true)) : frag(FEMALE_FIG[face])));
    $$('.spot', f).forEach(s => {
      const [type, pos] = s.dataset.key.split('-'); let [x, y] = POS[g][type]; if (pos === 'b') x = 240 - x;
      s.style.left = (x / 240 * 100) + '%'; s.style.top = (y / 480 * 100) + '%';
    });
  });
}

/* ---------- services filter ---------- */
const SVC_TAGS = [['back'], ['joints'], ['sports', 'joints'], ['surgery'], ['neuro'], ['women'], ['children'], ['elderly', 'joints'], ['elderly', 'surgery'], []];
const FILTER_KEYS = ['all', 'back', 'joints', 'sports', 'surgery', 'neuro', 'women', 'children', 'elderly'];
function filterServices(b) {
  const key = FILTER_KEYS[[...b.parentElement.children].indexOf(b)];
  let n = 0;
  $$('.svc-grid .svc').forEach((c, i) => { const show = key === 'all' || SVC_TAGS[i].includes(key); c.hidden = !show; if (show) n++; });
  $('.count').textContent = key === 'all' ? `${n} areas of care` : `${n} matching`;
}

/* ---------- branches: nearest first ---------- */
const BR = [['Arekere MICO Layout', 'Arekere', 12.8886, 77.6022], ['Bannerghatta Road', 'Bannerghatta', 12.8775, 77.5975], ['JP Nagar 7th Phase', 'JP Nagar', 12.8937, 77.5855]];
const AREAS = { 'JP Nagar': [12.9063, 77.5857], 'Arekere': [12.8869, 77.5998], 'Hulimavu': [12.8775, 77.6011], 'BTM Layout': [12.9166, 77.6101], 'Bannerghatta Road': [12.8890, 77.5970], 'Gottigere': [12.8569, 77.5880], 'Jayanagar': [12.9299, 77.5824], 'Bilekahalli': [12.8986, 77.6050] };
function km(a, b, c, d) { const r = x => x * Math.PI / 180, h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); }
function sortFrom(lat, lng, where) {
  const list = $('.blist'), cards = $$('.bcard', list);
  const rows = cards.map(c => { const br = BR.find(b => c.querySelector('h2').textContent === b[0]); return { c, br, d: km(lat, lng, br[2], br[3]) }; });
  const before = new Map(cards.map(c => [c, c.getBoundingClientRect().top]));
  rows.sort((x, y) => x.d - y.d).forEach((r, i) => {
    list.append(r.c); r.c.querySelector('.meta').children[2].textContent = `${r.d.toFixed(1)} km`;
    r.c.querySelector('.near-tag')?.remove(); if (i === 0) r.c.querySelector('.h').append(el('span', { class: 'near-tag' }, 'Nearest'));
  });
  cards.forEach(c => { const dy = before.get(c) - c.getBoundingClientRect().top; if (dy) c.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.16,1,.3,1)' }); });
  const pins = $$('.pinlbl').slice(0, 3);
  pins.forEach(p => { const r = rows.find(x => p.textContent.startsWith(x.br[1])); if (r) { p.textContent = `${r.br[1]} · ${r.d.toFixed(1)} km`; p.classList.toggle('near', r === rows[0]); } });
  $('.found').textContent = `${where}: ${rows[0].br[0]} is closest, ${rows[0].d.toFixed(1)} km away`;
}
if (page === 'branches') {
  $$('.locate .or .pill').forEach(p => p.addEventListener('click', () => {
    $$('.locate .or .pill').forEach(x => x.classList.toggle('on', x === p));
    const a = AREAS[p.textContent.trim()]; if (a) sortFrom(a[0], a[1], `From ${p.textContent.trim()}`);
  }));
  $('.locate .btn').addEventListener('click', () => {
    if (!navigator.geolocation) { toast('Location isn’t available here. Pick your area instead.'); return; }
    $('.found').textContent = 'Finding you…';
    navigator.geolocation.getCurrentPosition(p => sortFrom(p.coords.latitude, p.coords.longitude, 'From where you are'),
      () => { $('.found').textContent = 'No problem. Pick your area instead.'; }, { timeout: 8000 });
  });
}

/* ---------- team: Know more sheet ---------- */
const TEAM = [
  { name: 'Dr. P. Senthil (PT)', role: 'Founder · Chief Consultant Physiotherapist · 27+ years', treat: ['Orthopaedic and sports injuries', 'Neurological conditions', 'Long-term and complex pain', 'Acute and chronic joint and muscle problems'], bg: ['BPT and MPT (Sports & Musculoskeletal), Rajah Muthiah Medical College', 'Certified Orthopaedic Manual Therapist', 'Advanced training in acupuncture and alternative medicine', 'Founded the clinic in 2012'] },
  { name: 'Dr. Vanitha Senthil (PT)', role: 'Senior Consultant Physiotherapist', treat: ['Restoring mobility', 'Reducing pain', 'Structured rehabilitation programmes', 'Guided therapeutic exercise'], bg: ['Master of Physiotherapy', 'Certified Orthopaedic Manual Therapist', 'Known for compassionate, patient-centred care'] },
  { name: 'Dr. Jeya Chitra Devi (PT)', role: 'HOD & Senior Consultant · Arekere · 15+ years', treat: ['Orthopaedic and post-surgery rehab', 'Sports physiotherapy', 'Neurological rehabilitation', 'Posture and work-related (ergonomic) problems'], bg: ['BPT, Dr. MGR Medical University', 'Head of Department at the Arekere branch', 'Focus on long-term recovery, not just temporary relief'] }
];
if (page === 'team') {
  const scrim = el('div', { class: 'scrim' }), sheet = el('section', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Physiotherapist details' });
  document.body.append(scrim, sheet);
  let opener;
  const close = () => { sheet.classList.remove('is-open'); scrim.classList.remove('is-open'); opener && opener.focus(); };
  scrim.addEventListener('click', close);
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  $$('.team3 .member').forEach((m, i) => m.addEventListener('click', e => {
    e.preventDefault(); opener = m; const t = TEAM[i];
    const list = items => el('ul', { class: 'ticks' }, ...items.map(x => el('li', {}, icon(ICON.tick), el('span', {}, x))));
    const x = el('button', { class: 'iconbtn x', 'aria-label': 'Close' }, icon(ICON.close)); x.addEventListener('click', close);
    const first = t.name.replace(' (PT)', '');
    sheet.replaceChildren(el('div', { class: 'grab', 'aria-hidden': 'true' }), x,
      el('div', { class: 'who' }, el('div', { class: 'photo' }), el('div', {}, el('h2', {}, t.name), el('p', { class: 'role' }, t.role))),
      el('h3', {}, 'What they treat'), list(t.treat), el('h3', {}, 'Background'), list(t.bg),
      el('a', { class: 'btn btn--act btn--block', href: 'book.html' }, `Book with ${first}`));
    sheet.classList.add('is-open'); scrim.classList.add('is-open'); x.focus();
  }));
}

/* ---------- gallery viewer on the home page ---------- */
if (page === 'home') {
  const photos = $$('.gal .photo'), labels = photos.map(p => p.dataset.label);
  const frame = el('div', { class: 'frame photo' }), count = el('p', { class: 'count' });
  const mk = (cls, label, ic) => el('button', { class: cls, 'aria-label': label }, icon(ic));
  const bClose = mk('close', 'Close', ICON.close), bPrev = mk('prev', 'Previous photo', ICON.chevron), bNext = mk('next', 'Next photo', ICON.chevron);
  const vw = el('div', { class: 'viewer', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Clinic photos' }, count, frame, bClose, bPrev, bNext);
  document.body.append(vw);
  let cur = 0;
  const show = i => { cur = (i + labels.length) % labels.length; frame.dataset.label = labels[cur]; count.textContent = `${cur + 1} / ${labels.length}`; };
  const close = () => vw.classList.remove('is-open');
  photos.forEach((p, i) => { p.style.cursor = 'zoom-in'; p.addEventListener('click', () => { show(i); vw.classList.add('is-open'); bClose.focus(); }); });
  bClose.addEventListener('click', close); bPrev.addEventListener('click', () => show(cur - 1)); bNext.addEventListener('click', () => show(cur + 1));
  vw.addEventListener('click', e => { if (e.target === vw) close(); });
  addEventListener('keydown', e => { if (!vw.classList.contains('is-open')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') show(cur + 1); if (e.key === 'ArrowLeft') show(cur - 1); });
}

/* ---------- booked page: share and calendar ---------- */
if (page === 'booked') {
  const [cal, , share] = $$('.acts button, .acts a.btn--ghost').filter(b => b.tagName === 'BUTTON' || b.textContent.includes('Directions'));
  const text = 'Physio visit at J.P. Nagar Physio, Arekere MICO Layout: today 6:00 pm. Booking JP-ARK-2210-1800.';
  share?.addEventListener('click', async () => {
    try { if (navigator.share) { await navigator.share({ title: 'Physio appointment', text }); return; } } catch (_) { return; }
    try { await navigator.clipboard.writeText(text); toast('Booking details copied'); } catch (_) { toast(text); }
  });
  cal?.addEventListener('click', () => toast('In the real site this downloads a calendar file'));
}
