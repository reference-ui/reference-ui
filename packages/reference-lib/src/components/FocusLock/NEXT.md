# FocusLock Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `FocusLock` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 0: Authoring & Runtime Foundations |
| **Default Fixed Host** | Container element / Shard refs |
| **State Substrate** | Tabbable tree solver & focus boundary traps |
| **Upstream Dependencies** | Core utils |
| **Downstream Consumers** | `Overlay`, modal dialogs, drawers, popups |
| **Exported Parts** | `FocusLock.Root` (also exported as `FocusLock`) |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/FocusLock/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/focus-lock.spec.ts`
  - **Current Automated Suite**: 5 tests (`FL-INIT-01`, `FL-TAB-02/03`, etc.).
- **Cosmos Harness**: None (Tier 0 foundation primitive; needs fixture in Cosmos).
- **Executable Contract Count**: 72 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Multi-Container Shards**: Support for `shards` prop allowing focus to legitimately move into external portaled containers (e.g. nested date picker or tooltip).
- **Return Focus Restoration**: Clean restoration of focus to previously active element on unmount, handling cases where the previous element has been detached.
- **Initial Focus Resolution**: Support for `initialFocus` function or ref selector to focus specific element on activation.
- **Nested Lock Stacking**: Inner FocusLock yielding cleanly back to outer FocusLock upon deactivation.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-REF-01`: Multi-ref attachment across React 17/18/19.
- `PART-DOM-02`: Transparent wrapping without adding unwanted DOM nodes.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/focus-lock` & `vendor/react-focus-lock`**:
  Tabbable resolution logic, focus guards, iframe/shadow DOM traversal, synthetic Tab interception.

- **`vendor/tabbable`**:
  Sequential navigation order determination, negative tabIndex exclusion, hidden/inert element checks.

- **`vendor/radix-primitives/packages/react/focus-scope`**:
  Focus trapping loop, shard/branch registration, return focus safety checks.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Tabbable solver algorithms, focus boundary guards, shard tracking.
- **LEAVE**: Heavy multi-package dependencies, wrapper divs, public React context trees.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Add Cosmos Fixture**: Author `FocusLock.fixture.tsx` demonstrating basic trap, shards, and return focus.

### Step 2: **Automate FL-SHARD-01 & FL-SHARD-02**: Test focus movement between main container and portaled shard.

### Step 3: **Automate FL-NEST-01**: Test nested dialog FocusLock activation and cleanup.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`FocusLock.md`](./FocusLock.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
