# Neo Voyage Plan — Part Three: Parity (CAMPAIGN)

> Status: **ready to execute**. Written 2026-09-17 from nine read-only probes
> (see Appendix A). Parts One (harness) and Two (host) are landed and green:
> 10/10 cases in 3.8s, 123 unit tests, gate 0 errors. This part makes Neo
> functionally complete and proves it, family by family, in a browser.

---

## 0. Mission

`reference-neo` is the TypeScript host above the cut: fragments, sync,
runtime `css()`/`recipe()`, native primitives, and the generated folder that
consumers import. `reference-rs` (Atomic, base-system, typegen, styletrace) is
the engine below the cut. `reference-core` is the *reference point* only: it
is what works today, on Panda v1, and it is not edited in this voyage.

**The mission, one sentence:** every styling feature the Reference UI library
relies on today (as proven by `packages/reference-lib/.reference-ui/styled/`)
and every engine edge case Panda v1 tested for its own style engine that is in
Reference's dialect, is produced by Neo + Rust and **proven in a browser** by a
Neo case — while Neo stays as small and serial as it is now.

### 0.1 Three bars for "parity"

Parity is parity of *output capability and author API*, not of Panda's API
breadth, its file tree, or its bugs.

1. **Lib bar.** Every feature family inventoried in
   `docs/evidence/lib-sheet-styles-css.md` §3 and
   `docs/evidence/lib-sheet-global-css.md` §3 has at least one green Neo case,
   or a written **approved absence** in the group `SPEC.md` (§4.6).
2. **Corpus bar.** Every Panda v1 edge case mined into
   `docs/evidence/panda-v1-*.md` §3/§4 that is in Reference's dialect has a
   Neo case with a `[panda-v1]` evidence tag, or is listed in the group
   `SPEC.md` out-of-scope table with the reason.
3. **Claims bar.** Every Atomic claim with **no browser proof** listed in
   `docs/evidence/atomic-claims.md` §6 (P0, P1, P2) has a Neo case with an
   `[atm]` evidence tag. Goldens prove strings; Neo proves paint.

### 0.2 Non-negotiables (carried, not re-debated)

- **Boundary.** Neo never imports `@reference-ui/core` or `@reference-ui/lib`.
  Rust is reached only through `@reference-ui/rust/*`. The gate enforces this.
- **One Atomic.** No second stylesheet compiler, no TypeScript lowering that
  rewrites style objects into CSS, no namer, no hashed whole-object classes.
  If the engine lacks a behaviour, the slice goes to the RS lane (§5.3).
- **Frozen contracts.** `EvaluatedSystemSpec`, `NativeRuntimeArtifact`,
  `PortableBaseSystem`, `NativeCompileRequest`, `OutputInventory` in
  `packages/reference-rs/contracts/types.ts` are the wire. Neo conforms to them;
  it does not fork them.
- **Simplicity stays.** Serial `sync()`, no workers, no `virtual/`, no Liquid,
  one bundler (esbuild), React 19 only, headless Chromium only. No matrix, no
  Dagger in the inner loop.
- **Fail closed, say why.** A compile diagnostic fails `sync` with file and
  line. Unknown values never mint ghost classes. Neo never guesses hosts from
  PascalCase.
- **Gate discipline.** `pnpm agentneo q` stays at 0 errors after every merge;
  no suppressions, no `any`, headers of 2–6 sentences, READMEs describe
  architecture and never carry filename tables.
- **Snapshots are human-blessed.** Pixel baselines change only via
  `--update-snapshots --confirm` after a human has seen expected/actual/diff.
  Prefer computed-style assertions; use pixels only where rendering *is* the
  claim.

### 0.3 Definition of done (G6)

1. Groups in §8 each have `SPEC.md` + `TESTS.md`; every `TESTS.md` row is
   `done` or `approved-absence`; none is `blocked-on-rs` or `open`.
2. `pnpm agentneo run` is green across the whole catalog; `pnpm agentneo q`
   0 errors; package Vitest green.
3. `NEO-PARITY-*` (W4) green: the lib-shaped world syncs, paints, the family
   census passes, every consumer specifier resolves, no panda-isms in the
   generated folder.
4. The generated folder matches §4.1 exactly (expected present, forbidden
   absent), byte-deterministic across two syncs.
5. Every decision in §3 is recorded as taken in `docs/DOMAIN.md` (vocabulary)
   or in this file (§3 status column), and the code agrees with it.
6. The G6 switch-readiness report (§12) exists and is honest.

---

## 1. Authority and vocabulary

| Question | Authority |
| --- | --- |
| What Neo is and refuses | `packages/reference-neo/README.md` |
| Words, and their retired panda-isms | `packages/reference-neo/docs/DOMAIN.md` (update it when §3 decisions land) |
| Sequencing, roles, gates, catalog | **this file** |
| Wire contracts | `packages/reference-rs/contracts/types.ts` + `contracts/tests` |
| Engine behaviour (what Atomic claims) | `packages/reference-rs/modules/atomic/SPEC.md` + `tests/cases/ATM-*` |
| Engine campaign decisions (colour-mode attr, `@container`) | §3 D1 overridden by human to `data-color-mode` (RS-7 retargets engine, fixtures, goldens); D4, D8, D12 as restated; pinned by `contracts/fixtures`, goldens |
| Harness usage, flags, snapshot rules | `packages/reference-neo/docs/TESTING.md`, `.agents/skills/agent-neo/SKILL.md` |
| Per-group behaviour and case ledger | `tests/cases/<group>/SPEC.md` and `TESTS.md` (created in W1) |
| Evidence | `packages/reference-neo/docs/evidence/*.md` (Appendix A) |

When two disagree, the higher row wins; when this file and the code disagree,
fix one *in the same slice* and say which.

**Vocabulary used below** (add to `DOMAIN.md` at G0):

- **Group** — a folder under `tests/cases/` holding one feature family:
  `SPEC.md` (behaviour, decisions, approved absences), `TESTS.md` (case ledger),
  and leaf cases `NEO-<GROUP>-NN/`.
- **Slice** — the unit of work: one case (or a small bundle of cases in one
  group) taken from engine check → host integration → browser proof (§5).
- **Rung** — one of the three steps of a slice: `engine`, `host`, `proof`.
- **Station** — an Atomic case `ATM-*` (Vitest golden). Neo cases cite
  stations; they do not duplicate them.
- **Evidence tag** — `[lib]` (lib generated sheet), `[panda-v1]` (vendored
  corpus file + test title), `[atm]` (station id), `[core]` (core source),
  `[decision Dn]` (§3). Every case README carries at least one.
- **Status words** (TESTS.md, one per row): `open`, `in-progress`, `done`,
  `blocked-on-rs (ATM-xxx or RS-n)`, `approved-absence (reason)`,
  `retired (superseded by NEO-…)`.
- **Roles** — captain, scout, cartographer, line cook, RS liaison, oracle (§6).

---

## 2. Verified ground truth

Every statement here is backed by a report in `docs/evidence/`; cite it, do
not re-probe. Children start at `docs/evidence/README.md`.

**Neo today** (`evidence/neo-state-2026-09-17.md`). Steps 0–6 of
`docs/archive/PLAN-host-build.md` are landed: config → fragments → `compile()` →
publish `.reference-ui/{system,styled,react}`; runtime `css()`/`recipe()` over
plans; native primitives (101 tags, `data-layer`, `data-variant`,
`data-color-mode`). 53 source files / 3,942 LOC; 24 test files / 123 tests.
Cases: 10 across 7 groups (7 sync, 3 static, regrouped per D18); ~0.3–0.5s per case; sync is not the bottleneck.
`case.json` needs only `id`, `name`, optional `"sync": true`. Package `tsc`
runs once before any case; worlds typecheck against the stable
`src/primitives/generate/react-surface.d.ts` via `paths`, **not** against
generated declarations. Rough edges: stale `src/README.md`, `styled/css.mjs`
executable in the data package, `global.css` stub, tmp under the outdir.

**Lib sheet** (`evidence/lib-sheet-styles-css.md`, `lib-sheet-global-css.md`).
27k lines; `@layer reset, global, base, tokens, recipes, utilities` with
`base` and `recipes` *empty*; 90 `.ref-*` tag recipes live in `global`, not
`recipes`; 373 `:where(:root,:host)` token vars; light/dark islands on
`[data-panda-theme=…]`; dual conditions `:is(:hover,[data-hover])`; `:has()`,
`::marker`, vendor pseudos; `color-mix(in oklch, …)` ×25; **zero**
`@container`, `@supports`, `sm:` classes, `[dir=rtl]`, group/peer; rhythm
scale `r`, `0.5r`, `1/2r`…`12r`; 5k static colour atoms + 1.6k
`colorPalette` no-op atoms; a handful of Panda bugs (`.size_md{width:md}`,
leftover `{colors.ui.focus.ring}` class). `global.css` is Panda's `@layer base`
cssgen of `globalCss()` plus `@font-face` and the `--made-with-panda` banner.

**Engine** (`evidence/atomic-claims.md`). Atomic: 130 SPEC ids, 117 station
folders, all Vitest goldens + Cargo; **no station is a browser case**. Live
emit uses **`data-theme`** islands (`:root,[data-theme=light]` /
`[data-theme=dark]`) and `@container (min-width: Npx)` breakpoints. The JS
wrapper `compile()` still takes `{ baseSystem, rootDir?, files? }`, not the
frozen `NativeCompileRequest`. Known open stations: SITE-13, DIAG-04/05/06,
GHOST-04, PERF-01; base-system `BAS-EXTEND-*`/`BAS-LAYER-*` unproven; font-face
lacks `size-adjust`/`descent-override`. Neo cases must not re-prove SITE
refusals, serde, FORBID architecture, DIAG columns, or PERF.

