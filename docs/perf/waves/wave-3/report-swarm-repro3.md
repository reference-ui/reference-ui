# swarm-repro3 REPORT: wave-3 opening re-profile (post wave-2, 24 diets)

## Identity

- Base: `6f4cf1ba392f4f7a3880b61096ccfb7004559ca7` (verified `git rev-parse HEAD`
  first act; `git diff 6c3909506..HEAD --stat` touches no `packages/` — RS tree
  identical to the wave-2 set-5 landing).
- Release `.node`: `a5b9117d3d5a4b66e300bf60669aaec1d1ff7c42aad6503c57dfa53964d85c68`
  (`packages/reference-rs/dist/native/virtual-native.darwin-x64.node`, 8,889,408 B,
  `napi build --release via ensure-native`). Built once; sha verified before AND
  after the timed block (unchanged). Never rebuilt after capture 1.
- Wrappers: `build:js` ran once (missing in fresh worktree; gitignored, not in diff).
- End state: tree diff vs HEAD is this REPORT.md + `docs/evidence/flamegraph/enterprise-repro4{a,b}/`
  only (untracked); `dist/` outputs gitignored. No production code changes. No commits.

## Bundles + protocol fidelity

- `/tmp/swarm-repro3-flame/enterprise-repro4a/` — syncMs **974.67**, compile 520.03, RECONCILED.
- `/tmp/swarm-repro3-flame/enterprise-repro4b/` — syncMs **972.65**, compile 520.09, RECONCILED.
- Each bundle: `profile.json.gz` + presymbolicated sidecar + `phases.json` + `meta.json` +
  `summary.md` + `callers.md` (filed via the query layer, no re-record).
- Filed as `docs/evidence/flamegraph/enterprise-repro4a/` + `enterprise-repro4b/`
  (two sibling dirs — the repro1/2/3 precedent; the query layer expects one bundle per dir).
- Procedure `agentrs-flame/3`, identical to repro3a/b: locked load
  (3000 style + 12000 dead, 7527 css calls, seed 7), 1000 Hz samply,
  `--perf-basic-prof`, same-run phase buckets. Pin `6f4cf1ba392f`, **dirty:false**.
- Fidelity notes / deviations:
  - Captured out-of-tree (`--out` /tmp), then copied into the worktree evidence dir.
  - Tip verified first with one cold unscored run (1343.8, discarded,
    first-run-after-rebuild); both scored captures ran warm. No warm unscored
    anchor run: instrumented A/B sit +3.8% over the ≈938 scoreboard, the same
    overhead ratio as repro2 (+3.2%), and the scoreboard median is the captain's
    (intset5 sums), not a repro crew's to re-derive.
  - n=2 captures; the second is a stability cross-check, not protocol.
  - Bench lock held ONLY for the timed block (warmup + A + B), two-step release.
    Noise disclosed: idle Playwright MCP Chrome (about:blank, ≤0.1% CPU, user's
    process — never touched). Foreign-PID rule honored.
  - Flame leg ONLY — no counters/alloc re-score. IPC, realloc counts, marshal-delta,
    and RSS-HW are not re-measured; the alloc/realloc room below is flame-attribution
    evidence only.

## Whole-sync + phase burndown (pre vs post; wt ≈ ms)

Pre = `enterprise-repro3a/b` (base `3dd32a659`, post wave-2 set-3).
Total expected from landings: cloneplasma −26.65 + set-4-subset −19.3 + set-5 −17.4 = **−63.3**.

| phase | pre 3a (ms) | pre 3b (ms) | 4a (ms) | 4b (ms) | Δ 4a | Δ 4b |
| --- | --- | --- | --- | --- | --- | --- |
| syncTotal | 1030.9 | 1031.1 | 974.6 | 972.6 | **−56.3** | **−58.5** |
| compile | 579.1 | 576.2 | 520.0 | 520.1 | **−59.1** | **−56.1** |
| scan | 365.0 | 367.7 | 371.0 | 365.8 | +6.0 | −1.9 |
| publish | 53.0 | 56.9 | 52.6 | 52.5 | −0.4 | −4.4 |
| config | 27.5 | 27.5 | 28.2 | 28.1 | +0.7 | +0.6 |
| evaluate | 6.1 | 2.7 | 2.7 | 6.0 | −3.4 | +3.3 |
| startup (outside sync) | 121.2 | 119.7 | 117.7 | 165.3 | −3.5 | +45.6 |

Sync −56/−58 vs expected −63.3: coherent within run noise plus a real
diffuse offset (memmove +8/+10, no caller >6wt — see alloc room). The win
sits in compile (−59/−56); scan/config are flat. Publish is flat on the
stopwatch (−0.4/−4.4, noise edge). Evaluate shows the same A↔B noise swap
as 3a/3b (6.1/2.7 → 2.7/6.0). 4b startup +45.6 is a node-startup stall
outside sync (startup bucket node-heavy, 132wt vs 165ms) — disclosed, unscored.

Lib self-weight: kernel 422/422 → 430/433 (floor, unmoved); .node 261/268 →
205/220 (−56/−48, the dieted Rust work); malloc 186/189 → 164/142 (down,
4a↔4b straddle 22 disclosed); platform 94/83 → 103/103 (memmove offset);
node 163/156 → 158/163 (startup noise); JS 20/25 → 23/31.

## Per-room burndown (whole-profile scope, self/incl wt ≈ ms; pre 3a/3b, post 4a/4b)

