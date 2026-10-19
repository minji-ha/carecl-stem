/* =========================================================
   careCL — 유리 물방울 (수정요청 261019)
   · [data-bubble="logo"]  : 네 가지 기준 가운데. 화면에 들어오면 흩어진 물방울들이 모여 하나가 되고 careCL 로고가 떠오른다
   · [data-bubble="steps"] : 데일리 루틴. 스크롤을 따라 단계 사이를 옮겨 다니며 흩어졌다 다시 뭉치고, 안의 사진이 바뀐다

   방식: 레이마칭 SDF 메타볼 — 화면 한 장(사각형)을 그리고 픽셀마다 광선을 쏘아
         구 여러 개를 부드럽게 이은 거리장(smooth-min)의 표면을 찾는다. 메시를 만들지 않으므로
         방울이 갈라지고 붙는 모양이 해상도 걱정 없이 매끈하다.
   재질: 직접 꾸민 창 있는 방을 구운 환경 큐브맵 반사·굴절 + 프레넬 윤곽 + 빛 반짝임 + 얇은 무지개빛.
   내용: 표면에서 굴절된 광선이 물방울 안쪽 평면에 닿는 곳의 로고/사진을 읽는다 → 렌즈처럼 휘어 보인다.
   ========================================================= */
import * as THREE from 'three';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NB = 14;

