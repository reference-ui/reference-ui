# Atomic Style Engine SPEC

Current freeze, cases, and proof. Design narrative: [README.md](./README.md).
Mandate and architecture: [REFERENCE_SYSTEM.md](../../../REFERENCE_SYSTEM.md), [atomic.md](../../docs/atomic.md), and [PANDA.md](./PANDA.md) (vendor example / process map).

Harness / Runner: `pnpm agentrs c atomic` (Cargo unit tests) | `pnpm agentrs v atomic` (Vitest seam tests)

## 1. Job of the Crate

The `atomic` style engine compiles authored StyleProps, `css()` calls, and component recipes into a deterministic atomic stylesheet and a runtime class map using a single shared namer. It takes input sources (TSX, JSX, TS, JS) and, upon contract completion, a design system definition (`BaseSystem`); it emits two synchronized artifacts—a six-layer stylesheet (`styles.css` adhering to `@layer reset, global, base, tokens, recipes, utilities;`) and a runtime lookup map (`css` mapping `[when:]prop:value` to compiled utility class names)—accompanied by compiler diagnostics. It must not evaluate author JavaScript at compile time, must not emit hashed whole-object class names, must not maintain a second namer between the stylesheet and runtime, must not generate executable `css.js` code files, must not collect `tokens()` (owned by JavaScript fragments), must not emit `StyleProps` TypeScript interfaces (owned by typegen), and must not own React DOM primitives such as `Div` or `Button`.

## 2. Legend & Status

- `[x]` Proven by a named `#[test]` or a `tests/cases/<ATM-*>` spec assertion that checks this contract.
- `[ ]` Specified; not proven. **Code existing in `src/` is not proof.** A proof-map row that only names a function is `[ ]`.

Audit: 2026-09-14. Strict 1:1 case-to-spec-ID alignment enforced. Cases that combined multiple IDs or lacked dedicated proof stations are demoted to `[ ]` (`ATM-SHORT-02`, `ATM-SITE-03`, `ATM-LEAF-02`, `ATM-LEAF-03`, `ATM-LAYER-02`, `ATM-LAYER-04`, `ATM-DIAG-01`, `ATM-DIAG-02`). Each station in `tests/cases/<ATM-*>` links to exactly one SPEC ID.

### Status counts

| Metric | Count |
| :--- | :--- |
| Engine | Functional pipeline (extract → atom → stylesheet + class map). `compile()` does not take a BaseSystem. `src/recipes` is gone. JSX extract does not call styletrace. |
| Total contract cases | 75 |
| Named `[x]` proven | 43 |
| Remaining `[ ]` | 32 |
| Cargo `#[test]` | 46 |
| Vitest seam stations | 13 (`tests/cases/<ATM-*>`) |

### Breakdown by Area

| Area | Meaning | Total | Proven `[x]` | Remaining `[ ]` |
| :--- | :--- | :--- | :--- | :--- |
| `GHOST` | Zero ghost class invariants & bijective namer (P0) | 3 | 3 | 0 |
| `SITE` | Style extraction sites (JSX, calls, spreads, constants, imports) | 11 | 4 | 7 |
| `LEAF` | AST leaf literal extraction & branch flattening | 9 | 5 | 4 |
| `WANT` | Raw styling intention IR (`Want`) & serialization | 2 | 2 | 0 |
| `ATOM` | Atom representation, values, hashing, & `AtomSet` | 4 | 3 | 1 |
| `RHYTHM` | Spatial rhythm formulas & multi-value pass-through | 5 | 5 | 0 |
| `SHORT` | Shorthand decomposition without `currentColor` reset | 5 | 4 | 1 |
| `COND` | Conditions, media queries, pseudo-classes, & patterns | 9 | 6 | 3 |
| `TOKEN` | Token resolution, CSS vars, & BaseSystem ingest | 5 | 4 | 1 |
| `RECIPE` | Closed variant classes & variant lookup tables | 3 | 0 | 3 |
| `STATIC` | Static CSS want synthesis from BaseSystem | 2 | 0 | 2 |
| `LAYER` | Cascade layer order (`@layer`) & layer population | 4 | 1 | 3 |
| `NAME` | Deterministic class naming & selector escaping | 5 | 5 | 0 |
| `DIAG` | Diagnostics, location tracking, & fail-closed parsing | 3 | 0 | 3 |
| `FORBID` | Forbidden architectural patterns & tripwires | 5 | 1 | 4 |
| **Total** | | **75** | **43** | **32** |

---

## 3. Pipeline

This crate is one compiler. Authors write StyleProps, `css()`, and `recipe()`
from `@reference-ui/react`. Compile emits a six-layer stylesheet and a class
map. One namer. No generated `css.js`.

| Pass | Home | Job |
| :--- | :--- | :--- |
| sites | `src/extract/sites`<br>`ATM-SITE-01`–`11` | JSX StyleProps, `css()`, `recipe()`. Styletrace gating is SITE-08, unproven. |
| leaves | `src/extract/leaves`<br>`ATM-LEAF-01`–`09` | Flatten ternaries, spreads, arrays into wants. No JS eval. |
| resolve | `src/resolve/*`<br>`ATM-SHORT-*`, `ATM-RHYTHM-*`, `ATM-TOKEN-*`, `ATM-COND-*` | Rhythm, tokens, shorthands, conditions |
| atom | `src/atom`<br>`ATM-ATOM-*`, `ATM-WANT-*` | One `(prop, value, when)` = one Atom |
| recipes | *(module deleted)*<br>`ATM-RECIPE-01`–`03` | Closed `recipe()` tables in `@layer recipes`. Unproven. Extract of recipe leaves is SITE-03. |
| stylesheet | `src/stylesheet`<br>`ATM-LAYER-*`, `ATM-STATIC-*` | Six layers: `reset, global, base, tokens, recipes, utilities` |
| runtime | `src/runtime`<br>`ATM-GHOST-01`–`03` | `CssRuntime` map for authored `css()` |

Panda's process crates and file-level call sites: [PANDA.md](./PANDA.md).
Their names are examples. Our author API is `css()` and `recipe()`.

## 3b. Example: Panda job → our ID → refuse

