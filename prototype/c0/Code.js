/**
 * PERCOBAAN C0 (bukan produk): aplikasi pusat yang berjalan sebagai pengguna yang membuka.
 * Menjawab: apakah pengguna Gmail biasa bisa login, menyetujui izin, dan aplikasi membuat serta memakai Sheet di Drive mereka sendiri,
 * tanpa salinan template, tanpa menu Sheet, dan tanpa deploy oleh pengguna. Id Sheet disimpan di properti akun pengguna.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index').setTitle('Hartafolio C0').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function C0_ss_() {
  var p = PropertiesService.getUserProperties(), id = p.getProperty('sheetId'), dibuat = false, ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create('Hartafolio (percobaan C0)');
    ss.getSheets()[0].setName('Transaksi').appendRow(['trx_id', 'tanggal', 'jumlah', 'dicatat_oleh']);
    p.setProperty('sheetId', ss.getId()); dibuat = true;
  }
  return { ss: ss, dibuat: dibuat };
}

function C0_ringkas_(h) {
  var sh = h.ss.getSheetByName('Transaksi');
  return { email: Session.getActiveUser().getEmail(), url: h.ss.getUrl(), dibuatSekarang: h.dibuat, baris: sh.getLastRow() - 1, waktu: new Date().toISOString() };
}

/** Panggilan pertama: buka atau buat Sheet milik pengguna ini. */
function apiMulai() { return C0_ringkas_(C0_ss_()); }

/** Tulis satu baris uji ke Sheet pengguna ini. */
function apiTulis() {
  var h = C0_ss_(); h.ss.getSheetByName('Transaksi').appendRow(['TX-' + Date.now(), new Date().toISOString().slice(0, 10), Math.round(Math.random() * 100), Session.getActiveUser().getEmail()]);
  return C0_ringkas_(h);
}
