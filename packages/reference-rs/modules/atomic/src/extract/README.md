# Extract

Finds style-bearing source and inserts **wants**.

Find the host, then walk the expression. Mixing those is how you
accidentally write a JS evaluator.

1. **jsx / css / recipes** — *where*: StyleProps on tags, `css()`,
   `recipe()`. Styletrace answers which tags keep StyleProps. `css()`
   and `recipe()` extract only when the callee is the Reference import.
2. **expressions** — *what’s inside*: each literal is a want. Both
   branches of a ternary are two wants. `undefined` is none. Do not
   eval `isSelected`.

`constants/` is a lookup index for file-top `const` literals, not a
fourth host. `bindings.rs` records Reference imports so extract can
fail closed on shadowed `css` and untraced JSX.

Does not print CSS. Does not name classes. Does not hash a whole object.

## Example (Panda)

`vendor/panda/crates/pandacss_extractor` — `jsx.rs`, `calls.rs`,
`matcher.rs` are their “where”. Ours are named after the author API.
`literal.rs` / `style_tree.rs` / `pure_fn.rs` are the evaluator: walk
like them, do not fold like them. See [PANDA.md](../../PANDA.md).

## Must not

- Emit CSS or evaluate user code.
- Build a TypeRef-shaped tree.
- Group wants into a hashed rule because they sat on one host.
