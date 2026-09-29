IN PROGRESS — FINISH-02F-F59 fix crew (Overlay OV-ENV-05 r18-Chromium). Box: 60 min hard. Branch reference-system.

### T+0 — CREW START. F30 filed row + T+50 Exotica item read. Scope: Overlay/ ONLY. Tree clean at start (no MOD confound). Sibling baselines crew active.

### T+15 — REPRO + MISATTRIBUTION BREAK (quoted from /tmp/finish02f-f59-*.txt).
- r18cr iso: `E2E: 1 | Passed: 0 | Failed: 1` (iso1, clean tree, no instrumentation). OUT-11 (mirrored light-DOM deferred path) PASSES r18cr → shadow×r18×cr specific, not the deferred path.
- Failing line is :554 (iso1/iso2/iso4), NOT :547 — the Escape half (reopen → Escape), NOT the outside press. F30's "outside press fails" misattributed (both halves end in identical toHaveCount(0)). One-bit read (iso5): `log:"outside,dismiss"` — first-half dismiss FIRES; zombie hunt (iso6): content nowhere (unmounted clean).
- Decision-trace instrumentation (listeners.ts window.__ovDebug; temp, reverted before close) + temp zz probe (deleted after): passing first-half trace is fully healthy (down→up→click→requestOutside).

### T+30 — ESCAPE KEYDOWN NEVER REACHES onEscape (bind race forming).
- Full-replica probe (probe3): FAILS at Escape half; trace shows reopen bind-scheduled→bind but NO escape record.
- Routing probe (probe4): `keys:["win-cap","doc-cap"]` (keydown arrives, target in shadow) but NO bubble onEscape record. Stop-level probe (probe5): FULL propagation incl. doc-bub-TEMP → not stopPropagation; onEscape listener absent at arrival.
- Decisive order run (probe7, no settle): `arrive:235.4` vs `bind:239.6` — Escape arrived 4.2ms BEFORE the deferred bind; bind timer took 11.6ms (loaded machine). NO escape record, log stuck at "outside,dismiss". PROVEN: reopen bind timer loses to keyboard.press; Escape swallowed.
- First half normally wins the same race (extra dest-check roundtrip buffers the timer); probe6 caught one first-half flake (1/12) — same race, load transient.
- Fix design: bind Escape (keydown) SYNCHRONOUSLY in syncDismissListeners; keep pointer/click deferred (their "next task" deferral guards flushSync self-dismiss; Escape has no same-tick opener hazard).

### T+45 — FIX LANDED + ALL GATES GREEN (quoted from /tmp/finish02f-f59-*.txt).
- Fix (`dismiss/listeners.ts` only, +14/-5): `keydown` (Escape) split out of the deferred `DocEntry` bundle; new `escapeBound` WeakSet + `bindEscapeSync` called synchronously in the needed-branch (before the timer guard), `unbindEscape` in the else-branch. Pointer/click/pointercancel keep the next-task deferral. No legacy props, no fallback.
- r18cr ENV-05 iso ×2: `1 passed | 0 failed` both (fix1, fix2) — two-in-a-row green.
- r19 full `pnpm agentct Overlay`: `E2E: 120 | Passed: 119 | Failed: 1 / Unit: passed | 34` — single red attributed: OV-DOM-01 only (allowed). (r19-full.txt)
- r18 FF ENV-05 (vehicle): `1 passed` (r18ff-env05.txt). r18 WK ENV-05 (vehicle): `1 passed` (r18wk-env05.txt).
- Cleanup: temp zz probe deleted; listeners.ts traces reverted (diff is fix-only); spec file byte-identical; no stray PNGs (`git status`: M listeners.ts + this log only). Nothing committed.

## Disposition

| ID | Verdict | Rationale + repro |
|---|---|---|
| 02-F59 OV-ENV-05 (r18-Chromium) | FIXED | Misattributed half: fails at :554 (reopen→Escape), not :547 (outside press fires + unmounts clean). Proven root cause: reopen's deferred document bind (setTimeout 0, 11.6ms under load) loses to `keyboard.press` (arrive 235.4 vs bind 239.6) → Escape keydown arrives unbound → swallowed. Fix: sync Escape bind in `dismiss/listeners.ts`. Repro: `pnpm agentct Overlay --e2e --react 18 -g "OV-ENV-05"`. Note: first-half synthetic dispatch won the same race 11/12 (probe6 caught one load flake) — pointer deferral intentionally kept; not in scope. |

## Resume checklist

1. Captain: verify firsthand (`git diff` — mine: `dismiss/listeners.ts` +14/-5 + this log), commit per-arc (F59 Escape-bind arc). No other files touched.
2. Proof logs: /tmp/finish02f-f59-{r18cr-iso1,out11,r18cr-probe1..7,r18cr-iso2..6,r18cr-fix1,fix2,r19-full,r18ff-env05,r18wk-env05}.txt.
3. Suggest: F30's filed "outside press fails" description should be corrected to the Escape half (:554) wherever tracked.
4. No temp files left in tree (zz probe deleted, traces reverted). Sibling FINISH-04 log moved/renamed by its crew mid-box — not mine, untouched.

CLOSED — fix crew done. No commits (captain verifies firsthand, commits per-arc).
