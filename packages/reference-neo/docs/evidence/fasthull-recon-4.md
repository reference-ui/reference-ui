# Fasthull recon 4 — Wave 4 map (fresh oracle crew)

Read-only map. No product edits were made (deps install + `reference-rs`
build only, to run the burndown). Lead-mined two enterprise burndowns plus
`/tmp` probes (sample miner, prepare split, heap live/garbage splits); every
lane-carrying number and code cite below is firsthand in this tree.

HQ amendment binds this map: SPEED is the frontier; RSS is HELD (guardrail
— a real regression fails, GC-noise does not block); bundle is HOME
(css/data must not grow a byte — defended exact). Hence: four sync-wall
lanes as the main body, one RSS hunter, ZERO bundle lanes.

- Lead burndown, run 1 (this tree, `deepsee all --scale enterprise`,
  seed 7): sync 1.80s, native.compile 1.15s, TS stages 652ms
  (config 220 cold-noise, prepare 378, publish 49); RSS worker 368.1 /
  parent 368.1 MiB; payload 5.79 MiB; css 2,867,925 B; data 214,466 B;
  residuals 0/0.
- Lead burndown, run 2 (quieter box): sync 1.50s, native.compile 980ms,
  TS stages 517ms (config 79 cooling, prepare 383, publish 53);
  cross-check Δ −0.1ms (perfect reconcile); buckets within spread of
  run 1. Treat the captain's quiet medians (1.31s / 344.5 MiB) as the
  levels and the two runs' shares as the signal (quiet scale ≈ 0.87×).
- Panda goalpost (unchanged): 645ms / 261 MiB / 2.7 MiB css.
  Remaining gap: 2.0x sync (THE frontier), 1.32x RSS (hold + one
  hunter), bundle HOME (css parity raw, gzip smaller; total 2.9 vs 2.8).
- Headline: the wall is now five mid-size rooms, not one hall —
  per-want line/col scans (~40ms), the plan pass (~65-110ms, tiered),
  the native union re-stat (~50-90ms, gated), resolver staging
  (~30-40ms, gated) — plus prepare reads (~283ms, syscall floor) and
  parse/emit/walk physics. The C4 pairing handoff is SUBSUMED (D2 kills
  the rewant more thoroughly on the measured path — pairing retired,
  GAPS diff stays preserved-as-evidence). The RSS hunter is the
  retained-array streaming follow-up (~10-12MB, structural).

## Fresh burndown shares (both runs, seed 7)

Exact stages: prepare 378/383ms (fattest single stage — ReadFile
~324ms sampled), native.compile 1150/980, publish 49/53, config
220/79 (cold noise, run-2 cooling toward the ~19ms floor), evaluate
6/3.

