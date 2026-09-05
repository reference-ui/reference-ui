# RovingFocus Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `RovingFocus` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 0: Authoring & Runtime Foundations |
| **Default Fixed Host** | `div` / `ul` / Group container |
| **State Substrate** | Instance Zustand store & roving tabIndex |
| **Upstream Dependencies** | Core utils |
| **Downstream Consumers** | `Accordion`, `Calendar`, `Listbox`, `Menu`, `Tabs`, `Tree` |
| **Exported Parts** | `RovingFocus.Root`, `RovingFocus.Item` |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/RovingFocus/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/roving-focus.spec.ts`
  - **Current Automated Suite**: 5 tests (`RF-TAB-01/02`, `RF-KEY-01/07`, `RF-KEY-06`, `RF-KEY-04`, `RF-TYPE-02/03`).
- **Cosmos Harness**: None (Tier 0 foundation primitive; needs fixture in Cosmos).
- **Executable Contract Count**: 55 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **2D Grid Navigation**: Support for `orientation="both"` navigating row and column matrices via arrow keys.
- **RTL Direction Inversion**: In RTL writing mode (`dir="rtl"`), ArrowLeft and ArrowRight navigation order must flip.
- **Dynamic Item Mutation**: Updating active item index cleanly when items are inserted, removed, or disabled.
- **Looping Boundaries**: Verification that `loop={true}` wraps around ends and `loop={false}` stops at boundaries.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Root renders configured container element with exact `tabIndex=0` on active item and `-1` on others.
- `PART-STYLE-01`: StyleProps and responsive `r` passthrough on Item.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/radix-primitives/packages/react/roving-focus`**:
  Single tab stop model, arrow key matrix, Home/End navigation, loop option.

- **`vendor/downshift/src/hooks/useTagGroup/utils/useRovingTagFocus.ts`**:
  Dynamic collection tracking and focus preservation.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: 1D/2D roving tabIndex math, RTL direction flipping, typeahead buffer clearing.
- **LEAVE**: Radix collection wrapper components, public context provider soup.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Add Cosmos Fixture**: Author `RovingFocus.fixture.tsx` demonstrating 1D and 2D roving focus grids.

### Step 2: **Automate RF-2D-01 & RF-2D-02**: Test 2D row/column navigation in Playwright.

### Step 3: **Automate RF-RTL-01**: Test RTL arrow navigation inversion.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`RovingFocus.md`](./RovingFocus.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
