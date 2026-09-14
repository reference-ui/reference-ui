# Generator

JavaScript ingest for the canon crate. Reads `@webref/css` and
`@webref/elements`, joins them with the Reference UI dialect overlay, and emits
static Rust tables into `modules/canon/src`.

The specs live on npm. There is no Rust crate that dumps living W3C / WHATWG
data. This folder is the ingest; the crate is the consumer.

## Inverted platform-first join

Platform is the browser: `@webref/css` defines all 820+ living properties,
native shorthand decompositions, and color-syntax properties; `@webref/elements`
defines HTML and SVG host elements.

Dialect is the Reference UI overlay: PascalCase primitives (`Div`, `Span`, `Path`,
`Circle`, `Obj`, `Var`), short utility class prefixes (`mt`, `p`), aliases (`mt`,
`bg`, `rounded`), macros (`r`, `size`, `variant`, `colorMode`, `weight`),
conditions (`_hover`, `_dark`), and explicit dialect CSS extensions (`spaceX`,
`hideFrom`).

The generator enforces fail-closed validation:
- Dialect alias targets must exist on platform or dialect allowlist.
- Dialect short-prefix properties must exist on platform or dialect allowlist.
- Dialect CSS extensions must be registered on `DIALECT_CSS_ALLOWLIST`.
- Shorthand longhands must match `@webref/css` decompositions.
- Dialect JSX primitive tags must exist in `@webref/elements`.
- Dialect color extensions must be registered on `DIALECT_COLOR_ALLOWLIST`.

## Regeneration

```bash
pnpm --filter @reference-ui/rust run canon
```

Do not hand-edit generated tables. Lookup facades live in `src/lib.rs` and
are re-emitted with the tables.
