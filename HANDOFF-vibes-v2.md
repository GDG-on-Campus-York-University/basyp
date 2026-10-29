# Handoff: vibe skills v2 for Build & Ship

Written 2026-10-29 for the next agent picking this up. Read all of it before touching anything.

- **Repo:** https://github.com/GDG-on-Campus-York-University/basyp (public). Branch `vibes-v2`, cut from `main` at `660271f`.
- **Event:** Build & Ship, **Thursday 2026-10-30, 5–9 PM**. Beginner students build a one-page portfolio with an AI coding agent, deploy it, then restyle it with a "vibe" skill. Anything that must be live for the night has a hard deadline of the afternoon of Oct 30.
- **Owner:** the club's tech lead (the person who handed you this). Skills owner: Sahand. Vibe Studio and gallery owner: Omid. Live demos during the night: Nhi.

---

## 1. The goal

The 8 current vibe skills are thin, and their gallery samples look basic: no motion, generic layouts. The goal is a catalog of **30 sophisticated, distinctive vibe skills**. Each has its own authentic look and its own motion character, matched to the taste of the students who would pick it, with a strong lean toward engineering and CS majors. Quote from the owner: *"these skills must absolutely still keep a distinctive authenticity, absolute necessity."* No two vibes may feel like clones with different colours.

Alongside the skills:
- an event-night `AGENTS.md`
- an install route that works on Mac and Windows
- an updated Vibe Studio and gallery
- updated deck slides

## 2. Status at handoff

| Item | State |
|---|---|
| Catalog, template, guardrails | **Locked** (section 3) |
| `vibe-terminal` v2 (reference template) | Written, cold-build tested, fixed |
| `vibe-cad-workspace` v2 (major) | Written, cold-build tested, fixed |
| `vibe-kinetic-type` v2 (expressive) | Written, cold-build tested, fixed, palette reworked |
| 3 sample sites | Built in `vibe-drafts/<vibe>/public/`, checked at 320px and desktop |
| The other 27 skills | **Not started.** They were waiting on the owner's review of the 3 pilots, which hadn't been given explicitly when this was written. Ask, or go ahead if the owner says so. |
| Event AGENTS.md | Not started (checklist in section 6) |
| portfolio-structure update (stop banning libraries) | Not started |
| Vibe Studio, gallery, deck | Not started |
| Old v1 skills (blueprint, brutalist, editorial, notebook, pixel, soft-pastel, y2k-web) | Still v1, to be overhauled |
| Commits | Pilot skills, drafts and this doc are committed on `vibes-v2` and pushed. No PR yet. Nothing merged to `main`. |

## 3. Locked decisions (don't re-open these)

### 3.1 Majors are tags, not gates
Every vibe is open to everyone. Tags go in the frontmatter (`metadata.tags`, as a string) and drive a "find your major" filter in the gallery and Studio.

Tag vocabulary: `cs, software-eng, computer-eng, electrical, mechanical, civil, space-eng, geomatics, data-sci, science, business, design-art` (plus `digital-media`, `engineering` where useful).

### 3.2 Skills describe, they don't dictate
- **Must keep:** 3–5 lines of identity.
- **Starting defaults (change freely):** the palette in words plus suggested hex values, and 2–3 Google Font options.
- No spacing or radius numbers.
- Every skill ends with: "The student's requests override this skill. The content rules in AGENTS.md always apply."

### 3.3 Motion in every skill, authentic per vibe
There is **no shared animation kit**. Each skill defines its own motion character (tempo, easing, what moves, what never moves) and covers **5 moments with working snippets**:
1. page load
2. scroll
3. hover/focus
4. navigation
5. one signature move

Audience taste sets the character:

| Audience | Motion character |
|---|---|
| CS | Snappy, keyboard-feel |
| Electrical/computer eng | Signals and current |
| Mechanical/civil | Weighty and precise, no bounce |
| Science | Restrained |
| Business | Confident, numbers-led |
| Art/design | Fluid |

