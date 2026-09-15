# Base System SPEC

Current freeze, cases, and proof. Design narrative: [REFERENCE_SYSTEM.md](../../../../REFERENCE_SYSTEM.md) (§6 The missing contract: compile against a base system, and §3.4).
Architecture: [packages/reference-rs/docs/atomic.md](../../docs/atomic.md). Crate documentation: [README.md](./README.md).

Harness: `cargo test -p base_system` (or `pnpm agentrs c base_system`)
Verify path: In-memory fixture construction (no sync worker, no packager, no bundler).

---

## 1. The Job of the Crate

`base-system` is the portable design-system definition artefact for Reference UI. It takes the evaluated fragment dump emitted by TypeScript (`tokens()`, `font()`, `keyframes()`, `globalCss()`, declared recipes, and condition/breakpoint maps), deserializing it into a pure, immutable in-memory query engine. It emits authoritative answers to the five canonical questions asked by downstream consumers: custom property variable names, raw token CSS values across light and dark modes, declared recipe variant schemas, keyframes/fonts/globals, and conditions/breakpoints for `modules/atomic`, alongside token existence and category membership for `modules/typegen`. It must not evaluate author JavaScript, bundle modules, parse TSX, run an OXC walker, perform file I/O, print atomic utility classes (such as `.mt_2r`), synthesize runtime `css()` or `recipe()` code, or permit `layers` CSS tokens to leak into the queryable token dictionary.

---

## 2. Legend & Status Counts

- `[x]` Proven by a passing unit test title in `base_system`.
- `[ ]` Specified; not yet proven by a passing test title.

| Area | Meaning | Total Cases | Proven `[x]` | Pending `[ ]` |
| :--- | :--- | :--- | :--- | :--- |
| **`DUMP`** | Fragment Dump Ingestion & In-Memory Artefact | 5 | 5 | 0 |
| **`TOKEN`** | Token Dictionary & Value Normalization | 8 | 6 | 2 |
| **`FONT`** | Font Definitions & Face Rules | 4 | 0 | 4 |
| **`MOTION`** | Keyframes & Animation Steps | 3 | 3 | 0 |
| **`GLOBAL`** | Global CSS, Reset & Conditions | 4 | 0 | 4 |
| **`RECIPE`** | Declared Component & Slot Recipes | 4 | 4 | 0 |
| **`EXTEND`** | Upstream Definition Merge & Private Scoping | 5 | 0 | 5 |
| **`LAYER`** | Upstream CSS Layer Isolation | 4 | 0 | 4 |
| **`ASK`** | The Five Canonical Query Contracts | 6 | 3 | 3 |
| **Total** | | **43** | **21** | **22** |

---

## 3. Crosswalk: Panda job → our ID → refuse

Panda fused config, tokens, AST, codegen, and utility emission. We split
those jobs. Vendor crates below are example call sites, not our API.

| Panda construct | Our ID | Refuse / forbidden here | Why |
| :--- | :--- | :--- | :--- |
| `pandacss_tokens::TokenDictionary` | `BAS-TOKEN-01`–`08`, `BAS-ASK-01`–`02` | O(N) search; runtime color libs in Rust | O(1) indexed lookups. Color values stay strings. |
| `pandacss_tokens::color_mix` / modifier parsing | delegated to `atomic` | Token modifier parsing in this crate | We hold declared tokens. Atomic resolves `/opacity`. |
| `pandacss_tokens::TokenSuggestion` | — | Fuzzy ranking, spellcheck | Compiler artefact, not an IDE service. |
| `pandacss_tokens::svg` / asset tokens | — | Embedding SVG in tokens | Tokens are CSS values. |
| `pandacss_config::Theme` | `BAS-TOKEN-01`–`05`, `BAS-GLOBAL-02` | Preset globbing, npm resolution, plugins | Fragments land as JSON. Composition is `extends`. |
| `pandacss_config::Conditions` | `BAS-GLOBAL-02`–`03`, `BAS-ASK-05` | JS predicate functions as conditions | Conditions are CSS selectors and `@media` / `@container`. |
| `pandacss_config::UtilityMap` (`utilities.extend`) | lives in `canon` | Custom utility transforms in user config | Dialect, not user tokens. |
| `pandacss_config::PatternMap` (`patterns.box`) | — | Box/flex/stack pattern configs | Dialect props in canon. Layout is primitives + `css()`. |
| `pandacss_recipes::Recipe` | `BAS-RECIPE-01`–`02`, `BAS-ASK-04` | Generating `cva.js` / recipe closures | Static schema only. Runtime `recipe()` is authored TypeScript. |
| `pandacss_recipes::SlotRecipe` | `BAS-RECIPE-03` | Slot-recipe helper / part factories | Our API is `recipe()`. Multi-part components are authored React. |
| `pandacss_codegen::artifacts::types` | lives in `typegen` | `.d.ts` / TS AST in this crate | Pure data. |
| Utility class names in types | — | `.mt_2r` in declarations | Users author StyleProps. |
| `pandacss_extractor` static token evaluator | lives in `atomic` | Parsing TSX / folding `token()` | This crate answers queries. |
| `@pandacss/dev` `defineConfig({ presets })` | `BAS-EXTEND-01`–`05` | Deep object mutation / prototype inheritance | Deterministic merge, `_private` stripping. |
| `@layer` multi-package sheet assembly | `BAS-LAYER-01`–`04` | Importing layered tokens into the local dictionary | `layers` is CSS-only. |

