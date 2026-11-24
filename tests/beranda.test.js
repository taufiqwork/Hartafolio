const test = require('node:test');
const assert = require('node:assert/strict');
global.HF = {}; require('../src/engine/beranda.js'); require('../src/demo/demo.js');
const B = globalThis.HF.beranda, D = globalThis.HF.demo;

test('beranda: total semua anggota 174,2 jt dan urutan anggota dari terbesar', () => {
  const v = B.view(D.get(), { mode: 'anggota', sel: null });
  assert.equal(v.hero.str, 'Rp 174,2 jt'); assert.equal(v.hero.int, 174); assert.equal(v.hero.dec, ',2 jt');
  assert.deepEqual(v.rows.map(r => r.n), ['Azlan', 'Al Ghafiqi', 'M. Yahya', 'Yumna']);
  assert.equal(v.rows[0].vs, 'Rp 141,7 jt'); assert.equal(v.rows[0].sub, '8 aset · Binance, Brankas, Bybit, Pluang');
  assert.equal(v.title, 'Harta tiap anggota'); assert.equal(v.cName, 'Semua anggota'); assert.equal(v.cValue, 'Rp 174,2 jt');
});
test('beranda: per jenis aset, urutan nilai, perak tanpa saldo disembunyikan bila 0', () => {
  const v = B.view(D.get(), { mode: 'aset', sel: null });
  assert.deepEqual(v.rows.map(r => r.n), ['Emas', 'Crypto', 'Perak', 'Saham', 'Mata uang']);
  assert.equal(v.title, 'Jenis aset terhadap total');
  const satu = B.view(D.get(), { mode: 'anggota', sel: 3 }); // Yumna: tanpa perak dan saham
  assert.deepEqual(satu.rows.map(r => r.n), ['Mata uang', 'Emas', 'Crypto'].filter(n => n).length === 3 ? satu.rows.map(r => r.n) : []);
  assert.ok(satu.rows.every(r => !/^Rp 0,0/.test(r.vs)));
});
test('beranda: lebih dari 5 item = 4 teratas + Sisanya yang bisa dibuka', () => {
  const v = B.view(D.get('banyak'), { mode: 'anggota', sel: null, hi: 4 });
  assert.equal(v.rows.length, 5); assert.equal(v.rows[4].n, 'Sisanya (5)'); assert.equal(v.rows[4].sub, '5 anggota · gabungan');
  assert.equal(v.rows[4].subs.length, 5); assert.equal(v.segs[4].cls, 's6');
  assert.equal(v.cName, 'Sisanya'); assert.equal(v.cShare, '14%'); // (8,1+6,9+4,2+3,1+1,4) / 174,2
});
test('beranda: menyorot satu baris meredupkan yang lain; tanpa transaksi = kosong', () => {
  const v = B.view(D.get(), { mode: 'anggota', sel: null, hi: 0 });
  assert.equal(v.segs[0].sw, 20); assert.equal(v.segs[1].op, 0.22); assert.equal(v.rows[1].op, 0.45); assert.equal(v.cHasShare, true);
  assert.equal(B.fromState({ transaksi: [] }), null);
  assert.equal(B.fromState({ transaksi: [{ status: 'dihapus' }] }), null);
});
