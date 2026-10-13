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

(planned after Track 1 cooks are underway; see below once scouted)

## Landings

| Hash | What | Proof |
| --- | --- | --- |

## Verified at

(pending)

## Left

- BAS-LAYER-01..04 in reference-rs base-system (new Rust layers API + tests).
