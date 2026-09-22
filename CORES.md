/# CORES — multi-core `sync()` on `packages/reference-rs`

Architectural plan for taking enterprise `sync()` across cores without
giving up one byte of output identity, one diagnostic, or the serial
compiler on one-core machines. This is the written HQ widening that
`VOYAGE.md` §Heavy tracks demands before any parallel work is briefed;
Adopted 2026-09-22 (D1): the ban is lifted, parallel proceeds under this
contract, and the spike is being stabilized toward landing.

The current working tree (`extract_parallel.rs`, `phase_lane.rs`,
`phase_parallel.rs`, `phase_walk.rs`, `resolve_pool.rs`,
`runtime/plan_pool.rs`, hookups in `lib.rs`, `assembly.rs`,
`runtime/builder.rs`) is treated here as a spike: what one agent reaches
for when asked to "make it parallel". It found the right *unit* (parse
and walk on the lane that owns the arena) and then measured ~0. §0.2
explains that zero with a lane sweep; nothing in the spike is landable
as-is, and its findings are load-bearing.

Every number below is a same-session measurement on the bench box
(i9-13900K, 8P+16E, macOS, seed-7 enterprise: 3,000 styling + 12,000 dead
files, 7,527 `css()` calls, 120 recipes) unless marked *est.* Method in §B.

---

## 0. Where the milliseconds are

### 0.1 Serial tip (`757a607bc`), compile window 486 ms

Room partition of the main thread (each sample assigned once, most
specific marker first; two captures `repro7a/b` agree within ±3 ms):

| room | ms | lane unit | note |
| --- | --- | --- | --- |
| **per-file front** | **160** | file | extract walk 52 · streamed parse+fold+record 32 · retained parse 25 · analysis 19 · harvest pool 18 · bindings/scope 15 |
| **assembly tail** | **110** | want / decl | `resolve_want_with` 46 · plans (`build_keyed`) 64 = resolve-inside 25 + lookup-key serialize 17 + rest 22 |
| **serial residue** | **84** | — | assembly-other (runtime map, wire, static, drops) 35 · `write_utilities` 23 · emit rest 9 · proof 8 · recipes 5 · napi serialize 4 |
| **barrier (cross-file)** | **72** | — | styletrace walk 20 · import resolution (`ValueGraph`) 19 · `ValueGraph::new` staging 17 · hosts rest 11 (8 = `stat` per entry) · identity 2 · selections 2 |
| **drops + madvise** | **44** | — | arena/`Vec` frees and page release at phase ends, attributed to `compile` itself |
| **collect sources** | **17** | — | `backfill_dir`: a second full `readdir` walk of the root *inside compile* on the retention-token path (0 files read; perf index: 0 entries) |

Whole `sync()` 925 = startup-excluded config 28 · scan 349 · evaluate 6 ·
compile 486 · publish 53. Scan is 83 % kernel, 250 of it `__open`.

### 0.2 Spike autopsy — the lane sweep

Same binary, lane count by env knob (worktree only), Nano zone restored,
one capture per cell (±5 ms). `F` = parse/walk lanes, `T` = want/plan
pool lanes. "strided" = the spike with one change: lane *k* owns indices
*k, k+W, k+2W…* instead of a contiguous range.

| lanes | spike compile | **strided compile** | total CPU (strided) | peak HW MiB (strided) |
| --- | --- | --- | --- | --- |
| tip serial | 486 | 486 | 482 (1.00×) | 284 |
| F1/T1 | 492 | — | 488 | 289 |
| F2/T1 | 508 (+22) | — | 526 | 334 |
| F4/T1 | 502 (+16) | **397** | 558 (1.16×) | 341 |
| F8/T1 | 449 | **372** | 622 (1.29×) | 374 |
| F16/T1 | 427 | 378 | 1002 (2.08×) | 421 |
| F8/T8 | 402 | **335** (sync 761) | 664 (1.38×) | 378 |
| F16/T16 | 382 (sync 816) | 336 (sync 762) | 1088 (2.26×) | 442 |

Five mechanisms, in order of size:

1. **The spike's own measurements were invalid.** Cursor's extension host
   exports `MallocNanoZone=0`; every child of an agent shell inherits it.
   With Apple's Nano zone off, small allocations take the magazine path
   and the serial compile is **656 ms instead of 486** (+35 %). The spike's
   15:57 bench report (941 ms, HW 367 MiB) and the 16:45 flame (`resolve_want_with`
   100, `build_keyed` 85, `hosts::resolve` 49) reproduce exactly under that
   environment; the same binary in a clean environment is 816 ms. Nothing
   in the spike regressed serial code (F1/T1 = 492 vs 486). §5.6 makes the
   harness refuse to time under the flag.
2. **Contiguous ranges over path-sorted input put all the work on ≤ 4 lanes.**
   The generator writes `src/recipes/*`, `src/ui*/**` (3,000 styling), then
   `src/util/**` (12,000 dead). Sorted, styling files are indices 0–3,120
   of 15,122. Sixteen ranges of ~945 → shards 0–3 hold every styling file,
   twelve lanes parse dead files and wait. At F4 the caller's range holds
   *all* styling work — F4 ≈ serial + overhead. Real repos cluster the same
   way (`src/components/**` vs `src/lib/**`). Striding alone: F4 502 → 397,
   F8 449 → 372. This is §2.3.
3. **Per-lane duplicated work.** Each lane builds its own
   `IdentityGraph::from_shared` (17 ms) and `analysis::context`; at 16
   lanes that is ~270 ms of CPU for nothing, and why F16 costs 2.1–2.3×
   serial CPU for no wall gain over F8. The knee on this box is 8 lanes.
4. **The barrier redoes work the lanes already did.** The spike does fold
   `TraceModule` on lanes and walks them via `resolve_prepared` (no
   styletrace re-parse — `parse_trace_module` is absent from the lane
   flames), but `open_trace` still `stat`s every entry (8 ms) and builds a
   15k-entry staged map (2 ms) nobody reads; `ValueGraph::new` gets
   `retained: &[]` (every imported origin re-parses on the caller); each
   lane rebuilds identity; and `store_refs` adds a barrier round to run
   `scope::collect` just to read import declarations. Barrier on the
   caller today: 59 ms (hosts 20 = open 10 + walk 9 · `ValueGraph::new`+fold
   18 · identity 11 · `resolve_all` 10). Floor after Stage 1 ≈ 30: the
   styletrace walk (9) and serial import resolution (10) stay.
5. **Memory.** Lanes add +60..+160 MiB peak HW (per-lane graph copies,
   90k-element tail result vectors, 8–16 transient streamed arenas). The
   ~280 MiB guard is breached at every lane count > 1.

What is left on the main thread at strided F8/T8 (332 ms): **assembly
residue 155** (plans replay 34 · emit 31 · drops 28 · assembly-other 22 ·
recipes 20 · proof 16 · partition/serialize 4), **barrier 59**, caller's
fair shard 33, backfill readdir 17, lane waits 16, other 26. The order of
targets is therefore residue → barrier → collect; the front is done once
it is balanced and de-duplicated.

### 0.3 Where this lands

