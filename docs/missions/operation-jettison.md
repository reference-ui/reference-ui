OPERATION: GO

# Mission: Operation Jettison — drop the shipped per-atom map

Status: `ready` (HQ 2026-09-20; two objectives, Vocabulary, and station
IDs fixed the same day — D9 — so research agents challenge the names as
well as the claims). Split out of Operation Seize on 2026-09-20; the
harvest half — sheet size on a real compile, then the pool — is
[Operation Reaper](operation-reaper.md). This is the implementation plan,
not an implementation. No compiler, Neo, runtime, or
lib work begins until the READY-phase asks at the end return without a
blocker and HQ writes `OPERATION: GO`. Harvest stays. The cut is the
shipped per-atom map, not the harvester.

Signal protocol (line 1 of this file): `OPERATION: READY` = the plan has
enough context for research agents to challenge it; `OPERATION: GO` = the
watcher starts implementation, slices in order.

Predecessor: [Forge](completed/operation-forge.md) Part I. Successor:
[Reaper](operation-reaper.md), which does not budget the harvest floor
until this operation has landed. Domain: [`docs/ATOMIC.md`](../ATOMIC.md).
Lib-Book harvest check:
[forge-ready-02](../../packages/reference-neo/docs/evidence/forge-ready-02-harvest-size.md)
(~1.8k gross wants). Diagnostics: [Error Correct](operation-error-correct.md)
and its [runtime companion](operation-error-correct-runtime.md) — a
different axis, but this plan touches both (§6, §8).

Every number below marked **verified** was re-measured against the tree
on 2026-09-20 (`packages/reference-lib/.reference-ui/`, canon tables,
harvest sources).

## The claim

The class a runtime `css()` call needs is a **pure function of the
author's request** plus a closed set of tables. Shipping one JSON row per
compiled atom (`stylePlans`) is a cache of that function, not
information. Delete the cache from every shipped artifact; keep the
function in one place on each side of the cut; prove the two agree on
every declaration the compiler ever produced. After that, harvest's only
O(atoms) artefact is `styles.css`, and its size is a sheet-size question
([Reaper](operation-reaper.md)), not a bundle-size question.

## Objectives — both, or neither

1. **Drop the shipped map.** No per-atom row in any shipped artifact;
   artifact bytes independent of atom count (R1, R2; `ATM-SEAM-06/07`).
2. **Prevent drift between the two namers.** The runtime namer must spell
   every class exactly as the compiler namer did, and a naming change on
   one side that is not mirrored on the other must fail before it ships.
   This is a top-level objective, not a side effect of (1): dropping the
   map without it trades bytes for silent no-paint. Concretely — one
   author for every table-shaped rule (namer tables, ~13 of 20 rules,
   D3/D7); a Rust-generated golden per procedure and lexical function
   (`ATM-SEAM-08`, `ATM-NAME-08`); the differential over every
   declaration the compiler named (`NEO-NAMER-01`); `rulesVersion`
   refused at load on skew (R14); one crate so the Rust and its mirror
   land in one PR under one gate (D6). Drift's only failure mode is a
   class with no rule: paints nothing, warns in dev (D2), never paints
   wrong. What no plan can promise is that two implementations agree on
   an input nobody tested — §9 says so, and the Doom seed hunts it.

## Order of work

1. **Drop the shipped map** (this operation). `css()` constructs the
   class the style engine already knows how to name. Deletes the JS copy
   of every utility from `react.mjs`, `runtime-data.mjs`, and
   `baseSystem.mjs`. The harvester still fills the sheet.
2. **Then Operation Reaper.** Size a messy enterprise sheet on a real
   compile (CSS, then gzip), then decide the pool.

Do not budget the harvest floor until (1) has landed and Reaper has a
number.

## What this is not

- Not a recatalog. Not Doom. Not Error Correct.
- Not dropping harvest. Not shrinking the kind gate. Not "stop minting."
  A value the program never wrote still gets no rule in the sheet.
- Not deleting `RuntimeStylePlan`. Plans stay as a compile-internal IR
  (proof input, test oracle). They stop being *shipped*.
- Not "Panda has no generated JS." They generate a small `css()` namer
  (~22 KB raw across `css.js` + `helpers.js` + `conditions.js`,
  **verified**). They do not generate one JSON row per atom.
- Not a WASM namer. Compiling `resolve` + `stylesheet::name` to WASM
  would be bigger than the map it replaces for lib.
- Not a printed `css.js` by default. §9 scores Rust emitting the
  runtime namer: everything table-shaped is generated as data (tables,
  lowerings, namer goldens); the nine procedures are authored once in JS
  beside the Rust they mirror (D6). Printing their text from Rust is the
  upgrade path, not the start.
- Not a Chakra `Box`. Authors write primitives and `css()`. Rest-spreads
  are not sinks. Nested `_hover` / `_focusVisible` with **literal** values
  are site-walk atoms (one class each), not a harvest multiplier.
- Not a new author API. `css()` and `recipe()` keep their signatures.

## Vocabulary

Boring names, chosen so a station, a file, and a sentence in `SPEC.md`
point at the same thing. Operation names never appear in identifiers,
station IDs, case groups, `DOMAIN.md`, or `SPEC.md`; they live in
`docs/missions/` and in evidence filenames (the `forge-ready-*`
convention) only. Existing domain words are reused, not re-coined:
**namer** (`ATM-FORBID-03`, `docs/ATOMIC.md`), **want**, **atom**,
**slot**, **when**, **canonical**, **lower** / **expand** (the `resolve/`
verbs), **golden** (rs proves compilers with goldens), **miss**
(`reportStyleMisses`), **ghost** (`ATM-GHOST-*`), **seam** (the Rust/JS
boundary, `ATM-SEAM-*`), **station**, **case**, **group**.

| Term | Meaning | Spelled in code as |
|---|---|---|
| **namer** | the function from one authored declaration to `{slot, className}`: `{system}__{when:}{prefix}_{sanitize(value)}[!]`. One algorithm | `stylesheet::name`; `@reference-ui/rust/namer` |
| **compiler namer** | the Rust implementation, run at compile time over extracted wants. The oracle | `PlanBuilder::resolve_entry` → `resolve_want_with` → `class_name_with_system` |
| **runtime namer** | the JavaScript implementation `css()` runs over style props. Mirrors the compiler namer | `packages/reference-rs/modules/atomic/js/namer/` (D6) |
| **namer tables** | the closed, O(props + conditions + fonts) data both namers read; written by the compiler, never by hand | `NamerTables`, built in `runtime/tables.rs`, shipped as `runtime.namer` |
| **lowering** | one table-shaped step a canonical prop runs before naming: longhand shape, value rewrite, emit, drop | `LowerStep`; `NamerTables.lowerings`; `namer/lower.ts` |
| **naming rules** | the closed list of every place the class is not `prefix_sanitize(authored)` (§3). Permanent home after Slice 4: `src/runtime/README.md` | — |
| **rules version** | integer bumped whenever a naming rule changes a class; artifact and runtime namer must carry the same one | `namer.rulesVersion`; `NAMER_RULES_VERSION` |
| **procedure** | a naming rule that is code, not a table; authored once in Rust and once in JS. Nine of them (§9) | one Rust fn, one JS fn, one golden each |
| **lexical function** | a text or number operation the class stem passes through: whitespace class, decimal parse, decimal render, ASCII fold, trim. Explicit on both sides, never a `std` or builtin default | `resolve/lexical.rs`; `namer/lexical.ts` |
| **builtin divergence** | an input on which Rust `std` and the JS builtin a port would reach for disagree (§9 table) | one golden row and one compiled case each |
| **namer golden** | a Rust-generated `input → output` file for one procedure or lexical function. Rust regenerates it and diffs; the runtime namer reproduces it | `tests/namer-goldens/<function>.json`; refresh `NAMER_UPDATE_GOLDENS=1` |
| **differential** | the end-to-end gate: the runtime namer over every authored declaration of a compile equals `stylePlans[i].declarations`, slot and className | `NEO-NAMER-01` |
| **miss** / **miss class** | a `css()` request the compiler never saw, and the class it still constructs, which no rule backs. Not a **ghost**: a ghost is a class the *compiler* emitted whose selector the sheet lacks, and stays forbidden | `namer/miss.ts`; `ATM-GHOST-01` unchanged |

Two directions, one function. Atoms → class names is the compiler namer
at compile time; its output is the sheet's selectors
(`escape_css_selector(class)`) and the compile-internal `stylePlans`.
Style props → class names is the runtime namer at `css()` time. The
second is not an inverse of the first and never consults the sheet: it
re-evaluates the same request → class function with the same tables,
later and in another language. Every mechanism in this plan exists to
make "same function" true and keep it true.

