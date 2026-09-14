# Canon SPEC

Current freeze, cases, and proof. Architecture: [README.md](./README.md).
System orchestration: [REFERENCE_SYSTEM.md](../../../REFERENCE_SYSTEM.md) and [atomic.md](../../docs/atomic.md).

Harness: Cargo unittests (`packages/reference-rs/modules/canon/src/tests.rs`) + Vitest (`packages/reference-rs/modules/canon/tests/join.test.ts`)  
Generator: Platform join validation orchestrator (`pnpm --filter @reference-ui/rust run canon`)

---

## 1. Job of the Crate

Canon is the single source of truth for the Reference UI style engine language: platform elements, CSS properties, StyleProps aliases, Reference extensions, and responsive conditions. It inverts Panda's hand-subsetted approach by treating living W3C/WHATWG web standards specifications (`@webref/elements` and `@webref/css`) as the primary platform truth, overlaying Reference UI dialect dictionaries (`overlay/`) strictly for aliases, short class prefixes, macros, conditions, curated JSX primitives, and explicit dialect extensions. It emits zero-allocation, static, pre-sorted Rust tables and binary-search lookup functions (`is_reference_primitive`, `is_html_tag`, `is_known_style_prop`, `resolve_canonical_prop`, `class_prefix_for_prop`, `to_css_declaration_property`, `native_longhands_for_prop`, `is_color_prop`, `is_condition_prop`). It must not perform runtime heap allocations, evaluate author JavaScript, admit hallucinated layout primitives (`Box`, `Flex`, `Grid`), tolerate mismatched native shorthand decompositions, or allow downstream compiler passes (`atomic`, `styletrace`, `typegen`) to maintain secondary property lists.

---

## 2. Legend & Status Counts

- `[x]` Proven by a passing cargo unit test (`src/tests.rs`) or fail-closed Vitest station (`tests/join.test.ts`). Code in `src/` is not proof. A proof-map row that only names a production function is `[ ]`.
- `[ ]` Specified; not yet proven by a dedicated named station.

Audit: 2026-09-14. Strict 1:1 case-to-spec-ID alignment. Every case is backed by a dedicated named test station.

### Status Counts

| Area | Total Cases | Proven `[x]` | Specified `[ ]` | Test Suite Harness |
| :--- | :---: | :---: | :---: | :--- |
| **JOIN** (Platform join & compilation) | 8 | 8 | 0 | `[gen]` / `[unit]` |
| **TAG** (HTML/SVG tags & JSX primitives) | 5 | 5 | 0 | `[unit]` |
| **PROP** (CSS properties & declarations) | 7 | 7 | 0 | `[unit]` |
| **ALIAS** (StyleProps aliases) | 6 | 6 | 0 | `[unit]` |
| **EXT** (Dialect extensions & macros) | 3 | 3 | 0 | `[unit]` |
| **COND** (Conditions & breakpoints) | 4 | 4 | 0 | `[unit]` |
| **FAIL** (Fail-closed rejection) | 10 | 10 | 0 | `[unit]` / `[gen]` |
| **Total** | **43** | **43** | **0** | |

Named proven: `CAN-JOIN-01`–`08`, `CAN-TAG-01`–`05`, `CAN-PROP-01`–`07`, `CAN-ALIAS-01`–`06`, `CAN-EXT-01`–`03`, `CAN-COND-01`–`04`, `CAN-FAIL-01`–`10`.

### Existing Suites

- **Rust Unit Tests**: `packages/reference-rs/modules/canon/src/tests.rs` (30 passing tests in `cargo test -p canon`).
- **Platform Join & Poison Injection Tests**: `packages/reference-rs/modules/canon/tests/join.test.ts` (15 passing tests in `vitest run --project canon`).
- **Platform Join Orchestrator**: Inverted join validation in generator suite (executes via `pnpm --filter @reference-ui/rust run canon`).

---

## 3. Crosswalk: Panda job → our ID → refuse

Panda fused config evaluation, AST extraction, CSS emission, and type
generation into one farm. Canon is only the Tier-0 vocabulary. Vendor
call sites are examples of the job, not names we ship.

