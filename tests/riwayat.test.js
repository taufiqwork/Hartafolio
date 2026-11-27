const test = require('node:test');
const assert = require('node:assert/strict');
global.HF = {};
['format', 'schema', 'catalog', 'ledger', 'riwayat'].forEach((f) => require('../src/engine/' + f + '.js'));
require('../src/demo/riwayat-demo.js');
const R = globalThis.HF.riwayat, Dm = globalThis.HF.riwayatDemo;

const T = (o) => Object.assign({ status: 'aktif', jam: '09:00', sumber: 'manual', anggota_id: 'PM-001', lokasi_id: 'LK-001', dibuat_pada: '2026-11-01 09:00' }, o);
const state = (trx) => ({ aset: HF.catalog.all(), anggota: [{ anggota_id: 'PM-001', nama: 'Azlan' }, { anggota_id: 'PM-002', nama: 'Yumna' }],
  lokasi: [{ lokasi_id: 'LK-001', nama: 'Binance' }, { lokasi_id: 'LK-002', nama: 'Bybit' }], harga: {}, transaksi: trx });

test('format baris: tanda, satuan, label hari', () => {
  assert.equal(R.qtext('Beli', 0.0225, 'token'), '+0,0225');
  assert.equal(R.qtext('Keluar', 15.3, 'gram'), '−15,3 g');
  assert.equal(R.qtext('Jual', 1, 'lot'), '−1 lot');
  assert.equal(R.qtext('Pindah', 0.002, 'koin'), '0,002');
  assert.equal(R.dayLabel('2026-11-09', '2026-11-09'), 'Hari ini · 9 Nov');
  assert.equal(R.dayLabel('2026-11-08', '2026-11-09'), 'Kemarin · 8 Nov');
  assert.equal(R.dayLabel('2026-09-20', '2026-11-09'), '20 Sep');
  assert.equal(R.dayLabel('2026-05-20', '2026-11-09'), '20 Mei 2026');
  assert.equal(R.ringkas(1560000), 'Rp 1,56 jt'); assert.equal(R.ringkas(980000), 'Rp 0,98 jt'); assert.equal(R.ringkas(11900000), 'Rp 11,9 jt'); assert.equal(R.ringkas(7560000000), 'Rp 7,56 M');
});

test('fromState: Beli, Pindah anggota dan lokasi, terbaru di atas, nilai dari harga transaksi', () => {
  const d = R.fromState(state([
    T({ trx_id: 'a', tanggal: '2026-11-02', jenis: 'Beli', aset_id: 'AS-EMAS', jumlah: 1, harga_per_unit: 2240000, harga_mata_uang: 'IDR' }),
    T({ trx_id: 'b', tanggal: '2026-11-03', jenis: 'Pindah', aset_id: 'AS-PAXG', jumlah: 0.0225, anggota_tujuan_id: 'PM-002' }),
    T({ trx_id: 'c', tanggal: '2026-11-03', jam: '10:00', jenis: 'Pindah', aset_id: 'AS-BTC', jumlah: 0.002, lokasi_tujuan_id: 'LK-002' }),
    T({ trx_id: 'x', tanggal: '2026-11-04', jenis: 'Keluar', aset_id: 'AS-EMAS', jumlah: 1, status: 'dihapus' })]), { hariIni: '2026-11-09' });
  assert.deepEqual(d.days.map((x) => x.d), ['4 Nov', '3 Nov', '2 Nov']);
  const rows = d.days[1].rows;
  assert.equal(rows[0].j + '|' + rows[0].mem + '|' + rows[0].loc, 'Pindah lokasi|Azlan|Binance → Bybit'); // jam 10.00 lebih baru
  assert.equal(rows[1].j + '|' + rows[1].mem, 'Pindah anggota|Azlan → Yumna');
  const beli = d.days[2].rows[0];
  assert.equal(beli.a, 'Emas fisik'); assert.equal(beli.q, '+1 g'); assert.equal(beli.v, 'Rp 2,24 jt');
  assert.equal(R.view(d, {}).days.length, 2); // yang dihapus tidak tampil di daftar
  assert.equal(R.view(d, {}).delLabel, 'Terhapus (1)');
});

test('view: filter anggota, jenis, bulan, cari, kosong dan tidak cocok', () => {
  const g = Dm.get('default'), v0 = R.view(g.data, g.ui);
  assert.equal(v0.days.reduce((n, x) => n + x.rows.length, 0), 13);
  const jenis = (j) => R.view(g.data, { sel: { Jenis: j } }).days.reduce((n, x) => n + x.rows.length, 0);
  assert.equal(jenis('Piutang'), 5); assert.equal(jenis('Pindah'), 2); assert.equal(jenis('Beli'), 2);
  assert.equal(R.view(g.data, { sel: { Anggota: 'Al Ghafiqi' } }).days.reduce((n, x) => n + x.rows.length, 0), 2); // Jual BBCA dan Pindah anggota tujuan
  assert.equal(R.view(g.data, { sel: { Bulan: 'Mei 2026' } }).days.length, 1);
  assert.equal(R.view(g.data, { q: 'bbca' }).days.length, 1);
  assert.equal(R.view(g.data, { q: 'zzz' }).noMatch, true);
  assert.equal(R.view(Dm.get('kosong').data, {}).kosong, true);
});

test('view: sheet detail, hapus lokal dan toast', () => {
  const g = Dm.get('terhapus'), v = R.view(g.data, g.ui);
  assert.equal(v.toast, 'Transaksi dihapus'); assert.equal(v.hasDel, true); assert.equal(v.delLabel, 'Terhapus (1)');
  const s = R.view(Dm.get('detail-zakat').data, Dm.get('detail-zakat').ui).sheet;
  assert.equal(s.title, 'Zakat · Perak fisik'); assert.ok(s.det.some((x) => x.k === 'Untuk haul' && x.href));
  const real = R.fromState(state([T({ trx_id: 'a', tanggal: '2026-11-02', jenis: 'Beli', aset_id: 'AS-EMAS', jumlah: 1, harga_per_unit: 2240000, bukti: 'https://drive.google.com/file/d/1/view', catatan: 'c' })]), { hariIni: '2026-11-09' });
  const sh = R.view(real, { sheet: 'a' }).sheet.det;
  assert.deepEqual(sh.filter((x) => x.k === 'Bukti').map((x) => [x.v, x.ext]), [['1 foto', true]]);
  assert.equal(sh.filter((x) => x.k === 'Harga satuan')[0].v, 'Rp 2,24 jt');
});
