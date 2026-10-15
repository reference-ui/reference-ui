# Mission: Neo `layers` coverage + reference-rs test layout

Branch `neo-layers-tests` (worktree `.claude/worktrees/neo-layers`), rebased onto
public-release at 25fcabfce on 2026-10-13. Not merged by this mission.

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
| L1 | NEO-LAYERS-01 | layer styles reach the consumer and paint; cascade: extends < layers < own | done |
| L2 | NEO-LAYERS-02 | visual-only boundary: layer tokens/recipes/roster/types absent; same upstream under extends present | done |
| L3 | NEO-LAYERS-03 | ordering: extends then layers, config order, dedupe and self-exclusion as implemented | done |
| L4 | NEO-LAYERS-04 | container root + upstream-system detection through layers | done |
| L5 | NEO-LAYERS-05 | validation errors at config load (messages, no output left) | done |
| L6 | NEO-LAYERS-06 | re-sync after a layered (and extended) upstream changes | done |
| L7 | docs | chain/SPEC.md, layer/SPEC.md, NEO-CHAIN/NEO-LAYER READMEs point at NEO-LAYERS | done |

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
  32 vitest green). ATM-SITE-54 needs gitignored `input/node_modules` (→ 320/320).

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
| atomic | 856 passed (6 result lines) | 320 / 15 files (with gitignored fixtures) |
| atlas | 24 | 61 / 6 files |
| tasty | 90 | 83 / 5 files |
| styletrace | 89 (with fixture) | 32 / 3 files |
| typegen | 73 | 54 / 7 files |
| canon | 58 | 15 / 1 file |
| module-graph | 109 (`--crate module_graph`) | n/a |
| primitives | n/a | 29 / 5 files (`v modules/primitives/`) |

### After (re-run by orchestrator on neo-layers-tests)

| Module | `agentrs c` | `agentrs v` | Commit |
| --- | --- | --- | --- |
| atlas | 24 = | 61 / 6 = | 8ea71c38f, 26878b55f |
| styletrace | 89 = | 32 / 3 = | 25c07eae0 |
| atomic | 856 = (6 lines) | 320 / 15 = | 98c54a4a0 |
| module-graph | 109 = (16 lines) | n/a | 03d12bd4c |
| typegen | 75 = (base after AnimationToken rebase) | 56 / 8 = | 34240e4bc |
| canon | 58 = | 15 / 1 = | 34240e4bc |
| primitives | n/a | 29 / 5 = | 34240e4bc |
| tasty | 90 = (cook's working tree) | 83 / 5 = | NOT LANDED (see Left) |

## Landings (hashes after the final rebase onto public-release 5de2bb470)

| Hash | What | Proof |
| --- | --- | --- |
| b182307c7, f8a68d54c | NEO-LAYERS-01 + layers group SPEC/TESTS | PASS |
| 017e825fd | NEO-LAYERS-05 + 2 layers unit tests (validate.test.ts 9 → 11) | PASS |
| 4f5b2e599 | NEO-LAYERS-02/03 | PASS |
| 9afd8d40e | NEO-LAYERS-04/06 (06 red on bare legs = B1) | 04 PASS |
| 4c03eeaa1 | B1 fix: config bundle inlines published upstream baseSystem | NEO-LAYERS-06 PASS; reload.test.ts fails without fix |
| a50ffbd63 | refiner: regression test pins unresolvable/builtin/alias imports external | src/config 39 passed |
| 597005c7a | chain/layer docs point layers legs at NEO-LAYERS | grep "no Neo case authors" empty |
| 8ea71c38f … 34240e4bc | track 2 module migrations (table above) | counts equal |

## Bugs

- B1 (real, Neo, FIXED 4c03eeaa1 + a50ffbd63): a consumer config importing an
  upstream baseSystem by BARE specifier kept the first-loaded upstream for the
  life of the process (`src/config/bundle.ts` `packages: 'external'` + entry-only
  cache-bust in `src/config/evaluate.ts:30`); hit watch mode for reference-lib's
  `@reference-ui/icons/baseSystem`. Fix: onResolve plugin inlines a resolved
  `baseSystem.m?js`, everything else stays external; watch graph unchanged.
- Pinned as current behaviour, not fixed (D6/D7 in layers/SPEC.md): a system in
  both buckets prints its block twice; a layers entry named like the consumer
  ranks with own.
- Environment, not code (fresh clone/CI red): gitignored fixtures exist only in
  the main checkout — styletrace `fixtures/sync-root/.reference-ui`, atomic
  ATM-SITE-16/54/58 `input/node_modules`, neo NEO-DIAG-56/57
  `world/decl/.reference-ui`. styletrace `loads_real_reference_core_style_props`
  fails if `packages/reference-lib/.reference-ui` exists but is partial.

## Verified at 34240e4bc

- `pnpm agentneo run NEO-LAYERS-01..06`, NEO-CHAIN-06, NEO-SYNC-08, NEO-WATCH-01 → PASS.
- `pnpm agentneo q` (61 files: layers cases, src/config, validate.test.ts) → 0/0.
- `npx vitest run src/config src/system/base/validate.test.ts` → 50 passed.
- Full `pnpm agentneo run` (on a50ffbd63, pre-typegen-move; neo untouched since)
  → failures = the 12 known (MERGE-06, SITE-06/23/26/27, STATIC-01/02/03,
  NAMER-03/04, REF-04/11) + NEO-DIAG-56/57, which pass once their gitignored
  `world/decl/.reference-ui` is cloned from main → no new failures.
- `pnpm agentrs t` → Rust PASSED, Vitest 51 files / 668 passed, quality passed
  with warnings, COMPLETE SUITE VERIFICATION PASSED.
- `pnpm agentrs q --all` → fails only on gitignored tasty `tests/.scratch`
  output (walker IGNORE_DIRS lacks `.scratch`; pre-existing).

## Left

- tasty migration done but UNCOMMITTED in worktree `.claude/worktrees/nl-tasty`
  (base 44e4ef2f9): the commit was denied by the permission classifier. 80
  goldens re-hash because export names hash `cases/<folder>/`
  (export_names.rs stable_hash_symbol_id); after folder→id + hash normalization
  80/80 equal as sorted line sets. Needs the owner's OK to commit, then a
  cherry-pick onto this branch.
- `case.json`: not added (atomic has none; spec.ts is the manifest). Owner to say
  if a separate case.json is still wanted.
- BAS-LAYER-01..04 in reference-rs base-system: needs a new Rust layers API +
  base_system cargo tests (separate job).
- Bare upstream republish still doesn't trigger a watch re-sync (not a watch
  input); other bare non-baseSystem imports keep first-load instances.
- `agentrs q` walker should skip `.scratch`; tasty js/utilities flake (parallel
  writes to `.scratch/TST-DOC-01`, unproven).
- Stale path citations outside module scope: NEO-TOKEN-09 README (typegen
  seam.test.ts), STYLE_PROP_EXTERNAL.md:429, agent-perf perf-index.json,
  docs/bugs/MCP_DEFAULT_PROJECT.md, neo `__fixtures__/union-labels` comments.
- `bin/ref.test.ts:235` and `src/sync/lib-barrel-negation.test.ts` pre-existing
  unit-test issues (stale expectation; needs synced icons).
