# Calendar

Date-grid engine. Locale-aware week start and weekday headings, padded month grids, 2D keyboard movement, disabled/unavailable skipping, min/max clamping, today vs selected vs focused, range selection. Values are ISO calendar dates (`YYYY-MM-DD`), not `Date` objects and not a third-party date library. Locale is an explicit prop; `Intl` supplies labels and week-start. Does not parse typed input, format field values, or own time-of-day.

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
