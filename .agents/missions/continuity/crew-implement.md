# OPERATION CONTINUITY-01 — Crew IMPLEMENT report (redirected)

No commits made (captain commits). No source edits outside new test cases.
Branch state: only additive untracked dirs; zero modified tracked files.

## 0. Redirected plan (what the verified premise changed)

The three crew reports prove there is no closed r-scale table and both
engines compute arbitrary `N x root`, with real `ref sync` emitting
`140r`/`137.5r`/loose-`rgba()` at exit 0, zero diagnostics. So:

- **No r-computation built.** Nothing to build; the math is generic `f64`
  in `modules/atomic/src/resolve/rhythm/mod.rs:43-67`.
- **Objective 1 → verdict, not fix.** The legacy/Panda path is dead (see
  §1). Its min/max gap dies with it; the live-path equivalent (min/max r
  on Neo) is now pinned by test instead.
- **Objective 2 → spec, not code.** No `--spacing-root` seam is both safe
  and unambiguous (see §2). Options specced for HQ below.
- **Objective 3 → done.** Two new cases pin continuity + harvest-miss
  through the areas' own runners (see §3–§4).
- **Objective 4 → untouched.** No runtime fallback emission, per HQ policy.

## 1. Legacy/Panda path: DEAD — no fix, with evidence

`packages/reference-legacy` is not live for any consumer:

1. **HQ frozen-museum law** (`packages/reference-legacy/README.md:1-31`):
   read-only, nothing imports it, no tooling runs here.
2. **Excluded from the workspace** (`pnpm-workspace.yaml`:
   `'!packages/reference-legacy/**'`), package renamed to private
   `@reference-ui/legacy` — unresolvable by design.
3. **Zero live dependents**: no `package.json` outside legacy itself and
   generated `.reference-ui/system` stubs references it; zero imports of
   `@reference-ui/system` / `reference-legacy` under
   `packages/reference-lib/src`, `packages/reference-neo/src|bin`.
4. **Live lib builds through Neo**: `packages/reference-lib/package.json`
   `sync`/`dev`/`build` all run `ref sync` (Neo), include covers
   `src/**` + `book/**`.
5. **The §1b symptoms do not exist on the live path.** `field.ts:158`
   `maxWidth: '36r'` flows through `globalCss(fieldSurfaceStyles)`
   (`inputs.ts:348`) into Neo compile, and the shipped
   `dist/runtime/reference-ui/react/styles.css` carries
   `max-width: calc(36 * var(--spacing-root))`. A repo-wide shaped grep
   finds **zero** verbatim `Nr` declarations in the shipped sheet, and
   `--spacing-root: 0.25rem` is emitted (from `global.ts`).

Per the brief ("if dead, report with evidence instead of fixing"), the
min/max `rhythmTransform` gap in legacy `utilities.ts:31-131` was left
exactly as the museum keeps it. The corresponding live-path behavior —
r on min/max props including JSX aliases — is pinned by ATM-RHYTHM-06.

## 2. `--spacing-root`: investigated, NOT implemented — options for HQ

