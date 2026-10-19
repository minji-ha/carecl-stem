/* =========================================================
   careCL — 유리 물방울 (수정요청 261019, STEM 물방울 참고)
   · [data-bubble="logo"]  : 물방울 속에 careCL 로고 (네 가지 기준 가운데)
   · [data-bubble="steps"] : 물방울 속에 단계 사진 — stem.js가 보내는 'stepchange'로 바뀐다 (데일리 루틴)
   물방울 = 환경 큐브맵 반사·굴절 + 프레넬 윤곽 + 빛 반짝임. 표면을 떠다니는 혹들이 실루엣을 일렁이게 하고,
   사진이 바뀔 때 한 번 크게 출렁인다.
   ========================================================= */
import * as THREE from 'three';
import { RoomEnvironment } from '../libs/three/addons/environments/RoomEnvironment.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── 유리 셰이더 ───────────────────────────────────────────
   실루엣: 구 표면 위를 천천히 떠다니는 부드러운 혹 4개(메타볼처럼)가 겉면을 밀어 일렁이게 한다.
           법선은 이웃 두 점을 같은 식으로 밀어 다시 구한다 → 빛과 반사도 실루엣을 따라 휜다.
   재질:   프레넬(가장자리일수록 진함) + 환경 큐브맵 반사·굴절 + 얇은 바깥선/아래쪽 안쪽선 + 빛 반짝임 3개.
           앞면·뒷면을 한 메시(DoubleSide)로 그리고, 뒷면은 옅은 안쪽 윤곽만 남긴다. */
const VERT = /* glsl */`
uniform float uTime, uAmp;
uniform vec4 uBulge[4];              // xyz = 혹이 있는 방향, w = 세기
varying vec3 vN; varying vec3 vV;
vec3 disp(vec3 p){
  float d = 0.0;
  for (int k = 0; k < 4; k++) d += uBulge[k].w * exp((dot(p, uBulge[k].xyz) - 1.0) * 3.2);
  d += (sin(p.x * 4.1 + uTime * 0.9) * sin(p.y * 3.7 - uTime * 0.7) * 0.010
      + sin(p.z * 3.3 + p.x * 1.9 + uTime * 0.6) * 0.008) * uAmp;
  return p * (1.0 + d);
}
void main(){
  vec3 p = normalize(position);
  vec3 t1 = normalize(cross(p, abs(p.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0)));
  vec3 t2 = cross(p, t1);
  vec3 P = disp(p);
  vec3 Pa = disp(normalize(p + t1 * 0.012)), Pb = disp(normalize(p + t2 * 0.012));
  vec3 nrm = normalize(cross(Pa - P, Pb - P));
  if (dot(nrm, p) < 0.0) nrm = -nrm;
  vec4 mv = modelViewMatrix * vec4(P, 1.0);
  vN = normalize(normalMatrix * nrm);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */`
