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
    clearContent: () => { for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) set(r + i, c + j, ''); },
    protect: () => { const p = Object.assign(chain(), { getDescription: () => 'Header Hartafolio', remove: () => { g.protections.splice(g.protections.indexOf(p), 1); } }); g.protections.push(p); return p; }
  }));
  return g;
}

function boot() {
  const sheets = {};
  const ss = {
    getSheetByName: n => sheets[n] || null,
    insertSheet: n => (sheets[n] = fakeSheet(n)),
    getSheets: () => Object.values(sheets), deleteSheet: () => {}, copies: [], copy(n) { this.copies.push(n); }
  };
  const ctx = vm.createContext({
    console, Math, Date, Object, Array, String, Number, JSON, Error,
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, ProtectionType: { RANGE: 'RANGE' }, getUi: () => ({}) },
    LockService: { getDocumentLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: { formatDate: () => '2026-11-19 10:00' },
    ScriptApp: { getOAuthToken: () => 'tok' },
    UrlFetchApp: { calls: [], fetch(url, o) { this.calls.push({ url, o }); const folder = /\/drive\/v3\/files\?fields=id$/.test(url); return { getResponseCode: () => (this.fail ? 403 : 200), getContentText: () => JSON.stringify(folder ? { id: 'FOLDER1' } : { id: 'FILE1', webViewLink: 'https://drive.google.com/file/d/FILE1/view' }) }; } }
  });
  ctx.globalThis = ctx;
  const root = path.join(__dirname, '..', 'src');
  ['beranda', 'catalog', 'dates', 'format', 'harga-fetch', 'kelola', 'kurs', 'ledger', 'piutang', 'populer', 'queue', 'schema', 'valuation', 'zakat'].forEach(m =>
    vm.runInContext(fs.readFileSync(path.join(root, 'engine', m + '.js'), 'utf8'), ctx, { filename: m + '.js' }));
  ['Repo', 'Setup', 'Master', 'Bukti', 'Cadangan', 'Harga', 'AsetKelola'].forEach(m => vm.runInContext(fs.readFileSync(path.join(root, 'gas', m + '.js'), 'utf8'), ctx, { filename: m + '.js' }));
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

test('koreksi transaksi: ubah (jenis dan id tetap), hapus, pulihkan; ditolak bila transaksi sesudahnya kekurangan saldo', () => {
  const g = boot();
  g.run('setupHartafolio()');
  g.run(`Repo_append_('Anggota', [{anggota_id:'PM-001', nama:'T', hubungan:'Diri sendiri', is_pengelola:true, aktif:true}]);
         Repo_append_('Lokasi', [{lokasi_id:'LK-001', nama:'B', jenis:'Lainnya', aktif:true}]);`);
  g.run(`apiTransaksiTambah([{trx_id:'TX-1', tanggal:'2026-11-03', jenis:'Saldo awal', anggota_id:'PM-001', aset_id:'AS-EMAS', lokasi_id:'LK-001', jumlah:2, sumber:'manual'},
    {trx_id:'TX-2', tanggal:'2026-11-04', jam:'10:00', jenis:'Jual', anggota_id:'PM-001', aset_id:'AS-EMAS', lokasi_id:'LK-001', jumlah:1.5, harga_per_unit:100, harga_mata_uang:'IDR', sumber:'manual'}])`);
  const lama = { tanggal: '2026-11-03', anggota_id: 'PM-001', aset_id: 'AS-EMAS', lokasi_id: 'LK-001' };
  const gagal = (kode) => assert.throws(() => g.run(kode), /saldo tidak cukup/);
  gagal(`apiTransaksiHapus('TX-1')`); // Saldo awal 2 menutup Jual 1,5
  gagal(`apiTransaksiUbah('TX-1', ${JSON.stringify(Object.assign({}, lama, { jumlah: 1 }))})`);
  const r = g.run(`apiTransaksiUbah('TX-1', ${JSON.stringify(Object.assign({}, lama, { jumlah: 3, catatan: 'salah ketik', jenis: 'Jual', status: 'dihapus' }))})`);
  assert.equal(r.id, 'TX-1');
  const t = g.run('Repo_read_("Transaksi")[0]');
  assert.equal(t.jenis, 'Saldo awal'); assert.equal(t.trx_id, 'TX-1'); assert.equal(t.status, 'aktif'); assert.equal(t.jumlah, 3);
  assert.equal(t.catatan, 'salah ketik'); assert.equal(t.diubah_pada, '2026-11-19 10:00');
  g.run(`apiTransaksiHapus('TX-2')`);
  assert.equal(g.run('Repo_read_("Transaksi")[1]').status, 'dihapus');
  assert.throws(() => g.run(`apiTransaksiHapus('TX-2')`), /sudah dihapus/);
  g.run(`apiTransaksiHapus('TX-1')`); // sekarang tidak ada penjualan sesudahnya
  assert.throws(() => g.run(`apiTransaksiPulihkan('TX-2')`), /saldo tidak cukup/); // Jual 1,5 tanpa saldo awal
  g.run(`apiTransaksiPulihkan('TX-1')`); g.run(`apiTransaksiPulihkan('TX-2')`);
  assert.equal(g.run('Repo_read_("Transaksi")[1]').status, 'aktif');
  assert.throws(() => g.run(`apiTransaksiUbah('TX-404', {})`), /tidak ditemukan/);
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
  assert.equal(s.versi, 3);
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

test('apiAsetTambah: aset buatan sendiri tersimpan dengan harga manual; nama ganda, jenis salah, dan gram kosong ditolak', () => {
  const g = boot();
  g.run('setupHartafolio()');
  const a = g.run(`apiAsetTambah({ nama: 'Emas perhiasan', kelas: 'Emas', satuan: 'gram', harga: '1.900.000' })`);
  assert.equal(a.aset_id, 'AS-001'); assert.equal(a.sumber_harga, 'manual'); assert.equal(a.kategori_zakat, 'emas'); assert.equal(a.gram_per_unit, 1);
  const state = g.run('apiState()');
  assert.equal(state.aset.length, 14);
  assert.equal(g.sheets.Harga.getLastRow(), 2); // header + satu harga manual
  assert.throws(() => g.run(`apiAsetTambah({ nama: 'emas PERHIASAN', kelas: 'Emas', satuan: 'gram' })`), /Sudah ada aset/);
  assert.throws(() => g.run(`apiAsetTambah({ nama: 'X', kelas: 'Mobil', satuan: 'unit' })`), /Pilih jenis aset/);
  assert.throws(() => g.run(`apiAsetTambah({ nama: 'Koin', kelas: 'Perak', satuan: 'lembar' })`), /setara gram/);
});

test('migrasi v1 ke v3: Siapkan sheet menambah kolom ke-29 Transaksi dan dua kolom Aset, memperluas perlindungan header, menaikkan versi, data lama utuh', () => {
  const g = boot();
  g.run('setupHartafolio()');
  // jadikan Sheet seperti versi 1: 28 kolom, versi_skema 1, ada satu transaksi
  g.sheets.Transaksi.cells[0].length = 28;
  g.sheets.Aset.cells[0].length = 14; // v2: Aset belum punya kategori_zakat_lama dan jenis_berlaku
  g.run(`Repo_update_('Pengaturan', 'versi_skema', { nilai: '1' })`);
  const hasil = g.run('setupHartafolio()');
  assert.ok(hasil.some(x => /Transaksi: kolom ditambah \(alat_bayar_lokasi_id\)/.test(x)), hasil.join('|'));
  assert.equal(g.sheets.Transaksi.cells[0][28], 'alat_bayar_lokasi_id');
  assert.equal(g.sheets.Transaksi.protections.length, 1); // satu perlindungan, bukan dua
  assert.deepEqual(g.sheets.Aset.cells[0].slice(14, 16), ['kategori_zakat_lama', 'jenis_berlaku']); assert.equal(g.sheets.Aset.protections.length, 1);
  assert.equal(g.run("Repo_read_('Aset')").length > 0, true); // data Aset lama tetap terbaca
  assert.equal(g.run('apiState()').versi, 3);
  assert.equal(g.run('apiState()').pengaturan.versi_skema, '3');
  assert.deepEqual(JSON.parse(JSON.stringify(g.run('setupHartafolio()'))), ['Struktur sudah lengkap']); // idempoten
});

test('apiTransaksiTambah: bayar dari lokasi lain mengurangi lokasi pembayar; lokasi pembayar tidak ada ditolak', () => {
  const g = boot();
  g.run('setupHartafolio()');
  g.run(`apiAnggotaTambah({nama:'Azlan'}); apiLokasiTambah({nama:'Binance', jenis:'Exchange crypto'}); apiLokasiTambah({nama:'Bybit', jenis:'Exchange crypto'});`);
  const base = { tanggal: '2026-11-25', jam: '09:00', anggota_id: 'PM-001', sumber: 'manual' };
  const j = o => JSON.parse(JSON.stringify(g.run(`apiTransaksiTambah(${JSON.stringify([Object.assign({}, base, o)])})`)));
  assert.equal(j({ trx_id: 'TX-1', jenis: 'Saldo awal', aset_id: 'AS-USDT', lokasi_id: 'LK-002', jumlah: 500 }).diterima.length, 1);
  assert.equal(j({ trx_id: 'TX-2', jenis: 'Beli', aset_id: 'AS-PAXG', lokasi_id: 'LK-001', jumlah: 0.1, harga_per_unit: 4000, harga_mata_uang: 'USDT', alat_bayar_aset_id: 'AS-USDT', alat_bayar_lokasi_id: 'LK-002', kurs: 1, kurs_sumber: 'manual' }).diterima.length, 1);
  const bad = j({ trx_id: 'TX-3', jenis: 'Beli', aset_id: 'AS-PAXG', lokasi_id: 'LK-001', jumlah: 0.1, harga_per_unit: 4000, harga_mata_uang: 'USDT', alat_bayar_aset_id: 'AS-USDT', alat_bayar_lokasi_id: 'LK-099', kurs: 1 });
  assert.equal(bad.ditolak[0].error, 'lokasi:tidak-ada');
  const rows = JSON.parse(JSON.stringify(g.run(`Repo_read_('Transaksi')`)));
  assert.equal(rows[1].alat_bayar_lokasi_id, 'LK-002');
});

test('apiBuktiUnggah (Drive v3, izin drive.file): folder dibuat sekali, foto masuk folder itu, tautan di bukti setelah No. referensi; tanpa Cloud Console', () => {
  const g = boot();
  const dibuat = [], bikin = []; const hilang = new Set();
  g.ctx.Drive = { Files: {
    get: (id) => { if (id !== 'FOLDER1' || hilang.has(id)) throw new Error('404'); return { id, trashed: false }; },
    list: () => ({ files: [] }),
    create(res, blob, opt) { bikin.push({ res, opt }); if (res.mimeType === 'application/vnd.google-apps.folder') return { id: 'FOLDER1' }; dibuat.push({ res, blob }); return { id: 'FILE1', webViewLink: 'https://drive.google.com/file/d/FILE1/view' }; }
  } };
  g.ctx.Utilities.base64Decode = (b) => Buffer.from(b, 'base64'); g.ctx.Utilities.newBlob = (data, mime, nama) => ({ data, mime, nama });
  g.run('setupHartafolio()');
  g.run(`apiAnggotaTambah({nama:'Azlan'}); apiLokasiTambah({nama:'Binance', jenis:'Exchange crypto'});`);
  g.run(`apiTransaksiTambah([{trx_id:'TX-1', tanggal:'2026-11-25', jam:'09:00', jenis:'Saldo awal', anggota_id:'PM-001', aset_id:'AS-PAXG', lokasi_id:'LK-001', jumlah:1, sumber:'manual', bukti:'INV-77'}])`);
  const r = JSON.parse(JSON.stringify(g.run(`apiBuktiUnggah('TX-1', {nama:'nota binance.jpg', mime:'image/jpeg', base64:'QUJD'})`)));
  assert.equal(r.url, 'https://drive.google.com/file/d/FILE1/view');
  assert.equal(bikin[0].res.name, 'Hartafolio Bukti'); assert.equal(dibuat[0].res.mimeType, 'image/jpeg'); assert.deepEqual(Array.from(dibuat[0].res.parents), ['FOLDER1']); assert.match(dibuat[0].res.name, /^TX-1-nota binance\.jpg$/); assert.equal(dibuat[0].blob.data.toString(), 'ABC');
  assert.equal(JSON.parse(JSON.stringify(g.run(`Repo_read_('Transaksi')`)))[0].bukti, 'INV-77\nhttps://drive.google.com/file/d/FILE1/view');
  g.run(`apiBuktiUnggah('TX-1', {nama:'b.png', mime:'image/png', base64:'QUJD'})`);
  assert.equal(bikin.filter((x) => x.res.mimeType === 'application/vnd.google-apps.folder').length, 1); // folder tidak dibuat lagi
  assert.equal(g.run('apiState()').pengaturan.folder_bukti_id, 'FOLDER1');
  assert.throws(() => g.run(`apiBuktiUnggah('TX-9', {mime:'image/jpeg', base64:'QUJD'})`), /tidak ditemukan/);
  assert.throws(() => g.run(`apiBuktiUnggah('TX-1', {mime:'application/pdf', base64:'QUJD'})`), /JPG atau PNG/);
  const m = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'gas', 'appsscript.json'), 'utf8'));
  assert.ok(m.oauthScopes.includes('https://www.googleapis.com/auth/drive.file')); assert.ok(!m.oauthScopes.includes('https://www.googleapis.com/auth/drive')); assert.equal(m.dependencies.enabledAdvancedServices[0].serviceId, 'drive'); assert.ok(m.oauthScopes.includes('https://www.googleapis.com/auth/script.external_request')) /* untuk harga otomatis (Harga.js), bukan untuk foto */;
});

