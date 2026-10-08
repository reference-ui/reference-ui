# STYLETRACE-PERF voyage log

Mission: cut styletrace-dominated `sync()` wall on the reference-lib-shaped
world. Base `488bcfd7a`. HQ law: absolutes are box noise — the share and the
structure carry the signal. Every diet removes counted work (counts +
byte-identity + determinism). Enterprise bench is the regression guard (diets
read null there: the tracer surface is never entered on the synth load —
500 stperf sessions on scratch vs 0 on enterprise, REPORT-STPERF-benchent).

Pre-landing flames (base tip): `docs/EVIDENCE/flamegraph/styletrace-lib1/`
(sync 2246.7, compile 1802.2, RECONCILED) + `styletrace-lib2/` (sync 2025.6,
compile 1742.2, RECONCILED). Base bench pin `reports/488bcfd7a660/`
(small 134.7 / medium 195.3 / enterprise 960.9).

## Scoreboard (seed-7 medians; lib-world = flame sync/compile pair, bench = bench:neo)

| landing | sha | lib sync a/b | lib compile a/b | bench small | bench med | bench ent | guard |
| --- | --- | --- | --- | --- | --- | --- | --- |
| rc | e9387f5ec | 1368.4 / 1383.9 | 1081.5 / 1086.5 | 137.7 | 193.2 | 950.7 | bundles bit-identical, ent −10.2 noise-null |
| alloc | 84faa918f | 1238.3 / 1232.0 | 955.1 / 947.0 | 132.2 | 193.3 | 950.5 | bundles bit-identical, ent −10.4 noise-null |
| cow (reserve) | ec4f6f725 | 1239.3 / 1221.6 | 952.1 / 936.4 | 134.7 | 195.9 | 950.4 | flat-as-filed straddle; bundles bit-identical |
