# Atomic Style Engine SPEC

Current freeze, cases, and proof. Design narrative: [README.md](./README.md).
Mandate and architecture: [REFERENCE_SYSTEM.md](../../../REFERENCE_SYSTEM.md), [atomic.md](../../docs/atomic.md), and [PANDA.md](./PANDA.md) (vendor example / process map).

Harness / Runner: `pnpm agentrs c atomic` (Cargo unit tests) | `pnpm agentrs v atomic` (Vitest seam tests)

## 1. Job of the Crate

The `atomic` style engine compiles authored StyleProps, `css()` calls, and component recipes into a deterministic atomic stylesheet and a runtime class map using a single shared namer. It takes input sources (TSX, JSX, TS, JS) and, upon contract completion, a design system definition (`BaseSystem`); it emits two synchronized artifacts—a six-layer stylesheet (`styles.css` adhering to `@layer reset, global, base, tokens, recipes, utilities;`) and a runtime lookup map (`css` mapping `[when:]prop:value` to compiled utility class names)—accompanied by compiler diagnostics. It must not evaluate author JavaScript at compile time, must not emit hashed whole-object class names, must not maintain a second namer between the stylesheet and runtime, must not generate executable `css.js` code files, must not collect `tokens()` (owned by JavaScript fragments), must not emit `StyleProps` TypeScript interfaces (owned by typegen), and must not own React DOM primitives such as `Div` or `Button`.

## 2. Legend & Status

- `[x]` Proven by a dedicated `tests/cases/<ATM-*>` folder whose name **is** the SPEC ID (`ATM-COND-04`). Standing gauges on every station prove `ATM-GHOST-01` and `ATM-LAYER-01`.
- `[ ]` Specified; no dedicated case folder. **Cargo `#[test]` is not a tick.** Code in `src/` is not proof.

Audit: 2026-09-15. Folder name equals SPEC ID. Combined stations were split (`ATM-COND-02`/`03`/`04`, `ATM-LEAF-01`/`02`/`03`, `ATM-SITE-02`/`03`, `ATM-SHORT-01`/`02`, `ATM-RHYTHM-01`/`02`/`03`/`05`). One folder, one ID, one `spec.ts`.

### Status counts

| Metric | Count |
| :--- | :--- |
| Engine | Functional pipeline (extract → atom → stylesheet + class map). `compile()` takes `Option<BaseSystem>`; omitted uses `BaseSystem::lib_fixture()`. `staticCss` is a third want source. `src/recipes` emits closed `recipe()` classes in `@layer recipes` plus a variant table on `CompileResult`. JSX extract calls styletrace and gates on traced names plus `@reference-ui/react` imports. `css()` / `recipe()` extract only from those imports. |
| Total contract cases | 75 |
| Named `[x]` proven | 75 |
| Remaining `[ ]` | 0 |
| Cargo `#[test]` | 82 (internal; not ticks) |
| Vitest seam stations | 73 (`tests/cases/<ATM-*>`) |

### Breakdown by Area

| Area | Meaning | Total | Proven `[x]` | Remaining `[ ]` |
| :--- | :--- | :--- | :--- | :--- |
| `GHOST` | Zero ghost class invariants & bijective namer (P0) | 3 | 3 | 0 |
| `SITE` | Style extraction sites (JSX, calls, spreads, constants, imports) | 11 | 11 | 0 |
| `LEAF` | AST leaf literal extraction & branch flattening | 9 | 9 | 0 |
| `WANT` | Raw styling intention IR (`Want`) & serialization | 2 | 2 | 0 |
| `ATOM` | Atom representation, values, hashing, & `AtomSet` | 4 | 4 | 0 |
| `RHYTHM` | Spatial rhythm formulas & multi-value pass-through | 5 | 5 | 0 |
| `SHORT` | Shorthand decomposition without `currentColor` reset | 5 | 5 | 0 |
| `COND` | Conditions, media queries, pseudo-classes, & patterns | 9 | 9 | 0 |
| `TOKEN` | Token resolution, CSS vars, & BaseSystem ingest | 5 | 5 | 0 |
| `RECIPE` | Closed variant classes & variant lookup tables | 3 | 3 | 0 |
| `STATIC` | Static CSS want synthesis from BaseSystem | 2 | 2 | 0 |
| `LAYER` | Cascade layer order (`@layer`) & layer population | 4 | 4 | 0 |
| `NAME` | Deterministic class naming & selector escaping | 5 | 5 | 0 |
| `DIAG` | Diagnostics, location tracking, & fail-closed parsing | 3 | 3 | 0 |
| `FORBID` | Forbidden architectural patterns & tripwires | 5 | 5 | 0 |
| **Total** | | **75** | **75** | **0** |

---

## 3. Pipeline

This crate is one compiler. Authors write StyleProps, `css()`, and `recipe()`
from `@reference-ui/react`. Compile emits a six-layer stylesheet and a class
map. One namer. No generated `css.js`.

| Pass | Home | Job |
| :--- | :--- | :--- |
| jsx / css / recipes | `src/extract/{jsx,css,recipes}`<br>`ATM-SITE-01`–`11` | JSX StyleProps, `css()`, `recipe()`. Styletrace gating is SITE-08. |
| staticCss | `src/static_css`<br>`ATM-STATIC-01`–`02` | Third want source from `BaseSystem`. `['*']` enumerates the property's token category. One AtomSet, one namer. |
| expressions | `src/extract/expressions`<br>`ATM-LEAF-01`–`09` | Flatten ternaries, spreads, arrays into wants. No JS eval. |
| resolve | `src/resolve/*`<br>`ATM-SHORT-*`, `ATM-RHYTHM-*`, `ATM-TOKEN-*`, `ATM-COND-*` | Rhythm, tokens, shorthands, conditions |
| atom | `src/atom`<br>`ATM-ATOM-*`, `ATM-WANT-*` | One `(prop, value, when)` = one Atom |
| recipes (emit) | `src/recipes`<br>`ATM-RECIPE-01`–`03` | Closed `recipe()` tables in `@layer recipes`. Extract of recipe style objects is `extract/recipes` / SITE-03. |
| stylesheet | `src/stylesheet`<br>`ATM-LAYER-*` | Six layers: `reset, global, base, tokens, recipes, utilities` |
| runtime | `src/runtime`<br>`ATM-GHOST-01`–`03` | `CssRuntime` map for authored `css()` |

