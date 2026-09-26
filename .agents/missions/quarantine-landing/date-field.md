IN PROGRESS — DateField crew (quarantine-landing mission), 2026-09-25
Branch: reference-system (never switch; quarantine inspected via git show/diff/log only, tip 89850d1c8). Never commit.
Scope: ONLY packages/reference-lib/src/components/DateField/ + this log. Confirmed dir name: DateField.

## Brief
Port ONLY stability + test-case wins from quarantine DateField freeze (1150c8e6e) into DateField dir.
Quarantine look-and-feel/visual changes are SUSPECT — preserve current visuals AND current API
(controlled-only rewrites, API removals, uncontrolled-mode deletions forbidden).
Sibling handoffs: Field crew hands COMP-02 publish + COMP-04 commit/remove flows (DateField-owned per
TESTS.md); FI-CSS-06/COMP-04 ring needs theme-crew propagation change (do not port shared-theme edits —
suspect Exhibit 3). Calendar crew kept ISODate string alias for compat. Overlay (Objective B) verified
NO-OP — build on Overlay contracts as-is.

## Progress
- [x] Baseline pnpm agentct DateField (before changes): E2E 3/3, Unit 0 tests
- [x] Inspected quarantine diff (DateField.tsx rewrite, parse.ts, SPEC/TESTS, matrix unit/e2e)
- [x] Triage salvageable vs suspect (see below)
- [x] Port parse.ts pure kit + parse.test.ts unit contract (byte-identical; 23/23)
- [x] Add ChildlessFixture + FoldedPickerFixture + FormFixture (CompoundFixture byte-identical)
- [x] Add 12 DF-* CT re-targets (snap-free behavioral; 8 frozen baselines untouched)
- [x] Prove after: `pnpm agentct DateField` → Unit 23/23, E2E 15/15 green first run
- [x] SPEC.md honest accounting (12/64 [x], rest [ ] with reason)
- [x] tsc: zero DateField errors (remaining errors are sibling crews' files)
- [x] view-story visual check (capture fallback — MCP pipe broken, shared infra)
- [x] nested ux-designer sign-off → **LAND** (subagent 01a0da90, read-only)

## Nested UX verdict (LAND)
- Look: PASS, no delta. All 3 Book stories + open picker vs all 8 frozen
  baselines: identical chrome (header, chevrons, weekday row, grid,
  selected pill, trigger ring). Picker portals to document.body (verified),
  so canvas-clipped captures cut it — page-level shot confirms paint.
- Feel: all 12 scoped cases APPROVED, each traced to source lines
  (incl. CAL-01 without aria-controls, CAL-03 without focus retention,
  KEY-05/06 as honest no-op proofs, ENV-03 raw-text echo).
- A11y: 6 findings, ALL pre-existing, none introduced (source untouched):
  missing aria-controls; click-anywhere-opens blocks caret placement;
  tabIndex -1 trigger discoverability debt; label-less childless default;
  full-week row highlight on day hover (Calendar chrome); garbage-echo.
- Reviewer confirmed: CT diff pure addition (zero `-` lines), parse unwired
  (byte-identity claim unverified by reviewer — crew-verified via diff instead),
  23 unit tests claim zero DF-* IDs. Full text: /tmp/datefield-ux-verdict.txt.

## Handoffs / follow-ups
- Theme crew: FI-CSS-06/COMP-04 ring propagation (from Field crew) — untouched,
  still open. No shared-theme edits made (suspect Exhibit 3 avoided).
- Future controlled-locale rework (NOT this mission): dirty sessions, locale
  display, stepping, Range/Start/End, isDateUnavailable, DOM-03 Part-Resolution
  Law, FMT-06 required-locale question. `parse.ts` staged as its foundation.
- Overlay crew: DF-COMP-04/ENV-01 ShadowRoot composition needs the
  shadow-portal contract first; aria-controls + trigger focus-retention gaps
  named in SPEC scoping + UX a11y findings.
- Quarantine digit-table quirks (beng U+096C, fullwide Devanagari 2–9) preserved
  verbatim — future cleanup may normalize.
- No new snapshot baselines → no human baseline-confirm needed.

## Commit-ready arc (for the landing captain; this crew never commits)
- Files: `parse.ts` (new, byte-identical to quarantine), `parse.test.ts`
  (new, 23 tests), `DateField.story.tsx` (+3 fixtures), `__e2e__/
  DateField.ct.spec.ts` (+12 DF-* titles), `SPEC.md` (12/64 accounting),
  this log. `DateField.tsx`/book/index/snapshots untouched.
- Proof: `pnpm agentct DateField` → Unit 23/23, E2E 15/15 (react19), 8 frozen
  baselines green unmodified; tsc zero DateField errors; UX LAND.
- Needs: nothing — no new baselines, no API/visual/behavior change.

## view-story notes (2026-09-25)
- Playwright MCP pipe broken (`Broken pipe`, same as Calendar crew) → `pnpm
  capture` fallback per skill §3.
- Atomic: ISO input + "Chosen date" correct. FoldedPicker resting: bezel +
  trigger correct. WithPicker open: August 2026 grid, weekday headers,
  selected-31 pill — all correct, zero drift (expected: source untouched).
- Capture clips to canvas so portaled picker needed element-targeted capture;
  viewport clipping is a capture artifact, not a component finding. CT
  snapshots (8 frozen, green) already prove open/hover/selected states.

## What was ported (DateField dir only)
- `parse.ts` (new, +270): byte-identical to quarantine 1150c8e6e (`diff` =
  IDENTICAL) — incl. two upstream digit-table quirks reproduced exactly
  (beng[6] is Devanagari U+096C, fullwide[2:] are Devanagari U+0968–096F;
  flagged, not "fixed", to keep the port verbatim). Imports 7 names from
  landed `../Calendar/iso`. Staged foundation, NOT wired, NOT exported from
  index (API frozen). Port method note: file created via editor, then 3 lines
  byte-patched via ASCII-only python (unicode round-trip risk) — verified by diff.
- `parse.test.ts` (new, 23 tests): kit contract re-targeted from matrix unit
  (FMT/EDT/KEY/BND pure logic). No DF-* IDs claimed per TESTS.md [unit] law.
- `DateField.story.tsx`: +3 fixtures (existing CompoundFixture untouched).
- `__e2e__/DateField.ct.spec.ts`: +12 DF-* tests in a new describe block
  (existing 3 tests untouched). All snap-free; 8 frozen baselines compared
  strictly and green.
- `SPEC.md`: reconciliation accounting (12/64 [x]).
- `DateField.tsx`, `DateField.book.tsx`, `index.ts`: UNTOUCHED.

## Surprises
- Full suite green on the FIRST run (15/15 + 23/23) — no flakes, no daemon
  contention this window despite concurrent crews.
- Quarantine's own e2e never asserts `aria-controls`, so DF-CAL-01 ports with
  zero source change (TESTS.md prose mentions it — flagged as gap, not added:
  inventing attrs no corpus test demands is scope creep).
- Second trigger click toggles the picker closed (Overlay.Trigger toggle) —
  DF-CAL-03 asserts the toggle; quarantine's "input keeps focus" step left
  unasserted (Overlay focus domain).
- Quarantine digit tables contain mixed-script quirks (see above); verbatim
  port preserves them. A future cleanup can normalize — not this mission.

## Triage (quarantine 1150c8e6e vs current)
- PORT: `parse.ts` (+270, pure extraction, imports 7 names from `../Calendar/iso` —
  all verified present on reference-system incl. `compareISODate` and the
  `addCalendarMonths(ISODate)` overload). Recon §6 names pure extractions the
  cleanest salvage. Ports VERBATIM; staged foundation, NOT wired (wiring =
  locale display = visual change = SUSPECT/forbidden). No index export (API frozen).
- PORT (re-targeted CT, snap-free, adapted to current ISO display): DF-DOM-01
  (childless), DF-DOM-02 (folded picker shape), DF-DOM-04 (hidden input),
  DF-DOM-05 (controlled follow), DF-KEY-05/06 (step no-ops), DF-CAL-01 (APG
  attrs + deliberate activation — quarantine e2e does NOT assert aria-controls,
  so none needed), DF-CAL-03 (trigger tabIndex/type/toggle; input-focus TBD
  empirically), DF-FRM-01/02 (submit payload), DF-COMP-02 (Field handoff:
  htmlFor label + canonical submit), DF-ENV-03 (typeof string|null echo).
- SKIP (needs forbidden controlled-locale rewrite / API change): all FMT/EDT/CMT
  dirty-session cases, BND-01/03/04 gating, KEY-01/02/03/04/07 stepping,
  CAL-02/CAL-04, RANGE-*, FRM-03/05, ENV-02, COMP-01/03/05/06, DOM-03
  (Part-Resolution Law — current uses sniffing), FMT-06 required-locale throw
  (API removal — FORBIDDEN), Range/Start/End + isDateUnavailable API additions,
  quarantine book.tsx (locale + Range stories).
- DateField.tsx: 100% UNTOUCHED. Zero visual/API/behavior change by construction.
- DF-COMP-04 (ShadowRoot picker): flagged follow-up — needs Overlay-crew
  shadow-portal contract; not authored blind. FI-COMP-02 typing/publish
  (Field handoff dirty sessions): unportable without rewrite — flagged.

COMPLETE
