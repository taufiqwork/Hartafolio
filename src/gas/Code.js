/**
 * Hartafolio — titik masuk web app (Apps Script).
 * Tahap 1: hanya menyajikan tampilan. Akses Sheet dan endpoint data ditambahkan di tahap 2.
 */

/** Menyajikan aplikasi. ?page=components membuka halaman uji komponen. */
function doGet(e) {
  var page = e && e.parameter && e.parameter.page === 'components' ? 'Components' : 'Index';
  return HtmlService.createHtmlOutputFromFile(page)
    .setTitle('Hartafolio')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}