---

## 4. Required Cases

### Ingestion & In-Memory Artefact (`DUMP`)

- [x] `BAS-DUMP-01` `[reference]` `[unit]` —
  **BaseSystem should initialize with empty default state when constructed without parameters.**
  Construct `BaseSystem::default()`. Assert the instance has an empty name, an empty token dictionary, empty font registry, empty keyframes map, empty global CSS list, empty recipe map, empty condition list, and no upstream layers. An uninitialized collection or accidental panic on default query violates the empty-state invariant.
- [x] `BAS-DUMP-02` `[reference]` `[unit]` —
  **BaseSystem should ingest JSON-serialized fragment dumps without file I/O or bundler runtime.**
  Pass a complete serialized JSON payload containing evaluated fragments (`name`, `tokens`, `fonts`, `keyframes`, `globalCss`, `recipes`, `conditions`) to `BaseSystem::from_json(&str)`. Assert that all structures deserialize directly into typed in-memory representations with all lookup indexes built in $O(N)$ time. Deserialization must not spawn Node.js processes, read disk paths, or lose fragment categories.
- [x] `BAS-DUMP-03` `[reference]` `[unit]` —
  **BaseSystem should preserve system name identity and package attribution.**
  Construct a BaseSystem with `name: "@reference-ui/lib"`. Assert that `system.name()` returns `"@reference-ui/lib"`, maintaining clear provenance for diagnostic reporting, layer naming, and package attribution. Name omission or conflation with downstream root systems violates system identity.
- [x] `BAS-DUMP-04` `[forbidden]` `[unit]` —
  **BaseSystem must reject raw TypeScript/JavaScript source strings and unexecuted ASTs.**
  Attempt to instantiate a BaseSystem by passing an unbundled TypeScript string containing `tokens({ colors: { primary: '#fff' } })` or raw JS AST nodes. Assert that parsing fails immediately with an explicit diagnostic indicating that `base-system` consumes evaluated JSON dumps only. Attempting to bundle, execute JS, or run an OXC walker inside this crate is strictly forbidden.
- [x] `BAS-DUMP-05` `[reference]` `[unit]` —
  **BaseSystem should support zero-cost clone and thread-safe sharing across worker threads.**
  Clone an instantiated `BaseSystem` and share it across multiple worker threads executing concurrent `atomic` and `typegen` tasks. Assert that `BaseSystem` implements `Send + Sync`, clones in $O(1)$ via internal `Arc` references, and allows concurrent queries without mutex contention or thread-safety locks. Deep-cloning large token trees on every compilation pass violates performance constraints.

### Token Dictionary & Value Normalization (`TOKEN`)

- [x] `BAS-TOKEN-01` `[reference]` `[unit]` —
  **BaseSystem should index nested token paths into canonical dot-separated keys.**
  Ingest a token fragment containing nested structures `{ "colors": { "blue": { "600": { "value": "#2563eb" } } } }`. Assert that the token is indexed under category `Color` with relative path `"blue.600"` and full path `"colors.blue.600"`. Flattening keys with invalid delimiters or dropping intermediate hierarchy violates lookup predictability.
- [x] `BAS-TOKEN-02` `[reference]` `[unit]` —
  **BaseSystem should compute the authoritative CSS custom property variable name for every token.**
  Ingest tokens across standard categories (`colors.n300`, `spacing.4r`, `radii.md`, `fontSizes.lg`). Assert that `colors.n300` produces `--colors-n300`, `spacing.4r` produces `--spacing-4r`, and camelCase categories format with kebab-case prefixes (`--font-sizes-lg`). Variable name divergence between the atomic stylesheet and runtime `css()` causes ghost classes and missing styles.
