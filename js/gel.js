/* =========================================================
   메인 '케어클의 네 가지 기준' 가운데 — 투명 콜라겐 젤 방울
   carecl-bubble.html(사용자 제공 데모)의 효과를 그대로 옮겼다.
     · 메인 젤 + 주변 방울 4개 + 마우스 방울이 하나의 MarchingCubes 필드를 공유
       → 가까워지면 표면이 매끈하게 이어지고, 멀어지면 탄성 있게 흩어진다
     · 피치 · 연보라 펄 셰이더, 환경 이미지 6장으로 은은한 반사광
   데모의 로고 · 문구 · 버튼은 가져오지 않고, 기존 레이아웃(가운데 careCL 로고, 네 항목)은 그대로 둔다.
   캔버스는 클릭을 막지 않도록 pointer-events:none, 마우스 좌표는 무대 영역에서 받는다.
   ========================================================= */
import * as THREE from 'three';
import { MarchingCubes } from '../libs/three/addons/objects/MarchingCubes.js';

const stage = document.querySelector('[data-gel]');
if (stage) mount(stage).catch((e) => console.error(e));

async function mount(stage) {
  const host = document.createElement('div');
  host.className = 'gel';
  host.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  host.appendChild(canvas);
  stage.insertBefore(host, stage.firstChild);

  const mobile = matchMedia('(max-width:650px)').matches;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0xffffff, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.z = 5.2;

  /* 사용자가 준 환경 이미지 6장 (px, nx, py, ny, pz, nz) */
  const env = await new THREE.CubeTextureLoader()
    .setPath('assets/img/gel-env/')
    .loadAsync(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']);

  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uShine: { value: 1.0 }, uEnv: { value: env } },
    vertexShader: `varying vec3 vN;varying vec3 vV;void main(){vec4 p=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=-p.xyz;gl_Position=projectionMatrix*p;}`,
    fragmentShader: `
precision highp float;varying vec3 vN;varying vec3 vV;uniform float uShine;uniform samplerCube uEnv;
void main(){
vec3 n=normalize(vN),v=normalize(vV);float nv=clamp(abs(dot(n,v)),0.,1.);float f=pow(1.-nv,1.35);
vec3 r=reflect(-v,n);vec3 env=textureCube(uEnv,r).rgb;
vec3 soft=(env+textureCube(uEnv,normalize(r+vec3(.075,0.,0.))).rgb+textureCube(uEnv,normalize(r+vec3(0.,.075,0.))).rgb)/3.;
float lum=dot(soft,vec3(.299,.587,.114));float light=smoothstep(.48,.94,lum);float shade=1.-smoothstep(.08,.58,lum);
float rim=exp(-pow((f-.86)/.07,2.));float under=exp(-pow((f-.56)/.085,2.))*smoothstep(-.1,.85,-n.y);
float glint=pow(max(dot(n,normalize(v+normalize(vec3(-.55,.8,.8)))),0.),85.);
vec3 pearl=mix(vec3(.99,.855,.755),vec3(.90,.865,.955),n.y*.5+.5);
float body=pow(nv,.65);
vec3 col=mix(vec3(.99,.975,.95),pearl,.25+f*.32);
col=mix(col,vec3(.96,.85,.78),body*.10);
col=mix(col,vec3(.72,.68,.73),shade*(.05+f*.16)+rim*.22+under*.20);
col+=soft*.025;col=mix(col,vec3(1.),clamp((light*.72+glint*.92)*uShine,0.,1.));
float alpha=.10+body*.10+f*.18+rim*.23+under*.17+shade*f*.07+light*(.12+f*.25)+glint*.45;
if(!gl_FrontFacing)alpha*=.16;
gl_FragColor=vec4(col,clamp(alpha,0.,.78));}
`,
  });

  const blobs = new MarchingCubes(mobile ? 56 : 88, material, false, false, 140000);
  blobs.isolation = 65;
  scene.add(blobs);

  /* 모든 방울이 하나의 필드를 공유 → 닿으면 하나의 면으로 이어진다 */
  const satellites = [[-.93, .58, .14], [-1.08, -.12, .10], [1.02, -.38, .19], [.66, -1.02, .12]].map(([x, y, r], i) => ({
    homeX: x, homeY: y, x, y, r, phase: i * 1.8, vx: 0, vy: 0, caught: false, attraction: 0,
  }));
  const fieldPoint = new THREE.Vector3();
  function addWorldBall(x, y, z, strength, subtract = 12) {
    fieldPoint.set(x, y, z); blobs.worldToLocal(fieldPoint);
    blobs.addBall(.5 + fieldPoint.x / 2, .5 + fieldPoint.y / 2, .5 + fieldPoint.z / 2, strength, subtract);
  }
  function floatSatellites(dt, px, py, cursorVisible) {
    satellites.forEach((d, i) => {
      const partner = satellites[i ^ 1];
      const cluster = reduced ? 0 : Math.pow((1 + Math.sin(time * .40 + Math.floor(i / 2) * 2.7)) / 2, 3) * .90;
      const homeX = d.homeX + (partner.homeX - d.homeX) * cluster * .5;
      const homeY = d.homeY + (partner.homeY - d.homeY) * cluster * .5;
      const distance = Math.hypot(d.x - px, d.y - py);
      if (!pointer.active || !cursorVisible) d.caught = false;
      else if (distance < (d.caught ? 1.05 : .60)) d.caught = true;
      else d.caught = false;
      if (!paused) {
        d.attraction += ((d.caught ? 1 : 0) - d.attraction) * (1 - Math.exp(-dt * 4));
        const tx = THREE.MathUtils.lerp(homeX + Math.sin(time * .34 + d.phase) * .045, px + Math.cos(d.phase) * .035, d.attraction);
        const ty = THREE.MathUtils.lerp(homeY + Math.sin(time * .43 + d.phase) * .07, py + Math.sin(d.phase) * .035, d.attraction);
        d.vx += ((tx - d.x) * 12 - d.vx * 5.5) * dt; d.vy += ((ty - d.y) * 12 - d.vy * 5.5) * dt;
        d.x += d.vx * dt; d.y += d.vy * dt;
      }
      addWorldBall(d.x, d.y, 0, 77 * Math.pow(d.r / 4.5, 2));
    });
  }

  let target = 1, collect = 1, velocity = 0, paused = reduced, visible = true, time = 0, last = 0;
  const pointer = { x: 0, y: 0, sx: 0, sy: 0, active: 0, force: 0 };

  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = width < 650 ? 7.6 : 5.2;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host); resize();

  /* 캔버스는 클릭을 막지 않으므로, 좌표는 무대 영역에서 받아 캔버스 기준으로 바꾼다 */
  function move(e) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width - .5) * 2;
    pointer.y = -((e.clientY - rect.top) / rect.height - .5) * 2;
    pointer.active = 1;
  }
  function leave() { pointer.active = 0; }
  function touchEnd(e) { if (e.pointerType !== 'mouse') leave(); }
  stage.addEventListener('pointermove', move);
  stage.addEventListener('pointerleave', leave);
  stage.addEventListener('pointerdown', move);
  stage.addEventListener('pointerup', touchEnd);

  const seeds = [[-.24, .12, .26], [.22, .08, .22], [.04, -.24, .21]];
  function draw(dt) {
    velocity += ((target - collect) * 3.2 - velocity * 3.0) * dt; collect += velocity * dt;
    const ease = 1 - Math.exp(-dt * 4);
    pointer.sx += (pointer.x - pointer.sx) * ease; pointer.sy += (pointer.y - pointer.sy) * ease;
    pointer.force += (pointer.active - pointer.force) * (1 - Math.exp(-dt * 3));
    blobs.reset();
    blobs.addBall(.5, .5, .5, .78, 12);
    seeds.forEach(([x, y, s], i) => {
      const spread = 1 - .70 * Math.min(1, Math.max(0, collect));
      const wobble = Math.sin(time * .42 + i * 1.9) * .014;
      blobs.addBall(.5 + x * spread + wobble + pointer.sx * .025 * collect,
        .5 + y * spread + Math.cos(time * .38 + i) * .014 + pointer.sy * .025 * collect,
        .5 + Math.sin(time * .4 + i) * .025, s + (collect * .015), 14);
    });
    /* 화면 좌표 → 카메라 평면 → 공유 필드 */
    const halfH = camera.position.z * Math.tan(19 * Math.PI / 180);
    const px = pointer.sx * halfH * camera.aspect, py = pointer.sy * halfH;
    const edge = Math.max(Math.abs(px), Math.abs(py));
    const cursorVisible = 1 - THREE.MathUtils.smoothstep(edge, 1.50, 1.78);
    blobs.scale.set(2.25 * (1 + velocity * .035), 2.25 * (1 - velocity * .035), 2.25);
    blobs.rotation.z = Math.sin(time * .16) * .035; blobs.updateMatrixWorld(true);
    if (pointer.force > .002 && cursorVisible > 0) addWorldBall(px, py, 0, .20 * pointer.force * cursorVisible);
    floatSatellites(dt, px, py, cursorVisible > .1);
    blobs.update(); renderer.render(scene, camera);
  }

  function loop(stamp) {
    requestAnimationFrame(loop);
    const dt = Math.min((stamp - last) / 1000, .05) || .016; last = stamp;
    if (!visible || document.hidden) return;
    if (!paused) time += dt;
    if (!paused || Math.abs(target - collect) > .001 || Math.abs(velocity) > .001) draw(dt);
  }
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }).observe(host);
  if (reduced) collect = 1;
  draw(.016);
  host.classList.add('is-ready');
  requestAnimationFrame(loop);
}
