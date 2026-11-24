// Perbandingan piksel: board mockup (dirender dari sumber .dc.html) vs aplikasi, ukuran 390x844 @1x.
// Pakai: node tools/pixel/run.mjs [id ...]      (tanpa id = semua skenario)   atau   npm run pixel
// Keluaran: .pixel/out/<id>.board.png, .app.png, .diff.png dan ringkasan di layar. Butuh Chrome dan Python (PIL, numpy).
import { spawn, execFileSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { scenarios } from './scenarios.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(root, '.pixel/out'), FARM = path.join(root, '.pixel/farm'), PROFILE = path.join(root, '.pixel/profile');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const MAX_RASIO = Number(process.env.PIXEL_MAX || 0.003); // 0,3% piksel beda = batas lulus
const W = 390, H = 844;

// Siapkan folder board: sumber .dc.html + runtime (support.js, token dan komponen) dari reference/mockups.
fs.rmSync(FARM, { recursive: true, force: true }); fs.mkdirSync(FARM, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(path.join(root, 'reference/mockups/src'), FARM, { recursive: true });
fs.cpSync(path.join(root, 'reference/mockups/runtime'), FARM, { recursive: true }); // runtime menang atas salinan lama

// Font yang sama dengan aplikasi (ditanam), supaya board tidak bergantung pada jaringan.
const fontCss = [400, 500, 600, 700, 800].map((w) => {
  const b64 = fs.readFileSync(path.join(root, `src/web/fonts/plus-jakarta-sans-latin-${w}-normal.woff2`)).toString('base64');
  return `@font-face{font-family:"Plus Jakarta Sans";font-style:normal;font-weight:${w};src:url(data:font/woff2;base64,${b64}) format("woff2");}`;
}).join('');
const fontScript = `document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent=${JSON.stringify(fontCss)};document.head.appendChild(s);});`;

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); const [, area, ...rest] = u.pathname.split('/');
  const base = area === 'farm' ? FARM : path.join(root, 'dist');
  const file = path.join(base, rest.join('/') || 'index.html');
  if (!file.startsWith(base) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' }); res.end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9333', `--user-data-dir=${PROFILE}`, '--no-first-run', '--hide-scrollbars', '--disable-gpu', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 50; i++) { try { await fetch('http://127.0.0.1:9333/json/version'); break; } catch { await sleep(200); } }

async function newPage() {
  const t = await (await fetch('http://127.0.0.1:9333/json/new?about:blank', { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, (m) => (m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result))); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Network.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await send('Network.setBlockedURLs', { urls: ['*fonts.googleapis.com*', '*fonts.gstatic.com*'] });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: fontScript });
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
    return r.result.value;
  };
  const go = async (url) => { await send('Page.navigate', { url }); for (let i = 0; i < 60; i++) { if ((await ev('document.readyState')) === 'complete') break; await sleep(100); } };
  const close = async () => { ws.close(); await fetch(`http://127.0.0.1:9333/json/close/${t.id}`).catch(() => {}); };
  return { send, ev, go, close };
}

/** Bekukan gerak: animasi sekali jalan diselesaikan, yang berulang dihentikan di awal; lepas fokus. */
const settle = `(async()=>{await document.fonts.ready;await new Promise(r=>setTimeout(r,400));
  document.getAnimations().forEach(a=>{const it=a.effect&&a.effect.getComputedTiming().iterations; if(it===Infinity){a.pause();a.currentTime=0}else{a.finish()}});
  if(document.activeElement&&document.activeElement.blur)document.activeElement.blur(); await new Promise(r=>setTimeout(r,100)); return true})()`;
async function snap(page, file) {
  await page.ev(settle);
  const r = await page.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: W, height: H, scale: 1 } });
  fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
}

const H_JS = `const sleep=ms=>new Promise(r=>setTimeout(r,ms));const q=s=>document.querySelector(s);
const type=v=>{const i=q('[data-in=nama]');i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}))};
const pick=async v=>{q('[data-act=sel]').click();await sleep(60);q('[data-act=opt][data-val="'+v+'"]').click();await sleep(60)};
const open=async()=>{q('[data-act=sel]').click();await sleep(60)};
const orig=HF.api.call;`;

const want = process.argv.slice(2);
const list = want.length ? scenarios.filter((s) => want.includes(s.id)) : scenarios;
let gagal = 0; const rows = [];
for (const sc of list) {
  const b = path.join(OUT, sc.id + '.board.png'), a = path.join(OUT, sc.id + '.app.png'), d = path.join(OUT, sc.id + '.diff.png');
  // board
  let p = await newPage();
  await p.go(`${base}/farm/${sc.board}.dc.html`);
  for (let i = 0; i < 50 && !(await p.ev(`!!document.querySelector('[data-theme]')&&document.querySelector('[data-theme]').children.length>0`)); i++) await sleep(100);
  await snap(p, b); if (process.env.PIXEL_EVAL) console.log('board:', JSON.stringify(await p.ev(process.env.PIXEL_EVAL))); await p.close();
  // aplikasi
  p = await newPage();
  await p.go(`${base}/app/Index.html?hold&reset`);
  await p.ev(`localStorage.setItem('hf-dev-state', ${JSON.stringify(JSON.stringify(sc.seed || { pengaturan: {}, anggota: [], lokasi: [] }))})`);
  await p.go(`${base}/app/Index.html${sc.hold ? '?hold' : sc.step ? '?step=' + sc.step : ''}`);
  await sleep(500);
  if (sc.js) await p.ev(`(async()=>{${H_JS}${sc.js}})()`);
  await snap(p, a); if (process.env.PIXEL_EVAL) console.log('app  :', JSON.stringify(await p.ev(process.env.PIXEL_EVAL))); await p.close();
  const out = JSON.parse(execFileSync('python3', [path.join(import.meta.dirname, 'diff.py'), b, a, d, JSON.stringify((sc.deviasi || []).map((x) => x.box))]).toString());
  const ok = !out.error && out.rasio <= MAX_RASIO; if (!ok) gagal++;
  rows.push({ id: sc.id, ok, out });
  console.log(`${ok ? 'LULUS ' : 'GAGAL '} ${sc.id.padEnd(34)} ${out.error ? out.error : (out.rasio * 100).toFixed(3) + '% beda (' + out.beda_px + ' px)' + (out.dikecualikan_px ? ', ' + out.dikecualikan_px + ' px dikecualikan: ' + sc.deviasi.map((x) => x.alasan).join('; ') : '') + (out.wilayah && out.wilayah[0] && !ok ? '  terbesar: x' + out.wilayah[0].x + ' y' + out.wilayah[0].y + ' ' + out.wilayah[0].w + 'x' + out.wilayah[0].h : '')}`);
}
fs.writeFileSync(path.join(root, '.pixel/ringkasan.json'), JSON.stringify(rows, null, 1));
chrome.kill(); server.close();
console.log(`\n${list.length - gagal}/${list.length} lulus (batas ${(MAX_RASIO * 100).toFixed(1)}% piksel beda). Gambar: .pixel/out/`);
process.exit(gagal ? 1 : 0);
