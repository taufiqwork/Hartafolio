/**
 * Hartafolio — titik masuk web app (Apps Script).
 * Tahap 1: hanya menyajikan tampilan. Akses Sheet dan endpoint data ditambahkan di tahap 2.
 */

/** Menyajikan aplikasi. ?page=components membuka halaman uji komponen. */
function doGet(e) {
  var page = e && e.parameter && e.parameter.page === 'components' ? 'Components' : 'Index';
  var html = HtmlService.createHtmlOutputFromFile(page).getContent();
  /* Alamat asli tidak terlihat dari dalam halaman Apps Script: suntikkan parameter yang dipakai (hanya huruf kecil). */
  var demo = e && e.parameter && e.parameter.demo !== undefined ? String(e.parameter.demo).replace(/[^a-z]/g, '') : null;
  html = html.replace('<head>', '<head><script>window.HF_PARAMS=' + JSON.stringify({ demo: demo }) + ';</script>');
  return HtmlService.createHtmlOutput(html)
    .setTitle('Hartafolio')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}
