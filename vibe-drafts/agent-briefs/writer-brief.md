# Shared brief for vibe skill writers (repo: <repo root>)

You are writing ONE vibe skill (a SKILL.md) for a beginner portfolio workshop. Students' AI agents read this skill to restyle a one-page plain HTML/CSS/JS portfolio. Quality bar is high: distinctive, authentic, working snippets.

## Read first, fully
1. <repo root>/HANDOFF-vibes-v2.md: sections 3 (locked decisions: 3.2, 3.3, 3.4, 3.5, 3.7, 3.8 especially) and 5 (bugs found in cold-build tests; your skill must not repeat any of them). These rules are binding.
2. <repo root>/.agents/skills/vibe-terminal/SKILL.md: THE template. Copy its structure, section order, tone, snippet quality and comment density exactly.
3. <repo root>/.agents/skills/vibe-cad-workspace/SKILL.md and <repo root>/.agents/skills/vibe-kinetic-type/SKILL.md: the other two finished v2 pilots, for how a major vibe and an expressive vibe differ from the template.
4. <repo root>/vibe-drafts/reference-skills/frontend-design/SKILL.md: design ideas. Apply in your own words; never copy its text.
5. <repo root>/AGENTS.md and <repo root>/.agents/skills/portfolio-structure/SKILL.md: the rules the student's agent follows.

## Hard requirements
- Frontmatter exactly per handoff 3.7 (name, description, metadata.family/tags/intensity/version "2").
- Sections in the order of 3.7, ending with "## Who wins" and the exact sentence: "The student's requests override this skill. The content rules in AGENTS.md always apply."
- About 170-250 lines.
- 5 motion moments (page load, scroll, hover/focus, navigation, signature), each with working, self-consistent snippets (HTML example + CSS + JS where needed). Snippets must agree with each other: same class names, same ids, same custom properties.
- Every guardrail in 3.4. Every lesson in section 5 (IntersectionObserver "already scrolled past" + bottom-of-page check, opacity not visibility + focusin reveal, selector specificity notes, computed contrast for every text/background pair you suggest including accent-on-surface, neutral placeholder text like "The one-line intro from SPEC.md." instead of invented facts, "a link only if SPEC.md has one", body padding for fixed bars, mask padding, rAF read-then-write and stop when settled, 320px nav handling, @supports (animation-timeline: view()) with fallback when you use it, overflow-x: clip for sideways motion, reduced-motion block, no sideways scroll at 320px).
- Do not define a --space-* scale (handoff item 11: that goes to AGENTS.md later). If you reference spacing, say "your spacing scale" or use plain values sparingly; never reference an undefined var.
- Content honesty (3.5): no fake numbers, telemetry, hashes, part numbers, URLs. Decorative labels are aria-hidden and mirror real section names.
- No libraries unless your vibe brief below allows one.
- Palette: compute WCAG contrast ratios for every text colour on every background it sits on (bg, surface, accent fills) and state the key ones in a CSS comment. Body text >= 4.5:1. Use a quick node script to compute; do not eyeball.
- Avoid list must include the generic-page tells from 3.8 that apply.
- Unique per vibe: your signature move, easing profile, tempo and palette family must not match any other vibe in the table below.

