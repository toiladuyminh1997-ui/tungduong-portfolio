import * as THREE from "three";
import { PROFILE, HERO, CATEGORIES } from "./data.js";
import { META } from "./media-meta.js";

/* ============================================================
   Helpers
   ============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isFile = location.protocol === "file:";
const pad2 = (n) => String(n).padStart(2, "0");

function ratioLabel(w, h) {
  const r = w / h;
  const known = [[16 / 9, "16:9"], [9 / 16, "9:16"], [1, "1:1"], [4 / 5, "4:5"], [3 / 2, "3:2"], [16 / 10, "16:10"], [1 / Math.SQRT2, "A-Format"], [2, "2:1"]];
  for (const [v, l] of known) if (Math.abs(r - v) / v < 0.035) return l;
  if (r > 2.1) return "Panorama";
  return `${w}×${h}`;
}
function durLabel(s) {
  if (!s) return "";
  s = Math.round(s);
  return s >= 60 ? `${Math.floor(s / 60)}:${pad2(s % 60)}` : `${s}s`;
}

/* ============================================================
   Data
   ============================================================ */
CATEGORIES.forEach((c) => {
  c.items = c.items.map(([title, key], i) => {
    const [w, h, dur] = META[key] || [1920, 1080, 0];
    return { title, key, i, src: `media/${key}.mp4`, poster: `media/${key}.jpg`, w, h, dur, fmt: ratioLabel(w, h) };
  });
});
const catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
const totalItems = CATEGORIES.reduce((a, c) => a + c.items.length, 0);
const totalSeconds = CATEGORIES.reduce((a, c) => a + c.items.reduce((b, it) => b + it.dur, 0), 0);
const formats = new Set(CATEGORIES.flatMap((c) => c.items.map((it) => it.fmt)));

/* ============================================================
   Split text
   ============================================================ */
function split(el) {
  const txt = el.textContent.trim().normalize("NFC");
  el.textContent = "";
  [...txt].forEach((ch, i) => {
    const s = document.createElement("span");
    s.className = "ch";
    s.style.setProperty("--i", i);
    s.textContent = ch === " " ? " " : ch;
    el.appendChild(s);
  });
}
$$("[data-split]").forEach(split);
$$(".hero-line.l2").forEach((el) => el.style.setProperty("--d", "0.15s"));

/* ============================================================
   Build: work list
   ============================================================ */
const workList = $("#workList");
$("#workTotal").textContent = `${totalItems} projects`;
CATEGORIES.forEach((c, n) => {
  const li = document.createElement("li");
  li.className = "work-row reveal";
  li.dataset.id = c.id;
  li.innerHTML = `
    <a class="row-link" href="#${c.id}" data-cursor="View" aria-label="${c.title} — ${c.items.length} projects"></a>
    <span class="num mono">${pad2(n + 1)}</span>
    <h3 class="work-title"><span class="roll"><span>${c.title}</span><span>${c.title}</span></span></h3>
    <div class="meta mono"><b>${pad2(c.items.length)} projects</b><span>${c.sub}</span></div>
    <span class="arrow" aria-hidden="true">→</span>`;
  workList.appendChild(li);
});

/* ============================================================
   Build: about + contact
   ============================================================ */
$("#aboutIntro").textContent = PROFILE.intro;
$("#aboutVi").textContent = PROFILE.bioVi;
$("#services").innerHTML = PROFILE.services.map((s, i) => `<li><span>${pad2(i + 1)}</span>${s}</li>`).join("");
const stats = [
  ["Projects", totalItems],
  ["Disciplines", CATEGORIES.length],
  ["Minutes of motion", Math.round(totalSeconds / 60)],
  ["Screen formats", formats.size],
];
$("#stats").innerHTML = stats.map(([k, v]) => `<div><dt>${k}</dt><dd data-count="${v}">0</dd></div>`).join("");
const photo = $("#aboutPhoto");
$$("img", photo).forEach((im) => (im.src = PROFILE.photo));
const mail = $("#contactMail");
mail.textContent = PROFILE.email;
mail.href = `mailto:${PROFILE.email}`;
$("#contactPhone").textContent = PROFILE.phone;
$("#socials").innerHTML = PROFILE.socials.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener" data-hover>${s.label} ↗</a></li>`).join("");

