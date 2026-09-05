# Splitter Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `Splitter` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 2: Atomic Controls & Disclosures |
| **Default Fixed Host** | `div[role="separator"]` |
| **State Substrate** | Drag session store & flex/pixel resize math |
| **Upstream Dependencies** | `Slot` |
| **Downstream Consumers** | Resizable sidebars, code editor panels, dashboard layouts |
| **Exported Parts** | `Splitter.Root`, `Splitter.Panel`, `Splitter.Handle` |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/Splitter/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/splitter.spec.ts`
  - **Current Automated Suite**: 1 test (`SP-DOM-01`: Renders panels, handle updates layout via drag/keys).
- **Cosmos Harness**: `Splitter.fixture.tsx` (Horizontal & vertical splitters with min/max constraints).
- **Executable Contract Count**: 83 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Panel Min / Max Constraints**: Strict pixel and percentage clamping on panel sizes.
- **Collapse Thresholds**: Snapping panel to 0 size when dragged below `collapseThreshold`.
- **Keyboard Stepping**: ArrowLeft/Right or Up/Down resizing panels; Home/End collapsing or fully expanding.
- **Nested Splitters**: Vertical splitter nested inside horizontal splitter with independent drag sessions.
- **CSS Size Variables**: Publishing `--reference-panel-size` for consumer CSS layouts.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Handle has `role="separator"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-orientation`.
- `PART-CONTROL-01`: Controlled layout sizes respecting parent update rejection.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/react-resizable-panels`**:
  Panel constraint solver, flex-grow/pixel math, collapse thresholds, keyboard stepping.

- **`vendor/zag/packages/machines/splitter`**:
  Pointer drag session, orientation-specific delta calculation.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Panel constraint math, drag delta accumulation, keyboard stepping matrix.
- **LEAVE**: Heavy multi-context provider trees, proprietary CSS layouts.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Pure Model Unit Tests**: Author `matrix/lib/tests/unit/splitter.test.ts` for panel layout constraint solver.

### Step 2: **Automate SP-DRAG-01**: Test pointer dragging with min/max boundary clamping in Playwright.

### Step 3: **Automate SP-COLL-01**: Test panel collapse threshold snapping.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Splitter.md`](./Splitter.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
