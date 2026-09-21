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
## Wave 1, lane b — dead-file fast path: files that cannot contain styling cost no read, parse, walk, or retain
- Tried: two byte gates (STYLING_SKIP skips W3/W4/W6/W7+resolve/bindings/host-union; STRING_SKIP skips W5 only; parse/W1/W2/records/identity/errors never skip) + A8 visitor borrows + A5a scope-before-read + A5b single-collect + A5d styletrace staged-content + A5e scanner pre-gate + A3 phase-drop. Dropped A5c (walk-memo needs module-graph interior mutability; measured target ~nil). 16 files + tests/gates.rs; module-graph untouched; harvest fence held.
- Bench (locked load, medians, box shared): small 140/121 vs 192/123.9; medium 411-421/~197 vs 460/204.0; enterprise 2873ms/~770MiB vs 3495/773.7 (-17.9% sync, ~620ms, clears 65ms spread ~10x; RSS within spread, no claim). Churn 4.84-4.96s vs 5.04s HEAD. Bytes cmp-identical all scales + churn (ent css 15007762/data 4090907 = pin). Vs Panda goalpost: ent sync 2.87s vs 645ms, RSS 770 vs 261 MiB — gap narrowed, still large.
- Stability: agentrs c atomic green (509 incl. 12 new gates); v atomic 298/299 lane AND HEAD (ATM-SITE-54 pre-existing, shown identical); styletrace failure set byte-identical to HEAD (+1 new staged pass); agentneo 173/173; quality 0 violations.
- Review: VERIFIED ([2026-09-21T00:35Z perf-1-b-reviewer], fresh agent, firsthand: 2x full suite + ent 3x + same-session HEAD stash comparison + 3 own adversarial fixtures byte-identical).
- Outcome: landed pending captain merge; no commits (crews never commit).

Wave 1, lane b: VERIFIED — dead-file fast path, enterprise sync -17.9% byte-identical, churn unregressed.
## Wave 1, lane a — cold payload: slim N-API result (proof channel) + print the utility sheet once
- Tried: native.rs serializes slim view (6 live fields) by default, full on logs:'proof'; new build_stylesheets_with shares one recipes+utilities suffix (existing builders untouched); contracts slimmed; stations re-pointed via proof flags (compileCase choke + 15 direct calls); new seam slim-pin + emitter equivalence tests. 25 files, all in-boundary; types.rs/system_layers/grouping-fns untouched.
- Bench (locked load, medians, box shared; reviewer reproduced all): small 181→142ms sync, RSS no-signal (126.6→126.1 in spread); medium 497→423ms / 208.5→199.3MiB; enterprise 3.47→3.18s / 799→~700MiB (7 post samples all < pre); churn 5.66→4.4s / 1070→~645MiB. Bundle bytes EXACT-equal base-vs-final (css+data raw+gzip, all scales + churn). Asterisk: 2 gzip values differ pin-vs-base ±1B pre-existing (identical base/final).
- Stability: v atomic 299/300 (ATM-SITE-54 pre-existing — stash-proven + reviewer causal check, bare theme-pkg rung, no fixture node_modules), v contracts 13/13, c atomic 499 green, agentneo 173/173 ok, q clean (rs 5 + neo 2). Churn RUN as guardrail: unregressed, big win.
- Review: VERIFIED (disjoint reviewer, firsthand bench + stability + diff; wart-note: wrapper stylePlans still required vs contracts optional — suggest aligning at merge).
- Outcome: VERIFIED, ready for captain merge.

Wave 1, lane a: VERIFIED — cold payload wins sync+RSS at every scale with byte-identical bundles.
## Wave 1, lane d — derive recipe tables at runtime (COMPLETE)
- Tried: serde-skip combinations+responsiveVariantMap (plan.rs), ship per-table responsiveBreakpoints (table.rs; in-memory build kept, mod.rs untouched), compose-on-read + bp-gated responsive derivation in recipe.ts with legacy fallbacks; renegotiated 5 NEO specs + 7 engine stations + fixture + census react pins + 6 doc lines to literal expectations. 26 files, no forbidden touches (reviewer-confirmed).
- Bench (locked load, medians; box shared w/ 4 siblings): small sync 150→147ms, RSS 121.8→121.4MiB, css 538.0KiB IDENTICAL, data 249.8→102.5KiB (-59%); medium 461→432ms, 207.6→198.3MiB, css 2.4MiB IDENTICAL, data 789.7→164.3KiB (-79%); enterprise (1 run) 3.51→3.35s, 796→728.7MiB, css 14.3MiB IDENTICAL, data 3.9MiB→518.2KiB (-87%). E2E: 2376/2376 combos + 3960/3960 responsive re-derived from new inputs at medium; css cmp-clean.
- Stability: cargo atomic 498 pass; atomic vitest 298/299 (SITE-54 pre-existing, proven red on stashed HEAD, wants/specifier station); neo vitest 229/229; contracts 13/13; agentneo 173/173 ok; neo gate 0 errors. Churn HOLDS: data 386.3→143.2KiB, css identical, sync/RSS delta inside run spread. RS in-memory build retained deliberately (lane c owns mod.rs; deletion = wave-2 cleanup, zero byte delta).
- Review: VERIFIED (distinct nested agent, firsthand; memo fasthull-1d-review.md). Contract renegotiation SIGNED: paint assertions byte-untouched, literals stronger than self-referential pins, legacy fallbacks tested. Caveats: bp list 52B/table (not ~35B); baseSystem co-shrink code-verified only.
- Outcome: VERIFIED — ready for captain merge. Merge flags: spec-recipes.test.ts:35-44 + SITE-15:20-21 share hunks with lane a; harvest-census EXPECTED_BYTES shares hunk with lane c; contracts/js types + fixture are disjoint-section shares with lane a.

