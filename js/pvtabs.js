/* 왼쪽 패널 그래픽 시안 탭 (survey.html · survey-p1~5.html)
   탭을 눌러도 페이지는 그대로 두고 왼쪽 그래픽만 바꾼다 — 설문 중이면 설문 중 그대로, 리포트면 리포트 그대로.
   · 설문 중: 그래픽이 분석 장면을 계속 반복 (embed=loop)
   · 리포트가 보이면: 분석을 한 번 돌리고 결과에서 멈춤 (embed=1) */
(function () {
  var nav = document.querySelector('.pvtabs'), frame = document.querySelector('.sv__stick--frame iframe'), form = document.getElementById('svForm');
  if (!nav || !frame) return;
  var ver = (frame.getAttribute('src').match(/[?&]v=([^&]+)/) || [])[1] || '';
  var cur = nav.querySelector('a.on'), shown = '';

  function done() { return !!(form && form.querySelector('.cku-result')); }
  function load(force) {
    var want = cur.dataset.src + '?embed=' + (done() ? '1' : 'loop') + (ver ? '&v=' + ver : '');
    if (force || want !== shown) { shown = want; frame.src = want; }
  }

  nav.addEventListener('click', function (e) {
    var a = e.target.closest('a'); if (!a) return;
    e.preventDefault();
    if (a === cur) return;
    cur.classList.remove('on'); a.classList.add('on'); cur = a;
    // 주소만 바꿔 둔다 — 새로고침하거나 '로그인하고 전체 결과 보기'를 눌러도 같은 그래픽이 이어진다
    history.replaceState(null, '', a.getAttribute('href').split('?')[0] + location.search + location.hash);
    load(true);
  });

  // 설문을 끝내 리포트가 나오거나, '다시 하기'로 처음으로 돌아가면 그래픽 모드를 맞춘다
  if (form && 'MutationObserver' in window) new MutationObserver(function () { load(false); }).observe(form, { childList: true });
  load(false);
})();
