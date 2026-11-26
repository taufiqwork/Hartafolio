/**
 * Beranda: view-model kartu "Pembagian harta" (donut, daftar, pilihan) dari data ringkas.
 * JS murni. Logika disalin dari board Main.dc.html (mockup menang): urutan terbesar dulu, 4 teratas + "Sisanya"
 * bila lebih dari 5, segmen kecil diberi panjang minimum, baris yang disorot.
 * data = { MEM:[nama], CLS:[jenis], MX:[[juta Rp per jenis] per anggota], AR:[[aset,jenis,lokasi,anggota]], GM:{}, GC:{}, spark:[6 angka] }
 */
(function (root) {
  'use strict';
  var C = 2 * Math.PI * 86;
  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }
  function jt(v) { return 'Rp ' + v.toFixed(1).replace('.', ',') + ' jt'; }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }

  /** ui = { mode:'anggota'|'aset', sel:null|indeks, hi:null|indeks sorotan, k:penghitung animasi } */
  function view(d, ui) {
    var MEM = d.MEM, CLS = d.CLS, MX = d.MX, AR = d.AR || [];
    var m = ui.mode || 'anggota', s = ui.sel == null ? null : ui.sel, list = m === 'anggota' ? MEM : CLS;
    var allLabel = m === 'anggota' ? 'Semua anggota' : 'Semua aset';
    var items, title;
    if (m === 'anggota' && s === null) { items = MEM.map(function (n, i) { return [n, sum(MX[i])]; }); title = 'Harta tiap anggota'; }
    else if (m === 'anggota') { items = CLS.map(function (n, j) { return [n, MX[s][j]]; }); title = 'Isi harta ' + MEM[s]; }
    else if (s === null) { items = CLS.map(function (n, j) { return [n, sum(MX.map(function (r) { return r[j]; }))]; }); title = 'Jenis aset terhadap total'; }
    else { items = MEM.map(function (n, i) { return [n, MX[i][s]]; }); title = CLS[s] + ' per anggota'; }
    var short = s === null ? allLabel : list[s];
    items = items.filter(function (x) { return x[1] > 0; }).sort(function (a, b) { return b[1] - a[1]; });
    var grp = null;
    if (items.length > 5) { grp = items.slice(4); items = items.slice(0, 4).concat([['Sisanya', sum(grp.map(function (x) { return x[1]; }))]]); }
    var total = sum(items.map(function (x) { return x[1]; }));
    var hs = ui.hi == null || ui.hi >= items.length ? null : ui.hi;
    var isG = function (k) { return !!grp && k === 4; };

    var raw = items.map(function (x) { return x[1] / total * C; }), MINL = 26;
    var small = raw.map(function (l) { return items.length > 1 && l < MINL; });
    var fixedL = small.reduce(function (a, sm) { return a + (sm ? MINL : 0); }, 0);
    var restL = raw.reduce(function (a, l, i) { return a + (small[i] ? 0 : l); }, 0);
    var Ls = raw.map(function (l, i) { return small[i] ? MINL : l * (C - fixedL) / restL; });
    var acc = 0;
    var segs = items.map(function (x, k) {
      var L = Ls[k], dash = items.length === 1 ? C : Math.max(L - 6 - 14, 0.01);
      var o = { cls: isG(k) ? 's6' : 's' + (k + 1), da: dash.toFixed(1) + ' ' + (C - dash).toFixed(1), off: (-acc).toFixed(1), op: hs === null || hs === k ? 1 : 0.22, sw: hs === k ? 20 : 14 };
      acc += L; return o;
    });

    var rows = items.map(function (it, k) {
      var n = it[0], v = it[1], g0 = isG(k), isMem, sub;
      isMem = g0 ? (m === 'aset' || (m === 'anggota' && s === null)) : MEM.indexOf(n) >= 0;
      if (g0) sub = grp.length + (isMem ? ' anggota' : ' jenis') + ' · gabungan';
      else {
        var ar = AR.filter(function (x) { return (isMem ? x[3] === n : x[1] === n) && (s === null || (m === 'anggota' ? x[3] === MEM[s] : x[1] === CLS[s])); });
        if (isMem && !ar.length) sub = MX[MEM.indexOf(n)].filter(function (q) { return q > 0; }).length + ' jenis aset';
        else sub = ar.length + ' aset · ' + uniq(ar.map(function (x) { return x[2]; })).join(', ');
      }
      var g = (d.GM && d.GM[n]) || (d.GC && d.GC[n]) || '0%', up = g.charAt(0) === '+', down = g.charAt(0) === '−';
      var open = g0 && hs === k;
      return { i: k, pressed: hs === k, op: hs === null || hs === k ? 1 : 0.45, bt: k ? '1px solid var(--line)' : '0', n: g0 ? 'Sisanya (' + grp.length + ')' : n,
        c: g0 ? 'var(--chart-more)' : 'var(--chart-' + (k + 1) + ')', vs: jt(v), sub: sub, g: (up ? '↑ ' : down ? '↓ ' : '') + g,
        dcls: 'hf-delta ' + (up ? 'hf-delta-up' : down ? 'hf-delta-down' : 'hf-delta-flat'), open: open,
        subs: open ? grp.map(function (x) { return { n: x[0], v: jt(x[1]) }; }) : [] };
    });

    var grand = sum(MX.map(sum));
    var totFor = function (i) { return m === 'anggota' ? sum(MX[i]) : sum(MX.map(function (r) { return r[i]; })); };
    var opts = [null].concat(list.map(function (_, i) { return i; })).map(function (i) {
      return { i: i, l: i === null ? allLabel : list[i], v: jt(i === null ? grand : totFor(i)), sel: s === i };
    });

    var vals = d.spark, lo, hi, pts = '', spark = null; // tanpa d.spark (data nyata sebelum ada riwayat bulanan): tidak ada grafik kecil
    if (vals) {
      lo = Math.min.apply(null, vals); hi = Math.max.apply(null, vals);
      pts = vals.map(function (v, i) { return (2 + i * 96 / (vals.length - 1)).toFixed(1) + ',' + (42 - (v - lo) / (hi - lo) * 36).toFixed(1); }).join(' ');
      spark = { pts: pts, area: '2,48 ' + pts + ' 98,48', dy: ((42 - (vals[vals.length - 1] - lo) / (hi - lo) * 36) / 48 * 100).toFixed(1) + '%' };
    }
    var gi = Math.floor(grand + 1e-9);
    return {
      title: title, segs: segs, rows: rows, opts: opts, selLabel: s === null ? allLabel : list[s], mode: m, sel: s,
      cName: hs === null ? short : items[hs][0], cHasCtx: hs !== null, cCtx: s === null ? (m === 'anggota' ? 'Total harta' : 'Total') : short,
      cValue: jt(hs === null ? total : items[hs][1]), cHasShare: hs !== null, cShare: hs === null ? '' : Math.round(items[hs][1] / total * 100) + '%',
      swCls: 'sw' + ((ui.k || 0) % 2), rwCls: 'rw' + ((ui.k || 0) % 2),
      hero: { str: jt(grand), int: gi, dec: ',' + Math.round((grand - gi) * 10) + ' jt' },
      spark: spark
    };
  }

  /** Sparkline mini untuk kartu Harga terkini (7 titik, kotak 48x18). */
  function miniSpark(v) {
    var lo = Math.min.apply(null, v), hi = Math.max.apply(null, v);
    return v.map(function (y, i) { return (2 + i * 44 / (v.length - 1)).toFixed(1) + ',' + (15 - (y - lo) / ((hi - lo) || 1) * 12).toFixed(1); }).join(' ');
  }

  /* Banner dan lonceng "Perlu perhatian" (disalin dari logika board Main*.dc.html). d.zk: none|soon|due|late (zakat), d.pk: none|due|late (piutang),
     d.noNotes: lonceng kosong. Zakat menang atas piutang untuk banner; piutang yang kalah tetap ada di lonceng. */
  var ICO = {
    coin: ['M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', 'M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8', 'M12 18V6'],
    scale: ['m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z', 'm2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z', 'M7 21h10', 'M12 3v18', 'M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2'],
    cloud: ['m2 2 20 20', 'M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193', 'M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07'],
    info: ['M12 16v-4', 'M12 8h.01', 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0'],
    cal: ['M16 14v2.2l1.6 1', 'M16 2v4', 'M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5', 'M3 10h5', 'M8 2v4', 'M22 16a6 6 0 1 1-12 0 6 6 0 0 1 12 0']
  };
  var Z = {
    soon: ['Zakat mal jatuh tempo 13 hari lagi', 'Azlan · 22 Nov 2026 · perkiraan ± Rp 712.980', 'Lihat', 'var(--gold-soft)', 'var(--gold)', 'var(--gold)', 'hf-btn hf-btn-gold-line hf-btn-block'],
    due: ['Zakat mal jatuh tempo hari ini', 'Azlan · Rp 712.980 · perak 612 g', 'Catat pembayaran', 'var(--gold-soft)', 'var(--gold)', 'var(--gold)', 'hf-btn hf-btn-gold hf-btn-block'],
    late: ['Zakat mal terlambat 10 hari', 'Azlan · jatuh tempo 30 Okt 2026 · Rp 712.980', 'Catat pembayaran', 'var(--loss-soft)', 'var(--loss)', 'var(--loss)', 'hf-btn hf-btn-loss hf-btn-block']
  };
  var P = {
    due: ['Cicilan piutang jatuh tempo hari ini', 'Bu Sari · perak 50 g milik Azlan', 'Catat cicilan diterima', 'var(--gold-soft)', 'var(--gold)', 'var(--gold)', 'hf-btn hf-btn-gold hf-btn-block'],
    late: ['Piutang terlambat 56 hari', 'Bu Rina · 2 cicilan · perak 60 g milik Azlan', 'Lihat tunggakan', 'var(--loss-soft)', 'var(--loss)', 'var(--loss)', 'hf-btn hf-btn-loss hf-btn-block']
  };
  function mk(t, d, ic, tcls) { return { t: t, d: d, icon: ICO[ic], tcls: tcls }; }
  /** Pengingat dari data nyata (d.real): teks dibangun fromState, gaya banner dan tombol sama dengan board. */
  function attentionReal(d) {
    var z = d.zkList[0], p = d.pkList[0], bz = !!z, it = bz ? z : p, st = bz ? Z[z.k] : (p ? P[p.k] : null);
    var banner = !it ? null : { title: bz ? it.t : it.bt, desc: bz ? it.d : it.bd, cta: st[2], bg: st[3], bd: st[4], tile: st[5], btnCls: st[6], label: bz ? 'Pengingat zakat' : 'Pengingat piutang', icon: ICO[bz ? 'cal' : 'coin'] };
    var notes = d.zkList.map(function (x) { return mk(x.t, x.d, 'cal', x.k === 'late' ? 'is-loss' : ''); })
      .concat(d.pkList.map(function (x) { return mk(x.t, x.d, 'coin', x.k === 'late' ? 'is-loss' : ''); }))
      .concat(d.noPrice.map(function (n) { return mk('Harga ' + n + ' belum diisi', 'Isi manual agar nilainya masuk total', 'cloud', ''); }))
      .concat(d.estimasi.length ? [mk('Harga ' + d.estimasi.join(', ') + ' dari transaksi terakhir', 'Isi harga manual bila sudah berubah', 'info', 'is-info')] : []);
    var loss = d.zkList.concat(d.pkList).some(function (x) { return x.k === 'late'; });
    return { banner: banner, notes: notes, badge: notes.length, badgeLoss: loss, label: notes.length ? 'Perlu perhatian, ' + notes.length + ' hal' : 'Perlu perhatian, tidak ada' };
  }
  function attention(d) {
    if (d.real) return attentionReal(d);
    var zk = d.zk || 'none', pk = d.pk || 'none', bz = zk !== 'none', b = bz ? Z[zk] : (pk !== 'none' ? P[pk] : null);
    var banner = !b ? null : { title: b[0], desc: b[1], cta: b[2], bg: b[3], bd: b[4], tile: b[5], btnCls: b[6], label: bz ? 'Pengingat zakat' : 'Pengingat piutang', icon: ICO[bz ? 'cal' : 'coin'] };
    var pNote = pk === 'late' ? mk('Piutang Bu Rina terlambat 56 hari', '2 cicilan · perak 60 g milik Azlan belum diterima', 'coin', 'is-loss') : mk('Cicilan Bu Sari jatuh tempo hari ini', 'Perak 50 g milik Azlan · catat bila sudah diterima', 'coin', '');
    var notes = d.noNotes ? [] : [].concat(zk === 'none' ? [] : [mk(Z[zk][0], Z[zk][1], 'cal', zk === 'late' ? 'is-loss' : '')], pk === 'none' ? [] : [pNote], [
      mk('Perak Azlan dekat batas nishob', '612 g, hanya 17 g di atas nishob', 'scale', ''), mk('Harga GFI gagal diambil', 'Memakai harga kemarin · isi manual?', 'cloud', ''),
      mk('Nilai November dicatat 1 Des', 'Masuk ke riwayat Laporan', 'info', 'is-info')]);
    return { banner: banner, notes: notes, badge: notes.length, badgeLoss: zk === 'late' || pk === 'late', label: notes.length ? 'Perlu perhatian, ' + notes.length + ' hal' : 'Perlu perhatian, tidak ada' };
  }

  /* ---- Data nyata dari Sheet ---- */
  function lib(name, file) { return (root.HF && root.HF[name]) || require(file); }
  function lab(a) { return a.sumber_harga === 'manual' ? a.nama : (a.bentuk === 'Fisik' ? a.nama + ' fisik' : a.simbol); }
  function rp(n) { return 'Rp ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  var BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  function tgl(s) { return +s.slice(8, 10) + ' ' + BLN[+s.slice(5, 7) - 1] + ' ' + s.slice(0, 4); }
  function qtyText(n, a) { var x = Math.round(n * 1e4) / 1e4; return String(x).replace('.', ',') + ' ' + (a.satuan === 'gram' ? 'g' : a.satuan); }
  function pct(g) { var r = Math.round(g * 10) / 10; return r === 0 ? '0%' : (r > 0 ? '+' : '−') + Math.abs(r).toFixed(1).replace('.', ',') + '%'; }
  var URUT = ['Emas', 'Crypto', 'Perak', 'Saham', 'Reksa dana', 'Mata uang', 'Properti', 'Lainnya'];

  /**
   * Data nyata dari Sheet (state = hasil apiState). Tanpa transaksi aktif = Beranda kosong (null).
   * Hasil memakai bentuk yang sama dengan data contoh (view/attention), ditambah d.real=true dan daftar pengingat nyata
   * (d.zkList, d.pkList, d.noPrice). Grafik kecil, persen "dari bulan lalu", dan kartu Harga terkini BELUM ada sumber nyata
   * (Tahap 6): pemanggil mengisinya dengan data contoh sementara (d.spark, d.delta, d.harga, d.live) atau menyembunyikannya.
   * o.hariIni = 'YYYY-MM-DD' (bawaan: tanggal serverWaktu).
   */
  function fromState(state, o) {
    var trx = ((state && state.transaksi) || []).filter(function (t) { return !t.status || t.status === 'aktif'; });
    if (!trx.length) return null;
    var Lg = lib('ledger', './ledger.js'), V = lib('valuation', './valuation.js'), Z = lib('zakat', './zakat.js'), Pu = lib('piutang', './piutang.js'), C = lib('catalog', './catalog.js');
    var hariIni = (o && o.hariIni) || String(state.serverWaktu || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(hariIni)) { var n = new Date(); hariIni = n.getFullYear() + '-' + ('0' + (n.getMonth() + 1)).slice(-2) + '-' + ('0' + n.getDate()).slice(-2); } // tanpa jam server (mode dev): tanggal perangkat
    var anggota = (state.anggota || []).filter(function (m) { return m.aktif !== false; }), aset = state.aset || [];
    var lokasi = {}, A = {}, M = {};
    (state.lokasi || []).forEach(function (l) { lokasi[l.lokasi_id] = l.nama; });
    aset.forEach(function (a) { A[a.aset_id] = a; });
    anggota.forEach(function (m) { M[m.anggota_id] = m.nama; });
    var H = state.harga || {}, prices = Object.assign({}, H.terakhir || {}), ks = H.kursSeries || [], kurs = ks.length ? ks[ks.length - 1].harga : 0;
    // Sebelum ada sumber harga otomatis (Tahap 6) dan bila tab Harga kosong: harga Beli/Jual terakhir (dan kurs yang dibekukan di sana) jadi perkiraan.
    var estimasi = [];
    Lg.sortTrx(trx).forEach(function (t) {
      var mu = t.harga_mata_uang || 'IDR', usd = mu === 'USD' || mu === 'USDT';
      if (usd && +t.kurs > 0 && !ks.length) kurs = +t.kurs;
      if ((t.jenis === 'Beli' || t.jenis === 'Jual') && +t.harga_per_unit > 0 && (mu === 'IDR' || usd) && !(H.terakhir || {})[t.aset_id]) { prices[t.aset_id] = { harga: +t.harga_per_unit, mata_uang: mu }; if (estimasi.indexOf(t.aset_id) < 0) estimasi.push(t.aset_id); }
    });

    var pinjam = (state.piutang || []).filter(function (p) { return p.status !== 'lunas'; }).map(function (p) { return { p: p, st: Pu.status(p, state.transaksi || [], hariIni) }; }).filter(function (x) { return !x.st.lunas; });
    var bal = Lg.balances(trx);
    var nilai = V.nilai({ bal: bal, aset: aset, anggota: state.anggota || [], prices: prices, kursUsd: kurs,
      piutang: pinjam.map(function (x) { return { pemberi_anggota_id: x.p.pemberi_anggota_id, aset_id: x.p.aset_id, sisa: x.st.sisa }; }) });

    var CLS = URUT.filter(function (k) { return anggota.some(function (m) { return ((nilai.perAnggota[m.anggota_id] || {}).perKelas || {})[k] > 0; }); });
    var MEM = anggota.map(function (m) { return m.nama; });
    var MX = anggota.map(function (m) { var pk = (nilai.perAnggota[m.anggota_id] || {}).perKelas || {}; return CLS.map(function (k) { return (pk[k] || 0) / 1e6; }); });
    var AR = [];
    Object.keys(bal).forEach(function (k) {
      var q = Lg.parseKey(k), a = A[q.aset_id];
      if (bal[k] > 0 && a && M[q.anggota_id] && lokasi[q.lokasi_id]) AR.push([lab(a), a.kelas, lokasi[q.lokasi_id], M[q.anggota_id]]);
    });

    // % sejak awal dicatat: hanya dari bagian yang modalnya diketahui dan harganya ada; selain itu '—'.
    var pos = Lg.costBasis(trx).posisi, gm = {}, gc = {};
    function acc(map, key, v, c) { var r = map[key] || (map[key] = { v: 0, c: 0 }); r.v += v; r.c += c; }
    Object.keys(pos).forEach(function (k) {
      var p = pos[k], i = k.split('|'), a = A[i[1].split('~')[0]], h = a ? V.hargaIdr(a, prices, kurs) : null;
      if (!a || !M[i[0]] || h === null || !(p.qtyKnown > 0) || !(p.cost > 0)) return;
      acc(gm, M[i[0]], p.qtyKnown * h, p.cost); acc(gc, a.kelas, p.qtyKnown * h, p.cost);
    });
    function out(map) { var r = {}; Object.keys(map).forEach(function (k) { r[k] = pct((map[k].v - map[k].c) / map[k].c * 100); }); return r; }
    var GM = out(gm), GC = out(gc);
    MEM.forEach(function (n) { if (!GM[n]) GM[n] = '—'; }); CLS.forEach(function (n) { if (!GC[n]) GC[n] = '—'; }); GC['Sisanya'] = '—';

    var d = { real: true, MEM: MEM, CLS: CLS, MX: MX, AR: AR, GM: GM, GC: GC,
      usd: kurs > 0 ? '$ ' + Math.round(nilai.salinan / kurs).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '$ —',
      piutang: nilai.piutang > 0 ? jt(nilai.piutang / 1e6) : null, noPrice: [], zkList: [], pkList: [], zk: 'none', pk: 'none' };

    nilai.tanpaHarga.forEach(function (id) { if (A[id]) d.noPrice.push(lab(A[id])); });
    d.estimasi = estimasi.filter(function (id) { return A[id] && A[id].sumber_harga !== 'tetap' && A[id].sumber_harga !== 'kurs' && nilai.tanpaHarga.indexOf(id) < 0; }).map(function (id) { return lab(A[id]); });

    var hg = {};
    aset.forEach(function (a) { var kat = a.kategori_zakat || C.zakatKategori(a), h = V.hargaIdr(a, prices, kurs), g = C.gramPerUnit(a); if (kat && h > 0 && g > 0 && !hg[kat]) hg[kat] = h / g; });
    Z.hitung({ trx: trx, aset: aset, anggota: anggota, bayar: state.zakatBayar || [], pengaturan: state.pengaturan || {}, hariIni: hariIni, hargaGram: hg }).forEach(function (r) {
      var sisa = r.hari_tersisa, st = r.status_haul === 'terlambat' ? 'late' : r.status_haul === 'jatuh tempo' ? 'due' : (r.status_haul === 'berjalan' && sisa <= 14 ? 'soon' : null);
      if (!st) return;
      var nm = M[r.anggota_id], amt = r.zakat_idr ? rp(r.zakat_idr) : null, g = String(Math.round(r.saldo_akhir_haul * 10) / 10).replace('.', ',') + ' g';
      var t = st === 'late' ? 'Zakat mal terlambat ' + (-sisa) + ' hari' : st === 'due' ? 'Zakat mal jatuh tempo hari ini' : 'Zakat mal jatuh tempo ' + sisa + ' hari lagi';
      var ds = st === 'late' ? nm + ' · jatuh tempo ' + tgl(r.jatuh_tempo) + (amt ? ' · ' + amt : '') : st === 'due' ? nm + (amt ? ' · ' + amt : '') + ' · ' + r.logam + ' ' + g : nm + ' · ' + tgl(r.jatuh_tempo) + (amt ? ' · perkiraan ± ' + amt : '');
      d.zkList.push({ k: st, t: t, d: ds, rank: st === 'late' ? 0 : st === 'due' ? 1 : 2, sisa: sisa });
    });
    d.zkList.sort(function (a, b) { return a.rank - b.rank || a.sisa - b.sisa; });

    pinjam.forEach(function (x) {
      var p = x.p, st = x.st, a = A[p.aset_id]; if (!a) return;
      var what = a.nama.toLowerCase() + ' ' + qtyText(p.jumlah_pokok, a) + ' milik ' + (M[p.pemberi_anggota_id] || '');
      if (st.terlambat) d.pkList.push({ k: 'late', t: 'Piutang ' + p.peminjam_nama + ' terlambat ' + st.hariTerlambat + ' hari', d: st.cicilanTerlambat + ' cicilan · ' + what + ' belum diterima', bt: 'Piutang terlambat ' + st.hariTerlambat + ' hari', bd: p.peminjam_nama + ' · ' + st.cicilanTerlambat + ' cicilan · ' + what, rank: 0, hari: st.hariTerlambat });
      else if (st.jatuhTempoHariIni) d.pkList.push({ k: 'due', t: 'Cicilan ' + p.peminjam_nama + ' jatuh tempo hari ini', d: what + ' · catat bila sudah diterima', bt: 'Cicilan piutang jatuh tempo hari ini', bd: p.peminjam_nama + ' · ' + what, rank: 1, hari: 0 });
    });
    d.pkList.sort(function (a, b) { return a.rank - b.rank || b.hari - a.hari; });
    d.zk = d.zkList.length ? d.zkList[0].k : 'none'; d.pk = d.pkList.length ? d.pkList[0].k : 'none';
    return d;
  }

  var api = { attention: attention, view: view, miniSpark: miniSpark, fromState: fromState, jt: jt };
  root.HF = root.HF || {};
  root.HF.beranda = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
