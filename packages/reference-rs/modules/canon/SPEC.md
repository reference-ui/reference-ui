# Canon SPEC

Current freeze, cases, and proof. Architecture: [README.md](./README.md).
System orchestration: [REFERENCE_SYSTEM.md](../../../REFERENCE_SYSTEM.md) and [atomic.md](../../docs/atomic.md).

Harness: Cargo unittests (`packages/reference-rs/modules/canon/src/tests.rs`)  
Generator: Platform join validation (`packages/reference-rs/modules/canon/generate/generate.ts`)

---

## 1. Job of the Crate

Canon is the single source of truth for the Reference UI style engine language: platform elements, CSS properties, StyleProps aliases, Reference extensions, and responsive conditions. It takes living W3C/WHATWG web standards specifications (`@webref/elements` and `@webref/css`) joined at build time with Reference UI dialect dictionaries, and emits zero-allocation, static, pre-sorted Rust tables and binary-search lookup functions (`is_reference_primitive`, `is_html_tag`, `is_known_style_prop`, `resolve_canonical_prop`, `class_prefix_for_prop`, `to_css_declaration_property`, `native_longhands_for_prop`, `is_condition_prop`, `default_breakpoint_for_index`). It must not perform runtime heap allocations, evaluate author JavaScript, admit hallucinated layout primitives (`Box`, `Flex`, `Grid`), tolerate mismatched native shorthand decompositions, or allow downstream compiler passes (`atomic`, `styletrace`, `typegen`) to maintain secondary property lists.

---

## 2. Legend & Status Counts

- `[x]` Proven by a passing cargo unit test (`tests.rs`) or fail-closed generator check (`generate.ts`).
- `[ ]` Specified; not yet proven by a dedicated named test. The underlying dictionary table or logic may already exist in source.

### Status Counts

| Area | Total Cases | Proven `[x]` | Specified `[ ]` | Test Suite Harness |
| :--- | :---: | :---: | :---: | :--- |
| **JOIN** (Platform join & compilation) | 4 | 3 | 1 | `[gen]` / `[unit]` |
| **TAG** (HTML tags & JSX primitives) | 4 | 4 | 0 | `[unit]` |
| **PROP** (CSS properties & declarations) | 6 | 5 | 1 | `[unit]` |
| **ALIAS** (StyleProps aliases) | 5 | 3 | 2 | `[unit]` |
| **EXT** (Dialect extensions) | 3 | 1 | 2 | `[unit]` |
| **COND** (Conditions & breakpoints) | 4 | 3 | 1 | `[unit]` |
| **FAIL** (Fail-closed rejection) | 6 | 6 | 0 | `[unit]` / `[gen]` |
| **Total** | **32** | **25** | **7** | |

Named proven: `CAN-JOIN-01`–`03`, `CAN-TAG-01`–`04`, `CAN-PROP-01`–`05`, `CAN-ALIAS-01`–`02`, `CAN-ALIAS-05`, `CAN-EXT-01`, `CAN-COND-01`–`03`, `CAN-FAIL-01`–`06`.

### Existing Suites

- **Rust Unit Tests**: `packages/reference-rs/modules/canon/src/tests.rs` (10 passing tests in `cargo test -p canon`).
- **Platform Join Validation**: `packages/reference-rs/modules/canon/generate/generate.ts` (3 fail-closed join gates executing via `pnpm --filter @reference-ui/rust run canon`).

---

## 3. Crosswalk: Panda Job -> Our ID -> Refuse

Panda v1 and v2 fused config evaluation, AST extraction, CSS emission, and TypeScript type generation into an interdependent farm. Reference UI decomposes this into strict tiers where Canon serves exclusively as the Tier-0 vocabulary dictionary.

