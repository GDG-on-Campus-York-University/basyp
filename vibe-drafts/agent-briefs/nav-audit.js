const { chromium } = require('playwright');
const slugs = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  for (const slug of slugs) for (const w of [1280, 320]) {
    const p0 = await b.newPage({ viewport: { width: w, height: 800 } });
    await p0.goto(`http://localhost:5181/${slug}/public/`);
    const ids = await p0.evaluate(() => [...new Set([...document.querySelectorAll('header a[href^="#"], nav a[href^="#"]')].map(a => a.hash).filter(h => h.length > 1 && document.querySelector(h)?.matches('section')))]);
    await p0.close();
    const bad = [];
    for (const id of ids) {
      const p = await b.newPage({ viewport: { width: w, height: 800 } });
      await p.goto(`http://localhost:5181/${slug}/public/`); await p.waitForTimeout(400); await p.mouse.move(w - 5, 795);
      const link = p.locator(`nav a[href="${id}"], header a[href="${id}"]`).first();
      await link.click(); await p.waitForTimeout(1600);
      const cur = await p.evaluate(() => [...new Set([...document.querySelectorAll('header [aria-current], nav [aria-current]')].map(a => a.hash || a.getAttribute('href')))]);
      if (!cur.includes(id)) bad.push(`${id}->${cur.join(',') || 'none'}`);
      await p.close();
    }
    console.log(slug.padEnd(14), w, ids.length + ' links', bad.length ? 'WRONG: ' + bad.join(' ') : 'ok');
  }
  await b.close();
})();