| Panda architecture / job | Our ID | Refuse |
| :--- | :--- | :--- |
| `pandacss_shared::css_properties::CSS_PROPERTY_NAMES` from `mdn-data` | `CAN-JOIN-01`–`03` | **Refuse unverified MDN dumps.** Ingest living `@webref/elements` and `@webref/css` directly as platform truth. |
| JSX factories & layout patterns (`styled.div`, `Box`, `Flex`, `Grid`, `Stack`) | `CAN-TAG-01`–`02`, `CAN-FAIL-01` | **Refuse hallucinated layout primitives.** Primitives are 1:1 PascalCase HTML and SVG host tags (`Div`, `Span`, `Button`, `Path`, `Circle`, `Obj`, `Var`). |
| Dual dictionary split-brain: extractor `is_css_property` vs utility transform | `CAN-PROP-01`–`02`, `CAN-JOIN-04` | **Refuse secondary property lists.** `atomic`, `styletrace`, `typegen` query Canon. |
| Runtime JS `utility.transform` callbacks to normalize shorthands | `CAN-ALIAS-01`–`02`, `CAN-PROP-03` | **Refuse JS eval.** Static binary-search slices: `mt` → `marginTop`. |
| Shorthand longhands that drift from W3C | `CAN-PROP-04`, `CAN-JOIN-03`, `CAN-FAIL-06` | Longhands for all native CSS shorthands decompose from `@webref/css`. |
| 7-subfolder codegen farm (`styled-system/{css,cva,sva,jsx,patterns,recipes,tokens,types}`) | `CAN-EXT-01`, `CAN-PROP-01`, `CAN-ALIAS-01` | **Refuse generating that farm.** Primitives are authored React; `css()` / `recipe()` are authored TypeScript. Canon emits lookup tables. |
| Bare pseudo keys (`hover: { … }`) | `CAN-COND-02`, `CAN-FAIL-03` | Conditions need `_hover`, `&:hover`, or `@media`. |

---

## 4. Required Cases

### Platform Join & Compilation (`JOIN`)

- [x] `CAN-JOIN-01` `[reference]` `[gen]` —
  **Dialect JSX primitives must join 100% with living `@webref/elements`.** Ingest all curated dialect element tags from `overlay/` and validate against `@webref/elements` (living HTML + SVG2 host elements, excluding obsolete tags and document chrome). Assert every primitive tag exists in official web standards specifications; validator returns diagnostics and the orchestrator exits process with code 1 immediately if an unrecognized tag is encountered.
- [x] `CAN-JOIN-02` `[reference]` `[gen]` —
  **Full platform CSS emission from `@webref/css` plus allowlisted dialect extensions.** Ingest all living `@webref/css` properties directly into `CANONICAL_PROPERTIES`. Assert any emitted property not defined in W3C standards is explicitly registered in the `EXTENSIONS` table; validator returns diagnostics and the orchestrator exits process with code 1 otherwise.
- [x] `CAN-JOIN-03` `[reference]` `[gen]` —
  **Native CSS shorthands must decompose to identical longhands as `@webref/css`.** Decompose every shorthand in `@webref/css` using its official `longhands` array. Validator returns mismatch diagnostics and the orchestrator aborts with exit code 1 if dialect longhands disagree with `@webref/css`.
- [x] `CAN-JOIN-04` `[reference]` `[unit]` —
  **Emitted static tables must be lexicographically pre-sorted for binary search.** Inspect `ELEMENTS`, `PRIMITIVE_JSX`, `CANONICAL_PROPERTIES`, `ALIASES`, `REFERENCE_PROPS`, `CONDITIONS`, and `COLOR_PROPERTIES` slices in emitted Rust code. Assert all slices are sorted in ascending byte order according to their search keys, ensuring `binary_search_by_key` always succeeds in $O(\log N)$ time without panic. Assert every element in `ELEMENTS` is resolved by `is_primitive_jsx_name`.
- [x] `CAN-JOIN-05` `[reference]` `[gen]` —
  **Dialect alias targets must resolve to platform properties or dialect extensions.** Validate that every alias target in `ALIASES` resolves to a valid `@webref/css` property or allowlisted dialect extension; validator returns diagnostics and orchestrator exits process with code 1 otherwise.
