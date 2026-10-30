// ---- Shared names (declared once) ----
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const canHover = window.matchMedia('(hover: hover)');
const header = document.querySelector('.site-header');
const navLinks = [...document.querySelectorAll('.chain a')];
const menuItems = [...document.querySelectorAll('.chain li')];
const nodes = [...document.querySelectorAll('main .node')];
const wires = [...document.querySelectorAll('.wire')];
const parts = [...document.querySelectorAll('[data-i]')]; // menu items, boxes and arrows, all counted from 0 in page order
const HOP = 340;       // ms between one hop and the next
let pathTimer = 0;     // the timer that clears a held route
let pinned = -1;       // the section a jump landed on; it stays current until the visitor scrolls on their own
let pinnedSeen = false; // true once the pinned section has been on screen; before that the jump has not happened yet
let current = -1;
let ticking = false;

// ---- 5. Signature: the request path ----
function clearRoute() {
  clearTimeout(pathTimer);
  parts.forEach((el) => { el.classList.remove('is-path', 'is-live'); el.style.removeProperty('--lag'); });
}
function route(index, { only = parts, hold = 0 } = {}) {
  clearRoute();
  void header.offsetWidth; // flush styles, so a packet that was already flying starts again
  only.forEach((el) => {
    const i = Number(el.dataset.i);
    if (i > index) return;
    el.style.setProperty('--lag', i * HOP + 'ms');
    el.classList.add('is-path', 'is-live');
  });
  if (hold) pathTimer = setTimeout(clearRoute, hold);
}

// ---- 1. Page load: a request enters ----
if (!reduce.matches) route(menuItems.length - 1, { only: menuItems, hold: 1800 });

// ---- 2. Scroll: packets arrive ----
const arrivals = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting && !reduce.matches) entry.target.classList.add('is-live');
    // Also stop watching arrows already scrolled past; they never fire.
    if (entry.isIntersecting || entry.boundingClientRect.top < 0) arrivals.unobserve(entry.target);
  });
}, { rootMargin: '0px 0px -10% 0px' });
wires.forEach((wire) => {
  // Once its packet has landed, let the arrow rest (unless a lit route is holding it).
  wire.addEventListener('animationend', () => { if (!wire.classList.contains('is-path')) wire.classList.remove('is-live'); });
  arrivals.observe(wire);
});

// ---- 3. Hover and focus: the path lights ----
navLinks.forEach((link, i) => {
  link.addEventListener('mouseenter', () => route(i));
  link.addEventListener('mouseleave', clearRoute);
  link.addEventListener('focus', () => { if (link.matches(':focus-visible')) route(i); });
  link.addEventListener('blur', clearRoute);
  link.addEventListener('click', () => { pin(i); if (!canHover.matches) route(i, { hold: 1600 }); });
});

// ---- 4. Navigation: the current box ----
function setCurrent(index) {
  current = index;
  navLinks.forEach((link, i) => {
    // setAttribute, not toggleAttribute: aria-current="" counts as false for screen readers.
    if (i === index) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
}
// Re-pinning the same section (a click, then the hashchange it causes) must not reset pinnedSeen, or the pin never releases.
function pin(index) { if (index !== pinned) { pinned = index; pinnedSeen = false; } request(); } // request(): check again once the jump has landed
function update() {
  ticking = false;
  // Read every layout value first, then write (no layout thrash).
  const vh = window.innerHeight, line = header.offsetHeight + vh * 0.25;
  const rects = nodes.map((node) => node.getBoundingClientRect());
  const atBottom = vh + window.scrollY >= document.documentElement.scrollHeight - 2;
  let index = 0;
  rects.forEach((r, i) => { if (r.top <= line) index = i; }); // the last section whose top is above the line
  if (atBottom) index = nodes.length - 1;                      // a short last section still becomes current
  if (pinned >= 0) {
    const onScreen = rects[pinned].bottom > 0 && rects[pinned].top < vh;
    // Release only after the section has been seen and then left. Before the jump lands (a deep link, a click) it is still off screen.
    if (onScreen) pinnedSeen = true; else if (pinnedSeen) pinned = -1;
    if (pinned >= 0) index = pinned;
  }
  if (index !== current) setCurrent(index);
}
function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

window.addEventListener('scroll', request, { passive: true });
window.addEventListener('resize', request);
['wheel', 'touchmove'].forEach((name) => window.addEventListener(name, () => { pinned = -1; }, { passive: true }));
window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) pinned = -1;
});
window.addEventListener('hashchange', () => pin(nodes.findIndex((node) => '#' + node.id === location.hash)));
if (location.hash) pin(nodes.findIndex((node) => '#' + node.id === location.hash));
update();