Panda's process crates and file-level call sites: [PANDA.md](./PANDA.md).
Their names are examples. Our author API is `css()` and `recipe()`.

## 3b. Example: Panda job → our ID → refuse

| Panda crate / job | Vendor files | Our module & ID | Take | Refuse |
| :--- | :--- | :--- | :--- | :--- |
| `pandacss_extractor` (sites) | `extract.rs`, `jsx.rs`, `calls.rs`, `matcher.rs` | `src/extract/{jsx,css,recipes}`<br>`ATM-SITE-01`–`11` | JSX attrs, `css()`, `recipe()` (they also extract `cva` / `sva`) | Vue / Svelte / Astro, `include` globs as a substitute for styletrace, PascalCase guessing (`matcher.rs`), config `jsx` name arrays |
| `pandacss_extractor` (leaves) | `literal.rs`, `style_tree.rs`, `pure_fn.rs`, `scope.rs` | `src/extract/expressions`<br>`ATM-LEAF-01`–`09` | AST walk, branch collection, ternary flattening | `expression_to_literal` JS evaluator, folding `undefined` to `Null` |
| `pandacss_encoder` | `Atom`, `process_atomic`, `FxHashSet` dedup | `src/atom`<br>`ATM-ATOM-01`–`04`<br>`ATM-WANT-01`–`02` | `(prop, value, conditions)` records, dedup | Their `Literal` IR, hashed whole-object classes |
| `pandacss_utility` | `format_class_name`, `normalize.rs`, `runtime_class.rs` | `src/resolve/*`<br>`src/stylesheet/name`<br>`ATM-SHORT-*`, `ATM-NAME-*` | Shorthand expand, one namer | Host JS `transform()` callbacks (split-brain class names) |
| `pandacss_recipes` | `Recipe`, `SlotRecipe`, compound | `src/recipes`<br>`ATM-RECIPE-01`–`03` | Closed variant tables, compound matching | Baking host StyleProps into the recipe class; their `sva` slot-recipe helper as an author API |
| `pandacss_stylesheet` | `compile.rs`, `layers.rs`, `grouped.rs`, `emitter.rs` | `src/stylesheet`<br>`ATM-LAYER-*` | Layer preamble, CSS emit, media nesting | LightningCSS, `split_css` zoo, their five-layer list (ours is six) |
| `pandacss_codegen` | `artifacts/css/mod.rs`, `cva.rs`, `conditions.rs` | `src/runtime`<br>`ATM-GHOST-01`–`03` | Class map (`CssRuntime`) | `styled-system/{jsx,types,patterns,themes}` farm; we author `css()` / `recipe()` in core |
| `pandacss_tokens` | `from_config.rs`, `token.rs` | `src/resolve/tokens`<br>`ATM-TOKEN-01`–`05` | Path → `var(--...)`, color-mix opacity | Second OKLCH pipeline; token dict synthesis (tokens are JS fragments) |
| `pandacss_config` | `UserConfig`, hooks, plugins | `base_system::BaseSystem`<br>`ATM-LAYER-03`, `ATM-STATIC-01` | Tokens, conditions, recipe schemas | Hooks, plugin callbacks; input is a typed `BaseSystem` dump |
| `pandacss_project` | `Project`, `System`, watch caches | `src/lib.rs`<br>`ATM-GHOST-01`, `ATM-DIAG-01` | `sources + baseSystem → { stylesheet, css, diagnostics }` | Watch caches, WASM, Parcel; orchestration is the host |

---

## 4. Required Cases

### Zero Ghost Class Invariants (P0)

- [x] `ATM-GHOST-01` `[reference]` `[seam]` —
  **Every runtime class generated must exist with an identical selector in the emitted stylesheet.**
  Compile arbitrary sources containing StyleProps, `css()` calls, pseudo-conditions, and shorthands. Assert that for every class name present in the runtime `css.classes` map, an exact matching CSS selector exists in the emitted stylesheet under `@layer utilities`. The compiler uses one authoritative namer (`stylesheet::name::class_name`) for both outputs, completely eliminating ghost classes.
- [x] `ATM-GHOST-02` `[reference]` `[seam]` —
  **Runtime dictionary must provide bijective key lookup matching authored property and condition intentions.**
  Inspect the emitted `css.classes` dictionary generated from unconditioned, responsive, and pseudo-conditioned declarations. Assert that keys are deterministically indexed as `prop:val` or `when:prop:val` (e.g. `mt:2r` → `mt_2r`, `_hover:color:red.500` → `hover:c_red.500`). Assert that querying the runtime dictionary with authored properties returns the exact class name printed in the stylesheet without transformation skew.
- [x] `ATM-GHOST-03` `[reference]` `[seam]` —
  **Empty baseline input must emit pure layer preambles with an empty runtime class dictionary.**
  Compile an empty project or virtual source containing no style declarations. Assert that the generated stylesheet contains exactly the six-layer preamble (`@layer reset, global, base, tokens, recipes, utilities;\n`) with no utility rules. Assert that `css.classes` is an empty dictionary and `diagnostics` is empty, proving baseline purity.

### Extraction Sites

- [x] `ATM-SITE-01` `[reference]` `[seam]` —
  **Style props on JSX tags that pass `canon::is_known_style_prop` must extract into wants.**
  Station `ATM-SITE-01`: `<Div mt="2r" bg="blue.500" />` and `<Button px="4r" />`. Does **not** prove styletrace gating (this station has no Reference import, so the empty host set keeps the pre-gate scan), boolean attrs, or origin metadata.
- [x] `ATM-SITE-02` `[reference]` `[seam]` —
  **Calls to `css()` and `css.object()` with single or multiple arguments must extract all style object properties.**
  Parse JavaScript/TypeScript call expressions targeting `css(...)`, `css.object(...)`, and internal alias `__reference_ui_css(...)`. Assert that every object argument in multi-argument calls is traversed and its properties are extracted into wants. Assert that conditional expressions passed as call arguments have both branches inspected. `css.object()` is the style-object return; those leaves are still utilities.