test('apiBuktiUnggah: folder lama tak terlihat oleh izin sempit -> dicari lagi, lalu dibuat baru dan id di Pengaturan diganti', () => {
  const g = boot(); const bikin = [];
  g.ctx.Drive = { Files: { get: () => { throw new Error('404'); }, list: () => ({ files: [] }), create(res) { bikin.push(res); return { id: res.mimeType === 'application/vnd.google-apps.folder' ? 'BARU' : 'F2', webViewLink: 'https://x/F2' }; } } };
  g.ctx.Utilities.base64Decode = (b) => Buffer.from(b, 'base64'); g.ctx.Utilities.newBlob = (data, mime, nama) => ({ data, mime, nama });
  g.run('setupHartafolio()');
  g.run(`Repo_append_('Pengaturan', [{ kunci: 'folder_bukti_id', nilai: 'LAMA', keterangan: '' }]); apiAnggotaTambah({nama:'Azlan'}); apiLokasiTambah({nama:'Binance', jenis:'Exchange crypto'});`);
  g.run(`apiTransaksiTambah([{trx_id:'TX-1', tanggal:'2026-11-25', jam:'09:00', jenis:'Saldo awal', anggota_id:'PM-001', aset_id:'AS-PAXG', lokasi_id:'LK-001', jumlah:1, sumber:'manual'}])`);
  g.run(`apiBuktiUnggah('TX-1', {nama:'a.jpg', mime:'image/jpeg', base64:'QUJD'})`);
  assert.equal(g.run('apiState()').pengaturan.folder_bukti_id, 'BARU');
  assert.deepEqual(Array.from(bikin[1].parents), ['BARU']);
});

