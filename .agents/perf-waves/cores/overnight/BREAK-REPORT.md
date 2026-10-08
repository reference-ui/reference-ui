# BREAK-REPORT: adversary probes vs stabilize/cores-p0 tree

- Base pin: `spike/cores-lanes @ 494a35d65` (`494a35d65…52191d`, rev-parse matched before work).
- Integrator `complete=false` reflected breakage notes, not a failed merge, so this probe
  targets the integrated tree: new detached worktree `/tmp/cores-break` at the pin, then the
  integrator's 16 working-tree files copied over byte-identical (verified `cmp` clean, all 16).
- Breaker probes live only in the break tree as throwaway
  `packages/reference-rs/modules/atomic/src/tests/breaker.rs` (+1 `mod` line). No source fix,
  no bench run, no push/merge/stash. All Rust via `pnpm agentrs`, `MallocNanoZone` unset.
- Shared-checkout footprint of this mission: this file only.

## Verdict

19/19 new probes HOLDS, full `c atomic` green (674/0), goldens fresh. No BREAK found: every
panic injection fails clean (never hangs), every lane count and repeat is byte-identical
(diagnostics order included), every edge input compiles equal-or-vacant on both paths. Two
named unresolved (bench-scale HW re-measurement is integrator-only; a genuine tail-worker
panic is untriggerable by content), one pre-existing asymmetry filed as a finding.

## Breakage scenarios (mandate: >=3, each tested)

Every compile probe runs on a helper thread with a 30 s hang guard; a revived hang would
fail loud naming the scenario. None fired.

| # | Breakage way | Test | Result |
|---|---|---|---|
| B1 | Lane panic mid-record holding a slot lock poisons the slot; half-filled merge or hang | Record-marker panics (retained lane 0 + streamed lane 3) abort pre-publish with clean `Err`; 10 `slot` poison/refusal tests re-run green | HOLDS: abort precedes merge, poison never merges |
| B2 | Tail-pool worker panic hangs or corrupts (resolve/plan pools join with `resume_unwind`, unlike the front) | 35 adversarial wants x3, 4000 adversarial decls (pool==serial), threshold 20x, adversarial contents x6: zero panics inducible | HOLDS-empirical; propagation asymmetry filed as F1 (pre-existing, spike-identical) |
| B3 | Lane-count-dependent ordering drift in sheet, diagnostics, wants, or atoms | Sweep 1/2/3/8/16 vs serial + 20x fixed-lane + 20x threshold repeats; `assert_eq` on sheet, portable, atom count, diagnostics vec (order-sensitive) | HOLDS: all identical |
| B4 | Shard edges (`len<workers`, `len=0`, `workers=0`) cause OOB, idle lanes, or wrap | Fuzz `len` 0..=40 x workers {1,2,3,4,7,8,16,64,128}: exact cover, contiguity, `ranges=min(workers,len)`; `shard(5,0)` panics (div-by-zero) and is unreachable: all 3 callers pass `guard.workers()` (`NonZero`, >=2 at spawn) | HOLDS |
| B5 | Edge inputs crash, hang, or go silently wrong on the lane path | Empty project, 1 styling file, all-dead (retained-dead + streamed), 6-file parse-error-heavy (non-empty diags), 16-lanes-over-2-files clamp: all `Ok`, all lane==serial | HOLDS |
| B6 | Round-ordering hazards: double panic misnames, wrong round wins, max lanes hang, streamed markers misfire | Double record panic names lane 0; record beats publish; 16-lane walk panic clean; streamed record panic names lane 3; streamed refs/walk markers inert (retained-only rounds skip) | HOLDS |

## Mandated probes (BREAK or HOLDS each)

1. Panic injection into lane paths: HOLDS. 5 new + 7 existing `parallel_panic` tests green:
   every front/coordinator panic is a prompt `Err` naming lane+stage (or coordinator), never a
   hang. Tail pools cannot hang (scoped join) but would propagate via `resume_unwind` (F1).
2. Determinism sweep 1/2/3/8/16: HOLDS. Fixture has cross-file imports (value graph), harvest
   literals, a syntax-error file (ordered diagnostics), a streamed and a retained-dead file;
   `entered>=1` proves the lane path for n>=2. All counts byte-identical to serial.
3. 20x repeat, same input same lanes: HOLDS. 20x forced-4 on the full fixture plus 20x on the
   70-file threshold fixture (all three pools firing): every round identical to round 0.
4. Edge inputs: HOLDS. See B5; hang guards (30 s) never fired; parse-heavy diagnostics
   non-empty and order-identical across paths.
5. HW vs 420 MiB + lane-idle sanity: SPLIT. Lane-idle HOLDS (B4 fuzz + `fixed`/`force` clamp
   tests + Auto cap<=8 proof across 12 work x 7 hardware shapes). Bench-scale HW
   re-measurement is UNRESOLVED (U1): timed bench runs are integrator-only; the standing
   measurement is the integrator's 374.5 MiB PASS (-45.5 vs the 420 cap).

## Findings (evidence only, no fixes)

- F1 (pre-existing, needs Stage-1 eyes): tail joins `resume_unwind` while the front returns
  `Err`. Verified spike-base-identical (`git show 494a35d65:.../resolve_pool.rs`,
  `.../runtime/plan_pool.rs`). No content trigger found despite fuzzing; a future tail panic
  would crash the sync call, not error it. Parity (error-or-abort) needs signature changes.
- F2 (hook semantics, not a bug): `force_lane_count` pins tails too. One forced-lane compile
  of a single styling file runs serial-front + parallel-tails (`entered=2`, static wants cross
  the tail threshold) and still matches full-serial byte for byte. Initial `entered==0`
  assertion was the probe's error, corrected to assert front-plan inline directly.
- F3 (edge documented): `shard_ranges(_, 0)` panics; unreachable by type (F1-style `NonZero`
  guard counts at all 3 spawn sites, grep-verified).
- F4 (inspection, uninjectable): `lock_published` recovers poison silently (`into_inner`, no
  mark). Safe today: single-statement holds cannot panic and the write is once-before-
  broadcast. If those holds ever widen, Stage 1 should mirror the typed slot refusal.

## Gates observed (break tree `/tmp/cores-break`)

- `c atomic`: 661 lib (642 integrator + 19 breaker) + 1 + 7 + 5 = 674 passed, 0 failed.
- Goldens: `namer_goldens_are_fresh` ok; `tests/namer-goldens/` unmodified.
- `v`/`q`/bench not run here: breaker scope is Rust lane behavior; shipped-Rust delta is nil
  (probe file is break-tree-only throwaway), bench runs are integrator-only.

## Unresolved (named, not dropped)

- U1: bench-scale HW re-measurement on this tree (forbidden to this mission; standing PASS).
- U2: genuine tail-worker panic propagation path verified by reading only (F1); untriggerable
  by content in 35-want / 4000-decl / 6-content / 20x-threshold fuzzing.
- U3 (inherited, out of scope): integrator U2/U3 (`v` red-on-spike pair, trybuild negative).

## What was NOT done

No source fixes, no threshold retuning, no ledger/stride/feature work, no timed bench, no
`v`/`q` runs, no push/merge/stash. Break-tree `tests/mod.rs` +1 line and `tests/breaker.rs`
are uncommitted probe scaffolding, never to merge as-is.
