/**
 * Zakat mal: hanya emas dan perak. Nisab dan haul per anggota per logam, berbasis gram (bukan harga).
 * - Haul mulai saat saldo gram mencapai nisab; turun di bawah nisab mengosongkan, mulai lagi saat tercapai.
 * - Sesudah pembayaran, haul berikutnya mulai pada tanggal bayar hanya bila sisa >= nisab.
 * - Emas/perak yang dipinjamkan sudah keluar dari saldo (Pinjamkan) dan kembali saat Cicilan diterima.
 * - zakat_idr = tarif x gram pada akhir haul x harga per gram.
 */
(function (root) {
  'use strict';
  var D = (root.HF && root.HF.dates) || require('./dates.js');
  var L = (root.HF && root.HF.ledger) || require('./ledger.js');
  var C = (root.HF && root.HF.catalog) || require('./catalog.js');
  var LOGAM = ['emas', 'perak'];

  /** Kategori zakat aset pada tanggal tertentu. Jenis diubah di Ubah: sebelum jenis_berlaku memakai kategori_zakat_lama, sesudahnya yang baru. */
  function kategoriPada(a, tgl) {
    var baru = a.kategori_zakat || C.zakatKategori(a);
    if (a.jenis_berlaku && tgl < a.jenis_berlaku) return a.kategori_zakat_lama || '';
    return baru;
  }

  function setting(p, k, d) { var v = p && p[k]; return v === undefined || v === '' || v === null ? d : Number(v); }

  /**
   * o: { trx[], aset[], anggota[], bayar[] (Zakat_Bayar), pengaturan{}, hariIni, hargaGram{emas,perak} }
   * Mengembalikan baris Zakat: satu per anggota aktif x logam.
   */
  function hitung(o) {
    var P = o.pengaturan || {}, haulHari = setting(P, 'haul_hari', 354), tarif = setting(P, 'tarif_zakat', 0.025);
    var nisab = { emas: setting(P, 'nisab_emas_gram', 85), perak: setting(P, 'nisab_perak_gram', 595) };
    var asetMap = {}; o.aset.forEach(function (a) { asetMap[a.aset_id] = a; });
    var active = o.trx.filter(function (t) { return !t.status || t.status === 'aktif'; });
    var rows = [];

    o.anggota.filter(function (m) { return m.aktif !== false; }).forEach(function (m) {
      LOGAM.forEach(function (logam) {
        var ev = []; // { tgl, gram, bentuk }
        active.forEach(function (t) {
          L.effects(t).forEach(function (e) {
            var a = asetMap[e.aset_id];
            if (!a || e.anggota_id !== m.anggota_id) return;
            if (kategoriPada(a, t.tanggal) !== logam) return;
            ev.push({ tgl: t.tanggal, gram: e.delta * C.gramPerUnit(a), fisik: a.bentuk === 'Fisik' });
          });
        });
        // Jenis aset diubah: pada jenis_berlaku seluruh saldo aset itu pindah dari kategori lama ke yang baru (zakat yang sudah dibayar tidak disentuh).
        o.aset.forEach(function (a) {
          if (!a.jenis_berlaku) return;
          var lama = a.kategori_zakat_lama || '', baru = a.kategori_zakat || C.zakatKategori(a);
          if (lama === baru || (lama !== logam && baru !== logam)) return;
          var bal = 0;
          active.forEach(function (t) {
            if (t.tanggal >= a.jenis_berlaku) return;
            L.effects(t).forEach(function (e) { if (e.aset_id === a.aset_id && e.anggota_id === m.anggota_id) bal += e.delta; });
          });
          if (!bal) return;
          var g = bal * C.gramPerUnit(a), fisik = a.bentuk === 'Fisik';
          if (lama === logam) ev.push({ tgl: a.jenis_berlaku, gram: -g, fisik: fisik });
          if (baru === logam) ev.push({ tgl: a.jenis_berlaku, gram: g, fisik: fisik });
        });
        var pays = (o.bayar || []).filter(function (b) { return b.status !== 'dihapus' && b.anggota_id === m.anggota_id && b.logam === logam; });
        var dates = {};
        ev.forEach(function (e) { dates[e.tgl] = 1; });
        pays.forEach(function (b) { dates[b.tanggal_bayar] = 1; });
        var days = Object.keys(dates).sort();

        var bal = 0, start = null, lastClosed = null, paidHauls = {};
        function balAt(tgl) { return ev.reduce(function (s, e) { return e.tgl <= tgl ? s + e.gram : s; }, 0); }
        days.forEach(function (d) {
          ev.forEach(function (e) { if (e.tgl === d) bal += e.gram; });
          var closedToday = false;
          // Pembayaran lebih dulu: zakat dari aset menurunkan saldo di hari yang sama dan tidak boleh membatalkan haul yang dibayar.
          pays.filter(function (b) { return b.tanggal_bayar === d; }).forEach(function (b) {
            var cur = start ? 'HL-' + m.anggota_id + '-' + logam + '-' + start : null;
            if (cur && b.haul_id === cur) {
              paidHauls[cur] = true;
              lastClosed = { tgl: d, mulai: start, id: cur };
              start = null; closedToday = true;
              if (bal >= nisab[logam] - 1e-9) start = d; // haul berikutnya mulai dari tanggal bayar
            }
          });
          if (!closedToday) {
            if (start && bal < nisab[logam] - 1e-9) { start = null; lastClosed = null; }
            else if (!start && bal >= nisab[logam] - 1e-9) start = d;
          } else if (start && bal < nisab[logam] - 1e-9) start = null;
        });

        var fisik = 0, digital = 0;
        ev.forEach(function (e) { if (e.fisik) fisik += e.gram; else digital += e.gram; });
        fisik = Math.max(0, Math.round(fisik * 1e6) / 1e6); digital = Math.max(0, Math.round(digital * 1e6) / 1e6);

        var row = { tanggal_hitung: o.hariIni, anggota_id: m.anggota_id, logam: logam, mulai_haul: '', status_haul: 'belum nisab',
          gram_fisik: fisik, gram_digital: digital, saldo_akhir_haul: null, zakat_idr: null, haul_id: '', jatuh_tempo: '',
          hari_tersisa: null, wajib: false };
        if (start) {
          var due = D.addDays(start, haulHari), sisa = D.diffDays(due, o.hariIni);
          var gAkhir = balAt(sisa < 0 ? due : o.hariIni);
          row.mulai_haul = start; row.haul_id = 'HL-' + m.anggota_id + '-' + logam + '-' + start;
          row.jatuh_tempo = due; row.hari_tersisa = sisa;
          row.status_haul = sisa > 0 ? 'berjalan' : sisa === 0 ? 'jatuh tempo' : 'terlambat';
          row.saldo_akhir_haul = Math.round(gAkhir * 1e6) / 1e6;
          row.wajib = sisa <= 0;
          var hg = o.hargaGram && o.hargaGram[logam];
          row.zakat_idr = hg > 0 ? Math.round(gAkhir * hg * tarif) : null;
        } else if (lastClosed) {
          row.status_haul = 'dibayar'; row.mulai_haul = lastClosed.mulai; row.haul_id = lastClosed.id;
        }
        rows.push(row);
      });
    });
    return rows;
  }

  var api = { hitung: hitung, kategoriPada: kategoriPada, LOGAM: LOGAM };
  root.HF = root.HF || {};
  root.HF.zakat = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