**Generated shape** (`evidence/generated-folder-shape.md`). Consumers import
`@reference-ui/react` (101 tags, `css`, `recipe`, types), `@reference-ui/system`
(`tokens`, `font`, `keyframes`, `globalCss`, `getRhythm`, `baseSystem`), and
`@reference-ui/react/styles.css`. Nobody imports Panda's `styled/css|jsx|
patterns` from lib source. Ten must-not-regress contracts are listed in §7 of
that doc; §4.1 below is derived from them.

**Core API** (`evidence/core-api-parity.md`). Host loop parity is largely
there. Missing or partial: `@reference-ui/system` authoring exports,
`getRhythm` (matrix-only consumer), public typed `StyleProps`/`SystemStyleObject`
(typegen publish), `PortableBaseSystem` shape, `compile-request.json`,
`css.raw` (zero lib call sites), `cva` alias (zero lib call sites).

**Panda v1 corpus** (`evidence/panda-v1-core-corpus.md`,
`panda-v1-tokens-types-corpus.md`, `panda-v1-parser-config-corpus.md`).
Vendored at `vendor/panda-v1` (`@pandacss/dev@1.12.1`, sparse, read-only).
Core: 33 files / 215 tests / 322 snapshots — densest in atomic emission,
condition sorting, staticCss expansion. Token dictionary + generator: refs,
semantic conditions, composites, `:where(html)` vars, `[data-theme=dark]`
default dark selector, typegen unions. Parser: optimistic both-arms
extraction; PascalCase host guessing (anti-goal); breakpoints are
`@media screen` (Reference differs on purpose). ~150 candidate cases were
proposed across the three reports; §8 is the reconciled catalog.

---

## 3. Decisions locked at G0

The captain records each as `taken` (with date) or `overridden by human` before
W1 starts. Recommendations are the default; only **D1** needs an explicit human
answer because it changes the DOM contract of every primitive.

| # | Decision | Recommendation (default) | Why | Lands in |
| --- | --- | --- | --- | --- |
| **D1** | Colour-mode DOM/stylesheet attribute | **`data-color-mode`** (human override 2026-09-17, status in §3.1). Neo already stamps it (`DOMAIN.md`, `context.ts`, generated react entry, playground shell); the engine is retargeted by **RS-7**. Never `data-panda-theme`; never `data-theme` for colour mode (Toast owns `data-theme` for chrome). | Panda split brand packs (`config.themes` → `[data-panda-theme=<name>]`) from colour mode (`.dark &`); Reference folded light/dark into the themes slot for nested islands — right mechanism, wrong name, and `data-theme` keeps the leak while reading as “many themes”. Neo's model: `colorMode` prop → `data-color-mode` attr, `variant` for flavours, another layer library for another system. RS-7 retargets the engine (mechanical: two values, one attribute). | W0 (docs + playground), RS-7 (engine), proof `NEO-PRIM-07`, `NEO-COND-04`, `NEO-TOKEN-05` |
| D2 | `styled/global.css` | Do not write it. Add to forbidden paths. | The one sheet is `styles.css`; `@layer global` lives inside it. | W2 `NEO-SYNC-02` |
| D3 | `cva` alias | Not exported. `recipe` only. | Zero lib call sites; one word per idea. | W2 |
| D4 | Where bound `css()`/`recipe()` live | `styled` is **data only** (`styles.css`, `runtime-data.mjs`, `.d.mts`). The bound runtime moves into the `react` bundle. | §4.1 forbids executable css in styled; consumers import from react. | W2 `NEO-SYNC-13` |
| D5 | Generated filenames / exports | `react/react.mjs`, `react/react.d.mts`, `react/styles.css` (copy of `styled/styles.css`); `system/system.mjs`, `system/system.d.mts`, `system/baseSystem.mjs`; `package.json` `exports` maps `.`, `./styles.css`, `./baseSystem`. | Book, CT, matrix and lib tsconfig resolve these names today. | W2 `NEO-SYNC-05` |
| D6 | `@reference-ui/system` authoring surface | Export `defineConfig`, `tokens`, `font`, `keyframes`, `globalCss`, `extendPattern`, `getRhythm`, `baseSystem`, config types. `getRhythm` is a pure helper over the compiled rhythm root. | Consumer census §3; matrix imports `getRhythm`. | W2 `NEO-SYNC-12` |
| D7 | Panda bugs are not parity | `.size_md{width:md}`, leftover `{colors.ui.focus.ring}` class, `--made-with-panda`, the `*` transform-var dump, duplicated dark semantics in the default block, `colorPalette` no-op atoms: **approved absences**. | Parity of capability, not of defects. | W1 SPECs, W4 census |
| D8 | Breakpoints | `@container (min-width: Npx)` stays (rs decision). Neo proves the container-root requirement and the `container: true` macro; no `@media screen` breakpoints. Named ranges (`mdDown`, `mdOnly`) are proven, not invented. | Lib sheet has no viewport queries to be compatible with; engine already lowers to `@container`. | RESP group |
| D9 | Slot recipes / `sva` | Out. Multi-part anatomy is authored global CSS + `data-slot` (as lib does). | Lib sheet has 0 `recipes.slots`; no `sva(` in lib src. | SPEC out-of-scope |
| D10 | Responsive arrays with `null` holes | In. | Frozen contract carries them; Panda and typegen agree on `Array<T \| null>`. | RESP, TYPE |
| D11 | Unresolvable ternaries and dynamic values | Literal ternary arms: **both compiled**, runtime picks (matches `ATM-SITE-05`). Dynamic *values* (call results, runtime strings without a static atom): **diagnostic, no ghost class**. Hosts come from imports + `jsxElements`, never PascalCase. | Fail closed where it matters; keep authoring ergonomic. | SITE group |
| D12 | `NativeCompileRequest` | RS liaison makes `@reference-ui/rust/atomic` `compile()` accept the frozen request (`schemaVersion`, `spec`, `jsxHosts`, `sourceRoot`, `declarationRoot`) alongside the legacy shape for one wave; Neo switches and writes `compile-request.json`. | The contract is frozen and fixture-tested; Neo must not carry a private shape. | RS-1, `NEO-SYNC-04` |
| D13 | Missing token reference `{colors.nope}` | Sync-time **error** diagnostic with file:line. Not Panda's escaped literal. | Fail closed, say why. | TOKEN-02 (may be RS) |
| D14 | `colorPalette` virtual tokens | Out. | No lib author uses it; the 1.6k atoms are staticCss noise. | approved absence |
| D15 | `token()` string helper | Out. `{path}` refs only. | Neither core nor lib exports it. | approved absence |
| D16 | `css.raw` | Not shipped. `recipe(...).raw()` **is** shipped. | Zero lib call sites for `css.raw`; recipe raw is an Atomic claim. | RECIPE-05 |
| D17 | `strict`, `layers` config | Stay deferred past this voyage; typegen `strict` remains callable but unexposed. | Scope. | G6 report |
| D18 | Case grouping | Existing cases move into group folders (`git mv`), IDs unchanged, folder follows the id prefix: `NEO-SYNC-01` → `sync/`, `NEO-CSS-01`/`02` → `css/`, `NEO-RECIPE-01` → `recipe/`, `NEO-PRIM-01` → `prim/`, `NEO-EDGE-01` → `cond/`, `NEO-EDGE-02` → `token/`, `NEO-SMOKE-01`/`NEO-SNAP-A-01`/`NEO-PLAY-B-01` → `harness/`. (CSS-02's responsive topic stays cross-referenced from RESP; placement follows the id.) | Discovery is recursive; grouping is free except spec relative imports (`../../../shared` → `../../../../shared`), fixed plus a full rerun in the same step. | W0 |
| D19 | `@reference-ui/types` (Tasty/Reference browser) scope | Deferred as an approved absence for this voyage (human 2026-09-17). SYNC SPEC carries the absence with the caveat that 13 lib-src files cannot build under Neo until the later leg. | Largest emitted package (543 files) with no Neo emitter; a second voyage, not a slice. | W1 SYNC SPEC, W4 census |
| D20 | PARITY cartography sources | Panda v1 atomic style-system tests first, then reference-core matrix tests **except CHAIN** (colour mode, font, etc.). Probe-then-synthesize: oracle teams send probes, then collect against current Neo cases and vertical slices (human 2026-09-17). | Reference-ui uses a small slice of Panda with its own minimal API; Panda v1's atomic engine + codegen is where the real parity cartography lives. | W4 |
| D21 | W4 probe doctrine | In-dialect micro-gaps found by cartography are proven by PARITY-01 probes in the mini-lib world, not new group rows; blocked items cite RS rows; out-of-dialect items become SPEC absence lines (captain 2026-09-17). | The group catalog closed at G3; W4 stays bounded at 4 PARITY cases + census + absence lines. | W4 |

### 3.1 Decision status (G0, recorded 2026-09-17)

- **D1: overridden by human** — keep `data-color-mode` as the single colour-mode attribute. Resolves `docs/evidence/atomic-claims.md:287` option (b): the engine is retargeted (RS-7), Neo already stamps it. Rationale: Panda's brand-pack slot is not colour mode; `data-theme` leaks that confusion and collides with Toast chrome; no dual-stamp, ever.
- **D2–D18: taken as recommended** 2026-09-17.
- **D19: taken by human** 2026-09-17 — `types/` deferred as approved absence (SYNC SPEC carries it).
- **D20: taken by human** 2026-09-17 — PARITY cartography = Panda v1 atomic tests + core matrix minus CHAIN, probe-then-synthesize against Neo cases and vertical slices.

**Launch authorizations (2026-09-17, human):** run mode continuous to G6 with async gate reports (pause only for human-gated items); lib boundary record-now/move-later (zero lib edits in voyage); absence escalation auto-§3, novel lib-family absences escalate; snapshots batch-blessed at gates (slices proceed on oracle evidence; no gate passes with unblessed pixels); working tree stays uncommitted (merge = accept-in-tree); full-hyperspace: captain executes W0→G6 unprompted, human asks status only; oracles do visual inference (computed-style first, screenshots as backstop); escalate only novel lib-family absences, locked-decision/gate-criteria changes, genuine surprises.

---

## 4. Contracts Neo commits to for this voyage

### 4.1 Generated folder (target inventory)

This section is the authority for the inventory. It absorbs the retired rs
campaign's frozen §3.5 plus `evidence/generated-folder-shape.md` §7 and the §3
decisions. This is the `OutputInventory` a `NEO-SYNC-02` spec asserts.

Expected (must exist after `sync`):

- `system/package.json`, `system/system.mjs`, `system/system.d.mts`,
  `system/baseSystem.mjs`, `system/baseSystem.d.mts`,
  `system/evaluated-system.json`, `system/compile-request.json`,
  `system/jsx-elements.json`
- `styled/package.json`, `styled/styles.css`, `styled/runtime-data.mjs`,
  `styled/runtime-data.d.mts`, `styled/types/*.d.ts` (native typegen)
- `react/package.json`, `react/react.mjs`, `react/react.d.mts`,
  `react/styles.css`
- `node_modules/@reference-ui/{system,styled,react}` links in the project

Forbidden (must not exist):

- `styled/global.css`, `styled/css/`, `styled/jsx/`, `styled/patterns/`,
  `styled/recipes/`, `styled/helpers.*`, `styled/css.mjs`, `panda.config.*`,
  `virtual/`, `tmp/` under the outdir, anything containing
  `--made-with-panda`, `data-panda-theme`, or `@pandacss`.

### 4.2 DOM attributes

`data-layer="<system name>"` (first primitive in a tree stamps; nested inherit),
`data-color-mode="light|dark"` (D1), `data-variant="<name>"`. Interaction twins
(`data-hover`, `data-focus`, `data-focus-visible`, `data-active`,
`data-disabled`, `data-checked`, `data-placeholder`, `data-open`, `data-expanded`)
are *conditions*, matched by `:is()` wraps, never stamped by primitives.

### 4.3 Runtime ABI

`runtime-data.mjs` exports `{ schemaVersion: 1, systemName, recipes, stylePlans,
stylePropNames }` with owner-qualified class names; `stylePropNames` excludes
`variant` and `colorMode`. Unchanged by this voyage.

### 4.4 Stylesheet

One file, `styled/styles.css`, package-nested layers in this order:
`reset` (unless `normalizeCss: false`), `global` (globalCss + `@keyframes` +
`@font-face`), `base`, `tokens` (`:root,[data-color-mode=light]` and
`[data-color-mode=dark]` islands), `recipes`, `utilities`. Empty layers still occupy
their rank.

### 4.5 Case conventions (unchanged harness, sharper folders)

```
tests/cases/<group>/
  SPEC.md            behaviour, decisions, approved absences, out-of-scope table
  TESTS.md           ledger: one row per case id (status word, evidence, rung notes)
  NEO-<GROUP>-NN/
    case.json        {"id","name","sync": true}
    README.md        first line = claim; then world, assertion, evidence tags
    world/           index.html, ui.config.ts, src/**.ts(x) (built to dist/)
    specs/*.spec.ts  default export run({ page, url, case, snap })
```

- A case is created **only when its proof rung is green**. Until then it is a
  `TESTS.md` row. `pnpm agentneo run` therefore stays green at every merge.
- One claim per case. Sheet-text assertions are allowed only alongside a
  computed-style or DOM assertion of the same claim; never sheet-only.
- Negative cases (`must not paint`, `must not exist`, `sync must fail with …`)
  are first-class and count toward the bars.
- Node-side assertions in specs are fine (read the generated folder, run `tsc`
  over the world, call `css()`/`recipe()` from `@reference-ui/neo/runtime`).
- World sources are extraction sources *and* browser entries; no twin files.

### 4.6 SPEC.md and TESTS.md shape

`SPEC.md` (2–4 screens): purpose; the dialect the author writes for this
family; engine stations it leans on; decisions that apply (`Dn`); **approved
absences** (lib families or Panda tests deliberately not reproduced, with
reason); out-of-scope table (Panda features that are not Reference's dialect).

`TESTS.md`: a table `id | claim | status | engine | host | proof | evidence`.
`engine` is a station id, `RS-n` (an RS-lane slice id from §5.3), or `none`.
`host` names the Neo module touched or `—`. `proof` is the browser assertion in
one clause. `evidence` holds the tags.

### 4.7 Playground (fast loop before cases)

`playground/` is the expendable mess-around loop: one synced React app where
an agent (or human) tries combinations fast, screenshots, and only then
formalises what it finds as a Neo case. It is not tests; nothing here gates
anything. The agent-neo skill's §8 is its operator manual.

- One `ui.config.ts` + `src/`; `serve` runs `sync()` then serves with Vite
  (tsx straight from source, classic `createElement`, no react plugin).
- Hash routes, one per page in `src/pages/`; a Book-like side menu lists and
  searches them. Pages are a kitchen sink mined from lib: swatches, states,
  recipes, primitives, `globalCss()` tag recipes, palette ramps.
- Mini token set: tailwind's palette verbatim plus `ink`/`paper`/`brand`
  with dark leaves, spacing, lib's radii. Leaves flip automatically;
  palette shades need explicit `_dark` twins.
- The shell is dark by default with a light/dark toggle; it stamps
  `data-color-mode` on `<html>` and syncs `?theme=`. `capture [route]
  [--theme dark|light|both]` screenshots headless to
  `.captures/<route>.<theme>.png` (the one harness: sync, serve, shoot,
  kill) and reports page errors. No Book, no CT, no weight.
- Loop: mess around in the playground → see something weird → write the Neo
  case that proves it. The playground finds; cases keep.
- Presentation duty (HQ): after a slice lands, its cook adds or extends a page
  showing the landed behavior, named for the case id, so HQ can watch the system
  build up. Cooks screenshot the page via capture, make it sharp with whatever
  the system can do today, and may polish shell surfaces (menu, demo list)
  slice by slice; shell architecture and the token set stay the captain's.
  Presentation only — never a gate, never required for the slice to be done;
  oracles confirm the page matches the claim and captured clean.

---

## 5. The slice — unit of work

Work is vertical. A line cook owns one slice from bottom to top and does not
hand a half-finished layer to someone else.

### 5.1 Rungs

| Rung | Question | Done when |
| --- | --- | --- |
| **R1 engine** | Does Atomic (or base-system / typegen / styletrace) already do this? | The cook has run the cited station (`pnpm agentrs v atomic -t "<ATM id>"`) or a throwaway Vitest against `compile()` under `/tmp`, and written in the completion report exactly what the engine emits for the case input. If the engine is wrong or missing: file an **RS-lane slice** (§5.3), set the row `blocked-on-rs`, stop. |
| **R2 host** | Does Neo carry the behaviour from `ui.config`/fragments through `sync` to the generated folder and runtime? | Any Neo change is made in the cook's owned module (§5.2), colocated Vitest added or extended, `pnpm agentneo q` 0 errors. Often R2 is *nothing*; say so. |
| **R3 proof** | Does a browser agree? | The case folder exists, `pnpm agentneo run NEO-<GROUP>-NN` passes, README carries evidence tags, `TESTS.md` row is `done`. |

A slice may bundle 2–4 cases of the same group when they share a world;
each case still gets its own folder and README.

### 5.2 Ownership map (disjoint by construction)

Cooks in the same wave own disjoint folders. Anything outside the map is the
captain's.

| Group | Case folder | Neo modules the group may edit |
| --- | --- | --- |
| SYNC | `tests/cases/sync/` | `src/sync/**`, `src/config/**`, `src/lib/paths/**`, `src/author/**` (+Gap-1 easement, granted + landed: `src/fragments/base/index.ts`) |
| TOKEN | `tests/cases/token/` | `src/fragments/api/tokens.ts`, `font.ts`, `keyframes.ts` (+ tests) |
| COND, RESP, CSS, MERGE, STATIC | `tests/cases/{cond,resp,css,merge,static}/` | `src/runtime/css/**` (one cook at a time — captain serialises) |
| RECIPE | `tests/cases/recipe/` | `src/runtime/recipe/**` |
| LAYER, GLOBAL | `tests/cases/{layer,global}/` | `src/fragments/api/globalCss.ts`, `src/sync/publish.ts` (CSS assembly only) |
| SITE | `tests/cases/site/` | `src/sync/compile-files.ts`, `src/sync/jsx-elements.ts` |
| PRIM | `tests/cases/prim/` | `src/primitives/**`, `src/sync/react.ts` |
| TYPE | `tests/cases/type/` | `src/sync/publish.ts` (types publish only), `tsconfig.json` `paths` |
| PARITY | `tests/cases/parity/` | none (reads everything, edits nothing in `src/`) |
| HARNESS | `tests/cases/harness/` | `tests/shared/**` — **W0 only**, captain-owned |
| PLAYGROUND | `playground/` | none (captain builds in W0; cooks use it, never restructure it) |

Shared files (`docs/DOMAIN.md`, this file, `tests/cases/README.md`,
`src/README.md`) are captain-only; cooks propose edits in their report.

### 5.3 The RS lane

Voyage-one accounting (2026-09-17, tree-verified): LANDED 8 — RS-1
(frozen request, contracts/), RS-2 (font fields), RS-3 (ATM-TOKEN-12),
RS-4 (base-system `extends/`), RS-7 (`data-color-mode` retarget), RS-8
(ATM-RECIPE-07), RS-9 (ATM-COND-17), RS-10 (ATM-SCAN-01 + `includes/`).
QUEUED 15 in liaison order (status row): RS-14, RS-11, RS-12, RS-16,
RS-17, RS-15, RS-5, RS-18, RS-19, RS-22, RS-23, RS-24, RS-25, RS-13, RS-6.
RS-20/21 R1-cleared to PARITY-01 probes (never filed). Voyage Two (§13)
drains this lane; this table stays the single ledger.

When R1 finds the engine wrong or missing, the cook writes an RS-lane slice
request into `TESTS.md` (`RS-n`) with: input style object / fragment, expected
CSS, the station it should become, and the Neo case waiting on it. The **RS
liaison** (agent-rs skill, one at a time — the rs rule of one Atomic editor
holds) implements it as a proper station (SPEC row, `tests/cases/ATM-*`,
golden), runs `pnpm agentrs v atomic` and `pnpm agentrs q`, and reports. The
blocked Neo cook (or a new one) then resumes at R2.

Known RS-lane slices at start (RS-1–RS-6 from the probes; RS-7 from the D1 human override; RS-8 from W1 cartography; RS-9 from the W3 CSS cook; RS-10 from the SYNC-rest cook; RS-11 from the GLOBAL cook; RS-12 from the COND cook (relabeled); RS-13 from the captain (golden drift); RS-14 from the SITE cook; RS-15 from the COND cook; RS-16 from the TOKEN cook; RS-17 from the COND cook (relabeled); RS-18/RS-19 from the T8 mop cook:

| RS | What | Unblocks | Status | Owner |
| --- | --- | --- | --- | --- |
| RS-1 | `compile()` accepts frozen `NativeCompileRequest` (`schemaVersion`, `spec`, `jsxHosts`, `sourceRoot`, `declarationRoot`); legacy shape kept one wave. | `NEO-SYNC-04`, SITE hosts | done | RS liaison |
| RS-2 | `FontFaceDefinition` gains `sizeAdjust`, `descentOverride`; `append_font_faces` prints them. | `NEO-GLOBAL-08` | done | RS liaison |
| RS-3 | Missing `{token}` ref → error diagnostic with location (D13). | `NEO-TOKEN-02` | done | RS liaison |
| RS-4 | base-system `BAS-EXTEND-*` (fragment adoption from upstream `PortableBaseSystem`) proven. | `NEO-SYNC-10`, `NEO-LAYER-02` | done | RS liaison |
| RS-5 | `ATM-SITE-13`: empty styletrace graph must not scan all tags (diagnostic). | `NEO-SITE-14` | done | RS liaison |
| RS-6 | Docs: `atomic/SPEC.md` COND-03/08/LAYER-03 prose and `map.html` say `data-color-mode` + `@container`. | D1 hygiene (docs only) | done | RS liaison |

| RS-7 | Engine retarget colour mode `data-theme` → `data-color-mode`: `_dark`/`_light` wraps, token islands, ~106 goldens, `contracts/fixtures`, `docs/FEATURES/DATA_THEME.md`. No dual-stamp. | `NEO-PRIM-07`, `NEO-COND-04`, `NEO-TOKEN-05` (P0) | done | RS liaison |
| RS-8 | Responsive recipe variant values (`{ base, md }`) lower to `@container` per D8; station ATM-RECIPE-07 (ConditionalValue absent from typegen). Full input/expected-CSS/waiting-case text lives in `tests/cases/recipe/TESTS.md`. | `NEO-RECIPE-08` | done | RS liaison |
| RS-9 | Per-prop responsive objects (`width: { base, md }`) + alias eviction at merge time; station ATM-COND-17 plus merge note. Full input/expected-CSS lives in `tests/cases/css/TESTS.md`. | `NEO-CSS-03` | done | RS liaison |
| RS-10 | Frozen `NativeCompileRequest` carries no `include` scoping (`atomic::compile` scans all); add scoping so `include` globs limit scanning. Station ATM-SITE-17 or ATM-SCAN-01 at liaison's call. Full text in `tests/cases/sync/TESTS.md` RS lane. | `NEO-SYNC-09` (done; SITE rows need RS-14) | done | RS liaison |
| RS-14 | Core cleared N0 (ternary/member/spread emit plans both paths; was: wants without `stylePlans`). Remainder: station adoption of `site_plan_tests.rs`. Whole-object `css(styles)` ruled out-of-dialect (site SPEC). Full text in `tests/cases/site/TESTS.md` RS lane. | `NEO-SITE-01/02/03` | done | RS liaison |
| RS-15 | `@supports` keys lower to selector fragments instead of at-rules (classifier routes only `@media`/`@container`). Station ATM-COND-19. Full text in `tests/cases/cond/TESTS.md` RS lane. | `NEO-COND-15` | done | RS liaison |
| RS-16 | Keyframe bodies print token refs and rhythm literally (`{colors.brand}`, `4r`) with zero diagnostics. Station ATM-LAYER-09 at liaison's call. Full text in `tests/cases/token/TESTS.md` RS lane. | `NEO-TOKEN-13` | done | RS liaison |
| RS-17 | `_file` unknown condition; `_placeholder` lacks its `[data-placeholder]` twin (filed as RS-14, relabeled — SITE holds RS-14). Station ATM-COND-18. Full text in `tests/cases/cond/TESTS.md` RS lane. | `NEO-COND-14` | done | RS liaison |
| RS-11 | `& ~ &` under a comma selector becomes `:is()` siblings. Full input/expected-CSS lives in `tests/cases/global/TESTS.md` RS lane. | `NEO-GLOBAL-06` | done | RS liaison |
| RS-12 | Parent-combinator keys (`'input:hover &'`) silently dropped: zero classes, zero diagnostics (R1 probes 05a–05d). Full text in `tests/cases/cond/TESTS.md` RS lane (filed mislabeled as RS-1, corrected here). | `NEO-COND-05`, `NEO-COND-10` | done | RS liaison |
| RS-13 | RS golden-drift reconciliation: 112+ workspace-wide atomic golden failures from serializer churn (proven unrelated to RS-8/RS-10 slices); categorize every diff format-only vs semantic, fix or re-bless with per-file justification. | Trustworthy RS verdicts (no single case) | done N3b (112F→1F: 108 format-only, 2 stale-golden `[data-theme]`→contract, 1 message-text `extends`; stop-line → RS-32; ledger `/tmp/n3b-rs13-ledger.md`) | RS liaison |
| RS-18 | Recipe error diagnostics carry no source location (`Diagnostic::error` pushed bare in `extract/recipes/mod.rs`); add `file`/`line`/`column` per RS-3/ATM-TOKEN-12 precedent. Full text in `tests/cases/recipe/TESTS.md` RS lane. | `NEO-RECIPE-07` | done | RS liaison |
| RS-19 | `<Div border />` boolean form extracts (`Bool(true)` want) but lowers to nothing (refusal pinned deliberate; only `container: true` lowers); add boolean macro lowering (proposal: `border-width: 1px; border-style: solid`). Full text in `tests/cases/site/TESTS.md` RS lane. | `NEO-SITE-13` | done | RS liaison |
| RS-20 | Not filed: R1 cleared — `& + &` lowers (`compileSync` emits `.x + .x`, zero diagnostics); proven by PARITY-01 probe P2. Number reserved-skipped. | `NEO-PARITY-01` (P2) | not filed | — |
| RS-21 | Not filed: R1 cleared — `red/abc` passes through Panda-identical; proven by PARITY-01 probe F1. Number reserved-skipped. | `NEO-PARITY-01` (F1) | not filed | — |
| RS-22 | `textGradient` emits a non-property (`text-gradient: linear-gradient(...)`, browsers drop, zero diagnostics) instead of the Panda clip trio. Full text in `tests/cases/parity/TESTS.md` RS lane. | `NEO-PARITY-01` (P14) | done | RS liaison |
| RS-23 | Array `css` props extract nothing (zero utilities, zero diagnostics); single-object and `css([...])` controls green. Full text in `tests/cases/parity/TESTS.md` RS lane. | `NEO-PARITY-01` (P15) | done | RS liaison |
| RS-24 | `fontFace` arrays fail sync (`invalid baseSystem spec`: Rust `FontDefinition.font_face` is single `Option<FontFaceDefinition>` only). Full text in `tests/cases/parity/TESTS.md` RS lane. | `NEO-PARITY-01` (P8) | done | RS liaison |
| RS-25 | Radius pair shorthands emit non-properties (`border-top-radius:` etc., computed `0px`, zero diagnostics) instead of corner expansion. Full text in `tests/cases/parity/TESTS.md` RS lane. | `NEO-PARITY-01` (P4) | done | RS liaison |
| RS-26 | `globalCss` bare numerics print unitless (`marginTop: 10` → `margin-top: 10`, dropped; `css()` path unitizes correctly). Unitless-stay props must not unitize. Full text in `tests/cases/global/TESTS.md` RS lane. | `NEO-PARITY-01` (sub-probe) | done | RS liaison |
| RS-27 | Top-level at-rules in `globalCss` print braceless (`@media … body { … }`, dropped). Nested at-rules proven. Full text in `tests/cases/global/TESTS.md` RS lane. | `NEO-PARITY-01` (sub-probe) | done | RS liaison |
| RS-28 | Breakpoint keys + conditional values in `globalCss` print as descendant selectors (`.btn width { base: 40px }`). Full text in `tests/cases/global/TESTS.md` RS lane. | `NEO-PARITY-01` (sub-probe) | done | RS liaison |
| RS-29 | Empty `@supports` query prints a bare `@supports {` block browsers drop, with zero diagnostics; should refuse with a diagnostic. P5 empty arm proven computed-only. Full text in `tests/cases/cond/TESTS.md` RS lane. | `NEO-PARITY-01` (P5 empty) | done | RS liaison |
| RS-30 | Shorthand aliases not lowered in keyframes (`h` prints verbatim; `css()` lowers). Keyframe values should run the alias table. Full text in `tests/cases/token/TESTS.md` RS lane. | `NEO-TOKEN-13` (tail assertion) | done (N3b: ATM-LAYER-14, Panda `roll` parity) | RS liaison |

Engine-wide mechanical retargets ship as a single RS row with exact-CSS proof: one liaison, CLI-only golden regen, shape-identical fixtures (RS-7 pattern). Cooks add rows as they find gaps. Rust changes never happen inside a Neo slice.

### 5.4 Slice rules

- Read the group `SPEC.md`, the cited `docs/evidence/` sections, and the cited
  station README **before** writing a world. The world's style objects come from the
  evidence, not from imagination.
- Author the world the way a lib author would: `tokens()`, `globalCss()`,
  `font()`, `keyframes()`, `recipe()`, `css()`, primitives, `ui.config.ts` with
  `include`.
- Assert what the claim says and nothing else. Exact utility counts are fine
  when "no ghost" is the claim.
- Do not touch `tests/shared/**`, other groups, `packages/reference-rs`,
  `packages/reference-core`, or `packages/reference-lib`.
- No git operations, no installs. The captain merges and runs the full gate.
- Finish with the completion report (§10.5). A slice without a report is not
  done.

---

## 6. The swarm

### 6.1 Roles

| Role | Model tier | Reads | Writes | Runs |
| --- | --- | --- | --- | --- |
| **Captain** | strongest available | everything | this file's status tables, `DOMAIN.md`, shared READMEs, harness (W0) | spawns, merges, `agentneo run` + `q` + Vitest after every merge, gate reviews |
| **Planner** | strong | the wave's plan section, its gate criteria, §7.3, cited evidence, code reality | nothing (scoped prompts + sequence only) | reads, `ls`, `rg` |
| **Scout** | fast/cheap (Grok-class worked for the nine probes) | repo, vendor, generated folder | `docs/evidence/*.md` only | read-only commands |
| **Cartographer** | strong | `docs/evidence/`, stations, lib sources | `tests/cases/<group>/SPEC.md`, `TESTS.md` | none (no code) |
| **Line cook** | strong implementor | group SPEC/TESTS, cited `docs/evidence/` sections, stations | its group folder + owned modules (§5.2) | `agentneo run <id>`, `q`, package Vitest, `agentrs v atomic -t` for R1 |
| **RS liaison** | strong implementor | rs SPEC, PLAN, stations | `packages/reference-rs` via the agent-rs skill only | `pnpm agentrs v/c/q` |
| **Oracle** | strongest available | the diff, the report, the case | nothing (verdict only) | reruns the case, the group, `q`; tries to break the claim |

### 6.2 Workflow per wave

1. Captain opens the wave: a planner scopes it (§6.6 step 0) into slice
   prompts (§10); captain confirms ownership is disjoint, posts them.
2. Cooks work **in the shared checkout** (docs/archive/PLAN-harness §6 lesson: isolated
   worktrees stranded work). Disjoint files, no git, no installs.
3. Each finished slice gets an **oracle** immediately (do not batch oracles to
   the end of the wave): verdict `pass`, `pass-with-notes`, or `fail (reason)`.
   A fail goes back to the same cook once; a second fail returns the slice to
   the captain.
4. Captain merges passed slices one at a time, running
   `pnpm agentneo run` (whole catalog — it is seconds), `pnpm agentneo q`, and
   `pnpm --filter @reference-ui/neo exec vitest run src` after each. Red means
   revert that merge, not "fix forward in the next slice".
5. Captain updates §7.3 status and the group `TESTS.md`, then closes the wave
   with a **gate review**: a read-only oracle pass over the wave's diff against
   the gate's criteria, ending in the stage handover (§10.8).

### 6.3 Concurrency

- Up to **6 line cooks** in parallel, never two in the same group, never two
  touching `src/runtime/css/**` at once (captain serialises COND/RESP/CSS/
  MERGE/STATIC host rungs; their proof rungs may still run concurrently since
  those often need no host change).
- **1 RS liaison** at a time.
- Oracles are read-only and may run 2–3 at once.
- Scouts and cartographers run freely in W0/W1; after G1 a new scout needs a
  captain-stated question.
- Spec changes mid-wave queue for the next wave. Killing a running cook
  deletes work — let it report, then discard.

### 6.4 Cadence

A wave is done when its gate passes, not when a clock says so. Expect: W0 one
sitting; W1 one sitting (13 cartographers in parallel); W2 two sittings; W3
the long middle (several sittings, refilled continuously as slices land); W4
one sitting; W5 one or two.

### 6.5 Converge protocol (standing)

Scouts diverge, one oracle converges, the map updates. The captain invokes
this any wave a question outruns one reader; it is not a W0-only ritual.

1. **Fan out.** Captain posts 2–5 scout prompts (§10.1 shape): disjoint
   questions, disjoint paths, each report to `docs/evidence/<name>.md`.
   Scouts are read-only and run freely in parallel.
2. **Post.** Every scout report ends with *findings* (numbered, each citing
   `path:line` or `rg` command) and *open questions*. No findings, no report.
3. **Converge.** One oracle reads all reports plus the cited sources, then
   writes the worldview: what the scouts agree on, where they conflict and
   which reading wins (with why), and the resulting map change as a concrete
   doc edit list (file, section, new text). The oracle edits nothing itself.
4. **Absorb.** The captain applies the edit list (or hands it to the wave's
   writers), then deletes nothing: superseded text is cut, its provenance
   stays in git history.

First invocation (W0): the emitted-output coverage audit. Scouts inventory
every emitted artifact type in lib's, core's, and Neo's current
`.reference-ui/` trees plus every consumer import path, and check each
against existing case coverage. The oracle converges a coverage map to
`docs/evidence/coverage-map.md`: covered / half-covered / unproven per
artifact type, with the §8 rows or gaps each maps to. W1 cartography starts
from that map, not from memory.

### 6.6 Stage lifecycle (the operating system)

This file is strategy, zoomed out. No wave executes itself: every wave runs
the same five-step lifecycle, and the captain's first act per wave is always
step 0.

0. **Launch (planner).** A planner with fresh context reads the wave's
   section, its gate criteria (§7.2), §7.3 status, and the cited evidence —
   then inspects reality (`ls` stations, reads the code the wave touches,
   checks what already exists). It returns scoped prompts (§10 shapes),
   sequencing, and role assignments: today's flight orders, not a re-debate
   of the strategy. The captain posts them unchanged or states why not.
1. **Work (§6.2).** Scouts, cartographers, cooks, liaison — per the role
   matrix (§6.7), in parallel per §6.3. Disjoint files, shared checkout.
2. **Self-verify (cook).** The cook's completion report (§10.5) IS the
   verification: cases run, gate run, Vitest run, numbers recorded. The
   oracle does not re-verify from scratch — it reruns to confirm, then
   spends its effort trying to break the claim.
3. **Oracle review.** Ideally the same oracle persona wave after wave (fresh
   context each time, carrying only prior verdicts): code quality, alignment
   with this plan, what complicated the work, what was learned. Learnings
   become concrete doc edits (file, section, new text) — the oracle advises,
   the captain applies. Drift is caught in hours, not waves.
4. **Handover.** The oracle sequences the next work (which wave/slices are
   unblocked, what changed about their shape) and writes the stage handover
   (§10.8). The captain absorbs it into §7.3 and opens the next stage. Cooks
   hand slices to the oracle; the oracle hands the WAVE to the captain. When the captain synthesizes across workers, it attaches their refs and outputs to the synthesis — never from memory.

### 6.7 Stage kinds and role matrix

Not every stage wants every role. Research stages never get an implementer;
oracles review in every kind — what they review changes.

| Stage kind | Planner | Scout | Cartographer | Cook / liaison | Oracle reviews |
| --- | --- | --- | --- | --- | --- |
| **Research** (understand X: audits, probes, R&D) | frames the questions | gathers, reports | — | — | the converged map vs cited sources |
| **Cartography** (W1 SPECs) | scopes per group | only on captain-stated gaps | writes SPEC/TESTS | — | SPEC coverage vs evidence + station reality |
| **Implementation** (W2/W3/W5) | scopes slices | — | — | builds + self-verifies | per-slice verdicts (§10.6), then the wave |
| **Proof** (W4 census) | scopes census runs | — | — | builds parity worlds | cases + absence-union equality |

A stage that starts as one kind and discovers it is another (research finds
a missing station, implementation finds an unmapped family) does not morph
mid-flight: the cook reports it, the oracle confirms it, the captain opens
the other kind of stage next.

### 6.8 Course-keeping: the captain and plan evolution

If you are reading this file to execute it, **you are the captain**. Think
of yourself as orchestrating a crew aboard a ship on a flight path: this
plan is the path, the waves are the legs, the oracles are your instruments.
Your job is to keep the course — which means knowing when the path itself
must move.

- **Evolution is expected.** Real constraints (a station that cannot emit
  what Panda did, a contract that fights the borrow checker, a census that
  surfaces a thirteenth family) will bend the plan. Minor evolution lands
  the same sitting it is discovered: no shadow plans, no "we'll update the
  doc later".
- **What the captain may move alone:** sequencing, slice scope, role
  assignments, status tables, evidence pointers — anything inside the gate
  criteria.
- **What needs the human:** gate criteria (§7.2), locked decisions (§3),
  prohibitions (§11), and any approved absence that newly covers a lib
  family. Propose the edit with the oracle's reasoning attached; wait.
- **R&D feeds the targets.** Scouts research Panda v1 artifacts and the
  outputs they produced; converge turns findings into parity-target
  enhancements (new §8 rows are append-only, same convention as
  cartographers). The map gets sharper as the voyage proceeds; the
  destination (§0.3) does not move.
- **Parallel by default.** Waves overlap (§7.1), cooks run 6-wide (§6.3),
  oracles 2–3 at once. Speed comes from the shape of the work, not from
  skipping review: nothing lands without a verdict, nothing closes without
  a handover.

---

## 7. Execution graph

### 7.1 Waves and gates

```
W0 prep ────────────► G0  decisions recorded, cases regrouped, harness touches in,
                          evidence indexed, DOMAIN vocabulary updated,
                          coverage audit converged, playground MVP serves
W1 cartography ─────► G1  every group has SPEC.md + TESTS.md; ids reserved;
                          approved absences written; RS-lane list refreshed
W2 host contracts ──► G2  generated folder == §4.1; exports/filenames; frozen
                          request; styled data-only; system authoring surface;
                          data-color-mode everywhere; typegen published
W3 parity slices ───► G3  every TESTS.md row done / approved-absence, or
                          blocked-on-rs with an RS row that is in-progress;
                          RS lane drained
W4 lib-shaped world ► G4  NEO-PARITY-01..04 green; family + consumer census pass
W5 host ergonomics ─► G5  `neo sync`/`neo clean` CLI, sync timing, stale docs
                          rewritten; gate warnings ≤ today's 7
                      G6  switch-readiness report (§12); DoD §0.3 checked
```

W2 and W3 overlap: any W3 group whose cases do not depend on the folder
contracts (COND, RESP, CSS, MERGE, TOKEN, RECIPE, GLOBAL, LAYER, STATIC) may
start as soon as G1 passes. SYNC, PRIM, SITE, TYPE, PARITY wait for G2.

### 7.2 Gate criteria (the oracle's checklist)

**G0** — §3 table has a status for every row; D1 answered by a human or
default recorded; `git mv` regrouping done and `agentneo list` shows 10 cases;
harness touches (§9) merged with tests; `docs/evidence/README.md` exists;
`DOMAIN.md` has the §1 vocabulary and `data-color-mode`; coverage audit converged
(`docs/evidence/coverage-map.md` exists and W1 inputs reference it);
playground serves its routes and `capture` writes `.captures/`.

**G1** — each of the 13 groups in §8.2–§8.14 has `SPEC.md` (≤ 4 screens) and
`TESTS.md` (HARNESS needs neither; PARITY's are written in W4); every §8 row appears once in exactly one `TESTS.md`; every row has
evidence; approved absences cover D7/D9/D14/D15 items and every lib family
not otherwise targeted; RS-lane table (§5.3) refreshed with any new gap the
cartographers found.

**G2** — `NEO-SYNC-02..05, 12, 13` green; `NEO-PRIM-07` green (`data-color-mode`
stamped and matched by `_dark` utilities and token islands); `NEO-TYPE-01`
green (generated declarations compile a consumer world); no `data-theme` colour-mode usage
or `data-panda-theme` anywhere under `packages/reference-neo` except
`DOMAIN.md` "retired" list and `docs/evidence/` reports (decision-history
prose in this file and absence-asserting guards in specs are documentation,
not usage).

**G3** — `TESTS.md` across groups has zero `open`/`in-progress`; each
`blocked-on-rs` points at an `RS-n` marked in-progress with an owner; full
`agentneo run` green; `q` 0 errors; Vitest green; every case README has a
claim line and evidence tags.

**G4** — `NEO-PARITY-01..04` green; the census spec's approved-absence list
equals the union of group SPEC absences (no silent gaps).

**G5** — `pnpm --filter @reference-ui/neo exec neo sync|clean` (or the agreed
bin) works in a case world; `agentneo run` prints sync ms per case; `src/README.md`,
`tests/cases/README.md`, `docs/PLAN.md` describe what exists. (`docs/PLAN.md`
has since been archived to `docs/archive/`; the one living plan is this file.)

**G6** — §0.3 checklist all ticked; §12 report written.

### 7.3 Status checkpoint (captain maintains)

| Packet | Status | Gate |
| --- | --- | --- |
| Vendor Panda v1 (`vendor/panda-v1`, `clone.sh`, `vendor/README.md`) | **done** 2026-09-17 | W0 |
| Evidence probes ×9 in `docs/evidence/` (folder is named `evidence` because the root `.gitignore` ignores every `research/`) | **done** 2026-09-17 | W0 |
| Emitted-output coverage audit (§6.5 first invocation → `docs/evidence/coverage-map.md`) | **done** 2026-09-17 (3 scouts converged; map + index updated) | G0 |
| Playground (§4.7: serve, routes, capture, kitchen sink, Book-like shell, theme toggle, mini tokens) | **done** 2026-09-17 (serves :5199, 6 routes × dark/light capture clean, gate-proven 12/12 zero errors; stamp flipped to data-color-mode) | G0 |
| §3 decisions recorded; D1 answered | **done** 2026-09-17 (D1 human override: keep `data-color-mode`; D2–D18 taken) | G0 |
| Regroup existing cases (D18) | **done** 2026-09-17 (10 cases grouped, `agentneo list` green) | G0 |
| Harness touches (§9) | **done** 2026-09-17 (prefix run, sync-ms, status verb, system surface, README; 5 unit tests; catalog green) | G0 |
| `DOMAIN.md` vocabulary + `data-color-mode` | **done** 2026-09-17 | G0 |
| G0 gate review + handover | **PASS** 2026-09-17 (8/8 criteria; oracle handover absorbed) | G0 |
| Cartography: 13 SPEC/TESTS pairs | **done** 2026-09-17 (13/13 pairs; oracles A/B/C PASS; RS-8 filed) | G1 |
| G1 gate review + handover | **PASS** 2026-09-17 (13/13 groups; no course corrections) | G1 |
| W2 host contracts (SYNC-02..05,12,13; PRIM-07; TYPE-01) | T3 merged (53/53 green, q 0/8w, vitest 139 full / 134 src-only); **G2 PASS** 2026-09-17 (8 slices, RS-1..4+7 confirmed); T4 next | G2 |
| Playground D4/D5 repair + showcase policy (HQ) | policy landed (skill §8, PLAN §4.7); dedicated repair crew posts post-T3-merge | G2 |
| RS-1..RS-32 | RS lane drained S3: done RS-1–19 + RS-22–30 (N3a +9 stations, N12 warn+drop both paths; N3b RS-30/LAYER-14, RS-13 112F→1F, tails a/c/d); RS-20/21 R1-cleared, not filed; RS-31 voided→NEO-PRIM-11; only RS-32 open (diagnostic hygiene, filed+owned) | G2/G3 |
| W3 groups: TOKEN, COND, RESP, CSS, MERGE, RECIPE, LAYER, GLOBAL, STATIC, SITE, PRIM, TYPE, SYNC(rest) | T7 merged (117/117 green, q 0/7w, vitest 203; captain merge repair: reset container-type fallout + collectEntries struct); G3 review: 8 open rows un-voyaged + RESP-03 resumed (RS-9 landed) → T8 merged (124/124 green, q 0/7w, vitest 203; 7 done + RS-18/19 filed, zero open/in-progress) → **G3 PASS** 2026-09-17 | G3 |
| W4 PARITY-01..04 | Phase 1 complete (3 oracle reports + captain synthesis `docs/evidence/w4-synthesis.md`, D21 probe doctrine); Phase 2a cartographer done (parity SPEC/TESTS + 10 ★ absence lines, union 150+1); Phase 2b merged (128/128 green, q 0/7w, vitest 203; R1 cleared +/F1 to probes, RS-22..25 filed; captain rulings: RS-17 relabel, capital-W absence → union 152, P1/P7/P11 laterals accepted) → **G4 PASS** 2026-09-17 | G4 |
| W5 ergonomics + docs | crew merged (`neo` bin proven literally, sync-ms live, 3 docs rewritten, q 0/7w on 106 files, vitest 208); **G5 PASS** 2026-09-17 | G5 |
| G6 report | **done** 2026-09-17 (`docs/SWITCH-READINESS.md`; §0.3 ticked with noted reading; recommendation: HARDEN bounded, then cut over) — **VOYAGE ONE COMPLETE**; Voyage Two chartered in §13 | G6 |
| Playground polish voyage | merged 2026-09-17 (tools/ tidy, minimal index, 4 showcase pages: deck/pricing/patterns/panels; 26/26 captures zero errors, 128/128 suite green; captain eyeballed stills) | post-G6 |

---

## 8. Groups and slice catalog

Ids below are **reserved**. Cartographers may add ids (append-only), merge two
rows into one case (keep both ids in the README, retire one in `TESTS.md`), or
move a row to approved-absence with a reason — never renumber. Existing cases
keep their ids. Column `engine` names the station a cook runs at R1 (`RS-n`
when the engine is known to lack it; `none` when the behaviour is host-only).
Evidence file names are under `vendor/panda-v1/packages/...` for `[panda-v1]`.

Priority order for W3 spawning: **TOKEN-05, COND-04, PRIM-07** (colour-mode,
P0), then RESP-01/02/07, MERGE-01..04, CSS-08, TOKEN-03, GLOBAL-01..05,
RECIPE-02..06, then the rest.

### 8.1 HARNESS (`tests/cases/harness/`) — existing, no new cases

`NEO-SMOKE-01`, `NEO-SNAP-A-01`, `NEO-PLAY-B-01`. They prove the harness, not
the system. Snapshots stay; nothing here is a parity case.

### 8.2 SYNC (`tests/cases/sync/`) — generated folder and contracts

Owns `src/sync/**`, `src/config/**`, `src/lib/paths/**`, `src/author/**`.
Existing: `NEO-SYNC-01` (handshake).

| id | claim | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- |
| NEO-SYNC-02 | After sync the folder matches the inventory: every expected path exists, every forbidden path is absent (§4.1); rewrites SYNC-01 in the same slice (coverage-map note c) and folds the `tmp/` absence (note d) | none | `publish.ts` stops writing `global.css`, `css.mjs` | node-side fs assertions over §4.1 lists | `[core]` generated-folder-shape §7, `[decision D2,D4]` |
| NEO-SYNC-03 | `baseSystem.mjs` is a `PortableBaseSystem`: `schemaVersion 1`, `fragments[]` source-tagged, `cssChunks[]`, `runtime`, `jsxElements[]` | none | `publish.ts` shape | import the module in the spec; `satisfies` via runtime checks | contracts `portable-base-system.json` |
| NEO-SYNC-04 | `compile-request.json` is written and equals the frozen `NativeCompileRequest` sent to Rust; pins `jsx-elements.json` merged content (coverage-map note a) | RS-1 | `sync/native.ts`, `sync/index.ts` | file present; keys exactly `schemaVersion, spec, jsxHosts, sourceRoot, declarationRoot`; `jsxHosts` equals config `jsxElements` + generated primitives | `[decision D12]` |
| NEO-SYNC-05 | Consumer specifiers resolve: `@reference-ui/react` → `react.mjs`, `./styles.css`, `@reference-ui/system` → `system.mjs`, `/baseSystem` | none | `publish.ts`, `react.ts` package.json exports | `import.meta.resolve` / `createRequire` from the world | `[decision D5]`, generated-folder-shape §3 |
| NEO-SYNC-06 | Two consecutive syncs produce byte-identical folders | none (Rust is deterministic by claim) | none expected | hash every file twice | `[atm]` ATM-ORDER-* |
| NEO-SYNC-07 | Stale files from a previous sync are removed | none | `sync/index.ts` clean | plant a junk file; sync; gone | `[core]` clean behaviour |
| NEO-SYNC-08 | Config errors are loud and named: missing `include`, missing/unsafe `name`, bad `jsxElements`, `extends` entry without synced data | none | `config/validate.ts` (already) | node-side `sync()` on four bad worlds rejects with the documented messages | `[core]` validate tests, `[panda-v1]` `config/__tests__/validate-config.test.ts` (contrast) |
| NEO-SYNC-09 | `include` globs scope scanning: a `css()` outside `include` yields no utility | ATM-SITE-* | `compile-files.ts` | utility count | `[panda-v1]` `node/__tests__/glob-dirname.test.ts` |
| NEO-SYNC-10 | `extends: [upstream]` adopts upstream tokens, recipes, jsxElements; later fragment wins on the same leaf; arrays replace | RS-4 | `fragments/base/merge.ts`, `sync/index.ts` | two-system world: computed colour from upstream token; local override wins | `[panda-v1]` `config/__tests__/merge-config.test.ts` (contrast), Neo `merge.test.ts` |
| NEO-SYNC-11 | A compile diagnostic fails `sync` with file and line, and no folder is half-written | ATM-DIAG-01..03 | `sync/index.ts` | world with `{colors.nope}` (RS-3 located error; `display: true` warns by engine design); `sync()` rejects; message has `path:line` | `[atm]` DIAG |
| NEO-SYNC-12 | `@reference-ui/system` exports the authoring surface (`tokens`, `font`, `keyframes`, `globalCss`, `extendPattern`, `getRhythm`, `defineConfig`, `baseSystem`) and `getRhythm` returns the compiled rhythm root; decides the Book vite alias trap (coverage-map note e) | none | `publish.ts` system entry; `tsconfig.json` paths | node-side import; `getRhythm(4)` equals the token var/calc used in the sheet | `[decision D6]`, `[core]` core-api §2.1 |
| NEO-SYNC-13 | `styled` is data-only: no executable module besides `runtime-data.mjs`; `css()`/`recipe()` come from `react` and are bound to the owner | none | `publish.ts`, `react.ts` | forbidden `styled/css.mjs`; `react` exports `css`, `recipe`; `recipe` class carries `${system}__` | `[decision D4]` |

### 8.3 TOKEN (`tests/cases/token/`) — tokens, islands, refs

Owns `src/fragments/api/{tokens,font,keyframes}.ts`. Existing: `NEO-EDGE-02`
(radii tokens).

| id | claim | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- |
| NEO-TOKEN-01 | `{colors.x}` inside a multi-value shorthand resolves to `var(--colors-x)` | ATM-TOKEN-08 | — | `border: '2px solid {colors.red}'` → computed border-color | `[panda-v1]` `core/__tests__/style-decoder.test.ts` "should resolve references"; `[lib]` 3 leftover refs |
| NEO-TOKEN-02 | A missing `{colors.nope}` ref fails sync with a located diagnostic (no escaped literal) | RS-3 | `sync/index.ts` surfaces | `sync()` rejects; message names the ref and file:line | `[panda-v1]` `core/__tests__/serialize.test.ts` (contrast), `[decision D13]` |
| NEO-TOKEN-03 | `red.500/40` paints `color-mix(in oklch, var(--colors-red-500) 40%, transparent)` | ATM-TOKEN-03/06 | — | computed background-color vs `color-mix` reference element | `[panda-v1]` `core/__tests__/color-mix.test.ts`; `[lib]` 25 mixes |
| NEO-TOKEN-04 | `{colors.x/30}` inside a function value mixes inside the function | ATM-TOKEN-06/08 | — | `boxShadow: '0 0 0 3px {colors.x/30}'` computed | `[panda-v1]` `color-mix.test.ts` "curly" |
| NEO-TOKEN-05 | Token leaves `{ light, dark }` become `:root,[data-color-mode=light]` and `[data-color-mode=dark]` islands; flipping `data-color-mode` on an ancestor repaints | ATM-COND-03/08 | none — Neo already stamps it; engine via RS-7 (D1) | computed colour under `light` then `dark` on `html` and on a nested island | `[atm]` P0 #1; `[lib]` islands; `[panda-v1]` `generator/__tests__/generate-token.test.ts` (`:where([data-theme=dark], .dark)` contrast) |
| NEO-TOKEN-06 | Semantic alias chains stay `var()` references, not inlined hex | ATM-TOKEN-11 | — | sheet has `--colors-danger: var(--colors-red-500)`; computed equal | `[panda-v1]` `generate-token.test.ts` "reuse css variable in semantic token alias", `token-dictionary/__tests__/alias.test.ts` |
| NEO-TOKEN-07 | Decimal and fraction rhythm keys escape in var names and classes (`--spacing-0\.5r`, `--spacing-1\/2r`, `.p_1\/2r`) | ATM-RHYTHM-03, ATM-NAME-* | — | computed padding for `0.5r` and `1/2r` | `[lib]` L1822–1823; `[panda-v1]` `shared/__tests__/esc.test.ts` |
| NEO-TOKEN-08 | Negative rhythm/token values are `calc(var(--spacing-4r) * -1)` | ATM-TOKEN-07, ATM-RHYTHM-04 | — | computed margin negative | `[lib]` 368 negatives; `[panda-v1]` `token-dictionary/__tests__/spacing.test.ts` |
| NEO-TOKEN-09 | `_private` token subtrees are usable inside the owning system | ATM-TOKEN-09? (cook verifies) | `tokens.ts` header contract | computed colour from `_private.secret`; declaration present in owner types | Neo `tokens.ts`, typegen golden `'_private.secret'` |
| NEO-TOKEN-10 | `font()` registry emits `--fonts-*` and `--font-weights-*` and the `font: 'sans'` macro paints family + weight | ATM-COND-05/16 (macros) | `font.ts` | computed font-family and weight | `[lib]` L2173–2191; `[core]` font registry |
| NEO-TOKEN-11 | `keyframes()` emits `@keyframes` in `@layer global` and `animations` tokens reference them | ATM-LAYER-05 | `keyframes.ts` | `getComputedStyle().animationName`; `@keyframes` present once | `[panda-v1]` `generator/__tests__/generate-keyframes.test.ts`; `[lib]` 31 keyframes |
| NEO-TOKEN-12 | Multiple refs in one value (`padding: '{spacing.1r} {spacing.2r}'`) all resolve | ATM-TOKEN-08 | — | computed padding pair | `[panda-v1]` `serialize.test.ts` "expand multiple references" |
| NEO-TOKEN-13 | Keyframe bodies resolve token refs and rhythm | ATM-LAYER-05 | `keyframes.ts` | animated element's computed value at end state | `[panda-v1]` `generate-keyframes.test.ts` "should allow tokens" |

Approved absences to write in SPEC: `colorPalette` (D14), `token()` (D15),
composite shadow/gradient/border/asset **token objects** (lib has none; authors
write strings — revisit only if a fragment author asks), Panda `themes` JSON,
`:where(html)` selector spelling, hashed var names, `formatTokenName`.

### 8.4 COND (`tests/cases/cond/`) — pseudo, nesting, attribute conditions

Owns `src/runtime/css/**` (serialised). Existing: `NEO-EDGE-01`
(hover/focus/disabled via data attrs).

| id | claim | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- |
| NEO-COND-01 | `_hover` matches both `:hover` and `[data-hover]` (one `:is()` wrap) | ATM-COND-02/10 | — | real `page.hover()` paints; `data-hover` paints; sheet has one selector | `[panda-v1]` `core/__tests__/atomic-rule.test.ts` "simple grouped condition"; `[lib]` `:is(:hover,[data-hover])` ×26 |
| NEO-COND-02 | `_hover: { bg: { sm: { _dark } } }` composes hover × container × theme in one rule | ATM-COND-02/03/01 | — | paints only with all three; sheet nests `@container` outside the selector | `[panda-v1]` `atomic-rule.test.ts` "nested > property" |
| NEO-COND-03 | `_hover: { _disabled: … }` chains two `:is()` lists; `_disabled` list includes `[aria-disabled=true]` | ATM-COND-10 | — | paints only when both; `aria-disabled` alone + hover paints | `[panda-v1]` `atomic-rule.test.ts` "nested > nested"; `[lib]` L454 |
| NEO-COND-04 | `_light`/`_dark` utilities flip with `data-color-mode` on any ancestor | ATM-COND-03/08 | D1 | toggle attribute on `html`, then on a nested wrapper | `[atm]` P0 #1; `[panda-v1]` `atomic-rule.test.ts` "respect color mode" (four-way contrast) |
| NEO-COND-05 | Parent combinator key `'input:hover &'` paints the sibling when the input is hovered | ATM-COND-09/14 | — | hover input; computed on sibling | `[panda-v1]` `atomic-rule.test.ts` "parent selector" |
| NEO-COND-06 | Child key `'& > p'` keeps the combinator; grandchildren do not paint | ATM-COND-14 | — | computed on child vs grandchild | `[panda-v1]` `atomic-rule.test.ts` nested selector; `[lib]` 14 child selectors |
| NEO-COND-07 | Attribute key with quotes `"&[data-state='open']"` plus `_expanded` list round-trips escaping | ATM-COND-09, ATM-NAME-* | — | paints with the attribute; class string escapes `\'`/`\"` | `[panda-v1]` `rule-processor.test.ts` "css" attr test; `[lib]` `[data-slot=\"…\"]` utilities |
| NEO-COND-08 | `_before`/`_after` with quoted `content` paint and sort after pseudo-classes | ATM-COND-*, ATM-LEAF-10 | — | `getComputedStyle(el, '::before').content`; sheet order | `[panda-v1]` `conditions.test.ts` "pseudo-elements sort"; `[lib]` Trace D |
| NEO-COND-09 | Comma key `'&:focus, &:hover'` splits into two selectors on one class | ATM-COND-14 | — | focus alone paints; hover alone paints | `[panda-v1]` `atomic-rule.test.ts` "outlier" |
| NEO-COND-10 | Parent-of-self `':focus > &'` paints the child when the parent has focus | ATM-COND-14 | — | focus parent; computed child | `[panda-v1]` `atomic-rule.test.ts` "outlier" |
| NEO-COND-11 | `_groupHover` / `_peerFocus` paint from an ancestor `.group` / preceding `.peer` | ATM-COND-09 | — | hover the group; focus the peer | `[atm]` P1 #13 |
| NEO-COND-12 | `_motionReduce`, `_osDark`, `_print` lower to the preset `@media` lists | ATM-COND-11 | — | `page.emulateMedia({ reducedMotion, colorScheme, media })` | `[atm]` P1 #12; `[lib]` reduced-motion in reset |
| NEO-COND-13 | Unknown `_hovr` yields a warning, no utility, no ghost class, and sync still succeeds | ATM-COND-12 | `sync` surfaces warnings | utility count unchanged; warning text captured | `[atm]` COND-12 |
| NEO-COND-14 | `_placeholder`, `_file`, `_checked` use the lib twin lists (`[data-placeholder]`, `::file-selector-button`, `[data-state="checked"]`) | ATM-COND-10 | — | computed on input placeholder / file button / checked twin | `[lib]` L538, `::file-selector-button` ×3 |
| NEO-COND-15 | Mixed `@supports` + `@container` + `&:hover` in one nested key emits at-rules outside and sorts deterministically | ATM-ORDER-* | — | paints only when all hold; sheet order stable across syncs | `[panda-v1]` `rule-processor.test.ts` "mixed vs at-rule" |

Approved absences: `[dir=rtl]`/`_ltr` (lib 0; revisit with an author), Panda
multi-block `@slot` condition objects, config-defined custom conditions
(Neo has no `conditions` table by design).

### 8.5 RESP (`tests/cases/resp/`) — container breakpoints and arrays

Owns `src/runtime/css/lowerResponsiveStyles.ts` (serialised). Existing:
`NEO-CSS-02` (responsive lowering).

| id | claim | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- |
| NEO-RESP-01 | `width: ['50px', '60px']` maps index → base, first breakpoint (`@container`) | ATM-LEAF-05, ATM-COND-01 | `lowerResponsiveStyles.ts` | resize the container element; computed width flips | `[panda-v1]` `atomic-rule.test.ts` "responsive array" |
| NEO-RESP-02 | `['50px', null, '60px']` skips the middle breakpoint | ATM-LEAF-05 | same | at `sm` width unchanged; at `md` changes | `[panda-v1]` `atomic-rule.test.ts` "array with gaps"; `[atm]` P1 #10 |
| NEO-RESP-03 | `base` key is the unprefixed class | ATM-COND-01 | — | computed at narrow width | `[panda-v1]` `atomic-rule.test.ts` "skip `_` notation" |
| NEO-RESP-04 | Nested `sm: { md: … }` requires both queries | ATM-COND-01 | — | three widths | `[panda-v1]` `complex-rule.test.ts` |
| NEO-RESP-05 | Range conditions `mdDown`, `mdOnly`, `smToLg` bound the query and never overlap at the boundary | ATM-COND-13 | — | computed at boundary±1px | `[panda-v1]` `breakpoints.test.ts` epsilon; `[atm]` P1 #11 |
| NEO-RESP-06 | Queries are ordered mobile-first: min-width ascending, then max-width descending | ATM-ORDER-* | — | sheet order + cascade at overlapping widths | `[panda-v1]` `sort-mq.test.ts` |
| NEO-RESP-07 | Without a container-type ancestor, container utilities do **not** apply; with `container: true` on the root they do | ATM-COND-15/16 | — | two worlds or two subtrees | `[atm]` P0 #2; `[lib]` `body { container-type: inline-size }` |
| NEO-RESP-08 | Numeric custom key `r={{ 300: … }}` lowers to a concrete `@container (min-width: 300px)` | ATM-COND-07 | `lowerResponsiveStyles.ts` | resize | `[atm]` COND-07 |
| NEO-RESP-09 | `css()` at runtime and build time lower the same responsive sugar to the same class | ATM-COND-01 | `css.ts` | node-side class equality (extends CSS-02) | Neo CSS-02 |

Approved absences: `@media screen` viewport breakpoints (D8), `hideFrom`/
`hideBelow` helpers, `{sizes.x}` inside a query (no size tokens in the dialect).

### 8.6 CSS (`tests/cases/css/`) — value grammar and `css()` runtime

Owns `src/runtime/css/css.ts`, `plans.ts` (serialised). Existing:
`NEO-CSS-01` (runtime paints from plans), `NEO-CSS-02` (see RESP).

| id | claim | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- |
| NEO-CSS-03 | Shorthand alias `w` last-wins over a responsive `width` object | ATM-MERGE-*, ATM-SHORT-* | `plans.ts` slot merge | computed width at all widths | `[panda-v1]` `atomic-rule.test.ts` "should resolve shorthand" |
| NEO-CSS-04 | Unitless numbers: `opacity: 1`, `zIndex: 0`, `width: 42` → `42px`, `--foo: 42` | ATM-UNIT-01/02 | — | computed each | `[panda-v1]` `rule-processor.test.ts` "unitless" |
| NEO-CSS-05 | `null`, `false`, `undefined` leaves emit nothing and no ghost class | ATM-LEAF-03, ATM-GHOST-02 | `css.ts` | utility count; class string | `[panda-v1]` `rule-processor.test.ts` "ignores null" |
| NEO-CSS-06 | Token refs inside function values (`linear-gradient({colors.a}, {colors.b})`) resolve | ATM-TOKEN-08 | — | computed background-image | `[panda-v1]` `gradient.test.ts` |
| NEO-CSS-07 | Arbitrary values (`rgba(…)`, `color-mix(in oklch, currentColor 14%, transparent)`, `calc(…)`) are one class each and paint | ATM-NAME-*, ATM-LEAF-* | — | computed; exactly one utility | `[lib]` L27446 |
| NEO-CSS-08 | `!important` spellings — `'red!'`, `'red !important'`, `'red!IMPORTANT'`, and quoted `content: '"hello!"'` (not important) | ATM-LEAF-09/10 | `css.ts` strip rule (today only trailing `!`) | important beats a later plain utility; content string intact | `[atm]` P0 #5; `[panda-v1]` `atomic-rule.test.ts` "respect important syntax", `shared/src/important.ts` |
| NEO-CSS-09 | Escaping grammar round-trips: dots, slashes, brackets, parens, percent, quotes, commas in class names | ATM-NAME-01..07 | — | each class in DOM matches a sheet rule (computed) | `[lib]` §3 grammar row; `[panda-v1]` `classname.test.ts`, `esc.test.ts` |
| NEO-CSS-10 | Macros `size`, `font`, `weight` expand to multiple declarations from one prop | ATM-COND-05/16 | — | width+height; family+weight | `[atm]` P1 #9; `[lib]` `size_` → width+height |
| NEO-CSS-11 | Authored custom properties keep casing (`--testVariable0`) | ATM-NAME-* | — | `getPropertyValue('--testVariable0')` | `[panda-v1]` `rule-processor.test.ts` "preserves casing" |
| NEO-CSS-12 | Rhythm values `4r` → `var(--spacing-4r)`, `3.5r` → `calc(3.5 * var(--spacing-root))`, `1/2r` fraction | ATM-RHYTHM-01..05 | — | computed px at a known root | `[lib]` Trace B/E; `[atm]` P1 #8 |

Approved absences: `hideFrom`/`hideBelow`, custom utilities with shared
class names, `@scope`, `token()`.

### 8.7 MERGE (`tests/cases/merge/`) — last-wins, slots, ghosts

Owns `src/runtime/css/plans.ts` (serialised).

| id | claim | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- |
| NEO-MERGE-01 | Two `css()` args: later wins per slot; both atoms exist in the sheet | ATM-MERGE-01 | `plans.ts` | computed colour = second arg | `[atm]` P0 #7 |
| NEO-MERGE-02 | Alias vs longhand (`bg` then `background`) resolve to one slot; last wins | ATM-MERGE-02 | `plans.ts` | computed | `[atm]` MERGE-02 |
| NEO-MERGE-03 | Shorthand then longhand (`padding` then `paddingTop`) cascade correctly regardless of sheet order | ATM-SHORT-01/06, ATM-ORDER-04 | — | computed four sides | `[atm]` P0 #4; `[panda-v1]` `rule-processor.test.ts` border example |
| NEO-MERGE-04 | `borderBottom: '1px solid'` does not clobber `borderColor` with `currentColor` | ATM-SHORT-01 | — | computed border-bottom-color | `[atm]` P0 #4 |
| NEO-MERGE-05 | A conditional object arg (`{ _hover: … }`) merges with a base arg at the condition slot | ATM-MERGE-03 | `plans.ts` | hover paints merged value | Neo `plans.test.ts` |
| NEO-MERGE-06 | Runtime value with no compiled atom yields no class and exactly one dev diagnostic — never a ghost class | ATM-GHOST-02 | `css.ts` | class string empty for that prop; console captured once | `[atm]` GHOST; `[decision D11]` |
| NEO-MERGE-07 | An `!important` atom beats a later plain atom in the same slot | ATM-LEAF-09 | `plans.ts` | computed | `[panda-v1]` `global-css.test.ts` important |
| NEO-MERGE-08 | Shorthand remap with an `undefined` longhand keeps only the defined value (`flexDir` + `flexDirection: undefined`) | ATM-LEAF-* | `css.ts` | computed flex-direction; one utility | `[panda-v1]` `shared/__tests__/walk-object.test.ts` |

### 8.8 RECIPE (`tests/cases/recipe/`) — variants and identity

Owns `src/runtime/recipe/**`. Existing: `NEO-RECIPE-01` (compound variants).

| id | claim | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- |
| NEO-RECIPE-02 | `defaultVariants` apply when a variant is omitted | ATM-RECIPE-04 | `recipe.ts` | computed height from default size | `[panda-v1]` `recipe.test.ts` defaults; `[atm]` P2 #17 |
| NEO-RECIPE-03 | Boolean variants `true`/`false` select distinct classes | ATM-RECIPE-04 | `recipe.ts` | computed display for each | `[panda-v1]` `rule-processor.test.ts` "cva boolean variant" |
| NEO-RECIPE-04 | Compound variants emit after simple variants and require every predicate | ATM-RECIPE-05 | — | on/off combinations (deepens RECIPE-01 with hover+dark compound) | `[panda-v1]` `static-css.test.ts` compound; `[atm]` RECIPE-05 |
| NEO-RECIPE-05 | `recipe(...).raw(props)` returns a style object that `css()` can paint identically | ATM-RECIPE-* | `recipe.ts` | computed equality of two nodes | `[decision D16]`, `[core]` cva.raw |
| NEO-RECIPE-06 | Class identity is `${system}__${className}`; duplicate `className` in one system fails sync | ATM-RECIPE-06 | `sync` | class prefix in DOM; `sync()` rejects on duplicate | `[atm]` P2 #18 |
| NEO-RECIPE-07 | A recipe defined as a non-object-literal fails sync with a located diagnostic | ATM-RECIPE-06 | `sync` | `sync()` rejects | `[atm]` RECIPE-06 |
| NEO-RECIPE-08 | Responsive variant value `{ base: 'solid', md: 'outline' }` switches at the container width | ATM-RECIPE-* (cook verifies; else RS) | `recipe.ts` | resize | `[panda-v1]` `recipe.test.ts` "responsive variant"; typegen `ConditionalValue` |
| NEO-RECIPE-09 | `_hover` inside a variant paints on the variant class, not a separate atom | ATM-RECIPE-02 | — | hover computed; utility count | `[panda-v1]` `recipe.test.ts` solid hover |
| NEO-RECIPE-10 | Variant + `css()` utilities on the same node: utilities win via layer order | ATM-RECIPE-03, ATM-LAYER-* | — | computed | `[atm]` P2 #19 |

Approved absences: slot recipes/`sva` (D9), `cva` name (D3), `@layer
recipes._base` inner layer spelling, Panda static recipe expansion.

### 8.9 LAYER (`tests/cases/layer/`) — cascade layers and packages

Owns `src/sync/publish.ts` (CSS assembly only).

| id | claim | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- |
| NEO-LAYER-01 | The order statement names all six layers `reset, global, base, tokens, recipes, utilities`; bodies of empty layers may be omitted (ATM-LAYER-02) yet a utility still beats a token-layer rule of higher specificity | ATM-LAYER-02..04 | — | computed cascade | `[lib]` L70; `[panda-v1]` `core/src/layers.ts` |
| NEO-LAYER-02 | Two systems: package layers nest under `@layer <name>`; a downstream system's utility overrides an upstream recipe; portable tokens are scoped by `[data-layer]` | RS-4 | `publish.ts` | two-system world; computed | `[atm]` P1 #16; contracts portable fixture |
| NEO-LAYER-03 | `@keyframes` and `@font-face` live in `global`, once | ATM-LAYER-05/06 | — | sheet count; animation runs | `[lib]` 31/3; global-css research §6.4 |
| NEO-LAYER-04 | `normalizeCss: true` (default) opens with the reset layer; `false` omits it | ATM-LAYER-08 (reset comes from the dump) | `sync/index.ts` puts the reset content into the spec only when the flag is true | `box-sizing` computed on a plain `div`; reset absent in second world | global-css research §6.3 |
| NEO-LAYER-05 | Recipe rules precede utilities; a utility overrides a recipe base of equal specificity | ATM-RECIPE-03 | — | computed | `[atm]` RECIPE-03 |
| NEO-LAYER-06 | Token layer vars are visible to recipes and utilities (`var(--colors-…)` resolves) | ATM-LAYER-* | — | computed | `[lib]` |

### 8.10 GLOBAL (`tests/cases/global/`) — `globalCss()` and reset

Owns `src/fragments/api/globalCss.ts`.

| id | claim | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- |
| NEO-GLOBAL-01 | Trace A: token ref + literal `:focus-visible` selector in `globalCss` paints | ATM-LAYER-03 | — | focus element; computed outline colour | global-css research Trace A |
| NEO-GLOBAL-02 | Trace B: rhythm aliases + `containerType` on `body` + `:root` var merge | ATM-LAYER-03, ATM-COND-16 | — | computed padding; `container-type` | Trace B |
| NEO-GLOBAL-03 | Trace C: nested `&` + `_hover`/`_disabled`/`_focusVisible` twins on a tag recipe (`.ref-button`) | ATM-LAYER-03, ATM-COND-10 | — | hover/focus/disabled twins | Trace C; `[lib]` L461–475 |
| NEO-GLOBAL-04 | Trace D: `_before`/`_after` with token colour | ATM-LAYER-03 | — | `::before` computed | Trace D |
| NEO-GLOBAL-05 | Trace E: `undefined` entries strip; `_placeholder`; rhythm token vs calc | ATM-LAYER-03 | `globalCss.ts` JSON drop | no `display` rule; placeholder colour | Trace E |
| NEO-GLOBAL-06 | `'& ~ &'` under a comma selector becomes `:is()` siblings | ATM-COND-14 | — | second sibling margin | `[panda-v1]` `global-css.test.ts` "complex recursive nesting" |
| NEO-GLOBAL-07 | Nested `@media` inside `globalCss` (and `@container`) wraps the rule | ATM-COND-11 | — | `emulateMedia` | `[panda-v1]` `global-css.test.ts` "nested at-rule" |
| NEO-GLOBAL-08 | `font()` emits `@font-face` with `src` lists, `size-adjust`, `descent-override` | RS-2 | `font.ts` | sheet text (allowed: font loading is not asserted) + `document.fonts.check` | global-css research §6.4; `[panda-v1]` `global-fontface.test.ts` |
| NEO-GLOBAL-09 | No `--made-with-panda`, no `*` transform/filter var dump, no `global.css` file | none | `publish.ts` | negative sheet + fs assertions | `[decision D2,D7]` |
| NEO-GLOBAL-10 | `:has()` selectors pass through and match | ATM-LAYER-03 | — | field bezel reacts to inner `aria-invalid` | `[lib]` `:has(` ×8, L1044 |
| NEO-GLOBAL-11 | Vendor pseudo-elements (`::-webkit-slider-thumb`, `::file-selector-button`) pass through unchanged | ATM-LAYER-03 | — | sheet text + computed where Chromium exposes it | `[lib]` vendor list |
| NEO-GLOBAL-12 | Colour mixes inside `globalCss` hover rules (`color-mix(in oklch, … 15.2%, …)`) paint | ATM-TOKEN-06 | — | hover computed | `[lib]` L477–481 |

### 8.11 STATIC (`tests/cases/static/`) — pre-generated atoms

Owns nothing in `src/` (engine + world only).

| id | claim | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- |
| NEO-STATIC-01 | Declared static values × conditions exist in the sheet with no call site | ATM-STATIC-01/02 | — | runtime `css({ color: pickAtRuntime })` paints because the atom exists | `[panda-v1]` `static-css.test.ts` "works" |
| NEO-STATIC-02 | Wildcard `*` expands a token category | ATM-STATIC-02 | — | count = token count | `[panda-v1]` `static-css.test.ts` |
| NEO-STATIC-03 | A runtime value outside the static set yields the MERGE-06 diagnostic, not a ghost; an unsatisfiable `staticCss` request fails sync with a diagnostic | ATM-STATIC-03, ATM-GHOST-02 | — | no class; diagnostic | `[atm]` P1 #14 |

### 8.12 SITE (`tests/cases/site/`) — extraction shapes through Neo

Owns `src/sync/compile-files.ts`, `src/sync/jsx-elements.ts`.

| id | claim | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- |
| NEO-SITE-01 | Literal ternary: both arms compile; the runtime-chosen arm paints; the other atom exists unused | ATM-SITE-05 | — | computed + sheet count | `[decision D11]`; `[panda-v1]` `parser/__tests__/output.test.ts` L878 |
| NEO-SITE-02 | Local `const` style object passed to `css()` compiles | ATM-SITE-06 | — | computed | `[panda-v1]` `extractor/__tests__/unbox.test.ts` L4304 |
| NEO-SITE-03 | Identifier spread `...rest` unpacks known keys | ATM-SITE-11 | — | computed both | `unbox.test.ts` L4328 |
| NEO-SITE-04 | Import alias `css as c` and namespace `ui.css` are sites | ATM-SITE-15 | — | computed | `[panda-v1]` `css-2.test.ts` L310, `namespace.test.ts` |
| NEO-SITE-05 | A local function named `css` is not a site | ATM-SITE-10 | — | no utility; no diagnostic noise | contrast Panda `cssParser` |
| NEO-SITE-06 | Dynamic call value `color: pick()` mints no ghost and emits a located diagnostic (warning), sync succeeds | ATM-LEAF-07, ATM-FORBID-02 | `sync` surfaces | utility count; warning text | `[decision D11]`; `extract.test.ts` L3223 |
| NEO-SITE-07 | Cross-file `const` from `styles.ts` resolves | ATM-SITE-16 | `compile-files.ts` include | computed | `css-raw-spread.test.ts` L423 |
| NEO-SITE-08 | Logical `...(ok && extra)` with const `ok` lands `extra` | ATM-SITE-05 | — | computed | `extract.test.ts` logical |
| NEO-SITE-09 | String `@media (min-width: 400px)` key is an at-rule, not a selector | ATM-COND-11 | — | `setViewportSize` | `[atm]` COND-11 |
| NEO-SITE-10 | `css={{}}` on a primitive equals `css()` | ATM-SITE-14 | — | class equality | `[atm]` SITE-14 |
| NEO-SITE-11 | Configured `jsxElements: ['Chart']` makes `<Chart p="1r">` a host | ATM-SITE-08 | `jsx-elements.ts` | computed | Neo config |
| NEO-SITE-12 | Unlisted PascalCase `<Random fontSize>` and lowercase `<div color>` are **not** hosts | ATM-SITE-08 | — | no utilities | anti-goal `output.test.ts` L3057 |
| NEO-SITE-13 | Boolean attr `<Div border />` compiles the boolean macro form | ATM-SITE-09 | — | computed border | `[atm]` SITE-09 |
| NEO-SITE-14 | With no hosts resolvable, sync emits the SITE-13 diagnostic instead of scanning every tag | RS-5 | `sync` | diagnostic present; no stray utilities | `[atm]` SITE-13 open |

Approved absences: tagged templates (engine station only), Vue/Svelte, compiled
JSX runtimes, `importMap`, `matchTag`, `token()` inlining, `css.raw`.

### 8.13 PRIM (`tests/cases/prim/`) — native primitives

Owns `src/primitives/**`, `src/sync/react.ts`. Existing: `NEO-PRIM-01`.

| id | claim | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- |
| NEO-PRIM-02 | `css` prop and sibling StyleProps both paint; `css` slot wins on conflict | ATM-SITE-14 | `split.ts` | computed | `[panda-v1]` `output.test.ts` L74–88 |
| NEO-PRIM-03 | `_hover={{ color }}` prop paints on hover | ATM-COND-02 | — | hover | `jsx.test.ts` conditions |
| NEO-PRIM-04 | Array StyleProp `p={['1r','2r']}` is responsive | ATM-LEAF-05 | — | resize | `output.test.ts` L2441 |
| NEO-PRIM-05 | `data-layer`: first primitive stamps, nested inherit without restamp, a second system's primitive inside restamps its own name | none | `context.ts` | DOM attributes across a three-level tree | `DOMAIN.md`; Neo `context.test.ts` |
| NEO-PRIM-06 | `variant="x"` stamps `data-variant` and applies the recipe class; `variant` and `colorMode` are not style props | none | `factory.ts` | DOM + class | ABI §4.3 |
| **NEO-PRIM-07** | `colorMode="dark"` stamps **`data-color-mode="dark"`**; token islands and `_dark` utilities beneath repaint; nested `colorMode="light"` island flips back | ATM-COND-03/08 (+RS-7 emit) | none — already stamps (D1) | computed colours at three depths | `[decision D1]`; `[atm]` P0 #1 |
| NEO-PRIM-08 | DOM passthrough: `id`, `aria-*`, `data-*`, event handlers, `ref` reach the element; style props never leak as attributes | none | `factory.ts` | attributes + a click handler | Neo PRIM-01 extends |
| NEO-PRIM-09 | Every one of the 101 tags renders its own element name | none | `tags.ts` | `tagName` census in one world | `[core]` tag set |
| NEO-PRIM-10 | Generated entry exposes the 101 tags, `css`, `recipe`, and every type name consumers import today (`StyleProps`, `PrimitiveProps`, `PrimitiveElement`, `PrimitiveTag`, `RecipeVariantProps`, `SystemStyleObject`, `CssStyles`, font registry types) | none | `react.ts`, `generate.ts` | import census node-side | generated-folder-shape §7 items 2–4 |

### 8.14 TYPE (`tests/cases/type/`) — generated declarations

Owns `src/sync/publish.ts` (types publish), `tsconfig.json` `paths`. Specs run
`tsc --noEmit -p world/tsconfig.json` **after sync**, with `paths` pointing at
the generated `.reference-ui/**/*.d.mts` (the harness typecheck keeps using the
stable surface; this is the second, real check).

| id | claim | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- |
| NEO-TYPE-01 | Generated `react.d.mts` compiles a consumer world using primitives, `css`, `recipe` and named types | typegen (`emitDtsSync`) | `publish.ts` writes `styled/types`, react types reference them | tsc exit 0 | `[core]` `.reference-ui/types`; generated-folder-shape §4 |
| NEO-TYPE-02 | Token unions are real: `color="brand"` ok, `color="nope"` is a TS error (TS2322) when the prop is token-typed | typegen strict? (cook verifies default) | — | tsc exit ≠ 0 with the code | `[panda-v1]` `generate-token-dts.test.ts`; typegen goldens |
| NEO-TYPE-03 | Recipe variant props type as `ConditionalValue`-style unions; wrong variant is an error | typegen | — | tsc | `generate-recipe.test.ts` |
| NEO-TYPE-04 | Condition keys `_hover`, `sm`, and arrays with `null` typecheck | typegen | — | tsc | typegen `styles.d.ts` `StylePropValue` |
| NEO-TYPE-05 | `@reference-ui/system` authoring calls typecheck in a fragment file (`tokens`, `font`, `keyframes`, `globalCss`, `getRhythm`) | none | `system.d.mts` | tsc | `[decision D6]` |
| NEO-TYPE-06 | No `@pandacss/*` import anywhere in generated declarations | none | — | rg over `.reference-ui` | §4.1 forbidden |

Approved absences: `strictTokens`/`WithEscapeHatch` hatches (D17), pattern and
jsx-factory types.

### 8.15 PARITY (`tests/cases/parity/`) — W4, the lib-shaped world

No `src/` ownership. One world: a **mini-lib** authored the way
`packages/reference-lib/src` is (tokens with light/dark, `font()`,
`keyframes()`, ~8 `.ref-*` tag recipes via `globalCss()`, two `recipe()`s,
primitives, a field bezel with `data-slot`, one `container: true` region).

| id | claim | proof | evidence |
| --- | --- | --- | --- |
| NEO-PARITY-01 | The mini-lib syncs and six representative components paint in light and dark | computed styles, `data-color-mode` flip | all groups |
| NEO-PARITY-02 | Family census: every family in `lib-sheet-styles-css.md` §3 and `lib-sheet-global-css.md` §3 is present in the Neo sheet or listed as an approved absence; the absence list in the spec equals the union of group SPEC absences | node-side census over the sheet with a checked-in family table | bar 1 |
| NEO-PARITY-03 | Consumer census: every specifier in `generated-folder-shape.md` §3 resolves from the world | node-side resolve | bar 1 |
| NEO-PARITY-04 | No panda-isms: no `panda`, `data-panda-theme`, `--made-with-panda`, `@pandacss` in the generated folder | rg | §4.1 |

---

## 9. Harness touches (W0 only, captain-owned)

Keep the harness thin. Allowed in this voyage:

1. `agentneo run <prefix>` — run every case whose id starts with the prefix
   (`pnpm agentneo run NEO-COND`). Exact id still wins.
2. `agentneo run` prints sync duration per case (`sync 212ms`) so cooks can see
   engine cost.
3. `agentneo status` — summarise `last-run.json` by group: pass/fail counts.
4. `tsconfig.json` `paths` gains `@reference-ui/system` → a stable
   `system-surface.d.ts` (mirrors the react surface approach) so worlds can
   import the authoring API under the pre-run typecheck.
5. `tests/cases/README.md` rewritten for groups/SPEC/TESTS (drop "worlds are
   static until the host exists").

Not allowed: per-case build/typecheck flags, headed mode, retries, parallel
case execution, snapshot auto-update, any new dependency.

---

## 10. Prompts and protocols

Copy these; fill the brackets. Every child gets the boundary line and the
ownership map. Children do not read this whole file; the captain pastes what
they need.

### 10.1 Scout prompt

```
You are a read-only scout for reference-neo. Question: [one question].
Read: [paths]. Do not create, modify, or delete repository files except
writing your report to packages/reference-neo/docs/evidence/[name].md.
Report shape: 1) executive summary (≤ 12 lines, every claim cited with
path:line); 2) inventory table; 3) findings by family with input → expected
output; 4) implications for Neo cases (ids if they exist); 5) out of scope
with reasons. Counts must come from rg; say the command.
```

### 10.2 Cartographer prompt

```
You are the cartographer for group [GROUP] of reference-neo. Write
tests/cases/[group]/SPEC.md and TESTS.md per PLAN.md §4.6, starting from the
reserved rows in PLAN.md §8.[n] and the evidence in docs/evidence/[files].
For each row confirm the engine station exists (ls packages/reference-rs/
modules/atomic/tests/cases/[ATM id]; read its README) or mark RS-n. Write
approved absences with reasons for every lib family or Panda test in this
group's area that will not become a case. You write no code, no worlds, no
specs. You may append ids; never renumber. Report: the two files' paths, the
row count by status, and any RS-n you added.
```

### 10.3 Line cook prompt

```
You own slice [NEO-ids] in group [GROUP] of reference-neo. Read
tests/cases/[group]/SPEC.md, the TESTS.md rows, the cited docs/evidence/
sections (start at docs/evidence/README.md), and the cited ATM station
READMEs. Work in the shared checkout. You may edit
only: tests/cases/[group]/** and [owned modules from PLAN §5.2]. Never touch
tests/shared, other groups, packages/reference-rs, reference-core,
reference-lib. No git, no installs.
Rungs: R1 engine — run the station (pnpm agentrs v atomic -t "[ATM id]") or a
throwaway Vitest under /tmp against @reference-ui/rust/atomic compile(); write
down exactly what the engine emits for your input. If wrong or missing, add an
RS-n row to TESTS.md with input/expected/waiting case, set the row
blocked-on-rs, and stop. R2 host — change only your owned modules, add or
extend colocated Vitest, keep pnpm agentneo q at 0 errors. R3 proof — create
the case folder(s) (case.json with "sync": true, README whose first line is
the claim and which carries evidence tags, world authored like a lib author
would, specs asserting computed style or DOM — sheet text only alongside).
Run: pnpm agentneo run [id] for each case, then pnpm agentneo run [GROUP
prefix], then pnpm agentneo q, then pnpm --filter @reference-ui/neo exec
vitest run src. Set TESTS.md rows to done. Finish with the completion report
(PLAN §10.5). No report, not done.
```

### 10.4 RS liaison prompt

```
You are the RS liaison for reference-neo slice RS-[n]: [one line]. Use the
agent-rs skill (.agents/skills/agent-rs/SKILL.md) exclusively. Input: [style
object / fragment]. Expected CSS: [block]. Make it a proper station: SPEC row,
tests/cases/ATM-[fam]-[nn] with README and golden, Rust change under the
quality limits, no clippy allows. Run pnpm agentrs v atomic -t "[id]" then
pnpm agentrs q. Do not touch packages/reference-neo. Report: station id,
files changed, golden path, and the exact CSS emitted for the Neo case input.
```

### 10.5 Completion report (cook and liaison)

```
slice: [ids]            group: [GROUP]         status: done | blocked-on-rs RS-n
R1 engine: [station ids run] → [what it emitted, 3–8 lines or a path to /tmp]
R2 host: [files changed with one line each] | none
R3 proof: [case ids] — pnpm agentneo run [id] → PASS (n ms) ...
gate: agentneo q → 0 errors, [n] warnings; vitest → [n] passed
evidence tags on README: [tags]
decisions touched: [Dn] | none
proposed edits outside my ownership: [DOMAIN.md line…, PLAN §…] | none
open questions for the captain: [≤ 3] | none
```

### 10.6 Oracle prompt and verdict

```
You are the oracle for slice [ids]. Read the completion report, the diff
(git diff -- [paths]), the case README/world/specs, the cited station
README, and the docs/evidence/ sections the README's tags point at. Rerun: pnpm agentneo run [id]; pnpm agentneo run [GROUP prefix];
pnpm agentneo q. Then try to break the claim: change the world input to the
neighbouring wrong value in /tmp and confirm the spec would fail; check the
assertion is computed-style/DOM, not sheet-only; check no file outside the
ownership map changed; check evidence tags cite real files/tests; check the
README first line states one claim; check no panda-ism, no data-color-mode,
no any, no suppression. Verdict: pass | pass-with-notes | fail (reason). One
paragraph, then the verdict word. You edit nothing.
```

### 10.7 Planner prompt

```
You are the planner opening wave [Wn] of reference-neo. Read PLAN.md §[wave
section], its gate criteria (PLAN §7.2), the §7.3 status row, and the cited
docs/evidence/ sections. Then inspect reality: ls the engine stations and
group folders the wave touches, read the code it will change, and check what
already exists (do not trust the plan's memory of the tree). Return: 1) one
scoped prompt per worker in the §10 shapes with owners and disjoint files;
2) sequencing (what unblocks what, what runs parallel); 3) role assignments
per the §6.7 matrix; 4) anything in the wave's plan section that reality
contradicts, quoted. Flight orders, not strategy: you re-scope, never
re-decide. You edit nothing.
```

### 10.8 Stage handover report (oracle)

```
wave: [Wn]              gate: [Gn] PASS | HELD (reason)
slices landed: [ids + one line each] | none (research/cartography)
learnings absorbed: [doc edit list: file, section, new text] | none
course corrections: [proposed plan edits needing the human, with why] | none
next work: [unblocked waves/slices in sequence, with shape changes] | voyage complete
open risks: [≤ 3, each with the wave that must answer it] | none
```

---

## 11. Global prohibitions

- Editing `packages/reference-core`, `packages/reference-lib`, `matrix/*`, or
  `vendor/*` in this voyage. Panda v1 is read; never copied.
- Porting Panda test files. Cases are written from *claims*, with Panda as
  evidence for the edge, never as the assertion text.
- Sheet-only assertions; pixel snapshots for non-rendering claims; headed
  browsers; retries; sleeps.
- Renumbering ids; deleting existing cases; changing `runtime-data` ABI;
  changing frozen contracts from the Neo side.
- Two attribute names for colour mode anywhere in the tree (D1).
- Two writers in `src/runtime/css/**` at once; any child doing git or installs.
- Marking a `TESTS.md` row `done` without a case folder and a passing run.
- A README with a filename table; a file without a 2–6 sentence header;
  `@ts-expect-error`; `biome-ignore`; `any`.

---

## 12. G6 — switch-readiness report (deliverable, not action)

Written by the captain after G5, ≤ 2 screens, filed as
`docs/SWITCH-READINESS.md`. It answers, with citations: what would still
have to happen for `packages/reference-lib` to point its `.reference-ui/` at
Neo (watch loop, Vite plugin or CLI hook, Book integration, matrix packages,
`strict`/`layers`); which approved absences would bite lib authors first;
which RS-lane items remain; the measured cost of a full `agentneo run` at the
final catalog size; and a recommendation on whether Part Four is "cut over" or
"harden". It does not perform any of it.

Post-voyage shape (human 2026-09-17): no switch inside this voyage. After
G6 the ship ORBITs reference-lib — Neo shadowing core's output without
committing — and the cutover itself is a later LANDING SEQUENCE. The
landing is cheap by construction: lib's component suite plus its snapshot
tests are the final gate, so the switch is proven pixel-for-pixel by
suites that already exist. Voyage Two (the overnight switch-readiness run)
is chartered in §13; it ends by revisiting this report's recommendation.

---

## 13. Voyage Two — overnight switch-readiness run (charter, captain 2026-09-17)

### Goal
Reach switch readiness (the MVP gate): full parity on the things lib needs —
core CSS, primitives, and their interactions — so `SWITCH-READINESS.md` can
revisit HARDEN toward cut-over. Sails overnight while HQ sleeps; this section
is the living charter and evolves in-plan as the night finds things.

### Success criteria
- Zero `blocked-on-rs` TESTS rows, or each remainder explicitly descoped with
  an HQ-visible reason (no silent stragglers).
- All 18 PARITY-01 probes live (P4/P5/P8/P14/P15 uncited).
- PARITY-02 census green against whatever union the night ends with.
- `SWITCH-READINESS.md` recommendation revisited with the night's evidence.

### Scope: in
- RS-lane drain for parity blockers (RS-5/11/12/14/15/16/17/18/19/22/23/24/25),
  RS-13 trust reconciliation, RS-6 hygiene.
- Neo resumes: every blocked row and cited probe, flipped as stations land.
- Typegen correctness (TYPE group + Neo-runnable type tests): first-class
  target. Recipes, CSS, and types are the three legs of the night.
- Absence defense: any gap the night proves out-of-dialect gets a SPEC line
  through the census chain (SPEC → union table → checked-in list), never silence.

### Scope: out (landing-sequence or later legs, not tonight)
MCP; D19 `types/` emitter leg; chain/extends/layers (last — needs a matrix
switch-out, and lib neither extends nor layers); watch loop; Vite plugin;
Book integration; matrix packages; `strict` config. Untouched tonight.
First target consumer is reference-lib: no extends, no layers, the first
user of the Neo framework. No switch tonight — fill the gaps.

### Guiding principles (non-negotiable overnight)
- Proven-dialect-only: worlds author what is green; R1 probes before claims.
- RS law holds: one liaison, serial edits, stations with goldens; Rust never
  changes inside a Neo slice; new engine gaps file RS rows, never midnight hacks.
- D21 holds: micro-gaps ride PARITY-01 probes, not new group rows.
- Census guard: PARITY-02 stays green after every landing; the union only
  grows through cartographer discipline.
- Genuinely new scope gets an RS row + a night-log entry + a morning decision,
  never midnight scope creep.
- Done-gate rhythm (standing): at every point that feels done, send oracle
  agents to sweep Panda v1 for missed edge cases, and send refinement
  engineers into reference-rs (test quality, tests/README alignment) with
  one harder question: how do we make this robust BEYOND Panda v1?

### API target (what "parity" means)
The minimal lib slice (oracle C): `@reference-ui/system` 4 functions
(`globalCss`/`tokens`/`keyframes`/`font`), `@reference-ui/react` 101 tag
primitives + `PrimitiveProps`/`StyleProps`, the 43 lib-sheet families. Prior
art: `vendor/panda-v1` tests, matrix non-CHAIN suites, the lib sheet —
all census-mapped in `docs/evidence/w4-*`.

### Stage 1 — parity waves (liaison serial; Neo resumes parallel per landing)
- **N0 — reassessment (first, HQ-ordered):** oracle scouts re-verify every
  queued RS row still reproduces against the current engine and every
  blocked row/cited probe still reads blocked; captain folds deltas into
  this charter + the night log before N1 sails. Gate S0.
- **N1 — extract + sibling gaps (ledger order):** RS-14 → resume
  SITE-01/02/03; RS-11 → resume GLOBAL-06; RS-12 → resume COND-05/10. Gate S1.
- **N2 — engine breadth:** RS-16 → TOKEN-13; RS-17 → COND-14 (3 lib uses);
  RS-15 → COND-15 (+P5); RS-5 → SITE-14; RS-18 → RECIPE-07; RS-19 → SITE-13. Gate S2.
- **N3a — probe slices:** RS-22/23/24/25 → P14/P15/P8/P4 live; RS-26/27/28/29 → PARITY-01 sub-probes (+P5-empty fix); N12 unknown-prop ruling.
- **N3b — trust + tails:** RS-13 drift reconciliation; RS-30 keyframe aliases.
  Gate S3 = SWITCH: exit criteria checked, readiness revisited.

### Validation (every landing, no exceptions)
Station: `pnpm agentrs v atomic` + `pnpm agentrs q`. Resume:
`pnpm agentneo run <case>` + TESTS flip. Merge: full `pnpm agentneo run`
(≈40s) + `pnpm agentneo q` (0 errors, ≤7 warnings) + neo Vitest green +
PARITY-02 green. Night ends with the four numbers logged below.

### Risks
- Liaison serial bottleneck: mitigated by strict queue order, one editor.
- RS-13 drift eroding trust mid-night: categorize-before-bless, per-file
  justification; semantic diffs stop the line for morning.
- RS-14 (ternary/const/spread plans) is the hardest station: if it slips,
  N2/N3 proceed and SITE-01/02/03 carry explicitly.

### Stage 2 — refinement loop (HQ-ordered; the Civ VI future-tech phase)
After S3 declares parity, the night does NOT end. Standing loop until morning:
- **Opener — retire the parity NAME (HQ-ordered):** parity-to-what? Once
  S3 says it, the name's job is done. Mint the NEO-WORLD-01..04 capstone
  (`git mv` parity→world, new IDs, SPEC retitled completeness-proof,
  TESTS done-with-history, PLAN §8.15/G4/§13 repointed, w4-* evidence
  left as dated history). Prove behavior-preserving (full suite + census
  green) before breakers sail. Queued here — never mid-Stage-1 — because
  N-cooks own the census files while waves sail.
- **Breakers:** engineers survey reference-rs + reference-neo and author
  test cases that try to BREAK the systems — hidden bugs, stress shapes,
  edge interactions. A test that proves broken-then-fixed is a success.
- **Trophy rule:** a test that cannot prove breakage is noise, not a trophy.
  Keep it only with a written reason (regression pin, contract lock);
  otherwise cut it. Duplicates get cut on sight.
- **Dedup oracles:** read test descriptions across suites, find overlaps,
  propose merges/cuts. No two tests proving the same thing.
- **Coverage oracles:** confirm the map is end-to-end; cartographers happy.
- **Beyond-Panda:** every breaker asks how the system gets MORE robust
  than Panda v1, not merely equal. Fixes land; the census stays green.
- Stage 2 exit: oracles say ready-to-switch (minus MCP + deliberate
  absences, with typegen/primitives/recipes proven) AND the trophy audit
  is clean. Then the finale sails.

### Finale (morning, HQ-ordered)
When the night's parity work lands, send MANY crews — plan-oracles, each
presenting their own piece — to design tomorrow's playground: deeper,
consistent, modern, futuristic, backed by the night's new vertical slices.
The playground becomes the representation of everything.

### Night log (append-only; the charter evolves here)
| Time | Entry |
| --- | --- |
| 2026-09-17 | Charter written; Voyage One closed (128/128, census 152, S-ready:HARDEN). |
| 2026-09-17 night | HQ brief: oracles-first restart; chain/extends/layers out; typegen first-class; done-gate oracle+refinement rhythm; morning playground armada. N0 relaunched. |
| 2026-09-17 night | N0-ledger green: 12 blocked, 5 probes, 152-union exact (case-sensitive); absorbed 3 prose drifts (2 stale 151 comments, RS-12 unblocks +COND-10). Carried: RS-5 needs lane text before N2; resumes must shrink BLOCKED same-landing. N0-RS still out. |
| 2026-09-17 night | **S0 PASS.** N0-RS: 13 reproduce verbatim; RS-14 core cleared (SITE-01/02/03 → open, whole-object absented, station adoption pending); RS-6 cleared (2-line map.html, done). Charter staged (Stage 1 parity / Stage 2 refinement loop + trophy rule + finale). N1 sailing: liaison RS-14-station→RS-11→RS-12, cook SITE-01/02/03. |
| 2026-09-17 night | HQ goodnight order: retire the parity name → NEO-WORLD capstone. Queued as Stage 2 opener (unsafe mid-Stage-1: N-cooks own census files). HQ asleep; radio silence from here. |
| 2026-09-17 night | N1-cook merged: SITE-01/02/03 done (R1-confirmed, SITE-02 claim disambiguated to member access), BLOCKED 12→9 with census green. Verified: 131/131, q 0/7w, vitest 208. S1 awaits N1-liaison (RS-14-station/RS-11/RS-12). |
| 2026-09-17 night | N1-liaison merged: ATM-SITE-17/ATM-LAYER-09/ATM-COND-20 landed, blast 0/124; RS-14/11/12 → done, GLOBAL-06/COND-05/10 → open. Verified: dist carries RS-12 live, v atomic 112F/62P (+3, no new fails), c atomic green, q clean. Cook-2 sailing. S1 needs cook-2. |
| 2026-09-17 night | **S1 PASS.** Cook-2 merged (GLOBAL-06 + COND-05/10, P11-lateral for hover), BLOCKED 9→6, census green. Captain refuted cook's bare-10 note for css() (globalCss numeric unprobed). Verified: 134/134, q 0/7w, vitest 208. N2 sailing. |
| 2026-09-17 night | N2 launched: liaison RS-16→17→15→5→18→19 (RS-5 lane drafted by captain from N0); S1 done-gate Panda sweep oracle parallel. |
| 2026-09-17 night | S1 sweep: S1 HOLDS. Oracle's §4 tail truncated in transit; captain recovered RS-grade N1/N2/N3 from /tmp probes and filed RS-26/27/28 (queued N3). RS-16 pointer relabeled (LAYER-09 taken → 11). §4 micro-oracle reconstructing 7 SPEC lines + 5 fold-ins + N12. Ledger: 12 done, 14 queued. |
| 2026-09-17 night | §4 applied by captain: 7 SPEC lines (css×2, site×2, token×3), union 152→159 through the full chain, 6 fold notes. Verified: PARITY-02 green, 134/134, q clean. N12 unknown-prop ruling carried to N3 liaison. N2 liaison still sailing. |
| 2026-09-17 night | N2-liaison merged: 6/6 PASS (ATM-LAYER-10/COND-18/COND-19/SITE-13/SITE-18 + RS-18 located diagnostics, no station by design). No clobber (LAYER-10 is N2-new), no Neo trespass. Verified: v atomic 112F/67P, c atomic green, q clean. RS-16/17/15/5/18/19 → done; 6 rows → open. N2-cook sailing (6 + P5 + RECIPE-06 ext). |
| 2026-09-17 night | **S2 PASS.** N2-cook merged (6/6 + P5 live + RECIPE-06 loc ext), BLOCKED 6→0. Captain filed RS-29 (P5 cook pinned invalid `@supports {`; unpinned, computed-only). Verified: 140/140, q 0/7w, vitest 208. N3a sailing (RS-22–29 + N12); S2 sweep parallel. |
| 2026-09-17 night | S2 sweep: S2 HOLDS. 3 follow-ups closed: RS-30 filed (keyframe `h` alias; `css()` proven to lower), RS-19 lane given LANDED header, VALID-02 Null wording fixed (silent is Panda parity). Charter split N3a/N3b. Ledger: 18 done, 10 queued. |
| 2026-09-17 night | N3a merged: 8/8 + N12 warn+drop BOTH paths (9 stations, SHORT-08/09/SITE-19/20/LAYER-11/12/13/UNIT-03/COND-21). Verified: v atomic 112F/76P, c green, q clean; divide absence compatible. RS-22–29 → done. N3-cook (7 probes + P5 fix) + N3b (RS-30/RS-13/tails) sailing. Canon regen banned (destructive). |
| 2026-09-17 night | N3-cook merged with 2 rulings: (1) cook's RS-31 VOIDED (Neo-side gap mis-laned; refiled NEO-PRIM-11 open, prim crew sailing); (2) suite RED 139/140 — N12 drops valid `-webkit-appearance` (GLOBAL-11), queued as N3b tail #5. P4/P8/P14/P15-ext/P19/P20/P21/P5-empty all live. S3 awaits N3b + prim-crew. |

---

## Appendix A — evidence index

All under `packages/reference-neo/docs/evidence/`. Read-only findings, dated
2026-09-17; refresh by re-running the §10.1 scout prompt with the same question.

- `neo-state-2026-09-17.md` — module inventory, harness contract, health, timing.
- `lib-sheet-styles-css.md` — the 27k-line lib sheet: layers, families, hardest
  twelve, weirdest ten, implications.
- `lib-sheet-global-css.md` — Panda global cssgen; five author→output traces;
  reset; gap list.
- `generated-folder-shape.md` — folder census, consumer import census, type
  surface, Neo delta, ten must-not-regress contracts.
- `core-api-parity.md` — core→Neo API matrix, panda-isms to rename, ten open
  questions (answered by §3).
- `atomic-claims.md` — Atomic claims vs proof, seam mismatch, attribute naming
  counts, P0/P1/P2 browser-proof priorities.
- `panda-v1-core-corpus.md` — `packages/core` tests: 215 tests mined by family,
  61 case proposals, out-of-scope.
- `panda-v1-tokens-types-corpus.md` — token-dictionary, generator, shared,
  preset-base: refs, islands, composites, typegen unions, normalisation.
- `panda-v1-parser-config-corpus.md` — parser/extractor/config/node/codegen:
  extraction boundary, hosts, config differences, folder comparison.

## Appendix B — how this plan was produced

Nine scouts ran in two rounds on a fast model, read-only, each answering one
question and writing one report; Panda v1 was vendored sparse at
`@pandacss/dev@1.12.1` in parallel. The captain-to-be read the reports, the
harness, the sync path, and the contracts, reconciled ~150 proposed cases into
the §8 catalog, and lifted the decisions in §3 out of the conflicts the reports
surfaced (the colour-mode attribute above all). The same shape — scouts, then
cartographers, then vertical slices with an oracle on each — is the workflow
§6 asks the swarm to repeat.

Panda V1 is studied as a working design, not only mined for edges. It solved
this same problem well and simply; cooks read the vendored sources to
understand *how*, then implement from the claim. Read, learn, never copy
(§11).

## Landing (post-S3, HQ 2026-09-18 — BOARDING reference-lib, switch-first)

Stood down per HQ halt: matrix (out of scope), Book (not needed), Vite
plugin (skip for now), D17 build (cartography decides), RS-32 ride-along
(stays filed+owned). Zero-lib-edits voyage rule SUPERSEDED: HQ authorized
the captain to proactively make the switch in reference-lib (Phase C).

Phase A — PREPARE (now): cartographers map the last bits + watch crew builds.
Phase B — COMMIT preparations. Phase C — LANDING SEQUENCE: captain flips the
switch in reference-lib, lib's own suites + snapshots (via lib agent skills)
become the witnesses, fix-forward crews make it work.

| Crew | Task | Mode | Brief |
| L1 | Watch loop (HQ: needed) | build | `neo sync --watch` on serial `sync()` + SYNC case proof |
| C1 | lib→core consumption map | recon | Every lib touchpoint on core → `landing-lib-consumption.md` |
| C2 | D19 switch-minimal types (HQ: needed) | recon | 11 importers, 12 names → `landing-types-scope.md` ("shim" wording retired by HQ) |
| L9 | D19 types emission (HQ: complete, not carried) | build | Real `types/` emission in Neo sync via RS tasty engine + case proof |
| C3 | lib test-harness map | recon | Suites/snapshots that witness the layer → `landing-lib-tests.md` |

All: tree uncommitted, captain merges. Recon crews read-only + one report.

### Phase A close (captain, 2026-09-18)

- L1 watch MERGED (SYNC-14; suite 142). Census fallout sync-o3 (watch retired
  from absence union) fixed by captain: parity SPEC §union + census-union key.
- L8 forwardRef MERGED (HQ B3): factory is `forwardRef` w/ `forwardedRef ?? ref`;
  PRIM-10 contract re-pinned (`$$typeof`+render+displayName; typeof-object is
  necessary). Full suite + q + 218 vitest green. Stash incident verified clean
  (stash list intact, 17 tree files all known). Standing rule: NO stashing in
  the shared tree, ever.
- L9 STOOD DOWN (HQ: tasty dark like matrix; cancel primitives failed, agent
  parked in manual_reconciliation, zero tree touches — nothing to revert).
- TASTY DECOMMISSION (landing-atomic, Phase C crew): (1) mask index.ts:18
  export w/ dated comment; (2) tsconfig `exclude: src/components/Reference/**`;
  code untouched, zero tests under dir, no outside `@reference-ui/types`
  importers, only index.ts:18 imports the dir; `referenceBrowserTokenConfig`
  orphaned by nothing. Generated `types/` left unused; paths entry dangles
  harmlessly. RE-COMMISSION tracker (post-green): D19 emission + unmask 1–2.
