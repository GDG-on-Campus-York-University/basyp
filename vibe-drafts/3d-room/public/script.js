// script.js, part 1: shared setup (plain JavaScript; the page works with or without the room)
const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const small = window.matchMedia('(max-width: 760px), (pointer: coarse)');
const wide = window.matchMedia('(min-width: 1000px)');
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const sections = [...document.querySelectorAll('main > section[id]')];
const state = { active: null, wake() {} };   // the room replaces wake() once it exists
const room = { ready: false, lit: {}, blobs: [], projects: [] };  // everything 3D lives on this one object

// script.js, part 2: the room, built from boxes and cylinders. Units are roughly metres; y is up, the camera looks toward -z.
const COLORS = { wall: '#BFD8D0', side: '#AECBC2', floor: '#D9A76B', base: '#EFE8DA', wood: '#F0D9B5', legs: '#A5714B',
  seat: '#3E7C77', rug: '#8FB4D9', sky: '#CFE8F5', frame: '#F8F5EE', mustard: '#E8B04A', paper: '#EFE9DB' };
const BLOCKS = ['#E8B04A', '#6FA8DC', '#C95D63', '#7FB77E', '#9B7EBD', '#E8E3D3'];

function paint(geometry, color) {            // bake one colour into every vertex
  const c = new room.THREE.Color(color), n = geometry.attributes.position.count, rgb = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) rgb.set([c.r, c.g, c.b], i * 3);
  geometry.setAttribute('color', new room.THREE.BufferAttribute(rgb, 3));
  return geometry;
}
function box(w, h, d, x, y, z, color) { const g = new room.THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return paint(g, color); }
function cyl(rTop, rBottom, h, x, y, z, color, sides = 20) { const g = new room.THREE.CylinderGeometry(rTop, rBottom, h, sides); g.translate(x, y, z); return paint(g, color); }

// piece() merges parts into one mesh. options.light names the highlight group (a stop's "lights" list).
function piece(name, parts, options = {}) {
  const THREE = room.THREE;
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true });
  material.userData.tint = material.color.clone();   // the resting colour; the highlight brightens it (see update())
  const mesh = new THREE.Mesh(room.mergeGeometries(parts), material);
  mesh.name = name;
  mesh.castShadow = mesh.receiveShadow = true;
  room.scene.add(mesh);
  if (options.light) (room.lit[options.light] ||= { amount: 0, mats: [] }).mats.push(material);
  return mesh;
}

function blob(w, d, x, y, z) {               // fake contact shadow: one soft dark disc, used when real shadows are off
  const THREE = room.THREE;
  if (!room.blobMaterial) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const g = canvas.getContext('2d'), grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    grad.addColorStop(0, 'rgba(40,30,20,0.3)'); grad.addColorStop(1, 'rgba(40,30,20,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
    room.blobMaterial = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false });
  }
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), room.blobMaterial);
  mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, y, z); mesh.renderOrder = 1;
  room.scene.add(mesh); room.blobs.push(mesh);
}

// Small desk objects. One shape per real project, picked to match what SPEC.md says it is. No labels, no fake screens.
const SHAPES = {
  model: () => [box(0.62, 0.03, 0.62, 0, 0.015, 0, COLORS.paper), box(0.62, 0.22, 0.03, 0, 0.14, -0.295, '#FFFFFF'),
    box(0.03, 0.22, 0.62, -0.295, 0.14, 0, '#F6F1E6'), box(0.28, 0.22, 0.03, 0.15, 0.14, 0.05, '#FFFFFF')],   // a little foam-board model
  lamp: () => [cyl(0.14, 0.16, 0.04, 0, 0.02, 0, COLORS.seat), cyl(0.02, 0.02, 0.4, 0, 0.24, 0, COLORS.seat),
    cyl(0.09, 0.2, 0.24, 0, 0.56, 0, COLORS.mustard)],                                                         // an object or product
  board: () => [box(0.56, 0.4, 0.04, 0, 0.3, 0, '#C95D63'), box(0.5, 0.04, 0.2, 0, 0.02, 0.05, COLORS.legs)], // a poster, site or app
  stack: () => [box(0.5, 0.12, 0.4, 0, 0.06, 0, '#6FA8DC'), box(0.4, 0.12, 0.32, 0, 0.18, 0, '#7FB77E'), box(0.3, 0.12, 0.24, 0, 0.3, 0, '#9B7EBD')], // a collection
};
// Corner Studio = a foam-board model, Lantern Lamp = a product, Hallway Walkthrough = something viewed in a browser
const SHAPE_ORDER = ['model', 'lamp', 'board', 'stack'];