| Panda Architecture / Job | Reference UI Canon ID | What Reference UI Refuses |
| :--- | :--- | :--- |
| `pandacss_shared::css_properties::CSS_PROPERTY_NAMES` generated from `mdn-data` | `CAN-JOIN-01`<br>`CAN-JOIN-02`<br>`CAN-JOIN-03` | **Refuse unverified MDN dumps.** Living browser standards from `@webref/elements` and `@webref/css` must validate 100% fail-closed at build time before emitting Rust tables. |
| JSX factories & layout pattern components (`styled.div`, `Box`, `Flex`, `Grid`, `Stack`, `Center`, `Spacer`) | `CAN-TAG-01`<br>`CAN-TAG-02`<br>`CAN-FAIL-01` | **Refuse hallucinated layout primitives.** No `Box`, `Flex`, or `Grid`. Reference UI primitives are 1:1 PascalCase mappings of valid HTML tags (`Div`, `Span`, `Button`, `P`, `Obj`, `Var`). |
| Dual dictionary split-brain: extractor `is_css_property` diverges from utility transform mapping, causing ghost classes | `CAN-PROP-01`<br>`CAN-PROP-02`<br>`CAN-JOIN-04` | **Refuse secondary property lists.** Compiler passes (`atomic`, `styletrace`, `typegen`) must never define private property tables. All lookup operations query Canon directly. |
| Runtime JS evaluation in TS AST walker (`utility.transform` callbacks) to normalize style shorthands | `CAN-ALIAS-01`<br>`CAN-ALIAS-02`<br>`CAN-PROP-03` | **Refuse runtime JS evaluation and TS transforms.** Static binary-search slices in Rust resolve aliases (`mt` -> `marginTop`) and kebab-case declaration names with zero allocation. |
| Native shorthand decompositions with engine-specific heuristics diverging from W3C specs | `CAN-PROP-04`<br>`CAN-JOIN-03`<br>`CAN-FAIL-06` | **Refuse shorthand decomposition drift.** Longhand slices for `padding`, `margin`, `border`, `inset`, and `outline` must strictly match `@webref/css` specifications. |
| 7-subfolder codegen farm (`styled-system/{css,cva,sva,jsx,patterns,recipes,tokens,types}`) | `CAN-EXT-01`<br>`CAN-PROP-01`<br>`CAN-ALIAS-01` | **Refuse generating runtime code farms.** Primitives are authored React; `css()` / `recipe()` are authored TypeScript. Canon only emits static dictionary tables for lookup. |
| Permissive bare pseudo-classes (`hover: { ... }`) creating grammar collisions with CSS properties | `CAN-COND-02`<br>`CAN-FAIL-03` | **Refuse bare pseudo keys.** Conditions require explicit discriminator prefixes: underscore (`_hover`, `_dark`), selector (`&:hover`), or media query (`@media`). |

---

## 4. Required Cases

### Platform Join & Compilation (`JOIN`)

- [x] `CAN-JOIN-01` `[reference]` `[gen]` —
  **Dialect HTML elements must join 100% with living `@webref/elements`.** Ingest all curated dialect element tags from `dictionary.ts` and query `@webref/elements` during generation. Assert every dialect tag exists in official web standards specifications; exit process with code 1 immediately if an unrecognized tag is encountered. Failure allows fictional or obsolete HTML tags into the primitive catalog.
- [x] `CAN-JOIN-02` `[reference]` `[gen]` —
  **Canonical properties must join with `@webref/css` or exist on explicit dialect allowlist.** Ingest all canonical properties from `CANONICAL_UTILITY_STRING` and validate against `@webref/css` properties. Assert any property not defined in W3C standards is explicitly registered in `DIALECT_CSS_ALLOWLIST`; exit process with code 1 otherwise. Failure emits unparseable or unrecognized CSS property names in generated stylesheets.
- [x] `CAN-JOIN-03` `[reference]` `[gen]` —
  **Native CSS shorthands must decompose to identical longhands as `@webref/css`.** Compare longhand decomposition arrays for `padding`, `margin`, `border`, `inset`, and `outline` in `NATIVE_SHORTHANDS` against `@webref/css` shorthand definitions. Assert sorted longhand sets are identical; exit process with code 1 if longhands diverge. Failure produces CSS shorthand-longhand precedence races and ghost overrides in `@layer utilities`.
- [ ] `CAN-JOIN-04` `[reference]` `[unit]` —
  **Emitted static tables must be lexicographically pre-sorted for binary search.** Inspect `ELEMENTS`, `CANONICAL_PROPERTIES`, `ALIASES`, `REFERENCE_PROPS`, and `CONDITIONS` slices in emitted Rust code. Assert all slices are sorted in ascending byte order according to their search keys, ensuring `binary_search_by_key` always succeeds in $O(\log N)$ time without panic. Failure causes silent lookup misses in the compiler.

### HTML Elements & JSX Primitives (`TAG`)

