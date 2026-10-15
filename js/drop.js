/* =========================================================
   careCL 물방울 — 메타볼 + 임계값 윤곽
   · 원 여러 개가 만드는 밀도장을 임계값으로 잘라, 뭉쳤다 떨어지는
     유기적인 실루엣을 만든다.
   · 임계값 주변의 좁은 띠만 선으로 칠하고, 같은 밀도장을 좌상단으로
     살짝 밀어 한 겹 더 그려 유리 뒷면이 비치는 것처럼 보이게 한다.

   사용:  <div class="drop" data-drop>
            <canvas class="drop__canvas"></canvas> …
          </div>
   옵션(data-*): drop-rim / drop-fill / drop-tint (rgba 문자열), drop-balls (개수)
   ========================================================= */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rgba(str, fb) {
    var m = String(str || '').match(/rgba?\(([^)]+)\)/);
    if (!m) return fb;
    var p = m[1].split(',').map(parseFloat);
    return [p[0] | 0, p[1] | 0, p[2] | 0, p.length > 3 ? p[3] : 1];
  }

  function Drop(root) {
    var cv = root.querySelector('canvas');
    if (!cv) return;
    var ctx = cv.getContext('2d');

    /* 내부 해상도는 작게 잡고 CSS로 확대 — 가장자리가 부드럽고 가볍다 */
    var RES = parseInt(root.dataset.dropRes || '220', 10);
    cv.width = cv.height = RES;

    var RIM  = rgba(root.dataset.dropRim,  [51, 27, 15, 0.40]);     // 바깥 윤곽
    var FILL = rgba(root.dataset.dropFill, [255, 255, 255, 0.10]);  // 안쪽 (거의 투명)
    var TINT = rgba(root.dataset.dropTint, [235, 199, 179, 0.10]);  // 아래쪽 옅은 색
    var N    = parseInt(root.dataset.dropBalls || '5', 10);

    var T = 1.0, BAND = 0.16;              // 바깥 윤곽
    var T_IN = 1.16, BAND_IN = 0.10;       // 안쪽 윤곽 (유리 두께)
    var OX = -0.022 * RES, OY = -0.032 * RES;

    var img = ctx.createImageData(RES, RES);
    var data = img.data;

    /* S로 전체를 줄여 가장 멀리 나간 방울도 캔버스 안(약 93%)에 머물게 한다 */
    var S = 0.86, balls = [];
    for (var i = 0; i < N; i++) {
      balls.push({
        r:  (i === 0 ? 0.30 : 0.155 + 0.05 * Math.sin(i * 2.1)) * RES * S,
        d:  (i === 0 ? 0 : 0.10 + 0.055 * ((i * 7) % 3)) * RES * S,
        a0: i * (Math.PI * 2 / Math.max(N - 1, 1)),
        sp: (i % 2 ? 1 : -1) * (0.10 + 0.045 * i),
        bob: 0.012 + 0.007 * i
      });
    }

    /* 마우스를 아주 약하게 따라온다 */
    var mx = 0, my = 0, tx = 0, ty = 0;
    root.addEventListener('pointermove', function (e) {
      var b = root.getBoundingClientRect();
      tx = ((e.clientX - b.left) / b.width - 0.5) * 0.09 * RES;
      ty = ((e.clientY - b.top) / b.height - 0.5) * 0.09 * RES;
    });
    root.addEventListener('pointerleave', function () { tx = ty = 0; });

    /* 화면 밖에 있으면 계산을 멈춘다 */
    var visible = true, running = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible && !running && !reduce) { running = true; requestAnimationFrame(frame); }
      }, { rootMargin: '120px' }).observe(root);
    }

    function draw(time) {
      mx += (tx - mx) * 0.06;
      my += (ty - my) * 0.06;

      var cxs = [], cys = [], r2s = [];
      for (var i = 0; i < balls.length; i++) {
        var b = balls[i];
        var ang = b.a0 + time * b.sp;
        var dist = b.d * (1 + Math.sin(time * (0.5 + i * 0.21) + i) * b.bob * 6);
        cxs[i] = RES / 2 + Math.cos(ang) * dist + mx * (i ? 1 : 0.5);
        cys[i] = RES / 2 + Math.sin(ang) * dist + my * (i ? 1 : 0.5);
        var r = b.r * (1 + Math.sin(time * (0.7 + i * 0.17)) * 0.035);
        r2s[i] = r * r;
      }

      var p = 0, nb = cxs.length;
      for (var y = 0; y < RES; y++) {
        for (var x = 0; x < RES; x++) {
          var f = 0, fi = 0, xi = x + OX, yi = y + OY;
          for (var k = 0; k < nb; k++) {
            var dx = x - cxs[k], dy = y - cys[k];
            f += r2s[k] / (dx * dx + dy * dy + 1);
            var dxi = xi - cxs[k], dyi = yi - cys[k];
            fi += r2s[k] / (dxi * dxi + dyi * dyi + 1);
          }

          var a = 0, cr = 255, cg = 255, cb = 255;

          if (f >= T) {
            /* 안쪽 — 배경이 비치고 좌상단에만 옅은 빛이 고인다 */
            var hx = (x - RES * 0.36) / (RES * 0.26);
            var hy = (y - RES * 0.28) / (RES * 0.22);
            var hl = Math.max(0, 1 - (hx * hx + hy * hy));
            var dn = y / RES;

            cr = FILL[0]; cg = FILL[1]; cb = FILL[2];
            a = FILL[3] + hl * hl * 0.46;

            var tw = TINT[3] * dn * dn;
            cr = cr * (1 - tw) + TINT[0] * tw;
            cg = cg * (1 - tw) + TINT[1] * tw;
            cb = cb * (1 - tw) + TINT[2] * tw;

            /* 안쪽 윤곽 — 유리 뒷면 */
            var din = Math.abs(fi - T_IN);
            if (din < BAND_IN) {
              var wi = (1 - din / BAND_IN) * RIM[3] * 0.62;
              cr = cr * (1 - wi) + RIM[0] * wi;
              cg = cg * (1 - wi) + RIM[1] * wi;
              cb = cb * (1 - wi) + RIM[2] * wi;
              a = Math.max(a, wi);
            }
          }

          /* 바깥 윤곽 — 임계값을 가운데 두고 양옆으로 부드럽게 사라진다 */
          var d0 = Math.abs(f - T);
          if (d0 < BAND) {
            var w = 1 - d0 / BAND;
            w = w * w * RIM[3];
            cr = cr * (1 - w) + RIM[0] * w;
            cg = cg * (1 - w) + RIM[1] * w;
            cb = cb * (1 - w) + RIM[2] * w;
            a = Math.max(a, w);
          }

          data[p] = cr; data[p + 1] = cg; data[p + 2] = cb; data[p + 3] = a * 255;
          p += 4;
        }
      }
      ctx.putImageData(img, 0, 0);
    }

    /* 움직임이 느려 초당 30프레임이면 충분하다 — 계산량을 절반으로 */
    var lastT = -1e9, STEP = 1000 / 30;
    function frame(t) {
      t = t || 0;
      if (t - lastT >= STEP) { lastT = t; draw(t * 0.001); }
      if (visible && !reduce) requestAnimationFrame(frame);
      else running = false;
    }

    draw(0);
    if (!reduce) { running = true; requestAnimationFrame(frame); }
  }

  window.careclDrop = Drop;
  document.querySelectorAll('[data-drop]').forEach(Drop);
})();
