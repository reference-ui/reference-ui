# Runtime

The browser face of the namer. Not an IR. Not a generated JavaScript
function.

`stylesheet` prints CSS. This module emits the **namer tables and
lowerings** — the closed, O(props + conditions + fonts) data both namers
read — that authored `css()` in `@reference-ui/react` constructs classes
with. One algorithm, two implementations, one gate: the compiler namer
(`stylesheet::name` + `PlanBuilder`, the oracle) and the runtime namer,
its JS mirror beside this crate (`js/namer/`, shipped as
`@reference-ui/rust/namer`), held byte-equal by the namer goldens
(`ATM-SEAM-08`) and the differential gate (`NEO-NAMER-01`).
`compile()` returns `CssRuntime` as data. The `css()` helper itself is
authored TypeScript. Do not generate a `css.js`.

```text
css({ mt: '2r', bg: isSelected ? 'n300' : 'n100' })
  → "mt_2r bg_n300"   or   "mt_2r bg_n100"
```

Open composition. The merged object never had to be compiled as a blob.

`recipe()` is the closed exception: a small variant → class table that
rides alongside this map. StyleProps on a recipe host still go through
this concatenator. There is no second helper name. The author API is
`css()` and `recipe()`.

Disk: `.reference-ui/styled/css`.

## Example (Panda)

They generated `styled-system/css/css` — a JS `css()` that looks up
spelled class names. We emit namer tables and lowerings; core authors `css()`. Recipe
runtime on their side is `artifacts/cva.rs` / `sva.rs`. Ours is authored
`recipe()`.

| File | Job |
| :--- | :--- |
| `vendor/panda/crates/pandacss_codegen/src/artifacts/css/mod.rs` | generated `css` + utility map |
| `artifacts/css_index.rs` | `css/index` barrel |
| `artifacts/conditions/mod.rs` | runtime condition helpers |
| `artifacts/cva.rs`, `sva.rs` | their recipe runtime |
| `crates/pandacss_project/src/codegen.rs` | when they emit artifacts |

**Do not lift** `artifacts/jsx/*`, `types/*`, `patterns/*`, `themes/*`.

## Must not

- Reimplement resolve in TypeScript beyond the namer mirror: no token
  tables, no rhythm, no wraps. We emit namer tables and lowerings; the
  runtime namer lives beside this crate and reproduces the namer goldens;
  do not reimplement resolve (tokens, rhythm, wraps).
- Key the map by a hash of the whole style object.
- A second algorithm. The runtime namer is a second *implementation* of
  the one algorithm, held by the goldens and the differential — never a
  second spelling.
- Generate executable `css.js`. Core authors `css()`; we emit data.

## Two integers

