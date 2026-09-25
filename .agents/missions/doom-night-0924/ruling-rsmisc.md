# Ruling — rsmisc: four RS-cluster breaks (atlas silence, bare-attr spans, recipe stems, const `!`)

- Date: 2026-09-25 (UTC; night-0924 campaign carryover)
- Oracle: rule oracle rsmisc (red-team architecture adjudicator)
- Hunt logs: `.agents/doom/logs/2026-09-24-night-r1-trio.md` (A),
  `.agents/doom/logs/2026-09-24-night-r1-atomic.md` (B),
  `.agents/doom/logs/2026-09-24-night-g1-emit.md` (C),
  `.agents/doom/logs/2026-09-24-night-g1-extract.md` (D)
- Repros (each run unmodified, firsthand, strictly one at a time):
  - A: `bash /tmp/doom-r1-trio-atlas-pkg-silence.sh` (from repo root)
  - B: `packages/reference-neo/node_modules/.bin/tsx /tmp/doom-r1-atomic-bare-attr.mts` (from repo root)
  - C: `packages/reference-neo/node_modules/.bin/tsx /tmp/doom-g1-emit-repro.mjs /Users/ryn/Developer/reference-ui` (from repo root)
  - D: `bash /tmp/doom-g1-extract-repro.sh /Users/ryn/Developer/reference-ui`

All paths below are repo-relative under `packages/reference-rs/` unless stated.
This ruling is adjudication + fortify boundaries only. No source was modified.

---

## A. Included package scan/read failure drops silently (atlas)

Hunt log: `.agents/doom/logs/2026-09-24-night-r1-trio.md`

### 1. Repro confirmation (firsthand)

Ran the exact blind repro. Result: **confirmed**.

- Red vitest fails as filed: `expected '' to contain '@probe/uilib'` — 1 passed / 1 failed.
- Script exit 1 ("red-test exit=1"); planted
  `modules/atlas/tests/doom-r1-trio-red.test.ts` removed by the script;
  `git status --short` on the touched path is clean (verified after the run).
- Read-only cross-check: `modules/atlas/src/analyzer.rs:94-99` holds the two
  silent guards (`let Ok(files) … else { continue; }`,
  `let Ok(source_files) … else { continue; }`) exactly as filed, while the
  lesser failure (resolves nowhere) warns at `analyzer.rs:72-79` and the
  identical local-IO condition refuses loudly via `failed_result`
  (`analyzer.rs:48-60,208-213`).

### 2. Filed-break adjudication

**Verdict: BREAK** (severity: user-facing, as filed — no challenge).

- `analyzeDetailed` promises partial results "instead of forcing callers to
  infer failure modes from missing components"; here the caller can only
  infer the package failure from `Thing`'s absence. Same-condition
  divergence (local IO failure mints `ATL-E-SCAN-FAILED`, package IO
  failure mints nothing) and in-mechanism inversion (unresolvable include
  warns, resolved-but-unreadable include stays silent) are both crisp and
  mechanically demonstrated.
- One scoping note for fortify (not a severity challenge): the same two
  guards also silence *referenced* (non-included) packages. The filed break
  is the included-package case; referenced-package signaling is folded in
  only under the condition in §3.

### 3. Fortify boundary

**May change:**

- `modules/atlas/src/analyzer.rs:94-99` — the two package guards must mint a
  diagnostic naming the package instead of bare `continue`. Minimum bar:
  included packages always signal. Referenced-package signaling may ride
  the same two lines only if the golden sweep below shows zero drift;
  otherwise it is BANKED, not folded.
- `modules/atlas/src/diagnostics/codes.rs` — only if the fortify mints a new
  code. Reusing `ATL-E-SCAN-FAILED` stretches that code's documented meaning
  ("the analysis is refused with empty components", `codes.rs:24-25`),
  because the package path keeps siblings. Either shape is permitted, but
  the choice is architectural and must be stated in the fortify report:
  (i) new package-scoped code (warning or error — severity must match the
  keep-siblings behavior), or (ii) documented reuse of `ATL-E-SCAN-FAILED`
  with the `codes.rs` doc amended. No third shape.
- `modules/atlas/src/diagnostics/mod.rs` — constructor for the minted row
  (new or reuse), following the `unresolved_include_package` pattern
  (backticked subject, package named in the message).
- `modules/atlas/src/diagnostics/README.md`, `modules/diagnostics/REGISTRY.md`
  — one row each if a new code is minted; prose touch-up only under reuse.
