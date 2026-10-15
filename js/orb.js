/* =========================================================
   설문 왼쪽 패널의 '살아 움직이는 구체' (시리 느낌)
   · 테두리는 여러 사인파를 겹쳐 천천히 일렁이게
   · 안쪽은 케어클 LED 색 빛덩이들이 서로 다른 속도로 돌며 겹친다 (더하기 합성)
   · 위쪽에 부드러운 하이라이트, 바깥에 은은한 빛 번짐
   화면에 보일 때만 그리고, 움직임 줄이기 설정이면 한 장만 그린다.
   ========================================================= */
(function () {
  var el = document.querySelector('[data-orb]');
  if (!el) return;
  var cv = el.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 빨강(FACE) · 보라(GLOW) · 초록(EYE) · 노랑(BODY) · 케어클 오렌지 */
  var COLORS = [[255, 70, 72], [158, 104, 255], [56, 214, 120], [255, 206, 56], [236, 122, 49], [120, 150, 255]];
  var blobs = COLORS.map(function (c, i) {
    return { c: c, a: i * 1.05, s: 0.32 + i * 0.06, r: 0.62 + 0.12 * (i % 3), ph: i * 1.7, k: 0.9 + 0.15 * (i % 2) };
  });

  var W = 0, H = 0, dpr = 1, running = false, raf = 0;
  function size() {
    var r = el.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = cv.width = Math.max(1, Math.round(r.width * dpr));
    H = cv.height = Math.max(1, Math.round(r.height * dpr));
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  function outline(cx, cy, R, t) {
    ctx.beginPath();
    for (var i = 0; i <= 120; i++) {
      var th = i / 120 * Math.PI * 2;
      var r = R * (1 + 0.018 * Math.sin(3 * th + t * 1.2) + 0.012 * Math.sin(5 * th - t * 1.6) + 0.012 * Math.sin(2 * th + t * 0.8));
      var x = cx + Math.cos(th) * r, y = cy + Math.sin(th) * r;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
  }

  function draw(t) {
    var cx = W / 2, cy = H / 2;
    var R = Math.min(W, H) * 0.34 * (1 + 0.025 * Math.sin(t * 1.1));   // 숨 쉬듯 조금씩
    ctx.clearRect(0, 0, W, H);

    /* 바깥 빛 번짐 */
    /* 바깥 빛 — 색이 천천히 다음 색으로 넘어간다, 캔버스 안에서 끝나게 */
    var f = t / 3, i0 = Math.floor(f) % blobs.length, i1 = (i0 + 1) % blobs.length, m = f - Math.floor(f);
    m = m * m * (3 - 2 * m);
    var c0 = blobs[i0].c, c1 = blobs[i1].c;
    var hue = [Math.round(c0[0] + (c1[0] - c0[0]) * m), Math.round(c0[1] + (c1[1] - c0[1]) * m), Math.round(c0[2] + (c1[2] - c0[2]) * m)];
    var g = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, Math.min(W, H) * 0.5);
    g.addColorStop(0, rgba(hue, 0.22)); g.addColorStop(1, rgba(hue, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    ctx.save();
    outline(cx, cy, R, t);
    ctx.fillStyle = '#120E18'; ctx.fill();
    ctx.clip();

    /* 안쪽 빛덩이 */
    ctx.globalCompositeOperation = 'lighter';
    blobs.forEach(function (b) {
      var ang = b.a + t * b.s;
      var ox = cx + Math.cos(ang) * R * 0.5 * Math.sin(t * 0.5 + b.ph);
      var oy = cy + Math.sin(ang * b.k) * R * 0.5;
      var rr = R * b.r;
      var gg = ctx.createRadialGradient(ox, oy, 0, ox, oy, rr);
      gg.addColorStop(0, rgba(b.c, 0.55)); gg.addColorStop(0.55, rgba(b.c, 0.2)); gg.addColorStop(1, rgba(b.c, 0));
      ctx.fillStyle = gg; ctx.fillRect(ox - rr, oy - rr, rr * 2, rr * 2);
    });

    /* 가장자리를 살짝 어둡게 → 구처럼 보이게 */
    ctx.globalCompositeOperation = 'source-over';
    var edge = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R * 1.05);
    edge.addColorStop(0, 'rgba(10,8,14,0)'); edge.addColorStop(1, 'rgba(10,8,14,.55)');
    ctx.fillStyle = edge; ctx.fillRect(0, 0, W, H);

    /* 위쪽 하이라이트 */
    var hl = ctx.createRadialGradient(cx - R * 0.28, cy - R * 0.42, 0, cx - R * 0.28, cy - R * 0.42, R * 0.75);
    hl.addColorStop(0, 'rgba(255,255,255,.3)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl; ctx.fillRect(0, 0, W, H);
    ctx.restore();

    /* 얇은 테두리 빛 */
    outline(cx, cy, R, t);
    ctx.lineWidth = 1.2 * dpr; ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.stroke();
  }

  function loop(ms) { draw(ms / 1000); raf = running ? requestAnimationFrame(loop) : 0; }
  function start() { if (!running && !reduce) { running = true; raf = requestAnimationFrame(loop); } }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  size(); draw(0);
  addEventListener('resize', function () { size(); if (!running) draw(0); });
  if (reduce) return;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }).observe(el);
  } else start();
})();
