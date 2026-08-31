# Calendar test contract

Playwright: `matrix/lib/tests/e2e/calendar.spec.ts`  
Unit: `matrix/lib/tests/unit/calendar.test.ts`
Page: `/calendar`

Calendar owns Gregorian day/range grids and month/year pickers on canonical
ISO strings, locale-derived labels/week start, roving focus, controlled
selection, month navigation, and heading-driven views. DateField and
DateField.Range fold standard pickers through `DateField.Picker`;
Calendar does not own a field, popup, or product host.

## Freeze decisions

1. Visible month is optional. Omitted `month` is Calendar-owned pane
   state, seeded from `value` / `today` as documented, and remount
   (typical Popover Content) re-seeds so DateInput opens on the selected
   day. Supplying `month` makes it controlled with
   `onMonthChange(month: YYYY-MM)`. Controlled `month` and `value` stay
   independent.
2. A completed range crossing an unavailable date is rejected; no noncontiguous
   range option exists in this freeze.
3. Padded outside-month days are enabled buttons; focusing/selecting one
   requests its visible month.
4. Invalid runtime ISO strings produce a descriptive development error and
   safe no-render/no-callback behavior.
5. `today` is optional. When omitted, SSR and the first hydration render no
   today marker; the client-local calendar date is marked after mount. Supplying
   `today` makes server/client output deterministic.
6. `locale` is required; there is no server-environment-dependent default.
7. View is Calendar-owned interaction state, like range preview. It starts
   at the mode home (`day` for day/range, `month`, or `year`) and Calendar
   commits Month/Year/cell view changes itself. View is not a public
   controlled axis. Calendar presents exactly one collection; inactive
   Grid/Months/Years are not in the accessibility tree. Omitted named
   parts render default Header (with Month/Year) and default collections.
   Extra children are ordinary chrome with explicit application or Date
   controller props. The application does not write a `view ===` ternary.
   Previous/Next are disabled outside day view.
8. One discriminated `mode` describes the four products: omitted
   `"day"`, `"range"`, `"month"`, or `"year"`. Their required controlled
   values are respectively `ISODate | null`, date range or null,
   `ISOMonth | null`, and `ISOYear | null`. There is no speculative
   selection × precision cross-product.

These are Calendar API details, not a reason for a packaged visual DateInput
or a date-library public type. Typed input is `DateField`. DateRange is two
DateFields plus this grid's range machine; its optional transaction
controller stays in the DateField module.

## Source evidence

- `vendor/react-spectrum/packages/react-aria-components/test/Calendar.test.js`
  and React Aria calendar hook tests — grid roles, focus, keyboard,
  min/max/unavailable, controlled navigation, and range behavior.
- `vendor/react-spectrum/packages/@internationalized/date/src/queries.ts` and
  `weekStartData.ts` plus their upstream tests — Gregorian arithmetic, locale
  week start, leap/year/month boundaries, formatting, and
  timezone-independent date values.
- `vendor/react-day-picker/packages/react-day-picker/src/DayPicker.test.tsx`
  and its date utilities — padded month construction, outside days,
  `getNextFocus`, labels, range preview, and modifier/data-state contrast.
- Zag date-picker/date-utils tests — month days, week days, locale, year range,
  comparisons, and unavailable skip.
- `vendor/design-system/Date` — range-native `{ start, end }` painting on
  day/month/year cells, heading Month/Year drill-down, DateInput opening on
  the selected month, DateRange field-focus month sync, and day/month/year
  product modes. `Date` objects, date-fns, and ±100 year `new Date()`
  defaults are leave.

## Required cases

### ISO parsing and Gregorian arithmetic

- [x] `CA-ISO-01` `[reference]` `[unit]` —
  **Calendar should accept only canonical, possible Gregorian ISO dates.**
  Parse `0001-01-01`, `2024-02-29`, and `9999-12-31`, then try
  `2023-02-29`, `2024-00-10`, `2024-13-10`, `2024-04-31`,
  `2024-01-00`, unpadded fields, missing fields, whitespace, time suffixes,
  offsets, and zone annotations. Assert valid inputs round-trip byte-for-byte
  as `YYYY-MM-DD` and every invalid form returns the documented descriptive
  validation failure without partial date output; lexical dates are safe only
  after this gate.
- [x] `CA-ISO-02` `[vendor]` `[unit]` —
  **Calendar day arithmetic should cross Gregorian month, year, and leap
  boundaries without local-time rollover.** Add and subtract around
  `1999-12-31/2000-01-01`, `2023-02-28/2023-03-01`,
  `2024-02-28/29/2024-03-01`, and `1900-02-28/1900-03-01`, and verify
  underflow below `0001-01-01` or overflow above `9999-12-31` is rejected.
  Assert exact canonical results with no `Date`, timezone, or hour component.
  This ports `@internationalized/date` Gregorian boundary coverage, including
  `queries.test.js` / “endOfMonth moves the day to the last day.”
- [x] `CA-ISO-03` `[vendor]` `[unit]` —
  **Calendar month arithmetic should constrain the day to the target
  Gregorian month while preserving valid year changes.** Check
  `2023-01-31 + 1 month = 2023-02-28`,
  `2024-01-31 + 1 = 2024-02-29`,
  `2024-03-31 - 1 = 2024-02-29`, and
  `2024-12-31 + 1 = 2025-01-31`, then exercise both bounded-year overflows.
  Assert the source value is not mutated and every result remains canonical;
  this re-hosts `CalendarDate.add/subtract` constraint behavior instead of
  JavaScript `Date` overflow.
- [x] `CA-ISO-04` `[reference]` `[unit]` —
  **Calendar should compare and normalize dates only after canonical
  validation.** Order a shuffled valid set spanning `0001-01-01` through
  `9999-12-31`, normalize a reverse pair into chronological range endpoints,
  and apply inclusive `min="2024-02-01"` / `max="2024-03-01"` checks; also
  attempt the same operations with one invalid string. Assert validated
  lexical order equals Gregorian order and invalid input stops comparison
  before any min, max, or range result; this prevents malformed strings from
  exploiting lexical shortcuts.
- [x] `CA-ISO-05` `[reference]` `[unit]` —
  **Calendar ISO arithmetic should produce identical dates in every timezone
  and across daylight-saving transitions.** Run the same parse, day/week/month
  add, compare, and grid-boundary vectors with process/browser zones `UTC`,
  `America/Los_Angeles`, `Europe/Berlin`, and `Pacific/Kiritimati`, including
  2024 spring-forward and fall-back dates. Assert byte-identical ISO outputs
  and row membership in every run; calendar dates must not inherit instant or
  local-midnight behavior.
- [x] `CA-ISO-06` `[reference]` `[unit]` —
  **Calendar should fail safely before rendering or invoking callbacks when
  any date-like prop is invalid.** Independently supply an invalid single
  `value`, range start, range end, `month`, `today`, `min`, and `max`, with
  spies for `isDateUnavailable`, `onMonthChange`, and `onChange`. Assert one
  descriptive development diagnostic names the prop and bad string, no grid
  is produced for that invalid fixture, and all three callbacks remain empty;
  invalid values must never leak into application code.
- [x] `CA-ISO-07` `[reference]` `[unit]` —
  **Calendar should reject contradictory bounds and mode/value shapes
  rather than reinterpret them.** Test `min="2024-06-02"` with
  `max="2024-06-01"`, day mode with a range or month, range mode with a
  scalar or malformed range, month mode with a day, and year mode with a
  month. Assert a descriptive diagnostic identifies the contradiction,
  renders no ambiguous selection, and calls neither change callback;
  controlled application data must never be coerced to fit a mode.
- [x] `CA-ISO-08` `[reference]` `[unit]` —
  **Calendar should keep all Gregorian values inside the four-digit
  0001–9999 domain.** Validate and format boundary dates in years `0001`,
  `0099`, `0100`, and `9999`, then reject `0000`, `-0001`, `+0001`,
  `10000`, and five- or six-digit fields in both dates and months. Assert
  accepted years preserve four digits through arithmetic, lexical ordering,
  grid generation, and Gregorian `Intl` labels, while boundary navigation
  cannot generate an out-of-domain value; one bounded domain keeps every
  layer consistent.

### Locale, week start, and labels

- [x] `CA-LOC-01` `[vendor]` `[unit]` —
  **Calendar should derive Sunday-first US weeks and Monday-first British
  weeks from the required locale.** For the week containing
  `2024-08-14`, compute boundaries and weekday order under `en-US` and
  `en-GB`, then build the August grids. Assert US rows run Sunday–Saturday,
  British rows run Monday–Sunday, and the `en-GB` result is the required
  non-Sunday freeze fixture. This ports `@internationalized/date`
  `queries.test.js` / the locale-specific `startOfWeek` cases.
- [x] `CA-LOC-02` `[vendor]` `[unit]` —
  **Calendar should support a locale whose week begins on Saturday.** Resolve
  `ar-AF` through `Intl.Locale.weekInfo` when available and the bundled CLDR
  fallback otherwise, then construct a month containing leading padding.
  Assert first-day index `6`, Saturday–Friday headers, and matching grid row
  boundaries in both resolution paths. This exercises the `AF: 6` entry in
  `@internationalized/date/src/weekStartData.ts` rather than assuming only
  Sunday or Monday starts.
- [x] `CA-LOC-03` `[reference]` `[unit]` —
  **Calendar should resolve locale extensions, language-only subtags, and
  valid unsupported locales through the same Intl negotiation path.** Compare
  `en-US-u-fw-mon`, language-only `fr`, and a structurally valid unavailable
  locale such as `zz-ZZ` against the runtime's canonicalized/resolved locale
  plus the bundled week-start fallback. Assert extensions that control week
  order are honored, region fallback is deterministic within that runtime,
  and the result is never hardcoded to US Sunday order merely because direct
  locale data is absent; this protects locale negotiation rather than one
  environment's language inventory.
