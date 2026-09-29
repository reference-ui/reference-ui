IN PROGRESS — FINISH-02F-F30 fix crew (Announcer F30 real fix + shadow spot round). Box: 75 min hard. Branch reference-system.

### T+0 — CREW START. SL.md + FINISH-02 phase-2 read. Sibling owns focus-visible/Tooltip — my box: Toast/ + Announcer/ only (+ Measure/Overlay run-only for spot). Tree clean at start. Scope check: Announcer.story.tsx has its OWN identical renderInto (L536-547) but its r18 legs are green (MultiDoc attach defers via rAF, escaping the flushSync window) — leaving it alone: fix ONLY what's proven red.
- Fix applied: Toast.story.tsx renderInto wraps inner `root.render(node)` in `ReactDOM.flushSync` (mirrors playwright/runtimes/react-18/host.ts; comment cites F30). r17 legacy path untouched (shim lacks createRoot).
- Skip deleted: Announcer.ct.spec.ts F30 block (comment + galleryMajor probe + test.skip) removed; mount + asserts intact.

### T+20 — F30 THREE-LEG PROOF (all quoted from /tmp/finish02f-f30-*.txt).
- r18 Chromium: agentct Announcer --e2e --react 18 full ×2: `E2E: 35 | Passed: 35 | Failed: 0` both runs (full1/full2). ANN-HOST-03 `[PASSED] (492ms)` run1; zero test skips (only "Visual snapshots: skipped (React 19 only)" notices). 35 = true suite size (matches SL r19 count).
- r18 FF: ANN-HOST-03 iso ×2 `1 passed (1.2s/3.0s)` (vehicle, --project=react18-firefox).
- r18 WK: ANN-HOST-03 iso ×2 `1 passed (2.2s/2.2s)` (--project=react18-webkit).
- S2 genuineness (vehicle self-boots gallery per run; temp zz-f30-probe, deleted after): `ZZ-PROBE {"version":"18.3.1","shadowLen":11043,"shadowApp":true}` on BOTH r18FF and r18WK — gallery is genuinely 18.3.1 and the shadow nested root now commits (vs DIAG-A1's empty 43-char mount).
- F30 VERDICT FORMING: FIXED (pending other-majors check: r19 gates next).

### T+35 — R19 GATES GREEN (other majors unbroken).
- agentct Toast (r19): `E2E: 60 | Passed: 60 | Failed: 0 / Unit: passed | 52` (log -toast-19-full.txt).
- agentct Announcer (r19): `E2E: 35 | Passed: 35 | Failed: 0 / Unit: passed | 15` (log -announcer-19-full.txt).
- r17 needs no run: legacy `ReactDOM.render` path untouched by the edit (createRoot branch only).
- F30 VERDICT: FIXED. Real fix holds on all 3 r18 legs, r19 + r17 paths unaffected.

### T+50 — SHADOW SPOT ROUND COMPLETE (r18 Chromium, agentct --e2e --react 18).
- Announcer full ×2: 35/35 both (above — doubles as spot item 1).
- Measure full: `E2E: 10 | Passed: 10 | Failed: 0` (log -measure-18cr-full.txt). No shadow-pattern reds.
- Toast HardenShadow (`-g "hardening shadow"` = TO-ENV-03 only): `1 passed (1.4s)` (log -toast-18cr-shadow.txt). NOTE: pre-fix this was red on r18cr per DIAG-A1 (empty mount); fix heals it.
- Overlay Exotica file (19-ID -g alternation = all 18 tests): `17 passed | 1 failed` — OV-ENV-05 red (log -exotica-18cr-full.txt). Iso re-run: still red (`0 passed | 1 failed`, log -env05-iso.txt). r19cr iso: GREEN (`1 passed`, log -19cr-env05-iso.txt). Phase-2 r18 FF/WK: green. So: r18×Chromium-specific, iso-persistent, NOT the flushSync shape (content mounts fine — `toBeVisible` + inShadow pass; the synthetic light-DOM outside press fails to dismiss: `env-05-content toHaveCount Expected 0 Received 1`). Overlay/ is not my dir → FILED as 02-F59, handed to captain (no fix attempted, no Overlay file touched).
- BONUS (owned dir, same root cause): already-owned Toast r18 TO-ENV-03 (phase-1: red r18 FF+WK) now GREEN iso on r18FF (`1 passed 3.5s`) + r18WK (`1 passed 3.5s`) — the HardenShadow fix heals it (it asserts `shadow-app` visible, which DIAG-A1 proved unmountable pre-fix). Logs -toast-18{ff,wk}-env03-iso.txt. TO crew closed; captain may mark resolved.

## Per-item dispositions

| ID | Verdict | Rationale + repro |
|---|---|---|
| 02-F30 Announcer ANN-HOST-03 (r18 FF+WK+Cr) | FIXED | Handed-off one-line fix verified: `ReactDOM.flushSync(() => root.render(node))` in Toast.story.tsx renderInto. Skip block deleted from Announcer.ct.spec.ts. Proof: r18cr full ×2 35/35, r18FF iso ×2, r18WK iso ×2, S2 probe `18.3.1 + shadowApp:true` both engines; r19 gates Toast 60/60+52u, Announcer 35/35+15u. |
| Spot: Announcer/Measure/Toast-shadow r18cr | GREEN | 35/35 ×2, 10/10, TO-ENV-03 pass. No new reds. |
| 02-F59 (new) OV-ENV-05 r18-Chromium | FILED, handed to captain | Synthetic outside press fails to dismiss shadow-portalled content on r18cr only (`toHaveCount(0)` got 1; r19cr green, r18 FF/WK green per phase-2). Iso-persistent. Not the flushSync shape (mount commits). Repro: `pnpm agentct Overlay --e2e --react 18 -g "OV-ENV-05"`. Caveat: sibling MOD-crew product edits (focus-visible.ts) sit uncommitted in-tree — re-prove F59 after their arc lands. |
| Owned TO-ENV-03 r18 FF+WK | HEALED (verify & close) | Same HardenShadow root cause; now green iso both legs post-fix. Repro: vehicle `-g "TO-ENV-03" --project=react18-<firefox\|webkit>` + CT_REACT=18 CT_PORT=3118. |

## Resume checklist

1. Captain: verify diffs firsthand (`git diff` — mine: Toast.story.tsx +8/-1, Announcer.ct.spec.ts -16, + this log), commit per-arc (F30 real-fix arc). Sibling MOD files (focus-visible.*, Tooltip.ct.spec.ts) are NOT mine — do not sweep into my arc.
2. Handoff: 02-F59 OV-ENV-05 r18cr → Overlay crew with repro above; re-prove after MOD arc lands (in-tree confound noted).
3. Suggest: mark owned Toast r18 TO-ENV-03 resolved (healed by this arc; TO crew already closed).
4. Logs: /tmp/finish02f-f30-*.txt (announcer 18cr full1/2, 18ff/18wk iso1/2, probes ff/wk, toast/announcer r19, measure 18cr, toast 18cr shadow, exotica 18cr full + env05 iso + 19cr iso, toast env03 18ff/18wk). Temp zz-probe spec deleted; nothing committed.

CLOSED — fix crew done. No commits (captain verifies firsthand, commits per-arc).