- [x] `BAS-TOKEN-03` `[reference]` `[unit]` —
  **BaseSystem should resolve direct literal values for base theme emission.**
  Query a token `spacing.sm` defined with `{ "value": "0.5rem" }`. Assert that the query returns the exact literal string `"0.5rem"` for `@layer tokens` custom property declarations. Premature value transformation, rounding, or incorrect quotation stripping corrupts CSS output.
- [x] `BAS-TOKEN-04` `[reference]` `[unit]` —
  **BaseSystem should store and resolve light and dark mode values for semantic tokens.**
  Ingest a semantic token `colors.text` defined with `{ "value": "#111111", "dark": "#f5f5f5" }` or `{ "light": "#111111", "dark": "#f5f5f5" }`. Assert that base queries resolve `"#111111"`, while dark-mode queries return `"#f5f5f5"`, enabling `@layer tokens` emission under `:root` and `[data-theme="dark"]` selectors. Dropping the dark mode variant or collapsing semantic tokens to single static strings breaks color-mode switching.
- [ ] `BAS-TOKEN-05` `[reference]` `[unit]` —
  **BaseSystem should categorize tokens into strict closed design-system scales.**
  Ingest tokens across `colors`, `spacing`, `radii`, `fonts`, `fontSizes`, `fontWeights`, `lineHeights`, `letterSpacings`, `shadows`, `zIndex`, `opacity`, `borders`, `durations`, `easings`, and `animations`. Assert that each token is indexed into its respective `TokenCategory` enum variant without stringly-typed fallback. Uncategorized tokens or arbitrary strings on categories violate typegen contract validation.
- [ ] `BAS-TOKEN-06` `[reference]` `[unit]` —
  **BaseSystem should isolate `_private` token trees from downstream export while preserving local resolution.**
  Ingest a token set defining `colors.brand` alongside `colors._private.internalAccent`. Assert that local queries inside the owning system resolve `colors._private.internalAccent` and format its CSS variable, while public token enumerations mark the token private. Failing to scope `_private` tokens allows internal library implementation details to leak into consumer autocomplete.
- [x] `BAS-TOKEN-07` `[reference]` `[unit]` —
  **BaseSystem should detect and report duplicate token definitions within the same fragment batch.**
  Ingest two token fragments in the same unlayered definition that declare `colors.primary` with conflicting values `"#000"` and `"#fff"`. Assert that ingestion records a collision diagnostic detailing the duplicate key and source fragments. Silently overwriting definitions based on file discovery order produces non-deterministic builds.
- [x] `BAS-TOKEN-08` `[reference]` `[unit]` —
  **BaseSystem should resolve composite token references without cycles.**
  Ingest token `colors.brand` defined as `"{colors.blue.600}"` alongside `colors.blue.600: "#2563eb"`. Assert that the dictionary resolves the alias to the target token value or exposes the target variable name for CSS chaining (`var(--colors-blue-600)`), and detects cyclic references (`a -> b -> a`) by failing closed with an explicit diagnostic. Unhandled cyclic aliases causing infinite recursion or stack overflow are fatal defects.

### Font Definitions & Face Rules (`FONT`)

- [ ] `BAS-FONT-01` `[reference]` `[unit]` —
  **BaseSystem should store font definitions with family value and fallback stacks.**
  Ingest `font('sans', { value: '"Inter", ui-sans-serif, sans-serif', ... })`. Assert that the font registry stores `"sans"` with the complete fallback family string, retrievable when resolving `fontFamily="sans"` or `font="sans"`. Truncating fallback font families or stripping required quotes breaks font rendering.
- [ ] `BAS-FONT-02` `[reference]` `[unit]` —
  **BaseSystem should preserve structured `@font-face` descriptor rules for CSS generation.**
  Ingest a font definition containing `fontFace: { src: 'url(/fonts/inter.woff2) format("woff2")', fontWeight: '200 900', fontDisplay: 'swap' }`. Assert that the definition stores structured `@font-face` records with exact `src`, `font-weight`, and `font-display` attributes ready for `@layer global` sheet emission. Dropping descriptors causes unstyled font flashes or missing local font loading.
- [ ] `BAS-FONT-03` `[reference]` `[unit]` —
  **BaseSystem should map named font weight aliases to numeric CSS weights.**
  Ingest a font definition with `weights: { thin: '200', normal: '400', bold: '700' }`. Assert that querying font `"sans"` with semantic weight `"bold"` yields numeric string `"700"`. Failure to map weight aliases causes typography utilities to emit invalid CSS or fail-closed.
