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

/**
 * Jenis aset dan setara gram (hanya token CoinGecko): Crypto, Emas, Perak. Jenis berubah: kategori zakat lama disimpan dan jenis_berlaku = hari ini,
 * sehingga hitungan zakat sebelum hari ini memakai kategori lama dan yang sesudahnya yang baru (zakat yang sudah dibayar tidak disentuh).
 */
function AsetKelola_jenis_(a, d, patch) {
  if (!d || (d.kelas === undefined && d.gram === undefined)) return;
  if (a.sumber_harga !== 'coingecko') throw new Error('Jenis hanya bisa diubah untuk token crypto.');
  var kelas = d.kelas === undefined ? a.kelas : Master_clean_(d.kelas), gram = HF.kelola.num(d.gram), logam = kelas === 'Emas' || kelas === 'Perak';
  if (['Crypto', 'Emas', 'Perak'].indexOf(kelas) < 0) throw new Error('Pilih Crypto, Emas, atau Perak.');
  if (logam && !(gram > 0) && !(a.gram_per_unit > 0)) throw new Error('Isi setara gram per token.');
  if (logam && gram > 0 && gram !== Number(a.gram_per_unit)) patch.gram_per_unit = gram;
  if (kelas !== a.kelas) {
    var lama = a.kategori_zakat || HF.catalog.zakatKategori(a), baru = HF.catalog.zakatKategori({ kelas: kelas });
    patch.kelas = kelas; patch.kategori_zakat = baru;
    if (lama !== baru) { patch.kategori_zakat_lama = lama; patch.jenis_berlaku = Master_now_().slice(0, 10); }
  }
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
    AsetKelola_jenis_(a, d, patch);
    if (simpan !== a.nama) { patch.nama = simpan; if (a.bentuk !== 'Fisik' && a.sumber_harga !== 'manual') patch.simbol = simpan; }
    if (otomatis) {
      if (a.kunci_manual) { patch.kunci_manual = false; perluSegar = true; }
    } else {
      patch.kunci_manual = true;
      var ada = Repo_prices_().terakhir[id];
      if (!(harga > 0) && !(ada && ada.harga > 0)) throw new Error('Isi harga per ' + a.satuan + '.');
      if (harga > 0) {
        var w = Master_now_(), baris = [{ waktu: w, aset_id: id, harga: harga, mata_uang: K.mataManual(a), sumber: 'manual', status: 'manual' }];
        // Dolar AS: kurs yang dipakai seluruh aplikasi dibaca dari seri USDIDR, jadi harga manual ikut ditulis di sana.
        if (a.sumber_harga === 'kurs' && (a.kode_sumber || 'USD') === 'USD') baris.push({ waktu: w, aset_id: HF.catalog.KURS_ID, harga: harga, mata_uang: 'IDR', sumber: 'manual', status: 'manual' });
        Repo_append_('Harga', baris);
      }
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

/** Cari saham di Yahoo (BEI dan bursa Amerika). Dijalankan di server karena Yahoo tidak mengizinkan panggilan dari browser. */
function apiAsetCari(tipe, q) {
  var s = Master_clean_(q);
  if (tipe !== 'saham') throw new Error('Pencarian ini belum tersedia.');
  if (s.length < 2) return [];
  var res = UrlFetchApp.fetch(HF.populer.URL.cariSaham(s), { muteHttpExceptions: true, headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } });
  if (res.getResponseCode() !== 200) throw new Error('Pencarian belum tersambung ke sumber harga.');
  var hasil = HF.populer.parse.yahooCari(res.getContentText());
  if (hasil === null) throw new Error('Pencarian belum tersambung ke sumber harga.');
  var ada = HF.populer.fromAset(Repo_read_('Aset'));
  return hasil.filter(function (i) { var p = i.key.split(':'); return !(ada[p[0]] && ada[p[0]][p.slice(1).join(':')]); });
}

/**
 * Tambah aset dari daftar populer atau hasil pencarian (pilih = { key, n, f }). Baris lama dengan sumber yang sama (disembunyikan atau dihapus)
 * dihidupkan lagi, bukan dibuat ganda. Aset baru ditambahkan hanya bila hargamu bisa diambil dari sumbernya sekarang; kalau tidak, ditolak.
 */
function apiAsetCariTambah(pilih) {
  var P = HF.populer, kunciBaru = String(pilih && pilih.key || '');
  var semua = Repo_read_('Aset'), ada = semua.filter(function (x) { return kunciBaru && P.kunci(x) === kunciBaru; })[0];
  if (ada && ada.status === 'aktif') throw new Error(ada.simbol + ' sudah ada di daftar.');
  if (ada) {
    var hasilLama = Master_dalamKunci_(function () { Repo_update_('Aset', ada.aset_id, { status: 'aktif', kunci_manual: false }); return AsetKelola_cari_(ada.aset_id); });
    AsetKelola_segarkanHarga_();
    return hasilLama;
  }
  var baris = P.jadiAset(pilih);
  if (!baris) throw new Error('Aset tidak dikenal.');
  if (semua.some(function (x) { return x.status !== 'dihapus' && (Master_sama_(x.simbol, baris.simbol) || Master_sama_(x.nama, baris.nama)); })) throw new Error('Sudah ada aset bernama "' + baris.nama + '".');
  var kat = HF.catalog.katalog().filter(function (c) { return P.kunci(c) === kunciBaru; })[0]; // mis. BNB: memakai id katalognya
  var id = kat ? kat.aset_id : HF.schema.nextId('AS', semua.map(function (x) { return x.aset_id; }));
  baris.aset_id = id;
  var coba = Harga_hitung_([baris], Repo_prices_().terakhir), ok = coba.semua.filter(function (r) { return r.aset_id === id && r.status === 'ok'; });
  if (!ok.length) throw new Error('Harga ' + baris.simbol + ' belum bisa diambil dari sumbernya, jadi belum ditambahkan. Coba lagi nanti.');
  return Master_dalamKunci_(function () {
    baris.dibuat_pada = Master_now_();
    Repo_append_('Aset', [baris]);
    Repo_append_('Harga', ok);
    return baris;
  });
}
