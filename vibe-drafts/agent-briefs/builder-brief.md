# Cold-build test brief (repo: <repo root>)

You are playing the role of a student's AI coding agent at a beginner workshop. Your job is to build the student's one-page portfolio site using ONLY the instructions a student's agent would have, and then report honestly where those instructions were unclear, wrong or buggy. Your build becomes a gallery sample, so make it good, but the report is just as important.

## You may read ONLY these files
1. <repo root>/AGENTS.md (project rules)
2. <repo root>/.agents/skills/portfolio-structure/SKILL.md
3. <repo root>/.agents/skills/vibe-<slug>/SKILL.md (the vibe the student picked)
4. <repo root>/vibe-drafts/<slug>/SPEC.md (the student's spec; it is a gallery sample and IS the content source for this build)

Do not open any other file in the repo: no other skills, no handoff notes, no other drafts or samples. The point is to test whether these four files are enough.

## Adjustments for this test
- Write the site to <repo root>/vibe-drafts/<slug>/public/ (index.html, styles.css, script.js, and assets/ only if needed) instead of <repo root>/public/. Treat that folder as the site root.
- There is no student in the chat. Skip the teaching explanations, commit reminders and questions AGENTS.md asks for; make the reasonable choice yourself and note it in the report.
- Do not run any git command that changes anything. Do not deploy. Do not install npm packages.
- Fonts from Google Fonts are fine. Libraries only if the vibe skill explicitly allows one.

## Verify your build (required)
Serve it with: `node <repo root>/vibe-drafts/serve.mjs` (background; port 5181; your site is at http://localhost:5181/<slug>/public/). If the port is already in use, another tester's server is already running; just use it.
Use Playwright from a script in <your scratch folder>/<slug>-build/ (require('playwright') works; chromium.launch() needs no options; do not install Playwright):
- widths 320 and 1280: no horizontal scroll (document.documentElement.scrollWidth <= innerWidth), no console errors, full-page screenshots after scrolling to the bottom and back (so reveals fire), saved in that scratch dir.
- reduced motion (`reducedMotion: 'reduce'` context option): everything visible.
- JavaScript disabled (`javaScriptEnabled: false`): all content visible.
- Tab through the page: every link reachable and visibly focused, nothing hidden while focused.
- Compute contrast of the main text/background pairs you actually used.
- Click every nav link (and any keyboard shortcut the skill defines) and check the right section is marked current, at 320 and 1280.
- Move the mouse to a corner before screenshots (the pointer at 0,0 triggers hover). Full-page shots put fixed bars mid-page; also take viewport-sized shots of each section.
Look at your screenshots yourself and fix what looks broken or generic. Fix your own bugs before reporting.

## Report back
1. One paragraph on how the site looks and moves (what the signature does).
2. Verification results (each check above, pass/fail).
3. SKILL FEEDBACK, the main deliverable: a numbered list of every place the vibe skill (or AGENTS.md / portfolio-structure) was unclear, contradictory, buggy, or where its snippet did not work as written, with the skill's line numbers and what you had to change. Include snippets you had to fix and why. Say "none" only if truly none.
4. Screenshot paths.
