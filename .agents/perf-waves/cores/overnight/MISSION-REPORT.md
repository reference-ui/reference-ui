# MISSION REPORT: stabilize/cores-p0 overnight

- Base pin: `spike/cores-lanes @ 494a35d65` (rev-parse matched by every crew before work).
- Date: 2026-09-22 (overnight run). All work detached/uncommitted, no push/stash.
- Merge tree: `/tmp/cores-int`, branch `stabilize/cores-p0` (10 modified + 6 new files,
  all under `packages/reference-rs/modules/atomic/src/`).
- Shared-checkout footprint: `docs/perf/cores/overnight/*.md` only
  (`REPORT-p0a/p0b/p0c/gate.md`, `INTEGRATE.md`, `VERIFY.md`, `BREAK-REPORT.md`, this file).
- Bottom line: **4/4 crews GATES-green → merged → verifier GO (with carries) → adversary
  19/19 HOLDS, zero BREAKs.** Correctness/hang work is done. Time-parity MISS (+7.4%)
  and pre-existing spike-base v-red carry into Stage 1 / spike owner.

## 1. Per-crew verdicts

| Crew | Verdict | Core change | c atomic | v atomic | q |
|---|---|---|---|---|---|
| p0a barrier→rendezvous (`REPORT-p0a.md`) | MERGE (driver rewrite) | Barrier (4 waits, inline lane 0) → per-lane channel rendezvous; coordinator spawns all lanes, joins all, drops payloads; lane panic → `Err` naming lane+stage | 615+1+7+5 pass, 0 fail | 296/297, 2 fails pre-existing on pristine base | 0 violations; 3 warnings = pre-existing lib.rs baseline; 0 rustc in touched |
| p0b typed slot refusal (`REPORT-p0b.md`) | MERGE (slot machine) | `SlotState`/`RecordStage`/`SlotGuard`; atomic record (build-local, commit-once); poison/refusal → `panicked` + 1 synthetic `ATM-E-PARSE`; walk skips failed slots | 618 pass, 0 fail (609+9 new) | 296/1, byte-identical to clean baseline (SITE-54 + harvest-census pre-existing) | 5 files: 0/0 |
| p0c Send+Sync audit (`REPORT-p0c.md`) | MERGE (asserts/docs/tests, zero runtime delta) | `Shared`/`Published` Send+Sync assert, `OwnedFile` Send+`'static`, `'alloc` tie, Rc/RefCell confinement docs; 4 new tests | 612/0 incl 4 new | 296/297, byte-identical on pristine `git-archive` baseline | 4 files: 0/0 |
| gate lane policy (`REPORT-gate.md`) | MERGE (Lanes + guard threading) | `lanes.rs`: `Auto=min(par,8)` + `Fixed(test)`; thresholds 64 files / 4000 wants; `PoolGuard` `!Send+!Sync` single-flight; `worker_count` retired; 13 new tests | 620/0 (base 608/0; −1 retired +13 new) | 300/301, identical on pristine base (SITE-54 only) | 8 files: 0 violations, same 6 baseline warnings |

Goldens: byte-identical / `namer_goldens_are_fresh` ok in all four crews.

## 2. Breakage tables (condensed; full tables in crew reports)

p0a (7 pass + 1 CUT w/ cause): record/refs/walk lane panics → `Err` naming lane+stage;
coordinator panic → `Err`, lanes release; all-lanes-die → first-dead named; single-file Ok;
1-vs-4 lanes byte-identical. All panic tests carry 60 s anti-hang timeouts (none fired).
CUT: slot-poison-during-abort — abort returns `Err` before touching slots, unreachable.

p0b (5 groups): panic at each of 6 record folds → `Partial` + refuse; poison reuse
(incl. after-complete, sibling isolation) → `Poisoned`, 1 error; all-panicked input →
none merge; empty input → vacant; refusals surface as `ATM-E-PARSE` diagnostics.

p0c (S1–S5 PASS, S6 flagged): S1 data-race-by-new-field (asserts + 1/7/8/16 identity);
S2 arena escape (`'alloc` tie + `'static`, 16-lane retained+streamed); S3 Rc/RefCell
sharing (confinement by construction, identity tests every lane count); S4 poison
recovery + 8-thread distinct-slot fold; S5 edges 0/1/7/8/9/16 (exact cover, no OOB).
S6 barrier-deadlock-on-thread-panic UNTESTABLE at crew time → **CLOSED at merge**
(no `Barrier` remains in code; covered by p0a scenarios 1–3+5).

Gate (7/7 PASS): 1-core/missing-parallelism → inline; tiny compile → 0 spawns;
63/64 + 3999/4000 boundaries; nested entry panics + worker pattern needs no guard
(cross-thread bar by `!Send/!Sync` construction); oversubscription caps at 8, no idle
lanes; 70-file lane==serial byte-identical (3 pool entries asserted); sequential
re-entry OK after drop.

