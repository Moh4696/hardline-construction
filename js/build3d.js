// THE BUILD: a carved low-poly tower that assembles with scroll progress p (0..1).
// makeBuilding() is shared with the Work cards, which render finished buildings once.
import * as THREE from 'three';
import { C, mat, carve, addLights } from './kit.js';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease = (t) => 1 - Math.pow(1 - clamp01(t), 3);
const backOut = (t) => { t = clamp01(t); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

/**
 * cfg: { nx, nz, bay, fh, floors, glass, core, frame: 'steel'|'concrete'|'timber', roof: 'flat'|'saw', parapet }
 * returns { group, update(p, lit), topY, size }
 * p is build progress for the whole building: footings, then floors in sequence, then glass, then lights.
 */
export function makeBuilding(cfg) {
  const { nx, nz, bay = 4, fh = 3.2, floors } = cfg;
  const W = nx * bay, D = nz * bay;
  const g = new THREE.Group();
  const frameCol = { steel: C.steel, concrete: 0xB9B2A6, timber: C.wood }[cfg.frame || 'steel'];
  const dummy = new THREE.Object3D();

  const colGeo = carve(new THREE.BoxGeometry(0.42, fh, 0.42, 1, 2, 1), 0.04); colGeo.translate(0, fh / 2, 0);
  const cols = new THREE.InstancedMesh(colGeo, mat(frameCol, { roughness: 0.7 }), floors * (nx + 1) * (nz + 1));
  const bx = carve(new THREE.BoxGeometry(bay, 0.34, 0.3, 3, 1, 1), 0.03);
  const bz = carve(new THREE.BoxGeometry(0.3, 0.34, bay, 1, 1, 3), 0.03);
  const beamMat = mat(cfg.frame === 'concrete' ? 0xA9A398 : C.steel, { roughness: 0.7 });
  const beamsX = new THREE.InstancedMesh(bx, beamMat, floors * (nz + 1) * nx);
  const beamsZ = new THREE.InstancedMesh(bz, beamMat, floors * (nx + 1) * nz);
  const slabGeo = carve(new THREE.BoxGeometry(W + 0.8, 0.3, D + 0.8, 6, 1, 4), 0.05);
  const slabs = new THREE.InstancedMesh(slabGeo, mat(0xCFC8BB, { roughness: 0.9 }), floors + 1);
  const ph = fh - 0.55;
  const panGeo = new THREE.BoxGeometry(bay - 0.22, ph, 0.08); panGeo.translate(0, ph / 2, 0);
  const nPan = floors * (2 * nx + 2 * nz);
  const panels = cfg.glass ? new THREE.InstancedMesh(panGeo, new THREE.MeshStandardMaterial({ color: 0x6F9FAA, emissive: 0x12303A, roughness: 0.28, metalness: 0.08, flatShading: true }), nPan) : null;
  const litGeo = new THREE.BoxGeometry(bay - 0.4, ph - 0.2, 0.04); litGeo.translate(0, ph / 2, 0);
  const lit = cfg.glass ? new THREE.InstancedMesh(litGeo, new THREE.MeshBasicMaterial({ color: 0xFFC46A, transparent: true, opacity: 0.88 }), nPan) : null;
  const coreGeo = carve(new THREE.BoxGeometry(bay * 0.8, fh, bay * 0.8, 1, 2, 1), 0.04); coreGeo.translate(0, fh / 2, 0);
  const core = cfg.core ? new THREE.InstancedMesh(coreGeo, mat(0xA59E92, { roughness: 0.95 }), floors) : null;
  const padGeo = carve(new THREE.BoxGeometry(1.3, 0.6, 1.3), 0.06); padGeo.translate(0, -0.3, 0);
  const pads = new THREE.InstancedMesh(padGeo, mat(0x9A9388), (nx + 1) * (nz + 1));
  [cols, beamsX, beamsZ, slabs, panels, lit, core, pads].forEach((m) => { if (m) { m.frustumCulled = false; g.add(m); } });

  let roof = null;
  if (cfg.roof === 'saw') {
    roof = new THREE.Group();
    const tooth = new THREE.Shape(); tooth.moveTo(0, 0); tooth.lineTo(bay, 0); tooth.lineTo(bay, 1.7); tooth.lineTo(0, 0);
    const tg = new THREE.ExtrudeGeometry(tooth, { depth: D, bevelEnabled: false }); tg.translate(-W / 2, 0, -D / 2);
    for (let i = 0; i < nx; i++) { const m = new THREE.Mesh(tg, mat(C.orange, { roughness: 0.8 })); m.position.x = i * bay; roof.add(m); }
    g.add(roof);
  }
  const parapet = cfg.parapet ? new THREE.InstancedMesh(carve(new THREE.BoxGeometry(W + 0.8, 0.7, D + 0.8, 4, 1, 4), 0.04), mat(C.orange, { roughness: 0.8 }), floors) : null;
  if (parapet) { parapet.frustumCulled = false; g.add(parapet); }

  const gx = (i) => -W / 2 + i * bay, gz = (k) => -D / 2 + k * bay;
  const set = (mesh, idx, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0, ry = 0) => {
    dummy.position.set(x, y, z); dummy.scale.set(sx, sy, sz); dummy.rotation.set(rx, ry, rz);
    dummy.updateMatrix(); mesh.setMatrixAt(idx, dummy.matrix);
  };
  // phases (fractions of p)
  const FOOT = [0.02, 0.1], FL0 = 0.1, FLS = 0.62 / floors, FLW = FLS * 1.6, GL0 = 0.38, GLS = 0.48 / floors, LT0 = 0.9;

  function update(p, lights = 0) {
    const fp = ease((p - FOOT[0]) / (FOOT[1] - FOOT[0]));
    let n = 0;
    for (let i = 0; i <= nx; i++) for (let k = 0; k <= nz; k++) set(pads, n++, gx(i), 0, gz(k), 1, Math.max(fp, 0.001), 1);
    set(slabs, 0, 0, -0.15, 0, Math.max(fp, 0.001), 1, Math.max(fp, 0.001));
    let ci = 0, bxi = 0, bzi = 0, pi = 0;
    let built = 0;
    for (let f = 0; f < floors; f++) {
      const y0 = f * fh;
      const u = (p - (FL0 + f * FLS)) / FLW;
      const cu = ease(u / 0.35), bu = ease((u - 0.3) / 0.35), su = ease((u - 0.62) / 0.38);
      if (su >= 0.999) built = f + 1;
      for (let i = 0; i <= nx; i++) for (let k = 0; k <= nz; k++) set(cols, ci++, gx(i), y0, gz(k), 1, Math.max(cu, 0.0001), 1);
      const drop = (1 - bu) * 7, bs = bu > 0 ? 1 : 0.0001;
      for (let k = 0; k <= nz; k++) for (let i = 0; i < nx; i++) set(beamsX, bxi++, gx(i) + bay / 2, y0 + fh - 0.17 + drop, gz(k), bs, bs, bs);
      for (let i = 0; i <= nx; i++) for (let k = 0; k < nz; k++) set(beamsZ, bzi++, gx(i), y0 + fh - 0.17 + drop * 1.1, gz(k) + bay / 2, bs, bs, bs);
      const ss = Math.max(su, 0.0001);
      set(slabs, f + 1, 0, y0 + fh + 0.15, 0, ss, su > 0 ? 1 : 0.0001, ss);
      if (core) { const coreU = ease((u + 0.25) / 0.4); set(core, f, -W / 2 + bay * 0.9, y0, 0, 1, Math.max(coreU, 0.0001), 1); }
      if (parapet) set(parapet, f, 0, y0 + fh + 0.6, 0, ss, su > 0.5 ? 1 : 0.0001, ss);
      if (panels) {
        const gu = backOut((p - (GL0 + f * GLS)) / 0.08);
        const on = clamp01((lights - f / floors) * floors * 0.7);
        const vis = (p - (GL0 + f * GLS)) > 0 ? 1 : 0.0001;
        const ang = (1 - gu) * (Math.PI / 2);
        const yb = y0 + 0.32;
        for (let i = 0; i < nx; i++) {
          set(panels, pi, gx(i) + bay / 2, yb, D / 2 + 0.35, vis, vis, vis, ang);
          set(lit, pi++, gx(i) + bay / 2, yb, D / 2 + 0.42, ...(on > 0.01 && gu > 0.98 ? [1, 1, 1] : [0.0001, 0.0001, 0.0001]));
          set(panels, pi, gx(i) + bay / 2, yb, -D / 2 - 0.35, vis, vis, vis, -ang);
          set(lit, pi++, gx(i) + bay / 2, yb, -D / 2 - 0.42, ...(on > 0.01 && gu > 0.98 ? [1, 1, 1] : [0.0001, 0.0001, 0.0001]));
        }
        for (let k = 0; k < nz; k++) {
          set(panels, pi, W / 2 + 0.35, yb, gz(k) + bay / 2, vis, vis, vis, 0, -ang, Math.PI / 2);
          set(lit, pi++, W / 2 + 0.42, yb, gz(k) + bay / 2, ...(on > 0.01 && gu > 0.98 ? [1, 1, 1] : [0.0001, 0.0001, 0.0001]), 0, 0, Math.PI / 2);
          set(panels, pi, -W / 2 - 0.35, yb, gz(k) + bay / 2, vis, vis, vis, 0, ang, Math.PI / 2);
          set(lit, pi++, -W / 2 - 0.42, yb, gz(k) + bay / 2, ...(on > 0.01 && gu > 0.98 ? [1, 1, 1] : [0.0001, 0.0001, 0.0001]), 0, 0, Math.PI / 2);
        }
      }
    }
    if (roof) { const ru = ease((p - 0.86) / 0.1); roof.position.y = floors * fh + 0.3; roof.scale.set(1, Math.max(ru, 0.0001), 1); }
    [cols, beamsX, beamsZ, slabs, panels, lit, core, pads, parapet].forEach((m) => { if (m) m.instanceMatrix.needsUpdate = true; });
    const cur = Math.min(floors - 1, Math.max(0, Math.floor((p - FL0) / FLS)));
    const cu = (p - (FL0 + cur * FLS)) / FLW;
    return { built, current: cur, beamPhase: cu > 0.25 && cu < 0.7 && p < FL0 + floors * FLS + 0.02, beamU: ease((cu - 0.3) / 0.35), topY: (built + 1) * fh };
  }
  return { group: g, update, size: [W, D], fh, floors };
}

function hoardingTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#F8873F'; x.fillRect(0, 0, 1024, 128);
  x.fillStyle = '#F2E2C6'; x.font = '78px Anton, Impact, sans-serif'; x.textBaseline = 'middle';
  x.fillText('HARDLINE', 24, 66);
  x.fillStyle = '#1D1A16'; x.font = '600 20px "Inter Tight", Arial, sans-serif';
  x.fillText('BUILD CO.  ®  HARD HATS PAST THIS LINE', 400, 66);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping;
  return t;
}

