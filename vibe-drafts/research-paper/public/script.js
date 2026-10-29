// Research Paper vibe: helpers first, then each moment in order.
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function atBottom() { return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2; }

// 2. Scroll: sections and figures settle in
const settlers = document.querySelectorAll('main > section:not(#home), main figure');
if (!reduce && 'IntersectionObserver' in window) {
  const settle = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      // Also settle anything already scrolled past (for example after a reload).
      if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
        entry.target.classList.add('is-settled');
        settle.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  settlers.forEach((el) => { el.classList.add('will-settle'); settle.observe(el); });
  // Keyboard users: Tab landing inside a section shows it.
  document.addEventListener('focusin', (event) => {
    const el = event.target.closest('.will-settle');
    if (el) el.classList.add('is-settled');
  });
  // A short last section may never reach the trigger line: at the very bottom, show the rest.
  window.addEventListener('scroll', () => {
    if (atBottom()) settlers.forEach((el) => el.classList.add('is-settled'));
  }, { passive: true });
}

// 4. Navigation: the contents mark where you are
const sections = [...document.querySelectorAll('main > section[id]')];
const tocLinks = [...document.querySelectorAll('.toc a')];
let current = '', pinned = '', queued = false;
function setCurrent(id) {
  if (id === current) return;
  current = id;
  tocLinks.forEach((link) => {
    // setAttribute, not toggleAttribute: aria-current="" counts as false for screen readers.
    if (link.hash === '#' + id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
function pin(id) { pinned = id; setCurrent(id); }
function queueUpdate() { if (!queued) { queued = true; requestAnimationFrame(update); } }
function update() {
  queued = false;
  const boxes = sections.map((s) => s.getBoundingClientRect()); // read everything first
  const vh = window.innerHeight;
  if (pinned) {
    const i = sections.findIndex((s) => s.id === pinned);
    if (i > -1 && boxes[i].bottom > 0 && boxes[i].top < vh) { setCurrent(pinned); return; }
    pinned = ''; // the jumped-to section left the screen
  }
  let id = sections[0].id;
  boxes.forEach((box, i) => { if (box.top <= vh * 0.35) id = sections[i].id; });
  if (window.scrollY < 8) id = sections[0].id;
  else if (atBottom()) id = sections[sections.length - 1].id;
  setCurrent(id); // then write
}
tocLinks.forEach((link) => link.addEventListener('click', () => pin(link.hash.slice(1))));
window.addEventListener('hashchange', () => { if (location.hash.length > 1) pin(location.hash.slice(1)); });
// Scrolling on your own releases the pin.
const release = () => { pinned = ''; queueUpdate(); };
window.addEventListener('wheel', release, { passive: true });
window.addEventListener('touchmove', release, { passive: true });
window.addEventListener('keydown', (event) => {
  if (event.key === ' ' && event.target.closest('button')) return; // Space presses a button
  if (['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End', ' '].includes(event.key)) release();
});
window.addEventListener('scroll', queueUpdate, { passive: true });
window.addEventListener('resize', queueUpdate);
if (location.hash.length > 1) pin(location.hash.slice(1));
update();

// Phones: the note card sits at the bottom, so bring its entry to the top first or the card covers the marker.
document.querySelectorAll('.cite-note').forEach((note) => note.addEventListener('beforetoggle', (event) => {
  if (event.newState === 'open' && window.matchMedia('(max-width: 47.99em)').matches) note.closest('.entry').scrollIntoView({ block: 'start' });
}));