| Panda crate / job | Vendor files | Our module & ID | Take | Refuse |
| :--- | :--- | :--- | :--- | :--- |
| `pandacss_extractor` (sites) | `extract.rs`, `jsx.rs`, `calls.rs`, `matcher.rs` | `src/extract/sites`<br>`ATM-SITE-01`–`11` | JSX attrs, `css()`, `recipe()` (they also extract `cva` / `sva`) | Vue / Svelte / Astro, `include` globs as a substitute for styletrace, PascalCase guessing (`matcher.rs`), config `jsx` name arrays |
| `pandacss_extractor` (leaves) | `literal.rs`, `style_tree.rs`, `pure_fn.rs`, `scope.rs` | `src/extract/leaves`<br>`ATM-LEAF-01`–`09` | AST walk, branch collection, ternary flattening | `expression_to_literal` JS evaluator, folding `undefined` to `Null` |
| `pandacss_encoder` | `Atom`, `process_atomic`, `FxHashSet` dedup | `src/atom`<br>`ATM-ATOM-01`–`04`<br>`ATM-WANT-01`–`02` | `(prop, value, conditions)` records, dedup | Their `Literal` IR, hashed whole-object classes |
| `pandacss_utility` | `format_class_name`, `normalize.rs`, `runtime_class.rs` | `src/resolve/*`<br>`src/stylesheet/name`<br>`ATM-SHORT-*`, `ATM-NAME-*` | Shorthand expand, one namer | Host JS `transform()` callbacks (split-brain class names) |
| `pandacss_recipes` | `Recipe`, `SlotRecipe`, compound | `src/recipes`<br>`ATM-RECIPE-01`–`03` | Closed variant tables, compound matching | Baking host StyleProps into the recipe class; their `sva` slot-recipe helper as an author API |
| `pandacss_stylesheet` | `compile.rs`, `layers.rs`, `grouped.rs`, `emitter.rs` | `src/stylesheet`<br>`ATM-LAYER-*`, `ATM-STATIC-*` | Layer preamble, CSS emit, media nesting | LightningCSS, `split_css` zoo, their five-layer list (ours is six) |
| `pandacss_codegen` | `artifacts/css/mod.rs`, `cva.rs`, `conditions.rs` | `src/runtime`<br>`ATM-GHOST-01`–`03` | Class map (`CssRuntime`) | `styled-system/{jsx,types,patterns,themes}` farm; we author `css()` / `recipe()` in core |
| `pandacss_tokens` | `from_config.rs`, `token.rs` | `src/resolve/tokens`<br>`ATM-TOKEN-01`–`05` | Path → `var(--...)`, color-mix opacity | Second OKLCH pipeline; token dict synthesis (tokens are JS fragments) |
| `pandacss_config` | `UserConfig`, hooks, plugins | `src/config`<br>`ATM-LAYER-03`, `ATM-STATIC-01` | Tokens, conditions, recipe schemas | Hooks, plugin callbacks; input is a typed `BaseSystem` dump |
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
  Station `ATM-SITE-01-canon-primitives`: `<Div mt="2r" bg="blue.500" />` and `<Button px="4r" />`. Does **not** prove styletrace gating (extract walks every JSX opening tag), boolean attrs, or origin metadata.
- [x] `ATM-SITE-02` `[reference]` `[seam]` —
  **Calls to `css()` and `css.raw()` with single or multiple arguments must extract all style object properties.**
  Parse JavaScript/TypeScript call expressions targeting `css(...)`, `css.raw(...)`, and internal alias `__reference_ui_css(...)`. Assert that every object argument in multi-argument calls is traversed and its properties are extracted into wants. Assert that conditional expressions passed as call arguments have both branches inspected.
- [ ] `ATM-SITE-03` `[reference]` `[seam]` —
  **`recipe()` / `recipe.raw()` calls must extract `base`, variant, and `compoundVariants[].css` leaves into wants.**
  Piggybacked on `ATM-SITE-02-call-sites`; unproven as a dedicated station. Those wants currently compile as **utilities**, not `@layer recipes`. Closed recipe classes are `ATM-RECIPE-01`–`03` and unproven. `src/recipes` is not in the crate.
- [x] `ATM-SITE-04` `[forbidden]` `[unit]` —
  **The extract surface is `css()` and `recipe()` only.**
  Parse a call to an unknown helper. Assert that no wants are produced from that call. There is no slot-recipe function. The author API is `css()` and `recipe()` from `@reference-ui/react`.
- [x] `ATM-SITE-05` `[reference]` `[seam]` —
  **Object spreads inside JSX and `css()` arguments must unpack inline without losing sibling properties.**
  Encounter object expressions containing inline object spreads (`...{ margin: '10px' }`) and conditional spreads (`...(cond ? { padding: '10px' } : { margin: '20px' })`). Assert that properties from all spread branches are merged into extracted wants alongside sibling static properties. Assert that dynamic unresolvable spreads emit a diagnostic warning while keeping all resolvable sibling properties intact.
- [ ] `ATM-SITE-06` `[reference]` `[unit]` —
  **Top-level local constants and property bags must be indexed and resolved at style extraction sites.**
  `LocalConstants` exists (`src/extract/constants.rs`) with no `#[test]` and no station. Declare `const theme = { primary: 'n300' }` and `color={theme.primary}` / `css({ color: theme.primary })`. Assert the want is pushed. Until then this is code, not proof.
- [ ] `ATM-SITE-07` `[reference]` `[seam]` —
  **Non-style attributes and hallucinated component primitives must be ignored during AST traversal.**
  Encounter elements with non-style DOM attributes (e.g. `id`, `onClick`, `tabIndex`, `aria-label`) and custom component tags not recognized by styletrace as Reference primitives. Assert that non-style attributes are never converted into style wants and produce no diagnostics. Assert that unrecognized PascalCase components without wired style props are skipped without error.
- [ ] `ATM-SITE-08` `[forbidden]` `[seam]` —
  **Style extraction must rely exclusively on styletrace and canon rather than guessing PascalCase tags or config name arrays.**
  `handle_jsx_opening_element` does not call `styletrace::trace_style_jsx_names`. `is_reference_primitive` is re-exported from `extract/sites/mod.rs` and unused. Panda's `matcher.rs` / `jsx-tag-matching.md` is the job: only StyleProps-wired tags. Today every JSX opening tag is scanned.
- [ ] `ATM-SITE-09` `[reference]` `[seam]` —
  **Boolean style attributes (`<Div border />`) must extract as `AtomValue::Bool(true)`.**
  The branch exists in `jsx.rs` (`attr.value` absent + `is_known_style_prop`). No test. SITE-01 input uses string attrs only.
- [ ] `ATM-SITE-10` `[reference]` `[seam]` —
  **`css()` / `recipe()` extract only when the callee is the Reference import, not a shadowed local.**
  Panda `extraction-pipeline.md` (resolver-gated extraction): `function f(css) { css({ color: 'red' }) }` must not extract. We match callee **name** (`css`, `recipe`, `*.raw`). That is a false-positive hole for a real engine.
- [ ] `ATM-SITE-11` `[reference]` `[seam]` —
  **Identifier spreads of a local const style object (`<Div {...base} />`, `css({ ...base })`) must unpack known keys.**
  Panda `style-tree` / `scope`. Today only **inline object** spreads are walked (`SpreadAttribute` + `ObjectExpression`). `{...base}` where `base` is a `const` object is unproven.

### Leaf Literal Extraction

