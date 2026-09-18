# Mission: Panda v2 language / extraction parity

Status: `idea` (probe complete 2026-09-18; spec catalog consolidated 2026-09-18 — 62 entries in §1, parity run queued). Not a campaign. Not a port.

## The idea

Panda v2 (`vendor/panda`) is a Rust/Oxc rewrite of Panda v1 (`vendor/panda-v1`).
Same authoring product, new compiler. v1 is already the Neo corpus of record
(`packages/reference-neo/docs/evidence/panda-v1-*.md`). This mission is the
**v2 language probe**: what shapes the scanner is allowed to mean, and which
of those shapes we should cover with our own cases — Atomic stations first,
Neo browser cases second — under Reference's architecture (import-bound
sites, styletrace hosts, fail-closed diagnostics, no ghost classes).

The prize is a **fold table and a nesting table**, not v2's APIs. We already
extract; we want the same *kind* of static language, proven the way we prove
things. Framing (HQ): rival Panda v2 in **core atomic CSS output and AST**
— the language spec itself. Additive product features are separate missions,
not this one. Completeness frame (HQ): an absence stands only where v2
itself refuses or the item is non-language. Lib-usage is not a gate; "nobody
writes it today" never retires a language gap.

## What this is not

- Not "switch the engine to Panda v2."
- Not copying `crates/` layout, NAPI, source-transform-to-class-strings, or
  the `optimize.*` product knobs.
- Not re-mining v1. v1 is done (`panda-v1-core-corpus.md`,
  `panda-v1-parser-config-corpus.md`). Cite those; do not re-probe.
- Not taking Vue/Svelte/Astro, `styled()`, patterns, `cva`/`sva` as author
  APIs, `importMap`, PascalCase `matchTag`, tagged templates, or compiled
  bundler output. SITE `SPEC.md` already lists those as approved absences.

`vendor/README.md` still stands: v2 is contrast. Lift the language cases;
leave the direction.

## Where to look (the map from this probe)

Pins: `vendor/panda-v1` = `@pandacss/dev@1.12.1`; `vendor/panda` = v2 beta
tree (local clone; `clone.sh` currently sparse-checks out less than a full
v2 tree — if a path is missing, the clone on disk from Sep 11 is the one
this probe used). Vendor is gitignored.

### Architecture (read, don't copy)

| File | Why |
|---|---|
| `vendor/panda/V2_MIGRATION.md` § "What changed in v2" | Official delta vs v1. Extraction bullets: compiled JSX, cross-file static composition, recipe-variant diagnostics. |
| `vendor/panda/design-notes/extraction-pipeline.md` | One Oxc parse → imports → calls → JSX. Fast path when no Panda imports. |
| `vendor/panda/design-notes/literal-evaluator.md` | **The language.** What folds, what drops, `Literal::Conditional`, pure helpers vs `ts-evaluator`. |
| `vendor/panda/design-notes/cross-file-resolution.md` | Real `import { x } from './tokens'` — v1 mostly simulated this in one file. |
| `vendor/panda/design-notes/first-that-works.md` | New value form. Decide in/out of dialect before writing cases. |
| `vendor/panda/crates/RUST_GUIDE.md` | How they think about Oxc (parse once, fail closed, don't string-scan). |

### Extraction tests (the corpus to mine)

`vendor/panda/crates/pandacss_extractor/tests/` — 536 `#[test]`, one
integration binary (`tests/main.rs`). Probe counts 2026-09-18:

| File | n | Language it names |
|---|---:|---|
| `scope.rs` | 80 | Identifier / member / destructure / shadow / **pure-helper fold-or-drop** |
| `calls.rs` | 79 | `css()` args: spreads, computed keys, unwraps (`as`/`satisfies`/`!`), binary/template, multi-arg, `.raw` nesting |
| `jsx.rs` | 61 | Style props, spreads, compiled React runtime helpers (collapsed vs v1's per-bundler matrix) |
| `cross_file.rs` | 51 | Real resolver: aliases, re-exports, cycles, watch hashes |
| `first_that_works_calls.rs` | 34 | Folding `firstThatWorks()` at the call |
| `conditional_output.rs` | 30 | Ternary → `Conditional`; `&&`/`\|\|`/`??`; colliding spread unions |
| `framework_vue.rs` / `framework_svelte.rs` / `framework_astro.rs` | 29 / 20 / 12 | Out of dialect (SITE absence). Skip unless a rule is framework-agnostic. |
| `token_calls.rs` | 21 | `token()` / `token.var()` author surface — accept the calls, evaluate OUR way (`{path}` refs / vars, never parse-time hex). Synthesis, not copy. |
| `polish.rs` | 17 | TS enum members, param `TSTypeLiteral`, destructure defaults |
| `raw_spreads.rs` | 14 | `css.raw` composition (we have `css.object()` + plain objects) |
| `local_bindings.rs` | 13 | Shadowed `css`, mutated `let`, opaque `.raw` |
| `import_map.rs` | 13 | Out of dialect |
| `imports.rs` | 18 | Named / alias / namespace / type-only |
| `optional_chaining.rs` | 4 | `a?.b` unwrap; unresolvable base drops |

v1 contrast (already mined): `vendor/panda-v1/packages/extractor/__tests__/extract.test.ts` (188 node-by-node JSX AST cases) and `packages/parser/__tests__/css-raw-edge-cases.test.ts` (18, including a **fake** cross-file). v2 did not port the 188; it replaced them with named contracts.

### Atomic / CSS emit tests (second prize)

`vendor/panda/crates/pandacss_stylesheet/tests/` — 501 tests. For this
mission, only the ones that are **author language**, not v2 product CSS:

| File | n | Lift? |
|---|---:|---|
| `nested_selector_parity.rs` | 61 | **Yes, probe.** Combinator matrix v1 only sampled (`& + &`, `& ~ &`, `:is()`, `:has()`, `:where()`, comma groups, `&&&`, `&` inside attribute strings). Match against COND / CSS groups and lib sheet (`:is(` 75, `:where(` 11). |
| `atomic.rs` | 53 | **Selective.** Value-level ternary/`&&`/`??`, `css(a,b)` vs `css([a,b])` as merge list not responsive array, numeric/string scalar dedupe, vendor-prefix class names. Skip `@property` pruning / polyfill. |
| `encode.rs` (`pandacss_encoder`) | 22 | **Yes, as IR.** `Conditional` expands both branches, keeps surrounding condition, `!important` per arm. |
| `first_that_works.rs` | 72 | Dialect decision first. New language. Do not silently add. |
| `view_transition.rs` / `position_try.rs` / `polyfill.rs` | 11 / 6 / 26 | Out. Product APIs and cascade polyfill. |

v1's remaining strength: condition *stacking* (`_ltr` + `_dark` + `sm` + `_hover` on `& > p`) in `atomic-rule.test.ts` — already in the v1 core corpus. v2's nesting file is combinators; v1's is condition soup. Both matter; they are not the same list.

## 1. THE SPEC CATALOG (consolidated 2026-09-18; supersedes the probe gap list)

One entry per language feature, grouped by family. Each entry carries:
stable ID (`SPEC-V2-NN`, catalog order) · station/case (existing cite for
HAVE, proposal for TO-BUILD) · the language bit in one line · OUR snippet ·
PANDA's snippet with `file:line` (paths relative to `vendor/panda/crates/`;
`pandacss_extractor/tests/` unless noted) · status · source rows
(`ex-N` = extractor corpus §3 row N, `ex-DN` = §4 drop row N,
`ne-§` = nesting corpus, `xf-` = cross-file shape) · notes (fences, refuse
rules, dialect). Phases: **Ph1** soundness (build now) · **Ph2** station-only
(engine right, pin it) · **Ph3** builds (engine + dialect).

### ID ledger (deconflicted 2026-09-18)

Fold-table and cross-file both proposed `ATM-SITE-24..27`. Fold-table keeps
the block (a filed 15-station `24..38` sequence; moving it cascades).
Cross-file's four proposals move to next-free `39..42` (landed max is
`ATM-SITE-23`, so `39..42` are clear). `NEO-SITE-18..22` were uncontested.

| Kept (fold-table) | Moved (cross-file proposal → final) |
|---|---|
| ATM-SITE-24 collision union | ATM-SITE-24 xfile spreads → **ATM-SITE-39** |
| ATM-SITE-25 merge list | ATM-SITE-25 aliased import → **ATM-SITE-40** |
| ATM-SITE-26 call-arg unwraps | ATM-SITE-26 barrel probe → **ATM-SITE-41** |
| ATM-SITE-27 mid-array ternary | ATM-SITE-27 imported conditional → **ATM-SITE-42** |