**Review matrix:** before finishing, check that no two skills share a signature move or an easing profile.

### 3.4 Guardrails for every skill
- `prefers-reduced-motion` turns movement off and shows everything.
- Motion never delays content. Content is in the HTML and visible without JavaScript; hiding classes are added by JS only.
- Nothing flashes more than 3 times a second. Anything blinking longer than 5 seconds must stop on its own or be stoppable.
- No scroll-jacking.
- Animate only `transform`, `opacity`, `clip-path`, `filter` (and `font-variation-settings` for type vibes).

### 3.5 Content honesty (major vibes especially)
A field's look is decoration only. All text and numbers come from the student's `SPEC.md`: no fake telemetry, measurements, part numbers, commit hashes or URLs. A dimension line carries a real SPEC label or no label at all. If SPEC has no project link, there is no link.

### 3.6 Catalog: 30 vibes

**22 normal: 10 generic and 12 major.**

| Vibe | Family | Tags | Motion character / signature |
|---|---|---|---|
| Editorial | generic | | Slow, literary; headline lines reveal as if typeset; images settle from a slight zoom |
| Swiss Minimal | generic | | Grid-snapped; elements slide exactly one column; section numbers count in |
| Bento | generic | | Springy tile stagger; a tile expands into detail with a View Transition |
| Soft Pastel | generic | | Soft spring overshoot; blobs morph; cards squash on press |
| Notebook | generic | | Hand-drawn underlines draw once; sticky notes drop and settle |
| **Terminal** ✅ | generic | cs, software-eng, computer-eng | Instant, `steps()` only; typed `whoami`; block cursor; sections print |
| Blueprint | generic | | Linear pen-plotter line draws; dimension lines extend |
| Brutalist | generic | | Hard cuts, zero easing; instant invert; jumps; marquee |
| Y2K Web | generic | | Gloss sweep; bevel press; pausable marquee |
| Pixel | generic | | Stepped 8–12 fps; ▶ menu cursor; screen-wipe transitions |
| IDE | major | cs | 120–180 ms; tabs switch with View Transitions; Ctrl+K palette |
| Git Graph | major | cs | Branches draw on scroll; commits pop; merges join |
| System Design | major | software-eng | Packets travel along arrows; hover lights a request path |
| PCB | major | computer-eng | Current pulses along traces; pins light up |
| Oscilloscope | major | electrical | Canvas waveform; sections "lock on" like a trigger; cyan and yellow channels |
| **CAD Workspace** ✅ | major | mechanical | Rigid, even easing, one axis at a time; exploded view on scroll; view cube turns per section |
| Site Plan | major | civil | Heavy 600–800 ms, settles without overshoot; section-cut wipes |
| Mission Control | major | space-eng | Orbit paths trace; panels ramp up; text scrambles into the real text |
| Topographic | major | geomatics, science | Contours draw outward; map shifts with cursor |
| Data Notebook | major | data-sci | Cells go `[ ]`→`[*]`→`[1]`; output fades in |
| Research Paper | major | science | Calmest; citation popovers; figures reveal |
| Pitch Deck | major | business | Slide-like section transitions; real metrics count up; progress bar |

Each major vibe gets its own sample student `SPEC.md`, in that major.

**5 expressive.** More motion, still buildable by a beginner's agent in about 30 minutes. Plain JS by default; may use **one pinned CDN library** (for example GSAP) only if the skill names it.
- **Kinetic Type** ✅
- Cinematic
- Glitch
- Studio Gallery
- Depth

**3 frontier.** Take-home only. Any library, build step allowed, long and detailed, aimed at the strongest models. Install-only in Studio.
- Shader World: Three.js and GLSL.
- Scroll Film: GSAP ScrollTrigger, Lenis and SplitText.
- 3D Room: Three.js, camera rails and CC0 models.

### 3.7 Skill file template
Copy `.agents/skills/vibe-terminal/SKILL.md` exactly for structure, tone and snippet quality.

