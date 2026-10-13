# Mission: Neo `layers` coverage + reference-rs test layout

Branch `neo-layers-tests` (worktree `.claude/worktrees/neo-layers`), rebased onto
public-release at 32f4cbd92 on 2026-10-13. Not merged by this mission.

## Track 1 — Neo-native coverage for `layers`

Goal: prove the `layers?: BaseSystem[]` contract in Neo's own loop (cases +
Playwright), so the layers legs no longer depend on matrix `chain-t2`/`chain-t8`.

### Facts (scout pass, file:line in packages/reference-neo)

- Type `src/config/types.ts:44-49`; validation `src/config/validate.ts:104-107`
  → `src/system/base/validate.ts` (header `Config field 'layers' is invalid.`,
  reasons: `Expected an array of BaseSystem objects.`, `Entry N must be an object.`,
  `Entry N must have a non-empty 'name'.`, `Entry N (x) must include synced system
  data ...`). Extends errors mask layers errors (extends validated first).
- Readers of `config.layers`: only `src/sync/index.ts:162` (upstreamSystems:
  extends then layers, stream names, self excluded, first-occurrence dedupe),
  `:179` (container root), `:220` (`mergeStreams([...extends, ...layers])`).
- Extends-only: fragments (`src/collect/lib/evaluate.ts:133,164`), roster
  (`src/system/base/jsx.ts:71`), so tokens/recipes/keyframes/fonts/types/roster of a
  layer never reach the consumer's compile spec, typegen or published roster.
- `mergeStreams` (`src/system/base/streams.ts:185-214`): statement
  `@layer <expansion names, first occurrence, self filtered>, <self>;`, then
  upstream blocks in expansion order (not deduped), then own block. A layer entry
  without `streams` contributes no CSS (only its name as an upstream qualifier).
- Stand-in upstreams in existing cases carry no `streams`, so a layers case must
  sync a real upstream world (NEO-CHAIN-06/07/08 pattern).
- Suspected: long-lived process keeps a stale bare-imported upstream baseSystem
  (Node ESM cache; `src/config/evaluate.ts:30` cache-busts only the entry).
- Generated `system.d.mts` ReferenceUIConfig omits `layers`
  (`src/system/base/sources.ts:79-86`).

### Decisions

- D1. New group `tests/cases/layers/` (SPEC.md, TESTS.md), ids `NEO-LAYERS-NN`.
  Note: selector `run NEO-LAYER` (prefix) also matches NEO-LAYERS-*; use
  `NEO-LAYER-` for the cascade-layer group.
- D2. BAS-LAYER-01..04 (reference-rs base-system SPEC.md:189-200) is NOT ticked
  here: its rule is "a passing unit test title in `base_system`" and base-system
  has no layers input at all (README: "`layers` is not here yet"). It needs new
  Rust API + cargo tests; listed as separate work.
- D3. Matrix `chain-t2`/`chain-t8` stay as secondary proof (bundler/runtime
  spread), Neo cases become the primary layers proof.

### Slices

| Slice | Case | Proves | Status |
| --- | --- | --- | --- |
| L1 | NEO-LAYERS-01 | layer styles reach the consumer and paint; cascade: extends < layers < own | planned |
| L2 | NEO-LAYERS-02 | visual-only boundary: layer tokens/recipes/roster/types absent; same upstream under extends present | planned |
| L3 | NEO-LAYERS-03 | ordering: extends then layers, config order, dedupe and self-exclusion as implemented | planned |
| L4 | NEO-LAYERS-04 | container root + upstream-system detection through layers | planned |
| L5 | NEO-LAYERS-05 | validation errors at config load (messages, no output left) | planned |
| L6 | NEO-LAYERS-06 | re-sync after a layered (and extended) upstream changes | planned |
| L7 | docs | chain/SPEC.md, layer/SPEC.md, NEO-CHAIN/NEO-LAYER READMEs point at NEO-LAYERS | planned |

## Track 2 — reference-rs test suites in atomic's shape

### Facts (inventory scout)

- No `case.json` exists anywhere in reference-rs. atomic's per-case manifest is
  `spec.ts` (`{ id, verify(result) }`); the shared runner `testing/runner.ts`
  discovers by folder regex and asserts `spec.id === folder id` (:41-44).
- Case-driven suites: atomic (260, `ATM-AREA-NN`), atlas (15, `ATL-AREA-NN-slug`),
  tasty (40, `TST-AREA-NN-slug`), styletrace (21, snake_case). Non-case: typegen,
  canon, primitives (TS), module-graph (14 Cargo `tests/*.rs` + `tests/common/`);
  diagnostics, runtime, base-system, shared have no `tests/` dir.
- Baseline reds were environment, not code: styletrace needs the gitignored
  `fixtures/sync-root/.reference-ui` (cloned from the main checkout → 89 cargo /
  32 vitest green). ATM-SITE-54 fails 1 vitest test on base (under investigation).

### Layout spec (oracle decision, adopted)

1. No `case.json`: `spec.ts` stays the manifest (that is atomic's real shape; the
   runner already enforces id = folder). Owner to confirm if a separate
   `case.json` is still wanted — a follow-up, nothing here depends on it.
2. Case folder = raw ID everywhere. atlas/tasty drop the `-slug` (slug moves to
   the README H1); styletrace gets minted `STT-<AREA>-NN` ids (WRAP 01-07, BAR
   01-07, PKG 01-03, PIPE 01-02, NEG 01-02, alphabetical within area; old snake
   name in the README H1). Accepted golden exception: goldens that embed the
   folder name (atlas `caseName`, tasty TST-ERR-01/TST-RXP-02 manifest paths)
   change by exactly old→new name, proved by
   `diff <(git show HEAD:<old> | sed 's/<old>/<new>/g') <new>` printing nothing.
3. `tests/` top level holds only folders (+ optional README.md):
   `cases/<ID>/{README.md,spec.ts,input/,output/}`, `suites/*.test.ts` (every
   vitest entry incl. cases.test.ts), `harness/*.ts` (every non-test helper),
   `rust/` (Cargo integration targets), `fixtures/`, `goldens/` (atomic
   `namer-goldens/` → `goldens/namer/`).
4. Rust integration tests: `tests/rust/<name>.rs` with one
   `[[test]] name="<name>" path="tests/rust/<name>.rs"` each (names unchanged);
   module-graph `tests/common/mod.rs` → `tests/rust/common/mod.rs`.
5. Non-case suites get the layout only (no forced cases). No change: diagnostics,
   runtime, base-system, shared.
6. Order: atlas pilot (also sets runner default folderPattern), then tasty,
   styletrace, atomic, module-graph, typegen+canon+primitives in parallel
   sub-worktrees; typegen last after rebasing past AnimationToken.

### Baseline counts (before)

| Module | `agentrs c` | `agentrs v` |
| --- | --- | --- |
| atomic | 849 passed | 319 passed, 1 failed (ATM-SITE-54) / 15 files |
| atlas | 24 | 61 / 6 files |
| tasty | 90 | 83 / 5 files |
| styletrace | 89 (with fixture) | 32 / 3 files |
| typegen | 73 | 54 / 7 files |
| canon | 58 | 15 / 1 file |
| module-graph | 109 (`--crate module_graph`) | n/a |
| primitives | n/a | 29 / 5 files (`v modules/primitives/`) |

## Landings

| Hash | What | Proof |
| --- | --- | --- |

## Verified at

(pending)

## Left

- BAS-LAYER-01..04 in reference-rs base-system (new Rust layers API + tests).
