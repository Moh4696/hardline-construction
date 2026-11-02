// HARDLINE -- page orchestration: smooth scroll, hero crew, section motion.
import * as THREE from 'three';
import { Crew } from './crew.js';
import { Views } from './kit.js';
import { loadProps, propCard } from './props.js';
import { Build, workScene } from './build3d.js';

const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = matchMedia('(pointer: coarse)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ------------------------------------------------------------------ smooth scroll
let lenis = null;
if (!reduced && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href');
  if (id.length < 2) return;
  const el = $(id);
  if (!el) return;
  e.preventDefault();
  lenis ? lenis.scrollTo(el, { offset: 0, duration: 1.4 }) : el.scrollIntoView({ behavior: 'smooth' });
}));

// ------------------------------------------------------------------ top bar
const topbar = $('.topbar');
ScrollTrigger.create({ start: 80, onUpdate: (s) => topbar.classList.toggle('is-solid', s.scroll() > 80) });
ScrollTrigger.create({ trigger: '.build', start: 'top 40px', end: 'bottom 40px', toggleClass: { targets: topbar, className: 'is-dark' } });

// ------------------------------------------------------------------ pointer (shared, normalised -1..1)
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
window.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = (e.clientY / innerHeight) * 2 - 1;
}, { passive: true });
gsap.ticker.add(() => { mouse.sx += (mouse.x - mouse.sx) * 0.08; mouse.sy += (mouse.y - mouse.sy) * 0.08; });

// ------------------------------------------------------------------ helpers
function fitText(el, width) {
  el.style.fontSize = '100px';
  const w = el.scrollWidth || el.getBoundingClientRect().width;
  el.style.fontSize = (100 * width / w) + 'px';
  return 100 * width / w;
}
function splitChars(el) {
  const text = el.textContent;
  el.textContent = '';
  return [...text].map((c) => {
    const s = document.createElement('span');
    s.className = 'ch'; s.textContent = c;
    el.appendChild(s);
    return s;
  });
}

// ------------------------------------------------------------------ 01 hero
const EXT_DESKTOP = 1, EXT_MOBILE = 2.2;
function crewFit(area) {
  return (W, H, data) => {
    const ext = W < 700 ? EXT_MOBILE : EXT_DESKTOP;
    const top = Math.min(...data.men.map((m) => m.head[1] - m.head[3] - m.ext * ext - 40));
    const bottom = data.group[1], left = 150, right = 1890;
    const a = area(W, H);
    const s = Math.min((H * a.h) / (bottom - top), (W * a.w) / (right - left));
    return { s, ox: W / 2 - ((left + right) / 2) * s, oy: H - bottom * s - H * a.pad };
  };
}

