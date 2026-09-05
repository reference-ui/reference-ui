# Tabs Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `Tabs` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 2: Atomic Controls & Disclosures |
| **Default Fixed Host** | `div` / `button[role="tab"]` |
| **State Substrate** | Instance active-tab store & roving tabIndex |
| **Upstream Dependencies** | `RovingFocus` |
| **Downstream Consumers** | Tabbed page navigation, code snippet language selectors, settings panels |
| **Exported Parts** | `Tabs.Root`, `Tabs.List`, `Tabs.Trigger`, `Tabs.Content` |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/Tabs/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/tabs.spec.ts`
  - **Current Automated Suite**: 1 test (`TB-DOM-01, 03, 04`: Renders tablist, tabs, panels with active selection and ARIA linkage).
- **Cosmos Harness**: `Tabs.fixture.tsx` (Horizontal & vertical tabs, automatic/manual activation).
- **Executable Contract Count**: 49 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Activation Modes**: `activationMode="automatic"` (arrow key immediately activates tab) vs `activationMode="manual"` (arrow key roves focus, Space/Enter activates).
- **Vertical Tabs**: `orientation="vertical"` using ArrowUp/ArrowDown navigation.
- **Dynamic Tabs**: Adding or removing tabs while preserving active tab state.
- **Disabled Tabs**: Skipping disabled tab triggers in keyboard traversal.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`.
- `PART-CONTROL-01`: Controlled `value` prop with parent callback rejection.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/radix-primitives/packages/react/tabs`**:
  Roving tabIndex integration, automatic vs manual activation modes, orientation handling.

- **`vendor/react-spectrum/packages/@react-aria/tabs`**:
  APG tablist keyboard matrix, tab panel focusability.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Roving tab navigation, manual vs automatic activation modes, panel ARIA linkage.
- **LEAVE**: Radix custom indicator animations, React Aria complex provider nesting.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Automate TB-ACT-01 & TB-ACT-02**: Test automatic vs manual tab activation in Playwright.

### Step 2: **Automate TB-VERT-01**: Test vertical orientation ArrowUp/ArrowDown navigation.

### Step 3: **Automate TB-DIS-01**: Test disabled tab skipping.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Tabs.md`](./Tabs.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
