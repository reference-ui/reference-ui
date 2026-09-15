# Canon lock-down plan (pt2)

Pt1 shipped the inverted `@webref` join, unique class prefixes, dual-key
element search, `&str` CSS names, and poison injection. This file is the
harness freeze: **SPEC and tests become 1:1.** Overlay content (aliases,
Panda CSV, viewport breakpoints) is [plan-pt3.md](./plan-pt3.md).

Do not add product behavior. Do not invent a third harness. Do not
hand-edit `src/`; change `generate/` and run `pnpm --filter @reference-ui/rust run canon`.

**Status:** complete. This is the freeze.

---

## Test architecture (frozen)

Canon is a dictionary, not `compile()`. Two harnesses. That is the whole map.

| What | Where you edit | What it emits / runs | Command |
| :--- | :--- | :--- | :--- |
| Dictionary membership, aliases, tags, conditions, fail-closed lookups | `generate/emitters-tests.ts`, `emitters-tests-tags.ts`, `emitters-tests-props.ts` | generated `src/tests.rs` | `pnpm agentrs c canon` |
| Fail-closed `@webref` join (happy path **and** poison) | `generate/join.test.ts` | handwritten vitest | `pnpm agentrs v canon` |

- **Never** create `tests/cases/CAN-*`. Atomic stations are for `compile()` goldens. Canon has no stylesheet to snapshot.
- **Never** hand-edit `src/tests.rs`. It is `@generated`.
- Cargo cannot see TypeScript. Vitest cannot see the Rust tables. Do not try to collapse the two.
- `generate/join.ts` is production. A proof-map row that names `validateElementsJoin` is **not** a test.
- `pnpm canon` is the generator. Running it is not proof.

Station names are the SPEC ID:

- Rust: `fn can_tag_01_pascal_jsx_primitives()`
- Vitest: `it('CAN-JOIN-01: dialect JSX primitives join @webref/elements', …)`

One SPEC ID → one named station. Two IDs in one `#[test]` / `it()` is a demotion.

---

## Verify

```bash
pnpm --filter @reference-ui/rust run canon
pnpm agentrs c canon
pnpm agentrs v canon
pnpm agentrs q packages/reference-rs/modules/canon
```

All four. README and the agent-rs skill row must list all four.

---

## Done when

- Legend matches atomic: `[x]` is a named `#[test]` or a named `it('CAN-*')`. Code in `src/` is not proof. A proof-map row that only names a production function is `[ ]`.
- Every SPEC ID has exactly one station. Station name contains the ID.
- Every `#[test]` / `it()` in canon is in the proof map. No orphans.
- Proof map file column is `src/tests.rs` or `generate/join.test.ts`. Never `join.ts`, never `generate.ts`.
- `CAN-JOIN-01`–`03` and `05`–`07` are dedicated vitest stations on the live dialect (`expect(validateX(…)).toEqual([])`). The bundled `validateJoin` smoke may stay; it does not count.
- `CAN-FAIL-07` is alias poison only. Color poison and short-prefix poison are their own IDs.
- SPEC §2 counts match the proof map after a 1:1 recount. No `[x]` without a station.
- README Verify includes `pnpm agentrs v canon`.
- This file is the harness freeze. Overlay lock-down is [plan-pt3.md](./plan-pt3.md).

---

## Already true (pt1)

- Platform table is full `@webref/css` plus `DIALECT_CSS_ALLOWLIST`.
- Unique `class_prefix`, `PRIMITIVE_JSX` sorted by jsx, `to_css_declaration_property` returns `&str`.
- Poison injection exists for FAIL-04, 05, 06, 07 (bundled), 08.
- 22 cargo tests and 7 vitest tests pass. Quality is green.
- Atomic already queries canon for style props, aliases, longhands, color, class prefixes.

---

## Honest recount (audit 2026-09-14)

Atomic bar: combined IDs and proof-map rows that name production functions are `[ ]`.

