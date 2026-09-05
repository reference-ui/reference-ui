# Tree Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `Tree` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 3: Composite Selection & Navigation Widgets |
| **Default Fixed Host** | `div[role="tree"]` |
| **State Substrate** | Tree traversal engine & recursive roving focus |
| **Upstream Dependencies** | `RovingFocus`, `Collapsible` |
| **Downstream Consumers** | File tree explorers, nested layer lists, organizational charts |
| **Exported Parts** | `Tree.Root`, `Tree.Item`, `Tree.Trigger`, `Tree.Content` |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/Tree/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/tree.spec.ts`
  - **Current Automated Suite**: 1 test (`TR-DOM-01`: Renders tree, expands node, selects item).
- **Cosmos Harness**: `Tree.fixture.tsx` (Multi-level file directory tree).
- **Executable Contract Count**: 64 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Hierarchical Keyboard Navigation**: ArrowRight on closed node expands it; ArrowRight on open node moves to first child. ArrowLeft on open node closes it; ArrowLeft on closed node moves to parent node.
- **Typeahead Across Tree**: Typing alphanumeric characters jumping to next matching visible tree item.
- **APG Tree Roles & Attributes**: `role="tree"`, `role="treeitem"`, `aria-expanded`, `aria-level`, `aria-setsize`, `aria-posinset`.
- **Multi-Selection in Hierarchy**: Selecting multiple tree items with Ctrl/Cmd and Shift.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Strict hierarchical role and relationship verification.
- `PART-CONTROL-01`: Controlled expanded keys and selected keys.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/react-spectrum/packages/@react-aria/tree`**:
  Hierarchical arrow navigation algorithm, recursive tree collection model, selection manager.

- **`vendor/zag/packages/machines/tree-view`**:
  Parent/child node state machine, expansion toggling.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Hierarchical arrow navigation logic, tree item ARIA attributes, typeahead.
- **LEAVE**: Heavy stately collection abstractions, proprietary tree styling.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Automate TR-KEY-01 to TR-KEY-06**: ArrowRight, ArrowLeft, ArrowUp, ArrowDown traversal in Playwright.

### Step 2: **Automate TR-LEVEL-01**: Verification of `aria-level`, `aria-setsize`, and `aria-posinset`.

### Step 3: **Automate TR-MULTI-01**: Multi-selection in tree hierarchy.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Tree.md`](./Tree.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
