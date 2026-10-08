# chefs_kiss — finishing the atomic module

Refactor and hardening plan to take `atomic` from "the pipeline works" to
production. Contract: [SPEC.md](./SPEC.md) (130 cases, 90 proven, 40 open).
Workflow: `.agents/skills/agent-rs/SKILL.md`. Quality gate after every
generation: `pnpm agentrs q <path>`.

This is not a rewrite. The module layout is good — the extract / resolve / atom /
stylesheet cut is the right one, files are all under the 500-line hard gate, there
are no `#[allow(clippy::…)]` anywhere, and no `unwrap` on a production path. What
follows is about tying concepts together so that the bugs found on 2026-09-15
become *unrepresentable* rather than merely fixed.

---

## 1. The one thing to understand first

Four defects were found by reading the code, and **all four were blessed by
committed test goldens**:

| Defect | Where |
| :--- | :--- |
| `@container` blocks used to sort lexicographically, so `md` overrode `2xl`. Closed: `CascadeKey` in `stylesheet/cascade.rs`. | `stylesheet/cascade.rs` | `ATM-ORDER-01` (landed) |
| `.2xl\:p_6r` is an invalid selector — CSS identifiers cannot start with a digit | `stylesheet/name/escape.rs:18-30` |
| `<Div border />` used to emit `border: true` (closed: `CssValue` has no Bool) | `atom/value.rs` `CssValue` |
| The namer is not injective; unrecognised `_` conditions used to wrap illegally | `atom/when.rs` (Move 1 landed; LEAF-05 still quarantined) |

They share one root cause, and it is not carelessness. It is that **every one of
these is a semantic property, and the entire test suite is structural.** A station
asserts "a want was extracted", "a class was named", "that string appears in the
sheet". None asserts "a browser would apply this". `ATM-GHOST-01`, our declared
P0, used to be a substring search — and `tests/helpers.ts` reimplemented the
escaper in TypeScript (it lived at lines 149–151, not 127–129), so the harness
and the compiler agreed on an invalid selector and the gauge passed.

So the ordering of this plan is deliberate: **make the suite able to detect
semantic failure, then fix the semantics, then refactor so they cannot recur.**
Fixing the four bugs first would be satisfying and would leave the module exactly
as vulnerable to the fifth.

There is a second, sharper reason to start with the harness. Nine
`diagnostics.json` goldens embed `/Users/ryn/Developer/reference-ui/…`, so the
suite **cannot pass on any machine but one laptop**. And nothing runs it anyway:
the three workflows are `docs.yml`, `security.yml`, and `rust-compile.yml`, and the
last only runs `napi build`. Neither the 82 Cargo tests nor the 73 Vitest stations
execute in CI. Every green run this module has ever had was local, manual, and
unreproducible — which is the real reason four defects sat in goldens.

---

## 2. Sequenced plan

### Stage 0 — make the suite portable and put it in CI

Nothing else is defended until this lands. Small, mechanical, unblocks everything.

1. **Normalise paths in the golden runner.** Make the case root relative before
   comparison (`testing/goldens.ts` already has a `normalizeText` hook that
   `cases.test.ts` does not pass). Rewrite the nine offending goldens.
   Owner: `ATM-FORBID-07`.
2. **Add a CI job** running `pnpm agentrs c atomic && pnpm agentrs v atomic`,
   plus `base_system`. Keep the napi build as a separate artifact job.
3. **Delete `tests/aliases.test.ts`** as a sibling suite — `tests/cases/README.md`
   forbids exactly this — and promote its two real proofs (custom breakpoint
   scales, refused aliases) into stations. They are currently the *only* seam
   coverage of custom breakpoint names, hiding in a file the convention bans.

### Stage 1 — teach the harness to detect meaning

4. **Add a CSS validation gauge.** Designed and measured in
   [testing.md](./testing.md): `css-tree`, two tiers (parse, then declaration
   grammar), `var()` values skipped as spec-correct, 0.73 ms per station. Over the
   73 committed goldens it returns **2 syntax errors and 24 invalid
   declarations** — more than the four defects found by reading. Owner:
   `ATM-VALID-01`, `ATM-VALID-02`.
   Two consequences worth pulling forward: the `n*` palette used by ~15 station
   inputs is **not defined in `lib_fixture()`**, so those stations emit inert CSS;
   and the token-passthrough policy in `ATM-TOKEN-02` / `ATM-SHORT-03` *specifies*
   invalid output (`border: borders.card`), which is a SPEC decision, not a bug fix.