- [x] `ATM-SITE-03` `[reference]` `[seam]` —
  **`recipe()` / `recipe.raw()` calls must extract `base`, variant, and `compoundVariants[].css` leaves.**
  Station `ATM-SITE-03`. Those leaves compile as closed classes in `@layer recipes` (and the variant table), not as utility wants. Closed recipe classes are `ATM-RECIPE-01`–`03`.
- [x] `ATM-SITE-04` `[forbidden]` `[seam]` —
  **The extract surface is `css()` and `recipe()` only.**
  Station `ATM-SITE-04`. Unknown helpers (`sva`, `tw`, `cx`) produce no wants. The author API is `css()` and `recipe()` from `@reference-ui/react`.
- [x] `ATM-SITE-05` `[reference]` `[seam]` —
  **Object spreads inside JSX and `css()` arguments must unpack inline without losing sibling properties.**
  Encounter object expressions containing inline object spreads (`...{ margin: '10px' }`) and conditional spreads (`...(cond ? { padding: '10px' } : { margin: '20px' })`). Assert that properties from all spread branches are merged into extracted wants alongside sibling static properties. Assert that dynamic unresolvable spreads emit a diagnostic warning while keeping all resolvable sibling properties intact.
- [x] `ATM-SITE-06` `[reference]` `[seam]` —
  **Top-level local constants and style objects must be indexed and resolved at style extraction sites.**
  Station `ATM-SITE-06`. `const theme = { primary: 'n300' }` resolves at `color={theme.primary}` and `css({ color: theme.primary })`.
- [x] `ATM-SITE-07` `[reference]` `[seam]` —
  **Non-style attributes and hallucinated component primitives must be ignored during AST traversal.**
  Station `ATM-SITE-07`. `id` / `onClick` / `tabIndex` / `aria-label` never become wants and produce no diagnostics. Unrecognized PascalCase (`<Foo color="red" />`) without StyleProps is skipped without error.
- [x] `ATM-SITE-08` `[forbidden]` `[seam]` —
  **Style extraction must rely exclusively on styletrace and canon rather than guessing PascalCase tags or config name arrays.**
  Station `ATM-SITE-08`. `compile()` calls `styletrace::trace_style_jsx_names`. Tags extract when they are in that set or imported from `@reference-ui/react` / `@reference-ui/styled`. Local `<Foo mt="4r" />` does not extract. Honest subset: without synced `.reference-ui` primitive declarations, styletrace does not list `Div` as a traced export; file-local Reference imports are the host evidence this station can provide. Not a PascalCase regex or config jsx name array.
- [x] `ATM-SITE-09` `[reference]` `[seam]` —
  **Boolean style attributes (`<Div border />`) must extract as `AtomValue::Bool(true)`.**
  Station `ATM-SITE-09`. `attr.value` absent + `is_known_style_prop`.
- [x] `ATM-SITE-10` `[reference]` `[seam]` —
  **`css()` / `recipe()` extract only when the callee is the Reference import, not a shadowed local.**
  Station `ATM-SITE-10`. `function f(css) { css({ color: 'red' }) }` does not extract. Unknown `css` is not an extract site. Live `import { css, recipe } from '@reference-ui/react'` still extracts.
- [x] `ATM-SITE-11` `[reference]` `[seam]` —
  **Identifier spreads of a local const style object (`<Div {...base} />`, `css({ ...base })`) must unpack known keys.**
  Station `ATM-SITE-11`. File-top `const` objects unpack; inline object spreads remain `ATM-SITE-05`.

### Leaf Literal Extraction

- [x] `ATM-LEAF-01` `[reference]` `[seam]` —
  **Flat ternaries must unconditionally scoop both consequent and alternate branches without evaluating conditions.**
  Encounter style prop expressions with flat ternaries (`bg={active ? "n300" : "n100"}` or `color={true ? "white" : "black"}`). Assert that both branches are collected as separate wants regardless of whether the test expression is dynamic or a literal boolean. Assert that no runtime JavaScript interpreter is invoked to resolve the condition.
- [x] `ATM-LEAF-02` `[reference]` `[seam]` —
  **Nested ternaries must recursively flatten all conditional branches without leaf dropout.**
  Station `ATM-LEAF-02`. Encounter multi-level nested ternaries (such as Tabs-shaped `borderBottom={isLine && horiz ? (selected ? '3px solid' : '3px solid transparent') : undefined}`). Assert that every reachable literal branch across all nesting depths is extracted into wants. Assert that complex logical guard expressions surrounding the ternary do not cause leaf omission.
- [x] `ATM-LEAF-03` `[reference]` `[seam]` —
  **Branches resolving to `undefined` or `void 0` must be omitted without emitting null wants or dead atoms.**
  Station `ATM-LEAF-03`. Encounter ternaries where one branch is `undefined`, `void 0`, or an empty expression container. Assert that only the defined literal branch is pushed to the wants collection. Assert that no `null` atom value or useless class name is emitted in either the runtime map or the stylesheet.
- [x] `ATM-LEAF-04` `[reference]` `[seam]` —
  **Logical operator expressions (`&&`, `||`, `??`) must symmetrically collect literal styling operands.**
  Encounter expressions using logical AND (`false && '1px solid'`), logical OR (`'red' || 'blue'`), and nullish coalescing (`custom ?? 'green'`). Assert that the literal style operand is extracted from guarded AND expressions and that both operands are extracted from OR and nullish coalescing expressions. Assert that guard identifiers like `undefined` and `null` are discarded.
- [x] `ATM-LEAF-05` `[reference]` `[seam]` —
  **Responsive arrays must map indexed elements to default breakpoint conditions while skipping null slots.**
  Encounter responsive array expressions on style props (e.g. `mt={['1r', '2r', null, '4r']}`). Assert that index 0 maps to condition `base` (unconditioned), index 1 maps to `sm` (or first configured breakpoint from compile input/tokens), index 2 (null) is skipped without generating an atom, and index 3 maps to `md` (or second configured breakpoint). Assert that responsive array slots containing ternaries have both ternary branches collected under that slot's breakpoint condition. Array-slot to named scale is owned by atomic and parameterized by compile input / base-system tokens, decoupled from canon.
- [x] `ATM-LEAF-06` `[reference]` `[seam]` —
  **Computed object property keys in style objects must be refused with a diagnostic warning.**
  Station `ATM-LEAF-06`. `css({ [dynamicKey]: '10px' })` warns; sibling static properties still extract.
