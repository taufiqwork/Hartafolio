/* Layar Riwayat: daftar transaksi per hari, pencarian, filter, sheet detail, daftar terhapus, toast. Mengikuti board 05-Riwayat*.
   Data dan aturan di HF.riwayat (engine); berkas ini hanya HTML dan interaksi. Pembaruan di tempat lewat HF.morph (menu, sheet,
   dan toast hanya muncul/hilang, baris dan kartu yang sama tidak digambar ulang). Hapus, Pulihkan, dan Ubah baru hidup di putaran E. */
(function (root) {
  'use strict';
  var F = root.HF.setupForm, esc = F.esc, svg = F.svg, R = root.HF.riwayat;
  var SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="18" height="18"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>';
  var CHEVD = svg(['m6 9 6 6 6-6']), CHEVR = svg(['m9 18 6-6-6-6'], 18), CHEVR16 = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>';
  var BACK = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>';
  var TRASH = svg(['M3 6h18', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'], 18);
  var RECEIPT = svg(['M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z', 'M14 8H8', 'M16 12H8', 'M13 16H8'], 24);
  var PLUS20 = svg(['M5 12h14', 'M12 5v14'], 20);

  var ui = { sel: {}, fOpen: null, sheet: null, del: null, view: 'list', toast: null, q: '' };
  var model = null, nav = '', saved = null, savedTimer = null, elRef = null;

  function icon(r, size, cls) { return '<span class="' + cls + '" style="background: ' + r.ibg + '; color: ' + r.ifg + ';" aria-hidden="true">' + svg(r.paths, size) + '</span>'; }

  function head(v) {
    if (v.delView) return '<div class="hf-head"><button type="button" class="rw-back" data-act="back">' + BACK + 'Riwayat</button><h1 class="title" style="margin: 0;">Terhapus</h1></div>';
    var chips = v.chips.map(function (c) {
      return '<div class="hf-select" style="z-index: ' + c.z + ';"><button class="hf-chip" type="button" aria-haspopup="listbox" aria-expanded="' + c.open + '" aria-pressed="' + c.active + '" data-act="chip" data-name="' + c.name + '">' + esc(c.label) + CHEVD + '</button>' +
        (c.open ? '<ul class="hf-select-menu" role="listbox" aria-label="' + c.name + '">' + c.opts.map(function (o) {
          return '<li><button class="hf-select-opt" type="button" role="option" aria-selected="' + o.sel + '" data-act="opt" data-name="' + c.name + '" data-val="' + esc(o.l) + '"><span>' + esc(o.l) + '</span></button></li>';
        }).join('') + '</ul>' : '') + '</div>';
    }).join('');
    return '<div class="hf-head"><h1 class="title" style="margin: 0;">Riwayat</h1>' + (v.hasAny ?
      '<label for="cari" class="rw-search">' + SEARCH + '<input id="cari" type="search" placeholder="Cari aset, catatan, bukti" value="' + esc(ui.q) + '" data-in="q"></label><div class="rw-chips">' + chips + '</div>' : '') + '</div>';
  }

  function row(r) {
    return '<div class="hf-detail" role="button" tabindex="0" data-act="row" data-id="' + esc(r.id) + '">' + icon(r, 18, 'rw-ico') +
      '<div class="hf-detail-main"><span class="hf-detail-name">' + esc(r.j + ' · ' + r.a) + '</span><span class="hf-detail-meta">' + esc(r.o) + '</span></div>' +
      '<div class="hf-detail-figs"><span class="hf-detail-amount">' + esc(r.q) + '</span>' + (r.imp ? '<span class="hf-badge">import</span>' : '') + (r.v ? '<span class="hf-share">' + esc(r.v) + '</span>' : '') + '</div></div>';
  }

  function main(v) {
    if (v.delView) {
      return '<main class="hf-scroll rw-main"><p class="rw-lead">Tidak dihitung dalam total. Pulihkan untuk mengembalikan.</p>' +
        (v.delRows.length ? '<div class="hf-card rw-card rw-del">' + v.delRows.map(function (r) {
          return '<div class="hf-detail">' + icon(r, 18, 'rw-ico') + '<div class="hf-detail-main"><span class="hf-detail-name">' + esc(r.j + ' · ' + r.a) + '</span><span class="hf-detail-meta">' + esc(r.mem + ' · ' + r.d) + '</span></div>' +
            '<button class="hf-btn hf-btn-ghost" type="button" data-act="restore" data-id="' + esc(r.id) + '">Pulihkan</button></div>';
        }).join('') + '</div>' : '<p class="rw-note" style="padding: 32px 0;">Tidak ada transaksi terhapus.</p>') + '</main>';
    }
    var h = '<main class="hf-scroll rw-main">';
    if (v.hasAny && v.hasDel) h += '<button type="button" class="rw-dellink" data-act="del"><span>' + TRASH + '</span><span>' + esc(v.delLabel) + '</span>' + CHEVR + '</button>';
    h += v.days.map(function (d) {
      return '<section class="rw-day" aria-label="' + esc(d.d) + '"><span class="label">' + esc(d.d) + '</span><div class="hf-card rw-card">' + d.rows.map(row).join('') + '</div></section>';
    }).join('');
    if (v.noMatch) h += '<p class="rw-note">Tidak ada transaksi yang cocok dengan filter ini.</p>';
    if (v.kosong) h += '<section class="hf-card rw-empty" aria-label="Belum ada transaksi"><span class="rw-empty-ico">' + RECEIPT + '</span><span class="heading">Belum ada transaksi</span>' +
      '<span class="rw-empty-note">Semua transaksi akan muncul di sini.</span><a class="hf-btn hf-btn-primary hf-btn-block" href="#/catat">' + PLUS20 + 'Catat transaksi</a></section>';
    if (v.hasAny) h += '<p class="caption rw-foot">Atas: jumlah aset. Bawah: nilai saat transaksi. Ketuk untuk ubah atau hapus.</p>';
    return h + '</main>';
  }

  /* Tiga slot tetap (scrim, sheet, toast): saat sheet menutup dan toast muncul, HF.morph tidak mengubah satu elemen jadi elemen lain,
     jadi animasi masuk toast dan sheet tetap jalan. */
  function overlays(v) {
    var scrim = v.scrim ? '<div class="hf-scrim" data-act="close"></div>' : '', sh = '', ts = '';
    if (v.sheet) {
      var s = v.sheet;
      sh = '<section class="hf-sheet" role="dialog" aria-label="Detail transaksi"><span aria-hidden="true" class="hf-sheet-handle"></span>' +
        '<div class="rw-sheet-top">' + icon(s, 20, 'rw-sheet-ico') + '<span class="heading">' + esc(s.title) + '</span><span class="amount rw-sheet-amt">' + esc(s.q) + '</span></div>' +
        '<div class="rw-det">' + s.det.map(function (d) {
          return '<div><span>' + esc(d.k) + '</span>' + (d.href ? '<a href="' + esc(d.ext ? d.href : '#/riwayat') + '"' + (d.ext ? ' target="_blank" rel="noopener"' : ' data-soon="1"') + '>' + esc(d.v) + CHEVR16 + '</a>' : '<b>' + esc(d.v) + '</b>') + '</div>';
        }).join('') + '</div>' +
        '<div class="rw-acts"><button class="hf-btn hf-btn-primary hf-btn-block" type="button" data-act="ubah"' + (s.edit ? '' : ' disabled') + '>Ubah</button>' +
        '<button class="hf-btn hf-btn-block hf-btn-danger" type="button" data-act="hapus"' + (s.edit || model.on ? '' : ' disabled') + '>Hapus</button></div></section>';
    }
    if (v.toast) ts = '<div class="hf-toast rw-toast" role="status"><span>' + esc(v.toast) + '</span><button class="hf-btn hf-btn-sm hf-btn-on-ink" type="button" data-act="undo" style="flex: none;">Pulihkan</button></div>';
    else if (saved) ts = '<div class="hf-toast rw-toast" role="status"><span>' + esc(saved) + '</span></div>';
    return '<div class="rw-slot">' + scrim + '</div><div class="rw-slot">' + sh + '</div><div class="rw-slot">' + ts + '</div>';
  }

  function html(m) {
    model = m; var v = R.view(m.data, ui);
    return head(v) + main(v) + nav + overlays(v);
  }

  /** Pasang ke elemen. m = { data, ui?, saved?, real }. navHtml = menu bawah (dari app.js). */
  function mount(el, m, navHtml) {
    nav = navHtml; model = m; elRef = el; if (m.saved) saved = m.saved;
    ui = Object.assign({ sel: {}, fOpen: null, sheet: null, del: [], view: 'list', toast: null, q: '' }, m.ui || {});
    if (m.data.delIds) ui.del = m.data.delIds.slice();
    function paint() { root.HF.morph(el, html(model)); }
    /* Hapus/Pulihkan: data nyata (m.on) dikirim ke server dan dikembalikan bila ditolak; data contoh hanya di layar. */
    function mark(id, v) { m.data.days.forEach(function (d) { d.rows.forEach(function (r) { if (String(r.id) === String(id)) { r.del = v; if (v) r.delText = 'dihapus hari ini'; } }); }); }
    function setDel(id, v) {
      if (m.on && (v ? m.on.hapus : m.on.pulihkan)) {
        mark(id, v);
        (v ? m.on.hapus : m.on.pulihkan)(id).catch(function (e) { mark(id, !v); if (v) ui.toast = null; saved = (e && e.message) || 'Gagal menyimpan. Coba lagi.'; paint(); clearTimeout(flash.t); flash.t = setTimeout(function () { saved = null; paint(); }, 6000); });
      } else ui.del = v ? ui.del.concat([id]) : ui.del.filter(function (x) { return String(x) !== String(id); });
    }
    if (ui.toast) savedTimer = setTimeout(function () { ui.toast = null; paint(); }, 6000); // toast awal (mis. sesudah Hapus dari layar Ubah)
    function first() { var v = R.view(m.data, ui); el.innerHTML = head(v) + main(v) + nav + overlays(v); }
    first();
    el.onclick = function (e) {
      var t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
      var a = t.getAttribute('data-act'), id = t.getAttribute('data-id');
      if (a === 'chip') { var n = t.getAttribute('data-name'); ui.fOpen = ui.fOpen === n ? null : n; ui.sheet = null; }
      else if (a === 'opt') { var nm = t.getAttribute('data-name'), val = t.getAttribute('data-val'); ui.sel = Object.assign({}, ui.sel); ui.sel[nm] = val === 'Semua' ? null : val; ui.fOpen = null; }
      else if (a === 'row') { ui.sheet = id; ui.fOpen = null; }
      else if (a === 'close') { ui.fOpen = null; ui.sheet = null; }
      else if (a === 'del') { ui.view = 'del'; ui.toast = null; ui.fOpen = null; }
      else if (a === 'back') ui.view = 'list';
      else if (a === 'ubah') { if (m.on && m.on.ubah) m.on.ubah(ui.sheet); return; }
      else if (a === 'hapus') { var hid = ui.sheet; setDel(hid, true, hid); ui.toast = hid; ui.sheet = null; clearTimeout(savedTimer); savedTimer = setTimeout(function () { ui.toast = null; paint(); }, 6000); }
      else if (a === 'undo') { var uid = ui.toast; setDel(uid, false, uid); ui.toast = null; }
      else if (a === 'restore') setDel(id, false, id);
      else return;
      paint();
    };
    el.onkeydown = function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute && e.target.getAttribute('data-act') === 'row') { e.preventDefault(); e.target.click(); } };
    el.oninput = function (e) { if (e.target.getAttribute('data-in') === 'q') { ui.q = e.target.value; paint(); } };
  }

  /** Toast sementara di atas Riwayat (mis. setelah Catat menyimpan). Boleh dipanggil sebelum layar terpasang: tampil saat dipasang. */
  function flash(t) {
    saved = t.text; clearTimeout(flash.t);
    flash.t = setTimeout(function () { saved = null; if (elRef && model && elRef.querySelector('.rw-main')) root.HF.morph(elRef, html(model)); }, 4000);
  }

  root.HF = root.HF || {};
  root.HF.riwayatScreen = { mount: mount, flash: flash, html: html };
})(typeof globalThis !== 'undefined' ? globalThis : this);