- [ ] `BAS-FONT-04` `[reference]` `[unit]` —
  **BaseSystem should attach font-level base CSS declarations.**
  Ingest a font definition with `css: { letterSpacing: '-0.01em', fontFeatureSettings: '"cv02"' }`. Assert that font-level CSS rules are stored and associated with the font definition for emission alongside typography utility classes. Dropping font-level CSS rules breaks design-system optical sizing and ligature configurations.

### Keyframes & Animation Steps (`MOTION`)

- [x] `BAS-MOTION-01` `[reference]` `[unit]` —
  **BaseSystem should store keyframes definitions with frame steps and declarations.**
  Ingest `keyframes({ fadeIn: { 'from': { opacity: '0' }, 'to': { opacity: '1' } } })`. Assert that the motion registry stores keyframe record `"fadeIn"` with step mapping `0% / from -> opacity: 0` and `100% / to -> opacity: 1`. Corrupting step percentages or dropping keyframe properties breaks CSS animation playback.
- [x] `BAS-MOTION-02` `[reference]` `[unit]` —
  **BaseSystem should expose keyframes for `@keyframes` at-rule generation.**
  Query all keyframes from an instantiated `BaseSystem`. Assert that the query returns an iterator of `(name, steps)` pairs formatted for serialization into `@layer global { @keyframes <name> { ... } }`. Omitting keyframes from the global layer leaves utility animation classes referencing non-existent animations.
- [x] `BAS-MOTION-03` `[reference]` `[unit]` —
  **BaseSystem should validate animation tokens against declared keyframe names.**
  Ingest keyframe `"spin"` alongside animation token `animations.spin: "spin 1s linear infinite"`. Assert that querying the animation token identifies the referenced keyframe name for cross-definition integrity. Unmatched animation references must produce a compiler diagnostic rather than silent broken animations.

### Global CSS, Reset & Conditions (`GLOBAL`)

- [ ] `BAS-GLOBAL-01` `[reference]` `[unit]` —
  **BaseSystem should collect arbitrary global CSS rule blocks.**
  Ingest `globalCss({ ':root': { '--spacing-root': '0.25rem' }, 'body': { margin: '0' } })`. Assert that selector blocks and CSS property mappings are stored verbatim for `@layer global` sheet compilation. Flattening global selectors into utility atoms or dropping `:root` variables breaks global resets.
- [ ] `BAS-GLOBAL-02` `[reference]` `[unit]` —
  **BaseSystem should store responsive breakpoint conditions and media queries.**
  Ingest breakpoint conditions `{ sm: '@media (min-width: 640px)', md: '@media (min-width: 768px)', lg: '@media (min-width: 1024px)' }`. Assert that breakpoints are indexed in numeric order, supporting responsive array index mapping `[base, sm, md, lg]`. Unordered breakpoints or corrupted media query strings break responsive style props.
- [ ] `BAS-GLOBAL-03` `[reference]` `[unit]` —
  **BaseSystem should index pseudo-class, state, and container query conditions.**
  Ingest conditions `{ _hover: '&:hover', _dark: '[data-theme="dark"] &', _focusVisible: '&:focus-visible' }`. Assert that each condition key maps to its exact CSS selector transform template. Missing conditions cause the atomic resolver to fail or emit invalid CSS rules.
- [ ] `BAS-GLOBAL-04` `[forbidden]` `[unit]` —
  **BaseSystem must reject upstream global CSS duplication across extends.**
  Ingest a downstream system extending an upstream system where the upstream system's global CSS is already included in its compiled layer. Assert that upstream global CSS fragments are not reinjected into the downstream global CSS list. Emitting duplicate resets or duplicate root CSS across package boundaries is strictly forbidden.

### Declared Component & Slot Recipes (`RECIPE`)

- [x] `BAS-RECIPE-01` `[reference]` `[unit]` —
  **BaseSystem should store declared component recipes with base, variants, and defaults.**
  Ingest a recipe `card` with `base: { p: '4r', rounded: 'md' }`, `variants: { tone: { quiet: { bg: 'n100' }, loud: { bg: 'n300' } } }`, and `defaultVariants: { tone: 'quiet' }`. Assert that the recipe schema preserves the complete variant table, default variants, and base styles. Dropping variant branches or default variants prevents `@layer recipes` emission and corrupts typegen variant props.
- [x] `BAS-RECIPE-02` `[reference]` `[unit]` —
  **BaseSystem should store compound variant definitions.**
  Ingest a recipe containing compound variants `[{ tone: 'loud', size: 'lg', css: { border: '2px solid' } }]`. Assert that the compound variant condition map and resulting CSS properties are preserved for closed-class generation. Ignoring compound variants leaves multi-variant state styling broken.
