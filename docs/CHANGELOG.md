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
