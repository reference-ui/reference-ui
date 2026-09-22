# swarm-repro2 REPORT: post-set-3 re-profile (wave-2 sets 2+3)

## Identity

- Base: `3dd32a659715aeb17d5d04167d756fb7f5ce30c8` (verified `git rev-parse HEAD` first act; tree clean).
- Release `.node`: `d0258e4817babe4364263b2c7ceee72fd421003a016ab845c0c8d04a4fdf99c3`
  (`packages/reference-rs/dist/native/virtual-native.darwin-x64.node`, 8,894,472 B,
  `napi build --release via ensure-native`). Built once in-tree; never rebuilt after capture 1.
- Wrappers: `build:js` ran once (missing in fresh worktree; gitignored, not in diff).
- End state: tree diff vs HEAD is this REPORT.md + `docs/evidence/flamegraph/enterprise-repro3{a,b}/`
  only (untracked); bench-report byproduct dir removed; `dist/` outputs gitignored.
  No production code changes. No commits.

## Bundles + protocol fidelity

- `/tmp/swarm-repro2-flame/enterprise-repro3a/` — syncMs **1030.91**, compile 579.08, RECONCILED.
- `/tmp/swarm-repro2-flame/enterprise-repro3b/` — syncMs **1031.06**, compile 576.20, RECONCILED.
- Each bundle: `profile.json.gz` + presymbolicated sidecar + `phases.json` + `meta.json` +
  `summary.md` + `callers.md` (filed via the query layer, no re-record).
- Filed as `docs/evidence/flamegraph/enterprise-repro3a/` + `enterprise-repro3b/`
  (two sibling dirs — the repro1/2 precedent; the query layer expects one bundle per dir).
- Procedure `agentrs-flame/3`, identical to repro1/2: locked load
  (3000 style + 12000 dead, 7527 css calls, seed 7), 1000 Hz samply,
  `--perf-basic-prof`, same-run phase buckets. Pin `3dd32a65`, **dirty:false**.
- Fidelity notes / deviations:
  - Captured out-of-tree (`--out` /tmp), then copied into the worktree evidence dir.
  - Tip syncMs verified first with unscored samples: cold 1373.6 (discarded),
    then warm **997.4 / 999.7** — matches the ≈1000 enterprise median exactly.
  - n=2 captures; the second is a stability cross-check, not protocol.
  - Flame leg ONLY — no counters/alloc re-score. IPC, realloc counts, marshal-delta,
    and RSS-HW are not re-measured; the alloc/realloc room below is flame-attribution
    evidence only.

## Whole-sync + phase burndown (pre vs post; wt ≈ ms)

Pre = `enterprise-repro1/2` (base `810b8b5b4`, post wave-1 + set-1).
Total expected from landings: set-2 FULL −27.41 + set-3 FULL −41.75 = **−69.2**.

| phase | pre r1 (ms) | pre r2 (ms) | r3a (ms) | r3b (ms) | Δ 3a | Δ 3b |
| --- | --- | --- | --- | --- | --- | --- |
| syncTotal | 1099.7 | 1096.1 | 1030.9 | 1031.1 | **−68.8** | **−65.0** |
| compile | 654.5 | 646.2 | 579.1 | 576.2 | **−75.4** | **−70.0** |
| scan | 367.7 | 367.6 | 365.0 | 367.7 | −2.7 | +0.1 |
| publish | 48.1 | 48.9 | 53.0 | 56.9 | +4.9 | +8.0 |
| config | 26.7 | 27.2 | 27.5 | 27.5 | +0.8 | +0.3 |
| evaluate | 2.7 | 6.2 | 6.1 | 2.7 | +3.4 | −3.5 |
| startup (outside sync) | 127.5 | 122.1 | 121.2 | 119.7 | −6.3 | −2.4 |

Sync −68.8/−65.0 vs expected −69.2: agreement within run noise (the r3b
−65.0 sits 4.2 off on a cooling box; both captures' compile deltas straddle
the sum). The win sits in compile (−75/−70); scan/config/eval are flat.
Publish GREW +5/+8 — marshal's disclosed V8-rope flattening cost, confirmed
at flame grain below (SlowFlatten +4, new in publish scope).

Lib self-weight: kernel 417/428 → 422/422 (floor, unmoved); .node 295/299 →
261/268 (−34/−31, the dieted Rust work); malloc 217/191 → 186/189;
platform 94/108 → 94/83; node 178/162 → 163/156 (startup noise); JS 19/22 → 20/25.

## Per-room burndown (whole-sync scope, self/incl wt ≈ ms; pre r1/r2, post 3a/3b)

All values from `--inspect` drill-downs (exact self/incl at any rank), not
top-N cutoffs. "—" = zero samples in that capture.

### canon (shorthand landed: 359,616 redundant resolves + ~82k probes killed)

