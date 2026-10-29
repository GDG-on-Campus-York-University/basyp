const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 1. Scroll: sections settle */
const sections = document.querySelectorAll('main section:not(.hero)');
if (!reduce && 'IntersectionObserver' in window) {
  const settler = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      // Also settle sections already scrolled past (for example after a reload).
      if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
        entry.target.classList.add('is-settled');
        settler.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  sections.forEach((section) => { section.classList.add('will-settle'); settler.observe(section); });
}
// Keyboard users: a section settles as soon as Tab lands inside it.
document.addEventListener('focusin', (event) => {
  const section = event.target.closest('.will-settle');
  if (section) section.classList.add('is-settled');
});

/* 2. Navigation: a pill springs to the active link */
const nav = document.querySelector('.site-nav');
const pill = nav && nav.querySelector('.nav-pill');
const navLinks = nav ? [...nav.querySelectorAll('a')] : [];
const allSections = [...document.querySelectorAll('main section[id]')];
let current = null;

function movePill() {
  if (!current || !pill) return;
  // Read all layout values first, then write.
  const l = current.offsetLeft, t = current.offsetTop, w = current.offsetWidth, h = current.offsetHeight;
  const W = nav.clientWidth, H = nav.clientHeight;
  nav.style.setProperty('--pill-l', l + 'px'); nav.style.setProperty('--pill-t', t + 'px');
  nav.style.setProperty('--pill-r', (W - l - w) + 'px'); nav.style.setProperty('--pill-b', (H - t - h) + 'px');
}
function select(id) {
  const next = navLinks.find((a) => a.hash === '#' + id);
  if (!next || next === current) return;
  current = next;
  navLinks.forEach((a) => (a === next ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
  movePill();
}
const spy = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting && window.scrollY >= 8) select(entry.target.id); });
}, { rootMargin: '-45% 0px -50% 0px' });
allSections.forEach((section) => spy.observe(section));

// Edge cases: at the very top the first link is current; a short last section may never reach the middle band,
// so at the very bottom select it and settle anything still hidden.
function edges() {
  const atTop = window.scrollY < 8;
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  if (atBottom) document.querySelectorAll('.will-settle').forEach((s) => s.classList.add('is-settled'));
  if (atTop && allSections.length) select(allSections[0].id);
  else if (atBottom && allSections.length) select(allSections[allSections.length - 1].id);
}
window.addEventListener('scroll', edges, { passive: true });
window.addEventListener('resize', movePill);
if (document.fonts) document.fonts.ready.then(movePill);
edges();
if (pill) requestAnimationFrame(() => requestAnimationFrame(() => pill.classList.add('is-ready')));

/* 3. Pause button for the blobs. Hidden in the HTML, shown here, so it never sits there doing nothing without JavaScript. */
const pause = document.querySelector('.pause');
if (pause && !reduce) {
  pause.hidden = false;
  pause.addEventListener('click', () => {
    const paused = document.documentElement.classList.toggle('is-paused');
    pause.textContent = paused ? 'Play background motion' : 'Pause background motion';
  });
}