- [x] `ATM-LEAF-07` `[forbidden]` `[seam]` —
  **Unresolvable dynamic expressions and function calls must not be evaluated and must preserve sibling static properties.**
  Encounter style declarations containing unresolvable function calls (`color: maybeFn()`) or dynamic runtime properties (`width: props.w`). Assert that the engine does not evaluate the function or execute JS, emits a diagnostic warning naming the affected property, and successfully extracts all valid sibling static properties in the same object.
- [x] `ATM-LEAF-08` `[reference]` `[seam]` —
  **Comprehensive style expressions batch table must extract diverse CSS properties and values without error.**
  Execute the full table of absorbed styling expressions across layout, flexbox, grid, typography, borders, and effects. Assert that unitless numbers, percentages, pixel dimensions, keywords, and rhythm values are accurately extracted into corresponding wants. Assert that responsive conditions assigned to table entries match expected breakpoint conditions.
- [x] `ATM-LEAF-09` `[reference]` `[seam]` —
  **Authored `!` / `!important` suffixes on string literals must set `Want.important` and emit `mt_2r!`.**
  Station `ATM-LEAF-09`. `mt="2r!"` / `css({ p: '1r!' })` set `Want.important` and print `.mt_2r\!`.

### Styling Want IR

- [x] `ATM-WANT-01` `[reference]` `[seam]` —
  **`Want` struct must capture authored property, value, cumulative condition scopes, importance, and origin.**
  Station `ATM-WANT-01`. Builder fields round-trip through compile wants: boxed prop names, typed `AtomValue`, condition paths, importance.
- [x] `ATM-WANT-02` `[reference]` `[seam]` —
  **`Want` declarations must serialize and deserialize through serde with exact structural fidelity.**
  Station `ATM-WANT-02`. Nested conditions and origin survive JSON round-trip.

### Atom Representation & AtomSet

- [x] `ATM-ATOM-01` `[reference]` `[seam]` —
  **`Atom` declaration must encapsulate normalized property, value, condition chain, importance, and fast hash.**
  Station `ATM-ATOM-01`. Identical fields hash equal; identity covers property, value, conditions, and importance.
- [x] `ATM-ATOM-02` `[reference]` `[seam]` —
  **`AtomValue` variants must provide distinct class name strings and valid CSS output values.**
  Station `ATM-ATOM-02`. `String` / `Token` / `Number` / `Bool` / `Null` class keys vs CSS values, serde-stable.
- [x] `ATM-ATOM-03` `[reference]` `[seam]` —
  **`AtomSet` must deduplicate identical atomic declarations across source files using precomputed hashing.**
  Station `ATM-ATOM-03`. Duplicate inserts do not grow the set.
- [x] `ATM-ATOM-04` `[reference]` `[seam]` —
  **One class per leaf grain must be strictly maintained across all resolved atoms.**
  Station `ATM-ATOM-04`. Every compiled atom is one property.

### Rhythm Engine

- [x] `ATM-RHYTHM-01` `[reference]` `[seam]` —
  **Base rhythm unit declarations (`r`, `+r`, `1r`, `-r`) must resolve to standard spacing CSS expressions.**
  Pass rhythm values `r`, `+r`, and `1r` into the rhythm resolver. Assert that each resolves to `var(--spacing-root)`. Pass negative rhythm value `-r` and assert that it resolves to `calc(-1 * var(--spacing-root))`.
- [x] `ATM-RHYTHM-02` `[reference]` `[seam]` —
  **Rhythm integer multipliers and decimal values must resolve to exact CSS multiplication expressions.**
  Pass integer multipliers `2r`, `-2r` and decimal fractions `0.5r`, `1.5r` to the rhythm resolver. Assert that positive values resolve to `calc(N * var(--spacing-root))` and negative values resolve to `calc(-N * var(--spacing-root))`.
- [x] `ATM-RHYTHM-03` `[reference]` `[seam]` —
  **Fractional rhythm units (`1/3r`, `2/3r`, `-1/3r`) must resolve to exact division CSS formulas.**
  Pass fractional rhythm strings with denominators (e.g. `1/3r`, `2/3r`, `-1/3r`, `-2/3r`). Assert that `1/3r` resolves to `calc(var(--spacing-root) / 3)` and `2/3r` resolves to `calc(2 * var(--spacing-root) / 3)`. Assert that zero denominator fractions are rejected.
- [x] `ATM-RHYTHM-04` `[reference]` `[seam]` —
  **Multi-value CSS property strings must resolve embedded rhythm tokens while passing through raw values.**
  Station `ATM-RHYTHM-04`. `1r 2r` and `1px solid 1/3r` keep non-rhythm tokens in place.
- [x] `ATM-RHYTHM-05` `[reference]` `[seam]` —
  **Negative rhythm values authored in JSX or `css()` must extract and compile without syntax errors.**
  Compile sources containing `marginTop="-1r"` or `left="-2r"`. Assert that valid wants are extracted with negative values, compiled into `mt_-1r` class names, and emitted as valid negative calc declarations in CSS.

### Shorthand Decomposition & Cascade Safety

- [x] `ATM-SHORT-01` `[reference]` `[seam]` —
  **Composite `borderBottom` shorthand must decompose into width and style without emitting `currentColor`.**
  Compile a component specifying `borderBottom="3px solid"` alongside `borderColor="gray.800"`. Assert that `borderBottomWidth: 3px;` and `borderBottomStyle: solid;` are emitted. Assert that `currentColor` is never synthesized or emitted, preventing the catastrophic CSS cascade anomaly that clobbers sibling border colors.
- [x] `ATM-SHORT-02` `[reference]` `[seam]` —
  **Composite `outline` shorthand must decompose into width and style without clobbering `outlineColor`.**
  Station `ATM-SHORT-02`. Compile a component specifying `outline="1px solid"` alongside `outlineColor="blue.600"`. Assert that `outline-width: 1px;` and `outline-style: solid;` are emitted as atomic rules. Assert that default outline color is never synthesized, ensuring `outline-color: var(--colors-blue-600);` wins cleanly.
- [x] `ATM-SHORT-03` `[reference]` `[seam]` —
  **Border zero dimensions and whole-value tokens must pass through without unwanted decomposition.**
  Station `ATM-SHORT-03`. Zero widths become `0px`; `none` / `inherit` / `borders.card` stay single properties.