- [x] `CAN-TAG-01` `[reference]` `[unit]` —
  **PascalCase JSX primitive recognition for curated HTML elements.** Query `is_reference_primitive` and `is_primitive_jsx_name` with valid PascalCase primitive identifiers (`Div`, `Span`, `Button`, `P`, `A`, `Section`, `Nav`, `Header`, `Footer`, `Main`). Assert each returns `true`. Failure prevents the atomic style engine from recognizing Reference UI JSX tag primitives during AST traversal.
- [x] `CAN-TAG-02` `[reference]` `[unit]` —
  **Lowercase HTML tag recognition and dual primitive matching.** Query `is_html_tag` and `is_reference_primitive` with standard lowercase HTML tag strings (`div`, `span`, `button`, `p`, `object`, `var`). Assert `is_html_tag` returns `true` and `is_reference_primitive` recognizes lowercase tags as valid primitives. Failure prevents extractors from matching lowercase DOM elements or creates asymmetric tag classification.
- [x] `CAN-TAG-03` `[reference]` `[unit]` —
  **Reserved keyword and tag collision renaming.** Query `is_primitive_jsx_name` and `is_reference_primitive` with mapped primitive names for reserved tags: `object` -> `Obj` and `var` -> `Var`. Assert `Obj` and `Var` match as valid JSX primitives while lowercase `object` and `var` match as HTML tags. Failure introduces syntax errors in generated JSX definitions or misclassifies `<Obj>` and `<Var>` primitives.
- [x] `CAN-TAG-04` `[reference]` `[unit]` —
  **Single-letter HTML tag uppercasing.** Verify single-character HTML tags (`a`, `p`, `b`, `i`, `q`, `s`, `u`) map to single-character uppercase JSX primitives (`A`, `P`, `B`, `I`, `Q`, `S`, `U`). Query `is_reference_primitive` with each identifier. Assert all match successfully. Failure drops support for fundamental typographic and navigation elements in JSX.

### CSS Properties & Declarations (`PROP`)

- [x] `CAN-PROP-01` `[reference]` `[unit]` —
  **Canonical CSS property recognition via `is_known_style_prop`.** Pass standard W3C camelCase property names (`color`, `display`, `fontSize`, `opacity`, `zIndex`) to `is_known_style_prop`. Assert each returns `true` via `find_property` binary search in `CANONICAL_PROPERTIES`. Failure treats standard CSS styling properties as non-style DOM attributes, dropping them from compilation.
- [x] `CAN-PROP-02` `[reference]` `[unit]` —
  **Atomic utility class prefix resolution.** Call `class_prefix_for_prop` with canonical camelCase properties (`marginTop`, `padding`, `borderBottomWidth`) and shorthand aliases (`mt`, `p`). Assert canonical properties resolve to their configured short prefixes (`mt`, `p`, `bd-b-w`) and aliases resolve to the same prefix as their canonical target. Failure causes class name mismatches between compiler extraction and runtime `css()`.
- [x] `CAN-PROP-03` `[reference]` `[unit]` —
  **Kebab-case CSS declaration property name generation.** Call `to_css_declaration_property` with camelCase properties (`marginTop`, `paddingInline`), aliases (`mt`, `px`), and custom properties (`--custom-color`). Assert properties format as standard kebab-case declaration strings (`margin-top`, `padding-inline`, `--custom-color`). Failure emits malformed CSS declarations into the stylesheet ruleset.
- [x] `CAN-PROP-04` `[reference]` `[unit]` —
  **Native shorthand longhand decomposition.** Call `native_longhands_for_prop` with shorthand properties (`padding`, `margin`, `border`). Assert `padding` returns `["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]`, `margin` returns `["marginTop", "marginRight", "marginBottom", "marginLeft"]`, and `border` returns `["borderWidth", "borderStyle", "borderColor"]`. Failure prevents shorthand expansion, causing cascade bugs when shorthands and longhands collide.
- [x] `CAN-PROP-05` `[reference]` `[unit]` —
  **Custom property (`--*`) passthrough and recognition.** Pass CSS custom property names (e.g. `--custom-token`, `--spacing-root`, `--colors-n-300`) to `is_known_style_prop` and `to_css_declaration_property`. Assert `is_known_style_prop` returns `true` and `to_css_declaration_property` returns the custom property unchanged without kebab-casing. Failure blocks CSS variable authoring on JSX elements or mutates variable names.