- [x] `BAS-RECIPE-03` `[forbidden]` `[unit]` —
  **BaseSystem does not store a slot-recipe helper.**
  The author API is `recipe()`. Multi-part components are authored React in `@reference-ui/react`. Assert that `BaseSystem` has no slot-recipe schema and no part-selector factory. Inventing a second recipe shape here would fork the runtime helper atomic compiles.
- [x] `BAS-RECIPE-04` `[forbidden]` `[unit]` —
  **BaseSystem must not execute runtime variant selection or class concatenation.**
  Attempt to invoke runtime recipe variant selection on a `BaseSystem` instance with props `{ tone: 'loud' }`. Assert that `BaseSystem` exposes only the static recipe schema and tables to `atomic` and `typegen`. The runtime `recipe()` function is authored TypeScript in core; embedding a runtime evaluator or closure compiler inside `base-system` is forbidden.

### Upstream Definition Merge & Private Scoping (`EXTEND`)

- [ ] `BAS-EXTEND-01` `[reference]` `[unit]` —
  **BaseSystem should merge upstream tokens into the local dictionary via `extends`.**
  Construct System B declaring `extends: [System A]`, where System A defines `colors.n100: '#eee'` and System B defines `colors.n200: '#ccc'`. Assert that System B's token dictionary contains both `n100` and `n200`, both answerable to `is_token` and visible to typegen. Dropping upstream tokens breaks token inheritance across packages.
- [ ] `BAS-EXTEND-02` `[reference]` `[unit]` —
  **BaseSystem should allow downstream tokens to override upstream tokens with precedence.**
  System A defines `colors.primary: '#0066cc'`; System B extends System A and defines `colors.primary: '#0055bb'`. Assert that querying `colors.primary` on System B resolves to `'#0055bb'`. Inverting precedence or raising a collision error on intentional downstream extension violates the composition model.
- [ ] `BAS-EXTEND-03` `[reference]` `[unit]` —
  **BaseSystem should strictly strip `_private` token trees when merging upstream systems.**
  System A defines `colors.publicToken: '#111'` and `colors._private.secretAccent: '#999'`. System B extends System A. Assert that System B's token dictionary contains `colors.publicToken` but does NOT contain `colors._private.secretAccent` or any key within `_private`. Internal tokens of base libraries must never leak into downstream application autocomplete.
- [ ] `BAS-EXTEND-04` `[reference]` `[unit]` —
  **BaseSystem should merge recipes and fonts across the extends hierarchy.**
  System A defines recipe `badge` and font `sans`; System B extends System A and defines recipe `button`. Assert that System B exposes recipes `badge` and `button` and font `sans`. Dropping recipes or fonts during definition merge breaks compound design systems.
- [ ] `BAS-EXTEND-05` `[reference]` `[unit]` —
  **BaseSystem should preserve deep multi-level extends chains deterministically.**
  Construct a three-tier chain where System C extends System B, and System B extends System A. Assert that token resolution follows bottom-up priority (C > B > A), with `_private` tokens stripped at each boundary. Cycle detection must identify circular extends chains (`A -> B -> A`) and fail closed with an explicit diagnostic.

### Upstream CSS Layer Isolation (`LAYER`)

- [ ] `BAS-LAYER-01` `[reference]` `[unit]` —
  **BaseSystem should attach upstream compiled CSS via `layers` without merging tokens.**
  Construct System B declaring `layers: [System A]`, where System A contains pre-compiled CSS and defines token `colors.isolated: '#777'`. Assert that System B retains System A's CSS stylesheet for final assembly, but System B's queryable token dictionary does NOT contain `colors.isolated`. Leaking layered tokens into child dictionaries causes invalid token autocomplete in downstream TypeScript types.
- [ ] `BAS-LAYER-02` `[reference]` `[unit]` —
  **BaseSystem should isolate token existence checks between layered systems.**
  Layered System A defines `colors.cardBg`; consumer System B compiles code referencing `bg="cardBg"`. Assert that `system_b.is_token("colors", "cardBg")` returns `false`, compelling the atomic engine to treat `cardBg` as raw CSS or emit an unknown token diagnostic. Falsely confirming layered tokens breaks layer boundary isolation.
