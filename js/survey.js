/* =========================================================
   careCL — Aging Map 22 진단 설문 (18문항)
   문항 출처: 노화 진단 Test - final.xlsx
   각 보기의 type 값은 내부 스코어링용 (화면 미노출)
   ========================================================= */
(function () {
  'use strict';

  var T = { tired: '피로형', early: '초기노화형', fine: '잔주름형', sag: '변형·처짐형', muscle: '근육형' };

  var QUESTIONS = [
    { sect: '섹션 1 · 노화 타입', label: 'Q1', q: '요즘 거울에 비친 내 얼굴을 볼 때<br>가장 공감하는 상황은?', help: '1개만 골라주세요.', opts: [
      { k: '1', t: '얼굴이 부쩍 예전보다 피곤해 보이고 특히 눈밑이 퀭해진 것 같다', type: 'tired' },
      { k: '2', t: '주름이나 처짐이 아직 심하진 않으나 피부톤이 칙칙해지고 기미, 잡티가 예전보다 눈에 띈다', type: 'early' },
      { k: '3', t: '무표정하게 있어도 눈가, 입가, 목 등에 자잘한 잔주름이 눈에 띄게 보여 거슬린다', type: 'fine' },
      { k: '4', t: '예전보다 볼살과 입술 라인이 아래로 쳐지고 날렵했던 얼굴 V라인이 서서히 무너지는 느낌이다', type: 'sag' },
      { k: '5', t: '예전보다 인상이 강해 보이고 표정 주름이 깊게 패여 점점 화내는 얼굴이 되어 가는 것 같다', type: 'muscle' }
    ]},
    { sect: '섹션 1 · 노화 타입', label: 'Q2', q: '세안 직후 맨얼굴을 봤을 때<br>가장 먼저 눈에 들어오는 것은?', help: '1개만 골라주세요.', opts: [
      { k: '1', t: '미간 주름, 이마 주름, 깊은 표정 주름', type: 'muscle' },
      { k: '2', t: '눈밑 꺼짐, 다크서클', type: 'tired' },
      { k: '3', t: '무너진 턱라인, 처진 볼살, 내려간 입가', type: 'sag' },
      { k: '4', t: '칙칙한 피부톤, 기미 혹은 잡티', type: 'early' },
      { k: '5', t: '눈가 주름, 입가 주름, 목주름', type: 'fine' }
    ]},
    { sect: '섹션 1 · 노화 타입', label: 'Q3', q: '아침에는 괜찮다가 저녁이 되면<br>가장 크게 달라진다고 느끼는 것은?', help: '1개만 골라주세요.', opts: [
      { k: '1', t: '얼굴선이 무너져 보이고 인상이 전체적으로 처져 보인다', type: 'sag' },
      { k: '2', t: '피부가 푸석푸석하고 칙칙해 보인다', type: 'early' },
      { k: '3', t: '눈 주변이 퀭하고 얼굴이 피곤해 보인다', type: 'tired' },
      { k: '4', t: '눈가, 입가, 혹은 이마에 잔주름이 자글자글 눈에 띈다', type: 'fine' },
      { k: '5', t: '미간이나 이마 주름이 더 선명하게 깊어 보인다', type: 'muscle' }
    ]},
    { sect: '섹션 1 · 노화 타입', label: 'Q4', q: '앞으로 관리를 통해<br>가장 얻고 싶은 것은?', help: '1개만 골라주세요.', opts: [
      { k: '1', t: '눈가와 입가의 잔주름이 옅어지고 팽팽해지는 느낌', type: 'fine' },
      { k: '2', t: '다크서클 / 눈 밑 꺼짐이 좋아져서 생기 있어 보이는 인상', type: 'tired' },
      { k: '3', t: '이마, 미간의 깊은 표정 주름이 옅어져 호감을 주는 인상', type: 'muscle' },
      { k: '4', t: '기미 · 잡티가 옅어지고 환하고 깨끗한 느낌의 피부', type: 'early' },
      { k: '5', t: '턱선이 날렵해지고 얼굴이 탄력 있게 위로 올라가 보이는 느낌', type: 'sag' }
    ]},
    { sect: '섹션 2 · 노화 유형', label: 'Q5', q: '다음 2가지 중<br>당신에게 더 공감을 주는 상황은?', help: '하나를 선택해 주세요.', opts: [
      { k: 'A', t: '주름보다 피부톤과 색소 변화가 더 신경 쓰인다', type: 'early' },
      { k: 'B', t: '피부 자체보다 피곤해 보이는 인상이 더 신경 쓰인다', type: 'tired' }
    ]},
    { sect: '섹션 2 · 노화 유형', label: 'Q6', q: '다음 2가지 노화 징후 중<br>당신의 상황에 더 가까운 것은?', help: '하나를 선택해 주세요.', opts: [
      { k: 'A', t: '눈밑이 퀭해 보이고 다크서클이 진해진 것 같다', type: 'tired' },
      { k: 'B', t: '입꼬리가 쳐지고 얼굴선이 무너지는 것 같다', type: 'sag' }
    ]},
    { sect: '섹션 2 · 노화 유형', label: 'Q7', q: '다음 2가지 중<br>어떤 것을 우선적으로 해결하고 싶으세요?', help: '하나를 선택해 주세요.', opts: [
      { k: 'A', t: '눈가 · 입가 잔주름', type: 'fine' },
      { k: 'B', t: '미간 · 이마 표정주름', type: 'muscle' }
    ]},
    { sect: '섹션 2 · 노화 유형', label: 'Q8', q: '다음 2가지 중<br>어떤 것을 우선적으로 해결하고 싶으세요?', help: '하나를 선택해 주세요.', opts: [
      { k: 'A', t: '기미 · 잡티와 피부톤이 칙칙해 보이는 것', type: 'early' },
      { k: 'B', t: '눈밑이 꺼지고 얼굴이 생기 없어 보이는 것', type: 'tired' }
    ]},
    { sect: '섹션 2 · 노화 유형', label: 'Q9', q: '무표정으로 거울을 볼 때<br>더 신경 쓰이는 부위는?', help: '하나를 선택해 주세요.', opts: [
      { k: 'A', t: '눈밑이 퀭해 보이는 것', type: 'tired' },
      { k: 'B', t: '이마나 미간에 패인 주름', type: 'muscle' }
    ]},
    { sect: '섹션 2 · 노화 유형', label: 'Q10', q: '당신이 더 걱정하는<br>얼굴의 변화는 무엇인가요?', help: '하나를 선택해 주세요.', opts: [
      { k: 'A', t: '목주름이 늘어나는 것', type: 'fine' },
      { k: 'B', t: '이중턱과 턱선이 흐려지는 것', type: 'sag' }
    ]},
    { sect: '섹션 2 · 노화 유형', label: 'Q11', q: '신경이 더 쓰이는<br>당신의 얼굴 부위는 어디인가요?', help: '하나를 선택해 주세요.', opts: [
      { k: 'A', t: '눈가와 입가', type: 'fine' },
      { k: 'B', t: '미간과 이마', type: 'muscle' }
    ]},
    { sect: '섹션 2 · 노화 유형', label: 'Q12', q: '당신을 더 나이 들어 보이게<br>만드는 것을 골라주세요.', help: '하나를 선택해 주세요.', opts: [
      { k: 'A', t: '처진 입꼬리와 볼살', type: 'sag' },
      { k: 'B', t: '미간이나 눈가에 잡히는 굵은 주름', type: 'muscle' }
    ]},
    { sect: '섹션 2 · 노화 유형', label: 'Q13', q: '지금 당장 가질 수 있다면<br>무엇을 선택하시겠어요?', help: '하나를 선택해 주세요.', opts: [
      { k: 'A', t: '광채 나는 피부톤', type: 'early' },
      { k: 'B', t: '생기 있고 탄력 있는 앞광대', type: 'tired' }
    ]},
    { sect: '섹션 2 · 노화 유형', label: 'Q14', q: '당신이 더 피하고 싶은<br>노화의 징후는 무엇인가요?', help: '하나를 선택해 주세요.', opts: [
      { k: 'A', t: '얼굴 전체 잔주름이 늘어나는 것', type: 'fine' },
      { k: 'B', t: '잡힌 표정 주름이 점점 깊어지는 것', type: 'muscle' }
    ]},
    { sect: '관리 부위', label: 'Q15', q: '노화로 인한 변화가<br>가장 크다고 느껴지는 부위는?', help: '최대 3개까지 선택할 수 있습니다.', multi: 3, grid: true, opts: [
      { t: '이마' }, { t: '미간' }, { t: '눈가' }, { t: '눈밑' }, { t: '앞광대' }, { t: '볼살' },
      { t: '팔자' }, { t: '입꼬리 처짐' }, { t: '입술 주변 잔주름' }, { t: '턱선' }, { t: '이중턱' }, { t: '목' }
    ]},
    { sect: '관리 우선순위', label: 'Q16', q: '선택하신 부위 중<br>가장 먼저 관리하고 싶은 곳은?', help: 'Q15에서 선택한 부위 중 1개만 골라주세요.', fromPrev: true, opts: [] },
    { sect: '기본 정보', label: 'Q17', q: '연령대가<br>어떻게 되시나요?', help: '1개만 골라주세요.', two: true, opts: [
      { k: 'A', t: '20대 초~중반' }, { k: 'B', t: '20대 중~후반' },
      { k: 'C', t: '30대 초~중반' }, { k: 'D', t: '30대 중~후반' },
      { k: 'E', t: '40대 초~중반' }, { k: 'F', t: '40대 중~후반' },
      { k: 'G', t: '50대 초~중반' }, { k: 'H', t: '50대 중반 이후' }
    ]},
    { sect: '기본 정보', label: 'Q18', q: '마지막으로<br>성별을 알려주세요', help: '1개만 골라주세요.', last: true, opts: [
      { k: 'A', t: '여성' }, { k: 'B', t: '남성' }
    ]}
  ];

  var TOTAL = QUESTIONS.length;
  var answers = {};          // index -> value(문자열) | 배열
  var step = -1;             // -1: intro,  0..17: 문항,  TOTAL: 완료
  var form = document.getElementById('svForm');

  var CHECK_SVG = '<svg viewBox="0 0 20 16" fill="none"><path d="M2 8.2 L7.2 13.4 L18 2.6" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function progressHTML(n, sect) {
    var pct = (n / TOTAL) * 100;
    return '<div class="sv__progress">' +
      '<div class="row"><span class="sect">' + sect + '</span>' +
      '<span class="cnt"><b>' + ('0' + n).slice(-2) + '</b> <em>/ ' + TOTAL + '</em></span></div>' +
      '<div class="track"><div class="fill" style="width:' + pct + '%"></div></div></div>';
  }

  function optionsHTML(q, idx) {
    var cur = answers[idx];
    var cls = 'sv__opts' + (q.grid ? ' is-grid' : (q.two ? ' is-two' : ''));
    var html = '<div class="' + cls + '">';
    q.opts.forEach(function (o, i) {
      var val = o.t;
      var on = Array.isArray(cur) ? cur.indexOf(val) > -1 : cur === val;
      html += '<button type="button" class="opt' + (on ? ' is-on' : '') + '" data-i="' + i + '">' +
        '<span class="mark">' + CHECK_SVG + '</span>' +
        (o.k ? '<span class="key">' + o.k + '</span>' : '') +
        '<span class="txt">' + esc(o.t) + '</span></button>';
    });
    return html + '</div>';
  }

  function navHTML(idx, q) {
    var cur = answers[idx];
    var ok = Array.isArray(cur) ? cur.length > 0 : !!cur;
    var nextLabel = q.last ? '설문 결과 보기' : '다음';
    return '<div class="sv__nav">' +
      '<button type="button" class="prev" data-go="-1"><span>←</span> 이전</button>' +
      '<button type="button" class="next" data-go="1"' + (ok ? '' : ' disabled') + '>' + nextLabel + ' <span>→</span></button>' +
      '</div>';
  }

  var EXPLAIN =
    '<div class="sv__explain">' +
    '<h3>케어클만의 맞춤형 초정밀 진단 솔루션, Aging Map 22</h3>' +
    '<p>* Aging Map 22는 눈가, 볼, 턱 등 노화가 드러나는 부위를 특징별로 세분화해 총 22개 좌표로 정밀하게 지도화한 grid 체계입니다.</p>' +
    '<p>피부 상태를 정밀한 지도처럼 보고, 당신의 노화 타입을 정의하여 그에 맞는 안티에이징 솔루션을 제공해 드립니다.</p>' +
    '</div>';

  function renderIntro() {
    form.innerHTML =
      '<div class="sv__intro">' +
      '<div class="label"><i></i><span>SKIN AGING SURVEY &nbsp;·&nbsp; 노화 타입 진단</span></div>' +
      '<h1>당신의 노화는<br>어떻게 진행되고 있을까요?</h1>' +
      '<p class="desc">아래 설문은 세계적으로 유명한 피부과 의사 인나 콜구넨코(Inna Kolgunenko) 박사가 제시한<br>5가지 노화 형태(Morphotypes)와 한국인의 피부 노화 특징에 대한 국내 연구를 기반으로 합니다.<br><br>' +
      '노화 타입(Aging Morphotypes)을 총 6가지 타입으로 분류하고, 추가적으로 얼굴의 총 22개 부위별로<br>맞춤 케어할 수 있는 과학적인 체계를 만들었습니다.</p>' +
      '<div class="sv__chips"><span><b>18</b> 문항</span><span><b>약 2</b> 분 소요</span><span><b>6</b> 가지 노화 타입</span></div>' +
      '<div class="go"><button type="button" class="btn btn--primary" data-start>설문 시작하기 <span>→</span></button></div>' +
      '<p class="caution">비회원도 참여할 수 있으며 간단 리포트를 제공합니다. 로그인 후 참여하면 구매 이력을 반영한 상세 리포트를 받아볼 수 있습니다.</p>' +
      '</div>';
  }

  function renderQuestion(idx) {
    var q = QUESTIONS[idx];
    if (q.fromPrev) {
      var picked = answers[14] || [];
      q.opts = picked.map(function (t, i) { return { k: 'ABC'.charAt(i), t: t }; });
      if (!q.opts.length) q.opts = [{ k: 'A', t: '아직 선택한 부위가 없습니다' }];
    }
    form.innerHTML =
      progressHTML(idx + 1, q.sect) +
      '<p class="sv__qlabel">' + q.label + '</p>' +
      '<h2 class="sv__q">' + q.q + '</h2>' +
      '<p class="sv__help">' + q.help +
        (q.multi ? ' <span class="sv__count">' + ((answers[idx] || []).length) + ' / ' + q.multi + ' 선택</span>' : '') +
      '</p>' +
      optionsHTML(q, idx) +
      (q.last ? EXPLAIN : '') +
      navHTML(idx, q);
    if (window.gsap) {
      gsap.fromTo(form.querySelectorAll('.sv__qlabel, .sv__q, .sv__help, .opt, .sv__explain, .sv__nav'),
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: .42, ease: 'power2.out', stagger: .03, clearProps: 'transform' });
    }
  }

  function syncOptions(q, idx) {
    var cur = answers[idx];
    var nodes = form.querySelectorAll('.opt');
    Array.prototype.forEach.call(nodes, function (el, i) {
      var val = q.opts[i].t;
      var on = Array.isArray(cur) ? cur.indexOf(val) > -1 : cur === val;
      el.classList.toggle('is-on', on);
    });
    var next = form.querySelector('.next');
    if (next) next.disabled = Array.isArray(cur) ? !cur.length : !cur;
    var counter = form.querySelector('.sv__count');
    if (counter && q.multi) counter.textContent = (Array.isArray(cur) ? cur.length : 0) + ' / ' + q.multi + ' 선택';
  }

  function renderDone() {
    /* 유형별 점수 집계 */
    var counts = {};
    Object.keys(answers).forEach(function (k) {
      var q = QUESTIONS[k], v = answers[k];
      if (!q || q.multi || q.fromPrev) return;
      q.opts.forEach(function (o) { if (o.type && o.t === v) counts[o.type] = (counts[o.type] || 0) + 1; });
    });
    var order = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });

    /* 1위가 동점이면 혼합형으로 본다 */
    var key = order[0] || 'early';
    if (order.length > 1 && counts[order[1]] === counts[order[0]]) key = 'mixed';

    form.innerHTML = window.ckuReport.html(key, {
      counts: counts,
      parts: (answers[14] || []).join(' · '),
      restart: true
    });
    window.ckuReport.fillBars(form);
  }

  function render() {
    if (step === -1) renderIntro();
    else if (step >= TOTAL) renderDone();
    else renderQuestion(step);
    /* 문항 이동 시 스크롤 위치 유지 (인트로/완료 화면 진입 때만 상단으로) */
    if ((step === -1 || step >= TOTAL) && window.scrollY > 40) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  form.addEventListener('click', function (e) {
    var startBtn = e.target.closest('[data-start]');
    if (startBtn) { step = 0; render(); return; }

    if (e.target.closest('[data-restart]')) {
      answers = {}; step = -1; render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    var opt = e.target.closest('.opt');
    if (opt) {
      var q = QUESTIONS[step];
      var i = parseInt(opt.dataset.i, 10);
      var val = q.opts[i].t;
      if (q.multi) {
        var arr = answers[step] || [];
        var at = arr.indexOf(val);
        if (at > -1) arr.splice(at, 1);
        else if (arr.length < q.multi) arr.push(val);
        answers[step] = arr;
      } else {
        answers[step] = val;
      }
      syncOptions(q, step);   // 다시 그리지 않고 상태만 갱신 → 깜빡임 제거
      return;
    }

    var go = e.target.closest('[data-go]');
    if (go) {
      var dir = parseInt(go.dataset.go, 10);
      step += dir;
      if (step < -1) step = -1;
      render();
    }
  });

  render();
})();
