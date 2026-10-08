# INTEGRATE: stabilize/cores-p0 (p0a + p0b + p0c + gate)

- Base pin: `spike/cores-lanes @ 494a35d65` (rev-parse `494a35d65…52191d` matched before work).
- Worktree: `/tmp/cores-int`, local branch `stabilize/cores-p0`. Changes uncommitted, no push/merge/stash.
- Tree: 10 modified + 6 new files, all under `packages/reference-rs/modules/atomic/src/`.
- Protocol: `MallocNanoZone` unset, all Rust via `pnpm agentrs`, one timed bench set only.

## 1. Merge eligibility (GATES green)

GATE = c green + v identical-to-pristine-baseline + q 0 violations/0 new warnings + goldens
byte-identical. Literal v-green is unachievable: the spike base itself is red (ATM-SITE-54
assertion + harvest-census suite import), failing identically on a pristine `@494a35d65`
worktree (verified firsthand, §6). All four crews meet the achievable GATE; all four merge.
`complete=false` on p0c/gate reflected breakage-mandate notes, not gate failures.

| crew | source | verdict |
|---|---|---|
| p0a barrier→rendezvous | `/tmp/cores-p0a` (uncommitted) | MERGE (driver rewrite) |
| p0b typed slot refusal | `/tmp/cores-p0b` (uncommitted) | MERGE (slot machine) |
| p0c Send+Sync audit | `/tmp/cores-p0c` (uncommitted) | MERGE (asserts/docs/tests, zero runtime delta) |
| gate lane policy | `/tmp/cores-gate` (uncommitted) | MERGE (Lanes + guard threading) |

## 2. Per-record application and collisions

Verbatim takes (no other crew touches these): `phase_gate.rs`, `phase_commit.rs` (p0a);
`lanes.rs` except §3 hook, `assembly.rs`, `resolve_pool.rs`, `runtime/builder.rs`,
`runtime/plan_pool.rs` (gate).

- C1 `phase_parallel.rs` (316 lines): p0a driver + gate `guard: &PoolGuard` param (`:68`,
  ranges from `guard.workers()` at `:78`, `worker_count` call deleted) + p0c
  `Shared`/`Published` Send+Sync assertion (`:53`, barrier-free wording). p0a's
  `run_lane` kept; p0a's lane-stage fns homed here (`stage_streamed` `:233`,
  `parse_retained` `:261` with p0c `'alloc` tie, `record_retained` `:277`) instead of
  p0a's `phase_lane.rs` placement: `phase_lane` would hit 410 lines (>365 warned), while
  beside their only caller `run_lane` both files stay clean (342/316).
- C2 `phase_lane.rs` (342): p0b state machine + atomic `record` + `SlotGuard` (supersedes
  p0a's field-by-field `record` and plain-`MutexGuard` `lock`; same signatures, stronger
  contract) + p0c `OwnedFile` Send/`'static` assertion (`:100`) and lane-local docs.
  p0a's `panic_marker` calls live in the stage loops (C1), outside `record`, so both
  injection seams coexist: markers fire pre-lock (no poison), `check_test_panic` fires
  in-lock (poison path, unit-tested).
- C3 `phase_merge.rs` (p0a new): + p0b `fold_index` guard (`:87-88`,
  `debug_assert!` + `ensure_mergeable`). p0a `publish` marker kept (fires before the fold).
- C4 `phase_walk.rs` (135): p0a round calls + p0b panicked-slot skips (`:28`, `:100`) +
  p0c confinement docs (`:39` Rc/coordinator, `:59` RefCell/per-lane; `after_publish` doc
  dropped with the deleted fn).
- C5 `lib.rs`: p0a module decls + `Result` plumbing (`:136`) + gate `mod lanes`, `use
  lanes::{Lanes, WorkKind}`, guarded entry (`:203`). p0a's pure-fmt reflow hunks skipped
  (zero behavior; tree stays fmt-stable).
