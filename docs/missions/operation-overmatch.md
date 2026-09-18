# Mission: Operation Overmatch (Panda v2 language, exceeded)

Status: `idea` (plan rebuilt 2026-09-18 under the no-gap frame — ready to
activate: 79 entries in §1, five phases in §5, architecture in §7). Not a
campaign. Not a port. Not a parity checklist either — a claim with a proof
per row.

## The claim

> **We extract atomic CSS from your tokens, styles and code — and we do it
> better than Panda v2.**

That sentence is the deliverable. Everything in this file exists to make
it true and provable. "Better" is measured on one axis — the extraction
language: which static shape in author code becomes an atom, which is
refused, and what the author is told. Panda v2 (`vendor/panda`) is the
Rust/Oxc rewrite of v1 (`vendor/panda-v1`) with a real literal evaluator
and a real cross-file resolver; its extractor and stylesheet tests (374
placed, §6) are the external yardstick. Our own cases — Atomic stations
first, Neo browser cases second — are the proof, under Reference's
architecture (import-bound sites, styletrace hosts, fail-closed
diagnostics, no ghost classes). v1 is already the corpus of record
(`packages/reference-neo/docs/evidence/panda-v1-*.md`); v2's three corpus
notes (`panda-v2-*.md`) are this mission's evidence.

The claim is true when, for every shape in that yardstick:

1. **v2 folds it → we fold it** (same paint, pinned by our station), or
2. **v2 drops it → we fold it, or refuse it with a located diagnostic**
   (never silence), and
3. we can list the shapes where **we resolve or diagnose and v2 does not**
   (§3).

The prize is still a **fold table and a nesting table**, not v2's APIs.
Additive product features are separate missions (§4).

## The frame: no approved gaps

Earlier drafts carried "approved absences" and "standing differs". Under
this operation those categories do not exist. An absence is a gap with a
signature on it; a differ that makes us do less is a gap with an argument
on it. Both are struck. The statuses that survive:

| Status | Meaning | Evidence bar |
|---|---|---|
| `HAVE` | we resolve what v2 resolves | our station + Panda `file:line` |
| `SUPERIOR` | v2 drops, stays silent, or narrows; we resolve or diagnose | both sides cited, our pin |
| `EQUIVALENT` | different mechanism, provably equal-or-better outcome | the outcome shown, not asserted |
| `TO-BUILD` | v2 resolves and we don't — or we do it unsoundly | filed row, phased in §5 |
| `OUT-OF-AXIS` | not extraction language: an API surface, a product feature, a framework adapter | named as a *separate slice* in §4, with our equivalent where one exists |

Rules that replace the old rationales:

- **Fold-or-diagnose.** Every expression position resolves its static
  part and diagnoses its dynamic residue. There is no "uniform refusal so
  the dialect never depends on foldability" — v2's dialect depends on it,
  ours will, and the author is told exactly which sub-expression stopped
  us.
- **No silence.** Whenever the extractor *skips* something at a site —
  an argument, a member, a spread, a key, an operand it could not read —
  it says so with `file:line:col`. A silent skip is the fail-open failure
  mode and ranks with a ghost class (crate README P0). Genuinely empty is
  not a skip: `css()`, `css({})`, and `false`/`null` holes in a merge
  list or responsive array yield nothing and say nothing (`ATM-MERGE-03`,
  SPEC-V2-27) — both engines agree, and the author wrote the hole.
- **No name-collision resolution.** An identifier resolves through its
  binding — scope chain, then import — never through a project-wide name
  bag. A param called `color` is dynamic even if some file declares
  `const color`.
- **"Nobody writes it" is not a reason.** Lib/Book authorship never
  retires a language shape; it only orders the queue.
- **A refusal must lose nothing.** We may refuse a shape only where v2
  also refuses, or where we resolve every static sub-shape and refuse only
  the genuinely dynamic residue — with a diagnostic v2 does not give.
- **Folding is not evaluating.** Constant folding of closed literal
  expressions (arithmetic on literals, concatenation, literal-test
  ternaries, fenced pure helpers) is a fold table, not an interpreter: no
  runtime, no side effects, an enumerated list of forms, fail-closed
  outside it. v2 draws exactly this line (`literal-evaluator.md`: pure
  helpers vs `ts-evaluator`); we draw the same one. The crate README
  tripwire "evaluate author JS to learn a value" names the interpreter
  side of that line and is amended with the first Phase 3 row (§5).

Where the two engines conflict we take the better behaviour and record
why. Where we already exceed v2 we keep it and pin it (§3). Where v2 is
ahead on things that are *not* language — source transform, incremental
watch graph, framework adapters, cascade polyfill — §4 says so plainly and
claims nothing.

## What this is not

- Not "switch the engine to Panda v2."
- Not copying `crates/` layout, NAPI, source-transform-to-class-strings, or
  the `optimize.*` product knobs.
- Not re-mining v1. v1 is done (`panda-v1-core-corpus.md`,
  `panda-v1-parser-config-corpus.md`). Cite those; do not re-probe.
- Not taking Vue/Svelte/Astro, `styled()`, patterns, `cva`/`sva` as author
  APIs, PascalCase `matchTag`, tagged-template *authoring*, or compiled
  bundler output as this mission's scope. They are API/product slices
  (§4), each with our equivalent named. `importMap` is replaced, not
  copied: site identity follows re-exports by binding (SPEC-V2-76).
- Not `firstThatWorks` — a value-form feature with its own mission
  ([first-that-works.md](first-that-works.md)).

`vendor/README.md` still stands: v2 is contrast. Lift the language cases;
leave the direction.

## Seeded SUPERIOR exhibits

Verified against `vendor/panda` (2026-09-18/19); §3 carries the full
ledger. Each build slice asks two questions — "does it match Panda?" and
"what does better look like here?" — and the answers land in that ledger.

- Conditional call args: v2 drops `css(cond ? a : b)` (`calls.rs:556`,
  `skips_non_literal_arguments` asserts `calls: []` + unextractable
  diagnostics); our engine accepts `Conditional` args (SPEC-V2-27).
- Dynamic-side diagnostics: where v2's right-operand rule stays silent on
  the dropped left, we walk both non-guard operands and diagnose the
  dynamic side (SPEC-V2-18). Same paint, better errors.
- Unresolvable import or missing export: v2 drops the call silently
  (`cross_file.rs:465`, `:488`); we diagnose (SPEC-V2-54).
- Siblings survive: v2 drops the whole call on an unfoldable computed key
  (`computed_keys_skip_extraction`) and the whole array on an unresolvable
  spread (`literal-evaluator.md:47-48`); we keep the static siblings and
  diagnose the one member (SPEC-V2-41, SPEC-V2-28).

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
| `vendor/panda/design-notes/cross-file-resolution.md` | Real `import { x } from './tokens'` — v1 mostly simulated this in one file. Binding walk → the named export in *that* file; cache keyed `(path, export)`; default/namespace imports refused (`:95-96`, `:102-129`). The model SPEC-V2-76 adopts. |
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
| `framework_vue.rs` / `framework_svelte.rs` / `framework_astro.rs` | 29 / 20 / 12 | Out-of-axis (§4: framework adapters, React/JSX by charter). Skip unless a rule is framework-agnostic. |
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
| `nested_selector_parity.rs` | 61 | **Yes, all 61.** Combinator matrix v1 only sampled (`& + &`, `& ~ &`, `:is()`, `:has()`, `:where()`, comma groups, `&&&`, `&` inside attribute strings). 22 are HAVE/build (SPEC-V2-47/48/49); the 39 formerly dropped as "zero authorship" are Family Q (SPEC-V2-68..73) — 34 pin-only, 5 are paint bugs on the utility path today (comma-member leak, missing `:is()` armour). |
| `atomic.rs` | 53 | **Selective.** Value-level ternary/`&&`/`??`, `css(a,b)` vs `css([a,b])` as merge list not responsive array, numeric/string scalar dedupe, vendor-prefix class names. Skip `@property` pruning / polyfill. |
| `encode.rs` (`pandacss_encoder`) | 22 | **Yes, as IR.** `Conditional` expands both branches, keeps surrounding condition, `!important` per arm. |
| `first_that_works.rs` | 72 | Dialect decision first. New language. Do not silently add. |
| `view_transition.rs` / `position_try.rs` / `polyfill.rs` | 11 / 6 / 26 | Out. Product APIs and cascade polyfill. |

v1's remaining strength: condition *stacking* (`_ltr` + `_dark` + `sm` + `_hover` on `& > p`) in `atomic-rule.test.ts` — already in the v1 core corpus. v2's nesting file is combinators; v1's is condition soup. Both matter; they are not the same list.

## 1. THE SPEC CATALOG (consolidated 2026-09-18; re-graded under the no-gap frame the same day)

One entry per language feature, grouped by family. Each entry carries:
stable ID (`SPEC-V2-NN`, catalog order — IDs never move; Family Q appends
63–79) · station/case (existing cite for HAVE, proposal for TO-BUILD) ·
the language bit in one line · OUR snippet · PANDA's snippet with
`file:line` (paths relative to `vendor/panda/crates/`;
`pandacss_extractor/tests/` unless noted) · status · source rows
(`ex-N` = extractor corpus §3 row N, `ex-DN` = §4 drop row N,
`ne-§` = nesting corpus, `xf-` = cross-file shape) · notes (fences, refuse
rules). Phases (§5): **Ph1** soundness (wrong paint or silence — first) ·
**Ph2** pins (engine right, station missing) · **Ph3** the fold table (one
evaluator, every same-file fold) · **Ph4** cross-file by binding · **Ph5**
the statement. Entries 01–62 keep their 2026-09-18 text as the oracle for
the re-verification crew; where the frame changed a status or a note the
change is marked `[re-graded]`. There is no dialect-ruling queue any more:
the frame is the ruling, and where a fence is needed v2's fence is adopted
verbatim (39, 45, 46, 57, 62).

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

Minted by the 2026-09-18 re-grade (Family Q): `ATM-SITE-48..55`,
`ATM-COND-23..28`, `NEO-SITE-23..28`, `NEO-COND-17`.
`ATM-DIAG-05` (diagnostic codes — an existing `[ ]` row in the atomic
SPEC) is claimed by SPEC-V2-77; `ATM-UNIT-02` extends for SPEC-V2-79.
Landed maxima unchanged (`ATM-SITE-23`, `ATM-COND-21`, `NEO-SITE-17`,
`NEO-COND-15`). Still all proposals; nothing filed.

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
_Notes:_ token scalars dedupe the same way (`:265`). `[re-graded]` Numeric *strings* (`'1e3'`, `'.5'`, `'01'`): v2 coerces via `Number()` and dedupes with the bare number (`atomic.rs:239-261`, `js_number_string_forms_coerce_and_get_px` → `.p_0\.5`, `.p_1000`); UNIT-02 refuses them today. Refusing a finite numeric string is "we do less" — canonicalization is SPEC-V2-79 (finite → the numeric atom; NaN-producing → refuse with a diagnostic). JS numeric *literals* (`1e3`, `0x10`) already fold as numbers.

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
_Notes:_ soundness bug: the fallthrough walks the argument (`walk.rs:334`), so `!true` pushes want `true` today — and `-space` over `const space = 4` pushes `4` with the sign dropped (SPEC-V2-78: same fallthrough, paints wrong on ordinary code). `[re-graded]` from refuse-only to fold-or-refuse: `!`/`~`/`-`/`+` fold on literal and const-resolved numeric/boolean operands (v2 folds all four, `literal-evaluator.md:51`); anything else refuses with a located diagnostic. `typeof`/`delete` refuse; `void`→null is deliberate, keep (`walk.rs:317`). Refusing `!true` where v2 folds `false` would itself be a gap.

