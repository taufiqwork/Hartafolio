# Changelog build

## 21 Nov 2026 · Tahap 0 dan 1 (kerangka dan fondasi)
- Kerangka: `src/engine` (JS murni, dipakai Node/Apps Script/browser), `src/gas` (Apps Script), `src/web` (tampilan), `tests/`, `tools/build.mjs`.
- `npm run build` membangun `dist/` (Index.html dan Components.html dengan CSS dan JS inline; HtmlService tidak melayani file statis). `npm run dev` menyajikan `dist/` di http://localhost:8080 (`/index.html`, `/components.html`). `npm test` menjalankan uji engine.
- Sumber gaya: `docs/design/tokens.css` + `docs/design/bundle.css` (tetap satu-satunya sumber komponen); `src/web/css/shell.css` hanya tata letak halaman.
- `src/engine/format.js`: Rupiah penuh/ringkas ("Rp 174,2 jt", "Rp 1,48 M"), persen bertanda dengan minus asli, gram, USD, tanggal, "Hari ini · 9 Nov". Diuji dengan nilai dari mockup.
- Shell: bottom bar 5 tab (Beranda, Aset, tombol Catat, Riwayat, Alat), rute hash, isi layar placeholder.
- Halaman uji komponen (terang/gelap): tombol, chip, toggle, select, input, kartu total, lencana, rincian, perlu perhatian, sheet, toast, bottom bar.
- Bentrok mockup vs teks Design System: tab kelima di mockup adalah **Alat** (ikon kunci inggris), sedangkan design-system.md "Icons" masih menulis "Lainnya = circle-ellipsis". Mengikuti mockup. **Selesai**: teks di Design System sudah diperbaiki (v82), `docs/design/design-system.md` disalin dari versi itu.
- Kekurangan yang disengaja: Catat belum modal, safe-area memakai `env()` (mockup memakai bingkai 47/34 px), isi layar tab masih placeholder dan dibangun bertahap sesuai `docs/BUILD_PLAN.md`.

## 21 Nov 2026 · Perbaikan font dan teks
- Font Plus Jakarta Sans (400 sampai 800, subset latin, SIL OFL) kini ditanam sebagai data URI oleh `tools/build.mjs` dari `src/web/fonts/`. Tidak lagi memakai Google Fonts: tampil walau jaringan terbatas dan di dalam sandbox HtmlService. Lisensi di `src/web/fonts/OFL-LICENSE.txt`.
- `docs/design/design-system.md` diperbarui ke v82 (menu Alat menggantikan Lainnya di teks).

## 21 Nov 2026 · Tahap 2 dan 3 (struktur Sheet dan engine)
**Tahap 2: struktur Sheet**
- `src/engine/schema.js`: 11 tab, urutan kolom, tipe, daftar pilihan, setelan awal (`versi_skema=1`, `haul_hari=354` ditambahkan), pemeriksaan header (kolom tambahan di kanan boleh), konversi baris ⇄ objek, ID baru (PM-001, TX-20261103-0007) tanpa pemakaian ulang.
- `src/engine/catalog.js`: 13 aset bawaan (Emas, Perak, PAXG, XAUT, BTC, ETH, USDT, USD, IDR, BBRI, BBCA, ANTM, GFI). Zakat hanya Emas dan Perak; token emas memakai `gram_per_unit` 31,1035.
- `src/gas/Setup.js`: menu Hartafolio › Siapkan sheet (membuat tab, header terkunci, format teks untuk tanggal dan ID, setelan awal, katalog; aman dijalankan ulang). `src/gas/Repo.js`: baca/tulis baris dengan pemeriksaan header, `apiState`, `apiTransaksiTambah` (idempoten menurut `trx_id`, validasi saldo, kunci dokumen), `apiTransaksiUbah` (jenis dan ID tidak berubah, hapus = status dihapus).

**Tahap 3: engine (JS murni, diuji)**
- `ledger.js`: saldo per anggota × aset × lokasi dari Transaksi aktif; Pindah satu baris (dua sisi dihitung engine); bayar dengan aset seperti swap; validasi (saldo tidak boleh minus, ID ganda, kurs wajib untuk mata uang asing); modal rata-rata dan untung terealisasi (Saldo awal tanpa harga = modal tidak diketahui; modal ikut pindah dan ikut pinjaman).
- `kurs.js`: hari ini live, tanggal lampau rata-rata harian, manual menang, dibekukan saat simpan.
- `valuation.js`: harga ke Rupiah, tiga tingkat total (anggota, pengelola, salinan), rincian per kelas, piutang masuk total pemberi, untung/rugi hanya bagian bermodal.
- `zakat.js`: emas dan perak per anggota (nisab, haul 354 hari, turun di bawah nisab mengosongkan, bayar menutup haul dan haul baru mulai di tanggal bayar hanya bila sisa ≥ nisab, status berjalan/jatuh tempo/terlambat/dibayar, aset yang dipinjamkan tidak dihitung).
- `piutang.js`: jadwal turunan (akhir bulan mundur), cicilan paling lama dilunasi dulu, status terlambat dihitung, jenis penerimaan, pembuat transaksi Pinjamkan dan penerimaan.
- `queue.js`: antrean offline dan dedup idempoten sisi server.
- `tests/`: 44 uji (termasuk lapisan Apps Script dengan Sheet tiruan di memori).

