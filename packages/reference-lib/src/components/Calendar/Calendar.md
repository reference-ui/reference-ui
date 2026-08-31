# Calendar

Proof: [TESTS.md](./TESTS.md).

Date-grid engine. Locale-aware week start and weekday headings, padded month
grids, 2D keyboard movement, disabled/unavailable skipping, min/max clamping,
today vs selected vs focused, range selection, and heading-driven month/year
navigation. Values are canonical ISO calendar strings: `YYYY-MM-DD` in
day/range mode, `YYYY-MM` in month mode, and `YYYY` in year mode — never
`Date` objects or third-party date-library values. Locale is explicit;
`Intl` supplies labels and week-start. Calendar does not parse typed input,
format field values, or own time-of-day. Typed dates are `DateField`.

The products people ship are four modes of this one control:

- **Date** — folded Calendar, `mode="day"` (omitted).
- **Date range** — `mode="range"`.
- **Month picker** — `mode="month"`, value is `YYYY-MM`.
- **Year picker** — `mode="year"`, value is `YYYY`.

Typed day text is `DateField`. DateField folds standard date pickers through
`<DateField><DateField.Picker /></DateField>` and range pickers through
`<DateField.Range><DateField.Picker /></DateField.Range>`. Calendar provides
the underlying date-grid engine. Presets and recents are application controls
that write through the state setter passed to DateField/Calendar. They are not
Calendar parts or context commands.

View is Calendar's private interaction state, like range preview: the
application does not branch on `day` / `month` / `year`. Omitted `month`
means Calendar owns the pane unless the product needs it independent of
`value`. Omitted children are a complete control — default Header with
Month/Year drill-down, and Calendar presents the matching collection
itself.

```tsx
<Calendar
  value={value}
  onChange={setValue}
  locale="en-GB"
  min={min}
  max={max}
/>
```

```tsx
<Calendar
  mode="range"
  value={range}
  onChange={setRange}
  locale="en-GB"
/>
```

```tsx
<Calendar
  mode="month"
  value={billingMonth}
  onChange={setBillingMonth}
  locale="en-GB"
/>
```

```tsx
<Calendar
  mode="year"
  value={year}
  onChange={setYear}
  locale="en-GB"
/>
```

Omitted `month` is the DateInput default: Calendar owns the pane, seeded
from `value`. Supply `month` when the pane must stay independent of
selection — DateRange focusing start vs end, a URL, two grids.

```tsx
<Calendar
  month={month}
  onMonthChange={setMonth}
  value={value}
  onChange={setValue}
  locale="en-GB"
/>
```

High specificity replaces default parts. Author Grid, Months, and Years as
siblings; Calendar still shows exactly one. There is no
`{view === "day" ? …}`. A side list is just another child with an explicit
application callback:

```tsx
<Calendar
  mode="range"
  value={range}
  onChange={setRange}
  locale="en-GB"
  today="2024-04-15"
  display="flex"
  gap="2r"
>
  <Recents today="2024-04-15" onSelect={setRange} />
</Calendar>

function Recents({ today, onSelect }) {
  return (
    <Button
      type="button"
      onClick={() =>
        onSelect({
          start: addCalendarDays(today, -6),
          end: today,
        })
      }
    >
      Last 7 days
    </Button>
  )
}
```

Range selection uses `mode="range"` and `{ start, end }`. Hovering or
focusing a day while a start date is set previews the in-range interval; that
preview is not application state. A valid preview is requested as the completed
range when Tab leaves the grid. Month navigation and view changes never commit
it.

## Proposed API

