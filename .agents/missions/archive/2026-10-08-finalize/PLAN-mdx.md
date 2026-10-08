# PLAN-mdx — Native MDX support via `mdx-rs` (revised, Oracle-approved with changes)

**Status:** plan only — **NOT LANDED**. Arc 3 was a feasibility STOP; this is the
durable, self-contained revision a future crew executes without reading the
Oracle transcript.

**Base:** branch `reference-system`, revision HEAD `96f017015` (Arc 1 Oracle
fixes landed; Arc 2 CUT). The Oracle reviewed the first filing at pin
`2ffb79770` and returned **APPROVED WITH CHANGES**.

**Provenance:** supersedes the Phase inventory in
`reports/ARC3.impl.md` (gitignored) and folds in every Oracle demand from
`reports/ARC3.review.md` (gitignored):

- **R1** — drop `mdx?: boolean`; register the `.mdx` plugin **unconditionally**;
  name all three bundle sites.
- **R2** — replace async compile-before-match with an **MDX-scoped sync
  pre-pass**; keep `splitScan` sync; freeze the global `createImportPatterns`.
- **R3** — no `splitScan → async` change needed under R2; list the blast radius
  if a future implementer keeps compile-before-match.
- **R4** — add a **decoy-only** fixture and fix the mirror citation.
- **R5/R6** — captain rulings (recorded below).
- **R7/R8** — notes (recorded below).

**Skill:** `agent-neo` (`pnpm agentneo`). **Scope:** `.mdx` only; `.md` is
excluded, matching legacy exactly (R8). Sub-agent doctrine: crews never commit;
the captain commits named, verified files only.

---

## 1. Goal and feasibility context

Port the legacy MDX transform (`packages/reference-legacy/src/virtual/transforms/mdx-to-jsx/index.ts`,
`@rspress/mdx-rs`) into Neo sync so MDX files can contribute fragment calls
(e.g. `font(...)`). The measured transform cost is noise (12.6 ms/pass
`@mdx-js/mdx` vs 2.9 ms/pass `@rspress/mdx-rs` on the 11-file corpus,
`FINALIZATION_REPORT.md`); today MDX is excluded entirely by
`FRAGMENT_EXTENSIONS` in `packages/reference-neo/src/collect/constants.ts:56-65`,
and the exclusion landed as O1 (`06f031e7b`) to stop a docs false positive.

Making MDX first-class without re-introducing that crash needs: a new native
NAPI dependency + root lockfile install (captain-gated), an esbuild MDX loader
plus `@mdx-js/react` handling, `.mdx` fragment selection that cannot be fooled
by fence-embedded needles, a proving case, and a `bench:neo` axis. The Oracle
ruled the seam is a real cross-package port; the plan below is the reduced,
approved shape.

---

## 2. Phase 1 — dependency (captain-gated) [R6]

The Phase 1 install is a hard captain-level gate: it rewrites the **root**
`pnpm-lock.yaml` and the single shared `node_modules`/native tree the mission
runs on ("one working tree, one shared native `.node`", `MISSION.md`).

- `packages/reference-neo/package.json` (`dependencies`, lines 31-39): add
  `"@rspress/mdx-rs": "^0.6.6"`.
- `pnpm install` at the workspace root. The `@rspress/mdx-rs-*` platform
  binaries ride the package's **`optionalDependencies`**; pnpm installs the
  matching one per platform. **Do not name a single platform binary.**
- Verify install and load on **every CI runner**, per R6:
  - **darwin-arm64** (this dev machine) — `compile()` returns `{ code }`.
  - **linux-x64**, including the **Dagger matrix containers** that gate core.
  - Any other runner the pipeline matrix adds before land.
- Verification is a load probe: `import { compile } from '@rspress/mdx-rs'`
  resolves from `@reference-ui/neo`, and `compile({ value, filepath, development: false, root: '' })`
  returns a non-empty `code`. Record the chosen version and the exact install
  command in the land report.

