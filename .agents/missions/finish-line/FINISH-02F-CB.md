CLOSED — FINISH-02F-CB (Combobox r17-FF cluster, 02-F1..F10). Captain-verified firsthand: r19 105/105 + unit 94; r17-FF 98/100 with ONLY CB-COMP-01 (:2435) + CB-COMP-04 (:2667) red as held.

## +15 — full repro confirmed
- Full r17-FF: 90/100, EXACTLY 02-F1..F10 red (`/tmp/finish02f-cb-full17ff.txt`). Genuineness: probe `PROBE runtime=17.0.2` (fresh vite on :3117, :3101 down).
- Pattern split: F1/F2/F3/F5/F6/F7/F9/F10 all use `locator.fill()`; F4/F8 do not (focus-only). NumberField r17-FF 58/58 with 37 fills → fill+onChange works in general; Combobox-specific.

## +30 — root cause PROVEN (fill cluster, 8 findings)
- Playwright FF `fill` drives text through IME composition (`beforeinput insertCompositionText` + `compositionend`, trusted).
- r17-FF trace: `compositionend(val=Al)` → React 17 commit `updateProperties←commitUpdate` writes `value=""` → `input(val="")` → onChange swallowed. r18-FF trace: `compositionend(val=Al)` → `input(val=Al)` → `valueset:"Alpha"` — no clobber.
- Mechanism: our `onCompositionEnd → setIsComposing(false)` commits SYNCHRONOUSLY inside compositionend dispatch on r17 (discrete flush), before FF's same-task trailing `input`; commitUpdate→updateWrapper re-asserts stale prop "" over composed "Al". r18 defers to microtask (auto-batch) → lands after input. Read r17/r18 react-dom sources to confirm (identical updateWrapper; timing differs).
- FIX 1 (`Combobox.tsx` handleCompositionEnd): `isComposingRef` sync + `queueMicrotask(setIsComposing(false))`. Probe-confirmed microtask lands after trailing input (`input → microtask → selchange → timeout0`, `/tmp/finish02f-cb-probe4-17.txt`).
- Result: 7/8 green iso-group (`/tmp/finish02f-cb-fix8-try1.txt`); F2 failed NEW at :1315 (second fill) with `value="AlAl"`.

## +45 — second clobber PROVEN (F2)
- fill2 trace (`/tmp/finish02f-cb-probe8-17.txt`): `selchange[0,5]` (fill selectAll) → `compositionstart` → OUR sync setTrue commit rewrites display "Alpha"→"Al", caret collapses [0,5]→[2,2] → insert appends → "AlAl".
- FIX 2 (`Combobox.tsx` handleCompositionStart): same deferral. F2 iso GREEN (`/tmp/finish02f-cb-f2-iso3.txt`: `1 passed`).
- Fill cluster 8/8 green (7 group + F2 iso). Remaining: F4/F8 stuck-focus pair (no fill; separate mechanism suspected).