- [ ] `CAN-PROP-06` `[reference]` `[unit]` —
  **Non-shorthand properties return `None` for native longhand queries.** Call `native_longhands_for_prop` with non-shorthand property names (`color`, `display`, `fontSize`, `opacity`). Assert the return value is `None`. Failure mistakenly triggers shorthand expansion on atomic properties, duplicating or corrupting CSS rules.

### StyleProps Shorthand Aliases (`ALIAS`)

- [x] `CAN-ALIAS-01` `[reference]` `[unit]` —
  **StyleProps concise shorthand alias recognition.** Pass standard Reference UI shorthand aliases (`mt`, `pt`, `p`, `m`, `bg`, `rounded`, `borderX`, `c`) to `is_known_style_prop`. Assert all return `true` via `resolve_alias` binary search in `ALIASES`. Failure drops shorthand authoring props from atomic extraction, requiring developers to write verbose names.
- [x] `CAN-ALIAS-02` `[reference]` `[unit]` —
  **Shorthand alias resolution to canonical camelCase.** Call `resolve_canonical_prop` with concise authoring aliases (`mt`, `p`, `bg`, `c`). Assert values resolve to `marginTop`, `padding`, `background`, and `color` respectively. Failure creates ghost classes where runtime `css()` and compiler stylesheet disagree on property identity.
- [ ] `CAN-ALIAS-03` `[reference]` `[unit]` —
  **Directional and logical shorthand alias resolution.** Call `resolve_canonical_prop` with directional and logical aliases (`px` -> `paddingInline`, `py` -> `paddingBlock`, `mx` -> `marginInline`, `my` -> `marginBlock`, `start` -> `insetInlineStart`, `end` -> `insetInlineEnd`). Assert each alias maps to its exact logical CSS property. Failure breaks RTL layout mirroring and logical spacing abstraction.
- [ ] `CAN-ALIAS-04` `[reference]` `[unit]` —
  **Corner radius and border shorthand alias resolution.** Call `resolve_canonical_prop` with border and corner aliases (`rounded` -> `borderRadius`, `roundedTop` -> `borderTopRadius`, `borderX` -> `borderInline`, `borderY` -> `borderBlock`). Assert aliases resolve to their canonical compound or logical properties. Failure breaks border radius and composite border styling in primitives.
- [x] `CAN-ALIAS-05` `[reference]` `[unit]` —
  **Idempotent resolution for already-canonical property names.** Call `resolve_canonical_prop` with properties that are already canonical (`color`, `marginTop`, `padding`). Assert the function returns the identical string unchanged. Failure corrupts canonical property lookups or returns unexpected substrings.

### Reference UI Dialect Extensions (`EXT`)

- [x] `CAN-EXT-01` `[reference]` `[unit]` —
  **Dialect extension props recognized as known style props.** Pass Reference UI custom props (`r`, `container`, `colorMode`, `variant`, `font`, `weight`) to `is_known_style_prop`. Assert each returns `true` via `is_reference_prop` binary search in `REFERENCE_PROPS`. Failure causes dialect extensions on primitives to be treated as DOM attributes or rejected by compiler passes.
- [ ] `CAN-EXT-02` `[reference]` `[unit]` —
  **Identification of Reference-only props via `is_reference_prop`.** Iterate through all entries in `REFERENCE_PROPS` (`colorMode`, `container`, `font`, `r`, `variant`, `weight`) and pass them to `is_reference_prop`. Assert every entry returns `true` and non-extension props (e.g. `color`, `mt`, `onClick`) return `false`. Failure causes compiler passes to conflate dialect macro props with raw CSS properties.
- [ ] `CAN-EXT-03` `[reference]` `[unit]` —
  **Extension props isolate from native CSS properties in `find_property`.** Call `find_property` with dialect extension prop names (`r`, `container`, `colorMode`, `variant`, `font`, `weight`). Assert `find_property` returns `None` for pure dialect extensions that have no native CSS longhand representation in `CANONICAL_PROPERTIES`. Failure emits invalid CSS property declarations directly into stylesheets.

### Conditions, Breakpoints, and Selectors (`COND`)

- [x] `CAN-COND-01` `[reference]` `[unit]` —
  **Responsive breakpoint scale condition recognition.** Pass standard breakpoint identifiers (`base`, `sm`, `md`, `lg`, `xl`, `2xl`) to `is_condition_prop`. Assert each returns `true`. Failure drops responsive object keys and responsive array definitions from atomic compilation.
