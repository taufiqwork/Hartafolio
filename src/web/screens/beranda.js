/* Beranda (tab Beranda). Tahap A: kerangka, total, grafik kecil, kartu Pembagian harta, Harga terkini, keadaan kosong.
   Mengikuti board Main*.dc.html. Data = HF.demo (?demo) atau null (Beranda kosong). Banner zakat/piutang dan lonceng terbuka = tahap B. */
(function (root) {
  'use strict';
  var F = root.HF.setupForm, esc = F.esc, svg = F.svg, B = root.HF.beranda;
  var LOGO = '<svg viewBox="0 0 48 48" width="32" height="32" aria-hidden="true"><circle cx="24" cy="30" r="14" fill="var(--gold-fill)"></circle><circle cx="24" cy="30" r="9" fill="none" stroke="var(--gold-soft)" stroke-width="2.5"></circle><path d="M24 16V9" stroke="var(--brand)" stroke-width="3" stroke-linecap="round"></path><path d="M23.07 11.75 C22.76 4.56 28 2 34 2 C34 8 30.04 13 23.07 11.75 Z" fill="var(--brand)"></path><path d="M24.89 12.197 C25.511 6.488 21 5 16 5 C16 10 19.89 12.197 24.89 12.197 Z" fill="var(--brand)"></path></svg>';
  var CHEV = svg(['m9 18 6-6-6-6'], 14), CHEV16 = svg(['m9 18 6-6-6-6'], 16), CHEVD = svg(['m6 9 6 6 6-6']);
  var BELL = svg(['M10.268 21a2 2 0 0 0 3.464 0', 'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326']);
  var USER = svg(['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0']);
  var GRID = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect></svg>';
  var LAYERS = svg(['M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z', 'M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12', 'M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17'], 24);
  var PLUS20 = svg(['M5 12h14', 'M12 5v14'], 20);

  var ui = { mode: 'anggota', sel: null, hi: null, open: false, k: 0, per: false, toast: null };

  function att(d) { return d ? B.attention(d) : { banner: null, notes: [], badge: 0, badgeLoss: false, label: 'Perlu perhatian, tidak ada' }; }
  function head(d) {
    var a = att(d);
    return '<div class="hf-head"><header class="br-header"><span class="br-brand">' + LOGO + '<span class="br-name">Harta<span>folio</span></span></span>' +
      '<button type="button" class="hf-iconbtn" aria-label="' + a.label + '" aria-haspopup="dialog" aria-expanded="' + ui.per + '" data-act="bell">' + BELL +
      (a.badge ? '<span class="hf-countbadge' + (a.badgeLoss ? ' is-loss' : '') + '" aria-hidden="true">' + a.badge + '</span>' : '') + '</button></header></div>';
  }
  function banner(d) {
    var b = att(d).banner; if (!b) return '';
    return '<section role="status" aria-label="' + b.label + '" class="br-banner" style="background: ' + b.bg + '; border: 1.5px solid ' + b.bd + ';"><span class="br-bn-tile" style="background: ' + b.tile + ';">' + svg(b.icon, 22) + '</span>' +
      '<span class="br-bn-title">' + esc(b.title) + '</span><span class="caption br-bn-desc">' + esc(b.desc) + '</span><a class="' + b.btnCls + ' br-bn-btn" aria-disabled="true">' + esc(b.cta) + '</a></section>';
  }
  /** Lembar lonceng, scrim, dan toast: elemen di atas layar, ditambahkan setelah menu bawah. */
  function overlays(d) {
    var h = '';
    if (ui.per) {
      var a = att(d);
      h += '<div class="hf-scrim" data-act="close-bell"></div><div class="hf-sheet br-sheet" role="dialog" aria-label="Perlu perhatian"><span class="hf-sheet-handle" aria-hidden="true"></span>' +
        '<div class="hf-sheet-headrow"><span class="heading">Perlu perhatian</span>' + (a.badge ? '<span class="hf-attn-count">' + a.badge + '</span>' : '') + '</div><div class="br-notes">' +
        a.notes.map(function (n) {
          return '<a class="hf-notif" aria-disabled="true"><span class="hf-notif-tile ' + n.tcls + '">' + svg(n.icon, 20) + '</span><span class="br-notif-tx"><span class="hf-notif-title">' + esc(n.t) + '</span><span class="hf-notif-desc">' + esc(n.d) + '</span></span>' + svg(['m9 18 6-6-6-6'], 20).replace('aria-hidden="true"', 'aria-hidden="true" class="br-notif-go"') + '</a>';
        }).join('') +
        (a.notes.length ? '' : '<div class="br-allok"><span class="su-empty-ico">' + svg(['M20 6 9 17l-5-5'], 24) + '</span><span class="heading">Semua beres</span><span class="su-empty-note">Tidak ada yang perlu diperhatikan sekarang.</span></div>') + '</div></div>';
    }
    if (ui.toast) h += '<div class="hf-toast br-toast" role="status"><span>' + esc(ui.toast.text) + '</span>' + (ui.toast.act ? '<a class="hf-btn hf-btn-sm hf-btn-on-ink br-toast-act" aria-disabled="true">' + esc(ui.toast.act) + '</a>' : '') + '</div>';
    return h;
  }

  function hero(d, v) {
    var spark = !d ? '' : '<a class="hf-spark" aria-label="Lihat laporan bulanan"><span class="br-spark-wrap"><svg viewBox="0 0 100 48" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="hfSparkFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--brand)" stop-opacity=".26"></stop><stop offset="1" stop-color="var(--brand)" stop-opacity="0"></stop></linearGradient></defs><polygon class="area" points="' + v.spark.area + '" style="fill: url(#hfSparkFill);"></polygon><polyline class="line" pathLength="100" points="' + v.spark.pts + '"></polyline></svg><span class="hf-spark-end" aria-hidden="true" style="left: 98%; top: ' + v.spark.dy + ';"><span class="hf-spark-pulse"></span><span class="hf-spark-core"></span></span></span><span class="hf-spark-axis"><span>Jun</span><span>6 bln</span><span>Nov</span></span></a>';
    var str = d ? v.hero.str : 'Rp 0';
    return '<section class="hf-total hf-hero' + (d ? ' hf-total-with-link' : '') + '" aria-label="Total harta"><div class="br-total-col"><span class="hf-total-label">Total semua anggota</span>' +
      '<span class="hf-total-amount" aria-label="' + str + '"><span aria-hidden="true">Rp <span class="hf-count" style="--n: ' + (d ? v.hero.int : 0) + ';"></span>' + (d ? v.hero.dec : '') + '</span></span>' +
      (d ? '<span class="hf-total-sub">' + esc(d.usd) + ' · <span class="hf-delta hf-delta-up">↑ ' + esc(d.delta) + '</span></span><a class="hf-total-link" aria-label="Termasuk piutang ' + esc(d.piutang) + ', buka Piutang">Termasuk piutang ' + esc(d.piutang) + CHEV + '</a>'
        : '<span class="hf-total-sub">$ 0 · belum ada catatan</span>') + '</div>' + spark + '</section>';
  }

  /* Potongan kartu Pembagian harta. Dipisah agar interaksi memperbarui yang berubah saja: transisi donut (lebar dan keburaman) dan
     animasi sapuan hanya jalan bila elemennya tetap ada, persis seperti di board. */
  function rowsHtml(v) {
    return v.rows.map(function (r) {
      return '<div><button class="hf-detail hf-legend hf-rise ' + v.rwCls + '" type="button" aria-pressed="' + r.pressed + '" data-act="row" data-i="' + r.i + '" style="--i: ' + r.i + '; opacity: ' + r.op + '; border-top: ' + r.bt + ';">' +
        '<span class="hf-swatch" style="background: ' + r.c + ';"></span><div class="hf-detail-main"><span class="hf-detail-name">' + esc(r.n) + '</span><span class="hf-detail-meta">' + esc(r.sub) + '</span></div>' +
        '<div class="hf-detail-figs"><span class="hf-detail-amount">' + r.vs + '</span><span class="' + r.dcls + '">' + r.g + '</span></div></button>' + subHtml(r) + '</div>';
    }).join('');
  }
  function subHtml(r) { return r.open ? '<div class="hf-subrows">' + r.subs.map(function (u) { return '<div class="hf-subrow"><span>' + esc(u.n) + '</span><span>' + u.v + '</span></div>'; }).join('') + '</div>' : ''; }
  function segsHtml(v) { return v.segs.map(function (s) { return '<circle class="' + s.cls + '" cx="100" cy="100" r="86" stroke-dasharray="' + s.da + '" stroke-dashoffset="' + s.off + '" style="opacity: ' + s.op + '; stroke-width: ' + s.sw + ';"></circle>'; }).join(''); }
  function centerHtml(v) {
    return '<span class="br-c-name">' + esc(v.cName) + '</span>' + (v.cHasCtx ? '<span class="br-c-ctx">' + esc(v.cCtx) + '</span>' : '') + '<span class="br-c-val">' + v.cValue + '</span>' + (v.cHasShare ? '<span class="hf-share">' + v.cShare + '</span>' : '');
  }
  function menuHtml(v) {
    return '<ul class="hf-select-menu" role="listbox" aria-label="Pilih">' + v.opts.map(function (o) {
      return '<li><button class="hf-select-opt" type="button" role="option" aria-selected="' + o.sel + '" data-act="opt" data-i="' + (o.i === null ? '' : o.i) + '"><span>' + esc(o.l) + '</span><span class="hf-sub">' + o.v + '</span></button></li>';
    }).join('') + '</ul>';
  }
  function card(v) {
    return '<section class="hf-card" aria-label="Pembagian harta"><div class="hf-card-head"><h2 class="hf-card-title">' + esc(v.title) + '</h2>' +
      '<div class="hf-toggle" role="group" aria-label="Tampilkan"><button type="button" aria-label="Per anggota" aria-pressed="' + (v.mode === 'anggota') + '" data-act="mode" data-mode="anggota">' + USER + '</button>' +
      '<button type="button" aria-label="Per jenis aset" aria-pressed="' + (v.mode === 'aset') + '" data-act="mode" data-mode="aset">' + GRID + '</button></div></div>' +
      '<div class="hf-select" style="z-index: ' + (ui.open ? 30 : 10) + ';"><button class="hf-select-btn" type="button" aria-haspopup="listbox" aria-expanded="' + ui.open + '" data-act="menu"><span>' + esc(v.selLabel) + '</span>' + CHEVD + '</button>' + (ui.open ? menuHtml(v) : '') + '</div>' +
      '<div class="hf-donut"><svg class="' + v.swCls + '" viewBox="0 0 200 200" aria-hidden="true">' + segsHtml(v) + '</svg><div class="hf-donut-center">' + centerHtml(v) + '</div></div>' +
      '<div class="hf-details">' + rowsHtml(v) + '</div><p class="br-note">Ketuk baris untuk menyorot · % sejak awal dicatat</p></section>';
  }

  function harga(d) {
    var rows = d.harga.map(function (h, i) {
      return '<div class="br-hrow" style="border-top: ' + (i ? '1px solid var(--line)' : 'none') + ';"><span class="br-hic" aria-hidden="true" style="background: var(--' + h[3] + '-soft); color: ' + (h[3] === 'gold' ? 'var(--gold)' : 'var(--brand)') + ';">' + h[2] + '</span>' +
        '<span class="br-htx"><span class="br-hname">' + h[0] + '</span><span class="caption su-lbl">' + h[1] + '</span></span>' +
        '<svg class="br-hspark" viewBox="0 0 48 18" width="44" height="17" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + B.miniSpark(h[7]) + '" fill="none" stroke="' + (h[6] === 'down' ? 'var(--loss)' : 'var(--brand)') + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></polyline></svg>' +
        '<span class="br-hfig"><span class="br-hprice' + (i === 0 ? ' hf-tick' : '') + '">' + h[4] + '</span><span class="hf-delta hf-delta-' + h[6] + '">' + h[5] + '</span></span></div>';
    }).join('');
    return '<section class="hf-card br-harga" aria-label="Harga terkini"><div class="br-harga-head"><span class="heading">Harga terkini</span><a class="hf-tap br-tap">Lihat semua' + CHEV16 + '</a></div><div class="br-harga-list">' + rows + '</div>' +
      '<span class="caption br-live"><span class="hf-spark-end" aria-hidden="true"><span class="hf-spark-pulse"></span><span class="hf-spark-core"></span></span>Live · diperbarui ' + d.live + '</span></section>';
  }

  function empty() {
    return '<section class="hf-card br-empty" aria-label="Belum ada aset"><span class="su-empty-ico">' + LAYERS + '</span><span class="heading">Belum ada aset</span>' +
      '<span class="su-empty-note">Catat aset yang Anda miliki sekarang, satu per satu.</span><a class="hf-btn hf-btn-primary hf-btn-block" aria-disabled="true">' + PLUS20 + 'Catat aset pertama</a></section>';
  }

  /** HTML kepala + isi. data = HF.demo.get(...) atau null (kosong). */
  function html(d) {
    if (d && !ui.init) { ui.init = true; ui.per = !!d.perOpen; ui.hi = d.hi == null ? null : d.hi; ui.toast = d.toast || null; } // keadaan awal dari data contoh
    var v = d ? B.view(d, ui) : null;
    return head(d) + '<main class="hf-scroll br-main" id="screen">' + hero(d, v) + banner(d) + (d ? card(v) + harga(d) : empty()) + '</main>';
  }

  /** Pasang interaksi. Pembaruan sehalus board: menyorot baris hanya mengubah gaya lingkaran (transisi), mengganti tampilan
      memutar ulang sapuan donut dan naiknya baris (kelas sw0/sw1 dan rw0/rw1 bergantian), membuka menu tidak menyentuh yang lain. */
  function bind(el, d) {
    function $(sel) { return el.querySelector(sel); }
    function paintMenu(v) {
      var sel = $('.hf-select'), ul = sel.querySelector('.hf-select-menu'), scrim = el.querySelector('.hf-scrim');
      sel.style.zIndex = ui.open ? 30 : 10; sel.querySelector('.hf-select-btn').setAttribute('aria-expanded', String(ui.open));
      if (ui.open && !ul) sel.insertAdjacentHTML('beforeend', menuHtml(v)); if (!ui.open && ul) ul.remove();
      if (ui.open && !scrim) { var s = document.createElement('div'); s.className = 'hf-scrim'; s.setAttribute('data-act', 'close'); el.appendChild(s); }
      if (!ui.open && scrim) scrim.remove();
    }
    function paintHighlight(v) {
      var circles = el.querySelectorAll('.hf-donut svg circle');
      v.segs.forEach(function (sg, i) { circles[i].style.opacity = sg.op; circles[i].style.strokeWidth = sg.sw; });
      var wraps = el.querySelectorAll('.hf-details > div');
      v.rows.forEach(function (r, i) {
        var b = wraps[i].querySelector('.hf-legend'), sub = wraps[i].querySelector('.hf-subrows');
        b.setAttribute('aria-pressed', String(r.pressed)); b.style.opacity = r.op;
        if (r.open && !sub) wraps[i].insertAdjacentHTML('beforeend', subHtml(r)); if (!r.open && sub) sub.remove();
      });
      $('.hf-donut-center').innerHTML = centerHtml(v);
    }
    function paintView(v) {
      $('.hf-card-title').textContent = v.title;
      [].forEach.call(el.querySelectorAll('.hf-toggle button'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === v.mode)); });
      $('.hf-select-btn span').textContent = v.selLabel;
      var svgEl = $('.hf-donut svg'); svgEl.innerHTML = segsHtml(v); svgEl.setAttribute('class', v.swCls);
      $('.hf-details').innerHTML = rowsHtml(v); $('.hf-donut-center').innerHTML = centerHtml(v);
      paintMenu(v);
    }
    function paintBell() {
      var old = el.querySelector('.br-overlays'); if (old) old.remove();
      el.insertAdjacentHTML('beforeend', '<div class="br-overlays">' + overlays(d) + '</div>');
      var bellBtn = el.querySelector('[data-act="bell"]'); if (bellBtn) bellBtn.setAttribute('aria-expanded', String(ui.per));
    }
    el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]'); if (!t) return;
      var a = t.getAttribute('data-act'), i = t.getAttribute('data-i');
      if (a === 'mode') { ui = { mode: t.getAttribute('data-mode'), sel: null, hi: null, open: false, k: ui.k + 1 }; paintView(B.view(d, ui)); }
      else if (a === 'opt') { ui = { mode: ui.mode, sel: i === '' ? null : +i, hi: null, open: false, k: ui.k + 1 }; paintView(B.view(d, ui)); }
      else if (a === 'bell') { ui.per = !ui.per; ui.open = false; if (d) paintMenu(B.view(d, ui)); paintBell(); }
      else if (a === 'close-bell') { ui.per = false; paintBell(); }
      else if (a === 'menu') { ui.open = !ui.open; ui.per = false; paintMenu(B.view(d, ui)); paintBell(); }
      else if (a === 'close') { ui.open = false; paintMenu(B.view(d, ui)); }
      else if (a === 'row') { ui.hi = ui.hi === +i ? null : +i; paintHighlight(B.view(d, ui)); }
    });
  }

  root.HF = root.HF || {};
  root.HF.berandaScreen = { html: html, bind: bind, overlays: overlays };
})(typeof globalThis !== 'undefined' ? globalThis : this);
