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

# ── 메뉴 — 노션 '케어클 홈페이지 구성' 메뉴 구조 그대로 (COMPANY / AGING LAB / TECHNOLOGY / PRODUCTS / CONTACT)
# 헤더 드롭다운·모바일 메뉴·푸터가 모두 이 표를 쓴다. 서브 페이지 탭(MENU)도 같은 순서.
HNAV = [
    ("Company", "about.html", [("About careCL", "about.html", "회사 소개"),
                               ("Our Story", "greeting.html", "브랜드 스토리"),
                               ("R&amp;D / Patent", "rnd.html", "연구개발 · 특허"),
                               ("Awards &amp; Certification", "certification.html", "수상 · 인증")]),
    ("Aging Lab", "aging-types.html", [("6 Aging Types", "aging-types.html", "6가지 노화 타입"),
                                       ("Aging Map 22", "aging-map.html", "22개 관리 부위")]),
    ("Technology", "technology.html", [("Beauty Device Technology", "technology.html", "홈뷰티 디바이스 기술"),
                                       ("careCL Technology", "carecl-technology.html", "케어클 기술")]),
    ("Products", "products.html", [("Beauty Device", "products.html", "뷰티 디바이스"),
                                   ("Cosmetics", "cosmetics.html", "코스메틱")]),
    ("Contact", "contact.html", [("Global Business", "contact.html", "해외 사업 문의"),
                                 ("Distributor / Partnership", "partnership.html", "유통 · 제휴 문의"),
                                 ("Media / PR", "press.html", "미디어 문의"),
                                 ("General Inquiry", "inquiry.html", "일반 문의")]),
]
# 오른쪽 — SHOP · LOGIN · KR/EN(작게). 공식몰·로그인 주소는 받는 대로 바꾼다.
SHOP_HREF = "products.html"
LOGIN_HREF = "#"


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
{"" if sub else '<link rel="preload" href="fonts/caviar-dreams.woff2" as="font" type="font/woff2" crossorigin>' + chr(10)}<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<link rel="stylesheet" href="css/stem.css?v={VER}">
<link rel="stylesheet" href="css/home261019.css?v={VER}">
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
    def group(t, h, subs):
        on = active and (active == h or any(active == sh for _, sh, _ in subs))
        sub = "".join(f'<a href="{sh}"><b>{st}</b><small>{sk}</small></a>' for st, sh, sk in subs)
        return (f'<div class="hnav"><a class="hnav__top" href="{h}"{" aria-current=\"page\"" if on else ""}>{t}</a>'
                f'<div class="hnav__sub"><div class="hnav__in">{sub}</div></div></div>')
    left = "".join(group(*g) for g in HNAV)
    mnav = "".join(
        f'<div class="mnav__grp"><a class="mnav__top" href="{h}">{t}</a>'
        + "".join(f'<a class="mnav__sub" href="{sh}">{st}<small>{sk}</small></a>' for st, sh, sk in subs) + '</div>'
        for t, h, subs in HNAV)
    return f"""<header class="header">
  <nav class="header__nav" aria-label="주 메뉴">{left}</nav>
  <a class="header__logo" href="index.html" aria-label="careCL 홈">{LOGO}</a>
  <nav class="header__nav header__nav--right header__util" aria-label="쇼핑 · 로그인 · 언어">
    <span class="header__lang"><a href="#" aria-current="true" lang="ko">KR</a><i aria-hidden="true">/</i><a href="#" lang="en">EN</a></span>
    <a href="{SHOP_HREF}">Shop</a><a href="{LOGIN_HREF}">Login</a>
  </nav>
  <button class="header__menu" type="button" data-menu aria-label="메뉴 열기" aria-expanded="false"><span></span><span></span></button>
</header>
<nav class="mnav" aria-label="모바일 메뉴">{mnav}
  <div class="mnav__util"><a href="{SHOP_HREF}">Shop</a><a href="{LOGIN_HREF}">Login</a><span class="header__lang"><a href="#" aria-current="true">KR</a><i aria-hidden="true">/</i><a href="#">EN</a></span></div>
</nav>
"""


