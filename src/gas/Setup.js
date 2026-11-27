/**
 * Hartafolio — menyiapkan Google Sheet: 11 tab, header terkunci, setelan awal, katalog aset.
 * Aman dijalankan berulang: tidak menimpa data, hanya melengkapi yang belum ada.
 */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Hartafolio')
    .addItem('Siapkan sheet', 'setupHartafolio')
    .addItem('Periksa struktur', 'periksaStruktur')
    .addItem('Perbaiki header', 'perbaikiHeader')
    .addItem('Izinkan Google Drive', 'izinkanDrive')
    .addSeparator()
    .addItem('Nyalakan cadangan mingguan', 'cadanganNyalakan')
    .addItem('Matikan cadangan mingguan', 'cadanganMatikan')
    .addItem('Cadangkan sekarang', 'cadanganSekarang')
    .addToUi();
}

function setupHartafolio() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), S = HF.schema, laporan = [];
  S.URUTAN.forEach(function (tab, i) {
    var sh = ss.getSheetByName(tab), baru = false;
    if (!sh) { sh = ss.insertSheet(tab, i); baru = true; }
    var names = S.colNames(tab);
    Repo_ensureGrid_(sh, 2001, names.length);
    if (baru || sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, names.length).setValues([names]);
      laporan.push(tab + ': dibuat');
    } else {
      var r = S.checkHeader(tab, sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), names.length)).getValues()[0]);
      if (!r.ok) {
        // Migrasi aman: hanya bila yang kurang adalah kolom baru di kanan (sel header kosong). Selain itu berhenti tanpa mengubah apa pun.
        var cuma = r.mismatches.every(function (m) { return m.got === ''; });
        if (!cuma) throw new Error('Header tab "' + tab + '" tidak cocok (kolom ' + r.mismatches[0].col + '). Tidak ada yang diubah.');
        var tambah = r.mismatches.map(function (m) { return m.want; });
        r.mismatches.forEach(function (m) { sh.getRange(1, m.col, 1, 1).setValue(m.want); });
        Setup_dropProtection_(sh);
        laporan.push(tab + ': kolom ditambah (' + tambah.join(', ') + ')');
      }
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

/** Lepas perlindungan header lama supaya bisa dibuat ulang selebar header baru. */
function Setup_dropProtection_(sh) {
  sh.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function (p) { if (p.getDescription() === 'Header Hartafolio') p.remove(); });
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
  if (ada.versi_skema && Repo_settings_().versi_skema !== String(HF.schema.VERSI)) Repo_update_('Pengaturan', 'versi_skema', { nilai: String(HF.schema.VERSI) });
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

/** Laporan struktur untuk menu: tiap tab, isi sel header yang salah, dan ukuran grid. */
function periksaStruktur() {
  var out = Setup_laporan_();
  SpreadsheetApp.getUi().alert(out.join('\n'));
  return out;
}

function Setup_laporan_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), out = [];
  HF.schema.URUTAN.forEach(function (tab) {
    var sh = ss.getSheetByName(tab);
    if (!sh) { out.push(tab + ': TIDAK ADA'); return; }
    var r = HF.schema.checkHeader(tab, sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), HF.schema.colNames(tab).length)).getValues()[0]);
    out.push(tab + ': ' + (r.ok ? 'ok' : r.mismatches.slice(0, 3).map(function (m) { return 'kolom ' + m.col + ' berisi "' + m.got + '", seharusnya "' + m.want + '"'; }).join('; ') + ' (kolom terpakai ' + sh.getLastColumn() + ', ukuran ' + sh.getMaxColumns() + ')'));
  });
  return out;
}

/**
 * Susun ulang kolom sebuah tab bila semua nama kolom skema ada tetapi urutannya bergeser (mis. ada kolom disisipkan atau dipindah).
 * Data ikut dipindah bersama judulnya, jadi tiap nilai tetap berada di bawah judul yang benar. Kolom lain/kosong berdata ditaruh di kanan.
 * Mengembalikan true bila ada yang dipindah, false bila urutan sudah benar, null bila ada nama kolom skema yang tidak ada (tidak bisa disusun).
 */
