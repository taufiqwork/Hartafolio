// Uji layar Catat: model tampilan (engine/catat.js), pemetaan ke baris Transaksi (catat-ctx.js) dan penyimpanan (catat-save.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const src = (p) => fs.readFileSync(path.join(__dirname, '..', 'src', p), 'utf8');
function load(files, extra) {
  const ctx = vm.createContext(Object.assign({ console, Math, Date, Object, Array, String, Number, JSON, Promise, Intl }, extra || {}));
  ctx.globalThis = ctx;
  files.forEach((f) => vm.runInContext(src(f), ctx, { filename: f }));
  return ctx;
}
const engine = ['engine/schema.js', 'engine/catalog.js', 'engine/ledger.js', 'engine/queue.js', 'engine/angka.js', 'engine/catat.js', 'engine/catat-ctx.js', 'demo/catat-demo.js'];
const E = () => load(engine);

test('Beli PAXG contoh: total sama dengan board (99,66 USDT · Rp 1,64 jt), alat bayar USDT di Binance', () => {
  const c = E(), ctx = c.HF.demo.catat(), vmod = c.HF.catat.view({}, ctx, { mulai: 'beli' });
  assert.equal(vmod.totValue, '99,66 USDT · Rp 1,64 jt');
  assert.equal(vmod.pay, 'USDT@Binance');
  assert.equal(vmod.fA, 'PAXG'); assert.equal(vmod.fL, 'Binance'); assert.equal(vmod.invalid, false);
});

test('Jual melebihi saldo: kesalahan saldo, tombol Simpan redup; Keluar dan Pindah sama', () => {
  const c = E(), ctx = c.HF.demo.catat();
  const j = c.HF.catat.view({ qv: '99' }, ctx, { mulai: 'jual' });
  assert.equal(j.qErr, true); assert.equal(j.invalid, true); assert.match(j.balTxt, /Melebihi saldo Azlan di Pluang: 3,7 lembar/);
  assert.equal(c.HF.catat.view({ qv: '700' }, ctx, { mulai: 'keluar' }).qErr, true);
  assert.equal(c.HF.catat.view({ qv: '9' }, ctx, { mulai: 'pindah' }).qErr, true);
});

test('Bayar dengan USDT yang tidak cukup: payErr dan catatan merah', () => {
  const c = E(), v = c.HF.catat.view({ qv: '10' }, c.HF.demo.catat(), { mulai: 'bayar-bybit' });
  assert.equal(v.payErr, true); assert.match(v.payNote, /Saldo USDT di Bybit hanya 150/);
});

test('Kalender November 2026: 36 sel, hari ini 11, hari setelahnya mati, bulan berikutnya mati', () => {
  const c = E(), cal = c.HF.catat.view({}, c.HF.demo.catat(), { mulai: 'beli' }).cal;
  assert.equal(cal.cells.length, 36); assert.equal(cal.title, 'November 2026'); assert.equal(cal.nextOff, true);
  const d = (n) => cal.cells.filter((x) => x.n === n)[0];
  assert.equal(d(11).on, 'true'); assert.equal(d(12).off, true); assert.equal(d(10).off, false);
  const past = c.HF.catat.view({ mo: -1 }, c.HF.demo.catat(), { mulai: 'beli' }).cal;
  assert.equal(past.title, 'Oktober 2026'); assert.equal(past.nextOff, false); assert.equal(past.cells.filter((x) => x.off && x.n).length, 0);
});

test('Tanggal lalu: kurs memakai rata-rata hari itu, bukan real-time', () => {
  const c = E(), v = c.HF.catat.view({}, c.HF.demo.catat(), { mulai: 'tanggal-lalu' });
  assert.equal(v.isToday, false); assert.equal(v.kvLive, false); assert.equal(v.kursNote, 'Rata-rata 10 Nov');
});