test('cadangan: salinan ke folder, simpan 8 terakhir (yang lama ke sampah), jadwal Minggu 03.00 dibuat sekali, galat dicatat', () => {
  const g = boot(); const ss = g.ctx.SpreadsheetApp.getActiveSpreadsheet(); let n = 0; const pindah = [], sampah = [], jadwal = [];
  ss.copy = (nama) => ({ getId: () => 'C' + (++n), nama });
  g.ctx.Drive = { Files: { get: () => { throw new Error('404'); }, create: () => ({ id: 'FOLDERC' }), update(res, id, m, opt) { if (res.trashed) sampah.push(id); else pindah.push([id, opt.addParents]); return { id }; } } };
  g.ctx.SpreadsheetApp.getUi = () => ({ alert() {} });
  g.ctx.ScriptApp = { WeekDay: { SUNDAY: 'SUN' }, deleted: 0, getProjectTriggers: () => jadwal.slice(), deleteTrigger() { g.ctx.ScriptApp.deleted++; jadwal.length = 0; },
    newTrigger(f) { const t = { f, getHandlerFunction: () => f, timeBased: () => t, onWeekDay: (d) => { t.d = d; return t; }, atHour: (h) => { t.h = h; return t; }, inTimezone: () => t, create: () => { jadwal.push(t); return t; } }; return t; } };
  g.run('setupHartafolio()');
  g.run('cadanganNyalakan()'); g.run('cadanganNyalakan()'); // dua kali: satu jadwal saja
  assert.equal(jadwal.length, 1); assert.equal(jadwal[0].f, 'cadanganMingguan'); assert.equal(jadwal[0].d, 'SUN'); assert.equal(jadwal[0].h, 3);
  assert.deepEqual(pindah[0], ['C1', 'FOLDERC']);
  for (let i = 0; i < 8; i++) g.run('cadanganMingguan()');
  const p = g.run('apiState()').pengaturan;
  assert.equal(p.cadangan_ids.split(',').length, 8); assert.equal(sampah.length, 2); assert.deepEqual(sampah, ['C1', 'C2']); assert.equal(p.cadangan_aktif, 'ya');
  g.run('cadanganMatikan()'); assert.equal(jadwal.length, 0); assert.equal(g.run('apiState()').pengaturan.cadangan_aktif, 'tidak');
  g.ctx.Drive.Files.update = () => { throw new Error('izin'); }; // pindah dan buang gagal: salinan tetap dibuat, catatan muncul
  const r = JSON.parse(JSON.stringify(g.run('cadanganSekarang()')));
  assert.equal(r.catatan.length, 2); assert.match(g.run('apiState()').pengaturan.cadangan_terakhir, /dengan catatan/);
  ss.copy = () => { throw new Error('kuota'); };
  assert.throws(() => g.run('cadanganMingguan()'), /kuota/); assert.match(g.run('apiState()').pengaturan.cadangan_terakhir, /GAGAL: kuota/);
});

