# Jettison READY ask 8 — Rules-to-data audit (D7)

For each §3 rule: data or procedure. Fixes the exact `LowerStep` shape, the
guard set, interpreter semantics, and the three `NamerTables` corrections
(fonts weights, breakpoints with base, prefixes criterion). Assumes ask-1
findings F1–F6 (cited as `A1/Fn`).

## Verdict

D7 holds with a larger step/guard vocabulary than the §5 sketch: **8 step
variants, 6 guards**. Procedures stay **9** — the §9 list survives with two
scope corrections (P3 splits caller-side; P9 drops build-dedupe). `container`,
`outline: none`, and `border` (trio vs `true` macro) are all expressible as
guarded steps — exact step lists below.

## Rule → data/procedure map

| §3 rule | Data (lowerings / keywords) | Procedure |
|---|---|---|
| 1 whitespace collapse | — | P1 |
| 2/3 numeric canon + color exemption | `colorProps` (+ baked `font`/`fontFamily`, see C4) | P2 |
| 4 `$token`→path | — (value-form match) | P9 |
| 5 `$r`→`Nr` | — | P9 + P2 renderer + 1e-6 collapse |
| 6 `!` strip / re-append | — | P3 (caller-side split; join appends) |
| 7 dimensional | `{longhands ×4, shape:'trbl'}` for allowlist only | P4 tokenize + count/key gate in interpreter |
| 8 border trio | ordered steps (§"Exact step lists") + `keywords.{borderStyle,outlineStyle,lineWidth,lengthUnits,mathFns,cssWide,zeroBorder}` | P4 + P5 + P6 (gates) |
| 9 radius pairs | `{longhands ×2, shape:'pair'}` for the 6 only | — (interpreter clone) |
| 10 flex | `{rewrite: {1,auto,initial,none}}` | trim (lexical) + exact match in interpreter |
| 11 size | `{emit:[[width,'$'],[height,'$']]}` | — |
| 12 container | 4 ordered guarded emits (§"Exact") | `$` = `class_name_str` (lexical render) |
| 13 textGradient | `{emit:[[backgroundImage,'$'],[webkitBackgroundClip,'text'],[color,'transparent']]}` | — |
| 14 `border:true` | `{on:'bool:true', emit:[[borderWidth,'1px'],[borderStyle,'solid']]}` ordered before trio steps | — |
| 15 font | `fonts` table + `{macro:'font'}` | interpreter shape (default-weight chain + ordered extras) |
| 16 weight | `fonts` weights + `weightKeywords` pairs + `{macro:'weight'}` | interpreter chain (scoped → keyword → raw) |
| 17 runtime-owned | `{drop:true}` entries for `variant`, `colorMode` | — |
| 18/19 arrays / per-prop objects | `breakpoints` (+ hardcoded `'base'`), `conditions` | P9 shaping + P7 per-key lower |
| 20 `r` form | — | caller-side (`lowerResponsiveStyles`, numeric-only per A1/F5); namer sees `@container` whens or drops via generic path |
| 21 `--*` (A1/F1) | — (generic path + verbatim-prefix fallback) | — |
| unrealized (A1/F6) | `keywords.unrealizable` (recommended) or D4 construct-otherwise | lowerings-first ordering |

Count check against the brief's "~13 of 20 table-shaped": data-carrying rules
are 2/3, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18/19 (tables) = 13 of 21
with rule 21 generic. Holds.

## Fixed shapes

```ts
interface NamerTables {
  rulesVersion: number
  aliases: Record<string, string>            // 315, sorted keys
  prefixes: Record<string, string>           // 198: prefix ≠ kebab(canonical); fallback §C3
  lowerings: Record<string, LowerStep[]>      // canonical → ordered steps; absent = identity
  keywords: Record<string, string[]>          // borderStyle, outlineStyle, lineWidth,
                                             // lengthUnits, mathFns, cssWide, zeroBorder,
                                             // unrealizable (A1/F6)
  weightKeywords: [string, string][]          // 6 pairs (thin…black) — §C1
  colorProps: string[]                        // 71
  breakpoints: string[]                       // scale names VERBATIM incl 'base' — §C2
  conditions: string[]                        // system keys (one '_' stripped) ∪ 12 presets
  fonts: Record<string, { weight: string; weights: Record<string, string>; css: [string, string][] }>  // §C1
}

type LowerStep =
  | { on?: Guard; longhands: [string, string, string, string]; shape: 'trbl' }
  | { on?: Guard; longhands: [string, string, string]; shape: 'trio'; style: 'border' | 'outline' }
  | { on?: Guard; longhands: [string, string]; shape: 'pair' }
  | { on?: Guard; rewrite: Record<string, string> }
  | { on?: Guard; emit: [string, string | '$'][] }
  | { on?: Guard; macro: 'font' | 'weight' }
  | { on?: Guard; keep: true }
  | { drop: true }

type Guard =
  | 'bool:true'     // value is boolean true
  | 'empty'         // class_name_str(value) === ''
  | 'whole'         // P6 border-family whole predicate: exact 'none' | css-wide (ci)
                    // | var(...) | borders./outlines. prefixes (on trimmed, lowercased-for-test value)
  | { eq: string }  // trimmed rendered === s (case-sensitive)
  | { in: string }  // trimmed rendered ∈ keywords[s] (case-sensitive)
```

