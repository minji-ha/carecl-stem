/* =========================================================
   careCL — 페이지 동작
   · 로딩 물방울 (세션당 한 번)
   · 모바일 메뉴
   · 스크롤 등장
   · 철학 섹션 주석 연결선
   · 스텝 섹션 — 스크롤 위치에 따라 활성 단계와 물방울 속 이미지 교체
   ========================================================= */
(function () {
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 로딩 물방울 ─────────────────────────── */
  (function loader() {
    var el = document.querySelector('[data-loader]');
    if (!el) return;
    var KEY = 'carecl_loader_at', WINDOW = 2 * 60 * 60 * 1000;   // 2시간 안 재방문이면 생략
    var force = /[?&]intro=1/.test(location.search);
    var last = 0;
    try { last = +sessionStorage.getItem(KEY) || 0; } catch (e) {}

    function done() { el.classList.add('is-gone'); document.body.classList.remove('is-loading'); }
    if (!force && Date.now() - last < WINDOW) { done(); return; }
    try { sessionStorage.setItem(KEY, String(Date.now())); } catch (e) {}

    document.body.classList.add('is-loading');
    var count = el.querySelector('[data-loader-count]');
    var start = performance.now(), MIN = reduce ? 0 : 1600;
    var loaded = document.readyState === 'complete';
    window.addEventListener('load', function () { loaded = true; });

    (function tick(now) {
      var p = Math.min(1, (now - start) / MIN);
      if (!loaded) p = Math.min(p, 0.92);
      if (count) count.textContent = String(Math.round(p * 100)).padStart(2, '0');
      if (p >= 1) {
        el.classList.add('is-out');
        setTimeout(done, 1150);
        return;
      }
      requestAnimationFrame(tick);
    })(start);
    /* 안전장치 — 어떤 경우에도 6초 뒤엔 걷힌다 */
    setTimeout(function () { el.classList.add('is-out'); setTimeout(done, 1150); }, 6000);
  })();

  /* ── 모바일 메뉴 ─────────────────────────── */
  var menuBtn = document.querySelector('[data-menu]');
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.mnav a').forEach(function (a) {
      a.addEventListener('click', function () { document.body.classList.remove('menu-open'); });
    });
  }

  /* ── 스크롤 등장 ─────────────────────────── */
  var rvs = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rvs.forEach(function (el) { io.observe(el); });
  } else {
    rvs.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ── 철학 섹션 — 주석에서 물방울 가장자리로 선을 긋는다 ── */
  (function annoLines() {
    var stage = document.querySelector('[data-phil]');
    if (!stage) return;
    var svg = stage.querySelector('.phil__lines');
    var drop = stage.querySelector('.drop');
    var annos = stage.querySelectorAll('[data-anno]');
    if (!svg || !drop || !annos.length) return;
    var NS = 'http://www.w3.org/2000/svg';

    function layout() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      if (getComputedStyle(svg).display === 'none') return;
      var sb = stage.getBoundingClientRect();
      var db = drop.getBoundingClientRect();
      var cx = db.left + db.width / 2 - sb.left;
      var cy = db.top + db.height / 2 - sb.top;
      var R = db.width * 0.37;                                 // 물방울 윤곽

      annos.forEach(function (a) {
        var ab = a.getBoundingClientRect();
        var t = a.querySelector('.anno__title').getBoundingClientRect();
        var left = ab.left + ab.width / 2 < db.left + db.width / 2;   // 주석이 왼쪽인가
        var ax = (left ? t.right + 14 : t.left - 14) - sb.left;     // 제목 옆
        var ay = t.top + t.height / 2 - sb.top;

        var ang = Math.atan2(ay - cy, ax - cx);
        var ex = cx + Math.cos(ang) * R, ey = cy + Math.sin(ang) * R;

        var ln = document.createElementNS(NS, 'line');
        ln.setAttribute('x1', ax); ln.setAttribute('y1', ay);
        ln.setAttribute('x2', ex); ln.setAttribute('y2', ey);
        svg.appendChild(ln);

        var dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('cx', ax); dot.setAttribute('cy', ay); dot.setAttribute('r', 3);
        svg.appendChild(dot);
      });
    }
    layout();
    window.addEventListener('resize', layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    window.addEventListener('load', layout);
  })();

  /* ── 스텝 섹션 — 화면 가운데에 가장 가까운 단계를 활성화 ── */
  (function steps() {
    var list = document.querySelector('[data-steps]');
    if (!list) return;
    var items = [].slice.call(list.querySelectorAll('[data-step]'));
    var imgs = [].slice.call(document.querySelectorAll('[data-step-img]'));
    var current = -1;

    function set(i) {
      if (i === current) return;
      current = i;
      items.forEach(function (el, k) { el.classList.toggle('is-on', k === i); });
      imgs.forEach(function (im) { im.classList.toggle('is-on', +im.dataset.stepImg === i); });
    }

    function update() {
      var mid = window.innerHeight * 0.5, best = 0, bestD = Infinity;
      items.forEach(function (el, k) {
        var r = el.getBoundingClientRect();
        var d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestD) { bestD = d; best = k; }
      });
      set(best);
    }
    var raf = 0;
    window.addEventListener('scroll', function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; update(); });
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();
})();
