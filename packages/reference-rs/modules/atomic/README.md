# Atomic

Extract → atoms → stylesheet + class map. One namer algorithm. Does not own `Div`.
Does not emit `StyleProps`.

Authors write StyleProps / `css()` / `recipe()`. They never write class names.
Compile still emits utilities (`.mt_2r`, `.bg_n300`) because runtime `css()`
is an open composition API: build finds **what's possible**, runtime
concatenates **what this instance needs**. Hashed whole-object classes cannot
name `{ ...base, ...override }`.

This crate is the stylesheet compiler. It is not `@reference-ui/system` (the
authoring package for fragments) and it is not the host pipeline in
`@reference-ui/core`. The interactive pipeline map is `map.html` (ecosystem map: the parent `map.html`).

## What it takes

Sources (TSX / `css()` / recipe calls) plus a system: the legacy
shape carries `baseSystem`, the frozen shape carries `spec`. Token
resolution looks up that dictionary.

Styletrace answers which JSX names still carry StyleProps. Canon answers
whether `mt` is a style prop. Do not fork either inside this crate.

## What it emits

Two artefacts, one namer algorithm in two implementations, one differential gate. The stylesheet is package-scoped: the six layers nest inside `@layer <system>`.

| Name | What | Disk |
| :--- | :--- | :--- |
| `stylesheet` | CSS text, six layers | `.reference-ui/styled/styles.css` |
| `css` | `(prop, value, when) → class`, concat | `.reference-ui/styled/runtime-data.mjs` |

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

## Do not

1. No JS runtime or evaluator for author code (`ATM-FORBID-02`): the fold table is constant folding, fail-closed outside it — refusals diagnose, never execute.
2. One naming algorithm (`ATM-FORBID-03`, `ATM-GHOST-01`): the compiler namer is the oracle, the runtime namer its second implementation held byte-equal; no class-name synthesis anywhere else.
3. No hashed whole-object classes (`ATM-FORBID-01`): runtime `css()` needs atomic utilities to concatenate.
4. No generated `css.js` (`ATM-FORBID-04`): the runtime helper is authored TypeScript; the compiler emits only the data map.
5. No synthesized `currentColor` for omitted shorthand components (`ATM-SHORT-01`).
6. No PascalCase or regex tag guessing (`ATM-SITE-08`): identity comes from styletrace and canon.
7. No splitting into micro-crates: one crate, module layout inside.
8. No `tokens()` collection (fragments, in JS) and no `StyleProps` emission (typegen).
9. No React primitives (they live in `@reference-ui/react`).
10. No non-CSS values in declarations (`ATM-VALID-02`): `true`, `false`, `null` are diagnostics, not rules.
11. No lexicographic rule sorting (`ATM-ORDER-01`, `ATM-ORDER-03`): cascade keys on parsed semantics.
12. No denylist escaper (`ATM-NAME-07`): allowlist, plus a hex escape for a leading digit.
13. The harness never constructs names (`ATM-FORBID-06`), not even in test helpers.
14. State only what this module enforces; unbuilt behavior is an open gap below, never prose.

## Open gaps

- **ATM-GHOST-04** — namer injectivity: an unknown condition warns and emits nothing, but `p` and `padding` still collapse onto one prefix (quarantined). Open until the injectivity quarantine is empty.
- **ATM-PERF-01** — no declared time or memory budget test yet: an app-sized tree compile must stay within bounds, with the atom count equal to the distinct `(prop, value, when, important)` tuples.

## Domain Concepts

The engine operates on five core representations that bridge authored code to emitted CSS and runtime class names:

