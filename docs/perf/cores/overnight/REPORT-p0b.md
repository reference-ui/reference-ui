# REPORT-p0b: silent poison recovery → typed slot refusal

Base `spike/cores-lanes @ 494a35d65` verified (`rev-parse` matches). Worktree `/tmp/cores-p0b`, no timed benches, all Rust via `pnpm agentrs`, `MallocNanoZone` unset.

## Fix

`phase_lane::lock` recovered poison via `into_inner()` unmarked while `record` filled field-by-field, so a mid-record panic could merge a half-filled slot as complete in `phase_parallel::fold_index`.

- `SlotState`: `Empty` / `Partial{stage}` / `Complete` / `ParserPanicked` / `Incomplete{stage?}` / `Poisoned{stage?}`. Only `Complete` merges.
- `RecordStage`: `Errors|Constants|ModuleRecord|ExportMap|Harvest|Trace` with `name()` for diagnostics.
- `record` builds each fold locally, commits once; a panic leaves `Partial` with data untouched, never half-filled.
- `SlotGuard{recovered}`: `lock` marks poisoned slots failed (idempotent, one synthetic error). Merge asserts recovered ⇒ refused.
- `ensure_mergeable()`: empty/partial refuse with `parallel slot <reason> at <stage>; treated as failed`, sets `panicked` so harvest/settle/walk skip. Synthetic errors report as `ATM-E-PARSE` via existing `commit_outputs`.
- `phase_walk`: `store_refs` and `walk_one` skip slots with `panicked` (matches serial `is_styling`).

Chose fail-with-diagnostic over serial re-record: re-parse inside the coordinator would break lane arena ownership; loud refusal matches serial panicked handling.

## Files

- `packages/reference-rs/modules/atomic/src/phase_lane.rs` (331 lines): state machine, atomic record, guard.
- `phase_parallel.rs` (+2 lines, 364): `debug_assert` + `ensure_mergeable` in `fold_index`.
- `phase_walk.rs` (+3 lines, 139): skip failed slots in `store_refs`/`walk_one`.
- `tests/slot.rs` (new, 251 lines): 9 tests. `tests/mod.rs` (+1 line).

## Scenario table

| # | Breakage way | Test | Result |
|---|---|---|---|
| 1 | Panic at each of 6 record folds | `panic_at_each_stage_leaves_partial` (injected hook, `catch_unwind`) | Partial at that stage, `record None`, refuses |
| 2 | Poisoned mutex reuse (incl. after complete, sibling isolation) | `poisoned_lock_reclaims_with_diagnostic`, `poison_reuse_stays_failed_once`, `poison_after_complete_refuses` | Recovered, `Poisoned`, 1 error, sibling clean |
| 3 | All-panicked input (3 files, mocked `ParserReturn.panicked`) | `all_panicked_inputs_refuse` | All `ParserPanicked`, none merges |
| 4 | Empty input (0 sources, parallel `run`) | `empty_parallel_run_is_vacant` | Vacant hosts, empty catalog, no lane |
| 5 | Refusal surfaces as diagnostic | `refused_errors_report_as_diagnostics` | 1 `ATM-E-PARSE` containing `parallel slot` |

Real-parser overlong (4 GiB `MAX_LEN`) is infeasible to allocate in a test; the mocked `panicked=true` exercises the identical early-return branch. No unresolved inputs.

## Gates

- `c atomic`: 618 passed, 0 failed (609 existing + 9 new).
- `v atomic`: 296 passed, 1 failed (`ATM-SITE-54`), 1 suite error (`harvest-census` import) — byte-identical to clean `494a35d65` baseline (same 296/1). Both pre-existing, serial-path/TS-infra, unaffected by this parallel-only change.
- `q`: 5 touched files, 0 violations, 0 warnings.
- Goldens: `namer_goldens_are_fresh` passes, `tests/namer-goldens/` unmodified.
- Cargo warnings: none in touched files (19 lib warnings pre-existing).
