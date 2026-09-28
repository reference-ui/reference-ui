# FORM leg — objective log

IN PROGRESS

Scope: NumberField NF-FORM-11,12,14 (submit/reset event-order CT).
Start: resume step 2 in `.agents/missions/numberfield-wave2/LOG.md`.
Box: 45 min. Files: NumberField dir only. Crew writes below.

## +0 min — plan (no story edits; evaluate-instrumentation only)
- Spec: TESTS.md NF-FORM-11/12/14 ([browser] event-order). Engine already has
  native submit/reset observation (NumberField.tsx:1986-2039) + failed/pending
  boundaries; COMMIT-03/07 unit covers authoritative value-clear (green).
- CT-only leg in `__e2e__/NumberField.ct.spec.ts` (append 3 tests, CommitLabFixture):
  - FORM-11: click-submit from dirty partial (order blur, prevented, retry
    blocked) + echo-off complete (blur,request, pending-blocked) + resolve via
    valid edit and via unprevented reset. Submit probe via evaluate (prevented+qty).
  - FORM-12: Enter on dirty partial → key-commit precedes implicit submit,
    exactly 1 submit event observed + prevented; repeated Enter/click blocked;
    valid-edit resolve with relative-count submit (COMP-01 pattern).
  - FORM-14: clicked-reset blur-first across accepted/rejected/incomplete runs;
    canceled reset (capture listener via evaluate) preserves post-blur failed
    state; unprevented reset clears.
- Baseline running: `pnpm agentct NumberField` (expect unit 105/105, e2e 40/40).

## +15 min — all 3 CT green on React 19
- Baseline confirmed: unit 105/105, e2e 40/40.
- `pnpm agentct NumberField --e2e -g "NF-FORM-1"` → E2E 3/3 passed.
- Fixes during leg (test-only, no engine change):
  1. Fixture `submits` counts delivered submit events even when prevented
     (React onSubmit runs regardless) — block signal is the probe's
     `prevented` flag; submits asserted as relative event counts.
  2. Re-mounting the same story preserves fixture state — FORM-11 run B now
     unmounts first for a fresh value/order/log.
- Next: full `pnpm agentct NumberField` (expect unit 105, e2e 43), then
  `--e2e --react 17,18` (expect 86/86).

## FINAL — all 3 landed, no engine change, no commits (captain owns)
- `pnpm agentct NumberField` →
  `E2E: 43 | Passed: 43 | Failed: 0 / react19: 43 passed | 0 failed /
  Unit: passed | 105 tests (workspace React 19)`
- `pnpm agentct NumberField --e2e --react 17,18` →
  `E2E: 86 | Passed: 86 | Failed: 0 / react17: 43 passed | 0 failed /
  react18: 43 passed | 0 failed`
- Per-case green (all React 19 + 17 + 18):
  - NF-FORM-11: click-submit from dirty partial (order blur, prevented,
    retries blocked) + echo-off complete (blur,request, pending-blocked);
    resolve via valid edit and via unprevented reset. Probe asserts
    prevented+qty per submit; submits as relative event counts.
  - NF-FORM-12: Enter on partial → order key, exactly 1 submit event,
    prevented, focus retained; repeated Enter/click blocked; valid-edit
    resolve with relative-count submit (echo-timing race, COMP-01 pattern).
  - NF-FORM-14: clicked-reset blur-first across accepted/rejected/incomplete
    runs; canceled reset (capture listener) preserves post-blur failed
    state with no dirty-text resurrection; unprevented reset clears.
- Coverage notes: authoritative programmatic-value clear cited from green
  COMMIT-03/07 unit (no CT duplication); constraint/format authoritative
  clears covered by existing COMMIT-07/DYNAMIC-02/FORMAT-04 paths.
- Files touched: `packages/reference-lib/src/components/NumberField/__e2e__/
  NumberField.ct.spec.ts` only (3 tests appended). No story/fixture edits,
  no engine edits, no snapshots added or written.
- Resume checklist: SPEC index +3 when captain lands (96/148 → 99/148);
  next crew continues at wave-2 LOG resume step 3 (HQ calls before
  MATH-lattice / validate-retain / live-request work).

## Captain verification + landing

- Firsthand: `pnpm agentct NumberField` → unit 105/105, e2e 43/43
  React 19; `--e2e --react 17,18` → 86/86. Matches crew report.
- Test-only leg confirmed (ct.spec.ts +252, no engine/story/snapshot).
- SPEC index bumped 96 → 99/148 (count, green list, remaining list,
  work-order item 6). Committed `4315afc32`. FORM.md closeout follows.
- NumberField now 99/148. Forms/submit/reset fully green on 17/18/19.