```ts
type ISODate = `${number}-${number}-${number}`
type ISOMonth = `${number}-${number}`
type ISOYear = `${number}`
type CalendarWeekday =
  | "sun"
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
type CalendarMode = "day" | "range" | "month" | "year"
type CalendarDateRange = {
  start: ISODate
  end: ISODate | null
}

interface CalendarSharedProps
  extends Omit<
    ReferencePartProps<"div">,
    "defaultValue" | "onChange"
  > {
  month?: ISOMonth
  onMonthChange?: (month: ISOMonth) => void
  locale: string
  firstDayOfWeek?: CalendarWeekday
  today?: ISODate
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
}

type CalendarProps =
  CalendarSharedProps &
    (
      | {
          mode?: "day"
          value: ISODate | null
          onChange?: (value: ISODate | null) => void
        }
      | {
          mode: "range"
          value: CalendarDateRange | null
          onChange?: (value: CalendarDateRange | null) => void
        }
      | {
          mode: "month"
          value: ISOMonth | null
          onChange?: (value: ISOMonth | null) => void
        }
      | {
          mode: "year"
          value: ISOYear | null
          onChange?: (value: ISOYear | null) => void
        }
    )

declare function addCalendarDays(date: ISODate, days: number): ISODate
declare function addCalendarMonths(date: ISODate, months: number): ISODate
declare function addCalendarMonths(
  month: ISOMonth,
  amount: number,
): ISOMonth
declare function calendarMonth(
  value: ISODate | ISOMonth | ISOYear,
): ISOMonth
declare function startOfCalendarMonth(date: ISODate): ISODate
declare function endOfCalendarMonth(date: ISODate): ISODate
declare function startOfCalendarYear(date: ISODate): ISODate
declare function endOfCalendarYear(date: ISODate): ISODate

interface CalendarHeaderProps
  extends ReferencePartProps<"div"> {}

interface CalendarHeadingProps
  extends ReferencePartProps<"div"> {}

interface CalendarNavigationProps
  extends ReferencePartProps<"button"> {}

interface CalendarMonthProps
  extends ReferencePartProps<"button"> {}

interface CalendarYearProps
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

interface CalendarMonthsProps
  extends Omit<ReferencePartProps<"div">, "children"> {
  children?: (month: CalendarMonthRenderState) => React.ReactElement
}

interface CalendarMonthRenderState {
  month: ISOMonth
  formattedMonth: string
  current: boolean
  selected: boolean
  disabled: boolean
  rangeStart: boolean
  rangeEnd: boolean
  inRange: boolean
}

interface CalendarMonthCellProps
  extends ReferencePartProps<"button"> {
  month: ISOMonth
}

interface CalendarYearsProps
  extends Omit<ReferencePartProps<"div">, "children"> {
  children?: (year: CalendarYearRenderState) => React.ReactElement
}

interface CalendarYearRenderState {
  year: ISOYear
  formattedYear: string
  current: boolean
  selected: boolean
  disabled: boolean
  rangeStart: boolean
  rangeEnd: boolean
  inRange: boolean
}

interface CalendarYearCellProps
  extends ReferencePartProps<"button"> {
  year: ISOYear
}
```

Runtime value follows the one `mode` discriminant. Omitted `"day"` uses
canonical `YYYY-MM-DD`; `"range"` uses
`{ start: ISODate; end: ISODate | null }`; `"month"` uses canonical
`YYYY-MM`; and `"year"` uses canonical `YYYY`. A value whose shape does
not match mode is the `CA-ISO-07` diagnostic, not a coercion. There is no
second `selection × precision` matrix and therefore no month-range or
year-range mode without a product requirement.

`month` remains `YYYY-MM` in every mode: it is the visible pane (day-grid
month, month-grid year, or year-window center), not the selected value.
Omitted `month` means Calendar owns the pane. The seed comes from the
scalar value, range start, `today`, or the mode's null fallback in that
order.
When value is `null` and today is absent, the pane is the client-local month,
committed after mount with the today marker. An always-visible calendar
that must SSR a specific empty pane passes `month` or `today`. DateInput
typically mounts Calendar inside `Popover.Content`, so the first pane is
already client-side. When omitted, a value whose `calendarMonth` is outside
the visible pane updates the internal pane; user navigation does not
rewrite `value`. Supplying `month` makes it controlled: navigation
requests `onMonthChange` and does not commit until the prop updates.
Controlled `month` and `value` stay independent (`CA-MONTH-01`). Omitted
view is always Calendar interaction state. It starts at the mode home:
`day` for day/range, `month` for month, and `year` for year. `today` may
be supplied for deterministic SSR; when omitted, the server and first
hydration render no today marker and the client-local marker is added
after mount. Omitted min/max/availability leaves every valid date in that
domain available; min/max stay ISO dates in every mode, so a month or
year is disabled when every day of that unit is outside the bounds.
Locale determines week start unless `firstDayOfWeek` explicitly overrides
it; Weekdays defaults to short visible labels and accepts
narrow/short/long while retaining unambiguous full accessible names.

`Calendar` renders `div` and exposes `data-mode` plus `data-view` for its
private active view. Header/Heading render `div`; Previous/Next/Month/Year
render `button[type=button]`; Grid renders `table[role=grid]`; Weekdays
renders `thead` containing one row of generated `th`; Days renders `tbody`
containing generated rows and one `td[role=gridcell] > Calendar.Day` per
date. Months renders `div` containing twelve `Calendar.MonthCell` buttons
for the controlled year. Years renders `div` containing one
`Calendar.YearCell` per visible year.

