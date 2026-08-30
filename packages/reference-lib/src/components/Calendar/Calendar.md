# Calendar

Proof: [TESTS.md](./TESTS.md).

Date-grid engine. Locale-aware week start and weekday headings, padded month grids, 2D keyboard movement, disabled/unavailable skipping, min/max clamping, today vs selected vs focused, range selection. Values are ISO calendar dates (`YYYY-MM-DD`), not `Date` objects and not a third-party date library. Locale is an explicit prop; `Intl` supplies labels and week-start. Does not parse typed input, format field values, or own time-of-day.

DatePicker / DateRangePicker are input + Popover + Calendar. Parsing and display formatting stay in application code.

```tsx
<Calendar
  month={month}
  onMonthChange={setMonth}
  value={value}
  onChange={setValue}
  locale="en-GB"
  min={min}
  max={max}
>
  <Calendar.Header>
    <Calendar.Previous />
    <Calendar.Heading />
    <Calendar.Next />
  </Calendar.Header>

  <Calendar.Grid>
    <Calendar.Weekdays />
    <Calendar.Days />
  </Calendar.Grid>
</Calendar>
```

Range selection uses `selection="range"` and `{ start, end }`. Hovering or
focusing a day while a start date is set previews the in-range interval; that
preview is not application state. A valid preview is requested as the completed
range when Tab leaves the grid. Month navigation never commits it.

## Proposed API

```ts
type ISODate = `${number}-${number}-${number}`
type ISOMonth = `${number}-${number}`
type CalendarWeekday =
  | "sun"
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"

type CalendarValue =
  | ISODate
  | { start: ISODate; end: ISODate | null }

interface CalendarProps
  extends Omit<ReferencePartProps<"div">, "onChange"> {
  month: ISOMonth
  onMonthChange?: (month: ISOMonth) => void
  selection?: "single" | "range"
  value?: CalendarValue | null
  onChange?: (value: CalendarValue | null) => void
  locale: string
  firstDayOfWeek?: CalendarWeekday
  today?: ISODate
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
}

interface CalendarHeaderProps
  extends ReferencePartProps<"div"> {}

interface CalendarHeadingProps
  extends ReferencePartProps<"div"> {}

interface CalendarNavigationProps
  extends ReferencePartProps<"button"> {}

interface CalendarGridProps
  extends ReferencePartProps<"table"> {}

interface CalendarWeekdaysProps
  extends ReferencePartProps<"thead"> {
  weekdayStyle?: "narrow" | "short" | "long"
}

interface CalendarDaysProps
  extends Omit<ReferencePartProps<"tbody">, "children"> {
  children?: (day: CalendarDayRenderState) => React.ReactElement
}

interface CalendarDayRenderState {
  date: ISODate
  formattedDay: string
  outsideMonth: boolean
  today: boolean
  selected: boolean
  disabled: boolean
  rangeStart: boolean
  rangeEnd: boolean
  inRange: boolean
  preview: boolean
}

interface CalendarDayProps
  extends ReferencePartProps<"button"> {
  date: ISODate
}
```

Runtime values are canonical zero-padded `YYYY-MM-DD` / `YYYY-MM` in years
0001–9999. Omitted selection/value means controlled single/null. `today` may be
supplied for deterministic SSR; when omitted, the server and first hydration
render no today marker and the client-local marker is added after mount.
Omitted min/max/availability leaves every valid date in that domain available.
Locale determines week start unless `firstDayOfWeek` explicitly overrides it;
Weekdays defaults to short visible labels and accepts narrow/short/long while
retaining unambiguous full accessible names.

`Calendar` renders `div`. Header/Heading render `div`; Previous/Next render
`button[type=button]`; Grid renders `table[role=grid]`; Weekdays renders
`thead` containing one row of generated `th`; Days renders `tbody` containing
generated rows and one `td[role=gridcell] > Calendar.Day` per date.

With no child renderer, Days supplies each Day's locale-formatted day number.
For custom content, its function receives complete public state and returns one
`<Calendar.Day date={day.date}>…</Calendar.Day>`. Day is the fixed native
button part and accepts native props, StyleProps, children, events, and refs.
Calendar remains authoritative for its accessible date label, disabled and
selected ARIA/data, tabIndex, grid linkage, and selection/navigation default.
Generated `tr`/`td` elements remain fixed semantic output rather than
undocumented prop targets.

```tsx
<Calendar.Days>
  {(day) => (
    <Calendar.Day
      date={day.date}
      fontWeight={day.selected ? "700" : "400"}
    >
      <Span>{day.formattedDay}</Span>
      {eventsByDate[day.date] ? <Span aria-hidden>•</Span> : null}
    </Calendar.Day>
  )}
</Calendar.Days>
```

Cells expose `data-today`, `data-selected`, `data-disabled`, `data-outside-month`, and for ranges `data-range-start`, `data-range-end`, `data-in-range`.

Keyboard movement and selection do not require those attributes to be set by the application. Heading announces when the month changes.

---

## Problems we own

This is genuinely hard. We do not take a `Date` library; we re-host vendor grid/keyboard math on ISO strings.

### Week start ≠ Sunday

The locale's CLDR week start is authoritative unless `firstDayOfWeek`
explicitly overrides it. `en-GB` and another non-Sunday locale are required
regressions; hardcoding Sunday is the usual US-centric bug.

**Vendor.** `@internationalized/date` `weekStartData.ts` / `startOfWeek(locale)` (CLDR; some Sunday locales omitted and default Sun — know that compression). react-day-picker `weekStartsOn` / locale / `ISOWeek`.

**Lift** week-start tables + tests. **Leave** Aria `CalendarDate` objects and DayPicker extra calendars (buddhist, hijri, …) unless we explicitly take non-Gregorian.

### ISO strings, not `Date`

Aria uses `CalendarDate`. DayPicker uses `Date` plus `day.isoDate` data attrs. Public API is `YYYY-MM-DD`. Time-of-day is outside this primitive.

**Lift** grid construction and 2D keyboard; **re-host** on ISO.

### Range hover preview is not application state

The first enabled activation requests controlled
`{ start: date, end: null }`. While that start is controlled, hover/focus
previews an available interval without another callback. The second enabled
activation requests the completed normalized range; crossing an unavailable
date is rejected and retains the pending start. Tab away also requests the
current valid preview before allowing native focus traversal; a rejected
request leaves the controlled pending value intact. Clicking Previous or Next
requests only the visible month and never turns a preview into selection.

**Lift** Aria highlight/anchor. Do not make the application store hover preview.

### 2D keyboard + unavailable skip

Day, week, Home/End, PageUp/PageDown for months. Skip disabled/unavailable. Min/max clamp.

**Vendor.** Aria `useCalendarGrid`. DayPicker `getNextFocus`.

**Lift** Aria keyboard. Outside-month padding from either grid builder.

### Today vs selected vs focused

Three different states. Cells expose `data-*`; keyboard focus is independent of selection (especially in range mode).

---

## Convergence

**Behaviour:** react-aria calendar + `@internationalized` week start. **Grid/modifiers:** react-day-picker as contrast (`isoDate`, range class names). Public values stay ISO strings. One freeze composition is a non-Sunday week; one is a range picker.
