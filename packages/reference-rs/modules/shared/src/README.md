# Shared crate sources

Common text, span, and AST utilities for the whole workspace. `lib.rs` provides unquoting, bounds-checked span slicing over source buffers, and character hygiene helpers used across extraction passes and generators to avoid redundant allocations. The `testing` module holds the scratch workspaces and base-system fixtures the compiler crates test against.