- [x] `CA-LOC-04` `[vendor]` `[browser]` —
  **Calendar should render weekday headers in locale order with concise text
  and full accessible names.** Render August 2024 in `en-GB` and inspect the
  generated `th[scope="col"]` sequence. Assert visible text is seven
  locale-short labels beginning Monday, each header's accessible name is the
  unambiguous full weekday in the same locale, and duplicate short glyphs do
  not collapse names. This adapts React Spectrum `Calendar.test.js` / “should
  support weekdayStyle.”
- [x] `CA-LOC-05` `[convergence]` `[browser]` —
  **Calendar should localize the visible heading and name navigation buttons
  by their target months while keeping ISO callback values.** Render
  `month="2024-01"` in `en-GB`, then inspect Heading, Previous, and Next
  before clicking Next. Assert Heading is the locale-formatted January 2024,
  the buttons' accessible names are locale-formatted December 2023 and
  February 2024 rather than bare untranslated “Previous”/“Next,” and the sole
  request remains ISO `"2024-02"`. This converges React Spectrum localized
  calendar labels with Reference UI's string API.
- [x] `CA-LOC-06` `[reference]` `[rtl]` —
  **Calendar should preserve chronological date semantics while an inherited
  RTL direction reverses visual day movement.** Render January 2024 with
  `locale="ar-AE"` inside `dir="rtl"`, focus `2024-01-15`, and use
  ArrowLeft/ArrowRight plus Previous/Next. Assert weekday columns and localized
  labels follow RTL presentation, ArrowLeft advances to January 16 and
  ArrowRight returns to January 15, while Previous still requests
  `"2023-12"` and Next `"2024-02"`; direction changes spatial keys, not time.
- [x] `CA-LOC-07` `[reference]` `[browser]` —
  **Calendar should recompute all locale-derived output coherently when locale
  changes at runtime.** With controlled `month="2024-09"` and
  `value="2024-09-18"`, rerender `en-US → en-GB` without changing either
  date prop. Assert heading language, weekday order, full labels, row padding,
  Home/End week boundaries, and navigation names switch in one commit while
  selection, focused ISO date, IDs for surviving dates, and both callback logs
  remain unchanged; locale is presentation and week policy, not value.
- [x] `CA-LOC-08` `[reference]` `[unit]` —
  **Calendar should force Gregorian labels for a locale with another default
  calendar and reject an explicit non-Gregorian calendar request.** Format and
  grid `2024-01` under plain `ar-SA`, preserving Arabic language, resolved
  numbering system, and RTL direction while forcing `calendar="gregory"`;
  then try `ar-SA-u-ca-islamic`. Assert the plain locale labels the same
  Gregorian cells without changing ISO values, while the explicit unsupported
  calendar extension produces a descriptive diagnostic and no mixed-calendar
  output; application intent must not be silently overwritten.

### Month grid construction

- [x] `CA-GRID-01` `[vendor]` `[unit]` —
  **Calendar should generate only complete seven-day weeks that fully cover
  the controlled month.** Build Monday-first February 2021, Sunday-first
  August 2021, and Sunday-first May 2021, which require four, five, and six
  rows. Assert the outputs have exactly 28, 35, and 42 consecutive dates
  respectively, seven columns per row, and include every in-month date with
  only the necessary leading and trailing padding. This re-hosts
  react-day-picker `getDates.ts` complete-week construction and
  `@internationalized/date` `getWeeksInMonth` boundary coverage.
- [x] `CA-GRID-02` `[vendor]` `[unit]` —
  **Calendar padding should align to the locale week boundary for every
  possible month edge.** Parameterize months whose first and last dates fall
  on each weekday under Sunday-, Monday-, and Saturday-first locales. Assert
  the first generated date is that locale's start of the containing week, the
  last is its end, rows are consecutive with no duplicate/gap, and padding
  switches sides correctly. This ports `@internationalized/date`
  `queries.test.js` / `startOfWeek`, `endOfWeek`, and
  `getWeeksInMonth` matrices.
- [x] `CA-GRID-03` `[vendor]` `[unit]` —
  **Calendar should include every Gregorian day of the visible month exactly
  once across all month lengths.** Generate February 1900, February 2000,
  February 2023, February 2024, April 2024, and January 2024 under more than
  one week start. Assert in-month subsets contain exactly 28, 29, 28, 29, 30,
  and 31 unique canonical dates in order, while duplicates occur nowhere in a
  single grid; this protects leap-century and month-length arithmetic from
  padding logic.
- [x] `CA-GRID-04` `[reference]` `[browser]` —
  **Calendar should expose one semantic table grid with one native Day button
  per date cell.** Render a complete month with default Days content and
  inspect roles plus native tag names, including hidden accessibility queries.
  Assert Grid is
  `table[role="grid"]`, each week is a `tr[role="row"]`, weekday cells are
  `th[role="columnheader"]`, date cells are `td[role="gridcell"]`, and each
  date cell contains exactly one native `Calendar.Day` button and no second
  interactive target; this freezes both table validity and APG semantics.
- [x] `CA-GRID-05` `[vendor]` `[browser]` —
  **Calendar should distinguish padded dates from dates in the controlled
  visible month.** Render `month="2024-09"` in `en-GB`, which includes August
  and October padding, and inspect every day against its ISO month. Assert
  every padded day button has `data-outside-month`, no September button has
  it, and all remain ordinary enabled buttons unless bounds or availability
  disable them. This adapts react-day-picker's outside-day modifier contrast
  to Reference UI's public data attribute.
- [x] `CA-GRID-06` `[reference]` `[browser]` —
  **Calendar should give every day button a full locale-derived accessible
  date name independent of its visible day number.** Render two dates with the
  same visible number in adjacent padded months and repeat under `en-GB` and
  `ar-SA`. Assert visible content is the locale-formatted day number while
  each accessible name uniquely includes full weekday, month, day, and year
  for its ISO date; abbreviated or repeated glyphs must never make cells
  ambiguous.
- [x] `CA-GRID-07` `[reference]` `[browser]` —
  **Calendar should keep day identity stable across rerenders and unique
  across instances.** Capture all day button IDs for September 2024 in two
  equal Calendars, rerender one to October so padded dates overlap, and then
  rerender it back. Assert equal ISO dates retain their node and ID while
  mounted, no two buttons in the document share an ID, and returning dates
  regain deterministic instance-local identity without stale focus
  references; date strings alone cannot be global DOM IDs.
- [x] `CA-GRID-08` `[reference]` `[browser]` —
  **Calendar should forward native props and refs only to its documented
  authored parts.** Supply native attributes, classes, styles, handlers,
  object refs, and callback refs to Calendar, Header, Heading, Previous, Next,
  Month, Year, Grid, Weekdays, Days, Months, Years, custom `Calendar.Day`,
  `Calendar.MonthCell`, and `Calendar.YearCell` parts, then interact and
  rerender. Assert each public part lands on its fixed `div`, `button`,
  `table`, `thead`, `tbody`, or cell `button` with correct cleanup and managed
  attributes preserved, while generated `tr`, `th`, and `td` elements remain
  internal non-prop targets; authored and generated ownership must stay
  visible.
- [x] `CA-GRID-09` `[vendor]` `[browser]` —
  **Calendar Grid should use Heading as its stable accessible name unless the
  application explicitly names the grid.** Render a generated Heading/Grid
  pair, capture `aria-labelledby`, change the controlled month, then rerender
  Grid with `aria-label="Billing date"`. Assert the generated Heading ID stays
  stable and names the updated month initially, while explicit `aria-label`
  wins and stale `aria-labelledby` is removed rather than combining two names.
  This adapts React Spectrum Calendar grid-label assertions to the fixed
  Heading relationship.
- [x] `CA-GRID-10` `[reference]` `[browser]` —
  **Calendar header and navigation parts should keep fixed native elements and
  non-submitting button defaults.** Render Header and Heading inside a form
  with Previous/Next/Month/Year omitting `type`, activate each, then rerender
  one with explicit `type="submit"`. Assert Header/Heading are authored `div`s,
  navigation and Month/Year default to `button[type="button"]` and never
  submit, while the explicit submit type retains native submission after its
  month or view request; Calendar prevents accidents without overriding
  authored HTML behavior.
- [x] `CA-GRID-11` `[reference]` `[browser]` —
  **Calendar should render valid, exact table section ancestry without wrapper
  or direct-child violations.** Inspect a month containing six rows while
  attaching props/refs to Weekdays and Days. Assert the only Grid section
  children are `thead` then `tbody`, Weekdays is exactly
  `thead > tr > th[scope="col"]`, Days is exactly
  `tbody > tr > td[role="gridcell"] > Calendar.Day`, section props/refs target
  `thead`/`tbody`, and no `div`, extra button wrapper, or orphan `tr`
  interrupts table structure; browsers must not repair invalid authored
  markup.
- [x] `CA-GRID-12` `[reference]` `[browser]` —
  **Calendar Heading should be the stable polite atomic source for controlled
  month announcements.** Observe Heading mutations from initial
  `month="2024-01"` through an accepted update to `"2024-02"` without
  mounting ReferenceLibrary. Assert the same Heading node has
  `aria-live="polite"` and `aria-atomic="true"`, initial mount produces no
  redundant post-mount text mutation, and the accepted month produces exactly
  one locale-formatted text change; local navigation must not depend on a
  global announcer.

