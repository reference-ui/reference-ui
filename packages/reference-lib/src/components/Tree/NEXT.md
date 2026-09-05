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

### Architectural Philosophy: Agent-First Transparency & Conservative State
Per [components.md](../components.md), Reference UI is an **agent-first, primitive-first** design system.
- **Hierarchical Invariants over Stateful Monoliths**: `Tree`'s core mandate is centralizing difficult hierarchical keyboard invariants (ArrowRight/ArrowLeft parent-child traversal and expand/collapse coordination) and ARIA semantics (`role="tree"`, `role="treeitem"`, `aria-level`, `aria-expanded`).
- **Conservative on Selection State**: Do NOT build a monolithic, desktop-style multi-selection state machine (e.g. multi-level `Shift+Arrow` range math across collapsed branches or `Cmd+Click` modifier toggles) inside `Tree`. Multi-selection is controlled application state (`selectedKeys: string[]` + `onSelectChange`) or achieved transparently by composing a `<Checkbox />` inside `<Tree.Item>`.
- **Frictionless Styling**:
  - An agent or developer must be able to style open/closed and selected states using standard data attributes (`data-state="open|closed"`, `data-selected="true|false"`, `aria-selected="true|false"`) and token props (`_selected`, `_hover`).
  - Indentation should be CSS-driven (via `--reference-tree-level` or standard padding tokens), not rigid hardcoded pixel offsets.

### Functional & Behavioral Gaps
- **Hierarchical Keyboard Navigation**: ArrowRight on closed node expands it; ArrowRight on open node moves to first child. ArrowLeft on open node closes it; ArrowLeft on closed node moves focus to parent node.
- **APG Tree Roles & Level Semantics**: Strict verification of `role="tree"`, `role="treeitem"`, `aria-expanded`, and `aria-level` derived dynamically from hierarchy.
- **Typeahead Across Visible Nodes**: Typing alphanumeric characters jumping to matching visible tree items via `RovingFocus`.
- **Transparent Selection Composition**: Verify clean controlled selection (`selectedKeys: string[]`) and effortless composition with a `<Checkbox>` without focus or layout collision.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Strict hierarchical role and relationship verification.
- `PART-STYLE-01`: Token-aware StyleProps passthrough on `Tree.Root`, `Tree.Item`, and `Tree.Content`.
- `PART-CONTROL-01`: Controlled expanded keys and selected keys respecting parent callback cancellation.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability while adhering strictly to our conservative state boundary:

### Primary Upstream Reference Packages
- **`vendor/react-spectrum/packages/@react-aria/tree`**:
  Hierarchical arrow navigation algorithms (ArrowRight/Left parent-child movement) and `aria-level` calculation.
- **`vendor/zag/packages/machines/tree-view`**:
  Expansion toggle state machine and focused node tracking.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Hierarchical arrow navigation logic, parent/child focus transitions, APG `aria-level` attributes, typeahead buffer integration.
- **LEAVE**: Heavy desktop range-selection state machines (multi-branch Shift+Click selection), proprietary collection managers, rigid indented markup wrappers.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Automate TR-KEY-01 to TR-KEY-04**: Playwright tests for ArrowRight (expand / move to child) and ArrowLeft (collapse / move to parent).

### Step 2: **Automate TR-LEVEL-01**: Verification of `aria-level` attributes across nested branches.

### Step 3: **Verify Styling & Checkbox Composition**: Author Cosmos fixture demonstrating how an agent or developer easily composes `<Tree.Item>` with a `<Checkbox />` and styles selected states via `data-selected`.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Tree.md`](./Tree.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
