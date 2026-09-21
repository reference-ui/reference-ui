# Fasthull 2b architect rulings — "dead product" (B3+B5)

Architect, read-only role. All cites lead-read firsthand in this tree.
Profiler memo (`fasthull-2b-profile.md`) concurred throughout; finding 1
(overlap, don't sum) and finding 2 (three-part fence) adopted below.

## 1. B3 FENCE (mandatory, tripwire)

Coupling VERIFIED at true paths (recon's bare `assembly.rs` =
`packages/reference-rs/modules/atomic/src/assembly.rs`):
- `assembly.rs:100-105` `render_session(sink.facts(), &style_plans, …,
  &mut diagnostics)` reads plans BEFORE `lib.rs:115-120`
  `partition_channels` strips compiler lines (`lib.rs:208-231`).
- Mechanism (`diagnostics/proof/render.rs:24-35` + `plans.rs:26-31`):
  gated (empty) plans ⇒ empty emitted-key set ⇒ covered rejects keep
  (not drop) legacy lines, every non-hole known-prop exact gains a
  causeless warning. Default diagnostics GROW unless the load has no
  rendered facts.
- Profiler finding 2 (adopted): fence also covers plan-build atom
  inserts (`runtime/builder.rs:191,232,279`) and plan-resolve deduped
  diagnostics (`builder.rs:64-86`).

RULING — conditional concur with tripwire. Implementer gates
`plan_builder.build` (`assembly.rs:68-70`) behind proof ONLY if all
three hold, else the plan-gating sub-move is KILLED and B3 lands
css/recipes/wants only (re-proof on reduced scope):
- (a) Proof-off diagnostics sweep: every ATM case input compiled via
  `compileCase` with `extras.logs=[]` (harness default is proof —
  `tests/helpers.ts:128` — so override wins), `result.diagnostics`
  JSON bytes pre/post cmp: ZERO deltas.
- (b) Cargo unit tests with diagnostics assertions pass UNCHANGED.
  NO test collateral may touch a diagnostics assertion, ever.
- (c) Bench small/medium/enterprise + churn: `diagnostics` bytes +
  `styles.css` + `runtime-data.mjs` + `baseSystem.mjs` bytes pre/post
  cmp: ZERO deltas.
Sheet-identity (plan atoms ⊆ want atoms; `site_plan_tests` asserts the
class-subset firsthand) is discharged by (c) + ATM sheet goldens.

CSS-MAP GATING: fence-free, VERIFIED. Sole writer
`assembly.rs:80` (`build_css_runtime`, `:180-193`); zero in-compile
readers (grep: only move into `CompileResult.css` at `:112`; slim
`modules/atomic/native.rs:126-140` drops it). Gate freely.
Collateral: `src/tests/seed.rs:14` → expect `css.is_none()` (pins the
gated default); `site_plan_tests.rs` `compile_code` + `gates.rs`
`request_for` add `logs:['proof']` (row assertions, NOT diagnostics).

PROOF-CHANNEL RESTORATION CONTRACT: `logs` containing `'proof'` ⇒
`stylePlans`, `wants`, `css`, top-level `recipes`, `atomCount` ALL
present with pre-change bytes on every fixture. Existing stations
(harness always sends proof) + GHOST css goldens prove it; no new
proof tests required. OVERRULE on recon file list: `native.rs`
UNTOUCHED — `logs` already threads into `compile()` (`native.rs:62`);
B3 = `types.rs` `wants_proof()` helper (sibling to
`wants_compiler_logs`, `:46-54`) + `lib.rs:100-106` ctx-init flag +
`assembly.rs` gates. `atom_count` ungated (scalar `len()`, slim drops
it, cost ~0).

## 2. HUNK SPLIT (one sequenced implementer, B3 FIRST then B5)

- B3 owns: `assembly.rs:43-120` (finish region: plan gate `:68-70`,
  css gate `:79-80`, runtime-map ownership, top-level collect `:93-96`,
  render guard `:98-105`); `runtime/builder.rs:295-303`
  (`build_recipe_runtime_tables` — ownership inversion optional but
  B3-only); `types.rs` helper; `lib.rs:100-106` one line. B3 NEVER
  touches `table.rs`, `plan.rs`, `recipes/mod.rs`, `recipe.ts`.
- B5 owns: `recipes/table.rs` (all: `build_shipped()` + kept
  `build()`); `runtime/plan.rs` struct/serde; `recipe.ts`;
  `contracts/types.ts:61-81`, `atomic/js/types.ts:106-123`,
  `publish/system.ts:94-105` mirrors; `mod.rs:97-99` ONE-LINE
  call-site (`build` → `build_shipped`) + `:348` test collateral
  ONLY. B5 NEVER touches `builder.rs`, `assembly.rs`,
  `compile_variants` (`mod.rs:103-120`), or the `mod.rs:128-144`
  gate region.
- Lane-A shared files (captain sequences at merge, order d→c→b→a so
  lane A rebases): `assembly.rs` — B stays ≤:120, A stays ≥:146
  (`compile_recipes` join); `lib.rs` — B stays at `:100-106`, A stays
  in extract/sink/threading regions; `mod.rs` — B's `:98` one-liner
  is single-token and rebasable, flagged; A's `:63-101` signature
  threading may touch adjacent lines. Lane-C: `system.ts` B5 mirror
  `:94-105` vs B2 logic `:222-230` — 117 lines apart, flag at merge.

## 3. B5 CONTRACT

- KEEP SHIPPING (verified non-invertible, `table.rs:86-98` +
  `:100-114`: `expand_predicates` cartesian fans multi-value
  predicates to N records sharing one className — a shipped
  single-value selection cannot invert the grouping; defaults are
  authored data): `compoundVariants` (95.1 KiB),
  `defaultVariants` (30.5 KiB). Also KEEP: `qualifiedName`
  (derivation stem; sole identity in the proof Vec),
  `variantKeys` (order-canonical; recon does not name it — KEEP).
- DROP/RESHAPE: `variantMap` → per-axis value-name lists
  (`Record<axis,string[]>`); `base` DROPPED (derive
  `{stem}__base`, `name.rs:18-20`); `className` DROPPED (zero prod
  readers — grep: only `recipe.ts` reads tables, never
  `className`/`qualifiedName`); per-table `responsiveBreakpoints`
  HOISTED to artifact top level (uniformity proven: 88/88 medium,
  pure fn of scale `table.rs:77-84` — implementer re-censuses
  440/440 enterprise pre-hoist; artifact field optional-in-types +
  always-emitted, schemaVersion stays 2, lane-d style).
- DERIVATION EXACTNESS: runtime port of `variant_class`
  (`name.rs:23-26`) MUST use first-char axis prefix
  (`tone`/`tint` ⇒ `_t_` collisions reproduced). In-memory struct
  keeps shipped-input fields (minimal churn); reshape is
  serialization-side (`serialize_with`/skips — Deserialize
  unaffected, old JSON still parses); `build_shipped()` skips ONLY
  `combinations` + `responsive_variant_map` (`table.rs:29-31`).
  `registerRecipeData` gains optional 3rd param (hoisted list);
  table-level wins when present (legacy); `react.ts:35` header +
  spec call-sites updated. Clean break on `variantMap` shape (no
  legacy branch); `lookupCombination`/`responsiveVariantMap`
  legacy reads stay as-is (harmless).
- E2E RECOMPUTE PROOF (lane-d style, counts censused by
  implementer): every removed class string recomputed from new
  shipped inputs — medium ~792/792 + enterprise 3960/3960 variant
  classes, 88/88 + 440/440 base, responsive re-derived
  cross-checked vs sheet (lane-d 11758-token style); first-char
  collision unit in `recipe.test.ts` with LITERALS (unit-only, no
  new NEO cases).
- SPEC RENEGOTIATION (literals stronger than pins, paint assertions
  byte-untouched — any paint-assertion change = automatic GAPS):
  recon's "5" UNDERCOUNTS. Firsthand grep: SEVEN NEO specs read
  `variantMap` classes/`base` — 02, 03, 04 (`:50` spread + `base`),
  08, 09, 10 (`:42`), 11. All seven renegotiated; 01/05/06/07
  untouched (01 is literals-only — proves derivation). Engine
  stations: ATM-RECIPE-02/04/07, SITE-03/15, `spec_recipe_tests`
  (`:53-58` — note `:58` `res.recipes` needs B3's proof
  collateral first), `spec-recipes.test.ts:35-42`,
  `recipes/mod.rs:348` (drop map assert, rules asserts stay),
  `recipe.test.ts` fixture + pins, fixture
  `contracts/fixtures/compile-result.json` table section,
  `atomic/SPEC.md:712,727` + `recipes/README.md:14-15` +
  `ATM-RECIPE-07/README.md:3` doc lines. `system.ts` mirror is
  TYPE-ONLY (lane C owns logic — different hunks, flag at merge).

## 4. CONCUR-OR-KILL + IMPLEMENTER PROOF OBLIGATIONS

- B3 css-map gating: CONCUR. B3 wants gating: CONCUR. B3
  top-level-recipes gating (+ optional builder.rs ownership
  inversion): CONCUR. B3 plan-build gating: CONDITIONAL CONCUR
  (tripwire §1; kill sub-move on any sweep delta, land the rest).
- B5 `build_shipped` + reshape + hoist (hoist LAST inside B5 with
  its own ~22 KiB step-proof) + renegotiation: CONCUR.
- BYTES RULE: B3 = byte-identical EVERYTHING (css, data,
  baseSystem, react bundle, diagnostics). B5 = data 518→~315 KiB
  enterprise, `styles.css` byte-identical, resolution identical,
  paint + stations hold. No kills; nothing unsound as contracted.

## 5. CHURN / STABILITY

- `--scale churn` RUNS at BOTH checkpoints (B3 intermediate AND B5
  completion): B3 touches every compile's assembly (churn bytes +
  diagnostics identical required); B5 reshapes data (churn data
  shrinks per hypothesis, css + diagnostics identical). No skip.
- Stability: `pnpm agentrs` on atomic (cargo + vitest + `q`) AND
  full `pnpm agentneo`, in-tree, at both checkpoints. RS ONLY via
  `pnpm agentrs`. Pre-existing red named + shown unrelated, never
  absorbed.
