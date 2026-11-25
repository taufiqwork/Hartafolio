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

## 24 Nov 2026 · Tahap 4 (bagian 1): Setup langkah 1 sampai 3
**Dibangun:** splash, langkah 1 Akun, 2 Anggota, 3 Lokasi, form bersama (hfForm) untuk tambah/ubah anggota dan lokasi. Server: `src/gas/Master.js` (tambah/ubah/hapus-lunak anggota dan lokasi, `apiSetupSelesai`), 3 uji baru (47 uji lulus). Gaya masuk `docs/design/bundle.css` (blok "Setup", kelas `su-*`), tanpa gaya inline di layar.
**Terukur terhadap mockup (24 Nov 2026):** langkah 1, 2 kosong, 2 terisi, 3 kosong, 3 terisi, form anggota (hubungan terbuka), form lokasi (jenis terbuka): posisi dan tinggi semua elemen yang diukur sama dengan PNG mockup. Chip Tambah cepat bergeser sampai 2px pada satu chip (lebar teks pecahan), belum dipastikan.
**Keputusan Ticon:** langkah 1 hanya melanjutkan (login sudah ditangani Google; "Buat sheet baru" dan "Ganti sheet" diputuskan di Tahap 9). Langkah 4: hanya "Mulai kosong" dulu; tahap Import ikut Tahap 8.
**Untuk sesi desain (mockup menang, dilaporkan):**
- Mockup menyembunyikan tombol "Tambah anggota" setelah 4 anggota; ini artefak demo, di kode tombol selalu ada.
- Jenis lokasi: mockup "Simpanan fisik", DATA_MODEL/design-system "Simpanan fisik di rumah". Kode mengikuti mockup (enum di `schema.js` diubah).
- Pengaturan awal masih berisi `tanggal_snapshot`, padahal design-system menyatakan setelan itu dihapus (snapshot tetap tanggal 1).
- design-system menyebut board 4b (Mulai kosong), tetapi board itu tidak ada di artifact mockup. Perlu dijawab sebelum langkah 4.
- Tidak digambar mockup, dibuat minimal: teks galat di form (nama ganda, dll.) dan teks galat di splash bila data gagal dimuat.
**BELUM TERVERIFIKASI:** di Google sungguhan (web app belum di-deploy, `google.script.run` belum dicoba), splash, mode gelap, layar anggota terisi dengan menu hubungan terbuka, 3b/3c/3d. Di `npm run dev` layar memakai tiruan localStorage, bukan Sheet.

## 24 Nov 2026 · Tahap 4 (bagian 2): Setup langkah 4 (Import, tahap Pilih file)
- Dibangun persis seperti board `01-Setup-4a-Belum-Pilih`: bar dengan segmen keempat terbagi 3 tanda, judul "Punya catatan lama?", kartu dua langkah, footer "Lewati, mulai dari nol". Terukur sama dengan PNG: kartu 230 sampai 497, pemisah 363, garis footer 711, tombol 724.
- **Keputusan Ticon:** fungsi yang belum dibangun dimatikan. "Template tabel Hartafolio" dan "Pilih file template" tampil nonaktif (di mockup keduanya aktif); pembaca .xlsx dan template dibangun di Tahap 8. "Lewati, mulai dari nol" aktif: menandai Setup selesai dan membuka aplikasi.
- Koreksi pertanyaan saya sebelumnya: board 4b tidak diperlukan. design-system menyatakan "Board 4b (Nol) is removed; start empty is the skip button", dan mockup 4a memang tanpa segmented. Baris lama di design-system yang masih menyebut 4b dan segmented perlu dirapikan di sesi desain.
- Dev saja: buka `http://localhost:8080/?reset` untuk memulai Setup dari awal (menghapus data tiruan di browser).
- BELUM TERVERIFIKASI: di Google sungguhan; tahap Periksa, Lengkapi, Simpan, Selesai (Tahap 8).