### Where the truth lives

| Rule kind | Single author | Readers | What holds them equal | Station |
|---|---|---|---|---|
| table-shaped: prefixes, aliases, longhand shapes, rewrites, macros, keyword sets, runtime-owned props, breakpoints, conditions, fonts (~13 of the 20 rules) | Rust — canon + `BaseSystem` + the atomic constants, through `runtime/tables.rs` | compiler namer directly; runtime namer through `NamerTables` | nothing to hold: one author | `ATM-SEAM-06` |
| procedures (9) | a Rust function and its JS mirror | each namer runs its own | a namer golden per function, generated by Rust; the differential end to end | `ATM-SEAM-08`, `NEO-NAMER-01` |
| lexical functions | a Rust explicit fn and its JS mirror | the procedures | a golden row per builtin divergence; a compiled case per divergence | `ATM-NAME-08` |
| the join (`class_name_with_system` / `name()`) | as above | — | the composed golden `name.json`; the differential | `ATM-SEAM-08`, `NEO-NAMER-01` |
| the rule set as a whole | `rulesVersion` | the artifact; the JS constant | `registerRuntimeData` throws on mismatch; a Cargo test refuses a golden diff without a bump | guard under `ATM-SEAM-08` |

---

## 1. What ships today (verified 2026-09-20, lib)

`NativeRuntimeArtifact { schemaVersion: 1, stylePlans, recipes, stylePropNames }`
is written by `packages/reference-neo/src/sync/publish/styled.ts`
(`publishRuntimeBundle`) and then copied twice more:

| Artefact | Raw | gzip-6 | Carries plans? | Consumer |
|---|---:|---:|---|---|
| `react/react.mjs` | 527,226 | 46,714 | yes — `runtime-data.mjs` is inlined by `sync/react.ts` (`runtimeHeaderSource`) and `registerRuntimeData` runs at import | **the browser** |
| `styled/runtime-data.mjs` | 419,623 | 32,345 | yes — 2,223 plans, ~177 B each, plus `stylePropNames` (~25 KB) | bundle input; node-side specs |
| `system/baseSystem.mjs` | 1,230,874 | 83,973 | yes — `patchBaseSystemRuntime` sets `.runtime` | downstream extends (node) |
| `styled/styles.css` | 242,953 | 32,046 | n/a | the sheet |

The browser pays for the plans inside `react.mjs`. That is the number
Slice 3 measures. Enterprise harvest makes every row above megabytes;
the sheet grows with it, the plans grow with it, and the plans are a
strict duplicate of the sheet's selectors.

## 2. Why the map exists (doctrine), and what is actually physics

```text
class = {system}__{condition:*}{prefix}_{sanitize(authored value)}[!]
```

`stylesheet/name/mod.rs::class_name_with_system`. Prefix from
`canon::class_prefix_for_prop`. Sanitize: whitespace → `_`
(`escape.rs::sanitize_class_value`). The sheet escapes the same string
for the selector (`escape_css_selector`); the DOM class stays unescaped.
Tokens and rhythm stay **authored** in the class (`n300`, `6r`,
`#00aeff`); emit writes the rule body.

We ship the map because of four things:

| Reason | Doctrine or physics? | Where it lives |
|---|---|---|
| `ATM-FORBID-03` "no second namer", `ATM-FORBID-04` "no generated `css.js`", runtime README "do not reimplement resolve" | **Doctrine.** FORBID-03 was written against *split-brain* — two algorithms that disagree. The harness escaper that drifted (`ATM-FORBID-06`) is what burned. A second **implementation** of one algorithm, held equal by a differential gate, is not the thing forbidden. FORBID-04 is untouched: the compiler still emits data (tables, lowerings, goldens — §9); the namer's procedures are authored JavaScript whose home is D6. | `SPEC.md` §Forbidden; `src/runtime/README.md` |
| Ghost P0 (`ATM-GHOST-01`): only emit names the sheet printed | **Doctrine, and it moves.** With no catalog in the browser, a miss constructs a class with no rule. It paints nothing, same as today's `""`. The pin becomes *sheet selector ↔ constructed name* over every declaration the compiler saw (§7). Panda and Tailwind live here. | `tests/helpers.ts` `atomicGauges` |
| Slot eviction, important-beats-plain (`mergeStylePlans`) | **Physics we keep, map we don't need.** The slot is `derive_slot(canonical, when, bp)` — a function of the request. Constructed `{slot, className}` pairs feed the existing merge unchanged. Stylesheet order is **not** a substitute: the sheet is `CascadeKey`-sorted, not author-ordered, and `css(base, override)` last-wins is load-bearing. | `runtime/builder.rs::derive_slot`; neo `runtime/css/plans.ts` |
| Dev miss `console.warn` | **Physics that needs a new source of truth.** Today the index *is* the catalog. Decision D2. | neo `runtime/css/css.ts::reportStyleMisses` |

## 3. The namer as a function

Everything the runtime needs is `N(request; tables) → {slot, className}[]`
where `tables` is O(props + conditions + fonts), never O(atoms). The
compiler already computes this in `PlanBuilder::resolve_entry` →
`resolve_want_with` → `class_name_with_system`. The TS side gets the
same function with the same tables.

### Tables (closed; emitted by the compiler as data)

| Table | Source | Size (verified) |
|---|---|---:|
| alias → canonical | `canon::ALIASES` | 315 entries (~8 KB) |
| canonical → class prefix, **where the prefix is not the kebab CSS name** | `canon::CANONICAL_PROPERTIES` (`Property::class_prefix`); ~84% of entries are kebab and fall back | ~150–180 entries (~4 KB) [Slice-4 correction 2026-09-20: **198** by the shippable `prefix ≠ kebab(canonical)` criterion (five `ms-` props break kebab-purity); fallback order table → `--*` verbatim → kebab] |
| shorthand → longhands, for the families expand touches | `canon::native_longhands_for_prop`: `padding` / `margin` / `inset` (4), `border*` / `outline` / `columnRule` trios (3, gated by `is_border_family`), six radius pairs (2) | ~30 entries (~3 KB) |
| color props | `canon::COLOR_PROPERTIES` — only for the numeric-spelling exemption (`accepts_bare_number`) | 71 |
| breakpoint names, in scale order | `BaseSystem::breakpoints().names()` (excl. `base`) | 5 default |
| known `_` conditions | `BaseSystem::conditions` ∪ `pseudoprops::PRESETS` (12) — the *names*, not the wraps; the class segment is the key without `_` | dozens |
| fonts | `BaseSystem::fonts()`: family → default weight + `css` extras (`font` macro) | per system |
| `stylePropNames` | already shipped; `isKnownStyleProp` = set ∪ `--*` | ~1.4k (~25 KB) |

Wraps, `@container` widths, token values, and rhythm roots are **not**
in the tables. The class never contains them.

### Naming rules — every place the class is not `prefix_sanitize(authored)`

This list is the substance of Slice 2, and after Slice 4 it lives in
`src/runtime/README.md`, not here. Each rule names the Rust site the
runtime namer must mirror, and each is a differential-corpus family.
Rules that are table-shaped travel as lowerings or keyword sets (D7);
the rest are procedures (§9).

[Slice-4 correction 2026-09-20: rules 2/3 (numeric fence + color
carve-out), 7 (allowlist + 2–4 window), 8 (case/order facts), 12
(`class_name_str` of any kind), and 20 (anonymous numeric `r` only)
were corrected per READY asks 1–2, and rule 21 (`--*` verbatim prefix)
was added. The README is the permanent home; this table is the
superseded index.]