- [ ] `BAS-LAYER-03` `[reference]` `[unit]` —
  **BaseSystem should preserve layer order across multiple layered upstream systems.**
  Construct System C declaring `layers: [System A, System B]`. Assert that upstream stylesheets are tracked in declaration order `[A, B]` with layer metadata preserved for cascade ordering. Shuffling layer order creates non-deterministic CSS specificity bugs.
- [ ] `BAS-LAYER-04` `[forbidden]` `[unit]` —
  **BaseSystem must reject token import from layered dependencies.**
  Attempt to access tokens, recipes, or fonts from a system attached exclusively via `layers: [baseSystem]`. Assert that `base-system` refuses to expose these definitions through its query API. Importing tokens across a layer boundary violates Matrix T1–T13 isolation guarantees.

### The Five Canonical Query Contracts (`ASK`)

- [x] `BAS-ASK-01` `[reference]` `[unit]` —
  **BaseSystem should answer token existence and category membership (Question 1).**
  Query `is_token("n300")` and `get_token_category("n300")` on a BaseSystem defining `colors.n300`. Assert that `is_token` returns `true` and `get_token_category` returns `Some(TokenCategory::Color)`, enabling `modules/atomic` to emit `var(--colors-n300)` and `modules/typegen` to allow `n300` on `bg`/`color`. Querying `"unknown"` must return `false` and `None`. Miscategorizing tokens or failing valid lookups breaks style compilation.
- [x] `BAS-ASK-02` `[reference]` `[unit]` —
  **BaseSystem should answer CSS custom property variable names and light/dark values (Question 2).**
  Query `get_token_css_var("colors", "n300")` and `get_token_value("colors", "n300")` on a BaseSystem with light/dark definitions. Assert that the query returns `--colors-n300`, the base/light CSS value string (e.g. `"oklch(...)"`), and the dark CSS value string (if present), enabling `@layer tokens` sheet emission under `:root` and theme selectors. Omitting custom property prefixes or dark values breaks theme emission.
- [ ] `BAS-ASK-03` `[reference]` `[unit]` —
  **BaseSystem should enumerate all keyframes, global CSS rules, and font definitions (Question 3).**
  Query `list_keyframes()`, `list_global_css()`, and `list_fonts()`. Assert that the query returns complete iterators of all active keyframe rules, global CSS selector blocks, and font definitions for `@layer global` and `@font-face` stylesheet generation. Missing global rules or fonts during stylesheet assembly breaks typography and keyframe animations.
- [ ] `BAS-ASK-04` `[reference]` `[unit]` —
  **BaseSystem should enumerate declared recipes with variant schemas and compound rules (Question 4).**
  Query `get_recipe("card")` and `list_recipes()`. Assert that the query returns a `RecipeDefinition` containing the recipe class name, base style map, variant options map (e.g. `tone: ["quiet", "loud"]`), default variants, and compound variant list, enabling closed-class recipe generation in atomic and variant prop typing in typegen. Malformed recipe schemas or dropped variant keys produce invalid recipe types.
- [ ] `BAS-ASK-05` `[reference]` `[unit]` —
  **BaseSystem should answer condition and breakpoint definitions (Question 5).**
  Query `get_condition("_hover")`, `get_condition("_dark")`, and `get_breakpoints()`. Assert that the query returns CSS selector transforms for `_hover` (`"&:hover"`), theme selector transforms for `_dark` (`"[data-theme=\"dark\"] &"`), and the ordered breakpoint list `["sm", "md", "lg"]`, enabling atomic condition resolution and responsive array mapping. Unknown condition queries must return `None` rather than panicking.
- [x] `BAS-ASK-06` `[reference]` `[unit]` —
  **BaseSystem queries must be thread-safe and non-allocating on hot lookup paths.**
  Execute 100,000 parallel lookups of `is_token`, `get_token_css_var`, and `get_condition` across multiple worker threads. Assert that lookups borrow `&str` references with zero heap allocation, completing in $O(1)$ time via `FxHashMap` or perfect hashing without taking mutexes. Heap allocations or lock contention on hot token lookup paths severely degrade compiler throughput.

---

## 5. Existing Proof Map