- [x] `ATM-LEAF-01` `[reference]` `[seam]` —
  **Flat ternaries must unconditionally scoop both consequent and alternate branches without evaluating conditions.**
  Encounter style prop expressions with flat ternaries (`bg={active ? "n300" : "n100"}` or `color={true ? "white" : "black"}`). Assert that both branches are collected as separate wants regardless of whether the test expression is dynamic or a literal boolean. Assert that no runtime JavaScript interpreter is invoked to resolve the condition.
- [ ] `ATM-LEAF-02` `[reference]` `[seam]` —
  **Nested ternaries must recursively flatten all conditional branches without leaf dropout.**
  Encounter multi-level nested ternaries (such as Tabs-shaped `borderBottom={isLine && horiz ? (selected ? '3px solid' : '3px solid transparent') : undefined}`). Assert that every reachable literal branch across all nesting depths is extracted into wants. Assert that complex logical guard expressions surrounding the ternary do not cause leaf omission. Previously piggybacked on `ATM-LEAF-01-ternaries`; no dedicated station.
- [ ] `ATM-LEAF-03` `[reference]` `[seam]` —
  **Branches resolving to `undefined` or `void 0` must be omitted without emitting null wants or dead atoms.**
  Encounter ternaries where one branch is `undefined`, `void 0`, or an empty expression container. Assert that only the defined literal branch is pushed to the wants collection. Assert that no `null` atom value or useless class name is emitted in either the runtime map or the stylesheet. Previously piggybacked on `ATM-LEAF-01-ternaries`; no dedicated station.
- [x] `ATM-LEAF-04` `[reference]` `[seam]` —
  **Logical operator expressions (`&&`, `||`, `??`) must symmetrically collect literal styling operands.**
  Encounter expressions using logical AND (`false && '1px solid'`), logical OR (`'red' || 'blue'`), and nullish coalescing (`custom ?? 'green'`). Assert that the literal style operand is extracted from guarded AND expressions and that both operands are extracted from OR and nullish coalescing expressions. Assert that guard identifiers like `undefined` and `null` are discarded.
- [x] `ATM-LEAF-05` `[reference]` `[seam]` —
  **Responsive arrays must map indexed elements to default breakpoint conditions while skipping null slots.**
  Encounter responsive array expressions on style props (e.g. `mt={['1r', '2r', null, '4r']}`). Assert that index 0 maps to condition `base` (unconditioned), index 1 maps to `sm`, index 2 (null) is skipped without generating an atom, and index 3 maps to `md`. Assert that responsive array slots containing ternaries have both ternary branches collected under that slot's breakpoint condition.
- [ ] `ATM-LEAF-06` `[reference]` `[unit]` —
  **Computed object property keys in style objects must be refused with a diagnostic warning.**
  `handle_object_property` warns `"Dynamic computed property key encountered in style object"` when `resolve_property_key` returns `None`. No `#[test]` compiles `css({ [dynamicKey]: '10px' })` and asserts the diagnostic. Code is not proof.
- [x] `ATM-LEAF-07` `[forbidden]` `[seam]` —
  **Unresolvable dynamic expressions and function calls must not be evaluated and must preserve sibling static properties.**
  Encounter style declarations containing unresolvable function calls (`color: maybeFn()`) or dynamic runtime properties (`width: props.w`). Assert that the engine does not evaluate the function or execute JS, emits a diagnostic warning naming the affected property, and successfully extracts all valid sibling static properties in the same object.
- [x] `ATM-LEAF-08` `[reference]` `[seam]` —
  **Comprehensive style expressions batch table must extract diverse CSS properties and values without error.**
  Execute the full table of absorbed styling expressions across layout, flexbox, grid, typography, borders, and effects. Assert that unitless numbers, percentages, pixel dimensions, keywords, and rhythm values are accurately extracted into corresponding wants. Assert that responsive conditions assigned to table entries match expected breakpoint conditions.
- [ ] `ATM-LEAF-09` `[reference]` `[seam]` —
  **Authored `!` / `!important` suffixes on string literals must set `Want.important` and emit `mt_2r!`.**
  `split_important_flag` exists; `test_class_name_important` names an already-important Atom. No compile of `mt="2r!"` / `css({ mt: '2r!' })`. The Book-drop-in will miss important until this is a station.

### Styling Want IR

- [x] `ATM-WANT-01` `[reference]` `[unit]` —
  **`Want` struct must capture authored property, value, cumulative condition scopes, importance, and origin.**
  Instantiate `Want` instances using builder methods `with_when`, `with_important`, and `with_origin`. Assert that property names are boxed strings, values are strongly typed `AtomValue` enums, condition paths are small vectors, and importance flags are accurately retained.
- [x] `ATM-WANT-02` `[reference]` `[unit]` —
  **`Want` declarations must serialize and deserialize through serde with exact structural fidelity.**
  Serialize a `Want` instance containing nested conditions and origin metadata to JSON. Deserialize the JSON string back into a `Want` struct. Assert that the round-tripped struct is equal in property, value, condition chain, importance, and origin.

### Atom Representation & AtomSet

- [x] `ATM-ATOM-01` `[reference]` `[unit]` —
  **`Atom` declaration must encapsulate normalized property, value, condition chain, importance, and fast hash.**
  Instantiate `Atom` declarations with canonical CSS properties and resolved values. Assert that the precomputed `FxHasher` identity hash accounts for property, value, condition sequence, and importance. Assert that two atoms with identical fields compute equal hashes and satisfy `Eq`.
- [x] `ATM-ATOM-02` `[reference]` `[unit]` —
  **`AtomValue` variants must provide distinct class name strings and valid CSS output values.**
  Construct `AtomValue::String`, `Token`, `Number`, `Bool`, and `Null` variants. Assert that `class_name_str()` produces sanitized keys for class naming while `css_value_str()` produces valid CSS declaration values. Assert that serde round-trips all enum variants without data loss.
- [x] `ATM-ATOM-03` `[reference]` `[unit]` —
  **`AtomSet` must deduplicate identical atomic declarations across source files using precomputed hashing.**
  Insert identical and distinct `Atom` instances into an `AtomSet`. Assert that duplicate insertions return false and do not increase the set size. Assert that `contains()` accurately confirms membership and that iteration yields deduplicated unique atoms.
- [ ] `ATM-ATOM-04` `[reference]` `[unit]` —
  **One class per leaf grain must be strictly maintained across all resolved atoms.**
  Spec previously cited `Atom::new` / `format_atom_declaration` as proof. No test inspects a compile result and asserts every atom is one property. Keep the invariant; it is unproven.

### Rhythm Engine

- [x] `ATM-RHYTHM-01` `[reference]` `[unit]` —
  **Base rhythm unit declarations (`r`, `+r`, `1r`, `-r`) must resolve to standard spacing CSS expressions.**
  Pass rhythm values `r`, `+r`, and `1r` into the rhythm resolver. Assert that each resolves to `var(--spacing-root)`. Pass negative rhythm value `-r` and assert that it resolves to `calc(-1 * var(--spacing-root))`.
