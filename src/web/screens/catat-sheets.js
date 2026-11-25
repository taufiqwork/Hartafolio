/* Catat transaksi: lembar bawah (Tambah aset, Pilih tanggal dan jam, Bayar dengan aset lain). Hanya HTML; klik ditangani catat.js.
   Lembar Lokasi baru dan Aset manual memakai form bersama HF.setupForm (satu sumber dengan Setup). */
(function (root) {
  'use strict';
  var S = root.HF.setupForm, esc = S.esc, svg = S.svg, V = root.HF.catatView;
  var WD = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  function row(name, sub, badge, act, v) {
    return '<button type="button" class="ct-sr" data-act="' + act + '" data-v="' + esc(v) + '"><span class="ct-sr-t"><span class="ct-sr-n">' + esc(name) + '</span><span class="caption ct-m">' + esc(sub) + '</span></span><span class="hf-badge">' + esc(badge) + '</span></button>';
  }

  function aset(vm) {
    var fam = vm.fam.length ? '<span class="label ct-m ct-sec">Dipakai anggota lain</span>' + vm.fam.map(function (k) { return row(k.n, k.f, k.c, 'pick-fam', k.n); }).join('') : '';
    var kat = vm.kat.length ? '<span class="label ct-m ct-sec ct-sec2">Katalog harga otomatis</span>' + vm.kat.map(function (k) { return row(k[0], k[1], k[2], 'pick-kat', k[0]); }).join('') : '';
    return '<section class="hf-sheet" role="dialog" aria-label="Tambah aset"><span aria-hidden="true" class="hf-sheet-handle"></span><span class="heading">Tambah aset</span>' +
      '<label for="cariA" class="ct-search">' + svg(['m21 21-4.3-4.3'], 18).replace('</svg>', '<circle cx="11" cy="11" r="8"></circle></svg>') + '<input id="cariA" type="search" value="' + esc(vm.sq) + '" data-in="sq" placeholder="Nama atau kode aset"></label>' +
      '<div class="ct-cats">' + vm.catChips.map(function (l) { return V.chip(l, l === vm.cat, 'cat'); }).join('') + '</div>' +
      '<div class="hf-scroll ct-sheet-list">' + fam + kat + '</div>' +
      '<div class="ct-sheet-foot"><span class="caption ct-m">Tidak ada di daftar? Tambahkan dengan harga sendiri.</span><button class="hf-btn hf-btn-ghost" type="button" data-act="add-manual" style="align-self: flex-start;">' + V.PLUS + 'Tambah aset baru' + (vm.sq.trim() ? '<span> "' + esc(vm.sq.trim()) + '"</span>' : '') + '</button></div></section>';
  }

  function tgl(vm) {
    var c = vm.cal, hours = [-2, -1, 0, 1, 2].map(function (o) { var v = (vm.hh + o + 24) % 24; return { l: pad(v), on: o === 0, op: o === 0 ? 1 : (Math.abs(o) === 1 ? 0.7 : 0.4), v: v }; });
    var mins = [-2, -1, 0, 1, 2].map(function (o) { var v = (vm.mm + o * 5 + 60) % 60; return { l: pad(v), on: o === 0, op: o === 0 ? 1 : (Math.abs(o) === 1 ? 0.7 : 0.4), v: v }; });
    function pad(n) { return String(n).padStart(2, '0'); }
    function wheel(list, act) { return '<div class="ct-wh">' + list.map(function (h) { return '<button class="hf-wheel" type="button" aria-pressed="' + h.on + '" data-act="' + act + '" data-v="' + h.v + '" style="opacity: ' + h.op + ';">' + h.l + '</button>'; }).join('') + '</div>'; }
    return '<section class="hf-sheet hf-sheet-flush" role="dialog" aria-label="Pilih tanggal dan jam"><div class="hf-scroll ct-tgl-body"><span aria-hidden="true" class="hf-sheet-handle"></span>' +
      '<div class="ct-lr2"><span class="heading">Pilih tanggal dan jam</span><button class="hf-btn hf-btn-ghost" type="button" data-act="set-now">Sekarang</button></div>' +
      '<div class="ct-lr2"><button type="button" class="ct-nav" aria-label="Bulan sebelumnya" data-act="bulan" data-v="-1">' + svg(['m15 18-6-6 6-6'], 20) + '</button><span class="ct-mon">' + esc(c.title) + '</span><button type="button" class="ct-nav' + (c.nextOff ? ' ct-nav-off' : '') + '" aria-label="Bulan berikutnya"' + (c.nextOff ? ' disabled' : ' data-act="bulan" data-v="1"') + '>' + svg(['m9 18 6-6-6-6'], 20) + '</button></div>' +
      '<div class="ct-cal">' + WD.map(function (w) { return '<span class="caption ct-m ct-wd">' + w + '</span>'; }).join('') +
      c.cells.map(function (d) { return '<button class="hf-day" type="button" aria-pressed="' + d.on + '"' + (d.off ? ' disabled' : ' data-act="day" data-v="' + d.pick + '"') + ' style="visibility: ' + d.vis + '; box-shadow: ' + d.ring + ';">' + d.n + '</button>'; }).join('') + '</div>' +
      '<div class="ct-time"><span class="label ct-m ct-time-l">Jam</span><div class="ct-wheel">' + wheel(hours, 'hh') + '<span class="ct-dot">.</span>' + wheel(mins, 'mm') + '</div><span class="caption ct-m">Geser untuk memilih jam dan menit.</span></div></div>' +
      '<div class="ct-sheet-cta"><button class="hf-btn hf-btn-primary hf-btn-block" type="button" data-act="close-tgl">' + esc(vm.tglBtn) + '</button></div></section>';
  }

  function bayar(vm) {
    return '<section class="hf-sheet hf-sheet-flush" role="dialog" aria-label="' + esc(vm.byTitle) + '"><div class="hf-scroll ct-by-body"><span aria-hidden="true" class="hf-sheet-handle"></span>' +
      '<div class="ct-by-h"><span class="heading">' + esc(vm.byTitle) + '</span><span class="caption ct-m">' + esc(vm.byDesc) + '</span></div>' +
      vm.byGroups.map(function (g) {
        return '<div class="ct-by-g"><span class="label ct-m ct-by-t">' + esc(g.t) + '</span>' + g.items.map(function (k) {
          return '<button type="button" class="ct-sr ct-sr52" data-act="pick-pay" data-v="' + esc(k.pay) + '"><span class="ct-sr-t"><span class="ct-sr-n">' + esc(k.n) + '</span><span class="caption ct-m">' + esc(k.s) + '</span></span><span class="ct-by-b">' + esc(k.b) + '</span></button>'; }).join('') +
          '<span class="caption ct-m ct-by-note">' + esc(g.note) + '</span></div>';
      }).join('') + '</div><div class="ct-sheet-cta"><button class="hf-btn hf-btn-ghost hf-btn-block" type="button" data-act="close-sheet">Batal</button></div></section>';
  }

  var CAM = svg(['M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z'], 20).replace('</svg>', '<circle cx="12" cy="13" r="3"></circle></svg>');
  var GAL = svg(['m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'], 20).replace('</svg>', '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle></svg>');
  function foto() {
    function r(ic, t, c, act) { return '<button type="button" class="ct-fr" data-act="' + act + '"><span class="ct-photo-ic">' + ic + '</span><span class="ct-photo-tx"><span class="ct-photo-t">' + t + '</span><span class="caption ct-m">' + c + '</span></span><span class="ct-m ct-ic">' + svg(['m9 18 6-6-6-6'], 18) + '</span></button>'; }
    return '<section class="hf-sheet hf-sheet-flush" role="dialog" aria-label="Lampirkan foto"><div class="hf-scroll ct-by-body"><span aria-hidden="true" class="hf-sheet-handle"></span>' +
      '<div class="ct-by-h"><span class="heading">Lampirkan foto</span><span class="caption ct-m">Foto dikecilkan, lalu disimpan di Google Drive Anda (folder Hartafolio). Sheet hanya menyimpan tautannya.</span></div>' +
      '<div class="ct-by-g">' + r(CAM, 'Ambil foto', 'Pakai kamera HP', 'pick-cam') + r(GAL, 'Pilih dari galeri', 'Foto atau tangkapan layar', 'pick-gal') + '</div></div>' +
      '<div class="ct-sheet-cta"><button class="hf-btn hf-btn-ghost hf-btn-block" type="button" data-act="close-sheet">Batal</button></div></section>';
  }

  /** HTML lembar yang terbuka (kosong bila tidak ada). form = hasil HF.setupForm.render untuk Lokasi baru / Aset manual, atau ''. */
  function sheets(vm, form) {
    var s = vm.sheet;
    if (!s) return '';
    if (s === 'aset') return '<div class="hf-scrim" data-act="close-sheet"></div>' + aset(vm);
    if (s === 'tgl') return '<div class="hf-scrim" data-act="close-sheet"></div>' + tgl(vm);
    if (s === 'foto') return '<div class="hf-scrim" data-act="close-sheet"></div>' + foto();
    if (s === 'bayar') return '<div class="hf-scrim" data-act="close-sheet"></div>' + bayar(vm);
    return form || '';
  }

  root.HF = root.HF || {};
  root.HF.catatSheets = { sheets: sheets };
})(typeof globalThis !== 'undefined' ? globalThis : this);
