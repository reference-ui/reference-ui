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

### Architectural Philosophy: Agent-First Transparency & Composable Anatomy
Per [components.md](../components.md), Reference UI rejects monolithic widgets that hide markup or bake in hardcoded visuals:
- **Composable Indicators over Hardcoded Icons**: Currently, `MenuCheckboxItem` hardcodes a Unicode checkmark (`{checked ? '✓' : ''}`). This prevents agents and users from using custom icons, radio dots, or theme-specific checkmarks. We must remove this hardcoded markup and support composable indicator patterns (e.g. `<Menu.ItemIndicator>` or direct JSX child composition conditioned on `data-state="checked"`).
- **Styling Transparency**:
  - `MenuItem` and `MenuContent` must avoid hardcoded non-token values (such as `colors.gray.100`) or aggressive inline box shadows that force overrides.
  - Expose authoritative data attributes (`data-state="open|closed"`, `data-highlighted`, `data-disabled`) so styling is purely declarative.
- **Conservative Layer Composition**: Menu delegates floating positioning and layer stack management directly to [Overlay](../Overlay) with `isolation={false}`. It must not invent a parallel overlay or portal runtime.

### Functional & Behavioral Gaps
- **Composable Checkbox & Radio Items**: Replace hardcoded `{checked ? '✓' : ''}` in `MenuCheckboxItem` with a transparent indicator contract where users/agents can pass any SVG icon or indicator.
- **Nested Submenus**: ArrowRight opens submenu and moves focus to first item; ArrowLeft closes submenu and returns focus to trigger without closing parent menu.
- **Safe Hover Intent / Grace Polygon**: Moving pointer diagonally across trigger towards submenu content must not accidentally close the submenu before pointer reaches the target.
- **Layered Escape Dismissal**: Pressing Escape in a submenu closes only that submenu; second Escape closes the root menu.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Strict verification of `role="menu"`, `role="menuitem"`, `role="menuitemcheckbox"`, `role="menuitemradio"`, `aria-haspopup="menu"`.
- `PART-STYLE-01`: Token-aware StyleProps passthrough on `Menu.Content` and `Menu.Item`.
- `PART-EVENT-01`: Item `onSelect` running before internal menu close; `event.preventDefault()` keeping menu open.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability while adhering strictly to our conservative state boundary:

### Primary Upstream Reference Packages
- **`vendor/radix-primitives/packages/react/menu/src/menu.test.tsx`**:
  Submenu hover grace triangle polygon, submenu keyboard open/close, checkbox/radio item states.
- **`vendor/base-ui/packages/react/src/menu`**:
  Unified layer stack integration for Menu inside Dialog.
- **`vendor/react-spectrum/packages/react-aria-components/test/Menu.test.js`**:
  APG keyboard traversal, item selection callbacks, disabled items.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Safe hover polygon calculation, submenu keyboard hierarchy, menu item selection eventing.
- **LEAVE**: Radix proprietary styling, base-ui context contracts, hardcoded icon packages.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Fix Composable Indicator Anatomy**: Refactor `MenuCheckboxItem` in `Menu.tsx` to remove the hardcoded `{checked ? '✓' : ''}` string and expose clean `data-state="checked"` styling or an indicator slot.

### Step 2: **Tokenize Menu Styles**: Replace hardcoded `colors.gray.100` and rigid dimensions with token-aware defaults.

### Step 3: **Automate MN-SUB-01 & MN-SUB-02**: Playwright tests for nested submenu open/close via keyboard and pointer.

### Step 4: **Automate MN-POLY-01**: Test safe hover triangle polygon preventing premature submenu collapse.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Menu.md`](./Menu.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
