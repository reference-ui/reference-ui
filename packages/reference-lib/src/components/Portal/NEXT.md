# Portal Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `Portal` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 0: Authoring & Runtime Foundations |
| **Default Fixed Host** | None (teleported DOM) |
| **State Substrate** | React portal & SSR mount gate |
| **Upstream Dependencies** | Core utils |
| **Downstream Consumers** | `Overlay`, `Toast`, `Tooltip`, `Popover`, modal dialogs |
| **Exported Parts** | `Portal.Root` (also exported as `Portal`) |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/Portal/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/portal.spec.ts`
  - **Current Automated Suite**: 11 tests (`PT-DOM-01`, `PT-CONTAINER-01/02/05`, `PT-REACT-01/02`, and `PT-THEME-01` through `PT-THEME-06`).
- **Cosmos Harness**: None (Tier 0 foundation primitive; needs fixture in Cosmos).
- **Executable Contract Count**: 25 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 11 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Theme & Layer Scope Protocol (Completed)**: Layer scope reset (`LayerScopeContext=false`) and destination `DocumentContext` propagation ensure the first portalled primitive correctly re-emits `data-layer` and `data-panda-theme` without wrapper DOM nodes (see `PORTAL_COLOR_MODE.md`).
- **Late-Resolved Container Ref**: Ensuring no transient mount in `document.body` when a custom container ref resolves asynchronously.
- **SSR Hydration Cleanliness**: Zero markup rendered on server; hydration gate cleanly attaching after client mount without mismatch.
- **Shadow DOM Portaling**: Support for teleporting subtrees into Web Component shadow roots.
- **React Event Bubbling**: Preserving synthetic event propagation back through the logical React hierarchy.


### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Assert Portal contributes zero wrapper DOM elements.
- `PART-ID-01`: Stable IDs across SSR and hydration.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/radix-primitives/packages/react/portal`**:
  Late container resolution, body mount default, SSR mount gate.

- **`vendor/base-ui/packages/react/src/portal`**:
  Container mutation handling, Shadow DOM integration.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Clean late-container resolution, SSR hydration boundary, event bubbling.
- **LEAVE**: Extra wrapper nodes, proprietary portal context contracts.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Add Cosmos Fixture**: Author `Portal.fixture.tsx` showing teleportation into custom containers.

### Step 2: **Automate PT-SHADOW-01**: Test portaling into Shadow DOM in Playwright.

### Step 3: **Verify React 19 Cleanliness**: Ensure React 19 ref-as-prop passes without warnings.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Portal.md`](./Portal.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