export class Build {
  constructor(canvas) {
    this.canvas = canvas;
    const r = this.r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.1;
    r.setClearColor(0x000000, 0);
    const s = this.scene = new THREE.Scene();
    s.fog = new THREE.Fog(0x17222D, 150, 330);
    this.cam = new THREE.PerspectiveCamera(34, 1, 0.5, 600);
    const L = addLights(s, { key: 3.2, rim: 1.3, fill: 0.6 });
    L.key.position.set(-30, 40, 30);
    L.rim.position.set(40, 20, -40);
    this.cfg = { nx: 4, nz: 3, bay: 4, fh: 3.2, floors: 12, glass: true, core: true, frame: 'steel' };
    this.b = makeBuilding(this.cfg);
    s.add(this.b.group);

    // ground, site slab, hoarding, spoil heaps
    const ground = new THREE.Mesh(carve(new THREE.CircleGeometry(160, 40, 0, Math.PI * 2), 0.4, [1, 1, 0]), mat(0x1C2732, { roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.62; s.add(ground);
    const [W, D] = this.b.size;
    const site = new THREE.Mesh(carve(new THREE.BoxGeometry(W + 22, 0.3, D + 18, 8, 1, 6), 0.08), mat(0x5F5A52, { roughness: 1 }));
    site.position.y = -0.62; s.add(site);
    const tex = hoardingTexture();
    const hmat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
    const sides = [[0, (D + 18) / 2, W + 22, 0], [0, -(D + 18) / 2, W + 22, Math.PI], [(W + 22) / 2, 0, D + 18, -Math.PI / 2], [-(W + 22) / 2, 0, D + 18, Math.PI / 2]];
    sides.forEach(([x, z, len, ry]) => {
      const t2 = tex.clone(); t2.needsUpdate = true; t2.repeat.set(len / 14, 1);
      const m = new THREE.Mesh(new THREE.BoxGeometry(len, 2.2, 0.15), [mat(C.orange), mat(C.orange), mat(C.orange), mat(C.orange), new THREE.MeshStandardMaterial({ map: t2, roughness: 0.9 }), mat(C.orange)]);
      m.position.set(x, 0.5, z); m.rotation.y = ry; s.add(m);
    });
    this.heaps = [[-W / 2 - 6, 4], [W / 2 + 5, -5], [W / 2 + 7, 3]].map(([x, z], i) => {
      const h = new THREE.Mesh(carve(new THREE.IcosahedronGeometry(2.4 + i * 0.4, 1), 0.7), mat(0x6B4A30, { roughness: 1 }));
      h.scale.y = 0.55; h.position.set(x, -0.4, z); s.add(h); return h;
    });

    // tower crane
    const yellow = mat(C.amber, { roughness: 0.7 });
    const crane = this.crane = new THREE.Group();
    crane.position.set(-W / 2 - 7, -0.5, -D / 2 - 3);
    const mastGeo = new THREE.BoxGeometry(1.1, 1, 1.1); mastGeo.translate(0, 0.5, 0);
    this.mast = new THREE.Mesh(carve(mastGeo, 0.02), yellow); crane.add(this.mast);
    const braceMat = new THREE.MeshBasicMaterial({ color: 0x8a6a1e, wireframe: true });
    this.mastWire = new THREE.Mesh(new THREE.BoxGeometry(1.14, 1, 1.14, 1, 24, 1), braceMat); this.mastWire.geometry.translate(0, 0.5, 0); crane.add(this.mastWire);
    const top = this.craneTop = new THREE.Group(); crane.add(top);
    const jib = new THREE.Mesh(carve(new THREE.BoxGeometry(34, 0.8, 0.8, 12, 1, 1), 0.03), yellow); jib.position.x = 16; top.add(jib);
    const cj = new THREE.Mesh(new THREE.BoxGeometry(10, 0.7, 0.9), yellow); cj.position.x = -5.5; top.add(cj);
    const cw = new THREE.Mesh(carve(new THREE.BoxGeometry(2.2, 2.2, 1.6), 0.05), mat(0x8E887E)); cw.position.set(-9.5, -1.2, 0); top.add(cw);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.5), mat(C.bone)); cab.position.set(0.9, -0.9, 0.9); top.add(cab);
    const peak = new THREE.Mesh(new THREE.ConeGeometry(0.7, 4, 4), yellow); peak.position.y = 2.4; top.add(peak);
    this.trolley = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 1.1), mat(0x2A2622)); this.trolley.position.y = -0.6; top.add(this.trolley);
    this.cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 4), new THREE.MeshBasicMaterial({ color: 0x111111 }));
    this.cable.geometry.translate(0, -0.5, 0); top.add(this.cable);
    this.hook = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.5), mat(C.red)); top.add(this.hook);
    this.load = new THREE.Mesh(carve(new THREE.BoxGeometry(4, 0.34, 0.3, 3, 1, 1), 0.03), mat(C.steel)); top.add(this.load);
    s.add(crane);

    this.p = 0; this.target = 0; this.lights = 0;
    this.mouse = { x: 0, y: 0 };
    this.visible = false;
    new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; }, { rootMargin: '200px' }).observe(canvas);
    new ResizeObserver(() => this.resize()).observe(canvas);
    window.addEventListener('pointermove', (e) => { this.mouse.x = e.clientX / innerWidth * 2 - 1; this.mouse.y = e.clientY / innerHeight * 2 - 1; }, { passive: true });
    this.resize();
    this.clock = new THREE.Clock(); this.t = 0;
    const loop = () => { const dt = Math.min(this.clock.getDelta(), 0.05); this.t += dt; if (this.visible) this.frame(dt); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.r.setSize(w, h, false);
    this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
    this.narrow = w / h < 0.9;
  }

  frame(dt) {
    this.p += (this.target - this.p) * (1 - Math.exp(-dt * 6));
    const p = this.p;
    const lights = clamp01((p - 0.9) / 0.08);
    const st = this.b.update(p, lights);
    this.state = st;
    this.heaps.forEach((h, i) => { const k = 1 - ease((p - 0.04 - i * 0.01) / 0.12); h.scale.set(Math.max(k, 0.001), 0.55 * Math.max(k, 0.001), Math.max(k, 0.001)); });
    // crane: mast climbs ahead of the work, jib swings to where the steel goes
    const top = Math.max(16, st.topY + 9);
    this.mast.scale.y = top; this.mastWire.scale.y = top;
    this.craneTop.position.y = top;
    const cp = this.crane.position;
    const tx = 2 - cp.x, tz = (st.current % 2 ? 2 : -2) - cp.z;
    let ang = -Math.atan2(tz, tx);
    if (!st.beamPhase) ang += Math.sin(this.t * 0.3) * 0.25 - 0.35;
    this.craneTop.rotation.y += (ang - this.craneTop.rotation.y) * (1 - Math.exp(-dt * 2.2));
    const dist = Math.hypot(tx, tz) * 0.92;
    this.trolley.position.x += (dist - this.trolley.position.x) * 0.06;
    const beamY = st.current * this.b.fh + this.b.fh + (1 - st.beamU) * 7;
    const drop = st.beamPhase ? Math.max(1.5, top - (beamY - 0.5)) : 4 + Math.sin(this.t) * 0.3;
    this.cable.position.x = this.trolley.position.x; this.cable.position.y = -0.8; this.cable.scale.y = drop;
    this.hook.position.set(this.trolley.position.x, -0.8 - drop, 0);
    this.load.visible = st.beamPhase && st.beamU < 0.95;
    this.load.position.set(this.trolley.position.x, -0.8 - drop - 0.9, 0);
    // camera: orbit + rise with the building, pull back for the lights
    const mx = this.mouse.x, my = this.mouse.y;
    const a = -0.95 + p * 1.25 + mx * 0.12;
    const rad = (this.narrow ? 120 : 84) + p * 22 + lights * 12;
    const h = 12 + p * 34 + lights * 6 - my * 4;
    this.cam.position.set(Math.cos(a) * rad, h, Math.sin(a) * rad);
    this.cam.lookAt(0, 5 + p * 15, 0);
    this.r.render(this.scene, this.cam);
  }
}

