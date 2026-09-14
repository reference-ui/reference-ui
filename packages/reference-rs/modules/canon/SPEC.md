# Canon SPEC

Current freeze, cases, and proof. Architecture: [README.md](./README.md).
System orchestration: [REFERENCE_SYSTEM.md](../../../REFERENCE_SYSTEM.md) and [atomic.md](../../docs/atomic.md).

Harness: Cargo unittests (`packages/reference-rs/modules/canon/src/tests.rs`)  
Generator: Platform join validation (`packages/reference-rs/modules/canon/generate/generate.ts`)

---

## 1. Job of the Crate

Canon is the single source of truth for the Reference UI style engine language: platform elements, CSS properties, StyleProps aliases, Reference extensions, and responsive conditions. It inverts Panda's hand-subsetted approach by treating living W3C/WHATWG web standards specifications (`@webref/elements` and `@webref/css`) as the primary platform truth, overlaying Reference UI dialect dictionaries (`dictionary.ts`) strictly for aliases, short class prefixes, macros, conditions, curated JSX primitives, and explicit dialect extensions. It emits zero-allocation, static, pre-sorted Rust tables and binary-search lookup functions (`is_reference_primitive`, `is_html_tag`, `is_known_style_prop`, `resolve_canonical_prop`, `class_prefix_for_prop`, `to_css_declaration_property`, `native_longhands_for_prop`, `is_color_prop`, `is_condition_prop`, `default_breakpoint_for_index`). It must not perform runtime heap allocations, evaluate author JavaScript, admit hallucinated layout primitives (`Box`, `Flex`, `Grid`), tolerate mismatched native shorthand decompositions, or allow downstream compiler passes (`atomic`, `styletrace`, `typegen`) to maintain secondary property lists.

---

## 2. Legend & Status Counts

- `[x]` Proven by a passing cargo unit test (`tests.rs`), fail-closed poison injection test (`join.test.ts`), or generator validation (`join.ts`).
- `[ ]` Specified; not yet proven by a dedicated named test. The underlying dictionary table or logic may already exist in source.

### Status Counts

| Area | Total Cases | Proven `[x]` | Specified `[ ]` | Test Suite Harness |
| :--- | :---: | :---: | :---: | :--- |
| **JOIN** (Platform join & compilation) | 8 | 8 | 0 | `[gen]` / `[unit]` |
| **TAG** (HTML/SVG tags & JSX primitives) | 5 | 5 | 0 | `[unit]` |
| **PROP** (CSS properties & declarations) | 7 | 7 | 0 | `[unit]` |
| **ALIAS** (StyleProps aliases) | 5 | 5 | 0 | `[unit]` |
| **EXT** (Dialect extensions & macros) | 3 | 3 | 0 | `[unit]` |
| **COND** (Conditions & breakpoints) | 4 | 4 | 0 | `[unit]` |
| **FAIL** (Fail-closed rejection) | 8 | 8 | 0 | `[unit]` / `[gen]` |
| **Total** | **40** | **40** | **0** | |

Named proven: `CAN-JOIN-01`–`08`, `CAN-TAG-01`–`05`, `CAN-PROP-01`–`07`, `CAN-ALIAS-01`–`05`, `CAN-EXT-01`–`03`, `CAN-COND-01`–`04`, `CAN-FAIL-01`–`08`.

### Existing Suites

- **Rust Unit Tests**: `packages/reference-rs/modules/canon/src/tests.rs` (22 passing tests in `cargo test -p canon`).
- **Platform Join & Poison Injection Tests**: `packages/reference-rs/modules/canon/generate/join.test.ts` (7 passing tests in `vitest run --project canon`).
- **Platform Join Orchestrator**: `packages/reference-rs/modules/canon/generate/generate.ts` (executes via `pnpm --filter @reference-ui/rust run canon`).

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
  **Dialect JSX primitives must join 100% with living `@webref/elements`.** Ingest all curated dialect element tags from `dictionary.ts` and validate against `@webref/elements` (living HTML + SVG2 host elements, excluding obsolete tags and document chrome). Assert every primitive tag exists in official web standards specifications; exit process with code 1 immediately if an unrecognized tag is encountered.
- [x] `CAN-JOIN-02` `[reference]` `[gen]` —
  **Full platform CSS emission from `@webref/css` plus allowlisted dialect extensions.** Ingest all living `@webref/css` properties directly into `CANONICAL_PROPERTIES`. Assert any emitted property not defined in W3C standards is explicitly registered in `DIALECT_CSS_ALLOWLIST`; exit process with code 1 otherwise.
