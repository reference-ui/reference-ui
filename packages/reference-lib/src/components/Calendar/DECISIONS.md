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

### 1. Discriminated mode props + required value — verdict: DEFERRED

- **Source:** quarantine commit `b19c73bee`, `Calendar.tsx:84-121`
  (`CalendarSharedProps` + `CalendarProps` union); unit `CA-MODE-04`; e2e
  `CA-STATE-10`, `CA-MODE-01`, `CA-DYNAMIC-01` (no case ID for the
  `onChange: any` kill itself — it follows from the union).
- **API sketch:** `value` becomes required and mode-typed (`ISODate | null`
  for omitted/`"day"`, `CalendarDateRange | null` for `"range"`,
  `ISOMonth | null` for `"month"`, `ISOYear | null` for `"year"`);
  `onChange` is typed per branch instead of `(value: any) => void`;
  explicit `null` is the controlled empty state.
- **Why not landed:** API redesign, not stability — it breaks every current
  consumer (`defaultValue`, optional `value`, untyped `onChange`) and
  SPEC.md work-order item 1 defers it explicitly.
- **Revisit when:** HQ schedules the Calendar v2 prop contract (ideally
  together with item 2, since the union defines what "invalid shape" means).
- **Open questions:** none on shape (TESTS.md freeze decisions 6-8 fix it);
  only timing and whether a codemod covers internal consumers.

### 2. Fail-closed invalid-prop behavior — verdict: OPEN

- **Source:** quarantine commit `b19c73bee`, `Calendar.tsx:316-318`
  (`console.error` + `return null`, i.e. `renderToString` is `''`); unit
  `CA-ISO-06`, `CA-ISO-07`.
- **API sketch:** any invalid date-like prop (`value`, range start/end,
  `month`, `today`, `min`, `max`), contradictory `min > max`, or
  mode/value shape mismatch produces one descriptive development
  diagnostic naming prop and bad string, renders no grid, and invokes no
  callback (`onChange`, `onMonthChange`, `isDateUnavailable` all silent).
- **Why not landed:** feature-needs-design — quarantine picked the most
  severe option (invisible render) without product sign-off, and landing it
  would turn today's lenient fallbacks (garbage `month` renders 2026-01)
  into blank output.
- **Revisit when:** HQ answers the product question below; then it lands
  with item 1, which defines the invalid-shape set.
- **Open questions:** is a silent empty render acceptable product behavior,
  or should invalid props render a degraded grid (e.g. fall back to the
  `today` pane) alongside the diagnostic? What does a screen-reader user
  get in the failure case — nothing at all?

### 3. Required locale + firstDayOfWeek + CLDR wiring — verdict: DEFERRED

- **Source:** quarantine commit `b19c73bee`, `Calendar.tsx:336-338`
  (`getWeekStart(locale, firstDayOfWeekProp)` wired to render) and
  `week.ts` (ported but unwired); e2e `CA-LOC-04`, `CA-LOC-05`,
  `CA-LOC-06`, `CA-LOC-07`.
- **API sketch:** `locale` becomes required (no `'en-US'` default);
  `firstDayOfWeek?: CalendarWeekday` overrides CLDR; weekday headers,
  grid padding, Home/End boundaries, and heading/nav labels all derive
  from the resolved locale in one commit.
- **Why not landed:** moves paint for every non-Sunday locale (headers
  reorder, padding flips sides) — frozen-visuals law forbids it without
  UX paint review; SPEC.md records `week.ts` as ported-but-unwired.
- **Revisit when:** UX approves side-by-side `en-US` vs `en-GB` vs `ar-AE`
  captures (Book needs a locale-switcher story first).
- **Open questions:** should `firstDayOfWeek` accept only the 7 weekday
  tokens, or also a number? TESTS.md says tokens; confirm no numeric
  back-compat is needed.

### 4. Padded outside-day grid — verdict: DEFERRED