| Keep `[x]` (24) | Demote `[ ]` (16) |
| :--- | :--- |
| `JOIN-04`, `JOIN-08` | `JOIN-01`, `02`, `03`, `05`, `06`, `07` (proof is `join.ts`) |
| `TAG-01`, `TAG-02`, `TAG-05` | `TAG-03`, `TAG-04` (inside `test_real_primitives_match`) |
| `PROP-02`, `03`, `04`, `06`, `07` | `PROP-01`, `PROP-05` (inside `test_style_props_match`) |
| `ALIAS-02`–`05` | `ALIAS-01`, `EXT-01` (same bundled test) |
| `EXT-02`, `EXT-03` | `COND-01`, `02`, `03` (inside `test_conditions_and_breakpoints`) |
| `COND-04` | `FAIL-03` (same bundled test) |
| `FAIL-01`, `02`, `04`, `05`, `06`, `07`, `08` | |

`FAIL-07` stays listed `[x]` only until split: the current `it()` proves two validators. Demote it in phase 1, prove both IDs in phase 3.

Orphan (not in SPEC): `test_dialect_alias_for_shorthand_tripwire`.

Missing poison: `validateShortPrefixesJoin` (JOIN-06 has no FAIL twin). Color poison is jammed into FAIL-07.

---

## New cases (freeze at 43)

Do not add anything else.

| ID | Why it exists |
| :--- | :--- |
| `CAN-ALIAS-06` `[unit]` | Alias that targets a native shorthand (`borderX` → `borderInline`) decomposes to the same longhands as the canonical name. Maps the orphan tripwire. |
| `CAN-FAIL-09` `[gen]` | Poison a dialect short prefix that is not on platform or allowlist. Twin of JOIN-06. |
| `CAN-FAIL-10` `[gen]` | Poison a color extension that is not on webref or `DIALECT_COLOR_ALLOWLIST`. Twin of JOIN-07. FAIL-07 becomes alias-only. |

Not new IDs — fold into existing cases:

- `CAN-COND-02` must assert an underscore key **not** in `CONDITIONS` (`_notInTheTable`) so the open `_` / `&` / `@` discriminator is proven, not implied.
- `CAN-TAG-01`, `03`, `04` must call both functions the SPEC names (`is_reference_primitive` **and** `is_primitive_jsx_name`).
- `CAN-FAIL-02` must also reject a nonsense name (`foobar`), not only DOM/React attrs.

`generate.ts` `process.exit(1)` is orchestration. SPEC must say so: validators return diagnostics; the orchestrator exits. Proof is `join.test.ts`. Do not spawn the generator.

---

## Out of scope

These are other crates' plans. Overlay unsoundness is [plan-pt3.md](./plan-pt3.md). Do not absorb atomic / typegen / styletrace work here.

- styletrace / typegen wiring onto canon (tripwire 4 **in those crates**).
- Atomic extract using `is_reference_primitive` as a tag filter (`ATM-SITE`).
- Atomic special-casing `padding|margin|inset` and `css({ r: { 400: … } })`.
- Re-subsetting CSS back to the Panda utility string.
- `tests/cases/CAN-*` goldens, a third harness, or N-API seams (canon has none).
- Hand-editing `src/`, splitting `css/properties.rs`, or splitting generated `tests.rs` into `src/tests/` (generated `canon/src` is quality-exempt).
- New lookup APIs, new dialect props, new join validators.

---

## Phases

Execute in order. After each phase: regenerate, `pnpm agentrs c canon`, `pnpm agentrs v canon`, `pnpm agentrs q packages/reference-rs/modules/canon`.

### 1. Honest SPEC freeze

**Files:** `SPEC.md`.

- Replace the legend with atomic's: `[x]` = named station. `[ ]` = specified, not proven. **Code in `src/` is not proof. A proof-map row that only names a function is `[ ]`.**
- Add `Audit: 2026-09-14. Strict 1:1 case-to-spec-ID alignment. Combined IDs and generator-function rows are demoted.`
- Demote the 16 rows (and FAIL-07) to `[ ]` **now**. Recount §2 to 24 / 16. The 40/40 table is a lie; do not keep it during the work.
- Add the three new cases as `[ ]`.
- State the harness: cargo `src/tests.rs` (generated) + vitest `generate/join.test.ts`. Generator validation is not a harness.

**Proof:** SPEC can be read without pretending JOIN-01 is proven.

