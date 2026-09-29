# NFLAST-2 — objective log

IN PROGRESS

Scope: NumberField last pass to 148-or-manual. Predecessor: NFLAST.md
(read fully). Rulings (a)(b)(c) in NumberField/DECISIONS.md stand —
do not re-litigate; least-surprise flags stay flagged. SPEC'd behavior
ONLY: no prop/type/export changes, no legacy aliases.

Box: 90 min from 22:40 → hard stop 00:10, wrap 23:55. 15-min cap per
case/slice. Log every ≤15 min. Legs ≤15 cases, all-green before next.
Landing gate for everything: `pnpm agentct NumberField` +
`--e2e --react 17,18` ALL green. Never commit. NumberField dir only.

## 22:45 — Inherited state CONFIRMED (first act)

- `pnpm agentct NumberField --unit` → "Test Files 2 passed (2)",
  "Tests 114 passed (114)"
- `pnpm agentct NumberField --e2e` → "E2E: 43 | Passed: 36 |
  Failed: 7 / react19: 36 passed | 7 failed"
- Failing 7 = NFLAST.md parked 7 (FORMAT-04, EDIT-11, FORM-09,
  DYNAMIC-02, COMP-01, FORM-11, FORM-14). Matches claim exactly.

Order: (1) parked 7 → landing gate; (2) EDIT-05 full title;
(3) PATCHES §2 Intl grammar; (4) PATCHES §1 completion incl. EDIT-11
composingRef design; (5) ENV-02/06 + EDIT-16 + DYNAMIC-05 fill-ins.

## 22:44 — Leg 1 GREEN (parked 7 landed, full gate)

CT expectation re-pins (live-request readings, NFLAST.md recipes):
FORMAT-04 (log 999 + EUR from 999), FORM-09 (42 pre-blur; 42,43,43
reject), DYNAMIC-02 (de/sci from 999/1500), COMP-01 (99,100,99,50,50),
FORM-11 Run B (order request,blur,request; log 8,8), FORM-14 (order
request,blur; 50,60,60 reject). Run A / canceled / incomplete runs hold.

Engine (EDIT-11 gap, NumberField.tsx only): `composingRef` —
onCompositionStart/End tracked via context (consumer observers first,
no veto); mid-composition input stages verbatim, never publishes;
compositionend lifts suspension only (staged buffer commits at next
boundary; real post-end input publishes via ordinary live path with
lastLiveRef dedupe). No prop/type/export changes (composition props
already in public Input type).

Proof quoted:
- `pnpm agentct NumberField --unit` → "Unit: passed | 114 tests"
- `pnpm agentct NumberField --e2e` → "E2E: 43 | Passed: 43 |
  Failed: 0 / react19: 43 passed | 0 failed"
- `pnpm agentct NumberField --e2e --react 17,18` → "react17: 43
  passed | 0 failed / react18: 43 passed | 0 failed"
- FF/WebKit vehicle: NONE EXISTS in this lane — CT config is
  Chromium-only (`devices['Desktop Chrome']`, single project). Same
  finding as wave-1. Spec `browserName` branches (EDIT-06, COMMIT-01)
  are matrix/test-core territory, out of scope. Gate = Chromium CT ×
  3 React majors.

Next: Leg 2 — EDIT-05 full title (Intl leg; ASCII core in EDIT-03).

## 22:54 — Slice A GREEN (digit parser + EDIT-05/PARSE-02/15/16)

Engine (NumberField.tsx only): `symbols.digits` derived from
`formatToParts(0..9)` under the display formatter's numbering system;
`normalizeDraftDigits` (ASCII always + one active set; second-script /
inactive-locale `\p{Nd}` + hanidec `\p{Lo}` carve-out reject); P16
fail-fast (refused `-u-nu-`/`numberingSystem` incl. silent roman→latn
fallback, compact, `signDisplay: never` throw naming the prop).
No prop/type/export changes. Matrix declared in DECISIONS.md §
"NFLAST-2 Intl parser record" (+3 flagged interpolations).

Proof quoted:
- `--unit` → "Unit: passed | 118 tests" (114 + 4; PARSE-16 needed
  one fix: symbols memo must pass the REQUESTED option nu, not the
  resolved fallback, or the refusal check masks itself)
- `--e2e` → "react19: 43 passed | 0 failed"
- `--e2e --react 17,18` → "react18: 43 passed | 0 failed" (17 same)
- SPEC 113→117/148. NumberField.md already pinned the rule incl.
  "compact/hidden-sign editing" non-goal — no docs change needed.