5. **Delete `classSelector` from `tests/helpers.ts`.** *(landed)* Have the ghost
   gauge use selectors the compiler emitted, and tighten it to require the
   selector to be inside `@layer utilities` (the SPEC claim it currently skips).
   Owner: `ATM-FORBID-06`, `ATM-GHOST-01`.
6. **Add idempotence and input-order gauges.** *(landed)* Compile twice, assert
   byte equality; compile with reversed file order, assert byte equality.
   Owner: `ATM-ORDER-05`, `ATM-ORDER-06`. `scan_dir` sorts children; `collect_sources`
   sorts the final list so virtual `files` cannot leak caller order.
7. **Add an injectivity gauge:** *(landed, ATM-LEAF-05 quarantined)* distinct
   atoms count equals distinct class names count, on every station. Owner:
   `ATM-GHOST-04`. `CompileResult.atomCount` is the AtomSet size. Unrecognised
   `_` conditions now fail closed (Move 1, stations `ATM-COND-12` / `ATM-GHOST-04`).
   `ATM-LEAF-05` stays on `INJECTIVITY_QUARANTINE` because `p`/`padding` share a
   prefix; the GHOST-04 SPEC box stays open until that list is empty.

Stages 0 and 1 add no compiler features and are where most of the leverage is.
Expect stage 1 to go red on existing stations — that is the point. `ATM-ATOM-02`
used to fail because `spec.ts:19` asserted `toContain('border: true;')`; Move 2
changed that assertion and split `Want`/`Atom` value types.

### Stage 2 — `CascadeKey` sorter *(items 8–9 landed)*

`stylesheet/README.md`, `stylesheet/layers/README.md`, and
`resolve/shorthands/README.md` now describe the sorter as built.
`canon::property_cascade_rank` derives rank from existing longhand slices.

8. **Introduce a `CascadeKey` type** and sort emitted rules by it: *(landed)*
   `(bucket, at_rule_rank, selector_rank, property_priority, tie-breakers)`.
   Bucket is base → selector → at-rule. At-rule rank parses the query into a
   normalized length so `640px < 1024px` numerically. Property priority ranks
   `shorthands-of-shorthands → shorthands → logical longhands → physical
   longhands` via `canon::property_cascade_rank`.
   Owner: `ATM-ORDER-01` … `ATM-ORDER-04`, `ATM-SHORT-06`.
9. **Group atoms that share an at-rule wrapper** under one copy of it. *(landed)*
   Sort unit is the block, then rules inside it. Nested dual at-rules emit
   every wrap in author order (`ATM-GHOST-05`).
   Owner: `ATM-LAYER-07`.

Landing this **will** reorder `styles.css` in most goldens. That is expected and
is the reason stages 0–1 come first: you want a portable suite and an
idempotence gauge before you rewrite 70 golden files.

### Stage 3 — close the semantic holes

10. **Make invalid values unrepresentable** rather than filtered. *(landed Move 2)*
    Owner: `ATM-VALID-02`.
11. **Rewrite escaping as an allowlist** with a hex-escape for leading digits and
    dashes. Escape everything outside `[A-Za-z0-9_-]`. *(landed)*
    Owner: `ATM-NAME-06`, `ATM-NAME-07`.
12. **Fix the paren-depth bug** in `resolve/shorthands/parser.rs` `open_paren`:
    `depth` incremented twice per `(` and once per `)`, so after any `calc(…)`
    the splitter never left paren mode and glued every later token together.
    One deleted `saturating_add`. *(landed)* Owner: `ATM-SHORT-07`.
13. **Emit all at-rule conditions, or fail closed.** *(landed)* `first_at_rule`
    (`stylesheet/cascade/mod.rs`) is the sort key; emit walks every Media/
    Container wrap and nests them in author order. Owner: `ATM-GHOST-05`.

---

## 3. Refactors that make the bugs unrepresentable

Ordered by leverage. Each says what changes, what it touches, and whether goldens
move.

### Move 1 — one `When` type, lowered once *(landed 2026-09-15)*

**Problem.** `when` is a heterogeneous bag of `Box<str>`: `_hover`, `sm`,
`@container (min-width: 640px)`, `&[data-slot=inner]`. Some entries are lowered at
extract time (`resolve/r` stamps concrete query strings from `object.rs:119-129`)
and some at emit time (`_hover` stays raw until `stylesheet/name`). Because it is
a string, the same token is re-parsed on every use: `finalize_condition_name` for
the class segment, `lower_condition` for the wrap, `extract_at_rule` for the
at-rule, `recipe_selector` again for recipes. Four parses, four opportunities to
disagree — and **they do disagree, which is defect four.**

**Change.** Lower each authored condition exactly once, into a type that carries
both halves together:

