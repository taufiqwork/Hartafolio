/**
 * Hartafolio — data induk: anggota, lokasi, dan penanda Setup selesai.
 * Penulisan selalu lewat sini (validasi di server), tidak langsung dari layar.
 * Tidak ada hapus fisik: anggota dan lokasi dinonaktifkan (aktif = tidak).
 */

function Master_now_() { return Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm'); }

function Master_clean_(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }

function Master_sama_(a, b) { return a.toLowerCase() === b.toLowerCase(); }

function Master_dalamKunci_(fn) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(REPO_LOCK_MS);
  try { return fn(); } finally { lock.releaseLock(); }
}

/** Tambah anggota. Anggota pertama otomatis Pengelola dan hubungannya selalu "Diri sendiri". */
function apiAnggotaTambah(d) {
  return Master_dalamKunci_(function () {
    var nama = Master_clean_(d && d.nama), rows = Repo_read_('Anggota');
    if (!nama) throw new Error('Nama anggota wajib diisi.');
    if (rows.some(function (a) { return a.aktif && Master_sama_(a.nama, nama); })) throw new Error('Sudah ada anggota bernama "' + nama + '".');
    var pertama = !rows.some(function (a) { return a.is_pengelola; });
    var hub = pertama ? 'Diri sendiri' : Master_clean_(d.hubungan);
    if (!pertama && (hub === 'Diri sendiri' || HF.schema.ENUM.hubungan.indexOf(hub) < 0)) throw new Error('Pilih hubungan dengan Anda.');
    var baru = { anggota_id: HF.schema.nextId('PM', rows.map(function (a) { return a.anggota_id; })), nama: nama, hubungan: hub,
      is_pengelola: pertama, warna: '', aktif: true, dibuat_pada: Master_now_() };
    Repo_append_('Anggota', [baru]);
    return baru;
  });
}

/** Ubah nama atau hubungan. Pengelola tetap "Diri sendiri". Mengembalikan baris terbaru. */
function apiAnggotaUbah(id, patch) {
  return Master_dalamKunci_(function () {
    var rows = Repo_read_('Anggota'), cur = rows.filter(function (a) { return a.anggota_id === id; })[0];
    if (!cur) throw new Error('Anggota tidak ditemukan.');
    var p = {}, nama = patch && patch.nama != null ? Master_clean_(patch.nama) : cur.nama;
    if (!nama) throw new Error('Nama anggota wajib diisi.');
    if (rows.some(function (a) { return a.aktif && a.anggota_id !== id && Master_sama_(a.nama, nama); })) throw new Error('Sudah ada anggota bernama "' + nama + '".');
    p.nama = nama;
    if (!cur.is_pengelola && patch && patch.hubungan != null) {
      var hub = Master_clean_(patch.hubungan);
      if (hub === 'Diri sendiri' || HF.schema.ENUM.hubungan.indexOf(hub) < 0) throw new Error('Hubungan tidak dikenal.');
      p.hubungan = hub;
    }
    Repo_update_('Anggota', id, p);
    return Repo_read_('Anggota').filter(function (a) { return a.anggota_id === id; })[0];
  });
}

function apiLokasiTambah(d) {
  return Master_dalamKunci_(function () {
    var nama = Master_clean_(d && d.nama), jenis = Master_clean_(d && d.jenis), rows = Repo_read_('Lokasi');
    if (!nama) throw new Error('Nama lokasi wajib diisi.');
    if (HF.schema.ENUM.lokasiJenis.indexOf(jenis) < 0) throw new Error('Pilih jenis lokasi.');
    if (rows.some(function (a) { return a.aktif && Master_sama_(a.nama, nama); })) throw new Error('Sudah ada lokasi bernama "' + nama + '".');
    var baru = { lokasi_id: HF.schema.nextId('LK', rows.map(function (a) { return a.lokasi_id; })), nama: nama, jenis: jenis, aktif: true, dibuat_pada: Master_now_() };
    Repo_append_('Lokasi', [baru]);
    return baru;
  });
}

function apiLokasiUbah(id, patch) {
  return Master_dalamKunci_(function () {
    var rows = Repo_read_('Lokasi'), cur = rows.filter(function (a) { return a.lokasi_id === id; })[0];
    if (!cur) throw new Error('Lokasi tidak ditemukan.');
    var nama = patch && patch.nama != null ? Master_clean_(patch.nama) : cur.nama;
    var jenis = patch && patch.jenis != null ? Master_clean_(patch.jenis) : cur.jenis;
    if (!nama) throw new Error('Nama lokasi wajib diisi.');
    if (HF.schema.ENUM.lokasiJenis.indexOf(jenis) < 0) throw new Error('Jenis lokasi tidak dikenal.');
    if (rows.some(function (a) { return a.aktif && a.lokasi_id !== id && Master_sama_(a.nama, nama); })) throw new Error('Sudah ada lokasi bernama "' + nama + '".');
    Repo_update_('Lokasi', id, { nama: nama, jenis: jenis });
    return Repo_read_('Lokasi').filter(function (a) { return a.lokasi_id === id; })[0];
  });
}