| Contract ID | Test File | Test Function / Proof Target |
| :--- | :--- | :--- |
| `BAS-DUMP-01` | `packages/reference-rs/modules/base-system/src/lib.rs` | `tests::default_definition_is_unnamed` |
| `BAS-DUMP-02` | `packages/reference-rs/modules/base-system/src/dump.rs` | `tests::bas_dump_02_indexes_nested_color_leaf` |
| `BAS-DUMP-03` | `packages/reference-rs/modules/base-system/src/dump.rs` | `tests::bas_dump_03_preserves_system_name` |
| `BAS-DUMP-04` | `packages/reference-rs/modules/base-system/src/dump.rs` | `tests::bas_dump_04_rejects_typescript_source` |
| `BAS-DUMP-05` | `packages/reference-rs/modules/base-system/src/lib.rs` | `tests::bas_dump_05_clone_shares_token_table` |
| `BAS-TOKEN-01` | `packages/reference-rs/modules/base-system/src/lower/tests.rs` | `tests::bas_token_01_indexes_five_segment_path` |
| `BAS-TOKEN-02` | `packages/reference-rs/modules/base-system/src/lower/tests.rs` | `tests::bas_token_02_kebabs_category_only` |
| `BAS-TOKEN-03` | `packages/reference-rs/modules/base-system/src/lower/tests.rs` | `tests::bas_token_03_value_leaf_has_no_dark_override` |
| `BAS-TOKEN-04` | `packages/reference-rs/modules/base-system/src/lower/tests.rs` | `tests::bas_token_04_resolves_mode_slots` |
| `BAS-TOKEN-05` | `packages/reference-rs/modules/base-system/src/lib.rs` | none |
| `BAS-TOKEN-06` | `packages/reference-rs/modules/base-system/src/lib.rs` | none |
| `BAS-TOKEN-07` | `packages/reference-rs/modules/base-system/src/lower/tests.rs` | `tests::bas_token_07_fonts_dual_source_duplicate` |
| `BAS-TOKEN-08` | `packages/reference-rs/modules/base-system/src/lower/tests.rs` | `tests::bas_token_08_keeps_brace_aliases_and_detects_cycle` |
| `BAS-FONT-01` | `packages/reference-rs/modules/base-system/src/lib.rs` | none |
| `BAS-FONT-02` | `packages/reference-rs/modules/base-system/src/lib.rs` | none |
| `BAS-FONT-03` | `packages/reference-rs/modules/base-system/src/lib.rs` | none |
| `BAS-FONT-04` | `packages/reference-rs/modules/base-system/src/lib.rs` | none |
| `BAS-MOTION-01` | `packages/reference-rs/modules/base-system/src/motion.rs` | `tests::bas_motion_01_stores_fade_in_steps` |
| `BAS-MOTION-02` | `packages/reference-rs/modules/base-system/src/motion.rs` | `tests::bas_motion_02_iterates_name_and_steps_for_at_rule_emit` |
| `BAS-MOTION-03` | `packages/reference-rs/modules/base-system/src/motion.rs` | `tests::bas_motion_03_animation_token_identifies_keyframe_name` |
| `BAS-GLOBAL-01` | `packages/reference-rs/modules/base-system/src/lib.rs` | none |
| `BAS-GLOBAL-02` | `packages/reference-rs/modules/base-system/src/lib.rs` | none |
| `BAS-GLOBAL-03` | `packages/reference-rs/modules/base-system/src/lib.rs` | none |
| `BAS-GLOBAL-04` | `packages/reference-rs/modules/base-system/src/lib.rs` | none |
| `BAS-RECIPE-01` | `packages/reference-rs/modules/base-system/src/recipes.rs` | `tests::bas_recipe_01_stores_base_variants_and_defaults` |
| `BAS-RECIPE-02` | `packages/reference-rs/modules/base-system/src/recipes.rs` | `tests::bas_recipe_02_preserves_compound_variants` |
| `BAS-RECIPE-03` | `packages/reference-rs/modules/base-system/src/recipes.rs` | `tests::bas_recipe_03_has_no_slot_recipe_schema` |
| `BAS-RECIPE-04` | `packages/reference-rs/modules/base-system/src/recipes.rs` | `tests::bas_recipe_04_static_schema_only` |
| `BAS-EXTEND-01` | `packages/reference-rs/modules/base-system/src/lib.rs` | none |
| `BAS-EXTEND-02` | `packages/reference-rs/modules/base-system/src/lib.rs` | none |
| `BAS-EXTEND-03` | `packages/reference-rs/modules/base-system/src/lib.rs` | none |
| `BAS-EXTEND-04` | `packages/reference-rs/modules/base-system/src/lib.rs` | none |
| `BAS-EXTEND-05` | `packages/reference-rs/modules/base-system/src/lib.rs` | none |
| `BAS-LAYER-01` | `packages/reference-rs/modules/base-system/src/lib.rs` | none |
| `BAS-LAYER-02` | `packages/reference-rs/modules/base-system/src/lib.rs` | none |
| `BAS-LAYER-03` | `packages/reference-rs/modules/base-system/src/lib.rs` | none |
| `BAS-LAYER-04` | `packages/reference-rs/modules/base-system/src/lib.rs` | none |
| `BAS-ASK-01` | `packages/reference-rs/modules/base-system/src/lib.rs` | `tests::bas_ask_01_unique_bare_name_and_category_string` |
| `BAS-ASK-02` | `packages/reference-rs/modules/base-system/src/lib.rs` | `tests::bas_ask_02_category_scoped_css_var_and_explicit_dark` |
| `BAS-ASK-03` | `packages/reference-rs/modules/base-system/src/lib.rs` | none |
| `BAS-ASK-04` | `packages/reference-rs/modules/base-system/src/lib.rs` | none |
| `BAS-ASK-05` | `packages/reference-rs/modules/base-system/src/lib.rs` | none |
| `BAS-ASK-06` | `packages/reference-rs/modules/base-system/src/lib.rs` | `tests::bas_ask_06_lookups_are_send_sync_across_threads` |