## 24 Nov 2026 · Perapian dokumen (diminta Ticon diselesaikan di sesi ini)
- `DATA_MODEL.md`: kelas aset menjadi 8 jenis sesuai mockup, kolom `status` dan `mata_uang_harga` dicatat, jenis lokasi "Simpanan fisik", Pengaturan tanpa `tanggal_snapshot` (ditambah `haul_hari`, `setup_selesai`), dua pertanyaan lama ditandai sudah diputuskan.
- `design-system.md`: baris Setup 4/4a/4b ditulis ulang sesuai board 4a (tanpa segmented, tanpa 4b); "Simpanan fisik di rumah" menjadi "Simpanan fisik".
- Kode: `tanggal_snapshot` dihapus dari setelan awal (`schema.js`); uji Pengaturan 8 menjadi 7. Sheet uji yang sudah dibuat tetap punya baris itu; tidak berbahaya dan tidak dibaca.
- **Belum dikerjakan karena itu keputusan desain, bukan perapian:** banner/lonceng/tautan piutang di Beranda tablet dan desktop, sitemap A1 yang belum memuat Piutang, Adendum 1. Dan belum disentuh: salinan online Design System dan mockup di claude.ai (perubahan di atas baru di berkas repo).

## 24 Nov 2026 · Setup terasa lambat di Google (laporan Ticon, 3 kasus)
- **Penyebab:** setelah tiap simpan, layar menunggu server lalu memuat ulang seluruh data (`apiState` membaca 9 tab). Di Google itu 3 sampai 5 detik; di `npm run dev` instan, jadi tidak terlihat sebelumnya. Kasus yang sama: simpan anggota, Tambah cepat lokasi, dan "Lewati, mulai dari nol".
- **Perbaikan:** tampilan berubah dulu, server menyusul di belakang (baris langsung muncul, sheet langsung tutup, lanjut ke Beranda langsung). Bila server gagal: perubahan dibatalkan, form dibuka lagi dengan isian tetap dan pesan galat; untuk tambah cepat dan hapus, pesan tampil di baris bawah. Tidak ada lagi pemuatan ulang setelah simpan. Pembukaan aplikasi memakai `apiBootState` (3 tab, bukan 9).
- **Terukur** dengan server dibuat lambat 4 detik: 41 ms (tambah cepat), 56 ms (simpan anggota), 62 ms (lewati); kasus gagal membatalkan dan menampilkan pesan. 48 uji lulus.
- **Belum digambar mockup:** keadaan "menyimpan" dan pesan galat penyimpanan. Dibuat minimal (teks galat merah di footer/form). BELUM TERVERIFIKASI di Google sungguhan.
- Baris yang baru dikirim (id sementara) belum bisa diketuk ubah sampai server menjawab.

## 24 Nov 2026 · Board state menyimpan dan gagal (diminta Ticon, ditambahkan ke artifact mockup)
- 5 board baru di kolom di kanan 17 Google Sheet (flow 18, file `19-Simpan*`). Dibuat tanpa membuka render (aturan tipe artifact), jadi BELUM DILIHAT: periksa tampilannya di artifact.
- **Kode belum mengikuti board ini** (mockup menang): baris "Menyimpan…" dengan putar, tombol "Coba lagi", judul notice ("Belum tersimpan", "Nama sudah dipakai"), dan kartu notice di atas daftar/kartu import. Sekarang kode masih menampilkan teks galat merah di footer dan di form. Perlu satu putaran penyesuaian setelah Ticon menyetujui board.

## 25 Nov 2026 · Kode mengikuti board Simpan ke Sheet (18.a sampai 18.e)
- Baris baru menampilkan "Anak · Menyimpan…" dengan ikon putar dan tombol ubah redup (nonaktif). Gagal: form dibuka lagi dengan kartu notice "Belum tersimpan", isian tetap, tombol "Coba lagi"; nama ganda: "Nama sudah dipakai" dengan tombol semula. Tambah cepat gagal: kartu "<nama> belum tersimpan" di atas daftar. "Lewati" gagal: kembali ke langkah 4 dengan kartu di atas kartu import. Teks galat merah lama di footer dihapus.
- Bug yang ketahuan saat uji: bila "Lewati" gagal, Setup dibuka ulang dari langkah 1 dengan data kosong. Sekarang kembali ke langkah 4 dengan data yang sudah ada.
- Terukur di DOM: notice padding 12/16, radius 12, gap 12, judul 15/22/600, latar `loss-soft`; urutan blok sama dengan board. PNG board belum diekspor, jadi belum dibandingkan piksel demi piksel.
- Tidak digambar board dan dibuat sama polanya: baris lokasi yang menyimpan hanya redup (tanpa teks "Menyimpan…"), dan kegagalan hapus memakai notice umum "Belum tersimpan". Sebelumnya gagal dengan pesan server mentah; sekarang semua galat non-nama-ganda dianggap "Google Sheet tidak merespons" (belum membedakan penyebab lain).
- BELUM TERVERIFIKASI di Google sungguhan.