- [x] `CAN-JOIN-06` `[reference]` `[gen]` —
  **Dialect short-prefix properties must exist on platform or dialect allowlist.** Validate that every property specified in short class prefix maps exists in `@webref/css` or dialect extensions; validator returns diagnostics and orchestrator exits process with code 1 otherwise.
- [x] `CAN-JOIN-07` `[reference]` `[gen]` —
  **Dialect color extensions must exist on explicit color allowlist.** Validate that every color property in `COLOR_PROPERTIES` is either generated from webref syntax (`<color>`, `<paint>`, `color`, `*-color`, `background`) or registered as a dialect color extension; validator returns diagnostics and orchestrator exits process with code 1 otherwise.
- [x] `CAN-JOIN-08` `[reference]` `[gen]` `[unit]` —
  **Unique class prefixes across all canonical properties.** Validate that every `class_prefix` in `CANONICAL_PROPERTIES` is globally unique. Ingest both living webref properties and dialect overlays, proving that colliding property pairs (`display`/`d`, `translateX`/`x`, `translateY`/`y`, `zIndex`/`translateZ`, `boxSize`/`size`) are disambiguated. Assert in Rust unit tests that no two `CANONICAL_PROPERTIES` share a `class_prefix`.

### HTML Elements & JSX Primitives (`TAG`)

- [x] `CAN-TAG-01` `[reference]` `[unit]` —
  **PascalCase JSX primitive recognition for curated HTML and SVG elements.** Query `is_reference_primitive` and `is_primitive_jsx_name` with valid PascalCase primitive identifiers (`Div`, `Span`, `Button`, `P`, `A`, `B`, `I`, `Q`, `S`, `U`, `G`, `Obj`, `Var`, `Section`, `Nav`, `Header`, `Footer`, `Main`, `Path`, `Circle`, `Rect`, `Line`, `Polyline`, `Polygon`, `ClipPath`, `LinearGradient`). Assert both functions return `true` for all entries.
- [x] `CAN-TAG-02` `[reference]` `[unit]` —
  **Lowercase HTML/SVG tag recognition and dual primitive matching.** Query `is_html_tag` and `is_reference_primitive` with standard lowercase HTML and SVG tag strings (`div`, `span`, `object`, `var`, `button`, `p`, `a`, `b`, `i`, `q`, `s`, `u`, `g`, `path`, `circle`). Assert `is_html_tag` returns `true` and `is_reference_primitive` recognizes lowercase tags as valid primitives.
- [x] `CAN-TAG-03` `[reference]` `[unit]` —
  **Reserved keyword and tag collision renaming.** Query `is_primitive_jsx_name` and `is_reference_primitive` with mapped primitive names for reserved tags: `object` -> `Obj` and `var` -> `Var`. Assert `Obj` and `Var` match as valid JSX primitives (`is_primitive_jsx_name` and `is_reference_primitive`) while lowercase `object` and `var` match as HTML tags (`is_html_tag`).
- [x] `CAN-TAG-04` `[reference]` `[unit]` —
  **Single-letter HTML tag uppercasing.** Verify single-character HTML and SVG tags (`a`, `p`, `b`, `i`, `q`, `s`, `u`, `g`) map to single-character uppercase JSX primitives (`A`, `P`, `B`, `I`, `Q`, `S`, `U`, `G`). Query both `is_reference_primitive` and `is_primitive_jsx_name` with each identifier (`A`, `P`, `B`, `I`, `Q`, `S`, `U`, `G`). Assert all match successfully.
- [x] `CAN-TAG-05` `[reference]` `[unit]` —
  **React SVG camelCase tag recognition and dual primitive matching.** Query `is_html_tag` and `is_reference_primitive` with React SVG camelCase tag strings (`clipPath`, `linearGradient`, `radialGradient`, `foreignObject`). Assert `is_html_tag` matches via zero-allocation ASCII-lowercasing, `is_primitive_jsx_name` matches their PascalCase primitives (`ClipPath`, `LinearGradient`, `RadialGradient`, `ForeignObject`), and `is_reference_primitive` matches both forms.