Sampled native (run1/run2 ticks, ×1.38/×1.26ms): assembly 172/182,
extract 119/129, diagnostics 126/122, scan/read 105/103, napi-bridge
136/101 (malloc/free/madvise/hashbrown leaves under the entry — the
unattributed churn of the lanes' work, no lane), constants 119/98,
parse 98/97, emit 79/72, hosts 39/42, serde 25/30 (true codec, spent),
base-system 6/4.

Mined inclusive weights (run 1, lead `/tmp` miner): `ReadFile` 234t
(prepare reads), `resolve_want_with` 113t (both passes),
`PlanBuilder::build` 91t (rewant 42 + class_name 11 + atom inserts
11 + serialize_lookup_key 9 + derive_slot 6), `sources::collect` 68t
(is_dir stat 33t + matches_file 12t + sort/clones), `extract_with_
context` 76t, `render_session` 37t + `partition` 18t (lookup_key 14t,
BTreeSet collect 10t, render_fact 18t = render_expected 14t +
line_col 4t), `line_col` 33t (27t under `push_want`, O(offset) scan
from file start per want), `ValueGraph::resolve_file_imports` 30t
(BindingWalk follow_edge 24t) + `ValueGraph::new` 20t + drops 17t,
`collect_pool` 28t (pure walk_statement traversal) + `mint` 10t,
`build_stylesheets_with` 55t (write_utilities 45t),
`hosts::resolve` 40t, `ModuleRecord::collect` 17t. Run 2 agrees
(line_col 26t, render_session shape, collect 58/7/1 sites).

RSS: peak pre-cliff at native.compile (357/353, publish 345/341);
prepare boundary +54.5/+56.1 (C3 retention live inside); residual
252/247 MiB, 17.1/16.7 KiB/file (was 34.6 — C3 streaming worked).

## What is spent

C1 (trace gate + keep-alive: hosts 150 → ~40), C2 (ladder memo:
resolver 124t → 75t, stat/read leaves eliminated), C3 (single read:
native re-read 294 → ~10, read_to_string 7t; serial reads proven,
parallel GAPS-1/F1), C5 (data 311 → 209 KiB). S1 (V8 end-state
GC-only, allocator relief unverifiable — memo landed; GC-timing
moves are UNAVAILABLE, stated once here and not proposed again).
C4 memo as-built stays GAPS (churn-breach structural); C4's
*pairing handoff* is newly SUBSUMED by D2 below (retired with cause,
diff preserved). B3 plan-gating stays dead (12/243 mechanism is
load-real — D2 is a new shape, not a re-proposal; see §D2).
B1/B2/B5, A-series, ship-one-sheet (retired), serde-flat
(explained), config-noise, A10 watch-only: all spent/killed, do not
re-propose without new evidence.

## D1 — Want-site locations: lazy per-file line index (~35ms)

(a) Work skipped: an O(offset) source scan from file start for EVERY
want's line/col (`diagnostics/site.rs:120-125`: prefix filter for
`\n` + rsplit + UTF-16 tail walk), computed eagerly in
`ExpressionWalk::push_want` (`walk/mod.rs:80-83`) whether any
diagnostic ever cites the want or not. 7,527 calls → tens of
thousands of wants × mean-half-file scans.

(b) Lever: sync ~35ms enterprise (line_col 33t ≈ 46ms run 1, 26t
run 2; 27t under push_want; index build ~2-3ms). RSS: unregressed
(index is transient per file; laziness builds it only for the ~3k
files that push wants — the 12k streamed dead never pay). Zero byte
change (identical line/col by construction).

(c) Evidence: mined parents — 27/33t via
`push_string_want → ExpressionWalk::push_want`; code-read the scan
(firsthand); `span_position` takes `self.source` already, so the
index derives from the same bytes. Fix shape: line-start table per
file built LAZILY on first `span_position` call
(`line_starts: OnceVec<u32>`-style field on `ExpressionWalk`),
binary search per want, UTF-16 tail walk kept as-is for the column;
past-end → None preserved. Piggyback if clean: the same index for
`object/mod.rs:119` (same file) and `render_fact`'s line_col 4t
(`channels/render.rs`, one site — flag vs D2-step-3, different
lines). The remaining ~6t of small sites (constants, spreads,
recipes, jsx, stream) ride W5, not this lane.

(d) Disjointness: `diagnostics/site.rs` (index + lookup) +
`extract/expressions/walk/mod.rs` (field + span_position) +
constructor hunks at `extract/mod.rs:280` + `extract/expressions/
object/mod.rs:72` (+ optional `channels/render.rs` one-liner).
Untouched: `builder.rs`, `assembly.rs`, `sources.rs`,
`resolver/*`, `stream.rs`, bridge, TS. D4 touches none of these
files; D2-step-3 touches `policy/analysis.rs` + `facts.rs`
(different files — the render.rs piggyback flags at merge only).

