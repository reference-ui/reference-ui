# NFLAST-3 — objective log

IN PROGRESS

Scope: NumberField to 148-or-manual (FINAL wave). Start: NFLAST2.md
resume checklist (paste engine EDIT-08/09+PARSE-07+COMP-02, EDIT-02
filtering, EDIT-07 caret, DYNAMIC-05, ENV-06 audit, ENV-02, COMP-04)
+ EDIT-15/16 FF/WK legs (both engines red identically — affix
deletion + undo choreography; diagnose-then-fix-or-scope).
Rulings stand; flags stay flagged. Legs ≤15, each green before next.
GATE (mandatory, no exceptions): `pnpm agentct NumberField` +
`--e2e --react 17,18` + FF/WK vehicle FULL green. The vehicle
(`/tmp/sweep-ct.config.ts`, recreate from SWEEP.md P0 note if lost)
is IN SCOPE — wave-2's out-of-scope claim was wrong. SPEC'd behavior
only: NO prop/type/export changes. Box: 90 min, wrap 75. Crew writes below.

## 22:47 — Inherited state CONFIRMED (first act)

- `pnpm agentct NumberField --unit` → "Tests 130 passed (130)"
- `pnpm agentct NumberField --e2e` → "E2E: 48 | Passed: 48 |
  Failed: 0 / react19: 48 passed | 0 failed"
- `pnpm agentct NumberField --e2e --react 17,18` → "E2E: 96 |
  Passed: 96 | Failed: 0 / react17: 48 / react18: 48"
- Captain logs present: /tmp/nf-ff.txt + /tmp/nf-wk.txt (FF 46/48,
  WK 46/48) + /tmp/sweep-ct.config.ts vehicle. No re-run needed.
- Box: 22:42→00:12 UTC, wrap 23:57. Order per brief.

## 22:47 — Leg 1 DIAGNOSIS (EDIT-15/16 FF/WK, no code yet)

- EDIT-15 affix + EDIT-16 currency-cut (BOTH engines, identical
  "$1,23.50"): root cause is DIAG D3A (already documented in the
  EDIT-06 CT): bare Home/End are caret no-ops on FF/WK macOS builds.
  CurrencyFixture is unbounded → Home is native → no-op → click
  caret stays mid-input (~index 5) → Shift+Right selects '4' →
  Backspace/cut deletes '4'. Product is correct (Home unhandled);
  the CHOREOGRAPHY is Chromium-only. Fix: portable caret-to-start
  (select-all + ArrowLeft collapse — arrows proven native on all
  three engines by EDIT-06), same SPEC behavior (delete the
  individual currency token).
- EDIT-16 undo (WK ONLY — FF passed undo/redo/ranged, failing later
  at the same currency Home step): Meta+z restored '5' (mount value)
  instead of '43'. Engine cannot have written '5' (value prop null,
  draft '' at that point; no revert path active) → WebKit's native
  undo manager genuinely restored '5'. SPEC says "native
  text/selection/history behavior" → pin WebKit's native outcome +
  requests-follow-text, EDIT-06 browserName-branch precedent. Redo
  outcome unknown → probe before pinning.

## 23:02 — Leg 1 GREEN (EDIT-15/16 FF/WK, all five legs)

CT-only fix (no engine — product was correct on both):
- Portable caret-to-start (select-all + ArrowLeft collapse) replaces
  bare Home in the EDIT-15 affix step + EDIT-16 currency-cut step.
  Same SPEC behavior (delete/cut the individual currency token).
- EDIT-16 undo/redo: WebKit branch pins the observed native
  two-level traversal (undo → '5' via '43': log +43,5; redo → ''
  via '43': log +43,null). Chromium/FF keep single-level. Ranged
  replacement log keys off the redo prefix. fill() probe proved the
  WK traversal is stack-shape-independent (fill+cut still walks two
  levels), so branching (not rechoreographing) is the fix.
- Temp probe spec created, used (2 runs), deleted. No residue.

Proof quoted (full suites, zero narrowing):
- `--e2e` → "E2E: 48 | Passed: 48 | Failed: 0 / react19: 48"
- `--e2e --react 17,18` → "react17: 48 passed | 0 failed /
  react18: 48 passed | 0 failed"
