const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const sections = [...document.querySelectorAll('main section[id]')];

// Scramble: letters flicker, then settle left to right into the real text, once per element, about 700ms.
// An aria-hidden copy sits over the real text, which is never changed, so screen readers read the real heading.
const scrambled = new WeakSet();
function randomLike(ch) { // same kind of character, so the shape of the word stays readable
  if (/\p{Lu}/u.test(ch)) return String.fromCharCode(65 + Math.floor(Math.random() * 26));
  if (/\p{Ll}/u.test(ch)) return String.fromCharCode(97 + Math.floor(Math.random() * 26));
  if (/\p{Nd}/u.test(ch)) return String(Math.floor(Math.random() * 10));
  return ch; // spaces and punctuation never change
}
function scramble(el, delay = 0) {
  if (!el || motion.matches || scrambled.has(el)) return;
  scrambled.add(el);
  const real = [...el.textContent.trim()];
  const view = document.createElement('span');
  view.className = 'sc-view';
  view.setAttribute('aria-hidden', 'true');
  const cells = real.map((ch) => { const cell = document.createElement('span'); cell.textContent = ch; view.append(cell); return cell; });
  const settleAt = real.map((_, i) => (i / real.length) * 0.75 + Math.random() * 0.25); // share of the duration
  el.classList.add('is-scrambling');
  el.append(view);
  const DURATION = 700, TICK = 45; // a letter changes about 22 times a second, each one small and dim
  let start = 0, lastTick = -TICK;
  function frame(now) {
    if (!start) start = now + delay;
    const t = now - start;
    if (t >= DURATION) { view.remove(); el.classList.remove('is-scrambling'); return; }
    if (t >= 0 && now - lastTick >= TICK) { // writes only, no layout reads
      lastTick = now;
      cells.forEach((cell, i) => {
        const settled = t / DURATION >= settleAt[i];
        cell.textContent = settled ? real[i] : randomLike(real[i]);
        cell.classList.toggle('sc-live', !settled && cell.textContent !== ' ');
      });
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

scramble(document.querySelector('.hero-name'), 150);

function ramp(panel, instant = false) {
  if (instant) panel.classList.add('is-instant'); // no ramp, no scramble
  if (panel.classList.contains('is-ramped')) return;
  panel.classList.add('is-ramped');
  if (!instant) scramble(panel.querySelector('.scramble'), 100);
}
function replay(panel) { // used by navigation: restart the ramp, without scrambling again
  if (motion.matches) return;
  panel.classList.remove('is-ramped', 'is-instant');
  void panel.offsetWidth; // the only layout read, once per jump, so the animation restarts
  panel.classList.add('is-ramped');
}
if (!motion.matches && 'IntersectionObserver' in window) {
  const arrival = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      // Also ramp panels already scrolled past (for example after a reload).
      if (entry.isIntersecting || entry.boundingClientRect.top < 0) { ramp(entry.target); arrival.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -15% 0px' });
  document.querySelectorAll('main .panel').forEach((panel) => { panel.classList.add('will-ramp'); arrival.observe(panel); });
  // Keyboard users: a panel ramps as soon as Tab lands inside it.
  document.addEventListener('focusin', (event) => { const panel = event.target.closest('.will-ramp'); if (panel) ramp(panel, true); });
}

const tabs = [...document.querySelectorAll('.tabs a')];
const header = document.querySelector('.site-header');
let jumpedTo = '', spyQueued = false;
// After a jump that tab stays selected until the visitor scrolls on their own (wheel, touch, scroll keys; not Tab or Enter);
// otherwise a short last section loses to the one before it.
const release = () => { jumpedTo = ''; };
window.addEventListener('wheel', release, { passive: true });
window.addEventListener('touchmove', release, { passive: true });
window.addEventListener('keydown', (event) => { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) release(); });
function selectTab(id) {
  tabs.forEach((tab) => {
    const on = tab.hash === '#' + id;
    if (on && tab.getAttribute('aria-current') !== 'location') tab.setAttribute('aria-current', 'location');
    if (!on) tab.removeAttribute('aria-current');
  });
}
function spy() {
  spyQueued = false;
  const line = header.offsetHeight + window.innerHeight * 0.25; // read everything first, then write
  const tops = sections.map((section) => section.getBoundingClientRect());
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  let id = sections[0].id;
  sections.forEach((section, i) => { if (tops[i].top <= line) id = section.id; }); // the last section whose top is above the line, so short sections count too
  if (atBottom) id = sections[sections.length - 1].id; // a short last section may never reach the line
  if (window.scrollY < 8) id = sections[0].id;
  const jumped = sections.findIndex((section) => section.id === jumpedTo);
  if (jumped > -1 && (tops[jumped].bottom < 0 || tops[jumped].top > window.innerHeight)) jumpedTo = ''; // it left the screen
  selectTab(jumpedTo || id);
  if (atBottom) ramp(sections[sections.length - 1]);
}
function queueSpy() { if (!spyQueued) { spyQueued = true; requestAnimationFrame(spy); } }
window.addEventListener('scroll', queueSpy, { passive: true });
window.addEventListener('resize', queueSpy);
window.addEventListener('hashchange', () => {
  const target = document.getElementById(location.hash.slice(1));
  jumpedTo = target && target.matches('main section[id]') ? target.id : '';
  if (jumpedTo) selectTab(jumpedTo);
  if (target && target.classList.contains('will-ramp') && target.classList.contains('is-ramped')) replay(target);
});
spy();

const orbitSvg = document.querySelector('.orbit-svg');
const craftOrbit = document.querySelector('.orbit-craft');
const orbitToggle = document.querySelector('.orbit-toggle');
if (orbitSvg && craftOrbit) {
  const TAU = Math.PI * 2;
  const PERIOD_MS = 32000, REST = 2.2, LAG = 0.17; // REST: the pose when motion is off; LAG: how far each trail dot trails behind
  const rx = +craftOrbit.dataset.rx, ry = +craftOrbit.dataset.ry; // same numbers as the path in the HTML
  const c = Math.sqrt(rx * rx - ry * ry), e = c / rx; // focus distance and eccentricity: the planet sits at the focus
  const dots = [craftOrbit.querySelector('.craft'), ...craftOrbit.querySelectorAll('.trail.t1, .trail.t2, .trail.t3, .trail.t4')];
  let sim = (REST / TAU) * PERIOD_MS, last = 0, frame = 0, visible = false, paused = false;

  function kepler(M) { let E = M; for (let i = 0; i < 6; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); return E; } // Newton's method on M = E - e sin E
  function draw() {
    const M = motion.matches ? REST : (sim / PERIOD_MS) * TAU;
    dots.forEach((dot, k) => {
      const E = kepler(M - k * LAG);
      dot.style.transform = `translate(${(-c + rx * Math.cos(E)).toFixed(2)}px, ${(ry * Math.sin(E)).toFixed(2)}px)`;
    });
  }
  function tick(now) { sim += Math.min(now - last, 64); last = now; draw(); frame = requestAnimationFrame(tick); }
  function start() { if (frame || motion.matches || paused || document.hidden || !visible) return; last = performance.now(); frame = requestAnimationFrame(tick); }
  function stop() { cancelAnimationFrame(frame); frame = 0; }
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); else stop(); }).observe(orbitSvg);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  motion.addEventListener('change', () => { stop(); draw(); start(); });
  if (orbitToggle) orbitToggle.addEventListener('click', () => {
    paused = !paused;
    orbitToggle.textContent = paused ? 'Play orbit' : 'Pause orbit';
    if (paused) stop(); else start();
  });
  draw();
}
