/**
 * Hartafolio — cadangan Sheet mingguan.
 * Setiap Minggu dini hari (Asia/Jakarta) seluruh Sheet disalin utuh ("Hartafolio cadangan 2026-11-29") ke folder "Hartafolio Cadangan"
 * di Drive pemilik. Yang disimpan 8 salinan terakhir; yang lebih lama dibuang ke tempat sampah Drive. Id salinan dicatat di Pengaturan
 * (cadangan_ids), tanggal terakhir atau galat terakhir di cadangan_terakhir. Memindahkan ke folder dan membuang yang lama dikerjakan
 * sebisanya: bila izin sempit `drive.file` tidak mengizinkan, salinan tetap tersimpan (di Drive utama) dan galatnya dicatat.
 * Dinyalakan dari menu Hartafolio › Nyalakan cadangan mingguan (satu persetujuan Google tambahan: jadwal otomatis).
 */
var CADANGAN_SIMPAN = 8;
var CADANGAN_FUNGSI = 'cadanganMingguan';

function Cadangan_set_(kunci, nilai, ket) {
  if (kunci in Repo_settings_()) Repo_update_('Pengaturan', kunci, { nilai: nilai });
  else Repo_append_('Pengaturan', [{ kunci: kunci, nilai: nilai, keterangan: ket }]);
}

function Cadangan_folderId_() {
  var id = Repo_settings_().cadangan_folder_id;
  if (id) { try { var f = Drive.Files.get(id, { fields: 'id,trashed' }); if (f && f.id && !f.trashed) return f.id; } catch (e) { /* hilang: buat lagi */ } }
  var baru = Drive.Files.create({ name: 'Hartafolio Cadangan', mimeType: 'application/vnd.google-apps.folder' }, null, { fields: 'id' }).id;
  Cadangan_set_('cadangan_folder_id', baru, 'Folder Drive untuk cadangan mingguan');
  return baru;
}

/** Satu cadangan sekarang. Mengembalikan { id, nama, catatan:[peringatan] }. */
function Cadangan_buat_() {
  return Master_dalamKunci_(function () {
    var ss = SpreadsheetApp.getActiveSpreadsheet(), catatan = [];
    var hari = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd'), nama = 'Hartafolio cadangan ' + hari;
    var id = ss.copy(nama).getId();
    try { Drive.Files.update({}, id, null, { addParents: Cadangan_folderId_(), removeParents: 'root', fields: 'id' }); }
    catch (e) { catatan.push('Salinan tidak bisa dipindah ke folder Hartafolio Cadangan; tetap ada di Drive utama.'); }
    var ids = String(Repo_settings_().cadangan_ids || '').split(',').filter(Boolean);
    ids.push(id);
    while (ids.length > CADANGAN_SIMPAN) {
      var lama = ids.shift();
      try { Drive.Files.update({ trashed: true }, lama, null, { fields: 'id' }); } catch (e2) { catatan.push('Cadangan lama tidak bisa dibuang otomatis; hapus sendiri dari Drive.'); }
    }
    Cadangan_set_('cadangan_ids', ids.join(','), 'Id salinan cadangan (terlama dulu)');
    Cadangan_set_('cadangan_terakhir', hari + (catatan.length ? ' (dengan catatan)' : ''), 'Cadangan terakhir');
    return { id: id, nama: nama, catatan: catatan };
  });
}

/** Dipanggil jadwal. Galat dicatat di Pengaturan supaya terlihat tanpa membuka log. */
function cadanganMingguan() {
  try { return Cadangan_buat_(); }
  catch (e) { try { Cadangan_set_('cadangan_terakhir', 'GAGAL: ' + (e && e.message), 'Cadangan terakhir'); } catch (e2) { /* tidak ada yang bisa dicatat */ } throw e; }
}

function Cadangan_jadwal_() { return ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === CADANGAN_FUNGSI; }); }

function cadanganNyalakan() {
  Cadangan_jadwal_().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger(CADANGAN_FUNGSI).timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(3).inTimezone('Asia/Jakarta').create();
  Cadangan_set_('cadangan_aktif', 'ya', 'Cadangan mingguan menyala');
  var r = Cadangan_buat_();
  SpreadsheetApp.getUi().alert('Cadangan mingguan menyala: setiap Minggu sekitar pukul 03.00. Cadangan pertama sudah dibuat: ' + r.nama + '.' + (r.catatan.length ? '\n\n' + r.catatan.join('\n') : ''));
  return r;
}

function cadanganMatikan() {
  Cadangan_jadwal_().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  Cadangan_set_('cadangan_aktif', 'tidak', 'Cadangan mingguan menyala');
  SpreadsheetApp.getUi().alert('Cadangan mingguan dimatikan. Salinan yang sudah ada tetap di Drive.');
}

function cadanganSekarang() {
  var r = Cadangan_buat_();
  SpreadsheetApp.getUi().alert('Cadangan dibuat: ' + r.nama + '.' + (r.catatan.length ? '\n\n' + r.catatan.join('\n') : ''));
  return r;
}
