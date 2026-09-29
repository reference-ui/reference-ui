# NFLAST — objective log

IN PROGRESS

Scope: NumberField last pass to component-ready (45 automatable +
4 manual). HQ delegated the three engine calls: rule the obvious
answers, implement, least-surprise the rest (recorded, flagged).
Phase 0 (30-min cap): reconcile lattice/snap (freeze #7 vs signed
W-02 vs engine), validate retain-vs-reject, live-request vs pinned
B-19 — cite evidence, record rulings in component DECISIONS.md.
Then legs ≤15: rulings → Intl grammar → filtering/composition →
ENV/EDIT-16 fill-ins. SPEC'd behavior only: NO prop/type/export
changes (API shape is HQ's). Box: 90 min, wrap 75. Crew writes below.

## 21:36 — Phase 0 COMPLETE (4 min, cap 30)

Rulings recorded in `NumberField/DECISIONS.md` § "NFLAST engine rulings":

- (a) SNAP LATTICE → ADOPT FREEZE. Zero-anchored `k*step`,
  away-from-zero ties, exact/exceeded non-grid endpoints preserved,
  order endpoint→lattice→rounding→final-clamp. Evidence: TESTS.md
  freeze #7 + NF-MATH-03/09/10/11/12; root DECISIONS.md §3 (HQ never
  ruled the six sub-items; flips re-pin pre-release-cheap); W-02 signs
  off policy only. No flag — obvious.
- (b) VALIDATE → RETAIN-AND-REPORT (freeze). Commit requests rounded raw
  candidate via onChange; managed invalid (bounds∪step) blocks submit;
  native flags false. Evidence: freeze #7 "never snaps or clamps" +
  NF-MATH-13/15, NF-COMMIT-06, NF-FORM-05, NF-COMP-04; native
  stepMismatch + RAC prior art. ⚠ FLAG: W-02's "rejects" read as
  rejects-as-valid (ours, not HQ-signed). `onInvalidCommit` becomes
  advisory (fires alongside onChange; range-first reason) — flagged
  interpolation, API shape untouched.
- (c) PUBLISH TIMING → LIVE-REQUEST with dedupe (freeze). Raw parsed
  number per new meaning; incomplete grammar silent; accepted echoes
  preserve dirty text; stale/unrelated end session. Evidence:
  NF-EDIT-03/04/05/14, NF-COMMIT-01/04/05/08/11, NF-DYNAMIC-01,
  NF-KEY-06/NF-STEP-12. B-19's verbatim-draft fix preserved; only the
  "never mid-keystroke" clauses re-pin. ⚠ FLAG: raw
  unclamped/unsnapped live requests inferred from NF-COMMIT-05, not
  verbatim-pinned.

Phase 1 legs: L1 ruling-(a) lattice flip + NF-MATH-03/04/05/06/09/10/11/12
(8 cases + W-02 snap re-pins) → L2 ruling-(b) retain + NF-MATH-13/NF-COMMIT-06
→ L3 ruling-(c) live-request → Intl/filtering/ENV fill-ins as box allows.
NOTE: self-inflicted scratch edit to WANTS.md made and fully reverted
21:36; `git status` confirms only NumberField/DECISIONS.md is mine.

## 21:48 — Leg 1 GREEN (ruling a, 8 cases + 3 re-pins)

Engine (`NumberField.tsx`): `snapValueToLattice` → zero-anchored,
away-from-zero ties, exact/exceeded endpoint preservation;
`isOnStepLattice` → pure zero-lattice membership; new
`stepLatticeInDirection` (strict in-direction + Shift≡10×, flagged
interpolation); increment/decrement → directional lattice + clamp +
first-step-from-null (clamp(0)); snap commit → final clamp after
`displayRoundTrip` (NF-MATH-12 order). No prop/type/export changes.

Tests (`NumberField.test.tsx`): rewrote 3 W-02 snap titles →
NF-MATH-09/10/11; new describe "freeze lattice" with
NF-MATH-03/04/05/06/12. SPEC.md: 99→107/148, gaps + work-order updated.