## 3. Integrator merge (`INTEGRATE.md`)

Eligibility: all 4 crews GATES-green (literal v-green unachievable — spike base red,
verified firsthand on pristine `@494a35d65`). 9 collisions resolved file:line
(C1–C9: driver+guard+asserts in `phase_parallel.rs`; slot machine supersedes p0a record
in `phase_lane.rs`; fold guard in `phase_merge.rs`; skips+docs in `phase_walk.rs`;
`lib.rs` modules+guarded entry; tests ported to `lanes::force_lane_count` + `run(..., &guard)`).
One integrator-owned hook: `FORCE_LANES`/`force_lane_count` in `lanes.rs` (`#[cfg(test)]`
only, absent from release binary) + 2 tests. CUTs with cause: p0c poison test
(contradicts p0b refusal; superseded by p0b poison×3), p0c `worker_count` asserts
(API deleted; superseded by lanes boundary tests), p0a `FORCE_WORKERS` (new home §3),
time-parity claim (MISS, §4). Merge-level M1–M5 all PASS; S6 CLOSED. No new `unsafe`,
no `#[allow]`, no tuple soup; test inventory exact: 608−1+35 = 642 lib.

GATES firsthand (merged `/tmp/cores-int`): c 655/0 (642+1+7+5); v 296/297 identical
pair to pristine; q 0 violations, 76 = baseline 76 (diff only line shifts, zero NEW);
rustc 19 warnings all in untouched files; goldens fresh + unmodified.

## 4. Bench: ONE locked enterprise x3 vs reference

Seed 7, `bench-worker/2` scorer, lock `/tmp/swarm-bench-lock`, `MallocNanoZone` unset,
native `.node` sha verified before AND after. Runs 1053.33 / 844.61 / 842.05 ms
(run 1 cold, scorer takes run 2 → **845 ms**).

| Prong | Merged | Reference | Verdict |
|---|---|---|---|
| sync time | 845 ms | spike 787 ms (±5% → ≤826.35) | **MISS** (+7.4%, +58 ms) |
| peak HW | 374.5 MiB | spike HW420 cap (not worse) | **PASS** (−45.5 MiB) |
| bundle | 2867925 / 214466 / 3082391 B, 7527 calls | sealed wave-2 pins | **PASS** exact |

Diagnosis (static; no second set permitted): prime suspect gate cap 16→8 on this
32-thread box (HW drop consistent with fewer arenas); no same-tick control arm so
machine drift inseparable; §3 hook is `#[cfg(test)]`, cannot contribute. NOT retuned
on one absolute number. Recommendation: Stage-1 interleaved 8-pair spike-vs-merged A/B
+ threshold/cap tuning before any perf claim.

Note on "787/872": no `872` pin exists in any overnight report or under
`docs/perf/cores/` (grep clean). The documented gates are **787 ms ±5%** and **HW420**;
this table adjudicates against those. Treat `872` in the task brief as a stray number.

## 5. Verifier: GO with carries (`VERIFY.md`)

Fresh pristine worktree `/tmp/cores-verify` @ `494a35d65` (rev-parse matched, clean);
merged HEAD same rev, 10M+6N intact.

- c: merged 655/0 vs pristine 621/0; 608−1+35=642 exact; retired test absent. GREEN.
- v: **300/301 on BOTH trees**, SITE-54 text byte-identical; harvest-census 4/4 both.
  Zero delta. Correction: crew "296/297" was an unbuilt-TS-dist artifact (reproduced
  `Cannot find '@reference-ui/rust/namer'`, resolved by `build:js`).
- q: 0 violations both; 76=76 normalized-identical; rustc only untouched files.
- Goldens fresh + clean both trees.
- 12 spot-checks pass (no Barrier, slot machine, Send+Sync asserts, `PoolGuard !Send`,
  guard threading, `#[cfg(test)]` hook, file lengths, no unsafe/allow).
- Shared checkout: spike blobs byte-exact + `overnight/*.md` only; EXCEPTION
  pre-existing `reference-neo/benchmark/reports/latest/*` collateral (hash `757a607bc`;
  owner must revert; verifier barred from edits).
- V1–V6 PASS (V3 with the v-count correction, V6 with the collateral finding);
  V7 bench adjudication UNTESTABLE (timed runs forbidden to verifier).

**Verdict: GO as Stage-1 base.** Carries are tuning/owner items, not correctness blockers.

## 6. Adversary: 19/19 HOLDS, zero BREAKs (`BREAK-REPORT.md`)