- [x] `CAN-COND-02` `[reference]` `[unit]` —
  **Underscore-prefixed pseudo and media conditions.** Pass underscore-prefixed pseudo-classes and state conditions (`_hover`, `_focusVisible`, `_dark`, `_active`, `_disabled`) to `is_condition_prop`. Assert all return `true`. Failure prevents interactive states and color-mode selectors from being extracted as conditional styles.
- [x] `CAN-COND-03` `[reference]` `[unit]` —
  **Selector (`&`) and media query (`@`) condition prefix recognition.** Pass arbitrary CSS selector strings (`&:hover`, `& > svg`) and media queries (`@media (min-width: 600px)`) to `is_condition_prop`. Assert both prefix styles return `true` immediately. Failure rejects authored nested selectors and custom container/media queries.
- [ ] `CAN-COND-04` `[reference]` `[unit]` —
  **Default responsive breakpoint retrieval by index.** Call `default_breakpoint_for_index` for indices 0 through 5. Assert indices map to `Some("base")`, `Some("sm")`, `Some("md")`, `Some("lg")`, `Some("xl")`, and `Some("2xl")` in order, and index 6 returns `None`. Failure misaligns responsive array syntax (`[baseVal, smVal, mdVal]`) during style extraction.

### Fail-Closed Rejection Contracts (`FAIL`)

- [x] `CAN-FAIL-01` `[forbidden]` `[unit]` —
  **Rejection of hallucinated layout primitives.** Pass non-existent component primitives (`Box`, `Flex`, `Stack`, `Center`, `Spacer`, `Badge`, `Card`, `Tabs`, `Tab`, `Image`, `Portal`, `AspectRatio`, `Grid`) to `is_reference_primitive`. Assert all return `false`. Failure allows unbacked layout wrappers to bypass compilation checks, producing broken runtime elements.
- [x] `CAN-FAIL-02` `[forbidden]` `[unit]` —
  **Rejection of non-style DOM attributes and React props.** Pass standard DOM and React props (`onClick`, `id`, `className`, `children`, `href`, `aria-label`, `data-testid`) to `is_known_style_prop`. Assert all return `false`. Failure routes event handlers and structural React props into the CSS compilation pipeline.
- [x] `CAN-FAIL-03` `[forbidden]` `[unit]` —
  **Rejection of bare pseudo selector names without prefix.** Pass unprefixed pseudo names (`hover`, `focus`, `active`) to `is_condition_prop`. Assert all return `false`. Failure allows ambiguous keys to be parsed as conditions rather than being rejected or treated as attributes.
- [x] `CAN-FAIL-04` `[forbidden]` `[gen]` —
  **Build abort on unknown dialect HTML tags missing from `@webref/elements`.** Execute `validateElementsJoin` with an invalid dialect tag (e.g. `foobar`). Assert the generator logs a failure diagnostic and terminates with `process.exit(1)`. Failure generates Rust dictionary tables containing invalid or hallucinated HTML elements.
- [x] `CAN-FAIL-05` `[forbidden]` `[gen]` —
  **Build abort on unverified canonical properties missing from `@webref/css` and allowlist.** Execute `validatePropertiesJoin` with an unverified property name (e.g. `fakeProperty`). Assert the generator logs a failure diagnostic and terminates with `process.exit(1)`. Failure generates invalid CSS property definitions in the compiler canon.
- [x] `CAN-FAIL-06` `[forbidden]` `[gen]` —
  **Build abort on native shorthand longhands mismatching `@webref/css`.** Execute `validateShorthandsJoin` with altered longhand slices (e.g. omitting `paddingLeft` from `padding`). Assert the generator logs a mismatch diagnostic and terminates with `process.exit(1)`. Failure causes the compiler to generate conflicting CSS shorthand expansions.

---

## 5. Existing Proof Map