(e) Out-of-bounds check: clean. Same line/col numbers from the same
bytes (index ≡ scan — crew proves with the existing
`line_col_*` unit tests + a differential fuzz over offsets);
no harvest/load/emission change; pure algorithm swap.
Guardrails: RSS unregressed-by-design (transient, lazily built);
bundle exact (locations never ship in css/data; diagnostics bytes
gated by the 243-sweep + bench).

## D2 — Plan-pass verdict diet: tiered (≥50ms safe, up to ~110ms gated)

(a) Work skipped: `PlanBuilder::build` (91t ≈ 126/115ms) re-resolves
every authored decl (rewant 42t ≈ 58ms — the C4-proven redundancy),
then computes per-atom class names (11t), slots (6t), and atom-set
inserts (11t) whose results NOTHING reads on the default path:
`OwnedLookupKey::from(plan)` (`proof/plans.rs:14-24`) takes only
(system, when, prop, value, important) — declarations ignored —
and in-compile readers of plans are render_session only (W2b grep,
still true). Plus render-side re-canonicalization of the same keys
(lookup_key 14t) and per-fact expected-key canonicalization
(~9t: serialize_value 5t + lookup_key 4t + format 3t).

(b) Lever: sync tiered — (A) placeholder declarations + carried
canonical keys + fact-key memo ≈ 50-65ms, verdicts-identical-BY-
CONSTRUCTION, lands always; (B) full keys-only with per-decl
nonempty predicate ≈ +40ms more, gated on the predicate proof +
243-sweep tripwire (else the lane lands (A) only). RSS:
unregressed (fewer transient atoms/strings; proof path unchanged).
Zero byte change (A: verdicts identical by construction; B: swept).

