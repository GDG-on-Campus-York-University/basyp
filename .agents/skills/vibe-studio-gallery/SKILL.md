---
name: vibe-studio-gallery
description: Restyles the portfolio site as a small art exhibition, with work hung like framed pieces on a quiet gallery wall, museum-style labels, and a viewing room that each piece enlarges into (look, layout and motion). Use ONLY when the student names the vibe-studio-gallery skill or asks for the Studio Gallery vibe. Changes how the site looks and moves, never what it says.
metadata:
  family: expressive
  tags: "design-art, digital-media"
  intensity: expressive
  version: "2"
---

# Vibe: Studio Gallery

## Feel and who it's for
The portfolio is a small exhibition. Calm plaster-coloured walls, generous empty space, and each project hung as a framed piece with a wall label beside it. Pieces glide past as you scroll, like walking along the wall, and a soft light warms the one you point at. Opening a piece enlarges it into a quiet viewing room. The mood is patient and confident, never loud. Good for art, design and media students whose work is visual. It is a flat wall seen straight on: not a magazine (Editorial), not a paper (Research Paper), not a grid of numbers (Swiss Minimal), not a film (Cinematic).

## Must keep (this is what makes it Studio Gallery)
1. A wall, not a page: plenty of empty space, and each project is a framed piece (frame, white mat, artwork) hung with a wall label beside it.
2. A light, warm-neutral palette with ONE muted accent (brass, like a gallery plaque). The artwork supplies the only colour.
3. Quiet type: a light, large sans for the name and titles, a book serif for label text. Nothing shouts and nothing is all-caps. A clear scale: a very large light name, medium section titles, small label titles, calm body text under 80 characters per line.
4. Motion is curated and fluid: long glides on one easing curve, no bounce, no snap, no steps.
5. Every project opens into a real viewing room (an accessible dialog) with the View Transitions API. That is the one loud moment; everything else stays small.

## Starting defaults (change freely)
The student can change any of these with a prompt such as "make the wall a soft grey-blue". Their request wins.

Palette, in words: plaster-grey wall with a warm tint; a lighter card for wall labels; a nearly white viewing room; warm near-black ink; a warm grey for secondary text; one dark brass accent; a pale warm light for the spotlight.

```css
/* Contrast, computed (WCAG). Text #1E1C1A on wall 13.5:1, label card 16.1:1, room 15.7:1, light 15.8:1.
   Muted #55504A on wall 6.3:1, card 7.6:1, room 7.4:1, lit wall 6.7:1. Brass #7A5200 on wall 5.5:1, card 6.6:1, room 6.4:1, lit wall 5.8:1.
   White on brass 6.9:1 (selection, hover fill). Room colour on ink (Close button) 15.7:1. Frame, mat, rules and artwork carry no text. */
:root {
  --color-wall: #E8E5DE;
  --color-card: #FAF9F5;      /* wall labels */
  --color-room: #F7F6F2;      /* the viewing room */
  --color-text: #1E1C1A;
  --color-muted: #55504A;
  --color-accent: #7A5200;    /* links and the nav marker */
  --color-light: #FFF6E0;     /* the warm spotlight pool; decoration only */
  --color-rule: #BDB7AC;      /* hairlines only, never text */
  --color-frame: #24211E;
  --color-mat: #FAF8F3;
  --font-display: "Urbanist", "Helvetica Neue", Arial, sans-serif;
  --font-body: "Crimson Pro", Georgia, serif;
  --ease-glide: cubic-bezier(0.23, 0.82, 0.25, 1);   /* quick to leave, very long even glide, no overshoot */
}
*, *::before, *::after { box-sizing: border-box; }
html { scrollbar-gutter: stable; }                                   /* the page does not jump when the viewing room locks scrolling */
html:has(.room[open]) { overflow: hidden; }
body { margin: 0; background: var(--color-wall); color: var(--color-text); font: 400 1.1875rem/1.6 var(--font-body); }
h1, h2, h3 { margin: 0; font-family: var(--font-display); font-weight: 300; line-height: 1.1; }   /* Urbanist is variable, so say the weight */
p { margin: 0 0 1em; max-width: 36rem; }                                                          /* lines stay under 80 characters */
ul { margin: 0; padding: 0; list-style: none; }
a { color: var(--color-accent); text-underline-offset: 0.2em; }
main { overflow-x: clip; }                                           /* pieces drift sideways; the page never scrolls sideways */
main > section { width: min(100% - 2rem, 70rem); margin-inline: auto; padding-block: clamp(4rem, 12vw, 9rem); }   /* 16px gutters; or your spacing scale */
section[id] { scroll-margin-top: 1rem; }
::selection { background: var(--color-accent); color: #FFFFFF; }
```
Fonts: Urbanist (variable, used light) for the name, titles, nav and label titles; Crimson Pro for reading text. Alternatives: Lexend or Sora for display, Gelasio or Literata for text. Not Bodoni Moda, Fraunces, Jost or Newsreader (other vibes).
`<link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@300..600&family=Crimson+Pro:ital,wght@0,400..600;1,400&display=swap" rel="stylesheet">`
Corners stay square, as on real frames and wall labels. Another good wall: bright white-cube `#F7F7F5` (recompute contrast for the accent).

