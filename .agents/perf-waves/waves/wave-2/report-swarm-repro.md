# swarm-repro REPORT: post-landing re-profile (wave-2 set 1)

## Identity

- Base: `810b8b5b47448b4b99b688d9c2fda94c3ec9658e` (verified `git rev-parse HEAD` at start; tree clean).
- Release `.node`: `db1f483a22c81e121e853e628ce6d67dd18d6179f910ffb720a5e4070ed4f5b8`
  (`packages/reference-rs/dist/native/virtual-native.darwin-x64.node`, 8,871,920 B,
  `napi build --release via ensure-native`). Built once in-tree; never rebuilt after capture 1.
- Wrappers: `build:js` ran once (were missing; gitignored, not in diff).
- End state: tree diff vs HEAD is this REPORT.md only (untracked); bench-report byproduct
  dir removed; `dist/` outputs gitignored. No production code changes. No commits.

## Bundles + protocol fidelity

- `/tmp/swarm-repro-flame/enterprise-repro1/` — syncMs **1099.79**, compile 654.49, RECONCILED.
- `/tmp/swarm-repro-flame/enterprise-repro2/` — syncMs **1096.19**, compile 646.19, RECONCILED.
- Each bundle: `profile.json.gz` + presymbolicated sidecar + `phases.json` + `meta.json` +
  `summary.md` + `callers.md` (filed via the query layer, no re-record).
