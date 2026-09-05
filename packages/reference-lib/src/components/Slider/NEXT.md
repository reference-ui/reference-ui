# Slider Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `Slider` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 2: Atomic Controls & Disclosures |
| **Default Fixed Host** | `div[role="slider"]` |
| **State Substrate** | Constraint & drag engine, fractional step snapping |
| **Upstream Dependencies** | `Slot` |
| **Downstream Consumers** | Volume sliders, price range filters, configuration dials |
| **Exported Parts** | `Slider.Root`, `Slider.Track`, `Slider.Range`, `Slider.Thumb` |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/Slider/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/slider.spec.ts`
  - **Current Automated Suite**: 1 test (`SD-DOM-01 & SD-DOM-02`: Renders slider parts and updates value via arrows).
- **Cosmos Harness**: `Slider.fixture.tsx` (Single thumb, range slider with two thumbs).
- **Executable Contract Count**: 72 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Multi-Thumb Range Slider**: Multiple thumbs (`value={[min, max]}`), preventing thumb collision or crossing.
- **Pointer Drag & Pointer Capture**: `setPointerCapture` drag along track, computing fractional percentages and snapping to `step`.
- **Vertical Orientation**: `orientation="vertical"` with ArrowUp/ArrowDown inverted and vertical drag math.
- **Keyboard Large Stepping**: PageUp/PageDown stepping by 10x, Home/End jumping to min/max.
- **Form Integration**: Serializing value(s) into hidden inputs for form submission.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Thumb has `role="slider"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
- `PART-CONTROL-01`: Controlled `value` prop respecting parent rejection.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/radix-primitives/packages/react/slider`**:
  Multi-thumb collision clamping, thumb crossing logic, keyboard navigation matrix.

- **`vendor/react-spectrum/packages/@react-aria/slider`**:
  High precision drag snapping, pointer capture, touch handling on mobile.

- **`vendor/zag/packages/machines/slider`**:
  Vertical slider math, percentage normalization.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Constraint math, drag pointer capture, multi-thumb clamping.
- **LEAVE**: Radix collection providers, proprietary CSS variables.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Pure Model Unit Tests**: Author `matrix/lib/tests/unit/slider.test.ts` for step snapping and thumb clamping algorithms.

### Step 2: **Automate SD-DRAG-01**: Playwright pointer drag and step snapping test.

### Step 3: **Automate SD-MULTI-01**: Test two-thumb range slider collision prevention.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Slider.md`](./Slider.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
