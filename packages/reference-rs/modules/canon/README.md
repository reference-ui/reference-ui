# Canon

The language: tags, CSS properties, `mt` / `bg` / `r` / conditions. Not this
package's tokens.

Platform + dialect. What tags and CSS properties exist. `mt` means
`marginTop`. `r`, `container`, conditions. Ingested from `@webref` with a
Reference dialect overlay.

A base system is an **utterance** (this package's tokens). Canon is the
**language**. Atomic, typegen, and styletrace all need it. They must not
import the stylesheet crate to ask “is `mt` a style prop?”

## Two layers

1. **Platform (@webref)** — living W3C / WHATWG via `@webref/elements` and
   `@webref/css`. Complete platform catalog of 820+ living CSS properties,
   all standards-defined native shorthand decompositions, color-syntax
   properties, and HTML/SVG host elements.
2. **Dialect (Reference UI)** — overlay only. PascalCase primitives (`Div`,
   `Span`, `Path`, `Circle`, `Obj`, `Var`), short utility class prefixes (`mt`,
   `p`, `bd-b-w`), aliases (`mt`, `bg`, `rounded`), macros (`r`, `size`,
   `variant`, `colorMode`, `weight`), conditions (`_hover`, `_dark`), and
   explicit dialect extensions (`spaceX`, `hideFrom`).

JavaScript is the ingest source because the specs live on npm. Rust is the
consumer: static, sorted tables, binary search, zero allocation.

## Fail-closed inverted join

The generator emits platform definitions from web standards and aborts if:

- a dialect JSX primitive tag is not in `@webref/elements`
- a dialect alias target is not a platform property or dialect extension
- a dialect short-prefix property is not a platform property or dialect extension
- a dialect CSS extension is missing from `DIALECT_CSS_ALLOWLIST`
- a native shorthand decomposition disagrees with `@webref/css`
- a dialect color extension is missing from `DIALECT_COLOR_ALLOWLIST`

No `Box` / `Flex` / `Grid`. Hallucinated layout wrappers fail the dictionary tests.

## Regenerate

```bash
pnpm --filter @reference-ui/rust run canon
```

Do not hand-edit generated tables under `src/`. Passes must not grow a second
property list in extract or resolve.

## Verify

```bash
pnpm agentrs c canon
```

Dictionary membership, alias resolution, condition matching, rejection of
`Box` / `Flex` / `Grid`. Generator join checks run as part of `pnpm canon`.
Refine this crate first — everything else looks it up.
