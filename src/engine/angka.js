/**
 * Angka gaya Indonesia saat diketik: titik = pemisah ribuan (otomatis), koma = desimal.
 * `analisis(teks)` mengembalikan { teks, galat }: teks sudah diformat (titik ribuan disisipkan sendiri) bila valid; bila tidak,
 * teks dibiarkan apa adanya dan galat menjelaskan. galat = { jenis, pesan, perbaiki, pasti }:
 *   jenis: 'titik' (titik dipakai sebagai desimal), 'inggris' (1,234.56), 'koma' (lebih dari satu koma), 'karakter' (bukan angka)
 *   perbaiki: teks usulan (null bila tidak ada); pasti: true bila jelas salah, false bila masih mungkin sedang mengetik ribuan (mis. "1.0").
 */
(function (root) {
  'use strict';

  function kelompok(digit) { return digit.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function ribuan(ip) { return /^[1-9]\d{0,2}(\.\d{3})+$/.test(ip); } // grup pertama tidak berawalan nol: "0.022" bukan ribuan

  function analisis(raw) {
    var s0 = String(raw == null ? '' : raw).replace(/\s/g, ''), s = s0.replace(/[^0-9.,]/g, ''), adaLain = s !== s0;
    var koma = (s.match(/,/g) || []).length;
    if (koma > 1) return { teks: s, galat: { jenis: 'koma', pasti: true, perbaiki: null, pesan: 'Hanya boleh satu koma, untuk desimal.' } };
    var bagian = s.split(','), ip = bagian[0], dp = bagian[1];
    var titik = (ip.match(/\./g) || []).length;
    var ok = function () { return { teks: kelompok(ip.replace(/\./g, '')) + (koma ? ',' + dp : ''), galat: adaLain ? { jenis: 'karakter', pasti: true, perbaiki: null, pesan: 'Hanya angka dan koma.' } : null }; };
    if (!titik && !/\./.test(dp || '')) return ok();
    // ada titik. Bentuk Inggris: 1,234.56 (koma ribuan lalu titik desimal)
    if (koma === 1 && /^\d{1,3}$/.test(ip) && /^\d{3}(\.\d+)?$/.test(dp) && /\./.test(dp)) {
      var fix = kelompok((ip + dp.split('.')[0])) + ',' + dp.split('.')[1];
      return { teks: s, galat: { jenis: 'inggris', pasti: true, perbaiki: fix, pesan: 'Sepertinya memakai format Inggris. Di sini titik untuk ribuan dan koma untuk desimal: ' + fix + '.' } };
    }
    if (/\./.test(dp || '')) return { teks: s, galat: { jenis: 'titik', pasti: true, perbaiki: null, pesan: 'Setelah koma tidak boleh ada titik.' } };
    if (ribuan(ip)) return ok(); // titik ribuan yang benar (diketik sendiri), dirapikan
    // titik yang bukan pemisah ribuan: kemungkinan titik dipakai sebagai desimal
    var akhir = ip.slice(ip.lastIndexOf('.') + 1), depan = ip.slice(0, ip.lastIndexOf('.'));
    if (titik === 1 && !koma && /^\d+$/.test(depan) && /^\d*$/.test(akhir)) {
      if (akhir === '') return { teks: s, galat: null }; // "12." masih diketik
      var perbaiki = depan + ',' + akhir, pasti = !(depan.length <= 3 && akhir.length <= 3); // "1.0" bisa jadi awal "1.000"
      return { teks: s, galat: { jenis: 'titik', pasti: pasti, perbaiki: perbaiki, pesan: 'Titik dan koma tertukar? Di sini titik untuk ribuan dan koma untuk desimal. Maksudnya ' + perbaiki + '?' } };
    }
    return { teks: s, galat: { jenis: 'titik', pasti: true, perbaiki: null, pesan: 'Titik hanya untuk ribuan, tiap tiga angka. Desimal memakai koma.' } };
  }

  /** Nilai angka dari teks yang valid (NaN bila galat). */
  function nilai(teks) { var a = analisis(teks); return a.galat && a.galat.pasti ? NaN : parseFloat(String(a.galat ? teks : a.teks).replace(/\./g, '').replace(',', '.')); }

  /** Letak kursor baru: jumlah karakter bermakna (angka dan koma) sebelum kursor lama dipertahankan. */
  function kursor(lama, posisi, baru) {
    var n = (String(lama).slice(0, posisi).match(/[0-9,]/g) || []).length, i = 0;
    for (; i < baru.length && n > 0; i++) if (/[0-9,]/.test(baru[i])) n--;
    return i;
  }

  var api = { analisis: analisis, nilai: nilai, kursor: kursor, kelompok: kelompok };
  root.HF = root.HF || {};
  root.HF.angka = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