- **Source:** quarantine commit `b19c73bee`, `grid.ts` `buildMonthGrid`
  wired to render (ported but unwired); e2e `CA-GRID-05`, `CA-MONTH-07`,
  `CA-SINGLE-07`, `CA-RANGE-08`.
- **API sketch:** leading/trailing cells become enabled day buttons for
  the adjacent months' dates (marked `data-outside-month`); activating
  one requests its month first, then the date; focus survives the month
  acceptance.
- **Why not landed:** suspect paint — current grid renders empty `<td>`
  slots, so wiring the padded grid changes every month's silhouette and
  all 7 frozen baselines.
- **Revisit when:** HQ approves the padded-grid look against the frozen
  baselines (same review gate as item 3; both change the grid).
- **Open questions:** none on behavior (TESTS.md freeze decision 3 fixes
  it); purely a visual-approval gate.

### 5. Weekdays / Days / Day parts + render-state renderer — verdict: DEFERRED

- **Source:** quarantine commit `b19c73bee`, `Calendar.tsx:1039-1077`
  (`CalendarWeekdays`/`CalendarDays`), `:1310` (`CalendarDay`),
  `:164-183` (props incl. `weekdayStyle?: "narrow" | "short" | "long"`
  and `children?: (day: CalendarDayRenderState) => React.ReactElement`);
  e2e `CA-DAY-01`..`CA-DAY-12`, `CA-GRID-04`, `CA-GRID-06`, `CA-GRID-07`,
  `CA-GRID-08`, `CA-GRID-11`.
- **API sketch:** `Calendar.Weekdays` (`thead`), `Calendar.Days`
  (`tbody`, default day numbers or a per-day render function receiving
  exactly `date`, `formattedDay`, `outsideMonth`, `today`, `selected`,
  `disabled`, `rangeStart`, `rangeEnd`, `inRange`, `preview`),
  `Calendar.Day` (`date`-matched button; Calendar stays authoritative for
  accessible name, ARIA/data, tabIndex, activation); renderer contract
  violations (wrong date, no Day, two Days, non-Day element) produce
  descriptive diagnostics; day buttons lose the current duplicate
  `role="gridcell"` and raw-ISO `aria-label` in favor of full
  locale-derived names.
- **Why not landed:** rewrite-class API addition (new parts, renderer
  protocol, four diagnostic paths) — stability-only landing law excludes
  it; skip recorded for `CA-DAY-13/14`, the SSR/StrictMode companions.
- **Revisit when:** a consumer needs custom day content (event dots,
  booking counts — see `CA-COMP-04`) or the duplicate-`gridcell`
  finding gets an a11y owner.
- **Open questions:** is the 10-field render state closed (consumers must
  not infer more), or should future state ride the same object? TESTS.md
  `CA-DAY-02` says exact; confirm HQ wants the exactness enforced by a
  diagnostic vs. a type alone.

### 6. isDateUnavailable + min/max enforcement — verdict: DEFERRED

- **Source:** quarantine commit `b19c73bee`, `Calendar.tsx:93`
  (`isDateUnavailable?: (date: ISODate) => boolean`), `:407-410`
  (bounds + predicate combined); e2e `CA-STATE-04`, `CA-STATE-05`,
  `CA-STATE-06`, `CA-STATE-07`, `CA-STATE-12`, `CA-MODE-05`,
  `CA-COMP-01`.
- **API sketch:** one predicate plus ISO `min`/`max` combine into a
  single non-interactive day state (native `disabled`,
  `aria-disabled`, `data-disabled`); a controlled-selected date that
  later becomes disabled stays painted but non-interactive; an
  all-disabled grid exposes no artificial tab stop; predicate is called
  only with valid canonical dates for the evaluated grid.
- **Why not landed:** dead-props-today — `min`/`max` are accepted and
  never read (`Calendar.tsx:39-40`), and SPEC.md says a bounded range
  belongs to this predicate, not to clamp/coercion; enforcement changes
  both behavior and paint, so it needs design, not a port.
