# Toast Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `Toast` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 1: Overlays, Popups & Visual Substrate |
| **Default Fixed Host** | `ol` / `li[role="status"]` |
| **State Substrate** | Document queue store (Zustand) & auto-dismiss timers |
| **Upstream Dependencies** | `ReferenceLibrary`, `Presence` |
| **Downstream Consumers** | Application-wide notifications, async action feedback, system alerts |
| **Exported Parts** | `Toast.Provider`, `Toast.Viewport`, `Toast.Root`, `Toast.Title`, `Toast.Description`, `Toast.Action`, `Toast.Close`, `toast` imperative API |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/Toast/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/toast.spec.ts`
  - **Current Automated Suite**: 1 test (`TO-DOM-01 & TO-DEF-01`: Displays defined toast, updates content in place, dismisses).
- **Cosmos Harness**: `Toast.fixture.tsx` (Interactive toast triggers, updates, swipe).
- **Executable Contract Count**: 77 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Swipe to Dismiss Gesture**: Pointer swipe tracking on toast item, calculating swipe threshold and triggering dismiss.
- **Timer Pause on Hover / Focus**: Hovering over toast viewport or focusing toast action pausing countdown timers.
- **Imperative Update in Place**: `toast.update(id, { title, description })` modifying active toast without restarting position.
- **Queue Limits & Stacking**: Enforcing maximum visible toast limit (`limit={3}`) with FIFO queueing.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Viewport is `ol`, Toast is `li[role="status"]` or `li[role="alert"]`.
- `PART-STATE-01`: Authoritative `data-state="open|closed"` during presence exit.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/sonner`**:
  Queue state management, update-in-place by ID, timer pausing across hover.

- **`vendor/radix-primitives/packages/react/toast`**:
  Swipe-to-dismiss gesture physics, hotkey focus jump, ARIA live region announcements.

- **`vendor/zag/packages/machines/toast`**:
  Queue limit FIFO vs LIFO policies, remaining time arithmetic.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Queue store, timer pause/resume arithmetic, swipe gesture threshold, in-place update.
- **LEAVE**: Sonner CSS visual styling and SVG icons (Reference UI uses headless tokens), Overlay nesting.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Pure Model Unit Tests**: Author `matrix/lib/tests/unit/toast.test.ts` for queue addition, FIFO limits, and pause arithmetic.

### Step 2: **Automate TO-SWIPE-01**: Test swipe-to-dismiss gesture in Playwright.

### Step 3: **Automate TO-PAUSE-01**: Test timer pause on hover.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Toast.md`](./Toast.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
