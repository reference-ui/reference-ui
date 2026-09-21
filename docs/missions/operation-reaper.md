OPERATION: GO

# Mission: Operation Reaper — size the harvest sheet, then decide the pool

Status: `ready` (HQ 2026-09-20). Split out of Operation Seize on
2026-09-20; the other half — dropping the shipped per-atom map — is
[Operation Jettison](operation-jettison.md). This is the research and
doctrine plan for harvest's size, not an implementation. Sequenced after
Jettison: once the map is gone, `styles.css` is harvest's only O(atoms)
artefact and its size is a sheet-size question, not a bundle-size
question. The READY-phase asks at the end can run now; do not budget the
harvest floor until Jettison has landed and Slice 1 here has a number.
HQ writes `OPERATION: GO` after both.

Signal protocol (line 1 of this file): `OPERATION: READY` = the plan has
enough context for research agents to challenge it; `OPERATION: GO` = the
watcher starts implementation, slices in order.

Predecessor: [Forge](completed/operation-forge.md) Part I (harvest
doctrine: the pool, the kind gate, the authorship rule) and
[Jettison](operation-jettison.md) (the map). Domain:
[`docs/ATOMIC.md`](../ATOMIC.md), harvest section. Lib-Book harvest
check:
[forge-ready-02](../../packages/reference-neo/docs/evidence/forge-ready-02-harvest-size.md)
(~1.8k gross wants).

Every number below marked **verified** was re-measured against the tree
on 2026-09-20 (canon tables, harvest sources). The M-series numbers are a
model and are bounds, not a compile; the model is specified completely
under Method (Part I) so this file is all anyone needs to rebuild it.
Slice 1 replaces the bounds with a compile and commits the evidence.

## The claim

Harvest size is `pool × kind-compatible sinks`, at rest. Conditions do
not copy the pool: `_hover` / `_focusVisible` move the sheet only when
people dynamize values *inside* those objects. A messy enterprise sheet
with a full sink vocabulary and a merely-large pool lands around
**~1–2 MB raw / ~150–200 KB gzip**; 3 MB raw takes ~1,000 distinct loose
CSS strings, which is ridiculous. Behind the size question sits one
doctrine question: whether a string the walk already bound as a complete
style leaf should also feed the pool (Part II, D1).

## Order of work

1. **Real compile and census** (Slice 1), after Jettison lands. CSS, then
   gzip, on a real compile; sink census; pool census split leaf-only vs
   unbound.
2. **Then decide the pool** (D1). Walk-owned literals as pool fuel is a
   doctrine question with a measurement in front of it, not a bug.
3. **Then, only if D1 signs, Slice 2.**

## What this is not

- Not dropping harvest. Not shrinking the kind gate. Not "stop minting."
  A value the program never wrote still gets no rule in the sheet.
- Not the map. The shipped per-atom `stylePlans` and the runtime namer are
  Jettison; nothing here touches `NativeRuntimeArtifact` or `css()`.
- Not a sink filter. "Filter sinks, live with the sheet, or leave H2
  alone" is the lever named in "Done when", chosen from Slice 1's numbers,
  not a slice of this plan.
- Not a Chakra `Box`. Rest-spreads are not sinks. Nested `_hover` /
  `_focusVisible` with **literal** values are site-walk atoms (one class
  each), not a harvest multiplier. M500₃ / M500₄ / M500₇ below are the
  counterfactual, kept so nobody plans around them.

---

# Part I — Messy enterprise sheet (CSS, then gzip)

After Jettison, harvest size is the **utility sheet** only.

```text
classes ≈  Σ  (pool values of kind K) × (sinks of kind K)
           K
```

A sink is a unique `(prop, when)` the walk refused as dynamic
(`harvest/sinks.rs`: the six `Dynamic*` codes; `gap`/`offset`, unknown
props, and `variant`/`colorMode` filtered at record time). 200 files with
`paddingRight={x}` is one sink. `pr` twins `paddingRight`. Rest-spreads
(`css(props)`) are **not** sinks. Numbers are not in the pool.
`borderBottom={x}` is a color sink; px does not land there.

### Harvest and conditions (ATM-HARVEST-03)

Harvest **copies the sink's `when`** (`mint/mod.rs::push_harvested`). It
never invents a condition, and it does **not** duplicate a rest-harvested
color onto `_hover` / `_focusVisible` because those keys exist.

