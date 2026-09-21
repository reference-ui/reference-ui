# Fasthull recon 3 — Wave 3 map (fresh oracle crew)

Read-only map. No product edits were made (deps install + `reference-rs`
build only, to run the burndown). Three nested readers (wall/codec, RSS,
bundle) worked read-only with `/tmp` probes; every lane-carrying number
below was spot-verified firsthand by the lead (sample mining, rule-order
reads, request-shape reads) and two reader quanta were corrected inline
(§True shape, §C2).

- Lead burndown, run 1 (this tree, `deepsee all --scale enterprise`,
  seed 7): sync 2.19s, native.compile 1.56s, TS stages 630ms; RSS worker
  347.3 / parent-polled 397.1 MiB; payload 5.89 MiB; css 2,867,925 B;
  data 318,688 B; residuals 0/0.
- Lead burndown, run 2 (quieter box): sync 1.79s, native.compile 1.36s,
  TS stages 425ms; config 18.7ms (run-1 215ms confirmed cold noise);
  parent peak 396.7 (true peak reproducible); buckets within spread of
  run 1 (serde 245, assembly 326, hosts 119, prepare 341, publish 59).
  Treat the captain's quiet medians (1.66s / 308 MiB) as the levels and
  run-1 mining + run-2 buckets as the signal.
- Panda goalpost (unchanged, methodology verified identical — in-child
  `setInterval` worker, `panda-bench/measure/worker.ts:29-32`, so the
  scored comparison is fair): 645ms / 261 MiB / 2.7 MiB css.
  Remaining gap: 2.6x sync, 1.18x RSS, css AT PARITY raw (gzip SMALLER).
- Headline: the burndown buckets lie in two places (serde = file IO,
  assembly = resolver ladder — both firsthand-verified, §True shape).
  Corrected, the frontier is: native re-read of 15k files (~294ms,
  bytes already in TS memory), prepare's serial reads (~100-150ms of
  341), the trace path (B4 rides with a keep-alive ruling, −130ms
  proven), unmemoized resolver ladder probes (~109ms), and the assembly
  second resolve (upper bound ~100ms). Codec is spent (~15ms true).
  css is DONE (gate exact, slack 0 — defend it). Scored RSS (308) is
  end-state + allocator-resident, not the 397 true peak — the last RSS
  mile is a time-boxed spike, not a confident lane.

## True shape (lead-mined, seed 7, run-1 ticks × 1.379ms)

Two attribution artifacts, both verified firsthand in
`deepsee/sample-parse.ts` + `sample.txt`:

1. `serde` ≈ file IO. Rule order tries `to_string` (serde, `:77`)
   before `read_to_string` (scan/read, `:79`), so every native file
   read buckets as serde. Mined: 163 ticks
   `compile → sources::collect → scan_dir → read_to_string → __open`
   + ~40 ladder-edge reads. True serde ≈ 10ms (`format_escaped_str`,
   `Value::serialize`); V8 `JSON.parse` of 5.9 MiB ≈ 3ms (`/tmp`
   probe). The W2 "codec ≈ 390ms" was ~280ms IO + ~15ms codec then;
   now ~294ms IO + ~15ms codec. Payload shrink worked; the bucket
   never observed it.
