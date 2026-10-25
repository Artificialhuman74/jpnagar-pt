// The clinic's data and the helpers both builds share: branches and their hours (IST), free times, distances, maps,
// and the ticket's barcode. Loaded before each build's app.js; published.js then lays the published content over it.
// Functions that build page elements (mapEmbed) use the el() each build's app.js defines, at the time they're called.

/* ---------- clinic data (same sample set as the mobile demo) ---------- */
// Coordinates are approximate locality pins until the clinic confirms exact ones.
const BRANCHES = [
  { id: 'arekere', plus: '7J4VVHQR+7X', code: 'ARK', name: 'Arekere MICO Layout', short: 'Arekere', sessions: [[9, 13], [16, 21]], lat: 12.8886, lng: 77.6022,
    addr: 'No. 129, 1st Floor, Lakshmi Nivas, 3rd Cross, near L&T South City, Bannerghatta Main Rd, Arekere MICO Layout 2nd Stage, Bengaluru 560076',
    phone: '+918026489922', phoneText: '080 2648 9922', landmark: 'Near L&T South City' },
  { id: 'bannerghatta', plus: '7J4VVHFV+W6', code: 'BGR', name: 'Bannerghatta Road', short: 'Bannerghatta', sessions: [[8, 12], [16, 20]], lat: 12.8775, lng: 77.5975,
    addr: 'No. 22, 1st Floor, above Greens Vegetable Shop, behind Meenakshi Temple, Classic Orchards Layout, Kalena Agrahara, Bengaluru 560076',
    phone: '+919916116625', phoneText: '+91 99161 16625', landmark: 'Behind Meenakshi Temple' },
  { id: 'jpnagar', plus: '7J4VVHXJ+2X', code: 'JPN', name: 'JP Nagar 7th Phase', short: 'JP Nagar', sessions: [[9, 13], [17, 21]], lat: 12.8937, lng: 77.5855,
    addr: 'No. 2/8, 1st Floor, Puttenahalli Rd, opp. Govt. Primary School, JP Nagar 7th Phase, Bengaluru 560078',
    phone: '+918026656988', phoneText: '080 2665 6988', landmark: 'Opposite Govt. Primary School' }
];

const AREAS = [
  ['JP Nagar', 12.9063, 77.5857, '560078'], ['Arekere', 12.8869, 77.5998, '560076'], ['Hulimavu', 12.8775, 77.6011, '560076'], ['BTM Layout', 12.9166, 77.6101, '560068'],
  ['Bannerghatta Road', 12.8890, 77.5970, '560076'], ['Gottigere', 12.8569, 77.5880, '560083'], ['Jayanagar', 12.9299, 77.5824, '560041'], ['Bilekahalli', 12.8986, 77.6050, '560076']
];

const DEGREES = {
  MPT: 'Master of Physiotherapy', BPT: 'Bachelor of Physiotherapy', COMT: 'Certified Orthopaedic Manual Therapist',
  MIAP: 'Member, Indian Association of Physiotherapists', 'MD(A.M)': 'MD in Alternative Medicine', 'D.ACU': 'Diploma in Acupuncture'
};

/* ---------- time in India (?t=16:40 pins the clock for demos) ---------- */
const DEMO_T = new URLSearchParams(location.search).get('t');

const pad = n => String(n).padStart(2, '0');

function nowIST() {
  const d = new Date(), ist = new Date(d.getTime() + (330 + d.getTimezoneOffset()) * 60000);
  // the pinned demo clock (?t=16:40) is ignored on WordPress, where the diary keeps the real time
  if (DEMO_T && !window.JPN_API) { const [h, m] = DEMO_T.split(':').map(Number); ist.setHours(h, m || 0, 0, 0); }
  return ist;
}

function sameDay(a, b) { return !!a && !!b && a.toDateString() === b.toDateString(); }

function fmtHour(h) { const hh = Math.floor(h), m = Math.round((h - hh) * 60), p = hh >= 12 ? 'pm' : 'am', x = hh % 12 || 12; return m ? `${x}:${pad(m)} ${p}` : `${x} ${p}`; }

