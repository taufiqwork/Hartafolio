/**
 * Hartafolio — Kelola aset: ubah nama dan sumber harga, simpan harga manual, tambah dari katalog, sembunyikan, tampilkan, hapus.
 * Aturan satu sumber di src/engine/kelola.js (cekStatus, mataManual, namaSimpan). Tidak ada hapus fisik: "hapus" mengubah status
 * menjadi dihapus; aset yang sama bisa ditambahkan lagi dari katalog (barisnya dihidupkan, bukan dibuat ganda).
 * Harga manual masuk tab Harga sebagai baris berstatus manual; kolom kunci_manual menandai aset yang tidak diambil otomatis.
 */

function AsetKelola_cari_(id) {
  var a = Repo_read_('Aset').filter(function (x) { return x.aset_id === id; })[0];
  if (!a) throw new Error('Aset tidak ditemukan.');
  return a;
}

function AsetKelola_label_(a) { return HF.kelola.lab(a); }

/** Fakta saldo dan riwayat satu aset, dari Sheet. */
function AsetKelola_fakta_(id) {
  var st = HF.kelola.stats({ transaksi: Repo_read_('Transaksi'), piutang: Repo_read_('Piutang') });
  return { a: id, own: !!st.held[id], n: st.jml[id] || 0 };
}

function AsetKelola_segarkanHarga_() {
  try { Harga_perbarui_(); } catch (e) { /* izin atau jaringan: harga ikut jadwal berikutnya */ }
}

/** d = { nama, otomatis: bool, harga: teks angka gaya Indonesia (kosong = pakai harga yang sudah ada) }. */
function apiAsetUbah(id, d) {
  var perluSegar = false, hasil = Master_dalamKunci_(function () {
    var a = AsetKelola_cari_(id), K = HF.kelola;
    if (a.status !== 'aktif') throw new Error(AsetKelola_label_(a) + ' tidak ada di daftar.');
    var nama = Master_clean_(d && d.nama), otomatis = !!(d && d.otomatis);
    if (!nama) throw new Error('Nama aset wajib diisi.');
    if (otomatis && (!K.canAuto(a) || a.sumber_harga === 'tetap')) throw new Error('Aset ini tidak punya sumber harga otomatis.');
    var simpan = K.namaSimpan({ id: a.aset_id, a: AsetKelola_label_(a), nama: a.nama }, nama);
    var lain = Repo_read_('Aset').filter(function (x) { return x.aset_id !== id && x.status !== 'dihapus'; });
    if (lain.some(function (x) { return Master_sama_(AsetKelola_label_(x), nama) || Master_sama_(x.nama, simpan); })) throw new Error('Sudah ada aset bernama "' + nama + '".');
    var patch = {}, harga = K.num(d && d.harga);
    if (simpan !== a.nama) { patch.nama = simpan; if (a.bentuk !== 'Fisik' && a.sumber_harga !== 'manual') patch.simbol = simpan; }
    if (otomatis) {
      if (a.kunci_manual) { patch.kunci_manual = false; perluSegar = true; }
    } else {
      patch.kunci_manual = true;
      var ada = Repo_prices_().terakhir[id];
      if (!(harga > 0) && !(ada && ada.harga > 0)) throw new Error('Isi harga per ' + a.satuan + '.');
      if (harga > 0) Repo_append_('Harga', [{ waktu: Master_now_(), aset_id: id, harga: harga, mata_uang: K.mataManual(a), sumber: 'manual', status: 'manual' }]);
    }
    if (Object.keys(patch).length) Repo_update_('Aset', id, patch);
    return AsetKelola_cari_(id);
  });
  if (perluSegar) AsetKelola_segarkanHarga_();
  return hasil;
}

/** aksi: 'sembunyikan' | 'tampilkan' | 'hapus'. Saldo dan riwayat dihitung ulang di server. */
function apiAsetStatus(id, aksi) {
  return Master_dalamKunci_(function () {
    if (['sembunyikan', 'tampilkan', 'hapus'].indexOf(aksi) < 0) throw new Error('Aksi tidak dikenal.');
    var a = AsetKelola_cari_(id), f = AsetKelola_fakta_(id);
    f.a = AsetKelola_label_(a);
    var galat = HF.kelola.cekStatus(f, a.status, aksi);
    if (galat) throw new Error(galat);
    Repo_update_('Aset', id, { status: aksi === 'tampilkan' ? 'aktif' : (aksi === 'sembunyikan' ? 'tersembunyi' : 'dihapus') });
    return AsetKelola_cari_(id);
  });
}

/** Tambah aset dari katalog harga otomatis. Baris lama (dihapus atau tersembunyi) dihidupkan lagi. */
function apiAsetKatalogTambah(id) {
  var hasil = Master_dalamKunci_(function () {
    var c = HF.catalog.katalog().filter(function (x) { return x.aset_id === id; })[0];
    if (!c) throw new Error('Aset tidak ada di katalog.');
    var ada = Repo_read_('Aset').filter(function (x) { return x.aset_id === id; })[0];
    if (ada && ada.status === 'aktif') throw new Error(c.simbol + ' sudah ada di daftar.');
    if (ada) { Repo_update_('Aset', id, { status: 'aktif', kunci_manual: false }); return AsetKelola_cari_(id); }
    c.dibuat_pada = Master_now_();
    Repo_append_('Aset', [c]);
    return c;
  });
  AsetKelola_segarkanHarga_();
  return hasil;
}