## 25 Nov 2026 · Perbandingan piksel otomatis (diminta Ticon)
- Alat baru `npm run pixel` (`tools/pixel/`): me-render board asli dari `reference/mockups/src` (dengan runtime board di `reference/mockups/runtime/`) dan aplikasi pada 390×844 @1x memakai Chrome, lalu membandingkan piksel. 17 skenario: Splash, Setup 1 sampai 4a (semua state yang dibangun) dan 5 board Simpan ke Sheet.
- **Selisih nyata yang tertangkap:** `-webkit-font-smoothing: antialiased` di `shell.css` membuat semua teks aplikasi lebih tipis dari mockup (lolos dari pengukuran posisi sebelumnya). Dihapus. Hasil: 15 dari 17 state 0 piksel beda; 2 sisanya 0 piksel beda di luar tombol Import yang sengaja dimatikan (dicatat sebagai penyimpangan).
- Sekarang menjadi aturan tetap di CLAUDE.md dan REGRESSION.md: tiap layar dan semua state-nya dibandingkan piksel otomatis.
- Mode dev saja: `?hold` menahan splash, `?step=N` memaksa langkah Setup. Belum diukur: mode gelap. Board 01-Setup-4 dan tahap Import berikutnya belum dibangun.

## 25 Nov 2026 · Beranda tahap A
- **Dibangun:** kepala (logo, lonceng dengan angka), kartu total (hitung naik, baris dolar dan "dari Okt", tautan piutang, grafik kecil), kartu Pembagian harta (toggle per anggota dan per jenis aset, pilihan anggota/aset, donut, daftar terurut dari terbesar, "Sisanya" yang bisa dibuka, sorotan baris), kartu Harga terkini, keadaan kosong. State yang tercakup: Main, 2a, 2b, 2c, 2d, 2k, 2l, 2m, 2n.
- **Perbandingan piksel:** 9 state Beranda dan semua 17 state sebelumnya = 26/26, 0 piksel beda. Dua hal yang tertangkap: (1) gaya hero, hitung naik, donut, dan sorotan di mockup tertulis di helmet board, bukan di Design System; dipindahkan persis ke `bundle.css`. (2) pseudo-class `:first-child` membuat teks tengah donut kalah spesifisitas; diperbaiki.
- **Data contoh (keputusan Ticon):** `src/demo/demo.js`, aktif dengan `?demo` atau `?demo=banyak` (9 anggota). Berlaku juga di web app Google (doGet menyuntikkan parameter). Tanpa `?demo` Beranda memakai data nyata: tanpa transaksi = Beranda kosong. Menghapus data contoh: hapus folder `src/demo/`, `demo/demo.js` di `src/web/index.html`, dan blok `demoParam` di `src/web/js/app.js`.
- **Penyimpangan dari rencana (dicatat):** data contoh berupa angka tampilan (juta Rp) di lapisan view-model, bukan set transaksi yang dihitung mesin. Alasan: persen per anggota (+7,7%) dan persen per jenis (+6,1%) di mockup adalah angka sendiri-sendiri; tidak ada satu set transaksi yang menghasilkan keduanya. Pemetaan dari transaksi nyata ke view-model (`fromState`) dibangun bersama Catat (Tahap 5); sampai itu, data nyata dengan transaksi belum ditampilkan.
- **Dimatikan (tautan ke layar yang belum ada, tanpa mengubah piksel):** "Termasuk piutang", grafik kecil (Laporan), "Lihat semua" (Harga), "Catat aset pertama" (Catat), lonceng belum membuka sheet (tahap B). Tab bawah tetap berjalan.
- BELUM TERVERIFIKASI di Google sungguhan. Tahap B belum: banner zakat/piutang, lonceng terbuka, toast.