## +60 — F4/F8 diagnosed, HELD (not cleanly fixable in-box)
- F4 (CB-COMP-01 :2506): after Tab-commit, focus stays on `wt-trigger` (expected moved on). F8 (CB-COMP-04 :2743): after Tab-commit in shadow lock, focus stays on `so-input` + shadow activeElement non-null (expected null/body — the r19-FF pin).
- Mechanism (same sync-vs-microtask theme, Tab instance): Tab keydown handler setStates (handleSelect/resolve + setIsOpen(false) → story onDismiss → popover unmount) commit SYNCHRONOUSLY inside keydown dispatch on r17, so FF computes sequential-focus-navigation on the post-commit tree; on r18/r19 the unmount lands in a microtask after traversal. All log/commit legs green — ONLY the focus landing differs.
- Why not fixable in-box: deferring the Tab side-effects to a microtask (the fill-cluster pattern) REVERSES effect order on r17 — blur's sync commit (traversal runs before the microtask) would resolve/dismiss before the deferred Tab-commit, producing `['open','dismiss','change:…']` instead of `['open','change:…','dismiss']` (CB-COMMIT-05/CB-COMP-01 log order). Correct repair needs deferred-dismiss architecture or traversal-aware commit design — HQ focus-ruling-level, cross-cutting, unprovable in this box.
- Supporting: F8's own spec comment (:2726-2733) declares the landing "FocusLock×shadow×FF routing, out of Combobox scope (D1-class; HQ focus ruling owns any reclaim hardening)" and merely pins r19-FF's landing. r17 keeping focus on the source (vs dropping to body) is arguably better focus management, not a user-facing regression.
- Repros (post-fix tree, both still red): `-g "CB-COMP-01:"` / `-g "CB-COMP-04:" `--project=react17-firefox` + CT_REACT=17 CT_PORT=3117.
- Disposition: HOLD both, rationale above. No fix attempted (a wrong Tab-timing fix would break commit order on all majors).

## Per-finding verdicts
| ID | Verdict | Proof |
|---|---|---|
| 02-F1 CB-REVERT-02 | FIXED (compositionend defer) | group green `/tmp/finish02f-cb-fix8-try1.txt` + full-suite green `/tmp/finish02f-cb-full17ff-post.txt` |
| 02-F2 CB-MODE-05 | FIXED (+ compositionstart defer) | iso `/tmp/finish02f-cb-f2-iso3.txt` (`1 passed`) + full-suite green |
| 02-F3 CB-COMP-02 both | FIXED | group + full-suite green |
| 02-F4 CB-COMP-01 | HELD (Tab-traversal commit timing; rationale above) | still red post-fix, same assertion |
| 02-F5 CB-COMMIT-02 | FIXED | group + full-suite green |
| 02-F6 CB-CUSTOM-01 | FIXED | group + full-suite green |
| 02-F7 CB-CUSTOM-02 | FIXED | group + full-suite green |
| 02-F8 CB-COMP-04 | HELD (Tab-traversal commit timing; rationale above) | still red post-fix, same assertion |
| 02-F9 CB-EDIT-09 | FIXED | group + full-suite green |
| 02-F10 Async | FIXED | group + full-suite green |

Fix (2 edits, `packages/reference-lib/src/components/Combobox/Combobox.tsx` handleCompositionStart/End): `isComposingRef` stays synchronous (behavioral gates); `setIsComposing` deferred via `queueMicrotask` so r17 commits land after FF's same-task trailing input event / preserve the replacement selection — r17-parity with r18/r19 auto-batch timing. No legacy props, no fallback, sync API untouched.

## Verification (all post-fix, quoted)
- r17-FF full: `98 passed, 2 failed` — only F4 (CB-COMP-01 :2435) + F8 (CB-COMP-04 :2667), same assertions (`/tmp/finish02f-cb-full17ff-post.txt`). The 8 fixed legs green in full-suite AND in iso/group runs (two-in-a-row ✓).
- r19 `pnpm agentct Combobox`: `E2E: 105 | Passed: 105 | Failed: 0` + `Unit: passed | 94 tests` (`/tmp/finish02f-cb-agentct.txt`).
- r18-FF full: `100 passed (0 failed)` (`/tmp/finish02f-cb-full18ff-post.txt`). r17-WK full: `100 passed (0 failed)` (`/tmp/finish02f-cb-full17wk-post.txt`). Majors scan legs unaffected ✓.
- Tree: only `Combobox.tsx` + this log are mine (probe spec deleted). `FINISH-02.md` edits + `packages/reference-lib/*.png` rewrites are sibling 02b crew's (Overlay spec screenshots) — untouched. NOTHING committed (captain verifies firsthand, commits per-arc).

## Resume checklist
1. Captain firsthand verify: r17-FF F1/F2/F3/F5/F6/F7/F9/F10 green; F4/F8 still red as held.
2. Commit per-arc if accepted (fix arc = Combobox.tsx composition deferral; holds = F4/F8 with rationale).
3. F4/F8 follow-up needs HQ focus-ruling-level design (deferred-dismiss / traversal-aware commits) — do NOT apply naive Tab-effect deferral (reverses commit/blur order on r17).
4. Scaffolding: `/tmp/finish02f-cb-*.txt` (14 logs) + `/tmp/sweep-ct.config.ts`; nothing stray in repo.

CLOSED — FINISH-02F-CB. 8 fixed green, 2 held with rationale. All 10 owned.


