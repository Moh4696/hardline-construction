// The crew: a headless body plate plus one deformable head/neck mesh per man.
// Necks stretch (spring, so the heads pop up) and bend toward the cursor; heads turn on a
// shallow paraboloid so the nose travels further than the ears. All geometry is in plate px
// (see tools/crew_geometry.json) and mapped to canvas px with one scale + offset.
import * as THREE from 'three';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

const YAW_MAX = 0.42;     // rad
const PITCH_MAX = 0.22;   // rad
const BEND = 0.30;        // max sideways lean of the chin, as a share of the neck length
const DOME = 0.55;        // dome depth as a share of the head's x radius (keeps the turn fold-free)
const HEAD_ROWS = 30, NECK_ROWS = 26, COLS = 22;

function loadTexture(url) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(url, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.premultiplyAlpha = true;
      t.anisotropy = 4;
      resolve(t);
    }, undefined, reject);
  });
}

export class Crew {
  /**
   * @param {HTMLElement} el   container with a <canvas class="crew__canvas">
   * @param {object} data      crew.json
   * @param {object} opts      { base, fit(W, H, data) -> {s, ox, oy}, extScale, onHover(i), tags }
   */
  constructor(el, data, opts) {
    this.el = el; this.data = data; this.opts = opts;
    this.canvas = el.querySelector('.crew__canvas');
    this.men = data.men.map((m, i) => ({
      ...m, i,
      rest: m.ext,           // resting neck extension (plate px)
      ext: 0, extV: 0, extTarget: 0,
      yaw: 0, pitch: 0, bend: 0,
      idleT: 0, idleAt: null,
    }));
    this.pointer = { x: 0, y: 0, active: false, last: -1e9 };
    this.focus = null;          // {x, y} in canvas px overrides the pointer (e.g. a hovered button)
    this.extra = 0;             // extra neck length shared by all (scroll)
    this.intro = 0;             // 0..1 multiplier on the resting extension
    this.hovered = -1;
    this.visible = false;
    this.time = 0;
  }

  async init() {
    const r = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true, premultipliedAlpha: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, 1, 0, -1, -4000, 4000);

    const base = this.opts.base;
    const [bodyTex, ...headTex] = await Promise.all([
      loadTexture(base + this.data.body),
      ...this.men.map((m) => loadTexture(base + m.src)),
    ]);
    const [PW, PH] = this.data.plate;
    this.body = new THREE.Mesh(
      new THREE.PlaneGeometry(PW, PH),
      new THREE.MeshBasicMaterial({ map: bodyTex, transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false }),
    );
    this.body.renderOrder = 0;
    this.scene.add(this.body);

