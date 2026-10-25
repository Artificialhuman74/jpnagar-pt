// Team: the cards are built from TEAM (the published doctors), so a change made in the admin shows here after Publish.
// The first doctor leads the page; the others get cards that turn over for their details. Qualifications explain
// themselves on hover or focus; "Know more" opens the full profile beside the page. Loaded before tilt.js, which then
// sets the cards up.
const shine = () => ['glare', 'rim', 'edge'].map(k => el('span', { class: `tilted-card__${k}`, 'aria-hidden': 'true' }));
const roleLine = t => t.role + (t.years ? ` · ${t.years}` : '');
function portrait(t, label) {
  const p = el('div', { class: 'tilted-card__img photo', style: '--tc-depth:-24', role: 'img', 'aria-label': `Portrait of ${t.short}, to be shot`, 'data-label': label || null });
  if (t.photo) paintPhoto(p, t.photo);
  return p;
}
function leadDoc(t) {
  return [
    el('figure', { class: 'tilted-card', 'data-tilt': '8' }, el('div', { class: 'tilted-card__shadow', 'aria-hidden': 'true' }),
      el('div', { class: 'tilted-card__body', style: '--tc-radius:32px' }, el('div', { class: 'tilted-card__face tilted-card__front' }, portrait(t, `Portrait: ${t.short} (to be shot)`), ...shine()))),
    el('div', {}, el('h2', { class: 'h2', id: 'doc-0' }, t.name), el('p', { class: 'role' }, roleLine(t)), degChips(t.deg, true),
      el('div', { class: 'cols2' }, el('div', {}, el('h3', {}, 'Treats'), tickList(t.treat)), el('div', {}, el('h3', {}, 'Background'), tickList(t.bg))),
      el('div', { class: 'acts-row' }, el('a', { class: 'btn btn--act', href: 'book.html?therapist=0' }, el('span', {}, `Book with ${t.short}`), el('i', { class: 'arrow', 'data-icon': 'arrow' })),
        el('a', { class: 'btn btn--line', href: 'branches.html' }, 'Find a branch')))];
}
// the back of a card has room for two lines of each; "Know more" shows them all
function profCard(t, i) {
  return el('figure', { class: 'tilted-card prof-card', 'data-tilt': '', 'aria-label': `${t.name}: turn the card for details` },
    el('div', { class: 'tilted-card__shadow', 'aria-hidden': 'true' }),
    el('div', { class: 'tilted-card__body' },
      el('div', { class: 'tilted-card__face tilted-card__front' }, portrait(t), el('div', { class: 'tc-scrim', 'aria-hidden': 'true' }),
        el('div', { class: 'tilted-card__layer', style: '--tc-depth:30' }, el('div', { class: 'tc-name' }, el('h2', { id: `doc-${i}` }, t.name), el('p', {}, roleLine(t)),
          el('button', { class: 'tc-flip', type: 'button', 'data-flip': '' }, el('i', { 'data-icon': 'turn' }), 'Turn over for details'))), ...shine()),
      el('div', { class: 'tilted-card__face tilted-card__back' },
        el('div', { class: 'tc-back' }, el('button', { class: 'tc-turn', type: 'button', 'data-flip': '', 'aria-label': 'Turn back to the photo' }, el('i', { 'data-icon': 'turn' })),
          el('h3', {}, t.name), el('p', { class: 'role' }, roleLine(t)), degChips(t.deg, true),
          el('h4', {}, 'Treats'), tickList(t.treat.slice(0, 2)), el('h4', {}, 'Background'), tickList(t.bg.slice(0, 2)),
          el('div', { class: 'acts-row' }, el('a', { class: 'btn btn--act btn--sm', href: `book.html?therapist=${i}` }, `Book with ${t.first}`),
            el('button', { class: 'btn btn--line btn--sm', type: 'button', 'data-more': String(i) }, 'Know more'))), ...shine())),
    el('figcaption', { class: 'tilted-card__caption', 'aria-hidden': 'true' }, 'Click to turn over'));
}
$('[data-lead]').replaceChildren(...(TEAM[0] ? leadDoc(TEAM[0]) : []));
$('[data-profs]').replaceChildren(...TEAM.slice(1).map((t, j) => profCard(t, j + 1)));
paintIcons();

function openProfile(i, opener) {
  const t = TEAM[i];
  if (!t) return;
  if (opener) opener.focus();
  drawer.open(t.name, profile(t, el('a', { class: 'btn btn--act btn--block', href: `book.html?therapist=${i}` }, `Book with ${t.short}`)));
}
$$('[data-more]').forEach(b => b.addEventListener('click', () => openProfile(+b.dataset.more, b)));
// links from other pages can open a profile straight away: team.html?open=2
const openIdx = new URLSearchParams(location.search).get('open');
if (openIdx !== null) openProfile(+openIdx);
