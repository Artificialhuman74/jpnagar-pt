// Bridges the mobile site to the shared engines in ../desktop (anatomy.js, scenes.js, tilt.js, carousel.js): the
// drawing helpers they expect, defined exactly as on the desktop site. The body figure is ../canon/figure.js.
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