async function initHero() {
  const hero = $('#hero');
  const poster = $('.hero__poster', hero);
  const word = $('.hero__word', hero);
  const inner = $('.hero__word-inner', word);
  const chars = splitChars(inner);
  const brk = document.createElement('br'); chars[3].after(brk);
  const pills = $$('.hero__pills .pill', hero);
  const crewEl = $('#crew');
  const tagsEl = $('.crew__tags', crewEl);

  const data = await fetch('assets/crew/crew.json').then((r) => r.json());
  const tags = data.men.map((m) => {
    const t = document.createElement('div');
    t.className = 'tag';
    t.textContent = `${m.name} · ${m.role}`;
    tagsEl.appendChild(t);
    return t;
  });

  let crew;
  const placePills = (c) => {
    const W = c.W, H = c.H, mob = W < 700;
    const extS = mob ? EXT_MOBILE : EXT_DESKTOP;
    const men = data.men;
    // the giant word sits across the necks: fill the width, centre it on the neck band
    const chins = men.map((m) => c.toCanvas(0, m.chin - m.ext * extS)[1]);
    const seams = men.map((m) => c.toCanvas(0, m.seam)[1]);
    const bandMid = (Math.max(...chins) * 0.55 + Math.min(...seams) * 0.45);
    brk.style.display = mob ? 'block' : 'none';         // phones: HARD / LINE on two lines
    const size = fitText(inner, poster.clientWidth * (mob ? 0.9 : 0.965));
    word.style.top = (mob ? H * 0.085 : bandMid - size * 0.43) + 'px';
    const P = (x, y) => c.toCanvas(x, y);
    const at = (el, [x, y], ax, ay) => { el.style.left = x + 'px'; el.style.top = y + 'px'; el.dataset.ax = ax; el.dataset.ay = ay; };
    const head = (m) => m.head;
    const [sal, dev, marcus, rusty] = men;
    at(pills[0], P(head(sal)[0] - head(sal)[2] * 1.3, head(sal)[1] - sal.ext * extS - 30), -100, -50);
    at(pills[1], P((sal.neck[0] + dev.neck[0]) / 2 + 30, dev.chin - dev.ext * extS * 0.25), -50, -50);
    at(pills[2], P((marcus.neck[0] + rusty.neck[0]) / 2 - 10, marcus.seam - 60), -50, -50);
    at(pills[3], P(head(rusty)[0] + head(rusty)[2] * 1.3, head(rusty)[1] - rusty.ext * extS + 10), 0, -50);
    pills[4].style.top = (H * 0.8) + 'px'; pills[4].dataset.ax = 0; pills[4].dataset.ay = -50;
    pills.forEach((p) => { p.style.display = ''; });
    if (mob) {
      pills[1].style.display = pills[2].style.display = 'none';
      const wb = parseFloat(word.style.top) + size * 1.62;
      at(pills[0], [18, wb + 26], 0, -50);
      at(pills[3], [W - 18, wb + 78], -100, -50);
    }
    // keep the named callouts fully on the poster (only the lunch one is meant to be cropped)
    if (!mob) pills.slice(0, 4).forEach((el) => {
      const w = el.offsetWidth, x = parseFloat(el.style.left), ax = +el.dataset.ax / 100;
      const left = x + ax * w, min = 18, max = W - 18 - w;
      if (left < min) el.style.left = (x + (min - left)) + 'px';
      if (left > max) el.style.left = (x - (left - max)) + 'px';
    });
  };

  try {
    crew = await new Crew(crewEl, data, {
      base: 'assets/crew/',
      fit: crewFit((W, H) => W < 700 ? { h: 0.86, w: 0.98, pad: 0.004 } : { h: 0.95, w: 0.7, pad: 0.006 }),
      get extScale() { return innerWidth < 700 ? EXT_MOBILE : EXT_DESKTOP; },
      onLayout: placePills,
      onHover: (i) => {
        pills.forEach((p) => p.classList.toggle('is-hot', +p.dataset.man === i));
        tags.forEach((t, k) => t.classList.toggle('is-on', k === i));
      },
      onTick: (c) => {
        c.men.forEach((m, k) => {
          const [x, y] = c.hatTop(m);
          tags[k].style.left = x + 'px'; tags[k].style.top = y + 'px';
        });
      },
    }).init();
  } catch (err) {
    console.warn('crew: WebGL unavailable, showing the still', err);
    crewEl.classList.add('no-gl');
  }

  // parallax: word drifts against the cursor, pills ride above the crew
  gsap.ticker.add(() => {
    const x = mouse.sx, y = mouse.sy;
    inner.style.transform = `translate3d(${-x * 16}px, ${-y * 8}px, 0)`;
    pills.forEach((p, k) => {
      const d = 16 + k * 4, sc = (p._s ?? 1) * (p.classList.contains('is-hot') ? 1.06 : 1);
      p.style.transform = `translate(${p.dataset.ax}%, ${p.dataset.ay}%) translate3d(${x * d}px, ${y * d * 0.6}px, 0) scale(${sc})`;
    });
  });

  // intro: letters rise, then the necks shoot up one after another
  if (crew) crew.intro = 0;
  const tl = gsap.timeline({ delay: 0.15 });
  tl.from(chars, { yPercent: 110, opacity: 0, duration: 0.9, ease: 'power4.out', stagger: 0.05 })
    .from('.hero .meta', { opacity: 0, y: -8, duration: 0.5, stagger: 0.1 }, 0.2);
  if (crew) {
    const order = [1, 3, 0, 2];
    order.forEach((idx, k) => tl.add(() => { crew.men[idx].ext0 = crew.men[idx].rest; }, 0.55 + k * 0.16));
    crew.men.forEach((m) => { m.ext0 = 0; });
    crew.intro = 1;
  }
  pills.forEach((p) => { p._s = 0.3; p.style.opacity = 0; });
  pills.forEach((p, k) => tl.to(p, { _s: 1, opacity: 1, duration: 0.6, ease: 'back.out(2.4)' }, 1.3 + k * 0.08));
  document.fonts.ready.then(() => crew?.resize());

  // leaving the hero: they crane their necks to watch you go
  ScrollTrigger.create({
    trigger: hero, start: 'top top', end: 'bottom top', scrub: true,
    onUpdate: (s) => {
      if (crew) crew.extra = s.progress * 260;
      word.style.translate = `0 ${-s.progress * 90}px`;
    },
  });
  return crew;
}


