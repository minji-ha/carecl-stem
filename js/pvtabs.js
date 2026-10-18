/* 왼쪽 패널 그래픽 시안 탭 (survey.html · survey-p1~5.html · survey2.html)
   탭을 눌러도 페이지는 그대로 두고 왼쪽 그래픽만 바꾼다 — 설문 중이면 설문 중 그대로, 리포트면 리포트 그대로.
   · 설문 중: 그래픽이 분석 장면을 계속 반복 (embed=loop)
   · 리포트가 보이면: 분석을 한 번 돌리고 결과에서 멈춤 (embed=1)
   survey2.html (data-flow): 1번(입자 얼굴)만 왼쪽 패널. 2~5번은
   · 인트로: 그래픽이 화면 전체 배경으로 깔리고 인트로 글이 그 위에 (embed=hero)
   · 설문·리포트: 그래픽은 빠지고 설문이 가운데로. 5번(3D 기기)은 설문 중 오른쪽 아래에 기기가 돈다 (embed=mini) */
(function () {
  var nav = document.querySelector('.pvtabs'), frame = document.querySelector('.sv__stick--frame iframe'), form = document.getElementById('svForm');
  if (!nav || !frame) return;
  var main = document.querySelector('.sv'), flow = nav.hasAttribute('data-flow'), mini = document.querySelector('.sv__mini');
  var tabs = [].slice.call(nav.querySelectorAll('a'));
  var ver = (frame.getAttribute('src').match(/[?&]v=([^&]+)/) || [])[1] || '';
  var cur = nav.querySelector('a.on'), shown = '';

  if (flow) {   // survey2.html?g=3 → 3번 탭으로 시작
    var g = +((location.search.match(/[?&]g=(\d)/) || [])[1] || 0);
    if (tabs[g - 1]) { cur.classList.remove('on'); cur = tabs[g - 1]; cur.classList.add('on'); }
  }

  function stage() {
    if (!form) return 'q';
    if (form.querySelector('.cku-result')) return 'done';
    if (form.querySelector('[data-start]')) return 'intro';
    return 'q';
  }
  function apply(force) {
    var st = stage(), hero = flow && tabs.indexOf(cur) > 0;
    if (main) {
      main.classList.toggle('is-hero', hero && st === 'intro');
      main.classList.toggle('is-center', hero && st !== 'intro');
    }
    var mode = hero && st === 'intro' ? 'hero' : (st === 'done' ? '1' : 'loop');
    var want = cur.dataset.src + '?embed=' + mode + (ver ? '&v=' + ver : '');
    // 설문 가운데 모드에서는 왼쪽 그래픽이 안 보이니 불러오지 않는다
    if (!(hero && st !== 'intro') && (force || want !== shown)) { shown = want; frame.src = want; }
    if (mini) {
      var on = flow && tabs.indexOf(cur) === tabs.length - 1 && st === 'q';
      mini.hidden = !on;
      var f = mini.querySelector('iframe');
      if (on && !f.getAttribute('src')) f.src = cur.dataset.src + '?embed=mini' + (ver ? '&v=' + ver : '');
    }
  }

  nav.addEventListener('click', function (e) {
    var a = e.target.closest('a'); if (!a) return;
    e.preventDefault();
    if (a === cur) return;
    cur.classList.remove('on'); a.classList.add('on'); cur = a;
    // 주소만 바꿔 둔다 — 새로고침하거나 '로그인하고 전체 결과 보기'를 눌러도 같은 그래픽이 이어진다
    if (flow) {
      var q = location.search.replace(/([?&])g=\d&?/, '$1').replace(/[?&]$/, '');
      history.replaceState(null, '', location.pathname + q + (q ? '&' : '?') + 'g=' + (tabs.indexOf(a) + 1) + location.hash);
    } else {
      history.replaceState(null, '', a.getAttribute('href').split('?')[0] + location.search + location.hash);
    }
    apply(true);
  });

  // 설문을 시작하거나, 끝내 리포트가 나오거나, '다시 하기'로 처음으로 돌아가면 화면 모드를 맞춘다
  if (form && 'MutationObserver' in window) new MutationObserver(function () { apply(false); }).observe(form, { childList: true });
  apply(false);
})();