/* clock */
function tick() {
  try {
    const t = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: PROFILE.timezone }).format(new Date());
    $("#clock").textContent = `VN ${t}`;
  } catch { /* ignore */ }
}
tick();
setInterval(tick, 20000);

/* ============================================================
   Smooth scroll
   ============================================================ */
let lenis = null;
if (window.Lenis && !reduced) {
  lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true });
  lenis.stop();
}
let scrollY = 0;
function readScroll() { scrollY = lenis ? lenis.scroll : window.scrollY; }
function scrollToEl(sel, immediate = false) {
  const el = sel === "#top" ? 0 : $(sel);
  if (el === null) return;
  if (lenis) lenis.scrollTo(el, { immediate, duration: 1.6 });
  else if (el === 0) window.scrollTo({ top: 0, behavior: immediate ? "auto" : "smooth" });
  else el.scrollIntoView({ behavior: immediate ? "auto" : "smooth" });
}

/* ============================================================
   Hero video
   ============================================================ */
const video = $("#heroVideo");
const small = Math.min(innerWidth, innerHeight) < 700;
video.src = small && HERO.videoMobile ? HERO.videoMobile : HERO.video;
video.poster = HERO.poster;
video.load();

/* ============================================================
   WebGL
   ============================================================ */
const canvas = $("#gl");
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
} catch (e) {
  console.warn("WebGL unavailable", e);
}
// file:// không cho WebGL đọc video (cross-origin) -> dùng thẻ <video> thường
let glVideo = !!renderer && !isFile;
if (!glVideo) document.body.classList.add("no-gl-video");

