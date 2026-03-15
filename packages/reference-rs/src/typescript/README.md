# TypeScript Scanner

This module owns the Rust-side TypeScript scanner for `@reference-ui/rust`.

The scanner is intended to walk user-owned TypeScript files, parse them with a
real AST, build a normalized internal graph, and eventually emit a proper ESM
bundle for docs and MCP use cases.

## Scan boundary

**User space defines the scan.** We do not pull in all of `node_modules` or every type from every library.

- **User space** (files under the scan root): We map **everything**—exported and non-exported interfaces and type aliases—so the graph is complete and types resolve correctly.
- **Libraries (e.g. node_modules)**: We only add a library file when the user **re-exports** something from that module (e.g. `export type { X } from 'some-library'` or `export * from 'some-library'`). That re-export is the signal that the user wants those types documented. From a library file we only follow imports that stay **within the same package**; we do not follow into other packages, so we avoid sucking in entire dependency trees.

## Current scope

- fixture-driven Rust tests
- local TypeScript file scanning from a root folder
- symbol extraction: exported types from all files; in user space, non-exported interfaces and type aliases as well
- raw leading comment capture for exported types and their members (descriptions)
- ESM bundle output for inspection during development

## Architecture

- `api.rs`: public scanner request and resolved graph types
- `ast/`: Oxc-based AST extraction layer
- `ast/model.rs`: parser-adjacent internal model
- `scanner/`: file discovery and source loading
- `generator.rs`: resolved graph assembly and ESM emission
- `resolve.rs`: cross-file reference resolution
- `esm.rs`: emits the tree-shakeable JS bundle artifact
- `scan.rs`: top-level orchestration

The critical distinction is:

- parser AST is not the public API
- scanner output is not AST
- AST extraction is not final emitted output
- the resolved graph is an internal input to JS emission

## Comments and descriptions

The scanner captures **raw leading comments** only: the comment block
immediately above an exported interface, type alias, or property is stored as
plain text on the symbol or member. Comment markers (`//`, `/*`, `*/`, `/**`,
leading `*`) are stripped and whitespace is normalized; newlines are preserved.
No JSDoc parsing is performed—no `@param`, `@returns`, or other tags. That
keeps the data model minimal and downstream-friendly. Docs and MCP consumers
can use the raw description as-is or parse it as JSDoc later if they choose.

## Output Direction

The scanner should produce a proper ESM bundle where each type is a JS object
that references other JS objects. That keeps the emitted graph tree-shakeable
and better suited for docs and MCP consumers.

## Testing Strategy

The main test loop should stay in Rust:

- point the scanner at a fixture input directory
- build the resolved graph
- write one emitted JS per scenario to `tests/output/{scenario}/bundle.js` (see `tests/input/README.md`)
- assert focused behaviors in unit tests

This keeps scanner debugging close to the real logic while avoiding brittle
full-bundle snapshot diffs as the module grows.