    this.men.forEach((m, i) => this.buildHead(m, headTex[i]));
    this.resize();
    new ResizeObserver(() => this.resize()).observe(this.el);
    new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; }, { rootMargin: '120px' }).observe(this.el);

    window.addEventListener('pointermove', (e) => this.onPointer(e), { passive: true });
    window.addEventListener('pointerdown', (e) => this.onPointer(e), { passive: true });
    this.clock = new THREE.Clock();
    const loop = () => {
      this.rawDt = Math.min(this.clock.getDelta(), 0.5);
      const dt = Math.min(this.rawDt, 1 / 20);
      if (this.visible) { this.tick(dt); r.render(this.scene, this.camera); }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return this;
  }

  buildHead(m, tex) {
    const [bx, by, bw, bh] = m.box;
    // rows: dense in the neck band, which gets stretched many times its length
    const ys = [];
    for (let k = 0; k < HEAD_ROWS; k++) ys.push(by + (m.chin - 12 - by) * (k / HEAD_ROWS));
    for (let k = 0; k <= NECK_ROWS; k++) ys.push(m.chin - 12 + (by + bh - (m.chin - 12)) * (k / NECK_ROWS));
    const xs = []; for (let k = 0; k <= COLS; k++) xs.push(bx + bw * (k / COLS));
    const nv = xs.length * ys.length;
    const src = new Float32Array(nv * 2), pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2);
    let n = 0;
    for (const y of ys) for (const x of xs) {
      src[n * 2] = x; src[n * 2 + 1] = y;
      uv[n * 2] = (x - bx) / bw; uv[n * 2 + 1] = 1 - (y - by) / bh;
      n++;
    }
    const idx = [];
    const W = xs.length;
    for (let r = 0; r < ys.length - 1; r++) for (let c = 0; c < W - 1; c++) {
      const a = r * W + c, b = a + 1, d = a + W, e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx);
    const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex, transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false }));
    mesh.renderOrder = 1 + m.i;
    mesh.frustumCulled = false;
    this.scene.add(mesh);
    m.mesh = mesh; m.src2 = src; m.pos = pos;
    const [, , rx] = m.head;
    m.L = m.seam - m.chin;
    m.depth = DOME * rx;
  }

  resize() {
    const W = this.el.clientWidth, H = this.el.clientHeight;
    if (!W || !H) return;
    this.W = W; this.H = H;
    this.renderer.setSize(W, H, false);
    Object.assign(this.camera, { left: 0, right: W, top: 0, bottom: -H });
    this.camera.updateProjectionMatrix();
    const L = this.layout = this.opts.fit(W, H, this.data);
    const [PW, PH] = this.data.plate;
    this.body.scale.set(L.s, L.s, 1);
    this.body.position.set(L.ox + PW * L.s / 2, -(L.oy + PH * L.s / 2), 0);
    this.opts.onLayout?.(this);
  }

  toCanvas(x, y) { const L = this.layout; return [L.ox + x * L.s, L.oy + y * L.s]; }

  onPointer(e) {
    const r = this.el.getBoundingClientRect();
    this.pointer.x = e.clientX - r.left; this.pointer.y = e.clientY - r.top;
    this.pointer.active = true; this.pointer.last = this.time;
  }

  restExt(m) { return m.ext0 ?? m.rest; }

  headCenter(m) {
    const [cx, cy] = m.head;
    return this.toCanvas(cx + m.bend, cy - m.ext);
  }

  tick(dt) {
    this.time += dt;
    const t = this.time;
    const L = this.layout;
    const extScale = this.opts.extScale ?? 1;
    const p = this.pointer;
    const pointerLive = p.active && t - p.last < 4;

    // which man is under the pointer (by column split, within the group's height)
    let hov = -1;
    if (pointerLive && !this.focus) {
      const px = (p.x - L.ox) / L.s, py = (p.y - L.oy) / L.s;
      if (py > -500 && py < this.data.group[1]) {
        this.men.forEach((m) => { if (px >= m.split[0] && px < m.split[1]) hov = m.i; });
      }
    }
    if (hov !== this.hovered) { this.hovered = hov; this.opts.onHover?.(hov); }

    for (const m of this.men) {
      // --- targets
      const restE = this.restExt(m) * extScale * this.intro + this.extra * (0.8 + 0.1 * m.i);
      m.extTarget = restE + (hov === m.i ? 70 : 0) + Math.sin(t * 1.3 + m.i * 1.7) * 4;
      let tx, ty, look = true;
      if (this.focus) { tx = this.focus.x; ty = this.focus.y; }
      else if (pointerLive) { tx = p.x; ty = p.y; }
      else {
        // idle: look at the viewer, or glance at a neighbour now and then
        if (!m.idleAt || t > m.idleT) {
          m.idleT = t + 1.6 + Math.random() * 2.4;
          const r = Math.random();
          m.idleAt = r < 0.45 ? null : (r < 0.72 ? Math.max(0, m.i - 1) : Math.min(3, m.i + 1));
          if (m.idleAt === m.i) m.idleAt = null;
        }
        if (m.idleAt === null) look = false;
        else { const o = this.men[m.idleAt]; [tx, ty] = this.headCenter(o); }
      }
      let yawT = 0, pitchT = 0, bendT = 0;
      if (look) {
        const [hx, hy] = this.headCenter(m);
        const dx = tx - hx, dy = ty - hy;
        yawT = YAW_MAX * Math.tanh(dx / 360);
        pitchT = PITCH_MAX * Math.tanh(dy / 320);
        bendT = BEND * (m.L + m.ext) * Math.tanh(dx / 620);
      }
      // --- integrate: spring on the neck (bouncy pop), easing on the gaze
      const k = 120, damp = 11;
      for (let left = this.rawDt; left > 1e-6; left -= 1 / 60) {   // sub-step: same pop at any frame rate
        const h = Math.min(left, 1 / 60);
        m.extV += (m.extTarget - m.ext) * k * h;
        m.extV *= Math.exp(-damp * h);
        m.ext += m.extV * h;
      }
      const rd = this.rawDt, a = 1 - Math.exp(-rd * 7), b = 1 - Math.exp(-rd * 4.5);
      m.yaw += (yawT - m.yaw) * a;
      m.pitch += (pitchT - m.pitch) * a;
      m.bend += (bendT - m.bend) * b;
      this.deform(m);
    }
    this.opts.onTick?.(this);
  }

  deform(m) {
    const L = this.layout;
    const [cx, cy, rx, ry] = m.head;
    const { chin, seam } = m;
    const L0 = m.L, L2 = Math.max(L0 + m.ext, 4);
    const B = m.bend;
    const roll = Math.atan2(2 * B, L2) * 0.8;
    const cr = Math.cos(roll), sr = Math.sin(roll);
    const cyw = Math.cos(m.yaw), syw = Math.sin(m.yaw), cp = Math.cos(m.pitch), sp = Math.sin(m.pitch);
    const D = m.depth;
    const ax = cx + B, ay = seam - L2;           // where the chin ends up
    const src = m.src2, pos = m.pos, n = src.length / 2;
    for (let i = 0; i < n; i++) {
      const x = src[i * 2], y = src[i * 2 + 1];
      let X, Y;
      if (y >= seam) { X = x; Y = y; }
      else {
        // neck: stretch the band chin..seam to the new length and lean it along a parabola
        const tn = clamp((seam - y) / L0, 0, 1);
        let nx = x + B * tn * tn, ny = seam - tn * L2;
        if (y < chin) { nx = x + B; ny = ay - (chin - y); }
        const w = smooth(chin + 22, chin - 14, y);
        if (w <= 0) { X = nx; Y = ny; }
        else {
          // head: turn on a dome, then roll with the neck tangent, then sit on the new chin
          const dx = x - cx, dy = y - cy;
          const r2 = (dx / rx) * (dx / rx) + (dy / ry) * (dy / ry);
          const z = r2 < 1 ? D * (1 - r2) : 0;
          const hx = dx * cyw + z * syw;
          const z1 = -dx * syw + z * cyw;
          const hy = dy * cp + z1 * sp;
          const u = hx, v = hy + (cy - chin);       // relative to the chin anchor
          const HX = ax + u * cr - v * sr;
          const HY = ay + u * sr + v * cr;
          X = nx + (HX - nx) * w; Y = ny + (HY - ny) * w;
        }
      }
      pos[i * 3] = L.ox + X * L.s;
      pos[i * 3 + 1] = -(L.oy + Y * L.s);
      pos[i * 3 + 2] = 0;
    }
    m.mesh.geometry.attributes.position.needsUpdate = true;
  }

  /** hat-top point of a man in canvas px (for name tags) */
  hatTop(m) {
    const [cx, cy, , ry] = m.head;
    return this.toCanvas(cx + m.bend * 1.05, cy - ry * 1.02 - m.ext);
  }
}