## Layout ideas
- **Header:** the student's name as a link to `#home` and the section links, on the wall colour with a hairline underneath. On phones it scrolls away and the links wrap to a second row if five do not fit at 320px (each at least 44px tall, never sideways scrolling). From 48rem wide it is sticky. No footer, or one plain "Back to top" link.
- **Hero:** the real name very large in light weight, the one-line intro under it as a short wall text (the one-line intro from SPEC.md; if SPEC.md has no separate tagline, use the "Who I am" line without the name). Check the longest word of the name at 320px.
- **About:** a small title at the left and the real bio in a narrow column at the right (stacked on phones). Leave the rest of the wall empty.
- **Projects (the exhibition):** one piece per real project, hung with plenty of space between. Odd pieces sit at the left, even pieces at the right, and pieces differ in shape (portrait, square, landscape) so the wall feels hung, not gridded. Each piece is the artwork plus its wall label. On phones label sits under the artwork.
- **Skills:** the real skills as a plain list in two columns with hairlines between, set in the book serif.
- **Contact:** the real email and links as large light text, one per line. Link text is the label SPEC.md gives next to the URL (for example "Instagram"), never new wording. A real email must fit on one line at 320px, hence the `clamp()` size.
- **Wall label (only real data):** the project title, then the medium as one italic line if SPEC.md states one (write it as SPEC.md does, without the word "Medium:"), then the real description. A year only if SPEC.md states one. No dimensions, prices, edition numbers, museum names or dates that SPEC.md does not give. A link only if SPEC.md has one.

```html
<li class="piece">
  <div class="piece-art" aria-hidden="true" style="--hue: 24; --ratio: 0.8">
    <div class="piece-mat"><div class="piece-field field-a"></div></div>
  </div>
  <div class="piece-label">
    <h3 class="piece-title">Project name from SPEC.md</h3>
    <p class="piece-medium">The medium from SPEC.md, only if it states one.</p>
    <p class="piece-desc">The description from SPEC.md.</p>
    <a class="piece-link" href="https://example.com/project">Link: Project name from SPEC.md</a> <!-- only if SPEC.md has a link -->
  </div>
</li>
```
Wrap the pieces in `<ul class="hang">`. Leave out the medium line when SPEC.md states none.

### The artwork
SPEC.md rarely has images, so each piece shows a designed composition: a dark frame, a white mat and an abstract colour field built from one hue per project. It is clearly decoration (`aria-hidden`) and must never draw the subject of the work, such as a fake landscape or a fake face. Pick hues at least 60 degrees apart (or use a colour word SPEC.md gives for the project), cycle `field-a`, `field-b`, `field-c`, and vary `--ratio` (width divided by height: `0.8`, `1`, `1.25`).

