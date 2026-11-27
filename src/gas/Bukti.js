/**
 * Hartafolio — foto bukti transaksi di Google Drive pengguna.
 * Memakai Advanced Drive Service (Drive v3) dengan izin sempit `drive.file`: aplikasi hanya bisa melihat berkas yang ia buat sendiri
 * (folder "Hartafolio Bukti" dan foto di dalamnya), bukan seluruh Drive. DriveApp tidak dipakai karena meminta izin penuh `drive`.
 * Layanan ini dinyalakan lewat appsscript.json (dependencies), tanpa Cloud Console. Folder dibuat sekali; id-nya disimpan di Pengaturan
 * (folder_bukti_id). Sheet hanya menyimpan tautan di kolom `bukti`. Layar persetujuan Google muncul satu kali untuk pemilik salinan.
 */
var BUKTI_MAX_B64 = 4 * 1024 * 1024; // foto sudah dikecilkan di perangkat (~200 KB); batas jaga-jaga

var BUKTI_FOLDER_MIME = 'application/vnd.google-apps.folder';

/** Id folder bukti: dari Pengaturan bila masih ada dan terlihat; kalau tidak, cari yang dibuat aplikasi; kalau tidak ada, buat baru. */
function Bukti_folderId_() {
  var id = Repo_settings_().folder_bukti_id;
  if (id) { try { var f = Drive.Files.get(id, { fields: 'id,trashed' }); if (f && f.id && !f.trashed) return f.id; } catch (e) { /* hilang atau tidak terlihat oleh izin sempit: cari lagi */ } }
  var cari = Drive.Files.list({ q: "name = 'Hartafolio Bukti' and mimeType = '" + BUKTI_FOLDER_MIME + "' and trashed = false", fields: 'files(id)', pageSize: 1 });
  var baru = cari.files && cari.files.length ? cari.files[0].id : Drive.Files.create({ name: 'Hartafolio Bukti', mimeType: BUKTI_FOLDER_MIME }, null, { fields: 'id' }).id;
  if (id) Repo_update_('Pengaturan', 'folder_bukti_id', { nilai: baru });
  else Repo_append_('Pengaturan', [{ kunci: 'folder_bukti_id', nilai: baru, keterangan: 'Folder Drive untuk foto bukti' }]);
  return baru;
}

/** Unggah satu foto (JPEG/PNG base64) untuk transaksi trxId; tautannya ditambahkan ke kolom bukti. Mengembalikan { url }. */
function apiBuktiUnggah(trxId, foto) {
  return Master_dalamKunci_(function () {
    var trx = Repo_read_('Transaksi').filter(function (t) { return t.trx_id === trxId; })[0];
    if (!trx) throw new Error('Transaksi tidak ditemukan.');
    if (!foto || ['image/jpeg', 'image/png'].indexOf(foto.mime) < 0) throw new Error('Foto harus JPG atau PNG.');
    if (!foto.base64 || foto.base64.length > BUKTI_MAX_B64) throw new Error('Foto terlalu besar.');
    var nama = trxId + '-' + String(foto.nama || 'foto.jpg').replace(/[^\w.\- ]+/g, '');
    var blob = Utilities.newBlob(Utilities.base64Decode(foto.base64), foto.mime, nama);
    var file = Drive.Files.create({ name: nama, parents: [Bukti_folderId_()], mimeType: foto.mime }, blob, { fields: 'id,webViewLink' }), url = file.webViewLink;
    Repo_update_('Transaksi', trxId, { bukti: trx.bukti ? trx.bukti + '\n' + url : url });
    return { url: url };
  });
}

/** Menu Hartafolio › Izinkan Google Drive: menyiapkan folder bukti. Dijalankan pemilik sekali; Google meminta izin saat pertama. */
function izinkanDrive() {
  var id = Bukti_folderId_();
  SpreadsheetApp.getUi().alert('Google Drive siap. Folder "Hartafolio Bukti" ada di Drive Anda.\nhttps://drive.google.com/drive/folders/' + id);
  return id;
}