### Day rendering and customization

- [x] `CA-DAY-01` `[reference]` `[browser]` —
  **Calendar Days should render each locale-formatted day number by default.**
  Render April 2024 under `en-GB` with `<Calendar.Days />` and inspect in-month
  April 10 plus padded May 1. Assert each generated
  `td[role="gridcell"]` contains exactly one native `Calendar.Day` button whose
  sole default text is `"10"` or `"1"` from that date's `formattedDay`, with
  no consumer renderer, wrapper, or duplicated accessible text; the default
  path must remain complete without customization.
- [x] `CA-DAY-02` `[reference]` `[browser]` —
  **Calendar should provide every exact Day render-state field for single,
  today, outside-month, and disabled dates.** Render
  `month="2024-04"`, `locale="en-GB"`, `today="2024-04-10"`,
  `value="2024-04-10"`, and make April 12 unavailable, then record the render
  objects for April 10, April 12, and padded May 1. Assert each object has
  exactly `date`, `formattedDay`, `outsideMonth`, `today`, `selected`,
  `disabled`, `rangeStart`, `rangeEnd`, `inRange`, and `preview`: April 10 is
  formatted `"10"` with only `today` and `selected` true, April 12 has only
  `disabled` true, and May 1 is formatted `"1"` with only `outsideMonth` true;
  consumers must not infer omitted or implementation-only state.
- [x] `CA-DAY-03` `[reference]` `[browser]` —
  **Calendar should represent a completed controlled range exactly in each Day
  render state.** Render April 2024 with
  `{start:"2024-04-10",end:"2024-04-13"}` and capture states for the 9th
  through 14th with no captured date today, outside, or disabled. Assert each
  `date`/`formattedDay` matches its ISO day, the 10th has `selected`,
  `rangeStart`, and `inRange` true, the 11th–12th have `selected` and
  `inRange` true, the 13th has `selected`, `rangeEnd`, and `inRange` true,
  surrounding dates have all selection/range booleans false, and every state
  has `preview=false`; committed range state must be inclusive and distinguish
  endpoints.
- [x] `CA-DAY-04` `[reference]` `[browser]` —
  **Calendar should expose pending range preview without changing controlled
  selection in Day render state.** Start with
  `{start:"2024-04-10",end:null}`, hover April 13, then replace hover with
  keyboard focus on April 12 while recording every current state. Assert the
  controlled 10th has `selected`, `rangeStart`, `inRange`, and `preview` true,
  each preview-only interior date has `selected=false` with only `inRange` and
  `preview` true among range fields, and the current candidate additionally
  has `rangeEnd=true`; prior candidates return every selection/range field to
  false on the next render and `onChange` remains empty, proving preview is
  public render state but not application value.
- [x] `CA-DAY-05` `[reference]` `[browser]` —
  **Calendar Day should accept custom children, native button props, Reference
  StyleProps, and a native ref without changing its fixed host.** Return
  `<Calendar.Day date={day.date}>` with a number span, an `aria-hidden` event
  dot, `title`, `data-booking-count`, class, consumer style,
  `fontWeight="700"`, and a ref for April 10, then rerender once. Assert the
  custom children appear inside the same native button, native/unrelated data
  props and style survive, computed `font-weight` is `"700"`, and the stable
  ref receives that exact button with supported cleanup semantics;
  customization must not require replacing Day.
- [x] `CA-DAY-06` `[reference]` `[browser]` —
  **Calendar should keep managed Day semantics authoritative over conflicting
  consumer props.** For selected April 10, unavailable April 12, and the sole
  focused date, return Days with conflicting `aria-label`, `aria-selected`,
  `aria-disabled`, `disabled`, `tabIndex`, `data-selected`, `data-disabled`,
  `data-today`, `data-outside-month`, and range data values plus an unrelated
  `aria-describedby`. Assert Day keeps the locale full-date accessible label,
  managed current/disabled ARIA and data booleans, native disabled state, and
  sole `tabIndex=0`; its generated `td` alone exposes the correct managed
  `aria-selected`, while the unrelated description remains. Public Day props
  decorate but cannot forge accessibility, selection, or focus authority.
- [x] `CA-DAY-07` `[reference]` `[browser:all]` —
  **Calendar Day should run consumer events before its cancelable navigation
  and selection defaults.** Return a custom in-month Day with `onClick` and
  `onKeyDown` logs, activate it by primary click, Enter, Space, and ArrowRight
  in fresh controlled fixtures, then repeat with the matching consumer handler
  calling `preventDefault()`. Assert uncanceled pointer order is
  `Day.onClick → onChange(date)`, Enter/Space order is
  `Day.onKeyDown → Day.onClick → onChange(date)` at native button timing, and
  Arrow order is `Day.onKeyDown → focus(nextDate)`; cancellation in
  `onKeyDown` suppresses the derived click/move and cancellation in `onClick`
  suppresses selection, leaving month and value unchanged.
- [x] `CA-DAY-08` `[reference]` `[browser]` —
  **Calendar Days should require each returned Day date to match the render
  state being rendered.** For the callback receiving
  `day.date="2024-04-10"`, return
  `<Calendar.Day date="2024-04-11">10</Calendar.Day>` and separately return a
  noncanonical date. Assert a descriptive diagnostic names the expected and
  received date, no duplicate or misbound interactive cell is exposed, and no
  focus, month, availability, or selection callback receives the mismatched
  value; date matching protects the generated cell-to-button relationship.
- [x] `CA-DAY-09` `[reference]` `[browser]` —
  **Calendar Days should diagnose a renderer that returns no Day element.**
  Return `null`, `undefined`, or `false` for April 10 through runtime-invalid
  casts while valid dates return matching Days. Assert one descriptive
  diagnostic identifies April 10 and the missing `Calendar.Day`, the Days
  rowgroup exposes no partial malformed interactive grid, and no callback or
  stale registration remains; every generated date cell requires one public
  button.
- [x] `CA-DAY-10` `[reference]` `[browser]` —
  **Calendar Days should diagnose a renderer that returns multiple Day
  elements for one date.** For April 10, return a Fragment containing two
  matching `Calendar.Day` elements while other dates return one. Assert one
  descriptive single-Day diagnostic names April 10, neither duplicate button
  enters the grid or focus model, and IDs, refs, and callbacks are not
  partially registered; one generated gridcell cannot own multiple public Day
  parts.
- [x] `CA-DAY-11` `[reference]` `[browser]` —
  **Calendar Days should diagnose a renderer that returns an element other than
  Calendar Day.** Return a native `button`, wrapped `Calendar.Day`, and custom
  component that resolves to a button in separate invalid fixtures. Assert
  each produces a descriptive direct-`Calendar.Day` diagnostic before an
  interactive Days rowgroup is exposed, without silently cloning managed props
  onto the substitute or leaking refs/listeners; fixed part identity is the
  validation boundary.
- [x] `CA-DAY-12` `[reference]` `[browser]` —
  **Calendar should refresh custom Day render state and content from the latest
  locale, month, value, and availability props.** Capture April Day nodes and
  states, rerender `en-GB` to `ar-SA` while changing the selected and
  unavailable dates, then change the controlled month to May and update the
  renderer's event map. Assert surviving April dates keep node identity while
  `formattedDay`, selection, disabled state, custom text, and managed
  attributes update together, May invokes only current dates/data, removed
  refs clean up, and no stale callback or render object reappears; the renderer
  is a view of current Calendar state rather than cached application state.
- [x] `CA-DAY-13` `[reference]` `[ssr]` —
  **Calendar custom Days should hydrate with deterministic content, managed
  state, and native identity.** Server-render an explicit
  `month="2024-04"`, `locale="en-GB"`, `today="2024-04-10"`, selected
  value, availability predicate, and deterministic event markers through a
  Days renderer, then hydrate the same props. Assert byte-equivalent custom
  children and managed ARIA/data/tabIndex on first hydration, no warning or
  callback, and each ref attaches to the existing server-rendered Day button
  rather than a replacement; custom content must preserve Calendar's SSR
  guarantees.
- [x] `CA-DAY-14` `[reference]` `[react:all]` —
  **Calendar custom Days should keep one button identity and one event default
  under StrictMode and every supported React version.** In React 17, 18, and
  19 fixtures, render custom Days under available StrictMode, capture April 10
  by ref, perform a no-op rerender, and activate it once. Assert exactly one
  DOM Day for each ISO date, stable April 10 node/ref identity, no ref-driven
  render loop or stale registration despite renderer replay, one consumer
  event, and one controlled request; invocation replay must not duplicate the
  public grid.

### Day state and initial focus

- [x] `CA-STATE-01` `[vendor]` `[browser]` —
  **Calendar should mark exactly the cell matching today's ISO date regardless
  of selection or focus.** Fix the client clock and explicit `today` at
  `2024-02-15`, render February with a different selected date, and move focus
  onto and away from the 15th. Assert only `2024-02-15` has `data-today` at
  every step and that marker never follows selection, focus, or padded-month
  status. This adapts react-day-picker `DayPicker.test.tsx` / “should focus
  today's date” while separating the three states.
- [x] `CA-STATE-02` `[vendor]` `[browser]` —
  **Calendar should expose controlled selection separately from its sole day
  focus target.** Render single `value="2024-04-10"`, Tab into the grid, and
  ArrowRight to April 11 without accepting a selection request. Assert the
  10th alone keeps `data-selected`, the 11th alone has
  `tabIndex=0`, `data-focused`, and DOM focus, and every other day has
  `tabIndex=-1`; moving focus must not rewrite controlled selection. This
  reflects React Spectrum `Calendar.test.js` / “should support selected
  state.”
