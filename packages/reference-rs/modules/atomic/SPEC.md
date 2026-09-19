# Atomic Style Engine SPEC

Current freeze, cases, and proof. Design narrative: [README.md](./README.md).
Sequencing: [PLAN.md](./PLAN.md) (stations) and [../../PLAN.md](../../PLAN.md) § Reference UI (host).
Mandate and architecture: [REFERENCE_SYSTEM.md](../../../../docs/archive/REFERENCE_SYSTEM.md), [atomic.md](../../docs/atomic.md), and [PANDA.md](./PANDA.md) (vendor example / process map).

Harness / Runner: `pnpm agentrs c atomic` (Cargo unit tests) | `pnpm agentrs v atomic` (Vitest seam tests)

## 1. Job of the Crate

The `atomic` style engine compiles authored StyleProps, `css()` calls, and component recipes into a deterministic atomic stylesheet and a runtime class map using a single shared namer. It takes input sources (TSX, JSX, TS, JS) and, upon contract completion, a design system definition (`BaseSystem`); it emits two synchronized artifacts—a package-scoped six-layer stylesheet (`styles.css` nesting `@layer reset, global, base, tokens, recipes, utilities;` inside `@layer <system>`) and a runtime lookup map (`css` mapping `[when:]prop:value` to compiled utility class names)—accompanied by compiler diagnostics. It must not evaluate author JavaScript at compile time, must not emit hashed whole-object class names, must not maintain a second namer between the stylesheet and runtime, must not generate executable `css.js` code files, must not collect `tokens()` (owned by JavaScript fragments), must not emit `StyleProps` TypeScript interfaces (owned by typegen), and must not own React DOM primitives such as `Div` or `Button`.

## 2. Legend & Status

- `[x]` Proven by a dedicated `tests/cases/<ATM-*>` folder whose name **is** the SPEC ID (`ATM-COND-04`). Standing gauges on every station prove `ATM-GHOST-01`, `ATM-LAYER-01`, `ATM-FORBID-06`, `ATM-ORDER-05`, and `ATM-ORDER-06`.
- `[ ]` Specified; no dedicated case folder. **Cargo `#[test]` is not a tick.** Code in `src/` is not proof.

Audit: 2026-09-15. Folder name equals SPEC ID. Combined stations were split (`ATM-COND-02`/`03`/`04`, `ATM-LEAF-01`/`02`/`03`, `ATM-SITE-02`/`03`, `ATM-SHORT-01`/`02`, `ATM-RHYTHM-01`/`02`/`03`/`05`). One folder, one ID, one `spec.ts`.

### Status counts

| Metric | Count |
| :--- | :--- |
| Engine | Functional pipeline (extract → atom → stylesheet + class map). `compile()` takes `Option<BaseSystem>`; omitted uses `BaseSystem::lib_fixture()`. `staticCss` is a third want source. `src/recipes` emits closed `recipe()` classes in `@layer recipes` plus a variant table on `CompileResult`. JSX extract calls styletrace and gates on traced names plus `@reference-ui/react` imports. `css()` / `recipe()` extract only from those imports. |
| Total contract cases | 213 |
| Named `[x]` proven | 209 |
| Remaining `[ ]` | 4 (`ATM-DIAG-04`, `ATM-DIAG-06`, `ATM-GHOST-04`, `ATM-PERF-01`) |
| Cargo `#[test]` | 251 (internal; not ticks) |
| Vitest seam stations | 208 (`tests/cases/<ATM-*>`) |

A tick means a station folder exists and is green. It does **not** mean the
station proves the whole written claim. A 2026-09-15 read of all 73 `spec.ts`
files against their SPEC prose graded roughly 32 STRONG, 35 WEAK (asserts part of
the claim, often a single `toContain`), and 8 MISMATCHED (proves something other
than the claim). The weakest are called out inline on the cases below. Two
examples of MISMATCHED, both material: `ATM-ATOM-01` says importance is part of
atom identity but its input contains no `!`, so the split is unproven; and
`ATM-GHOST-03` says the sheet is "exactly the six-layer preamble" while the
golden is 407 lines, because the lib fixture always prints its token layer.

### 2026-09-15 audit: shape is proven, semantics are not

The first 75 stations prove the **pipeline shape** — a want was extracted, an
atom was named, a rule was printed. They do not ask whether the emitted CSS
*means* what the author wrote. A review against `vendor/panda` found four live
defects that the suite blesses in committed goldens:

| Defect | Evidence | New owner |
| :--- | :--- | :--- |
| Breakpoint at-rules used to sort lexicographically, so `md` (768px) overrode `2xl` (1536px). Closed: `CascadeKey` ranks parsed `min-width` ascending. | `stylesheet/cascade.rs`; `ATM-ORDER-01` / `ATM-COND-01` | `ATM-ORDER-01` (landed) |
| `.2xl\:p_6r` used to be an invalid digit-leading selector. Closed: `escape_css_selector` is an allowlist with a hex escape for a leading digit or dash (`.\32 xl\:p_6r`). | `stylesheet/name/escape.rs`; `ATM-COND-01` / `ATM-NAME-06` | `ATM-NAME-06` (landed) |
| `<Div border />` used to emit `border: true;`, which every browser drops. Closed: `Atom` holds `CssValue` (no Bool/Null); leftover boolean wants are dropped with a diagnostic. | `atom/value.rs` `CssValue`; `ATM-ATOM-02` / `ATM-SITE-09` | `ATM-VALID-02` (landed) |
| The namer is not injective. Unrecognised `_` conditions used to wrap illegally (`&:nope`) while `p`/`padding` still collapse onto one prefix. Unknown `_` keys now fail closed (`ATM-COND-12` / station `ATM-GHOST-04`). Dual at-rule wraps nest in author order (`ATM-GHOST-05`). | `atom/when.rs`; `stylesheet/cascade/mod.rs` | `ATM-GHOST-04` (LEAF-05 remains) |

Two structural causes, both of which the new areas are designed to close:

1. **The cascade sorter is built.** `stylesheet/cascade.rs` sorts by `CascadeKey`
   (bucket → at-rule kind and parsed width → pseudo rank →
   `canon::property_cascade_rank` → ties) and groups shared at-rule wrappers.
   `ATM-GHOST-05` (nested dual at-rules) is closed. `ATM-SHORT-07` (paren-depth) is closed.
2. **Nothing checks that the output is CSS.** There is no CSS parser in the repo —
   no `lightningcss`, `postcss`, or `css-tree` in `node_modules`, no parser crate in
   `Cargo.lock`. `ATM-GHOST-01` now walks `css-tree` class selectors inside
   `@layer utilities` (no TypeScript escaper). Owner: `VALID`, `ATM-FORBID-06`.

### Breakdown by Area

| Area | Meaning | Total | Proven `[x]` | Remaining `[ ]` |
| :--- | :--- | :--- | :--- | :--- |
| `GHOST` | Zero ghost class invariants & injective namer (P0) | 5 | 4 | 1 |
| `SITE` | Style extraction sites (JSX, calls, spreads, constants, imports) | 58 | 58 | 0 |
| `LEAF` | AST leaf literal extraction & branch flattening | 10 | 10 | 0 |
| `WANT` | Raw styling intention IR (`Want`) & serialization | 2 | 2 | 0 |
| `ATOM` | Atom representation, values, hashing, & `AtomSet` | 5 | 5 | 0 |
| `RHYTHM` | Spatial rhythm formulas & multi-value pass-through | 5 | 5 | 0 |
| `SHORT` | Shorthand decomposition without `currentColor` reset | 9 | 9 | 0 |
| `COND` | Conditions, media queries, pseudo-classes, & patterns | 31 | 31 | 0 |
| `TOKEN` | Token resolution, CSS vars, & BaseSystem ingest | 12 | 12 | 0 |
| `RECIPE` | Closed variant classes & variant lookup tables | 7 | 7 | 0 |
| `STATIC` | Static CSS want synthesis from BaseSystem | 3 | 3 | 0 |
| `LAYER` | Cascade layer order (`@layer`) & layer population | 13 | 13 | 0 |
| `NAME` | Deterministic class naming & selector escaping | 7 | 7 | 0 |
| `DIAG` | Diagnostics, location tracking, & fail-closed parsing | 6 | 3 | 3 |
| `FORBID` | Forbidden architectural patterns & tripwires | 7 | 7 | 0 |
| `ORDER` | Cascade rule ordering, determinism, & idempotence (P0) | 6 | 6 | 0 |
| `VALID` | Emitted CSS must parse and mean something (P0) | 3 | 3 | 0 |
| `MERGE` | Last-wins semantics across arguments, aliases, & duplicate keys | 3 | 3 | 0 |
| `UNIT` | Numeric value unit policy & canonical number form | 3 | 3 | 0 |
| `SEAM` | Rust ⇄ N-API artifact parity | 3 | 3 | 0 |
| `PERF` | Time, memory, & scale budgets | 1 | 0 | 1 |
| **Total** | | **190** | **184** | **6** |

`ORDER` and `VALID` are P0 alongside `GHOST`. A ghost class and a class whose
rule loses the cascade are the same bug from the author's chair: the style does
not apply. `GHOST` proved the name exists on both sides; `ORDER` proves the rule
wins; `VALID` proves a browser accepts it.

---

## 3. Pipeline

This crate is one compiler. Authors write StyleProps, `css()`, and `recipe()`
from `@reference-ui/react`. Compile emits a six-layer stylesheet and a class
map. One namer. No generated `css.js`.

| Pass | Home | Job |
| :--- | :--- | :--- |
| jsx / css / recipes | `src/extract/{jsx,css,recipes}`<br>`ATM-SITE-01`–`11` | JSX StyleProps, `css()`, `recipe()`. Styletrace gating is SITE-08. |
| staticCss | `src/static_css`<br>`ATM-STATIC-01`–`02` | Third want source from `BaseSystem`. `['*']` enumerates the property's token category. One AtomSet, one namer. |
| expressions | `src/extract/expressions`<br>`ATM-LEAF-01`–`09` | Flatten ternaries, spreads, arrays into wants. No JS eval. |
| resolve | `src/resolve/*`<br>`ATM-SHORT-*`, `ATM-RHYTHM-*`, `ATM-TOKEN-*`, `ATM-COND-*` | Rhythm, tokens, shorthands, conditions |
| atom | `src/atom`<br>`ATM-ATOM-*`, `ATM-WANT-*` | One `(prop, value, when)` = one Atom |
| recipes (emit) | `src/recipes`<br>`ATM-RECIPE-01`–`03` | Closed `recipe()` tables in `@layer recipes`. Extract of recipe style objects is `extract/recipes` / SITE-03. |
| stylesheet | `src/stylesheet`<br>`ATM-LAYER-*` | Six layers: `reset, global, base, tokens, recipes, utilities` |
| order | `src/stylesheet` (sorter)<br>`ATM-ORDER-*`, `ATM-VALID-*` | Cascade sort key + output validity. **Specified in `stylesheet/README.md`, not yet built.** |
| runtime | `src/runtime`<br>`ATM-GHOST-01`–`03`<br>`ATM-MERGE-*` | `CssRuntime` map for authored `css()`; last-wins merge |

Panda's process crates and file-level call sites: [PANDA.md](./PANDA.md).
Their names are examples. Our author API is `css()` and `recipe()`.

## 3b. Example: Panda job → our ID → refuse

| Panda crate / job | Vendor files | Our module & ID | Take | Refuse |
| :--- | :--- | :--- | :--- | :--- |
| `pandacss_extractor` (sites) | `extract.rs`, `jsx.rs`, `calls.rs`, `matcher.rs` | `src/extract/{jsx,css,recipes}`<br>`ATM-SITE-01`–`11` | JSX attrs, `css()`, `recipe()` (they also extract `cva` / `sva`) | Vue / Svelte / Astro, `include` globs as a substitute for styletrace, PascalCase guessing (`matcher.rs`), config `jsx` name arrays |
| `pandacss_extractor` (leaves) | `literal.rs`, `style_tree.rs`, `pure_fn.rs`, `scope.rs` | `src/extract/expressions`<br>`ATM-LEAF-01`–`09` | AST walk, branch collection, ternary flattening | `expression_to_literal` JS evaluator, folding `undefined` to `Null` |
| `pandacss_encoder` | `Atom`, `process_atomic`, `FxHashSet` dedup | `src/atom`<br>`ATM-ATOM-01`–`04`<br>`ATM-WANT-01`–`02` | `(prop, value, conditions)` records, dedup | Their `Literal` IR, hashed whole-object classes |
| `pandacss_utility` | `format_class_name`, `normalize.rs`, `runtime_class.rs` | `src/resolve/*`<br>`src/stylesheet/name`<br>`ATM-SHORT-*`, `ATM-NAME-*` | Shorthand expand, one namer | Host JS `transform()` callbacks (split-brain class names) |
| `pandacss_recipes` | `Recipe`, `SlotRecipe`, compound | `src/recipes`<br>`ATM-RECIPE-01`–`03` | Closed variant tables, compound matching | Baking host StyleProps into the recipe class; their `sva` slot-recipe helper as an author API |
| `pandacss_stylesheet` | `compile.rs`, `layers.rs`, `grouped.rs`, `emitter.rs` | `src/stylesheet`<br>`ATM-LAYER-*` | Layer preamble, CSS emit, media nesting | LightningCSS, `split_css` zoo, their five-layer list (ours is six) |
| `pandacss_codegen` | `artifacts/css/mod.rs`, `cva.rs`, `conditions.rs` | `src/runtime`<br>`ATM-GHOST-01`–`03` | Class map (`CssRuntime`) | `styled-system/{jsx,types,patterns,themes}` farm; we author `css()` / `recipe()` in core |
| `pandacss_tokens` | `from_config.rs`, `token.rs` | `src/resolve/tokens`<br>`ATM-TOKEN-01`–`05` | Path → `var(--...)`, color-mix opacity | Second OKLCH pipeline; token dict synthesis (tokens are JS fragments) |
| `pandacss_config` | `UserConfig`, hooks, plugins | `base_system::BaseSystem`<br>`ATM-LAYER-03`, `ATM-STATIC-01` | Tokens, conditions, recipe schemas | Hooks, plugin callbacks; input is a typed `BaseSystem` dump |
| `pandacss_project` | `Project`, `System`, watch caches | `src/lib.rs`<br>`ATM-GHOST-01`, `ATM-DIAG-01` | `sources + baseSystem → { stylesheet, css, diagnostics }` | Watch caches, WASM, Parcel; orchestration is the host |

---

## 4. Required Cases

### Zero Ghost Class Invariants (P0)

- [x] `ATM-GHOST-01` `[reference]` `[seam]` —
  **Every runtime class generated must exist with an identical selector in the emitted stylesheet.**
  Compile arbitrary sources containing StyleProps, `css()` calls, pseudo-conditions, and shorthands. Assert that for every class name present in the runtime `css.classes` map, an exact matching CSS selector exists in the emitted stylesheet under `@layer utilities`. The compiler uses one authoritative namer (`stylesheet::name::class_name`) for both outputs, completely eliminating ghost classes.
- [x] `ATM-GHOST-02` `[reference]` `[seam]` —
  **Runtime dictionary must provide bijective key lookup matching authored property and condition intentions.**
  Inspect the emitted `css.classes` dictionary generated from unconditioned, responsive, and pseudo-conditioned declarations. Assert that keys are deterministically indexed as `prop:val` or `when:prop:val` (e.g. `mt:2r` → `mt_2r`, `_hover:color:red.500` → `hover:c_red.500`). Assert that querying the runtime dictionary with authored properties returns the exact class name printed in the stylesheet without transformation skew.
- [x] `ATM-GHOST-03` `[reference]` `[seam]` —
  **Empty baseline input must emit pure layer preambles with an empty runtime class dictionary.**
  Compile an empty project or virtual source containing no style declarations. Assert that the generated stylesheet contains exactly the six-layer preamble (`@layer reset, global, base, tokens, recipes, utilities;\n`) with no utility rules. Assert that `css.classes` is an empty dictionary and `diagnostics` is empty, proving baseline purity.
- [ ] `ATM-GHOST-04` `[reference]` `[seam]` —
  **The namer must be injective: two atoms that differ in any identity field must never share a class name, and no condition may be silently erased from a name it still wraps.**
  Station `ATM-GHOST-04` compiles `css({ _nope: { color: 'red' }, color: 'red' })`: the unknown condition warns and emits no utility, the sibling still compiles as `c_red`, and the sheet has no `:nope` wrap. That closes the unrecognised-condition collision. The standing gauge still compares `atomCount` to distinct `css.classes` values on every station; `ATM-LEAF-05` is quarantined (`INJECTIVITY_QUARANTINE`) because `p` and `padding` collapse onto one prefix. This case stays open until that list is empty. Lowering is `When` on `Atom.conditions` (`atom/when.rs`); `Want.when` stays authored strings.
- [x] `ATM-GHOST-05` `[reference]` `[seam]` —
  **Every at-rule condition on an atom must reach the stylesheet, or the atom must fail closed with a diagnostic.**
  Station `ATM-GHOST-05`. Nested `sm: { … }` object keys are not extract conditions; the station uses `_osDark` plus array slot 1 (`sm`) so the atom carries two at-rule `When`s. Both wraps print nested in author order (`@media (prefers-color-scheme: dark) { @container (min-width: 640px) { .osDark\:sm\:c_red } }`), and the class name lists both segments. `first_at_rule` (`stylesheet/cascade/mod.rs`) is only the sort key; emit walks every Media/Container wrap. First-match is forbidden.

### Cascade Order, Determinism & Idempotence (P0)

Rule *order* is a correctness property, not a diff-stability nicety. Two atoms of
equal specificity are resolved by document order, so a sorter that does not
understand query magnitude, pseudo precedence, or shorthand/longhand nesting
emits CSS that contradicts the authored intent. `stylesheet/README.md` already
specifies this sort key; these cases make it provable.

- [x] `ATM-ORDER-01` `[reference]` `[seam]` —
  **At-rule blocks must be ordered by resolved query magnitude, not by the lexicographic order of the query string.**
  Station `ATM-ORDER-01`. `@container` min-width blocks emit 640 → 768 → 1024 → 1280 → 1536. `@media` max-width blocks emit descending. `CascadeKey` parses millipx from the wrap string (`em`/`rem` × 16). Nested `sm: { … }` object keys are not extract conditions; this station uses array slots plus authored `@media (max-width: …)` keys. `ATM-COND-01` also asserts ascending min-width.
- [x] `ATM-ORDER-02` `[reference]` `[seam]` —
  **Rules must be bucketed unconditioned first, then selector-conditioned, then at-rule-wrapped.**
  Station `ATM-ORDER-02`. Unconditioned `color`, then `_hover`, then `sm` `@container`. Selector-conditioned rules never print before the unconditioned rule for the same property.
- [x] `ATM-ORDER-03` `[reference]` `[seam]` —
  **Pseudo-class conditions of equal specificity must emit in a declared precedence order, not alphabetically.**
  Station `ATM-ORDER-03`. Authored alphabetically (`_active` first); emitted order is `hover` → `focus` → `focusVisible` → `active` → `disabled`.
- [x] `ATM-ORDER-04` `[reference]` `[seam]` —
  **Property priority must order shorthands before the longhands they contain, so a longhand utility always wins.**
  Station `ATM-ORDER-04`. `.bd-c_gray.800` precedes `.bd-b-c_red.500` and `.p_1r` precedes `.pt_2r` in both authorship orders. Rank is `canon::property_cascade_rank`.
- [x] `ATM-ORDER-05` `[reference]` `[seam]` —
  **Compiling identical input twice must produce byte-identical artifacts.**
  Compile the same case directory twice in one process and assert `stylesheet`, `css.classes`, and `diagnostics` are byte-for-byte equal. Run this as a standing gauge on every station rather than a single fixture. `AtomSet` is an `FxHashSet` (`atom/set.rs:13`) whose iteration order is insertion-dependent, so any code path that reads the set without sorting can leak that order into output.
- [x] `ATM-ORDER-06` `[reference]` `[seam]` —
  **Output must be independent of source-file discovery order.**
  Compile a multi-file case, then compile it again with the file list reversed, and assert both artifacts are byte-identical. `collect_sources` sorts by path (`lib.rs:127-131`) after a sorted `scan_dir` walk (`lib.rs:150-159`), so `read_dir` order cannot leak. Without this, `css.json` diffs churn between developers and CI even though no source changed.

### Emitted CSS Validity (P0)

`ATM-GHOST-01` asks whether a class name appears as a class selector under
`@layer utilities`. It does
not ask whether the browser can parse the rule it appears in. Two of the four
audit defects are invisible to substring matching and visible to any CSS parser.

- [x] `ATM-VALID-01` `[reference]` `[seam]` —
  **The emitted stylesheet must parse without error, and every generated selector must be a valid selector.**
  Run a real CSS parser over `result.stylesheet` on every station as a standing gauge, asserting zero parse errors, and additionally validate each generated class selector in isolation. Assert that layer nesting, at-rule wrapping, and escaping all survive a round trip. The gauge is `atomicGauges` (`tests/helpers.ts`) over `testing/css.ts`, and the golden writer refuses invalid CSS outside `css-quarantine.ts`. The parser choice, the two-tier design, the `var()` caveat, and the measured findings are settled in [testing.md](./testing.md) — that document owns the harness, this case owns the claim.
- [x] `ATM-VALID-02` `[reference]` `[seam]` —
  **A declaration value must always be valid CSS; `true`, `false`, and `null` must never reach the stylesheet.**
  `Atom.value` is `CssValue` (String / Token / Number) — Bool and Null are not variants. `Want.value` remains `AtomValue` and may be Bool (`<Div border />`). Resolve is the boundary: the `border: true` macro lowers to `border-width: 1px` plus `border-style: solid` (RS-19); leftover Bool pairs warn naming the property and emit zero atoms; Null pairs drop silently (Panda parity, NEO-CSS-05). `ATM-SITE-09` still proves Bool extraction via `hasWant(..., 'border', true)`. `ATM-ATOM-02` asserts the stylesheet does not contain `border: true`.
