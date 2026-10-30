// Swiss Minimal motion: counting section numbers, reveal on scroll, nav mark.
const sections = [...document.querySelectorAll('main .section')];
const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
function reveal(section) { section.classList.add('is-in'); }

document.querySelectorAll('.sec-num').forEach((num) => {
  const text = num.textContent.trim(); // "02", written in the HTML
  num.textContent = '';
  [...text].forEach((ch) => {
    if (!/\d/.test(ch)) { num.append(ch); return; }
    const to = Number(ch);
    const digit = document.createElement('span');
    digit.className = 'digit';
    digit.style.setProperty('--to', to);
    const strip = document.createElement('span');
    strip.className = 'digit-strip';
    for (let n = 0; n <= to; n += 1) {
      const cell = document.createElement('span');
      cell.textContent = n;
      strip.append(cell);
    }
    digit.append(strip);
    num.append(digit);
  });
});

if ('IntersectionObserver' in window) {
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      // Also reveal sections already scrolled past (for example after a reload).
      if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
        reveal(entry.target);
        revealer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  sections.forEach((section) => {
    section.classList.add('will-reveal');
    const title = section.querySelector('.sec-title');
    if (title) title.style.setProperty('--i', 0);
    // Paragraphs and list rows arrive a beat apart. --i is set with style.setProperty, which is fine: it only writes a custom property.
    section.querySelectorAll('.sec-body > :not(ul), .sec-body > ul > li').forEach((el, i) => {
      el.classList.add('reveal-item');
      el.style.setProperty('--i', i + 1);
    });
    revealer.observe(section);
  });
}
// Keyboard users: a section reveals as soon as Tab lands inside it.
document.addEventListener('focusin', (event) => {
  const section = event.target.closest('.will-reveal');
  if (section) reveal(section);
});

const links = [...document.querySelectorAll('.site-header a[href^="#"]')]; // the name link counts: it marks Home
const spied = [...document.querySelectorAll('main > section[id]')];
let pinned = null; // the section we just jumped to
let queued = false;

function setCurrent(id) {
  links.forEach((a) => (a.hash === '#' + id ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
}
function pin(id) {
  const target = document.getElementById(id);
  if (!target) return;
  pinned = id;
  if (target.classList.contains('will-reveal')) reveal(target); // so the landing never starts from hidden
  setCurrent(id);
}
function update() {
  // Read everything first, then write.
  const line = window.innerHeight * 0.35;
  const rects = spied.map((s) => s.getBoundingClientRect());
  let current = spied[0];
  rects.forEach((r, i) => { if (r.top <= line) current = spied[i]; });
  if (atBottom()) { current = spied[spied.length - 1]; sections.forEach(reveal); } // a short last section may never reach the line
  if (pinned) {
    const i = spied.findIndex((s) => s.id === pinned);
    if (i > -1 && rects[i].bottom > 0 && rects[i].top < window.innerHeight) current = spied[i];
    else pinned = null; // the pinned section left the screen
  }
  if (current) setCurrent(current.id);
}
const unpin = () => { pinned = null; };
['wheel', 'touchmove'].forEach((name) => window.addEventListener(name, unpin, { passive: true }));
window.addEventListener('keydown', (e) => { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) unpin(); });
links.forEach((a) => a.addEventListener('click', () => pin(a.hash.slice(1))));
window.addEventListener('hashchange', () => pin(location.hash.slice(1)));
window.addEventListener('scroll', () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; update(); }); // one pass per frame, then it stops
}, { passive: true });
update();
