# Voyage perf log — Hyperspace Run

Every recon map and every Fasthull cycle ends here. A disproven
hypothesis is a complete cycle — log it and move on. Terse entries;
the diff holds the detail. Append, never rewrite history.

HQ 2026-09-20 ~23:49: performance-only. Report sync, RSS, styles.css,
and runtime-data vs pin `5eda2c60b7e5` and vs Panda v2
(`/Users/ryn/Developer/panda-bench/reports/latest/`).

```text
## Wave N, recon — <one-line map>
- Avenues: <id: lever (sync|RSS|css|data), disjoint with …>
- Killed: <suspect, evidence, one line>
- Next crews: <tree-a hypothesis; tree-b hypothesis; …>

## Wave N, <lane a|b|c> — <one-line hypothesis>
- Tried: <change, files touched>
- Bench (locked load, medians): <sync / RSS / css / data vs wave-start>
- Stability: <agentrs + agentneo; churn or why skipped>
- Review: <VERIFIED or GAPS>
- Outcome: <landed | rode forward | died, and why in one line>
```

No entries yet.

[2026-09-20T22:57Z recon-1] Brief ingested (brief, perf log, fasthull, bench README/PLAN, Neo pin 5eda2c60b7e5, Panda goalpost+notes). Gap: enterprise 3.51s→645ms, 796→261 MiB, 14.3→2.7 MiB css, 3.9 MiB vs 71 KiB JS. Fanning 3 nested workers (bridge/sheets, parse-scan, bundle levers); lead runs the one enterprise bench + synthesis. No product edits.

[2026-09-21T00:05Z recon-1] Lead bench: enterprise 4.19s/810.7 MiB (box shared w/ workers; pin 3.51s/796), bundle byte-identical to pin (14.3 MiB css, 3.9 MiB data). Firsthand counts: @layer recipes = 12.47/15.0 MiB css (83%); runtime-data recipes table = 4.006/4.09 MiB (98%), of which combinations 2.50 MiB (62.7%, ~27 precomputed joins/recipe) + responsiveVariantMap 1.06 MiB (26.6%) — both mechanical derivations of variantMap (0.20 MiB). Workers A/B/C still profiling.

[2026-09-21T00:12Z recon-1] Worker A filed: S1 LIVE (11-field CompileResult, 5 discarded incl. per-atom css.classes + recipes serialized TWICE; TS seam doesn't declare dead fields) + S2 LIVE (double print shares everything but ~2 token selector lines; utilities re-sorted 2x). Worker B filed: S3 LIVE (15k arenas+ASTs whole-compile, 7 retention sites, 2x transient source Vecs) + S4 LIVE (~8 full walks x 12k dead files, zero pre-filter) + S5 LIVE (read_to_string every file THEN glob-filter; 3 reads/2 scans per sync). Awaiting worker C (bundle).

[2026-09-21T00:30Z recon-1b] Second rotation ingested: brief §1, prior 3 entries, fasthull, bench README/PLAN, pin 5eda2c60b7e5, Panda goalpost+notes. No fasthull-recon-1.md exists. Plan: 3 nested workers (A bridge/sheets S1+S2, B parse/scan S3+S4+S5, C bundle S6+S7), lead runs own bench + synthesis. Static counting first, lead enterprise bench for firsthand numbers. No product edits.

[2026-09-21T00:38Z recon-1b] Lead bench (firsthand): medium 451ms/205.2 MiB, enterprise 3.42s/808.3 MiB (pin 3.51s/796.0); bundle byte-identical to pin (14.3 MiB css/825.0 KiB gzip, 3.9 MiB data/211.3 KiB gzip). Workers A/B/C profiling. Lead now reproducing headline bundle counts firsthand.

[2026-09-21T00:55Z recon-1b] Lead firsthand counts (kept medium repo): styled/react styles.css BYTE-IDENTICAL (2,554,607 B each, cmp clean); @layer recipes = 2,302,549 B (90.1% of sheet, 28,586 rules); runtime-data recipes table 723,850/808,655 B (89.5%) across 88 entries: combinations 63.2% (sample 36 precomputed joins like "accent|sm|info|tight"), responsiveVariantMap 27.4%, variantMap 5.1% — matches dead lead's enterprise shape (62.7/26.6%). Awaiting A/B/C.

[2026-09-21T01:10Z recon-1b] All workers filed, all 7 suspects LIVE with fresh firsthand evidence. Lead spot-verified headline sites (11-field struct vs 6-field seam, lib.rs whole-compile retention comment, scanner + sources.rs read-then-filter order). Writing fasthull-recon-1.md + Wave 1 entry.

## Wave 1, recon — all 7 suspects LIVE: dead bridge payload, double sheet print, dead-file parse/walk/read tax, recipe fan-out in css + data
- Avenues: A1 slim N-API result (sync+RSS, lane a); A2 print sheet once (sync, lane a); A3 drop per-file retention (RSS, lane b); A4 pre-parse byte gate (sync, lane b); A5 filter-before-read + single collect (sync+RSS, lane b); A6 recipe responsive/grouping skip (css, lane c); A7 derive recipe tables at runtime (data, lane d). Piggybacks: A8 host-set clones (b), A9 compound dedup (c), A10 fixed namer bridge tax (future). Shared files: assembly.rs (a-internal), emitter/mod.rs (a/c diff fns), contracts (a/d diff sections), recipes/ dir (c/d disjoint files).
- Killed: none of the 7; minor: Tasty has no sync-path role; collectCompileFiles zero callers; bench dual sheets byte-identical (2-line diff is dark-token worst case).
- Next crews: perf-1-a cold payload (A1+A2); perf-1-b dead-file fast path (A3+A4+A5, architect holds harvest fence); perf-1-c recipe sheet grouping (A6b now, A6a wave 2); perf-1-d recipe tables (A7).

Wave 1 recon: COMPLETE — map filed, 7 avenues, next crews: perf-1-a (A1+A2), perf-1-b (A3+A4+A5), perf-1-c (A6b), perf-1-d (A7)
## Wave 1, lane e — deepsee observability tooling (burndown + RSS + bundle accounting)
- Tried: new deepsee/ tooling only (cli, worker-phases, sample-parse, burndown, rss, bundle-css, bundle-data, bundle, README) + evidence note fasthull-burndown-1.md; zero engine/bench/load edits
- Bench (tooling moves no numbers by design; reconciliation instead): enterprise burndown serde 23.6% / assembly 19.0% / emit 11.0% of sync; RSS worker 806.7 / parent 801.5 vs pin 796.0 MiB; bundle byte-identical to pin (15007762/4090907 raw AND gzip)
- Stability: no engine file touched (git status: log + 2 new paths only) so no agentrs smoke owed; sync deterministic (cmp-clean); agentneo q 0 errors
- Review: VERIFIED (independent agent, firsthand on small/medium + ent-2 artifact match: cross-check straddle ±, parent≈worker, residuals 0/0, raw=pin, tree clean, note matches)
- Outcome: landed — one command (`deepsee all --scale enterprise`) gives the full burndown; lanes a–d have their quantified targets

Wave 1, lane e: VERIFIED — deepsee tooling complete, enterprise burndown + byte-exact bundle accounting filed, review passed.