### CSS Properties & Declarations (`PROP`)

- [x] `CAN-PROP-01` `[reference]` `[unit]` —
  **Full canonical CSS property recognition via `is_known_style_prop`.** Pass living W3C camelCase property names (`aspectRatio`, `objectFit`, `pointerEvents`, `order`, `placeItems`, `fontStyle`, `textOverflow`, `mixBlendMode`, `color`, `display`, `fontSize`, `opacity`, `zIndex`) to `is_known_style_prop`. Assert each returns `true` via `find_property` binary search in `CANONICAL_PROPERTIES`.
- [x] `CAN-PROP-02` `[reference]` `[unit]` —
  **Atomic utility class prefix resolution with kebab fallback.** Call `class_prefix_for_prop` with canonical camelCase properties (`marginTop`, `padding`, `borderBottomWidth`, `aspectRatio`, `objectFit`) and shorthand aliases (`mt`, `p`). Assert popular properties resolve to short prefixes (`mt`, `p`, `bd-b-w`) and the platform tail falls back deterministically to kebab-case CSS declaration names (`aspect-ratio`, `object-fit`).
- [x] `CAN-PROP-03` `[reference]` `[unit]` —
  **Zero-allocation CSS declaration property name generation.** Call `to_css_declaration_property` with camelCase properties (`marginTop`, `paddingInline`, `aspectRatio`), aliases (`mt`, `px`), and custom properties (`--custom-color`). Assert properties format as standard kebab-case declaration borrowed string slices (`&str`) with zero runtime heap allocations.
- [x] `CAN-PROP-04` `[reference]` `[unit]` —
  **All-webref native shorthand longhand decomposition.** Call `native_longhands_for_prop` with shorthand properties (`padding`, `margin`, `border`, `background`). Assert `padding`, `margin`, `border` return canonical directional slices, and `background` returns the full webref decomposition containing `backgroundColor` and `backgroundImage`.
- [x] `CAN-PROP-05` `[reference]` `[unit]` —
  **Custom property (`--*`) passthrough and recognition.** Pass CSS custom property names (e.g. `--custom-token`, `--spacing-root`, `--colors-n-300`) to `is_known_style_prop` and `to_css_declaration_property`. Assert `is_known_style_prop` returns `true` and `to_css_declaration_property` returns the custom property unchanged without kebab-casing.
- [x] `CAN-PROP-06` `[reference]` `[unit]` —
  **Non-shorthand properties return `None` for native longhand queries.** Call `native_longhands_for_prop` with non-shorthand property names (`color`, `display`, `fontSize`, `opacity`, `aspectRatio`, `order`). Assert the return value is `None`.
- [x] `CAN-PROP-07` `[reference]` `[unit]` —
  **Color property resolution follows aliases and webref syntax.** Pass standard color properties (`color`, `backgroundColor`, `borderColor`), native shorthands accepting colors (`border`, `background`), StyleProps aliases (`bg`), and non-color properties (`mt`, `aspectRatio`, `display`) to `is_color_prop`. Assert color-syntax properties and aliases return `true`, while non-color properties return `false`.

### StyleProps Shorthand Aliases (`ALIAS`)

- [x] `CAN-ALIAS-01` `[reference]` `[unit]` —
  **StyleProps concise shorthand alias recognition.** Pass the conservative spacing and size aliases (`mt`, `pt`, `p`, `m`, `px`, `mx`, `w`, `h`, `minW`, `maxW`, `bg`, `flexDir`) to `is_known_style_prop`. Assert all return `true` via `resolve_alias` binary search in `ALIASES`.
- [x] `CAN-ALIAS-02` `[reference]` `[unit]` —
  **Shorthand alias resolution to canonical camelCase.** Call `resolve_canonical_prop` with concise authoring aliases (`mt`, `p`, `bg`). Assert values resolve to `marginTop`, `padding`, and `background` respectively.