const VERT = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const FRAG = /* glsl */`
precision highp float;
#define NB ${NB}
varying vec2 vUv;
uniform vec2 uView;            // (가로/세로, 1) — 세로 반폭이 월드 1
uniform float uPx;             // 픽셀 하나의 월드 크기 (가장자리 계단 없애기)
uniform vec4 uBall[NB];        // xyz = 중심, w = 반지름 (0이면 꺼짐)
uniform vec4 uBound;           // 모든 방울을 감싸는 구 — 밖의 픽셀은 바로 건너뛴다
uniform float uK, uTime, uWob;
uniform samplerCube uEnv;
uniform sampler2D uTexA, uTexB;
uniform float uMix, uTexAlpha;
uniform vec4 uTexRect;         // 안쪽 평면의 그림 위치: xy 중심, zw 반폭
uniform float uTexZ, uRot, uGlass;

float smin(float a, float b, float k){ float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }
float map(vec3 p){
  float d = 1e3;
  for (int i = 0; i < NB; i++) {
    vec4 b = uBall[i];
    if (b.w > 0.0) d = smin(d, length(p - b.xyz) - b.w, uK);
  }
  // 아주 옅은 표면 일렁임
  d += sin(p.x * 7.0 + uTime * 0.9) * sin(p.y * 6.3 - uTime * 0.7) * sin(p.z * 5.0 + uTime * 0.5) * 0.005 * uWob;
  return d;
}
vec3 nrm(vec3 p){
  const vec2 e = vec2(0.0015, -0.0015);
  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
}
float band(float x, float c, float w){ return 1.0 - smoothstep(w * 0.4, w, abs(x - c)); }
float spec(vec3 n, vec3 v, vec3 l, float pw){ return pow(max(dot(n, normalize(v + l)), 0.0), pw); }

void main(){
  vec2 p = (vUv * 2.0 - 1.0) * uView;
  vec3 ro = vec3(0.0, 0.0, 5.0), rd = normalize(vec3(p, -5.0));
  vec3 oc = ro - uBound.xyz;
  float b = dot(oc, rd), h = b * b - (dot(oc, oc) - uBound.w * uBound.w);
  if (h < 0.0) { gl_FragColor = vec4(0.0); return; }
  h = sqrt(h);
  float t = max(-b - h, 0.0), tEnd = -b + h;
  float dm = 1e3, tm = t; bool hit = false;
  for (int i = 0; i < 72; i++) {
    float d = map(ro + rd * t);
    if (d < dm) { dm = d; tm = t; }
    if (d < 0.0004) { hit = true; break; }
    t += d * 0.92;
    if (t > tEnd) break;
  }
  float cov = 1.0;
  if (!hit) {                                   // 비껴간 광선도 표면에 아주 가까웠으면 부드러운 가장자리로
    float aa = uPx * 1.4;
    if (dm > aa) { gl_FragColor = vec4(0.0); return; }
    cov = 1.0 - dm / aa; t = tm;
  }
  vec3 P = ro + rd * t, n = nrm(P), v = -rd;
  float ndv = clamp(dot(n, v), 0.0, 1.0);
  float fr = pow(1.0 - ndv, 1.6);
  float rim = smoothstep(0.05, 0.85, fr);
  float outer = band(fr, 0.88, 0.08);
  float inner = band(fr, 0.58, 0.06) * smoothstep(-0.9, 0.2, -n.y);

  vec3 refl = textureCube(uEnv, reflect(rd, n)).rgb;
  vec3 refr = textureCube(uEnv, normalize(refract(rd, n, 0.76) + n * 0.2)).rgb;
  vec3 env = clamp((mix(refr, refl, fr) - 0.5) * 1.8 + 0.5, 0.0, 1.0);
  float lum = dot(env, vec3(0.299, 0.587, 0.114));
  float envDark = smoothstep(0.45, 0.95, 1.0 - lum), envBright = smoothstep(0.55, 1.0, lum);
  float g = spec(n, v, normalize(vec3(-0.55, 0.8, 0.75)), 80.0) * 0.9
          + spec(n, v, normalize(vec3(0.65, -0.25, 0.85)), 30.0) * 0.16
          + spec(n, v, normalize(vec3(-0.2 + sin(uTime * 0.35) * 0.1, 0.3, 0.95)), 200.0) * 0.6;
  vec3 irid = 0.55 + 0.45 * cos(6.2831 * (fr * 1.2 + vec3(0.0, 0.33, 0.67)) + uTime * 0.2);

  // 비눗방울: 거의 투명한 막 + 방 풍경(창·조명)이 옅게 비침 + 가장자리 연보라 띠와 흰 안쪽 선
  float lr = dot(textureCube(uEnv, reflect(rd, n)).rgb, vec3(0.299, 0.587, 0.114));
  float win = smoothstep(0.40, 0.75, lr);                              // 밝은 창
  float edgeBand = smoothstep(0.35, 0.95, fr);                         // 가장자리 쪽 넓은 띠
  vec3 lav = vec3(0.68, 0.68, 0.86);
  vec3 col = mix(vec3(0.55, 0.55, 0.68), vec3(1.0), win);
  col = mix(col, lav, edgeBand * 0.6 + outer * 0.8);
  col = mix(col, irid, edgeBand * 0.25);
  col = mix(col, vec3(1.0), band(fr, 0.70, 0.05) * 0.8);               // 흰 안쪽 선
  col += vec3(1.0) * g * 0.7;
  float ga = (1.0 - win) * 0.14 * (0.3 + fr) + win * 0.03 * fr
           + edgeBand * 0.12 + outer * 0.34 + inner * 0.10 + band(fr, 0.70, 0.05) * 0.10 + g * 0.35;
  ga = clamp(ga * uGlass, 0.0, 1.0);

  // 굴절 광선이 안쪽 평면에 닿는 자리의 그림
  vec3 r = refract(rd, n, 0.8);
  vec3 q = P + r * ((uTexZ - P.z) / min(r.z, -0.05));
  vec2 o = q.xy - uTexRect.xy;
  o = mat2(cos(uRot), sin(uRot), -sin(uRot), cos(uRot)) * o;     // 제품이 비스듬히 떠 있다
  vec2 uv = o / (2.0 * uTexRect.zw) + 0.5;
  float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  vec4 tc = mix(texture2D(uTexA, uv), texture2D(uTexB, uv), uMix);
  float ca = tc.a * uTexAlpha * inside * (1.0 - fr * 0.85);

  vec3 outc = clamp(col, 0.0, 1.0) * ga + tc.rgb * ca * (1.0 - ga);
  float oa = ga + ca * (1.0 - ga);
  gl_FragColor = vec4(outc, oa) * cov;          // premultiplied
}`;