- `modules/atlas/js/types.ts` — TS code union gains the new code (if any);
  regenerate `packages/reference-neo/src/native/generated/atlas/**` in the
  same commit.
- Regression pin (new): an atlas case or `tests/*.test.ts` addition asserting
  an unreadable *included* package surfaces a diagnostic naming the package
  while siblings still index. Fail-without-fix proof is this repro
  (1 passed / 1 failed, `expected '' to contain '@probe/uilib'`).

**Must move together:** emit sites + code-table row + constructor + registry
row + TS union + generated-types regen. A code minted in Rust but missing
from the TS union (or vice versa) fails the fortify.

**Sweep obligations (fortify crew must show all):**

- Full atlas suites green: `pnpm agentrs v atlas` and `pnpm agentrs c atlas`.
- Per-pair repin attestation over every `modules/atlas/tests/cases/*/output/`
  golden (`analysis.json`, `diagnostics.json`): expected drift is none
  (healthy fixtures never hit the guards); any drift must be shown pair by
  pair and justified, or the fortify is over-broad.
- `modules/atlas/tests/helpers.ts` + `indexing.test.ts` / `interface.test.ts` /
  `shape.test.ts` assertions reviewed for exhaustiveness on diagnostics.
- Neo consumers referencing ATL codes: `NEO-DIAG-54` (unresolved-include
  station) plus `packages/reference-neo/src/diagnostics/repro.test.ts` —
  show they still pass and assert nothing contradicted by the new row.

**Stay untouched:**

- `modules/atlas/src/resolver.rs`, `modules/atlas/src/scanner.rs`, the local
  `failed_result` path, `normalize_diagnostics` ordering.
- Sibling modules (tasty, typegen, virtualrs, atomic), the runtime, and the
  `analyze` (non-detailed) fallback semantics.

---

## B. Bare JSX style attrs drop their diagnostic span (atomic)

Hunt log: `.agents/doom/logs/2026-09-24-night-r1-atomic.md`

### 1. Repro confirmation (firsthand)

Ran the exact blind repro. Result: **confirmed**.