// Data nyata: harga dan kurs manual
const STATE = {
  anggota: [{ anggota_id: 'PM-001', nama: 'Azlan', aktif: true }, { anggota_id: 'PM-002', nama: 'Yumna', aktif: true }],
  lokasi: [{ lokasi_id: 'LK-001', nama: 'Binance', aktif: true }, { lokasi_id: 'LK-002', nama: 'Brankas', aktif: true }],
  aset: [], transaksi: []
};
const PX = [['PAXG', '', 'Emas', 'token']];
function real(trx) {
  const c = E(); const s = JSON.parse(JSON.stringify(STATE)); s.aset = c.HF.catalog.all(); s.transaksi = trx || [];
  return { c, s, ctx: c.HF.catatCtx.fromState(s, { y: 2026, m: 11, d: 25, hh: 9, mm: 5 }) };
}

test('Data nyata tanpa transaksi: tidak ada aset dipegang, harga kosong, kurs diisi manual', () => {
  const { c, ctx } = real();
  assert.deepEqual(JSON.parse(JSON.stringify(ctx.held['Azlan'])), []);
  const v = c.HF.catat.view({}, ctx, { mulai: 'beli' });
  assert.equal(v.fA, null); assert.equal(v.demo, undefined);
  const v2 = c.HF.catat.view({ ext: PX, fA: 'PAXG', fL: 'Binance', qv: '0,5', pv: '4.425' }, ctx, { mulai: 'beli' });
  assert.equal(v2.cur, 'USD'); assert.equal(v2.showKurs, true); assert.equal(v2.kv, ''); assert.match(v2.kursNote, /Isi sendiri/);
  assert.equal(v2.incomplete, true); // kurs belum diisi
  const v3 = c.HF.catat.view({ ext: PX, fA: 'PAXG', fL: 'Binance', qv: '0,5', pv: '4.425', kv: '16.250' }, ctx, { mulai: 'beli' });
  assert.equal(v3.incomplete, false); assert.equal(v3.rate, 16250);
});

test('Baris Beli dari data nyata lolos validasi engine; saldo awal juga; kurs manual ditandai', () => {
  const { c, ctx } = real();
  const v = c.HF.catat.view({ ext: PX, fA: 'PAXG', fL: 'Binance', qv: '0,5', pv: '4.425', kv: '16.250', fee: '0' }, ctx, { mulai: 'beli' });
  const res = c.HF.catatCtx.toRows(v, ctx, {});
  assert.equal(res.error, null); const t = res.rows[0];
  assert.deepEqual([t.jenis, t.anggota_id, t.aset_id, t.lokasi_id, t.jumlah, t.harga_per_unit, t.harga_mata_uang, t.kurs, t.kurs_sumber], ['Beli', 'PM-001', 'AS-PAXG', 'LK-001', 0.5, 4425, 'USD', 16250, 'manual']);
  t.trx_id = 'TX-20261125-0001'; t.status = 'aktif';
  assert.equal(c.HF.ledger.validate(t, { trxList: [], asetIds: Object.values(ctx.ids.aset), anggotaIds: ['PM-001'], lokasiIds: ['LK-001'] }).length, 0);
  const a = c.HF.catat.view({ ext: [['BTC', '', 'Crypto', 'koin']], fA: 'BTC', fL: 'Binance', qv: '0,1', avg: '1.200.000.000' }, ctx, { mulai: 'awal' });
  const ra = c.HF.catatCtx.toRows(a, ctx, { avg: '1.200.000.000' }).rows[0];
  assert.equal(ra.jenis, 'Saldo awal'); assert.equal(ra.harga_beli_rata2, 1200000000);
});

test('Setelah transaksi tersimpan, aset muncul di Catat berikutnya dengan saldo; Jual melebihi saldo ditolak layar', () => {
  const trx = [{ trx_id: 'TX-1', tanggal: '2026-11-20', jenis: 'Saldo awal', anggota_id: 'PM-001', aset_id: 'AS-PAXG', lokasi_id: 'LK-001', jumlah: 0.52, status: 'aktif' }];
  const { c, ctx } = real(trx);
  assert.deepEqual(JSON.parse(JSON.stringify(ctx.held['Azlan'])), [['PAXG', ['Binance']]]);
  const v = c.HF.catat.view({ fJ: 'Jual', qv: '1' }, ctx, { mulai: 'beli' });
  assert.equal(v.fA, 'PAXG'); assert.equal(v.qErr, true);
});

