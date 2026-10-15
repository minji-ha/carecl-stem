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


def head(title, desc):
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
<script type="importmap">{{"imports":{{"three":"./libs/three/three.module.min.js"}}}}</script>
</head>
<body>
"""


def loader():
    return f"""<div class="loader" data-loader aria-hidden="true">
  <div class="drop" data-drop data-drop-balls="5">
    <canvas class="drop__canvas"></canvas>
    <span class="drop__logo">{LOGO}</span>
  </div>
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


def tail():
    return f"""<script src="js/drop.js?v={VER}"></script>
<script src="js/stem.js?v={VER}"></script>
<script type="module" src="js/device3d.js?v={VER}"></script>
</body>
</html>
"""


# 배경에 깔리는 옅은 물결 면
WAVE = """<svg viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true"><path fill="currentColor" d="M0 210C210 120 380 60 640 92c260 32 330 170 560 182 170 9 300-60 400-120v520c-190 90-360 140-620 110-250-29-330-150-560-150C230 834 90 880 0 900Z"/></svg>"""


# ═══════════════════════════════════════════════════════════
#  메인
# ═══════════════════════════════════════════════════════════
PRODUCTS = [
    ("TechFit", "5초 스탬핑 고주파 디바이스", "p-techfit.jpg", "products.html"),
    ("Collagen Booster Gel", "콜라겐 부스터 젤", "p-gel.jpg", "cosmetics.html"),
    ("Light Toning Serum", "라이트 토닝 세럼", "p-serum.jpg", "cosmetics.html"),
    ("Grid Mask Tech Fit", "그리드 마스크", "p-mask.jpg", "cosmetics.html"),
]

STEPS = [
    ("Cleanse", "잔여물 정리", "잔여물을 정리해 다음 단계가 제대로 전달되도록 준비합니다.", "s-hands.jpg"),
    ("Read", "오늘의 부위", "오늘 먼저 관리할 부위를 Aging Map 22 기준으로 확인합니다.", "s-mask-glass.jpg"),
    ("Activate", "집중 전달", "한 부위에 머무르며 수직으로 전달합니다.", "s-mask-device.jpg"),
    ("Recovery", "진정과 보습", "전용 코스메틱으로 전달 직후의 피부를 안정시킵니다.", "p-gel.jpg"),
    ("Maintain", "반복과 기록", "주 2~3회 같은 자리를 반복해 변화를 기록합니다.", "s-device-face.jpg"),
]