test('rapikanBiayaPindah: biaya Keluar lama masuk ke Pindah, Keluar jadi dihapus, saldo sama, salinan dibuat, aman diulang', () => {
  const g = boot(); const ss = g.ctx.SpreadsheetApp.getActiveSpreadsheet(); const pesan = [];
  g.ctx.SpreadsheetApp.getUi = () => ({ ButtonSet: { YES_NO: 1 }, Button: { YES: 'Y' }, alert: (m) => { pesan.push(m); return 'Y'; } });
  g.run('setupHartafolio()');
  g.run(`Repo_append_('Anggota', [{anggota_id:'PM-001', nama:'T', hubungan:'Diri sendiri', is_pengelola:true, aktif:true}]);
         Repo_append_('Lokasi', [{lokasi_id:'LK-001', nama:'A', jenis:'Lainnya', aktif:true},{lokasi_id:'LK-002', nama:'B', jenis:'Lainnya', aktif:true}]);`);
  const dasar = { anggota_id: 'PM-001', aset_id: 'AS-EMAS', lokasi_id: 'LK-001', sumber: 'manual', tanggal: '2026-11-05', jam: '09:00' };
  g.run(`apiTransaksiTambah(${JSON.stringify([Object.assign({}, dasar, { trx_id: 'S', jenis: 'Saldo awal', jumlah: 10, tanggal: '2026-11-01' }),
    Object.assign({}, dasar, { trx_id: 'P', jenis: 'Pindah', jumlah: 2, lokasi_tujuan_id: 'LK-002' }),
    Object.assign({}, dasar, { trx_id: 'K', jenis: 'Keluar', jumlah: 0.02, asal_alasan: 'Biaya', catatan: 'Biaya Pindah Rp 47600' })])})`);
  const saldo = () => JSON.stringify(g.run(`HF.ledger.balances(Repo_read_('Transaksi'))`));
  const sebelum = saldo();
  assert.equal(g.run('rapikanBiayaPindah()'), 1);
  const rows = JSON.parse(JSON.stringify(g.run(`Repo_read_('Transaksi')`)));
  assert.equal(rows.find((r) => r.trx_id === 'P').biaya, 0.02); assert.equal(rows.find((r) => r.trx_id === 'K').status, 'dihapus');
  assert.equal(saldo(), sebelum); // saldo tidak berubah
  assert.equal(ss.copies.length, 1);
  assert.equal(g.run('rapikanBiayaPindah()'), 0); assert.match(pesan[pesan.length - 1], /Tidak ada/);
});

test('kolom kanan yang hilang dilengkapi otomatis saat dibaca (tanpa menu), perlindungan tetap satu; header salah tetap berhenti', () => {
  const g = boot();
  g.run('setupHartafolio()');
  g.sheets.Transaksi.cells[0].length = 28; // kolom 29 hilang
  assert.deepEqual(JSON.parse(JSON.stringify(g.run(`Repo_read_('Transaksi')`))), []);
  assert.equal(g.sheets.Transaksi.cells[0][28], 'alat_bayar_lokasi_id');
  assert.equal(g.sheets.Transaksi.protections.length, 1);
  g.sheets.Transaksi.cells[0][3] = 'salah'; // kolom tengah rusak: bukan kasus kolom kanan
  assert.throws(() => g.run(`Repo_read_('Transaksi')`), /Header tab "Transaksi" berubah/);
});

test('Perbaiki header: menulis ulang hanya sel header yang salah, data utuh; laporan menyebut isi sel dan ukuran grid', () => {
  const g = boot();
  g.run('setupHartafolio()');
  g.run(`apiAnggotaTambah({nama:'Azlan'}); apiLokasiTambah({nama:'Binance', jenis:'Exchange crypto'});`);
  g.run(`apiTransaksiTambah([{trx_id:'TX-1', tanggal:'2026-11-25', jam:'09:00', jenis:'Saldo awal', anggota_id:'PM-001', aset_id:'AS-PAXG', lokasi_id:'LK-001', jumlah:1, sumber:'manual'}])`);
  g.sheets.Transaksi.cells[0][28] = 'Alat Bayar Lokasi'; // sel header salah tulis (bukan kosong)
  assert.throws(() => g.run(`Repo_read_('Transaksi')`), /Header tab "Transaksi" berubah/);
  const lap = JSON.parse(JSON.stringify(g.run('Setup_laporan_()')));
  assert.match(lap.find(x => /^Transaksi/.test(x)), /kolom 29 berisi "Alat Bayar Lokasi", seharusnya "alat_bayar_lokasi_id"/);
  const out = JSON.parse(JSON.stringify(g.run('Setup_perbaikiHeader_()')));
  assert.match(out.join('|'), /Transaksi: judul diperbaiki di kolom 29/);
  assert.equal(g.sheets.Transaksi.cells[0][28], 'alat_bayar_lokasi_id');
  assert.equal(JSON.parse(JSON.stringify(g.run(`Repo_read_('Transaksi')`))).length, 1); // data utuh
  assert.equal(g.sheets.Transaksi.protections.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(g.run('Setup_perbaikiHeader_()'))), ['Semua header sudah cocok']);
});

