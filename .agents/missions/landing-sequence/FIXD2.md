# FIX-D2 — NumberField FF double-publish fix + F2/F6/F7 scoping (LOG)

Box: 60 min hard from ~18:11 UTC → 19:11. STOP new work 19:01. Cap 15 min/case. NumberField dir ONLY. Never commit.

Scope: FIX F1/F3/F4/F5 (FF double onChange, product re-entrancy) + SCOPE F2/F6 (platform caret no-op) + F7 (WebKit click-focus) per-engine in-spec.

## 18:11 UTC — OPEN. Plan

- Fix (DIAG D2 direction): clear `draftRef` synchronously in `runCommit` (`NumberField.tsx`, mirroring `onReset:2028`). One-line class. `onSubmit:1996` re-entry then sees clean draft and falls through to the pending/failed block (behavior preserved: FORM-12 stays blocked via `pendingRequestRef`/`failedBoundaryRef`).
- Scope F2/F6 NF-EDIT-06: `browserName`-conditional native expectations (FF/WebKit bare Home/End are caret no-ops per DIAG D3A; assert no-op = caret unchanged, with platform rationale comment).
- Scope F7 NF-COMMIT-01: webkit-conditional `not.toBeFocused()` on `commit-lab-outside` (Safari no-click-focus per DIAG D1A).
- Proof: `pnpm agentct NumberField` + `--e2e --react 17,18` + FF/WebKit sweep vehicle for the 7 cases; Chromium legs stay fully green.

## 18:15 UTC — FIX + SCOPE implemented, FF/WK green

- Fix: `NumberField.tsx` `runCommit` now clears `draftRef.current = null` synchronously alongside `setDraft(null)` (+ rationale comment). No API change.
- Scope NF-EDIT-06 (F2/F6): `browserName`-conditional native expectations — bare Home/End hold caret on FF/WK (`afterClick` capture + `[3,3]` after fill), move on Chromium. Follow-on discovery: `Control+ArrowLeft` also platform-split (no-op on FF mac, word-jumps on WK/Chromium) — scoped per measured outcome with rationale.
- Scope NF-COMMIT-01 (F7): webkit-conditional `not.toBeFocused()` on `commit-lab-outside` with Safari no-click-focus rationale.
- Results so far:
  - Chromium `pnpm agentct NumberField`: E2E 43/43 + Unit 105 passed (pre-final-spec-edit; re-proof pending).
  - FF vehicle full spec: `✔ PASSED: 43 passed (0 failed) in 10.5s` — F1/F3/F4/F5 fixed, F2 scoped.
  - WK vehicle full spec: `✔ PASSED: 43 passed (0 failed) in 6.7s` — F6/F7 scoped.

## FINAL REPORT (18:18 UTC) — all 7 cases closed, no skips

FIXED (product fix, green on FF as-shipped behavior):
- F1 NF-FORM-12, F3 NF-EDIT-14, F4 NF-COMMIT-02, F5 NF-COMP-01: FF double-`onChange` eliminated by the `runCommit` sync `draftRef` clear. Full-spec FF run proves no other case regressed.

SCOPED (per-engine native expectations, platform rationale in-spec):
- F2/F6 NF-EDIT-06: Home/End hold on FF/WK, move on Chromium; `Control+ArrowLeft` holds on FF only (measured split, commented).
- F7 NF-COMMIT-01: `commit-lab-outside` `not.toBeFocused()` on WebKit only.

Suite outputs (quoted):
- Chromium `pnpm agentct NumberField`: `E2E: 43 | Passed: 43 | Failed: 0 / react19: 43 passed` + `Unit: passed | 105 tests`.
- Chromium `pnpm agentct NumberField --e2e --react 17,18`: `E2E: 86 | Passed: 86 | Failed: 0 / react17: 43 / react18: 43` (snapshots skipped off-19 by design).
- FF vehicle (full spec, `--ignore-snapshots`): `✔ PASSED: 43 passed (0 failed) in 10.5s`.
- WK vehicle (full spec, `--ignore-snapshots`): `✔ PASSED: 43 passed (0 failed) in 6.7s`.

Files: `NumberField.tsx` (+7), `__e2e__/NumberField.ct.spec.ts` (+30/-12). No API changes. No commits (captain verifies). No foreign processes touched; no port waits needed. Box closed ~18:18 UTC, inside 60 min.

Resume checklist:
1. Captain firsthand verify + commit (NumberField dir + this log only).
2. Gaps inherited from sweep (unchanged): non-Chromium visual drift unproven (`--ignore-snapshots` on all FF/WK legs); r17/18 × FF/WK unswept beyond Chromium.
3. Note for SCOPE crews: `browserName` fixture is the working per-engine vehicle in CT specs (no precedent existed; established here).

## Captain verification + landing

- Firsthand: Chromium 43/43 + unit 105/105; 17/18 86/86; FF
  vehicle 43/43; WK vehicle 43/43. Matches crew on all five legs.
- Fix reviewed: one functional line (sync `draftRef` clear) +
  rationale comment, exactly the DIAG direction. No API change.
- Scoping reviewed: per-engine native expectations with platform
  rationale in-spec (incl. measured Control+Arrow split).
- Committed (arc + this log). FF double-publish CLOSED.