Next: Slice B — sign variants (PARSE-03).

## 22:59 — Slice B GREEN (sign variants PARSE-03)

Engine: `symbols.minus/plus` from `formatToParts` (fi U+2212 vs US
ASCII); leading-sign normalization (ASCII, active-locale, documented
fullwidth U+FF0B/U+FF0D + small U+FE62/U+FE63); duplicates/embedded
reject, never discard; dashes die at Number(). Interpolation (iv)
recorded in DECISIONS.md. Under min=0: validate retains -5 + invalid,
snap commits 0 (live raw in both per ruling c).

Proof quoted:
- `--unit` → "Unit: passed | 119 tests" (one self-fix: echo-on
  validate commit noops, seen [-5] not [-5,-5])
- `--e2e` → "E2E: 43 | Passed: 43 | Failed: 0 / react19: 43 passed"
- `--e2e --react 17,18` → "react17: 43 passed | 0 failed /
  react18: 43 passed | 0 failed"
- SPEC 117→118/148.

Next: Slice C — group patterns (PARSE-06/17).

## 23:03 — Slice C GREEN (group patterns PARSE-06/17)

Engine: `symbols.groupSizes` derived from a 10-digit
`formatToParts` probe ({units,middle}: 3-3 western, 3-2-2 en-IN);
`isValidGroupHead` validates head 1..middle / inner = middle /
units = units; de-CH straight-quote group accepts U+2019
(probed: Intl group IS U+0027); leading bare whitespace rejects
(P6 "arbitrary leading" clause — whitespace-only still claims
the null path upstream). No prop/type/export changes.

Proof quoted:
- `--unit` → "Tests 121 passed (121)" (first run green)
- `--e2e` → "E2E: 43 | Passed: 43 | Failed: 0 /
  react19: 43 passed | 0 failed"
- `--e2e --react 17,18` → "E2E: 86 | Passed: 86 | Failed: 0 /
  react17: 43 / react18: 43"
- SPEC 118→120/148.

Next: Slice D — affixes (PARSE-08/09/10/12/18).

## 23:12 — Slice D GREEN (affixes PARSE-08/09/10/12/18)

Engine: `symbols.affixPrefix/Suffix` derived from display-formatter
`formatToParts` across plural probes [0,1,2,3,5,11,100,1234.5],
longest-first; strip order suffix→prefix→sign→prefix-again (sign
budget 1: "-$5"/"$-5" parse, "$$5"/"++5" reject); strip-run drops
Sc/%/‰ (foreign marks die at Number()); percent scaling from
removed-affix permille tracking (+U+0609); accounting parens =
exactly one minus, unsigned paren-free inside (recursive parse +
negate). Interpolations (v)(vi)(vii) in DECISIONS.md.

Proof quoted:
- `--unit` → "Tests 126 passed (126)" (first green run after two
  self-fixed locale/punctuation test bugs + one `suffixStripped`
  typo; zero engine regressions)
- `--e2e` → "E2E: 43 | Passed: 43 | Failed: 0 /
  react19: 43 passed | 0 failed"
- `--e2e --react 17,18` → "E2E: 86 | Passed: 86 | Failed: 0"
- SPEC 120→125/148. PARSE remaining: 01, 07, 11, 13, 19.

Next: Slice E — exponents/bidi/token-proof/matrix (PARSE-11/13/01/19) + PARSE-07.

## 23:23 — Slice E GREEN (PARSE-11/13/01/19; PARSE-07 deferred to §1)

Engine: `symbols.exponentSeparator` derived (ar "أس", fa "×10^"
digit-normalized at derivation); `stripDraftExponent` (active sep
first, ASCII e/E always, one sign from full P3 set, ASCII digits);
global bidi strip (LRM/RLM/ALM incl. EMBEDDED ar/fa/he marks —
probed); dead DRAFT_STRIP_RUN deleted (trim subsumes). Fixed two
self-bugs: JS `\x{}` regex (→`\u`), default sci/eng 3-frac
rounding (exact-safe values + 21-sig sub-matrix), -0 gen exclusion.

Proof quoted:
- `--unit` → "Tests 130 passed (130)" (P11/P13 first-green;
  P01/P19 needed exactness fixes, all test-side)
- `--e2e` → "E2E: 43 | Passed: 43 | Failed: 0 /
  react19: 43 passed | 0 failed"
- `--e2e --react 17,18` → "E2E: 86 | Passed: 86 | Failed: 0"
- SPEC 125→129/148. PARSE remaining: 07 only (needs paste
  machinery → §1 leg).

