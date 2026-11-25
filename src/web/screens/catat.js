/* Catat transaksi: layar penuh di atas aplikasi. Memegang state, menghitung vm lewat HF.catat.view, menggambar lewat HF.morph
   (pembaruan di tempat: transisi chip dan animasi lembar jalan seperti di board) dan menangani klik.
   Parameter: { ctx, mulai, onClose(), onSave(rows, vm, ctx) }. Logika angka ada di engine/catat.js, bukan di sini. */
(function (root) {
  'use strict';
  var C = root.HF.catat, V = root.HF.catatView, SH = root.HF.catatSheets, S = root.HF.setupForm;

  function mount(el, o) {
    var ctx = o.ctx, mulai = o.mulai || 'beli', st = {}, fm = null, vm;
    el.innerHTML = '<div class="ct" data-theme="light">' + V.header({ title: 'Catat transaksi' }) + '<main class="hf-scroll ct-main" id="screen"></main><footer class="ct-foot"></footer><div class="ct-over"></div></div>';
    var $ = function (s) { return el.querySelector(s); }, title = $('.ct-title'), main = $('.ct-main'), foot = $('.ct-foot'), over = $('.ct-over');
    var wait = []; // simpanan ke server yang masih jalan (lokasi/aset baru): Simpan menunggu id-nya
    function seedForm() { // keadaan awal form Lokasi baru dari board (hanya data contoh)
      fm = { k: 'lokasi', mode: 'tambah', v: ctx.demo && mulai === 'lokasi-baru' ? { nama: 'Indodax', jenis: 'Exchange crypto' } : { nama: '', jenis: null }, pk: null };
    }
    function seedManual(nama) {
      fm = { k: 'aset', mode: 'tambah', v: ctx.demo && mulai === 'aset-manual' ? { nama: 'Emas perhiasan', jenis: 'Emas', sat: 'gram', harga: '1.900.000', gram: '31,1035' } : { nama: nama || '', jenis: null, sat: null, harga: '', gram: '31,1035' }, pk: null, sec: 'Kembali ke daftar' };
    }
    if (mulai === 'lokasi-baru') seedForm();
    if (mulai === 'aset-manual') seedManual();

    function draw() {
      vm = C.view(st, ctx, { mulai: mulai });
      title.textContent = vm.title;
      HF.morph(main, V.main(vm));
      HF.morph(foot, V.footer(vm));
      HF.morph(over, (vm.sheet === 'lokasi' || vm.sheet === 'manual') && fm ? S.render(fm) : SH.sheets(vm, ''));
    }
    function set(p) { st = Object.assign({}, st, p); draw(); }

    var A = {
      close: function () { o.onClose(); },
      jenis: function (v) { st = C.reduce(st, 'jenis', v); }, sub: function (v) { st = C.reduce(st, 'sub', v); },
      anggota: function (v) { st = C.reduce(st, 'anggota', v); }, aset: function (v) { st = C.reduce(st, 'aset', v); },
      lokasi: function (v) { st = C.reduce(st, 'lokasi', v); }, asal: function (v) { st = C.reduce(st, 'asal', v); },
      pay: function (v) { st = C.reduce(st, 'pay', v); }, cur: function (v) { st = C.reduce(st, 'cur', v); }, fu: function (v) { st = C.reduce(st, 'fu', v); },
      'ke-anggota': function (v) { st = C.reduce(st, 'keAnggota', v); },
      'ke-lokasi': function (v) { st = Object.assign({}, st, vm.isMoveMem ? { fKa: v } : { fK: v }); },
      'open-tgl': function () { st = Object.assign({}, st, { sheet: 'tgl' }); },
      'close-tgl': function () { st = Object.assign({}, st, { sheet: null, pv: undefined }); },
      'close-sheet': function () { st = Object.assign({}, st, { sheet: null }); },
      'set-now': function () { var n = ctx.now; st = Object.assign({}, st, { d: n.d, dm: n.m, dy: n.y, mo: 0, hh: n.hh, mm: n.mm, pv: undefined }); },
      day: function (v) { st = Object.assign({}, st, { d: +v, dm: vm.cal.m, dy: vm.cal.y, pv: undefined }); },
      bulan: function (v) { st = Object.assign({}, st, { mo: Math.min(0, (st.mo || 0) + +v) }); },
      hh: function (v) { st = Object.assign({}, st, { hh: +v }); }, mm: function (v) { st = Object.assign({}, st, { mm: +v }); },
      'open-bayar': function () { st = Object.assign({}, st, { sheet: 'bayar' }); },
      'pick-pay': function (v) { st = Object.assign({}, st, { pay: v, sheet: null, pv: undefined, kv: undefined }); },
      'reset-kv': function () { st = Object.assign({}, st, { kv: '' }); },
      'open-aset': function () { st = Object.assign({}, st, { sheet: 'aset' }); },
      cat: function (v) { st = Object.assign({}, st, { cat: v }); },
      'pick-fam': function (v) { pickAset(v, vm.fam.filter(function (x) { return x.n === v; })[0]); },
      'pick-kat': function (v) { pickAset(v, null, vm.kat.filter(function (x) { return x[0] === v; })[0]); },
      'open-lok-from': function () { seedForm(); st = Object.assign({}, st, { sheet: 'lokasi', lt: 'from' }); },
      'open-lok-to': function () { seedForm(); st = Object.assign({}, st, { sheet: 'lokasi', lt: 'to' }); },
      'add-manual': function () { seedManual(st.sq && st.sq.trim()); st = Object.assign({}, st, { sheet: 'manual' }); },
      'fm-close': function () { st = Object.assign({}, st, { sheet: null }); },
      'fm-sec': function () { st = Object.assign({}, st, { sheet: 'aset' }); },
      sel: function () { fm.pk = fm.pk === 'jenis' ? null : 'jenis'; },
      opt: function (v) { fm.v.jenis = v; fm.pk = null; if (fm.k === 'aset') fm.v.sat = null; },
      seg: function (v) { fm.v.sat = v; },
      'fm-save': function () { return fm.k === 'aset' ? saveAset() : saveLokasi(); },
      save: function () {
        if (vm.invalid) return;
        if (vm.incomplete) { st = Object.assign({}, st, { tried: true }); return; }
        Promise.all(wait).then(function () { o.onSave(HF.catatCtx.toRows(vm, ctx, { avg: st.avg, nomor: st.nota }), vm, ctx); });
      }
    };
    function saveLokasi() {
      var nama = String(fm.v.nama || '').trim(); if (!nama || !fm.v.jenis) return;
      var upd = { nl: (st.nl || []).concat([nama]), sheet: null }; if (st.lt === 'to') { if (vm.isMoveMem) upd.fKa = nama; else upd.fK = nama; } else upd.fL = nama;
      st = Object.assign({}, st, upd);
      if (o.onLokasi) wait.push(o.onLokasi(nama, fm.v.jenis).then(function (r) { if (r && r.lokasi_id) ctx.ids.lokasi[nama] = r.lokasi_id; }));
    }
    function saveAset() {
      var v = fm.v, nama = String(v.nama || '').trim(); if (!nama || !v.jenis) return;
      var units = S.MU[v.jenis], sat = units.indexOf(v.sat) >= 0 ? v.sat : units[0];
      st = Object.assign({}, st, { ext: (st.ext || []).concat([[nama, '', v.jenis, sat]]), fA: nama, fL: null, qv: undefined, sheet: null, sq: '', cat: 'Semua' });
      if (o.onAset) wait.push(o.onAset({ nama: nama, kelas: v.jenis, satuan: sat, gram_per_unit: v.gram, harga: v.harga }).then(function (r) { if (r && r.aset_id) ctx.ids.aset[nama] = r.aset_id; }));
    }
    function pickAset(name, fam, kat) {
      var cat = fam ? fam.c : kat[2], unit = fam ? fam.unit : kat[3];
      st = Object.assign({}, st, { ext: (st.ext || []).concat([[name, '', cat, unit]]), fA: name, fL: null, qv: undefined, sheet: null, sq: '', cat: 'Semua' });
    }

    el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]'); if (!t || !el.contains(t) || t.disabled) return;
      var a = t.getAttribute('data-act'), v = t.getAttribute('data-v'); if (v === null) v = t.getAttribute('data-val');
      if (!A[a]) return; A[a](v); if (a !== 'close') draw();
    });
    el.addEventListener('input', function (e) {
      var k = e.target.getAttribute && e.target.getAttribute('data-in'); if (!k) return;
      if (fm && (st.sheet === 'lokasi' || st.sheet === 'manual') && (k === 'nama' || k === 'gram' || k === 'harga')) { fm.v[k] = e.target.value; return draw(); }
      st = Object.assign({}, st, k === 'qv' ? { qv: e.target.value } : (function () { var p = {}; p[k] = e.target.value; return p; })()); draw();
    });
    draw();
    return { state: function () { return st; } };
  }

  root.HF = root.HF || {};
  root.HF.catatScreen = { mount: mount };
})(typeof globalThis !== 'undefined' ? globalThis : this);