test('Bayar dari lokasi lain di data nyata: boleh, baris membawa alat_bayar_lokasi_id, lolos validasi dan mengurangi lokasi pembayar', () => {
  const trx = [{ trx_id: 'TX-1', tanggal: '2026-11-20', jenis: 'Saldo awal', anggota_id: 'PM-001', aset_id: 'AS-USDT', lokasi_id: 'LK-002', jumlah: 500, status: 'aktif' },
    { trx_id: 'TX-2', tanggal: '2026-11-20', jenis: 'Saldo awal', anggota_id: 'PM-001', aset_id: 'AS-PAXG', lokasi_id: 'LK-001', jumlah: 1, status: 'aktif' }];
  const { c, ctx, s } = real(trx);
  const v = c.HF.catat.view({ fJ: 'Beli', fA: 'PAXG', fL: 'Binance', pay: 'USDT@Brankas', qv: '0,1', pv: '4.000', kv: '1', fee: '0' }, ctx, { mulai: 'beli' });
  assert.equal(v.pay, 'USDT@Brankas'); assert.equal(v.invalid, false);
  const t = c.HF.catatCtx.toRows(v, ctx, {}).rows[0];
  assert.equal(t.alat_bayar_aset_id, 'AS-USDT'); assert.equal(t.alat_bayar_lokasi_id, 'LK-002'); assert.equal(t.lokasi_id, 'LK-001');
  t.trx_id = 'TX-3'; t.status = 'aktif';
  assert.equal(c.HF.ledger.validate(t, { trxList: trx, lokasiIds: ['LK-001', 'LK-002'] }).length, 0);
  const b = c.HF.ledger.balances(trx.concat([t]));
  assert.equal(b[c.HF.ledger.key('PM-001', 'AS-USDT', 'LK-002')], 500 - 400);
});

test('Biaya Pindah dalam Rupiah: satu baris Pindah, kolom biaya = Rp dibagi harga, dipotong dari lokasi asal; tanpa harga ditandai belum lengkap', () => {
  const trx = [{ trx_id: 'TX-1', tanggal: '2026-11-20', jenis: 'Saldo awal', anggota_id: 'PM-001', aset_id: 'AS-EMAS', lokasi_id: 'LK-002', jumlah: 10, status: 'aktif' }];
  const mk = (harga) => { const c = E(); const s = JSON.parse(JSON.stringify(STATE)); s.aset = c.HF.catalog.all(); s.transaksi = trx; s.harga = harga; return { c, ctx: c.HF.catatCtx.fromState(s, { y: 2026, m: 11, d: 25, hh: 9, mm: 5 }) }; };
  const st = { fJ: 'Pindah', fA: 'Emas fisik', fL: 'Brankas', fK: 'Binance', qv: '2', fee: '47.600' };
  const sans = mk({ terakhir: {}, kursSeries: [] });
  const v0 = sans.c.HF.catat.view(st, sans.ctx, { mulai: 'pindah' });
  assert.equal(v0.incomplete, true); assert.match(v0.feeNote, /belum ada/);
  assert.equal(sans.c.HF.catatCtx.toRows(v0, sans.ctx, {}).error, 'biaya-rupiah');
  const ada = mk({ terakhir: { 'AS-EMAS': { harga: 2380000, mata_uang: 'IDR' } }, kursSeries: [] });
  const v = ada.c.HF.catat.view(st, ada.ctx, { mulai: 'pindah' });
  assert.equal(v.incomplete, false);
  const rows = ada.c.HF.catatCtx.toRows(v, ada.ctx, {}).rows;
  assert.equal(rows.length, 1); assert.equal(rows[0].jenis, 'Pindah'); assert.equal(rows[0].biaya, 0.02); assert.equal(rows[0].jumlah, 2);
  const all = rows.map((r, i) => Object.assign(r, { trx_id: 'TX-9' + i, status: 'aktif' }));
  const b = ada.c.HF.ledger.balances(trx.concat(all));
  assert.equal(b[ada.c.HF.ledger.key('PM-001', 'AS-EMAS', 'LK-002')], 10 - 2 - 0.02);
  assert.equal(b[ada.c.HF.ledger.key('PM-001', 'AS-EMAS', 'LK-001')], 2);
  // biaya dalam satuan aset tidak butuh harga
  const v2 = sans.c.HF.catat.view(Object.assign({}, st, { fu: 'gram', fee: '0,5' }), sans.ctx, { mulai: 'pindah' });
  assert.equal(v2.incomplete, false); assert.equal(sans.c.HF.catatCtx.toRows(v2, sans.ctx, {}).rows[0].biaya, 0.5);
});

