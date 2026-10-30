const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

// Typeset: wraps each word of a title in a mask. Words stay real text, spaces stay between them.
function typeset(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  words.forEach((word, i) => {
    const line = document.createElement('span');
    const inner = document.createElement('span');
    line.className = 'line';
    inner.className = 'line-in';
    inner.textContent = word;
    inner.style.setProperty('--i', i);
    line.append(inner);
    el.append(line);
    if (i < words.length - 1) el.append(' ');
  });
}

const targets = document.querySelectorAll('.section-title, .story, .pull-quote, .figure');
if (!reduce && 'IntersectionObserver' in window) {
  document.querySelectorAll('.section-title').forEach(typeset);
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
        entry.target.classList.add('is-in');
        reveal.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  targets.forEach((el) => { el.classList.add('will-set'); reveal.observe(el); });
  window.addEventListener('scroll', () => {
    if (atBottom()) targets.forEach((el) => el.classList.add('is-in'));
  }, { passive: true });
  document.addEventListener('focusin', (event) => {
    const hidden = event.target.closest('.will-set');
    if (hidden) hidden.classList.add('is-in');
  });
}

// Running folio: which section is current
const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.folio-nav a')];
const folioNow = document.querySelector('.folio-now');
let current = sections.length ? sections[0].id : '';
let locked = '';
let lockSeen = false;

function setCurrent(id) {
  current = id;
  let label = '';
  navLinks.forEach((link) => {
    if (link.hash === '#' + id) { link.setAttribute('aria-current', 'location'); label = link.textContent; }
    else link.removeAttribute('aria-current');
  });
  if (folioNow && label) {
    const next = document.createElement('span');
    next.textContent = label;
    folioNow.replaceChildren(next);
  }
}
function spy() {
  if (!sections.length) return;
  const probe = window.innerHeight * 0.35;
  const rects = sections.map((section) => section.getBoundingClientRect());
  let id = sections[0].id;
  rects.forEach((rect, i) => { if (rect.top <= probe) id = sections[i].id; });
  if (window.scrollY < 8) id = sections[0].id;
  else if (atBottom()) id = sections[sections.length - 1].id;
  const lockIndex = sections.findIndex((section) => section.id === locked);
  if (lockIndex >= 0) {
    const r = rects[lockIndex];
    const onScreen = r.bottom > 0 && r.top < window.innerHeight;
    if (onScreen) lockSeen = true;
    if (onScreen || !lockSeen) id = locked; else locked = '';
  }
  if (id !== current) setCurrent(id);
}
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { ticking = false; spy(); });
}
function lockTo(hash) {
  const id = hash.replace('#', '');
  if (!sections.some((section) => section.id === id)) return;
  locked = id; lockSeen = false; setCurrent(id);
}
function unlock() { locked = ''; onScroll(); }
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
window.addEventListener('hashchange', () => lockTo(location.hash));
navLinks.forEach((link) => link.addEventListener('click', () => lockTo(link.hash)));
['wheel', 'touchmove'].forEach((type) => window.addEventListener(type, unlock, { passive: true }));
window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) unlock();
});
if (location.hash) lockTo(location.hash);
spy();

// Shrinks the name only if its longest word would not fit.
const heroName = document.querySelector('.hero-name');
function fitName() {
  if (!heroName) return;
  heroName.style.setProperty('--fit', 1);
  const room = heroName.clientWidth;
  const widest = Math.max(...[...heroName.querySelectorAll('.line-in')].map((el) => el.offsetWidth));
  const most = window.innerWidth < 640 ? 1.6 : 1; // on phones the name may grow to fill the column
  heroName.style.setProperty('--fit', Math.min(most, room / widest).toFixed(3));
}
fitName();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitName);
window.addEventListener('resize', () => requestAnimationFrame(fitName));
