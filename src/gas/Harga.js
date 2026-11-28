/**
 * Hartafolio — harga otomatis. Mengambil harga dari sumber gratis (aturan dan sumbernya di src/engine/harga-fetch.js) dan menambah baris
 * di tab Harga. Dijalankan jadwal tiap 6 jam (Asia/Jakarta) atau dari menu. Jawaban yang gagal ditulis berstatus "gagal" sehingga harga
 * terakhir yang baik tetap dipakai. Catatan terakhir (waktu, atau galat) ada di Pengaturan, baris harga_terakhir.
 * Butuh izin Google tambahan: menghubungi layanan luar (script.external_request) dan jadwal otomatis.
 */
var HARGA_FUNGSI = 'hargaOtomatis';
var HARGA_JAM = 6;

function Harga_ambil_(reqs) {
  if (!reqs.length) return [];
  return UrlFetchApp.fetchAll(reqs.map(function (r) { return { url: r.url, muteHttpExceptions: true, headers: { 'User-Agent': 'Mozilla/5.0' } }; }))
    .map(function (res) { return res.getResponseCode() === 200 ? res.getContentText() : null; });
}

/** Ambil semua sumber lalu tambahkan baris Harga. Mengembalikan { baris, ok, gagal }. */
function Harga_perbarui_() {
  var F = HF.hargaFetch, aset = Repo_read_('Aset'), p = F.rencana(aset), u = F.urls(p);
  var reqs = [], tag = [];
  if (u.coingecko) { reqs.push({ url: u.coingecko }); tag.push(['coingecko']); }
  if (u.kurs) { reqs.push({ url: u.kurs }); tag.push(['kurs']); }
  u.logam.forEach(function (l) { reqs.push({ url: l.url }); tag.push(['logam', l.kode]); });
  u.saham.forEach(function (s) { reqs.push({ url: s.url }); tag.push(['saham', s.ticker]); });
  var teks = Harga_ambil_(reqs), hasil = { coingecko: null, logam: {}, saham: {}, kurs: null };
  tag.forEach(function (t, i) {
    var x = teks[i]; if (x === null) return;
    if (t[0] === 'coingecko') hasil.coingecko = F.parse.coingecko(x);
    else if (t[0] === 'kurs') hasil.kurs = F.parse.kurs(x);
    else if (t[0] === 'logam') hasil.logam[t[1]] = F.parse.logam(x);
    else if (t[0] === 'saham') { var s = F.parse.saham(x); if (s) hasil.saham[t[1]] = s; }
  });
  var waktu = Master_now_(), baris = F.susun(aset, hasil, waktu);
  var gagal = baris.filter(function (r) { return r.status === 'gagal'; }).length;
  Master_dalamKunci_(function () {
    Repo_append_('Harga', baris);
    Cadangan_set_('harga_terakhir', waktu + (gagal ? ' (' + gagal + ' gagal)' : ''), 'Pembaruan harga otomatis terakhir');
  });
  return { baris: baris.length, ok: baris.length - gagal, gagal: gagal, waktu: waktu };
}

/** Dipanggil jadwal. Galat dicatat di Pengaturan supaya terlihat tanpa membuka log. */
function hargaOtomatis() {
  try { return Harga_perbarui_(); }
  catch (e) { try { Cadangan_set_('harga_terakhir', 'GAGAL: ' + (e && e.message), 'Pembaruan harga otomatis terakhir'); } catch (e2) { /* tidak ada yang bisa dicatat */ } throw e; }
}

function Harga_jadwal_() { return ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === HARGA_FUNGSI; }); }

function hargaNyalakan() {
  Harga_jadwal_().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger(HARGA_FUNGSI).timeBased().everyHours(HARGA_JAM).create();
  Cadangan_set_('harga_aktif', 'ya', 'Harga otomatis menyala');
  var r = Harga_perbarui_();
  SpreadsheetApp.getUi().alert('Harga otomatis menyala: diperbarui tiap ' + HARGA_JAM + ' jam. Pembaruan pertama: ' + r.ok + ' harga masuk' + (r.gagal ? ', ' + r.gagal + ' gagal (harga terakhir yang baik tetap dipakai)' : '') + '.');
  return r;
}

function hargaMatikan() {
  Harga_jadwal_().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  Cadangan_set_('harga_aktif', 'tidak', 'Harga otomatis menyala');
  SpreadsheetApp.getUi().alert('Harga otomatis dimatikan. Harga yang sudah tercatat tetap dipakai.');
}

function hargaSekarang() {
  var r = Harga_perbarui_();
  SpreadsheetApp.getUi().alert('Harga diperbarui: ' + r.ok + ' masuk' + (r.gagal ? ', ' + r.gagal + ' gagal' : '') + '.');
  return r;
}
