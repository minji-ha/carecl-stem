# -*- coding: utf-8 -*-
"""careCL (STEM 레퍼런스 디자인) — 페이지 생성기

    python build.py

공통 헤더·푸터·로딩 물방울을 한곳에서 관리하고 페이지를 찍어낸다.
생성된 HTML을 직접 고치면 다음 빌드 때 덮어써진다.
"""
import io
import os
import re
import time

ROOT = os.path.dirname(os.path.abspath(__file__))
VER = time.strftime("%y%m%d%H%M%S")


def read(p):
    return io.open(os.path.join(ROOT, p), encoding="utf-8").read()


# ── 로고 (벡터, currentColor) ─────────────────────────────
LOGO = re.sub(r"<title>.*?</title>\s*", "", read("assets/img/carecl-logo.svg"), flags=re.S).strip()

# ── 메뉴 (1뎁스 · 링크 · 한글) ───────────────────────────
NAV_LEFT = [("Company", "about.html", "회사 소개"),
            ("Aging Lab", "aging-types.html", "6가지 노화 타입 · 22개 관리 부위"),
            ("Technology", "carecl-technology.html", "케어클 기술")]
NAV_RIGHT = [("Products", "products.html", "디바이스 · 코스메틱"),
             ("Contact", "contact.html", "문의")]


def head(title, desc, sub=False, css=(), body_cls=""):
    subcss = f'<link rel="stylesheet" href="css/sub.css?v={VER}">\n' if sub else ""
    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="icon" href="assets/img/carecl-logo.svg" type="image/svg+xml">
<link rel="preload" href="fonts/metropolis-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/urbanist-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<link rel="stylesheet" href="css/stem.css?v={VER}">
{subcss}{"".join(f'<link rel="stylesheet" href="{c}?v={VER}">' + chr(10) for c in css)}<script type="importmap">{{"imports":{{"three":"./libs/three/three.module.min.js"}}}}</script>
</head>
<body{(' class="' + body_cls + '"') if body_cls else ""}>
"""


def loader():
    return f"""<div class="loader" data-loader aria-hidden="true">
  <div class="led9 loader__head" data-led9="red" data-led9-mode="progress"><canvas></canvas></div>
  <span class="loader__logo">{LOGO}</span>
  <span class="loader__count" data-loader-count>00</span>
</div>
"""


def header(active=""):
    def links(items):
        return "".join(
            f'<a href="{h}"{" aria-current=\"page\"" if h == active else ""}>{t}</a>' for t, h, _ in items)
    mnav = "".join(f'<a href="{h}">{t}<small>{kr}</small></a>' for t, h, kr in NAV_LEFT + NAV_RIGHT)
    return f"""<header class="header">
  <nav class="header__nav" aria-label="주 메뉴 왼쪽">{links(NAV_LEFT)}</nav>
  <a class="header__logo" href="index.html" aria-label="careCL 홈">{LOGO}</a>
  <nav class="header__nav header__nav--right" aria-label="주 메뉴 오른쪽">{links(NAV_RIGHT)}</nav>
  <button class="header__menu" type="button" data-menu aria-label="메뉴 열기" aria-expanded="false"><span></span><span></span></button>
</header>
<nav class="mnav" aria-label="모바일 메뉴">{mnav}<a href="survey.html">AI Skin Test<small>2분 노화 타입 진단</small></a></nav>
"""


FOOTER = f"""<footer class="foot">
  <div class="wrap">
    <div class="foot__top">
      <div class="foot__brand">
        <span class="foot__tag">Home Aging Care</span>
        <a class="foot__logo" href="index.html" aria-label="careCL 홈">{LOGO}</a>
      </div>
      <div class="foot__side">
        <h2>AI Skin Test</h2>
        <p>2분 설문으로 나의 노화 타입과<br>먼저 관리할 부위를 확인하세요.</p>
        <a class="btn-line" href="survey.html">진단 시작하기</a>
      </div>
    </div>
    <nav class="foot__nav" aria-label="푸터 메뉴">
      {"".join(f'<a href="{h}">{t}</a>' for t, h, _ in NAV_LEFT + NAV_RIGHT)}
    </nav>
  </div>
  <div class="foot__bar">
    <span>CARECL CO.,Ltd. · CEO Hyungkyu Choi · 사업자등록번호 591-88-03097 · 통신판매업 제2025-고양일산동-0585호</span>
    <span>TEL +82 31-943-1028 · support@carecl.co.kr</span>
    <span>© 2026 CARECL. All rights reserved.</span>
  </div>