test('Pajak ikut total (Beli menambah, Jual mengurangi) dan tersimpan di kolom pajak; catatan tersimpan', () => {
  const c = E(), ctx = c.HF.demo.catat();
  assert.equal(c.HF.catat.view({ pajakV: '0,05' }, ctx, { mulai: 'beli' }).totValue, '99,71 USDT · Rp 1,64 jt');
  const j = c.HF.catat.view({ pajakV: '0,05' }, ctx, { mulai: 'jual' });
  assert.equal(c.HF.catat.view({}, ctx, { mulai: 'jual' }).totValue === j.totValue, false);
  const { c: r, ctx: rc } = real();
  const v = r.HF.catat.view({ ext: PX, fA: 'PAXG', fL: 'Binance', qv: '1', pv: '4.425', kv: '16.250', fee: '0', pajakV: '1,5', catatanV: ' beli rutin ' }, rc, { mulai: 'beli' });
  const t = r.HF.catatCtx.toRows(v, rc, { pajak: '1,5', catatan: ' beli rutin ' }).rows[0];
  assert.equal(t.pajak, 1.5); assert.equal(t.catatan, 'beli rutin');
});

test('Simpan ditekan saat belum lengkap: daftar yang kurang, garis merah, dan Simpan tidak lolos', () => {
  const { c, ctx } = real();
  const kosong = c.HF.catat.view({ tried: true }, ctx, { mulai: 'beli' });
  assert.deepEqual(JSON.parse(JSON.stringify(kosong.missing)), ['aset', 'jumlah', 'harga']); assert.equal(kosong.missTxt, 'Lengkapi dulu: aset, jumlah, harga.');
  const v = c.HF.catat.view({ tried: true, ext: PX, fA: 'PAXG', fL: 'Binance', qv: '0,5', pv: '4.425' }, ctx, { mulai: 'beli' });
  assert.deepEqual(JSON.parse(JSON.stringify(v.missing)), ['kurs']); assert.equal(v.kMiss, true); assert.equal(v.pMiss, false); assert.equal(v.incomplete, true);
  const belum = c.HF.catat.view({ ext: PX, fA: 'PAXG', fL: 'Binance' }, ctx, { mulai: 'beli' });
  assert.equal(belum.missOn, false); // pesan baru muncul sesudah Simpan diketuk
  const e = E(), demo = e.HF.catat.view({ tried: true, qv: '', pv: '' }, e.HF.demo.catat(), { mulai: 'beli' });
  assert.equal(demo.missTxt, 'Lengkapi dulu: jumlah, harga.');
});

test('Mode contoh: Simpan tidak error (id palsu), baris hanya untuk perangkat; semua jenis menghasilkan baris', () => {
  const c = E(), ctx = c.HF.demo.catat();
  ['beli', 'jual', 'masuk', 'keluar', 'pindah', 'pindah-anggota', 'bayar-bybit'].forEach((m) => {
    const v = c.HF.catat.view({}, ctx, { mulai: m });
    const r = c.HF.catatCtx.toRows(v, ctx, {});
    assert.ok(r.rows && r.rows.length >= 1, m); assert.match(r.rows[0].anggota_id, /^PM-D/); assert.ok(r.rows[0].aset_id, m);
  });
});