# 푸터 SNS — 링크 주소는 받는 대로 href에 넣는다. 유튜브만 가로형이라 따로 크기를 준다.
SNS = [("Instagram", "instagram", ""), ("Facebook", "facebook", ""),
       ("YouTube", "youtube", ' class="is-wide"'), ("KakaoTalk", "kakaotalk", "")]

FOOTER = f"""<footer class="foot">
  <div class="wrap">
    <div class="foot__top">
      <div class="foot__brand">
        <a class="foot__logo" href="index.html" aria-label="careCL 홈">{LOGO}</a>
      </div>
      <div class="foot__side">
        <h2>AI Skin Test</h2>
        <p>2분 설문으로 나의 노화 타입과<br>먼저 관리할 부위를 확인하세요.</p>
        <a class="btn-line" href="survey.html">진단 시작하기</a>
      </div>
    </div>
    <div class="foot__row">
      <nav class="foot__nav" aria-label="푸터 메뉴">
        {"".join(f'<a href="{h}">{t}</a>' for t, h, _ in HNAV)}
      </nav>
      <div class="foot__sns">{"".join(f'<a href="#" aria-label="{t}"><img{c} src="assets/img/sns/{f}.svg" alt=""></a>' for t, f, c in SNS)}</div>
    </div>
  </div>
  <div class="foot__bar">
    <span>CARECL CO.,Ltd. · CEO Hyungkyu Choi · 사업자등록번호 591-88-03097 · 통신판매업 제2025-고양일산동-0585호</span>
    <span>TEL +82 31-943-1028 · support@carecl.co.kr</span>
    <span>© 2026 CARECL. All rights reserved.</span>
  </div>
</footer>
"""


AIFAB = ('<a class="aifab" href="survey.html" aria-label="AI 피부 진단 시작하기"><span class="aifab__ico">'
         '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.2 14 8.4 20.2 10.4 14 12.4 12 18.6 10 12.4 3.8 10.4 10 8.4Z" fill="currentColor"/>'
         '<circle cx="19.4" cy="4.2" r="1.7" fill="currentColor" opacity=".9"/><circle cx="4.8" cy="18.4" r="1.2" fill="currentColor" opacity=".7"/></svg></span>'
         '<span class="aifab__txt">AI 피부 진단</span></a>\n')


