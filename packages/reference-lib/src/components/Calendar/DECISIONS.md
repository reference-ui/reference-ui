# Calendar decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

Date-grid engine: ISO-string day/range grids with locale week start.

## Landed (context, 2-4 lines)

Quarantine-landing ported the pure ISO kit (`iso.ts`/`week.ts`/`grid.ts`,
byte-identical) plus 17 colocated cases and an optional SSR-safe `today`
pane seed; all 7 frozen visual baselines stayed green unmodified and the
nested UX review approved. Log:
`.agents/missions/quarantine-landing/calendar.md`; landing commit
`f50f24ff7` ("feat(calendar): land quarantine ISO kit + 17-case suite,
freeze visuals").

## Candidate features (quarantine-sourced)

OPEN/DEFERRED candidates have moved out of this file. The full
mechanical/design split lives in [PATCHES.md](./PATCHES.md) (test-pinnable
today) and [FEATURES.md](./FEATURES.md) (needs a design call):

- 1. Discriminated mode props + required value (DEFERRED) → FEATURES.md #1
- 2. Fail-closed invalid-prop behavior (OPEN) → FEATURES.md #2
- 3. Required locale + firstDayOfWeek + CLDR wiring (DEFERRED) → FEATURES.md #3
- 4. Padded outside-day grid (DEFERRED) → FEATURES.md #4
- 5. Weekdays / Days / Day parts + render-state renderer (DEFERRED) → FEATURES.md #5
- 6. isDateUnavailable + min/max enforcement (DEFERRED) → FEATURES.md #6
- 7. 2D keyboard navigation + unavailable skip (DEFERRED) → FEATURES.md #7
- 8. Today marker (DEFERRED) → FEATURES.md #8
- 9. Range preview machine + Tab-commit (DEFERRED) → FEATURES.md #9
- 10. Month/year product modes + Months/Years parts + private view (DEFERRED) → FEATURES.md #10
- 11. Localized Heading + target-month nav names + announcements (DEFERRED) → FEATURES.md #11
- 12. Controlled-month machine (DEFERRED) → FEATURES.md #12
- 13. SSR / StrictMode / React-matrix suites (DEFERRED) → PATCHES.md #1
- 14. Single-mode selection semantics (DEFERRED) → FEATURES.md #13

DECLINED candidates stay below, verbatim.

### 15. Non-Gregorian calendar support — verdict: DECLINED

- **Source:** quarantine commit `b19c73bee` (`week.ts` forces
  `calendar="gregory"`); unit `CA-LOC-08` (explicit `ar-SA-u-ca-islamic`
  request produces a descriptive diagnostic and no mixed output).
- **API sketch:** would add calendar-system selection (islamic, buddhist,
  …) to props, arithmetic, labels, and grid generation.
- **Why not landed:** quarantined to reject it — the ISO kit, grid math,
  and every label path assume proleptic Gregorian; SPEC.md "Won't do:
  Non-Gregorian" and Calendar.md "Leave … extra calendars" agree.
- **Revisit when:** a shipping product requires a non-Gregorian calendar
  with named locales — not a speculative internationalization milestone.
- **Open questions:** none — killer reason: three independent sources
  (quarantine case, SPEC, design narrative) decline it; reopening means
  re-deriving the entire date engine.

### 16. Preset catalog / Preset part — verdict: DECLINED

- **Source:** quarantine commit `b19c73bee` (no preset API added); e2e
  `CA-CHROME-01`, `CA-CHROME-02` (recents/"last 7 days" as ordinary
  application buttons writing through the state setter).
- **API sketch:** would add `Calendar.Preset(s)` parts or an imperative
  preset channel plus baked-in labels ("Last 7 days", "This year").
- **Why not landed:** quarantined to reject it — presets are product
  copy plus the public ISO kit (`addCalendarDays` over `today`);
  Calendar.md "Leave … baked-in preset labels" and the variable-
  specificity rule (extra children are ordinary chrome) agree.
- **Revisit when:** never via Calendar — a preset product ships as
  application code in DateField or the app layer.
- **Open questions:** none — killer reason: presets need no Calendar
  API at all; `CA-CHROME-01` proves the setter path suffices.

### 17. Controlled view prop — verdict: DECLINED

- **Source:** quarantine commit `b19c73bee`, `Calendar.tsx:621` (private
  `data-view`, no prop); no case ID — quarantine deliberately withholds
  the API (nearest cases: `CA-VIEW-12`, `CA-VIEW-13` prove Calendar owns
  view across mode changes and authored parts).
- **API sketch:** would add `view` + `onViewChange` (`"day" | "month" |
  "year"`) alongside the private state.
- **Why not landed:** quarantined to withhold it — view is interaction
  state like range preview; SPEC.md "Won't do: Controlled `view` API"
  and Calendar.md ("The application never switches them with a
  `view ===` ternary") agree.
- **Revisit when:** a product demonstrates a view it must drive
  externally that Month/Year drill-down cannot reach — with the burden
  of proof on the requester.
- **Open questions:** none — killer reason: controlled view reintroduces
  the application ternary the whole view design exists to delete.

### 18. Month-range / year-range modes — verdict: DECLINED

- **Source:** quarantine commit `b19c73bee`, `Calendar.tsx:96-120` (one
  discriminant, four branches); unit `CA-MODE-04` ("one discriminant
  rather than a mode cross-product"); no case ID for the cross-product
  itself — quarantine never builds it.
- **API sketch:** would add `mode="month-range" | "year-range"` (or a
  second `selection × precision` axis) publishing month/year endpoint
  pairs.
- **Why not landed:** quarantined to reject it — Calendar.md "Leave the
  unused month-range/year-range cross-product … without a product
  requirement" and TESTS.md freeze decision 8 ("no speculative
  selection × precision cross-product") agree.
- **Revisit when:** a named product requirement (e.g. fiscal-quarter
  range picking) with committed UX — not symmetry-completeness.
- **Open questions:** none — killer reason: no consumer exists; the
  discriminant stays four-wide until one does.

## Suspected gaps (no quarantine source)

All three gaps have moved out of this file:

- 1. Keyboard-unreachable grid when the pane holds no selection (DEFERRED) → PATCHES.md #2
- 2. Whole-calendar `disabled` prop has no freeze case (OPEN) → FEATURES.md #14
- 3. CA-A11Y-01 checker sweep never executed (DEFERRED) → PATCHES.md #3

## Non-decisions (rejected outright)

- ~~Controlled-only `value` (dropping `defaultValue` + internal state) —
  mangling-class breaking change, rejected at triage~~ — SUPERSEDED by
  the FEATURES campaign triage (IMPLEMENT-NOW #1 under API-STANCE:
  breaking happens NOW pre-release) and LANDED by cluster A 2026-09-26.
  The struck rejection is quarantine-landing history, not standing policy.
- `PrevButton`/`NextButton` → `Previous`/`Next` rename (quarantine kept
  `PrevButton`/`NextButton` as aliases at `Calendar.tsx:909-910`, used
  the new names only in its Book rewrite) — rename-class churn,
  rejected; see crew log (`calendar.md:6`) and SPEC.md ("Part naming
  drift … kept").

## Walkthrough notes for HQ

- Deepest behavior gap: the range preview machine (FEATURES.md #9). In
  Book's DateRange story, click a start date then hover across the
  grid — today there is no preview band and Tab-away commits nothing;
  the second click just completes. This also blocks DateField.Range,
  so it is the highest-leverage feature to schedule.
- Largest a11y gap: keyboard navigation (FEATURES.md #7) plus the
  selection-less tab stop (PATCHES.md #2). In Book's SingleDate story,
  Tab into the grid and press arrows/Home/PageDown — nothing moves,
  and a pane with no selection offers no tab stop at all. Any
  keyboard-only date picking waits on the feature; the patch is its
  highest-value first test and can land ahead of it.
- Most visible paint call: locale week-start wiring (FEATURES.md #3).
  Book has no non-Sunday story today — headers are hardcoded
  `Su Mo …` — so to feel it, compare SingleDate against quarantine's
  `en-GB` Monday-first grid (`CA-LOC-01` in `week-grid.test.ts`
  proves the math; only the render wiring is missing). Approving this
  look unblocks FEATURES.md #4, #10, and #11.
- Open product question before any of that lands: fail-closed behavior
  (FEATURES.md #2). Quarantine renders blank output on invalid props
  — decide whether HQ accepts invisible failure or wants a degraded
  grid with the diagnostic, because FEATURES.md #1 and #6 both depend
  on the answer.
- Mechanical proof waiting on features: PATCHES.md #1 (matrix suites)
  and #3 (checker sweep) are fully specified and need no design —
  schedule them as the joint acceptance gate once their FEATURES.md
  dependencies land.