**SPEC-V2-10 — string concat / coercion folds — TO-BUILD · Ph3** · `ATM-SITE-33` · ex-21
_Language:_ `+` with a string side folds (`'50'+'%'`, `1+'px'`, `n+'px'` over const `n`).
_Ours:_ `css({ width: 1 + 'px' })` → `1px`
_Panda:_ (`calls.rs:1148`, `binary_string_concatenation`; ident-operand twin `scope.rs:849`)
_Notes:_ `[re-graded]` no ruling needed — closed literal forms are the fold table's home case (`fold/binary.rs`, §7.1); pure static shapes, no interpreter risk. Number-to-string coercion follows JS `String(n)` for finite numbers; `NaN`/`Infinity` operands refuse.

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
_Notes:_ static path folds today (`literal.rs:87`) — pin only. `[re-graded]` Interpolated templates over foldable parts → SPEC-V2-67 (was the O8 refusal). Whitespace-collapse part → SPEC-V2-14.

**SPEC-V2-14 — value whitespace collapse — TO-BUILD · Ph3** · `ATM-SITE-47` · ex-68
_Language:_ `'1px  solid red'` ≡ `'1px solid red'`; multiline backtick grids collapse outside quotes.
_Ours:_ `css({ margin: '1px  solid  red' })` → same atom as single-spaced
_Panda:_ (`calls.rs:156`, `string_value_whitespace_is_collapsed_outside_quotes`; backtick twin `:179`)
_Notes:_ no collapsing anywhere in `extract/`/`resolve/`/`atom/`/`canon` — twins mint distinct classes AND distinct declarations. Dedupe gap, not a paint bug. No browser arm (paint-identical either way); class-identity asserted at the station.

### Family E — ternary / conditional

