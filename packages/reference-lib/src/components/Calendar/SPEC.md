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

### Status (2026-09-25, quarantine-landing)

| | |
| :--- | :--- |
| Engine | Prototype month grid + click select on Gregorian kernels. |
| Production | **No.** |
| Named `[x]` | 17 / 132 (colocated; matrix 110 e2e + remaining unit NOT ported — needs API rework, see handoffs) |
| Playwright CT | 4 tests: 7 frozen snaps green unmodified + 2 behavioral (leap-Feb grid, Dec→Jan nav) |
| Vitest | 19 (`iso.test.ts` 7, `week-grid.test.ts` 8, `Calendar.contract.test.tsx` 4) |

### Gaps & incoherence

- `defaultValue`, `locale = 'en-US'`, `onChange?: (value: any)` — retained
  deliberately (quarantine's controlled-only/discriminated redesign NOT ported).
- ~~**`new Date()`** seeds empty pane / today~~ → optional `today` prop added
  (default = system UTC date, behavior preserved); `new Date()` remains only
  as the default-fallback and out-of-domain legacy path.
- ISO kit exports: DONE (curated — `ISODate`/`CalendarMode` names stay with
  `Calendar.tsx` for DateField compat; kit functions + `ISOMonth`/`ISOYear`/
  `CalendarWeekday`/`CalendarDateRange` re-exported).
- CLDR week-start table: ported (`week.ts`) but NOT wired to render (moves
  paint for non-Sunday locales — needs UX review).
- Still missing: `isDateUnavailable` (`min`/`max` remain dead props),
  range Tab-commit preview, padded outside-day grid (suspect paint),
  2D keyboard nav, today marker, month/year product modes.
- Part naming drift vs Calendar.md — kept (quarantine renames NOT ported).
- `CA-ISO-01` is now the ISO gate (unit); the old click-smoke title lives on
  as CT coverage without the ID.

### Vendor

**Lift:** `vendor/react-spectrum/packages/@react-aria/calendar`;
`@internationalized/date` (`weekStartData`, Gregorian queries);
`vendor/react-day-picker` (padded grid, range preview contrast).

**Leave:** `CalendarDate` public objects; non-Gregorian calendars; JS `Date`
as public values; ±100y Date min/max defaults.

### Case index

- `[x]` `CA-ISO-01`, `CA-ISO-02`, `CA-ISO-03`, `CA-ISO-04`, `CA-ISO-05`,
  `CA-ISO-08` (`iso.test.ts`, ported verbatim from quarantine bar import path)
- `[x]` `CA-LOC-01`, `CA-LOC-02`, `CA-LOC-03`, `CA-LOC-08`,
  `CA-GRID-01`, `CA-GRID-02`, `CA-GRID-03` (`week-grid.test.ts`, same)
- `[x]` `CA-UTIL-01` (via public `./index` barrel — proves curated export)
- `[x]` `CA-ENV-02` (StrictMode SSR, adapted), `CA-STATE-11` (adapted:
  today-seeded default pane), `CA-ENV-01` (adapted: SSR determinism)
- `[ ]` `CA-ISO-06`, `CA-ISO-07` (fail-closed render-'' — NOT ported),
  `CA-MODE-04` (discriminated props — NOT ported), `CA-DAY-13`, `CA-DAY-14`
  (Weekdays/Days/Day parts — NOT ported), remaining `CA-DAY-*`,
  `CA-STATE-*`, `CA-MONTH-*`, `CA-KEY-*`, `CA-SINGLE-*`, `CA-RANGE-*`,
  `CA-VIEW-*`, `CA-MODE-*`, `CA-CHROME-*`, `CA-DYNAMIC-*`, `CA-ENV-*`,
  `CA-A11Y-01`, `CA-COMP-*`

### Work order

1. Required `locale`; kill `defaultValue` / `onChange any`. (DEFERRED by
   quarantine-landing: API redesign, not stability.)
2. ISO gate + helpers; remove public `Date` (`CA-ISO-*`). (DONE colocated
   2026-09-25: `iso.ts`/`week.ts`/`grid.ts` + 17 cases; grid `Date.UTC`
   replaced by kernels with out-of-domain legacy fallback.)
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
