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

### Architectural Philosophy: Agent-First Transparency & Conservative State
Per [components.md](../components.md), Reference UI is an **agent-first, primitive-first** design system. Primitives centralize only invariant, difficult platform behaviors (e.g. DOM semantics, roving focus, typeahead buffer timing) while leaving application state and visual styling fully transparent and composable.
- **Conservative on Internal State**: Do NOT build monolithic, opaque stateful conveniences (e.g. desktop `Shift+Arrow` range-selection algorithms or modifier-key toggle engines) inside `Listbox`.
- **Extendable Multi-Selection Contract**: Multi-selection should remain a clean, controlled prop interface: `selection="multiple"`, `value: string[]`, and `onChange: (next: string[]) => void`. The application/agent owns the state; `Listbox` coordinates the collection ARIA attributes (`aria-multiselectable`) and roving focus.
- **Styling Transparency**:
  - An agent or developer must be able to style selected states with zero friction using standard data attributes (`data-state="selected"`, `aria-selected="true"`) or token-aware `_selected={{ ... }}` StyleProps.
  - The primitive must not lock in rigid, opinionated styles (e.g. hardcoded colors that require `!important` or aggressive overrides).
  - Composition-first: users and agents can trivially embed a `<Checkbox>`, badge, or custom icon inside `<Listbox.Option>` without fighting an internal widget context.

### Functional & Behavioral Gaps
- **Transparent Multi-Selection Extendability**: Verify `selection="multiple"` cleanly toggles individual option inclusion in the controlled `value` array and sets `aria-multiselectable="true"` without opaque range math.
- **Option Styling & State Affordances**: Ensure `Listbox.Option` reliably exposes `data-state="selected|unselected"`, `aria-selected="true|false"`, and accepts `_selected` / `_hover` token props cleanly.
- **Typeahead Search**: Rapid alphanumeric key presses jumping to matching option by prefix via `RovingFocus` typeahead buffer.
- **Disabled Options**: Skipping disabled options in arrow traversal and preventing selection without trapping focus.
- **Virtualization Contract**: Support lightweight logical metadata adapter (`virtual={items, scrollToIndex}`) for large collections without bundling a heavyweight virtualizer.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Strict `role="listbox"`, `role="option"`, `aria-selected`, `aria-multiselectable`.
- `PART-STYLE-01`: Token-aware StyleProps passthrough on `Listbox.Root` and `Listbox.Option` without style collisions.
- `PART-CONTROL-01`: Controlled `value` prop respecting parent callback rejection.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability while adhering strictly to our conservative state boundary:

### Primary Upstream Reference Packages
- **`vendor/radix-primitives/packages/react/select`**:
  Option registration model, typeahead buffer clearing, scroll-into-view on highlight.
- **`vendor/zag/packages/machines/listbox`**:
  Clean separation between roving focus and selection state.
- **`vendor/react-spectrum/packages/react-aria-components/test/ListBox.test.js`**:
  Contrast reference: observe how React Aria bundles heavy selection managers (which we intentionally leave in favor of transparent controlled arrays).

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Roving focus coordination, typeahead character buffer with 1000ms timeout, disabled option skipping, `aria-selected` / `aria-multiselectable` ARIA contracts.
- **LEAVE**: Heavy desktop range-selection state machines (Shift+Click ranges, drag lasso), proprietary selection managers, bloated context providers, opinionated visual checkmark injection.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Automate LB-DOM-01 & LB-MULTI-01**: Playwright test asserting `selection="multiple"` sets `aria-multiselectable="true"` and emits updated `string[]` arrays on option toggle.

### Step 2: **Verify Styling Transparency**: Add Cosmos fixtures demonstrating how an agent or user easily styles multi-select states (e.g. via `data-state="selected"`, token props `_selected`, and embedding a `<Checkbox />`).

### Step 3: **Automate LB-TYPE-01**: Typeahead jumping to matching option prefix via RovingFocus in Playwright.

### Step 4: **Automate LB-DIS-01**: Skipping disabled options during arrow navigation.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Listbox.md`](./Listbox.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