const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, vel: 0, px: 0, py: 0 };
const U = {
  uTex: { value: null },
  uHasTex: { value: 0 },
  uRes: { value: new THREE.Vector2(1, 1) },
  uTexRes: { value: new THREE.Vector2(1920, 1080) },
  uMouse: { value: new THREE.Vector2(0.5, 0.5) },
  uVel: { value: 0 },
  uTime: { value: 0 },
  uReveal: { value: 0 },
  uScroll: { value: 0 },
  uFit: { value: 0 },
  uPR: { value: 1 },
  uLens: { value: 0 },
};
let pointerSeen = false;

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform float uHasTex, uVel, uTime, uReveal, uScroll, uFit, uLens;
uniform vec2 uRes, uTexRes, uMouse;
varying vec2 vUv;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
vec3 tex(vec2 uv){
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec3(0.0);
  return texture2D(uTex, uv).rgb;
}
void main(){
  float sa = uRes.x / uRes.y;
  float ta = uTexRes.x / uTexRes.y;
  vec2 uv = vUv;

  // mouse lens + ripple
  vec2 d = uv - uMouse; d.x *= sa;
  float dist = length(d);
  vec2 dir = d / (dist + 1e-4);
  float lens = smoothstep(0.34, 0.0, dist) * uLens;
  float ripple = sin(dist * 36.0 - uTime * 3.0) * exp(-dist * 5.0) * (0.0015 + uVel * 0.03);
  uv += vec2(dir.x / sa, dir.y) * ripple;
  uv -= vec2(d.x / sa, d.y) * lens * 0.07;

  // liquid warp
  uv += (vec2(noise(uv * 4.0 + uTime * 0.2), noise(uv * 4.0 - uTime * 0.2)) - 0.5) * (0.003 + uVel * 0.01);

  // scroll: zoom + drift
  float z = 1.0 + uScroll * 0.55;
  uv = (uv - 0.5) / z + 0.5;
  uv.y += uScroll * 0.07;

  // cover fit, keep minimum visible width on portrait
  vec2 s = sa > ta ? vec2(1.0, ta / sa) : vec2(sa / ta, 1.0);
  s *= max(1.0, uFit / s.x);
  vec2 tuv = (uv - 0.5) * s + 0.5;

  // chromatic split
  vec2 off = vec2(dir.x, dir.y) * (0.0012 + uVel * 0.014 + lens * 0.005) * s;
  vec3 col = vec3(tex(tuv + off).r, tex(tuv).g, tex(tuv - off).b) * uHasTex;
  col = max(col - 0.012, 0.0) * 1.05;

  // intro dissolve
  vec2 rp = vUv * vec2(sa, 1.0);
  float rn = noise(rp * 4.0) * 0.65 + noise(rp * 18.0) * 0.35;
  float edge = uReveal * 1.3 - 0.15;
  float m = 1.0 - smoothstep(edge - 0.05, edge + 0.01, rn);
  float rim = smoothstep(0.018, 0.0, abs(rn - edge)) * (1.0 - smoothstep(0.85, 1.0, uReveal));
  col = col * m + vec3(0.62, 0.86, 1.0) * rim * 0.22;

  // dim as we scroll away
  col *= 1.0 - smoothstep(0.45, 1.5, uScroll) * 0.8;
  col += vec3(0.62, 0.8, 1.0) * 0.02 * lens * uHasTex;

  // vignette + grain
  vec2 q = vUv - 0.5;
  col *= 1.0 - dot(q, q) * 0.9;
  col += (hash(vUv * uRes + fract(uTime) * 97.0) - 0.5) * 0.03;
  gl_FragColor = vec4(col, 1.0);
}`;

let quadScene, orthoCam, pScene, pCam, points, vtex;
if (renderer) {
  renderer.setClearColor(0x000000, glVideo ? 1 : 0);
  renderer.autoClear = false;

  quadScene = new THREE.Scene();
  orthoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  if (glVideo) {
    vtex = new THREE.VideoTexture(video);
    vtex.minFilter = THREE.LinearFilter;
    vtex.magFilter = THREE.LinearFilter;
    vtex.generateMipmaps = false;
    U.uTex.value = vtex;
    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms: U,
        vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
        fragmentShader: FRAG,
        depthTest: false,
        depthWrite: false,
      })
    );
    quadScene.add(quad);
  }

  // particle dust
  pScene = new THREE.Scene();
  pCam = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  pCam.position.set(0, 0, 10);
  const N = isTouch ? 900 : 2200;
  const pos = new Float32Array(N * 3), seed = new Float32Array(N), size = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = 2.6 + Math.pow(Math.random(), 0.7) * 13;
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.8;
    pos[i * 3 + 2] = r * Math.cos(ph) - 2;
    seed[i] = Math.random();
    size[i] = 0.6 + Math.pow(Math.random(), 3) * 3.2;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  points = new THREE.Points(
    g,
    new THREE.ShaderMaterial({
      uniforms: U,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTime, uPR, uScroll, uReveal;
        attribute float aSeed, aSize;
        varying float vA; varying float vS;
        void main(){
          vec3 p = position;
          float t = uTime * 0.12 + aSeed * 6.2831;
          p.x += sin(t + p.y * 0.3) * 0.35;
          p.y += cos(t * 1.3 + p.x * 0.2) * 0.35 + uScroll * (1.0 + aSeed * 2.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * uPR * (14.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
          float tw = 0.5 + 0.5 * sin(uTime * (0.6 + aSeed * 1.8) + aSeed * 40.0);
          vA = (0.25 + 0.75 * tw) * smoothstep(28.0, 5.0, -mv.z) * uReveal;
          vS = aSeed;
        }`,
      fragmentShader: /* glsl */ `
        varying float vA; varying float vS;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          vec3 c = mix(vec3(0.85, 0.87, 0.9), vec3(0.6, 0.85, 1.0), step(0.7, vS));
          c = mix(c, vec3(0.78, 0.7, 1.0), step(0.92, vS));
          gl_FragColor = vec4(c, a * vA * 0.75);
        }`,
    })
  );
  pScene.add(points);
}

function resize() {
  const w = innerWidth, h = innerHeight;
  if (renderer) {
    const pr = Math.min(devicePixelRatio || 1, isTouch ? 1.5 : 1.75);
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    U.uPR.value = pr;
    pCam.aspect = w / h;
    pCam.updateProjectionMatrix();
  }
  U.uRes.value.set(w, h);
  U.uFit.value = w / h < 1 ? 0.52 : 0;
}
addEventListener("resize", resize);
resize();
video.addEventListener("loadedmetadata", () => {
  if (video.videoWidth) U.uTexRes.value.set(video.videoWidth, video.videoHeight);
});
video.addEventListener("playing", () => { if (glVideo) U.uHasTex.value = 1; });

/* ============================================================
   Pointer + custom cursor
   ============================================================ */
