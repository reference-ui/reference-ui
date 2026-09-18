# Reference RS Shared Utilities (`modules/shared`)

The shared module provides foundational text manipulation, source span slicing, and AST helper routines reused across Rust domain crates in `@reference-ui/rust`.

## Architecture & Responsibilities

1. **Zero-Copy Span Slicing**: Exposes bounds-checked source buffer slicing (`slice_span`) to safely extract raw syntax fragments from Oxc AST spans without allocating intermediate heap strings.
2. **String Hygiene & Unquoting**: Implements allocation-conscious unquoting routines (`unquote`, `unquote_str`) for single quotes, double quotes, and template literals across JSX attribute extractors and parser passes.
3. **Internal Crate Scope**: Compiled as an internal workspace dependency (`rlib`) for `atlas`, `tasty`, and other compiler passes. It exposes no public Node-API symbols or standalone JavaScript runtime entrypoints.

> Search terms: oxc helpers, text utilities, span utils, shared/spans, shared/unquote, rs:atlas, rs:tasty
