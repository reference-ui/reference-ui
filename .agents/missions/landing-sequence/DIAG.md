# DIAG — root-cause log (REPORT ONLY)

Box: 60 min hard from ~18:40 UTC. Cap 20 min/question. No new probes after 50 min. No repo edits except temp probes (deleted after). No commits.

Scope: D1 WebKit focus class, D2 FF dup commit/input, D3 Home/End caret, stretch F40.
Vehicle: `pnpm agent playwright --dir packages/reference-lib --config=/tmp/sweep-ct.config.ts <spec> -g "<CASE>" --project=react19-<firefox|webkit> --ignore-snapshots`.
Evidence: SWEEP.md + /tmp/sweep-*.txt (all present, verified) + /tmp/sweep-ct.config.ts (present).

## 17:55 UTC — OPEN. Artifacts verified (/tmp/sweep-*.txt + config present). Box 17:55→18:55 UTC. Probes after 18:45 forbidden.

## D1 VERDICT (18:14 UTC) — WebKit focus class: PLATFORM, with product-hardening tail

Minimal repros (plain HTML, zero product code, `/tmp/diag/probe-d1*.spec.ts` + `/tmp/diag/diag.config.ts`):

- `D1A[webkit]  start:b1 tab1:i1 tab2:BODY tab3:i1 tab4:BODY click-b2:BODY click-l1:BODY click-i1:i1`
- `D1A[chromium] start:b1 tab1:l1 tab2:b2 tab3:i1 tab4:BODY click-b2:b2 click-l1:l1 click-i1:i1`
- `D1A[firefox]  start:b1 tab1:l1 tab2:b2 tab3:i1 tab4:i1 click-b2:b2 click-l1:l1 click-i1:i1`
- `D1B[webkit]  focus-b1:b1 focus-l1:l1 focus-d1:d1` (programmatic `.focus()` lands fine on button/link/div)

Reading: on WebKit, Tab visits text inputs only (skips buttons/links), and click never moves focus to buttons/links. This is Safari's documented default model (keyboard navigation off by default; click-focus only for text controls). Chromium/FF traverse + click-focus everything. Product-independent — proven without mounting any component.

Sub-case verdicts:
- **Tab/click-traversal (PLATFORM + SPEC assumptions → spec scoping, NOT product fix):** F8 (Tab walk stays on body — story tabbables are buttons), F12/F14/F15/F17/F18/F23/F25 (CB Tab/Shift+Tab landing-id null), F28/F30/F34/F35/F37 (LB/TR/CA/AC `toBeFocused→inactive` after Tab), F41–F44 (Menu outside-press/click focus targets), F7 (click `commit-lab-outside` then `toBeFocused` — click-focus), F45/F46/F49/F50/F51/F52/F55 (FocusLock click/Tab-driven landings; FL-SHARD-01 line 63 programmatic entry-focus PASSED, line 69 click-focus FAILED — same test proves the split). Safari ships this model to real users; specs were written against Chromium traversal.
- **Restore sub-cases (PLATFORM-triggered, PRODUCT-hardening candidate → fix crew post-HQ-ruling):** F47/F48/F53/F54/F56. FL-RESTORE-01 repro: line 170 programmatic entry-focus PASSED, line 172 restore-to-trigger FAILED. Mechanism hypothesis (unconfirmed): `FocusLock.tsx` `restoreOnce` restores `previousActiveElementRef` captured at activation — on WebKit the opening click never focused the trigger, so origin capture is body/wrong and restore no-ops (alt: `alreadyMoved` guard suppresses). Real Safari users would hit this too. Settles in 5 min with an instrumented probe logging captured origin + guard branch per engine.
- **F57 FL-TRAP-02 (PLATFORM-triggered PRODUCT gap):** click outside on WebKit blurs trap-a→body (Safari mousedown-blur-to-body) with `relatedTarget===null`, which slips the `handleFocusIn` guard (`FocusLock.tsx:456-461`, returns early on body+null-relatedTarget) → no reclaim → containment lost. High-confidence mechanism from code read; real-user-facing on Safari.
- **F58 FL-TRAP-05 (UNRESOLVED at cap):** disable-driven move lands on body/null on WebKit. Best hypothesis: reclaim path (`queueReclaim`/observer vs focusin ordering) keys off a focus sequence WebKit never emits because the disabling click didn't move focus. Settles with a 10-min instrumented probe logging focusin/focusout/mutation order on disable-click per engine.