`@mdx-js/react@3.1.1` is **already** in the root lock via `reference-docs`
(R7) — no new dependency for it; see Phase 2.

---

## 3. Phase 2 — microbundle MDX plugin [R1]

Register the plugin once, unconditionally; it is inert when no `.mdx` file
flows in. Do **not** thread a per-call option flag.

- **New** `packages/reference-neo/src/lib/microbundle/plugins/mdx.ts`:
  `mdxPlugin()` esbuild plugin. `onLoad({ filter: /\.mdx$/ })` reads the file,
  calls `compile({ value, filepath, development: false, root: '' })`, returns
  `{ contents: result.code, loader: 'jsx' }`. On compile error it throws a
  **named diagnostic** (file + parse error); never the legacy silent
  `export {}` fallback (see R5).
- `packages/reference-neo/src/lib/microbundle/plugins/index.ts` (`getPlugins`,
  lines 13-24): push `mdxPlugin()` **unconditionally**. This by construction
  covers all three bundle sites:
  1. `bundleFragments` — `src/collect/lib/runner.ts:23-39` (`microBundle(file, microOptions)`).
  2. `runSingle` — `src/collect/lib/runner.ts:64-93` (`microBundle(filePath, microOptions)` at :82).
  3. `runPlanner` — `src/collect/lib/runner.ts:99-136` (`microBundle(filePath, { reactStub: true })` at :123).
     `runPlanner` feeds `scanForFragments` matches straight into `microBundle`,
     so without unconditional registration the planner path crashes the moment
     `.mdx` matches.
- `packages/reference-neo/src/lib/microbundle/plugins/react-stub.ts:45`:
  widen the resolve filter to include `@mdx-js/react` (keep it a zero-byte
  module, consistent with the existing react stub). Compiled MDX imports
  bindings from `@mdx-js/react` (at least `useMDXComponents`); add every named
  binding the target `mdx-rs` version emits to `REACT_STUB_CONTENTS`, or
  esbuild fails the named-export resolve. `@mdx-js/react` is unresolvable from
  `neo` because of **pnpm isolation**, not store absence (R7); the stub route
  is the right one and avoids a second runtime dependency.
- **No** `mdx?: boolean` on `MicroBundleOptions`
  (`src/lib/microbundle/types.ts`); **no** per-site wiring.

---

## 4. Phase 3 — scan: MDX-scoped sync pre-pass [R2, R3]

The first filing made discovery async and anchored the **global** import
patterns, which changes `export … from` semantics and churns every `.ts/.tsx`
golden. Replace that with a matcher scoped to `.mdx` only. Compilation stays in
the bundle path (Phase 2), which is already async; the scan stays sync.

### 4.1 Constants

- `packages/reference-neo/src/collect/constants.ts:56-65`: add `'mdx'` to
  `FRAGMENT_EXTENSIONS`. Rewrite the comment: MDX is now bundleable **because a
  loader exists** (Phase 2). `SOURCE_EXTENSIONS` (line 49) stays untouched, so
  MDX still contributes fragments only, never engine-compiled atoms.
- `FRAGMENT_EXTENSIONS` is deliberately **not** a native mirror; native returns
  needle hits ungated and the TS `splitScan` confirm applies the extension gate
  on both paths. Adding `mdx` therefore needs **no `native.ts` change** beyond
  passing the MDX matcher through (4.3).

### 4.2 MDX matcher (new, `scanner.ts`)

Add pure, sync helpers beside `createImportPatterns`
(`packages/reference-neo/src/collect/lib/scan/scanner.ts:47-55`):

