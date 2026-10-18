/* =========================================================
   careCL — 진단 결과 리포트
   · 화면 구성: 개발 화면(Checkup.tsx) 카드 순서 그대로
   · 문구: js/report-data.js (결과지 FINAL pptx 8종에서 자동 생성)
   · survey.js(설문 완료 화면)와 report.html(미리보기)이 함께 쓴다.
   ========================================================= */
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  /* 유형 소개(커버 아래 카드) — 비로그인에도 공개되는 요약 */
  var REPORT = {
    early: {
      en: 'Early Aging Type', name: '초기노화형',
      tagline: '주름보다 피부톤과 맑음의 변화가 먼저 오는 유형',
      desc: '아직 깊은 주름이나 뚜렷한 처짐은 크지 않지만, 피부톤이 예전보다 칙칙해지고 기미·잡티가 눈에 띄며 피부의 맑음과 광채가 감소하기 시작하는 유형입니다.',
      traits: ['피부톤 저하', '기미 · 잡티', '칙칙함', '광채 감소', '피부결 변화'],
      concern: '피부톤 저하 · 기미 · 잡티 · 칙칙함 · 광채 감소'
    },
    tired: {
      en: 'Tired Type', name: '피로형',
      tagline: '주름보다 생기와 활력이 먼저 줄어드는 유형',
      desc: '주름보다 먼저 얼굴의 생기와 활력이 줄어들며, 특히 눈밑을 중심으로 피곤하고 지쳐 보이는 인상이 나타나는 유형입니다.',
      traits: ['눈밑 변화', '다크서클', '안색 저하', '생기 부족', '입꼬리 변화'],
      concern: '눈밑 변화 · 다크서클 · 안색 저하 · 생기 부족 · 입꼬리 변화'
    },
    fine: {
      en: 'Fine-Wrinkled Type', name: '잔주름형',
      tagline: '윤곽보다 피부 표면의 잔주름이 먼저 보이는 유형',
      desc: '얼굴 윤곽의 변화보다 피부 표면의 잔주름이 먼저 두드러지는 유형입니다. 특히 눈가와 입가, 목처럼 피부가 얇거나 움직임이 많은 부위의 변화가 눈에 띄기 시작합니다.',
      traits: ['눈가 잔주름', '입가 잔주름', '목주름', '건조함', '얇아 보이는 피부'],
      concern: '눈가 잔주름 · 입가 잔주름 · 건조함 · 얇아 보이는 피부'
    },
    sag: {
      en: 'Deformational Type', name: '변형·처짐형',
      tagline: '주름보다 얼굴 윤곽과 형태의 변화가 먼저 느껴지는 유형',
      desc: '주름 자체보다 볼과 턱선 등 얼굴의 윤곽과 형태 변화가 먼저 느껴지는 유형입니다. 시간이 지나면서 중안면과 하안면의 변화가 보다 뚜렷하게 나타날 수 있습니다.',
      traits: ['볼 변화', '팔자 라인', '턱선 변화', '이중턱', '얼굴 윤곽 변화'],
      concern: '볼 변화 · 팔자 · 턱선 · 이중턱 · 얼굴 윤곽 변화'
    },
    muscle: {
      en: 'Muscular Type', name: '근육형',
      tagline: '처짐보다 표정이 얼굴에 먼저 남는 유형',
      desc: '얼굴 윤곽은 오래 유지되지만 반복 사용하는 표정 근육이 얼굴에 흔적을 남깁니다. 미간·이마·눈가에 깊고 굵은 주름이 생기고 표정을 짓지 않아도 선이 남습니다. 노화가 진행될수록 인상이 점점 강해질 수 있습니다.',
      traits: ['미간 주름 증가', '이마 주름 증가', '깊은 표정주름', '윤곽 유지', '광대 돌출 · 볼 꺼짐 동반 가능'],
      concern: '미간 주름 · 이마 주름 · 표정주름 · 광대 돌출 · 볼 꺼짐'
    },
    mixed: {
      en: 'Combined Type', name: '혼합형',
      tagline: '부위별로 노화 패턴이 다르게 나타나는 유형',
      desc: '실제 많은 사람들은 하나의 유형만으로 심플하게 노화가 진행되진 않습니다. 특히 중년 이후 노화가 가속화될 경우 혼합형 노화 유형일 가능성이 높습니다. 눈가는 잔주름형으로 진행되면서 턱과 볼 부위는 변형 처짐형으로 진행되는 경우가 가장 흔한 혼합형 중 하나입니다. 혼합형은 특정 1가지 문제가 아니라 여러 노화 패턴이 동시에 나타나는 상태를 의미하기 때문에 관리 우선 순위를 잘 정하고 체계적인 관리를 늦추지 말고 시작하는 것이 좋습니다.',
      traits: ['복합 노화 진행', '여러 유형 동시 발생', '다양한 부위 노화 신호', '관리 우선순위 설정이 중요'],
      concern: '복합 노화 · 전반적 노화 · 다중 피부 고민'
    }
  };

  /* 유형과 관계없이 늘 같은 내용 (개발 화면 resultStaticContent.ts와 동일) */
  var DEVICE_TABLE = [
    ['고주파(RF)', '고주파 에너지를 피부 속 깊이 전달해 탄력·처짐·윤곽 관리'],
    ['초음파(US·HIFU)', 'HIFU는 강한 에너지로 처짐 관리 (단, 자극이 강해 볼 꺼짐(지방 감소) 동반 가능) 초음파 미세진동 방식(예: LDM)은 피부 진정·수분 관리'],
    ['EMS', '전기 자극으로 하안부·표정 주름 관리, 고주파와 병행 사용 시 더욱 효과적'],
    ['LED·미세전류·갈바닉·EP', '빛·약한 전류로 피부 톤·광채·컨디션 관리 · EP(전기천공)는 유효성분 흡수를 도움'],
    ['진동·롤러', '마사지로 순환·부기 관리']
  ];
  var SHOT_FAQ = [
    ['① 샷(SHOT)이 뭔가요?', "한 자리에 헤드를 대고 약 5초간 밀착하는 동작(스탬핑)이 '1샷'입니다. 안내된 샷수는 한 곳을 그만큼 누르는 게 아니라, 그리드 칸을 따라 자리를 옮겨가며 그 부위를 빠짐없이 덮는 대략적인 횟수예요. 그리드 마스크팩 칸을 채운다고 생각하시면 되고, 정확히 세지 않으셔도 괜찮습니다."],
    ['② 자동 종료 타이머', 'SHOT 모드는 7분, GLOW·EMS 모드는 5분이 지나면 안전을 위해 자동으로 종료됩니다. 안내해 드린 부위를 순서대로 관리하시면 대부분 그 전에 끝나며, 관리할 부위가 많이 남았을 때만 다시 켜서 이어 진행하시면 됩니다.'],
    ['③ 강도(레벨) 조절', '레벨은 1~5단계이며, 처음 사용하실 땐 낮은 단계부터 시작하세요. 따뜻한 열감이 느껴지는 정도가 적정이고, 뜨겁게 느껴지면 레벨을 낮추면 됩니다. (그리드 마스크팩과 함께 쓸 땐 3단계부터, 콜라겐 젤·민감성 피부는 1단계부터 권장)']
  ];
  var DISCLAIMER = '본 결과는 고객님의 설문 응답을 바탕으로 현재 인식하는 노화 특성과 관리 우선순위를 안내하는 참고용 분석이며, 의료적 진단이 아닙니다. 사진 촬영·의료적 검사를 통한 진단 결과가 아니며, 실제 피부 상태와 체감 변화는 개인에 따라 다를 수 있습니다. 피부 질환이나 지속적인 이상 증상이 있는 경우 의료전문가와 상담하시기 바랍니다.';

  var AXES = [['fine', '잔주름형', 8], ['sag', '변형·처짐형', 7], ['muscle', '근육형', 9], ['tired', '피로형', 9], ['early', '초기노화형', 7]];

  /* 미리보기(설문 없이 report.html)용 예시 응답 — 결과 유형이 가장 높게 */
  function sample(key) {
    var c = { fine: 2, sag: 2, muscle: 2, tired: 2, early: 1 };
    if (key === 'mixed') { c.fine = 6; c.sag = 6; } else c[key] = 7;
    return c;
  }

  function dataFor(key, mixWith) {
    var all = window.ckuReportData || {};
    if (key !== 'mixed') return all[key];
    return all['mixed_' + (mixWith === 'tired' || mixWith === 'muscle' ? mixWith : 'fine')];
  }

  function p(arr, cls) { return (arr || []).map(function (t) { return '<p class="' + (cls || 'rp-desc') + '">' + esc(t) + '</p>'; }).join(''); }
  function card(icon, title, inner, extra) {
    return '<section class="rp-card' + (extra ? ' ' + extra : '') + '"><h3 class="rp-ct"><i aria-hidden="true">' + icon + '</i>' + esc(title) + '</h3>' + inner + '</section>';
  }

  /* opts: { counts, roles:{key:'대표'|'보조'}, mixWith, parts, restart } */
  function html(key, opts) {
    opts = opts || {};
    var k = REPORT[key] ? key : 'early';
    var R = REPORT[k];
    var D = dataFor(k, opts.mixWith) || {};
    var counts = opts.counts || sample(k);
    var roles = opts.roles || {};

    /* 커버 숫자 */
    var areas = D.areas || [];
    var shotModes = [];
    (D.shots || []).forEach(function (s) { if (shotModes.indexOf(s.mode) < 0) shotModes.push(s.mode); });
    var freq = ((D.frequency || '').match(/주\s*\d+\s*~\s*\d+\s*회/) || [''])[0];
    var glowDaily = /GLOW\s*모드는\s*매일/.test(D.frequency || '');

    /* 유형별 신호 세기 (상대값) */
    var norm = AXES.map(function (a) { return (counts[a[0]] || 0) / a[2]; });
    var top = Math.max.apply(null, norm) || 1;
    var dist = AXES.map(function (a, i) {
      var role = roles[a[0]];
      return '<li' + (role ? ' class="on"' : '') + '><span>' + esc(a[1]) + (role ? '<em>' + role + '</em>' : '') + '</span>' +
        '<span class="rp-tr"><i data-w="' + Math.round(norm[i] / top * 100) + '"></i></span></li>';
    }).join('');

    var maxShot = Math.max.apply(null, (D.shots || []).map(function (s) { return s.count; }).concat([1]));

    return '<div class="rp" data-rpt>' +
      /* 커버 */
      '<section class="rp-card rp-cover">' +
        '<p class="rp-eyebrow">진단 결과</p>' +
        '<p class="rp-code">' + esc(R.en) + '</p>' +
        '<h2 class="rp-name">' + esc(R.name) + '</h2>' +
        '<p class="rp-tag">' + esc(R.tagline) + '</p>' +
        '<div class="rp-stats">' +
          (areas.length ? '<div class="rp-stat"><span class="l">집중 관리 부위</span><span class="v">' + areas.length + '곳</span><span class="n">' + esc(areas.map(function (a) { return a.name; }).join(' · ')) + '</span></div>' : '') +
          (D.shotTotal ? '<div class="rp-stat"><span class="l">권장 SHOT</span><span class="v">' + D.shotTotal + '샷</span><span class="n">' + esc(shotModes.join(' · ')) + '</span></div>' : '') +
          (freq ? '<div class="rp-stat"><span class="l">권장 빈도</span><span class="v">' + esc(freq) + '</span><span class="n">' + (glowDaily ? 'GLOW 모드는 매일 가능' : '') + '</span></div>' : '') +
        '</div>' +
      '</section>' +

      /* 유형 소개 */
      '<section class="rp-card">' +
        '<p class="rp-desc">' + esc(R.desc) + '</p>' +
        '<ul class="rp-traits">' + R.traits.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
        '<p class="rp-concern"><small>대표 고민</small>' + esc(R.concern) + '</p>' +
      '</section>' +

      /* 왜 이 유형 */
      card('?', '왜 ' + R.name + '으로 진단된 걸까요?',
        p(D.reason) +
        (D.evidence && D.evidence.length ? '<div class="rp-evidence"><p>고객님의 설문에서도 이런 답변이 많았습니다</p><ul class="rp-checks">' +
          D.evidence.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' : '') +
        '<div class="rp-dist"><p class="rp-dist-t">설문 답변에서 읽힌 노화 신호</p><ul>' + dist + '</ul>' +
          '<p class="rp-dist-n">점수가 아니라 답변에서 읽힌 신호의 상대적인 세기입니다. 막대가 길수록 그 유형의 신호가 자주 나타났다는 뜻이에요.</p></div>' +
        (D.reasonNote ? '<p class="rp-desc rp-divided">' + esc(D.reasonNote) + '</p>' : '')) +

      /* 집중 케어 부위 */
      (areas.length ? card('◎', '집중 케어가 필요한 부위',
        (D.areaIntro ? '<p class="rp-desc">' + esc(D.areaIntro) + '</p>' : '') +
        '<ol class="rp-top3">' + areas.map(function (a, i) {
          return '<li' + (i === 0 ? ' class="p"' : '') + '><span class="no">' + (i + 1) + '</span><span><span class="nm">' + esc(a.name) + '</span>' +
            (a.pattern ? '<span class="pt">' + esc(a.pattern) + '</span>' : '') + '</span><code>' + esc(a.code) + '</code></li>';
        }).join('') + '</ol>' +
        '<p class="rp-legend"><b>U · M · L은?</b> 얼굴을 위(U) · 중앙(M) · 아래(L) 구역으로 나눈 케어클 에이징맵 좌표입니다.</p>' +
        (opts.parts ? '<p class="rp-legend"><b>내가 고른 부위</b> ' + esc(opts.parts) + '</p>' : '') +
        '<div class="rp-divided">' + p(D.areaText) + '</div>') : '') +

      /* 홈케어 루틴 */
      (D.homecare && D.homecare.length ? card('☀', '홈케어 루틴',
        '<ol class="rp-steps">' + D.homecare.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>') : '') +

      '<div class="rp-row2">' +
        card('✦', '화장품 고르는 Tip', '<div class="rp-chips">' + (D.ingredients || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>') +
        card('♥', '생활습관 포인트', '<div class="rp-chips">' + (D.lifestyle || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>') +
      '</div>' +

      /* 디바이스 */
      card('⚡', '뷰티 디바이스 종류와 특징',
        '<table class="rp-tbl"><tbody>' + DEVICE_TABLE.map(function (r) { return '<tr><th>' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>'; }).join('') + '</tbody></table>' +
        (D.deviceRec ? '<p class="rp-callout">' + esc(D.deviceRec) + '</p>' : '')) +

      (D.rf && D.rf.length ? card('≋', '고주파(RF) 기술과 케어클', p(D.rf)) : '') +

      /* 맞춤 사용법 */
      card('☰', '맞춤 사용법',
        p(D.usage) +
        (D.order && D.order.length ? '<p class="rp-sub">관리 순서</p><ol class="rp-order">' + D.order.map(function (t, i) {
          return '<li' + (/모드/.test(t) ? ' class="dev"' : '') + '><b>' + (i + 1) + '</b>' + esc(t) + '</li>'; }).join('') + '</ol>' : '') +
        (D.frequency ? '<p class="rp-callout"><b>권장 빈도 · </b>' + esc(D.frequency) + '</p>' : '')) +

      /* SHOT 가이드 */
      (D.shots && D.shots.length ? card('◉', 'SHOT 모드 가이드',
        '<div class="rp-shots">' + D.shots.map(function (s) {
          return '<div class="rp-shot"><div class="h"><span class="a">' + esc(s.name) + ' <code>' + esc(s.code) + '</code></span><span class="c">' + s.count + '샷</span></div>' +
            '<p>' + esc(s.mode) + ' · ' + esc(s.dir) + '</p><div class="bar"><i style="width:' + Math.round(s.count / maxShot * 100) + '%"></i></div></div>';
        }).join('') + '</div>' +
        (D.shotTotal ? '<div class="rp-shot-total"><b>총 ' + D.shotTotal + '샷</b><span>SHOT 모드는 7분 후 자동 종료되니, 남은 부위가 있으면 다시 켜서 이어 진행하세요.</span></div>' : '')) : '') +

      (D.modes && D.modes.length ? card('✓', 'SHOT 이후 마무리 단계',
        '<div class="rp-modes">' + D.modes.map(function (m) {
          var badge = m.required === true ? '<em class="req">필수</em>' : m.required === false ? '<em>선택</em>' : '';
          return '<div class="rp-mode' + (m.required ? ' req' : '') + '"><p class="h">' + esc(m.name) + badge + (m.duration ? '<span>' + esc(m.duration) + '</span>' : '') + '</p><p>' + esc(m.desc) + '</p></div>';
        }).join('') + '</div>') : '') +

      card('?', 'SHOT 모드, 이렇게 사용하세요',
        '<div class="rp-faq">' + SHOT_FAQ.map(function (f) {
          return '<div><p class="q">' + esc(f[0]) + '</p>' + (f[0].indexOf('강도') > -1 ? '<div class="rp-levels" aria-hidden="true"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>' : '') + '<p class="a">' + esc(f[1]) + '</p></div>';
        }).join('') + '</div>') +

      (D.busy && D.busy.length ? card('⏱', '바빠서 모든 단계가 부담되는 날에는', p(D.busy)) : '') +

      /* 혜택 */
      card('%', 'AI 분석 결과 고객 전용 혜택',
        '<div class="rp-coupons">' +
          '<div class="rp-cp main"><span class="k">아직 케어클이 없으시다면</span><h4>지금 TECH FIT을 시작하기 좋은 때</h4><p class="price">정가 820,000원</p>' +
            '<p class="sale"><small>30% 할인</small>568,000원</p><p class="plus">＋ 자사몰 첫 구매 쿠폰 5만원 할인<br>→ 쿠폰 적용 시 최종 518,000원</p><a class="rp-btn or" href="products.html">쿠폰 받고 TECH FIT 시작하기</a></div>' +
          '<div class="rp-cp"><span class="k">이미 케어클을 쓰고 계신다면</span><h4>소모품을 더 알뜰하게</h4><p class="plus">그리드 마스크팩 · 콜라겐 젤 등 소모품을 자사몰에서 재구매할 때 쓰는 쿠폰</p>' +
            '<p class="sale"><small>소모품</small>20% 할인</p><a class="rp-btn dark" href="cosmetics.html">소모품 쿠폰 받기</a></div>' +
        '</div><p class="rp-note">※ 모든 쿠폰은 케어클 자사몰에서 사용 가능합니다.</p>') +

      /* 후기 */
      (D.reviews && D.reviews.length ? card('★', '비슷한 고민을 가진 고객의 실제 후기',
        '<div class="rp-reviews">' + D.reviews.map(function (r) {
          return '<div class="rp-rv"><span class="st">★★★★★</span><q>' + esc(r.quote) + '</q><div class="m"><span>' + esc(r.type) + '</span>' +
            (r.concern ? '<span>주요 고민 : ' + esc(r.concern) + '</span>' : '') + (r.period ? '<span>' + esc(r.period) + '</span>' : '') + '</div></div>';
        }).join('') + '</div>') : '') +

      '<p class="rp-note">' + DISCLAIMER + '</p>' +

      '<div class="rp-actions">' +
        (opts.restart ? '<button type="button" class="rp-btn line" data-restart>다시 하기</button>' : '<a class="rp-btn line" href="survey.html">다시 하기</a>') +
        '<a class="rp-btn line" href="aging-map.html">AGING MAP 22 보기 →</a>' +
      '</div>' +
    '</div>';
  }

  /* 막대는 그려진 다음에 채운다 */
  function fillBars(root) {
    root = root || document;
    setTimeout(function () {
      Array.prototype.forEach.call(root.querySelectorAll('.rp-tr i'), function (b) { b.style.width = b.dataset.w + '%'; });
    }, 120);
  }

  window.ckuReport = { data: REPORT, html: html, fillBars: fillBars, sample: sample };
})();
