# Neo Voyage Plan, Part Two — the host (SEED)

Status: sketch from the harness-planning session. To be specced
properly by a planning agent after Part One commits. Nothing here is
scheduled; it is direction, not tasks.

Entry condition: Part One (harness) playtested and COMMITTED. The
commit is safe because Neo is self-contained and additive-only.

## Goal

Rebuild the reference-core API surface on the Neo runtime with the
Rust engine below: authors write the same calls, fragment evaluation
plus atomic/typegen produce the stylesheet, types, and runtime maps,
publish writes the generated folder. Same product, none of the
Panda-wrapping machinery.

## Sources to mine

- reference-core: the API surface to recreate (`css()`, recipes, …),
  the fragment runner/system (copy the implementation — never import
  it), examples of how the API behaves.
- reference-lib: examples of how the reference API actually works
  from a consumer's side.
- reference-rs/modules/map.html: the system map — atomic emits the
  stylesheet, typegen emits the types, Neo is the runtime above the
  cut.

Mine, don't import: read reference-core and reference-lib freely,
but Neo never imports from them — the boundary is absolute (and the
gate enforces it: imports from core/lib paths fail). Solved
implementations may be copied near-verbatim into Neo-owned modules —
fragments is the prime case — and their unit tests come along so
behavior stays proven.

## Keep

- The fragment system from core, as its own self-contained module,
  hooked cleanly into the base system. Probably the first host task:
  set up fragments.
- The generated folder, unchanged on the surface: `.reference-ui/`
  beside `ui.config` (or wherever configured), with `styles.css`
  inside. It may drop `virtual/` and it will be the minimal version
  of today's shape — but the UX is the same principle, including the
  fiddly bits (node_modules symlinks and linking). There are a
  hundred reasons it's needed; it stays.

## Drop (Panda-workaround complexity that vanishes with vertical integration)

- Piscina thread workers (start serial; parallelize only on measured
  need).
- virtual-rs (a Panda workaround; Neo can be direct).
- Liquid templates for primitives (review; generate natively instead).
- Everything that exists only to coerce Panda output or orchestrate
  workers around a compile that is now a function call.

## Build order (planning agent validates)

Simplicity is the method: scaffold `src/` in planned steps with
oracle review on each; skip thread pools and workers unless measured
need ever appears (doubt it — Rust does the hard parts).

1. **Base API on plain HTML.** `css()`, recipes, pulling from the
   stylesheet. Style `div` and plain HTML first — no React, no
   primitives. First cases: does `css()` pick up styles properly,
   end to end in the browser.
2. **Primitives + types.** Generate natively (no liquid templates),
   with typegen output; watch how they behave.
3. **Edge cases.** Pseudo props, hover props, border radii — do they
   all resolve? Cases per feature family.
4. **Fragments + sync, proven by cases.** The fragment
   implementation is copied into a Neo-owned module (verbatim where
   it's solved — fragments are a solved problem), unit tests
   alongside. Cases prove fragments resolve and `ref sync`
   regenerates correctly, every run from a clean folder.
5. **Publish.** The generated folder, end to end.

## Reference artifacts (ground truth, verified paths)

- **Panda's generated stylesheet:**
  `packages/reference-lib/.reference-ui/styled/styles.css` (plus
  `global.css` beside it). This is the spec for what output looks
  like. Compare shape and feature parity — scripts plus agents
  welcome; line counts and formatting will differ, and ours is
  roughly half there. Parity of features is what matters, not
  identical language.
- **Panda's generated styled system:**
  `packages/reference-core/src/system/styled/` (gitignored, present
  in a built checkout: `styles.css`, `recipes/`, `patterns/`,
  `helpers.d.ts`, …). Mine it for how the type surface is
  structured and what the typegen shapes must cover.

## The sync module

`ref sync` is a module, not a script: `src/sync/`. It handles pretty
much everything, like the grand vision in reference-core. Every test
case runs it fresh — clean the stale `.reference-ui/` first, run
sync, then let Playwright at the result. That loop (case → sync →
generated folder → browser) is how the atomic generator gets
exercised from day one.

## Overnight scope

Core API plus the `.reference-ui/` folder structure, then
primitives. Explicitly not tonight: MCP, tasty, or anything beyond
the minimal surface. The night ends when `css()` cases pass against
a freshly synced folder.

## Open questions for the planning agent

- Smallest step order that keeps every step green?
- Generated folder name and placement rules?
- What (if anything) of core's config surface survives?
- tsc/tsgo story for the host's own typecheck?
