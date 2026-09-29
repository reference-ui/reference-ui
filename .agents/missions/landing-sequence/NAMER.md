# NAMER — zero-race-style-warnings crew log

Box: 60 min hard. Cadence: entry every ≤15 min. Scope: reference-rs only
(+ probe bucket label only if the diff proves it). Never commit.

## T+0/60 — on deck, skill + forensics read

- Read agent-rs skill (canonical `pnpm agentrs`, CPU gate, quality gate).
- Read SMOKEREDS.md fully. Established facts adopted: warned value
  `repeat(3,1fr)` rule lives INSIDE `@layer reference-ui > utilities`
  post-hoc; template imports styles.css statically first; lib has zero
  runtime injection. Deterministic 10/10 → collection/spelling, not timing.
- Served sheet confirmed: `dist/runtime/reference-ui/react/styles.css`
  nests `@layer utilities` (line 1153) inside `@layer reference-ui`
  (line 4). Warned rule at line 2463:
  `.reference-ui__grid-cols_repeat\(3\,_1fr\)`.

## T+18 — baseline reproduced + comma-split bug PROVEN in node

- Baseline full smoke (`/tmp/namer-smoke-base.txt`): EXIT=1,
  `PASS zero-true-gap-style-warnings`, `FAIL zero-race-style-warnings`,
  json `missRaceNoise=10, missTrueGaps=0`. All other checks pass.
  Scaffold kept at `/var/folders/.../reference-ui-smoke-1sav36`.