- [x] `ATM-RHYTHM-02` `[reference]` `[unit]` —
  **Rhythm integer multipliers and decimal values must resolve to exact CSS multiplication expressions.**
  Pass integer multipliers `2r`, `-2r` and decimal fractions `0.5r`, `1.5r` to the rhythm resolver. Assert that positive values resolve to `calc(N * var(--spacing-root))` and negative values resolve to `calc(-N * var(--spacing-root))`.
- [x] `ATM-RHYTHM-03` `[reference]` `[unit]` —
  **Fractional rhythm units (`1/3r`, `2/3r`, `-1/3r`) must resolve to exact division CSS formulas.**
  Pass fractional rhythm strings with denominators (e.g. `1/3r`, `2/3r`, `-1/3r`, `-2/3r`). Assert that `1/3r` resolves to `calc(var(--spacing-root) / 3)` and `2/3r` resolves to `calc(2 * var(--spacing-root) / 3)`. Assert that zero denominator fractions are rejected.
- [x] `ATM-RHYTHM-04` `[reference]` `[unit]` —
  **Multi-value CSS property strings must resolve embedded rhythm tokens while passing through raw values.**
  Pass compound values like `1r 2r` and `1px solid 1/3r` to `resolve_rhythm`. Assert that each embedded `r` token is replaced with its corresponding `calc()` or `var()` formula while non-rhythm tokens (`1px`, `solid`, `auto`) remain unchanged in place.
- [x] `ATM-RHYTHM-05` `[reference]` `[seam]` —
  **Negative rhythm values authored in JSX or `css()` must extract and compile without syntax errors.**
  Compile sources containing `marginTop="-1r"` or `left="-2r"`. Assert that valid wants are extracted with negative values, compiled into `mt_-1r` class names, and emitted as valid negative calc declarations in CSS.

### Shorthand Decomposition & Cascade Safety

- [x] `ATM-SHORT-01` `[reference]` `[seam]` —
  **Composite `borderBottom` shorthand must decompose into width and style without emitting `currentColor`.**
  Compile a component specifying `borderBottom="3px solid"` alongside `borderColor="gray.800"`. Assert that `borderBottomWidth: 3px;` and `borderBottomStyle: solid;` are emitted. Assert that `currentColor` is never synthesized or emitted, preventing the catastrophic CSS cascade anomaly that clobbers sibling border colors.
- [ ] `ATM-SHORT-02` `[reference]` `[seam]` —
  **Composite `outline` shorthand must decompose into width and style without clobbering `outlineColor`.**
  Compile a component specifying `outline="1px solid"` alongside `outlineColor="blue.600"`. Assert that `outline-width: 1px;` and `outline-style: solid;` are emitted as atomic rules. Assert that default outline color is never synthesized, ensuring `outline-color: var(--colors-blue-600);` wins cleanly. Previously piggybacked on `ATM-SHORT-01-shorthand-cascade`; unproven as a dedicated station.
- [x] `ATM-SHORT-03` `[reference]` `[unit]` —
  **Border zero dimensions and whole-value tokens must pass through without unwanted decomposition.**
  Pass zero values (`0`, `0px`, `0rem`) to the border shorthand expander and assert they decompose directly to width `0px`. Pass whole keywords (`none`, `inherit`) and token paths (`borders.card`) and assert they pass through as single atomic properties without splitting.
- [x] `ATM-SHORT-04` `[reference]` `[unit]` —
  **Composite border shorthands (`border`, `borderTop`, `borderBottom`, `outline`) must decompose to canon longhands.**
  `test_atomic_shorthand_tripwire` expands `border` / `borderTop` / `borderBottom` / `outline` and asserts emitted names equal `canon::native_longhands_for_prop`. Not `BORDER_CONFIGS` (that table is forbidden by `test_forbidden_private_property_tables`).
- [x] `ATM-SHORT-05` `[reference]` `[unit]` —
  **Dimensional shorthands with 2–4 tokens expand to physical longhands; a single token does not expand.**
  `test_dimensional_shorthand_token_counts`: `padding: 10px 20px` → four longhands; `padding: 10px` / `p: 1r` / `m: 2r` return `None` (passthrough).

### Condition Scoping & Dialect Patterns

- [x] `ATM-COND-01` `[reference]` `[unit]` —
  **Responsive breakpoint conditions (`sm`, `md`, `lg`, `xl`, `2xl`) must lower to canonical media query wrappers.**
  Lower responsive tokens `sm`, `md`, `lg`, `xl`, `2xl`. Assert that each produces `@media screen and (min-width: <breakpoint>)` matching the configured rem values (`40rem`, `48rem`, `64rem`, `80rem`, `96rem`). Assert that rules wrapped in media queries sort after unconditioned utility rules in the stylesheet.
- [x] `ATM-COND-02` `[reference]` `[unit]` —
  **`_hover` lowers to `&:is(:hover, [data-hover])` and that selector is applied to the class.**
  Proven: `test_lower_presets`, `test_apply_selector_condition`, `test_class_name_hover`, station `ATM-COND-04`. Spec used to list `_active`, `_focus`, `_focusVisible`, `_disabled` as proven; those presets are not in the unit assertions.
- [x] `ATM-COND-03` `[reference]` `[unit]` —
  **`_dark` lowers to `.dark &` and applies as `.dark .dark\:…`.**
  Proven: `test_lower_presets`, `test_apply_selector_condition`. `_light` is not asserted. Host primitives stamp `data-panda-theme` (`DATA_COLOR_MODE_ATTR`); `.dark &` vs `[data-panda-theme=dark]` is the drop-in mismatch — see `ATM-COND-08`.
- [x] `ATM-COND-04` `[reference]` `[seam]` —
  **Cumulative nested condition chains must preserve outer-to-inner scope ordering.**
  Compile nested condition scopes (e.g. `_dark: { _hover: { _focusVisible: { borderColor: 'gold' } } }`). Assert that the extracted want retains the exact ordered condition path `['_dark', '_hover', '_focusVisible']`. Assert that the class name prefixes conditions in order (`dark:hover:focusVisible:borderC_gold`).
- [x] `ATM-COND-05` `[reference]` `[unit]` —
  **Reference dialect pattern properties (`container`, `font`, `weight`, `size`) must lower to canonical CSS properties.**
  Resolve dialect properties: `container="sidebar"` lowers to `containerType: inline-size` and `containerName: sidebar`; `font="sans"` lowers to `fontFamily`, `fontWeight`, and `letterSpacing`; `weight="bold"` lowers to `fontWeight: 700`; `size="20px"` lowers to `width: 20px` and `height: 20px`.
- [x] `ATM-COND-06` `[reference]` `[unit]` —
  **Runtime-owned component properties (`variant`, `colorMode`) must be excluded from atomic stylesheet emission.**
  Pass `variant="primary"` or `colorMode="dark"` to `resolve_want`. Assert that the resolution pipeline returns an empty vector of atoms, ensuring that component-level variant flags and theme mode switches remain exclusively on the React runtime.