// A branch's hours on a day (Sunday is 0), as [[from, to], ...] in hours: that weekday's own hours when the clinic has
// set them (b.week, copied in by published.js), else its usual sessions on the days it works (Mon–Sat until told).
// Takes a date or a day number.
function sessionsOn(b, d) {
  const n = typeof d === 'number' ? d : d.getDay();
  if (b.week) return b.week[n] || [];
  return (b.days || [1, 2, 3, 4, 5, 6]).includes(n) ? b.sessions : [];
}

function worksOn(b, d) { return sessionsOn(b, d).length > 0; }

const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// the next day the branch works, as words ("tomorrow", or the weekday) and that day's first opening hour
function nextOpen(b, d) {
  for (let i = 1; i <= 7; i++) { const x = new Date(d); x.setDate(d.getDate() + i); const s = sessionsOn(b, x); if (s.length) return { when: i === 1 ? 'tomorrow' : DOW_SHORT[x.getDay()], at: s[0][0] }; }
  return null;
}

const sessText = list => list.map(([s, e]) => `${fmtHour(s)}–${fmtHour(e)}`).join(', ');

// the week in one line, days with the same hours grouped: "Mon–Sat · 9 am–1 pm, 4 pm–8 pm" or
// "Mon–Fri · 9 am–1 pm, 4 pm–9 pm; Sat · 9 am–1 pm"
function weekText(b) {
  const groups = [];
  [1, 2, 3, 4, 5, 6, 0].forEach(n => {
    const s = sessionsOn(b, n), key = JSON.stringify(s), last = groups[groups.length - 1];
    if (!s.length) return;
    if (last && last.key === key && last.to === (n + 6) % 7) last.to = n; else groups.push({ key, from: n, to: n, s });
  });
  return groups.map(g => `${g.from === g.to ? DOW_SHORT[g.from] : `${DOW_SHORT[g.from]}–${DOW_SHORT[g.to]}`} · ${sessText(g.s)}`).join('; ') || 'Closed';
}

function branchStatus(b, d = nowIST()) {
  const h = d.getHours() + d.getMinutes() / 60;
  if (worksOn(b, d)) {
    for (const [s, e] of sessionsOn(b, d)) if (h >= s && h < e) return { open: true, text: `Open now · till ${fmtHour(e)}` };
    for (const [s] of sessionsOn(b, d)) if (h < s) return { open: false, text: `Opens ${fmtHour(s)} today` };
  }
  const nx = nextOpen(b, d);
  return { open: false, text: nx ? `Closed · opens ${nx.when} ${fmtHour(nx.at)}` : 'Closed' };
}

function hash(s) { let x = 0; for (const c of s) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x; }

// Slots every 30 minutes; some marked taken (sample data); past times today are left out.
function slotsFor(b, day, si) {
  const ss = sessionsOn(b, day); if (!ss[si]) return [];
  const [s, e] = ss[si], now = nowIST(), today = sameDay(day, now), out = [];
  // one time per appointment length (the clinic sets it; half an hour until it says otherwise)
  const step = (b.slot || 30) / 60;
  for (let t = s; t + step <= e + 1e-6; t = +(t + step).toFixed(4)) {
    if (today && t <= now.getHours() + now.getMinutes() / 60 + .25) continue;
    const hh = Math.floor(t) % 12 || 12, mm = String(Math.round((t % 1) * 60)).padStart(2, '0');
    out.push({ t, label: `${hh}:${mm}`, suffix: t >= 12 ? 'pm' : 'am', taken: hash(b.id + day.toDateString() + t) % 4 === 0 });
  }
  return out;
}

function savedKm() { try { return JSON.parse(sessionStorage.getItem('jp-km') || 'null'); } catch (_) { return null; } }

function saveKm(km) { try { sessionStorage.setItem('jp-km', JSON.stringify(km)); } catch (_) {} }

function kmText(b) { const k = savedKm(); return k && k[b.id] != null ? `${k[b.id].toFixed(1)} km` : ''; }

// The branch booking starts at: the nearest once the visitor has shared where they are (never guessed), else JP Nagar,
// then Bannerghatta, then Arekere.
const PREFERRED = ['jpnagar', 'bannerghatta', 'arekere'];