uniform float uTime;
uniform samplerCube uEnv;
varying vec3 vN; varying vec3 vV;
float band(float x, float c, float w){ return 1.0 - smoothstep(w * 0.4, w, abs(x - c)); }
float spec(vec3 n, vec3 v, vec3 l, float pw){ return pow(max(dot(n, normalize(v + l)), 0.0), pw); }
void main(){
  vec3 v = normalize(vV);
  vec3 n = normalize(vN);
  bool front = gl_FrontFacing;
  if (!front) n = -n;
  float ndv = clamp(abs(dot(n, v)), 0.0, 1.0);
  float fr = pow(1.0 - ndv, 1.6);
  float rim = smoothstep(0.05, 0.85, fr);
  float outer = band(fr, 0.88, 0.07);                                   // 얇은 바깥 윤곽
  float inner = band(fr, 0.60, 0.06) * smoothstep(-0.9, 0.2, -n.y);     // 아래쪽 안쪽 윤곽(유리 두께)

  // 환경 반사·굴절 — 방 조명(RoomEnvironment)을 큐브맵으로 구워 둔 것
  vec3 refl = textureCube(uEnv, reflect(-v, n)).rgb;
  vec3 refr = textureCube(uEnv, normalize(refract(-v, n, 0.76) + n * 0.2)).rgb;
  vec3 env = mix(refr, refl, fr);
  env = clamp((env - 0.5) * 1.8 + 0.5, 0.0, 1.0);
  float lum = dot(env, vec3(0.299, 0.587, 0.114));
  float envDark = smoothstep(0.45, 0.95, 1.0 - lum);
  float envBright = smoothstep(0.55, 1.0, lum);

  // 반짝임 — 좌상단 큰 빛, 오른쪽 아래 옅은 빛, 천천히 움직이는 작은 빛
  float g = spec(n, v, normalize(vec3(-0.55, 0.8, 0.75)), 80.0) * 0.9
          + spec(n, v, normalize(vec3(0.65, -0.25, 0.85)), 30.0) * 0.16
          + spec(n, v, normalize(vec3(-0.2 + sin(uTime * 0.35) * 0.1, 0.3, 0.95)), 200.0) * 0.6;
  vec3 irid = 0.55 + 0.45 * cos(6.2831 * (fr * 1.2 + vec3(0.0, 0.33, 0.67)) + uTime * 0.2);

  vec3 col = vec3(1.0);
  col = mix(col, env, rim * 0.5);
  col = mix(col, vec3(0.34, 0.30, 0.28), outer * 0.55 + inner * 0.35 + envDark * rim * 0.25);
  col = mix(col, irid, rim * 0.14);
  col += vec3(1.0) * (g * 0.6 + envBright * fr * 0.15);

  float a = rim * 0.07 + outer * 0.34 + inner * 0.12 + envDark * rim * 0.08 + envBright * rim * 0.08 + g * 0.28;
  if (!front) { a = rim * 0.05 + outer * 0.10; col = mix(vec3(0.62, 0.6, 0.66), col, 0.3); }
  a = clamp(a, 0.0, 1.0);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0) * a, a);                    // premultiplied
}`;

/* 환경 큐브맵 — RoomEnvironment(흰 벽·창 조명 방)를 한 번 구워서 모든 물방울이 같이 쓴다 */
let envCube = null;
function getEnv(renderer) {
  if (envCube) return envCube;
  const rt = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
  const cam = new THREE.CubeCamera(0.1, 100, rt);
  const room = new RoomEnvironment();
  cam.update(renderer, room);
  room.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  envCube = rt.texture;
  return envCube;
}

function glassMat(env) {
  const bulge = [];
  for (let i = 0; i < 4; i++) bulge.push(new THREE.Vector4(0, 0, 1, 0));
  return new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uAmp: { value: 1 }, uEnv: { value: env }, uBulge: { value: bulge } }
  });
}

/* 로고 SVG → 텍스처 */
function logoTexture(svgEl) {
  return new Promise((res) => {
    const src = svgEl.outerHTML.replace(/currentColor/g, '#331B0F');
    const vb = (svgEl.getAttribute('viewBox') || '0 0 538.82 132.97').split(/\s+/).map(Number);
    const W = 1024, H = Math.round(W * vb[3] / vb[2]);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      c.getContext('2d').drawImage(img, 0, 0, W, H);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      res({ tex: t, aspect: H / W });
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      src.includes('xmlns=') ? src : src.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'));
  });
}

/* 사진 → 가장자리가 부드러운 동그란 텍스처 */
const photoCache = {};
function photoTexture(url) {
  if (photoCache[url]) return photoCache[url];
  photoCache[url] = new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const S = 768, c = document.createElement('canvas'); c.width = c.height = S;
      const g = c.getContext('2d');
      const k = Math.max(S / img.naturalWidth, S / img.naturalHeight);
      const w = img.naturalWidth * k, h = img.naturalHeight * k;
      g.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
      g.globalCompositeOperation = 'destination-in';
      const r = g.createRadialGradient(S / 2, S / 2, S * 0.40, S / 2, S / 2, S * 0.5);
      r.addColorStop(0, 'rgba(0,0,0,1)'); r.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = r; g.fillRect(0, 0, S, S);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      res(t);
    };
    img.src = url;
  });
  return photoCache[url];
}

function mount(host) {
  const kind = host.dataset.bubble;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0, 0, 4.66);                       // 지름이 화면 폭의 약 80%

  const ball = new THREE.Group(); scene.add(ball);
  const content = new THREE.Group(); content.position.z = -0.12; ball.add(content);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(1, 160, 120), glassMat(getEnv(renderer)));
  glass.renderOrder = 2; ball.add(glass);
  const mats = [glass.material];
  // 떠다니는 혹 4개 — 서로 다른 속도·축으로 구 표면을 돈다
  const BULGES = [[0.31, 0.7, 1.0, 0.055], [0.23, 2.1, -0.6, 0.045], [0.17, 4.0, 0.4, 0.05], [0.27, 5.3, -1.1, 0.04]];

  let amp = 1, pulse = 0, tilt = { x: 0, y: 0 }, aim = { x: 0, y: 0 };

  /* 내용물 */
  const planes = [];
  function plane(size) {
    const m = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(size, size), m);
    p.renderOrder = 0; content.add(p); planes.push(p); return p;
  }
  if (kind === 'logo') {
    const svg = host.querySelector('svg') || document.querySelector('.header__logo svg');
    if (svg) logoTexture(svg).then(({ tex, aspect }) => {
      const p = plane(1); p.scale.set(1.08, 1.08 * aspect, 1);
      p.material.map = tex; p.material.opacity = 1; p.material.needsUpdate = true;
      host.classList.add('is-ready');
    });
  } else {
    const A = plane(1.66), B = plane(1.66);
    let front = A, seq = 0;
    const show = (url) => {
      if (!url) return;
      const my = ++seq;
      photoTexture(url).then((tex) => {
        if (my !== seq) return;
        const next = front === A ? B : A;
        next.material.map = tex; next.material.needsUpdate = true;
        next.userData.target = 1; next.userData.born = performance.now();
        front.userData.target = 0;
        front = next; pulse = 1;
        host.classList.add('is-ready');
      });
    };
    const first = document.querySelector('[data-step-src]');
    if (first) show(first.dataset.stepSrc);
    const stage = host.closest('[data-steps-stage]') || document;
    stage.addEventListener('stepchange', (e) => show(e.detail && e.detail.src));
  }

  /* 마우스 쪽으로 아주 살짝 기운다 */
  if (matchMedia('(hover: hover)').matches && !reduce) {
    addEventListener('pointermove', (e) => {
      aim.x = (e.clientX / innerWidth - 0.5) * 0.35;
      aim.y = (e.clientY / innerHeight - 0.5) * 0.25;
    }, { passive: true });
  }

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    draw(performance.now());
  }
  new ResizeObserver(resize).observe(host);

  function draw(now) {
    const t = now / 1000;
    pulse *= 0.955;
    amp = reduce ? 0 : 1 + pulse * 2.4;
    mats.forEach((m) => {
      m.uniforms.uTime.value = t; m.uniforms.uAmp.value = amp;
      // 혹들이 표면을 따라 천천히 돌며 겉면을 밀어 실루엣이 일렁인다 (사진이 바뀌면 더 크게 출렁)
      m.uniforms.uBulge.value.forEach((b, i) => {
        const [sp, ph, tl, w] = BULGES[i];
        const th = t * sp + ph, el = Math.sin(t * sp * 0.7 + ph * 1.3) * 0.9 + tl * 0.3;
        b.set(Math.cos(th) * Math.cos(el), Math.sin(el), Math.sin(th) * Math.cos(el), reduce ? 0 : w * (1 + pulse * 1.8));
      });
    });
    const s = reduce ? 0 : pulse * Math.sin(t * 9) * 0.025;
    ball.scale.set(1 + s, 1 - s, 1);
    tilt.x += (aim.x - tilt.x) * 0.05; tilt.y += (aim.y - tilt.y) * 0.05;
    ball.rotation.y = tilt.x; ball.rotation.x = tilt.y;
    content.rotation.y = reduce ? 0 : Math.sin(t * 0.5) * 0.14;
    content.rotation.x = reduce ? 0 : Math.sin(t * 0.37) * 0.06;
    content.position.y = reduce ? 0 : Math.sin(t * 0.8) * 0.025;
    planes.forEach((p) => {
      if (p.userData.target === undefined) return;
      const m = p.material;
      m.opacity += (p.userData.target - m.opacity) * 0.08;
      const age = Math.min(1, (now - (p.userData.born || 0)) / 900);
      const k = p.userData.target ? 0.9 + 0.1 * (1 - Math.pow(1 - age, 3)) : 1;
      p.scale.set(k, k, 1);
    });
    renderer.render(scene, camera);
  }

  let visible = true, raf = 0;
  function loop(now) { raf = 0; if (!visible) return; draw(now); raf = requestAnimationFrame(loop); }
  new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(loop);
  }, { rootMargin: '120px' }).observe(host);
  resize();
}

document.querySelectorAll('[data-bubble]').forEach((el) => {
  try { mount(el); } catch (e) { el.classList.add('is-fallback'); }
});
