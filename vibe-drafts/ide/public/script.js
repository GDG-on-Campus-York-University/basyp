// Shared helper: one frame per scroll or resize event, then it rests.
function onFrame(fn) {
  let queued = false;
  const kick = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; fn(); }); } };
  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', kick);
  window.addEventListener('load', kick);
  kick();
}

// ---- Minimap ----
const minimap = document.querySelector('.minimap');
const thumb = document.querySelector('.minimap-thumb');
const sectionEls = [...document.querySelectorAll('main section[id]')];
if (minimap && thumb) {
  minimap.hidden = false;
  sectionEls.forEach((section) => {
    const block = document.createElement('div');
    block.className = 'minimap-block';
    block.dataset.for = section.id;
    minimap.append(block);
  });
  const blocks = minimap.querySelectorAll('.minimap-block');
  onFrame(() => {
    // Read first, then write.
    const doc = document.documentElement.scrollHeight;
    const view = window.innerHeight;
    const top = window.scrollY / doc;
    const heights = sectionEls.map((s) => s.offsetHeight);
    blocks.forEach((block, i) => { block.style.flexGrow = heights[i]; });
    thumb.style.transform = `translateY(${top * 100}%) scaleY(${Math.min(1, view / doc)})`;
  });
}

// ---- Tabs and navigation ----
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const tabs = [...document.querySelectorAll('.tab')];
const statusName = document.querySelector('.status-name');
let lockedId = null; // the section a jump chose; the scroll-spy leaves it alone

function setActive(id) {
  tabs.forEach((tab) => {
    if (tab.getAttribute('href') === '#' + id) tab.setAttribute('aria-current', 'location');
    else tab.removeAttribute('aria-current');
  });
  document.querySelectorAll('.minimap-block').forEach((b) => b.classList.toggle('is-active', b.dataset.for === id));
  const tab = tabs.find((t) => t.getAttribute('href') === '#' + id);
  if (statusName && tab) statusName.textContent = tab.textContent;
}
function jumpTo(id) { // works for sections and for project files
  const target = document.getElementById(id);
  if (!target) return;
  const owner = target.closest('section[id]') || target;
  const move = () => {
    target.scrollIntoView({ behavior: 'instant', block: 'start' });
    try { history.pushState(null, '', '#' + id); } catch (error) { /* some file:// setups refuse; the jump still worked */ }
    const heading = target.matches('h1, h2, h3') ? target : target.querySelector('h1, h2, h3');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
    lockedId = owner.id;
    setActive(owner.id);
  };
  if (document.startViewTransition && !reduceMotion.matches) document.startViewTransition(move);
  else move();
}
tabs.forEach((tab) => tab.addEventListener('click', (event) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return; // keep "open in new tab"
  event.preventDefault();
  jumpTo(tab.getAttribute('href').slice(1));
}));

// Release the lock only when the visitor scrolls by themselves, or the section leaves the screen.
const scrollKeys = ['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown', ' '];
const release = () => { lockedId = null; };
['wheel', 'touchmove'].forEach((name) => window.addEventListener(name, release, { passive: true }));
window.addEventListener('keydown', (event) => { if (scrollKeys.includes(event.key)) release(); });
window.addEventListener('hashchange', () => { // back button, or a link typed in by hand
  const id = location.hash.slice(1);
  const section = document.getElementById(id);
  if (section) { lockedId = (section.closest('section[id]') || section).id; setActive(lockedId); }
});

onFrame(() => {
  const bottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  const rects = sectionEls.map((s) => s.getBoundingClientRect());
  if (lockedId) { // free the lock once that section is completely off screen
    const i = sectionEls.findIndex((s) => s.id === lockedId);
    if (i < 0 || rects[i].bottom <= 0 || rects[i].top >= window.innerHeight) lockedId = null;
    else return;
  }
  const probe = window.innerHeight * 0.35;
  let current = sectionEls[0];
  sectionEls.forEach((s, i) => { if (rects[i].top <= probe) current = s; }); // sections already scrolled past count too
  if (window.scrollY < 8) current = sectionEls[0];
  else if (bottom) current = sectionEls[sectionEls.length - 1];
  setActive(current.id);
});

