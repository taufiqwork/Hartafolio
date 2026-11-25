# Percobaan E0: halaman biasa + Apps Script API (hibrida)

Bukan produk. Menjawab: bisakah sebuah halaman biasa (bisa di hosting gratis) (1) menampilkan tombol "Masuk dengan akun Google" seperti desain, (2) memanggil Apps Script yang berjalan SEBAGAI pengguna, dan (3) memasang tugas terjadwal di akun pengguna itu sehingga harga otomatis, snapshot, dan pengingat tetap bisa jalan tanpa server?

- Skrip: proyek `prototype/c0` (Code.js: apiMulai, apiTulis, apiPasangTugas, apiHentikanTugas, tugasUji, apiBaris). Manifest: `executionApi.access = ANYONE`, izin spreadsheets, userinfo.email, script.scriptapp.
- Halaman: `prototype/e0/index.html` (satu berkas). Jalankan lokal: `python3 -m http.server 8080 -d prototype/e0`, buka http://localhost:8080.

## Yang harus disiapkan sekali (Google Cloud Console, akun pengembang)
1. Buat proyek Cloud standar; catat NOMOR proyek.
2. Di proyek itu: nyalakan "Apps Script API". Atur layar izin OAuth (Eksternal, nama Hartafolio, email dukungan, tambahkan izin spreadsheets, userinfo.email, script.scriptapp; status Produksi tanpa verifikasi atau Pengujian dengan akun uji).
3. Buat ID klien OAuth jenis "Aplikasi web", asal JavaScript resmi: `http://localhost:8080` (dan alamat hosting nanti).
4. Di editor Apps Script proyek "Hartafolio C0 (percobaan)": Pengaturan proyek > Proyek Google Cloud Platform > Ubah proyek > tempel NOMOR proyek.
5. Deploy: Deploy > Deployment baru > pilih jenis "API Executable" (akses: siapa saja), atau jalankan `clasp deploy` dari `prototype/c0` bila manifest sudah dibaca.

## Protokol uji
1. Isi ID klien dan ID skrip, tekan Masuk dengan akun Google: layar izin muncul dari tombol di halaman (bukan sebelum halaman). Catat tiap layar.
2. Mulai: Sheet dibuat di Drive akun itu. Tulis baris uji. Lihat baris.
3. Pasang tugas terjadwal. TUTUP halaman. Tunggu 3 menit. Buka lagi, Lihat baris: harus ada baris "tugas terjadwal" yang bertambah sendiri.
4. Ulangi di browser biasa yang sudah login ke beberapa akun Google, dan di HP.
5. Catat: waktu tiap panggilan, apa yang terjadi saat token habis (±1 jam), dan galat apa pun.