(c) Evidence + tiers (lead-read `builder.rs:132-195`,
`proof/plans.rs`, `proof/render.rs:24-64`, `channels/render.rs`):
`build()` pushes a plan iff `!declarations.is_empty()` — so (B)'s
predicate must reproduce the emptiness verdict (convert-refusal +
zero-atom resolve + array/object all-skip) WITHOUT resolving; the
lane proves the ⟺ per shape (scalar/array/object/$r/$token,
`is_known_style_prop` hoist as the cheap leg) and re-proves the
W2b tripwire (243-case proof-off diagnostics sweep, zero deltas;
cargo diagnostics asserts unchanged; bench bytes cmp-clean).
(A) needs no load-dependent proof: resolve runs, the emptiness
gate runs, only per-atom class/slot strings go placeholder
(provably unread: plans dropped on !proof + keys ignore
declarations) and canonical keys compute once and ride along
(same strings, same authority). Insert-skip (+15ms) is (A)-optional,
gated on the subset proof (plan atoms ⊆ want atoms —
`site_plan_tests` class-subset + AtomSet no-op-insert order
argument + css byte-identity on all scales + churn).
C4-pairing RETIRED with cause: (A) keeps resolve (verdicts safe),
(B) kills rewant on the measured path entirely — pairing would
serve only the proof path, unmeasurable by bench, so no crew
builds it. Deepsee measures !proof (worker-phases replicates
sync's `logs: config.logs`, unset in bench) — D2's win shows in
both deepsee and bench. Churn MUST run (44k wants: expect the
win to grow; cheap-hex direction is safe).

(d) Disjointness: `runtime/builder.rs` + `assembly.rs` (key-plan
gate + `style_plans` field gate — field stays `Vec`, empty on
!proof à la B3 wants-gate) + `diagnostics/proof/plans.rs` +
`diagnostics/proof/render.rs` + `diagnostics/facts.rs` +
`diagnostics/policy/analysis.rs` (key-carry + fact memo).
Untouched: `site.rs`, `walk/*`, `sources.rs`, `resolver/*`,
`stream.rs`, bridge, TS. No shared files with D1/D3/D4/R1
(D1's render.rs one-liner flags only if both land hunks there —
different lines).

(e) Out-of-bounds check: clean. Verdicts identical (A by
construction, B by predicate-proof + tripwire); proof channel
restores full plans (existing `logs:['proof']` contract +
harness precedent `gates.rs request_for`); no harvest/load/
emission change; css/data bytes gated exact.
Guardrails: RSS unregressed-by-design (strictly less
materialization); bundle exact (no emitter touch; diagnostics
bytes swept).

## D3 — Trust-staged union: kill the native re-walk (~40-90ms, gated)

(a) Work skipped: `union_sources` (`sources.rs:75-97`) re-walks the
entire tree on every compile to backfill what the staged list
"might miss": `collect_candidate_paths` (full recursive walk,
`path.is_dir()` STAT per entry — 33t ≈ 46ms pure syscalls),
a HashSet of 15k cloned paths (hash + alloc × 15k), a second
`matches_file` round, and double path clones — to discover ZERO
missing files on the locked load (TS retention already holds the
full in-scope set).

(b) Lever: sync (a) ~60-70ms (skip walk + known-set + backfill
when `files_complete`, keep `filter_virtual_sources` as the
safety) or (c) ~40ms fallback (`DirEntry::file_type()` instead
of `is_dir()`, symlink → `is_dir()` fallback — same decisions,
no stats). RSS: unregressed (fewer transient paths/sets).
Zero byte change (same set, same bytes, same sort).

(c) Evidence: collect 68t ≈ 94ms; run-2 scan/read leaves are
`stat$INODE64` 29t + `getdirentries` 6t + path-compare 5t;
backfill loop reads 0 files (read_to_string 7t ≈ gone — C3
worked, the walk is pure belt-and-braces). Fix shape, architect
RULES FIRST: prove native-scan-hit ⊆ TS-retention on (dotfiles,
d.ts, symlinked dirs, permission errors, mid-sync races, sort
order, case-insensitive) — the scanner ALREADY mirrors native
(IGNORE set, extensions, dot:false emulation, d.ts rule,
`scanner.ts:99-206`) and GAPS-2 fought the subtleties, so the
proof is enumerative, not speculative. New request flag
`files_complete: bool` (C3's mirror file list: `types.rs` +
`atomic/js/types.ts` + `sync/native.ts` + fixture; set in
`sync/index.ts` request assembly, one line) enables the skip;
flag-off keeps today's union (files-only callers, proof tests
unchanged). If ANY enumeration case is unprovable → land (c)
instead (same file, zero proof burden: file_type ≡ is_dir
modulo symlink-to-dir, handled by fallback). Churn MUST run
(6k-file walk: safe direction, walk scales with files).

(d) Disjointness: `sources.rs` + `types.rs` (flag) +
`atomic/js/types.ts` + `sync/native.ts` + `sync/index.ts`
(one-line request hunk) + fixture. Untouched: everything else
RS; TS scanner untouched (retention as-is). FLAG at merge:
R1 rewrites the `sync/index.ts` call region (chunk
orchestration) — D3's one-liner sits in the same literal;
sequence D3 first, R1 rebases (or R1 carries the flag per
chunk — crews coordinate via the map, captain sequences).

(e) Out-of-bounds check: clean. Same file set (proven superset
+ kept filter), same bytes, same order; no glob-equivalence
claim (native `matches_file` still filters staged files —
deliberately kept); no load change; read plumbing, not
weakening. GAPS-2's match-before-filter semantics untouched.
Guardrails: RSS unregressed-by-design (fewer transients);
bundle exact (file-set identity gated by bench bytes + the
union unit tests `disk_scan_pins_the_tricky_set` /
`provided_union_matches_the_disk_scan`, extended).

## D4 — Resolver staging gate: unstage the unimported (~30-40ms, gated)

(a) Work skipped: `ValueGraph::new` stages `(ModuleRecord,
LocalConstants)` for ALL 15.1k files (`resolver/mod.rs:126-139`)
plus per-file `ModuleKey` hashing and staged-map inserts, and
the whole graph is dropped at phase end — while the bench's 12k
dead files have no imports and no importers (recon-3 census),
so no `BindingWalk` ever targets them, no refinement ever
demands them, and their only load-bearing contribution (the
`FACTOR_n` scalar merge into `project_constants` for the
unbound-name fallback, `scope/lookup.rs:45`) survives without
staging.

