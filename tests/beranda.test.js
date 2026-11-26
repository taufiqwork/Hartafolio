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

// ---- Data nyata (fromState) ----
const mkState = (extra) => Object.assign({
  serverWaktu: '2026-11-26 10:00',
  anggota: [{ anggota_id: 'PM-001', nama: 'Azlan', aktif: true, is_pengelola: true }, { anggota_id: 'PM-002', nama: 'Yumna', aktif: true }],
  lokasi: [{ lokasi_id: 'LK-001', nama: 'Binance' }, { lokasi_id: 'LK-002', nama: 'Brankas' }],
  aset: globalThis.HF.catalog.all(), pengaturan: {}, piutang: [], zakatBayar: [],
  harga: { terakhir: { 'AS-PAXG': { harga: 70000000, mata_uang: 'IDR' }, 'AS-PERAK': { harga: 46000, mata_uang: 'IDR' }, 'AS-USDT': { harga: 1, mata_uang: 'USD' } }, kursSeries: [{ waktu: '2026-11-26 09:00', harga: 16000 }] },
  transaksi: []
}, extra);
const T = (o) => Object.assign({ status: 'aktif', jam: '09:00', sumber: 'manual', tanggal: '2026-10-01', anggota_id: 'PM-001', lokasi_id: 'LK-001', dibuat_pada: '2026-10-01 09:00' }, o);
const catalogReady = () => { require('../src/engine/catalog.js'); };

test('fromState: tanpa transaksi aktif = kosong', () => {
  catalogReady();
  assert.equal(B.fromState(mkState()), null);
  assert.equal(B.fromState(mkState({ transaksi: [T({ trx_id: 'a', jenis: 'Saldo awal', aset_id: 'AS-PAXG', jumlah: 1, status: 'dihapus' })] })), null);
});
test('fromState: nilai, donut per jenis, usd, dan persen sejak awal dari harga manual', () => {
  catalogReady();
  const s = mkState({ transaksi: [
    T({ trx_id: 'a', jenis: 'Saldo awal', aset_id: 'AS-PAXG', jumlah: 1, harga_beli_rata2: 50000000 }),
    T({ trx_id: 'b', jenis: 'Saldo awal', aset_id: 'AS-USDT', jumlah: 160, lokasi_id: 'LK-002', anggota_id: 'PM-002' })] });
  const d = B.fromState(s);
  assert.equal(d.real, true); assert.deepEqual(d.MEM, ['Azlan', 'Yumna']); assert.deepEqual(d.CLS, ['Emas', 'Crypto']);
  assert.equal(d.MX[0][0], 70); assert.equal(d.MX[1][1], 2.56); // USDT 160 x 1 USD x 16.000
  d.spark = [1, 2, 3, 4, 5, 6];
  const v = B.view(d, { mode: 'anggota', sel: null });
  assert.equal(v.hero.str, 'Rp 72,6 jt'); assert.equal(v.rows[0].n, 'Azlan'); assert.equal(v.rows[0].sub, '1 aset · Binance');
  assert.equal(d.usd, '$ 4.535'); assert.equal(d.piutang, null);
  assert.equal(d.GM['Azlan'], '+40,0%'); assert.equal(d.GM['Yumna'], '—'); // USDT tanpa modal: tidak ada persen
});
test('fromState: aset tanpa harga tidak masuk total dan muncul di lonceng', () => {
  catalogReady();
  const d = B.fromState(mkState({ transaksi: [T({ trx_id: 'a', jenis: 'Saldo awal', aset_id: 'AS-BTC', jumlah: 0.5 }), T({ trx_id: 'b', jenis: 'Saldo awal', aset_id: 'AS-PAXG', jumlah: 1 })] }));
  assert.deepEqual(d.noPrice, ['BTC']);
  const a = B.attention(d); assert.equal(a.badge, 1); assert.equal(a.notes[0].t, 'Harga BTC belum diisi'); assert.equal(a.banner, null);
});
test('fromState: zakat terlambat dan piutang menjadi banner dan lonceng dari data nyata', () => {
  catalogReady();
  const s = mkState({
    transaksi: [T({ trx_id: 'a', jenis: 'Saldo awal', aset_id: 'AS-PERAK', jumlah: 700, tanggal: '2025-01-01', harga_beli_rata2: 40000 })],
    piutang: [] });
  const d = B.fromState(s); const a = B.attention(d);
  assert.equal(d.zk, 'late'); assert.match(a.banner.title, /^Zakat mal terlambat \d+ hari$/); assert.match(a.banner.desc, /^Azlan · jatuh tempo .* 2025 · Rp /);
  assert.equal(a.banner.btnCls, 'hf-btn hf-btn-loss hf-btn-block'); assert.equal(a.badgeLoss, true);
});
test('fromState: piutang terlambat memberi banner piutang, nilainya ikut total, dan satu banner saja', () => {
  catalogReady();
  const trx = [T({ trx_id: 'a', jenis: 'Saldo awal', aset_id: 'AS-PERAK', jumlah: 100, tanggal: '2026-11-01' }), T({ trx_id: 'b', jenis: 'Pinjamkan', aset_id: 'AS-PERAK', jumlah: 50, tanggal: '2026-11-02', link_id: 'PT-1' })];
  const pj = { piutang_id: 'PT-1', pemberi_anggota_id: 'PM-001', peminjam_nama: 'Bu Rina', aset_id: 'AS-PERAK', lokasi_id: 'LK-001', jumlah_pokok: 50, cara: 'sekali', mulai_atau_jatuh_tempo: '2026-11-20', status: 'berjalan' };
  const d = B.fromState(mkState({ transaksi: trx, piutang: [pj] })), a = B.attention(d);
  assert.equal(d.pk, 'late'); assert.equal(d.piutang, 'Rp 2,3 jt'); // 50 g x 46.000, bagian dari total
  assert.equal(a.banner.title, 'Piutang terlambat 6 hari'); assert.match(a.banner.desc, /^Bu Rina · 1 cicilan · perak 50 g milik Azlan$/);
  assert.equal(a.notes[0].t, 'Piutang Bu Rina terlambat 6 hari');
});