Proof quoted:
- `pnpm agentct NumberField --unit` → "Test Files 2 passed (2)",
  "Tests 110 passed (110)"
- `pnpm agentct NumberField --e2e` → "E2E: 43 | Passed: 43 | Failed: 0 /
  react19: 43 passed | 0 failed"
- `pnpm agentct NumberField --e2e --react 17,18` → "E2E: 86 |
  Passed: 86 | Failed: 0 / react17: 43 / react18: 43"
- agentct has no FF/WebKit flag (Chromium CT only); touched cases are
  all `[unit]`-tagged so no browser vehicle applies — CT runs are
  regression proof. Matrix FF/WebKit belongs to test-core, out of scope.

Next: Leg 2 (ruling b) — validate retain + NF-MATH-13 + NF-COMMIT-06,
re-pin 3 W-02 validate titles.

## 21:54 — Leg 2 GREEN (ruling b, 2 cases + 3 re-pins)

Engine: validate branch of `runCommit` → retain-and-report (rounded raw
candidate requested as-is; no snap/clamp; no failed boundary — owned
invalid blocks submit); `onInvalidCommit` advisory after onChange,
violation judged on committed candidate, range-first. No
prop/type/export changes.

Tests: 2 W-02 validate titles → NF-MATH-13 (off-step/under/overflow +
range-first order + 2 rounding vectors + no-prop retain); "rejection
without onInvalidCommit" folded into MATH-13 and removed;
"on-step in-range publishes plainly" holds unchanged. CT W-02 validate
title → NF-COMMIT-06 (retain + hidden canonical + native validity
untouched + managed ARIA/data); `ValidateFixture` gained `name="qty"`.
SPEC.md: 107→109/148, NF-MATH-* COMPLETE.

Proof quoted:
- `--unit` → "Test Files 2 passed (2)", "Tests 108 passed (108)"
- `--e2e` → "E2E: 43 | Passed: 43 | Failed: 0 / react19: 43 passed"
- `--e2e --react 17,18` → "react17: 43 passed | react18: 43 passed"

Next: Leg 3 (ruling c) — live-request + NF-EDIT-03/04/05/14,
NF-COMMIT-01/04/08/11, NF-DYNAMIC-01; re-pin B-19 titles (unit + CT).

## 22:22 — Leg 3a UNIT-GREEN (ruling c engine + unit; CT parked)

Engine: `handleInputChange` → live requests (raw parsed, deduped vs
control + `lastLiveRef`; empty → null once); value-change effect →
echo-aware (latest echo preserves draft, stale/unrelated replaces,
both clear transient); per-session dedupe reset at every session end
(commit/step/format/constraint/reset + value mirror). Advisory
`onInvalidCommit` fires only when the commit path actually requests
(name says *commit*; immediate-accept invalids surface via invalid
state, no advisory). No prop/type/export changes.

Unit titles: B-19 t1 → NF-EDIT-03 (+EDIT-05 ASCII dedupe core);
B-19 t2 retitled (raw-live + clamp-once); new block "live requests"
with NF-EDIT-04/14, NF-COMMIT-01/08/11, NF-DYNAMIC-01 (unit proofs;
CT twins keep IDs green through the CT re-pin); NF-COMMIT-04
rewritten (+mid-session acceptance vector); NF-MATH-13 redesigned
(reject-then-echo — immediate accept makes commit a noop, no
advisory); 26 fallout titles fixed (mechanical live-prefixes;
NF-FORM-06 converted to held echo per freeze "not accepted").
NF-EDIT-05 full title deferred to Intl leg (needs non-ASCII parser).

Proof quoted: `pnpm agentct NumberField --unit` → "Test Files
2 passed (2)", "Tests 114 passed (114)" (was 32 failed at survey;
DYNAMIC-01 was my test bug — rerendering the current value runs no
effect; COMMIT-04 exposed the cross-session dedupe staleness, fixed
in engine).

⚠ CT WAS RED (expected): 16 B-19-era CT titles asserted commit-only
(log:none, requests:0).

