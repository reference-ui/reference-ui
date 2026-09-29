IN PROGRESS → CLOSED 12:20 UTC — FINISH-02F-TO (Toast fix crew). Box 75 min; fixes stopped 12:05. Owns Toast/ only; 1 file changed, 0 commits (captain verifies/commits per-arc).

Scope: FINISH-02 findings 02-F16..02-F23. Vehicle: `CT_REACT=<major> CT_PORT=3117/3118 pnpm agent playwright --dir packages/reference-lib --config=/tmp/sweep-ct.config.ts 'src/components/Toast/__e2e__/Toast.ct.spec.ts' --project=react<major>-<firefox|webkit> --ignore-snapshots` + `pnpm agentct Toast`. Ports were CLOSED at crew start (fresh boots, majors genuine); all reds re-run truly isolated (single -g).

## Run log (15-min cadence, quoted proof)

### 11:40 UTC — CREW START. FINISH-02 log read. Key correction from raw logs: F17 TO-AUTOCLOSE-01 fails at :407 (the SWIPE phase `swipeToast(page,'manual')` → `toHaveCount(0)`), NOT timer/manual — :393 auto-timer + :402 close-click already passed. So F16+F17 = one swipe-on-FF mechanism. F23 fails at :605 (dragToast :44 precondition, toast `data-state="closed" data-exiting="true" data-swipe-out="true" generation="2"` → the 44px drag at :602 DID dismiss). F20 fails at :1154 (`btn-away.click()` then `toBeFocused()` — zero Toast code in path).

### 11:55 UTC — SWIPE ROOT CAUSE PROVEN (FF). Fresh isolated repro `TO-SWIPE-01` r17FF red at :287 (`toHaveCount(0)` got 1); failure screenshot shows toast at RESTING position (no stuck offset visible at rest scale). Temp diag spec (Toast/__e2e__/zz-diag.ct.spec.ts, deleted after) recorded in-page telemetry on r17FF:
- `DIAG box x=598 y=429 w=356 h=54` → swipeToast drags to x=818, OUTSIDE the 800px viewport.
- `DIAG mid {"swipeX":"165px","swiping":"true","state":"open"}` → drag starts, in-window moves apply.
- `DIAG after {"present":true,"swipeX":"-89.7px","swiping":"true","state":"open"}` → drag STUCK; -89.7 = -598×0.15 = dampened phantom.
- `DIAG log` shows moves @653/708/763 (b=1, applied 55/110/165), then `win-pmove@0`, `win-mmove@0 b=0`, and ZERO up/cancel events anywhere.
Verdict: FF reports the out-of-window position (x=0, buttons=0) and DROPS the mouseup → `finishDrag` never runs → toast follows the phantom to -89.7px and stays. (Out-of-viewport theory first died on the resting screenshot, revived by telemetry: moves arrive until the window edge.) Real-user twin: release outside the browser window strands any drag today.

### 12:05 UTC — FIX LANDED (ToastSystem.tsx +12). Window move handler now finishes the drag when a mouse move with `buttons===0` arrives mid-drag (lost-up recovery); touch/pen excluded via `pointerType==='mouse'` guard so hover moves (draggingRef false) and locked toasts (drag never starts) are untouched:
- `isReleasedMouseMove(e)` helper + branch in `onMove` calling `finishDrag()` before applying the phantom.
Post-fix: `TO-SWIPE-01|TO-AUTOCLOSE-01` r17FF 2/2 ×2 runs (`2 passed (6.5s)`, `2 passed (7.0s)`) and r18FF 2/2 ×2 (`2 passed (7.4s)`, `2 passed (6.7s)`) — logs /tmp/finish02f-to-fix-r{17,18}-run{1,2}.txt. No new fixes after this point.

### 12:12 UTC — SINGLES DISPOSITIONED.
- F22 RICH r18FF: GREEN truly isolated ×2 (`1 passed (3.3s)` /tmp/finish02f-to-f22-iso.txt + `1.8s` paired re-run) after red in full + 8-worker iso-set → contention transient (click→show no-show under load), same signature as the 4 noted-not-absorbed r18FF transients.
- F23 PHYSICS r18WK: RED truly isolated (same :605 signature). Pacing probe (diag replica, exact 44px/45-step/250ms recipe): r18WK `totalMs:294, velocity44:0.150 > 0.11 → state:closed` vs r18FF `totalMs:635, velocity44:0.069 → state:open`. Same code, same test — only engine step-pacing differs (WK ~1ms/step, FF ~8.5ms/step); the recipe needs total >400ms to stay under the documented `distance>=45 || velocity>0.11` contract. Both legs contract-correct → test-marginal, component change would break the Sonner contract.

