# Accordion Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `Accordion` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 2: Atomic Controls & Disclosures |
| **Default Fixed Host** | `div[data-reference-accordion]` |
| **State Substrate** | Instance collection store (Zustand / local hook) |
| **Upstream Dependencies** | `Collapsible`, `RovingFocus` |
| **Downstream Consumers** | Product disclosure groups, FAQ layouts, settings menus |
| **Exported Parts** | `Accordion.Root`, `Accordion.Item`, `Accordion.Header`, `Accordion.Trigger`, `Accordion.Content` |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/Accordion/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/accordion.spec.ts`
  - **Current Automated Suite**: 1 test (`AC-DOM-01`: Single expansion manages item visibility and arrow traversal).
- **Cosmos Harness**: `Accordion.fixture.tsx` (Single & Multiple expansion examples).
- **Executable Contract Count**: 41 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Single vs Multiple Mode Collapsing**: In single expansion mode, activating an already-open item must request `null`. In multiple mode, selected values must be emitted as an array sorted in DOM order.
- **Tab Stop Preservation**: APG Accordion specifies that header buttons remain native Tab stops (not roving composite stops). Verify Accordion never traps or reduces header buttons to one tab stop.
- **Keyboard Traversal Opt-Out**: `keyboard="none"` prop must completely disable ArrowUp/ArrowDown traversal while preserving native button clicks.
- **Disabled Item Traversal**: Items with `disabled={true}` must be skipped during ArrowUp/ArrowDown keyboard navigation and must ignore activation.
- **Dynamic Item Mutation**: Inserting, removing, or reordering Accordion items dynamically must update the internal collection without state corruption.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-STYLE-01`: Token-aware StyleProps, `css`, and responsive `r` on `Accordion.Root`, `Item`, and `Header`.
- `PART-REF-01` & `PART-REF-02`: Composed refs on `Accordion.Root` and `Accordion.Item` without render loops.
- `PART-CONTROL-01`: Ensure no state mutation occurs if consumer rejects `onChange` in controlled mode.
- `PART-EVENT-01`: Consumer `onClick` and `onKeyDown` run first; `event.preventDefault()` stops internal toggle.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/radix-primitives/packages/react/accordion/src/accordion.test.tsx`**:
  Single/multiple value policy, disabled items skipping, horizontal vs vertical orientation key handling, wrapping, Home/End navigation.

- **`vendor/base-ui/packages/react/src/accordion/root/AccordionRoot.test.tsx`**:
  Controlled value arrays, generated vs manual trigger-to-panel IDs, cancellation via `preventDefault()`, multiple expansion order.

- **`vendor/react-spectrum/packages/react-aria-components/test/Disclosure.test.js`**:
  Controlled expanded keys, nested disclosure groups, and programmatic key expansion.

- **`vendor/zag/packages/machines/accordion`**:
  Next/previous/first/last traversal algorithms and boundary loop handling.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Header traversal algorithms, single/multi array commit logic, disabled-skip logic, controlled value sync.
- **LEAVE**: Radix Context provider nesting, Base UI polymorphic `as` props, custom SVG chevron icons, proprietary CSS themes.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Automate AC-DOM-02 & AC-DOM-03**: Forward native root props to `div` and ensure item identity stays separate from trigger-to-content linkage.

### Step 2: **Automate AC-KEY-01 to AC-KEY-06**: ArrowDown/ArrowUp traversal, Home/End jumps, loop boundary tests, and `keyboard="none"` opt-out in `accordion.spec.ts`.

### Step 3: **Automate AC-STATE-01 & AC-STATE-02**: Controlled single (`null`) and multiple (`string[]`) state rejection verification.

### Step 4: **Pure Model Tests**: Add unit tests in `matrix/lib/tests/unit/accordion.test.ts` for collection ordering and value array reducer logic.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Accordion.md`](./Accordion.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