```
enum When {
    Breakpoint(…),   // from BaseSystem scale
    Pseudo(…),       // catalog
    AtRule(…),       // media / container query string
    Selector(…),     // arbitrary & wrap
}
```

with `class_segment()` and `wrap()` as methods on the single value. Store `When`
on `Atom.conditions`. Authored `Want.when` stays `Box<str>` (extract form).
Resolve is the boundary: `lower_when` in `resolve/conditions`. Unknown `_nope` /
`_hovr` warn and drop that want's atoms (no wrap, no name segment). `When::AtRule`
holds the query string; parsed magnitude is Stage 2. Nested dual at-rules
emit in author order (GHOST-05).

**Why this is the top move.** It makes defect four impossible by construction
rather than by test: a condition cannot contribute a wrap without also
contributing a name segment, because both come from the same value. It also gives
`ATM-ORDER-01` its ordering key for free — `AtRule` can carry a parsed length, so
sorting by magnitude stops being string surgery. Three separate SPEC cases
collapse into a type.

**Touches** `atom/when.rs`, `atom/decl.rs`, `resolve/conditions/*`, `resolve/mod.rs`,
`stylesheet/name`, `stylesheet/emitter.rs`, `lib.rs` runtime keys via
`When::authored`. **Goldens:** known-condition CSS stays byte-identical. Unknown
conditions lose the illegal wrap. `Want.when` arrays do not change shape.
Owners: `ATM-COND-12` (ticked), `ATM-GHOST-04` (station exists; standing gauge
still blocked on `ATM-LEAF-05`).

### Move 2 — make invalid CSS values unrepresentable *(landed)*

**Problem.** `AtomValue::Bool` and `AtomValue::Null` have a `css_value_str()` that
returns `"true"` / `"null"` (`atom/value.rs:28-36`), and the emitter prints it
straight into a declaration. The type system currently promises that every
`AtomValue` can be a CSS value, and two variants cannot.

**Change.** Split the authored-input type from the emittable type. `Want` may hold
a boolean (that is a real authored form — `<Div border />`); `Atom` may not.
Resolve is the boundary: a boolean want either lowers to a real declaration set or
becomes a diagnostic. Then `Atom::value` is a type whose every inhabitant is
valid CSS, and `ATM-VALID-02` is enforced by the compiler rather than by a regex
over the output.

This is the "put pass state in a type" rule applied to the exact place it was
missing. **Touches** `atom/value.rs`, `atom/decl.rs`, `resolve/mod.rs`,
`stylesheet/emitter.rs`. **Goldens:** `ATM-SITE-09`, `ATM-ATOM-02` — and
`ATM-ATOM-02/spec.ts:19` needs its assertion changed, not just its golden.

### Move 3 — a `ClassName` newtype that cannot be printed unescaped *(medium)*

**Problem.** Class names and selectors are both `String`. Nothing stops an
unescaped name reaching a selector position, and nothing stops the harness
inventing its own escaper — which it did.

**Change.** `ClassName(String)` with a single `selector() -> CssSelector` method
that escapes. Runtime keys get `RuntimeKey::from_atom` next to `class_name`, so
the third spelling of the key grammar (`format!("{}:{}")` inline in
`lib.rs:288-292`) stops being ad hoc. Escaping becomes unavoidable rather than
remembered. **Goldens:** none if the strings are unchanged; `ATM-GHOST-02` keys
are a contract, so keep the grammar identical.

### Move 4 — single parse pass *(medium leverage, medium risk)*

Every file is OXC-parsed twice: once in `collect_project_constants`
(`lib.rs:180-196`) and once in `parse_and_extract` (`lib.rs:198-214`), then
constants are collected a third time inside `extract_parsed_program`. Collect
constants during the extract parse. This is the dominant cost on a real tree and
the reason `ATM-PERF-01` exists. **Goldens:** none.

### Move 5 — extract helper deduplication *(low risk, pure tidying)*

Genuinely repeated logic, worth one shared module (`extract/ast_keys.rs`):

- `resolve_property_key` — `object.rs:133-153`, `constants/collect.rs:120-131`,
  `extract/recipes/mod.rs:207-212` (three variants of one idea)
- `numeric_key` — `object.rs:163-170` ≡ `extract/recipes/mod.rs:238-244`
- `static_template_key` — `object.rs:155-161` ≡ `recipes/mod.rs:228-236`
- TS/paren unwrap — `walk.rs:117-137` vs `collect.rs:134-154`
- brace-path strip — `tokens/mod.rs:55-61` ≡ `system_layers.rs:99-105`
- container-query formatting — `r/query.rs:40-50` vs `conditions/mod.rs:54-58`
  (array `sm` and `r={{ sm }}` reach the same string by different code)