Break tree `/tmp/cores-break` @ pin + integrator 16 files `cmp`-identical; probes as
throwaway `tests/breaker.rs` (break-tree-only, never to merge). Full c 674/0
(661 lib = 642+19); goldens fresh. Every compile probe ran under a 30 s hang guard;
none fired.

Mandated probes:

1. Panic injection into lane paths: **HOLDS** — 5 new + 7 existing panic tests; every
   front/coordinator panic is prompt `Err` naming lane+stage, never a hang.
2. Determinism sweep 1/2/3/8/16 vs serial: **HOLDS** — sheet, portable, atoms, ordered
   diagnostics byte-identical (`entered>=1` proves lane path for n≥2).
3. 20x repeat: **HOLDS** — 20x forced-4 full fixture + 20x 70-file threshold fixture
   (all 3 pools), every round identical to round 0.
4. Edge inputs: **HOLDS** — empty / single / all-dead / parse-heavy / clamp: all Ok,
   all lane==serial.
5. HW vs 420 + lane-idle: **SPLIT** — lane-idle HOLDS (shard fuzz 0..40×9 exact-cover
   no-idle; Auto cap≤8; clamp proven); bench-scale HW re-measure UNRESOLVED
   (integrator-only runs; standing 374.5 MiB PASS).

Scenario rows B1–B6 all HOLDS (record-lock poison aborts pre-publish; tail fuzz
35-want/4000-decl/6-content finds zero inducible panics; ordering/shard/edge/round-order
all identical or clean). Findings: F1 tail `resume_unwind` vs front `Err` asymmetry
(pre-existing, spike-identical — needs Stage-1 eyes); F2 `force_lane_count` pins tails
too (hook semantics, not a bug); F3 `shard_ranges(_,0)` panics but unreachable by type
(`NonZero` at all 3 spawn sites); F4 `lock_published` silent `into_inner` (safe today:
single-statement once-before-broadcast holds; mirror typed refusal if holds widen).

## 7. Consolidated unresolved (all crews; nothing dropped silently)

1. Bench time MISS +7.4% (845 vs 787) → Stage-1 interleaved A/B + cap/threshold tuning.
2. v atomic red on spike base (SITE-54 serial-path spec-verify + harvest-census packaging
   on unbuilt dist) → spike-owner fix; zero delta from this mission.
3. Trybuild negative compile-fail test for cross-thread guard capture absent →
   by-construction (`!Send+!Sync`) + positive test only.
4. Tail `resume_unwind` asymmetry (F1): future tail panic would crash the sync call, not
   error it; needs signature-level parity decision in Stage 1.
5. `lock_published` silent poison recovery (F4): safe today, revisit if holds widen.
6. Bench HW/bundle PASS per integrator, not re-verified firsthand (runs forbidden to
   verifier/breaker); standing 374.5 MiB PASS.
7. Shared `reference-neo/benchmark/reports/latest/*` collateral modified pre-existing →
   owner must revert (verifier barred).
8. Genuine tail-worker panic path verified by reading only (untriggerable by content
   fuzz); `resume_unwind` propagation untested live.
9. CLOSED this mission (was open at crew time): p0c S6 barrier deadlock — no `Barrier`
   in merged code; p0c poison/worker_count asserts CUT with cause at merge.

## 8. MORNING DECISION CHECKLIST

Review order (30 min):

1. This file (5 min) — verdicts + carries at a glance.
2. `INTEGRATE.md` §2–§4 + §8 (10 min) — collisions, CUTs, bench MISS reasoning.
3. `VERIFY.md` (5 min) — GO rationale, v-count correction, shared-clean bill.
4. `BREAK-REPORT.md` mandated probes + F1/F4 (5 min) — HOLDS evidence, tail asymmetry.
5. Crew reports as needed (5 min) — `REPORT-p0a.md` (rendezvous design) then
   `REPORT-gate.md` (thresholds/cap — the bench suspect), `REPORT-p0b.md` (slot
   machine), `REPORT-p0c.md` (audit proof).

Landing needs (do before merge to a shared branch):

- [ ] Decide bench MISS disposition: accept as tuning carry (recommended) or order
  Stage-1 A/B first; do NOT retune cap/thresholds on the single 845 number.
- [ ] Revert `reference-neo/benchmark/reports/latest/*` collateral in shared checkout.
- [ ] Land `/tmp/cores-int` (`stabilize/cores-p0`, uncommitted): commit 10M+6N, keep
  `#[cfg(test)]` hook, keep CUTs as documented; do NOT merge break-tree `breaker.rs`.
- [ ] File spike-owner ticket: SITE-54 + harvest-census v-red on pristine base.
- [ ] File Stage-1 tickets: interleaved A/B + tuning; tail error-parity (F1);
  trybuild guard-capture negative test; `lock_published` typed refusal if holds widen.
- [ ] Confirm `q` 76-warning baseline still matches at landing time (zero NEW rule).
