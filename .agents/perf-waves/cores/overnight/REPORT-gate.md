# REPORT-gate: conservative lane gating (`Lanes` policy + single-flight)

Worktree: `/tmp/cores-gate` @ `494a35d65` (spike/cores-lanes, rev-parse matched).
Scope: gating only. No ledger refactor, no striding, no request knob, no features.

## What changed

New `lanes.rs` (319 lines): `Lanes::{Auto, Fixed}` policy, `WorkKind::{FrontFiles,
TailWants}` thresholds, `LanePlan`, and single-flight `PoolGuard`. `Auto` plans
`min(parallelism, 8)` lanes and stays serial below 64 styling files (front) or
4000 wants/decls (tails); `Fixed` (test-only until the knob lands) pins the lane
path. `worker_count` (`min(par,16)` / `files<8`) is deleted; all three pool sites
(front, want resolve, plan build) plan through `Lanes::Auto.guard()` and take
`&PoolGuard`. One worker means the pre-existing serial path with no spawn.

Single-flight is structural: `PoolGuard` is `!Send + !Sync`, so worker closures
cannot capture it and pool-inside-pool fails to compile; same-thread re-entry
panics on the in-flight flag (released by `Drop`, so worker panics clear it).
`FORCE_SERIAL` moved to `lanes.rs` behind a leak-proof `SerialHold`.

## Scenario table (breakage mandate)

| # | Scenario | How tested | Result |
|---|----------|------------|--------|
| 1 | 1-core box | `one_core_box_never_spawns` (avail=1, 100k work) + `missing_parallelism_plans_inline` (avail=0) | 1 lane, `enter()=None` |
| 2 | Tiny compile | `tiny_compile_never_spawns`: 8-file compile, spawn counter delta 0 + serial differential | pass, 0 spawns |
| 3 | Threshold boundaries | `front_threshold_boundary` (63/64), `tail_threshold_boundary` (3999/4000) | 1 lane below, 8 at/above |
| 4 | Nested-spawn attempt | `nested_entry_panics` (should_panic, same thread) + `workers_need_no_guard_capture` (worker pattern needs no guard); cross-thread capture barred by `!Send/!Sync` bounds | pass; compile-time bar by construction |
| 5 | Oversubscription | `oversubscription_caps_at_eight` (8/16/64/128 → 8/8/8/8), `fixed_pins_and_clamps_to_work` (no idle lanes) | pass |
| 6 | Lane/serial identity | `lane_path_matches_serial_sheet`: 70 files x 12 calls, 3 pool entries asserted, sheet/portable/atoms/diagnostics equal | pass, byte-identical |
| 7 | Sequential pools | `sequential_pools_reenter`: drop guard, re-enter OK (single-flight is re-entry, not one-shot) | pass |

Untestable as runtime tests: none. The cross-thread `!Send/!Sync` bar is a
compile-time property (verified by construction + the positive worker-pattern
test); a negative compile-fail test would need trybuild, which was not added.

## Gates

- `c atomic`: 620 passed, 0 failed (base: 608 passed, 0 failed; delta is
  -1 retired test +13 new). Goldens byte-identical: same pinned bytes green.
- `v atomic`: 300/301, identical on pristine base (same single failure:
  ATM-SITE-54 spec.ts:43, pre-existing spike breakage on a 6-want serial
  fixture; serial under both old and new thresholds, so gating cannot affect
  it). Zero delta from this change.
- `q` on all 8 touched files: 0 violations, 6 warnings — exactly the 6
  pre-existing baseline warnings (lanes.rs clean; `build_atom_set` stayed at
  cognitive 18). No `#[allow]`, no `unsafe`, all files <= 365 lines.
- rustc: 19 warnings, all in untouched files (`extract/`, `recipes/`); none
  reference new or edited code.

## Files

- New: `packages/reference-rs/modules/atomic/src/lanes.rs`
- Edited (gates only): `lib.rs`, `assembly.rs`, `runtime/builder.rs`
- Edited (guard threading): `phase_parallel.rs` (-1 line), `resolve_pool.rs`,
  `runtime/plan_pool.rs` (`ShardCtx` -> `PlanCtx`, 5-arg `resolve_seen` -> 1)
- Edited (retire `worker_count`, upgrade tests): `extract_parallel.rs`