- [x] `CAN-JOIN-03` `[reference]` `[gen]` —
  **Native CSS shorthands must decompose to identical longhands as `@webref/css`.** Decompose every shorthand in `@webref/css` using its official `longhands` array. Abort with exit code 1 if dialect longhands disagree with `@webref/css`.
- [x] `CAN-JOIN-04` `[reference]` `[unit]` —
  **Emitted static tables must be lexicographically pre-sorted for binary search.** Inspect `ELEMENTS`, `PRIMITIVE_JSX`, `CANONICAL_PROPERTIES`, `ALIASES`, `REFERENCE_PROPS`, `CONDITIONS`, and `COLOR_PROPERTIES` slices in emitted Rust code. Assert all slices are sorted in ascending byte order according to their search keys, ensuring `binary_search_by_key` always succeeds in $O(\log N)$ time without panic. Assert every element in `ELEMENTS` is resolved by `is_primitive_jsx_name`.
- [x] `CAN-JOIN-05` `[reference]` `[gen]` —
  **Dialect alias targets must resolve to platform properties or dialect extensions.** Validate that every alias target in `KNOWN_ALIASES` resolves to a valid `@webref/css` property or allowlisted dialect extension; exit process with code 1 otherwise.
- [x] `CAN-JOIN-06` `[reference]` `[gen]` —
  **Dialect short-prefix properties must exist on platform or dialect allowlist.** Validate that every property specified in short class prefix maps exists in `@webref/css` or `DIALECT_CSS_ALLOWLIST`; exit process with code 1 otherwise.
- [x] `CAN-JOIN-07` `[reference]` `[gen]` —
  **Dialect color extensions must exist on explicit color allowlist.** Validate that every color property in `COLOR_PROPERTIES` is either generated from webref syntax (`<color>`, `<paint>`, `color`, `*-color`) or registered in `DIALECT_COLOR_ALLOWLIST`; exit process with code 1 otherwise.
- [x] `CAN-JOIN-08` `[reference]` `[gen]` `[unit]` —
  **Unique class prefixes across all canonical properties.** Validate that every `class_prefix` in `CANONICAL_PROPERTIES` is globally unique. Ingest both living webref properties and dialect overlays, proving that colliding property pairs (`display`/`d`, `translateX`/`x`, `translateY`/`y`, `zIndex`/`translateZ`, `boxSize`/`size`) are disambiguated. Assert in Rust unit tests that no two `CANONICAL_PROPERTIES` share a `class_prefix`.

### HTML Elements & JSX Primitives (`TAG`)

- [x] `CAN-TAG-01` `[reference]` `[unit]` —
  **PascalCase JSX primitive recognition for curated HTML and SVG elements.** Query `is_reference_primitive` and `is_primitive_jsx_name` with valid PascalCase primitive identifiers (`Div`, `Span`, `Button`, `P`, `A`, `Section`, `Nav`, `Header`, `Footer`, `Main`, `Path`, `Circle`, `G`, `Rect`, `Line`, `Polyline`, `Polygon`, `ClipPath`, `LinearGradient`). Assert each returns `true`.
- [x] `CAN-TAG-02` `[reference]` `[unit]` —
  **Lowercase HTML/SVG tag recognition and dual primitive matching.** Query `is_html_tag` and `is_reference_primitive` with standard lowercase HTML and SVG tag strings (`div`, `span`, `button`, `p`, `path`, `circle`, `g`, `object`, `var`). Assert `is_html_tag` returns `true` and `is_reference_primitive` recognizes lowercase tags as valid primitives.
- [x] `CAN-TAG-03` `[reference]` `[unit]` —
  **Reserved keyword and tag collision renaming.** Query `is_primitive_jsx_name` and `is_reference_primitive` with mapped primitive names for reserved tags: `object` -> `Obj` and `var` -> `Var`. Assert `Obj` and `Var` match as valid JSX primitives while lowercase `object` and `var` match as HTML tags.
- [x] `CAN-TAG-04` `[reference]` `[unit]` —
  **Single-letter HTML tag uppercasing.** Verify single-character HTML and SVG tags (`a`, `p`, `b`, `i`, `q`, `s`, `u`, `g`) map to single-character uppercase JSX primitives (`A`, `P`, `B`, `I`, `Q`, `S`, `U`, `G`). Query `is_reference_primitive` with each identifier (`A`, `P`, `B`, `I`, `Q`, `S`, `U`, `G`). Assert all match successfully.
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
  **Color property resolution follows aliases and webref syntax.** Pass standard color properties (`color`, `backgroundColor`, `borderColor`), native shorthands accepting colors (`border`, `background`), StyleProps aliases (`c`, `bg`, `borderC`, `borderXC`), and non-color properties (`mt`, `aspectRatio`, `display`) to `is_color_prop`. Assert color-syntax properties and aliases return `true`, while non-color properties return `false`.

