# Reference API Component

This directory contains the canonical source of truth for the `<Reference />` and `<ReferenceView />` UI components.

## Architecture & Workflow

1. **Source of Truth**:
   All component development, styling, and visual improvements happen here in `packages/reference-lib/src/components/Reference`.

2. **Interactive Cosmos Harness**:
   `reference-lib` runs a [React Cosmos](https://reactcosmos.org/) environment. The `fixtures/` directory contains visual fixtures (e.g. `Overview.fixture.tsx`, `ReferencePrototype.fixture.tsx`, `StylePropsApiReference.fixture.tsx`) allowing interactive design, responsiveness testing, and dark/light theme checks.

3. **Mirroring to `reference-core`**:
   During build / package preparation, `packages/reference-core/tools/copy-reference-api-component.mjs` scoops / portals these files into `packages/reference-core/src/reference/browser-component` and adapts `@reference-ui/types` imports to the local browser adapter.

For a full technical overview of how `<Reference />` is orchestrated across the monorepo, see [REFERENCE_COMPONENT.md](../../../../../REFERENCE_COMPONENT.md) at the repository root.