const cursor = $("#cursor");
const cDot = $(".c-dot"), cRing = $(".c-ring"), cLabel = $(".c-ring span");
const cur = { x: innerWidth / 2, y: innerHeight / 2, rx: innerWidth / 2, ry: innerHeight / 2 };
document.documentElement.addEventListener("mouseleave", () => (pointerSeen = false));
addEventListener("pointermove", (e) => {
  cur.x = e.clientX; cur.y = e.clientY;
  if (e.pointerType === "mouse") pointerSeen = true;
  mouse.tx = e.clientX / innerWidth;
  mouse.ty = 1 - e.clientY / innerHeight;
}, { passive: true });

document.addEventListener("pointerover", (e) => {
  const t = e.target.closest("[data-cursor], [data-hover], a, button, .card");
  cursor.classList.remove("hover", "label");
  if (!t) return;
  const label = t.dataset.cursor || (t.classList.contains("card") ? "Play" : "");
  if (label) { cLabel.textContent = label; cursor.classList.add("label"); }
  else cursor.classList.add("hover");
});

/* ============================================================
   Work-list hover preview
   ============================================================ */
const preview = $("#preview");
const pImg = $("img", preview), pVid = $("video", preview);
const pv = { x: 0, y: 0, cur: null };
if (!isTouch) {
  workList.addEventListener("pointerenter", () => preview.classList.add("on"));
  workList.addEventListener("pointerleave", () => {
    preview.classList.remove("on");
    pVid.pause();
    pv.cur = null;
  });
  $$(".work-row", workList).forEach((row) => {
    row.addEventListener("pointerenter", () => {
      const c = catById[row.dataset.id];
      if (pv.cur === c.id) return;
      pv.cur = c.id;
      const it = c.items[c.cover] || c.items[0];
      pImg.src = it.poster;
      pVid.classList.remove("ready");
      pVid.src = it.src;
      pVid.currentTime = 0;
      pVid.play().then(() => pVid.classList.add("ready")).catch(() => {});
    });
  });
}

/* ============================================================
   About photo spotlight
   ============================================================ */
const spot = { r: 0, tr: 0 };
if (isTouch) {
  $(".ph-color", photo).style.clipPath = "none";
} else {
  photo.addEventListener("pointermove", (e) => {
    const b = photo.getBoundingClientRect();
    photo.style.setProperty("--x", `${e.clientX - b.left}px`);
    photo.style.setProperty("--y", `${e.clientY - b.top}px`);
  });
  photo.addEventListener("pointerenter", () => (spot.tr = Math.max(150, photo.offsetWidth * 0.32)));
  photo.addEventListener("pointerleave", () => (spot.tr = 0));
}

/* ============================================================
   Reveal observers
   ============================================================ */
let revealIO = null;
function startReveals() {
  revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      en.target.querySelectorAll?.("[data-count]").forEach(countUp);
      if (en.target.matches("[data-count]")) countUp(en.target);
      revealIO.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
  $$(".reveal, [data-split], #stats").forEach((el) => revealIO.observe(el));
  // stagger the hero bits
  $$(".hero .reveal").forEach((el, i) => el.style.setProperty("--d", `${0.5 + i * 0.08}s`));
}
function countUp(el) {
  if (el.dataset.done) return;
  el.dataset.done = 1;
  const to = +el.dataset.count, t0 = performance.now(), D = 1400;
  const step = (t) => {
    const k = clamp((t - t0) / D, 0, 1);
    el.textContent = pad2(Math.round(to * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ============================================================
   Category view
   ============================================================ */
const cat = $("#cat"), catGrid = $("#catGrid");
let openCatId = null;
let catCovered = false;
let cardIO = null;

function renderCat(c) {
  const n = CATEGORIES.indexOf(c);
  $("#catIndex").textContent = `${pad2(n + 1)} / ${pad2(CATEGORIES.length)}`;
  const title = $("#catTitle");
  title.innerHTML = `<span data-split>${c.title}</span>`;
  split(title.firstChild);
  title.insertAdjacentHTML("beforeend", `<sup>(${pad2(c.items.length)})</sup>`);
  $("#catSub").textContent = c.sub;
  $("#catDesc").textContent = c.desc;
  catGrid.innerHTML = c.items
    .map((it) => {
      const ar = clamp(it.w / it.h, 0.5, 2.6);
      return `<article class="card" data-i="${it.i}" data-ar="${ar}" style="--d:${(it.i % 3) * 0.08}s; transition-delay: var(--d)">
        <div class="card-media" style="aspect-ratio:${ar}"><img loading="lazy" src="${it.poster}" alt="${it.title}" /></div>
        <div class="card-cap"><h4>${pad2(it.i + 1)} — ${it.title}</h4><span class="mono">${it.fmt}${it.dur ? " · " + durLabel(it.dur) : ""}</span></div>
      </article>`;
    })
    .join("");
  layoutGrid(true);
  const next = CATEGORIES[(n + 1) % CATEGORIES.length];
  const nx = $("#catNext");
  nx.href = `#${next.id}`;
  nx.innerHTML = `<span class="mono">Next — ${pad2(CATEGORIES.indexOf(next) + 1)}</span><strong>${next.title} →</strong>`;
  cat.scrollTop = 0;

  cardIO?.disconnect();
  cardIO = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), cardIO.unobserve(e.target))), { root: cat, threshold: 0.08 });
  $$(".card", catGrid).forEach((el) => cardIO.observe(el));
  requestAnimationFrame(() => setTimeout(() => title.firstChild.classList.add("in"), 350));
  setupCards(c);
}