Calendar has variable specificity, same rule as Switch. With no named parts
it renders default Header (`Previous`, `Heading` with `Month` and `Year`,
`Next`) and default Grid, Months, and Years. Authoring a named part replaces
that default. Authoring `Heading` without `Month`/`Year` is a header without
drill-down. Other authored children are ordinary chrome rendered as siblings
of the default anatomy. They receive explicit application props and close
over application state; Calendar exposes no imperative child context.

Calendar presents exactly one collection for the active view. Inactive Grid,
Months, and Years — default or authored — are not shown, not in tab order,
and not in the accessibility tree. The application never switches them with
a `view ===` ternary. Day/range mode never shows a day grid while view is
month or year. Month mode never shows a day grid. Year mode never shows a
day or month grid.

Heading is the polite announcement source and the default accessible name of
the visible collection. Month commits `data-view="month"` immediately, or
the mode home when that view is already active. Year does the same for
`"year"`. Both set `aria-pressed` while active. Previous/Next remain
adjacent-month controls in day view and are native-disabled in month and
year view: they never page those grids or complete a range preview.

In day/range mode, selecting an enabled month or year cell is navigation:
it requests `onMonthChange` when `month` is controlled, or commits the pane
itself when omitted, then returns to day view once the pane is current. It
does not request `onChange`. In month mode, a month cell requests
`onChange(YYYY-MM)` while year cells remain navigation. In year mode, a
year cell requests `onChange(YYYY)`. Range preview and normalization exist
only in range mode.

The `addCalendarDays` / `addCalendarMonths` / `calendarMonth` / `startOf*` /
`endOf*` functions are the public ISO kit behind `CA-ISO-02` / `CA-ISO-03`.
`calendarMonth` maps a day to `YYYY-MM`, a month value to itself, and a
year to `${year}-01`. `addCalendarMonths` preserves a date or month input's
unit. They throw the same descriptive failure as the ISO
gate. They are not a third-party date library and they do not accept `Date`.

Unmounting Calendar (typical closed `Popover.Content`) resets internal view
to the mode home and re-seeds omitted `month` from `value` / `today`.
That is how DateInput opens on the selected day without application
`onOpen` slicing. A kept-mounted Calendar keeps its view and pane; a product
that needs an open-cycle reset remounts it deliberately. `month` remains
the only optional controlled navigation state.

With no child renderer, Days supplies each Day's locale-formatted day number,
Months supplies locale-short month names, and Years supplies the year number.
For custom content, each render function receives complete public state and
returns one matching cell part. Calendar remains authoritative for accessible
name, disabled/selected/range ARIA and data, tabIndex, and activation default.
Generated `tr`/`td` elements remain fixed semantic output rather than
undocumented prop targets.

```tsx
<Calendar
  value={value}
  onChange={setValue}
  locale="en-GB"
>
  <Calendar.Grid>
    <Calendar.Weekdays />
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
  </Calendar.Grid>
</Calendar>
```

Authored Grid replaces the default day table. Default Header, Months, and
Years remain. Calendar still hides Grid while `data-view` is `month` or
`year`.

Day cells expose `data-today`, `data-selected`, `data-disabled`,
`data-outside-month`, and for ranges `data-range-start`, `data-range-end`,
`data-in-range`. Month and year cells expose `data-current`, `data-selected`,
`data-disabled`, and the same range markers against the controlled value's
month or year. Keyboard movement and selection do not require those attributes
to be set by the application. Heading announces when the month or view
changes.

When `min` and `max` are omitted, Years shows twenty-one in-domain years
centered on the controlled month's year (ten on each side, clamped to
0001–9999). When bounds exist, Years lists every year from `min`'s year
through `max`'s year inclusive and scrolls the current year into view. A
month is disabled when every day of that month is outside min/max. A year is
disabled when every day of that year is outside min/max. `isDateUnavailable`
does not disable a whole month or year by itself.

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

Aria uses `CalendarDate`. DayPicker uses `Date` plus `day.isoDate` data attrs.
The design-system Date calendar used `date-fns` `Date` objects. Public API is
canonical ISO in the shape selected by `mode`. Time-of-day is outside this
primitive.

**Lift** grid construction and 2D keyboard; **re-host** on ISO.

### Range hover preview is not application state

The first enabled activation requests controlled
`{ start: date, end: null }`. While that start is controlled, hover/focus
previews an available interval without another callback. The second enabled
activation requests the completed normalized range; crossing an unavailable
date is rejected and retains the pending start. Tab away also requests the
current valid preview before allowing native focus traversal; a rejected
request leaves the controlled pending value intact. Clicking Previous or Next,
or changing `view`, requests only navigation and never turns a preview into
selection.

