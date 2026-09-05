# Menu Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `Menu` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 3: Composite Selection & Navigation Widgets |
| **Default Fixed Host** | `div[role="menu"]` |
| **State Substrate** | Submenu intent store & layer stack |
| **Upstream Dependencies** | `Overlay`, `RovingFocus` |
| **Downstream Consumers** | Dropdown menus, context menus, action sheets, navigation flyouts |
| **Exported Parts** | `Menu.Root`, `Menu.Trigger`, `Menu.Content`, `Menu.Item`, `Menu.CheckboxItem`, `Menu.RadioGroup`, `Menu.RadioItem`, `Menu.Submenu`, `Menu.SubmenuTrigger`, `Menu.SubmenuContent`, `Menu.Separator` |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/Menu/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/menu.spec.ts`
  - **Current Automated Suite**: 1 test (`MN-DOM-01`: Renders trigger, opens content, selects item, closes).
- **Cosmos Harness**: `Menu.fixture.tsx` (Dropdown with nested submenu and checkbox items).
- **Executable Contract Count**: 91 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Nested Submenus**: ArrowRight opens submenu and moves focus to first item; ArrowLeft closes submenu and returns focus to trigger.
- **Safe Hover Intent / Grace Polygon**: Moving pointer diagonally across trigger towards submenu content must not accidentally close the submenu.
- **Checkbox & Radio Items**: Full APG support for `role="menuitemcheckbox"` and `role="menuitemradio"` with `aria-checked`.
- **Layered Escape Dismissal**: Pressing Escape in a submenu closes only that submenu; second Escape closes the root menu.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Strict verification of `role="menu"`, `role="menuitem"`, `aria-haspopup="menu"`.
- `PART-EVENT-01`: Item `onSelect` running before internal menu close; `event.preventDefault()` keeping menu open.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/radix-primitives/packages/react/menu/src/menu.test.tsx`**:
  Submenu hover grace triangle polygon, submenu keyboard open/close, checkbox/radio item states.

- **`vendor/base-ui/packages/react/src/menu`**:
  Unified layer stack integration for Menu inside Dialog.

- **`vendor/react-spectrum/packages/react-aria-components/test/Menu.test.js`**:
  APG keyboard traversal, item selection callbacks, disabled items.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Safe hover polygon calculation, submenu keyboard hierarchy, menu item selection eventing.
- **LEAVE**: Radix proprietary styling, base-ui context contracts, icon packages.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Automate MN-SUB-01 & MN-SUB-02**: Playwright tests for nested submenu open/close via keyboard and pointer.

### Step 2: **Automate MN-POLY-01**: Test safe hover triangle polygon preventing submenu collapse.

### Step 3: **Automate MN-ESC-01**: Test hierarchical Escape key dismissal.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Menu.md`](./Menu.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
