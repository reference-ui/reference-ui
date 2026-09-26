# Calendar features (need design)

Every item below needs a product, UX, or API-design call before it can
land — new/changed surface, behavior choices, or breaking changes.

## 1. Discriminated mode props + required value (DECISIONS candidate #1, DEFERRED)

**What it does:** Makes `value` required and mode-typed, and types
`onChange` per mode branch instead of `(value: any) => void`, with
explicit `null` as the controlled empty state.

**API:**

```tsx
// omitted / "day" → ISODate | null; "range" → CalendarDateRange | null;
// "month" → ISOMonth | null; "year" → ISOYear | null
<Calendar mode="range" value={range} onChange={(r) => setRange(r)} />
```

**Maintainer take:** Yes — required for any type-safe Calendar v2; land together with fail-closed.

## 2. Fail-closed invalid-prop behavior (DECISIONS candidate #2, OPEN)

**What it does:** Any invalid date-like prop, contradictory `min > max`,
or mode/value shape mismatch emits one descriptive development
diagnostic naming prop and bad string, renders no grid, and invokes no
callback.

**API:** No new props — a behavior contract over existing ones:

```tsx
// dev: console diagnostic naming `month` + bad string; renders null
<Calendar month="not-a-month" />
```

**Maintainer take:** Yes, but only after HQ picks blank render vs degraded-grid failure UX.

## 3. Required locale + firstDayOfWeek + CLDR wiring (DECISIONS candidate #3, DEFERRED)

**What it does:** Makes `locale` required, wires CLDR week start
through headers, grid padding, Home/End boundaries, and labels, with
an optional weekday-token override.

**API:**

```tsx
<Calendar locale="en-GB" firstDayOfWeek="monday" />
```

**Maintainer take:** Yes — locale-correct headers are table stakes; needs UX paint review first.

## 4. Padded outside-day grid (DECISIONS candidate #4, DEFERRED)

**What it does:** Leading/trailing cells become enabled day buttons for
the adjacent months' dates instead of empty `<td>` slots; activating
one requests its month first, then the date, with focus surviving the
month acceptance.

**API:** No new props — behavior/paint change, cells marked `data-outside-month`.

**Maintainer take:** Yes — the standard month-grid look; needs frozen-baseline re-approval.

## 5. Weekdays / Days / Day parts + render-state renderer (DECISIONS candidate #5, DEFERRED)

**What it does:** Adds composable `Calendar.Weekdays` / `Calendar.Days`
/ `Calendar.Day` parts with a per-day render function over an exact
10-field render state, plus descriptive diagnostics for renderer
contract violations.

**API:**

```tsx
<Calendar.Days>
  {(day) => <Calendar.Day date={day.date}>{day.formattedDay}</Calendar.Day>}
</Calendar.Days>
// day: date, formattedDay, outsideMonth, today, selected,
// disabled, rangeStart, rangeEnd, inRange, preview
```

**Maintainer take:** Yes when a consumer needs custom day content; keep the exactness diagnostic.

## 6. isDateUnavailable + min/max enforcement (DECISIONS candidate #6, DEFERRED)

**What it does:** Combines one predicate plus ISO `min`/`max` into a
single non-interactive day state; blocked dates are locked out in
every modality while a controlled-selected date that later becomes
disabled stays painted but non-interactive.

**API:**

```tsx
<Calendar min="2026-01-01" max="2026-12-31" isDateUnavailable={isHoliday} />
```

**Maintainer take:** Yes — disabled dates are unavoidable; DateField range work will force it.

## 7. 2D keyboard navigation + unavailable skip (DECISIONS candidate #7, DEFERRED)

**What it does:** Arrows move ±1/±7 days (Left/Right swap in RTL),
Home/End to locale week boundaries, PageUp/Down across months;
movement skips blocked dates, stops at bounds, and changes only focus
— never selection.

**API:** No new props — keyboard contract over the grid; consumer `onKeyDown` with `preventDefault()` cancels movement/activation.

**Maintainer take:** Yes — the grid is not shippable for keyboard users without it.

## 8. Today marker (DECISIONS candidate #8, DEFERRED)

**What it does:** Marks exactly the cell matching the ISO `today` with
`data-today`, independent of selection, focus, and outside-month
status; when `today` is omitted the client-local date is marked after
mount so SSR stays deterministic.

**API:**

```tsx
<Calendar today="2026-09-26" /> // that cell gets data-today
```

**Maintainer take:** Yes once UX picks a treatment that does not rely on color alone.

## 9. Range preview machine + Tab-commit (DECISIONS candidate #9, DEFERRED)

**What it does:** First activation requests `{ start, end: null }`;
hover/focus previews the interval with no callback; second activation
requests the normalized range; Tab leaving the grid requests the
current valid preview.

**API:** No new props — interaction machine over range mode; crossing an unavailable date rejects with the pending start retained.

**Maintainer take:** Yes — highest-leverage range UX; but confirm Tab-commit vs abandon first.

## 10. Month/year product modes + Months/Years parts + private view (DECISIONS candidate #10, DEFERRED)

**What it does:** Adds `mode="month"` / `mode="year"` publishing
`YYYY-MM` / `YYYY`, `Calendar.Months` / `Calendar.Years` parts, and a
Calendar-private drill-down view (`data-view`, never a controlled prop).

**API:**

```tsx
<Calendar mode="month" value="2026-09" onChange={setMonth} />
<Calendar.Months />  {/* 12 locale-labelled cells for the year */}
<Calendar.Years />   {/* clamped 21-year window, current scrolled into view */}
```

**Maintainer take:** Yes when a month/year-picker requirement arrives; not before.

## 11. Localized Heading + target-month nav names + announcements (DECISIONS candidate #11, DEFERRED)

**What it does:** Heading becomes a locale-formatted `div` and the
polite atomic announcement source (exactly one text mutation per
accepted change, no global announcer); Previous/Next are named by
their target months while callbacks stay ISO.

**API:** No new props — `"February 2024"` accessible names, Grid `aria-labelledby` to the Heading unless overridden.

**Maintainer take:** Yes — lands with locale + view work; the announcement contract is the right shape.

## 12. Controlled-month machine (DECISIONS candidate #12, DEFERRED)

**What it does:** Controlled `month` stays independent of `value`; nav
requests exactly the adjacent ISO month with no optimistic render; nav
directions disable when their target month holds no enabled date;
omitted `month` is Calendar-owned state seeded from value/`today`.

**API:** No new props — controlled/uncontrolled pane-state contract over `month` + `onMonthChange`.

**Maintainer take:** Yes — DateField folding needs it; confirm remount re-seed semantics.

## 13. Single-mode selection semantics (DECISIONS candidate #14, DEFERRED)

**What it does:** Activating an enabled day requests its ISO date
exactly once; blocked dates are locked out; parent rejection leaves
selection unchanged; programmatic changes apply silently with no focus
move.

**API:** No new props — emission contract over single mode (depends on padded grid + disable).

**Maintainer take:** Yes — cheap once outside-days + disable land; confirm no-op vs toggle on re-activation.

## 14. Whole-calendar disabled prop: freeze or remove (DECISIONS gap #2, OPEN)

**What it does (if frozen):** `disabled` on the root renders an inert
grid with disabled nav and no callbacks; alternatively the prop is
removed and products disable via `isDateUnavailable` + host
`aria-disabled`.

**API (if frozen):**

```tsx
<Calendar disabled /> // data-disabled root, inert grid, silent callbacks
```

**Maintainer take:** Lean remove — per-day disable covers it unless a product proves otherwise.
