# Panduan Hartafolio untuk keluarga

> **Status draf (27 Nov 2026).** Langkah di bawah mengikuti aplikasi seperti yang ada sekarang. Belum diuji dari awal di akun Google yang baru. Tulisan di dalam tanda kurung siku `[...]` diisi Ticon sebelum panduan dikirim. Nama tombol Google bisa sedikit berbeda menurut bahasa akun Anda.

Hartafolio mencatat emas, perak, crypto, saham, dan uang keluarga Anda di satu tempat. Datanya disimpan di Google Sheet milik Anda sendiri. Tidak ada orang lain yang bisa membukanya, termasuk pembuat aplikasi.

---

## Bagian 1. Pasang sekali (sekitar 15 menit)

Anda perlu satu akun Google dan komputer untuk langkah 1 sampai 4. Sesudah itu, semuanya bisa dari HP.

**1. Buat salinan Sheet**
1. Buka tautan ini: `[TAUTAN BUAT SALINAN dari Ticon]`.
2. Klik **Buat salinan**. Sheet bernama "Hartafolio" muncul di Google Drive Anda.

**2. Siapkan Sheet**
1. Di Sheet itu, klik menu **Hartafolio › Siapkan sheet**.
2. Google akan meminta izin. Pilih akun Anda, lalu **Lanjutkan** dan **Izinkan**. Bila muncul peringatan "Google belum memverifikasi aplikasi ini", klik **Lanjutan**, lalu **Buka Hartafolio (tidak aman)**. Ini normal untuk aplikasi pribadi yang belum didaftarkan ke Google.
3. Tunggu sampai muncul pesan bahwa tab sudah dibuat.

**3. Terbitkan aplikasi web**
1. Klik **Ekstensi › Apps Script**.
2. Klik **Deploy › Deployment baru**. Pilih jenis **Aplikasi web**.
3. Isi: **Jalankan sebagai: Saya**. **Siapa yang memiliki akses: Hanya saya**.
4. Klik **Deploy**, lalu salin **URL aplikasi web** (berakhiran `/exec`). Simpan URL itu di catatan atau kirim ke diri sendiri.

**4. Buka dan isi Setup**
1. Buka URL tadi. Aplikasi menampilkan empat langkah: Akun, Anggota, Lokasi, Import.
2. Isi nama anggota keluarga dan tempat menyimpan aset (misalnya Brankas, Binance, Bank). Anggota dan lokasi bisa ditambah lagi kapan saja.

**5. Taruh di layar HP**
1. Buka URL yang sama di Chrome pada HP.
2. Ketuk menu titik tiga, lalu **Tambahkan ke layar utama**. Sekarang Hartafolio muncul seperti aplikasi.

**6. Nyalakan cadangan mingguan**
1. Di Sheet, klik **Hartafolio › Nyalakan cadangan mingguan**.
2. Google meminta satu izin tambahan (menjalankan jadwal otomatis). Setujui.
3. Cadangan pertama dibuat saat itu juga.

---

## Bagian 2. Dipakai sehari-hari

- **Catat transaksi:** ketuk tombol **+** di tengah. Pilih jenis (Beli, Jual, Masuk, Keluar, Pindah), isi jumlah dan harga, lalu **Simpan transaksi**.
- **Riwayat:** semua transaksi per hari. Ketuk satu baris untuk melihat rincian, **Ubah**, atau **Hapus**.
- **Salah catat?** Ubah angkanya, atau Hapus. Yang dihapus tidak hilang: buka **Terhapus** di atas daftar lalu ketuk **Pulihkan**.
- **Aturan saldo:** Hartafolio menolak ubahan atau hapus yang membuat transaksi sesudahnya kekurangan saldo. Contoh: Anda membeli 1 gram lalu menjualnya. Menghapus pembelian itu ditolak, karena penjualan tadi jadi tidak punya barang. Hapus atau ubah penjualannya dulu.
- **Foto nota:** di layar Catat, ketuk **Lampirkan foto**. Foto disimpan di Google Drive Anda (folder "Hartafolio Bukti"), dan tautannya muncul di kolom `bukti` pada Sheet. Foto pertama membuat Google meminta izin sekali.
- **Jangan ubah Sheet langsung** kecuali Anda paham kolomnya. Header baris pertama dikunci. Bila struktur tab rusak, menu **Hartafolio › Periksa struktur** dan **Perbaiki header** membantu.