| Case ID | Source Test File | Target Function / Routine | Status |
| :--- | :--- | :--- | :---: |
| `CAN-JOIN-01` | `generate/generate.ts` | `validateElementsJoin` | `[x]` |
| `CAN-JOIN-02` | `generate/generate.ts` | `validatePropertiesJoin` | `[x]` |
| `CAN-JOIN-03` | `generate/generate.ts` | `validateShorthandsJoin` | `[x]` |
| `CAN-JOIN-04` | `src/tests.rs` | none (*compile-time sort assertion gap*) | `[ ]` |
| `CAN-TAG-01` | `src/tests.rs` | `test_real_primitives_match` | `[x]` |
| `CAN-TAG-02` | `src/tests.rs` | `test_lowercase_html_tags_match` | `[x]` |
| `CAN-TAG-03` | `src/tests.rs` | `test_real_primitives_match` (lines 16-17: `Obj`, `Var`) | `[x]` |
| `CAN-TAG-04` | `src/tests.rs` | `test_real_primitives_match` (lines 14-15: `P`, `A`) | `[x]` |
| `CAN-PROP-01` | `src/tests.rs` | `test_style_props_match` (lines 68-69: `color`, `display`) | `[x]` |
| `CAN-PROP-02` | `src/tests.rs` | `test_class_prefix_for_prop` | `[x]` |
| `CAN-PROP-03` | `src/tests.rs` | `test_to_css_declaration_property` | `[x]` |
| `CAN-PROP-04` | `src/tests.rs` | `test_native_shorthands` (lines 132-140) | `[x]` |
| `CAN-PROP-05` | `src/tests.rs` | `test_style_props_match` (line 70), `test_to_css_declaration_property` (line 127) | `[x]` |
| `CAN-PROP-06` | `src/tests.rs` | `test_native_shorthands` (line 141: `color`) | `[x]` |
| `CAN-ALIAS-01` | `src/tests.rs` | `test_style_props_match` (lines 61-67: `m`, `mt`, `p`, `pt`, `bg`, `rounded`, `borderX`) | `[x]` |
| `CAN-ALIAS-02` | `src/tests.rs` | `test_resolve_canonical_prop` | `[x]` |
| `CAN-ALIAS-03` | `src/tests.rs` | none (*logical aliases: `px`, `py`, `start`, `end`*) | `[ ]` |
| `CAN-ALIAS-04` | `src/tests.rs` | none (*radius/border aliases: `rounded`, `roundedTop`, `borderX`*) | `[ ]` |
| `CAN-ALIAS-05` | `src/tests.rs` | `test_resolve_canonical_prop` (lines 109-110: `color`) | `[x]` |
| `CAN-EXT-01` | `src/tests.rs` | `test_style_props_match` (lines 55-60: `r`, `container`, `colorMode`, `variant`, `font`, `weight`) | `[x]` |
| `CAN-EXT-02` | `src/tests.rs` | none (*direct `is_reference_prop` unit test*) | `[ ]` |
| `CAN-EXT-03` | `src/tests.rs` | none (*`find_property` isolation test*) | `[ ]` |
| `CAN-COND-01` | `src/tests.rs` | `test_conditions_and_breakpoints` (lines 86-91: `base`–`2xl`) | `[x]` |
| `CAN-COND-02` | `src/tests.rs` | `test_conditions_and_breakpoints` (lines 93-95: `_hover`, `_focusVisible`, `_dark`) | `[x]` |
| `CAN-COND-03` | `src/tests.rs` | `test_conditions_and_breakpoints` (lines 96-97: `&:hover`, `@media`) | `[x]` |
| `CAN-COND-04` | `src/tests.rs` | none (*`default_breakpoint_for_index` unit test*) | `[ ]` |
| `CAN-FAIL-01` | `src/tests.rs` | `test_hallucinated_primitives_fail` | `[x]` |
| `CAN-FAIL-02` | `src/tests.rs` | `test_non_style_attributes_fail` | `[x]` |
| `CAN-FAIL-03` | `src/tests.rs` | `test_conditions_and_breakpoints` (lines 99-100: `hover`, `focus`) | `[x]` |
| `CAN-FAIL-04` | `generate/generate.ts` | `validateElementsJoin` exit condition | `[x]` |
| `CAN-FAIL-05` | `generate/generate.ts` | `validatePropertiesJoin` exit condition | `[x]` |
| `CAN-FAIL-06` | `generate/generate.ts` | `validateShorthandsJoin` exit condition | `[x]` |

---

## 6. Remaining [ ] Ordered by Priority

