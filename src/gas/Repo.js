/**
 * Hartafolio — akses data Google Sheet (Apps Script).
 * Logika aturan ada di engine (src/engine); file ini hanya membaca dan menulis baris.
 * Aturan data: header diperiksa sebelum menulis, ID tidak pernah berubah, tidak ada hapus fisik,
 * transaksi dikirim ulang dengan trx_id yang sama tidak menggandakan baris.
 */

var REPO_LOCK_MS = 20000;

function Repo_ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function Repo_sheet_(tab) {
  var sh = Repo_ss_().getSheetByName(tab);
  if (!sh) throw new Error('Tab "' + tab + '" tidak ada. Jalankan Hartafolio › Siapkan sheet.');
  return sh;
}

/** Pastikan urutan kolom sama dengan skema. Kolom tambahan di kanan boleh (versi skema lebih baru). */
function Repo_checkHeader_(tab, sh) {
  var n = Math.max(sh.getLastColumn(), HF.schema.colNames(tab).length);
  var header = sh.getRange(1, 1, 1, n).getValues()[0];
  var r = HF.schema.checkHeader(tab, header);
  if (!r.ok && r.mismatches.every(function (m) { return m.got === ''; })) {
    // Hanya kolom baru di kanan yang kosong (mis. kolom hilang atau Sheet belum dimigrasi): lengkapi sendiri, jangan menghentikan aplikasi.
    Repo_ensureGrid_(sh, sh.getMaxRows(), HF.schema.colNames(tab).length);
    r.mismatches.forEach(function (m) { sh.getRange(1, m.col, 1, 1).setValue(m.want); });
    Setup_dropProtection_(sh); Setup_protectHeader_(sh, tab);
    return;
  }
  if (!r.ok) throw new Error('Header tab "' + tab + '" berubah (kolom ' + r.mismatches[0].col + ': seharusnya "' + r.mismatches[0].want + '"). Kembalikan header atau jalankan Siapkan sheet.');
}

/** Sheet baru hanya 1000 baris x 26 kolom; menulis di luar grid melempar galat. Tambah baris/kolom bila kurang. */
function Repo_ensureGrid_(sh, rows, cols) {
  var r = sh.getMaxRows(), c = sh.getMaxColumns();
  if (r < rows) sh.insertRowsAfter(r, rows - r);
  if (c < cols) sh.insertColumnsAfter(c, cols - c);
}

/** Semua baris tab sebagai objek (baris tanpa ID dilewati). */
function Repo_read_(tab) {
  var sh = Repo_sheet_(tab);
  Repo_checkHeader_(tab, sh);
  var last = sh.getLastRow(), cols = HF.schema.colNames(tab).length;
  if (last < 2) return [];
  var idIdx = 0, vals = sh.getRange(2, 1, last - 1, cols).getValues(), out = [];
  for (var i = 0; i < vals.length; i++) {
    if (vals[i][idIdx] === '' || vals[i][idIdx] === null) continue;
    out.push(HF.schema.rowToObj(tab, vals[i]));
  }
  return out;
}

/** Tambah baris di akhir. Tidak menimpa apa pun. */
function Repo_append_(tab, objs) {
  if (!objs.length) return;
  var sh = Repo_sheet_(tab);
  Repo_checkHeader_(tab, sh);
  var rows = objs.map(function (o) { return HF.schema.objToRow(tab, o); });
  var start = Math.max(sh.getLastRow(), 1) + 1;
  Repo_ensureGrid_(sh, start + rows.length - 1, rows[0].length);
  sh.getRange(start, 1, rows.length, rows[0].length).setValues(rows);
}

/** Ubah kolom tertentu pada baris dengan ID itu. ID tidak bisa diubah. Mengembalikan false bila tidak ditemukan. */
function Repo_update_(tab, id, patch) {
  var def = HF.schema.TABS[tab], sh = Repo_sheet_(tab);
  Repo_checkHeader_(tab, sh);
  var last = sh.getLastRow();
  if (last < 2) return false;
  var ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) !== String(id)) continue;
    Object.keys(patch).forEach(function (k) {
      var ci = HF.schema.colNames(tab).indexOf(k);
      if (ci <= 0) return; // kolom ID (indeks 0) tidak pernah diubah
      var col = def.cols[ci], v = patch[k];
      sh.getRange(i + 2, ci + 1).setValue(col.t === 'bool' ? (v ? 'ya' : 'tidak') : (v === null || v === undefined ? '' : v));
    });
    return true;
  }
  return false;
}

