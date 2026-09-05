# ReferenceLibrary Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `ReferenceLibrary` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 0: Authoring & Runtime Foundations |
| **Default Fixed Host** | None / Document host |
| **State Substrate** | Document Zustand store & multi-root failover |
| **Upstream Dependencies** | Platform DOM |
| **Downstream Consumers** | Entire application, `Toast`, `Tooltip`, screen reader live regions |
| **Exported Parts** | `ReferenceLibrary.Root` (also exported as `ReferenceLibrary`) |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/ReferenceLibrary/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/reference-library.spec.ts`
  - **Current Automated Suite**: 3 tests (`RL-DOM-01/ROOT-01`, `RL-DOM-02/LIFE-03`, `RL-ROOT-03`).
- **Cosmos Harness**: None (Global runtime mount; needs fixture in Cosmos).
- **Executable Contract Count**: 34 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Zero-Config Document Standby**: If an application forgets to render `<ReferenceLibrary>`, runtime must lazily mount document fallback on demand.
- **Micro-Frontend Host Election**: Multiple micro-frontends mounting `<ReferenceLibrary>` must cleanly elect the earliest live instance and failover on unmount.
- **Screen Reader Announcements**: `announce(message, { priority: "assertive" | "polite" })` updating hidden ARIA live regions.
- **Document Theme & Color Mode Sync**: Global document token synchronization.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-01`: Transparent root rendering children directly without wrapper.
- `PART-PROP-01`: Forwarding consumer props to active document root.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/react-spectrum/packages/@react-aria/live-announcer`**:
  Polite and assertive live region DOM construction, screen reader announcement clearing.

- **`vendor/base-ui` root provider**:
  Multi-root standby election and cleanup.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Document-level host election, ARIA live region construction, singleton failover.
- **LEAVE**: Mandatory public Provider wrappers (Reference UI is zero-provider by default).

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Add Cosmos Fixture**: Author `ReferenceLibrary.fixture.tsx` testing live announcements and multi-root failover.

### Step 2: **Automate RL-ANNOUNCE-01**: Playwright test asserting `announce()` writes to polite/assertive live region.

### Step 3: **Automate RL-LAZY-01**: Test on-demand document host creation when `<ReferenceLibrary>` is omitted.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`ReferenceLibrary.md`](./ReferenceLibrary.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
