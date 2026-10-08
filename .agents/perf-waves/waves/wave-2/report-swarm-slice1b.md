# swarm-slice1b REPORT: Shot 3 slice 1 — A1 parallel parse/constants/staging (respawn)

## Verdict

**CUT — cause: HQ directive banning multithreading on all tracks, effective
immediately.** Received mid-implementation, before any gated execution. No
code was built, no test was run, no benchmark was taken: this session
executed zero `cargo`/`pnpm`/`node` commands (the bench lock was held by
other crews throughout) and performed reads plus implementation edits only.
The edits were reverted at close-out; the tree is at the base pin with no
tracked diff. The E0 static findings below are the filed evidence; they
stand on registry-source proof, not on measurements.

Base: `5844b24a81a528ace14fab63e908793a6829a874` (`git rev-parse HEAD`
verified at start and at close-out).

## Diff

None at close-out (reverted). During the session the following was written
and then discarded unbuilt and untested: a new `atomic/src/a1.rs` driver
(~260 lines: main-thread retained lane overlapped with streamed-staging
workers, fixed 64 input-index shards, serial ordered commit), a `lib.rs`
hookup in `run_parse_phase`, `stream.rs` legacy preserved as the
`cfg(test)` E1 reference with per-file capture, and a `Debug` derive on
`StreamedSource`. No measurement was ever taken on any of it.

## Artifacts

- base `.node`: n/a (never built)
- cand `.node`: n/a (never built)
- Bench lock: never taken. CPU gate: never entered.

## E0 — Send/Sync + iteration audit (FILED EVIDENCE)

Toolchain: oxc 0.115.0 (workspace pin, `Cargo.lock`). Registry source:
`~/.cargo/registry/src/index.crates.io-*/oxc_{allocator,ast,parser}-0.115.0`.

### E0.1 — `ParserReturn<'a>`: `!Send` (PROVEN, kills retained-parse-in-workers)

Chain, each link read in registry source:

1. `Program<'a>` holds `body: Vec<'a, Statement<'a>>` (`oxc_ast` js.rs).
2. `oxc_allocator::Vec<'a, T>` is `vec2::Vec<'a, T, Bump>`, whose buffer is
   `RawVec<'a, T, A>` with a stored `alloc: &'a A` field
   (`oxc_allocator-0.115.0/src/vec2/raw_vec.rs:73-80`), i.e. `&'a Bump`.