(b) Lever: sync ~30-40ms (new 20t + drop ~15t for the 80%
unstaged; records still collected for the census). True-peak
RSS −5-8MB (unstaged bags/maps); scored carry UNCERTAIN
(magazine-residue only — measure, don't promise; RSS lane is
R1, this lane claims wall only). Zero byte change.

(c) Evidence: new 20t + drop ModuleGraph/ValueGraph ~15t;
`StreamedSource::collect` 18t (record 10t + key 5t + bag 3t);
`RefineState::External` ("no staged program — the literal bag
answers") ALREADY EXISTS as the loader fallback — the gate
extends a tested path, not a new semantic. Fix shape,
architect RULES FIRST: (i) census import-edges from the
already-collected records → stage iff (has imports OR is
imported); (ii) `AtomicLoader` misses behave exactly as
today's external targets (audit the fallback's consumers:
`value_of`, refinement chase, residue markers); (iii) the
unbound-fallback bag stays merged (`merge_constants_ordered`
untouched); (iv) kill-fast if <60% of files unstage on the
locked load. Restructure is `StreamedSource` (split
census-record from staged-bag) + `ValueGraph::new`
(conditional insert) + `source.rs` loader edge. Proof:
agentneo 173 + cargo module_graph/resolver suites + bench
bytes all scales + churn (churn: flat, few imports → big
skip, safe direction).

(d) Disjointness: `extract/resolver/*` + `stream.rs` (+
`module-graph` loader files IF the fallback needs them —
flag; C2's files, untouched by D1/D2/D3/R1) + `lib.rs`
`ValueGraph::new` call-site hunk (~:180). Untouched:
`walk/*`, `site.rs`, `builder.rs`, `assembly.rs`,
`sources.rs`, bridge, TS. FLAG at merge: R1's `lib.rs`
phase-split region (different hunks — sequence, R1 last).

(e) Out-of-bounds check: clean. Same resolutions (unstaged ⟺
unreachable-by-walk, proven per-repo not per-file à la C3
homework-iii); same diagnostics; no harvest/load/emission
change; the `External` fallback is existing semantics.
Guardrails: RSS unregressed-or-better by design (strictly
less staging); bundle exact (resolver-only; bytes gated).

## R1 — RSS hunter: chunked file handoff (~10-12MB scored, structural)

(a) What is held: `prepared.scannedSources` — 15.1k
{path, content} objects, ~4.16MB strings + ~8MB objects/slack
(probed live: +1.01MB/1,276 files medium → ~12MB enterprise)
— is REACHABLE-live through the entire blocking napi call
(napi `FromNapiValue` converts it at entry), so it sits
inside the scored pre-cliff peak deterministically. Plus the
conversion transient (second 4.16MB) and the Rust-side clones
(third copy). GC-timing moves are unavailable (S1) — this
lane moves reachable-live bytes, not collection timing.

(b) Lever: scored RSS −10-12MB (one chunk live at a time
instead of 15.1k files × 3 copies). Sync: unregressed
(chunk overhead ~ms; napi conversion total identical).
Zero byte change (same files, same order, same bytes).

(c) Evidence + shape: deepsee prepare boundary +54.5/+56.1
(retention live inside); S1 split method (snapshot-GC) used
for the live/garbage probes; lane-A adjudication named this
follow-up explicitly. Fix shape: stage the compile across
the napi boundary — `compile_init(spec) → handle`,
`compile_add_files(handle, chunk) × k` (TS drops each chunk
after its call returns; order-preserving, C3 indexed-restore
precedent), `compile_finish(handle) → result`. Native holds
one chunk transiently per call; long-lived state (sources
accumulation, then the existing pipeline) lives behind the
handle (id-map, no leaks — error paths destroy). Proof per
the STANDING method: base×3 vs merged×3 on a quiet box +
mechanism read (reachable-live delta — deterministic, NOT
the ±36 magazine lottery; the lane fails if it can't show
≥10MB scored). Complexity is HIGH (napi IDL + lib.rs phase
split + sync orchestration) — the lane is honest about that;
it is also the ONLY structural ≥10MB scored lever left
(V8 end-state is GC-only, allocator relief unverifiable,
native pre-cliff trims carry only via residue).

(d) Disjointness: `sync/index.ts` (chunk orchestration) +
`sync/native.ts` (chunked napi fns) + `native.rs` (IDL) +
`lib.rs` (phase split: init/add/finish around the existing
pipeline). FLAGS at merge: D3's one-line request hunk (same
literal — D3 first, R1 carries the flag per chunk);
D4's `lib.rs` call-site hunk (different region — sequence).
Untouched: extract/builder/assembly/sources/proof internals.

