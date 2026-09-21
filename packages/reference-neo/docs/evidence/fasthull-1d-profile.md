# Fasthull 1d profile — derive recipe tables at runtime (lane d)

Lead-inline profile (root pool 8/8: profiler+architect+implementer inline;
reviewer will be a distinct nested agent). All counts firsthand, this tree,
seed 7, box shared with 4 siblings.

## Baseline (own tree, `reports/latest/`, --runs 1)

| scale | sync | peak RSS | styles.css | runtime-data.mjs |
| --- | --- | --- | --- | --- |
| small | 520ms (pin 150ms; box contention) | 117.0 MiB (pin 121.8) | 538.0 KiB = pin | 249.8 KiB = pin |
| medium | 466ms (pin 461ms) | 189.8 MiB (pin 207.6) | 2.4 MiB = pin | 789.7 KiB = pin |

Bundle bytes byte-identical to pin `5eda2c60b7e5`. Timed numbers noisy under
shared box; final uses medians + conditions. Kept repos: small
`neo-bench-kZWua7`, medium `neo-bench-lCDnxt`.

## Table breakdown (firsthand, `/tmp/lane-d-count.mjs`, summaries only)

| scale | tables | combos (share) | responsive (share) | variantMap | compounds |
| --- | --- | --- | --- | --- | --- |
| small | 22 | 594, 27.0/table, 61.4% | 990 entries, 27.0% | 5.1% | 2.4% |
| medium | 88 | 2376, 27.0/table, 61.8% | 3960 entries, 26.8% | 5.0% | 2.3% |

combinations + responsiveVariantMap = 88.4% / 88.6% of the recipes table.
Breakpoint set uniform across every table×axis: `2xl,lg,md,sm,xl`.

## Derivation proof (firsthand, 100%)

Recomputed from shipped base+variantMap+compoundVariants only:

- combinations: `base + variantMap lookups in variantKeys order + matching
  compound classNames` — **594/594 small, 2376/2376 medium exact**.
- responsive: `` `${bp}:${variantMap[axis][value]}` `` — **990/990 small,
  3960/3960 medium exact** (`responsive_variant_class` is a literal prefix,
  `recipes/name.rs:33-35`, never re-resolved).

Code: publisher `atomic/src/recipes/table.rs:24-43` (`build`),
`:120-143`+`:184-208` (cartesian), `:156-171` (class join), `:49-68`
(responsive); contract `runtime/plan.rs:47-60`; ship site
`neo/src/sync/publish/styled.ts:60-72` (`export const runtimeData =
JSON.stringify(runtime)`, styled is data-only D4 — no lazy code in the
artifact). `patchBaseSystemRuntime` (`styled.ts:40-51`) round-trips the same
object into `baseSystem.mjs`, so both artifacts shrink together.

## Consumer analysis (firsthand, every reader)

Runtime (`neo/src/runtime/recipe/recipe.ts`): `lookupCombination` (:160-173)
reads `table.combinations[key]`; on miss `:251` ALREADY falls back to
`composeClasses` (:183-199, base+variantMap+compounds — identical join to
`table.rs:156-171`, incl. `className !== undefined` guard for pre-RS-8
records). `resolveResponsiveClasses` (:144-158) reads the map with NO
fallback; semantics to preserve: unknown bp/value → dropped silently
(pinned by `recipe.test.ts:148-155`, incl. `xxl` and `md:'nope'`), absent map
→ base only (`:157-163`). Registration `sync/react.ts:32-35` passes tables
by reference into the bundled `react.mjs`.

Shape-pinners that read shipped tables directly (contract change below):

- NEO-RECIPE-02/03/08/09/11 specs read `table.combinations[key]` (02 also
  defaults/variantMap; 08 reads `responsiveVariantMap` + base combination).
  They import raw `runtime-data.mjs`, so registration-time derivation cannot
  satisfy them — 08 reads before registering.
- Engine stations via top-level `result.recipes`: ATM-RECIPE-02 (:23-31),
  ATM-RECIPE-04 (:32-36), ATM-RECIPE-07 (:32-36 + sheet cross-check :52-57),
  ATM-SITE-03 (:34-37), ATM-SITE-15 (:21, non-empty assertion).