Frontmatter:
```yaml
---
name: vibe-<slug>
description: Restyles the portfolio site as … (look, layout and motion). Use ONLY when the student names the vibe-<slug> skill or asks for the <Name> vibe. Changes how the site looks and moves, never what it says.
metadata:
  family: generic | major | expressive | frontier
  tags: "cs, software-eng"
  intensity: standard | expressive | frontier
  version: "2"
---
```

Sections, in order:
1. Feel and who it's for
2. Must keep
3. Starting defaults (change freely)
4. Layout ideas
5. Make it theirs
6. Motion character, with 1–5 as sub-headings
7. Reduced motion
8. Libraries
9. Avoid
10. Who wins

Length: about 170–250 lines; frontier can be longer.

### 3.8 Design inspiration taken from Anthropic's `frontend-design` skill
Apply it in our own words; don't copy its text.
- **Spend boldness in one place.** The signature is the one loud moment; the other four moments stay small.
- **Ground details in the student's SPEC:** their materials, tools and project names.
- **Every device carries meaning.** Numbers only for real sequences or item numbers. All-caps labels only where the field really uses them.
- **Type:** a clear type scale; body lines under 80 characters.
- **Each skill's Avoid list includes the generic-page tells that apply to it:**
  - "→" after every link
  - "A · B · C" meta strings
  - 01 / 02 / 03 on things that aren't a sequence
  - one headline word picked out in the accent
  - an ALL-CAPS eyebrow above every heading
  - the same rounded card and soft shadow everywhere
  - a fade-up on every section
- **Default palettes must not land on known AI clichés,** unless the vibe *is* that look (Terminal is allowed):
  - cream with a terracotta or vermilion accent
  - near-black with an acid-green accent
  - Inter on everything

### 3.9 Event AGENTS.md (locked spec, not written yet)
- **Merge it into the starter repo's existing `AGENTS.md`;** don't add a second file. Also serve it from the event page.
- **Agent-neutral.** Do NOT mention Antigravity or any IDE by name; students may use other tools.
- **Phases of the night:** setup check → SPEC → version 1 → Git → deploy → vibe → build hour → demos.
- **A "where am I?" check:** the agent inspects the repo (SPEC filled? git set up? deployed?) and suggests the next step.
- **Hard stops:** installing, deleting, rewriting history, deploying, secrets.
- The list of skills.
- **When to raise a hand.** Don't name specific helpers.
- **Library gate:**
  - If a prompt would lead to installing a library, the agent stops.
  - It names the library and lists the risks: deploy breakage, phone speed, third-party code, helpers may not know it, time.
  - It offers a no-library version.
  - It continues only after an explicit "yes, install X".
  - Pinned CDN libraries named in an official vibe skill are pre-approved. `npm install`, frameworks and build tools are always gated.
- **Setup slide:** a generic tip to set the agent to ask before running terminal commands.
- **Update the rules that currently ban all libraries:** `AGENTS.md` section 2 and `.agents/skills/portfolio-structure/SKILL.md`.

