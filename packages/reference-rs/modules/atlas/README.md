# Atlas Module

Atlas is the component discovery, props interface mapping, and JSX call-site analysis engine of Reference UI.

It answers three core architecture questions for a codebase:
- Which React components exist in this project or its included design libraries?
- Which props interface type does each component map to?
- How are those components, props, and values actually used in JSX call sites across the application?

It can also observe elements it does not index as components, such as a library's primitives. A caller names an import source and element names in `observe`, and Atlas returns the same call-site statistics for them, bound by import (named, aliased or namespace) rather than by component resolution.

## Architecture

Atlas is structured as a self-contained module containing its Rust engine, JavaScript wrapper, and test suite:

- **Rust Domain Core (`atlas/src/`)**: High-performance AST scanner built on OXC. Walks files, resolves imports/exports, tracks barrel re-exports, matches JSX call sites, and aggregates usage statistics and representative code snippets.
- **JavaScript Interface (`atlas/js/`)**: Ergonomic, thin wrapper around the N-API addon (`@reference-ui/rust/atlas`). Exposes `analyze()` for simple component lists and `analyzeDetailed()` for full results with diagnostic warnings.
- **Test Suite (`atlas/tests/`)**: Fixture projects with realistic application structures. Each case is `tests/cases/<ID>/` named by its raw case id (e.g. `ATL-BAR-01`), where `spec.ts` is the case specification; `analysis.json` and `diagnostics.json` provide deterministic fixture outputs for inspection. Vitest entries live in `tests/suites/` and shared helpers in `tests/harness/`.

## Key Invariants

1. **Diagnostics Over Guesses**: Unsupported or unresolved inputs surface explicitly through template diagnostics (e.g. `ATL-W-UNRESOLVED-PROPS-TYPE`, `ATL-W-UNSUPPORTED-PROPS-ANNOTATION`) rather than hallucinated or guessed data.
2. **Fail-Closed Boundary**: Only exported components and explicitly included design packages are tracked. Arbitrary node_modules dependencies are never eagerly scanned.
3. **No Kitchen-Sink Leakage**: Atlas never depends on style system runtime or compiler passes. It is strictly a semantic analysis product.

> Search terms: call-site snippets, namespace package, component index, usage analyzer, discovery/components, discovery/props-interface, callsites/jsx, barrels/re-exports, diagnostics/unresolved-props, rs:tasty, rs:styletrace, rs:shared
