# NumberField wave-2 crew log

Box: 60 min from 16:33 BST 2026-09-28. Hard wrap at 45 min (17:18). Report by 17:33.
Rule: legs of ≤15 cases, all green before next leg; 15-min cap per case; log every ≤15 min.

## Enumeration (from SPEC.md case index + TESTS.md catalog; confirmed 16:36)

SPEC claims **68/148 green**. TESTS.md defines 148 tagged cases. Remaining = **80**.

### Green (68, per SPEC.md `[x]` list — trusted, spot-verified via test-title grep)
- NF-TYPE-01..04 (4)
- NF-DOM-01..09 (9)
- NF-MATH-01,02,07,08,14,15 (6)
- NF-EDIT-04,13,19 (3)
- NF-COMMIT-03,07,10 (3)
- NF-KEY-01,02,03,04,05,07 (6)
- NF-STEP-01..15 (15)
- NF-FORM-01,02,03,04,05,06,07,08,10,13 (10)
- NF-A11Y-01,02,03,05,06 (5)
- NF-SURF-01 (1)
- NF-DYNAMIC-03,04 (2)
- NF-ENV-01,03,05,07 (4)

### Remaining (80 = 76 automatable + 4 manual gates)
- NF-PARSE-01..19 (19)
- NF-FORMAT-01..08 (8)
- NF-MATH-03,04,05,06,09,10,11,12,13 (9)
- NF-EDIT-01,02,03,05,06,07,08,09,10,11,12,14,15,16,17,18 (16)
- NF-COMMIT-01,02,04,05,06,08,09,11 (8)
- NF-KEY-06 (1)
- NF-FORM-09,11,12,14 (4)
- NF-A11Y-04 (1)
- NF-DYNAMIC-01,02,05 (3)
- NF-ENV-02,04,06 (3)
- NF-COMP-01..04 (4)
- NF-MANUAL-01..04 (4 — manual release gates, human/device only, NOT landable by crew)

### Pre-flagged HQ blockers (from SPEC.md Gaps — will probe, not grind)
- Live-request contradiction (B-19 pinned titles vs freeze): NF-EDIT-03, NF-EDIT-05, NF-COMMIT-08, NF-COMMIT-11.
- Lattice freeze vs signed-off W-02 (min-anchored/half-up/lattice-clamped): NF-MATH-03,04,09,10,11,12.
- Validate reject-vs-retain (W-02): NF-MATH-13, NF-COMMIT-06.
- Lattice-adjacent (probe engine first): NF-MATH-05, NF-MATH-06, NF-KEY-06.

## Leg plan
- Leg 1 (unit-heavy, ≤15): NF-FORMAT-01..08 + NF-MATH-05, NF-MATH-06, NF-KEY-06 probe + NF-A11Y-04 + NF-DYNAMIC-05? (cap 15; trim as needed)
- Leg 2 (browser batch): NF-EDIT-01,02,06,07,08,09,10,14,15,16,17,18 + NF-COMMIT-01,02,04 (trim to 15)
- Leg 3 (if time): NF-COMMIT-05,09 + NF-FORM-09,11,12,14 + NF-DYNAMIC-01,02 + NF-ENV-02,04,06 + NF-COMP-*
- PARSE/MATH-freeze legs: probe-only; full non-ASCII grammar + lattice flips exceed per-case caps → expect STUCK-SKIP with resume notes.