| # | Authored | What the class becomes | Rust site |
|---|---|---|---|
| 1 | any string value | structural whitespace runs collapse to one space, **quoted substrings verbatim**, then `_` for whitespace | `resolve/normalize.rs::collapse_whitespace` (SPEC-V2-14), `escape.rs::sanitize_class_value` |
| 2 | number `4`, or finite numeric string `'1e3'`, `'.5'`, `'01'` on a non-color prop | stem is the canonical number via `f64` parse + `to_string` (`p_4`, `p_1000`, `p_0.5`, and **`p_1` for `'01'`** — `ATM-UNIT-02` pins that; the leading-zero refusal in `legacy_string_value` is reached only on props that do not accept bare numbers); hex/binary/octal/`Infinity`/`NaN` refuse; `0`/`-0` → `0`. CSS gets `px` on dimensional props but **the class does not**. Parse and render are lexical functions (§9) | `resolve/unit.rs` (`canonical_numeric_string`, `resolve_numeric_value`, `accepts_bare_number`) |
| 3 | numeric string on a **color** prop or `font`/`fontFamily` | stays a string (`c_.5`) — no canonicalization | `unit.rs::accepts_bare_number` |
| 4 | `{ $token: { path, value } }` | class uses `path` | `builder.rs::t_object_to_atom_value`, `AtomValue::class_name_str` |
| 5 | `{ $r: 2 }` | `2r` | `builder.rs::r_object_to_atom_value` |
| 6 | `'…!'` / `'… !important'` | marker stripped from the stem, `!` appended after sanitize | `css.ts::splitImportant`, `name/mod.rs` |
| 7 | `padding` / `margin` / `inset` with 2–4 space tokens (paren-depth aware) | four longhands `pt_ pr_ pb_ pl_`; 1 token stays the shorthand class; CSS-wide keyword stays shorthand | `shorthands/dimensional.rs`, `parser.rs::split_tokens` |
| 8 | `borderBottom: '3px solid red'`, `outline: '…'` | width / style / color longhands by token class (style keywords first, then length-width incl. `thin`/`medium`/`thick`/math fns/`Nr`/`1/3r`, else color); first of each kind wins; `border: 0` → `bd-w_0px`; `border: 'none'`/`inherit`/`var()`/`borders.*` stays whole; **`outline: 'none'` → `outline: '2px solid transparent'` + `outlineOffset: 2px`** | `shorthands/border.rs`, `parser.rs` |
| 9 | six radius pairs `borderTopRadius` … | two corner longhands, same value | `shorthands/pair.rs` |
| 10 | `flex: '1'` / `'auto'` / `'initial'` / `'none'` | **value rewritten**: `flex_1_1_0%`, `flex_1_1_auto`, `flex_0_1_auto`, `flex_none` | `shorthands/flex.rs` |
| 11 | `size` | `width` + `height` | `resolve/size.rs` |
| 12 | `container` (`true` / `''` / `'name'`) | `containerType: inline-size` (+ `containerName`) | `resolve/container.rs` |
| 13 | `textGradient` | `backgroundImage` + `webkitBackgroundClip: text` + `color: transparent` | `resolve/gradient.rs` |
| 14 | `border: true` | `borderWidth: 1px` + `borderStyle: solid` | `resolve/mod.rs::lower_macro` |
| 15 | `font: 'sans'` | `fontFamily: sans` + `fontWeight: <scale default or 400>` + every `css` extra on the definition — **system data** | `resolve/font/family.rs` |
| 16 | `weight: 'bold'` / `'sans.bold'` / `'393'` | `fontWeight` via scoped scale, else keyword table (`thin`…`black`), else as-is | `resolve/font/weight.rs` |
| 17 | `variant`, `colorMode` | zero declarations | `resolve/mod.rs::is_runtime_owned` |
| 18 | responsive array `['1r', null, '3r']` | index → breakpoint name pushed on `when`; `null` skips; slot gets `@bp` | `builder.rs::resolve_array`, `BreakpointScale::breakpoint_for_index` |
| 19 | per-prop object `width: { base, md, _hover }` | breakpoint keys → `@bp` slot; other keys → nested `when` in the slot; whole object carries one `important` | `builder.rs::resolve_object`, `css.ts::cleanResponsiveObject` |
| 20 | `r: { 300: {…} }` | already lowered in JS to `@container (min-width: 300px)` keys before lookup | `lowerResponsiveStyles.ts` (Neo copy of core) |

Rhythm (`2r` → `calc()`), tokens (`n300` → `var()`), and gradients'
token interpolation are **not** naming rules: they change the CSS body,
never the class. [Slice-4 correction 2026-09-20: resolution is
sheet-side, but refusal is membership-affecting — an unknown token path
drops its declaration (witness `ATM-TOKEN-12`, `ATM-E-UNKNOWN-TOKEN`);
the differential carves exactly braced-plus-absent extras. See the §9
boundary correction.] The runtime README's "do not reimplement resolve" holds
for them exactly as before.

### Conditions → class segment

`resolve/conditions/mod.rs::lower_when` in order; TS mirrors the order.

| Authored `when` entry | Segment | Known-set needed? |
|---|---|---|
| `base` | skipped | no |
| `_hover`, `_osDark`, system condition key | key without `_` | **yes** — unknown keys drop the whole want with `UnknownCondition`; TS must refuse identically (D4) |
| scale name `md`; ranges `mdDown`, `mdOnly`, `smToLg` | the raw name | **yes** — scale names |
| `@media …` / `@container …` / `@supports …` | `[` + trimmed query with spaces → `_` + `]`; bare `@supports` refused | no |
| `&…`, other `@…`, or a `&`-bearing selector | same bracket form | no |

`When::class_segment` is the only thing the class carries; wraps stay in
the compiler.

### Slot

`derive_slot(prop, when, bp)` = `canonical(prop)`, prefixed by every
`when` entry with `_` stripped and joined by `:`, suffixed `@bp` for
responsive members. `splitSlot` / `evictFamilyLosers` /
`isCoveredByImportant` in neo `plans.ts` are unchanged and consume the
constructed pairs.

## 4. Where the second implementation lives (decision)

- **Namer tables, including lowerings,** are emitted by the compiler
  into the artifact (`NativeRuntimeArtifact` schema **2**, §5). Every
  table-shaped naming rule — prefixes, aliases, longhand shapes,
  rewrites, macros, keyword sets, runtime-owned props, breakpoints,
  conditions, fonts — is data Rust writes (§9 kind 1). Single source of
  truth is canon + `BaseSystem` + the atomic constants; nothing is
  hand-copied into JavaScript. Satisfies `ATM-FORBID-04` verbatim: the
  compiler emits data.
- **Procedures** — the nine naming rules that are not a table (§9) plus
  the lowering interpreter — are authored JavaScript: the runtime namer.
  Its home is **D6**. Recommended:
  `packages/reference-rs/modules/atomic/js/namer/`, exported as
  `@reference-ui/rust/namer`, so the runtime namer lives in the crate it
  mirrors, runs under `pnpm agentrs v atomic` beside `pnpm agentrs c
  atomic`, and ships in the same npm version as the binary that printed
  the sheet. `sync/react.ts` inlines it into `react.mjs` the way it
  inlines `runtime-data.mjs` today. The neo draft home
  (`src/runtime/css/namer/`) is the alternative if D6 goes the other way.
  Either home replaces `createStylePlanIndex` / `resolveScoredDeclarations`
  in `css.ts`; `mergeStylePlans` stays.
- **The compiler namer is the oracle, at two granularities.** Per
  function: Rust tests write a namer golden for every procedure and every
  lexical function (§9); the runtime namer must reproduce each file
  (`ATM-SEAM-08`). End to end: `PlanBuilder` keeps producing
  `RuntimeStylePlan[]` inside `compile()`, and the differential
  (`NEO-NAMER-01`) runs the runtime namer over every authored declaration
  in a compile and requires byte-equal `slot` and `className` lists. The
  rules version in the tables, pinned by the runtime namer and checked at
  `registerRuntimeData`, refuses a skewed pair loudly.
- Rejected: a DSL or Rust→JS transpile as the single source for the
  procedures (§9 kind 3 — the generator would be larger than the nine
  procedures and would carry the same builtin divergences); Rust printing
  the JS text into the artifact **as the default** (kind 2 — custody and
  lockstep are had more cheaply by D6; it stays the upgrade path and would
  amend `ATM-FORBID-04`); WASM (size, and not the ask); a compact
  `prop:value → class` map (still O(atoms)); hybrid "construct simple,
  look up hard" (the hard cases are per-prop, so they are lowerings, not a
  residual catalog).

## 5. Artifact and contract changes

```ts
// packages/reference-rs/contracts/types.ts
interface NamerTables {
  rulesVersion: number                    // bumped when any naming rule changes a class; the runtime namer pins the same number (§9)
  aliases: Record<string, string>         // alias → canonical                        (lookup: sorted keys)
  prefixes: Record<string, string>        // canonical → class prefix, only where ≠ kebab(css name)
  lowerings: Record<string, LowerStep[]>  // canonical → steps run before naming, only where ≠ identity (§9 kind 1)
  keywords: Record<string, string[]>      // sets the procedures consult: borderStyle, outlineStyle, lineWidth, lengthUnits, mathFns, cssWide, runtimeOwned
  colorProps: string[]                    // numeric-spelling exemption
  breakpoints: string[]                   // scale names, in order, without `base`   (ordered)
  conditions: string[]                    // known `_` keys (system ∪ presets), without the underscore
  fonts: Record<string, { weight: string; css: [string, string][] }>  // extras as ordered pairs: declaration order is load-bearing
}
// Illustrative; READY ask 8 fixes the exact shape. Steps are tried in order, first match runs.
type LowerStep =
  | { on?: Guard; longhands: string[]; shape: 'trbl' | 'trio' | 'pair' }  // padding/margin/inset · border*/outline/columnRule · six radius pairs
  | { on?: Guard; rewrite: Record<string, string> }                       // flex: '1' → '1 1 0%'; outline: 'none' → the 2px transparent ring + offset
  | { on?: Guard; emit: [string, string | '$'][] }                        // size → [['width','$'],['height','$']]; textGradient; border:true; container
  | { drop: true }                                                        // variant, colorMode
type Guard = 'bool:true' | 'empty' | 'keyword' | 'string'
interface NativeRuntimeArtifact {
  schemaVersion: 2
  namer: NamerTables
  recipes: Record<string, RecipeRuntimeTable>
  stylePropNames: string[]
}
interface CompileResult {
  // …unchanged…
  runtime: NativeRuntimeArtifact          // v2: no plans
  stylePlans: RuntimeStylePlan[]          // compile-internal IR surfaced for proof, stations, and the differential gate
}
interface PortableBaseSystem { runtime: NativeRuntimeArtifact /* v2 */ }
```

