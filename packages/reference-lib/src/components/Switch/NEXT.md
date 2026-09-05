# Switch Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `Switch` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 2: Atomic Controls & Disclosures |
| **Default Fixed Host** | `button[role="switch"]` |
| **State Substrate** | Controlled boolean prop |
| **Upstream Dependencies** | `Slot` |
| **Downstream Consumers** | Settings toggles, form switches, mode toggles |
| **Exported Parts** | `Switch.Root`, `Switch.Thumb` (also exported as `Switch`) |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/Switch/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/switch.spec.ts`
  - **Current Automated Suite**: 1 test (`SW-DOM-01..03`: Renders button with default thumb, toggles checked state).
- **Cosmos Harness**: `Switch.fixture.tsx` (Default switch, disabled switch, form integration).
- **Executable Contract Count**: 27 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Native Form Participation**: Submitting `name` and `value` via hidden `<input>` only when switch is checked.
- **Form Reset Restoration**: Restoring `defaultChecked` state when parent `<form>` receives reset event.
- **Keyboard Activation**: Space key and Enter key activation matching native button semantics.
- **Disabled State**: Ignoring clicks and key presses when `disabled={true}`.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Host is native `<button>` with `role="switch"` and `aria-checked="true|false"`.
- `PART-STATE-01`: Authoritative `data-state="checked|unchecked"` on both Switch and Thumb.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/radix-primitives/packages/react/switch`**:
  Button host + Thumb child anatomy, controlled checked sync, form participation.

- **`vendor/base-ui/packages/react/src/switch`**:
  Hidden input synchronization, form reset event handling.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Button switch anatomy, hidden input form sync, form reset listener.
- **LEAVE**: Radix label wrappers, base-ui field providers.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Automate SW-FORM-01 & SW-FORM-02**: Test form submission with checked switch and form reset in Playwright.

### Step 2: **Automate SW-KEY-01**: Test Space and Enter keyboard toggles.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Switch.md`](./Switch.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
