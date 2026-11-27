/**
 * DATA CONTOH (demo) untuk Riwayat, disalin dari board 05-Riwayat. Dipakai dengan `?demo=<keadaan>#/riwayat`.
 * Bisa dihapus bersama src/demo/ (lihat catatan di demo.js). Keadaan: default, filter, detail, detail-zakat, detail-pinjam,
 * detail-cicilan, detail-lunas, detail-pindah, terhapus, daftar-terhapus, kosong, tersimpan, diubah.
 */
(function (root) {
  'use strict';
  var R = root.HF.riwayat, n = 0;
  function row(j, a, q, o, v, x) {
    var p = o.split(' · '), mem = p[0], loc = p.slice(1).join(' · ');
    return Object.assign({ id: ++n, j: j, a: a, q: q, o: o, v: v, mem: mem, loc: loc, imp: false, hs: null, bukti: [], cat: '' }, R.style(j), x || {});
  }
  function day(d, full, mo, tgl, rows) { rows.forEach(function (r) { r.tgl = tgl; }); return { d: d, full: full, mo: mo, rows: rows }; }
  var PIUT = '18-Piutang-2e-Detail', LUNAS = '18-Piutang-2b-Lunas';

  function data(kosong) {
    n = 0;
    var DAYS = [
      day('Hari ini · 9 Nov', '9 Nov 2026', 'Nov 2026', '2026-11-09', [row('Zakat', 'Perak fisik', '−15,3 g', 'Azlan · Brankas', 'Rp 0,71 jt', { id: 99, haul: 'Perak · Azlan', haulHref: '08-Zakat-2d-Riwayat' })]),
      day('4 Nov', '4 Nov 2026', 'Nov 2026', '2026-11-04', [row('Beli', 'PAXG', '+0,0225', 'Azlan · Binance', 'Rp 1,56 jt', { hs: 'Rp 69,3 jt' })]),
      day('3 Nov', '3 Nov 2026', 'Nov 2026', '2026-11-03', [row('Pindah anggota', 'PAXG', '0,0225', 'Azlan → Al Ghafiqi · Binance', 'Rp 1,63 jt'),
        row('Cicilan diterima', 'Emas fisik', '+1 g', 'Azlan · Brankas · dari Bu Rahman'.replace('Bu', 'Pak'), 'Rp 2,38 jt', { dari: 'Pak Rahman', cicilan: '1 dari 5', sisa: '4 g', piutangHref: PIUT })]),
      day('2 Nov', '2 Nov 2026', 'Nov 2026', '2026-11-02', [row('Beli', 'Emas fisik', '+1 g', 'Azlan · Brankas', 'Rp 2,24 jt', { hs: 'Rp 69,3 jt' }), row('Pindah lokasi', 'BTC', '0,002', 'Azlan · Binance → Bybit', 'Rp 2,69 jt')]),
      day('28 Okt', '28 Okt 2026', 'Okt 2026', '2026-10-28', [row('Jual', 'BBCA', '−1 lot', 'Al Ghafiqi · Pluang', 'Rp 0,98 jt', { hs: 'Rp 9.800' })]),
      day('20 Okt', '20 Okt 2026', 'Okt 2026', '2026-10-20', [row('Cicilan diterima', 'Perak fisik', '+50 g', 'Azlan · Brankas · dari Bu Sari', 'Rp 2,33 jt', { dari: 'Bu Sari', cicilan: '1 dari 5', sisa: '4 g', piutangHref: PIUT })]),
      day('3 Okt', '3 Okt 2026', 'Okt 2026', '2026-10-03', [row('Pinjamkan', 'Emas fisik', '−5 g', 'Azlan · Brankas · ke Pak Rahman', 'Rp 11,9 jt', { id: 98, peminjam: 'Pak Rahman', rencana: 'Cicilan 1 g per bulan', piutangHref: PIUT })]),
      day('20 Sep', '20 Sep 2026', 'Sep 2026', '2026-09-20', [row('Pinjamkan', 'Perak fisik', '−100 g', 'Azlan · Brankas · ke Bu Sari', 'Rp 4,66 jt', { peminjam: 'Bu Sari', rencana: 'Cicilan 1 g per bulan', piutangHref: PIUT })]),
      day('20 Mei 2026', '20 Mei 2026', 'Mei 2026', '2026-05-20', [row('Saldo awal', 'PAXG', '+0,1739', 'M. Yahya · Binance', 'Rp 16,9 jt · saldo awal', { imp: true, ref: '2273…4976' }), row('Saldo awal', 'BTC', '+0,0013', 'Yumna · Bybit', 'Rp 1,75 jt · saldo awal', { imp: true, ref: '2273…4976' })])
    ];
    DAYS.splice(1, 0, day('6 Nov', '6 Nov 2026', 'Nov 2026', '2026-11-06', [row('Pelunasan diterima', 'USDT', '+50', 'Azlan · Binance · dari Mas Dedi', 'Rp 0,82 jt', { id: 97, dari: 'Mas Dedi', cara: 'Sekali bayar, lunas', sisa: '0', piutangHref: LUNAS })])); // dibuat paling akhir seperti di board (menentukan nomor id baris lain)
    /* Nomor id mengikuti urutan pembuatan di board (Zakat 99, Pinjamkan emas 98, Pelunasan 97 ditetapkan; sisanya 2 dan seterusnya). */
    return { days: kosong ? [] : DAYS };
  }

  /** Keadaan awal layar (sama dengan prop `mulai` board) dan toast "tersimpan" atau "diubah". */
  function get(mulai) {
    var d = data(mulai === 'kosong');
    var SHEET = { 'detail': 3, 'detail-zakat': 99, 'detail-pinjam': 98, 'detail-cicilan': 5, 'detail-lunas': 97, 'detail-pindah': 4 };
    var ui = { sheet: SHEET[mulai] == null ? null : SHEET[mulai], fOpen: mulai === 'filter' ? 'Jenis' : null, sel: {}, view: mulai === 'daftar-terhapus' ? 'del' : 'list',
      del: mulai === 'terhapus' ? [3] : mulai === 'daftar-terhapus' ? [3, 4] : [], toast: mulai === 'terhapus' ? 3 : null, q: '' };
    var saved = { tersimpan: 'Beli PAXG 0,0225 tersimpan', diubah: 'Perubahan disimpan · saldo dihitung ulang' }[mulai] || null;
    return { data: d, ui: ui, saved: saved };
  }
  root.HF = root.HF || {};
  root.HF.riwayatDemo = { get: get };
})(typeof globalThis !== 'undefined' ? globalThis : this);