| | measured today | after Stage 1 (est.) | after Stage 2 (est.) |
| --- | --- | --- | --- |
| compile, 8 lanes | 335 | ~295 (barrier 59 → 30, tail replay 34 → 15) | ~220 (residue 155 → 80) |
| compile, `Fixed(1)` | 486 | ≤ 495 | ≤ 495 |
| sync, 8 lanes (scan untouched) | 761 | ~720 | **~645** |
| total CPU / serial CPU | 1.38× | ≤ 1.15× (no per-lane duplication) | ≤ 1.15× |
| peak HW | 378 MiB | ≤ 300 MiB (est., attribution in S0.4) | ≤ 300 MiB |

Level with Panda's 645 without touching scan; going under it is scan's
job, a separate, bounded lever (§7). Estimates are bounded by rooms measured in §0.2, not by
shares; S0 re-measures each before a lane is briefed.

---

## 1. Physics — what cannot move

Filed in `PERF-W2-SLICE1B` (registry-source proof, oxc 0.115) and
re-confirmed against upstream docs (§A):

1. **`ParserReturn<'a>` is `!Send`.** Arena `Vec`s store `&Bump`; `Bump`
   is `Send + !Sync`. A worker cannot hand a parse back.
2. **`Program<'a>` is `!Sync`.** `Cell<NodeId>` on every node. `&Program`
   cannot be shared to workers. Both lending directions are closed.
3. **`Allocator` is `Send + !Sync`.** Move it to a lane, parse, walk, drop
   or `reset()` on that lane. Same-thread parse+walk is the only legal
   unit. oxlint does exactly this (`AllocatorPool` per thread) and reaches
   for `unsafe self_cell` only when it must move AST+arena together; we do
   not reach.
4. **The owned records already cross.** `LocalConstants` (BTree),
   `ModuleRecord`, `ExportMap`, `HarvestPool` (`FxHashMap<kind,
   BTreeSet>`, union-merge), `ScopeTable` (no lifetime), `TraceModule`
   (no lifetime), `Want`, `Recipe`, `Diagnostic`, `DiagnosticFact`,
   `ResolvedExport`, `AuthoredDeclaration`, `Atom` — all `Send + Sync`,
   all arena-free (E0.3).
5. **Per-file paths iterate BTree only** (E0.4). The cross-file paths do
   not all. `AtomSet` is an `FxHashSet`, and `write_utilities`
   (`stylesheet/cascade/mod.rs`) iterates it then *stable*-sorts on a
   `CascadeKey` that excludes the value: atoms tying on the key keep
   hash-iteration order, which is a function of the exact insertion
   sequence (`PERF-W2-SORTSHAPE` counted 67 divergent ties on this load).
   Emission order therefore depends on atom insertion order today. Any
   parallel commit must reproduce the serial insertion sequence exactly
   (§4.1, P5). `TraceModule.exports` is a std `HashMap` (RandomState); it
   must never be iterated into output (P6).
6. **Parsing is deterministic across threads.** Same bytes → same AST and
   errors; oxc's `UniquePromise` is per-thread by design (PR #2340).

Consequences that the design must honour, no exceptions:

- No `unsafe`. No `#[allow]`. No global thread pool, no `rayon`, no
  `AsyncTask`: `std::thread::scope` per call. Spawn+join of 8 threads is
  ≤ 0.3 ms against a ~480 ms job; a lazy global pool in a cdylib buys
  nothing and adds `dlclose`/`worker_threads` sharp edges (§A).
- Only the JS thread touches `napi_env`. All parallel work is pure Rust
  inside the synchronous `compile(token)` / `scan_system` calls, joined
  before return.
- Every cross-thread value is an owned ledger carrying its input index.

---

## 2. Target architecture — lanes and ledgers

One pipeline, expressed as stages over owned ledgers. Lanes run the
per-unit stages; the caller runs the folds and the commits. With
`lanes = 1` the same stages run inline on the caller with no spawn — that
is the one-core product, not a fallback.

```
                  ┌────────────────────────── per file, lane-owned arena ──────────────────────────┐
  sources ──► A  │ parse → FileFold { errors, constants bag, ModuleRecord, ExportMap, import refs, │
  (token)        │         HarvestPool, TraceModule (if !trace_skip) }                              │
                  │ retained: keep Allocator+Program on this lane   streamed: drop after fold        │
                  └───────────────────────────────────────────────────────────────────────────────────┘
                                                      │ ledgers, in chunk order
                  ┌────────────────────────── caller, owned data only ─────────────────────────────┐
  Barrier 1      │ constants fold (input order) → project bag                                       │
  "the fold"     │ ValueGraph over (ModuleRecord, bag); origins refine by bounded re-parse (§3.2)   │
  budget ≤ 30 ms │ hosts::resolve over TraceModules (no parse, no stat, no staged map)              │
                  │ IdentityIndex from ExportMaps (built once, Sync)  ·  analysis ctx (once)         │
                  │ resolve every styling file's imports in input order → FileValues[]               │
                  │ → Published { bag, hosts, traced, source ids, identity, values }  (Arc, frozen) │
                  └───────────────────────────────────────────────────────────────────────────────────┘
                                                      │ &Published
                  ┌────────────────────────── per file, same lane as A ───────────────────────────┐
              B  │ scope::collect(program, bag) → bindings → extract → FileOut { wants, recipes,  │
                  │ diagnostics, authored, sinks, facts, recipe bindings, tentative }               │
                  │ analysis facts under the published source id  ·  drop the arena (on the lane)  │
                  └───────────────────────────────────────────────────────────────────────────────────┘
                                                      │ ledgers, in chunk order
  Barrier 2      │ replay: analysis facts → parse errors → FileOut (input order) → harvest mint   │
  "the commit"   │ → recipe selections.  Exactly the serial schedule.                              │
                                                      │ wants[], authored[]
              C  │ chunks by want index: resolve_want_with → { atoms, diagnostics, facts }         │
                  │ chunks by first-seen decl: lookup_key + detached resolve → { plan, atoms, diags }│
                  │ ordered commit: atoms into AtomSet, diagnostics/facts in serial order, plan     │
                  │ dedupe (`is_duplicate`, `seen_keys`) replayed on the caller                     │
              D  │ residue: recipes compile ∥ proof render ∥ emit (independent inputs, §3.5)       │
                  │ drops handed off the critical path; partition; wire                             │
```

Design rules that make this elegant rather than merely parallel, each
pinned to a number from §0.2:

1. **Ledgers are the only currency.** A stage takes owned inputs and
   returns an owned ledger. No `Mutex<OwnedFile>` per file, no `Barrier`
   choreography inside stages, no `Published` behind a mutex: lanes return
   `Vec<(chunk, Ledger)>` from `scope.spawn`, the caller sorts by chunk
   and folds. Poison handling disappears with the mutexes.
2. **The commit replays the serial schedule.** Output identity is a
   property of the commit order (phase × input index × walk order), never
   of scheduling luck. §4.1 is the full contract.
3. **Chunks pulled, never contiguous ranges.** Fixed chunks by input
   index (~64 files, ~1k wants) pulled through one `AtomicUsize` cursor.
   Path-sorted input clusters work (§0.2.2: 100 % of styling on one lane
   at F4); an 8P+16E box makes the slowest E-core the critical path.
   Chunk order restores determinism; pulling restores balance. Lane idle is
   measured (§5) — strided F8 already has the caller waiting only 16 ms.
