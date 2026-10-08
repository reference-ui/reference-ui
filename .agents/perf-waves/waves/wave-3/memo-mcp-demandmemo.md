# MEMO: demand-memo — searchDemand LRU cache (PARTIAL)

One line: 64-entry LRU memo of searchDemand keyed on demand+limit+category+verbose; two diets + complete method rig preserved, zero filed outputs.

Status: PARTIAL (not a BANK — missing counts, pairs, identity outputs,
and suites, all four as filed; filed so the work survives with its gaps).

## Lever

Memoize `searchDemand` in a 64-entry LRU (key =
demand+limit+category+verbose) on the hot path of
`packages/reference-mcp/src/pipeline/icons-search-index.ts`.

## Present (preserved)

- Diet A: `demandmemo.patch` (WT7 `…01a0c87c-977b…`, copy-on-return,
  +19/-1). Diet B (no patch extracted, path recorded): WT17
  `…01a0c88b-c8fb…` (returns cached ref, +21/-1).
- Rig (archived under `evidence/demandmemo/`): `demand-bench.mjs`
  (repeat/batch/unique/single benches + determinism probes),
  `demand-miss.mjs` (always-miss + cold-cost), `demand-identity.mjs`
  (25-case identity + cache-POISON mutation probe),
  `demand-memo-bench.mjs` (distinct/repeat/catverb/dup-batch +
  key-separation + eviction), `demand-memo-miss.mjs` (all-miss).
- No snapshot/identity files exist (scripts print to stdout; outputs
  were never saved).

## Gaps (exact)

1. Counts grounding the mechanism: none filed.
2. Timed pairs (any count): none filed.
3. Identity outputs: none filed (the POISON probe exists precisely to
   settle the copy-vs-ref aliasing question between diets A and B —
   adjudicate before any landing).
4. Suites: none filed.

## Provenance

No claims handle; both diets uncommitted but recoverable in place.
Captain verified both diffs firsthand. Base `1e1ad31d9`; rebase
needed. Off-scope MCP surface; 0 sync ms by construction,
unmeasured — sum-confirm before any landing.