## 22:31 — Leg 3b CT PARTIAL (9 fixed, 7 parked)

Fixed (all green first verification run): NF-EDIT-04 (retitled to
freeze text, live-null accepted pre-Enter), B-19 CT → NF-EDIT-03 CT
(live 2/2.5 + caret [3,3] + editing flags), W-02 snap CT (requests
0→2 mid-type, 1→3 final), NF-COMMIT-06 (live-accepted flow; advisory
log stays 'none' — no commit-request fires — with unit-MATH-13
pointer), W-25 currency/percent CTs (live-accepted displays
pre-Enter), NF-EDIT-14 (log 1,12,42→42-retry), NF-COMMIT-01 (order
request,blur; delayed-echo logs), NF-COMMIT-02 (order request,key).

Proof quoted: `pnpm agentct NumberField --e2e` → "E2E: 43 |
Passed: 36 | Failed: 7" (was 27/16). Unit untouched at 114/114.
No 17/18 re-run in-box (19-only for the CT dash).

PARKED (7 CT titles, diagnosed, recipes below — next wave):
1. NF-FORMAT-04: fill('999') live-accepts → log 'log: 999'
   (not 'none'); EUR swap replaces from controlled 999: input
   '€999.00', hidden '999'. Mechanical.
2. NF-EDIT-11: ENGINE GAP (not expectations): pre-compositionend
   '12' input fires live ('log: 12' vs 'none'). Recipe: composingRef
   via onCompositionStart/End on Input; suppress live while
   composing; flush staged final at compositionend (dedupe guards
   double-publish with the post-end input event). Same slice covers
   unproven NF-EDIT-12/17/18.
3. NF-FORM-09: accept run log 'log: 42' pre-blur; reject run
   'log: 42,43,43' (live+retry). Mechanical.
4. NF-DYNAMIC-02: fill('999') → log 'log: 999', de-format expected
   from 999; fill('1500') → 'log: 999,1500', scientific from 1500.
   Mechanical.
5. NF-COMP-01: reset-run blur retry adds second 50 → log
   '99,100,99,50,50'. One line.
6. NF-FORM-11: Run A holds as-is; Run B (echo-off) log counts shift
   live+retry. Read Run B tail, adjust.
7. NF-FORM-14: blur-then-reset log counts + echo interplay. Read,
   adjust (mirror FORM-06 held-echo pattern if blur-noops unblock).

## RESUME CHECKLIST (next wave)

- [ ] Land parked CT 7 (recipes above); verify `pnpm agentct
      NumberField` + `--e2e --react 17,18` all-green (SPEC: 113/148).
- [ ] NF-EDIT-05 full title (Intl leg; ASCII core already in EDIT-03).
- [ ] PATCHES §2 Intl grammar (NF-PARSE-01/02/03/06-13/15-19):
      numbering-system/affix parser + NF-PARSE-19 2000-vector matrix.
- [ ] PATCHES §1 completion: filtering/caret/paste/composition
      (NF-EDIT-02/07/08/09/12/15/17/18, NF-COMP-02/04) — fold in the
      EDIT-11 composingRef design above.
- [ ] Fill-ins: NF-ENV-02 (ICU-mismatch diagnostic), NF-ENV-06
      (shadow), NF-EDIT-16 (cut/undo/redo), NF-DYNAMIC-05.
- [ ] Least-surprise flags to confirm with HQ (all in DECISIONS.md):
      (b) "rejects"=rejects-as-valid + advisory onInvalidCommit;
      (c) raw unclamped live requests; Shift≡10× steps off-grid.

FINAL STATE: engine rulings (a)(b)(c) landed + unit-proven;
113/148 SPEC [x]; unit 114/114; CT 36/43 (7 parked, all diagnosed).
Files touched (NumberField dir only): NumberField.tsx,
NumberField.test.tsx, __e2e__/NumberField.ct.spec.ts,
NumberField.story.tsx (ValidateFixture name), SPEC.md, DECISIONS.md.
No prop/type/export changes anywhere. Never committed. Box closed.