- [x] `ATM-SHORT-04` `[reference]` `[seam]` —
  **Composite border shorthands (`border`, `borderTop`, `borderBottom`, `outline`) must decompose to canon longhands.**
  Station `ATM-SHORT-04`. Emitted names equal `canon::native_longhands_for_prop`. Not a private `BORDER_CONFIGS` table.
- [x] `ATM-SHORT-05` `[reference]` `[seam]` —
  **Dimensional shorthands with 2–4 tokens expand to physical longhands; a single token does not expand.**
  Station `ATM-SHORT-05`. `padding: 10px 20px` → four longhands; `padding: 10px` / `p: 1r` passthrough.

### Condition Scoping & Dialect Patterns

- [x] `ATM-COND-01` `[reference]` `[seam]` —
  **Named breakpoint conditions from the compile-time scale must lower to `@container (min-width: Npx)`.**
  Station `ATM-COND-01`. Default utterance `sm` / `md` / `lg` / `xl` / `2xl` maps to 640 / 768 / 1024 / 1280 / 1536 px. Array-slot indexing is `ATM-LEAF-05`. Names without a width are not at-rules.
- [x] `ATM-COND-02` `[reference]` `[seam]` —
  **`_hover` lowers to `&:is(:hover, [data-hover])` and that selector is applied to the class.**
  Station `ATM-COND-02`. Spec used to list `_active`, `_focus`, `_focusVisible`, `_disabled` as proven; those presets are not in this station.
- [x] `ATM-COND-03` `[reference]` `[seam]` —
  **`_dark` lowers to `[data-panda-theme=dark] &` and applies as `[data-panda-theme=dark] .dark\:…`.**
  Station `ATM-COND-03`. `_light` is `ATM-COND-08`. Host primitives stamp `DATA_COLOR_MODE_ATTR = 'data-panda-theme'`.
- [x] `ATM-COND-04` `[reference]` `[seam]` —
  **Cumulative nested condition chains must preserve outer-to-inner scope ordering.**
  Compile nested condition scopes (e.g. `_dark: { _hover: { _focusVisible: { borderColor: 'gold' } } }`). Assert that the extracted want retains the exact ordered condition path `['_dark', '_hover', '_focusVisible']`. Assert that the class name prefixes conditions in order (`dark:hover:focusVisible:borderC_gold`).
- [x] `ATM-COND-05` `[reference]` `[seam]` —
  **Dialect utilities (`container`, `font`, `weight`, `size`) must lower like core's box-pattern transforms.**
  Station `ATM-COND-05`. `container` stamps `containerType` / `containerName`. `size` expands to equal `width` / `height`. `font` / `weight` look up the compile-time `font()` table. Lib fixture `font="sans"` includes `css.letterSpacing` (`-0.01em`).
- [x] `ATM-COND-06` `[reference]` `[seam]` —
  **Runtime-owned component properties (`variant`, `colorMode`) must be excluded from atomic stylesheet emission.**
  Station `ATM-COND-06`. `variant="primary"` / `colorMode="dark"` extract as wants but emit no utilities. Sibling StyleProps still compile.
- [x] `ATM-COND-07` `[reference]` `[seam]` —
  **Responsive `r` container query objects must lower to `@container (min-width: ...)` condition wrappers.**
  Station `ATM-COND-07`. `r={{ 300: { p: '1r' }, md: { mt: '2r' } }}` stamps `when` with the query strings and prints those at-rules. Unknown names warn and skip.
- [x] `ATM-COND-08` `[reference]` `[seam]` —
  **Theme conditions must match the host color-mode attribute, not only a `.dark` class.**
  Station `ATM-COND-08`. `_dark` / `_light` wrap as `[data-panda-theme=dark] &` / `[data-panda-theme=light] &`. Core primitives use `DATA_COLOR_MODE_ATTR = 'data-panda-theme'`. The wrap comes from `BaseSystem::lib_fixture()`, not a hardcoded `.dark &` preset.
- [x] `ATM-COND-09` `[reference]` `[seam]` —
  **Group/peer and arbitrary `&` / `@` conditions must survive into the stylesheet.**
  Station `ATM-COND-09`. `_groupHover` / `_peerFocus` wrap from the lib fixture. `'&[data-slot=inner]'` prints a real rule. Canon `NAMED_CONDITIONS` also lists `_osDark` / `_motionReduce`; those `@media` presets are not this station.

### Design Token Resolution

- [x] `ATM-TOKEN-01` `[reference]` `[seam]` —
  **Category-prefixed design token paths must resolve to canonical `var(--...)` custom properties.**
  Station `ATM-TOKEN-01`. `colors.blue.600` → `var(--colors-blue-600)`, `radii.md` → `var(--radii-md)`, `fonts.mono` → `var(--fonts-mono)`.
- [x] `ATM-TOKEN-02` `[reference]` `[seam]` —
  **Bare color token paths on color-accepting properties must resolve to `--colors-` custom properties.**
  Station `ATM-TOKEN-02`. `blue.600` / `gray.800` on color props become `var(--colors-…)`. `mt="blue.600"` stays raw and warns.
- [x] `ATM-TOKEN-03` `[reference]` `[seam]` —
  **Color token opacity modifiers (`/opacity`) must resolve to standard `color-mix` CSS functions.**
  Station `ATM-TOKEN-03`. `colors.blue.600/50` and `red.500/25%` become `color-mix(in srgb, var(--colors-…) N%, transparent)`.
- [x] `ATM-TOKEN-04` `[reference]` `[seam]` —
  **CSS color keywords must pass through as raw values without custom property conversion.**
  Station `ATM-TOKEN-04`. `transparent` / `currentColor` / `black` / `white` stay raw, never `var(--colors-transparent)`.
- [x] `ATM-TOKEN-05` `[reference]` `[seam]` —
  **`compile()` must ingest BaseSystem token collections, replacing heuristic category checks with authoritative lookup.**
  Station `ATM-TOKEN-05`. A custom dump resolves `colors.brand`; unknown `blue.600` passes through with a warning. The compiler does not invent tokens.

### Component Recipes & Closed Variants