```ts
const palette = ['#444']

css({ color })                                    // sink (color, []) → harvest fills rest
css({ color: 'red', _hover: { color: 'blue' } })  // static: two walk atoms, no extra harvest
css({ _focusVisible: { color: shade } })          // sink (color, ["_focusVisible"]) only if shade is dynamic
```

So `_hover` and `_focusVisible` **do not move harvest size** unless people
dynamize values *inside* those objects. The fuse is which **props** are
holes × the pool. M500₃ / M500₄ / M500₇ below are the counterfactual
"every rest hole is also a hole under those `when`s." That is not this
product.

### What "messy" means here

- **Pool 300 and 500** distinct wholesale strings harvest can pick up
  (complete CSS / rhythm only: px/rem/%/`r`, hex/rgba/oklch/named,
  `url()`, `translateX()`, CSS-wide keywords. Not `'flex'`, not
  `'gray.800'`, not `'hello'`).
- **Every canonical StyleProp is a hole** (1,073 `CANONICAL_PROPERTIES`,
  **verified**). Kind gate still applies (**verified** table sizes):

  | Kind | Sinks that accept it | Table |
  |---|---:|---|
  | Length (px, rem, `%`, `r`, math) | 52 | `canon/css/values/classify.rs::LENGTH_PROPERTIES` |
  | Color | 71 | `canon/css/color.rs::COLOR_PROPERTIES` |
  | Url | 6 | `URL_PROPERTIES` |
  | Transform | 1 | `transform` |
  | `inherit` / `initial` / `unset` / `revert` / `revert-layer` | **1,073** | CSS-wide |
  | `auto` / `none` | 133 / 124 | `harvest/mint/validity.rs` (css-tree probed) |

  500 values do **not** become 500 × 1,073 classes. A hex never mints onto
  `width`. CSS-wide keywords *do* mint onto every hole — that term is in
  the numbers (~5 × 1,073).

- Aliases (`bg`, `p`, `mt`) twin; they do not add classes.
- `when`: **not a harvest multiplier on this product.**

Pool mix (sums to 300 / 500):

| Total | Length | Color | `url()` | Transform | CSS-wide | `auto` | `none` |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 300 | 173 | 110 | 6 | 4 | 5 | 1 | 1 |
| 500 | 281 | 190 | 12 | 10 | 5 | 1 | 1 |

Measured **CSS only** (no plans). Namer `reference-ui__`, selector
escape, hover `:is(:hover, [data-hover])`, `md` in one grouped
`@container`. gzip-6 and brotli-11. **Model, not a compile** — see Method.

| Id | Pool | `when` | Classes | CSS raw | **gzip-6** | brotli-11 |
|---|---:|---|---:|---:|---:|---:|
| **M300** | 300 | rest | 22,468 | 1,561,214 | **165,455** | 89,987 |
| **M500** | 500 | rest | 33,806 | 2,395,791 | **249,341** | 130,121 |
| M500₃ | 500 | rest, `_hover`, `md` | 101,418 | 8,404,381 | 766,325 | 395,155 |
| M500₄ | 500 | + `_focusVisible` | 135,224 | 12,693,287 | 1,034,734 | 537,976 |
| M500₇ | 500 | rest, `_hover`, `_focusVisible`, `_focus`, `_active`, `_disabled`, `md` | 236,642 | 23,531,645 | 1,826,247 | 931,391 |

Mean ~70 B/class at rest, ~83–99 B once condition stems and `:is()`
wrappers land.

### How to read it

**Our shape is rest-like: M300 / M500, not M500₇.** Harvest size is
unique **prop holes** × the kind-compatible pool. **M500 (2.4 MB raw /
249 KB gzip)** is the fat rest bound: 500 loose values × every
kind-compatible canonical prop as a rest hole (71 color props including
`msScrollbar*`, 1,073 keyword holes). Even that is pessimistic on sinks
(nobody names `animationDelayEnd={x}`). A messy app that dynamizes the
human surface against a merely-large pool sits **well below** this band.

**M500₇ (23.5 MB / 1.83 MB gzip)** is a helper that names the entire
StyleProps bag as identifiers inside every `when`. We do not have that
Box. Do not plan around 23.5 MB.

### How realistic

| Piece | Realistic messy app? |
|---|---|
| ~300–500 distinct px / hex / rgba / `r` in source | Already fat. Real apps repeat `'16px'` (pool stays 1). Token paths are not in the pool. **~1,000 distinct wholesale strings is ridiculous.** |
| Scatter of named holes: padding/margin/width, `color` / `bg` / `borderColor` / `borderBottomColor` / `fill` / `stroke` / `outlineColor` | Yes. That is enterprise. |
| All **71** color props as holes | No. Human surface is ~25–31. |
| All **1,073** props as holes so `inherit` mints everywhere | No. |
| Rest surface **copied** under six `when`s | Rare. People dynamize **a few** props under those. |