Disposition: traversal sub-cases → spec scoping (webkit-conditional Tab expectations or documented platform skip); restore/trap sub-cases → product fix candidates (need HQ focus ruling first, per captain). Open 5-min check for fix crew: whether Playwright WebKit exposes a full-keyboard-access launch pref (none known) — if it exists, harness-env fix beats spec scoping.

## 18:14 UTC — D1 closed. Opening D2 (FF dup commit/input). Cap 18:34.

## D2 VERDICT (18:35 UTC) — FF dup commit: REAL double-publish PRODUCT bug, FF sync-submit trigger

Probes (plain HTML, `/tmp/diag/probe-d2*.spec.ts`):
- `D2A enter: keydown,keypress,change,submit,keyup` — IDENTICAL on FF and Chromium (native change-on-Enter exists in both; not the discriminator).
- `D2B blur after programmatic-set + synthetic input/change: blur,focusout` — identical both engines (no native change-on-blur either side).
- `D2C[firefox] keydown,submit,micro` vs `D2C[chromium] keydown,micro,submit` vs `D2C[webkit] keydown,micro,submit` — **DECISIVE: Firefox dispatches implicit submit synchronously inside the Enter-keydown default action; Chromium/WebKit queue it as a later task.**

Mechanism (F1/F3/F4/F5 — all NumberField Enter-in-form; certain):
1. Enter keydown → consumer `key` → `handleKeyDown` → `commitDraft()` → `runCommit` → `requestValue` (request #1, consumer onChange fires) + `setDraft(null)` queued. `draftRef.current` clears ONLY on re-render (`NumberField.tsx:1583`), and echo `setValue` is likewise unflushed.
2. On FF the sync implicit submit runs BEFORE React flushes → product `onSubmit` (`NumberField.tsx:1996-2018`) sees `draftRef` still dirty → `runCommit` again → FEATURES-#2 no-change check compares against stale `value` → `requestValue` AGAIN (request #2). Real double `onChange` to real consumers.
3. On Chromium/WebKit submit arrives post-flush → `draftRef` null → skip. Single.
- Evidence fit: F4 `order: key,request,request`; F1 `log: 9,9`; F3 EDIT-14 (fill×3 + Enter) `log: 42,42`; F5 COMP-01 (fill 99 + Enter, then Increment-hold 100) `log: 99,99,100`. FORM-09 (synthetic input/change + blur, NO Enter) passes on FF — the submit leg is necessary. Fix direction (fix crew): clear `draftRef` synchronously in `runCommit` (as `onReset` already does at :2028) and/or re-entrancy guard in `onSubmit`. One-line class.
- Verdict: PRODUCT bug (re-entrancy), FF-only in practice. NOT a test artifact — real FF users double-publish today.

Tail (same cluster, lower certainty):
- F11 CB-COMP-02 list-mode extra `input:Charlie` (after `change:bravo` in the log): UNRESOLVED at cap. Best hypothesis: same FF sync-submit trigger re-driving a Combobox input-sync path (CB fixtures use forms). Settles with a per-engine log-sequence diff of the list-mode flow + checking whether Combobox listens to submit.
- F36 DF-CMT-07 (no Enter/submit in flow; synthetic compositionstart + fill + programmatic replace + synthetic compositionend → `Changes: 1`): UNRESOLVED at cap, separate mechanism. Best hypothesis: FF `fill()` during an open synthetic composition primes different session state (FF fill event choreography vs Chromium), so the stale-end guard misses. Higher test-artifact flavor (no real IME interleaves programmatic replace this way), but still a bogus publish — fix crew to confirm with a fill-during-composition event dump per engine.

Disposition: F1/F3/F4/F5 → PRODUCT fix (highest landing priority in this cluster; blocks FF correctness). F11/F36 → fix-crew diagnosis first, then fix-or-scope.

## 18:35 UTC — D2 closed. Opening D3 (Home/End caret). Probe window to 18:45 hard.

## D3 VERDICT (18:52 UTC) — Home/End caret: PLATFORM editing behavior; trigger-jump tail unresolved

Probes (plain input, zero product code, `/tmp/diag/probe-d3*.spec.ts`):
- `D3A[chromium] fill:1,1 home:0,0 end:1,1 mid:5,5 home2:0,0 end2:13,13` — Home/End move caret.
- `D3A[firefox] fill:1,1 home:1,1 end:1,1 mid:5,5 home2:5,5 end2:5,5` — Home/End are caret NO-OPs.
- `D3A[webkit] fill:1,1 home:1,1 end:1,1 mid:5,5 home2:5,5 end2:5,5` — same no-op as FF.
- `D3B[all three] key=Home code=Home keyCode=36 | key=End code=End keyCode=35` — Playwright delivers IDENTICAL key events; the engines' DEFAULT EDITING ACTION differs (FF/WebKit macOS builds don't bind bare Home/End to caret move; Chromium implements cross-platform caret behavior itself).