/** Pengaturan sebagai { kunci: nilai-teks }. */
function Repo_settings_() {
  var o = {};
  Repo_read_('Pengaturan').forEach(function (r) { o[r.kunci] = r.nilai; });
  return o;
}

/** Harga terakhir berstatus ok/manual per aset, ditambah seri USDIDR 3 hari terakhir untuk rata-rata kurs. */
function Repo_prices_() {
  var rows = Repo_read_('Harga'), last = {}, kursSeries = [], maxW = '';
  rows.forEach(function (r) { if (r.waktu > maxW) maxW = r.waktu; });
  rows.forEach(function (r) {
    if (r.status === 'gagal') return;
    var cur = last[r.aset_id];
    if (!cur || r.waktu >= cur.waktu) last[r.aset_id] = { harga: r.harga, mata_uang: r.mata_uang, sumber: r.sumber, waktu: r.waktu, status: r.status };
    if (r.aset_id === HF.catalog.KURS_ID) kursSeries.push({ waktu: r.waktu, harga: r.harga });
  });
  kursSeries = kursSeries.sort(function (a, b) { return a.waktu < b.waktu ? -1 : 1; }).slice(-300);
  return { terakhir: last, kursSeries: kursSeries };
}

/** Seluruh keadaan yang dibutuhkan klien untuk menghitung layar. Pengelola hanya satu: akses web app MYSELF. */
function apiState() {
  return {
    versi: HF.schema.VERSI,
    pengaturan: Repo_settings_(),
    anggota: Repo_read_('Anggota'),
    lokasi: Repo_read_('Lokasi'),
    aset: Repo_read_('Aset'),
    transaksi: Repo_read_('Transaksi'),
    piutang: Repo_read_('Piutang'),
    zakatBayar: Repo_read_('Zakat_Bayar'),
    harga: Repo_prices_(),
    serverWaktu: Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm')
  };
}

/**
 * Terima transaksi dari klien atau antrean offline. Idempoten menurut trx_id.
 * Mengembalikan { diterima:[id], duplikat:[id], ditolak:[{trx_id, error}] }.
 */
function apiTransaksiTambah(list) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(REPO_LOCK_MS);
  try {
    var now = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm');
    var existing = Repo_read_('Transaksi');
    var split = HF.queue.dedupe(existing.map(function (t) { return t.trx_id; }), list || []);
    var ctx = {
      trxList: existing,
      asetIds: Repo_read_('Aset').map(function (a) { return a.aset_id; }),
      anggotaIds: Repo_read_('Anggota').map(function (a) { return a.anggota_id; }),
      lokasiIds: Repo_read_('Lokasi').map(function (a) { return a.lokasi_id; })
    };
    var ok = [], rejected = [];
    HF.ledger.sortTrx(split.baru).forEach(function (t) {
      t.status = 'aktif';
      t.dibuat_pada = t.dibuat_pada || now;
      var errs = HF.ledger.validate(t, ctx);
      if (errs.length) { rejected.push({ trx_id: t.trx_id, error: errs[0] }); return; }
      ok.push(t); ctx.trxList = ctx.trxList.concat([t]);
    });
    Repo_append_('Transaksi', ok);
    return { diterima: ok.map(function (t) { return t.trx_id; }), duplikat: split.duplikat, ditolak: rejected };
  } finally { lock.releaseLock(); }
}

/** Ubah transaksi: jenis tidak bisa diubah; badge "Diubah" lewat diubah_pada. Hapus = status dihapus (bisa dipulihkan). */
function apiTransaksiUbah(trxId, patch) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(REPO_LOCK_MS);
  try {
    delete patch.trx_id; delete patch.jenis; delete patch.dibuat_pada;
    patch.diubah_pada = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm');
    return Repo_update_('Transaksi', trxId, patch);
  } finally { lock.releaseLock(); }
}
