# `src/` — the host (DRAFT scaffold, no code yet)

Home of Neo's TypeScript: everything above the dotted line on the rs map.

Planned residents:

- `fragments/` — find `tokens()` / `font()` / `keyframes()` / `globalCss()` /
  `recipe()` call sites, evaluate once in Node, emit `EvaluatedSystemSpec`.
- `publish/` — write `.reference-ui/{system,styled,react}` from Rust's output.
- `runtime/` — authored `css()` and `recipe()` reading the maps Rust named.

Refusals (from the Neo README): no style lowering in TS, no second Atomic,
no second `EvaluatedSystemSpec` (wire format lives in `reference-rs/contracts/`),
no thread-pool opera — fragments, one native compile, publish. A function.