- FF vehicle → "PASSED: 48 passed (0 failed) in 9.6s"
- WK vehicle → "PASSED: 48 passed (0 failed) in 7.3s"
- Unit untouched (CT-only leg; 130 proven at first act).
- SPEC still 134/148 (no new IDs — engine legs for landed cases).

## 23:38 — Leg 2 GREEN (paste EDIT-08/09 + PARSE-07 + COMP-02)

Engine (NumberField.tsx only, no prop/type/export changes):
- NATIVE beforeinput + paste listeners (one layout effect): payload
  = beforeinput.data, native paste stash second; strict-parse splice
  (allowOrphanHead=false); valid → land natively; invalid →
  preventDefault zero-mutation; useGrouping:false strips the active
  group char from the payload and applies via native setter + real
  input event + caret after insert. Composing/disabled/readOnly fail
  open; unreadable clipboard fails open (EDIT-10 holds).
- KEY FINDING (probed, then verified in the react-dom bundle):
  React's onBeforeInput derives from keypress/textInput/paste/
  compositionend and NEVER sees native beforeinput; a React onPaste
  would eagerly read clipboardData and break EDIT-10. Native
  listeners were the only correct channel — recorded in DECISIONS.md
  + interpolations (xi)(xii).
- Story: CommitLab onPaste order logger, NoGroupingFixture
  (PARSE-07), CompCurrencyFixture (COMP-02). CT: copy/stagePaste
  helpers (real Cmd+C→Cmd+V, probed green on all 3 engines) + 4
  titles. Two self-fixed test bugs (ar-EG vectors for localized
  digits — foreign scripts correctly reject under en-US; prep-blur
  commit formatting; caret arithmetic).

Proof quoted (full suites, zero narrowing):
- `--unit` → "Unit: passed | 130 tests"
- `--e2e` → "E2E: 52 | Passed: 52 | Failed: 0 / react19: 52"
- `--e2e --react 17,18` → "react17: 52 passed | 0 failed /
  react18: 52 passed | 0 failed"
- FF vehicle → "PASSED: 52 passed (0 failed) in 10.0s"
- WK vehicle → "PASSED: 52 passed (0 failed) in 7.9s"
- SPEC 134→138/148. PARSE + MATH + COMMIT families COMPLETE.

## 23:56 — Leg 3 GREEN (EDIT-02 filtering, all five legs)

Engine (NumberField.tsx only): `isImpossibleInsertion` tendency gate
in the native beforeinput listener (`insertText` branch; paste branch
untouched): cancels typed letters (one well-placed exponent e passes),
duplicate decimals, second/misplaced signs; partials/digits/groups
stage. Composing/disabled/readOnly/native-veto paths unchanged.
Interpolation (xiii) in DECISIONS.md. CT: en-US sign/decimal/dup/sign
vectors on CommitLab + de-DE comma vectors on NoGroupingFixture (real
keystrokes). Two fallout fixes, both test-side: EDIT-06 RTL buffer
now staged programmatically (fill() routes through beforeinput via
CDP InsertText, so letters correctly cancel there too — verified
'12א' is the only letter-fill in the suite); EDIT-09 paste-log
re-pin (my own sed had pasted per-keystroke expectations onto a
one-request paste vector).

Proof quoted (full suites, zero narrowing):
- `--unit` → "Unit: passed | 130 tests"
- `--e2e` → "E2E: 53 | Passed: 53 | Failed: 0 / react19: 53"
- `--e2e --react 17,18` → "E2E: 106 | Passed: 106 | Failed: 0 /
  react17: 53 / react18: 53"
- FF vehicle → "PASSED: 53 passed (0 failed) in 10.5s"
- WK vehicle → "PASSED: 53 passed (0 failed) in 7.9s"
- SPEC 138→139/148.

## 23:57 — BOX CLOSED (wrap at 75 min per HQ order)

FINAL STATE: SPEC 139/148 [x] (was 134); unit 130/130; CT 53/53 ×
React 17/18/19 + Firefox + WebKit (was 48/48 × 17/18/19, 46/48 ×
FF/WK). +5 SPEC IDs (EDIT-02/08/09, PARSE-07, COMP-02), all green on
the five-leg gate. Never committed. NumberField dir only (+ this
log). No prop/type/export changes anywhere (paste/filter ride native
listeners + existing public handler props). No foreign processes
touched. Probe specs created, used, deleted (zero residue —
NfProbe, NfPasteProbe, NfBeforeInputProbe all removed).

