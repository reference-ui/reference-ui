# Atlas Module

Atlas is the component discovery, props interface mapping, and JSX call-site analysis engine of Reference UI.

It answers three core architecture questions for a codebase:
- Which React components exist in this project or its included design libraries?
- Which props interface type does each component map to?
- How are those components, props, and values actually used in JSX call sites across the application?

## Architecture

Atlas is structured as a self-contained module containing its Rust engine, JavaScript wrapper, and test suite:

- **Rust Domain Core (`atlas/src/`)**: High-performance AST scanner built on OXC. Walks files, resolves imports/exports, tracks barrel re-exports, matches JSX call sites, and aggregates usage statistics and representative code snippets.
- **JavaScript Interface (`atlas/js/`)**: Ergonomic, thin wrapper around the N-API addon (`@reference-ui/rust/atlas`). Exposes `analyze()` for simple component lists and `analyzeDetailed()` for full results with diagnostic warnings.
- **Test Suite (`atlas/tests/`)**: Fixture projects with realistic application structures. In Atlas, `api.test.ts` is the case specification; `analysis.json` and `diagnostics.json` provide deterministic fixture outputs for inspection.

## Key Invariants

1. **Diagnostics Over Guesses**: Unsupported or unresolved inputs surface explicitly through diagnostics (e.g. `unresolved-props-type`, `unsupported-props-annotation`) rather than hallucinated or guessed data.
2. **Fail-Closed Boundary**: Only exported components and explicitly included design packages are tracked. Arbitrary node_modules dependencies are never eagerly scanned.
3. **No Kitchen-Sink Leakage**: Atlas never depends on style system runtime or compiler passes. It is strictly a semantic analysis product.

> Search terms: call-site snippets, namespace package, component index, usage analyzer, discovery/components, discovery/props-interface, callsites/jsx, barrels/re-exports, diagnostics/unresolved-props, rs:tasty, rs:styletrace, rs:shared
