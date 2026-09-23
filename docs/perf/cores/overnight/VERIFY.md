# VERIFY: stabilize/cores-p0 merge — GO (with carries)

Verifier firsthand re-run of full GATES on the integrator's merged tree
(`/tmp/cores-int`, HEAD `494a35d65`, uncommitted) against a NEW pristine
worktree (`/tmp/cores-verify` @ `494a35d65`, rev-parse matched, clean).
`MallocNanoZone` unset; all Rust via `pnpm agentrs`; no timed bench runs.

## Verdict: GO

The merged content is faithful to every crew claim I spot-checked, and every
achievable gate is green firsthand with zero delta vs pristine. The merge is
sound as the Stage-1 base. Carries below are tuning/owner items, not
correctness blockers: time-parity was CUT with cause, and literal v-green is
unachievable on the spike base itself (verified firsthand).

## GATES firsthand (merged vs pristine)

- `c atomic`: merged **655/0** (642+1+7+5); pristine **621/0** (608+1+7+5).
  Arithmetic exact: 608−1+35=642 (13 lanes + 7 panic + 10 slot + 5 extract;
  retired `parallel_extract_matches_serial_sheet` absent). GREEN.
- `v atomic`: **300/301 on BOTH trees**, single failure ATM-SITE-54
  spec.ts:43 with byte-identical text (modulo timing/paths); harvest-census
  4/4 passes on both. Zero delta. (Crew "296/297" counts were an unbuilt
  TS-dist artifact — reproduced firsthand as `Cannot find package
  '@reference-ui/rust/namer'`, resolved by `build:js`; see V3.)
- `q atomic/src`: 0 violations both; 76=76 warnings (249 vs 243 files);
  normalized warning sets byte-identical (only line/length shifts). Zero NEW.
  rustc warnings all in untouched `extract/`/`recipes/` files.
- Goldens: `namer_goldens_are_fresh` ok both trees; golden dirs unmodified
  after all runs. Byte-identical.

## Spot-checks (all pass, `/tmp/cores-int` source)

No `Barrier` in shipped code (one test-doc mention); `SlotState` machine +
`SlotGuard` + `ensure_mergeable` + poison refusal in `phase_lane.rs`;
`Shared`/`Published` Send+Sync and `OwnedFile` Send+`'static` asserts;
`PoolGuard` !Send via `PhantomData<Rc<()>>`; `run(..., &PoolGuard)` with
ranges from `guard.workers()`, sole production caller `lib.rs:204`;
fold guard in `phase_merge.rs`; panicked-slot skips in `phase_walk.rs`;
`FORCE_LANES` + `force_lane_count` `#[cfg(test)]` only; both test modules
registered; all touched files ≤365 lines; no new `unsafe`, no `#[allow]`.
SITE-54 fixture has 7 sources (< 64 front threshold and < old files<8),
so it runs the serial path under both gatings — gating cannot affect it.

## Shared checkout

`packages/reference-rs` + `CORES.md` are byte-exact vs `spike/cores-lanes`
(15 tracked identical, 7 untracked blobs SAME); `docs/perf/cores/` holds only
`overnight/*.md`. EXCEPTION (pre-existing, not mine — present in my first
status before any action, never touched): `reference-neo/benchmark/reports/
latest/*` modified (bench collateral, hash `757a607bc`). Owner must revert;
protocol bars verifier edits beyond this file.

## Breakage scenarios (verifier area; each tested)

| # | Breakage way | Test | Result |
|---|---|---|---|
| V1 | Base-pin drift (wrong rev under test) | `rev-parse` before work + in both worktrees | PASS, `494a35d65` everywhere |
| V2 | Merged content unfaithful to crew claims | 12 grep+read spot-checks above | PASS, all confirmed |
| V3 | Gate-count drift vs INTEGRATE.md | Full c/v/q re-run in BOTH trees | PASS with correction: true v pair is 300/301 single SITE-54, not 296/297 (build-state artifact, reproduced + resolved) |
| V4 | NEW q/rustc warnings hiding in line shifts | Normalized warning diff; `-->` location list | PASS, sets identical; rustc only untouched files |
| V5 | Golden drift from merge or test runs | `namer_goldens_are_fresh` + `git status` of golden dirs | PASS, fresh + clean |
| V6 | Shared-checkout pollution beyond spike+reports | Status vs spike file set + blob compares | PASS with finding: pre-existing bench collateral (above) |
| V7 | Bench-prong adjudication (time/HW/bundle) | UNTESTABLE: timed bench runs forbidden to verifier | UNRESOLVED (named, not dropped) |

## Carries (not blockers)

- Bench time MISS (+7.4%, 845 vs 787): needs Stage-1 interleaved spike-vs-
  merged A/B + threshold/cap tuning before any perf claim. Suspect gate
  cap-8 (never bench-validated); §3 hook is `#[cfg(test)]`, cannot contribute.
- Bench HW/bundle PASS per integrator, not re-verified firsthand (needs runs).
- `v atomic` literal green needs spike-owner SITE-54 fix (fails on pristine).
- Gate cross-thread capture still lacks a trybuild negative compile-fail test.