## Timeline
- 16:33 box open. 16:36 enumeration confirmed (80 remaining, 76 automatable). Baseline unit 89/89 green.
- 16:38 LEG 1 OPEN (14 unit cases): NF-FORMAT-01,02,05,06,07,08 + NF-PARSE-04,05,14 + NF-A11Y-04 + NF-COMMIT-04,05,09 + NF-KEY-06.
- 16:38 engine flip: parseDraftNumber rejects trailing-decimal commits ("1." → incomplete, NF-PARSE-04). Safe: existing '2.' vectors never commit (grep).
- 16:44 LEG 1 CLOSED — all 14 green. `pnpm agentct NumberField --unit`: 103/103 passed (89 baseline + 14 new). Fixes during leg: FORMAT-07 roundingIncrement needs minFrac=maxFrac, priority vectors need fine step (snap-before-round), COMMIT-05 clamp-to-0 vector needs nonzero initial.
- 16:44 LEG 2 OPEN (CT batch, ≤15): NF-FORMAT-03,04 + NF-EDIT-01,06,10,14 + NF-COMMIT-01,02 + NF-FORM-09 + NF-DYNAMIC-02 + NF-ENV-04 + NF-COMP-01,03 + NF-EDIT-11 (needs isComposing guard). NF-EDIT-16 dropped at open (controlled-input undo/redo needs a dedicated harness — blocker, see below).
- 16:52 engine fix: handleKeyDown ignores isComposing keys (NF-EDIT-11). New fixtures: CommitLabFixture, FormatSwapFixture (mousedown-preserved focus).
- 17:06 LEG 2 CLOSED — all 14 green. Full `pnpm agentct NumberField`: unit 105/105, e2e 40/40 (27 baseline CT + 13 new titles). Fixes: native-setter for synthetic input events (React 19 tracker), EDIT-14 clamp expectation (123→100), COMP-01 blur-commit-before-reset + relative submit count.
- 17:06 React 17/18 verification legs running (skill requirement after event-logic change).
- 17:10 React 17/18 legs green: `pnpm agentct NumberField --e2e --react 17,18` → E2E 80/80 (40×2, snapshots React-19-only per skill).
- 17:12 SPEC.md index updated: 96/148. Box wrap (no Leg 3 — FORM-11/12/14 event-order work cannot credibly close in the remaining minutes; opening it would risk leaving a red leg).

## Final result: 96/148 (+28 in-box)
- Leg 1 (14 unit): NF-FORMAT-01,02,05,06,07,08, NF-PARSE-04,05,14, NF-A11Y-04, NF-COMMIT-04,05,09, NF-KEY-06.
- Leg 2 (12 CT cases + 2 unit): NF-FORMAT-03,04, NF-EDIT-01,06,10,11,14, NF-COMMIT-01,02, NF-FORM-09, NF-DYNAMIC-02, NF-COMP-01 (CT) + NF-ENV-04, NF-COMP-03 (unit).
- Proof quoted: unit 105/105 (workspace React 19); e2e 40/40 React 19; e2e 80/80 React 17+18. No snapshot writes; all baselines intact.
- Engine changes (2, both minimal): (1) parseDraftNumber rejects trailing-decimal commits ("1." → incomplete per NF-PARSE-04); (2) handleKeyDown ignores isComposing keys (NF-EDIT-11). New fixtures: CommitLabFixture, FormatSwapFixture. No commits (captain owns).