- [ ] `ATM-COND-07` `[reference]` `[unit]` —
  **Responsive `r` container query objects must lower to `@container (min-width: ...)` condition wrappers.**
  `handle_responsive_r_object` exists. No test compiles `r={{ 300: { p: '1r' } }}` and asserts the want `when` or the `@container` rule in `styles.css`.
- [ ] `ATM-COND-08` `[reference]` `[seam]` —
  **Theme conditions must match the host color-mode attribute, not only a `.dark` class.**
  Panda emits `[data-panda-theme=dark]`. Core primitives use `DATA_COLOR_MODE_ATTR = 'data-panda-theme'`. Atomic lowers `_dark` to `.dark &`. A drop-in `styles.css` that looks “almost right” will miss dark/hover islands until this selector matches the DOM the lib actually stamps. Prove `_dark` / `_light` against that attribute (or document and test a `.dark` class the runtime also sets).
- [ ] `ATM-COND-09` `[reference]` `[seam]` —
  **Group/peer and arbitrary `&` / `@` conditions must survive into the stylesheet.**
  Canon `CONDITION_KEYS` includes `_groupHover`, `_peerFocus`, `_osDark`, `_motionReduce`. Panda `condition-api.mdx`. `is_condition` open-outs `_`/`&`/`@`, but there is no station that `_groupHover: { bg: 'n200' }` or `&[data-slot=inner]` prints a real rule. `test_finalize_condition_name` only checks the class-prefix string for a dummy selector.

### Design Token Resolution

- [x] `ATM-TOKEN-01` `[reference]` `[unit]` —
  **Category-prefixed design token paths must resolve to canonical `var(--...)` custom properties.**
  Resolve token paths with explicit category prefixes (e.g. `colors.blue.600`, `radii.md`, `fonts.mono`, `fontSizes.xl`). Assert that `colors.blue.600` resolves to `var(--colors-blue-600)` and `radii.md` resolves to `var(--radii-md)`.
- [x] `ATM-TOKEN-02` `[reference]` `[unit]` —
  **Bare color token paths on color-accepting properties must resolve to `--colors-` custom properties.**
  Pass bare dot-paths (e.g. `blue.600`, `gray.800`) on properties identified as color properties (`color`, `bg`, `borderColor`, etc.). Assert that each bare token path resolves to `var(--colors-<path>)`. Assert that non-color properties do not resolve bare tokens as colors.
- [x] `ATM-TOKEN-03` `[reference]` `[unit]` —
  **Color token opacity modifiers (`/opacity`) must resolve to standard `color-mix` CSS functions.**
  Pass token values with slash opacity modifiers (e.g. `colors.blue.600/50` or `red.500/25%`). Assert that the resolver formats the value as `color-mix(in srgb, var(--colors-...) <opacity>%, transparent)`.
- [x] `ATM-TOKEN-04` `[reference]` `[unit]` —
  **CSS color keywords must pass through as raw values without custom property conversion.**
  Pass standard CSS color keywords (`transparent`, `currentColor`, `black`, `white`, `inherit`) on color properties. Assert that the resolver returns the keyword unmodified, preventing invalid variables like `var(--colors-transparent)`.
- [ ] `ATM-TOKEN-05` `[reference]` `[seam]` —
  **`compile()` must ingest BaseSystem token collections, replacing heuristic category checks with authoritative lookup.**
  Supply a `BaseSystem` containing declared token collections to `compile()`. Assert that token resolution validates token existence against the base system rather than relying on heuristic `KNOWN_CATEGORIES`. Assert that undeclared token paths pass through as raw CSS values.

### Component Recipes & Closed Variants

- [ ] `ATM-RECIPE-01` `[reference]` `[seam]` —
  **Recipe declarations must compile into closed variant classes scoped inside `@layer recipes`.**
  Compile component recipe declarations authored via `recipe()`. Assert that each declared variant permutation compiles into a single deterministic class name emitted inside `@layer recipes`. Assert that recipe classes do not pollute `@layer utilities`.
- [ ] `ATM-RECIPE-02` `[reference]` `[seam]` —
  **Compiler must emit an authoritative variant lookup table for the runtime `recipe()` helper.**
  Compile a recipe with multiple variants and compound variants. Assert that `CompileResult` outputs a JSON variant table mapping variant prop combinations to compiled recipe class names. Assert that the runtime helper consumes this table directly without re-evaluating styles.
- [ ] `ATM-RECIPE-03` `[reference]` `[seam]` —
  **StyleProps authored on a recipe host component must remain atomic utilities that override recipe styles.**
  Compile a component that applies a recipe and specifies additional StyleProps (e.g. `<Button variant="primary" mt="2r" bg="red.500" />`). Assert that `mt` and `bg` are emitted as utility atoms in `@layer utilities`. Because `@layer utilities` follows `@layer recipes`, assert that atomic StyleProps win naturally by CSS cascade precedence.

### Static CSS Expansion

- [ ] `ATM-STATIC-01` `[reference]` `[seam]` —
  **`staticCss` declarations from BaseSystem must synthesize all declared property and token combinations as wants.**
  Provide a `BaseSystem` specifying `staticCss` with property-token wildcards (e.g. `color: ['*']` or `bg: ['n100', 'n200', 'n300']`). Assert that the compiler lowers each static configuration into a `Want`, feeding the `AtomSet` as a third want source alongside JSX and `css()` calls. Assert that dynamic props like `bg={prop}` resolve at runtime because the utility classes exist in the sheet.
- [ ] `ATM-STATIC-02` `[reference]` `[seam]` —
  **Static CSS wants must dominate AtomSet size and deduplicate seamlessly with AST-extracted wants.**
  Compile a project where both static CSS declarations and AST source expressions reference overlapping utilities (e.g. `.bg_n300`). Assert that the `AtomSet` deduplicates identical static and dynamic atoms. Assert that all static utilities are printed in the stylesheet and registered in the runtime class map.

### Cascade Layers & Preamble

- [x] `ATM-LAYER-01` `[reference]` `[seam]` —
  **Compiled stylesheet must always begin with the strict 6-layer preamble in canonical order.**
  Compile arbitrary sources and inspect the first line of the emitted stylesheet. Assert that it begins verbatim with `@layer reset, global, base, tokens, recipes, utilities;\n`. Assert that no CSS rule appears before the layer order statement.
- [ ] `ATM-LAYER-02` `[reference]` `[seam]` —
  **Empty layers must remain resilient and valid in the emitted stylesheet.**
  Compile sources when one or more layers (such as `reset`, `global`, `base`, `tokens`, or `recipes`) have no active rules. Assert that the stylesheet compiles cleanly without syntax errors and retains the complete 6-layer preamble. Previously piggybacked on `ATM-GHOST-03-seed`; no dedicated station.