def tail(three=True, js=(), fab=True, mods=()):
    mod = f'<script type="module" src="js/device3d.js?v={VER}"></script>\n' if three else ""
    mod += "".join(f'<script type="module" src="{m}?v={VER}"></script>' + chr(10) for m in mods)
    return (AIFAB if fab else "") + f"""<script src="libs/lenis.min.js"></script>
<script src="js/led.js?v={VER}"></script>
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
    ("01 Read", "6가지 노화 타입", "나는 어떤 방식으로 나이 들고 있는가", "타입 보기", "aging-types.html", 14, 20),
    ("02 Map", "22개 관리 부위", "어디를 먼저 관리해야 하는가", "부위 보기", "aging-map.html", 86, 20),
    ("03 Tech", "5초 스탬핑", "어떻게 전달할 것인가", "기술 보기", "carecl-technology.html", 14, 74),
    ("04 Product", "디바이스 · 코스메틱", "무엇으로 관리할 것인가", "제품 보기", "products.html", 86, 74),
]   # 수정요청 261019: 다섯 가지 → 네 가지 기준 (AI 피부 진단은 아래 큰 버튼으로)

PRODUCTS = [  # (분류, 이름, 설명, 이미지, 링크, 마우스를 올리면 보이는 같은 제품의 다른 컷)
    ("Device", "TechFit", "5초 스탬핑 고주파 디바이스", "p-techfit.jpg", "products.html", "n-techfit-stand.jpg"),
    ("Device", "CLB", "고주파 마사지기", "p-clb.jpg", "products.html", "e-clb-v.jpg"),
    ("Cosmetic", "Collagen Booster Gel", "콜라겐 부스터 젤", "p-gel.jpg", "cosmetics.html", "e-gel-blue-v.jpg"),
    ("Cosmetic", "Grid Mask", "그리드 마스크", "p-mask.jpg", "cosmetics.html", "s-mask-glass.jpg"),
    ("Cosmetic", "Toning Serum", "라이트 토닝 세럼", "p-serum.jpg", "cosmetics.html", "e-serum-warm-v.jpg"),
    ("Accessory", "Firenze Bag", "케어클 피렌체 백 · 디바이스 전용 가죽 케이스", "p-case.jpg", "products.html", "c-techfit-case.jpg"),
]

STEPS = [  # (EN, 한글, 설명, 모바일용 사진)
    ("Cleanse", "잔여물 정리", "잔여물을 정리해 다음 단계가 제대로 전달되도록 준비합니다.", "p-gel.jpg"),
    ("Read", "오늘의 부위", "오늘 먼저 관리할 부위를 Aging Map 22 기준으로 확인합니다.", "s-mask-glass.jpg"),
    ("Activate", "집중 전달", "한 부위에 머무르며 수직으로 전달합니다.", "p-techfit.jpg"),
    ("Recovery", "진정과 보습", "전용 코스메틱으로 전달 직후의 피부를 안정시킵니다.", "p-serum.jpg"),
    ("Maintain", "반복과 기록", "주 2~3회 같은 자리를 반복해 변화를 기록합니다.", "n-lineup-sq.jpg"),
]

# 물방울 속에 띄울 누끼 제품 (tools: 흰 배경 제품컷 → 투명 PNG). 순서는 STEPS와 같다
STEP_CUTS = ["cut-gel.png", "cut-mask.png", "cut-device.png", "cut-serum.png", "cut-case.png"]
STEP_FINAL_CUT = "cut-lineup.png"   # 마지막 단계 뒤 가운데 큰 물방울 속

CONTACTS = [
    ("Global Business", "해외 사업", "수출 · 해외 유통 문의<br>support@carecl.co.kr", "contact.html"),
    ("Partnership", "유통 · 제휴", "총판 및 제휴 제안<br>support@carecl.co.kr", "partnership.html"),
    ("Media / PR", "미디어", "취재 · 광고 · 협찬<br>support@carecl.co.kr", "press.html"),
    ("General", "일반 문의", "제품 사용 · A/S<br>TEL +82 31-943-1028", "inquiry.html"),
]


def hero_merge():
    """care CLINICAL LEVEL → careCL. C·L만 남기고 LINICAL과 EVEL이 동시에 끝 글자부터 하나씩 사라진 뒤 빈칸이 닫힌다.
    각 조각의 data-mg-at="시작,끝"은 스크롤 진행도(0~1) 구간 — stem.js heroMerge가 읽는다."""
    def word(txt):
        n, out = len(txt), []
        for j, ch in enumerate(txt):
            k = n - 1 - j                       # 끝 글자부터
            st = k / n * 0.62
            out.append(f'<span class="mg mg--drop" data-mg data-mg-at="{st:.3f},{st + 0.62 / n + 0.06:.3f}">{ch}</span>')
        return "".join(out)
    gap = '<span class="mg mg--drop" data-mg data-mg-at=".62,1">&nbsp;</span>'
    return ('<span class="mg mg--care">care</span>' + gap + '<span class="mg mg--cl">C</span>' + word("LINICAL")
            + gap + '<span class="mg mg--cl">L</span>' + word("EVEL"))


def page_index():
    HERO_MERGE = hero_merge()
    core = "\n".join(f"""      <div class="anno anno--core rv" data-anno style="left:{x}%;top:{y}%">
        <em class="anno__no">{no}</em>
        <h3 class="anno__title">{t}</h3>
        <p class="anno__desc">{q}</p>
        <a class="anno__link" href="{h}">{lk}</a>
      </div>""" for no, t, q, lk, h, x, y in CORE)

    cards = "\n".join(f"""        <li class="pcard"><a href="{href}" draggable="false">
          <div class="pcard__img"><img src="assets/img/{img}" alt="{name}" loading="lazy" draggable="false"><img class="pcard__alt" src="assets/img/{alt}" alt="" loading="lazy" draggable="false"></div>
          <em>{tag}</em><b>{name}</b><span>{desc}</span>
        </a></li>""" for tag, name, desc, img, href, alt in PRODUCTS)

    step_items = "\n".join(f"""      <li class="step{" is-on" if i == 0 else ""}" data-step data-step-src="assets/img/{img}" data-step-cut="assets/img/{STEP_CUTS[i]}">
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

    body = f"""<main>

  <!-- 01 상단 배너 -->
  <section class="hero" aria-label="메인 영상">
    <img class="hero__poster" src="assets/img/main-film-poster.jpg?v={VER}" alt="">
    <video class="hero__video" src="assets/video/main-film.mp4?v={VER}" poster="assets/img/main-film-poster.jpg?v={VER}"
           autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>
    <div class="hero__copy" data-merge>
      <p class="hero__eyebrow">Anti-Aging Skincare</p>
      <!-- care CLINICAL LEVEL → 화면을 내리면 careCL로 합쳐진다 (stem.js heroMerge) -->
      <h1 class="hero__title hero__title--merge" aria-label="care Clinical Level — careCL">{HERO_MERGE}</h1>
    </div>
  </section>

  <!-- 03 철학 -->
  <section class="phil" data-led="purple" aria-labelledby="phil-title">
    <div class="wrap phil__inner">
      <h2 class="phil__label rv">케어클의 철학</h2>
      <p class="phil__title rv" id="phil-title" data-d="1">노화는 누구에게나 찾아오지만<br>그 모습은 모두 다릅니다.</p>
      <p class="phil__sub rv" data-d="2">노화를 이해하고<br>타입에 맞추어 케어합니다.</p>
    </div>
  </section>

  <!-- 04 핵심 (가운데 물방울 속 로고 + 주변 네 항목) -->
  <section class="core" data-led="green" aria-labelledby="core-title">
    <div class="wrap">
      <div class="sec-head sec-head--center">
        <h2 class="label label--center rv">How careCL Works</h2>
        <p class="sec-title rv" id="core-title" data-d="1">케어클의 네 가지 기준</p>
      </div>
    </div>
    <div class="core__stage" data-phil>
      <svg class="phil__lines" aria-hidden="true"></svg>
      <div class="core__center">
        <div class="bubble core__bubble" data-bubble="logo" data-anno-target data-anno-r=".4" role="img" aria-label="물방울 속 careCL 로고">
          <span class="bubble__fallback">{LOGO}</span>
        </div>
      </div>
{core}
    </div>
    <div class="core__cta">
      <a class="aicta" href="survey.html">
        <span class="aicta__ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2.2 14 8.4 20.2 10.4 14 12.4 12 18.6 10 12.4 3.8 10.4 10 8.4Z" fill="currentColor"/><circle cx="19.4" cy="4.2" r="1.7" fill="currentColor"/></svg></span>
        <span class="aicta__txt"><small>AI Skin Test · 2분 진단</small><b>AI 피부 진단 시작하기</b></span>
        <span class="aicta__arr" aria-hidden="true">→</span>
      </a>
    </div>
  </section>

  <!-- 05 환기용 이미지 -->
  <section class="sys" data-led="yellow" aria-labelledby="sys-title">
    <div class="sys__img">
      <img src="assets/img/m-model.jpg?v={VER}" alt="고개를 돌려 미소 짓는 케어클 모델" loading="lazy" width="2400" height="1405" data-zoom>
      <div class="sys__copy">
        <p class="sys__title rv" id="sys-title"><span class="sys__en">care Clinic-level</span><span class="sys__kr">집 안의 리추얼로</span></p>
      </div>
    </div>
  </section>

  <!-- 06 콜렉션 (좌우 스크롤) -->
  <section class="coll" data-led="yellow" aria-labelledby="coll-title">
    <div class="wrap">
      <div class="sec-head">
        <h2 class="label rv">Collection</h2>
        <p class="sec-title rv" id="coll-title" data-d="1">진단 결과에 맞춰<br>조합하는 제품</p>
      </div>
    </div>
    <div class="hscroll" data-hscroll>
      <ul class="hscroll__list" data-hscroll-list>
{cards}
      </ul>
    </div>
    <div class="wrap hscroll__foot">
      <div class="hscroll__bar" aria-hidden="true"><i data-hscroll-bar></i></div>
      <div class="hscroll__btns">
        <button type="button" class="cov__nav" data-hscroll-prev aria-label="이전 제품">←</button>
        <button type="button" class="cov__nav" data-hscroll-next aria-label="다음 제품">→</button>
      </div>
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
        <div class="steps__stage" data-steps-stage data-final-cut="assets/img/{STEP_FINAL_CUT}">
          <div class="bubble steps__bubble" data-bubble="steps" aria-hidden="true"></div>
          <a class="btn-roll btn-roll--solid steps__shop" href="{SHOP_HREF}" data-steps-shop><span class="btn-roll__t"><span>Shop now</span><span aria-hidden="true">Shop now</span></span><span class="btn-roll__arr" aria-hidden="true">→</span></a>
        </div>
        <ol class="steps__list" data-steps>
{step_items}
        </ol>
        <div class="steps__expand" data-steps-expand aria-hidden="true"></div>
      </div>
    </div>
  </section>

  <!-- 08 샵 링크 (스크롤하면 높이가 화면 가득) -->
  <section class="shop" data-shop data-led="red">
    <div class="shop__bg"><img src="assets/img/m-model-set.jpg?v={VER}" alt="TechFit 풀세트와 디바이스를 든 모델" loading="lazy"></div>
    <div class="wrap shop__inner">
      <div>
        <h2 class="shop__title">Shop the Official Store</h2>
        <p class="shop__desc">진단 결과에 맞는 구성으로 담아 보세요.</p>
      </div>
      <a class="btn-roll btn-roll--solid btn-roll--lg" href="{SHOP_HREF}"><span class="btn-roll__t"><span>Shop 바로가기</span><span aria-hidden="true">Shop 바로가기</span></span><span class="btn-roll__arr" aria-hidden="true">→</span></a>
    </div>
  </section>

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
            + loader() + header() + body + FOOTER + tail(three=False, mods=("js/bubble.js",)))


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
# 머리말 제목 줄바꿈 (탭 이름은 그대로 한 줄)
TITLE_BREAK = {"careCL Technology": "careCL<br>Technology", "Awards & Certification": "Awards &amp;<br>Certification"}

# 메뉴별 머리말 오른쪽 이미지 (회사 소개는 오렌지 C, 문의는 없음)
HEAD_VISUAL = {"Company": ("C", "letter"),
               "Products": ("h-package.jpg", "photo photo--pkg"),
               "Technology": ("h-techfit-lit.webp", "cut cut--tall"),
               "Aging Lab": ("h-model.jpg", "photo")}
GROUP_HREF = {"Company": "about.html", "Aging Lab": "aging-types.html", "Technology": "technology.html",
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
    body = re.sub(r'<section class="(sec|figbreak|dp)', lambda m: '<section data-led="' + led + '" class="' + m.group(1), body)
    # 회사 소개의 파티클 캔버스 → 9구 LED 헤드
    body = re.sub(r'<div class="about__visual ceo__visual" id="brandParticles">.*?</div></div>',
                  '<div class="about__visual"><div class="led9 about__led" data-led9><canvas></canvas></div>'
                  '<span class="about__tag">Ageless Beauty</span></div>', body, flags=re.S)
    # 지도 자리 → 구글 지도 (주소 그대로 검색)
    body = re.sub(r'<div class="map( rv)?">.*?</div>',
                  lambda m: '<div class="map' + (m.group(1) or '') + '"><iframe title="케어클 위치 — 경기도 고양시 일산동구 동국로 32" loading="lazy" '
                  'referrerpolicy="no-referrer-when-downgrade" '
                  'src="https://www.google.com/maps?q=%EA%B2%BD%EA%B8%B0%EB%8F%84%20%EA%B3%A0%EC%96%91%EC%8B%9C%20%EC%9D%BC%EC%82%B0%EB%8F%99%EA%B5%AC%20%EB%8F%99%EA%B5%AD%EB%A1%9C%2032&output=embed"></iframe></div>',
                  body, count=1, flags=re.S)

    tabs = "".join(
        f'<a href="{h}"{" aria-current=\"page\"" if h == slug else ""}>{t}</a>' for t, h, _ in items)
    vis = HEAD_VISUAL.get(group)
    if vis and vis[0] == "C":
        # 회사 소개 — 화면 오른쪽에 잘려 보이는 크고 두꺼운 오렌지 C
        vis_html = ('<div class="subhead__vis subhead__vis--letter" aria-hidden="true">'
                    '<svg viewBox="0 0 1000 1000"><path d="M 768 259 A 360 360 0 1 0 768 741" '
                    'fill="none" stroke="currentColor" stroke-width="200" stroke-linecap="round"/></svg></div>')
    else:
        vis_html = (f'<div class="subhead__vis subhead__vis--{vis[1]}" aria-hidden="true">'
                    f'<img src="assets/img/{vis[0]}?v={VER}" alt="" decoding="async"></div>') if vis else ""
    head_html = f"""<main class="sub">
  <section class="subhead{' subhead--vis' if vis else ''}" data-led="{led}">
    <div class="subhead__top">
      {vis_html}
      <div class="wrap">
        <p class="label">{group}</p>
        <h1 class="subhead__title">{TITLE_BREAK.get(title_en, title_en)}</h1>
        <p class="subhead__kr">{title_kr}</p>
      </div>
    </div>
    <nav class="subtabs" aria-label="{group} 하위 메뉴"><div class="wrap subtabs__in">{tabs}</div></nav>
  </section>
  <div class="sub-body">
{body}
  </div>
