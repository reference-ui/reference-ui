# Calendar Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `Calendar` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 4: High-Precision Editors & Grid Engines |
| **Default Fixed Host** | `div[role="grid"]` |
| **State Substrate** | Gregorian date engine & roving 2D focus |
| **Upstream Dependencies** | `RovingFocus`, `Slot` |
| **Downstream Consumers** | `DateField`, `DateField.Picker`, date-range filters, scheduling UIs |
| **Exported Parts** | `Calendar.Root`, `Calendar.Header`, `Calendar.Heading`, `Calendar.PrevButton`, `Calendar.NextButton`, `Calendar.Grid`, `Calendar.GridHeader`, `Calendar.GridBody`, `Calendar.Row`, `Calendar.Cell`, `Calendar.DayButton` |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/Calendar/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/calendar.spec.ts`
  - **Current Automated Suite**: 1 test (`CA-ISO-01`: Renders calendar grid, selects date on click and updates state).
- **Cosmos Harness**: `Calendar.fixture.tsx` (Basic month grid view).
- **Executable Contract Count**: 132 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Date Range Selection & Drag**: Multi-date range selection (`mode="range"`), start/end date clamping, range preview on pointer hover, and rejection of ranges crossing unavailable dates.
- **2D Keyboard Grid Navigation**: ArrowLeft/Right (day ±1), ArrowUp/Down (week ±1), PageUp/Down (month ±1), Shift+PageUp/Down (year ±1), Home/End (start/end of current week row).
- **Month & Year Drill-Down Views**: View switching (`mode="month"`, `mode="year"`), decade navigation, and heading drill-down commitment.
- **Unavailable & Disabled Dates**: `isDateUnavailable` and `min`/`max` constraints preventing selection and skipping during arrow navigation.
- **Locale & Week Start Synchronization**: First day of week (Sunday vs Monday) dynamically adapting to provided `locale` without server-client hydration mismatches.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Strict verification of `role="grid"`, `role="rowgroup"`, `role="row"`, `role="gridcell"`, and `role="columnheader"`.
- `PART-ID-01`: Deterministic date button IDs and heading labeling via `aria-labelledby`.
- `PART-STATE-01`: Authoritative `data-selected="start|end|middle"`, `data-outside-month`, `data-today`, and `data-unavailable` attributes.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/react-spectrum/packages/react-aria-components/test/Calendar.test.js`**:
  Grid keyboard matrix, controlled visible month, min/max range clamping, unavailable date handling, multi-month paging.

- **`vendor/react-spectrum/packages/@internationalized/date/src/queries.ts` & `weekStartData.ts`**:
  Gregorian calendar arithmetic, timezone-neutral ISO string parsing (`YYYY-MM-DD`), locale-specific first-day-of-week data.

- **`vendor/react-day-picker/packages/react-day-picker/src/DayPicker.test.tsx`**:
  Padded month construction, outside day rendering & focus traversal, range preview modifiers.

- **`vendor/zag/packages/machines/calendar`**:
  2D grid cell focus state machine, year range pagination math, cell click-drag session.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: ISO date math, week start algorithms, 2D keyboard navigation, range selection state machine.
- **LEAVE**: Date object instantiation / date-fns dependencies, React Aria complex hook-soup, custom styling themes.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Pure Model Unit Tests**: Author `matrix/lib/tests/unit/calendar.test.ts` covering Gregorian month generation, leap years, and week start offsets.

### Step 2: **Automate CA-NAV-01 to CA-NAV-08**: Playwright tests for 2D Arrow navigation, PageUp/PageDown, and Home/End.

### Step 3: **Automate CA-RANGE-01 to CA-RANGE-06**: Range selection gestures, start/end visual attributes, and unavailable date prevention.

### Step 4: **Cosmos Fixture Expansion**: Add interactive fixtures for Date Range selection, Min/Max clamping, and French/Japanese locale grids.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Calendar.md`](./Calendar.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