// Masonry: thả từng card vào cột thấp nhất -> thứ tự đọc trái sang phải
let gridCols = 0;
function layoutGrid(force = false) {
  const w = innerWidth;
  const n = w > 1100 ? 3 : w > 640 ? 2 : 1;
  if (!force && n === gridCols) return;
  gridCols = n;
  const cards = $$(".card", catGrid).sort((a, b) => a.dataset.i - b.dataset.i);
  const cols = Array.from({ length: n }, () => Object.assign(document.createElement("div"), { className: "cat-col" }));
  const hts = new Array(n).fill(0);
  cards.forEach((card) => {
    const k = hts.indexOf(Math.min(...hts));
    cols[k].appendChild(card);
    hts[k] += 1 / parseFloat(card.dataset.ar) + 0.18;
  });
  catGrid.replaceChildren(...cols);
}
addEventListener("resize", () => openCatId && layoutGrid());

function setupCards(c) {
  $$(".card", catGrid).forEach((card) => {
    const it = c.items[+card.dataset.i];
    card.addEventListener("click", () => openLightbox(c.id, it.i));
    if (isTouch) return;
    let v = null;
    card.addEventListener("pointerenter", () => {
      if (!v) {
        v = document.createElement("video");
        v.muted = true; v.loop = true; v.playsInline = true; v.preload = "none";
        v.src = it.src;
        $(".card-media", card).appendChild(v);
      }
      v.play().then(() => v.classList.add("ready")).catch(() => {});
    });
    card.addEventListener("pointerleave", () => { v && v.pause(); });
  });
}

function openCat(id) {
  const c = catById[id];
  if (!c) return;
  if (openCatId && openCatId !== id) {
    // chuyển mục: wipe màu
    const w = $("#wipe");
    w.classList.remove("run"); void w.offsetWidth; w.classList.add("run");
    setTimeout(() => renderCat(c), 480);
  } else if (!openCatId) {
    renderCat(c);
    cat.classList.add("open");
    cat.setAttribute("aria-hidden", "false");
  }
  openCatId = id;
  document.documentElement.style.overflow = lenis ? "" : "hidden";
  lenis?.stop();
  preview.classList.remove("on");
  pVid.pause();
  setTimeout(() => openCatId && video.pause(), 1000);
}
function closeCat() {
  if (!openCatId) return;
  openCatId = null;
  catCovered = false;
  cat.classList.remove("open");
  cat.setAttribute("aria-hidden", "true");
  document.documentElement.style.overflow = "";
  lenis?.start();
  video.play().catch(() => {});
  $$("video", catGrid).forEach((v) => v.pause());
}

/* ============================================================
   Lightbox
   ============================================================ */
