# Members

Turns Oxc interface / object-type member signatures into `TsMember` values,
including leading-comment metadata and per-signature `TypeRef` lowering.

## Files

- `dispatch.rs` — walk `TSSignature` lists and route to converters; `member_exclusion_starts`
- `signatures.rs` — property, method, call, construct, and index signature converters
- `mod.rs` — re-exports the surface used by `types` and `symbols`
