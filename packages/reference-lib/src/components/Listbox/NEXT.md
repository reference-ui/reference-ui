# Listbox Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `Listbox` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 3: Composite Selection & Navigation Widgets |
| **Default Fixed Host** | `div[role="listbox"]` |
| **State Substrate** | Instance selection store & roving focus |
| **Upstream Dependencies** | `RovingFocus`, `Slot` |
| **Downstream Consumers** | `Combobox`, custom selects, multi-option pickers |
| **Exported Parts** | `Listbox.Root`, `Listbox.Option`, `Listbox.Group`, `Listbox.GroupLabel` |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/Listbox/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/listbox.spec.ts`
  - **Current Automated Suite**: 1 test (`LB-DOM-01`: Renders listbox and options, selects option on click).
- **Cosmos Harness**: `Listbox.fixture.tsx` (Single & multi-select listbox).
- **Executable Contract Count**: 73 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Multi-Selection Support**: `selectionMode="multiple"` with Ctrl/Cmd+Click and Shift+Arrow range selection.
- **Typeahead Search**: Rapid alphanumeric key presses jumping to matching option by prefix.
- **Disabled Options**: Skipping disabled options in arrow traversal and preventing selection.
- **Virtualization Integration**: Support for large option lists with dynamic DOM recycling.
- **Form Participation**: Serializing selected value(s) into hidden input.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Strict `role="listbox"`, `role="option"`, `aria-selected`, `aria-multiselectable`.
- `PART-CONTROL-01`: Controlled `value` prop respecting parent rejection.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/react-spectrum/packages/react-aria-components/test/ListBox.test.js`**:
  Multi-selection algorithms, disabled keys filtering, virtual collection traversal.

- **`vendor/radix-primitives/packages/react/select`**:
  Option registration, typeahead buffer clearing, scroll-into-view on highlight.

- **`vendor/zag/packages/machines/listbox`**:
  Roving focus vs active-descendant selection states.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Typeahead matching, multi-select range selection, virtual collection indexing.
- **LEAVE**: Select popup mechanics (owned by Combobox/Popover), heavy context contracts.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Automate LB-MULTI-01 & LB-MULTI-02**: Multi-selection click and keyboard range selection.

### Step 2: **Automate LB-TYPE-01**: Typeahead jumping to matching option in Playwright.

### Step 3: **Automate LB-DIS-01**: Skipping disabled options during arrow navigation.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Listbox.md`](./Listbox.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
