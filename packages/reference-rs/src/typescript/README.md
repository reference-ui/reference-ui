# TypeScript Scanner

This module owns the Rust-side TypeScript scanner for `@reference-ui/rust`.

The scanner is intended to walk user-owned TypeScript files, parse them with a
real AST, and emit a portable bundle that is self-contained enough for docs and
MCP use cases.

## Current Scope

- fixture-driven Rust tests
- local TypeScript file scanning from a root folder
- initial exported symbol extraction for interfaces and type aliases
- portable JSON bundle snapshots for contract testing

## Testing Strategy

The main test loop should stay in Rust:

- point the scanner at a fixture input directory
- build a normalized bundle
- compare it against `expected.bundle.json`

This keeps scanner debugging close to the real logic while making the output
contract explicit and portable.