</footer>
"""


def tail(three=True, js=()):
    mod = f'<script type="module" src="js/device3d.js?v={VER}"></script>\n' if three else ""
    return f"""<script src="js/led.js?v={VER}"></script>
<script src="js/stem.js?v={VER}"></script>
{"".join(f'<script src="{j}?v={VER}"></script>' + chr(10) for j in js)}{mod}</body>
</html>
"""


# 배경에 깔리는 옅은 물결 면
WAVE = """<svg viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true"><path fill="currentColor" d="M0 210C210 120 380 60 640 92c260 32 330 170 560 182 170 9 300-60 400-120v520c-190 90-360 140-620 110-250-29-330-150-560-150C230 834 90 880 0 900Z"/></svg>"""


# ═══════════════════════════════════════════════════════════
#  메인
# ═══════════════════════════════════════════════════════════
# ── 메인 원고 (기존 사이트 메인 순서·문구 그대로) ─────────────
SOLUTIONS = [
    ("Device", "Device Solution", "정해진 자리에 머무르는 스탬핑 디바이스",
     "문지르지 않고 관리할 부위에 머물러 에너지를 전달합니다.", "c-techfit-case.jpg", "products.html"),
    ("Cosmetics", "Beauty Solution", "디바이스와 함께 쓰는 전용 코스메틱",
     "그리드 마스크와 전용 제형으로 관리 위치를 정확히 안내합니다.", "c-gel-drop.jpg", "cosmetics.html"),
    ("Aging Map 22", "Care Solution", "얼굴과 목 · 바디를 22개 부위로",
     "나의 노화 방식을 이해하고 먼저 관리할 곳부터 순서대로 제안합니다.", "n-mask-glass-wide.jpg", "aging-map.html"),
]

CORE = [  # (번호 EN, 제목, 질문, 링크 문구, 링크, 위치 left%, top%)
    ("01 Read", "6가지 노화 타입", "나는 어떤 방식으로 나이 들고 있는가", "타입 보기", "aging-types.html", 13, 16),
    ("02 Map", "22개 관리 부위", "어디를 먼저 관리해야 하는가", "부위 보기", "aging-map.html", 87, 16),
    ("03 Tech", "5초 스탬핑", "어떻게 전달할 것인가", "기술 보기", "carecl-technology.html", 9, 62),
    ("04 Product", "디바이스 · 코스메틱", "무엇으로 관리할 것인가", "제품 보기", "products.html", 91, 62),
    ("05 AI Agent", "AI 피부 진단", "2분 진단으로 나의 타입과 우선 부위 확인", "진단 시작", "survey.html", 50, 100),
]

PRODUCTS = [  # (분류, 이름, 설명, 이미지, 링크)
    ("Device", "TechFit", "5초 스탬핑 고주파 디바이스", "p-techfit.jpg", "products.html"),
    ("Device", "CLB", "고주파 마사지기", "p-clb.jpg", "products.html"),
    ("Cosmetic", "Collagen Booster Gel", "콜라겐 부스터 젤", "p-gel.jpg", "cosmetics.html"),
    ("Cosmetic", "Grid Mask", "그리드 마스크", "p-mask.jpg", "cosmetics.html"),
    ("Cosmetic", "Toning Serum", "라이트 토닝 세럼", "p-serum.jpg", "cosmetics.html"),
    ("Accessory", "Firenze Bag", "케어클 피렌체 백 · 디바이스 전용 가죽 케이스", "p-case.jpg", "products.html"),
]

STEPS = [  # (EN, 한글, 설명, 모바일용 사진)
    ("Cleanse", "잔여물 정리", "잔여물을 정리해 다음 단계가 제대로 전달되도록 준비합니다.", "p-gel.jpg"),
    ("Read", "오늘의 부위", "오늘 먼저 관리할 부위를 Aging Map 22 기준으로 확인합니다.", "s-mask-glass.jpg"),
    ("Activate", "집중 전달", "한 부위에 머무르며 수직으로 전달합니다.", "p-techfit.jpg"),
    ("Recovery", "진정과 보습", "전용 코스메틱으로 전달 직후의 피부를 안정시킵니다.", "p-serum.jpg"),
    ("Maintain", "반복과 기록", "주 2~3회 같은 자리를 반복해 변화를 기록합니다.", "n-lineup-sq.jpg"),
]