- [x] `CA-STATE-03` `[reference]` `[browser]` —
  **Calendar should choose a deterministic enabled in-month day as its initial
  grid tab target.** In separate reset fixtures, provide an enabled selected
  date in month, no selected date with enabled today in month, and neither with
  the first several in-month days disabled. Assert the sole `tabIndex=0`
  preference is selected date, then today, then the first enabled in-month
  date, without automatically stealing current document focus; native Tab
  should enter at that target.
- [x] `CA-STATE-04` `[vendor]` `[browser]` —
  **Calendar should combine bounds and application unavailability into one
  noninteractive day state.** Render June 2024 with
  `min="2024-06-05"`, `max="2024-06-25"`, and a predicate that makes the
  12th unavailable, then inspect dates below, within, above, and unavailable.
  Assert every blocked day button has native `disabled`,
  `aria-disabled="true"`, and `data-disabled`, every allowed day lacks all
  three, and pointer/keyboard cannot activate blocked dates. This combines
  React Spectrum `Calendar.test.js` / “should support unavailable state” and
  “should support disabled state.”
- [x] `CA-STATE-05` `[reference]` `[browser]` —
  **Calendar should call only the current availability predicate with valid
  canonical dates for the grid it is evaluating.** Render a fixed September
  grid with predicate A recording arguments, replace it with predicate B and
  change to October, then interact with the new grid. Assert every recorded
  argument is a valid `YYYY-MM-DD`, the committed rendered-date sets are
  evaluated deterministically, A receives no calls after replacement, and
  B alone determines all new `data-disabled` states; stale predicates must not
  leak through memoized date cells.
- [x] `CA-STATE-06` `[reference]` `[browser]` —
  **Calendar should preserve a controlled selected date that later becomes
  disabled without leaving it interactive.** Render
  `value="2024-06-12"` while available, then rerender the predicate to disable
  the 12th without changing value. Assert the date remains
  `data-selected`/`aria-selected="true"` but gains all disabled state, loses
  the sole tab stop and `data-focused`, cannot emit `onChange`, and focus
  moves to the nearest enabled date only if focus was inside the grid;
  controlled selection authority does not imply activation authority.
- [x] `CA-STATE-07` `[reference]` `[browser]` —
  **Calendar should expose no artificial day tab stop when every rendered
  date is disabled.** Use an availability predicate that returns true for
  every visible and padded date, Tab through Previous, Next, Grid vicinity,
  and the control after Calendar, then dispatch movement from a formerly
  focused day after the disabling rerender. Assert every day has
  `tabIndex=-1`, no movement loops or month requests occur, and enabled
  navigation buttons plus surrounding controls remain reachable in native
  order; an empty focus model must terminate safely.
- [x] `CA-STATE-08` `[vendor]` `[browser]` —
  **Calendar should expose today's date with both data and current-date
  semantics exactly once.** Render a grid containing explicit
  `today="2024-02-15"` and query every day button before and after changing
  selection and focus. Assert only that button has
  `data-today` and `aria-current="date"`, all others omit
  `aria-current`, and moving to a month without today produces no current
  cell. This lifts React Aria's current-date semantics while retaining
  Reference UI's styling hook.
- [x] `CA-STATE-09` `[vendor]` `[browser]` —
  **Calendar gridcells should report controlled selection inclusively without
  treating a range preview as selected state.** Compare single
  `value="2024-03-10"`, pending range
  `{start:"2024-03-10",end:null}`, completed range ending March 13, and a
  hover preview to March 15. Assert each `td[role="gridcell"]` has explicit
  `aria-selected="true"|"false"` matching the controlled selected dates,
  completed endpoints and interior are true, pending start alone is true, and
  preview-only dates remain false; this adapts React Spectrum selection
  semantics to the fixed cell/button anatomy.
- [x] `CA-STATE-10` `[reference]` `[browser]` —
  **Calendar should use explicit null as controlled empty state and
  require value.** Render day mode with an explicit locale/month and
  `value={null}`, first providing then omitting `onChange`; activate June
  12 without updating props. Assert the first fixture requests
  `"2024-06-12"` once, both fixtures keep every gridcell
  `aria-selected="false"` with no `data-selected`, and focus may move
  without creating internal selection. Assert omitted `value` is a
  type/runtime diagnostic, not implicit uncontrolled or null state.
- [x] `CA-STATE-11` `[reference]` `[ssr]` —
  **Calendar should add an omitted client-local today marker only after a
  hydration-safe first render.** Freeze the client-local date at
  `2024-02-15`, server-render `month="2024-02"` `value={null}` without `today`, hydrate the
  exact output, and observe the first post-mount commit. Assert server markup
  and the initial hydration tree contain no `data-today` or
  `aria-current`, hydration has no warning, and exactly the 15th gains both
  after mount without changing IDs, focus, selection, or callbacks; the local
  clock cannot influence SSR markup.
- [x] `CA-STATE-12` `[reference]` `[browser]` —
  **Calendar should treat the full bounded Gregorian domain as available when
  all constraint props are omitted.** Render boundary months `0001-01` and
  `9999-12`, plus an ordinary month, without `min`, `max`, or
  `isDateUnavailable`, and activate enabled in-domain edge dates. Assert every
  rendered valid date lacks disabled state, no nonexistent predicate is
  invoked, selection requests carry canonical boundary strings, and only
  navigation that would leave 0001–9999 is unavailable; omitted constraints
  must not acquire truthy defaults.

### Controlled visible month

- [x] `CA-MONTH-01` `[reference]` `[browser]` —
  **Calendar should render its controlled month independently from the
  controlled selected value.** Render `month="2024-04"` with
  `value="2024-09-18"`, then change only value to an April date and later to
  null. Assert Heading, grid dates, navigation targets, and announcement source
  remain April throughout while only selected state changes when its date is
  rendered; selection must never be an implicit visible-month controller.
- [x] `CA-MONTH-02` `[vendor]` `[browser]` —
  **Calendar navigation buttons should request exactly the adjacent ISO month
  without changing a rejected controlled grid.** From
  `month="2024-01"`, click Next and Previous in reset fixtures, log each
  button's consumer `onClick` and root `onMonthChange`, and do not update the
  prop; repeat once with `onMonthChange` omitted. Assert normal order is
  consumer click then `"2024-02"` or `"2023-12"` request, one request per
  click, unchanged January Heading/grid with no announcement, safe no-op when
  the callback is absent, and `preventDefault()` at the consumer click removes
  the request. This adapts react-day-picker `DayPicker.test.tsx` / “when
  navigating with month callbacks” to one controlled callback.
- [x] `CA-MONTH-03` `[reference]` `[browser]` —
  **Calendar should apply a programmatic month prop update without echoing a
  navigation request.** While focus is outside Calendar, rerender
  `month="2024-01"` as `"2024-02"` and observe Heading, Grid, day tab stop,
  and callback logs. Assert February commits coherently with one Heading text
  mutation/polite announcement, `onMonthChange` and `onChange` remain empty,
  and external focus stays put; parent state changes are not user navigation.
- [x] `CA-MONTH-04` `[vendor]` `[browser]` —
  **Calendar should disable a month navigation direction exactly when its
  target month contains no enabled in-domain date.** Test June 2024 with a
  mid-month `min`, December with a mid-month `max`, an adjacent month made
  wholly unavailable, an adjacent month with one available date, and global
  boundaries `0001-01`/`9999-12`. Assert only directions with zero enabled
  target dates have native `disabled` and `aria-disabled`, partial target
  months remain navigable, disabled activation emits no request, and no
  out-of-domain month is produced. This extends React Spectrum
  `Calendar.test.js` / “supports minValue and maxValue” to availability and
  Reference UI's bounded years.
- [x] `CA-MONTH-05` `[reference]` `[browser]` —
  **Calendar should never render or announce an optimistic month while rapid
  controlled requests are pending or rejected.** From January, click Next
  twice before any parent update, reject both, then issue another Next and
  accept February once. Assert the first two gestures each request the current
  adjacent target `"2024-02"` but leave one January grid and no live mutation,
  the accepted parent commit produces one February grid and one announcement,
  and no stale request later restores January or duplicates February; user
  intent may repeat while rendering remains prop-authoritative.
- [x] `CA-MONTH-06` `[vendor]` `[browser]` —
  **Calendar should visibly format each controlled month and announce each
  accepted change exactly once.** Observe a stable Heading while mounting
  January, accepting a Next request to February, and programmatically updating
  to March under `en-GB`. Assert visible text is the locale month/year at each
  commit, mount causes no redundant post-mount announcement, and each later
  accepted month causes one polite atomic text mutation with no offscreen
  duplicate. This adapts React Spectrum Calendar heading tests and
  react-day-picker's programmatic month update regression.
- [x] `CA-MONTH-07` `[reference]` `[browser]` —
  **Calendar should request an enabled outside day's month and preserve that
  day as the controlled grid's focus target after acceptance.** In one
  September fixture, move keyboard focus to enabled padded `2024-10-01`; in a
  reset fixture, primary-click that date, then accept the requested October
  month. Assert each gesture produces one `onMonthChange("2024-10")`, the
  click orders that request before its selection callback, and the surviving
  October 1 button/node regains sole `tabIndex=0` and DOM focus after the grid
  commit when focus began in the grid; padded days are real navigation
  targets.
- [x] `CA-MONTH-08` `[reference]` `[browser]` —
  **Calendar should keep pointer focus on a navigation button while its
  controlled month update chooses the next day tab target.** Primary-click
  Next from January while a January day is the preferred tab stop, accept
  February, and repeat for Previous. Assert the activated navigation button
  retains DOM focus through each commit, the new grid has exactly one
  deterministic `tabIndex=0` day selected by initial-target rules, and
  Calendar never forces focus into that day; roving readiness and active focus
  are separate.
