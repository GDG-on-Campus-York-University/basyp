/* Vibe: Depth. Helpers first, then the five motion moments. */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const hero = document.querySelector('.hero');

/* 2. Scroll: sheets settle forward */
const sheets = [...document.querySelectorAll('main .sheet')];
if (!reduce && 'IntersectionObserver' in window) {
  const settle = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
        entry.target.classList.add('is-in');
        settle.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  sheets.forEach((sheet) => { sheet.classList.add('will-settle'); settle.observe(sheet); });
  document.addEventListener('focusin', (event) => {
    const sheet = event.target.closest('.will-settle');
    if (sheet) sheet.classList.add('is-in');
  });
  window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      sheets.forEach((sheet) => sheet.classList.add('is-in'));
    }
  }, { passive: true });
}

/* 4. Navigation: the current link sits on a raised sheet */
const navLinks = [...document.querySelectorAll('.site-nav a')];
const sections = [...document.querySelectorAll('main section[id]')];
let locked = null;

function setCurrent(id) {
  navLinks.forEach((a) => {
    if (a.hash === '#' + id) a.setAttribute('aria-current', 'location');
    else a.removeAttribute('aria-current');
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

navLinks.forEach((a) => a.addEventListener('click', () => jump(a.hash.slice(1))));
window.addEventListener('hashchange', () => jump(location.hash.slice(1)));
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

/* 5. Signature: JavaScript fallback for browsers without scroll-driven animations */
if (!reduce && hero && !CSS.supports('animation-timeline: view()')) {
  const hosts = [...document.querySelectorAll('.backdrop, .foreground')];
  let sep = 0, page = 0, frame = 0;
  function follow() {
    const goalSep = clamp(window.scrollY / (hero.offsetHeight * 0.85), 0, 1);
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    const goalPage = maxY > 0 ? clamp(window.scrollY / maxY, 0, 1) : 0;
    sep += (goalSep - sep) * 0.2;
    page += (goalPage - page) * 0.2;
    const still = Math.abs(goalSep - sep) < 0.001 && Math.abs(goalPage - page) < 0.001;
    if (still) { sep = goalSep; page = goalPage; }
    hero.style.setProperty('--sep', sep.toFixed(4));
    hosts.forEach((el) => el.style.setProperty('--page', page.toFixed(4)));
    frame = still ? 0 : requestAnimationFrame(follow);
  }
  window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(follow); }, { passive: true });
  follow();
}

/* 5. Pointer lean (mouse only) */
if (!reduce && hero && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const tilts = [...hero.querySelectorAll('.tilt')];
  let goalX = 0, goalY = 0, x = 0, y = 0, running = false, heroOn = true;
  function lean() {
    x += (goalX - x) * 0.07;
    y += (goalY - y) * 0.07;
    const still = Math.abs(goalX - x) < 0.002 && Math.abs(goalY - y) < 0.002;
    if (still) { x = goalX; y = goalY; }
    const value = x === 0 && y === 0 ? '' : 'rotateX(' + (-y * 2.2).toFixed(3) + 'deg) rotateY(' + (x * 3).toFixed(3) + 'deg)';
    tilts.forEach((el) => { el.style.transform = value; });
    running = !still;
    if (running) requestAnimationFrame(lean);
  }
  function wake() { if (!running) { running = true; requestAnimationFrame(lean); } }
  window.addEventListener('pointermove', (e) => {
    if (!heroOn || e.pointerType !== 'mouse') return;
    goalX = (e.clientX / window.innerWidth - 0.5) * 2;
    goalY = (e.clientY / window.innerHeight - 0.5) * 2;
    wake();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { goalX = goalY = 0; wake(); });
  new IntersectionObserver((entries) => {
    heroOn = entries[0].isIntersecting;
    if (!heroOn) { goalX = goalY = 0; wake(); }
  }).observe(hero);
}