</main>
"""
    return (head(f"{title_kr} | careCL 케어클", f"careCL {title_kr}", sub=True, css=("css/detail.css",))
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
    <div class="sv__stick">
      <div class="sv__lock">
        <em>AI Skin Agent</em>
        <b>Aging Map 22</b>
        <p>얼굴을 22개 좌표로 나누어<br>당신의 노화 타입을 진단합니다</p>
      </div>
      <!-- 왼쪽 그래픽 자리 (임시: 살아 움직이는 구체 — 새 AI 진단 그래픽으로 바꿀 예정) -->
      <div class="sv__orbwrap"><div class="sv__orb" data-orb aria-hidden="true"><canvas></canvas></div></div>
    </div>
  </aside>
  <section class="sv__body"><div class="sv__form" id="svForm"></div></section>
</main>
"""
    return (head("노화 타입 진단 | Aging Map 22 — careCL 케어클", "2분 설문으로 나의 노화 타입과 먼저 관리할 부위를 확인하세요",
                 css=("css/bridge.css", "css/survey.css", "css/checkup-result.css", "css/report.css"), body_cls="survey")
            + header("aging-types.html") + body + FOOTER
            + tail(three=False, js=("js/report-data.js", "js/report.js", "js/radar.js", "js/survey.js", "js/orb.js"), fab=False))


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
                 sub=True, css=("css/bridge.css", "css/checkup-result.css", "css/report.css"))
            + header("aging-types.html") + body + FOOTER
            + tail(three=False, js=("js/report-data.js", "js/report.js", "js/radar.js", "js/reportpage.js"), fab=False))


