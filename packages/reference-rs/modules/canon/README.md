# Canon

The language: tags, CSS properties, `mt` / `bg` / `r` / conditions. Not this
package's tokens.

Platform + dialect. What tags and CSS properties exist. `mt` means
`marginTop`. `r`, `container`, conditions. Ingested from `@webref` with a
Reference dialect overlay.

A base system is an **utterance** (this package's tokens). Canon is the
**language**. Atomic, typegen, and styletrace all need it. They must not
import the stylesheet crate to ask “is `mt` a style prop?”

## Compiler passes consult canon

Compiler passes import dictionary lookups from the `canon` crate — never from
atomic, never from a handwritten list in extract or resolve:

- **Extract** asks whether a JSX tag is a Reference primitive, whether an
  attribute is a style prop, whether a key is a condition.
- **Resolve** normalizes aliases and asks native shorthand longhands.
- **Stylesheet** asks class prefixes and kebab-case CSS names.

## Two layers

1. **Platform (@webref)** — living W3C / WHATWG via `@webref/elements` and
   `@webref/css`. Complete platform catalog of 820+ living CSS properties,
   all standards-defined native shorthand decompositions, color-syntax
   properties, and HTML/SVG host elements.
2. **Dialect (Reference UI)** — overlay only. PascalCase primitives (`Div`,
   `Span`, `Path`, `Circle`, `Obj`, `Var`), short utility class prefixes (`mt`,
   `p`, `bd-b-w`), aliases (`mt`, `bg`), macros (`r`, `size`,
   `variant`, `colorMode`, `weight`), conditions (`_hover`, `_dark`), and
   explicit dialect extensions (`textGradient`, `borderStartRadius`).

JavaScript is the ingest source because the specs live on npm. Rust is the
consumer: static, sorted tables, binary search, zero allocation. Lookups are
`is_reference_primitive`, `is_html_tag`, `is_known_style_prop`,
`resolve_canonical_prop`, `class_prefix_for_prop`,
`to_css_declaration_property`, `native_longhands_for_prop`, `is_color_prop`,
`is_condition_prop`.

Tier-0 vocabulary: the crate depends only on the standard library and never
imports a downstream compiler crate or host package.

## Fail-closed inverted join

The generator emits platform definitions from web standards and aborts if:

- a dialect JSX primitive tag is not in `@webref/elements`
- a dialect alias target is not a platform property or dialect extension
- a dialect short-prefix property is not a platform property or dialect extension
- a dialect CSS extension is missing from `EXTENSIONS`
- a native shorthand decomposition disagrees with `@webref/css`
- a dialect color extension is missing from `EXTENSIONS` (with `color: true`)

No `Box` / `Flex` / `Grid`. Hallucinated layout wrappers fail the dictionary tests.

## Generator

JavaScript ingest: reads `@webref/css` and `@webref/elements`, joins them with
the dialect overlay, runs the fail-closed join, and emits static Rust tables
(a 1:1 mirror: `html`, `dialect`, `conditions`, per-group `css` tables,
`lib`, `tests`). Generated artifacts never sit alongside
handwritten files. Vendor-prefixed rows come from csstype via
the vendor-extensions overlay (re-derive, never hand-extend); unitless rows
union the unitless overlay.

## Regenerate

```bash
pnpm --filter @reference-ui/rust run canon
cargo fmt -p canon
```

The emitter writes compact chunks; `cargo fmt` expands them to the committed
form, so a clean regen plus fmt diffs only the rows you meant to change.
Do not hand-edit generated tables. Passes must not grow a second
property list in extract or resolve.

## Verify

```bash
pnpm --filter @reference-ui/rust run canon
pnpm agentrs c canon
pnpm agentrs v canon
pnpm agentrs q
```

Dictionary membership is proven in the generated dictionary tests, and fail-closed join validation is proven in the join suite. Refine this crate first — everything else looks it up.

> Up: @reference-ui/rust

> Search terms: shorthands, style dictionary, prop language, canon/dialect, canon/platform, canon/aliases, canon/shorthands, canon/join, rs:base-system, rs:atomic, rs:typegen
