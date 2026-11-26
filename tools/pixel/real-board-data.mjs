// Mencetak JSON hasil HF.beranda.fromState untuk tiap data uji (dibaca pembuat board Beranda data nyata).
import { SEEDS } from './real-seeds.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.HF = {}; require('../../src/engine/catalog.js'); require('../../src/engine/beranda.js');
const out = {};
for (const [k, s] of Object.entries(SEEDS)) {
  const d = globalThis.HF.beranda.fromState(JSON.parse(JSON.stringify(Object.assign({}, s, { aset: globalThis.HF.catalog.all() }))), {});
  out[k] = { MEM: d.MEM, CLS: d.CLS, MX: d.MX, AR: d.AR, GM: d.GM, GC: d.GC, usd: d.usd, att: globalThis.HF.beranda.attention(d) , piutang: d.piutang };
}
console.log(JSON.stringify(out));