- [x] `CAN-ALIAS-03` `[reference]` `[unit]` —
  **Spacing X/Y alias resolution.** Call `resolve_canonical_prop` with the spacing X/Y pair (`px` -> `paddingInline`, `py` -> `paddingBlock`, `mx` -> `marginInline`, `my` -> `marginBlock`). Assert each maps to its logical CSS property. Logical start/end (`ps`, `pe`, `ms`, `me`) are not aliases.
- [x] `CAN-ALIAS-04` `[reference]` `[unit]` —
  **Ambiguous aliases are refused so authoring stays CSS-shaped.** Pass `c`, `rounded`, `roundedTop`, `pos`, `shadow`, `ps`, `pe`, `ms`, and `me` to `is_known_style_prop`. Assert all return `false`. Authors write `color`, `borderRadius`, `position`, `boxShadow`, and `paddingInlineStart`.
- [x] `CAN-ALIAS-05` `[reference]` `[unit]` —
  **Idempotent resolution for already-canonical property names.** Call `resolve_canonical_prop` with properties that are already canonical (`color`, `marginTop`, `padding`). Assert the function returns the identical string unchanged.
- [x] `CAN-ALIAS-06` `[reference]` `[unit]` —
  **Alias targeting native shorthand decomposes to identical longhands.** Verify that an alias targeting a native CSS shorthand (`px` -> `paddingInline`) resolves longhands matching the canonical target (`paddingInlineStart`, `paddingInlineEnd`). Query `resolve_canonical_prop` and `native_longhands_for_prop`.

### Reference UI Dialect Extensions & Macros (`EXT`)

- [x] `CAN-EXT-01` `[reference]` `[unit]` —
  **Dialect macro and extension props recognized as known style props.** Pass Reference UI custom props (`r`, `container`, `colorMode`, `variant`, `font`, `weight`) to `is_known_style_prop`. Assert each returns `true`. Note: `container` and `font` exist in living W3C CSS specifications and are treated as platform properties in `CANONICAL_PROPERTIES`.
- [x] `CAN-EXT-02` `[reference]` `[unit]` —
  **Identification of Reference-only macro props via `is_reference_prop`.** Iterate through all entries in `REFERENCE_PROPS` (`colorMode`, `r`, `size`, `variant`, `weight`) and pass them to `is_reference_prop`. Assert every entry returns `true`, while pure platform CSS properties (`container`, `font`, `color`, `mt`, `onClick`) return `false`.
- [x] `CAN-EXT-03` `[reference]` `[unit]` —
  **Macro isolation vs platform property collision in `find_property`.** Verify that non-CSS macro props (`colorMode`, `variant`, `weight`) return `None` from `find_property`. In contrast, macros that collide with real CSS properties (`r` for SVG circle radius, `size` for CSS paged media, `container` for container queries, and `font` for typography shorthand) return `Some(&Property)` matching their platform CSS definitions.

### Conditions, Breakpoints, and Selectors (`COND`)

- [x] `CAN-COND-01` `[reference]` `[unit]` —
  **Condition grammar discriminators.** Pass condition prefixes (`_`, `&`, `@`) and bare identifiers to `is_condition_prop`. Assert `_hover`, `_dark`, `&:hover`, `@media (min-width: 600px)` return `true`, while bare identifiers without prefix (`sm`, `md`, `base`, `hover`) return `false`.
- [x] `CAN-COND-02` `[reference]` `[unit]` —
  **Underscore-prefixed pseudo and state conditions.** Pass underscore-prefixed pseudo-classes and state conditions (`_hover`, `_focusVisible`, `_dark`, `_active`, `_disabled`) and keys not in the dictionary (`_notInTheTable`) to `is_condition_prop`. Assert all return `true`. Note: prefixes `_`, `&`, and `@` are open discriminators for arbitrary pseudo-classes, selector fragments, and media queries, while bare identifiers without prefix must match breakpoint conditions.
- [x] `CAN-COND-03` `[reference]` `[unit]` —
  **Selector (`&`) and media query (`@`) condition prefix recognition.** Pass arbitrary CSS selector strings (`&:hover`, `& > svg`) and media queries (`@media (min-width: 600px)`) to `is_condition_prop`. Assert both prefix styles return `true` immediately.
