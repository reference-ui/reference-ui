# Shot 3 — Parallel Compile: Architect Memo

Crew: swarm-memo (captain's reserve, wave 2). Base pin verified:
`5844b24a81a528ace14fab63e908793a6829a874`. No code touched; no
benchmarks run; all numbers from filed evidence (below). Estimates are
marked *(est)*.

Grounding: `docs/archive/VOYAGE-WARPDRIVE.md` (§10 Shot 3 gates, §13
do-not-fire) · `LOG.md` rooms + dead ends · `docs/evidence/flamegraph/
enterprise-flame3/` (`summary.md`, `callers.md`, `meta.json`) ·
`docs/evidence/alloc/enterprise-alloc3/summary.md` ·
`docs/missions/completed/operation-flamegraph-recon-v2.md` · read-only
source survey of `packages/reference-rs/modules/atomic/src/`
(`lib.rs`, `assembly.rs`, `stream.rs`, `runtime/builder.rs`,
`extract/resolver/mod.rs`, `stylesheet/cascade/mod.rs`,
`stylesheet/name/mod.rs`, `diagnostics/analysis/mod.rs`,
`extract/harvest/{literals,mint/mod}.rs`) and
`modules/module-graph/src/{walk/mod.rs,ladder/memo.rs}`.

Two load-bearing facts from recon v2 frame everything: the native
window is **100% top-thread** (11/11 threads matched, 0 born / 0 died,
1 µs unattributed — `enterprise-counters3`) with 11 threads idle, and
the profile is **long-tail flat** (top native self 1.7%), so there is
no single-function lane — only whole-window parallelism (§13: "single-
function native spikes" are dead). Weight ≈ ms at the 1 kHz profile
rate throughout.

Prior parallel deaths (Warpdrive §13 + LOG dead ends), and why: **parallel
scan reads regressed** (async and 64-worker both) because warm-open
per-op cost (15.87 µs) is the floor — threads added overhead without
removing count. Lesson applied: this design parallelizes in-memory CPU
(parse/resolve/emit) and never overlaps I/O beyond today. The request
JSON (files inline) means `atomic::compile` is already near-I/O-free;
the one disk-touching region (`hosts::resolve` → styletrace) stays on
the main thread in every slice. Also dead and untouched: GC-shape
lanes (0 in-window full GCs), `memmove`/`memcmp` standalone (effects),
warm-second-sync wins. Per §10, "use Rayon" is not the architecture:
the design below uses `std::thread::scope` + fixed input-index shards
+ serial ordered commit, no new dependencies for slices 1–3.

## 1. Partition design

Two stages, one mechanism. Every parallel region follows **parallel
compute, serial commit**: workers produce owned, indexed outputs;
the main thread merges in input order. Shard count is FIXED (64 by
input index, work-stealing over shards) and independent of thread
count, so output bytes are identical for any N (see R5).

### Stage A — file-level (≈100–140 wt low-risk; §3 for the full map)

Restructure of `run_parse_phase` (`atomic/src/lib.rs:158`) into two
parallel regions separated by serial barriers. Each worker owns its
shard's oxc `Allocator`s end-to-end (oxc 0.115 `Allocator` is `Send`,
`!Sync` — verified in registry source; one allocator per file per
worker is the blessed oxlint pattern). ASTs never cross threads; only
owned outputs merge.

- **A1 — parse + constants + staging (parallel).** Per file: bytes
  gates (`streaming_candidate`, `lib.rs:393`), retained parse
  (`Parser::parse`, 58 wt incl), per-file constants collect, streamed
  transient parse + `StreamedSource::collect` + error replay pairs
  (`stream.rs:131`, `ConstantsWalk`). Outputs per file: `LocalConstants`
  (owned), `StreamedSource` (owned), error replay vec, slot flags.
- **Barrier 1 (serial, stays):** `project.merge` folded in source
  order (`LocalConstants::merge` is first-wins — `or_insert` at
  `extract/constants/index.rs:243` — so fold order is load-bearing but
  the fold itself is cheap), `ValueGraph::new`, `IdentityGraph::new`
  (index build; memo stays per-worker), `unpanicked_index`.
- **A2 — extract + analysis + harvest-pool (parallel).** Per live file:
  `scope::collect`, `collect_bindings_with_identity`, `extract_with_context`
  (51 wt), `analysis::{css,jsx}::expectations` (loop at
  `diagnostics/analysis/mod.rs:109` is per-source over an immutable ctx),
  per-file harvest pool fragment (`pool_for_program`). Per-file outputs:
  wants, recipes, diagnostics, authored, sinks, session facts,
  tentative/bindings — all owned vecs, concatenated in source order at
  merge (precedent: `DiagnosticsSession::extend_facts` already documents
  "merge back in source order").
- **Serial seams inside A (stay serial):** `resolve_file_imports`
  (44 wt, `&mut self` over memo caches — see E2 for the three options:
  mutex-sharded memos, serial pre-resolution, per-worker graph clone);
  `IdentityGraph` memo (`RefCell`, `identity.rs:41`) and `ProbeMemo`
  (`RefCell`s, doc states "Resolution runs single-threaded") — both
  pure caches, convertible to `Mutex` or per-worker clones;
  `resolve_recipe_selections::resolve_all` (small); harvest `mint`
  (twin-skip `seen` set is order-dependent over `(prop,when)`-sorted
  sinks — keep serial, it is small); `hosts::resolve` (47 wt, disk
  touch — keep on main thread); harvest pool merge (associative
  `BTreeSet` extend — order-free, parallel fold is safe but unnecessary).

### Stage B — AssembleCtx partition (296 wt incl, the serial bulk)

`AssembleCtx::finish` (`assembly.rs:49`) splits into five partitions:

- **B1 — pass-1 want resolution (~75–85 wt).** `build_atom_set`
  (`assembly.rs:169`): per-`Want` `resolve_want_with` is pure given
  `(&Want, &BaseSystem)` — verified `resolve/` never touches
  `module_graph`/`ValueGraph`/`AtomicFs`. Each worker resolves its
  shard with a thread-local `ResolveSession` (local diagnostics vec,
  local facts vec, per-want location). Merge: diagnostics + facts
  concatenated in want order; atoms unioned by serial `AtomSet`
  extend (needs a small `extend` addition; union cost trivial).
- **B2 — recipes + `SelectionIndex` (small, stays serial).**
  `DuplicateRecipe` diagnostics order (spec-then-extracted) preserved
  by doing nothing.
- **B3 — plan build (83 wt via `build_keyed` → `resolve_entry` 63).**
  Three order-dependences, each with a serial-commit control: (a)
  `seen_keys` first-in-plan-order-wins — parallel key computation,
  serial first-wins filter, parallel resolve of survivors; (b)
  `resolve_with_unique_diagnostics` `is_duplicate` against the global
  vec — workers resolve with local vecs, merge replays each worker
  diag through `is_duplicate` in plan order (exact replay);
  (c) `atom_set` inserts — write-only during plans (reads happen
  later in emission), so per-worker atom vecs + serial union.
  `derive_slot`, `class_name_with_system`, `convert_value` are pure
  per-decl. `insert_diet_atoms` (LEAF-11 load-bearing inserts) ride
  the same union.
- **B4 — stylesheet emission (62 wt via `build_stylesheets_with` →
  `write_utilities` 51).** Parallelize key computation
  (`CascadeKey::from_atom`, pure) + per-rule rendering into indexed
  buffers; **keep the sort itself serial** (`sort_by` closure is
  ~13 wt self — not worth a parallel sort, which also dodges the
  par-sort determinism question). Grouping (`group_end`/`write_group`)
  is a cheap serial pointer walk over sorted keys; rule bodies render
  in parallel, concat in order. Tie-order hazard (stable sort over
  `FxHashSet` iteration order) is controlled by N-independent merge
  (fixed shards, serial union in shard order) + E4 tie census.
- **B5 — proof render + css runtime (small, stays serial).**
  `render_session` (12 wt incl) joins facts vs carried keys; proof-only
  `build_css_runtime` iterates the set into a `BTreeMap` (order-free).

### Seams that stay serial, whole-compile

Request JSON parse + `sources::collect` (~42 *(est)*), N-API/JSON
marshal delta (28.5 ms filed both legs), module-graph build (~30
*(est)*), `hosts::resolve` (~38 *(est)*), `partition_channels` (~25
*(est)*), `serialize` (~4 *(est)*), barriers/merges (~15 *(est)*),
B2/B5/small (~20 *(est)*). Total serial floor ≈ 200–230 ms of the
780 ms compile (see §3). Diagnostics doctrine is untouched: analysis
still reports first, proof still joins at the end, `partition_channels`
still strips compiler lines from default — every fact and line is
computed identically, only the thread computing it changes. Harvest
doctrine untouched (`mint` serial, twin-skip semantics preserved).

## 2. Deterministic merge + bit-identical-output argument

**Claim.** For fixed input bytes and fixed shard count, output bytes
(`styles.css`, `runtime-data.mjs`, diagnostics + order, proof channel)
are identical for any worker count N ≥ 1, because every merge operator
is either order-free or folded in input order, and no schedule-dependent
value (thread id, timing, address, hash seed) reaches any output.

Merge operators used: (i) vec concat in input/shard order (wants,
diagnostics, facts, authored, sinks, selections, plans, keys);
(ii) set union into `FxHashSet` by serial extend in shard order
(deterministic for fixed shards; downstream uses are order-free —
sorted sheet, `BTreeMap` css map, `.any()` container check);
(iii) first-wins folds replayed serially in input order (constants
merge, `seen_keys`, `is_duplicate`, sink `ordered_unique`).

Nondeterminism risks and controls:

| # | Risk | Control |
|---|---|---|
| R1 | `AtomSet` (`FxHashSet`) iteration order shifts with worker count | Fixed-shard serial union (N-independent); all consumers order-free (§1); 20× hash gate + cross-N byte-compare in E5 |
| R2 | `std` `HashMap`/`HashSet` (`RandomState`) iteration | Audit E0: `resolve_file_imports` map is lookup-only downstream; `fold.values.next()` guarded by `len()==1` (`scope/types.rs:99`); rule: no RandomState iteration feeds output order |
| R3 | `hashbrown` iteration (oxc paths, `HashMap::insert` 29 wt) | Same audit; default hasher is seed-fixed in 0.14+, still never iterate into output order |
| R4 | Float formatting / reduction order | No arithmetic reduction anywhere (merges are concat/union/sort); `WidthKey.milli` is `i32`, no float sort keys; `f64 Display` is deterministic per value |
| R5 | Work-stealing schedule | Fixed 64 input-index shards; schedule affects only who computes, positions are indexed; worker count is NOT `num_cpus` — fixed or capped parameter |
| R6 | Addresses / hashes in output | `Atom.hash` = `FxHasher` over content only (`decl.rs:59`); class stems from content; no `{:p}`, no address hashing (E0 verifies namer) |
| R7 | First-wins/dedupe (`seen_keys`, `is_duplicate`, constants, sinks) | Serial ordered commit replays serial semantics exactly |
| R8 | Parallel oxc parse divergence | Per-file owned allocators (blessed pattern); E1 byte-compares per-file errors/constants serial-vs-parallel |
| R9 | `serde_json` `preserve_order` (ON in `atomic/Cargo.toml:22`) | Insertion-ordered maps are never rebuilt across workers; each decl's `Value` stays intact on one worker; E0 audits `canonical_json_value` call sites |
| R10 | Cascade/emitter sort ties under stable sort | N-independent input order (R1 control) makes ties resolve identically; E4 counts ties + proves tied pairs emit identical bytes (or adds a content tie-break, byte-verified) |
| R11 | `resolve` shared mutation (`ResolveSession.emit`, canon tables) | Thread-local sessions; canon tables are `&'static` read-only (`dialect.rs:359`); E0 asserts `Send+Sync` bounds incl. `Want`/`Atom`/`AuthoredDeclaration`/`Diagnostic`/`DiagnosticFact` |
| R12 | `ValueGraph`/`IdentityGraph`/`ProbeMemo` interior mutability (`Rc`, `RefCell`) | Excluded from slices 1–3; E2 decides mutex-shard vs pre-resolve vs clone for slice 4. `Rc<AtomicFs>` → `Arc` if shared |
| R13 | `BindingWalk` `&mut graph` (`ensure` staging) | Staging is cache-pure by contract ("miss path serves bit-identically"); E2 proves or pre-warms `ensure` serially |
| R14 | Cycle-refusal chase-order (`value_of`/`refined_file`) | Refusals intentionally unmemoized; per-query chases are deterministic; parallel only if E2 proves query-independence, else serial pre-resolution |
| R15 | Malloc contention / RSS growth | Same total allocations (no new arenas; workers own shards of today's retained set); peak ≈ serial + stacks; HW guard re-verified per slice |
| R16 | Pool startup cost per `sync()` | `std::thread::scope` spawn ≈ 8×~50 µs, negligible; no rayon pool to warm (slices 1–3 dependency-free) |

## 3. Sizing (filed weights; wt ≈ ms)

Primary: `enterprise-flame3` canonical leg (compile 780.3 ms,
`meta.json` + `summary.md` + `callers.md`). Secondary *(est)*: alloc3
trace-leg phase walls × 0.743 (counters-span basis). **Wave-1 haircut:**
per LOG wave-1 close, ~37 wt of the canon cluster plus `is_length` and
−35% of realloc volume were banked after flame3 filed (combined −65.9 ms).
Resolve-heavy rows below
overstate by ~5–10%; haircut applied in the realistic band, not per row.

| Partition | Filed attribution | Size (ms) | Parallelizable |
|---|---|---|---|
| A1 parse + constants + staging | `Parser::parse` 58 incl; `merge_constants_ordered` 39; phases parse ~20 + constants ~36 *(est)* | ~55–65 | ~45–55 (minus ordered-merge fold) |
| A2 extract + analysis + harvest | `extract_with_context` 51; `walk_declaration` 106 incl; `analysis` phase ~26 *(est)*; harvest ~41 *(est)*; phase extract ~148 *(est)* | ~150–200 | ~120–160 (minus E2 seam) |
| A-resolve-imports | `resolve_file_imports` 44 (→ `extend` 42) | 44 | 0–40 (E2 decides; `extend` is per-call local) |
| B1 pass-1 resolve | `finish → resolve_want_with` 71 of 137 incl | ~75–85 | ~70–80 |
| B3 plan build | `build_keyed` 83 → `resolve_entry` 63 → unique-diag 51 | 83 | ~70–78 (minus serial dedupe/commit) |
| B4 emission | `build_stylesheets_with` 62 → `write_utilities` 51 | 62 | ~40–50 (render parallel, sort+group serial) |
| Serial floor | marshal 28.5; collect ~38, graphs ~30, hosts ~38, partition ~25, req+ser ~8, B2/B5 ~20, barriers ~15 *(est)* | ~200–230 | 0 |
| Allocator self inside above | malloc 262, memmove 70, memcmp 52 (spread across partitions, inline in the work) | — | scales with the work (per-thread magazines; contention derate in E5) |

Check: 60 + 175 + 44 + 80 + 83 + 62 + 215 ≈ 719 vs compile 780
(residual ≈ unphased + overlaps in inclusive edges — honest gap, not
hidden prize).

**Ceiling (Amdahl).** Parallel fraction p ≈ 0.68–0.72 of compile.
N=4: 2.0–2.2× → compile 780 → ~360–390. N=8: 2.6–3.0× → ~260–300.
**Realistic band** (efficiency 0.6–0.75, E2-mutex risk, wave-1
haircut): **1.4–1.8× window → 220–340 ms saved end-to-end**,
landing sync ≈ 890–1010 from ~1186. LOG's "~100–250" room is the
floor of this band (E2-worst-case + low efficiency).
**Left on the table:** the ~200–230 serial floor (marshal, collect,
graphs-build, hosts, partition — each a future serial-diet or
stage-parallel lane, none in this track), allocator contention,
barrier/imbalance loss, and all of scan (364) — Shot 3 never touches
it. At infinite compile parallelism with the floor held, sync →
~675 ms: Shot 3 alone can approach but not bank the 700 target;
HIT needs Shot 2 and/or diet stacking. The Warpdrive §10 proxy
(1.5× → ~247 ms, top-thread < 80%) sits mid-band and stays the
promotion reference.

## 4. Confirmation protocol (in order; falsification each)

- **E0 — `Send`/`Sync` + iteration audit (static, hours).**
  Static asserts on `Want`, `Atom`, `AuthoredDeclaration`,
  `Diagnostic`, `DiagnosticFact`, `CompiledRecipe`, `RecipeSelection`,
  `LocalConstants`, `HarvestPool`; grep-audit every `HashMap`/
  `HashSet`/`FxHashSet`/hashbrown iteration in §1 regions for
  output-order reach; verify namer/serializer take no addresses.
  *Falsifies:* any output-reaching iteration or `!Send` owned type
  kills its partition until refactored (small, named refactor).
- **E1 — A1 serial-vs-parallel equivalence (no threads yet).**
  Run per-file A1 outputs through the parallel code path on one
  thread; byte-compare per-file constants/staged/errors + merged
  project constants vs serial. *Falsifies:* any diff kills A1's
  collect/merge split.
- **E2 — ValueGraph query-independence (the track's hardest question).**
  (a) Double-run: resolve all live files' imports twice — fresh
  graph vs pre-memoized graph — outcomes must be identical;
  (b) order permutation: resolve in reversed file order, identical
  outcomes; (c) mutex prototype: `Mutex`-sharded memos, measure
  contention (top-thread share + wall). *Falsifies:* order-dependent
  outcomes → A2 keeps serial pre-resolution (A-resolve-imports row →
  0, band floor); contended mutex (>10% overhead) → per-worker clone
  or pre-resolve instead.
- **E3 — B1/B3 ordered-commit equivalence.** Thread-local sessions +
  ordered merge on one thread, then N threads; byte-compare plans,
  diags order, facts, atom set. *Falsifies:* any diff kills the
  shard/merge design (mechanism first, no second design in-track).
- **E4 — emission tie census.** Count `CascadeKey`+`cmp_whens` ties on
  enterprise + agentneo corpus; prove tied pairs emit byte-identical
  rules (or zero ties). *Falsifies:* divergent tied pairs → add
  content tie-break (`important`, class stem) + re-verify bytes on
  corpus; if bytes shift on the locked load, B4 stays serial-sort
  with N-independent input order only (render still parallel).
- **E5 — scaling + determinism gate.** 20× repeated compiles hash-
  identical (Warpdrive §10); cross-N (1/2/4/8) byte-compare; counters
  (top-thread < 80%, unattributed < 1%, born/died stated); 8-pair
  Candidate proof per Warpdrive §6. *Falsifies:* any hash mismatch
  (design bug, fix or kill slice); <100 ms end-to-end with p̂ < 0.5
  (track underperforms → HOLD for re-scope, see §5).

**First implementable slice (slice 1):** A1 only — parallel
parse + per-file constants collect + streamed staging + error replay
with serial ordered merge; everything downstream untouched. Prize
~30–40 ms wall *(est)*; value is the proven harness (scoped threads,
owned allocators, fixed shards, ordered commit, 20× gate) that slices
2 (B1), 3 (B3), 4 (A2+E2 answer), 5 (B4+E4 answer) ride on. Each slice
lands independently behind Candidate proof; slice order is fixed.

## 5. Kill clause (heavy-track rule)

If E2 proves order-dependent resolver outcomes AND E5 shows <100 ms
end-to-end (joint kill trigger), Shot 3 dies and its milliseconds are
replaced — not hand-waved — by this stack (LOG rooms, filed weights):

Shot 2 dead-file avoidance ~136–190 (structural prize, recon v2 §7 A2;
needs its own soundness proof) + diagnostics/proof diet ~40–70 of 76
incl (unworked) + parse visit-less ~40–80 of ~110 (unworked; moves
only with less input) + serializer/module-graph remainder ~30–50
(unworked remainder) + canon remainder ~25–40 of ~83 cluster (37
banked) + cascade/keys remainder ~15–20 + keys memo ~15–19 (per-phase
bar) + realloc remainder ~15–25 (35% banked) ≈ **330–490 realistic
replacement**, landing sync ≈ 800–900: short of 700. That shortfall is
the honest consequence — track death means NO-SHOT on the 700 target
within bounds, and the final report must name the out-of-bounds
product decision (incremental manifest/cache contract or deeper
compiler-IR redesign), exactly as Warpdrive §11 prescribes. A KILL
without this paragraph is incomplete; with it, the captain can close
NO-SHOT–VERIFIED rather than grind.

## 6. Verdict

**PROCEED** — first slice specified (slice 1: A1 parallel
parse/constants/staging, §4), slices 2–5 experiment-gated on E2
(resolver independence → slice 4 scope) and E4 (emission ties → slice
5 scope). E0/E1/E3 are pre-implementation checks inside slice 1–3's
normal build. Kill trigger and replacement milliseconds named in §5.
