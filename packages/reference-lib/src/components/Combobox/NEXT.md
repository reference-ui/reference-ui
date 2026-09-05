# Combobox Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `Combobox` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 3: Composite Selection & Navigation Widgets |
| **Default Fixed Host** | `input[role="combobox"]` |
| **State Substrate** | Input & popup coordinator, active-descendant roving |
| **Upstream Dependencies** | `Listbox`, `Popover`, `Field` |
| **Downstream Consumers** | Command palettes, autocomplete search bars, tagged input selectors |
| **Exported Parts** | `Combobox.Root`, `Combobox.Input`, `Combobox.Trigger`, `Combobox.Popover`, `Combobox.Listbox`, `Combobox.Option` |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/Combobox/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/combobox.spec.ts`
  - **Current Automated Suite**: 1 test (`CB-DOM-01`: Renders input, opens popover, selects option, closes).
- **Cosmos Harness**: `Combobox.fixture.tsx` (Searchable dropdown with filtering).
- **Executable Contract Count**: 97 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Active-Descendant Model**: Physical focus must stay in `<input>` while virtual focus traverses options via `aria-activedescendant`.
- **Autocomplete Modes**: Complete verification of `autocomplete="none" | "list" | "both" | "inline"`.
- **Keyboard Navigation**: ArrowDown opens popup and highlights first option; Escape closes popup; Enter commits highlighted option without submitting parent `<form>`.
- **Async Loading & Filtering**: Dynamic option list updates with loading spinner state and accessible empty announcement.
- **Form Participation**: Submitting selected value via canonical hidden `<input>`.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Ensure input has `role="combobox"`, `aria-autocomplete`, `aria-expanded`, and `aria-controls` pointing to `Listbox`.
- `PART-CONTROL-01`: Controlled `value` and `open` states must respect parent callback cancellation.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/downshift/src/hooks/useCombobox`**:
  Input focus preservation while traversing listbox, active-descendant synchronization, input value reset on blur.

- **`vendor/react-spectrum/packages/react-aria-components/test/ComboBox.test.js`**:
  Autocomplete list modes, filter predicates, clear button handling, custom value entry, form submit prevention on Enter.

- **`vendor/cmdk/src/index.tsx`**:
  CommandPalette composite pattern, filtering score integration, keyboard shortcut binding.

- **`vendor/zag/packages/machines/combobox`**:
  Popup positioning coordination, hover vs arrow selection synchronization.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Active-descendant roving logic, APG keyboard interaction matrix, input commit semantics.
- **LEAVE**: Downshift render-prop API, cmdk internal scoring engine (app-level responsibility), heavy context trees.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Automate CB-KEY-01 to CB-KEY-08**: Test ArrowDown, ArrowUp, Enter, Escape, and Tab navigation in `combobox.spec.ts`.

### Step 2: **Automate CB-ACT-01 to CB-ACT-04**: Verify `aria-activedescendant` updates on highlight while input retains active focus.

### Step 3: **Automate CB-FORM-01**: Test form submission with selected option and form reset restoration.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Combobox.md`](./Combobox.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