test('Perbaiki header: kolom yang bergeser disusun ulang bersama datanya (cadangan dibuat), kolom ekstra berdata ikut di kanan, nilai tetap di bawah judul yang benar', () => {
  const g = boot();
  g.run('setupHartafolio()');
  g.run(`apiAnggotaTambah({nama:'Azlan'}); apiLokasiTambah({nama:'Binance', jenis:'Exchange crypto'});`);
  g.run(`apiTransaksiTambah([{trx_id:'TX-1', tanggal:'2026-11-25', jam:'09:00', jenis:'Saldo awal', anggota_id:'PM-001', aset_id:'AS-PAXG', lokasi_id:'LK-001', jumlah:7, sumber:'manual', catatan:'cat'}])`);
  const sh = g.sheets.Transaksi, ss = sh.cells;
  ss.forEach(row => row.splice(4, 0, row === ss[0] ? '' : 'sisip')); sh.maxC = 30; // seseorang menyisipkan kolom di tengah: semua setelah kolom 4 bergeser
  assert.throws(() => g.run(`Repo_read_('Transaksi')`), /Header tab "Transaksi" berubah/);
  const out = JSON.parse(JSON.stringify(g.run('Setup_perbaikiHeader_()')));
  assert.match(out.join('|'), /Transaksi: kolom disusun ulang bersama datanya/); assert.match(out.join('|'), /Salinan cadangan/);
  assert.equal(g.ctx.SpreadsheetApp.getActiveSpreadsheet().copies.length, 1);
  const baris = JSON.parse(JSON.stringify(g.run(`Repo_read_('Transaksi')`)));
  assert.equal(baris.length, 1); assert.equal(baris[0].jumlah, 7); assert.equal(baris[0].catatan, 'cat'); assert.equal(baris[0].trx_id, 'TX-1'); assert.equal(baris[0].lokasi_id, 'LK-001');
  assert.equal(sh.cells[1].includes('sisip'), true); // kolom sisipan berdata tidak hilang (dibawa ke kanan)
  assert.deepEqual(JSON.parse(JSON.stringify(g.run('Setup_perbaikiHeader_()'))), ['Semua header sudah cocok']);
});

test('harga otomatis: baris Harga dari sumber tiruan, gagal tercatat, jadwal 3 jam satu saja (plus padatkan mingguan), harga manual tidak ditimpa', () => {
  const g = boot(); const jadwal = []; const diminta = [];
  g.ctx.SpreadsheetApp.getUi = () => ({ alert() {} });
  g.ctx.ScriptApp = { getOAuthToken: () => 'tok', getProjectTriggers: () => jadwal.slice(), deleteTrigger() { jadwal.length = 0; },
    WeekDay: { SUNDAY: 'SUNDAY' },
    newTrigger(f) { const t = { f, getHandlerFunction: () => f, timeBased: () => t, everyHours: (h) => { t.h = h; return t; }, onWeekDay: () => t, atHour: () => t, inTimezone: () => t, create: () => { jadwal.push(t); return t; } }; return t; } };
  const jawab = (u) => {
    if (/llama/.test(u)) return null;
    if (/coingecko/.test(u)) return JSON.stringify({ bitcoin: { usd: 60000 }, 'pax-gold': { usd: 3650 }, 'tether-gold': { usd: 3652 }, ethereum: { usd: 1668 }, tether: { usd: 1 } });
    if (/er-api/.test(u)) return JSON.stringify({ result: 'success', rates: { IDR: 16250 } });
    if (/gold-api/.test(u)) return JSON.stringify({ price: /XAU/.test(u) ? 3650 : 43.23 });
    if (/BBCA/.test(u)) return JSON.stringify({ chart: { result: [{ meta: { currency: 'IDR', regularMarketPrice: 6000 } }] } });
    return null; // saham lain gagal
  };
  g.ctx.UrlFetchApp = { fetchAll: (reqs) => reqs.map((r) => { diminta.push(r.url); const t = jawab(r.url); return { getResponseCode: () => (t ? 200 : 500), getContentText: () => t }; }) };
  g.run('setupHartafolio()');
  g.run('hargaNyalakan()'); g.run('hargaNyalakan()');
  assert.equal(jadwal.length, 2); assert.equal(jadwal[0].f, 'hargaOtomatis'); assert.equal(jadwal[0].h, 3); assert.equal(jadwal[1].f, 'hargaPadatkan');
  const h = g.run('apiState()').harga.terakhir;
  assert.equal(h['AS-BTC'].harga, 60000); assert.equal(h['AS-BTC'].mata_uang, 'USD');
  assert.equal(h['AS-BBCA'].harga, 600000);
  assert.equal(h['AS-USD'].harga, 16250);
  assert.ok(Math.abs(h['AS-EMAS'].harga - 3650 * 16250 / 31.1035) < 1e-6);
  assert.equal(h['AS-BBRI'], undefined); // gagal: tidak jadi harga
  const p = g.run('apiState()').pengaturan; assert.equal(p.harga_aktif, 'ya'); assert.match(p.harga_terakhir, /\(3 gagal\)/); assert.match(p.harga_terakhir, /llama: HTTP 500/);
  // aset manual dengan harga yang diisi tidak ikut diambil dan tidak tertimpa
  g.run("apiAsetTambah({ nama: 'Emas perhiasan', kelas: 'Emas', satuan: 'gram', harga: '1.900.000' })");
  const sebelum = diminta.length; g.run('hargaSekarang()');
  assert.ok(diminta.slice(sebelum).every((u) => !/perhiasan/i.test(u)));
  assert.equal(g.run('apiState()').harga.terakhir['AS-001'] === undefined ? 1 : g.run('apiState()').harga.terakhir[Object.keys(g.run('apiState()').harga.terakhir).find((k) => /^AS-\d+$/.test(k))].harga, 1900000);
  g.run('hargaMatikan()'); assert.equal(jadwal.length, 0); assert.equal(g.run('apiState()').pengaturan.harga_aktif, 'tidak');
  g.ctx.UrlFetchApp.fetchAll = () => { throw new Error('layanan luar mati'); };
  assert.throws(() => g.run('hargaOtomatis()'), /layanan luar mati/); assert.match(g.run('apiState()').pengaturan.harga_terakhir, /GAGAL: layanan luar mati/);
});

