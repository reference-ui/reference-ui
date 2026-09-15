# Canon completion plan

The inverted `@webref` join is real and `pnpm agentrs c canon` is green. This
file is the remaining work to make `SPEC.md`, the generator, and the emitted
tables tell the same story: unique class prefixes, dual-key element search,
fail-closed proof that actually injects poison, and lookup APIs that match the
zero-allocation claim.

Execute in phase order. Do not hand-edit `src/`; change `generate/` and run
`pnpm --filter @reference-ui/rust run canon`. Out of scope lives in other crates
and is listed so it is not silently absorbed here.

**Status:** complete.

## Verify

```bash
pnpm --filter @reference-ui/rust run canon
pnpm agentrs c canon
pnpm agentrs q packages/reference-rs/modules/canon
```

## Done when

- Every `class_prefix` in `CANONICAL_PROPERTIES` is unique (fail-closed join).
- `is_primitive_jsx_name` binary-searches a slice sorted by jsx, not html.
- `is_html_tag` accepts React SVG camelCase (`clipPath`, `linearGradient`, …).
- `to_css_declaration_property` returns `&str` (no heap) for known props and `--*`.
- `CAN-FAIL-04`–`07` inject invalid fixtures and assert abort; they are not happy-path residue.
- `SPEC.md` cases that list names are actually asserted in `tests.rs` / join tests.
- `src/README.md` describes `css/*.rs`, not the deleted `css.rs`.
- SPEC status counts match dedicated proof, not “the production generator ran once”.

## Already true

- Platform table is full `@webref/css` (898 properties) plus `DIALECT_CSS_ALLOWLIST`.
- Dialect overlay is `dictionary.ts` (aliases, shorts, macros, conditions, primitives).
- Happy-path join gates exist and `pnpm canon` exits 0 on the current dictionary.
- 19 cargo tests pass: aliases, shorthands, Box/Flex/Grid rejection, sorted slices.
- Atomic already queries `is_known_style_prop`, aliases, longhands, `is_color_prop`, `class_prefix_for_prop`.

## Out of scope

- styletrace / typegen wiring onto canon (tripwire 4 in those crates).
- Atomic extract using `is_reference_primitive` as a tag filter (`ATM-SITE`, not canon).
- Atomic still special-casing `padding|margin|inset` and `css({ r: { 400: … } })`.
- Re-subsetting CSS back to the Panda utility string.

---

## Class prefix collisions

Atomic class names are `{prefix}_{value}`. Shared prefixes are ghost classes.

**Policy:** fail the generator on any duplicate `class_prefix`. Do not auto-rename. Fix `dictionary.ts`.

| Prefix | Owners |
| :--- | :--- |
| `d` | `display` (overlay short) and SVG `d` (platform kebab) |
| `x` | `translateX` (overlay short) and SVG `x` (platform kebab) |
| `y` | `translateY` (overlay short) and SVG `y` (platform kebab) |
| `z` | `zIndex` (overlay short) and `translateZ` (overlay short + alias `z`) |
| `size` | `boxSize` (overlay short) and CSS `size` (paged media) |

Dictionary fixes:

- Keep `display` → `d`. Set `CUSTOM_PREFIXES.d` to a unique prefix (`svg-d`).
- Keep `translateX` → `x`, `translateY` → `y`. Set `CUSTOM_PREFIXES.x` / `y` to `svg-x` / `svg-y`.
- Keep `zIndex` → `z`. Change the `translateZ` short from `z/1` to `translate-z`. Keep alias `z` → `translateZ` so authoring `z` still means `translateZ`; class becomes `translate-z_*`.
- Keep CSS `size` → `size`. Change the `boxSize` short from `size` to `box-size` (utility string `boxSize:box-size/boxSize`).

---

## Phases

### 1. Unique class prefixes

Shipping full webref under Panda shorts makes `display` and SVG `d` share `d_none`.

**Files:** `generate/generate.ts` (or `generate/join.ts`), `generate/dictionary.ts`, `generate/emitters-tests.ts`, `SPEC.md`.

- Add `validateClassPrefixesJoin`: every `DialectProperty.classPrefix` must be unique; on clash print both owners and `process.exit(1)`.
- Apply the dictionary fixes above so the live dialect passes the new gate.
- Add `CAN-JOIN-08` (unique prefixes) and `CAN-FAIL-08` (duplicate prefix aborts).
- Emit a cargo test: `class_prefix_for_prop("display") !== class_prefix_for_prop("d")` once SVG `d` is disambiguated; `zIndex` vs `translateZ` likewise.

**Proof:** `pnpm canon` fails if you temporarily set two props to prefix `d`. Cargo test: no two `CANONICAL_PROPERTIES` share `class_prefix`.

### 2. Search keys match the slices

`is_primitive_jsx_name` searches jsx on an html-sorted slice. It works today by luck.