New IDs minted here: `ATM-SITE-43` (enum fence), `ATM-SITE-44`
(type-literal fence), `ATM-SITE-45` (token surface), `ATM-SITE-46` (factory
consts), `ATM-COND-22` (landed max `ATM-COND-21`), `NEO-COND-16` (landed max
`NEO-COND-15`). No ledger rows filed — all proposals.

### Family A — literal folds

**SPEC-V2-01 — scalar const resolve — HAVE** · `ATM-SITE-06`, `NEO-SITE-02` · ex-1
_Language:_ an unmutated scalar `const` referenced by name resolves to its value.
_Ours:_ `const w = '5px'; css({ width: w })`
_Panda:_ same shape (`scope.rs:24`, `const_string_identifier_resolves`)
_Notes:_ foundation row; shorthand twin is SPEC-V2-36.

**SPEC-V2-02 — unmutated `let`/`var` resolve — TO-BUILD · Ph1** · rides `ATM-SITE-28` (controls) · ex-2
_Language:_ unmutated `let`/`var` inits resolve exactly like `const`.
_Ours:_ `let color = 'red'; css({ color })` → red, zero diagnostics
_Panda:_ `let color = 'red'; css({ color })` (`scope.rs:203`, `let_unmutated_resolves`; `var` twin `:241`)
_Notes:_ collector records every declarator kind (`collect.rs:34`, no kind check) — behavior exists, pins ride the mutated-`let` station (SPEC-V2-35).

**SPEC-V2-03 — null/undefined members don't block — HAVE** · `NEO-CSS-05`, `ATM-SITE-21` · ex-3
_Language:_ `null`/`undefined` props strip; static siblings still extract.
_Ours:_ `css({ color: 'red', width: undefined })` → color only
_Panda:_ same (`polish.rs:331`, `an_undefined_property_does_not_block_the_object`)

**SPEC-V2-04 — scalar canonicalization + vendor names — HAVE** · `ATM-UNIT-02`, `NEO-PARITY P18` · ne-§4
_Language:_ numeric/string scalar twins dedupe to one atom; vendor prefixes hyphenate into the class.
_Ours:_ `css({ padding: 1 })` + `css({ padding: '1' })` → one `.p_1`
_Panda:_ `padding: 1` + `padding: '1'` → one rule (`pandacss_stylesheet/tests/atomic.rs:215`); `WebkitBackgroundClip` → `.-webkit-background-clip_text` (`:33`)
_Notes:_ token scalars dedupe the same way (`:265`); non-canonical numerics (`01`, `NaN`, `0x10`, `'1e3'`) are REFUSED with a diagnostic (UNIT-02) — v2 coerces (`:240`), we don't (OUT, approved divergence).

### Family B — unwraps

**SPEC-V2-05 — value-level unwraps — HAVE** · `walk.rs:134`, `ast_value.rs:54`, `collect.rs:179` · ex-15
_Language:_ parens / `as` / `satisfies` / `!` are transparent in value position.
_Ours:_ `css({ width: '2r' as const })` → `2r`
_Panda:_ wrapped value part (`calls.rs:1660`, `nested_unwraps_and_folding`)
_Notes:_ `!` also sets the important flag (`ast_value.rs:64`) — keep that coupling.

**SPEC-V2-06 — call-arg unwraps — TO-BUILD · Ph1** · `ATM-SITE-26` + `NEO-SITE-20` · ex-16
_Language:_ `css()` args wrapped in parens / `as const` / `satisfies` / `!` extract like the bare arg.
_Ours:_ `css({ color: 'red' } as const)` → same wants as bare
_Panda:_ `css({...} as const)` (`calls.rs:1017`, `ts_as_const_unwraps`; parens `:1001`, satisfies `:1033`+`:2000`, `!` `:1052`)
_Notes:_ top fail-open-ish hole: `handle_css_arg` matches only Object/Conditional/Array (`css/mod.rs:25`), so these extract NOTHING with NO diagnostic. Fix is unwrap-then-match. `as const` on style objects is mainstream TS.

**SPEC-V2-07 — old-style `<any>` assertion — TO-BUILD · Ph1** · rides `ATM-SITE-26` · ex-17
_Language:_ `.ts`-only `<T>{...}` assertions unwrap at arg and value level.
_Ours:_ `css(<any>{ color: 'red' })` (`.ts` only)
_Panda:_ (`calls.rs:1068`, `ts_old_style_type_assertion_unwraps`)
_Notes:_ same silent skip as SPEC-V2-06; value-level `TSTypeAssertion` / `TSInstantiationExpression` fold into this row.

### Family C — unary / binary

**SPEC-V2-08 — unary `-`/`+` on numeric literals — TO-BUILD · Ph2** · `ATM-SITE-30` bundle · ex-18, ex-19
_Language:_ `-4`, `-0.5`, `+50` fold at the literal.
_Ours:_ `css({ margin: -4 })`, `css({ width: +50 })`
_Panda:_ (`calls.rs:1093`, `unary_negation_on_numeric_literal`; plus twin `:1110`)
_Notes:_ `+50` folds today only via `handle_unary`'s walk-through fallthrough — correct value, accidental mechanism. Pin here BEFORE SPEC-V2-09 narrows it (file SITE-30 before SITE-38).

**SPEC-V2-09 — non-foldable unary refuses — TO-BUILD · Ph1** · `ATM-SITE-38` · ex-20, ex-D8(`typeof` part)
_Language:_ `!lit`, `-ident`, `~x`, `typeof x` warn with a diagnostic and emit zero wants.
_Ours:_ `css({ color: !true })` → located warning, zero wants (`!true` must NEVER emit `true`)
_Panda:_ `!true` → `false` (`calls.rs:1126`, `unary_logical_not_on_literal`)
_Notes:_ soundness bug: the fallthrough walks the argument (`walk.rs:334`), so `!true` pushes want `true` today. Fix is refuse-with-diagnostic (real `!`/`~` folds optional). `void`→null is deliberate, keep (`walk.rs:317`).

**SPEC-V2-10 — string concat / coercion folds — TO-BUILD · Ph3** · `ATM-SITE-33` · ex-21
_Language:_ `+` with a string side folds (`'50'+'%'`, `1+'px'`, `n+'px'` over const `n`).
_Ours:_ `css({ width: 1 + 'px' })` → `1px`
_Panda:_ (`calls.rs:1148`, `binary_string_concatenation`; ident-operand twin `scope.rs:849`)
_Notes:_ needs HQ dialect rule first; pure static shapes, no interpreter risk.

**SPEC-V2-11 — numeric arithmetic + NaN/∞ drop — TO-BUILD · Ph3** · `ATM-SITE-33` · ex-22, ex-23
_Language:_ `2+3`, `'5'-1`, `true*4` fold per JS coercion; `1/0`, `NaN`, `'foo'-1` DROP, never emit.
_Ours:_ `css({ order: 2 * 3 })` → `6`; `css({ order: 'foo' - 1 })` → warn, skip
_Panda:_ (`calls.rs:1168`, `binary_numeric_arithmetic`; drop twin `:1394`)
_Notes:_ any fold MUST copy v2's rule (drop div-by-zero/NaN, `literal-evaluator.md` §JS semantics). The `'foo'-1` drop net is already HAVE via the generic dynamic warn — inside this entry.

**SPEC-V2-12 — equality / comparison as values — TO-BUILD · Ph3** · `ATM-SITE-33` · ex-24
_Language:_ `===`/`==`/`<`/`<=`/`>`/`>=` on literals fold to booleans in value position.
_Ours:_ `css({ zIndex: n > 1 })`
_Panda:_ (`calls.rs:1535`, `strict_equality_on_literals`; `==`/`<`/lexicographic twins `:1560`,`:1588`,`:1614`)
_Notes:_ guard-position `===` is already HAVE (ATM-SITE-23) — this is value position only. Fold into SITE-33 or absent with it.

### Family D — templates

**SPEC-V2-13 — static backtick values — TO-BUILD · Ph2** · `ATM-SITE-30` bundle · ex-25
_Language:_ interpolation-free template literals fold as plain strings.
_Ours:_ ``css({ color: `red` })`` → `red`
_Panda:_ (``calls.rs:1194``, `template_literal_without_interpolation`)
_Notes:_ static path folds today (`literal.rs:87`) — pin only. Interpolated templates stay REFUSED (OUT, SITE SPEC O8). Whitespace-collapse part → SPEC-V2-14.