3. `&'a Bump: Send` iff `Bump: Sync`. `bump.rs:434` carries
   `unsafe impl Send for Bump`, and a full-tree grep finds **no**
   `Sync for Bump` impl. So `Bump: Send + !Sync` (memo's claim confirmed),
   hence `&Bump: !Send`.
4. `oxc_allocator::Vec` has one manual impl, `unsafe impl<T: Sync> Sync`
   (`vec.rs:56`), and **no** `Send` impl — so the auto trait applies and
   the arena `Vec` is `!Send`.
5. Therefore `Program<'a>: !Send`, therefore `ParserReturn<'a>: !Send`
   (its other fields — oxc `ModuleRecord`, `Vec<OxcDiagnostic>`, spans,
   flags — are plain data, but one `!Send` field poisons the struct).

Consequence: `std::thread::scope`'s `spawn` requires the returned `T:
Send`, so a worker **cannot return a retained parse** to the main thread.
The memo's slice-1-as-specified (parallel retained parse feeding
downstream-on-main) is unimplementable without `unsafe`, which Warpdrive
§10 bans ("No `unsafe` ... may be introduced to force a pass").

### E0.2 — `Program<'a>`: `!Sync` (PROVEN, kills program-sharing-to-workers)

`node_id: Cell<NodeId>` appears on essentially every AST node type across
`oxc_ast-0.115.0/src/ast/{js,jsx,literal,ts}.rs`, plus
`Cell<Option<ScopeId/ReferenceId/SymbolId>>` where applicable. Hence
`Statement: !Sync`, `Program: !Sync`, and `&Program` / `&body` cannot be
shared to workers (`&T: Send` iff `T: Sync`). The other lending direction
is dead too: `&mut Program` needs `Program: Send` (dead per E0.1). **Both
directions are closed**; retained per-file work (parse and constants
collect alike) is pinned to the thread that owns the allocator.

### E0.3 — Owned thread-crossing types: `Send + Sync` (PASS)

- `LocalConstants`: `BTreeMap`/`BTreeSet` over `String`, `AtomValue`
  (`Box<str>`/bool enum), `ObjectProp` (vec + map + bool),
  `ConstArrayElement`, `MutatedBinding` — all `Send + Sync`.
- `StreamedSource`: `ModuleKey(String)` + `ModuleRecord`
  (`Vec<ImportEdge>` of `String` enums, `ExportTable` of
  `BTreeMap`/`Vec`/`Option`, `BTreeSet<String>`) + `LocalConstants` bag —
  all `Send + Sync`.
- Error replay vecs `Vec<(String, Option<u32>)>`, `SourceSlot`
  (`Option<usize>` + bools) — `Send + Sync`.

### E0.4 — Hash-iteration / globals audit of A1 per-file paths (PASS)

- `constants/{collect,entries}.rs`, `mutate/`: `BTreeMap` only; the
  collector is a pure per-file visitor (`insert_scalar_leaves` order is AST
  walk order; `merge` folds `BTreeMap`s in key order, first-wins
  `or_insert` at `index.rs:243` — fold order load-bearing across files,
  hence the serial ordered commit).
- `module-graph/record/collect.rs`: pure per-file walk, `BTreeMap`/
  `BTreeSet` only, owned outputs.
- No `static`/`thread_local`/`HashMap`/`HashSet`/`RandomState`/`{:p}` in
  any A1 per-file path; helpers pure (`line_col`, `normalize_str`,
  `is_guard_expression` is a `matches!`).
- R9 vacuous for slice 1: A1 builds no `serde_json::Value`
  (`collect` yields `AtomValue`, records yield `String`s).
- `f64 Display` (`n.value.to_string()`) is deterministic per value (R4).

### E0.5 — Surviving scope (identified, NEVER MEASURED OR PROVEN)

E0 falsifies the retained-parse region, not the streamed region. The
surviving scope within A1, designed but unbuilt/unproven: a **main-thread
retained lane** (serial parse + per-file constants collect, allocators
parent-owned, no thread crossing) **overlapped** with **parallel streamed
staging** (workers own streamed files end to end — transient allocator,
parse, constants collect, `StreamedSource::collect`, error replay — and
return only owned `Send` outputs), followed by a **serial ordered commit**
(slot flags, retained parses in position order, per-source errors,
staged pushes in input order, `project.merge` folded in input order).
Fixed 64 input-index shards with `AtomicUsize` work-sharing; fixed worker
count, never `num_cpus`; N=1 inline path for E1; `resume_unwind` (no
`unwrap`) on join error. Wall estimate (unmeasured): `max(R, S/N/eff) +
commit` where R = retained lane, S = streamed work.

Track-level implication for the captain/memo-crew (filed for the record,
moot under the ban): **any slice needing `&AST` on workers is dead under
E0.1/E0.2** — slice 4 (A2 extract/analysis/harvest over retained programs)
cannot share `&Program` (`!Sync`) or take allocator+program ownership
(self-referential borrow). Only owned-data slices or fully worker-owned
file pipelines (parse → owned outputs, allocator dropped in worker) were
viable; fusing A1+A2 into worker-owned pipelines plus a
`ValueGraph`-from-owned-records rethink would have been a second design,
out of lane.

## E1 / E5 / A-B — NOT RUN

Planned and never executed (ban arrived first): E1 one-thread differential
(legacy serial reference vs N=1 driver, per-file + merged byte-compare),
E5-for-slice-1 (20× determinism, cross-N 1/2/4/8 byte-compare, 4-scale
byte-identity), and the standard 8-pair A/B at fixed N. The counts gate
(retained/streamed split on the enterprise load, which was to decide
GO/CUT on the surviving scope's ceiling) was never reached.

## Mechanism counts

None taken (no gated execution this session).

## Note on overlap

Sibling crew `swarm-slice1` holds the same hypothesis; per protocol there
was no coordination. This report is `swarm-slice1b`'s independent
close-out. If that crew builds memo-as-specified retained-parse
parallelism, E0.1/E0.2 above predict it cannot compile (or must resort to
banned `unsafe`).

## Verdict

**CUT (HQ directive ban on multithreading; E0 evidence filed above)**