/* ── 공용 ── */
const envCache = new WeakMap();      // 텍스처는 만든 렌더러(WebGL 컨텍스트) 안에서만 쓸 수 있다 → 렌더러마다 따로 굽는다
function getEnv(renderer) {
  if (envCache.has(renderer)) return envCache.get(renderer);
  // 우리가 직접 꾸민 '창이 있는 밝은 방' — 물방울 겉면에 창틀 모양 반사가 비치게 한다
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(12, 7, 12), new THREE.MeshBasicMaterial({ color: 0x9a99a8, side: THREE.BackSide })));
  const glow = (c) => { const m = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }); m.color.setScalar(c); return m; };
  // 창 하나 = 칸 2×2 (칸 사이는 벽색이 남아 창틀이 된다)
  function windowAt(pos, rotY, w, h, c) {
    const g = new THREE.Group();
    const pw = (w - 0.12) / 2, ph = (h - 0.12) / 2;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, j]) => {
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), glow(c));
      pane.position.set(i * (pw / 2 + 0.06), j * (ph / 2 + 0.06), 0);
      g.add(pane);
    });
    g.position.set(...pos); g.rotation.y = rotY; scene.add(g);
  }
  windowAt([-2.2, 1.2, 5.9], Math.PI, 3.2, 2.6, 2.6);     // 보는 사람 뒤쪽 왼편 큰 창 (가운데에 비친다)
  windowAt([2.6, 0.6, 5.9], Math.PI, 1.6, 2.2, 1.8);      // 뒤쪽 오른편 작은 창
  windowAt([-5.9, 0.8, 0], Math.PI / 2, 3.4, 2.4, 2.2);   // 왼쪽 벽 창 (오른쪽 가장자리에 비친다)
  windowAt([5.9, 0.2, -1.5], -Math.PI / 2, 2.4, 2.0, 1.6);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(5, 3), glow(1.6)); top.rotation.x = Math.PI / 2; top.position.set(0, 3.4, 1); scene.add(top);
  const rt = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
  new THREE.CubeCamera(0.1, 100, rt).update(renderer, scene);
  scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  envCache.set(renderer, rt.texture);
  return rt.texture;
}
const blank = new THREE.DataTexture(new Uint8Array(4), 1, 1); blank.needsUpdate = true;

function canvasTex(c) { const t = new THREE.CanvasTexture(c); t.anisotropy = 4; t.minFilter = THREE.LinearFilter; return t; }

function logoTexture(svgEl) {
  return new Promise((res) => {
    const src = svgEl.outerHTML.replace(/currentColor/g, '#331B0F');
    const vb = (svgEl.getAttribute('viewBox') || '0 0 538.82 132.97').split(/\s+/).map(Number);
    const W = 1024, H = Math.round(W * vb[3] / vb[2]);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      c.getContext('2d').drawImage(img, 0, 0, W, H);
      res({ tex: canvasTex(c), aspect: H / W });
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      src.includes('xmlns=') ? src : src.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'));
  });
}

function photoTexture(url) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const S = 768, c = document.createElement('canvas'); c.width = c.height = S;
      const g = c.getContext('2d');
      const k = Math.max(S / img.naturalWidth, S / img.naturalHeight);
      const w = img.naturalWidth * k, h = img.naturalHeight * k;
      g.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
      g.globalCompositeOperation = 'destination-in';
      const r = g.createRadialGradient(S / 2, S / 2, S * 0.36, S / 2, S / 2, S * 0.5);
      r.addColorStop(0, 'rgba(0,0,0,1)'); r.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = r; g.fillRect(0, 0, S, S);
      res(canvasTex(c));
    };
    img.onerror = () => res(blank);
    img.src = url;
  });
}

function cutTexture(url) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const S = 1024, c = document.createElement('canvas'); c.width = c.height = S;
      const k = Math.min(S / img.naturalWidth, S / img.naturalHeight);
      const w = img.naturalWidth * k, h = img.naturalHeight * k;
      c.getContext('2d').drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
      res(canvasTex(c));
    };
    img.onerror = () => res(blank);
    img.src = url;
  });
}

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ease = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const ease5 = (x) => { x = clamp(x, 0, 1); return x * x * x * (x * (6 * x - 15) + 10); };
const lerp = (a, b, k) => a + (b - a) * k;

