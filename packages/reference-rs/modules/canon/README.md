# Canon

The language: tags, CSS properties, `mt` / `bg` / `r` / conditions. Not this
package's tokens.

Platform + dialect. What tags and CSS properties exist. `mt` means
`marginTop`. `r`, `container`, conditions. Generated from `@webref` plus a
Reference dialect.

A base system is an **utterance** (this package's tokens). Canon is the
**language**. Atomic, typegen, and styletrace all need it. They must not
import the stylesheet crate to ask “is `mt` a style prop?”

## Two layers

1. **Platform** — living W3C / WHATWG via `@webref/elements` and `@webref/css`.
   HTML/SVG tags, canonical properties, native shorthand decompositions.
2. **Dialect** — Reference UI. PascalCase primitives (`Div`, `Span`, `Obj`,
   `Var`), aliases (`mt`, `bg`, `rounded`), extensions (`r`, `container`,
   `font`, `weight`, `colorMode`), conditions.

JavaScript is the ingest source because the specs live on npm. Rust is the
consumer: static, sorted tables, binary search, zero allocation.

## Fail-closed join

The generator refuses to emit if:

- a dialect HTML tag is not in `@webref`
- a canonical property is neither in `@webref` nor on the dialect allowlist
- native shorthands (`padding`, `margin`, `border`, `inset`, `outline`) do not
  decompose to the same longhands as `@webref`

No `Box` / `Flex` / `Grid`. Hallucinated primitives fail the dictionary tests.

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