All values from `--inspect` drill-downs (exact self/incl at any rank) plus
gap queries run against the filed pre bundles where repro2 left no baseline.
"—" = zero samples in that capture. For `.node` frames whole-profile equals
whole-sync (native runs only under compile).

### canon (cloneplasma-adjacent; findprop CUT stands)

| fn | 3a | 3b | 4a | 4b | Δ |
| --- | --- | --- | --- | --- | --- |
| resolve_alias | 9/14 | 2/2 | 3/7 | 4/9 | flat, noisy |
| is_length | 5/6 | 10/13 | 5/6 | 8/8 | flat (DRY) |
| classify_css_value | 4/14 | 2/16 | 0/8 | 0/10 | down, composes token_value (no site mechanism) |
| is_named_color | 6/6 | 7/7 | 4/4 | 4/4 | flat |
| find_property | 8/12 | 6/14 | 7/14 | 7/16 | flat (≈ census 13.1 — CUT stands) |
| is_known_style_prop | 1/19 | 0/12 | 1/16 | 1/15 | flat |
| is_color_prop | 4/12 | 1/4 | 2/12 | 4/12 | flat, noisy |
| native_longhands_for_prop | — | — | — | — | **still gone** |
| resolve_canonical_prop | 0/2 | — | 0/2 | 0/3 | tiny |
| is_unrealizable_extension | — | — | 1/3 | — | tiny (one capture) |

### builder / serializer / module-graph (cloneplasma B1 + extend landed)

| fn | 3a | 3b | 4a | 4b | Δ |
| --- | --- | --- | --- | --- | --- |
| ladder::resolve | 0/16 | 0/22 | 0/3 | 0/5 | **DOWN (extend)** |
| follow_specifier / follow_edge | 0/16 | 0/21 | 0/3 | 0/5 | **DOWN (extend)** |
| ModuleKey::new / normalize_str | 1/6 | 1/12 | 0/4+2/4 | 0/3+2/3 | down-ish |
| build_keyed | 0/68 | 0/66 | 0/56 | 1/55 | **−12/−11 (B1 + inherits)** |
| resolve_entry | 0/54 | 0/52 | 1/46 | 0/37 | **−8/−15 (inherits)** |
| resolve_with_unique_diagnostics | 0/40 | 0/35 | 0/27 | 0/21 | **−13/−14 (inherits)** |
| serialize_lookup_key | 0/13 | 0/12 | 0/12 | 0/14 | flat (scalarreproof sub-noise, as filed) |
| canonical_json_value | 0/7 | 0/7 | 1/7 | 1/5 | flat (canonjson fence) |
| hashbrown Extend<(K,V)> | 0/24 | 0/29 | 0/13 | 0/12 | **−11/−17 (extend)** |

build_keyed callees (4a): resolve_entry 46 + serialize 5 + insert/hash/malloc
1 each. The Extend chain (resolve_file_imports 13 → Extend 13/12 →
resolve_binding 8/10 + value_of 5/2) is the landed extend mechanism at flame
grain; residual 13 is sub-bar. serialize residual = canonjson-fenced 7/5 +
diffuse malloc/probe — no ≥8 mechanism.

### cascade / emission (sysprefix landed; recipepath HELD — room intact)

| fn | 3a | 3b | 4a | 4b | Δ |
| --- | --- | --- | --- | --- | --- |
| build_stylesheets_with | 0/33 | 0/32 | 0/31 | 0/32 | flat (HELD room intact) |
| write_utilities | 1/25 | 0/22 | 1/22 | 0/22 | flat |
| push_selector_with_system | 1/8 | 0/8 | — | — | **gone (sysprefix rewire)** |
| push_selector_with_prefix | — | — | 0/6 | 0/3 | **new (sysprefix runs)** |
| nest | 1/6 | 0/7 | 0/7 | 0/4 | flat |
| EscapeCursor::push_char | — | — | — | — | still gone (D1 holds) |
| nest_member_into | 1/1 | 4/4 | 1/1 | — | tiny |
| split_selector_list | 3/4 | 2/3 | 2/4 | 3/4 | flat |
| from_atom | 0/3 | 1/2 | 0/1 | 0/1 | flat, tiny |
| sort closure | 2/5 | 0/4 | 2/6 | 3/5 | flat |
| driftsort | 0/11 | 0/10 | 0/11 | 0/12 | flat (cascade stable intact, sortshape-barred) |
| quicksort (stable) | 4/11 | 5/10 | 1/10 | 5/12 | flat |
| smallsort | 0/1 | 1/1 | ~1 | ~1 | tiny |
| quicksort (unstable) | 0/4 | 0/5 | 0/4 | 0/3 | flat (collect D1 intact) |
| extract_at_rules | — | — | — | — | never sampled (atrules CUT stands) |
| compile_one | 0/16 | 0/14 | 0/12 | 0/12 | flat, noise edge |
| append_recipes_layer | 0/4 | 0/6 | 1/5 | 0/5 | flat (legs ≤2, diffuse) |
| AssembleCtx::finish | 0/218 | 0/213 | — | — | **inlined away (code-motion, not a win)** |

finish's children (build_keyed, build_stylesheets_with, extract_with_context,
resolve_file_imports, ValueGraph::new, analyze, sources::collect) all still
sample under `atomic::compile` directly. One 2/3 blip in 4b is
`EscapeCursor::push_inner` under `push_selector_base` (not the dieted
push_char path) — inherent base-selector writes, single-capture micro.
write_utilities
callees: driftsort 9/10 + push_prefix 6/3 + from_iter 2/3 + push_declaration
2/3 + push_base 1/3 — sorts barred, selector work inherent, decl writes ≤3.

