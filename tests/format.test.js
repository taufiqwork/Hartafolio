const test = require('node:test');
const assert = require('node:assert/strict');
const f = require('../src/engine/format.js');

test('rupiah penuh memakai titik ribuan', () => {
  assert.equal(f.rupiah(2380000), 'Rp 2.380.000');
  assert.equal(f.rupiah(0), 'Rp 0');
  assert.equal(f.rupiah(19328000), 'Rp 19.328.000');
  assert.equal(f.rupiah(-500000), '−Rp 500.000');
});

test('rupiah ringkas mengikuti mockup', () => {
  assert.equal(f.rupiahShort(174200000), 'Rp 174,2 jt');
  assert.equal(f.rupiahShort(1630000), 'Rp 1,63 jt');
  assert.equal(f.rupiahShort(17000000), 'Rp 17,0 jt');
  assert.equal(f.rupiahShort(980000), 'Rp 980.000');
  assert.equal(f.rupiahShort(1480000000), 'Rp 1,48 M');
  assert.equal(f.rupiahShort(50400000, { dec: 3 }), 'Rp 50,400 jt');
});

test('perubahan nilai selalu bertanda dengan minus asli', () => {
  assert.equal(f.percentDelta(7.7), '+7,7%');
  assert.equal(f.percentDelta(-1.3), '−1,3%');
  assert.equal(f.percentDelta(0), '0,0%');
  assert.equal(f.percentDelta(-0.04), '0,0%');
  assert.equal(f.percentDelta(2.44, 1), '+2,4%');
});

test('angka dan gram gaya Indonesia', () => {
  assert.equal(f.number(0.0219), '0,0219');
  assert.equal(f.number(1234567.5, 1), '1.234.567,5');
  assert.equal(f.grams(612), '612 g');
  assert.equal(f.grams(85.5), '85,5 g');
  assert.equal(f.usd(9979), '$ 9.979');
  assert.equal(f.usd(99.56, 2), '$ 99,56');
});

test('tanggal dan pengelompokan hari', () => {
  const now = new Date(2026, 10, 9, 14, 20);
  assert.equal(f.dateId(new Date(2026, 10, 6)), '6 Nov 2026');
  assert.equal(f.dayGroup(new Date(2026, 10, 9, 8, 0), now), 'Hari ini · 9 Nov');
  assert.equal(f.dayGroup(new Date(2026, 10, 8), now), 'Kemarin · 8 Nov');
  assert.equal(f.dayGroup(new Date(2026, 9, 30), now), '30 Okt 2026');
  assert.equal(f.timeId(new Date(2026, 10, 9, 7, 5)), '07.05');
});