**When SPEC.md lists a real image** (a file in `assets/` with alt text): replace the `div.piece-field` with `<img class="piece-field" src="assets/file.jpg" alt="The alt text from SPEC.md" width="800" height="1000">`, delete `aria-hidden="true"` from `.piece-art`, and set `--ratio` to the image's real width divided by height. Never add stock or generated images.

```css
.piece-art { --hue: 30; position: relative; flex: none; width: clamp(12rem, 40vw, 21rem); max-width: 100%; aspect-ratio: var(--ratio, 0.8); padding: 0.5rem; background: var(--color-frame);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.3), 0 14px 22px -12px rgb(0 0 0 / 0.45); }
.piece-art::after { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0;   /* the deeper shadow fades in on hover (moment 3) */
  box-shadow: 0 2px 4px rgb(0 0 0 / 0.3), 0 30px 40px -14px rgb(0 0 0 / 0.55); transition: opacity 700ms var(--ease-glide); }
.piece-mat { height: 100%; padding: 11%; background: var(--color-mat); box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.1), inset 1px 2px 3px rgb(0 0 0 / 0.08); }
.piece-field { display: block; width: 100%; height: 100%; object-fit: cover; transition: filter 700ms var(--ease-glide); }
.field-a { background: radial-gradient(circle at 68% 30%, hsl(calc(var(--hue) + 35) 75% 82%) 0 17%, transparent 18%), linear-gradient(180deg, hsl(var(--hue) 40% 66%) 0 58%, hsl(calc(var(--hue) + 12) 35% 36%) 58% 100%); }
.field-b { background: linear-gradient(90deg, hsl(var(--hue) 55% 48%) 0 38%, transparent 38%), linear-gradient(0deg, hsl(calc(var(--hue) + 30) 50% 74%) 0 30%, hsl(calc(var(--hue) + 30) 40% 90%) 30% 100%); }
.field-c { background: conic-gradient(from 200deg at 30% 70%, hsl(var(--hue) 50% 60%), hsl(calc(var(--hue) + 40) 55% 78%), hsl(var(--hue) 50% 60%)); }
.hang { display: grid; gap: clamp(4rem, 12vw, 9rem); margin-top: clamp(2rem, 6vw, 4rem); }
.piece { --dir: 1; position: relative; isolation: isolate; display: flex; flex-direction: column; align-items: flex-start; gap: 1.25rem; }
.piece:nth-child(even) { --dir: -1; }
.piece-label { flex: 0 1 17rem; max-width: 17rem; padding: 1rem 1.125rem 1.125rem; background: var(--color-card); border: 1px solid var(--color-rule); }
.piece-label p { margin: 0.5rem 0 0; font-size: 1.0625rem; line-height: 1.5; }
.piece-title { font-size: 1.125rem; font-weight: 500; }
.piece-medium { font-style: italic; color: var(--color-muted); }
.piece-link { display: inline-flex; align-items: center; min-height: 44px; margin-top: 0.25rem; position: relative; z-index: 1; }   /* sits above the piece's click area */
@media (min-width: 48rem) {
  .piece { flex-direction: row; align-items: flex-end; gap: 2rem; width: fit-content; max-width: 100%; }
  .piece:nth-child(even) { flex-direction: row-reverse; margin-left: auto; }
}
```

## Make it theirs
- The one loud thing is the viewing room opening. The wall, the labels, the glide and the light stay quiet.
- The student's own work sets the details: their titles, their media and their real hues. A student who paints, prints and animates gets three different pieces on one wall. Never add labels, captions or text on the artwork.

## Motion character
Tempo: patient, 700 to 1800ms, nothing under 400ms. Easing: one curve everywhere, `--ease-glide` (a quick departure and a long even glide); scroll-linked motion is `linear` because the visitor sets the pace. What moves: `transform` and `translate` (drift, marker), `opacity` (light, shadows), `filter` (warming), the View Transition. What never moves: paragraphs, the label text, the frame itself. The snippets share one `styles.css` and one `script.js` (helpers first, then each moment in order). Shared keyframe:

