// "Draft" shading: every surface is either MATTER (lit PBR) or DRAWING (ink on paper).
// The split is decided per-fragment by draftMask(): above the object's sweep plane,
// inside the cursor lens, or everywhere in Plan mode → drawing.

export const DRAFT_COMMON = /* glsl */ `
uniform vec3 uLens;      // xy: lens centre in device px (bottom-left origin), z: radius in device px
uniform float uPlan;     // 1 = everything is drawing
uniform float uTime;
uniform float uSweepY;   // world-space height of this object's cutting plane (drawing above)
uniform vec3 uInk;
uniform vec3 uPencil;
uniform float uPx;       // device pixel ratio

float dHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float dNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(dHash(i), dHash(i + vec2(1, 0)), u.x),
             mix(dHash(i + vec2(0, 1)), dHash(i + vec2(1, 1)), u.x), u.y);
}

// x: 1 = drawing, 0 = matter · y: scan-band intensity at the sweep plane
vec2 draftMask(vec3 wp, vec2 fc) {
  float n = (dNoise(wp.xz * 9.0 + uTime * 0.35) - 0.5) * 0.035;
  float d = wp.y - (uSweepY + n);
  float sweep = step(0.0, d);
  float band = 1.0 - smoothstep(0.0, 0.016, abs(d));
  float lens = 1.0 - step(uLens.z, distance(fc, uLens.xy));
  return vec2(max(max(sweep, lens), uPlan), band * (1.0 - uPlan));
}
`;

/* ---------------- matter (CSM over MeshPhysicalMaterial) ---------------- */

export const MATTER_VERT = /* glsl */ `
varying vec3 vWP;
varying vec3 vWN;
varying vec2 vUvM;
void main() {
  vWP = (modelMatrix * vec4(position, 1.0)).xyz;
  vWN = normalize(mat3(modelMatrix) * normal);
  vUvM = uv;
}
`;

export const MATTER_FRAG = /* glsl */ `
${DRAFT_COMMON}
uniform sampler2D uMapA;
uniform sampler2D uArmA;
uniform sampler2D uMapB;
uniform sampler2D uArmB;
uniform vec3 uColA;
uniform vec3 uColB;
uniform vec4 uA;    // x tile (m), y roughness, z metalness, w detail strength
uniform vec4 uA2;   // x avg luminance, y rotate uv, z clearcoat
uniform vec4 uB;
uniform vec4 uB2;
uniform vec3 uBleedHit;
uniform float uBleed;
uniform float uBleedR;
uniform float uFinish;  // roughness multiplier from finish (matte / satin / gloss)
uniform float uGloss;   // extra clearcoat from finish
varying vec3 vWP;
varying vec3 vWN;
varying vec2 vUvM;

vec3 surf(sampler2D map, sampler2D arm, vec3 col, vec4 p, vec4 p2, out float rough) {
  vec2 uv = vUvM / p.x;
  if (p2.y > 0.5) uv = uv.yx;
  vec3 t = texture2D(map, uv).rgb;
  float lum = dot(t, vec3(0.2126, 0.7152, 0.0722)) / max(p2.x, 0.01);
  float g = texture2D(arm, uv).g / 0.5;
  rough = clamp(p.y * mix(1.0, g, p.w * 0.6), 0.04, 1.0);
  return col * mix(1.0, lum, p.w);
}

void main() {
  float rA, rB;
  vec3 cA = surf(uMapA, uArmA, uColA, uA, uA2, rA);
  vec3 cB = surf(uMapB, uArmB, uColB, uB, uB2, rB);

  // ink-bleed: B spreads from the drop point with a noisy, darker wet front
  float nb = dNoise(vWP.xz * 26.0) * 0.6 + dNoise(vWP.xy * 41.0 + 7.0) * 0.4;
  float dist = distance(vWP, uBleedHit) + (nb - 0.5) * 0.07;
  float front = uBleed * uBleedR;
  float mB = 1.0 - smoothstep(front - 0.01, front, dist);
  float wet = smoothstep(front - 0.06, front, dist) * mB * step(0.0001, uBleed) * (1.0 - step(0.9999, uBleed));

  csm_DiffuseColor = vec4(mix(cA, cB, mB) * (1.0 - wet * 0.5), 1.0);
  csm_Roughness = clamp(mix(rA, rB, mB) * uFinish - wet * 0.35, 0.03, 1.0);
  csm_Metalness = mix(uA.z, uB.z, mB);
  csm_Clearcoat = clamp(mix(uA2.z, uB2.z, mB) + uGloss, 0.0, 1.0);

  // drawing: transparent paper (alpha 0 punches through to the CSS paper) + hatching
  vec2 dm = draftMask(vWP, gl_FragCoord.xy);
  float ndl = dot(normalize(vWN), normalize(vec3(-0.45, 0.8, 0.45)));
  float shade = 0.5 - 0.5 * ndl;
  float sp = 6.0 * uPx;
  float fw = 1.5 / sp;
  float l1 = abs(fract((gl_FragCoord.x + gl_FragCoord.y) / sp) - 0.5) * 2.0;
  float l2 = abs(fract((gl_FragCoord.x - gl_FragCoord.y) / sp) - 0.5) * 2.0;
  float w1 = smoothstep(0.38, 0.8, shade) * 0.3;
  float w2 = smoothstep(0.62, 0.95, shade) * 0.24;
  float h = max(smoothstep(1.0 - w1 - fw, 1.0 - w1, l1) * step(0.01, w1),
                smoothstep(1.0 - w2 - fw, 1.0 - w2, l2) * step(0.01, w2));
  float a = h * 0.7;
  csm_FragColor = vec4(uInk * a, a);
  csm_UnlitFac = dm.x;
  csm_Emissive = uPencil * dm.y * 2.5;
}
`;