function nearestIndex() {
  const k = savedKm();
  if (!k) { const i = PREFERRED.map(id => BRANCHES.findIndex(b => b.id === id)).find(x => x >= 0); return i === undefined ? 0 : i; }
  return BRANCHES.reduce((best, b, i) => (k[b.id] < k[BRANCHES[best].id] ? i : best), 0);
}

// Asks the browser where the visitor is (only when they tap to), keeps each branch's distance for the visit, and
// resolves to the nearest branch's index; rejects with a message to show if it can't.
function locateNearest() {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) { rej('Location isn’t available on this device. Pick your branch instead.'); return; }
    navigator.geolocation.getCurrentPosition(p => {
      saveKm(Object.fromEntries(BRANCHES.map(b => [b.id, kmBetween(p.coords.latitude, p.coords.longitude, b.lat, b.lng)])));
      res(nearestIndex());
    }, e => rej(e.code === 1 ? 'Location is off for this site. Pick your branch instead.' : 'Couldn’t find where you are. Pick your branch instead.'),
    { timeout: 10000, maximumAge: 600000 });
  });
}

function kmBetween(a, b, c, d) {
  const r = x => x * Math.PI / 180, h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

// What Google Maps searches for a branch: its plus code, an exact spot (the clinic's name alone matches all three
// branches, and some addresses still match several); without a code, the clinic's name and the branch's address.
const mapQuery = b => b && b.plus ? b.plus : `J.P. Nagar Medical and Physiotherapy Centre, ${b ? b.addr || b.name : 'Bengaluru'}`;

function mapsLink(b) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery(b))}`; }

// A real Google map in the page (Google's own embed, no key needed), loaded only once it scrolls near: one branch, or
// with none, the clinic's branches.
function mapEmbed(b, title) {
  const f = el('iframe', { class: 'gmap is-loading', src: `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery(b))}&z=${b ? 16 : 13}&output=embed`,
    title: title || (b ? `Map: ${b.name}` : 'Map of our three branches'), loading: 'lazy', referrerpolicy: 'no-referrer-when-downgrade' });
  // the box pulses until Google's map has arrived, then the map fades in (see .gmap in base.css)
  f.addEventListener('load', () => f.classList.remove('is-loading'), { once: true });
  return f;
}

/* ---------- ticket bits shared by the booking preview and the printed ticket ---------- */
function bookingId(b, day, t) { const h = Math.floor(t), m = Math.round((t % 1) * 60); return `JP-${b.code}-${pad(day.getDate())}${pad(day.getMonth() + 1)}-${pad(h)}${pad(m)}`; }

// Code 128 (set B), so the stub carries a real barcode of the booking ID
const C128 = ['212222','222122','222221','121223','121322','131222','122213','122312','132212','221213','221312','231212','112232','122132','122231','113222','123122','123221','223211','221132','221231','213212','223112','312131','311222','321122','321221','312212','322112','322211','212123','212321','232121','111323','131123','131321','112313','132113','132311','211313','231113','231311','112133','112331','132131','113123','113321','133121','313121','211331','231131','213113','213311','213131','311123','311321','331121','312113','312311','332111','314111','221411','431111','111224','111422','121124','121421','141122','141221','112214','112412','122114','122411','142112','142211','241211','221114','413111','241112','134111','111242','121142','121241','114212','124112','124211','411212','421112','421211','212141','214121','412121','111143','111341','131141','114113','114311','411113','411311','113141','114131','311141','411131','211412','211214','211232','2331112'];

function drawBarcode(svg, text) {
  const vals = [104, ...[...text].map(c => c.charCodeAt(0) - 32)];
  const check = vals.reduce((sum, v, i) => sum + v * (i || 1), 0) % 103;
  const widths = [...vals, check, 106].map(v => C128[v]).join(''), quiet = 10, bars = [];
  let x = quiet;
  [...widths].forEach((w, i) => {
    if (i % 2 === 0) { const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); [['x', x], ['y', 0], ['width', +w], ['height', 48]].forEach(([k, v]) => r.setAttribute(k, v)); bars.push(r); }
    x += +w;
  });
  svg.setAttribute('viewBox', `0 0 ${x + quiet} 48`); svg.setAttribute('preserveAspectRatio', 'none');
  svg.replaceChildren(...bars);
}
