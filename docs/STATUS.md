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
- Pindah = satu baris (dua sisi dihitung engine). Biaya Pindah = transaksi Keluar sendiri. Jadwal piutang diturunkan (tanpa tab Piutang_Jadwal).
- Jenis aset memakai 8 pilihan dari form "Aset manual" (Emas, Perak, Crypto, Saham, Reksa dana, Mata uang, Properti, Lainnya); mockup menang atas DATA_MODEL.md (yang menulis 5).
- Kolom Transaksi v2: `harga_mata_uang` dan `kurs` (bukan `mata_uang`/`kurs_usdidr` v1). Aset punya `status` (aktif|tersembunyi|dihapus) dan `mata_uang_harga`.
- Pembagian kerja data: Sheet menyimpan; `apiState()` mengirim seluruh data ke klien; klien menghitung layar dengan engine yang sama (engine diinline ke `Index.html` oleh `tools/build.mjs`). Penulisan selalu lewat `api*` di server, yang memvalidasi ulang.
- Antrean offline: `queue.js` + penyimpanan di perangkat (localStorage, dibungkus try/catch); kirim lewat `apiTransaksiTambah` dengan `trx_id` dari `schema.newTrxId`.

## Berikutnya: Tahap 4 (Setup dan Beranda)
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