// ---- Command palette ----
const palette = document.getElementById('palette');
const field = document.getElementById('palette-input');
const results = document.getElementById('palette-list');
const announce = document.getElementById('palette-status');
const statusbar = document.querySelector('.statusbar');
if (palette && field && results && typeof palette.showModal === 'function') {
  if (statusbar) { statusbar.hidden = false; document.body.classList.add('has-status'); }
  const isMac = /Mac|iPhone|iPad/.test(navigator.userAgentData ? navigator.userAgentData.platform : navigator.platform);
  document.querySelectorAll('[data-mod]').forEach((el) => { el.textContent = isMac ? '⌘' : 'Ctrl'; });

  // Everything comes from the page itself, so it can never disagree with SPEC.md.
  const commands = [];
  sectionEls.forEach((s) => { // the label is the tab's name (so Home says "Home", not the student's name)
    const tab = tabs.find((t) => t.getAttribute('href') === '#' + s.id);
    const h = s.querySelector('h1, h2');
    const label = tab ? tab.textContent.trim() : h ? h.textContent.trim() : '';
    if (label) commands.push({ label, kind: 'Section', run: () => jumpTo(s.id) });
  });
  document.querySelectorAll('main .file[id]').forEach((f) => commands.push({ label: f.querySelector('h3').textContent.trim(), kind: 'Project', run: () => jumpTo(f.id) }));
  document.querySelectorAll('[data-palette-link]').forEach((a) => commands.push({ label: a.textContent.trim(), kind: 'Link', run: () => a.click() }));

  let shown = []; let active = 0; let opener = null; let ran = false;
  function mark() {
    [...results.children].forEach((li, i) => li.setAttribute('aria-selected', String(i === active)));
    const li = results.children[active];
    if (li) { field.setAttribute('aria-activedescendant', li.id); li.scrollIntoView({ block: 'nearest' }); }
    else field.removeAttribute('aria-activedescendant');
  }
  function render() {
    const words = field.value.toLowerCase().split(/\s+/).filter(Boolean);
    shown = commands.filter((c) => words.every((w) => (c.label + ' ' + c.kind).toLowerCase().includes(w)));
    active = 0;
    results.textContent = '';
    shown.forEach((c, i) => {
      const li = document.createElement('li');
      const name = document.createElement('span'); name.textContent = c.label;
      const kind = document.createElement('span'); kind.className = 'palette-kind'; kind.textContent = c.kind;
      li.id = 'cmd-' + i; li.setAttribute('role', 'option'); li.append(name, kind);
      li.addEventListener('click', () => run(i));
      results.append(li);
    });
    announce.textContent = shown.length ? shown.length + (shown.length === 1 ? ' result' : ' results') : 'No results';
    mark();
  }
  function run(i) { const cmd = shown[i]; if (!cmd) return; ran = true; palette.close(); cmd.run(); }
  function openPalette() { opener = document.activeElement; ran = false; field.value = ''; render(); palette.showModal(); field.focus(); }

  field.addEventListener('input', render);
  field.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (shown.length) active = (active + (event.key === 'ArrowDown' ? 1 : shown.length - 1)) % shown.length;
      mark();
    } else if (event.key === 'Enter') { event.preventDefault(); run(active); }
  }); // Escape needs no code: a modal dialog closes itself
  palette.addEventListener('close', () => { if (!ran && opener && opener.focus) opener.focus(); }); // focus goes back where it was
  palette.addEventListener('click', (event) => { if (event.target === palette) palette.close(); }); // click on the backdrop
  document.querySelectorAll('[data-palette-open]').forEach((btn) => btn.addEventListener('click', openPalette));

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.isComposing || event.altKey || event.shiftKey) return;
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return;
    const el = event.target;
    // Leave Ctrl+K alone in the page's own text fields and editable areas; our search field may close the palette.
    const typing = el instanceof HTMLElement && el !== field && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
    if (typing) return;
    event.preventDefault();
    if (palette.open) palette.close(); else openPalette();
  });
}
