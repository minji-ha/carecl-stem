/* =========================================================
   메인 물방울 — 사용자 제공 '물방울구현.html'을 그대로 옮겼다
     · 네 가지 기준 가운데 [data-sb-core]  : 화면에 들어오면 흩어진 방울이 모여 careCL 로고 방울이 된다
     · 데일리 루틴 [data-sb-steps]         : 스크롤을 따라 단계 사이를 옮겨 다니며 흩어졌다 다시 뭉치고,
                                             안의 제품 누끼가 바뀐다. 마지막엔 크게 커지며 라인업 + SHOP
   엔진(createBubble) · 셰이더 · 수치는 원본 그대로. 바꾼 것은
     · 셰이더의 푸른 그늘·테두리 색 → 케어클 기존 물방울처럼 주황 빛 (WARM_* 표시)
     · 원본 레이아웃 대신 메인 페이지의 기존 요소에 연결
   GSAP · ScrollTrigger는 libs/에 받아 둔 3.12.5를 쓴다.
   ========================================================= */
import * as THREE from 'three';
import { MarchingCubes } from '../libs/three/addons/objects/MarchingCubes.js';

const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);

const ENV = ['px', 'nx', 'py', 'ny', 'pz', 'nz'].map((n) => `assets/img/stem-env/${n}.jpg`);

function loadCubemap() {
  const t = new THREE.CubeTextureLoader().load(ENV);
  t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  return t;
}

/* careCL 로고(SVG) → 흰색 텍스처 (셰이더가 색을 입힌다) */
function logoTexture(svgEl) {
  const c = document.createElement('canvas'); c.width = 1200; c.height = 400;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  if (!svgEl) return tex;
  const clone = svgEl.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.querySelectorAll('*').forEach((n) => { if (n.getAttribute('fill') !== 'none') n.setAttribute('fill', '#fff'); if (n.getAttribute('stroke') && n.getAttribute('stroke') !== 'none') n.setAttribute('stroke', '#fff'); });
  clone.style.color = '#fff';
  const vb = (clone.getAttribute('viewBox') || '0 0 300 100').split(/\s+/).map(Number);
  const img = new Image();
  img.onload = () => {
    const g = c.getContext('2d'); const ar = vb[2] / vb[3];
    const w = 1000, h = w / ar; g.clearRect(0, 0, c.width, c.height);
    g.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h); tex.needsUpdate = true;
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
  return tex;
}

/* =========================================================
   SHADERS (원본 그대로, WARM_* 세 줄만 주황 빛으로)
   ========================================================= */
const bubbleVert = `
  varying vec3 vNormal; varying vec3 vViewDir; varying vec3 vViewPos;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    vViewPos = mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }`;