Consumers to re-point (mechanical, counted 2026-09-20):

| Consumer | Today | After |
|---|---|---|
| 64 ATM specs + `tests/helpers.ts` `atomicGauges` (`planClasses`) | `result.runtime.stylePlans` | `result.stylePlans` |
| `packages/reference-rs/modules/atomic/js/plans.ts` (test-side indexer) | `createStylePlanIndex(artifact)` | takes `RuntimeStylePlan[]`; stays test-only |
| `diagnostics/proof/render.rs::render_session` | `&runtime.style_plans` | `&style_plans` (local in `assembly.rs::finish`) |
| `contracts/fixtures/{native-runtime-artifact,compile-result,portable-base-system}.json` + `contracts.test.ts` | v1 | v2 |
| neo `sync/publish/styled.ts` (`publishRuntimeBundle`, `patchBaseSystemRuntime`), `sync/react.ts` | v1 passthrough | v2 passthrough (no code change beyond types) |
| 12 neo `src/` + `tests/` files naming `stylePlans` (plus `PLAN.md` D4/D5 prose) | index | namer |

`schemaVersion: 1` is not read by anything after Slice 3. No dual-schema
runtime: `registerRuntimeData` throws on `schemaVersion !== 2`.

## 6. The miss contract (this is a behaviour change)

Today: `css({ color: 'not-in-source' })` → `""` plus one dev
`console.warn` (`css.ts::reportStyleMisses`), in the browser **and**
node-side (`NEO-MERGE-06` asserts both, and asserts `class === ''`).

After: the call returns `reference-ui__c_not-in-source`. No rule matches;
it paints nothing. The DOM carries a miss class. This is Panda's and
Tailwind's contract. The runtime has no catalog to consult, so `""` is
not attainable in production without shipping one.

Dev warning options (D2):

| Option | Cost | Where it works | Notes |
|---|---|---|---|
| **A. CSSOM probe** | zero bytes; one lazy scan of `document.styleSheets` → `Set<className>` from class selectors inside `@layer utilities`, rebuilt when the sheet list changes | browser dev only | same message text as today; silent in Node/SSR; first-paint race handled by deferring the check to a microtask after the sheet is present |
| B. dev manifest | O(atoms) file (~30 B/class), shipped only under the `development` export condition (`react.dev.mjs`) | browser + node | two bundles from `sync/react.ts`; Vite and webpack resolve the condition by mode; production bundle unchanged |
| C. silence | none | — | drops a seam ATOMIC.md promises |

Recommendation: **A**, and re-pin `NEO-MERGE-06` to browser-side
diagnostics plus "paints inherited ink" (drop the node-side warning
assertion and the `class === ''` assertion). B stays on the table if the
READY asks show node-side warnings are load-bearing for lib CT. The Error
Correct runtime companion (cap, collapse, pool-stats in dev
`runtime-data`) is compatible with either A or B and is unaffected.

## 7. Pins that move

| Pin | Today | After this operation |
|---|---|---|
| `ATM-FORBID-03` | "no second namer outside `stylesheet::name`"; every `css.classes` value is a utilities selector | Wording: **one algorithm, two implementations, one gate.** The compiler namer (`stylesheet::name` + `PlanBuilder`) is the oracle; the runtime namer must agree byte-for-byte on every `RuntimeStylePlan` the compile produced (slot and className). The station keeps its existing assertion and gains the differential. |
| `ATM-FORBID-04` | no generated `css.js` | unchanged: tables, lowerings, and goldens are data; the runtime namer is authored and package-shipped (D6). Only if D6 picks the printer (§9 kind 2) does this row move — "the compiler writes one `.js`, the namer, whose procedural text is a checked-in file in the crate" — and that is a doctrine event, not a footnote |
| `ATM-GHOST-01` | every runtime class exists as a selector under `@layer utilities` | unchanged for compiler outputs (`css.classes`, `stylePlans`); explicitly **not** a claim about misses, which construct a class by design (Vocabulary: miss class ≠ ghost) |
| `ATM-GHOST-02` | dictionary keys are bijective `prop:val` / `when:prop:val` | retitled: constructed names are deterministic and equal the plan declarations (the differential) |
| `ATM-GHOST-04` | namer injectivity, `ATM-LEAF-05` quarantined (`p` vs `padding`) | unchanged; orthogonal (both sides canonicalize first) |
| `NEO-MERGE-06` | miss → `''`, one page diagnostic, one node diagnostic | miss → miss class, no paint, one page diagnostic (per D2) |
| `src/runtime/README.md` | "we emit the map; do not generate `css.js`; do not reimplement resolve" | "we emit namer tables and lowerings; the runtime namer — the JS mirror of nine procedures and six lexical functions [Slice-4 correction 2026-09-20: five→six; `sanitize_value` was missing from the list] — lives beside this crate (D6) and reproduces the namer goldens; do not reimplement resolve (tokens, rhythm, wraps)". Carries the naming rules table (§3) and the builtin-divergence table (§9) as their permanent home |
| `SPEC.md` §Class Naming, §Engine Parity | seven `ATM-NAME`, five `ATM-SEAM` [Slice-4 correction 2026-09-20: SPEC prose held three `ATM-SEAM` (01–03); SEAM-05 existed folder-only, SEAM-04 citation-only (reserved, undefined). Landed: +`ATM-NAME-08`, +`ATM-SEAM-06..08`] | + `ATM-NAME-08`, `ATM-SEAM-06..08` (below); the legend's "Cargo `#[test]` is not a tick" holds — the golden-freshness test is a guard, not a station |
| `docs/ATOMIC.md` "Two artefacts, one namer", "Runtime" | class map artefact; miss → `""` | one namer, two implementations, one gate; miss → miss class, no paint, dev warn |
| `packages/reference-neo/docs/DOMAIN.md` | no namer entries | + **compiler namer**, **runtime namer**, **namer tables**, **lowering**, **naming rules**, **rules version**, **namer golden**, **differential**, **miss class** (Vocabulary), same pass as the code |

New stations (existing families; IDs checked free on 2026-09-20 —
`ATM-SEAM-04` is Overmatch's, `ATM-SEAM-05` StyleTrace's):

- `ATM-SEAM-06` — **the runtime artifact carries no per-atom row**:
  `runtime.schemaVersion === 2`, no `stylePlans` key, `namer` tables
  present with sorted lookups and ordered lowerings; `stylePlans` on
  `CompileResult` still equals the old golden.
- `ATM-SEAM-07` — **artifact bytes are independent of atom count**:
  compile a fixture, then the same fixture plus a file holding 500
  distinct harvestable hexes and one `color` hole. `styles.css` grows by
  ~500 rules; `runtime` is byte-identical.
