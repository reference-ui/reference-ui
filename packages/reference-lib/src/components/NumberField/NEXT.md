# NumberField Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `NumberField` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 4: High-Precision Editors & Grid Engines |
| **Default Fixed Host** | `input[type="text"]` |
| **State Substrate** | Numeric parse/edit engine & decimal stepping |
| **Upstream Dependencies** | `Field`, `Slot` |
| **Downstream Consumers** | Financial inputs, quantity pickers, coordinate editors, settings inputs |
| **Exported Parts** | `NumberField.Root`, `NumberField.Input`, `NumberField.IncrementButton`, `NumberField.DecrementButton`, `NumberField.ScrubArea` |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/NumberField/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/number-field.spec.ts`
  - **Current Automated Suite**: 1 test (`NF-DOM-01`: Renders spinbutton, steppers, increments/decrements).
- **Cosmos Harness**: `NumberField.fixture.tsx` (Steppers, min/max limits, currency format).
- **Executable Contract Count**: 148 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Locale-Aware Partial Parsing**: Allowing valid partial numeric input (e.g. "-", ".", "1,") during editing, then formatting to localized string on blur via `Intl.NumberFormat`.
- **Key & Stepper Repeat Mechanics**: Click-and-hold on increment/decrement buttons repeating steps at increasing acceleration.
- **Modifier Stepping**: Shift+Arrow for large step (`step * 10`), Alt+Arrow for fine step (`step / 10`).
- **Scrub Area Dragging**: Horizontal drag on `ScrubArea` with pointer lock / delta accumulation adjusting numeric value.
- **Min/Max Clamping**: Strict value clamping to `min` and `max` constraints.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Ensure input has `role="spinbutton"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`.
- `PART-CONTROL-01`: Controlled `value` prop updates and parent callback rejection.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/base-ui/packages/react/src/number-field`**:
  Partial parse regexes, precision tracking, click-and-hold stepper repeat, mobile touch input handling.

- **`vendor/react-spectrum/packages/@internationalized/number/src/NumberParser.ts`**:
  Locale decimal and grouping separator parsing without loss of precision.

- **`vendor/zag/packages/machines/number-input`**:
  Scrub area pointer drag session, step snapping math.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Intl parse/format round-tripping, click-and-hold repeat timer, scrub drag math, modifier steps.
- **LEAVE**: Base UI context providers, proprietary visual styles, unnecessary DOM wrappers.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Pure Model Unit Tests**: Author `matrix/lib/tests/unit/number-field.test.ts` for decimal precision math and locale parsing.

### Step 2: **Automate NF-STEP-01 to NF-STEP-04**: Large step (Shift), fine step (Alt), and boundary clamping in Playwright.

### Step 3: **Automate NF-SCRUB-01**: ScrubArea drag interaction test.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`NumberField.md`](./NumberField.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
