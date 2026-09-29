# FOCUSFIX — FL-RESTORE-10 Firefox full-suite regression

OPEN 21:41 UTC (T+0). Box ends 22:26; stop new work 22:16. Diagnose ≤15 (→21:56), fix ≤15. FocusLock dir only.

Prime hypothesis (captain): module-level `pointerOriginByDoc` persists across
tests in shared CT gallery; stale pointer target seeds `pointerFallback` and
steals restore origin. CONFIRM with evidence, don't assume.

## T+0 — intake

- FOCUS.md: captain landed Combobox (D3+G1/H1), held FocusLock.tsx:
  Chromium 44/44+18u, WK 44/44, FF 43/44 ×2 (FL-RESTORE-10 red
  full-suite-only, green isolated; same test+duration twice = order-dependent).
- RESTORE-10 path (spec :689-694, story :747-804): click replace-mode btn →
  click open-restore-lab → click close (inside lock; close sets
  restoreTarget=C + disabled, does NOT unmount) → expect fl-restore-c focused.
  Explicit restore target (restoreCRef) should win over captured origin, so a
  stale `pointerFallback` stealing origin is NOT obviously sufficient —
  need probe evidence of the actual failing branch.
- Next: reproduce FF full once (capture to file), then /tmp-only probe.

## 21:41–21:47 — reproduction (prime hypothesis REFUTED)

- FF full ×4 (`/tmp/focusfix-ff1..4.txt`): 44/44 (9.2s), 44/44 (7.6s),
  43/44 (12.1s, RESTORE-10 5.6s timeout), 43/44 (12.2s, RESTORE-10 5.7s).
  Red correlates PERFECTLY with slow runs (≥12s red, ≤9.2s green).
- Harness fact killing the prime hypothesis: CT `mount` does
  `page.goto(gallery)` per test (fresh document + fresh module state) on a
  fresh context per test — module-level `pointerOriginByDoc` CANNOT persist
  across tests. Order-dependence impossible; load/timing is the vector.
- Instrumented probe (/tmp-only spec+config, deleted after; 20/20 green):
  green trace shows origin/pointer/fallback ALL fresh same-test
  (`btn-open-restore-lab`), branch=explicit→C. Recorder works as designed.

## 21:47–21:52 — mechanism CONFIRMED (temp in-page trace, since removed)

REDTRACE (identical ×4 across runs 5–8, quoted from run 8):

- story: `commit stale|false|false|B → click-open(mode=stale) →
  commit stale|true|false|B → click-close(mode=stale) →
  commit stale|false|false|B` — **`click-replace` handler NEVER RAN**
  though Playwright's `.click()` succeeded. No remount (single initial
  commit). The setup click was swallowed (FF layout shift under gallery
  contention between hit-check and dispatch).
- trace: `origin(open) → cleanup(liveN:1,T) → cleanup(liveN:0,F) →
  restore(active=BODY, explicit=null, branch=captured, target=open)`.
  With mode stuck at initial 'stale', restoreFocus=true, close took the
  `setRestoreLab(false)` UNMOUNT path (hence prune→liveN:0, BODY,
  explicit=null) and correctly restored the opener. **Product behaved
  correctly; the test's precondition was never established.**
- Singularity explained: RESTORE-06 clicks 'stale' (= initial, no-op when
  swallowed); RESTORE-09 lands on the opener either way
  (invalid→null→captured AND stale→true→null→captured are identical).
  Only RESTORE-10 changes end state when the setup click dies.

## 21:52–21:55 — fix (spec-only, 1 line + comment)

- `FocusLock.ct.spec.ts` RESTORE-10: setup click → `.press('Enter')`
  (keyboard activation is coordinate-free, immune to layout shift).
  Open/close clicks stay pointer (they carry the pointer-origin semantics
  under test). No product change: `FocusLock.tsx` diff is byte-identical to
  the held FOCUS-mission change; story reverted clean; all TEMP-PROBE
  residue grepped absent; /tmp probe files deleted.
- Proof next: FF full ×2, WK full, Chromium `pnpm agentct FocusLock`.

## 21:56–21:57 — PROOF (all captured to file, zero failures)

- FF full ×4: 44/44 (8.3s), 44/44 (8.3s), 44/44 (8.0s), 44/44 (8.3s)
  (`/tmp/focusfix-proof-ffP{1,2,3,4}.txt`). Required ×2, delivered ×4
  (P3 ran concurrent with WK, P4 concurrent with Chromium agentct).
  RESTORE-10 green in all four (757ms etc.).
- WK full: 44/44 (7.9s) (`/tmp/focusfix-proof-wk.txt`); RESTORE-01 ✓,
  RESTORE-03 ✓, RESTORE-09 ✓, RESTORE-10 ✓ (726ms). Safari restore
  behavior preserved (no product change — pointerFallback untouched).
- Chromium `pnpm agentct FocusLock`: 44/44 e2e + 18/18 unit, 0 failed
  (`/tmp/focusfix-proof-chromium.txt`); RESTORE-10 ✓ 599ms.

## FINAL REPORT (21:57 UTC, in-box)

- Confirmed mechanism (prime hypothesis REFUTED): not a stale
  `pointerOriginByDoc` — the recorder cannot persist across CT tests
  (fresh `page.goto` + fresh context per test) and the green probe showed
  fresh same-test origin/pointer/fallback. Red runs: Playwright's
  `.click()` on `btn-restore-mode-replace` succeeded but the React
  `onClick` NEVER RAN (quoted story trace: `click-open(mode=stale)` with
  no preceding `click-replace`, no remount) — the setup click was
  swallowed by FF layout shift under gallery contention (all reds ≥12.0s,
  all greens ≤9.2s pre-fix). Mode stuck at initial 'stale' →
  restoreFocus=true → close took the unmount path → correct opener
  restore; test precondition never established. Product was correct.
- Fix: 1-line spec change (RESTORE-10 setup `.click()` → `.press('Enter')`,
  + why-comment); open/close stay pointer. `FocusLock.tsx` byte-identical
  to held FOCUS change; story clean; zero probe residue (grepped);
  /tmp probe spec/config deleted. No port waits, no foreign processes.
- Resume checklist: captain verifies (spec diff = 8 lines in
  `FocusLock.ct.spec.ts`) + lands `FocusLock.tsx` (held FOCUS change) +
  spec + FOCUS.md/FOCUSFIX.md. NEVER commit per orders — left
  uncommitted. Raw logs: `/tmp/focusfix-ff{1..9}.txt` (pre-fix),
  `/tmp/focusfix-proof-*` (post-fix). NFLAST files untouched.

## Captain verification + landing

- Firsthand: Chromium 44/44+18u; FF 44/44 ×2; WK 44/44. The
  captain's hypothesis died on evidence and the crew's trace
  stands — exactly how the oracle/captain split should work.
- Committed (arc + both logs). FOCUS-FIX CLOSED.