(e) Out-of-bounds check: clean. Same set/order/bytes through
the same pipeline; chunking is handoff plumbing, not load
weakening (frozen generator/scales/calls untouched); no
harvest/emission/architecture change; no GC forcing, no
harness gaming (bench methodology untouched).
Guardrails: RSS is the CLAIM (proven by the standing
method); bundle exact (bytes gated every scale + churn);
sync wall must not regress beyond noise (chunk overhead
bounded in-lane, else kill).

## Killed / deferred (with the floor bound)

- prepare reads (~283ms quiet): syscall FLOOR. Probed 17.7
  µs/file warm (medium) = open+read+close × 15k; async/libuv
  (F1=280>237) and 64-worker pool (GAPS-1, +85ms) both proven
  net-negative on warm cache. Panda pays the same IO inside
  its 645ms. No lane; the scrapable duplication was the
  NATIVE re-stat → D3.
- fg.sync + split (~50ms): weak-evidence micro. Enterprise
  bound says ≤59ms (prepare minus ReadFile); medium scales
  disagree (cold-vs-warm). A hand-rolled walker MIGHT save
  ~20ms but the evidence doesn't carry a lane. W5 sizing
  homework, not W4.
- parse (~85ms, Oxc per-file fixed cost), emit (~63ms,
  write_utilities sort+print of 5.7MB), hosts (~36ms, live
  entries post-C1), BindingWalk follow_edge (~33ms, live
  imports, memoized origins): phase physics, no redundant
  work found. No lanes.
- render facts-side standalone (~15-25ms: render_expected +
  fact keys): too small alone — FOLDED into D2 as steps
  2-3 (carried keys + fact memo), gated in-lane.
- Resolve-map Vec (D5a): KILLED by measurement — the 30t
  Extend frame CONTAINS the walk (iterator pulls resolution),
  so de-hashing saves ~5-10ms, not ~35. Fold as a D4
  piggyback if free, else drop.
- collect_pool walk fusion (~20ms): killed on coupling —
  fusing with a host walk couples order semantics across
  extract files D1/D4 own, for the smallest lever, in
  harvest-adjacent territory (fusion keeps semantics, but
  review-fragile). Note the walk cost (28t + mint 10t) and
  revisit W5 after extract settles. NOT a kill of the
  doctrine — a sequencing call.
- C4-pairing (extract-recorded decl↔want index): SUBSUMED by
  D2 (see §D2(c)) — retired, diff preserved as evidence.
- B3 plan-gating (empty-set): stays dead (12/243 mechanism
  load-real). D2 is a NEW shape (identical verdicts via
  placeholder/carried-keys, then predicate-gated keys-only)
  with NEW evidence (C4 100%/0-mismatch + reader grep +
  construction arguments) — not a re-proposal.
- constants/ValueGraph sound gating (W3-deferred): PROMOTED
  to D4 with the soundness ruling as its gate (External
  fallback audit + per-repo unimported proof).
