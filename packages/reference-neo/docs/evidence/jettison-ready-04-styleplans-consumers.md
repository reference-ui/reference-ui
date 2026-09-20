# Jettison READY ask 4 — stylePlans consumers outside the counted set

Challenge to `docs/missions/operation-jettison.md` §5 consumers table.
Verdict: the table is right about the *shape* of every row, wrong about
the ATM-spec count, and misses 8 files — 3 opaque case specs, 2 root
vitest files, 1 duplicate TS contract, 1 Rust fixture-guard, 3 Rust unit
tests (the last two groups overlap-counted below as 8 distinct files).
Outside the rs/neo universe: **zero** — lib, core, matrix, `.agents`,
pipeline, other packages, and vendor read no plan field.

## Method

- Literal `stylePlans` over the repo; `result.runtime` over atomic case
  specs (catches opaque `createStylePlanIndex(result.runtime)` users);
  `createStylePlanIndex` over atomic tests; `\.style_plans` and
  `\.runtime\b` over Rust modules; `style_plans` over Rust src.
- `stylePlans|style_plans|RuntimeStylePlan|createStylePlanIndex|`
  `registerRuntimeData|patchBaseSystemRuntime|publishRuntimeBundle`,
  then `runtime-data|runtimeData|NativeRuntimeArtifact|baseSystem`, then
  `\.runtime\b`, over lib/core/matrix/`.agents` (+ mcp/icons/pipeline for
  contract types).
- `runtimeData\.|result\.runtime\.|base\.runtime\.` over neo src+tests to
  classify every artifact-field read as plans (must move) vs
  recipes/stylePropNames (v2-safe).
- Core `BaseSystem` type read; case-input `"runtime"` absence checked.

## §5 table audit (row by row)

| Table row | Verdict |
|---|---|
| 64 ATM specs + `tests/helpers.ts` `atomicGauges` | **CHALLENGED**: 63 case specs name `stylePlans` literally (list: 51/34/33/61/66/50/32 SITE + SEAM-01 + DIAG-10/09/12/14 + COND-20/18/17/19/22 + SITE-17/28/26/86/44/43/27/18/29/42/45/73/74/80/30/37/39/52/55/63/64/38/36/31/54/53/49/40/47/13/25/46/41/48/77/24/23 + STATIC-03 + HARVEST-01 + SEAM-03 + SHORT-08 + TOKEN-10 + DIAG-08 + MERGE-03 + EXT-01 + ATOM-06 = 63), **plus 3 opaque** (`createStylePlanIndex(result.runtime)`, no literal): `ATM-MERGE-01/spec.ts:18`, `ATM-MERGE-02/spec.ts:19`, `ATM-SITE-67/spec.ts:22` → **66 case specs**. `helpers.ts:167` confirmed. |
| `atomic/js/plans.ts` test-side indexer | confirmed (takes artifact; stays test-only). |
| `diagnostics/proof/render.rs::render_session` | confirmed — signature takes `&[RuntimeStylePlan]` (`render.rs:24–28`); single production call site `assembly.rs:97` (`&runtime.style_plans`); render.rs's own tests use local vecs (unaffected). |
| contracts fixtures + `contracts.test.ts` | confirmed, but the family is bigger (see Missed §1). |
| neo `sync/publish/styled.ts`, `sync/react.ts` | confirmed — both pass `runtime` opaquely (`styled.ts:40–73` JSON passthrough, no `stylePlans` literal; `react.ts:30–39` header emits `registerRuntimeData(systemName, runtimeData)`). |
| 12 neo `src/` + `tests/` files | **VERIFIED EXACT**: `src/runtime/css/{plans.ts,css.test.ts,eviction.test.ts,plans.test.ts}`, `src/sync/publish/system.ts` (`:33` empty v1 runtime, `:88` emitted `.d.mts`), `RECIPE-09/hover.spec.ts:43`, `RECIPE-11/identity.spec.ts:40`, `SITE-13/macro.spec.ts:39`, `SITE-14/hostless.spec.ts:27,67`, `SYNC-03/portable.spec.ts:31,84–87`, `static/TESTS.md`, `site/TESTS.md`. No 13th file: every other neo read is `.recipes`/`.stylePropNames` (v2-safe) or opaque (`registerRuntimeData(data…)`, `native.ts:47`, `sync/index.ts:131,135`). |

## Missed by the table (8 files)

