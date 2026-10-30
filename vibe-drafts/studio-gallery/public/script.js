const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 2. Scroll: fallback for browsers without scroll-driven animation */
if (!reduce && 'IntersectionObserver' in window && !CSS.supports('animation-timeline: view()')) {
  const hung = [...document.querySelectorAll('.hang .piece')];
  const hangIo = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      // Also hang pieces already scrolled past (for example after a reload).
      if (entry.isIntersecting || entry.boundingClientRect.top < 0) { entry.target.classList.add('is-hung'); hangIo.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  hung.forEach((piece) => { piece.classList.add('will-hang'); hangIo.observe(piece); });
  // Keyboard users: a piece appears as soon as Tab lands inside it.
  document.addEventListener('focusin', (event) => { const piece = event.target.closest('.will-hang'); if (piece) piece.classList.add('is-hung'); });
  // A short last piece may never reach the trigger line: at the very bottom, show the rest.
  window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) hung.forEach((piece) => piece.classList.add('is-hung'));
  }, { passive: true });
}

/* 4. Navigation: the marker glides along the wall */
const navList = document.querySelector('.site-nav');
const navLinks = [...document.querySelectorAll('.nav-list a')];
const sections = [...document.querySelectorAll('main section[id]')];
const marker = document.createElement('span');
marker.className = 'nav-marker';
marker.setAttribute('aria-hidden', 'true');
if (navList) navList.append(marker);
let locked = null, placed = false;                  // locked: { id, seen } while a jump settles

function placeMarker(link) {
  if (!link) return;
  const list = navList.getBoundingClientRect(), box = link.getBoundingClientRect();   // read first
  if (!placed) { marker.style.transition = 'none'; }                                  // the first placement does not glide in from the corner
  marker.style.setProperty('--x', (box.left - list.left) + 'px');                     // then write
  marker.style.setProperty('--y', (box.bottom - list.top - 8) + 'px');
  marker.style.setProperty('--w', box.width.toFixed(1));
  if (!placed) { marker.offsetWidth; marker.style.transition = ''; placed = true; }
}
function setCurrent(id) {
  navLinks.forEach((a) => {
    if (a.hash === '#' + id) { a.setAttribute('aria-current', 'location'); placeMarker(a); }
    else a.removeAttribute('aria-current');
  });
}
function currentFromScroll() {
  if (window.scrollY < 8) return sections[0].id;                                                                                // top: home
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) return sections[sections.length - 1].id; // bottom: last
  const line = window.innerHeight * 0.4;
  let id = sections[0].id;
  sections.forEach((s) => { if (s.getBoundingClientRect().top <= line) id = s.id; });
  return id;
}
function updateNav() {
  if (!sections.length || !navList) return;
  if (locked) {
    const box = document.getElementById(locked.id).getBoundingClientRect();   // read first
    const onScreen = box.bottom > 0 && box.top < window.innerHeight;
    if (onScreen) locked.seen = true; else if (locked.seen) locked = null;
  }
  setCurrent(locked ? locked.id : currentFromScroll());                       // then write
}
function jump(id) { if (document.getElementById(id)) { locked = { id, seen: false }; setCurrent(id); } }
function release() { locked = null; updateNav(); }

navLinks.forEach((a) => a.addEventListener('click', () => jump(a.hash.slice(1))));
window.addEventListener('hashchange', () => jump(location.hash.slice(1)));
['wheel', 'touchmove'].forEach((type) => window.addEventListener(type, release, { passive: true }));
window.addEventListener('keydown', (e) => { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) release(); });
let ticking = false;                                // one frame per scroll burst, no loop
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { ticking = false; updateNav(); });
}, { passive: true });
window.addEventListener('resize', updateNav);
if (document.fonts) document.fonts.ready.then(updateNav);   // link widths change when the font arrives
if (location.hash.length > 1) jump(location.hash.slice(1));
updateNav();

/* 5. Signature: the piece becomes the viewing room */
const room = document.getElementById('viewing-room');
let opener = null, busy = false;

function go(from, to, update) {                    // from: has the name now; to: gets it after the update
  if (!document.startViewTransition || reduce) { update(); return; }   // fallback: instant swap
  busy = true;
  from.style.viewTransitionName = 'piece';
  const t = document.startViewTransition(() => { from.style.viewTransitionName = ''; to.style.viewTransitionName = 'piece'; update(); });
  t.finished.finally(() => { to.style.viewTransitionName = ''; busy = false; });
}
function fillRoom(piece) {                          // copies the real label text; empty lines are hidden
  const text = (sel) => (piece.querySelector(sel) ? piece.querySelector(sel).textContent.trim() : '');
  room.querySelector('.room-title').textContent = text('.piece-title');
  [['.room-medium', '.piece-medium'], ['.room-desc', '.piece-desc']].forEach(([into, from]) => {
    const el = room.querySelector(into);
    el.textContent = text(from);
    el.hidden = !el.textContent;
  });
  const link = piece.querySelector('.piece-link');
  room.querySelector('.room-links').replaceChildren(...(link ? [link.cloneNode(true)] : []));
  room.querySelector('.room-art-slot').replaceChildren(piece.querySelector('.piece-art').cloneNode(true));
}
function openRoom(piece) {
  if (busy || room.open) return;
  opener = piece.querySelector('.piece-open');
  fillRoom(piece);
  go(piece.querySelector('.piece-art'), room.querySelector('.piece-art'), () => room.showModal());   // focus lands on Close
}
function closeRoom() {
  if (busy || !room.open || !opener) return;
  const wallArt = opener.closest('.piece').querySelector('.piece-art');
  go(room.querySelector('.piece-art'), wallArt, () => { room.close(); opener.focus({ preventScroll: true }); });
}

if (room && typeof room.showModal === 'function') {
  document.querySelectorAll('.piece').forEach((piece) => {
    const title = piece.querySelector('.piece-title');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'piece-open';
    button.setAttribute('aria-haspopup', 'dialog');
    button.textContent = title.textContent.trim();
    title.replaceChildren(button);
    piece.classList.add('has-open');
    piece.addEventListener('click', (e) => { if (!e.target.closest('.piece-link')) openRoom(piece); });   // the whole piece opens, but the real link still works
  });
  room.querySelector('.room-close').addEventListener('click', closeRoom);
  room.addEventListener('cancel', (e) => { e.preventDefault(); closeRoom(); });          // Esc goes through the same glide
  room.addEventListener('click', (e) => { if (e.target === room) closeRoom(); });         // a click on the bare wall also closes
}