- `stripMdxNoise(content: string): string` — remove (a) a leading frontmatter
  block delimited by a `---` line and its matching closing `---` line, when a
  closer exists; and (b) fenced code blocks opened/closed by a line of three or
  more backticks or tildes (`^[ \t]*(```|~~~)`), including the fence info
  string, replacing the block with blank lines. Frontmatter and fences carry no
  top-level MDX ESM, so stripping them is lossless for discovery.
- `createMdxImportPatterns(importFrom?: string | string[]): DiscoveryPattern[]`
  — one **line-anchored** import pattern per module id, needle = the module id
  (so the `content.includes(needle)` pre-gate and the native needle union are
  unchanged). Anchored shape (multiline):
  `^[ \t]*import[ \t]+(?:[^'"\n]*?[ \t]+from[ \t]+)?['"]<escaped-id>['"]`
  This matches `import x from 'id'`, `import type { x } from 'id'`,
  `import { a, b } from 'id'`, and `import 'id'` — and nothing else. A line
  that merely *contains* `from 'id'` (prose, inline code, a fence line) does
  not match; the fence is stripped anyway.
- `createImportPatterns` stays **frozen** (R2). Do not anchor it globally.

### 4.3 Selection in `splitScan`

`packages/reference-neo/src/collect/lib/scan/scanner.ts:329-364`:

- Add an **optional** trailing parameter `mdxPatterns: DiscoveryPattern[] = []`
  (additive; existing 4-arg calls and tests keep working). This is the only
  signature change; the function stays **sync** (R3).
- In the per-candidate loop, branch on the final extension: when the candidate
  is `.mdx` (`extname(candidate) === '.mdx'`), match the **stripped** content
  with `mdxPatterns` and **never** with `discoveryPatterns`. All other
  JS-bundleable candidates keep the exact old `matchesAnyPattern(content, discoveryPatterns)`.
  When `mdxPatterns` is empty (function-name discovery), `.mdx` never matches.
- `scanFragmentSources` (`scanner.ts:293-323`) builds `mdxPatterns =
  createMdxImportPatterns(importFrom)` once and passes it at :322.
  `native.ts:212-217` does the same from `options.importFrom`, so the native
  confirm and the TS fallback select identically (the existing differential
  battery covers this).

### 4.4 Tests / goldens

- `identity.test.ts:16,28,101` already carries a **fence-only** MDX decoy
  (`src/doc.mdx`, frontmatter + a ```` ```ts ```` block holding the needle). It
  must **stay out** of `EXPECTED_MATCHES` and `EXPECTED_OUTSIDE_MATCHES` — now
  because the MDX matcher strips the fence, not because `.mdx` is gated out.
  No golden churn for that fixture.
- Add one positive scan fixture (a `.mdx` file with a real top-level import) to
  prove it now matches, in `identity.test.ts` (or a sibling scan unit test).
- `goldens.test.ts` + `fixtures/scan-goldens.*.json` are unchanged (global
  patterns frozen; no `.mdx` in the synthetic trees). `native.test.ts` /
  `retention.test.ts` / `nativeWalk.test.ts` unchanged except that any new
  fixture flows through both paths.

### 4.5 R3 conditional — if a future implementer keeps compile-before-match

Under the approved R2 shape, **no `splitScan → async` change is needed.**
If an implementer instead keeps compile-before-match (async), they must make
`splitScan` async and update **every** caller/test:

- `scanner.ts` `scanFragmentSources:322` (internal call).
- `native.ts:212` (native confirm).
- `src/collect/lib/evaluate.ts:19` (via `scanFragmentSources`).
- `src/collect/lib/runner.ts:10` (`scanForFragments`, which awaits).
- `src/collect/index.ts:39` (re-exported types only).
- Tests: `native.test.ts` (imports `scanFragmentSources`),
  `nativeWalk.test.ts` (imports `RETENTION_EXCLUDE`),
  `nativeLifecycle.test.ts` (static + dynamic `scanFragmentSources` import),
  `goldens.test.ts`, `identity.test.ts`, and the differential helpers in
  `helpers.ts`.

---

## 5. Phase 4 — proving case + bench axis [R4]

### 5.1 Case group `mdx` + leaf `NEO-MDX-01`

Path: `packages/reference-neo/tests/cases/mdx/NEO-MDX-01/`