- [x] `ATM-VALID-03` `[reference]` `[seam]` —
  **Selector escaping must never leak into a declaration value.**
  Compile a token path that does not resolve (`css({ color: 'ghost.white' })`) and a value containing parentheses and slashes (`css({ color: 'oklch(0.5 0.1 200)' })`). Assert the class selector escapes `.` `(` `)` `/` while the declaration value stays raw. Panda emits `color: ghost\.white` here (`vendor/panda/crates/pandacss_stylesheet/tests/atomic.rs:357`), which is a bug we should not copy — escaping is a selector concern only.

### Merge & Last-Wins Semantics

Atomic utilities compose by concatenation, so "which class wins" is decided by
the runtime map for a call, not by the stylesheet. That makes merge order a
compiler contract.

- [x] `ATM-MERGE-01` `[reference]` `[seam]` —
  **Multi-argument `css()` must resolve to the last value per property in the runtime class string while the stylesheet still carries every atom.**
  Compile `css({ margin: '1r' }, { margin: '3r' })`. Assert that `@layer utilities` contains both `.m_1r` and `.m_3r`, because another call site may need either, and that the class list this call resolves to contains only `m_3r`. Emitting both classes for one element leaves the outcome to stylesheet order, which is exactly the ambiguity `ATM-ORDER-*` exists to remove.
- [x] `ATM-MERGE-02` `[reference]` `[seam]` —
  **Property aliases and duplicate keys within one object must collapse to the last authored value.**
  Compile `css({ bg: 'n100', background: 'n200' })` and `css({ color: 'red.500', padding: '1r', color: 'blue.500' })`. Assert each pair resolves to a single winning class (`bg_n200`, `c_blue.500`) and that sibling properties are unaffected. Aliases that canon maps to one CSS property must be recognised as the same key for merge purposes, not treated as two independent utilities.
- [x] `ATM-MERGE-03` `[reference]` `[seam]` —
  **An array argument to `css()` must be a merge list, never a responsive array.**
  Compile `css([{ margin: '1r' }, { margin: '3r' }, false])`. Assert both objects emit unconditioned atoms, that `false` is skipped without a diagnostic, and that no breakpoint condition is applied to any of them. Confusing this with the responsive-array form (`ATM-LEAF-05`) silently moves styles to a breakpoint the author never wrote.

> **Merge note (RS-9): responsive-expansion eviction.** Responsive values (arrays per `ATM-LEAF-05`, per-prop objects per `ATM-COND-17`) expand one authored declaration into several cascade slots: the engine (`runtime/builder.rs`, `derive_slot`) stamps breakpoint members as `[cond ':']* canonical '@' bp` (`width@base`, `width@md`) while a scalar alias lands on the bare slot (`width`). Distinct slots never collide under plain last-wins, so without eviction `css({ width: { base: '50px', md: '60px' }, w: '70px' })` would print all three classes and leave base width to stylesheet order. The runtime (`js/plans.ts` `mergeDeclarations`, mirrored by Neo `src/runtime/css/plans.ts`) therefore merges by slot *family* with overlapping breakpoint coverage: a later bare declaration evicts every earlier slot in its family, and a later `@bp` member evicts the earlier bare slot plus same-`@bp` members, leaving other breakpoints and other condition families untouched. Both directions hold — a later alias evicts the earlier expansion, and a later expansion evicts the earlier alias. The `@` suffix parses as the text after the LAST `@` only when that `@` sits after the last `:` (see `splitSlot`), because `r`-condition families such as `@container (min-width: 300px):p` carry a leading `@` of their own. Non-breakpoint object keys (`_hover`) slot as nested `when` parts (`hover:width`), identical to the `_hover: { … }` block form. Proved by station `ATM-COND-17` (both merge directions through compiled plans) and `tests/merge-eviction.test.ts` (slot grammar boundaries).

### Numeric Values & Unit Policy

- [x] `ATM-UNIT-01` `[reference]` `[seam]` —
  **A unitless number must take its property's unit policy: dimensional properties gain `px`, unitless properties do not, and zero stays bare.**
  Compile `css({ width: 42, opacity: 1, zIndex: 0, fontWeight: 700, lineHeight: 1.5, '--foo': 42 })`. Assert `width: 42px`; assert `opacity`, `zIndex`, `fontWeight`, `lineHeight`, and the custom property stay unitless; assert `zIndex: 0` emits `0` and not `0px`. The policy table belongs in `canon` beside the other property facts, never in a private atomic table (`ATM-FORBID-05`). Today `AtomValue::Number` prints verbatim, so `width={42}` emits `width: 42`, which browsers reject on a length property.
- [x] `ATM-UNIT-02` `[reference]` `[seam]` —
  **Numeric and string spellings of the same number must canonicalise to one atom.**
  Compile `css({ padding: 1 })` in one file and `css({ padding: '1' })` in another. Assert a single `.p_1` class and one rule. Assert that non-canonical numeric forms (`Infinity`, `NaN`, `0x10`) are refused with a diagnostic rather than emitted as idents.
  Station `ATM-UNIT-02` (SPEC-V2-79 arm, Overmatch Ph3). Compile `padding: '1e3'` beside bare `1000`, `opacity: '.5'` beside bare `0.5`, and `margin: '01'` beside bare `1`. Assert each pair lands on one class and one rule (`1000px`, `0.5`, `1px` — `'01'` now canonicalizes instead of refusing), while `Infinity`, `NaN`, and `0x10` still refuse with `NonCanonicalNumeric` warnings. Panda: `pandacss_stylesheet/tests/atomic.rs:239`.
- [x] `ATM-UNIT-03` `[reference]` `[seam]` —
  **Bare numbers in `globalCss` must unitize like `css()`: dimensional props gain `px`, unitless-stay props do not.**
  Station `ATM-UNIT-03` (RS-26 + tails-a). Compile `globalCss({ 'body > p, body > ul': { margin: 0, '& ~ &': { marginTop: 10 } } })`. Assert `margin-top: 10px`, `width: 42px`, and bare `z-index: 5`, `line-height: 2`, `opacity: 1`, `--foo: 42`, and `margin: 0`, with zero diagnostics. Numeric strings unitize identically (`.strs` arm); tokens still win on the stem when the scale holds the value.

- [x] `ATM-SITE-01` `[reference]` `[seam]` —
  **Style props on JSX tags that pass `canon::is_known_style_prop` must extract into wants.**
  Station `ATM-SITE-01`: `<Div mt="2r" bg="blue.500" />` and `<Button px="4r" />`. Does **not** prove styletrace gating (this station has no Reference import, so the empty host set keeps the pre-gate scan), boolean attrs, or origin metadata.
- [x] `ATM-SITE-02` `[reference]` `[seam]` —
  **Calls to `css()` and `css.object()` with single or multiple arguments must extract all style object properties.**
  Parse JavaScript/TypeScript call expressions targeting `css(...)`, `css.object(...)`, and internal alias `__reference_ui_css(...)`. Assert that every object argument in multi-argument calls is traversed and its properties are extracted into wants. Assert that conditional expressions passed as call arguments have both branches inspected. `css.object()` is the style-object return; those leaves are still utilities.
- [x] `ATM-SITE-03` `[reference]` `[seam]` —
  **`recipe()` / `recipe.raw()` calls must extract `base`, variant, and `compoundVariants[].css` leaves.**
  Station `ATM-SITE-03`. Those leaves compile as closed classes in `@layer recipes` (and the variant table), not as utility wants. Closed recipe classes are `ATM-RECIPE-01`–`03`.
- [x] `ATM-SITE-04` `[forbidden]` `[seam]` —
  **The extract surface is `css()` and `recipe()` only.**
  Station `ATM-SITE-04`. Unknown helpers (`sva`, `tw`, `cx`) produce no wants. The author API is `css()` and `recipe()` from `@reference-ui/react`.
- [x] `ATM-SITE-05` `[reference]` `[seam]` —
  **Object spreads inside JSX and `css()` arguments must unpack inline without losing sibling properties.**
  Encounter object expressions containing inline object spreads (`...{ margin: '10px' }`) and conditional spreads (`...(cond ? { padding: '10px' } : { margin: '20px' })`). Assert that properties from all spread branches are merged into extracted wants alongside sibling static properties. Assert that dynamic unresolvable spreads emit a diagnostic warning while keeping all resolvable sibling properties intact.
- [x] `ATM-SITE-06` `[reference]` `[seam]` —
  **Top-level local constants and style objects must be indexed and resolved at style extraction sites.**
  Station `ATM-SITE-06`. `const theme = { primary: 'n300' }` resolves at `color={theme.primary}` and `css({ color: theme.primary })`.
- [x] `ATM-SITE-07` `[reference]` `[seam]` —
  **Non-style attributes and hallucinated component primitives must be ignored during AST traversal.**
  Station `ATM-SITE-07`. `id` / `onClick` / `tabIndex` / `aria-label` never become wants and produce no diagnostics. Unrecognized PascalCase (`<Foo color="red" />`) without StyleProps is skipped without error.
- [x] `ATM-SITE-08` `[forbidden]` `[seam]` —
  **Style extraction must rely exclusively on styletrace and canon rather than guessing PascalCase tags or config name arrays.**
  Station `ATM-SITE-08`. `compile()` calls `styletrace::trace_style_jsx_names`. Tags extract when they are in that set or imported from `@reference-ui/react` / `@reference-ui/styled`. Local `<Foo mt="4r" />` does not extract. Honest subset: without synced `.reference-ui` primitive declarations, styletrace does not list `Div` as a traced export; file-local Reference imports are the host evidence this station can provide. Not a PascalCase regex or config jsx name array.
- [x] `ATM-SITE-09` `[reference]` `[seam]` —
  **Boolean style attributes (`<Div border />`) must extract as `AtomValue::Bool(true)`.**
  Station `ATM-SITE-09`. `attr.value` absent + `is_known_style_prop`.
- [x] `ATM-SITE-10` `[reference]` `[seam]` —
  **`css()` / `recipe()` extract only when the callee is the Reference import, not a shadowed local.**
  Station `ATM-SITE-10`. `function f(css) { css({ color: 'red' }) }` does not extract. Unknown `css` is not an extract site. Live `import { css, recipe } from '@reference-ui/react'` still extracts.
- [x] `ATM-SITE-11` `[reference]` `[seam]` —
  **Identifier spreads of a local const style object (`<Div {...base} />`, `css({ ...base })`) must unpack known keys.**
  Station `ATM-SITE-11`. File-top `const` objects unpack; inline object spreads remain `ATM-SITE-05`.
- [x] `ATM-SITE-12` `[forbidden]` `[seam]` — **[SPEC-V2-38, Overmatch Ph1]**
  **Tagged template literals must not be an extract site.**
  Compile ``css`color: red;` `` and `` styled.div`padding: 1rem` ``. Assert no wants are produced; a tag on a live `css` binding emits one located `tagged template is not a css() site; use css({...})` diagnostic (no-silence sweep, SPEC-V2-65), while a non-`css` tag stays silent. This is a named refusal rather than an accident of the walker: the object form is the only surface, so a template literal must never be parsed as CSS text.
- [x] `ATM-SITE-13` `[reference]` `[seam]` —
  **Styletrace gating must fail closed: an unavailable primitive graph is a diagnostic, not a licence to extract every tag.**
  Compile a project whose `styletrace::trace_style_jsx_names` call yields no names and whose sources import nothing from `@reference-ui/react`. Assert that a local `<Foo mt="4r" />` produces no wants and that a diagnostic reports the missing primitive graph. Assert the empty-project case still compiles clean. Station `ATM-SITE-13` (RS-5). Landing this resolved the **contradiction between `ATM-SITE-01` and `ATM-SITE-08`**: `allows_jsx_tag` no longer treats an empty host set as "scan every tag"; style-bearing JSX with no hosts resolvable is a missing-graph error once per file, and unknown tags under a known graph stay silent. Every station input that relied on the fallback now declares its primitive imports (outputs identical modulo import lines).

- [x] `ATM-SITE-14` `[reference]` `[seam]` —
  **The `css={{ … }}` JSX attribute must extract the same wants as a `css()` call.**
  Compile `<Div css={{ mt: '2r', _hover: { color: 'blue.600' } }} />` and assert the wants and emitted utilities match the equivalent `css({ … })` call exactly. Station `ATM-SITE-14` inputs both forms and asserts identical wants with one deduped class set.
- [x] `ATM-SITE-15` `[reference]` `[seam]` —
  **Binding identity must cover namespace imports and internal aliases, and must exclude type-only and default imports.**
  Compile `import * as R from '@reference-ui/react'; R.css({ … })`, the compiler-internal `__reference_ui_css(…)` / `__reference_ui_recipe(…)` aliases, `import type { css }`, and `import css from '…'`. Assert the first two extract and the last two produce no sites. Station `ATM-SITE-15` claims all four rules plus the internal recipe alias.
- [x] `ATM-SITE-16` `[reference]` `[seam]` —
  **Constants must resolve across files, and the source scan must respect its extension and directory boundaries.**
  Place a file-top `const theme` in `tokens.ts` and consume it at a site in `App.tsx`; assert the value resolves. Assert that a style inside `node_modules`, `dist`, or `.reference-ui` is not compiled and that a non-source extension (`.mdx`) is skipped. Station `ATM-SITE-16` proves the cross-file merge plus every skip boundary.
- [x] `ATM-SITE-17` `[reference]` `[seam]` —
  **Wants that arrive through indirection must emit one runtime style plan per want.**
  Ternary arms (`css({ color: flag ? 'red.500' : 'blue.500' })`), member access (`css({ color: theme.primary })`), and identifier spreads (`css({ color: 'amber.500', ...rest })`) already emit wants and utilities; assert they also emit one plan per want with `when: []`, each declaration naming an emitted utility class, and that the plan index resolves every leaf. Station `ATM-SITE-17` adopts `extract/site_plan_tests.rs` (RS-14). Whole-object `css(styles)` diagnoses in Ph1 (`ATM-SITE-50`) and resolves in Ph3 (SPEC-V2-65); the old "stays silent" note is revoked by the no-silence sweep.
- [x] `ATM-SITE-18` `[reference]` `[seam]` —
  **`<Div border />` must lower the boolean macro to `border-width: 1px` plus `border-style: solid`.**
  Compile `<Div border />` alongside `<Div color={true} />` and assert the border want emits both longhand utilities with one two-declaration plan the index resolves, while the color bool warns `` `color` value `true` is not valid CSS`` and mints nothing. Station `ATM-SITE-18` (RS-19).
- [x] `ATM-SITE-19` `[reference]` `[seam]` —
  **Array `css` props must extract every element like the `css([...])` call form.**
  Station `ATM-SITE-19` (RS-23). Compile `<Div css={[{ color: 'blue.300' }, { backgroundColor: 'green.300' }]} />` beside the single-object control. Assert both elements emit utilities with zero diagnostics.
- [x] `ATM-SITE-20` `[reference]` `[seam]` —
  **Unknown style keys must warn and drop on both paths: `css()` objects and `globalCss` declarations.**
  Station `ATM-SITE-20` (N12 ruling + tails-d). Compile `css({ fooBar, divideX, color })` with a `globalCss` hover rule carrying `divideX` and a const spread carrying `frobnicate`. Assert one located `Unknown style property` diagnostic per `css()` key including the spread key, one `Unknown style property in global CSS` diagnostic, and a sheet with only the known utilities — no silent swallows, no hyphenated dead properties. JSX attr/tag silence (SITE-07/08) stands: attrs share the DOM namespace, style objects do not.

- [x] `ATM-SITE-21` `[reference]` `[seam]` —
  **Ternary object arms in JSX `css`/condition props must compile every leaf of every arm.**
  Station `ATM-SITE-21` (RS-34). Compile `<Div _hover={on ? { bg: 'n200' } : { bg: 'n300' }} />` beside the nested Tabs shape (`guard ? (line ? { color, borderColor } : { color, bg }) : undefined`) and a `css={pick ? {...} : {...}}` control. Assert every arm's leaves emit hover/plain utilities with zero diagnostics, and the `undefined` arm stays silent.
- [x] `ATM-SITE-22` `[reference]` `[seam]` —
  **Member-expression tags must match concatenated hosts.**
  Station `ATM-SITE-22` (RS-36). Compile `<Overlay.Content minW="40r" bg="red" />` with `OverlayContent` hosted beside unhosted `<Accordion.Content p="4r" />`. Assert the member's leaves emit utilities (`min-width: calc(40 * var(--spacing-root))`) with zero diagnostics, and the unhosted member stays silent.
- [x] `ATM-SITE-23` `[reference]` `[seam]` —
  **Const-bound ternaries and logicals must extract every literal leaf with one plan per leaf.**
  Station `ATM-SITE-23` (RS-37). Compile the `BookShell.tsx` chrome shape (`const subtleBorder = isDark ? 'gray.800' : 'gray.200'` in a component body feeding `borderBottomColor={subtleBorder}`) beside top-level ternary, nested ternary, and logical `css()` controls plus a fully dynamic identifier. Assert one want and one runtime plan per leaf (both gray arms, all four call colors), `border-bottom-color` utilities for every shade, and exactly the fail-closed `unknownToken` warning.
- [x] `ATM-SITE-53` `[reference]` `[seam]` — **[SPEC-V2-75, Overmatch Ph1]**
  **An identifier in value position must resolve through its binding: the innermost declarator in scope, else the file's import binding, else dynamic.**
  Station `ATM-SITE-53` (Overmatch Ph1). Compile `a.ts` (`export const color = 'red'`) beside `b.ts` (`function Card({ color }) { return css({ color }) }`). Assert `color` in `b.ts` is a param → a located `Dynamic non-literal identifier` diagnostic and zero wants (never the silent `'red'` from `a.ts`, which today mints a ghost with no warning). Assert an inner `const` shadows an outer same-named `const` (innermost leaves only, no union bloat) and that two files declaring the same name never see each other's values through locals. Same-file const/member/spread resolution is unchanged; genuinely unbound names still consult the project bag, now retired behind the `ImportLookup` stub (`extract/scope/`, mission §7.2; the real binding walk is SPEC-V2-76). Panda: scope-correct by construction (`scope.rs:1349`, `:1369`).
- [x] `ATM-SITE-55` `[reference]` `[seam]` — **[SPEC-V2-76 identity rider S12, Overmatch Ph4]**
  **Site identity must follow consumer re-exports by binding, with zero config.**
  Station `ATM-SITE-55` (Overmatch Ph4). Compile wrapper modules (`export { css } from '@reference-ui/react'`, aliased, chained, local, star, default, recipe, and host variants) beside consumer-declaration, foreign-origin, cyclic, missing-export, unresolvable-specifier, and star-default twins. Assert every traced call and host extracts (10 wants, 9 plans, 2 recipe tables, zero diagnostics) and every miss is a silent non-site (SPEC-V2-38 precedent). The walk is relative-only; bare/aliased specifiers wait for the resolver (ATM-SITE-54). Panda: `importMap` replaced, not copied (`import_map.rs`, 13 tests).
- [x] `ATM-SITE-54` `[reference]` `[seam]` — **[SPEC-V2-76 Ph4 row 1, Overmatch Ph4]**
  **Specifiers must resolve (relative, `tsconfig` paths, extension/index probing, package `exports`) and two files declaring the same const name must never cross.**
  Station `ATM-SITE-54` (Overmatch Ph4). Compile `a.ts` (`export const gap = '4px'`) beside `b.ts` (`export const gap = '8px'`) with `App.tsx` importing from `b` and `Page.tsx` from `a`. Assert each importer's padding wants carry ONLY its own target's value (one `8px` want in `App`, one `4px` in `Page` — never the union), plus `@/tokens` through the input `tsconfig.json`, `./nested` to `nested/index.ts`, `./ui` to `ui.tsx`, and `theme-pkg/tokens` through the package manifest to `dist/shades.ts` (a target no direct subpath reaches). Assert six wants with six runtime plans and zero diagnostics. The `(path, export)` cache underneath is pinned by the walk's `repeated_lookups_replay_the_cache` unit test. Panda: `cross-file-resolution.md` (oxc_resolver ladder, `CachedFileExports`), `cross_file.rs:146`, `:442`.
- [x] `ATM-SITE-28` `[reference]` `[seam]` — **[SPEC-V2-35/02/53, Overmatch Ph1]**
  **A `let`/`var` with any assignment must drop to a diagnostic naming the write; unmutated `let`/`var` keep resolving.**
  Station `ATM-SITE-28` (Overmatch Ph1). Compile `let color = 'red'; color = 'blue'; css({ color })` beside `+=` compound, `++` update, member-root (`theme.primary = …`), and for-of-head write controls. Assert each mutated use yields zero wants plus one `Dynamic mutated binding '…'` warning naming the write (`reassigned at file:line:col`) — never the stale init. Assert unmutated `let`/`var` controls (SPEC-V2-02) and unmutated `export let` (SPEC-V2-53, cross-file arm via `tokens.ts`) resolve exactly like `const` with zero diagnostics, and that a mutated `export let` drops the same way. Const/member/spread resolution is otherwise unchanged; wants and authored plans stay 1:1 because the strip lives in the index both walkers read (`extract/constants/mutate/` per mission §7.2). Cross-file mutation poison is name-wide (fail-closed: over-drops, never stale-resolves) until SPEC-V2-76 lands the binding walk. Panda: `scope.rs:224` (`let_mutated_drops_resolution`), `:203`/`:241` (unmutated `let`/`var`), `cross_file.rs:502` (`export_let_currently_folds_too`).
  Station `ATM-SITE-28` (Overmatch Ph3 arms, SPEC-V2-34 object half). Compile `const emberTheme = { primary: ember }` over `const ember`, `{ ...cardBase, margin }` and last-wins `{ ...cardBase, color }` spreads, and an inline-object spread beside the unchanged Ph1 arms. Assert seven more wants with one runtime plan per unique leaf and zero new diagnostics — pure reads only, every source an unmutated const. Baked entries carry dep provenance and strip when their source is written (`extract/scope/value.rs`); station-level mutation interplay stays with the open Ph1 verdict. Panda: `cross_file.rs:242` (spread-of-const), `:291` (identifier value).
  Station `ATM-SITE-28` (mop-up arm, SPEC-V2-81). Compile `delete obj.prop` and computed `delete obj[k]` beside a spread control. Assert each deleted use drops with a diagnostic naming the delete (`deleted at file:line:col`, never `reassigned at`) with siblings kept; golden diff purely additive, 35/02/53 wording untouched.