**SPEC-V2-14 — value whitespace collapse — TO-BUILD · deferred** · no station proposed · ex-68
_Language:_ `'1px  solid red'` ≡ `'1px solid red'`; multiline backtick grids collapse outside quotes.
_Ours:_ `css({ margin: '1px  solid  red' })` → same atom as single-spaced
_Panda:_ (`calls.rs:156`, `string_value_whitespace_is_collapsed_outside_quotes`; backtick twin `:179`)
_Notes:_ no collapsing anywhere in `extract/`/`resolve/`/`atom/`/`canon` — twins mint distinct classes AND distinct declarations. Dedupe gap, not a paint bug. File a station when the sheet diet matters; until then this entry is the record.

### Family E — ternary / conditional

**SPEC-V2-15 — open-test ternary, both arms — HAVE** · `ATM-SITE-05/17/23`, `NEO-SITE-01` (+JSX `NEO-SITE-15`) · ex-30
_Language:_ open-test `?:` compiles both arms (values, JSX attrs, nested objects, mixed-type arms); runtime picks.
_Ours:_ `css({ color: isDark ? 'white' : 'black' })` → two atoms
_Panda:_ (`conditional_output.rs:25`, `ternary_with_non_literal_test_emits_both_branches`; atomic `:1528`; IR `pandacss_encoder/tests/encode.rs:452`)
_Notes:_ `encode.rs` pins the IR contract (one atom per arm, surrounding condition kept on every arm, per-arm `!important`, fused walker identical — 5 tests, no separate case; ours matches via SITE-01/17 + SEAM-03 + CSS-08). Foldable-test pick-one is D11 (differ #2), not this entry.

**SPEC-V2-16 — ternary shapes: nested / equal / partial — HAVE** · `ATM-SITE-05/21/23` · ex-32, ex-33, ex-34, ex-D4
_Language:_ nested open ternary scoops all leaves; equal branches collapse via `AtomSet` dedupe; one unresolvable branch keeps the resolvable arm + warns the other.
_Ours:_ `dark ? maybeFn() : 'black'` → black atom + one warning
_Panda:_ (`conditional_output.rs:487`, `nested_ternary_emits_nested_conditional`; partial `:69`; equal `:110`)
_Notes:_ call arm warns via the general path (NEO-SITE-06 precedent) — same net as v2 plus our diagnostic.

**SPEC-V2-17 — object-valued ternary arms — TO-BUILD · Ph2** · `ATM-SITE-27` · ex-35
_Language:_ `color: d ? { base, _hover } : { base }` routes each arm through the per-prop object machinery.
_Ours:_ `css({ color: isDark ? { base: 'white' } : { base: 'black' } })`
_Panda:_ (`conditional_output.rs:631`, `ternary_with_object_branches`)
_Notes:_ station-only: arms already route via `walk.rs:177` / `responsive.rs:42` (ATM-COND-17 proves the shape for authored objects).

### Family F — logical

**SPEC-V2-18 — logical with unresolvable / guard left — HAVE** · `ATM-SITE-05`, `NEO-SITE-08` · ex-27, ex-28
_Language:_ unresolvable-left `&&`/`||`/`??` emit the right operand; null/boolean-guard lefts short-circuit.
_Ours:_ `css({ color: maybeColor ?? fallback })` → fallback atom (+ warning for the unresolvable side)
_Panda:_ (`conditional_output.rs:251`, `nullish_coalesce_with_unresolvable_left_emits_right_operand`; `&&` twin `:155`, guards `:513`/`:531`; atomic `:1553`/`:1575`)
_Notes:_ our rule (walk both non-guard operands, `walk.rs:267`) vs v2's (right-operand) — same paint; ours diagnoses the dynamic side where v2 stays silent. Fail-closed-consistent.

**SPEC-V2-19 — all-literal short-circuit — TO-BUILD · deferred** · no station proposed · ex-29
_Language:_ `'x'&&'y'` → `'y'` only (no dead `'x'` atom).
_Ours:_ `css({ color: 'x' && 'y' })` → compiles a dead `'x'` atom today (paint-correct, sheet-extra)
_Panda:_ (`calls.rs:1499`, `logical_and_or_coalesce_with_literals`)
_Notes:_ literal-only short-circuit is pure win (no semantics risk) — file when the sheet diet matters.

### Family G — spreads

**SPEC-V2-20 — object spreads resolve — HAVE** · `ATM-SITE-05/11`, `NEO-SITE-03` · ex-36, ex-37
_Language:_ inline-object and local-identifier spreads merge into the arg.
_Ours:_ `css({ ...base, padding: '4px' })`
_Panda:_ (`scope.rs:651`, `object_spread_of_local_identifier_resolves`; inline twin `calls.rs:1241`)

**SPEC-V2-21 — dynamic spreads: skip / merge arms — HAVE** · `ATM-SITE-05`, `NEO-SITE-08` · ex-38, ex-39, ex-40, ex-D5
_Language:_ unresolvable spreads skip keeping static siblings; logical spreads merge the right operand; ternary spreads merge both arms (same-key → conditional value, distinct-key → both keys).
_Ours:_ `css({ ...unknown, color: 'red' })` → color + warn; `...(u ? { p: '1' } : { p: '2' })` → `1|2`
_Panda:_ (`conditional_output.rs:315`, `ternary_spread_with_same_key_emits_conditional_value`; logical `:274`; skip `calls.rs:638`; atomic `:1651`)
_Notes:_ all-dynamic objects yield zero wants + warnings (lenient per-member, ex-D5). Pending paint pin: `NEO-SITE-22` (runtime-`ok` `...(ok && extra)`; engine already HAVE via SITE-05) — TO-BUILD · Ph2.

**SPEC-V2-22 — colliding ternary-spread union — TO-BUILD · Ph2** · `ATM-SITE-24` + `NEO-SITE-18` · ex-41
_Language:_ static key + spread-ternary on the same key unions ALL values, order-independent.
_Ours:_ `css({ padding: '0', ...(u ? { padding: '1' } : { padding: '2' }) })` → 3 atoms, runtime picks
_Panda:_ (`conditional_output.rs:363`, `ternary_spread_colliding_with_static_parent_unions_all_values`; before-order twin `:389`)
_Notes:_ engine already unions (static want + both arm wants; wants unordered, merge positional at runtime — matches v2's order-independence). Pure row-filing work, zero code.

**SPEC-V2-23 — duplicate keys / multi-spread last-wins — HAVE** · `NEO-MERGE-01/02` · ex-43
_Language:_ duplicate keys and overlapping spreads resolve last-wins at runtime.
_Ours:_ `css({ color: 'red', color: 'blue' })` → both atoms, runtime picks blue
_Panda:_ (`calls.rs:1736`, `merge_two_inline_object_spreads_second_wins`; dup-key twin `:131`)
_Notes:_ architecture differs (we keep both atoms, v2 upserts at extract) but the claim holds at runtime.

**SPEC-V2-24 — nested-const spread keeps conditions — TO-BUILD · Ph3** · rides `ATM-SITE-29` · ex-44
_Language:_ spreading a const object whose nested conditions hold ternaries preserves the conditional data.
_Ours:_ `const s = { _hover: { ...(c ? { color: 'red' } : { color: 'blue' }) } }; css({ ...s })`
_Panda:_ (`conditional_output.rs:655`, `nested_const_spread_keeps_conditional_encode_data`)
_Notes:_ `unpack_local_const_object` lowers scalar leaves only and never scopes conditions (`object.rs:347` admits it); nested const objects unrecorded (same root as SPEC-V2-31). Shared station with the const-graph entry.

### Family H — arrays

**SPEC-V2-25 — responsive value arrays — HAVE** · `ATM-LEAF-05`, NEO responsive cases · ex-45
_Language:_ `padding: [4, 8, 12]` maps indices onto the breakpoint scale.
_Ours:_ `css({ padding: [4, 8, 12] })`
_Panda:_ (`calls.rs:444`, `array_value`)

**SPEC-V2-26 — null / dynamic array slots — HAVE** · `NEO-CSS-05`, `NEO-PRIM-04` · ex-46 (null/dynamic part)
_Language:_ `null` slots preserved; unresolvable slots omit + warn with arity kept via `enumerate`.
_Ours:_ `css({ padding: ['black', null, dyn] })` → black atom, null slot, warning
_Panda:_ (`calls.rs:1893`, `array_value_preserves_null_elements`; dynamic twin `:1922`)
_Notes:_ elision holes → SPEC-V2-27 control.

**SPEC-V2-27 — mid-array ternary slots — TO-BUILD · Ph2** · `ATM-SITE-27` · ex-47, ex-46 (elision), `css(c?a:b)` arg (`calls.rs:548` part)
_Language:_ `padding: [2, c ? 2 : 3, 4]` lands both arms at the same breakpoint; elision keeps arity; top-level `css(c ? a : b)` arg extracts.
_Ours:_ `css({ padding: [2, c ? 2 : 3, 4] })`
_Panda:_ (`conditional_output.rs:683`, `array_mid_slot_ternary_projects_conditional_at_index`; elision `calls.rs:1946`)
_Notes:_ station-only (`walk_array` recurses `walk_expression` per element, `responsive.rs:33`; `Elision` arm exists at `:29`). Whole-object `css(styles)` stays refused — this entry is ternary-args and holes only.

**SPEC-V2-28 — array spreads refuse — TO-BUILD · Ph1** · `ATM-SITE-37` · ex-48
_Language:_ `...` in array position (value or merge-list) refuses with a LOCATED diagnostic naming the spread; no shifted atoms; wants/plans agree.
_Ours:_ `css({ padding: [1, ...[2, 3], 4] })` → warning, no atoms
_Panda:_ flattens (`calls.rs:1265`, `literal_array_spread_inside_arg`) — we refuse instead (stricter, deliberate)
_Notes:_ soundness hole: `SpreadElement` yields `None` from `as_expression()`, so both walkers skip it while `enumerate` still consumes the slot — `4` lands one breakpoint early with NO diagnostic, and the plan path collapses the whole array to `None` (wants without plans). Refuse in BOTH walkers (`responsive.rs`, `css/mod.rs:55`).

**SPEC-V2-29 — call-form `css([...])` merge list — TO-BUILD · Ph2** · `ATM-SITE-25` + `NEO-SITE-19` · ex-49
_Language:_ `css([{...}, {...}, false])` merges object elements, skips falsy silently, NEVER goes responsive.
_Ours:_ `css([{ margin: '1r' }, { margin: '3r' }, false])` → both atoms unconditioned
_Panda:_ (`pandacss_stylesheet/tests/atomic.rs:1474`, `array_css_arg_is_a_merge_list_not_a_responsive_array`; in-conditional `:1680`, cond-element `:1711`; SITE SPEC L215)
_Notes:_ station-only (`walk_array_arg` recurses per element, `css/mod.rs:50`). The responsive-vs-merge confusion SPEC L215 warns about is structurally impossible (value arrays → `responsive.rs`, arg arrays → `walk_array_arg`). Only the JSX form is stationed today (ATM-SITE-19).

### Family I — member / destructure

**SPEC-V2-30 — single-hop const member — HAVE** · `ATM-SITE-06`, `NEO-SITE-02` · ex-4
_Language:_ `theme.primary` over a const object resolves one hop.
_Ours:_ `const t = { primary: 'red' }; css({ color: t.primary })`
_Panda:_ (`scope.rs:762`, `jsx_attribute_resolves_identifier` — JSX twin of the same hop)

**SPEC-V2-31 — member depth — TO-BUILD · Ph3** · `ATM-SITE-29` (shared) · ex-5, ex-6, ex-7
_Language:_ multi-hop `tokens.colors.red`, member-hop spreads `...styles.hover` through conditionals, and `tokens!.color` unwrap-through-member all resolve.
_Ours:_ `css({ color: tokens.colors.red })`
_Panda:_ (`scope.rs:286`, `static_member_access_resolves`; hop-through-conditional `conditional_output.rs:707`; `!`-unwrap `calls.rs:2024`)
_Notes:_ `handle_static_member` matches only bare `ident.prop` (`walk.rs:241`); collector records one literal level (`collect.rs:138`); member-arg spreads fall to "Dynamic object spread" (`object.rs:273`). Shared station with SPEC-V2-24/34.

**SPEC-V2-32 — destructure binds — TO-BUILD · Ph3 (low priority)** · `ATM-SITE-35` · ex-10
_Language:_ `const { color } / { primary: color } / { color, ...space } / [a, b] / { color = 'red' }` bind const members incl. defaults.
_Ours:_ `const { color } = tokens; css({ color })`
_Panda:_ (`scope.rs:547`, `object_destructure_resolves_member`; rename `:567`, rest `:587`, index `:629`, defaults `polish.rs:269`)
_Notes:_ collector matches `BindingIdentifier` only (`collect.rs:35`) — destructured names unrecorded. Grouped single row; lib/Book write zero const-destructuring-for-styles (App. C grep) so this stays low priority but IN dialect.

### Family J — const-graph (scope / shadow / chains / callforms)

**SPEC-V2-33 — param shadows of `css` — HAVE** · `ATM-SITE-10`, `NEO-SITE-05` · ex-11
_Language:_ a param named `css` shadows the import (call dropped); outer live calls still extract.
_Ours:_ `function f(css) { css({ color: 'red' }) }` → dropped, zero wants
_Panda:_ (`scope.rs:690`, `function_parameter_shadows_css_import`; arrow `:707`, outer-lives `:737`)

**SPEC-V2-34 — const-graph depth — TO-BUILD · Ph3** · `ATM-SITE-29` · ex-13, ex-D10, xf-R3, xf-R4
_Language:_ scalar alias chains resolve transitively; const objects record identifier values + spreads; inner scope wins over outer (no union bloat).
_Ours:_ `const a = 'red'; const b = a; css({ color: b })` → red
_Panda:_ (`scope.rs:1349`, `inner_scope_shadows_outer_same_named_const`; closure `:1369`; xfile chain `cross_file.rs:265`, const-object refs `:242`/`:291`)
_Notes:_ `record_declaration` ignores identifier inits (`collect.rs:48`); `insert_scalar` unions same-named leaves (`index.rs:27`, scope-blind → bloat, App. B4); `record_object_entry` records literal props only (owns xf-R3/R4 — same-file gaps surfacing cross-file). Whole-object USES (`css(b)` where `b` is an object) stay refused — differ #3.

**SPEC-V2-35 — mutated `let` drops — TO-BUILD · Ph1** · `ATM-SITE-28` · ex-D2 (mutation part)
_Language:_ a `let` with any assignment drops to warn + zero wants (never resolves its stale init).
_Ours:_ `let color = 'red'; color = 'blue'; css({ color })` → warning, zero wants
_Panda:_ (`scope.rs:224`, `let_mutated_drops_resolution`)
_Notes:_ soundness bug: zero mutation tracking anywhere in `extract/` (`grep mutat` empty) — stale `'red'` emits with no diagnostic today. Fix: record `let`/`var` until an assignment, or drop them. Unmutated controls are SPEC-V2-02.

**SPEC-V2-36 — micro-fold bundle — TO-BUILD · Ph2** · `ATM-SITE-30` · ex-1 (shorthand), ex-60 (Ms part), ex-64 (string-head), ex-66
_Language:_ shorthand `{ color }`, `css({})`, `css('panda', {...})`, `cx('card', css({...}))`, no-arg `css()` — all fold/skip as today, zero new warnings.
_Ours:_ `css({ color })`; `css('panda', { color: 'red' })`
_Panda:_ (`scope.rs:262`, `shorthand_property_resolves_via_resolver`; empty `calls.rs:224`, string-head `:1697`, nested `:679`, no-arg `:1687`)
_Notes:_ pins accidental-but-correct mechanisms before SPEC-V2-09 narrows them. (The positional-`None` half of `:1719` is differ #3 — our whole-object arg has no IR slot.)

**SPEC-V2-37 — callee-identity + drop micros — TO-BUILD · Ph2** · `ATM-SITE-36` · ex-12, ex-53/ex-D7, ex-62, ex-D2 (no-init), ex-D9, `missing_member` (`scope.rs:305`)
_Language:_ `panda({...})`, `panda.somethingElse({...})`, block-scoped `const css`, `const a = a`, `a↔b` cycles, `let color;`, bare `getColor`, `tokens.colors.blue` miss — each skips/warns exactly once with siblings kept.
_Ours:_ `{ const css = (x) => x; css({ color: 'red' }) }` → dropped
_Panda:_ (`calls.rs:965`, `namespace_property_outside_name_allowlist_is_skipped`; bare-namespace `:981`; block-shadow `scope.rs:720`; cycle `:832`; no-init `:1403`)
_Notes:_ pins fail-closed mechanics. Declarator shadows register on the enclosing function scope (`mod.rs:241`) — over-shadowing later siblings is fail-closed. Identifier inits are never recorded, so cycles are trivially safe + warn (no recursion possible).

**SPEC-V2-38 — call discovery + multi-arg merge — HAVE** · `ATM-SITE-02/04/12`, `NEO-SITE-04` (identity) · ex-60 (HAVE part), ex-61, ex-63, ex-67, ne-§4 (multi-arg)
_Language:_ literal calls found inside JSX / fn bodies / nested args; multi-arg `css(a, b, …)` merges every arg (no cap); unmatched callees ignored; `` css`…` `` is not a site.
_Ours:_ `css({ color: 'red' })` anywhere; `css(a, b)` → both atom sets
_Panda:_ (`calls.rs:480`, `multiple_calls_in_one_source`; in-JSX `:657`, in-fn `:702`, unmatched `:523`, tagged `:2040`; multi-arg `pandacss_stylesheet/tests/atomic.rs:1449`, 4-arg `:1596`, arg-`&&` `:1626`)
_Notes:_ descent is by construction (SITE-10 shadow test proves fn-body descent). Import alias/namespace identity (`nCss`, `panda.css`) rides here via SITE-15/NEO-SITE-04.

### Family K — helpers + refusals

**SPEC-V2-39 — pure-helper folds — TO-BUILD · Ph3** · `ATM-SITE-31` + `NEO-SITE-21` (paint arm) · ex-50
_Language:_ closed single-expression helpers fold: nullary/args/defaults, `function` decls, both IIFEs, object-return spread into `css()`/JSX; captures bake.
_Ours:_ `const get = () => 'red'; css({ color: get() })` → red
_Panda:_ (`scope.rs:908`, `local_function_call_return_folds`; IIFE `:927`, decl `:945`, defaults `:1073`, object-return `:1030`)
_Notes:_ HQ DIALECT GATE FIRST — highest-value new language AND the easiest place to become a JS interpreter. Fence closed: single-expression body, no control flow, no `this`, args fold, captures must fold (mirror v2's `pure_fn` descriptor). Fail closed; list the allowed shapes. (v1 folded these incidentally; v2 named the descriptor — take the descriptor, especially the refuse list.)

**SPEC-V2-40 — helper-returned computed key — TO-BUILD · Ph3 BLOCKED** · no station · ex-51
_Language:_ `(name) => ...` helper result used as `[groupHover('cool')]` key.
_Ours:_ blocked — no snippet until the fence moves
_Panda:_ (`scope.rs:966`, `pure_helper_param_template_folds_as_computed_key`)
_Notes:_ doubly out: needs SPEC-V2-39 AND the computed-key differ reopened. Counted in the 11 folds; no station until both move. Record, don't build.

**SPEC-V2-41 — warn-and-skip refuse net — HAVE (blanket)** · `ATM-SITE-04/23`, `ATM-LEAF-07`, `ATM-FORBID-02`, `ATM-DIAG-02`, `NEO-SITE-06` · ex-52 (net), ex-59, ex-D1, ex-D3, ex-D6, ex-D8 (rest), ex-D12
_Language:_ free identifiers, unannotated/optional-typed params, impure helpers (`Math.random`, loops, `.map`/`.reduce`, async/generator, rest/destructured params, nested calls, spread args, `f?.()`, `this`, `Object.entries`), `typeof`/`void`/`delete`/`Object.keys`/BigInt — every one warns (`Dynamic non-literal…` / `Dynamic object spread…`) and skips with siblings kept.
_Ours:_ `css({ color: pick(), padding: '4px' })` → padding atom + one warning, no ghost
_Panda:_ (`scope.rs:1020`, `impure_math_random_helper_does_not_fold`; entries `:1112`, async `:1164`, map `:1281`; param drops `polish.rs:125`, `:162`)
_Notes:_ params are unrecorded identifiers so all param shapes warn via the generic path (SITE-23 + DIAG-02). `void`→null is deliberate (`walk.rs:317`); `typeof x` is the one hole — it walks `x` (SPEC-V2-09 takes it). Per-shape pins → SPEC-V2-42.

**SPEC-V2-42 — per-shape refuse pins — TO-BUILD · Ph2** · `ATM-SITE-32` + `NEO-SITE-21` (impure arm) · ex-52 (pins)
_Language:_ highest-risk refusals pinned per shape: `Math.random`, `.map`/`.reduce` chains, async, loops, rest/destructured params, nested calls, spread args, `f?.()`.
_Ours:_ `css({ color: roll(['a']) })` with `Math.random` inside → warns + skips, siblings kept
_Panda:_ (`scope.rs:1112`, `object_entries_factory_does_not_fold`; random `:1020`, loops `:1249`, rest `:1123`, spread-args `:1153`, `f?.()` `:1143`)
_Notes:_ doom tripwires — pin today's blanket per-shape so Doom can't regress extract into an interpreter. Pairs with SPEC-V2-39's paint arm in NEO-SITE-21.

### Family L — optional-chain

**SPEC-V2-43 — `?.` on known objects — TO-BUILD · Ph3** · `ATM-SITE-34` · ex-54
_Language:_ `tokens?.color`, `t?.colors?.red` unwrap over known bases.
_Ours:_ `css({ color: tokens?.color })` → red
_Panda:_ (`optional_chaining.rs:19`, `optional_static_member_resolves_on_known_object`; nested `:72`)
_Notes:_ no `ChainExpression` handling today (warns dynamic). Nested form additionally needs SPEC-V2-31. Lib uses `?.` only for runtime logic, never style positions — legitimate but low priority.

**SPEC-V2-44 — `?.` on unresolvable base drops — HAVE (blanket)** · `ATM-SITE-23` control, `ATM-DIAG-02` · ex-55
_Language:_ `maybe?.foo` warns dynamic and extracts nothing.
_Ours:_ `css({ color: maybe?.foo })` → warning, zero wants
_Panda:_ (`optional_chaining.rs:58`, `optional_chain_on_unresolvable_base_drops`)
_Notes:_ residue #5 confirmed: we drop BOTH (known-base fold is SPEC-V2-43, free-base drop is this entry).

### Family M — enum / type-literal (polish)

**SPEC-V2-45 — TS enum members fence — TO-BUILD · Ph3** · proposed `ATM-SITE-43` · ex-57
_Language:_ enum members WITH initializers fold (`Sizes.Small` → `'4px'`, `Levels.High` → `99`); uninitialized members drop that path.
_Ours:_ `enum S { Sm = '4px' }; css({ padding: S.Sm })` → `4px`
_Panda:_ (`polish.rs:47`, `enum_member_access_resolves`; numeric `:66`, uninit-drop `:85`)
_Notes:_ corpus recommends APPROVED ABSENCE (zero `enum` declarations in lib, App. C) — OVERRULED by the completeness frame (v2 folds it; "nobody writes it today" never retires a language gap). Fence EXACTLY as v2 fences. Still needs the HQ dialect ruling before filing SITE-43.

**SPEC-V2-46 — param type-literal fence — TO-BUILD · Ph3** · proposed `ATM-SITE-44` · ex-58
_Language:_ `function f(props: { color: 'red'; size: 4 })` → `props.color` folds; destructured-param twin binds the member; non-literal/optional members refuse (already HAVE, SPEC-V2-41).
_Ours:_ `function paint(props: { color: 'red' }) { return css({ color: props.color }) }` → red
_Panda:_ (`polish.rs:104`, `function_param_with_type_literal_resolves_member`; destructured `:142`)
_Notes:_ same dissent/overrule as SPEC-V2-45 (zero `props: {` params in lib; completeness frame keeps it). Thinnest end of the interpreter wedge — fence it (literal members fold, everything else refuses) and rule it before filing SITE-44.

### Family N — nesting / combinators

**SPEC-V2-47 — core `&` substitution — HAVE** · `NEO-COND-01/03/06/07/08/09`, `ATM-COND-02/09/10/14/20`, `ATM-UNIT-03`, `ATM-LAYER-09`, `NEO-PARITY P2` · ne-§3.1, §3.3(H), §3.4(H), §3.5, §3.6, §3.7
_Language:_ pseudo chains, comma groups, sibling combinators (`& + &`, `& ~ &`), tail-`&` parents, two-level pseudo/descendant stacks, comma descendant lists, and literal `&` inside attribute strings all substitute.
_Ours:_ `css({ '&:hover': {...}, '& > p': {...}, '&[data-x="open"]': {...} })`
_Panda:_ (`pandacss_stylesheet/tests/nested_selector_parity.rs:26`, `:37`, `:70`, `:92`, `:125`, `:180`, `:202` — one per shape group above)
_Notes:_ `& + &` proven in browser (PARITY P2 parity worlds); `& ~ &` proven in rust (UNIT-03 numerics, LAYER-09 `:is()`-wrap — globalCss spelling, same substitution); attr-`&` arm is COND-14 (plus the atomic cousin `configured_condition_ignores_ampersand_inside_attribute_value`, the 16th skim test). Lib authors 28 `&` keys, all one level deep — everything deeper is OUT (§3 OUT list).

**SPEC-V2-48 — pseudo-element lowering + sort — HAVE** · `NEO-COND-08`, `ATM-COND-09/14` · ne-§3.14(H)
_Language:_ `&::after` lowers; pseudo-classes reorder before pseudo-elements (`:focus::before`); comma pseudo-element lists emit.
_Ours:_ `_before` / `_after` props (the dialect spelling) + sort after pseudo-classes
_Panda:_ (`nested_selector_parity.rs:433`, `nested_pseudo_element_compound_after`; reorder `:455`/`:466`, list `:477`)
_Notes:_ raw `&::` spelling unpinned — same lowering as the `_before`/`_after` dialect, proven in browser.

**SPEC-V2-49 — `&:where(:has())` nested functional — TO-BUILD · Ph2** · `ATM-COND-22` + `NEO-COND-16` · ne-§3.10 (missing)
_Language:_ css()-nested `&:where(:has(> …, > …))` substitutes inside the functional arg (the icon-only button collapse).
_Ours:_ `css({ '&:where(:has(> [data-slot="icon"]:only-child, > svg:only-child))': { paddingInline: '0' } })` (`button.ts:29` verbatim)
_Panda:_ (`nested_selector_parity.rs:389`, `nested_where`; arg-position twin `:224`)
_Notes:_ the ONE lib line the engine never proves: emitted `:where(`/`:has(` are HAVE (NEO-COND-11, NEO-GLOBAL-10, PARITY P3) but the authored-nested substitution has no station. Rust first (substitution + `>` + `:only-child` + comma scoping inside the arg), browser second. The rule exists in the emitted sheet today (`styles.css` L63 via the theme path) — the css()-nested authoring is what's unpinned.

### Family O — cross-file / imports

**SPEC-V2-50 — cross-file const + member (via merge) — HAVE** · `NEO-SITE-07`, `ATM-SITE-16` · xf-R1, xf-R2
_Language:_ scalar and object consts from a sibling file resolve (plus member select) — via project-wide merge, not resolution.
_Ours:_ `styles.ts`: `export const theme = {...}` → `css({ color: theme.primary })` (the import statement itself is not even required)
_Panda:_ (`cross_file.rs:200`, `named_const_import_resolves_to_value`; member `:219`)
_Notes:_ Reference has NO resolver: `collect_project_constants` merges ALL const declarators at every depth into one namespace (`index.rs:88-98`). v2's mechanism (`oxc_resolver`, aliases, probing) is NOT taken — observables hold iff the origin const is scanned.

**SPEC-V2-51 — imported spreads pin — TO-BUILD · Ph2** · `ATM-SITE-39` (was X-24) · xf-R5
_Language:_ imported const objects spread at top level and under conditions.
_Ours:_ `css({ ...hover, bg: 'blue' })` + `css({ _hover: { ...hover } })` with `hover` from `styles.ts`
_Panda:_ (`cross_file.rs:316`, `imported_object_spreads_under_condition`)
_Notes:_ pin only (SITE-11 unpack × SITE-16 merge); no station pins the cross-file instance today.

**SPEC-V2-52 — aliased value import — TO-BUILD · Ph3 (build)** · `ATM-SITE-40` (was X-25) · xf-R6
_Language:_ `import { brand as primary }` resolves the consumer's local alias to the declared const.
_Ours:_ `tokens.ts`: `export const brand = 'red'`; `import { brand as primary }; css({ color: primary })` → red
_Panda:_ (`cross_file.rs:421`, `aliased_import_resolves_by_exported_name`)
_Notes:_ merge keys by DECLARED name (`brand`); the local alias resolves to nothing → dynamic warning + drop today. `bindings.rs` maps aliases for `css` identity only (SITE-15), never for values. Needs a local-alias→declared-name map at collect or walk time. The one xfile shape authors plausibly write.

**SPEC-V2-53 — `export let` folds — HAVE (laxer, unpinned)** · collector behavior · xf-R7
_Language:_ unmutated `export let`/`var` fold like `const`.
_Ours:_ `export let x = 'red'` in `tokens.ts` → folds at use
_Panda:_ (`cross_file.rs:502`, `export_let_currently_folds_too`)
_Notes:_ HAVE-laxer: `visit_variable_declarator` has no kind check, so we fold even MUTATED `let` — pin or tighten at HQ's call (ties SPEC-V2-35).

**SPEC-V2-54 — unresolvable import drops + diagnostic — HAVE** · `NEO-SITE-06` precedent · xf-R8
_Language:_ unresolvable specifier / missing export drops the call with a diagnostic, never a ghost.
_Ours:_ unknown identifier → `Dynamic non-literal identifier` warning + no ghost
_Panda:_ (`cross_file.rs:465`, `unresolvable_specifier_drops_outer_call`; missing-export `:488` — both silent)
_Notes:_ fail-closed-PLUS-diagnostic vs v2's silent drop — ours is the upgrade, keep it.

**SPEC-V2-55 — imported conditional both arms — TO-BUILD · Ph2** · `ATM-SITE-42` (was X-27) · xf-R9
_Language:_ an imported const object holding a ternary compiles both arms on spread.
_Ours:_ `tokens.ts`: `export const c = { color: flag ? 'red' : 'blue' }`; `css({ ...c })` → both arm utilities + plans
_Panda:_ (`cross_file.rs:1368`, `imported_conditional_object_keeps_encode_branches`)
_Notes:_ pin only (RS-37 branching leaves × merge; same-file fan-out already pinned by SITE-23).

**SPEC-V2-56 — barrel re-export probe — TO-BUILD · Ph2 (probe)** · `ATM-SITE-41` (was X-26) · xf-X1
_Language:_ `export { x } from` chains (1–3 hops, incl. barrels) — PROBE whether the observable holds via merge.
_Ours:_ `barrel.ts`: `export { brand } from './tokens'`; App imports from barrel → likely green via merge
_Panda:_ (`cross_file.rs:1194`, `deep_import_chain_resolves_through_re_export`; chain-cache twins `:751`, `:962`, `:995`, `:1038`)
_Notes:_ probe only, and only if HQ rejects the absence recommendation (lib writes zero re-exported style consts). `export … from` adds nothing to the merge — the barrel is inert; value resolves iff the origin file is in `include`. Documents origin-must-be-scanned either way; if red, decides build-vs-absence.

**SPEC-V2-57 — imported pure helpers — TO-BUILD · Ph3 (gated)** · no station — file after SPEC-V2-39 · xf-F1
_Language:_ imported arrow / function-decl calls fold (incl. computed-key helper, object-return spread, re-exported pure fn).
_Ours:_ `import { tone } from './t'; css({ color: tone('600') })`
_Panda:_ (`cross_file.rs:1220`, `imported_pure_arrow_call_folds`; decl `:1262`, object-return `:1344`)
_Notes:_ DO NOT BUILD HERE — pending the HQ pure-helper dialect decision AND the same-file fold/drop table first (SPEC-V2-39/42). Functions are ignored by the collector today → call values warn-and-skip (NEO-SITE-06).

**SPEC-V2-58 — bare imported fn value — HAVE (trivially)** · collector behavior · xf-F2
_Language:_ uncalled imported function values fold nowhere.
_Ours:_ `css({ color: getColor })` (imported, uncalled) → warns, skips
_Panda:_ (`cross_file.rs:1310`, `bare_imported_function_value_does_not_fold`; aliased-export twin `:1325`)

**SPEC-V2-59 — import identity scan — HAVE** · `ATM-SITE-15`, `NEO-SITE-04` · xf-I1, ex-61
_Language:_ named / aliased / namespace / default / type-only / multi-decl imports gate site identity; default and type-only never extract.
_Ours:_ `import { css as c } …; c({...})` extracts; `import type …` / default-imported names don't
_Panda:_ (`imports.rs:34`, `named_imports_with_alias`; namespace `:63`, type-only `:100`, default `:12`; identity twins `calls.rs:463`, `:862`)
_Notes:_ ours scans imports for SITE IDENTITY ONLY (`bindings.rs:79-110`, Reference packages only) and never follows a specifier to a file. String-literal specifiers, side-effect imports, re-export scanning → OUT (4 identity rules suffice).

**SPEC-V2-60 — parse-error diagnostics — HAVE (analogue)** · `ATM-DIAG-03` · xf-I5, ex-65
_Language:_ unparseable sources surface error diagnostics with file location; compile still returns.
_Ours:_ broken file → `Diagnostic::error` + location, compile continues
_Panda:_ (`imports.rs:518`, `parse_error_is_reported`; span `:527`; extractor twin `calls.rs:749`)
_Notes:_ analogue, not parity: byte spans are not a contracted surface on our side.

### Family P — token() calls / factory consts

**SPEC-V2-61 — `token()` / `token.var()` surface, our evaluation — TO-BUILD · Ph3** · proposed `ATM-SITE-45` · xf-TOKEN-CALL (accept side)
_Language:_ accept `token('colors.red')` / `token.var(…)` calls incl. fallbacks — but evaluate OUR way (`{path}` refs / vars), NEVER parse-time hex.
_Ours:_ `css({ color: token('colors.red') })` → `{colors.red}` ref (ATM-TOKEN-11 prints the `var(--colors-…)` alias)
_Panda:_ folds to `#ef4444` at parse against a `TokenDictionary` (`token_calls.rs:92`, `token_call_resolves_to_raw_value`; var `:202`, fallback `:268`)
_Notes:_ SYNTHESIS, not copy (mission tests-table §69). The hex fold itself → OUT (SITE SPEC approved absence). Keep one correspondence: unknown-path + fallback → fallback, without → drop — that's our `{path}`-miss behavior's problem.

**SPEC-V2-62 — factory consts resolve — TO-BUILD · Ph3** · proposed `ATM-SITE-46` · xf-K1 (fold part)
_Language:_ imported `keyframes()` / `positionTry()` consts resolve as const-resolution language (incl. prefix, barrel, alias, multi, joint).
_Ours:_ `import { fade } from './kf'` (a `keyframes()` const) → resolves at the consuming site
_Panda:_ (`cross_file.rs:1437`, `imported_keyframes_const_folds_in_animation_name`; positionTry `:1460`, prefix `:1506`, barrel `:1526`, alias `:1550`, multi `:1571`, joint `:1598`)
_Notes:_ corpus recommends ABSENCE (config-level keyframes ATM-LAYER-10/14; no factory language) — mission Phase 3 + completeness frame say const-resolution LANGUAGE, so this entry stands TO-BUILD pending the dialect ruling. `viewTransition()`-as-value → OUT (v2 ITSELF refuses, `:1481` — an absence that stands). Product codegen for these factories stays OUT regardless.

## 2. STANDING DIFFERS (kept deliberately; need HQ to reopen)

**Differ #1 — element-access / computed-key refusal.**
v2 folds `colors['red']`, `sizes[1]`, `['red','blue'][i]`, `({a:'red'})['a']`,
`m['a'+'b']`, ``m[`a${'b'}`]``, `m[w.k]`, `colors['red']['500']`, chained
`[…][…]` (ex-8: `scope.rs:321`–`:524`, 12 tests + `:1419`), every computed
style-object key incl. static `['color']` and `[42]` (ex-9: `scope.rs:360`,
`:375`; `calls.rs:1288`, `:1304`, `:1320`), and `sizes?.[key]` (ex-56:
`optional_chaining.rs:38`). We REFUSE all of it with a located diagnostic
(SITE SPEC O1/O2/O3 element-access + O4 computed-key rows).
_Rationale:_ fail-closed with a diagnostic beats silent partial folding; the
refusal is UNIFORM (even static `['color']` refuses) so the dialect never
depends on whether a key happened to be foldable. Note ours keeps static
siblings where v2 drops the whole call (`computed_keys_skip_extraction` →
SPEC-V2-41 net). Do not "fix" toward v2 without an explicit decision. (Corpus
note: the SPEC row should name numeric-index and inline-literal forms
explicitly — they refuse through the same arm today.)

**Differ #2 — D11: open AND literal ternary compile both arms; runtime picks.**
v2 picks one branch for foldable tests (`dark ? …`, `1===1 ? …`, `false?…:…`,
`true?…`, `(2+2===4)?…`, ident-test — ex-31: `conditional_output.rs:47`,
`:449`, `:467`; `calls.rs:1443`, `:1635`; `scope.rs:1328`) and folds
literal-test conditional spreads to one branch (ex-42: `calls.rs:1867`). We
scoop both arms by decision D11 (proven `NEO-SITE-01`, `ATM-SITE-05/17/23`).
_Rationale:_ the scoop architecture compiles every static leaf it can see and
lets the runtime pick (SPEC-V2-15/16/18/21) — pick-one at extract would be a
second semantics for the same syntax. Deliberate; not a gap.

**Differ #3 — whole-object `css(styles)` absence.**
v2 resolves `css(styles)` / alias-chain-whole-object / rest-use-whole-object
(`scope.rs:43`, `:63`, `:671`, `:587`-use-part) and keeps a positional `None`
slot for unresolvable middle args (`calls.rs:548` ident/member part, `:1719`).
We silently skip whole-object args (`0/0/0/0`, SITE SPEC approved absence,
documented) and have no IR slot for positional args.
_Rationale:_ wholesale object flow is outside the want/plan model — taking it
would mean tracking values, not leaves. The absence is documented and
silent-by-contract. Reopening needs a model change, not a station.

## 3. NON-LANGUAGE OUT LIST (do not mint cases; one-line reason each)

### A. Product / infra / framework (not the language)

- `firstThatWorks(a, b)` (72+34 tests) — separate mission ([first-that-works.md](first-that-works.md)), new value form needing its own dialect decision.
- `viewTransition` / `positionTry` PRODUCT codegen — product CSS, not author language (factory-CONST resolution is SPEC-V2-62; `viewTransition()`-as-value further refused by v2 itself, `cross_file.rs:1481`).
- Source transform (`extract_for_transform`, ~400 `pandacss_project` tests + all 13 `local_bindings.rs`, ex-D13) — we compile a sheet, we do not rewrite source.
- Cascade-layer polyfill (26 tests) — cascade product, not extraction language.
- Vue / Svelte / Astro scan (29/20/12 tests) — SITE SPEC absence; worlds are source TSX.
- Compiled JSX runtimes (v1 per-bundler matrix richer; v2 collapsed) — SITE absents compiled runtimes; reopen only if someone scans `dist/`.
- `css.raw` / `cva.raw` / pattern-raw incl. cross-file folds (ex §6: 3 scope + 6 calls + 3 xfile `css_raw`) — SITE SPEC approved absence (`css.object()` + plain objects).
- `cva` / `sva` / patterns / `styled()` / recipe invocation / JSX factories (ex §6: `zero_arg_pattern_call`, `namespace_raw_pattern`, `multi_arg_call_extracts_all_literal_args`, `non_literal_args_are_omitted`, `jsx_factory_*` ×2 + polish factory ×3, `conditional_inside_cva_recipe_base`, `keeps_no_arg_recipe_calls`) — SITE SPEC out-of-scope table (Neo `recipe()`/primitives/`jsxElements`).
- `importMap` (13 tests) — out of dialect, SITE absence.
- PascalCase `matchTag`, tagged-template AUTHORING (`styled.div\`\``) — SITE absence rows (the `` css`…` `` non-site is HAVE, SPEC-V2-38).
- `token()`→hex / `token.var()` parse-time fold (21 `token_calls.rs` tests) — SITE SPEC approved absence; accept-side is SPEC-V2-61 (`{path}` refs, never hex).
- `oxc_resolver` / tsconfig paths / extension probing / package exports (xf-C1/C2: `:146`, `:442`) — no resolver exists; file set is `include` globs.
- Export cache / source hashes / dep provenance / sessions / read-once (xf-C3/C4, 11 tests) — single-shot compile rereads every sync; staleness impossible by construction.
- Watch-hash inversion / `affectedFiles` cascade (xf-C5; design-notes §Watch) — `watch.ts` re-syncs whole; no dep graph.
- Cycle guard + reset (xf-C6: `:545`, `:569`) — merge is non-recursive; cycles inexpressible; guard would test nothing.
- No-resolver-means-no-fold / Send+Sync / memory-fs isolation / fs-mutation visibility (xf-C7, 4 tests) — harness properties, not language.
- Default/namespace VALUE imports, `export default` (design-notes §What doesn't fold) — v2 itself refuses; ours ignores non-const bindings likewise.
- String-literal specifiers / side-effect imports / re-export scanning / JS-parity anchors (xf-I2/I3/I4/I6: `:85`, `:209`, `:536`, `:357`+) — identity needs the 4 rules only (SPEC-V2-59); barrels carry components, never style consts.
- v2-internal diagnostic gating (`skips_unextractable_call_diagnostic_when_jsx_framework_is_configured`, `calls.rs:607`) — product diagnostic detail, not language.
- JS-number-string coerce `'1e3'`→px (`atomic.rs:240`) — APPROVED DIVERGENCE: UNIT-02 refuses non-canonical numerics fail-closed.

### B. Approved absences (language-shaped, deliberately unbuilt)

- Interpolated template values (ex-26: `` `${n}px` ``, `` `${o.p}` ``, `` `${2+3}px` ``, gradient — `scope.rs:868`, `:887`; `calls.rs:1214`, `:1420`, `:1972`) — SITE SPEC O8 refusal; ours diagnoses where v2's staged harness silently drops.
- JSX-tag shadowed by param (ex-14, `scope.rs:803`) — absurd code; absence candidate, not a station.
- Shadowed-`undefined` param stays open (ex-D11, `polish.rs:352`) — absurd code; we null it for the wrong reason, correctly by accident; absence candidate.
- Nesting zero-authorship shapes (39 tests — lib authors 28 `&` keys, all 1 level; Book zero): BEM/ancestor sandwich (`:48`, `:59`); chained + no-space siblings (`:235`, `:367`); 3-level tails (`:103`); self-`&` inside `:not()` (`:169`, `:301`, `:312`, `:422`); self-`&` inside `:is()` (`:334`, `:356`, `:411`, `:543`); self-`&` inside `:has()` (`:224`); `&&`/`&&&` compounds (`:257`, `:268`, `:345`); tag/class/body compounds (`:279`, `:290`, `:323`, `:378`, `:587`, `:598`, `:609`, `:620`); multi-`&` (`:400`); descendant/suffix pseudo-elements (`:444`, `:488`, `:499`, `:510`); host-functional + standalone `&` (`:532`, `:631`); bare-member comma scoping + cross-products (`:642`, `:653`, `:664`); 3-deep stacks (`:554`, `:565`); `:is()`-wrapped css() re-nesting (`:675`, `:686`) — dropped per the brief's authorship rule, not cased. (Cheapest engine-behavior pin if HQ ever wants one: bare-member comma scoping `:642` — one station, no author needed; NOT proposed.)
- Re-export chains AS MECHANISM stay unbuilt unless SPEC-V2-56's probe comes back red (xf-X1; lib writes zero re-exported style consts) — probe-then-build, absence recommended.

## 4. COVERAGE CLAIM (closing statement)

Every corpus row lands in exactly one of catalog / differs / out.
Arithmetic (counts re-verified 2026-09-18 via `grep -c '#[test]'` and
per-test `grep -n '^fn '`; three corpus-count discrepancies found and
reconciled below — nothing forced):

**Extractor: 223 tests = 80 + 79 + 30 + 17 + 13 + 4** (`scope` + `calls` +
`conditional_output` + `polish` + `local_bindings` + `optional_chaining`)
= verdicts 75 HAVE / 80 MISSING / 68 ABSENCE (conserved) = **81 shape rows
(68 §3 + 13 §4) placed as 72 catalog + 5 differs + 4 out**:
catalog ex-1–7, ex-10–13, ex-15–25, ex-27–30, ex-32–41, ex-43–55, ex-57–68
(split across two entries each, same catalog: ex-1, ex-46, ex-60, ex-64,
ex-D2, ex-D8) + ex-D1–D10, ex-D12; differs ex-8, ex-9, ex-31, ex-42, ex-56
(+ non-row App. A whole-object verdicts → differ #3); out ex-14, ex-26,
ex-D11, ex-D13 (+ non-row App. A `css.raw` / `cva`-family / v2-gating
verdicts → OUT §3A). 72 + 5 + 4 = 81 ✓.

**Polish/enum rows are INSIDE the 223, not additive** (`polish.rs`, 17
tests): ex-57/58 → SPEC-V2-45/46, ex-59 → SPEC-V2-41, destructure defaults
→ SPEC-V2-32, `undefined` → SPEC-V2-03, factories → OUT, ex-D11 → OUT. ✓

**Nesting: 61 tests = 21 HAVE + 1 MISSING + 39 absence-or-unused**
(RECOUNT — corpus claims 20/1/40; the §3.14 pseudo-element group holds 4
HAVE tests `:433`, `:455`, `:466`, `:477`, not 3; 21+1+39 = 61 ✓):
21 → SPEC-V2-47 (17) + SPEC-V2-48 (4); 1 (`:389`) → SPEC-V2-49; 39 →
OUT §3B (all line-cited). **Atomic skim 16** = 15 table rows (13 HAVE →
SPEC-V2-04/15/18/21/27/29/38, 1 OUT JS-coerce, 3 pointers → SPEC-V2-22/29)
+ 1 §3.7 cousin (`configured_condition_…` → SPEC-V2-47). **Encode 5** → IR
reference inside SPEC-V2-15, no separate row. ✓

**Cross-file: 90 tests (51 + 18 + 21) → 27 shapes** (RECOUNT — corpus
claims 23 = 10/5/8; the C1–C7 family is 7 verdicts not 1, and HAVE
double-counts R8's "diagnostic upgrade": 9 HAVE R1/R2/R5/R7/R8/R9/F2/I1/I5
+ 5 MISSING R3/R4/R6/X1/F1 + 13 ABSENCE C1–C7/K1/I2/I3/I4/I6/TOKEN = 27 ✓):
**15 catalog** (R1/R2 → SPEC-V2-50, R3/R4 → SPEC-V2-34, R5 → 51, R6 → 52,
R7 → 53, R8 → 54, R9 → 55, X1 → 56, F1 → 57, F2 → 58, I1 → 59, I5 → 60,
K1-fold → SPEC-V2-62) + **12 out** (C1–C7, I2/I3/I4/I6, TOKEN-hex,
K1-viewTransition). 15 + 12 = 27 ✓. (K1 moves corpus-ABSENCE → catalog
TO-BUILD per mission Phase 3 + completeness frame, dissent recorded in
SPEC-V2-62 — the count above reflects final placement.)

**Mission-vs-corpus conflicts resolved (3):** enums/type-literals →
TO-BUILD (completeness frame overrules lib-usage absence recommendation;
HQ ruling still required); X1 → probe station (mission probe-then-build);
factory consts → TO-BUILD (mission Phase 3). All three record the corpus
dissent in-entry.

**Grand total: 223 + 61 + 90 = 374 source tests placed** (+ 21 reference:
16 skim + 5 encode = 395 consulted; + 4 design-notes + `RUST_GUIDE.md` as
background). **Spec count: 62 entries — 25 HAVE, 37 TO-BUILD**
(Ph1: 6 · Ph2: 12 + 1 probe + NEO-SITE-22 paint pin under HAVE entry 21 ·
Ph3: 14 · deferred/blocked/gated without a station: SPEC-V2-14/19/40/57).
**Unplaceable rows: none.** Station-less TO-BUILD entries are marked
explicitly (14, 19, 40, 57), not forced onto stations.

Filing note: work is read-only until a row exists on an Atomic or Neo
ledger. One agent, one slice; phases parallelize once rows are filed.
File `ATM-SITE-30` before `ATM-SITE-38` (pin before narrow). Dialect queue
is closed by the completeness frame except the differs (§2) and the five
gated entries (39, 45, 46, 57, 62), which need HQ first.

— End of spec catalog. Evidence stays in the three corpus notes under
`packages/reference-neo/docs/evidence/panda-v2-*.md`; this file is the
mission and the consolidated language-spec list.
