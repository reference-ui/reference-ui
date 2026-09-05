# Overlay Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `Overlay` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 1: Overlays, Popups & Visual Substrate |
| **Default Fixed Host** | `div[data-reference-overlay]` |
| **State Substrate** | Document layer registry & Floating UI positioning |
| **Upstream Dependencies** | `Portal`, `Presence`, `FocusLock` |
| **Downstream Consumers** | `Popover`, `Menu`, `Tooltip`, dialogs, drawers, sheets, modals |
| **Exported Parts** | `Overlay.Root`, `Overlay.Trigger`, `Overlay.Backdrop`, `Overlay.Content`, `Overlay.Close`, `Overlay.Handle` |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/Overlay/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/overlay.spec.ts`
  - **Current Automated Suite**: 7 tests (`OV-DOM-01`, `OV-POS-01`, `OV-TRG-02`, backdrop dismiss, escape dismiss, focus trap).
- **Cosmos Harness**: `Overlay.fixture.tsx` (Centered modal, sheet drawer with edge drag, nested layers).
- **Executable Contract Count**: 132 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Edge / Sheet Gestures**: Handle-only edge dragging (`edge="bottom|top|left|right"`), velocity thresholds, swipe dismiss.
- **Hierarchical Dismissal**: Outside-click and Escape dismissing top-most layer without leaking to ancestor layers.
- **iOS Body Scroll Lock**: Full visualViewport and body touch-move lock during active modal session.
- **Inert Background Subtree**: Applying `inert` or `aria-hidden` to external DOM trees while modal is active.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Root contributes no extra wrapper; Content is `div[data-reference-overlay]`.
- `PART-STATE-01`: Authoritative `data-state="open|closed"` during presence exit.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/floating-ui/packages/core/src/computePosition.ts`**:
  Anchored positioning, middleware (`flip`, `shift`, `offset`, `arrow`, `size`, `hide`).

- **`vendor/radix-primitives/packages/react/dismissable-layer`**:
  Nested layer stack, outside pointer down checking, Escape dispatch order.

- **`vendor/vaul`**:
  Edge sheet dragging, handle-only drag threshold, velocity-based close.

- **`vendor/react-remove-scroll`**:
  iOS visualViewport scrollbar compensation and touch scroll prevention.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Layer stack registry, outside dismiss branch checking, sheet drag physics, floating-ui placement.
- **LEAVE**: Vaul page-scale animations, floating-ui React tree context, Radix dialog styling.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Automate OV-EDGE-01 to OV-EDGE-04**: Test bottom/side sheet dragging and velocity dismiss in Playwright.

### Step 2: **Automate OV-STACK-01**: Verify nested overlay Escape and outside-click ordering.

### Step 3: **Automate OV-SCROLL-01**: Test body scroll locking.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Overlay.md`](./Overlay.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