## 25 Nov 2026 · Animasi Beranda (laporan Ticon)
- **Masalah:** mengetuk baris di bawah donut menggambar ulang seluruh kartu, jadi transisi donut (lebar dan keburaman segmen) tidak jalan dan sapuan donut serta naiknya baris terulang. Perbandingan piksel sebelumnya hanya memeriksa hasil akhir sehingga tidak menangkapnya.
- **Perbaikan:** pembaruan di tempat. Menyorot baris hanya mengubah gaya lingkaran dan baris; mengganti tampilan/pilihan memutar ulang sapuan dan baris lewat kelas `sw0/sw1` dan `rw0/rw1` bergantian (seperti board); menu dibuka tanpa menyentuh bagian lain.
- **Alat:** `tools/pixel` kini membandingkan animasi (skenario `frames`: klik, bekukan pada T ms, bandingkan dengan board). 17 frame = 0 piksel beda. Diuji terbalik: dengan kode lama alat melaporkan selisih 0,52% di area donut pada 80 ms.
- Belum diperiksa: gerak yang tidak dipicu klik (hitung naik di hero saat dimuat, sapuan awal) dan mode gelap.

## 25 Nov 2026 · Beranda tahap B (banner pengingat, lonceng, toast) dan Design System online
- **Dibangun:** banner zakat (mendekati, jatuh tempo hari ini, terlambat) dan piutang (hari ini, terlambat) di bawah total, dengan aturan satu banner (zakat menang, piutang tetap di lonceng); lembar "Perlu perhatian" dari lonceng (daftar dengan ikon, keadaan "Semua beres"); toast "tersimpan" dengan tombol Lihat. Logika di `HF.beranda.attention`, tampilan di `src/web/screens/beranda.js`.
- **Perbandingan piksel:** 10 board baru (2e, 2f, 2g, 2h, 2i, 2j, 2o, 2p, 2q, 2r) + animasi buka lonceng (4 frame) = 0 piksel beda. Seluruh suite 57 perbandingan, 0 gagal.
- **Data contoh:** `?demo=<keadaan>` memilih keadaan board (daftar di ARCHITECTURE.md). Isi banner dan lonceng adalah teks contoh (Azlan, Bu Sari, Bu Rina); sumber nyata (mesin zakat dan piutang) dihubungkan bersama Tahap 5 dan 7.
- Dimatikan: tombol banner, baris lonceng, dan "Lihat" di toast (layar tujuan belum ada).
- **Design System online** (artifact RLygUek1tq98GXvtuegirr, versi 86): gerak dan kartu hero Beranda dipindah dari helmet board ke `components/bundle.css`; README menambah bagian "Beranda motion and hero" dan "Save states and error notice". Canvas mockup tidak diubah.

