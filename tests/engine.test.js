const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../src/engine/dates.js');
const K = require('../src/engine/kurs.js');
const V = require('../src/engine/valuation.js');
const L = require('../src/engine/ledger.js');
const PT = require('../src/engine/piutang.js');
const Z = require('../src/engine/zakat.js');
const Q = require('../src/engine/queue.js');
const cat = require('../src/engine/catalog.js');

let n = 0;
const T = o => Object.assign({ trx_id: 'TX-' + (++n), tanggal: '2026-11-01', jam: '09:00', status: 'aktif', jumlah: 1, harga_mata_uang: 'IDR', lokasi_id: 'LK-1', anggota_id: 'PM-1', aset_id: 'AS-EMAS' }, o);

test('tanggal: tambah bulan mundur ke akhir bulan', () => {
  assert.equal(D.addMonths('2026-01-31', 1, 31), '2026-02-28');
  assert.equal(D.addMonths('2026-01-31', 2, 31), '2026-03-31');
  assert.equal(D.addMonths('2028-01-31', 1, 31), '2028-02-29');
  assert.equal(D.addMonths('2026-11-15', 3), '2027-02-15');
  assert.equal(D.diffDays('2026-11-10', '2026-11-01'), 9);
});

test('kurs: hari ini live, lampau rata-rata harian, manual menang, dibekukan', () => {
  const series = [{ waktu: '2026-11-08 08:00', harga: 16400 }, { waktu: '2026-11-08 20:00', harga: 16440 }, { waktu: '2026-11-09 14:32', harga: 16420 }];
  const now = K.resolve({ mataUang: 'USD', tanggal: '2026-11-09', hariIni: '2026-11-09', series });
  assert.deepEqual([now.kurs, now.kurs_sumber, now.kurs_waktu], [16420, 'realtime', '14:32']);
  const past = K.resolve({ mataUang: 'USD', tanggal: '2026-11-08', hariIni: '2026-11-09', series });
  assert.deepEqual([past.kurs, past.kurs_sumber], [16420, 'rata_harian']);
  assert.equal(K.resolve({ mataUang: 'USD', tanggal: '2026-11-08', hariIni: '2026-11-09', series, manual: 16500 }).kurs_sumber, 'manual');
  assert.equal(K.resolve({ mataUang: 'IDR' }).kurs, 1);
  assert.equal(K.resolve({ mataUang: 'USD', tanggal: '2026-11-08', hariIni: '2026-11-09', series: [] }), null);
  const t = K.freeze(T({ jenis: 'Beli' }), past);
  assert.equal(t.kurs, 16420);
});

const aset = cat.all();
const anggota = [{ anggota_id: 'PM-1', is_pengelola: true, aktif: true }, { anggota_id: 'PM-2', is_pengelola: false, aktif: true }];

test('nilai: USD ke Rupiah, tiga tingkat total, tanpa harga ditandai', () => {
  const bal = L.balances([
    T({ jenis: 'Saldo awal', aset_id: 'AS-EMAS', jumlah: 10 }),
    T({ jenis: 'Saldo awal', aset_id: 'AS-PAXG', jumlah: 2, anggota_id: 'PM-2' }),
    T({ jenis: 'Saldo awal', aset_id: 'AS-USDT', jumlah: 100 }),
    T({ jenis: 'Saldo awal', aset_id: 'AS-BBRI', jumlah: 1 })
  ]);
  const r = V.nilai({ bal, aset, anggota, kursUsd: 16000, prices: {
    'AS-EMAS': { harga: 2000000, mata_uang: 'IDR' }, 'AS-PAXG': { harga: 2500, mata_uang: 'USD' }, 'AS-USDT': { harga: 1, mata_uang: 'USD' } } });
  assert.equal(r.perAnggota['PM-1'].total, 20000000 + 1600000);
  assert.equal(r.perAnggota['PM-2'].total, 2 * 2500 * 16000);
  assert.equal(r.pengelola, r.perAnggota['PM-1'].total);
  assert.equal(r.salinan, r.perAnggota['PM-1'].total + r.perAnggota['PM-2'].total);
  assert.deepEqual(r.tanpaHarga, ['AS-BBRI']);
  assert.equal(r.usd, r.salinan / 16000);
  const pie = V.persenKelas(r.perAnggota['PM-1'].perKelas);
  assert.equal(pie[0].kelas, 'Emas');
  assert.ok(Math.abs(pie.reduce((s, x) => s + x.persen, 0) - 100) < 1e-9);
});