1. **P1 — Logical and Directional Alias Resolution (`CAN-ALIAS-03`)**:
   Add explicit assertions to `test_resolve_canonical_prop` (in `generate/emitters-tests.ts`) verifying logical shorthands:
   - `resolve_canonical_prop("px") == "paddingInline"`
   - `resolve_canonical_prop("py") == "paddingBlock"`
   - `resolve_canonical_prop("mx") == "marginInline"`
   - `resolve_canonical_prop("my") == "marginBlock"`
   - `resolve_canonical_prop("start") == "insetInlineStart"`
   - `resolve_canonical_prop("end") == "insetInlineEnd"`

2. **P1 — Corner Radius & Border Shorthand Aliases (`CAN-ALIAS-04`)**:
   Add assertions verifying compound border and radius alias normalization:
   - `resolve_canonical_prop("rounded") == "borderRadius"`
   - `resolve_canonical_prop("roundedTop") == "borderTopRadius"`
   - `resolve_canonical_prop("borderX") == "borderInline"`
   - `resolve_canonical_prop("borderY") == "borderBlock"`

3. **P1 — Reference-Only Prop Identification (`CAN-EXT-02`)**:
   Add dedicated test `test_reference_only_props` in `emitters-tests.ts`:
   - Assert `is_reference_prop` returns `true` for all 6 dialect extensions (`r`, `container`, `font`, `weight`, `colorMode`, `variant`).
   - Assert `is_reference_prop` returns `false` for standard CSS properties (`color`, `marginTop`) and non-style attributes (`id`).

4. **P1 — Extension Isolation from Native CSS Properties (`CAN-EXT-03`)**:
   Assert in unit tests that `find_property` returns `None` for pure dialect extensions (`r`, `colorMode`, `variant`), ensuring they never produce raw CSS property declarations without resolve transformation.

5. **P2 — Responsive Breakpoint Indexer (`CAN-COND-04`)**:
   Add unit test `test_default_breakpoint_for_index`:
   - Verify indices `0..=5` return `Some("base")`, `Some("sm")`, `Some("md")`, `Some("lg")`, `Some("xl")`, `Some("2xl")`.
   - Verify index `6` and `usize::MAX` return `None`.

6. **P2 — Pre-Sorted Slices Binary Search Integrity (`CAN-JOIN-04`)**:
   Add unit test `test_slices_are_sorted` asserting every static slice (`ELEMENTS`, `CANONICAL_PROPERTIES`, `ALIASES`, `REFERENCE_PROPS`, `CONDITIONS`) satisfies `windows(2).all(|w| w[0] < w[1])`.

---

## 7. "Do Not" / Tripwires

1. **Do NOT admit `Box`, `Flex`, or `Grid` into primitives**:
   Reference UI does not export pseudo-layout components or polymorphic `styled.*` wrappers. Primitives are pure 1:1 representations of real HTML elements (`Div`, `Span`, `Button`, `P`, `Obj`, `Var`). Hallucinated layout wrappers must fail dictionary lookups immediately.
2. **Do NOT evaluate JavaScript at runtime or during extraction**:
   Canon is a static dictionary. Queries must execute in zero allocations via compile-time sorted static slices and binary search.
3. **Do NOT maintain secondary property dictionaries in downstream passes**:
   Downstream modules (`modules/atomic`, `modules/styletrace`, `modules/typegen`) must never define localized property allowlists or alias normalization maps. All compiler stages must consult `canon`.
4. **Do NOT hand-edit generated files under `modules/canon/src/`**:
   `html.rs`, `css.rs`, `dialect.rs`, `conditions.rs`, `lib.rs`, and `tests.rs` are `@generated`. Changes must be made in `modules/canon/generate/` and compiled via `pnpm --filter @reference-ui/rust run canon`.
5. **Do NOT permit bare pseudo-class keys without an explicit prefix**:
   Keys like `hover`, `focus`, `active` without leading `_`, `&`, or `@` must return `false` from `is_condition_prop` to eliminate grammar collisions with CSS properties or attributes.
6. **Do NOT allow native shorthand decompositions to drift from `@webref/css`**:
   Shorthands (`padding`, `margin`, `border`, `inset`, `outline`) must decompose to the exact longhands recognized by browser engines. The generator join validation must abort the build if drift occurs.
7. **Do NOT import downstream compiler crates into `canon`**:
   `canon` is tier-0 platform vocabulary. It depends only on the Rust standard library and must never import `atomic`, `base-system`, `styletrace`, or host packages.