CONTACTS = [
    ("Global Business", "해외 사업", "수출 · 해외 유통 문의<br>support@carecl.co.kr", "contact.html"),
    ("Partnership", "유통 · 제휴", "총판 및 제휴 제안<br>support@carecl.co.kr", "partnership.html"),
    ("Media / PR", "미디어", "취재 · 광고 · 협찬<br>support@carecl.co.kr", "press.html"),
    ("General", "일반 문의", "제품 사용 · A/S<br>TEL +82 31-943-1028", "inquiry.html"),
]


def page_index():
    sol = "\n".join(f"""      <a class="sol rv" href="{href}">
        <span class="sol__tag">{tag}</span>
        <div class="sol__txt">
          <b class="sol__en">{en}</b>
          <strong class="sol__kr">{kr}</strong>
          <p>{desc}</p>
        </div>
        <div class="sol__img"><img src="assets/img/{img}" alt="" loading="lazy"></div>
      </a>""" for tag, en, kr, desc, img, href in SOLUTIONS)

    core = "\n".join(f"""      <div class="anno anno--core rv" data-anno style="left:{x}%;top:{y}%">
        <em class="anno__no">{no}</em>
        <h3 class="anno__title">{t}</h3>
        <p class="anno__desc">{q}</p>
        <a class="anno__link" href="{h}">{lk}</a>
      </div>""" for no, t, q, lk, h, x, y in CORE)

    cov = "\n".join(
        f'        <li class="cov__item" data-cov-item data-tag="{tag}" data-name="{name}" data-desc="{desc}" data-href="{href}">'
        f'<a href="{href}" tabindex="-1"><img src="assets/img/{img}" alt="{name}" loading="lazy"></a></li>'
        for tag, name, desc, img, href in PRODUCTS)
    t0, n0, d0, _, h0 = PRODUCTS[0]

    step_items = "\n".join(f"""      <li class="step{" is-on" if i == 0 else ""}" data-step>
        <div class="step__img"><img src="assets/img/{img}" alt="" loading="lazy"></div>
        <span class="step__num" aria-hidden="true">{i + 1:02d}</span>
        <div>
          <h3 class="step__title">{en}</h3>
          <span class="step__kr">{kr}</span>
          <p class="step__desc">{desc}</p>
        </div>
      </li>""" for i, (en, kr, desc, img) in enumerate(STEPS))

    contacts = "\n".join(f"""      <a class="ccard rv" data-d="{i}" href="{h}">
        <em>{en}</em><b>{kr}</b><p>{desc}</p>
      </a>""" for i, (en, kr, desc, h) in enumerate(CONTACTS))

    marquee = "".join("<span>CARECL</span>" for _ in range(8))

    body = f"""<main>

  <!-- 01 상단 배너 -->
  <section class="hero" aria-label="메인 영상">
    <img class="hero__poster" src="assets/img/main-film-poster.jpg?v={VER}" alt="">
    <video class="hero__video" src="assets/video/main-film.mp4?v={VER}" poster="assets/img/main-film-poster.jpg?v={VER}"
           autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>
    <div class="hero__copy">
      <p class="hero__eyebrow">Anti-Aging Skincare</p>
      <h1 class="hero__title">Every face ages differently.<br>Every face deserves its own care.</h1>
      <p class="hero__kr">노화는 저마다 다릅니다. 그래서 관리도 달라야 합니다.</p>
    </div>
  </section>

  <!-- 02 배너 설명 : careCL Solution -->
  <section class="sols" data-led="red" aria-labelledby="sols-title">
    <div class="wrap">
      <div class="sec-head">
        <h2 class="label rv">careCL Solution</h2>
        <p class="sec-title rv" id="sols-title" data-d="1">케어클이 제안하는<br>세 가지 홈 에이징 케어</p>
      </div>
      <div class="sols__list">
{sol}
      </div>
    </div>
  </section>

  <!-- 03 철학 -->
  <section class="phil" data-led="purple" aria-labelledby="phil-title">
    <div class="phil__dots" data-dotfield></div>
    <div class="wrap phil__inner">
      <h2 class="label label--center rv">Our Philosophy</h2>
      <p class="phil__title rv" id="phil-title" data-d="1">같은 나이라도<br>노화가 시작되는 자리는 저마다 다릅니다</p>
      <p class="phil__lead rv" data-d="2">유전, 뼈의 구조, 얼굴 근육의 발달, 피하 지방의 양에 따라 처짐이 먼저 오기도 하고 주름이 먼저 생기기도 합니다.
      케어클은 그 차이를 먼저 읽는 것에서 안티에이징을 시작합니다. 모두에게 같은 제품을 권하지 않습니다.</p>
      <p class="phil__en rv" data-d="3">Read precisely, care exactly.</p>
    </div>
  </section>

  <!-- 04 핵심 (가운데 9구 LED 헤드 + 주변 다섯 항목) -->
  <section class="core" data-led="green" aria-labelledby="core-title">
    <div class="wrap">
      <div class="sec-head sec-head--center">
        <h2 class="label label--center rv">How careCL Works</h2>
        <p class="sec-title rv" id="core-title" data-d="1">케어클의 다섯 가지 기준</p>
      </div>
    </div>
    <div class="core__stage" data-phil>
      <svg class="phil__lines" aria-hidden="true"></svg>
      <div class="core__center">
        <div class="led9 core__head" data-led9 data-anno-target><canvas></canvas></div>
        <span class="core__logo">{LOGO}</span>
      </div>
{core}
    </div>
    <div class="core__cta"><a class="btn-line" href="survey.html">나의 Aging Type 알아보기 →</a></div>
  </section>

  <!-- 05 환기용 이미지 -->
  <section class="sys" data-led="yellow" aria-labelledby="sys-title">
    <div class="wrap sys__copy">
      <p class="sys__title rv" id="sys-title">클리닉의 기술을,<br>집 안의 리추얼로</p>
    </div>
    <div class="sys__img"><img src="assets/img/c-ritual-wide.jpg" alt="TechFit 풀세트 — 가죽 케이스 속 디바이스와 콜라겐 젤, 파우치" loading="lazy" width="2400" height="1349" data-zoom></div>
  </section>

  <!-- 06 콜렉션 (3D 커버플로) -->
  <section class="coll" data-led="yellow" data-cov aria-labelledby="coll-title">
    <div class="wrap">
      <div class="sec-head">
        <h2 class="label rv">Collection</h2>
        <p class="sec-title rv" id="coll-title" data-d="1">진단 결과에 맞춰<br>조합하는 제품</p>
      </div>
    </div>
    <div class="cov" data-cov-stage>
      <ul class="cov__list">
{cov}
      </ul>
    </div>
    <div class="wrap">
      <div class="cov__foot">
        <button type="button" class="cov__nav" data-cov-prev aria-label="이전 제품">←</button>
        <div class="cov__cap" aria-live="polite">
          <em data-cov-tag>{t0}</em><b data-cov-name>{n0}</b><span data-cov-desc>{d0}</span>
          <a class="cov__more" href="{h0}" data-cov-link>자세히 보기</a>
        </div>
        <button type="button" class="cov__nav" data-cov-next aria-label="다음 제품">→</button>
      </div>
      <div class="cov__dots" data-cov-dots></div>
    </div>
  </section>

  <!-- 07 5 STEP -->
  <section class="steps" data-led="purple" aria-labelledby="steps-title">
    <div class="wrap">
      <div class="sec-head">
        <h2 class="label rv">Daily Routine</h2>
        <p class="sec-title rv" id="steps-title" data-d="1">다섯 단계로 이어지는<br>홈 에이징 케어</p>
        <p class="sec-lead rv" data-d="2">하루 10분. 같은 자리를 반복하는 동안 피부는 기록을 남깁니다.</p>
      </div>
      <div class="steps__body">
        <div class="steps__sticky">
          <div class="stage3d">
            <span class="stage3d__glow" aria-hidden="true"></span>
            <span class="stage3d__floor" aria-hidden="true"></span>
            <div class="device3d" data-device3d aria-hidden="true"></div>
          </div>
        </div>
        <ol class="steps__list" data-steps>
{step_items}
        </ol>
      </div>
    </div>
  </section>

  <!-- 08 샵 링크 (스크롤하면 높이가 화면 가득) -->
  <section class="shop" data-shop data-led="red">
    <div class="shop__bg"><img src="assets/img/c-beam.jpg" alt="" loading="lazy"></div>
    <div class="wrap shop__inner">
      <div>
        <h2 class="shop__title">제품 구매는 공식몰에서</h2>
        <p class="shop__desc">진단 결과에 맞는 구성으로 담아 보세요.</p>
      </div>
      <a class="btn-line btn-line--light" href="products.html">Shop 바로가기 →</a>
    </div>
  </section>

  <!-- CARECL 롤링 -->
  <div class="marq" aria-hidden="true"><div class="marq__track">{marquee}{marquee}</div></div>

  <!-- 09 문의 -->
  <section class="contact" data-led="green" aria-labelledby="contact-title">
    <div class="wrap">
      <div class="sec-head">
        <h2 class="label rv">Contact</h2>
        <p class="sec-title rv" id="contact-title" data-d="1">케어클과 함께하실 분들께</p>
      </div>
      <div class="contact__grid">
{contacts}
      </div>
    </div>
  </section>

</main>
"""
    return (head("careCL 케어클 — 정밀하게 읽고, 부위별로 되돌리다",
                 "얼굴을 22개 부위로 나누어 읽고, 먼저 관리해야 할 곳부터 제안하는 홈 에이징 케어")
            + loader() + header() + body + FOOTER + tail())


