# Calendar SPEC

Current freeze, cases, and proof. Design narrative: [Calendar.md](./Calendar.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/calendar.spec.ts`
Unit: `matrix/lib/tests/unit/calendar.test.ts` (missing)
Page: `/calendar`

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**API and TESTS.md are the contract.** Date-grid engine. Public values are
ISO strings, not `Date`. Required `locale`. Discriminated `mode`.

**Depth rule:** manufacture the day + range pane DateField needs first.
Month/year product chrome (`CA-VIEW-*` / `CA-MODE-*`) waits unless a
DateField case is blocked.

Visual polish is not this gate.

### Surface

| Axis | Freeze |
| :--- | :--- |
| Value | discriminated `mode` day \| range \| month \| year; ISO only |
| Locale | required; `firstDayOfWeek?`; optional `today` (SSR-safe) |
| View | private; `month` / `onMonthChange` optional |
| Grid | padded month, 2D keyboard, unavailable skip, range preview |

### Status (2026-09-10)

| | |
| :--- | :--- |
| Engine | Prototype month grid + click select. |
| Production | **No.** |
| Named `[x]` | 0 / 132 |
| Playwright | 1 title (`CA-ISO-01`) — click smoke, not the ISO gate |
| Vitest | 0 |

### Gaps & incoherence

- `defaultValue`, `locale = 'en-US'`, `onChange?: (value: any)`.
- **`new Date()`** seeds empty pane / today (`Calendar.tsx`). Freeze:
  optional `today` prop; no timezone-dependent default.
- Month/year product modes and Years window incomplete.
- No `today` prop, `isDateUnavailable`, range Tab-commit preview, ISO kit
  exports, CLDR week-start table.
- Part naming drift vs Calendar.md.
- `CA-ISO-01` title exists but does not assert the Gregorian ISO gate.

### Vendor

**Lift:** `vendor/react-spectrum/packages/@react-aria/calendar`;
`@internationalized/date` (`weekStartData`, Gregorian queries);
`vendor/react-day-picker` (padded grid, range preview contrast).

**Leave:** `CalendarDate` public objects; non-Gregorian calendars; JS `Date`
as public values; ±100y Date min/max defaults.

### Case index

- `[~]` `CA-ISO-01` — title exists; rewrite as the ISO gate, not click smoke
- `[ ]` remaining `CA-ISO-*`, `CA-LOC-*`, `CA-GRID-*`, `CA-DAY-*`,
  `CA-STATE-*`, `CA-MONTH-*`, `CA-KEY-*`, `CA-SINGLE-*`, `CA-RANGE-*`,
  `CA-VIEW-*`, `CA-MODE-*`, `CA-CHROME-*`, `CA-UTIL-01`, `CA-DYNAMIC-*`,
  `CA-ENV-*`, `CA-A11Y-01`, `CA-COMP-*`

### Work order

1. Required `locale`; kill `defaultValue` / `onChange any`.
2. ISO gate + helpers; remove public `Date` (`CA-ISO-*`).
3. Locale week-start + padded grid (`CA-LOC-*` / `CA-GRID-*`).
4. Day keyboard + unavailable skip (`CA-KEY-*` / `CA-DAY-*`).
5. Range preview machine (`CA-RANGE-*`) — DateField.Range depends on this.
6. Defer month/year chrome unless DateField is blocked.

### Won't do

Visual polish. Non-Gregorian. Preset catalog. Controlled `view` API.
**Separate `minValue` / `maxValue` props** — a bounded range is expressed
through `isDateUnavailable` (one predicate, no clamp/coercion ambiguity),
which also covers holidays and per-weekday rules a min/max pair cannot.

### Done when

Day/range + ISO kit match Calendar.md and unblock DateField. Remaining
mode/view IDs are `[x]` or explicitly deferred here with a named reason.
