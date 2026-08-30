# Calendar

Proof: [TESTS.md](./TESTS.md).

Date-grid engine. Locale-aware week start and weekday headings, padded month grids, 2D keyboard movement, disabled/unavailable skipping, min/max clamping, today vs selected vs focused, range selection. Values are ISO calendar dates (`YYYY-MM-DD`), not `Date` objects and not a third-party date library. Locale is an explicit prop; `Intl` supplies labels and week-start. Does not parse typed input, format field values, or own time-of-day.

DatePicker / DateRangePicker are input + Popover + Calendar. Parsing and display formatting stay in application code.

```tsx
<Calendar
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

Range selection uses `selection="range"` and `{ start, end }`. Hovering a day while a start date is set previews the in-range interval; that preview is not application state.

## Proposed API

```ts
type ISODate = `${number}-${number}-${number}`

type CalendarValue =
  | ISODate
  | { start: ISODate; end: ISODate | null }

interface CalendarProps {
  children?: React.ReactNode
  selection?: "single" | "range"
  value?: CalendarValue | null
  onChange?: (value: CalendarValue | null) => void
  locale?: string
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
}
```

`Calendar` renders `div`. `Calendar.Header` and `Calendar.Heading` render `div`. `Calendar.Previous` / `Calendar.Next` render `button`. `Calendar.Grid` renders `table`. `Calendar.Weekdays` renders `th`. Each day is a `td` containing a `button`.

Cells expose `data-today`, `data-selected`, `data-disabled`, `data-outside-month`, and for ranges `data-range-start`, `data-range-end`, `data-in-range`.

Keyboard movement and selection do not require those attributes to be set by the application. Heading announces when the month changes.

---

## Problems we own

This is genuinely hard. We do not take a `Date` library; we re-host vendor grid/keyboard math on ISO strings.

### Week start ≠ Sunday

Freeze-gate: a locale whose week does not start on Sunday (`en-GB`, etc.). Hardcoding Sunday is the usual US-centric bug.

**Vendor.** `@internationalized/date` `weekStartData.ts` / `startOfWeek(locale)` (CLDR; some Sunday locales omitted and default Sun — know that compression). react-day-picker `weekStartsOn` / locale / `ISOWeek`.

**Lift** week-start tables + tests. **Leave** Aria `CalendarDate` objects and DayPicker extra calendars (buddhist, hijri, …) unless we explicitly take non-Gregorian.

### ISO strings, not `Date`

Aria uses `CalendarDate`. DayPicker uses `Date` plus `day.isoDate` data attrs. Public API is `YYYY-MM-DD`. Time-of-day is outside this primitive.

**Lift** grid construction and 2D keyboard; **re-host** on ISO.

### Range hover preview is not application state

While start is set, hovering a day previews in-range. `value` updates when the range completes (or when start is chosen, depending on freeze — Aria keeps an internal `anchorDate` / `highlightedRange`; DayPicker `useRange` calls `onSelect({ from, to: undefined })` on first click, pushing partial range into the app).

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