- [x] `CA-MONTH-09` `[reference]` `[browser]` —
  **Calendar should own the visible pane when `month` is omitted.**
  Render `value="2024-09-18"` with no `month` / `onMonthChange`. Assert
  September is visible, Next commits October internally with an empty
  `onMonthChange` log, and Heading follows. Then change `value` to
  `2024-04-10`. Assert the pane follows to April. User navigation to May
  must not emit `onChange`.
- [x] `CA-MONTH-10` `[reference]` `[browser]` —
  **Calendar should re-seed omitted `month` on remount, not while kept
  mounted.** Render DateInput-style `value="2024-09-18"` with omitted
  `month`. Navigate to April, unmount, remount. Assert September is
  visible again with no application `onMonthChange`. In a kept-mounted
  fixture, navigate to April, hide without unmounting, show again.
  Assert April remains; pass controlled `month` to reset that product.

### Day/week keyboard navigation

- [x] `CA-KEY-01` `[vendor]` `[browser:all]` —
  **Calendar arrow keys should move by one visual day horizontally and seven
  calendar days vertically.** Focus `2024-04-10`, press Left, Right, Up, and
  Down in LTR reset fixtures, then repeat horizontal keys under inherited RTL.
  Assert LTR Left/Right reach April 9/11, RTL Left/Right reach April 11/9,
  Up/Down reach April 3/17 in both directions, handled events prevent page
  scroll, and one day remains the tab stop. This re-hosts React Aria calendar
  movement and react-day-picker `getNextFocus` day/week behavior.
- [x] `CA-KEY-02` `[vendor]` `[browser:all]` —
  **Calendar Home and End should move to the current locale week's enabled
  boundaries.** Focus Wednesday `2024-08-14` under `en-US`, `en-GB`, and
  Saturday-first `ar-AF`, then press Home and End in reset fixtures. Assert
  targets are each locale's Sunday/Saturday, Monday/Sunday, and
  Saturday/Friday boundaries respectively, with disabled boundary dates
  skipped inward in movement direction and no month or selection callback
  unless the target crosses a controlled month. This ports
  `@internationalized/date` locale week-boundary tests into browser focus.
- [x] `CA-KEY-03` `[vendor]` `[browser:all]` —
  **Calendar PageUp and PageDown should request the adjacent month and preserve
  the focused day when possible, constraining it at month end.** Focus
  `2024-01-31`, press PageDown, accept February, then press PageUp from
  February 29 and accept January. Assert requests are `"2024-02"` then
  `"2024-01"`, focus targets February 29 then January 29 according to the
  currently focused day, each target is applied only after its controlled
  month commit, and no selection request occurs. This follows React Aria
  month-page navigation and Gregorian day constraint rules.
- [x] `CA-KEY-04` `[reference]` `[browser]` —
  **Calendar should leave modified navigation gestures outside its frozen
  keyboard contract unhandled.** On a focused day, send Shift, Alt, Control,
  and Meta variants of PageUp/PageDown and Arrow keys that are not otherwise
  documented. Assert those events are not default-prevented by Calendar,
  focus/month/selection and callback logs remain unchanged, and no implicit
  year jump appears; applications and browsers retain unclaimed shortcuts.
- [x] `CA-KEY-05` `[vendor]` `[browser]` —
  **Calendar keyboard navigation should skip blocked dates in movement
  direction and stop at inclusive bounds without wrapping.** Disable April
  11–13, set `min="2024-04-05"` and `max="2024-04-20"`, then move right
  from April 10, left from April 14, and outward from both bounds. Assert focus
  reaches April 14 and April 10, stays on April 5/20 at the bounds, never wraps
  or selects, and emits no impossible month request. This ports
  react-day-picker `getNextFocus.test.tsx` / “should return the next focus date
  if it is disabled.”
- [x] `CA-KEY-06` `[reference]` `[browser]` —
  **Calendar should terminate a movement attempt when no enabled candidate
  exists in that direction.** Focus the only enabled date in a bounded span,
  make every later candidate unavailable, and press Right, Down, End, and
  PageDown repeatedly. Assert focus and the sole tab stop remain on the
  original date, no `onMonthChange` or `onChange` call occurs, and availability
  evaluation terminates at the bound rather than looping; disabled-skip search
  must be finite.
- [x] `CA-KEY-07` `[vendor]` `[browser]` —
  **Calendar should defer cross-month keyboard focus until its controlled
  month request is accepted.** Focus September 30 in a September grid, press
  Right toward October 1, reject the first request, then repeat and accept
  October. Assert the first gesture requests `"2024-10"` while focus/grid stay
  on September 30, the second request is identical, and after the parent
  commit focus lands exactly once on October 1 with one tab stop and no
  selection. This adapts React Aria controlled navigation and
  react-day-picker's controlled-month focus regression.
- [x] `CA-KEY-08` `[reference]` `[browser]` —
  **Calendar movement keys should change only focus and, when necessary, the
  requested month.** Start with controlled selected April 10 and exercise
  Arrow, Home, End, PageUp, and PageDown through accepted and rejected month
  transitions without Enter or Space. Assert `onChange` stays empty and
  `data-selected`/`aria-selected` remain on April 10 even as
  `data-focused`, sole `tabIndex=0`, and controlled month targets move;
  navigation cannot double as selection.
- [x] `CA-KEY-09` `[reference]` `[browser]` —
  **Calendar should let a custom Day handler cancel a key before internal
  movement or activation.** Return a matching `Calendar.Day` with
  `onKeyDown`, focus it, then log and call
  `preventDefault()` for ArrowRight, PageDown, Enter, and Space in reset
  fixtures. Assert the Day handler runs first, focus/month/selection and
  both root callback logs remain unchanged, while an uncanceled repeat performs
  the documented action; the public button part must preserve consumer-first
  cancellation without requiring a Days-section capture handler.
- [x] `CA-KEY-10` `[reference]` `[browser]` —
  **Calendar should discard a pending keyboard focus target when controlled
  constraints or month change make it stale.** Request October 1 by moving
  right from September 30, then before accepting change `max` to September 30,
  mark October 1 unavailable, or programmatically render November in separate
  fixtures. Assert no late effect focuses the removed/disabled October node,
  the committed grid computes one valid tab target, external focus is not
  stolen, and stale month/selection callbacks do not fire; deferred focus must
  be revalidated against current props.

### Single selection

- [x] `CA-SINGLE-01` `[vendor]` `[browser:all]` —
  **Calendar should request an enabled clicked ISO date exactly once in single
  mode.** Render `value={null}` with mode omitted, primary-click
  `2024-04-10`, and keep the controlled value unchanged. Assert
  `onChange` receives exactly `"2024-04-10"` once, focus and sole tab stop move
  to that button, and no cell becomes selected until the parent accepts the
  value. This adapts React Spectrum `Calendar.test.js` / “should support
  selected state” to request-only control.
- [x] `CA-SINGLE-02` `[vendor]` `[browser:all]` —
  **Calendar should request the same focused ISO date once for Enter and
  Space.** Focus enabled `2024-04-10`, perform complete Enter and Space
  gestures in reset fixtures, and record native key/click plus change logs.
  Assert each gesture emits one `"2024-04-10"` request, Space follows native
  button keyup timing, Enter is not doubled by a synthetic handler, and focus
  stays on the day. This ports the React Aria keyboard selection contract.
- [x] `CA-SINGLE-03` `[reference]` `[browser]` —
  **Calendar should not emit or clear when the already selected single date is
  activated.** Render controlled `value="2024-04-10"` and activate that date
  by primary click, Enter, and Space in reset fixtures. Assert `onChange`
  remains empty, the same gridcell stays selected, focus may stay on its day
  button, and no null request is produced; single Calendar selection is not a
  toggle.
- [x] `CA-SINGLE-04` `[reference]` `[browser]` —
  **Calendar should prevent every input modality from selecting a blocked
  date.** Test one date below `min`, one above `max`, and one returned by
  `isDateUnavailable`, attempting primary click, Enter, and Space on each
  through browser or programmatic focus setup. Assert all retain native/ARIA
  disabled state, neither `onChange` nor `onMonthChange` runs, controlled
  selection is unchanged, and focus navigation skips them; all three blocking
  sources share one activation rule.
- [x] `CA-SINGLE-05` `[reference]` `[browser]` —
  **Calendar should keep controlled single selection unchanged when the parent
  rejects a valid request.** With April 10 selected, click enabled April 12
  and leave `value` unchanged. Assert one `"2024-04-12"` request, DOM focus and
  sole tab stop may move to April 12, but only April 10 retains
  `data-selected` and `aria-selected="true"`; focus intent does not create
  optimistic application state.
- [x] `CA-SINGLE-06` `[vendor]` `[browser]` —
  **Calendar should apply programmatic selected-value changes without a
  callback or unnecessary focus move.** While focus is on an external button,
  rerender April `value` from the 10th to the visible 12th and then null; repeat
  while another visible day has grid focus. Assert selected attributes follow
  each prop and `onChange` stays empty, external focus is never stolen, and an
  existing focused day remains focused rather than jumping merely because the
  selected value changed. This adapts react-day-picker's “does not move focus”
  controlled rerender case.