- **Revisit when:** any consumer needs disabled dates (weekends,
  holidays, booking blackouts) — DateField range work will force it.
- **Open questions:** should the dead `min`/`max` props warn in
  development until enforcement lands, or stay silent? What is the
  announced text for a disabled day (predicate reason is opaque)?

### 7. 2D keyboard navigation + unavailable skip — verdict: DEFERRED

- **Source:** quarantine commit `b19c73bee`, `Calendar.tsx` roving-focus
  model (`:392-394` state) and grid key handling; e2e `CA-KEY-01`..`CA-KEY-10`,
  `CA-DAY-07` (cancelable consumer `onKeyDown`), `CA-LOC-06` (RTL arrow
  reversal).
- **API sketch:** arrows move ±1/±7 days (Left/Right swap in RTL),
  Home/End to locale week boundaries, PageUp/Down request adjacent
  months preserving the focused day; movement skips blocked dates,
  stops at inclusive bounds without wrapping, defers cross-month focus
  until the controlled month is accepted, and changes only focus (plus
  month requests) — never selection; a custom Day `onKeyDown` calling
  `preventDefault()` cancels movement/activation.
- **Why not landed:** pure feature — current grid has mouse-only
  `tabIndex={selected ? 0 : -1}` buttons with no key handling at all;
  nothing to stabilize, only to build.
- **Revisit when:** HQ staffs the a11y pass (pairs with suspected gap 1:
  today the grid can be keyboard-unreachable with no selection).
- **Open questions:** PageUp/Down with `Shift` (year jump)? TESTS.md
  `CA-KEY-04` leaves modified gestures unhandled; confirm that stays.

### 8. Today marker (data-today + deferred client-local marker) — verdict: DEFERRED

- **Source:** quarantine commit `b19c73bee` today-marker paint +
  after-mount commit; e2e `CA-STATE-01`, `CA-STATE-08`, unit
  `CA-STATE-11`, `CA-ENV-01` (`today` prop landed as pane seed only).
- **API sketch:** exactly the cell matching the ISO `today` gets
  `data-today` (and current-date semantics), independent of selection,
  focus, and outside-month status; when `today` is omitted, SSR and
  first hydration render no marker and the client-local date is marked
  after mount so server output stays deterministic.
- **Why not landed:** new paint on every pane (a marker that exists
  nowhere in the frozen baselines) — landing law classifies it as look,
  not stability; skip recorded in the crew log.
- **Revisit when:** UX approves the marker treatment (ring? bold? dot?)
  against the frozen SingleDate/DateRange stories.
- **Open questions:** the visual treatment itself — and whether the
  marker needs a non-color cue (it must not rely on color alone).

### 9. Range preview machine + Tab-commit — verdict: DEFERRED

- **Source:** quarantine commit `b19c73bee`, `Calendar.tsx:213`
  (`previewEnd` state), `:394-397`, `:1178-1218` (preview render
  state), `:1384` (Tab-commit on grid leave); e2e `CA-RANGE-01`..`CA-RANGE-16`,
  `CA-DAY-03`, `CA-DAY-04`.
- **API sketch:** first activation requests `{ start: date, end: null }`;
  while pending, hover/focus previews the interval in render state
  (`preview`/`inRange`, endpoints) with no callback; second activation
  requests the normalized inclusive range; crossing an unavailable date
  is rejected with the pending start retained; Tab leaving the grid
  requests the current valid preview; nav and view changes never
  complete a preview; month/year cells paint range membership without
  preview.
- **Why not landed:** feature, and the deepest one — current range mode
  completes synchronously on second click with no preview state at all;
  SPEC.md work-order item 5 sequences it after keyboard/unavailable.
- **Revisit when:** DateField.Range work starts — SPEC.md names this
  machine as the DateField dependency (`CA-COMP-02`, `CA-COMP-05`).