- C6 `extract_parallel.rs` (356): gate base (`worker_count`/`FORCE_SERIAL` deleted) +
  p0c tests ported: `parallel_matches_serial_across_lane_counts` (`:306`, lane side via
  §3 hook, serial side via `hold_force_serial`, reuses gate `line_files`), exact-cover
  `shard_ranges_cover_edges` (`:323`), verbatim `distinct_slots_fold_concurrently`
  (`:340`, compiles against `SlotGuard` via `DerefMut`).
- C7 `tests/parallel_panic.rs` (p0a 7 tests): `force_worker_count` → `lanes::force_lane_count`
  (`:12`, `:67`); sharding identical (`shard_ranges(9,4)`), lane-index asserts unchanged.
- C8 `tests/slot.rs` (p0b 10 tests): `empty_parallel_run_is_vacant` ported to
  `run(..., &guard) -> Result` via a `Lanes::fixed(2)` guard (`:234`); rest verbatim.
- C9 `tests/mod.rs`: registers both `parallel_panic` and `slot`.

## 3. Integrator-owned code (one hook + two tests)

`worker_count` retired with gate, so p0a's test-only `FORCE_WORKERS` had no home. Ported
into `lanes.rs`: `FORCE_LANES` thread-local (`:197`), `force_lane_count` (`:207`),
`plan_auto` consult (`:160-162`, clamped to work, bypasses the serial threshold).
Deliberate deviation from p0a order: forced-serial wins over a stale pin (RAII guard must
be reliable; no test sets both). Covered by `forced_count_pins_and_bypasses_threshold`
(pin 4 < 64 threshold + clamp 8→3 + clear restores serial) and
`forced_serial_wins_over_forced_count` (`lanes.rs` tests). Release binary unaffected:
all hook code is `#[cfg(test)]`.

## 4. CUTs with cause

- p0c `lane_lock_recovers_after_poison` CUT: asserts `!panicked` after poison, directly
  contradicting p0b's deliberate typed refusal (`mark_poisoned` sets `panicked` + one
  diagnostic). Superseded by p0b's three poison tests with stronger asserts.
- p0c `worker_count(0)==1` / `worker_count(7)==1` asserts CUT: API deleted by gate.
  Superseded by `lanes.rs` boundary tests (`front_threshold_boundary`, `zero_work_is_inline`).
- p0a `FORCE_WORKERS` + `force_worker_count` CUT as superseded by §3 (same semantics,
  new home). p0a fmt-only reflows skipped (§2 C5).
- Time-parity claim CUT (§7): 845ms vs 787 (+7.4%) misses the ±5% gate; cause unprovable
  within one set (no control arm), so no retune attempted.

## 5. Construct-mandate compliance (merged code)

Named crew types reused, no new shared state beyond the §3 hook (named, documented);
invariants documented at each site; no new `unsafe` (grep clean), no `#[allow]` (grep
clean), no tuple soup (gate `PlanCtx`/`LanePlan`/`PoolGuard` kept); every touched file
≤365 lines except pre-existing over-limit `lib.rs`/`builder.rs` (warnings unchanged, §6).

## 6. Breakage scenarios (merge-level; each tested)

| # | Breakage way | Test | Result |
|---|---|---|---|
| M1 | Forced-lane hook shards differently than p0a's path; lane asserts go stale | 7 `parallel_panic` tests (assert lanes 0/1/3) + `forced_count_pins_*` | PASS (green ⇒ lane path taken: serial has no lanes to name) |
| M2 | Lane dies mid-record holding a p0b lock: poisoned slot merges half-filled | p0a abort tests (`Err`, no hang: abort precedes publish) + 10 `slot` refusal tests | PASS |
| M3 | Gate thresholds silently serialize small fixtures, voiding lane tests | `forced_count_pins` asserts `enter().is_some()`; `lane_path` asserts 3 spawns | PASS |
| M4 | CUTs weaken coverage (p0c poison + worker_count asserts) | p0b poison×3 + lanes boundary tests cover both; suite green | PASS |
| M5 | `run()` signature change misses a call site | Exhaustive grep (sole production caller `lib.rs:203`); `cargo` + suite green | PASS |
| S6 | p0c-unresolved barrier deadlock on thread panic | RESOLVED by merge: no `Barrier` remains in code (one doc comment only); covered by p0a scenarios 1-3+5 | CLOSED |

