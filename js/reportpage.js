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
  if (window.ckuRadar) {   // 커버 오각형 — 예시 응답, 결과 유형을 대표로
    var roles = {}; if (key !== 'mixed') roles[key] = '대표'; else { roles.fine = '대표'; roles.sag = '보조'; }
    window.ckuRadar.mount(out.querySelector('[data-radar]'));
    window.ckuRadar.set(window.ckuReport.sample(key), roles);
  }
})();