`schemaVersion` and `rulesVersion` coexist with different bump rules,
both checked at `registerRuntimeData` (schema must be 2, versions must
match, else it throws). Bump `schemaVersion` when the artifact *shape*
changes; bump `NAMER_RULES_VERSION` (and the tables' `rulesVersion`) when
a naming rule changes a *class*. A namer-golden re-bless after an
intentional rule change carries the bump; the freshness guard
(`namer_goldens_are_fresh`) fails stale goldens until re-blessed via
`NAMER_UPDATE_GOLDENS=1`.

## Naming rules — every place the class is not `prefix_sanitize(authored)`

Permanent home. Each rule names the Rust site the runtime namer mirrors.
Table-shaped rules travel as lowerings or keyword sets; the rest are
procedures with one golden each. Counts at landing (2026-09-20, lib):
aliases 315 · prefixes 198 · color props 71 · unrealizable 27 ·
lowerings 29 props · breakpoints verbatim with `base` first.

| # | Authored | What the class becomes | Rust site |
|---|---|---|---|
| 1 | any string value | structural whitespace runs collapse to one space, **quoted substrings verbatim**, then `_` for whitespace; collapse does not trim | `resolve/normalize.rs::collapse_whitespace`, `escape.rs::sanitize_class_value` |
| 2 | number `4`, or finite numeric string `'1e3'`, `'.5'`, `'01'` on a non-color prop | stem is the canonical number via the `f64` fence + render: magnitudes outside `[1e-6, 1e21)` refuse as `NonCanonicalNumeric`; `0`/`-0` → `0`; hex/radix/`Infinity`/`NaN` refuse; bare numbers re-render through the same fence (never verbatim). CSS gets `px` on dimensional props but **the class does not** | `resolve/unit.rs` (`canonical_numeric_string`, `resolve_numeric_value`, `from_number`, `accepts_bare_number`) |
| 3 | numeric string on a **color** prop or `font`/`fontFamily` | stays a string (`c_.5`, `c_-0` with no `0` fold) — except leading-zero, radix, and non-finite spellings, which refuse on every prop | `unit.rs::accepts_bare_number`, `legacy_string_value` |
| 4 | `{ $token: { path, value } }` | class uses `path` | `values.rs::t_object_to_atom_value`, `AtomValue::class_name_str` |
| 5 | `{ $r: 2 }` | `2r`; near-integers collapse under a 1e-6 epsilon, the `i64` cast saturates, non-JSON-number `$r` renders JSON-encoded (quotes included) | `values.rs::r_object_to_atom_value`, `lexical.rs::collapse_r_number` |
| 6 | `'…!'` / `'… !important'` | marker stripped from the stem, `!` appended after sanitize; a bang inside quotes never marks importance | `css.ts::splitImportant`, `name/mod.rs` |
| 7 | `padding` / `margin` / `inset` with 2–4 space tokens (paren-depth aware) | four longhands `pt_ pr_ pb_ pl_`; the gate is the three-prop allowlist plus the 2–4 window — 0, 1, and 5+ tokens stay the shorthand class, as do CSS-wide keywords and props like `borderWidth` outside the allowlist | `shorthands/mod.rs` (`is_dimensional_trbl`), `shorthands/dimensional.rs`, `parser.rs::split_tokens` |
| 8 | `borderBottom: '3px solid red'`, `outline: '…'` | width / style / color longhands by token class: style keywords first (stored **lowercased**), then length-width incl. `thin`/`medium`/`thick`/math fns/`Nr`/`1/3r`, else color (width and color stored **raw**); first of each kind wins, extras dropped never re-fallthrough; `'none'` is case-sensitive (`'None'` classifies as a style); the zero gate is exactly `0`, `0px`, `0rem`, `0em`, `0%` → width `0px`; `outline` is `canon == "outline"` only (style set per prop); the whole-test lowercases but stores the original; `border: 0` → `bd-w_0px`; `border: 'none'`/`inherit`/`var()`/`borders.*` stays whole; **`outline: 'none'` → `outline: '2px solid transparent'` + `outlineOffset: 2px`** | `shorthands/border.rs`, `parser.rs` |
| 9 | six radius pairs `borderTopRadius` … | two corner longhands, same value | `shorthands/pair.rs` |
| 10 | `flex: '1'` / `'auto'` / `'initial'` / `'none'` | **value rewritten**: `flex_1_1_0%`, `flex_1_1_auto`, `flex_0_1_auto`, `flex_none`; exact, case-sensitive, trim-tolerant; JSON number `1` rewrites too | `shorthands/flex.rs` |
| 11 | `size` | `width` + `height` | `resolve/size.rs` |
| 12 | `container` | `containerType: inline-size`, plus `containerName <rendered>` unless the `class_name_str` rendering is empty or `"true"` — so `true`, `"true"`, and `""` stamp the type alone, while `false`, `null`, `0` stamp the name too; guard order bool → empty → eq-`"true"` → default | `resolve/container.rs` |
| 13 | `textGradient` | `backgroundImage` + `webkitBackgroundClip: text` + `color: transparent` | `resolve/gradient.rs` |
| 14 | `border: true` | `borderWidth: 1px` + `borderStyle: solid` (bool-`true` only; `false` refuses) | `resolve/mod.rs::lower_macro` |
| 15 | `font: 'sans'` | `fontFamily: sans` + `fontWeight: <scale default or 400>` + every `css` extra on the definition — **system data**; extras ordered, later keys overwrite keeping first-insertion position | `resolve/font/family.rs` |
| 16 | `weight: 'bold'` / `'sans.bold'` / `'393'` | `fontWeight` via scoped scale (`split_once('.')`), else the 6 keyword pairs (`thin`…`black`), else as-is | `resolve/font/weight.rs` |
| 17 | `variant`, `colorMode` | zero declarations, any value (arrays/objects drop member-wise) | `resolve/mod.rs::is_runtime_owned` |
| 18 | responsive array `['1r', null, '3r']` | index → breakpoint name pushed on `when`; `null` skips; beyond-scale skips silently; slot gets `@bp` (`base` member included) | `builder.rs::resolve_array`, `BreakpointScale::breakpoint_for_index` |
| 19 | per-prop object `width: { base, md, _hover }` | breakpoint keys → `@bp` slot + condition; other keys → nested `when` in the slot; whole object carries one `important` | `builder.rs::resolve_object`, `css.ts::cleanResponsiveObject` |
| 20 | `r: { 300: {…} }` | anonymous numeric keys are lowered in JS to `@container (min-width: …)` keys before lookup; named forms (`card/md`, `md@card`) drop through the generic path with no class | `lowerResponsiveStyles.ts` (anonymous numeric only), `resolve/r/query.rs` |
| 21 | `--*` custom props | prefix = the prop **verbatim** (never kebabized: `--brandX` stays `--brandX`); unitless; bare numbers canonicalize; token unique-name lookup is sheet-side only | `canon::class_prefix_for_prop` fallback, `canon::is_unitless_prop` |

Prefix fallback order: table hit → `--*` verbatim → `kebab(canonical)`.
The table holds exactly `prefix ≠ kebab(canonical)` (198 entries,
including five `ms-` props that break kebab-purity); the fallback is
camelCase→kebab with a leading dash for vendor-prefixed names
(`tables.rs::kebab_case`, pinned by `every_canon_prefix_resolves_through_table_or_kebab`).

The 27 unrealizable extensions (`truncate`, `spaceX`, `translateX`,
…) ship as `keywords.unrealizable` and refuse; the interpreter checks
lowerings before the set, mirroring `expand_or_passthrough`
(`textGradient` stays claimed). No alias may target a macro or
runtime-owned prop (guard test); lowering keys are canonical.

Refusal granularity is per-declaration after lowering: `border: 'NaN
solid red'` drops the width but keeps style+color; `container: ' '`
keeps `containerType` while the name refuses.

### Conditions → class segment

`resolve/conditions/mod.rs::lower_when` in order; the runtime namer
mirrors the order, the prefix-match at-rules (`@mediafoo` is known), the
case-sensitive everything except range-name matching, and the
spaces-only bracket join.

| Authored `when` entry | Segment | Known-set needed? |
|---|---|---|
| `base` | skipped | no |
| `_hover`, `_osDark`, system condition key | key without `_` | **yes** — unknown keys drop the whole want; the runtime namer refuses identically |
| scale name `md`; ranges `mdDown`, `mdOnly`, `smToLg` | the raw name | **yes** — scale names |
| `@media …` / `@container …` / `@supports …` | `[` + trimmed query with spaces → `_` + `]`; bare `@supports` refused on both sides | no |
| `&…`, other `@…`, or a `&`-bearing selector | same bracket form (tabs/newlines survive byte-exact) | no |

### Slot

`derive_slot(prop, when, bp)` over the raw `decl.when` (no `base`-skip,
no lowering): one `_` stripped per entry, joined by `:`, suffixed `@bp`
for responsive members. `splitSlot` / `evictFamilyLosers` /
`isCoveredByImportant` consume the constructed pairs unchanged.

## Lexical functions and builtin divergences

The class stem passes only through six explicit functions —
`src/resolve/lexical.rs` on the compiler side,
`js/namer/lexical.ts` on the runtime side — never a `std` or builtin
default. One golden per function (`tests/namer-goldens/01–06`), plus a
compiled case per divergence (`ATM-NAME-08`).

- **L1 `is_structural_whitespace`** — the 25-point Rust `White_Space`
  set (U+0009–000D, U+0020, U+0085, U+00A0, U+1680, U+2000–200A,
  U+2028, U+2029, U+202F, U+205F, U+3000). No U+FEFF.
- **L2 `trim_structural`** — strip L1 from both ends. Identical to
  `str::trim` by construction.
- **L3 `parse_decimal`** — one explicit grammar (optional sign, then
  ASCII `inf`/`infinity`/`nan` or a decimal mantissa with optional
  exponent; no underscores, no radix, callers trim first) with **two
  entries**: the ungated parse (border-width classifier: `inf`
  classifies) and `.finite()` (unit site: non-finite refuses).
- **L4 `render_decimal`** — shortest round-trip, never exponent, `-0`
  → `0`. Callers fence first with `in_canonical_magnitude` (zero
  mints; `1e-6 <= |v| < 1e21` renders; else refuses upstream), and
  `$r` renders through the `collapse_r_number` wrapper (1e-6
  near-integer collapse, saturating `i64`, fenced).
- **L5 `ascii_lower`** — ASCII-only fold. Non-ASCII passes through
  unfolded; one site (border style) stores the fold.
- **L6 `sanitize_value`** — map exactly space, tab, newline to `_`;
  everything else (`\r`, NBSP, U+0085 inside quotes) survives.

| Rust call in the class path | JS a port reaches for | Where they disagree | The mirror does |
|---|---|---|---|
| `str::parse::<f64>` + finite gate (`unit.rs`) | `Number(s)` | JS takes `0x10`/`0b1`/`0o7`/`""`/`"  "`; Rust takes any-case `inf`/`nan`, rejects hex/empty/underscores/untrimmed | L3 `parse_decimal` + `.finite()`; never bare `Number()` |
| `is_valid_numeric_str` (`parser.rs`, no finite gate) | same `Number()` or reusing L3 | `inf`/`nan` classify as border *widths* here but refuse at the unit site — two behaviors, two golden entries | L3 ungated entry |
| `f64::to_string` (`unit.rs`, `$r`) | `String(n)` | exponent form at `|n| ≥ 1e21` and `0 < |n| < 1e-6`; `-0` renders `"-0"` vs `"0"` | L4 fence + `render_decimal` on both sides |
| `serde_json::Number::to_string` (plan-JSON path) | `String(n)` on the JS number | same exponent gap via the scalar path; bare stems re-render, never verbatim | L4 covers this row too |
| `f as i64` (`$r` collapse) | `Math.round`/`Math.trunc` | saturating cast (`1e21` → `i64::MAX`); JS has no saturating op | L4 wrapper clamps explicitly |
| `char::is_whitespace` (`normalize.rs`) | `/\s/` | sets differ on exactly U+0085 (Rust yes) and U+FEFF (JS yes) | L1 explicit set |
| `str::trim` (every pre-trim site) | `String#trim()` | same two code points | L2 (= trim with L1) |
| `sanitize_class_value` 3-char map (`escape.rs`) | `.replace(/\s/g, '_')` | `\r` and NBSP survive in Rust, notably inside quotes | L6 three-character map |
| `to_ascii_lowercase` / `eq_ignore_ascii_case` | `.toLowerCase()` | non-ASCII (`İ`, `ẞ`, final sigma) | L5 ASCII-only fold |
| `serde_json::Map` iteration (`builder.rs`) | `Object.entries` order assumed | agrees only via explicit `preserve_order` in `atomic/Cargo.toml` | insertion order both sides |
| `IndexMap` (`font/family.rs` extras) | object spread / key order | agrees only via ordered pairs + insert-ordered map with overwrite-keeps-position | `fonts[].css` pairs; interpreter uses `Map` |
| quote machines ×2 | one shared "quote-aware" helper | collapse is alternation-only with **no escapes**; `has_parent_reference` has backslash escapes + independent quote flags — different inputs, different outputs | **do not unify**: two goldens |

Boundary: extract/fold numerics, `r` query lowering, token/rhythm
resolution, wraps, and selector escaping are not inherited by the
namer. Resolution is sheet-side — but **refusal is
membership-affecting**: an unknown token path drops its declaration
(`ATM-TOKEN-12`, `ATM-E-UNKNOWN-TOKEN`), so the differential gate
carves exactly braced-plus-absent extras: a namer-side surplus is
allowed only when its stem is braced (`{…}`) and its class is absent
from the emitted sheet.