**Goldens:** none.

### Move 6 — route recipe extract through `RecipeWalk` *(low)*

`RecipeWalk` exists (`extract/recipes/mod.rs:70-74`) and is used only for
variants. Six functions in that file still take `(prop, origin, ctx, draft)` as
four loose arguments. Nothing is over the failure threshold, but the context
struct is right there. **Goldens:** none.

### Move 7 — move recipe IR out of the emitter *(low)*

`Recipe` / `RecipeCompound` are defined in `src/recipes` (emit) and imported by
`src/extract/recipes`, so extract depends on the emitter. Invert it: a shared
`RecipeIr`. Keep the two folders — the extract/emit split is correct and
`recipes/name` must stay separate from `stylesheet/name` (closed vs open grain).
**Goldens:** none.

### Move 8 — thread real source spans into diagnostics *(medium)*

Every call site passes `with_location(path, None, None)` (`lib.rs:210`,
`walk.rs:51-53`), and token warnings carry no file at all
(`resolve/tokens/mod.rs:47-49`). OXC spans are discarded. Add line/column, and add
a stable diagnostic code enum — there are already three near-duplicate wordings
for one condition (`walk.rs:189-191`, `:225-227`, `:305-307`). Codes are what let
a host suppress, group, and document a warning. Owner: `ATM-DIAG-04`,
`ATM-DIAG-05`. **Goldens:** `diagnostics.json` in the DIAG stations — do this
*after* Stage 0 makes those goldens portable.

### Move 9 — retire the footguns *(low risk, high clarity)*

- `resolve_want()` (`resolve/mod.rs:27-34`) silently resolves against
  `BaseSystem::default()`, so a test using it exercises different semantics than
  production. Delete it; require a system.
- `compile() -> Result<CompileResult, String>` never returns `Err`
  (`lib.rs:77,114`). Either a real error type or an infallible signature.
- `StylesheetOutput` (`stylesheet/mod.rs:16-24`) is public, re-exported, unused.
- `resolve/r/query.rs:13-16` exports a named-container formatter no caller
  invokes. Wire it (`ATM-COND-16`) or delete it.
- `CompileResult.wants` is test observability shipped in the product artifact.
  Put it behind a request flag.
- `js/index.ts:30-32` presents a `Promise` around a synchronous native call.
  Don't ship a fake async API.
- `Atom` exposes public fields *and* getters while caching a hash derived from
  those fields (`atom/decl.rs:14-56`) — mutating a field silently invalidates the
  hash. Make the fields private.

### Move 10 — make the READMEs true *(trivial, do it first)*

Documentation that describes unbuilt behavior is worse than absent
documentation: a reviewer reads the module, believes ordering is handled, and
ships the inversion. This is now SPEC §7.14.

- `stylesheet/README.md`, `layers/README.md`, `shorthands/README.md` — Stage 2
  items 8–9 landed; these now describe `CascadeKey` as built. Remaining unbuilt
  notes: selector-list coalescing. Nested dual at-rules (`ATM-GHOST-05`) landed.
- `resolve/README.md`, `r/mod.rs`, `r/README.md` reference `config/breakpoints.rs`
  and `config/fonts.rs`, deleted in the overnight run.
- `conditions/README.md` says "Bare `sm` is not a condition" — false since
  `ATM-COND-01`.
- `pseudoprops/README.md` claims `_dark` / `_light` live in that catalog; they
  come from `BaseSystem` and are not in `PRESETS`.
- `constants/README.md` says SITE-11 is unproven; it is ticked.
- `runtime/README.md` carries a Panda `File | Job` table, which belongs in
  `PANDA.md` per the house README rule.
- `runtime/mod.rs:1-3` claims "client-side style injection", which the crate
  forbids.

### Move 11 — test placement convention *(trivial)*

Three conventions coexist: sibling `tests.rs` (`atom`, `shorthands`, `font`, `r`),
inline `#[cfg(test)] mod tests` (`resolve/mod.rs`, `emitter.rs`, `name`, and
others), and an extra `extract/gating_tests.rs`. Pick sibling `tests.rs` for
anything over ~30 lines of tests and move `resolve/mod.rs`'s 125 test lines out —
they are more than half that file.

---

## 4. Production cutover — the part that is not the compiler

Worth stating plainly: **ticking all 130 cases does not ship atomic.** The
compiler is roughly half the delivery, and the other half has barely started.

