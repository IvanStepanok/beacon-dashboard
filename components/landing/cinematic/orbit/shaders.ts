/* Shared GLSL for the film: fresnel atmosphere, value-noise fbm, cloud puffs
   and the beacon beam — used by both the orbit globe and the city flight. */

export const ATMO_VERT = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const ATMO_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uCoef;
  uniform float uPower;
  uniform float uOpacity;
  varying vec3 vNormal;
  void main() {
    float intensity = pow(max(uCoef - dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), uPower);
    gl_FragColor = vec4(uColor, 1.0) * intensity * uOpacity;
  }
`;

export const NOISE_GLSL = /* glsl */ `
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float vnoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      s += a * vnoise(p);
      p *= 2.17;
      a *= 0.5;
    }
    return s;
  }
`;

export const CLOUD_SPHERE_VERT = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const CLOUD_SPHERE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uCover;
  uniform float uOpacity;
  uniform vec3 uColor;
  varying vec3 vPos;
  ${NOISE_GLSL}
  void main() {
    vec3 dir = normalize(vPos);
    float n = fbm(dir * 3.4 + vec3(uTime * 0.022, 0.0, uTime * 0.014));
    float thresh = mix(0.62, 0.42, uCover);
    float a = smoothstep(thresh, thresh + 0.26, n);
    gl_FragColor = vec4(uColor, a * uOpacity);
  }
`;

export const PUFF_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const PUFF_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uSeed;
  varying vec2 vUv;
  ${NOISE_GLSL}
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float mask = smoothstep(1.0, 0.3, d);
    float n = fbm(vec3(vUv * 3.0 + uSeed, uTime * 0.05 + uSeed));
    float a = mask * smoothstep(0.3, 0.72, n + mask * 0.3);
    gl_FragColor = vec4(vec3(0.94, 0.97, 1.0), a * uOpacity);
  }
`;

export const BEAM_FRAG = /* glsl */ `
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float a = pow(1.0 - vUv.y, 2.2) * uOpacity;
    vec3 c = mix(vec3(1.0, 0.45, 0.32), vec3(1.0, 0.84, 0.76), vUv.y);
    gl_FragColor = vec4(c, a);
  }
`;
