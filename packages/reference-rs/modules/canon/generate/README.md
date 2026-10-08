# Generator

JavaScript ingest for the canon crate. Reads `@webref/css` and
`@webref/elements`, joins them with the Reference UI dialect overlay, and emits
static Rust tables into `modules/canon/src`.

The specs live on npm. There is no Rust crate that dumps living W3C / WHATWG
data. This folder is the ingest; the crate is the consumer.

## Pipeline Architecture

The generator operates as a four-room fail-closed pipeline where generated
artifacts never sit alongside handwritten files:

1. **Platform Ingest**: Ingests standards from `@webref/css` and
   `@webref/elements` to produce authoritative browser elements and CSS specs.
   Writes a closed platform name union into `generated/`.
2. **Dialect Overlay**: Ingests typed overlay tables for curated JSX primitives,
   authoring aliases, short prefixes, macros, and extensions. Produces the pure
   `DialectData` product consumed by emitters.
3. **Fail-Closed Join Validation**: Cross-validates the overlay against
   platform standards fail-closed. Validates alias targets, prefix uniqueness,
   shorthand decompositions, element tags, and color-bearing extensions before
   any code is written.
4. **Rust Emission**: 1:1 mirror of `modules/canon/src/`. Each emitted
   Rust file (`html.rs`, `dialect.rs`, `conditions.rs`, `css/*.rs`, `lib.rs`,
   `tests.rs`) has a dedicated emitter module responsible for formatted, zero-allocation
   Rust slices.

## Inverted platform-first join

Platform is the browser: `@webref/css` defines all 820+ living properties,
native shorthand decompositions, and color-syntax properties; `@webref/elements`
defines HTML and SVG host elements.

Dialect is the Reference UI overlay: PascalCase primitives (`Div`, `Span`, `Path`,
`Circle`, `Obj`, `Var`), short utility class prefixes (`mt`, `p`), aliases (`mt`,
`bg`), macros (`r`, `size`, `variant`, `colorMode`, `weight`),
conditions (`_hover`, `_dark`), and explicit dialect CSS extensions (`spaceX`,
`hideFrom`).

The generator enforces fail-closed validation:
- Dialect alias targets must exist on platform or dialect extensions.
- Dialect short-prefix properties must exist on platform or dialect extensions.
- Dialect CSS extensions must be registered on `EXTENSIONS`.
- Shorthand longhands must match `@webref/css` decompositions.
- Dialect JSX primitive tags must exist in `@webref/elements`.
- Dialect color extensions must be registered on `EXTENSIONS` with `color: true`.

## Regeneration

```bash
pnpm --filter @reference-ui/rust run canon
cargo fmt -p canon
```

The emitter writes compact chunks; `cargo fmt` expands them to the committed
form, so a clean regen plus fmt diffs only the rows you meant to change.
Vendor-prefixed rows live in `overlay/vendors.ts` (GAP-04a, derived from
csstype, never hand-extended); unitless rows union `overlay/unitless.ts`.

Do not hand-edit generated tables under `src/`. Lookup facades live in `src/lib.rs`
and are re-emitted with the tables.