- prepare parallelism remainder (W3-deferred): KILLED as
  stated (parallelism proven negative twice) — the remainder
  is D3's native half, not TS parallelism.
- napi-bridge malloc churn (~88ms): residual, not a phase —
  drops/conversion amortized across the lanes' work; shrinks
  as lanes land. No lane.
- config (~19ms floor), publish (~53ms, all pinned-output
  real work), serde (~26ms true codec): spent/floor. No lanes.
- Bundle: NO LANES. css DONE (gate exact, slack 0 — utilities
  floor re-confirmed 2.18 MiB, recipes 553.5 KiB gated exact),
  data DONE (variantMap 47.7 + compounds 40.4 + defaults 22.3,
  all consumed derivations). Any regrowth fails its arc.

## Morning questions (updated)

1. Post-W4 remainder (~400ms + floors): prepare-read syscalls
   (~283), Oxc parse (~85), sheet print (~63), live-file walk
   physics, harvest-walk doctrine (28t+10t — fusion deferred,
   kill OOB), phase streaming (live 3k co-residency). If HQ
   wants past ~1.0s, it is architecture (streaming phases,
   doctrine rulings) or OOB (ship-one-sheet) — not scrapes.
2. Scored-RSS floor (carried): if R1 lands, ~330 MiB scored
   vs 261 Panda — the rest is allocator-resident + V8
   end-state (S1 bounds stand: ~24 of ~150-190 respond to
   pressure; GC-only for V8). Allocator strategy stays a
   product-architecture question for HQ, not a night crew.
3. A10 namer cache: still watch-mode-only. Stays.
4. RandomState → deterministic hashing: observed (S1 lottery
   hypothesis + faster hashing) but broad; not a night lane.
   Perf-debt note for HQ.

## Lane plan for Wave 4 (captain decides; recommendation: 4 crews + 1 hunter)

- perf-4-a "want locations" (D1): lazy per-file line index in
  `span_position`. ~35ms, tightest lane, mechanical. Churn: RUN.
- perf-4-b "plan verdicts" (D2): tiered — (A) placeholders +
  carried keys + fact memo ALWAYS, (B) keys-only predicate
  gated on proof + 243-sweep. ~50-110ms. Churn: RUN (expect
  growth). Emptiness-gate + subset proofs are the architect's
  day-0 homework.
- perf-4-c "union trust" (D3): files_complete + enumeration
  proof, file_type fallback if unprovable. ~40-90ms. Churn: RUN.
- perf-4-d "resolver staging" (D4): unstage unimported, gated
  on External-fallback ruling + 60% kill-fast census. ~30-40ms.
  Churn: RUN.
- hunter-4-r "chunked handoff" (R1): staged napi file transfer.
  ~10-12MB scored, structural, high complexity, standing-method
  proof. Churn: RUN (bytes + wall-neutral).

Shared-file summary: `sync/index.ts` (D3 one-liner vs R1
orchestration — same literal, D3 first); `lib.rs` (D4 call-site
hunk vs R1 phase split — different regions, R1 last);
`channels/render.rs` (D1 one-liner vs D2-step-3 — different
lines, flag only). Merge order: a → d → c → b → r (locations,
staging, union, verdicts with sweep re-proven post-merge,
hunter last). Re-measure combined after each merge; D2's
243-sweep re-runs on the merged tree.

Projected close (all land, quiet scale): sync 1.31s → ~1.05s
(~40% of the remaining 665ms wall gap; the rest is syscall/
parse/print/walk floors), scored RSS ~345 → ~333 via R1
(held + hunter), css/data byte-exact.

Wave 4 recon: COMPLETE — map filed, 4 avenues + 1 hunter, next crews:
perf-4-a (D1), perf-4-b (D2), perf-4-c (D3), perf-4-d (D4), hunter-4-r (R1)