### To hit ~3 MB raw utilities (rest, no `when` copy)

~71 B/class → **~42k classes** → 3.0 MB raw, **~300 KB gzip**.

| Sinks | Loose values (split) | Classes | Raw | gzip |
|---|---|---:|---|---|
| 52 length + 31 color | 400 px-like + 250 colors (**650**) | 28.6k | **2.0 MB** | ~206 KB |
| 52 + 31 | 500 + 350 (**850**) | 36.9k | **2.6 MB** | ~265 KB |
| 52 + 31 | **~580 + ~390 (~970)** | 42.3k | **3.0 MB** | ~305 KB |
| 52 + 71 (whole canon color table) | ~380 + ~310 (~700) | 42.3k | **3.0 MB** | ~305 KB |

3 MB is a **what-if**, not a planning number. A full sink vocabulary with
a merely-messy pool stays around **~1–2 MB** raw / **~150–200 KB gzip**.

If we **kept** `stylePlans`, add ~177 B × classes of JSON on top (~6 MB
raw at M500 rest; ~42 MB at M500₇) — in `react.mjs`. That is Jettison's
cut.

Lib today (not enterprise, **verified**): 2,223 utilities, sheet 243 KB
raw / 32 KB gzip whole file. Forge-ready-02: ~1.8k gross harvest wants,
1 color sink + 9 length sinks. Lib is not this shape.

### Method (the model, complete)

This is the whole recipe. Nothing outside this file is needed to rebuild
the M-series table; a fresh Node script written from these bullets
reproduced every byte count on 2026-09-20 (`M300` 1,561,214 / 165,455 /
89,987; `M500` 2,395,791 / 249,341 / 130,121). Class counts are also
closed-form: `M300 = 173×52 + 110×71 + 6×6 + 4×1 + 5×1,073 + 1×133 +
1×124 = 22,468`; `M500 = 281×52 + 190×71 + 12×6 + 10×1 + 5×1,073 + 133 +
124 = 33,806`; the `when` variants multiply by the number of `when`s
(3, 4, 7).

**Sinks** — read from the tree, never typed in:

| Kind | Sinks | Source (verified 2026-09-20) |
|---|---:|---|
| canonical (CSS-wide keywords land on all) | 1,073 | every `Property::new("prop", "css", "prefix")` in `canon/src/css/properties.rs`; `css` is the rule's property name, `prefix` the class prefix |
| color | 71 | `COLOR_PROPERTIES` in `canon/src/css/color.rs` |
| length | 52 | `LENGTH_PROPERTIES` in `canon/src/css/values/classify.rs` |
| url | 6 | `URL_PROPERTIES`, same file |
| transform | 1 | `transform` |
| `auto` | 133 | `AUTO_PROPS` in `atomic/src/extract/harvest/mint/validity.rs` |
| `none` | 124 | `NONE_PROPS`, same file |

**Pools** — deterministic generators, so the byte shape is fixed:

- Length(*n*), *i* = 1..*n*, first rule that matches: `i % 17 == 0` →
  `(i/16).toFixed(3) + 'rem'`; `i % 13 == 0` → `i + '%'`; `i % 11 == 0`
  → `i + 'vh'`; `i % 19 == 0` → `i + 'r'`; else `i + 'px'`. *n* = 173
  (M300: 127 px, 10 rem, 13 %, 14 vh, 9 r) and 281 (M500).
- Color(*n*), *i* = 0..*n*−1: `i < 15` → the named list `red navy teal
  olive maroon silver gray aqua lime fuchsia rebeccapurple
  cornflowerblue darkslategray transparent currentColor`; `i < 15 +
  floor(0.4n)` → `'#' + (i*9973).toString(16).padStart(6,'0').slice(-6)`;
  `i < 15 + floor(0.7n)` → `rgba(i%256, 3i%256, 7i%256,
  ((i%10)/10).toFixed(1))`; else `oklch((0.2 + (i%50)/100).toFixed(2)
  (i%20)/50 i%360)`. *n* = 110 (M300: 15 named, 44 hex, 33 rgba, 18
  oklch) and 190 (M500: 15 / 76 / 57 / 42).
- Url(*n*): `url(/assets/a{i}.svg)`, *n* = 6 / 12. Transform(*n*):
  `translateX({i}px)`, *n* = 4 / 10. CSS-wide: `inherit initial unset
  revert revert-layer`. `auto`. `none`.

