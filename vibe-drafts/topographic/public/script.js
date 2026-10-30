const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const SVG_NS = 'http://www.w3.org/2000/svg';
// Keep cols / rows at 1.6 (the grid is stretched to the screen, so a different ratio squashes the rings).
const PRESETS = {
  hero: { cols: 120, rows: 75, levels: 14, hills: [[0.7, 0.4, 0.2, 1], [0.45, 0.68, 0.16, 0.7], [0.92, 0.82, 0.14, 0.55], [0.2, 0.3, 0.15, 0.45]] },
  page: { cols: 112, rows: 70, levels: 9, hills: [[0.2, 0.25, 0.3, 1], [0.78, 0.6, 0.26, 0.8], [0.4, 0.92, 0.22, 0.6]] },
};
// Decoration only: smooth hills plus a little ripple, so the lines are not perfect circles. No real terrain.
function heightAt(x, y, hills, aspect) {
  let z = 0.04 * Math.sin(9 * x + 4 * y) * Math.cos(7 * y);
  for (const [hx, hy, spread, peak] of hills) {
    const dx = (x - hx) * aspect, dy = y - hy;
    z += peak * Math.exp(-(dx * dx + dy * dy) / (2 * spread * spread));
  }
  return z;
}
// Edges of one grid cell: 0 top, 1 right, 2 bottom, 3 left. Each case lists which edges a line joins.
const CASES = [[], [[3, 2]], [[2, 1]], [[3, 1]], [[0, 1]], null, [[0, 2]], [[0, 3]], [[0, 3]], [[0, 2]], null, [[0, 1]], [[3, 1]], [[2, 1]], [[3, 2]], []];
function buildField(svg, { cols, rows, levels, hills }) {
  const aspect = cols / rows, stride = cols + 1, z = [];
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) z.push(heightAt(i / cols, j / rows, hills, aspect));
  const lo = Math.min(...z), hi = Math.max(...z);
  svg.setAttribute('viewBox', `0 0 ${cols} ${rows}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  for (let k = 0; k < levels; k++) {
    const t = lo + ((hi - lo) * (k + 1)) / (levels + 1);
    let d = '';
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const a = z[j * stride + i], b = z[j * stride + i + 1], c = z[(j + 1) * stride + i + 1], e = z[(j + 1) * stride + i];
      const index = (a >= t ? 8 : 0) + (b >= t ? 4 : 0) + (c >= t ? 2 : 0) + (e >= t ? 1 : 0);
      let joins = CASES[index];
      if (!joins) { // the two saddle cases: the cell centre decides which way the lines run
        const centreHigh = (a + b + c + e) / 4 >= t;
        joins = (index === 5) === centreHigh ? [[0, 3], [2, 1]] : [[0, 1], [3, 2]];
      }
      const point = (edge) => [
        [i + (t - a) / (b - a), j], [i + 1, j + (t - b) / (c - b)], [i + (t - e) / (c - e), j + 1], [i, j + (t - a) / (e - a)],
      ][edge].map((n) => n.toFixed(2)).join(' ');
      joins.forEach(([from, to]) => { d += `M${point(from)}L${point(to)}`; });
    }
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', k % 5 === 4 ? 'contour contour-index' : 'contour'); // every fifth line is heavier
    svg.appendChild(path);
  }
  // The "bloom" in moment 1 starts under the summit.
  svg.parentElement.style.setProperty('--sx', hills[0][0] * 100 + '%');
  svg.parentElement.style.setProperty('--sy', hills[0][1] * 100 + '%');
}
document.querySelectorAll('svg.field[data-preset]').forEach((svg) => buildField(svg, PRESETS[svg.dataset.preset]));

const sections = document.querySelectorAll('main section[id]');
document.querySelectorAll('.section').forEach((section, n) => {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'ridge'); svg.setAttribute('viewBox', '0 0 600 20');
  svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
  let d = '';
  for (let x = 0; x <= 600; x += 6) d += `${x ? 'L' : 'M'}${x} ${(10 + 5 * Math.sin(x * 0.018 + n * 1.9) + 2.5 * Math.sin(x * 0.047 + n * 0.7)).toFixed(1)}`;
  const line = document.createElementNS(SVG_NS, 'path');
  line.setAttribute('class', 'ridge-line'); line.setAttribute('d', d);
  svg.appendChild(line); section.insertBefore(svg, section.firstChild);
});
const surveyor = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    // Also draw sections already scrolled past (for example after a reload).
    if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
      entry.target.classList.add('is-surveyed');
      surveyor.unobserve(entry.target);
    }
  });
}, { rootMargin: '0px 0px -15% 0px' });
document.querySelectorAll('.section').forEach((section) => surveyor.observe(section));

const header = document.querySelector('.site-header');
const keys = document.querySelectorAll('.site-header a');
const select = (id) => keys.forEach((key) => {
  if (key.hash === '#' + id) key.setAttribute('aria-current', 'location');
  else key.removeAttribute('aria-current');
});
const lastSection = sections[sections.length - 1];
// The current section is the last one whose top is above the header plus a little. (A thin "middle band" picks the
// next section when sections are short.) After a jump, that link stays selected until the visitor scrolls on their own.
let jumpedTo = '', headerH = 0, queued = false;
['wheel', 'touchmove', 'keydown'].forEach((type) => window.addEventListener(type, () => { jumpedTo = ''; }, { passive: true }));
function measure() { headerH = header.offsetHeight; document.documentElement.style.setProperty('--header-h', headerH + 'px'); }
function updateNav() {
  queued = false;
  const line = headerH + 24, atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  let current = sections[0];
  sections.forEach((section) => { if (section.getBoundingClientRect().top <= line) current = section; }); // read everything first
  if (atBottom) { current = lastSection; lastSection.classList.add('is-surveyed'); } // a short last section may never reach the line
  select(jumpedTo || current.id); // then write
}
function queueNav() { if (!queued) { queued = true; requestAnimationFrame(updateNav); } }
window.addEventListener('scroll', queueNav, { passive: true });
window.addEventListener('resize', () => { measure(); queueNav(); });
measure(); updateNav();
// Jumping selects the link and draws that section's rule again. Removing and re-adding the class restarts the animation.
window.addEventListener('hashchange', () => {
  const target = document.getElementById(location.hash.slice(1));
  jumpedTo = target && target.matches('main section[id]') ? target.id : '';
  if (jumpedTo) select(jumpedTo);
  if (!target || !target.classList.contains('section') || motion.matches) return;
  target.classList.remove('is-surveyed');
  void target.offsetWidth; // the only layout read, once per jump, so the animation restarts
  target.classList.add('is-surveyed');
});

const fine = window.matchMedia('(pointer: fine)');
const layers = [...document.querySelectorAll('.field[data-depth]')].map((el) => ({ el, depth: Number(el.dataset.depth) }));
const pos = { x: 0, y: 0 }, target = { x: 0, y: 0 };
let frame = 0, vw = window.innerWidth, vh = window.innerHeight;
function drift() {
  pos.x += (target.x - pos.x) * 0.07; pos.y += (target.y - pos.y) * 0.07;
  const settled = Math.abs(target.x - pos.x) < 0.002 && Math.abs(target.y - pos.y) < 0.002;
  if (settled) { pos.x = target.x; pos.y = target.y; }
  layers.forEach(({ el, depth }) => { el.style.transform = `translate3d(${(pos.x * depth).toFixed(2)}px, ${(pos.y * depth).toFixed(2)}px, 0)`; });
  frame = settled ? 0 : requestAnimationFrame(drift); // no loop while nothing moves
}
function aim(x, y) { target.x = x; target.y = y; if (!frame) frame = requestAnimationFrame(drift); }
function onMove(event) { if (event.pointerType !== 'touch') aim((event.clientX / vw) * 2 - 1, (event.clientY / vh) * 2 - 1); }
function onLeave() { aim(0, 0); }
function setDrift() {
  const on = fine.matches && !motion.matches;
  window[on ? 'addEventListener' : 'removeEventListener']('pointermove', onMove, { passive: true });
  document.documentElement[on ? 'addEventListener' : 'removeEventListener']('mouseleave', onLeave);
  if (!on) { cancelAnimationFrame(frame); frame = 0; pos.x = pos.y = target.x = target.y = 0; layers.forEach(({ el }) => { el.style.transform = ''; }); }
}
window.addEventListener('resize', () => { vw = window.innerWidth; vh = window.innerHeight; });
fine.addEventListener('change', setDrift);
motion.addEventListener('change', setDrift);
setDrift();
