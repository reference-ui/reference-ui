# p0a: barrier hang → join-based phases

- Base pin: `spike/cores-lanes @ 494a35d65` (rev-parse matched before work started).
- Worktree: `/tmp/cores-p0a` (detached at base; changes uncommitted, no push/merge/stash).
- Outcome: the parallel phase no longer hangs on a lane panic. Panics surface as
  `compile()` errors naming the dead lane and stage. Serial path byte-identical.

## Root cause

`phase_parallel::run` fenced every round with a `std::Barrier` (4 waits across
`phase_parallel.rs` and `phase_walk.rs`) while the coordinator ran lane 0 inline.
`Barrier` never breaks on panic: one panicking lane left the coordinator and all
siblings blocked in `wait()` forever, so the sync napi call hung. The existing
`resume_unwind` after `join` was unreachable — the coordinator hung before joining.

## Fix (join-based rendezvous, single parse per file)

New module `phase_gate.rs`: per-lane channel pairs replace the barrier. Each lane
sends one report per round then waits for the verdict; the coordinator awaits one
report per lane per round (`recv` fails on lane death — never hangs) then
broadcasts `Proceed`/`Abort`, and joins every lane, dropping payloads instead of
resuming them. The coordinator spawns ALL lanes and runs none inline. Its own
panics are caught into errors after unwind drops the command senders (releasing
the lanes) and the scope joins. Three rounds subsume the old four waits
(record→publish→refs→resolve→walk); parses still borrow lane-local arenas, so no
re-parse and no cross-thread programs. `run`/`run_parse_phase` now return
`Result<_, String>`; the serial path is logic-identical (only `?` plumbing).

Files in `/tmp/cores-p0a`, `packages/reference-rs/modules/atomic/src/`:

- NEW `phase_gate.rs` — `Links`/`LaneGate`/`CoordGate`/`PhaseCmd`/`Stage`/`LaneFailure`
  plus the cfg(test)-only `panic_marker` injection seam.
- NEW `phase_merge.rs` — `publish`/`fold_index`/`build_graph` moved verbatim.
- NEW `phase_commit.rs` — `settle`/`commit_outputs`/`harvest_pool` moved verbatim.
- `phase_parallel.rs` — rewritten driver (`run`/`orchestrate`/`drive_rounds`/
  `await_reports`/`broadcast`/`abort`/`join_all`); `Shared` loses `barrier`.
- `phase_lane.rs` — gains the lane-side stage fns; `phase_walk.rs` — `after_publish`
  deleted, `store_refs`/`resolve_all`/`walk_retained` now round calls.
- `extract_parallel.rs` — cfg(test) `force_worker_count` hook (extends `FORCE_SERIAL`
  precedent); `lib.rs` — module decls + `Result` plumbing. No new `unsafe`, no
  `#[allow]`; largest touched file 242 lines.

## Breakage scenario table

Injection is content-marker based (`// p0a-panic-<record|refs|walk|publish>`), so it
is deterministic under parallel test execution. Every panic test compiles on a
helper thread with a 60 s timeout that fails loudly if the old hang returns.

| # | Scenario | Expectation | Test | Result |
|---|----------|-------------|------|--------|
| 1 | Panic before first rendezvous (lane 0, record) | `Err` naming lane 0 + record | `panic_before_first_rendezvous_surfaces_as_error` | PASS |
| 2 | Panic mid-phase, refs round (lane 1) | `Err` naming lane 1 + refs | `panic_mid_phase_refs_surfaces_as_error` | PASS |
| 3 | Panic mid-phase, walk round (lane 3) | `Err` naming lane 3 + walk | `panic_mid_phase_walk_surfaces_as_error` | PASS |
| 4 | Panic on coordinator (publish) | `Err` naming coordinator; lanes release | `panic_on_coordinator_surfaces_as_error` | PASS |
| 5 | All lanes die in one round (lanes 0+3) | `Err` naming first-dead lane 0 | `all_lanes_dying_in_one_round_surfaces_as_error` | PASS |
| 6 | Single-file input (serial path) | `Ok`, non-empty sheet | `single_file_input_compiles` | PASS |
| 7 | 1 lane (forced serial) vs 4 lanes | identical sheet/portable/atoms/diagnostics | `one_lane_matches_n_lanes` | PASS |
| 8 | Panic while holding a slot `Mutex` (poison) | CUT: abort path returns `Err` before touching any slot, so poison is unreachable there; hooks fire outside guards by design; pre-existing `lock()` recovery unchanged | — | CUT w/ cause |

Unreachable-by-construction, not listed as a gap: `run()` with exactly 1 range
(`worker_count < 2` routes to serial before `run`); row 7 covers the 1-lane
equivalent. No striding, no ledger refactor, no features.

## Gates (observed in `/tmp/cores-p0a`, `MallocNanoZone` unset, via `pnpm agentrs`)

- cargo `--crate atomic`: 615 + 1 + 7 + 5 passed, 0 failed (7 new p0a tests green).
- Goldens byte-identical: `goldens::namer_goldens_are_fresh` ok; full suite green.
- quality on all 10 touched files: 0 violations, 3 warnings — the same 3 pre-existing
  `lib.rs` warnings as the pre-change baseline (length, `run_parse_serial`,
  `reuse_programs`); zero new. rustc: 0 warnings in touched files.
- vitest `atomic`: 296/297 both before and after — the 2 failures (ATM-SITE-54
  assertion, `harvest-census` missing `@reference-ui/rust/namer` export at import
  time) reproduce identically on a pristine `@494a35d65` worktree (built, run, then
  removed). Pre-existing, zero regressions from this change. Note: the two failing
  cases exercise the serial path / JS packaging only.
- No timed bench runs (integrator scope). `pnpm agentrs fmt` collateral outside the
  10 owned files was reverted; tree contains exactly the fix + tests + report dir.

## Integrator notes

- Merge source: uncommitted changes in `/tmp/cores-p0a` (6 modified + 4 new files
  under `packages/reference-rs/modules/atomic/src/`). Nothing committed, stashed,
  or pushed, per protocol.
- Behavior contract change (deliberate): a worker panic now fails the whole compile
  with `parallel phase: lane {i} panicked during {stage}; compile aborted` (or the
  coordinator variant) instead of hanging or resuming the unwind. No partial output
  is committed on that path.
- Residual noise: injected panics print one stderr line per panic test via the
  default hook; tests still pass. A quiet-hook wrapper was skipped to avoid
  process-global test interference.