/** a finished building on a little plot, for the Work cards (rendered once through Views) */
export function workScene(kind) {
  const cfgs = {
    library: { nx: 5, nz: 3, bay: 4, fh: 3.6, floors: 4, glass: true, frame: 'timber' },
    carpark: { nx: 5, nz: 3, bay: 5, fh: 2.8, floors: 6, glass: false, frame: 'concrete', parapet: true },
    tower: { nx: 3, nz: 3, bay: 4, fh: 3.2, floors: 12, glass: true, core: true, frame: 'steel' },
    school: { nx: 7, nz: 2, bay: 4, fh: 3.4, floors: 2, glass: true, frame: 'steel', roof: 'saw' },
  };
  const cfg = cfgs[kind];
  const scene = new THREE.Scene();
  addLights(scene, { key: 2.6, rim: 2.6, fill: 0.7 });
  const b = makeBuilding(cfg);
  b.update(1, 0);
  scene.add(b.group);
  const [W, D] = b.size;
  const plot = new THREE.Mesh(carve(new THREE.BoxGeometry(W + 10, 0.5, D + 10, 4, 1, 4), 0.1), mat(0x6A645B, { roughness: 1 }));
  plot.position.y = -0.55; scene.add(plot);
  const H = cfg.floors * cfg.fh;
  const cam = new THREE.PerspectiveCamera(30, 0.8, 0.5, 500);
  // fit the whole plot: distance from the bounding sphere and the narrower (horizontal) fov
  const r = 0.5 * Math.hypot(W + 10, H, D + 10);
  const fovH = 2 * Math.atan(Math.tan((cam.fov * Math.PI / 180) / 2) * cam.aspect);
  const dist = r / Math.sin(fovH / 2) * 1.02;
  const dir = new THREE.Vector3(0.62, 0.42, 0.66).normalize();
  cam.position.copy(dir.multiplyScalar(dist)).add(new THREE.Vector3(0, H * 0.45, 0));
  cam.lookAt(0, H * 0.45, 0);
  return { scene, camera: cam };
}