// ------------------------------------------------------------------ shared 3D views
const views = new Views();
let scrollV = 0;
if (lenis) lenis.on('scroll', (l) => { scrollV = l.velocity || 0; });

function propView(canvas, obj, { dist = 13, fov = 30, y = 0, update } = {}) {
  const scene = new THREE.Scene();
  scene.add(obj);
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  camera.position.set(0, y, dist); camera.lookAt(0, y, 0);
  return views.add({ canvas, scene, camera, update });
}

// ------------------------------------------------------------------ 02 stop / hold / go
function initSignal() {
  const sec = $('#signal');
  const stages = $$('.stage', sec);
  const nEl = $('.signal__n', sec);
  const input = { state: 0 };
  const tl = $('.tl', sec), tilt = $('.tl__tilt', sec), lamps = $$('.tl__lamp', sec);
  loadProps().then((P) => P.traffic.lamps.forEach((l, k) => {
    Object.assign(lamps[k].style, { left: l.x * 100 + '%', top: l.y * 100 + '%', width: l.r * 2.1 * 100 + '%' });
  }));
  gsap.ticker.add((t) => {
    tilt.style.transform = `rotateY(${mouse.sx * 16}deg) rotateX(${-mouse.sy * 8}deg) translateY(${Math.sin(t * 1.1) * 5}px)`;
    lamps.forEach((l, k) => l.classList.toggle('is-on', k === input.state));
  });
  stages.forEach((st) => {
    const path = $('path', st);
    const len = path.getTotalLength();
    path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
    st._len = len;
  });
  const show = (i, dir) => {
    stages.forEach((st, k) => {
      const words = $$('.stage__word', st), notes = $$('.note', st), path = $('path', st);
      gsap.killTweensOf([words, notes, path]);
      if (k === i) {
        gsap.fromTo(words, { yPercent: 105 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: 'power4.out', stagger: 0.08 });
        gsap.fromTo(notes, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.5, delay: 0.25, stagger: 0.1 });
        gsap.fromTo(path, { strokeDashoffset: st._len }, { strokeDashoffset: 0, duration: 0.8, delay: 0.15, ease: 'power3.inOut' });
      } else {
        gsap.to(words, { yPercent: -105 * dir, opacity: 0, duration: 0.45, ease: 'power3.in' });
        gsap.to(notes, { opacity: 0, duration: 0.25 });
        gsap.to(path, { strokeDashoffset: st._len, duration: 0.3 });
      }
    });
    nEl.textContent = String(i + 1).padStart(2, '0');
    input.state = i;
  };
  stages.forEach((st, k) => { if (k) gsap.set($$('.stage__word, .note', st), { opacity: 0 }); });
  let cur = 0;
  const track = $('.vticker__track', sec);
  ScrollTrigger.create({
    trigger: sec, start: 'top top', end: 'bottom bottom', scrub: true,
    onEnter: () => show(cur, 1),
    onEnterBack: () => show(cur, -1),
    onUpdate: (s) => {
      const i = Math.min(2, Math.floor(s.progress * 3 * 0.999));
      if (i !== cur) { show(i, i > cur ? 1 : -1); cur = i; }
      track.style.transform = `translateY(${-s.progress * 50}%)`;
    },
  });
}

