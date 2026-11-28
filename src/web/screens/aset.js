/* Layar Aset: posisi per kelas aset, filter anggota (chip) dan lokasi (menu), keadaan kosong, toast. Mengikuti board 03-Aset*.
   Data dan aturan di HF.aset (engine); berkas ini hanya HTML dan interaksi. Pembaruan di tempat lewat HF.morph (menu dan toast
   hanya muncul/hilang, kartu yang sama tidak digambar ulang). Tombol Kelola menunggu layar Kelola aset (belum dibangun). */
(function (root) {
  'use strict';
  var F = root.HF.setupForm, esc = F.esc, A = root.HF.aset;
  var GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="18" height="18"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  var CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>';
  var STACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="24" height="24"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"></path><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"></path><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"></path></svg>';
  var PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="20" height="20"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>';

  var ui = { aM: null, aL: null, lokOpen: false };
  var model = null, nav = '', saved = null, elRef = null;

  function head(v) {
    var kelola = v.hasRows ? '<a class="hf-btn hf-btn-sm" href="#/kelola" aria-label="Kelola aset' + (v.perluHarga ? ', ' + v.perluHarga + ' aset perlu harga' : '') + '" style="position: relative; flex: none;">' + GEAR + 'Kelola' +
      (v.perluHarga ? '<span aria-hidden="true" style="position: absolute; top: -4px; right: -4px; width: 10px; height: 10px; border-radius: 999px; background: var(--loss); box-shadow: 0 0 0 2px var(--surface);"></span>' : '') + '</a>' : '';
    return '<div class="hf-head"><header style="display: flex; justify-content: space-between; align-items: center;"><h1 class="title" style="margin: 0;">Aset</h1>' + kelola + '</header>' +
      '<div style="display: flex; flex-wrap: wrap; gap: 8px;" role="group" aria-label="Anggota">' + v.pills.map(function (p) {
        return '<button class="hf-chip" type="button" aria-pressed="' + p.pressed + '" data-act="pill" data-v="' + esc(p.v || '') + '">' + esc(p.l) + '</button>'; }).join('') + '</div></div>';
  }

  function group(g) {
    var ico = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="20" height="20">' + g.paths.map(function (d) { return '<path d="' + d + '"></path>'; }).join('') + '</svg>';
    return '<section class="hf-card" style="gap: 0; padding: 0; overflow: hidden;" aria-label="' + esc(g.k) + '">' +
      '<header style="display: grid; grid-template-columns: 40px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 14px 16px; background: ' + g.tint + '; border-bottom: 1px solid var(--line);">' +
      '<span style="width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; background: var(--surface-raised); color: ' + g.ink + ';">' + ico + '</span>' +
      '<span style="display: flex; flex-direction: column; gap: 4px; min-width: 0;"><span style="font-size: 16px; line-height: 24px; font-weight: 600;">' + esc(g.k) + '</span><span class="caption" style="color: var(--ink-muted);">' + g.n + ' posisi · ' + g.share + ' dari total</span></span>' +
      '<span style="font-size: 16px; line-height: 24px; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap;">' + esc(g.v) + '</span></header>' +
      '<div style="padding: 0 16px;">' + g.rows.map(function (r) {
        return '<div class="hf-detail" style="grid-template-columns: minmax(0, 1fr) auto;"><div class="hf-detail-main"><span class="hf-detail-name">' + esc(r.a) + ' <span style="font-weight: 500; color: var(--ink-muted);">· ' + esc(r.l) + '</span></span><span class="hf-detail-meta">' + esc(r.q + r.p) + '</span></div>' +
          '<div class="hf-detail-figs"><span class="hf-detail-amount">' + esc(r.v) + '</span>' + (r.manual ? '<span class="hf-badge">manual</span>' : '') + '</div></div>'; }).join('') + '</div></section>';
  }

  function main(v) {
    var h = '<main class="hf-scroll" style="flex: 1; min-height: 0; overflow-y: auto; padding: 16px 16px 24px; display: flex; flex-direction: column; gap: 16px;">';
    h += '<div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;"><span class="label" style="color: var(--ink-muted);">' + v.count + ' posisi · ' + esc(v.total) + '</span>' +
      '<div class="hf-select" style="position: relative; z-index: 30; flex: none;"><button class="hf-chip" type="button" aria-haspopup="listbox" aria-expanded="' + v.lokOpen + '" data-act="lok">Lokasi: <span class="sc-interp">' + esc(v.lokLabel) + '</span>' + CHEV + '</button>' +
      (v.lokOpen ? '<ul class="hf-select-menu" role="listbox" aria-label="Lokasi" style="left: auto; right: 0; min-width: 230px; box-sizing: content-box;">' + v.lokOpts.map(function (o) {
        return '<li><button class="hf-select-opt" type="button" role="option" aria-selected="' + o.sel + '" data-act="opt" data-v="' + esc(o.val || '') + '"><span><span class="sc-interp">' + esc(o.l) + '</span></span><span class="hf-sub"><span class="sc-interp">' + esc(o.v) + '</span></span></button></li>'; }).join('') + '</ul>' : '') + '</div></div>';
    h += v.groups.map(group).join('');
    if (v.hasRows) h += '<p style="margin: 0; text-align: center; font-size: 13px; line-height: 20px; color: var(--ink-muted);">Ada aset lama yang belum tercatat? <a href="#/catat" style="font-weight: 600;">Catat saldo awal</a>.</p>';
    if (v.empty) h += '<section class="hf-card" style="padding: 24px 16px; gap: 12px; justify-items: center; text-align: center;" aria-label="Belum ada aset"><span style="width: 48px; height: 48px; border-radius: 999px; display: grid; place-items: center; background: var(--brand-soft); color: var(--brand);">' + STACK + '</span>' +
      '<span class="heading">Belum ada aset</span><span style="font-size: 13px; line-height: 20px; color: var(--ink-muted);">Catat saldo awal tiap aset, satu per satu.</span>' +
      '<a class="hf-btn hf-btn-primary hf-btn-block" href="#/catat">' + PLUS + 'Catat aset pertama</a></section>';
    return h + '</main>';
  }

  /* Dua slot tetap (scrim, toast) supaya animasi masuk toast jalan: HF.morph tidak mengubah satu elemen jadi elemen lain. */
  function overlays(v) {
    var scrim = v.lokOpen ? '<div class="hf-scrim" data-act="close"></div>' : '', ts = '';
    if (saved) ts = '<div class="hf-toast" role="status" style="--toast-bottom: calc(var(--safe-bottom) + 83px);"><span>' + esc(saved.text) + '</span>' + (saved.act ? '<a class="hf-btn hf-btn-sm hf-btn-on-ink" href="#/riwayat" style="flex: none;">' + esc(saved.act) + '</a>' : '') + '</div>';
    return '<div class="rw-slot">' + scrim + '</div><div class="rw-slot">' + ts + '</div>';
  }

  function html(m) { model = m; var v = A.view(m.data, ui); return head(v) + main(v) + nav + overlays(v); }

  /** m = { data, ui?, saved?, real }. navHtml = menu bawah (dari app.js). */
  function mount(el, m, navHtml) {
    nav = navHtml; model = m; elRef = el; if (m.saved) saved = m.saved;
    ui = Object.assign({ aM: null, aL: null, lokOpen: false }, m.ui || {});
    function paint() { root.HF.morph(el, html(model)); }
    el.innerHTML = html(m);
    el.onclick = function (e) {
      var t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
      var a = t.getAttribute('data-act'), v = t.getAttribute('data-v');
      if (a === 'pill') ui.aM = v || null;
      else if (a === 'lok') ui.lokOpen = !ui.lokOpen;
      else if (a === 'opt') { ui.aL = v || null; ui.lokOpen = false; }
      else if (a === 'close') ui.lokOpen = false;
      else return;
      paint();
    };
  }

  /** Toast sementara (mis. setelah Catat menyimpan). Boleh dipanggil sebelum layar terpasang: tampil saat dipasang. */
  function flash(t) {
    saved = t; clearTimeout(flash.t);
    flash.t = setTimeout(function () { saved = null; if (elRef && model && elRef.querySelector('.hf-scroll')) root.HF.morph(elRef, html(model)); }, t && t.on ? 12000 : 4000);
  }

  root.HF = root.HF || {};
  root.HF.asetScreen = { mount: mount, flash: flash, html: html };
})(typeof globalThis !== 'undefined' ? globalThis : this);
