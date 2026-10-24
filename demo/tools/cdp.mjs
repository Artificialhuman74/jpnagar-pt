// Drives the headless Chrome on port 9333: for each job, size the viewport, load the page, run a script, screenshot.
// usage: node cdp.mjs jobs.json   (jobs: [{ url, w, h, wait, js, out }])
import { readFileSync, writeFileSync } from 'node:fs';
const jobs = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const list = await (await fetch('http://127.0.0.1:9333/json/list')).json();
let page = list.find(t => t.type === 'page');
if (!page) page = await (await fetch('http://127.0.0.1:9333/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const waiting = new Map(), events = [];
ws.addEventListener('message', m => { const d = JSON.parse(m.data); if (d.id && waiting.has(d.id)) { waiting.get(d.id)(d); waiting.delete(d.id); } else if (d.method) events.push(d); });
const send = (method, params = {}) => new Promise(r => { const i = ++id; waiting.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
if (process.env.CPU) await send('Emulation.setCPUThrottlingRate', { rate: +process.env.CPU });
const out = [];
for (const j of jobs) {
  await send('Emulation.setDeviceMetricsOverride', { width: j.w, height: j.h, deviceScaleFactor: 1, mobile: j.w < 600 });
  events.length = 0;
  await send('Page.navigate', { url: j.url });
  for (let t = 0; t < 100 && !events.some(e => e.method === 'Page.loadEventFired'); t++) await sleep(100);
  await sleep(j.wait ?? 1500);
  let result = null;
  if (j.js) { const r = await send('Runtime.evaluate', { expression: `(async () => { ${j.js} })()`, awaitPromise: true, returnByValue: true }); result = r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description ?? null; }
  const errors = events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception?.description?.split('\n')[0]);
  if (j.out) { const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(j.out, Buffer.from(s.result.data, 'base64')); }
  out.push({ url: j.url, result, errors });
}
console.log(JSON.stringify(out, null, 1));
ws.close();