// ------------------------------------------------------------------ 03 the build
function initBuild() {
  const sec = $('#build');
  const build = new Build($('.build__canvas', sec));
  const lv = $('.build__lv', sec), day = $('.build__d', sec), bar = $('.build__bar i', sec), cap = $('.build__caption', sec), title = $('.build__title', sec);
  const captions = [
    [0.08, 'Ground broken 06:40.'], [0.16, 'Footings poured. Seven days to cure.'], [0.42, 'Steel going up.'],
    [0.7, 'A slab a week.'], [0.86, 'Topped out. Glass going in.'], [0.97, 'Lights on, floor by floor.'], [2, 'Handed over. Day 214.'],
  ];
  let lastCap = '';
  ScrollTrigger.create({
    trigger: sec, start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate: (s) => { build.target = s.progress; },
  });
  gsap.ticker.add(() => {
    const p = build.p, st = build.state;
    if (!st) return;
    lv.textContent = String(st.built).padStart(2, '0');
    day.textContent = String(1 + Math.round(p * 213)).padStart(3, '0');
    bar.style.width = (p * 100) + '%';
    const c = captions.find(([t]) => p < t)[1];
    if (c !== lastCap) { lastCap = c; cap.textContent = c; gsap.fromTo(cap, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }); }
    title.style.opacity = 1 - Math.min(1, Math.max(0, (p - 0.08) / 0.08));
  });
}

// ------------------------------------------------------------------ 04 services
function initServices() {
  const sec = $('#services');
  const track = $('.services__track', sec);
  const posters = $$('.spost', sec);
  loadProps().then((P) => posters.forEach((p) => {
    const name = p.dataset.obj;
    const stage = $('.spost__stage', p);
    const c = document.createElement('canvas');
    c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    stage.appendChild(c);
    const card = propCard(name, P[name], name === 'manhole' ? 5.4 : 7.2);
    new IntersectionObserver(([e]) => card.setActive(e.isIntersecting), { rootMargin: '0px 200px' }).observe(p);
    propView(c, card, {
      dist: 13.5, fov: 30,
      update: (dt, t) => {
        const r = p.getBoundingClientRect();
        const off = (r.left + r.width / 2) / innerWidth * 2 - 1;     // -1..1 across the screen
        card.rotation.y = -off * 0.32 + mouse.sx * 0.22;
        card.rotation.x = mouse.sy * 0.08;
        card.position.y = Math.sin(t * 1.2 + r.left * 0.01) * 0.08;
        p.classList.toggle('is-in', Math.abs(off) < 0.45);
      },
    });
  }));
  gsap.to(track, {
    x: () => -(track.scrollWidth - innerWidth), ease: 'none',
    scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true },
  });
}

// ------------------------------------------------------------------ 05 numbers
function initNumbers() {
  $$('.odo').forEach((el) => {
    const v = +el.dataset.value, suf = el.dataset.suffix || '';
    const text = (Number.isInteger(v) ? v.toLocaleString('en-US') : String(v)) + suf;
    el.textContent = '';
    const cols = [];
    for (const ch of text) {
      if (/\d/.test(ch)) {
        const col = document.createElement('span'); col.className = 'odo__col';
        for (let k = 0; k < 20; k++) { const d = document.createElement('span'); d.textContent = k % 10; col.appendChild(d); }
        el.appendChild(col); cols.push([col, +ch]);
      } else { const s = document.createElement('span'); s.className = 'odo__fixed'; s.textContent = ch; el.appendChild(s); }
    }
    el.setAttribute('aria-label', text);
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => cols.forEach(([col, d], k) => gsap.fromTo(col, { yPercent: 0 }, { yPercent: -((10 + d) / 20) * 100, duration: 1.6 + k * 0.18, ease: 'power3.out', delay: 0.05 * k })),
    });
  });
  const tapes = $$('.tape__track').map((t, i) => ({ t, x: 0, dir: i ? 1 : -1 }));
  gsap.ticker.add(() => {
    tapes.forEach((o) => {
      const w = o.t.scrollWidth / 2;
      o.x += o.dir * (0.6 + Math.min(Math.abs(scrollV) * 0.08, 14));
      if (o.x < -w) o.x += w; if (o.x > 0) o.x -= w;
      o.t.style.transform = `translateX(${o.x}px)`;
    });
  });
}

