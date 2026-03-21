# Emitted Contract

This folder defines the raw emitted artifact contract produced by Rust and
consumed by the JavaScript Tasty runtime.

These types are the boundary between the Rust pipeline and the lazy runtime in
`packages/reference-rs/js/tasty`. They describe the serialized shape of emitted
manifests, symbols, members, docs, and type payloads.

## Responsibilities

- define the manifest and chunk payload shapes
- describe symbol, member, JSDoc, and type payloads
- provide the Rust-side contract exported through `emitted.rs`

## Boundaries

- `model.rs` is the normalized in-memory IR
- `emitted/` is the serialized output contract
- `generator/` turns IR into values that conform to this contract

## Generator vs `emitted/` (§12)

- **Chunk and symbol payloads** are emitted as **strings** from `generator/`
  (e.g. `generator/types`). Rust does not build `TastyTypeRef` / `TastyMember`
  trees for that path.
- **`emitted/`** still matters in production: **`ts_rs`** derives export the
  TypeScript types the runtime imports; the string emitter is expected to match
  that shape. **`TastyManifest`** (and related index types) are **constructed
  in Rust** and serialized for the bundle (`generator/bundle/modules/manifest.rs`).

So the contract lives in `emitted/`; the bulk of codegen stays string-based by
design.