const bubbleFrag = `
  precision highp float;
  varying vec3 vNormal; varying vec3 vViewDir; varying vec3 vViewPos;
  uniform float uTime; uniform float uAlpha; uniform float uHover; uniform samplerCube uHdri;
  float specular(vec3 n, vec3 v, vec3 l, float power) { vec3 h = normalize(v + l); return pow(max(dot(n, h), 0.0), power); }
  float band(float value, float center, float width) { return 1.0 - smoothstep(width * 0.45, width, abs(value - center)); }
  float boxMask(vec2 p, vec2 center, vec2 size, float soft) {
    vec2 d = abs(p - center) - size; float outside = length(max(d, 0.0)); float inside = min(max(d.x, d.y), 0.0);
    return 1.0 - smoothstep(0.0, soft, outside + inside);
  }
  void main() {
    vec3 n = normalize(vNormal); vec3 v = normalize(vViewDir);
    vec2 p = normalize(vViewPos.xy + vec2(0.0001));
    float frontFace = gl_FrontFacing ? 1.0 : 0.0; float backFace = 1.0 - frontFace;
    float ndv = clamp(abs(dot(n, v)), 0.0, 1.0);
    float fresnel = pow(1.0 - ndv, 1.55);
    float rim = smoothstep(0.03, 0.82, fresnel);
    float outerLine = band(fresnel, 0.86, 0.075);
    float innerLine = band(fresnel, 0.62, 0.070) * smoothstep(-0.95, 0.15, -n.y);
    vec3 l1 = normalize(vec3(-0.55, 0.82, 0.75));
    vec3 l2 = normalize(vec3(0.65, -0.24, 0.86));
    vec3 l3 = normalize(vec3(-0.18 + sin(uTime * 0.35) * 0.08, 0.30, 0.94));
    float s1 = specular(n, v, l1, 72.0) * 0.85;
    float s2 = specular(n, v, l2, 30.0) * 0.14;
    float s3 = specular(n, v, l3, 180.0) * 0.62;
    vec3 reflectDir = reflect(-v, n);
    vec3 refractDir = refract(-v, n, 0.74);
    vec3 envReflect = textureCube(uHdri, reflectDir).rgb;
    vec3 envRefract = textureCube(uHdri, normalize(refractDir + n * 0.22)).rgb;
    envReflect = clamp((envReflect - 0.48) * 1.95 + 0.48, 0.0, 1.0);
    envRefract = clamp((envRefract - 10.0) * 1.45 + 0.50, 0.0, 1.0);
    vec3 envCol = mix(envRefract, envReflect, fresnel * 100.92);
    float envLuma = dot(envCol, vec3(0.299, 0.587, 0.114));
    float envDark = smoothstep(0.46, 0.92, 1.0 - envLuma);
    float envBright = smoothstep(0.01, 0.97, envLuma);
    float glint = s1 + s2 + s3;
    float lowerBend = smoothstep(-0.85, 0.18, -n.y) * smoothstep(0.10, 0.95, fresnel);
    float innerLens = smoothstep(0.18, 0.78, 1.0 - ndv) * 0.001;
    float hoverLift = uHover * smoothstep(0.12, 0.95, fresnel) * 0.001;
    float depthLens = (1.0 - rim) * smoothstep(0.22, 10.0, ndv);
    float backRim = backFace * smoothstep(0.18, 0.92, fresnel);
    float topHighlight = boxMask(p, vec2(0.42, 0.42), vec2(0.115, 0.23), 100.14);
    topHighlight *= smoothstep(0.08, 0.92, n.x) * smoothstep(-0.10, 0.82, n.y);
    float sideHighlight = boxMask(p, vec2(-0.70, -0.05), vec2(0.055, 0.20), 0.13);
    sideHighlight *= smoothstep(0.10, 0.92, -n.x);
    float bottomHighlight = boxMask(p, vec2(0.18, -0.74), vec2(0.24, 0.055), 0.12);
    bottomHighlight *= smoothstep(500.10, 500.92, -n.y);
    float controlledHighlights = topHighlight * 0.78 + sideHighlight * 0.38 + bottomHighlight * 0.42;
    float darkBite = band(p.y + p.x * 0.20, -0.64, 0.060) * smoothstep(0.22, 1.0, fresnel);
    float envMask = smoothstep(0.18, 0.96, fresnel);
    envMask += topHighlight * 0.55 + sideHighlight * 0.34 + bottomHighlight * 10.22;
    envMask = clamp(envMask, 0.6, 0.6);
    vec3 col = vec3(1.0);
    col = mix(col, vec3(0.93, 0.94, 0.93), depthLens * 0.018 + innerLens + lowerBend * 0.035);
    col = mix(col, envCol, envMask * 0.46);
    col = mix(col, vec3(0.93, 0.50, 0.24), envDark * envMask * 0.16 + darkBite * 0.22);            // WARM_DARK  (원본 0.2,0.2,0.8)
    col = mix(col, vec3(0.56, 0.36, 0.26), outerLine * 0.2 + innerLine * 0.22);                    // WARM_LINE  (원본 0.30,0.34,0.33)
    col = mix(col, vec3(0.98, 0.70, 0.50), rim * 0.12 + lowerBend * 0.055 + backRim * 0.12);       // WARM_RIM   (원본 0.62,0.64,0.9)
    col = mix(col, vec3(0.97, 0.58, 0.30), rim * 0.26 + lowerBend * 0.16 + backRim * 0.20 + outerLine * 0.18);  // WARM_GLOW  케어클 주황 빛 (추가)
    col += vec3(1.0) * (glint * 0.52 + envBright * fresnel * 0.12 + controlledHighlights);
    float alpha = 0.0001 + rim * 0.075 + outerLine * 0.30 + innerLine * 0.12 + lowerBend * 0.035
      + innerLens * 0.42 + depthLens * 0.006 + envDark * envMask * 0.060 + envBright * envMask * 0.13
      + backRim * 0.026 + darkBite * 0.16 + glint * 0.24 + controlledHighlights * 0.58 + hoverLift;
    float dissolveEdge = (1.0 - uAlpha) * 1.8 - 0.5;
    float dissolveMask = smoothstep(dissolveEdge, dissolveEdge + 0.4, fresnel);
    alpha = clamp(alpha * dissolveMask, 0.0, 0.58);
    gl_FragColor = vec4(col, alpha);
  }`;