test('nilai: piutang menambah total pemberi (sisa x harga) dan total harta tidak berubah', () => {
  const trx = [T({ jenis: 'Saldo awal', jumlah: 10 }), T({ jenis: 'Pinjamkan', jumlah: 4, link_id: 'PT-001' })];
  const bal = L.balances(trx);
  const prices = { 'AS-EMAS': { harga: 1000, mata_uang: 'IDR' } };
  const tanpa = V.nilai({ bal, aset, anggota, prices, kursUsd: 16000 });
  assert.equal(tanpa.salinan, 6000);
  const dengan = V.nilai({ bal, aset, anggota, prices, kursUsd: 16000, piutang: [{ pemberi_anggota_id: 'PM-1', aset_id: 'AS-EMAS', sisa: 4 }] });
  assert.equal(dengan.salinan, 10000);
  assert.equal(dengan.piutang, 4000);
});

test('untung/rugi: hanya bagian bermodal; sebagian ditandai', () => {
  const r = L.costBasis([T({ jenis: 'Beli', jumlah: 10, harga_per_unit: 100 }), T({ jenis: 'Masuk', jumlah: 5 })]);
  const u = V.untung(r.posisi['PM-1|AS-EMAS'], 150);
  assert.equal(u.untung, 500); assert.equal(u.persen, 50); assert.equal(u.sebagian, true);
  assert.equal(V.untung(null, 1), null);
});

const piut = o => Object.assign({ piutang_id: 'PT-001', pemberi_anggota_id: 'PM-1', peminjam_nama: 'Budi', aset_id: 'AS-EMAS', lokasi_id: 'LK-1',
  jumlah_pokok: 12, cara: 'cicilan', jumlah_cicilan: 3, mulai_atau_jatuh_tempo: '2026-12-15', status: 'berjalan' }, o);

test('piutang: jadwal tanggal 15 dan akhir bulan, sisa pembulatan di cicilan terakhir', () => {
  const j = PT.jadwal(piut({ jumlah_pokok: 10, mulai_atau_jatuh_tempo: '2026-01-31' }));
  assert.deepEqual(j.map(x => x.tanggal), ['2026-01-31', '2026-02-28', '2026-03-31']);
  assert.equal(j.reduce((s, x) => s + x.jumlah, 0), 10);
  assert.equal(PT.jadwal(piut({ cara: 'sekali' })).length, 1);
});

test('piutang: bayar cicilan paling lama lebih dulu, terlambat dihitung bukan disimpan', () => {
  const p = piut({ mulai_atau_jatuh_tempo: '2026-09-15' }); // 15 Sep, 15 Okt, 15 Nov; masing-masing 4
  const trx = [T({ jenis: 'Cicilan diterima', jumlah: 5, link_id: 'PT-001', tanggal: '2026-10-20' })];
  const s = PT.status(p, trx, '2026-11-20');
  assert.deepEqual(s.jadwal.map(c => c.status), ['lunas', 'terlambat', 'terlambat']);
  assert.equal(s.jadwal[1].terbayar, 1);
  assert.equal(s.sisa, 7);
  assert.equal(s.tunggakan, 7);
  assert.equal(s.cicilanTerlambat, 2);
  assert.equal(s.hariTerlambat, 36); // dari 15 Okt
  assert.equal(s.lunas, false);
  const tepat = PT.status(p, [], '2026-09-15');
  assert.equal(tepat.jatuhTempoHariIni, true);
  assert.equal(tepat.terlambat, false);
});

test('piutang: lunas, dihapus tidak dihitung, validasi melebihi sisa, jenis penerimaan', () => {
  const p = piut({ cara: 'sekali', jumlah_pokok: 4, mulai_atau_jatuh_tempo: '2026-12-01' });
  const trx = [T({ jenis: 'Pelunasan diterima', jumlah: 4, link_id: 'PT-001' }), T({ jenis: 'Cicilan diterima', jumlah: 9, link_id: 'PT-001', status: 'dihapus' })];
  const s = PT.status(p, trx, '2026-12-05');
  assert.equal(s.lunas, true); assert.equal(s.terlambat, false); assert.equal(s.sisa, 0);
  assert.equal(PT.validasiTerima(2, 3), 'jumlah:melebihi-sisa');
  assert.equal(PT.validasiTerima(2, 2), '');
  assert.equal(PT.jenisPenerimaan(4, 4), 'Pelunasan diterima');
  assert.equal(PT.jenisPenerimaan(4, 1), 'Cicilan diterima');
});

