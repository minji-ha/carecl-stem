/* =========================================================
   careCL — 노화 신호 레이더 (설문 왼쪽 패널)
   · 5가지 노화 유형 축. 설문 답이 쌓일 때마다 모양이 자란다.
   · 값 = 그 유형을 고른 문항 수 ÷ 그 유형이 보기로 나오는 문항 수(Q1~14)
     → 숫자는 화면에 쓰지 않는다(의학적 측정처럼 읽히지 않게, 개발 화면과 같은 원칙).
   ========================================================= */
(function () {
  'use strict';

  var AXES = [
    { key: 'fine', name: '잔주름형', max: 8 },
    { key: 'sag', name: '변형·처짐형', max: 7 },
    { key: 'muscle', name: '근육형', max: 9 },
    { key: 'tired', name: '피로형', max: 9 },
    { key: 'early', name: '초기노화형', max: 7 }
  ];
  var NS = 'http://www.w3.org/2000/svg', R = 132, N = AXES.length;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var svg, cur = AXES.map(function () { return 0; }), roles = {}, raf = 0, uid = 'rd' + Math.random().toString(36).slice(2, 7);

  function el(t, a, p) {
    var e = document.createElementNS(NS, t);
    for (var k in a) e.setAttribute(k, a[k]);
    (p || svg).appendChild(e);
    return e;
  }
  function pt(i, v) { var a = -Math.PI / 2 + i * 2 * Math.PI / N; return [Math.cos(a) * R * v, Math.sin(a) * R * v]; }
  function poly(vs) { return vs.map(function (v, i) { return pt(i, v).map(function (n) { return n.toFixed(1); }).join(','); }).join(' '); }

  function draw(vals, done) {
    if (!svg) return;
    svg.innerHTML = '';
    el('defs', {}).innerHTML =
      '<radialGradient id="' + uid + 'f" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#F0A877" stop-opacity=".15"/><stop offset="1" stop-color="#C46A3A" stop-opacity=".62"/></radialGradient>' +
      '<linearGradient id="' + uid + 'l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD2B0"/><stop offset="1" stop-color="#E07B45"/></linearGradient>' +
      '<filter id="' + uid + 'g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>';
    [.25, .5, .75, 1].forEach(function (p, k) {
      el('polygon', { points: poly(AXES.map(function () { return p; })), fill: k === 3 ? 'rgba(255,255,255,.03)' : 'none',
        stroke: 'rgba(255,255,255,' + (k === 3 ? .24 : .1) + ')' });
    });
    AXES.forEach(function (a, i) { var p = pt(i, 1); el('line', { x1: 0, y1: 0, x2: p[0], y2: p[1], stroke: 'rgba(255,255,255,.1)' }); });

    var any = vals.some(function (v) { return v > 0; });
    if (any) {
      var v = vals.map(function (x) { return x > 0 ? .14 + .86 * x : .06; });
      el('polygon', { points: poly(v), fill: '#E07B45', opacity: .5, filter: 'url(#' + uid + 'g)' });
      el('polygon', { points: poly(v), fill: 'url(#' + uid + 'f)', stroke: 'url(#' + uid + 'l)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
      v.forEach(function (x, i) {
        var p = pt(i, x), role = roles[AXES[i].key];
        if (done && role) el('circle', { cx: p[0], cy: p[1], r: 6, 'class': 'rd-halo', style: 'animation-delay:' + (i * .4) + 's' });
        el('circle', { cx: p[0], cy: p[1], r: role ? 6 : 4, 'class': 'rd-dot' });
      });
    }
    AXES.forEach(function (a, i) {
      var p = pt(i, 1.17), anchor = Math.abs(p[0]) < 8 ? 'middle' : p[0] > 0 ? 'start' : 'end';
      var dy = p[1] < -100 ? -14 : p[1] > 60 ? 14 : 0, role = roles[a.key];
      var t = el('text', { x: p[0], y: p[1] + dy, 'text-anchor': anchor, 'class': 'rd-axis' + (role ? ' is-on' : '') });
      t.textContent = a.name;
      if (role) { var r = el('text', { x: p[0], y: p[1] + dy + 16, 'text-anchor': anchor, 'class': 'rd-role' }); r.textContent = role; }
    });
  }

  /* counts: { fine: 3, sag: 2, ... }  r: { fine: '대표', sag: '보조' } */
  function set(counts, r) {
    roles = r || {};
    var to = AXES.map(function (a) { return Math.min(1, ((counts || {})[a.key] || 0) / a.max); });
    var from = cur.slice(), t0 = null, dur = reduce ? 0 : 700;
    cancelAnimationFrame(raf);
    function step(t) {
      if (t0 === null) t0 = t;
      var p = dur ? Math.min(1, (t - t0) / dur) : 1, e = 1 - Math.pow(1 - p, 3);
      cur = from.map(function (f, i) { return f + (to[i] - f) * e; });
      draw(cur, p >= 1);
      if (p < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    // rAF가 멈춘 창(숨겨진 탭 등)에서도 최종 모양은 꼭 그린다
    setTimeout(function () { cancelAnimationFrame(raf); cur = to; draw(cur, true); }, dur + 80);
    var cap = document.querySelector('[data-radar-roles]');
    if (cap) {
      var keys = Object.keys(roles);
      cap.innerHTML = keys.map(function (k) {
        var a = AXES.filter(function (x) { return x.key === k; })[0];
        return a ? '<span><b>' + roles[k] + '</b>' + a.name + '</span>' : '';
      }).join('');
      cap.hidden = !keys.length;
    }
  }

  function mount(root) {
    root = root || document.querySelector('[data-radar]');
    if (!root) return;
    svg = root.querySelector('svg');
    draw(cur, false);
  }

  window.ckuRadar = { mount: mount, set: set, axes: AXES };
  mount();   // 스크립트가 본문 끝에 있어 패널은 이미 있다 — survey.js가 바로 set()을 불러도 그릴 곳이 있게 먼저 붙인다
})();