```css
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
```
```js
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

### 1. Page load: the lights come up
A pool of warm light grows on the hero wall while the name and intro fade in. Pure CSS, so the text is in the HTML and still shows without JavaScript. Text sits on the wall colour all the time, so contrast never drops.

```html
<section class="hero" id="home" aria-labelledby="home-title">
  <h1 id="home-title" class="hero-name">Your Name</h1>
  <p class="hero-intro">The one-line intro from SPEC.md.</p>
</section>
```
```css
.hero { position: relative; isolation: isolate; }
.hero::before { content: ""; position: absolute; inset: -10% -10% 0; z-index: -1; pointer-events: none;
  background: radial-gradient(ellipse 60% 70% at 30% 35%, var(--color-light), transparent 70%);
  animation: lights-up 1800ms var(--ease-glide) both; }
@keyframes lights-up { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: none; } }
.hero-name { font-size: clamp(3rem, 13vw, 9rem); line-height: 0.98; letter-spacing: -0.02em; overflow-wrap: anywhere; animation: fade 900ms var(--ease-glide) 200ms both; }
.hero-intro { margin-top: 1.5rem; max-width: 28rem; font-size: 1.375rem; animation: fade 900ms var(--ease-glide) 450ms both; }
```

### 2. Scroll: you walk past the pieces
On wide screens each piece drifts sideways as it crosses the screen: it arrives from the side, rests in the middle of its pass, then keeps going gently the other way. The artwork moves a little more than its label, so they slide past each other like things at different distances. This is pure CSS scroll-driven animation and nothing is ever hidden, so browsers without it simply show the wall still. Pieces alternate sides through `--dir`. The rules are scoped to `.hang`, so the copy inside the viewing room never drifts.

```css
@keyframes walk { 0% { translate: var(--drift) 0; } 30%, 70% { translate: 0 0; } 100% { translate: calc(var(--drift) * -0.4) 0; } }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) and (min-width: 48rem) {
    .hang .piece-art, .hang .piece-label { animation: walk linear both; animation-timeline: view(); animation-range: cover 0% cover 100%; }
    .hang .piece-art { --drift: calc(7vw * var(--dir)); }
    .hang .piece-label { --drift: calc(3vw * var(--dir)); }
  }
}
```
Browsers without scroll-driven animation get a gentler once-only version: JavaScript adds the hidden start, and each piece glides in when it reaches the lower part of the screen. Hidden pieces use `opacity`, not `visibility`, so screen readers still read them and Tab still reaches their links.

```css
.will-hang .piece-art, .will-hang .piece-label { opacity: 0; translate: calc(var(--dir) * 3rem) 0; }
/* The lit rules have one more class than the hidden ones, so they win. */
.will-hang.is-hung .piece-art, .will-hang.is-hung .piece-label { opacity: 1; translate: none; transition: opacity 900ms var(--ease-glide), translate 1100ms var(--ease-glide); }
.will-hang.is-hung .piece-label { transition-delay: 150ms; }
```
```js
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
```

### 3. Hover and focus: the light warms the piece
Pointing at (or tabbing to) a piece fades in a soft pool of light on the wall behind it, deepens the frame's shadow and warms the colours a touch. Only pieces that open (JavaScript adds `has-open`, moment 5) react, so nothing reacts that does nothing. Keyboard focus does the same plus a visible ring around the whole piece. The whole piece is the click target.

```css
.piece::before { content: ""; position: absolute; inset: -12% -8%; z-index: -1; pointer-events: none; opacity: 0;
  background: radial-gradient(ellipse at 40% 40%, var(--color-light), transparent 68%); transition: opacity 700ms var(--ease-glide); }