### diagnostics / proof (analysisb landed sub-noise; proof ground intact)

| fn | 3a | 3b | 4a | 4b | Δ |
| --- | --- | --- | --- | --- | --- |
| analysis::analyze | 0/21 | 0/22 | 0/19 | 0/20 | flat (banked −0.64, invisible as filed) |
| css::expectations | 1/16 | 0/16 | 0/11 | 0/15 | flat (= pure oxc-walk dispatch, floor) |
| jsx::expectations | 0/1 | 0/2 | — | — | gone, tiny |
| walk_leaf | nq | nq | 0/7 | 0/5 | residual, legs ≤4 (analysisb-object ground) |
| walk_nested_object | nq | nq | 0/4 | — | tiny |
| scan_imports | nq | nq | 2/2 | — | tiny |
| Proof::collect | 0/13 | 0/14 | 0/13 | 0/12 | flat (LANDED ground intact) |
| render_with | 0/3 | 0/3 | 1/3 | 1/4 | flat (DRY) |
| memo::hash_value | 2/2 | 1/1 | 1/1 | 1/1 | flat |
| MemoKey::eq | 0/1 | 1/1 | — | — | gone, tiny |

(nq = unqueried pre; no delta claimed.) css::expectations callees are 100%
oxc walk dispatch (walk_function 10/13 + walk_declaration) — the visitors do
~0 own work. walk_leaf legs (WalkCtx::expect 4/2, classify_value 2/3) sit
inside analysisb's landed object ground at fantasy 7 < 8.

### parse / oxc (floor; programsfx sub-noise; modmap CUT stands)

| fn | 3a | 3b | 4a | 4b | Δ |
| --- | --- | --- | --- | --- | --- |
| Parser::parse | 1/36 | 0/35 | 0/35 | 0/27 | flat (4b low draw −8) |
| parse_export_named_declaration | 0/26 | 0/31 | 0/27 | 0/14 | 4b-low (composes parse jitter) |
| parse_trace_module | 0/9 | 0/9 | 0/9 | 0/7 | flat (walk-only) |
| Lexer::next_token | 5/7 | 2/6 | 4/6 | 0/2 | flat (4b low) |
| walk_expression (oxc) | 16/27 | 17/29 | 11/20 | 13/27 | flat-ish (4a low) |
| walk_expression (atomic) | — | — | 0/10 | 0/11 | new visibility (inlining flip; room flat → reattribution) |
| walk_declaration | 3/98 | 1/103 | 0/95 | 1/98 | flat |
| hosts::resolve | 0/32 | 0/31 | 0/31 | 0/31 | flat (programsfx sub-noise, as filed) |
| trace_style_bindings_with_surface | 0/21 | 0/20 | 0/21 | 0/20 | flat |
| add_module_request | 4/4 | — | 5/5 | 5/5 | flat (oxc floor) |

hosts::resolve callees: trace 21/20 (= parse_trace_module 9/7 walk-floor +
BTree insert 5/6 recordaudit-CUT + collect_exported 4/5 + analyzer::new 2/1)
+ from_iter Vec-collect 8/9. modmap proved the map diet measures ~0
(PERF-W2-MODMAP); the residual is floor + CUT ground + ≤5 unworked micros.

### alloc / realloc (cloneplasma + set-5 volume kills; one diffuse offset)

| fn | 3a | 3b | 4a | 4b | Δ |
| --- | --- | --- | --- | --- | --- |
| do_reserve_and_handle | 6/19 | 8/25 | 3/25 | 4/24 | flat, noisy |
| finish_grow | 1/30 | 2/41 | 1/38 | 2/36 | flat, noisy (pre swung 11 too) |
| format_inner | 1/6 | 0/7 | 0/8 | 0/4 | flat (R3 marginal, as filed) |
| String::clone | 1/13 | 3/16 | 2/21 | 1/15 | 4a-high jitter (callers diffuse ≤4, sets differ) |
| Box<str>::clone | 1/22 | 0/14 | 0/10 | 0/12 | down-ish (R1/E1; pre noisy too) |
| hash_one | 7/10 | 9/10 | 7/8 | 8/9 | flat (Fx floor) |
| HashMap::insert | 9/27 | 4/22 | 4/22 | 5/24 | flat |
| reserve_rehash | 1/7 | 1/10 | 2/12 | 0/11 | flat |
| sip::write | — | — | — | — | **still extinct** |
| BTreeMap::insert | 11/19 | 7/12 | 5/14 | 5/12 | flat (recordaudit CUT) |
| malloc (self/incl) | 82/87 | 79/87 | 73/83 | 60/68 | **DOWN −9/−19** |
| free (self/incl) | 54/57 | 52/57 | 41/44 | 38/41 | **DOWN −13/−14** |
| memmove leaf | 51 | 51 | 59 | 61 | **UP +8/+10, diffuse (no caller >6)** |
| memcmp leaf | 29 | 21 | 36 | 34 | in-band jitter (hist. 21–39) |
| Components::next | 2/2 | 3/3 | ~3/~5 | ~3/~5 | flat, tiny |
| OwnedLookupKey drop | 0/4 | 0/9 | 0/2 | — | down (R1 lazy key) |
| write_str | 1/10 | 0/11 | 2/15 | 0/9 | flat noisy (key-fold writes, max site 5) |
| dying_next (BTree drain) | 1/10 | 1/14 | 1/12 | 0/10 | flat (= ModuleRecord drops, recordaudit CUT) |