Confirmed author-defined, never auto-emitted: the only definitions in
the live trees are author fragments (lib `global.ts:4`, test themes).
The no-engine-default is structural — `0.25rem` appears only in lib and
in fixtures that mirror lib (`base-system/src/tests.rs:68` asserts the
lib fixture's `:root`, it does not mint a default). Flow: fragment
`globalCss()` → `EvaluatedSystemSpec.globalCss` → Rust
`append_global_fragment_rules` → `@layer global` (`stylesheet/global/mod.rs:45-56`).

Why no seam clears the safe-and-unambiguous bar:

- **A. Unconditional sync-time injection** (`reset.ts`-style unshift of
  `:root { --spacing-root: 0.25rem }`): changes every consumer sheet even
  with zero rhythm use; bakes a magic default no engine surface owns;
  `extends`-chain layer/order interplay unexamined. Safe ordering
  (injected-first ⇒ author-wins) but noisy and policy-laden.
- **B. Conditional injection (only when rhythm atoms emit)**: needs
  post-compile feedback into the spec; sync is single-pass
  (evaluate → compile → publish). Two-pass compile or emitter support —
  cross-cutting, not a seam tweak.
- **C. Emitter-side auto-emit (Rust)**: the emitter cannot see
  definitions outside the spec (consumer plain CSS, upstream portable
  sheets merged later in Neo `streams.ts`), so "missing" is undecidable
  there; would rewrite goldens across the corpus.
- **D. Diagnostic ("rhythm used, no `--spacing-root` in collected
  fragments")**: same visibility hole as C ⇒ false positives for
  consumers who define the var outside collected fragments.

Recommendation: keep author-owned; document in the Neo
`tokens`/`globalCss` surface docs that rhythm requires `--spacing-root`
(a one-line globalCss, as NEO-CSS-16's theme shows). Revisit D with a
suppression flag only if silent-unpainted-rhythm bites a real consumer.
Note the failure mode is uniform, not a continuity differential: a
missing root breaks ALL rhythm values equally, never just `140r`.

## 3. Files changed (additive only)

New atomic case (compile seam, via `pnpm agentrs`):

- `packages/reference-rs/modules/atomic/tests/cases/ATM-RHYTHM-06/spec.ts`
- `.../ATM-RHYTHM-06/README.md`
- `.../ATM-RHYTHM-06/input/src/continuity.ts` —
  `css({ maxWidth: '140r', minWidth: '137.5r', marginTop: '-2.5r' })`
- `.../ATM-RHYTHM-06/input/src/continuity.tsx` —
  `<Div maxW="220r" />`, `<Div minH="12.5r" />`
- `.../ATM-RHYTHM-06/output/{styles.css,css.json,diagnostics.json}` —
  committed goldens (generated via `--update-goldens`, contents verified
  by hand: five calc formulas, `diagnostics.json` is `[]`, alias and
  longhand keys resolve to shared `max-w_*`/`min-*` stems)

New Neo case (end-to-end sync + paint + miss, via `pnpm agentneo`):

- `packages/reference-neo/tests/cases/css/NEO-CSS-16/case.json` (id free,
  no catalog collision; distinct from CSS-14's color-floor case)
- `.../NEO-CSS-16/README.md` (detailed; feeds the case index)
- `.../NEO-CSS-16/world/{ui.config.ts,index.html,src/app.ts,src/theme.ts}`
- `.../NEO-CSS-16/specs/continuity.spec.ts`

No other files touched. No runtime, emitter, sync, or legacy edits.

## 4. Tests and suites run + results

| Check | Result |
|---|---|
| `pnpm agentrs v atomic -t "ATM-RHYTHM-06"` (new, vs committed goldens) | PASS (1 passed) |
| `pnpm agentrs v atomic` (full suite, 304 tests) | 303 pass; 1 pre-existing failure, see §5 |
| `pnpm agentrs q .../ATM-RHYTHM-06` | PASS (3 files) |
| `pnpm agentneo run NEO-CSS-16` | PASS |
| `pnpm agentneo q` (7 committed case files) | 0 errors, 0 warnings |
| Neighbors `NEO-CSS-12`, `NEO-CSS-14`, `NEO-NAMER-03`, `NEO-NAMER-04` | all PASS |

What the new cases pin:

- **ATM-RHYTHM-06**: `140r`/`220r` (arbitrary), `137.5r`/`12.5r`
  (fractional), `-2.5r` (negative fractional) all lower to root calc on
  `maxWidth`/`minWidth`/`minHeight`/`marginTop`, via `css()` longhands
  AND the JSX `maxW`/`minH` aliases, with an explicitly asserted empty
  diagnostic list. This is the live-path closure of the legacy min/max gap.
- **NEO-CSS-16**: fresh `ref sync` emits both formulas; runtime `css()`
  resolves both classes; browser paints `560px`/`550px` max-widths at the
  pinned root; the unscanned `999r` (fed via `data-w`, a form no scan
  reads, so no literal can pool or harvest) has no rule, carries exactly
  `neo-css16__max-w_999r`, computes `max-width: none`, and warns exactly
  once naming prop + value + `app.js` call site. Also pins the harvest
  floor honestly: the pooled `0.25rem` mints
  `.max-w_0.25rem` onto the dynamic site (utility count 3, cf. NAMER-03).

## 5. Surprises

1. **Wants keep authored spellings.** First RHYTHM-06 run failed on
   `hasWant(result, 'maxWidth', '220r')` for the JSX form — JSX-alias
   wants record as `maxW`/`minH` (cf. SHORT-05's `p`/`m`). Spec fixed;
   compile output was correct all along.
2. **Harvest floor on the dynamic r-site.** The NEO-CSS-16 world mints a
   third utility (`.max-w_0.25rem`) from the pooled root length onto the
   refused `(maxWidth, [])` sink — HARVEST-01 behavior, not a bug. Pinned
   explicitly rather than asserted away.
3. **Pre-existing red: `harvest-census` byte pin.** Full atomic suite has
   1 failure: `publishes react.mjs bytes` measures 158317 raw vs pinned
   158073. Reproduced with my case moved out of the tree — stale pin
   ("re-verify after Jettison acceptance"; Jettison evidently landed and
   shifted +244 B). Untouched as out of scope; needs an owner to re-pin.
4. **`agentneo q` over a case dir scans gitignored artifacts.**
   `world/.reference-ui` + `world/dist` (generated) trip the gate; gating
   the 7 committed files is clean. Convention note for future case
   authors, not a code change.

## 6. Doom-wave handoffs

- **D1 — stale `harvest-census` byte pin** (§5.3): re-pin or re-verify
  `EXPECTED_BYTES.reactRaw/reactGzip` post-Jettison. One-line owner call.
- **D2 — duplicate utility rules** (repro §6.1, still visible): `css()`
  + JSX forms of one value emit identical rules twice, no emitter dedup.
  Harmless but bloat-adjacent; owning crew is atomic emitter.
- **D3 — `--spacing-root` doc gap**: whichever crew owns Neo surface
  docs should add the "rhythm requires `--spacing-root`" line (option D
  diagnostic is the follow-up if HQ wants it loud).
- **D4 — H-6 residuals** (runtime §3, unchanged by this crew): rs-side
  `sheetsComplete` pre-load semantics, post-load HMR race,
  load-hanging warnings. Still open, still owned where h6.md left them.