def page_index():
    cards = "\n".join(f"""      <li class="card rv" data-d="{i}">
        <a href="{href}">
          <div class="card__img"><img src="assets/img/{img}" alt="{name}" loading="lazy" width="1000" height="1250"></div>
          <span class="card__name">{name}</span>
          <span class="card__meta">{kr}</span>
        </a>
      </li>""" for i, (name, kr, img, href) in enumerate(PRODUCTS))

    step_imgs = "\n".join(
        f'        <img src="assets/img/{img}" alt="" data-step-img="{i}"{" class=\"is-on\"" if i == 0 else ""}>'
        for i, (_, _, _, img) in enumerate(STEPS))

    step_items = "\n".join(f"""      <li class="step{" is-on" if i == 0 else ""}" data-step>
        <div class="step__img"><img src="assets/img/{img}" alt="" loading="lazy"></div>
        <span class="step__num" aria-hidden="true">{i + 1}/</span>
        <div>
          <h3 class="step__title">{en}</h3>
          <span class="step__kr">{kr}</span>
          <p class="step__desc">{desc}</p>
        </div>
      </li>""" for i, (en, kr, desc, img) in enumerate(STEPS))

    body = f"""<main>

  <!-- 01 히어로 -->
  <section class="hero" aria-label="브랜드 필름">
    <img class="hero__poster" src="assets/img/hero-poster.jpg" alt="">
    <video class="hero__video" src="assets/video/brand-film.mp4" poster="assets/img/hero-poster.jpg"
           autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>
    <div class="hero__copy">
      <h1 class="hero__title">Home Aging Care</h1>
      <p class="hero__sub">Every face ages differently.<br>Every face deserves its own care.</p>
      <p class="hero__kr">노화는 저마다 다릅니다. 그래서 관리도 달라야 합니다.</p>
    </div>
  </section>

  <!-- 02 컬렉션 -->
  <section class="coll" aria-labelledby="coll-title">
    <div class="coll__wave">{WAVE}</div>
    <div class="wrap">
      <div class="coll__head">
        <h2 class="label rv" id="coll-title">The Collection</h2>
        <a class="coll__more rv" href="products.html">View All</a>
      </div>
      <ul class="coll__grid">
{cards}
      </ul>
    </div>
  </section>

  <!-- 03 철학 -->
  <section class="phil" aria-labelledby="phil-title">
    <div class="wrap">
      <h2 class="big-title phil__title rv" id="phil-title">Read Precisely, Care Exactly</h2>
      <p class="phil__sub rv" data-d="1">같은 나이라도 노화가 시작되는 자리는 저마다 다릅니다.
      케어클은 그 차이를 먼저 읽는 것에서 안티에이징을 시작합니다.</p>
    </div>
    <div class="phil__stage" data-phil>
      <div class="phil__wave">{WAVE}</div>
      <svg class="phil__lines" aria-hidden="true"></svg>
      <div class="drop" data-drop data-drop-balls="5">
        <canvas class="drop__canvas"></canvas>
        <span class="drop__logo">{LOGO}</span>
      </div>
      <div class="anno anno--a rv" data-anno>
        <h3 class="anno__title">6 Aging Types</h3>
        <p class="anno__desc">나는 어떤 방식으로 나이 들고 있는가</p>
      </div>
      <div class="anno anno--b rv" data-anno data-d="1">
        <h3 class="anno__title">22 Care Zones</h3>
        <p class="anno__desc">어디를 먼저 관리해야 하는가</p>
      </div>
      <div class="anno anno--c rv" data-anno data-d="2">
        <h3 class="anno__title">5-Sec Stamping</h3>
        <p class="anno__desc">정해진 자리에 5초, 눌러서 전달합니다</p>
      </div>
      <a class="btn-line phil__cta" href="aging-types.html">Explore Aging Lab</a>
    </div>
  </section>

  <!-- 04 시스템 -->
  <section class="sys" aria-labelledby="sys-title">
    <div class="sys__img"><img src="assets/img/sys-model.jpg" alt="케어클 디바이스와 전용 코스메틱을 사용하는 모델" loading="lazy" width="2000" height="1333"></div>
    <div class="sys__copy">
      <h2 class="big-title sys__title rv" id="sys-title">The Home Aging Care System</h2>
      <p class="sys__sub rv" data-d="1">디바이스 · 전용 코스메틱 · Aging Map 22<br>케어클이 제안하는 세 가지 홈 에이징 케어</p>
    </div>
  </section>

  <!-- 05 스텝 -->
  <section class="steps" aria-labelledby="steps-title">
    <div class="steps__wave">{WAVE}</div>
    <div class="wrap">
      <div class="steps__head">
        <span class="steps__big rv" aria-hidden="true">5</span>
        <div>
          <h2 class="big-title steps__title rv" id="steps-title">Essential Steps</h2>
          <p class="steps__sub rv" data-d="1">다섯 단계로 이어지는 홈 에이징 케어</p>
        </div>
      </div>
      <div class="steps__body">
        <div class="steps__sticky">
          <div class="drop" data-drop data-drop-balls="4">
            <div class="drop__media">
{step_imgs}
            </div>
            <div class="device3d" data-device3d aria-hidden="true"></div>
            <canvas class="drop__canvas"></canvas>
          </div>
        </div>
        <ol class="steps__list" data-steps>
{step_items}
        </ol>
      </div>
      <div class="steps__end"><a class="btn-line" href="survey.html">AI 피부 진단 시작하기</a></div>
    </div>
  </section>

</main>
"""
    return (head("careCL 케어클 — Home Aging Care",
                 "얼굴을 22개 부위로 나누어 읽고, 먼저 관리해야 할 곳부터 제안하는 홈 에이징 케어")
            + loader() + header() + body + FOOTER + tail())


PAGES = {"index.html": page_index}

if __name__ == "__main__":
    for name, fn in PAGES.items():
        io.open(os.path.join(ROOT, name), "w", encoding="utf-8").write(fn())
        print("built", name)
    print("v=" + VER)