- [ ] `ATM-LAYER-03` `[reference]` `[seam]` —
  **BaseSystem layer contents must populate `@layer reset`, `@layer global`, and `@layer tokens`.**
  Provide a `BaseSystem` containing CSS resets, `globalCss()` rules, `@keyframes` definitions, and design token scales. Assert that CSS reset rules are emitted inside `@layer reset`, keyframes and global styles inside `@layer global`, and CSS custom properties inside `@layer tokens`.
- [ ] `ATM-LAYER-04` `[reference]` `[seam]` —
  **All generated atomic utility rules and media query wrappers must be encapsulated inside `@layer utilities`.**
  Inspect the emitted stylesheet rules for atomic classes. Assert that every unconditioned class rule and every `@media` / `@container` at-rule wrapping an atomic class is enclosed within `@layer utilities { ... }`. Assert that atomic utilities never escape the utilities layer boundary. Previously piggybacked on `ATM-LEAF-05-responsive-arrays`; no dedicated station.

### Class Naming & Character Hygiene

- [x] `ATM-NAME-01` `[reference]` `[unit]` —
  **Canonical class names must combine property prefix and sanitized value string.**
  Generate class names for unconditioned atoms (e.g. `marginTop="2r"` → `mt_2r`, `padding="10px"` → `p_10px`, `color="blue.600"` → `c_blue.600`). Assert that class names are deterministic, concise, human-readable, and unescaped in runtime strings.
- [x] `ATM-NAME-02` `[reference]` `[unit]` —
  **Condition paths must prefix the base class name separated by colons.**
  Generate class names for conditioned atoms (e.g. `_hover` on `bg="n300"` → `hover:bg_n300`, `_dark` + `_hover` → `dark:hover:bg_n300`). Assert that condition prefixes match normalized condition names.
- [x] `ATM-NAME-03` `[reference]` `[unit]` —
  **Inline important declarations must suffix the class name with an exclamation mark.**
  Pass declarations with inline `!` or `!important` flags (e.g. `marginTop="2r!"`). Assert that the generated class name is `mt_2r!` and the corresponding CSS selector escapes the exclamation mark as `.mt_2r\!`.
- [x] `ATM-NAME-04` `[reference]` `[unit]` —
  **Special characters in class names must be escaped with backslashes in CSS selectors.**
  Generate CSS selectors for class names containing slashes (`1/2r` → `.p_1\/2r`), dots (`blue.600` → `.c_blue\.600`), colons (`hover:mt_2r` → `.hover\:mt_2r`), and brackets. Assert that the selector is syntactically valid CSS while the runtime class name remains clean unescaped text.
- [x] `ATM-NAME-05` `[reference]` `[unit]` —
  **Whitespace characters in multi-token values must be converted to underscores in class names.**
  Sanitize values containing spaces, tabs, or newlines (e.g. `3px solid` → `3px_solid`, `10px 20px` → `10px_20px`). Assert that generated class names contain no whitespace characters and form valid DOM attribute tokens.

### Compiler Diagnostics & Fail-Closed Semantics

- [ ] `ATM-DIAG-01` `[reference]` `[seam]` —
  **Valid source code compilation must emit an empty diagnostics collection.**
  Compile valid components and style declarations. Assert that `result.diagnostics` is an empty vector without spurious warnings or notices. Previously piggybacked on `ATM-GHOST-03-seed`; no dedicated station.
- [ ] `ATM-DIAG-02` `[reference]` `[seam]` —
  **Dynamic non-literal expressions must emit fail-closed diagnostic warnings with source locations.**
  Compile source files containing unresolvable identifiers, dynamic template literals, or computed keys. Assert that `result.diagnostics` captures a diagnostic with severity `warning`, descriptive message, and source file path. Assert that the compiler does not abort or produce corrupted CSS. Previously piggybacked on `ATM-LEAF-07-dynamic-siblings`; no dedicated station.
- [ ] `ATM-DIAG-03` `[reference]` `[unit]` —
  **AST parsing syntax errors must be recorded as error diagnostics without crashing the process.**
  `parse_and_extract` pushes parser errors onto `session.diagnostics`. No test passes malformed source into `compile()` and asserts `severity: error` plus a `CompileResult` (no panic).

### Forbidden Architectural Patterns

- [ ] `ATM-FORBID-01` `[forbidden]` `[unit]` —
  **Hashed whole-object class names are strictly forbidden.**
  No test greps output for `.css-` hashes or asserts grain. The namer is atomic by construction; that is not a passing test title.
- [ ] `ATM-FORBID-02` `[forbidden]` `[unit]` —
  **Runtime JavaScript evaluation during compilation is strictly forbidden.**
  No test. Absence of QuickJS in `Cargo.toml` is hygiene, not a contract case.
- [ ] `ATM-FORBID-03` `[forbidden]` `[unit]` —
  **Maintaining a second class namer outside of `stylesheet::name` is strictly forbidden.**
  No test that every `css.classes` value equals `stylesheet::name::class_name` for the same atom besides the standing ghost gauge (`ATM-GHOST-01`). That gauge is the closest proof; this id stays open until a dedicated assertion exists.
- [ ] `ATM-FORBID-04` `[forbidden]` `[unit]` —
  **Dynamic code generation of `css.js` or runtime JavaScript files is strictly forbidden.**
  `CompileResult` is data. No test asserts the compiler does not write `.js`.
- [x] `ATM-FORBID-05` `[forbidden]` `[unit]` —
  **Atomic must not keep private CSS property / color tables next to canon.**
  `test_forbidden_private_property_tables` fails if `border.rs` / `dimensional.rs` / `tokens/mod.rs` grow `BORDER_CONFIGS`, tuple slices, or hardcoded `accentColor`. This is the one FORBID that actually has a test.

---

## 5. Existing Proof Map

Every Cargo unit test and each `tests/cases/<ATM-*>` station maps to an `ATM-*` contract case. Seam proof is the case folder, not a sibling `*.test.ts`. Rows that only name a source function are `[ ]`.

