# Mission: Panda v2 language / extraction parity

Status: `idea` (probe, HQ 2026-09-18). Not a campaign. Not a port.

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
things.

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
| `token_calls.rs` | 21 | `token()` / `token.var()` fold — we use `{path}` refs, not parse-time hex |
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

## Probe findings (language, 2026-09-18)

### Fold table (v2 named it; v1 left it to `ts-evaluator`)

From `literal-evaluator.md` + `scope.rs`. This is the extraction language.

**Folds:** string/number/bool/null; object (lenient: skip unresolvable members, keep static siblings); array (holes → `null` slots); `as` / `satisfies` / `!` / parens; unary `+ - ! ~`; arithmetic/equality; `&&` `||` `??` (foldable left short-circuits; unresolvable left → **right operand**); ternary (foldable test picks; open test → `Conditional` both arms); templates including tagged (tag ignored); unmutated `const`/`let`/`var`; member + computed member; destructure (rename, default, rest); `a?.b` unwrap; `css.raw` / pattern raw; **simple pure helpers** (single-expression body, no impurity); TS enum members with initializers; function-param `{ color: 'red' }` type literals.

**Drops (each has a v2 test):** free identifiers; mutated `let`; params without type-literal; half-foldable ternary; `Math.random`; loops; `.map`/`.reduce`; async/generator; rest/destructured params; optional call `fn?.()`; cyclic consts; `Object.entries` factories; bare function values (`css({ color: getColor })` without a call).

Reference today is stricter in places we already chose: element access `map['k']` and computed keys **refuse with a diagnostic** (SITE SPEC absences). v2 folds those. Do not "fix" toward v2 without a decision.

**Conditional merge (v2 is more precise than v1):** open ternary → both arms; colliding ternary-spread keys **union all values**, order-independent; nested ternary; array-mid-slot ternary; member hop through a conditional. SITE-01/08/15 cover the main ternary/`&&` paths. The union-on-collide and mid-array slots are the unmatched residue.

**Cross-file (the real v1 gap):** v2 has 51 tests with a memory fs and `oxc_resolver`. v1's "imported css.raw" is same-file simulation (`css-raw-edge-cases.test.ts` L1151). We have NEO-SITE-07 / ATM-SITE-16 for a `const` from `styles.ts`. Unmatched: re-export chains, tsconfig path aliases, imported *pure helpers*, cycle drop, file-not-found staying silent.

**Pure helpers:** v1 folded them incidentally. v2 lowered a closed `pure_fn` descriptor and tests the refuse list. We do not have a named station for "this local function folds / this one must not." Highest-value new language if we want it — and the easiest place to accidentally become a JS interpreter. Fail closed; list the allowed shapes.

### Nested selector language (atomic, not scan)

v1 sampled `& > p`, `&:hover`, `& + span`, one `& ~ &`. v2's 61 snapshots are the missing combinator dictionary. Lib sheet already uses `:is(` and `:where(`. Next agent: grep lib + Neo COND/CSS cases for `& + &`, `& ~ &`, `:has(`, `&&&`, then only write cases for shapes authors actually write (or that the engine already emits).

### New Panda language we probably do not want

| Feature | v2 tests | Default |
|---|---|---|
| `firstThatWorks(a, b)` | 72+34 | **Decide.** Ordered fallback declarations. Useful CSS; not in lib today. Absence until HQ says in. |
| `viewTransition()` / `positionTry()` factories | stylesheet + extractor | Out. |
| Source transform (rewrite `css()` to class strings) | ~400 under `crates/pandacss_project/tests/transform/` | Out. We compile a sheet; we do not rewrite source. |
| Cascade-layer polyfill | 26 | Out. |
| Astro scan | 12 | Out (with Vue/Svelte). |

Compiled JSX helpers: v1 is *richer* (per bundler × framework). SITE already absents compiled runtimes — worlds are source TSX. Do not reopen unless someone starts scanning `dist/`.

## Match-down against what we already have

Do not open a Neo case that SITE/ATM-SITE already proves. Current coverage that **already is** this language:

