// ---------- Helpers ----------
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const GAP = 1200;            // ms between burst starts, shared by every burst on the page
let lastBurst = -Infinity;
const heroName = document.querySelector('.hero-name');

// Adds two aria-hidden copies of the real text. The real text itself is never changed.
function glitchify(el) {
  if (reduce || el.querySelector('.g-copy')) return;
  const text = el.textContent.trim();
  ['g-a', 'g-b'].forEach((cls) => {
    const copy = document.createElement('span');
    copy.className = 'g-copy ' + cls;
    copy.setAttribute('aria-hidden', 'true');
    copy.textContent = text;
    el.append(copy);
  });
  el.addEventListener('animationend', (e) => {
    if (e.target.classList.contains('g-copy')) el.classList.remove('burst-load', 'burst-hover', 'burst-small');
  });
}

// The safety gate. Returns false and does nothing if another burst started less than GAP ago.
function burst(el, kind) {
  const now = performance.now();
  if (reduce || !el || now - lastBurst < GAP) return false;
  lastBurst = now;
  el.classList.remove('burst-load', 'burst-hover', 'burst-small');
  void el.offsetWidth;                  // restart the animation if it was mid-way
  el.classList.add('burst-' + kind);
  return true;
}
document.querySelectorAll('.glitch').forEach(glitchify);

// ---------- 2. Scroll: each section heading slices once ----------
const titles = [...document.querySelectorAll('.section-title')];
if (!reduce && 'IntersectionObserver' in window) {
  const waiting = new Set(titles);
  const arrive = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const past = entry.boundingClientRect.top < 0;   // already scrolled past: stay clean
      if (!entry.isIntersecting && !past) return;
      waiting.delete(entry.target);
      arrive.unobserve(entry.target);
      // The name owns the first second. Headings on screen at load stay clean.
      if (entry.isIntersecting && !past && performance.now() > 1000) burst(entry.target, 'small');
    });
  }, { rootMargin: '0px 0px -20% 0px' });
  titles.forEach((title) => arrive.observe(title));
  // A short last section may never reach the trigger line: at the very bottom, glitch the last waiting heading.
  window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 2 || !waiting.size) return;
    const last = [...waiting].pop();
    waiting.forEach((title) => arrive.unobserve(title));
    waiting.clear();
    burst(last, 'small');
  }, { passive: true });
}

// ---------- 4. Navigation: the current link carries a steady offset ----------
const navLinks = [...document.querySelectorAll('.site-nav a')];
const sections = [...document.querySelectorAll('main section[id]')];
let locked = null;                               // { id, seen } while a jump is settling

function setCurrent(id) {
  navLinks.forEach((a) => {
    if (a.hash === '#' + id) a.setAttribute('aria-current', 'location');
    else a.removeAttribute('aria-current');
  });
}
function currentFromScroll() {
  if (window.scrollY < 8) return sections[0].id;                                                       // top: home
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) return sections[sections.length - 1].id; // bottom: last
  const line = window.innerHeight * 0.4;
  let id = sections[0].id;
  sections.forEach((s) => { if (s.getBoundingClientRect().top <= line) id = s.id; });
  return id;
}
function updateNav() {
  if (!sections.length) return;
  if (locked) {
    const box = document.getElementById(locked.id).getBoundingClientRect();   // read first
    const onScreen = box.bottom > 0 && box.top < window.innerHeight;
    if (onScreen) locked.seen = true; else if (locked.seen) locked = null;
  }
  setCurrent(locked ? locked.id : currentFromScroll());                       // then write
}
function jump(id) { if (document.getElementById(id)) { locked = { id, seen: false }; setCurrent(id); } }
function release() { locked = null; updateNav(); }

navLinks.forEach((a) => a.addEventListener('click', () => jump(a.hash.slice(1))));
window.addEventListener('hashchange', () => jump(location.hash.slice(1)));
['wheel', 'touchmove'].forEach((type) => window.addEventListener(type, release, { passive: true }));
window.addEventListener('keydown', (e) => { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) release(); });
let ticking = false;                             // one frame per scroll burst, no loop
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { ticking = false; updateNav(); });
}, { passive: true });
window.addEventListener('resize', updateNav);
if (location.hash.length > 1) jump(location.hash.slice(1));
updateNav();

// ---------- 5. Signature: the name glitches into place ----------
if (heroName) {
  if (window.scrollY < 100) {                    // not when a reload restored a scrolled page
    const start = () => burst(heroName, 'load');
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
  }
}
// Every heading (the name and each section title) glitches again when a mouse enters it. They share the
// one safety gate, so sweeping the mouse down the page cannot stack bursts faster than one per GAP.
document.querySelectorAll('.glitch').forEach((heading) => {
  heading.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') burst(heading, 'hover'); });
});