| Contract ID | Status | Harness | Proof Source |
| :--- | :--- | :--- | :--- |
| `ATM-GHOST-01` | `[x]` | `[seam]` | `tests/helpers.ts` `atomicGauges` (standing gauge: preamble + class ⊆ stylesheet) |
| `ATM-GHOST-02` | `[x]` | `[seam]` | `tests/cases/ATM-GHOST-02-runtime-map/` |
| `ATM-GHOST-03` | `[x]` | `[seam]` | `src/lib.rs` (`test_compile_seed_contract`)<br>`tests/cases/ATM-GHOST-03-seed/` |
| `ATM-SITE-01` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-01-canon-primitives/` (`mt`/`bg`/`px` only) |
| `ATM-SITE-02` | `[x]` | `[seam]` | `src/extract/tests.rs` (`test_css_and_recipe_call_sites`)<br>`tests/cases/ATM-SITE-02-call-sites/` |
| `ATM-SITE-03` | `[ ]` | `[seam]` | none (recipe calls lack dedicated station; `src/recipes` deleted) |
| `ATM-SITE-04` | `[x]` | `[unit]` | `src/extract/tests.rs` (`test_unknown_helpers_are_not_extract_sites`) |
| `ATM-SITE-05` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-05-spreads/` |
| `ATM-SITE-06` | `[ ]` | `[unit]` | none (`LocalConstants` is untested) |
| `ATM-SITE-07` | `[ ]` | `[seam]` | none |
| `ATM-SITE-08` | `[ ]` | `[seam]` | none (jsx extract does not call styletrace) |
| `ATM-SITE-09` | `[ ]` | `[seam]` | none (boolean attr branch in `jsx.rs`) |
| `ATM-SITE-10` | `[ ]` | `[seam]` | none (Panda resolver-gated extract) |
| `ATM-SITE-11` | `[ ]` | `[seam]` | none (identifier `{...base}` spreads) |
| `ATM-LEAF-01` | `[x]` | `[seam]` | `src/extract/tests.rs` (`test_flat_and_nested_ternaries`)<br>`tests/cases/ATM-LEAF-01-ternaries/` |
| `ATM-LEAF-02` | `[ ]` | `[seam]` | none (nested ternaries lack dedicated station) |
| `ATM-LEAF-03` | `[ ]` | `[seam]` | none (undefined omission lacks dedicated station) |
| `ATM-LEAF-04` | `[x]` | `[seam]` | `src/extract/tests.rs` (`test_logical_expressions_symmetric`)<br>`tests/cases/ATM-LEAF-04-logical/` |
| `ATM-LEAF-05` | `[x]` | `[seam]` | `src/extract/tests.rs` (`test_responsive_arrays`)<br>`tests/cases/ATM-LEAF-05-responsive-arrays/` |
| `ATM-LEAF-06` | `[ ]` | `[unit]` | none |
| `ATM-LEAF-07` | `[x]` | `[seam]` | `src/extract/tests.rs` (`test_dynamic_properties_keep_siblings`)<br>`tests/cases/ATM-LEAF-07-dynamic-siblings/` |
| `ATM-LEAF-08` | `[x]` | `[seam]` | `tests/cases/ATM-LEAF-08-panda-table/` |
| `ATM-LEAF-09` | `[ ]` | `[seam]` | none (`test_class_name_important` is namer-only) |
| `ATM-WANT-01` | `[x]` | `[unit]` | `src/atom/tests.rs` (`test_want_creation_and_serialization`) |
| `ATM-WANT-02` | `[x]` | `[unit]` | `src/atom/tests.rs` (`test_want_creation_and_serialization`) |
| `ATM-ATOM-01` | `[x]` | `[unit]` | `src/atom/tests.rs` (`test_atom_creation_accessors_and_hashing`) |
| `ATM-ATOM-02` | `[x]` | `[unit]` | `src/atom/tests.rs` (`test_atom_value_display_and_equality`) |
| `ATM-ATOM-03` | `[x]` | `[unit]` | `src/atom/tests.rs` (`test_atom_set_dedup_and_iteration`) |
| `ATM-ATOM-04` | `[ ]` | `[unit]` | none |
| `ATM-RHYTHM-01` | `[x]` | `[unit]` | `src/resolve/rhythm/mod.rs` (`test_base_rhythm`) |
| `ATM-RHYTHM-02` | `[x]` | `[unit]` | `src/resolve/rhythm/mod.rs` (`test_multipliers_and_decimals`)<br>`src/resolve/mod.rs` (`test_resolve_rhythm_want`) |
| `ATM-RHYTHM-03` | `[x]` | `[unit]` | `src/resolve/rhythm/mod.rs` (`test_fractions`) |
| `ATM-RHYTHM-04` | `[x]` | `[unit]` | `src/resolve/rhythm/mod.rs` (`test_multi_value_pass_through`) |
| `ATM-RHYTHM-05` | `[x]` | `[seam]` | `tests/cases/ATM-RHYTHM-05-rhythm/` |
| `ATM-SHORT-01` | `[x]` | `[seam]` | `src/resolve/mod.rs` (`test_resolve_shorthand_border_want`)<br>`tests/cases/ATM-SHORT-01-shorthand-cascade/` |
| `ATM-SHORT-02` | `[ ]` | `[seam]` | none (outline shorthand lacks dedicated station) |
| `ATM-SHORT-03` | `[x]` | `[unit]` | `src/resolve/shorthands/tests.rs` (`test_border_zero_and_whole_values`) |
| `ATM-SHORT-04` | `[x]` | `[unit]` | `src/resolve/shorthands/tests.rs` (`test_atomic_shorthand_tripwire`) |
| `ATM-SHORT-05` | `[x]` | `[unit]` | `src/resolve/shorthands/tests.rs` (`test_dimensional_shorthand_token_counts`) |
| `ATM-COND-01` | `[x]` | `[unit]` | `src/resolve/conditions/mod.rs` (`test_lower_breakpoints` — `sm` / `_md`) |
| `ATM-COND-02` | `[x]` | `[unit]` | `src/resolve/conditions/mod.rs` (`test_lower_presets` — `_hover`)<br>`src/stylesheet/name/mod.rs` (`test_class_name_hover`) |
| `ATM-COND-03` | `[x]` | `[unit]` | `src/resolve/conditions/mod.rs` (`test_lower_presets` — `_dark` → `.dark &`) |
| `ATM-COND-04` | `[x]` | `[seam]` | `src/extract/tests.rs` (`test_nested_conditions`)<br>`tests/cases/ATM-COND-04-pseudo-conditions/` |
| `ATM-COND-05` | `[x]` | `[unit]` | `src/resolve/mod.rs` (`test_resolve_pattern_container`, `test_resolve_pattern_font_and_weight`, `test_resolve_pattern_size`) |
| `ATM-COND-06` | `[x]` | `[unit]` | `src/resolve/mod.rs` (`test_resolve_pattern_variant_color_mode_empty`) |
| `ATM-COND-07` | `[ ]` | `[unit]` | none |
| `ATM-COND-08` | `[ ]` | `[seam]` | none (`.dark &` vs `data-panda-theme`) |
| `ATM-COND-09` | `[ ]` | `[seam]` | none (group/peer / arbitrary `&`) |
| `ATM-TOKEN-01` | `[x]` | `[unit]` | `src/resolve/tokens/mod.rs` (`test_category_prefixed_colors`, `test_non_color_categories`)<br>`src/resolve/mod.rs` (`test_resolve_token_want`) |
| `ATM-TOKEN-02` | `[x]` | `[unit]` | `src/resolve/tokens/mod.rs` (`test_bare_color_tokens`) |
| `ATM-TOKEN-03` | `[x]` | `[unit]` | `src/resolve/tokens/mod.rs` (`test_color_mix_opacity`) |
| `ATM-TOKEN-04` | `[x]` | `[unit]` | `src/resolve/tokens/mod.rs` (`test_category_prefixed_colors` transparent/white check) |
| `ATM-TOKEN-05` | `[ ]` | `[seam]` | none |
| `ATM-RECIPE-01` | `[ ]` | `[seam]` | none (`src/recipes` deleted) |
| `ATM-RECIPE-02` | `[ ]` | `[seam]` | none |
| `ATM-RECIPE-03` | `[ ]` | `[seam]` | none |
| `ATM-STATIC-01` | `[ ]` | `[seam]` | none |
| `ATM-STATIC-02` | `[ ]` | `[seam]` | none |
| `ATM-LAYER-01` | `[x]` | `[seam]` | `src/stylesheet/emitter.rs` (`test_empty_stylesheet`)<br>`tests/helpers.ts` `atomicGauges` |
| `ATM-LAYER-02` | `[ ]` | `[seam]` | none (empty layers lack dedicated station) |
| `ATM-LAYER-03` | `[ ]` | `[seam]` | none |
| `ATM-LAYER-04` | `[ ]` | `[seam]` | none (utilities encapsulation lacks dedicated station) |
| `ATM-NAME-01` | `[x]` | `[unit]` | `src/stylesheet/name/mod.rs` (`test_class_name_unconditioned`) |
| `ATM-NAME-02` | `[x]` | `[unit]` | `src/resolve/conditions/mod.rs` (`test_finalize_condition_name`)<br>`src/stylesheet/name/mod.rs` (`test_class_name_hover`) |
| `ATM-NAME-03` | `[x]` | `[unit]` | `src/stylesheet/name/mod.rs` (`test_class_name_important`) — namer only, see `ATM-LEAF-09` |
| `ATM-NAME-04` | `[x]` | `[unit]` | `src/stylesheet/name/escape.rs` (`test_escape_css_selector`)<br>`src/stylesheet/name/mod.rs` (`test_class_name_fraction_and_token`) |
| `ATM-NAME-05` | `[x]` | `[unit]` | `src/stylesheet/name/escape.rs` (`test_sanitize_class_value`) |
| `ATM-DIAG-01` | `[ ]` | `[seam]` | none (empty diagnostics lacks dedicated station) |
| `ATM-DIAG-02` | `[ ]` | `[seam]` | none (dynamic diagnostics lacks dedicated station) |
| `ATM-DIAG-03` | `[ ]` | `[unit]` | none |
| `ATM-FORBID-01` | `[ ]` | `[unit]` | none |
| `ATM-FORBID-02` | `[ ]` | `[unit]` | none |
| `ATM-FORBID-03` | `[ ]` | `[unit]` | none (ghost gauge is `ATM-GHOST-01`) |
| `ATM-FORBID-04` | `[ ]` | `[unit]` | none |
| `ATM-FORBID-05` | `[x]` | `[unit]` | `src/resolve/shorthands/tests.rs` (`test_forbidden_private_property_tables`) |