- [x] `ATM-SITE-29` `[reference]` `[seam]` — **[SPEC-V2-24/31/34-chains, Overmatch Ph3]**
  **Multi-hop member reads, alias chains, and nested const spreads must resolve transitively.**
  Station `ATM-SITE-29` (Overmatch Ph3). Compile `tokens.colors.red` multi-hop reads, `...styles.hover` member-hop spreads, and `tokens!.color` `!`-unwraps beside scalar/object alias chains (`const b = a`) in declaration order and nested conditions plus responsive maps lowering through const spreads. Assert 20 wants with zero diagnostics, transitive resolution with whole-binding provenance, and inline-identical lowering for nested shapes. Misses keep the `DynamicMember`/spread vocabulary, cycles and forward refs stay valueless (runtime TDZ). Panda: `conditional_output.rs:655`, `scope.rs:286`, `conditional_output.rs:707`, `calls.rs:2024`, `cross_file.rs:265`, `:242`, `:291`.
- [x] `ATM-SITE-30` `[reference]` `[seam]` — **[SPEC-V2-08, Overmatch Ph1/Ph2]**
  **Unary `+`/`-` on numeric literals must fold at the literal.**
  Station `ATM-SITE-30` (Overmatch pin-before-narrow: filed before SITE-38 narrows the unary fallthrough). Compile `css({ margin: -4, opacity: -0.5 })` beside `css({ width: +50 })` and a `-0` control. Assert `-4`, `-0.5`, and `50` extract with one want and one runtime plan per leaf, `-0` canonicalizes to `0` on both sides, and zero diagnostics emit. Catalog entries 13 (static backticks: `` `red` `` folds as the plain string) and 36 (micro-fold bundle: shorthand, `css({})`, string-head, nested `cx`, no-arg) ride the same station number and landed as Ph2 arms (nine wants, nine plans, zero diagnostics). Panda: `calls.rs:1093` (`unary_negation_on_numeric_literal`), `:1110` (`unary_plus_on_numeric_literal`); backticks ``calls.rs:1194``; micros `scope.rs:262`, `calls.rs:224`, `:1697`, `:679`, `:1687`.
- [x] `ATM-SITE-31` `[reference]` `[seam]` — **[SPEC-V2-39, Overmatch Ph3]**
  **Closed pure helpers must fold at call sites; anything outside v2's fence must refuse with a located diagnostic.**
  Station `ATM-SITE-31` (Overmatch Ph3 row 6). Compile nullary/args/defaults helpers (defaults may reference earlier params), a `function` declaration, both IIFE spellings, index over param arrays, member reads over param objects, folded-test ternaries, multi-leaf capture passthrough, and object-return spreads into `css()` and JSX. Assert 42 wants with 28 unique runtime plans. Assert the fence edges — aliased callee, multi-statement body, `~` in the body, assignment in the body — each warn once with siblings kept, a reassigned callee names its write, and bare uncalled values never fold. The Ph4 cross-file arm (SPEC-V2-57) compiles imported arrow/decl/object-return helpers through the descriptor export, including a capture baked from a third file's export, and an imported impure helper refuses. Panda: `scope.rs:908`, `:927`, `:945`, `:986`, `:1030`, `:1073`, `:1085`, `:1184`, `:1208`; `cross_file.rs:1220`, `:1262`, `:1344`.
- [x] `ATM-SITE-38` `[reference]` `[seam]` — **[SPEC-V2-09/78, GAP-05b, Overmatch Ph1]**
  **Unary `-`/`+`/`!`/`~` must fold over literal and const-resolved numeric/boolean operands and refuse anything else with a diagnostic — never a dropped sign or a walked-through operand.**
  Station `ATM-SITE-38` (Overmatch Ph1). Compile `-space` over `const space = 4`, `+n`, `-theme.gap`, and `!flag` over const booleans beside multi-leaf (`-w` over a ternary const folds every leaf) and literal (`!true` → `false`, `~5` → `-6`) arms. Assert every fold emits one want per leaf and one runtime plan per resolvable leaf with zero extract diagnostics (folded bools are planless exactly like bare bools, SITE-18). Assert `-m`'s non-numeric leaf over a mixed-leaf const, `!` on strings, `~true` on a boolean, `typeof`/`delete`, and array/object operands each yield zero wants plus one `Dynamic unary expression …` diagnostic naming the operator — and that `!true` never emits `true`. Assert dynamic operands keep their existing vocabulary (unbound/mutated identifiers warn as today) and inline ternaries distribute (`-(pick ? 4 : 8)` → `-4`, `-8`). Assert TS non-null `!` is transparent in both walkers (`css({ width: '2r'! })` extracts plain `2r` with a plain plan — GAP-05b). Both walkers call the shared `extract/fold/unary.rs` node, so want/plan parity is structural. Panda: `calls.rs:1126` (`unary_logical_not_on_literal`), `literal-evaluator.md:51`; strings refuse where v2 coerces (S15).
- [x] `ATM-SITE-26` `[reference]` `[seam]` — **[SPEC-V2-06/07, Overmatch Ph1]**
  **`css()` args wrapped in parens / `as` / `satisfies` / `!` / `<T>` must extract like the bare arg.**
  Station `ATM-SITE-26` (Overmatch Ph1 no-silence sweep). Compile `css({...} as const)` beside paren-wrapped, `satisfies`, non-null `!`, and `.ts`-only `<any>` args plus the bare control. Assert every wrapped arg emits the bare arg's wants with one runtime plan per want and zero diagnostics; value-level `<any>` and `TSInstantiationExpression` unwrap the same way. Panda: `calls.rs:1001` (parens), `:1017` (`as const`), `:1033`+`:2000` (satisfies), `:1052` (`!`), `:1068` (`<any>`).
- [x] `ATM-SITE-37` `[reference]` `[seam]` — **[SPEC-V2-28 Ph1+Ph3, Overmatch Ph1/Ph3]**
  **Array spreads must refuse with a located diagnostic without shifting arity (Ph1); literal and const-array spreads must flatten in place (Ph3).**
  Station `ATM-SITE-37` (Overmatch Ph1 no-silence sweep). Compile `css({ padding: [1, ...dyn, 4] })` and the literal `...[2, 3]` twin beside merge-list `css([{...}, ...dyn, {...}])`. Assert every spread yields a located diagnostic: the value array yields zero wants (never shifts `4` a breakpoint early) with zero plans, while merge-list siblings still extract. Ph3 flattens literal / const-array spreads (SPEC-V2-63). Panda flattens literal (`calls.rs:1265`) and drops unresolvable spreads silently (`literal-evaluator.md:47-48`); our diagnostic is the upgrade (S5).
  Station `ATM-SITE-37` (Overmatch Ph3 flatten half). Compile dynamic, object-carrying, and reassigned value-array spreads beside literal, const-array, and clean twins, plus merge-list dynamic, literal, const, leaf-skip, and stale twins. Assert literal and const spreads flatten in place (every slot at its own breakpoint, one array-value plan per flattened array; merge elements merge with leaves and holes skipping silently) while dynamic and object-carrying spreads refuse with the arity-honest diagnostic, reassigned arrays name the write, and refused value arrays yield zero wants with zero plans. Panda: `calls.rs:1265`.
- [x] `ATM-SITE-50` `[reference]` `[seam]` — **[SPEC-V2-65 Ph1+Ph3, SPEC-V2-38 tagged, Overmatch Ph1/Ph3]**
  **Every non-object `css()` arg and every `_ => {}` on a site path must diagnose with position (Ph1); an argument that folds to an object must extract exactly as if spread (Ph3).**
  Station `ATM-SITE-50` (Overmatch Ph1 no-silence sweep). Compile `css(styles)`, `css(theme.colors)`, `css(fn())`, `css(a, cond && {...})`, conditional args with identifier/call arms, `css(...args)`, a live-binding `` css`...` `` tag, and JSX `css={styles}` / `css={cond && {...}}` / `_hover={fn()}` shapes. Assert each yields zero wants from that position plus one located `css() argument N is not a static style object (kind)` diagnostic (JSX/tag twins worded for their site), with sibling args/arms kept. Assert the silence controls stay silent: `css()`, `css({})`, `false`/`null`/`undefined` holes, string/boolean literal args (`css('panda', {...})`, SPEC-V2-36), null ternary arms, and non-`css` tags. Whole-object/member/logical resolve is the Ph3 half. Panda: staged `calls.rs:548`, positional `None` `:1719`, arg-`&&` `atomic.rs:1626`.
  Station `ATM-SITE-50` (Overmatch Ph3 resolve half). Compile `css(styles)` over local and imported const objects, `css(theme.colors)` over nested const objects (imported too), `css(styles as const)`, conditional args with identifier/member/logical arms, merge-list identifier elements, arg-level `&&`/`||`/`??` with object rights, a mutated whole-object arg beside a live sibling, and a param shadowing the object name, plus JSX `css={styles}` / `css={theme.colors}` / `_hover={styles}` twins. Assert every folded arg lowers one want and one runtime plan per leaf with zero diagnostics from that position; calls, scalars, missing names, deep members, dynamic logical lefts, call-arg spreads, and the live tag keep their positioned Ph1 refusals; the mutated arg names its write; the param shadow refuses; and the silence controls (plus guard logical lefts) stay silent. Panda: `scope.rs:43` (const object identifier), chain `:63`/`:671`, arg-`&&` `atomic.rs:1626`; alias chains (SPEC-V2-34), destructured rest (SPEC-V2-32), and multi-hop members (SPEC-V2-31) compose on top.
- [x] `ATM-SITE-77` `[reference]` `[seam]` — **[SPEC-V2-55 fold-side, Overmatch Ph3]**
  **Branching leaves in const-object inits must fan out on spread and member read, imported and same-file alike; props with no static value must diagnose.**
  Station `ATM-SITE-77` (Overmatch Ph3). Place `export const cond = { color: flag ? 'red' : 'blue' }` and a nullish twin in `tokens.ts`; compile imported and same-file spreads and member reads beside dynamic-prop, partial-prop, both-dynamic, and empty controls. Assert every branching use lowers one want and one runtime plan per static leaf; the call-valued and both-dynamic props each yield one located `property 'x' of 'y' has no static style value` diagnostic with static siblings kept; the partial white arm survives and every partially static use (spread, member, element, key, chain, fence, imported) diagnoses its dropped arm (`ATM-W-PARTIAL-OBJECT-PROP`, Ph4 residue channel); and the empty object stays silent. Panda: `cross_file.rs:1368` (`imported_conditional_object_keeps_encode_branches`). Station `ATM-SITE-77` (Overmatch Ph4 crew-B extension). Compile aliased imports of the conditional objects, barrel re-exports (plain and aliased hops) of the conditional, nullish, and partial objects, and a re-export cycle beside them. Assert the aliased and barrel spreads/members fan out exactly like the plain instance with the residue flag riding the walk (eleven more wants, five more located diagnostics); the cycle guards to a spread warning with its sibling kept.
- [x] `ATM-SITE-24` `[reference]` `[seam]` — **[SPEC-V2-22, Overmatch Ph2]**
  **A static key plus a spread ternary on the same key must union all values, order-independent.**
  Station `ATM-SITE-24` (Overmatch Ph2 station-only). Compile `css({ padding: '0', ...(u ? { padding: '1' } : { padding: '2' }) })` beside the before-order twin. Assert all six values extract with one want and one runtime plan per leaf and zero diagnostics. Panda: `conditional_output.rs:363`, before-order twin `:389`.
- [x] `ATM-SITE-25` `[reference]` `[seam]` — **[SPEC-V2-29, Overmatch Ph2]**
  **Call-form `css([...])` must merge object elements and skip falsy holes silently, never responsive.**
  Station `ATM-SITE-25` (Overmatch Ph2 station-only). Compile `css([{ margin: '1r' }, { margin: '3r' }, false])` beside a `null`-hole twin and a cond-element twin. Assert every element lands unconditioned with one want and one runtime plan per leaf and zero diagnostics. Panda: `pandacss_stylesheet/tests/atomic.rs:1474`, in-conditional `:1680`, cond-element `:1711`.
- [x] `ATM-SITE-27` `[reference]` `[seam]` — **[SPEC-V2-17/27, §3 S3, Overmatch Ph2]**
  **Object-valued ternary arms must route per arm with the resolvable arm kept when its sibling is unfoldable; mid-array ternaries must project both arms at one breakpoint.**
  Station `ATM-SITE-27` (Overmatch Ph2 station-only). Compile `css({ color: flag ? { base: 'white' } : { base: 'black' } })` beside both one-unfoldable-arm mirrors (S3: resolvable arm kept plus exactly one `Dynamic non-literal expression` warning — v2 drops the whole conditional, `literal-evaluator.md:75-76`), `css({ padding: [2, flag ? 2 : 3, 4] })` (2@base, 2+3@sm, 4@md), elision `[1, , 3]` (arity kept), and top-level `css(u ? a : b)` (both arms — v2 `calls.rs:556` drops the call, SUPERIOR S1). Assert twelve wants with exact when-conditions, five plans (dup arms dedupe; ternary arrays are planless — fold-table follow-up), exactly two warnings, and the arm utilities. Panda: `conditional_output.rs:631`, `:683`, elision `calls.rs:1946`.
- [x] `ATM-SITE-32` `[reference]` `[seam]` — **[SPEC-V2-42, Overmatch Ph2]**
  **Highest-risk refusals must pin per shape: warn once, mint nothing, keep siblings.**
  Station `ATM-SITE-32` (Overmatch Ph2 station-only; doom tripwires for the Ph3 fold table). Compile nine `css({ color: <refuse>, margin: 'Nr' })` shapes — `Math.random` helper, `.map`/`.reduce` chains, async call, loop helper, rest params, nested unknown call, spread args, `f?.()`. Assert zero color wants, nine margin wants with nine runtime plans, and exactly nine warnings. Panda: `scope.rs:1112`, `:1020`, `:1249`, `:1123`, `:1153`, `:1143`.
- [x] `ATM-SITE-36` `[reference]` `[seam]` — **[SPEC-V2-37, Overmatch Ph2]**
  **Shadowed and off-allowlist callees must skip silently; broken bindings must warn once with siblings kept.**
  Station `ATM-SITE-36` (Overmatch Ph2 station-only). Compile block-scoped `const css`, bare `panda({...})`, and `panda.somethingElse({...})` (each zero wants, zero diagnostics — the silence is pinned) beside self-init, const-cycle, no-init `let`, bare uncalled function, and missing-member shapes each paired with a margin sibling. Assert the control wants plus five sibling wants with seven runtime plans and exactly five identifier/expression warnings naming each binding. Panda: `calls.rs:965`, `:981`, `scope.rs:720`, `:832`, `:1403`, `:305`.
- [x] `ATM-SITE-39` `[reference]` `[seam]` — **[SPEC-V2-51, Overmatch Ph2]**
  **Imported const objects must spread at top level and under conditions.**
  Station `ATM-SITE-39` (Overmatch Ph2 station-only). Place `export const hover` in `styles.ts` and compile `css({ ...hover, backgroundColor: 'blue' })` beside `css({ _hover: { ...hover } })`. Assert three wants with exact when-conditions, three runtime plans, and zero diagnostics. Panda: `cross_file.rs:316`.
- [x] `ATM-SITE-40` `[reference]` `[seam]` — **[SPEC-V2-52, entry-54 remainder, cycles, Overmatch Ph4]**
  **An aliased value import must resolve to the declared export in THAT file; a missing export and import cycles must each warn once with siblings kept.**
  Station `ATM-SITE-40` (Overmatch Ph4 crew B). Place `export const brand`, `theme`, and `sizes` in `tokens.ts` and compile `import { brand as primary, theme as palette, sizes as dims }` scalar, spread, member, and indexed uses beside a missing-export alias, a re-export cycle, an import-then-export cycle, and a self re-export. Assert nine wants with eight runtime plans; the missing export and the three cycles each yield one located warning (`ATM-W-DYNAMIC-IDENTIFIER` / `ATM-W-UNFOLDABLE-SPREAD`) with static siblings kept. Panda: `cross_file.rs:421` (alias), `:488` (missing export), `:545` (cycle guard).
- [x] `ATM-SITE-52` `[reference]` `[seam]` — **[SPEC-V2-74, Overmatch Ph2]**
  **A JSX tag shadowed by a param and an `undefined` shadowed by a param must both stay fail-closed and silent.**
  Station `ATM-SITE-52` (Overmatch Ph2 shadow decisions). Compile `function F(Div) { return <Div mt="2r" /> }` beside an unshadowed `<Div mt="2r" />` control, and `function G(undefined) { css({ color: undefined }) }` beside the bare-`undefined` control. Assert the shadowed tag yields zero wants with zero diagnostics (`allows_jsx_tag` consults the shadow stack; `report_dropped_tag` stays silent under a resolved host graph), the control tag extracts, and both `undefined` leaves omit with zero wants and zero diagnostics. Panda: `scope.rs:803`, `polish.rs:352`.
- [x] `ATM-SITE-49` `[reference]` `[seam]` — **[SPEC-V2-64 static + folded halves, SPEC-V2-40 fold, Overmatch Ph2/Ph3]**
  **Static and single-leaf folded computed style-object keys must resolve; an unfoldable computed key must warn once and keep siblings.**
  Station `ATM-SITE-49` (Overmatch Ph2 static computed keys). Compile `css({ ['color']: 'red' })`, `css({ [42]: v })`, and `` css({ [`color`]: 'red' }) `` beside dynamic-key twins `css({ [k]: 'red', padding: '4px' })` with unbound/call `k`. Assert the static string/template keys extract exactly like their bare spellings with one runtime plan per want; the numeric key folds to its spelling (`42`, then the ordinary unknown-property path — never `UnfoldableKey`); and each dynamic key yields zero wants from that member plus one located `Dynamic computed property key` diagnostic with the static sibling kept. Folded keys (`[k]` over `const k`, concat keys) are the Ph3 half. Panda: `calls.rs:1288` (string), `:1304` (numeric), `:1320` (concat); v2 drops the whole call on an unfoldable key where we keep siblings (S4).
  Station `ATM-SITE-49` (Overmatch Ph3 folded-keys arm). Compile `[k]` over `const k`, `[t.p]`, `[s[0]]`, `[hov]` conditions including nested `{ [hov]: { [k]: v } }`, and folded numerics `[n]`/`[-pad]` beside multi-leaf and helper-call key refusals. Assert every single-leaf key extracts exactly like its bare spelling with one runtime plan per leaf; folded numerics ride the unknown-property path; and each refusing key yields zero wants from that member plus one located `Dynamic computed property key` diagnostic with its sibling kept. Helper-call keys fold through the landed fence (SPEC-V2-40 integration: `[gh('cool')]` mints `color:red` under `&[data-group="cool"]` with want, plan, and emitted rule all pinned); `[pick()]`/`[key]`/multi-leaf keys still refuse located with siblings kept. Concat keys fold with SITE-33. Panda: ident `scope.rs:360`, in-condition `:375`, helper-key `:966`.
- [x] `ATM-SITE-47` `[reference]` `[seam]` — **[SPEC-V2-14, Overmatch Ph3 mop-up]**
  **Structural whitespace in values must collapse: spaced twins mint one class and one declaration.**
  Station `ATM-SITE-47` (Overmatch Ph3 mop-up). Compile `'Fira  Sans'` twins beside a multiline backtick grid and quoted-substring controls (`content: '"x  y"'`, single-quoted font runs). Assert 7 raw wants collapse to 4 atoms, twin pairs share class identity via `css.classes` and plan `className`, single declarations emit, and zero diagnostics emit; quoted runs survive verbatim. No browser arm (paint-identical either way). Panda: `calls.rs:156`, `:179`.
- [x] `ATM-SITE-48` `[reference]` `[seam]` — **[SPEC-V2-63, Overmatch Ph3]**
  **Element access over const objects, const arrays, and inline literals must fold when the index folds; an unfoldable index, base, or entry must warn once naming the side, siblings kept.**
  Station `ATM-SITE-48` (Overmatch Ph3 element access). Compile literal, const-identifier (single- and multi-leaf), member, nested, and `?.[` indices over const objects, const arrays, and inline tables beside unfoldable-index/base twins, missing-entry and out-of-bounds twins, a partial multi-leaf index, a chained read, a reassigned table, and a hole read. Assert every resolving read mints one want per leaf with one runtime plan per leaf; holes omit silently; and each refusal yields one located `DynamicMember`/`MutatedBinding` diagnostic naming the index, base, or entry with static siblings kept. Concat/template indices fold with SITE-33/51; nested chains compose with SITE-29. Panda: `scope.rs:321`, `:340`, `:393`-`:449`, `:468`, `:486`, `:505`, `optional_chaining.rs:38`.
- [x] `ATM-SITE-51` `[reference]` `[seam]` — **[SPEC-V2-67, Overmatch Ph3]**
  **Interpolated templates over foldable parts must fold; an unfoldable part must refuse with a located diagnostic naming that part, siblings kept.**
  Station `ATM-SITE-51` (Overmatch Ph3 template folds). Compile `` `${n}px` `` over const `n`, `` `${o.p}` `` over a const member, literal `` `${42}` ``/`` `${true}` `` parts, multi-part `` `linear-gradient(${a}, ${b})` ``, wrapped parts, unary parts, and nested static templates beside a multi-leaf const-ternary fan-out (one string per combination) and an over-cap fan-out. Assert every folded template emits one want and one runtime plan per joined string with the `!important` suffix rule applied to the joined string. Assert binary parts fold through the landed node (`` `${2+3}` `` mints `order:"5"`). Assert free-identifier, member, and call parts each yield zero wants from that template plus one located `Dynamic non-literal template part N (kind)` diagnostic at the part's span, with static sibling props kept. Both walkers call the shared `extract/fold/template.rs` node, so want/plan parity is structural. Panda: `scope.rs:868`, `:887`, `calls.rs:1420`, `:1972`; the staged `:1214` whole-call drop becomes our per-part diagnostic (S9).