- Control `css({ display: true })` warns located (`probe.ts:2:33`).
- `<Div color />` and `<Div r />` warn `ATM-W-INVALID-CSS-VALUE` at `-:-:-`
  (file, line, column all absent). Script exits 1 ("RED: 2 case(s)
  misdiagnosed"); touches nothing in the tree.
- Read-only cross-check: the bare-attr site
  (`modules/atomic/src/extract/jsx/mod.rs:80-94`) pushes via raw
  `Want::new(…).with_origin(…)` + `ctx.wants.push`, bypassing
  `ExpressionWalk::push_want`
  (`modules/atomic/src/extract/expressions/walk/mod.rs:69-84`), which is the
  single place that stamps `file` and resolves `line`/`column` through
  `span_position`. The string path (`handle_attribute_string`,
  `jsx/mod.rs:137-156`) routes through `push_string_want` → `push_want` and
  is located — same-mistake inconsistency confirmed in code.

### 2. Filed-break adjudication

**Verdict: BREAK** (severity: user-facing minor, as filed — no challenge).

- `ATM-DIAG-05` README pins "every refusal the extractor emits carries
  `file:line:col` of the offending sub-expression" — the refusal carries
  none. Same-mistake inconsistency across sibling spellings is demonstrated,
  and the span is available at the emit site (`attr.name.span()`).
- Minor is right: narrow shape (bare attrs asserting `true` where `true` is
  invalid), self-describing message, no silence, no wrong paint. Nothing in
  the evidence supports raising it; the finder's pinned/principled
  exclusions (ATM-TOKEN-17 pair, ATM-DIAG-05 channel-only rationale,
  SITE-07/08 element values) are respected and not reopened.

### 3. Fortify boundary

**May change:**

- `modules/atomic/src/extract/jsx/mod.rs:80-94` (bare-attr site only) — the
  want must be minted through the locating path (`ctx.expression_walk(…)` +
  `push_want(Bool(true), …)`, mirroring `handle_attribute_string`), with
  `Some(attr.name.span())` (or the whole-attr span — fortify states the
  choice; it must satisfy "file:line:col of the offending sub-expression").
  The `ctx.authored.push` alongside it is location-free and stays as is.
- Regression pin (new): a colocated Rust test or new `ATM-DIAG-??` station
  asserting the bare-attr refusal on a known style prop carries
  file + line + column. Do NOT extend `ATM-DIAG-05`'s pinned input in place —
  that station's eleven refusals and pinned lines/cols are a contract; a new
  station or unit test pins the twelfth shape. Fail-without-fix proof is
  this repro (two `-:-:-` warnings, exit 1).

**Must move together:** the emit site + the pin. Nothing else moves: once the
want carries a site, `proof/render.rs` keeps it under its existing contract.

**Sweep obligations (fortify crew must show all):**

- `pnpm agentrs v atomic` and `pnpm agentrs c atomic` green.
- `ATM-DIAG-05` spec output byte-identical (its eleven refusals exclude bare
  attrs; any drift means the fortify touched a shared path).
- Per-pair repin attestation over atomic goldens/diagnostics outputs: any
  golden whose diagnostics *gain* file:line:col must be shown pair by pair;
  gains confined to bare-attr wants are intended, anything else is over-broad.
- `proof_names_the_declaration_and_keeps_code_and_site` and the
  `analysis/jsx_attrs` tests green without modification.
- Neo diag cases referencing `ATM-W-INVALID-CSS-VALUE` reviewed: none may
  assert the unlocated shape.

**Stay untouched:**

- `modules/atomic/src/diagnostics/policy/proof.rs` and `proof/render.rs`
  (rewrite contract intact), the string/expression-container paths,
  `analysis/jsx_attrs.rs`, the resolve session, `atom/want.rs`, the runtime.

---

## C. Colliding recipe stems emit duplicate aliases (typegen, tsc TS2300)

Hunt log: `.agents/doom/logs/2026-09-24-night-g1-emit.md`

### 1. Repro confirmation (firsthand)

Ran the exact blind repro. Result: **confirmed**.

- Control single-`button` spec: 1 alias, tsc status 0.
- Red `button`+`Button` spec: alias emitted twice, tsc rejects with
  `TS2300: Duplicate identifier 'ButtonVariantProps'` at both sites, and
  `emitDtsDetailed` returns `diagnostics: []`. "BREAK PRESENT
  (3 red assertion(s))"; scratch under `os.tmpdir()` only, tree untouched.
- Read-only cross-check: `modules/typegen/src/emit/recipes.rs:15-30` loops
  names one at a time with no stem set (the file's `BTreeSet` import serves
  `variant_fields`, line 87 — not stems). Diagnostics ride a separate mirror:
  `modules/typegen/src/diagnostics/collect.rs:49-58` (`collect_recipes`)
  re-walks `system.list_recipes()` and mirrors the printer guards name by
  name, so a printer-only guard would ship the skip in silence. Iteration
  order is deterministic and shared: `recipes: IndexMap` (`modules/base-system/src/spec.rs:238`,
  `modules/base-system/src/lib.rs:67`), documented as an "insertion-order
  walk" (`modules/base-system/src/recipes.rs:40-45`) — first-stem-wins is
  well-defined and the mirror is order-safe.

### 2. Filed-break adjudication

**Verdict: BREAK** (severity: user-facing, as filed — and the sharpest of
the four: one colliding pair poisons the entire shared `.d.ts`, so *no*
consumer typechecks, with empty diagnostics pointing nowhere).

- The per-name validity guard provably cannot see the joint invalidity; the
  tsc-acceptance bar the module holds itself to (`tsc --noEmit`,
  `tests/tsc.ts` with `skipLibCheck: false`) is failed by the module's own
  output; the "report it and keep siblings" diagnostics contract is violated
  with no code existing for the collision.
- No challenge to the finder's cross-checks: both names are legal inputs,
  classNames are case-sensitive, and atomic's exact-className duplicate gate
  lets the pair through — the break sits entirely in typegen's joint
  validity, which is where the fortify must sit.

### 3. Fortify boundary

**May change:**

- `modules/typegen/src/emit/recipes.rs:15-30` — stem-uniqueness guard
  (first-stem-wins skip of the losing recipe's aliases, both
  `{stem}VariantProps` and `{stem}CompoundVariant`; the `strict.rs:113-124`
  `seen` pattern is the in-module precedent). The per-name
  `recipe_type_stem` guard stays.
- `modules/typegen/src/diagnostics/collect.rs:49-58` — the mirror guard in
  `collect_recipes`, skipping the same loser in the same
  `list_recipes()` order and pushing the new row. **This is the
  must-move-together core: printer guard without collector mirror = silent
  skip; mirror without printer guard = lying diagnostic.**
- `modules/typegen/src/diagnostics/codes.rs` — one new warning code
  (name per table conventions, e.g. `TGN-W-DUPLICATE-RECIPE-STEM`; fortify
  states the final name), appended to the code table, never reused.
- `modules/typegen/src/diagnostics/mod.rs` — constructor + wire-format test
  vectors for the new code, following the existing per-code pattern.
- `modules/typegen/src/diagnostics/README.md`, `modules/diagnostics/REGISTRY.md`
  — one row each for the new code.
- `modules/typegen/SPEC.md` — the recipe lane gains the joint-validity
  clause (individually-valid names that PascalCase to one stem: first wins,
  loser skipped with the new row).
- `modules/typegen/js/types.ts` — TS code union gains the new code;
  regenerate Neo generated typegen types in the same commit.
- Regression pins (new, both required): (i) Rust tests in
  `src/tests/recipes.rs` / `src/tests/diagnostics.rs` asserting single alias
  + warning row for a colliding pair; (ii) a `tests/tsc.ts` colliding-spec
  case asserting `tsc --noEmit` accepts the emit. Fail-without-fix proof is
  this repro (duplicate alias + TS2300 + `diagnostics: []`).

**Must move together:** printer guard + collector mirror + code + constructor
+ README row + registry row + SPEC clause + TS union + regen. The mirror
coupling is load-bearing: the fortify report must state the iteration-order
argument (shared `list_recipes()` over `IndexMap`) and show printer and
collector skipping the same recipe.

**Sweep obligations (fortify crew must show all):**

- `pnpm agentrs v typegen` and `pnpm agentrs c typegen` green; full
  `tests/tsc.ts` harness green across all existing specs.
- Per-pair repin attestation over `modules/typegen/tests/goldens/` and
  `src/tests/goldens.rs`: expected drift is none (no existing fixture
  collides); any drift shown pair by pair.
- `TYP-FORBID-04` (two recipes, one string) green without modification;
  `seam.test.ts`, `surface.test.ts`, `vocabulary.test.ts`,
  `diagnostics.test.ts`, `strict.test.ts`, `style-05.test.ts` green.
- Neo typegen consumers (`NEO-PGEN-*`, incl. `NEO-PGEN-18` type specs)
  reviewed for colliding-stem worlds; show none affected.

**Stay untouched:**

- `modules/typegen/src/emit/strict.rs`, `tokens.rs`, `fonts.rs`, `style.rs`,
  `modules/base-system` (`from_json` keeping both keys is legitimate —
  case-sensitive classNames are a real system), atomic's
  `ATM-E-DUPLICATE-RECIPE` exact-className gate (different class, different
  module — do NOT reroute this fix through it), the runtime.

---

## D. Const-resolved `!` mints unqueryable plan keys (atomic extract)

Hunt log: `.agents/doom/logs/2026-09-24-night-g1-extract.md`

### 1. Repro confirmation (firsthand)

Ran the exact blind repro. Result: **confirmed**.

- `cargo test -p atomic` red suite: 1 passed / 3 failed, exactly as filed —
  identifier and member wants carry `("red !important", false)`, and the
  plan holds `{"prop":"color","value":"red !important","important":false}`
  with className `@reference-ui/lib__c_red_!important`.
- Plant `modules/atomic/tests/doom_g1_extract_red.rs` removed by the script;
  `git status --short` on the touched path is clean (verified after the run).
- Read-only cross-check: the five raw-push sites are exactly as filed —
  identifier fallback (`modules/atomic/src/extract/expressions/walk/leaf.rs:33-35`),
  static member (`walk/member.rs:22-24`), computed member (`walk/member.rs:60-62`),
  chains (`walk/member.rs:110-112`), spliced const-array slots
  (`modules/atomic/src/extract/expressions/responsive.rs:92-94`,
  path note: the log's `walk/responsive.rs` is
  `extract/expressions/responsive.rs`) — each pushing recorded leaves raw
  with `important: false`, while the spread path splits
  (`object/entries.rs:74-102`, S5-2) and the runtime always queries the
  stripped key (`packages/reference-neo/src/runtime/css/css.ts:142-152,194-195`,
  `splitImportant` on every scalar value before lookup).

### 2. Filed-break adjudication

**Verdict: BREAK** (severity: user-facing, as filed — no challenge).

- S5-2's "the suffix is a flag, never part of the value" is violated on five
  paths; same authored bytes modulo indirection produce different paint
  (inline paints, const-resolved does not); the plan key is unqueryable *by
  construction* against pinned runtime physics; and the one warning
  (`ATM-W-UNKNOWN-COLOR`) misnames the cause. Silent no-paint plus dead
  sheet bytes plus misdiagnosis is a full break, not a curio.
- In-bounds as filed: complete static literals in TS compile inputs. The
  unprobed siblings (computed members, chains, array slots) are code-read,
  not probed — the fortify must probe and pin all five, not just the two
  the red suite covers.

### 3. Fortify boundary

**May change:**

- The five recorded-leaf push sites together — `walk/leaf.rs:33-35`,
  `walk/member.rs:22-24,60-62,110-112`, `expressions/responsive.rs:92-94` —
  to split string leaves through the shared primitive
  (`literal::split_important_flag`, the same function `split_entry_leaf`
  uses) and OR the flag into `push_want`'s `important` argument. No partial
  split: any subset ships divergent paint by indirection shape, which is the
  filed violation — all five move in one commit.
- One shared helper (either reuse-per-site of `split_important_flag` à la
  `split_entry_leaf`, or a central split inside `ExpressionWalk::push_want`
  for `AtomValue::String`). Centralizing in `push_want` is permitted only
  with a double-split idempotence argument (already-split paths pass through
  unchanged: `split_important_flag` on clean values returns `(same, false)`)
  plus the full sweep below; per-site reuse is the smaller blast radius and
  is preferred. Fortify states the choice.
- Audit-only (change only on a positive probe): `walk/leaf.rs:94-97`
  (`handle_unary` pushes `fold.values` raw, bypassing `push_folded_want`) —
  the fortify must probe whether unary folds can carry string leaves; if
  yes it joins the set, if provably numeric/bool it stays untouched with the
  probe shown.
- Regression pins (new): unit tests adjacent to S5-2 covering identifier,
  static member, computed member, chain, and const-array-slot `!` splitting
  (value stripped + flag set), plus the plan-key-queryability assertion
  (stripped row present, no `c_red_\!important` orphan). The doom red suite
  covers two of five sites; the fortify pins all five it changes.
  Fail-without-fix proof is this repro (1 passed / 3 failed with the raw
  plan key shown).

**Must move together:** all five push sites + the helper + the five pins.
The `UnknownColor` misdiagnosis needs no diagnostics-code change — it
resolves itself once the value strips to a valid color; the fortify must
show that resolution rather than touching codes.

**Sweep obligations (fortify crew must show all):**

- `pnpm agentrs v atomic` and `pnpm agentrs c atomic` green.
- Per-pair repin attestation over atomic goldens (`src/goldens/`, incl.
  `suites/mod.rs` probes referencing important-splitting) and any
  `tests/cases/*/output/diagnostics.json` pinning `ATM-W-UNKNOWN-COLOR`:
  expected drift is confined to (i) wants/plans/sheet rows for
  `!`-suffixed const leaves now splitting, and (ii) `UnknownColor` rows
  disappearing where the stripped value is valid. Every drifted pair shown
  and justified; anything else is over-broad.
- S5-2 test (`const_leaf_important_suffix_mints_flagged_and_silent`) and the
  responsive-leaf `!` refusal (wave-1 fortify) green without modification —
  the spread path and responsive-object path are already correct and must
  not move.
- Merge/eviction, namer, and recipe-selection tests green (plan-key shape
  change could ripple into keyed structures).
- Neo cases with `!important` in worlds/specs (`NEO-CSS-*`, `NEO-SITE-*`,
  `NEO-RESP-*`, `NEO-PRIM-*` — grep sweep) reviewed: runtime lookup is
  unchanged, so paint assertions should hold; any case encoding the orphan
  class must be shown pair by pair.

**Stay untouched:**

- `packages/reference-neo/src/runtime/css/css.ts` (`splitImportant` is pinned
  physics — the plan conforms to the query, never the reverse),
  `literal.rs`'s splitter semantics (reuse, don't reshape), the resolve
  session, proof, harvest, `object/entries.rs` (S5-2 path already correct).

---

## Summary of verdicts

| Break | Verdict | Severity |
| ----- | ------- | -------- |
| A. Included-package scan/read silence (atlas) | **BREAK** | user-facing |
| B. Bare JSX attr refusals unlocated (atomic) | **BREAK** | user-facing, minor |
| C. Colliding recipe stems → duplicate aliases + TS2300 (typegen) | **BREAK** | user-facing (sharpest of the four) |
| D. Const-resolved `!` → unqueryable plan keys (atomic) | **BREAK** | user-facing |

No severity challenges sustained; no curios. All four repros confirmed
firsthand with touched paths verified clean between runs. This file
(`.agents/missions/doom-night-0924/ruling-rsmisc.md`) is the oracle's only
tree write; source is untouched and no fixes were made.
