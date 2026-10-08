# MEMO: lazy-singleton — defer index inflate to first search (PARTIAL)

One line: lazily construct the icons search singleton so non-search tool imports pay zero index inflate (~5 MB / ~100 ms ctor); diets + byte-identical identity pair preserved, timing/suites missing.

Status: PARTIAL (not a BANK — missing pairs/timing numbers and suites
as filed; filed so the work survives with its gaps).

## Lever

Construct the singleton on first search instead of at import
(`searchEngine` -> `getSearchEngine()`, `ICON_CATEGORIES` ->
`getIconCategories()`), rewiring `icons-search-index.ts` +
`icons-catalog.ts` (+ test). Surface: module import path (MCP import
latency). Call-site migration — extension-safety (importer graph +
zero sync-path references) must be proven before any landing.

## Present (preserved)

- Diet A: `lazysingleton.patch` (WT2 `…01a0c87c-81bb…`, `cachedEngine`,
  3 files +15/-6). Diet B (no patch extracted, path recorded): WT13
  `…01a0c88b-b2dd…` (`engineInstance`, 3 files +21/-6).
- Identity pair: `evidence/lazy/out-before.json` == `out-after.json`
  (36749 B each, sha1 `cb3aea03fe540a6dec0138592954ba0237e2dc2e` both —
  captain verified).
- Rig: `breakdown.mjs` (ctor cost-split: read/parse/stringify/loadJSON/
  catscan), `icons-battery.mjs` (importMs + resultsHash + catHash),
  `icons-cost-split.mjs`, `icons-import-time.mjs`.
- LOST before archive: `probe-import.mjs`, `probe-func.mjs` (absent
  from /tmp/bench-icons when the captain archived; the battery script
  covers the same surface). Before/after full-src arms + 6.1 MB
  bundles deliberately skipped (regenerable via rig).

## Gaps (exact)

1. Pairs/timing numbers as filed: none (`err-before.txt` and
   `err-after.txt` are both 0 bytes).
2. Suites as filed: none.

## Provenance

No claims handle. Captain verified diffs + identity hashes firsthand.
Base `1e1ad31d9`; rebase needed. Off-scope MCP surface.