test('Galat angka: titik dipakai sebagai desimal memblokir Simpan dan menawarkan perbaikan; yang ragu baru muncul setelah kolom ditinggalkan', () => {
  const c = E(), ctx = c.HF.demo.catat();
  const v = c.HF.catat.view({ qv: '0.0225' }, ctx, { mulai: 'beli' });
  assert.equal(v.nErr.qv.perbaiki, '0,0225'); assert.equal(v.invalid, true); assert.equal(v.incomplete, true);
  const ragu = c.HF.catat.view({ pv: '2.5' }, ctx, { mulai: 'beli' }); assert.equal(Object.keys(ragu.nErr).length, 0);
  const sesudah = c.HF.catat.view({ pv: '2.5', nBlur: { pv: true } }, ctx, { mulai: 'beli' }); assert.equal(sesudah.nErr.pv.perbaiki, '2,5');
  const ing = c.HF.catat.view({ pv: '1,234.56' }, ctx, { mulai: 'beli' }); assert.equal(ing.nErr.pv.perbaiki, '1.234,56');
  assert.equal(Object.keys(c.HF.catat.view({ qv: '0,0225', pv: '4.425' }, ctx, { mulai: 'beli' }).nErr).length, 0);
});

test('Simpan: data contoh hanya ke perangkat dan tidak pernah memanggil server; data nyata lewat antrean', async () => {
  const store = {}; let calls = [];
  const c = load(['engine/schema.js', 'engine/queue.js', 'web/js/catat-save.js'], {
    localStorage: { getItem: (k) => store[k] || null, setItem: (k, v) => { store[k] = v; } },
    HF: { api: { call: (n, a) => { calls.push(n); return Promise.resolve({ diterima: a.map((t) => t.trx_id), duplikat: [], ditolak: [] }); } } }
  });
  const row = { tanggal: '2026-11-25', jenis: 'Beli', jumlah: 1 };
  await c.HF.catatSave.submit([row], true);
  assert.equal(calls.length, 0); assert.equal(JSON.parse(store['hf-demo-trx']).length, 1); assert.equal(store['hf-queue'], undefined);
  await c.HF.catatSave.submit([row], false);
  assert.deepEqual(calls, ['apiTransaksiTambah']); assert.equal(c.HF.catatSave.pending(), 0);
  assert.notEqual(JSON.parse(store['hf-demo-trx'])[0].trx_id, undefined);
});