test('piutang: pinjam keluar dari saldo pemberi dan cicilan kembali ke lokasi asal', () => {
  const p = piut({ jumlah_pokok: 6, lokasi_id: 'LK-9' });
  const trx = [T({ jenis: 'Saldo awal', jumlah: 10, lokasi_id: 'LK-9' }), PT.trxPinjam(p, { tanggal: '2026-11-02' })];
  trx.forEach((t, i) => { t.trx_id = 'X' + i; });
  assert.equal(L.balances(trx)[L.key('PM-1', 'AS-EMAS', 'LK-9')], 4);
  const back = PT.trxTerima(p, 6, 2, { tanggal: '2026-12-15' }); back.trx_id = 'X9';
  assert.equal(back.jenis, 'Cicilan diterima');
  assert.equal(L.balances(trx.concat([back]))[L.key('PM-1', 'AS-EMAS', 'LK-9')], 6);
});

// Zakat
const zIn = (trx, extra) => Object.assign({ trx, aset, anggota: [anggota[0]], bayar: [], pengaturan: { nisab_emas_gram: 85, nisab_perak_gram: 595, tarif_zakat: 0.025, haul_hari: 354 },
  hariIni: '2026-11-19', hargaGram: { emas: 2000000, perak: 40000 } }, extra || {});
const emas = rows => rows.find(r => r.logam === 'emas');

test('zakat: di bawah nisab = belum nisab; USDT dan saham tidak dihitung', () => {
  const r = Z.hitung(zIn([T({ jenis: 'Saldo awal', jumlah: 84.9 }), T({ jenis: 'Saldo awal', aset_id: 'AS-USDT', jumlah: 99999 }), T({ jenis: 'Saldo awal', aset_id: 'AS-GFI', jumlah: 999 })]));
  assert.equal(emas(r).status_haul, 'belum nisab');
  assert.equal(emas(r).gram_fisik, 84.9);
  assert.equal(emas(r).zakat_idr, null);
});

test('zakat: haul mulai saat nisab tercapai, token dihitung per gram (PAXG 1 oz), fisik dan digital terpisah', () => {
  const r = emas(Z.hitung(zIn([T({ jenis: 'Saldo awal', jumlah: 60, tanggal: '2026-05-01' }), T({ jenis: 'Beli', aset_id: 'AS-PAXG', jumlah: 1, harga_per_unit: 1, harga_mata_uang: 'USD', kurs: 16000, tanggal: '2026-06-10' })])));
  assert.equal(r.mulai_haul, '2026-06-10');
  assert.equal(r.status_haul, 'berjalan');
  assert.equal(r.jatuh_tempo, '2027-05-30');
  assert.equal(r.gram_fisik, 60);
  assert.equal(r.gram_digital, 31.1035);
  assert.equal(r.hari_tersisa, 192);
});

test('zakat: turun di bawah nisab mengosongkan haul, naik lagi memulai baru', () => {
  const trx = [T({ jenis: 'Saldo awal', jumlah: 100, tanggal: '2026-01-10' }), T({ jenis: 'Keluar', jumlah: 30, tanggal: '2026-03-01' }), T({ jenis: 'Beli', jumlah: 20, harga_per_unit: 1, tanggal: '2026-08-20' })];
  const r = emas(Z.hitung(zIn(trx)));
  assert.equal(r.mulai_haul, '2026-08-20');
});

test('zakat: kenaikan saldo selama haul tidak mengulang; jatuh tempo, terlambat, dan jumlah zakat', () => {
  const trx = [T({ jenis: 'Saldo awal', jumlah: 100, tanggal: '2025-11-01' }), T({ jenis: 'Beli', jumlah: 20, harga_per_unit: 1, tanggal: '2026-02-01' })];
  const due = emas(Z.hitung(zIn(trx, { hariIni: '2026-10-21' }))); // 2025-11-01 + 354 = 2026-10-21
  assert.equal(due.jatuh_tempo, '2026-10-21');
  assert.equal(due.status_haul, 'jatuh tempo');
  assert.equal(due.saldo_akhir_haul, 120);
  assert.equal(due.zakat_idr, Math.round(120 * 2000000 * 0.025));
  assert.equal(due.wajib, true);
  const late = emas(Z.hitung(zIn(trx, { hariIni: '2026-11-05' })));
  assert.equal(late.status_haul, 'terlambat');
  assert.equal(late.hari_tersisa, -15);
  const run = emas(Z.hitung(zIn(trx, { hariIni: '2026-06-01' })));
  assert.equal(run.status_haul, 'berjalan');
  assert.equal(run.wajib, false);
});

