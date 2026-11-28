/**
 * Hartafolio — harga otomatis. Mengambil harga dari sumber gratis (aturan dan sumbernya di src/engine/harga-fetch.js) dan menambah baris
 * di tab Harga. Dijalankan jadwal tiap 3 jam, saat aplikasi dibuka (paling sering tiap 30 menit), atau dari menu. Jawaban yang gagal ditulis berstatus "gagal" sehingga harga
 * terakhir yang baik tetap dipakai. Catatan terakhir (waktu, atau galat) ada di Pengaturan, baris harga_terakhir.
 * Butuh izin Google tambahan: menghubungi layanan luar (script.external_request) dan jadwal otomatis.
 */
var HARGA_FUNGSI = 'hargaOtomatis';
var HARGA_PADAT = 'hargaPadatkan';
var HARGA_JAM = 3;
var HARGA_SEGAR_MENIT = 30; // dibuka lagi sebelum ini: pakai harga yang ada, tidak mengambil lagi
var HARGA_PADAT_HARI = 7; // baris lebih tua dari ini dipadatkan jadi satu per aset per hari

/** Mengembalikan [{ teks, kode }] searah reqs; teks null bila kode bukan 200 (kode 0 = tidak terjangkau). */
function Harga_ambil_(reqs) {
  if (!reqs.length) return [];
  return UrlFetchApp.fetchAll(reqs.map(function (r) { return { url: r.url, muteHttpExceptions: true, headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }; }))
    .map(function (res) { var k = res.getResponseCode(); return { kode: k, teks: k === 200 ? res.getContentText() : null }; });
}

/** Ambil semua sumber lalu tambahkan baris Harga yang berubah. Mengembalikan { baris, ok, gagal, waktu, catatan }. */
function Harga_perbarui_() {
  var F = HF.hargaFetch, aset = Repo_read_('Aset'), p = F.rencana(aset), u = F.urls(p);
  var reqs = [], tag = [];
  if (u.coingecko) { reqs.push({ url: u.coingecko }); tag.push(['coingecko']); reqs.push({ url: u.llama }); tag.push(['llama']); }
  if (u.kurs) { reqs.push({ url: u.kurs }); tag.push(['kurs']); }
  u.logam.forEach(function (l) { reqs.push({ url: l.url }); tag.push(['logam', l.kode]); });
  u.saham.forEach(function (s) { reqs.push({ url: s.url }); tag.push(['saham', s.ticker]); });
  var jawab = Harga_ambil_(reqs), hasil = { coingecko: null, llama: null, logam: {}, saham: {}, kurs: null }, catatan = [];
  tag.forEach(function (t, i) {
    var x = jawab[i].teks, nama = t[0] + (t[1] ? ' ' + t[1] : '');
    if (x === null) { catatan.push(nama + ': HTTP ' + jawab[i].kode); return; }
    var ok = true;
    if (t[0] === 'coingecko') ok = !!(hasil.coingecko = F.parse.coingecko(x));
    else if (t[0] === 'llama') ok = !!(hasil.llama = F.parse.llama(x));
    else if (t[0] === 'kurs') ok = !!(hasil.kurs = F.parse.kurs(x));
    else if (t[0] === 'logam') ok = !!(hasil.logam[t[1]] = F.parse.logam(x));
    else if (t[0] === 'saham') { var s = F.parse.saham(x); if (s) hasil.saham[t[1]] = s; else ok = false; }
    if (!ok) catatan.push(nama + ': jawaban tidak dikenal');
  });
  var terakhir = Repo_prices_().terakhir;
  if (p.kursKunci && terakhir[HF.catalog.KURS_ID]) hasil.kurs = terakhir[HF.catalog.KURS_ID].harga; // Dolar AS manual dipakai untuk emas dan perak juga
  var waktu = Master_now_(), semua = F.susun(aset, hasil, waktu), baris = F.saring(semua, terakhir, waktu);
  var gagal = semua.filter(function (r) { return r.status === 'gagal'; }).length;
  var ringkas = waktu + (gagal ? ' (' + gagal + ' gagal)' : '') + (catatan.length ? ' · ' + catatan.join('; ') : '');
  Master_dalamKunci_(function () {
    Repo_append_('Harga', baris);
    Cadangan_set_('harga_terakhir', ringkas, 'Pembaruan harga otomatis terakhir');
  });
  return { baris: baris.length, ok: semua.length - gagal, gagal: gagal, waktu: waktu, catatan: catatan };
}

/**
 * Dipanggil aplikasi saat dibuka. Mengambil harga hanya bila pembaruan terakhir lebih dari HARGA_SEGAR_MENIT menit lalu.
 * Tidak pernah melempar galat ke layar: gagal = harga yang ada tetap dipakai.
 */
