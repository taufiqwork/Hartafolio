/* Ikon Lucide (lucide.dev, ISC). Garis 2px, bulat, currentColor. Ikon tab memakai .hf-ico-fill / .hf-ico-cut agar tab aktif duotone. */
(function (root) {
  'use strict';
  var A = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  function svg(inner, size) {
    return '<svg ' + A + (size ? ' width="' + size + '" height="' + size + '"' : '') + '>' + inner + '</svg>';
  }
  var P = {
    house: '<path class="hf-ico-fill" d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><path class="hf-ico-cut" d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path>',
    grid: '<rect class="hf-ico-fill" width="7" height="7" x="3" y="3" rx="1"></rect><rect class="hf-ico-fill" width="7" height="7" x="14" y="3" rx="1"></rect><rect class="hf-ico-fill" width="7" height="7" x="14" y="14" rx="1"></rect><rect class="hf-ico-fill" width="7" height="7" x="3" y="14" rx="1"></rect>',
    receipt: '<path class="hf-ico-fill" d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><path class="hf-ico-cut" d="M14 8H8"></path><path class="hf-ico-cut" d="M16 12H8"></path><path class="hf-ico-cut" d="M13 16H8"></path>',
    wrench: '<path class="hf-ico-fill" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>',
    plus: '<path d="M5 12h14"></path><path d="M12 5v14"></path>',
    chevronDown: '<path d="m6 9 6 6 6-6"></path>',
    chevronRight: '<path d="m9 18 6-6-6-6"></path>',
    chevronLeft: '<path d="m15 18-6-6 6-6"></path>',
    check: '<path d="M20 6 9 17l-5-5"></path>',
    x: '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
    search: '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>',
    calendar: '<path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path>',
    bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"></path><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path>'
  };
  root.HF = root.HF || {};
  root.HF.icon = function (name, size) { return svg(P[name] || '', size); };
  root.HF.iconPaths = P;
})(typeof globalThis !== 'undefined' ? globalThis : this);