- `ATM-SEAM-08` — **the runtime namer reproduces every namer golden**
  (case folder; `spec.ts` runs under `pnpm agentrs v atomic`): one block
  per `tests/namer-goldens/*.json`, lexical functions first, then each
  procedure, then `name()` over the composed cases. Fails before
  `NEO-NAMER-01` can be green, and names the exact function that
  drifted. Beneath it, a Cargo `#[test]` (`namer_goldens_are_fresh`)
  regenerates every golden in memory from the Rust functions and diffs
  against the committed file; `NAMER_UPDATE_GOLDENS=1` is the only way to
  rewrite (typegen's `TYPEGEN_UPDATE_GOLDENS` rule), and a golden diff
  without a `rulesVersion` bump fails. Per the SPEC legend that Cargo
  test is a guard, not a tick; the tick is the Vitest case.
- `ATM-NAME-08` — **the class stem passes only through explicit lexical
  functions**: for every builtin divergence in §9 there is a compiled
  input and a pinned outcome — `'0x10'`, `''`, `'  '` refuse (no class);
  `'-0'` → `_0`; `'1e21'` and `'1e-7'` refuse as `NonCanonicalNumeric`;
  `\r` inside quotes survives sanitize; U+0085 and U+FEFF are not
  structural whitespace; `İ` is not case-folded. The compiler's answer is
  the golden row's answer.
- `NEO-NAMER-01` (node-side spec, `pnpm agentneo run NEO-NAMER-01`; reads
  `packages/reference-rs/modules/atomic/tests/cases/*/input` read-only
  and compiles through `@reference-ui/rust`) — **differential**: for
  every ATM case input and for the lib compile, `name(decl, tables)`
  equals `stylePlans[i].declarations` for every authored declaration,
  slot and className; every declaration the compiler **refused** yields
  either nothing or a class absent from the sheet. Property-based corpus
  on top: numeric spellings (§3 rules 2–3, including the `f64` vs
  `Number#toString` boundary — pin one rendering and make both sides
  meet it), whitespace/quotes (rule 1), shorthand token orders (rules
  7–8), condition spellings.
- `NEO-NAMER-02` (browser) — `css()` over a world with holes, responsive
  arrays, per-prop objects, `_hover`, `md`, `!`, macros (`font`, `size`,
  `border`), radius pairs, `flex: '1'`; every element's class list equals
  the pre-cutover plan-derived list (golden captured in Slice 0) and
  computed styles match.
- `NEO-NAMER-03` (browser) — miss: miss class present, paints inherited
  value, exactly one dev diagnostic naming prop and value.

The Neo group is `tests/cases/namer/` (`SPEC.md`, `TESTS.md`, three
cases), beside `css`, `merge`, `resp`. Not `parity`: that group is the
lib-shaped end-to-end world and owns no engine stations.

## 8. Decisions for HQ (answer before GO)

| # | Decision | Recommendation |
|---|---|---|
| D1 | Miss returns a constructed class (dead in the DOM) instead of `""` | Accept. It is the price of having no catalog; Panda/Tailwind semantics; paint is identical. |
| D2 | Dev miss source of truth | A (CSSOM probe), re-pin `NEO-MERGE-06`; B if lib CT needs node-side warnings. |
| D3 | Where the tables come from | Compiler emits `namer` in the v2 artifact; nothing hand-copied into TS. |
| D4 | Refusal parity: must TS refuse exactly where Rust refuses? | Refuse where the table makes it free (unknown prop, unknown `_` condition, runtime-owned, `null`/bool outside macros, empty string). Construct otherwise (`'01'`, `NaN`, bare `@supports`). The gate only requires "no class that exists in the sheet" on the refused set. [Slice-4 correction 2026-09-20: as implemented — refuse {unknown `_` conditions, the 27 unrealizable extensions as `keywords.unrealizable` data (lowerings checked first), runtime-owned drops, `null`/bool outside macros, empty strings, bare `@supports` (both sides)}; construct otherwise — unknown props mint absent-from-sheet classes (no known-prop gate: the tables ship no canonical list), numerics follow the `[1e-6, 1e21)` fence; token-membership refusal is compiler-only and the differential carves exactly braced-plus-absent extras (witness `ATM-TOKEN-12`)] |
| D5 | `stylePropNames` stays as a separate list (~25 KB) or is derived from the tables | Stays for now (the primitives' `split.ts` needs the full set and the prefix table lists only non-kebab entries). Revisit if the lib `react.mjs` budget bites. |
| D6 | Custody of the runtime namer (§9): neo `src/runtime/css/namer/`, `packages/reference-rs/modules/atomic/js/namer/` exported as `@reference-ui/rust/namer`, or Rust prints it into the artifact | **`@reference-ui/rust/namer`.** One crate owns the Rust and its mirror; one skill and one gate (`pnpm agentrs`) cover a naming change end to end; same npm version as the binary that printed the sheet; `ATM-FORBID-04` untouched. The printer is the upgrade if HQ wants per-compile lockstep and accepts amending FORBID-04. |
| D7 | How much of the naming rules becomes generated data | **Lowerings + keyword sets in `NamerTables`** (§5). The JS is the lowering interpreter plus the nine procedures in §9; every table-shaped rule has exactly one author, Rust. |
| D8 | Function-level drift gate | **Name the lexical functions in Rust and generate namer goldens from Rust tests** (`ATM-SEAM-08`, `ATM-NAME-08`). The decimal renderer is settled by READY ask 2 and implemented as an explicit function on both sides, not `to_string` vs `String(n)`. |
| D9 | Vocabulary (above) and station homes: `ATM-SEAM-06..08`, `ATM-NAME-08`, Neo group `namer` | Accept as written. Operation names stay in `docs/missions/` and evidence filenames; `DOMAIN.md`, `SPEC.md`, identifiers, and case IDs use the Vocabulary terms only. |

## 9. Generating the runtime namer from Rust — how far it honestly goes

The ask: Rust already owns naming (`PlanBuilder` → `resolve_want_with` →
`class_name_with_system`). Can Rust *emit* the runtime namer, so `css()`
cannot drift from the compiler? Short answer: **for everything
table-shaped, yes, and that is most of the naming rules; for custody and
version lockstep, yes; for the nine procedures and the lexical functions,
no** — those are the same text written twice whatever file the second
copy lives in, and only a gate holds them equal. Codegen can make Rust the
single *custodian*. It cannot make Rust the single *implementation*
without a two-backend DSL or WASM, and neither is the ask.

### Where naming lives in Rust (verified 2026-09-20, line counts from the tree)

| Stage | File | Lines | Class-affecting? |
|---|---|---:|---|
| Shape: arrays, per-prop objects, dedupe, slot | `runtime/builder.rs` (`PlanBuilder`, `derive_slot`, `$token` / `$r` values) | 344 | yes |
| Gate, conditions, expand, macros | `resolve/mod.rs` (`resolve_want_with`, `lower_macro`, `is_runtime_owned`) | 270 [Slice-4 correction 2026-09-20: 298 when READY-measured, 309 at Slice-4 landing] | yes |
| Condition → segment + wrap | `resolve/conditions/mod.rs` (`lower_when`) | 253 | segment yes; wrap sheet-only |
| Shorthands | `resolve/shorthands/{parser,border,dimensional,pair,flex}.rs` | 240 / 102 / 95 / 36 / 30 | yes |
| Numeric canon | `resolve/unit.rs` | 212 | stem yes; `px` sheet-only |
| Whitespace | `resolve/normalize.rs` | 123 | yes |
| Font macros (system data) | `resolve/font/{family,weight}.rs` | 45 / 33 | yes |
| `size`, `container`, `textGradient` | `resolve/{size,container,gradient}.rs` | 14 / 20 / 19 | yes |
| Rhythm, tokens | `resolve/rhythm/*`, `resolve/tokens/*` | ~280 / ~700 | **no** — the class carries the authored path [Slice-4 correction 2026-09-20: resolution is sheet-side, but **refusal is membership-affecting** — an unknown token path drops its declaration (`ATM-TOKEN-12` refuses only the color longhand via `ATM-E-UNKNOWN-TOKEN`), so no form-based rule separates minted from dropped braced values; the differential carves exactly braced-stem + absent-from-sheet extras] |
| The join | `stylesheet/name/mod.rs::class_name_with_system` | ~40 of 171 | yes |
| Selector spelling | `stylesheet/name/escape.rs::escape_css_selector` | — | **no** — sheet-only |

The "central unit" is forty lines. What decides its inputs is ~1,800 lines
upstream (the class-affecting rows above, summed), a good part of which is
diagnostics plumbing and sheet-side wraps that the class never sees.
"Single source of truth" therefore names a *chain*, not a module, and the
class-affecting subset of that chain is the thing any generator or mirror
has to cover. It is enumerable; the table above is the enumeration.

### Codegen this repo already does (verified)

| Surface | Direction | What it emits | Pattern worth copying |
|---|---|---|---|
| `modules/canon/generate/` | JS → Rust | static tables in `canon/src/**` from `@webref` + dialect overlays (`overlay/aliases.ts`, `prefixes.ts`, …) | fail-closed join; `// @generated`; "do not hand-edit" |
| `modules/typegen` | Rust → `.d.ts` | token unions, `StyleProps`, `SystemStyleObject` from `BaseSystem` + canon | committed goldens, refresh only with `TYPEGEN_UPDATE_GOLDENS=1`; explicitly does not generate `css()` |
| `NativeRuntimeArtifact` | Rust → runtime data | `styled/runtime-data.mjs`, inlined into `react.mjs` by `sync/react.ts` | already the runtime's data channel |
| `atomic/js/generated/` | Rust → TS types | reserved slot for `ts-rs` struct output | — |

So "a second codegen surface" was the wrong objection in the earlier
draft. The compiler already emits runtime data; richer data in the same
artifact is the same surface. What would be *new* is emitting executable
text, and that is exactly the `ATM-FORBID-04` line — the only line that
matters here.

### Three things "generate the runtime namer" can mean

| Kind | Rust emits | Removes | Does not remove | Cost | Doctrine |
|---|---|---|---|---|---|
| **1. Data** | namer tables: lookups + lowerings + keyword sets (§5) | rule drift for every table-shaped rule: prefixes, aliases, longhand shapes (`trbl` / `trio` / `pair`), `flex` rewrites, `outline: none`, `border: true`, `size`, `textGradient`, `container`, weight keywords, border / outline style sets, line-width keywords, length units, math functions, CSS-wide keywords, runtime-owned props, breakpoints, conditions, fonts — **~13 of the 20 naming rules** | the procedures below | `runtime/tables.rs` grows; a ~50-line lowering interpreter in JS | FORBID-04 verbatim. **Do this.** |
| **2. Text** | the runtime namer printed into the artifact (Panda's `css.js`) | package skew (sheet and namer from one binary); split custody | the second implementation of each procedure — the JS is human-written text in a Rust string or `include_str!`, and the compiler cannot run it to check it (`ATM-FORBID-02`); the builtin divergences | a JS printer; an emitted-JS gate (tsc + Biome over output); a worse authoring surface unless the text is a checked-in `.js`; FORBID-04 amended | amends a `[forbidden]` pin. **Not by default** — D6 gets custody and lockstep without it. |
| **3. Source** | one definition, two backends (a DSL for the procedures, or Rust→JS transpile) | the second implementation — the only kind that does | nothing, if done; but the DSL needs strings, chars, state machines, predicates, **and its own number model**, or it inherits two hosts' float semantics and the point is lost | a language and two generators for nine procedures | **Rejected.** The generator would be larger than what it generates and would carry the same divergences. |

### Procedures that stay authored

Each has a named compiler function, one runtime function, and one namer
golden (`ATM-SEAM-08`).

| # | Procedure | Compiler function |
|---|---|---|
| 1 | whitespace collapse, quote-aware, alternation-only quotes | `normalize.rs::collapse_whitespace` |
| 2 | finite decimal parse → canonical render, `0`/`-0` → `0` | `unit.rs::canonical_numeric_string`, `resolve_numeric_value`; `builder.rs::r_object_to_atom_value` (`$r` integer collapse) |
| 3 | `!` / `!important` strip, marker re-appended after sanitize | `css.ts::splitImportant` today; `name/mod.rs` |
| 4 | paren-depth token split | `parser.rs::split_tokens` |
| 5 | border token classification: style → width → color, first of each kind wins | `parser.rs::ParsedShorthand::assign_token`, `is_length_width` |
| 6 | shorthand whole-value gates: zero, `none`, CSS-wide, `var()`, `borders.` / `outlines.` | `border.rs::is_zero_value`, `is_whole_value`; `dimensional.rs` global-keyword branch |
| 7 | when → segment: `base` skipped, `_` stripped, ranges raw, `[` + trim + spaces→`_` + `]` for at-rules and `&` selectors, bare `@supports` refused | `conditions/mod.rs::lower_when`, `bracket_segment`, `is_bare_query_rule` |
| 8 | slot: canonical, `when` joined by `:`, `@bp` suffix | `builder.rs::derive_slot` |
| 9 | shaping: responsive arrays (index → breakpoint, `null` skips), per-prop objects (breakpoint keys → `@bp`, other keys → nested `when`), `$token` → path, dedupe by lookup key | `builder.rs::resolve_array`, `resolve_object`, `json_to_atom_value` |

The dimensional 1/2/3/4-token → TRBL mapping is **not** on this list: it is
a fixed index table (`[[0,0,0,0],[0,1,0,1],[0,1,2,1],[0,1,2,3]]`) and
travels as the `trbl` shape in the lowering table.

### Where drift survives a mirror: builtin divergences (verified against the source)

None of the three kinds above touches this table. Goldens do. This is the
argument for D8 and for naming the lexical functions in Rust so the
contract is a function, not a `std` default. Each row becomes one lexical
function on both sides (`resolve/lexical.rs`, `namer/lexical.ts`), one
golden, and one compiled case in `ATM-NAME-08`.

| Rust call in the class path | JS a port reaches for | Where they disagree | The mirror must |
|---|---|---|---|
| `str::parse::<f64>` (`unit.rs`, `parser.rs::is_valid_numeric_str`) | `Number(s)` | JS accepts `0x10`, `0b1`, `0o7`, `""` → `0`, `"  "` → `0`; Rust accepts `inf` / `infinity` / `nan` (non-finite, refused anyway) and rejects all the JS forms | gate with one explicit decimal grammar on both sides; never bare `Number()` |
| `f64::to_string` (`canonical_numeric_string`; `$r` render) | `String(n)` | exponent form at \|n\| ≥ 1e21 and 0 < \|n\| < 1e-6 (`1e-7` vs `0.0000001`); `-0` → `"-0"` vs `"0"` | one renderer (READY ask 2). Recommend: shortest round-trip, never exponent, `-0` → `0`, refuse magnitudes outside `[1e-6, 1e21)` as `NonCanonicalNumeric` — Rust moves off `to_string` onto an explicit `render_decimal` |
| `char::is_whitespace` (`collapse_whitespace`) | `/\s/` | Rust has U+0085; JS has U+FEFF | one explicit set, shipped or pinned by golden |
| `sanitize_class_value` maps only ` ` `\t` `\n` (`escape.rs`) | `.replace(/\s/g, '_')` | `\r` and NBSP survive in Rust (inside quotes, where collapse left them) | mirror the three-character set |
| `to_ascii_lowercase` / `eq_ignore_ascii_case` (`parser.rs`, `border.rs`, `conditions/mod.rs`) | `.toLowerCase()` | non-ASCII (`İ`, `ẞ`) | ASCII-only fold |
| `str::trim` | `String#trim()` | U+FEFF, U+0085 | explicit set |
| `serde_json::Map` iteration in `resolve_object` | `Object.entries` | **agrees today only because `base-system/Cargo.toml` enables `serde_json/preserve_order` and cargo unifies features** (`cargo tree -e features -i serde_json`, verified). Drop that flag and Rust iterates sorted while `mergeStylePlans` class order is insertion order — `width: { md, base }` reorders silently | enable `preserve_order` in `atomic/Cargo.toml` explicitly; Rust test on author order (READY ask 10). Erratum (doom-5, 2026-09-20): the agreement fails for 2+ integer-like keys in non-ascending author order — V8 `[[OwnPropertyKeys]]` ascends them at object creation, before any namer code runs; the differential carves across members with within-member order pinned (report `.agents/doom/logs/2026-09-20-jettison-namer-key-order.md`, witness `ATM-NAME-08` intOrder) |
| `IndexMap` in `lower_font` (`def.css` extras) | object key order | agrees only if the emitted `fonts` table is ordered pairs; Slice 1's "sorted keys" applies to lookups, never to lowerings | arrays for lowerings (§5) |

One more, already caught while writing this section: §3 rule 2 said
`'01'` refuses. `unit.rs::from_string` canonicalizes it to `1` on any prop
that accepts bare numbers, and green station `ATM-UNIT-02` pins exactly
that. A hand-listed rule set is a third implementation, and it had
drifted inside this document before any JavaScript existed. Generate the
goldens from the Rust tests; do not hand-list the rules a second time.
(The §3 table stays as the human index of the rules — which Rust site,
which corpus family — and its permanent home is the runtime README; it
never carries expected outputs. Those are the goldens' job.)

### Custody (D6)

| Home | Custody | Lockstep with the sheet | Doctrine |
|---|---|---|---|
| neo `src/runtime/css/namer/` (the earlier draft) | **split**: a change to `border.rs` is finished under `agent-rs`; its mirror is edited under `agent-neo` — two skills, two gates, two PRs unless someone remembers | package versions; skew caught only by the gate | FORBID-04 untouched |
| **`packages/reference-rs/modules/atomic/js/namer/`** → `@reference-ui/rust/namer` | **one crate**: `pnpm agentrs c atomic` and `pnpm agentrs v atomic` run the Rust, the runtime namer, and the goldens together; one PR touches `border.rs`, `namer/shorthand.ts`, and the golden. Precedent: `atomic/js/plans.ts` + `vitest.config.ts` (`js/**/*.test.ts`) already live there; tsup already builds `modules/atomic/js/index.ts` into `dist/atomic.mjs` | same npm version as the N-API binary that printed the sheet; `sync/react.ts` inlines it into `react.mjs` exactly as it inlines `runtime-data.mjs` (`runtimeHeaderSource`) | FORBID-04 untouched: the package ships JS as it ships `atomic.mjs`; the compiler writes only data |
| Rust prints it into the artifact (kind 2) | one crate | **per compile** instead of per package — the marginal case is an app compiling with one installed `@reference-ui/rust` and importing the namer from another, which sync already prevents | amends FORBID-04; needs the printer and an emitted-JS gate |

In every home: `namer.rulesVersion` in the tables, `NAMER_RULES_VERSION`
in the JS, `registerRuntimeData` throws on mismatch, and a Rust test ties
the constant to the namer goldens so a class-affecting change cannot land
without bumping it (the guard under `ATM-SEAM-08`).

### What this changes in the slices

- Slice 1 adds: `lowerings` and `keywords` in `NamerTables`;
  `preserve_order` pinned in `atomic/Cargo.toml`; the lexical functions
  named in Rust (`resolve/lexical.rs`: `is_structural_whitespace`,
  `trim_structural`, `parse_finite_decimal`, `render_decimal`,
  `ascii_lower`), with `unit.rs`, `normalize.rs`, and `parser.rs` calling
  them instead of `std` directly; the golden writer behind
  `NAMER_UPDATE_GOLDENS=1` writing `modules/atomic/tests/namer-goldens/*.json`;
  `namer_goldens_are_fresh` green.
- Slice 2 becomes: `modules/atomic/js/namer/{lexical,lower,shorthand,value,when,shape,slot,index}.ts`
  (D6 home), each ≤ 365 lines, each header naming its compiler function
  and its golden file; `ATM-SEAM-08` green before `NEO-NAMER-01` is
  attempted; a browser-safe `./namer` export (no N-API import) in
  `packages/reference-rs/package.json`.
- Slice 3: `css.ts` imports `@reference-ui/rust/namer`; the rules-version
  check lands in `registerRuntimeData`.

---

## Requirements (testable)

- **R1** No shipped artifact carries a per-atom row. `react.mjs`,
  `styled/runtime-data.mjs`, `system/baseSystem.mjs` contain no
  `stylePlans` key and no `className` strings from `@layer utilities`
  (`ATM-SEAM-06`, `NEO-SYNC-*` sweep).
- **R2** Artifact bytes are independent of atom count: same fixture ±500
  harvestable values → byte-identical `runtime` (`ATM-SEAM-07`).
- **R3** Differential: for every authored declaration in every ATM case
  input and in the lib compile, the runtime namer = the compiler namer's
  `stylePlans[i].declarations`, slot and className, in order
  (`NEO-NAMER-01`).
- **R4** Refused set: for every authored declaration the compiler refused,
  the runtime namer emits nothing or a class not present in the sheet
  (`NEO-NAMER-01`).
- **R5** Every pre-cutover Neo browser case passes with class strings
  equal to the plan-derived golden captured in Slice 0, except the
  re-pinned miss case (`NEO-NAMER-02`, existing `NEO-CSS-*` /
  `NEO-MERGE-*` / `NEO-RESP-*` / `NEO-COND-*`).
- **R6** Merge semantics unchanged: `css.test.ts`, `eviction.test.ts`,
  `plans.test.ts` pass against constructed declarations.
- **R7** Miss: miss class, no paint, one dev diagnostic naming prop and
  value; none in production (`NEO-NAMER-03`; `NEO-MERGE-06` re-pinned per
  D2).
- **R8** `CompileResult.stylePlans` equals the pre-cutover
  `runtime.stylePlans` for every ATM golden (no plan-builder drift).
- **R9** Error Correct proof output (`ATM-DIAG-*`) unchanged.
- **R10** Lib artifact sizes are RECORDED per slice in evidence
  (`jettison-00-baseline.md`, `jettison-03-sizes.md`) as informational
  data — raw and gzip-6 with the method noted; NO absolute bound is
  asserted in tests. The ENFORCEABLE property is R2 / `ATM-SEAM-07`
  atom-independence (bytes constant across atom counts). [HQ ruling
  2026-09-20: pinning sizes in tests is brittle. The 160 KB raw /
  26 KB gzip / 60 KB raw figures were estimates (527 − 420 plans +
  ~15–20 KB tables + ~10 KB namer; READY ask 5 set them from data),
  never pins, and the Slice-4 HOLDS-as-written note is retired.
  Informational datum 2026-09-20 (firsthand lib-sync re-measure):
  `react.mjs` 150,291 raw / 32,893 gzip-6 minified; `runtime-data.mjs`
  87,365 raw.]
- **R11** Quality gates: `pnpm agentrs q` on every touched Rust file
  (≤365 lines, complexity limits, no clippy allows); `pnpm agentneo q` on
  every touched TS file.
- **R12** `SPEC.md`, `src/runtime/README.md`, `docs/ATOMIC.md`,
  `packages/reference-neo/docs/DOMAIN.md`, and `docs/missions/README.md`
  say what the code does, in the Vocabulary's words (§7 table). The
  naming rules table (§3) and the builtin-divergence table (§9) are copied
  into `src/runtime/README.md`, which becomes their permanent home; this
  plan stops being cited for them.
- **R13** Function-level parity: every `tests/namer-goldens/*.json` file
  is regenerated by Rust and diffs clean (`namer_goldens_are_fresh`); the
  runtime namer reproduces every file (`ATM-SEAM-08`). Every builtin
  divergence in §9 has at least one golden row and one compiled case
  (`ATM-NAME-08`): numeric magnitudes on both sides of 1e21 and 1e-6,
  `-0`, `0x10`, `""`, U+0085, U+FEFF, `\r` inside quotes, non-ASCII case,
  per-prop object key order.
- **R14** Rules-version pin: `namer.rulesVersion` in the artifact equals
  the runtime namer's `NAMER_RULES_VERSION`; `registerRuntimeData` throws
  on mismatch; a golden change without a bump fails
  `namer_goldens_are_fresh`.
- **R15** No operation name in domain language: `rg -i jettison`
  over `packages/`, `SPEC.md`, `DOMAIN.md`, and `tests/cases/` returns
  nothing. Evidence filenames under `docs/evidence/` are exempt
  (`forge-ready-*` convention).

## Slices

Each slice ends green on `pnpm agentrs t` and `pnpm agentneo run`, and
lands as one commit. Reaper's slices (real compile and census; the pool)
live in [operation-reaper.md](operation-reaper.md) and are sequenced
after Slice 4.

### Slice 0 — oracle and red stations

- Capture the pre-cutover class-string golden for every Neo browser case
  (element → class list) into `packages/reference-neo/docs/evidence/jettison-00-baseline.md`
  with the three artifact sizes for lib.
- Surface `CompileResult.stylePlans`; leave `runtime.stylePlans` in place
  for now so nothing goes red yet.
- Add red shells: `ATM-SEAM-06..08`, `ATM-NAME-08` (case folders, folder
  name = SPEC ID), `NEO-NAMER-01..03` (each Neo case: `README.md`,
  `case.json`, `specs/`, `world/`, per the agent-neo skill; group
  `tests/cases/namer/` with `SPEC.md` + `TESTS.md`). The Cargo
  `namer_goldens_are_fresh` test is a guard under `ATM-SEAM-08`, not a
  station.
- `DOMAIN.md`: add the Vocabulary entries now, so the red shells and the
  code that turns them green share the words.
- Files: `assembly.rs`, `lib.rs` (`CompileResult`), `contracts/types.ts`
  + fixtures, `tests/cases/ATM-SEAM-0{6,7,8}`, `tests/cases/ATM-NAME-08`,
  `tests/cases/namer/NEO-NAMER-*`, `packages/reference-neo/docs/DOMAIN.md`.

### Slice 1 — namer tables, lowerings, lexical functions, schema 2

- `runtime/tables.rs` (new): build `NamerTables` from canon +
  `BaseSystem` + the atomic constants (§5, §9 kind 1). Lookups sorted;
  lowerings ordered (arrays). `rulesVersion` starts at 1.
- `resolve/lexical.rs` (new): the six lexical functions [Slice-4 correction 2026-09-20: five→six] (§9 divergence
  table); `unit.rs`, `normalize.rs`, `parser.rs` call them.
  `render_decimal` implements the READY-ask-2 rendering. `preserve_order`
  enabled explicitly in `atomic/Cargo.toml` with a test on
  `resolve_object` author order.
- Golden writer: `cargo test` regenerates `tests/namer-goldens/*.json` in
  memory and diffs; `NAMER_UPDATE_GOLDENS=1` rewrites. One file per
  procedure and per lexical function, plus a divergence-probe generator
  (R13). `namer_goldens_are_fresh` green.
- `NativeRuntimeArtifact` → `{ schema_version: 2, namer, recipes, style_prop_names }`.
  `stylePlans` leaves the artifact; `PlanBuilder` output goes to
  `CompileResult.stylePlans` and to `proof::render_session`.
- Re-point the 64 ATM specs, `atomicGauges`, `atomic/js/plans.ts`, the
  contracts fixtures, `PortableBaseSystem.runtime`.
- `ATM-SEAM-06` and `ATM-NAME-08` green. Neo is red from here until
  Slice 3 (the runtime still indexes plans that are gone) — Slices 1–3
  land together or Slice 1 keeps a temporary `stylePlans` passthrough
  behind a compile option that Slice 3 deletes. Watcher's call; the
  passthrough is the safer default.

### Slice 2 — the runtime namer

- `packages/reference-rs/modules/atomic/js/namer/{lexical,lower,shorthand,value,when,shape,slot,index}.ts`
  (D6 home; the neo path if D6 goes the other way), each ≤ 365 lines,
  each with a header paragraph naming its compiler function and its
  golden file. `lexical.ts` mirrors `resolve/lexical.rs` (the six
  lexical functions [Slice-4 correction 2026-09-20: five→six], no procedures); `lower.ts` is the interpreter over
  `NamerTables.lowerings`; the nine procedures of §9 map as `value.ts`
  1–3 (whitespace collapse, numeric canon, `!` strip), `shorthand.ts` 4–6
  (token split, border classification, whole-value gates), `when.ts` 7,
  `slot.ts` 8, `shape.ts` 9. `index.ts` composes them as `name()` and
  exports `NAMER_RULES_VERSION`.
- Browser-safe `./namer` export in `packages/reference-rs/package.json`
  and a tsup entry (`modules/atomic/js/namer/index.ts` → `dist/namer.mjs`);
  no N-API import on that path.
- `ATM-SEAM-08` green first (every golden file, under
  `pnpm agentrs v atomic`), then `NEO-NAMER-01` differential green over
  all ATM inputs + lib. Every naming rule (§3) has at least one corpus
  case; every rule 2–3 numeric boundary is pinned on both sides.
- No `css.ts` change yet; the runtime namer is tested standalone.

### Slice 3 — cut over `css()`

- `css.ts`: `collectEntries` feeds `name()` (imported from
  `@reference-ui/rust/namer`) instead of the index; `mergeStylePlans`
  consumes constructed pairs; `registerRuntimeData` requires
  `schemaVersion: 2` and `namer.rulesVersion === NAMER_RULES_VERSION`
  (R14). Delete `createStylePlanIndex`, `resolveScoredDeclarations`,
  `findStylePlanMisses`, `serializeLookupKey` from the runtime (they stay
  in `atomic/js/plans.ts` for stations).
- Dev miss per D2 (`namer/miss.ts`, browser-only under A).
- Remove the Slice 1 passthrough. `publishRuntimeBundle` /
  `patchBaseSystemRuntime` / `react.ts` type-only changes.
- Re-pin `NEO-MERGE-06`. `NEO-NAMER-02/03`, `ATM-SEAM-07` green. Record
  lib sizes in `jettison-03-sizes.md` (R10).

### Slice 4 — pins and prose

- `SPEC.md`: FORBID-03 wording, GHOST-01 note, GHOST-02 retitle;
  `ATM-SEAM-06..08` under "Engine Parity & Scale" and `ATM-NAME-08` under
  "Class Naming & Character Hygiene" in the proof table.
- `src/runtime/README.md` takes the naming rules table and the
  builtin-divergence table as their permanent home; `docs/ATOMIC.md`
  ("Two artefacts, one namer", "Runtime"), `packages/reference-neo/PLAN.md`
  D4/D5 rows, `docs/missions/README.md`, `DOMAIN.md` re-checked (R12, R15).
- Doom brief seed: "find a request the runtime namer and the compiler
  namer spell differently."

## Acceptance

Done when R1–R15 hold, `pnpm agentrs t` and `pnpm agentneo run` are
green, lib `pnpm sync` produces the R10 size record for the slice, and
the Doom seed above has run one brief without a differential break.
Reaper's acceptance is its own.

## READY-phase asks (read-only; answer in `packages/reference-neo/docs/evidence/`, then HQ flips GO)

1. **Naming-rules completeness.** Walk `resolve/` and `runtime/builder.rs`
   and confirm §3 lists every site where the emitted class stem or
   prop differs from `canonical(prop)` + `sanitize(authored)`. Name any
   rule missing. In particular: `gradient.rs` token interpolation, the
   `r` named-container form, `--*` custom props (prefix = the prop
   itself; leading `-` escaped in the selector only), and `Number` values
   on unitless vs dimensional props (same stem, different CSS).
2. **Numeric rendering seam.** Enumerate finite numeric spellings where
   Rust `f64::to_string` and JS `Number#toString` differ (`1e21`, `1e-7`,
   `-0`, long decimals). Propose the one rendering both sides adopt and
   which side changes.
3. **Miss-warning consumers.** List every spec, CT, or lib test that
   asserts `css()` returns `''` on a miss or asserts a node-side miss
   warning. Decide D2 with that list.
4. **`stylePlans` consumers outside the counted set.** Anything under
   `packages/reference-lib`, `packages/reference-core`, `matrix/`, or
   `.agents/` reading `runtime.stylePlans` or `baseSystem.runtime`?
5. **Namer tables size.** Emit the v2 tables for lib once and record raw
   / gzip, the per-table breakdown, and how the numbers were produced in
   the ask's evidence file, so the recorded sizes come from data, not the
   estimate in §3 (~15–20 KB raw incl. `stylePropNames` overlap). The
   prototype code is disposable; the evidence file must let someone redo it.
6. **CSSOM probe feasibility.** In the Neo world harness, confirm
   `document.styleSheets` exposes `@layer utilities` rules for the linked
   `styles.css` (same-origin) and that a lazy `Set` build over 2.2k and
   34k rules costs milliseconds, not frames.
7. **Names (D9).** The Vocabulary terms and their spellings —
   `NamerTables`, `LowerStep`, `lowerings`, `rulesVersion`,
   `NAMER_RULES_VERSION`, `namer/`, `namer-goldens/`,
   `NAMER_UPDATE_GOLDENS`, `resolve/lexical.rs`, `namer_goldens_are_fresh`,
   `ATM-SEAM-06..08`, `ATM-NAME-08`, `NEO-NAMER-*`, group `namer` — zero
   collisions in `DOMAIN.md`, `SPEC.md`, `tests/cases/`, and current
   identifiers (a 2026-09-20 sweep found none; re-run at GO). Confirm
   "lexical" does not collide with Neo's **primitives** (JSX hosts) the
   way the earlier draft's `primitives.ts` did, and that "golden" is
   acceptable for a Rust-generated file the JS side reads (DOMAIN.md
   retires the word for *Neo's* proof, not for rs).
8. **Rules-to-data audit (D7).** For each §3 rule, say whether it is
   data (goes in `lowerings` / `keywords`) or procedure (stays in §9),
   and fix the exact `LowerStep` shape from that list. Confirm the
   procedures are ≤ nine and that `container` (`true` / `''` / `'name'`),
   `outline: none`, and `border` (string trio vs `true` macro) are
   expressible as guarded steps rather than code.
9. **Lexical inventory (D8).** Every `std` call in the class-affecting
   chain (§9 first table) whose semantics the runtime namer would inherit
   — parse, render, whitespace class, case fold, trim, container iteration
   order — with the JS default it must *not* use. Extends the §9
   divergence table or confirms it is complete, and fixes the lexical
   function list (five today).
10. **`preserve_order`.** Confirm feature unification from `base-system`
    is the only reason `resolve_object` preserves author order today, and
    that pinning it in `atomic/Cargo.toml` changes no golden.
11. **Package plumbing (D6).** Confirm `sync/react.ts` can inline
    `@reference-ui/rust/namer` the way `runtimeHeaderSource` inlines
    `runtime-data.mjs`, that a `./namer` export can be browser-safe (no
    N-API loader on its import graph), and that `pnpm agentrs v atomic`
    picks up `js/namer/**/*.test.ts` unchanged.

## Done when (later)

A DONE line can say: the shipped map is gone (three artifacts), the
namer is one algorithm in two implementations — every table-shaped rule
written once by Rust as namer tables, the nine procedures and six
lexical functions [Slice-4 correction 2026-09-20: five→six] mirrored beside the Rust they mirror and held equal by
namer goldens (`ATM-SEAM-08`, `ATM-NAME-08`) and the differential
(`NEO-NAMER-01`) — and the lib `react.mjs` size is on record for the
slice (R10). The sheet's size, the census, and the pool lever are
[Reaper](operation-reaper.md)'s DONE line, not this one. Until then this
operation is: drop the catalog because the namer is ours; harvest stays;
a miss is a miss class, not a ghost.
