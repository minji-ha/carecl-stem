/* 진단 결과 리포트 — 주소의 type 값에 해당하는 리포트 하나만 보여준다
   예) report.html?type=muscle  (값이 없으면 muscle) */
(function () {
  var out = document.querySelector('[data-rpt-out]');
  if (!out || !window.ckuReport) return;

  var ORDER = ['early', 'tired', 'fine', 'sag', 'muscle', 'mixed'];
  var q = (location.search.match(/[?&]type=([a-z]+)/) || [])[1];
  var key = ORDER.indexOf(q) > -1 ? q : 'muscle';

  out.innerHTML = window.ckuReport.html(key, {});
  window.ckuReport.fillBars(out);
})();