const lb = $("#lightbox"), lbVideo = $("#lbVideo");
const lbState = { cat: null, i: 0 };
function openLightbox(catId, i) {
  const c = catById[catId];
  i = (i + c.items.length) % c.items.length;
  const it = c.items[i];
  lbState.cat = catId; lbState.i = i;
  $("#lbCount").textContent = `${c.title} — ${pad2(i + 1)} / ${pad2(c.items.length)}`;
  $("#lbTitle").textContent = it.title;
  lbVideo.poster = it.poster;
  lbVideo.src = it.src;
  lbVideo.play().catch(() => {});
  lb.classList.add("open");
  lb.setAttribute("aria-hidden", "false");
  $$("video", catGrid).forEach((v) => v.pause());
}
function closeLightbox() {
  if (!lb.classList.contains("open")) return false;
  lb.classList.remove("open");
  lb.setAttribute("aria-hidden", "true");
  lbVideo.pause();
  lbVideo.removeAttribute("src");
  lbVideo.load();
  return true;
}
$("#lbClose").addEventListener("click", closeLightbox);
$("#lbPrev").addEventListener("click", () => openLightbox(lbState.cat, lbState.i - 1));
$("#lbNext").addEventListener("click", () => openLightbox(lbState.cat, lbState.i + 1));
lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("lb-stage")) closeLightbox(); });

addEventListener("keydown", (e) => {
  if (lb.classList.contains("open")) {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") openLightbox(lbState.cat, lbState.i + 1);
    if (e.key === "ArrowLeft") openLightbox(lbState.cat, lbState.i - 1);
  } else if (openCatId && e.key === "Escape") {
    goSection("#work");
  }
});

/* ============================================================
   Routing
   ============================================================ */
