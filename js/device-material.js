/* =========================================================
   TechFit 3D 재질 정리
   Meshy 텍스처는 조각마다 명암·긁힘이 구워져 있어 돌릴 때 상처처럼 보인다.
   그래서 색·광택을 텍스처 대신 '기기 표면 위치'로 정한다.
     · 헤드(위쪽 캡) · 정면 버튼 패널과 은색 띠       → 은색 금속
     · 헤드 윗면 3×3 LED 원 · 뒷면 아래 USB-C 단자판  → 실제 제품 사진 기준으로 그림
     · 정면 화면, 버튼 아이콘, TECH FIT 글자          → 원본 텍스처 그대로
     · 나머지 본체 (뒷면 가운데 가는 이음선)           → 균일한 흰색
   위치 기준은 모델 높이를 -1~1로 본 값 (tools/repaint_glb.py와 같은 수치).
   ========================================================= */
export function cleanDeviceMaterial(model, THREE) {
  const box = new THREE.Box3().setFromObject(model);
  const half = (box.max.y - box.min.y) / 2;
  const cy = (box.max.y + box.min.y) / 2;

  model.traverse(o => {
    if (!o.isMesh) return;
    const m = o.material;
    m.normalMap = null;           /* 조각 테두리가 새겨진 노멀맵은 끈다 */
    m.metalnessMap = null;
    m.roughnessMap = null;
    m.metalness = 1; m.roughness = 1;
    m.onBeforeCompile = sh => {
      sh.uniforms.uHalf = { value: half };
      sh.uniforms.uCy = { value: cy };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vObj;\nvarying vec3 vObjN;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;\nvObjN = normal;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
varying vec3 vObj;
varying vec3 vObjN;
uniform float uHalf, uCy;
float gSilver, gScreen;
float band(float v, float lo, float hi, float e) { return smoothstep(lo - e, lo + e, v) * (1.0 - smoothstep(hi - e, hi + e, v)); }
float rbox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  float e = 0.006;
  float y = (vObj.y - uCy) / uHalf;                    /* -1 아래 끝 ~ 1 위 끝 */
  float a = abs(atan(vObj.x, vObj.z)) / PI;           /* 0 정면 가운데 ~ 1 뒷면 가운데 */
  float head = smoothstep(0.6875 - e, 0.6875 + e, y);
  float screen = (1.0 - smoothstep(0.133 - e, 0.133 + e, a)) * band(y, 0.344, 0.667, e) * (1.0 - head);
  float hw = y >= 0.139 ? 0.135 : 0.042 + 0.093 * smoothstep(0.0, 0.139, y);
  float front = (1.0 - smoothstep(hw - e, hw + e, a)) * (1.0 - head) * (1.0 - screen);
  float x = vObj.x / uHalf, z = vObj.z / uHalf;
  bool isBack = z < 0.0;
  /* 뒷면 아래 USB-C 단자판 (은색) 과 단자 구멍 */
  float plate = isBack ? 1.0 - smoothstep(-0.004, 0.004, rbox(vec2(x, y + 0.84), vec2(0.075, 0.17), 0.006)) : 0.0;
  float port = isBack ? 1.0 - smoothstep(-0.004, 0.004, rbox(vec2(x, y + 0.745), vec2(0.05, 0.022), 0.02)) : 0.0;
  float portIn = isBack ? 1.0 - smoothstep(-0.003, 0.003, rbox(vec2(x, y + 0.745), vec2(0.036, 0.009), 0.009)) : 0.0;
  /* 뒷면 가운데 가는 이음선 */
  float seam = isBack ? (1.0 - smoothstep(0.0015, 0.0035, abs(x))) * (1.0 - head) * (1.0 - plate) : 0.0;
  /* 헤드 윗면 3×3 LED 원 */
  float top = smoothstep(0.75, 0.9, normalize(vObjN).y) * head;
  vec2 g = vec2(x, z) / 0.07;
  vec2 cell = clamp(floor(g + 0.5), -1.0, 1.0);
  float dot9 = top * (1.0 - smoothstep(0.018, 0.025, length(vec2(x, z) - cell * 0.07)));
  float silver = clamp(head + front + plate, 0.0, 1.0) * (1.0 - dot9);
  float white = clamp(1.0 - silver - screen - dot9, 0.0, 1.0);
  float texL = dot(diffuseColor.rgb, vec3(0.3333));
  float icon = front * step(0.139, y) * (1.0 - smoothstep(0.15, 0.4, texL));    /* 버튼 아이콘 선 */
  /* 'TECH FIT' 세로 글자 — 정면 아래쪽, 띠 오른쪽 */
  float zone = band(y, -0.87, -0.61, 0.02) * band(a, 0.03, 0.18, 0.015);
  float text = zone * white * (1.0 - smoothstep(0.5, 0.8, texL));
  vec3 col = white * vec3(0.855, 0.855, 0.84) + silver * vec3(0.55, 0.56, 0.58) + dot9 * vec3(0.92);
  col = mix(col, vec3(0.45), seam * 0.8);
  col = mix(col, vec3(0.62), port);                 /* 단자 테두리 */
  col = mix(col, vec3(0.03), portIn);               /* 단자 안쪽 */
  diffuseColor.rgb = mix(col, diffuseColor.rgb * 0.45, clamp(icon + text, 0.0, 1.0));
  diffuseColor.rgb = mix(diffuseColor.rgb, sampledDiffuseColor.rgb, screen);
  silver *= (1.0 - port);
  gSilver = silver * (1.0 - icon); gScreen = screen;
}`)
        .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
metalnessFactor = gSilver * 0.7;
roughnessFactor = mix(mix(0.34, 0.42, gSilver), 0.12, gScreen);`);
    };
    m.needsUpdate = true;
  });
}