PAGES["survey.html"] = page_survey


# ── 왼쪽 패널 그래픽 시안별 리포트 (로그인 전 화면 비교용) ──
PANEL_VARIANTS = [
    ("survey-p1.html", "lab/left-1-particle-face.html", "입자 얼굴"),
    ("survey-p2.html", "lab/left-3-terminal.html", "터미널"),
    ("survey-p3.html", "lab/left-4-hologram-device.html", "홀로그램"),
    ("survey-p4.html", "lab/left-5-aurora.html", "오로라"),
    ("survey-p5.html", "lab/left-6-device-3d.html", "3D 기기"),
    ("survey-p6.html", "lab/left-7-zone-photo.html", "부위 사진"),
]


def page_survey_panel(idx):
    name, src, _ = PANEL_VARIANTS[idx]
    tabs = "".join(f'<a href="{n}" data-src="{s_}"{" class=on" if i == idx else ""}><i>{i + 1}</i>{label}</a>'
                   for i, (n, s_, label) in enumerate(PANEL_VARIANTS))
    out = page_survey()
    out = re.sub(r'<div class="sv__stick">.*?</div>\n    </div>\n  </aside>',
                 f'<div class="sv__stick sv__stick--frame"><iframe src="{src}?embed=1&amp;v={VER}" title="AI 진단 그래픽" loading="eager"></iframe></div>\n  </aside>',
                 out, count=1, flags=re.S)
    out = out.replace('<main class="sv sv--stem"', f'<nav class="pvtabs" aria-label="왼쪽 그래픽 시안">{tabs}</nav>\n<main class="sv sv--stem sv--framed"', 1)
    out = out.replace('<script src="js/orb.js', '<script data-off="js/orb.js', 1)
    # 탭은 페이지 이동 없이 왼쪽 그래픽만 바꾼다 (js/pvtabs.js)
    out = out.replace('</body>', f'<script src="js/pvtabs.js?v={VER}"></script>' + chr(10) + '</body>', 1)
    return out