Sub-case verdicts:
- **F2/F6 NF-EDIT-06, F9/F13 CB-EDIT-03 (PLATFORM + SPEC assumptions → spec scoping):** specs assert NATIVE caret movement (product correctly leaves the keys unhandled: NF `handleKeyDown` returns early for unbounded min/max; test title says "remain native"). FF-End-noop keeps click-placed caret [0,0] (F2); WK-Home-noop keeps [1,1] (F6 — WK End "passed" only because click placed the caret at end); CB Home-noop keeps selectionStart 11 (F9/F13). Exact fit, product-independent. Real Safari/FF-macOS users get the same native behavior — nothing to fix in product.
- **F16/F24 trigger Home/End jump, F26 shift-tab (UNRESOLVED at cap):** product-HANDLED keys on button triggers, so D3A doesn't cover them. F16 raw: after click-open + End, `aria-activedescendant` stuck at `ref-opt-bravo`, trigger text "Bravo" (error-context stable over 14 retries). Best hypothesis: WebKit no-click-focus (D1) leaves focus on body so the trigger key handler never fires — End never arrives, active stays at initial bravo (consistent if the story defaults value/active to bravo; Chromium jumps bravo→charlie). Alternative: pointer-hover activation under WebKit geometry. Settles with a 10-min instrumented CT probe logging activeElement-at-keypress + activedescendant timeline from open. FLAG: if keys-after-mouse-open go to body on Safari, keyboard follow-up after mouse-open is broken for real Safari users → possible PRODUCT fix (explicit trigger `.focus()` on open) — needs the HQ focus ruling too.
- Disposition: caret sub-cases → spec scoping (per-engine native expectations, or Cmd+Arrow equivalents on FF/WK-macOS). Trigger-jump → diagnose-then-decide.

## F40 STRETCH VERDICT (18:53 UTC, read-only — probe window closed): SPEC over-assertion on PLATFORM native difference

MN-LINK-06 (nested): `<a href="#nested-dl" download="nested.csv">` clicked → Chromium keeps hash `''`, FF+WebKit navigate to `#nested-dl`. No product navigation logic is involved (design intent is "keep native effects", sibling test title). The `download` + same-document-fragment interaction is engine-native and differs: Chromium suppresses fragment navigation when `download` is present; FF/WebKit perform it. Real-user impact ~nil (harmless hash change). Disposition: SPEC SCOPING (per-engine hash expectation). Fix crew can confirm in 3 min with a plain-anchor probe if desired.