4. **Nothing is built per lane that can be built once.** `IdentityIndex`,
   `analysis::context`, `StyleSurface`, breakpoints: built once in the fold,
   shared by `&`. §0.2.3 is the cost of ignoring this (2.1× CPU at 16).
5. **Stage B runs where Stage A parsed.** A lane walks exactly the arenas
   it holds; arenas drop on the lane, so the 44 ms of drops+madvise in
   §0.1 leave the main thread for free. Streamed files parse into **one
   reusable `Allocator` per lane** (`reset()` between files — oxlint's
   `AllocatorPool` shape, §A; oxc 0.115 pinned) instead of the fresh
   arena per file that `stream.rs` and the spike's lane mint today, so
   the transient arenas stop paying first-chunk malloc and `Bump::drop →
   madvise` at all (the `Bump::drop` callers in the §0.1 drop room).
6. **Fallbacks are counted, never silent.** Every "parse from bytes"
   path (identity miss, value-graph origin refine, styletrace edge target)
   increments a counter reported through the compiler channel. The spike's
   barrier is made of silent fallbacks (§0.2.4).
7. **One compiler.** `run_parse_serial` survives only as the `cfg(test)`
   reference for the E1 differential until the staged pipeline at
   `lanes = 1` is byte-identical on every golden and all four scales; then
   it is deleted and the pin outputs become the reference. A parallel
   branch that is a second compiler is the failure mode.
8. **Lanes are a request knob, not a global.** `CompileRequest { lanes:
   Lanes::Auto | Lanes::Fixed(n) }`, `Auto = min(available_parallelism, 8)`
   (the measured knee; D2 may move it after the Apple-silicon sweep);
   compiles under the work threshold (styling files < 64, wants < 4k)
   never spawn. Tests pin `Fixed(1)`, `Fixed(3)`, `Fixed(8)` explicitly —
   no `thread_local` switches, no env (the sweep knob in §B is worktree-only
   and never lands).

Strategic note: the per-file ledger that lets a file cross a thread is
the same unit that could cross a process boundary later (content-addressed
cache, watch/incremental). Warpdrive's NO-SHOT named "a public incremental
manifest/cache contract" as the next product decision; this architecture
is the one that makes it cheap when HQ takes it. Do not build it now.

---

## 3. The seams — barrier, residue, collect

### 3.1 Import refs come from the module record

`ScopeTable::import_refs()` yields `ImportRef { local, imported ("brand"
| "default" | "*"), specifier }`. `ModuleRecord.imports` already holds
`ImportEdge { local, imported: Named | Default | Namespace, specifier }`
in source order, value-only. Deriving refs from the record in Stage A
deletes the spike's `store_refs` round (a full extra barrier where every
lane ran `scope::collect` just to read import declarations). Proof: a
differential asserting `import_refs()` ≡ derived refs on every golden and
the bench load. If they differ on any shape (`import type`, side-effect
imports, `require`), the derivation follows the table, never the reverse.

### 3.2 The value graph over owned records (19 + 17 ms serial)

