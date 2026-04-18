# Styletrace

`styletrace` answers two related questions for Reference UI:

- which prop names count as Reference style props
- which exported JSX components forward those style props into Reference primitives

## Layout

- `mod.rs` — thin public entry point and re-exports
- `resolver/` — Oxc-driven type expansion for `StyleProps` and related aliases
- `analysis/` — JSX wrapper tracing built on top of the resolver surface
- `tests/` — Rust tests split by concern instead of one large test file

## Design Rules

- keep the public API stable and small
- keep parsing / resolution / graph traversal separate
- put module-level documentation close to the code it describes
- prefer Rust tests for semantic coverage, with JS tests as integration coverage