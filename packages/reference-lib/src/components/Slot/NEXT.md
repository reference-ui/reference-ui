# Slot Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `Slot` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Tier 0: Authoring & Runtime Foundations |
| **Default Fixed Host** | Authored child element |
| **State Substrate** | Pure model & memoized prop/style/ref merge |
| **Upstream Dependencies** | Core utils |
| **Downstream Consumers** | All transparent parts across `@reference-ui/lib` |
| **Exported Parts** | `Slot`, `Slottable` |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/Slot/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: `matrix/lib/tests/e2e/slot.spec.ts`
  - **Current Automated Suite**: 4 tests (`SL-COMP-01..04`) + 35 unit tests in `slot.test.tsx`.
- **Cosmos Harness**: None (Tier 0 authoring machinery; needs fixture in Cosmos).
- **Executable Contract Count**: 56 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Token-Aware StyleProps Merging**: Merging token-aware StyleProps from slot part onto child element.
- **Handler Chaining & Cancellation**: Ensuring child `onClick` and slot `onClick` execute in order, and child `event.preventDefault()` stops default.
- **Multiple Ref Composition**: Composing callback refs and object refs cleanly without re-render cascades.
- **Single Child Invariant**: Runtime invariant assertion error when slot receives more than 1 child or invalid text node.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-DOM-02`: Absolute guarantee that Slot adds zero wrapper DOM nodes.
- `PART-PROP-01`: Class names merged with space; styles merged without overwriting.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`vendor/radix-primitives/packages/react/slot`**:
  Prop merging algorithms, handler chaining, child element validation.

- **`vendor/design-system/page-layout/slots`**:
  Named region registration and filler projection.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: Prop/event/ref/class merge algorithms, child shape validator.
- **LEAVE**: Polymorphic `asChild` prop soup (Reference UI uses explicit `<Slot>` elements).

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Add Cosmos Fixture**: Author `Slot.fixture.tsx` demonstrating transparent button wrapping and class merging.

### Step 2: **Automate SL-PROP-01 & SL-REF-01**: Playwright tests verifying native prop passthrough and ref composition.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Slot.md`](./Slot.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
