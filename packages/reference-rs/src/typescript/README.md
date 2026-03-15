# TypeScript Scanner

This module owns the Rust-side TypeScript scanner for `@reference-ui/rust`.

The scanner is intended to walk user-owned TypeScript files, parse them with a
real AST, build a normalized internal graph, and eventually emit a proper ESM
bundle for docs and MCP use cases.

## Current Scope

- fixture-driven Rust tests
- local TypeScript file scanning from a root folder
- initial exported symbol extraction for interfaces and type aliases
- debug bundle output for inspection during development

## Architecture

- `api.rs`: public scanner request and debug bundle types
- `ast/`: Oxc-based AST extraction layer
- `ast/model.rs`: parser-adjacent internal model
- `scanner/`: file discovery and source loading
- `generator.rs`: debug bundle generation from resolved data
- `resolve.rs`: cross-file reference resolution
- `esm.rs`: placeholder for the future tree-shakeable ESM emitter
- `scan.rs`: top-level orchestration

The critical distinction is:

- parser AST is not the public API
- scanner output is not AST
- AST extraction is not final emitted output
- the current debug bundle is not the future product output

## Output Direction

The long-term output should be a proper ESM bundle where each type is a JS
object that references other JS objects. That should make the emitted graph more
tree-shakeable and better suited for docs and MCP consumers.

The current JSON-like bundle should be treated as a debug artifact and test
inspection format while the real ESM emission layer is still being built.

## Testing Strategy

The main test loop should stay in Rust:

- point the scanner at a fixture input directory
- build a normalized debug bundle
- write that output to `tests/output/bundle.json`
- assert focused behaviors in unit tests

This keeps scanner debugging close to the real logic while avoiding brittle
full-bundle snapshot diffs as the module grows.
