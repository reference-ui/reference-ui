# FEATURES Calendar-B log

Cluster B: #3, #4, #6, #7, #8, #11. Branch: reference-system (never switch, never commit).
Cluster A contract (modes, required value, fail-closed, month machine, selection, no whole-disabled) committed underneath — build on current tree.

## Checkpoint plan (before further reads)

1. Read order (incremental, log lines between): cluster-A log → Calendar.tsx → SPEC.md → week.ts/grid.ts/iso.ts → contract tests/TESTS → story/book → test-component skill → ux-designer skill.
2. Implement in dependency order: #3 locale/CLDR week-start (headers, padding, Home/End, labels) → #4 padded outside-day grid (enabled adjacent-month buttons, month-first then date, focus survives) → #6 isDateUnavailable + min/max (single non-interactive state; controlled-selected-stays-painted-but-inert) → #7 2D kbd nav + skip (arrows ±1/±7 RTL-aware, Home/End locale boundaries, PgUp/Dn, focus-only, consumer preventDefault cancels) → #8 today marker (data-today, prop or post-mount client-local, SSR deterministic) → #11 localized Heading + announcements (locale div, one atomic mutation, target-month nav names, Grid aria-labelledby).
3. Migration sweep: stories + books + Showcase + tests for BREAKING items (required locale, outside-day behavior).
4. Proof: `pnpm agentct Calendar` (unit + e2e green); visuals rule for #3/#4/#8: snapshots pass OR view-story + UX sign-off, else STOP and flag.
5. Nested ux-designer review (self-review by method + flag if pool-full).

## Reads
- API-STANCE.md, FEATURES.md, triage Calendar section: read.
- Cluster-A log read (handoff: #6 extends nav disable; #1/#2/#12/#13/#14 landed).
- Calendar.tsx read (860 lines; context: prevDisabled domain-only, selectDate uniform-request, heading button + month view, grid empty outside cells, locale default en-US).
- SPEC read: required locale + firstDayOfWeek? + SSR-safe today is the freeze; week.ts CLDR ported-but-unwired; min/max dead; #6/#4/#7/#8 missing; grid padded + 2D kbd + preview in freeze surface.
- week.ts/grid.ts read: CLDR weekStartData + getWeekStart(locale, firstDayOfWeek?) + getWeekdayHeaders() exist; buildMonthGrid(month, firstDay, locale) already pads outside days with locale formatters. Cluster B = wire into render + props + keys + disable + today + heading/announce.
- iso.ts/index.ts read: addCalendarDays/Months, compareISODate, CalendarWeekday tokens exist; barrel exports week/grid helpers already.
- TESTS.md CA-ISO/LOC/GRID/DAY/STATE/MONTH/KEY read: full contract — required locale, CLDR week-start, padded outside days (data-outside-month), min/max+predicate single disable state (disabled+aria-disabled+data-disabled), 2D keys + skip + pending-focus, data-today + aria-current, heading live-atomic + target-month nav names + grid aria-labelledby.
- Contract test (245 lines), story (269), book, CT spec (243), DECISIONS.md, test-component skill: read.
- Consumers inventoried: DateField.tsx:397 synthesized + :121 alias already pass locale (no break, no touch); DateField.book.tsx:35 + Showcase.book.tsx:528 slotted <Calendar> lack locale (migration needed); kit consumers (parse.ts) unaffected.
- week-grid.test.ts read: kit pinned — getWeekStart(firstDayOfWeek?) takes CalendarWeekday SHORT tokens; validateLocale THROWS on non-Gregorian; buildMonthGrid pads outside days. FEATURES sketch "monday" is loose prose → strict short-token type (simplest contract).
- TESTS SINGLE/CHROME/DYNAMIC/ENV/COMP + freeze decisions read: locale required w/o default (#6); heading=div + Month/Year buttons own drill-down (CA-GRID-10) → prototype heading-toggle + dead month-view branch go away under #11 (#10 HOLD reintroduces via parts); click moves roving target (CA-SINGLE-01); live-constraint relocate (CA-DYNAMIC-02); owner-root focus (CA-ENV-03); deterministic day IDs (CA-GRID-07/CA-ENV-01).
- Checkpoint 2: design settled (see plan §1 for per-item design).
- START implementation: grid.ts 1900-label fix → Calendar.tsx (#3 → #4 → #6 → #7 → #8 → #11) → stories/books/migration → unit + CT → agentct → visuals rule → UX review.
- LAND code: Calendar.tsx rewritten sections (required locale + firstDayOfWeek + CLDR wiring; padded outside grid via buildMonthGrid; isDateUnavailable+min/max single disable + nav coverage; 2D keys + skip + pending focus; post-mount local today marker; div Heading live-atomic + target-month nav names + grid aria-labelledby; day ids; view toggle + dead month branch removed; button role=gridcell denested to td-only).
- Migration: story x8 + book x2 locale; DateField.book + Showcase.book slotted locale en-US; DateField.tsx alias locale-merge fix (TS2783 from required locale) + stale #6 comment refresh. DateField.tsx behavior untouched (isDateUnavailable wiring = DateField PATCHES #4).
- Typecheck: 0 errors in touched files (remaining: other crews' Combobox/Icon.book/NumberField/Slider/Slot/ct.ts; Slider export break in Showcase.book:25 is Slider crew's).
- Unit 56/56 green. Two finds on the way: nav memo called the predicate on invalid fixtures (fixed: invalid short-circuit, CA-ISO-06 silence); my own disabled-target fixture used a padded today (fixture fix).
- E2E 32/32 green (react19 + react18). Three finds: pending-focus applied while target still padded (fixed: apply only when showing month == pending month — CA-KEY-07/CA-MONTH-07); disable-blur + row-unmount drop DOM focus before effects (fixed: grid-focus tracking + rebuild repair — CA-DYNAMIC-02/CA-LOC-07); three test-setup focus artifacts fixed with synthetic toggles.
- Snapshots: 7 baselines pass UNMODIFIED (maxDiffPixelRatio 0.02; padded-grid + heading-div diffs land inside tolerance). Visuals rule branch 1 satisfied; still doing view-story + UX review per orders.
- SPEC.md (counts/gaps/index → 60/132) + DECISIONS.md (4 judgment calls) updated. Book +2 stories (MondayFirst, Constrained) as paint proof surface.
- View-story: Playwright MCP broken in-session (pipe errors) → pnpm capture fallback. Captures: MondayFirst (Mon-first, padding, underline today, selected pill), Constrained (dimmed blocked/outside), SingleDate (padded Aug 2026). All paint as designed.
- UX REVIEW (nested ux-designer, live): verdict SHIP-WITH-NOTES. LOOK approved (padded grid, div heading, en-GB headers, underline today, focus ring); FEEL all 9 approved (locale, month-first, disable, 2D keys live-verified, relocate, today, announce, toggle-removal as briefed, HOLDs untouched); A11Y honest (grid roles, names, current, triple-disable). NOTES L1/L2/A1 (pre-GA follow-up, not fail): dimming near-invisible (~11% lightness) + outside-enabled/disabled share byte-identical resting paint — must become visible + mutually distinguishable before GA. A2 noted no-action (generic names on disabled nav = honest).
- Checkpoint 3 (final): all 6 items landed, unit 56/56, e2e 32/32 (react19 + react18), typecheck clean for touched files, snapshots unmodified-green, UX SHIP-WITH-NOTES. Branch reference-system, no commit. HOLD #5/#9/#10 untouched. Dev server :5000 started by me for view-story/UX, terminated after use.
