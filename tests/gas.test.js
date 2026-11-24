// Uji lapisan Apps Script dengan Sheet tiruan di memori: memuat engine + Repo.js + Setup.js ke satu konteks vm.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fakeSheet(name) {
  // Sheet baru di Google: 1000 baris x 26 kolom. Menulis atau memformat di luar grid melempar galat.
  const g = { name, cells: [], protections: [], frozen: 0, maxR: 1000, maxC: 26 };
  const inGrid = (r, c, nr, nc) => {
    if (r < 1 || c < 1 || r + nr - 1 > g.maxR || c + nc - 1 > g.maxC) throw new Error('The coordinates of the range are outside the dimensions of the sheet.');
  };
  g.getMaxRows = () => g.maxR;
  g.getMaxColumns = () => g.maxC;
  g.insertRowsAfter = (_, n) => { g.maxR += n; };
  g.insertColumnsAfter = (_, n) => { g.maxC += n; };
  const get = (r, c) => (g.cells[r - 1] && g.cells[r - 1][c - 1] !== undefined ? g.cells[r - 1][c - 1] : '');
  const set = (r, c, v) => { (g.cells[r - 1] = g.cells[r - 1] || [])[c - 1] = v; };
  const chain = () => { const o = {}; ['setFontWeight', 'setBackground', 'setNumberFormat', 'setDescription', 'setWarningOnly'].forEach(k => { o[k] = () => o; }); return o; };
  g.getLastRow = () => { let l = 0; g.cells.forEach((row, i) => { if (row && row.some(v => v !== undefined && v !== '')) l = i + 1; }); return l; };
  g.getLastColumn = () => g.cells.reduce((m, row) => Math.max(m, row ? row.length : 0), 0);
  g.setFrozenRows = n => { g.frozen = n; };
  g.getProtections = () => g.protections;
  g.getRange = (r, c, nr = 1, nc = 1) => (inGrid(r, c, nr, nc), Object.assign(chain(), {
    getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => get(r + i, c + j))),
    setValues: vals => { vals.forEach((row, i) => row.forEach((v, j) => set(r + i, c + j, v))); },
    setValue: v => set(r, c, v),
    protect: () => { const p = Object.assign(chain(), { getDescription: () => 'Header Hartafolio' }); g.protections.push(p); return p; }
  }));
  return g;
}

function boot() {
  const sheets = {};
  const ss = {
    getSheetByName: n => sheets[n] || null,
    insertSheet: n => (sheets[n] = fakeSheet(n)),
    getSheets: () => Object.values(sheets), deleteSheet: () => {}
  };
  const ctx = vm.createContext({
    console, Math, Date, Object, Array, String, Number, JSON, Error,
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, ProtectionType: { RANGE: 'RANGE' }, getUi: () => ({}) },
    LockService: { getDocumentLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: { formatDate: () => '2026-11-19 10:00' }
  });
  ctx.globalThis = ctx;
  const root = path.join(__dirname, '..', 'src');
  ['catalog', 'dates', 'format', 'kurs', 'ledger', 'piutang', 'queue', 'schema', 'valuation', 'zakat'].forEach(m =>
    vm.runInContext(fs.readFileSync(path.join(root, 'engine', m + '.js'), 'utf8'), ctx, { filename: m + '.js' }));
  ['Repo', 'Setup', 'Master'].forEach(m => vm.runInContext(fs.readFileSync(path.join(root, 'gas', m + '.js'), 'utf8'), ctx, { filename: m + '.js' }));
  return { ctx, sheets, run: code => vm.runInContext(code, ctx) };
}

test('setup membuat 11 tab, header benar, setelan dan katalog terisi, idempoten', () => {
  const g = boot();
  g.run('setupHartafolio()');
  assert.equal(Object.keys(g.sheets).length, 11);
  assert.equal(g.sheets.Transaksi.cells[0][0], 'trx_id');
  assert.equal(g.sheets.Transaksi.protections.length, 1);
  assert.equal(g.run('Repo_read_("Pengaturan").length'), 7);
  const asetN = g.run('Repo_read_("Aset").length');
  assert.ok(asetN >= 10);
  g.run('setupHartafolio()');
  assert.equal(g.run('Repo_read_("Pengaturan").length'), 7);
  assert.equal(g.run('Repo_read_("Aset").length'), asetN);
  assert.equal(g.sheets.Transaksi.protections.length, 1);
});

test('header berubah: menolak membaca dan menulis', () => {
  const g = boot();
  g.run('setupHartafolio()');
  g.sheets.Anggota.cells[0][1] = 'nama_salah';
  assert.throws(() => g.run('Repo_read_("Anggota")'), /Header tab "Anggota" berubah/);
  assert.throws(() => g.run('Repo_append_("Anggota", [{anggota_id:"PM-001"}])'), /Header tab/);
  assert.throws(() => g.run('setupHartafolio()'), /tidak cocok/);
});