| Reality today | What production needs |
| :--- | :--- |
| Panda generates the live `styles.css`. Native compile runs only behind `REF_SYSTEM_ENGINE=native` and **appends** its sheet onto Panda's, so two layer preambles with different layer counts ship together. | Atomic becomes the sole `styles.css` writer; delete the append path. |
| The host discards `CompileResult.css` and `CompileResult.recipes` entirely; runtime `css()` / `recipe()` still call `@reference-ui/styled`. | Runtime reads the emitted class map and variant table. **Until then `ATM-GHOST-01` is unenforceable in production and `ATM-RECIPE-02` has no consumer** — the P0 invariant protects an artifact that never leaves the N-API boundary. |
| Two unrelated types are both named `BaseSystem`: core's `{ name, fragment, jsxElements }` and the Rust token dump. No `deny_unknown_fields`, and `Some(system)` beats `lib_fixture()`. Passing the wrong one yields a compile with no tokens, no conditions, no breakpoints — reporting success. | `from_json` plus a fragments converter; reject foreign dumps (`ATM-TOKEN-10`). Consider renaming one of the two types. |
| `BaseSystem::lib_fixture()` is a generated nested dump (`lib.json`, 334 `tokens()` leaves + 3 font families) with `pnpm --filter @reference-ui/rust base-system --check` against `reference-lib`. Conditions/breakpoints are still host overlays. | Done for tokens/fonts. Fragment `globalCss` chrome and keyframes still outstanding. |
| Lib primitive chrome (`.ref-button` `_hover`, fields, tables) is authored as `globalCss()` in 18 lib theme files and is absent from the fixture. Book primitive hover still comes from Panda. | Lower collected `globalCss()` into `@layer global`. |
| `@keyframes` emit in `@layer global` from the generated dump (31 names). `@font-face` is still not emitted; `--fonts-sans: "Inter", …` still has no `@font-face`. | `ATM-LAYER-06` / FONT-02. |
| Styletrace errors are swallowed (`lib.rs:247-250`) and an empty host set means "extract every tag" — the behavior `ATM-SITE-08` forbids, and the only reason `ATM-SITE-01` passes. | Fail closed with a primitive graph (`ATM-SITE-13`). Note this is an internal SPEC contradiction, not just a gap. |
| No incremental compile, no watch invalidation, no parallelism, unsorted disk walk. | Sorted inputs first (correctness), then a digest cache, then optional rayon on parse. |
| Typegen is a stub (`emit_dts() -> String::new()`). | Blocks retiring `@reference-ui/styled` types; does not block CSS emit. |

---

## 5. What not to do

- Do not split the crate into micro-crates (SPEC §7.7).
- Do not merge `recipes/name` into `stylesheet/name` — closed and open grains are
  different jobs.
- Do not add a JS evaluator, QuickJS, or host `transform()` callbacks.
- Do not adopt LightningCSS, `split_css`, or the `@layer` specificity polyfill.
- Do not add `#[allow(clippy::…)]`, and do not work around the analyzer with
  tuple parameters. Introduce a context struct.
- Do not chase Panda parity where their behavior is worse. Keep: no
  `currentColor` completion; both ternary branches scooped rather than evaluated;
  one color-mode wrap; `http(s):` values emitted rather than dropped; unresolved
  token paths raw in the value with a warning rather than escaped into the
  declaration; readable atomic names with no hash option; `const`-only folding.
- Do not refresh a golden to make a test pass without deciding whether the new
  output is *correct*. Four defects are in goldens right now because that
  decision was skipped.

---

## 6. Suggested order

```
Stage 0  portable goldens → CI → delete aliases.test.ts          (unblocks all)
Move 10  make the READMEs true                                    (30 minutes)
Move 12  paren-depth one-liner *(landed SHORT-07)*; Move 9 footgun deletions
Stage 1  CSS parse gauge, ghost gauge, idempotence, injectivity   (expect red)
Move 2   invalid values unrepresentable                           → VALID-02
Move 11  escaping allowlist                                       → NAME-06/07
Move 1   the When type                                            → GHOST-04/05
Stage 2  CascadeKey sorter + at-rule grouping *(landed)*         → ORDER-*, SHORT-06, LAYER-07
Move 3   ClassName newtype;  Move 5–7 tidying
Move 4   single parse pass;  Move 8 spans and codes               → DIAG-04/05
Stage 3+ remaining SPEC tiers 2–3
§4       production cutover (separate track, larger than all the above)
```

Stage 0 and Move 10 are hours, not days, and everything after them is defended by
a suite that can actually run somewhere other than one laptop. Stages 1 and 2 are
where the module stops being able to lie to us.