memmove callers pre→post keep the same cast (V8 stringify/strings ~15,
rehash 3/4, LiteralBuffer 3/3, compile-direct 3/5, String::clone 3/5,
szone_realloc 5/5 newly visible). No landed diet adds copies — the +8/+10
is second-order allocator/layout effect of the set-5 diets, unresolvable at
flame grain, and it accounts for the flame-vs-stopwatch gap (−56/−58 flame
vs −63.3 expected). NOT seeded: no function-level handle exceeds 6wt.
String::clone's 4a-high read has shifting caller sets between captures
(4a: Vec-SpecExtend 4; 4b: Vec-clone/smallvec/bucket 2 each) — jitter on a
diffuse leaf, not mechanism.

### marshal (flat on the stopwatch; V8 leaves noisy as ever)

| fn | 3a | 3b | 4a | 4b | Δ |
| --- | --- | --- | --- | --- | --- |
| to_napi_value / napi string | 0/1 | 0/2 | 0/1 | 0/2 | tiny, flat |
| napi_get_value_string | 0/3 | 0/3 | 0/6 | 0/5 | tiny |
| V8 JsonParse builtin | 0/4 | 0/4 | 0/6 | 0/4 | flat, tiny |
| V8 JsonStringify builtin | 0/16 | — | 0/20 | 0/19 | noisy (3b missed it too; publish ms flat) |
| SlowFlatten | 0/4 | — | 0/9+0/1 | 0/6 | noisy (same) |
| compile_system edge | 558 | 556 | 500 | 500 | −58/−56 (carries win through) |

Publish stopwatch 53.0/56.9 → 52.6/52.5 anchors flat; the V8-frame swings are
small-n sampling (3b missed JsonStringify/SlowFlatten entirely, same as now).

### harvest (harvestphase D1 verified at flame grain)

| fn | 3a | 3b | 4a | 4b | Δ |
| --- | --- | --- | --- | --- | --- |
| classify_harvest_value | 1/11 | 1/12 | 1/8 | 0/12 | flat |
| collect_pool | 2/19 | 1/18 | 0/18 | 0/18 | flat (= walk intact) |
| mint | 0/10 | 0/10 | — | — | **gone ×2 (D1 sinks-empty skip runs)** |
| twin_key_for | 2/5 | 2/4 | — | — | **gone ×2 (with mint)** |

Pool still walks 18/18 (harvest CUT fence holds); mint + twin_key zero
samples ×2 — the D1 early return is mechanism-verified. Remainder is
walk_statement, fenced.

### resolve (cloneplasma R1/R2/U1 + wantctx verified; token_value unattributed)

| fn | 3a | 3b | 4a | 4b | Δ |
| --- | --- | --- | --- | --- | --- |
| resolve_want_with | 3/106 | 1/96 | 5/75 | 3/68 | **−31/−28** |
| resolve_token_value | 1/31 | 1/25 | 0/23 | 2/18 | −8/−7, NO landed mechanism (see below) |
| css_value_from_authored | 1/10 | 1/10 | 1/10 | 3/8 | flat (legs ≤3, diffuse) |
| authored_key | 0/5 | 0/9 | — | — | **gone ×2 (R1 lazy key)** |
| key_for_want | nq | nq | — | — | deleted by R1 |
| lower_when | 0/8 | 0/6 | 1/11 | 1/7 | flat (lowermemo fence) |
| expand_shorthand | 2/3 | 1/3 | 0/4 | 0/3 | flat (DRY) |
| collapse_whitespace | 0/2 | 1/3 | — | — | **gone ×2 (U1 borrowed path)** |
| clean_when / unit_px / push_resolved_atoms | nq | nq | — | — | inlined (R2/R3) |
| lower_conditions | nq | nq | — | — | inlined (R1) |
| format_entry | 0/6 | 0/3 | 0/3 | 0/1 | down (composes token_value) |
| lookup_entry | 0/5 | — | 0/8 | 1/6 | up-at-edge (reattribution in shrinking room) |
| get_in_category | 1/1 | 2/3 | 2/2 | — | tiny |
| resolve_rhythm | 0/1 | 0/1 | — | 1/1 | tiny (rhythm fence) |

resolve_want_with callees (4a): token_value 23 + lower_when 11 + css_value 10
+ malloc 6 + is_known 6 + expand 4 + Box-clone 3 + is_unrealizable 3. The
−31/−28 = R1's lazy key (authored/key_for_want gone) + R2's move-first
(clean_when inlined) + U1's borrow (collapse gone) + wantctx's session
(WantContext frameless, as designed — 79k Box clones + 3k spill allocs +
60k SmallVec clones show in malloc/free, not here).
resolve_token_value −8/−7 has NO landed mechanism at its site: nothing landed
in `resolve/tokens/*`, and its legs (tokenphase CUT whole-sync AND per-phase,
PERF-W2-TOKENPHASE) are worked ground. 3a was flagged extract-oversampled
(31 vs 25); the honest read is a ~5wt unattributed drop, not a win — a count
probe could promote it, but no crew is seeded on an unattributed delta.
css_value residual disperses across canonical_number 2, is_color 2,
resolve_numeric 2/1, parse_decimal 1 — fantasy 10 < 15 with no leg above 3.

### scan / sources (floor, untouched)

