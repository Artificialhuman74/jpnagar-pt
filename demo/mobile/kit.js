// Bridges the mobile site to the shared engines in ../desktop (anatomy.js, scenes.js, tilt.js, carousel.js): the
// drawing helpers and the 2D body figure they expect, defined exactly as on the desktop site.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
function svgNodes(markup) {
  const doc = parser.parseFromString(`<svg xmlns="${NS}">${markup}</svg>`, 'image/svg+xml');
  return [...doc.documentElement.childNodes].map(n => document.importNode(n, true));
}
function svgEl(attrs, markup = '') {
  const s = document.createElementNS(NS, 'svg');
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  s.append(...svgNodes(markup));
  return s;
}

/* ---------- the body figure (2D, front and back; male and female) ---------- */
const FIG_DEFS = `
<linearGradient id="skin" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="480"><stop offset="0" stop-color="#F1F3F9"/><stop offset="1" stop-color="#D9DDEA"/></linearGradient>
<linearGradient id="hair" gradientUnits="userSpaceOnUse" x1="0" y1="10" x2="0" y2="96"><stop offset="0" stop-color="#C3C8D9"/><stop offset="1" stop-color="#AEB4C9"/></linearGradient>
<filter id="vol" x="-15%" y="-8%" width="130%" height="116%" color-interpolation-filters="sRGB">
<feOffset in="SourceAlpha" dx="-7" dy="-5"/><feGaussianBlur stdDeviation="7" result="ob"/>
<feComposite in="SourceAlpha" in2="ob" operator="out" result="shadeMask"/>
<feFlood flood-color="#2B3192" flood-opacity=".2"/><feComposite in2="shadeMask" operator="in" result="shade"/>
<feOffset in="SourceAlpha" dx="5" dy="4"/><feGaussianBlur stdDeviation="5" result="hb"/>
<feComposite in="SourceAlpha" in2="hb" operator="out" result="hiMask"/>
<feFlood flood-color="#FFFFFF" flood-opacity=".9"/><feComposite in2="hiMask" operator="in" result="hi"/>
<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="shade"/><feMergeNode in="hi"/></feMerge>
</filter>
<g id="m-body"><ellipse cx="120" cy="42" rx="22" ry="28"/><ellipse cx="97.5" cy="45" rx="4" ry="7"/><ellipse cx="142.5" cy="45" rx="4" ry="7"/><path d="M110 64 L130 64 L133 88 L107 88 Z"/><path d="M107 86 C96 89 80 91 72 98 C66 104 66 114 70 124 L77 148 C81 164 85 174 86 182 C84 196 81 210 82 224 L120 246 L158 224 C159 210 156 196 154 182 C155 174 159 164 163 148 L170 124 C174 114 174 104 168 98 C160 91 144 89 133 86 Z"/><path d="M70 101 C60 114 56 140 56 170 C54 196 51 218 48 240 L61 242 C64 220 67 198 70 176 C73 152 77 132 80 122 Z"/><path d="M170 101 C180 114 184 140 184 170 C186 196 189 218 192 240 L179 242 C176 220 173 198 170 176 C167 152 163 132 160 122 Z"/><ellipse cx="54" cy="256" rx="8.5" ry="16" transform="rotate(8 54 256)"/><ellipse cx="186" cy="256" rx="8.5" ry="16" transform="rotate(-8 186 256)"/><path d="M82 216 C78 262 82 298 86 330 C88 362 90 396 92 428 L106 428 C106 396 108 362 110 330 C114 300 119 276 119 244 Z"/><path d="M158 216 C162 262 158 298 154 330 C152 362 150 396 148 428 L134 428 C134 396 132 362 130 330 C126 300 121 276 121 244 Z"/></g>
<path id="m-hair" d="M97 44 C95 12 145 12 143 44 C143 56 139 65 133 70 L107 70 C101 65 97 56 97 44 Z"/>
<path id="m-fringe" d="M98 40 C97 13 143 13 142 40 C137 29 129 25 120 25 C111 25 103 29 98 40 Z"/>
<g id="f-body"><ellipse cx="120" cy="43" rx="20" ry="27"/><ellipse cx="100" cy="46" rx="3.5" ry="6"/><ellipse cx="140" cy="46" rx="3.5" ry="6"/><path d="M112 64 L128 64 L130 88 L110 88 Z"/><path d="M110 86 C100 89 88 91 81 98 C76 104 76 114 79 124 L85 148 C89 162 92 170 92 178 C89 194 80 208 78 222 L120 248 L162 222 C160 208 151 194 148 178 C148 170 151 162 155 148 L161 124 C164 114 164 104 159 98 C152 91 140 89 130 86 Z"/><path d="M79 101 C70 116 66 142 66 170 C64 196 61 218 58 240 L70 242 C73 220 76 198 78 176 C81 152 84 134 87 122 Z"/><path d="M161 101 C170 116 174 142 174 170 C176 196 179 218 182 240 L170 242 C167 220 164 198 162 176 C159 152 156 134 153 122 Z"/><ellipse cx="63" cy="256" rx="7.5" ry="14.5" transform="rotate(8 63 256)"/><ellipse cx="177" cy="256" rx="7.5" ry="14.5" transform="rotate(-8 177 256)"/><path d="M78 218 C73 264 79 300 87 332 C89 364 92 398 94 428 L106 428 C106 398 108 364 110 332 C114 302 119 280 119 248 Z"/><path d="M162 218 C167 264 161 300 153 332 C151 364 148 398 146 428 L134 428 C134 398 132 364 130 332 C126 302 121 280 121 248 Z"/></g>
<path id="f-hair" d="M99 44 C97 13 143 13 141 44 C142 62 146 80 149 92 C146 99 135 102 120 102 C105 102 94 99 91 92 C94 80 98 62 99 44 Z"/>
<path id="f-fringe" d="M100 42 C99 15 141 15 140 42 C136 31 130 27 122 27 C114 30 106 33 100 42 Z"/>`;
function ensureFigDefs() {
  if ($('#fig-defs')) return;
  document.body.prepend(svgEl({ id: 'fig-defs', width: '0', height: '0', 'aria-hidden': 'true', focusable: 'false', style: 'position:absolute' }, `<defs>${FIG_DEFS}</defs>`));
}
const LINES = 'fill="none" stroke="#B2B8CC" stroke-width="1.5" stroke-linecap="round"';
const FIG = {
  male: {
    front: `<use filter="url(#vol)" fill="url(#hair)" href="#m-hair"/><g filter="url(#vol)" fill="url(#skin)"><use href="#m-body"/><ellipse cx="97" cy="438" rx="13" ry="9"/><ellipse cx="143" cy="438" rx="13" ry="9"/></g><use filter="url(#vol)" fill="url(#hair)" href="#m-fringe"/><g ${LINES}><path d="M104 93 C96 96 86 97 79 99"/><path d="M136 93 C144 96 154 97 161 99"/><path d="M90 130 C100 142 113 142 119 135"/><path d="M150 130 C140 142 127 142 121 135"/><path d="M120 150 L120 176"/><path d="M92 214 C104 226 114 238 120 244"/><path d="M148 214 C136 226 126 238 120 244"/><path d="M92 327 C95 320 104 320 106 328"/><path d="M148 327 C145 320 136 320 134 328"/></g>`,
    back: `<g filter="url(#vol)" fill="url(#skin)"><use href="#m-body"/><ellipse cx="99" cy="434" rx="9" ry="8"/><ellipse cx="141" cy="434" rx="9" ry="8"/></g><use filter="url(#vol)" fill="url(#hair)" href="#m-hair"/><g ${LINES}><path d="M120 90 L120 210" stroke-dasharray="2 5"/><path d="M96 110 C91 122 93 136 104 144"/><path d="M144 110 C149 122 147 136 136 144"/><path d="M120 218 L120 240"/><path d="M88 236 C95 249 111 251 119 243"/><path d="M152 236 C145 249 129 251 121 243"/><path d="M93 334 C97 337 103 337 107 334"/><path d="M147 334 C143 337 137 337 133 334"/></g>`
  },
  female: {
    front: `<use filter="url(#vol)" fill="url(#hair)" href="#f-hair"/><g filter="url(#vol)" fill="url(#skin)"><use href="#f-body"/><ellipse cx="99" cy="438" rx="11" ry="8"/><ellipse cx="141" cy="438" rx="11" ry="8"/></g><use filter="url(#vol)" fill="url(#hair)" href="#f-fringe"/><g ${LINES}><path d="M108 93 C100 96 92 97 86 99"/><path d="M132 93 C140 96 148 97 154 99"/><path d="M93 130 C98 145 112 147 118 138"/><path d="M147 130 C142 145 128 147 122 138"/><path d="M90 214 C103 228 114 240 120 248"/><path d="M150 214 C137 228 126 240 120 248"/><path d="M93 329 C96 322 104 322 106 330"/><path d="M147 329 C144 322 136 322 134 330"/></g>`,
    back: `<g filter="url(#vol)" fill="url(#skin)"><use href="#f-body"/><ellipse cx="100" cy="434" rx="8" ry="7"/><ellipse cx="140" cy="434" rx="8" ry="7"/></g><use filter="url(#vol)" fill="url(#hair)" href="#f-hair"/><g ${LINES}><path d="M120 104 L120 210" stroke-dasharray="2 5"/><path d="M100 112 C96 122 98 134 106 142"/><path d="M140 112 C144 122 142 134 134 142"/><path d="M120 220 L120 243"/><path d="M84 236 C92 252 110 254 119 246"/><path d="M156 236 C148 252 130 254 121 246"/><path d="M94 336 C98 339 103 339 107 336"/><path d="M146 336 C142 339 137 339 133 336"/></g>`
  }
};
// hotspots: [type, viewer side]; "a" is the viewer's left
const REGIONS = [['neck'], ['shoulder', 'a'], ['shoulder', 'b'], ['upper'], ['lower'], ['elbow', 'a'], ['elbow', 'b'], ['hand', 'a'], ['hand', 'b'], ['hip', 'a'], ['hip', 'b'], ['knee', 'a'], ['knee', 'b'], ['foot', 'a'], ['foot', 'b']];
const POS = {
  male: { neck: [120, 78], shoulder: [74, 106], upper: [120, 134], lower: [120, 194], elbow: [58, 174], hand: [54, 256], hip: [94, 226], knee: [97, 328], foot: [98, 434] },
  female: { neck: [120, 78], shoulder: [82, 106], upper: [120, 136], lower: [120, 196], elbow: [67, 174], hand: [63, 256], hip: [90, 228], knee: [98, 330], foot: [99, 434] }
};
function spotXY(gender, type, pos) { let [x, y] = POS[gender][type]; if (pos === 'b') x = 240 - x; return [x, y]; }
