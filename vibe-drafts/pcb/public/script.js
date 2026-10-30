const stages = Array.from(document.querySelectorAll('main .stage'));
const pinLinks = Array.from(document.querySelectorAll('.pin-header a'));
let pinned = null;   // index of the section a jump landed on; it stays lit until the visitor scrolls on their own
let ticking = false;

function onScroll() {
  if (!ticking) { ticking = true; requestAnimationFrame(update); } // one frame per burst of scrolling; nothing loops
}
function setCurrent(id) {
  pinLinks.forEach((link) => {
    // setAttribute, not toggleAttribute: aria-current="" counts as false for screen readers.
    if (link.hash === '#' + id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
function arrive(stage, settled) {
  if (stage.classList.contains('is-arrived')) return false;
  stage.classList.add('is-arrived');
  if (settled) stage.classList.add('is-settled');
  return true;
}
function pinTo(id) {
  pinned = stages.findIndex((stage) => stage.id === id);
  if (pinned < 0) pinned = null; else setCurrent(id);
}
function update() {
  ticking = false;
  // Read everything first, then write (no layout thrashing).
  const rects = stages.map((stage) => stage.getBoundingClientRect());
  const vh = window.innerHeight;
  const atTop = window.scrollY < 8;
  const atBottom = vh + window.scrollY >= document.documentElement.scrollHeight - 2;
  let current = rects.findIndex((r) => r.top <= vh * 0.4 && r.bottom > vh * 0.4);
  if (atTop) current = 0;
  else if (atBottom) current = stages.length - 1; // a short last section may never reach the 40% line
  if (pinned !== null) {                            // keep a jumped-to section selected...
    if (rects[pinned].bottom <= 0 || rects[pinned].top >= vh) pinned = null; // ...until it leaves the screen
    else current = pinned;
  }
  let order = 0;
  stages.forEach((stage, i) => {
    if (rects[i].bottom <= 0) arrive(stage, true);               // already scrolled past (reload, deep jump): show it finished
    else if (rects[i].top < vh * 0.8 || atBottom) {
      // Several sections on screen at once (tall screens, page bottom) take turns instead of pulsing together.
      if (arrive(stage, false)) stage.style.setProperty('--stagger', order++ * 450 + 'ms');
    }
  });
  if (current >= 0) setCurrent(stages[current].id);
}

pinLinks.forEach((link) => link.addEventListener('click', () => pinTo(link.hash.slice(1))));
window.addEventListener('hashchange', () => pinTo(location.hash.slice(1)));
// The visitor scrolling on their own releases the jump.
['wheel', 'touchmove'].forEach((type) => window.addEventListener(type, () => { pinned = null; }, { passive: true }));
window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) pinned = null;
});
// Keyboard users: Tab into a section and it arrives too.
document.addEventListener('focusin', (event) => {
  const stage = event.target.closest('.stage');
  if (!stage) return;
  arrive(stage, false);
  if (pinned !== null && stages[pinned] !== stage) pinned = null;
  onScroll();
});
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
if (location.hash) pinTo(location.hash.slice(1));
update();