### StyleProps Shorthand Aliases (`ALIAS`)

- [x] `CAN-ALIAS-01` `[reference]` `[unit]` —
  **StyleProps concise shorthand alias recognition.** Pass standard Reference UI shorthand aliases (`mt`, `pt`, `p`, `m`, `bg`, `rounded`, `borderX`, `c`) to `is_known_style_prop`. Assert all return `true` via `resolve_alias` binary search in `ALIASES`.
- [x] `CAN-ALIAS-02` `[reference]` `[unit]` —
  **Shorthand alias resolution to canonical camelCase.** Call `resolve_canonical_prop` with concise authoring aliases (`mt`, `p`, `bg`, `c`). Assert values resolve to `marginTop`, `padding`, `background`, and `color` respectively.
- [x] `CAN-ALIAS-03` `[reference]` `[unit]` —
  **Directional and logical shorthand alias resolution.** Call `resolve_canonical_prop` with directional and logical aliases (`px` -> `paddingInline`, `py` -> `paddingBlock`, `mx` -> `marginInline`, `my` -> `marginBlock`, `start` -> `insetInlineStart`, `end` -> `insetInlineEnd`). Assert each alias maps to its exact logical CSS property.
- [x] `CAN-ALIAS-04` `[reference]` `[unit]` —
  **Corner radius and border shorthand alias resolution.** Call `resolve_canonical_prop` with border and corner aliases (`rounded` -> `borderRadius`, `roundedTop` -> `borderTopRadius`, `borderX` -> `borderInline`, `borderY` -> `borderBlock`). Assert aliases resolve to their canonical compound or logical properties.
- [x] `CAN-ALIAS-05` `[reference]` `[unit]` —
  **Idempotent resolution for already-canonical property names.** Call `resolve_canonical_prop` with properties that are already canonical (`color`, `marginTop`, `padding`). Assert the function returns the identical string unchanged.

### Reference UI Dialect Extensions & Macros (`EXT`)

- [x] `CAN-EXT-01` `[reference]` `[unit]` —
  **Dialect macro and extension props recognized as known style props.** Pass Reference UI custom props (`r`, `container`, `colorMode`, `variant`, `font`, `weight`) to `is_known_style_prop`. Assert each returns `true`. Note: `container` and `font` exist in living W3C CSS specifications and are treated as platform properties in `CANONICAL_PROPERTIES`.
- [x] `CAN-EXT-02` `[reference]` `[unit]` —
  **Identification of Reference-only macro props via `is_reference_prop`.** Iterate through all entries in `REFERENCE_PROPS` (`colorMode`, `r`, `size`, `variant`, `weight`) and pass them to `is_reference_prop`. Assert every entry returns `true`, while pure platform CSS properties (`container`, `font`, `color`, `mt`, `onClick`) return `false`.
- [x] `CAN-EXT-03` `[reference]` `[unit]` —
  **Macro isolation vs platform property collision in `find_property`.** Verify that non-CSS macro props (`colorMode`, `variant`, `weight`) return `None` from `find_property`. In contrast, macros that collide with real CSS properties (`r` for SVG circle radius, `size` for CSS paged media, `container` for container queries, and `font` for typography shorthand) return `Some(&Property)` matching their platform CSS definitions.

### Conditions, Breakpoints, and Selectors (`COND`)

- [x] `CAN-COND-01` `[reference]` `[unit]` —
  **Responsive breakpoint scale condition recognition.** Pass standard breakpoint identifiers (`base`, `sm`, `md`, `lg`, `xl`, `2xl`) to `is_condition_prop`. Assert each returns `true`.
- [x] `CAN-COND-02` `[reference]` `[unit]` —
  **Underscore-prefixed pseudo and state conditions.** Pass underscore-prefixed pseudo-classes and state conditions (`_hover`, `_focusVisible`, `_dark`, `_active`, `_disabled`) to `is_condition_prop`. Assert all return `true`. Note: prefixes `_`, `&`, and `@` are open discriminators for arbitrary pseudo-classes, selector fragments, and media queries, while bare identifiers without prefix must match breakpoint conditions.
- [x] `CAN-COND-03` `[reference]` `[unit]` —
  **Selector (`&`) and media query (`@`) condition prefix recognition.** Pass arbitrary CSS selector strings (`&:hover`, `& > svg`) and media queries (`@media (min-width: 600px)`) to `is_condition_prop`. Assert both prefix styles return `true` immediately.