test('Kelola aset di server: katalog BNB, harga manual vs otomatis, sembunyikan/tampilkan/hapus menurut saldo dan riwayat', () => {
  const g = boot(); const fetched = [];
  g.ctx.SpreadsheetApp.getUi = () => ({ alert() {} });
  g.ctx.UrlFetchApp = { fetchAll: (reqs) => reqs.map((r) => { fetched.push(r.url); return { getResponseCode: () => 500, getContentText: () => '' }; }) };
  g.run('setupHartafolio()');
  g.run("apiAnggotaTambah({ nama: 'Azlan' })"); g.run("apiLokasiTambah({ nama: 'Brankas', jenis: 'Simpanan fisik' })");
  const ST = () => JSON.parse(JSON.stringify(g.run('apiState()')));
  const aset = (id) => ST().aset.find((a) => a.aset_id === id);
  // katalog: BNB tidak ikut Setup; masuk lewat Tambah aset; dua kali ditolak; baris aset hanya satu
  assert.equal(aset('AS-BNB'), undefined);
  assert.equal(g.run("apiAsetKatalogTambah('AS-BNB')").simbol, 'BNB'); assert.equal(aset('AS-BNB').status, 'aktif');
  assert.throws(() => g.run("apiAsetKatalogTambah('AS-BNB')"), /sudah ada di daftar/);
  assert.throws(() => g.run("apiAsetKatalogTambah('AS-NOPE')"), /tidak ada di katalog/);
  // Ubah ke manual: wajib harga; harga masuk tab Harga sebagai manual; kunci_manual menyala; tidak lagi diambil otomatis
  assert.throws(() => g.run("apiAsetUbah('AS-ETH', { nama: 'ETH', otomatis: false, harga: '' })"), /Isi harga per koin/);
  g.run("apiAsetUbah('AS-ETH', { nama: 'ETH', otomatis: false, harga: '52.300.000' })");
  assert.equal(aset('AS-ETH').kunci_manual, true);
  const h = ST().harga.terakhir['AS-ETH']; assert.deepEqual([h.harga, h.mata_uang, h.status], [52300000, 'IDR', 'manual']);
  fetched.length = 0; g.run('hargaSekarang()'); assert.ok(!fetched.some((u) => /ethereum/.test(u)));
  // Kembali ke otomatis: kunci mati dan pengambilan harga dijalankan sekali
  fetched.length = 0; g.run("apiAsetUbah('AS-ETH', { nama: 'ETH', otomatis: true })");
  assert.equal(aset('AS-ETH').kunci_manual, false); assert.ok(fetched.some((u) => /ethereum/.test(u)));
  assert.throws(() => g.run("apiAsetUbah('AS-IDR', { nama: 'IDR', otomatis: true })"), /tidak punya sumber harga otomatis/);
  // Nama: ganti, ganda ditolak, kosong ditolak
  g.run("apiAsetUbah('AS-BNB', { nama: 'BNB Chain', otomatis: true })"); assert.equal(aset('AS-BNB').simbol, 'BNB Chain');
  assert.throws(() => g.run("apiAsetUbah('AS-BNB', { nama: 'eth', otomatis: true })"), /Sudah ada aset bernama/);
  assert.throws(() => g.run("apiAsetUbah('AS-BNB', { nama: '  ', otomatis: true })"), /Nama aset wajib/);
  // Hapus aturan: dimiliki -> ditolak; terjual habis (punya riwayat) -> tidak bisa dihapus, bisa disembunyikan; tampilkan lagi; tanpa riwayat -> dihapus
  g.run(`apiTransaksiTambah([{trx_id:'T1', tanggal:'2026-11-03', jenis:'Saldo awal', anggota_id:'PM-001', aset_id:'AS-BTC', lokasi_id:'LK-001', jumlah:1, sumber:'manual'}])`);
  assert.throws(() => g.run("apiAsetStatus('AS-BTC', 'sembunyikan')"), /masih dimiliki/);
  assert.throws(() => g.run("apiAsetStatus('AS-BTC', 'hapus')"), /masih dimiliki/);
  g.run(`apiTransaksiTambah([{trx_id:'T2', tanggal:'2026-11-04', jenis:'Keluar', anggota_id:'PM-001', aset_id:'AS-BTC', lokasi_id:'LK-001', jumlah:1, sumber:'manual'}])`);
  assert.throws(() => g.run("apiAsetStatus('AS-BTC', 'hapus')"), /Sembunyikan saja/);
  g.run("apiAsetStatus('AS-BTC', 'sembunyikan')"); assert.equal(aset('AS-BTC').status, 'tersembunyi');
  assert.throws(() => g.run("apiAsetStatus('AS-BTC', 'sembunyikan')"), /tidak ada di daftar/);
  g.run("apiAsetStatus('AS-BTC', 'tampilkan')"); assert.equal(aset('AS-BTC').status, 'aktif');
  assert.throws(() => g.run("apiAsetStatus('AS-BTC', 'tampilkan')"), /tidak sedang tersembunyi/);
  g.run("apiAsetStatus('AS-ANTM', 'hapus')"); assert.equal(aset('AS-ANTM').status, 'dihapus');
  assert.equal(ST().aset.filter((a) => a.aset_id === 'AS-ANTM').length, 1); // baris tidak hilang
  g.run("apiAsetKatalogTambah('AS-ANTM')"); assert.equal(aset('AS-ANTM').status, 'aktif'); assert.equal(ST().aset.filter((a) => a.aset_id === 'AS-ANTM').length, 1);
  assert.throws(() => g.run("apiAsetStatus('AS-ANTM', 'bakar')"), /Aksi tidak dikenal/);
});

function bootHarga(jawab) {
  const g = boot(); const diminta = [];
  g.ctx.SpreadsheetApp.getUi = () => ({ alert() {} });
  g.ctx.ScriptApp = { getOAuthToken: () => 'tok', getProjectTriggers: () => [], deleteTrigger() {} };
  g.ctx.UrlFetchApp = { fetchAll: (reqs) => reqs.map((r) => { diminta.push(r.url); const t = jawab(r.url); return { getResponseCode: () => (t === null ? 429 : 200), getContentText: () => t }; }) };
  g.run('setupHartafolio()');
  return { g, diminta };
}
const COIN = JSON.stringify({ bitcoin: { usd: 60000 }, 'pax-gold': { usd: 3650 }, 'tether-gold': { usd: 3652 }, ethereum: { usd: 1668 }, tether: { usd: 1 } });
const LLAMA = JSON.stringify({ coins: { 'coingecko:bitcoin': { price: 59000 }, 'coingecko:pax-gold': { price: 3640 }, 'coingecko:tether-gold': { price: 3641 }, 'coingecko:ethereum': { price: 1660 }, 'coingecko:tether': { price: 1 } } });
const LAIN = (u) => /er-api/.test(u) ? JSON.stringify({ result: 'success', rates: { IDR: 16250 } }) : /gold-api/.test(u) ? JSON.stringify({ price: 3650 }) : /BBCA|BBRI|ANTM|GFI|TLKM/.test(u) ? JSON.stringify({ chart: { result: [{ meta: { currency: /GFI/.test(u) ? 'USD' : 'IDR', regularMarketPrice: 100 } }] } }) : null;