for _i, (_n, _s, _l) in enumerate(PANEL_VARIANTS):
    PAGES[_n] = (lambda i=_i: page_survey_panel(i))
PAGES["survey.html"] = lambda: page_survey_panel(0)


def page_survey_flow():
    """survey2.html — 1번은 왼쪽 패널, 2~5번은 전체 화면 인트로 → 가운데 설문 (js/pvtabs.js data-flow)"""
    out = page_survey_panel(0)
    out = re.sub(r'href="survey-p(\d)\.html"', r'href="survey2.html?g=\1"', out)
    out = out.replace('<nav class="pvtabs"', '<nav class="pvtabs" data-flow', 1)
    out = out.replace('sv--framed"', 'sv--framed sv--flow"', 1)
    out = out.replace('</main>', '<div class="sv__mini" hidden aria-hidden="true"><iframe title="TECH FIT 3D" tabindex="-1"></iframe></div>\n</main>', 1)
    return out


PAGES["survey2.html"] = page_survey_flow   # 시안 확인용 사이트 — 기본 설문에도 그래픽 탭 6개
PAGES["report.html"] = page_report

# ── AI 피부 진단 공개 여부 ──────────────────────────────
# False: 진단(survey.html) · 리포트(report.html)로 가는 링크를 모든 페이지에서 뗀다.
#        두 페이지 파일은 그대로 만들되 검색에 안 잡히게 한다(주소를 아는 사람만 열 수 있음).
# True : 작업이 끝나면 이 값만 바꾸면 버튼 · 메뉴 · 푸터 · 본문 링크가 모두 다시 붙는다.
AI_TEST_PUBLIC = True


