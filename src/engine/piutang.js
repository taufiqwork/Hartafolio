/**
 * Piutang ke pihak luar (tanpa bunga dan denda). Jadwal diturunkan, status terlambat dihitung, tidak disimpan.
 * Pembayaran = transaksi Cicilan diterima / Pelunasan diterima dengan link_id = piutang_id;
 * melunasi cicilan paling lama lebih dulu.
 */
(function (root) {
  'use strict';
  var D = (root.HF && root.HF.dates) || require('./dates.js');
  var EPS = 1e-9;

  function r8(x) { return Math.round(x * 1e8) / 1e8; }

  /** Jadwal: tanggal pertama lalu tiap bulan di tanggal yang sama (mundur ke akhir bulan bila perlu). */
  function jadwal(p) {
    var n = p.cara === 'cicilan' ? Math.max(1, p.jumlah_cicilan || 1) : 1;
    var day = +String(p.mulai_atau_jatuh_tempo).slice(8, 10);
    var each = r8(p.jumlah_pokok / n), out = [], used = 0;
    for (var i = 0; i < n; i++) {
      var amt = i === n - 1 ? r8(p.jumlah_pokok - used) : each;
      used += amt;
      out.push({ ke: i + 1, tanggal: D.addMonths(p.mulai_atau_jatuh_tempo, i, day), jumlah: amt });
    }
    return out;
  }

  function terbayar(p, trxList) {
    return trxList.filter(function (t) {
      return (!t.status || t.status === 'aktif') && t.link_id === p.piutang_id &&
        (t.jenis === 'Cicilan diterima' || t.jenis === 'Pelunasan diterima');
    }).reduce(function (s, t) { return s + (t.jumlah || 0); }, 0);
  }

  /** Status lengkap pada tanggal hariIni. */
  function status(p, trxList, hariIni) {
    var js = jadwal(p), paid = terbayar(p, trxList), left = paid, tunggakan = 0, terlambatN = 0, tertua = null, berikut = null;
    js.forEach(function (c) {
      var pay = Math.min(left, c.jumlah); left = r8(left - pay);
      c.terbayar = r8(pay); c.sisa = r8(c.jumlah - pay);
      if (c.sisa <= EPS) c.status = 'lunas';
      else if (c.tanggal < hariIni) { c.status = 'terlambat'; tunggakan += c.sisa; terlambatN++; if (!tertua) tertua = c; }
      else if (c.tanggal === hariIni) { c.status = 'hari ini'; if (!berikut) berikut = c; }
      else { c.status = 'belum'; if (!berikut) berikut = c; }
    });
    var sisa = r8(p.jumlah_pokok - paid);
    var lunas = sisa <= EPS;
    return {
      jadwal: js, terbayar: r8(paid), sisa: lunas ? 0 : sisa, lunas: lunas,
      terlambat: terlambatN > 0, cicilanTerlambat: terlambatN, tunggakan: r8(tunggakan),
      hariTerlambat: tertua ? D.diffDays(hariIni, tertua.tanggal) : 0,
      berikutnya: lunas ? null : berikut,
      jatuhTempoHariIni: js.some(function (c) { return c.status === 'hari ini'; })
    };
  }

  /** Jenis transaksi untuk pembayaran: melunasi seluruh sisa = Pelunasan, selain itu Cicilan. */
  function jenisPenerimaan(sisa, jumlah) { return jumlah >= sisa - EPS ? 'Pelunasan diterima' : 'Cicilan diterima'; }

  /** Baris transaksi Pinjamkan untuk piutang baru; saldo pemberi berkurang di lokasi asalnya. */
  function trxPinjam(p, meta) {
    return Object.assign({ jenis: 'Pinjamkan', tanggal: meta.tanggal, jam: meta.jam || '', anggota_id: p.pemberi_anggota_id,
      aset_id: p.aset_id, lokasi_id: p.lokasi_id, jumlah: p.jumlah_pokok, link_id: p.piutang_id, status: 'aktif',
      sumber: meta.sumber || 'manual' }, meta.extra || {});
  }

  /** Baris transaksi penerimaan: selalu kembali ke pemberi dan lokasi asal. */
  function trxTerima(p, sisa, jumlah, meta) {
    return Object.assign({ jenis: jenisPenerimaan(sisa, jumlah), tanggal: meta.tanggal, jam: meta.jam || '',
      anggota_id: p.pemberi_anggota_id, aset_id: p.aset_id, lokasi_id: p.lokasi_id, jumlah: jumlah, link_id: p.piutang_id,
      status: 'aktif', sumber: meta.sumber || 'manual' }, meta.extra || {});
  }

  /** Validasi penerimaan: tidak boleh melebihi sisa. */
  function validasiTerima(sisa, jumlah) {
    if (!(jumlah > 0)) return 'jumlah:harus-positif';
    if (jumlah > sisa + EPS) return 'jumlah:melebihi-sisa';
    return '';
  }

  var api = { jadwal: jadwal, terbayar: terbayar, status: status, jenisPenerimaan: jenisPenerimaan, trxPinjam: trxPinjam,
    trxTerima: trxTerima, validasiTerima: validasiTerima };
  root.HF = root.HF || {};
  root.HF.piutang = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
