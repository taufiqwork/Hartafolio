/**
 * Hartafolio — foto bukti transaksi di Google Drive pengguna.
 * Izin sempit: hanya `drive.file` (berkas yang dibuat aplikasi ini), lewat REST Drive v3 dengan UrlFetchApp. Folder "Hartafolio Bukti"
 * dibuat sekali; id-nya disimpan di Pengaturan (folder_bukti_id). Sheet hanya menyimpan tautan di kolom `bukti`.
 */
var BUKTI_MAX_B64 = 4 * 1024 * 1024; // foto sudah dikecilkan di perangkat (~200 KB); batas jaga-jaga

function Bukti_fetch_(method, url, opts) {
  var o = { method: method, headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true };
  Object.keys(opts || {}).forEach(function (k) { o[k] = opts[k]; });
  var r = UrlFetchApp.fetch(url, o), code = r.getResponseCode();
  if (code < 200 || code >= 300) {
    var alasan = ''; try { alasan = JSON.parse(r.getContentText()).error.message || ''; } catch (e) { /* bukan JSON */ }
    throw new Error('Google Drive menolak (' + code + (alasan ? ': ' + alasan : '') + '). Foto belum terunggah.');
  }
  return JSON.parse(r.getContentText());
}

function Bukti_folderId_() {
  var s = Repo_settings_();
  if (s.folder_bukti_id) return s.folder_bukti_id;
  var f = Bukti_fetch_('post', 'https://www.googleapis.com/drive/v3/files?fields=id', { contentType: 'application/json',
    payload: JSON.stringify({ name: 'Hartafolio Bukti', mimeType: 'application/vnd.google-apps.folder' }) });
  Repo_append_('Pengaturan', [{ kunci: 'folder_bukti_id', nilai: f.id, keterangan: 'Folder Drive untuk foto bukti' }]);
  return f.id;
}

/** Unggah satu foto (JPEG/PNG base64) untuk transaksi trxId; tautannya ditambahkan ke kolom bukti. Mengembalikan { url }. */
function apiBuktiUnggah(trxId, foto) {
  return Master_dalamKunci_(function () {
    var trx = Repo_read_('Transaksi').filter(function (t) { return t.trx_id === trxId; })[0];
    if (!trx) throw new Error('Transaksi tidak ditemukan.');
    if (!foto || ['image/jpeg', 'image/png'].indexOf(foto.mime) < 0) throw new Error('Foto harus JPG atau PNG.');
    if (!foto.base64 || foto.base64.length > BUKTI_MAX_B64) throw new Error('Foto terlalu besar.');
    var nama = trxId + '-' + String(foto.nama || 'foto.jpg').replace(/[^\w.\- ]+/g, '');
    var folder = Bukti_folderId_(), B = '----hartafolio' + trxId;
    var head = '--' + B + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify({ name: nama, parents: [folder] }) +
      '\r\n--' + B + '\r\nContent-Type: ' + foto.mime + '\r\nContent-Transfer-Encoding: base64\r\n\r\n';
    var res = Bukti_fetch_('post', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
      contentType: 'multipart/related; boundary=' + B, payload: head + foto.base64 + '\r\n--' + B + '--' });
    var url = res.webViewLink || ('https://drive.google.com/file/d/' + res.id + '/view');
    Repo_update_('Transaksi', trxId, { bukti: trx.bukti ? trx.bukti + '\n' + url : url });
    return { url: url };
  });
}

/** Menu Hartafolio › Izinkan Google Drive: menyiapkan folder bukti. Dijalankan pemilik sekali; Google meminta izin drive.file saat pertama. */
function izinkanDrive() {
  var id = Bukti_folderId_();
  SpreadsheetApp.getUi().alert('Google Drive siap. Folder "Hartafolio Bukti" ada di Drive Anda.\n(id: ' + id + ')');
  return id;
}