Changes vs the §5 sketch, each forced by code:

1. **trio carries `style`** — `is_outline` is `canon == "outline"` only (A1/F3.5);
   without it a vendor outline trio would wrongly admit `auto`.
2. **`outline: 'none'` is an `emit`, not a `rewrite`** — it produces *two*
   declarations with literal values; `rewrite` maps one value to one value.
3. **`{eq}` / `{in}` replace draft `'keyword'`/`'string'`** — the draft guards
   are unusable: `'keyword'` never fires (css-wide is consulted implicitly by
   trbl-match and inside `'whole'`), and `'string'` is undefined (which
   strings? trimmed?). `{eq:'none'}` and `{in:'zeroBorder'}` say what
   `border.rs` does.
4. **`{macro:'font'|'weight'}`** — per-system lookups (weight chain, scoped
   map, ordered extras) are not static emits.
5. **`{keep:true}`** — identity-*terminate* (vs absent lowering = identity by
   default). Needed so `whole`-matched border values stop before the trio step.
6. **`weightKeywords` is pairs**, not `string[]` — it cannot live in `keywords`.

## Interpreter semantics (normative)

1. Canonicalize the prop (aliases table). Look up `lowerings[canonical]` —
   then `keywords.unrealizable` (A1/F6 order: lowerings first, mirroring
   `expand_or_passthrough`; `textGradient` stays claimed). Neither → identity.
2. Guards evaluate on the `class_name_str` rendering: String identity,
   Number spelling, Token → path, `true`/`false`, Null → `"null"`.
