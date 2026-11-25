/**
 * Hartafolio — foto bukti transaksi di Google Drive pengguna.
 * Memakai layanan bawaan DriveApp (tidak perlu menyalakan Drive API di Google Cloud, tidak ada pengaturan akun tambahan).
 * Folder "Hartafolio Bukti" dibuat sekali; id-nya disimpan di Pengaturan (folder_bukti_id). Sheet hanya menyimpan tautan di kolom `bukti`.
 * Izin: layar persetujuan Google muncul satu kali untuk pemilik salinan.
 */
var BUKTI_MAX_B64 = 4 * 1024 * 1024; // foto sudah dikecilkan di perangkat (~200 KB); batas jaga-jaga

function Bukti_folder_() {
  var id = Repo_settings_().folder_bukti_id, f = null;
  if (id) { try { f = DriveApp.getFolderById(id); if (f.isTrashed()) f = null; } catch (e) { f = null; } }
  if (!f) {
    var cari = DriveApp.getFoldersByName('Hartafolio Bukti');
    f = cari.hasNext() ? cari.next() : DriveApp.createFolder('Hartafolio Bukti');
    if (id) Repo_update_('Pengaturan', 'folder_bukti_id', { nilai: f.getId() });
    else Repo_append_('Pengaturan', [{ kunci: 'folder_bukti_id', nilai: f.getId(), keterangan: 'Folder Drive untuk foto bukti' }]);
  }
  return f;
}

/** Unggah satu foto (JPEG/PNG base64) untuk transaksi trxId; tautannya ditambahkan ke kolom bukti. Mengembalikan { url }. */
function apiBuktiUnggah(trxId, foto) {
  return Master_dalamKunci_(function () {
    var trx = Repo_read_('Transaksi').filter(function (t) { return t.trx_id === trxId; })[0];
    if (!trx) throw new Error('Transaksi tidak ditemukan.');
    if (!foto || ['image/jpeg', 'image/png'].indexOf(foto.mime) < 0) throw new Error('Foto harus JPG atau PNG.');
    if (!foto.base64 || foto.base64.length > BUKTI_MAX_B64) throw new Error('Foto terlalu besar.');
    var nama = trxId + '-' + String(foto.nama || 'foto.jpg').replace(/[^\w.\- ]+/g, '');
    var file = Bukti_folder_().createFile(Utilities.newBlob(Utilities.base64Decode(foto.base64), foto.mime, nama)), url = file.getUrl();
    Repo_update_('Transaksi', trxId, { bukti: trx.bukti ? trx.bukti + '\n' + url : url });
    return { url: url };
  });
}

/** Menu Hartafolio › Izinkan Google Drive: menyiapkan folder bukti. Dijalankan pemilik sekali; Google meminta izin saat pertama. */
function izinkanDrive() {
  var f = Bukti_folder_();
  SpreadsheetApp.getUi().alert('Google Drive siap. Folder "Hartafolio Bukti" ada di Drive Anda.\n' + f.getUrl());
  return f.getId();
}
