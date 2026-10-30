const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

/* 2. Scroll: sections slam in */
const slabs = document.querySelectorAll('main > section:not(.hero)');
if (!reduce && 'IntersectionObserver' in window) {
  const slammer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
        entry.target.classList.add('is-slammed');
        slammer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -15% 0px' });
  slabs.forEach((section) => { section.classList.add('will-slam'); slammer.observe(section); });
  const slamRest = () => { if (atBottom()) slabs.forEach((section) => section.classList.add('is-slammed')); };
  window.addEventListener('scroll', slamRest, { passive: true });
  slamRest();
  document.addEventListener('focusin', (event) => {
    const section = event.target.closest('.will-slam');
    if (section) section.classList.add('is-slammed');
  });
}

/* 4. Navigation: the active link is a solid block */
const navLinks = document.querySelectorAll('.nav a[href^="#"]');
const watched = document.querySelectorAll('main section[id]');
// After a nav jump, keep the jumped-to link current until the visitor scrolls on their own. Without this,
// jumping to a short section selects the one after it (the middle band or the page bottom lands there).
let jumpedTo = '', jumpSeen = false;
document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', () => {
  const target = document.getElementById(a.hash.slice(1));
  if (target && target.matches('main section[id]')) { jumpedTo = target.id; jumpSeen = false; }
}));
['wheel', 'touchmove'].forEach((name) => window.addEventListener(name, () => { jumpedTo = ''; }, { passive: true }));
window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) jumpedTo = '';
});
window.addEventListener('scroll', () => { // a scrollbar drag: release once the target was on screen and has left it
  if (!jumpedTo) return;
  const box = document.getElementById(jumpedTo).getBoundingClientRect();
  if (box.bottom > 0 && box.top < window.innerHeight) jumpSeen = true;
  else if (jumpSeen) jumpedTo = '';
}, { passive: true });
function mark(id) {
  id = jumpedTo || id;
  navLinks.forEach((a) => {
    if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'location');
    else a.removeAttribute('aria-current');
  });
}
if ('IntersectionObserver' in window && watched.length) {
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && window.scrollY >= 8 && !atBottom()) mark(entry.target.id);
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  watched.forEach((section) => spy.observe(section));
  const checkEnds = () => {
    if (window.scrollY < 8) mark(watched[0].id);
    else if (atBottom()) mark(watched[watched.length - 1].id);
  };
  window.addEventListener('scroll', checkEnds, { passive: true });
  checkEnds();
}

/* 5. Signature: the marquee band */
const band = document.querySelector('.band');
const run = band && band.querySelector('.marquee-run');
const toggle = band && band.querySelector('.band-toggle');
if (run && toggle && !reduce) {
  const group = run.querySelector('.marquee-group');
  const copy = group.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  run.append(copy);
  band.classList.add('js-marquee');
  const setSpeed = () => {
    const width = group.getBoundingClientRect().width;
    run.style.setProperty('--marquee-time', Math.max(width / 90, 10).toFixed(1) + 's');
  };
  setSpeed();
  window.addEventListener('resize', setSpeed);
  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    const paused = band.classList.toggle('is-paused');
    toggle.textContent = paused ? 'Play scrolling text' : 'Pause scrolling text';
  });
}