// ------------------------------------------------------------------ 06 attention
function initAttention() {
  const sec = $('#attention');
  const poster = $('.attention__poster', sec);
  const word = $('.attention__word span', sec);
  const fit = () => { const s = fitText(word, poster.clientWidth * 0.95); word.parentElement.style.fontSize = s + 'px'; };
  document.fonts.ready.then(fit); new ResizeObserver(fit).observe(poster);
  const input = { wobble: 0 };
  const pivot = new THREE.Group();
  loadProps().then((P) => {
    const H = 8.2, card = propCard('cone', P.cone, H);
    card.position.y = 0.36 * H;            // the base sits ~86% down the frame: pivot there
    pivot.add(card); pivot.position.y = -0.36 * H;
    new IntersectionObserver(([e]) => card.setActive(e.isIntersecting)).observe(poster);
  });
  propView($('.attention__canvas', sec), pivot, {
    dist: 15, fov: 30, y: 0,
    update: (dt, t) => {
      input.wobble *= Math.exp(-dt * 1.8);
      pivot.rotation.z = Math.sin(t * 10) * input.wobble * 0.09 + mouse.sx * 0.03;
      pivot.rotation.y = mouse.sx * 0.25;
    },
  });
  poster.addEventListener('pointerdown', () => { input.wobble = 1; });
  poster.addEventListener('pointerenter', () => { input.wobble = Math.max(input.wobble, 0.35); });
  const pills = $$('.pill--callout', poster);
  const m = { x: 0, y: 0 };
  poster.addEventListener('pointermove', (e) => { const r = poster.getBoundingClientRect(); m.x = e.clientX - r.left; m.y = e.clientY - r.top; });
  gsap.ticker.add(() => {
    pills.forEach((p, k) => {
      const cx = p.offsetLeft + p.offsetWidth / 2, cy = p.offsetTop + p.offsetHeight / 2;
      const a = Math.atan2(m.y - cy, m.x - cx);
      const target = Math.max(-8, Math.min(8, Math.sin(a) * 6 * (k % 2 ? -1 : 1)));
      p._r = (p._r || 0) + (target - (p._r || 0)) * 0.08;
      p.style.transform = `rotate(${p._r}deg)`;
    });
  });
  ScrollTrigger.create({ trigger: poster, start: 'top 70%', once: true, onEnter: () => {
    gsap.from(pills, { scale: 0.3, opacity: 0, duration: 0.6, ease: 'back.out(2.4)', stagger: 0.12, clearProps: 'scale,opacity' });
    input.wobble = 1;
  } });
}