Wave 1, lane d: VERIFIED — recipe tables derived at runtime, data -59%/-79%/-87%, css identical, paint holds.
## Wave 1, lane c — group byte-identical recipe blocks under one comma selector (A6b + A9)
- Tried: nothing — killed pre-implementation. Census (3 agents, firsthand, own kept repos): small 3,021 rules → 32 within-wrap dup pairs, ALL cross-block-instance, 0 adjacent; medium 14,501 → 422 groups, 0 adjacent. Merge-everything sim: −1.5 KB raw / gzip +71 B small, −15 KB raw / +1,382 B medium. A9 CSS exact-dupes: 0 both scales.
- Bench (locked load, medians): baseline only (own tree, box shared — wall/RSS conditions-affected, bytes pin-identical): small 472ms/128.9 MiB css 538.0 KiB, medium 452ms/217.8 MiB css 2.4 MiB. No implementation bench — no change.
- Stability: n/a (no diff). Tree holds only log + reports/latest scratch; zero product edits.
- Review: architect (≠ profiler) KILL-concurs firsthand: cross-block merge moves selectors across co-matching classes (composeClasses stacks base+variant+compound; order stations ATM-RECIPE-05/NEO-RECIPE-08), only safe variant (adjacent) has 0 sites, move (a) needs lane b's extract signal (Wave 2).
- Outcome: died — A6(b) grouping KILLED: 0 order-safe groupable sites at both scales and merge-everything is gzip-positive; the duplication is the 6× responsive fan-out, which only observed-use gating (Wave 2, move (a)) can touch.

[2026-09-21T00:25Z lane-c] Terminal: architect ruled KILL, three-agent count agreement (profiler/lead/architect all 3,021/32/0/0 small). No implementer dispatched (nothing safe to implement), no reviewer needed (no diff). Tree has zero product edits. Wave 2: gate (value,bp) on observed call-site responsive objects via lane b's signal; re-census grouping after fan-out collapses.
## Wave 2, recon — css gap fully explained in-bounds (observed-use gating + dead shake → ~2.5-2.7 MiB); sync/RSS remainder is proof-row builds, publish double-write, trace re-parse
- Avenues: B1 observed recipe emission gating+shake (css 14.3→~2.5-2.7, lane a); B2 publish-once (sync −50-100ms, lane c); B3 proof-row gating (RSS ~30-40 MiB + assembly wall, lane b); B4 styletrace entry gate (sync ~125ms hosts, lane d); B5 derive variantMap classes + stop dead-map builds (data 518→~315 KiB, lane b). B1 internal fuse (gate+shake same signal); B3+B5 one lane W1-a precedent (shared builder/table region, hunk split). Post-W1 burndown firsthand: sync 2.64 shares (assembly 612/23.2% fattest, serde 293, emit 242, prepare 345, publish 242), RSS 687 (payload 29.82, residual 511/34.6 KiB-per-file), css pin-identical, data 530,606, residuals 0/0.
- Killed: utilities 2.18 MiB = deduped floor; prepare 345ms = parallelism-only (no safe skip); slim codec ≈390ms = ship-one-sheet (OOB, self-shrinks under B1); parse co-residency 511 MiB = arena-physics floor; constants/ValueGraph gating = unsound-naive (W3 soundness ruling); A9 = 0 (two-census agree). Morning Qs: ship-one-sheet, A10 namer cache (watch-only), parse streaming, deepsee waitReady hang wart (lead-found: poll never cancels, parent parks in kevent — fix shape filed).
- Next crews: perf-2-a observed emission (B1 — architect rules strict-vs-closed + fixture call-sites BEFORE impl, determinative 3.4 vs 11.3); perf-2-b dead product (B3 then B5); perf-2-c publish once (B2); perf-2-d trace gate (B4). Merge: d → c → b → a.

Wave 2 recon: COMPLETE — map filed, 5 avenues, next crews: perf-2-a (B1), perf-2-b (B3+B5), perf-2-c (B2), perf-2-d (B4)
