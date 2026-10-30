/* Shader World. Order: knobs, shader, engine, scroll, pointer, nav, signature, controls, boot. */

// ---------- Knobs and states ----------
// Knobs in plain words. Change a number, save, reload.
const CONFIG = {
  speed: 0.35,        // how fast the field flows. 0.15 = very slow, 0.6 = lively
  detail: 4,          // noise layers per pixel. 4 = rich, 3 = cheaper. Phones always use 3
  quality: 0.65,      // share of the screen's pixels the shader paints. 0.5 = soft and cheap, 1 = sharp
  maxPixelRatio: 1.5, // never paint for more than 1.5 pixels per CSS pixel, even on sharp screens
  maxFps: 30,         // the field is slow, so 30 updates a second looks smooth and halves the work
  pointer: true,      // a mouse gently pushes the field. Touch screens never do
};

// One state per section, in page order. Colours are plain sRGB hex.
// scale = size of the shapes (bigger = more, smaller shapes), warp = how much the flow folds over itself,
// irid = strength of the oil-slick colour shift on slopes, cam = [x, y, zoom] of the camera over the field.
const STATES = [
  { name: 'tide',  dark: '#06232B', mid: '#0F6B73', light: '#9FE3D2', scale: 1.6, warp: 1.6, irid: 0.10, cam: [0.0, 0.0, 1.0] },
  { name: 'dusk',  dark: '#1B1030', mid: '#6B2F6E', light: '#F0A58C', scale: 2.2, warp: 2.4, irid: 0.14, cam: [3.0, 1.0, 1.2] },
  { name: 'ember', dark: '#240A0A', mid: '#B03A14', light: '#FFB05C', scale: 1.3, warp: 3.0, irid: 0.06, cam: [-2.0, 4.0, 1.5] },
  { name: 'glass', dark: '#0B1A33', mid: '#2C5FA8', light: '#BFD7FF', scale: 2.8, warp: 1.2, irid: 0.18, cam: [5.0, -3.0, 1.0] },
  { name: 'moss',  dark: '#0E1F14', mid: '#3E7D4F', light: '#D6EBB0', scale: 1.8, warp: 2.0, irid: 0.08, cam: [1.0, 6.0, 0.9] },
];

const root = document.documentElement;
const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduce = reduceQuery.matches;
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
STATES.forEach((s) => { s.rgb = { dark: hexToRgb(s.dark), mid: hexToRgb(s.mid), light: hexToRgb(s.light) }; });