/** Tandai Setup selesai (kunci setup_selesai di tab Pengaturan). Aman dipanggil berulang. */
function apiSetupSelesai() {
  return Master_dalamKunci_(function () {
    if (Repo_read_('Anggota').filter(function (a) { return a.aktif; }).length < 1) throw new Error('Tambah minimal 1 anggota.');
    if (Repo_read_('Lokasi').filter(function (a) { return a.aktif; }).length < 1) throw new Error('Tambah minimal 1 lokasi.');
    if (!Repo_update_('Pengaturan', 'setup_selesai', { nilai: 'ya' }))
      Repo_append_('Pengaturan', [{ kunci: 'setup_selesai', nilai: 'ya', keterangan: 'Setup awal sudah selesai' }]);
    return true;
  });
}

/** Hapus = aktif "tidak" (baris tidak dihapus fisik). Ditolak untuk Pengelola dan untuk yang sudah dipakai transaksi. */
function apiAnggotaHapus(id) {
  return Master_dalamKunci_(function () {
    var cur = Repo_read_('Anggota').filter(function (a) { return a.anggota_id === id; })[0];
    if (!cur) throw new Error('Anggota tidak ditemukan.');
    if (cur.is_pengelola) throw new Error('Pengelola tidak bisa dihapus.');
    var dipakai = Repo_read_('Transaksi').some(function (t) { return t.anggota_id === id || t.anggota_tujuan_id === id; });
    if (dipakai) throw new Error(cur.nama + ' masih punya catatan. Pindahkan asetnya lebih dulu.');
    Repo_update_('Anggota', id, { aktif: false });
    return true;
  });
}

function apiLokasiHapus(id) {
  return Master_dalamKunci_(function () {
    var cur = Repo_read_('Lokasi').filter(function (a) { return a.lokasi_id === id; })[0];
    if (!cur) throw new Error('Lokasi tidak ditemukan.');
    var dipakai = Repo_read_('Transaksi').some(function (t) { return t.lokasi_id === id || t.lokasi_tujuan_id === id; });
    if (dipakai) throw new Error(cur.nama + ' masih dipakai catatan. Pindahkan asetnya lebih dulu.');
    Repo_update_('Lokasi', id, { aktif: false });
    return true;
  });
}

/** Data ringan untuk membuka aplikasi (3 tab, bukan 9): penanda Setup, anggota, lokasi. apiState lengkap dipakai layar yang butuh semuanya. */
function apiBootState() {
  return { pengaturan: Repo_settings_(), anggota: Repo_read_('Anggota'), lokasi: Repo_read_('Lokasi') };
}

/**
 * Aset buatan sendiri (form "Aset manual" di Catat). Harga diisi pengelola; sumber "manual". Satuan Emas/Perak bukan gram wajib
 * punya gram_per_unit (untuk nishob). Tidak ada hapus fisik; nama ganda ditolak.
 */
function apiAsetTambah(d) {
  return Master_dalamKunci_(function () {
    var nama = Master_clean_(d && d.nama), kelas = Master_clean_(d && d.kelas), satuan = Master_clean_(d && d.satuan), rows = Repo_read_('Aset');
    if (!nama) throw new Error('Nama aset wajib diisi.');
    if (HF.schema.ENUM.kelas.indexOf(kelas) < 0) throw new Error('Pilih jenis aset.');
    if (!satuan) throw new Error('Pilih satuan.');
    if (rows.some(function (a) { return a.status !== 'dihapus' && Master_sama_(a.nama, nama); })) throw new Error('Sudah ada aset bernama "' + nama + '".');
    var zakat = kelas === 'Emas' || kelas === 'Perak', gram = satuan === 'gram' ? 1 : Number(String(d.gram_per_unit == null ? '' : d.gram_per_unit).replace(',', '.'));
    if (zakat && !(gram > 0)) throw new Error('Isi setara gram per satuan.');
    var harga = Number(String(d.harga == null ? '' : d.harga).replace(/\./g, '').replace(',', '.')) || 0, now = Master_now_();
    var baru = { aset_id: HF.schema.nextId('AS', rows.map(function (a) { return a.aset_id; })), simbol: nama, nama: nama, kelas: kelas,
      bentuk: kelas === 'Crypto' || kelas === 'Saham' || kelas === 'Reksa dana' || kelas === 'Mata uang' ? 'Digital' : 'Fisik', satuan: satuan, gram_per_unit: zakat ? gram : null,
      mata_uang_harga: 'IDR', sumber_harga: 'manual', kode_sumber: '', kunci_manual: true, kategori_zakat: HF.catalog.zakatKategori({ kelas: kelas }), status: 'aktif', dibuat_pada: now };
    Repo_append_('Aset', [baru]);
    if (harga > 0) Repo_append_('Harga', [{ waktu: now, aset_id: baru.aset_id, harga: harga, mata_uang: 'IDR', sumber: 'manual', status: 'manual' }]);
    return baru;
  });
}