test('apiTransaksiTambah: idempoten dengan trx_id sama, validasi saldo, urut kronologis', () => {
  const g = boot();
  g.run('setupHartafolio()');
  g.run(`Repo_append_('Anggota', [{anggota_id:'PM-001', nama:'Ticon', hubungan:'Diri sendiri', is_pengelola:true, aktif:true}]);
         Repo_append_('Lokasi', [{lokasi_id:'LK-001', nama:'Brankas', jenis:'Simpanan fisik di rumah', aktif:true}]);`);
  const base = { tanggal: '2026-11-03', jam: '10:00', anggota_id: 'PM-001', aset_id: 'AS-EMAS', lokasi_id: 'LK-001', harga_mata_uang: 'IDR', sumber: 'offline' };
  const kirim = list => g.run('apiTransaksiTambah(' + JSON.stringify(list) + ')');
  const t1 = Object.assign({ trx_id: 'TX-20261103-0001', jenis: 'Saldo awal', jumlah: 5 }, base);
  let r = kirim([t1]);
  assert.deepEqual(JSON.parse(JSON.stringify(r.diterima)), ['TX-20261103-0001']);
  r = kirim([t1]); // dikirim ulang oleh antrean offline
  assert.deepEqual(JSON.parse(JSON.stringify(r.duplikat)), ['TX-20261103-0001']);
  assert.equal(g.run('Repo_read_("Transaksi").length'), 1);
  const jual = Object.assign({ trx_id: 'TX-20261103-0002', jenis: 'Jual', jumlah: 9, harga_per_unit: 1 }, base);
  r = kirim([jual]);
  assert.equal(r.ditolak[0].error, 'saldo:kurang:AS-EMAS');
  assert.equal(g.run('Repo_read_("Transaksi").length'), 1);
  const dua = [Object.assign({ trx_id: 'TX-20261103-0004', jenis: 'Jual', jumlah: 3, harga_per_unit: 1, jam: '12:00' }, base),
    Object.assign({ trx_id: 'TX-20261103-0003', jenis: 'Beli', jumlah: 1, harga_per_unit: 1, jam: '11:00' }, base)];
  r = kirim(dua);
  assert.equal(r.diterima.length, 2);
  const rows = g.run('Repo_read_("Transaksi")');
  assert.equal(rows[0].status, 'aktif');
  assert.equal(rows[0].jumlah, 5);
  assert.deepEqual(JSON.parse(JSON.stringify(rows.map(x => x.trx_id))), ['TX-20261103-0001', 'TX-20261103-0003', 'TX-20261103-0004']);
});

test('apiTransaksiUbah: jenis tidak berubah, hapus = status dihapus, ID tidak ditimpa', () => {
  const g = boot();
  g.run('setupHartafolio()');
  g.run(`Repo_append_('Anggota', [{anggota_id:'PM-001', nama:'T', hubungan:'Diri sendiri', is_pengelola:true, aktif:true}]);
         Repo_append_('Lokasi', [{lokasi_id:'LK-001', nama:'B', jenis:'Lainnya', aktif:true}]);`);
  g.run(`apiTransaksiTambah([{trx_id:'TX-1', tanggal:'2026-11-03', jenis:'Saldo awal', anggota_id:'PM-001', aset_id:'AS-EMAS', lokasi_id:'LK-001', jumlah:2, sumber:'manual'}])`);
  assert.equal(g.run(`apiTransaksiUbah('TX-1', {jenis:'Jual', trx_id:'TX-X', status:'dihapus', catatan:'salah ketik'})`), true);
  const t = g.run('Repo_read_("Transaksi")[0]');
  assert.equal(t.jenis, 'Saldo awal');
  assert.equal(t.trx_id, 'TX-1');
  assert.equal(t.status, 'dihapus');
  assert.equal(t.diubah_pada, '2026-11-19 10:00');
  assert.equal(g.run(`apiTransaksiUbah('TX-404', {catatan:'x'})`), false);
});

test('apiState menyatukan data; harga terakhir mengabaikan status gagal', () => {
  const g = boot();
  g.run('setupHartafolio()');
  g.run(`Repo_append_('Harga', [
    {waktu:'2026-11-18 08:00', aset_id:'AS-BTC', harga:100, mata_uang:'USD', sumber:'coingecko', status:'ok'},
    {waktu:'2026-11-19 08:00', aset_id:'AS-BTC', harga:0, mata_uang:'USD', sumber:'coingecko', status:'gagal'},
    {waktu:'2026-11-19 08:00', aset_id:'USDIDR', harga:16400, mata_uang:'IDR', sumber:'kurs', status:'ok'}])`);
  const s = g.run('apiState()');
  assert.equal(s.harga.terakhir['AS-BTC'].harga, 100);
  assert.equal(s.harga.kursSeries.length, 1);
  assert.equal(s.versi, 1);
  assert.ok(s.aset.length >= 10);
});

