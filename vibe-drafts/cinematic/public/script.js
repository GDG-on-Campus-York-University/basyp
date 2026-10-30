const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 1. Opening: any key press or tap finishes it */
const finishOpening = () => document.documentElement.classList.add('is-done');
window.addEventListener('keydown', finishOpening, { once: true });
window.addEventListener('pointerdown', finishOpening, { once: true });

/* 2. Scroll: each section opens with a title card */
const scenes = [...document.querySelectorAll('main .scene')];
if (!reduce && 'IntersectionObserver' in window) {
  const waiting = new Set(scenes);
  function light(scene) { scene.classList.add('is-lit'); waiting.delete(scene); io.unobserve(scene); }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting || entry.boundingClientRect.top < 0) light(entry.target);
    });
  }, { rootMargin: '0px 0px -15% 0px' });
  scenes.forEach((scene) => { scene.classList.add('will-dissolve'); io.observe(scene); });
  document.addEventListener('focusin', (event) => {
    const scene = event.target.closest('.will-dissolve');
    if (scene) light(scene);
  });
  window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) [...waiting].forEach(light);
  }, { passive: true });
}

/* 4. Navigation: subtitle bar and the dip to black */
const navLinks = [...document.querySelectorAll('.site-nav a')];
const jumpLinks = [...document.querySelectorAll('.brand, .site-nav a')];
const sections = [...document.querySelectorAll('main section[id]')];
const bar = document.createElement('div');
bar.className = 'subtitle-bar';
bar.setAttribute('aria-hidden', 'true');
const subtitle = document.createElement('span');
subtitle.className = 'subtitle';
bar.append(subtitle);
const dip = document.createElement('div');
dip.className = 'dip';
dip.setAttribute('aria-hidden', 'true');
document.body.append(bar, dip);
document.documentElement.classList.add('has-bars'); // has-bars lives on <html>

let want = '', subtitleTimer = 0, locked = null, dipTimer = 0, lastDip = -Infinity;

function setSubtitle(text) {
  if (!text || text === want) return;
  want = text;
  if (reduce || !subtitle.textContent) { subtitle.textContent = text; return; }
  subtitle.classList.add('is-off');
  clearTimeout(subtitleTimer);
  subtitleTimer = setTimeout(() => { subtitle.textContent = want; subtitle.classList.remove('is-off'); }, 400);
}
function setCurrent(id) {
  navLinks.forEach((a) => {
    if (a.hash !== '#' + id) { a.removeAttribute('aria-current'); return; }
    a.setAttribute('aria-current', 'location');
    setSubtitle(a.textContent.trim());
  });
}
function currentFromScroll() {
  if (window.scrollY < 8) return sections[0].id;
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) return sections[sections.length - 1].id;
  const line = window.innerHeight * 0.4;
  let id = sections[0].id;
  sections.forEach((s) => { if (s.getBoundingClientRect().top <= line) id = s.id; });
  return id;
}
function updateNav() {
  if (!sections.length) return;
  if (locked) {
    const box = document.getElementById(locked.id).getBoundingClientRect();
    const onScreen = box.bottom > 0 && box.top < window.innerHeight;
    if (onScreen) locked.seen = true; else if (locked.seen) locked = null;
  }
  setCurrent(locked ? locked.id : currentFromScroll());
}
function jump(id) { if (document.getElementById(id)) { locked = { id, seen: false }; setCurrent(id); } }
function release() { locked = null; updateNav(); }

function land(id) {
  const target = document.getElementById(id);
  target.scrollIntoView();
  history.replaceState(null, '', '#' + id);
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  jump(id);
}
function goTo(id) {
  if (!document.getElementById(id)) return;
  clearTimeout(dipTimer);
  const now = performance.now();
  if (reduce || now - lastDip < 1000) { dip.classList.remove('is-black'); land(id); return; }
  lastDip = now;
  dip.classList.add('is-black');
  dipTimer = setTimeout(() => { land(id); dip.classList.remove('is-black'); }, 260);
}
jumpLinks.forEach((a) => a.addEventListener('click', (e) => {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || !document.getElementById(a.hash.slice(1))) return;
  e.preventDefault();
  goTo(a.hash.slice(1));
}));
window.addEventListener('hashchange', () => jump(location.hash.slice(1))); // only fires for the back button or a typed #hash; nav clicks go through goTo
['wheel', 'touchmove'].forEach((type) => window.addEventListener(type, release, { passive: true }));
window.addEventListener('keydown', (e) => { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) release(); });
let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { ticking = false; updateNav(); });
}, { passive: true });
window.addEventListener('resize', updateNav);
if (location.hash.length > 1) jump(location.hash.slice(1));
updateNav();
