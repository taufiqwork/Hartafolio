const test = require('node:test');
const assert = require('node:assert/strict');
global.HF = {};
['catalog', 'harga-fetch'].forEach((f) => require('../src/engine/' + f + '.js'));
const H = globalThis.HF.hargaFetch, C = globalThis.HF.catalog;
const W = '2026-11-28 10:00';
const ASET = C.all();
const byId = (rows, id) => rows.find((r) => r.aset_id === id);

const HASIL = {
  coingecko: { bitcoin: { usd: 60000 }, 'pax-gold': { usd: 3650 }, 'tether-gold': { usd: 3652 }, ethereum: { usd: 1668 }, tether: { usd: 1 } },
  logam: { XAU: 3650, XAG: 43.23 },
  saham: { 'BBCA.JK': { harga: 6000, mata_uang: 'IDR' }, 'BBRI.JK': { harga: 4000, mata_uang: 'IDR' }, 'ANTM.JK': { harga: 1580, mata_uang: 'IDR' }, GFI: { harga: 36.4, mata_uang: 'USD' } },
  kurs: 16250
};

test('rencana: semua sumber terkumpul sekali, kurs ikut diambil', () => {
  const p = H.rencana(ASET);
  assert.deepEqual(p.coingecko.sort(), ['bitcoin', 'ethereum', 'pax-gold', 'tether', 'tether-gold']);
  assert.deepEqual(p.logam.sort(), ['XAG', 'XAU']);
  assert.deepEqual(p.saham.map((s) => s.ticker).sort(), ['ANTM.JK', 'BBCA.JK', 'BBRI.JK', 'GFI']);
  assert.equal(p.kurs, true);
  const u = H.urls(p);
  assert.match(u.coingecko, /^https:\/\/api\.coingecko\.com\/api\/v3\/simple\/price\?vs_currencies=usd&ids=/);
  assert.equal(u.kurs, 'https://open.er-api.com/v6/latest/USD');
  assert.equal(u.logam.find((l) => l.kode === 'XAU').url, 'https://api.gold-api.com/price/XAU');
});

test('susun: angka tiap sumber (kurs, crypto USD, emas per gram, saham lot x100, saham luar USD)', () => {
  const r = H.susun(ASET, HASIL, W);
  assert.equal(byId(r, C.KURS_ID).harga, 16250);
  assert.deepEqual([byId(r, 'AS-BTC').harga, byId(r, 'AS-BTC').mata_uang], [60000, 'USD']);
  const emas = byId(r, 'AS-EMAS'); assert.equal(emas.mata_uang, 'IDR');
  assert.ok(Math.abs(emas.harga - 3650 * 16250 / 31.1035) < 1e-6);
  assert.ok(Math.abs(byId(r, 'AS-PAXG').harga - 3650) < 1e-9); // PAXG: harga per token (1 oz), USD
  assert.equal(byId(r, 'AS-BBCA').harga, 600000); // 6.000 per lembar x 100
  assert.equal(byId(r, 'AS-GFI').harga, 36.4); assert.equal(byId(r, 'AS-GFI').mata_uang, 'USD');
  assert.equal(byId(r, 'AS-USD').harga, 16250);
  assert.ok(r.every((x) => x.status === 'ok' && x.waktu === W));
});

test('susun: sumber gagal ditulis berstatus gagal (harga 0), yang lain tetap ok', () => {
  const r = H.susun(ASET, Object.assign({}, HASIL, { coingecko: null, kurs: null }), W);
  assert.equal(byId(r, 'AS-BTC').status, 'gagal');
  assert.equal(byId(r, 'AS-EMAS').status, 'gagal'); // perlu kurs
  assert.equal(byId(r, C.KURS_ID).status, 'gagal');
  assert.equal(byId(r, 'AS-BBCA').status, 'ok');
});

test('aset manual, terkunci manual, tersembunyi atau dihapus tidak diambil', () => {
  const m = ASET.map((a) => Object.assign({}, a));
  m.find((a) => a.aset_id === 'AS-BTC').kunci_manual = true;
  m.find((a) => a.aset_id === 'AS-ETH').status = 'tersembunyi';
  m.find((a) => a.aset_id === 'AS-USDT').status = 'dihapus';
  m.push({ aset_id: 'AS-X1', simbol: 'X1', nama: 'Emas perhiasan', kelas: 'Emas', satuan: 'gram', mata_uang_harga: 'IDR', sumber_harga: 'manual', kunci_manual: true, status: 'aktif' });
  const r = H.susun(m, HASIL, W);
  ['AS-BTC', 'AS-ETH', 'AS-USDT', 'AS-X1'].forEach((id) => assert.equal(byId(r, id), undefined, id));
  assert.ok(byId(r, 'AS-PAXG'));
});

test('parse: bentuk jawaban nyata dan jawaban rusak', () => {
  assert.equal(H.parse.logam('{"price":3650.0}'), 3650);
  assert.equal(H.parse.logam('bukan json'), null);
  assert.equal(H.parse.kurs('{"result":"success","rates":{"IDR":16250.5}}'), 16250.5);
  assert.equal(H.parse.kurs('{"result":"error"}'), null);
  assert.deepEqual(H.parse.saham('{"chart":{"result":[{"meta":{"currency":"IDR","regularMarketPrice":6000}}]}}'), { harga: 6000, mata_uang: 'IDR' });
  assert.equal(H.parse.saham('{"chart":{"result":null}}'), null);
  assert.deepEqual(H.parse.coingecko('{"bitcoin":{"usd":1}}'), { bitcoin: { usd: 1 } });
  assert.equal(H.parse.coingecko('x'), null);
});
