const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../src/engine/angka.js');

test('titik ribuan disisipkan otomatis saat diketik, koma desimal dipertahankan', () => {
  const f = (s) => A.analisis(s).teks;
  assert.equal(f('1'), '1'); assert.equal(f('1000'), '1.000'); assert.equal(f('72658500'), '72.658.500'); assert.equal(f('0,0225'), '0,0225');
  assert.equal(f('1250000,5'), '1.250.000,5'); assert.equal(f('1.000'), '1.000'); assert.equal(f('1.000.000'), '1.000.000'); 
  assert.equal(A.analisis('1000').galat, null); assert.equal(f(''), ''); assert.equal(f('0'), '0');
});

test('titik sebagai desimal: galat dengan usulan koma; pasti bila jelas, ragu bila bisa awal ribuan', () => {
  const g = A.analisis('0.0225').galat; assert.equal(g.jenis, 'titik'); assert.equal(g.perbaiki, '0,0225'); assert.equal(g.pasti, true);
  assert.equal(A.analisis('4425.5').galat.perbaiki, '4425,5'); assert.equal(A.analisis('4425.5').galat.pasti, true);
  const r = A.analisis('2.5').galat; assert.equal(r.perbaiki, '2,5'); assert.equal(r.pasti, false); // bisa awal "2.500"
  assert.equal(A.analisis('12.').galat, null); // masih diketik
  assert.equal(A.analisis('1.000').galat, null); // ribuan benar
});

test('format Inggris 1,234.56 diusulkan 1.234,56; lebih dari satu koma; karakter lain', () => {
  const e = A.analisis('1,234.56').galat; assert.equal(e.jenis, 'inggris'); assert.equal(e.perbaiki, '1.234,56'); assert.equal(e.pasti, true);
  assert.equal(A.analisis('1,2,3').galat.jenis, 'koma'); assert.equal(A.analisis('1,5.5').galat.jenis, 'titik');
  const k = A.analisis('12abc3'); assert.equal(k.teks, '123'); assert.equal(k.galat.jenis, 'karakter');
  assert.equal(A.analisis('1.2.3').galat.jenis, 'titik');
});

test('nilai: angka dari teks valid, NaN bila galat pasti', () => {
  assert.equal(A.nilai('72.658.500'), 72658500); assert.equal(A.nilai('0,0225'), 0.0225); assert.equal(A.nilai('1.250,5'), 1250.5);
  assert.ok(Number.isNaN(A.nilai('0.0225'))); assert.ok(Number.isNaN(A.nilai('1,234.56'))); assert.equal(A.nilai(''), NaN);
});

test('kursor tetap di angka yang sama setelah titik disisipkan', () => {
  assert.equal(A.kursor('1000', 4, '1.000'), 5); assert.equal(A.kursor('10000', 2, '10.000'), 2); assert.equal(A.kursor('1.000', 1, '1.000'), 1);
});

test('"0.022" bukan ribuan (awalan nol): ragu dengan usulan 0,022; "1.0000" mentah', () => {
  const g = A.analisis('0.022').galat; assert.equal(g.perbaiki, '0,022'); assert.equal(g.pasti, false);
  assert.equal(A.analisis('0.0225').galat.pasti, true);
});
