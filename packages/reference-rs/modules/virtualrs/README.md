# Virtualrs

`virtualrs` owns the Rust-side semantics for postprocessing generated
virtual source files before they are consumed by the rest of the Reference UI
toolchain.

The goal is to keep `src/lib.rs` as a thin N-API binding layer and move all
virtual-file behavior into a Rust module that is easy to reason about and easy
to test directly.

## Responsibilities

- parse virtual module source with Oxc
- detect runtime imports from `@reference-ui/react`
- rewrite `css` imports to the styled-system runtime path
- rewrite `cva` and `recipe` imports to canonical `cva` usage
- preserve non-target imports from `@reference-ui/react`

## Architecture

The module is structured as a pipeline of independent rewrite passes that operate on Oxc ASTs:

1. **Import Analysis and Shared Utilities**: A foundational layer parses virtual module source code and inspects import declarations. It provides shared traversal utilities and detects whether the module imports from `@reference-ui/react`.
2. **CSS Transformation**: This pass identifies runtime imports for standard CSS, parses their usage, and rewrites the AST to target the styled-system runtime path instead.
3. **CVA Transformation**: This pass detects `cva` and `recipe` imports, rewriting both the import declarations and the call sites to ensure canonical `cva` usage in the emitted output.
4. **N-API Boundary**: A thin public entry point exposes the pipeline to Node.js, keeping the bulk of the virtual-file semantics in pure Rust for easier testing and maintenance.

## Design Rules

- keep the public N-API surface stable and thin
- keep rewrite steps small and focused
- share parsing and rendering helpers through `utils.rs`
- prefer Rust unit tests for semantic coverage instead of pushing all behavior
  through the JS binding layer

## Testing

The Rust test suite should be the primary place to validate rewrite semantics.
That keeps failures close to the actual transform logic and makes edge cases
easier to debug than binding-level tests alone.

JS tests are still useful, but mostly for loader behavior and a small number of
integration smoke tests through the published API.