- [x] `CAN-COND-04` `[reference]` `[unit]` —
  **Absence of default viewport scale in canon.** Pass viewport scale keys (`base`, `sm`, `md`, `lg`, `xl`, `2xl`) to `is_condition_prop`. Assert all return `false` because viewport breakpoints are utterances configured via tokens, not hardcoded language conditions. Assert `NAMED_CONDITIONS` contains standard CSS pseudo-classes.

### Fail-Closed Rejection Contracts (`FAIL`)

- [x] `CAN-FAIL-01` `[forbidden]` `[unit]` —
  **Rejection of hallucinated layout primitives.** Pass non-existent component primitives (`Box`, `Flex`, `Stack`, `Center`, `Spacer`, `Badge`, `Card`, `Tabs`, `Tab`, `Portal`, `AspectRatio`, `Grid`) to `is_reference_primitive`. Assert all return `false`.
- [x] `CAN-FAIL-02` `[forbidden]` `[unit]` —
  **Rejection of non-style DOM attributes, React props, and arbitrary nonsense names.** Pass standard DOM and React props (`onClick`, `id`, `className`, `children`, `href`, `aria-label`, `data-testid`) as well as arbitrary non-style strings (`foobar`) to `is_known_style_prop`. Assert all return `false`.
- [x] `CAN-FAIL-03` `[forbidden]` `[unit]` —
  **Rejection of bare pseudo selector names without prefix.** Pass unprefixed pseudo names (`hover`, `focus`, `active`) to `is_condition_prop`. Assert all return `false`.
- [x] `CAN-FAIL-04` `[forbidden]` `[gen]` —
  **Build abort on unknown dialect HTML tags missing from `@webref/elements`.** Execute `validateElementsJoin` with an injected invalid dialect tag (e.g. `foobar`). Assert the validator produces a failure diagnostic and the orchestrator aborts with `process.exit(1)`.
- [x] `CAN-FAIL-05` `[forbidden]` `[gen]` —
  **Build abort on unverified canonical properties missing from `@webref/css` and allowlist.** Execute `validateDialectExtJoin` with an injected unverified property name (`foobarProp`). Assert the validator produces a failure diagnostic and the orchestrator aborts with `process.exit(1)`.
- [x] `CAN-FAIL-06` `[forbidden]` `[gen]` —
  **Build abort on native shorthand longhands mismatching `@webref/css`.** Execute `validateShorthandsJoin` with an injected mutated longhand slice. Assert the validator produces a mismatch diagnostic and the orchestrator aborts with `process.exit(1)`.
- [x] `CAN-FAIL-07` `[forbidden]` `[gen]` —
  **Build abort on unknown dialect alias targets.** Execute `validateAliasTargetsJoin` with an injected invalid alias target (e.g. `badAlias` -> `unrecognizedTarget`). Assert the validator produces a failure diagnostic and the orchestrator aborts with `process.exit(1)`.
- [x] `CAN-FAIL-08` `[forbidden]` `[gen]` —
  **Build abort on duplicate utility class prefix collision.** Execute `validateClassPrefixesJoin` with two properties assigned the identical class prefix (e.g. `d`). Assert the validator returns an error diagnostic identifying both clashing properties and the orchestrator aborts with `process.exit(1)`.
- [x] `CAN-FAIL-09` `[forbidden]` `[gen]` —
  **Build abort on dialect short-prefix property missing from platform or allowlist.** Execute `validateShortPrefixesJoin` with an injected unverified short prefix property (e.g. `foobarProp: 'fb'`). Assert the validator produces a failure diagnostic and the orchestrator aborts with `process.exit(1)`.
- [x] `CAN-FAIL-10` `[forbidden]` `[gen]` —
  **Build abort on unallowlisted dialect color extension.** Execute `validateColorPropsJoin` with an injected unverified color property (e.g. `unrecognizedColor`). Assert the validator produces a failure diagnostic and the orchestrator aborts with `process.exit(1)`.

---

## 5. Existing Proof Map