### 2. Named cargo stations

**Files:** `generate/emitters-tests.ts`, `emitters-tests-tags.ts`, `emitters-tests-props.ts`, then `pnpm canon`.

Split every bundled `#[test]` so each SPEC ID is one function named `can_<area>_<nn>_…`. Keep the same assertions; stop sharing functions.

| ID | Function | Assert |
| :--- | :--- | :--- |
| `CAN-TAG-01` | `can_tag_01_pascal_jsx_primitives` | `Div`…`LinearGradient`: `is_reference_primitive` **and** `is_primitive_jsx_name` |
| `CAN-TAG-02` | `can_tag_02_lowercase_html_svg_tags` | `div`…`path`…`circle`: `is_html_tag` + lowercase `is_reference_primitive` |
| `CAN-TAG-03` | `can_tag_03_reserved_tag_renames` | `Obj`/`Var` jsx; `object`/`var` html |
| `CAN-TAG-04` | `can_tag_04_single_letter_tags` | `A P B I Q S U G` |
| `CAN-TAG-05` | `can_tag_05_react_svg_camel_case` | existing `clipPath` / `ClipPath` set |
| `CAN-PROP-01` | `can_prop_01_known_style_props` | webref names only (`aspectRatio`…`mixBlendMode`, `color`, `display`) |
| `CAN-PROP-02` | `can_prop_02_class_prefix_for_prop` | existing prefix + kebab fallback |
| `CAN-PROP-03` | `can_prop_03_css_declaration_property` | known + `--*` → `&str` |
| `CAN-PROP-04` | `can_prop_04_native_shorthand_longhands` | `padding`/`margin`/`border`/`background` |
| `CAN-PROP-05` | `can_prop_05_custom_property_passthrough` | `--custom-token` known **and** declaration unchanged |
| `CAN-PROP-06` | `can_prop_06_non_shorthands_none` | existing |
| `CAN-PROP-07` | `can_prop_07_color_prop_resolution` | existing color / alias / non-color |
| `CAN-ALIAS-01` | `can_alias_01_known_shorthand_aliases` | `mt pt p m bg rounded borderX c` are known style props |
| `CAN-ALIAS-02`–`05` | rename in place | same assertions |
| `CAN-ALIAS-06` | `can_alias_06_alias_to_shorthand_longhands` | today's orphan tripwire |
| `CAN-EXT-01` | `can_ext_01_macros_are_known_style_props` | `r container colorMode variant font weight` |
| `CAN-EXT-02`–`03` | rename in place | same |
| `CAN-COND-01` | `can_cond_01_breakpoint_scale` | `base`–`2xl` |
| `CAN-COND-02` | `can_cond_02_underscore_pseudos` | `_hover` `_focusVisible` `_dark` `_active` `_disabled` **and** `_notInTheTable` |
| `CAN-COND-03` | `can_cond_03_ampersand_and_at_prefixes` | `&:hover`, `& > svg`, `@media …` |
| `CAN-COND-04` | `can_cond_04_default_breakpoint_for_index` | 0–5 Some, 6/MAX None |
| `CAN-FAIL-01` | `can_fail_01_hallucinated_primitives` | Box/Flex/Grid set |
| `CAN-FAIL-02` | `can_fail_02_non_style_attributes` | DOM/React attrs **and** `foobar` |
| `CAN-FAIL-03` | `can_fail_03_bare_pseudos` | `hover` `focus` `active` are not conditions |
| `CAN-JOIN-04` | `can_join_04_slices_are_sorted` | both keys + every `ELEMENTS[i].jsx` found |
| `CAN-JOIN-08` | `can_join_08_unique_class_prefixes` | unique prefixes + collision pairs (`d`/`display`, `z`/`translateZ`, …) |

Delete `test_style_props_match`, `test_real_primitives_match`, `test_conditions_and_breakpoints`, `test_dialect_alias_for_shorthand_tripwire`. Grep for `fn test_` in emitted `tests.rs` must be empty.

**Proof:** `pnpm agentrs c canon` — one `#[test]` per cargo ID. `cargo test -p canon -- --list` names are the SPEC IDs.

### 3. Named join stations

