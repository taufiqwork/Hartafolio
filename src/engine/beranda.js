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

    var vals = d.spark, lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var pts = vals.map(function (v, i) { return (2 + i * 96 / (vals.length - 1)).toFixed(1) + ',' + (42 - (v - lo) / (hi - lo) * 36).toFixed(1); }).join(' ');
    var gi = Math.floor(grand + 1e-9);
    return {
      title: title, segs: segs, rows: rows, opts: opts, selLabel: s === null ? allLabel : list[s], mode: m, sel: s,
      cName: hs === null ? short : items[hs][0], cHasCtx: hs !== null, cCtx: s === null ? (m === 'anggota' ? 'Total harta' : 'Total') : short,
      cValue: jt(hs === null ? total : items[hs][1]), cHasShare: hs !== null, cShare: hs === null ? '' : Math.round(items[hs][1] / total * 100) + '%',
      swCls: 'sw' + ((ui.k || 0) % 2), rwCls: 'rw' + ((ui.k || 0) % 2),
      hero: { str: jt(grand), int: gi, dec: ',' + Math.round((grand - gi) * 10) + ' jt' },
      spark: { pts: pts, area: '2,48 ' + pts + ' 98,48', dy: ((42 - (vals[vals.length - 1] - lo) / (hi - lo) * 36) / 48 * 100).toFixed(1) + '%' }
    };
  }

  /** Sparkline mini untuk kartu Harga terkini (7 titik, kotak 48x18). */
  function miniSpark(v) {
    var lo = Math.min.apply(null, v), hi = Math.max.apply(null, v);
    return v.map(function (y, i) { return (2 + i * 44 / (v.length - 1)).toFixed(1) + ',' + (15 - (y - lo) / ((hi - lo) || 1) * 12).toFixed(1); }).join(' ');
  }

  /** Data nyata dari Sheet. Tanpa transaksi aktif = Beranda kosong (null). Pemetaan ke angka menyusul bersama Catat (Tahap 5). */
  function fromState(state) {
    var aktif = (state && state.transaksi || []).filter(function (t) { return t.status !== 'dihapus'; });
    return aktif.length ? { belumDipetakan: true } : null;
  }

  var api = { view: view, miniSpark: miniSpark, fromState: fromState, jt: jt };
  root.HF = root.HF || {};
  root.HF.beranda = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