// ---------- The shader (GLSL) ----------
const VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);   // one big triangle covers the screen
  }`;

const FRAG = /* glsl */`
  uniform float uTime;         // seconds of flow (already multiplied by CONFIG.speed, frozen when paused)
  uniform vec2  uResolution;   // size of the painted canvas in pixels
  uniform float uScroll;       // 0 at the top of the page, 1 at the bottom
  uniform vec2  uPointer;      // mouse position, 0..1, origin bottom-left
  uniform float uPointerAmt;   // 0 = no disturbance, 1 = full
  uniform float uIntro;        // 0 to 1 while the world wakes up at page load
  uniform vec3  uCam;          // camera over the field: x, y, zoom
  uniform float uScale, uWarp, uIrid;
  uniform vec3  uDark, uMid, uLight;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {                                   // smooth value noise
    vec2 i = floor(p), f = fract(p);
    f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {                                     // layers of noise, each finer and fainter
    float sum = 0.0, amp = 0.5;
    mat2 turn = mat2(0.8, -0.6, 0.6, 0.8);                // turn each layer so no grid lines show
    for (int i = 0; i < OCTAVES; i++) {                   // OCTAVES is 3 or 4, never a big loop
      sum += amp * noise(p);
      p = turn * p * 2.03 + 17.1;
      amp *= 0.5;
    }
    return sum;
  }

  void main() {
    float aspect = uResolution.x / uResolution.y;
    vec2 s = (vUv - 0.5) * vec2(aspect, 1.0);             // screen space: height is 1, centre is 0

    // The pointer pulls the space around it a little, like a finger pressed under a cloth.
    vec2 m = (uPointer - 0.5) * vec2(aspect, 1.0);
    vec2 d = s - m;
    s -= d * exp(-dot(d, d) * 10.0) * uPointerAmt * 0.45;

    vec2 p = s * uScale / uCam.z + uCam.xy;               // where on the field this pixel looks
    float t = uTime;
    float w = uWarp * mix(0.25, 1.0, uIntro);             // the folds grow while the world wakes up

    // Domain warping: noise that bends the coordinates of more noise. Five fbm calls in total.
    vec2 q = vec2(fbm(p + 0.20 * t), fbm(p + vec2(5.2, 1.3) - 0.16 * t));
    vec2 r = vec2(fbm(p + w * q + vec2(1.7, 9.2) + 0.12 * t),
                  fbm(p + w * q + vec2(8.3, 2.8) - 0.10 * t));
    float f = fbm(p + w * r);

    // Colour: dark to mid to light, picked by how "high" the field is here.
    float shade = clamp(f * f * 2.2 + 0.45 * length(q) - 0.15, 0.0, 1.0);
    vec3 col = mix(uDark, uMid, smoothstep(0.05, 0.7, shade));
    col = mix(col, uLight, smoothstep(0.6, 1.0, shade + 0.35 * (r.y - 0.5)) * 0.9);

    // Sheen: slopes that face the top-left catch light. dFdx/dFdy are free slopes from the GPU.
    vec2 g = vec2(dFdx(f), dFdy(f)) * uResolution.y * 0.012;
    float sheen = clamp(dot(g, vec2(-0.5, 0.7)) * 2.0, 0.0, 1.0);
    vec3 film = 0.5 + 0.5 * cos(6.2832 * (f * 1.5 + uScroll + vec3(0.0, 0.33, 0.67)));   // oil-slick hue
    col += film * sheen * uIrid + uLight * sheen * 0.10;

    col *= 1.0 - 0.4 * dot(s, s);                         // darker edges keep the eye in the middle
    col *= mix(0.55, 1.0, uIntro);                        // dim until the world has woken up
    col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;         // a speck of dither stops colour banding
    gl_FragColor = vec4(col, 1.0);
  }`;

// ---------- The engine (load, size, loop, stop, fall back) ----------
// The three.js part is loaded with import(), so a failed download only loses the shader, never the page.
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js';
const INTRO_SECONDS = 2.4;
let THREE = null, world = false;
let renderer, scene, camera, geometry, material, uniforms, canvas;
let frame = 0, lastDraw = 0, age = 0, time = 14;   // time starts mid-flow so the first picture is already pretty
let pos = 0, target = 0;                            // where the world is, and where scrolling says it should be
let userPaused = false, quality = CONFIG.quality, sizeW = 0, sizeH = 0, slow = 0;

const isRunning = () => !reduce && !userPaused && !document.hidden;   // is the field allowed to flow?

async function startWorld() {
  try {
    THREE = await import(THREE_URL);
    // Phones and small windows: fewer noise layers and fewer pixels.
    const small = Math.min(window.innerWidth, window.innerHeight) < 600;
    if (small) quality = Math.min(quality, 0.5);
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power' });
    canvas = renderer.domElement;
    canvas.className = 'world';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.addEventListener('webglcontextlost', (event) => { event.preventDefault(); stopWorld(); });
    document.body.prepend(canvas);

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
    uniforms = {
      uTime: { value: 0 }, uResolution: { value: new THREE.Vector2(1, 1) }, uScroll: { value: 0 },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) }, uPointerAmt: { value: 0 }, uIntro: { value: reduce ? 1 : 0 },
      uCam: { value: new THREE.Vector3(0, 0, 1) }, uScale: { value: 1.6 }, uWarp: { value: 1.6 }, uIrid: { value: 0.1 },
      uDark: { value: new THREE.Vector3() }, uMid: { value: new THREE.Vector3() }, uLight: { value: new THREE.Vector3() },
    };
    material = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, uniforms,
      defines: { OCTAVES: small ? 3 : CONFIG.detail },
      depthTest: false, depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene = new THREE.Scene();
    scene.add(mesh);
    camera = new THREE.Camera();

    world = true;
    resize(true);
    render();
    // A shader that fails to compile does not throw; three.js records it. Check, then fall back.
    if (renderer.info.programs.some((program) => program.diagnostics)) throw new Error('The background shader did not compile.');
    root.classList.add('has-world');
    if (toggle) toggle.hidden = reduce;
    wake();
  } catch (error) {
    console.warn('Background shader unavailable, showing the CSS background instead.', error);
    stopWorld();
  }
}

function stopWorld() {            // used for every failure, and frees everything we made
  world = false;
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  if (geometry) geometry.dispose();
  if (material) material.dispose();
  if (renderer) renderer.dispose();
  if (canvas) canvas.remove();
  root.classList.remove('has-world');
  if (toggle) toggle.hidden = true;
}

function resize(force) {
  const w = window.innerWidth, h = window.innerHeight;
  if (!force && w === sizeW && Math.abs(h - sizeH) < 160) return;   // phone toolbars sliding in and out change the height; ignore that
  sizeW = w; sizeH = h;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, CONFIG.maxPixelRatio) * quality);
  renderer.setSize(w, h, false);                                     // false: CSS keeps the canvas full screen
  renderer.getDrawingBufferSize(uniforms.uResolution.value);
  wake();                                                            // resizing clears the canvas, so paint again
}

function wake() {                 // ask for at least one more frame; the loop stops by itself when nothing changes
  if (frame || !world || document.hidden) return;
  frame = requestAnimationFrame(tick);
}

function tick(now) {
  frame = 0;
  if (!world || document.hidden) return;
  const live = isRunning();
  if (live && now - lastDraw < 1000 / CONFIG.maxFps - 4) { frame = requestAnimationFrame(tick); return; }
  const dt = Math.min((now - lastDraw) / 1000, 0.1);
  lastDraw = now;
  age += dt;
  if (live) time += dt * CONFIG.speed;
  pos += (target - pos) * (1 - Math.exp(-dt * 2.5));                // the world glides to where the page says (no overshoot)
  if (Math.abs(target - pos) < 0.004) pos = target;
  followPointer(dt);
  uniforms.uIntro.value = reduce ? 1 : 1 - Math.pow(1 - clamp(age / INTRO_SECONDS, 0, 1), 3);   // page load: the world wakes up
  render();
  watchSpeed(dt, live);
  const settling = pos !== target || pointer.amt !== pointer.goal || (!reduce && age < INTRO_SECONDS);
  if ((live || settling) && !frame) frame = requestAnimationFrame(tick);   // paused and settled: no more frames
}

function render() {
  uniforms.uTime.value = time;
  applyWorld(pos);
  renderer.render(scene, camera);
}

// If the machine is struggling for a while, paint fewer pixels. Never ask the student to do this by hand.
function watchSpeed(dt, live) {
  if (!live || age < 3) return;
  slow = dt > 0.05 ? slow + 1 : Math.max(0, slow - 1);
  if (slow > 24 && quality > 0.3) { quality *= 0.8; slow = 0; resize(true); }
}

// ---------- Scroll: the camera drifts, the panel edges catch the light ----------
const sections = [...document.querySelectorAll('main section[id]')];
let anchors = [], tops = [], maxScroll = 0;

function measure() {              // runs on load, on resize and whenever the page height changes (fonts, wrapping)
  const vh = window.innerHeight;
  maxScroll = Math.max(0, root.scrollHeight - vh);
  tops = sections.map((section) => section.getBoundingClientRect().top + window.scrollY);   // also used by the nav
  // A section's own state is fully reached when its top edge is a little below the top of the screen,
  // so a nav jump (which puts the section at the top) always lands in the right state.
  anchors = tops.map((top) => clamp(top - vh * 0.2, 0, maxScroll));
  if (anchors.length) anchors[0] = 0;
  readScroll();
}

function readScroll() {           // turns scroll position into "how far along the sections are we", e.g. 2.4
  let p = 0;
  const n = anchors.length, y = window.scrollY;
  if (n > 1 && y >= maxScroll - 2) p = n - 1;                        // the very bottom is always the last state
  else if (n > 1) {
    let i = 0;
    while (i < n - 2 && y >= anchors[i + 1]) i++;
    const span = anchors[i + 1] - anchors[i];
    p = i + (span > 0 ? clamp((y - anchors[i]) / span, 0, 1) : 1);
  }
  target = reduce ? 0 : p;                                           // reduced motion: the world stays in its first state
  wake();
}

window.addEventListener('scroll', readScroll, { passive: true });
window.addEventListener('resize', () => { if (world) resize(false); measure(); });
if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);

// ---------- Hover and focus: a soft push from the mouse ----------
const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, amt: 0, goal: 0 };
let pointerIdle = 0;

function followPointer(dt) {      // called by tick(): ease toward the real pointer, fade the push in and out
  pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-dt * 8));
  pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-dt * 8));
  pointer.amt += (pointer.goal - pointer.amt) * (1 - Math.exp(-dt * 4));
  if (Math.abs(pointer.goal - pointer.amt) < 0.003) pointer.amt = pointer.goal;
  uniforms.uPointer.value.set(pointer.x, pointer.y);
  uniforms.uPointerAmt.value = pointer.amt;
}

if (CONFIG.pointer && window.matchMedia('(pointer: fine)').matches) {
  window.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || !isRunning()) return;       // mouse only, and not while paused
    pointer.tx = event.clientX / window.innerWidth;
    pointer.ty = 1 - event.clientY / window.innerHeight;
    pointer.goal = 1;
    clearTimeout(pointerIdle);
    pointerIdle = setTimeout(() => { pointer.goal = 0; wake(); }, 1500);   // fade the push out when the mouse rests
    wake();
  }, { passive: true });
  root.addEventListener('pointerleave', () => { pointer.goal = 0; wake(); });
}

// ---------- Navigation: the world travels ----------
const header = document.querySelector('.site-header');
const navLinks = [...document.querySelectorAll('.site-header nav a')];
function currentId() {            // the section under a line 40% down the screen; the last one at the very bottom
  const last = sections[sections.length - 1];
  if (!last) return '';
  if (window.innerHeight + window.scrollY >= root.scrollHeight - 2) return last.id;
  const line = window.scrollY + window.innerHeight * 0.4;
  let id = sections[0].id;
  tops.forEach((top, i) => { if (top <= line) id = sections[i].id; });
  return id;
}
// After a nav jump, keep the jumped-to link current until the visitor scrolls on their own.
let jumpedTo = '', jumpSeen = false;
function selectLink(id) {
  id = jumpedTo || id;
  navLinks.forEach((link) => {
    // setAttribute, not toggleAttribute: aria-current="" counts as false for screen readers.
    if (link.hash === '#' + id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
function releaseJump() { jumpedTo = ''; selectLink(currentId()); }
document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', () => {
  const dest = document.getElementById(a.hash.slice(1));
  if (dest && dest.matches('main section[id]')) { jumpedTo = dest.id; jumpSeen = false; selectLink(dest.id); }
}));
['wheel', 'touchmove'].forEach((name) => window.addEventListener(name, () => { if (jumpedTo) releaseJump(); }, { passive: true }));
window.addEventListener('keydown', (event) => {
  if (jumpedTo && ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Tab'].includes(event.key)) releaseJump();
});
window.addEventListener('scroll', () => {
  if (jumpedTo) {                                  // a scrollbar drag: release once the target was on screen and has left it
    const box = document.getElementById(jumpedTo).getBoundingClientRect();
    if (box.bottom > header.offsetHeight && box.top < window.innerHeight) jumpSeen = true;   // visible below the header
    else if (jumpSeen) releaseJump();
  }
  selectLink(currentId());
}, { passive: true });

// Header height changes with wrapping; scroll-margin-top uses it so a jump never lands under the bar.
if (header && 'ResizeObserver' in window) {
  new ResizeObserver(() => root.style.setProperty('--header-h', header.offsetHeight + 'px')).observe(header);
}

// ---------- Signature: one world, five moods ----------
// Blend the two neighbouring states by how far along we are (pos = 2.4 means 40% of the way from state 2 to state 3).
function mixInto(vec, a, b, t) { vec.set(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)); }
let lastEdge = -1;

function applyWorld(p) {
  const n = STATES.length, i = Math.floor(p), t = smooth(p - i);   // smooth(): each state rests a moment, then eases to the next
  const a = STATES[i % n], b = STATES[(i + 1) % n];
  mixInto(uniforms.uDark.value, a.rgb.dark, b.rgb.dark, t);
  mixInto(uniforms.uMid.value, a.rgb.mid, b.rgb.mid, t);
  mixInto(uniforms.uLight.value, a.rgb.light, b.rgb.light, t);
  uniforms.uScale.value = lerp(a.scale, b.scale, t);
  uniforms.uWarp.value = lerp(a.warp, b.warp, t);
  uniforms.uIrid.value = lerp(a.irid, b.irid, t);
  uniforms.uCam.value.set(lerp(a.cam[0], b.cam[0], t), lerp(a.cam[1], b.cam[1], t) + p * 0.35, lerp(a.cam[2], b.cam[2], t));
  uniforms.uScroll.value = p / Math.max(1, anchors.length - 1);
  if (Math.abs(p - lastEdge) > 0.01) {                              // hand the light colour to CSS so panel edges pick it up
    lastEdge = p;
    const light = uniforms.uLight.value;
    root.style.setProperty('--world', `rgb(${Math.round(light.x * 255)} ${Math.round(light.y * 255)} ${Math.round(light.z * 255)})`);
  }
}

// ---------- Controls, visibility and boot ----------
const toggle = document.querySelector('.world-toggle');
function setPaused(value) {
  userPaused = value;
  if (toggle) toggle.textContent = value ? 'Play background' : 'Pause background';
  try { localStorage.setItem('world-paused', value ? '1' : '0'); } catch (error) { /* storage can be blocked; fine */ }
  wake();
}
if (toggle) toggle.addEventListener('click', () => setPaused(!userPaused));
try { if (localStorage.getItem('world-paused') === '1') setPaused(true); } catch (error) { /* ignore */ }

document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });   // hidden tab: the loop ends on its own
reduceQuery.addEventListener('change', () => {
  reduce = reduceQuery.matches;
  if (toggle && world) toggle.hidden = reduce;
  readScroll();
  wake();
});
measure();
selectLink(currentId());
startWorld();