test('zakat: bayar menutup haul; haul baru mulai di tanggal bayar hanya bila sisa >= nisab', () => {
  const trx = [T({ jenis: 'Saldo awal', jumlah: 200, tanggal: '2025-01-01' })];
  const haul = 'HL-PM-1-emas-2025-01-01';
  const bayar = [{ bayar_id: 'ZB-001', haul_id: haul, anggota_id: 'PM-1', logam: 'emas', jumlah_idr: 1, tanggal_bayar: '2026-01-20', sumber: 'luar', status: 'aktif' }];
  const ok = emas(Z.hitung(zIn(trx, { bayar, hariIni: '2026-03-01' })));
  assert.equal(ok.mulai_haul, '2026-01-20');
  assert.equal(ok.status_haul, 'berjalan');
  // dibayar dari aset: gram turun di bawah nisab pada hari yang sama
  const trx2 = [T({ jenis: 'Saldo awal', jumlah: 86, tanggal: '2025-01-01' }), T({ jenis: 'Zakat', jumlah: 2.15, tanggal: '2026-01-20', link_id: 'ZB-001' })];
  const low = emas(Z.hitung(zIn(trx2, { bayar: [Object.assign({}, bayar[0], { sumber: 'aset' })], hariIni: '2026-03-01' })));
  assert.equal(low.status_haul, 'dibayar');
  assert.equal(low.mulai_haul, '2025-01-01');
  // pembayaran dihapus (Urungkan) memulihkan haul berjalan/terlambat
  const undone = emas(Z.hitung(zIn(trx, { bayar: [Object.assign({}, bayar[0], { status: 'dihapus' })], hariIni: '2026-03-01' })));
  assert.equal(undone.mulai_haul, '2025-01-01');
});

test('zakat: emas dipinjamkan tidak dihitung dan haul bisa terputus; kembali dihitung lagi', () => {
  const trx = [T({ jenis: 'Saldo awal', jumlah: 100, tanggal: '2026-01-01' }), T({ jenis: 'Pinjamkan', jumlah: 50, link_id: 'PT-1', tanggal: '2026-03-01' })];
  assert.equal(emas(Z.hitung(zIn(trx))).status_haul, 'belum nisab');
  const kembali = trx.concat([T({ jenis: 'Pelunasan diterima', jumlah: 50, link_id: 'PT-1', tanggal: '2026-09-01' })]);
  assert.equal(emas(Z.hitung(zIn(kembali))).mulai_haul, '2026-09-01');
});

test('zakat: perak dan emas terpisah, per anggota', () => {
  const r = Z.hitung(zIn([T({ jenis: 'Saldo awal', aset_id: 'AS-PERAK', jumlah: 600, tanggal: '2026-02-01' }), T({ jenis: 'Saldo awal', jumlah: 10, anggota_id: 'PM-2' })], { anggota }));
  assert.equal(r.length, 4);
  assert.equal(r.find(x => x.logam === 'perak' && x.anggota_id === 'PM-1').status_haul, 'berjalan');
  assert.equal(r.find(x => x.logam === 'emas' && x.anggota_id === 'PM-1').status_haul, 'belum nisab');
  assert.equal(r.find(x => x.logam === 'emas' && x.anggota_id === 'PM-2').gram_fisik, 10);
});

test('antrean offline: id sama tidak dobel, server idempoten, ditolak tetap di antrean', () => {
  let q = [];
  const a = { trx_id: 'TX-20261109-0001', jenis: 'Beli' }, b = { trx_id: 'TX-20261109-0002', jenis: 'Jual' };
  q = Q.enqueue(q, a); q = Q.enqueue(q, a); q = Q.enqueue(q, b);
  assert.equal(q.length, 2);
  assert.equal(q[0].trx.sumber, 'offline');
  const srv = Q.dedupe(['TX-20261109-0001'], Q.pending(q));
  assert.deepEqual(srv.duplikat, ['TX-20261109-0001']);
  assert.equal(srv.baru.length, 1);
  assert.equal(Q.dedupe([], [a, a]).baru.length, 1);
  const left = Q.settle(q, { diterima: [], duplikat: ['TX-20261109-0001'], ditolak: [{ trx_id: 'TX-20261109-0002', error: 'saldo:kurang:AS-EMAS' }] });
  assert.equal(left.length, 1);
  assert.equal(left[0].tries, 1);
  assert.equal(left[0].error, 'saldo:kurang:AS-EMAS');
  assert.equal(Q.settle(left, { diterima: ['TX-20261109-0002'] }).length, 0);
});
