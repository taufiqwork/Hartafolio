/**
 * Format tampilan angka dan tanggal Hartafolio.
 * Aturan: docs/design/design-system.md, bagian "Content".
 * JS murni tanpa dependensi: dipakai di Node (uji), Apps Script, dan browser.
 */
(function (root) {
  'use strict';

  var MINUS = '−'; // minus asli, bukan tanda hubung
  var BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  /** Angka dengan titik ribuan dan koma desimal. dec = jumlah desimal tetap. */
  function groupInt(s) {
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function number(n, dec) {
    var abs = Math.abs(n);
    var s = dec === undefined ? String(abs) : abs.toFixed(dec);
    if (dec === undefined && s.indexOf('e') !== -1) s = abs.toFixed(8).replace(/0+$/, '');
    var parts = s.split('.');
    var out = groupInt(parts[0]) + (parts[1] ? ',' + parts[1] : '');
    return (n < 0 && Number(s) !== 0 ? MINUS : '') + out;
  }

  /** "Rp 2.380.000" untuk form dan detail transaksi. */
  function rupiah(n) {
    var r = Math.round(Math.abs(n));
    return (n < 0 && r !== 0 ? MINUS : '') + 'Rp ' + groupInt(String(r));
  }

  /**
   * Ringkas untuk kartu dan ringkasan: "Rp 174,2 jt", "Rp 1,63 jt", "Rp 1,48 M".
   * Di bawah 10 jt dua desimal, mulai 10 jt satu desimal, miliar dua desimal.
   * opts.dec memaksa jumlah desimal (daftar Aset memakai tiga: "Rp 50,400 jt").
   * Di bawah 1 jt ditulis penuh.
   */
  function rupiahShort(n, opts) {
    var abs = Math.abs(n);
    var sign = n < 0 ? MINUS : '';
    var forced = opts && opts.dec;
    var unit, val, dec;
    if (abs >= 1e12) { unit = 'T'; val = abs / 1e12; dec = 2; }
    else if (abs >= 1e9) { unit = 'M'; val = abs / 1e9; dec = 2; }
    else if (abs >= 1e6) { unit = 'jt'; val = abs / 1e6; dec = abs >= 1e7 ? 1 : 2; }
    else return rupiah(n);
    if (forced !== undefined) dec = forced;
    return sign + 'Rp ' + val.toFixed(dec).replace('.', ',') + ' ' + unit;
  }

  /** "$ 9.979" atau "$ 99,56": dec = jumlah desimal. */
  function usd(n, dec) {
    return (n < 0 ? MINUS : '') + '$ ' + number(Math.abs(n), dec === undefined ? 0 : dec);
  }

  /** Perubahan nilai selalu bertanda: "+7,7%", "−1,3%", nol ditulis "0,0%". */
  function percentDelta(p, dec) {
    var d = dec === undefined ? 1 : dec;
    var fixed = Math.abs(p).toFixed(d).replace('.', ',');
    if (Number(fixed.replace(',', '.')) === 0) return fixed + '%';
    return (p > 0 ? '+' : MINUS) + fixed + '%';
  }

  /** Gram: "612 g", "85,5 g". Hanya menampilkan desimal yang ada. */
  function grams(g) {
    var r = Math.round(g * 1000) / 1000;
    return number(r) + ' g';
  }

  function toDate(d) {
    return d instanceof Date ? d : new Date(d);
  }

  /** "6 Nov 2026". */
  function dateId(d) {
    var x = toDate(d);
    return x.getDate() + ' ' + BULAN[x.getMonth()] + ' ' + x.getFullYear();
  }

  /** "Hari ini · 4 Nov", "Kemarin · 3 Nov", selain itu "6 Nov 2026". now bisa diinjeksi untuk uji. */
  function dayGroup(d, now) {
    var x = toDate(d);
    var ref = toDate(now || new Date());
    var a = new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    var b = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();
    var diff = Math.round((b - a) / 86400000);
    var short = x.getDate() + ' ' + BULAN[x.getMonth()];
    if (diff === 0) return 'Hari ini · ' + short;
    if (diff === 1) return 'Kemarin · ' + short;
    return dateId(x);
  }

  /** "14.20" (jam titik menit). */
  function timeId(d) {
    var x = toDate(d);
    return (x.getHours() < 10 ? '0' : '') + x.getHours() + '.' + (x.getMinutes() < 10 ? '0' : '') + x.getMinutes();
  }

  var api = {
    MINUS: MINUS,
    number: number,
    rupiah: rupiah,
    rupiahShort: rupiahShort,
    usd: usd,
    percentDelta: percentDelta,
    grams: grams,
    dateId: dateId,
    dayGroup: dayGroup,
    timeId: timeId
  };

  root.HF = root.HF || {};
  root.HF.format = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