## Skipped cases with blocker notes (52 remain: 48 automatable + 4 manual)
- HQ-CALL lattice/snap (needs zero-anchor/endpoint/tie ruling vs signed-off W-02): NF-MATH-03,04,09,10,11,12. Engine is min-anchored + half-up + lattice-clamped max; tests would pin the freeze the engine contradicts.
- HQ-CALL first-step/null + bound reachability (same lattice flip): NF-MATH-05 (engine steps null→step, freeze wants nearest-zero 0), NF-MATH-06 (inward-from-bound arithmetic ≠ adjacent grid point).
- HQ-CALL validate retain-vs-reject (signed-off W-02 rejects): NF-MATH-13, NF-COMMIT-06.
- HQ-CALL live-request/dirty-echo (contradicts pinned B-19 commit-only titles): NF-EDIT-03, NF-EDIT-05, NF-COMMIT-08, NF-COMMIT-11, NF-DYNAMIC-01 (latest-echo preservation needs live-request tracking).
- Intl grammar gap (parser is ASCII + locale punctuation; needs numbering-system/affix engine per PATCHES §2): NF-PARSE-01,02,03,06,08,09,10,11,12,13,15,16,17,18,19. Notes: PARSE-07 needs paste normalization (engine shows verbatim draft); PARSE-09 percent-unit "12%"→12 needs unit-affix grammar (engine rejects % outside percent style); PARSE-15/19 need supported-matrix declaration + 2,000-vector harness; PARSE-16 needs removal diagnostics for compact/hidden-sign (engine silently mis-parses some).
- Edit-filtering gap (no beforeinput/paste/composition/caret engine per PATCHES §1): NF-EDIT-02 (impossible-insertion cancel), NF-EDIT-07 (logical-digit caret), NF-EDIT-08 (paste splice model), NF-EDIT-09 (invalid-paste veto), NF-EDIT-12 (composition result commit/restore), NF-EDIT-15 (",024"→24 orphan-group commit; engine rejects), NF-EDIT-17, NF-EDIT-18 (stale composition fallout suppression needs session tracking).
- NF-EDIT-16 (cut/undo/redo): controlled-input native undo is harness-flaky; needs a dedicated history harness, not a drive-by. Cut + ranged-replacement halves are trivially native.
- NF-DYNAMIC-05: partly covered by NF-STEP-13/14 (disable/remove during hold); composition + owner-root-replacement branches need the composition engine.
- NF-ENV-02 (ICU-mismatch diagnostic): no detection exists; needs a declared matrix + probe.
- NF-ENV-06 (Shadow DOM): unprobed; jsdom shadow + .form scoping needs verification, else CT shadow harness.
- NF-COMP-02 (needs non-Latin currency input — Intl gap), NF-COMP-04 (scientific-unit validate + RTL + shadow — Intl + shadow gaps).
- NF-FORM-11,12,14 (submit/reset event-order CT): NEXT LEG — no engine gap identified; needs careful blur-before-submit/click/reset sequencing in CommitLabFixture. Not attempted: box wrap.
- NF-MANUAL-01..04: human/device release gates by definition.

## Resume checklist (next crew)
1. `pnpm agentct NumberField` → expect unit 105/105, e2e 40/40. SPEC reads 96/148.
2. Leg 3 (CT, CommitLabFixture exists): NF-FORM-11 (click-submit from dirty partial → blur-first + blocked retry + authoritative clears), NF-FORM-12 (implicit Enter submit blocking), NF-FORM-14 (reset click blur-first + cancel semantics). Watch the echo-timing implicit-submit race (see COMP-01 relative-count pattern).
3. Then HQ calls (lattice, validate-retain, live-request) before any MATH/EDIT-03/05/08/11/COMMIT-06/08/11/DYNAMIC-01 work — engine flips without rulings will break pinned green titles.
4. Then PATCHES §2 Intl grammar (PARSE bulk + COMP-02/04) and PATCHES §1 filtering/caret/composition (EDIT-02/07/08/09/12/15/17/18, DYNAMIC-05).
5. ENV-02 (matrix probe), ENV-06 (shadow), EDIT-16 (undo harness) are independent fill-ins.
6. MANUAL-01..04 stay manual; record platform/version results at release.

## Captain verification + landing

- Firsthand re-run (captain's eyes): `pnpm agentct NumberField` → unit
  105/105, e2e 40/40 React 19; `pnpm agentct NumberField --e2e --react 17,18`
  → 80/80. All green, matches crew report.
- Engine diff reviewed: 2 minimal flips (trailing-decimal incomplete,
  isComposing guard), both commented with case IDs.
- Committed `6a50c51b2` (5 files, component arc). Log closeout follows.
- Wave-2 box closed in-budget (~40 min). 52 remain: 48 automatable + 4 manual.
  Next crew starts at resume step 2 (NF-FORM-11,12,14). HQ calls needed before
  any MATH-lattice / validate-retain / live-request engine work.
