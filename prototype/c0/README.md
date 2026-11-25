# Percobaan C0: aplikasi pusat yang berjalan sebagai pengguna yang membuka

Bukan produk. Tujuannya menjawab: bisakah pengguna Gmail biasa membuka satu alamat, menyetujui izin, dan memakai Sheet buatan aplikasi di Drive MEREKA sendiri, tanpa salinan template, menu Sheet, atau deploy oleh pengguna?

- Proyek Apps Script mandiri (terpisah dari proyek utama). `appsscript.json`: `executeAs: USER_ACCESSING`, `access: ANYONE`, izin `spreadsheets` dan `userinfo.email`.
- `Code.js`: `apiMulai` (buka atau buat Sheet "Hartafolio (percobaan C0)", id di properti akun pengguna), `apiTulis` (satu baris uji).
- `.clasp.json` di folder ini berisi id proyek dan tidak masuk git. Push: `cd prototype/c0 && ../../node_modules/.bin/clasp push --force`.

## Protokol uji (hemat: tiap akun BARU ikut terhitung dalam batas 100 pengguna, pakai dua akun saja)
1. Akun Gmail biasa A (bukan pemilik skrip): buka alamat, catat tiap layar (tangkapan layar): peringatan "belum diverifikasi", tombol untuk melanjutkan, daftar izin.
2. Setelah setuju: tekan Mulai. Harapan: akun tampil, "Sheet baru dibuat: ya", tautan Sheet terbuka dan Sheet ada di Drive akun A.
3. Tekan Tulis satu baris uji dua kali; buka Sheet: dua baris, kolom dicatat_oleh = akun A.
4. Tutup, buka alamat lagi, Mulai: "Sheet baru dibuat: tidak (dipakai ulang)", jumlah baris sama.
5. Ulangi di HP (Safari atau Chrome HP), lalu coba "Tambahkan ke layar utama".
6. Akun Gmail B: sama, tetapi Sheet harus BERBEDA dan tidak berisi baris akun A. Akun A tidak boleh bisa membuka Sheet akun B.
7. Catat: apakah ada galat, berapa lama Mulai, dan apakah peringatan bisa dilewati tanpa bantuan.
