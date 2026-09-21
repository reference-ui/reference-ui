# Fasthull 1d review — derive recipe tables at runtime (lane d)

Reviewer: distinct nested agent (lead was inline: profiler+architect+implementer).
All checks firsthand, this tree (`voyage/hyperspace-perf-1-d`), box shared with
4 siblings. Verdict: **VERIFIED**.

## 1. Diff vs boundary

26 modified files + untracked profile memo. Boundary verdict per file:

| file | verdict |
| --- | --- |
| `atomic/src/recipes/table.rs` (fill bps + serialize-shape test) | ALLOWED — core |
| `atomic/src/runtime/plan.rs` (serde-skip maps + `responsive_breakpoints`) | ALLOWED — core |
| `neo/src/runtime/recipe/recipe.ts` (compose + `deriveResponsiveClass`) | ALLOWED — core |
| `neo/src/runtime/recipe/recipe.test.ts` (17 literal expectations) | ALLOWED — core |
| `neo/src/sync/publish/system.ts` (template: maps optional + bps) | ALLOWED — publish |
| `contracts/types.ts`, `atomic/js/types.ts` (recipe § only) | ALLOWED — types |
| `contracts/fixtures/compile-result.json` (recipe § only) | ALLOWED — fixture |
| 5 NEO specs (02/03/08/09/11) | ALLOWED — specs |
| ATM-RECIPE-02/04/07 specs + 02/07 READMEs, `spec-recipes.test.ts` | ALLOWED — stations |
| ATM-SITE-03, ATM-SITE-15 one-liners | ALLOWED — flagged collateral |
| `harvest-census.test.ts` (react pins only) | ALLOWED — flagged collateral |
| `atomic/SPEC.md`, `recipes/README.md` (4 doc lines) | ALLOWED — flagged collateral |
| `VOYAGE-HYPERSPACE-PERF.md`, `reports/latest/*` | log + sanctioned dirty bench output |

Forbidden: `recipes/mod.rs` (lane c), `native.rs`, `assembly.rs`,
CSS emission, extraction, namer, scale/generator/sampler — all untouched
(confirmed via status + name-only). `sync/react.ts` needed no change
(registration passes tables by reference; suites green).

## 2. Bench deltas (firsthand, `--scale small,medium --runs 1 --keep`)

Exact bytes vs pin `5eda2c60b7e5/result.json`:

| scale | styles.css | css gzip | runtime-data.mjs | data Δ |
| --- | --- | --- | --- | --- |
| small | 550910 → 550910 IDENTICAL | 34599 → 34599 | 255767 → 104921 | −59.0% |
| medium | 2554607 → 2554607 IDENTICAL | 146093 → 146093 | 808657 → 168278 | −79.2% |

Data bytes match the lead's 102.5/164.3 KiB exactly. Timed numbers
single-run on a shared box (small 152ms/117.5MiB, medium 433ms/187.2MiB) —
directionally down, not claimed as wins. Enterprise (−87%) and churn cited
from the lead with the shared-box caveat, not re-run.

## 3. Derivation (firsthand, own script `/tmp/lane-d-review-derive.mjs`)

No old-contract repos survive, so re-derived on my own kept repos:
full cartesian per table from shipped inputs, every token grounded in
`styles.css` (incl. correct `\32 xl` escaping for `2xl:` selectors):

- small: 22/22 new-contract, 594 combos, 2938/2938 tokens in sheet, 990/990 responsive in sheet
- medium: 88/88 new-contract, 2376 combos, 11758/11758 tokens in sheet, 3960/3960 responsive in sheet
- GRAND: 110 tables, 2970/2970 combos, 14696/14696 tokens, 4950/4950 responsive — 0 leaks, 0 misses

Counts match the lead's old-shipped counts exactly. `runtime-data.mjs`
contains zero `combinations`/`responsiveVariantMap` occurrences.

## 4. Stability (firsthand)

- `pnpm agentrs c atomic`: 499 pass / 0 fail (lead counted 498; zero fail either way)
- `pnpm agentrs v atomic`: 298/299 — ONLY SITE-54 fails, at `hasWant`
  (spec.ts:43). Zero recipe/combination/responsive refs in that spec;
  specifier-resolution + wants station, untouched by this diff —
  unrelated by construction. Pre-existing per lead's stash log (not
  re-proven: reviewer is read-only, no stash).
- `pnpm agent vt recipe.test.ts`: 17/17 pass
- `pnpm agentneo run` 02/03/08/09/11: all 5 PASS. Paint refs present
  (7–12 per spec); zero paint-assertion lines changed in the diff.
- `pnpm agentneo q` over the 8 touched neo files: 0 errors, 1 warning
  (08 function-lines; file shrank 121→119 lines — pre-existing kind).
- Churn guardrail (cited, not re-run): lead's log + the churn
  `report.md` I read before my bench overwrote `reports/latest/`
  (sanctioned): data 386.3→143.2 KiB, css 8.3 MiB identical,
  sync/RSS delta inside post-change run spread on a shared box.

## 5. Contract change: SIGN

The 5 NEO specs + 7 engine stations now assert literal composed strings
(and map absence) instead of `table.combinations[key]`. Signed because:
paint assertions are byte-untouched; literals are stronger than the old
self-referential pins; both legacy fallback paths are tested
(legacy combos win on hit; legacy responsive map honored without a bp
list; degrade-to-base when neither exists); types + `#[serde(default)]`
keep old artifacts parseable.

## 6. Architecture honesty: as stated, acceptable

- RS still builds both maps in memory (serde-skip only) — verified in
  `table.rs`; wave-2 cleanup noted, zero byte delta. Acceptable.
- `react.mjs` +222B raw / +90B gzip derivation code — census re-pinned
  (148379→148601), suite green. Acceptable.
- `responsiveBreakpoints` per-table measured 52B raw JSON (brief said
  ~35B — corrected; list alone is 27B + key). ~4.6 KiB at medium vs
  ~640 KiB removed. Per-table (not per-artifact) is correct: the gate
  must travel with the table. Acceptable.
- `baseSystem.mjs` co-shrink is code-verified (`patchBaseSystemRuntime`
  round-trips the same object), not artifact-verified — bench publishes
  styled/ + react/ only. No gap.

## Verdict

**VERIFIED** — boundary clean, bytes as claimed (css identical, data
−59%/−79% firsthand), derivation 100% sheet-grounded, stability holds
(SITE-54 unrelated), contract renegotiation signed.
