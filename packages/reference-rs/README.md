# @reference-ui/rust

Rust-backed native bindings for `reference-ui`.

This package owns the N-API addon used by `@reference-ui/core` for virtual import
rewrites and is the place to grow future Rust-facing capabilities.

The Rust implementation is organized around `src/virtualrs`, which
owns the semantics for virtual-file postprocessing while `src/lib.rs` stays a
thin N-API export layer.
