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

### Playtest (2026-09-27, date crew)

Landed FEATURES #10 (B-23): private view machine (`data-mode` /
`data-view`), Month/Year drill-down buttons, Months/Years collections
with roving tabindex + 3-column arrows + RTL, whole-unit min/max +
`isDateUnavailable` disabling, range paint, month `YYYY-MM` / year
`YYYY` publishing, and navigation-vs-selection per mode. Landed B-36
Calendar facet: identical-value suppression in every mode (restores
CA-SINGLE-03's no-emit read over the FEATURES #13 uniform-request
triage — deliberate reversal, flagged for HQ). B-17/B-18/Calendar-B-24
verified already-fixed in `src` (FEATURES #3/#6/#7 proofs green; the
playtest observed stale `dist`).

| | |
| :--- | :--- |
| Named `[x]` | 78 / 132 |
| Playwright CT | 50 titles green (32 pre-existing + 18 view/mode proofs); 7 frozen snaps pass unmodified |
| Vitest | 63 (56 pre-existing + 7 view/mode contract proofs) |

### Finish-line P2B (2026-09-28, calendar leg)

Landed FEATURES #5 (Weekdays/Days/Day parts + exact 10-field render
state + CA-DAY-08..11 diagnostics), FEATURES #9 (range preview machine
+ Tab-commit, HQ take (a)), per-part defaulting for CA-VIEW-13 (HQ
take (c)), and the PATCHES.md #1 colocated port (CA-DAY-13 SSR
hydration, CA-DAY-14 StrictMode on React 17/18/19, CA-ENV-03 shadow,
CA-ENV-04 chromium vectors). No `matrix/` dir exists in this repo
(SPEC paths are stale) — colocated suites ARE the port. HQ takes
(b) exactness diagnostic kept, (d) `{start,end:null}` already the
`DateRangeValue` shape (validation also tolerates absent `end`).

| | |
| :--- | :--- |
| Named `[x]` | 111 / 132 |
| Playwright CT | 84 titles green react19 (52 pre-existing + 32 new); CA-DAY-14 also green on 17/18; 7 frozen snaps pass unmodified |
| Vitest | 68 (63 pre-existing + CA-DAY-13 SSR hydration) |
| Honest scope | CA-DAY-07 + CA-ENV-04 chromium-only (CT runs Desktop Chrome; no Firefox/WebKit project); CA-RANGE-11 synthetic tap path (no touch context); CA-DAY-14 literally 17/18/19 |

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
- ~~Still missing: range Tab-commit preview (HOLD #9), Day renderer
  parts (HOLD #5)~~ → LANDED (finish-line P2B, 2026-09-28):
  FEATURES #5 parts + 10-field state + diagnostics, FEATURES #9
  preview machine + Tab-commit, per-part defaulting.
- ~~Month/year product modes (HOLD #10)~~ → LANDED (playtest FEATURES
  #10, 2026-09-27): private view, Month/Year parts, Months/Years
  collections, month/year publishing. Per-part defaulting replaced the
  `children ?? defaults` rule in P2B (2026-09-28, HQ take (c)):
  authored parts replace only their own default, so the CA-VIEW-13
  first fixture (custom Days + default Header/Months/Years) is green.
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
  `CA-SINGLE-01`, `CA-SINGLE-02`, `CA-SINGLE-03` (B-36 playtest
  reversal 2026-09-27: no-emit on identical re-activation in every mode —
  supersedes the FEATURES #13 uniform-request triage, flagged for HQ),
  `CA-SINGLE-05`
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
  `CA-KEY-01/05` bounds leg; `CA-KEY-09` proven with P2B Day parts,
  indexed below)
- `[x]` `CA-VIEW-01`, `CA-VIEW-02`, `CA-VIEW-03`, `CA-VIEW-04`,
  `CA-VIEW-05`, `CA-VIEW-06`, `CA-VIEW-07`, `CA-VIEW-08` (nav-disable +
  silence + range round-trip; the "pending range preview" clause is
  vacuous — no preview machine on this branch, HOLD #9), `CA-VIEW-09`,
  `CA-VIEW-10`, `CA-VIEW-11` (bare-Heading mutation counts + folded
  live-region integrity), `CA-VIEW-12`, `CA-VIEW-13` (both fixtures —
  second: custom header without drill-down stays home; first: custom
  Days + per-part defaulted Header/Months/Years, P2B), `CA-MODE-01`,
  `CA-MODE-02`, `CA-MODE-03`, `CA-MODE-05` (playtest FEATURES #10,
  2026-09-27)
- `[x]` `CA-DAY-01`, `CA-DAY-02`, `CA-DAY-03`, `CA-DAY-04`,
  `CA-DAY-05`, `CA-DAY-06`, `CA-DAY-07` (chromium only — CT has no
  Firefox/WebKit project), `CA-DAY-08`, `CA-DAY-09`, `CA-DAY-10`,
  `CA-DAY-11`, `CA-DAY-12`, `CA-KEY-09` (with the `CA-DAY-07` title),
  `CA-DAY-13` (unit SSR hydration), `CA-DAY-14` (CT StrictMode,
  literally React 17/18/19) — finish-line P2B FEATURES #5, 2026-09-28
- `[x]` `CA-RANGE-01`, `CA-RANGE-02`, `CA-RANGE-03`, `CA-RANGE-04`,
  `CA-RANGE-05`, `CA-RANGE-06`, `CA-RANGE-07`, `CA-RANGE-08`,
  `CA-RANGE-09`, `CA-RANGE-10`, `CA-RANGE-11` (synthetic tap path —
  CT has no touch context), `CA-RANGE-12`, `CA-RANGE-13`,
  `CA-RANGE-14` (Tab-commit per HQ take (a)), `CA-RANGE-15`,
  `CA-RANGE-16` — finish-line P2B FEATURES #9, 2026-09-28
- `[x]` `CA-ENV-03` (shadow), `CA-ENV-04` (chromium vectors only —
  Firefox/WebKit unrun) — PATCHES.md #1 colocated port (no `matrix/`
  dir; colocated suites ARE the port)
- `[ ]` remaining `CA-STATE-*`, `CA-MONTH-*`, `CA-KEY-*`,
  `CA-SINGLE-*`, `CA-CHROME-*`, `CA-DYNAMIC-*`, `CA-ENV-*`,
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