function buildRoom() {
  const THREE = room.THREE, scene = room.scene, C = COLORS;
  // Lighting basics: a soft sky/ground fill so shadows are never black, plus ONE warm "sun" that casts the shadows.
  scene.add(new THREE.HemisphereLight('#FFFFFF', '#D9CDBA', 1.5));
  const sun = new THREE.DirectionalLight('#FFF0D6', 2.0);
  sun.position.set(5, 9, 7);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
  scene.add(sun); room.sun = sun;

  // Shell: floor slab and two walls (the front and right are left open, like a dollhouse).
  piece('shell', [box(8.6, 0.2, 6.6, 0, -0.4, 0, C.base), box(8, 0.3, 6, 0, -0.15, 0, C.floor),
    box(8.25, 4, 0.25, -0.125, 2, -3.125, C.wall), box(0.25, 4, 6.25, -4.125, 2, -0.125, C.side),
    box(8, 0.15, 0.05, 0, 0.075, -2.975, C.base), box(0.05, 0.15, 6, -3.975, 0.075, 0, C.base)]);
  // Desk against the back wall (stop: projects).
  piece('desk', [box(2.8, 0.1, 1.1, -0.7, 1, -2.35, C.wood), box(0.1, 0.95, 0.1, -1.95, 0.475, -2.75, C.legs),
    box(0.1, 0.95, 0.1, -1.95, 0.475, -1.95, C.legs), box(0.8, 0.95, 0.95, 0.3, 0.475, -2.35, C.wood)], { light: 'desk' });
  // Chair on a rug (stop: about).
  const chair = piece('chair', [box(0.7, 0.1, 0.7, 0, 0.55, 0, C.seat), box(0.7, 0.65, 0.1, 0, 0.95, -0.3, C.seat),
    ...[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz]) => cyl(0.04, 0.04, 0.5, sx * 0.28, 0.25, sz * 0.28, C.legs, 10))], { light: 'chair' });
  chair.position.set(1.5, 0, -0.7); chair.rotation.y = 0.5;
  piece('rug', [cyl(1.4, 1.4, 0.04, 0.9, 0.02, -0.2, C.rug, 40)], { light: 'chair' });
  // Wall shelf (stop: skills): one block per real skill, five per board.
  const skillCount = Math.min(document.querySelectorAll('#skills li').length, 10), perBoard = 5;
  const boards = Math.max(1, Math.ceil(skillCount / perBoard)), shelf = [];
  for (let b = 0; b < boards; b++) shelf.push(box(0.5, 0.08, 3, -3.75, 1.5 + b * 0.9, 0.3, C.wood));
  for (let i = 0; i < skillCount; i++) {
    const b = Math.floor(i / perBoard), slot = i % perBoard, h = 0.35 + ((i * 7) % 4) * 0.12;
    shelf.push(box(0.36, h, 0.38, -3.75, 1.54 + b * 0.9 + h / 2, -1 + slot * 0.6, BLOCKS[i % BLOCKS.length]));
  }
  piece('shelf', shelf, { light: 'shelf' });
  // Window on the back wall (stop: contact).
  piece('window', [box(1.9, 0.12, 0.14, 2.3, 3.09, -2.93, C.frame), box(1.9, 0.12, 0.14, 2.3, 1.71, -2.93, C.frame),
    box(0.12, 1.5, 0.14, 1.41, 2.4, -2.93, C.frame), box(0.12, 1.5, 0.14, 3.19, 2.4, -2.93, C.frame),
    box(0.06, 1.5, 0.1, 2.3, 2.4, -2.94, C.frame), box(1.9, 0.06, 0.1, 2.3, 2.4, -2.94, C.frame), box(2.1, 0.08, 0.3, 2.3, 1.62, -2.85, C.frame)], { light: 'window' });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.3), new THREE.MeshStandardMaterial({ color: C.sky, emissive: C.sky, emissiveIntensity: 0.12 }));
  glass.material.userData.tint = glass.material.color.clone(); glass.position.set(2.3, 2.4, -2.995); scene.add(glass);
  (room.lit.window ||= { amount: 0, mats: [] }).mats.push(glass.material);
  // One object per real project, standing on the desk.
  const count = Math.min(document.querySelectorAll('#projects .project').length, 4);
  for (let i = 0; i < count; i++) {
    const x = count === 1 ? -0.7 : -1.7 + i * (2 / (count - 1));
    const mesh = piece('project-' + i, SHAPES[SHAPE_ORDER[i % SHAPE_ORDER.length]]());
    mesh.position.set(x, 1.05, -2.35);
    room.projects.push({ mesh, baseY: 1.05, lift: 0 });
    blob(0.8, 0.8, x, 1.056, -2.35);
  }
  blob(3.6, 2, -0.7, 0.01, -2.35); blob(1.2, 1.2, 1.5, 0.05, -0.7);
}
function disposeTree(object) {                // call this on anything you replace, or the GPU keeps its memory
  object.traverse((o) => {
    o.geometry?.dispose();
    for (const m of [].concat(o.material || [])) { for (const v of Object.values(m)) if (v?.isTexture) v.dispose(); m.dispose(); }
  });
  object.removeFromParent();
}