/* ---------------- inverted hull: silhouette ink while drawing ---------------- */

export const HULL_VERT = /* glsl */ `
uniform float uWidth;   // device px
uniform vec2 uRes;      // drawing buffer size
varying vec3 vWP;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz;
  vec4 clip = projectionMatrix * viewMatrix * wp;
  vec3 nv = normalize(mat3(viewMatrix) * normalize(mat3(modelMatrix) * normal));
  vec2 dir = (projectionMatrix * vec4(nv, 0.0)).xy;
  dir = normalize(dir + 1e-6);
  clip.xy += dir * uWidth / uRes * 2.0 * clip.w;
  gl_Position = clip;
}
`;

export const HULL_FRAG = /* glsl */ `
${DRAFT_COMMON}
varying vec3 vWP;
void main() {
  vec2 dm = draftMask(vWP, gl_FragCoord.xy);
  if (dm.x < 0.5) discard;
  gl_FragColor = vec4(mix(uInk, uPencil, dm.y), 1.0);
  #include <colorspace_fragment>
}
`;

/* ---------------- edge lines: LineMaterial patch ---------------- */

export function patchLineShader(material) {
  material.vertexShader = material.vertexShader
    .replace("void main() {", "varying vec3 vWP;\nvoid main() {\n vWP = (modelMatrix * vec4(position.y < 0.5 ? instanceStart : instanceEnd, 1.0)).xyz;");
  material.fragmentShader = material.fragmentShader
    .replace("#include <clipping_planes_pars_fragment>", `#include <clipping_planes_pars_fragment>\n${DRAFT_COMMON}\nvarying vec3 vWP;`)
    .replace(
      "float alpha = opacity;",
      "vec2 dm = draftMask(vWP, gl_FragCoord.xy);\n if (dm.x < 0.5) discard;\n float alpha = opacity;"
    )
    .replace("vec4 diffuseColor = vec4( diffuse, alpha );", "vec4 diffuseColor = vec4( mix(uInk, uPencil, dm.y), alpha );");
}
