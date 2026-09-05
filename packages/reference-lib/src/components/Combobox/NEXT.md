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

### Architectural Philosophy: Agent-First Transparency & Conservative State
Per [components.md](../components.md), Reference UI separates invariant browser coordination from application logic:
- **Focus & Virtual Selection Invariant**: Combobox's sole difficult responsibility is ensuring DOM focus remains locked inside `<input role="combobox">` while virtual selection coordinates with `<Listbox>` options via `aria-activedescendant`.
- **Filtering & Ranking are Application-Owned**: Do NOT bake fuzzy-scoring algorithms (like `command-score.ts`) or async query/loading state machines into `Combobox`. An agent or application simply filters its items array and renders `<Combobox.Option>` elements.
- **Styling Transparency**:
  - The input bezel uses [Field](../Field) visual chrome (`div[data-reference-field]`).
  - Options expose `aria-selected` and `data-highlighted` for direct token-aware styling without hidden CSS overrides.

### Functional & Behavioral Gaps
- **Active-Descendant Model**: Physical focus must stay in `<input>` while virtual focus traverses options via `aria-activedescendant`.
- **Autocomplete Modes**: Verification of standard APG `aria-autocomplete="list | both | none"`.
- **Keyboard Navigation**: ArrowDown opens popup and highlights first option; Escape closes popup; Enter commits highlighted option without submitting parent `<form>`.
- **Native Form Participation**: Submitting selected value via canonical hidden `<input name="...">`.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Ensure input has `role="combobox"`, `aria-autocomplete`, `aria-expanded`, and `aria-controls` pointing to `Listbox`.
- `PART-STYLE-01`: Token-aware StyleProps passthrough on `Combobox.Input` and `Combobox.Trigger`.
- `PART-CONTROL-01`: Controlled `value` and `open` states must respect parent callback cancellation.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability while adhering strictly to our conservative state boundary:

### Primary Upstream Reference Packages
- **`vendor/downshift/src/hooks/useCombobox`**:
  Input focus preservation while traversing listbox, active-descendant synchronization, input value reset on blur.
- **`vendor/react-spectrum/packages/react-aria-components/test/ComboBox.test.js`**:
  APG keyboard interaction matrix, Enter key form submission suppression, clear button handling.
- **`vendor/cmdk/src/index.tsx`**:
  Contrast reference: observe how cmdk composes Combobox with Dialog. Note that cmdk's internal scoring engine (`command-score.ts`) is explicitly left to application code.
- **`vendor/zag/packages/machines/combobox`**:
  State machine transitions for input focus and popup coordination.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Active-descendant roving logic, APG keyboard interaction matrix, input commit semantics.
- **LEAVE**: Downshift render-prop API, internal fuzzy search scoring engine (application-owned), async data-loading state machines.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Automate CB-KEY-01 to CB-KEY-08**: Test ArrowDown, ArrowUp, Enter, Escape, and Tab navigation in `combobox.spec.ts`.

### Step 2: **Automate CB-ACT-01 to CB-ACT-04**: Verify `aria-activedescendant` updates on highlight while input retains active focus.

### Step 3: **Automate CB-FORM-01**: Test form submission with selected option and form reset restoration.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Combobox.md`](./Combobox.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