## 25 Nov 2026 · Tahap 5 putaran A, B, C: Catat transaksi
- **Dibangun:** layar Catat penuh (Beli, Jual, Masuk, Keluar, Pindah antar lokasi dan antar anggota, Saldo awal), pilih tanggal dan jam, alat bayar lain, kurs manual dan kurs otomatis (data contoh), lembar Tambah aset (keluarga dan katalog), Lokasi baru, Aset manual. Logika angka dari skrip board dipindah ke `src/engine/catat.js` (murni, diuji); markup ke `src/web/screens/catat-view.js` dan `catat-sheets.js`; klik dan state ke `catat.js`; pembaruan di tempat lewat `src/web/js/morph.js` (transisi dan animasi lembar jalan seperti board).
- **Perbandingan piksel:** 19 board Catat (kecuali 2l Ubah, putaran E) = 0 piksel beda. Tiap board juga digulir ke tengah dan ke dasar (28 skenario) supaya bagian di bawah lipatan layar ikut dibandingkan, ditambah 22 skenario interaksi (saldo kurang, bayar tidak cukup, kurs diketik dan di-reset, pilih hari dan jam, cari aset, filter, form Lokasi dan Aset manual) dan 5 skenario animasi (pilih jenis, pilih aset, buka tanggal, buka alat bayar, buka daftar aset; 18 frame). Semua 0 piksel beda.
- **Dua penemuan dari perbandingan piksel:** badge "dalam USDT · ikut alat bayar" dan tombol "Tambah aset baru "bri"" di board memisahkan hasil interpolasi menjadi simpul sendiri di dalam wadah flex sehingga ada jarak; kode memakai `<span>` yang sama. Tinggi tombol jenis dan tombol bulan: 126 board memakai 40 px, hanya 2n yang memakai 44 px; aplikasi memakai 40 px (keputusan Ticon: ikut mayoritas), skenario 2n memakai `patch` (salinan board dengan 44 diganti 40; dicatat di `scenarios.mjs`).
- **Data contoh vs nyata:** `?demo&mulai=<keadaan>` memakai `src/demo/catat-demo.js` (harga, kurs, saldo dari board) dan hanya menyimpan di perangkat (`hf-demo-trx`), tidak pernah ke Sheet (diuji). Tanpa `?demo`: aset dan saldo dari `apiState` lewat `HF.catatCtx.fromState`, harga dan kurs diisi manual (Ticon 25 Nov), baris disimpan lewat antrean perangkat dan `apiTransaksiTambah` (idempoten). Diuji end to end di Chrome dengan Sheet tiruan: Beli PAXG tersimpan dengan kurs `manual` dan kembali ke Beranda dengan toast.
- **Server:** `apiAsetTambah` (Master.js) untuk Aset manual: aset sumber `manual`, satu baris Harga `manual`; ditolak bila nama ganda, jenis salah, atau gram per satuan kosong untuk emas/perak non-gram. Diuji di `tests/gas.test.js`.
- **Pilihan saya yang belum digambar board (mohon dicek Ticon):** (1) di data nyata, kurs yang belum diisi menampilkan catatan "Isi sendiri, kurs otomatis belum tersedia" dan tombol reset tidak ada; (2) tombol Simpan redup hanya untuk saldo kurang atau bayar tidak cukup (aturan board); bila data belum lengkap, Simpan memberi garis merah pada Jumlah; (3) toast sesudah simpan: "<Jenis> <aset> <jumlah> tersimpan" dengan tombol Lihat dimatikan; (4) tombol Lampirkan foto dan Pajak, catatan dimatikan sampai ada board keadaannya; No. referensi bisa diketik tetapi belum disimpan.
- **Belum dibangun dan ditandai:** (a) bayar dari lokasi lain di data nyata diblokir sampai kolom `alat_bayar_lokasi_id` ditambahkan (rencana menunggu persetujuan Ticon, area sensitif Sheet); (b) biaya Pindah dalam Rupiah belum punya cara dicatat (Keluar apa dari mana?), baris Pindah dengan biaya Rp ditolak (`biaya-rupiah`), biaya dalam satuan aset sudah menjadi baris Keluar; (c) Ubah (2l), hapus, pulihkan dan Beranda dari data nyata = putaran E; (d) mode gelap belum dibandingkan.

## 25 Nov 2026 · Skema v2: kolom `alat_bayar_lokasi_id` (bayar dari lokasi lain)
- **Kenapa:** board "Bayar dari Bybit" membayar pembelian di Binance dengan USDT di Bybit, tetapi Transaksi hanya punya satu lokasi, jadi pembayaran jatuh di lokasi pembelian. Disetujui Ticon 25 Nov (rencana ditulis dulu, area sensitif).
- **Perubahan:** kolom ke-29 `alat_bayar_lokasi_id` di paling kanan Transaksi, `VERSI` 1 ke 2. `ledger.effects` memakai kolom itu untuk sisi pembayar (Beli dan Jual); kosong = lokasi transaksi, jadi baris lama hitungannya sama. `validate` menolak lokasi pembayar yang tidak ada dan saldo pembayar yang kurang. Blokir `otherLoc` di Catat dihapus.
- **Migrasi:** `setupHartafolio` menambah kolom yang kurang di kanan (hanya bila sel header-nya kosong; selain itu berhenti tanpa mengubah apa pun), membuat ulang perlindungan header selebar header baru, dan menaikkan `versi_skema`. Idempoten. **Sebelum menjalankan menu itu, Sheet versi 1 berhenti dengan pesan "Header tab Transaksi berubah"** (disengaja, bukan diam-diam).
- **Uji:** 68 (sebelumnya 63): ledger (aset pembayar di lokasi lain, saldo kurang, lokasi tidak ada, baris lama), schema, migrasi di Sheet tiruan (termasuk perlindungan tetap satu dan idempoten), `apiTransaksiTambah` end to end, Catat data nyata.
- **BELUM TERVERIFIKASI di Google:** penambahan kolom dan perlindungan header di Sheet sungguhan; minta Ticon menjalankan Hartafolio › Siapkan sheet sekali.