3. Value-kind rule: `pair`/`emit`/`macro`/`keep`/`drop` apply to **all** kinds;
   `trbl`/`trio`/`rewrite` apply to String/Number only (mirroring
   `extract_raw_val`). A Token/Bool/Null reaching a `trbl`/`trio`/`rewrite`
   step terminates to identity — later steps are **not** tried (so
   `border: {$token}` stays whole and `border: false` reaches the unit-stage
   refusal, matching `expand_shorthand`'s `?`).
4. `trbl` matches iff `split_tokens(trimmed)` count is 2–4 **and** the value is
   not css-wide; else identity-terminate. Mapping is the fixed index table
   `[[0,0,0,0],[0,1,0,1],[0,1,2,1],[0,1,2,3]]` (brief §9 — confirmed in
   `dimensional.rs:57`; index 0 unused via production path, A1/F2).
5. `trio` matches when reached: `split_tokens` → classify (style-lowercased,
   width/color raw, first-wins, extras dropped) → build. Empty token list →
   identity (then unit-stage empty-refusal).
6. `rewrite` matches iff trimmed rendered ∈ map (case-sensitive); else
   identity-terminate. JSON numbers render first (`flex: 1` rewrites, confirmed
   in `flex.rs` via `extract_raw_val`).
7. `'$'` substitutes the **rendered string** (§2). The Token-vs-String
   distinction at `$` positions (size/textGradient clone, container/font
   stringify) is sheet-only: both spell the class from the path.
8. `macro:'font'`: `name = render(value)`; emit `fontFamily name`; on
   `fonts[name]` hit append `fontWeight` (`css.fontWeight` > `weights.normal`
   > `'400'`) then `css` extras in order, later keys overwriting earlier with
   **first-insertion position kept** (IndexMap semantics — implement with
   `Map`). Unknown name → family only.
9. `macro:'weight'`: `split_once('.')` scoped lookup in `fonts` →
   `weightKeywords` (exact) → raw; emit `fontWeight`.
10. Post-lowering, each declaration runs the value pipeline independently:
    P1 collapse (strings) → P2 numeric → per-declaration refusal (D4 free set;
    R4 construct-otherwise) → prefix + sanitize + P7 segments + `!`.
    Refusal granularity is per-declaration (A1/F4).

## Exact step lists (the three brief-named cases)

`container` (`containerType` = `CT`, `containerName` = `CN`):
```ts
[
  { on: 'bool:true', emit: [[CT, 'inline-size']] },
  { on: 'empty',     emit: [[CT, 'inline-size']] },
  { on: { eq: 'true' }, emit: [[CT, 'inline-size']] },
  { emit: [[CT, 'inline-size'], [CN, '$']] },
]
// Bool(false)/Null/Number fall to default with rendered '$' ("false"/"null"/spelling) — A1/F4.
```

`outline` (trio family; `W/S/C` = width/style/color longhands):
```ts
[
  { on: { in: 'zeroBorder' }, emit: [[W, '0px']] },
  { on: { eq: 'none' }, emit: [['outline', '2px solid transparent'], ['outlineOffset', '2px']] },
  { on: 'whole', keep: true },
  { longhands: [W, S, C], shape: 'trio', style: 'outline' },
]
```

`border` (+ every canon trio with `style:'border'`; `border:true` macro first):
```ts
[
  { on: 'bool:true', emit: [['borderWidth', '1px'], ['borderStyle', 'solid']] },
  { on: { in: 'zeroBorder' }, emit: [[W, '0px']] },
  { on: 'whole', keep: true },
  { longhands: [W, S, C], shape: 'trio', style: 'border' },
]
// 'None' (capital) misses {eq} and 'whole', reaches trio → style 'none' — A1/F3.1. ✓
```

Step order mirrors `border.rs:48` (zero → outline-none → none/whole → split)
and `resolve/mod.rs:163` (macro → shorthand). Guard evaluation order within a
step list is array order, first match runs.

## Table-emission corrections (for `runtime/tables.rs`, Slice 1)

- **C1 — `fonts` needs the weights map.** The §5 shape
  `{weight, css}` cannot serve rule 16 (`scoped_weight` reads
  `fonts[family].weights[w]`). Fixed shape above adds
  `weights: Record<string,string>`. `weight` stays precomputed
  (`css.fontWeight ?? weights.normal ?? '400'`).
- **C2 — ship `breakpoints` verbatim, *with* `base`.** The brief's "excl. base"
  forces the interpreter to special-case index 0 and diverges on degenerate
  scales (`from_named_widths([("base","0")])` has `names == ["base"]`, table
  `[]`, index 0 → `undefined` in JS vs `"base"` in Rust). Verbatim names cost
  6 bytes and make `breakpoint_for_index` a direct index. The *responsive
  check* (`key == "base" || names.contains`) still hardcodes `'base'`,
  mirroring `builder.rs:308` — that special case is real, in both.
- **C3 — `prefixes` criterion must be `prefix ≠ kebab(canonical)`, 198
  entries.** `prefix ≠ css` (193) is unshippable: the namer cannot recompute
  css names (5 `ms-` props break kebab-purity: `msScrollLimitXMax` →
  `-ms-scroll-limit-xmax`, etc. — measured). With the kebab criterion the 5
  land in the table and the fallback is a pure function: camelCase→kebab with
  leading dash for `moz-`/`webkit-`/`ms-` (verified pure on all 1073).
  Fallback order: table → `--*` verbatim (A1/F1: `--brandX` must not kebabize)
  → `kebab(canonical)`.
- **C4 — `colorProps` vs `font`/`fontFamily`.** `accepts_bare_number` excludes
  two non-color literals. Either bake them into the JS predicate (comment +
  golden) or extend the shipped list; recommend bake (2 stable literals).
- **C5 — lowering keys are canonical; generation must mirror Rust's *gates*,
  not canon lengths.** trbl entries only for `padding`/`margin`/`inset`
  (not every len-4); trio entries only where `is_border_family` holds
  (excludes `flex`/`columns`/`lineClamp`/`caret` len-3s — RS-39); pair entries
  only for the 6 `is_radius_pair` names (not every len-2). And `container`'s
  emit order (`containerType` first) comes from `container.rs`, **not** from
  `CONTAINER_LONGHANDS` (`[containerName, containerType]`) — generating from
  canon longhands would flip declaration order and fail the differential.
- **C6 — `conditions`:** strip at most one leading `_` from each system key,
  union preset names; lookup strips one `_` then tests membership (exact,
  case-sensitive — matches the dual-key `ConditionMap` on all four
  spelling combinations, verified by reading `condition_map.rs:100`).

## Procedures: 9 confirmed, two scope corrections

P1 collapse · P2 numeric parse+render · P3 important · P4 token split ·
P5 border classify · P6 whole-value gates · P7 when→segment · P8 slot ·
P9 shaping. Corrections:

- **P3 lives in two places**: the `!`/`!important` *split* is caller-side
  (plan capture + `css.ts collectEntries`, both pre-split before `name()`),
  the `!` *append* is in the join. Its golden pins split-parity across the
  three split sites (`literal.rs`, `ast_value.rs`, `css.ts`) — they agree
  today, including the `len > 1` single-`'!'` rule.
- **P9 excludes `build()`-dedupe.** `serialize_lookup_key` dedupe happens once
  per compile in `PlanBuilder::build`; `css()` has no dedupe (merge handles
  collisions) and the differential calls `name()` per declaration. Listing
  dedupe under P9 would put deleted code (lookup keys die with the map) in the
  namer. P9 = arrays + per-prop objects + `$token`/`$r` value forms + silent
  skips (beyond-scale indices, non-scalar members, malformed `$token`).
- P7 must mirror: order (system → preset → breakpoint → range → at-rule),
  prefix-match at-rules (`@mediafoo` is Known — `starts_with`, no word
  boundary), case-sensitive everything except range-name matching
  (`eq_ignore_ascii_case`, segment keeps raw case), `[\]{trimmed, spaces→`_`}\``
  with **spaces only** (tabs/newlines survive into the segment — byte-exact
  garbage, mirrored), bare-query refusal, and the quote+escape-aware
  `has_parent_reference` machine (distinct from P1's alternation-only machine
  — ask 9: do not unify).
- P8 must mirror: raw `decl.when` (no `base`-skip, no lowering — `@container`
  strings with spaces ride verbatim), one-`_` strip, `:` join, `@bp` suffix.