// script.js, part 3: start the renderer. Everything here can fail; the page must survive any failure.
async function startRoom() {
  const stage = document.querySelector('.stage');
  if (!stage) return;
  try {
    const probe = document.createElement('canvas');                // check for WebGL first: no 720 KB download and no console errors on devices without it
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('WebGL is not available');
    room.THREE = await import('three');                 // the import map in index.html resolves this name
    room.mergeGeometries = (await import('three/addons/utils/BufferGeometryUtils.js')).mergeGeometries;
    const THREE = room.THREE;
    room.stage = stage;
    room.renderer = new THREE.WebGLRenderer({ antialias: !small.matches, alpha: true });   // throws if WebGL is unavailable
    if (!room.renderer.getContext()) throw new Error('No WebGL context');
    room.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    room.scene = new THREE.Scene();
    room.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);   // a long lens (36 degrees) gives the flat toy look
    stage.append(room.renderer.domElement);                       // decoration: the whole stage is aria-hidden
    buildRoom();
    buildRail();
    applyQuality();
    view.f = view.target = railProgress();
    view.intro = reduce.matches ? 0 : 1;                          // 1 = camera starts pulled back, 0 = on the stop
    placeCamera();
    room.renderer.render(room.scene, room.camera);                // first frame BEFORE hiding the SVG, so there is no blank flash
    room.ready = true;
    state.wake = wake;
    listen();
    root.classList.add('has-3d');                                 // hides the SVG only once everything above has worked
    wake();                                                       // starts the dolly-in (or draws one still frame)
  } catch (error) {
    console.warn('3D room unavailable, showing the still picture instead.', error);
    room.ready = false;
    root.classList.remove('has-3d');
    if (room.renderer) { room.renderer.dispose(); room.renderer.domElement.remove(); }
  }
}
// Quality tiers: shadows only on capable screens, smaller pixel ratio on phones.
function applyQuality() {
  const THREE = room.THREE, lowPower = small.matches || (navigator.hardwareConcurrency || 8) <= 4;
  room.shadows = !lowPower;
  room.renderer.shadowMap.enabled = room.shadows;
  room.sun.castShadow = room.shadows;
  if (room.shadows) room.sun.shadow.mapSize.set(1024, 1024);
  room.blobs.forEach((b) => { b.visible = !room.shadows; });      // fake shadows stand in when real ones are off
  room.scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });   // shaders change when shadows toggle
  resize();
}
function resize() {
  const w = room.stage.clientWidth, h = room.stage.clientHeight;
  if (!w || !h) return;
  const { renderer, camera } = room;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small.matches ? 1.25 : 1.75));
  renderer.setSize(w, h, false);                                   // false: CSS sizes the canvas
  camera.aspect = w / h;
  camera.fov = camera.aspect >= 1 ? 36 : Math.min(62, 36 / camera.aspect ** 0.7);
  const panel = document.querySelector('.panel');
  const shift = wide.matches && panel ? Math.min(panel.getBoundingClientRect().right, w * 0.6) / 2 : 0;
  if (shift) camera.setViewOffset(w, h, -shift, 0, w, h);          // slides the picture right so the room clears the panel
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}