- [x] `ATM-SITE-42` `[reference]` `[seam]` — **[SPEC-V2-32, Overmatch Ph3]**
  **Destructured const bindings must resolve like the member or index they abbreviate; unresolvable sources must warn once with siblings kept.**
  Station `ATM-SITE-42` (Overmatch Ph3 destructuring). Compile `const { color }`, `{ primary: color }`, `{ color, ...space }` (spread and member uses), `[a, b]` over identifier and inline arrays, `{ color = 'red' }` with the key missing and present, `{ [key]: color }` over `const key`, a branching-entry destructure (both arms), and an array-rest chain beside an unresolvable-source control. Assert fifteen wants with one runtime plan per unique leaf and exactly one `Dynamic non-literal identifier 'ghost'` warning with the static sibling kept. Nested patterns bind without values until SITE-29 records nested objects. Panda: `scope.rs:547`, `:567`, `:587`, `:629`, `polish.rs:269`.
- [x] `ATM-SITE-33` `[reference]` `[seam]` — **[SPEC-V2-10/11/12/19/66, Overmatch Ph3]**
  **Arithmetic, concat, comparison, and all-literal short-circuit must fold; folded tests must compile the live arm only and name the dead arm.**
  Station `ATM-SITE-33` (Overmatch Ph3). Compile arithmetic (`+ - * / % **` with JS `Number` coercion), string concat, comparison, and all-literal `&&`/`||`/`??` over literal/ident/member operands beside folded-ternary tests and refusal shapes. Assert 48 wants, live-arm-only compilation with an `ATM-I-DEAD-BRANCH` info naming the dead arm, and `ATM-W-DYNAMIC-BINARY` refusals (division by zero, `NaN`, non-finite, bitwise/shift/`in`/`instanceof`, array/object operands) with zero wants from the refused position and static siblings kept. Panda: `calls.rs:1148`, `scope.rs:849`, `calls.rs:1168`, `:1394`, `:1535`, `:1560`, `:1588`, `:1614`, `:1499`, `conditional_output.rs:47`, `:449`, `:467`, `calls.rs:1443`, `:1635`, `:1867`, `scope.rs:1328`.
- [x] `ATM-SITE-34` `[reference]` `[seam]` — **[SPEC-V2-43/44, Overmatch Ph3]**
  **`?.` over a known const base must unwrap transparently; an unresolvable base must warn once and mint nothing.**
  Station `ATM-SITE-34` (Overmatch Ph3 optional chains). Compile `tokens?.color`, two-prop `theme?.primary`/`theme?.gap`, nested `t?.colors?.red` through recorded nested entries, and branching-entry `tones?.tone` (both arms) beside the `maybe?.foo` drop control. Assert eight wants with one runtime plan per unique leaf and exactly one `Dynamic non-literal` warning with the static sibling kept. Both walkers call the shared `extract/fold/chain.rs` node, so want/plan parity is structural. Calls and computed links never fold here (SITE-32 pins, SITE-48 element work). Panda: `optional_chaining.rs:19`, `:72`, `:58`.
- [x] `ATM-SITE-41` `[reference]` `[seam]` — **[SPEC-V2-56 proof, Overmatch Ph4]**
  **Barrel re-export chains, including aliased re-exports, must resolve by binding with zero diagnostics.**
  Station `ATM-SITE-41` (Overmatch Ph4 crew B; Ph2 probe promoted to proof). Compile `tokens.ts` (`export const brand = 'red'`) beside `barrel.ts` (`export { brand } from './tokens'`), a two-hop `index.ts` barrel, a three-hop `third.ts`, and an aliased re-export (`export { gap as space }`), with consumers importing from each barrel. Assert five wants with three runtime plans and zero diagnostics — the binding walk follows every hop to the origin declaration. Before-picture (merge era, recorded in the station README): the same-name chains were green by accident of the merge while the alias warned and dropped. Panda: `cross_file.rs:1194` (deep chain), `:751`/`:962`/`:995`/`:1038` (chain-cache twins).
- [x] `ATM-SITE-60` `[reference]` `[seam]` — **[SPEC-V2-04 GAP-04b, Overmatch Ph2]**
  **Numeric and string token scalars must dedupe to one rule with the token winning over px.**
  Station `ATM-SITE-60` (Overmatch Ph2 pins). Compile `css({ margin: 4 })` beside `css({ margin: '4' })` against a spacing scale holding `4`. Assert both spellings arrive as wants but land on one class and one `margin: var(--spacing-4)` rule (never `4px`), with zero diagnostics. Panda: `pandacss_stylesheet/tests/atomic.rs:265`.