| fn | r1 | r2 | 3a | 3b | Δ |
| --- | --- | --- | --- | --- | --- |
| resolve_alias | 4/10 | 8/10 | 9/14 | 2/2 | flat, noisy (3a↔3b swing 12 — small-n jitter) |
| is_length | 9/9 | 11/12 | 5/6 | 10/13 | flat (DRY) |
| classify_css_value | 1/16 | 2/8 | 4/14 | 2/16 | flat (noisy pre too) |
| is_named_color | 6/6 | 3/3 | 6/6 | 7/7 | flat |
| find_property | 17/28 | 15/29 | 8/12 | 6/14 | **−16/−15, both agree** |
| is_known_style_prop | 1/22 | 3/29 | 1/19 | 0/12 | down, noisy (3a↔3b swing 7) |
| is_color_prop | 5/8 | 5/8 | 4/12 | 1/4 | flat, noisy |
| native_longhands_for_prop | 0/4 | 0/7 | — | — | **gone ×2** |
| resolve_canonical_prop | 0/6 | 0/6 | 0/2 | — | small |

find_property edges: the longhands caller (4/6wt) is GONE (shorthand D1
shared-probe mechanism); the render_with→is_known leg is GONE (proof prop
memo); the is_known leg shrank 19/22 → 10/11. Post 12/14 ≈ findprop's exact
13.1 census — the pre 28/29 reads overweight (sampling on a hot leaf).

### module-graph / serializer / builder (hashers landed; scalarreproof live)

| fn | r1 | r2 | 3a | 3b | Δ |
| --- | --- | --- | --- | --- | --- |
| ladder::resolve | 0/21 | 0/22 | 0/16 | 0/22 | noise edge (3b = pre) |
| follow_specifier / follow_edge | 0/23 | 0/23 | 0/16 | 0/21 | noise edge |
| ModuleKey::new / normalize_str | 0/16 | 2/16 | 1/6 | 1/12 | noise edge (3a low draw) |
| build_keyed | 2/71 | 1/70 | 0/68 | 0/66 | −3/−4 (hashers seen_keys Fx, at edge) |
| resolve_entry | 1/57 | 0/54 | 0/54 | 0/52 | flat |
| resolve_with_unique_diagnostics | 0/44 | 0/42 | 0/40 | 0/35 | −4/−7 (inherits resolve win) |
| serialize_lookup_key | 1/16 | 1/14 | 0/13 | 0/12 | −3/−2 (scalarreproof live) |
| canonical_json_value | 0/6 | 0/5 | 0/7 | 0/7 | flat (canonjson fence) |

The whole resolver chain reads low in 3a (imports 24, binding 18, follow 16,
ladder 16) but ≈pre in 3b (29/27/21/22): 3a under-sampled this chain. The
chain is flat within noise; hashers' resolver-site savings (~1 ms est) sit
below flame resolution. No resolver win is claimed.

### cascade / emission (selpush landed; sysprefix banked; recipepath BANKED)

| fn | r1 | r2 | 3a | 3b | Δ |
| --- | --- | --- | --- | --- | --- |
| build_stylesheets_with | 0/40 | 0/37 | 0/33 | 0/32 | −7/−5 |
| write_utilities | 0/29 | 0/29 | 1/25 | 0/22 | −4/−7 |
| push_selector_with_system | 1/12 | 1/11 | 1/8 | 0/8 | −4/−3 |
| nest | 2/9 | 3/10 | 1/6 | 0/7 | −3/−3 |
| EscapeCursor::push_char | 0/1 | 4/6 | — | — | **gone ×2** (selpush D1 runs) |
| nest_member_into | — | — | 1/1 | 4/4 | new (N2 push-direct) |
| is_wrap leg | — | 3 | — | — | gone (N3 predicate swap) |
| split_selector_list | 2/4 | 3/3 | 3/4 | 2/3 | flat (N1 hit only 2,260/17,087) |
| from_atom | 1/3 | 2/3 | 0/3 | 1/2 | flat |
| sort closure | 3/5 | 0/5 | 2/5 | 0/4 | flat (sortshape fence) |
| driftsort | 0/22 | 1/22 | 0/11 | 0/10 | **halved** (collect D1, see scan) |
| quicksort (stable) | 3/22 | 3/20 | 4/11 | 5/10 | **halved** (same) |
| smallsort | 3/10 | 3/10 | 0/1 | 1/1 | **gone** (same) |
| quicksort (unstable) | — | — | 0/4 | 0/5 | new (D1 converted sorts) |

Flame shows selpush's mechanism working at realistic-estimate magnitude
(−5..−7 across the emission cluster, both captures): the LOO +1.78 and
banked −1.76 stopwatch straddles were sub-noise reads of a real ~5–7 ms
diet. The sort halving is collect D1 (35 dir sorts stable→unstable), NOT
cascade's atom sort — the residual ~11 is cascade's untouched stable sort
(sortshape-barred).

### diagnostics / proof (proof landed; analysisb live)

| fn | r1 | r2 | 3a | 3b | Δ |
| --- | --- | --- | --- | --- | --- |
| analysis::analyze | 0/22 | 0/21 | 0/21 | 0/22 | flat (analysisb live) |
| css::expectations | 0/16 | 0/14 | 1/16 | 0/16 | flat |
| jsx::expectations | 0/3 | 0/4 | 0/1 | 0/2 | flat, tiny |
| Proof::collect | 0/13 | 3/13 | 0/13 | 0/14 | **flat — see mechanism** |
| render_with | 1/12 | 1/12 | 0/3 | 0/3 | **−9/−9, rock solid** |
| drop Proof | 0/3 | 0/3 | 0/2 | 0/2 | flat (render residual) |
| memo::hash_value | — | — | 2/2 | 1/1 | new (SerialMemo probe) |
| MemoKey::eq | — | — | 0/1 | 1/1 | new |

