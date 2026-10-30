const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pending = new Set();                          // everything still waiting to arrive
let arrival = null;                                 // the observer, made below only if it is needed and supported

function arrive(el, order) {
  if (!pending.delete(el)) return;
  arrival.unobserve(el);
  el.style.setProperty('--i', order);               // stagger for notes that arrive together
  el.classList.add('is-in');
}
function hold(el, kind) { el.classList.add(kind); pending.add(el); arrival.observe(el); }

if (!reduce && 'IntersectionObserver' in window) {
  arrival = new IntersectionObserver((entries) => {
    let order = 0;
    entries.forEach((entry) => {
      // Also arrive when already scrolled past (for example after a reload).
      if (entry.isIntersecting || entry.boundingClientRect.top < 0) arrive(entry.target, order++);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('main h2.scribble').forEach((h) => hold(h, 'will-draw'));
  document.querySelectorAll('.note').forEach((n) => hold(n, 'will-drop'));
  // A short last section may never reach the trigger line: at the very bottom, let everything left arrive.
  window.addEventListener('scroll', () => {
    if (pending.size && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) [...pending].forEach((el, i) => arrive(el, i));
  }, { passive: true });
  // Keyboard users: a note appears the moment Tab lands inside it.
  document.addEventListener('focusin', (e) => { const n = e.target.closest('.note'); if (n) arrive(n, 0); });
}

const navLinks = [...document.querySelectorAll('.site-nav a')];
const sections = [...document.querySelectorAll('main section[id]')];
let locked = null;                                  // { id, seen } while a jump is settling

function setCurrent(id) {
  navLinks.forEach((a) => {
    if (a.hash === '#' + id) a.setAttribute('aria-current', 'location');
    else a.removeAttribute('aria-current');
  });
}
function currentFromScroll() {
  if (window.scrollY < 8) return sections[0].id;                                                 // top: home
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
function replay(id) {                               // draw the landed heading's underline again
  const heading = document.querySelector('#' + id + ' h2.scribble');
  if (!heading || !heading.classList.contains('is-in')) return;
  heading.classList.remove('is-in');
  void heading.offsetWidth;                         // restart the animation
  heading.classList.add('is-in');
}
function jump(id) { if (document.getElementById(id)) { locked = { id, seen: false }; setCurrent(id); replay(id); } }
function release() { locked = null; updateNav(); }

navLinks.forEach((a) => a.addEventListener('click', () => jump(a.hash.slice(1))));
window.addEventListener('hashchange', () => jump(location.hash.slice(1)));
['wheel', 'touchmove'].forEach((type) => window.addEventListener(type, release, { passive: true }));
window.addEventListener('keydown', (e) => { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) release(); });
let ticking = false;                                // one frame per scroll burst, no loop
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { ticking = false; updateNav(); });
}, { passive: true });
window.addEventListener('resize', updateNav);
if (location.hash.length > 1) jump(location.hash.slice(1));
updateNav();