.piece-open { padding: 0; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; min-height: 44px; }
.piece-open::after { content: ""; position: absolute; inset: 0; }                 /* stretches the button over the whole piece */
.piece-open:focus-visible { outline: none; }                                      /* the ring is drawn on the stretched area instead */
.piece-open:focus-visible::after { outline: 3px solid var(--color-text); outline-offset: 4px; }
.piece.has-open:has(.piece-open:focus-visible)::before { opacity: 1; }
.piece.has-open:has(.piece-open:focus-visible) .piece-art::after { opacity: 1; }
.piece.has-open:has(.piece-open:focus-visible) .piece-field { filter: saturate(1.12) brightness(1.04); }
@media (hover: hover) {
  .piece.has-open:hover::before { opacity: 1; }
  .piece.has-open:hover .piece-art::after { opacity: 1; }
  .piece.has-open:hover .piece-field { filter: saturate(1.12) brightness(1.04); }
}
```

### 4. Navigation: the marker glides along the wall
A thin brass line slides under the link of the section on screen, like a visitor's place in the gallery. Clicking a nav link scrolls smoothly (never taking over the scroll wheel). After a jump (click or `#hash`), that link stays current until the visitor scrolls on their own (wheel, touch, scroll keys) or the section leaves the screen, so a short last section is never taken over by the one before it. The marker is made by JavaScript, so without it the nav is plain links. It moves with `transform` only, and works when the links wrap to two rows at 320px.

```html
<header class="site-header">
  <div class="header-row">
    <a class="brand" href="#home">Your Name</a>
    <nav class="site-nav" aria-label="Sections"><ul class="nav-list">
      <li><a href="#home">Home</a></li><li><a href="#about">About</a></li> <!-- one li per real section in SPEC.md -->
    </ul></nav>
  </div>
</header>
```
```css
.site-header { background: var(--color-wall); border-bottom: 1px solid var(--color-rule); }
.header-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; column-gap: 1rem; width: min(100% - 2rem, 70rem); margin-inline: auto; }
.brand, .nav-list a { display: inline-flex; align-items: center; min-height: 44px; font-family: var(--font-display); font-weight: 500; text-decoration: none; color: var(--color-text); }
.site-nav { position: relative; }
.nav-list { display: flex; flex-wrap: wrap; margin-inline: -0.75rem; }          /* five links wrap to a second row at 320px */
.nav-list a { padding-inline: 0.75rem; font-size: 0.9375rem; color: var(--color-muted); }
.nav-list a[aria-current="location"] { color: var(--color-text); }
.brand:focus-visible, .nav-list a:focus-visible { outline: 3px solid var(--color-text); outline-offset: -3px; }   /* drawn inside, so the screen edge never clips it */
.nav-marker { position: absolute; left: 0; top: 0; width: 1px; height: 2px; background: var(--color-accent); pointer-events: none; transform-origin: 0 0;
  transform: translate(var(--x, 0px), var(--y, 0px)) scaleX(var(--w, 0)); transition: transform 700ms var(--ease-glide); }
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
@media (min-width: 48rem) {
  .site-header { position: sticky; top: 0; z-index: 10; }
  section[id] { scroll-margin-top: 4rem; }          /* use your header's height so it never covers a heading */
}
```
```js
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
```

### 5. Signature: the piece becomes the viewing room
Clicking a piece (or pressing Enter or Space on it) enlarges its artwork from its place on the wall into a full viewing room, using `document.startViewTransition()` and one `view-transition-name`. Closing flies it back to the wall. The room is a real `<dialog>`: focus moves in (the Close button is first), the page behind is inert, Esc and the visible Close button close it, and focus returns to the piece. Its text is copied from the piece's own label, so it is exactly SPEC.md. Where View Transitions are missing, or reduced motion is on, the room simply opens and closes at once.

Rules that keep it working: only ONE element may carry the name at a time (two with the same name cancel the whole transition), so the code moves it from the wall artwork to the room artwork inside the update callback. The wall artwork and the room artwork use the same `--ratio`, so the picture scales smoothly instead of stretching. Put the dialog after `</main>`, and the buttons are made by JavaScript so no dead buttons exist without it.

