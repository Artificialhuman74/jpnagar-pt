// Booked: the ticket prints, gets stamped and shines; then WhatsApp, calendar, directions, print and share.
// Opened on its own (no booking handed over), it shows a sample booking.
ensureFigDefs();
function sampleBooking() {
  const b = BRANCHES[0], day = firstOpenDay(b), free = freeSlots(b, day), s = free.find(x => x.t >= 18) || free[0];
  return { id: bookingId(b, day, s.t), b: b.id, day: dayISO(day), t: s.t, ther: 2, gender: 'male', areas: ['lower~back', 'knee-right~back'], reasons: [], service: null,
    story: 'Lower back pain for two weeks after lifting a heavy box.', name: 'Priya Raman', phone: '9876543210', email: '' };
}
const saved = loadBooking();
const B = saved && fromISO(saved.day) ? saved : sampleBooking();
const br = BRANCHES.find(x => x.id === B.b) || BRANCHES[0], day = fromISO(B.day), when = timeText(B.t), [hm, ampm] = when.split(' ');
const ther = TEAM[B.ther] ? TEAM[B.ther].short : 'Any available';
const first = B.name.split(' ')[0];
const dayWords = isToday(day) ? 'today' : `on ${DAYS[day.getDay()]} ${day.getDate()} ${MONTHS[day.getMonth()]}`;
const set = (sel, text) => { $(sel).textContent = text; };

set('[data-hello]', `You’re booked, ${first}.`);
set('[data-see]', `See you ${dayWords} at ${when} at ${br.short}. Your ticket is ready.`);
set('[data-arrive]', `Arrive by ${arriveBy(B.t)}`);
set('[data-first]', `Assessment and your first treatment${TEAM[B.ther] ? ` with ${ther}` : ''}.`);

/* ---------- the ticket ---------- */
set('[data-tk-id]', B.id); set('[data-tk-id2]', B.id);
set('[data-tk-day]', dayLong(day));
set('[data-tk-time]', hm); set('[data-tk-ampm]', ampm);
set('[data-tk-branch]', br.name); set('[data-tk-landmark]', br.landmark);
set('[data-tk-ther]', ther); set('[data-tk-arrive]', arriveBy(B.t));
set('[data-tk-name]', B.name); set('[data-tk-phone]', `+91 ${B.phone.slice(0, 5)} ${B.phone.slice(5)}`);
const svc = SERVICES.find(s => s.id === B.service);
const labels = B.areas.map(labelOf).concat(B.reasons.map(r => REASON[r]), svc ? [svc.name] : []);
$('[data-tk-figs]').replaceChildren(miniFigure(B.gender, 'front', B.areas), miniFigure(B.gender, 'back', B.areas));
$('[data-tk-hurt]').classList.toggle('no-figs', !B.areas.length);
$('[data-tk-chips]').replaceChildren(...(labels.length ? labels : ['To be assessed at your visit']).map(l => el('span', {}, l)));
const note = $('[data-tk-note]'); note.hidden = !B.story; note.textContent = B.story;
set('[data-tk-stamp]', `${pad(day.getDate())} ${MONTHS[day.getMonth()].toUpperCase()}`);
drawBarcode($('[data-tk-bar]'), B.id);

/* ---------- actions ---------- */
const forText = labels.length ? labels.join(', ') : 'Not sure yet';
const msg = `Hello, I booked a visit at ${br.name} ${dayWords} at ${when} (booking ${B.id}).\nFor: ${forText}${B.story ? `\nWhat happened: ${B.story}` : ''}\nPhysiotherapist: ${ther}\nName: ${B.name}`;
$('[data-wa]').href = `${WA}?text=${encodeURIComponent(msg)}`;
$('[data-dir]').href = mapsLink(br);
const shareText = `Physio visit at J.P. Nagar Physio, ${br.name}: ${dayWords}, ${when}. Booking ${B.id}.`;
$('[data-share]').addEventListener('click', async () => {
  try { if (navigator.share) { await navigator.share({ title: 'Physio appointment', text: shareText }); return; } } catch (_) { return; }
  try { await navigator.clipboard.writeText(shareText); toast('Booking details copied'); } catch (_) { toast(shareText); }
});
$('[data-print]').addEventListener('click', () => print());
$('[data-ics]').addEventListener('click', () => {
  const stamp = t => { const h = Math.floor(t), m = Math.round((t - h) * 60); return `${day.getFullYear()}${pad(day.getMonth() + 1)}${pad(day.getDate())}T${pad(h)}${pad(m)}00`; };
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//JPN Physio//Booking//EN', 'BEGIN:VEVENT', `UID:${B.id}@jpnagarphysio`,
    `DTSTART;TZID=Asia/Kolkata:${stamp(B.t)}`, `DTEND;TZID=Asia/Kolkata:${stamp(B.t + .75)}`,
    `SUMMARY:Physiotherapy at ${br.short}`, `LOCATION:J.P. Nagar Medical & Physiotherapy Centre\\, ${br.name}\\, Bengaluru`,
    `DESCRIPTION:Booking ${B.id}. Call ${PHONE} to change or cancel.`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = el('a', { href: URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })), download: 'physio-visit.ics' });
  document.body.append(a); a.click(); a.remove(); toast('Calendar file downloaded');
});

/* ---------- print → stamp → shine ---------- */
requestAnimationFrame(() => {
  fitNotches($('[data-tk]'));
  const wrap = $('[data-wrap]'); wrap.classList.remove('go'); void wrap.offsetWidth; wrap.classList.add('go');
});