// ---- Ubah transaksi: keadaan awal dari baris, lalu kembali ke baris yang sama ----
test('Ubah: stateOfTrx lalu toRows mengembalikan kolom yang sama (Beli bayar USDT, Jual, Keluar, Pindah lokasi, Pindah anggota)', () => {
  const T = (o) => Object.assign({ status: 'aktif', anggota_id: 'PM-001', jam: '09:12', sumber: 'manual', lokasi_id: 'LK-001' }, o);
  const trx = [
    T({ trx_id: 'S1', jenis: 'Saldo awal', tanggal: '2026-11-01', aset_id: 'AS-USDT', jumlah: 500 }),
    T({ trx_id: 'S2', jenis: 'Saldo awal', tanggal: '2026-11-01', aset_id: 'AS-PAXG', jumlah: 1 }),
    T({ trx_id: 'B1', jenis: 'Beli', tanggal: '2026-11-04', aset_id: 'AS-PAXG', jumlah: 0.0225, harga_per_unit: 4425, harga_mata_uang: 'USDT', biaya: 0.1, kurs: 16500, kurs_sumber: 'otomatis', alat_bayar_aset_id: 'AS-USDT', alat_bayar_lokasi_id: 'LK-001', bukti: 'INV-1 https://drive.google.com/file/d/X/view', catatan: 'rutin', pajak: 0.5 }),
    T({ trx_id: 'J1', jenis: 'Jual', tanggal: '2026-11-05', aset_id: 'AS-PAXG', jumlah: 0.5, harga_per_unit: 70000000, harga_mata_uang: 'IDR', biaya: 1000 }),
    T({ trx_id: 'K1', jenis: 'Keluar', tanggal: '2026-11-06', aset_id: 'AS-PAXG', jumlah: 0.1, asal_alasan: 'Sedekah' }),
    T({ trx_id: 'P1', jenis: 'Pindah', tanggal: '2026-11-07', aset_id: 'AS-PAXG', jumlah: 0.2, lokasi_tujuan_id: 'LK-002' }),
    T({ trx_id: 'P2', jenis: 'Pindah', tanggal: '2026-11-08', aset_id: 'AS-PAXG', jumlah: 0.1, anggota_tujuan_id: 'PM-002', lokasi_tujuan_id: 'LK-002' })
  ];
  const { c, s } = real(trx); const now = { y: 2026, m: 11, d: 27, hh: 9, mm: 5 };
  ['B1', 'J1', 'K1', 'P1', 'P2'].forEach((id) => {
    const t = trx.filter((x) => x.trx_id === id)[0], ctx = c.HF.catatCtx.forUbah(s, t, now);
    const st = c.HF.catatCtx.stateOfTrx(t, ctx), v = c.HF.catat.view(st, ctx, { mulai: 'ubah' });
    assert.equal(v.isUbah, true, id); assert.equal(v.showJenis, false, id); assert.equal(v.fJ, t.jenis, id); assert.equal(v.invalid, false, id + ' ' + JSON.stringify(v.missing));
    const r = c.HF.catatCtx.toRows(v, ctx, { nomor: st.nota, pajak: st.pajakV, catatan: st.catatanV }).rows[0];
    ['tanggal', 'jam', 'anggota_id', 'aset_id', 'lokasi_id', 'jumlah', 'harga_per_unit', 'harga_mata_uang', 'biaya', 'pajak', 'alat_bayar_aset_id', 'alat_bayar_lokasi_id', 'lokasi_tujuan_id', 'anggota_tujuan_id', 'asal_alasan', 'catatan', 'kurs'].forEach((k) => {
      if (t[k] === undefined) return;
      assert.equal(r[k], t[k], id + ' ' + k);
    });
  });
  assert.equal(c.HF.catatCtx.forUbah(s, Object.assign({}, trx[0], { aset_id: 'AS-TIDAK-ADA' }), now), null);
  assert.equal(c.HF.catatCtx.forUbah(s, trx[2], now).ubah.dicatat, '4 Nov 2026');
});

test('Ubah Pindah dengan biaya: keadaan awal membawa biaya dalam satuan aset dan kembali ke baris yang sama', () => {
  const T = (o) => Object.assign({ status: 'aktif', anggota_id: 'PM-001', jam: '09:12', sumber: 'manual', lokasi_id: 'LK-001' }, o);
  const trx = [T({ trx_id: 'S', jenis: 'Saldo awal', tanggal: '2026-11-01', aset_id: 'AS-EMAS', jumlah: 10 }),
    T({ trx_id: 'P', jenis: 'Pindah', tanggal: '2026-11-07', aset_id: 'AS-EMAS', jumlah: 2, biaya: 0.02, lokasi_tujuan_id: 'LK-002' })];
  const { c, s } = real(trx), now = { y: 2026, m: 11, d: 27, hh: 9, mm: 5 };
  const ctx = c.HF.catatCtx.forUbah(s, trx[1], now), st = c.HF.catatCtx.stateOfTrx(trx[1], ctx), v = c.HF.catat.view(st, ctx, { mulai: 'ubah' });
  assert.equal(v.hasFee, true); assert.equal(v.feeUnit, 'gram'); assert.equal(v.invalid, false);
  const rows = c.HF.catatCtx.toRows(v, ctx, {}).rows;
  assert.equal(rows.length, 1); assert.equal(rows[0].biaya, 0.02); assert.equal(rows[0].jumlah, 2); assert.equal(rows[0].lokasi_tujuan_id, 'LK-002');
});