**Files:** `generate/emitters.ts`, `generate/emitters-tests.ts`, `generate/dialect.ts`.

- Emit `PRIMITIVE_JSX` (or a second `ELEMENTS` permutation) sorted by jsx. `is_primitive_jsx_name` binary-searches that slice.
- `CAN-JOIN-04`: assert `ELEMENTS` sorted by html **and** the jsx slice sorted by jsx.
- `is_html_tag`: ASCII-lowercase the query before search so `clipPath` / `linearGradient` / `foreignObject` / `radialGradient` match the stored lowercase html.
- Tests: `is_html_tag("clipPath")`, `is_primitive_jsx_name("ClipPath")`, `is_reference_primitive("clipPath")` / `("ClipPath")`. `CAN-TAG-04` must assert `B I Q S U G A P`, not just `P A G`.

**Proof:** `test_slices_are_sorted` covers both keys. Every `ELEMENTS[i].jsx` is found by `is_primitive_jsx_name` (loop, not a sample).

### 3. Zero-alloc CSS names

SPEC forbids runtime heap allocation. `to_css_declaration_property` always `String::new` / `to_string()`.

**Files:** `generate/emitters.ts`, `generate/emitters-tests.ts`, `SPEC.md`.

- Return `&str`: `--*` returns the input; known props return `Property.css`; unknown returns the canonical name (no kebab fallback). Callers already gate on `is_known_style_prop`.
- If SPEC still wants kebab fallback for unknown, document that as the one allocating path and return `Cow<str>`. Prefer `&str` + no unknown kebab.
- Keep `CAN-PROP-03` assertions; they only cover known props and custom properties.

**Proof:** signature is `fn to_css_declaration_property(prop: &str) -> &str` (or `Cow` with `Borrowed` for known).

### 4. Fail-closed proof that injects poison

`CAN-FAIL-04`–`07` describe calling validators with `foobar`. Today they only run on the good dictionary.

**Files:** `generate/join.ts`, `generate/join.test.ts`, `generate/generate.ts`, `SPEC.md`.

- Move `validate*` into `generate/join.ts` and export them. `generate.ts` only orchestrates.
- `join.test.ts` (node:test via tsx, or a tiny vitest config next to canon generate — cargo cannot see TS): clone dialect, inject `foobar` tag / unverified prop / mutated longhands / bad alias / bad color / duplicate prefix; assert each validator returns a failure the orchestrator exits 1 on. Do not `process.exit` inside the validator; return Result-like failures so tests can catch them. `generate.ts` `process.exit(1)` on failure.
- Until those tests exist, SPEC marks `CAN-FAIL-04`–`07` as `[ ]`, or `[x]` only against `join.test.ts`.

**Proof:** a dedicated test file fails the join without writing `src/`. Proof map points at `generate/join.test.ts`, not `generate.ts` “exit condition”.

### 5. SPEC and tests say the same names

Several `[x]` cases list identifiers the tests never pass.

**Files:** `generate/emitters-tests.ts`, `SPEC.md`, `src/README.md`, `README.md`.

- `CAN-COND-02`: assert `_active` and `_disabled`.
- `CAN-FAIL-03`: assert `active` (with `hover`, `focus`).
- `CAN-COND-03` already has `&:hover` and `@media`; add `& > svg`.
- Document `is_condition`: `_` / `&` / `@` prefixes are open (any suffix). `CONDITIONS` is for bare breakpoint keys (`base`, `sm`, …). Either keep that and write it in SPEC, or stop short-circuiting `_` and only accept table members plus `&`/`@`. Pick one; test it. Recommendation: keep open `_`/`&`/`@` (custom selectors) and say so — do not pretend `CONDITIONS` is a closed underscore list.
- `is_color_prop("border")` is true because webref syntax includes `<color>`. SPEC a `CAN-PROP-07` (or note under color): shorthands that accept a color are color props; aliases `c` / `bg` / `borderC` resolve. Assert `!is_color_prop("mt")`.
- Fix `src/README.md`: generated files are `html.rs`, `css/*.rs`, `dialect.rs`, `conditions.rs`, `lib.rs`, `tests.rs`.
- Recount SPEC §2 after the new cases. No `[x]` without a named test.

**Proof:** SPEC proof map file column is a real test function / `join.test.ts` case.

---

## New cases

- `CAN-JOIN-08` — unique `class_prefix` across `CANONICAL_PROPERTIES` `[gen]` + `[unit]`
- `CAN-FAIL-08` — duplicate `class_prefix` aborts the generator `[gen]`
- `CAN-TAG-05` — React SVG camelCase tags match `is_html_tag` / `is_reference_primitive` `[unit]`
- `CAN-PROP-07` — `is_color_prop` follows aliases and webref color syntax; non-color props false `[unit]`
