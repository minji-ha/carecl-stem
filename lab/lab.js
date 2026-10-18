/* 설문 왼쪽 패널 그래픽 시안 — 공통 진행 흐름
   실제 설문처럼 18문항에 답해 가는 과정을 자동으로 재생하고, 각 그래픽이 그 진행에 반응한다.
   Lab.start({ onStep(s), onResult(r), onReset() })
     s = { i, total, label, text, type, area, counts, progress }
     r = { name, roles, areas, counts }                                             */
(function () {
  var STEPS = [
    ['Q1', '무표정에도 눈가·입가 잔주름이 보인다', 'fine', '눈가'],
    ['Q2', '세안 후 눈가·입가·목주름이 먼저 보인다', 'fine', '입가'],
    ['Q3', '저녁이면 얼굴선이 무너져 보인다', 'sag', '턱선'],
    ['Q4', '잔주름이 옅어지고 팽팽해지길 원한다', 'fine', '눈가'],
    ['Q5', '피부톤과 색소 변화가 신경 쓰인다', 'early', '앞광대'],
    ['Q6', '입꼬리가 처지고 얼굴선이 무너진다', 'sag', '볼'],
    ['Q7', '눈가·입가 잔주름을 먼저 해결하고 싶다', 'fine', '눈가'],
    ['Q8', '기미·잡티와 칙칙함이 신경 쓰인다', 'early', '앞광대'],
    ['Q9', '눈밑이 퀭해 보인다', 'tired', '눈밑'],
    ['Q10', '이중턱과 턱선이 흐려지는 게 걱정된다', 'sag', '턱선'],
    ['Q11', '눈가와 입가가 더 신경 쓰인다', 'fine', '입가'],
    ['Q12', '처진 입꼬리와 볼살이 나이 들어 보이게 한다', 'sag', '볼'],
    ['Q13', '생기 있고 탄력 있는 앞광대를 원한다', 'tired', '앞광대'],
    ['Q14', '얼굴 전체 잔주름이 늘어나는 게 싫다', 'fine', '이마'],
    ['Q15', '변화가 큰 부위 — 눈가 · 볼살 · 턱선', null, '볼'],
    ['Q16', '가장 먼저 관리하고 싶은 곳 — 눈가', null, '눈가'],
    ['Q17', '연령대 — 40대 초~중반', null, null],
    ['Q18', '성별 — 여성', null, null]
  ];
  var RESULT = { name: '혼합형', roles: { fine: '대표', sag: '보조' }, areas: ['눈가', '심부볼', '턱선'] };
  var STEP_MS = 1500, HOLD_MS = 7000;
  // ?embed — 결과 리포트 왼쪽 패널에 넣을 때: 조작 버튼 없이 분석을 한 번 빠르게 돌리고 결과에서 멈춘다
  var EMBED = /[?&]embed/.test(location.search);
  if (EMBED) { STEP_MS = 420; document.documentElement.classList.add('is-embed'); }

  var api = {}, cb = {}, i = -1, timer = 0, playing = true, counts = {};

  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }

  function ui() {
    var panel = document.querySelector('.panel');
    panel.appendChild(el('<div class="head"><em>AI SKIN AGENT</em><b>Aging Map 22</b><p>얼굴을 22개 좌표로 나누어<br>당신의 노화 타입을 진단합니다</p></div>'));
    panel.appendChild(el('<div class="hud"><div class="q" data-q><b>READY</b>설문을 시작하면 분석이 시작돼요</div><div class="pct"><span data-pct>0</span>%<small>ANALYZING</small></div></div>'));
    panel.appendChild(el('<div class="result" data-result><small>DIAGNOSIS</small><b>혼합형</b><span>대표 잔주름형 · 보조 변형·처짐형</span></div>'));
    if (EMBED) return;
    var c = el('<div class="ctrl"><button data-a="play">일시정지</button><button data-a="next">다음 문항</button><button data-a="result">결과 보기</button><button data-a="reset">처음부터</button></div>');
    panel.appendChild(c);
    c.addEventListener('click', function (e) {
      var a = e.target.dataset.a; if (!a) return;
      if (a === 'play') { playing = !playing; e.target.textContent = playing ? '일시정지' : '재생'; if (playing) loop(); else clearTimeout(timer); }
      if (a === 'next') { clearTimeout(timer); next(); if (playing) loop(); }
      if (a === 'result') { clearTimeout(timer); while (i < STEPS.length - 1) next(true); showResult(); if (playing) timer = setTimeout(reset, HOLD_MS); }
      if (a === 'reset') { clearTimeout(timer); reset(); }
    });
  }

  function next(silent) {
    i++;
    if (i >= STEPS.length) { showResult(); return; }
    var s = STEPS[i];
    if (s[2]) counts[s[2]] = (counts[s[2]] || 0) + 1;
    var info = { i: i, total: STEPS.length, label: s[0], text: s[1], type: s[2], area: s[3], counts: Object.assign({}, counts), progress: (i + 1) / STEPS.length };
    document.querySelector('[data-q]').innerHTML = '<b>' + s[0] + ' · ' + (s[2] ? '노화 유형 문항' : '관리 부위 · 기본 정보') + '</b>' + s[1];
    document.querySelector('[data-pct]').textContent = Math.round(info.progress * 100);
    if (cb.onStep) cb.onStep(info, !!silent);
  }

  function showResult() {
    document.querySelector('[data-q]').innerHTML = '<b>COMPLETE</b>22개 좌표 분석이 끝났어요';
    document.querySelector('[data-pct]').textContent = 100;
    document.querySelector('[data-result]').classList.add('on');
    if (cb.onResult) cb.onResult(Object.assign({ counts: Object.assign({}, counts) }, RESULT));
  }

  function reset() {
    i = -1; counts = {};
    document.querySelector('[data-result]').classList.remove('on');
    document.querySelector('[data-q]').innerHTML = '<b>READY</b>설문을 시작하면 분석이 시작돼요';
    document.querySelector('[data-pct]').textContent = 0;
    if (cb.onReset) cb.onReset();
    if (playing) timer = setTimeout(loop, 1600);
  }

  function loop() {
    clearTimeout(timer);
    if (!playing) return;
    if (i >= STEPS.length - 1) { if (i === STEPS.length - 1) { next(); } if (!EMBED) timer = setTimeout(reset, HOLD_MS); return; }
    next();
    timer = setTimeout(loop, STEP_MS);
  }

  api.start = function (callbacks) { cb = callbacks || {}; ui(); if (cb.onReset) cb.onReset(); timer = setTimeout(loop, EMBED ? 900 : 1400); };
  api.AREAS = ['이마', '미간', '눈가', '눈밑', '앞광대', '볼', '팔자', '입가', '턱선', '목'];
  window.Lab = api;
})();
