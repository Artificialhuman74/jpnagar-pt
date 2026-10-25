// Team: qualifications explain themselves on hover or focus; "Know more" opens the full profile beside the page.
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