- [x] `ATM-SITE-61` `[reference]` `[seam]` — **[SPEC-V2-05 GAP-05a, GAP-05b transparent, Overmatch Ph2]**
  **Parens / `as` / `satisfies` / `!` must unwrap transparently in value position, in wants and plans alike.**
  Station `ATM-SITE-61` (Overmatch Ph2 pins). Compile all four wraps beside a triply-nested `((('9px' as const)))` and a JSX `mt={('2r' as const)}` attr. Assert every wrapped value extracts exactly like the bare literal with its closed class and sheet declaration, every plan carries `important: false` (no `!important` anywhere — `!` is transparent-in-both, GAP-05b's recommended pick), and zero diagnostics emit. Panda: `calls.rs:1660` (`nested_unwraps_and_folding`), `jsx.rs` wrap arms.
- [x] `ATM-SITE-43` `[reference]` `[seam]` — **[SPEC-V2-45, Overmatch Ph3]**
  **Enum members with initializers must fold through member reads; uninitialized members must drop that path with siblings kept.**
  Station `ATM-SITE-43` (Overmatch Ph3 enum fence). Compile string, numeric, unary-numeric, and boolean member reads beside member-reference, computed, and uninitialized member twins each paired with a static sibling, plus an inner-const shadow of the enum name. Assert twelve wants with eleven runtime plans (the boolean member records and refuses at resolve, planless like a bare bool) and exactly four diagnostics (three member warnings, one invalid-value). Panda: `polish.rs:47`, `:66`, `:85`; fence `literal-evaluator.md:67`.
- [x] `ATM-SITE-44` `[reference]` `[seam]` — **[SPEC-V2-46, Overmatch Ph3]**
  **Function params annotated with a `TSTypeLiteral` must fold literal members; anything else must refuse the whole annotation with siblings kept.**
  Station `ATM-SITE-44` (Overmatch Ph3 type-literal fence). Compile member reads and destructured twins (plain and rename) over an all-literal annotation beside untyped, optional-member, partial (`unknown` sibling), non-literal (`string`), nested-literal, rest, and defaulted params each paired with a margin sibling. Assert eleven wants with ten runtime plans (the member read and the twin share one `(color, red)` plan) and exactly seven warnings (five member, two identifier) — one unfoldable member refuses the whole annotation. Panda: `polish.rs:104`, `:142`, `:125`, `:162`; fence `literal-evaluator.md:68`.
- [x] `ATM-SITE-45` `[reference]` `[seam]` — **[SPEC-V2-61, Overmatch Ph3]**
  **`token()` / `token.var()` calls must fold to `{path}` references that print theme-live `var()` aliases; unknown paths with a fallback must carry it, without one must error with no ghost.**
  Station `ATM-SITE-45` (Overmatch Ph3 token surface). Compile bare, `.var`, aliased, const-path, const-fallback, static-template, `token()`-const (including above a forward import — imports hoist), fallback-carrying, and JSX-attr calls beside arity, spread, empty, dynamic, multi-leaf, interpolated-template, and foreign-member refusals plus shadowed, foreign-package, and unbound callees. Assert twenty-nine wants with nineteen runtime plans, theme-live `var()` declarations with `#000`/`#fff`/`#111` fallbacks honored, and exactly sixteen diagnostics (nine surface refusals, three unknown-path warnings, three generic call warnings, one unknown-token error — the error's want extracts but prints nothing). Interpolated paths compose with SPEC-V2-67 when it lands. Panda: `token_calls.rs:92`, `:202`, `:268`, `:354`, `:382`, `:470`.
- [x] `ATM-SITE-46` `[reference]` `[seam]` — **[SPEC-V2-62, Overmatch Ph3]**
  **`keyframes()` / `positionTry()` consts must resolve to their declared name at consuming sites; every other factory shape must refuse with siblings kept.**
  Station `ATM-SITE-46` (Overmatch Ph3 factory consts). Compile both factories beside an import alias, an alias chain, a forward-import alias, and `viewTransition`, non-object, missing-definition, shadowed, foreign-package, and mutated twins each paired with a margin sibling. Assert thirteen wants with twelve runtime plans (the chain shares its plan by lookup key) and exactly seven diagnostics (six identifier, one mutated) — a cleared factory clears its clones to a fixpoint. Panda: `cross_file.rs:1437`, `:1460`, `:1481`.
- [x] `ATM-SITE-63` `[reference]` `[seam]` — **[SPEC-V2-16 GAP-16, Overmatch Ph2]**
  **An open-test ternary with one unresolvable arm must keep the resolvable arm and warn exactly once on the other, in both arm positions.**
  Station `ATM-SITE-63` (Overmatch Ph2 pins). Compile `dark ? maybeFn() : 'black'` beside the mirrored `dark ? 'white' : maybeFn()`. Assert both resolvable arms extract with their runtime style plans and exactly two `Dynamic non-literal` warnings emit at the two call lines. Panda keeps the resolvable arm too (`conditional_output.rs:69`, `:91`).
- [x] `ATM-SITE-64` `[reference]` `[seam]` — **[SPEC-V2-15/16 arms, Overmatch Ph2]**
  **Equal ternary branches must collapse to one class; mixed-type arms must both compile; per-arm `!` must stick to its arm.**
  Station `ATM-SITE-64` (Overmatch Ph2 pins). Compile `flag ? 'red' : 'red'` beside `ok ? '4px' : 8` and `flag ? '2r!' : '3r'`. Assert one `color:red` class key, both margin arms compiled, `p_2r!` beside plain `p_3r`, one runtime plan per leaf, and zero diagnostics. Panda: `conditional_output.rs:110` (equal branches); per-arm `!important` is the `pandacss_encoder` IR contract.
- [x] `ATM-SITE-66` `[reference]` `[seam]` — **[SPEC-V2-21 GAP-21, Overmatch Ph2]**
  **A bare unresolvable spread must warn exactly once and skip while static siblings extract.**
  Station `ATM-SITE-66` (Overmatch Ph2 pins). Compile `css({ ...unknown, color: 'red' })`. Assert the `color` sibling extracts with its runtime plan and closed class, and exactly one `Dynamic object spread` warning emits. Panda skips the spread (`calls.rs:638`); our diagnostic is the upgrade.
- [x] `ATM-SITE-67` `[reference]` `[seam]` — **[SPEC-V2-23 GAP-23, Overmatch Ph2]**
  **Overlapping inline-object spreads must mint both atoms while the runtime merge resolves last-wins.**
  Station `ATM-SITE-67` (Overmatch Ph2 pins). Compile `css({ ...{ color: 'red' }, ...{ color: 'blue' } })`. Assert both wants and both utilities exist, the plan-index merge resolves to `c_blue`, and zero diagnostics emit. Panda: `calls.rs:1736` (`merge_two_inline_object_spreads_second_wins`).
- [x] `ATM-SITE-69` `[reference]` `[seam]` — **[SPEC-V2-26 GAP-26, Overmatch Ph2]**
  **A dynamic responsive-array slot must warn once and omit while static leaves keep their breakpoints.**
  Station `ATM-SITE-69` (Overmatch Ph2 pins). Compile `css({ padding: ['4px', null, dyn] })` beside `css({ color: [dyn, 'black'] })`. Assert `4px` lands on `base` and `black` on `sm` (arity honest in both directions), the null hole skips silently, and exactly two `Dynamic non-literal` warnings emit. Panda: `calls.rs:1922` (stays silent; our warning is the upgrade).
- [x] `ATM-SITE-72` `[reference]` `[seam]` — **[SPEC-V2-33 arrow arm, Overmatch Ph2]**
  **Arrow-function params named `css` must shadow the import like function params do.**
  Station `ATM-SITE-72` (Overmatch Ph2 pins). Compile `(css) => css({ color: 'red' })` beside the function-declaration twin and a live top-level call. Assert both shadowed calls drop silently and the live call extracts with zero diagnostics. Panda: `scope.rs:707` (arrow), `:690` (function).
- [x] `ATM-SITE-73` `[reference]` `[seam]` — **[SPEC-V2-38 discovery, Overmatch Ph2]**
  **Literal `css()` calls inside function bodies and JSX expression containers must extract; multi-arg `css()` must merge every arg with no cap.**
  Station `ATM-SITE-73` (Overmatch Ph2 pins). Compile a `css()` call in a function body beside `className={css(…) + …}` in JSX and a five-arg `css()` call. Assert all eight leaves extract with one runtime plan per leaf, the plan index resolves the fifth arg, and zero diagnostics emit. Panda: `calls.rs:480` (multiple calls), `:657` (in-JSX), `:702` (in-fn); multi-arg `pandacss_stylesheet/tests/atomic.rs:1449`, `:1596`.
- [x] `ATM-SITE-74` `[reference]` `[seam]` — **[SPEC-V2-44, Overmatch Ph2]**
  **`?.` on an unresolvable base must warn once and mint nothing while static siblings extract.**
  Station `ATM-SITE-74` (Overmatch Ph2 pins). Compile `css({ color: maybe?.foo, padding: '4px' })` over a declared-but-unresolvable `maybe`. Assert zero wants from the chain, the `padding` sibling extracts with its plan, and exactly one `Dynamic non-literal` warning emits. Panda: `optional_chaining.rs:58` (known-base fold is SPEC-V2-43).
- [x] `ATM-SITE-75` `[reference]` `[seam]` — **[SPEC-V2-54, SPEC-V2-58, Overmatch Ph2]**
  **An unresolvable specifier, a missing export, and a bare imported function value must each warn once and mint nothing while siblings extract.**
  Station `ATM-SITE-75` (Overmatch Ph2 pins). Compile `css({ color: ghost, … })` over `import { ghost } from './missing'` beside a missing-export twin and `css({ borderColor: getColor, … })` over an imported uncalled function. Assert zero wants from all three dynamic leaves, all three `padding` siblings extract, and exactly three `Dynamic non-literal` warnings emit — fail-closed-plus-diagnostic where v2 drops silently. Panda: `cross_file.rs:465` (specifier), `:488` (missing export), `:1310` (bare fn value).
- [x] `ATM-SITE-76` `[reference]` `[seam]` — **[SPEC-V2-59 alias + I2, Overmatch Ph2]**
  **Aliased, named multi-declaration, and string-literal `css` imports must all be live sites.**
  Station `ATM-SITE-76` (Overmatch Ph2 pins). Compile `c(…)` over `import { css as c }` beside a `import { css, Div }` multi-declaration call and `x(…)` over `import { "css" as x }`. Assert all three calls plus the hosted JSX attr extract with zero diagnostics. Panda: `imports.rs:34` (alias); the string-literal arm is xf-I2 (`bindings.rs:131`).

### Leaf Literal Extraction

- [x] `ATM-LEAF-01` `[reference]` `[seam]` —
  **Flat ternaries with open tests must scoop both branches; folded tests compile the live arm only.**
  Encounter style prop expressions with flat ternaries (`bg={active ? "n300" : "n100"}` or `color={true ? "white" : "black"}`). Assert that open tests collect both branches as separate wants while a test that folds to a boolean compiles the live arm only and reports the dead arm in an `ATM-I-DEAD-BRANCH` info diagnostic (Overmatch Ph3, SPEC-V2-66). Assert that no runtime JavaScript interpreter is invoked to resolve the condition: the fold table enumerates literal forms, it never evaluates.
- [x] `ATM-LEAF-02` `[reference]` `[seam]` —
  **Nested ternaries must recursively flatten all conditional branches without leaf dropout.**
  Station `ATM-LEAF-02`. Encounter multi-level nested ternaries (such as Tabs-shaped `borderBottom={isLine && horiz ? (selected ? '3px solid' : '3px solid transparent') : undefined}`). Assert that every reachable literal branch across all nesting depths is extracted into wants. Assert that complex logical guard expressions surrounding the ternary do not cause leaf omission.
- [x] `ATM-LEAF-03` `[reference]` `[seam]` —
  **Branches resolving to `undefined` or `void 0` must be omitted without emitting null wants or dead atoms.**
  Station `ATM-LEAF-03`. Encounter ternaries where one branch is `undefined`, `void 0`, or an empty expression container. Assert that only the defined literal branch is pushed to the wants collection. Assert that no `null` atom value or useless class name is emitted in either the runtime map or the stylesheet.
- [x] `ATM-LEAF-04` `[reference]` `[seam]` —
  **Logical operators must fold all-literal operands and scoop the rest.**
  Encounter expressions using logical AND (`false && '1px solid'`), logical OR (`'red' || 'blue'`), and nullish coalescing (`custom ?? 'green'`). Assert that guard-operand expressions keep the guard rule (the literal side extracts while guards discard), that all-literal non-guard operands fold to the picked operand only per JavaScript short-circuit with no dead atom (Overmatch Ph3, SPEC-V2-19), and that dynamic operands still scoop with diagnostics. Assert that guard identifiers like `undefined` and `null` are discarded.
- [x] `ATM-LEAF-05` `[reference]` `[seam]` —
  **Responsive arrays must map indexed elements to default breakpoint conditions while skipping null slots.**
  Encounter responsive array expressions on style props (e.g. `mt={['1r', '2r', null, '4r']}`). Assert that index 0 maps to condition `base` (unconditioned), index 1 maps to `sm` (or first configured breakpoint from compile input/tokens), index 2 (null) is skipped without generating an atom, and index 3 maps to `md` (or second configured breakpoint). Assert that responsive array slots containing ternaries have both ternary branches collected under that slot's breakpoint condition. Array-slot to named scale is owned by atomic and parameterized by compile input / base-system tokens, decoupled from canon.
- [x] `ATM-LEAF-06` `[reference]` `[seam]` —
  **Computed object property keys in style objects must be refused with a diagnostic warning.**
  Station `ATM-LEAF-06`. `css({ [dynamicKey]: '10px' })` warns; sibling static properties still extract.
- [x] `ATM-LEAF-07` `[forbidden]` `[seam]` —
  **Unresolvable dynamic expressions and function calls must not be evaluated and must preserve sibling static properties.**
  Encounter style declarations containing unresolvable function calls (`color: maybeFn()`) or dynamic runtime properties (`width: props.w`). Assert that the engine does not evaluate the function or execute JS, emits a diagnostic warning naming the affected property, and successfully extracts all valid sibling static properties in the same object.
- [x] `ATM-LEAF-08` `[reference]` `[seam]` —
  **Comprehensive style expressions batch table must extract diverse CSS properties and values without error.**
  Execute the full table of absorbed styling expressions across layout, flexbox, grid, typography, borders, and effects. Assert that unitless numbers, percentages, pixel dimensions, keywords, and rhythm values are accurately extracted into corresponding wants. Assert that responsive conditions assigned to table entries match expected breakpoint conditions.
- [x] `ATM-LEAF-09` `[reference]` `[seam]` —
  **Authored `!` / `!important` suffixes on string literals must set `Want.important` and emit `mt_2r!`.**
  Station `ATM-LEAF-09`. `mt="2r!"` / `css({ p: '1r!' })` set `Want.important` and print `.mt_2r\!`.
- [x] `ATM-LEAF-10` `[reference]` `[seam]` —
  **Importance must be parsed from every authored spelling, and a bang inside a quoted string must not mark importance.**
  Compile `css({ padding: '0 !important', color: 'red!IMPORTANT', content: '"hello!"' })`. Assert `padding` and `color` set `Want.important` with the marker stripped from the value (`padding: 0 !important`, class `p_0!`), and assert `content` is **not** important and keeps its literal `"hello!"`. Station `ATM-LEAF-10` proves the spaced and case-insensitive spellings and the quoted-bang exclusion; a naive `ends_with('!')` would get `content` wrong.

### Styling Want IR

- [x] `ATM-WANT-01` `[reference]` `[seam]` —
  **`Want` struct must capture authored property, value, cumulative condition scopes, importance, and origin.**
  Station `ATM-WANT-01`. Builder fields round-trip through compile wants: boxed prop names, typed `AtomValue`, condition paths, importance.
- [x] `ATM-WANT-02` `[reference]` `[seam]` —
  **`Want` declarations must serialize and deserialize through serde with exact structural fidelity.**
  Station `ATM-WANT-02`. Nested conditions and origin survive JSON round-trip.

### Atom Representation & AtomSet

- [x] `ATM-ATOM-01` `[reference]` `[seam]` —
  **`Atom` declaration must encapsulate normalized property, value, condition chain, importance, and fast hash.**
  Station `ATM-ATOM-01`. Identical fields hash equal; identity covers property, value, conditions, and importance.
- [x] `ATM-ATOM-02` `[reference]` `[seam]` —
  **`AtomValue` / `CssValue` variants must provide distinct class name strings and valid CSS output values.**
  Station `ATM-ATOM-02`. `String` / `Token` / `Number` emit CSS; `Bool` stays on the want and is dropped at resolve. Serde-stable.
- [x] `ATM-ATOM-03` `[reference]` `[seam]` —
  **`AtomSet` must deduplicate identical atomic declarations across source files using precomputed hashing.**
  Station `ATM-ATOM-03`. Duplicate inserts do not grow the set.
- [x] `ATM-ATOM-04` `[reference]` `[seam]` —
  **One class per leaf grain must be strictly maintained across all resolved atoms.**
  Station `ATM-ATOM-04`. Every compiled atom is one property.
- [x] `ATM-ATOM-05` `[reference]` `[seam]` —
  **An authored CSS custom property must compile as a declaration, not as a condition.**
  Compile `css({ '--brand-x': 'red.500', color: 'var(--brand-x)' })`. Assert `--brand-x` becomes a real declaration whose value resolves tokens, that its class name escapes the leading dashes (`ATM-NAME-06`), and that it is never mistaken for a `_`-prefixed or `&`-prefixed condition key. Station `ATM-ATOM-05` proves the declaration, the unique-token resolution, and the escaped selector.

### Rhythm Engine

- [x] `ATM-RHYTHM-01` `[reference]` `[seam]` —
  **Base rhythm unit declarations (`r`, `+r`, `1r`, `-r`) must resolve to standard spacing CSS expressions.**
  Pass rhythm values `r`, `+r`, and `1r` into the rhythm resolver. Assert that each resolves to `var(--spacing-root)`. Pass negative rhythm value `-r` and assert that it resolves to `calc(-1 * var(--spacing-root))`.
- [x] `ATM-RHYTHM-02` `[reference]` `[seam]` —
  **Rhythm integer multipliers and decimal values must resolve to exact CSS multiplication expressions.**
  Pass integer multipliers `2r`, `-2r` and decimal fractions `0.5r`, `1.5r` to the rhythm resolver. Assert that positive values resolve to `calc(N * var(--spacing-root))` and negative values resolve to `calc(-N * var(--spacing-root))`.
- [x] `ATM-RHYTHM-03` `[reference]` `[seam]` —
  **Fractional rhythm units (`1/3r`, `2/3r`, `-1/3r`) must resolve to exact division CSS formulas.**
  Pass fractional rhythm strings with denominators (e.g. `1/3r`, `2/3r`, `-1/3r`, `-2/3r`). Assert that `1/3r` resolves to `calc(var(--spacing-root) / 3)` and `2/3r` resolves to `calc(2 * var(--spacing-root) / 3)`. Assert that zero denominator fractions are rejected.
- [x] `ATM-RHYTHM-04` `[reference]` `[seam]` —
  **Multi-value CSS property strings must resolve embedded rhythm tokens while passing through raw values.**
  Station `ATM-RHYTHM-04`. `1r 2r` and `1px solid 1/3r` keep non-rhythm tokens in place.
- [x] `ATM-RHYTHM-05` `[reference]` `[seam]` —
  **Negative rhythm values authored in JSX or `css()` must extract and compile without syntax errors.**
  Compile sources containing `marginTop="-1r"` or `left="-2r"`. Assert that valid wants are extracted with negative values, compiled into `mt_-1r` class names, and emitted as valid negative calc declarations in CSS.

### Shorthand Decomposition & Cascade Safety

- [x] `ATM-SHORT-01` `[reference]` `[seam]` —
  **Composite `borderBottom` shorthand must decompose into width and style without emitting `currentColor`.**
  Compile a component specifying `borderBottom="3px solid"` alongside `borderColor="gray.800"`. Assert that `borderBottomWidth: 3px;` and `borderBottomStyle: solid;` are emitted. Assert that `currentColor` is never synthesized or emitted, preventing the catastrophic CSS cascade anomaly that clobbers sibling border colors.
- [x] `ATM-SHORT-02` `[reference]` `[seam]` —
  **Composite `outline` shorthand must decompose into width and style without clobbering `outlineColor`.**
  Station `ATM-SHORT-02`. Compile a component specifying `outline="1px solid"` alongside `outlineColor="blue.600"`. Assert that `outline-width: 1px;` and `outline-style: solid;` are emitted as atomic rules. Assert that default outline color is never synthesized, ensuring `outline-color: var(--colors-blue-600);` wins cleanly.
- [x] `ATM-SHORT-03` `[reference]` `[seam]` —
  **Border zero dimensions and whole-value tokens must pass through without unwanted decomposition.**
  Station `ATM-SHORT-03`. Zero widths become `0px`; `none` / `inherit` / `borders.card` stay single properties.
- [x] `ATM-SHORT-04` `[reference]` `[seam]` —
  **Composite border shorthands (`border`, `borderTop`, `borderBottom`, `outline`) must decompose to canon longhands.**
  Station `ATM-SHORT-04`. Emitted names equal `canon::native_longhands_for_prop`. Not a private `BORDER_CONFIGS` table.
- [x] `ATM-SHORT-05` `[reference]` `[seam]` —
  **Dimensional shorthands with 2–4 tokens expand to physical longhands; a single token does not expand.**
  Station `ATM-SHORT-05`. `padding: 10px 20px` → four longhands; `padding: 10px` / `p: 1r` passthrough.
- [x] `ATM-SHORT-06` `[reference]` `[seam]` —
  **A shorthand and one of its longhands authored in the same object must both emit, with the longhand winning.**
  Station `ATM-SHORT-06`. `padding` then `paddingTop` in both source-file authorship orders. This is `ATM-ORDER-04` observed from the shorthand side.
- [x] `ATM-SHORT-07` `[reference]` `[seam]` —
  **The shorthand token splitter must track parenthesis depth correctly so a function value does not swallow its siblings.**
  Station `ATM-SHORT-07`. Compile `css({ border: 'calc(1px + 1px) solid', margin: 'calc(1r * 2) 3r' })`. Assert the value splits into the expected token count and expands to the right longhands. `open_paren` increments `depth` once per `(`.
- [x] `ATM-SHORT-08` `[reference]` `[seam]` —
  **`textGradient` must expand to the Panda clip trio, never the dead `text-gradient` property.**
  Station `ATM-SHORT-08` (RS-22). Compile `css({ textGradient: 'linear-gradient({colors.red.200}, {colors.blue.300})' })`. Assert `background-image` carries the resolved vars plus `-webkit-background-clip: text` and `color: transparent` utilities, one runtime plan with three declarations, and zero diagnostics. A `&:hover` arm fans the trio out over the condition.
- [x] `ATM-SHORT-09` `[reference]` `[seam]` —
  **The six radius pair shorthands must expand to corner longhands with one value on both corners.**
  Station `ATM-SHORT-09` (RS-25). Compile all six pairs with `'2r'`. Assert eight corner utilities (four physical, four logical), no dead `border-*-radius` pair property, and zero diagnostics. Real properties (`borderRadius`, corner longhands) pass through; emitted names equal `canon::native_longhands_for_prop` (cargo tripwire).

### Condition Scoping & Dialect Patterns

- [x] `ATM-COND-01` `[reference]` `[seam]` —
  **Named breakpoint conditions from the compile-time scale must lower to `@container (min-width: Npx)`.**
  Station `ATM-COND-01`. Default utterance `sm` / `md` / `lg` / `xl` / `2xl` maps to 640 / 768 / 1024 / 1280 / 1536 px. Array-slot indexing is `ATM-LEAF-05`. Names without a width are not at-rules.
- [x] `ATM-COND-02` `[reference]` `[seam]` —
  **`_hover` lowers to `&:is(:hover, [data-hover])` and that selector is applied to the class.**
  Station `ATM-COND-02`. Spec used to list `_active`, `_focus`, `_focusVisible`, `_disabled` as proven; those presets are not in this station.
- [x] `ATM-COND-03` `[reference]` `[seam]` —
  **`_dark` lowers to `[data-color-mode=dark] &` and applies as `[data-color-mode=dark] .dark\:…`.**
  Station `ATM-COND-03`. `_light` is `ATM-COND-08`. Host primitives stamp `DATA_COLOR_MODE_ATTR = 'data-color-mode'`.
- [x] `ATM-COND-04` `[reference]` `[seam]` —
  **Cumulative nested condition chains must preserve outer-to-inner scope ordering.**
  Compile nested condition scopes (e.g. `_dark: { _hover: { _focusVisible: { borderColor: 'gold' } } }`). Assert that the extracted want retains the exact ordered condition path `['_dark', '_hover', '_focusVisible']`. Assert that the class name prefixes conditions in order (`dark:hover:focusVisible:borderC_gold`).
- [x] `ATM-COND-05` `[reference]` `[seam]` —
  **Dialect utilities (`container`, `font`, `weight`, `size`) must lower like core's box-pattern transforms.**
  Station `ATM-COND-05`. `container` stamps `containerType` / `containerName`. `size` expands to equal `width` / `height`. `font` / `weight` look up the compile-time `font()` table. Lib fixture `font="sans"` includes `css.letterSpacing` (`-0.01em`).
- [x] `ATM-COND-06` `[reference]` `[seam]` —
  **Runtime-owned component properties (`variant`, `colorMode`) must be excluded from atomic stylesheet emission.**
  Station `ATM-COND-06`. `variant="primary"` / `colorMode="dark"` extract as wants but emit no utilities. Sibling StyleProps still compile.
- [x] `ATM-COND-07` `[reference]` `[seam]` —
  **Responsive `r` container query objects must lower to `@container (min-width: ...)` condition wrappers.**
  Station `ATM-COND-07`. `r={{ 300: { p: '1r' }, md: { mt: '2r' } }}` stamps `when` with the query strings and prints those at-rules. Unknown names warn and skip.
- [x] `ATM-COND-08` `[reference]` `[seam]` —
  **Theme conditions must match the host color-mode attribute, not only a `.dark` class.**
  Station `ATM-COND-08`. `_dark` / `_light` wrap as `[data-color-mode=dark] &` / `[data-color-mode=light] &`. Core primitives use `DATA_COLOR_MODE_ATTR = 'data-color-mode'`. The wrap comes from `BaseSystem::lib_fixture()`, not a hardcoded `.dark &` preset.
- [x] `ATM-COND-09` `[reference]` `[seam]` —
  **Group/peer and arbitrary `&` / `@` conditions must survive into the stylesheet.**
  Station `ATM-COND-09`. `_groupHover` / `_peerFocus` wrap from the lib fixture. `'&[data-slot=inner]'` prints a real rule. Canon `NAMED_CONDITIONS` also lists `_osDark` / `_motionReduce`; those `@media` presets are not this station.
- [x] `ATM-COND-10` `[reference]` `[seam]` —
  **The core interaction pseudo catalog must lower from the utterance: `_active`, `_focus`, `_focusVisible`, `_disabled`, `_checked`.**
  Station `ATM-COND-10`. Compile one file setting a property under each of the five conditions. Assert each lowers to the lib-fixture wrap with its `data-*` twin (`&:is(:disabled, [disabled], [data-disabled], [aria-disabled=true])` and so on) and that each prints a real rule. `ATM-COND-02` explicitly disclaims these five — the SPEC text says the spec "used to list" them as proven and that they are not in that station — so the most common conditions in the entire library are currently unproven.
- [x] `ATM-COND-11` `[reference]` `[seam]` —
  **`@media` preset conditions must print as at-rules, not selectors.**
  Station `ATM-COND-11`. Compile `css({ _osDark: { color: 'n100' }, _motionReduce: { animation: 'none' }, _print: { display: 'none' } })`. Assert each emits its `@media` block inside `@layer utilities` and that the class name carries the condition segment. `ATM-COND-09` names `_osDark` / `_motionReduce` and declares them out of scope; `pseudoprops/mod.rs:7-30` does hold the wraps, so this station is proof, not new engine work.
- [x] `ATM-COND-12` `[reference]` `[seam]` —
  **An unrecognised `_`-prefixed condition must emit no utility and must warn.**
  Station `ATM-COND-12`. `css({ _hovr: { color: 'red.500' }, color: 'blue.500' })` emits no `hovr` rule and no `:hovr` selector, a diagnostic names `"_hovr"`, and the sibling `color: 'blue.500'` still compiles. Resolve drops the unknown-conditioned want; `Want.when` still records `['_hovr']`. Precedent: `ATM-COND-07` unknown `r` keys.
- [x] `ATM-COND-13` `[reference]` `[seam]` —
  **Breakpoint range conditions must lower to the matching bounded query.**
  Station `ATM-COND-13`. Compile `css({ mdDown: { display: 'none' }, mdOnly: { px: '2r' }, smToLg: { maxWidth: '80ch' } })` against the fixture scale. Assert `mdDown` emits a max-width bound, `mdOnly` a min-and-max band, and `smToLg` an exclusive range, with unknown range names warning and skipping. Only the min-width direction exists today (`ATM-COND-01`), so "hide below md" is unexpressible without hand-written at-rules.
- [x] `ATM-COND-14` `[reference]` `[seam]` —
  **Nested arbitrary `&` selectors must compose in author order, and a comma-separated selector list must scope every member.**
  Station `ATM-COND-14`. Compile `css({ '&:last-child': { '& .divider': { display: 'none' } } })` and assert the emitted selector is `.<cls>:last-child .divider`, not `.<cls> .divider:last-child`. Compile `css({ '&:not(:first-child), &:only-child': { mt: '0' } })` and assert both members carry the class. Assert that an `&` appearing inside an attribute value (`'&[data-x="a & b"]'`) is treated as a literal, not a parent reference. `ATM-COND-09` proves one flat `&[data-slot=inner]`; nesting and lists are where selector composition actually breaks.
- [x] `ATM-COND-15` `[reference]` `[seam]` —
  **Container-query conditions must be backed by a container root, or the compiler must say so.**
  Station `ATM-COND-15`. Assert that when any `@container` condition is emitted, the system layers establish `container-type` on a root element (`ATM-LAYER-03`'s `globalCss` slice), or that a diagnostic tells the host it must. Named breakpoints lower to `@container (min-width: …)` (`ATM-COND-01`), and a container query with no `container-type` ancestor never matches — so every responsive utility in the system silently does nothing unless the host cooperates. This station pins down whose job that is.

- [x] `ATM-COND-16` `[reference]` `[seam]` —
  **Every authored `container` form must lower correctly, and the named-container query API must be wired or removed.**
  Station `ATM-COND-16`. Compile `<Div container />` (boolean) and assert `container-type: inline-size` with no `container-name`. Compile the named-container `r` form and assert `@container card (min-width: Npx)`. `resolve/container.rs:7-18` handles the boolean case untested at the seam, and `resolve/r/query.rs:13-16` exports a named-container formatter that **no caller invokes** — `walk_r_object` only calls `lower_r_key` (`object.rs:119`). Either the syntax is real and this station proves it, or the function is dead code and should be deleted (§7.14).
- [x] `ATM-COND-17` `[reference]` `[seam]` —
  **Per-prop responsive objects (`width: { base, md }`) must expand onto breakpoint `when` scopes with `base` unconditioned, and unknown keys must warn and skip.**
  Station `ATM-COND-17` (RS-9). Compile `css({ width: { base: '50px', md: '60px' }, w: '70px' })`. Assert wants `(width, 50px, [base])`, `(width, 60px, [md])`, `(w, 70px, [])`; assert the sheet carries all three atoms (`.w_50px`, `@container (min-width: 768px) .md\:w_60px`, `.w_70px`); assert the width plan is keyed by authored spellings with declarations on slots `width@base` / `width@md`. Extract passes keys through on `when` — `base`-skipping and unknown-key refusal belong to `resolve/conditions` alone. See the merge note under Merge & Last-Wins Semantics for the runtime eviction this slot family requires.
- [x] `ATM-COND-18` `[reference]` `[seam]` —
  **`_placeholder` must emit the `::placeholder` + `[data-placeholder]` twins and `_file` must lower to `::file-selector-button`.**
  Compile `css({ _placeholder: { color: 'red.500' }, _file: { color: 'blue.500' }, _checked: { color: 'green.500' } })` and assert the placeholder rule carries both selectors, the file rule targets `::file-selector-button`, `_checked` keeps its four-member twin list, all three wants resolve to plans, and diagnostics stay empty. Station `ATM-COND-18` (RS-17).
- [x] `ATM-COND-19` `[reference]` `[seam]` —
  **`@supports` keys must lower to at-rules outside `@container`, never selector fragments.**
  Compile `css({ '@supports (display: grid)': { sm: { '&:hover': { color: 'red.500' } } } })` and assert `@supports` nests outside `@container (min-width: 640px)` with `:hover` on the selector, no `:@supports` fragment, supports sorting before container, one want, one plan, and zero diagnostics. Station `ATM-COND-19` (RS-15).
- [x] `ATM-COND-20` `[reference]` `[seam]` —
  **Parent-combinator keys (unquoted `&` not in leading position) must extract as selector conditions and emit with the parent ahead of the class.**
  Compile `css({ 'input:hover &': { color: 'red.500' } })` and assert one want, one plan with `when: ['input:hover &']`, and the rule `input:hover .<class>`. Compile `css({ ':focus > &': { color: 'blue.500' } })` and assert `:focus > .<class>`. A `&` that appears only inside quotes is a literal, not a reference. Station `ATM-COND-20` (RS-12) covers both waiting rows.
- [x] `ATM-COND-21` `[reference]` `[seam]` —
  **Queryless `@supports` / `@media` / `@container` keys must refuse with a diagnostic and print nothing.**
  Station `ATM-COND-21` (RS-29). Compile bare `@supports` and `@media` keys beside the queried `@supports (display: grid)` control. Assert no `@supports {` / `@media {` block, one utility for the control, and one `Unknown condition` diagnostic per bare key (D11 fail-closed; cargo `bare_query_rules_are_refused`).
- [x] `ATM-COND-22` `[reference]` `[seam]` — **[SPEC-V2-49, Overmatch Ph2]**
  **A css()-nested `&:where(:has(> …, > …))` key must substitute inside the functional arg.**
  Station `ATM-COND-22` (Overmatch Ph2 station-only). Compile the `button.ts:29` verbatim key wrapping `{ paddingInline: '0' }` and assert the want carries the `&:where(...)` when-condition with one runtime plan, and the sheet prints `:where(:has(> [data-slot="icon"]:only-child, > svg:only-child))` with `padding-inline: 0` and zero diagnostics. Prints v2's `nested_selector_parity.rs:389` shape byte-for-byte modulo our class stem.
- [x] `ATM-COND-23` `[reference]` `[seam]` —
  **In a comma-list selector key, a member without `&` must scope to the parent (`& <member>`), and a stacked template must distribute over every parent member.**
  Station `ATM-COND-23` (SPEC-V2-68). Compile `css({ '&:not(:first-child), :only-child': { display: 'none' } })` and assert the rule selector is `.<cls>:not(:first-child), .<cls> :only-child` — the bare `:only-child` member must carry the class as a descendant, never print bare (a bare member matches every `:only-child` in the document). Compile the same key with a nested `'& .left-border'` child and assert `.<cls>:not(:first-child) .left-border, .<cls> :only-child .left-border`. Compile `css({ '& .one, .two': { color: 'red.500' } })` and assert `.<cls> .one, .<cls> .two`. Selectors print v2's `nested_selector_parity.rs:642/:653/:664` shapes byte-for-byte modulo our class stem.
- [x] `ATM-COND-24` `[reference]` `[seam]` —
  **Under a stacked parent that carries a top-level combinator, a template member with multiple `&` must substitute `:is(parent)`, not the parent text; a single leading `&` stays textual.**
  Station `ATM-COND-24` (SPEC-V2-69). Compile `css({ '& .divider': { '& .bar & .baz': { color: 'red.500' } } })` and assert `:is(.<cls> .divider) .bar :is(.<cls> .divider) .baz`. Compile `css({ '& > .row': { '& + &': { color: 'red.500' } } })` and assert `:is(.<cls> > .row) + :is(.<cls> > .row)`. Compile the control `css({ '& > p': { '&:hover': { color: 'red.500' } } })` and assert the unchanged textual `.<cls> > p:hover`. Selectors print v2's `nested_selector_parity.rs:675/:686` shapes byte-for-byte modulo our class stem.
- [x] `ATM-COND-29` `[reference]` `[seam]` —
  **A pseudo-class stacked under a pseudo-element parent must reorder before the pseudo-element in the same compound.**
  Station `ATM-COND-29` (SPEC-V2-80). Compile `css({ '&::before': { '&:focus': { color: 'red.500' } } })` and assert `:focus::before`, never the invalid `::before:focus`; the `'&::after'` + `'&:hover'` twin asserts `:hover::after`. Compile the dialect `css({ _before: { _focus: { color: 'green.500' } } })` and assert the `:is(:focus, [data-focus])` compound lands before `::before`. Compile the three-level `{'&::before': {'&:hover': {'&:focus': …}}}` stack and assert `:hover:focus::before`. Controls: pseudo-class-outer + pseudo-element-inner (`{'&:hover': {'&::before': …}}`) stays textually `:hover::before`, and a descendant member under a pseudo-element parent (`{'&::before': {'& .kid': …}}`) keeps the pseudo-element in its own compound. Selectors print v2's `nested_selector_parity.rs:455/:466` shapes byte-for-byte modulo our class stem.
- [x] `ATM-COND-25` `[reference]` `[seam]` —
  **Every unquoted `&` must substitute, including inside functional-pseudo argument lists.**
  Station `ATM-COND-25` (SPEC-V2-70). Compile the eight self-`&` shapes — `&:not(&.no)`, `&:has(&, :not(&))`, `&.b :not(& + &)`, `&.b:not(& + &)`, `&.b :is(&)`, `&.b:is(&)`, `&:is(.bar, &.baz)`, `&:not(&)` — and assert each rule carries the runtime class in every `&` position (regex class backreferences, one want per arm, zero diagnostics). Selectors print v2's `nested_selector_parity.rs:169/:224/:301/:312/:334/:356/:411/:422` shapes byte-for-byte modulo our class stem.
- [x] `ATM-COND-26` `[reference]` `[seam]` —
  **Compound and multi-`&` keys must substitute every `&` textually at one level.**
  Station `ATM-COND-26` (SPEC-V2-71). Compile `&&`, `&&&`, `&.b&`, `&&+&`, `&+&`, `&.b &`, and `& .bar & .baz & .qux`, and assert `.<cls>.<cls>`, `.<cls>.<cls>.<cls>`, `.<cls>.b.<cls>`, `.<cls>.<cls>+.<cls>`, `.<cls>+.<cls>`, `.<cls>.b .<cls>`, and `.<cls> .bar .<cls> .baz .<cls> .qux` (one want per arm, zero diagnostics). Selectors print v2's `nested_selector_parity.rs:235/:257/:268/:323/:345/:367/:400` shapes byte-for-byte modulo our class stem.
- [x] `ATM-COND-27` `[reference]` `[seam]` —
  **Tag / class / BEM compounds, ancestors, tails, and bare `&` must substitute textually; bare `&` is a distinct key with a class-only selector.**
  Station `ATM-COND-27` (SPEC-V2-72). Compile `&_elem`, `body &:hover b`, the three-level `.c &` tail, `&html`, `html&`, `&h1, &h2`, `&(:focus)`, `&+.baz, &.qux`, `&>.bar`, `body&`, `.foo&`, and bare `&` beside a same-value unconditioned control. Assert `.<cls>_elem`, `body .<cls>:hover b`, `.c .<cls>:hover .b`, `.<cls>html`, `html.<cls>`, `.<cls>h1, .<cls>h2`, `.<cls>(:focus)`, `.<cls>+.baz, .<cls>.qux`, `.<cls>>.bar`, `body.<cls>`, `.foo.<cls>`, and two bare `.<cls>` rules whose classes differ (`[&]` vs none). `&_elem` / `&html` / `&h1, &h2` merge the class into a longer identifier and `&(:focus)` is unparsable, so those four runtime classes are documented unmatchable (`UNMATCHABLE_CLASSES`) and the selector quarantined (`CSS_QUARANTINE`) — both engines print the shapes, neither can match them. Selectors print v2's `nested_selector_parity.rs:48/:59/:103/:279/:290/:378/:532/:587/:598/:609/:620/:631` shapes byte-for-byte modulo our class stem.
- [x] `ATM-COND-28` `[reference]` `[seam]` —
  **Pseudo-element placements must print textually and `&`-first stacks must distribute down the chain.**
  Station `ATM-COND-28` (SPEC-V2-73). Compile `& ::after`, `::before&`, `:before&`, and `::before &`, and assert `.<cls> ::after`, `::before.<cls>`, `:before.<cls>`, and `::before .<cls>`. Compile the `&:last-child` + `& :is(.a, .b)` stack, the `& .b/.c/.d` tower, and the `& > .row > .cell` tower, and assert `.<cls>:last-child :is(.a, .b)`, `.<cls> .b .c .d`, and `.<cls> > .row > .cell` (one want per arm, zero diagnostics). Selectors print v2's `nested_selector_parity.rs:444/:488/:499/:510/:543/:554/:565` shapes byte-for-byte modulo our class stem.
- [x] `ATM-COND-30` `[reference]` `[seam]` — **[SPEC-V2-47 utility half, Overmatch Ph2]**
  **`& + &` and `& ~ &` authored in `css()` must substitute both positions; two-level stacks and comma descendant lists must scope every member.**
  Station `ATM-COND-30` (Overmatch Ph2 pins). Compile `css({ '& + &': … })` beside `& ~ &`, a two-level `'& > p': { '&:hover': … }` stack, and `'& .one, & .two'`. Assert `.<cls> + .<cls>`, `.<cls> ~ .<cls>`, `.<cls> > p:hover`, and `.<cls> .one, .<cls> .two` with zero diagnostics — the utility-path spelling the globalCss stations prove only globally. Panda: `nested_selector_parity.rs:92`, `:125`, `:180`, `:202`.
- [x] `ATM-COND-31` `[reference]` `[seam]` — **[SPEC-V2-48 raw arm, Overmatch Ph2]**
  **Raw `&::` spelling must lower like the `_before`/`_after` dialect, with compound order and comma lists.**
  Station `ATM-COND-31` (Overmatch Ph2 pins). Compile `css({ '&::after': … })` beside single-level `'&:hover::before'` and `'&::before, &::after'`. Assert `.<cls>::after`, `.<cls>:hover::before` (pseudo-class before pseudo-element), and the two-member comma list with zero diagnostics. Stacked pseudo-element-outer reorder is SPEC-V2-80. Panda: `nested_selector_parity.rs:433`, `:466`, `:477`.

### Design Token Resolution

- [x] `ATM-TOKEN-01` `[reference]` `[seam]` —
  **Category-prefixed design token paths must resolve to canonical `var(--...)` custom properties.**
  Station `ATM-TOKEN-01`. `colors.blue.600` → `var(--colors-blue-600)`, `radii.md` → `var(--radii-md)`, `fonts.mono` → `var(--fonts-mono)`.
- [x] `ATM-TOKEN-02` `[reference]` `[seam]` —
  **Bare color token paths on color-accepting properties must resolve to `--colors-` custom properties.**
  Station `ATM-TOKEN-02`. `blue.600` / `gray.800` on color props become `var(--colors-…)`. `mt="blue.600"` stays raw and warns.
- [x] `ATM-TOKEN-03` `[reference]` `[seam]` —
  **Color token opacity modifiers (`/opacity`) must resolve to standard `color-mix` CSS functions.**
  Station `ATM-TOKEN-03`. `colors.blue.600/50` and `red.500/25%` become `color-mix(in srgb, var(--colors-…) N%, transparent)`.
- [x] `ATM-TOKEN-04` `[reference]` `[seam]` —
  **CSS color keywords must pass through as raw values without custom property conversion.**
  Station `ATM-TOKEN-04`. `transparent` / `currentColor` / `black` / `white` stay raw, never `var(--colors-transparent)`.
- [x] `ATM-TOKEN-05` `[reference]` `[seam]` —
  **`compile()` must ingest BaseSystem token collections, replacing heuristic category checks with authoritative lookup.**
  Station `ATM-TOKEN-05`. A custom dump resolves `colors.brand`; unknown `blue.600` passes through with a warning. The compiler does not invent tokens.
- [x] `ATM-TOKEN-06` `[reference]` `[seam]` —
  **Opacity-modifier parsing must ignore slashes that belong to the CSS value and must refuse empty segments.**
  Compile `css({ bg: 'rgb(251 146 60 / 0.3)', color: 'red.500/', borderColor: '/40', outlineColor: 'colors.blue.600/50' })`. Assert the modern `rgb()` slash form passes through untouched with no `color-mix`, that `red.500/` and `/40` pass through and warn, and that only the well-formed modifier produces `color-mix`. `ATM-TOKEN-03` proves the happy path; a naive split on `/` destroys every modern color function, which is the most common real-world value shape in this list.
- [x] `ATM-TOKEN-07` `[reference]` `[seam]` —
  **A leading `-` on a scale token must resolve to a negated custom property reference.**
  Compile `css({ mt: '-4', mb: '4' })` with `spacing.4` in the dump. Assert `mt` emits `calc(-1 * var(--spacing-4))`, `mb` emits `var(--spacing-4)`, and the class keeps the minus (`mt_-4`). `ATM-RHYTHM-05` covers negative *rhythm* (`-1r`); station `ATM-TOKEN-07` proves the separate negative *token scale* path.
- [x] `ATM-TOKEN-08` `[reference]` `[seam]` —
  **`{category.path}` segments inside a composite value must expand while neighbouring literals pass through.**
  Compile `css({ border: '1px solid {colors.gray.800}', boxShadow: '0 1px 2px {colors.gray.200}' })`. Assert the token segment becomes `var(--colors-…)` and the surrounding literals are preserved verbatim. Assert an unterminated `{` stays raw and warns. Brace stripping exists for whole values (`resolve/tokens/mod.rs`), but interpolation inside a multi-token string is how shadows and borders are actually authored.
- [x] `ATM-TOKEN-09` `[reference]` `[seam]` —
  **Token lookup must cover every category the dump declares, not only colors, radii, and fonts.**
  Compile a dump exercising `shadows`, `sizes`, `spacing`, `zIndex`, `easings`, `durations`, and `gradients`, and resolve one property from each. Assert every category resolves to its `var(--<category>-<path>)` form and that a path in the wrong category for the property warns. Station `ATM-TOKEN-09` proves the breadth; size properties fall back to `spacing` when `sizes` misses, mirroring `static_css` wildcard expansion.
- [x] `ATM-TOKEN-11` `[reference]` `[seam]` —
  **A token whose dump value is a `{path}` reference must print as a `var()` alias in `@layer tokens`.**
  Station `ATM-TOKEN-11`. Compile a dump where `colors.ui.button.background` is `{colors.gray.950}` and assert `@layer tokens` prints `--colors-ui-button-background: var(--colors-gray-950)`, including under the dark selector. `system_layers.rs:88-96` implements this and the lib fixture depends on it heavily — the `ATM-COND-01` golden is full of `var(--colors-…)` aliases — yet no station claims it. This is distinct from `ATM-TOKEN-08`, which interpolates a brace path inside a composite authored value.
- [x] `ATM-TOKEN-12` `[reference]` `[seam]` —
  **A `{category.path}` reference that names no token in the dump must be a sync-failing error diagnostic naming the ref with file:line, and its declaration must be dropped.**
  Station `ATM-TOKEN-12`. Compile `css({ color: '{colors.nope}', border: '2px solid {colors.nope}' })` and assert two `severity: error` diagnostics reading ``unknown token reference `{colors.nope}` `` with the authoring file, line, and column; assert the bad declarations are omitted so the sheet stays valid CSS while valid siblings still emit. Panda's serialize path escapes the literal (`colors\.nope`, `core/__tests__/serialize.test.ts` "skip non-existent") — this engine fails closed instead (reference-neo D13, unblocking `NEO-TOKEN-02`).
- [x] `ATM-TOKEN-13` `[reference]` `[seam]` —
  **Every token path segment must kebab in the emitted custom property, matching Panda's full-kebab naming.**
  Station `ATM-TOKEN-13`. Compile a dump with the lib `progress.track` shape (`mixForeground` / `mixBackground` `{light, dark}` leaves) plus a camelCase mid-path segment (`meter.evenLessGood.foreground`) and assert `@layer tokens` defines `--colors-ui-progress-track-mix-foreground`, `--colors-ui-progress-track-mix-background`, and `--colors-ui-meter-even-less-good-foreground` in both color-mode blocks; assert no camelCase ghost (`mixForeground`, `evenLessGood`) appears anywhere; assert resolved uses reference the kebab names. Kebabing only the category left lib's hardcoded `var(--colors-ui-progress-track-mix-foreground)` (Slider `trackBackground`, `shared.ts`) undefined with an invalid `{...}` fallback, silently dropping the backdrop (RS-41, unblocking `NEO-TOKEN-14`).

### BaseSystem Spec Validation

- [x] `ATM-TOKEN-10` `[forbidden]` `[seam]` —
  **A foreign or malformed BaseSystem spec must be rejected with a diagnostic, never silently accepted as an empty system.**
  Pass core's portable `BaseSystem` shape (`{ name, fragment, jsxElements }`, `reference-core/src/types/public/BaseSystem.ts`) as `compile({ baseSystem })` and assert the compiler refuses it by name rather than binding `name` and treating every dictionary as empty. Assert a spec missing required collections is an error diagnostic. Two unrelated types share the name `BaseSystem` across this repo, the Rust struct has no `deny_unknown_fields`, and `Some(system)` beats `lib_fixture()` (`lib.rs:84-87`) — so handing over the wrong `BaseSystem` produces a compile with **no tokens, no conditions, and no breakpoints** while reporting success. Every token would pass through raw and every `_hover` would fall back to a preset. That is the single most damaging way to misuse this API and nothing currently stops it.

### Component Recipes & Closed Variants

- [x] `ATM-RECIPE-01` `[reference]` `[seam]` —
  **Recipe declarations must compile into closed variant classes scoped inside `@layer recipes`.**
  Compile component recipe declarations authored via `recipe()`. Assert that each declared variant permutation compiles into a single deterministic class name emitted inside `@layer recipes`. Assert that recipe classes do not pollute `@layer utilities`.
- [x] `ATM-RECIPE-02` `[reference]` `[seam]` —
  **Compiler must emit an authoritative variant lookup table for the runtime `recipe()` helper.**
  Compile a recipe with multiple variants and compound variants. Assert that `CompileResult` outputs a JSON variant table mapping variant prop combinations to compiled recipe class names. Assert that the runtime helper consumes this table directly without re-evaluating styles.
- [x] `ATM-RECIPE-03` `[reference]` `[seam]` —
  **StyleProps authored on a recipe host component must remain atomic utilities that override recipe styles.**
  Compile a component that applies a recipe and specifies additional StyleProps (e.g. `<Button variant="primary" mt="2r" bg="red.500" />`). Assert that `mt` and `bg` are emitted as utility atoms in `@layer utilities`. Because `@layer utilities` follows `@layer recipes`, assert that atomic StyleProps win naturally by CSS cascade precedence.
- [x] `ATM-RECIPE-04` `[reference]` `[seam]` —
  **`defaultVariants` and boolean variant keys must appear in the variant table and compile to closed classes.**
  Compile `recipe({ base, variants: { size: { sm, md }, muted: { true: { opacity: '0.5' }, false: { opacity: '1.0' } } }, defaultVariants: { size: 'md', muted: 'false' } })`. Assert the table marks `size: 'md'` and `muted: 'false'` in `defaultVariants` so the runtime helper needs no second source of truth, and assert the boolean axis compiles `button_m_true` and `button_m_false` classes in `@layer recipes`.
- [x] `ATM-RECIPE-05` `[reference]` `[seam]` —
  **Compound variant classes must be emitted after simple variant classes inside `@layer recipes`.**
  Compile a recipe with `size` and `tone` axes plus a compound matching both. Assert the compound rule is printed after both simple variant rules so that the more specific selection wins within the layer via CSS cascade source order.
- [x] `ATM-RECIPE-06` `[reference]` `[seam]` —
  **Recipe class stems must require explicit `className` and reject missing/dynamic identity, spread properties, non-object arguments, or duplicate `(system, className)`.**
  Compile `recipe()` call sites with missing `className`, dynamic arguments, and duplicate recipe class names within the same system. Assert that the compiler rejects each invalid construct with descriptive error diagnostics and only admits valid explicit identities. Every refusal carries `file`/`line`/`column` at the offending call (RS-18).
- [x] `ATM-RECIPE-07` `[reference]` `[seam]` —
  **Responsive variant values must lower to `@container`-wrapped per-breakpoint classes with runtime table entries.**
  Compile `recipe({ className: 'buttonStyle', variants: { variant: { solid, outline } } })` where each value carries `_hover`/`_disabled` leaves. Assert each value also emits `{breakpoint}:`-prefixed classes (one per width breakpoint, after all plain rules) wrapped in that breakpoint's `@container (min-width: …)` query inside `@layer recipes`, with the hover/disabled descendants inside the query block. Assert `RecipeRuntimeTable.responsiveVariantMap` maps axis → breakpoint → value → class so a runtime `{ base: 'solid', md: 'outline' }` selection emits both classes. Never `@media screen` (D8).

- [x] `ATM-RECIPE-08` `[reference]` `[seam]` —
  **A missing `className` prop must resolve from a `<Name>Recipe` binding, and explicit props must win.**
  Compile `const chipRecipe = recipe({ base, variants, defaultVariants })` with no `className` prop. Assert the table admits it with `className: 'chip'` (core parity: `summaryChipRecipe` → `summaryChip` in `@reference-ui/lib`), emitting the same base/variant/default classes an explicit `className: 'chip'` would. Assert a bare `Recipe` binding and a non-suffixed binding still refuse with the explicit-identity diagnostic (RS-33).

### Static CSS Expansion

- [x] `ATM-STATIC-01` `[reference]` `[seam]` —
  **`staticCss` declarations from BaseSystem must synthesize all declared property and token combinations as wants.**
  Station `ATM-STATIC-01`. Dump `color: ['*']` enumerates color tokens; `bg: ['n100', 'n200', 'n300']` lists values. Those wants join AST extract before resolve. `bg={prop}` looks up because the utilities exist. Lib fixture `staticCss` stays empty.
- [x] `ATM-STATIC-02` `[reference]` `[seam]` —
  **Static CSS wants must dominate AtomSet size and deduplicate seamlessly with AST-extracted wants.**
  Station `ATM-STATIC-02`. AST `bg="n300"` plus static `bg: ['n100', 'n300']` is one `.bg_n300` class. `n100` still prints from the dump.
- [x] `ATM-STATIC-03` `[reference]` `[seam]` —
  **`staticCss` must support conditions and every token category, and must diagnose a request it cannot satisfy.**
  Station `ATM-STATIC-03`. Compile a dump requesting `color` under `_hover`, a non-color wildcard (`borderRadius: ['*']` over the `radii` category), and an unknown property. Assert the hover utilities exist so a runtime `css({ color: prop, _hover: … })` can find them, assert the radii wildcard enumerates that category, and assert the unknown property warns. `wildcard_category` (`static_css.rs:43-49`) returns `None` for every non-color category and drops the request with no diagnostic, so a dump can ask for utilities and be silently ignored — the one failure mode that makes `staticCss` untrustworthy, since its whole purpose is guaranteeing a class exists for a value known only at runtime.

### Cascade Layers & Preamble

- [x] `ATM-LAYER-01` `[reference]` `[seam]` —
  **Compiled stylesheet must always nest the strict 6-layer preamble inside the package layer, in canonical order.**
  Compile arbitrary sources and inspect the first lines of the emitted stylesheet. Assert that it opens with `@layer <system> {` (CSS-escaped when the name carries scope characters), that the next line is verbatim `@layer reset, global, base, tokens, recipes, utilities;`, and that the sheet closes the package last. Assert that no CSS rule appears before the layer order statement and that no internal layer leaks to the top level (`M0-fix21-A`: a top-level `global` outranks another package's nested `utilities` on a composed page). The rejection path (`ATM-TOKEN-10`) is the only sheet that stays a bare preamble.
- [x] `ATM-LAYER-02` `[reference]` `[seam]` —
  **Empty layers must remain resilient and valid in the emitted stylesheet.**
  Station `ATM-LAYER-02`. Empty `reset` / `base` / `recipes` stay omitted. Fixture `globalCss` and tokens populate those layers (`ATM-LAYER-03`).
- [x] `ATM-LAYER-03` `[reference]` `[seam]` —
  **BaseSystem layer contents must populate `@layer global` and `@layer tokens`.**
  Station `ATM-LAYER-03`. Stored `globalCss` (`:root --spacing-root`) prints in `@layer global`. Token light values sit on `:root, [data-color-mode=light]`; dark overrides sit under `[data-color-mode=dark]`. Empty reset/recipes stay omitted. Reset chrome and keyframes are not in tonight's fixture.
- [x] `ATM-LAYER-04` `[reference]` `[seam]` —
  **All generated atomic utility rules and media query wrappers must be encapsulated inside `@layer utilities`.**
  Station `ATM-LAYER-04`. Unconditioned classes and wrapping `@media` / `@container` stay inside `@layer utilities`.
- [x] `ATM-LAYER-05` `[reference]` `[seam]` —
  **BaseSystem keyframes must print as `@keyframes` rules in `@layer global`.**
  Station `ATM-LAYER-05`. Compile a dump declaring `fadeIn { from { opacity: 0 } to { opacity: 1 } }` and a percentage-keyed animation. Assert both print with correct `from`/`to`/`%` selectors, and that an empty keyframes bag leaves the layer omitted (`ATM-LAYER-02`). The `animations.*` tokens already resolve to `var(--animations-fade-in-normal)` and reference `fadeIn` by name (see the `ATM-COND-01` golden), so today every animation token points at a keyframe the stylesheet never defines — a dangling reference in shipped CSS.
- [x] `ATM-LAYER-06` `[reference]` `[seam]` —
  **BaseSystem font-face declarations must print as `@font-face` blocks in `@layer global`.**
  Station `ATM-LAYER-06`. Compile a dump with one `globalFontface` entry per family and assert one `@font-face` block each, with `src` and `font-display` preserved. Metric-override leaves (`sizeAdjust`, `descentOverride`) print as `size-adjust` / `descent-override` when present and stay omitted when absent. `--fonts-sans: "Inter", …` resolves today with nothing loading Inter, so the token is a promise the stylesheet does not keep.
- [x] `ATM-LAYER-07` `[reference]` `[seam]` —
  **Atoms sharing an identical at-rule wrapper must nest under one copy of that at-rule.**
  Station `ATM-LAYER-07`. Three `sm` utilities share one `@container (min-width: 640px)` block. Nested `sm: { … }` object keys are not extract conditions; array slot 1 is `sm`. `cascade/mod.rs` groups after `CascadeKey` sort. Nested dual at-rules nest in author order (`ATM-GHOST-05`).
- [x] `ATM-LAYER-08` `[reference]` `[seam]` —
  **Reset content from the dump must print inside `@layer reset`, ahead of every other layer.**
  Station `ATM-LAYER-08`. Compile a dump with a small preflight slice and assert it lands in `@layer reset` and that no utility or token rule precedes it. `ATM-LAYER-02` only proves the empty case stays omitted; §6 notes reset chrome is still empty in the fixture, which means the first layer of the shipped cascade has never emitted anything.
- [x] `ATM-LAYER-09` `[reference]` `[seam]` —
  **`&` substitution in the global walker must distribute over comma members with `:is()` around combinator members.**
  Compile `globalCss({ 'body > p, body > ul': { margin: 0, '& ~ &': { marginTop: '10px' } } })` and assert the sibling rule prints `:is(body > p) ~ :is(body > p), :is(body > ul) ~ :is(body > ul)` — every combinator member wrapped, not just the first (Panda's unwrapped second member is a Panda bug, not parity). Comma members without a combinator distribute bare (`.ref-a ~ .ref-a, .ref-b ~ .ref-b`; `.ref-a .ref-kid, .ref-b .ref-kid`), and a lone combinator parent wraps too (`:is(.ref-stack > p) ~ :is(.ref-stack > p)`). Station `ATM-LAYER-09` (RS-11). `ATM-COND-14` pins the comma contract for `css()` utilities.
- [x] `ATM-LAYER-10` `[reference]` `[seam]` —
  **Keyframe bodies must resolve `{token}` refs to `var()` and `r` units to the rhythm calc.**
  Compile `keyframes({ grow: { from: { backgroundColor: '{colors.brand}', width: '1r' }, to: { backgroundColor: '{colors.brand}', width: '4r' } } })` and assert `background-color: var(--colors-brand)`, `width: var(--spacing-root)`, and `width: calc(4 * var(--spacing-root))` inside `@keyframes grow`, with zero diagnostics. Unresolvable values print verbatim (spec-owned, no source location), mirroring the tokens layer. Station `ATM-LAYER-10` (RS-16).
- [x] `ATM-LAYER-11` `[reference]` `[seam]` —
  **A `fontFace` array must sync and print one `@font-face` block per entry.**
  Station `ATM-LAYER-11` (RS-24). Sync a family whose `fontFace` is `[normalEntry, italicEntry]` beside a single-object control. Assert three `@font-face` blocks with style-distinguished srcs, the single form still printing one block, and zero diagnostics. `fontFace: []` means absent (cargo `bas_font_06`).
- [x] `ATM-LAYER-12` `[reference]` `[seam]` —
  **Top-level at-rule keys in `globalCss` must brace their inner selectors, and stacked at-rules must nest in author order.**
  Station `ATM-LAYER-12` (RS-27). Compile top-level `@media` over a comma selector, top-level `@supports` over nested `@media`, and the in-selector control. Assert braced blocks, outer-before-inner nesting, no braceless `@media … body` text, and zero diagnostics. Bare `@media` / `@supports` / `@container` keys are refused with a diagnostic, never printed.
- [x] `ATM-LAYER-13` `[reference]` `[seam]` —
  **Breakpoint keys and conditional values in `globalCss` must lower through the scale's `@media` queries.**
  Station `ATM-LAYER-13` (RS-28 + tails-c). Compile `.btn` with `width: { base, lg }`, an `sm` block, a `base` block, and `margin: { base, _dark, mdDown, nope }` plus an `smOnly` block. Assert the base rule plus `lg`/`sm` query blocks, the `_dark` scoped rule, `smOnly`/`mdDown` range queries with utility-shared bounds, no descendant selectors, and one `Unknown conditional key "nope"` diagnostic.
- [x] `ATM-LAYER-14` `[reference]` `[seam]` —
  **Keyframe bodies must alias props and unitize values through the `css()` chain.**
  Station `ATM-LAYER-14` (RS-30). Compile `keyframes({ roll: { from: { h: '4' }, to: { h: '8' } } })` with a `sizes.4` token beside `css({ h: '4' })` / `css({ h: '8' })` controls. Assert `from { height: var(--sizes-4); }` (Panda parity) and `to { height: 8px; }`, no verbatim `h:`, matching utilities, and zero diagnostics.
- [x] `ATM-LAYER-15` `[reference]` `[seam]` —
  **Bare token names in `globalCss` must resolve through the property's category.**
  Station `ATM-LAYER-15` (RS-35). Compile `body { fontFamily: 'sans' }` and `.card { borderRadius: 'md', outlineColor: 'ui.focus.ring', display: 'flex' }` against fonts/radii/colors fixtures. Assert `var(--fonts-sans)`, `var(--radii-md)`, `var(--colors-ui-focus-ring)`, verbatim `display: flex`, and zero diagnostics.

### Class Naming & Character Hygiene

- [x] `ATM-NAME-01` `[reference]` `[seam]` —
  **Canonical class names must combine property prefix and sanitized value string.**
  Station `ATM-NAME-01`. `marginTop="2r"` → `mt_2r`; runtime strings stay unescaped.
- [x] `ATM-NAME-02` `[reference]` `[seam]` —
  **Condition paths must prefix the base class name separated by colons.**
  Station `ATM-NAME-02`. `_hover` → `hover:bg_n300`; nested `_dark` + `_hover` prefix in order.
- [x] `ATM-NAME-03` `[reference]` `[seam]` —
  **Inline important declarations must suffix the class name with an exclamation mark.**
  Station `ATM-NAME-03`. `marginTop="2r!"` → `mt_2r!` / `.mt_2r\!`.
- [x] `ATM-NAME-04` `[reference]` `[seam]` —
  **Special characters in class names must be escaped with backslashes in CSS selectors.**
  Station `ATM-NAME-04`. Slashes, dots, colons, and brackets escape in selectors; runtime names stay clean.
- [x] `ATM-NAME-05` `[reference]` `[seam]` —
  **Whitespace characters in multi-token values must be converted to underscores in class names.**
  Station `ATM-NAME-05`. `3px solid` → `3px_solid`.
- [x] `ATM-NAME-06` `[reference]` `[seam]` —
  **Class names that begin with a digit or a double dash must be escaped so the selector is valid.**
  Station `ATM-NAME-06` plus `ATM-COND-01`. Digit-leading `2xl:p_6r` emits `.\32 xl\:p_6r` (hex escape plus terminating space). `--brand-x` escapes the first dash (`.\2d -brand-x_red`). Runtime class strings stay unescaped. `css({ '2xl': { p: '6r' } })` as a nested key is still dropped by extract (`is_condition_prop` is prefix-only); the digit-leading name comes from the named-breakpoint array path. Custom-property token resolution is `ATM-ATOM-05`.
- [x] `ATM-NAME-07` `[reference]` `[seam]` —
  **Selector escaping must be an allowlist: every character outside `[A-Za-z0-9_-]` is escaped.**
  Station `ATM-NAME-07`. Values containing `*`, `$`, `^`, `|`, `\`, `;`, `?`, `<`, backtick, and `é`, plus `'& > *'`, emit selectors that parse. `escape_css_selector` allowlists `[A-Za-z0-9_-]` (with the NAME-06 leading hex exceptions) and backslash-escapes everything else, including `*` from the child-selector wrap.

### Compiler Diagnostics & Fail-Closed Semantics

- [x] `ATM-DIAG-01` `[reference]` `[seam]` —
  **Valid source code compilation must emit an empty diagnostics collection.**
  Station `ATM-DIAG-01`. Valid StyleProps / `css()` emit no spurious warnings.
- [x] `ATM-DIAG-02` `[reference]` `[seam]` —
  **Dynamic non-literal expressions must emit fail-closed diagnostic warnings with source locations.**
  Station `ATM-DIAG-02`. Unresolvable identifiers get `warning` + file path; CSS still compiles.
- [x] `ATM-DIAG-03` `[reference]` `[seam]` —
  **AST parsing syntax errors must be recorded as error diagnostics without crashing the process.**
  Station `ATM-DIAG-03`. Malformed source yields `severity: error` and a `CompileResult` (no panic).
- [ ] `ATM-DIAG-04` `[reference]` `[seam]` —
  **Every diagnostic must carry a file path, a line, and a column.**
  Compile a file with a dynamic expression on a known line and assert the diagnostic reports that line and column, not just the path. Assert token-resolution warnings also carry a location. Extract call sites locate through `warn(span, …)` since `ATM-DIAG-05`; token and other resolve warnings still carry no position at all, so `ATM-DIAG-02` asserts the only thing that is populated. A compiler warning without a position is not actionable in an editor. `ATM-TOKEN-12` is the first located token diagnostic (missing-`{ref}` errors); the general claim stays open.
- [x] `ATM-DIAG-05` `[reference]` `[seam]` — **[SPEC-V2-77, Overmatch Ph1]**
  **Every diagnostic the extractor emits must carry `file:line:col` of the offending node and a stable machine-readable code.**
  Station `ATM-DIAG-05` (Overmatch Ph1; template row refined by SPEC-V2-67 in Ph3). `ExpressionWalk::warn` and `ObjectWalk::warn` take the offending `Span` and resolve it through `line_col`, so every extract refusal — dynamic identifiers, members, templates, spreads, computed keys, unknown props, mutated bindings — reports the sub-expression's position, not just the file. Since `ATM-SITE-51` the template refusal names the `${…}` part (`Dynamic non-literal template part N (kind)`) at the part's span instead of the whole template. `Diagnostic` gains `code: DiagnosticCode` (`diagnostics/codes.rs`), an enum with stable `ATM-W-…` / `ATM-E-…` / `ATM-I-…` strings serialized on every diagnostic, unique per failure class so the same authored mistake always reports the same code; `diagnostics/render.rs` provides the `{file}:{line}:{col} {code} {message}` format shared by CLI, Neo, and tests. Messages and warn-vs-silent behavior are unchanged; goldens move only by gaining `line`/`column`/`code`. The DIAG-04 general claim (token-resolution and other non-extract positions) stays open. Panda: byte spans on every diagnostic (`imports.rs:518`, `:527`; `calls.rs:749`); kinds like `panda_call_unextractable`, no published code table.
- [ ] `ATM-DIAG-06` `[reference]` `[seam]` —
  **Non-ASCII source and selectors must compile without panic, and columns must be counted in UTF-16 code units.**
  Compile a source containing an emoji before a style prop and a global selector with CJK and accented characters. Assert no panic, correct extraction, and that the reported column matches what an editor shows (UTF-16 units, so an emoji counts as two). Rust byte offsets and editor columns disagree for any non-ASCII file, which makes every diagnostic position wrong past the first multibyte character.

### Forbidden Architectural Patterns

- [x] `ATM-FORBID-01` `[forbidden]` `[seam]` —
  **Hashed whole-object class names are strictly forbidden.**
  Station `ATM-FORBID-01`. Output has no `.css-` whole-object hashes.
- [x] `ATM-FORBID-02` `[forbidden]` `[seam]` —
  **Runtime JavaScript evaluation during compilation is strictly forbidden.**
  Station `ATM-FORBID-02`. Dynamic calls are not evaluated; siblings still extract.
- [x] `ATM-FORBID-03` `[forbidden]` `[seam]` —
  **Maintaining a second class namer outside of `stylesheet::name` is strictly forbidden.**
  Station `ATM-FORBID-03`. Every `css.classes` value equals `stylesheet::name::class_name` for that atom (ghost gauge plus dedicated assertion).
- [x] `ATM-FORBID-04` `[forbidden]` `[seam]` —
  **Dynamic code generation of `css.js` or runtime JavaScript files is strictly forbidden.**
  Station `ATM-FORBID-04`. `CompileResult` is data; the compiler does not write `.js`.
- [x] `ATM-FORBID-05` `[forbidden]` `[seam]` —
  **Atomic must not keep private CSS property / color tables next to canon.**
  Station `ATM-FORBID-05`. `border.rs` / `dimensional.rs` / `tokens/mod.rs` must not grow `BORDER_CONFIGS` or hardcoded color props.
- [x] `ATM-FORBID-06` `[forbidden]` `[seam]` —
  **The test harness must not reimplement the namer or the escaper.**
  Assert that no TypeScript in `tests/` or `js/` constructs a class name or a CSS selector from an atom. The harness must obtain selectors from the compiler's own output, and `classSelector` in `tests/helpers.ts` — a regex that re-escaped class names in TypeScript (it lived at lines 149–151, not the 127–129 cited in an earlier draft of this case) — is deleted. A second escaper in the harness is the same split-brain `ATM-FORBID-03` forbids in the product, and it is worse here: because the harness escaped exactly the way the Rust denylist does, both sides agreed on an invalid selector and `ATM-GHOST-01` passed. This is precisely how `.2xl\:p_6r` became a blessed golden. Ghost membership is now `css-tree` class selectors inside `@layer utilities`.
- [x] `ATM-FORBID-07` `[forbidden]` `[seam]` —
  **No golden may contain machine-specific state.**
  Assert that no file under `tests/cases/*/output/` contains an absolute path, a home directory, a hostname, or a timestamp. The golden runner normalises the case root to a relative path, and `tests/portability.test.ts` fails the suite if any committed output embeds machine-specific state or an absolute diagnostics path.

### Engine Parity & Scale

- [x] `ATM-SEAM-01` `[reference]` `[seam]` —
  **The in-process Rust compiler and the N-API bridge must produce identical artifacts for the same input.**
  Compile one representative case through `atomic::compile` in Rust and through `compileSystem` from TypeScript, and assert the `stylesheet`, `css.classes`, `diagnostics`, and `recipes` are deep-equal. Assert the TS types in `js/types.ts` match the serde shape rather than drifting: `CssRuntime.classes` is optional in TS but always present in Rust, and `wants`/`recipes` are likewise optional on one side only. This is the repo's own unimplemented gate C (`README.md`), and without it Cargo tests and Vitest stations can disagree indefinitely — each proving a different engine.
- [x] `ATM-SEAM-02` `[reference]` `[seam]` —
  **`compile()` must accept the frozen `NativeCompileRequest` and emit the same CSS as the legacy shape for the same spec.**
  Station `ATM-SEAM-02`. The frozen `{ schemaVersion: 1, spec, jsxHosts, sourceRoot, declarationRoot, include? }` shape compiles the same input tree as legacy `{ baseSystem, rootDir }` and produces byte-identical `stylesheet`, `css.classes`, `diagnostics`, and `atomCount`. `jsxHosts` unions into the JSX host set (`src/hosts.rs`), so a configured host extracts without a file-local import; `declarationRoot` threads to styletrace as the sync-root hint; `include` scopes both shapes to matching sources (`ATM-SCAN-01`). A non-`1` `schemaVersion` fails closed with an error diagnostic. The legacy shape still compiles — the station golden is the legacy compile.
- [x] `ATM-SEAM-03` `[reference]` `[seam]` —
  **Every want must emit a runtime style plan, including wants that arrive through ternary arms, member access, and identifier spreads.**
  Station `ATM-SEAM-03` (RS-14, unblocks NEO-SITE-01/02/03). `css({ color: flag ? 'cherry' : 'ocean' })` emits one plan per arm; `css({ color: theme.primary })` emits the member plan; `css({ bg: 'amber', ...rest })` emits the spread plan beside its literal sibling. Authored capture (`ast_to_json_values`) mirrors `walk_expression` leaf-for-leaf, and identifier-spread unpack pushes authored entries alongside wants, so `css()` and JSX resolve every leaf through the plan index (`createStylePlanIndex` + `mergeStylePlans` returns each leaf's `css.classes` entry, never `''`). `null`, `undefined`, and `void` leaves stay omitted on both sides. Whole-object `css(styles)` is out of scope: it yields no wants at all, a separate gap.
- [x] `ATM-SCAN-01` `[reference]` `[seam]` —
  **The frozen request's `include` globs must scope both the `sourceRoot` scan and the legacy virtual `files` list.**
  Station `ATM-SCAN-01` (RS-10, unblocks NEO-SYNC-09). Under `include: ['theme/**']` the `css()` in `outside/` yields no utility and no diagnostics; an absent or empty include preserves scan-all. One `IncludeScope` (`src/includes/`) serves both paths with fast-glob flavor: `**` crosses directories, `*`/`?` stay in a segment, `{a,b}` expands, `[...]` matches one character, leading `!` negates. The legacy shape accepts `include` too; the station golden is the unscoped legacy compile.
- [ ] `ATM-PERF-01` `[reference]` `[seam]` —
  **Compiling a large source tree must stay within a declared time and memory budget, and `AtomSet` size must equal the unique atom count.**
  Compile a generated tree of a few thousand files, assert the wall time is under a recorded bound, and assert the atom count equals the number of distinct `(prop, value, when, important)` tuples. Every file is currently parsed twice — once for constants (`lib.rs:180-196`) and once for extract (`lib.rs:198-214`) — and there is no timing anywhere in the crate, so the first real `ref sync` on an app-sized tree is where that gets discovered. A budget makes the double parse visible before a user finds it.

---

## 5. Existing Proof Map

A tick is a `tests/cases/<ATM-*>` folder whose name is the ID. Standing gauges
cover `ATM-GHOST-01`, `ATM-LAYER-01`, `ATM-FORBID-06`, `ATM-ORDER-05`,
`ATM-ORDER-06`, and `ATM-VALID-02` (type + `ATM-ATOM-02`). Cargo `#[test]` is not a tick.

| Contract ID | Status | Harness | Proof Source |
| :--- | :--- | :--- | :--- |
| `ATM-GHOST-01` | `[x]` | `[seam]` | `tests/helpers.ts` `atomicGauges` (css-tree `@layer utilities`) |
| `ATM-GHOST-02` | `[x]` | `[seam]` | `tests/cases/ATM-GHOST-02/` |
| `ATM-GHOST-03` | `[x]` | `[seam]` | `tests/cases/ATM-GHOST-03/` |
| `ATM-GHOST-05` | `[x]` | `[seam]` | `tests/cases/ATM-GHOST-05/` |
| `ATM-SITE-01` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-01/` |
| `ATM-SITE-02` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-02/` |
| `ATM-SITE-03` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-03/` |
| `ATM-SITE-04` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-04/` |
| `ATM-SITE-05` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-05/` |
| `ATM-SITE-06` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-06/` |
| `ATM-SITE-07` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-07/` |
| `ATM-SITE-08` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-08/` |
| `ATM-SITE-09` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-09/` |
| `ATM-SITE-10` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-10/` |
| `ATM-SITE-11` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-11/` |
| `ATM-SITE-12` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-12/` |
| `ATM-SITE-13` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-13/` |
| `ATM-SITE-14` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-14/` |
| `ATM-SITE-15` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-15/` |
| `ATM-SITE-16` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-16/` |
| `ATM-SITE-17` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-17/` |
| `ATM-SITE-18` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-18/` |
| `ATM-SITE-19` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-19/` |
| `ATM-SITE-20` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-20/` |
| `ATM-SITE-21` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-21/` |
| `ATM-SITE-22` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-22/` |
| `ATM-SITE-24` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-24/` |
| `ATM-SITE-25` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-25/` |
| `ATM-SITE-26` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-26/` |
| `ATM-SITE-27` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-27/` |
| `ATM-SITE-28` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-28/` |
| `ATM-SITE-29` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-29/` |
| `ATM-SITE-30` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-30/` |
| `ATM-SITE-31` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-31/` |
| `ATM-SITE-32` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-32/` |
| `ATM-SITE-33` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-33/` |
| `ATM-SITE-34` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-34/` |
| `ATM-SITE-36` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-36/` |
| `ATM-SITE-37` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-37/` |
| `ATM-SITE-38` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-38/` |
| `ATM-SITE-39` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-39/` |
| `ATM-SITE-40` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-40/` |
| `ATM-SITE-41` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-41/` |
| `ATM-SITE-42` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-42/` |
| `ATM-SITE-43` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-43/` |
| `ATM-SITE-44` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-44/` |
| `ATM-SITE-45` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-45/` |
| `ATM-SITE-46` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-46/` |
| `ATM-SITE-47` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-47/` |
| `ATM-SITE-48` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-48/` |
| `ATM-SITE-49` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-49/` |
| `ATM-SITE-50` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-50/` |
| `ATM-SITE-51` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-51/` |
| `ATM-SITE-52` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-52/` |
| `ATM-SITE-53` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-53/` |
| `ATM-SITE-54` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-54/` |
| `ATM-SITE-55` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-55/` |
| `ATM-SITE-60` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-60/` |
| `ATM-SITE-61` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-61/` |
| `ATM-SITE-63` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-63/` |
| `ATM-SITE-64` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-64/` |
| `ATM-SITE-66` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-66/` |
| `ATM-SITE-67` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-67/` |
| `ATM-SITE-69` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-69/` |
| `ATM-SITE-72` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-72/` |
| `ATM-SITE-73` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-73/` |
| `ATM-SITE-74` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-74/` |
| `ATM-SITE-75` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-75/` |
| `ATM-SITE-76` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-76/` |
| `ATM-SITE-77` | `[x]` | `[seam]` | `tests/cases/ATM-SITE-77/` |
| `ATM-LEAF-01` | `[x]` | `[seam]` | `tests/cases/ATM-LEAF-01/` |
| `ATM-LEAF-02` | `[x]` | `[seam]` | `tests/cases/ATM-LEAF-02/` |
| `ATM-LEAF-03` | `[x]` | `[seam]` | `tests/cases/ATM-LEAF-03/` |
| `ATM-LEAF-04` | `[x]` | `[seam]` | `tests/cases/ATM-LEAF-04/` |
| `ATM-LEAF-05` | `[x]` | `[seam]` | `tests/cases/ATM-LEAF-05/` |
| `ATM-LEAF-06` | `[x]` | `[seam]` | `tests/cases/ATM-LEAF-06/` |
| `ATM-LEAF-07` | `[x]` | `[seam]` | `tests/cases/ATM-LEAF-07/` |
| `ATM-LEAF-08` | `[x]` | `[seam]` | `tests/cases/ATM-LEAF-08/` |
| `ATM-LEAF-09` | `[x]` | `[seam]` | `tests/cases/ATM-LEAF-09/` |
| `ATM-LEAF-10` | `[x]` | `[seam]` | `tests/cases/ATM-LEAF-10/` |
| `ATM-WANT-01` | `[x]` | `[seam]` | `tests/cases/ATM-WANT-01/` |
| `ATM-WANT-02` | `[x]` | `[seam]` | `tests/cases/ATM-WANT-02/` |
| `ATM-ATOM-01` | `[x]` | `[seam]` | `tests/cases/ATM-ATOM-01/` |
| `ATM-ATOM-02` | `[x]` | `[seam]` | `tests/cases/ATM-ATOM-02/` |
| `ATM-VALID-02` | `[x]` | `[seam]` | `CssValue` (no Bool/Null) + `ATM-ATOM-02` / `ATM-SITE-09` |
| `ATM-ATOM-03` | `[x]` | `[seam]` | `tests/cases/ATM-ATOM-03/` |
| `ATM-ATOM-04` | `[x]` | `[seam]` | `tests/cases/ATM-ATOM-04/` |
| `ATM-ATOM-05` | `[x]` | `[seam]` | `tests/cases/ATM-ATOM-05/` |
| `ATM-RHYTHM-01` | `[x]` | `[seam]` | `tests/cases/ATM-RHYTHM-01/` |
| `ATM-RHYTHM-02` | `[x]` | `[seam]` | `tests/cases/ATM-RHYTHM-02/` |
| `ATM-RHYTHM-03` | `[x]` | `[seam]` | `tests/cases/ATM-RHYTHM-03/` |
| `ATM-RHYTHM-04` | `[x]` | `[seam]` | `tests/cases/ATM-RHYTHM-04/` |
| `ATM-RHYTHM-05` | `[x]` | `[seam]` | `tests/cases/ATM-RHYTHM-05/` |
| `ATM-SHORT-01` | `[x]` | `[seam]` | `tests/cases/ATM-SHORT-01/` |
| `ATM-SHORT-02` | `[x]` | `[seam]` | `tests/cases/ATM-SHORT-02/` |
| `ATM-SHORT-03` | `[x]` | `[seam]` | `tests/cases/ATM-SHORT-03/` |
| `ATM-SHORT-04` | `[x]` | `[seam]` | `tests/cases/ATM-SHORT-04/` |
| `ATM-SHORT-05` | `[x]` | `[seam]` | `tests/cases/ATM-SHORT-05/` |
| `ATM-SHORT-06` | `[x]` | `[seam]` | `tests/cases/ATM-SHORT-06/` |
| `ATM-SHORT-08` | `[x]` | `[seam]` | `tests/cases/ATM-SHORT-08/` |
| `ATM-SHORT-09` | `[x]` | `[seam]` | `tests/cases/ATM-SHORT-09/` |
| `ATM-COND-01` | `[x]` | `[seam]` | `tests/cases/ATM-COND-01/` |
| `ATM-COND-02` | `[x]` | `[seam]` | `tests/cases/ATM-COND-02/` |
| `ATM-COND-03` | `[x]` | `[seam]` | `tests/cases/ATM-COND-03/` |
| `ATM-COND-04` | `[x]` | `[seam]` | `tests/cases/ATM-COND-04/` |
| `ATM-COND-05` | `[x]` | `[seam]` | `tests/cases/ATM-COND-05/` |
| `ATM-COND-06` | `[x]` | `[seam]` | `tests/cases/ATM-COND-06/` |
| `ATM-COND-07` | `[x]` | `[seam]` | `tests/cases/ATM-COND-07/` |
| `ATM-COND-08` | `[x]` | `[seam]` | `tests/cases/ATM-COND-08/` |
| `ATM-COND-09` | `[x]` | `[seam]` | `tests/cases/ATM-COND-09/` |
| `ATM-COND-10` | `[x]` | `[seam]` | `tests/cases/ATM-COND-10/` |
| `ATM-COND-11` | `[x]` | `[seam]` | `tests/cases/ATM-COND-11/` |
| `ATM-COND-13` | `[x]` | `[seam]` | `tests/cases/ATM-COND-13/` |
| `ATM-COND-14` | `[x]` | `[seam]` | `tests/cases/ATM-COND-14/` |
| `ATM-COND-15` | `[x]` | `[seam]` | `tests/cases/ATM-COND-15/` |
| `ATM-COND-16` | `[x]` | `[seam]` | `tests/cases/ATM-COND-16/` |
| `ATM-COND-17` | `[x]` | `[seam]` | `tests/cases/ATM-COND-17/` |
| `ATM-COND-18` | `[x]` | `[seam]` | `tests/cases/ATM-COND-18/` |
| `ATM-COND-19` | `[x]` | `[seam]` | `tests/cases/ATM-COND-19/` |
| `ATM-COND-20` | `[x]` | `[seam]` | `tests/cases/ATM-COND-20/` |
| `ATM-COND-21` | `[x]` | `[seam]` | `tests/cases/ATM-COND-21/` |
| `ATM-COND-22` | `[x]` | `[seam]` | `tests/cases/ATM-COND-22/` |
| `ATM-COND-23` | `[x]` | `[seam]` | `tests/cases/ATM-COND-23/` |
| `ATM-COND-24` | `[x]` | `[seam]` | `tests/cases/ATM-COND-24/` |
| `ATM-COND-29` | `[x]` | `[seam]` | `tests/cases/ATM-COND-29/` |
| `ATM-COND-25` | `[x]` | `[seam]` | `tests/cases/ATM-COND-25/` |
| `ATM-COND-26` | `[x]` | `[seam]` | `tests/cases/ATM-COND-26/` |
| `ATM-COND-27` | `[x]` | `[seam]` | `tests/cases/ATM-COND-27/` |
| `ATM-COND-28` | `[x]` | `[seam]` | `tests/cases/ATM-COND-28/` |
| `ATM-COND-30` | `[x]` | `[seam]` | `tests/cases/ATM-COND-30/` |
| `ATM-COND-31` | `[x]` | `[seam]` | `tests/cases/ATM-COND-31/` |
| `ATM-TOKEN-01` | `[x]` | `[seam]` | `tests/cases/ATM-TOKEN-01/` |
| `ATM-TOKEN-02` | `[x]` | `[seam]` | `tests/cases/ATM-TOKEN-02/` |
| `ATM-TOKEN-03` | `[x]` | `[seam]` | `tests/cases/ATM-TOKEN-03/` |
| `ATM-TOKEN-04` | `[x]` | `[seam]` | `tests/cases/ATM-TOKEN-04/` |
| `ATM-TOKEN-05` | `[x]` | `[seam]` | `tests/cases/ATM-TOKEN-05/` |
| `ATM-TOKEN-06` | `[x]` | `[seam]` | `tests/cases/ATM-TOKEN-06/` |
| `ATM-TOKEN-07` | `[x]` | `[seam]` | `tests/cases/ATM-TOKEN-07/` |
| `ATM-TOKEN-08` | `[x]` | `[seam]` | `tests/cases/ATM-TOKEN-08/` |
| `ATM-TOKEN-09` | `[x]` | `[seam]` | `tests/cases/ATM-TOKEN-09/` |
| `ATM-TOKEN-10` | `[x]` | `[seam]` | `tests/cases/ATM-TOKEN-10/` + `tests/token10.test.ts` |
| `ATM-TOKEN-11` | `[x]` | `[seam]` | `tests/cases/ATM-TOKEN-11/` |
| `ATM-TOKEN-12` | `[x]` | `[seam]` | `tests/cases/ATM-TOKEN-12/` |
| `ATM-TOKEN-13` | `[x]` | `[seam]` | `tests/cases/ATM-TOKEN-13/` |
| `ATM-RECIPE-01` | `[x]` | `[seam]` | `tests/cases/ATM-RECIPE-01/` |
| `ATM-RECIPE-02` | `[x]` | `[seam]` | `tests/cases/ATM-RECIPE-02/` |
| `ATM-RECIPE-03` | `[x]` | `[seam]` | `tests/cases/ATM-RECIPE-03/` |
| `ATM-RECIPE-04` | `[x]` | `[seam]` | `tests/cases/ATM-RECIPE-04/` |
| `ATM-RECIPE-05` | `[x]` | `[seam]` | `tests/cases/ATM-RECIPE-05/` |
| `ATM-RECIPE-06` | `[x]` | `[seam]` | `tests/cases/ATM-RECIPE-06/` |
| `ATM-RECIPE-07` | `[x]` | `[seam]` | `tests/cases/ATM-RECIPE-07/` |
| `ATM-RECIPE-08` | `[x]` | `[seam]` | `tests/cases/ATM-RECIPE-08/` |
| `ATM-STATIC-01` | `[x]` | `[seam]` | `tests/cases/ATM-STATIC-01/` |
| `ATM-STATIC-02` | `[x]` | `[seam]` | `tests/cases/ATM-STATIC-02/` |
| `ATM-STATIC-03` | `[x]` | `[seam]` | `tests/cases/ATM-STATIC-03/` |
| `ATM-LAYER-01` | `[x]` | `[seam]` | `tests/helpers.ts` `atomicGauges` |
| `ATM-LAYER-02` | `[x]` | `[seam]` | `tests/cases/ATM-LAYER-02/` |
| `ATM-LAYER-03` | `[x]` | `[seam]` | `tests/cases/ATM-LAYER-03/` |
| `ATM-LAYER-04` | `[x]` | `[seam]` | `tests/cases/ATM-LAYER-04/` |
| `ATM-LAYER-05` | `[x]` | `[seam]` | `tests/cases/ATM-LAYER-05/` |
| `ATM-LAYER-06` | `[x]` | `[seam]` | `tests/cases/ATM-LAYER-06/` |
| `ATM-LAYER-07` | `[x]` | `[seam]` | `tests/cases/ATM-LAYER-07/` |
| `ATM-LAYER-08` | `[x]` | `[seam]` | `tests/cases/ATM-LAYER-08/` |
| `ATM-LAYER-09` | `[x]` | `[seam]` | `tests/cases/ATM-LAYER-09/` |
| `ATM-LAYER-10` | `[x]` | `[seam]` | `tests/cases/ATM-LAYER-10/` |
| `ATM-LAYER-11` | `[x]` | `[seam]` | `tests/cases/ATM-LAYER-11/` |
| `ATM-LAYER-12` | `[x]` | `[seam]` | `tests/cases/ATM-LAYER-12/` |
| `ATM-LAYER-13` | `[x]` | `[seam]` | `tests/cases/ATM-LAYER-13/` |
| `ATM-LAYER-14` | `[x]` | `[seam]` | `tests/cases/ATM-LAYER-14/` |
| `ATM-LAYER-15` | `[x]` | `[seam]` | `tests/cases/ATM-LAYER-15/` |
| `ATM-NAME-01` | `[x]` | `[seam]` | `tests/cases/ATM-NAME-01/` |
| `ATM-NAME-02` | `[x]` | `[seam]` | `tests/cases/ATM-NAME-02/` |
| `ATM-NAME-03` | `[x]` | `[seam]` | `tests/cases/ATM-NAME-03/` |
| `ATM-NAME-04` | `[x]` | `[seam]` | `tests/cases/ATM-NAME-04/` |
| `ATM-NAME-05` | `[x]` | `[seam]` | `tests/cases/ATM-NAME-05/` |
| `ATM-NAME-06` | `[x]` | `[seam]` | `tests/cases/ATM-NAME-06/` + `ATM-COND-01` |
| `ATM-NAME-07` | `[x]` | `[seam]` | `tests/cases/ATM-NAME-07/` |
| `ATM-DIAG-01` | `[x]` | `[seam]` | `tests/cases/ATM-DIAG-01/` |
| `ATM-DIAG-02` | `[x]` | `[seam]` | `tests/cases/ATM-DIAG-02/` |
| `ATM-DIAG-03` | `[x]` | `[seam]` | `tests/cases/ATM-DIAG-03/` |
| `ATM-DIAG-05` | `[x]` | `[seam]` | `tests/cases/ATM-DIAG-05/` |
| `ATM-FORBID-01` | `[x]` | `[seam]` | `tests/cases/ATM-FORBID-01/` |
| `ATM-FORBID-02` | `[x]` | `[seam]` | `tests/cases/ATM-FORBID-02/` |
| `ATM-FORBID-03` | `[x]` | `[seam]` | `tests/cases/ATM-FORBID-03/` |
| `ATM-FORBID-04` | `[x]` | `[seam]` | `tests/cases/ATM-FORBID-04/` |
| `ATM-FORBID-05` | `[x]` | `[seam]` | `tests/cases/ATM-FORBID-05/` |
| `ATM-FORBID-06` | `[x]` | `[seam]` | `tests/helpers.ts` `atomicGauges` (`classSelector` deleted) |
| `ATM-FORBID-07` | `[x]` | `[seam]` | `tests/portability.test.ts` |
| `ATM-ORDER-01` | `[x]` | `[seam]` | `tests/cases/ATM-ORDER-01/` |
| `ATM-ORDER-02` | `[x]` | `[seam]` | `tests/cases/ATM-ORDER-02/` |
| `ATM-ORDER-03` | `[x]` | `[seam]` | `tests/cases/ATM-ORDER-03/` |
| `ATM-ORDER-04` | `[x]` | `[seam]` | `tests/cases/ATM-ORDER-04/` |
| `ATM-ORDER-05` | `[x]` | `[seam]` | `tests/helpers.ts` `atomicGauges` |
| `ATM-ORDER-06` | `[x]` | `[seam]` | `tests/helpers.ts` `atomicGauges` |
| `ATM-VALID-01` | `[x]` | `[seam]` | `tests/helpers.ts` `atomicGauges` + `testing/css.ts` writer guard |
| `ATM-VALID-03` | `[x]` | `[seam]` | `tests/cases/ATM-VALID-03/` |
| `ATM-MERGE-01` | `[x]` | `[seam]` | `tests/cases/ATM-MERGE-01/` |
| `ATM-MERGE-02` | `[x]` | `[seam]` | `tests/cases/ATM-MERGE-02/` |
| `ATM-MERGE-03` | `[x]` | `[seam]` | `tests/cases/ATM-MERGE-03/` |
| `ATM-UNIT-01` | `[x]` | `[seam]` | `tests/cases/ATM-UNIT-01/` |
| `ATM-UNIT-02` | `[x]` | `[seam]` | `tests/cases/ATM-UNIT-02/` |
| `ATM-UNIT-03` | `[x]` | `[seam]` | `tests/cases/ATM-UNIT-03/` |
| `ATM-SEAM-01` | `[x]` | `[seam]` | `tests/cases/ATM-SEAM-01/` + `tests/seam.test.ts` |
| `ATM-SEAM-02` | `[x]` | `[seam]` | `tests/cases/ATM-SEAM-02/` |
| `ATM-SEAM-03` | `[x]` | `[seam]` | `tests/cases/ATM-SEAM-03/` |
| `ATM-SCAN-01` | `[x]` | `[seam]` | `tests/cases/ATM-SCAN-01/` |

---

## 6. Remaining Cases [ ] (what a real `styles.css` still needs)

Q1 closed Tier 2 and the token breadth of Tier 3, plus `ATM-FORBID-07`,
`ATM-VALID-01`, and `ATM-VALID-03`. The 6 open IDs group below by what they buy.
Order is the recommended landing order.

### Tier 0 — stop shipping wrong CSS (P0, blocks production)

`ATM-GHOST-04`

`ATM-FORBID-07` (portable goldens plus `tests/portability.test.ts`) and
`ATM-VALID-01` (the standing CSS gauge and golden-writer guard) already landed.
`ATM-GHOST-04` stays open until the injectivity quarantine is empty.

### Tier 1 — make the suite able to hold a line

`ATM-DIAG-04` · `ATM-DIAG-05` · `ATM-DIAG-06`

`ATM-VALID-03` already landed. Determinism and idempotence are gauges, not
fixtures — a suite that cannot prove the same input yields the same bytes
cannot review a golden diff at all.

### Tier 2 — author APIs that are documented but not proven

Done. `ATM-LEAF-10`, `ATM-ATOM-05`, `ATM-SITE-12`, `ATM-SITE-14`,
`ATM-SITE-15`, and `ATM-SITE-16` are ticked.

`ATM-COND-10` is closed, proving `_active`, `_focus`, `_focusVisible`, and `_disabled`.

### Tier 3 — capability breadth the design system needs

`ATM-PERF-01`

`ATM-TOKEN-06` through `ATM-TOKEN-09` already landed. `ATM-SITE-13` has
landed (RS-5): the empty-host fallback is gone, `ATM-SITE-01` declares its
imports, and the two stations agree about what gating means.

### A tick is not a cutover

Ticking all 121 does not make atomic the production compiler, and the SPEC should
not be read as claiming it does. Native already writes `styles.css` behind
`REF_SYSTEM_ENGINE=native`. `CompileResult.css` and `CompileResult.recipes` are
still discarded by the host, and runtime `css()` / `recipe()` still call
`@reference-ui/styled`. That means `ATM-GHOST-01` — our P0 — is unenforceable
in production today, because the class map it protects never leaves the N-API
boundary, and `ATM-RECIPE-02`'s variant table has no consumer. Cutover work is
[`../../PLAN.md`](../../PLAN.md) § Reference UI; these cases prove the
compiler, and the compiler is only half the delivery.

`ATM-LAYER-05` and `ATM-LAYER-06` close dangling references that ship today: the
fixture emits `--animations-fade-in-normal: fadeIn 0.5s ease-out` and
`--fonts-sans: "Inter", …` while nothing defines `@keyframes fadeIn` or loads
Inter.

### Panda jobs we still do not add as cases

`jsxMatchTag` config, the literal evaluator, pure-function inlining, LightningCSS,
`split_css`, the `@layer` specificity polyfill, hooks and plugin callbacks,
`styled.div` factory, slot-recipe `sva`, patterns as factories, the `$` token
rename hook, `prefix` / `hash` / `separator` config, layer renaming, Vue / Svelte
/ Astro adapters, `include` globs as a styletrace substitute (scan scoping itself landed in `ATM-SCAN-01`), cross-file constant folding, and `colorPalette`
virtual tokens. The first eleven are refusals in §7; the last three are scope
decisions to revisit only if a component needs them.

### Deliberate divergences from Panda (keep these)

We are not chasing parity where their behavior is worse. Keep: no `currentColor`
completion on shorthands (§7.5); both ternary branches scooped rather than
evaluated (`ATM-LEAF-01`); one color-mode wrap via `data-color-mode` instead of
their `.dark &` / `[data-panda-theme]` split; `http(s):` values emitted rather
than silently dropped; unresolved token paths raw in the value with a warning
rather than escaped into the declaration; six layers with a distinct `global`;
readable atomic names with no hash option; and `const`-only constant folding
rather than their `export let` leniency.

---

## 7. "Do Not" / Tripwires

The following architectural constraints are strictly enforced across the `atomic` module. Violating any of these tripwires indicates an incorrect engine design:

1. **DO NOT interpret author JavaScript (`ATM-FORBID-02`)**:
   Never embed or invoke a JavaScript runtime, interpreter (QuickJS, V8, Boa), or AST evaluator (`ts-evaluator`) to run control flow, effects, or unknown calls. The enumerated fold table (`extract/fold/`, one node per form, fail-closed outside it) is constant folding, not evaluation — and anything it refuses diagnoses instead of executing. (Amended by Operation Overmatch Ph3: folding is not evaluating.)
2. **DO NOT invent a second class namer (`ATM-FORBID-03`, `ATM-GHOST-01`)**:
   Never generate or transform class names outside of `stylesheet::name::class_name`. Runtime `css()` map generation and stylesheet rule emission must call the exact same Rust function. Do not synthesize class names in TypeScript or post-process them with PostCSS.
3. **DO NOT emit hashed whole-object class names (`ATM-FORBID-01`)**:
   Never hash a style object into a single class name (e.g. `.css-1a2b3c`). Runtime `css()` is an open composition API requiring atomic utility classes (`.mt_2r`, `.bg_n300`) to concatenate overrides dynamically.
4. **DO NOT generate `css.js` or executable runtime code (`ATM-FORBID-04`)**:
   Never dynamically generate JavaScript code files for the runtime `css()` helper. The runtime helper is stable authored TypeScript in `reference-core/src/system/runtime`; the compiler emits only the data map (`CssRuntime`).
5. **DO NOT synthesize `currentColor` for omitted shorthand components (`ATM-SHORT-01`)**:
   Never supply a default color when decomposing composite shorthands like `borderBottom="3px solid"`. Emitting `currentColor` creates a catastrophic cascade reset that destroys independent `borderColor` styling.
6. **DO NOT guess JSX tags using PascalCase or regex (`ATM-SITE-08`)**:
   Never guess that an arbitrary PascalCase element is a styled component. Styleprop-bearing primitives are authoritatively identified via `styletrace` and `canon`.
7. **DO NOT split `atomic` into 12 micro-crates**:
   Follow the module layout within the single `atomic` crate. Panda's process split (`pandacss_extractor`, `pandacss_encoder`, `pandacss_utility`, …) is the example of the work, not a crate layout to copy.
8. **DO NOT collect `tokens()` or emit `StyleProps` interfaces**:
   Design system fragments (`tokens()`, `font()`, `globalCss()`) are collected in JavaScript by `reference-core/src/lib/fragments`. TypeScript interface generation is owned by `modules/typegen`.
9. **DO NOT own React DOM primitives**:
   Primitives (`Div`, `Button`, `Span`, etc.) live in `@reference-ui/react`. The atomic engine is a pure stylesheet compiler that knows nothing about React component lifecycles or virtual DOMs.
10. **DO NOT emit a value that is not CSS (`ATM-VALID-02`)**:
    Never print a Rust `Debug`/`Display` form into a declaration. `true`, `false`, and `null` are not CSS values. A want that cannot become a valid declaration is a diagnostic, not a rule. `border: true` is silently discarded by every browser, which is worse than a compile warning because the suite reports success.
11. **DO NOT sort rules by their text (`ATM-ORDER-01`, `ATM-ORDER-03`)**:
    Never order emitted rules by comparing selector or at-rule strings. Cascade order must key on parsed semantics — query magnitude in a normalized unit, declared pseudo precedence, property priority. Lexicographic ordering puts `min-width: 1024px` before `640px` and `_hover` after `_disabled`.
12. **DO NOT escape with a denylist (`ATM-NAME-07`)**:
    Never enumerate the characters that need escaping. Escape everything outside `[A-Za-z0-9_-]`, and hex-escape a leading digit. A denylist silently ships an invalid selector the first time an author uses a character nobody listed.
13. **DO NOT let the harness construct names (`ATM-FORBID-06`)**:
    Never build a class name or selector in TypeScript, including in test helpers. A harness-side escaper agrees with a compiler-side bug by construction and converts a gauge into a rubber stamp.
14. **DO NOT let documentation describe unbuilt behavior**:
    A module README states the contract that module actually enforces. If a guarantee is specified but not implemented, it belongs in this SPEC as a `[ ]` case, not in a README as prose. Three READMEs described the cascade sorter for long enough that a reviewer could read the module, believe ordering was handled, and ship the inversion in `ATM-ORDER-01`.