- [x] `CA-SINGLE-07` `[reference]` `[browser]` —
  **Calendar should request an outside day's month before requesting that date
  in single mode.** In a September grid, primary-click enabled padded
  `2024-10-01` while logging navigation-part/day handlers,
  `onMonthChange`, and `onChange`, then accept both controlled updates. Assert
  the public callback order is `onMonthChange("2024-10")` followed by
  `onChange("2024-10-01")`, each exactly once after uncanceled consumer
  handlers, with no October selection shown before value acceptance and target
  focus preserved after month acceptance; consumers can update month before
  rendering selection.

### Range selection and preview

- [x] `CA-RANGE-01` `[convergence]` `[browser]` —
  **Calendar should request a controlled pending range on the first enabled
  activation.** Render `mode="range" value={null}`, activate
  `2024-04-10`, inspect before acceptance, then rerender with
  `{start:"2024-04-10",end:null}`. Assert one `onChange` request with that
  exact object, no optimistic selection before acceptance, and afterward only
  the start gridcell is selected with `data-range-start` and no range end.
  This follows react-day-picker's application-visible first range stage while
  keeping hover preview internal.
- [x] `CA-RANGE-02` `[vendor]` `[browser]` —
  **Calendar should preview a pending range from its controlled start to the
  hovered or focused enabled day without requesting state.** With accepted
  pending start April 10, hover April 15, then clear hover and keyboard-focus
  April 13. Assert each current candidate alone has `data-range-end`,
  inclusive dates receive `data-in-range` in chronological order, only April
  10 remains `aria-selected="true"`, and `onChange` stays empty. This
  re-hosts React Aria highlighted-range behavior and react-day-picker's range
  modifier model without making preview application state.
- [x] `CA-RANGE-03` `[reference]` `[browser]` —
  **Calendar should clear only transient range preview when pointer leaves
  without a completion or Tab-away command.** Start from controlled
  `{start:"2024-04-10",end:null}`, preview through April 15, then move the
  pointer beyond Calendar while grid focus remains on its current day. Assert
  preview end and preview-only `data-in-range` attributes disappear, April 10
  stays selected and `data-range-start`, the controlled value is unchanged,
  and no callback fires; ordinary pointer exploration must not clear or
  complete a pending application range.
- [x] `CA-RANGE-04` `[vendor]` `[browser]` —
  **Calendar should request and render an inclusive chronological range when a
  later enabled day completes a pending start.** With controlled pending start
  April 10, activate April 15 and then accept the emitted object. Assert one
  request `{start:"2024-04-10",end:"2024-04-15"}`, start/end attributes on
  their exact endpoints, `data-in-range` and `aria-selected="true"` on every
  date from the 10th through 15th inclusive, and no preview residue. This
  ports react-day-picker `addToRange.test.ts` / “add a date to an incomplete
  range with later date.”
- [x] `CA-RANGE-05` `[convergence]` `[browser]` —
  **Calendar should normalize a completion before the pending start into
  chronological endpoints.** With pending start April 15, preview and activate
  April 10, then accept the request. Assert the callback object is
  `{start:"2024-04-10",end:"2024-04-15"}`, data/ARIA run from earlier to
  later with no reverse marker, and the original anchor does not remain
  mislabeled as start. This follows react-day-picker `addToRange.test.ts` /
  “add a date to an incomplete range with earlier date.”
- [x] `CA-RANGE-06` `[reference]` `[browser]` —
  **Calendar should complete a one-day range when its pending start is
  activated again.** Render pending April 10, activate April 10 by pointer and
  keyboard in reset fixtures, and accept the emitted value. Assert one request
  `{start:"2024-04-10",end:"2024-04-10"}` and that the sole date has both
  `data-range-start` and `data-range-end`, is in-range/selected once, and no
  neighboring cell is marked; equal endpoints are a valid completed range.
- [x] `CA-RANGE-07` `[reference]` `[browser]` —
  **Calendar should reject a disabled endpoint or any completion that crosses
  an unavailable date while retaining the pending start.** With pending April
  10 and April 12 unavailable, attempt the disabled 12th and the enabled 15th
  by pointer/keyboard, where the latter span crosses the 12th. Assert no
  completed `onChange`, April 10 remains the sole selected range start, no
  invalid inclusive range is painted, and focus may move only to enabled
  candidates; this deliberately keeps the anchor instead of react-day-picker
  `useRange.test.tsx` / “exclude disabled dates when selecting range,” which
  resets to the endpoint.
- [x] `CA-RANGE-08` `[reference]` `[browser]` —
  **Calendar should apply bounds and outside-month navigation to range preview
  and completion exactly as it does to single dates.** Use pending September
  28 with `min="2024-09-05"`, `max="2024-10-03"`, preview blocked and allowed
  endpoints, then activate enabled padded October 1 and accept both updates.
  Assert out-of-bounds dates cannot preview or complete, the allowed preview is
  inclusive, and outside activation orders
  `onMonthChange("2024-10")` before
  `onChange({start:"2024-09-28",end:"2024-10-01"})`, exactly once each;
  range mode cannot bypass date constraints or controlled month authority.
- [x] `CA-RANGE-09` `[vendor]` `[browser]` —
  **Calendar should derive all range styling from programmatic controlled
  complete, pending, and null values without emitting callbacks.** Without
  user input, rerender null to valid completed April 10–15, to pending April
  20, and back to null while pointer and focus are outside the grid. Assert
  endpoint, inclusive in-range, selected ARIA, and preview-anchor state match
  each supplied value, old attributes clear atomically, and both change logs
  remain empty. This adapts react-day-picker `useRange.test.tsx` / “uses the
  selected value from props when onSelect is provided.”
- [x] `CA-RANGE-10` `[reference]` `[browser]` —
  **Calendar should start a fresh pending range on the first activation after
  a completed range.** Render completed April 10–15, hover April 20, then
  activate April 18 and accept the request. Assert hover does not mutate or
  request over the completed application value, activation requests only
  `{start:"2024-04-18",end:null}`, and acceptance clears every old range
  endpoint/interior before marking the 18th as the sole selected start; a new
  gesture begins a new state machine.
- [x] `CA-RANGE-11` `[reference]` `[touch]` —
  **Calendar touch range selection should complete through two taps without a
  hover-only preview.** On a touch-capable fixture with null value, tap April
  10, accept the pending range, tap April 15, and accept completion. Assert no
  pointer-hover preview attributes appear between taps, callbacks request
  pending then completed objects exactly once, focus behavior remains usable,
  and final inclusive range attributes match mouse/keyboard output; touch must
  not depend on hover.
- [x] `CA-RANGE-12` `[reference]` `[browser]` —
  **Calendar should derive range selection and preview solely from the exact
  controlled value when either request stage is rejected.** Reject a first
  activation while `value=null`, then in a reset fixture keep accepted pending
  April 10 while rejecting completion at April 15. Assert the null fixture
  gains no anchor or preview despite its request, the pending fixture retains
  only April 10 as selected and may preview from that same controlled anchor,
  and neither rejected object changes endpoint/in-range state; request history
  is not hidden range state.
- [x] `CA-RANGE-13` `[reference]` `[browser]` —
  **Calendar should expose a preview crossing an unavailable date as invalid
  without painting a continuous range or emitting a change.** With pending
  April 10 and unavailable April 12, hover and focus enabled April 15 before
  attempting completion. Assert April 12 retains disabled state, the candidate
  is observably rejected by the absence of a valid preview-end marker,
  `data-in-range` is not painted through or beyond the blocked date, April 10
  remains the only selected start, and `onChange` is empty; invalid preview
  feedback cannot imply a selectable contiguous range.
- [x] `CA-RANGE-14` `[vendor]` `[browser]` —
  **Calendar should request completion of a valid pending preview when Tab
  leaves the grid.**
  With controlled start April 10, keyboard-focus or pointer-preview April 15,
  press Tab from the current day, and accept the range request; repeat with an
  unavailable date between the endpoints and with a rejected parent request.
  Assert the valid path requests
  `{start:"2024-04-10",end:"2024-04-15"}` once before native focus settles on
  the next control, does not prevent Tab, and renders the completed inclusive
  range only after acceptance. The invalid path emits no completion, while the
  rejected path clears transient preview on blur but retains the controlled
  pending start. This adapts React Spectrum
  `RangeCalendar.shadow.test.tsx` “commit the selection when tabbing away mid
  selection” to Reference UI's application-visible pending value.
- [x] `CA-RANGE-15` `[vendor]` `[browser]` —
  **Calendar should navigate months without completing a pending range
  preview.**
  Render pending April 10 with a valid April 15 preview, click Next and
  Previous in separate fixtures, and accept the month request. Assert only one
  `onMonthChange` for the adjacent ISO month, no completed `onChange`, no
  conversion of preview into selected state, and the exact controlled pending
  value remains the range anchor if its date is later rendered again. This
  ports React Spectrum `RangeCalendar.shadow.test.tsx` “should not commit the
  selection when pressing the month navigation buttons.”
- [x] `CA-RANGE-16` `[reference]` `[browser]` —
  **Calendar should keep a pending range intact while month/year view
  navigation runs.**
  Render pending April 10 with a valid April 15 preview, click Month,
  choose June, wait for the accepted month, then click Year and choose
  2025. Assert `onMonthChange` for June then 2025, `data-view` returns to
  `day` after each accepted month, the controlled pending
  `{ start: "2024-04-10", end: null }`
  is unchanged, preview is not committed, and the 2025 June day view can
  still complete from that same start.

### Month and year views

- [x] `CA-VIEW-01` `[reference]` `[browser]` —
  **Calendar should be a complete control with internal day view when
  children are omitted.**
  Mount day-mode April 2024 with no children. Assert default
  Header contains Previous, Heading, Month, Year, and Next; day Grid is
  present; Months and Years are absent from the accessibility tree;
  `data-view` is `day`; Month/Year are not pressed; and no public view
  state is required.