- **Open questions:** Tab-commit is unusual — confirm HQ wants focus
  traversal to emit a value change (vs. abandoning the preview).

### 10. Month/year product modes + Months/Years parts + private view — verdict: DEFERRED

- **Source:** quarantine commit `b19c73bee`, `Calendar.tsx:621`
  (`data-view`), `:915-959` (`CalendarMonth`/`CalendarYear` drill-down
  buttons, `aria-pressed`), `:1553-1875` (`CalendarMonths`/
  `CalendarMonthCell`/`CalendarYears`/`CalendarYearCell`); e2e
  `CA-VIEW-01`..`CA-VIEW-13`, `CA-MODE-02`, `CA-MODE-03`,
  `CA-COMP-06`.
- **API sketch:** `mode="month"` publishes `YYYY-MM`, `mode="year"`
  publishes `YYYY`; Months renders twelve locale-labelled cells for the
  controlled year (whole month disabled when every day is out of
  bounds); Years lists a clamped 21-year window (or min-through-max
  years) scrolling current into view; header Month/Year buttons toggle
  Calendar-private view (`data-view`, never a controlled prop, never an
  application `view ===` ternary); in day/range modes month/year cells
  are navigation returning to day view; Previous/Next are
  native-disabled outside day view.
- **Why not landed:** rewrite-class product surface — current "month
  view" is a crude 3-column `Jan..Dec` grid behind the Heading button
  with no year view, no product modes, and no view ownership; SPEC.md
  work-order item 6 defers it unless DateField is blocked.
- **Revisit when:** a month-picker or year-picker product requirement
  arrives (billing month is the named example).
- **Open questions:** the 21-year window size and scroll-into-view
  behavior — TESTS.md fixes them, but HQ should confirm against real
  product copy (e.g. birth-year pickers want faster travel).

### 11. Localized Heading + target-month nav names + announcements — verdict: DEFERRED

- **Source:** quarantine commit `b19c73bee`, `Calendar.tsx:719-754`
  (Heading `div`, `aria-live="polite"`, stable ID), `:779-844`
  (Previous/Next named by target month); e2e `CA-LOC-05`, `CA-GRID-09`,
  `CA-GRID-12`, `CA-VIEW-11`.
- **API sketch:** Heading is a locale-formatted `div` (not today's
  toggle button) and the polite atomic announcement source — exactly
  one text mutation per accepted month/view change, no global announcer
  needed; Previous/Next accessible names are the locale-formatted
  adjacent months ("February 2024", not "Next") while callbacks stay
  ISO; Grid takes Heading as its stable `aria-labelledby` name unless
  the application passes an explicit `aria-label`.
- **Why not landed:** coupled to items 3 (locale labels) and 10
  (Heading stops being the view toggle); landing names alone would
  strand the Heading button semantics half-migrated.
- **Revisit when:** items 3 and 10 land — this is their announcement
  half; or earlier if a screen-reader pass demands named grids first.
- **Open questions:** none on contract (TESTS.md fixes it); confirm the
  "exactly one mutation, no mount echo" strictness survives React 19
  effects (StrictMode replay is the risk — see item 13).

### 12. Controlled-month machine — verdict: DEFERRED

- **Source:** quarantine commit `b19c73bee` controlled-pane logic; e2e
  `CA-MONTH-01`..`CA-MONTH-10`.
- **API sketch:** controlled `month` stays independent of `value`
  (selecting a far date never moves the pane); nav requests exactly the
  adjacent ISO month with no optimistic render while pending/rejected;
  programmatic month updates apply without echoing a request; a nav
  direction disables exactly when its target month holds no enabled
  in-domain date; omitted `month` is Calendar-owned pane state, seeded
  from value/`today`, re-seeded on remount (typical Popover close) but
  never while kept mounted; pointer focus stays on the nav button while
  the day tab target recomputes.
