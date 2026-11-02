// Shared 3D kit: palette, carved low-poly materials, the crew's lighting (warm key + teal rim),
// and one offscreen renderer that draws many small scenes and copies each into its own 2D canvas,
// so the page needs only a few WebGL contexts.
import * as THREE from 'three';

export const C = {
  orange: 0xF8873F, orangeDeep: 0xE06A26, bone: 0xF2E2C6, ink: 0x1D1A16, amber: 0xF2BE4C,
  slate: 0x17222D, slate2: 0x243643, teal: 0x62B4BC, concrete: 0xB7B0A4, steel: 0xA2412A,
  iron: 0x3B3936, wood: 0xB57A45, glass: 0x2D4A56, red: 0xE5482E, green: 0x47C07A, white: 0xEDE6DA,
};

export function mat(color, o = {}) {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.82, metalness: 0.0, ...o });
}

// hash-based jitter: identical positions get identical offsets, so seams never crack
function hash3(x, y, z) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
export function carve(geo, amt = 0.03, axes = [1, 1, 1]) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = (v) => +v.toFixed(4);
    const h1 = hash3(k(x), k(y), k(z)), h2 = hash3(k(y) + 3.1, k(z), k(x)), h3 = hash3(k(z) + 7.7, k(x), k(y));
    p.setXYZ(i, x + (h1 - 0.5) * amt * axes[0], y + (h2 - 0.5) * amt * axes[1], z + (h3 - 0.5) * amt * axes[2]);
  }
  geo.computeVertexNormals();
  return geo;
}

export function addLights(scene, { key = 2.4, rim = 2.2, fill = 0.75 } = {}) {
  const hemi = new THREE.HemisphereLight(0xffe2c4, 0x2a2420, fill);
  const k = new THREE.DirectionalLight(0xffb27a, key); k.position.set(-6, 5, 7);
  const r = new THREE.DirectionalLight(0x6fd3dc, rim); r.position.set(7, 3, -6);
  const f = new THREE.DirectionalLight(0xffffff, 0.35); f.position.set(0, 2, 9);
  scene.add(hemi, k, r, f);
  return { hemi, key: k, rim: r };
}

/** One WebGL renderer, many 2D canvases. view = { canvas, scene, camera, update(dt, t), active() } */
export class Views {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.r = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true, preserveDrawingBuffer: false });
    this.r.outputColorSpace = THREE.SRGBColorSpace;
    this.r.toneMapping = THREE.ACESFilmicToneMapping;
    this.r.toneMappingExposure = 1.05;
    this.r.setClearColor(0x000000, 0);
    this.r.setPixelRatio(1);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.list = [];
    this.size = [1, 1];
    this.clock = new THREE.Clock();
    this.t = 0;
    const loop = () => {
      const dt = Math.min(this.clock.getDelta(), 1 / 20);
      this.t += dt;
      for (const v of this.list) if (v.visible && (!v.active || v.active())) this.draw(v, dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  add(v) {
    v.ctx = v.canvas.getContext('2d');
    v.visible = false;
    new IntersectionObserver(([e]) => { v.visible = e.isIntersecting; }, { rootMargin: '100px' }).observe(v.canvas);
    const fit = () => {
      const w = Math.max(1, Math.round(v.canvas.clientWidth * this.dpr)), h = Math.max(1, Math.round(v.canvas.clientHeight * this.dpr));
      v.canvas.width = w; v.canvas.height = h; v.w = w; v.h = h;
      if (v.camera.isPerspectiveCamera) { v.camera.aspect = w / h; v.camera.updateProjectionMatrix(); }
      v.resize?.(w, h);
      if (v.still) { v.dirty = true; }
    };
    new ResizeObserver(fit).observe(v.canvas);
    fit();
    this.list.push(v);
    return v;
  }

  ensure(w, h) {
    if (w > this.size[0] || h > this.size[1]) {
      this.size = [Math.max(w, this.size[0]), Math.max(h, this.size[1])];
      this.r.setSize(this.size[0], this.size[1], false);
    }
  }

  draw(v, dt) {
    if (v.still && !v.dirty) return;
    v.update?.(dt, this.t);
    this.ensure(v.w, v.h);
    const [W, H] = this.size;
    this.r.setViewport(0, H - v.h, v.w, v.h);
    this.r.setScissor(0, H - v.h, v.w, v.h);
    this.r.setScissorTest(true);
    this.r.clear();
    this.r.render(v.scene, v.camera);
    v.ctx.clearRect(0, 0, v.w, v.h);
    v.ctx.drawImage(this.canvas, 0, 0, v.w, v.h, 0, 0, v.w, v.h);
    v.after?.(v.ctx);
    v.dirty = false;
  }
}
