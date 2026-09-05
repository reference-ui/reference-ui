# Field Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `Field` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 1: Overlays, Popups & Visual Substrate |
| **Default Fixed Host** | `div[data-reference-field]` |
| **State Substrate** | Ancestor selector CSS (`:has()`) |
| **Upstream Dependencies** | `Slot` |
| **Downstream Consumers** | `Combobox`, `DateField`, `NumberField`, input wrappers |
| **Exported Parts** | `Field.Root` (also exported as `Field`) |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/Field/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/field.spec.ts`
  - **Current Automated Suite**: 1 test (`FI-DOM-01..03`: Renders bezel with no role, sets `data-status=warning`).
- **Cosmos Harness**: `Field.fixture.tsx` (Default field, alignment with button, status indicators).
- **Executable Contract Count**: 20 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Pure CSS Ancestor Linking**: Verify `:has(:focus-visible)` applies focus outline to the outer bezel without React state overhead.
- **Validation State Styling**: `:has([aria-invalid="true"])` and `:has(:disabled)` driving bezel visual states.
- **Status Prop Support**: Authoritative `data-status="error" | "warning" | "success"` styling.
- **Control Height Harmony**: Strict 8.5r height alignment across Field, bare Input, and Button.
- **Zero Context Guarantee**: Field must never expose a context provider or inject form state.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Verify fixed host is `div[data-reference-field]` with no ARIA role.
- `PART-STYLE-01`: StyleProps and responsive `r` passthrough on the bezel.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/base-ui/packages/react/src/field`**:
  Visual bezel boundary contrasts; note that Base UI uses a context provider which Reference UI explicitly rejects in favor of CSS `:has()`.

- **`vendor/react-spectrum/packages/react-aria-components/test/TextField.test.js`**:
  Input alignment, description/error relationship verification.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: CSS bezel selectors, status attribute mappings, visual focus ring mechanics.
- **LEAVE**: Form/Field Context providers, validation state machines, label-injection wrappers.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Automate FI-CSS-01 to FI-CSS-04**: Playwright tests verifying `:has(:focus-visible)`, `:has(:disabled)`, and `:has([aria-invalid])`.

### Step 2: **Automate FI-ALIGN-01**: Bounding client rect height assertion verifying exact 8.5r parity with `Button` and `Input`.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Field.md`](./Field.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