render_with edges: is_known 5wt GONE (per-prop memo 35,426→46) and the
~3wt memcmp walk GONE (borrowed hash view); residual 3 = drop 2 + probe 1.
Proof::collect is net-flat because the diet traded serialize weight
(10/5 → 5/6) for memo-probe weight (hash_one 3/4 + insert 3 + MemoKey::eq)
— the tradeoff is VISIBLE at flame grain. All analysis subs
(scan_imports, walk_object/nested/leaf, static_key, bind_pattern_names)
tiny and flat — analysisb's whole ground intact.

### parse / oxc (floor; programsfx live on programs maps)

| fn | r1 | r2 | 3a | 3b | Δ |
| --- | --- | --- | --- | --- | --- |
| Parser::parse | 0/34 | 0/34 | 1/36 | 0/35 | flat (floor) |
| parse_trace_module | 1/8 | 0/10 | 0/9 | 0/9 | flat (walk-only) |
| Lexer::next_token | 4/8 | 5/8 | 5/7 | 2/6 | flat |
| walk_expression | 17/29 | 13/26 | 16/27 | 17/29 | flat |
| walk_declaration | 1/102 | 2/96 | 3/98 | 1/103 | flat |
| hosts::resolve | 0/33 | 0/34 | 0/32 | 0/31 | flat (programsfx live) |
| trace_style_bindings | 0/22 | 0/23 | 0/21 | 0/20 | flat |

merge_constants_ordered: zero samples in BOTH fresh captures (still inlined
away; streamed residue still re-attributed under compile). Retained parsing
DRY; streamed DRY-as-floor.

### alloc / realloc (extract+proof+collect+hashers volume; realloc BANKED, cloneplasma LAND-claim)

