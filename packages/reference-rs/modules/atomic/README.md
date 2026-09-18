# Atomic

Extract → atoms → stylesheet + class map. One namer. Does not own `Div`.
Does not emit `StyleProps`.

Authors write StyleProps / `css()` / `recipe()`. They never write class names.
Compile still emits utilities (`.mt_2r`, `.bg_n300`) because runtime `css()`
is an open composition API: build finds **what's possible**, runtime
concatenates **what this instance needs**. Hashed whole-object classes cannot
name `{ ...base, ...override }`.

This crate is the stylesheet compiler. It is not `@reference-ui/system` (the
authoring package for fragments) and it is not the host pipeline in
`reference-core`. The interactive pipeline map is [`map.html`](./map.html) (ecosystem map at [`../map.html`](../map.html)).

## What it takes

Sources (TSX / `css()` / recipe calls) plus a **base system**.
`compile()` takes `Option<BaseSystem>`; omitted uses the frozen
`@reference-ui/lib` fixture. Token resolution looks up that dictionary.

Styletrace answers which JSX names still carry StyleProps. Canon answers
whether `mt` is a style prop. Do not fork either inside this crate.

## What it emits

Two artefacts, same namer:

| Name | What | Disk after cutover |
| :--- | :--- | :--- |
| `stylesheet` | CSS text, six layers | `.reference-ui/styled/styles.css` |
| `css` | `(prop, value, when) → class`, concat | `.reference-ui/styled/css` |

Ghost class (runtime asks for an atom the sheet never printed) is a P0. A
collected want that never became an atom is a P0.

## What it does not do

- Collect `tokens()` — fragments already did, in JS
- Emit `StyleProps` — that is typegen
- Own `Div` / `Span` / `Button` — primitives sit on the runtime, in React
- Evaluate author JS to learn a value
- Hash a StyleProp object as the runtime key
- Drive the compiler from JS by calling a parser over the boundary

Tripwires. Any of these means we built the wrong machine.

## Domain Concepts

The engine operates on five core representations that bridge authored code to emitted CSS and runtime class names:

- **`Want`**: An unvalidated, raw styling intention extracted directly from author ASTs (`<Div mt="2r" />` or `css({ bg: on ? 'n300' : 'n100' })`). It records `(prop, value, conditions, origin)` before any normalization. Branches of conditionals (ternaries, logical AND/OR) are extracted as independent `Want`s without executing or evaluating JavaScript.
- **`Atom`**: A normalized styling unit produced after resolve: exactly one valid CSS declaration (`margin-top: calc(2 * var(--spacing-root))`) bound to one deterministic class name (`mt_2r`) under specific conditions (`_hover`).
- **`AtomSet`**: The deduplicated hash set of all `Atom`s in the project, keyed by `(prop, value, conditions)`. Ten call sites writing `mt="2r"` yield ten `Want`s during extraction, but coalesce into a single `Atom` in `AtomSet`.
- **`CssRuntime`**: The client-side class lookup table mapping `[conditions:]prop:value` to compiled class names. Shipped as structured data so authored TypeScript `css()` can resolve dynamic style objects via $O(1)$ dictionary lookups and string concatenation at runtime—never injecting CSS in the browser.
- **`Recipe`**: A closed variant set (Reference UI's CVA alternative) declaring a fixed matrix of styles (`base`, `variants`, `compoundVariants`). Compiled into scoped classes in `@layer recipes` with a companion variant lookup table.

## Pipeline Stages

Compilation follows a deterministic, one-pass pipeline: `compile(request) -> { stylesheet, css, diagnostics, wants, recipes }`.

1. **Ingestion & Discovery (`src`)**:
   Accepts virtual sources (`VirtualSource`) or scans disk roots for `.tsx`, `.ts`, `.jsx`, `.js` files, filtering out build caches and node modules. Discovers file-level and project-level constant declarations.

2. **Extraction (`src/extract`)**:
   Performs fast AST traversal using OXC. Identifies author style calls:
   - JSX StyleProps on Reference primitives
   - `css(...)` open style composition
   - `recipe(...)` closed variant definitions
   - `staticCss` on the ingested `BaseSystem` (third want source; `['*']` enumerates the property's token category)
   Extracts raw property-value pairs into `Want`s. Never evaluates author JS: branches of ternaries and arrays are extracted symmetrically to capture every possible runtime state. Does not expand `staticCss` at emit time.

3. **Resolution (`src/resolve`)**:
   Transforms raw `Want`s into normalized `Atom`s through four sequential passes:
   - **Rhythm**: Converts rhythm units (`2r`, `0.5r`, fractional multiples) into CSS calculations anchored to `--spacing-root`.
   - **Shorthands**: Expands authored shorthands (`mt`, `px`, `borderBottom`) into longhands with property-priority ranking so longhands reliably override shorthands in the cascade.
   - **Tokens & Colors**: Resolves token identifiers (`n300`, `primary`) to CSS custom properties (`var(--colors-n-300)`) against the base system.
   - **Conditions**: Normalizes responsive breakpoints and pseudo-selectors (`_hover`, `_dark`) into media queries and CSS selectors.

4. **Stylesheet Assembly (`src/stylesheet`)**:
   Constructs the final CSS output conforming strictly to the six-layer specification:
   `@layer reset, global, base, tokens, recipes, utilities;`.
   - Populates `@layer recipes` with static, closed variant classes (e.g. `.recipe-button--size_sm`).
   - Populates `@layer utilities` with sorted, deduplicated atomic utility rules (shorthands before longhands).
   Because `@layer utilities` follows `@layer recipes`, ad-hoc StyleProps on recipe components naturally override recipe defaults via native CSS cascade precedence.

5. **Runtime Lookup Generation (`src/runtime`)**:
   Builds the client-facing data dictionaries:
   - `CssRuntime`: maps `[conditions:]prop:value` to compiled utility class names for `css()`.
   - Recipe Variant Tables: maps variant permutations to compiled recipe class names for `recipe()`.
   These data structures are returned as JSON so authored TypeScript runtime helpers can perform $O(1)$ class resolution at render time.

`compile(request) -> { stylesheet, css, diagnostics }`. Individual file
descriptions belong in each file's top comment.

## Public contract (when wired)

```text
compile(request) -> { stylesheet, css, diagnostics }
```

JS face: `import { compile } from '@reference-ui/rust/atomic'`. The live wire
from core is still `@reference-ui/rust/system` — same module, old subpath.
N-API remains `compileSystem` so the native binary does not move.

Grain is one class per leaf. Spelling is ours.

## Verify

v1 must be provable without `reference-core`. The engine is a pure function —
sources + base system in, CSS + class map out.

```bash
pnpm agentrs c atomic
pnpm agentrs v atomic
pnpm agentrs v atomic --update-goldens
```

| # | Gate | Home | Touches core? |
| :--- | :--- | :--- | :--- |
| A | Crate internals | `#[cfg(test)]` next to each module | no |
| B | Golden cases | `tests/cases/<ATM-*>/` — sources in, `{styles.css,css.json,diagnostics.json}` out | no |
| C | Production parity | Same cases through both engines; coverage of `(prop, value, when)`, not spelling | no |
| D | Matrix | integration, after A–C | yes |

The live compiler stays in production until D.

> Search terms: atom compiler, extract/css(), extract/recipe(), namer/class-map, tokens/lookup, conditions/lowering, rs:canon, rs:styletrace, rs:base-system
