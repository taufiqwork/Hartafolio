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

/* ===== E0: dipanggil dari halaman di luar Apps Script lewat Apps Script API (scripts.run), berjalan sebagai pemanggil ===== */

/** Pasang tugas terjadwal uji untuk pemanggil: tiap 1 menit menambah satu baris di Sheet-nya. Membuktikan tugas jalan tanpa halaman terbuka. */
function apiPasangTugas() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'tugasUji') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('tugasUji').timeBased().everyMinutes(1).create();
  return { terpasang: ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === 'tugasUji'; }).length, email: Session.getActiveUser().getEmail() };
}

function apiHentikanTugas() {
  var n = 0; ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'tugasUji') { ScriptApp.deleteTrigger(t); n++; } });
  return { dihentikan: n };
}

/**
 * Dijalankan Google sesuai jadwal, sebagai pemilik pemicu. Halaman tidak perlu terbuka.
 * Mencatat tahapnya di properti akun (PropertiesService tidak butuh izin Sheet): "mulai" berarti kode sempat jalan,
 * "ok" berarti baris tertulis, "galat" berisi pesan bila gagal di tengah. Bila tidak ada satu pun, Google menolak sebelum kode berjalan.
 */
function tugasUji() {
  var p = PropertiesService.getUserProperties(), now = new Date().toISOString();
  p.setProperty('tugas.mulai', now);
  try {
    var h = C0_ss_();
    h.ss.getSheetByName('Transaksi').appendRow(['TERJADWAL-' + Date.now(), now.slice(0, 10), 0, 'tugas terjadwal']);
    p.setProperty('tugas.ok', now); p.deleteProperty('tugas.galat');
  } catch (e) { p.setProperty('tugas.galat', now + ' ' + String(e && e.message || e).slice(0, 400)); throw e; }
}

/** Jejak tugas terjadwal terakhir untuk pemanggil. */
function apiStatusTugas() {
  var p = PropertiesService.getUserProperties();
  return { mulai: p.getProperty('tugas.mulai'), ok: p.getProperty('tugas.ok'), galat: p.getProperty('tugas.galat'), sekarang: new Date().toISOString() };
}

/** Sepuluh baris terakhir, untuk halaman uji. */
function apiBaris() {
  var h = C0_ss_(), sh = h.ss.getSheetByName('Transaksi'), n = sh.getLastRow(), dari = Math.max(2, n - 9);
  return { email: Session.getActiveUser().getEmail(), url: h.ss.getUrl(), baris: n > 1 ? sh.getRange(dari, 1, n - dari + 1, 4).getValues() : [] };
}

/** Diagnosa izin skrip untuk pemanggil: status, tautan izin (bila perlu), dan izin yang sudah ada. */
function apiAutorisasi() {
  var i = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL), st = i.getAuthorizationStatus();
  var out = { status: String(st), diperlukan: st === ScriptApp.AuthorizationStatus.REQUIRED, url: null, email: Session.getActiveUser().getEmail() };
  if (out.diperlukan) { try { out.url = i.getAuthorizationUrl(); } catch (e) { out.url = 'galat: ' + e.message; } }
  try { out.izinSkrip = ScriptApp.getOAuthToken() ? 'ada token' : 'tidak ada'; } catch (e) { out.izinSkrip = 'galat: ' + e.message; }
  return out;
}