- [x] `CAN-COND-04` `[reference]` `[unit]` —
  **Default responsive breakpoint retrieval by index.** Call `default_breakpoint_for_index` for indices 0 through 5. Assert indices map to `Some("base")`, `Some("sm")`, `Some("md")`, `Some("lg")`, `Some("xl")`, and `Some("2xl")` in order, and index 6 returns `None`.

### Fail-Closed Rejection Contracts (`FAIL`)

- [x] `CAN-FAIL-01` `[forbidden]` `[unit]` —
  **Rejection of hallucinated layout primitives.** Pass non-existent component primitives (`Box`, `Flex`, `Stack`, `Center`, `Spacer`, `Badge`, `Card`, `Tabs`, `Tab`, `Portal`, `AspectRatio`, `Grid`) to `is_reference_primitive`. Assert all return `false`.
- [x] `CAN-FAIL-02` `[forbidden]` `[unit]` —
  **Rejection of non-style DOM attributes and React props.** Pass standard DOM and React props (`onClick`, `id`, `className`, `children`, `href`, `aria-label`, `data-testid`) to `is_known_style_prop`. Assert all return `false`.
- [x] `CAN-FAIL-03` `[forbidden]` `[unit]` —
  **Rejection of bare pseudo selector names without prefix.** Pass unprefixed pseudo names (`hover`, `focus`, `active`) to `is_condition_prop`. Assert all return `false`.
- [x] `CAN-FAIL-04` `[forbidden]` `[gen]` —
  **Build abort on unknown dialect HTML tags missing from `@webref/elements`.** Execute `validateElementsJoin` with an injected invalid dialect tag (e.g. `foobar`). Assert the validator produces a failure diagnostic and the generator aborts with `process.exit(1)`.
- [x] `CAN-FAIL-05` `[forbidden]` `[gen]` —
  **Build abort on unverified canonical properties missing from `@webref/css` and allowlist.** Execute `validateDialectExtJoin` with an injected unverified property name. Assert the validator produces a failure diagnostic and the generator aborts with `process.exit(1)`.
- [x] `CAN-FAIL-06` `[forbidden]` `[gen]` —
  **Build abort on native shorthand longhands mismatching `@webref/css`.** Execute `validateShorthandsJoin` with an injected mutated longhand slice. Assert the validator produces a mismatch diagnostic and the generator aborts with `process.exit(1)`.
- [x] `CAN-FAIL-07` `[forbidden]` `[gen]` —
  **Build abort on unknown dialect alias targets or invalid color extensions.** Execute `validateAliasTargetsJoin` with an invalid alias target or `validateColorPropsJoin` with an invalid color extension. Assert the validator produces a failure diagnostic and the generator aborts with `process.exit(1)`.
- [x] `CAN-FAIL-08` `[forbidden]` `[gen]` —
  **Build abort on duplicate utility class prefix collision.** Execute `validateClassPrefixesJoin` with two properties assigned the identical class prefix (e.g. `d`). Assert the validator returns an error diagnostic identifying both clashing properties and the generator aborts with `process.exit(1)`.

---

## 5. Existing Proof Map

