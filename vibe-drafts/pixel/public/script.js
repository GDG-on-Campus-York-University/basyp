// Pixel vibe: stepped motion, a hopping menu cursor and a room-change wipe.
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function atBottom() { return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2; }

/* 2. Scroll: rooms drop in */
const rooms = document.querySelectorAll('main section:not(.hero)');
if (!reduce && 'IntersectionObserver' in window) {
  const dropper = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      // Also drop sections already scrolled past (for example after a reload).
      if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
        entry.target.classList.add('is-dropped');
        dropper.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -15% 0px' });
  rooms.forEach((room) => { room.classList.add('will-drop'); dropper.observe(room); });
  // Keyboard users: a section drops in as soon as Tab lands inside it.
  document.addEventListener('focusin', (event) => {
    const room = event.target.closest('.will-drop');
    if (room) room.classList.add('is-dropped');
  });
  // A short last section may never reach the trigger line: at the very bottom, show the rest.
  window.addEventListener('scroll', () => {
    if (atBottom()) rooms.forEach((room) => room.classList.add('is-dropped'));
  }, { passive: true });
}

/* 4. Navigation: the cursor follows you */
const menu = document.querySelector('.menu');
const cursor = document.querySelector('.menu-cursor');
const bar = document.querySelector('.menu-bar');
const links = [...document.querySelectorAll('.menu a')];
const sections = [...document.querySelectorAll('main section[id]')];
let current = null;   // id of the selected section
let locked = null;    // set by a jump; keeps that section selected until the visitor scrolls on their own

function place(link, instant) {
  // instant: first placement and resizes must not hop, so the transition is off for those two frames
  if (instant) menu.classList.remove('is-ready');
  cursor.style.setProperty('--cx', link.offsetLeft + 'px');
  cursor.style.setProperty('--cy', link.offsetTop + 'px');
  menu.classList.add('has-cursor');
  if (instant) requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-ready')));
}
function select(id) {
  const link = links.find((a) => a.hash === '#' + id);
  if (!link || id === current) return;
  const first = current === null;
  current = id;
  links.forEach((a) => (a === link ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
  place(link, first);
}
// At the very top or bottom the first or last section wins, even when a taller neighbour sits in the middle band.
function edgeId() {
  if (window.scrollY < 8 && sections[0]) return sections[0].id;
  if (atBottom() && sections.length) return sections[sections.length - 1].id;
  return null;
}
const spy = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting && !locked) select(edgeId() || entry.target.id); });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach((section) => spy.observe(section));

window.addEventListener('scroll', () => {
  if (locked) {
    // A jump keeps its section selected until it leaves the screen (a short last section would otherwise lose to the one before it).
    const box = document.getElementById(locked).getBoundingClientRect();
    if (box.bottom <= 0 || box.top >= window.innerHeight) locked = null;
  } else if (window.scrollY < 8 && sections[0]) select(sections[0].id);
  else if (atBottom() && sections.length) select(sections[sections.length - 1].id);
}, { passive: true });
// The visitor scrolling on their own ends the lock.
['wheel', 'touchmove'].forEach((type) => window.addEventListener(type, () => { locked = null; }, { passive: true }));
window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) locked = null;
});

// Keep the bar height exact (for the body padding) and the cursor on its item after resizes and font loading.
function sync() {
  document.documentElement.style.setProperty('--bar-h', bar.offsetHeight + 'px');
  const link = links.find((a) => a.hash === '#' + current);
  if (link) place(link, true);
}
window.addEventListener('resize', sync);
window.addEventListener('load', sync);
if (document.fonts) document.fonts.ready.then(sync);

/* 5. Signature: the room-change wipe */
const wipe = document.querySelector('.wipe');
const WIPE = 300; // milliseconds; keep equal to --wipe-ms in the CSS
let wiping = false;

function jump(hash) {
  locked = hash.slice(1);
  select(locked);
  location.hash = hash; // instant jump, updates the URL and keeps Back working
}
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (!document.getElementById(link.hash.slice(1))) return;
  event.preventDefault();
  if (reduce || wiping || !wipe) { jump(link.hash); return; } // reduced motion or a quick second click: no wipe
  wiping = true;
  wipe.className = 'wipe is-closing';
  setTimeout(() => {
    jump(link.hash);                           // the room changes while the screen is covered
    wipe.className = 'wipe is-opening';
    setTimeout(() => { wipe.className = 'wipe'; wiping = false; }, WIPE);
  }, WIPE);
});