## FINAL REPORT (18:53 UTC)

**D1 WebKit focus (~30):** PLATFORM (Safari Tab-skips-buttons + no-click-focus, proven product-free) + SPEC traversal assumptions → SCOPE the traversal assertions; restore (F47/F48/F53/F54/F56) + trap (F57, F58-unresolved) are platform-TRIGGERED PRODUCT gaps → fix candidates post-HQ-focus-ruling.
**D2 FF dup (6):** F1/F3/F4/F5 REAL double-`onChange` PRODUCT re-entrancy bug (FF sync implicit-submit + `draftRef` cleared only on render) → PRODUCT FIX, highest priority. F11/F36 unresolved (sync-submit-redrive / fill-during-composition hypotheses) → diagnose-first.
**D3 Home/End (7):** F2/F6/F9/F13 PLATFORM editing no-op (identical key events, different default action) → SCOPE. F16/F24/F26 unresolved, focus-routing hypothesis + Safari UX flag → diagnose-then-decide.
**F40:** platform-native download/fragment difference → SCOPE (read-only verdict).

Per-cluster fix-vs-scope: FIX → D2-NumberField re-entrancy (FF correctness blocker), D1-restore/trap hardening (post-ruling), D3-trigger-jump if probe confirms focus-routing. SCOPE → D1-traversal (~24), D3-caret (4), F40, G1/H1 (per captain). DIAGNOSE-FIRST → F11, F36, F58, F16/F24/F26 (each has a named 5–10 min settling probe above).

Resume checklist for fix crews:
1. D2 fix: clear `draftRef` synchronously in `runCommit` (`NumberField.tsx`, mirroring `onReset:2028`) and/or guard `onSubmit:1996`; re-run NF-FORM-12/EDIT-14/COMMIT-02/COMP-01 on FF.
2. D1 restore/trap: instrumented CT probe (captured origin + `alreadyMoved` branch + focusin/relatedTarget timeline) on WebKit; then harden `FocusLock.tsx` `restoreOnce`/`handleFocusIn`; needs HQ focus ruling first.
3. D3 trigger-jump: instrumented CT probe (activeElement at keypress + activedescendant timeline); if focus-routing confirmed, decide explicit-focus fix (ruling!) vs scope.
4. F11/F36/F58: per-verdict settling probes, then fix-or-scope.
5. Playwright WebKit full-keyboard-access launch pref: 5-min existence check — if it exists, harness-env fix could obsolete D1 traversal scoping.
6. Remaining singles/splitter (F10/F19–F21/F29/F31–F33/F38/F39/F59–F68) were out of DIAG scope — untouched.
7. Probes were /tmp-only (`/tmp/diag/*`) — DELETED 18:54 UTC; `git status` shows only this log modified. Zero repo residue. No processes started (all runs via canonical runner, foreground). Box closed inside 60 min.

## Captain disposition + landing

- Lane held: report-only, zero repo residue (only this log modified).
  Verdicts accepted: D1 platform+scope / restore-trap product-tail,
  D2 real re-entrancy (fix now), D3 platform+scope / trigger-tail,
  F40 scope.
- Dispatched (clear-and-clean rule): FIX-D2 (NumberField re-entrancy
  fix + F2/F6/F7 scoping), SCOPE-1 (Select chain + Announcer, incl.
  F11/F16/F24/F26 diagnose-then-fix-or-scope + WK-pref existence
  check FIRST), SCOPE-2 (Date/Disclosure/Menu/FocusLock-traversal,
  incl. F36 probe; FocusLock restore/trap untouched-held).
- Held for HQ: D1 restore/trap product fixes (focus ruling), G1/H1
  dispositions (confirm), Splitter cluster (4a ruling + undiagnosed).
- SCOPE-1's first act gates the wave: if a WebKit
  full-keyboard-access launch pref exists, traversal scoping is
  wasted — crew reports immediately and holds traversal items
  pending a harness-env decision.