- **`Want`**: An unvalidated, raw styling intention extracted directly from author ASTs (`<Div mt="2r" />` or `css({ bg: on ? 'n300' : 'n100' })`). It records `(prop, value, conditions, origin)` before any normalization. Branches of conditionals (ternaries, logical AND/OR) are extracted as independent `Want`s without executing or evaluating JavaScript.
- **`Atom`**: A normalized styling unit produced after resolve: exactly one valid CSS declaration (`margin-top: calc(2 * var(--spacing-root))`) bound to one deterministic class name (`mt_2r`) under specific conditions (`_hover`).
- **`AtomSet`**: The deduplicated hash set of all `Atom`s in the project, keyed by `(prop, value, conditions)`. Ten call sites writing `mt="2r"` yield ten `Want`s during extraction, but coalesce into a single `Atom` in `AtomSet`.
- **`CssRuntime`**: The client-side class lookup table mapping `[conditions:]prop:value` to compiled class names. Shipped as structured data so authored TypeScript `css()` can resolve dynamic style objects via $O(1)$ dictionary lookups and string concatenation at runtime—never injecting CSS in the browser.
- **`Recipe`**: A closed variant set (Reference UI's CVA alternative) declaring a fixed matrix of styles (`base`, `variants`, `compoundVariants`). Compiled into scoped classes in `@layer recipes` with a companion variant lookup table.

## Pipeline Stages

Compilation follows a deterministic, one-pass pipeline: `compile(request) -> { stylesheet, css, diagnostics, wants, recipes }`.

1. **Ingestion & Discovery**:
   Accepts virtual sources (`VirtualSource`) or scans disk roots for `.tsx`, `.ts`, `.jsx`, `.js` files, filtering out build caches and node modules. Discovers file-level and project-level constant declarations.

2. **Extraction**:
   Performs fast AST traversal using OXC. Identifies author style calls:
   - JSX StyleProps on Reference primitives
   - `css(...)` open style composition
   - `recipe(...)` closed variant definitions
   - `staticCss` on the ingested `BaseSystem` (third want source; `['*']` enumerates the property's token category)
   Extracts raw property-value pairs into `Want`s. Never evaluates author JS: branches of ternaries and arrays are extracted symmetrically to capture every possible runtime state. Does not expand `staticCss` at emit time.

3. **Resolution**:
   Transforms raw `Want`s into normalized `Atom`s through four sequential passes:
   - **Rhythm**: Converts rhythm units (`2r`, `0.5r`, fractional multiples) into CSS calculations anchored to `--spacing-root`.
   - **Shorthands**: Expands authored shorthands (`mt`, `px`, `borderBottom`) into longhands with property-priority ranking so longhands reliably override shorthands in the cascade.
   - **Tokens & Colors**: Resolves token identifiers (`n300`, `primary`) to CSS custom properties (`var(--colors-n-300)`) against the base system.
   - **Conditions**: Normalizes responsive breakpoints and pseudo-selectors (`_hover`, `_dark`) into media queries and CSS selectors.

4. **Stylesheet Assembly**:
   Constructs the final CSS output conforming strictly to the six-layer specification:
   `@layer reset, global, base, tokens, recipes, utilities;`.
   - Populates `@layer recipes` with static, closed variant classes (e.g. `.recipe-button--size_sm`).
   - Populates `@layer utilities` with sorted, deduplicated atomic utility rules (shorthands before longhands).
   Because `@layer utilities` follows `@layer recipes`, ad-hoc StyleProps on recipe components naturally override recipe defaults via native CSS cascade precedence.

5. **Runtime Lookup Generation**:
   Builds the client-facing data dictionaries:
   - `CssRuntime`: maps `[conditions:]prop:value` to compiled utility class names for `css()`.
   - Recipe Variant Tables: maps variant permutations to compiled recipe class names for `recipe()`.
   These data structures are returned as JSON so authored TypeScript runtime helpers can perform $O(1)$ class resolution at render time.

`compile(request) -> { stylesheet, css, diagnostics, wants, recipes }`.
Individual file descriptions belong in each file's top comment.

## Public contract

```text
compile(request) -> { stylesheet, css, diagnostics, wants, recipes }
```

JS face: `import { compile } from '@reference-ui/rust/atomic'`. Core's
sync calls it through `compileNative` in `@reference-ui/core`.
N-API stays `compileSystem` so the native binary does not move with the
folder rename.

Grain is one class per leaf. Spelling is ours.

## Verify

v1 must be provable without the host pipeline in `@reference-ui/core`. The engine is a pure function —
sources + base system in, CSS + class map out. Proof is unit-only and self-contained: in-process cargo tests plus Vitest across the N-API seam — no browser, no dev server, no network; a case needs only its inputs, a base system, and the compiler. Emitted CSS is validated by a parser, not a renderer — a golden proves stability, never correctness. Goldens are portable (no absolute checkout paths), and the golden writer refuses to bless a stylesheet that does not validate.

```bash
pnpm agentrs c atomic
pnpm agentrs v atomic
pnpm agentrs v atomic --update-goldens
```

| # | Gate | Home | Touches core? |
| :--- | :--- | :--- | :--- |
| A | Crate internals | `#[cfg(test)]` next to each module | no |
| B | Golden cases | atomic golden cases — sources in, style sheet plus CSS and diagnostics JSON out | no |
| C | Production parity | Same cases through both engines; coverage of `(prop, value, when)`, not spelling | no |
| D | Matrix | integration, after A–C | yes |

The live compiler stays in production until D.

> Search terms: atom compiler, extract/css(), extract/recipe(), namer/class-map, tokens/lookup, conditions/lowering, rs:canon, rs:styletrace, rs:base-system