PAGES = {"index.html": page_index}

# ═══════════════════════════════════════════════════════════
#  서브 페이지 (14개) — 본문은 content/<파일>.html (기존 사이트 원고)
# ═══════════════════════════════════════════════════════════
# (1뎁스 EN, LED 색, [(2뎁스 EN, 파일, 한글)])
MENU = [
    ("Company", "purple", [("About careCL", "about.html", "회사 소개"),
                           ("Our Story", "greeting.html", "브랜드 스토리"),
                           ("R&D / Patent", "rnd.html", "연구개발 · 특허"),
                           ("Awards & Certification", "certification.html", "수상 · 인증")]),
    ("Aging Lab", "green", [("6 Aging Types", "aging-types.html", "6가지 노화 타입"),
                            ("Aging Map 22", "aging-map.html", "22개 관리 부위")]),
    ("Technology", "red", [("Beauty Device Technology", "technology.html", "홈뷰티 디바이스 기술"),
                           ("careCL Technology", "carecl-technology.html", "케어클 기술")]),
    ("Products", "yellow", [("Beauty Device", "products.html", "뷰티 디바이스"),
                            ("Cosmetics", "cosmetics.html", "코스메틱")]),
    ("Contact", "green", [("Global Business", "contact.html", "해외 사업 문의"),
                          ("Distributor / Partnership", "partnership.html", "유통 · 제휴 문의"),
                          ("Media / PR", "press.html", "미디어 문의"),
                          ("General Inquiry", "inquiry.html", "일반 문의")]),
]
GROUP_HREF = {"Company": "about.html", "Aging Lab": "aging-types.html", "Technology": "carecl-technology.html",
              "Products": "products.html", "Contact": "contact.html"}

