# Urutan build (disepakati dengan Ticon, mulai dari nol)
**Status: tahap 0–3 selesai (24 Nov 2026), lanjut tahap 4. Lihat `docs/STATUS.md`.**

0. **Repo dan kerangka**: struktur folder, `clasp` terhubung ke Sheet uji, skrip uji Node, `CHANGELOG.md`.
1. **Fondasi**: token + komponen CSS dari `docs/design/bundle.css`; shell aplikasi (bottom bar 5 tab, tombol tambah), halaman uji komponen untuk dibandingkan dengan Design System.
2. **Struktur data**: buat 11 tab dengan header terkunci, `versi_skema`, seed katalog aset bawaan (Emas, Perak, PAXG, XAUT, BTC, USDT, USD, saham contoh), validasi urutan kolom, antrean offline dengan `trx_id`.
3. **Engine murni + uji**: saldo, harga ke Rupiah, nilai, tiga tingkat total, kurs beku, untung/rugi rata-rata, zakat (nisab/haul per logam), piutang (jadwal, status terlambat), hapus-lunak.
4. **Setup** (akun, anggota, lokasi, import) dan **Beranda** (total + sparkline, donut, daftar, banner/lonceng).
5. **Catat transaksi** (6 jenis, tanggal, kurs, alat bayar) dan **Riwayat** (filter, detail, ubah, hapus/pulihkan).
6. **Aset** dan **Kelola aset**, **Harga terkini** (+ trigger harga terjadwal).
7. **Piutang**, **Zakat mal** + **Nishob**.
8. **Laporan** (termasuk snapshot bulanan, trigger), **Hasil export**, **Import/Export** template.
9. Anggota/Lokasi, Google Sheet view, tablet dan desktop.
10. Uji salin ke 2–3 akun Google, uji pembaruan via library, panduan setup, video, serah terima.

Setiap tahap selesai: jalankan uji engine, buka layar di browser, bandingkan dengan board mockup di artifact (identik), catat di CHANGELOG, commit.
