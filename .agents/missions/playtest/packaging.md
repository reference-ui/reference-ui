# Playtest packaging-crew log

Status: **COMPLETE** (branch `reference-system`, no commits — captain commits)

Scope: build/packaging/CI + extractor/config. Component source dirs untouched.

Items: B-11, B-13, B-14, B-35, B-39, B-10 (+ W-04 note), W-31.

---

## B-10 root cause + HQ answer (FRONT AND CENTER)

**HQ question: why does `maxW="140r"` not compile when `120r`/`200r` do — is
the scale stepped where it should be continuous (arbitrary numerics)?**

**Answer: the scale is NOT stepped. It is an extraction-coverage coincidence,
not a scale.** Evidence (all verified this session against
`packages/reference-lib` at `reference-system`):

1. The shipped sheet (`.reference-ui/styled/styles.css`, published inside
   `dist/`) contains exactly one utility rule per static literal the `ref sync`
   extractor saw in `ui.config.ts` `include` globs (`src/**`, `book/**`).
   `max-w_120r` exists because `maxW="120r"` is a literal in
   `src/components/Tabs/Tabs.book.tsx` + `Tree.story.tsx`; `max-w_200r`
   exists because of a `200r` literal in `src/components/Menu/Menu.book.tsx`.
   `140r` appears **nowhere** in `src/` or `book/` (`grep -rn 140r` → zero
   hits) → no rule emitted → `css()` constructs the miss class, the
   `@layer utilities` probe finds nothing, the value paints nothing and warns
   (`css.ts` `reportStyleMisses`). Repro:
   `.agents/missions/playtest/b10-repro.mjs` (exit 1 = bug present).
2. The namer itself is continuous: any numeric `Nr` value constructs a class
   (`ci()`/`$r` handling in the runtime namer); nothing enumerates a spacing
   scale. The sheet is the only stepped artifact, and its steps are "whatever
   literals lib sources happened to use".
3. Consumer-only values can therefore NEVER compile into lib's sheet — the
   consumer does not run `ref sync`, and even the documented
   `extends: [baseSystem]` path emits a *consumer* sheet the dist CSS cannot
   see. `120r`/`200r` working in the settings app was luck (lib-internal
   literals); `140r` failing is the rule, not the exception.
4. The lib-INTERNAL misses in the report are almost all stale-artifact ghosts:
   current sync output already contains the Tooltip static shadow
   (`shadow_0_2px_8px_rgba(0,0,0,0.2)`), the Slider *conditional* shadow
   (`shadow_0_1px_3px_rgba(0,0,0,0.2)` — StyleTrace resolves static ternary
   branches), the Slider static transition, and the `tabsTab_*` recipe
   classes. Settings' own caveat (hand-copied `styles.css`, Sep 24 `dist`)
   explains their misses.

**Genuinely uncompilable, still live in `src` (NOT mine to fix — handoffs):**

- H-1 → component crews: `flex: "0 0 N%"` dynamic strings (split #12,
  Splitter drag tick) — infinite value space, can never extract; call sites
  must move to inline `style` or finite recipe variants. Per-value console
  spam is `reportStyleMisses` working as designed.
- H-2 → Tree crew: `Tree.tsx:321`
  `outlineColor: 'var(--colors-ui-focus-ring, {colors.ui.focus.ring})'` — a
  literal `{colors…}` template placeholder ships verbatim into the CSS fallback
  slot. Unresolvable at runtime; must be a real token/var.
- H-3 → compiler crews (neo/rs, DO NOT implement here): if HQ wants arbitrary
  consumer numerics (`140r`) to paint with zero consumer sync, that is a
  compiler feature (continuous-numeric rule generation or runtime fallback
  declarations), not a config fix. `staticCss` safelisting cannot cover an
  infinite value space. Minimal repro + this section are the handoff.
