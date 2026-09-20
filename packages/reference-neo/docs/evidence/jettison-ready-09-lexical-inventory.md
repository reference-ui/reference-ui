# Jettison READY ask 9 — Lexical inventory (D8)

Every text/number/container behavior in the mirrored chain whose semantics the
runtime namer would inherit, with the JS default it must not use. Scope:
`resolve_want_with` → `class_name_with_system` + `PlanBuilder` shaping (the
mirrored chain). Extract/fold, token/rhythm sheet bodies, wraps, and the
deleted lookup-key path are excluded — stated per row where the boundary bites.
Float/whitespace/case claims verified by probes in `/tmp/jettison-probe/`
(`parse.rs`, `num.js`, `ws.rs`; rustc 1.94.1, node v24.16.0).

## Verdict

The §9 table's 8 rows are all real and confirmed, but it is **not complete**:
+4 rows, 2 corrections. The lexical function list grows **five → six**
(`sanitize_value` was missing). The two float-parse sites are *different
behaviors*, not one.

## Divergence table (brief's 8 + 4 new)

| # | Rust site | JS default NOT to use | Confirmed divergence (probed) | Lexical fn |
|---|---|---|---|---|
| 1 | `str::parse::<f64>` + `is_finite` (`unit.rs:26`) | `Number(s)` | `Number` takes `0x10`/`0b1`/`0o7`/`""`/`"  "`→0, only exact `"Infinity"`; Rust takes `inf`/`nan` any-case, rejects hex/empty/underscores, rejects untrimmed | L3 parse |
| 2 | `is_valid_numeric_str` (`parser.rs:194`, strip-one-sign + parse, **no finite gate**) | same `Number()` or reusing L3 | `inf`/`nan`/`INFINITY` classify as border *widths* here but are refused/strings at L3's site — two behaviors, two goldens | L3 parse (ungated entry) |
| 3 | `f64::to_string` / `format!("{f}")` (`unit.rs:30`, `builder.rs:81`) | `String(n)` | exponent form at `\|n\| ≥ 1e21`, `0 < \|n\| < 1e-6`; Rust `-0`→`"-0"` vs JS `"0"`; Rust never emits exponents (5e-324 → 700+ chars, probed) | L4 render |
| 4 | `serde_json::Number::to_string` (`builder.rs:100`) — **NEW ROW** | `String(n)` on the JS number | same exponent gap as row 3 via the plan-JSON path; both producers are shortest-round-trip-plain, so one `render_decimal` covers rows 3+4 (ask 2 owns the spelling) | L4 render |
| 5 | `f as i64` (`builder.rs:79`, `ast_value.rs:34` extract-side) — **NEW ROW** | `Math.round`/`Math.trunc`/`as unknown as number` | saturating cast: `1e21 → 9223372036854775807` (probed); JS has no saturating op — mirror clamps explicitly; golden pins `±2^63` boundaries | L4 wrapper (`collapse_r_number`, 1e-6) |
| 6 | `char::is_whitespace` (`normalize.rs:59`) | `/\s/` | sets differ on exactly U+0085 (Rust yes) and U+FEFF (JS yes) — full 28-point sweep probed | L1 set |
| 7 | `str::trim` (unit/border/dimensional/flex/bracket/bare-query/r-key sites) | `String#trim()` | same two code points (U+0085 kept by JS, U+FEFF stripped by JS; probed) | L2 trim (= trim with L1) |
| 8 | `sanitize_class_value` 3-char map (`escape.rs:11`) | `.replace(/\s/g,'_')` | `\r`, NBSP, U+0085 etc. survive Rust (notably inside quotes where collapse left them); only ` ` `\t` `\n` map | **L6 sanitize (new fn)** |
| 9 | `to_ascii_lowercase` / `eq_ignore_ascii_case` (parser, border, conditions, important-marker) | `.toLowerCase()`/`.toUpperCase()` | `İ`→`i̇`, `ß`→`SS`, final-sigma (probed); note one site *stores* the fold (border style) — output-affecting, not just compare | L5 fold |
| 10 | `serde_json::Map` iteration (`builder.rs:288`) | `Object.entries` order assumed | agrees only via `preserve_order` unification (ask 10's crew); namer side is insertion order | config, not a fn |
| 11 | `IndexMap` (`font/family.rs`, `def.css`) | object spread / `Object.keys` | agrees iff tables carry ordered pairs AND the interpreter uses insert-ordered `Map` with overwrite-keeps-position (JS `Map.set` matches; note it, don't assume) | config + interpreter note |
| 12 | quote machines ×2 — **NEW ROW (must-not-unify)** | one shared "quote-aware" helper | P1 collapse: alternation-only, **no escapes** (`normalize.rs:38`); `has_parent_reference`: backslash escapes + independent quote flags (`pseudoselectors/mod.rs:19`). Different inputs → different outputs; two goldens | P1 / P7 detail |

Corrections to the brief's table:

- **C-A.** Row "`str::parse::<f64>` (`unit.rs`, `parser.rs::is_valid_numeric_str`)"
  lumps two behaviors: unit gates on `is_finite`, parser does not (row 2
  above: `border: 'inf solid red'` keeps width `inf`). Also the brief's
  "rejects all the JS forms" needs the full grammar (§L3 below): Rust accepts
  `inf`/`infinity`/`nan` in **any case** (probed: `INF`, `INFINITY`, `NAN`
  all `Ok`), rejects underscores (probed — `from_str` takes no `_`), rejects
  untrimmed input at both sites (both trim/strip first).
- **C-B.** The five-function list omits sanitize. `sanitize_class_value` is an
  explicit Rust fn with a divergence row but no entry in
  `resolve/lexical.rs`'s five (`is_structural_whitespace`, `trim_structural`,
  `parse_finite_decimal`, `render_decimal`, `ascii_lower`). Six functions.

## The fixed lexical list (six)

- **L1 `is_structural_whitespace`** — the 25-point Rust `White_Space` set:
  U+0009–000D, U+0020, U+0085, U+00A0, U+1680, U+2000–200A, U+2028, U+2029,
  U+202F, U+205F, U+3000. Callers: P1 collapse. (Exclude U+FEFF, U+180E, U+200B —
  all probed `false` in Rust.)
- **L2 `trim_structural`** — strip L1 from both ends. Callers: numeric
  pre-trim, empty-string check, border/dimensional/flex pre-trims, bracket
  segment, bare-query rest, r-key width lookup. Rust `trim` ⟺ L1 by
  definition; do not use `String#trim`.
- **L3 `parse_decimal`** — explicit grammar (no `Number()`, no bare
  `parse::<f64>` on the Rust side after Slice 1): optional `[+-]`, then
  `inf`/`infinity`/`nan` (ASCII case-insensitive) **or** decimal mantissa
  (`digits[.digits]` | `.digits`, no underscores) with optional
  `[eE][+-]?digits`. Two entries: `parse_finite_decimal` (unit site: reject
  non-finite) and the ungated check (parser site). Golden rows must include:
  `0x10`, `""`, `"  "`, `inf`/`INF`/`nan` (each: finite-site refuses,
  parser-site accepts), `01`→finite, `5.`→finite, `1_0`→reject,
  `1e`/`e5`/`+`→reject.
- **L4 `render_decimal`** — shortest round-trip, never exponent (ask 2 fixes
  the boundary policy incl. the refuse-outside-`[1e-6, 1e21)` recommendation;
  note it *changes* Rust for sub-1e-6 magnitudes, which today expand to full
  decimals). Callers: numeric stems (unit), serde-Number spellings (builder
  scalar), `$r` fractional rendering. Plus **`collapse_r_number`** wrapper:
  `|f − round(f)| < 1e-6` → saturating i64 render (clamp ±2⁶³ in JS), else
  `render_decimal` (probed: epsilon genuinely differs from plan-capture's
  1e-9 at e.g. 2.0000005 — pin 1e-6 exactly; rounding-mode difference
  Rust-half-away vs `Math.round`-half-up is unreachable inside the epsilon).
  Non-JSON-number `$r` values render via JSON `to_string` (strings keep
  quotes!) — pin one golden row (`{"$r":"2"}` → `"2"r`).
- **L5 `ascii_lower`** — ASCII-only fold (+ compare helper). Callers: border/
  outline/global/length classification, `is_whole_value`, range-name matching,
  important-marker test. Golden must pin the *stored* fold (`'SOLID'` →
  style `'solid'`) and non-folds (`İ`, `ẞ`, `σ/Σ/ς`).
- **L6 `sanitize_value`** (new) — map exactly ` `, `\t`, `\n` → `_`, identity
  else. Callers: value stems in the join. Golden pins `\r`/NBSP/U+0085
  survival and the tab-inside-brackets byte-exact case (P7 segments are NOT
  sanitized — only values are).

## Explicitly ASCII-safe (no new function; mirror with char codes, pin one row each)

`is_ascii_digit`/`is_ascii_alphanumeric`/`is_ascii_alphabetic`
(`escape.rs`, `unit.rs:66`, token/opacity checks), `eq_ignore_ascii_case`,
`strip_prefix/suffix`, `starts_with` (incl. the `@mediafoo` prefix-match),
one-`_` strip (`strip_prefix('_')` — strip exactly one, not a run),
`split_once('.')` (weight scope) / `split_once("To")` (ranges, case-sensitive
split with case-insensitive match), `{max_px:.2}` (wrap-only, sheet side).

## Ordering inventory (beyond the brief's two rows)

| Order-sensitive site | Rule for the mirror |
|---|---|
| `resolve_object` member order (`builder.rs:288`, `preserve_order`) | JS `Object.entries` insertion order; ask 10 pins the feature |
| `def.css` extras order (`font/family.rs:33`) | `fonts[].css` ordered pairs + `Map` (overwrite keeps position) |
| `lower_font` pair order (family → weight → extras) | fixed interpreter order (§ask-8 rule 8) |
| lowering step order per prop | array order, first match (ask 8) |
| emitted declaration order (trio W→S→C, trbl, ring+offset, border-macro) | fixed per shape; differential compares in order (R3) |
| `HashSet seen_keys` (`builder.rs:178`) | membership only, never iterated — no order semantics |
| `ConditionMap` lookup | `get()` only in class path — hash order irrelevant |
| `BTreeMap` (serializer, `CONTAINER…` n/a) | sorted-deterministic; serializer dies with the map |

## Boundary statements (what the namer does NOT inherit)

- Extract/fold numerics (`push_number_want`, `convert_literal` + its 1e-9
  epsilon, `fold_*` arithmetic, `number_atom_to_json` i64-preference): the
  differential feeds the namer plan-JSON values, never re-folds. Note for
  NEO-NAMER-01's harness: plan JSON numbers `> 2^53` cannot all round-trip
  through JS numbers — in practice unreachable (all plan numbers derive from
  f64 literals), but the harness owns that assumption, not the namer.
- `resolve/r/query.rs`, `lowerResponsiveStyles`, `walk_r_object`: whens arrive
  pre-lowered (rule 20); the namer only brackets them (P7).
- Token/rhythm resolution, wraps, `escape_css_selector`, `{:.2}` formatting:
  sheet-body only; classes carry authored spellings/paths.
- `serialize_lookup_key` / canonical-JSON parity (`String(val)` vs serde in
  `plans.ts`): deleted with the map. (Its `1e21`→`"1e+21"`-vs-`"1e21"` gap
  vanishes; do not reintroduce number rendering anywhere except L4.)
