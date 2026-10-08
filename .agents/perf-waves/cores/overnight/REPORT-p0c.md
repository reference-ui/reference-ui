# REPORT-p0c: Send+Sync audit + fix

Mission `p0c-send-sync`. Base `spike/cores-lanes @ 494a35d65` (rev-parse
verified match). Work in `/tmp/cores-p0c` only; no push, no stash, no bench.
Rust/tests via `pnpm agentrs` with `MallocNanoZone` unset throughout.

## Verdict

AUDIT complete with cited proof; minimal FIX applied (4 files, +90/-10, no
new `unsafe`, no `#[allow]`). `c atomic` green; `q` clean on touched files;
`v atomic` 296/297 with the 2 failures byte-identical on a pristine baseline
(pre-existing spike breakage, zero new drift).

## Cited proof

All paths under `packages/reference-rs/modules/atomic/src/`.

1. `Shared` crossing threads is compiler-proven `Send + Sync`.
   `Shared` (phase_parallel.rs:39) and `Published` (:30) carry an explicit
   assertion at phase_parallel.rs:53. The spawn at :98 captures only
   `&Shared` plus a `(usize, usize)` range, so soundness reduces to
   `Shared: Sync`, which the assertion pins. `Published` crosses as
   `Arc<Published>` after publish; same assertion pins it.
2. Arena escape is impossible by type. `OwnedFile` (phase_lane.rs:27) has no
   lifetime parameter, documented at :24-26, with `Send + 'static`
   assertions at :42-48: no `Allocator` borrow or `Program` reference can be
   stored in a cross-thread slot. `parse_retained` ties its result lifetime
   to the lane allocators (`'alloc`, phase_parallel.rs:153-157), not to
   shared data. Allocators and parses are `run_lane` locals (:114-116) that
   never leave the lane frame; streamed files mint a per-file allocator that
   drops in-loop (:129-136). `RecordIn` is documented lane-local
   (phase_lane.rs:69-70): it borrows `&ParserReturn`, which is `!Send`
   (`Program` is `!Sync`), so the compiler rejects any crossing.
3. `Rc` is coordinator-confined. `ValueGraph.fs: Rc<AtomicFs>`
   (extract/resolver/mod.rs:86,94, built :120/:205) makes the graph `!Send`.
   It is built inside the coordinator's `run_lane` (phase_parallel.rs:121),
   borrowed there (:122), while every other lane passes `None` (:124);
   `resolve_all` runs on the coordinator only (phase_walk.rs:53). No
   `ValueGraph` value is captured by the spawn closure at any site.
4. `RefCell` is lane-confined. `IdentityGraph.memo: RefCell<…>`
   (extract/identity.rs:43) makes the graph `!Sync`. Each lane constructs its
   own inside `walk_retained` (phase_walk.rs:77, documented :72); the only
   other construction is single-threaded `settle` after join
   (phase_parallel.rs:299). No `&IdentityGraph` is ever shared.

## Breakage scenarios (mandate: >=3, each tested)

| id | breakage | test | result |
|----|----------|------|--------|
| S1 | `Shared`/`Published`/`OwnedFile` gain a non-`Sync`/`Send` field (data race) | compile-time assertions (phase_parallel.rs:53, phase_lane.rs:42); `parallel_matches_serial_across_lane_counts` (1/7/8/16 styling files) | PASS: build pins bounds; sheets+diags identical across lane counts |
| S2 | `Allocator`/`Program` escapes lane (use-after-free, cross-thread drop) | `'alloc` tie (phase_parallel.rs:153-157) + `OwnedFile: 'static`; same identity tests exercise retained+streamed arenas on 16 lanes | PASS: lifetimes enforced; no `reset()` exists to misuse |
| S3 | `Rc`/`RefCell` graphs shared across threads (race, `BorrowMutError`) | lane-confinement by construction (§3-4 above); identity/value-graph paths run in every lane-count identity test | PASS: per-lane/coordinator construction only; outputs identical |
| S4 | worker panics holding a slot lock (poison) or two lanes alias one slot | `lane_lock_recovers_after_poison` (poison via caught panic, then `phase_lane::lock`); `distinct_slots_fold_concurrently` (8 scoped threads, distinct slots) | PASS: poison recovered; 8/8 slots folded once, no deadlock |
| S5 | lane-count edges: empty input, 1 file, 7v8 threshold, uneven shards (OOB, `Barrier(0)`) | `shard_ranges_cover_edges` (0/1/7/8/9/16 × workers; exact-cover check) + `worker_count(0)==worker_count(7)==1`; identity tests at 1/7/8/16 | PASS: exact cover, no overlap/OOB; empty range returns `vacant_hosts` |
| S6 | thread panic before `barrier.wait()` deadlocks surviving lanes | UNTESTABLE without hanging the suite (a panicked lane never reaches the barrier) | UNRESOLVED (named, not dropped): current code only handles `panicked` parses as data, not thread unwinds |

## Changes

- `phase_parallel.rs` (364/365 lines): `Send+Sync` assertion (:53);
  `parse_retained` lifetime renamed to `'alloc` and tied to lane frame
  (:153-157). Zero runtime delta.
- `phase_lane.rs`: `OwnedFile` arena-free invariant docs + `Send`/`'static`
  assertions (:42-48); `RecordIn` lane-local doc. Zero runtime delta.
- `phase_walk.rs`: coordinator-only `ValueGraph` doc (:20) and per-lane
  `IdentityGraph` doc (:72). Comments only.
- `extract_parallel.rs` (tests only): `eight_files` delegates to new
  `styling_files(count)`; 4 new tests (`parallel_matches_serial_across_lane_counts`,
  `lane_lock_recovers_after_poison`, `shard_ranges_cover_edges`,
  `distinct_slots_fold_concurrently`).

## Gates

- `pnpm agentrs c atomic`: GREEN. 612 passed / 0 failed, incl. 5/5
  `extract_parallel::tests` (1 pre-existing + 4 new).
- `pnpm agentrs q` on all 4 touched files: 0 violations, 0 warnings.
  `cargo` emits 0 warnings mentioning touched files (23 pre-existing
  warnings all in untouched `recipes/`/`extract/` files).
- `pnpm agentrs v atomic`: 296/297 pass. The 2 failures
  (`ATM-SITE-54` spec-verify, `harvest-census` suite import of
  `@reference-ui/rust/namer`) reproduce byte-identically on a pristine
  `git archive 494a35d65` baseline (`/tmp/p0c-baseline`, same 296/297).
  `ATM-SITE-54` has 7 sources so it runs the serial path, which this diff
  does not touch (it fails in `spec.verify` before golden diff). Zero new
  golden drift: every other golden, incl. parallel-path cases, matches.
- No new `unsafe`, no `#[allow]` (enforced by `q`).

## Unresolved

- S6 barrier-deadlock-on-thread-panic: see table. A fix (e.g. `Barrier`
  replacement with panic-aware join, or catch-unwind per lane) is a
  behavior/design change beyond this audit's scope; flagged for Stage 1.
- `v atomic` baseline is red on the spike (above); the gate cannot go fully
  green until the spike's own `ATM-SITE-54`/packaging breakage is fixed.
