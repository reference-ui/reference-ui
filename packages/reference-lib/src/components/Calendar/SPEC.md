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
| Engine | Locale CLDR grids + padded outside days + disable + 2D keys + today + live heading on Gregorian kernels. |
| Production | **No.** |
| Named `[x]` | 60 / 132 (colocated; matrix 110 e2e + remaining unit NOT ported — needs API rework, see handoffs) |
| Playwright CT | 32 tests react19 + react18 green (7 frozen snaps pass unmodified within 2% tolerance; 11 cluster-A + 21 cluster-B behavioral) |
| Vitest | 56 (`iso.test.ts`, `week-grid.test.ts` 9, `Calendar.contract.test.tsx` 40) |

### Gaps & incoherence

- ~~`defaultValue`, `onChange?: (value: any)` retained~~ → LANDED
  (FEATURES #1, cluster A 2026-09-26): discriminated mode props, required
  controlled `value`, mode-typed `onChange`; `defaultValue` removed and
  whole-calendar `disabled` removed (FEATURES #14). `locale = 'en-US'`
  default retained for cluster B (FEATURES #3).
- ~~**`new Date()`** seeds empty pane / today~~ → optional `today` prop added
  (default = system UTC date, behavior preserved); `new Date()` remains only
  as the default-fallback and out-of-domain legacy path.
- ISO kit exports: DONE (curated — `ISODate`/`CalendarMode` names stay with
  `Calendar.tsx` for DateField compat; kit functions + `ISOMonth`/`ISOYear`/
  `CalendarWeekday`/`CalendarDateRange` re-exported).
- ~~CLDR week-start table: ported (`week.ts`) but NOT wired to render~~ →
  LANDED (FEATURES #3, cluster B 2026-09-26): required `locale`,
  `firstDayOfWeek` token override, CLDR wiring through headers, padding,
  Home/End, and labels; 7 frozen snaps pass unmodified within tolerance.
- ~~`isDateUnavailable` (`min`/`max` remain dead props), padded
  outside-day grid, 2D keyboard nav, today marker~~ → LANDED (FEATURES
  #4/#6/#7/#8/#11, cluster B 2026-09-26): padded enabled outside days,
  single disable state + nav coverage, 2D keys + skip + pending focus,
  post-mount local today marker, div Heading live-atomic + target-month
  nav names + grid labelling.
- Still missing: range Tab-commit preview (HOLD #9), month/year product
  modes (HOLD #10), Day renderer parts (HOLD #5).
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
- `[x]` `CA-ISO-06`, `CA-ISO-07` (fail-closed render-null + one dev
  diagnostic, FEATURES #2 cluster A), `CA-MODE-04` (discriminated props +
  month/year pane seeding, FEATURES #1 cluster A), `CA-STATE-10` (null
  empty state + omitted-value diagnostic), `CA-MONTH-01`, `CA-MONTH-02`,
  `CA-MONTH-04` (domain bounds cluster A + min/max/unavailable target
  coverage cluster B), `CA-MONTH-05`, `CA-MONTH-09`, `CA-MONTH-10`,
  `CA-SINGLE-01`, `CA-SINGLE-02`, `CA-SINGLE-05` (uniform-request read
  per triage — overrides the old `CA-SINGLE-03` no-emit text, see TESTS.md)
- `[x]` `CA-LOC-04`, `CA-LOC-05`, `CA-LOC-06`, `CA-LOC-07` (locale
  headers/names/RTL/switch, FEATURES #3/#11 cluster B), `CA-GRID-05`,
  `CA-GRID-06`, `CA-GRID-07`, `CA-GRID-09`, `CA-GRID-12` (outside days,
  names, ids, labelling, announcements, FEATURES #4/#11 cluster B),
  `CA-STATE-01`, `CA-STATE-02`, `CA-STATE-03` (full: selection/today/
  first-enabled preference, FEATURES #6/#8 cluster B), `CA-STATE-04`,
  `CA-STATE-05`, `CA-STATE-06`, `CA-STATE-07`, `CA-STATE-08`,
  `CA-MONTH-06`, `CA-MONTH-07`, `CA-KEY-01`, `CA-KEY-02`, `CA-KEY-03`,
  `CA-KEY-04`, `CA-KEY-05`, `CA-KEY-07`, `CA-KEY-08`, `CA-KEY-10`,
  `CA-SINGLE-04`, `CA-SINGLE-07`, `CA-DYNAMIC-02` (FEATURES #4/#6/#7/#8
  cluster B; `CA-KEY-06`-style bound termination covered inside the
  `CA-KEY-01/05` bounds leg, `CA-KEY-09` waits on HOLD #5 Day parts)
- `[ ]` `CA-DAY-13`, `CA-DAY-14` (Weekdays/Days/Day parts — NOT ported),
  remaining `CA-DAY-*`, `CA-STATE-*`, `CA-MONTH-*`, `CA-KEY-*`,
  `CA-SINGLE-*`, `CA-RANGE-*`, `CA-VIEW-*`, `CA-MODE-*`, `CA-CHROME-*`,
  `CA-DYNAMIC-*`, `CA-ENV-*`, `CA-A11Y-01`, `CA-COMP-*`

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