test('harga crypto: CoinGecko gagal (429) lalu cadangan llama dipakai; kode HTTP tercatat di Pengaturan', () => {
  const { g } = bootHarga((u) => /llama/.test(u) ? LLAMA : /coingecko/.test(u) ? null : LAIN(u));
  const r = JSON.parse(JSON.stringify(g.run('hargaSekarang()')));
  assert.equal(r.gagal, 0);
  const h = g.run('apiState()').harga.terakhir; assert.equal(h['AS-BTC'].harga, 59000); assert.equal(h['AS-BTC'].sumber, 'llama');
  assert.match(g.run('apiState()').pengaturan.harga_terakhir, /coingecko: HTTP 429/);
});

test('harga: yang sama tidak ditulis ulang di hari yang sama, gagal tidak ditulis, tab dipadatkan, jendela baca ekor tetap menemukan harga lama', () => {
  const { g } = bootHarga((u) => /llama/.test(u) ? null : /coingecko/.test(u) ? COIN : LAIN(u));
  g.run('hargaSekarang()'); const n1 = g.sheets.Harga.getLastRow();
  g.run('hargaSekarang()'); assert.equal(g.sheets.Harga.getLastRow(), n1); // harga sama: tidak menambah baris
  assert.ok(JSON.parse(JSON.stringify(g.run(`Repo_read_('Harga')`))).every((x) => x.status !== 'gagal'));
  // baris lama menumpuk lalu dipadatkan: satu per aset per hari, baris manual dan baris baru utuh
  const lama = []; for (let i = 0; i < 6; i++) lama.push({ waktu: '2026-10-01 0' + i + ':00', aset_id: 'AS-BTC', harga: 50000 + i, mata_uang: 'USD', sumber: 'coingecko', status: 'ok' });
  lama.push({ waktu: '2026-10-02 01:00', aset_id: 'AS-ETH', harga: 1, mata_uang: 'IDR', sumber: 'manual', status: 'manual' });
  g.ctx.__lama = lama; g.run(`Repo_append_('Harga', __lama)`);
  const sebelum = g.sheets.Harga.getLastRow() - 1;
  const r = JSON.parse(JSON.stringify(g.run('Harga_padatkan_()')));
  assert.equal(r.sebelum, sebelum); assert.equal(r.sesudah, sebelum - 5);
  const rows = JSON.parse(JSON.stringify(g.run(`Repo_read_('Harga')`)));
  assert.equal(rows.filter((x) => x.waktu.startsWith('2026-10-01') && x.aset_id === 'AS-BTC').length, 1);
  assert.ok(rows.some((x) => x.status === 'manual'));
  assert.equal(g.sheets.Harga.getLastRow() - 1, rows.length); // sisa baris dikosongkan
  // jendela baca kecil: harga terbaru ada di ekor, harga lama (di luar jendela) tetap ditemukan lewat pembacaan sisa
  g.run('HARGA_BACA = 3');
  const t = g.run('apiState()').harga.terakhir; assert.ok(t['AS-BTC'] && t['AS-ETH'] && t['AS-EMAS']);
});

test('Dolar AS: harga manual juga ditulis di seri USDIDR (kurs seluruh aplikasi); terkunci manual, kurs tidak diambil dan emas memakai kurs itu', () => {
  const { g, diminta } = bootHarga((u) => /llama/.test(u) ? null : /coingecko/.test(u) ? COIN : LAIN(u));
  g.run('hargaSekarang()');
  g.run("apiAsetUbah('AS-USD', { nama: 'Dolar AS', otomatis: false, harga: '18.250' })");
  let hg = g.run('apiState()').harga; assert.equal(hg.kursSeries[hg.kursSeries.length - 1].harga, 18250);
  diminta.length = 0; g.run('hargaSekarang()');
  assert.ok(!diminta.some((u) => /er-api/.test(u)));
  hg = g.run('apiState()').harga; assert.equal(hg.kursSeries[hg.kursSeries.length - 1].harga, 18250);
  assert.ok(Math.abs(hg.terakhir['AS-EMAS'].harga - 3650 * 18250 / 31.1035) < 1e-6);
});

function bootCari(jawab, yahoo) {
  const h = bootHarga(jawab);
  h.g.ctx.UrlFetchApp.fetch = (url) => { const t = yahoo ? yahoo(url) : null; return { getResponseCode: () => (t === null ? 429 : 200), getContentText: () => t }; };
  return h;
}
const RATES = (u) => /er-api/.test(u) ? JSON.stringify({ result: 'success', rates: { IDR: 16250, SGD: 1.25, USD: 1 } }) : null;
const SEMUA = (u) => /llama/.test(u) ? JSON.stringify({ coins: { 'coingecko:kinesis-gold': { price: 117 }, 'coingecko:goldfish-gold': { price: 4.2 } } }) : /coingecko/.test(u) ? null : (RATES(u) || LAIN(u));
const ST = (g) => JSON.parse(JSON.stringify(g.run('apiState()')));

