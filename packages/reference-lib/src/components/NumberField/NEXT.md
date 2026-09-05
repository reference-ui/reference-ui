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

### Architectural Philosophy: Agent-First Transparency & Conservative State
Per [NumberField.md](./NumberField.md) and [components.md](../components.md):
- **Core Invariant**: Centralize the difficult boundary between ephemeral, localized partial string input and a controlled numeric `number | null` value. It accepts partial typing (e.g. "-", ".", "1,") without publishing `NaN`, parses supported decimal numbering systems via `Intl.NumberFormat`, and performs drift-resistant step math.
- **Pure Input Chrome, Zero Form Soup**: `NumberField` accepts neither `label` nor `errorMessage` props—labels, descriptions, and visual bezels belong to [Field](../Field) and standard HTML/ARIA.
- **Fixed Anatomy**: `NumberField`, `NumberField.Group`, `NumberField.Input` (renders `input[type=text]`, NOT `type=number`), `NumberField.Increment`, `NumberField.Decrement`. No esoteric desktop features (e.g. pointer-lock scrub areas).
- **Styling Transparency**:
  - The input bezel coordinates with [Field](../Field).
  - Stepper buttons are native `<button type="button">` with standard token-aware StyleProps.

### Functional & Behavioral Gaps
- **Locale-Aware Partial Parsing**: Allowing valid partial numeric input during editing, then formatting to localized string on blur via `Intl.NumberFormat`.
- **Key & Stepper Repeat Mechanics**: Click-and-hold on increment/decrement buttons repeating steps with drift-resistant decimal arithmetic.
- **Modifier Stepping**: Shift+Arrow for large step (`step * 10`), Alt+Arrow for fine step (`step / 10`).
- **Min/Max Clamping & Boundaries**: Strict value clamping to `min` and `max` constraints without NaN conversions.
- **Form Submission**: Serializing canonical numeric string into native `<form>` submission.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Ensure input has `role="spinbutton"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`.
- `PART-STYLE-01`: Token-aware StyleProps passthrough on `NumberField.Group`, `Input`, `Increment`, and `Decrement`.
- `PART-CONTROL-01`: Controlled `value` prop updates and parent callback rejection.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability while adhering strictly to our conservative state boundary:

### Primary Upstream Reference Packages
- **`vendor/base-ui/packages/react/src/number-field`**:
  Partial parse regexes, precision tracking, click-and-hold stepper repeat, mobile touch input handling.
- **`vendor/react-spectrum/packages/@internationalized/number/src/NumberParser.ts`**:
  Locale decimal and grouping separator parsing without loss of precision.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Intl parse/format round-tripping, click-and-hold repeat timer, modifier step multiplication, decimal drift resistance.
- **LEAVE**: Base UI context providers, proprietary visual styles, desktop pointer-lock scrub mechanics.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Pure Model Unit Tests**: Author `matrix/lib/tests/unit/number-field.test.ts` for decimal precision math and locale parsing.

### Step 2: **Automate NF-STEP-01 to NF-STEP-04**: Large step (Shift), fine step (Alt), and boundary clamping in Playwright.

### Step 3: **Automate NF-REPEAT-01**: Click-and-hold repeat stepping on increment/decrement buttons.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`NumberField.md`](./NumberField.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
