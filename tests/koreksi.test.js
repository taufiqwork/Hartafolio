const test = require('node:test'), assert = require('node:assert/strict');
const L = require('../src/engine/ledger.js');
const ids = { asetIds: ['AS-PAXG', 'AS-IDR'], anggotaIds: ['PM-001'], lokasiIds: ['LK-001', 'LK-002'] };
const T = (o) => Object.assign({ status: 'aktif', anggota_id: 'PM-001', aset_id: 'AS-PAXG', lokasi_id: 'LK-001', jam: '09:00', sumber: 'manual' }, o);
const dasar = () => [
  T({ trx_id: 'A', jenis: 'Saldo awal', tanggal: '2026-11-01', jumlah: 2 }),
  T({ trx_id: 'B', jenis: 'Beli', tanggal: '2026-11-02', jumlah: 1, harga_per_unit: 4000, harga_mata_uang: 'IDR' }),
  T({ trx_id: 'C', jenis: 'Jual', tanggal: '2026-11-03', jumlah: 3, harga_per_unit: 4100, harga_mata_uang: 'IDR' })
];

test('hapus: menghapus Beli yang menutup penjualan sesudahnya ditolak', () => {
  assert.equal(L.terapkan(dasar(), 'B', 'hapus', null, ids).error, 'saldo:setelahnya');
});
test('hapus: menghapus Jual (penambah saldo bila dihapus) diizinkan, lalu pulihkan diizinkan kembali', () => {
  const l = dasar(); const r = L.terapkan(l, 'C', 'hapus', null, ids);
  assert.equal(r.error, null); assert.deepEqual(r.patch, { status: 'dihapus' });
  l[2].status = 'dihapus';
  assert.equal(L.terapkan(l, 'C', 'pulihkan', null, ids).error, null);
});
test('pulihkan: Jual yang akan membuat saldo minus ditolak', () => {
  const l = dasar(); l[2].status = 'dihapus'; l[1].status = 'dihapus'; // Beli B dihapus, Jual C dihapus: C tak bisa kembali karena stok 2 < 3
  assert.equal(L.terapkan(l, 'C', 'pulihkan', null, ids).error, 'saldo:setelahnya');
});
test('ubah: mengecilkan jumlah Beli yang dijual lagi ditolak; menambah diizinkan', () => {
  const baris = (q) => ({ tanggal: '2026-11-02', jam: '09:00', anggota_id: 'PM-001', aset_id: 'AS-PAXG', lokasi_id: 'LK-001', jumlah: q, harga_per_unit: 4000, harga_mata_uang: 'IDR' });
  assert.equal(L.terapkan(dasar(), 'B', 'ubah', baris(0.5), ids).error, 'saldo:setelahnya');
  const ok = L.terapkan(dasar(), 'B', 'ubah', baris(2), ids, '2026-11-27 10:00');
  assert.equal(ok.error, null); assert.equal(ok.patch.jumlah, 2); assert.equal(ok.patch.diubah_pada, '2026-11-27 10:00'); assert.equal(ok.patch.biaya, null);
});
test('ubah: jenis, id, status tidak ikut berubah; galat validasi (jumlah nol) ditolak; transaksi tidak ada / terkunci / sudah dihapus', () => {
  const l = dasar();
  const r = L.terapkan(l, 'B', 'ubah', { tanggal: '2026-11-02', jenis: 'Jual', status: 'dihapus', anggota_id: 'PM-001', aset_id: 'AS-PAXG', lokasi_id: 'LK-001', jumlah: 1, harga_per_unit: 1 }, ids);
  assert.ok(!('jenis' in r.patch) && !('status' in r.patch) && !('trx_id' in r.patch));
  assert.equal(L.terapkan(l, 'B', 'ubah', { tanggal: '2026-11-02', anggota_id: 'PM-001', aset_id: 'AS-PAXG', lokasi_id: 'LK-001', jumlah: 0, harga_per_unit: 1 }, ids).error, 'jumlah:harus-positif');
  assert.equal(L.terapkan(l, 'ZZ', 'hapus', null, ids).error, 'tidak-ada');
  assert.equal(L.terapkan(l.concat([T({ trx_id: 'Z', jenis: 'Zakat', tanggal: '2026-11-04', jumlah: 0.1 })]), 'Z', 'hapus', null, ids).error, 'terkunci');
  l[2].status = 'dihapus';
  assert.equal(L.terapkan(l, 'C', 'hapus', null, ids).error, 'sudah-dihapus');
  assert.equal(L.terapkan(l, 'A', 'pulihkan', null, ids).error, 'sudah-aktif');
});
test('ubah: nomor referensi diganti tetapi tautan foto tetap; data lama yang sudah minus tidak menghalangi perubahan lain', () => {
  const l = dasar(); l[1].bukti = 'INV-1\nhttps://drive.google.com/file/d/X/view';
  const r = L.terapkan(l, 'B', 'ubah', { tanggal: '2026-11-02', anggota_id: 'PM-001', aset_id: 'AS-PAXG', lokasi_id: 'LK-001', jumlah: 1, harga_per_unit: 4000, nomor: 'INV-2' }, ids);
  assert.equal(r.patch.bukti, 'INV-2\nhttps://drive.google.com/file/d/X/view');
  const rusak = [T({ trx_id: 'J', jenis: 'Jual', tanggal: '2026-11-01', jumlah: 1, harga_per_unit: 1 }), T({ trx_id: 'K', jenis: 'Saldo awal', tanggal: '2026-11-05', jumlah: 5 })];
  assert.equal(L.terapkan(rusak, 'K', 'ubah', { tanggal: '2026-11-05', anggota_id: 'PM-001', aset_id: 'AS-PAXG', lokasi_id: 'LK-001', jumlah: 6 }, ids).error, null);
});
