const test = require('node:test');
const assert = require('node:assert/strict');
const s = require('../src/engine/schema.js');
const cat = require('../src/engine/catalog.js');

test('11 tab dengan urutan tetap', () => {
  assert.equal(s.URUTAN.length, 11);
  assert.deepEqual(Object.keys(s.TABS).sort(), s.URUTAN.slice().sort());
});

test('kolom Transaksi memuat kolom tambahan v2', () => {
  const n = s.colNames('Transaksi');
  ['alat_bayar_aset_id', 'asal_alasan', 'link_id', 'kurs', 'kurs_sumber', 'kurs_tanggal', 'kurs_waktu', 'harga_mata_uang', 'harga_beli_rata2']
    .forEach(k => assert.ok(n.includes(k), k));
  assert.equal(n[0], 'trx_id');
});

test('header: cocok, salah urutan, dan kolom tambahan di kanan', () => {
  const ok = s.colNames('Anggota');
  assert.equal(s.checkHeader('Anggota', ok).ok, true);
  assert.equal(s.checkHeader('Anggota', ok.concat(['kolom_baru'])).ok, true);
  const swapped = ok.slice(); swapped[1] = ok[2]; swapped[2] = ok[1];
  const r = s.checkHeader('Anggota', swapped);
  assert.equal(r.ok, false);
  assert.equal(r.mismatches.length, 2);
});

test('baris <-> objek: angka titik desimal, bool ya/tidak', () => {
  const o = s.rowToObj('Transaksi', s.objToRow('Transaksi', { trx_id: 'TX-1', jumlah: 0.25, harga_per_unit: 2650.5, status: 'aktif' }));
  assert.equal(o.jumlah, 0.25);
  assert.equal(o.harga_per_unit, 2650.5);
  assert.equal(o.lokasi_tujuan_id, '');
  assert.equal(o.biaya, null);
  assert.equal(s.objToRow('Anggota', { is_pengelola: true })[3], 'ya');
  assert.equal(s.rowToObj('Anggota', ['PM-001', 'A', 'Diri sendiri', 'ya', '', 'tidak', ''])[ 'aktif'], false);
});

test('ID baru tidak memakai ulang nomor', () => {
  assert.equal(s.nextId('PM', []), 'PM-001');
  assert.equal(s.nextId('PM', ['PM-001', 'PM-004']), 'PM-005');
  assert.equal(s.newTrxId('2026-11-03', 7), 'TX-20261103-0007');
});

test('katalog: zakat hanya Emas dan Perak, gram per unit', () => {
  const all = cat.all();
  const by = id => all.find(a => a.aset_id === id);
  assert.equal(by('AS-PAXG').kategori_zakat, 'emas');
  assert.equal(by('AS-PERAK').kategori_zakat, 'perak');
  assert.equal(by('AS-USDT').kategori_zakat, '');
  assert.equal(by('AS-GFI').kategori_zakat, '');
  assert.equal(cat.gramPerUnit(by('AS-PAXG')), 31.1035);
  assert.equal(cat.gramPerUnit(by('AS-EMAS')), 1);
  all.filter(a => a.kategori_zakat && a.satuan !== 'gram').forEach(a => assert.ok(a.gram_per_unit > 0, a.simbol));
  assert.equal(new Set(all.map(a => a.aset_id)).size, all.length);
  assert.ok(cat.search('pax').length === 1);
});

test('Transaksi v2: alat_bayar_lokasi_id paling kanan (kolom ke-29), versi skema 2, kolom lama tidak bergeser', () => {
  const n = s.colNames('Transaksi');
  assert.equal(n.length, 29); assert.equal(n[28], 'alat_bayar_lokasi_id'); assert.equal(n[27], 'diubah_pada'); assert.equal(s.VERSI, 2);
});
