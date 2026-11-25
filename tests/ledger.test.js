const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../src/engine/ledger.js');

let n = 0;
const T = o => Object.assign({ trx_id: 'TX-' + (++n), tanggal: '2026-11-01', jam: '09:00', status: 'aktif', jumlah: 1, harga_mata_uang: 'IDR', lokasi_id: 'LK-1', anggota_id: 'PM-1', aset_id: 'AS-EMAS' }, o);
const bal = (b, a, s, l) => b[L.key(a, s, l)] || 0;

test('saldo: Beli, Jual, Masuk, Keluar, Penyesuaian', () => {
  const b = L.balances([
    T({ jenis: 'Saldo awal', jumlah: 10 }),
    T({ jenis: 'Beli', jumlah: 5, harga_per_unit: 1000 }),
    T({ jenis: 'Jual', jumlah: 3, harga_per_unit: 1200 }),
    T({ jenis: 'Masuk', jumlah: 2, asal_alasan: 'Hadiah' }),
    T({ jenis: 'Keluar', jumlah: 1, asal_alasan: 'Sedekah' }),
    T({ jenis: 'Penyesuaian', jumlah: -0.5 })
  ]);
  assert.equal(bal(b, 'PM-1', 'AS-EMAS', 'LK-1'), 12.5);
});

test('baris dihapus diabaikan', () => {
  const b = L.balances([T({ jenis: 'Beli', jumlah: 4, harga_per_unit: 1 }), T({ jenis: 'Beli', jumlah: 9, harga_per_unit: 1, status: 'dihapus' })]);
  assert.equal(bal(b, 'PM-1', 'AS-EMAS', 'LK-1'), 4);
});

test('Pindah satu baris: antar lokasi dan antar anggota', () => {
  const b = L.balances([
    T({ jenis: 'Saldo awal', jumlah: 10 }),
    T({ jenis: 'Pindah', jumlah: 4, lokasi_tujuan_id: 'LK-2' }),
    T({ jenis: 'Pindah', jumlah: 2, anggota_tujuan_id: 'PM-2' })
  ]);
  assert.equal(bal(b, 'PM-1', 'AS-EMAS', 'LK-1'), 4);
  assert.equal(bal(b, 'PM-1', 'AS-EMAS', 'LK-2'), 4);
  assert.equal(bal(b, 'PM-2', 'AS-EMAS', 'LK-1'), 2);
  // total tidak berubah
  assert.equal(Object.values(b).reduce((x, y) => x + y, 0), 10);
});

test('bayar dengan aset bekerja seperti swap', () => {
  const b = L.balances([
    T({ jenis: 'Saldo awal', aset_id: 'AS-BTC', jumlah: 1 }),
    T({ jenis: 'Beli', aset_id: 'AS-PAXG', jumlah: 2, harga_per_unit: 0.04, harga_mata_uang: 'BTC', alat_bayar_aset_id: 'AS-BTC', biaya: 0.001 }),
    T({ jenis: 'Jual', aset_id: 'AS-PAXG', jumlah: 1, harga_per_unit: 0.05, harga_mata_uang: 'BTC', alat_bayar_aset_id: 'AS-BTC' })
  ]);
  assert.ok(Math.abs(bal(b, 'PM-1', 'AS-BTC', 'LK-1') - (1 - 0.081 + 0.05)) < 1e-9);
  assert.equal(bal(b, 'PM-1', 'AS-PAXG', 'LK-1'), 1);
});

test('saldo sampai tanggal tertentu', () => {
  const list = [T({ jenis: 'Beli', jumlah: 1, harga_per_unit: 1, tanggal: '2026-11-01' }), T({ jenis: 'Beli', jumlah: 1, harga_per_unit: 1, tanggal: '2026-11-05' })];
  assert.equal(bal(L.balances(list, { sampai: '2026-11-03' }), 'PM-1', 'AS-EMAS', 'LK-1'), 1);
});

test('validasi: Jual melebihi saldo ditolak, id duplikat ditolak', () => {
  const base = [T({ jenis: 'Saldo awal', jumlah: 2 })];
  const jual = T({ jenis: 'Jual', jumlah: 3, harga_per_unit: 1 });
  assert.ok(L.validate(jual, { trxList: base }).some(x => x.startsWith('saldo:kurang')));
  const ok = T({ jenis: 'Jual', jumlah: 2, harga_per_unit: 1 });
  assert.deepEqual(L.validate(ok, { trxList: base }), []);
  assert.ok(L.validate(Object.assign({}, ok, { trx_id: base[0].trx_id }), { trxList: base }).includes('trx_id:duplikat'));
  assert.ok(L.validate(T({ jenis: 'Beli', jumlah: 1 }), null).includes('wajib:harga_per_unit'));
  assert.ok(L.validate(T({ jenis: 'Beli', jumlah: 1, harga_per_unit: 1, harga_mata_uang: 'USD' }), null).includes('wajib:kurs'));
  assert.ok(L.validate(T({ jenis: 'Pindah', jumlah: 1 }), null).includes('wajib:tujuan'));
  assert.ok(L.validate(T({ jenis: 'Beli', jumlah: 0, harga_per_unit: 1 }), null).includes('jumlah:harus-positif'));
});

test('urutan kronologis memakai jam', () => {
  const s = L.sortTrx([T({ trx_id: 'b', jam: '10:00' }), T({ trx_id: 'a', jam: '08:05' })]);
  assert.equal(s[0].trx_id, 'a');
});

