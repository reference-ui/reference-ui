# DateField Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `DateField` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 4: High-Precision Editors & Grid Engines |
| **Default Fixed Host** | Dual-host (`input[type=text]` or `div[data-reference-field]`) |
| **State Substrate** | Segmented date engine & Popover coordinator |
| **Upstream Dependencies** | `Field`, `Popover`, `Calendar` |
| **Downstream Consumers** | Booking engines, localized date pickers, date-range inputs |
| **Exported Parts** | `DateField.Root`, `DateField.Segment`, `DateField.Trigger`, `DateField.Picker`, `DateField.Range` |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/DateField/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/date-field.spec.ts`
  - **Current Automated Suite**: 1 test (`DF-DOM-02`: Renders compound DateField, opens picker, selects date).
- **Cosmos Harness**: `DateField.fixture.tsx` (Interactive segmented input with calendar popup).
- **Executable Contract Count**: 64 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Segmented Caret Stepping**: Caret navigation between Month, Day, Year segments via ArrowLeft/ArrowRight; digit entry buffer with auto-advance.
- **ArrowUp / ArrowDown Stepping**: Incrementing and decrementing individual segment values with boundary clamping (e.g. leap day Feb 29).
- **Date Range Coordination**: `DateField.Range` synchronizing start and end date segments, ensuring start <= end.
- **Native Form Submission**: Serializing canonical ISO 8601 string (`YYYY-MM-DD`) into hidden `<input name="...">`.
- **Direct Input vs Compound Mode**: Validating dual-host behavior: childless `<DateField />` renders `<input>`, compound `<DateField>` renders `<div data-reference-field>`.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Dual-host element assertion matching the explicit architectural exception.
- `PART-STYLE-01`: Token-aware StyleProps passthrough on the field bezel and trigger button.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/react-spectrum/packages/react-aria-components/test/DateField.test.js` & `DatePicker.test.js`**:
  Segment caret movement, partial digit entry, calendar popup opening/closing sync, date validation constraints.

- **`vendor/react-spectrum/packages/@internationalized/date`**:
  Segment parsing based on `Intl.DateTimeFormat` parts, Gregorian month/day constraints, leap year calculation.

- **`vendor/zag/packages/machines/date-input` & `date-picker`**:
  Segment focus management and digit rollover buffer.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Segment parsing, digit buffer stepping, ISO serialization, calendar popup linking.
- **LEAVE**: React Aria `DateSegment` spinbuttons (Reference UI uses pure caret/text segment navigation), bloated locale catalogs.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Automate DF-SEG-01 to DF-SEG-06**: Arrow stepping, digit typing, and auto-advance across segments.

### Step 2: **Automate DF-FORM-01 & DF-FORM-02**: Hidden input ISO serialization and form reset handling.

### Step 3: **Fix E2E DatePicker Integration**: Ensure calendar date selection in `date-field.spec.ts` handles target month/date locators deterministically without timeouts.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`DateField.md`](./DateField.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