- All 10 warned values (9 carry commas; #9 does not):
  1. `gridTemplateColumns: "repeat(3, 1fr)"`
  2. `boxShadow: "0 4px 16px rgba(0,0,0,0.12)"`
  3. `& [data-slot="check"], & [data-slot="check"] * > color: "inherit"`
  4. `& [data-slot="check"], & [data-slot="check"] * > fill: "currentColor"`
  5. `boxShadow: "0 1px 3px rgba(0,0,0,0.2)"`
  6. `transition: "box-shadow 200ms ease, transform 200ms ease"`
  7. `transition: "opacity 150ms ease, border-color 150ms ease"`
  8. `_hover > bg: "color-mix(in oklch, currentColor 14%, transparent)"`
  9. `& > :last-child > borderBottomWidth: "0"` (NO comma — needs own cause)
  10. `gridTemplateColumns: "minmax(0, 1fr)"`
- Node repro of `collectClasses` on the exact warned selector:
  input `.reference-ui__grid-cols_repeat\(3\,_1fr\)` →
  collected `"reference-ui__grid-cols_repeat(3\\"` (fragment).
  `selectorText.split(',')` splits INSIDE the escaped `\,`, so the
  collected token can never equal constructed
  `reference-ui__grid-cols_repeat(3,_1fr)`. Deterministic miss for every
  comma-bearing class. Root cause #1 CONFIRMED (pending live-sheet diff).
- Open: (a) H-layer — does nested `@layer utilities` report
  `rule.name === "utilities"` or dotted (`reference-ui.utilities`) in
  Chromium? If dotted, `isUtilitiesLayer` never fires and the collected
  set is EMPTY (all 10 explained without per-class causes). Decisive
  because #9 has no comma. (b) #9's own cause if H-layer is false.
- Next (≤15 min): restart vite on the KEPT scaffold (port 5201), run a
  file-based playwright diff script (layer rule names + exact-logic
  scanSheets re-implementation + DOM-vs-collected diff), then fix.

## T+33 — live diff DECISIVE: 9 collection bug, 1 true gap (with proof)

- Diff script (temp `namer-diff.tmp.mjs`, vite on kept scaffold :5201):
  nested `@layer utilities` reports `name: "utilities"` in Chromium →
  **H-layer FALSE**; `utilitiesSize: 2417` collected, `domSize: 234`.
  Collected set polluted with fragments (`reference-ui__bg_rgba(0\`…).
- Quoted diff: all 10 warned constructed classes ARE on DOM elements and
  missing from the collected set, e.g.
  `reference-ui__grid-cols_repeat(3,_1fr)` while the sheet holds
  `.reference-ui__grid-cols_repeat\(3\,_1fr\)`; #9 is
  `reference-ui__[&_>_:last-child]:bd-b-w_0`.
- Sheet grep: rules for 9/10 EXIST (data-slot, color-mix hover, shadows,
  transitions, repeats — all comma-bearing). #9's rule is ABSENT: only 2
  `last-child` lines in the whole sheet, both `.ref-*` (global layer).
  #9's call site: `ReferenceMemberList.tsx:12-23` — `css` prop object via
  spread-const + `as` cast passed as `css={identifier}` through a wrapper
  component; the extractor never emitted it. Sibling file
  `ReferenceMemberRow.tsx:13` uses an INLINE `css={{...}}` and WAS
  extracted. So #9 = extraction coverage gap (identifier/spread css),
  PLUS probe misbucketing (value `"0"` len<4 can never be a "true gap"
  by the probe's rule, so a genuine true gap wears the "race" label).
- FIX (logged pre-edit per HQ): `packages/reference-rs/.../namer/miss.ts`
  `collectClasses` — deleted the naive `selectorText.split(',')`; matchAll
  now runs over the whole selector (CLASS_TOKEN already stops at raw
  commas; `\\.` keeps escaped `\,` intact). No API change. New
  `miss.test.ts` regression test (stub CSSOM, zero DOM deps).
- `pnpm agentrs q` on both files: `ALL 2 FILES PASSED QUALITY CHECKS!`
- Test discriminates: pre-fix FAIL (`1 failed`), post-fix PASS (`1 passed`).
- Next: full `pnpm agentrs v atomic` suite; rebuild lib; full smoke
  (expect 9/10 silenced, #9 remaining); then scope-or-hold #9.

## T+50 — WRAP (hard stop): 9/10 fixed+proven, #9 HELD with root cause

- `pnpm agentrs v atomic`: EXIT=0, `Test Files 14 passed (14)`,
  `Tests 309 passed (309)`. No Rust touched → no `c` run (nothing to prove).
- Rebuilt `packages/reference-rs` (`build:js` EXIT=0; `split(",")` count
  in `dist/namer.mjs`: 1→0) and lib (`build` EXIT=0; dist shows
  `for (let i of e.matchAll(zo)) t.add(...)` — split gone).
- Post-fix FULL smoke (`/tmp/namer-smoke-fixed.txt`): EXIT=1,
  `PASS zero-unexpected-console-errors`, `PASS zero-b03-noise`,
  `PASS zero-true-gap-style-warnings`,
  `FAIL zero-race-style-warnings — 1 dev-race warnings`, json
  `warnings=1, missRaceNoise=1, missTrueGaps=0`.
  Sole survivor: `` `& > :last-child > borderBottomWidth: "0"` `` — #9,
  exactly as the diff predicted. 10→1, deterministic.
- #9 HELD (not fixable in-box, not tolerable): its rule is genuinely
  ABSENT from the sheet (only 2 `last-child` lines, both `.ref-*`), so
  the warning is CORRECT ("paints nothing" is true — last member row
  keeps its 1px bottom border) and silencing it would be forbidden
  tolerance. Root cause is UPSTREAM of the namer: the atomic/styletrace
  extractor never emitted the rule for the `css={identifier}` form
  (`ReferenceMemberList.tsx:12-23`: spread-const + `as` cast threaded
  through a wrapper prop), while the inline `css={{...}}` sibling
  (`ReferenceMemberRow.tsx:13`) was extracted. Fixing extraction
  dataflow (identifier/spread/prop-threading) exceeds the 15-min step
  cap → hold-and-report per HQ, no grind. Probe label for #9 is also
  wrong (true gap wearing "race" because value `"0"` len<4), but
  relabeling alone only moves the red to zero-true-gap — correctly
  mooted ONLY by emitting the rule. Probe untouched (minimal).
- Residue removed: temp diff script, both tarballs/scaffolds from my two
  smoke runs, my :5201 vite session killed. Tree: `M NAMER.md`,
  `M miss.ts`, `?? miss.test.ts` only. NOT committed (crew never commits).

### Resume checklist
- [ ] #9 extraction: teach styletrace/atomic to emit
  `reference-ui__[&_>_:last-child]:bd-b-w_0` for
  `ReferenceMemberList.tsx:12-23` (`css={identifier}`, spread const,
  `as` cast, wrapper prop). Repro: post-fix smoke shows exactly this 1
  warning; sheet grep for `last-child` shows zero utility rules.
- [ ] Then: rebuild rs → rebuild lib → full smoke must show
  `missRaceNoise=0`, `zero-true-gap` still PASS, exit 0.
- [ ] Optional: probe bucket — short-value (`len<4`) misses whose class
  is absent from the sheet are true gaps, not race (evidence: #9).
  Only touch with the extraction fix in hand.
- [ ] Evidence logs: `/tmp/namer-smoke-base.txt` (10/10 baseline),
  `/tmp/namer-diff.json` (live diff), `/tmp/namer-smoke-fixed.txt`
  (1/10 post-fix), `/tmp/namer-vtest-*.txt`, `/tmp/namer-vatomic.txt`.

## Captain verification + landing (9/10 collection fix)

- Firsthand: `v atomic` 309/309 (after captain re-pin below);
  `q` 0 violations; smoke 10→1 with the SOLE survivor proven
  to be #9 (`& > :last-child > borderBottomWidth: "0"`).
- Byte pin: the fix shrank shipped react.mjs (-26/-5, all CSS
  pins green) → captain re-pinned 158317/39664 → 158291/39659
  with a note (same class as the REDS re-pin, caveat-covered).
- Diff reviewed: 4-line collection fix + stubbed regression
  test. Minimal, correct, commented.
- Committed (fix + test + pin + this log). #9 dispatched to
  EXTRACT (styletrace/atomic dataflow, agent-rs lane).
