/* =========================================================
   careCL LED — TechFit 9구 LED 헤드에서 가져온 효과
   1) 빛 번짐   [body]          마우스를 따라 빛이 번지고 잔광이 남는다.
                                섹션의 data-led 값에 따라 색이 바뀐다.
   2) 9구 헤드  [data-led9]     3×3 LED 헤드. 차례로 켜지고, 마우스가
                                가까이 오면 점이 더 밝아지며 부푼다.
   3) 점 격자   [data-dotfield] 배경 격자 점. 마우스 근처 점이 켜지듯 빛난다.

   색 (TechFit 상세페이지 SHOT MODE 기준)
     red    FACE SHOT  — 콜라겐·탄력
     green  EYE SHOT   — 피부톤
     yellow BODY SHOT  — 순환·붓기
     purple GLOW (EP·갈바닉) — 흡수
   ========================================================= */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;

  var LED = {
    red:    [255, 70, 72],
    green:  [56, 214, 120],
    yellow: [255, 206, 56],
    purple: [158, 104, 255]
  };
  function rgb(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')'; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  /* 지금 화면 가운데에 있는 섹션의 LED 색 */
  var current = LED.red.slice(), target = LED.red.slice(), currentName = 'red';
  var ledSections = [].slice.call(document.querySelectorAll('[data-led]'));
  function pickSection() {
    var mid = innerHeight * 0.5, name = null;
    for (var i = 0; i < ledSections.length; i++) {
      var r = ledSections[i].getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) { name = ledSections[i].dataset.led; break; }
    }
    if (name && LED[name] && name !== currentName) {
      currentName = name; target = LED[name];
      document.documentElement.dataset.ledNow = name;
      wake();
    }
  }

  /* ── 1) 빛 번짐 ─────────────────────────────── */
  var glow = null, gctx = null, trail = [], pointer = null, awake = false, lastMove = 0;
  var SCALE = 0.5;                       // 절반 해상도로 그려 가볍게 (흐린 빛이라 티가 안 난다)
  if (fine && !reduce) {
    glow = document.createElement('canvas');
    glow.className = 'led-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);
    gctx = glow.getContext('2d');
    /* 화살표 끝에 붙는 10px 점 — 퍼진 빛 속에서 시선이 머무는 자리 */
    var dot = document.createElement('span');
    dot.className = 'led-dot';
    dot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dot);
    var sizeGlow = function () {
      glow.width = Math.ceil(innerWidth * SCALE);
      glow.height = Math.ceil(innerHeight * SCALE);
    };
    sizeGlow();
    addEventListener('resize', sizeGlow);
    addEventListener('pointermove', function (e) {
      pointer = { x: e.clientX, y: e.clientY };
      dot.style.transform = 'translate3d(' + (e.clientX - 5) + 'px,' + (e.clientY - 5) + 'px,0)';
      dot.classList.add('is-on');
      var now = performance.now();
      if (!trail.length || now - trail[trail.length - 1].t > 28) trail.push({ x: e.clientX, y: e.clientY, t: now });
      if (trail.length > 40) trail.shift();
      lastMove = now;
      wake();
    }, { passive: true });
    document.addEventListener('pointerleave', function () { pointer = null; dot.classList.remove('is-on'); wake(); });
    document.documentElement.addEventListener('mouseleave', function () { pointer = null; dot.classList.remove('is-on'); wake(); });
  }

  function drawGlow(now) {
    var w = glow.width, h = glow.height;
    gctx.clearRect(0, 0, w, h);
    var LIFE = 1400;                     // 잔광이 남는 시간(ms)
    var alive = false;
    trail = trail.filter(function (p) { return now - p.t < LIFE; });
    for (var i = 0; i < trail.length; i++) {
      var p = trail[i], age = (now - p.t) / LIFE;
      var a = 0.15 * (1 - age) * (1 - age);
      var r = (50 + age * 80) * SCALE;
      var g = gctx.createRadialGradient(p.x * SCALE, p.y * SCALE, 0, p.x * SCALE, p.y * SCALE, r);
      g.addColorStop(0, rgb(current, a));
      g.addColorStop(1, rgb(current, 0));
      gctx.fillStyle = g;
      gctx.fillRect(p.x * SCALE - r, p.y * SCALE - r, r * 2, r * 2);
      alive = true;
    }
    if (pointer) {
      var R = 140 * SCALE, x = pointer.x * SCALE, y = pointer.y * SCALE;
      var g2 = gctx.createRadialGradient(x, y, 0, x, y, R);
      g2.addColorStop(0, rgb(current, 0.30));
      g2.addColorStop(0.45, rgb(current, 0.12));
      g2.addColorStop(1, rgb(current, 0));
      gctx.fillStyle = g2;
      gctx.fillRect(x - R, y - R, R * 2, R * 2);
      alive = alive || now - lastMove < 2400;
    }
    return alive;
  }

  /* ── 2) 9구 헤드 ─────────────────────────────── */
  var heads = [].slice.call(document.querySelectorAll('[data-led9]')).map(function (el) {
    var cv = el.querySelector('canvas') || el.appendChild(document.createElement('canvas'));
    return { el: el, cv: cv, ctx: cv.getContext('2d'), lit: new Array(9).fill(0), hot: new Array(9).fill(0), w: 0, dpr: 1,
             fixed: el.dataset.led9 && LED[el.dataset.led9] ? LED[el.dataset.led9] : null,
             mode: el.dataset.led9Mode || 'wave', progress: 0 };
  });
  function sizeHead(h) {
    var b = h.el.getBoundingClientRect();
    h.dpr = Math.min(devicePixelRatio || 1, 2);
    h.w = b.width;
    h.cv.width = Math.round(b.width * h.dpr);
    h.cv.height = Math.round(b.width * h.dpr);
  }
  heads.forEach(sizeHead);
  addEventListener('resize', function () { heads.forEach(sizeHead); wake(); });

  function drawHead(h, now) {
    var c = h.ctx, d = h.dpr, W = h.w * d;
    if (!W) return false;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, W, W);
    var col = h.fixed || current;

    /* 헤드 몸체 — 은색 사각 */
    var pad = W * 0.06, size = W - pad * 2, rad = size * 0.2;
    var body = c.createLinearGradient(pad, pad, pad + size, pad + size);
    body.addColorStop(0, '#F4F3F1'); body.addColorStop(0.5, '#D9D7D4'); body.addColorStop(1, '#B9B6B2');
    c.save();
    c.shadowColor = 'rgba(51,27,15,.18)'; c.shadowBlur = W * 0.06; c.shadowOffsetY = W * 0.025;
    roundRect(c, pad, pad, size, size, rad); c.fillStyle = body; c.fill();
    c.restore();
    /* 안쪽 검은 패널 */
    var ip = size * 0.1, ipx = pad + ip, isz = size - ip * 2;
    roundRect(c, ipx, ipx, isz, isz, rad * 0.7);
    var panel = c.createLinearGradient(0, ipx, 0, ipx + isz);
    panel.addColorStop(0, '#2A2725'); panel.addColorStop(1, '#141210');
    c.fillStyle = panel; c.fill();

    /* 점의 밝기 결정 */
    var t = now * 0.001, alive = false;
    var mx = null, my = null;
    if (pointer) {
      var b = h.el.getBoundingClientRect();
      mx = (pointer.x - b.left) * d; my = (pointer.y - b.top) * d;
    }
    var cell = isz / 3, dotR = cell * 0.27;
    for (var i = 0; i < 9; i++) {
      var cx = ipx + cell * (i % 3 + 0.5), cy = ipx + cell * (Math.floor(i / 3) + 0.5);
      var base;
      if (reduce) base = 0.85;
      else if (h.mode === 'progress') base = h.progress * 9 > i ? 1 : 0.06;
      else {
        /* 대각선으로 흐르는 물결 — 기기가 순서대로 켜지는 느낌 */
        var phase = t * 1.6 - (i % 3 + Math.floor(i / 3)) * 0.55;
        base = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(phase), 3);
      }
      var near = 0;
      if (mx !== null) {
        var dd = Math.hypot(mx - cx, my - cy) / (W * 0.45);
        near = Math.max(0, 1 - dd);
      }
      h.lit[i] += (base - h.lit[i]) * 0.18;
      h.hot[i] += (near - h.hot[i]) * 0.2;
      var L = Math.min(1, h.lit[i] + h.hot[i] * 0.8);
      var R = dotR * (1 + h.hot[i] * 0.35);

      /* 번지는 빛 */
      var bloom = c.createRadialGradient(cx, cy, 0, cx, cy, R * 3.2);
      bloom.addColorStop(0, rgb(col, 0.55 * L));
      bloom.addColorStop(1, rgb(col, 0));
      c.fillStyle = bloom;
      c.beginPath(); c.arc(cx, cy, R * 3.2, 0, Math.PI * 2); c.fill();
      /* LED 알 */
      var bulb = c.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
      var hiCol = mix(col, [255, 255, 255], 0.55);
      bulb.addColorStop(0, rgb(mix([70, 66, 62], hiCol, L), 1));
      bulb.addColorStop(1, rgb(mix([40, 37, 34], col, L), 1));
      c.fillStyle = bulb;
      c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
      if (Math.abs(base - h.lit[i]) > 0.002 || h.hot[i] > 0.002) alive = true;
    }
    return alive || (!reduce && h.mode !== 'progress');
  }
  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  /* ── 3) 점 격자 ─────────────────────────────── */
  var fields = [].slice.call(document.querySelectorAll('[data-dotfield]')).map(function (el) {
    var cv = document.createElement('canvas');
    cv.className = 'dotfield__cv';
    cv.setAttribute('aria-hidden', 'true');
    el.prepend(cv);
    return { el: el, cv: cv, ctx: cv.getContext('2d'), dpr: 1, w: 0, h: 0, heat: null, cols: 0, rows: 0 };
  });
  var GAP = 30;
  function sizeField(f) {
    var b = f.el.getBoundingClientRect();
    f.dpr = Math.min(devicePixelRatio || 1, 2);
    f.w = b.width; f.h = b.height;
    f.cv.width = Math.round(b.width * f.dpr); f.cv.height = Math.round(b.height * f.dpr);
    f.cols = Math.ceil(b.width / GAP) + 1; f.rows = Math.ceil(b.height / GAP) + 1;
    f.heat = new Float32Array(f.cols * f.rows);
  }
  fields.forEach(sizeField);
  addEventListener('resize', function () { fields.forEach(sizeField); wake(); });

  function drawField(f) {
    var c = f.ctx, d = f.dpr;
    c.setTransform(d, 0, 0, d, 0, 0);
    c.clearRect(0, 0, f.w, f.h);
    var b = f.el.getBoundingClientRect();
    var mx = pointer ? pointer.x - b.left : -9999, my = pointer ? pointer.y - b.top : -9999;
    var ox = (f.w - (f.cols - 1) * GAP) / 2, oy = (f.h - (f.rows - 1) * GAP) / 2;
    var alive = false, R = 150;
    for (var j = 0; j < f.rows; j++) {
      for (var i = 0; i < f.cols; i++) {
        var k = j * f.cols + i, x = ox + i * GAP, y = oy + j * GAP;
        var dd = Math.hypot(mx - x, my - y);
        var want = dd < R ? Math.pow(1 - dd / R, 1.6) : 0;
        f.heat[k] += (want - f.heat[k]) * (want > f.heat[k] ? 0.25 : 0.06);   // 켜질 땐 빠르게, 꺼질 땐 천천히
        var hv = f.heat[k];
        if (hv > 0.01) alive = true;
        var r = 1.3 + hv * 2.6;
        if (hv > 0.02) {
          c.fillStyle = rgb(current, 0.28 * hv);
          c.beginPath(); c.arc(x, y, r * 3, 0, Math.PI * 2); c.fill();
        }
        c.fillStyle = hv > 0.02 ? rgb(mix([196, 188, 180], current, hv), 0.5 + hv * 0.5) : 'rgba(150,140,132,.38)';
        c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      }
    }
    return alive;
  }

  /* ── 공용 루프 ─────────────────────────────── */
  var visibleHeads = new Set(), visibleFields = new Set();
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var set = e.target.hasAttribute('data-led9') ? visibleHeads : visibleFields;
        if (e.isIntersecting) set.add(e.target); else set.delete(e.target);
      });
      wake();
    }, { rootMargin: '80px' });
    heads.forEach(function (h) { io.observe(h.el); });
    fields.forEach(function (f) { io.observe(f.el); });
  } else {
    heads.forEach(function (h) { visibleHeads.add(h.el); });
    fields.forEach(function (f) { visibleFields.add(f.el); });
  }

  function wake() { if (!awake) { awake = true; requestAnimationFrame(loop); } }
  function loop(now) {
    current = mix(current, target, 0.06);
    var colorMoving = Math.abs(current[0] - target[0]) + Math.abs(current[1] - target[1]) + Math.abs(current[2] - target[2]) > 1;
    var more = colorMoving;
    if (glow) more = drawGlow(now) || more;
    heads.forEach(function (h) { if (visibleHeads.has(h.el)) more = drawHead(h, now) || more; });
    fields.forEach(function (f) { if (visibleFields.has(f.el)) more = drawField(f) || more; });
    if (more) requestAnimationFrame(loop); else awake = false;
  }

  addEventListener('scroll', pickSection, { passive: true });
  pickSection();
  wake();

  /* 로딩 화면이 진행도를 알려 줄 수 있게 */
  window.careclLED = {
    setProgress: function (el, p) {
      heads.forEach(function (h) { if (h.el === el) { h.progress = p; } });
      wake();
    }
  };
})();
