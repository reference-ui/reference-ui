# Shared

Foundational text, span, parse-gate, and test-fixture routines shared by the Rust
domain crates.

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
4. **Nesting gate** — `parse::parse_bounded` runs one linear pre-scan
   before Oxc sees a source (`parse/scan.rs`): brackets, TypeScript
   generic `<`, and, in `.tsx` and `.jsx` files, JSX element nesting
   (`parse/scan/jsx.rs`), nested past `MAX_NESTING` (1,024) are refused
   as a `NestingRefusal` with the line where the limit was crossed. Every
   production Oxc parse in `reference-rs` goes through `parse_bounded`, or
   through `parse_screened` for a `ScreenedSource` screened once where its
   text was read, and the `complexity.mjs` gate fails any other `Parser::new(`
   in production code.

Internal workspace dependency (`rlib`): no public Node-API symbols, no
standalone JavaScript entrypoint.

> Up: @reference-ui/rust

> Search terms: oxc helpers, text utilities, span utils, shared/spans, shared/unquote, shared/testing, rs:atlas, rs:tasty