test('modal rata-rata dan untung terealisasi', () => {
  const r = L.costBasis([
    T({ jenis: 'Beli', jumlah: 10, harga_per_unit: 100, tanggal: '2026-11-01' }),
    T({ jenis: 'Beli', jumlah: 10, harga_per_unit: 200, tanggal: '2026-11-02' }),
    T({ jenis: 'Jual', jumlah: 10, harga_per_unit: 300, tanggal: '2026-11-03' })
  ]);
  const p = r.posisi['PM-1|AS-EMAS'];
  assert.equal(p.qty, 10);
  assert.equal(p.cost, 1500);            // rata-rata 150
  assert.equal(r.realized['PM-1|AS-EMAS'], 1500); // 3000 - 1500
});

test('modal USD memakai kurs yang dibekukan, biaya masuk modal', () => {
  const r = L.costBasis([T({ aset_id: 'AS-BTC', jenis: 'Beli', jumlah: 1, harga_per_unit: 100, harga_mata_uang: 'USD', kurs: 16000, biaya: 2 })]);
  assert.equal(r.posisi['PM-1|AS-BTC'].cost, 102 * 16000);
});

test('Saldo awal tanpa harga: modal tidak diketahui; dengan harga: diketahui', () => {
  const r = L.costBasis([
    T({ jenis: 'Saldo awal', jumlah: 5 }),
    T({ jenis: 'Saldo awal', aset_id: 'AS-ANTM', jumlah: 5, harga_beli_rata2: 2000 })
  ]);
  assert.equal(r.posisi['PM-1|AS-EMAS'].qtyKnown, 0);
  assert.equal(r.posisi['PM-1|AS-ANTM'].cost, 10000);
});

test('Pindah antar anggota membawa modal; pinjaman membawa modal pergi dan kembali', () => {
  const r = L.costBasis([
    T({ jenis: 'Beli', jumlah: 10, harga_per_unit: 100 }),
    T({ jenis: 'Pindah', jumlah: 4, anggota_tujuan_id: 'PM-2' }),
    T({ jenis: 'Pinjamkan', jumlah: 3, link_id: 'PT-001' }),
    T({ jenis: 'Cicilan diterima', jumlah: 3, link_id: 'PT-001' })
  ]);
  assert.equal(r.posisi['PM-2|AS-EMAS'].cost, 400);
  assert.equal(r.posisi['PM-1|AS-EMAS'].qty, 6);
  assert.equal(r.posisi['PM-1|AS-EMAS'].cost, 600);
});

test('bayar dari lokasi lain: aset pembayar berkurang di lokasi pembayar, bukan lokasi pembelian', () => {
  const b = L.balances([
    T({ jenis: 'Saldo awal', aset_id: 'AS-USDT', lokasi_id: 'LK-2', jumlah: 500 }),
    T({ jenis: 'Beli', aset_id: 'AS-PAXG', lokasi_id: 'LK-1', jumlah: 0.1, harga_per_unit: 4000, harga_mata_uang: 'USDT', alat_bayar_aset_id: 'AS-USDT', alat_bayar_lokasi_id: 'LK-2', biaya: 1 }),
    T({ jenis: 'Jual', aset_id: 'AS-PAXG', lokasi_id: 'LK-1', jumlah: 0.05, harga_per_unit: 4000, harga_mata_uang: 'USDT', alat_bayar_aset_id: 'AS-USDT', alat_bayar_lokasi_id: 'LK-3' })
  ]);
  assert.equal(bal(b, 'PM-1', 'AS-PAXG', 'LK-1'), 0.05);
  assert.equal(bal(b, 'PM-1', 'AS-USDT', 'LK-2'), 500 - 401);
  assert.equal(bal(b, 'PM-1', 'AS-USDT', 'LK-1'), 0); // lokasi pembelian tidak tersentuh
  assert.equal(bal(b, 'PM-1', 'AS-USDT', 'LK-3'), 200);
});

test('bayar dari lokasi lain: saldo pembayar kurang ditolak, lokasi pembayar harus ada; kolom kosong = lokasi pembelian (baris lama)', () => {
  const base = [T({ jenis: 'Saldo awal', aset_id: 'AS-USDT', lokasi_id: 'LK-2', jumlah: 100 })];
  const beli = (extra) => T(Object.assign({ jenis: 'Beli', aset_id: 'AS-PAXG', lokasi_id: 'LK-1', jumlah: 0.1, harga_per_unit: 4000, harga_mata_uang: 'USDT', kurs: 16400, alat_bayar_aset_id: 'AS-USDT' }, extra));
  const ctx = { trxList: base, lokasiIds: ['LK-1', 'LK-2'] };
  assert.deepEqual(L.validate(beli({ alat_bayar_lokasi_id: 'LK-2' }), ctx), ['saldo:kurang:AS-USDT']);
  assert.deepEqual(L.validate(beli({ alat_bayar_lokasi_id: 'LK-9' }), ctx), ['lokasi:tidak-ada']);
  const ok = Object.assign({}, beli({ jumlah: 0.01, alat_bayar_lokasi_id: 'LK-2' }));
  assert.deepEqual(L.validate(ok, ctx), []);
  // tanpa kolom: pembayaran jatuh di LK-1 yang tidak punya USDT, jadi ditolak seperti dulu
  assert.deepEqual(L.validate(beli({ jumlah: 0.01 }), ctx), ['saldo:kurang:AS-USDT']);
});
