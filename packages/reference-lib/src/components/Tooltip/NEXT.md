# Tooltip Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `Tooltip` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 1: Overlays, Popups & Visual Substrate |
| **Default Fixed Host** | `div[role="tooltip"]` |
| **State Substrate** | Document skip-delay store & Popover positioning |
| **Upstream Dependencies** | `Popover`, `ReferenceLibrary` |
| **Downstream Consumers** | Icon buttons, toolbar actions, truncated text descriptions |
| **Exported Parts** | `Tooltip.Provider`, `Tooltip.Root`, `Tooltip.Trigger`, `Tooltip.Content`, `Tooltip.Arrow` |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/Tooltip/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/tooltip.spec.ts`
  - **Current Automated Suite**: 3 tests (`TT-DOM-01..02`: ARIA description and focus; hovering trigger opens tooltip).
- **Cosmos Harness**: `Tooltip.fixture.tsx` (Default tooltip, warm-up skip delay across buttons).
- **Executable Contract Count**: 61 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Global Skip-Delay Window**: Moving cursor from one tooltip trigger to an adjacent trigger within 300ms opens instantly without warm-up delay.
- **Non-Modal Escape Handling**: Pressing Escape closes tooltip without propagating to parent modal or dialog.
- **Pointer vs Focus Modality**: Opening on keyboard focus, closing on blur, and closing on scroll or outside click.
- **Collision Flipping**: Shifting or flipping placement when approaching screen edge.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Trigger gets `aria-describedby` pointing to `div[role="tooltip"]`.
- `PART-DOM-02`: Transparent Trigger slot wrapping authored button.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/radix-primitives/packages/react/tooltip`**:
  Global skip-delay window store, warm-up delay timer, pointer move detection.

- **`vendor/react-spectrum/packages/@react-aria/tooltip`**:
  Escape key containment, focus vs hover semantics, screen reader description.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Skip-delay global store, warm-up timer mechanics, Escape dismissal boundary.
- **LEAVE**: Radix custom popper abstractions, public provider soup.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Automate TT-SKIP-01**: Test global skip-delay window between adjacent triggers in Playwright.

### Step 2: **Automate TT-ESC-01**: Test Escape dismissal closing tooltip without closing parent dialog.

### Step 3: **Automate TT-SCROLL-01**: Test dismiss on window scroll.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Tooltip.md`](./Tooltip.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
