# Collapsible Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `Collapsible` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 2: Atomic Controls & Disclosures |
| **Default Fixed Host** | `div[data-reference-collapsible]` |
| **State Substrate** | Controlled open state & size measurement engine |
| **Upstream Dependencies** | `Presence` |
| **Downstream Consumers** | `Accordion`, `Tree`, collapsible sidebars, expandable card content |
| **Exported Parts** | `Collapsible.Root`, `Collapsible.Trigger`, `Collapsible.Content` |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/Collapsible/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/collapsible.spec.ts`
  - **Current Automated Suite**: 2 tests (`CO-DOM-01, 02, 04`: Toggle open/closed and ARIA linkage; `CO-SIZE-01`: Measured CSS variables).
- **Cosmos Harness**: `Collapsible.fixture.tsx` (Smooth animation & nested disclosure).
- **Executable Contract Count**: 39 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Interrupted Animation Handling**: Rapid toggle while mid-transition must cleanly reverse without layout jumps or stale height locks.
- **CSS Variables Lifecycle**: Verification that `--reference-collapsible-content-height` and `--reference-collapsible-content-width` update dynamically during window resizing or content mutation.
- **Disabled Trigger State**: Ensure trigger with `disabled={true}` ignores Space/Enter key presses and pointer clicks.
- **Nested Collapsibles**: Independent trigger/content linkage when one Collapsible is nested inside another without event pollution.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Assert transparent root contributes no wrapper DOM node (Trigger is `button`, Content is `div`).
- `PART-EVENT-01`: PreventDefault on Trigger click must abort the disclosure request.
- `PART-CONTROL-01`: Verify controlled `open` prop does not update DOM if parent callback ignores `onOpenChange`.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/radix-primitives/packages/react/collapsible/src/collapsible.test.tsx`**:
  Trigger to content ARIA linkage (`aria-controls`, `aria-expanded`), disabled trigger behavior, native button prop forwarding.

- **`vendor/base-ui/packages/react/src/collapsible/panel/CollapsiblePanel.test.tsx`**:
  Interrupted transitions, measured close animation, initially-open motion, ResizeObserver content measurement.

- **`vendor/zag/packages/machines/collapsible`**:
  State machine states: closed -> opening -> open -> closing -> closed.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Border-box dimension measurement, interrupted transition recovery, ARIA linkage contract.
- **LEAVE**: Radix context provider, polymorphic `asChild` props, hardcoded CSS animation classes.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Automate CO-ANIM-01 to CO-ANIM-05**: Test interrupted CSS transitions and dynamic content resize in Playwright.

### Step 2: **Automate CO-NEST-01**: Test nested collapsible components to ensure event boundaries hold.

### Step 3: **Verify PART-STYLE-01**: Assert token-aware StyleProps passthrough on Content and Trigger.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Collapsible.md`](./Collapsible.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