| Case ID | Source Test File | Target Function / Routine | Status |
| :--- | :--- | :--- | :---: |
| `CAN-JOIN-01` | `tests/join.test.ts` | `CAN-JOIN-01: dialect JSX primitives join @webref/elements` | `[x]` |
| `CAN-JOIN-02` | `tests/join.test.ts` | `CAN-JOIN-02: full platform CSS emission plus allowlisted dialect extensions` | `[x]` |
| `CAN-JOIN-03` | `tests/join.test.ts` | `CAN-JOIN-03: native CSS shorthands decompose to identical longhands as @webref/css` | `[x]` |
| `CAN-JOIN-04` | `src/tests.rs` | `can_join_04_slices_are_sorted` | `[x]` |
| `CAN-JOIN-05` | `tests/join.test.ts` | `CAN-JOIN-05: dialect alias targets resolve to platform properties or dialect extensions` | `[x]` |
| `CAN-JOIN-06` | `tests/join.test.ts` | `CAN-JOIN-06: dialect short-prefix properties exist on platform or dialect allowlist` | `[x]` |
| `CAN-JOIN-07` | `tests/join.test.ts` | `CAN-JOIN-07: dialect color extensions exist on explicit color allowlist` | `[x]` |
| `CAN-JOIN-08` | `src/tests.rs`, `tests/join.test.ts` | `can_join_08_unique_class_prefixes`, `CAN-JOIN-08: asserts all canonical properties have unique class prefixes` | `[x]` |
| `CAN-TAG-01` | `src/tests.rs` | `can_tag_01_pascal_jsx_primitives` | `[x]` |
| `CAN-TAG-02` | `src/tests.rs` | `can_tag_02_lowercase_html_svg_tags` | `[x]` |
| `CAN-TAG-03` | `src/tests.rs` | `can_tag_03_reserved_tag_renames` | `[x]` |
| `CAN-TAG-04` | `src/tests.rs` | `can_tag_04_single_letter_tags` | `[x]` |
| `CAN-TAG-05` | `src/tests.rs` | `can_tag_05_react_svg_camel_case` | `[x]` |
| `CAN-PROP-01` | `src/tests.rs` | `can_prop_01_known_style_props` | `[x]` |
| `CAN-PROP-02` | `src/tests.rs` | `can_prop_02_class_prefix_for_prop` | `[x]` |
| `CAN-PROP-03` | `src/tests.rs` | `can_prop_03_css_declaration_property` | `[x]` |
| `CAN-PROP-04` | `src/tests.rs` | `can_prop_04_native_shorthand_longhands` | `[x]` |
| `CAN-PROP-05` | `src/tests.rs` | `can_prop_05_custom_property_passthrough` | `[x]` |
| `CAN-PROP-06` | `src/tests.rs` | `can_prop_06_non_shorthands_none` | `[x]` |
| `CAN-PROP-07` | `src/tests.rs` | `can_prop_07_color_prop_resolution` | `[x]` |
| `CAN-ALIAS-01` | `src/tests.rs` | `can_alias_01_known_shorthand_aliases` | `[x]` |
| `CAN-ALIAS-02` | `src/tests.rs` | `can_alias_02_resolve_canonical_prop` | `[x]` |
| `CAN-ALIAS-03` | `src/tests.rs` | `can_alias_03_directional_logical_alias_resolution` | `[x]` |
| `CAN-ALIAS-04` | `src/tests.rs` | `can_alias_04_ambiguous_aliases_refused` | `[x]` |
| `CAN-ALIAS-05` | `src/tests.rs` | `can_alias_05_idempotent_resolution_for_canonical_props` | `[x]` |
| `CAN-ALIAS-06` | `src/tests.rs` | `can_alias_06_alias_to_shorthand_longhands` | `[x]` |
| `CAN-EXT-01` | `src/tests.rs` | `can_ext_01_macros_are_known_style_props` | `[x]` |
| `CAN-EXT-02` | `src/tests.rs` | `can_ext_02_reference_only_props` | `[x]` |
| `CAN-EXT-03` | `src/tests.rs` | `can_ext_03_extension_isolation_in_find_property` | `[x]` |
| `CAN-COND-01` | `src/tests.rs` | `can_cond_01_grammar_discriminators` | `[x]` |
| `CAN-COND-02` | `src/tests.rs` | `can_cond_02_underscore_pseudos` | `[x]` |
| `CAN-COND-03` | `src/tests.rs` | `can_cond_03_ampersand_and_at_prefixes` | `[x]` |
| `CAN-COND-04` | `src/tests.rs` | `can_cond_04_no_default_viewport_scale` | `[x]` |
| `CAN-FAIL-01` | `src/tests.rs` | `can_fail_01_hallucinated_primitives` | `[x]` |
| `CAN-FAIL-02` | `src/tests.rs` | `can_fail_02_non_style_attributes` | `[x]` |
| `CAN-FAIL-03` | `src/tests.rs` | `can_fail_03_bare_pseudos` | `[x]` |
| `CAN-FAIL-04` | `tests/join.test.ts` | `CAN-FAIL-04: aborts when dialect contains unknown HTML/SVG element tag` | `[x]` |
| `CAN-FAIL-05` | `tests/join.test.ts` | `CAN-FAIL-05: aborts when dialect contains unverified CSS property` | `[x]` |
| `CAN-FAIL-06` | `tests/join.test.ts` | `CAN-FAIL-06: aborts when native shorthand longhands disagree with @webref/css` | `[x]` |
| `CAN-FAIL-07` | `tests/join.test.ts` | `CAN-FAIL-07: aborts on unknown dialect alias targets` | `[x]` |
| `CAN-FAIL-08` | `tests/join.test.ts` | `CAN-FAIL-08: aborts when duplicate class_prefix is introduced` | `[x]` |
| `CAN-FAIL-09` | `tests/join.test.ts` | `CAN-FAIL-09: aborts when dialect short prefix property is not on platform or allowlist` | `[x]` |
| `CAN-FAIL-10` | `tests/join.test.ts` | `CAN-FAIL-10: aborts when color extension is not in webref or dialect color allowlist` | `[x]` |