- Via live `result.runtime.recipes`: `spec-recipes.test.ts:35-42`.
- In-memory only (unaffected): `spec_recipe_tests.rs:55-56`,
  `table.rs` unit tests, `mod.rs:348` (lane c's file — untouched).
- Type mirrors: `contracts/types.ts:61-76`, `atomic/js/types.ts:106-123`,
  generated-types template `neo/src/sync/publish/system.ts:94-103` (already
  lacks the responsive map).
- Fixture `contracts/fixtures/compile-result.json` (table carries
  `combinations`, no responsive map, no top-level `recipes`); consumers
  `contracts.test.ts` (presence-only, safe) and `seam.test.ts` (no recipe
  assertions, safe).
- Docs asserting shipped shape: `atomic/SPEC.md:712,727`,
  `recipes/README.md:14-15`, `ATM-RECIPE-07/README.md:3`.
- matrix/, pipeline/, lib: zero readers. `sync.test.ts`, `types-bundle.ts`,
  `system-surface.d.ts`: zero table-shape assertions. No `react.mjs` size
  bound test found; SYNC-06 byte-stability holds (derivation deterministic).

## Recommended design (one change)

RS keeps building the in-memory maps (canonical derivation, fully tested)
but stops serializing them: `#[serde(skip_serializing)]` on `combinations`
+ `responsive_variant_map`, plus `#[serde(default)]` on `combinations` so
old/artificial JSON still parses. New shipped per-table
`responsive_breakpoints: Vec<String>` (from existing
`container_breakpoints`, still used by the emitter in lane c's `mod.rs:134`
— function stays). TS: `lookupCombination` tolerates absent combinations
(miss → existing `composeClasses`, now the only path);
`resolveResponsiveClasses` derives `` `${bp}:${variantMap[axis][value]}` ``
gated on (bp ∈ shipped list) ∧ (axis/value ∈ variantMap). Types optionalize
the dropped maps, add `responsiveBreakpoints`. The 5 NEO specs + 7 engine
stations + `recipe.test.ts` + fixture + 3 doc lines renegotiated to the
compose/derive contract with literal expectations (stronger than the current
self-referential `recipe(x) === table.combinations[key]` pins).

Rejected: lazy Proxy in `runtime-data.mjs` (violates D4 data-only, dies in
the `baseSystem.mjs` JSON round-trip); ship-observed-subset (needs an
extraction signal — out of bounds); stop-building in RS (saves unmeasured
micro-CPU but forces touching lane c's `mod.rs:348` + `spec_recipe_tests.rs`
— wave-2 cleanup with zero byte delta, noted for the log).

## Boundary + shared-file flags (for captain merge)

Mine: `table.rs`, `plan.rs`, `recipe.ts`, `recipe.test.ts`,
`sync/publish/system.ts` (template), `contracts/types.ts` §61-76,
`atomic/js/types.ts` §106-123, fixture recipe sections, 5 NEO specs,
ATM-RECIPE-02/04/07, `spec-recipes.test.ts:35-42`, SITE-03/15 (collateral
one-liners — forced by the struct change, flagged), 3 doc lines. NOT
touched: `mod.rs` (lane c), CSS emission, extraction, namer, `native.rs`,
`assembly.rs`, seam/namer/hostless tests.

Collisions: `contracts/types.ts` (lane a §153+, disjoint hunks);
`atomic/js/types.ts` (lane a CompileResult seam — check hunk distance at
review); fixture (lane a top-level dead fields, disjoint sections);
`spec-recipes.test.ts:44,58` (lane a) adjacent to mine `:35-42` — SAME-HUNK
RISK; SITE-15 `:20-21` (lane a re-point + `css.classes`/`wants` removal vs
my `:21`) — SAME-HUNK LIKELY; NEO specs (lane c re-proof may touch sheet
assertions — different hunks from my combinations reads); ATM specs
`result.recipes` re-point lines (lane a) vs my assertion lines (02/04/07
disjoint; SITE-03 `:29` vs `:34` tight but disjoint).