- W-04 (loud dev failure for uncompilable values) is the accepted mitigation
  for the `140r` silence; it is a `css()` runtime change (neo runtime),
  not packaging — flagged, not implemented.

**B-10 verdict: root-caused; no packaging-side code fix exists for the
consumer-value half (H-3); lib-internal static half already compiles at HEAD
sync. B-10 stays open as H-1/H-2/H-3 handoffs, not as packaging work.**

---

## B-35 — `dist` imports node `url` (Low)

Root cause (verified): `src/components/Reference/*` imports runtime values
from `@reference-ui/types` → tsup bundles the 372KB generated
`.reference-ui/types/types.mjs` (it is NOT in `tsup.config.ts` `external`) →
bundle carries `tasty/runtime.js` `resolveArtifactSpecifier`, whose fs-path
branch does `await import("url")` (`pathToFileURL`). Two occurrences in
`dist/index.mjs` (lines ~55372/~57245). Every consumer Vite build warns
"externalized for browser".

Fix (packaging-side, this crew): post-bundle patch in
`scripts/build-package.mjs` replacing the node-only branch with a descriptive
throw. The branch is dead in the packaged artifact (callers always pass
URL-like `manifestUrl`-derived specifiers; `isUrlLike` short-circuits first),
so browser/SSR behavior is unchanged and Node-fs-path callers get a clear
error instead of a cryptic import failure. W-31 gate asserts zero
node-builtin specifiers in `dist/*.mjs`.

Trade-off flagged for HQ: a hypothetical Node consumer passing raw fs paths
to the exported tasty-manifest helpers now gets an explicit error. No such
caller exists in-repo.

## B-14 — `react` hard dep breaks SSR/Node (Medium)

Fix: `react` moves `dependencies` → `peerDependencies` (range unchanged
`^19.2.4`) + added to `devDependencies` (same range) so the local loop still
resolves it. `react-dom` untouched (already dev-only). Lockfile updated via
`pnpm install`; diff expected to be the single moved entry.

## B-13 — No consumable stylesheet or primitive exports (High)

Fix:

- `exports` gains `"./styles.css"` →
  `./dist/runtime/reference-ui/react/styles.css` (byte-identical to the styled
  copy; verified with `cmp`) and `"./primitives"` →
  `./dist/runtime/reference-ui/react/react.mjs` (+ `react.d.mts` types).
  The runtime file already exports `Div/Span/Button/Label/css/recipe/...`
  and imports only bare `react` (peer) — verified in the minified bundle.
- `scripts/materialize-runtime.mjs`: added the missing bare-specifier rewrite
  `@reference-ui/styled` → `../styled/index.js` for the packaged
  `react.d.mts` (previously dangled: the table only covered subpaths, and the
  generated file references exactly the bare specifier twice). Without this,
  `./primitives` types fail to resolve in consumers.
- README: new Consumer setup section (install, CSS import, primitives import,
  no-alias note, `baseSystem`+sync pointer).

## B-39 — Unsplit bundle, no guidance (Low)

Fix: docs-side per the bug title ("guidance"). README gains a Bundle &
code-splitting section with measured numbers from this build, the
`sideEffects: false` tree-shaking contract, and the honest statement that
only the barrel entry ships (no per-component subpaths). No build splitting:
changing the entry graph is a breaking surface change for another mission.

## B-11 — Shipped `dist` behaviorally stale vs `src` (High, process)

`dist/` is git-ignored (verified: `git ls-files` empty) — staleness is a
local/pack-time hazard, not a committed-artifact hazard. Fix:

- New `scripts/check-dist-fresh.mjs` (+ `pnpm check:dist`): fails when any
  input (`src/**`, `ui.config.ts`, `tsup.config.ts`, build scripts,
  `package.json`) is newer than any required dist output, or when required
  outputs are missing. Message names the rebuild command.