**SPEC-V2-15 — open-test ternary, both arms — HAVE** · `ATM-SITE-05/17/23`, `NEO-SITE-01` (+JSX `NEO-SITE-15`) · ex-30
_Language:_ open-test `?:` compiles both arms (values, JSX attrs, nested objects, mixed-type arms); runtime picks.
_Ours:_ `css({ color: isDark ? 'white' : 'black' })` → two atoms
_Panda:_ (`conditional_output.rs:25`, `ternary_with_non_literal_test_emits_both_branches`; atomic `:1528`; IR `pandacss_encoder/tests/encode.rs:452`)
_Notes:_ `encode.rs` pins the IR contract (one atom per arm, surrounding condition kept on every arm, per-arm `!important`, fused walker identical — 5 tests, no separate case; ours matches via SITE-01/17 + SEAM-03 + CSS-08). `[re-graded]` Foldable-test dead-arm folding is SPEC-V2-66 (was differ #2); open tests stay both-arms here — that is D11's correct half.

**SPEC-V2-16 — ternary shapes: nested / equal / partial — HAVE** · `ATM-SITE-05/21/23` · ex-32, ex-33, ex-34, ex-D4
_Language:_ nested open ternary scoops all leaves; equal branches collapse via `AtomSet` dedupe; one unresolvable branch keeps the resolvable arm + warns the other.
_Ours:_ `dark ? maybeFn() : 'black'` → black atom + one warning
_Panda:_ (`conditional_output.rs:487`, `nested_ternary_emits_nested_conditional`; partial `:69`; equal `:110`)
_Notes:_ call arm warns via the general path (NEO-SITE-06 precedent) — same net as v2 plus our diagnostic. SUPERIOR candidate `[re-graded]`: `literal-evaluator.md:75-76` says an open ternary where one branch cannot fold *drops the whole conditional* ("no half-branch"); we keep the resolvable arm and diagnose the other. Confirm against `:69` at the station and promote.

**SPEC-V2-17 — object-valued ternary arms — TO-BUILD · Ph2** · `ATM-SITE-27` · ex-35
_Language:_ `color: d ? { base, _hover } : { base }` routes each arm through the per-prop object machinery.
_Ours:_ `css({ color: isDark ? { base: 'white' } : { base: 'black' } })`
_Panda:_ (`conditional_output.rs:631`, `ternary_with_object_branches`)
_Notes:_ station-only: arms already route via `walk.rs:177` / `responsive.rs:42` (ATM-COND-17 proves the shape for authored objects).

### Family F — logical

**SPEC-V2-18 — logical with unresolvable / guard left — SUPERIOR** `[re-graded]` · `ATM-SITE-05`, `NEO-SITE-08` · ex-27, ex-28
_Language:_ unresolvable-left `&&`/`||`/`??` emit the right operand; null/boolean-guard lefts short-circuit.
_Ours:_ `css({ color: maybeColor ?? fallback })` → fallback atom (+ warning for the unresolvable side)
_Panda:_ (`conditional_output.rs:251`, `nullish_coalesce_with_unresolvable_left_emits_right_operand`; `&&` twin `:155`, guards `:513`/`:531`; atomic `:1553`/`:1575`)
_Notes:_ our rule (walk both non-guard operands, `walk.rs:267`) vs v2's (right-operand) — same paint; ours diagnoses the dynamic side where v2 stays silent. Fail-closed-consistent.

**SPEC-V2-19 — all-literal short-circuit — TO-BUILD · Ph3** · rides `ATM-SITE-33` (fold bundle) · ex-29
_Language:_ `'x'&&'y'` → `'y'` only (no dead `'x'` atom).
_Ours:_ `css({ color: 'x' && 'y' })` → compiles a dead `'x'` atom today (paint-correct, sheet-extra)
_Panda:_ (`calls.rs:1499`, `logical_and_or_coalesce_with_literals`)
_Notes:_ literal-only short-circuit is pure win (no semantics risk) — joins the SITE-33 all-literal fold bundle with SPEC-V2-10/11/12.

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
_Notes:_ station-only (`walk_array` recurses `walk_expression` per element, `responsive.rs:33`; `Elision` arm exists at `:29`). `[re-graded]` Whole-object and other non-object args → SPEC-V2-65; this entry is ternary-args and holes only. The `css(c ? a : b)` acceptance is the seeded SUPERIOR exhibit (v2 `calls.rs:556` drops it).

**SPEC-V2-28 — array spreads: flatten literal, refuse dynamic — TO-BUILD · Ph1 (refuse + diagnose) / Ph3 (literal flatten)** `[re-graded]` · `ATM-SITE-37` · ex-48
_Language:_ `...[2, 3]` (or a const array) inside a value array or merge list flattens in place; `...dyn` refuses with a LOCATED diagnostic naming the spread, keeps arity honest, never shifts a sibling to the wrong breakpoint; wants/plans agree.
_Ours:_ `css({ padding: [1, ...[2, 3], 4] })` → `1|2|3|4` at base..lg (Ph3); `css({ padding: [1, ...dyn, 4] })` → warning, no atoms from that array (Ph1)
_Panda:_ flattens literal spreads (`calls.rs:1265`, `literal_array_spread_inside_arg`); an unresolvable spread drops the WHOLE array, silently (`literal-evaluator.md:47-48`)
_Notes:_ soundness hole today: `SpreadElement` yields `None` from `as_expression()`, so both walkers skip it while `enumerate` still consumes the slot — `4` lands one breakpoint early with NO diagnostic, and the plan path collapses the whole array to `None` (wants without plans). Ph1: refuse-with-diagnostic in BOTH walkers (`responsive.rs`, `css/mod.rs:55`). Ph3: flatten literal / const-array spreads (needs const arrays recorded, SPEC-V2-63). Was "we refuse instead (stricter, deliberate)": refusing what v2 flattens is a gap; refusing what v2 drops silently, with a diagnostic, is SUPERIOR.

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
_Notes:_ `record_declaration` ignores identifier inits (`collect.rs:48`); `insert_scalar` unions same-named leaves (`index.rs:27`, scope-blind → bloat AND a missed-diagnostic path; root fixed by SPEC-V2-75); `record_object_entry` records literal props only (owns xf-R3/R4 — same-file gaps surfacing cross-file). `[re-graded]` Whole-object USES (`css(b)` where `b` is an object) → SPEC-V2-65.

**SPEC-V2-35 — mutated `let` drops — TO-BUILD · Ph1** · `ATM-SITE-28` · ex-D2 (mutation part)
_Language:_ a `let` with any assignment drops to warn + zero wants (never resolves its stale init).
_Ours:_ `let color = 'red'; color = 'blue'; css({ color })` → warning, zero wants
_Panda:_ (`scope.rs:224`, `let_mutated_drops_resolution`)
_Notes:_ soundness bug: zero mutation tracking anywhere in `extract/` (`grep mutat` empty) — stale `'red'` emits with no diagnostic today. Fix: record `let`/`var` until an assignment, or drop them. Unmutated controls are SPEC-V2-02.

**SPEC-V2-36 — micro-fold bundle — TO-BUILD · Ph2** · `ATM-SITE-30` · ex-1 (shorthand), ex-60 (Ms part), ex-64 (string-head), ex-66
_Language:_ shorthand `{ color }`, `css({})`, `css('panda', {...})`, `cx('card', css({...}))`, no-arg `css()` — all fold/skip as today, zero new warnings.
_Ours:_ `css({ color })`; `css('panda', { color: 'red' })`
_Panda:_ (`scope.rs:262`, `shorthand_property_resolves_via_resolver`; empty `calls.rs:224`, string-head `:1697`, nested `:679`, no-arg `:1687`)
_Notes:_ pins accidental-but-correct mechanisms before SPEC-V2-09 narrows them. `[re-graded]` (The positional-unresolvable half of `:1719` is SPEC-V2-65: a located diagnostic on the arg, siblings kept — better than v2's silent `None` slot.)

**SPEC-V2-37 — callee-identity + drop micros — TO-BUILD · Ph2** · `ATM-SITE-36` · ex-12, ex-53/ex-D7, ex-62, ex-D2 (no-init), ex-D9, `missing_member` (`scope.rs:305`)
_Language:_ `panda({...})`, `panda.somethingElse({...})`, block-scoped `const css`, `const a = a`, `a↔b` cycles, `let color;`, bare `getColor`, `tokens.colors.blue` miss — each skips/warns exactly once with siblings kept.
_Ours:_ `{ const css = (x) => x; css({ color: 'red' }) }` → dropped
_Panda:_ (`calls.rs:965`, `namespace_property_outside_name_allowlist_is_skipped`; bare-namespace `:981`; block-shadow `scope.rs:720`; cycle `:832`; no-init `:1403`)
_Notes:_ pins fail-closed mechanics. Declarator shadows register on the enclosing function scope (`mod.rs:241`) — over-shadowing later siblings is fail-closed. Identifier inits are never recorded, so cycles are trivially safe + warn (no recursion possible).

**SPEC-V2-38 — call discovery + multi-arg merge — HAVE** · `ATM-SITE-02/04/12`, `NEO-SITE-04` (identity) · ex-60 (HAVE part), ex-61, ex-63, ex-67, ne-§4 (multi-arg)
_Language:_ literal calls found inside JSX / fn bodies / nested args; multi-arg `css(a, b, …)` merges every arg (no cap); unmatched callees ignored; `` css`…` `` is not a site.
_Ours:_ `css({ color: 'red' })` anywhere; `css(a, b)` → both atom sets
_Panda:_ (`calls.rs:480`, `multiple_calls_in_one_source`; in-JSX `:657`, in-fn `:702`, unmatched `:523`, tagged `:2040`; multi-arg `pandacss_stylesheet/tests/atomic.rs:1449`, 4-arg `:1596`, arg-`&&` `:1626`)
_Notes:_ descent is by construction (SITE-10 shadow test proves fn-body descent). Import alias/namespace identity (`nCss`, `panda.css`) rides here via SITE-15/NEO-SITE-04. `[re-graded]` `` css`…` `` on a LIVE `css` binding stays a non-site but must DIAGNOSE (`tagged template is not a css() site; use css({...})`) — ATM-SITE-12 currently records "no wants, no diagnostic", which the no-silence rule forbids; the sweep is SPEC-V2-65.

### Family K — helpers + refusals

**SPEC-V2-39 — pure-helper folds — TO-BUILD · Ph3** · `ATM-SITE-31` + `NEO-SITE-21` (paint arm) · ex-50
_Language:_ closed single-expression helpers fold: nullary/args/defaults, `function` decls, both IIFEs, object-return spread into `css()`/JSX; captures bake.
_Ours:_ `const get = () => 'red'; css({ color: get() })` → red
_Panda:_ (`scope.rs:908`, `local_function_call_return_folds`; IIFE `:927`, decl `:945`, defaults `:1073`, object-return `:1030`)
_Notes:_ `[re-graded]` the gate is a FENCE, not a decision. Adopt v2's `pure_fn` descriptor verbatim (`literal-evaluator.md:107-122`): arrow / `function` / IIFE lowered to a closed descriptor; every argument must fold; non-param captures must fold and are baked at lower time; lowering FAILS on async/generators, rest or destructured params, nested unknown calls, `this`, assignment, any impure form; bare uncalled function values never fold. Single-expression body is our additional tightening (v2 does not enumerate body shapes — we do, and refuse the rest; `fold/fence.rs`, §7.1). Highest-value new language and the easiest place to become an interpreter; SPEC-V2-42's per-shape refuse pins are the tripwires. (v1 folded these incidentally; v2 named the descriptor — take the descriptor, especially the refuse list.)

**SPEC-V2-40 — helper-returned computed key — TO-BUILD · Ph3 (tail: after 39 + 64)** `[re-graded]` · rides `ATM-SITE-49` · ex-51
_Language:_ `(name) => ...` helper result used as `[groupHover('cool')]` key.
_Ours:_ ``const gh = (n) => `&[data-group-hover="${n}"]`; css({ [gh('cool')]: { color: 'red' } })`` → the folded key becomes a selector condition
_Panda:_ (`scope.rs:966`, `pure_helper_param_template_folds_as_computed_key`)
_Notes:_ was BLOCKED on a differ that no longer exists. Composes SPEC-V2-39 (helper fold) with SPEC-V2-64 (computed key through the fold table) and SPEC-V2-67 (template body); no engine work of its own — it is the integration station.

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
_Notes:_ corpus recommended absence on lib-usage grounds; struck by the frame. Fence EXACTLY as v2 fences (`literal-evaluator.md:67`: `Literal::Object` from member initializers; auto-incremented members drop; enums whose declaration is unreachable refuse). `[re-graded]` no ruling pending — file SITE-43.

**SPEC-V2-46 — param type-literal fence — TO-BUILD · Ph3** · proposed `ATM-SITE-44` · ex-58
_Language:_ `function f(props: { color: 'red'; size: 4 })` → `props.color` folds; destructured-param twin binds the member; non-literal/optional members refuse (already HAVE, SPEC-V2-41).
_Ours:_ `function paint(props: { color: 'red' }) { return css({ color: props.color }) }` → red
_Panda:_ (`polish.rs:104`, `function_param_with_type_literal_resolves_member`; destructured `:142`)
_Notes:_ same struck dissent as SPEC-V2-45. Fence: literal members fold, everything else refuses (v2 `literal-evaluator.md:68`; `:74` — params without a `TSTypeLiteral` drop). `[re-graded]` no ruling pending — file SITE-44. A typed param is still a *param* (SPEC-V2-75 shadows any same-named const); the type literal is the only thing that makes it foldable.

### Family N — nesting / combinators

**SPEC-V2-47 — core `&` substitution — HAVE** · `NEO-COND-01/03/06/07/08/09`, `ATM-COND-02/09/10/14/20`, `ATM-UNIT-03`, `ATM-LAYER-09`, `NEO-PARITY P2` · ne-§3.1, §3.3(H), §3.4(H), §3.5, §3.6, §3.7
_Language:_ pseudo chains, comma groups, sibling combinators (`& + &`, `& ~ &`), tail-`&` parents, two-level pseudo/descendant stacks, comma descendant lists, and literal `&` inside attribute strings all substitute.
_Ours:_ `css({ '&:hover': {...}, '& > p': {...}, '&[data-x="open"]': {...} })`
_Panda:_ (`pandacss_stylesheet/tests/nested_selector_parity.rs:26`, `:37`, `:70`, `:92`, `:125`, `:180`, `:202` — one per shape group above)
_Notes:_ `& + &` proven in browser (PARITY P2 parity worlds); `& ~ &` proven in rust (UNIT-03 numerics, LAYER-09 `:is()`-wrap — globalCss spelling, same substitution); attr-`&` arm is COND-14 (plus the atomic cousin `configured_condition_ignores_ampersand_inside_attribute_value`, the 16th skim test). Lib authors 28 `&` keys, all one level deep — the deeper and odder shapes are Family Q (SPEC-V2-68..73): four entries pin-only, two are paint bugs today. `[re-graded]` nothing in the nesting matrix is OUT.

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
_Notes:_ Reference has NO resolver today: `collect_project_constants` merges ALL const declarators at every depth into one namespace (`index.rs:88-98`); the observable holds iff the origin const is scanned AND no other file declares the same name with a different value. `[re-graded]` the mechanism is replaced by SPEC-V2-76 (binding walk to the declared export in *that* file — v2's model, `cross-file-resolution.md:102-112`); HAVE stands on the observable, with SPEC-V2-75's collision control as the guard until 76 lands.

**SPEC-V2-51 — imported spreads pin — TO-BUILD · Ph2** · `ATM-SITE-39` (was X-24) · xf-R5
_Language:_ imported const objects spread at top level and under conditions.
_Ours:_ `css({ ...hover, bg: 'blue' })` + `css({ _hover: { ...hover } })` with `hover` from `styles.ts`
_Panda:_ (`cross_file.rs:316`, `imported_object_spreads_under_condition`)
_Notes:_ pin only (SITE-11 unpack × SITE-16 merge); no station pins the cross-file instance today.

**SPEC-V2-52 — aliased value import — TO-BUILD · Ph4** `[re-graded]` · `ATM-SITE-40` (was X-25) · xf-R6
_Language:_ `import { brand as primary }` resolves the consumer's local alias to the declared const.
_Ours:_ `tokens.ts`: `export const brand = 'red'`; `import { brand as primary }; css({ color: primary })` → red
_Panda:_ (`cross_file.rs:421`, `aliased_import_resolves_by_exported_name`)
_Notes:_ merge keys by DECLARED name (`brand`); the local alias resolves to nothing → dynamic warning + drop today. `bindings.rs` maps aliases for `css` identity only (SITE-15), never for values. Resolved by SPEC-V2-76's binding walk (`local → (specifier, imported_name)` → the declared export in the target file) — no alias map bolted onto the name bag. The one xfile shape authors plausibly write.

**SPEC-V2-53 — `export let` folds — HAVE (unpinned; tightened by Ph1)** `[re-graded]` · rides `ATM-SITE-28` · xf-R7
_Language:_ unmutated `export let`/`var` fold like `const`.
_Ours:_ `export let x = 'red'` in `tokens.ts` → folds at use
_Panda:_ (`cross_file.rs:502`, `export_let_currently_folds_too`)
_Notes:_ `visit_variable_declarator` has no kind check, so today we fold even MUTATED `let` — that half is the SPEC-V2-35 soundness bug and closes in Ph1 (mutation tracking); unmutated `export let`/`var` keep folding, pinned on SITE-28's cross-file arm.

**SPEC-V2-54 — unresolvable import drops + diagnostic — SUPERIOR** `[re-graded]` · `NEO-SITE-06` precedent · xf-R8
_Language:_ unresolvable specifier / missing export drops the call with a diagnostic, never a ghost.
_Ours:_ unknown identifier → `Dynamic non-literal identifier` warning + no ghost
_Panda:_ (`cross_file.rs:465`, `unresolvable_specifier_drops_outer_call`; missing-export `:488` — both silent)
_Notes:_ fail-closed-PLUS-diagnostic vs v2's silent drop — ours is the upgrade, keep it.

**SPEC-V2-55 — imported conditional both arms — TO-BUILD · Ph2** · `ATM-SITE-42` (was X-27) · xf-R9
_Language:_ an imported const object holding a ternary compiles both arms on spread.
_Ours:_ `tokens.ts`: `export const c = { color: flag ? 'red' : 'blue' }`; `css({ ...c })` → both arm utilities + plans
_Panda:_ (`cross_file.rs:1368`, `imported_conditional_object_keeps_encode_branches`)
_Notes:_ pin only (RS-37 branching leaves × merge; same-file fan-out already pinned by SITE-23).

**SPEC-V2-56 — barrel re-export chains — TO-BUILD · Ph2 (probe) → Ph4 (build)** `[re-graded]` · `ATM-SITE-41` (was X-26) · xf-X1
_Language:_ `export { x } from` chains (1–3 hops, incl. barrels and aliased re-exports) resolve by binding to the origin declaration.
_Ours:_ `barrel.ts`: `export { brand } from './tokens'`; App imports from barrel → `c_red` (probe: likely green via merge today; build: green by binding)
_Panda:_ (`cross_file.rs:1194`, `deep_import_chain_resolves_through_re_export`; chain-cache twins `:751`, `:962`, `:995`, `:1038`)
_Notes:_ probe first because it is cheap and records the merge-era behaviour (`export … from` adds nothing to the merge — the barrel is inert; value resolves iff the origin file is in `include`). Then build regardless of colour: SPEC-V2-76 follows the hops with a cycle guard. The absence recommendation ("lib writes zero re-exported style consts") is struck by the frame.

**SPEC-V2-57 — imported pure helpers — TO-BUILD · Ph4 (after 39 + 76)** `[re-graded]` · `ATM-SITE-31` cross-file arm · xf-F1
_Language:_ imported arrow / function-decl calls fold (incl. computed-key helper, object-return spread, re-exported pure fn).
_Ours:_ `import { tone } from './t'; css({ color: tone('600') })`
_Panda:_ (`cross_file.rs:1220`, `imported_pure_arrow_call_folds`; decl `:1262`, object-return `:1344`)
_Notes:_ ordering, not a gate: the same-file fence (SPEC-V2-39/42) lands first, then the binding resolver (SPEC-V2-76) exports pure-fn descriptors the way v2's `ExportEntry::PureFn` does (`literal-evaluator.md:120-122`). Functions are ignored by the collector today → call values warn-and-skip (NEO-SITE-06).

**SPEC-V2-58 — bare imported fn value — HAVE (trivially)** · collector behavior · xf-F2
_Language:_ uncalled imported function values fold nowhere.
_Ours:_ `css({ color: getColor })` (imported, uncalled) → warns, skips
_Panda:_ (`cross_file.rs:1310`, `bare_imported_function_value_does_not_fold`; aliased-export twin `:1325`)

**SPEC-V2-59 — import identity scan — HAVE** · `ATM-SITE-15`, `NEO-SITE-04` · xf-I1, ex-61
_Language:_ named / aliased / namespace / default / type-only / multi-decl imports gate site identity; default and type-only never extract.
_Ours:_ `import { css as c } …; c({...})` extracts; `import type …` / default-imported names don't
_Panda:_ (`imports.rs:34`, `named_imports_with_alias`; namespace `:63`, type-only `:100`, default `:12`; identity twins `calls.rs:463`, `:862`)
_Notes:_ ours scans imports for SITE IDENTITY ONLY (`bindings.rs:79-110`, Reference packages only) and never follows a specifier to a file. `[re-graded]` String-literal import names (`import { "css" as x }`, xf-I2) are HAVE, not a non-site: `imported_name` matches `ModuleExportName::StringLiteral` (`bindings.rs:131`) — unpinned, add the arm to SITE-15 (the corpus filed it as absence on "no author writes this", which the frame strikes). Side-effect imports (xf-I3) bind nothing and gate nothing — genuinely no shape, not a refusal. `[re-graded]` re-export scanning is NOT out: once SPEC-V2-76 follows bindings, a consumer's `export { css } from '@reference-ui/react'` wrapper module carries identity to its importers with zero config — the SUPERIOR replacement for v2's `importMap` (`ATM-SITE-55`).

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
_Notes:_ SYNTHESIS, not copy. `[re-graded]` the hex fold is EQUIVALENT-or-better, not an absence: `var(--colors-red)` stays live under theme switches and `[data-theme]` scopes where a parse-time `#ef4444` is frozen; the paint is identical in the default theme and *only ours* is correct after a theme change. Keep one correspondence: unknown-path + fallback → fallback, without → located diagnostic (never a ghost).

**SPEC-V2-62 — factory consts resolve — TO-BUILD · Ph3** · proposed `ATM-SITE-46` · xf-K1 (fold part)
_Language:_ imported `keyframes()` / `positionTry()` consts resolve as const-resolution language (incl. prefix, barrel, alias, multi, joint).
_Ours:_ `import { fade } from './kf'` (a `keyframes()` const) → resolves at the consuming site
_Panda:_ (`cross_file.rs:1437`, `imported_keyframes_const_folds_in_animation_name`; positionTry `:1460`, prefix `:1506`, barrel `:1526`, alias `:1550`, multi `:1571`, joint `:1598`)
_Notes:_ `[re-graded]` no ruling pending: a factory const is const-resolution LANGUAGE (the identifier resolves to the factory's name string), so it rides the const graph (SPEC-V2-34) and the binding resolver (SPEC-V2-76). `viewTransition()`-as-value: v2 itself refuses (`:1481`) — we may refuse too, WITH a diagnostic (the frame's only admissible refusal). Product codegen for these factories is OUT-OF-AXIS (§4).

### Family Q — promoted from differs and absences (2026-09-18, no-gap frame)

Every entry here was a "standing differ" or an "approved absence" in the
previous draft. Each is re-graded with the mechanism that makes us
equal-or-better; none is refused on the grounds that we do less. The old
rationales are quoted where they were load-bearing, then answered.

**SPEC-V2-63 — element access with a foldable index — TO-BUILD · Ph3** · `ATM-SITE-48` + `NEO-SITE-23` · ex-8, ex-56 (was differ #1, reads; SITE O1/O2/O3)
_Language:_ `obj[key]` folds when the object folds (const object / const array / inline literal) and the index folds to a string or number: `colors['red']`, `colors[k]` over `const k = 'red'`, `sizes[1]`, `['red','blue'][0]`, `[…][i]`, `[…]["1"]`, `({a:'red'})['a']`, `m['a'+'b']`, `` m[`a${'b'}`] ``, `colors['red']['500']`, `sizes?.[k]`; an unfoldable index refuses with a located diagnostic naming the index expression, siblings kept.
_Ours:_ `const colors = { red: '#f00' }; css({ color: colors['red'] })` → `#f00`; `css({ color: colors[props.k] })` → diagnostic on `props.k`, siblings kept
_Panda:_ (`scope.rs:321`, `computed_string_key_resolves`; ident `:340`; index `:393`, `:412`, `:430`, `:449`; inline `:468`; concat `:486`; template `:505`; optional `optional_chaining.rs:38`; `literal-evaluator.md:60`)
_Notes:_ old rationale — "the refusal is UNIFORM so the dialect never depends on whether a key happened to be foldable" — struck: the fold table IS the dialect, and the author is told which sub-expression stopped us. Needs const arrays recorded (the collector ignores `ArrayExpression` inits today) and nested objects (shares `ATM-SITE-29`, SPEC-V2-31). `ComputedMemberExpression` has no arm in `walk.rs` today (generic warn, `:208-214`).

**SPEC-V2-64 — computed style-object keys — HAVE (static) / TO-BUILD · Ph3 (folded)** · `ATM-SITE-49` · ex-9 (was differ #1, keys; SITE O4)
_Language:_ `{ ['color']: v }` and `{ [42]: v }` resolve (static); `{ [k]: v }` over `const k = 'color'`, `{ ['col'+'or']: v }`, and computed condition keys `{ [cond]: { [k]: v } }` fold through the same table as values; a key that does not fold refuses with a located diagnostic and keeps siblings.
_Ours:_ `css({ ['color']: 'red' })` → `c_red` (oxc carries a computed string key as `PropertyKey::StringLiteral`; `object.rs:198-217` never checks `computed`, so this resolves today — verify at the station); `const k = 'color'; css({ [k]: 'red' })` → `c_red` (build)
_Panda:_ (`calls.rs:1288`, `computed_key_from_string_literal`; numeric `:1304`; concat `:1320`; ident `scope.rs:360`; in-condition `:375`; `literal-evaluator.md:61`)
_Notes:_ the static half is HAVE by accident — pin it before the fold table touches `resolve_property_key`. SUPERIOR on the refuse side: v2 drops the WHOLE call for an unfoldable computed key (`computed_keys_skip_extraction`); we drop the one member and keep the rest (SPEC-V2-41).

**SPEC-V2-65 — non-object `css()` args: whole-object, member, wrapped, unresolvable — TO-BUILD · Ph1 (diagnose) / Ph3 (resolve)** · `ATM-SITE-50` + `NEO-SITE-24` · App. A whole-object verdicts, `calls.rs:548` ident/member part, `:1719` (was differ #3; SITE "silent 0/0/0/0")
_Language:_ `css(styles)`, `css(theme.colors)`, `css(cond ? styles : other)`, `css(primary)` through an alias chain, `css(space)` over a destructured rest — an argument that folds to an object extracts exactly as if spread (`css({ ...styles })`); an argument that does not fold emits a located diagnostic naming the argument position and keeps sibling args; `css({...} as const)` / `satisfies` / `!` / parens / `<any>` unwrap at the arg (SPEC-V2-06/07).
_Ours:_ `const styles = { color: 'red', padding: '4px' }; css(styles)` → both atoms (Ph3); `css(fn())` → `css() argument 1 is not a static style object (call expression)` + sibling args kept (Ph1)
_Panda:_ (`scope.rs:43`, `const_object_identifier_resolves`; chain `:63`, `:671`; rest `:587`; staged `calls.rs:548` → `panda_call_unextractable` ×3; positional `None` `:1719`; `literal-evaluator.md:57-59` — `css(styles)` is not a special form, it is the identifier fold of the arg)
_Notes:_ old rationale — "wholesale object flow is outside the want/plan model; taking it would mean tracking values, not leaves" — is false in the engine's own terms: `unpack_local_const_object` (`object.rs:335-374`) already lowers a const object to wants AND authored plans for `...styles`; an identifier arg is the same object with the braces removed. Today `handle_css_arg` is `_ => {}` (`css/mod.rs:37`) — zero wants, zero diagnostics — and `walk_object_branch` (`:62-66`) silently returns on a non-object ternary arm. Ph1 is the NO-SILENCE SWEEP: every `_ => {}` on a site path (`css/mod.rs:37`, `:57`; `jsx/mod.rs:79-89`, `:125-158`; `responsive.rs` spreads; tagged template on a live binding, SPEC-V2-38) becomes a located diagnostic. A positional diagnostic beats v2's silent `None` slot.

**SPEC-V2-66 — literal-test dead-arm fold — TO-BUILD · Ph3 (fold bundle, `ATM-SITE-33`)** · + `NEO-SITE-25` · ex-31, ex-42 (was differ #2 / D11's literal half)
_Language:_ when a ternary test or a conditional-spread test folds to a boolean (`true ? a : b`, `1 === 1 ? …`, `(2+2===4) ? …`, `const dark = true; dark ? …`, `...(false ? a : b)`), only the live arm compiles and an `info` diagnostic names the dead arm; open tests keep both arms (SPEC-V2-15, unchanged).
_Ours:_ `css({ color: true ? 'red' : 'blue' })` → `c_red` only + `info: dead branch 'blue' (test folds to true)`
_Panda:_ picks one branch, silently (`conditional_output.rs:47`, `:449`, `:467`; `calls.rs:1443`, `:1635`, `:1867`; `scope.rs:1328`; `literal-evaluator.md:55`)
_Notes:_ old rationale — "pick-one at extract would be a second semantics for the same syntax" — conflates folding with semantics: the runtime picks the same arm every time, so the dead atom is sheet weight with no paint. Compiling both arms for OPEN tests stays; that is D11's correct half. SUPERIOR on landing: v2 says nothing about the dead arm. Guard: a test that folds only through a MUTATED binding is open (SPEC-V2-35).

**SPEC-V2-67 — interpolated templates over foldable parts — TO-BUILD · Ph3** · `ATM-SITE-51` + `NEO-SITE-26` · ex-26 (was O8 refusal / §3B absence)
_Language:_ `` `${n}px` ``, `` `${o.p}` ``, `` `${2+3}px` ``, `` `linear-gradient(${a}, ${b})` `` fold when every `${…}` folds through the table; a multi-leaf part (const ternary) fans out to one string per combination (capped, §7.1; over the cap → diagnostic, never a partial fan-out); an unfoldable part refuses with a located diagnostic naming that part.
_Ours:_ ``const n = 4; css({ width: `${n}px` })`` → `w_4px`; ``css({ width: `${props.w}px` })`` → diagnostic on `props.w`
_Panda:_ (`scope.rs:868`, `:887`; `calls.rs:1214`, `:1420`, `:1972`; `literal-evaluator.md:56`) — v2's staged harness drops silently where we diagnose
_Notes:_ `extract_template_literal` (`literal.rs:86-109`) is static-only today. The template becomes a fold node: quasis + folded parts → string; the `!important` suffix rule applies to the joined string; whitespace canonicalization (SPEC-V2-14) applies after the join.

**SPEC-V2-68 — nesting: bare comma members scope to the parent — TO-BUILD · Ph1 (paint leak)** · `ATM-COND-23` + `NEO-COND-17` · ne-§3B `:642`, `:653`, `:664`
_Language:_ in a comma-list selector key, a member WITHOUT `&` is implicitly `& <member>` (CSS nesting semantics): `'&:not(:first-child), :only-child'` → `.c:not(:first-child), .c :only-child`; `'& .one, .two'` → `.c .one, .c .two`; the same under a further nested key.
_Ours:_ `css({ '&:not(:first-child), :only-child': { mt: '0' } })` → both members scoped (build). Today `apply` prints `.c:not(:first-child), :only-child` — the second member matches EVERY `:only-child` in the document.
_Panda:_ (`nested_selector_parity.rs:642`, `nested_comma_group_scopes_member_without_ampersand`; `:653`; `:664`)
_Notes:_ `pseudoselectors::apply` (`:45-57`) substitutes `&` character-wise and prefixes the class only when the WHOLE template lacks `&`; a mixed list leaks. Was dropped as a "zero-authorship absence" — it is a global-selector leak out of a `css()` key, the worst kind of paint bug (it styles other people's elements). Fix in the nesting grammar (§7.5): split on top-level commas, scope each member.

**SPEC-V2-69 — nesting: `:is()` armour for complex parents — TO-BUILD · Ph1 (paint wrong)** · `ATM-COND-24` · ne-§3B `:675`, `:686` (and every multi-`&` / non-leading-`&` shape under a stacked parent)
_Language:_ when the current selector carries a top-level combinator (it was itself produced by nesting), `&` means `:is(current)`, not the text of `current`: parent `'& .divider'` + `'& .bar & .baz'` → `:is(.c .divider) .bar :is(.c .divider) .baz`; parent `'& > .row'` + `'& + &'` → `:is(.c > .row) + :is(.c > .row)`. Textual substitution stays when the parent is a compound, or when `&` is single and leading (`& > p` then `&:hover` → `.c > p:hover`, unchanged).
_Ours:_ today `selector_with_system` (`name/mod.rs:59-63`) applies each stacked template with plain `apply`, so `'& > .row'` + `'& + &'` prints `.c > .row + .c > .row` — which requires a `.c` element to be the adjacent sibling, not two `.row` siblings. Wrong paint.
_Panda:_ (`nested_selector_parity.rs:675`, `nested_multi_ampersand_under_descendant_parent_uses_is`; `:686`, `nested_sibling_ampersands_under_child_parent_uses_is`)
_Notes:_ `apply_distributed` already carries the rule (`member_needs_is_wrap`, `:137-153`) for the GLOBAL walker's parent lists; the utility path never got it. Same fix, same module (§7.5). Was dropped as zero-authorship; it is a correctness bug in two-level nesting, which lib DOES write (28 keys; COND-20 stacks).

**SPEC-V2-70 — nesting: self-`&` inside functional pseudos — HAVE (unpinned) · pin Ph2** · `ATM-COND-25` · ne-§3B `:169`, `:224`, `:301`, `:312`, `:334`, `:356`, `:411`, `:422`
_Language:_ `&:not(&.no)`, `&:has(&, :not(&))`, `&.b :not(& + &)`, `&.b:not(& + &)`, `&.b :is(&)`, `&.b:is(&)`, `&:is(.bar, &.baz)`, `&:not(&)` — every unquoted `&` substitutes, including inside functional-pseudo arguments.
_Ours:_ `css({ '&:is(.bar, &.baz)': {...} })` → `.c:is(.bar, .c.baz)` (character-wise `apply` already does this; `test_apply` covers an `&:not(...)` list)
_Panda:_ (`nested_selector_parity.rs:411`, `nested_is_with_inner_compound_ampersand`; the rest as listed)
_Notes:_ pin at one level; under a complex parent these ride SPEC-V2-69's armour (each `&` → `:is(parent)`). The class-name segment must be identical however the same key is spelled (canonical template, §7.5).

**SPEC-V2-71 — nesting: compound and multi-`&` — HAVE (unpinned) · pin Ph2** · `ATM-COND-26` · ne-§3B `:235`, `:257`, `:268`, `:323`, `:345`, `:367`, `:400`
_Language:_ `&&` → `.c.c`, `&&&` → `.c.c.c`, `&.b&` → `.c.b.c`, `&&+&` → `.c.c+.c`, `&+&` → `.c+.c`, `&.b &` → `.c.b .c`, `& .bar & .baz & .qux` → `.c .bar .c .baz .c .qux`.
_Ours:_ character-wise substitution already prints these (`apply` replaces every `&`)
_Panda:_ (`nested_selector_parity.rs:257`, `nested_double_ampersand_compound`; the rest as listed)
_Notes:_ `&&` is the specificity-bump idiom; pinning it protects a real author trick. Under complex parents → SPEC-V2-69.

**SPEC-V2-72 — nesting: tag / class / BEM compounds, ancestors, tails, bare `&` — HAVE (unpinned) · pin Ph2** · `ATM-COND-27` · ne-§3B `:48`, `:59`, `:103`, `:279`, `:290`, `:378`, `:532`, `:587`, `:598`, `:609`, `:620`, `:631`
_Language:_ `&_elem` → `.c_elem`, `&html` → `.chtml`, `html&` → `html.c`, `body&`, `.foo&`, `body &:hover b` → `body .c:hover b`, the three-level tail `.c &` over `& .b` over `&:hover`, `&h1, &h2`, `&+.baz, &.qux`, `&>.bar`, `&(:focus)` (textual), bare `&` → the class itself.
_Ours:_ textual `apply` prints every one of these identically to v2's expectations
_Panda:_ (`nested_selector_parity.rs:48`, `nested_ampersand_replaces_bem_elem_shorthand`; `:631`, `nested_standalone_ampersand`; the rest as listed)
_Notes:_ bare `&` today mints a `[&]` class segment and therefore a distinct atom from the unconditioned one — decide at the station whether `'&': {…}` is the identity condition (drop the segment; v2 prints "class only") or a distinct key. Several of these are absurd authoring; they are pinned because the grammar must be TOTAL, not because anyone should write `&html`.

**SPEC-V2-73 — nesting: pseudo-element placements and combinator stacks — HAVE (unpinned) · pin Ph2** · `ATM-COND-28` · ne-§3B `:444`, `:488`, `:499`, `:510`, `:543`, `:554`, `:565`
_Language:_ `& ::after` (descendant pseudo-element), `::before&`, `:before&`, `::before &`; stacks `& .b`/`& .c`/`& .d` → `.c .b .c .d`, `& > .row`/`& > .cell` → `.c > .row > .cell`, `&:last-child` then `& :is(.a, .b)`.
_Ours:_ sequential template application in `selector_with_system` prints these (COND-20 proves the two-level case)
_Panda:_ (`nested_selector_parity.rs:565`, `nested_child_combinator_stack`; the rest as listed)
_Notes:_ pin; the pseudo-class-before-pseudo-element sort is SPEC-V2-48.

**SPEC-V2-74 — shadow pins: JSX tag shadowed by a param; `undefined` shadowed by a param — HAVE · pin Ph2** · `ATM-SITE-52` · ex-14, ex-D11 (was §3B "absurd code")
_Language:_ `function F(Div) { return <Div mt="2r" /> }` — the tag is a param, not a host: no wants, one diagnostic; `function F(undefined) { css({ color: undefined }) }` — the leaf is omitted either way.
_Ours:_ `allows_jsx_tag` consults the shadow stack (`extract/mod.rs:106-114`) → fail-closed; `undefined` omits by name (`walk.rs:300-304`)
_Panda:_ (`scope.rs:803`; `polish.rs:352` — v2 keeps a shadowed `undefined` open)
_Notes:_ "absurd code" is not a reason to leave a fail-closed path unpinned — these are exactly the shapes Doom will write. EQUIVALENT on the `undefined` half (both engines emit nothing); pin the reason so the accident becomes a decision.

**SPEC-V2-75 — scope-aware identifier resolution — TO-BUILD · Ph1 (SOUNDNESS, P0 path)** · `ATM-SITE-53` + `NEO-SITE-27` · App. B4, xf-R3/R4 root
_Language:_ an identifier in value position resolves through its binding: the innermost declarator in scope, else the file's import binding (SPEC-V2-76), else dynamic. Params and inner declarators shadow outer and project-wide consts; two files declaring the same name never see each other's values.
_Ours:_ `a.ts: export const color = 'red'`; `b.ts: function Card({ color }) { return css({ color }) }` → in `b.ts`, `color` is a param → located diagnostic, zero wants. Today it resolves to `'red'` silently, and the runtime call with the real value finds no class — a ghost with no compile-time warning.
_Panda:_ scope-correct by construction (oxc semantic bindings; `scope.rs:1349`, `inner_scope_shadows_outer_same_named_const`; `:1369` closure)
_Notes:_ `handle_identifier_fallback` (`walk.rs:217-234`) reads `constants.scalar_leaves(name)` without consulting `shadowed`; `collect_project_constants` (`lib.rs:175-191`) merges every file's declarators into one name bag; `insert_scalar` unions (`index.rs:27-33`). The combination reaches the crate's own P0 definition ("a runtime asks for an atom the sheet never printed") with no diagnostic. Fix: a `ScopeTable` of bindings resolved through a `ScopeChain` (§7.2); the project-wide bag is replaced by import-binding lookup. Build BEFORE any Ph3 fold — every fold that resolves identifiers inherits this.

**SPEC-V2-76 — binding-aware import resolution — TO-BUILD · Ph4** · `ATM-SITE-40/41/54/55` + `NEO-SITE-28` · xf-R6, xf-X1, xf-C1/C2/C6, xf-F1, `importMap` (was §3A "no resolver exists")
_Language:_ `import { brand as primary } from './tokens'` resolves `primary` to the `brand` export of THAT file; `export { x } from` hops (barrels, aliased re-exports) follow by binding; specifiers resolve relative → `tsconfig` `paths`/`baseUrl` → extension probing → package `exports`; cycles guard to nothing + diagnostic; an unresolvable specifier or missing export → located diagnostic. Riders (SUPERIOR): site identity through re-exports (`export { css } from '@reference-ui/react'` in a consumer module, zero config — `ATM-SITE-55`); namespace member imports (`import * as t; t.brand`) and `export default` objects, which v2 refuses (`cross-file-resolution.md:95-96`).
_Ours:_ `tokens.ts: export const brand = 'red'`; `import { brand as primary } from './tokens'; css({ color: primary })` → `c_red`; `a.ts: export const gap = '4px'`, `b.ts: export const gap = '8px'`, a consumer importing from `b` → `8px` only (collision control, `ATM-SITE-54`)
_Panda:_ (`cross_file.rs:421`, `aliased_import_resolves_by_exported_name`; chain `:1194`; cycles `:545`, `:569`; resolver `:146`, `:442`; design `cross-file-resolution.md:102-129`, cache keyed `PathBuf → export → ExportEntry`)
_Notes:_ replaces merge-not-resolve. The value graph follows imports wherever they lead (read-only, cached by `(path, export)` — v2's `CachedFileExports` shape) while the SITE set stays the `include` globs — the same split v2 makes. Watch invalidation of dependents is the Neo sync layer's rider (§4). Absorbs SPEC-V2-52 (alias), 56 (barrels), 57 (imported helpers), and gives 50/51/55 their real mechanism.

**SPEC-V2-77 — diagnostic precision: `line:col` on every extract diagnostic, stable codes — TO-BUILD · Ph1** · `ATM-DIAG-05` (existing `[ ]` row: "codes unspecified") · xf-I5, ex-65
_Language:_ every diagnostic the extractor emits carries `file:line:col` of the offending node and a stable code (`ATM-W-…` / `ATM-E-…`), so the author can jump to the sub-expression that stopped extraction and tooling can filter by kind.
_Ours:_ `css({ color: props.c })` → `test.tsx:3:18 ATM-W-DYNAMIC-MEMBER dynamic member expression for prop 'color'` (build). Today `ExpressionWalk::warn` (`walk.rs:67-71`) and `ObjectWalk::warn` (`object.rs:51-54`) pass `None, None` — file-only.
_Panda:_ byte spans on every diagnostic (`imports.rs:518`, `:527`; `calls.rs:749`); kinds like `panda_call_unextractable`, no published code table
_Notes:_ the catalog calls our refusals "located" in a dozen places; today they are file-located. Parity needs the span; the code table is our upgrade. Spans already reach `push_want` (`walk.rs:42-59`); `warn` must take the same `Span` (§7.4).

**SPEC-V2-78 — unary on const-resolved operands (sign preservation) — TO-BUILD · Ph1 (SOUNDNESS)** · rides `ATM-SITE-38` / `ATM-SITE-30` · ex-18/19 const arm
_Language:_ `-space`, `+n`, `-theme.gap`, `!flag` over const-resolved numeric/boolean leaves fold with the operator applied to EVERY leaf; `-x` over a non-numeric leaf refuses.
_Ours:_ `const space = 4; css({ marginTop: -space })` → `mt_-4`. Today `handle_unary` falls through to `walk_expression(argument)` and pushes `4` — the sign is silently dropped (`walk.rs:334`).
_Panda:_ folds unary over resolved identifiers (`literal-evaluator.md:51`, `:57-59`)
_Notes:_ the same fallthrough as SPEC-V2-09's `!true`; listed separately because this one paints WRONG on ordinary code (`-space` is how negative margins are written). One fix in the fold table's unary node covers 08/09/78.

**SPEC-V2-79 — numeric-string canonicalization — TO-BUILD · Ph3** · `ATM-UNIT-02` extension · `atomic.rs:239-261` (was §3A "approved divergence")
_Language:_ a string that `Number()` parses to a finite value (`'1e3'`, `'.5'`, `'01'`) canonicalizes to the numeric atom (`1000`, `0.5`, `1`) and dedupes with the bare number; a NaN-producing string (`'foo'`, `'0x'`) refuses with a diagnostic; canonical spellings are unchanged.
_Ours:_ `css({ padding: '1e3' })` + `css({ padding: 1000 })` → one `.p_1000` (build); `css({ padding: 'abc' })` → diagnostic
_Panda:_ (`pandacss_stylesheet/tests/atomic.rs:239`, `js_number_string_forms_coerce_and_get_px` → `.p_0\.5`, `.p_1000`)
_Notes:_ UNIT-02's fail-closed instinct was right about NaN and wrong about finite spellings — refusing `'.5'` where v2 emits `0.5px` is a gap. Canonicalization lives beside whitespace collapse (SPEC-V2-14) in `resolve/normalize` (§7.6), so both engines mint one atom for one value.

## 2. THE RE-GRADE LEDGER (former differs and approved absences)

Every item that carried `absence`, `differ`, `OUT`, or `approved
divergence` on the language axis, with where it went. Nothing on this
list keeps a signature as its only reason.

| Former item (old status) | Old reason | New status | Equivalent-or-better mechanism | Entry |
|---|---|---|---|---|
| Element access `a['b']`, `arr[i]` (differ #1) | uniform refusal beats partial folding | TO-BUILD Ph3 | fold a foldable index through the table; diagnose the residue | 63 |
| Computed style keys `[k]` (differ #1 / O4) | same | HAVE static / TO-BUILD folded | static already resolves (pin); const/concat keys fold; siblings kept where v2 drops the call | 64 |
| Whole-object `css(styles)` (differ #3; SITE "silent 0/0/0/0") | outside the want/plan model | TO-BUILD Ph1 + Ph3 | identifier arg = implicit spread (`unpack_local_const_object` already lowers it); Ph1 ends the silence | 65 |
| Literal-test ternary picks one (differ #2, D11 literal half) | second semantics | TO-BUILD Ph3 | dead-arm fold + info diagnostic; open tests unchanged | 66 |
| Interpolated templates (O8) | refuse dynamic | TO-BUILD Ph3 | fold when every part folds; diagnose the part that does not | 67 |
| 39 nesting shapes "zero authorship" | nobody writes it | 2 × TO-BUILD Ph1, 4 × pin Ph2 | grammar-aware `&` (comma scoping, `:is()` armour); textual cases pinned | 68–73 |
| JSX tag / `undefined` shadowed by a param | absurd code | pin Ph2 | already fail-closed; make the accident a decision | 74 |
| Merge-not-resolve; `oxc_resolver`/paths (C1/C2); cycle guard (C6) | no resolver exists | TO-BUILD Ph1 (scope) + Ph4 (binding) | scope chain + import-binding walk; collision control | 75, 76 |
| Re-export chains as mechanism (X1) | probe-then-absence | probe Ph2 → build Ph4 | binding walk follows `export … from` | 56, 76 |
| `importMap` | out of dialect | replaced (SUPERIOR) | identity follows re-exports by binding, zero config | 76 rider |
| Default / namespace VALUE imports | v2 refuses too | SUPERIOR rider (optional) | binding walk can resolve `t.brand` and `export default {…}` | 76 rider |
| `'1e3'` → px coercion | approved divergence | TO-BUILD Ph3 | finite numeric strings canonicalize; NaN refuses | 79 |
| Tagged `` css`…` `` non-site: "no wants, no diagnostic" | object form is the API | keep non-site, ADD diagnostic Ph1 | no-silence sweep | 38, 65 |
| Array spreads: "we refuse instead (stricter)" | deliberate | TO-BUILD Ph1 + Ph3 | flatten literal (parity); refuse dynamic with diagnostic (superior) | 28 |
| `token()` → hex | approved absence | EQUIVALENT (better) | `var(--…)` stays theme-live; accept the call surface | 61 |
| Enums / param type literals / factory consts / pure helpers / imported helpers "pending HQ ruling" | dialect queue | TO-BUILD (fence = v2's, verbatim) | fold table + fences; tripwires in 42 | 39, 45, 46, 57, 62 |
| Refuse-only unary (`!true` → refuse) | soundness patch | fold-or-refuse | `! ~ - +` fold on literal/const operands; sign never dropped | 08, 09, 78 |
| Diagnostics "located" | claimed | TO-BUILD Ph1 | `line:col` + codes on every extract diagnostic | 77 |
| `viewTransition()`-as-value | v2 refuses too | refuse WITH diagnostic | the frame's one admissible refusal | 62 |

## 3. THE SUPERIORITY LEDGER

Where we do more than v2 on the extraction axis, with both sides cited.
Each row needs our station to pin it before it may be quoted; rows marked
*on landing* become true when the named build ships. This is the "better
than Panda v2" half of the claim, kept beside the parity rows so neither
half is asserted without a pin.

| # | Shape | Panda v2 | Reference | Entry / pin |
|---|---|---|---|---|
| S1 | `css(cond ? a : b)` | drops the call (`calls.rs:556`, `calls: []`) | extracts both arms | 27 · `ATM-SITE-05` |
| S2 | `dyn && 'red'`, `'red' && dyn` | resolves the right operand, silent on the dropped left | resolves the static operand, diagnoses the dynamic one | 18 · `ATM-SITE-05`, `NEO-SITE-08` |
| S3 | open ternary with one unfoldable arm | drops the whole conditional (`literal-evaluator.md:75-76`) | keeps the resolvable arm, diagnoses the other | 17 · promote at station |
| S4 | unfoldable computed key | drops the WHOLE call (`computed_keys_skip_extraction`) | drops the member, keeps siblings, diagnoses | 41, 64 · `ATM-SITE-49` |
| S5 | unresolvable array spread | drops the whole array, silently (`literal-evaluator.md:47-48`) | refuses the spread with a located diagnostic, keeps arity honest | 28 · `ATM-SITE-37` |
| S6 | unresolvable import / missing export | drops silently (`cross_file.rs:465`, `:488`) | located diagnostic | 54 · `NEO-SITE-06` |
| S7 | positional unresolvable `css()` arg | silent `None` slot (`calls.rs:1719`) | positional diagnostic, siblings kept | 65 · *on landing* |
| S8 | literal-test ternary dead arm | picks one, says nothing | picks one, `info` names the dead arm | 66 · *on landing* |
| S9 | unfoldable template part | staged drop, silent | diagnostic naming the `${…}` part | 67 · *on landing* |
| S10 | mutated `let` then extraction | drops the identifier silently (`literal-evaluator.md:79`) | diagnostic naming the mutation site | 35 · *on landing* |
| S11 | `token('colors.red')` | parse-time hex, frozen under theme switch | `var(--colors-red)` — correct after a theme change | 61 · `ATM-SITE-45` |
| S12 | site identity through a consumer re-export | requires `importMap` config | follows the binding, zero config | 76 rider · `ATM-SITE-55` |
| S13 | namespace / default VALUE imports | refuses (`cross-file-resolution.md:95-96`) | binding walk can resolve them (optional rider) | 76 rider |
| S14 | JSX tag that is a param | (no JSX shadow test in v2; v1 corpus) | fail-closed, one diagnostic | 74 · `ATM-SITE-52` |
| S15 | `!`, `-`, `~`, `+` on a NON-numeric leaf | folds via JS coercion rules | refuses with a diagnostic (no `NaN` atoms) | 09 · `ATM-SITE-38` |
| S16 | diagnostics | byte spans, kinds, no code table | `file:line:col` + stable codes | 77 · `ATM-DIAG-05` |
| S17 | `&`-less comma member under nesting | scopes to parent (parity) | scopes to parent AND stays one atom per condition (v2 emits one rule per selector) | 68 · `ATM-COND-23` |
| S18 | JSX StyleProps as extraction sites (`<Box mt="2r">`) | JSX extraction behind `jsx` config name arrays / PascalCase guessing | hosts come from styletrace, import-bound; `r`-props resolve to `--r` rhythm atoms | existing `ATM-SITE-01..04` |
| S19 | responsive arrays inside merge lists, `false` / `null` holes | (fold table) | holes skip without diagnostic, arity honest | `ATM-MERGE-03`, 27 |

Rows S18–S19 are pre-existing architecture, listed so the ledger is the
one place the claim is enumerated. Anything added here later needs the
same two citations.

## 4. OUT-OF-AXIS (separate slices, not gaps)

These are not extraction language. Each is named with our equivalent (or
the mission that owns it) so "absence" never reappears as the reason.

| v2 surface | Axis | Our equivalent / owner |
|---|---|---|
| `styled.div`, `cva`/`sva` slots, patterns as factories, `.raw()` (incl. 3 scope + 6 calls + 3 xfile `css_raw` tests) | author API surface | `recipe()` + `css()` / `css.object()`; recipes have their own crate rows (`ATM-RECIPE-*`) |
| `firstThatWorks()` (72+34 tests) | value-form feature | [first-that-works.md](first-that-works.md) — changes what a value *means*, not what folds |
| Tagged-template `` css`…` `` / `` styled.div`…` `` as authoring | API surface | object form is the API; the tagged form on a live binding is a diagnosed non-site (65) |
| `defineKeyframes` / `defineGlobalStyles` / `viewTransition` / `positionTry` codegen | product codegen | config route `ATM-LAYER-10/14`; the const-NAME language is 62 |
| `importMap` (13 tests) | config | superseded by binding-carried identity (76 rider) |
| Vue / Svelte / Astro scan (29/20/12 tests) | framework adapters | React/JSX only by charter; styletrace is the host oracle |
| Compiled JSX runtimes (`dist/` scanning) | input format | worlds are source TSX; reopen only if someone scans `dist/` |
| `matchTag` PascalCase / `jsx` name arrays | host guessing | import-bound hosts (`bindings.rs`) — strictly better precision |
| JSX tag through a file-local alias (`const Marker = Div; <Marker mt>`) | extractor binding (StyleTrace handoff, gap #3) | resolve the tag through its binding — no host name involved (v2 resolves identifiers through scope, `scope.rs`); witness `matrix/primitives` (`jsxElements: ['PrimitiveJsxMarker']` retires when this lands). SPEC-V2 ID to be minted by the cataloger; promote to §1 (it changes which shapes extract). |
| Source transform (`extract_for_transform`, ~400 `pandacss_project` tests, all 13 `local_bindings.rs`, ex-D13) | bundler output | Neo runtime lookup (`runtime/`); no rewrite by charter |
| LightningCSS, `split_css`, `@layer` specificity polyfill (26 tests) | CSS post-processing | six-layer sheet (`stylesheet/layers`); no polyfill |
| Export cache / source hashes / provenance / sessions / read-once (xf-C3/C4, 11 tests); watch-hash inversion / `affectedFiles` (xf-C5); memory-fs / `Send+Sync` (xf-C7) | tooling / harness | single-shot compile today; dependent invalidation becomes a Neo sync rider once 76 lands (the resolver knows the edges) |
| v2-internal diagnostic gating (`calls.rs:607`) | product detail | none needed |
| Hooks / plugin callbacks | extensibility | none; not on this axis |
| `colorPalette` virtual tokens | token feature | separate token mission if ever |
| `prefix` / `hash` / `separator` / layer renaming | naming config | `class_name_with_system` prefix; hashing refused (readable classes are a feature) |

A row may move from §4 into §1 only by showing it changes which static
shapes extract. `firstThatWorks` is the standing example of one that does
not.

## 5. THE PLAN (six phases, each with an exit test)

Order is by risk to the claim, not by size. Ph0 re-proves every HAVE
against v2's tests so no claimed parity hides a gap. Ph1 is wrong paint
and silence — the things that make "better" false today regardless of
what else lands. Ph2 is cheap and locks the engine's existing behaviour
before Ph3 replaces the walker underneath it. Ph3 is the fold table. Ph4
is the resolver. Ph5 is the claim itself.

Filing rule (unchanged): work is read-only until a row exists on an
Atomic or Neo ledger. One agent, one slice; phases parallelize once rows
are filed. `ATM-SITE-30` before `ATM-SITE-38` (pin before narrow);
`ATM-SITE-53` (scope) before any Ph3 fold.

Oracle rule (HQ): every stage and phase ships with oracles — one verifies
outcomes against the phase exit test, one keeps the architecture clean
(no seam drift, no scope creep, ledger discipline). No phase exits on
builder word alone.

### Ph0 — HAVE reconfirmation (cartographers, HQ order)

Every `HAVE` in §1 is **traced and reconfirmed against Panda v2,
parallel to the gap phases**. Rationale: v2 has tests around our HAVE
areas, and comparing
pin-for-pin may surface gaps *inside* claimed parity — a HAVE with a gap
becomes a new TO-BUILD row, not a mid-phase surprise.

Method, one probe per HAVE (cartographers, parallel by family):

1. Trace our pin: open the cited case/station bodies, state exactly what
   behavior is proven (inputs, asserts, paint).
2. Find v2's tests around the same behavior (`vendor/panda` extractor +
   stylesheet suites) — not just the catalog's cited file:line, the
   neighborhood.
3. Compare pin-for-pin: same shapes in, same classes/diagnostics out?
4. Verdict per HAVE: `SETTLED`, or `GAP` with the missing shape specified
   (joins the phase queues as TO-BUILD).

Rules: read-only probes (no engine edits); evidence is opened bodies, not
grep counts; a probe that cannot find v2's neighborhood reports
`UNRESOLVED`, never a pass.

**Exit:** every HAVE verdicts SETTLED or carries its GAP row.
Non-blocking: Ph0 runs parallel to the gap phases from the start; GAP
rows join the queues as they land.

### Ph1 — Soundness: nothing paints wrong, nothing is silent

| Slice | Entries | Station(s) | What lands |
|---|---|---|---|
| Scope-aware identifiers | 75 | `ATM-SITE-53`, `NEO-SITE-27` | `ScopeTable` + `ScopeChain` (§7.2); `handle_identifier_fallback` resolves through the chain; project name-bag retired behind the import lookup stub |
| Unary sign / fold-or-refuse | 78, 09 (08 rides the same node, pinned in Ph2) | `ATM-SITE-38`, `ATM-SITE-30` | unary node in the fold table; `-space` → `-4`; `!true` → `false`; non-numeric → diagnostic |
| Mutation tracking | 35, 02, 53 | `ATM-SITE-32`, `ATM-SITE-28` | `AssignmentExpression` / update visitor marks bindings mutated; mutated bindings are dynamic with a diagnostic naming the write; unmutated `let`/`var` keep resolving (02, 53) |
| No-silence sweep | 65 (Ph1 half), 06, 07, 38, 28 (Ph1 half) | `ATM-SITE-50`, `ATM-SITE-26`, `ATM-SITE-37`, `NEO-SITE-20`, `NEO-SITE-24` | every `_ => {}` on a site path → located diagnostic; wrapped args (`as const`, `satisfies`, `!`, parens, `<any>`) unwrap; spreads refuse without shifting arity; tagged template on a live binding diagnoses |
| Diagnostic precision | 77 | `ATM-DIAG-05` | `warn` takes a `Span`; `line:col` on every extract diagnostic; code table |
| Nesting paint bugs | 68, 69 | `ATM-COND-23`, `ATM-COND-24`, `NEO-COND-17` | comma-member scoping; `:is()` armour on the utility path |

Twelve entries: 02, 06, 07, 09, 28, 35, 65, 68, 69, 75, 77, 78 (the six
Ph1 rows of the 2026-09-18 catalog plus the six Family Q soundness rows).

**Exit:** a fixture file exercising every Ph1 shape yields zero wants
that the runtime cannot find (no ghosts), zero silent sites (every
zero-want site has a diagnostic with `line:col`), and the two nesting
fixtures print v2's expected selectors byte-for-byte.

### Ph2 — Pins: the engine is right; say so before Ph3 touches it

| Slice | Entries | Station(s) |
|---|---|---|
| HAVE / SUPERIOR rows — cite the green station or file the missing pin | 01, 03, 04, 05, 15, 16, 18, 20, 21 (`NEO-SITE-22` paint pin), 23, 25, 26, 30, 33, 38, 41, 44, 47, 48, 50, 53, 54, 58, 59 (+ I2 string-literal arm), 60 | as filed in the catalog |
| Station-only TO-BUILD — engine right, no station | 08, 13, 17 (+S3 promote), 22, 27, 29, 36, 37, 42, 49, 51, 55 | as filed in the catalog |
| Nesting grammar totality | 70, 71, 72, 73 | `ATM-COND-25..28` |
| Shadow decisions | 74 | `ATM-SITE-52` |
| Static computed keys | 64 (static half) | `ATM-SITE-49` static arm |
| Barrel probe (records merge-era behaviour) | 56 | `ATM-SITE-41` |

**Exit:** every HAVE row in §1 cites a green station; the 2026-09-18
oracle text of entries 01–62 is re-verified against the stations by a
second crew (same `file:line`s, same paint).

### Ph3 — The fold table (one evaluator, every same-file fold)

Lands as one module (`extract/fold/`, §7.1) that BOTH walkers call, so a
fold is added once and the want/plan parity of SPEC-V2-21 is structural.

| Slice | Entries | Station(s) |
|---|---|---|
| Arithmetic, concat, comparison, `??`, literal-test dead arm | 31 (nested objects), 33, 66 | `ATM-SITE-33`, `ATM-SITE-29`, `NEO-SITE-25` |
| Element access, const arrays, folded computed keys | 63, 64 (folded half), 28 (literal flatten) | `ATM-SITE-48`, `ATM-SITE-49`, `NEO-SITE-23` |
| Templates over foldable parts | 67 | `ATM-SITE-51`, `NEO-SITE-26` |
| Whole-object and member args | 65 (Ph3 half) | `ATM-SITE-50` |
| Destructuring (object/array/rest/defaults), optional chaining | 32, 34 (object half), 44 | `ATM-SITE-42`, `ATM-SITE-28`, `ATM-SITE-31` |
| Pure helpers with v2's fence, and the refuse pins | 39, 42, 40 | `ATM-SITE-31`, `ATM-SITE-49` |
| Enums, param type literals, factory consts | 45, 46, 62 | `ATM-SITE-43`, `ATM-SITE-44`, `ATM-SITE-46` |
| `token()` call surface | 61 | `ATM-SITE-45` |
| Numeric-string canonicalization | 79 | `ATM-UNIT-02` |

**Exit:** the fold table's enumerated forms match `literal-evaluator.md`
§"What folds" line for line, and every "What doesn't fold" line has a
refuse pin (42) — with a diagnostic where v2 is silent. The crate README
tripwire is amended in the same PR as the first fold: "evaluate author JS
to learn a value" → "interpret author JS (control flow, effects, unknown
calls); the enumerated fold table is not evaluation".

### Ph4 — Cross-file by binding

| Slice | Entries | Station(s) |
|---|---|---|
| Specifier resolution (relative, `paths`, probing, `exports`) and the `(path, export)` cache | 76 | `ATM-SITE-54` |
| Alias, barrels, cycles, missing export | 52, 56, 54 | `ATM-SITE-40`, `ATM-SITE-41` |
| Imported pure helpers (descriptor export) | 57 | `ATM-SITE-31` cross-file arm |
| Identity through re-exports (replaces `importMap`) | 76 rider | `ATM-SITE-55`, `NEO-SITE-28` |
| Namespace / default value imports (optional SUPERIOR rider) | 76 rider | same |

**Exit:** two files declaring the same const name with different values
never cross; the `cross_file.rs` shapes R1–R9, X1, F1 all resolve or
diagnose per the catalog; the Neo sync rider for dependent invalidation
is filed (not necessarily built).

### Ph5 — The statement

Not a build phase. A single evidence file
(`packages/reference-neo/docs/evidence/overmatch-ledger.md`) that lists
every §1 entry with its green station, every §3 row with both citations,
and the Panda test IDs placed (§6). The claim at the top of this mission
is quoted only from that file. If a row cannot be pinned, the row's
status is downgraded there first, and this mission is amended second.

## 6. COVERAGE CLAIM (closing arithmetic)

Every corpus row lands in exactly one of catalog / out-of-axis. Counts
re-verified 2026-09-18 via `grep -c '#[test]'` and per-test
`grep -n '^fn '`; three corpus-count discrepancies were found and
reconciled — nothing forced.

**Extractor: 223 tests = 80 + 79 + 30 + 17 + 13 + 4** (`scope` + `calls` +
`conditional_output` + `polish` + `local_bindings` + `optional_chaining`)
= verdicts 75 HAVE / 80 MISSING / 68 ABSENCE (conserved) = **81 shape rows
(68 §3 + 13 §4) placed as 80 catalog + 1 out-of-axis**: the 72 rows the
2026-09-18 catalog already placed (ex-1–7, ex-10–13, ex-15–25, ex-27–30,
ex-32–41, ex-43–55, ex-57–68 — split across two entries each, same
catalog: ex-1, ex-46, ex-60, ex-64, ex-D2, ex-D8 — + ex-D1–D10, ex-D12) +
the five former differ rows (ex-8 → 63, ex-9 → 64, ex-31 → 66, ex-42 →
66, ex-56 → 63) + three of the four former out rows (ex-14 → 74, ex-26 →
67, ex-D11 → 74) = 80; the fourth, ex-D13 (source transform), is
out-of-axis (§4). 72 + 5 + 3 + 1 = 81 ✓. The non-row App. A verdicts
(whole-object → 65; `css.raw` / `cva`-family / v2-gating → §4) were never
in the 81 and are placed by name.

**Polish/enum rows are INSIDE the 223, not additive** (`polish.rs`, 17
tests): ex-57/58 → 45/46, ex-59 → 41, destructure defaults → 32,
`undefined` → 03, factories → §4, ex-D11 → 74. ✓

**Nesting: 61 tests = 21 HAVE + 1 MISSING + 39 re-graded** (RECOUNT —
corpus claims 20/1/40; the §3.14 pseudo-element group holds 4 HAVE tests
`:433`, `:455`, `:466`, `:477`, not 3): 21 → 47 (17) + 48 (4); 1 (`:389`)
→ 49; 39 → Family Q: 68 (3: `:642`, `:653`, `:664`), 69 (2: `:675`,
`:686`), 70 (8), 71 (7), 72 (12), 73 (7) = 39 ✓. **Atomic skim 16** = 15
table rows (13 HAVE → 04/15/18/21/27/29/38, 1 → 79, 3 pointers → 22/29) +
1 §3.7 cousin (`configured_condition_…` → 47). **Encode 5** → IR reference
inside 15, no separate row. ✓

**Cross-file: 90 tests (51 + 18 + 21) → 27 shapes** (RECOUNT — corpus
claims 23; C1–C7 is 7 verdicts not 1, and HAVE double-counts R8's
diagnostic upgrade): **20 catalog** (R1/R2 → 50, R3/R4 → 34, R5 → 51,
R6 → 52, R7 → 53, R8 → 54, R9 → 55, X1 → 56, F1 → 57, F2 → 58, I1 → 59,
I2 string-literal import names → 59 HAVE-unpinned (`bindings.rs:131`
already matches `StringLiteral`), I5 → 60, K1-fold → 62, C1/C2/C6 → 76,
I4 re-export scanning → 76 rider, TOKEN-hex → 61 EQUIVALENT,
K1-viewTransition → 62 refuse-with-diagnostic) + **7 out-of-axis**
(C3/C4/C5/C7 tooling, I3 side-effect imports — no binding, nothing to
gate — I6 JS-parity anchors, default/namespace imports as *v2's* refusal —
ours is the optional 76 rider). 20 + 7 = 27 ✓.

**Grand total: 223 + 61 + 90 = 374 source tests placed** (+ 21 reference:
16 skim + 5 encode = 395 consulted; + 4 design-notes + `RUST_GUIDE.md` as
background). **Spec count: 79 entries** — 62 from the 2026-09-18 catalog
(25 HAVE / 37 TO-BUILD then) + 17 Family Q. After re-grade, by header
status: **28 HAVE** (6 unpinned: 53, 70, 71, 72, 73, 74), **2 SUPERIOR**
(18, 54; 17 is a candidate pending its station, S3), **48 TO-BUILD**, and
**1 split** (64: HAVE static / TO-BUILD folded) = 79. `EQUIVALENT` is
carried as a sub-verdict inside 61 (the hex fold) and 74 (the `undefined`
half); no whole entry carries it. TO-BUILD by first phase, 64 counted at
Ph3: **Ph1 12** (02, 06, 07, 09, 28, 35, 65, 68, 69, 75, 77, 78) ·
**Ph2 13** (08, 13, 17, 22, 27, 29, 36, 37, 42, 49, 51, 55 + 56 probe) ·
**Ph3 21** (10, 11, 12, 14, 19, 24, 31, 32, 34, 39, 40, 43, 45, 46, 61,
62, 63, 64, 66, 67, 79) · **Ph4 3** (52, 57, 76) = 49 = 48 + the split.
Second halves: 28 and 65 recur in Ph3, 56 in Ph4. Ph2 also pins the 6
unpinned HAVE rows and 64's static half. **Zero absences. Zero differs.
Zero blocked.** Ordering constraints exist (40 after 39+64; 57 after
39+76) but nothing waits on a ruling.

— End of catalog. Evidence stays in the three corpus notes under
`packages/reference-neo/docs/evidence/panda-v2-*.md`; this file is the
mission, the consolidated language-spec list, and the plan.

## 7. ARCHITECTURE (how `atomic` grows to carry this)

The crate is extract → Want → resolve → Atom → stylesheet / runtime, and
its files already sit at the 365-line soft limit (`extract/mod.rs` 364,
`object.rs` 374, `walk.rs` 335). Bolting Ph3 folds onto `walk.rs` and
mirroring each into `ast_value.rs` would double the work and breach the
gate on the first PR. The proposals below add sub-modules inside the
classes that already exist; none of them adds a new top-level class. Each
names the files, the type that carries pass state, and the seam it
replaces. All subject to the `reference-rs` quality gate (files < 365,
functions ≤ 80 lines, ≤ 4 args, no clippy allows).

### 7.1 `extract/fold/` — one evaluator, two consumers

The fold table replaces the two parallel walkers' leaf logic. `walk.rs`
produces `Want`s and `ast_value.rs` produces authored JSON plans; today
every leaf shape is implemented twice (`handle_unary` / `convert_unary`,
`walk_conditional` / `convert_branching`, …) and SPEC-V2-21's want/plan
parity is a test, not a structure. After 7.1 both call `fold()` and
lower its result.

```
extract/fold/
  mod.rs        pub fn fold(expr, &FoldCtx) -> Folded        dispatcher; enumerated forms only
  value.rs      enum Folded { Leaf(AtomValue), Leaves(Vec<AtomValue>),   // multi-leaf (open ternary)
                              Object(FoldedObject), Array(Vec<Folded>),
                              Omit /* undefined/null */, Dynamic(Residue) }
                struct Residue { span, reason: DynamicReason, sub: Option<Box<Residue>> }
  ctx.rs        struct FoldCtx<'a> { scope: &ScopeChain, imports: &dyn ImportLookup,
                                     fence: &Fence, limits: FoldLimits }
  literal.rs    string / number / bool / template quasis / `!important` suffix split
  unary.rs      ! ~ - + void  (typeof/delete → Dynamic)                       [08, 09, 78]
  binary.rs     + - * / % ** on numbers; + concat; comparisons; ??           [33]
  logical.rs    && || with the guard rule; multi-leaf on open operands        [18, 19, 20]
  conditional.rs literal test → live arm + DeadArm info; open → Leaves       [15, 16, 17, 66]
  member.rs     static member, element access with folded index, optional    [30, 63, 34]
  template.rs   quasis + folded parts → string; fan-out under FoldLimits     [67]
  array.rs      elements, literal/const spreads flatten, dynamic spread → Dynamic  [28]
  object.rs     entries, computed keys through fold(), spreads of folded objects   [31, 64, 65]
  call.rs       fenced pure-helper application (7.3), token() surface        [39, 61]
  fence.rs      Fence + PureFn descriptor lowering; every refuse in 42       [39, 42, 57]
```

`Folded` carries the span of what produced it so the two lowerings can
stamp `Want`s and `AuthoredDeclaration`s with the same positions. `walk.rs`
shrinks to "fold, then push wants per leaf under the current `when`";
`ast_value.rs` shrinks to "fold, then serialize". `FoldLimits` caps the
multi-leaf fan-out (template × ternary combinations) and the recursion
depth; exceeding a cap is `Dynamic(Residue { reason: LimitExceeded })`,
never a partial result.

The tripwire line: `fold()` is total over an enumerated match. There is
no `eval`, no environment mutation, no loop construct, no unknown call.
Adding a form means adding a file here and a refuse pin in 42 for the
neighbouring form that still does not fold.

### 7.2 `extract/scope/` — bindings by scope, not by name

Replaces `constants/collect.rs` + `constants/index.rs` (a name → leaves
bag) with a scope-aware binding table. Fixes SPEC-V2-75 and gives 35 its
mutation flag.

```
extract/scope/
  mod.rs        pub struct ScopeChain; pub fn collect(program) -> ScopeTable
  table.rs      ScopeTable { scopes: Vec<Scope>, bindings: Vec<Binding> }
                Scope { parent: Option<ScopeId>, names: BTreeMap<String, BindingId> }
  binding.rs    Binding { name, kind: Const|Let|Var|Param|Import(ImportRef)|Function(PureFnId)|Enum,
                          init: Option<FoldedInit>, mutated: Option<Span>, span }
  collect.rs    declarators (every kind), params, function decls, enums, imports → bindings
  mutate.rs     AssignmentExpression / UpdateExpression / for-in-of heads → mutated = Some(span)   [35]
  lookup.rs     ScopeChain::resolve(name, at: ScopeId) -> Lookup { Local(&Binding) | Import(ImportRef) | Unbound }
```

`ExtractVisitor::enter_scope/leave_scope` already maintain a shadow stack
(`extract/mod.rs`); the chain replaces the stack and `allows_jsx_tag`
reads it too. A `Let`/`Var` with `mutated: Some(span)` folds as
`Dynamic(Residue { reason: Mutated(span) })` — the diagnostic names the
write, which v2 does not do (S10). The project-wide
`collect_project_constants` merge in `lib.rs` is deleted; cross-file
values come only through `Import(ImportRef)` (7.3).

### 7.3 `extract/resolver/` — import bindings to declared exports

The Ph4 module. Read-only, cached, cycle-guarded; follows v2's
`cross-file-resolution.md` shape because it is the correct one.

```
extract/resolver/
  mod.rs        pub trait ImportLookup { fn resolve(&self, r: &ImportRef) -> Resolved }
  specifier.rs  './x' | '@/x' | 'pkg/sub' → PathBuf  (relative, tsconfig paths/baseUrl, probing, package exports)
  exports.rs    per-file ExportTable { name → ExportEntry }; ExportEntry = Value(FoldedInit) | PureFn(descriptor)
                | ReExport { from, name } | Namespace(path) | Default(FoldedInit)
  walk.rs       follow ReExport hops with a visited set; missing export / cycle → Resolved::Diagnostic
  cache.rs      BTreeMap<(PathBuf, String), Resolved> + per-file ExportTable cache; source hash for the sync rider
  identity.rs   css/recipe/jsx identity through re-exports (bindings.rs consults this)   [76 rider, S12]
```

`bindings.rs` keeps its four identity rules and gains one: a binding
whose resolved origin is a Reference export is a live site even when the
specifier is a consumer's wrapper module. The SITE set stays the `include`
globs; the value graph follows imports wherever they lead — the same split
v2 makes.

### 7.4 `diagnostics/` — codes and spans

Small, but Ph1. `Diagnostic` gains `code: DiagnosticCode` (an enum with a
stable `ATM-W-…` / `ATM-E-…` / `ATM-I-…` string); `ExpressionWalk::warn`
and `ObjectWalk::warn` take a `Span` and go through `line_col`, which
already exists. `DynamicReason` (7.1) maps 1:1 onto warning codes, so the
fold table cannot produce a residue without a code.

```
diagnostics/
  mod.rs        Diagnostic { severity, code, message, file, line, column }
  codes.rs      enum DiagnosticCode { DynamicMember, DynamicIdentifier, MutatedBinding, UnfoldableSpread,
                                      UnfoldableKey, NonObjectArg, DeadBranch, UnresolvedImport, MissingExport,
                                      ImportCycle, FenceRefused(FenceReason), LimitExceeded, NumericString, … }
  render.rs     `{file}:{line}:{col} {code} {message}` — one format for CLI, Neo, and tests
```

### 7.5 `resolve/conditions/nesting/` — a selector grammar, not a string walk

`pseudoselectors::apply` substitutes `&` character-wise and is right for
every one-level case. The two Ph1 paint bugs (68, 69) and the totality
pins (70–73) need the selector split into members and the current
selector's shape known. `apply_distributed` already has half of this for
the global walker; the utility path gets the same.

```
resolve/conditions/nesting/
  mod.rs        pub fn nest(parent: &Selector, template: &str) -> Selector
  list.rs       split_selector_list (moved from pseudoselectors; paren/bracket/quote aware)
  member.rs     SelectorMember { text, has_parent_ref, top_level_combinator: bool }
                bare member → `& {member}` (68); member_needs_is_wrap (69)
  subst.rs      substitute(member, parent_text) — the existing quote-aware char walk, unchanged
  canon.rs      canonical template for the class segment so `&:hover` and `& :hover` never collide,
                and `'&'` alone is the identity condition (72)
```

`Selector` carries `is_complex: bool` (produced by nesting with a
combinator) so the second level knows to armour with `:is()`.
`name/mod.rs::selector_with_system` calls `nest` per stacked `When`
instead of `apply`. `pseudoselectors/` keeps the `_hover`-style catalog
and delegates the `&` work here.

### 7.6 `resolve/normalize/` — value canonicalization

SPEC-V2-14 (whitespace collapse) and SPEC-V2-79 (numeric strings) are the
same idea: one atom per value. Today `sanitize_class_value` works on the
class stem only, and the CSS value passes through as written.

```
resolve/normalize/
  mod.rs        pub fn normalize(value: AtomValue, prop: &str) -> AtomValue
  whitespace.rs collapse runs, trim; preserve inside quotes and url()              [14]
  numeric.rs    finite Number(string) → AtomValue::Number; NaN-producing → Dynamic  [79]
```

Runs once, before tokens and units, so the stylesheet dedupes `'  red '`
with `'red'` and `'1e3'` with `1000` and the runtime's lookup key agrees.

### 7.7 What does not change

No new top-level class. `atom/`, `stylesheet/`, `runtime/`, `recipes/`,
`hosts.rs`, `includes/` are untouched by this mission except for the
`Span` plumbing in 7.4. The six-layer sheet, cascade sort, class naming,
and `(prop, value, when)` identity are the parts that are already better
than v2's (S17–S19); the work above feeds them more atoms and fewer
ghosts, and changes nothing about how they print.

### 7.8 Sequencing against the gate

Each module lands behind its phase and inside the quality gate: 7.4 and
7.2 first (Ph1, small files, no behaviour change beyond diagnostics and
shadowing), 7.5 with the two paint fixes (Ph1), 7.1 as the Ph3 opener
with `walk.rs` and `ast_value.rs` cut over in the same PR so the parity
test becomes structural, 7.6 alongside 79, 7.3 as the Ph4 opener. Every
module gets its own `README.md` describing the architecture (not a file
table) and a 2–6 sentence header per file, per the crate rules.