- **Why not landed:** behavior contract larger than the current
  implementation (today: lenient parse, immediate commit, no direction
  disabling, remount semantics untested) — a redesign verified by 10
  browser cases, not a stability port.
- **Revisit when:** DateField folding needs it (DateInput opening on the
  selected month, DateRange start/end focus sync — `CA-COMP-05`).
- **Open questions:** remount re-seed vs. kept-mounted memory is the
  subtle one — confirm products that keep Calendar mounted across
  Popover opens get an explicit remount/reset story.

### 13. SSR / StrictMode / React-matrix suites — verdict: DEFERRED

- **Source:** quarantine commit `b19c73bee`; unit `CA-DAY-13`, `CA-DAY-14`,
  `CA-ENV-01` (CA-ENV-02 landed adapted as `Calendar.contract.test.tsx`);
  e2e `CA-ENV-03` (ShadowRoot), `CA-ENV-04` (Chromium/Firefox/WebKit).
- **API sketch:** no new API — proof obligations: deterministic custom-Days
  hydration (byte-equivalent children, managed ARIA, ref identity, no
  warnings), one button identity + one event default under StrictMode on
  React 17/18/19, identical public behavior inside an open ShadowRoot and
  across three browser engines.
- **Why not landed:** matrix-only — they verify items 5/8/11 across
  runtimes that don't exist in the colocated loop; `CA-DAY-13/14` and
  `CA-ENV-01` were explicitly skipped at triage and need API rework
  first (custom Days must exist before its hydration can be proven).
- **Revisit when:** items 5 and 8 land — then re-target these cases
  against the real API instead of quarantine's rewrite.
- **Open questions:** does HQ still require React 17 in the matrix, or
  can the `[react:all]` axis shrink to 18/19?

### 14. Single-mode selection semantics — verdict: DEFERRED

- **Source:** quarantine commit `b19c73bee` selection logic; e2e
  `CA-SINGLE-01`..`CA-SINGLE-07`.
- **API sketch:** activating an enabled day requests its ISO date exactly
  once (click, Enter, Space all converge); re-activating the selected
  date emits nothing and clears nothing; blocked dates are locked out in
  every modality; parent rejection leaves controlled selection unchanged;
  programmatic value changes apply with no callback and no focus move;
  outside-day activation requests the month first.
- **Why not landed:** today's `selectDate` always emits (re-click
  re-fires `onChange`), has no blocked-date concept (item 6), and no
  outside-day path (item 4) — the semantics depend on items 4 and 6.
- **Revisit when:** items 4 and 6 land; the remaining rules (no re-emit,
  silent programmatic apply) can land with them at near-zero risk.
- **Open questions:** should re-activating the selected date in single
  mode clear to `null` (toggle) instead of no-op? TESTS.md says no-op;
  confirm HQ agrees — this is the one product call in the item.

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

### 1. Keyboard-unreachable grid when the pane holds no selection — verdict: DEFERRED

- **Evidence:** nested ux-designer review, filed in the crew log
  (`.agents/missions/quarantine-landing/calendar.md:16`) — most severe
  of 6 pre-existing a11y findings, all separated from the APPROVE
  verdict; current `Calendar.tsx:395` gives `tabIndex=0` only to a
  selected day, so a pane with no selection has no tab stop at all.
- **API sketch:** deterministic initial tab target per TESTS.md
  `CA-STATE-03` (selected date, else today, else first enabled in-month
  day) — likely lands as the first slice of item 7 above rather than its
  own API.
- **Why not landed:** finding postdates the landing; the landing froze
  focus behavior byte-identical by law.
- **Revisit when:** HQ staffs the keyboard/a11y pass (same trigger as
  item 7) — this is its highest-value first test.
- **Open questions:** none on the fix direction; confirm the
  selected → today → first-enabled preference order suits DateField's
  "opens on the selected day" contract.

