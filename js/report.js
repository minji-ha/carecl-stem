/* =========================================================
   careCL — 진단 결과 리포트
   · 화면 구성·디자인: 개발 화면(Checkup.tsx · checkup.css)과 같은 마크업 → css/checkup-result.css
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

  /* 카드 제목 아이콘 — 개발 화면 ResultIcons.tsx와 같은 선 아이콘 */
  var ICON_PATHS = {
    reason: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.7-1.5 1.2-1.5 2.5M12 17h.01"/>',
    area: '<path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    homecare: '<path d="M12 3c3.5 4 6 7 6 10a6 6 0 01-12 0c0-3 2.5-6 6-10z"/>',
    ingredient: '<path d="M9 3h6M10 3v6l-5 8a3 3 0 002.6 4.5h8.8A3 3 0 0019 17l-5-8V3"/>',
    lifestyle: '<path d="M20.5 13A8.5 8.5 0 1111 3.5a6.5 6.5 0 009.5 9.5z"/>',
    device: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    rf: '<path d="M2 12c2.5-4 5-4 7.5 0s5 4 7.5 0 3.5-3.4 5-1.4"/><path d="M2 18c2.5-4 5-4 7.5 0s5 4 7.5 0"/>',
    usage: '<path d="M5 4v6a4 4 0 004 4h6"/><path d="M15 11l4 3-4 3"/>',
    shot: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>',
    faq: '<path d="M21 12a8 8 0 01-8 8H8l-4 3v-5.5A8 8 0 1121 12z"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.8.6-1.5 1-1.5 2M12 16h.01"/>',
    busy: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    ai: '<path d="M21 12a8 8 0 01-8 8H8l-4 3v-5.5A8 8 0 1121 12z"/><path d="M9 11h6M9 14h4"/>',
    coupon: '<path d="M3 9V6a1 1 0 011-1h16a1 1 0 011 1v3a3 3 0 000 6v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3a3 3 0 000-6z"/><path d="M13 5v14"/>',
    review: '<path d="M16 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 18.5V20"/><circle cx="10" cy="8" r="3.2"/><path d="M20 20v-1.5a3.5 3.5 0 00-2.6-3.4M15.5 5.2a3.2 3.2 0 010 5.6"/>'
  };
  function icon(name) {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON_PATHS[name] || '') + '</svg>';
  }
  function title(ic, text, extra) {
    return '<h3 class="cku-card-title"><span class="cku-card-icon">' + icon(ic) + '</span>' + text + (extra || '') + '</h3>';
  }
  function card(ic, text, inner, cls) { return '<section class="cku-card' + (cls ? ' ' + cls : '') + '">' + title(ic, esc(text)) + inner + '</section>'; }
  function paras(arr, cls) { return (arr || []).map(function (t) { return '<p class="cku-result-desc' + (cls ? ' ' + cls : '') + '">' + esc(t) + '</p>'; }).join(''); }

  /* 추천 성분 설명 — 세라마이드는 개발 화면 문구 그대로, 나머지는 같은 말투로 쓴 초안(고객사 확인 필요) */
  var INGREDIENT_INFO = {
    '세라마이드': '피부 바깥층을 이루는 지질 성분입니다. 건조해서 당기는 피부의 수분을 붙잡아 두는 데 쓰입니다.',
    '펩타이드': '아미노산 몇 개가 이어진 작은 단백질 조각입니다. 탄력 관리 화장품에 널리 쓰입니다.',
    '콜라겐 추출물': '피부 탄력 섬유의 주성분인 콜라겐에서 얻은 성분입니다. 피부 표면을 촉촉하고 매끄럽게 가꾸는 데 쓰입니다.',
    '히알루론산': '수분을 많이 머금는 보습 성분입니다. 피부에 수분을 채워 촉촉하게 유지하는 데 쓰입니다.',
    '레티놀': '비타민 A 계열 성분으로 주름 관리 화장품에 쓰입니다. 처음에는 저녁에 소량부터 쓰는 것이 좋습니다.',
    '아데노신': '주름 개선 기능성 원료로 쓰이는 성분입니다. 탄력·주름 관리 화장품에 들어갑니다.',
    '이데베논': '항산화 성분입니다. 자외선·환경 자극으로 흐려진 피부 컨디션을 관리하는 화장품에 쓰입니다.',
    '트라넥삼산': '피부 톤 관리 화장품에 쓰이는 성분입니다. 칙칙함·잡티가 신경 쓰일 때 고르는 성분입니다.',
    'PDRN': '연어 등에서 얻은 DNA 조각 성분입니다. 피부 결과 컨디션을 가꾸는 화장품에 쓰입니다.',
    '카페인': '부기와 칙칙함이 신경 쓰이는 눈가 제품에 자주 쓰이는 성분입니다.'
  };

  /* 실제 구매 후기 — 개발 화면 결과지에 노출된 쇼핑몰 후기(원문 그대로) */
  var REVIEWS = [
    { tag: '주름 이야기 · 눈가 · 옆볼 · 꾸준히 사용 중', rating: 5, date: '2025년 3월',
      body: '피부과 갈 돈은 없고... 애키우느라 시간도 없고..ㅋㅋ요즘 홈케어가 대세라길래 요고 큰맘먹고 주문했어여. 일단 다른 뷰티기기와 다르게 써마지 처럼 스탬핑빙식이라 뭔가 효과가 남다를거 같아서요. 애 재우고 요즘 맨날하는데 늠나 좋네여 ㅋㅋ 헤드피스도 2가지라 부위별로 케어할 수 있고~ 2주? 정도 꾸준히 쓴거같은디 볼옆 눈가 주름들 신경쓰이는 부위들 좋아지는게 눈에 보여요!! 저 콜라겐젤 필수~ㅎㅋㅋ 4단계로 주로 쓰는데 저거도톰하게 발라야 참을만해여 ㅋㅋ' },
    { tag: '주름 · 탄력·처짐 이야기 · 눈가 · 팔자 · 꾸준히 사용 중', rating: 5, date: '2024년 2월',
      body: '하루 빼고 매일 사용한 후기입니다~일단 제일 좋아진건 전체적인 탄력 과 모공이네요. 눈가 잔주름도 많이 좋아졌구요. 큰주름(팔자) 눈에 띄게 좋아지진 않았어요. 미세하게 어느날은 좋아진것 같다가 어느날 많이 웃고다니면 또 줄어들고 있나 싶긴해요 ㅎ 근데 저희 언니는 명절에 만나 2번사용하고 정말 눈에띄게 팔자주름이 없어지더라구요..사람마다 조금 다른가보다 싶어요. 더 열심히 관리하면 좋아질거라 생각하고 사용중입니다. 언니는 효과보고 주변에 입소문 냈더라구요 ㅎㅎ' },
    { tag: '주름 · 탄력·처짐 이야기 · 눈가 · 꾸준히 사용 중', rating: 5, date: '2025년 3월',
      body: '요즘 들어 부쩍 축축 처지는 피부 볼살 눈가 주름까지 고민이 많았는데요. 에스테틱 가게에는 비용도 부담스럽고 홈케어에 집중하려고 케어클 고주파 뷰티 디바이스를 사용해 보았어요. 문지르는 게 아니라 콕콕 눌러주는 스탬프 방식 자극없이 피부 속까지 에너지를 깊게 전달해줘요. 꾸준히 사용하니까 피부가 예전보다 탄탄해진 게 느껴져요. 요즘 피부 탄력 떨어졌다고 고민하는 엄마한테도 하나 사드려야겠어요' }
  ];

  /* AI 맞춤 상담 — 개발 화면에서 실제 생성된 답변 예시(혼합형). 이름은 가린다. 실제는 결과마다 AI가 새로 쓴다. */
  var AI_SAMPLE = [
    '안녕하세요, 김○○ 고객님. 소중한 피부를 위해 상담을 찾아주셔서 진심으로 환영합니다. 보통 피부의 시간은 단 하나의 모습으로만 흘러가지 않고, 여러 가지 변화가 동시에 복합적으로 찾아오는 경우가 많습니다. 고객님의 피부 역시 부위마다 서로 다른 노화 신호가 함께 관찰되는 혼합형으로 나타났어요. 특히 피부 결 사이로 얇게 자리 잡기 시작하는 잔주름 신호와 전반적인 탄력 저하를 알리는 초기 노화 신호가 둘 다 가장 뚜렷하게 감지되고 있어, 어느 한 가지만 챙기기보다는 두 신호를 함께 다독여주는 체계적인 관리가 필요한 상태입니다.',
    '피부 컨디션을 조금 더 들여다보면 피로감으로 인한 푸석한 신호도 어느 정도 얼굴에 드리워져 있지만, 다행히 깊은 윤곽 처짐이나 표정 근육에 의한 굵은 라인은 아직 미미하게 나타나고 있어요. 지금 단계에서 가장 눈여겨보고 먼저 손길을 보내주어야 할 곳은 이마와 인중 주변, 그리고 얇고 연약한 눈가 부위입니다. 이마에서 시작해 입술 위쪽과 눈가로 이어지는 흐름을 따라 잔주름과 초기 탄력 고민이 자리 잡기 쉬우니, 이 세 부위를 중심으로 세심한 안티에이징 루틴을 시작해보시는 것이 좋습니다.',
    '이렇게 여러 신호가 복합적으로 나타날 때는 보습과 탄력을 동시에 채워주는 단계별 홈케어가 큰 힘이 되어줍니다. 피부 장벽을 편안하게 감싸주는 세라마이드와 속수분을 촘촘히 채우는 히알루론산으로 기초를 다져주신 후, 탄력 케어에 도움을 주는 펩타이드와 콜라겐 추출물이 담긴 화장품을 곁들여보세요. 여기에 화장품의 흡수를 돕고 미세한 결을 정돈해주는 뷰티기기 케어를 함께해 주시면, 이마와 눈가, 입가 주변의 복합적인 피부 고민을 한결 탄탄하고 매끄럽게 가꾸실 수 있습니다.',
    '일상 속의 작은 생활 습관도 안티에이징 케어에 든든한 밑거름이 됩니다. 외출 전에는 사계절 내내 자외선 차단제를 꼼꼼히 발라 피부를 보호해주시고, 하루 동안 지친 피부가 스스로 회복할 수 있도록 충분한 수면과 규칙적인 수분 섭취를 잊지 마세요. 지금처럼 피부가 보내는 신호에 귀 기울이며 차근차근 관리를 이어가신다면, 시간이 지나도 생기 넘치고 건강한 피부를 충분히 지켜나가실 수 있을 거예요.'
  ];

  /* 미리보기(설문 없이)용 예시 응답 — 결과 유형이 가장 높게 */
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

  function cover(R, stats) {
    return '<section class="cku-cover">' +
      '<p class="cku-result-eyebrow">진단 결과</p>' +
      '<h2 class="cku-result-title"><span class="cku-code">' + esc(R.en) + '</span>' + esc(R.name) + '</h2>' +
      '<p class="cku-result-tagline">' + esc(R.tagline) + '</p>' + (stats || '') +
    '</section>';
  }
  function intro(R) {
    return '<section class="cku-card"><p class="cku-result-desc">' + esc(R.desc) + '</p>' +
      '<ul class="cku-result-traits">' + R.traits.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '<p class="cku-result-concern">' + esc(R.concern) + '</p></section>';
  }
  function share() {
    var ch = [['kakao', '카카오톡', '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3.5C6.5 3.5 2 7 2 11.3c0 2.8 1.9 5.2 4.7 6.6-.2.8-.7 2.8-.8 3.2 0 0 0 .3.2.4.2.1.4 0 .4 0 .5-.1 3.3-2.2 3.8-2.5.6.1 1.1.1 1.7.1 5.5 0 10-3.5 10-7.8S17.5 3.5 12 3.5z"/></svg>'],
      ['facebook', '페이스북', '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21z"/></svg>'],
      ['x', 'X', '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.8 3h3.1l-6.8 7.8L22 21h-6.3l-4.9-6.4L5.2 21H2.1l7.3-8.3L1.8 3h6.4l4.4 5.9zm-1.1 16.2h1.7L7.4 4.7H5.5z"/></svg>']];
    return '<section class="cku-card"><div class="cku-share"><div class="cku-share-head"><p class="cku-share-line">친구도 내 유형과 같을까요?</p>' +
      '<p class="cku-share-sub">내 결과를 보내면 친구도 1분 만에 자기 유형을 확인할 수 있어요.</p></div><div class="cku-share-icons">' +
      ch.map(function (c) { return '<a class="cku-share-ico" href="#" data-share="' + c[0] + '"><span class="cku-share-ico-btn cku-share-' + c[0] + '" aria-hidden="true">' + c[2] + '</span><span>' + c[1] + '</span></a>'; }).join('') +
      '<button type="button" class="cku-share-ico" data-copy><span class="cku-share-ico-btn" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.7-1.7"/></svg></span><span>링크 복사</span></button>' +
      '</div></div></section>';
  }
  function actions(opts) {
    return '<div class="cku-result-actions">' +
      (opts.restart ? '<button type="button" class="cku-btn cku-btn-primary cku-retry" data-restart>다시 하기</button>' : '<a class="cku-btn cku-btn-primary cku-retry" href="survey.html">다시 하기</a>') +
    '</div>';
  }
  function wrap(inner) { return '<div class="checkup" data-rpt><div class="cku-result">' + inner + '</div></div>'; }

  /* 로그인 전 — 유형 이름·소개까지만 공개 (개발 화면과 같은 범위) */
  function lockedHtml(R, opts) {
    return wrap(cover(R) + intro(R) +
      '<div class="cku-result-locked"><p class="cku-result-locked-desc">고객님만을 위한 상세 진단 이유, 집중 케어 부위, 맞춤 홈케어 루틴을 확인해보세요.</p>' +
      '<a class="cku-btn cku-btn-primary" href="' + esc(opts.loginHref || '#') + '">로그인하고 전체 결과 보기</a></div>' +
      share() + actions(opts));
  }

  /* opts: { counts, roles:{key:'대표'|'보조'}, mixWith, parts, restart, locked, loginHref } */
  function html(key, opts) {
    opts = opts || {};
    var k = REPORT[key] ? key : 'early';
    var R = REPORT[k];
    if (opts.locked) return lockedHtml(R, opts);
    var D = dataFor(k, opts.mixWith) || {};
    var counts = opts.counts || sample(k);
    var roles = opts.roles || {};

    var areas = D.areas || [];
    var shotModes = [];
    (D.shots || []).forEach(function (s) { if (shotModes.indexOf(s.mode) < 0) shotModes.push(s.mode); });
    var freq = ((D.frequency || '').match(/주\s*\d+\s*~\s*\d+\s*회/) || [''])[0];
    var stats = '<div class="cku-stats">' +
      (areas.length ? '<div class="cku-stat"><span class="cku-stat-label">집중 관리 부위</span><span class="cku-stat-value">' + areas.length + '곳</span><span class="cku-stat-note">' + esc(areas.map(function (a) { return a.name; }).join(' · ')) + '</span></div>' : '') +
      (D.shotTotal ? '<div class="cku-stat"><span class="cku-stat-label">권장 SHOT</span><span class="cku-stat-value">' + D.shotTotal + '샷</span><span class="cku-stat-note">' + esc(shotModes.join(' · ')) + '</span></div>' : '') +
      (freq ? '<div class="cku-stat"><span class="cku-stat-label">권장 빈도</span><span class="cku-stat-value">' + esc(freq) + '</span></div>' : '') +
    '</div>';

    /* 설문 답변에서 읽힌 노화 신호 — 숫자 없이 상대 길이 (개발 화면 TypeDistribution) */
    var norm = AXES.map(function (a) { return (counts[a[0]] || 0) / a[2]; });
    var top = Math.max.apply(null, norm) || 1;
    var order = AXES.map(function (a, i) { return i; }).sort(function (a, b) { return norm[b] - norm[a]; });
    var dist = '<div class="cku-dist"><p class="cku-dist-title">설문 답변에서 읽힌 노화 신호</p><ul class="cku-dist-list">' +
      order.map(function (i) {
        var a = AXES[i], role = roles[a[0]];
        return '<li' + (role ? ' class="is-on"' : '') + '><span class="cku-dist-name">' + esc(a[1]) + (role ? '<em class="cku-dist-role">' + role + '</em>' : '') + '</span>' +
          '<span class="cku-dist-track" aria-hidden="true"><i data-w="' + Math.round(norm[i] / top * 100) + '"></i></span></li>';
      }).join('') +
      '</ul><p class="cku-dist-note">점수가 아니라 답변에서 읽힌 신호의 상대적인 세기입니다. 막대가 길수록 그 유형의 신호가 자주 나타났다는 뜻이에요.</p></div>';

    var maxShot = Math.max.apply(null, (D.shots || []).map(function (s) { return s.count; }).concat([1]));
    var ingr = D.ingredients || [];

    return wrap(
      cover(R, stats) + intro(R) +

      /* 왜 이 유형 */
      '<section class="cku-card">' + title('reason', '왜 ' + esc(R.name) + '으로 진단된 걸까요?') +
        (D.reason && D.reason.length ? '<p class="cku-result-desc">' + esc(D.reason.join(' ')) + '</p>' : '') +
        (D.evidence && D.evidence.length ? '<div class="cku-evidence"><p class="cku-evidence-title">고객님의 설문에서도 이런 답변이 많았습니다</p><ul class="cku-check-list">' +
          D.evidence.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' : '') +
        dist +
        (D.reasonNote ? '<p class="cku-result-desc">' + esc(D.reasonNote) + '</p>' : '') +
      '</section>' +

      /* 집중 케어 부위 */
      (areas.length ? '<section class="cku-card">' + title('area', '집중 케어가 필요한 부위') +
        '<div class="cku-area-layout"><div class="cku-area-list"><ol class="cku-top3">' + areas.map(function (a, i) {
          return '<li class="cku-rank' + (i === 0 ? ' primary' : '') + '"><span class="cku-rank-no">' + (i + 1) + '</span><span class="cku-rank-body"><span class="cku-rank-name">' + esc(a.name) +
            (a.pattern ? '<span class="cku-rank-pattern">' + esc(a.pattern) + '</span>' : '') + '</span></span><code class="cku-rank-code">' + esc(a.code) + '</code></li>';
        }).join('') + '</ol><p class="cku-rank-legend"><b>U · M · L은?</b> 얼굴을 위(U) · 중앙(M) · 아래(L) 구역으로 나눈 케어클 에이징맵 좌표입니다.</p></div></div>' +
        (D.areaText && D.areaText.length ? '<p class="cku-result-desc cku-divided">' + esc(D.areaText.join(' ')) + '</p>' : '') +
      '</section>' : '') +

      /* 홈케어 루틴 */
      (D.homecare && D.homecare.length ? '<section class="cku-card">' + title('homecare', '홈케어 루틴') + '<ol class="cku-steps">' +
        D.homecare.map(function (t, i) { return '<li><span class="cku-step-no">' + (i + 1) + '</span><span class="cku-step-body">' + esc(t) + '</span></li>'; }).join('') + '</ol></section>' : '') +

      /* 추천 성분 · 생활습관 */
      '<div class="cku-card-row">' +
        '<section class="cku-card" data-ingredients>' + title('ingredient', '추천 성분', '<span class="cku-help" title="성분을 누르면 어떤 성분인지 설명이 열려요" aria-hidden="true">?</span>') +
          '<p class="cku-chip-hint">성분을 누르면 어떤 성분인지 볼 수 있어요.</p><div class="cku-chip-row">' +
          ingr.map(function (n) {
            return INGREDIENT_INFO[n]
              ? '<button type="button" class="cku-chip cku-chip-btn" data-ing="' + esc(n) + '" aria-expanded="false">' + esc(n) + '<svg class="cku-chip-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>'
              : '<span class="cku-chip">' + esc(n) + '</span>';
          }).join('') + '</div><div class="cku-chip-detail" data-ing-detail hidden></div></section>' +
        (D.lifestyle && D.lifestyle.length ? '<section class="cku-card">' + title('lifestyle', '생활습관 포인트') + '<div class="cku-chip-row">' +
          D.lifestyle.map(function (t) { return '<span class="cku-chip">' + esc(t) + '</span>'; }).join('') + '</div></section>' : '') +
      '</div>' +

      /* 디바이스 */
      '<section class="cku-card">' + title('device', '뷰티 디바이스 종류와 특징') + '<div class="cku-table-wrap"><table class="cku-device-table"><tbody>' +
        DEVICE_TABLE.map(function (d) { return '<tr><th>' + esc(d[0]) + '</th><td>' + esc(d[1]) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        (D.deviceRec ? '<p class="cku-callout">' + esc(D.deviceRec) + '</p>' : '') + '</section>' +

      (D.rf && D.rf.length ? card('rf', '고주파(RF) 기술과 케어클', paras(D.rf)) : '') +

      /* 맞춤 사용법 */
      '<section class="cku-card">' + title('usage', '맞춤 사용법') +
        (D.usage && D.usage.length ? '<p class="cku-result-desc">' + esc(D.usage.join(' ')) + '</p>' : '') +
        (D.order && D.order.length ? '<p class="cku-sub-title">관리 순서</p><ol class="cku-care-order">' + D.order.map(function (t, i) {
          return '<li><span class="cku-care-no">' + (i + 1) + '</span><span class="cku-care-label">' + esc(t) + '</span></li>'; }).join('') + '</ol>' : '') +
        (D.frequency ? '<p class="cku-callout"><b>권장 빈도 · </b>' + esc(D.frequency) + '</p>' : '') +
      '</section>' +

      /* SHOT 모드 가이드 */
      (D.shots && D.shots.length ? '<section class="cku-card">' + title('shot', 'SHOT 모드 가이드') + '<div class="cku-shot-list">' +
        D.shots.map(function (s) {
          return '<div class="cku-shot-item"><div class="cku-shot-head"><span class="cku-shot-area">' + esc(s.name) + '<code class="cku-rank-code">' + esc(s.code) + '</code></span><span class="cku-shot-count">' + s.count + '샷</span></div>' +
            '<p class="cku-shot-dir">' + esc(s.mode) + ' · ' + esc(s.dir) + '</p><div class="cku-shot-bar"><span style="width:' + Math.round(s.count / maxShot * 100) + '%"></span></div></div>';
        }).join('') + '</div>' +
        (D.shotTotal ? '<div class="cku-shot-total"><span class="cku-shot-total-value">총 ' + D.shotTotal + '샷</span><span class="cku-shot-total-note">SHOT 모드는 7분 후 자동 종료되니, 남은 부위가 있으면 다시 켜서 이어 진행하세요.</span></div>' : '') +
      '</section>' : '') +

      /* SHOT 이후 마무리 단계 */
      (D.modes && D.modes.length ? '<section class="cku-card">' + title('usage', 'SHOT 이후 마무리 단계') + '<div class="cku-mode-steps">' +
        D.modes.map(function (m) {
          var badge = m.required === true ? '필수' : m.required === false ? '선택' : '';
          return '<div class="cku-mode-step' + (m.required ? ' required' : '') + '"><p class="cku-mode-head">' + esc(m.name.replace(/\s*모드$/, '')) +
            (badge ? '<span class="cku-mode-badge">' + badge + '</span>' : '') + (m.duration ? '<span class="cku-mode-duration">권장 ' + esc(m.duration) + '</span>' : '') + '</p>' +
            (m.desc ? '<p class="cku-mode-desc">' + esc(m.desc) + '</p>' : '') + '</div>';
        }).join('') + '</div></section>' : '') +

      /* SHOT 모드 FAQ */
      '<section class="cku-card">' + title('faq', 'SHOT 모드, 이렇게 사용하세요') + '<div class="cku-faq-list">' +
        SHOT_FAQ.map(function (f) {
          return '<div class="cku-faq-item"><p class="cku-faq-q">' + esc(f[0]) + '</p>' +
            (f[0].indexOf('강도') > -1 ? '<div class="cku-levels" aria-hidden="true">' + [1, 2, 3, 4, 5].map(function (n) { return '<span class="cku-level cku-level-' + n + '">' + n + '</span>'; }).join('') + '</div>' : '') +
            '<p class="cku-faq-a">' + esc(f[1]) + '</p></div>';
        }).join('') + '</div></section>' +

      (D.busy && D.busy.length ? card('busy', '바빠서 모든 단계가 부담되는 날에는', '<p class="cku-result-desc">' + esc(D.busy.join(' ')) + '</p>') : '') +

      /* AI 맞춤 상담 */
      '<section class="cku-card cku-card-dark">' + title('ai', 'AI 맞춤 상담') +
        (k === 'mixed'
          ? '<div class="cku-ai-answer">' + AI_SAMPLE.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div>'
          : '<div class="cku-ai-answer"><p>결과를 바탕으로 AI가 고객님께 쓴 맞춤 상담 글이 이 자리에 들어갑니다. (답변은 결과마다 한 번 만들어 저장돼요.)</p></div>') +
      '</section>' +

      /* 혜택 */
      '<section class="cku-card">' + title('coupon', 'AI 분석 결과 고객 전용 혜택') + '<div class="cku-coupon-grid">' +
        '<div class="cku-coupon"><div class="cku-coupon-desc"><p><b>아직 케어클이 없으시다면</b></p><p>지금 TECH FIT을 시작하기 좋은 때</p><p>정가 820,000원 → 30% 할인 568,000원</p><p>＋ 자사몰 첫 구매 쿠폰 5만원 할인 → 쿠폰 적용 시 최종 518,000원</p></div>' +
          '<a class="cku-btn cku-btn-primary" href="products.html">쿠폰 받고 TECH FIT 시작하기</a></div>' +
        '<div class="cku-coupon"><div class="cku-coupon-desc"><p><b>이미 케어클을 쓰고 계신다면</b></p><p>소모품을 더 알뜰하게</p><p>그리드 마스크팩 · 콜라겐 젤 등 소모품을 자사몰에서 재구매할 때 쓰는 쿠폰</p><p>＋ 자사몰 소모품 할인 쿠폰 20% 할인</p></div>' +
          '<a class="cku-btn cku-btn-primary" href="cosmetics.html">소모품 쿠폰 받기</a></div>' +
      '</div></section>' +

      '<p class="cku-result-note">' + DISCLAIMER + '</p>' +

      /* 실제 후기 */
      '<section class="cku-card">' + title('review', '비슷한 고민을 가진 고객의 실제 후기') + '<div class="cku-reviews">' +
        '<p class="cku-reviews-lead">케어클을 쓰신 분들이 남긴 실제 구매 후기 중에서, 고객님 결과와 맞닿은 이야기를 담은 글을 골랐습니다.</p><ul class="cku-review-list">' +
        REVIEWS.map(function (r) {
          return '<li class="cku-review"><div class="cku-review-head"><span class="cku-review-tagline">' + esc(r.tag) + '</span><span class="cku-review-rating" aria-label="평점 ' + r.rating + '점"><span aria-hidden="true">★</span> ' + r.rating + '</span></div>' +
            '<p class="cku-review-body cku-review-body-clamp">' + esc(r.body) + '</p><button type="button" class="cku-review-more" hidden>더보기</button>' +
            '<p class="cku-review-date">' + esc(r.date) + '</p></li>';
        }).join('') +
        '</ul><p class="cku-reviews-note">쇼핑몰에 등록된 구매 후기를 그대로 옮긴 것이며, 내용을 고치지 않았습니다. 후기는 개인의 사용 경험으로 효과를 보장하지 않습니다.</p></div></section>' +

      share() + actions(opts)
    );
  }

  /* 그린 다음: 막대 채우기, 긴 후기에만 '더보기' */
  function fillBars(root) {
    root = root || document;
    setTimeout(function () {
      Array.prototype.forEach.call(root.querySelectorAll('.cku-dist-track i'), function (b) { b.style.width = b.dataset.w + '%'; });
      Array.prototype.forEach.call(root.querySelectorAll('.cku-review-body-clamp'), function (p) {
        // line-clamp 상태에선 scrollHeight가 잘린 높이로 나오는 브라우저가 있어, 잠깐 풀어서 잰다
        var more = p.nextElementSibling, h = p.clientHeight;
        p.classList.remove('cku-review-body-clamp');
        var full = p.clientHeight;
        p.classList.add('cku-review-body-clamp');
        if (more && full > h + 1) more.hidden = false;
      });
    }, 120);
  }

  /* 성분 칩 펼치기 · 후기 더보기 · 링크 복사 (한 번에 하나만 펼친다) */
  document.addEventListener('click', function (e) {
    var chip = e.target.closest('[data-ing]');
    if (chip) {
      var box = chip.closest('[data-ingredients]'), detail = box.querySelector('[data-ing-detail]');
      var open = chip.getAttribute('aria-expanded') !== 'true';
      Array.prototype.forEach.call(box.querySelectorAll('[data-ing]'), function (c) { c.setAttribute('aria-expanded', 'false'); c.classList.remove('is-open'); });
      if (open) {
        chip.setAttribute('aria-expanded', 'true'); chip.classList.add('is-open');
        var n = chip.dataset.ing;
        detail.innerHTML = '<p class="cku-chip-detail-name">' + esc(n) + '</p><p class="cku-chip-detail-desc">' + esc(INGREDIENT_INFO[n]) + '</p>';
      }
      detail.hidden = !open;
      return;
    }
    var more = e.target.closest('.cku-review-more');
    if (more) {
      var body = more.previousElementSibling, opened = body.classList.toggle('cku-review-body-clamp');
      more.textContent = opened ? '더보기' : '접기';
      return;
    }
    if (e.target.closest('[data-share]')) { e.preventDefault(); return; }
    var copy = e.target.closest('[data-copy]');
    if (copy && navigator.clipboard) {
      navigator.clipboard.writeText(location.origin + location.pathname).then(function () {
        var s = copy.querySelector('span:last-child'); s.textContent = '복사됐어요'; setTimeout(function () { s.textContent = '링크 복사'; }, 1600);
      });
    }
  });

  window.ckuReport = { data: REPORT, html: html, fillBars: fillBars, sample: sample };
})();