## Taken (do not reuse)
| Vibe | Palette family | Fonts | Easing / tempo | Signature |
|---|---|---|---|---|
| Terminal | near-black + green | JetBrains Mono | steps() only, instant; prints line by line | typed whoami + block cursor |
| CAD Workspace | cool greys + blue select | Barlow / Barlow Semi Condensed / JetBrains Mono | cubic-bezier(0.65,0,0.35,1), 450-700ms, one axis | exploded view + view cube |
| Kinetic Type | lavender-grey + electric blue | Anybody (variable) | cubic-bezier(0.16,1,0.3,1) + lerp | cursor swells the name |
| Oscilloscope | blue-black + cyan/yellow channels | Chakra Petch / Instrument Sans | linear sweeps, steps(1,end) jitter, cubic-bezier(0.2,0.6,0.1,1) decay | canvas waveform, trigger lock-on |
| Git Graph | cool light grey + blue/rose/green lanes | Hanken Grotesk / Fira Code | cubic-bezier(0.32,0.72,0,1) 120-220ms, scroll-linked linear | branches draw on scroll and merge |
| Pitch Deck | cool paper + claret, wine slide | Archivo / Instrument Sans | cubic-bezier(0.6,0.02,0.1,1) 350-550ms | real metrics count up, deck progress bar |
| Soft Pastel | blush-white + pastels, teal accent | Fredoka / DM Sans | linear() spring with overshoot 450-800ms | morphing blobs, cards squash |
| Brutalist | white/black + hazard yellow | Archivo Black / Work Sans | steps(1), zero easing, slams whole blocks | pausable marquee, instant invert |
| Notebook | warm paper + blue-black ink, red pen lines only, butter/mint/sky notes | Kalam / Karla | cubic-bezier(0.45,0.08,0.25,0.98) pen + cubic-bezier(0.5,0,0.85,0.45) gravity, no overshoot, 250-900ms | pen underlines draw once, sticky notes drop and settle |
| Topographic | stone-grey paper + taupe contours, lake-blue accent | Spectral / Albert Sans | cubic-bezier(0.37,0.02,0.2,1), 1.2-2.6s draws, 240-420ms UI, lerp drift | generated contour field blooms from the summit, drifts with cursor |
| Blueprint (v1, later) | blueprint blue | IBM Plex pair | - | - |
| PCB, Research Paper, Pixel, Editorial, Glitch | siblings in progress, see your brief | | | |

Siblings are being written in parallel. Stay clearly inside your own lane as described in your vibe brief.

## Lessons from round 1 cold builds (every one of these happened; do not repeat them)
1. **Short sections near the end break nav highlighting.** After a jump (nav click, hashchange, or keyboard shortcut), keep the jumped-to section selected until the visitor scrolls on their own (wheel, touchmove, scroll keys) or that section leaves the screen. Otherwise the middle-band spy or the bottom-of-page rule selects the section after it.
2. **Reduced motion must undo hidden starting states, not just stop animations.** If anything starts hidden by a non-animation property (stroke-dashoffset, clip-path, opacity on a class, transform offset), the reduced-motion block must set it back to visible.
3. **Builders invent missing layout.** Include: a base `body` rule (margin, background, colour, font, line height), a margin reset if your snippets assume one, the page/section container width and padding, a header HTML example with its classes, and footer guidance (usually: omit it, or a plain "Back to top" link only; no year, no slogan).
4. **Single-weight display fonts** (Archivo Black, Press Start 2P, Anton, etc.) need `font-weight: 400` on headings or the browser fakes bold.
5. **Focus rings must stay visible** against neighbouring fills and must not be clipped by the screen edge (draw them inside edge-touching cells).
6. **A real email must fit on one line at 320px** in the contact block; give a small enough minimum size and padding.
7. **Only things with a real link react like links.** Cards/panels without a link do not lift, glow or change cursor.
8. **The hero intro**: say "the one-line intro from SPEC.md; if SPEC.md has no separate tagline, use the 'Who I am' line without the name". Never write a new sentence.
9. **Link text for a bare URL**: use the label SPEC.md gives next to it (for example "GitHub") with the student's name if needed; never invent other wording.
10. **Keyframes used by several moments** go in a shared block at the top of Motion character, not inside one moment.
11. **Use function declarations** for helpers that are called before they appear in the file.

## Length
Aim for about 250-300 lines. Working snippets matter more than the old 170-250 target, but cut prose before code.

## Validate before you finish
- Extract your JS snippets into one file in your scratch dir (<your scratch folder>/<slug>/) and run `node --check` on it. Optionally assemble a tiny test page there and load it with Playwright (require('playwright') works; chromium.launch() needs no options) to make sure the snippets run without console errors. Do NOT build the gallery sample site; a separate fresh agent will cold-build it from your skill.
- Re-read your file against handoff section 5 line by line.

## Files you may write
- <repo root>/.agents/skills/vibe-<slug>/SKILL.md (create or overwrite)
- <repo root>/vibe-drafts/<slug>/SPEC.md (only as your vibe brief says)
- anything under your scratch dir
Touch nothing else. Do not run git commands that change anything (no add/commit/push/checkout).

## Report back (short)
- File paths written and line count.
- Palette with the contrast ratios you computed.
- Easing/tempo and signature in one line each.
- Anything in the handoff rules you found ambiguous and how you resolved it.