Crew scenario tables (p0a 7+1 CUT, p0b 5 groups, p0c S1-S5, gate 1-7) all re-run green
in the merged tree; test inventory diff vs pristine base is exactly −1 retired
(`parallel_extract_matches_serial_sheet`) +35 carried (5 extract + 13 lanes + 7 panic +
10 slot) = 642 lib tests.

## 7. GATES firsthand (merged tree `/tmp/cores-int`)

- `c atomic`: 642 + 1 + 7 + 5 = 655 passed, 0 failed. GREEN.
- `v atomic`: 296/297, failing pair byte-identical on pristine `@494a35d65` baseline
  (ATM-SITE-54 `expected false to be true`; harvest-census suite import). Zero delta.
- `q` atomic/src: 0 violations, 76 warnings = baseline 76; warning-list diff shows only
  line/length shifts in pre-existing warnings. Zero NEW. rustc: 19 lib warnings, all in
  untouched `extract/`/`recipes/` files.
- Goldens: `namer_goldens_are_fresh` ok; `tests/namer-goldens/` unmodified; vitest golden
  cases pass identically to baseline.

## 8. Bench: ONE locked enterprise x3 (seed 7, `bench-worker/2` scorer)

Lock `/tmp/swarm-bench-lock` (owner+claims), `pnpm agent run`, `MallocNanoZone` unset,
native `.node` sha `b90a7ec9…c6b6a` verified before AND after (no rebuild mid-set),
two-step release. Runs: 1053.33 / 844.61 / 842.05 ms (run 1 cold, scorer takes run 2).

| prong | merged | reference | verdict |
|---|---|---|---|
| sync | 845ms | spike 787ms (±5% → ≤826.35) | MISS (+7.4%, +58ms) |
| peak HW | 374.5 MiB | spike HW420 (not worse) | PASS (−45.5 MiB) |
| bundle | 2867925 / 214466 / 3082391 B, 7527 calls | sealed pins (wave-2) | PASS exact |

Time-miss diagnosis (static; no further runs permitted): prime suspect is gate's
never-bench-validated lane cap (16→8 on this 32-thread box) — HW drop (−45 MiB) is
consistent with fewer arenas. Confounders: historical reference with no same-tick
control arm (runs 2-3 tight at ±1.3ms, so in-set noise is low, but machine drift vs the
reference cannot be separated). My §3 glue cannot contribute: it is `#[cfg(test)]`,
absent from the release binary. NOT retuned: changing `MAX_AUTO_LANES`/thresholds on one
absolute number, with no verification run left, would contradict a GATES-green crew on a
hunch. Recommendation: Stage 1 interleaved 8-pair spike-vs-merged A/B + threshold tuning.

## 9. Unresolved (named, not dropped)

- Bench time prong MISS (above): needs Stage-1 A/B + gate-constant tuning.
- Gate's negative compile-fail test for cross-thread guard capture (needs trybuild;
  enforced by `!Send+!Sync` construction + positive `workers_need_no_guard_capture`).
- `v atomic` red-on-spike-base pair (SITE-54 + harvest-census): pre-existing, needs
  spike-owner fix; zero delta from this merge.

## 10. What was NOT done

No ledger refactor, no striding, no features, no threshold retuning, no second bench set,
no push. Bench `reports/latest/*` collateral reverted. Pristine baseline worktree
`/tmp/cores-base` built for q/v/test-list comparison, then removed.