test('anggota dan lokasi: tambah, ubah, tolak nama ganda, pengelola tetap "Diri sendiri"', () => {
  const g = boot();
  g.run('setupHartafolio()');
  const j = x => JSON.parse(JSON.stringify(x));
  const a1 = j(g.run('apiAnggotaTambah({nama:"  Azlan ", hubungan:"Anak"})'));
  assert.equal(a1.anggota_id, 'PM-001');
  assert.equal(a1.is_pengelola, true);
  assert.equal(a1.hubungan, 'Diri sendiri');
  const a2 = j(g.run('apiAnggotaTambah({nama:"Yumna", hubungan:"Anak"})'));
  assert.equal(a2.anggota_id, 'PM-002');
  assert.equal(a2.is_pengelola, false);
  assert.throws(() => g.run('apiAnggotaTambah({nama:"azlan", hubungan:"Anak"})'), /Sudah ada anggota/);
  assert.throws(() => g.run('apiAnggotaTambah({nama:"Fulan", hubungan:"Diri sendiri"})'), /Pilih hubungan/);
  assert.throws(() => g.run('apiAnggotaTambah({nama:"", hubungan:"Anak"})'), /wajib/);
  const u = j(g.run('apiAnggotaUbah("PM-001", {nama:"Azlan R", hubungan:"Anak"})'));
  assert.equal(u.nama, 'Azlan R');
  assert.equal(u.hubungan, 'Diri sendiri');
  assert.equal(j(g.run('apiAnggotaUbah("PM-002", {hubungan:"Saudara"})')).hubungan, 'Saudara');
  assert.throws(() => g.run('apiAnggotaUbah("PM-009", {nama:"X"})'), /tidak ditemukan/);
  const l1 = j(g.run('apiLokasiTambah({nama:"Brankas", jenis:"Simpanan fisik"})'));
  assert.equal(l1.lokasi_id, 'LK-001');
  assert.throws(() => g.run('apiLokasiTambah({nama:"brankas", jenis:"Lainnya"})'), /Sudah ada lokasi/);
  assert.throws(() => g.run('apiLokasiTambah({nama:"Bank X", jenis:"Tidak ada"})'), /Pilih jenis/);
  assert.equal(j(g.run('apiLokasiUbah("LK-001", {jenis:"Bank atau deposito"})')).jenis, 'Bank atau deposito');
  assert.equal(g.run('Repo_read_("Anggota").length'), 2);
});

test('setup selesai: butuh anggota dan lokasi, aman dipanggil dua kali', () => {
  const g = boot();
  g.run('setupHartafolio()');
  assert.throws(() => g.run('apiSetupSelesai()'), /minimal 1 anggota/);
  g.run('apiAnggotaTambah({nama:"Azlan"})');
  assert.throws(() => g.run('apiSetupSelesai()'), /minimal 1 lokasi/);
  g.run('apiLokasiTambah({nama:"Brankas", jenis:"Simpanan fisik"})');
  g.run('apiSetupSelesai()'); g.run('apiSetupSelesai()');
  const n = g.run('Repo_read_("Pengaturan").filter(r => r.kunci === "setup_selesai").length');
  assert.equal(n, 1);
  assert.equal(g.run('apiState().pengaturan.setup_selesai'), 'ya');
});

test('hapus anggota dan lokasi: aktif jadi tidak, ditolak bila pengelola atau sudah dipakai', () => {
  const g = boot();
  g.run('setupHartafolio()');
  g.run('apiAnggotaTambah({nama:"Azlan"}); apiAnggotaTambah({nama:"Yumna", hubungan:"Anak"}); apiAnggotaTambah({nama:"Yahya", hubungan:"Anak"});');
  g.run('apiLokasiTambah({nama:"Brankas", jenis:"Simpanan fisik"}); apiLokasiTambah({nama:"Bank", jenis:"Bank atau deposito"});');
  assert.throws(() => g.run('apiAnggotaHapus("PM-001")'), /Pengelola/);
  g.run(`apiTransaksiTambah([{trx_id:'TX-20261103-0001', tanggal:'2026-11-03', jam:'10:00', jenis:'Saldo awal', anggota_id:'PM-002', aset_id:'AS-EMAS', lokasi_id:'LK-001', jumlah:5, harga_mata_uang:'IDR', sumber:'offline'}])`);
  assert.throws(() => g.run('apiAnggotaHapus("PM-002")'), /masih punya catatan/);
  assert.throws(() => g.run('apiLokasiHapus("LK-001")'), /masih dipakai/);
  assert.equal(g.run('apiAnggotaHapus("PM-003")'), true);
  assert.equal(g.run('apiLokasiHapus("LK-002")'), true);
  assert.equal(g.run('Repo_read_("Anggota").length'), 3);
  assert.equal(g.run('Repo_read_("Anggota").filter(a => a.aktif).length'), 2);
  assert.equal(g.run('Repo_read_("Lokasi").filter(a => a.aktif).length'), 1);
  g.run('apiAnggotaTambah({nama:"Yahya", hubungan:"Anak"})');
  assert.equal(g.run('Repo_read_("Anggota").length'), 4);
});

test('apiBootState: hanya penanda Setup, anggota, lokasi', () => {
  const g = boot();
  g.run('setupHartafolio()'); g.run('apiAnggotaTambah({nama:"Azlan"})');
  const b = JSON.parse(JSON.stringify(g.run('apiBootState()')));
  assert.deepEqual(Object.keys(b).sort(), ['anggota', 'lokasi', 'pengaturan']);
  assert.equal(b.anggota.length, 1);
});
