# REGRESSION — yang tidak boleh rusak

Jalankan daftar ini **sebelum bilang "selesai"** pada tahap apa pun. Satu cek gagal = belum selesai. Tunjukkan hasilnya ke Ticon, jangan hanya menulis "sudah dicek".

Aturan main:
- Klaim "beres" harus punya bukti: keluaran `npm test`, angka hasil ukur, atau diff.
- Yang tidak bisa dicek otomatis (klik di HP, tampilan di Google sungguhan) ditulis **"BELUM TERVERIFIKASI, minta Ticon cek"**. Jangan pasang perbaikan buta lalu bilang beres.
- Probe sementara (console.log, alert) boleh dipasang untuk uji, lalu dihapus. Pastikan bersih: `grep -rn "console.log\|debugger" src/`.

## 1. Selalu dijalankan (otomatis)

```bash
npm test
```
Harus: semua lulus, jumlahnya tidak berkurang dari sebelumnya (sekarang 44). Jumlah uji turun = ada uji yang dihapus, tanyakan kenapa.

```bash
npm run build
```
Harus: berhasil dan `dist/` berisi `Index.html`, `Components.html`, `Code.js`, `Repo.js`, `Setup.js`, `appsscript.json`, dan `engine_*.js`.

## 2. Hitungan inti (dijaga uji di `tests/`)

Perubahan di `src/engine/` wajib menambah atau memperbarui uji, bukan hanya lolos uji lama.

- [ ] **Saldo** per anggota × aset × lokasi benar untuk Beli, Jual, Masuk, Keluar, Pindah, Saldo awal. Jual melebihi saldo ditolak. Uji: `tests/ledger.test.js`.
- [ ] **Hapus = status "dihapus"**, baris tidak hilang, tidak ikut dihitung. Uji: "baris dihapus diabaikan".
- [ ] **Zakat hanya emas dan perak**: nisab 85 g / 595 g, haul 354 hari, tarif 2,5%, per anggota per logam. USDT dan saham tidak dihitung. Emas yang dipinjamkan tidak dihitung. Uji: 8 uji zakat di `tests/engine.test.js`.
- [ ] **Kurs dibekukan** per transaksi; manual menang atas otomatis. Uji: "kurs: hari ini live…".
- [ ] **Piutang tidak mengurangi total harta**; cicilan paling lama dilunasi dulu; "terlambat" dihitung, tidak disimpan. Uji: 4 uji piutang.
- [ ] **Antrean offline tidak menggandakan transaksi**: `trx_id` sama dikirim dua kali = satu baris. Uji: "antrean offline…" dan "apiTransaksiTambah: idempoten…".

## 3. Lapisan Google Sheet

Diuji dengan Sheet tiruan di `tests/gas.test.js`. Sheet tiruan **meniru batas grid Google (1000 baris × 26 kolom)**. Jangan longgarkan batas itu.

- [ ] Siapkan sheet membuat 11 tab, dua kali jalan tidak menggandakan apa pun (Pengaturan 8 baris, Aset tetap).
- [ ] Header salah = menolak baca dan tulis (data tidak rusak diam-diam).
- [ ] Setiap tulis di luar grid didahului `Repo_ensureGrid_`.
- [ ] Penulisan lewat `api*` di server, yang memvalidasi ulang.

**Terverifikasi di Google sungguhan pada 24 Nov 2026** (Sheet uji milik Ticon): Siapkan sheet menghasilkan 11 tab urut benar, Aset 13 baris, Pengaturan 8 baris, Transaksi 28 kolom; dijalankan dua kali tidak dobel; "Header Hartafolio" terlindungi di tab Transaksi.

**Masih BELUM TERVERIFIKASI di Google:** `doGet`, `apiState`, `apiTransaksiTambah`, `apiTransaksiUbah`, menu Periksa struktur, penguncian di tab selain Transaksi. Ulangi cek di atas setiap kali `Setup.js`, `Repo.js`, atau `schema.js` berubah.

## 4. Layar harus identik dengan mockup

Aturan Ticon: tidak ada beda kecil. Tiap layar yang selesai:

- [ ] Buka board mockupnya di artifact (nama board ada di `docs/MOCKUPS.md`), **termasuk state kosong, error, menu terbuka, toast, sheet**.
- [ ] **Teks disalin dari mockup, bukan diketik ulang** (satu contoh nyata di proyek lain: panjang sandi diketik 8, mockup menulis 12). Bandingkan tiap kalimat.
- [ ] **Ukur, bukan lihat**: buka layar di `npm run dev`, baca nilai nyata dari halaman (ukuran, jarak, warna, radius, font) dan cocokkan dengan nilai di mockup. Jangan menilai dari tangkapan layar. Cantumkan angkanya di laporan: berapa elemen diukur, berapa yang beda.
- [ ] **Elemen yang digambar mockup sebagai garis harus berupa elemen**, bukan `border-top` (border tidak punya kotak, tidak bisa diukur).
- [ ] **Ikon berupa `<svg>` nyata**, bukan CSS mask.
- [ ] **Tidak ada gaya inline per layar**. Komponen baru masuk `docs/design/design-system.md` dan `docs/design/bundle.css`.
- [ ] Angka gaya Indonesia: "Rp 174,2 jt", "Rp 2.380.000", koma desimal, minus asli "−". Kategori: Emas, Perak, Crypto, Saham, Mata uang. Tanpa emoji dan tanda seru.
- [ ] Mockup dan dokumen teks bentrok = ikuti mockup, lalu **laporkan** ke Ticon. Keadaan yang tidak digambar mockup = **tanya, jangan menebak**.
- [ ] Layar punya banyak jalan masuk (mis. Harga terkini dibuka dari Beranda dan Zakat): sebut tiap jalan masuk di laporan, tandai yang belum dicoba "BELUM TERVERIFIKASI".

Yang tidak bisa saya cek sendiri di Google Apps Script: tampilan di HP sungguhan dan di dalam sandbox HtmlService. Tandai "BELUM TERVERIFIKASI".

## 5. Data dan aturan produk

- [ ] Tidak ada hapus fisik data, tidak ada purge otomatis.
- [ ] Tidak ada fitur di luar mockup. Piutang hanya ke orang luar.
- [ ] Transaksi tetap satu-satunya sumber kebenaran. Saldo, nilai, snapshot, zakat dihitung engine, tidak disimpan sebagai angka mandiri.
- [ ] Hanya Pengelola yang login.

## Catatan jebakan
Daftar jebakan lengkap ada di `CLAUDE.md` bagian "Jebakan". Tambahkan di sana tiap kali menemukan yang baru.