# 기존 사진 → 새 사진 (사람 모델이 나온 사진은 제품·정물 컷으로)
IMG_MAP = {
    "cc-model-c.jpg": "c-beam.jpg",
    "p-leaning.jpg": "c-techfit-case.jpg",
    "p-skin.jpg": "c-gel-silk.jpg",
    "p-eye.jpg": "n-techfit-side.jpg",
    "cc-stamping-c.jpg": "n-techfit-stand.jpg",
    "p-mask-close.jpg": "s-mask-glass.jpg",
    "p-devices.jpg": "c-overhead.jpg",
    "p-cheek.jpg": "c-techfit-case.jpg",
    "p-mask-face.jpg": "n-mask-packs.jpg",
    "p-mask-hands.jpg": "n-mask-glass-wide.jpg",
    "product-techfit.jpg": "p-techfit.jpg",
    "product-clb.png": "p-clb.jpg",
    "product-gel.png": "p-gel.jpg",
    "product-mask.jpg": "p-mask.jpg",
    "product-serum.jpg": "p-serum.jpg",
}


def sub_page(group, led, items, idx):
    title_en, slug, title_kr = items[idx]
    body = read("content/" + slug)

    def img(m):
        src = m.group(1)
        name = src.split("/")[-1].split("?")[0]
        if "/doc/" in src:
            return 'src="assets/img/doc/' + name + '"'
        return 'src="assets/img/' + IMG_MAP.get(name, name) + '"'
    body = re.sub(r'src="(assets/img/[^"]+)"', img, body)
    # 섹션마다 LED 색 지정
    body = re.sub(r'<section class="(sec|figbreak)', lambda m: '<section data-led="' + led + '" class="' + m.group(1), body)
    # 회사 소개의 파티클 캔버스 → 9구 LED 헤드
    body = re.sub(r'<div class="about__visual ceo__visual" id="brandParticles">.*?</div></div>',
                  '<div class="about__visual"><div class="led9 about__led" data-led9><canvas></canvas></div>'
                  '<span class="about__tag">Ageless Beauty</span></div>', body, flags=re.S)
    # 지도 자리 → 구글 지도 (주소 그대로 검색)
    body = re.sub(r'<div class="map">.*?</div>',
                  '<div class="map"><iframe title="케어클 위치 — 경기도 고양시 일산동구 동국로 32" loading="lazy" '
                  'referrerpolicy="no-referrer-when-downgrade" '
                  'src="https://www.google.com/maps?q=%EA%B2%BD%EA%B8%B0%EB%8F%84%20%EA%B3%A0%EC%96%91%EC%8B%9C%20%EC%9D%BC%EC%82%B0%EB%8F%99%EA%B5%AC%20%EB%8F%99%EA%B5%AD%EB%A1%9C%2032&output=embed"></iframe></div>',
                  body, count=1, flags=re.S)

    tabs = "".join(
        f'<a href="{h}"{" aria-current=\"page\"" if h == slug else ""}>{t}</a>' for t, h, _ in items)
    head_html = f"""<main class="sub">
  <section class="subhead" data-led="{led}">
    <div class="wrap">
      <p class="label">{group}</p>
      <h1 class="subhead__title">{title_en}</h1>
      <p class="subhead__kr">{title_kr}</p>
    </div>
    <nav class="subtabs" aria-label="{group} 하위 메뉴"><div class="wrap subtabs__in">{tabs}</div></nav>
  </section>
  <div class="sub-body">
{body}
  </div>
</main>
"""
    return (head(f"{title_kr} | careCL 케어클", f"careCL {title_kr}", sub=True)
            + header(GROUP_HREF[group]) + head_html + FOOTER + tail(three=False))