### 12:15 UTC — REGRESSION SWEEP. r18WK `SWIPE-OUT|DISMISSIBLE-01` 2/2 green; r18FF `DISMISSIBLE-01|RIVAL-RICH` split (RICH green, DISMISSIBLE red at :366 `locked-timed toBeVisible element(s) not found` — a line with NO drag, unreachable by the fix; re-ran truly isolated → GREEN 3.0s /tmp/finish02f-to-dismissible-iso.txt → paired-run contention transient, not absorbed, not a regression). Diag spec deleted. `git status` Toast/: only `M ToastSystem.tsx`.

### 12:20 UTC — CLOSED. `pnpm agentct Toast`: `E2E: 60 | Passed: 60 | Failed: 0 / react19: 60 passed | 0 failed / Unit: passed | 52 tests (workspace React 19)` — r19 full green incl. TO-A11Y-01 (canonical-dark proof for F21 scope) and all swipe tests (no Chromium regression from the fix).

## Per-finding dispositions

| ID | Verdict | Rationale + repro |
|---|---|---|
| 02-F16 TO-SWIPE-01 (r17+r18 FF) | FIXED | Lost-up: drag exits 800px viewport (598+220=818); FF drops out-of-window mouseup (telemetry: phantom `win-mmove@0 b=0`, zero ups, stuck `swiping=true`). Fix: finish drag on buttons===0 mouse move mid-drag. Green ×2 both majors post-fix. |
| 02-F17 TO-AUTOCLOSE-01 (r17+r18 FF) | FIXED | Same swipe mechanism (failing line was :407 swipe phase; timer+close phases passed pre-fix). Same fix, green ×2 both majors post-fix. |
| 02-F18 TO-FOCUS-01, 02-F19 TO-FOCUS-02 (r17+r18 WK) | HELD | WK doesn't focus buttons on click → focusin-recorded opener chain (`lastOutsideFocus`/`previousFocusRef`) empty → `restoreToastFocus` no-ops → `toBeFocused inactive`. Cross-component shape (Popover 02-F14, Tooltip 02-F24..F27); Toast-only pointerdown-recording patch would leave F20 red and diverge semantics → held per brief, needs vehicle-level decision. Repro: `-g "TO-FOCUS-01\|TO-FOCUS-02" --project=react<major>-webkit`. |
| 02-F20 TO-OV-03 (r17+r18 WK) | HELD | Engine-only: failing line :1154 clicks story `btn-away` and asserts focus — no Toast code in path; unfixable in component. Same WK click-focus root + vehicle decision as F18/19. |
| 02-F21 TO-A11Y-01 (r17+r18 WK) | SCOPED | Node is unstyled story markup (`toast.custom()` form button); component CSS never touches it; canonical r19 Chromium-dark GREEN (agentct 60/60). WK-dark UA paints native button face light + text light (1.12–1.14 vs 4.5). Component-side "fix" (restyle app content / force color-scheme) architecturally wrong → test-owner decision (extend toast-input-style exclusion or accept WK quirk). |
| 02-F22 TO-RIVAL-RICH (r18 FF) | SCOPED (transient) | Red full + 8-worker set, GREEN truly isolated ×2. No-show-under-load signature shared with 4 absorbed-not transients; no component defect found. Settle with quiet full-suite re-run. |
| 02-F23 TO-RIVAL-SWIPE-PHYSICS (r18 WK) | SCOPED (test-marginal) | Proven pacing boundary: 44px recipe needs >400ms; WK 294ms (v=0.150, dismiss ✓), FF 635ms (v=0.069, stay ✓) — both contract-correct. Margin belongs to test owner (more steps/longer hold). Repro: `-g TO-RIVAL-SWIPE-PHYSICS --project=react18-webkit`. |

## Resume checklist

1. Captain: verify ToastSystem.tsx diff firsthand (`git diff`), commit per-arc (fix arc = F16+F17; held/scoped arcs need no commit).
2. Quiet full-suite Toast r18FF re-run (settle F22 + DISMISSIBLE transient, confirm no order-dependence).
3. Vehicle-level decision: WK click-focus specs (Toast F18–F20 + Popover F14 + Tooltip F24–F27) — explicit `.focus()` in specs vs WK exception.
4. Test-owner follow-ups: PHYSICS 44px margin (steps/hold); A11Y-01 WK `toast-form-close` exclusion decision.
5. Logs: /tmp/finish02f-to-f22-iso.txt, -f23-iso.txt, -fix-r17/18-run1/2.txt, -regr-ff/wk.txt, -dismissible-iso.txt. Sibling crews: 02b DIAG + 02F-CB active during box — transients above attributed isolated, none absorbed.