/* 화면 한 장짜리 렌더러 + 셰이더. balls는 [x,y,z,r] 배열 */
function stage(host, dprMax) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dprMax));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);
  const balls = []; for (let i = 0; i < NB; i++) balls.push(new THREE.Vector4());
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false,
    uniforms: {
      uView: { value: new THREE.Vector2(1, 1) }, uPx: { value: 0.004 },
      uBall: { value: balls }, uBound: { value: new THREE.Vector4(0, 0, 0, 0) },
      uK: { value: 0.1 }, uTime: { value: 0 }, uWob: { value: 1 },
      uEnv: { value: getEnv(renderer) },
      uTexA: { value: blank }, uTexB: { value: blank }, uMix: { value: 0 }, uTexAlpha: { value: 0 },
      uTexRect: { value: new THREE.Vector4(0, 0, 0.3, 0.3) }, uTexZ: { value: -0.1 }, uRot: { value: 0 }, uGlass: { value: 1 }
    }
  });
  const scene = new THREE.Scene();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); quad.frustumCulled = false; scene.add(quad);
  const cam = new THREE.Camera();
  const U = mat.uniforms;
  const S = { W: 1, H: 1, renderer, U };
  S.resize = () => {
    const w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight;
    if (!w || !h) return false;
    if (w !== S.W || h !== S.H) {
      renderer.setSize(w, h, false);
      S.W = w; S.H = h;
      U.uView.value.set(w / h, 1);
      U.uPx.value = 2 / (h * renderer.getPixelRatio());
    }
    return true;
  };
  // 월드 단위 = 캔버스 세로 반폭. px → 월드
  S.w = (px) => px / (S.H / 2);
  S.set = (list, core) => {
    let R = 0;
    for (let i = 0; i < NB; i++) {
      const b = list[i];
      if (b && b[3] > 0.0005) {
        balls[i].set(b[0], b[1], b[2], b[3]);
        R = Math.max(R, Math.hypot(b[0] - core[0], b[1] - core[1], b[2] - core[2]) + b[3]);
      } else balls[i].set(0, 0, 0, 0);
    }
    U.uBound.value.set(core[0], core[1], core[2], R > 0 ? R + U.uK.value + 0.02 : 0);
  };
  S.draw = () => renderer.render(scene, cam);
  return S;
}

/* 마우스 위치 (화면 좌표) — 물방울이 그쪽으로 살짝 부푼다 */
const mouse = { x: -1e4, y: -1e4 };
if (matchMedia('(hover: hover)').matches && !reduce) {
  addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
}

/* 안에서 천천히 도는 덩어리 3개 — 표면을 일렁이게 한다 */
function lumps(out, c, R, t, k) {
  [[0.31, 0.7, 0.55], [0.23, 2.6, 0.5], [0.19, 4.4, 0.52]].forEach(([sp, ph, rr]) => {
    const a = t * sp + ph, el = Math.sin(t * sp * 0.8 + ph) * 0.8;
    out.push([c[0] + Math.cos(a) * Math.cos(el) * R * 0.42, c[1] + Math.sin(el) * R * 0.42,
      c[2] + Math.sin(a) * Math.cos(el) * R * 0.3, R * rr * k]);
  });
}
/* 옆구리의 작은 방울 — 천천히 돌며 본체에 붙었다(목이 생겼다) 살짝 떨어졌다 한다 */
function tail(out, c, R, t, k) {
  if (k <= 0.01) return;
  const a = -0.35 + Math.sin(t * 0.21) * 0.5, d = R * (1.12 + Math.sin(t * 0.37) * 0.08);
  out.push([c[0] + Math.cos(a) * d, c[1] + Math.sin(a) * d, c[2] + R * 0.05, R * 0.3 * k]);
}
/* 마우스 쪽 혹 */
function hoverBall(S, c, R, st) {
  const rc = S.renderer.domElement.getBoundingClientRect();
  const hx = S.w(mouse.x - rc.left) - S.W / S.H, hy = 1 - S.w(mouse.y - rc.top);
  const dx = hx - c[0], dy = hy - c[1], d = Math.hypot(dx, dy);
  const on = d < R * 1.9 ? 1 : 0;
  st.s += (on - st.s) * 0.08;
  if (d > 1e-4 && on) { st.x += (dx / d - st.x) * 0.1; st.y += (dy / d - st.y) * 0.1; }
  if (st.s < 0.01) return null;
  const reach = clamp(d / R, 0.6, 1.25);
  return [c[0] + st.x * R * 0.5 * reach, c[1] + st.y * R * 0.5 * reach, c[2] + R * 0.1, R * 0.42 * st.s];
}

function runWhenVisible(el, draw, margin) {
  let vis = false, raf = 0;
  const loop = (now) => { raf = 0; if (!vis) return; draw(now); raf = requestAnimationFrame(loop); };
  new IntersectionObserver((es) => { vis = es[0].isIntersecting; if (vis && !raf) raf = requestAnimationFrame(loop); }, { rootMargin: margin }).observe(el);
}