// script.js, part 5: one loop, which runs only while something is still moving
const view = { f: 0, target: 0, intro: 1, px: 0, py: 0, tx: 0, ty: 0, hover: -1 };
let frame = 0, last = 0;
function wake() {
  if (!room.ready) return;
  if (reduce.matches) return renderStill();
  if (frame || document.hidden) return;                             // already running, or nobody is looking
  last = performance.now();
  frame = requestAnimationFrame(tick);
}
function tick(now) {
  frame = 0;
  const dt = Math.min((now - last) / 1000, 0.05);                   // clamp: a long pause must not cause a giant step
  last = now;
  const moving = update(dt);
  room.renderer.render(room.scene, room.camera);
  if (moving) frame = requestAnimationFrame(tick);                  // settled = the loop ends and the GPU rests
}
function update(dt) {
  let moving = false;
  const toward = (value, goal, speed) => {                          // frame-rate independent damping
    const gap = goal - value;
    if (Math.abs(gap) < 0.0008) return goal;
    moving = true;
    return value + gap * (1 - Math.exp(-speed * dt));
  };
  view.f = toward(view.f, view.target, 4);                          // where on the rail (0 = first stop)
  view.intro = toward(view.intro, 0, 3);                            // page-load dolly
  view.px = toward(view.px, view.tx, 4);                            // mouse parallax
  view.py = toward(view.py, view.ty, 4);
  const lights = STOPS[state.active]?.lights ?? [];
  for (const [name, group] of Object.entries(room.lit)) {           // the highlight
    group.amount = toward(group.amount, lights.includes(name) ? 1 : 0, 5);
    group.mats.forEach((m) => m.color.copy(m.userData.tint).multiplyScalar(1 + group.amount * 0.3));   // brighter, same hue
  }
  const desk = room.lit.desk ? room.lit.desk.amount : 0;
  room.projects.forEach((p, i) => {                                 // hover lift (see moment 3)
    p.lift = toward(p.lift, view.hover === i ? 1 : 0, 8);
    p.mesh.position.y = p.baseY + p.lift * 0.1;
    const m = p.mesh.material;                                      // a swapped-in glTF has no single material: it just lifts
    if (m && m.userData.tint) m.color.copy(m.userData.tint).multiplyScalar(1 + desk * 0.3 + p.lift * 0.25);
  });
  placeCamera();
  return moving;
}
function renderStill() {                                            // reduced motion: one still frame at the Home stop
  view.f = view.target = 0; view.intro = 0; view.px = view.py = 0;
  placeCamera();
  room.renderer.render(room.scene, room.camera);
}
function onScroll() {
  if (!room.ready || reduce.matches) return;
  view.target = railProgress();
  wake();
}

// script.js, part 6: hover and focus (only for projects that contain a real link)
function wireProjects() {
  document.querySelectorAll('#projects .project').forEach((card, i) => {
    if (!card.querySelector('a[href]') || !room.projects[i]) return;
    const on = () => { view.hover = i; wake(); };
    const off = () => { if (view.hover === i) view.hover = -1; wake(); };
    card.addEventListener('pointerenter', on); card.addEventListener('pointerleave', off);
    card.addEventListener('focusin', on); card.addEventListener('focusout', off);
  });
}