function goSection(sel) {
  const wasOpen = !!openCatId;
  if (catById[location.hash.slice(1)]) {
    try { history.pushState(null, "", location.pathname + location.search); }
    catch { location.hash = ""; }
  }
  closeLightbox();
  closeCat();
  scrollToEl(sel, wasOpen);
}
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[data-link], a.cat-back");
  if (!a) return;
  const href = a.getAttribute("href");
  if (!href || !href.startsWith("#") || catById[href.slice(1)]) return;
  e.preventDefault();
  goSection(href);
});
// Mỗi mục có link riêng: #visual, #logo, #kv, #edit
function route() {
  const id = location.hash.replace(/^#\/?/, "");
  if (catById[id]) openCat(id);
  else { closeLightbox(); closeCat(); }
}
addEventListener("hashchange", route);

/* ============================================================
   Loader
   ============================================================ */
const loader = $("#loader"), lNum = $("#loaderNum"), lBar = $("#loaderBar");
const ld = { shown: 0, target: 0, done: false, t0: performance.now() };
const parts = { fonts: 0, photo: 0, video: 0 };
const updTarget = () => (ld.target = (parts.fonts * 0.15 + parts.photo * 0.15 + parts.video * 0.7) * 100);
document.fonts?.ready.then(() => { parts.fonts = 1; updTarget(); });
if (!document.fonts) parts.fonts = 1;
const im = new Image();
im.onload = im.onerror = () => { parts.photo = 1; updTarget(); };
im.src = PROFILE.photo;
function vidProgress() {
  if (video.readyState >= 4) parts.video = 1;
  else if (video.duration && video.buffered.length) parts.video = Math.max(parts.video, clamp(video.buffered.end(video.buffered.length - 1) / video.duration, 0, 1));
  updTarget();
}
["progress", "canplaythrough", "loadeddata"].forEach((ev) => video.addEventListener(ev, vidProgress));
video.addEventListener("error", () => { parts.video = 1; updTarget(); });
setTimeout(() => { parts.video = 1; parts.fonts = 1; parts.photo = 1; updTarget(); }, 9000);

function finishLoading() {
  ld.done = true;
  lNum.textContent = "100";
  lBar.style.width = "100%";
  video.play().catch(() => {});
  setTimeout(() => {
    loader.classList.add("done");
    document.body.classList.remove("is-loading");
    lenis?.start();
    reveal.t0 = performance.now();
    reveal.on = true;
    startReveals();
    route();
  }, 250);
  setTimeout(() => loader.remove(), 1600);
}

// ?skip — bỏ qua loader (debug / chụp màn hình)
const SKIP = new URLSearchParams(location.search).has("skip");
if (SKIP) {
  document.documentElement.classList.add("skip");
  const only = new URLSearchParams(location.search).get("only");
  if (only) $$("#page > section").forEach((s) => s.id !== only && (s.style.display = "none"));
  U.uReveal.value = 1;
  finishLoading();
  $$(".reveal, [data-split], .card").forEach((el) => el.classList.add("in"));
}

/* ============================================================
   Main loop
   ============================================================ */
const reveal = { on: false, t0: 0, D: SKIP ? 1 : 2600 };
let last = performance.now();
const heroTitle = $(".hero-title");
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  // loader
  if (!ld.done) {
    const minT = clamp((now - ld.t0) / 1800, 0, 1) * 100; // tối thiểu ~1.8s cho cảm giác mượt
    const goal = Math.min(ld.target, minT);
    ld.shown = lerp(ld.shown, goal, 0.08);
    lNum.textContent = Math.floor(ld.shown);
    lBar.style.width = `${ld.shown}%`;
    if (ld.target >= 100 && ld.shown > 99.3) finishLoading();
  }

  lenis?.raf(now);
  readScroll();
  const vh = innerHeight;
  const sc = scrollY / vh;
  document.body.classList.toggle("scrolled", scrollY > 40);

  // hero parallax (DOM)
  if (sc < 1.5) {
    heroTitle.style.transform = `translate3d(0, ${scrollY * -0.22}px, 0)`;
    heroTitle.style.opacity = String(1 - clamp(sc * 1.1, 0, 1) * 0.9);
  }
  if (!glVideo) video.style.setProperty("--hero-op", String(1 - clamp((sc - 0.4) / 1.1, 0, 0.82)));

  // cursor
  cur.rx = lerp(cur.rx, cur.x, 0.16);
  cur.ry = lerp(cur.ry, cur.y, 0.16);
  cursor.classList.toggle("live", pointerSeen);
  cDot.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;
  cRing.style.transform = `translate3d(${cur.rx}px, ${cur.ry}px, 0)`;

  // preview follow
  pv.x = lerp(pv.x, cur.x, 0.12);
  pv.y = lerp(pv.y, cur.y, 0.12);
  preview.style.transform = `translate3d(${pv.x + 40}px, ${pv.y}px, 0) rotate(${clamp((cur.x - pv.x) * 0.04, -8, 8)}deg)`;

  // photo spotlight
  spot.r = lerp(spot.r, spot.tr, 0.12);
  if (!isTouch) $(".ph-color", photo).style.setProperty("--r", `${spot.r.toFixed(1)}px`);

  if (!renderer || document.hidden) return;

  // mouse smoothing + velocity
  const pmx = mouse.x, pmy = mouse.y;
  mouse.x = lerp(mouse.x, mouse.tx, 0.09);
  mouse.y = lerp(mouse.y, mouse.ty, 0.09);
  const v = Math.hypot(mouse.x - pmx, mouse.y - pmy) / Math.max(dt, 0.001);
  mouse.vel = lerp(mouse.vel, clamp(v * 0.35, 0, 1), 0.08);

  U.uTime.value = now / 1000;
  U.uMouse.value.set(mouse.x, mouse.y);
  U.uVel.value = reduced ? 0 : mouse.vel;
  U.uLens.value = lerp(U.uLens.value, pointerSeen && !reduced ? 1 : 0, 0.04);
  U.uScroll.value = lerp(U.uScroll.value, sc, 0.2);
  if (reveal.on) {
    const k = clamp((now - reveal.t0) / reveal.D, 0, 1);
    U.uReveal.value = 1 - Math.pow(1 - k, 3);
  }

  // particles parallax
  points.rotation.y += dt * 0.02;
  pCam.position.x = lerp(pCam.position.x, (mouse.x - 0.5) * 1.6, 0.04);
  pCam.position.y = lerp(pCam.position.y, (mouse.y - 0.5) * 1.0, 0.04);
  pCam.lookAt(0, 0, 0);

  if (catCovered) return; // overlay che kín: bỏ qua render để nhẹ máy
  renderer.clear();
  if (glVideo) {
    try {
      renderer.render(quadScene, orthoCam);
    } catch (err) {
      // video bị chặn đọc (cross-origin) -> phát video thường phía sau canvas
      console.warn("WebGL video fallback", err);
      glVideo = false;
      document.body.classList.add("no-gl-video");
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
    }
  }
  renderer.render(pScene, pCam);
}
cat.addEventListener("transitionend", (e) => {
  if (e.target === cat && e.propertyName === "clip-path") catCovered = !!openCatId;
});
requestAnimationFrame(frame);