| fn | 3a | 3b | 4a | 4b | Δ |
| --- | --- | --- | --- | --- | --- |
| sources::collect | 0/20 | 0/21 | 0/20 | 1/20 | flat |
| collect_candidate_paths | — | — | — | — | still gone |
| backfill_dir | 0/15 | 0/16 | 0/15 | 0/15 | flat (syscall floor) |
| sorted_entries | 0/12 | 0/13 | 0/11 | 0/13 | flat (realloc D7 sub-noise) |
| matches_file | 1/4 | 0/4 | 0/3 | 0/4 | flat, tiny |
| compare_components | 5/7 | 6/6 | 7/9 | 7/8 | flat, noise edge |

### resolver (extend landed; ValueGraph residual fenced)

| fn | 3a | 3b | 4a | 4b | Δ |
| --- | --- | --- | --- | --- | --- |
| resolve_file_imports | 0/24 | 0/29 | 0/13 | 0/13 | **−11/−16 (extend)** |
| resolve_binding | 0/18 | 0/27 | 0/8 | 0/11 | **−10/−16 (extend)** |
| ValueGraph::new | 0/22 | 0/23 | 1/18 | 0/18 | down-at-edge, no mechanism (valgraph CUT stands) |

ValueGraph::new callees disperse (from_iter 3/4, census 3/2, String::clone 3,
ModuleRecord-drop 3/4, ModuleKey 2/1, LocalConst-drop 2/4, insert 1/2 — max
4). valgraph's bundle fantasy was 3.5 (PERF-W2-VALGRAPH); the −4/−5 sits at
the noise edge with no landed mechanism and no ≥8 handle.

### extract (lineindex + stageaudit verified; residuals fenced)

| fn | 3a | 3b | 4a | 4b | Δ |
| --- | --- | --- | --- | --- | --- |
| extract_with_context | 0/64 | 0/52 | 0/60 | 0/56 | flat |
| walk_style_object | 0/49 | 0/38 | 1/46 | 1/46 | flat |
| handle_css_arg | 0/35 | 0/27 | 0/32 | 0/31 | flat |
| push_string_want | 0/20 | 0/18 | 1/16 | 0/16 | down (line_col gone; residual = pushstring CUT) |
| push_want | 0/18 | 0/15 | 0/11 | 1/12 | down (line_col gone) |
| LineIndex::line_col | 9/9 | 5/5 | 1/1 | — | **lineindex verified** |
| LineIndex::for_source | 2/3 | 4/6 | 1/1 | — | down (lineindex) |
| collect_inner | 1/15 | 1/17 | 0/15 | 0/14 | flat (scoperec CUT) |
| collect_local_constants | 0/10 | 1/16 | 0/13 | 0/12 | flat (walk floor + CUT ground) |
| StreamedSource::collect | 0/13 | 0/17 | — | — | **gone ×2 (stageaudit fusion)** |
| ModuleRecord::collect | 0/16 | 0/10 | 0/11 | 0/10 | flat |
| insert_local | 0/10 | 0/6 | 0/5 | 0/4 | flat (3a-high noted pre; recordaudit CUT) |
| insert_var_names | 0/10 | 0/7 | 0/7 | 0/5 | flat (same) |
| recipes::extract | 0/18 | 0/18 | 0/17 | 0/15 | flat |
| walk_recipe_object | 0/18 | 0/18 | 0/16 | 0/15 | flat (= walk_style_into 15 = walk_style_object — same fenced machinery) |
| recipes::push_rule | nq | nq | 0/7 | 0/10 | = resolve_want 7/8 + own ≤2 (dry) |
| stage_streamed / with_bag / StagedBag / WantContext | — | — | — | — | frameless/inlined, as designed |
| record_import / attach_pure_fns / clear_unbound | nq | nq | 1/2 / 0/3 / 0/1 | — / 0/3 / 0/1 | tiny |

push_string_want callees: push_want 11/12 + SmallVec-extend 3/4 — the
lineindex diet removed the position leg; the residual is pushstring's CUT
ground (0.1–0.3 fantasy, PERF-W2-PUSHSTRING) plus realloc-fenced growth.
local_constants 13/12 = oxc-walk floor + recordaudit-CUT record work +
visitrec-CUT dispatch — no unfenced mechanism ≥8. Recipe bodies walk through
the identical walk_style_object machinery as main extract: no distinct
mechanism exists, so any shape here re-litigates pushstring/visitrec/lineindex
without new evidence.

## Per-room delta analysis: what wave-2's last three arcs moved

Scope honesty: pre (repro3a/b) predates cloneplasma + set-4-subset + set-5, so
raw pre→post spans all three (−63.3). Attribution uses mechanism-level flame
evidence (caller disappearance, frame absence ×2, callee splits), cross-checked
against the filed LOO/banked numbers in integrate-cloneplasma/set4b/set5.md.