- Procedure `agentrs-flame/3`, identical to enterprise-flame3: locked load
  (3000 style + 12000 dead, 7527 css calls, seed 7), 1000 Hz samply,
  `--perf-basic-prof`, same-run phase buckets. Pin `810b8b5b4744`, **dirty:false**
  (cleaner than flame3's dirty:true).
- Fidelity notes / deviations:
  - Out-of-tree `--out` (/tmp) to keep the worktree diff to REPORT.md only.
  - One cold warmup first (1461 ms, discarded, never cited) per the
    first-run-after-rebuild caveat; both scored captures ran warm.
  - n=2 captures (flame3 was n=1); the second is a stability cross-check, not protocol.
  - Flame leg ONLY — no counters/alloc re-score. IPC, realloc counts, marshal-delta,
    and RSS-HW are not re-measured; the alloc/realloc room below is flame-attribution
    evidence only.

## Whole-sync + phase burndown (pre vs post; wt ≈ ms)

Pre = `docs/evidence/flamegraph/enterprise-flame3` (pre-wave-1 base).
Post = repro1 / repro2. Total expected from landings: wave-1 −65.9 + set-1 −62.6 = **−128.5**.

| phase | pre (ms) | r1 (ms) | r2 (ms) | Δ r1 | Δ r2 |
| --- | --- | --- | --- | --- | --- |
| syncTotal | 1230.1 | 1099.7 | 1096.1 | **−130.4** | **−134.0** |
| compile | 780.3 | 654.5 | 646.2 | **−125.8** | **−134.1** |
| scan | 364.3 | 367.7 | 367.6 | +3.4 | +3.3 |
| publish | 48.7 | 48.1 | 48.9 | −0.6 | +0.2 |
| config | 30.6 | 26.7 | 27.2 | −3.9 | −3.4 |
| evaluate | 6.2 | 2.7 | 6.2 | −3.5 | 0.0 |
| startup (outside sync) | 118.1 | 127.5 | 122.1 | +9.4 | +4.0 |

Sync −130/−134 vs expected −128.5: agreement within run noise. The entire win sits in
compile; scan/publish/config are flat (kernel/loader floor, untouched as designed).

Lib self-weight: kernel 417 → 417/428 (floor, unmoved); .node 336 → 295/299 (−41/−37);
malloc 262 → 217/191 (−45/−71); platform 132 → 94/108 (−38/−24); node 160 → 178/162
(startup noise); JS 31 → 19/22.

## Per-room burndown (whole-sync scope, incl wt ≈ ms; r1/r2 post)

### canon (lookup + classify)

| fn | pre | r1 | r2 | Δ |
| --- | --- | --- | --- | --- |
| resolve_alias | 33 | 10 | 10 | **−23** |
| is_length | 25 | 9 | 12 | **−16/−13** |
| classify_css_value | 32 | 16 | 8 | **−16/−24** (small-n noisy, direction solid ×2) |
| is_named_color | 11 | 6 | 3 | −5/−8 |
| find_property | 21 | 28 | 29 | +7/+8 (see below) |
| is_known_style_prop | 17 | 22 | 29 | +5/+12 (r1↔r2 swing 7 — noise-dominated) |
| is_color_prop | 11 | 8 | — | −3 |

Malloc-by-ancestor `is_length`: 10 → 0 (gone from the table). Memcmp-by-ancestor:
resolve_alias 8 → 4, find_property 9 → 10 (flat), is_length 6 → 0 (gone).

### module-graph / serializer

| fn | pre | r1 | r2 | Δ |
| --- | --- | --- | --- | --- |
| module_graph::ladder (module) | 37 | 21 | 22 | −15/−16 |
| module_graph::walk (module) | 36 | 24 | 28 | −12/−8 |
| build_keyed | 83 | 71 | — | −12 (resolve_entry 63→57, serialize 7→6) |
| serialize_lookup_key | 19 | 16 | — | **−3** (canonical_json_value 10→6, malloc 7→5) |
| Proof::collect | 14 | 13 | — | −1 (flat) |
| key::normalize_str (malloc ancestor) | 7 | 8 | — | +1 (flat) |

### cascade / emission

| fn | pre | r1 | r2 | Δ |
| --- | --- | --- | --- | --- |
| build_stylesheets_with | 62 | 40 | — | −22 |
| write_utilities | 51 | 29 | 29 | **−22** (29/29 rock solid) |
| sort_by closure | 13 | 5 | — | −8 |
| driftsort under write | 14 | 10 | — | −4 |
| CascadeKey::from_atom | 6 | 3 | — | −3 |
| property_cascade_rank | 4 | 0 (absent) | — | **gone** (memo: 23,505→46 calls) |
| push_selector_with_system | 0 (absent pre) | 12 | — | new (wave-1 emit's fn) |

### diagnostics / proof

| fn | pre | r1 | r2 | Δ |
| --- | --- | --- | --- | --- |
| atomic::diagnostics (module) | 76 | 49 | 51 | **−27/−25** |
| render_fact | 22 | 0 (absent ×2) | 0 (absent ×2) | **gone** |
| render_expected | 16 | 0 (absent ×2) | — | **gone** |
| site::line_col | 4 | 1 | — | −3 |
| analysis::analyze | 25 | 22 | — | −3 (flat; css::expectations 15→16) |
| Proof::collect | 14 | 13 | — | −1 (flat) |
| render_with | 12 | 12 | — | 0 (is_known 2→5, drop Proof 2→3) |

### parse / oxc

| fn | pre | r1 | r2 | Δ |
| --- | --- | --- | --- | --- |
| Parser::parse | 58 | 34 | 34 | **−24** (34/34 rock solid) |
| ↳ main-fold caller | 23 | 25 | — | +2 (flat) |
| ↳ streamed caller (merge_constants_ordered) | 14 | see caveat | — | re-attributed (symbol inlined away) |
| ↳ styletrace re-parse caller | 13 | 0 | — | **gone** |
| ↳ identity re-parse caller | 8 | 0 | — | **gone** |
| ↳ compile-direct caller (post only) | — | 9 | — | streamed residue, new attribution |
| parse_trace_module | 23 | 8 | — | −15 (residue = walk-only) |
| parse_export_map | 8 | 0 (absent) | — | **gone** |
| Lexer::next_token | 17 | 8 | — | −9 (less input) |
| walk_expression | 44 | 29 | 26 | −15/−18 |
| walk_declaration | 106 | 102 | — | −4 (flat) |

Attribution caveat (verified, not hand-waved): `merge_constants_ordered`
(39wt pre) has zero samples post-land in BOTH captures yet is still called
(`atomic/src/lib.rs:200`). `nm` on the shipped `.node`: the symbol is ABSENT
(res vs find_property/resolve_alias present) — LLVM fully inlined the single
hot call site into `atomic::compile`. Its ~35wt now attributes to
compile-direct callees (Parser::parse compile-direct 9wt ≈ streamed 14wt ±
noise; const-merge hash/string work in the compile tail). The streamed
transient parse is CONFIRMED still performed (parse census: 12,000 streamed
files stay) — the −24 reads as re-parse elimination (−21 mechanism) with the
streamed/main remainder re-attributed, not as streamed work disappearing.

### alloc / realloc (flame attribution only — no alloc leg this run)

| fn | pre | r1 | Δ |
| --- | --- | --- | --- |
| do_reserve_and_handle | 63 | 29 | **−34** (String::write_str caller 35→16) |
| finish_grow | 69 | 33 | **−36** |
| format_inner | 42 | 8 | **−34** (remainder: format_entry 5 + lower_when 2) |
| memmove leaf | 70 | 53 | −17 |
| memcmp leaf | 52 | 32 | −20 |
| malloc_type / free | 127 / 87 | 109 / 68 | −18 / −19 |
| String::clone (incl) | — | 26 | remainder shape (malloc caller 19) |
| Box<str>::clone (incl) | — | 25 | remainder shape (malloc caller 23) |

### marshal

to_napi_value 2 → 3 (flat, tiny). compile_system edge 757 → 630/619
(−127 ≈ compile Δ — the boundary carries the win through, adds none).
No marshal room. Marshal-delta re-score needs a counters leg (not run).

### harvest

classify_harvest_value 24 → 8 (−16: is_length-direct 11→0 [wave-1 islen] +
classify 13→6 [canon2]); collect_pool 32 → 18 (−14); mint 13 → 12/10 (flat:
twins 6, insert 5).

### resolve

resolve_want_with 137 → 113 (−24). resolve_token_value 43 → 26 (−17:
classify 19→10, format_entry 8→5, lookup_entry 8→4, is_color 5→4).
css_value_from_authored 10 → 11 (flat). authored_key 9 → 10 (flat, clone-shaped:
Box-clone 5 + malloc 3). lower_when 8 → 7 (flat). expand_shorthand 23 → 7/10
(−13/−16, unclaimed win inside resolve — canon pre-filter dividend).

### scan

sources::collect 37 → 36, collect_candidate_paths 26 → 26, sorted_entries
17 → 19 (driftsort 8→10, from_iter 8→9 — flat/noise). Scan wall flat.
Untouched as designed; shot2 KILL (no pre-open deadness signal) stands.

## Per-room delta analysis: what the set moved, what didn't, why

Scope honesty: flame3 predates wave-1, so raw pre→post spans wave-1 (−65.9) +
set-1 (−62.6). Member attribution below uses mechanism-level flame evidence
(caller disappearance, frame absence ×2, callee splits), cross-checked against
the filed solo/in-situ numbers in integrate-bank.md.

- **parse (≈−21 in flame; in-situ ≈20.3): MOVED, mechanism-verified.** Both
  re-parse callers read exactly 0 post-land; parse_export_map frame gone;
  parse_trace_module −15 with an 8wt walk-only residue. Matches the −45.1%
  bytes / −3,242 Parser::parse mechanism counts. Remainder: main 25 + streamed
  ~9–14 (floor — shot2 KILLED avoidance; retained parsing is DRY).
- **diag (≈−22 direct + alloc tail in flame; solo −19.9/−35.2, in-situ +13.2):
  MOVED, cluster dead.** render_fact + render_expected absent in both captures;
  line_col 4→1. The in-situ +13.2 reads smaller than the −22 direct because
  keys2 shrank the per-render lookup_key cost inside the removed renders
  (integrate-bank's disclosed sub-additivity) — consistent, not contradictory.
  Remainder: analysis 22 + proof 25, wholly unworked.
- **canon2 (≈−16 in classify chain in flame; solo −15.3, rides ≈13–15): MOVED.**
  classify 32→16/8, is_named_color 11→6/3, resolve_token_value −17,
  harvest-classify −7 of its −16 (other half = wave-1 islen's is_length-direct
  11→0). Remainder: is_length self 9–11 (DRY per wave-1: f64 grammar path only),
  find_property/is_known (see below).
- **cascade (≈−4–8 in flame; theoretical ~3–5): MOVED, at noise edge.**
  property_cascade_rank frame gone (memo verified: 23,505→46 calls),
  from_atom 6→3 (fusion), sort closure 13→5, driftsort 14→10. The write −22 is
  shared with wave-1 emit (~18); cascade's slice is the memo/fusion/lazy
  residue. Remainder 29: selector-push 12 + driftsort 10 + keys 3.
- **keys2 (−3 in flame; phase bench 3.29/3.37): MOVED, exact match.**
  serialize 19→16, canonical_json_value 10→6, malloc-under 7→5. The flame delta
  reproduces the phase micro-bench to the weight unit. Remainder 16.
- **Wave-1 separators (not this set's credit):** resolve_alias −23 (canon
  pre-filter), is_length −16 + malloc-ancestor 10→0 (islen), ladder −15 +
  do_reserve/format_inner −34 (reserve + shared volume), emission shape change
  incl. push_selector_with_system 0→12 (emit).
- **What did NOT move and why:**
  - scan/sources/sorted_entries (flat): no set member touches scan; shot2 KILL stands.
  - analysis::analyze, Proof::collect, render_with (flat): diag skipped only dead
    renders; analysis/proof construction is a different mechanism, uncrewed.
  - find_property +7 / is_known_style_prop +5..+12: noise-dominated (my own two
    captures swing 7 on is_known; ±5–8 single-frame jitter is documented).
    Ground truth is findprop's exact census: 353,517 calls × ~37ns ≈ 13.1 ms —
    sub-bar at whole-sync, CUT stands. No growth mechanism exists in the set
    (no member adds canon calls; cascade's memo REMOVES rank calls).
  - authored_key, css_value_from_authored, lower_when, mint, to_napi_value,
    memcmp-under-find_property (9→10): flat — outside every member's mechanism.
  - Gross touched-cluster deltas sum ≈ −71 vs the measured −62.6 sum; the ~8 gap
    is sampling noise plus the noise-side growths above — net reconciles.

## Ranked re-seed list (next implementor slots)

Ordered by addressable size. "Size" = post-land incl wt (≈ms). Excludes landed
work, banked-not-yet-landed work (hashers, scalarjson — sequence AFTER them),
and whole-sync-bar CUTs (modgraph, harvest, findprop, lowermemo, rhythm,
resolvefmt, asmfmt, btreeset, manifest, nameset, posreuse, sortshape-shape,
slice1b-HQ-ban) unless a per-phase-bank framing is named.

| # | topic | size (wt≈ms) | entry file / fn | falsification (CUT fast) bar |
| --- | --- | --- | --- | --- |
| 1 | proof-render diet (collect + render_with; unworked diag remainder) | 13 + 12 = 25 | `atomic/src/diagnostics/proof/render.rs` `Proof::collect`, `render_with` | census: render_with/collect call counts × unit cost; fantasy < 15 ms whole-sync → bank-or-cut |
| 2 | selector-push diet (wave-1 emit's fn, unworked) | 12 | `atomic/src/stylesheet/name/mod.rs` `push_selector_with_system` | per-atom string cost × 23,505 atoms; fantasy < bar → cut (sortshape bars shape changes here) |
| 3 | clone-plasma census→diet (cross-cutting String/Box clones) | 26 + 25 incl; 42 malloc-caller | `atomic/src/resolve/mod.rs` `authored_key`, `runtime/builder.rs`, proof paths | site-tagged clone census (harvest/modgraph precedent); SUMMED site ceilings < 15 ms → cut (per-site ceilings run sub-bar — must sum to live) |
| 4 | resolve remainder bundle (authored_key + css_value_from_authored + expand_shorthand) | 10 + 11 + 7–10 ≈ 28 | `resolve/mod.rs`, `resolve/unit/*`, `resolve/shorthands/*` | per-arm fantasy like lowermemo/rhythm (4.3/3.2 precedents); bundle < bar → cut |
| 5 | identity-extend remainder — SEQUENCE AFTER hashers bank lands | 34 (Extend edge 32, binding 26) | `atomic/src/extract/resolver/mod.rs` `resolve_file_imports` | re-profile post-hashers; remainder fantasy < bar → cut |
| 6 | analysis expectations walk (unworked) | 22 (css::expectations 16) | `atomic/src/diagnostics/analysis/*` | expectation count × unit; fantasy < bar → cut |
| 7 | find_property dispatch, PER-PHASE-BANK framing only | census 13.1 | `canon/src/css/mod.rs` `find_property` | whole-sync CUT stands (13.1 < 15/17.5); bank only under a keys2-style per-phase bar + differential proof |

## Dry rooms (no addressable remainder) with evidence

- **Diag render cluster — DRY.** render_fact + render_expected: zero samples in
  BOTH captures (pre: 22 + 16). Pushed-fact path vacuous on this load (diag
  census: 0 producer facts, 0 warnings/errors). line_col residue 1wt.
- **Parse re-parse — DRY.** styletrace + identity Parser::parse callers read 0;
  parse_export_map frame gone; parse_trace_module residue is walk-only (8wt).
  Retained parsing cannot go below one parse per file.
- **Streamed transient parse — DRY-as-floor.** Still performed (~9–14wt,
  re-attributed under compile after merge_constants_ordered inlined — symbol
  absent from shipped binary, verified via nm). Avoidance = shot2 territory,
  and shot2 is KILLED (no sound pre-open signal).
- **Cascade rank/memo/keys — DRY.** property_cascade_rank gone (memo 511×);
  from_atom 3wt; sort closure 5wt. sortshape CUT bars shape changes
  (order-sensitive: 67/67 full ties diverge; bucketing net 1–2 ms).
- **resolve_alias miss path — DRY.** 10wt incl remainder = member fall-through
  (wave-1: members pass unchanged by construction). Member-path redispatch
  (PHF/match) is ≤ ~6wt fantasy.
- **is_length alloc — DRY.** malloc ancestor 10→0; wave-1 verdict stands
  (nothing left without changing the f64 grammar path).
- **Keys memo — DRY.** CUT structurally by count (hash+verify ≈ serialize;
  misses +400ns). Diet tail covered by banked scalarjson (−2.1 phase).
- **Whole-sync-bar CUTs stand DRY:** modgraph (11–12), harvest (12.5), findprop
  (13.1), lowermemo (4.3), rhythm (3.2), resolvefmt (2.9), asmfmt (0 calls),
  btreeset (6–9), manifest (0 calls), nameset (0.35), posreuse (4.7).
- **Heavy tracks — both dead:** shot2 KILLED (dead-file avoidance, ~190 ms);
  slice1b CUT by HQ multithreading ban (parallel compile, 100–140 ms).

Honest arithmetic for the captain (not a re-scope proposal): sync is 1098 ms
against the 700 target (gap ≈ 398). Scan + publish + config + evaluate ≈ 450
is kernel/loader floor. So compile 650 → ~250 (−400) is needed from diet
rooms whose ranked ceilings above sum to ~150wt at 100% fantasy (≈ 50–80 ms
realistic at 30–50% capture). Both heavy tracks are dead — one by measurement
(shot2), one by directive (slice1b). The 700 target is unreachable on the
current single-thread architecture; that contradiction (LOG's
parallel-mandatory vs the HQ ban) is flagged, not solved, here.

## Verdict

**REPROFILE-COMPLETE (base 810b8b5b4744 + new enterprise median 1098.0 from 2 flame runs, SCORED-with-caveat: n=2, instrumented runs 1099.79/1096.19; uninstrumented multi-pair confirm is the captain's)**