- `prepack` already rebuilds (kept). W-31 gate runs build → check → pack →
  smoke, and behaviorally pins the six B-11 instances (Tree auto-detect,
  Collapsible/Accordion arrows, Splitter solver, textValue leak, Expander
  aria-hidden, Presence memo) so a stale `dist` fails the gate by behavior,
  not just by mtime.

## W-31 — CI consumer smoke test (process)

New gate `.github/workflows/consumer-smoke.yml` + runner
`packages/reference-lib/scripts/consumer-smoke/run.mjs` + bare-Vite template
`packages/reference-lib/scripts/consumer-smoke/template/`:

1. build → `check:dist` → `pnpm pack` the lib;
2. scaffold a bare Vite + React app in a temp dir, install the tarball;
3. `vite build` the app (fails on node-builtin/externalization warnings —
   B-35 regression);
4. serve + Playwright: mount every barrel component, run the six B-11
   behavioral assertions, assert ZERO console errors/warnings (B-03/B-35
   noise fails the gate).

Runs on every PR touching `packages/reference-lib/src`, the build, or the
gate itself.

---

## Verification

- `b10-repro.mjs`: proves the coverage model (120r/200r rules present, 140r
  absent, literals traced to book files). Fails loudly = bug reproduced.
- Build: `pnpm --dir packages/reference-lib run build` (tsup + tsc + package
  asserts incl. new B-35 patch assert).
- `pnpm --dir packages/reference-lib run check:dist` (fresh → pass).
- `node packages/reference-lib/scripts/consumer-smoke/run.mjs` (full gate
  locally; includes `vite build` warning scan + Playwright mount-all +
  B-11 assertions + zero-console-errors).
- Existing suites touching my files: none (no tests reference the packaging
  scripts); the gate itself is the new coverage. `Failed:` counts reported
  below at completion.

## Completion verdict (per-item fixed-or-blocked)

- **B-10 — ROOT-CAUSED, handoffs only.** No packaging-side fix exists for the
  consumer-value half (H-3 compiler feature). Lib-internal static half
  compiles at HEAD sync. Handoffs: H-1 (dynamic `flex` → component crews),
  H-2 (Tree `{colors}` template → tree crew), H-3 (continuous numerics →
  compiler crews, with repro). W-04 (loud dev failure) is a neo-runtime
  change, flagged not implemented.
- **B-11 — FIXED (process).** `check:dist` script + `pnpm check:dist` fail on
  stale `dist/`; W-31 gate runs build → check → pack → smoke and pins all six
  behavioral instances (all 11 B-11 probe checks PASS at HEAD).
- **B-13 — FIXED.** `./styles.css` + `./primitives` exports shipped and
  proven end-to-end (scaffold `vite build` + `tsc --noEmit` + runtime render
  of `Div/Span/Button/Label`); bare `@reference-ui/styled` type rewrite added
  (without it `./primitives` types dangle); README consumer-setup section.
- **B-14 — FIXED.** `react` is now a peer (`^19.2.4`, range unchanged) +
  devDep; lockfile diff is exactly that move (3/3 lines). The smoke scaffold
  owns the single React copy and SSR-shape `renderToString` risk from nested
  copies is gone.
- **B-35 — FIXED.** Post-bundle patch removes both `await import("url")`
  branches (verified 0 remaining) with a descriptive-throw replacement; the
  packaged bundle asserts zero node-builtin specifiers at pack time, and the
  consumer `vite build` warning scan passed with zero externalized warnings.
- **B-39 — FIXED (docs).** README Bundle & code-splitting section with
  measured numbers (index.mjs 3.8MB/480KB gz, CSS 261KB/33KB gz), the
  `sideEffects:false` tree-shaking contract, no-per-component-subpaths
  honesty. No entry splitting (breaking surface — HQ call).
