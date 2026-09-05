# Presence Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `Presence` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 0: Authoring & Runtime Foundations |
| **Default Fixed Host** | Authored child element |
| **State Substrate** | DOM animation event store & CSS lifecycle gating |
| **Upstream Dependencies** | Core utils |
| **Downstream Consumers** | `Overlay`, `Collapsible`, `Toast`, `Tooltip`, animated transitions |
| **Exported Parts** | `Presence.Root` (also exported as `Presence`) |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/Presence/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/presence.spec.ts`
  - **Current Automated Suite**: 5 tests (`PR-DOM-01`, `PR-TRANSITION-01`, `PR-ANIMATION-01`, `PR-RACE-02`, `PR-NEST-01`) + 2 unit tests.
- **Cosmos Harness**: None (Tier 0 foundation primitive; needs fixture in Cosmos).
- **Executable Contract Count**: 48 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Multiple Concurrent Transitions**: Waiting for the longest `transition-duration` or `animation-duration` before unmounting.
- **Transition / Animation Cancellation**: Handling `transitioncancel` or `animationcancel` when interrupted.
- **Rapid Toggle Races**: Rapidly toggling `present: true -> false -> true` in < 16ms preserving child element identity.
- **Nested Presence Coordination**: Nested Presence instances delaying parent unmount until child exit finishes.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-02`: Zero wrapper DOM element inserted; presence lands on single authored child.
- `PART-REF-01`: Forwarding ref to child element cleanly across React 17/18/19.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/radix-primitives/packages/react/presence`**:
  Animation event listener attachment, `data-state="open|closed"` synchronization, ref forwarding.

- **`vendor/base-ui/packages/react/src/presence`**:
  CSS transition completion detection, multiple animation race resolution.

- **`vendor/zag/packages/machines/presence`**:
  Instant close vs animated exit decision machine.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: CSS transition/animation lifecycle listener, nested exit coordination.
- **LEAVE**: Framer Motion or JS animation dependencies (Reference UI uses pure CSS animations/transitions).

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Add Cosmos Fixture**: Author `Presence.fixture.tsx` demonstrating CSS keyframe and transition exits.

### Step 2: **Automate PR-MULTI-01**: Test multiple simultaneous transitions with differing durations.

### Step 3: **Automate PR-CANCEL-01**: Test `transitioncancel` handling on interrupted transitions.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Presence.md`](./Presence.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
