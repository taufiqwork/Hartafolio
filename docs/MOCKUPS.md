# Mockup hi-fi (sumber kebenaran visual dan perilaku)

299 board, **semua state** tiap alur: `reference/mockups/png/<nama>.png` (gambar, ukuran asli board) dan `reference/mockups/src/<nama>.dc.html` (sumber template; teks, struktur, dan nilai contoh bisa dibaca langsung, atau dibuka di browser lewat server statis: `cd reference/mockups/src && python3 -m http.server`).
`canvas.json` memuat judul, posisi, dan urutan board. Judul board berbentuk "kode · nama" (mis. "05.a · Catat transaksi"); pakai kode itu saat melapor ke Ticon.

Ukuran: phone 390x844, desktop 1440x900, tablet 1024x768, board Alur/Arsip lebar (dokumen alur, sitemap, audit).

## Daftar board (urutan kanvas)
| Judul | PNG | Sumber |
|---|---|---|
| 00 · Splash | `png/00-Splash.png` | `src/00-Splash.dc.html` |
| 01.a · Setup · 1 Akun | `png/01-Setup-1-Akun.png` | `src/01-Setup-1-Akun.dc.html` |
| 01.b · Setup · 2 Anggota, awal (kosong) | `png/01-Setup-2a-Kosong.png` | `src/01-Setup-2a-Kosong.dc.html` |
| 01.c · Setup · Anggota sudah terisi | `png/01-Setup.png` | `src/01-Setup.dc.html` |
| 01.d · Setup · Menu hubungan terbuka | `png/01-Setup-2b-Hubungan-Terbuka.png` | `src/01-Setup-2b-Hubungan-Terbuka.dc.html` |
| 01.e · Setup · 3 Lokasi, awal (kosong) | `png/01-Setup-3a-Kosong.png` | `src/01-Setup-3a-Kosong.dc.html` |
| 01.f · Setup · Lokasi sudah terisi | `png/01-Setup-3-Lokasi.png` | `src/01-Setup-3-Lokasi.dc.html` |
| 01.g · Setup · Ikon pensil ditekan | `png/01-Setup-3b-Ubah.png` | `src/01-Setup-3b-Ubah.dc.html` |
| 01.h · Setup · Pintasan ditekan | `png/01-Setup-3c-Pintasan.png` | `src/01-Setup-3c-Pintasan.dc.html` |
| 01.i · Setup · "Lokasi lain" ditekan | `png/01-Setup-3d-Lokasi-Lain.png` | `src/01-Setup-3d-Lokasi-Lain.dc.html` |
| 01.j · Setup · Menu jenis lokasi terbuka | `png/01-Setup-3e-Jenis-Terbuka.png` | `src/01-Setup-3e-Jenis-Terbuka.dc.html` |
| 01.k · Setup · 4 Import, awal (opsional, bisa dilewati) | `png/01-Setup-4a-Belum-Pilih.png` | `src/01-Setup-4a-Belum-Pilih.dc.html` |
| 01.l · Setup · File template terpilih | `png/01-Setup-4-Import.png` | `src/01-Setup-4-Import.dc.html` |
| 01.m · Setup · Periksa, 1 aset perlu dilengkapi | `png/01-Setup-4c-Periksa.png` | `src/01-Setup-4c-Periksa.dc.html` |
| 01.n · Setup · Tombol "Lengkapi" ditekan (form Aset manual bersama) | `png/01-Setup-4f-Lengkapi.png` | `src/01-Setup-4f-Lengkapi.dc.html` |
| 01.o · Setup · Periksa, siap disimpan | `png/01-Setup-4d-Periksa-Siap.png` | `src/01-Setup-4d-Periksa-Siap.dc.html` |
| 01.p · Setup · Simpan, import selesai | `png/01-Setup-4e-Selesai.png` | `src/01-Setup-4e-Selesai.dc.html` |
| 01.q · Setup · Import · Selesai · Import diurungkan | `png/01-Setup-4u-Diurungkan.png` | `src/01-Setup-4u-Diurungkan.dc.html` |
| 01.r · Setup · Import · Gagal · File kosong | `png/01-Setup-4g-File-Kosong.png` | `src/01-Setup-4g-File-Kosong.dc.html` |
| 01.s · Setup · Import · Gagal · Bukan template Hartafolio | `png/01-Setup-4h-Bukan-Template.png` | `src/01-Setup-4h-Bukan-Template.dc.html` |
| 01.t · Setup · Import · Gagal · File tidak bisa dibaca | `png/01-Setup-4i-Tidak-Terbaca.png` | `src/01-Setup-4i-Tidak-Terbaca.dc.html` |
| 01.u · Setup · Import · Periksa · Lebih dari satu hal perlu dilengkapi | `png/01-Setup-4j-Banyak-Dilengkapi.png` | `src/01-Setup-4j-Banyak-Dilengkapi.dc.html` |
| 01.v · Setup · Import · Lengkapi · Anggota atau lokasi tidak dikenal | `png/01-Setup-4k-Anggota-Tak-Dikenal.png` | `src/01-Setup-4k-Anggota-Tak-Dikenal.dc.html` |
| 01.w · Setup · Import · Periksa · Transaksi dan nilai bulanan dilewati | `png/01-Setup-4l-Baris-Dilewati.png` | `src/01-Setup-4l-Baris-Dilewati.dc.html` |
| 01.x · Setup · Import · Rincian baris yang dilewati | `png/01-Setup-4m-Rincian-Dilewati.png` | `src/01-Setup-4m-Rincian-Dilewati.dc.html` |
| 01.y · Setup · Import · Periksa · Semua baris dilewati | `png/01-Setup-4n-Tidak-Ada-Yang-Siap.png` | `src/01-Setup-4n-Tidak-Ada-Yang-Siap.dc.html` |
| 01.z · Setup · Import · Simpan · Gagal menyimpan ke Google Sheet | `png/01-Setup-4o-Gagal-Simpan.png` | `src/01-Setup-4o-Gagal-Simpan.dc.html` |
| 01.aa · Setup · Import · Periksa · Konfirmasi keluar tanpa menyimpan | `png/01-Setup-4p-Konfirmasi-Keluar.png` | `src/01-Setup-4p-Konfirmasi-Keluar.dc.html` |
| 01.ab · Setup · Import · Periksa · Transaksi sudah ada di Sheet | `png/01-Setup-4q-Sudah-Ada.png` | `src/01-Setup-4q-Sudah-Ada.dc.html` |
| 01.ac · Setup · Import · Lengkapi · Gabungkan ke anggota yang ada | `png/01-Setup-4r-Gabungkan-Anggota.png` | `src/01-Setup-4r-Gabungkan-Anggota.dc.html` |
| 01.ad · Setup · Import · Periksa · Setelah "Fulan" digabung ke Al Ghafiqi | `png/01-Setup-4s-Sudah-Digabung.png` | `src/01-Setup-4s-Sudah-Digabung.dc.html` |
| 01.ae · Setup · Import · Lengkapi · Tambah "Fulan" (form Tambah anggota bersama) | `png/01-Setup-4t-Tambah-Anggota.png` | `src/01-Setup-4t-Tambah-Anggota.dc.html` |
| 02.a · Beranda · Utama | `png/Main.png` | `src/Main.dc.html` |
| 02.b · Beranda · Per jenis aset | `png/Main-2a-Per-Aset.png` | `src/Main-2a-Per-Aset.dc.html` |
| 02.c · Beranda · Menu anggota terbuka | `png/Main-2b-Menu-Anggota.png` | `src/Main-2b-Menu-Anggota.dc.html` |
| 02.d · Beranda · Satu anggota dipilih | `png/Main-2c-Satu-Anggota.png` | `src/Main-2c-Satu-Anggota.dc.html` |
| 02.e · Beranda · Beranda kosong (dari nol) | `png/Main-2d-Kosong.png` | `src/Main-2d-Kosong.dc.html` |
| 02.f · Beranda · Zakat jatuh tempo hari ini | `png/Main-2e-Zakat-Hari-H.png` | `src/Main-2e-Zakat-Hari-H.dc.html` |
| 02.g · Beranda · Zakat terlambat | `png/Main-2f-Zakat-Terlambat.png` | `src/Main-2f-Zakat-Terlambat.dc.html` |
| 02.h · Beranda · Zakat mendekati | `png/Main-2g-Zakat-Mendekati.png` | `src/Main-2g-Zakat-Mendekati.dc.html` |
| 02.i · Beranda · Piutang jatuh tempo hari ini (banner piutang) | `png/Main-2o-Piutang-Hari-H.png` | `src/Main-2o-Piutang-Hari-H.dc.html` |
| 02.j · Beranda · Piutang terlambat (banner piutang) | `png/Main-2p-Piutang-Terlambat.png` | `src/Main-2p-Piutang-Terlambat.dc.html` |
| 02.k · Beranda · Zakat dan piutang bersamaan (banner zakat, piutang di lonceng) | `png/Main-2q-Zakat-Dan-Piutang.png` | `src/Main-2q-Zakat-Dan-Piutang.dc.html` |
| 02.l · Beranda · Transaksi tersimpan (toast) | `png/Main-2h-Tersimpan.png` | `src/Main-2h-Tersimpan.dc.html` |
| 02.m · Beranda · Lonceng terbuka | `png/Main-2i-Perhatian.png` | `src/Main-2i-Perhatian.dc.html` |
| 02.n · Beranda · Lonceng, tidak ada yang perlu perhatian | `png/Main-2j-Perhatian-Kosong.png` | `src/Main-2j-Perhatian-Kosong.dc.html` |
| 02.o · Beranda · Lonceng terbuka, zakat dan piutang | `png/Main-2r-Perhatian-Zakat-Piutang.png` | `src/Main-2r-Perhatian-Zakat-Piutang.dc.html` |
| 02.p · Beranda · 9 anggota, donut 4 + Sisanya | `png/Main-2k-Banyak-Anggota.png` | `src/Main-2k-Banyak-Anggota.dc.html` |
| 02.q · Beranda · Sisanya terbuka | `png/Main-2l-Banyak-Sisanya.png` | `src/Main-2l-Banyak-Sisanya.dc.html` |
| 02.r · Beranda · Azlan, Emas dipilih | `png/Main-2m-Satu-Anggota-Pilih.png` | `src/Main-2m-Satu-Anggota-Pilih.dc.html` |
| 02.s · Beranda · Per jenis aset, Emas dipilih | `png/Main-2n-Per-Aset-Pilih.png` | `src/Main-2n-Per-Aset-Pilih.dc.html` |
| 03.a · Aset · Utama | `png/03-Aset.png` | `src/03-Aset.dc.html` |
| 03.b · Aset · Satu anggota dipilih | `png/03-Aset-2a-Satu-Anggota.png` | `src/03-Aset-2a-Satu-Anggota.dc.html` |
| 03.c · Aset · Filter lokasi terbuka | `png/03-Aset-2b-Lokasi-Menu.png` | `src/03-Aset-2b-Lokasi-Menu.dc.html` |
| 03.d · Aset · Aset kosong (dari nol) | `png/03-Aset-2c-Kosong.png` | `src/03-Aset-2c-Kosong.dc.html` |
| 03.e · Aset · Transaksi tersimpan (toast) | `png/03-Aset-2d-Tersimpan.png` | `src/03-Aset-2d-Tersimpan.dc.html` |
| 04.a · Kelola aset · Utama | `png/14-Aset.png` | `src/14-Aset.dc.html` |
| 04.b · Kelola aset · Ubah, harga otomatis | `png/14-Aset-2a-Ubah-Otomatis.png` | `src/14-Aset-2a-Ubah-Otomatis.dc.html` |
| 04.c · Kelola aset · Pilih harga manual | `png/14-Aset-2b-Ubah-Manual.png` | `src/14-Aset-2b-Ubah-Manual.dc.html` |
| 04.d · Kelola aset · Isi harga manual | `png/14-Aset-2c-Isi-Harga.png` | `src/14-Aset-2c-Isi-Harga.dc.html` |
| 04.e · Kelola aset · Harga tersimpan | `png/14-Aset-2d-Harga-Tersimpan.png` | `src/14-Aset-2d-Harga-Tersimpan.dc.html` |
| 04.f · Kelola aset · Tambah dari katalog | `png/14-Aset-2e-Tambah-Aset.png` | `src/14-Aset-2e-Tambah-Aset.dc.html` |
| 04.g · Kelola aset · Tambah aset manual | `png/14-Aset-2f-Tambah-Manual.png` | `src/14-Aset-2f-Tambah-Manual.dc.html` |
| 04.h · Kelola aset · Aset ditambahkan, tawarkan saldo awal | `png/14-Aset-2g-Tanya-Saldo-Awal.png` | `src/14-Aset-2g-Tanya-Saldo-Awal.dc.html` |
| 04.i · Kelola aset · Dibuka dari Alat | `png/14-Aset-2h-Dari-Lainnya.png` | `src/14-Aset-2h-Dari-Lainnya.dc.html` |
| 04.j · Kelola aset · Isi harga, dibuka dari Beranda | `png/14-Aset-2i-Isi-Harga-Dari-Beranda.png` | `src/14-Aset-2i-Isi-Harga-Dari-Beranda.dc.html` |
| 04.k · Kelola aset · Hapus ditolak, masih dimiliki | `png/14-Aset-2j-Hapus-Ditolak.png` | `src/14-Aset-2j-Hapus-Ditolak.dc.html` |
| 04.l · Kelola aset · Hapus aset belum dimiliki | `png/14-Aset-2k-Hapus-Konfirmasi.png` | `src/14-Aset-2k-Hapus-Konfirmasi.dc.html` |
| 04.m · Kelola aset · Terjual habis, disembunyikan | `png/14-Aset-2l-Sembunyikan.png` | `src/14-Aset-2l-Sembunyikan.dc.html` |
| 04.n · Kelola aset · Daftar aset tersembunyi | `png/14-Aset-2m-Aset-Tersembunyi.png` | `src/14-Aset-2m-Aset-Tersembunyi.dc.html` |
| 04.o · Kelola aset · Aset ditampilkan lagi | `png/14-Aset-2n-Ditampilkan-Lagi.png` | `src/14-Aset-2n-Ditampilkan-Lagi.dc.html` |
| 04.p · Kelola aset · Emas digital, setara gram | `png/14-Aset-2o-Tambah-Emas-Digital.png` | `src/14-Aset-2o-Tambah-Emas-Digital.dc.html` |
| 04.q · Kelola aset · Saldo awal tersimpan (toast) | `png/14-Aset-2p-Saldo-Tersimpan.png` | `src/14-Aset-2p-Saldo-Tersimpan.dc.html` |
| 05.a · Catat · Beli, dibayar USDT | `png/04-Catat.png` | `src/04-Catat.dc.html` |
| 05.b · Catat · Beli, dibayar dari luar Hartafolio | `png/04-Catat-2m-Beli-Dari-Luar.png` | `src/04-Catat-2m-Beli-Dari-Luar.dc.html` |
| 05.c · Catat · Pilih alat bayar lain (sheet) | `png/04-Catat-2o-Pilih-Alat-Bayar.png` | `src/04-Catat-2o-Pilih-Alat-Bayar.dc.html` |
| 05.d · Catat · Bayar dengan BTC, harga dalam BTC | `png/04-Catat-2p-Bayar-Dengan-BTC.png` | `src/04-Catat-2p-Bayar-Dengan-BTC.dc.html` |
| 05.e · Catat · Bayar USDT dari lokasi lain | `png/04-Catat-2q-Bayar-Dari-Bybit.png` | `src/04-Catat-2q-Bayar-Dari-Bybit.dc.html` |
| 05.f · Catat · Pilih tanggal dan jam | `png/04-Catat-2n-Pilih-Tanggal.png` | `src/04-Catat-2n-Pilih-Tanggal.dc.html` |
| 05.g · Catat · Tanggal lalu, kurs rata-rata harian | `png/04-Catat-2r-Tanggal-Lalu.png` | `src/04-Catat-2r-Tanggal-Lalu.dc.html` |
| 05.h · Catat · Kurs diisi manual, bisa di-reset | `png/04-Catat-2s-Kurs-Manual.png` | `src/04-Catat-2s-Kurs-Manual.dc.html` |
| 05.i · Catat · Jual, hasil masuk ke USD | `png/04-Catat-2a-Jual.png` | `src/04-Catat-2a-Jual.dc.html` |
| 05.j · Catat · Masuk (dari luar, tanpa beli) | `png/04-Catat-2b-Masuk.png` | `src/04-Catat-2b-Masuk.dc.html` |
| 05.k · Catat · Keluar (sedekah) | `png/04-Catat-2k-Keluar.png` | `src/04-Catat-2k-Keluar.dc.html` |
| 05.l · Catat · Pindah antar lokasi | `png/04-Catat-2c-Pindah.png` | `src/04-Catat-2c-Pindah.dc.html` |
| 05.m · Catat · Pindah antar anggota (lokasi sama) | `png/04-Catat-2e-Pindah-Anggota.png` | `src/04-Catat-2e-Pindah-Anggota.dc.html` |
| 05.n · Catat · Pindah antar anggota, beda lokasi, ada biaya | `png/04-Catat-2f-Pindah-Anggota-Beda-Lokasi.png` | `src/04-Catat-2f-Pindah-Anggota-Beda-Lokasi.dc.html` |
| 05.o · Catat · Saldo awal (dari Beranda kosong) | `png/04-Catat-2d-Saldo-Awal.png` | `src/04-Catat-2d-Saldo-Awal.dc.html` |
| 05.p · Catat · Saldo awal, aset berikutnya | `png/04-Catat-2g-Saldo-Awal-Lanjut.png` | `src/04-Catat-2g-Saldo-Awal-Lanjut.dc.html` |
| 05.q · Catat · "Cari aset lain" ditekan | `png/04-Catat-2h-Cari-Aset.png` | `src/04-Catat-2h-Cari-Aset.dc.html` |
| 05.r · Catat · "+ Lokasi" ditekan | `png/04-Catat-2i-Lokasi-Baru.png` | `src/04-Catat-2i-Lokasi-Baru.dc.html` |
| 05.s · Catat · "Tambah aset manual" | `png/04-Catat-2j-Aset-Manual.png` | `src/04-Catat-2j-Aset-Manual.dc.html` |
| 05.t · Catat · Ubah transaksi (dari Riwayat) | `png/04-Catat-2l-Ubah.png` | `src/04-Catat-2l-Ubah.dc.html` |
| 06.a · Riwayat · Utama | `png/05-Riwayat.png` | `src/05-Riwayat.dc.html` |
| 06.b · Riwayat · Filter terbuka | `png/05-Riwayat-2a-Filter.png` | `src/05-Riwayat-2a-Filter.dc.html` |
| 06.c · Riwayat · Detail transaksi | `png/05-Riwayat-2b-Detail.png` | `src/05-Riwayat-2b-Detail.dc.html` |
| 06.d · Riwayat · Detail transaksi Zakat (tautan ke haul) | `png/05-Riwayat-2h-Detail-Zakat.png` | `src/05-Riwayat-2h-Detail-Zakat.dc.html` |
| 06.e · Riwayat · Detail transaksi Pinjamkan | `png/05-Riwayat-2i-Detail-Pinjamkan.png` | `src/05-Riwayat-2i-Detail-Pinjamkan.dc.html` |
| 06.f · Riwayat · Detail transaksi Cicilan diterima | `png/05-Riwayat-2j-Detail-Cicilan.png` | `src/05-Riwayat-2j-Detail-Cicilan.dc.html` |
| 06.g · Riwayat · Detail transaksi Pelunasan diterima | `png/05-Riwayat-2k-Detail-Pelunasan.png` | `src/05-Riwayat-2k-Detail-Pelunasan.dc.html` |
| 06.h · Riwayat · Detail transaksi Pindah | `png/05-Riwayat-2l-Detail-Pindah.png` | `src/05-Riwayat-2l-Detail-Pindah.dc.html` |
| 06.i · Riwayat · Transaksi dihapus (toast sementara) | `png/05-Riwayat-2c-Terhapus.png` | `src/05-Riwayat-2c-Terhapus.dc.html` |
| 06.j · Riwayat · Kosong (dari nol) | `png/05-Riwayat-2d-Kosong.png` | `src/05-Riwayat-2d-Kosong.dc.html` |
| 06.k · Riwayat · Daftar terhapus (pulihkan kapan saja) | `png/05-Riwayat-2e-Daftar-Terhapus.png` | `src/05-Riwayat-2e-Daftar-Terhapus.dc.html` |
| 06.l · Riwayat · Transaksi tersimpan (toast) | `png/05-Riwayat-2f-Tersimpan.png` | `src/05-Riwayat-2f-Tersimpan.dc.html` |
| 06.m · Riwayat · Perubahan disimpan (toast) | `png/05-Riwayat-2g-Diubah.png` | `src/05-Riwayat-2g-Diubah.dc.html` |
| 07.a · Alat · Utama | `png/09-Lainnya.png` | `src/09-Lainnya.dc.html` |
| 07.b · Alat · Mata uang | `png/09-Lainnya-2a-Mata-Uang.png` | `src/09-Lainnya-2a-Mata-Uang.dc.html` |
| 07.c · Alat · Pasang di layar HP | `png/09-Lainnya-2c-Pasang-Di-HP.png` | `src/09-Lainnya-2c-Pasang-Di-HP.dc.html` |
| 07.d · Alat · Transaksi tersimpan (toast) | `png/09-Lainnya-2d-Tersimpan.png` | `src/09-Lainnya-2d-Tersimpan.dc.html` |
| 08.a · Laporan · Utama | `png/07-Laporan.png` | `src/07-Laporan.dc.html` |
| 08.b · Laporan · Triwulan | `png/07-Laporan-2a-Triwulan.png` | `src/07-Laporan-2a-Triwulan.dc.html` |
| 08.c · Laporan · Menu Anggota | `png/07-Laporan-2b-Menu-Anggota.png` | `src/07-Laporan-2b-Menu-Anggota.dc.html` |
| 08.d · Laporan · Satu Anggota | `png/07-Laporan-2c-Satu-Anggota.png` | `src/07-Laporan-2c-Satu-Anggota.dc.html` |
| 08.e · Laporan · USD | `png/07-Laporan-2d-USD.png` | `src/07-Laporan-2d-USD.dc.html` |
| 08.f · Laporan · Export | `png/07-Laporan-2e-Export.png` | `src/07-Laporan-2e-Export.dc.html` |
| 08.g · Laporan · Export data lengkap | `png/07-Laporan-2h-Export-Data-Lengkap.png` | `src/07-Laporan-2h-Export-Data-Lengkap.dc.html` |
| 08.h · Laporan · Kosong | `png/07-Laporan-2f-Kosong.png` | `src/07-Laporan-2f-Kosong.dc.html` |
| 08.i · Laporan · Dibuka dari Beranda | `png/07-Laporan-2g-Dari-Beranda.png` | `src/07-Laporan-2g-Dari-Beranda.dc.html` |
| 08.j · Laporan · Rincian bulan (dari Riwayat bulanan) | `png/07-Laporan-3-Bulan.png` | `src/07-Laporan-3-Bulan.dc.html` |
| 08.k · Laporan · Rincian bulan dari import | `png/07-Laporan-3a-Bulan-Import.png` | `src/07-Laporan-3a-Bulan-Import.dc.html` |
| 09.a · Hasil export · Ringkasan PDF halaman 1 | `png/07-Export-PDF.png` | `src/07-Export-PDF.dc.html` |
| 09.b · Hasil export · Ringkasan PDF halaman 2 | `png/07-Export-PDF-2-Hal-2.png` | `src/07-Export-PDF-2-Hal-2.dc.html` |
| 09.c · Hasil export · Ringkasan Excel · sheet Ringkasan | `png/07-Export-Excel.png` | `src/07-Export-Excel.dc.html` |
| 09.d · Hasil export · Ringkasan Excel · sheet Per anggota | `png/07-Export-Excel-2c-Per-Anggota.png` | `src/07-Export-Excel-2c-Per-Anggota.dc.html` |
| 09.e · Hasil export · Ringkasan Excel · sheet Per aset | `png/07-Export-Excel-2a-Per-Aset.png` | `src/07-Export-Excel-2a-Per-Aset.dc.html` |
| 09.f · Hasil export · Ringkasan Excel · sheet Transaksi | `png/07-Export-Excel-2b-Transaksi.png` | `src/07-Export-Excel-2b-Transaksi.dc.html` |
| 09.g · Hasil export · Data lengkap (.xlsx) · sheet Transaksi | `png/07-Export-Data-Lengkap.png` | `src/07-Export-Data-Lengkap.dc.html` |
| 09.h · Hasil export · Data lengkap (.xlsx) · sheet Aset | `png/07-Export-Data-Lengkap-2a-Aset.png` | `src/07-Export-Data-Lengkap-2a-Aset.dc.html` |
| 09.i · Hasil export · Data lengkap (.xlsx) · sheet Anggota (tersembunyi) | `png/07-Export-Data-Lengkap-2b-Anggota-Lokasi.png` | `src/07-Export-Data-Lengkap-2b-Anggota-Lokasi.dc.html` |
| 09.j · Hasil export · Data lengkap (.xlsx) · sheet Lokasi (tersembunyi) | `png/07-Export-Data-Lengkap-2e-Lokasi.png` | `src/07-Export-Data-Lengkap-2e-Lokasi.dc.html` |
| 09.k · Hasil export · Data lengkap (.xlsx) · sheet Nilai bulanan | `png/07-Export-Data-Lengkap-2c-Nilai-Bulanan.png` | `src/07-Export-Data-Lengkap-2c-Nilai-Bulanan.dc.html` |
| 09.l · Hasil export · Data lengkap (.xlsx) · sheet Pengaturan (tersembunyi) | `png/07-Export-Data-Lengkap-2d-Pengaturan.png` | `src/07-Export-Data-Lengkap-2d-Pengaturan.dc.html` |
| 10.a · Zakat mal · Utama | `png/08-Zakat.png` | `src/08-Zakat.dc.html` |
| 10.b · Zakat mal · Belum nishob | `png/08-Zakat-2a-Belum-Nisab.png` | `src/08-Zakat-2a-Belum-Nisab.dc.html` |
| 10.c · Zakat mal · Jatuh Tempo | `png/08-Zakat-2b-Jatuh-Tempo.png` | `src/08-Zakat-2b-Jatuh-Tempo.dc.html` |
| 10.d · Zakat mal · Dibayar | `png/08-Zakat-2c-Dibayar.png` | `src/08-Zakat-2c-Dibayar.dc.html` |
| 10.e · Zakat mal · Riwayat | `png/08-Zakat-2d-Riwayat.png` | `src/08-Zakat-2d-Riwayat.dc.html` |
| 10.f · Zakat mal · Info | `png/08-Zakat-2e-Info.png` | `src/08-Zakat-2e-Info.dc.html` |
| 10.g · Zakat mal · Kosong | `png/08-Zakat-2f-Kosong.png` | `src/08-Zakat-2f-Kosong.dc.html` |
| 10.h · Zakat mal · Mendekati jatuh tempo | `png/08-Zakat-2g-Mendekati.png` | `src/08-Zakat-2g-Mendekati.dc.html` |
| 10.i · Zakat mal · Terlambat | `png/08-Zakat-2h-Terlambat.png` | `src/08-Zakat-2h-Terlambat.dc.html` |
| 10.j · Zakat mal · Pengingat | `png/08-Zakat-2i-Pengingat.png` | `src/08-Zakat-2i-Pengingat.dc.html` |
| 10.k · Zakat mal · Catat pembayaran | `png/08-Zakat-2j-Catat-Pembayaran.png` | `src/08-Zakat-2j-Catat-Pembayaran.dc.html` |
| 10.l · Zakat mal · Pembayaran dicatat | `png/08-Zakat-2k-Dibayar-Toast.png` | `src/08-Zakat-2k-Dibayar-Toast.dc.html` |
| 10.m · Zakat mal · Dibayar dari aset | `png/08-Zakat-2l-Bayar-Dari-Aset.png` | `src/08-Zakat-2l-Bayar-Dari-Aset.dc.html` |
| 10.n · Zakat mal · Pilih aset | `png/08-Zakat-2m-Pilih-Aset.png` | `src/08-Zakat-2m-Pilih-Aset.dc.html` |
| 10.o · Zakat mal · Dibayar dari aset dicatat | `png/08-Zakat-2n-Dibayar-Dari-Aset.png` | `src/08-Zakat-2n-Dibayar-Dari-Aset.dc.html` |
| 10.p · Zakat mal · Pilih aset, sisa di bawah nishob | `png/08-Zakat-2o-Pilih-Aset-Bawah-Nishob.png` | `src/08-Zakat-2o-Pilih-Aset-Bawah-Nishob.dc.html` |
| 10.q · Zakat mal · Bayar dari aset, peringatan di bawah nishob | `png/08-Zakat-2p-Bayar-Aset-Bawah-Nishob.png` | `src/08-Zakat-2p-Bayar-Aset-Bawah-Nishob.dc.html` |
| 10.r · Zakat mal · Dibayar, haul menunggu nishob | `png/08-Zakat-2q-Dibayar-Haul-Menunggu.png` | `src/08-Zakat-2q-Dibayar-Haul-Menunggu.dc.html` |
| 10.s · Zakat mal · Nishob tercapai lagi, haul mulai | `png/08-Zakat-2r-Nishob-Tercapai-Lagi.png` | `src/08-Zakat-2r-Nishob-Tercapai-Lagi.dc.html` |
| 10.t · Zakat mal · Dibuka dari Beranda | `png/08-Zakat-2s-Dari-Beranda.png` | `src/08-Zakat-2s-Dari-Beranda.dc.html` |
| 11.a · Nishob · Utama | `png/16-Nishob.png` | `src/16-Nishob.dc.html` |
| 11.b · Nishob · Ubah emas | `png/16-Nishob-2a-Ubah-Emas.png` | `src/16-Nishob-2a-Ubah-Emas.dc.html` |
| 11.c · Nishob · Ubah perak | `png/16-Nishob-2b-Ubah-Perak.png` | `src/16-Nishob-2b-Ubah-Perak.dc.html` |
| 11.d · Nishob · Sudah diubah | `png/16-Nishob-2c-Diubah.png` | `src/16-Nishob-2c-Diubah.dc.html` |
| 11.e · Nishob · Dibuka dari Zakat | `png/16-Nishob-2d-Dari-Zakat.png` | `src/16-Nishob-2d-Dari-Zakat.dc.html` |
| 12.a · Harga terkini · Utama | `png/11-Harga.png` | `src/11-Harga.dc.html` |
| 12.b · Harga terkini · Crypto | `png/11-Harga-2a-Crypto.png` | `src/11-Harga-2a-Crypto.dc.html` |
| 12.c · Harga terkini · Yang dimiliki | `png/11-Harga-2b-Dimiliki.png` | `src/11-Harga-2b-Dimiliki.dc.html` |
| 12.d · Harga terkini · Tidak terhubung | `png/11-Harga-2c-Offline.png` | `src/11-Harga-2c-Offline.dc.html` |
| 12.e · Harga terkini · Dibuka dari Beranda | `png/11-Harga-2d-Dari-Beranda.png` | `src/11-Harga-2d-Dari-Beranda.dc.html` |
| 12.f · Harga terkini · Dibuka dari Zakat | `png/11-Harga-2e-Dari-Zakat.png` | `src/11-Harga-2e-Dari-Zakat.dc.html` |
| 13.a · Import / Export · Import · belum pilih file (layar awal) | `png/10-Import.png` | `src/10-Import.dc.html` |
| 13.b · Import / Export · Import · template diunduh | `png/10-Import-2k-Template.png` | `src/10-Import-2k-Template.dc.html` |
| 13.c · Import / Export · Import · file template dipilih | `png/10-Import-2a-File-Dipilih.png` | `src/10-Import-2a-File-Dipilih.dc.html` |
| 13.d · Import / Export · Import · membaca file | `png/10-Import-2b-Membaca-File.png` | `src/10-Import-2b-Membaca-File.dc.html` |
| 13.e · Import / Export · Import · periksa, 1 aset perlu dilengkapi | `png/10-Import-2e-Periksa.png` | `src/10-Import-2e-Periksa.dc.html` |
| 13.f · Import / Export · Import · lengkapi aset (form Aset manual bersama) | `png/10-Import-2f-Lengkapi-Aset.png` | `src/10-Import-2f-Lengkapi-Aset.dc.html` |
| 13.g · Import / Export · Import · periksa, siap disimpan | `png/10-Import-2g-Periksa-Lengkap.png` | `src/10-Import-2g-Periksa-Lengkap.dc.html` |
| 13.h · Import / Export · Import · menyimpan | `png/10-Import-2h-Menyimpan.png` | `src/10-Import-2h-Menyimpan.dc.html` |
| 13.i · Import / Export · Import · selesai | `png/10-Import-2i-Selesai.png` | `src/10-Import-2i-Selesai.dc.html` |
| 13.j · Import / Export · Import · diurungkan | `png/10-Import-2j-Diurungkan.png` | `src/10-Import-2j-Diurungkan.dc.html` |
| 13.k · Import / Export · Export · data lengkap | `png/10-Import-3a-Export.png` | `src/10-Import-3a-Export.dc.html` |
| 13.l · Import / Export · Export · ringkasan | `png/10-Import-3c-Export-Ringkasan.png` | `src/10-Import-3c-Export-Ringkasan.dc.html` |
| 13.m · Import / Export · Export · membuat file | `png/10-Import-3e-Export-Membuat.png` | `src/10-Import-3e-Export-Membuat.dc.html` |
| 13.n · Import / Export · Export · berhasil, data lengkap | `png/10-Import-3b-Export-Selesai.png` | `src/10-Import-3b-Export-Selesai.dc.html` |
| 13.o · Import / Export · Export · berhasil, ringkasan PDF | `png/10-Import-3d-Export-Berhasil.png` | `src/10-Import-3d-Export-Berhasil.dc.html` |
| 13.p · Import / Export · Export · file belum tersimpan | `png/10-Import-3f-Export-Gagal.png` | `src/10-Import-3f-Export-Gagal.dc.html` |
| 13.q · Import / Export · Alat · Gagal · File kosong | `png/10-Import-4g-File-Kosong.png` | `src/10-Import-4g-File-Kosong.dc.html` |
| 13.r · Import / Export · Alat · Gagal · Bukan template Hartafolio | `png/10-Import-4h-Bukan-Template.png` | `src/10-Import-4h-Bukan-Template.dc.html` |
| 13.s · Import / Export · Alat · Gagal · File tidak bisa dibaca | `png/10-Import-4i-Tidak-Terbaca.png` | `src/10-Import-4i-Tidak-Terbaca.dc.html` |
| 13.t · Import / Export · Alat · Periksa · Lebih dari satu hal perlu dilengkapi | `png/10-Import-4j-Banyak-Dilengkapi.png` | `src/10-Import-4j-Banyak-Dilengkapi.dc.html` |
| 13.u · Import / Export · Alat · Lengkapi · Anggota atau lokasi tidak dikenal | `png/10-Import-4k-Anggota-Tak-Dikenal.png` | `src/10-Import-4k-Anggota-Tak-Dikenal.dc.html` |
| 13.v · Import / Export · Alat · Periksa · Transaksi dan nilai bulanan dilewati | `png/10-Import-4l-Baris-Dilewati.png` | `src/10-Import-4l-Baris-Dilewati.dc.html` |
| 13.w · Import / Export · Alat · Rincian baris yang dilewati | `png/10-Import-4m-Rincian-Dilewati.png` | `src/10-Import-4m-Rincian-Dilewati.dc.html` |
| 13.x · Import / Export · Alat · Periksa · Semua baris dilewati | `png/10-Import-4n-Tidak-Ada-Yang-Siap.png` | `src/10-Import-4n-Tidak-Ada-Yang-Siap.dc.html` |
| 13.y · Import / Export · Alat · Simpan · Gagal menyimpan ke Google Sheet | `png/10-Import-4o-Gagal-Simpan.png` | `src/10-Import-4o-Gagal-Simpan.dc.html` |
| 13.z · Import / Export · Alat · Periksa · Konfirmasi keluar tanpa menyimpan | `png/10-Import-4p-Konfirmasi-Keluar.png` | `src/10-Import-4p-Konfirmasi-Keluar.dc.html` |
| 13.aa · Import / Export · Alat · Periksa · Transaksi sudah ada di Sheet | `png/10-Import-4q-Sudah-Ada.png` | `src/10-Import-4q-Sudah-Ada.dc.html` |
| 13.ab · Import / Export · Alat · Lengkapi · Gabungkan ke anggota yang ada | `png/10-Import-4r-Gabungkan-Anggota.png` | `src/10-Import-4r-Gabungkan-Anggota.dc.html` |
| 13.ac · Import / Export · Alat · Periksa · Setelah "Fulan" digabung ke Al Ghafiqi | `png/10-Import-4s-Sudah-Digabung.png` | `src/10-Import-4s-Sudah-Digabung.dc.html` |
| 13.ad · Import / Export · Alat · Lengkapi · Tambah "Fulan" (form Tambah anggota bersama) | `png/10-Import-4t-Tambah-Anggota.png` | `src/10-Import-4t-Tambah-Anggota.dc.html` |
| 13.ae · Import / Export · Import · Template Excel (.xlsx) · sheet Petunjuk | `png/10-Import-Template-2a-Petunjuk.png` | `src/10-Import-Template-2a-Petunjuk.dc.html` |
| 13.af · Import / Export · Import · Template Excel (.xlsx) · sheet Transaksi | `png/10-Import-Template.png` | `src/10-Import-Template.dc.html` |
| 13.ag · Import / Export · Import · Template Excel (.xlsx) · sheet Aset | `png/10-Import-Template-2b-Aset.png` | `src/10-Import-Template-2b-Aset.dc.html` |
| 13.ah · Import / Export · Import · Template Excel (.xlsx) · sheet Nilai bulanan | `png/10-Import-Template-2c-Nilai-Bulanan.png` | `src/10-Import-Template-2c-Nilai-Bulanan.dc.html` |
| 14.a · Anggota · Utama | `png/12-Anggota.png` | `src/12-Anggota.dc.html` |
| 14.b · Anggota · Tambah | `png/12-Anggota-2a-Tambah.png` | `src/12-Anggota-2a-Tambah.dc.html` |
| 14.c · Anggota · Ubah nama | `png/12-Anggota-2b-Ubah.png` | `src/12-Anggota-2b-Ubah.dc.html` |
| 14.d · Anggota · Hapus ditolak | `png/12-Anggota-2c-Hapus-Ditolak.png` | `src/12-Anggota-2c-Hapus-Ditolak.dc.html` |
| 14.e · Anggota · Hapus konfirmasi | `png/12-Anggota-2d-Hapus-Konfirmasi.png` | `src/12-Anggota-2d-Hapus-Konfirmasi.dc.html` |
| 14.f · Anggota · Sudah ditambah | `png/12-Anggota-2e-Tambah-Selesai.png` | `src/12-Anggota-2e-Tambah-Selesai.dc.html` |
| 15.a · Lokasi · Utama | `png/13-Lokasi.png` | `src/13-Lokasi.dc.html` |
| 15.b · Lokasi · Tambah | `png/13-Lokasi-2a-Tambah.png` | `src/13-Lokasi-2a-Tambah.dc.html` |
| 15.c · Lokasi · Ubah | `png/13-Lokasi-2b-Ubah.png` | `src/13-Lokasi-2b-Ubah.dc.html` |
| 15.d · Lokasi · Hapus ditolak | `png/13-Lokasi-2c-Hapus-Ditolak.png` | `src/13-Lokasi-2c-Hapus-Ditolak.dc.html` |
| 15.e · Lokasi · Hapus konfirmasi | `png/13-Lokasi-2d-Hapus-Konfirmasi.png` | `src/13-Lokasi-2d-Hapus-Konfirmasi.dc.html` |
| 15.f · Lokasi · Sudah ditambah | `png/13-Lokasi-2e-Tambah-Selesai.png` | `src/13-Lokasi-2e-Tambah-Selesai.dc.html` |
| 16.a · Piutang · Utama | `png/18-Piutang.png` | `src/18-Piutang.dc.html` |
| 16.b · Piutang · Belum ada | `png/18-Piutang-2a-Kosong.png` | `src/18-Piutang-2a-Kosong.dc.html` |
| 16.c · Piutang · Filter Lunas | `png/18-Piutang-2b-Lunas.png` | `src/18-Piutang-2b-Lunas.dc.html` |
| 16.d · Piutang · Catat, sekali bayar | `png/18-Piutang-2c-Catat-Sekali-Bayar.png` | `src/18-Piutang-2c-Catat-Sekali-Bayar.dc.html` |
| 16.e · Piutang · Catat, pilih pemberi pinjaman | `png/18-Piutang-2p-Catat-Pilih-Pemberi.png` | `src/18-Piutang-2p-Catat-Pilih-Pemberi.dc.html` |
| 16.f · Piutang · Catat, cicilan | `png/18-Piutang-2d-Catat-Cicilan.png` | `src/18-Piutang-2d-Catat-Cicilan.dc.html` |
| 16.g · Piutang · Detail dan jadwal cicilan | `png/18-Piutang-2e-Detail.png` | `src/18-Piutang-2e-Detail.dc.html` |
| 16.h · Piutang · Catat cicilan diterima | `png/18-Piutang-2f-Terima-Cicilan.png` | `src/18-Piutang-2f-Terima-Cicilan.dc.html` |
| 16.i · Piutang · Cicilan tersimpan | `png/18-Piutang-2g-Cicilan-Tersimpan.png` | `src/18-Piutang-2g-Cicilan-Tersimpan.dc.html` |
| 16.j · Piutang · Terlambat | `png/18-Piutang-2k-Terlambat.png` | `src/18-Piutang-2k-Terlambat.dc.html` |
| 16.k · Piutang · Catat, pilihan 1 tahun lagi | `png/18-Piutang-2l-Catat-Mulai-Melunasi.png` | `src/18-Piutang-2l-Catat-Mulai-Melunasi.dc.html` |
| 16.l · Piutang · Kalender tanggal mulai | `png/18-Piutang-2o-Pilih-Tanggal-Mulai.png` | `src/18-Piutang-2o-Pilih-Tanggal-Mulai.dc.html` |
| 16.m · Piutang · Ubah rencana pelunasan | `png/18-Piutang-2m-Ubah-Rencana.png` | `src/18-Piutang-2m-Ubah-Rencana.dc.html` |
| 16.n · Piutang · Ubah rencana · piutang terlambat | `png/18-Piutang-2n-Ubah-Rencana-Terlambat.png` | `src/18-Piutang-2n-Ubah-Rencana-Terlambat.dc.html` |
| 17.a · Google Sheet · Utama | `png/17-Google-Sheet.png` | `src/17-Google-Sheet.dc.html` |
| 17.b · Google Sheet · Ganti sheet | `png/17-Google-Sheet-2a-Ganti-Sheet.png` | `src/17-Google-Sheet-2a-Ganti-Sheet.dc.html` |
| 17.c · Google Sheet · Buat sheet baru | `png/17-Google-Sheet-2b-Buat-Sheet-Baru.png` | `src/17-Google-Sheet-2b-Buat-Sheet-Baru.dc.html` |
| 17.d · Google Sheet · Sheet baru dibuat | `png/17-Google-Sheet-2c-Sheet-Baru-Dibuat.png` | `src/17-Google-Sheet-2c-Sheet-Baru-Dibuat.dc.html` |
| 17.e · Google Sheet · Keluar dari akun | `png/17-Google-Sheet-2d-Keluar.png` | `src/17-Google-Sheet-2d-Keluar.dc.html` |
| 17.f · Google Sheet · Terputus | `png/17-Google-Sheet-2f-Terputus.png` | `src/17-Google-Sheet-2f-Terputus.dc.html` |
| 17.g · Google Sheet · Hubungkan ulang | `png/17-Google-Sheet-2g-Hubungkan-Ulang.png` | `src/17-Google-Sheet-2g-Hubungkan-Ulang.dc.html` |
| 17.h · Google Sheet · Unduh data lengkap | `png/17-Google-Sheet-2h-Unduh-Data-Lengkap.png` | `src/17-Google-Sheet-2h-Unduh-Data-Lengkap.dc.html` |
| L1 · Logo Hartafolio · 6 arah | `png/Logo-Hartafolio.png` | `src/Logo-Hartafolio.dc.html` |
| L2 · Logo bentuk unik · 8 arah | `png/Logo-Bentuk-Unik.png` | `src/Logo-Bentuk-Unik.dc.html` |
| A1 · Sitemap · arsitektur informasi | `png/Alur-1-Sitemap.png` | `src/Alur-1-Sitemap.dc.html` |
| A2 · Userflow · tugas utama | `png/Alur-2-Userflow.png` | `src/Alur-2-Userflow.dc.html` |
| A3 · Temuan · rusak, tidak jelas, ganda | `png/Alur-3-Temuan.png` | `src/Alur-3-Temuan.dc.html` |
| A4 · Audit · cara data masuk | `png/Alur-4-Audit-Input.png` | `src/Alur-4-Audit-Input.dc.html` |
| A5 · Template Hartafolio · format baku | `png/Alur-5-Template.png` | `src/Alur-5-Template.dc.html` |
| A6 · Audit · copy semua layar | `png/Alur-6-Audit-Copy.png` | `src/Alur-6-Audit-Copy.dc.html` |
| A7 · Audit · komponen dan interaksi | `png/Alur-7-Audit-Komponen.png` | `src/Alur-7-Audit-Komponen.dc.html` |
| A8 · Import · aturan semua kondisi | `png/Alur-8-Import-Aturan.png` | `src/Alur-8-Import-Aturan.dc.html` |
| D00 · Splash | `png/WD-Splash.png` | `src/WD-Splash.dc.html` |
| D01.a · Setup · 2 · Anggota | `png/WD-Setup-2.png` | `src/WD-Setup-2.dc.html` |
| D01.b · Setup · 2 · Hubungan terbuka | `png/WD-Setup-2-Hubungan.png` | `src/WD-Setup-2-Hubungan.dc.html` |
| D01.c · Setup · 4 · Import (opsional) | `png/WD-Setup-4.png` | `src/WD-Setup-4.dc.html` |
| D01.d · Setup · 4 · Periksa | `png/WD-Setup-4-Periksa.png` | `src/WD-Setup-4-Periksa.dc.html` |
| D01.e · Setup · 4 · Lengkapi aset | `png/WD-Setup-4-Lengkapi.png` | `src/WD-Setup-4-Lengkapi.dc.html` |
| D02.a · Beranda · Utama | `png/WD-Beranda.png` | `src/WD-Beranda.dc.html` |
| D02.b · Beranda · Kosong | `png/WD-Beranda-Kosong.png` | `src/WD-Beranda-Kosong.dc.html` |
| D02.c · Beranda · Zakat hari H | `png/WD-Beranda-Zakat.png` | `src/WD-Beranda-Zakat.dc.html` |
| D02.d · Beranda · Tersimpan, baris disorot | `png/WD-Beranda-Toast.png` | `src/WD-Beranda-Toast.dc.html` |
| D02.e · Beranda · Lonceng terbuka | `png/WD-Beranda-Perhatian.png` | `src/WD-Beranda-Perhatian.dc.html` |
| D03 · Aset | `png/WD-Aset.png` | `src/WD-Aset.dc.html` |
| D04.a · Kelola aset · Utama | `png/WD-Kelola.png` | `src/WD-Kelola.dc.html` |
| D04.b · Kelola aset · Isi harga | `png/WD-Kelola-Ubah.png` | `src/WD-Kelola-Ubah.dc.html` |
| D05.a · Catat · Utama | `png/WD-Catat.png` | `src/WD-Catat.dc.html` |
| D05.b · Catat · Pilih tanggal | `png/WD-Catat-Tanggal.png` | `src/WD-Catat-Tanggal.dc.html` |
| D05.c · Catat · Kurs manual | `png/WD-Catat-Kurs.png` | `src/WD-Catat-Kurs.dc.html` |
| D06.a · Riwayat · Utama | `png/WD-Riwayat.png` | `src/WD-Riwayat.dc.html` |
| D06.b · Riwayat · Rincian | `png/WD-Riwayat-Detail.png` | `src/WD-Riwayat-Detail.dc.html` |
| D07 · Alat | `png/WD-Lainnya.png` | `src/WD-Lainnya.dc.html` |
| D08.a · Laporan · Utama | `png/WD-Laporan.png` | `src/WD-Laporan.dc.html` |
| D08.b · Laporan · Export | `png/WD-Laporan-Export.png` | `src/WD-Laporan-Export.dc.html` |
| D10.a · Zakat mal · Utama | `png/WD-Zakat.png` | `src/WD-Zakat.dc.html` |
| D10.b · Zakat mal · Catat pembayaran | `png/WD-Zakat-Bayar.png` | `src/WD-Zakat-Bayar.dc.html` |
| D11 · Nishob | `png/WD-Nishob.png` | `src/WD-Nishob.dc.html` |
| D12 · Harga terkini | `png/WD-Harga.png` | `src/WD-Harga.dc.html` |
| D13.a · Import / Export · Utama | `png/WD-Import.png` | `src/WD-Import.dc.html` |
| D13.b · Import / Export · Periksa | `png/WD-Import-Periksa.png` | `src/WD-Import-Periksa.dc.html` |
| D14 · Anggota | `png/WD-Anggota.png` | `src/WD-Anggota.dc.html` |
| D17 · Google Sheet | `png/WD-GSheet.png` | `src/WD-GSheet.dc.html` |
| T00 · Splash | `png/WT-Splash.png` | `src/WT-Splash.dc.html` |
| T01.a · Setup · 2 · Anggota | `png/WT-Setup-2.png` | `src/WT-Setup-2.dc.html` |
| T01.b · Setup · 2 · Hubungan terbuka | `png/WT-Setup-2-Hubungan.png` | `src/WT-Setup-2-Hubungan.dc.html` |
| T01.c · Setup · 4 · Import (opsional) | `png/WT-Setup-4.png` | `src/WT-Setup-4.dc.html` |
| T01.d · Setup · 4 · Periksa | `png/WT-Setup-4-Periksa.png` | `src/WT-Setup-4-Periksa.dc.html` |
| T01.e · Setup · 4 · Lengkapi aset | `png/WT-Setup-4-Lengkapi.png` | `src/WT-Setup-4-Lengkapi.dc.html` |
| T02.a · Beranda · Utama | `png/WT-Beranda.png` | `src/WT-Beranda.dc.html` |
| T02.b · Beranda · Kosong | `png/WT-Beranda-Kosong.png` | `src/WT-Beranda-Kosong.dc.html` |
| T02.c · Beranda · Lonceng terbuka | `png/WT-Beranda-Perhatian.png` | `src/WT-Beranda-Perhatian.dc.html` |
| T03 · Aset | `png/WT-Aset.png` | `src/WT-Aset.dc.html` |
| T04 · Kelola aset | `png/WT-Kelola.png` | `src/WT-Kelola.dc.html` |
| T05 · Catat | `png/WT-Catat.png` | `src/WT-Catat.dc.html` |
| T06.a · Riwayat · Utama | `png/WT-Riwayat.png` | `src/WT-Riwayat.dc.html` |
| T06.b · Riwayat · Rincian | `png/WT-Riwayat-Detail.png` | `src/WT-Riwayat-Detail.dc.html` |
| T07 · Alat | `png/WT-Lainnya.png` | `src/WT-Lainnya.dc.html` |
| T08 · Laporan | `png/WT-Laporan.png` | `src/WT-Laporan.dc.html` |
| T10 · Zakat mal | `png/WT-Zakat.png` | `src/WT-Zakat.dc.html` |
| T12 · Harga terkini | `png/WT-Harga.png` | `src/WT-Harga.dc.html` |
| T13 · Import / Export | `png/WT-Import.png` | `src/WT-Import.dc.html` |
| T14 · Anggota | `png/WT-Anggota.png` | `src/WT-Anggota.dc.html` |
| R0 · Arsip · pengantar | `png/Arsip-0-Pengantar.png` | `src/Arsip-0-Pengantar.dc.html` |
| R1 · Arsip · Langkah 4 dengan segmented control | `png/Arsip-Setup-4-Segmented.png` | `src/Arsip-Setup-4-Segmented.dc.html` |
| R2 · Alasan ditolak · Langkah 4 segmented | `png/Arsip-Alasan-Setup-4.png` | `src/Arsip-Alasan-Setup-4.dc.html` |
| R3 · Arsip · Beranda lama | `png/Arsip-Beranda-Lama.png` | `src/Arsip-Beranda-Lama.dc.html` |
| R4 · Alasan ditolak · Beranda lama | `png/Arsip-Alasan-Beranda-Lama.png` | `src/Arsip-Alasan-Beranda-Lama.dc.html` |
| R5 · Arsip · Desktop langkah 4 dengan segmented control | `png/Arsip-WD-Setup-4-Segmented.png` | `src/Arsip-WD-Setup-4-Segmented.dc.html` |
| R6 · Alasan ditolak · Desktop langkah 4 segmented | `png/Arsip-Alasan-WD-Setup-4.png` | `src/Arsip-Alasan-WD-Setup-4.dc.html` |
