# Tasty Module

Tasty is the TypeScript metadata, type projection, and ESM chunk artifact generation engine of Reference UI.

It discovers TypeScript source files, parses them with OXC, models type signatures as a first-class `TypeRef` graph, lowers AST constructs into normalized IR, and emits manifest-first ESM chunk artifacts.

## Architecture

Tasty is structured as a self-contained module containing its Rust compiler, JavaScript runtime, and test cases:

- **Rust Domain Core (`tasty/src/`)**: High-performance AST analysis and type extraction engine built on OXC. Owns symbol extraction, type lowering, member discovery, JSDoc comment extraction, and multi-chunk ESM emission.
- **JavaScript Runtime (`tasty/js/`)**: Developer-facing API (`@reference-ui/rust/tasty`) that lazily loads emitted chunk modules on demand, provides graph navigation, and evaluates bounded object-like member projections (`projectObjectLikeMembers`, `getDisplayMembers`).
- **Test Suite (`tasty/tests/`)**: Isolated TypeScript test projects. In Tasty, suite setup emits chunk modules into `output/`, and `api.test.ts` asserts intent and property surface guarantees.

## Key Invariants

1. **First-Class Symbols**: Types and interfaces maintain identity, module boundaries, and stable canonical IDs rather than collapsing into opaque strings.
2. **Deterministic Emission**: Eager manifests index symbols by ID and name; chunk modules load on demand to minimize memory overhead.
3. **Bounded Projections**: Derived member projections expand aliases, resolve intersections, and apply `Omit`/`Pick` while strictly respecting recursive boundaries to prevent infinite loops.

> Search terms: generics, mapped types, type metadata engine, ts extractor, tasty/symbols, tasty/projection, tasty/chunks, tasty/jsdoc, tasty/generics, rs:atlas, rs:typegen, rs:shared