- [x] `CA-VIEW-02` `[reference]` `[browser]` —
  **Calendar Month should toggle its private month view.**
  Folded day-mode April 2024, click Month, then click Month again.
  Assert `data-view` becomes `month` then `day` immediately, Months then
  Grid are the sole collection in the accessibility tree, Year is not
  pressed, and `onChange` / `onMonthChange` stay empty. Assert the
  consumer `onClick` runs first and `preventDefault()` cancels the private
  toggle without introducing a view callback.
- [x] `CA-VIEW-03` `[reference]` `[browser]` —
  **Calendar Year should toggle its private year view.**
  Repeat `CA-VIEW-02` with Year. Assert `"year"` then `"day"`, Month is
  not pressed, and day-grid keyboard is not active while year view is
  shown.
- [x] `CA-VIEW-04` `[reference]` `[browser]` —
  **Calendar Months should render twelve locale-labelled cells for the
  controlled year with min/max disabling whole months.**
  Folded `month="2024-04"` `value={null}` `locale="en-GB"` with
  `min="2024-03-15"` `max="2024-10-02"`, click Month (internal view). Assert twelve
  MonthCell buttons, short locale names January–December, March and
  October enabled (partial months), January/February/November/December
  disabled, April has `data-current`, and no `role="grid"` day table is
  in the accessibility tree.
- [x] `CA-VIEW-05` `[reference]` `[browser]` —
  **Calendar should treat an enabled month cell as navigation, not
  selection, and return to day view only after `month` is accepted.**
  Folded April 2024, `value="2024-04-10"`, internal month view, activate
  June, leave `month` unchanged, then accept `"2024-06"`. Assert one
  `onMonthChange("2024-06")`, `onChange` empty,
  `data-view` stays `month` until the prop updates, then `day` with the
  June grid and April 10 still the controlled value. Disabled January
  emits nothing. Calendar never asks the application to synchronize its
  private view.
- [x] `CA-VIEW-06` `[reference]` `[browser]` —
  **Calendar Years should list a clamped twenty-one-year window when
  bounds are omitted, and min-through-max years when bounds exist.**
  Unbounded folded `month="2024-04"` `value={null}`, click Year: assert years
  `2014`–`2034` inclusive (ten either side of 2024). `month="0001-01"`:
  start at `0001`. `month="9999-12"`: end at `9999`. Bounded
  `min="1990-06-01"` `max="1995-01-31"`: assert years 1990–1995 only,
  2024 absent, and the current in-range year scrolled into view. Each
  YearCell shows a four-digit year.
- [x] `CA-VIEW-07` `[reference]` `[browser]` —
  **Calendar should treat an enabled year cell as navigation that
  preserves the month number.**
  Folded `month="2024-04"` `value="2024-04-10"`, internal year view,
  activate 2020, then accept `"2020-04"`. Assert `onMonthChange("2020-04")`,
  `data-view="day"` only after acceptance. Repeat
  with `month="2024-02"` toward year `2023` so the result stays
  `"2023-02"`. A year wholly outside min/max stays disabled and silent.
- [x] `CA-VIEW-08` `[reference]` `[browser]` —
  **Calendar Previous and Next should be native-disabled in month and
  year view and must not complete a range preview.**
  Pending range with April 15 preview, click Month, then Year. Assert
  Previous/Next `disabled` / `aria-disabled`, clicks emit neither
  `onMonthChange` nor `onChange`, and the pending start remains.
  Returning to day view re-enables directions that have an enabled
  target month per `CA-MONTH-04`.
- [x] `CA-VIEW-09` `[reference]` `[browser]` —
  **Calendar month and year cells should paint range start, end, and
  in-range from the controlled value without preview.**
  Completed `{ start: "2024-03-20", end: "2024-06-02" }` in month view
  for 2024: March has `data-range-start`, June `data-range-end`,
  April/May `data-in-range`, inclusive selected markers, no preview.
  Year view of a 2023–2025 range marks those years the same way.
  Hovering a month cell does not invent day-grid preview attributes.
- [x] `CA-VIEW-10` `[reference]` `[browser]` —
  **Calendar month and year grids should move focus in a three-column
  field without selecting.**
  In month view, focus April, ArrowRight/Left/Down/Up. Assert focus
  visits May, March, July, January (or the documented in-grid
  equivalent), Tab has one tab stop, Enter/Space on June follows
  `CA-VIEW-05`, and `onChange` stays empty. Repeat a shorter vector on
  Years. RTL reverses only horizontal arrows.
- [x] `CA-VIEW-11` `[reference]` `[browser]` —
  **Calendar should announce view and month through Heading without a
  global announcer.**
  Folded day April 2024, click Month, activate June, accept the month.
  Assert one Heading node keeps `aria-live="polite"` `aria-atomic`,
  each accepted view/month produces one locale text mutation (year
  while in month view, June 2024 in day view), when the day Grid is
  shown its `aria-labelledby` still points at Heading, and Month/Year
  accessible names remain the locale month and year.
- [x] `CA-VIEW-12` `[reference]` `[browser]` —
  **Calendar should reset its private view to the home collection when
  mode changes.**
  Author Grid, Months, and Years as siblings. Start in day mode, enter
  month view, then rerender with compatible month, year, and range modes
  and values while focus stays outside. Assert `data-mode` follows each
  prop, `data-view` resets to `month`, `year`, and `day` respectively,
  exactly one collection is in the accessibility tree, `onChange` stays
  empty, and external focus is not stolen. No public `view` prop or
  application ternary is involved.
- [x] `CA-VIEW-13` `[reference]` `[browser]` —
  **Calendar should replace only authored default parts and keep view
  ownership.**
  Author a custom Days renderer inside Grid and omit Header, Months, and
  Years. Assert default Month/Year header remains, custom day content
  renders in day view, clicking Month still presents default Months,
  and `data-view` is internal. A second fixture that authors Heading
  without Month/Year has no drill-down buttons and stays in day view.

### Modes

- [x] `CA-MODE-01` `[reference]` `[browser]` —
  **Calendar should treat omitted mode as a day picker.**
  Folded Calendar with `value={null}`, omit `mode`, and select 10 April
  2024. Assert `onChange("2024-04-10")`, `data-mode="day"`, day Grid is
  the home view, and Month-cell activation is navigation only.
- [x] `CA-MODE-02` `[reference]` `[browser]` —
  **Calendar should publish `YYYY-MM` in month mode.**
  Folded `mode="month"` `month="2024-04"` `value={null}`. Assert
  `data-view` starts at `month`, no day Grid is in the accessibility tree,
  activating June requests `onChange("2024-06")` and not a day, and
  clicking Year then 2020 is navigation: `onMonthChange("2020-04")`,
  `onChange` empty, then month view of 2020.
- [x] `CA-MODE-03` `[reference]` `[browser]` —
  **Calendar should publish `YYYY` in year mode.**
  Folded `mode="year"` `month="2024-04"` `value={null}`. Assert
  `data-view` starts at `year`, no day or month grid is in the
  accessibility tree, activating 2020 requests `onChange("2020")`, and
  Month/Year header buttons do not reveal a day table.
- [x] `CA-MODE-04` `[reference]` `[unit]` —
  **Calendar should expose one discriminant rather than a mode
  cross-product.**
  Type-check each mode with its exact value/callback pair, then bypass
  types with month-range, year-range, and the former simultaneous
  `selection`/`precision` props. Assert those shapes are absent from the
  public type, invalid runtime shapes fail through `CA-ISO-07`, and
  Calendar never guesses a value unit.
- [x] `CA-MODE-05` `[reference]` `[browser]` —
  **Calendar `isDateUnavailable` should block a month or year only when
  every day of that unit is unavailable.**
  `mode="month"` with weekends unavailable: June 2024 stays enabled.
  Mark every day of June 2024 unavailable: June is disabled and silent.
  Repeat a fully unavailable year in `mode="year"`.

### Explicit application chrome and ISO utilities

- [x] `CA-CHROME-01` `[reference]` `[browser]` —
  **Application presets should update controlled state without an
  imperative Calendar request channel.**
  Put preset Buttons beside folded range Calendars: one uses the direct
  application setter and one uses `DateField.Range` commit. Activate a complete
  April 10–16 preset, accept that state, and assert inclusive range attributes
  update with no pending stage or extra Calendar callback. Calendar exposes
  no `useCalendar` / `requestChange` API; `DateField.Range` coordinates externally.
- [x] `CA-CHROME-02` `[reference]` `[browser]` —
  **Extra application chrome should not replace default anatomy.**
  Give a folded day Calendar a sibling recents Button with explicit
  `value`/`onSelect` props. Have it update selection and month through
  the same application callbacks used by Calendar. Assert default Header
  and Grid remain, January becomes selected and visible after acceptance,
  and no implicit parent context or Presets part is required.
- [x] `CA-UTIL-01` `[reference]` `[unit]` —
  **Public ISO helpers should match the Calendar arithmetic gate.**
  `addCalendarDays("2024-02-28", 1)` is `"2024-02-29"`; `addCalendarMonths(
  "2024-01-31", 1)` is `"2024-02-29"` and
  `addCalendarMonths("2024-01", 1)` is `"2024-02"`; `startOfCalendarMonth` /
  `endOfCalendarYear` round-trip canonical bounds; `calendarMonth("2024-09-18")`
  is `"2024-09"`, `calendarMonth("2024-09")` is `"2024-09"`, and
  `calendarMonth("2024")` is `"2024-01"`; invalid strings throw
  the same descriptive failure as `CA-ISO-01`. No helper accepts `Date`.

