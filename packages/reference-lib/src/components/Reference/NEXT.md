# Reference Manufacturing & Verification Roadmap (NEXT.md)

This document specifies the remaining implementation gaps, testing contracts, vendor inspirations, and concrete execution milestones required to achieve 100% production readiness for `Reference` in `@reference-ui/lib`.

---

## 1. Architectural Role & Current Implementation Status

| Dimension | Specification |
| :--- | :--- |
| **Manufacturing Tier** | Core Tooling: Reference Documentation & AST Inspector |
| **Default Fixed Host** | `div[data-reference-frame]` |
| **State Substrate** | Symbol graph & AST inspector engine |
| **Upstream Dependencies** | `@reference-ui/types`, BaseSystem |
| **Downstream Consumers** | `packages/reference-core`, documentation site, live component inspectors |
| **Exported Parts** | `Reference`, `ReferenceView`, `ReferenceStatus`, `ReferenceDocumentView`, `ReferenceFrame`, `ReferenceMemberList`, `ReferenceMemberRow`, `ReferenceTypeDefinition` |

### Current Source State
- **Implementation**: Available under `packages/reference-lib/src/components/Reference/`.
- **Public API Export**: Fully exported from `packages/reference-lib/src/index.ts`.
- **Typecheck Status**: Clean compilation under `tsc --noEmit` with zero errors.

---

## 2. Current Verification & Proof Status

- **Playwright E2E**: None (Documented API component; mirrored via build pipeline)
  - **Current Automated Suite**: Visual proof in Cosmos fixtures.
- **Cosmos Harness**: 9 fixtures in `fixtures/` (`Overview.fixture.tsx`, `ReferencePrototype.fixture.tsx`, etc.).
- **Executable Contract Count**: 0 tagged behavior cases and composition gates specified in `TESTS.md`.
- **Testing Ratio**: 1-7 tests currently automated in browser E2E suites; remainder of the behavioral contract in `TESTS.md` requires test implementation in `matrix/lib`.

---

## 3. Detailed Gaps & Missing Functionality

### Functional & Behavioral Gaps
- **Build Mirroring Integrity**: Ensure `packages/reference-core/tools/copy-reference-api-component.mjs` cleanly synchronizes with zero type regressions.
- **Dark / Light Theme Visual Proof**: Comprehensive token coverage across dark and light color modes in `ReferenceFrame`.
- **Interactive Search & Filter**: Filtering member rows by name, kind, or deprecated status.
- **Type Parameter Expansion**: Collapsible generic type argument inspection.

### Universal Part Conformance Gaps (`PART-*`)
- `PART-STYLE-01`: Verify token consistency with BaseSystem design tokens.
- `PART-DOM-01`: Frame structure matches reference-core expectations.

---

## 4. Vendor Inspiration & Test/Functionality Harvest

To guarantee battle-tested reliability, algorithms, edge-case regressions, and test fixtures are lifted from surveyed vendor implementations:

### Primary Upstream Reference Packages
- **`packages/reference-core`**:
  Type reflection schema, AST member serialization, JSDoc tag extraction.

### Strict Boundary Rules: What to Lift vs. What to Leave
- **LIFT**: AST member presentation, token chips, syntax highlighting layout.
- **LEAVE**: External markdown parsers, heavy IDE dependencies.

---

## 5. Next Execution Milestones & Priority Action Items

### Step 1: **Sync Verification**: Validate build synchronization script against `reference-core`.

### Step 2: **Expand Cosmos Fixtures**: Add search and filter interactive fixtures.

### Step 3: **Accessibility Pass**: Ensure member list keyboard navigation is accessible.

---

*Authored for the Reference UI Component Manufacturing System. Reference specifications: [`Reference.md`](./Reference.md) • [`TESTS.md`](./TESTS.md) • [`components.md`](../components.md) • [`prompt.md`](../prompt.md).*
