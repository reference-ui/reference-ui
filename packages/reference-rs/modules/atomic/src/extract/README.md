# Extract

Finds style-bearing source and inserts **wants**.

Find the host, then walk the expression. Mixing those is how you
accidentally write a JS evaluator.

1. **jsx / css / recipes** — *where*: StyleProps on tags, `css()`,
   `recipe()`. Styletrace answers which tags keep StyleProps; the tag
   root's import provenance answers whose system they belong to. `css()`
   and `recipe()` extract only when the callee is the Reference import.
2. **expressions** — *what’s inside*: each literal is a want. Both
   branches of a ternary are two wants. `undefined` is none. Do not
   eval `isSelected`.

`constants/` is a lookup index for file-top `const` literals, not a
fourth host. `bindings.rs` records every import's provenance (Reference,
project or installed package) so extract can fail closed on shadowed
`css` and untraced JSX. `provenance.rs` turns that into the one host gate
the JSX walk and the `css`-threading pre-pass share: a Reference import
is own by proof, a project or unbound name is own only through the host
roster, and a tag whose import ends at an installed package is never own,
whatever its name. That package's runtime mints its own system's classes,
so the tag's wants lower as external and the consumer backs them under
every composed system; with none composed, the tag reports
`ATM-W-EXTERNAL-UNBACKED` (see `jsx/README.md`).

Does not print CSS. Does not name classes. Does not hash a whole object.

## Example (Panda)

Panda's JSX, call, and matcher modules are their “where”. Ours are named after the author API.
Their evaluator is the one to walk like, not fold like. See [PANDA.md](../../PANDA.md).

## Must not

- Emit CSS or evaluate user code.
- Decide a tag's owner by its name. A package import is external even
  when it spells a primitive or an upstream's published wrapper.
- Build a TypeRef-shaped tree.
- Group wants into a hashed rule because they sat on one host.