**Files:** `generate/join.test.ts`.

Keep `cloneDialect`. Drop reliance on the bundled happy-path as proof.

Happy path (live dialect, `errors === []`):

| ID | Calls |
| :--- | :--- |
| `CAN-JOIN-01` | `validateElementsJoin` |
| `CAN-JOIN-02` | `validateDialectExtJoin` |
| `CAN-JOIN-03` | `validateShorthandsJoin` |
| `CAN-JOIN-05` | `validateAliasTargetsJoin` |
| `CAN-JOIN-06` | `validateShortPrefixesJoin` |
| `CAN-JOIN-07` | `validateColorPropsJoin` |
| `CAN-JOIN-08` | `validateClassPrefixesJoin` (already exists; rename the `it()` to the ID) |

Poison (one validator per `it()`):

| ID | Inject | Calls |
| :--- | :--- | :--- |
| `CAN-FAIL-04` | tag `foobar` | `validateElementsJoin` |
| `CAN-FAIL-05` | prop `foobarProp` | `validateDialectExtJoin` |
| `CAN-FAIL-06` | mutate `padding` longhands | `validateShorthandsJoin` |
| `CAN-FAIL-07` | alias `badAlias` → `unrecognizedTarget` | `validateAliasTargetsJoin` **only** |
| `CAN-FAIL-08` | `d.classPrefix = 'd'` | `validateClassPrefixesJoin` |
| `CAN-FAIL-09` | `dialectShortPrefixes.set('foobarProp', 'fb')` | `validateShortPrefixesJoin` |
| `CAN-FAIL-10` | `colorProperties.push('unrecognizedColor')` | `validateColorPropsJoin` |

Optional: keep `it('passes validateJoin on the live dialect')` as smoke. It is not a SPEC row.

**Proof:** `pnpm agentrs v canon` — 14 named `CAN-*` tests (7 join + 7 fail), plus optional smoke. FAIL-07 no longer mentions color.

### 4. SPEC proof map, README, skill

**Files:** `SPEC.md`, `README.md`, `.agents/skills/agent-rs/SKILL.md` (canon row only).

- Proof map: one row per ID, file is a test file, target is the station name (`can_tag_01_…` or `CAN-JOIN-01: …`). Status `[x]` only after phases 2–3 are green.
- Recount §2: **43 total, 43 proven, 0 remaining.** Named list includes ALIAS-06 and FAIL-09/10.
- Existing Suites:  cargo count = cargo stations; vitest count = join stations. Stop saying “22 tests” as a stand-in for 40 cases.
- README Verify: all four commands. One sentence: membership is `src/tests.rs`, join is `generate/join.test.ts`.
- agent-rs skill canon row: `pnpm agentrs c canon` **and** `pnpm agentrs v canon`. Generator remains `pnpm canon`.

**Proof:** grep `generate/join.ts` in SPEC proof map is empty. grep `fn test_` in `src/tests.rs` is empty.

### 5. Freeze audit (do not skip)

Walk the proof map by hand. For each ID:

1. Station exists.
2. Station name contains the ID.
3. Station is not shared.
4. Names listed in the case body are actually asserted.

Then:

```bash
rg -n "fn test_" packages/reference-rs/modules/canon/src/tests.rs
rg -n "generate/join.ts|generate.ts" packages/reference-rs/modules/canon/SPEC.md
rg -n "it\\('CAN-" packages/reference-rs/modules/canon/generate/join.test.ts
```

First two greps: empty. Third: 14 `CAN-*` its.

If any ID is still `[x]` without a station, demote it. Do not add a case.

Do not freeze SPEC against Panda residue (`borderX`, `ringColor`, `sm` as
language). If overlay lock-down ([plan-pt3.md](./plan-pt3.md)) has started,
name stations against the new overlay, not the dump.

Mark this file **Status: complete** only after the four verify commands pass and the greps are clean.

---

## Freeze rule

After status is complete:

- New dialect behavior is a new SPEC ID **and** a new named station in the same change.
- `[x]` without a station is a bug, not a status.
- Overlay content is [plan-pt3.md](./plan-pt3.md). Downstream wiring still
  lives in atomic / styletrace / typegen.