- **cloneplasma (LAND −26.65 8/8: MOVED, mechanism-verified at deepest grain.**
  authored_key gone ×2, key_for_want deleted, collapse_whitespace gone ×2,
  clean_when/unit_px/push_resolved_atoms/lower_conditions inlined away,
  resolve_want_with −31/−28, build_keyed −12/−11 (B1 probe-then-decide),
  Box-clone down, malloc/free down. Remainder: resolve 75/68 (fenced legs),
  token_value 23/18 (tokenphase CUT), css_value 10/8 (diffuse ≤3/leg),
  build_keyed 56/55 (inherits + fenced serialize).
- **extend (set-4: MOVED.** ladder 16/22→3/5, follow →3/5, file_imports −11/−16,
  binding −10/−16, hashbrown-Extend −11/−17. Remainder 13 sub-bar → dry.
- **sysprefix (set-4: MOVED.** push_selector_with_system gone, _prefix 6/3 new.
  Remainder is inherent writes → dry.
- **scalarreproof (set-4: sub-noise as filed.** serialize flat 12/14; remainder
  fenced (canonjson CUT) with no ≥8 mechanism → dry.
- **lineindex (set-4: MOVED.** line_col 9/5→1/0, for_source down, push legs down.
  Remainder = pushstring CUT ground → dry.
- **analysisb (set-4: sub-noise as filed.** analyze flat 19/20; largest sub
  (walk_leaf 7/5) has legs ≤4 inside landed object ground → dry.
- **realloc D2/D7 (set-4: sub-noise as filed.** sorted_entries flat;
  IdentityGraph::resolve 1 → dry.
- **programsfx (set-5: sub-noise as filed.** hosts flat 31/31; modmap CUT stands
  (map diet measured ~0) → dry.
- **wantctx (set-5: MOVED, inside resolve_want_with −31/−28** (with cloneplasma;
  banked −5.39 6/8). Frameless session struct, as designed; volume kills show
  in malloc/free. Remainder: fenced resolve legs → dry.
- **stageaudit (set-5: MOVED.** StreamedSource::collect gone ×2 (N2 second walk
  fused). Remainder is the fused walk itself (floor) → dry.
- **bagdefer (set-5: frameless as designed** (bag_mut 0/1, one capture). The
  3,003 skipped collect+drops diffuse through malloc/free (−9/−19, −13/−14);
  no named-frame delta is expected and none is claimed. Remainder: read bags
  (first-read cost is inherent) → dry.
- **harvestphase D1 (set-5: MOVED.** mint gone ×2, twin_key gone ×2. Remainder
  is pool walk 18 (harvest CUT fence) → dry.
- **What did NOT move and why:**
  - build_stylesheets/write/compile_one/append (flat): recipepath HELD — the
    room is intact for the T1 re-proof, and for nothing else (sorts barred,
    selector work inherent, decl writes ≤3, push_rule own ≤2).
  - parse/walk/hosts/trace/sources (flat): floor, or CUT ground (modmap,
    recordaudit, visitrec, scoperec).
  - Proof::collect 13/12, render 3/4, memo-hash 1/1 (flat): LANDED ground, DRY.
  - token_value legs, lower_when, find_property, ValueGraph setup, BTree record
    ground, push_string/want, collect_inner (flat): CUT-fenced rooms (tokenphase,
    lowermemo, findprop, valgraph, recordaudit/recordcopy, pushstring, scoperec).
  - css_value dispatch 10/8, serialize 12/14, write_str 15/9, local_constants
    13/12 (flat): fantasy ≤15 with NO single mechanism ≥8 — CUT-fast without a
    crew (write_str is the closest near-miss: max site 5, ground shared with
    recordaudit/scoperec CUTs).
  - resolve_token_value −8/−7 unattributed (no landed mechanism; 3a was
    extract-oversampled): flagged, not seeded — an unattributed delta is not a
    mechanism.
  - finish_grow, do_reserve, Box-clone, resolve_alias, is_known, normalize_str,
    Parser::parse (4b-low), memcmp: single-frame jitter (±5–8 documented) with
    4a↔4b straddles — reported flat, never claimed.
  - 4b startup +45.6: node-startup stall outside sync; unscored, disclosed.

## Ranked re-seed list

Ordered by addressable size. "Size" = post-land incl wt (≈ms).
"Track" = LAND (≥15 ms + ≥1.5% ≈ 14.1 ms @938) / BANK (proven-identical
sub-bar diet into a sum) / RECON (census-first, CUT fast unless the bar
clears) / PER-PHASE (keys2-precedent bank framing + differential proof).

Excluded: all 24 landed diets' ground (improvement only with cited prior +
beating shape — none below qualifies except the HELD re-proof); all 26
whole-sync CUTs plus the per-phase CUTs (each cited); both heavy tracks
(shot2 KILL, slice1b ban); frameless/fused/inlined diet sites (no handle).

| # | topic | size (wt≈ms) | entry file / fn | track + falsification bar |
| --- | --- | --- | --- | --- |
| 1 | recipepath re-proof (HELD BANK) | room 12–17 intact (compile_one 12/12 + push_rule-resolve + append 5/5 + write 22/22); banked −13.05/−1.30% 7/8 | `stylesheet/emitter/mod.rs` `escaped_base_selector` + tests; patch filed at `docs/perf/waves/wave-2/recipepath.patch` | RE-PROOF per the intset4b spec — NOT another member-alone LOO: an in-composition arm (recipepath-including vs this tip-subset) or a mechanism isolation showing where the composition goes contra. Must reproduce the banked direction in-composition within noise AND explain the +5.42/+7.80 replication contras, else HELD→CUT. Fantasy 13 (sub-bar both prongs → BANK-track ceiling at best) / realistic ~0 to contra (the crew itself attributed the bulk to allocator second-order, which cloneplasma + set-5 relieved first). Fences: PERF-W2-RECIPEPATH (bank), INT-W2-SET4B (re-proof spec + contra evidence), PERF-W2-ATRULES (the extract_at_rules lead is CUT at ~1ms — dead, do not revive), sysprefix shared-escape counts (compose, never double-count). No pivot to a second hypothesis. |

That is the entire ranked backlog: one re-proof. Everything else is either
landed, CUT-fenced, floor, or CUT-fast without a crew (fantasy ≤15 with no
single mechanism ≥8 — the near-misses write_str 15/9, serialize 12/14,
css_value 10/8, and local_constants 13/12 are ruled out in the dry rooms with
exact leg splits, so no future crew re-litigates them without new filed
evidence).

Carried filler (not a crew topic — no proven shape): pushstring's Want
file/prop/origin interning sketch (245,578 mallocs + ~8MB, 5–8.5ms fantasy,
needs repr surgery on owned `Box<str>`; PERF-W2-PUSHSTRING). It stays filler
until someone files a soundness design, not a brief.

## Dry rooms (no addressable remainder) with evidence

- **Canon dispatch/classify — DRY.** find 14/16 (≈ the 13.1 census —
  PERF-W2-FINDPROP stands); is_length 6/8, is_named_color 4/4, resolve_alias
  7/9, is_known 16/15, is_color 12/12 — all flat, wave-1 + set-1/3 ground.
- **Builder/resolve-entry/diag-chain residuals — DRY.** build_keyed 56/55 =
  resolve_entry 46/37 (inherits resolve drops, no own mechanism) + serialize
  5/9 + ≤1 micros. unique_diag 27/21 inherits. No own handle ≥8.
- **Serialize — DRY.** 12/14 = canonical_json 7/5 (PERF-W2-CANONJSON) + diffuse
  malloc/probe; fantasy 14 < 15 with no ≥8 mechanism → CUT-fast, no crew.
- **Cascade sorts/shape — DRY.** driftsort 11/12 + quicksort 10/12 + closure
  5/6 = the untouched stable sort (PERF-W2-SORTSHAPE: 67/67 divergent ties bar
  shape changes); from_atom 1; unstable 4/3 (collect D1 intact).
- **Selector-push/shorthand — DRY.** _system gone, _prefix 6/3 inherent writes;
  push_char still zero ×2; nest 7/4 = split 4/3 (N1 hit 13%) + member_into —
  sub-bar, no mechanism. expand 4/3; longhands still gone ×2.
- **Emission residuals (non-recipepath) — DRY.** push_declaration ≤3, push_base
  ≤3, append_recipes legs ≤2 (decl writes + insertion + nest + format_1),
  push_rule own ≤2 (= resolve edge 7/8 + ~2). Recipepath's escape site is T1's
  alone.
- **Proof join — DRY.** collect 13/12 + render 3/4 + memo-hash 1/1 — LANDED
  tradeoff, unchanged.
- **Diag render cluster — DRY.** render_fact/render_expected zero ×6 (all four
  wave-2 captures + both fresh).
- **Analysis remainder — DRY.** analyze 19/20 (banked −0.64, invisible as
  filed); css::expectations 11/15 = 100% oxc-walk dispatch (floor); walk_leaf
  7/5 legs ≤4 inside landed object ground (fantasy 7 < 8); jsx/scan/walk_nested
  tiny-or-gone.
- **Parse/oxc/walks — DRY (floor).** parse 35/27 (4b low draw), walks 95/98 +
  58/67 + 20/27, lexer 6/2, add_module_request 5/5. Atomic walk_expression
  10/11 is an inlining flip inside a flat room (reattribution, not work).
- **Hosts/styletrace-trace — DRY.** 31/31 = parse-walk floor 9/7 + BTree
  recordaudit-CUT 5/6 + collect_exported 4/5 + analyzer::new 2/1 + Vec-collect
  8/9 floor. PERF-W2-MODMAP proved the map diet measures ~0.
- **Sources/scan — DRY (floor).** collect 20/20 = backfill syscall 15 + sorted
  11/13 (realloc D7 live) + matches 3/4. candidate_paths still gone.
- **ValueGraph setup — DRY.** 18/18 disperses ≤4/leg (PERF-W2-VALGRAPH bundle
  fantasy 3.5); the −4/−5 has no mechanism and no handle.
- **Extract walks/push — DRY.** with_context 60/56, walk_style 46/46,
  handle_css 32/31 (floor + fenced volume); push_string 16/16 + push_want
  11/12 = PERF-W2-PUSHSTRING (0.1–0.3) + realloc-fenced growth; line_col 1/0
  (lineindex runs).
- **Recipes extract — DRY.** 17/15 → walk_recipe_object 16/15 → walk_style_into
  15/15 → the SAME walk_style_object machinery as main extract. No distinct
  mechanism — any shape re-litigates pushstring/visitrec/lineindex.
- **Scope/const/record — DRY.** collect_inner 15/14 (PERF-W2-SCOPEREC 0.9–1.5);
  local_constants 13/12 = walk floor + recordaudit-CUT + visitrec-CUT dispatch
  (no unfenced ≥8); ModuleRecord 11/10 flat; inserts 5/4 + 7/5 flat
  (PERF-W2-RECORDAUDIT 6.4, PERF-W2-RECORDCOPY 0.54); BTree insert 14/12 +
  drain 12/10 = owned-record drops (CUT).
- **Streamed staging — DRY.** StreamedSource::collect gone ×2 (stageaudit
  fusion runs); stage_streamed/with_bag/StagedBag frameless (small fns, no
  handle); census 3, IdentityGraph::resolve 1.
- **Harvest pool — DRY.** pool 18/18 = walk_statement (PERF-W2-HARVEST fence);
  mint + twin_key gone ×2 (D1 runs).
- **Resolve legs — DRY.** token_value 23/18 (PERF-W2-TOKENPHASE: whole-sync AND
  per-phase attempted, 3.5/38.5% measured); lower_when 11/7 (PERF-W2-LOWERMEMO
  4.3/1.2); css_value 10/8 disperses ≤3/leg (fantasy 10 < 15, no ≥8 mechanism);
  is_known leg 6/8 (findprop CUT); expand 4/3; Box-clone 3/4; malloc 6/3.
- **Marshal seam — DRY.** napi frames ≤6; codec legs tiny-flat; publish
  stopwatch flat 52.6/52.5. Residual is inherent bytes.
- **Diffuse leaves — DRY.** memmove +8/+10 (no caller >6 — offset, not a room);
  memcmp 36/34 in-band; String::clone 21/15 diffuse ≤4 with shifting caller
  sets (jitter); write_str 15/9 max site 5 on CUT-shared key-fold ground
  (nearest near-miss, ruled out above); from_iter 68/73 = merged monomorphs
  across N rooms (un-actionable by construction).
- **Alloc floor — DRY.** do_reserve 25/24, finish_grow 38/36, hash_one 8/9 (Fx),
  hashbrown insert 22/24, rehash 12/11, sip still extinct.
- **Scan/config/evaluate/publish — DRY (kernel/loader floor, ~450ms).**
  shot2 KILLED — no pre-open signals, no skip logic, WORK diets only.
- **Whole-sync CUTs stand (26, wave-2):** modgraph, manifest, lowermemo,
  sortshape, rhythm, asmfmt, posreuse, btreeset, findprop, nameset, harvest,
  callermemo, canonjson, atrules, tokenphase, trbl, valgraph, visitrec,
  scoperec, pushstring, recordaudit, recordcopy, resolvefmt, modmap, cascade-2,
  keys2-memo — plus slice1b (ban-CUT) and the wave-1 fences (islen, keys-memo,
  memmove/memcmp standalone, per-open floor, pure-JS micro).
- **Heavy tracks — both dead:** shot2 KILLED (~190ms dead-file avoidance);
  slice1b CUT by HQ multithreading ban (parallel compile, 100–140ms).
- **Superseded/YIELDED — dead, never re-seeded:** authcss YIELDed to cloneplasma
  (all 6 hunks subsumed, INT-W2-CLONEPLASMA hunk map); scalarjson HELD on
  generic-W merge mechanics, ground re-proven by landed scalarreproof
  (PERF-W2-SCALARREPROOF).
- **Wave-2 count check (no correction):** 24 diets = set-1 five (diag, canon2,
  cascade, parse, keys2) + set-2 two (hashers, extract) + set-3 five (collect,
  proof, selpush, shorthand, marshal) + cloneplasma + set-4-subset six
  (sysprefix, extend, realloc, scalarreproof, lineindex, analysisb) + set-5
  five (programsfx, wantctx, stageaudit, bagdefer, harvestphase); 6 arcs
  (set-1, set-2, set-3, cloneplasma, set-4-subset, set-5). Recipepath HELD and
  authcss/scalarjson correctly excluded.

## Honest arithmetic for the captain (not a re-scope proposal)

Sync is ≈938 ms against the 700 target (gap ≈ 238; flame instrumented
974.7/972.6, +3.8% over the scoreboard — same overhead ratio as repro2).
Scan (≈368 flame) + publish + config + evaluate ≈ 450 is kernel/loader floor
(shot2 KILLED). So compile ≈ 520 → ~280 (−240) is needed from diet rooms.

The remaining stack on THESE flames: T1 recipepath fantasy 13 (banked −13.05,
realistic ~0-to-contra — the composition that produced +5.42/+7.80 has only
grown with set-5's allocator relief) + pushstring interning filler 5–8.5
(unshaped repr surgery, not a crew topic) ≈ **18–21wt at 100% impossible
fantasy (≈ 0–5 ms realistic)**. Even stacking everything at fantasy:
≈938 − 21 ≈ **917**. Realistic floor: ≈935+.

Repro2's ≈910 stacking ceiling is SUPERSEDED by a tighter fresh ceiling:
**≈917 fantasy / ≈935 realistic**. The backlog got thinner, not fatter —
wave-2 landed −63 of the −90 it stacked, and every ranked topic but the
recipepath re-proof resolved (7 landed-or-CUT: lineindex landed; pushstring,
recordaudit, valgraph, scoperec, visitrec, tokenphase CUT).

The 700 target is unreachable on the current single-thread architecture by
≈235+ ms. The serial program past this re-profile is exactly one re-proof
(T1) plus filler-grade sketches with no proven shape — the backlog is
exhausted at whole-sync bar AND at per-phase bar (tokenphase already tried
per-phase framing and CUT). Both heavy tracks stay dead — one by measurement
(shot2), one by directive (slice1b). What remains is a product/architecture
decision the captain (or HQ) must make; no further serial re-seed can bridge
a 235ms gap with a 21ms-fantasy backlog.

## Verdict

**RESEED (base 6f4cf1ba392f + filed enterprise-repro4a/b: n=2 instrumented
flame runs 974.67/972.65 RECONCILED ×2; backlog = T1 recipepath re-proof ONLY;
fresh stacking ceiling ≈917 fantasy / ≈935 realistic — repro2's ≈910
superseded; gap to 700 ≈235+ unreachable single-threaded; uninstrumented
multi-pair confirm is the captain's)**