| fn | r1 | r2 | 3a | 3b | Δ |
| --- | --- | --- | --- | --- | --- |
| do_reserve_and_handle | 8/29 | 5/35 | 6/19 | 8/25 | **−10/−10, both agree** |
| finish_grow | 2/33 | 1/39 | 1/30 | 2/41 | noisy (3a↔3b swing 11) |
| format_inner | 2/8 | 0/9 | 1/6 | 0/7 | −2ish |
| String::clone | 1/26 | 3/22 | 1/13 | 3/16 | **−13/−6, direction ×2** |
| Box<str>::clone | 1/25 | 0/13 | 1/22 | 0/14 | flat, noisy (pre swings 12 too) |
| hash_one | 8/20 | 10/16 | 7/10 | 9/10 | **−10/−6, post 10/10 solid** |
| HashMap::insert | 9/25 | 7/20 | 9/27 | 4/22 | flat (Fx inside same frame) |
| reserve_rehash | 3/10 | 5/15 | 1/7 | 1/10 | −3/−5 (extract's 19k regrows) |
| sip::write | 11/11 | 6/6 | — | — | **gone ×2 — SipHash extinct** |
| BTreeMap::insert | 6/14 | 0/10 | 11/19 | 7/12 | noisy (3a-high; 3b ≈ pre) |
| malloc_type / free (incl) | 96/109 | 91/97 | 82/87 | 79/87 | −22/−10 / −11/−10 |
| memmove leaf | 53 | 53 | 51 | 51 | flat (bulk moves, not small clones) |
| memcmp leaf | 32 | 39 | 29 | 21 | down, noisy |
| Components::next | 9/9 | 11/11 | 2/2 | 3/3 | **−7/−8** (collect D1) |
| OwnedLookupKey drop | — | 0/1 | 0/4 | 0/9 | up-ish (inline jitter; room nets down) |

hash_one callees post: memo::hash_value + Box-hash (Fx) — the sip::write
callee (11/6 pre) is gone. Remaining hash_one 10 = Fx hashing floor.
BTreeMap::insert callers (ExportTable::insert_local 8/6, trace 4, serializer
4) ride the 3a extract-oversample; 3b (12) ≈ pre (14/10) — no BTree growth
story. OwnedLookupKey-drop jitter nets inside resolve_want_with's −7/−13.

### marshal (marshal landed −6.71 LOO 8/8)

| fn | r1 | r2 | 3a | 3b | Δ |
| --- | --- | --- | --- | --- | --- |
| to_napi_value | 0/3 | 0/3 | 0/1 | 0/2 | tiny, flat |
| napi_create/get_string | 0/3, 0/5 | 0/3, 0/3 | 0/1, 0/3 | 0/2, 0/3 | tiny, flat |
| V8 JsonParse builtin | 0/8 | — | 0/4 | — | **−4** (measured −2.95, visible) |
| V8 JsonStringify builtin | 0/18 | — | 0/16 | — | −2 (request leg, noise) |
| SlowFlatten (publish scope) | — | — | 0/4 | — | **+4 new** (disclosed rope cost) |
| compile_system edge | 630 | 619 | 558 | 556 | −72/−63 (carries win through) |

Flame account of marshal: compile-side gross (≈ −8..−10: JsonParse −4 +
serde/napi diffuse, sub-grain per frame) minus the publish offset (+5/+8:
SlowFlatten +4 new + WriteFile +3). Net −6.7 LOO coheres. The publish
growth is marshal's disclosed cost, not a regression.

### harvest (CUT fence — all flat as designed)

| fn | r1 | r2 | 3a | 3b | Δ |
| --- | --- | --- | --- | --- | --- |
| classify_harvest_value | 2/8 | 1/12 | 1/11 | 1/12 | flat |
| collect_pool | 0/18 | 0/18 | 2/19 | 1/18 | flat (= walk_statement) |
| mint | 0/12 | 0/10 | 0/10 | 0/10 | flat (= insert + twin_key) |
| twin_key_for | 2/4 | 0/5 | 2/5 | 2/4 | flat |

### resolve (authcss BANKED + cloneplasma LAND-claim, both post-tip)

| fn | r1 | r2 | 3a | 3b | Δ |
| --- | --- | --- | --- | --- | --- |
| resolve_want_with | 3/113 | 2/109 | 3/106 | 1/96 | −7/−13 (shorthand slice) |
| resolve_token_value | 0/26 | 1/25 | 1/31 | 1/25 | flat (3b = pre; 3a-high) |
| ↳ classify leg | 10 | 6 | 8 | 12 | noisy |
| ↳ format_entry (CUT) | 5 | 5 | 6 | 3 | flat |
| ↳ lookup_entry | 4 | 7 | 5 | 3 | flat |
| css_value_from_authored | 0/11 | 1/9 | 1/10 | 1/10 | flat (authcss pending) |
| authored_key | 1/10 | 1/5 | 0/5 | 0/9 | flat (authcss/cloneplasma pending) |
| lower_when | 0/7 | 0/6 | 0/8 | 0/6 | flat (lowermemo fence) |
| expand_shorthand | 0/7 | 0/10 | 2/3 | 1/3 | **→ 3/3 residual** |
| collapse_whitespace | 0/3 | 1/1 | 0/2 | 1/3 | tiny (pending diets) |
| resolve_rhythm | 1/2 | 0/2 | 0/1 | 0/1 | tiny (rhythm fence) |

expand_shorthand residual 3/3 = single resolve + gates + ~8.6% probes.
resolve_token_value 31 in 3a is the extract-oversample (3b = 25 = pre).

### scan / sources (collect landed)

| fn | r1 | r2 | 3a | 3b | Δ |
| --- | --- | --- | --- | --- | --- |
| sources::collect | 0/36 | 1/36 | 0/20 | 0/21 | **−16/−15, rock solid** |
| collect_candidate_paths | 0/26 | 0/25 | — | — | **gone ×2** (D4 fusion) |
| backfill_dir | — | — | 0/15 | 0/16 | new (fused walk) |
| sorted_entries | 0/19 | 0/16 | 0/12 | 0/13 | −7/−3 (D1) |
| FileMatcher::matches_file | — | — | 1/4 | 0/4 | new, tiny (D2) |
| compare_components | 12/17 | 4/13 | 5/7 | 6/6 | **−10/−7** (D1) |

Boundary −15/−16 vs LOO −8.69: the flame spans the hashers-Fx-known
composition (pre base is pre-Fx) plus sort-frame reattribution; internals
overlap (candidate_paths −26 vs backfill +15 vs sorts −11) and must NOT be
summed. sorted_entries residual 12/13 = readdir + WalkEntry + file_name
compares (realloc D7 live).

### resolver / extend-path (hashers landed; extend BANKED; programsfx live)

| fn | r1 | r2 | 3a | 3b | Δ |
| --- | --- | --- | --- | --- | --- |
| resolve_file_imports | 0/34 | 0/36 | 0/24 | 0/29 | −10/−7, edge |
| Extend edge | 0/32 | 0/32 | 0/24 | 0/29 | −8/−3, edge |
| resolve_binding | 0/26 | 0/29 | 0/18 | 0/27 | mixed (3b ≈ pre) |
| ValueGraph::new | 0/23 | 0/24 | 0/22 | 0/23 | flat (setup: drops+maps+Fs) |

### extract (extract landed — win in alloc leaves, not here)

| fn | r1 | r2 | 3a | 3b | Δ |
| --- | --- | --- | --- | --- | --- |
| extract_with_context | 0/54 | 1/57 | 0/64 | 0/52 | flat (3a-high; diet was outside it) |
| walk_style_object | 1/39 | 0/45 | 0/49 | 0/38 | flat (3a-high) |
| handle_css_arg | 0/28 | 0/29 | 0/35 | 0/27 | flat (3a-high) |
| push_string_want | 1/13 | 0/17 | 0/20 | 0/18 | up-ish (+7/+1) |
| push_want | 3/12 | 0/11 | 0/18 | 0/15 | +6/+4 (line_col inside) |
| LineIndex::line_col | 1/1 | 2/2 | 9/9 | 5/5 | **reads up — new topic, see below** |
| LineIndex::for_source | 0/1 | 2/3 | 2/3 | 4/6 | up-ish (+2/+3) |
| collect_inner | 0/18 | 1/12 | 1/15 | 1/17 | flat (= walks + record_import 4) |
| collect_local_constants | 0/13 | 0/11 | 0/10 | 1/16 | flat, noisy |
| StreamedSource::collect | 0/14 | 0/10 | 0/13 | 0/17 | flat (shot2 fence) |
| ModuleRecord::collect | 0/11 | 0/9 | 0/16 | 0/10 | flat (3a-high) |
| insert_local | 0/4 | 0/1 | 0/10 | 0/6 | noisy (3a-high; 3b ≈ pre) |
| insert_var_names | 0/7 | 0/5 | 0/10 | 0/7 | noisy (3a-high) |

3a over-sampled the extract subtree (+7..+12 vs 3b across with_context,
walk_style, handle_css, push_string) while under-sampling resolver —
capture jitter in opposite directions, not mechanism. Extract's landed win
(315k clones + 3123 set builds + 19k regrows) is visible in the alloc
leaves (String::clone, do_reserve, reserve_rehash, malloc-self), exactly
as its report filed: the merge site was inline in lib.rs with no named
frame. JsxHosts: zero samples (zero-cost view, zero queries — as censused).

### assembly / recipes

| fn | r1 | r2 | 3a | 3b | Δ |
| --- | --- | --- | --- | --- | --- |
| AssembleCtx::finish | 0/242 | 0/236 | 0/218 | 0/213 | −24/−23 (carries room wins) |
| compile_one | 0/15 | 1/16 | 0/16 | 0/14 | flat (recipepath BANKED, post-tip) |
| append_recipes_layer | 0/6 | 0/6 | 0/4 | 0/6 | flat |

compile callees (r3a): finish 218 + extract_with_context 64 + hosts::resolve
32 + from_iter 27 + resolve_file_imports 24 + ValueGraph::new 22 + analyze
21 + sources::collect 20; Parser::parse 36 + pool/mint/walks make up the rest.

## Per-room delta analysis: what the sets moved, what didn't, why

Scope honesty: pre (repro1/2) predates set-2, so raw pre→post spans set-2
(−27.41) + set-3 (−41.75). Member attribution uses mechanism-level flame
evidence (caller disappearance, frame absence ×2, callee splits),
cross-checked against the filed LOO/solo numbers in integrate-set2/3.md.

- **hashers (LOO −14.49 7/8): MOVED, mechanism-verified at deepest grain.**
  sip::write 11/6 → zero samples ×2 (SipHash extinct); hash_one 20/16 →
  10/10 with Fx callees (memo::hash_value, Box-hash); reserve_rehash −3/−5.
  HashMap::insert flat (Fx runs inside the same frame — expected).
  Resolver-chain sites at noise edge (3b ≈ pre; 3a low draw) — no win
  claimed there. Remainder: Fx hash_one 10 (floor) + programs maps
  (programsfx live).
- **extract (LOO −14.53 6/8): MOVED, in alloc leaves as filed.**
  String::clone −13/−6, do_reserve −10/−10, reserve_rehash −3/−5,
  malloc/free incl −22/−10/−11/−10. No named-frame delta (merge was inline
  in lib.rs); extract_with_context flat-as-expected; JsxHosts zero samples.
  Remainder: none at this site (315k clones + 3123 builds + 19k regrows all
  gone; zero added work on this load).
- **collect (LOO −8.69 6/8): MOVED, mechanism-verified.**
  candidate_paths gone ×2 (D4), backfill +15/16 new, matches→4/4 tiny (D2),
  compare_components −10/−7 + Components::next −7/−8 (D1), dir sorts
  stable→unstable (drift/quick halved, smallsort gone, unstable +4/5).
  Boundary −15/−16 vs LOO −8.69: pre is pre-Fx (hashers-known composes in)
  plus sort reattribution. Remainder: backfill 15/16 walk itself (syscall
  + entry typing floor), sorted_entries 12/13 (realloc D7 live), matches 4.
- **proof (LOO −13.85 med / −7.66 paired-med, 7/8): MOVED, with a visible
  tradeoff.** render_with −9/−9 (prop memo + hash view, both edge-verified);
  Proof::collect NET-FLAT 13→13/14 — serialize share saved (10/5→5/6) but
  the SerialMemo probe costs hash_one 3/4 + insert 3 + MemoKey::eq (new
  frames, both captures). Flame accounts ≈ −9 direct + allocator diffusion;
  the LOO estimators straddle (−13.85 med vs −7.66 paired-med) and the flame
  supports mid-band. Remainder: render 3 (drop 2 + probe 1 — DRY); collect
  13/14 (serialize 5/6 + memo-hash 3/4 + insert 3 — LANDED ground; the probe
  cost is the honest price of the memo).
- **selpush (LOO +1.78 3/8, banked −1.76): MOVED — flame overrules the
  stopwatch.** push_char gone ×2 (D1), is_wrap gone (N3), nest −3/−3,
  push_selector −4/−3, write −4/−7, build_stylesheets −7/−5. Both captures
  agree at −5..−7 = the realistic estimate. The two ±2 ms stopwatch
  straddles were sub-noise reads of a working diet. Remainder: nest 6/7
  (split 4/3 — N1 hit only 13%; different mechanism needed, sub-bar) +
  base 1/4. DRY at whole-sync.
- **shorthand (LOO −8.48 7/8): MOVED, mechanism-verified.**
  expand 7/10 → 3/3 residual (single resolve + gates + ~8.6% probes);
  native_longhands gone ×2; find_property −16/−15 (with proof's render leg);
  resolve_want_with −7/−13. resolve_alias flat-noisy (360k killed probes
  were cheap member binary-searches — the win shows in find_property, not
  here). Remainder: expand 3 (DRY), find 12/14 (≈ census — CUT stands).
- **marshal (LOO −6.71 8/8): MOVED, both sides visible.**
  Compile-side: V8 JsonParse 8→4 (−4 = the measured −2.95) + serde/napi
  diffuse. Publish-side: +5/+8 with SlowFlatten +4 NEW — the disclosed rope
  cost, confirmed at flame grain. Net −6.7 coheres. Remainder: request leg
  (statically rejected), remaining 3.14 MB codec (inherent bytes).
- **What did NOT move and why:**
  - parse/walk/hosts/trace (flat): floor (parse) or live ground
    (programsfx on programs maps; nothing landed here).
  - analysis::analyze 21/22 + all subs (flat): analysisb live, nothing landed.
  - build_keyed/resolve_entry/serialize (flat): hashers seen_keys-Fx at edge
    (−3/−4); scalarreproof live on serialize; cloneplasma B1 LAND-claim pending.
  - css_value/authored_key/collapse (flat): authcss BANKED + cloneplasma
    LAND-claim, both post-tip.
  - mint/pool/classify (flat): harvest CUT fence, untouched as designed.
  - lower_when, format_entry, rhythm, is_length, canonical_json (flat):
    lowermemo/modgraph/rhythm/wave-1-islen/canonjson fences.
  - LineIndex::line_col reads 9/5 vs 1/2 pre with NO landed mechanism —
    3a's extract-oversample explains part; true value uncertain in a 2..9
    band. Sized as a NEW topic by mechanism (per-want binary search +
    UTF-16 tail walk), NOT by the delta — the implementing census resolves
    the true weight (falsification bar below).
  - finish_grow, Box-clone, BTree-insert, resolve_alias, is_known,
    normalize_str, push_string, record-collect: single-frame jitter
    (±5–8 documented) with 3a↔3b straddles — reported flat, never claimed.

## Ranked re-seed list (next implementor slots)

Ordered by addressable size. "Size" = post-land incl wt (≈ms).
"Track" = LAND (≥15 ms + ≥1.5% ≈ 15 ms @1000) / BANK (proven-identical
sub-bar diet into a sum) / RECON (census-first, CUT fast unless the bar
clears) / PER-PHASE (keys2-precedent bank framing + differential proof).

Excluded: all 12 landed diets' ground (improvement only with cited prior +
beating shape — none below qualifies as improvement; all are unworked
mechanisms); all 13 whole-sync CUTs (each cited); both heavy tracks
(shot2 KILL, slice1b ban); live crews' ground — realloc (DONE-BANK:
D1/D2/D7), analysisb (LIVE: analyze D1–D5), cloneplasma (DONE-LAND-claim:
R1/R2/R3/U1/B1/E1, in intclone confirm), scalarreproof (LIVE: serializer
generic-W), recipepath (DONE-BANK: recipe_selector escape-once), programsfx
(LIVE: programs-maps Fx), intclone (LIVE: cloneplasma confirm),
wantctx (LIVE: WantContext borrow diet — cloneplasma's filed follow-up,
dispatched mid-mission); set-4 banked-not-landed (authcss/extend/sysprefix
— sequence after, compose-don't-double-count).

| # | topic | size (wt≈ms) | entry file / fn | track + falsification bar |
| --- | --- | --- | --- | --- |
| 1 | LineIndex query diet (per-want line_col + per-file for_source) | 9/5 + 3/6, mech ≈ 5–9 | `diagnostics/site.rs` `LineIndex::line_col`, `for_source`; caller `extract/.../walk::push_want` 100% | BANK-track. Census: line_col calls × unit (binary search + UTF-16 tail walk). Shapes: monotonic-span resume (wants push in span order — resume, don't re-search); ASCII-fast tail (byte-len, no char decode); lazy line/col (audit consumers — resolve diagnostics only?). Fantasy 9 / realistic 3–5. CUT fast if unit × count < 5. Fences: extract crew's "semantic" note covered per-file BUILDS (cite report-swarm-extract) — queries unworked; no live crew touches site.rs. |
| 2 | push_string_want non-positional remainder | 20/18 minus T1 ≈ 8–11 | `extract/expressions/literal.rs` `push_string_want` → `walk::push_want` (grow_one 3/4 + with_origin 3/2 + malloc) | BANK-track, census-first. Site-tagged alloc census of the literal→want path EXCLUDING line_col (T1's). Fantasy 11 / realistic 2–4. SUM < 8 → CUT. Fences: T1 (position); cloneplasma E1 (when_strings move-last, LAND-claim); realloc w:stage/w:want (their site — YIELD on overlap, first LAND wins). |
| 3 | record-collect BTree audit | collect 16/10, insert_local 10/6, var_names 10/7 (3a-high; true ≈ 6–8) | `module_graph::record::collect::*`, `ExportTable::insert_local` (BTreeMap::insert 19/12, compare_components 4–5 inside) | RECON-with-bar. Exact insert census × unit microbench FIRST. Shapes (only if bar clears): Hash+sort-once IF membership-only (btreeset-method gate audit — order observed?); key-shape diet. Fantasy 8 / realistic 2–4. Fantasy < 8 → CUT. Fences: btreeset CUT (different site — cite method); manifest CUT (0/0); modgraph CUT (strip 906); hashers (record HASH maps Fx'd — BTree unworked); NO live crew. |
| 4 | ValueGraph construction audit | new 22/23 (drops 4–6 + from_iter 4–5 + AtomicFs::new 4 + maps) | `extract/resolver/*` `ValueGraph::new` (per-compile setup under `atomic::compile`) | RECON-with-bar, bundle-track. Piece census: drop ModuleRecord ×3123, map builds, Fs setup. Shapes: arena/bump record lifetime (drop-once vs drop-per-record — invasive, needs soundness design); map presize. Fantasy 12 / realistic 3–5. SUM < 8 → CUT. Fences: extend BANKED (ladder/key — compose); programsfx (programs maps — disjoint); shot2 (no skip logic — per-record WORK only). |
| 5 | scope/import-record remainder | collect_inner 15/17 minus oxc walks ≈ 6–8 (record_import 4 + attach 1–3 + clear 1–2) | `extract/scope/collect/*` (`imports::record_import`, `fold::fence_attach::attach_pure_fns`, `clear::clear_unbound_*`) | BANK-track, census-first. Per-import/per-file string census (borrowed-keys shape ONLY if String-heavy: lifetimes across phases). Fantasy 8 / realistic 2–3. SUM < 6 → CUT. Fences: extract crew rejected walk-FUSION (cite — this is borrowed-keys, different shape); hashers (shadow sets Fx); analysisb (analysis-side shadows — fence that side, scope-side only). |
| 6 | staged-file processing audit | StreamedSource::collect 13/17 + staging census | `extract/resolver/staging/*` | RECON-with-bar. Per-streamed-file work census (12,000 files): what CPU is NOT gating? Fantasy 10 / realistic 2–4 IF non-gating work ≥ 8 else CUT. Fences: shot2 KILL (no pre-open signals, no skip logic — WORK diet only, brief must carry this); parse (retained reuse — landed); programsfx (adjacent maps). |
| 7 | extract visit-dispatch audit | visit_call 48 + walk overhead (dispatch slice only) | `extract/*` visitor dispatch (`ExtractVisitor`, `origin`/`binding` Strings) | RECON-with-bar, likely-CUT. Extract crew surveyed ≈ 2 ms heroic (cite report-swarm-extract §census). Per-site ceilings with a hard bar: SUM < 8 → CUT, no build. Only a visit-LESS traversal shape (skip expression subtrees without calls — big soundness surface) revives past recon. |
| 8 | format_entry + token remainder, PER-PHASE framing | format_entry 6/3 + lookup_entry 5/3 + get_in_category 1–3 ≈ 7–9 | `resolve/tokens/*` (`format_entry`, `lookup_entry`, `TokenDictionary::get_in_category`) | PER-PHASE-bank only (keys2 precedent: ≥5 ms + ≥25% + differential proof + method reproducing flame). Whole-sync CUT stands (modgraph ceiling ~7 — cite report-swarm-modgraph). Fantasy 8 / realistic 2–3. Fences: modgraph CUT (whole-sync bar — this uses the per-phase bar); canon2 (classify — landed); rhythm (resolve_rhythm tiny — fence). |

What is NOT on this list and why (beyond the exclusion header): resolve
key/collapse/unitpx/move sites (cloneplasma LAND-claim + authcss BANKED);
builder seen_keys/serialize (B1 LAND-claim + scalarreproof live);
analysis all (analysisb live); programs maps (programsfx live);
WantContext borrow (wantctx LIVE — was this list's #4 until dispatch);
recipe selector (recipepath BANKED); cascade sort/shape (sortshape CUT);
find_property dispatch (findprop CUT — per-phase revival stays open but no
shape is filed); LineIndex builds alone (folded into #1); Vec-collect bulk
(LOG dead-ends: effects die with parents); napi/serde result-leg (marshal
LANDED, no beating shape — residual is inherent bytes).

## Dry rooms (no addressable remainder) with evidence

- **Diag render cluster — DRY.** render_fact + render_expected: zero samples
  in all four captures (r1/r2/r3a/r3b). Pushed-fact path vacuous.
- **Proof join — DRY.** render_with residual 3 = drop 2 + probe 1 (nothing
  to diet without redesigning Proof ownership); collect 13/14 = serialize
  5/6 (scalarreproof live) + memo-hash 3/4 + insert 3 (LANDED tradeoff).
- **Parse re-parse — DRY.** styletrace + identity Parser::parse callers read
  0; parse_export_map absent from every string table; parse_trace_module
  residue is walk-only (9/9).
- **Streamed transient parse — DRY-as-floor.** merge_constants_ordered zero
  samples ×4 (still inlined away); StreamedSource flat 13/17.
  Avoidance = shot2 territory, and shot2 is KILLED.
- **Cascade rank/memo/keys/sort — DRY.** rank gone (set-1); from_atom 3/2;
  sort closure 5/4; residual drift ~11 is the untouched cascade stable sort
  (sortshape CUT bars shape changes: 67/67 divergent ties).
- **Selector-push — DRY.** push_char gone ×2, is_wrap gone; nest residual
  6/7 = split 4/3 (N1 hit 13%) + member_into — sub-bar, no mechanism left.
- **Shorthand dispatch — DRY.** expand residual 3/3; longhands gone ×2;
  filed leads sub-ms (trbl pre-pass, 0-call hit paths).
- **resolve_alias miss path — DRY.** ~8 noisy; member-path redispatch ≤ ~6wt
  fantasy (wave-1 verdict stands).
- **is_length alloc — DRY.** Nothing left without the f64 grammar path.
- **Hashers — DRY.** sip extinct (zero samples ×2); residual hash_one 10 =
  Fx floor + programsfx-live programs maps.
- **Sources collect-path — DRY except realloc-live entries.** candidate_paths
  gone; matches 4/4; compares −10/−7 with a 6–7 BTree minority share;
  backfill 15/16 is syscall+typing floor; sorted_entries 12/13 is realloc D7.
- **Marshal seam — DRY.** to_napi/napi frames 1–3; request leg statically
  rejected (marshal report); residual codec is inherent bytes.
- **Whole-sync-bar CUTs stand DRY (13):** modgraph (~11–12, report-swarm-modgraph),
  manifest (0, report-swarm-manifest), lowermemo (4.3/1.2, report-swarm-lowermemo),
  sortshape (14wt + divergent ties, report-swarm-sortshape), rhythm
  (3.2/1.4, report-swarm-rhythm), asmfmt (0 calls, report-swarm-asmfmt),
  posreuse (4.8, report-swarm-posreuse), btreeset (6–9, report-swarm-btreeset),
  findprop (13.1, report-swarm-findprop), nameset (0.35, report-swarm-nameset),
  harvest (12.5, report-swarm-harvest), callermemo (8.0/combined,
  report-swarm-callermemo), canonjson (6/~1–2, report-swarm-canonjson).
  Plus keys2-memo per-phase CUT (report-swarm-keys2) and slice1b ban-CUT.
- **Heavy tracks — both dead:** shot2 KILLED (dead-file avoidance, ~190 ms);
  slice1b CUT by HQ multithreading ban (parallel compile, 100–140 ms).
- **Count correction for the captain:** the brief states 13 diets landed
  across 3 sets; the landing commits contain 12 (set-1: diag, canon2,
  cascade, parse, keys2; set-2: hashers, extract; set-3: collect, proof,
  selpush, shorthand, marshal). Flagging the off-by-one — if a 13th exists,
  it is not in the three set commits.

## Honest arithmetic for the captain (not a re-scope proposal)

Sync is ≈1000 ms against the 700 target (gap ≈ 300; warm unscored
997.4/999.7, flame 1030.9/1031.1 instrumented). Scan (≈366 flame) +
publish + config + evaluate ≈ 450 is kernel/loader floor (shot2 KILLED).
So compile ≈ 578 → ~280 (−300) is needed from diet rooms.

Ranked ceilings above (fantasy): T1 9 + T2 11 + T3 8 + T4 12 + T5 8 + T6 10
+ T7 ~4 + T8 8 ≈ **70wt at 100% fantasy (≈ 20–35 ms realistic at 30–50%
capture)**. The in-flight stack (post-tip, NOT in these captures):
cloneplasma −23.1 LAND-claim (in intclone confirm) + recipepath −13.1 BANK
+ extend ≈ −8.6 crew-sign BANK + sysprefix −1 BANK + realloc sub-noise BANK
+ analysisb/scalarreproof/programsfx/wantctx pending ≈ **45–55 ms if every
pending claim lands at filed magnitude** — with the cloneplasma⊃authcss race
adjudicated (cannot sum both: cloneplasma subsumes authcss's R1/R3/U1 per
its REPORT §Collision; authcss rebases to nothing or drops).

Even stacking everything filed + everything ranked: ≈1000 − 55 − 35 ≈ 910.
The 700 target stays unreachable on the current single-thread architecture
by ≈ 200+ ms; both heavy tracks are dead — one by measurement (shot2), one
by directive (slice1b). The contradiction (LOG's parallel-mandatory vs the
HQ ban) is flagged, not solved, here. The serial program past set-4 is
re-seeds T1–T8 (≈20–35 realistic) plus whatever analysisb/scalarreproof/
programsfx/wantctx prove — the backlog is nearly exhausted at whole-sync
bar, and the next frontier is per-phase-bank sums or a product decision
the captain (or HQ) must make.

## Verdict

**REPROFILE-COMPLETE (base 3dd32a659715 + new enterprise median ≈1000 from
warm unscored 997.4/999.7, SCORED-with-caveat: n=2 instrumented flame runs
1030.91/1031.06 RECONCILED ×2; uninstrumented multi-pair confirm is the
captain's)**

