/* =========================================================
   careCL — 진단 결과 리포트
   · 데이터와 마크업 생성을 한곳에 둔다.
   · survey.js(설문 완료 화면)와 report.html(미리보기)이 함께 쓴다.
   ========================================================= */
(function () {
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

var REPORT = {
  early: {
    code: 'TYPE 01 · EARLY AGING TYPE', name: '초기 노화형',
    tagline: '주름보다 피부톤과 맑음의 변화가 먼저 오는 유형',
    desc: '아직 깊은 주름이나 뚜렷한 처짐은 크지 않지만, 피부톤이 예전보다 칙칙해지고 기미·잡티가 눈에 띄며 피부의 맑음과 광채가 감소하기 시작하는 유형입니다.',
    traits: ['피부톤 저하', '기미 · 잡티', '칙칙함', '광채 감소', '피부결 변화'],
    concern: '피부톤 저하 · 기미 · 잡티 · 칙칙함 · 광채 감소'
  },
  tired: {
    code: 'TYPE 02 · TIRED TYPE', name: '피로형',
    tagline: '주름보다 생기와 활력이 먼저 줄어드는 유형',
    desc: '주름보다 먼저 얼굴의 생기와 활력이 줄어들며, 특히 눈밑을 중심으로 피곤하고 지쳐 보이는 인상이 나타나는 유형입니다.',
    traits: ['눈밑 변화', '다크서클', '안색 저하', '생기 부족', '입꼬리 변화'],
    concern: '눈밑 변화 · 다크서클 · 안색 저하 · 생기 부족 · 입꼬리 변화'
  },
  fine: {
    code: 'TYPE 03 · FINE-WRINKLED TYPE', name: '잔주름형',
    tagline: '윤곽보다 피부 표면의 잔주름이 먼저 보이는 유형',
    desc: '얼굴 윤곽의 변화보다 피부 표면의 잔주름이 먼저 두드러지는 유형입니다. 특히 눈가와 입가, 목처럼 피부가 얇거나 움직임이 많은 부위의 변화가 눈에 띄기 시작합니다.',
    traits: ['눈가 잔주름', '입가 잔주름', '목주름', '건조함', '얇아 보이는 피부'],
    concern: '눈가 잔주름 · 입가 잔주름 · 건조함 · 얇아 보이는 피부'
  },
  sag: {
    code: 'TYPE 04 · DEFORMATIONAL TYPE', name: '변형 · 처짐형',
    tagline: '주름보다 얼굴 윤곽과 형태의 변화가 먼저 느껴지는 유형',
    desc: '주름 자체보다 볼과 턱선 등 얼굴의 윤곽과 형태 변화가 먼저 느껴지는 유형입니다. 시간이 지나면서 중안면과 하안면의 변화가 보다 뚜렷하게 나타날 수 있습니다.',
    traits: ['볼 변화', '팔자 라인', '턱선 변화', '이중턱', '얼굴 윤곽 변화'],
    concern: '볼 변화 · 팔자 · 턱선 · 이중턱 · 얼굴 윤곽 변화'
  },
  muscle: {
    code: 'TYPE 05 · MUSCULAR TYPE', name: '근육형',
    tagline: '처짐보다 표정이 얼굴에 먼저 남는 유형',
    desc: '얼굴 윤곽은 오래 유지되지만 반복 사용하는 표정 근육이 얼굴에 흔적을 남깁니다. 미간·이마·눈가에 깊고 굵은 주름이 생기고 표정을 짓지 않아도 선이 남습니다. 노화가 진행될수록 인상이 점점 강해질 수 있습니다.',
    traits: ['미간 주름 증가', '이마 주름 증가', '깊은 표정주름', '윤곽 유지', '광대 돌출 · 볼 꺼짐 동반 가능'],
    concern: '미간 주름 · 이마 주름 · 표정주름 · 광대 돌출 · 볼 꺼짐'
  },
  mixed: {
    code: 'TYPE 06 · MIXED TYPE', name: '혼합형',
    tagline: '부위마다 다른 노화 패턴이 함께 나타나는 유형',
    desc: '실제 많은 사람의 얼굴은 하나의 유형만으로 변화하지 않습니다. 눈가는 잔주름형의 특징을 보이면서 볼과 턱에서는 변형·처짐형의 특징이 함께 나타날 수 있습니다. 혼합형은 얼굴의 부위마다 서로 다른 노화 패턴이 나타나는 유형입니다.',
    traits: ['부위별 패턴 혼재', '복합 관리 필요', '우선순위 설정이 중요'],
    concern: '부위마다 다른 노화 패턴 · 복합 관리 필요'
  }
};


  var NAMES = {
    early: '초기 노화형', tired: '피로형', fine: '잔주름형',
    sag: '변형 · 처짐형', muscle: '근육형', mixed: '혼합형'
  };

  var ORDER = ['early', 'tired', 'fine', 'sag', 'muscle', 'mixed'];
  var EN = { early: 'Early Aging', tired: 'Tired', fine: 'Fine-Wrinkled',
             sag: 'Deformational', muscle: 'Muscular', mixed: 'Mixed' };

  /* 미리보기(설문 없이 report.html)에서 쓰는 예시 분포 — 결과 유형이 가장 높게 */
  function sample(key) {
    var base = [9, 14, 7, 11, 6, 5], c = {}, i = 0;
    ORDER.forEach(function (k) { c[k] = base[i++ % base.length]; });
    c[key] = 48;
    return c;
  }

  /* 리포트 번호 — 유형과 날짜로 만든 짧은 번호 (기록처럼 보이게) */
  function reportNo(key, d) {
    var n = (ORDER.indexOf(key) + 1) * 1000 + d.getDate() * 31 + d.getMonth() * 7;
    return 'CL-' + String(n).padStart(4, '0');
  }

  /* counts : { 타입키: 점수 } — 없으면 예시 분포를 쓰고 '예시'라고 표시한다
     parts  : '이마 · 눈가' 처럼 이어 붙인 집중 관리 부위 문자열      */
  function html(key, opts) {
    opts = opts || {};
    var k = REPORT[key] ? key : 'early';
    var R = REPORT[k];
    var isSample = !opts.counts;
    var counts = opts.counts || sample(k);
    var parts = opts.parts || '';
    var d = new Date();
    var date = d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');

    var total = ORDER.reduce(function (n, t) { return n + (counts[t] || 0); }, 0) || 1;
    var rows = ORDER.slice().sort(function (a, b) { return (counts[b] || 0) - (counts[a] || 0); });
    var prob = rows.map(function (t) {
      var pct = Math.round((counts[t] || 0) / total * 100);
      return '<li class="rpt-prob__row' + (t === k ? ' is-top' : '') + '">' +
        '<span class="rpt-prob__name"><b>' + esc(NAMES[t]) + '</b><em>' + EN[t] + '</em></span>' +
        '<span class="cku-bar rpt-prob__bar"><i data-w="' + pct + '"></i></span>' +
        '<span class="rpt-prob__pct" data-n="' + pct + '">0%</span></li>';
    }).join('');

    var dots = '';
    for (var i = 0; i < 22; i++) dots += '<i style="--i:' + i + '"></i>';

    return '<div class="cku-main rpt" data-rpt>' +
      '<section class="rpt-scan">' +
        '<p class="rpt-meta"><span>AI SKIN REPORT</span><span>No. ' + reportNo(k, d) + '</span><span>' + date + '</span><span>AGING MAP 22</span></p>' +
        '<div class="rpt-head">' +
          '<div class="rpt-head__copy">' +
            '<p class="rpt-eyebrow">진단 결과</p>' +
            '<p class="rpt-code">' + R.code + '</p>' +
            '<h2 class="rpt-name">' + esc(R.name) + '</h2>' +
            '<p class="rpt-tagline">' + esc(R.tagline) + '</p>' +
          '</div>' +
          '<figure class="rpt-visual"><span class="rpt-grid" aria-hidden="true">' + dots + '</span>' +
            '<img src="assets/img/report/type-' + k + '.svg" alt="' + esc(R.name) + ' — 먼저 변화가 나타나는 부위"></figure>' +
        '</div>' +
        '<i class="rpt-scanline" aria-hidden="true"></i>' +
      '</section>' +
      '<section class="rpt-prob">' +
        '<div class="rpt-sec-head"><p class="rpt-label">AI Analysis</p><h3>유형별 일치도</h3>' +
          (isSample ? '<span class="rpt-sample">예시 분포</span>' : '') + '</div>' +
        '<ol class="rpt-prob__list">' + prob + '</ol>' +
      '</section>' +
      '<section class="rpt-detail">' +
        '<div class="rpt-detail__desc"><p class="rpt-label">Summary</p><p class="rpt-desc">' + esc(R.desc) + '</p></div>' +
        '<div class="rpt-detail__side">' +
          '<p class="rpt-label">Characteristics</p>' +
          '<ol class="rpt-traits">' + R.traits.map(function (t, i) {
            return '<li><em>' + String(i + 1).padStart(2, '0') + '</em>' + esc(t) + '</li>'; }).join('') + '</ol>' +
          '<div class="rpt-concern"><p class="rpt-label">대표 고민</p><p>' + esc(R.concern) + '</p></div>' +
          (parts ? '<div class="rpt-concern"><p class="rpt-label">집중 관리 부위</p><p>' + esc(parts) + '</p></div>' : '') +
        '</div>' +
      '</section>' +
      '<div class="rpt-actions">' +
        (opts.restart
          ? '<button type="button" class="btn-line" data-restart>AI 피부 진단 다시하기 →</button>'
          : '<a class="btn-line" href="survey.html">AI 피부 진단 다시하기 →</a>') +
        '<a class="btn-line" href="aging-map.html">AGING MAP 22 보기 →</a>' +
      '</div>' +
      '<p class="rpt-note">본 결과는 설문 응답을 바탕으로 한 참고용 분석이며 의학적 진단이 아닙니다. ' +
      '로그인 후 참여하면 구매 이력과 사용 주기를 반영한 상세 리포트를 받아볼 수 있습니다.</p>' +
    '</div>';
  }

  /* 분포 막대 · 숫자는 그려진 뒤에 채운다 (스캔 선이 지나간 다음) */
  function fillBars(root) {
    root = root || document;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(function () {
      Array.prototype.forEach.call(root.querySelectorAll('.cku-bar i'), function (b) { b.style.width = b.dataset.w + '%'; });
      Array.prototype.forEach.call(root.querySelectorAll('.rpt-prob__pct'), function (el) {
        var n = +el.dataset.n, t0 = null;
        if (reduce) { el.textContent = n + '%'; return; }
        (function step(t) {
          if (!t0) t0 = t;
          var p = Math.min(1, (t - t0) / 1100);
          el.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))) + '%';
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, reduce ? 0 : 1500);
  }

  window.ckuReport = { data: REPORT, names: NAMES, html: html, fillBars: fillBars };
})();