### 2. Whole-calendar `disabled` prop has no freeze case — verdict: OPEN

- **Evidence:** `Calendar.tsx:41` accepts `disabled?: boolean`,
  threads it through context (`:54`, `:619`) to nav buttons and day
  buttons — but Calendar.md's Proposed API has no `disabled`, and no
  `CA-*` case in TESTS.md or quarantine covers whole-calendar disable
  (quarantine's disable story is per-day via item 6).
- **API sketch:** either freeze it (disabled root: `data-disabled`,
  inert grid, nav disabled, no callbacks — needs new `CA-STATE-*`
  cases) or remove the prop and let products disable via
  `isDateUnavailable` + `aria-disabled` on the host.
- **Why not landed:** quarantine never addressed it, so the landing had
  no win to port and no mangling to reject; the prop passed through
  untouched.
- **Revisit when:** item 6 (per-day disable) lands — that forces the
  decision, since two disable mechanisms must not disagree.
- **Open questions:** do products need whole-calendar disable distinct
  from "every day unavailable"? If yes, what does it announce?

### 3. CA-A11Y-01 checker sweep never executed — verdict: DEFERRED

- **Evidence:** TESTS.md:1205 specifies the automated-checker sweep
  across `en-GB`, RTL, padded days, constraints, and pending/complete
  ranges — but it has no quarantine case ID (absent from the 110-case
  e2e file) and no colocated/CT proof; SPEC.md:90 lists it unported.
- **API sketch:** no new API — run the configured accessibility checker
  after settling each named state; assert zero violations plus one
  named grid, valid table ancestry, unique relationships, one day tab
  stop, and correct current/selected/disabled semantics.
- **Why not landed:** nothing to port — the case was specified but never
  proven anywhere, and most of its states (items 3, 4, 6, 9) don't
  exist yet.
- **Revisit when:** items 3, 4, 6, and 9 land — then execute the sweep
  as their joint acceptance gate.
- **Open questions:** which checker is "the configured" one for lib
  components — confirm the tool before the first run.

## Non-decisions (rejected outright)

- Controlled-only `value` (dropping `defaultValue` + internal state) —
  mangling-class breaking change, rejected at triage; see crew log
  (`calendar.md:6-7`) and SPEC.md "Gaps & incoherence" (`defaultValue`
  retained deliberately).
- `PrevButton`/`NextButton` → `Previous`/`Next` rename (quarantine kept
  `PrevButton`/`NextButton` as aliases at `Calendar.tsx:909-910`, used
  the new names only in its Book rewrite) — rename-class churn,
  rejected; see crew log (`calendar.md:6`) and SPEC.md ("Part naming
  drift … kept").

## Walkthrough notes for HQ

- Deepest behavior gap: the range preview machine (item 9). In Book's
  DateRange story, click a start date then hover across the grid —
  today there is no preview band and Tab-away commits nothing; the
  second click just completes. This also blocks DateField.Range, so it
  is the highest-leverage item to schedule.
- Largest a11y gap: keyboard navigation (item 7 + suspected gap 1).
  In Book's SingleDate story, Tab into the grid and press arrows/Home/
  PageDown — nothing moves, and a pane with no selection offers no tab
  stop at all. Any keyboard-only date picking waits on this item.
- Most visible paint call: locale week-start wiring (item 3). Book has
  no non-Sunday story today — headers are hardcoded `Su Mo …` — so to
  feel it, compare SingleDate against quarantine's `en-GB`
  Monday-first grid (`CA-LOC-01` in `week-grid.test.ts` proves the
  math; only the render wiring is missing). Approving this look
  unblocks items 4, 10, and 11.
- Open product question before any of that lands: fail-closed behavior
  (item 2). Quarantine renders blank output on invalid props — decide
  whether HQ accepts invisible failure or wants a degraded grid with
  the diagnostic, because items 1 and 6 both depend on the answer.
