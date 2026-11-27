/* Catat transaksi: layar penuh di atas aplikasi. Memegang state, menghitung vm lewat HF.catat.view, menggambar lewat HF.morph
   (pembaruan di tempat: transisi chip dan animasi lembar jalan seperti di board) dan menangani klik.
   Parameter: { ctx, mulai, onClose(), onSave(rows, vm, ctx) }. Logika angka ada di engine/catat.js, bukan di sini. */
(function (root) {
  'use strict';
  var C = root.HF.catat, V = root.HF.catatView, SH = root.HF.catatSheets, S = root.HF.setupForm;

  function mount(el, o) {
    var ctx = o.ctx, mulai = o.mulai || 'beli', st = {}, fm = null, vm;
    var ANGKA_DEMO = { 'angka-format': { qv: '1.250', pv: '72.658.500', fee: '16.500' }, 'angka-titik': { qv: '0.0225' }, 'angka-inggris': { pv: '1,234.56' }, 'angka-koma': { qv: '1,2,3' } };
    if (ctx.demo && ANGKA_DEMO[mulai]) st = ANGKA_DEMO[mulai];
    if (ctx.demo && mulai === 'belum-lengkap') st = { tried: true, qv: '', pv: '' };
    if (ctx.demo && mulai === 'foto-kamera') st = { kamera: true };
    if (ctx.demo && mulai === 'foto-terlampir') st = { foto: { ok: true, nama: 'nota-binance.jpg', kb: 184 } };
    if (ctx.demo && mulai === 'foto-gagal') st = { foto: { ok: false } };
    if (ctx.demo && (mulai === 'pajak-catatan' || mulai === 'pajak-terisi')) st = mulai === 'pajak-terisi' ? { pajakOn: true, pajakV: '0,05', catatanV: 'Beli saat harga turun, sesuai rencana bulanan.' } : { pajakOn: true };
    el.innerHTML = '<div class="ct" data-theme="light">' + V.header({ title: 'Catat transaksi' }) + '<main class="hf-scroll ct-main" id="screen"></main><footer class="ct-foot"></footer><div class="ct-over"></div></div>';
    var $ = function (s) { return el.querySelector(s); }, title = $('.ct-title'), main = $('.ct-main'), foot = $('.ct-foot'), over = $('.ct-over');
    var stream = null; // aliran kamera yang sedang terbuka
    var photo = null; // foto terpilih (berisi base64) untuk diunggah sesudah simpan
    var wait = []; // simpanan ke server yang masih jalan (lokasi/aset baru): Simpan menunggu id-nya
    function seedForm() { // keadaan awal form Lokasi baru dari board (hanya data contoh)
      fm = { k: 'lokasi', mode: 'tambah', v: ctx.demo && mulai === 'lokasi-baru' ? { nama: 'Indodax', jenis: 'Exchange crypto' } : { nama: '', jenis: null }, pk: null };
    }
    function seedManual(nama) {
      fm = { k: 'aset', mode: 'tambah', v: ctx.demo && mulai === 'aset-manual-angka' ? { nama: 'Emas perhiasan', jenis: 'Emas', sat: 'oz', harga: '1.900.000', gram: '31.1035' } : ctx.demo && mulai === 'aset-manual' ? { nama: 'Emas perhiasan', jenis: 'Emas', sat: 'gram', harga: '1.900.000', gram: '31,1035' } : { nama: nama || '', jenis: null, sat: null, harga: '', gram: '31,1035' }, pk: null, sec: 'Kembali ke daftar' };
    }
    if (mulai === 'lokasi-baru') seedForm();
    if (mulai === 'aset-manual' || mulai === 'aset-manual-angka') seedManual();

    function draw() {
      vm = C.view(st, ctx, { mulai: mulai });
      title.textContent = vm.title;
      HF.morph(main, V.main(vm));
      HF.morph(foot, V.footer(vm));
      HF.morph(over, st.kamera ? SH.kamera(!!stream) : ((vm.sheet === 'lokasi' || vm.sheet === 'manual') && fm ? S.render(fm) : SH.sheets(vm, '')));
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
      'open-foto': function () { st = Object.assign({}, st, { sheet: 'foto' }); },
      'del-foto': function () { photo = null; st = Object.assign({}, st, { foto: null }); },
      'pick-cam': function () { bukaKamera(); }, 'pick-gal': function () { pickFoto(false); },
      'close-kam': function () { tutupKamera(); },
      shutter: function () { var v = el.querySelector('.ct-cam-video'); if (!v) return tutupKamera(); HF.foto.jepret(v).then(function (r) { hasilFoto(r); }); tutupKamera(); },
      'fix-num': function (v, t) { var k = t.getAttribute('data-f'), g = HF.angka.analisis(st[k]).galat; if (g && g.perbaiki) { var p = {}; p[k] = HF.angka.analisis(g.perbaiki).teks; st = Object.assign({}, st, p); } },
      'toggle-pajak': function () { var buka = !st.pajakOn; st = Object.assign({}, st, { pajakOn: buka }); if (buka) setTimeout(function () { main.scrollTo({ top: main.scrollHeight, behavior: 'smooth' }); }, 60); },
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
      'fix-fm': function (v, t) { var k = t.getAttribute('data-f'), g = HF.angka.analisis(fm.v[k]).galat; if (g && g.perbaiki) { fm.v[k] = HF.angka.analisis(g.perbaiki).teks; if (fm.raw) fm.raw[k] = false; } },
      'fm-save': function () { return fm.k === 'aset' ? saveAset() : saveLokasi(); },
      save: function () {
        if (vm.invalid) return;
        if (vm.incomplete) { st = Object.assign({}, st, { tried: true }); return; }
        Promise.all(wait).then(function () { o.onSave(HF.catatCtx.toRows(vm, ctx, { avg: st.avg, nomor: st.nota, pajak: st.pajakV, catatan: st.catatanV }), vm, ctx, photo); });
      }
    };
    function tutupKamera() { HF.foto.berhenti(stream); stream = null; st = Object.assign({}, st, { kamera: false }); }
    function hasilFoto(r) {
      if (r.ok) { photo = r; st = Object.assign({}, st, { sheet: null, foto: { ok: true, nama: r.nama, kb: r.kb, thumb: 'data:image/jpeg;base64,' + r.base64 } }); }
      else { photo = null; st = Object.assign({}, st, { sheet: null, foto: { ok: false } }); }
      draw();
    }
    /* Ambil foto: di HP memakai kamera bawaan lewat atribut capture; di komputer membuka kamera sendiri. Gagal (izin ditolak, tidak ada kamera) = pemilih berkas. */
    function bukaKamera() {
      if (HF.foto.sentuh() || !HF.foto.bisaKamera()) return pickFoto(true);
      HF.foto.mulaiKamera().then(function (s) {
        stream = s; st = Object.assign({}, st, { sheet: null, kamera: true }); draw();
        var v = el.querySelector('.ct-cam-video'); if (v) v.srcObject = s;
      }).catch(function () { pickFoto(false); });
    }
    function pickFoto(kamera) {
      HF.foto.pilih(kamera, hasilFoto);
    }
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

    root.HF.listen.on(el, 'click', function (e) {
      var t = e.target.closest('[data-act]'); if (!t || !el.contains(t) || t.disabled) return;
      var a = t.getAttribute('data-act'), v = t.getAttribute('data-v'); if (v === null) v = t.getAttribute('data-val');
      if (!A[a]) return; A[a](v, t); if (a !== 'close') draw();
    });
    var ANGKA = { qv: 1, pv: 1, fee: 1, kv: 1, pajakV: 1, avg: 1 }; // kolom angka: titik ribuan disisipkan saat diketik
    root.HF.listen.on(el, 'input', function (e) {
      var k = e.target.getAttribute && e.target.getAttribute('data-in'); if (!k) return;
      if (fm && (st.sheet === 'lokasi' || st.sheet === 'manual') && (k === 'nama' || k === 'gram' || k === 'harga')) {
        var v0 = e.target.value;
        if (k !== 'nama') { // kolom angka di form Aset manual: titik ribuan otomatis, sama dengan kolom lain
          var tp = e.inputType || '', ok0 = !HF.angka.analisis(fm.v[k] || '').galat, rw = fm.raw && fm.raw[k];
          var an = HF.angka.analisis(ok0 && !rw && ((tp === 'insertText' && e.data !== '.') || /^delete/.test(tp)) ? v0.replace(/\./g, '') : v0);
          if (!an.galat || an.galat.jenis === 'karakter') { var ps = HF.angka.kursor(v0, e.target.selectionStart == null ? v0.length : e.target.selectionStart, an.teks); if (an.teks !== v0) { e.target.value = an.teks; if (e.target.setSelectionRange) e.target.setSelectionRange(ps, ps); } v0 = an.teks; }
          fm.raw = fm.raw || {}; fm.raw[k] = e.data === '.' ? true : (/\.$/.test(v0) ? !!fm.raw[k] : (an.galat && an.galat.jenis !== 'karakter' ? !!fm.raw[k] : false));
        }
        fm.v[k] = v0; return draw();
      }
      var nilai = e.target.value;
      if (ANGKA[k]) {
        /* Titik yang kita sisipkan sendiri bukan ketikan pengguna: bila sebelumnya valid dan yang diketik angka (atau menghapus), buang dulu titiknya
           lalu rapikan lagi. Titik yang diketik sendiri, atau tempelan, dianalisis apa adanya (supaya "0.0225" terdeteksi). */
        var tipe = e.inputType || '', wasOk = !HF.angka.analisis(st[k] || '').galat;
        var raw = st.nRaw || {}, ulang = wasOk && !raw[k] && ((tipe === 'insertText' && e.data !== '.') || /^delete/.test(tipe));
        var a = HF.angka.analisis(ulang ? nilai.replace(/\./g, '') : nilai);
        if (!a.galat || a.galat.jenis === 'karakter') { // valid: rapikan dengan titik ribuan dan jaga posisi kursor
          var pos = HF.angka.kursor(nilai, e.target.selectionStart == null ? nilai.length : e.target.selectionStart, a.teks);
          if (a.teks !== nilai) { e.target.value = a.teks; if (e.target.setSelectionRange) e.target.setSelectionRange(pos, pos); }
          nilai = a.teks;
        }
      }
      var p = {}; p[k] = nilai;
      if (ANGKA[k]) { // ingat bila titik diketik pengguna (bukan sisipan kita) selama kolom itu masih mentah
        var r2 = Object.assign({}, st.nRaw || {}), ga = HF.angka.analisis(nilai).galat;
        r2[k] = e.data === '.' ? true : (/\.$/.test(nilai) ? !!r2[k] : (ga && ga.jenis !== 'karakter' ? !!r2[k] : false));
        p.nRaw = r2;
      }
      st = Object.assign({}, st, p); draw();
    });
    root.HF.listen.on(el, 'focusout', function (e) { // yang masih ragu ditandai setelah kolom ditinggalkan
      var k = e.target.getAttribute && e.target.getAttribute('data-in');
      if (k && ANGKA[k] && !(st.nBlur || {})[k]) { var b = Object.assign({}, st.nBlur || {}); b[k] = true; st = Object.assign({}, st, { nBlur: b }); draw(); }
    });
    draw();
    return { state: function () { return st; } };
  }

  root.HF = root.HF || {};
  root.HF.catatScreen = { mount: mount };
})(typeof globalThis !== 'undefined' ? globalThis : this);