1. `packages/reference-rs/modules/atomic/js/types.ts:115` — a **second TS
   definition** of `NativeRuntimeArtifact` (with `stylePlans`), imported by
   `atomic/js/{plans,runtime,index}.ts`, while neo imports
   `contracts/types.ts`. Both definitions must move to v2. (Repo already
   flags this drift class: `modules/atomic/SPEC.md:890`.)
2. `packages/reference-rs/modules/atomic/tests/seam.test.ts:63,151,158,166,195,204`
   — root vitest file reading `result.runtime.stylePlans` (+ `schemaVersion`).
3. `packages/reference-rs/modules/atomic/tests/token10.test.ts:49,71,145,152,153`
   — root vitest file reading `result.runtime.stylePlans`.
4. `packages/reference-rs/modules/atomic/tests/cases/ATM-MERGE-01/spec.ts:18`,
   `ATM-MERGE-02/spec.ts:19`, `ATM-SITE-67/spec.ts:22` — opaque
   `createStylePlanIndex(result.runtime)` consumers (counted in §1's 66).
5. `packages/reference-rs/modules/shared/src/testing/contracts.rs:51–53` —
   asserts the counted fixture's `schemaVersion == 1`; must move to 2 with
   the fixtures.
6. Rust `#[test]` asserts on `res.runtime.style_plans` (must move to
   `res.style_plans`): `modules/atomic/src/tests/seed.rs:15`,
   `modules/atomic/src/extract/site_plan_tests.rs:35,51`,
   `modules/atomic/src/extract/gating_tests.rs:100`.

## Outside the counted set: nothing reads plans

- **lib**: zero `stylePlans`/`style_plans`/`RuntimeStylePlan`/
  `registerRuntimeData`/`NativeRuntimeArtifact` references. Lib re-exports
  the neo-published `baseSystem` (`src/index.ts:7`) and copies
  `runtime-data.mjs` bytes (`scripts/build-package.mjs:22`) — both opaque,
  v2-safe. No `.runtime` property read in `src/`, `scripts/`, `book/`,
  `playwright/` (one `runtime.aliases` local in CT vite config — unrelated).
- **core**: zero on all identifiers. Core's own `BaseSystem`
  (`src/types/public/BaseSystem.ts:5–13`) has **no `runtime` field**
  (`name/fragment/css/jsxElements`) — the extends chain cannot see plans.
- **matrix**: zero `stylePlans`/`runtime-data`/contract-type references;
  `''` assertions are CSS-var polls and typecheck output (ask-3 evidence).
- **`.agents/`**: zero on all identifiers — no skill prose names plans.
- **other packages** (`reference-mcp`, `reference-icons`): zero.
- **pipeline/**, **vendor/**: zero `stylePlans`/contract-type references.
- **docs/**: only the three mission briefs (`jettison`, `reaper`,
  `error-correct`) name `stylePlans`; `ATOMIC.md`/`CORE.md` do not.
  Neo `docs/evidence/*` mentions are point-in-time records, not consumers.
- **Rust production**: no reader of `runtime.style_plans` besides
  `assembly.rs:97` (verified via `\.style_plans` + `\.runtime` sweeps);
  `spec_recipe_tests.rs:48,82` and `gating_tests.rs:64–68` read `.recipes`
  (v2-safe). No `PortableBaseSystem.runtime` consumer in Rust — upstream
  `runtime` is never read back.
- **Case inputs**: no `"runtime"` key in any `tests/cases/*/input/*`
  (`baseSystem.json` inputs carry spec `schemaVersion: 1`, unrelated to the
  artifact version); `ATM-SEAM-02`'s `schemaVersion` is the request version.
- **Neo-adjacent**: `playground/vite.config.ts:16` mentions
  `runtime-data.mjs` in a comment only; `PLAN.md` D4/D5 rows are prose.

## Corrected re-point set (mechanical)

66 case specs + `seam.test.ts` + `token10.test.ts` + `helpers.ts` (all
`result.runtime.stylePlans` → `result.stylePlans`) + `atomic/js/{plans,types}.ts`
+ `assembly.rs`/`lib.rs` (Slice 0, already in plan) + `contracts.rs:53`
(`1` → `2`) + 3 Rust `#[test]` files + the verified 12 neo files +
`contracts/*` + `styled.ts`/`react.ts` passthrough. Nothing in lib, core,
matrix, `.agents`, pipeline, or any other package moves.
