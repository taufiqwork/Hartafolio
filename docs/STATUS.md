# Status build (diperbarui 24 Nov 2026)

Dokumen serah-terima antar sesi. Baca ini dulu, lalu `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/REGRESSION.md`, lalu `docs/BUILD_PLAN.md`.

## Selesai (Tahap 0 sampai 3)
- **0–1 Kerangka dan fondasi**: struktur folder, build ke `dist/` (HTML dengan CSS, JS, font base64 inline), shell 5 tab (Beranda, Aset, tombol Catat, Riwayat, Alat), halaman uji komponen (`?page=components`, atau `components.html` di `npm run dev`), `src/engine/format.js` (Rupiah, persen, gram, tanggal). Isi layar tab masih placeholder "Layar ini dibangun pada tahap berikutnya."
- **2 Struktur Sheet**: `src/engine/schema.js` (11 tab, kolom, tipe, pilihan, setelan awal, cek header, ID), `catalog.js` (13 aset bawaan), `src/gas/Setup.js` (menu Hartafolio › Siapkan sheet, idempoten, header terkunci), `src/gas/Repo.js` (baca/tulis, `apiState`, `apiTransaksiTambah` idempoten menurut `trx_id`, `apiTransaksiUbah`).
- **3 Engine + uji**: `ledger.js` (saldo, validasi, modal rata-rata), `kurs.js`, `valuation.js`, `zakat.js`, `piutang.js`, `queue.js`, `dates.js`. 44 uji lulus (`npm test`), termasuk uji lapisan Apps Script dengan Sheet tiruan.
- Detail dan keputusan: `docs/CHANGELOG.md`. Commit terakhir: `8c34634` (Tahap 2 dan 3).

## Sudah dicoba di Google sungguhan (24 Nov 2026)
`npm run push` dan menu Hartafolio › Siapkan sheet **berhasil** di Sheet uji milik Ticon (akun pengembang): 11 tab urut benar, Aset 13 baris, Pengaturan 8 baris, Transaksi 28 kolom, dijalankan dua kali tidak dobel, "Header Hartafolio" terlindungi (dicek di tab Transaksi). Syarat satu kali: Apps Script API dinyalakan di script.google.com/home/usersettings, dan `npm run push` memakai `clasp push --force` bila manifest berubah.

**Masih BELUM dicoba di Google:** `doGet` (tampilan web app), `apiState`, `apiTransaksiTambah`, `apiTransaksiUbah`, menu "Periksa struktur", dan penguncian di tab selain Transaksi. Dicoba ketika layar Beranda pertama memakainya.

## Keputusan yang sudah diambil (jangan tanya ulang)
- Stack: Google Apps Script web app + Google Sheet, template salinan, library pusat plus pembungkus tipis. Hanya Pengelola login.
- Pindah = satu baris (dua sisi dihitung engine). Biaya Pindah = kolom `biaya` di baris Pindah (28 Nov). Jadwal piutang diturunkan (tanpa tab Piutang_Jadwal).
- Jenis aset memakai 8 pilihan dari form "Aset manual" (Emas, Perak, Crypto, Saham, Reksa dana, Mata uang, Properti, Lainnya); mockup menang atas DATA_MODEL.md (yang menulis 5).
- Kolom Transaksi v2: `harga_mata_uang` dan `kurs` (bukan `mata_uang`/`kurs_usdidr` v1). Aset punya `status` (aktif|tersembunyi|dihapus) dan `mata_uang_harga`.
- Pembagian kerja data: Sheet menyimpan; `apiState()` mengirim seluruh data ke klien; klien menghitung layar dengan engine yang sama (engine diinline ke `Index.html` oleh `tools/build.mjs`). Penulisan selalu lewat `api*` di server, yang memvalidasi ulang.
- Antrean offline: `queue.js` + penyimpanan di perangkat (localStorage, dibungkus try/catch); kirim lewat `apiTransaksiTambah` dengan `trx_id` dari `schema.newTrxId`.

## Tahap 4 sedang berjalan
## Tahap 5 (Catat dan Riwayat): keputusan Ticon (25 Nov 2026), baca sebelum membangun
1. **Harga dan kurs di Catat:** dengan `?demo` memakai harga dan kurs contoh dan menyimpan hanya di perangkat (tidak ke Sheet). Tanpa `?demo` (data asli) harga dan kurs diisi manual (tampilan seperti board 04-Catat-2s "Kurs diisi manual") sampai sumber otomatis jadi di Tahap 6. Angka contoh TIDAK BOLEH ikut tersimpan ke Sheet (harga dan kurs dibekukan per transaksi).
2. **Urutan:** Catat lengkap dulu, Riwayat belakangan. Putaran A: Beli, Jual, Masuk, Keluar + pilih tanggal dan alat bayar (04-Catat, 2a, 2b, 2k, 2m, 2n, 2o, 2p, 2q, 2r, 2s). B: Pindah (2c, 2e, 2f). C: Saldo awal (2d, 2g) + sheet Cari aset, Lokasi baru, Aset manual (2h, 2i, 2j). D: Riwayat (05-Riwayat dan state-nya). E: ubah (04-Catat-2l), hapus dan pulihkan, Beranda memakai data asli (`HF.beranda.fromState`).
3. Tiap putaran: baca board dan kumpulkan pertanyaan dulu; sumber board dari `reference/mockups/src` (segarkan dari artifact); skenario piksel semua state termasuk animasi; merge; deploy.
4. Detail Riwayat untuk Zakat, Pinjamkan, Cicilan, Pelunasan hanya tampilan (data contoh) sampai Tahap 7.

