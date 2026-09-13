# Canon Architecture (Platform & Dialect Join)

The canon defines the official dictionary of possibilities recognized by the Reference UI compiler. Rather than maintaining manual property lists or hardcoded tag maps across compiler passes, the canon serves as the authoritative, typed source of truth.

## Why JavaScript is the Source

The web platform specification lives in the JavaScript/npm ecosystem through `@webref/css` and `@webref/elements`. No Rust crate exists that provides an authoritative, constantly updated W3C and WHATWG specification dump. JavaScript is the ingest source, while Rust is the target consumer that reads the compiled, static representation.

## Two Layers: Platform vs. Dialect

1. **Platform Layer (`platform.ts`)**: Ingests raw browser standards directly from `@webref/elements` (HTML and SVG element tags) and `@webref/css` (canonical property definitions, kebab-case naming, and native specification shorthand decompositions like `padding` $\rightarrow$ `paddingTop/Right/Bottom/Left`).
2. **Dialect Layer (`dialect.ts`)**: Encapsulates Reference UI design system contracts. This includes the curated subset of HTML elements wrapped as PascalCase JSX primitives (`Div`, `Span`, `Obj`, `Var`), shorthand abbreviations (`mt`, `bg`, `rounded`), Reference-only extensions (`r`, `container`, `font`, `weight`, `colorMode`), and responsive conditions.

## Fail-Closed Invariants

The generator strictly enforces three validation rules before emitting code:
- **Element Inclusion**: Every dialect HTML element must exist in the `@webref` specification. Unknown tags cause immediate failure.
- **Property Verifiability**: Every canonical CSS property must exist in the `@webref` CSS registry or appear on an explicit dialect extension allowlist.
- **Shorthand Integrity**: Native specification shorthands (`padding`, `margin`, `border`, `inset`, `outline`) must decompose to longhands that match `@webref` declarations.

## Regeneration

Run the generator via the package script:
```bash
pnpm --filter @reference-ui/rust run canon
```
The generator emits static, sorted arrays into `crates/system/src/canon/*.rs` that support zero-allocation binary search lookups.