- **W-31 — IMPLEMENTED, gate red ONLY on other crews' open bugs.** 41 PASS /
  5 FAIL: `mount-reference` + `no-mount-failures` + 1 unexpected console
  error = H-4 (Reference `React is not defined` from dist); 2 true-gap
  warnings = B-28 (Splitter `minSize`/`maxSize` leak); 9 race warnings = H-6
  (dev-mode probe race). b03 bucket armed, currently 0. All six B-11
  behaviors green at HEAD. Workflow `.github/workflows/consumer-smoke.yml`
  runs on PRs touching lib src/build/gate.

## New handoffs discovered while proving W-31 (all reproduced, all in-gate)

- **H-4 → neo/compiler crew (NEW, breaks Reference from dist).**
  `.reference-ui/types/types.mjs:1753` emits `var AtSignIcon =
  React.forwardRef(` — a BARE `React` global with no import in scope. Any
  consumer mounting `<Reference>` from `dist` crashes with `React is not
  defined` (gate: `mount-reference` FAIL + 1 unexpected console error).
  Generated-code bug; packaging must not mask it (no `inject` shim added).
- **H-5 → extractor crew (EVAPORATED during session — keep watching).**
  `gridTemplateColumns="repeat(3, 1fr)"` (Calendar month/year grids,
  `Calendar.tsx:1270/1548`) had zero sheet rules at first probe, then a
  later sync (parallel-tree movement) emitted the rule. Static literals DO
  extract when sync sees them; treat future absences as sync-race/coverage
  flakes, not scale steps.
- **H-6 → neo runtime crew (NEW, major B-10 insight).** The dev-mode miss
  probe (`reportMissCandidates` → `sheetsComplete`) only defers for external
  LINKED sheets; Vite-dev-injected `<style>` tags arrive AFTER first render,
  so early `css()` calls warn for values whose rules EXIST in the sheet (9
  warnings this run, all sheet-verified present, all from one early flush).
  This false-positive race likely explains much of B-10's "lib's own call
  sites miss compilation" — the values compile; the probe cries wolf in dev.
  Production (render-blocking `<link>`) is unaffected. The gate buckets these
  as `missRaceNoise` (fail when caught — consumers see the same spam).

## Verification (suites with Failed counts)

- `pnpm --dir packages/reference-lib run build`: tsup ✓, `tsc -p
  tsconfig.build.json` exit 2 with **4 pre-existing errors in other crews'
  files** (Accordion `process`, Menu `process`, NumberField `data-pressed`
  ×2) — tsc still emits; `build-package.mjs` asserts + B-35 patch (2
  branches) ✓. **Failed: 4 (all foreign).**
- `b10-repro.mjs`: exit 1 = bug reproduced as designed (120r/200r rules +
  literals traced, 140r absent). **Failed: 0 (of its own contract).**
- `check:dist`: OK on fresh dist (392 inputs); correctly FAILs on any newer
  src edit (observed repeatedly under parallel edits). **Failed: 0.**
- `consumer-smoke/run.mjs` full gate (pack → scaffold → tsc → vite build →
  dev probe): tsc ✓, vite build clean (zero externalized warnings) ✓,
  probe **41 PASS / 5 FAIL** — all 5 fail on H-4/B-28/H-6 (foreign).
  B-11 behavior checks: **11/11 PASS.** b03 bucket: 0.
- Existing repo suites covering the touched files: none (no test references
  the packaging scripts); the gate itself is the new coverage.

## Flags for HQ

1. B-10 consumer-numerics half (H-3) needs a compiler decision: support
   continuous numerics, or bless consumer-`sync` as the only path and let
   W-04 make the silence loud. Packaging cannot fix it.
2. B-35 patch trades a dead-in-practice Node fs-path branch for a clean
   browser bundle; explicit error if ever hit.
3. B-39: docs only, no entry splitting — say the word if the mission wants
   per-component subpaths (breaking surface).
4. `react` peer range kept at `^19.2.4` although the repo also exercises
   17/18 in CT/matrix aliases — widening the claimed range is a support
   statement I did not want to make unilaterally.