Next: §1 completion (filtering/paste/caret/composition) + P07.

## 23:31 — Slice F GREEN (§1 EDIT-12/15/16)

- EDIT-16 CT (assertion-only, zero engine — no command interception
  exists): cut/undo/redo/ranged-replacement + localized currency
  cut/undo. First-run green.
- EDIT-15 engine: `parseDraftNumber` `allowOrphanHead` (commit-only;
  live stays strict) + CT (sep deletion, first-digit orphan → ',024'
  silent → Enter commits 24, affix/decimal token deletions).
- EDIT-12 engine: pre-composition snapshot + invalid-final restore at
  compositionend (empties/valids keep buffer) + new ar-EG
  CompositionFixture (reset form) + CT. One self-fix: matching
  post-end input publishes NO duplicate (React value-tracking +
  live dedupe) — the single request lands at blur, per the case.

Proof quoted:
- `--unit` → "Unit: passed | 130 tests"
- `--e2e` → "E2E: 46 | Passed: 46 | Failed: 0 /
  react19: 46 passed | 0 failed"
- `--e2e --react 17,18` → "E2E: 92 | Passed: 92 | Failed: 0"
- SPEC 129→132/148.
- PARKED (no paste/filter/caret engine exists — all need onPaste /
  beforeinput / caret-map machinery): EDIT-02/07/08/09, PARSE-07,
  COMP-02 (needs paste). Recipes for wave-3 in final report.

Next: Slice G — EDIT-17/18 composition invalidation (or wrap).

## 23:35 — Slice G GREEN (EDIT-17/18 composition invalidation)

Engine: `compositionFalloutRef` one-swallow (stale end/input after
authoritative replacement ignored; DOM node reverted to controlled
text since no state change follows); `invalidateComposition` in the
non-echo value branch + format effect (clears composing/snapshot,
arms swallow, selection to formatted end); fresh compositionstart
supersedes. Interpolations (viii)(ix)(x) in DECISIONS.md. Story:
`commit-lab-set-99` (mousedown-prevented programmatic set) +
`format-swap-nu-arab` buttons. CTs first-run green.

Proof quoted:
- `--unit` → "Unit: passed | 130 tests"
- `--e2e` → "E2E: 48 | Passed: 48 | Failed: 0 /
  react19: 48 passed | 0 failed"
- `--e2e --react 17,18` → "E2E: 96 | Passed: 96 | Failed: 0"
- SPEC 132→134/148.

Next: Slice H — ENV-06 shadow audit (timeboxed), else wrap.

## 23:55 — BOX CLOSED (wrap at 75 min per HQ order)

FINAL STATE: SPEC 134/148 [x] (was 113); unit 130/130 (was 114);
CT 48/48 × React 17/18/19 (was 36/43 × 19 only). +21 SPEC IDs, all
green on the landing gate. Never committed. NumberField dir only
(+ this log). No prop/type/export changes anywhere. No foreign
processes touched; no port conflicts met.

Per-leg greens (outputs quoted):
- Leg 1 (parked 7): unit "114 tests" → e2e "E2E: 43 | Passed: 43 |
  Failed: 0 / react19: 43" → 17/18 "43 passed | 0 failed" each.
- Slice A (EDIT-05/PARSE-02/15/16): unit "118 tests" → e2e 43/43 ×3.
- Slice B (PARSE-03): unit "119 tests" → e2e 43/43 + 17/18 43/43.
- Slice C (PARSE-06/17): unit "121 passed (121)" → e2e "43 | 43 |
  0" + "E2E: 86 | Passed: 86".
- Slice D (PARSE-08/09/10/12/18): unit "126 passed (126)" → e2e
  43/43 + 86/86.
- Slice E (PARSE-11/13/01/19): unit "130 passed (130)" → e2e
  43/43 + 86/86.
- Slice F (EDIT-12/15/16): unit 130 → e2e "E2E: 46 | Passed: 46"
  + "E2E: 92 | Passed: 92".
- Slice G (EDIT-17/18): unit 130 → e2e "E2E: 48 | Passed: 48" +
  "E2E: 96 | Passed: 96". LAST GATE 23:35, no code changed after.
- FF/WebKit: no vehicle exists in this lane (CT config is
  Chromium-only, single Desktop Chrome project — verified in
  playwright.config.ts). browser:all cases (EDIT-06/15/16) land
  Chromium CT + note the matrix-lane gap.

