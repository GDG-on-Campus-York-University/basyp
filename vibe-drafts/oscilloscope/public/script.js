const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- 2. Scroll: sections lock on ---------- */
const lockObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    // Also lock sections already scrolled past (for example after a reload).
    if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
      entry.target.classList.add('is-locking');
      lockObserver.unobserve(entry.target);
    }
  });
}, { rootMargin: '0px 0px -15% 0px' });
document.querySelectorAll('main .lock').forEach((section) => lockObserver.observe(section));

/* ---------- 4. Navigation: menu softkeys ---------- */
const sections = document.querySelectorAll('main section[id]');
const keys = document.querySelectorAll('.softkeys a');
const select = (id) => keys.forEach((key) => {
  if (key.hash === '#' + id) key.setAttribute('aria-current', 'location');
  else key.removeAttribute('aria-current');
});
const spy = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting) select(jumpedTo || entry.target.id); });
  checkEnds(); // the top and bottom of the page win over the middle band
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach((section) => spy.observe(section));
const lastSection = sections[sections.length - 1];
let jumpedTo = ''; // the key just pressed stays selected, even if a neighbour fills the middle band, until the reader scrolls
['wheel', 'touchmove', 'keydown'].forEach((type) => window.addEventListener(type, () => { jumpedTo = ''; }, { passive: true }));
const checkEnds = () => {
  const jumped = jumpedTo && document.getElementById(jumpedTo).getBoundingClientRect();
  if (jumped && (jumped.bottom < 0 || jumped.top > window.innerHeight)) jumpedTo = ''; // scrolled away by other means
  if (window.scrollY < 8) select(sections[0].id); // a short hero can leave the middle band in the next section
  else if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
    select(jumpedTo || lastSection.id); // a short last section may never reach the middle band
    lastSection.classList.add('is-locking');
  }
};
window.addEventListener('scroll', checkEnds, { passive: true });
checkEnds();
// Jumping to a section locks it on again. Removing and re-adding the class restarts the animation.
window.addEventListener('hashchange', () => {
  const target = document.getElementById(location.hash.slice(1));
  jumpedTo = target && target.closest('main section[id]') ? target.id : '';
  checkEnds();
  if (!target || !target.classList.contains('lock') || motion.matches) return;
  target.classList.remove('is-locking');
  void target.offsetWidth; // the only layout read, once per jump, so the animation restarts
  target.classList.add('is-locking');
});

/* ---------- 5. Signature: the scope trace ---------- */
const canvas = document.querySelector('.scope-canvas');
if (canvas && canvas.getContext) {
  const ctx = canvas.getContext('2d');
  const TAU = Math.PI * 2;
  const SWEEP_MS = 6000, FADE = 3.5, STEP = 4; // linear sweep time; afterglow (higher = shorter); pixels per segment
  const JITTER = [0.09, -0.06, 0.03], JITTER_MS = 350; // phase offsets before lock-on: three jumps 350ms apart, then stable
  // Decoration only: sine and square mixes. level: where the trace rests, -1 top to 1 bottom.
  const shapes = [
    { cycles: 2, level: -0.38, fn: (t) => (Math.sin(TAU * t) + Math.sin(3 * TAU * t) / 3 + Math.sin(5 * TAU * t) / 5) * 0.32 },
    { cycles: 3, level: 0.5, fn: (t) => Math.tanh(3 * Math.sin(TAU * t)) * 0.2 },
  ];
  let w = 0, h = 0, sim = 0, last = 0, frame = 0, visible = false, colors = ['#4FD8EB', '#F2CF4A'];

  function draw() {
    const still = motion.matches; // reduced motion: one complete, locked frame
    const phase = still || sim >= JITTER.length * JITTER_MS ? 0 : JITTER[Math.floor(sim / JITTER_MS)];
    const head = still ? w : ((sim % SWEEP_MS) / SWEEP_MS) * w;
    ctx.clearRect(0, 0, w, h);
    shapes.forEach((shape, i) => {
      const y = (x) => (h / 2) * (1 + shape.level + shape.fn((x / w) * shape.cycles + phase));
      ctx.strokeStyle = colors[i];
      for (let x = 0; x < w; x += STEP) {
        const age = ((((head - x) / w) % 1) + 1) % 1; // 0 at the beam, near 1 just ahead of it
        ctx.globalAlpha = still ? 0.9 : Math.exp(-FADE * age);
        ctx.beginPath(); ctx.moveTo(x, y(x)); ctx.lineTo(x + STEP, y(x + STEP)); ctx.stroke();
      }
      if (!still) { ctx.globalAlpha = 1; ctx.fillStyle = colors[i]; ctx.beginPath(); ctx.arc(head, y(head), 3, 0, TAU); ctx.fill(); }
    });
    ctx.globalAlpha = 1;
  }
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);   // sharp, but never more than 2x
    const box = canvas.getBoundingClientRect(), css = getComputedStyle(document.documentElement); // read first, then write
    w = box.width; h = box.height;
    colors = [css.getPropertyValue('--ch1').trim() || colors[0], css.getPropertyValue('--ch2').trim() || colors[1]];
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2; ctx.lineCap = 'butt'; // resizing resets the context, so set these here
    draw();
  }
  function tick(now) { sim += Math.max(0, Math.min(now - last, 64)); last = now; draw(); frame = requestAnimationFrame(tick); }
  function start() { if (frame || motion.matches || document.hidden || !visible) return; last = performance.now(); frame = requestAnimationFrame(tick); }
  function stop() { cancelAnimationFrame(frame); frame = 0; }
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); else stop(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  motion.addEventListener('change', () => { stop(); draw(); start(); });
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  resize();
}
