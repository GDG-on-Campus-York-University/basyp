// Terminal vibe interactions. The page content is complete without this file.

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Boot sequence: any key or tap finishes it instantly.
  const boot = document.querySelector('.boot');
  if (boot) {
    const finish = () => boot.classList.add('is-done');
    window.addEventListener('keydown', finish, { once: true });
    window.addEventListener('pointerdown', finish, { once: true });
  }

  // 2. Scroll: sections print one after another, once.
  // Nothing is hidden unless this code runs, and everything is revealed
  // if the observer is missing, motion is reduced, the user presses Tab,
  // or the page is scrolled to the very bottom.
  const sections = document.querySelectorAll('main section:not(.boot)');
  const canPrint = 'IntersectionObserver' in window && !reduceMotion;
  let printer = null;

  const printAll = () => {
    sections.forEach((section) => section.classList.add('is-printed'));
    if (printer) printer.disconnect();
  };

  if (canPrint) {
    printer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-printed');
          printer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -15% 0px' });

    sections.forEach((section) => {
      section.classList.add('will-print');
      printer.observe(section);
    });

    // Hidden text cannot be focused, so keyboard users get everything on first Tab.
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') printAll();
    });
  }

  // 3. Navigation: the prompt path follows the section on screen.
  const pathDir = document.querySelector('.path-dir');
  const allSections = document.querySelectorAll('main section[id]');
  const lastId = allSections.length ? allSections[allSections.length - 1].id : 'home';
  let spyId = 'home';
  let atEnd = false;

  const renderPath = () => {
    if (!pathDir) return;
    const id = atEnd ? lastId : spyId;
    pathDir.textContent = id === 'home' ? '' : '/' + id;
  };

  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && window.scrollY >= 8) {
          spyId = entry.target.id;
          renderPath();
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    allSections.forEach((section) => spy.observe(section));
  }

  // A short last section may never reach the middle of the screen,
  // so at the very bottom of the page we treat it as the section on screen.
  const checkEnd = () => {
    atEnd = window.scrollY > 0 &&
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (window.scrollY < 8) spyId = 'home'; // a short hero leaves the middle band in the next section
    const cannotScroll = document.documentElement.scrollHeight <= window.innerHeight + 2;
    if ((atEnd || cannotScroll) && canPrint) printAll();
    renderPath();
  };
  window.addEventListener('scroll', checkEnd, { passive: true });
  window.addEventListener('resize', checkEnd);
  checkEnd();
})();