**Cross and bytes:**

- For each `when` in the scenario, then each kind: every sink of that
  kind × every pool value of that kind, one rule each, in sink order then
  pool order; kinds in the order length, color, url, transform, CSS-wide,
  `auto`, `none`.
- Class `reference-ui__{stem}`; stem `{prefix}_{sanitize(value)}` at
  rest, `{when}:{prefix}_{sanitize(value)}` under a condition, with
  `when` spelled `hover`, `focus-visible`, `focus`, `active`, `disabled`,
  `md`. `sanitize` maps space, tab, newline to `_`. Selector escape as
  `stylesheet/name/escape.rs`: allowlist `[A-Za-z0-9_-]`, every other
  character `\`-escaped, a leading digit or `-` hex-escaped with a
  trailing space.
- Rule text `{selector} { {css}: {value}; }`, one per line, inside
  `@layer utilities {\n … }\n`. Conditioned selectors: `_hover` →
  `.{class}:is(:hover, [data-hover])`, `_focusVisible` →
  `:is(:focus-visible, [data-focus-visible])`, `_focus`, `_active`,
  `_disabled` likewise. `md` rules are plain selectors collected into one
  `@container (min-width: 768px) { … }` block at the end of the layer,
  joined by newlines.
- Scenarios: `M300` = pool 300 × `[rest]`; `M500` = 500 × `[rest]`;
  `M500₃` = `[rest, _hover, md]`; `M500₄` = `+ _focusVisible`; `M500₇` =
  `[rest, _hover, _focusVisible, _focus, _active, _disabled, md]`.
- Sizes: Node `zlib.gzipSync(buf, { level: 6 })` and
  `zlib.brotliCompressSync(buf, { params: { BROTLI_PARAM_QUALITY: 11 } })`
  over the UTF-8 sheet.

**Not a compile.** No oxc, no twin skip, no shorthand expand. Gross
harvest pairs. Real sheets also contain static site atoms and
`@layer tokens`. Parse/CSSOM time not measured. The model's output is
disposable; the recipe above is the record. Slice 1 replaces the bounds
with a compile and commits the evidence.

---

# Part II — Walk-owned literals and the pool (decide after measuring)

`css({ color: '#00aeff' })` is an easy extractable. The site walk minted
`"color:#00aeff"`. Today the string `'#00aeff'` also enters the **pool**
(`harvest/literals.rs` collects every `StringLiteral` and hole-free
template), so a `borderColor` hole mints `borderColor:#00aeff`. Twin skip
(`mint/twins.rs`) only stops a *second* `color:#00aeff`.

The proposed rule — a string the walk already bound as a complete
`(prop, value, when)` leaf does not enter the pool *from that site* —
would cut those classes. It is also a **change to Forge's authorship
rule** ("define the values somewhere in your source"): an author who
wrote `'#00aeff'` only as a static `color` leaf and later passes it
through a `borderColor` hole would miss where today they paint. That is
a doctrine call (D1), and its size effect is bounded by how many pool
values exist *only* as static style leaves — likely small: in lib the
big pool contributors are token definitions (`colors.ts`, 216 `oklch()`),
which are not style leaves and would pool either way.

Order: Slice 1 census first (count pool values that are leaf-only vs
also unbound), then D1, then — if signed — Slice 2 with station
`ATM-HARVEST-06`: static `css({ color: '#00aeff' })` plus a `borderColor`
hole does **not** mint `borderColor:#00aeff` unless `'#00aeff'` also
appears unbound; `ATM-HARVEST-01` still holds for array-only palettes.
Size models count net-new pool, not every literal in source.

---

## Requirements (testable)

- **R1** `reaper-01-real-compile.md` exists in
  `packages/reference-neo/docs/evidence/` with, for the Slice 1 fixture:
  class count; `styles.css` raw / gzip-6 / brotli-11; `react.mjs` raw /
  gzip (O(1) in atoms after Jettison — lib's number give or take the
  tables); sink census `(prop, when, kind)`; pool census by kind split
  **leaf-only vs unbound**; net-new vs gross; all beside the M300 / M500
  bounds.
- **R2** CSSOM parse time for the fixture sheet and for M500, in Node
  (`css-tree`) and in Chromium (Playwright), recorded in the same file.
- **R3** The fixture is committed and compiles green under
  `pnpm agentrs t`; every census number is reproducible from the compile
  output, and every M-bound from the Method recipe in this file. Nothing
  the evidence cites lives outside the repository.