- `case.json`: `{"id": "NEO-MDX-01", "name": "mdx fragment collection", "sync": true}`
- `world/ui.config.ts`: `include: ['theme/**/*.{ts,tsx,mdx}']`
- `world/theme/doc.mdx` — **real import** (the fail-before / pass-after file):
  ```mdx
  ---
  title: MDX fragments
  ---
  import { font } from '@reference-ui/system'

  export const display = font('display', {
    value: '"Playfair Display", Georgia, serif',
    fontFace: { src: 'url(/fonts/playfair.woff2) format("woff2")', fontDisplay: 'swap' },
    weights: { normal: '400', bold: '700' },
  })

  # MDX doc

  ```ts
  import { font } from '@reference-ui/system'   // fence decoy: must NOT match
  ```
  ```
  The `font(name, { value, fontFace single, weights })` API matches
  `surface/font.ts` `FontOptions`; `@reference-ui/system` is a discovery needle
  and in the bootstrap map.
- `world/theme/decoy.mdx` — **decoy-only** (no real top-level import):
  ```mdx
  # Fence decoy

  ```ts
  import { font } from '@reference-ui/system'
  font('decoyface', { value: 'Decoy', fontFace: { src: 'url(/fonts/decoy.woff2)' }, weights: { normal: '400', bold: '700' } })
  ```
  ```
  This is the R4 fixture: it carries the needle **only** inside a fence and has
  no top-level import, so it must never be collected and must contribute no
  fragment.
- `world/index.html`: probe styled by the font's `css`/family (mirrors the
  font-face setups in `NEO-PARITY-01` / `NEO-GLOBAL-08`).
- `world/.reference-ui/`: gitignored, produced by the runner's sync.
- `specs/mdx.spec.ts`:
  - Node-side: `styled/styles.css` carries the `@font-face` /
    `font-family: "Playfair Display"` emitted by the MDX fragment.
  - Browser: the probe resolves to that family / `document.fonts` lists it.
  - Decoy: `styles.css` carries **no** `decoyface` face and `document.fonts`
    does not list it.
- **Decisive decoy proof is scan-level:** add a Vitest over a tmp tree holding
  both `doc.mdx` (real import) and `decoy.mdx` (fence-only) asserting
  `matches` equals exactly the real file — i.e. `decoy.mdx` is never collected.
  (The fence compiles to an inert string, so a wrongly-collected decoy would
  not change `styles.css`; the scan assertion is the falsifiable one. "No
  fragment" is asserted the same way: no decoy source in the collected set /
  provenance.)

### 5.2 Mirror citation fix [R4]

The font-content mirror is **`NEO-PARITY-01`** (`world/src/fonts.ts`,
`specs/sheet.spec.ts`) and **`NEO-GLOBAL-08`** (`world/src/fonts.ts`,
`specs/font-face.spec.ts` — the `@font-face` + metric descriptors case). It is
**not** `NEO-SYNC-01` (the token/skeleton handshake). Fix the citation when
sketching the case.

### 5.3 Bench axis

- `packages/reference-neo/benchmark/generate/plans.ts` (`LoadPlan`, `PROFILES`)
  — add an MDX knob (e.g. `mdxFiles`).
- `packages/reference-neo/benchmark/generate/generators/` (`app.ts` / `churn.ts`
  + `templates/`) and `generate/generators/index.ts` — emit `.mdx` output under
  `theme/**` with real top-level imports, plus fence decoys that must not
  collect.
- Pin before/after reports under `packages/reference-neo/benchmark/reports/`
  (current pinned readout lives at `benchmark/reports/latest/report.md`).
- Note: the bench still reports sync wall / peak RSS / bundle with no per-step
  split (`benchmark/README.md`); "before/after scoped to the MDX step" needs
  this generator/plan knob first, which is why it is Phase 4.

---

## 6. Phase 5 — docs cleanup (hand to `agent-docs`)

Remove the `packages/reference-docs/src/content/docs/system/fonts-sections.tsx`
workaround once MDX fragments collect. This is a docs-side edit, not a neo edit.

---

## 7. Captain rulings (recorded) [R5, R6]

