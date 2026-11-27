/**
 * Riwayat transaksi: baris dari data Sheet (fromState) dan model tampilan layar (view). JS murni, tanpa DOM.
 * Mengikuti board 05-Riwayat dan state-nya. Satu baris = { id, j, a, q, o, v, imp, mem, loc, ... } (lihat row()).
 * Data contoh (?demo) memakai bentuk baris yang sama dan dibuat di src/demo/riwayat-demo.js.
 */
(function (root) {
  'use strict';
  var BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var MINUS = '−';
  var JENIS = ['Semua', 'Beli', 'Jual', 'Masuk', 'Keluar', 'Pindah', 'Piutang', 'Zakat', 'Saldo awal'];
  var PIUTANG = ['Pinjamkan', 'Cicilan diterima', 'Pelunasan diterima'];
  var UNIT = { gram: ' g', lot: ' lot', lembar: ' lembar' };
  var PLUS = ['Beli', 'Masuk', 'Saldo awal', 'Cicilan diterima', 'Pelunasan diterima'], KURANG = ['Jual', 'Keluar', 'Zakat', 'Pinjamkan'];

  /* Ikon dan warna per jenis (sama dengan board). */
  var IKON = {
    'Beli': [['M5 12h14', 'M12 5v14'], 'var(--brand-soft)', 'var(--brand)'],
    'Jual': [['M5 12h14'], 'var(--loss-soft)', 'var(--loss)'],
    'Masuk': [['M12 17V3', 'm6 11 6 6 6-6', 'M19 21H5'], 'var(--gold-soft)', 'var(--gold)'],
    'Saldo awal': [['M12 17V3', 'm6 11 6 6 6-6', 'M19 21H5'], 'var(--gold-soft)', 'var(--gold)'],
    'Keluar': [['M12 7v14', 'm6 13 6-6 6 6', 'M19 3H5'], 'var(--loss-soft)', 'var(--loss)'],
    'Zakat': [['M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z'], 'var(--gold-soft)', 'var(--gold)'],
    'Pindah lokasi': [['M8 3 4 7l4 4', 'M4 7h16', 'm16 21 4-4-4-4', 'M20 17H4'], 'var(--surface-sunken)', 'var(--ink-muted)'],
    'Pindah anggota': [['M8 3 4 7l4 4', 'M4 7h16', 'm16 21 4-4-4-4', 'M20 17H4'], 'var(--surface-sunken)', 'var(--ink-muted)'],
    'Pinjamkan': [['M7 7h10v10', 'M7 17 17 7'], 'var(--surface-sunken)', 'var(--ink-muted)'],
    'Cicilan diterima': [['M17 7 7 17', 'M17 17H7V7'], 'var(--brand-soft)', 'var(--brand)'],
    'Pelunasan diterima': [['M20 6 9 17l-5-5'], 'var(--brand-soft)', 'var(--brand)']
  };
  var NETRAL = [['M12 17V3', 'm6 11 6 6 6-6', 'M19 21H5'], 'var(--surface-sunken)', 'var(--ink-muted)'];

  function F() { return root.HF.format; }
  function numStr(n, dec) { return F().number(n, dec); }

  /** Nilai ringkas di daftar: "Rp 1,56 jt", "Rp 0,98 jt", "Rp 11,9 jt", "Rp 1,48 M". Di bawah Rp 10.000 ditulis penuh. */
  function ringkas(n) {
    var a = Math.abs(n);
    if (a >= 1e12) return 'Rp ' + (a / 1e12).toFixed(2).replace('.', ',') + ' T';
    if (a >= 1e9) return 'Rp ' + (a / 1e9).toFixed(2).replace('.', ',') + ' M';
    if (a >= 1e4) return 'Rp ' + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace('.', ',') + ' jt';
    return F().rupiah(a);
  }

  /** "+0,0225", "−15,3 g", "−1 lot". Pindah tanpa tanda. */
  function qtext(j, n, satuan) {
    var x = Math.round(Math.abs(n) * 1e8) / 1e8;
    return (PLUS.indexOf(j) >= 0 ? '+' : KURANG.indexOf(j) >= 0 ? MINUS : '') + numStr(x) + (UNIT[satuan] || '');
  }

  /** Label hari. Hari ini dan Kemarin disebut; tanggal lebih dari 120 hari lalu memakai tahun ("20 Mei 2026"). */
  function dayLabel(tgl, hariIni) {
    var p = tgl.split('-'), a = Date.UTC(+p[0], +p[1] - 1, +p[2]), q = hariIni.split('-'), b = Date.UTC(+q[0], +q[1] - 1, +q[2]);
    var diff = Math.round((b - a) / 86400000), short = +p[2] + ' ' + BLN[+p[1] - 1];
    if (diff === 0) return 'Hari ini · ' + short;
    if (diff === 1) return 'Kemarin · ' + short;
    return diff > 120 || diff < 0 ? short + ' ' + p[0] : short;
  }
  function full(tgl) { var p = tgl.split('-'); return +p[2] + ' ' + BLN[+p[1] - 1] + ' ' + p[0]; }
  function bulan(tgl) { var p = tgl.split('-'); return BLN[+p[1] - 1] + ' ' + p[0]; }

  function style(j) { var s = IKON[j] || NETRAL; return { paths: s[0], ibg: s[1], ifg: s[2] }; }

  /**
   * Baris Riwayat dari satu transaksi Sheet. Nilai "saat itu": harga transaksi (Beli, Jual), harga beli rata-rata (Saldo awal),
   * selain itu harga Beli atau Jual terakhir aset itu sampai tanggal tersebut; tanpa harga sama sekali = kosong (tidak ditampilkan).
   */
  function fromState(state, o) {
    var Lg = root.HF.ledger, hariIni = (o && o.hariIni) || '';
    var aset = {}, ang = {}, lok = {}, last = {}, kurs = (state.harga && state.harga.kursSeries || []).slice(-1)[0];
    (state.aset || []).forEach(function (a) { aset[a.aset_id] = a; });
    (state.anggota || []).forEach(function (a) { ang[a.anggota_id] = a.nama; });
    (state.lokasi || []).forEach(function (l) { lok[l.lokasi_id] = l.nama; });
    function label(a) { return !a ? '?' : a.sumber_harga === 'manual' ? a.nama : (a.bentuk === 'Fisik' ? a.nama + ' fisik' : a.simbol); }
    function idr(t, harga) { var usd = t.harga_mata_uang === 'USD' || t.harga_mata_uang === 'USDT'; return usd ? (+t.kurs > 0 ? harga * t.kurs : (kurs ? harga * kurs.harga : 0)) : harga; }
    var rows = [];
    Lg.sortTrx(state.transaksi || []).forEach(function (t) {
      var a = aset[t.aset_id], j = t.jenis, mem = ang[t.anggota_id] || '?', loc = lok[t.lokasi_id] || '?', per = 0, hs = null;
      if (j === 'Pindah') {
        if (t.anggota_tujuan_id && t.anggota_tujuan_id !== t.anggota_id) { j = 'Pindah anggota'; mem += ' → ' + (ang[t.anggota_tujuan_id] || '?'); }
        else { j = 'Pindah lokasi'; loc += ' → ' + (lok[t.lokasi_tujuan_id] || '?'); }
      }
      if ((t.jenis === 'Beli' || t.jenis === 'Jual') && +t.harga_per_unit > 0) { per = idr(t, +t.harga_per_unit); last[t.aset_id] = per; hs = per; }
      else if (t.jenis === 'Saldo awal' && +t.harga_beli_rata2 > 0) per = +t.harga_beli_rata2;
      else if (last[t.aset_id]) per = last[t.aset_id];
      var urls = String(t.bukti || '').split(/\s+/).filter(Boolean);
      var v = per > 0 ? ringkas(per * Math.abs(+t.jumlah || 0)) : null;
      var imp = t.sumber === 'import';
      rows.push(Object.assign({ id: t.trx_id, j: j, a: label(a), q: qtext(t.jenis === 'Pindah' ? 'Pindah' : t.jenis, +t.jumlah || 0, a && a.satuan),
        o: mem + ' · ' + loc, v: v ? v + (t.jenis === 'Saldo awal' ? ' · saldo awal' : '') : null, imp: imp, mem: mem, loc: loc,
        tgl: t.tanggal, del: t.status === 'dihapus', delText: 'dihapus', edit: ['Beli', 'Jual', 'Masuk', 'Keluar', 'Pindah'].indexOf(t.jenis) >= 0 && !t.link_id, hs: hs ? F().rupiahShort(hs) : null, nilai: v, bukti: urls, cat: t.catatan || '' }, style(j)));
    });
    return build(rows, hariIni);
  }

  /** Kelompokkan baris (urutan lama ke baru) jadi hari, terbaru di atas; jam terbaru di atas dalam satu hari. */
  function build(rows, hariIni) {
    var days = {}, order = [];
    rows.slice().reverse().forEach(function (r) {
      var k = r.tgl; if (!days[k]) { days[k] = { d: dayLabel(k, hariIni), full: full(k), mo: bulan(k), rows: [] }; order.push(k); }
      days[k].rows.push(r);
    });
    return { days: order.map(function (k) { return days[k]; }) };
  }

  /** Daftar untuk menu filter. Anggota dan Bulan dari data (terbaru dulu). */
  function options(d) {
    var ang = [], bln = [];
    d.days.forEach(function (x) { if (bln.indexOf(x.mo) < 0) bln.push(x.mo); x.rows.forEach(function (r) { r.mem.split(' → ').forEach(function (n) { if (ang.indexOf(n) < 0) ang.push(n); }); }); });
    return { 'Anggota': ['Semua'].concat(ang), 'Jenis': JENIS, 'Bulan': ['Semua'].concat(bln) };
  }

  /** Baris rincian di sheet detail. Sumber: field baris (hs, bukti, cat, dan field khusus piutang/zakat bila ada). */
  function detail(r, day) {
    var nilai = r.nilai || (r.v ? r.v.split(' · ')[0] : '—'), tgl = { k: 'Tanggal', v: day.full }, aw = r.o.split(' · ');
    var bukti = r.bukti && r.bukti.length ? { k: 'Bukti', v: r.bukti.length + ' foto', href: r.bukti[0], ext: true } : { k: 'Bukti', v: 'Belum ada' };
    var imp = r.imp ? [{ k: 'Sumber', v: 'Import .xlsx' }].concat(r.ref ? [{ k: 'No. referensi', v: r.ref }] : []) : [];
    var base = [{ k: 'Anggota', v: r.mem }, { k: 'Lokasi', v: r.loc }, tgl];
    var val = { k: 'Nilai saat itu', v: nilai };
    var hs = { k: 'Harga satuan', v: r.hs || '—' };
    var D = {
      'Beli': base.concat([hs, val, bukti]), 'Jual': base.concat([hs, val, bukti]),
      'Masuk': base.concat([val], imp), 'Saldo awal': base.concat([val], imp),
      'Keluar': base.concat([val, { k: 'Catatan', v: r.cat || 'Tidak diisi' }]),
      'Pindah lokasi': [{ k: 'Anggota', v: r.mem }, { k: 'Dari lokasi', v: r.loc.split(' → ')[0] || '' }, { k: 'Ke lokasi', v: r.loc.split(' → ')[1] || '' }, tgl, val],
      'Pindah anggota': [{ k: 'Dari anggota', v: r.mem.split(' → ')[0] }, { k: 'Ke anggota', v: r.mem.split(' → ')[1] || '' }, { k: 'Lokasi', v: r.loc }, tgl, val],
      'Zakat': base.concat([val, { k: 'Untuk haul', v: r.haul || '—', href: r.haulHref }, { k: 'Sumber', v: 'Pembayaran zakat' }]),
      'Pinjamkan': [{ k: 'Pemberi', v: r.mem }, { k: 'Peminjam', v: r.peminjam || 'Peminjam' }, { k: 'Lokasi', v: aw[1] }, tgl, val, { k: 'Rencana', v: r.rencana || '—' }, { k: 'Piutang', v: 'Lihat detail', href: r.piutangHref }],
      'Cicilan diterima': [{ k: 'Dari', v: r.dari || '—' }, { k: 'Diterima oleh', v: r.mem }, { k: 'Lokasi', v: aw[1] }, tgl, val, { k: 'Cicilan ke', v: r.cicilan || '—' }, { k: 'Sisa piutang', v: r.sisa || '—' }, { k: 'Piutang', v: 'Lihat detail', href: r.piutangHref }],
      'Pelunasan diterima': [{ k: 'Dari', v: r.dari || '—' }, { k: 'Diterima oleh', v: r.mem }, { k: 'Lokasi', v: aw[1] }, tgl, val, { k: 'Cara bayar', v: r.cara || '—' }, { k: 'Sisa piutang', v: r.sisa || '—' }, { k: 'Piutang', v: 'Lihat detail', href: r.piutangHref }]
    };
    return (D[r.j] || base.concat([val])).map(function (x) { return { k: x.k, v: x.v, href: x.href || '', ext: !!x.ext }; });
  }

  function cocok(r, d, sel, q, del) {
    if (del.indexOf(String(r.id)) >= 0) return false;
    if (sel.Anggota && r.mem.indexOf(sel.Anggota) < 0) return false;
    if (sel.Jenis && (sel.Jenis === 'Piutang' ? PIUTANG.indexOf(r.j) < 0 : r.j.indexOf(sel.Jenis) !== 0)) return false;
    if (sel.Bulan && d.mo !== sel.Bulan) return false;
    if (q) { var hay = (r.a + ' ' + r.j + ' ' + r.mem + ' ' + r.loc + ' ' + (r.cat || '') + ' ' + (r.bukti || []).join(' ')).toLowerCase(); if (hay.indexOf(q.toLowerCase()) < 0) return false; }
    return true;
  }

  /**
   * Model tampilan. ui = { sel:{Anggota,Jenis,Bulan}, fOpen:nama|null, sheet:id|null, del:[id] (terhapus; awal dari d.delIds),
   * view:'list'|'del', toast:id|null, q:teks }. Mengembalikan semua yang dibutuhkan layar.
   */
  function view(d, ui) {
    ui = ui || {};
    var sel = ui.sel || {}, q = ui.q || '', del = (ui.del || []).map(String), O = options(d), flat = [];
    d.days.forEach(function (x) { x.rows.forEach(function (r) { flat.push([r, x]); }); });
    var live = flat.filter(function (p) { return !p[0].del && del.indexOf(String(p[0].id)) < 0; });
    var days = d.days.map(function (x) { return { d: x.d, rows: x.rows.filter(function (r) { return !r.del && cocok(r, x, sel, q, del); }) }; }).filter(function (x) { return x.rows.length; });
    var cur = ui.sheet == null ? null : flat.filter(function (p) { return String(p[0].id) === String(ui.sheet); })[0] || null;
    var gone = flat.filter(function (p) { return p[0].del || del.indexOf(String(p[0].id)) >= 0; });
    var toast = ui.toast == null ? null : flat.filter(function (p) { return String(p[0].id) === String(ui.toast); })[0] || null;
    var chips = ['Anggota', 'Jenis', 'Bulan'].map(function (name, i) {
      return { name: name, open: ui.fOpen === name, z: ui.fOpen === name ? 30 : 1, label: sel[name] ? name + ': ' + sel[name] : name, active: !!sel[name],
        opts: O[name].map(function (l) { return { l: l, sel: (sel[name] || 'Semua') === l }; }) };
    });
    var kosong = flat.length === 0 && !gone.length;
    return {
      kosong: kosong, hasAny: !kosong, days: days, chips: chips, noMatch: !kosong && live.length > 0 && !days.length,
      listView: (ui.view || 'list') === 'list', delView: ui.view === 'del', hasDel: gone.length > 0, delLabel: 'Terhapus (' + gone.length + ')',
      delRows: gone.map(function (p) { return Object.assign({}, p[0], { d: p[0].delText || 'dihapus hari ini' }); }),
      sheet: cur ? { id: cur[0].id, edit: cur[0].edit !== false, title: cur[0].j + ' · ' + cur[0].a, q: cur[0].q, ibg: cur[0].ibg, ifg: cur[0].ifg, paths: cur[0].paths, det: detail(cur[0], cur[1]) } : null,
      toast: toast && !cur && (ui.view || 'list') === 'list' ? 'Transaksi dihapus' : null, toastId: toast ? toast[0].id : null,
      scrim: !!ui.fOpen || !!cur
    };
  }

  var api = { fromState: fromState, build: build, view: view, detail: detail, options: options, ringkas: ringkas, qtext: qtext, dayLabel: dayLabel, style: style };
  root.HF = root.HF || {};
  root.HF.riwayat = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
