// Scroll Film: one matchMedia, one function per shot. Function declarations, so the order of the file does not matter.
(function () {
  // If a library failed to load (offline, blocked CDN), stop here. The static layout is a complete portfolio.
  if (!window.gsap || !window.ScrollTrigger || !window.SplitText) return;
  gsap.registerPlugin(ScrollTrigger, SplitText);

  const DEBUG = false; // true draws ScrollTrigger start/end markers. Set it back to false before you publish.
  ScrollTrigger.defaults({ markers: DEBUG });
  ScrollTrigger.config({ ignoreMobileResize: true }); // phone address bars should not re-run every trigger

  const root = document.documentElement;
  let firstBuild = true;

  gsap.matchMedia().add(
    { film: '(prefers-reduced-motion: no-preference)', touch: '(hover: none) and (pointer: coarse)' },
    (context) => {
      const { film, touch } = context.conditions;
      if (!film) return;                                  // reduced motion: stay on the static layout
      root.classList.add('has-film');

      const cfg = { touch, scrub: touch ? true : 0.8 };   // scrub: 0.8 = the film trails your scroll by about 0.8s
      const smooth = touch ? null : startLenis();         // touch screens keep their native scrolling
      const nav = setupNav(smooth && smooth.lenis);

      // The film, in order. To add a shot, write a function like shotAbout and call it here.
      loadIn();
      shotHome(cfg);
      shotAbout(cfg);
      shotProjects(cfg);
      shotSkills(cfg);
      shotContact(cfg);
      parallax(cfg);
      progressLine();
      nav.watchShots();

      const start = () => { ScrollTrigger.refresh(); if (firstBuild && location.hash) nav.jumpTo(location.hash.slice(1), true); firstBuild = false; };
      if (document.readyState === 'complete') start(); else window.addEventListener('load', start, { once: true });

      return () => {                                      // cleanup, runs when the film is torn down
        nav.destroy();
        if (smooth) smooth.stop();
        root.classList.remove('has-film');
      };
    }
  );

  // Smooth scrolling. Lenis eases the real scroll position, so the scrollbar, keyboard and find-in-page still work.
  function startLenis() {
    const lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);             // tell ScrollTrigger whenever Lenis moves
    const tick = (time) => lenis.raf(time * 1000);        // GSAP's clock drives Lenis (one loop, not two)
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // With Lenis on it, GSAP's ticker would run every frame forever. Let it sleep after 1.5s with nothing
    // moving; any input or scroll wakes it (GSAP also wakes it whenever a new tween starts).
    let idle;
    const wake = () => {
      gsap.ticker.wake();
      clearTimeout(idle);
      idle = setTimeout(() => (lenis.isScrolling ? wake() : gsap.ticker.sleep()), 1500);
    };
    const inputs = ['wheel', 'keydown', 'pointerdown', 'touchstart', 'scroll'];
    inputs.forEach((name) => window.addEventListener(name, wake, { passive: true }));
    wake();
    return { lenis, stop() {
      inputs.forEach((name) => window.removeEventListener(name, wake));
      clearTimeout(idle); gsap.ticker.wake();
      gsap.ticker.remove(tick); gsap.ticker.lagSmoothing(500, 33); lenis.destroy();
    } };
  }

  // 1. Page load. The title card is readable at once, inside the half-closed letterbox. Only the rule draws.
  function loadIn() {
    gsap.from('.hero-rule', { scaleX: 0, duration: 1.2, delay: 0.2, ease: 'power2.inOut' });
  }

  // 2. Scroll. Every shot has: a transition into it (its grade), text revealed by scrub, and optional parallax.
  // clamp() keeps a trigger inside the page, so the last shot still finishes at the very bottom.
  function clamp(position) { return `clamp(${position})`; }

  function revealTitle(id, cfg) {                         // the heading rises word by word out of a mask
    SplitText.create(`${id} .shot__title`, {
      type: 'words', mask: 'words', wordsClass: 'word', tag: 'span', aria: 'auto', autoSplit: true,
      onSplit: (split) => gsap.from(split.words, {
        yPercent: 110, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: id, start: 'top 80%', end: clamp('top 40%'), scrub: cfg.scrub }
      })
    });
  }

  function revealLines(selector, id, cfg) {               // a paragraph rises line by line
    SplitText.create(selector, {
      type: 'lines', mask: 'lines', linesClass: 'line', tag: 'span',
      aria: 'none',
      autoSplit: true,
      onSplit: (split) => gsap.from(split.lines, {
        yPercent: 105, stagger: 0.15, ease: 'power2.out',
        scrollTrigger: { trigger: id, start: 'top 60%', end: clamp('top 15%'), scrub: cfg.scrub }
      })
    });
  }

  // Transition into About: a cross-fade (the grade fades in under the text).
  function shotAbout(cfg) {
    gsap.fromTo('#about .shot__grade', { opacity: 0 }, {
      opacity: 1, ease: 'none',
      scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'top 30%', scrub: cfg.scrub }
    });
    revealTitle('#about', cfg);
    revealLines('#about .shot__text', '#about', cfg);
  }

  // Transition into Projects: a wipe from the right. Each project then comes into focus.
  function shotProjects(cfg) {
    gsap.fromTo('#projects .shot__grade', { clipPath: 'inset(0% 0% 0% 100%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
      scrollTrigger: { trigger: '#projects', start: 'top bottom', end: 'top 25%', scrub: cfg.scrub }
    });
    revealTitle('#projects', cfg);
    gsap.utils.toArray('#projects .project').forEach((project) => {
      const from = { opacity: 0.15, y: 48 };
      const to = { opacity: 1, y: 0, ease: 'none',
        scrollTrigger: { trigger: project, start: 'top 92%', end: 'top 62%', scrub: cfg.scrub } };
      if (!cfg.touch) { from.filter = 'blur(8px)'; to.filter = 'blur(0px)'; }  // the focus pull; skipped on phones
      gsap.fromTo(project, from, to);
    });
  }

  // Transition into Skills: an iris that opens from the top centre.
  function shotSkills(cfg) {
    gsap.fromTo('#skills .shot__grade', { clipPath: 'circle(0% at 50% 0%)' }, {
      clipPath: 'circle(170% at 50% 0%)', ease: 'none',
      scrollTrigger: { trigger: '#skills', start: 'top bottom', end: 'top 30%', scrub: cfg.scrub }
    });
    revealTitle('#skills', cfg);
    gsap.from('#skills .skill-list li', {
      opacity: 0, y: 24, stagger: 0.08, ease: 'power2.out',
      scrollTrigger: { trigger: '#skills .skill-list', start: 'top 90%', end: clamp('top 55%'), scrub: cfg.scrub }
    });
  }

  // Transition into Contact: a push-in (the grade scales down onto the frame while it fades in).
  function shotContact(cfg) {
    gsap.fromTo('#contact .shot__grade', { opacity: 0, scale: 1.25 }, {
      opacity: 1, scale: 1, ease: 'none',
      scrollTrigger: { trigger: '#contact', start: 'top bottom', end: 'top 30%', scrub: cfg.scrub }
    });
    revealTitle('#contact', cfg);
    gsap.from('#contact .contact-list, #contact .to-top', {
      opacity: 0, y: 24, stagger: 0.1, ease: 'power2.out',
      scrollTrigger: { trigger: '#contact', start: 'top 60%', end: clamp('top 20%'), scrub: cfg.scrub }
    });
  }

  // Parallax: anything with data-depth drifts a little against the scroll. Off on touch screens.
  function parallax(cfg) {
    if (cfg.touch) return;
    gsap.utils.toArray('[data-depth]').forEach((el) => {
      const d = parseFloat(el.dataset.depth) * 40;        // depth 0.6 = 24px each way
      gsap.fromTo(el, { y: -d }, {
        y: d, ease: 'none',
        scrollTrigger: { trigger: el.closest('.shot'), start: 'top bottom', end: clamp('bottom top'), scrub: cfg.scrub }
      });
    });
  }

  // 4. Navigation. A thin accent line shows real scroll progress; the caption cuts to the current section's name;
  // links travel with Lenis. After a jump the chosen section stays selected until the visitor scrolls on their own.
  function progressLine() {
    gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });
  }

  function setupNav(lenis) {
    const links = [...document.querySelectorAll('.frame a[href^="#"]')];
    const caption = document.querySelector('.caption');
    const shots = gsap.utils.toArray('main .shot');
    const isShot = (id) => shots.some((shot) => shot.id === id);
    const abort = new AbortController();                  // one switch removes every listener below
    const opts = { passive: true, signal: abort.signal };
    let current = '';
    let lockId = '';                                      // the section a nav jump chose

    function select(id) {
      if (lockId && id !== lockId) {
        const box = document.getElementById(lockId).getBoundingClientRect();
        if (box.bottom > 0 && box.top < window.innerHeight) return;  // the jumped-to section is still on screen: keep it
        lockId = '';                                      // it left the screen: let the spy take over
      }
      if (id === current) return;
      current = id;
      links.forEach((a) => (a.hash === '#' + id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
      const link = links.find((a) => a.hash === '#' + id);
      if (caption && link) caption.textContent = link.textContent;   // decoration: mirrors the real section name
    }

    function jumpTo(id, immediate) {
      const target = document.getElementById(id);
      if (!target || !isShot(id)) return;
      lockId = id;
      select(id);
      if (lenis) lenis.scrollTo(id === 'home' ? 0 : target, { immediate, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
      else if (id === 'home') window.scrollTo(0, 0);
      else target.scrollIntoView();
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }

    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (event) => {
      if (!isShot(a.hash.slice(1))) return;               // the skip link and anything else keeps its normal behaviour
      event.preventDefault();
      history.pushState(null, '', a.hash);
      jumpTo(a.hash.slice(1));
    }, { signal: abort.signal }));
    window.addEventListener('hashchange', () => jumpTo(location.hash.slice(1)), { signal: abort.signal });

    // The visitor scrolling on their own ends the lock.
    const release = () => { lockId = ''; };
    window.addEventListener('wheel', release, opts);
    window.addEventListener('touchmove', release, opts);
    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) release();
    }, { signal: abort.signal });

    function watchShots() {
      shots.forEach((shot) => ScrollTrigger.create({
        trigger: shot, start: 'top 50%', end: 'bottom 50%',          // the middle of the screen picks the section
        onToggle: (self) => { if (self.isActive) select(shot.id); }
      }));
      // The very top is always Home, the very bottom is always the last shot (a short last shot may never reach the middle).
      ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: (self) => {
          if (self.scroll() < 8) select(shots[0].id);
          else if (self.progress > 0.999) select(shots[shots.length - 1].id);
        }
      });
      select(shots[0].id);
    }

    return { jumpTo, watchShots, destroy() { abort.abort(); } };
  }

  // 5. Signature: the title card. The first scroll opens the letterbox and the name assembles from its letters.
  function shotHome(cfg) {
    const end = cfg.touch ? '+=70%' : '+=100%';           // the pin lasts at most one screen of scrolling
    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '#home', start: 'top top', end, pin: true, anticipatePin: 1, scrub: cfg.scrub,
        invalidateOnRefresh: true                         // the bar sizes below depend on the screen height, so re-measure on resize
      }
    })
      // The bars start tall (20% of the screen each) and open to their real size.
      .fromTo('.letterbox', { scaleY: (i, bar) => (window.innerHeight * 0.2) / bar.offsetHeight }, { scaleY: 1, duration: 0.7 }, 0)
      .set({}, {}, 1);                                    // the card holds, fully formed, to the end of the pin

    // Hand-off: the title card dissolves while About rises over it. Fading it inside the pin instead
    // leaves a whole screen of empty ink between the two shots.
    gsap.to('.hero-inner', {
      opacity: 0, scale: 0.94, ease: 'none',
      scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'top 35%', scrub: cfg.scrub }
    });

    SplitText.create('.title-card', {
      type: 'words,chars', wordsClass: 'word', charsClass: 'char',
      tag: 'span',
      aria: 'auto',
      autoSplit: true,
      onSplit(split) {
        const from = {
          xPercent: (i, el, all) => (i - (all.length - 1) / 2) * (window.innerWidth < 640 ? 7 : 18), // spread out from the middle letter; less on phones so the end letters are not clipped
          yPercent: (i) => (i % 2 ? 20 : -20),                          // odd letters start low, even letters high
          opacity: 0.55,                                                // the name stays readable before the first scroll
          stagger: { amount: 0.3, from: 'center' }, duration: 0.4, ease: 'power2.out'
        };
        if (!cfg.touch) from.filter = 'blur(3px)';
        // start: 0, not 'top top': #home is pinned by the timeline above, and a trigger that is pinned measures from the end of its pin.
        return gsap.timeline({ scrollTrigger: { trigger: '#home', start: 0, end, scrub: cfg.scrub } })
          .from(split.chars, from, 0)
          .set({}, {}, 1);                                // pads the timeline to 1 so letters settle at 70% of the pin
      }
    });
  }
})();