def hide_ai_test(html):
    html = re.sub(r'<a class="aifab".*?</a>\n?', '', html, flags=re.S)                       # 오른쪽 아래 버튼
    html = re.sub(r'<div class="foot__side">.*?</div>\s*(?=</div>\s*<div class="foot__row")', '', html, flags=re.S)  # 푸터 진단 안내
    html = re.sub(r'<div class="core__cta">.*?</div>', '', html, flags=re.S)                   # 메인 '나의 Aging Type 알아보기'
    html = re.sub(r'<a[^>]*href="(?:survey|report)\.html[^"]*"[^>]*>.*?</a>', '', html, flags=re.S)  # 나머지 링크
    html = re.sub(r'<p>\s*</p>', '', html)
    return html


if __name__ == "__main__":
    for name, fn in PAGES.items():
        out = fn()
        if name.startswith("survey-p") or name == "survey2.html":   # 왼쪽 그래픽 비교용 시안 페이지는 공개 후에도 검색에서 뺀다
            out = out.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n<meta name="robots" content="noindex, nofollow">', 1)
        elif not AI_TEST_PUBLIC:
            if name.startswith("survey") or name == "report.html":
                out = out.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n<meta name="robots" content="noindex, nofollow">', 1)
            else:
                out = hide_ai_test(out)
        io.open(os.path.join(ROOT, name), "w", encoding="utf-8").write(out)
        print("built", name)
    print("v=" + VER)