`ValueGraph` is demand-driven, memoized, `&mut self`, and its cycle
refusals are chase-order dependent ("an inner origin refused mid-chase
re-reads its refined file on later use"). rustc's parallel front-end is
the cautionary tale: shared demand-driven memo + cycles ⇒ nondeterministic
diagnostics even when outputs match (§A). It stays serial, in input order,
on the caller. What changes is its inputs:

- `ValueGraph::new` takes `(ModuleKey, ModuleRecord, bag)` for every
  file — the records lanes folded — instead of `&[RetainedSource]` with
  borrowed programs. `RefinedFile { table: ScopeTable, markers, bag }` is
  already owned; the AST is only needed to *compute* a refinement.
- `ValueGraph::new` itself is 17 ms serial (`StagingPlan::census` over
  15k records, `AtomicFs` map, BTree inserts). The census is per-file and
  associative: lanes can fold their share and the caller merges.
- Origin refinement (`collect_origin` → `scope::collect_with(program, …)`)
  needs the origin's program. Stage 1 keeps `refine_streamed`'s bounded
  re-parse for origins only — the set of distinct project files that a
  styling file imports a value from (token modules, barrels), typically
  ≪ files. **Census first (S0.2)**: count distinct refined origins on the
  bench load and one real repo. Over 10 ms → Stage 3 makes the bake
  AST-free (probe table + `OriginFill` applied to the table, no re-walk).
- Resolution of all styling files' imports runs once on the caller, input
  order (10–19 ms measured), producing `FileValues[]` that lanes read.

### 3.3 Styletrace over `TraceModule` (20 ms → ~9)

The spike already has the right shape here and it works: lanes fold
`TraceModule` for every `!trace_skip` file (`phase_lane::record` with the
surface and package root), and `hosts::resolve_prepared` →
`trace_style_bindings_with_modules` walks them, parsing only entries the
fold omitted (`parse_missing`). The lane flames show no
`parse_trace_module` at all. Keep it; make the miss path counted (P7).

What remains is `open_trace` (10 ms): `entry_paths` calls `path.is_file()`
per live source to drop virtual-only entries — ~3,000 `stat`s, 8 ms — and
it builds a 15k-entry `FxHashMap<PathBuf, &str>` staged map that only the
miss path reads. The scan already knows which sources came from disk;
carry the flag on the source and delete the stats; build the staged map
lazily on the first miss. The walk itself (~9 ms, a graph walk with edge
following) stays serial on the caller.

### 3.4 Identity and context, once (11–22 ms per lane → once)

`IdentityGraph` keeps a `RefCell` memo, so the spike builds a copy per
lane. Split into an immutable `IdentityIndex` (Sync, built once in the fold
from the lane-folded `ExportMap`s) plus a per-lane miss memo. Memo keys and
lookup keys must normalize identically or misses silently re-parse — count
them. `analysis::context` likewise: built once, shared by `&`.

### 3.5 The residue (155 ms at 8 lanes — the largest serial room)

Measured at strided F8/T8 on the main thread after the pools return:

| room | ms | lever |
| --- | --- | --- |
| plans replay (`build_keyed` on caller) | 34 | lookup-key serialization (17 serial) moves to the decl lanes with the detached resolve; caller keeps `seen_keys`, `is_duplicate`, `AtomSet::insert` in decl order (floor ≈ 12) |
| emit (`write_utilities` 22 + rest 9) | 31 | serial by sortshape doctrine; the stable sort over ~50k atoms is the cost. Under D6 (total order) it could shard-sort + merge; without D6 it stays |
| drops (`Want`, `Recipe`, `RuntimeStylePlan`, `CompileResult`, `ValueGraph`) | 28 | hand owned values to a scoped drop lane while the caller serializes; never `mem::forget` (long-lived hosts) |
| assembly other (runtime map, wire, static) | 22 | census in S0.1; likely part drop, part `split_shared_suffix` |
| recipes compile | 20 | independent of emit and proof: run on a lane in parallel with them |
| proof render (`Proof::collect`, memo hashing) | 16 | reads facts only: parallel with emit |
| partition / serialize / wire | 4 | — |

Recipes ∥ proof ∥ emit is a three-way fork over disjoint inputs (recipes
read `extracted_recipes` + atom set; proof reads the facts session; emit
reads the atom set) with an ordered join — no output order changes. Drops
are not work; they are freed pages, and they belong on a lane. Ceiling for
this room: ~80 ms of the 155.

### 3.6 Collect: the backfill walk (17 ms, serial, in front of everything)

On the retention-token path `collect_drained` still runs `backfill_dir`
over the whole root — a second full `readdir` walk (`__getdirentries64`
6–8, path joins, per-directory sort) — to find files the scan's list
"misses"; it reads zero files when retention is complete. The perf index
has no entry for it. Two levers, in order: the scan reports whether its
walk was complete (same IGNORE set, extension gate, scope) so the backfill
is skipped by contract; failing that, the walk runs on a lane concurrent
with Stage A over the provided sources, and any late file joins as a final
chunk before the fold (sources are path-sorted after backfill today, so
order is unchanged when it finds nothing, and changed identically when it
does). A ≥ 15 ms serial lever that clears the solo LAND bar on its own.

---

## 4. Determinism doctrine

### 4.1 The commit contract

The serial compiler pushes into eight sinks (`wants`, `recipes`,
`diagnostics`, `authored`, `sinks`, `session` facts, `recipe_bindings`,
`tentative`, plus `selections`) in a fixed schedule:

```
analysis facts (source order)  →  parse errors (source order)
→ per-file extract products (source order, walk order within a file)
→ harvest mint  →  recipe selections
→ resolve wants (want order; facts + diagnostics per want)
→ container-root check  →  recipes compile
→ plans (decl order; is_duplicate dedupe against ALL prior diagnostics;
   seen_keys first-seen; atoms inserted in decl order)
→ emit  →  proof render  →  partition
```

The parallel compiler produces per-unit ledgers and **replays this exact
schedule** on the caller. Dedupe that depends on history (`is_duplicate`,
`seen_keys`) is computed on the caller during replay, never on a lane.
First-seen filtering of declarations happens before dispatch (only
first-seen decls resolve; failed decls still occupy their key — the spike
got this right). No stage may reorder, sort, or "canonicalize" as a
substitute for replay. The §3.5 fork (recipes ∥ proof ∥ emit) joins in the
serial order; each branch's output is a value, not a side effect.

### 4.2 Proof obligations (all required, each a test)

| id | proof | why |
| --- | --- | --- |
| P1 | `lanes=1` staged pipeline ≡ legacy serial, byte-identical on every golden + 4 scales (E1) | one compiler |
| P2 | cross-N identity: `Fixed(1)`, `Fixed(2)`, `Fixed(3)`, `Fixed(8)`, `Fixed(16)` produce identical `styles.css`, `runtime-data.mjs`, diagnostics (text + order), compiler channel | schedule independence |
| P3 | 20× repeat at `Auto`, hash-identical | no racy memo |
| P4 | shuffled chunk completion (test hook that reverses/lags lane completion) → identical output | commit order, not arrival order |
| P5 | atom insertion-sequence identity: record the serial `AtomSet::insert` sequence (wants, then plan decls, including no-op re-inserts) and assert the parallel commit's sequence is identical; `AtomSet` construction/growth policy unchanged (no `with_capacity`) | utility emission ties resolve by hash-iteration order (§1.5); a shuffled-wants test is expected to *fail* today and documents why D6 exists |
| P6 | `TraceModule.exports` (std `HashMap`) never iterated into output; if it is, switch to `BTreeMap` | RandomState leak |
| P7 | fallback re-parse counters on the bench load = 0 for identity/styletrace, = counted origin set for the value graph | no silent serial work |
| P8 | import refs from record ≡ `ScopeTable::import_refs()` on every golden | §3.1 |
| P9 | value-graph cycle fixtures (`tests/cases` with import cycles) identical across N | chase order pinned serial |
| P10 | `pnpm agentrs c atomic`, `v atomic`, `agentneo run` green; `agentrs q` 0 violations, no new warnings; files ≤ 365 lines | doctrine |

### 4.3 Hazards found in the spike and the tree

- Utility emission ties break on `FxHashSet` iteration order (§1.5).
  This already couples `styles.css` bytes to want order and to the
  `rustc-hash`/`hashbrown` versions; lanes make the coupling visible, not
  worse, provided the commit replays the sequence. Recipe emission is
  safe: `group_recipe_atoms` sorts on a key ending in the unique selector.
- Diet plans return one placeholder iff any atom resolved
  (`insert_diet_atoms` returns non-emptiness, not novelty) — lanes can
  compute it; atoms still insert on the caller in decl order.
- `ValueGraph` origins refined from bytes when programs are absent: the
  spike passed `retained: &[]` and treated every file as streamed. Correct
  by construction, but every imported origin re-parses — hence §3.2's
  census.
- `IdentityGraph::from_shared` keys the memo by raw path; `export_map`
  looks up by whatever `resolve()` returns. A key mismatch is a silent
  re-parse (P7 catches it).
- `phase_parallel.rs` is 362 lines, three under the 365 warning; the
  design above splits along stage boundaries before anything is added.
- On a box with ≥ 8 hardware threads the golden suite *already* takes the
  lane path: `ATM-SITE-55` (13 styling files) and `ATM-SITE-31` (8) clear
  the `files < 8` threshold, so `cargo test` at the spike runs them on
  16 lanes. Nobody has recorded whether that suite is green (pre-flight
  H2). Until the `Lanes` knob exists, P1 cannot be tested at all and
  golden coverage of the parallel path is an accident of the host's core
  count.

---

## 5. Measurement contract for a multi-core claim

Everything in `VOYAGE.md` §Standing protocol and the agent-perf bars
applies unchanged: bench lock, base pin, 8 interleaved pairs, warmups
unscored, sha-verified binaries, 4-scale byte identity, `agentrs q`.
Cores add these; each one would have caught the spike:

1. **Two headline numbers, always.** `sync` at `Lanes::Auto` and at
   `Lanes::Fixed(1)` on the same binary. `Fixed(1)` must not regress vs
   the serial tip by more than 2 % (spawn-free path, ledger overhead only).
   A landing that wins at 8 and loses at 1 is a regression.
2. **CPU-efficiency guard.** Total process CPU (`getrusage` in the bench
   worker; `threadCPUDelta` summed over threads in the flame) ≤ **1.3 ×**
   serial CPU. The spike measures 1.38× at strided F8/T8 and 2.26× at
   F16/T16; the per-lane duplication in §3.4 is the difference. Wall wins
   bought with CPU blowup are regressions on laptops and CI.
3. **Peak HW guard as today (~280 MiB band).** Every lane count > 1 in
   §0.2 breaches it (+54 .. +158 MiB). S0.4 attributes the delta (per-lane
   graph copies, tail result vectors, transient arenas) before Stage 1
   claims a landing; the design's answer is §2.4 plus chunked tail results
   committed as they arrive rather than held as 90k-element vectors.
4. **Lane telemetry.** Per-lane busy ms, barrier wait ms, chunk counts,
   fallback re-parse counts — reported through the compiler channel and
   the alloc-trace instrument, which must become lane-aware (per-lane
   counters folded at commit; today's `PhaseGuard` is one global phase).
   The room partition in §B lands as `agentrs flame --rooms` so the next
   wave reads rooms, not function lists.
5. **Lane sweep in Stage 0 and after every landing:** `Fixed(1,2,4,8,16)`
   medians on the bench box, plus a 4-lane number as the CI/laptop proxy.
   The `Auto` cap is set by this table (today: 8), never by `num_cpus`.
6. **Environment hygiene.** The harness refuses to time when
   `MallocNanoZone` is set, and asserts the Nano leaves (`nanov2_*`) are
   present in the capture; agent shells spawned by Cursor carry
   `MallocNanoZone=0` and inflate compile by 35 %. IDE subshells also
   inherit background QoS (AGENTS.md §3); all timed runs go through
   `pnpm agent`/`pnpm agentrs`. Setting `QOS_CLASS_USER_INITIATED` from
   Rust is macOS-only FFI (`unsafe`) — not done; measured once on Apple
   silicon before Stage 1 closes (S2.3).

---

## 6. Measured basis and remaining unknowns

Measured in this session (§B): the serial room table (two pinned
captures), the lane sweep (one capture per cell, ±5 ms — census grade, not
verdict grade; the 8-pair rule applies before any landing claim), the CPU
series, the HW series, the strided-vs-contiguous comparison, and the
`MallocNanoZone` confound (three cells reproduced).

Still to measure before Stage 1 is briefed (Stage 0):

- Distinct value-graph origins refined per compile (bench + one real repo)
  — decides whether §3.2's bounded re-parse is ≤ 10 ms or Stage 3 opens.
- HW attribution of the +94 MiB at strided F8/T8.
- The 22 ms "assembly other" room, split.
- Apple-silicon sweep (P/E known to the scheduler; QoS-driven), which sets
  `Auto` there.
- Whether recipes ∥ proof ∥ emit joins under the residue's 80 ms ceiling
  or contends on the allocator (the Nano zone is per-CPU; expect fine).

---

## 7. Beyond compile — scan and the allocator

### 7.1 Scan: 349 ms, 83 % kernel, one lever HQ owns and one probe

Why every file is opened: constants doctrine folds every file's bag
(`export const FACTOR_7 = 224` in a dead util joins the project bag),
styletrace entries are needle-gated *after* the read, and C1 keeps parse
failures alive. None is decidable pre-open — `PERF-W2-SHOT2` (17
candidates, KILLED) stands. **Fewer opens is therefore a product-contract
decision** (manifest, cache, or a narrower include contract), not a lane
anyone can brief. Filed as Decision D3 below. Nothing in this plan
smuggles it.

What the research says about *more lanes on the open path* (§A): macOS
open/read/close of distinct warm files scales ~1.7–2.3× at 2–4 native
threads and regresses at 8+ (APFS directory/volume locks; Lemire M2: 1t
100 ms → 2t 75 → 4t 90 → 8t 240; M1 Pro: 73/44/32/78/127 for 1/2/4/8/16).
The recorded regressions here — "async + 64-worker" — were JS-issued
through libuv with per-file task overhead, before F1 made the walk native.
A **2–4 lane native batch-open** is an untested cell with a plausible
−100..−170 ms and an equally plausible 0.

Doctrine: counts first. **Probe S3.1** is a standalone Rust binary (no
product code) that opens+reads the bench tree at 1/2/4/8 threads, batched
paths, one `read` per file, no `fstat`/`mmap`/`F_NOCACHE`. Bar: ≥ 1.4× at
2–4 threads on the bench box and on one Apple-silicon machine, sys-time
inflation ≤ 1.5×. Below the bar: CUT with the table, and the user's read
("the lever is fewer opens, not more workers") is filed as proven. Above
it: a scan-lane brief with the same ledger discipline (paths in input
order, bytes committed in walk order, retention token unchanged).

### 7.2 Allocator: the Nano zone is worth 165 ms on this load

§0.2.1 is also an allocator experiment: Apple's Nano zone (≤ 256 B,
per-CPU, mostly lock-free) versus the magazine path is **486 vs 656 ms**
of compile. Small-object allocation speed is a first-order term here, and
the reason the CPU guard matters: anything that pushes lanes off the fast
path (magazine depot recirculation under 16 threads, cross-thread frees)
shows up as wall. Peers ship `mimalloc-safe` behind Rust's `GlobalAlloc` in
their `.node` (rolldown, oxc napi, swc, rspack); reported gains 3–13 %
wall; rustc's mimalloc trials paid +8..33 % max-RSS (v2), v3 uses 4 MiB
segments. Under the HW guard that is a real risk. Order: (1) land lanes on
`System`, read the CPU series; (2) A/B `mimalloc-safe` (`skip_collect_on_exit`,
Linux `local_dynamic_tls`, never `override`) under the HW guard, 8-pair, at
both `Fixed(1)` and `Auto`. It is a serial lever too; it is not a
substitute for §3.

### 7.3 Not worth it (now): parse during scan

Overlapping Stage A with scan's kernel time would require lanes to
survive the `scan_system → compile(token)` seam holding arenas. The gain
is bounded by Stage A's *parallel* time (~30 ms at 8 lanes) and the
seam-scout CUT already priced the 1-crossing floor at ~0. Revisit only
if, after Stage 2, the front is the residue. Filed as filler.

---

## 8. Stages and gates

Sequenced so every stage has a measured gate and nothing lands on faith.
One arc per commit, pinned bench report with it, scoreboard row same tick
(VOYAGE closeout applies).

### Stage 0 — instruments and proofs before code (no product changes)

| id | work | gate |
| --- | --- | --- |
| S0.1 | Land the room partition as `agentrs flame --rooms` (marker table = §0.1 rooms + spike stages); re-run on the tip; split "assembly other" | table reproduces §0.1 ±3 ms |
| S0.2 | Origin census: distinct value-graph origins refined per compile (bench load + one real repo); styletrace edge-target parse count | decides §3.2 stage |
| S0.3 | Determinism harness: P2–P6 as tests against the *serial* tip (P5 may already fail — then it is a Stage 1 bug, found early) | green or filed |
| S0.4 | Bench worker: CPU ms series, lane telemetry fields, HW attribution; alloc-trace lane-aware; harness refuses `MallocNanoZone` | tooling landed |
| S0.5 | `Lanes` request knob + sweep harness (`Fixed(n)` 1/2/4/8/16 table). Entry: `modules/atomic/src/types.rs` (`CompileRequest`), `modules/atomic/native.rs` (napi seam), `reference-neo/src/sync/native.ts` (TS request type), bench worker | exists; goldens pin `Fixed(1)`/`Fixed(3)`/`Fixed(8)` |
| S0.6 | HQ adopts this document; `VOYAGE.md` §Heavy tracks amended in writing | **DONE 2026-09-22 — ban lifted** |

### Stage 1 — the spike, finished (measured −150 ms compile; est. −190)

| id | work | entry | measured / expected |
| --- | --- | --- | --- |
| S1.1 | Ledger refactor: lanes return chunk ledgers, caller folds; chunks pulled by cursor; no per-file mutexes; stage modules ≤ 365 lines | `phase_*` → staged modules | striding alone −114 at F8 (§0.2) |
| S1.2 | Build once: `IdentityIndex` + shared analysis ctx; caller's own shard sized like any other chunk | `extract/identity.rs`, `phase_walk.rs` | CPU 1.38× → ≤ 1.15×; −11 wall |
| S1.3 | Import refs from `ModuleRecord`; delete `store_refs` round (P8) | `module-graph/record`, `phase_walk.rs` | −1 barrier round |
| S1.4 | Keep the spike's `TraceModule` fold + `resolve_prepared`; delete the per-entry `stat` and the eager staged map; count misses (P7) | `hosts/mod.rs`, `hosts/entries.rs` | hosts 20 → ~9 (walk stays) |
| S1.5 | `ValueGraph::new` over owned records, census folded per lane; origin re-parse bounded and counted (P7, P9) | `extract/resolver/` | 18 → ~6; origins per S0.2 |
| S1.6 | Tail lanes under the §4.1 contract: lookup keys on decl lanes, chunked results committed as they arrive | `assembly.rs`, `runtime/plan_pool.rs` | replay 34 → ~15; HW −? (S0.4) |
| S1.7 | `Fixed(1)` spawn-free path; P1 differential; legacy serial to `cfg(test)` | `types.rs`, `lib.rs` | one compiler |

Gate to land Stage 1: P1–P10 green; barrier ≤ 30 ms measured; `Auto`
8-pair sync improvement ≥ 150 ms vs the serial tip; `Fixed(1)` within 2 %;
CPU ≤ 1.3×; HW within the band or D2 re-set with the attribution; lane
idle ≤ 15 %.

### Stage 2 — the residue and the collect (est. −95 ms)

| id | work | expected |
| --- | --- | --- |
| S2.1 | Drops off the critical path: owned sinks/results handed to a scoped drop lane during serialize | −20..−28 |
| S2.2 | Recipes ∥ proof ∥ emit fork with ordered join (§3.5) | −25..−35 |
| S2.3 | Backfill walk skipped by scan-completeness contract, else overlapped with Stage A (§3.6) | −15..−17 (serial lever; clears solo LAND alone) |
| S2.4 | Apple-silicon lane sweep + QoS observation; set `Auto` there | table filed |

### Stage 3 — probes that may become lanes

| id | work | bar |
| --- | --- | --- |
| S3.1 | Scan open-path microbench (§7.1), then scan lanes if it clears | ≥ 1.4× at 2–4 threads, sys ≤ 1.5× |
| S3.2 | `mimalloc-safe` A/B (§7.2) | 8-pair win at both N, HW in band, CPU flat |
| S3.3 | AST-free origin bake (§3.2) | only if S0.2 origin cost > 10 ms |
| S3.4 | Parallel emit sort | only under D6 |

### Convergence

Stage 1 landed and one full wave green ⇒ delete `run_parse_serial`,
`FORCE_SERIAL`, and every duplicated serial helper; goldens and pins are
the reference. Update `modules/atomic/README.md` pipeline section with the
staged model (architecture prose, no file tables).

---

## 9. Do-not-fire (this track)

- `unsafe impl Send` self-cell tricks to move AST+arena; sharing
  `&Program`; anything that needs E0.1/E0.2 to be false.
- `rayon`/global pools, `AsyncTask`, a second thread pool beside libuv.
- Contiguous ranges over path-sorted input (§0.2.2); `num_cpus` or
  `available_parallelism().min(16)` as policy; more lanes than the
  measured knee.
- Per-lane rebuilds of anything derived from the whole input (§0.2.3).
- Sorting or canonicalizing output to hide arrival order (oxlint/Biome
  accept completion order or sort; we replay).
- Parallelizing the value graph or any demand-driven memo with cycles.
- Per-file `Mutex` slots, `Barrier` choreography inside stages.
- Timing anything from a shell that carries `MallocNanoZone` or
  background QoS.
- 64-worker anything; JS-issued parallel opens; parallel `readdir`
  storms past 4 on one APFS volume.
- `mimalloc` `override`, jemalloc on macOS (zone registration), snmalloc
  without a re-benchmark.
- Special-casing the bench load, `FACTOR_*`, or the generator's shape.
- Any landing that wins at `Auto` and loses at `Fixed(1)`.

---

## 10. Decisions HQ owns

| id | decision | default if silent |
| --- | --- | --- |
| D1 | Adopt CORES.md; amend `VOYAGE.md` §Heavy tracks (ban → this contract) | **ADOPTED 2026-09-22 — ban lifted, this contract governs** |
| D2 | `Lanes::Auto` cap (8, the measured knee) · CPU guard 1.3× · HW band: hold ~280 MiB or widen with the S0.4 attribution | as proposed; HW band holds |
| D3 | Scan "fewer opens" is a product contract (manifest / cache / include narrowing) — commission or decline | declined; S3.1 probe is the only scan work |
| D4 | Allocator swap permitted as a probe under the HW guard | permitted as S3.2 |
| D5 | Two-headline reporting (`Auto` + `Fixed(1)`) becomes the scoreboard format | adopted |
| D6 | Make utility emission a total order (content tie-break after `CascadeKey` + conditions). One-time sortshape change (67 ties reorder, bytes move once); afterwards output is independent of insertion order, hasher version, and commit scheduling, and the emit sort can shard | declined; P5 sequence identity carries the load |
| D7 | Re-run the spike agent's bench and flame in a clean environment before any further spike work is judged; agent shells get `unset MallocNanoZone` in their setup | recommended |

---

## 11. Handoff

### 11.1 State of the tree at handoff (2026-09-22 17:30)

**SUPERSEDED 2026-09-22: landed as `b0c19724b` (see §12).**
`spike/cores-lanes` remains as the pre-stabilization record only.

- Base pin: `757a607bc` on `reference-system` (the serial tip; 925 ms
  sync, 486 compile, pinned bench `7c3d392649f0`).
- The spike is **uncommitted** in the main worktree: 15 modified tracked
  files (`git diff -- packages/reference-rs`, 741 lines) plus six untracked
  modules (`extract_parallel.rs`, `phase_lane.rs`, `phase_parallel.rs`,
  `phase_walk.rs`, `resolve_pool.rs`, `runtime/plan_pool.rs`). Agents
  working in worktrees cannot see uncommitted files, so the same content
  plus this document is filed on branch **`spike/cores-lanes`** (one
  commit on `757a607bc`, byte-identical to the main worktree at 17:45;
  `reports/latest` deliberately excluded). Crews start from
  `git worktree add /tmp/<crew> spike/cores-lanes`. The branch is a
  reference, never a merge source for `reference-system`; if the main
  worktree's spike changes again, re-file (`git branch -f`) before
  briefing.
- `reports/latest` (941 ms, HW 367 MiB) was measured under
  `MallocNanoZone=0` and is not comparable to any pin (§0.2.1). Its bundle
  bytes match the tip exactly (raw and gzip), which is necessary for
  identity but not sufficient (§4.2).
- The spike has not been through `agentrs q`, and its `cargo test` /
  vitest state is unrecorded (§4.3, last hazard).
- Census artifacts (sweep captures per cell, `rooms.py`, `partition.py`,
  `callers.py`, `cpu.py`, `sweep.sh`) are in `/tmp/cores-census` — ephemeral;
  §B and the marker table below are the durable record.

### 11.2 Pre-flight (every crew, before any timed run)

| id | step | why |
| --- | --- | --- |
| H1 | `unset MallocNanoZone` in the shell; confirm `env \| grep -c Malloc` prints 0 | §0.2.1 — the flag inflates serial compile 35 % and every agent shell inherits it |
| H2 | On the spike tree: `pnpm agentrs c atomic && pnpm agentrs v atomic && pnpm agentrs q packages/reference-rs/modules/atomic/src` — record pass/fail and the violation count in the brief | nobody has; two goldens already run on 16 lanes here |
| H3 | Rebuild the `.node` and re-bench clean (`pnpm bench:neo -- --scale enterprise --runs 3`) — expect ~816 ms for the spike as-is, ~925 for the tip | replaces the invalid 941 |
| H4 | Bench lock (`mkdir /tmp/swarm-bench-lock`), base pin recorded, binaries sha-asided — the agent-perf §4/§6 protocol unchanged | one box, one stopwatch |
| H5 | All timed runs through `pnpm agent` / `pnpm agentrs` (QoS), never a raw subshell | AGENTS.md §3 |

### 11.3 Where to start, and what blocks what

Stage 0 is instruments and is parallel across crews: S0.1 (rooms), S0.3
(determinism harness — expect P5 to fail on the *serial* tip; that is the
D6 evidence, not a crew failure), S0.4 (bench CPU/HW/lane telemetry,
Nano refusal), S0.5 (`Lanes` knob) have no dependencies on each other.
S0.2 (origin census) gates S1.5 only. S0.6 (HQ adoption, D1) gates any
Stage 1 *landing*, not Stage 1 work in worktrees.

Stage 1 order: S1.1 (ledgers + strided/pulled chunks — the −114 already
measured) → S1.2 (build-once) → S1.3/S1.4/S1.5 (barrier, independent of
each other) → S1.6 (tail contract) → S1.7 (`Fixed(1)` path, P1). One
hypothesis per crew, fences by function per the agent-perf brief
skeleton; the entry files in §8 are the fences.

Read order for a fresh agent: §0 → §2 → §8 → §4 → §5 → §11, then the §3
seam for the assigned topic, then §A only if the physics is doubted.

### 11.4 Done-when

Stage 1 is done when the §8 gate holds on the exact landing tree:
P1–P10 green, barrier ≤ 30 ms, `Auto` 8-pair ≥ −150 ms vs `757a607bc`,
`Fixed(1)` within 2 %, CPU ≤ 1.3×, HW attributed and inside D2's answer,
lane idle ≤ 15 %, `agentrs q` 0 violations, committed bench pin +
scoreboard row + flame refresh in the same tick.

## 12. Landing record — stabilization + stride (`b0c19724b`, 2026-09-22)

### 12.1 What landed

Commit `b0c19724b` on `reference-system` (28 files, +2863/−141): the
spike stabilized and strided. Review had ruled the spike UNSTABLE
(barrier hang, silent poison recovery, uncited Send/Sync); an overnight
mission closed all three P0s plus the conservative lane policy, and a
squeeze crew added strided shards on the stabilized tree:

- Join-based phase rendezvous — lane panics surface as `Err` naming
  lane+stage, never hang the sync call. No `Barrier` remains.
- Typed slot states — partial merges refused (build-local, commit-once).
- Send+Sync audit with compile-time asserts; arenas never cross threads.
- `Lanes` policy (`lanes.rs`): `Auto=min(parallelism,8)`, serial
  thresholds (styling<64 AND wants<4k), single-flight `PoolGuard`.
- Strided shards (lane *k* owns *k, k+W, …*), input-order commit untouched.

### 12.2 Numbers (locked interleaved A/B/C, seed 7, bench:neo enterprise)

| arm | sync med (n=8) | peak HW | vs spike |
| --- | --- | --- | --- |
| A spike (contiguous-16) | 795.5 | 425.1 | — |
| B stabilized (contiguous-8) | 828.5 | 367.7 | +4.1% |
| C **landed (strided-8)** | **762.0** | **387.2** | **−4.2%** |

8/8 rounds order C<A<B, ranges non-overlapping (C max 772 < A min
787). Vs the serial tip pin (872/281): **−110 ms (−12.6%)**,
+106 MiB. Mechanism confirmed: assignment, not lane count, was the
gap — rendezvous amplifies the slowest lane ×3 rounds, stride-1
minimizes that max. Full table: `docs/perf/cores/overnight/REPORT-stride.md`.

### 12.3 Proof filed

- `pnpm agentrs c` workspace green (atomic 656: 643+1+7+5).
- `v atomic` 301/301, `v styletrace` 28/28 on the landing tree.
- `q` 0 violations, zero NEW vs tip (75/57 = `757a607bc` exactly).
- Goldens byte-identical; bundle bytes exact at all scales.
- Adversary 19/19 HOLDS: 1/2/3/8/16 sweep byte-identical (P2
  evidence), 20× repeat hash-identical (P3 evidence), panic injection
  → prompt `Err`, hang guards never fired.
- Packet: `docs/perf/cores/overnight/` (4 crew REPORTs, INTEGRATE,
  VERIFY with GO, BREAK-REPORT, MISSION-REPORT, REPORT-stride).

### 12.4 Stage status after landing

| id | status |
| --- | --- |
| S0.6 / D1 | DONE — ban lifted, this contract governs |
| S1.1 | SHARDS DONE (stride), ledger refactor still pending |
| S0.5 | RUST SIDE DONE (`lanes.rs`); napi seam + TS request type pending |
| S0.3 | P2/P3 evidence filed; P5 insertion-sequence test still open |
| §5 HW band | OPEN — 387 vs ~280; needs D2 answer with S0.4 attribution |
| §5 CPU guard | UNMEASURED — needs S0.4 CPU series |
| F1 / F4 | CARRIED — tail `resume_unwind` asymmetry; `lock_published` silent recovery (safe today) |
| Stage 1 gate | OPEN — barrier ≤30, CPU ≤1.3×, idle ≤15% unmeasured; next slice is S1.2 build-once |

---

## A. Research grounding (external, 2026-09-22)

Filed by five research crews; primary sources only, summarized here.

- **oxc 0.115 thread model.** `Allocator: Send + !Sync`; `Vec<'a,T>`
  stores `&Bump`; `Program` carries `Cell<NodeId>`; `AllocatorPool` behind
  the `pool` feature (`get()` → guard, `reset` on drop); oxlint parses per
  file on rayon with a pooled allocator and streams diagnostics in
  completion order (a stable-sort PR was closed unmerged). Parser
  designed for parallel files (PR #2340). Arena ≈ 5–8× source bytes.
  docs.rs/oxc_allocator/0.115.0 · oxc `crates/oxc_linter/src/service/runtime.rs`.
- **macOS many-small-file I/O.** APFS directory enumeration serializes
  (Szorc 2018, OpenRadar 45648013); distinct-file opens scale ~2× at 2–4
  threads and regress at 8+ (Lemire 2025; Lobsters M1 Pro dual-boot;
  ripgrep #2925, discussion #2472: `-j4` beats default on macOS). Batch
  paths per task; one `read` of known length; skip `mmap`/`F_NOCACHE`.
  Linux opens ~3–4× cheaper single-threaded.
- **Allocators.** libmalloc: nano ≤ 256 B, magazines per-CPU with own
  locks, large path under zone lock. `mimalloc-safe` is the napi-rs
  pattern (rolldown, oxc napi optional, rspack v3, swc); never `override`;
  Windows unload and multi-`.node` TLS (mimalloc #1301) are the known
  sharp edges; rustc trials: −4 % instructions, +8..33 % max-RSS (v2).
- **N-API threading.** Pure-Rust threads inside a sync `#[napi]` call are
  fine; only the JS thread touches `napi_env`. `AsyncTask` runs on libuv's
  4-thread pool and adds queue/settle latency with nothing to overlap.
  Rayon global pools never terminate before exit; `dlclose`/worker unload
  is the sharp edge; `std::thread::scope` is structured and pool-free.
  Spawn ≈ 5–20 µs. Indexed `collect` preserves order; `par_bridge` does not.
- **Prior art.** esbuild/rolldown: parallel scan → serial link fixpoint →
  parallel print with order restored by graph index. Tailwind Oxide:
  per-file candidates then `par_sort_unstable` dedupe. Biome: collect,
  `sort_unstable`, then handle; diagnostics sorted by severity/path. rustc
  `-Z threads`: 8 threads ≈ 1.7× front-end, memory +35 %, cycle diagnostics
  nondeterministic under shared memo (MCP #1005). Panda v2 compile is
  fully serial by its own design notes ("Parallelism ... not built").

Internal grounding: `PERF-W2-SLICE1B` (E0.1–E0.5),
`docs/archive/VOYAGE-WARPDRIVE.md` §10 (Objective 3 memo requirements),
`docs/perf/waves/wave-4/report-swarm-reflame7.md` (rings),
`docs/evidence/flamegraph/enterprise-repro7a,b` (the serial captures
partitioned in §0.1), `docs/evidence/alloc/enterprise-alloc3/summary.md`,
`docs/perf/waves/wave-2/panda-v2-threading.md`, `sync-perf.html`.

## B. Census procedure (reproducible; nothing here lands)

1. **Serial rooms.** `agentrs flame` captures at the tip
   (`enterprise-repro7a/b`, procedure `agentrs-flame/3`): samply profile +
   presymbolicated sidecar + same-run phase marks. Symbolicate frames
   through the sidecar (lib by `debug_id`, address → `rva` range), restrict
   to the compile window, assign each main-thread sample to one room by a
   marker table (assembly sub-rooms first, then parse-phase rooms), sum
   weights (1000 Hz ⇒ weight ≈ ms). Two captures agree within ±3 ms.
2. **Sweep.** Detached worktree of the tip at `/tmp/cores-sweep` with the
   spike's `git diff` + untracked files applied; a worktree-only env knob
   in `extract_parallel::worker_count` (`CORES_LANES_FRONT`,
   `CORES_LANES_TAIL`); `napi build --release` into a private
   `CARGO_TARGET_DIR`; `pnpm agentrs flame -- enterprise --no-build --out
   <dir>` per cell with `env -u MallocNanoZone`. Control: a second worktree
   of the clean tip built the same way, same session (486/487 ms, matching
   the pinned 488). "Strided" = `phase_parallel::run` handing lane *k* the
   indices *k, k+W, …* (input-order commit untouched).
3. **CPU series.** Sum `threadCPUDelta` over all threads of the worker
   process inside the compile window; ratio to the serial capture.
4. **HW.** `rssPeakHw` from the bench worker record in each capture's
   `meta.json`.
5. **Confound check.** Repeat F1/T1 with and without `MallocNanoZone=0`
   (656 vs 491); confirm the leaves switch between `tiny_malloc_*` and
   `nanov2_*`; match the spike's filed report (941 ms, HW 367) against the
   Nano-off cells (971–973 ms, HW 368–370).

### B.1 Room marker table (the S0.1 spec)

Each compile-window sample on the main thread is assigned to the **first**
row whose regex matches any frame on its stack, top to bottom. Assembly
sub-rooms come first because they nest under `AssembleCtx::finish`; the
lane-stage rows come before the serial-phase rows so the same table reads
both the tip and the spike. Weight ≈ ms at 1000 Hz.

| room | regex (any frame) |
| --- | --- |
| wait | `__psynch_cvwait\|__ulock_wait\|Barrier::wait\|thread::park` |
| plans: resolve inside build_keyed | `resolve_with_unique_diagnostics` |
| plans: lookup-key serialize | `serialize_lookup_key` |
| plans: rest of build_keyed / replay | `PlanBuilder::build_keyed\|plan_pool` |
| wants: resolve / replay | `atomic::resolve::resolve_want_with\|resolve_pool\|AtomSet::insert\|build_atom_set` |
| recipes compile | `atomic::recipes::compile_one\|atomic::recipes::compile` |
| emit: write_utilities | `stylesheet::cascade::write_utilities` |
| emit: rest | `stylesheet::emitter::build_stylesheets_with\|stylesheet::` |
| proof render | `diagnostics::proof` |
| partition / serialize / wire | `partition_channels\|DiagnosticChannels\|SourceCatalog\|reference_virtual_native::atomic::serialize\|serde_json::ser\|atomic::wire` |
| drops | `drop_in_place` |
| assembly: other | `AssembleCtx::finish` |
| collect sources (backfill walk) | `atomic::sources::collect_checked` |
| barrier: styletrace | `hosts::resolve\|styletrace::\|open_trace` |
| barrier: value graph build + fold | `ValueGraph::new\|fold_index\|phase_parallel::publish\|LocalConstants::merge\|resolver::staging` |
| barrier: import resolution | `ValueGraph::resolve_file_imports\|ValueGraph::resolve_binding\|ValueGraph::value_of\|refined_file` |
| barrier: identity | `IdentityGraph` |
| commit: outputs / facts / errors | `commit_outputs\|FileOut::commit\|report_parse_errors\|extend_facts` |
| commit: harvest | `harvest_pool\|harvest::mint\|HarvestPool::merge\|harvest::literals::collect_pool` |
| commit: recipe selections | `selection::resolve_all` |
| file: extract walk | `extract_parallel::extract_program\|atomic::extract::extract_with_context\|ExtractVisitor` |
| file: bindings + scope | `collect_bindings_with_identity\|extract::scope::collect` |
| file: analysis | `analysis::source_facts\|diagnostics::analysis::` |
| file: record / fold (constants, module record, trace) | `phase_lane::record\|stage_streamed\|record_retained\|stream::merge_constants_ordered` |
| file: parse | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
| front: other (lane scaffolding) | `run_lane\|after_publish\|walk_retained\|walk_one\|store_refs\|thread::scoped::scope` |
| compile: other | `^atomic::compile$` |

Anything unmatched is reported with its leaf frame; on the tip that
bucket is ~44 ms of `madvise` / `_nanov2_free` / `memmove` under
`atomic::compile` directly — the phase-end drops. A sample's CPU-inflation
figure is the sum of `threadCPUDelta` over every thread of the worker
process inside the same window, divided by the serial capture's.
