// Generated props (Higgsfield stills + looping clips) as flat cards in the shared 3D views.
// A card shows the keyed still at once and swaps to its looping clip when that has loaded.
// Clips are "stacked" H.264: colour in the top half, matte in the bottom half (works in Safari too).
import * as THREE from 'three';

const vert = /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const fragStill = /* glsl */`uniform sampler2D map; uniform float fade; varying vec2 vUv;
  void main() { vec4 c = texture2D(map, vUv); gl_FragColor = vec4(c.rgb, c.a * fade); }`;
const fragStack = /* glsl */`uniform sampler2D map; uniform float fade; varying vec2 vUv;
  void main() {
    vec3 c = texture2D(map, vec2(vUv.x, 0.5 + vUv.y * 0.5)).rgb;
    float a = texture2D(map, vec2(vUv.x, vUv.y * 0.5)).g;
    gl_FragColor = vec4(c, a * fade);
  }`;

let manifest = null;
export async function loadProps() {
  manifest ??= await fetch('assets/props/props.json').then((r) => r.json());
  return manifest;
}

/** returns a Group holding a card of height `height` (world units); call .tick() each frame */
export function propCard(name, info, height) {
  const g = new THREE.Group();
  const w = height * info.w / info.h;
  const geo = new THREE.PlaneGeometry(w, height);
  const still = new THREE.TextureLoader().load(`assets/props/${name}.webp`);
  still.colorSpace = THREE.NoColorSpace;
  const stillMat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: fragStill, uniforms: { map: { value: still }, fade: { value: 1 } }, transparent: true, depthWrite: false });
  const card = new THREE.Mesh(geo, stillMat);
  g.add(card);
  g.card = card;
  g.video = null;
  if (info.loop) {
    const v = document.createElement('video');
    Object.assign(v, { muted: true, loop: true, playsInline: true, preload: 'auto', crossOrigin: 'anonymous' });
    v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
    v.src = `assets/props/${info.loop}`;
    const tex = new THREE.VideoTexture(v);
    tex.colorSpace = THREE.NoColorSpace; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
    const vidMat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: fragStack, uniforms: { map: { value: tex }, fade: { value: 1 } }, transparent: true, depthWrite: false });
    // swap once a real frame exists: 'playing' on the site, 'seeked' under the frame-exact recorder
    const show = () => { if (v.readyState >= 2) card.material = vidMat; };
    v.addEventListener('playing', show);
    v.addEventListener('seeked', () => { tex.needsUpdate = true; show(); });
    g.video = v;
    (window.__props ??= []).push(v);
  }
  /** play only while the card is on screen */
  g.setActive = (on) => {
    const v = g.video;
    if (!v) return;
    if (on && v.paused) v.play().catch(() => {});
    if (!on && !v.paused) v.pause();
  };
  return g;
}
