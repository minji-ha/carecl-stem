/* =========================================================
   careCL — 유리 물방울 (수정요청 261019, STEM 물방울 참고)
   · [data-bubble="logo"]  : 물방울 속에 careCL 로고 (네 가지 기준 가운데)
   · [data-bubble="steps"] : 물방울 속에 단계 사진 — stem.js가 보내는 'stepchange'로 바뀐다 (데일리 루틴)
   물방울 = 얇은 갈색 윤곽 + 좌상단으로 살짝 밀린 안쪽 윤곽(유리 뒷면) + 좌상단 하이라이트 + 테두리의 옅은 무지개빛.
   실루엣이 천천히 일렁이고, 사진이 바뀔 때 한 번 출렁인다.
   ========================================================= */
import * as THREE from 'three';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const VERT = /* glsl */`
uniform float uTime, uAmp;
varying vec3 vN; varying vec3 vV;
void main(){
  vec3 p = position;
  float w = sin(p.x * 3.1 + uTime * 1.1) * sin(p.y * 2.7 + uTime * 0.9) * 0.020
          + sin(p.z * 2.3 + p.y * 1.3 + uTime * 0.7) * 0.014;
  p += normal * w * uAmp;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */`
uniform float uTime, uBack;
varying vec3 vN; varying vec3 vV;
void main(){
  vec3 n = normalize(vN), v = normalize(vV);
  float ndv = abs(dot(n, v));
  float fr = pow(1.0 - ndv, 4.5);
  float edge = smoothstep(0.90, 0.995, 1.0 - ndv);                       // 아주 얇은 윤곽선
  vec3 rim = vec3(0.42, 0.35, 0.31);                                      // 갈색 윤곽
  vec3 irid = 0.55 + 0.45 * cos(6.2831 * (fr * 1.3 + vec3(0.0, 0.33, 0.67)) + uTime * 0.25);
  vec3 col = mix(rim, irid, 0.32 * fr);
  float a = fr * 0.30 + edge * 0.42;
  if (uBack > 0.5) { float b = a * 0.45; gl_FragColor = vec4(col * b, b); return; }   // 안쪽 윤곽 (유리 뒷면)
  // 좌상단 창문 같은 하이라이트 + 오른쪽 아래 옅은 반사
  float hl = smoothstep(0.935, 0.99, dot(n, normalize(vec3(-0.46, 0.52, 0.72)))) * 0.75;
  hl += pow(max(dot(reflect(-v, n), normalize(vec3(-0.5, 0.65, 0.58))), 0.0), 90.0) * 0.9;
  hl += smoothstep(0.90, 0.985, dot(n, normalize(vec3(0.62, -0.5, 0.6)))) * 0.16;
  float A = clamp(a + hl, 0.0, 1.0);
  vec3 C = mix(col, vec3(1.0), clamp(hl / max(A, 1e-3), 0.0, 1.0));
  gl_FragColor = vec4(C * A, A);                                          // premultiplied
}`;

function glassMat(back) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, premultipliedAlpha: true,
    side: back ? THREE.BackSide : THREE.FrontSide,
    uniforms: { uTime: { value: 0 }, uAmp: { value: 1 }, uBack: { value: back ? 1 : 0 } }
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
  const geo = new THREE.SphereGeometry(1, 128, 96);
  const back = new THREE.Mesh(geo, glassMat(true)); back.position.set(-0.035, 0.03, 0); back.scale.setScalar(0.985);
  const front = new THREE.Mesh(geo, glassMat(false));
  back.renderOrder = 1; front.renderOrder = 2;
  ball.add(back, front);
  const mats = [back.material, front.material];

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
    mats.forEach((m) => { m.uniforms.uTime.value = t; m.uniforms.uAmp.value = amp; });
    // 실루엣이 천천히 일렁임 + 사진이 바뀌면 한 번 출렁
    const s = reduce ? 0 : Math.sin(t * 1.3) * 0.012 + pulse * Math.sin(t * 9) * 0.03;
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