- [x] `ATM-RECIPE-01` `[reference]` `[seam]` —
  **Recipe declarations must compile into closed variant classes scoped inside `@layer recipes`.**
  Compile component recipe declarations authored via `recipe()`. Assert that each declared variant permutation compiles into a single deterministic class name emitted inside `@layer recipes`. Assert that recipe classes do not pollute `@layer utilities`.
- [x] `ATM-RECIPE-02` `[reference]` `[seam]` —
  **Compiler must emit an authoritative variant lookup table for the runtime `recipe()` helper.**
  Compile a recipe with multiple variants and compound variants. Assert that `CompileResult` outputs a JSON variant table mapping variant prop combinations to compiled recipe class names. Assert that the runtime helper consumes this table directly without re-evaluating styles.
- [x] `ATM-RECIPE-03` `[reference]` `[seam]` —
  **StyleProps authored on a recipe host component must remain atomic utilities that override recipe styles.**
  Compile a component that applies a recipe and specifies additional StyleProps (e.g. `<Button variant="primary" mt="2r" bg="red.500" />`). Assert that `mt` and `bg` are emitted as utility atoms in `@layer utilities`. Because `@layer utilities` follows `@layer recipes`, assert that atomic StyleProps win naturally by CSS cascade precedence.

### Static CSS Expansion

- [x] `ATM-STATIC-01` `[reference]` `[seam]` —
  **`staticCss` declarations from BaseSystem must synthesize all declared property and token combinations as wants.**
  Station `ATM-STATIC-01`. Dump `color: ['*']` enumerates color tokens; `bg: ['n100', 'n200', 'n300']` lists values. Those wants join AST extract before resolve. `bg={prop}` looks up because the utilities exist. Lib fixture `staticCss` stays empty.
- [x] `ATM-STATIC-02` `[reference]` `[seam]` —
  **Static CSS wants must dominate AtomSet size and deduplicate seamlessly with AST-extracted wants.**
  Station `ATM-STATIC-02`. AST `bg="n300"` plus static `bg: ['n100', 'n300']` is one `.bg_n300` class. `n100` still prints from the dump.

### Cascade Layers & Preamble

- [x] `ATM-LAYER-01` `[reference]` `[seam]` —
  **Compiled stylesheet must always begin with the strict 6-layer preamble in canonical order.**
  Compile arbitrary sources and inspect the first line of the emitted stylesheet. Assert that it begins verbatim with `@layer reset, global, base, tokens, recipes, utilities;\n`. Assert that no CSS rule appears before the layer order statement.
- [x] `ATM-LAYER-02` `[reference]` `[seam]` —
  **Empty layers must remain resilient and valid in the emitted stylesheet.**
  Station `ATM-LAYER-02`. Empty `reset` / `base` / `recipes` stay omitted. Fixture `globalCss` and tokens populate those layers (`ATM-LAYER-03`).
- [x] `ATM-LAYER-03` `[reference]` `[seam]` —
  **BaseSystem layer contents must populate `@layer global` and `@layer tokens`.**
  Station `ATM-LAYER-03`. Stored `globalCss` (`:root --spacing-root`) prints in `@layer global`. Token light values sit on `:root`; dark overrides sit under `[data-panda-theme=dark]`. Empty reset/recipes stay omitted. Reset chrome and keyframes are not in tonight's fixture.
- [x] `ATM-LAYER-04` `[reference]` `[seam]` —
  **All generated atomic utility rules and media query wrappers must be encapsulated inside `@layer utilities`.**
  Station `ATM-LAYER-04`. Unconditioned classes and wrapping `@media` / `@container` stay inside `@layer utilities`.

### Class Naming & Character Hygiene

- [x] `ATM-NAME-01` `[reference]` `[seam]` —
  **Canonical class names must combine property prefix and sanitized value string.**
  Station `ATM-NAME-01`. `marginTop="2r"` → `mt_2r`; runtime strings stay unescaped.
- [x] `ATM-NAME-02` `[reference]` `[seam]` —
  **Condition paths must prefix the base class name separated by colons.**
  Station `ATM-NAME-02`. `_hover` → `hover:bg_n300`; nested `_dark` + `_hover` prefix in order.
- [x] `ATM-NAME-03` `[reference]` `[seam]` —
  **Inline important declarations must suffix the class name with an exclamation mark.**
  Station `ATM-NAME-03`. `marginTop="2r!"` → `mt_2r!` / `.mt_2r\!`.
- [x] `ATM-NAME-04` `[reference]` `[seam]` —
  **Special characters in class names must be escaped with backslashes in CSS selectors.**
  Station `ATM-NAME-04`. Slashes, dots, colons, and brackets escape in selectors; runtime names stay clean.
- [x] `ATM-NAME-05` `[reference]` `[seam]` —
  **Whitespace characters in multi-token values must be converted to underscores in class names.**
  Station `ATM-NAME-05`. `3px solid` → `3px_solid`.

### Compiler Diagnostics & Fail-Closed Semantics

- [x] `ATM-DIAG-01` `[reference]` `[seam]` —
  **Valid source code compilation must emit an empty diagnostics collection.**
  Station `ATM-DIAG-01`. Valid StyleProps / `css()` emit no spurious warnings.
- [x] `ATM-DIAG-02` `[reference]` `[seam]` —
  **Dynamic non-literal expressions must emit fail-closed diagnostic warnings with source locations.**
  Station `ATM-DIAG-02`. Unresolvable identifiers get `warning` + file path; CSS still compiles.
- [x] `ATM-DIAG-03` `[reference]` `[seam]` —
  **AST parsing syntax errors must be recorded as error diagnostics without crashing the process.**
  Station `ATM-DIAG-03`. Malformed source yields `severity: error` and a `CompileResult` (no panic).

### Forbidden Architectural Patterns

- [x] `ATM-FORBID-01` `[forbidden]` `[seam]` —
  **Hashed whole-object class names are strictly forbidden.**
  Station `ATM-FORBID-01`. Output has no `.css-` whole-object hashes.
- [x] `ATM-FORBID-02` `[forbidden]` `[seam]` —
  **Runtime JavaScript evaluation during compilation is strictly forbidden.**
  Station `ATM-FORBID-02`. Dynamic calls are not evaluated; siblings still extract.
- [x] `ATM-FORBID-03` `[forbidden]` `[seam]` —
  **Maintaining a second class namer outside of `stylesheet::name` is strictly forbidden.**
  Station `ATM-FORBID-03`. Every `css.classes` value equals `stylesheet::name::class_name` for that atom (ghost gauge plus dedicated assertion).