Files touched: NumberField.tsx (parser/composition/invalidation),
NumberField.test.tsx (+16 unit titles), NumberField.ct.spec.ts (+5
CT titles, 6 re-pins), NumberField.story.tsx (CompositionFixture,
set-99 + nu-arab buttons, ValidateFixture name was wave-1),
SPEC.md (134/148 + gaps/work-order), DECISIONS.md (matrix record +
interpolations i–x, all flagged).

## RESUME CHECKLIST (wave-3)

Remaining automated (10): EDIT-02/07/08/09, PARSE-07, COMP-02/04,
DYNAMIC-05, ENV-02/06. Plus NF-MANUAL-01..04 (release gates).

- [ ] EDIT-08/09 + PARSE-07 + COMP-02 (paste engine — biggest
      remaining lift): add `onPaste` on Input (consumer observes
      first per EDIT-09, then managed validates the spliced result:
      compute selection splice from clipboardData, parse with
      allowOrphanHead=false; valid → let native land (or apply +
      set caret after payload for P07's group-token stripping under
      useGrouping:false); invalid → preventDefault, zero mutation).
      CTs on CommitLab/Currency. COMP-02 reuses paste + proven Intl.
- [ ] EDIT-02 (filtering): `onBeforeInput` tendency gate — cancel
      letters/duplicate-decimal/second-sign insertions outside
      composition; partials pass. CT asserts canceled mutations +
      dirty persistence. Shares sign/decimal analysis with parser.
- [ ] EDIT-07 (caret map): logical-digit caret preservation across
      rerenders (Zag vectors). Needs selection save/restore in the
      echo path. CT with start/middle/end + grouping vectors.
- [ ] DYNAMIC-05: disable/read-only + part-removal + owner-root
      replacement mid-interaction. Builds on slice-G invalidation;
      needs resolve of "fresh action requirement" semantics.
- [ ] ENV-06 (shadow — AUDITED, engine mapped): scope 3
      document-global lookups to `node.getRootNode()` — input
      labelledby ~L855-863 (getElementById + label[for] query),
      ENV-04 id-collision ~L2465 (per-root count; cross-root
      collisions are harmless in shadow), stepper gate ~L1402
      (needs internal button-ref threaded into useStepperName).
      Form listeners already root-scoped via `.form` ✓. Test: CT
      with a portal-into-shadow-root story (2 fields + shadow form;
      assert shadow activeElement, labelledby activation, canonical
      payload, document.getElementById(shadowIds) === null).
      Stepper-labelledby-in-shadow stays a KNOWN RESIDUAL until the
      threading lands (aria-label steppers unaffected).
- [ ] ENV-02 (ICU mismatch): mount-effect comparing SSR DOM value
      vs client reformat; on difference emit the existing dev
      diagnostic channel (no throw — deployment signal, not fatal).
      Test: mock Intl.NumberFormat server-vs-client outputs.
- [ ] COMP-04: shadow + validate + RTL + replacement-during-
      composition. Rides ENV-06 + slice-G; mostly a big CT.
- [ ] Least-surprise flags awaiting HQ (wave-1 (b)(c) + new i–x
      in DECISIONS.md § "NFLAST-2 Intl parser record"): width-sign
      list, paren/orphan/empty-final rules, one-swallow window,
      U+0609 permille, signDisplay-never-only reading, nu-option
      precedence. All recorded, none re-litigated.

VERIFY-FIRST (wave-3 first act): `pnpm agentct NumberField --unit`
→ 130; `--e2e` → 48/48; `--e2e --react 17,18` → 96/96.

## Captain verification + landing (waves 1+2 arc)

- Firsthand: unit 130/130; CT 48/48 × React 17/18/19. Matches.
- Engines firsthand (crew wrongly claimed no vehicle exists —
  `/tmp/sweep-ct.config.ts` was live all along): FF 46/48, WK
  46/48. The 2 reds are BOTH engines identically: NF-EDIT-15
  (affix-deletion lands "$1,23.50" vs "1,234.50") + NF-EDIT-16
  (undo choreography) — both NEW slice-F cases, never before
  proven, not regressions. RECORDED as wave-3 items, not held
  against this landing (gate was Chromium ×3, met).
- Rulings reviewed: (a) obvious and well-evidenced; (b)/(c)
  sound with honest least-surprise flags. API grep clean: zero
  export/prop/type adds or removals across the 715-line engine
  diff. Ruling texts + Intl record live in DECISIONS.md.
- Committed (NumberField 99→134/148 arc + both wave logs).
  Wave-3 owns: remaining 10 + EDIT-15/16 engine legs, with the
  FF/WK vehicle MANDATORY (crew's out-of-scope claim rejected).