function Setup_susun_(sh, tab) {
  var names = HF.schema.colNames(tab), lastR = Math.max(sh.getLastRow(), 1), lastC = Math.max(sh.getLastColumn(), names.length);
  var vals = sh.getRange(1, 1, lastR, lastC).getValues(), head = vals[0].map(function (h) { return String(h == null ? '' : h).trim(); });
  var idx = names.map(function (n) { return head.indexOf(n); });
  if (idx.some(function (i) { return i < 0; })) return null;
  var lain = []; // kolom bukan skema yang berisi sesuatu: tetap dibawa, di kanan
  head.forEach(function (h, c) {
    if (idx.indexOf(c) >= 0) return;
    if (h !== '' || vals.slice(1).some(function (r) { return r[c] !== '' && r[c] != null; })) lain.push(c);
  });
  var urut = idx.concat(lain);
  if (urut.every(function (c, k) { return c === k; }) && lastC === urut.length) return false;
  var hasil = vals.map(function (r) { var o = urut.map(function (c) { return r[c]; }); while (o.length < lastC) o.push(''); return o; });
  sh.getRange(1, 1, lastR, lastC).setValues(hasil);
  return true;
}

/**
 * Perbaiki header yang tidak cocok dengan skema. Bila kolom hanya bergeser, kolom disusun ulang bersama datanya (cadangan Sheet dibuat dulu).
 * Bila ada nama kolom yang tidak ada, hanya sel header yang salah ditulis ulang (data tidak disentuh).
 */
function Setup_perbaikiHeader_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), S = HF.schema, laporan = [], cadangan = false;
  S.URUTAN.forEach(function (tab) {
    var sh = ss.getSheetByName(tab); if (!sh) return;
    var names = S.colNames(tab);
    Repo_ensureGrid_(sh, sh.getMaxRows(), names.length);
    var r = S.checkHeader(tab, sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), names.length)).getValues()[0]);
    if (r.ok) return;
    var kunci = r.mismatches.every(function (m) { return m.got === ''; });
    if (!kunci) {
      if (!cadangan) { ss.copy('Hartafolio cadangan ' + Master_now_().replace(/[: ]/g, '-')); cadangan = true; }
      var hasil = Setup_susun_(sh, tab);
      if (hasil === true) { Setup_dropProtection_(sh); Setup_protectHeader_(sh, tab); laporan.push(tab + ': kolom disusun ulang bersama datanya'); return; }
    }
    r.mismatches.forEach(function (m) { sh.getRange(1, m.col, 1, 1).setValue(m.want); });
    Setup_dropProtection_(sh); Setup_protectHeader_(sh, tab);
    laporan.push(tab + ': judul diperbaiki di kolom ' + r.mismatches.map(function (m) { return m.col; }).join(', '));
  });
  if (cadangan) laporan.push('Salinan cadangan dibuat di Drive Anda: "Hartafolio cadangan ..."');
  return laporan.length ? laporan : ['Semua header sudah cocok'];
}

function perbaikiHeader() {
  var ui = SpreadsheetApp.getUi(), lap = Setup_laporan_().filter(function (x) { return !/: ok$/.test(x); });
  if (!lap.length) { ui.alert('Semua header sudah cocok.'); return []; }
  if (ui.alert('Perbaiki header?', 'Yang tidak cocok:\n' + lap.join('\n') + '\n\nBila kolom hanya bergeser, kolom disusun ulang bersama datanya (salinan cadangan dibuat dulu). Bila tidak, hanya judul yang ditulis ulang.', ui.ButtonSet.YES_NO) !== ui.Button.YES) return [];
  var out = Setup_perbaikiHeader_(); ui.alert(out.join('\n')); return out;
}
