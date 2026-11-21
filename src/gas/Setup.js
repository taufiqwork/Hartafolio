/**
 * Hartafolio — menyiapkan Google Sheet: 11 tab, header terkunci, setelan awal, katalog aset.
 * Aman dijalankan berulang: tidak menimpa data, hanya melengkapi yang belum ada.
 */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Hartafolio')
    .addItem('Siapkan sheet', 'setupHartafolio')
    .addItem('Periksa struktur', 'periksaStruktur')
    .addToUi();
}

function setupHartafolio() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), S = HF.schema, laporan = [];
  S.URUTAN.forEach(function (tab, i) {
    var sh = ss.getSheetByName(tab), baru = false;
    if (!sh) { sh = ss.insertSheet(tab, i); baru = true; }
    var names = S.colNames(tab);
    if (baru || sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, names.length).setValues([names]);
      laporan.push(tab + ': dibuat');
    } else {
      var r = S.checkHeader(tab, sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), names.length)).getValues()[0]);
      if (!r.ok) throw new Error('Header tab "' + tab + '" tidak cocok (kolom ' + r.mismatches[0].col + '). Tidak ada yang diubah.');
    }
    Setup_format_(sh, tab);
    Setup_protectHeader_(sh, tab);
  });
  Setup_seedPengaturan_();
  Setup_seedAset_();
  var def = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1') || ss.getSheetByName('Lembar1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(def);
  return laporan.length ? laporan : ['Struktur sudah lengkap'];
}

/** Tanggal, jam, dan ID sebagai teks agar Sheets tidak mengubahnya; angka memakai format angka polos. */
function Setup_format_(sh, tab) {
  var cols = HF.schema.TABS[tab].cols, rows = 2000;
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, cols.length).setFontWeight('bold').setBackground('#f1f5f2');
  cols.forEach(function (c, i) {
    var rng = sh.getRange(2, i + 1, rows, 1);
    if (c.t === 'num') rng.setNumberFormat('0.########');
    else rng.setNumberFormat('@');
  });
}

/** Header dikunci: hanya pemilik yang dapat mengubah baris 1. */
function Setup_protectHeader_(sh, tab) {
  var ada = sh.getProtections(SpreadsheetApp.ProtectionType.RANGE).some(function (p) { return p.getDescription() === 'Header Hartafolio'; });
  if (ada) return;
  var p = sh.getRange(1, 1, 1, HF.schema.colNames(tab).length).protect().setDescription('Header Hartafolio');
  p.setWarningOnly(false);
}

function Setup_seedPengaturan_() {
  var ada = {};
  Repo_read_('Pengaturan').forEach(function (r) { ada[r.kunci] = true; });
  var baru = HF.schema.PENGATURAN_AWAL.filter(function (r) { return !ada[r[0]]; })
    .map(function (r) { return { kunci: r[0], nilai: r[1], keterangan: r[2] }; });
  Repo_append_('Pengaturan', baru);
}

/** Katalog bawaan masuk ke Aset hanya bila aset_id belum ada. ID tidak pernah dipakai ulang. */
function Setup_seedAset_() {
  var ada = {}, now = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm');
  Repo_read_('Aset').forEach(function (a) { ada[a.aset_id] = true; });
  var baru = HF.catalog.all().filter(function (a) { return !ada[a.aset_id]; }).map(function (a) { a.dibuat_pada = now; return a; });
  Repo_append_('Aset', baru);
}

/** Laporan struktur untuk menu: header tiap tab dan versi skema. */
function periksaStruktur() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), out = [];
  HF.schema.URUTAN.forEach(function (tab) {
    var sh = ss.getSheetByName(tab);
    if (!sh) { out.push(tab + ': TIDAK ADA'); return; }
    var r = HF.schema.checkHeader(tab, sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), HF.schema.colNames(tab).length)).getValues()[0]);
    out.push(tab + ': ' + (r.ok ? 'ok' : 'header tidak cocok di kolom ' + r.mismatches[0].col));
  });
  SpreadsheetApp.getUi().alert(out.join('\n'));
  return out;
}