- [x] `ATM-FORBID-04` `[forbidden]` `[seam]` —
  **Dynamic code generation of `css.js` or runtime JavaScript files is strictly forbidden.**
  Station `ATM-FORBID-04`. `CompileResult` is data; the compiler does not write `.js`.
- [x] `ATM-FORBID-05` `[forbidden]` `[seam]` —
  **Atomic must not keep private CSS property / color tables next to canon.**
  Station `ATM-FORBID-05`. `border.rs` / `dimensional.rs` / `tokens/mod.rs` must not grow `BORDER_CONFIGS` or hardcoded color props.

---

## 5. Existing Proof Map

A tick is a `tests/cases/<ATM-*>` folder whose name is the ID. Standing gauges
cover `ATM-GHOST-01` and `ATM-LAYER-01`. Cargo `#[test]` is not a tick.

| Contract ID | Status | Harness | Proof Source |
| :--- | :--- | :--- | :--- |
| `ATM-GHOST-01` | `[x]` | `[seam]` | `tests/helpers.ts` `atomicGauges` |
| `ATM-GHOST-02` | `[x]` | `[seam]` | `tests/cases/ATM-GHOST-02/` |
| `ATM-GHOST-03` | `[x]` | `[seam]` | `tests/cases/ATM-GHOST-03/` |
| `ATM-SITE-01` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-01/` |
| `ATM-SITE-02` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-02/` |
| `ATM-SITE-03` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-03/` |
| `ATM-SITE-04` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-04/` |
| `ATM-SITE-05` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-05/` |
| `ATM-SITE-06` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-06/` |
| `ATM-SITE-07` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-07/` |
| `ATM-SITE-08` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-08/` |
| `ATM-SITE-09` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-09/` |
| `ATM-SITE-10` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-10/` |
| `ATM-SITE-11` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-11/` |
| `ATM-LEAF-01` | `[x]` | `[seam]` | `tests/cases/ATM-LEAF-01/` |
| `ATM-LEAF-02` | `[x]` | `[seam]` | `tests/cases/ATM-LEAF-02/` |
| `ATM-LEAF-03` | `[x]` | `[seam]` | `tests/cases/ATM-LEAF-03/` |
| `ATM-LEAF-04` | `[x]` | `[seam]` | `tests/cases/ATM-LEAF-04/` |
| `ATM-LEAF-05` | `[x]` | `[seam]` | `tests/cases/ATM-LEAF-05/` |
| `ATM-LEAF-06` | `[x]` | `[seam]` | `tests/cases/ATM-LEAF-06/` |
| `ATM-LEAF-07` | `[x]` | `[seam]` | `tests/cases/ATM-LEAF-07/` |
| `ATM-LEAF-08` | `[x]` | `[seam]` | `tests/cases/ATM-LEAF-08/` |
| `ATM-LEAF-09` | `[x]` | `[seam]` | `tests/cases/ATM-LEAF-09/` |
| `ATM-WANT-01` | `[x]` | `[seam]` | `tests/cases/ATM-WANT-01/` |
| `ATM-WANT-02` | `[x]` | `[seam]` | `tests/cases/ATM-WANT-02/` |
| `ATM-ATOM-01` | `[x]` | `[seam]` | `tests/cases/ATM-ATOM-01/` |
| `ATM-ATOM-02` | `[x]` | `[seam]` | `tests/cases/ATM-ATOM-02/` |
| `ATM-ATOM-03` | `[x]` | `[seam]` | `tests/cases/ATM-ATOM-03/` |
| `ATM-ATOM-04` | `[x]` | `[seam]` | `tests/cases/ATM-ATOM-04/` |
| `ATM-RHYTHM-01` | `[x]` | `[seam]` | `tests/cases/ATM-RHYTHM-01/` |
| `ATM-RHYTHM-02` | `[x]` | `[seam]` | `tests/cases/ATM-RHYTHM-02/` |
| `ATM-RHYTHM-03` | `[x]` | `[seam]` | `tests/cases/ATM-RHYTHM-03/` |
| `ATM-RHYTHM-04` | `[x]` | `[seam]` | `tests/cases/ATM-RHYTHM-04/` |
| `ATM-RHYTHM-05` | `[x]` | `[seam]` | `tests/cases/ATM-RHYTHM-05/` |
| `ATM-SHORT-01` | `[x]` | `[seam]` | `tests/cases/ATM-SHORT-01/` |
| `ATM-SHORT-02` | `[x]` | `[seam]` | `tests/cases/ATM-SHORT-02/` |
| `ATM-SHORT-03` | `[x]` | `[seam]` | `tests/cases/ATM-SHORT-03/` |
| `ATM-SHORT-04` | `[x]` | `[seam]` | `tests/cases/ATM-SHORT-04/` |
| `ATM-SHORT-05` | `[x]` | `[seam]` | `tests/cases/ATM-SHORT-05/` |
| `ATM-COND-01` | `[x]` | `[seam]` | `tests/cases/ATM-COND-01/` |
| `ATM-COND-02` | `[x]` | `[seam]` | `tests/cases/ATM-COND-02/` |
| `ATM-COND-03` | `[x]` | `[seam]` | `tests/cases/ATM-COND-03/` |
| `ATM-COND-04` | `[x]` | `[seam]` | `tests/cases/ATM-COND-04/` |
| `ATM-COND-05` | `[x]` | `[seam]` | `tests/cases/ATM-COND-05/` |
| `ATM-COND-06` | `[x]` | `[seam]` | `tests/cases/ATM-COND-06/` |
| `ATM-COND-07` | `[x]` | `[seam]` | `tests/cases/ATM-COND-07/` |
| `ATM-COND-08` | `[x]` | `[seam]` | `tests/cases/ATM-COND-08/` |
| `ATM-COND-09` | `[x]` | `[seam]` | `tests/cases/ATM-COND-09/` |
| `ATM-TOKEN-01` | `[x]` | `[seam]` | `tests/cases/ATM-TOKEN-01/` |
| `ATM-TOKEN-02` | `[x]` | `[seam]` | `tests/cases/ATM-TOKEN-02/` |
| `ATM-TOKEN-03` | `[x]` | `[seam]` | `tests/cases/ATM-TOKEN-03/` |
| `ATM-TOKEN-04` | `[x]` | `[seam]` | `tests/cases/ATM-TOKEN-04/` |
| `ATM-TOKEN-05` | `[x]` | `[seam]` | `tests/cases/ATM-TOKEN-05/` |
| `ATM-RECIPE-01` | `[x]` | `[seam]` | `tests/cases/ATM-RECIPE-01/` |
| `ATM-RECIPE-02` | `[x]` | `[seam]` | `tests/cases/ATM-RECIPE-02/` |
| `ATM-RECIPE-03` | `[x]` | `[seam]` | `tests/cases/ATM-RECIPE-03/` |
| `ATM-STATIC-01` | `[x]` | `[seam]` | `tests/cases/ATM-STATIC-01/` |
| `ATM-STATIC-02` | `[x]` | `[seam]` | `tests/cases/ATM-STATIC-02/` |
| `ATM-LAYER-01` | `[x]` | `[seam]` | `tests/helpers.ts` `atomicGauges` |
| `ATM-LAYER-02` | `[x]` | `[seam]` | `tests/cases/ATM-LAYER-02/` |
| `ATM-LAYER-03` | `[x]` | `[seam]` | `tests/cases/ATM-LAYER-03/` |
| `ATM-LAYER-04` | `[x]` | `[seam]` | `tests/cases/ATM-LAYER-04/` |
| `ATM-NAME-01` | `[x]` | `[seam]` | `tests/cases/ATM-NAME-01/` |
| `ATM-NAME-02` | `[x]` | `[seam]` | `tests/cases/ATM-NAME-02/` |
| `ATM-NAME-03` | `[x]` | `[seam]` | `tests/cases/ATM-NAME-03/` |
| `ATM-NAME-04` | `[x]` | `[seam]` | `tests/cases/ATM-NAME-04/` |
| `ATM-NAME-05` | `[x]` | `[seam]` | `tests/cases/ATM-NAME-05/` |
| `ATM-DIAG-01` | `[x]` | `[seam]` | `tests/cases/ATM-DIAG-01/` |
| `ATM-DIAG-02` | `[x]` | `[seam]` | `tests/cases/ATM-DIAG-02/` |
| `ATM-DIAG-03` | `[x]` | `[seam]` | `tests/cases/ATM-DIAG-03/` |
| `ATM-FORBID-01` | `[x]` | `[seam]` | `tests/cases/ATM-FORBID-01/` |
| `ATM-FORBID-02` | `[x]` | `[seam]` | `tests/cases/ATM-FORBID-02/` |
| `ATM-FORBID-03` | `[x]` | `[seam]` | `tests/cases/ATM-FORBID-03/` |
| `ATM-FORBID-04` | `[x]` | `[seam]` | `tests/cases/ATM-FORBID-04/` |
| `ATM-FORBID-05` | `[x]` | `[seam]` | `tests/cases/ATM-FORBID-05/` |

---

## 6. Remaining Cases [ ] (what a real `styles.css` still needs)

Track A+ ticked `COND-01`/`05`/`06`/`07`/`09`, `TOKEN-01`–`05`,
`LAYER-03`, and closed recipes (`ATM-RECIPE-01`–`03`). Reset chrome and
keyframes are still empty in tonight's fixture.

### Still open

None of the 75 named IDs remain. Panda jobs we **do not** add as cases:
`jsxMatchTag` config, literal evaluator, LightningCSS, `split_css`,
hooks, `styled.div` factory, slot-recipe `sva`, `$` token rename hook.

---

## 7. "Do Not" / Tripwires

The following architectural constraints are strictly enforced across the `atomic` module. Violating any of these tripwires indicates an incorrect engine design:

1. **DO NOT evaluate author JavaScript (`ATM-FORBID-02`)**:
   Never embed or invoke a JavaScript runtime, interpreter (QuickJS, V8, Boa), or AST evaluator (`ts-evaluator`) to evaluate expressions, identifiers, or closures. Static constant extraction is restricted to top-level literals indexed in `LocalConstants`.
2. **DO NOT invent a second class namer (`ATM-FORBID-03`, `ATM-GHOST-01`)**:
   Never generate or transform class names outside of `stylesheet::name::class_name`. Runtime `css()` map generation and stylesheet rule emission must call the exact same Rust function. Do not synthesize class names in TypeScript or post-process them with PostCSS.
3. **DO NOT emit hashed whole-object class names (`ATM-FORBID-01`)**:
   Never hash a style object into a single class name (e.g. `.css-1a2b3c`). Runtime `css()` is an open composition API requiring atomic utility classes (`.mt_2r`, `.bg_n300`) to concatenate overrides dynamically.
4. **DO NOT generate `css.js` or executable runtime code (`ATM-FORBID-04`)**:
   Never dynamically generate JavaScript code files for the runtime `css()` helper. The runtime helper is stable authored TypeScript in `reference-core/src/system/runtime`; the compiler emits only the data map (`CssRuntime`).
5. **DO NOT synthesize `currentColor` for omitted shorthand components (`ATM-SHORT-01`)**:
   Never supply a default color when decomposing composite shorthands like `borderBottom="3px solid"`. Emitting `currentColor` creates a catastrophic cascade reset that destroys independent `borderColor` styling.
6. **DO NOT guess JSX tags using PascalCase or regex (`ATM-SITE-08`)**:
   Never guess that an arbitrary PascalCase element is a styled component. Styleprop-bearing primitives are authoritatively identified via `styletrace` and `canon`.
7. **DO NOT split `atomic` into 12 micro-crates**:
   Follow the module layout within the single `atomic` crate. Panda's process split (`pandacss_extractor`, `pandacss_encoder`, `pandacss_utility`, …) is the example of the work, not a crate layout to copy.
8. **DO NOT collect `tokens()` or emit `StyleProps` interfaces**:
   Design system fragments (`tokens()`, `font()`, `globalCss()`) are collected in JavaScript by `reference-core/src/lib/fragments`. TypeScript interface generation is owned by `modules/typegen`.
9. **DO NOT own React DOM primitives**:
   Primitives (`Div`, `Button`, `Span`, etc.) live in `@reference-ui/react`. The atomic engine is a pure stylesheet compiler that knows nothing about React component lifecycles or virtual DOMs.
