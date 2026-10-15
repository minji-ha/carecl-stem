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

  /* counts : { 타입키: 점수 } — 없으면 분포를 그리지 않는다
     parts  : '이마 · 눈가' 처럼 이어 붙인 집중 관리 부위 문자열      */
  function html(key, opts) {
    opts = opts || {};
    var R = REPORT[key] || REPORT.early;
    var counts = opts.counts || null;
    var parts = opts.parts || '';

    var scale = '';
    if (counts) {
      var order = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
      var total = order.reduce(function (n, k) { return n + counts[k]; }, 0);
      if (total > 0) {
        scale = '<div class="cku-result-scale"><em>응답 분포</em>' +
          order.map(function (k, i) {
            var pct = Math.round(counts[k] / total * 100);
            return '<div class="cku-scale-row' + (i === 0 ? ' is-top' : '') + '">' +
              '<b>' + esc(NAMES[k] || k) + '</b>' +
              '<span class="cku-bar"><i data-w="' + pct + '"></i></span>' +
              '<span>' + pct + '%</span></div>';
          }).join('') + '</div>';
      }
    }

    return '<main class="cku-main"><div class="cku-result">' +
      '<div class="cku-result-head"><div>' +
      '<p class="cku-result-eyebrow">진단 결과</p>' +
      '<h2 class="cku-result-title"><span class="cku-code">' + R.code + '</span>' + esc(R.name) + '</h2>' +
      '<p class="cku-result-tagline">' + esc(R.tagline) + '</p>' +
      '</div><figure class="cku-result-visual"><img src="assets/img/report/type-' + (REPORT[key] ? key : 'early') +
        '.svg" alt="' + esc(R.name) + ' — 먼저 변화가 나타나는 부위"></figure></div>' +
      '<p class="cku-result-desc">' + esc(R.desc) + '</p>' +
      '<ul class="cku-result-traits">' +
        R.traits.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') +
      '</ul>' +
      '<p class="cku-result-concern">' + esc(R.concern) + '</p>' +
      (parts ? '<p class="cku-result-parts">' + esc(parts) + '</p>' : '') +
      scale +
      '<div class="cku-result-actions">' +
        (opts.restart
          ? '<button type="button" class="cku-btn cku-btn-primary" data-restart>AI 피부 진단 다시하기 <span>→</span></button>'
          : '<a class="cku-btn cku-btn-primary" href="survey.html">AI 피부 진단 다시하기 <span>→</span></a>') +
      '</div>' +
      '<p class="cku-result-note">본 결과는 설문 응답을 바탕으로 한 참고용 분석이며 의학적 진단이 아닙니다. ' +
      '로그인 후 참여하면 구매 이력과 사용 주기를 반영한 상세 리포트를 받아볼 수 있습니다.</p>' +
      '</div></main>';
  }

  /* 분포 막대는 그려진 뒤에 채운다 */
  function fillBars(root) {
    setTimeout(function () {
      var bars = (root || document).querySelectorAll('.cku-bar i');
      Array.prototype.forEach.call(bars, function (b) { b.style.width = b.dataset.w + '%'; });
    }, 60);
  }

  window.ckuReport = { data: REPORT, names: NAMES, html: html, fillBars: fillBars };
})();