- **R4** If D1 signs: `ATM-HARVEST-06` green; `ATM-HARVEST-01..05`
  unchanged; twin skip (`mint/twins.rs`) unchanged.
- **R5** Quality gates: `pnpm agentrs q` on every touched Rust file
  (≤365 lines, complexity limits, no clippy allows).
- **R6** `docs/ATOMIC.md` harvest section and `docs/missions/README.md`
  say what the code does, including the D1 answer either way.

## Slices

Each slice ends green on `pnpm agentrs t` and lands as one commit. Slice 1
is research and commits evidence; Slice 2 is gated on D1.

### Slice 1 — real compile and census (Part I; research, commits evidence)

- Fixture: primitives + `css()` with a scatter of named StyleProp holes
  (color, bg, borderColor, borderBottomColor, fill, stroke, outlineColor,
  padding/margin/width family) and whatever wholesale strings the fixture
  naturally writes. Compile. Record: classes, `styles.css` raw / gzip-6 /
  brotli-11, `react.mjs` raw / gzip, sink census `(prop, when, kind)`,
  pool census by kind **split into leaf-only vs unbound** (feeds D1),
  net-new vs gross (infos already count net-new).
- CSSOM parse time of that sheet and of M500 in Node (`css-tree`) and
  Chromium (Playwright). M500₇ optional.
- Output: `reaper-01-real-compile.md`. Compare to M300/M500 as bounds.

### Slice 2 — walk-owned literals out of the pool (Part II; only if D1 signs)

- `extract/harvest/literals.rs`: the walk reports the spans of complete
  leaves it bound; the pool visitor skips string nodes at those spans.
  Twin skip stays.
- `ATM-HARVEST-06` green; `ATM-HARVEST-01..05` unchanged; `ATOMIC.md`
  harvest section updated.

## Acceptance

Part I is done when `reaper-01-real-compile.md` exists with a compile's
numbers beside the M-bounds (R1–R3). Part II is done when D1 is answered
and, if signed, Slice 2 is green (R4–R6).

## READY-phase asks (read-only; answer in `packages/reference-neo/docs/evidence/`, then HQ flips GO)

1. **Fixture shape.** Define "messy enterprise" for Slice 1 as a fixture,
   not an adjective: which canonical props are holes (the human surface —
   color, bg, borderColor, borderBottomColor, fill, stroke, outlineColor,
   the padding / margin / width family), how many distinct wholesale
   strings of each kind the fixture naturally writes, and why it is not
   lib's shape (1 color sink + 9 length sinks). Propose the folder.
2. **Census tooling.** What the compiler already exposes for the sink
   census `(prop, when, kind)` and the pool census by kind (Forge's infos
   count net-new); what Slice 1 still needs, and whether that is a compile
   option, a diagnostics fact, or a test-only reader over `CompileResult`.
3. **Leaf-only vs unbound, read-only.** Whether `extract/harvest/literals.rs`
   and the site walk can report today — without Slice 2's change — which
   pool strings are bound only as complete `(prop, value, when)` leaves.
   D1 wants that number before any code moves.
4. **CSSOM harness.** Node `css-tree` and Playwright Chromium timing over a
   2.2k-rule and a 34k-rule sheet; whether the Neo world harness already
   loads a linked `styles.css` we can time (shares Jettison ask 6).
5. **Model check.** Rebuild the model from the Method recipe against the
   current prefixes and escaper and confirm ~70 B/class at rest still
   holds; the class string does not change under Jettison, but say so
   with a number. If the recipe and the table disagree, the table is
   wrong: fix the table in this file.
6. **Names.** `Operation Reaper`, `ATM-HARVEST-06`, `reaper-NN-*.md` —
   zero collisions in `DOMAIN.md`, `SPEC.md`, current identifiers, and
   the doom logs.
7. **Sequencing.** List what in Slice 1 actually needs Jettison landed
   beyond the `react.mjs` number. If nothing, HQ may let the sheet
   measurements run in parallel and fill the `react.mjs` cell last.

## Done when (later)

A DONE line can say: here is a real compile's CSS gzip and CSSOM parse
beside the M-bounds, here is the sink and pool census with the leaf-only
share, D1 is answered, and here is the lever (sink filter, live with the
sheet, or leave H2 alone). Until then Reaper is: harvest stays; harvest
size is pool × kind-compatible sinks at rest; 3 MB raw would take ~1,000
distinct loose CSS strings, which is ridiculous; `_hover` /
`_focusVisible` do not copy the product.
