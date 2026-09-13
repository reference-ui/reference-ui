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

## Module Layout

- `mod.rs`: module entry point and public Rust surface
- `constants.rs`: shared runtime package and binding constants
- `utils.rs`: shared import analysis and rewrite helpers
- `css.rs`: CSS import rewrite step
- `cva.rs`: CVA and recipe rewrite step
- `tests.rs`: Rust unit coverage for supported rewrite behavior

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
