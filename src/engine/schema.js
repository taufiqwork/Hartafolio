/**
 * Skema Google Sheet Hartafolio: 11 tab, urutan kolom, tipe, daftar pilihan.
 * Sumber: docs/DATA_MODEL.md (v2) di atas docs/riset/struktur-data-v1.md.
 * Mockup menang bila bentrok: Jenis aset memakai 8 pilihan dari form "Aset manual".
 * JS murni; tidak menyentuh SpreadsheetApp.
 */
(function (root) {
  'use strict';

  var VERSI = 3; // 2: kolom alat_bayar_lokasi_id di kanan Transaksi (25 Nov 2026). 3: kategori_zakat_lama dan jenis_berlaku di kanan Aset (28 Nov 2026)
  var OZ_GRAM = 31.1035;

  var ENUM = {
    hubungan: ['Diri sendiri', 'Pasangan', 'Anak', 'Orang tua', 'Saudara', 'Lainnya'],
    lokasiJenis: ['Exchange crypto', 'Wallet crypto', 'Sekuritas saham', 'Aplikasi investasi', 'Emas digital',
      'Bank atau deposito', 'Dompet digital', 'Simpanan fisik', 'Lainnya'],
    kelas: ['Emas', 'Perak', 'Crypto', 'Saham', 'Reksa dana', 'Mata uang', 'Properti', 'Lainnya'],
    bentuk: ['Fisik', 'Token', 'Digital'],
    satuan: ['gram', 'oz', 'koin', 'token', 'lot', 'lembar', 'unit', 'nominal', 'm2'],
    sumberHarga: ['coingecko', 'logam', 'saham', 'kurs', 'tetap', 'manual'],
    statusAset: ['aktif', 'tersembunyi', 'dihapus'],
    jenisTrx: ['Beli', 'Jual', 'Masuk', 'Keluar', 'Pindah', 'Saldo awal', 'Zakat', 'Pinjamkan',
      'Cicilan diterima', 'Pelunasan diterima', 'Penyesuaian'],
    jenisOtomatis: ['Zakat', 'Pinjamkan', 'Cicilan diterima', 'Pelunasan diterima'],
    hargaMataUang: ['IDR', 'USD', 'USDT'],
    kursSumber: ['realtime', 'rata_harian', 'manual', 'import'],
    asalMasuk: ['Hadiah', 'Warisan', 'Dari dompet luar', 'Lainnya'],
    asalKeluar: ['Hadiah', 'Sedekah', 'Ke dompet luar', 'Hilang', 'Lainnya'],
    sumberTrx: ['manual', 'import', 'offline'],
    statusTrx: ['aktif', 'dihapus'],
    statusHarga: ['ok', 'gagal', 'manual'],
    statusHaul: ['belum nisab', 'berjalan', 'jatuh tempo', 'terlambat', 'dibayar'],
    caraPiutang: ['sekali', 'cicilan'],
    statusPiutang: ['berjalan', 'lunas'],
    sumberZakat: ['luar', 'aset'],
    statusAktif: ['aktif', 'dihapus']
  };

  // t: text | num | date (YYYY-MM-DD) | dt (YYYY-MM-DD HH:MM) | bool (ya/tidak)
  function c(n, t, req) { return { n: n, t: t || 'text', req: !!req }; }

  var TABS = {
    Pengaturan: { kind: 'ref', id: 'kunci', cols: [c('kunci', 'text', 1), c('nilai', 'text', 1), c('keterangan')] },
    Anggota: { kind: 'ref', id: 'anggota_id', prefix: 'PM', cols: [
      c('anggota_id', 'text', 1), c('nama', 'text', 1), c('hubungan', 'text', 1), c('is_pengelola', 'bool', 1),
      c('warna'), c('aktif', 'bool', 1), c('dibuat_pada', 'dt', 1)] },
    Lokasi: { kind: 'ref', id: 'lokasi_id', prefix: 'LK', cols: [
      c('lokasi_id', 'text', 1), c('nama', 'text', 1), c('jenis', 'text', 1), c('aktif', 'bool', 1), c('dibuat_pada', 'dt')] },
    Aset: { kind: 'ref', id: 'aset_id', prefix: 'AS', cols: [
      c('aset_id', 'text', 1), c('simbol', 'text', 1), c('nama', 'text', 1), c('kelas', 'text', 1), c('bentuk', 'text', 1),
      c('satuan', 'text', 1), c('gram_per_unit', 'num'), c('mata_uang_harga', 'text', 1), c('sumber_harga', 'text', 1),
      c('kode_sumber'), c('kunci_manual', 'bool', 1), c('kategori_zakat'), c('status', 'text', 1), c('dibuat_pada', 'dt'),
      c('kategori_zakat_lama'), c('jenis_berlaku', 'date')] }, // dua kolom terakhir: jenis aset diubah di Ubah; sebelum jenis_berlaku zakat memakai kategori_zakat_lama
    Transaksi: { kind: 'input', id: 'trx_id', cols: [
      c('trx_id', 'text', 1), c('tanggal', 'date', 1), c('jam', 'text'), c('jenis', 'text', 1), c('anggota_id', 'text', 1),
      c('aset_id', 'text', 1), c('lokasi_id', 'text', 1), c('lokasi_tujuan_id'), c('anggota_tujuan_id'), c('jumlah', 'num', 1),
      c('harga_per_unit', 'num'), c('harga_mata_uang'), c('kurs', 'num'), c('kurs_sumber'), c('kurs_tanggal', 'date'),
      c('kurs_waktu'), c('biaya', 'num'), c('pajak', 'num'), c('alat_bayar_aset_id'), c('asal_alasan'), c('link_id'),
      c('harga_beli_rata2', 'num'), c('bukti'), c('catatan'), c('sumber', 'text', 1), c('status', 'text', 1),
      c('dibuat_pada', 'dt', 1), c('diubah_pada', 'dt'), c('alat_bayar_lokasi_id')] },
    Harga: { kind: 'result', cols: [
      c('waktu', 'dt', 1), c('aset_id', 'text', 1), c('harga', 'num', 1), c('mata_uang', 'text', 1), c('sumber', 'text', 1),
      c('status', 'text', 1)] },
    Snapshot: { kind: 'result', cols: [
      c('periode', 'text', 1), c('dibuat_pada', 'dt', 1), c('anggota_id', 'text', 1), c('aset_id', 'text', 1),
      c('lokasi_id', 'text', 1), c('jumlah', 'num', 1), c('harga_idr', 'num', 1), c('nilai_idr', 'num', 1),
      c('nilai_usd', 'num', 1), c('kurs_usdidr', 'num', 1)] },
    Riwayat_Nilai: { kind: 'result', cols: [
      c('tanggal', 'date', 1), c('anggota_id', 'text', 1), c('total_idr', 'num', 1), c('total_usd', 'num', 1)] },
    Zakat: { kind: 'result', cols: [
      c('tanggal_hitung', 'date', 1), c('anggota_id', 'text', 1), c('logam', 'text', 1), c('mulai_haul', 'date'),
      c('status_haul', 'text', 1), c('gram_fisik', 'num', 1), c('gram_digital', 'num', 1), c('saldo_akhir_haul', 'num'),
      c('zakat_idr', 'num'), c('haul_id', 'text')] },
    Piutang: { kind: 'input', id: 'piutang_id', prefix: 'PT', cols: [
      c('piutang_id', 'text', 1), c('pemberi_anggota_id', 'text', 1), c('peminjam_nama', 'text', 1), c('aset_id', 'text', 1),
      c('lokasi_id', 'text', 1), c('jumlah_pokok', 'num', 1), c('cara', 'text', 1), c('jumlah_cicilan', 'num'),
      c('mulai_atau_jatuh_tempo', 'date', 1), c('catatan'), c('status', 'text', 1), c('dibuat_pada', 'dt', 1),
      c('diubah_pada', 'dt')] },
    Zakat_Bayar: { kind: 'input', id: 'bayar_id', prefix: 'ZB', cols: [
      c('bayar_id', 'text', 1), c('haul_id', 'text', 1), c('anggota_id', 'text', 1), c('logam', 'text', 1),
      c('jumlah_idr', 'num', 1), c('tanggal_bayar', 'date', 1), c('sumber', 'text', 1), c('aset_id'), c('trx_id'),
      c('status', 'text', 1), c('dibuat_pada', 'dt', 1)] }
  };

  var URUTAN = ['Pengaturan', 'Anggota', 'Lokasi', 'Aset', 'Transaksi', 'Harga', 'Snapshot', 'Riwayat_Nilai', 'Zakat',
    'Piutang', 'Zakat_Bayar'];

  var PENGATURAN_AWAL = [
    ['mata_uang_utama', 'IDR', 'Mata uang utama'],
    ['mata_uang_kedua', 'USD', 'Mata uang kedua (nilai pendamping)'],
    ['nisab_emas_gram', '85', 'Nisab emas (gram)'],
    ['nisab_perak_gram', '595', 'Nisab perak (gram)'],
    ['tarif_zakat', '0.025', 'Tarif zakat mal'],
    ['haul_hari', '354', 'Panjang haul (hari)'],
    ['versi_skema', String(VERSI), 'Versi skema; naik hanya saat kolom ditambah di kanan']
  ];

  function colNames(tab) { return TABS[tab].cols.map(function (x) { return x.n; }); }

  /** Periksa header sheet terhadap skema. Kolom tambahan di kanan boleh (versi lebih baru). */
  function checkHeader(tab, header) {
    var want = colNames(tab);
    var got = (header || []).map(function (h) { return String(h == null ? '' : h).trim(); });
    var bad = [];
    for (var i = 0; i < want.length; i++) if (got[i] !== want[i]) bad.push({ col: i + 1, want: want[i], got: got[i] || '' });
    return { ok: bad.length === 0, mismatches: bad, extra: Math.max(0, got.filter(Boolean).length - want.length) };
  }

  function coerce(t, v) {
    if (v === '' || v === null || v === undefined) return t === 'num' ? null : '';
    if (t === 'num') { var n = typeof v === 'number' ? v : Number(String(v).replace(',', '.')); return isNaN(n) ? null : n; }
    if (t === 'bool') return v === true || v === 'ya' || v === 'TRUE' || v === 'true';
    if (v instanceof Date) return v.toISOString().slice(0, t === 'date' ? 10 : 16).replace('T', ' ');
    return String(v);
  }

  function rowToObj(tab, row) {
    var o = {};
    TABS[tab].cols.forEach(function (col, i) { o[col.n] = coerce(col.t, row[i]); });
    return o;
  }

  function objToRow(tab, obj) {
    return TABS[tab].cols.map(function (col) {
      var v = obj[col.n];
      if (v === undefined || v === null) return '';
      if (col.t === 'bool') return v ? 'ya' : 'tidak';
      return v;
    });
  }

  /** ID berikutnya: PM-001, PM-002... Tidak pernah memakai ulang. */
  function nextId(prefix, existing) {
    var max = 0;
    (existing || []).forEach(function (id) {
      var m = new RegExp('^' + prefix + '-(\\d+)$').exec(String(id));
      if (m) max = Math.max(max, Number(m[1]));
    });
    var s = String(max + 1);
    while (s.length < 3) s = '0' + s;
    return prefix + '-' + s;
  }

  /** trx_id mengikuti tanggal: TX-20261103-0007 (nomor) atau TX-20261103-K3F9QZ (kode acak, dipakai Catat). Dipakai juga oleh antrean offline di perangkat. */
  function newTrxId(dateIso, seq) {
    var s = String(seq);
    while (s.length < 4) s = '0' + s;
    return 'TX-' + String(dateIso).replace(/-/g, '') + '-' + s;
  }

  var api = {
    VERSI: VERSI, OZ_GRAM: OZ_GRAM, ENUM: ENUM, TABS: TABS, URUTAN: URUTAN, PENGATURAN_AWAL: PENGATURAN_AWAL,
    colNames: colNames, checkHeader: checkHeader, rowToObj: rowToObj, objToRow: objToRow, nextId: nextId, newTrxId: newTrxId
  };
  root.HF = root.HF || {};
  root.HF.schema = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