### Dynamic and environment behavior

- [x] `CA-DYNAMIC-01` `[reference]` `[browser]` —
  **Calendar should diagnose a runtime mode change whose controlled value
  has the old shape.** Rerender day mode with `value="2024-04-10"`
  directly to range mode with that string, and range mode with an object
  directly to month mode in a reset fixture. Assert one
  descriptive development diagnostic names mode and value shape, no
  reinterpretation, selection request, month request, or partially mixed
  attributes occur, and valid rendering resumes only after the parent supplies
  a compatible value; runtime control must honor the public union.
- [x] `CA-DYNAMIC-02` `[vendor]` `[browser]` —
  **Calendar should relocate its sole day tab stop when live constraints
  disable the focused date without changing controlled selection.** Focus
  April 10, then change min, max, and availability in separate fixtures so it
  becomes disabled and April 11 is the unique nearest enabled date. Assert
  April 11 receives sole `tabIndex=0` and DOM focus when focus was in the
  grid, April 10 retains controlled selected state if selected but cannot
  activate, and no callback runs. This adapts react-day-picker's controlled
  focus-removal regression to constraint updates.
- [x] `CA-DYNAMIC-03` `[reference]` `[browser]` —
  **Calendar should commit simultaneous locale, direction, month, and value
  updates as one coherent focus and announcement state.** While a September
  day has grid focus, rerender `en-US`/LTR/September/single into
  `ar-AE`/RTL/October/a compatible October value; repeat while focus is on an
  external button. Assert one October grid uses the new locale, week order,
  direction, labels, value, and sole tab target with one Heading mutation,
  stale September focus never returns, grid-owned focus moves to the preferred
  valid October day, external focus is not stolen, and no request callback
  fires; this includes react-day-picker's focused-versus-external controlled
  month behavior.
- [x] `CA-ENV-01` `[reference]` `[ssr]` —
  **Calendar should hydrate a fully explicit date grid without timezone,
  locale, identity, or today drift.** Server-render explicit
  `month="2024-02"`, `locale="en-GB"`, `today="2024-02-15"`, controlled
  value, bounds, and authored IDs, then hydrate under a client timezone on the
  opposite side of UTC midnight. Assert byte-equivalent initial structure,
  labels, selected/today state, generated relationships, and day IDs with no
  hydration warning or callback; explicit calendar dates must be
  environment-independent.
- [x] `CA-ENV-02` `[reference]` `[react:all]` —
  **Calendar should register dates and emit navigation, selection, and
  announcements once across supported React versions and StrictMode replay.**
  In React 17, 18, and 19 fixtures, mount a fixed grid, perform one accepted
  Next request and one accepted day activation, and inspect ref/observer
  cleanup. Assert one current cell per ISO date, one month request, one
  selection request, one accepted-month Heading mutation, stable surviving
  nodes, and version-appropriate cleanup only on removal; effect replay must
  not duplicate observable behavior.
- [x] `CA-ENV-03` `[reference]` `[shadow]` —
  **Calendar should preserve focus, labels, announcements, and range preview
  inside an open ShadowRoot.** Mount a controlled range Calendar in a
  ShadowRoot, Tab into its grid, move across a month boundary, hover a pending
  range endpoint, and accept the month. Assert active-element resolution
  through the shadow root, unique local ARIA relationships, full accessible
  labels, one live Heading mutation, and preview attributes all work without
  document-global selectors or IDs; the component must use its owner root.
- [x] `CA-ENV-04` `[reference]` `[browser:all]` —
  **Calendar should produce the same public date behavior in Chromium,
  Firefox, and WebKit.** In each engine run the `en-GB` grid shape, bounded
  arrow/Page movement, outside-month callback ordering, single activation,
  pending/completed range with unavailable crossing, and live month update.
  Assert identical canonical callback logs, selected/range/disabled states,
  focus targets, and one announcement despite engine-specific layout and
  `Intl` text details; cross-browser proof protects native table/button and
  event differences.
- [x] `CA-A11Y-01` `[reference]` `[browser]` —
  **Calendar should remain accessibility-clean across locale, direction,
  outside-day, constraint, and range states.** Run the configured accessibility
  checker after settling non-Sunday `en-GB`, RTL `ar-AE`, padded enabled days,
  min/max/unavailable dates, single selection, and pending and complete ranges.
  Assert no violations plus one named grid, valid table ancestry, unique
  relationships, one day tab stop when available, correct current/selected/
  disabled ARIA, and reachable navigation controls; automated checks supplement
  rather than replace the behavioral assertions.

## Composition gates

- [x] `CA-COMP-01` `[reference]` `[browser]` —
  **A bounded single-value Calendar should support unavailable weekends without
  losing controlled month or keyboard behavior.** Build an `en-GB` appointment
  calendar with an explicit month, selected weekday, min/max inside adjacent
  months, and Saturday/Sunday unavailable, then exercise native Tab, arrows,
  Page keys, navigation buttons, and selection. Assert weekend/bound dates are
  skipped, outside weekdays order month before value callbacks, parent
  rejection is visible, and selected/today/focus states remain distinct; this
  proves the practical single-date composition.
- [x] `CA-COMP-02` `[reference]` `[touch]` —
  **A date-range Calendar should preview and complete only contiguous available
  ranges across a controlled month boundary.** Build a pending range near
  month end with one unavailable middle date through `<DateField.Range>`,
  test mouse/focus preview, touch taps, blocked completion, an allowed padded
  endpoint, and a fresh range after completion. Assert invalid spans never
  paint through the blocked day or emit completion, allowed outside completion
  orders month before draft callbacks, durable value stays silent until Apply,
  and all endpoint/inclusive selected attributes derive from accepted draft;
  repeat direct wiring to prove the controller does not alter the grid machine.
- [x] `CA-COMP-03` `[reference]` `[browser]` `[rtl]` —
  **Calendar should keep month control independent from selection across
  non-Sunday and RTL locale presentations.** Build an `en-GB` Monday-first
  calendar, rerender the same controlled ISO month/value under an RTL
  Saturday-first locale, then change month without changing selection and
  selection without changing month. Assert week padding, labels, spatial
  arrows, and navigation names follow locale/direction, only accepted month
  commits announce, ISO callbacks stay chronological, and neither controlled
  prop implicitly rewrites the other; this proves both required locale
  compositions.
- [x] `CA-COMP-04` `[reference]` `[browser]` —
  **Calendar should support a custom booking and event-day presentation through
  its public Days renderer.** Build a controlled booking calendar whose
  matching `Calendar.Day` children show `formattedDay`, an `aria-hidden` event
  dot, and availability text from an ISO-keyed map, use render state for
  selected/range styling, and retain a ref to the focused event date. Assert
  sold-out dates remain authoritatively disabled, managed full-date labels and
  Tab behavior survive custom content, event/native/StyleProps update with
  locale and month, and an enabled outside event date orders its Day handler,
  `onMonthChange`, and `onChange` exactly once; this proves product-specific
  day rendering without replacing generated grid rows or cells.
- [x] `CA-COMP-05` `[reference]` `[browser]` —
  **Calendar should serve DateField as a folded grid with progressive disclosure.**
  Build DateField in `en-GB` through `<DateField value={value} onChange={setValue} locale="en-GB"><DateField.Picker /></DateField>`
  with selected September value and omitted `month`. Open via `Alt + ArrowDown`,
  click Year, pick another year, pick a month, select a day. Assert Calendar
  receives its managed props (`mode="day"`, `value`, `onChange`, `locale`),
  September is visible without ISO slicing, `data-view` returns to `day`,
  DateField reformats after the day request, Popover dismisses on day selection,
  and slotted Calendar customization works seamlessly.

- [x] `CA-COMP-06` `[reference]` `[browser]` —
  **Calendar should express a month picker and a recents list without a
  DateField or a Presets part.**
  Folded `mode="month"` beside a child that offers “This month” and
  “Last month” through explicit application props plus
  `addCalendarMonths`. Activate a preset, then pick a different month on
  the grid. Assert values stay `YYYY-MM`, view never shows a day table,
  and no DateField, Calendar context hook, or `Calendar.Preset` exists.

## Owned elsewhere

- Generic roving focus ideas are shared, but Calendar's date-aware 2D movement
  remains here.
- DateField / DateField.Range field parsing/formatting: `DateField`. Popup
  positioning: `DateField.Picker`. Connected start/end bezel: `Field`
  surface recipe. Apply/Cancel snapshots: `DateField.Range` transaction.
  Preset *labels* and recents data: the application; explicit callbacks
  remain the request seam.

## Out of scope

- Typed input parsing: `DateField`. Time/timezone values, non-Gregorian
  calendars, multi-month views, week numbers, a `Calendar.Preset` part,
  DateField month/year grammar, form serialization, drag/Shift-extended
  range selection, packaged visual DateInput/DateRange, and third-party
  public date objects. Calendar month/year modes and heading month/year
  navigation are in scope (`CA-MODE-*`, `CA-VIEW-*`); month-range and
  year-range modes, public view control, and an imperative Calendar hook
  are not.
  React Spectrum `RangeCalendar.shadow.test.tsx` pointer-capture, release-
  outside, and release-across-shadow cases are deliberately classified here
  because this contract uses two explicit activations rather than a drag range
  gesture.
- Replacing generated `tr`/`td` elements or targeting them with per-cell props;
  date-level children, native props, StyleProps, events, and refs belong on the
  public `Calendar.Day` returned by `Calendar.Days`. Month and year cells use
  `Calendar.MonthCell` / `Calendar.YearCell` the same way.
