// Feature tree highlight and view cube.
// The page works without this file: it only marks the current section
// in the tree and turns the view cube.
const sections = document.querySelectorAll('main section[id]');
const treeLinks = document.querySelectorAll('.feature-tree a');
const cube = document.querySelector('.cube');
let waiting = false;

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
function showSection(id) {
  id = jumpedTo || id;
  treeLinks.forEach((link) => {
    if (link.hash === '#' + id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  if (cube) cube.dataset.view = id;
}

// The current section is the last one whose top has reached the line
// just under the fixed top bar. This is the same spot a tree link scrolls to,
// so short sections (like Skills) are marked correctly after a jump.
function update() {
  waiting = false;
  if (!sections.length) return;
  const margin = parseFloat(getComputedStyle(sections[0]).scrollMarginTop) || 0;
  let current = sections[0];
  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= margin + 2) current = section;
  });
  // At the very bottom the last section may never reach the line.
  const atBottom = window.scrollY > 0 &&
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  if (atBottom) current = sections[sections.length - 1];
  showSection(current.id);
}

function queueUpdate() {
  if (waiting) return;
  waiting = true;
  window.requestAnimationFrame(update);
}

window.addEventListener('scroll', queueUpdate, { passive: true });
window.addEventListener('resize', queueUpdate);
update();