---

## 6. "Do Not" / Tripwires

1. **Do NOT re-subset the platform to a utility string**:
   Canon's platform table is `@webref/css` in its entirety (820+ living properties). Dialect dictionaries (`overlay/`) are overlays for short class prefixes, authoring aliases, macros, conditions, and JSX primitives. Never re-introduce an arbitrary handwritten subset of CSS properties as the source of truth.
2. **Do NOT admit `Box`, `Flex`, or `Grid` into primitives**:
   Reference UI does not export pseudo-layout components or polymorphic `styled.*` wrappers. Primitives are pure 1:1 representations of real HTML and SVG host elements (`Div`, `Span`, `Button`, `Path`, `Circle`, `Obj`, `Var`). Hallucinated layout wrappers must fail dictionary lookups immediately.
3. **Do NOT evaluate JavaScript at runtime or during extraction**:
   Canon is a static dictionary. Queries must execute in zero allocations via compile-time sorted static slices and binary search.
4. **Do NOT maintain secondary property dictionaries in downstream passes**:
   Downstream modules (`modules/atomic`, `modules/styletrace`, `modules/typegen`) must never define localized property allowlists or alias normalization maps. All compiler stages must consult `canon`.
5. **Do NOT hand-edit generated files under `modules/canon/src/`**:
   `html.rs`, `css/*.rs`, `dialect.rs`, `conditions.rs`, `lib.rs`, and `tests.rs` are `@generated`. Changes must be made in `modules/canon/generate/` and compiled via `pnpm --filter @reference-ui/rust run canon`.
6. **Do NOT permit bare pseudo-class keys without an explicit prefix**:
   Keys like `hover`, `focus`, `active` without leading `_`, `&`, or `@` must return `false` from `is_condition_prop` to eliminate grammar collisions with CSS properties or attributes.
7. **Do NOT allow native shorthand decompositions to drift from `@webref/css`**:
   Shorthands (`padding`, `margin`, `border`, `background`, etc.) must decompose to the exact longhands recognized by browser engines. The generator join validation must abort the build if drift occurs.
8. **Do NOT import downstream compiler crates into `canon`**:
   `canon` is tier-0 platform vocabulary. It depends only on the Rust standard library and must never import `atomic`, `base-system`, `styletrace`, or host packages.