```html
<dialog class="room" id="viewing-room" aria-labelledby="room-title">
  <div class="room-bar"><button type="button" class="room-close">Close</button></div>
  <div class="room-inner">
    <div class="room-art-slot"></div>
    <div class="room-label">
      <h2 id="room-title" class="room-title"></h2>
      <p class="room-medium"></p>
      <p class="room-desc"></p>
      <div class="room-links"></div>
    </div>
  </div>
</dialog>
```
```css
.room { width: 100%; height: 100dvh; max-width: none; max-height: none; margin: 0; padding: 0; border: 0; overflow: auto; background: var(--color-room); color: var(--color-text); }
.room::backdrop { background: rgb(30 28 26 / 0.6); }
.room-bar { position: sticky; top: 0; z-index: 1; display: flex; justify-content: flex-end; padding: 0.5rem 1rem; background: var(--color-room); }
.room-close { min-height: 44px; padding-inline: 1.25rem; border: 0; background: var(--color-text); color: var(--color-room); font: 500 1rem var(--font-display); cursor: pointer; }
.room-close:hover { background: var(--color-accent); color: #FFFFFF; }
.room-close:focus-visible { outline: 3px solid var(--color-text); outline-offset: 3px; }
.room-inner { display: grid; gap: 1.5rem 3rem; align-content: center; width: min(100% - 2rem, 64rem); min-height: calc(100% - 4rem); margin-inline: auto; padding-block: 1rem 3rem; }
.room .piece-art { width: min(100%, 32rem, calc(64svh * var(--ratio, 0.8))); }   /* big, but always fits the screen */
.room-title { margin-bottom: 0.75rem; font-size: clamp(1.75rem, 5vw, 2.75rem); }
.room-medium { font-style: italic; color: var(--color-muted); }
@media (min-width: 48rem) { .room-inner { grid-template-columns: minmax(0, 32rem) minmax(0, 24rem); justify-content: center; align-items: center; } .room .piece-art { margin-left: auto; } }
/* The enlarging glide. The group moves and resizes the artwork; the page behind softly crossfades. */
::view-transition-group(piece) { animation-duration: 750ms; animation-timing-function: var(--ease-glide); }
::view-transition-old(root), ::view-transition-new(root) { animation-duration: 450ms; animation-timing-function: var(--ease-glide); }
```
```js
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
    button.addEventListener('click', () => openRoom(piece));
  });
  room.querySelector('.room-close').addEventListener('click', closeRoom);
  room.addEventListener('cancel', (e) => { e.preventDefault(); closeRoom(); });          // Esc goes through the same glide
  room.addEventListener('click', (e) => { if (e.target === room) closeRoom(); });         // a click on the bare wall also closes
}
```

## Reduced motion
Everything is visible and still: the lights are simply on, pieces do not drift, the marker jumps, and the room opens and closes at once (the JavaScript above already skips the transition and the fallback). The last block in the file wins; keep it last.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }
  .will-hang .piece-art, .will-hang .piece-label { opacity: 1; translate: none; }   /* undo the hidden start, in case the setting changes while the page is open */
}
```

## Libraries
None. Plain CSS and JavaScript. The View Transitions API and CSS scroll-driven animation are built into modern browsers, and each has a fallback above.

## Avoid
- Ornate gold frames, velvet ropes, a 3D walk-through room with a camera (that is a different vibe), or stock or generated pictures that pretend to be the student's work.
- Fake museum detail: invented museum or gallery names, "on view until" dates, dimensions, prices, edition numbers, "sold" red dots, catalogue numbers. Wall labels carry only what SPEC.md says.
- Text, captions or numbers on the artwork, compositions that draw the subject of the work, and a permanent `view-transition-name` on every piece (only the moving artwork has one).
- Hiding the real text until JavaScript runs, an icon-only Close control, or a room that Esc cannot close.
- Scroll-jacking: taking over the wheel, forced snapping, or turning the page into a sideways-scrolling track. The drift is an offset, not a scroll.
- Bounce, blur, grain, dark cinematic bars, big shadows on everything, rounded pillowy cards (labels and frames are square).
- Generic page habits: a "→" after every link, "A · B · C" strings, numbering pieces 01 / 02 / 03, one word of a headline picked out in the accent, an ALL-CAPS label above every heading, a fade-up on every section.

## Who wins
The student's requests override this skill. The content rules in AGENTS.md always apply.
