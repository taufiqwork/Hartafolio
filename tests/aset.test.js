const test = require('node:test');
const assert = require('node:assert/strict');
global.HF = {};
['format', 'schema', 'catalog', 'ledger', 'valuation', 'piutang', 'zakat', 'beranda', 'aset'].forEach((f) => require('../src/engine/' + f + '.js'));
require('../src/demo/aset-demo.js');
const A = globalThis.HF.aset, D = globalThis.HF.asetDemo;

test('demo default = board: 9 posisi, Rp 174,2 jt; kategori urut nilai; Milik N anggota digabung', () => {
  const g = D.get('default'), v = A.view(g.data, g.ui);
  assert.equal(v.count, 9); assert.equal(v.total, 'Rp 174,2 jt');
  assert.deepEqual(v.groups.map((x) => x.k + ' ' + x.share), ['Emas 52%', 'Crypto 27%', 'Perak 9%', 'Saham 8%', 'Mata uang 4%']);
  const paxg = v.groups[0].rows[0]; assert.equal(paxg.a, 'PAXG'); assert.equal(paxg.p, 'Milik 4 anggota'); assert.equal(paxg.q, ''); assert.equal(paxg.v, 'Rp 71,6 jt');
  assert.equal(v.pills.map((p) => p.l).join(','), 'Semua,Azlan,Al Ghafiqi,M. Yahya,Yumna');
});

test('demo satu anggota dan filter lokasi: jumlah tampil, total mengikuti, pilihan lokasi memuat nilai', () => {
  const g = D.get('satu'), v = A.view(g.data, g.ui);
  assert.equal(v.groups[0].rows[0].q, '0,52 token'); assert.equal(v.groups[0].rows[0].p, '');
  const bin = A.view(g.data, { aM: 'Azlan', aL: 'Binance' });
  assert.deepEqual(bin.groups.map((x) => x.k), ['Emas', 'Crypto']); assert.equal(bin.lokLabel, 'Binance');
  assert.equal(v.lokOpts.find((o) => o.l === 'Brankas').v, A.view(g.data, { aM: 'Azlan' }).lokOpts[4].v);
  assert.equal(A.view(D.get('kosong').data, {}).empty, true);
});

test('fromState: saldo x harga (harga transaksi terakhir sebagai perkiraan), satuan, aset tanpa harga dihitung terpisah', () => {
  const T = (o) => Object.assign({ status: 'aktif', anggota_id: 'PM-001', lokasi_id: 'LK-001', jam: '09:00', sumber: 'manual' }, o);
  const state = { aset: HF.catalog.all(), anggota: [{ anggota_id: 'PM-001', nama: 'Azlan', aktif: true }], lokasi: [{ lokasi_id: 'LK-001', nama: 'Brankas' }], harga: {},
    transaksi: [T({ trx_id: 'a', tanggal: '2026-11-01', jenis: 'Saldo awal', aset_id: 'AS-EMAS', jumlah: 8 }), T({ trx_id: 'b', tanggal: '2026-11-02', jenis: 'Beli', aset_id: 'AS-EMAS', jumlah: 2, harga_per_unit: 2400000, harga_mata_uang: 'IDR' }),
      T({ trx_id: 'c', tanggal: '2026-11-03', jenis: 'Saldo awal', aset_id: 'AS-IDR', jumlah: 4300000 }), T({ trx_id: 'd', tanggal: '2026-11-03', jenis: 'Saldo awal', aset_id: 'AS-BTC', jumlah: 0.01 })] };
  const d = A.fromState(state, {}), v = A.view(d, {});
  assert.equal(d.tanpaHarga, 1); // BTC tanpa harga
  assert.equal(v.count, 2); assert.equal(v.total, 'Rp 28,3 jt');
  const emas = v.groups.find((g) => g.k === 'Emas').rows[0]; assert.equal(emas.a, 'Emas fisik'); assert.equal(emas.p, 'Azlan'); assert.equal(emas.q, '10 g · '); assert.equal(emas.v, 'Rp 24,0 jt');
  assert.equal(v.groups.find((g) => g.k === 'Mata uang').rows[0].q, 'tunai · ');
  assert.equal(v.perluHarga, 1);
});