| Case ID | Source Test File | Target Function / Routine | Status |
| :--- | :--- | :--- | :---: |
| `CAN-JOIN-01` | `generate/join.ts` | `validateElementsJoin` | `[x]` |
| `CAN-JOIN-02` | `generate/join.ts` | `validateDialectExtJoin` | `[x]` |
| `CAN-JOIN-03` | `generate/join.ts` | `validateShorthandsJoin` | `[x]` |
| `CAN-JOIN-04` | `src/tests.rs` | `test_slices_are_sorted` | `[x]` |
| `CAN-JOIN-05` | `generate/join.ts` | `validateAliasTargetsJoin` | `[x]` |
| `CAN-JOIN-06` | `generate/join.ts` | `validateShortPrefixesJoin` | `[x]` |
| `CAN-JOIN-07` | `generate/join.ts` | `validateColorPropsJoin` | `[x]` |
| `CAN-JOIN-08` | `generate/join.test.ts`, `src/tests.rs` | `validateClassPrefixesJoin`, `test_unique_class_prefixes` | `[x]` |
| `CAN-TAG-01` | `src/tests.rs` | `test_real_primitives_match` (`Div`..`LinearGradient`) | `[x]` |
| `CAN-TAG-02` | `src/tests.rs` | `test_lowercase_html_tags_match` (`div`..`path`..`circle`) | `[x]` |
| `CAN-TAG-03` | `src/tests.rs` | `test_real_primitives_match` (`Obj`, `Var`) | `[x]` |
| `CAN-TAG-04` | `src/tests.rs` | `test_real_primitives_match` (`A`, `P`, `B`, `I`, `Q`, `S`, `U`, `G`) | `[x]` |
| `CAN-TAG-05` | `src/tests.rs` | `test_react_svg_camel_case_tags_match` | `[x]` |
| `CAN-PROP-01` | `src/tests.rs` | `test_style_props_match` (`aspectRatio`, `order`, etc.) | `[x]` |
| `CAN-PROP-02` | `src/tests.rs` | `test_class_prefix_for_prop` | `[x]` |
| `CAN-PROP-03` | `src/tests.rs` | `test_to_css_declaration_property` (zero-alloc `&str`) | `[x]` |
| `CAN-PROP-04` | `src/tests.rs` | `test_native_shorthands` (`padding`, `background`) | `[x]` |
| `CAN-PROP-05` | `src/tests.rs` | `test_style_props_match`, `test_to_css_declaration_property` | `[x]` |
| `CAN-PROP-06` | `src/tests.rs` | `test_non_shorthands_return_none` | `[x]` |
| `CAN-PROP-07` | `src/tests.rs` | `test_is_color_prop` (`border`, `c`, `bg`, `borderC`, `mt`) | `[x]` |
| `CAN-ALIAS-01` | `src/tests.rs` | `test_style_props_match` (`m`, `mt`, `p`, `pt`, `bg`, `rounded`, `borderX`) | `[x]` |
| `CAN-ALIAS-02` | `src/tests.rs` | `test_resolve_canonical_prop` | `[x]` |
| `CAN-ALIAS-03` | `src/tests.rs` | `test_directional_logical_alias_resolution` | `[x]` |
| `CAN-ALIAS-04` | `src/tests.rs` | `test_corner_radius_and_border_alias_resolution` | `[x]` |
| `CAN-ALIAS-05` | `src/tests.rs` | `test_idempotent_resolution_for_canonical_props` (`color`, `marginTop`, `padding`) | `[x]` |
| `CAN-EXT-01` | `src/tests.rs` | `test_style_props_match` (`r`, `container`, `colorMode`, `variant`, `font`, `weight`) | `[x]` |
| `CAN-EXT-02` | `src/tests.rs` | `test_reference_only_props` | `[x]` |
| `CAN-EXT-03` | `src/tests.rs` | `test_extension_isolation_in_find_property` | `[x]` |
| `CAN-COND-01` | `src/tests.rs` | `test_conditions_and_breakpoints` (`base`–`2xl`) | `[x]` |
| `CAN-COND-02` | `src/tests.rs` | `test_conditions_and_breakpoints` (`_hover`, `_focusVisible`, `_dark`, `_active`, `_disabled`) | `[x]` |
| `CAN-COND-03` | `src/tests.rs` | `test_conditions_and_breakpoints` (`&:hover`, `& > svg`, `@media`) | `[x]` |
| `CAN-COND-04` | `src/tests.rs` | `test_default_breakpoint_for_index` | `[x]` |
| `CAN-FAIL-01` | `src/tests.rs` | `test_hallucinated_primitives_fail` | `[x]` |
| `CAN-FAIL-02` | `src/tests.rs` | `test_non_style_attributes_fail` | `[x]` |
| `CAN-FAIL-03` | `src/tests.rs` | `test_conditions_and_breakpoints` (`hover`, `focus`, `active`) | `[x]` |
| `CAN-FAIL-04` | `generate/join.test.ts` | `validateElementsJoin` poison injection | `[x]` |
| `CAN-FAIL-05` | `generate/join.test.ts` | `validateDialectExtJoin` poison injection | `[x]` |
| `CAN-FAIL-06` | `generate/join.test.ts` | `validateShorthandsJoin` poison injection | `[x]` |
| `CAN-FAIL-07` | `generate/join.test.ts` | `validateAliasTargetsJoin`, `validateColorPropsJoin` poison injection | `[x]` |
| `CAN-FAIL-08` | `generate/join.test.ts` | `validateClassPrefixesJoin` poison injection | `[x]` |

---

## 6. "Do Not" / Tripwires

1. **Do NOT re-subset the platform to a utility string**:
   Canon's platform table is `@webref/css` in its entirety (820+ living properties). Dialect dictionaries (`dictionary.ts`) are overlays for short class prefixes, authoring aliases, macros, conditions, and JSX primitives. Never re-introduce an arbitrary handwritten subset of CSS properties as the source of truth.
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