// ------------------------------------------------------------------ 07 work: halftone that develops under the cursor
function initWork() {
  $$('.card').forEach((card) => {
    const canvas = $('.card__art', card);
    const { scene, camera } = workScene(card.dataset.kind);
    const color = document.createElement('canvas'), half = document.createElement('canvas');
    const lens = { x: 0, y: 0, r: 0, target: 0 };
    let ready = false;
    const paint = () => {
      if (!ready) return;
      const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
      ctx.drawImage(half, 0, 0);
      if (lens.r > 1) {
        ctx.save(); ctx.beginPath(); ctx.arc(lens.x, lens.y, lens.r, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = '#243643'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(color, 0, 0); ctx.restore();
        ctx.beginPath(); ctx.arc(lens.x, lens.y, lens.r, 0, Math.PI * 2); ctx.lineWidth = 2 * views.dpr; ctx.strokeStyle = '#1D1A16'; ctx.stroke();
      }
    };
    const v = views.add({
      canvas, scene, camera, still: true,
      after: (ctx) => {
        const w = canvas.width, h = canvas.height;
        color.width = half.width = w; color.height = half.height = h;
        color.getContext('2d').drawImage(canvas, 0, 0);
        const src = color.getContext('2d').getImageData(0, 0, w, h).data;
        const hx = half.getContext('2d');
        hx.fillStyle = '#F8873F'; hx.fillRect(0, 0, w, h);
        hx.fillStyle = '#1D1A16';
        const cell = Math.round(5.5 * views.dpr);
        for (let y = cell / 2; y < h; y += cell) for (let x = cell / 2; x < w; x += cell) {
          const i = ((y | 0) * w + (x | 0)) * 4;
          const a = src[i + 3] / 255;
          if (a < 0.1) continue;
          const lum = (0.3 * src[i] + 0.59 * src[i + 1] + 0.11 * src[i + 2]) / 255;
          const r = cell * 0.56 * Math.sqrt(Math.max(0.04, 1 - lum)) * a;
          hx.beginPath(); hx.arc(x, y, r, 0, Math.PI * 2); hx.fill();
        }
        ready = true; paint();
      },
    });
    camera.aspect = 0.8; camera.updateProjectionMatrix();
    card.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      lens.x = (e.clientX - r.left) * views.dpr; lens.y = (e.clientY - r.top) * views.dpr;
    });
    card.addEventListener('pointerenter', () => { lens.target = canvas.width * 0.42; });
    card.addEventListener('pointerleave', () => { lens.target = 0; });
    gsap.ticker.add(() => {
      if (Math.abs(lens.target - lens.r) < 0.5 && lens.r === lens._last) return;
      lens.r += (lens.target - lens.r) * 0.14; lens._last = lens.r; paint();
    });
  });
}

// ------------------------------------------------------------------ 08 contact: the crew looks at the button
async function initCta() {
  const sec = $('#contact');
  const el = $('.crew--cta', sec);
  const btn = $('.cta__btn', sec);
  const data = await fetch('assets/crew/crew.json').then((r) => r.json());
  let crew;
  try {
    crew = await new Crew(el, data, {
      base: 'assets/crew/',
      extScale: 0.5,
      fit: crewFit((W, H) => W < 700 ? { h: 0.4, w: 0.96, pad: 0.0 } : { h: 0.4, w: 0.44, pad: 0.0 }),
    }).init();
    crew.intro = 1;
  } catch (e) { el.classList.add('no-gl'); return; }
  const aim = () => {
    const r = btn.getBoundingClientRect(), c = el.getBoundingClientRect();
    crew.focus = { x: r.left + r.width / 2 - c.left, y: r.top + r.height / 2 - c.top };
  };
  btn.addEventListener('pointerenter', aim);
  btn.addEventListener('focus', aim);
  btn.addEventListener('pointerleave', () => { crew.focus = null; });
  btn.addEventListener('blur', () => { crew.focus = null; });
  // when you scroll in, all four pop up out of the bottom of the poster
  crew.men.forEach((m) => { m.ext0 = 0; });
  ScrollTrigger.create({ trigger: sec, start: 'top 55%', once: true, onEnter: () => crew.men.forEach((m, k) => gsap.delayedCall(k * 0.14, () => { m.ext0 = m.rest; })) });
}

// ------------------------------------------------------------------ boot
const heroCrew = initHero();
initSignal();
initBuild();
initServices();
initNumbers();
initAttention();
initWork();
initCta();
document.fonts.ready.then(() => ScrollTrigger.refresh());
window.__hardline = { heroCrew, views, gsap, ScrollTrigger, lenis };
