/** Tanggal ISO (YYYY-MM-DD) tanpa zona waktu: semua hitungan di UTC agar sama di Node, Apps Script, dan browser. */
(function (root) {
  'use strict';
  function parse(iso) { var p = String(iso).slice(0, 10).split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function fmt(ms) { var d = new Date(ms); return d.getUTCFullYear() + '-' + two(d.getUTCMonth() + 1) + '-' + two(d.getUTCDate()); }
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function addDays(iso, n) { return fmt(parse(iso) + n * 86400000); }
  function diffDays(a, b) { return Math.round((parse(a) - parse(b)) / 86400000); } // a - b
  function daysInMonth(y, m1) { return new Date(Date.UTC(y, m1, 0)).getUTCDate(); }
  /** Geser n bulan, hari tetap sama; tanggal 29 sampai 31 mundur ke hari terakhir bulan itu. */
  function addMonths(iso, n, day) {
    var p = iso.slice(0, 10).split('-'), y = +p[0], m = +p[1] - 1 + n, d = day || +p[2];
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    return y + '-' + two(m + 1) + '-' + two(Math.min(d, daysInMonth(y, m + 1)));
  }
  var api = { parse: parse, fmt: fmt, addDays: addDays, diffDays: diffDays, addMonths: addMonths };
  root.HF = root.HF || {};
  root.HF.dates = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
