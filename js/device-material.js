/* =========================================================
   TechFit 3D 재질 정리
   Meshy 텍스처는 조각마다 명암·긁힘이 구워져 있어 돌릴 때 상처처럼 보인다.
   그래서 색·광택을 텍스처 대신 '기기 표면 위치'로 정한다.
     · 헤드(위쪽 캡) · 정면 버튼 패널과 은색 띠 · 뒷면 띠 → 은색 금속
     · 정면 화면, 버튼 아이콘                         → 원본 텍스처 그대로
     · 나머지 본체                                      → 균일한 흰색
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
        .replace('#include <common>', '#include <common>\nvarying vec3 vObj;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
varying vec3 vObj;
uniform float uHalf, uCy;
float gSilver, gScreen;
float band(float v, float lo, float hi, float e) { return smoothstep(lo - e, lo + e, v) * (1.0 - smoothstep(hi - e, hi + e, v)); }`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  float e = 0.006;
  float y = (vObj.y - uCy) / uHalf;                    /* -1 아래 끝 ~ 1 위 끝 */
  float a = abs(atan(vObj.x, vObj.z)) / PI;           /* 0 정면 가운데 ~ 1 뒷면 가운데 */
  float head = smoothstep(0.6875 - e, 0.6875 + e, y);
  float screen = (1.0 - smoothstep(0.133 - e, 0.133 + e, a)) * band(y, 0.344, 0.667, e) * (1.0 - head);
  float hw = y >= 0.139 ? 0.135 : 0.042 + 0.093 * smoothstep(0.0, 0.139, y);
  float front = (1.0 - smoothstep(hw - e, hw + e, a)) * (1.0 - head) * (1.0 - screen);
  float back = smoothstep(0.96 - e, 0.96 + e, a) * (1.0 - head);
  float silver = clamp(head + front + back, 0.0, 1.0);
  float white = clamp(1.0 - silver - screen, 0.0, 1.0);
  float texL = dot(diffuseColor.rgb, vec3(0.3333));
  float icon = front * step(0.139, y) * (1.0 - smoothstep(0.15, 0.4, texL));    /* 버튼 아이콘 선 */
  /* 'TECH FIT' 세로 글자 — 아래쪽, 정면·뒷면 띠 오른쪽 */
  float zone = band(y, -0.87, -0.61, 0.02) * max(band(a, 0.03, 0.18, 0.015), band(a, 0.8, 0.95, 0.015));
  float text = zone * white * (1.0 - smoothstep(0.5, 0.8, texL));
  vec3 col = white * vec3(0.855, 0.855, 0.84) + silver * vec3(0.55, 0.56, 0.58);
  diffuseColor.rgb = mix(col, diffuseColor.rgb * 0.45, clamp(icon + text, 0.0, 1.0));
  diffuseColor.rgb = mix(diffuseColor.rgb, sampledDiffuseColor.rgb, screen);
  gSilver = silver * (1.0 - icon); gScreen = screen;
}`)
        .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
metalnessFactor = gSilver * 0.85;
roughnessFactor = mix(mix(0.34, 0.28, gSilver), 0.12, gScreen);`);
    };
    m.needsUpdate = true;
  });
}