2. `assembly` ⊃ resolver ladder. `ladder::resolve::hXXX` frames match
   the `resolve::` needle (assembly, `:86`) before the walk reaches
   any `hosts::`/`extract::` ancestor. Mined split (lead correction
   of a reader overclaim): ~79 ticks serve `ValueGraph`
   (`resolve_file_imports → BindingWalk::follow_specifier`, two
   sibling subtrees 42+37) and only ~12 serve hosts — true hosts ≈
   150ms (B4's proven −130ms is consistent with this, not with 228).

Corrected enterprise shape (≈, sums to 1756 vs run-2 1790, 2%):

| bucket (true) | ms | share |
| --- | --- | --- |
| `fragments.prepare` (TS serial reads) | 355 | 16.2% |
| native file IO (collect 294 + ladder-edge ~55) | ~348 | 15.8% |
| parse + extract + diagnostics + constants (walks) | ~493 | 22.5% |
| `assembly` (true, excl. ladder) | ~244 | 11.1% |
| `hosts` (true, incl. trace-edge ladder) | ~150 | 6.8% |
| `emit` | 70 | 3.2% |
| `publish` (all pinned-output real work) | 55 | 2.5% |
| bridge codec (true, both sides) | ~15 | 0.7% |
| napi-bucket heap (unattributed malloc churn) | ~70 | 3.2% |
| `config` | 19 | 0.9% |

RSS: scored (bench, in-child sampler, blind during the blocking
native call — `measure/worker.ts:28-31`) ≈ end-state V8 (parsed
payload + publish strings, pre-GC) + allocator-resident native pages
+ baseline 94. True peak (parent `ps` poll) 397 pre-cliff; the cliff
(−80 at `run_parse_phase` return, `lib.rs:227`) frees arenas/ASTs/
constants/graph/pool, but ~150-190 MiB of dead-but-resident pages
(maximum-allocator magazine residue, system allocator — no
`global_allocator` override in tree) persist into the scored number.
Pre-W2 peak sat at publish-end (686.5); post-W2 peak is pre-cliff —
"residual 511 → 280" compares different phases (RSS reader timeline
proof). Bottom-up at true peak: ASTs/arenas ~80-130 (fattest, ~40%),
ValueGraph staging ~20-25, extract sinks ~20-25, session facts
~10-20, TS prepare ~23, sources ~5.5, project_constants ~4-6,
identity/pool/hosts ~10-14, fragmentation/V8 slack ~20-50.

CSS: utilities 2.18 MiB (79.8%: class 1.31 + definition-side
`@container` 892 KiB/3 wraps — floor, re-confirmed: 0 selectors
emitted twice, 4 mergeable rules ≈ 173 B medium = noise),
recipes 553.5 KiB (class 307.4 + definition-side `@container` 246.0;
B1 gate EXACT — observed triples 0 vs emitted matrix 0, slack 0,
shake 23/23 called emitted, 0/65 uncalled). No css lane exists.

Data (311.2 KiB): compoundVariants 95.1 (41.6%, now fattest),
variantMap 47.7, defaultVariants 30.5, qualifiedName 20.5,
variantKeys 17.6; namer 57.9 (prefixes 36.8, aliases 12.3 —
fully consumed, no skip); stylePropNames 24.8. Data ships 3× on
disk (runtime-data.mjs + inlined in react.mjs + embedded in
baseSystem.mjs) — every data skip pays ~3×.

## What is spent

B1 (observed emission: css 15.0M → 2.87M, gate exact), B2
(publish-once: −77ms, publish 242 → 55), B3 REDUCED (css/wants/
recipe-table gating landed; plan-gating tripwire-killed 12/243 —
stays dead, no new evidence), B5 (variantMap reshape + dead-map
skip: data 518 → 311 KiB). B4 as-was superseded by C1 (keep-alive
ruling below; GAPS diff on `voyage/hyperspace-perf-2-d` reused, not
re-proposed). Slim codec: spent (~15ms true). Morning Q1
(ship-one-sheet): RETIRED — even the OOB surgery saves ~half of
~15ms. Morning Q4 (deepsee hang): LANDED (W2c ride-along). Morning
Q3 (parse streaming): narrowed — full streaming stays architecture;
bounded candidate-streaming rides C3. A10 namer (cache/watch-only):
stays a question. Do not re-propose any of these without new
evidence.

## C1 — Trace wall redux: B4 gate + parse-failure keep-alive (proven −130ms)

(a) Work skipped: 12k dead-file Oxc re-parses with fresh allocators
in styletrace (`hosts` true ≈ 150ms). B4 GAPS-proved −130ms
no-overlap (2.53 → 2.40 medians), bytes identical.

(b) Lever: sync −130ms enterprise. RSS no claim. Zero byte change.

(c) Evidence + SITE-57 RULING (lead, firsthand — option (a)
plumbing, NOT renegotiation): main phase already reports
`Broken.tsx` as `Diagnostic::error(ParseError)` (`lib.rs:323-344`)
and the `parsed` vector is in scope at the `hosts::resolve` call
(`lib.rs:169`); `entry_paths` sees only `(path, content)` because
`resolve(request, sources, sink)` never receives it
(`hosts/mod.rs:58-70`). Lane D's "out-of-boundary" was its own
fence, not voyage OOB — the W3 boundary simply includes
`hosts/mod.rs` + `entries.rs` + the `lib.rs` call site. Fix shape:
`Vec<bool>` failed flags (any main-phase error incl. non-panicked)
→ failed entries kept → styletrace re-parse fails identically →
same located warning, station byte-identical; bench load (zero
parse errors) gates all 12k dead. Soundness homework found by
lead: styletrace's parser (`parser/mod.rs:63`) is the ONLY Oxc site
in the workspace WITHOUT `.with_typescript(true)` (9 sites have
it) — a needle-free `.js` file with TS syntax passes main but
fails trace today, so keep-alive needs the SourceType aligned
(share the options helper; staged bytes already identical).
`collect_hosts` has zero source callers (dead `pub fn`) — signature
change is free. Reuse the GAPS diff (`entries.rs` + 4 unit tests +
`trace_gate.rs` lemmas) + add keep-alive + a needle-free-
unparsable fixture + a `.js`-with-TS-syntax fixture.

(d) Disjointness: `hosts/{entries,mod}.rs` + `lib.rs` call-site
hunk (flag vs C3's staging hunk — different regions) + styletrace
`parser/mod.rs` options + styletrace tests. C2 touches
styletrace `module_resolution.rs`/`source_files.rs` (different
files — flag at merge) and serves live-edge resolution, which dead
entries never reach: zero mechanism overlap. Untouched:
`extract/*`, `assembly/*`, `sync/*`, `recipes/*`, bridge.

(e) Out-of-bounds check: clean. Same entries traced modulo
provably-untraceable + parse-failed; same diagnostics incl.
SITE-57; no harvest/load/emission change; walk-cost scrape.

## C2 — Memoize the resolver ladder + serve edge reads from staged (←~109ms)

(a) Work skipped: unmemoized specifier-ladder disk probes
(`is_file` + `read_to_string` per edge) across ~3k live files'
imports, recomputed per edge with a fresh `DiskFs`+ladder; plus
edge-target re-reads from disk despite staged contents.

(b) Lever: sync ≈ −100-130ms enterprise (79 resolver ticks ≈
109ms + ~12 trace-edge ticks + 34 edge-read ticks ≈ 47ms;
quantify in-lane — the 34 reads overlap the IO bucket, not
additive with C3's 294). True-peak RSS dips (fewer transient
arenas/strings). Zero byte change.

(c) Evidence (lead-verified stacks, reader-verified sites): 42+37
sibling `ladder::resolve` subtrees under
`ValueGraph::resolve_file_imports → BindingWalk::follow_specifier`
(sample tree); `AtomicFs::read_to_string → DiskFs → open` 34t in
the same subtree; fresh `DiskFs`+`SpecifierLadder` per call
(`styletrace/.../module_resolution.rs:44-52`), unmemoized probes
(`ladder/probe.rs:54-107`, `ladder/mod.rs:86-195`),
`source_files.rs:12,72`. Dead files have no imports, so no ladder
call serves a B4-gated entry — mechanism-disjoint from C1.
Fix shape: per-compile probe memo (path → hit/miss) shared across
both masters + `AtomicFs`/edge reads served from the staged
contents map first (W1 staged-content precedent), disk fallback
only outside the compile set.

(d) Disjointness: `module-graph/ladder/*` + `module-graph/key`
(if touched) + `extract/resolver/source.rs` (`AtomicFs`) +
styletrace `module_resolution.rs`/`source_files.rs`. Different
files from C1 (flag same-crate); no overlap with C3 (no scan/
request/parse-loop files), C4 (no assembly/builder), C5.

(e) Out-of-bounds check: clean. Pure memoization — same
resolutions, same bytes, same diagnostics; no load change.

## C3 — Single read: parallel TS scan, share contents, stream candidates (←~400ms)

(a) Work skipped: (i) native re-read of all 15.1k files (~294ms
open+read syscalls, 4.16 MiB — bytes TS prepare already holds);
(ii) 12k candidate files' co-resident arenas/ASTs + staging
(constants ×2, ValueGraph bags, ModuleRecords, identity) +
W1/W2/record/identity walks; (iii) serial-TS-read slack (~100-
150ms of prepare's 341).

(b) Lever: sync ≈ −350-450ms enterprise (native IO ~294 +
TS-read parallelism ~100-150 + candidate walks; prove the walk
split in-lane). True-peak RSS −40-60 MiB (12k arenas/bags never
co-resident). Scored-RSS carry UNCERTAIN (only via less magazine
residue — measure, don't promise). Zero byte change (same bytes
parsed, same diagnostics incl. parse errors — see homework).

(c) Evidence (lead-verified premises): `sync()` passes roots+
globs, "no virtual mirror" (`sync/index.ts:99-108`), while
`request.files: VirtualSource[]` exists but is unused
(`types.rs:19-22`, `js/types.ts:60`) and `sources::collect`
already prefers it (`sources.rs:22-28`). Mined IO: 163t
`scan_dir → read_to_string → open` + 50t collect frames ≈ 294ms;
TS medium split (reader `/tmp` probe): fg 8.4ms + serial reads
24.4ms of 44ms prepare; `uv__fs_work` 240t ≈ 331ms. Census
(reader): 12,000 dead of 15,122 files, 0 importers of `util/`,
1 scalar (`FACTOR_n`) per dead file; dead staging ≈ 11 MiB
(project 2.4 + bags 3 + records 6). Fix shape, sequenced
in-lane: (1) `fg.async` + bounded-concurrency reads, order-
preserving (eval concatenates in scan order,
`fragments/base/index.ts:199-201`; `mergeRecordFragments`
later-wins, `:316-323` — collect indexed, restore `fg` order;
null-skip on read error preserved); (2) retain contents +
candidate flags (12k path list or scan-order bitset) into
`request.files`; native skips scan+read entirely; (3) candidates
parse streaming (per-file scope: keep errors, drop AST) + skip
constants-merge/staging/record/identity for proven-sterile.
(d) Soundness homework (architect rules BEFORE step 2-3):
(i) prepare-scan ≡ native-scan set proof (or union handling —
native must still reach files prepare never read);
(ii) parse-error preservation — `report_parse_errors` covers ALL
files today and Broken.tsx proves needle-free files can carry
reported errors: recommended shape is streaming-parse-keeps-
errors (same errors, no retention); skipping error reporting
needs a ParseError-channel audit + proof-station review instead;
(iii) sterile ⇒ unimported, proven per-repo (not per-file) via
ModuleRecords + no-importer census pattern — load-bearing
origin is the unbound-name fallback (`scope/lookup.rs:45`,
wired `lib.rs:376`): gate-wrong = silent value miss, no
diagnostic; pin stations: scope/resolver fallback tests +
contracts + `trace_binding_terminal` barrel chains +
tsconfig-paths; (iv) published `compile-request.json`
(`sync/index.ts:126-130`) stays LOGICAL — exclude `files`, or
the lane regrows the artifact by megabytes and fails review.
Sharing also makes TS/native see identical bytes (strictly more
consistent than today's mid-sync race).

(d2) Disjointness: `fragments/lib/scanner.ts` +
`fragments/base/index.ts` + `sync/index.ts` (request assembly
hunk) + contracts request section (flag vs C5's types section)
+ `sources.rs` + `lib.rs` parse-loop/staging hunks (flag vs
C1's call-site hunk — different regions) +
`extract/resolver/mod.rs` (`ValueGraph::new`) +
`extract/constants/collect.rs`. No overlap with C2 (ladder/
AtomicFs serve live edges, which are never candidates), C4
(assembly/builder), C5 (table/recipe.ts).

(e) Out-of-bounds check: clean. Same file set, same bytes, same
parses (modulo retention), same diagnostics; ordering and
error semantics preserved; no generator/scale/config change —
read plumbing, not load weakening.

## C4 — Assembly second-resolve dedup (upper bound ~100ms, prove-then-scrape)

(a) Work skipped: resolving every authored declaration twice —
`build_atom_set` (`assembly.rs:141-161`) resolves every want,
then `PlanBuilder::build` (`runtime/builder.rs:133-157`)
re-resolves every authored decl (`resolve_entry`, `:159-195`)
with per-decl canonicalize + `to_string` (`serializer.rs:10-31`)
and unconditional per-want `atom_value_to_json`
(`resolve/mod.rs:96-110`, called `:133`).

(b) Lever: sync upper bound ~100ms enterprise (assembly true
≈ 244ms; mined split: `AssembleCtx::finish` subtree 61t,
`resolve_want_with` 39t both passes, `resolve_token_value`
17t, `expand_border` 14t; `canonical_json_value` +
`lookup_key` ≈ 19t leak into diagnostics bucket). No byte
change. No RSS claim (below peak).

(c) Evidence: sample stacks show `PlanBuilder::build →
resolve_with_unique_diagnostics → resolve_want_with × N +
expand_shorthand + resolve_token_value` with `canon::resolve_alias`
+ `memcmp` leaves (lead-read); `builder.rs:296-303`
clone+collect visible; `NamerTables::for_system` +
`get_style_prop_names` rebuilt every compile (`plan.rs:141-155`,
pure waste, micro — EXCLUDED from this lane, rides C5 as a
same-file piggyback). Architect gate (binding): in-lane
timers split the 244ms FIRST; implement iff a ≥30ms sub-step
is proven redundant; else kill fast with the timers filed as
evidence. (Needs the attribution pre-fix to see itself —
see captain note.)

(d) Disjointness: `assembly.rs` + `runtime/builder.rs` +
`resolve/mod.rs` + `resolve/*` (shorthands/tokens) +
`runtime/serializer.rs`. No overlap with C1/C2 (trace/
resolver), C3 (scan/request/parse-loop — assembly owns the
post-parse region), C5 (`table.rs`/`plan.rs` serde — the
`plan.rs` micro is C5's, explicitly).

(e) Out-of-bounds check: clean. Same resolutions, memoized or
single-passed; no harvest/load/emission change.

## C5 — Data reshape: unexpanded compounds + drop dup fields (−106 KiB data)

(a) Work skipped: shipping (i) 440 expanded `compoundVariants`
records (`{selection, className}` per single value — 26%
exact dupes at medium from generator authoring, 46/176
records) instead of unexpanded `{predicates: {axis:
[values]}}`; (ii) `qualifiedName` (== map key 88/88) and
`variantKeys` (== `Object.keys(variantMap)` 88/88) — pure
dupes of shipped keys.

(b) Lever: `runtime-data.mjs` 311 → ~205 KiB (−34%: compounds
95.1 → ~36 = −59; fields 38.1 → 0; + `defaultVariants`
values→indices minor −9), ~−300 KiB published disk (3×
multiplier). css byte-identical (emitter untouched). Sync/RSS:
noise-level (bridge −106 KiB). Piggyback: `plan.rs:141-155`
style-prop const-cache micro (same file, zero marginal cost).

(c) Evidence (reader `/tmp` probes, medium→ent scaling):
expansion at `table.rs:111-123`, shape `plan.rs:35-38`;
reshape probed medium 16902 → 6370 B (−62%) ⇒ ent −59 KiB;
exact for all cases incl. multi-value (`compound_class` +
`compound_matches` (`table.rs:201`) ported to `recipe.ts`;
JSON key order preserves IndexMap authored order;
`["true"]→key` special case ports). Bench has NO multi-value
predicates (0 shared-class/different-selection) — the W2
"not invertible" verdict dissolves under the reshape (the
non-invertible bit was the expansion, which the reshape
removes). Consumers: `recipe.ts:229` compose only; contract
`contracts/types.ts:67`; `NEO-RECIPE-04` asserts `length===1`
(single-compound world unaffected). qualifiedName consumers
`recipe.ts:179,221` → lookup key; variantKeys consumers
`:199,223` → `Object.keys`. Spec blast radius: 2-3 asserts
(`identity.spec.ts:43` stem, `defaults.spec.ts:58` axis
ORDER — preserved, same source order) + contract shape
updates à la lane d. `defaultVariants` KEEP as data (authored
which-is-default); values→indices re-encode only.

(d) Disjointness: `recipes/table.rs` + `runtime/plan.rs` +
`reference-neo/src/runtime/recipe/recipe.ts` +
`contracts/types.ts` (+ `sync/publish/system.ts` portable
type mirror — shape-only). No overlap with C1-C4 (wall lanes
touch no table/recipe.ts/contract-shape files; C4's `plan.rs`
micro explicitly rides here).

(e) Out-of-bounds check: clean. Same resolved classes
(derivation reproduces compiler strings exactly — crew
proves with lane-d-style exhaustive E2E recompute);
closed classes stay; emitter untouched; css identical;
paint + stations hold.

## Spike S1 — End-state retention (time-boxed, kill-fast)

The scored-RSS gap (308 → 261, 47 MiB) has NO confident lane:
scored = baseline 94 + ~150-190 dead-resident native pages +
~30-50 V8 end-state + live. Pre-cliff trims (C3's −40-60 MiB
true-peak) carry into scored ONLY via less magazine residue —
measure, don't promise. S1 is a time-boxed spike, not a
verification lane: (i) attribute V8 end-state (heap snapshot
at `rssAfter`: parsed result, publish transients, prepare
+23 MiB holders — if an explicit structure, clear
post-consume; if uncollected garbage, needs GC = unavailable,
kill); (ii) allocator-residue experiment (drop-order,
magazine pressure, dedicated-heap sketch — moves scored iff
pages return to OS; platform-gated sketches allowed as
probes, product must stay portable). Kill-fast: no ≥10 MiB
BENCH-scored movement by mid-wave → file the attribution and
die. If S1 fails, the last RSS mile is a morning question
(allocator strategy is product architecture — see below),
and W3 still lands its ~2/3 wall close.

## Killed / deferred (with the floor bound)

- Ship-one-sheet (ex-morning Q1): RETIRED — true codec ~15ms;
  dual-sheet surgery would save ~half. Dead at any price.
- serde-flat question: EXPLAINED (IO misattribution), not a lane.
- config 215ms (run-1): cold-noise (esbuild spawn + DLOpen),
  run-2 18.7ms — killed, not a lane.
- napi-bridge 51ms: unattributed heap churn under the entry,
  not bridge cost — no lane (re-check after attribution fix).
- B3 plan-gating: stays dead (12/243 tripwire, no new evidence).
- Utilities 2.18 MiB: floor re-confirmed (0 dup selectors;
  ~173 B medium mergeable = noise; cross-wrap dupes differ in
  conditions — unmergeable). Namer changes OOB. No scrape.
- B1 slack hunt: gate exact, slack 0, shake exact — css DONE.
  Any lane that regrows the sheet fails review on sight.
- Namer 57.9 KiB (A10): fully consumed (every subtable read
  via `name()`; overrides live), scale-invariant, static maps
  ARE the rules (`canon/lib.rs:45-52`); census-prune is
  load-weakening-adjacent. No skip. A10 stays a watch-mode-only
  question.
- defaultVariants-as-data: KEEP (authored); values→indices only.
- GC lever (`--expose-gc`/forced collection): killed — harness
  change = measurement gaming, and V8 won't release without
  pressure anyway. Bench worker already drops `sync()`'s return
  (`worker.ts:35`) — end-state is garbage + live, no handle.
- Full parse-phase streaming: stays architecture (ValueGraph
  borrows all programs, `collect_pool` over all programs).
  Bounded candidate-streaming rides C3; reframe after.
- Fragments.evaluate 5.7ms, base-system ~4ms: noise, no lanes.
- Publish 55ms: all pinned-output real work (react esbuild
  bundle, pretty JSONs, typegen, symlinks) — no lane.
- `sources` 5.5MB whole-compile hold: below spike threshold;
  S1 may clear if explicit, no lane.

## Morning questions (updated)

1. Scored-RSS floor (NEW): if spike S1 fails, ~150-190 MiB
   allocator-resident + ~30-50 V8 end-state is product
   architecture (global allocator choice, V8 GC timing) — needs
   an HQ ruling, not a night crew. (Retires ex-Q1 ship-one-
   sheet, answered.)
2. A10 namer cache: still watch-mode-only, never one-shot. Stays.
3. Residual streaming: after C3's candidate-streaming, is the
   remaining co-residency (live 3k parses + ValueGraph) worth a
   phase-architecture ruling? Re-ask with C3's numbers.
4. True-vs-scored (NOTE, not a question): Panda's 261 ≈ true
   peak (no native window); Neo's 397 true vs 308 scored. The
   voyage scores bench methodology (fair — identical workers),
   but 397 → 261 true-peak parity is the honest longer arc.

## Lane plan for Wave 3 (captain decides; recommendation: 5 crews + 1 spike)

- perf-3-a "single read" (C3): parallel TS scan + `request.files`
  share + candidate streaming. Biggest lane (~400ms + true-RSS
  −40-60M). Architect rules the 4 homework items BEFORE steps
  2-3 (set-equality, parse-error shape, sterile soundness,
  logical request-json). Churn: RUN (parse/staging-adjacent).
- perf-3-b "trace wall" (C1): B4 GAPS diff + keep-alive +
  SourceType align. Proven −130. Re-proof: SITE-57 + 2 new
  fixtures. Churn: RUN (trace-adjacent; cheap).
- perf-3-c "ladder memo" (C2): probe memo + staged edge reads.
  ~100-130ms. Churn: RUN (resolver-adjacent).
- perf-3-d "assembly resolve" (C4): timers-first, ≥30ms gate,
  then dedup. Upper ~100. Churn: RUN (resolve-adjacent).
- perf-3-e "data reshape" (C5): compounds + field drops +
  plan.rs micro. −106 KiB data, css identical. Churn: RUN
  (recipe-adjacent, contract shape).
- spike-s1 "end-state retention" (S1): V8 attribution + trim,
  allocator experiment. Kill-fast ≤10MB scored. No merge
  pressure; files the attribution either way.

If the box allows 4 only: cut C4 (softest lever, timers may
kill it day-0) — C3+C1+C2+C5 carry ~600ms + bytes.

Shared-file summary: `lib.rs` (C1 call-site hunk vs C3
parse-loop/staging hunks — different regions, flag); styletrace
(C1 `parser/mod.rs`+tests vs C2 `module_resolution.rs`+
`source_files.rs` — different files, flag); contracts (C3
request section vs C5 types section — different sections,
flag); `plan.rs` (C5 owns incl. the const-cache micro; C4
explicitly excludes). Merge order: c → b → a → d → e
(ladder-memo deepest first; trace second; single-read third;
assembly fourth; data contract-shape last, W1-d precedent).
Re-measure combined after each merge — C1+C2 share the trace
runtime (mechanism-disjoint, still re-prove), C3 moves the IO
floor under everyone.

CAPTAIN PRE-FIX (tooling-only, main line, before cutting
lanes): `deepsee/sample-parse.ts` — (i) move the scan/read
rule above serde, or narrow serde's `to_string` to exclude
`read_to_string`/`to_string::inner` paths (~290ms currently
misbucketed); (ii) narrow assembly's `resolve::` so
`ladder::resolve` buckets to its caller path (~90ms). Five
lines, zero engine impact, W1e precedent — C4's day-0
architect gate cannot see the true 244ms assembly split
without it. Alternatively attach as a fenced ride-along to
lane d (W2c precedent).

Projected close (all land, quiet scale): sync 1.66s → ~0.95s
(~2/3 of the remaining 1.0s wall gap; the rest is live-file
extract physics — parse/extract/diag/const ≈ 400ms, the W4
frontier), scored RSS via spike + side effects (no promise),
data 311 → ~205 KiB, css defended at 2.7 MiB.

Wave 3 recon: COMPLETE — map filed, 5 avenues + 1 spike, next crews:
perf-3-a (C3), perf-3-b (C1), perf-3-c (C2), perf-3-d (C4), perf-3-e (C5), spike-s1 (S1)