- **R5 — abort with attribution, not silent `export {}`.** On MDX compile
  failure, sync aborts with a diagnostic naming the file and the parse error.
  The legacy `mdx-to-jsx` warns (`warnRefSync`) and emits `export {}`; the
  repo bans silent failure, and a broken doc must surface. This is a
  **deliberate divergence from legacy parity** and must be stated as such in
  the land report and in the plugin's header comment.
- **R6 — platform coverage via `optionalDependencies`.** The land must verify
  install on **darwin-arm64** and **linux-x64 (incl. Dagger)**, not merely name
  `-darwin-x64`. pnpm's optional dependencies do the platform selection; the
  land proves it on each runner.

---

## 8. Notes [R7, R8]

- **R7 —** `@mdx-js/react@3.1.1` is already in the root lock via
  `reference-docs`; `require.resolve` fails from `neo` because of pnpm
  isolation, not store absence. Widening `react-stub` remains the right route
  (zero bytes, stub consistency); no new dependency.
- **R8 —** scope is `.mdx` only. Legacy gates on `extension !== '.mdx'`
  (`packages/reference-legacy/src/virtual/transforms/index.ts:42`) and maps
  `.mdx → .jsx`. `.md` stays excluded; no scope creep.

---

## 9. Ordered phases and entry points (summary)

| Phase | Gate | Entry points |
| --- | --- | --- |
| 1 — dependency | captain | `packages/reference-neo/package.json:31-39`; root `pnpm-lock.yaml` (install) |
| 2 — bundle loader | — | `plugins/mdx.ts` (new); `plugins/index.ts`; `plugins/react-stub.ts:45`; `runner.ts` (:23-39, :82, :123) |
| 3 — MDX-scoped scan | — | `collect/constants.ts:56-65`; `scan/scanner.ts` (matcher + `splitScan`); `scan/native.ts:212` |
| 4 — case + bench | — | `tests/cases/mdx/NEO-MDX-01/**`; `benchmark/generate/**`; `benchmark/reports/**` |
| 5 — docs cleanup | `agent-docs` | `packages/reference-docs/src/content/docs/system/fonts-sections.tsx` |

---

## 10. Before / after

- **Before:** `NEO-MDX-01` fails — `.mdx` is not a fragment candidate, so the
  MDX fragment is never collected and `styles.css` has no `@font-face`. The
  fence decoy also has no effect.
- **After (target, not landed):** the real top-level MDX import matches through
  the MDX-scoped sync pre-pass, the compiled MDX bundles via the new loader,
  `font()` executes in the eval script, and the emitted sheet carries the
  family, while `decoy.mdx` (fence-only) is never collected.

---

## 11. Risks to weigh before landing

- The Phase 1 install lands a new NAPI dependency on the **shared native tree**
  used by Arcs 1/2 — pin a `bench:neo` run on a clean tree after install.
- The react stub must export every named binding compiled MDX imports
  (`useMDXComponents` at minimum); the case run confirms the exact set for the
  pinned `mdx-rs` version.
- MDX atomic `css()` extraction is **out of scope**: `SOURCE_EXTENSIONS`
  (ts/tsx/jsx/js) still excludes `mdx`, so `css`-style atoms written in MDX
  remain unextracted unless the Rust source scan is extended.
- `mdxPatterns` defaulting to empty keeps function-name discovery MDX-free; if a
  future need requires function-call discovery inside MDX, that is a new,
  separately-argued change.
- The decoy proof is scan-level by construction (a compiled fence is inert);
  document that so a reviewer does not expect `styles.css` to distinguish it.

---

## 12. Ruling summary

**Oracle verdict: APPROVED WITH CHANGES** — adopt R1 (unconditional plugin
wiring), R2 (MDX-scoped sync matching), R4 (decoy-only fixture); R3 is
conditional; R5/R6 are captain calls at land time. **Arc 3 stays `NOT LANDED`;
even re-scoped, Phase 1 (new NAPI dep + root lockfile install) is cross-package
work outside this arc's bound.** This plan defers Arc 3 to a follow-up mission.
