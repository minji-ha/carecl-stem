/* =========================================================
   careCL 3D 디바이스 — Essential Steps 왼쪽
   · 스크롤하면 대각선 축으로 두 바퀴 돌고, 중간에는 비스듬히 기울었다가
     마지막 단계에서 정면·수직(제자리)으로 돌아온다.
   · 회전은 목표값을 바로 따라가지 않고 조금씩 따라가 관성이 느껴진다.
   ========================================================= */
import * as THREE from 'three';
import { GLTFLoader } from '../libs/three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from '../libs/three/addons/environments/RoomEnvironment.js';

const mount = document.querySelector('[data-device3d]');
const list = document.querySelector('[data-steps]');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 정면을 보는 기본 자세 = 회전 없음 (GLB의 Y축이 세로, 화면창이 +Z 방향) */
const HOME = new THREE.Quaternion();
const SPIN_AXIS = new THREE.Vector3(1, 1, 0.35).normalize();   // 대각선 회전축
const TURNS = 2;                                                // 스텝 전체 동안 회전 수
const LEAN = -0.55;                                             // 중간에 기우는 각도(rad, 약 -31°)
const DEVICE_H = 0.24;                                          // GLB 높이
const FILL = 0.5;                                               // 박스 높이 대비 디바이스 높이 (물방울 안에 들어오도록)

function smoother(t) { return t * t * t * (t * (t * 6 - 15) + 10); }   // 시작·끝이 부드러운 곡선
const clamp01 = v => Math.max(0, Math.min(1, v));

if (mount && list) start().catch(() => mount.classList.add('is-fallback'));

async function start() {
  /* 모바일처럼 왼쪽 열이 숨겨진 화면에서는 모델을 내려받지 않는다 */
  if (!mount.offsetParent) return;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(-1, 2, 2);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 10);
  const pivot = new THREE.Group();
  scene.add(pivot);

  const gltf = await new GLTFLoader().loadAsync('assets/model/techfit.glb');
  const model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model);
  model.position.sub(box.getCenter(new THREE.Vector3()));   // 회전 중심을 가운데로
  pivot.add(model);
  mount.classList.add('is-ready');

  /* 화면 크기에 맞춰 카메라 거리 계산 — 디바이스가 박스 높이의 FILL만큼 차도록 */
  function resize() {
    const w = mount.clientWidth, h = mount.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    camera.position.set(0, 0, (DEVICE_H / FILL) / (2 * Math.tan(vFov / 2)));
    camera.updateProjectionMatrix();
    dirty = true;
  }

  /* 스크롤 진행도 — 첫 단계 가운데가 화면 가운데 올 때 0, 마지막 단계가 올 때 1 */
  const steps = list.querySelectorAll('[data-step]');
  function progress() {
    const first = steps[0].getBoundingClientRect();
    const last = steps[steps.length - 1].getBoundingClientRect();
    const mid = innerHeight / 2;
    const a = first.top + first.height / 2, b = last.top + last.height / 2;
    return clamp01((mid - a) / (b - a));
  }

  const target = new THREE.Quaternion();
  const qSpin = new THREE.Quaternion();
  const qLean = new THREE.Quaternion();
  const Z = new THREE.Vector3(0, 0, 1);
  let dirty = true, visible = true;

  function aim() {
    if (reduce) { target.copy(HOME); return; }
    const p = progress();
    const e = smoother(p);
    qSpin.setFromAxisAngle(SPIN_AXIS, e * Math.PI * 2 * TURNS);   // p=1에서 정확히 한 바퀴 단위 → 제자리
    qLean.setFromAxisAngle(Z, LEAN * Math.sin(Math.PI * p));       // 처음·끝 0, 가운데서 가장 기움
    target.copy(qLean).multiply(qSpin).multiply(HOME);
  }

  new ResizeObserver(resize).observe(mount);
  resize();
  aim();
  pivot.quaternion.copy(target);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(mount);
  }
  addEventListener('scroll', () => { aim(); dirty = true; }, { passive: true });

  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    if (!visible) return;
    const t = clock.getElapsedTime();

    /* 목표 자세를 15%씩 따라간다 — 스크롤을 멈춰도 잠깐 더 돌다 멈추는 관성 */
    const before = pivot.quaternion.clone();
    pivot.quaternion.slerp(target, reduce ? 1 : 0.15);
    const moving = before.angleTo(pivot.quaternion) > 1e-5;

    /* 제자리에서도 아주 천천히 떠 있는 느낌 */
    pivot.position.y = reduce ? 0 : Math.sin(t * 1.1) * 0.0035;

    if (moving || dirty || !reduce) { renderer.render(scene, camera); dirty = false; }
  })();
}
