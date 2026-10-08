# Voyage log (live stub)

STYLETRACE-PERF landed 2026-09-30 (base `488bcfd7a` → `ec4f6f725`):
rc LAND + alloc LAND + cow reserve, sum −777 ms / −42.1% whole-sync 8/8.
Full log: `docs/PERF/waves/styletrace-perf/log-archive-2026-09-30.md`.
Filings: `docs/PERF/waves/styletrace-perf/` (index 109).

## Scoreboard (seed-7 medians; lib-world = flame sync/compile pair, bench = bench:neo)

| landing | sha | lib sync a/b | lib compile a/b | bench small | bench med | bench ent | guard |
| --- | --- | --- | --- | --- | --- | --- | --- |
| rc | e9387f5ec | 1368.4 / 1383.9 | 1081.5 / 1086.5 | 137.7 | 193.2 | 950.7 | bundles bit-identical, ent −10.2 noise-null |
| alloc | 84faa918f | 1238.3 / 1232.0 | 955.1 / 947.0 | 132.2 | 193.3 | 950.5 | bundles bit-identical, ent −10.4 noise-null |
| cow (reserve) | ec4f6f725 | 1239.3 / 1221.6 | 952.1 / 936.4 | 134.7 | 195.9 | 950.4 | flat-as-filed straddle; bundles bit-identical |
