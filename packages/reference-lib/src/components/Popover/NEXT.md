# Popover Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `Popover` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 1: Overlays, Popups & Visual Substrate |
| **Default Fixed Host** | `div[data-reference-popover]` |
| **State Substrate** | Hover intent store & collision detection |
| **Upstream Dependencies** | `Overlay`, `Slot` |
| **Downstream Consumers** | `Combobox`, `DateField`, `Tooltip`, info popups, filter flyouts |
| **Exported Parts** | `Popover.Root`, `Popover.Trigger`, `Popover.Content`, `Popover.Arrow`, `Popover.Close` |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/Popover/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/popover.spec.ts`
  - **Current Automated Suite**: 4 tests (`PO-DOM-01`, `PO-DOM-02`, click trigger toggle, escape dismiss).
- **Cosmos Harness**: `Popover.fixture.tsx` (Click popover, hover popover with grace polygon, arrow).
- **Executable Contract Count**: 95 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Hover Trigger Mode & Grace Polygon**: Hover-activated popover (`trigger="hover"`) with safe polygon keeping popup open when moving cursor to content.
- **Collision Flipping & Shifting**: Automatic repositioning when approaching viewport boundary.
- **Custom Anchor Elements**: Supporting virtual or detached anchor elements via `anchorRef`.
- **Nested Popovers**: Nested popover dismissal without closing parent container.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Fixed host is `div[data-reference-popover]`.
- `PART-PROP-01`: Native prop and StyleProps forwarding on `Popover.Content` and `Arrow`.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/radix-primitives/packages/react/popover`**:
  Trigger to content ARIA linking (`aria-haspopup="dialog"`, `aria-expanded`), arrow placement.

- **`vendor/base-ui/packages/react/src/popover`**:
  Hover intent and safe polygon edge cases.

- **`vendor/floating-ui`**:
  Arrow middleware math and offset calculation.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Collision detection, hover grace polygon, arrow offset math.
- **LEAVE**: Radix popper wrapper elements, Base UI context providers.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Automate PO-HOVER-01 & PO-HOVER-02**: Playwright test for hover trigger and safe diagonal pointer movement.

### Step 2: **Automate PO-COLL-01**: Test collision flip and shift at viewport edges.

### Step 3: **Automate PO-ARROW-01**: Verify Popover.Arrow computes correct SVG rotation and position.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Popover.md`](./Popover.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