function apiHargaSegarkan() {
  try {
    var t = String(Repo_settings_().harga_terakhir || '').match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/);
    if (t && Date.now() - new Date(t[1] + 'T' + t[2] + ':00+07:00').getTime() < HARGA_SEGAR_MENIT * 60000) return { diperbarui: false, alasan: 'baru' };
    var r = Harga_perbarui_();
    return { diperbarui: r.baris > 0, waktu: r.waktu, gagal: r.gagal };
  } catch (e) {
    try { Cadangan_set_('harga_terakhir', Master_now_() + ' GAGAL: ' + (e && e.message), 'Pembaruan harga otomatis terakhir'); } catch (e2) { /* tidak ada yang bisa dicatat */ }
    return { diperbarui: false, alasan: 'galat' };
  }
}

/** Padatkan tab Harga: baris lama jadi satu per aset per hari (aturan di HF.hargaFetch.padatkan). Menulis baris yang disimpan dulu, baru mengosongkan sisanya. */
function Harga_padatkan_() {
  return Master_dalamKunci_(function () {
    var sh = Repo_sheet_('Harga');
    var rows = Repo_read_('Harga'), batas = Utilities.formatDate(new Date(Date.now() - HARGA_PADAT_HARI * 86400000), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm');
    var r = HF.hargaFetch.padatkan(rows, batas);
    if (!r.buang) return { sebelum: rows.length, sesudah: rows.length, buang: 0 };
    var vals = r.simpan.map(function (o) { return HF.schema.objToRow('Harga', o); }), cols = vals[0].length, last = sh.getLastRow();
    sh.getRange(2, 1, vals.length, cols).setValues(vals);
    if (last > vals.length + 1) sh.getRange(vals.length + 2, 1, last - vals.length - 1, cols).clearContent();
    Cadangan_set_('harga_padat_terakhir', Master_now_() + ' (' + rows.length + ' → ' + vals.length + ' baris)', 'Tab Harga dipadatkan terakhir');
    return { sebelum: rows.length, sesudah: vals.length, buang: r.buang };
  });
}

function hargaPadatkan() {
  try { return Harga_padatkan_(); }
  catch (e) { try { Cadangan_set_('harga_padat_terakhir', Master_now_() + ' GAGAL: ' + (e && e.message), 'Tab Harga dipadatkan terakhir'); } catch (e2) { /* tidak ada yang bisa dicatat */ } throw e; }
}

function hargaPadatkanSekarang() {
  var r = Harga_padatkan_();
  SpreadsheetApp.getUi().alert('Tab Harga dirapikan: ' + r.sebelum + ' baris menjadi ' + r.sesudah + '.');
  return r;
}

/** Dipanggil jadwal. Galat dicatat di Pengaturan supaya terlihat tanpa membuka log. */
function hargaOtomatis() {
  try { return Harga_perbarui_(); }
  catch (e) { try { Cadangan_set_('harga_terakhir', Master_now_() + ' GAGAL: ' + (e && e.message), 'Pembaruan harga otomatis terakhir'); } catch (e2) { /* tidak ada yang bisa dicatat */ } throw e; }
}

function Harga_jadwal_() { return ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === HARGA_FUNGSI || t.getHandlerFunction() === HARGA_PADAT; }); }

function hargaNyalakan() {
  Harga_jadwal_().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger(HARGA_FUNGSI).timeBased().everyHours(HARGA_JAM).create();
  ScriptApp.newTrigger(HARGA_PADAT).timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(4).inTimezone('Asia/Jakarta').create();
  Cadangan_set_('harga_aktif', 'ya', 'Harga otomatis menyala');
  var r = Harga_perbarui_();
  SpreadsheetApp.getUi().alert('Harga otomatis menyala: diperbarui tiap ' + HARGA_JAM + ' jam dan saat aplikasi dibuka; tab Harga dirapikan tiap Minggu. Pembaruan pertama: ' + r.ok + ' harga masuk' + (r.gagal ? ', ' + r.gagal + ' gagal (harga terakhir yang baik tetap dipakai)' : '') + (r.catatan.length ? '\n\n' + r.catatan.join('\n') : ''));
  return r;
}

function hargaMatikan() {
  Harga_jadwal_().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  Cadangan_set_('harga_aktif', 'tidak', 'Harga otomatis menyala');
  SpreadsheetApp.getUi().alert('Harga otomatis dimatikan. Harga yang sudah tercatat tetap dipakai.');
}

function hargaSekarang() {
  var r = Harga_perbarui_();
  SpreadsheetApp.getUi().alert('Harga diperbarui: ' + r.ok + ' masuk' + (r.gagal ? ', ' + r.gagal + ' gagal' : '') + (r.catatan.length ? '\n\n' + r.catatan.join('\n') : ''));
  return r;
}
