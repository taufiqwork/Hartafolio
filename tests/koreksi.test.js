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

test('biaya Pindah satu baris: saldo asal berkurang jumlah + biaya, tujuan bertambah jumlah; saldo kurang ditolak', () => {
  const awal = T({ trx_id: 'A', jenis: 'Saldo awal', tanggal: '2026-11-01', jumlah: 10 });
  const pindah = T({ trx_id: 'P', jenis: 'Pindah', tanggal: '2026-11-02', jumlah: 2, biaya: 0.02, lokasi_tujuan_id: 'LK-002' });
  const b = L.balances([awal, pindah]);
  assert.equal(b[L.key('PM-001', 'AS-PAXG', 'LK-001')], 10 - 2 - 0.02); assert.equal(b[L.key('PM-001', 'AS-PAXG', 'LK-002')], 2);
  assert.deepEqual(L.validate(Object.assign({}, pindah, { jumlah: 9.99, biaya: 0.02 }), { trxList: [awal], lokasiIds: ['LK-001', 'LK-002'] }).filter((x) => /saldo/.test(x)), ['saldo:kurang:AS-PAXG']);
  assert.equal(L.validate(Object.assign({}, pindah, { biaya: -1 }), { trxList: [awal] }).includes('biaya:negatif'), true);
});

test('gabungBiayaPindah: Keluar "Biaya Pindah" bergabung ke Pindah yang sama (hari, jam, aset, lokasi), yang meragukan dilewati', () => {
  const P = T({ trx_id: 'P', jenis: 'Pindah', tanggal: '2026-11-02', jumlah: 2, lokasi_tujuan_id: 'LK-002' });
  const K = T({ trx_id: 'K', jenis: 'Keluar', tanggal: '2026-11-02', jumlah: 0.02, asal_alasan: 'Biaya', catatan: 'Biaya Pindah Rp 47600' });
  assert.deepEqual(L.gabungBiayaPindah([P, K]), [{ pindah: 'P', keluar: 'K', biaya: 0.02 }]);
  assert.deepEqual(L.gabungBiayaPindah([P, K, T({ trx_id: 'P2', jenis: 'Pindah', tanggal: '2026-11-02', jumlah: 1, lokasi_tujuan_id: 'LK-002' })]), []); // dua Pindah cocok: ragu, lewati
  assert.deepEqual(L.gabungBiayaPindah([P, Object.assign({}, K, { jam: '10:00' })]), []);
  assert.deepEqual(L.gabungBiayaPindah([Object.assign({}, P, { biaya: 0.5 }), K]), []);
});

test('Pindah dengan biaya: Hapus menghapus biayanya sekaligus (saldo asal kembali penuh), Pulihkan mengembalikannya, Ubah bisa mengganti biaya', () => {
  const ids = { asetIds: ['AS-PAXG'], anggotaIds: ['PM-001'], lokasiIds: ['LK-001', 'LK-002'] };
  const l = [T({ trx_id: 'A', jenis: 'Saldo awal', tanggal: '2026-11-01', jumlah: 10 }), T({ trx_id: 'P', jenis: 'Pindah', tanggal: '2026-11-02', jumlah: 2, biaya: 0.02, lokasi_tujuan_id: 'LK-002' })];
  const asal = (x) => L.balances(x)[L.key('PM-001', 'AS-PAXG', 'LK-001')];
  assert.equal(asal(l), 7.98);
  const h = L.terapkan(l, 'P', 'hapus', null, ids); assert.equal(h.error, null);
  const hapus = l.map((t) => (t.trx_id === 'P' ? Object.assign({}, t, h.patch) : t));
  assert.equal(asal(hapus), 10); // pindah dan biayanya sama-sama tidak dihitung
  assert.equal(L.terapkan(hapus, 'P', 'pulihkan', null, ids).error, null);
  const u = L.terapkan(l, 'P', 'ubah', { tanggal: '2026-11-02', anggota_id: 'PM-001', aset_id: 'AS-PAXG', lokasi_id: 'LK-001', lokasi_tujuan_id: 'LK-002', jumlah: 2, biaya: 0.05 }, ids);
  assert.equal(u.error, null); assert.equal(u.patch.biaya, 0.05);
});