**Keputusan dan bentrok untuk dibawa ke sesi desain**
- Pindah disimpan **satu baris** (sesuai rekomendasi). Jadwal piutang **diturunkan** (tanpa tab Piutang_Jadwal). Biaya Pindah = transaksi Keluar sendiri (sesuai DATA_MODEL dan design-system.md), bukan kolom di baris Pindah.
- Bentrok: DATA_MODEL.md menulis `kelas` = 5 nilai, sedangkan form "Aset manual" di mockup/design-system memakai 8 Jenis (Emas, Perak, Crypto, Saham, Reksa dana, Mata uang, Properti, Lainnya). Mengikuti mockup. Satuan mengikuti form: gram, oz, koin, token, lot, lembar, unit, nominal, m².
- Bentrok: v1 menamai kolom `mata_uang`/`kurs_usdidr`; v2 memakai `harga_mata_uang`/`kurs`. Mengikuti v2. Aset mendapat kolom `status` (aktif|tersembunyi|dihapus) menggantikan `aktif`; `mata_uang_harga` ditambahkan (GFI dalam USD).

## 24 Nov 2026 · Persiapan uji di Google Sheet sungguhan
- Bug yang hanya muncul di Google: Sheet baru berukuran 1000 baris x 26 kolom, sedangkan Siapkan sheet memformat 2000 baris dan tab Transaksi punya 28 kolom. Menulis di luar grid melempar galat. Perbaikan: `Repo_ensureGrid_` menambah baris/kolom sebelum Setup menulis dan sebelum `Repo_append_` menambah baris.
- Sheet tiruan di `tests/gas.test.js` sekarang meniru batas grid 1000 x 26 (sebelumnya tanpa batas, jadi bug ini lolos). Diuji dulu gagal 5 dari 5, lalu 44 uji lulus setelah perbaikan.
- BELUM TERVERIFIKASI di Google: perilaku batas grid ditiru dari pengetahuan tentang Sheets, bukan dari uji nyata. `clasp` belum terpasang dan belum login di mesin ini; `clasp push` dan menu Siapkan sheet harus dijalankan Ticon.

## 24 Nov 2026 · Aturan kerja anti-regresi (dari Kickstart Kit Solide)
- Baru: `docs/REGRESSION.md` (daftar yang tidak boleh rusak, tertaut ke 44 uji, plus cek layar identik mockup dengan ukuran nyata), `docs/ARCHITECTURE.md` (peta fitur ke berkas, jalur antar-bagian, rencana struktur layar Tahap 4, area sensitif).
- `CLAUDE.md`: bahasa balasan dibuat sederhana; bagian Anti-regresi, Cara menulis kode (satu berkas satu urusan, alarm sekitar 400 baris), Jebakan, dan Definition of Done.
- Tidak diambil dari kit: BUILD-BRIEF (sudah dipenuhi `BUILD_PLAN.md` dan `STATUS.md`) dan aturan git (aturan global Ticon sudah mengaturnya).
- Alat ukur otomatis kecocokan mockup (skill mockup-match) belum dipasang di proyek ini. Mockup di sini berbentuk `.dc.html`, bukan `design-spec.json`, jadi cek kecocokan masih dengan membaca nilai nyata dari halaman. BELUM TERVERIFIKASI bahwa cara itu cukup; dinilai setelah layar Setup pertama.

## 24 Nov 2026 · Uji pertama di Google sungguhan
- `npx clasp push --force` mengirim 16 berkas ke Sheet uji; Hartafolio › Siapkan sheet berhasil: 11 tab urut benar, Aset 13, Pengaturan 8, Transaksi 28 kolom, dua kali jalan tidak dobel, "Header Hartafolio" terlindungi di tab Transaksi (dicek lewat Data › Protect sheets and ranges).
- Dua hal yang baru ketahuan di Google: Apps Script API harus dinyalakan sekali di akun pengembang; `npm run push` tanpa `--force` melompati pengiriman tanpa pesan ketika manifest berubah. Dicatat di CLAUDE.md.
- Akun pengembang pertama tidak bisa membuka Apps Script, diganti dengan `npx clasp logout` lalu `npx clasp login`.
- Belum dicoba: tampilan web app, `api*`, "Periksa struktur", penguncian di tab selain Transaksi.