/* ── 1. 네 가지 기준 — 흩어진 물방울이 모여 하나가 되고 로고가 떠오른다 ── */
const SEEDS = [ // 처음 자리 x, y (월드) · 크기
  [-0.80, 0.40, 0.11], [-0.60, -0.52, 0.08], [-0.24, 0.80, 0.06], [0.36, 0.72, 0.09], [0.84, 0.28, 0.07],
  [0.70, -0.56, 0.10], [0.18, -0.84, 0.05], [-0.92, -0.06, 0.06], [0.96, -0.12, 0.045], [-0.40, -0.86, 0.05]
];
function mountLogo(host) {
  const S = stage(host, 1.75);
  S.renderer.domElement.classList.add('bubble__gl--wide');
  const U = S.U;
  let t0 = -1, logoAspect = 0.25;
  const hov = { s: 0, x: 1, y: 0 };
  const svg = host.querySelector('svg') || document.querySelector('.header__logo svg');
  if (svg) logoTexture(svg).then(({ tex, aspect }) => { U.uTexA.value = U.uTexB.value = tex; logoAspect = aspect; });

  new IntersectionObserver((es) => {
    if (es[0].isIntersecting && t0 < 0) { t0 = performance.now(); host.classList.add('is-ready'); }
  }, { threshold: 0.35 }).observe(host);

  function frame(now) {
    if (!S.resize()) return;
    const t = now / 1000, T = t0 < 0 ? -1 : reduce ? 9 : (now - t0) / 1000;
    const R = S.w(host.clientWidth * 0.4), k = R / 0.33;
    U.uK.value = R * (T > 3.5 ? lerp(0.55, 0.26, ease(T - 3.5)) : 0.55); U.uTime.value = t; U.uWob.value = reduce ? 0 : 1;
    const core = [0, 0, 0], list = [];
    if (T >= 0) {
      const cg = ease((T - 0.9) / 2.6);                        // 가운데 방울이 자라는 정도
      const pulse = T > 3.4 ? Math.sin((T - 3.4) * 7) * Math.exp(-(T - 3.4) * 2.4) * 0.05 : 0;
      list.push([0, 0, 0, R * cg * (1 + pulse)]);
      SEEDS.forEach(([x, y, s], i) => {
        const grow = ease((T - i * 0.07) / 0.8);
        const c = ease5((T - 0.5 - (i % 5) * 0.12) / 2.6);
        const drift = 0.02 * (1 - c);
        list.push([lerp(x * k, 0, c) + Math.sin(t * 0.75 + i * 1.9) * drift, lerp(y * k, 0, c) + Math.cos(t * 0.62 + i * 1.3) * drift,
          lerp(0.04 * ((i % 5) - 2), 0, c), s * k * grow * (1 - ease((c - 0.82) / 0.18))]);
      });
      if (cg > 0.98) {                                          // 다 모인 뒤에는 표면이 일렁이고 마우스 쪽으로 부푼다
        list.length = 1;
        lumps(list, core, R, t, 1);
        tail(list, core, R, t, 1);
        const hb = hoverBall(S, core, R, hov); if (hb) list.push(hb);
      }
      U.uTexAlpha.value = ease((T - 2.3) / 1.0);
    }
    S.set(list, core);
    U.uTexRect.value.set(0, 0, R * 0.56, R * 0.56 * logoAspect);
    U.uTexZ.value = -R * 0.3;
    S.draw();
  }
  runWhenVisible(host, frame, '200px');
}

