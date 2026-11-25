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
const engine = ['engine/schema.js', 'engine/catalog.js', 'engine/ledger.js', 'engine/queue.js', 'engine/catat.js', 'engine/catat-ctx.js', 'demo/catat-demo.js'];
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

test('Bayar dari lokasi lain diblokir di data nyata sampai kolom alat_bayar_lokasi_id ada', () => {
  const trx = [{ trx_id: 'TX-1', tanggal: '2026-11-20', jenis: 'Saldo awal', anggota_id: 'PM-001', aset_id: 'AS-USDT', lokasi_id: 'LK-002', jumlah: 500, status: 'aktif' },
    { trx_id: 'TX-2', tanggal: '2026-11-20', jenis: 'Saldo awal', anggota_id: 'PM-001', aset_id: 'AS-PAXG', lokasi_id: 'LK-001', jumlah: 1, status: 'aktif' }];
  const { c, ctx } = real(trx);
  const v = c.HF.catat.view({ fJ: 'Beli', fA: 'PAXG', fL: 'Binance', pay: 'USDT@Brankas', qv: '0,1', pv: '4.425' }, ctx, { mulai: 'beli' });
  assert.equal(v.pay, 'USDT@Brankas'); assert.equal(v.invalid, true);
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
