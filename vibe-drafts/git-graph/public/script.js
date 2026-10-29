const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fallback = !reduce && !CSS.supports('animation-timeline', 'view()');
const TIP = 0.65; // same as 100% minus --tip-inset
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
if (fallback) document.documentElement.classList.add('js-graph');

const sections = [...document.querySelectorAll('.commit')];
const pieces = [...document.querySelectorAll('.piece')];
const dots = [...document.querySelectorAll('.dot')];
sections.forEach((s) => s.querySelector('.commit-title').setAttribute('tabindex', '-1')); // so j/k can focus headings
let headIndex = -1, queued = false, jumped = -1;
function update() {
  queued = false;
  const vh = window.innerHeight, tipY = vh * TIP;
  const atBottom = vh + window.scrollY >= document.documentElement.scrollHeight - 2;
  // Read every layout value first, then write (no layout thrash).
  const readY = document.querySelector('.topbar').getBoundingClientRect().bottom + vh * 0.15;
  const tops = sections.map((s) => s.getBoundingClientRect().top);
  const jumpBox = jumped >= 0 ? sections[jumped].getBoundingClientRect() : null;
  const pieceBoxes = fallback ? pieces.map((p) => p.getBoundingClientRect()) : [];
  const dotBoxes = fallback ? dots.map((d) => d.getBoundingClientRect()) : [];
  let index = 0;
  tops.forEach((top, i) => { if (top <= readY) index = i; }); // also true for sections already scrolled past
  if (atBottom) index = sections.length - 1;                  // a short last section still becomes HEAD
  if (jumpBox && (jumpBox.bottom < 0 || jumpBox.top > vh)) jumped = -1; // scrolled away another way (scrollbar drag)
  if (jumped >= 0) index = jumped;                            // ...unless the visitor just jumped somewhere
  if (index !== headIndex) setHead(index);
  if (fallback) {
    pieces.forEach((p, i) => p.style.setProperty('--draw', (atBottom ? 1 : clamp((tipY - pieceBoxes[i].top) / pieceBoxes[i].height, 0, 1)).toFixed(3)));
    dots.forEach((d, i) => d.classList.toggle('is-reached', atBottom || dotBoxes[i].top + dotBoxes[i].height / 2 <= tipY));
  }
}
const request = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
window.addEventListener('scroll', request, { passive: true });
['resize', 'load'].forEach((name) => window.addEventListener(name, request));
request();

const navLinks = [...document.querySelectorAll('.nav a')];
const headName = document.querySelector('.head-name');
function setHead(index) {
  headIndex = index;
  const id = sections[index].id;
  navLinks.forEach((link) => {
    if (link.hash === '#' + id) { link.setAttribute('aria-current', 'location'); if (headName) headName.textContent = link.textContent; }
    else link.removeAttribute('aria-current');
  });
  sections.forEach((s, i) => s.querySelector(':scope > .rail > .dot').classList.toggle('is-head', i === index));
}
// After a jump (j/k or a nav link), HEAD stays on the section jumped to until the visitor scrolls by themselves.
// Without this, jumping to a short section near the end makes the bottom-of-page rule select the one after it.
const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
['wheel', 'touchmove', 'pointerdown'].forEach((name) => window.addEventListener(name, () => { jumped = -1; }, { passive: true }));
navLinks.forEach((link) => link.addEventListener('click', () => { jumped = sections.findIndex((s) => '#' + s.id === link.hash); }));
document.addEventListener('keydown', (event) => {
  if (scrollKeys.includes(event.key)) jumped = -1;
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || (event.key !== 'j' && event.key !== 'k')) return;
  if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]')) return;
  const from = jumped >= 0 ? jumped : headIndex;
  const next = clamp(from + (event.key === 'j' ? 1 : -1), 0, sections.length - 1);
  if (next === from) return;
  jumped = next;
  setHead(next);
  sections[next].scrollIntoView(); // CSS smooth scroll and scroll-margin-top apply
  sections[next].querySelector('.commit-title').focus({ preventScroll: true });
});