/* ── 2. 데일리 루틴 — 스크롤 따라 단계 사이를 옮겨 다니며 흩어졌다 뭉치고, 사진이 바뀐다 ── */
const SAT = [ // 이동 중에 떨어져 나가는 작은 방울: [늦게 출발하는 정도, 옆으로 퍼짐, 깊이, 크기]
  [0.00, 0.9, 0.2, 0.34], [0.10, -0.7, -0.3, 0.28], [0.22, 0.4, 0.4, 0.22], [0.30, -1.1, 0.1, 0.20],
  [0.05, -0.2, -0.5, 0.26], [0.16, 1.2, -0.2, 0.18], [0.36, 0.1, 0.3, 0.16], [0.26, -0.5, 0.5, 0.15]
];
function mountSteps(host) {
  const items = [].slice.call(document.querySelectorAll('[data-step]'));
  if (!items.length) return;
  const S = stage(host, 1.4);
  const U = S.U;
  const hov = { s: 0, x: 1, y: 0 };
  const tex = items.map(() => blank);
  items.forEach((el, i) => (el.dataset.stepCut ? cutTexture(el.dataset.stepCut) : photoTexture(el.dataset.stepSrc)).then((t) => { tex[i] = t; host.classList.add('is-ready'); }));
  const last = items.length - 1;

  function progress() {                       // 0 ~ 마지막 단계, 소수 = 단계 사이를 지나는 중
    const mid = innerHeight * 0.5;
    const c = items.map((el) => { const r = el.getBoundingClientRect(); return r.top + r.height / 2; });
    if (c[0] >= mid) return 0;
    if (c[last] <= mid) return last;
    for (let k = 0; k < last; k++) if (c[k + 1] >= mid) return k + (mid - c[k]) / Math.max(c[k + 1] - c[k], 1);
    return last;
  }
  const spot = (k) => {                       // 단계별 자리: 글 반대편 (stem.js의 is-right와 같은 규칙)
    const x = (k % 2 ? -1 : 1) * innerWidth * 0.24;
    const y = k === last ? innerHeight * 0.05 : 0;
    const r = Math.min(innerWidth * 0.17, 250, innerHeight * 0.31) * (k === last ? 0.94 : 1);
    return [S.w(x), S.w(y), S.w(r)];
  };

  function frame(now) {
    if (!S.resize()) return;
    const t = now / 1000, f = progress();
    const k = Math.min(Math.floor(f), last - 1), raw = f - k;
    const tt = ease5((raw - 0.15) / 0.7);     // 단계 사이 가운데 70% 구간에서 이동
    const sc = reduce ? 0 : Math.sin(tt * Math.PI);  // 흩어짐 0 → 1 → 0
    const a = spot(k), b = spot(k + 1);
    const R = lerp(a[2], b[2], tt);
    const core = [lerp(a[0], b[0], tt), lerp(a[1], b[1], tt), 0];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const nx = dx / len, ny = dy / len;
    U.uK.value = R * (0.26 + 0.24 * sc); U.uTime.value = t; U.uWob.value = reduce ? 0 : 1 + sc;

    const list = [[core[0], core[1], 0, R * (1 - 0.42 * sc)]];
    if (sc > 0.002) SAT.forEach(([lag, side, depth, size], i) => {
      const e = ease5((raw - 0.15 - lag * 0.5) / 0.7);          // 늦게 출발한 방울은 뒤처져 따라온다
      const px = lerp(a[0], b[0], e), py = lerp(a[1], b[1], e);
      const wob = Math.sin(t * 1.3 + i * 2.1) * 0.15;
      list.push([px - ny * side * R * 0.8 * sc + nx * wob * R * sc, py + nx * side * R * 0.8 * sc + Math.sin(t + i) * R * 0.1 * sc,
        depth * R * sc, R * size * Math.sqrt(sc)]);
    });
    lumps(list, core, R * (1 - 0.3 * sc), t, 1 - sc);
    tail(list, core, R, t, 1 - ease(sc / 0.3));
    const hb = hoverBall(S, core, R, hov); if (hb && sc < 0.2) list.push(hb);
    S.set(list, core);

    // 사진: 흩어지는 동안 흐려졌다가 가운데에서 다음 단계 사진으로 바뀐다
    U.uTexA.value = tex[k]; U.uTexB.value = tex[k + 1];
    U.uMix.value = ease((tt - 0.42) / 0.16);
    U.uTexAlpha.value = 1 - 0.92 * ease(sc / 0.6);
    // 제품: 물방울 지름의 약 절반 높이, 천천히 떠다니며 비스듬히 기운다
    const bob = reduce ? 0 : Math.sin(t * 0.8) * R * 0.03;
    U.uTexRect.value.set(core[0], core[1] + bob, R * 0.58, R * 0.58);
    U.uRot.value = reduce ? -0.2 : -0.2 + Math.sin(t * 0.45) * 0.06 + (tt - 0.5) * sc * 0.6;
    U.uTexZ.value = -R * 0.2;
    S.draw();
  }
  runWhenVisible(host, frame, '200px');
}

document.querySelectorAll('[data-bubble]').forEach((el) => {
  try { (el.dataset.bubble === 'logo' ? mountLogo : mountSteps)(el); }
  catch (e) { el.classList.add('is-fallback'); console.error(e); }
});
