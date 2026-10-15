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

  /* 서브 페이지 본문은 원고 HTML 그대로라 등장 효과 대상을 여기서 붙인다.
     카드 묶음은 묶음 대신 카드 하나하나가 차례로 올라오게 한다. */
  var GRIDS = '.typecards,.pillars,.docgrid,.points,.flow,.techrows,.trio';
  document.querySelectorAll('.subhead .wrap > *, .sub-body .sec .wrap > *').forEach(function (el) {
    if (!el.matches(GRIDS)) el.classList.add('rv');
  });
  document.querySelectorAll('.typecard,.pillar,.doccard,.point,.flow__step,.techrow,.trio > figure').forEach(function (el) {
    el.classList.add('rv');
    var i = [].indexOf.call(el.parentNode.children, el) % 4;
    if (i) el.dataset.d = String(i);
  });
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
    var head = el.querySelector('[data-led9]');
    var start = performance.now(), MIN = reduce ? 0 : 1600;
    var loaded = document.readyState === 'complete';
    window.addEventListener('load', function () { loaded = true; });

    (function tick(now) {
      var p = Math.min(1, (now - start) / MIN);
      if (!loaded) p = Math.min(p, 0.92);
      if (count) count.textContent = String(Math.round(p * 100)).padStart(2, '0');
      if (window.careclLED && head) window.careclLED.setProgress(head, p);
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
    var drop = stage.querySelector('[data-anno-target]');
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
      var R = db.width * 0.5;                                  // 헤드 가장자리

      annos.forEach(function (a) {
        var ab = a.getBoundingClientRect();
        var t = a.querySelector('.anno__title').getBoundingClientRect();
        var acx = ab.left + ab.width / 2, dcx = db.left + db.width / 2;
        var ax, ay;
        if (ab.top > db.bottom && Math.abs(acx - dcx) < db.width) {   // 헤드 바로 아래 항목 — 위에서 들어온다
          ax = acx - sb.left; ay = ab.top - 14 - sb.top;
        } else {
          var left = acx < dcx;                                        // 주석이 왼쪽인가
          ax = (left ? ab.right + 10 : ab.left - 10) - sb.left;
          ay = t.top + t.height / 2 - sb.top;
        }

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

  /* ── 콜렉션 3D 커버플로 ─────────────────────── */
  (function coverflow() {
    var sec = document.querySelector('[data-cov]');
    if (!sec) return;
    var items = [].slice.call(sec.querySelectorAll('[data-cov-item]'));
    var stage = sec.querySelector('[data-cov-stage]');
    var dotsBox = sec.querySelector('[data-cov-dots]');
    var cap = { tag: sec.querySelector('[data-cov-tag]'), name: sec.querySelector('[data-cov-name]'),
                desc: sec.querySelector('[data-cov-desc]'), link: sec.querySelector('[data-cov-link]') };
    var N = items.length, at = 0, dots = [];
    if (N < 2) return;

    items.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'cov__dot'; b.setAttribute('aria-label', (i + 1) + '번 제품');
      b.addEventListener('click', function () { go(i); hold(); });
      dotsBox.appendChild(b); dots.push(b);
    });

    function place() {
      var w = items[0].offsetWidth || 300, sx = w * 0.86;
      items.forEach(function (el, i) {
        var d = i - at;
        if (d > N / 2) d -= N;
        if (d < -N / 2) d += N;
        var ad = Math.abs(d), sg = d < 0 ? -1 : 1, c = Math.min(ad, 3);
        /* 옆 카드도 얼굴이 보이도록 회전은 얕게, 간격은 넓게 */
        var x = sg * (Math.min(c, 1) * sx + Math.max(0, c - 1) * sx * 0.62);
        el.style.transform = 'translate(-50%,-50%) translate3d(' + x.toFixed(1) + 'px,0,' + (-c * 170).toFixed(0) +
          'px) rotateY(' + (-sg * Math.min(c * 26, 40)).toFixed(1) + 'deg)';
        el.style.opacity = ad > 2.4 ? '0' : (ad > 1.5 ? '.55' : '1');
        el.style.zIndex = String(100 - Math.round(ad * 10));
        el.classList.toggle('is-active', ad === 0);
      });
      dots.forEach(function (b, i) { b.classList.toggle('is-on', i === at); });
      var cur = items[at];
      cap.tag.textContent = cur.dataset.tag; cap.name.textContent = cur.dataset.name;
      cap.desc.textContent = cur.dataset.desc; cap.link.setAttribute('href', cur.dataset.href);
    }
    function go(i) { at = ((i % N) + N) % N; place(); }

    items.forEach(function (el, i) {
      el.addEventListener('click', function (e) { if (i !== at) { e.preventDefault(); go(i); hold(); } });
    });
    sec.querySelector('[data-cov-prev]').addEventListener('click', function () { go(at - 1); hold(); });
    sec.querySelector('[data-cov-next]').addEventListener('click', function () { go(at + 1); hold(); });

    var x0 = null;
    stage.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { go(at + (dx < 0 ? 1 : -1)); hold(); }
    });

    /* 4.5초마다 자동으로 넘기되, 마우스가 올라가 있거나 방금 조작했으면 쉰다 */
    var paused = false, heldUntil = 0;
    function hold() { heldUntil = Date.now() + 6000; }
    sec.addEventListener('mouseenter', function () { paused = true; });
    sec.addEventListener('mouseleave', function () { paused = false; });
    if (!reduce) setInterval(function () {
      if (paused || Date.now() < heldUntil || document.hidden) return;
      var r = sec.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      go(at + 1);
    }, 4500);

    addEventListener('resize', place);
    place();
  })();

  /* ── 공식몰 — 300px 띠에서 시작해 스크롤하면 화면 높이까지 자란다 ── */
  (function shop() {
    var el = document.querySelector('[data-shop]');
    if (!el) return;
    var img = el.querySelector('.shop__bg img');
    var BASE = 300;
    function update() {
      if (innerWidth <= 860) { el.style.height = ''; return; }   /* 좁은 화면은 CSS가 맡는다 */
      var vh = innerHeight, base = Math.min(BASE, vh * 0.5);
      var r = el.getBoundingClientRect();
      var p = Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (vh * 0.75)));
      if (reduce) p = 1;
      p = p * p * (3 - 2 * p);
      /* 끝 높이 — 화면 높이와 사진 전체 높이 중 큰 쪽 (넓은 화면에서 아래 제품이 잘리지 않게) */
      var full = img && img.naturalWidth ? el.clientWidth * img.naturalHeight / img.naturalWidth : vh;
      var end = Math.max(vh, full);
      el.style.height = (base + (end - base) * p) + 'px';
      if (img) img.style.transform = 'scale(' + (1.16 - p * 0.16).toFixed(3) + ')';
    }
    var raf = 0;
    addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; update(); }); }, { passive: true });
    addEventListener('resize', update);
    if (img) img.addEventListener('load', update);
    update();
  })();

  /* ── 큰 사진 — 스크롤하는 동안 1.05배에서 제 크기로 천천히 ── */
  (function zoom() {
    var els = [].slice.call(document.querySelectorAll('[data-zoom]'));
    if (!els.length || reduce) return;
    function update() {
      var vh = innerHeight;
      els.forEach(function (el) {
        var r = el.parentNode.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var p = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));
        el.style.transform = 'scale(' + (1.05 - p * 0.05).toFixed(4) + ')';
      });
    }
    var raf = 0;
    addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; update(); }); }, { passive: true });
    update();
  })();
})();

