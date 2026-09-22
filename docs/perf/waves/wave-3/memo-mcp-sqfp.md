# MEMO: sqfp — single-query extractDemands fastpath (PARTIAL)

One line: gating regex proves the sentence/clause/regex pipeline is identity for single queries so extractDemands(q) returns [q] directly; diets + 63/63 identity pair preserved, counts/pairs/suites missing.

Status: PARTIAL (not a BANK — missing counts, pairs, and suites as
filed; filed so the work survives with its gaps).

## Lever

A gating regex proves the `extractDemands` sentence/clause/regex
pipeline is identity for single queries; `extractDemands(q)` returns
`[q]` directly, skipping the pipeline. Surface: `extractDemands` +
`search()` demand-splitting path (MCP TS).

## Present (preserved)

- Diet A: `sqfp.patch` (WT8 `…01a0c880-8f31…`, gate inside
  `extractDemands`, +14). Diet B (no patch extracted, path recorded):
  WT18 `…01a0c88e-828e…` (gate at the `search()` call site, +14/-2).
- Identity pair: `evidence/sqfp/sqfp-snap-before.json` ==
  `sqfp-snap-after.json` (148961 B each, sha1
  `423e78294530afb246b802f75ddde31d57be597c` both; 63/63 keys
  identical — captain verified).
- Rig: `sqfp-bench.mjs` (singles/multis/arrays extract bench),
  `sqfp-diff.mjs`, both snapshot JSONs above.

## Gaps (exact)

1. Counts grounding the mechanism: none filed.
2. Timed pairs (any count): none filed.
3. Suites: none filed.

## Provenance

No claims handle. Captain verified diffs + identity hashes firsthand.
Base `1e1ad31d9`; rebase needed. Off-scope MCP surface; 0 sync ms by
construction, unmeasured — sum-confirm before any landing.
