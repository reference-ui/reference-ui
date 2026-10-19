# Shared

Foundational text, span, and test-fixture routines reused across the Rust
domain crates in `@reference-ui/rust`.

## What it is

1. **Zero-copy span slicing** — bounds-checked source-buffer slicing
   (`slice_span`) that extracts raw syntax fragments from Oxc AST spans
   without allocating intermediate heap strings.
2. **String hygiene & unquoting** — allocation-conscious unquoting
   (`unquote`, `unquote_str`) for single quotes, double quotes, and
   template literals across JSX attribute extractors and parser passes.
3. **Testing fixtures** — RAII scratch workspaces,
   in-memory `BaseSystem` fixtures, and frozen wire-contract fixtures
   shared by compiler-crate tests, so no crate hand-rolls its own.

Internal workspace dependency (`rlib`): no public Node-API symbols, no
standalone JavaScript entrypoint.

> Up: @reference-ui/rust

> Search terms: oxc helpers, text utilities, span utils, shared/spans, shared/unquote, shared/testing, rs:atlas, rs:tasty