---

## Bagian 3. Cadangan

- Setiap Minggu sekitar pukul 03.00, seluruh Sheet disalin ke folder **Hartafolio Cadangan** di Drive Anda, dengan nama "Hartafolio cadangan 2026-11-29". Delapan salinan terakhir disimpan, yang lebih lama dibuang otomatis.
- **Cadangkan sekarang:** menu **Hartafolio › Cadangkan sekarang**.
- **Matikan:** menu **Hartafolio › Matikan cadangan mingguan**.
- Tanggal cadangan terakhir dan galatnya (bila ada) tercatat di tab **Pengaturan**, baris `cadangan_terakhir`.
- **Mengembalikan data:** buka salinan cadangan yang Anda inginkan, lalu pakai File › Buat salinan, atau salin isi tab **Transaksi** dari cadangan ke Sheet utama. Bila ragu, hubungi Ticon sebelum menimpa apa pun.

---

## Bagian 4. Izin yang diminta Google, dan artinya

| Izin | Untuk apa |
|---|---|
| Melihat dan mengubah Google Sheet | Menyimpan dan membaca transaksi di Sheet ini |
| Menjalankan skrip di Sheet | Menampilkan menu Hartafolio |
| Mengelola berkas Drive yang Anda buka atau buat dengan aplikasi ini | Folder foto nota dan folder cadangan. Aplikasi tidak bisa melihat berkas Drive Anda yang lain |
| Menjalankan jadwal otomatis | Cadangan mingguan |

Semua izin diberikan ke salinan Anda sendiri. Anda bisa mencabutnya kapan saja di myaccount.google.com/permissions.

---

## Bagian 5. Bila ada masalah

| Yang terlihat | Yang dilakukan |
|---|---|
| "Authorization is required" atau layar izin muncul lagi | Buka Sheet, klik menu Hartafolio apa saja, dan setujui izinnya. Lalu buka lagi URL aplikasi |
| "Google Sheet tidak merespons" | Tutup lalu buka lagi aplikasi. Bila berulang, buka Sheet untuk memastikan tidak terhapus atau dipindah |
| Foto belum terunggah | Transaksi sudah tersimpan. Ketuk **Coba lagi** di pesan, atau lampirkan lagi lewat Ubah |
| "Tidak bisa: saldo tidak cukup untuk transaksi sesudahnya" | Lihat aturan saldo di Bagian 2 |
| URL aplikasi hilang | Di Apps Script: **Deploy › Kelola deployment**, salin URL aplikasi web |

Pertanyaan lain: `[kontak Ticon]`.

---

## Catatan untuk Ticon (hapus sebelum dikirim ke klien)

1. Isi dua tempat `[...]`: tautan Buat salinan, kontak.
2. **Belum diuji dari akun baru:** semua langkah Bagian 1, terutama nama tombol Google, peringatan "belum diverifikasi", dan apakah layar izin Drive hanya meminta berkas yang dibuat aplikasi (`drive.file`). Uji sekali di satu akun Google yang belum pernah dipakai.
3. **Pembaruan aplikasi belum ada jalurnya.** CLAUDE.md menyebut library pusat, tetapi kode sekarang satu proyek. Setiap salinan harus di-deploy ulang dengan kode baru (clasp ke tiap salinan, atau tempel manual). Putuskan sebelum serah terima.
4. **Cadangan belum diuji di Google:** menyalin Sheet, memindah ke folder, dan membuang yang lama memakai izin sempit; bila Google menolak, salinan tetap tersimpan di Drive utama dan ada catatan di Pengaturan.
5. Aplikasi belum punya layar Alat, jadi pengaturan cadangan hanya lewat menu Sheet.