---

## 6. Remaining Cases [ ] (what a real `styles.css` still needs)

Not an implementation sequence for BaseSystem first. The drop-in checkpoint is **utilities + conditions that match the lib**. BaseSystem / recipes / staticCss are later layers.

### Drop-in sheet (do these while Panda still runs)

1. **`ATM-SHORT-02` — `outline` composite shorthand.** Needs dedicated station separating outline from `ATM-SHORT-01` borderBottom.
2. **`ATM-LEAF-02` / `ATM-LEAF-03` — nested ternaries & `undefined` omission.** Need dedicated stations separating them from `ATM-LEAF-01`.
3. **`ATM-SITE-03` — `recipe()` call extraction.** Needs dedicated station separating recipe calls from `ATM-SITE-02` `css()` calls.
4. **`ATM-LAYER-02` / `ATM-DIAG-01` — empty layers & clean diagnostics.** Need dedicated stations separating them from `ATM-GHOST-03`.
5. **`ATM-LAYER-04` — `@layer utilities` encapsulation.** Needs dedicated station separating layer tests from `ATM-LEAF-05`.
6. **`ATM-DIAG-02` — dynamic expression warnings.** Needs dedicated station separating diagnostic tests from `ATM-LEAF-07`.
7. **`ATM-COND-08` — `_dark` / `_light` vs `data-panda-theme`.** This is the Book hole (hover/dark islands). Atomic emits `.dark &`; primitives stamp `data-panda-theme`.
8. **`ATM-COND-09` — group/peer and arbitrary `&` / `@` in the sheet.** Canon lists the keys; no station prints them.
9. **`ATM-COND-07` — `r={{ 300: { p: '1r' } }}` → `@container`.** Handler exists; untested.
10. **`ATM-LEAF-09` — authored `2r!`.** Namer can spell `mt_2r!`; extract is unproven.
11. **`ATM-SITE-09` — boolean `<Div border />`.** Branch exists; SITE-01 doesn't cover it.
12. **`ATM-SITE-06` — local `const` bags (`color={theme.primary}`).**
13. **`ATM-SITE-11` — `{...base}` identifier spreads.** Panda style-tree. Inline object spreads are SITE-05.
14. **`ATM-SITE-10` — import-bound `css()`, not a shadowed local.** Panda extraction-pipeline resolver.
15. **`ATM-SITE-07` / `ATM-SITE-08` — ignore DOM attrs; styletrace, not every JSX tag.** Extract currently walks every opening element.
16. **`ATM-LEAF-06` — computed keys diagnostic.**
17. **`ATM-DIAG-03` — parse errors → `CompileResult`, no panic.**
18. **`ATM-ATOM-04` — one class per leaf, asserted on a compile result.**
19. **`ATM-FORBID-01`–`04` — hash / JS eval / second namer / generated `css.js`.** FORBID-05 (no private tables) is the only FORBID with a test.

### After the utilities sheet is honest

20. **`ATM-TOKEN-05` — `compile()` takes a BaseSystem token dictionary.** Heuristic `KNOWN_CATEGORIES` until then.
21. **`ATM-LAYER-03` — fill `@layer reset, global, tokens` from that dump.** Panda `stylesheet.md` reset / globalCss / tokens. Keep Panda on those layers until this is real.
22. **`ATM-STATIC-01` / `ATM-STATIC-02` — `staticCss` as a third want source.** Panda `static_css.rs`. Needed so `bg={prop}` is not a ghost class.
23. **`ATM-RECIPE-01`–`03` — closed classes in `@layer recipes`, variant table, host StyleProps stay utilities.** `src/recipes` is deleted. Panda `compound-variant-cascade.md`: compounds belong under recipes, below utilities. `sva` stays refused.

Panda jobs we **do not** add as cases: `jsxMatchTag` config, literal evaluator, LightningCSS, `split_css`, hooks, `styled.div` factory, slot-recipe `sva`, `$` token rename hook.

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