**Lift** Aria highlight/anchor. Do not make the application store hover preview.

### 2D keyboard + unavailable skip

Day, week, Home/End, PageUp/PageDown for months. Skip disabled/unavailable. Min/max clamp.

**Vendor.** Aria `useCalendarGrid`. DayPicker `getNextFocus`.

**Lift** Aria keyboard. Outside-month padding from either grid builder.

### Today vs selected vs focused

Three different states. Cells expose `data-*`; keyboard focus is independent of selection (especially in range mode).

### Heading month/year navigation is not value granularity

Jumping twelve Next clicks to reach a distant month is the usual calendar
failure. Month and Year header buttons switch Calendar's private **view**;
`mode` fixes the product's value shape and home collection. A month picker
never publishes a day. Typed month/year strings remain DateField leave.

**Vendor.** `vendor/design-system/Date` `mode="day" | "month" | "year"` on
DateInput, DayPicker/MonthPicker/YearPicker, internal view. React Aria
granularity as contrast. Switch variable specificity for default parts.

**Lift** one Calendar with a discriminated four-mode value contract and
internal view. **Leave** the unused month-range/year-range cross-product,
controlled view, `Date` min/max defaults of ±100 years from `new Date()`,
DateField month/year grammar, baked-in preset labels, and an application
`view ===` ternary.

### Extension without a Presets primitive

Recents, “last 7 days”, “this year”, and “last known range” are product
copy and product math. They are ordinary buttons given an explicit
application setter or `DateField.Range` commit; the ISO kit supplies arithmetic.
They must not become `Calendar.Preset` or gain an imperative Calendar
context. `DateField.Range` coordinates the range draft machine without
children dispatching through Calendar.

**Vendor.** design-system `DateRangePresets` + `presets.ts`. **Lift** the
composition evidence. **Leave** the named preset catalog and hidden
request channel.

---

## Internal state

Calendar's Zustand store is per instance: private `view`, internal `month`
when the prop is omitted, range hover preview, and roving cell target.
Controlled `month`, `value`, `mode`, `locale`, bounds, and `today` stay
props. Preview and private view/month never appear as public writable
state. Two Calendars do not share a store. StrictMode replay must not
duplicate a selection request or reset view/month except on real unmount.

## DateField and DateField.Range

DateField folds standard date pickers through
`<DateField><DateField.Picker /></DateField>` and range pickers through
`<DateField.Range><DateField.Picker /></DateField.Range>`. Calendar provides
the underlying date-grid engine.

**DateField.Picker (Date).** One DateField and one embedded day Calendar
share a scalar ISO date. `DateField.Picker` manages trigger activation, popover
layer, and dismissal on date selection; Calendar omits `month` so opening
seeds the pane from `value`. Slotted `<Calendar>` unfolds and replaces the
synthesized default: `value`, `onChange`, `locale`, `mode="day"`, `min`, `max`,
and `isDateUnavailable` are managed automatically by DateField, while
`firstDayOfWeek`, `today`, `month`/`onMonthChange`, custom `<Calendar.Grid>` /
`<Calendar.Days>`, and navigation parts remain fully customizable.

**DateField.Range (Date Range).** `<DateField.Range>` coordinates two inputs
(`DateField.Start` and `DateField.End`), trigger, and embedded
`<Calendar mode="range">`. It internally manages the multi-step draft
transaction, active endpoint synchronization, pane coordination, and
Apply/Cancel boundaries. Slotted `<Calendar>` inherits `mode="range"` and
draft range bindings. Presets and recents call `setRange` directly.

**Month / year picker.** Folded Calendar with `mode="month"` or
`mode="year"`. Optional Popover. No DateField until DateField takes that
grammar. Side chrome receives explicit application callbacks.

**Vendor.** `vendor/design-system/Date` exports only DateInput and DateRange;
DateField, DatePicker, and Calendar are internal. That split is the product
direction. Reference UI keeps DateField and Calendar public because typed
input and the grid are the invariants; the packaged Dropdown/DatePicker is
the leave.

---

## Convergence

**Behaviour:** react-aria calendar + `@internationalized` week start.
**Grid/modifiers:** react-day-picker as contrast (`isoDate`, range class
names). **Folds and chrome:** design-system Date as contrast, re-hosted on
ISO with one discriminated `mode`. Public values stay ISO strings. Freeze compositions:
non-Sunday week, DateRange, folded month picker, and a recents list with an
explicit state callback.