---

## 6. Remaining `[ ]` Ordered by Priority

1. **P0 — In-Memory Artefact & Deserialization (`BAS-DUMP-01` .. `05`):** Define the serializable/deserializable data model so evaluated fragment JSON dumps hydrate cleanly into memory.
2. **P0 — The Five Canonical Query Contracts (`BAS-ASK-01` .. `06`):** Implement the query methods required by `modules/atomic` and `modules/typegen`, answering token existence, CSS variable naming, light/dark values, keyframes/fonts/globals, recipes, and conditions.
3. **P1 — Token Dictionary & Normalization (`BAS-TOKEN-01` .. `08`):** Implement dot-path normalization, CSS custom property prefixing (`--colors-*`), literal value preservation, and semantic light/dark storage.
4. **P1 — Extends & Private Token Scoping (`BAS-EXTEND-01` .. `05`):** Implement multi-system definition merge with precedence rules, cycle detection, and strict stripping of `_private` token trees.
5. **P1 — Layer Isolation (`BAS-LAYER-01` .. `04`):** Implement CSS-only attachment for upstream systems, ensuring tokens from layered dependencies stay strictly out of local token queries and types.
6. **P2 — Recipes, Fonts, Keyframes & Globals (`BAS-RECIPE-01` .. `04`, `BAS-FONT-01` .. `04`, `BAS-MOTION-01` .. `03`, `BAS-GLOBAL-01` .. `04`):** Complete schema storage and iteration for `recipe()` tables, font-face descriptors, animation keyframes, and global CSS rule blocks.

---

## 7. "Do Not" / Tripwires

1. **Do not execute author JavaScript or parse TSX in `base-system`.**
   `reference-core/src/lib/fragments` already executes author files in Node.js and dumps pure JSON. A native fragment evaluator is forbidden.
2. **Do not emit CSS class names, utility atoms, or `.mt_2r`.**
   This crate owns the design-system *definition*, not the *stylesheet compiler*. Class generation belongs solely to `modules/atomic`.
3. **Do not generate TypeScript types or `.d.ts` files.**
   Type generation belongs to `modules/typegen`. `base-system` exposes read-only query APIs over the definition.
4. **Do not leak `layers` tokens into queryable dictionaries or TypeScript types.**
   `layers` provides precompiled CSS for component rendering without expanding the authoring contract. If `bg="isolatedToken"` typechecks or resolves as a token from a layered system, Matrix T1–T13 fails.
5. **Do not leak `_private` token trees across `extends`.**
   Tokens nested under `_private` are package-internal. They must be stripped during upstream merge so library internals do not pollute application autocomplete.
6. **Do not perform file I/O, glob walking, or directory scans.**
   `base-system` is an in-memory data structure. File discovery and micro-bundling are host pipeline responsibilities in TypeScript.
7. **Do not grow a second config dialect.**
   Utility transforms, layout patterns, and jsx name lists are not this crate. Dialect lives in `canon`. Runtime helpers live in `@reference-ui/react`.
8. **Do not allocate strings or take locks on hot lookup paths.**
   `is_token`, `get_token_css_var`, and `get_condition` are called millions of times during batch TSX extraction. Lookups must borrow slices in $O(1)$ time without mutex contention.
9. **Do not synthesize runtime `css()` or `recipe()` closures.**
   Runtime functions are authored TypeScript in `packages/reference-core/src/system/runtime` and `@reference-ui/react`.
10. **Do not treat `BaseSystem` as a mutable global singleton.**
    Every `BaseSystem` instance must be an immutable, self-contained value that can be constructed, extended, and queried concurrently across threads.