| Shape | Ours |
|---|---|
| Open ternary, both arms | NEO-SITE-01, ATM-SITE-05/17; JSX object ternary NEO-SITE-15 |
| Local const member | NEO-SITE-02, ATM-SITE-06 |
| Identifier spread | NEO-SITE-03, ATM-SITE-11 |
| Import alias / namespace | NEO-SITE-04, ATM-SITE-15 |
| Local function named `css` is not a site | NEO-SITE-05, ATM-SITE-10 |
| Dynamic `pick()` — warn, no ghost | NEO-SITE-06 |
| Cross-file const | NEO-SITE-07, ATM-SITE-16 |
| `...(ok && extra)` with const `ok` | NEO-SITE-08 |
| Whole-object `css(styles)` | **Approved absence** (SITE SPEC) |
| Element access / computed keys | **Approved refusal** |
| Tagged templates / Vue / compiled runtime / `css.raw` / `importMap` | Absences |

Residue to probe next (v2-only or v2-sharper, still in dialect):

1. **Pure-helper fold/drop table** — local `const color = (x) => x` used as `css({ color: color('red') })` vs `Math.random` / loops. No station. Start as Atomic extract tests, not Neo.
2. **Conditional-spread key collision** — `css({ color: 'a', ...(cond ? { color: 'b' } : { color: 'c' }) })` unions all three. Confirm engine today; case or absence.
3. **Array `css()` args as merge list** — `css([{ color: 'a' }, { mt: '2r' }])` vs responsive `color: ['a', 'b']`. ATM-SITE-19 covers JSX `css={[…]}`. Call-site array merge may still be thin.
4. **Re-export / alias-chain cross-file** — beyond SITE-07's single `styles.ts`.
5. **Optional chaining** on a *known* object (`tokens?.color`) vs free `maybe?.foo` drop. Four v2 tests; we may already drop both.
6. **TS enum / param type-literal / destructure default** (`polish.rs`) — only if lib or Book actually writes them. Don't invent dialect.
7. **Nested combinators** — only shapes that survive a lib-sheet + Book grep.

## Further agents (how to continue)

Work is read-only until a row exists on an Atomic or Neo ledger. One agent, one slice.

1. **Fold-table agent.** Walk `literal-evaluator.md` + `scope.rs` test names. For each fold/drop, `pnpm agentneo search` and `rg` ATM-SITE. Produce a three-column list: *have* / *in dialect, missing* / *absence*. Do not implement. File the missing as proposed ATM-SITE-2x / NEO-SITE-1x rows in a follow-up evidence note (`packages/reference-neo/docs/evidence/panda-v2-extractor-corpus.md`) in the same shape as the v1 parser corpus — inputs, expected, family tag, out-of-scope table.
2. **Combinator agent.** Same treatment for `nested_selector_parity.rs` against lib `styles.css` and COND/CSS Neo cases. Drop anything the lib never emits.
3. **Dialect agent (HQ).** `firstThatWorks` in or out. Pure helpers: which shapes are legal (likely: single-expression, no control flow, no `this`). Cross-file: re-exports yes/no. Write the decisions into SITE SPEC + Atomic SPEC, not into code.
4. **Do not** start with transform/, polyfill, viewTransition, Astro, or the 188 v1 extract.test.ts replay.

Composes with [test-index](test-index.md) (the fold table *is* the capability vocabulary) and [doom-agent](doom-agent.md) (adversarial cases against the refuse list, not the fold list).

## Captain's notes (not planned, just recorded)

- v2's extractor is the interesting half. Atomic emit in v2 mostly restates v1 plus combinators plus product CSS. Don't let the 501 stylesheet tests drown the 536 extractor tests.
- Their evaluator is fail-closed *and* more optimistic than ours on element access and computed keys. Parity means matching the **language we want**, using their tests as a catalog of shapes, not as an oracle.
- `pure_fn.rs` is the one place they outgrew v1 on purpose. If we take one thing, take the refuse list so Doom can't turn extract into an interpreter.
- Evidence file when the fold-table agent finishes — not this brief. This file stays the mission, not the corpus.