test('Tambah dari pencarian: token emas dikenali (Emas, gram, zakat), harga dicek dulu, ganda ditolak, hidup lagi bila dihapus, gagal diambil ditolak', () => {
  const { g } = bootCari(SEMUA);
  const kau = JSON.parse(JSON.stringify(g.run(`apiAsetCariTambah({ key: 'coingecko:kinesis-gold', n: 'KAU', f: 'Kinesis Gold · peringkat 120 · 1 token = 1 gram' })`)));
  assert.deepEqual([kau.kelas, kau.satuan, kau.gram_per_unit, kau.kategori_zakat, kau.sumber_harga, kau.kode_sumber], ['Emas', 'token', 1, 'emas', 'coingecko', 'kinesis-gold']);
  assert.match(kau.aset_id, /^AS-\d+$/);
  assert.equal(ST(g).harga.terakhir[kau.aset_id].harga, 117); // harga hasil cek ikut tersimpan
  assert.throws(() => g.run(`apiAsetCariTambah({ key: 'coingecko:kinesis-gold', n: 'KAU', f: 'x' })`), /sudah ada di daftar/);
  // aset yang dihapus dihidupkan lagi, bukan dibuat ganda
  g.run(`apiAsetStatus('${kau.aset_id}', 'hapus')`);
  g.run(`apiAsetCariTambah({ key: 'coingecko:kinesis-gold', n: 'KAU', f: 'x' })`);
  assert.equal(ST(g).aset.filter((a) => a.kode_sumber === 'kinesis-gold').length, 1);
  assert.equal(ST(g).aset.find((a) => a.kode_sumber === 'kinesis-gold').status, 'aktif');
  // katalog tambahan (BNB) memakai id katalognya; sumber tidak menjawab = ditolak dan tidak ada baris baru
  assert.throws(() => g.run(`apiAsetCariTambah({ key: 'coingecko:binancecoin', n: 'BNB', f: 'BNB' })`), /belum bisa diambil/);
  assert.equal(ST(g).aset.some((a) => a.kode_sumber === 'binancecoin'), false);
  assert.throws(() => g.run(`apiAsetCariTambah({ key: 'bukan:dikenal', n: 'X', f: 'X' })`), /tidak dikenal/);
});

test('Tambah mata uang: kurs Rupiah per unit dihitung dari kurs USD dan kurs mata uang itu; Dolar AS tetap satu kurs aplikasi', () => {
  const { g } = bootCari(SEMUA);
  const sgd = JSON.parse(JSON.stringify(g.run(`apiAsetCariTambah({ key: 'kurs:SGD', n: 'SGD', f: 'Dolar Singapura' })`)));
  assert.deepEqual([sgd.kelas, sgd.sumber_harga, sgd.kode_sumber, sgd.satuan], ['Mata uang', 'kurs', 'SGD', 'nominal']);
  assert.ok(Math.abs(ST(g).harga.terakhir[sgd.aset_id].harga - 16250 / 1.25) < 1e-6);
  g.run('hargaSekarang()');
  const t = ST(g).harga.terakhir; assert.equal(t['AS-USD'].harga, 16250); assert.ok(Math.abs(t[sgd.aset_id].harga - 13000) < 1e-6);
});

test('Cari saham di server: hanya BEI dan bursa Amerika, yang sudah ada disembunyikan, gagal jadi pesan', () => {
  const Y = JSON.stringify({ quotes: [{ symbol: 'TLKM.JK', longname: 'Telkom Indonesia (Persero) Tbk.', exchange: 'JKT', quoteType: 'EQUITY' }, { symbol: 'TKG.JO', shortname: 'Telkom SA', exchange: 'JNB', quoteType: 'EQUITY' },
    { symbol: 'TLK', shortname: 'Telkom ADR', exchange: 'NYQ', quoteType: 'EQUITY' }, { symbol: 'BBCA.JK', shortname: 'BCA', exchange: 'JKT', quoteType: 'EQUITY' }, { symbol: 'XX=F', exchange: 'CME', quoteType: 'FUTURE' }] });
  const { g } = bootCari(SEMUA, () => Y);
  const r = JSON.parse(JSON.stringify(g.run(`apiAsetCari('saham', 'telkom')`)));
  assert.deepEqual(r.map((x) => x.key), ['saham:TLKM.JK', 'saham:TLK']); // TKG.JO bursa lain, BBCA sudah ada
  assert.deepEqual(JSON.parse(JSON.stringify(g.run(`apiAsetCari('saham', 't')`))), []);
  assert.throws(() => g.run(`apiAsetCari('crypto', 'btc')`), /belum tersedia/);
  const gagal = bootCari(SEMUA, () => null);
  assert.throws(() => gagal.g.run(`apiAsetCari('saham', 'telkom')`), /belum tersambung/);
  const tlk = JSON.parse(JSON.stringify(g.run(`apiAsetCariTambah({ key: 'saham:TLKM.JK', n: 'TLKM', f: 'Telkom Indonesia (Persero) Tbk. · BEI · per lot' })`)));
  assert.deepEqual([tlk.satuan, tlk.mata_uang_harga, tlk.kode_sumber], ['lot', 'IDR', 'TLKM']);
});

test('Ubah jenis token: Crypto ke Emas menyimpan kategori lama dan jenis_berlaku hari ini, wajib setara gram; bukan token ditolak', () => {
  const { g } = bootCari(SEMUA);
  const t = JSON.parse(JSON.stringify(g.run(`apiAsetCariTambah({ key: 'coingecko:goldfish-gold', n: 'GGBR', f: 'Goldfish Gold · peringkat 291' })`)));
  assert.deepEqual([t.kelas, t.kategori_zakat], ['Crypto', '']);
  assert.throws(() => g.run(`apiAsetUbah('${t.aset_id}', { nama: 'GGBR', otomatis: true, kelas: 'Emas', gram: '' })`), /setara gram/);
  g.run(`apiAsetUbah('${t.aset_id}', { nama: 'GGBR', otomatis: true, kelas: 'Emas', gram: '1' })`);
  const a = ST(g).aset.find((x) => x.aset_id === t.aset_id);
  assert.deepEqual([a.kelas, a.kategori_zakat, a.kategori_zakat_lama, a.jenis_berlaku, a.gram_per_unit], ['Emas', 'emas', '', '2026-11-19', 1]);
  assert.throws(() => g.run(`apiAsetUbah('AS-BBCA', { nama: 'BBCA', otomatis: true, kelas: 'Emas', gram: '1' })`), /hanya bisa diubah untuk token crypto/);
  assert.throws(() => g.run(`apiAsetUbah('${t.aset_id}', { nama: 'GGBR', otomatis: true, kelas: 'Properti' })`), /Pilih Crypto, Emas, atau Perak/);
  // balik ke Crypto: kategori lama menjadi emas
  g.run(`apiAsetUbah('${t.aset_id}', { nama: 'GGBR', otomatis: true, kelas: 'Crypto' })`);
  const b = ST(g).aset.find((x) => x.aset_id === t.aset_id);
  assert.deepEqual([b.kelas, b.kategori_zakat, b.kategori_zakat_lama], ['Crypto', '', 'emas']);
});
