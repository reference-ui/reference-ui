# Extract

Finds style-bearing source and inserts **wants** into an AtomSet.

Two steps. Mixing them is how you accidentally write a JS evaluator.

1. **sites** — JSX attributes, `css()`, `cva` / `sva`. Styletrace answers
   *which tags* and *origin names*. This step answers *which expressions*.
2. **leaves** — each literal is a want. Both branches of a ternary are
   two wants. `undefined` is none. Do not eval `isSelected`.

Does not print CSS. Does not name classes. Does not hash a whole object.

## Files (when coded)

- `mod.rs` — `extract(request) ->` wants / AtomSet
- `sites/`, `leaves/`

## Panda

`vendor/panda/crates/pandacss_extractor` — `extract.rs`, `jsx.rs`,
`calls.rs`, `matcher.rs`. Same places. `literal.rs` / `style_tree.rs` /
`pure_fn.rs` are the evaluator: walk like them, do not fold like them.
`design-notes/literal-evaluator.md` is what we are not building.

Styletrace replaces their `jsx` name list. See `PANDA.md`.

## Must not

- Emit CSS or evaluate user code.
- Build a TypeRef-shaped tree.
- Feed Panda config.
- Group wants into a hashed rule “because they sat on one Box.”