Files touched: NumberField.tsx (native paste/filter listeners,
isImpossibleInsertion, setNativeInputValue), NumberField.ct.spec.ts
(+5 titles, EDIT-06/15/16 re-pins, copy/stagePaste helpers),
NumberField.story.tsx (CommitLab onPaste logger, NoGroupingFixture,
CompCurrencyFixture), SPEC.md (139/148), DECISIONS.md (paste record
+ interpolations xi–xiii).

## RESUME CHECKLIST (wave-4)

Remaining automated (5): EDIT-07, DYNAMIC-05, ENV-02/06, COMP-04.
Plus NF-MANUAL-01..04 (release gates). VERIFY-FIRST: `--unit` →
130; `--e2e` → 53/53; `--react 17,18` → 106/106; FF/WK vehicle →
53/53 each (`/tmp/sweep-ct.config.ts --project=react19-<firefox|
webkit> --ignore-snapshots`; recreate from SWEEP.md P0 note if /tmp
was cleaned — vehicle is MANDATORY, every leg, no exceptions).

- [ ] EDIT-07 (caret map): logical-digit caret preservation across
  rerenders (Zag start/middle/end/prefix/suffix/insert/delete/
  grouping vectors). Needs selection save/restore in the echo path
  (value-change effect ~L2009-2061). CT with caret vectors on
  CommitLab/Currency. Untouched this wave — no new findings.
- [ ] DYNAMIC-05: disable/read-only + part-removal + owner-root
  replacement mid-interaction (key/repeat/composition/failed-submit
  cancellation, fresh-action requirement). Builds on slice-G
  invalidation + the native beforeinput listener (disabled/readOnly
  already fail open there). Needs "fresh action requirement"
  semantics resolved. Untouched — no new findings.
- [ ] ENV-06 (shadow — AUDITED wave-2, engine mapped): scope 3
  document-global lookups to node.getRootNode() — input
  labelledby ~L855-863 (getElementById + label[for] query), ENV-04
  id-collision ~L2465 (per-root count), stepper gate ~L1402 (needs
  internal button-ref into useStepperName). Form listeners already
  root-scoped ✓. Test: portal-into-shadow-root story (2 fields +
  shadow form; assert shadow activeElement, labelledby activation,
  canonical payload, document.getElementById(shadowIds) === null).
  Stepper-labelledby-in-shadow stays KNOWN RESIDUAL until threading
  lands (aria-label steppers unaffected). NOTE (new): the native
  paste/beforeinput listeners attach to the input NODE (not
  document) → already shadow-safe, no audit change.
- [ ] ENV-02 (ICU mismatch): mount-effect comparing SSR DOM value
  vs client reformat; on difference emit the existing dev
  diagnostic channel (no throw). Test: mock Intl.NumberFormat
  server-vs-client outputs. Untouched — no new findings.
- [ ] COMP-04: shadow + validate + RTL + replacement-during-
  composition. Rides ENV-06 + slice-G invalidation; mostly a big
  CT. Untouched — no new findings.
- [ ] Least-surprise flags awaiting HQ: wave-1 (b)(c) + wave-2
  i–x + wave-3 xi (paste strict-splice validity), xii (PARSE-07
  active-char-only strip), xiii (EDIT-02 typed-only gate; fill()
  routes through it). All recorded in DECISIONS.md, none
  re-litigated.

## Captain verification + landing (wave-3 arc)

- Firsthand five-leg gate: unit 130/130; CT 53/53 × React
  17/18/19; FF 53/53; WK 53/53. Matches crew on all five.
  First fully-green FF/WK NumberField run, ever.
- API grep clean (zero export/prop/type delta). Key finding
  noted: React onBeforeInput never sees native beforeinput —
  native listeners were the only correct paste/filter channel.
- Committed (134→139/148 arc + this log). Wave-4 owns the
  final 5 (EDIT-07, DYNAMIC-05, ENV-02/06, COMP-04).