**Putaran A, B, C Catat selesai (25 Nov 2026), lihat CHANGELOG.** Kolom `alat_bayar_lokasi_id` sudah dibangun (skema v2; migrasi terverifikasi di Sheet uji 25 Nov). Berikutnya: board foto/pajak/catatan, putaran D (Riwayat), E (Ubah, hapus, pulihkan, Beranda dari data nyata).

## Beranda: keputusan Ticon (25 Nov 2026), baca sebelum membangun
1. **Pakai data contoh (demo) yang bisa dihapus**, jangan menyembunyikan fitur utama. Beranda harus tampil penuh seperti mockup: total, grafik kecil, "dari Okt", baris dolar, donut, daftar, kartu Harga terkini, banner zakat/piutang, lonceng.
2. **Desain data contoh:** satu modul terpisah (`src/demo/`, mis. `demo.js`) berisi data mentah (anggota Azlan, Al Ghafiqi, M. Yahya, Yumna; lokasi; transaksi Saldo awal; harga contoh; riwayat 6 bulan; kurs) yang dirancang agar HASIL HITUNG engine sama dengan angka mockup (Rp 174,2 jt, +2,4%, $ 9.979, piutang Rp 19,3 jt, dst.). UI membaca view-model dari engine, bukan angka yang ditulis tangan. Aktif lewat `?demo` (dev dan web app); data nyata di Sheet tidak tersentuh. Menghapus fitur demo = hapus folder dan satu baris pemanggil. Skenario piksel Beranda memakai data ini.
3. **Urutan bertahap.** Tahap A: kerangka, total, donut, daftar, kosong, banyak anggota (Sisanya), menu dan pilihan (Main, 2a, 2b, 2c, 2d, 2k, 2l, 2m, 2n). Tahap B: banner zakat dan piutang, lonceng, toast (2e sampai 2j, 2o sampai 2r, 2h). Tiap tahap: skenario piksel semua state, merge, deploy.
4. Tautan ke layar yang belum dibangun (Laporan, Piutang, Harga, Catat, Aset, Riwayat, Alat) dimatikan, kecuali tab shell.

**Beranda selesai (25 Nov 2026): tahap A dan B, 57 perbandingan piksel 0 beda. Berikutnya: Tahap 5 (Catat transaksi dan Riwayat), yang juga menghubungkan data nyata ke Beranda (`fromState`).** Data contoh = angka tampilan di `src/demo/demo.js` (bukan transaksi), lihat CHANGELOG.

**Selesai (24 Nov 2026):** Setup langkah 1 sampai 4 (langkah 4 tahap Pilih file; Import sungguhan di Tahap 8). **Berikutnya:** uji web app di Google (deploy), lalu Beranda.

## Rencana awal Tahap 4 (Setup dan Beranda)
1. Konfirmasi `clasp push` dan Siapkan sheet berjalan di Sheet sungguhan.
2. Layar Setup (akun, anggota, lokasi, import), ikuti board `01-Setup-*` di mockup. Endpoint baru: tambah anggota, tambah lokasi, simpan setelan (pakai `Repo_append_` dan `schema.nextId`).
3. Beranda: kartu total (3 tingkat), sparkline, donut per kelas, daftar, banner zakat/piutang dan lonceng, kartu "Harga terkini". Data dari `apiState()`; hitungan dari `HF.ledger`, `HF.valuation`, `HF.zakat`, `HF.piutang`.
4. Tiap layar: bandingkan dengan board mockup (state kosong, error, sheet, toast ikut), jalankan `npm test`, catat di CHANGELOG, commit.

## Belum ada di kode (jadwal tahap berikutnya)
Trigger harga terjadwal dan sumber harga (CoinGecko, logam, saham, kurs), trigger snapshot bulanan, Riwayat_Nilai, laporan, import/export template, tablet/desktop, uji salin ke 2–3 akun, panduan setup dan video.

## Urusan sesi desain (bukan tugas build; laporkan ke Ticon bila ketemu)
- DATA_MODEL.md masih menulis 5 kelas aset dan kolom v1 di beberapa tempat.
- Banner/lonceng/tautan piutang di Beranda tablet dan desktop belum final; sitemap A1 belum memuat Piutang; Adendum 1 belum diperbarui lebih lanjut.
- Prototype klien hanya diterbitkan atas permintaan Ticon.

## Referensi desain (artifact milik Ticon)
Mockup, Design System, prototype, log, adendum, dan riset ada di artifact (tautan di `docs/LINKS.md`); folder `reference/` hanya cadangan. Bila `reference/` tidak ada, buka artifact lewat tautan itu.