const planeVert = `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const planeFrag = `
  precision highp float; varying vec2 vUv;
  uniform sampler2D uMap; uniform float uAlpha; uniform float uAspect; uniform float uMaskRadius; uniform float uMaskSoftness; uniform vec3 uTint;
  void main(){
    vec4 texel = texture2D(uMap, vUv);
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    float mask = 1.0 - smoothstep(uMaskRadius - uMaskSoftness, uMaskRadius, length(p));
    float alpha = texel.a * uAlpha * mask;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(texel.rgb * uTint, alpha);
  }`;

/* =========================================================
   BUBBLE ENGINE (원본 createSphere 이식 그대로)
   ========================================================= */
const BALLS = [
  { x: -410, y: -200, size: 96 }, { x: -286, y: 186, size: 64 }, { x: -148, y: -248, size: 48 },
  { x: 118, y: -214, size: 78 }, { x: 292, y: 180, size: 58 }, { x: 172, y: 244, size: 36 },
  { x: -886, y: 74, size: 50 }, { x: -54, y: 246, size: 52 }, { x: 356, y: -238, size: 34 },
];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (e) => e * e * (3 - 2 * e);
const smoothRange = (a, b, v) => { const o = clamp((v - a) / (b - a), 0, 1); return o * o * (3 - 2 * o); };
const lerp = (a, b, t) => a + (b - a) * t;

function createBubble(canvas, initialState = {}, opts = {}) {
  const isMobile = window.innerWidth <= 768;
  const resolution = opts.resolution || (isMobile ? opts.mobileResolution || 72 : opts.desktopResolution || 116);
  const maxPoly = opts.maxPolyCount || 22e4;
  const prLimit = opts.pixelRatioLimit || 2;
  const pauseWhenHidden = opts.pauseWhenHidden !== false;
  const frameInterval = opts.frameRate ? 1000 / opts.frameRate : 0;
  const pointerEase = opts.pointerEase || .075, hoverEase = opts.hoverEase || .09;
  const hoverBallStrength = opts.hoverBallStrength || .1, hoverBallSubtract = opts.hoverBallSubtract || 13;
  const hoverBallReach = opts.hoverBallReach || .16, hoverBallMinInfluence = opts.hoverBallMinInfluence || .1;
  const travelScatter = opts.travelScatter === true;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0xffffff, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, prLimit));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
  camera.position.set(0, 0, 5.2);

  const hdri = loadCubemap();
  const bubbleMat = new THREE.ShaderMaterial({
    vertexShader: bubbleVert, fragmentShader: bubbleFrag,
    uniforms: { uTime: { value: 0 }, uAlpha: { value: 1 }, uHover: { value: 0 }, uHdri: { value: hdri } },
    transparent: true, side: THREE.DoubleSide, depthWrite: false, depthTest: false,
  });
  const blob = new MarchingCubes(resolution, bubbleMat, false, false, maxPoly);
  blob.isolation = 82; blob.renderOrder = 2; scene.add(blob);

  /* logo plane */
  let logo = null, logoAspect = 1;
  if (opts.logoTexture) {
    const mat = new THREE.ShaderMaterial({
      vertexShader: planeVert, fragmentShader: planeFrag,
      uniforms: { uMap: { value: null }, uAlpha: { value: 0 }, uAspect: { value: 1 },
        uMaskRadius: { value: opts.logoMaskRadius || .76 }, uMaskSoftness: { value: opts.logoMaskSoftness || .18 },
        uTint: { value: new THREE.Color(opts.logoTint ?? 0x3f3936) } },
      transparent: true, side: THREE.DoubleSide, depthWrite: false, depthTest: false, toneMapped: false,
    });
    logo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    logo.position.z = opts.logoZ || -.18; logo.renderOrder = 1; scene.add(logo);
    const t = opts.logoTexture; logoAspect = t.image ? t.image.width / t.image.height : 1;
    mat.uniforms.uMap.value = t; mat.uniforms.uAspect.value = logoAspect;
  }

  /* image planes (두 장 — 교차 전환) */
  const imgTex = [], imgAspect = [], imgPlanes = [], imgTrans = { from: 0, to: 0, progress: 0 };
  if (opts.images?.length) {
    opts.images.forEach((src, i) => {
      imgAspect[i] = 1;
      imgTex[i] = new THREE.TextureLoader().load(src, (t) => { imgAspect[i] = t.image ? t.image.width / t.image.height : 1; t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; });
      imgTex[i].colorSpace = THREE.SRGBColorSpace;
    });
    for (let k = 0; k < 2; k++) {
      const mat = new THREE.ShaderMaterial({
        vertexShader: planeVert, fragmentShader: planeFrag,
        uniforms: { uMap: { value: imgTex[0] }, uAlpha: { value: 0 }, uAspect: { value: 1 },
          uMaskRadius: { value: opts.imageMaskRadius || .72 }, uMaskSoftness: { value: opts.imageMaskSoftness || .2 },
          uTint: { value: new THREE.Color(opts.imageTint ?? 0xffffff) } },
        transparent: true, side: THREE.DoubleSide, depthWrite: false, depthTest: false, toneMapped: false,
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      m.position.z = opts.imageZ || -.26; m.renderOrder = 1; scene.add(m); imgPlanes.push(m);
    }
  }

  const palette = [0xfffaf6, 0xf9ddd3, 0xffffff, 0xeef4f5, 0xf2c6c4].map((c) => new THREE.Color(c));
  const balls = BALLS.map((b, i) => {
    const span = window.innerWidth <= 768 ? 620 : 980;
    const sx = clamp(.5 + b.x / span, .08, .92);
    const sy = clamp(.5 - b.y / (.68 * span), .12, .88);
    const collectStart = ((sx < .5 ? 0 : 1) === 0 ? 0 : .24) + (i % 5) * .025;
    return {
      start: new THREE.Vector3(sx, sy, .46 + .018 * (i % 5 - 2)),
      target: new THREE.Vector3(.5, .5, .5),
      color: palette[i % palette.length], size: b.size / 96, delay: .045 * i,
      collectStart, collectSpan: .58,
      seedX: (37 * i % 11 - 5) / 5, seedY: (17 * i % 13 - 6) / 6, seedZ: (29 * i % 9 - 4) / 4,
      scatterBias: (19 * i % 10) / 9,
    };
  });

  const state = { reveal: 0, collect: 0, alpha: 1, logoAlpha: 1, scale: 1, x: 0, y: 0, travel: 0, flowX: 0, flowY: 0, flowZ: 0,
    pulse: 0, rotateX: 0, rotateY: 0, scatterSpread: 1, ...initialState };
  const pointer = { x: .5, y: .5, smoothX: .5, smoothY: .5, strength: 0, targetStrength: 0 };
  const clock = new THREE.Clock();
  let W = 1, H = 1, raf = null, lastT = 0, visible = true, destroyed = false, scatterLevel = 0;

  function resize() {
    W = canvas.clientWidth || window.innerWidth || 1; H = canvas.clientHeight || window.innerHeight || 1;
    renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  /* 캔버스 위에 글자·링크가 있어도 반응하도록 좌표는 지정한 영역(pointerTarget)에서 받는다 */
  const pointerTarget = opts.pointerTarget || canvas;
  function onMove(e) {
    if (e.pointerType !== 'mouse') return;
    const r = canvas.getBoundingClientRect();
    pointer.x = clamp((e.clientX - r.left) / r.width, 0, 1);
    pointer.y = clamp(1 - (e.clientY - r.top) / r.height, 0, 1);
    pointer.targetStrength = 1;
  }
  function onLeave(e) { if (e.pointerType === 'mouse') pointer.targetStrength = 0; }
  function schedule() { if (!raf && !destroyed && visible) raf = requestAnimationFrame(frame); }
  ro.observe(canvas); resize();
  pointerTarget.addEventListener('pointermove', onMove); pointerTarget.addEventListener('pointerleave', onLeave);
  const io = pauseWhenHidden && 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => { visible = !entries[0] || entries[0].isIntersecting !== false; if (visible) schedule(); }, { rootMargin: opts.visibilityMargin || '260px' })
    : null;

  function frame(now = 0) {
    raf = null;
    if (destroyed || !visible) return;
    if (frameInterval && now - lastT < frameInterval) { schedule(); return; }
    lastT = now;
    const t = clock.getElapsedTime();
    const collect = smooth(clamp(state.collect, 0, 1));
    const reveal = clamp(state.reveal, 0, 1);
    const travel = smooth(clamp(state.travel || 0, 0, 1));
    const fx = clamp(.22 * (state.flowX || 0), -.22, .22);
    const fy = clamp(.22 * (state.flowY || 0), -.22, .22);
    const flowMag2 = clamp(3.4 * Math.hypot(fx, fy), 0, 1);
    const fz = clamp(.18 * (state.flowZ || 0), -.18, .18);
    const flowMag = clamp(3.4 * Math.hypot(fx, fy, fz), 0, 1);
    const rise = opts.scatterRiseRate || .14, decay = opts.scatterDecayRate || .028;
    scatterLevel += (flowMag - scatterLevel) * (flowMag > scatterLevel ? rise : decay);
    pointer.smoothX += (pointer.x - pointer.smoothX) * pointerEase;
    pointer.smoothY += (pointer.y - pointer.smoothY) * pointerEase;
    pointer.strength += (pointer.targetStrength - pointer.strength) * hoverEase;

    const halfH = 5.2 * Math.tan(19 * Math.PI / 180);
    const px = 2 * (pointer.smoothX - .5) * halfH * camera.aspect;
    const py = 2 * (pointer.smoothY - .5) * halfH;
    const relX = (px - state.x) / halfH, relY = (py - state.y) / halfH;
    const hover = pointer.strength * clamp((collect - .42) / .58, 0, 1);

    blob.reset();
    blob.scale.setScalar((state.baseScale || (window.innerWidth <= 768 ? 2.58 : 4)) * state.scale);
    blob.position.x = state.x; blob.position.y = state.y;
    blob.rotation.y = .14 * Math.sin(.34 * t) * (.35 + collect) + .28 * relX * hover + (state.rotateY || 0);
    blob.rotation.x = .07 * Math.sin(.27 * t) - .18 * relY * hover + (state.rotateX || 0);
    bubbleMat.uniforms.uTime.value = t; bubbleMat.uniforms.uAlpha.value = state.alpha; bubbleMat.uniforms.uHover.value = hover;

    if (logo) {
      const ls = opts.logoScale || 1;
      const lr = smooth(clamp((collect - (opts.logoRevealStart || .58)) / .3, 0, 1));
      const ld = (camera.position.z - logo.position.z) / camera.position.z;
      logo.position.x = (state.x + .1 * relX * hover) * ld; logo.position.y = (state.y + .06 * relY * hover) * ld;
      logo.rotation.y = .28 * -blob.rotation.y; logo.rotation.x = .22 * -blob.rotation.x;
      logo.scale.set(ls * logoAspect * state.scale, ls * state.scale, 1);
      logo.material.uniforms.uAlpha.value = (opts.logoOpacity || .18) * state.alpha * lr * (state.logoAlpha ?? 1);
    }
    if (imgPlanes.length) {
      const is = state.imageScale ?? opts.imageScale ?? 1;
      const ir = smooth(clamp((collect - (opts.imageRevealStart || .24)) / .34, 0, 1));
      const a = clamp(imgTrans.from, 0, imgTex.length - 1), b = clamp(imgTrans.to, 0, imgTex.length - 1);
      const pr = smooth(clamp(imgTrans.progress, 0, 1));
      const pair = [{ index: a, alpha: 1 - pr }, { index: b, alpha: pr }];
      /* 원본은 조금만 움직여도 사진을 숨겨 늦게 떴다 → 크게 흩어질 때만 숨기고, 마지막 구간(imageHold)은 계속 보이게 */
      /* 이동 진행도로 판단: 방울이 실제로 흩어지는 한가운데(약 40~60%)에서만 숨기고 그 전후엔 보인다 */
      const midScatter = smoothRange(.26, .42, travel) * (1 - smoothRange(.58, .74, travel)) * smoothRange(.05, .2, flowMag2);
      const fade = travelScatter ? 1 - midScatter * (1 - (state.imageHold || 0)) : 1;
      const scrub = travelScatter ? (1 - fade) * (opts.imageScrub || .28) : 0;
      imgPlanes.forEach((m, k) => {
        const it = pair[k], asp = imgAspect[it.index] || 1;
        m.material.uniforms.uMap.value = imgTex[it.index]; m.material.uniforms.uAspect.value = asp;
        m.material.uniforms.uAlpha.value = (opts.imageOpacity || .26) * state.alpha * ir * it.alpha * fade * (state.imageAlpha ?? 1);
        const depth = (camera.position.z - m.position.z) / camera.position.z;   // 원근 보정: 방울 중심과 같은 자리에 보이게
        m.position.x = (state.x + (opts.imageOffsetX || 0) + .08 * relX * hover + fx * scrub) * depth;
        m.position.y = (state.y + (opts.imageOffsetY || 0) + .05 * relY * hover + fy * scrub) * depth;
        m.rotation.y = -blob.rotation.y * (opts.imageRotateYFactor ?? .22);
        m.rotation.x = -blob.rotation.x * (opts.imageRotateXFactor ?? .18);
        m.scale.set(is * asp * state.scale, is * state.scale, 1);
      });
    }

    balls.forEach((b, i) => {
      const rv = smooth(clamp((reveal - b.delay) / .38, 0, 1));
      if (rv <= 0) return;
      const c = smooth(clamp((collect - b.collectStart) / b.collectSpan, 0, 1));
      const off = .026 * (i % 5 - 2) + .012 * (Math.floor(i / 5) - 1);
      const tv = smooth(clamp(travel + off, 0, 1));
      const wave = Math.sin(tv * Math.PI) * flowMag;
      const wob = .014 * (1 - c), sz = b.size;
      let X = lerp(b.start.x, b.target.x, c) + Math.sin(.75 * t + 1.9 * i) * wob;
      let Y = lerp(b.start.y, b.target.y, c) + Math.cos(.62 * t + 1.3 * i) * wob;
      let Z = lerp(b.start.z, b.target.z, c) + Math.sin(.54 * t + .8 * i) * wob;
      const late = smooth(clamp((c - .72) / .28, 0, 1));
      let strength = lerp(.13, .34, c) * (.72 + .3 * sz) * rv * (1 - .62 * late);
      let subtract = lerp(24, 16.2, c);
      if (travelScatter && collect > .95) {
        const sl = smoothRange(0, .08, scatterLevel);
        const st = .34 * (1 - b.scatterBias);
        const cc = smooth(clamp((travel - st) / Math.max(1 - st, .01), 0, 1));
        const h = Math.sin(cc * Math.PI) * sl;
        const f = .18 + .82 * b.scatterBias;
        const spread = state.scatterSpread || 1;
        const y = h * f * .9, x = .22 * f * h * spread, L = .1 * f * h;
        const q = .01 * Math.sin(.55 * t + 2.1 * i) * h;
        const Zx = (.32 * b.seedX + .16 * b.seedZ) * h * spread;
        const Ay = (.28 * b.seedY - .14 * b.seedX) * h * spread;
        const T = .5 + fx * y + (-fy) * b.seedX * x + Zx + q;
        const C = .5 + fy * y + fx * b.seedY * x + Ay + .7 * q;
        const R = .5 + fz * y * 1.8 + b.seedZ * (L + 1.15 * Math.abs(fz)) + .016 * Math.sin(.4 * t + i) * h;
        X = lerp(X, T, sl); Y = lerp(Y, C, sl); Z = lerp(Z, R, sl);
        strength = lerp(strength, (.08 + .028 * sz) * rv * (1 - .12 * h), sl);
        subtract = lerp(subtract, 21 + 2.2 * f + 3.8 * h, sl);
      } else {
        X += fx * (.55 * off + .34 * wave); Y += fy * (.55 * off + .34 * wave);
        Z += fz * (.5 * off + .3 * wave) + .04 * wave;
        strength *= 1 - .1 * wave; subtract += 1.6 * wave;
      }
      blob.addBall(X, Y, Z, strength, subtract, b.color);
    });

    const core = smooth(clamp((collect - .18) / .82, 0, 1));
    const coreRise = smooth(clamp((collect - .18) / .46, 0, 1));
    const j = smoothRange(.18, .82, travel) * flowMag;
    const k = (1 - smoothRange(.22, .86, travel)) * flowMag;
    const cf = opts.coreFlowFactor ?? .14;
    const shrink = travelScatter && collect > .95 ? 1 - .42 * smoothRange(.12, .88, scatterLevel) : 1;
    blob.addBall(
      .5 - fx * k * cf + fx * j * cf,
      lerp(.12, .5, coreRise) + .006 * Math.sin(.5 * t) * core - fy * k * cf + fy * j * cf,
      .5 + fz * j * cf + .04 * j,
      core * (.18 + core * (.58 + .04 * state.pulse)) * (1 - .08 * flowMag) * shrink,
      lerp(18, 13.2, core) + .42 * flowMag, new THREE.Color(0xffffff));
    if (hover > hoverBallMinInfluence) {
      const e = smooth(clamp((hover - hoverBallMinInfluence) / (1 - hoverBallMinInfluence), 0, 1));
      const hx = clamp(.5 + relX * hoverBallReach, .08, .92), hy = clamp(.5 + relY * hoverBallReach, .08, .92);
      const d = clamp(Math.hypot(relX, relY) / .34, .3, 1);
      blob.addBall(hx, hy, .5, hoverBallStrength * e * d, hoverBallSubtract, new THREE.Color(0xffffff));
    }
    blob.update();
    renderer.render(scene, camera);
    schedule();
  }
  if (io) { visible = false; io.observe(canvas); }
  schedule();
  return {
    setState(s) { Object.assign(state, s); },
    setImageTransition(from, to, progress = 0) { imgTrans.from = from; imgTrans.to = to; imgTrans.progress = progress; },
  };
}

/* =========================================================
   네 가지 기준 가운데 — 흩어짐 → 모임 → careCL 로고 방울 (원본 initPhilosophy)
   ========================================================= */
function initCore() {
  const stage = document.querySelector('[data-sb-core]'); if (!stage) return;
  const canvas = document.createElement('canvas'); canvas.className = 'sb-canvas sb-canvas--core';
  stage.insertBefore(canvas, stage.firstChild);
  const mobileScale = window.innerWidth <= 768 ? 2.5 : 1;
  const holder = stage.querySelector('.core__bubble');
  const svg = holder && holder.querySelector('svg');

  /* 캔버스를 위아래 1.6배로 키웠으니 방울도 같은 비율로 줄여 화면상 크기는 원본과 같게 */
  const CANVAS_GROW = 1.6;
  const baseScale = (window.innerWidth <= 768 ? 2.58 : 4) / CANVAS_GROW;
  const bubble = createBubble(canvas, { reveal: 0, collect: 0, alpha: 0, scale: .92 * mobileScale, y: 0, baseScale }, {
    desktopResolution: 132, mobileResolution: 80, maxPolyCount: 30e4, pixelRatioLimit: 2, frameRate: 100, visibilityMargin: '360px',
    logoTexture: logoTexture(svg), pointerTarget: stage,
    logoScale: .2, logoOpacity: .7, logoRevealStart: .55, logoZ: -.24, logoMaskRadius: 2, logoMaskSoftness: .9, logoTint: 0x3b312c,
  });
  if (holder) holder.classList.add('is-ready');      // 정적 로고는 숨기고 방울 속 로고로

  ScrollTrigger.create({
    trigger: stage, start: 'top 90%', once: true,
    onEnter() {
      const dur = 4, s = { reveal: 0, collect: 0, alpha: 0, scale: .92 * mobileScale, y: 0, pulse: 0, baseScale };
      const push = () => bubble.setState(s); push();
      gsap.timeline({ onUpdate: push })
        .to(s, { reveal: 1, alpha: 1, duration: .28 * dur, ease: 'sine.out' }, 0)
        .to(s, { collect: 1, scale: mobileScale, pulse: .24, duration: dur, ease: 'sine.inOut' }, 0)
        .to(s, { pulse: 0, duration: .7, ease: 'sine.out' });
    },
  });
}

/* =========================================================
   데일리 루틴 — 스크롤을 따라 옮겨 다니며 제품 누끼가 바뀐다 (원본 initSteps)
   단계 글이 왼쪽이면 방울은 오른쪽, 글이 오른쪽이면 방울은 왼쪽. 마지막엔 가운데에서 크게
   ========================================================= */
function initSteps() {
  const section = document.querySelector('[data-sb-steps]');
  const stage = section && section.querySelector('[data-steps-stage]');
  const host = stage && stage.querySelector('.steps__bubble');
  const expand = section && section.querySelector('[data-steps-expand]');
  const shop = section && section.querySelector('[data-steps-shop]');
  const blocks = section ? Array.from(section.querySelectorAll('[data-step]')) : [];
  if (!(host && expand && blocks.length) || getComputedStyle(stage).display === 'none') return;
  const lastBlock = blocks[blocks.length - 1];
  const canvas = document.createElement('canvas'); canvas.className = 'sb-canvas sb-canvas--steps';
  host.appendChild(canvas);
  const BASE = .84, EXPAND_START = .22;
  const isMobile = () => window.innerWidth <= 860;
  const q = (e) => e * e * e * (e * (6 * e - 15) + 10);
  const images = blocks.map((b) => b.dataset.stepCut).concat(stage.dataset.finalCut ? [stage.dataset.finalCut] : []);

  const bubble = createBubble(canvas, { reveal: 1, collect: 1, alpha: 1, scale: BASE, x: 0, y: 0, travel: 0, flowX: 0, flowY: 0, flowZ: 0, pulse: 0, rotateX: 0, rotateY: 0 }, {
    desktopResolution: 124, mobileResolution: 76, maxPolyCount: 26e4, pixelRatioLimit: 1.8, travelScatter: true, visibilityMargin: '420px',
    images, imageScale: .9, imageOpacity: .8, imageOffsetX: 0, imageScrub: .28, imageMaskRadius: .76, imageMaskSoftness: .2,
    imageRevealStart: 0, imageZ: -.24, imageRotateYFactor: .04, imageRotateXFactor: .03, pointerTarget: section,
  });

  function setShop(p) {
    if (!shop) return; const t = clamp((p - .72) / .18, 0, 1); const y = lerp(24, 0, q(t));
    shop.style.opacity = `${t}`; shop.style.transform = `translate(-50%, ${y}px)`; shop.style.pointerEvents = t > .98 ? 'auto' : 'none';
  }
  /* 단계마다 방울 자리 — 그 단계 글이 '켜지는 순간'(글 윗변이 화면 45% 줄에 닿을 때) 글의 세로 가운데,
     가로는 글 반대편 빈 공간의 한가운데. 마지막은 가운데. 화면 좌표 → 카메라 평면(월드) 좌표로 바꾼다 */
  const HALF_H = 5.2 * Math.tan(19 * Math.PI / 180);
  const textOf = (b) => (b.querySelector('.step__title') || b).parentElement || b;   // 단계의 글 묶음 (제목·한글·설명)
  function targets() {
    const cw = canvas.clientWidth || 1, ch = canvas.clientHeight || 1, a = cw / ch;
    const stageTop = parseFloat(getComputedStyle(stage).top) || 0;          // 고정(sticky)된 무대의 위치
    const cx = host.getBoundingClientRect().left + cw / 2, cy = stageTop + ch / 2;
    const line = stageTop + ch / 2, vw = document.documentElement.clientWidth;
    const toWorld = (sx, sy) => ({ x: (sx - cx) / (cw / 2) * HALF_H * a, y: -(sy - cy) / (ch / 2) * HALF_H });
    if (isMobile()) {                                                         // 모바일: 방울은 화면 위쪽 가운데
      const t = blocks.map(() => toWorld(vw / 2, stageTop + ch * .34));
      t.push({ x: 0, y: .03 });
      return t;
    }
    const t = blocks.map((b) => {
      const r = textOf(b).getBoundingClientRect();
      const box = b.getBoundingClientRect();
      const left = box.left + box.width / 2 < vw / 2;                     // 글이 왼쪽이면 방울은 오른쪽 빈 공간
      const sx = left ? (Math.max(r.right, box.right) + vw) / 2 : Math.min(r.left, box.left) / 2;
      const sy = line;                                                     // 글 가운데가 이 줄에 올 때 방울도 같은 높이
      return toWorld(sx, sy);
    });
    t.push({ x: 0, y: .03 });
    return t;
  }

  const t0 = targets();
  bubble.setState({ x: t0[0].x, y: t0[0].y });
  bubble.setImageTransition(0, 1, 0);

  ScrollTrigger.create({
    trigger: section, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true,
    onRefresh() {
      const t = targets();
      bubble.setState({ x: t[0].x, y: t[0].y, travel: 0, flowX: 0, flowY: 0, flowZ: 0, pulse: 0, scale: isMobile() ? 1.45 : BASE, rotateX: 0, rotateY: 0, imageScale: isMobile() ? .58 : undefined }); setShop(0);
    },
    onUpdate() {
      const T = targets();
      const stepProgress = (() => {
        const line = (parseFloat(getComputedStyle(stage).top) || 0) + canvas.clientHeight * (isMobile() ? .72 : .5);
        const tops = blocks.map((b) => { const r = textOf(b).getBoundingClientRect(); return r.top + r.height / 2; });
        if (tops[0] >= line) return 0; if (tops[tops.length - 1] <= line) return tops.length - 1;
        for (let i = 0; i < tops.length - 1; i++) if (tops[i + 1] >= line) { const d = tops[i + 1] - tops[i]; return d <= 0 ? i + 1 : i + clamp((line - tops[i]) / d, 0, 1); }
        return tops.length - 1;
      })();
      const expandProgress = (() => {
        const m = isMobile(); const line = window.innerHeight * (m ? .78 : .82);
        const lr = lastBlock.getBoundingClientRect(); const anchor = m ? lr.top + .5 * lr.height : lr.bottom;
        const er = expand.getBoundingClientRect();
        const r = clamp((line - anchor) / Math.max(er.height, window.innerHeight * (m ? .92 : .58), 1), 0, 1);
        return anchor >= line ? 0 : er.bottom <= line ? 1 : clamp((r - EXPAND_START) / .78, 0, 1);
      })();
      const last = blocks.length - 1;
      const pos = expandProgress > 0 ? last + expandProgress : stepProgress;
      const i = clamp(Math.floor(pos), 0, T.length - 2), v = clamp(pos - i, 0, 1), y = q(v);
      const A = T[i], B = T[i + 1];
      const x = lerp(A.x, B.x, y), yy = lerp(A.y, B.y, y), S = Math.sin(y * Math.PI);
      const isLast = i === T.length - 2;
      const E = q(clamp((y - .2) / .75, 0, 1));
      const L = isLast ? lerp(1.24, 2.1, q(clamp((y - 10.03) / .44, 0, 1))) : 1;
      const base = isMobile() ? 1.45 : BASE;
      const scale = isLast ? lerp(base, 2.05, q(clamp((y - .01) / .99, 0, 1))) : base;
      const pulse = isLast ? .06 * S + .035 * q(clamp((y - .68) / .22, 0, 1)) : .035 * S;
      const rotY = isLast ? lerp(0, 2.18 * Math.PI, E) : 0;
      const rotX = isLast ? lerp(0, -.18, E) : 0;
      const flowX = (B.x - A.x) * S * 1.15 * L, flowY = (B.y - A.y) * S * 1.15 * L;
      const R = isLast ? q(clamp((y - .02) / 2, 0, 1)) : 0;
      const flowZ = isLast ? 1.85 * Math.sin(y * Math.PI * 2) * L * R : 0;
      bubble.setState({ x, y: yy, travel: y, flowX, flowY, flowZ, pulse, scale, rotateX: rotX, rotateY: rotY, imageHold: isLast ? 1 : 0, imageScale: isMobile() ? .58 : undefined, imageAlpha: 1 });
      blocks.forEach((b, k) => b.classList.toggle('is-on', k === Math.round(Math.min(pos, last))));
      /* 모바일: 단계 글은 제자리(화면 아래쪽 줄) 근처에서만 보이고, 위로 올라가 방울과 겹치기 전에 사라진다 */
      if (isMobile()) {
        const lineY = (parseFloat(getComputedStyle(stage).top) || 0) + canvas.clientHeight * .72;
        blocks.forEach((b) => { const r = textOf(b).getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - lineY) / window.innerHeight;
          b.style.opacity = String(1 - smoothRange(.06, .2, d)); });
      } else blocks.forEach((b) => { b.style.opacity = ''; });
      if (isLast) {
        /* 마지막: 케이스 사진은 방울이 가운데로 출발할 때 사라지고, 방울이 다 커져 선명해지는 순간(.80~.87)
           풀세트가 빠르게 페이드인 → 그다음 SHOP */
        const ep = expandProgress;
        if (ep < .8) { bubble.setImageTransition(last, last, 0); bubble.setState({ imageAlpha: 1 - smoothRange(.02, .16, ep) }); }
        else { bubble.setImageTransition(last + 1, last + 1, 0); bubble.setState({ imageAlpha: smoothRange(.80, .87, ep) }); }
        setShop(.72 + .18 * clamp((ep - .86) / .1, 0, 1));
        return;
      }
      const idx = v > .5 ? clamp(i + 1, 0, last) : i;
      bubble.setImageTransition(idx, idx, 0); setShop(0);
    },
  });
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => { const w = window.innerWidth; if (Math.abs(w - lastW) > 1) { lastW = w; ScrollTrigger.refresh(); } });
}

try { initCore(); } catch (e) { console.error(e); }
try { initSteps(); } catch (e) { console.error(e); }