### 3.10 Install route
- All vibes ship in the starter repo's `.agents/skills/`. Nothing to install; `git pull` updates them.
- **Vibe Studio button becomes "Copy install prompt".** The prompt tells the agent to put the skill wherever it loads skills from (default `.agents/skills/<name>/SKILL.md`).
- **CLI:** `npx skills add GDG-on-Campus-York-University/basyp` (Vercel's skills CLI). **Still to verify** that it supports the agents students use.
- One known global path: Antigravity loads global skills from `~/.gemini/antigravity/skills/`. That fact is for docs and Studio, not for AGENTS.md.

## 4. Where things are

### In this branch
- `.agents/skills/vibe-terminal/SKILL.md`: the reference template.
- `.agents/skills/vibe-cad-workspace/SKILL.md`
- `.agents/skills/vibe-kinetic-type/SKILL.md`
- `vibe-drafts/<vibe>/SPEC.md`: fictional sample students. Each SPEC says it is a gallery sample and may be used as content for that sample only.
- `vibe-drafts/<vibe>/public/`: the sample sites (index.html, styles.css, script.js).
- `vibe-drafts/serve.mjs`: a tiny static server. Run `node vibe-drafts/serve.mjs`, then open `http://localhost:5181/terminal/public/` and so on.
- `AGENTS.md` and `.agents/skills/portfolio-structure/SKILL.md`: current starter rules (still v1).
- Other skills (keep as they are): `explain-as-you-go`, `firebase-ship`, `git-coach`.

`vibe-drafts/` is working material. It doesn't belong in the starter repo's `main`. Before opening the PR, move the samples to the website repo's gallery and delete the folder from this branch.

### Elsewhere
- **Website repo** (private, org `GDG-on-Campus-York-University/GDG-York`). Studio and gallery work goes on branch **`Omidsupdate`** only.
  - `public/vibe-studio/vibes.js`: the 8 vibes as fixed fields. Rework it into 30 vibes, a tag filter, knobs as override text appended to the skill, and frontier vibes as install-only.
  - `public/vibe-studio/config.js`: has a placeholder event code, `BUILDSHIP`.
  - `public/gallery/<vibe>/`: the current 8 sample sites (no keyframes, basic). Replace them with the new samples.
  - `src/constants/events.js`: gallery cards (and `showEarly: false`).
- **Deck:** Claude Slides artifact "Build & Ship: Your First Real Project", 59 slides, private to the owner. The vibes slide still says 8 vibes and shows illustrative mock-ups; update it to 30, "find your major", and the install route. Ask the owner for access, or for them to make the edit.
- **Same machine only:** if you're on the owner's PC, the working copy is `C:\dev\GDG York\.basyp-vibes` and the drafts are also at `C:\dev\GDG York\vibe-drafts`. The parent folder has its own rules file (`CLAUDE.local.md`) and dated handoff notes; read them.

## 5. What the cold-build tests taught us (check every new skill for these)

**How we test a skill:** a fresh agent gets only `AGENTS.md`, `portfolio-structure`, the one vibe skill and a sample `SPEC.md`, and builds the site with no other help. Then it reports where the skill was unclear or buggy. Every pilot test found real bugs. Do this for every new skill; the passing builds become the gallery samples.

Bugs found and fixed in the pilots:
1. **IntersectionObserver reveals never fire for a short last section** (`rootMargin: -15%` or the middle-band spy). Always add:
   - "reveal anything already scrolled past" (`boundingClientRect.top < 0`)
   - a check at the bottom of the page
2. **`visibility: hidden` for hidden-until-scrolled content** removes it from screen readers and from the Tab order. Use `opacity: 0`, plus a `focusin` listener that reveals the section.
3. **CSS specificity cancelling animations.** For example, `section:target h2 { animation }` lost to `.will-print.is-printed > *`. Write selectors that win, and say so in a comment.
4. **Contrast on tinted backgrounds.** A blue that passes on white fails on grey. Accent on surface fails. Muted text on an accent fill fails. Compute the ratios.
5. **Placeholder example text leaks** (for example "First-year" in a Mechanical example). Use a neutral placeholder such as "The one-line intro from SPEC.md."
6. **Assumed project links.** SPECs often have none. The skill must say "a link only if SPEC.md has one".
7. **Fixed UI covering content.** A bottom bar needs `body` padding equal to its height. A fixed corner widget needs a gutter, or it goes in a top bar on phones.
8. **Masks clip descenders when line-height is under 1.** Pad the masks (`--mask-pad: 0.18em`).
9. **Read all layout values, then write,** inside rAF loops; don't interleave them.
10. **Nav at 320px:** 5 links with 44px targets wrap. Say how to handle it.
11. **Undefined `--space-*` scale.** Every builder invented one. Fix this in AGENTS.md / portfolio-structure, not in each skill.
12. **The content rule needs a carve-out** for decorative, `aria-hidden` UI labels (cube faces, "Email" labels, command prompts).

Also check each new skill for:
- snippets self-consistent with their HTML examples
- `@supports (animation-timeline: view())` with a working fallback
- `overflow-x: clip` wherever things translate sideways
- rAF loops that stop when settled
- the reduced-motion block
- no sideways scroll at 320px

## 6. What's left, in order

1. **Get the owner's verdict on the 3 pilots.** Show the running samples. Adjust the template if they ask.
2. **Write the other 27 skills** to the template.
   - Batch them through subagents: one skill per subagent, brief mid-size models, each given `vibe-terminal` as the reference plus its locked motion character.
   - Then review each one yourself against section 5.
   - Overhaul the 7 v1 vibes (same slug, version "2").
   - Write a sample `SPEC.md` for each major and expressive vibe. Generic vibes can reuse the Terminal SPEC.
3. **Fill in the review matrix** across all 30: signature move, easing, tempo and palette family must be unique per vibe. Fix collisions.
4. **Event AGENTS.md** (spec in 3.9 and the learnings in section 5).
   - Include a short design pass for the agent: plan (palette, fonts, layout, the one memorable thing) → check it isn't generic → build → screenshot and self-critique → remove one accessory.
   - Define the `--space-*` scale.
   - Add the decorative-label carve-out and the CSS specificity warning.
   - Update the `portfolio-structure` library rule.
5. **Cold-build test runs** for all 30, and fix the skills. The good builds become the gallery samples.
6. **Vibe Studio and gallery** on `Omidsupdate`, in the website repo. Gallery opens with "find your major". Give Omid a heads-up first.
7. **Deck:** update the vibes slide, add the install route, and add the "ask before running terminal commands" setup tip.
8. **Heads-up to Sahand** (skills) and **Omid** (Studio and gallery). Ask the owner before sending anything.
9. **PR** from `vibes-v2` to `main`, only when the owner asks. Remove `vibe-drafts/` first.
10. **Verify `npx skills add`** against the agents students will use.

If time runs short before the event, prioritise:
- the overhauled 8 vibes
- the major vibes for CS, computer engineering, electrical and mechanical
- the AGENTS.md library gate and the phase guide

The frontier 3 can ship after the event.

## 7. Rules for whoever continues

- **No deploys** without an explicit go-ahead from the owner. **Don't touch or merge `main`** (either repo) without approval. **Never force-push.**
- **Website work goes to `Omidsupdate` only.** Skills and AGENTS.md go on `vibes-v2` here.
- **Commit only when asked.** Keep commits small and scoped. Commit trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **This repo is public.** Never commit secrets, tokens, applicant data, personal emails or account names.
- **Recruitment** on the website stays closed unless the owner says otherwise.
- **Don't mention the platform name** behind the event's registration link on the site.
- **Don't name unannounced club events.** Don't invent staff availability.
- **The owner pastes reviews from other models,** often NO-GO verdicts. Check each point against the code and fix what holds up; don't just agree.
- **UI feedback is blunt and visual** ("too AI", "too dense"). Make it simpler and more elegant, keep the Google colours on club pages, and show it running locally so the owner can check.

## 8. Other open threads (not part of this task, for awareness)

- **GCP credits for the event's agent.** A separate session found no club or member account with usable trial credits, apart from one account the owner ruled out. It changed nothing and is waiting on the owner. The deck's GCP-credits slide stays a placeholder until a live test passes.
- **Deck checks before presenting:**
  - The Git origin slide quote contains a swear word (the notes say how to cut it).
  - Deploy step 2 (`firebase use --add`) assumes `firebase.json` names no project. Tech should confirm.
- **Two live demos by Nhi** during the guided build (agent fixes an error; `git restore .` undoes a bad edit). No sign they were rehearsed.
- **Saved for later in Studio:** the vibe-mixing knob, the `showEarly` flag and the placeholder event code.