// script.js, part 7: nav state with a jump lock (plain JavaScript, works without the room)
const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
let locked = null;                                    // id of the section the visitor jumped to
function setActive(id) {
  if (state.active === id) return;
  state.active = id;
  navLinks.forEach((a) => {
    if (a.hash === '#' + id) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
  });
  state.wake();                                       // lets the room move the highlight
}
function findActive() {
  const max = root.scrollHeight - innerHeight;
  if (!sections.length) return null;
  if (scrollY < 8) return sections[0].id;                            // top of the page is always Home
  if (scrollY >= max - 2) return sections[sections.length - 1].id;   // bottom of the page: short last sections would never reach the line
  const top = parseFloat(getComputedStyle(sections[0]).scrollMarginTop) || 0;
  const line = top + (innerHeight - top) * 0.35;                     // a line a third of the way down the free area
  const hit = sections.find((s) => { const r = s.getBoundingClientRect(); return r.top <= line && r.bottom > line; });
  return hit ? hit.id : state.active;
}
function onScrollNav() {
  if (locked) {
    const r = document.getElementById(locked).getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= innerHeight) locked = null;        // the jumped-to section left the screen
  }
  setActive(locked || findActive());
}
function jumpTo(id) { if (sections.some((s) => s.id === id)) { locked = id; setActive(id); } }
['wheel', 'touchmove'].forEach((type) => addEventListener(type, () => { locked = null; }, { passive: true }));
addEventListener('keydown', (e) => { if (['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) locked = null; });
navLinks.forEach((a) => a.addEventListener('click', () => jumpTo(a.hash.slice(1))));
addEventListener('hashchange', () => jumpTo(location.hash.slice(1)));
addEventListener('scroll', onScrollNav, { passive: true });

// script.js, part 4: the rail. Edit STOPS to move the camera; keys are section ids.
const STOPS = {
  home:     { pos: [8.2, 5.8, 10.8], look: [0.0, 1.3, -0.4],  lights: [] },
  about:    { pos: [4.8, 2.9, 4.6],  look: [1.2, 0.8, -0.9],  lights: ['chair'] },
  projects: { pos: [0.5, 3.0, 2.6],  look: [-0.55, 1.1, -2.3], lights: ['desk'] },
  skills:   { pos: [0.4, 2.6, 4.2],  look: [-3.7, 1.8, 0.2],  lights: ['shelf'] },
  contact:  { pos: [2.6, 2.6, 2.7],  look: [2.3, 2.15, -3.0],  lights: ['window'] },
};
function buildRail() {
  const THREE = room.THREE;
  room.stops = sections.filter((s) => STOPS[s.id]);                 // sections without a STOPS entry are skipped
  const v = (a) => new THREE.Vector3(...a);
  const pts = room.stops.map((s) => v(STOPS[s.id].pos)), looks = room.stops.map((s) => v(STOPS[s.id].look));
  if (pts.length === 1) { pts.push(pts[0].clone()); looks.push(looks[0].clone()); }   // a curve needs two points
  room.posCurve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');             // centripetal: no loops or overshoot
  room.lookCurve = new THREE.CatmullRomCurve3(looks, false, 'centripetal');
  room.P = new THREE.Vector3(); room.L = new THREE.Vector3(); room.FAR = new THREE.Vector3(15, 10, 17);
  measureRail();
}
function measureRail() {                                            // where (in px of scroll) each stop is reached
  const max = Math.max(0, root.scrollHeight - innerHeight);
  room.anchors = room.stops.map((s) => clamp(
    s.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(s).scrollMarginTop) || 0), 0, max));
  for (let i = 1; i < room.anchors.length; i++) if (room.anchors[i] <= room.anchors[i - 1]) room.anchors[i] = room.anchors[i - 1] + 1;
}
function railProgress() {                                           // scroll position -> 0 .. (number of stops - 1)
  const a = room.anchors, n = a.length, y = scrollY;
  if (n < 2 || y <= a[0]) return 0;
  if (y >= root.scrollHeight - innerHeight - 2) return n - 1;        // bottom of the page always means the last stop
  let k = 0;
  while (k < n - 2 && y >= a[k + 1]) k++;
  const t = clamp((y - a[k]) / (a[k + 1] - a[k]), 0, 1);
  return k + t * t * (3 - 2 * t);                                    // smoothstep: the camera lingers on each stop
}
function placeCamera() {
  const { camera, posCurve, lookCurve, P, L } = room;
  const t = room.stops.length > 1 ? clamp(view.f / (room.stops.length - 1), 0, 1) : 0;
  posCurve.getPoint(t, P);                                           // getPoint(t) hits control point i exactly at t = i/(n-1)
  lookCurve.getPoint(t, L);
  P.lerp(room.FAR, view.intro);                                      // page-load dolly: blend toward the far viewpoint
  camera.position.copy(P);
  camera.lookAt(L);
  camera.translateX(view.px * 0.12);                                 // tiny parallax: the camera slides, it does not turn
  camera.translateY(-view.py * 0.07);
}

// script.js, part 8: listeners, then part 9: boot
function listen() {
  addEventListener('scroll', onScroll, { passive: true });
  new ResizeObserver(() => {                                         // fires on resize, rotation and layout breakpoints
    resize(); measureRail();
    view.target = reduce.matches ? 0 : railProgress();
    wake();
  }).observe(room.stage);
  if (document.fonts) document.fonts.ready.then(() => { measureRail(); view.target = reduce.matches ? 0 : railProgress(); wake(); });
  small.addEventListener('change', () => { applyQuality(); wake(); });
  reduce.addEventListener('change', () => { view.target = reduce.matches ? 0 : railProgress(); wake(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  if (window.matchMedia('(pointer: fine)').matches) {                // optional mouse parallax, never on touch
    addEventListener('pointermove', (e) => {
      if (reduce.matches) return;
      view.tx = (e.clientX / innerWidth) * 2 - 1; view.ty = (e.clientY / innerHeight) * 2 - 1;
      wake();
    }, { passive: true });
  }
  const canvas = room.renderer.domElement;
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); root.classList.remove('has-3d'); });  // show the SVG
  canvas.addEventListener('webglcontextrestored', () => { root.classList.add('has-3d'); wake(); });
  wireProjects();
}
onScrollNav();    // choose the starting stop before the room exists
startRoom();
