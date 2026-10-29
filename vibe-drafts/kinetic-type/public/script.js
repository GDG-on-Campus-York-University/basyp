// Helpers --------------------------------------------------------------
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// Wraps each word in a mask (and each letter if byLetter). The real text stays readable.
function split(el, byLetter) {
  const text = el.textContent.trim().replace(/\s+/g, ' ');
  let n = 0;
  el.setAttribute('aria-label', text);
  el.textContent = '';
  text.split(' ').forEach((word, w, all) => {
    const mask = document.createElement('span');
    mask.className = 'mask';
    mask.setAttribute('aria-hidden', 'true');
    (byLetter ? [...word] : [word]).forEach((part) => {
      const piece = document.createElement('span');
      piece.className = byLetter ? 'char' : 'line';
      piece.textContent = part;
      piece.style.setProperty('--i', n++);
      mask.append(piece);
    });
    el.append(mask);
    if (w < all.length - 1) el.append(' ');
  });
  el.classList.add('is-split');
}

// 1. Page load: letters rise from a mask --------------------------------
const heroName = document.querySelector('.hero-name');
if (heroName) split(heroName, true);

// 2. Scroll: headings reveal --------------------------------------------
const titles = document.querySelectorAll('.section-title');
titles.forEach((title) => split(title, false));
if (!reduce && 'IntersectionObserver' in window) {
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      // Also reveal headings already scrolled past (for example after a reload).
      if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
        entry.target.classList.add('is-in');
        reveal.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -15% 0px' });
  titles.forEach((title) => { title.classList.add('will-reveal'); reveal.observe(title); });

  // Safety net: a heading near the very bottom of the page may never cross the
  // observer margin, so at the end of the page reveal anything still hidden.
  window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      titles.forEach((title) => { title.classList.add('is-in'); reveal.unobserve(title); });
    }
  }, { passive: true });
}

// 4. Navigation: scroll velocity leans the headlines --------------------
const leaners = document.querySelectorAll('.lean');
let scrollDelta = 0, lastY = window.scrollY, skew = 0, frame = 0;
function lean() {
  const target = clamp(scrollDelta * 0.25, -8, 8);   // small range: at most 8 degrees
  scrollDelta = 0;
  skew += (target - skew) * 0.12;                    // momentum
  const settled = Math.abs(skew) < 0.02 && target === 0;
  if (settled) skew = 0;
  leaners.forEach((el) => {
    el.style.setProperty('--skew', skew.toFixed(2));
    el.style.setProperty('--stretch', (Math.abs(skew) / 8 * 0.04).toFixed(3));
  });
  frame = settled ? 0 : requestAnimationFrame(lean); // loop stops when settled
}
if (!reduce) {
  window.addEventListener('scroll', () => {
    scrollDelta += window.scrollY - lastY;
    lastY = window.scrollY;
    if (!frame) frame = requestAnimationFrame(lean);
  }, { passive: true });
}

// 5. Signature: the cursor swells the name ------------------------------
if (heroName && !reduce && window.matchMedia('(pointer: fine)').matches) {
  const letters = [...heroName.querySelectorAll('.char')];
  const amount = letters.map(() => 0);
  let px = -9999, py = -9999, busy = false;
  function swell() {
    // Read every position first, then write, so the browser lays out once per frame.
    const targets = letters.map((el) => {
      const box = el.getBoundingClientRect();
      const dist = Math.hypot(px - (box.left + box.width / 2), py - (box.top + box.height / 2));
      return clamp(1 - dist / 180, 0, 1);            // 180px reach
    });
    let moving = false;
    letters.forEach((el, i) => {
      amount[i] += (targets[i] - amount[i]) * 0.12;
      if (Math.abs(targets[i] - amount[i]) < 0.005) amount[i] = targets[i]; else moving = true;
      el.style.setProperty('--k', amount[i].toFixed(3));
    });
    busy = moving;
    if (moving) requestAnimationFrame(swell);
  }
  const wake = () => { if (!busy && !document.hidden) { busy = true; requestAnimationFrame(swell); } };
  window.addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; wake(); }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { px = py = -9999; wake(); });
}
