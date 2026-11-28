/* Layar Kelola aset: daftar aset dan sumber harganya, lembar Ubah / Hapus / Tambah / Aset tersembunyi / Saldo awal. Mengikuti board 14-Aset*.
   Aturan dan model di HF.kelola (engine); berkas ini hanya HTML dan interaksi. Perubahan tampil seketika (HF.kelola.patch), server menyusul;
   gagal = kembali ke keadaan sebelumnya dan pesan. Pembaruan di tempat lewat HF.morph (lembar masuk memutar animasinya sekali). */
(function (root) {
  'use strict';
  var F = root.HF.setupForm, esc = F.esc, K = root.HF.kelola;
  var SV = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var BACK = '<svg ' + SV + ' width="20" height="20"><path d="m15 18-6-6 6-6"></path></svg>';
  var CHEV = '<svg ' + SV + ' width="16" height="16" style="color: var(--ink-muted);"><path d="m9 18 6-6-6-6"></path></svg>';
  var PLUS = '<svg ' + SV + '><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>';
  var SEARCH = '<svg ' + SV + ' width="18" height="18"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>';
  var LBL = 'color: var(--ink-muted);', MUTED = 'font-size: 13px; line-height: 20px; color: var(--ink-muted);';
  var M, ui, fm = null, history = null, elRef = null, toastT = null;

  function head() {
    var back = M.dari === 'alat' ? ['Alat', '#/alat'] : (M.dari === 'beranda' ? ['Beranda', '#/beranda'] : ['Aset', '#/aset']);
    return '<div class="hf-head"><a href="' + back[1] + '" style="align-self: flex-start; display: inline-flex; align-items: center; gap: 4px; min-height: 44px; font-size: 15px; font-weight: 600; text-decoration: none; line-height: 22px;">' +
      BACK + esc(back[0]) + '</a><h1 class="title" style="margin: 0;">Kelola aset</h1></div>';
  }

  function row(r, first) {
    var bcls = r.bad ? 'hf-badge hf-badge-loss' : 'hf-share';
    return '<div style="border-top: ' + (first ? 'none' : '1px solid var(--line)') + ';"><button type="button" class="hf-detail" data-act="' + (r.hid ? 'hid-buka' : 'buka') + '" data-v="' + r.i + '" style="font: inherit; color: var(--ink); background: transparent; text-align: left; cursor: pointer; width: 100%; align-items: center; grid-template-columns: minmax(0, 1fr) auto 16px; min-height: 56px; box-sizing: border-box; border: 0;">' +
      '<span style="display: flex; flex-direction: column; min-width: 0;"><span style="font-size: 15px; line-height: 22px; font-weight: 500; color: var(--ink);">' + esc(r.a) + '</span><span class="caption" style="' + LBL + '">' + esc(r.sub) + '</span></span>' +
      '<span class="' + bcls + '">' + esc(r.b) + '</span>' + CHEV + '</button></div>';
  }

  function main(L) {
    var h = '<main class="hf-scroll" style="flex: 1; min-height: 0; overflow-y: auto; padding: 16px 16px 24px; display: flex; flex-direction: column; gap: 16px;">' +
      '<div style="display: flex; flex-direction: column; gap: 8px;"><p style="margin: 0; font-size: 14px; line-height: 20px; ' + LBL + '">' + esc(L.intro) + '</p></div>';
    if (L.need && M.notice !== false) h += '<div role="status" data-act="isi" style="font-size: 14px; line-height: 20px; padding: 12px 16px; border-radius: 12px; background: var(--gold-soft); color: var(--ink);">' + (L.need > 1 ? L.need + ' aset' : esc(L.needName)) + ' belum punya harga hari ini. Ketuk untuk mengisi.</div>';
    L.groups.forEach(function (g) {
      h += '<section style="display: flex; flex-direction: column; gap: 8px;" aria-label="' + esc(g.t) + '"><span class="label" style="' + LBL + '">' + esc(g.t) + '</span><div class="hf-card" style="padding: 0 16px; gap: 0;">' +
        g.rows.map(function (r, i) { return row(r, i === 0); }).join('') + '</div></section>';
    });
    return h + '</main>';
  }

  function foot() {
    return '<footer style="flex: none; padding: 12px 16px calc(var(--safe-bottom) + 12px); display: flex; flex-direction: column; gap: 8px; background: var(--surface-raised); border-top: 1px solid var(--line);">' +
      '<button class="hf-btn hf-btn-primary hf-btn-block" type="button" data-act="tambah">Tambah aset</button></footer>';
  }

  function field(f, key) {
    var inner = f.input ? '<input class="hf-input hf-input-num" type="text" value="' + esc(f.v) + '" aria-label="' + esc(f.l) + '"' + (key ? ' data-in="' + key + '"' : '') + '>'
      : '<span style="min-height: 48px; display: flex; align-items: center; padding: 0 12px; border-radius: 12px; background: var(--surface-sunken); color: var(--ink-muted); font-size: 16px; line-height: 24px;">' + esc(f.v) + '</span>';
    return '<div style="display: flex; flex-direction: column; gap: 8px;"><span class="label" style="' + LBL + '">' + esc(f.l) + '</span>' + inner + (f.hint ? '<span class="caption" style="' + LBL + '">' + esc(f.hint) + '</span>' : '') + '</div>';
  }

  function radios(S, act) {
    return '<div role="radiogroup" aria-label="' + esc(S.optLabel || 'Pilihan') + '" style="display: flex; flex-direction: column; gap: 8px;">' + (S.optLabel ? '<span class="label" style="' + LBL + '">' + esc(S.optLabel) + '</span>' : '') +
      S.opts.map(function (o, i) {
        var on = i === S.optDef;
        return '<button type="button" role="radio" aria-checked="' + on + '" data-act="' + act + '" data-v="' + i + '" style="font: inherit; display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 12px; align-items: start; padding: 12px 16px; border-radius: 12px; border: 1.5px solid ' + (on ? 'var(--brand)' : 'var(--line)') +
          '; background: ' + (on ? 'var(--brand-soft)' : 'var(--surface-raised)') + '; color: var(--ink); text-align: left; cursor: pointer;"><span style="width: 22px; height: 22px; min-width: 22px; flex: none; aspect-ratio: 1 / 1; margin-top: 1px; border-radius: 999px; border: 2px solid ' +
          (on ? 'var(--brand)' : 'var(--line-strong)') + '; box-sizing: border-box; display: grid; place-items: center;"><span style="width: 10px; height: 10px; border-radius: 999px; background: ' + (on ? 'var(--brand)' : 'transparent') + ';"></span></span>' +
          '<span style="display: flex; flex-direction: column; gap: 4px;"><span style="font-size: 15px; line-height: 22px; font-weight: 600;">' + esc(o.l) + '</span>' + (o.d ? '<span style="' + MUTED + '">' + esc(o.d) + '</span>' : '') + '</span></button>';
      }).join('') + '</div>';
  }

  function picker(P) {
    return '<label style="display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 12px; border-radius: 12px; background: var(--surface-sunken); color: var(--ink-muted); flex: none;">' + SEARCH +
      '<input type="search" value="' + esc(P.q) + '" placeholder="' + esc(P.ph) + '" aria-label="' + esc(P.ph) + '" data-in="q" style="flex: 1; min-width: 0; border: 0; background: transparent; font: inherit; font-size: 16px; color: var(--ink); line-height: 24px;"></label>' +
      '<div style="display: flex; gap: 8px; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; flex: none; margin: 0 -16px; padding: 0 16px;">' +
      P.chips.map(function (l) { return '<button class="hf-chip" type="button" aria-pressed="' + (P.cat === l) + '" data-act="cat" data-v="' + esc(l) + '" style="flex: none;">' + esc(l) + '</button>'; }).join('') + '</div>' +
      '<div style="display: flex; flex-direction: column;">' + (P.items.length ? '<span class="label" style="color: var(--ink-muted); padding: 8px 0 4px;">' + esc(P.sec) + '</span>' + P.items.map(function (k) {
        return '<button type="button" data-act="pick-kat" data-v="' + esc(k.id) + '" style="font: inherit; color: var(--ink); text-align: left; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 10px 0; min-height: 48px; border: 0; border-top: 1px solid var(--line); background: transparent; cursor: pointer;">' +
          '<span style="display: flex; flex-direction: column; gap: 4px;"><span style="font-size: 15px; font-weight: 600; line-height: 22px;">' + esc(k.n) + '</span><span class="caption" style="' + LBL + '">' + esc(k.f) + '</span></span><span class="hf-badge">' + esc(k.c) + '</span></button>';
      }).join('') : '') + '</div>';
  }

  function lines(ls) {
    return '<div style="display: flex; flex-direction: column; border: 1px solid var(--line); border-radius: 12px; overflow: hidden;">' + ls.map(function (l) {
      return '<div style="display: grid; grid-template-columns: ' + (l.length ? '84px minmax(0, 1fr)' : 'minmax(0, 1fr)') + '; gap: 12px; padding: 12px; border-top: 1px solid var(--line);">' +
        (l.length ? '<span class="label" style="color: var(--ink);">' + esc(l[0]) + '</span><span style="' + MUTED + '">' + esc(l[1]) + '</span>' : '<span style="' + MUTED + '">' + esc(l) + '</span>') + '</div>'; }).join('') + '</div>';
  }

  function sheetHtml(S) {
    var body = '<div style="display: flex; flex-direction: column; gap: 4px;"><span class="heading">' + esc(S.title) + '</span>' + (S.desc ? '<span style="' + MUTED + '">' + esc(S.desc) + '</span>' : '') + '</div>';
    if (S.picker) body += picker(S.picker);
    (S.fields || []).forEach(function (f) { body += field(f, f.input ? 'nama' : null); });
    if (S.opts) body += radios(S, S.optLabel ? 'radio' : 'hid-pilih');
    (S.fields2 || []).forEach(function (f) { body += field(f, f.input ? 'harga' : null); });
    if (S.lines) body += lines(S.lines);
    var foot = '';
    if (S.picker) foot += '<div style="display: flex; flex-direction: column; gap: 8px;"><span class="caption" style="' + LBL + '">' + esc(S.picker.note) + '</span><button class="hf-btn hf-btn-ghost" type="button" data-act="add-manual" style="align-self: flex-start;">' + PLUS + esc(S.picker.link) + '</button></div>';
    if (S.primary) foot += '<button class="hf-btn hf-btn-primary hf-btn-block" type="button" data-act="' + S.primary.act + '"' + (S.primary.danger ? ' style="background: var(--loss); border-color: var(--loss); color: var(--surface);"' : '') + '>' + esc(S.primary.l) + '</button>';
    if (S.secondary) foot += '<button class="hf-btn hf-btn-ghost hf-btn-block" type="button" data-act="' + S.secondary.act + '" style="color: ' + (S.secondary.danger ? 'var(--loss)' : 'var(--brand)') + ';">' + esc(S.secondary.l) + '</button>';
    return '<div class="hf-scrim" data-act="tutup"></div><section class="hf-sheet hf-sheet-flush" role="dialog" aria-label="' + esc(S.title) + '"><span aria-hidden="true" class="hf-sheet-handle" style="margin-bottom: 8px;"></span>' +
      '<div style="flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 0 16px 12px; display: flex; flex-direction: column; gap: 16px;">' + body + '</div>' +
      '<div style="flex: none; padding: 10px 16px calc(var(--safe-bottom) + 12px); display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--line); background: var(--surface-raised);">' + foot + '</div></section>';
  }

  function overlays() {
    var sheet = '', toast = '', S = null;
    if (ui.sheet === 'manual' && fm) sheet = F.render(fm);
    else { S = K.sheet(M.data, ui); if (S) sheet = sheetHtml(S); }
    if (ui.toast) toast = '<div class="hf-toast" role="status" style="--toast-bottom: calc(var(--safe-bottom) + 89px);">' + esc(ui.toast) + '</div>';
    else if (M.simpan) toast = '<div class="hf-toast" role="status" style="--toast-bottom: calc(var(--safe-bottom) + 89px);"><span>' + esc(M.simpan.text) + '</span><a class="hf-btn hf-btn-sm hf-btn-on-ink" href="#/riwayat" style="flex: none;">Lihat</a></div>';
    return '<div class="rw-slot">' + sheet + '</div><div class="rw-slot">' + toast + '</div>';
  }

  function html() { return head() + main(K.list(M.data)) + foot() + overlays(); }
  function paint() { root.HF.morph(elRef, html()); }

  function say(t) { ui.toast = t; clearTimeout(toastT); toastT = setTimeout(function () { ui.toast = ''; if (elRef && elRef.querySelector('.hf-scroll')) paint(); }, 4000); }
  function today() { var n = new Date(), p = function (x) { return ('0' + x).slice(-2); }; return n.getFullYear() + '-' + p(n.getMonth() + 1) + '-' + p(n.getDate()); }
  function close() { ui = Object.assign({}, ui, { sheet: null, opt: null, nama: undefined, harga: undefined, q: '', pk: 'Semua' }); fm = null; }

  /** Terapkan perubahan lokal seketika, kirim ke server; gagal = kembali ke keadaan sebelumnya. */
  function ubahData(aksi, p, kirim, toastOk) {
    history = M.data; M.data = K.patch(M.data, aksi, p, today()); close(); say(toastOk);
    if (!M.on) return;
    Promise.resolve(kirim()).then(function () { return M.refresh ? M.refresh() : null; }).then(function (d) { if (d && elRef) { M.data = d; paint(); } }).catch(function (e) {
      M.data = history; say((e && e.message) || 'Tidak tersimpan. Coba lagi.'); if (elRef) paint();
    });
  }

  var A = {
    buka: function (v) { ui = Object.assign({}, ui, { sheet: 'ubah', sel: +v, opt: null, nama: undefined, harga: undefined }); },
    isi: function () { var i = M.data.A.findIndex(function (r) { return r.perlu; }); if (i >= 0) A.buka(i); },
    'hid-buka': function () { ui = Object.assign({}, ui, { sheet: 'tersembunyi', hid: 0 }); },
    'hid-pilih': function (v) { ui.hid = +v; },
    tutup: function () { close(); }, nanti: function () { var n = ui.added ? ui.added.n : ''; close(); say(n + ' ditambahkan · belum dimiliki'); },
    tambah: function () { ui = Object.assign({}, ui, { sheet: 'tambah', q: '', pk: 'Semua' }); },
    cat: function (v) { ui.pk = v; },
    radio: function (v) { ui.opt = +v; },
    ubah: function () { ui = Object.assign({}, ui, { sheet: 'ubah' }); },
    'hapus-buka': function () { ui = Object.assign({}, ui, { sheet: 'hapus' }); },
    'simpan-ubah': function () {
      var S = K.sheet(M.data, ui), r = M.data.A[ui.sel], otomatis = S.opts[S.optDef].l === 'Otomatis';
      var o = { nama: S.fields[0].v, otomatis: otomatis, harga: otomatis ? '' : S.fields2[0].v };
      var e = K.cekUbah({ canAuto: r.canAuto || r.tetap, punyaHarga: r.punyaHarga, unit: r.unit.replace(' · US$', '') }, o);
      if (e) return say(e);
      var gfi = !otomatis && r.perlu;
      ubahData('ubah', { i: ui.sel, nama: o.nama, otomatis: otomatis, harga: o.harga }, function () { return M.on.ubah(r.id, o); }, gfi ? 'Harga ' + r.a + ' disimpan' : 'Aset diperbarui');
    },
    hapus: function () { var r = M.data.A[ui.sel]; ubahData('hapus', { i: ui.sel }, function () { return M.on.status(r.id, 'hapus'); }, r.a + ' dihapus'); },
    sembunyikan: function () { var r = M.data.A[ui.sel]; ubahData('sembunyikan', { i: ui.sel }, function () { return M.on.status(r.id, 'sembunyikan'); }, r.a + ' disembunyikan · lihat di Aset tersembunyi'); },
    tampilkan: function () { var r = M.data.HID[ui.hid || 0]; if (!r) return; ubahData('tampilkan', { i: ui.hid || 0 }, function () { return M.on.status(r.id, 'tampilkan'); }, r.a + ' tampil lagi di daftar'); },
    'pick-kat': function (v) {
      var k = M.data.KAT.filter(function (x) { return x.id === v; })[0]; if (!k) return;
      history = M.data; M.data = K.patch(M.data, 'katalog', { id: v }, today());
      ui = Object.assign({}, ui, { sheet: 'saldo', q: '', pk: 'Semua', added: { n: k.n, harga: 'Otomatis · ' + (M.data.A[M.data.A.length - 1].b ? M.data.A[M.data.A.length - 1].b + ' ' + k.per : 'harga menyusul'), c: k.c } });
      if (M.on) Promise.resolve(M.on.katalog(v)).then(function () { return M.refresh ? M.refresh() : null; }).then(function (d) { if (d && elRef) { M.data = d; var r = d.A.filter(function (x) { return x.id === v; })[0]; if (r && ui.added && ui.added.n === k.n && r.b) ui.added.harga = 'Otomatis · ' + r.b + ' ' + r.per; paint(); } })
        .catch(function (e) { M.data = history; close(); say((e && e.message) || 'Tidak tersimpan. Coba lagi.'); paint(); });
    },
    'saldo-awal': function () { var n = ui.added ? ui.added.n : ''; close(); if (M.on && M.on.saldoAwal) M.on.saldoAwal(n); else say('Catat saldo awal dibuka dari tab Aset'); },
    'add-manual': function () { fm = { k: 'aset', mode: 'tambah', v: Object.assign({ nama: '', jenis: null, sat: null, gram: '', harga: '' }, ui.manual || {}), pk: null, sec: 'Kembali ke daftar' }; ui = Object.assign({}, ui, { sheet: 'manual' }); },
    'fm-close': function () { close(); }, 'fm-sec': function () { fm = null; ui = Object.assign({}, ui, { sheet: 'tambah' }); },
    sel: function () { fm.pk = fm.pk === 'jenis' ? null : 'jenis'; },
    opt: function (v) { fm.v.jenis = v; fm.pk = null; fm.v.sat = null; },
    seg: function (v) { fm.v.sat = v; },
    'fix-fm': function (v, t) { var k = t.getAttribute('data-f'), g = root.HF.angka.analisis(fm.v[k]).galat; if (g && g.perbaiki) fm.v[k] = root.HF.angka.analisis(g.perbaiki).teks; },
    'fm-save': function () {
      var v = fm.v, nama = String(v.nama || '').trim(); if (!nama || !v.jenis) return;
      var units = F.MU[v.jenis], sat = units.indexOf(v.sat) >= 0 ? v.sat : units[0];
      if (!(K.num(v.harga) > 0)) { fm.error = { title: 'Harga belum diisi', text: 'Isi harga per ' + sat + ' hari ini.' }; return; }
      if (M.data.A.some(function (r) { return r.a.toLowerCase() === nama.toLowerCase(); })) { fm.error = { title: 'Nama sudah dipakai', text: 'Sudah ada aset bernama "' + nama + '".' }; return; }
      var d = { nama: nama, kelas: v.jenis, satuan: sat, gram_per_unit: v.gram, harga: v.harga };
      history = M.data; M.data = K.patch(M.data, 'manual', { nama: nama, kelas: v.jenis, satuan: sat, harga: v.harga }, today());
      ui = Object.assign({}, ui, { sheet: 'saldo-manual', added: { n: nama, harga: 'Manual · Rp ' + v.harga + ' per ' + sat, c: v.jenis } }); fm = null;
      if (M.on) Promise.resolve(M.on.manual(d)).then(function () { return M.refresh ? M.refresh() : null; }).then(function (x) { if (x && elRef) { M.data = x; paint(); } })
        .catch(function (e) { M.data = history; close(); say((e && e.message) || 'Tidak tersimpan. Coba lagi.'); paint(); });
    }
  };

  /** m = { data, ui?, toast?, simpan?, dari?, notice?, on?: { ubah, status, katalog, manual, saldoAwal }, refresh?: () => Promise<data>, real }. */
  function mount(el, m) {
    M = m; elRef = el; fm = null; history = null;
    ui = Object.assign({ sheet: null, sel: 0, opt: null, pk: 'Semua', q: '', hid: 0, toast: '', added: null }, m.ui || {});
    if (m.toast) ui.toast = m.toast;
    if (ui.sheet === 'manual') A['add-manual']();
    el.innerHTML = html();
    root.HF.listen.reset(el);
    root.HF.listen.on(el, 'click', function (e) {
      var t = e.target.closest('[data-act]'); if (!t || !el.contains(t) || t.disabled) return;
      var a = t.getAttribute('data-act'), v = t.getAttribute('data-v'); if (v === null) v = t.getAttribute('data-val');
      if (!A[a]) return; A[a](v, t); if (el.querySelector('.hf-scroll')) paint();
    });
    root.HF.listen.on(el, 'input', function (e) {
      var k = e.target.getAttribute && e.target.getAttribute('data-in'); if (!k) return;
      var v = e.target.value;
      if (fm && ui.sheet === 'manual') { fm.v[k] = v; fm.error = null; paint(); return; }
      if (k === 'q') { ui.q = v; paint(); } else ui[k] = v; // nama dan harga: tidak digambar ulang supaya kursor tetap
    });
  }

  root.HF = root.HF || {};
  root.HF.kelolaScreen = { mount: mount, html: function (m) { M = m; ui = Object.assign({ sheet: null, sel: 0, opt: null, pk: 'Semua', q: '', hid: 0, toast: '', added: null }, m.ui || {}); return html(); } };
})(typeof globalThis !== 'undefined' ? globalThis : this);