for _g, _led, _items in MENU:
    for _i, (_, _slug, _) in enumerate(_items):
        PAGES[_slug] = (lambda g=_g, l=_led, it=_items, i=_i: sub_page(g, l, it, i))



# ═══════════════════════════════════════════════════════════
#  AI 피부 진단 설문 · 결과 리포트
# ═══════════════════════════════════════════════════════════
def page_survey():
    body = """<main class="sv sv--stem" data-led="red">
  <aside class="sv__panel">
    <div class="sv__dots" data-dotfield></div>
    <div class="led9 sv__led" data-led9><canvas></canvas></div>
    <div class="sv__lock">
      <em>AI Skin Agent</em>
      <b>Aging Map 22</b>
      <p>얼굴을 22개 좌표로 나누어<br>당신의 노화 타입을 진단합니다</p>
    </div>
  </aside>
  <section class="sv__body"><div class="sv__form" id="svForm"></div></section>
</main>
"""
    return (head("노화 타입 진단 | Aging Map 22 — careCL 케어클", "2분 설문으로 나의 노화 타입과 먼저 관리할 부위를 확인하세요",
                 css=("css/bridge.css", "css/survey.css", "css/report.css"), body_cls="survey")
            + header("aging-types.html") + body + FOOTER
            + tail(three=False, js=("js/report.js", "js/survey.js")))


def page_report():
    body = """<main class="sub">
  <section class="subhead" data-led="purple">
    <div class="wrap">
      <p class="label">Aging Lab</p>
      <h1 class="subhead__title">Aging Report</h1>
      <p class="subhead__kr">진단 결과 리포트</p>
    </div>
  </section>
  <div class="report-body" data-led="purple"><div data-rpt-out></div></div>
</main>
"""
    return (head("진단 결과 리포트 | Aging Map 22 — careCL 케어클", "careCL 노화 타입 진단 결과 리포트",
                 sub=True, css=("css/bridge.css", "css/report.css"))
            + header("aging-types.html") + body + FOOTER
            + tail(three=False, js=("js/report.js", "js/reportpage.js")))


PAGES["survey.html"] = page_survey
PAGES["report.html"] = page_report

if __name__ == "__main__":
    for name, fn in PAGES.items():
        io.open(os.path.join(ROOT, name), "w", encoding="utf-8").write(fn())
        print("built", name)
    print("v=" + VER)
