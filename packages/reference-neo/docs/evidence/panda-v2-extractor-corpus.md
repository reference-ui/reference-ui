# Panda v2 extractor fold/drop corpus (cartography, read-only)

Corpus: `vendor/panda/crates/pandacss_extractor/tests/` (v2 beta tree, read-only)
plus `vendor/panda/design-notes/literal-evaluator.md` (the language note).
Compared against Neo SITE cases (`NEO-SITE-01..17`), Atomic stations
(`ATM-SITE-01..23`, `ATM-LEAF-*`, `ATM-DIAG-*`, `ATM-COND-*`), the SITE
`SPEC.md` absence list, and the Atomic engine source
(`packages/reference-rs/modules/atomic/src/extract/`). Method: every v2
test below was read (all 223 fixtures across the 6 fold/drop files);
our side was checked via `pnpm agentneo search`, `rg` over
`ATM-SITE-*/input`, the SITE `SPEC.md` / `TESTS.md`, and the walker
source — not assumed. Mine edges; do not port Panda.

Mission: `docs/missions/panda-v2-parity.md` (this file is the
fold-table agent's evidence note, §Further-agents item 1).

Verdicts: **HAVE** (a named case/station proves the shape) /
**MISSING** (in dialect, no proof — `(station-only)` means the engine
already does it, `(engine)` means code or a dialect decision is needed) /
**ABSENCE** (out of dialect — cites the SITE `SPEC.md` row or a
decision; do not implement).

---

## 1. Executive summary

v2's extractor names the static language v1 left to `ts-evaluator`:
fold primitives, lenient objects, null-slot arrays, syntactic unwraps,
unary/binary/template evaluation, ternary→`Conditional` with union
spreads, `&&`/`||`/`??` right-operand rule, const/member/destructure
resolution, `?.` unwrap, pure-helper lowering with a refuse list, TS
enums, and param type-literals. Our engine is a **want scooper, not a
folder**: it emits every static leaf it can see (both ternary arms,
both logical operands) and lets the runtime pick, warning and keeping
siblings on dynamics (D11). That architecture already matches v2 on
the whole open-test ternary/logical/spread core — and deliberately
differs where D11 (both arms compile) or the SPEC refusal rows
(element access, computed keys, interpolated templates, whole-object
args, `css.raw`) say so.

| File | n | HAVE | MISSING (st-only / eng) | ABSENCE |
|---|---:|---:|---:|---:|
| `scope.rs` | 80 | 27 | 31 (9 / 22) | 22 |
| `calls.rs` | 79 | 22 | 32 (11 / 21) | 25 |
| `conditional_output.rs` | 30 | 20 | 6 (4 / 2) | 4 |
| `polish.rs` | 17 | 5 | 9 (0 / 9) | 3 |
| `local_bindings.rs` | 13 | 0 | 0 | 13 |
| `optional_chaining.rs` | 4 | 1 | 2 (0 / 2) | 1 |
| **Total** | **223** | **75** | **80 (24 / 56)** | **68** |

Counts are per v2 test; §3–§4 group tests into shape rows, App. A
indexes every test. Of the 80 missing, ~24 are station-only (engine
already does it — pure row-filing work) and ~56 need engine work or
a dialect decision.

**Top-5 missing shapes** (author impact × risk):

1. **Call-arg-level unwraps are silently skipped** (`calls.rs`:
   `ts_as_const_unwraps`, `ts_satisfies_unwraps`,
   `ts_non_null_unwraps`, `parenthesized_argument_unwraps`,
   `satisfies_operator_is_transparent_for_call_args`). Value-level
   `as`/`satisfies`/`!`/parens fold fine, but `css({...} as const)`
   hits `handle_css_arg`'s `_ => {}` and extracts **nothing with no
   diagnostic** (`css/mod.rs:25-39`). `as const` is the most common
   TS idiom in style code. Engine fix + station (proposed
   ATM-SITE-26, NEO-SITE-20).
2. **Pure-helper fold table** (residue #1; 11 `scope.rs` fold tests).
   We warn-and-skip every call value (blanket HAVE on all 20 refuse
   shapes via ATM-SITE-04/LEAF-07/FORBID-02 + NEO-SITE-06), but fold
   zero helpers. Highest-value new language; needs the HQ dialect
   decision first (single-expression, no control flow, no `this`),
   then ATM-SITE-31/32 + NEO-SITE-21.
3. **Conditional-spread key collision** (residue #2;
   `ternary_spread_colliding_with_static_parent_unions_all_values`
   + before-order twin). Engine **already unions**: the static key
   pushes its want and `walk_spread_branching` pushes both arm
   wants, so all three atoms compile and the runtime picks. Zero
   engine work — file ATM-SITE-24 + NEO-SITE-18.
4. **Fail-closed holes (soundness cluster, all verified in source):**
   mutated `let` resolves its stale initializer (no mutation
   tracking anywhere in `extract/`); `!true`/`-ident`/`+x` mis-fold
   through `handle_unary`'s walk-the-argument fallthrough
   (`walk.rs:334`); spread elements in arrays
   (`padding: [1, ...[2,3], 4]`, `css([...base])`) are silently
   skipped while still consuming the index slot, shifting later
   elements to the wrong breakpoint with no diagnostic and (in
   value position) wants without plans. Proposed ATM-SITE-28/37/38.
5. **Binary folds** (`1 + 'px'`, arithmetic, comparisons, equality;
   ~10 `calls.rs` tests + `binary_with_identifier_operand_folds`).
   We warn-dynamic on all `BinaryExpression` values. Pure static
   shapes, no interpreter risk — but an undecided dialect addition.
   Proposed ATM-SITE-33 after the dialect agent rules.

**Residue answers** (brief §Match-down):

- #1 pure-helper fold/drop → folds MISSING (11), drops HAVE-blanket
  (20). Start with the refuse pins (station-only), then folds.
- #2 conditional-spread collision → engine already unions;
  station-only (ATM-SITE-24).
- #3 array `css()` args as merge list → engine already walks them
  (`css/mod.rs:34`, merge-list not responsive); only the JSX form
  is stationed (ATM-SITE-19). Station-only (ATM-SITE-25).
- #5 optional chaining → we drop both, as suspected: no
  `ChainExpression` handling, so known-base `tokens?.color` warns
  (MISSING fold) and free-base `maybe?.foo` warns (HAVE-net drop).
  Lib uses `?.` only for runtime logic, never styles (grep §C).
- #6 polish shapes → lib/Book write **none** of them: zero `enum`
  declarations, zero `props: {` type-literal params, zero
  const-destructuring-for-styles, zero `css()` calls at all in
  `packages/reference-lib/src` (grep §C). Recommend approved
  absence for enums + type-literals (dialect agent writes the SPEC
  row); destructure stays MISSING-low-priority.

---

## 2. File map

Counts verified 2026-09-18 via `grep -c '#\[test\]'` (match the brief).
Family tags: IDENT | MEMBER | ELEMACCESS | COMPUTEDKEY | DESTRUCT |
SHADOW | UNWRAP | UNARY | BINARY | TEMPLATE | LOGICAL | TERNARY |
SPREAD | ARRAY | HELPER | OPTIONAL | ENUM | TYPELITERAL | JSXFIELD |
CALLFORM | BINDING | NORMALIZE | RAW | PATTERN | RECIPE | TRANSFORM.

| Path | n | Language it names | Family |
|---|---:|---|---|
| `scope.rs` | 80 | const/let/var, member, destructure, shadow, cycles, binary/template with idents, **pure-helper fold-or-drop** (31) | IDENT, MEMBER, ELEMACCESS, DESTRUCT, SHADOW, BINARY, TEMPLATE, HELPER |
| `calls.rs` | 79 | arg forms, `.raw`/pattern/recipe product calls, namespace/alias identity, unwraps, unary/binary/template, computed keys, multi-arg, array slots | CALLFORM, BINDING, UNWRAP, UNARY, BINARY, TEMPLATE, COMPUTEDKEY, ARRAY, SPREAD, RAW, PATTERN, RECIPE, NORMALIZE |
| `conditional_output.rs` | 30 | ternary→Conditional, `&&`/`\|\|`/`??` right-operand, colliding spread unions, nesting, mid-array slots, member hop | TERNARY, LOGICAL, SPREAD, ARRAY, MEMBER |
| `polish.rs` | 17 | TS enums, param type-literals, JSX factories, destructure defaults, `undefined` | ENUM, TYPELITERAL, JSXFIELD, DESTRUCT, IDENT |
| `local_bindings.rs` | 13 | transform-only `cva` local-binding facts | TRANSFORM, RECIPE |
| `optional_chaining.rs` | 4 | `?.` unwrap on known objects; free-base drop | OPTIONAL, ELEMACCESS |

Out of the fold-table scope by brief: `jsx.rs` (61), `cross_file.rs`
(51), `first_that_works_calls.rs` (34), frameworks (61),
`token_calls.rs` (21), `raw_spreads.rs` (14), `import_map.rs` (13),
`imports.rs` (18) — see §6 for the standing absence citations.

---

## 3. Fold table (what v2 folds → our verdict)

Each row: v2 input → v2 expected, then our verdict with the
case/station/SPEC/decision citation. `scope.rs`/`conditional_output.rs`/
`polish.rs`/`optional_chaining.rs` run through the full resolver;
`calls.rs` mostly uses the staged no-resolver harness, so a few of
its drops (interpolated templates, bare identifiers) are stage
artifacts — the verdict always follows the full-resolver behavior
plus our dialect.

### IDENT — const / let / var / shorthand / undefined

**1. Scalar const + shorthand resolve.** `const w = '5px';
css({ width: w })`; `const color = 'red'; css({ color, padding:
'4px' })` → values in data (`const_string_identifier_resolves`,
`shorthand_property_resolves_via_resolver`). **HAVE** for the
explicit form (ATM-SITE-06, NEO-SITE-02 family); **MISSING
(station-only)** for shorthand — the engine resolves it through the
identifier path (`walk.rs:196`), but no ATM input writes `{color}`.

**2. Unmutated `let` / `var` resolve.** `let color = 'red';
css({ color })` → `red` (`let_unmutated_resolves`,
`var_unmutated_resolves`). **MISSING (station-only)** — the
collector records every declarator regardless of kind
(`collect.rs:34`, no kind check) and SITE-06's input is
const-only, so the behavior is unpinned.

**3. `undefined` / `null` arms don't block the object.**
`css({ color: 'red', width: undefined })` → color extracts
(`an_undefined_property_does_not_block_the_object`). **HAVE**
(NEO-CSS-05 null/undefined strip; ATM-SITE-21's silent
`undefined` arm).

### MEMBER — member access (static only)

**4. Single-hop const member.** `const theme = { primary:
'n300' }; css({ color: theme.primary })` → `'n300'`
(`jsx_attribute_resolves_identifier` is the JSX twin).
**HAVE** (ATM-SITE-06, NEO-SITE-02).

**5. Multi-hop member.** `tokens.colors.red` over nested consts →
`'#f00'` (`static_member_access_resolves`). **MISSING (engine)**
— `handle_static_member` only matches `ident.prop`
(`walk.rs:241`), and the collector only records one level of
literal props (`collect.rs:138`), so nested objects are invisible.

**6. Member hop through a conditional.** `const styles = { hover:
{ color: isActive ? 'red' : 'blue' } }; css({ ...styles.hover })`
→ conditional color (`member_hop_projects_nested_conditional`).
**MISSING (engine)** — member-argument spreads fall through to
the "Dynamic object spread" warning (`object.rs:273`); nested
const objects are unrecorded (see row 5).

**7. Non-null unwrap through member.** `tokens!.color` → `'red'`
(`non_null_assertion_unwraps_through_member_access`). **MISSING
(engine)** — the object position must be a bare `Identifier`
(`walk.rs:241`), so `tokens!` misses and warns.

### ELEMACCESS / COMPUTEDKEY — refused by decision, not missing

**8. Element access in every form.** `colors['red']`,
`colors[key]`, `sizes[1]`, `['red','blue'][0]`,
`['red','blue'][i]`, `['red','blue']["1"]`,
`({a:'red'})['a']`, `m['a'+'b']`, ``m[`a${'b'}`]``,
`m[w.k]`, `colors['red']['500']` (12 `scope.rs` tests).
**ABSENCE** — SITE SPEC "Element-access refusal" row
(`map['k']`, `map[key]`, computed map keys refuse with a
`Dynamic non-literal expression` diagnostic; S1 probes O1/O2/O3).
Note: the SPEC row names string/identifier keys; numeric-index
and inline-literal forms refuse through the same arm and the row
should name them explicitly. Do not "fix" toward v2 without a
decision (brief §Probe findings).

**9. Computed style-object keys.** `{ [prop]: 'red' }`, `{ [key]:
color }` destructure form, `{ ['color']: 'red' }`, `{ [42]:
'red' }`, `{ ['col'+'or']: 'red' }`, including inside condition
blocks (`computed_style_object_key_resolves[_inside_condition]`,
`computed_key_from_string/numeric/concatenation`,
`object_destructure_computed_key_resolves` — the key part).
**ABSENCE** — SITE SPEC "Computed-key refusal" row (O4
`Dynamic computed property key…`). Deliberate differ: we refuse
even static `['color']` keys, which v2 folds.
`computed_keys_skip_extraction` (dynamic key) is **HAVE** via
the same O4 arm — and ours keeps static siblings where v2 drops
the whole call.

### DESTRUCT — destructuring (fold side missing, lib writes none)

**10. Object/array destructure, rename, rest, defaults.**
`const { color } = tokens`, `{ primary: color }`, `{ color,
...space }`, `[small, medium]`, `const { color = 'red' } =
props` (+ present-key and object-default twins)
(`object_destructure_*` ×4, `array_destructure_resolves_index`,
`destructure_default_*` ×3). **MISSING (engine)** — the
collector only matches `BindingIdentifier` (`collect.rs:35`),
so destructured names are unrecorded and warn at use. Low
priority: lib/Book write zero const-destructuring-for-styles
(grep §C); everyday-React shape, keep as a grouped row
(proposed ATM-SITE-35).

### SHADOW — shadowing and scope

**11. Param shadows of `css`.** `function f(css) {
css({...}) }`, `(css) => css({...})` → dropped; outer live
`css()` still extracts (`function_parameter_shadows_css_import`,
`arrow_parameter_shadows_css_import`,
`shadowed_call_does_not_block_outer_call`). **HAVE**
(ATM-SITE-10, NEO-SITE-05; scope push/pop + param shadows in
`extract/mod.rs:229-246`, `bindings.rs:75`).

**12. Block-scoped `const css` shadow.** `{ const css = (x) =>
x; css({...}) }` → dropped (`block_scoped_const_shadows_outer`).
**MISSING (station-only)** — declarator shadows register on the
enclosing function scope (`mod.rs:241`), which covers this
direction (over-shadowing later siblings is fail-closed); no
station writes the block form.

**13. Inner scope shadows outer same-named const.** Outer
`color = 'never.500'`, inner `color = 'orange.500'` → only
orange (`inner_scope_shadows_outer_same_named_const`).
**MISSING (engine)** — the const index is file-global and
`insert_scalar` *unions* leaves (`index.rs:27`), so both values
emit (sheet bloat + extra plan, no mispaint since the runtime
picks by live value).

**14. JSX tag shadowed by param.** `function f(Box) { return
<Box color='red' /> }` → not extracted
(`jsx_tag_shadowed_by_param_is_not_extracted`). **MISSING
(engine)** — host gating never consults shadowing, so this
would extract. Absurd code; candidate for an approved absence
rather than a station.

### UNWRAP — parens / as / satisfies / ! / assertions

**15. Value-level unwraps.** `('2r')`, `'2r' as const`,
`'2r' satisfies string`, `'2r'!` in value position
(`parenthesized_argument_unwraps` etc. at value level;
`nested_unwraps_and_folding`'s wrap part). **HAVE**
(`walk.rs:134` unwrap arm + `ast_value.rs:54` +
`collect.rs:179`; note `TSNonNullExpression` also sets the
important flag in `ast_value.rs:64`).

**16. Call-arg-level unwraps.** `css(({...}))`, `css({...} as
const)`, `css({...} satisfies T)`, `css({...}!)`
(`parenthesized_argument_unwraps`, `ts_as_const_unwraps`,
`ts_satisfies_unwraps`, `ts_non_null_unwraps`,
`satisfies_operator_is_transparent_for_call_args`).
**MISSING (engine — silent!)** — `handle_css_arg` matches only
Object/Conditional/Array (`css/mod.rs:25`), so these extract
nothing with **no diagnostic**. `as const` on a style object is
mainstream TS; this is the top fail-open-ish hole (proposed
ATM-SITE-26, NEO-SITE-20).

**17. Old-style `<any>{...}` assertion.** `.ts`-only
(`ts_old_style_type_assertion_unwraps`). **MISSING (engine)** —
no `TSTypeAssertion` arm outside `recipes/walk.rs:237`; same
silent skip as row 16. (Value-level `TSTypeAssertion` /
`TSInstantiationExpression` are likewise unhandled — fold into
the same row.)

### UNARY — negation / plus / not

**18. `-4`, `-0.5` on numeric literals.**
(`unary_negation_on_numeric_literal`). **MISSING
(station-only)** — both the want walker (`walk.rs:321`) and
`ast_value.rs:290` fold it; no ATM input writes a negative
literal (grep over `ATM-SITE-*/input` is empty).

**19. `+50`.** (`unary_plus_on_numeric_literal`). **MISSING
(station-only)** — folds today only via `handle_unary`'s
walk-the-argument fallthrough (`walk.rs:334`); correct value,
accidental mechanism, unpinned.

**20. `!true` → `false`, `!0`, `!''`.**
(`unary_logical_not_on_literal`). **MISSING (engine — wrong
value)** — the same fallthrough walks the argument and pushes
`true` for `!true`, drops the sign for `-ident`, and walks
through `typeof`/`~`. Needs a refuse (or real fold) instead
(proposed ATM-SITE-38).

### BINARY — concatenation / arithmetic / comparison / equality

**21. String concat and coercion.** `'50'+'%'`,
`1+'px'`, `'x: '+42`, `true+'!'`, `n+'px'` with `const n = 4`
(`binary_string_concatenation`, `string_coercion_on_addition`,
`binary_with_identifier_operand_folds`). **MISSING (engine)**
— `BinaryExpression` values hit the generic dynamic warn. No
interpreter risk; undecided dialect addition (proposed
ATM-SITE-33).

**22. Numeric arithmetic and coercion.** `2+3`, `10-4`,
`2*3`, `12/4`, `7%3`, `'5'-1`, `'2'*3`, `true*4`,
`'10'/'2'` (`binary_numeric_arithmetic`,
`numeric_coercion_in_arithmetic`,
`nested_unwraps_and_folding`'s `-2*4` part). **MISSING
(engine)** — same arm as row 21. v2 drops division-by-zero
and NaN rather than emit non-JSON values
(`literal-evaluator.md` §JS semantics) — any future fold must
copy that rule.

**23. `'foo' - 1` drops.** (`non_numeric_string_in_arithmetic_drops`.)
**HAVE (blanket)** — v2 drops with a diagnostic; our generic
dynamic-warn path drops with a diagnostic (ATM-DIAG-02,
ATM-LEAF-07). Same net, no station needed.

**24. Equality and comparison as values.** `===`, `==` with
coercion, `<`/`<=`/`>`/`>=`, lexicographic strings
(`strict_equality_on_literals`,
`loose_equality_with_coercion`, `numeric_comparison`,
`string_comparison_is_lexicographic`). **MISSING (engine)**
— same dynamic-warn arm as rows 21–22; fold into ATM-SITE-33
or absent with it. (ATM-SITE-23 already writes `theme ===
'dark'` as a *guard*, which is the guard path, not a fold.)

### TEMPLATE — static folds, interpolation refused by decision

**25. Static backtick values.** ``color: `red` ``
(`template_literal_without_interpolation`,
`template_literal_value_whitespace_is_collapsed_outside_quotes`
— value part). **MISSING (station-only)** — the static path
folds (`literal.rs:87`, `ast_value.rs:127`); no ATM input
writes one (backticks appear only in SITE-12's refusal
input). Whitespace collapsing inside the value is separately
MISSING (row 41).

**26. Interpolated templates.** `` `${n}px` ``, `` `${o.p}` ``,
`` `${2+3}px` ``, multiline gradient with `${angle}`, dynamic
`` `${dynamic}px` `` (`template_literal_with_identifier/
member_interpolation_folds`,
`template_literal_with_literal_interpolations`,
`multiline_template_literal_with_interpolation_folds`,
`template_literal_with_interpolation_is_skipped`). **ABSENCE**
— SITE SPEC "Computed-key refusal" row covers O8
(`Dynamic non-literal template expression…`); ours diagnoses
where v2's staged harness silently drops.

### LOGICAL — && / || / ?? (scoop-both vs right-operand)

Our rule: walk both non-guard operands (`walk.rs:267`;
guards = boolean/binary/null/undefined literals,
`walk.rs:281`). v2's rule: foldable left short-circuits,
unresolvable left emits the right operand. Same paint, ours
compiles a provably-dead arm in the all-literal case and
diagnoses the dynamic side where v2 stays silent.

**27. `&&`/`||`/`??` with unresolvable left emit right.**
`isFocused && focusColor`, `maybeColor || fallback`,
`maybeColor ?? fallback` → right value
(`logical_and/or/coalesce_with_unresolvable_left_emits_right_operand`).
**HAVE** — right compiles (ATM-SITE-05 family,
NEO-SITE-08 for the spread twin); the unresolvable left
warns (ours) instead of silent (v2). Fail-closed-consistent.

**28. Guard-left logicals.** `null ?? 'red'`, `null ||
'red'`, `'red' || maybeFn()` →
`'red'`/`maybeFn()`-warned (`nullish_coalesce_with_null_left_picks_right`,
`logical_or_with_null_left_picks_right`,
`logical_or_with_literal_left_short_circuits`). **HAVE** —
null/boolean guards skip the left (`walk.rs:281`); in the
`'red' || maybeFn()` case the call arm warns via the general
path (NEO-SITE-06) while `'red'` compiles.

**29. All-literal logicals.** `'x'&&'y'`, `''&&'z'`,
`'first'||'second'`, `''||'fallback'`, `null??'d'`,
`'v'??'u'` → short-circuit single value
(`logical_and_or_coalesce_with_literals`). **MISSING
(engine)** — we scoop both non-guard arms, so `'x' && 'y'`
compiles a dead `'x'` atom (paint-correct, sheet-extra).
Literal-only short-circuit would be pure win; no station.

### TERNARY — open test scoops both (D11 governs the differs)

**30. Open-test ternary, both arms.** `isDark ? 'white' :
'black'` in values, JSX attrs, nested objects, multi-conditional
objects, mixed-type arms
(`ternary_with_non_literal_test_emits_both_branches`,
`ternary_in_jsx_attribute_emits_conditional`,
`nested_conditional_inside_object`,
`ternary_with_mixed_type_branches_emits_conditional`,
`multiple_conditionals_with_inline_spread_flatten_in_order`,
`conditional_with_non_literal_test_emits_branches`,
`logical_and_with_both_literal_emits_conditional` — which
despite its name tests `isFocused ? a : b`). **HAVE**
(ATM-SITE-05/17/23; NEO-SITE-01 incl. its JSX-ternary
coverage per TESTS.md N1/N2/N7).

**31. Foldable-test ternary picks one branch.** `dark ?
'white':'black'` (const true), `1===1?...`, `false?'a':true?
'b':'c'`, `true?'red':'blue'`, `(2+2===4)?...`
(`ternary_with_literal_test_still_picks_one_branch`,
`constant_comparison_test_folds_to_chosen_branch`,
`nested_ternary_with_static_tests_folds_to_one_branch`,
`conditional_with_literal_test`,
`equality_inside_conditional_test`,
`conditional_with_identifier_test_folds`). **ABSENCE (D11)**
— decision D11 says literal ternary arms *both* compile and
the runtime picks (NEO-SITE-01 proves it); v2's pick-one is a
deliberate differ, not a gap.

**32. One unresolvable branch keeps the resolvable one.**
`dark ? maybeFn() : 'black'` → `'black'` (and mirror)
(`ternary_with_one_unresolvable_branch_keeps_the_resolvable_one`,
`ternary_with_unresolvable_alternate_keeps_the_consequent`).
**HAVE** — scoop compiles the resolvable arm (SITE-05);
the call arm warns (NEO-SITE-06). Same net as v2 plus our
diagnostic.

**33. Equal branches collapse.** `dark ? 'red' : 'red'` →
single `'red'` (`ternary_with_equal_branches_collapses_to_a_single_value`).
**HAVE** — two identical wants dedupe in the `AtomSet`
(SITE-01 family); no duplicate atom.

**34. Nested ternary, open tests.** `isDark ? 'red' :
isPrimary ? 'blue' : 'green'` → nested conditional
(`nested_ternary_emits_nested_conditional`). **HAVE** —
recursion scoops all three leaves (ATM-SITE-21's nested
ternary, ATM-SITE-23's deep ternary).

**35. Object-valued ternary arms in value position.**
`color: isDark ? { base:'white', _hover:'gray' } :
{ base:'black' }` (`ternary_with_object_branches`).
**MISSING (station-only)** — arms route through the
per-prop responsive-object machinery (`walk.rs:177`,
`responsive.rs:42`; ATM-COND-17 proves the shape for
authored objects), but no station writes the ternary-of-objects
value form.

### SPREAD — lenient, last-wins at runtime, union on collide

**36. Inline object spread.** `css({ ...{ margin: '10px' },
padding: '20px' })` (`literal_object_spread_inside_arg`;
SITE-05's first control). **HAVE** (ATM-SITE-05).

**37. Identifier spread.** `css({ ...base, padding: '4px' })`
(`object_spread_of_local_identifier_resolves`). **HAVE**
(ATM-SITE-11, NEO-SITE-03).

**38. Unresolvable spread keeps static siblings.**
`css({ ...base, color: 'red' })` with unknown `base` →
color + skip (`unresolvable_spread_is_skipped_keeping_static_props`).
**HAVE** (ATM-SITE-05: "Dynamic object spread… keeping
sibling properties").

**39. Logical spreads merge the right operand.** `...(unk &&
{ padding: '1' })`, `...(unk || { margin: '20px' })`
(`logical_and_spread_merges_the_right_operand_object`,
`logical_or_spread_merges_the_right_operand_object`).
**HAVE** (ATM-SITE-05's exact inputs; NEO-SITE-08 for the
const-`ok` twin).

**40. Ternary spreads, same-key and distinct-key.**
`...(unk ? { padding:'1' } : { padding:'2' })` →
conditional `1|2`; `...(unk ? { padding:'1' } : {
margin:'2' })` → both keys
(`ternary_spread_with_same_key_emits_conditional_value`,
`ternary_spread_with_distinct_keys_merges_both_branches`).
**HAVE** (ATM-SITE-05's exact inputs — scoop pushes both
arm wants; sheet keeps both atoms; runtime picks).

**41. Ternary spread colliding with a static parent, either
order.** `css({ padding: '0', ...(unk ? { padding: '1' } : {
padding: '2' }) })` → union `0|1|2`, order-independent
(`ternary_spread_colliding_with_static_parent_unions_all_values`,
`ternary_spread_before_a_colliding_static_key_still_unions_all_values`).
**MISSING (station-only)** — engine already unions (static
want + both arm wants; runtime last-wins per slot,
NEO-MERGE-01). Residue #2 answered: file ATM-SITE-24, no
code. (v2's order-independence matches ours: wants are
unordered, merge is positional at runtime.)

**42. Literal-test conditional spread.** `...(false ? { color }
: { background })` → else branch only
(`conditional_spread_with_literal_test_folds_branch`).
**ABSENCE (D11)** — we scoop both arms by decision.

**43. Duplicate keys / multi-spread last-wins.** `css({ color:
'red', …, color: 'blue' })`, `css({ ...a, ...b })` overlaps,
spread-then-explicit (`duplicate_object_keys_keep_first_position_with_last_value`,
`merge_two_inline_object_spreads_second_wins`,
`spread_overwrite_keeps_spread_position`). **HAVE** —
architecture differs (we keep both wants/atoms; v2 upserts
at extract) but the claim holds at runtime last-wins
(NEO-MERGE-01 "sheet keeps both atoms", NEO-MERGE-02).

**44. Const object with nested conditions, spread whole.**
`const styles = { _hover: { ...(cond ? {color:'red'} :
{color:'blue'}) } }; css({ ...styles })`
(`nested_const_spread_keeps_conditional_encode_data`).
**MISSING (engine)** — `unpack_local_const_object` lowers
scalar leaves only and never scopes conditions
(`object.rs:347` comment admits it); nested const objects
are unrecorded (row 5).

### ARRAY — responsive slots vs merge lists

**45. Responsive value arrays.** `padding: [4, 8, 12]`
(`array_value`). **HAVE** (ATM-LEAF-05; NEO responsive
cases; `responsive.rs:16` maps indices onto the breakpoint
scale).

**46. Null slots / dynamic slots / elision holes.**
`['black', null, 'orange', 'red']`, `[undefined, dynamic,
'red']`, `['black', , 'orange']`
(`array_value_preserves_null_elements`,
`array_unresolvable_element_becomes_null_slot`,
`array_value_preserves_elision_holes`). **HAVE** for null
(NEO-CSS-05, NEO-PRIM-04) and dynamic (omit + warn, arity
kept via `enumerate`); **MISSING (station-only)** for
elision specifically — the `Elision` arm exists
(`responsive.rs:29`) but no station writes a hole.

**47. Mid-array ternary slot.** `padding: [2, condensed ? 2 :
3, 4]` → conditional at index 1
(`array_mid_slot_ternary_projects_conditional_at_index`).
**MISSING (station-only)** — `walk_array` recurses
`walk_expression` per element (`responsive.rs:33`), so both
arms land wants at the same breakpoint; unpinned.

**48. Array spread inside an array value.** `padding: [1,
...[2, 3], 4]` → flattened (`literal_array_spread_inside_arg`).
**MISSING (engine — silent mis-index)** — `SpreadElement`
yields `None` from `as_expression()`, so `walk_array`
skips it *while `enumerate` still consumes the slot*:
`4` lands one breakpoint early with no diagnostic, and the
authored-plan path (`ast_value.rs:93`) collapses the whole
array to `None`, leaving wants without plans. Refuse with a
diagnostic (proposed ATM-SITE-37). Same hole in merge-list
position (`css/mod.rs:55`: `css([...base])` silently drops).

**49. `css([...])` call-form array as merge list.**
(`array_value`'s call-form twin; SPEC L215: `css([{
margin:'1r' }, { margin:'3r' }, false])` merges, `false`
skips silently, never responsive.) **MISSING
(station-only)** — `walk_array_arg` already recurses per
element (`css/mod.rs:50`) and non-objects hit the silent
`_ => {}`; only the JSX form is stationed (ATM-SITE-19).
Residue #3 answered: file ATM-SITE-25. (The
responsive-vs-merge confusion the SPEC warns about is
structurally impossible: value arrays go through
`responsive.rs`, arg arrays through `walk_array_arg`.)

### HELPER — pure-helper folds (all missing) and refuse list (blanket have)

v2 lowers single-expression arrows/functions/IIFEs to a
closed `pure_fn` descriptor, folds args, applies the body;
captures must fold; everything else refuses
(`literal-evaluator.md` §Pure callables). We have no
lowering: every call value warns and skips (ATM-SITE-04,
ATM-LEAF-07, ATM-FORBID-02, NEO-SITE-06).

**50. Folds — nullary/args/defaults/IIFE/object-return.**
`() => 'red'`, `function getColor() { return … }`, arrow
and `function` IIFEs, `(base, shade = '500') =>
`${base}.${shade}``, `() => ({ color, backgroundColor })`
spread into `css()` and JSX, `(arr) => arr[1]`, ``(shade)
=> `red.${shade}` `` in JSX style props
(`local_function_call_return_folds`, `iife_folds`,
`local_function_declaration_call_folds`,
`pure_helper_default_and_multi_args_fold`,
`function_expression_iife_folds`,
`pure_helper_object_return_spreads_into_css/jsx`,
`pure_helper_array_index_folds`,
`pure_helper_folds_inside_jsx_style_prop`,
`pure_helper_folds_inside_cva_base` — the last also
names a cva host, which stays ABSENCE per SITE SPEC).
**MISSING (engine)** ×11 — the prize of residue #1, behind
the HQ dialect decision (proposed ATM-SITE-31).

**51. Fold — helper returning a computed key.** ``(name) =>
`.${name}:is(:hover, …) &` `` used as `[groupHover('cool')]`
(`pure_helper_param_template_folds_as_computed_key`).
**MISSING (engine)** — needs rows 50 *and* computed keys
(row 9, decided ABSENCE); doubly out until both move.
Counted in the 11.

**52. Refuse list — impure/unsupported shapes.** `Math.random`
in body, loops, `.map`/`.reduce`, async/generator, rest or
destructured params, multi-statement bodies, nested unknown
calls, `this`-less member callees, optional `f?.()` calls,
spread args, aliased `g = f`, mutated `let f`, class static
refs, `Object.entries` factories, object-spread inside the
pure body, boolean index (`pure_helper_boolean_index_*`,
`impure_math_random_*`, `pure_helper_body_object_spread_*`,
`pure_helper_local_alias_*`, `nested_pure_call_*`,
`object_entries_factory_*`, `rest_param_*`,
`member_callee_*`, `optional_pure_call_*`,
`spread_args_pure_call_*`, `async_pure_*`,
`destructured_param_*`, `multi_statement_body_*`,
`mutated_pure_helper_binding_*`,
`class_static_method_reference_*`, `generator_*`,
`for_loop_*`, `while_loop_*`, `array_map_method_*`,
`array_reduce_method_*`). **HAVE (blanket)** ×20 — every
one of these hits "Dynamic non-literal expression" /
"Dynamic object spread" warn-and-skip with siblings kept,
which is exactly what the named stations promise. Per-shape
pins are unfiled; proposed ATM-SITE-32 pins the highest-risk
refusals (`Math.random`, `.map` chains, async) so Doom can't
regress them into an interpreter.

**53. Bare function value (no call).** `css({ color:
getColor })` without `()` (`function_expression_initializer_drops`).
**MISSING (station-only)** — the arrow init is unrecorded
so use warns "Dynamic non-literal identifier"; correct net,
unpinned.

### OPTIONAL — ?. unwrap

**54. `?.` on a known object.** `tokens?.color`,
`t?.colors?.red` (`optional_static_member_resolves_on_known_object`,
`nested_optional_chain_resolves`). **MISSING (engine)** —
no `ChainExpression` handling; warns dynamic. (Nested form
additionally needs row 5.) Lib uses `?.` only for runtime
logic, never style positions (grep §C) — legitimate but
low-priority (proposed ATM-SITE-34).

**55. `?.` on an unresolvable base.** `maybe?.foo` → drop
(`optional_chain_on_unresolvable_base_drops`). **HAVE
(blanket)** — warns dynamic, extracts nothing (SITE-23's
fully-dynamic-identifier control + ATM-DIAG-02). Residue #5
confirmed: we drop both; only the known-base fold is missing.

**56. `?.` computed member.** `sizes?.[key]`
(`optional_computed_member_resolves`). **ABSENCE** —
element-access row governs the member part (row 8); the
chain unwrap itself is row 54.

### ENUM / TYPELITERAL — polish folds (lib writes none)

**57. TS enums.** `Sizes.Small` → `'4px'`, `Levels.High` →
`99`, uninitialized member drops
(`enum_member_access_resolves`,
`numeric_enum_member_resolves`,
`enum_member_without_initializer_drops_that_path`).
**MISSING (engine)** — no enum support (member access on an
unrecorded enum warns). But: **zero `enum` declarations in
`packages/reference-lib/src`** (grep §C). Recommend the
dialect agent rule these an approved absence instead of
minting cases.

**58. Param type-literal folds.** `function paint(props: {
color: 'red'; size: 4 })` → `props.color` folds;
destructured-param twin (`function_param_with_type_literal_resolves_member`,
`destructured_param_type_literal_binds_the_member_not_the_wrapper`).
**MISSING (engine)** — we never read type annotations. And:
**zero `props: {` params in lib** (grep §C). Recommend
approved absence; reading types as values is the thinnest
end of the interpreter wedge.

**59. Param/type drops.** Unannotated params, optional
`color?` members, partially-unfoldable literals, bare
`string` types (`function_param_without_annotation_still_drops`,
`optional_type_literal_member_does_not_fold`,
`unfoldable_type_literal_member_leaves_siblings_unresolved`,
`function_param_with_non_literal_type_drops`). **HAVE
(blanket)** ×4 — params are unrecorded identifiers, so all
warn-and-skip via the generic path (SITE-23's dynamic
control + ATM-DIAG-02).

### CALLFORM / BINDING — call shapes and import identity

**60. Literal / empty / nested / multi calls.**
`css({ color: 'red' })`, `css({})`, calls inside JSX,
inside function bodies, inside non-Panda call args
(`literal_string_value`, `empty_object_arg`,
`finds_calls_inside_jsx`, `finds_calls_inside_function_body`,
`finds_panda_call_nested_in_non_panda_call_args`).
**HAVE** for literal/in-JSX/in-function (ATM-SITE-02's
multi-call input; SITE-10's shadow test proves descent
into function bodies); **MISSING (station-only)** for
`css({})` (trivial no-op, unpinned) and `cx('card',
css({...}))` (visitor descends all args by construction,
unpinned).

**61. Import alias / namespace identity.**
`nCss({...})`, `panda.css({...})`
(`aliased_local_binding`, `js_parity_namespace_css_aliases`
— css part). **HAVE** (ATM-SITE-15, NEO-SITE-04; cva/sva
twins in the v2 test are ABSENCE per SITE SPEC).

**62. Namespace edge identity.** `panda({...})` (calling
the namespace itself), `panda.somethingElse({...})`
outside the allowlist
(`called_namespace_alias_without_property_is_skipped`,
`namespace_property_outside_name_allowlist_is_skipped`).
**MISSING (station-only)** — `bindings.rs` requires a
property match, so both skip; unpinned. One grouped row
(proposed ATM-SITE-36).

**63. Unmatched callees ignored.** `unrelated({...})`
beside `css({...})` (`ignores_unmatched_callees`).
**HAVE** (ATM-SITE-04).

**64. Multi-arg with string/config head.**
`css('panda', { color: 'red' })`
(`multi_arg_call_string_then_object`);
`css('panda', somethingUnknown(), {...})` keeps positional
None (`multi_arg_call_preserves_position_for_unresolvable_middle`).
**MISSING (station-only)** for the string-head form
(engine skips the string arg, extracts the object);
**ABSENCE** for the positional-None part (our
whole-object arg is an approved silent skip, no IR slot).

**65. Parse errors diagnose.**
(`parse_error_surfaces_diagnostic`). **HAVE**
(ATM-DIAG-03: parse errors become error diagnostics,
compile still returns).

**66. `css()` with no args drops silently.**
(`no_args_call_does_not_extract`). **MISSING
(station-only)** — trivial loop-over-zero-args no-op,
unpinned.

**67. `css` tagged template is not a site.**
`` css`background: red` `` (`css_tagged_template_does_not_extract`).
**HAVE** (ATM-SITE-12: no wants, no diagnostic).

### NORMALIZE — value whitespace (minor)

**68. Whitespace collapses outside quotes.** `'1px  solid
red'` ≡ `'1px solid red'`; multiline backtick grids
collapse (`string_value_whitespace_is_collapsed_outside_quotes`,
`template_literal_value_whitespace_is_collapsed_outside_quotes`
— collapse part). **MISSING (engine, minor)** — no
collapsing anywhere in `extract/`/`resolve/`/`atom/`/`canon`;
twins mint distinct classes and distinct declarations.
Dedupe/normalization gap, not a paint bug.

---

## 4. Drop table (what v2 refuses → our verdict)

v2's `literal-evaluator.md` §"What doesn't fold" plus the drop
tests in `scope.rs`/`local_bindings.rs`. Our posture: warn
(`Dynamic non-literal…`, `Dynamic object spread…`, `Unknown
style property…`) and keep static siblings — fail closed with
a diagnostic where v2 usually drops silently.

| # | v2 drop shape | v2 test(s) | Ours |
|---|---|---|---|
| D1 | Free identifiers | `optional_chain_on_unresolvable_base_drops` (base part); evaluator note | **HAVE (blanket)** — "Dynamic non-literal identifier" warn (ATM-SITE-23's dynamic control, ATM-DIAG-02) |
| D2 | Mutated `let` | `let_mutated_drops_resolution`, `identifier_without_initializer_drops` (no-init twin), local `mutated_let_binding_is_skipped` (transform) | **MISSING (engine)** for mutation — stale-init resolve, no tracking (App. B); **MISSING (station-only)** for no-init (unrecorded → warns, unpinned) |
| D3 | Params without type-literal | `function_param_without_annotation_still_drops` + polish §59 drops | **HAVE (blanket)** — params unrecorded → generic warn (SITE-23, DIAG-02) |
| D4 | Half-foldable ternary / unfoldable logical-right | `ternary_with_one_unresolvable_branch_*` | **HAVE** — resolvable arm compiles, dynamic arm warns (row 32) |
| D5 | All-dynamic objects | evaluator note (lenient per-member) | **HAVE** — lenient spreads/objects keep static siblings (SITE-05); all-dynamic yields zero wants + warnings |
| D6 | Impure/unsupported callables (async/gen, rest/destructured params, loops, `.map`/`.reduce`, `Math.random`, `this`, assignment) | 20 helper refuse tests (row 52) | **HAVE (blanket)** — all call values warn-and-skip (SITE-04, LEAF-07, FORBID-02, NEO-SITE-06); per-shape pins proposed (ATM-SITE-32) |
| D7 | Bare function values | `function_expression_initializer_drops` | **MISSING (station-only)** — unrecorded init → warns (row 53) |
| D8 | `typeof` / `void` / `delete`, `Object.keys`, BigInt | evaluator note; `object_entries_factory_does_not_fold` | **HAVE (blanket)** for unknown-call/member forms via generic warn — **except** `typeof`/`void`-as-unary: `void` folds to null (deliberate, `walk.rs:317`), while `typeof x` walks `x` through the row-20 fallthrough (**MISSING (engine)** — fold into ATM-SITE-38) |
| D9 | Cyclic / self-referential consts | `cyclic_idents_drop_safely`, `self_referential_const_does_not_panic` | **MISSING (station-only)** — identifier inits are never recorded, so cycles are trivially safe + warn; unpinned, no recursion possible |
| D10 | Scalar alias chains (`const b = a`, `const color = referenced`, `const button = base`) | `object_alias_chain_resolves_whole_object` (chain part), `closure_captures_outer_const`, `chained_identifiers_resolve_transitively` (chain part) | **MISSING (engine)** — `record_declaration` ignores identifier inits (`collect.rs:48`), so the alias warns "Dynamic non-literal identifier" (proposed ATM-SITE-29; whole-object *uses* stay ABSENCE per SPEC) |
| D11 | Shadowed `undefined` param stays open | `a_local_binding_named_undefined_stays_open` | **MISSING (engine)** — we omit *any* ident named `undefined` (`walk.rs:301`, `ast_value.rs:267`) with no shadow check, silently nulling a shadowed param (App. B; absurd code, lowest priority) |
| D12 | `f?.()` optional call | `optional_pure_call_does_not_fold` | **HAVE (blanket)** — unhandled chain → generic warn-and-skip |
| D13 | Post-shadow / rename / raw-escape of local recipe bindings | all 13 `local_bindings.rs` | **ABSENCE** — transform-only product surface (`extract_for_transform`) over `cva`; we compile a sheet, we do not rewrite source (brief §New language) |

---

## 5. Proposed rows

IDs avoid landed ranges (`ATM-SITE-01..23`, `NEO-SITE-01..17`).
Order is filing order: station-only unions first (pure row work),
silent-hole fixes next (small engine + station), dialect-gated
language last (needs HQ decisions). No ledger rows filed by this
agent — these are proposals for the follow-up cooks.

### ATM-SITE-2x (Atomic stations; all start as extract tests, not Neo)

| ID | README first line | Input | Expected | v2 evidence |
|---|---|---|---|---|
| ATM-SITE-24 | Ternary-spread key collision unions every value in either order | `css({ padding: '0', ...(unk ? { padding: '1' } : { padding: '2' }) })` + before-order twin | 3 wants / 3 plans / 3 atoms, zero diagnostics; runtime picks by live value | `conditional_output.rs` L362, L388 |
| ATM-SITE-25 | Call-form `css([...])` arrays merge, never go responsive | `css([{ margin: '1r' }, { margin: '3r' }, false])` beside responsive-value control | Both objects emit unconditioned atoms, `false` skips silently, no breakpoint conditions (SPEC L215 finally pinned) | SPEC L215; `array_value` twin |
| ATM-SITE-26 | Unwrapped call args (`as const` / `satisfies` / `!` / parens) extract | `css({...} as const)`, `css(({...}))`, `satisfies`, `!`, `<any>{...}` in `.ts` | Same wants as bare arg; **engine**: unwrap in `handle_css_arg` (kills the silent skip) | `calls.rs` ts_*_unwraps ×5 |
| ATM-SITE-27 | Ternary mid-array slots and object-valued ternary arms | `padding: [2, c ? 2 : 3, 4]`; `color: d ? { base, _hover } : { base }`; elision hole control | Both arms want at the same breakpoint; object arms ride `when`; hole keeps arity, zero diagnostics | `array_mid_slot_ternary_*`, `ternary_with_object_branches`, `array_value_preserves_elision_holes` |
| ATM-SITE-28 | Mutated `let` bindings drop instead of resolving stale | `let color = 'red'; color = 'blue'; css({ color })` + unmutated `let`/`var` controls | Mutated warns + zero wants; unmutated resolve (**engine**: mutation tracking in `collect.rs`) | `let_mutated_drops_resolution`, `let/var_unmutated_resolves` |
| ATM-SITE-29 | Const-graph depth: alias chains, multi-hop members, member-hop spreads | `const b = a`; `tokens.colors.red`; `css({ ...styles.hover })`; inner/outer shadow pair | Chains and hops resolve; inner scope wins (no union bloat) (**engine**: chase + nesting + scoping) | `closure_captures_outer_const`, `static_member_access_resolves`, `member_hop_*`, `inner_scope_*` |
| ATM-SITE-30 | Micro-fold bundle: shorthand, unary −/+, static templates, no-arg and string-head calls | `{ color }`, `margin: -4`, `width: +50`, `` color: `red` ``, `css()`, `css('panda', {...})`, `cx('card', css({...}))` | All fold/skip as today, zero new warnings (pins accidental mechanisms before row 38 narrows them) | `calls.rs` micro tests; `shorthand_*` |
| ATM-SITE-31 | Pure-helper fold table, part 1 (needs dialect decision) | `() => 'red'`, `function` decl, both IIFEs, default/multi args, object-return spread into `css()` + JSX | Each folds; captures bake; every other shape still warns (**engine**: closed pure-fn lowering) | `scope.rs` 11 fold tests |
| ATM-SITE-32 | Pure-helper refuse pins (doom tripwires) | `Math.random`, `.map`/`.reduce`, `async`, loops, rest/destructured params, nested calls, spread args, `f?.()` | Every one warns + skips with siblings kept (pins today's blanket per-shape) | `scope.rs` 20 refuse tests |
| ATM-SITE-33 | Binary folds with JS coercion (needs dialect decision) | `1 + 'px'`, `2 * 3`, `'5' - 1`, `===`/`==`/`<`, `'foo' - 1`, `1 / 0` | Coercions fold per v2's `coerce_*`; NaN/∞ drop, never emit (copy `literal-evaluator.md` §JS semantics) | `calls.rs` binary ×10 |
| ATM-SITE-34 | Optional-chain unwrap on known objects | `tokens?.color`, `t?.colors?.red` (needs row 29), `maybe?.foo` drop control | Known-base folds, free-base warns + drops (**engine**: `ChainExpression` arm) | `optional_chaining.rs` ×4 |
| ATM-SITE-35 | Destructure binds const members (low priority — lib writes none) | `{ color }`, `{ primary: color }`, `{ color, ...space }`, `[a, b]`, `{ color = 'red' }` ×3 default twins | Bindings resolve incl. defaults (**engine**: `BindingPattern` collection) | `scope.rs` destructure ×5, `polish.rs` defaults ×3 |
| ATM-SITE-36 | Callee-identity micros bundle | `panda({...})`, `panda.somethingElse({...})`, block-scoped `const css`, `const a = a`, `a↔b` cycle, `let color;`, bare `getColor`, `tokens.colors.blue` miss | Each skips/warns exactly once with siblings kept (pins fail-closed mechanics) | `calls.rs` namespace ×2 + `scope.rs` drop micros |
| ATM-SITE-37 | Array spreads refuse with a diagnostic (kills silent mis-index) | `padding: [1, ...[2, 3], 4]`, `css([...base])` | Located warning naming the spread; no shifted atoms; wants/plans agree (**engine**: `SpreadElement` arm in both array walkers) | `literal_array_spread_inside_arg` |
| ATM-SITE-38 | Non-foldable unary refuses (kills wrong-value fallthrough) | `!true`, `!0`, `-ident`, `~x`, `typeof x` | Located warning, zero wants — `!true` must never emit `true` again (**engine**: narrow `handle_unary` fallthrough) | `unary_logical_not_on_literal` |

Deferred, not proposed: TS enums + param type-literals (recommend
approved absence — lib writes neither, §C); all-literal logical
short-circuit (paint-correct today, file when sheet diet matters);
whitespace collapsing (normalization, no paint bug); JSX-tag
shadowing + shadowed-`undefined` (absurd code — absence candidates).

### NEO-SITE-1x (browser cases; each waits its engine row)

Existing IDs avoided: `NEO-SITE-01..17`.

| ID | README first line | World | Assertion | Panda evidence |
|---|---|---|---|---|
| NEO-SITE-18 | Colliding ternary-spread color unions paint the live arm | `css({ color: 'a', ...(cond ? { color: 'b' } : { color: 'c' }) })` + before-order twin | Sheet carries all three atoms; runtime `cond` flip repaints b↔c; no ghost | `conditional_output.rs` L362/L388; waits ATM-SITE-24 |
| NEO-SITE-19 | Call-form array `css([...])` merges and paints every element | `css([{ color: 'red' }, { mt: '1r' }, false])` | Both utilities paint; `false` silent; nothing lands on a breakpoint | SPEC L215; waits ATM-SITE-25 |
| NEO-SITE-20 | `css({...} as const)` and siblings paint like the bare arg | `as const` / `satisfies` / paren-wrapped args | Same computed style as bare; no diagnostic | `calls.rs` ts_*_unwraps; waits ATM-SITE-26 |
| NEO-SITE-21 | Pure-helper value paints, impure-helper value warns (needs dialect decision) | `color: tone('600')` vs `color: pick(['a'])` with `Math.random` inside | Helper arm paints; impure arm mints no ghost + exactly one warning | `scope.rs` pure section; waits ATM-SITE-31/32 |
| NEO-SITE-22 | Runtime-`ok` logical spread paints-or-diagnoses | `css({ p: '1r', ...(ok && extra) })` with runtime `ok` | `extra` paints when live `ok` is truthy; warning fires; sync succeeds | `logical_and_spread_*`; engine covered by ATM-SITE-05 already |

---

## 6. Out of scope (do not mint cases)

Standing SITE SPEC rows + brief rulings, with the v2 tests they
absorb from the six walked files (68 absence verdicts).

| Topic | v2 tests absorbed | Why |
|---|---|---|
| Whole-object `css(styles)` / alias chains used whole | `const_object_identifier_resolves`, `chained_identifiers_*`, `object_alias_chain_*`, `object_destructure_rest_*` (use part), `skips_non_literal_arguments` (ident/member parts), `multi_arg_call_preserves_position_*` (slot part) | SITE SPEC approved absence (silent 0/0/0/0, documented) |
| Element access / computed keys | 12 `scope.rs` element tests + `chained_element_access_*`, 5 computed-key tests, `optional_computed_member_resolves` | SITE SPEC refusal rows (O1/O2/O3, O4); deliberate differ, brief §Probe findings |
| Interpolated template values | 5 scope/calls template-interp tests | SITE SPEC O8 refusal row |
| Literal-test pick-one / static-test collapse | 6 ternary fold-to-one tests + `conditional_spread_with_literal_test_*` | Decision D11 (both arms compile, runtime picks) |
| `css.raw` (+ chains, spreads, nesting) | 3 scope + 6 calls raw tests | SITE SPEC approved absence (`css.object()` + plain objects instead) |
| `cva` / `sva` / patterns / `styled()` / recipe invocation / JSX factories | `css_raw_spread_in_cva_base_*`, `pure_helper_folds_inside_cva_base` (host part), `conditional_inside_cva_recipe_base`, `zero_arg_pattern_call_*`, `namespace_raw_pattern_*`, `multi_arg_call_extracts_all_literal_args`, `non_literal_args_are_omitted_*`, `jsx_factory_*` ×2, `js_parity_namespace_pattern/recipe`, `keeps_no_arg_recipe_calls`, 3 polish factory tests | SITE SPEC out-of-scope table (Neo `recipe()`/primitives/`jsxElements`) |
| Source transform (local call bindings, raw opacity) | all 13 `local_bindings.rs` | Brief: we compile a sheet, we do not rewrite source |
| v2-internal diagnostic gating | `skips_unextractable_call_diagnostic_when_jsx_framework_is_configured` | Product diagnostic detail, not language |
| `css` tagged template | `css_tagged_template_does_not_extract` | HAVE, not absence — ATM-SITE-12 already refuses (listed here to stop re-filings) |

Not walked (brief scope): `jsx.rs`, `cross_file.rs`,
`first_that_works_calls.rs`, `framework_*`, `token_calls.rs`,
`raw_spreads.rs`, `import_map.rs`, `imports.rs` — prior absences
stand (SITE SPEC: Vue/Svelte, compiled runtimes, `importMap`,
`matchTag`, `token()` inlining).

---

## Appendix A — per-test verdict index (all 223)

`H` HAVE · `Ms` MISSING station-only · `Me` MISSING engine ·
`A` ABSENCE. Row = §3/§4 section.

### scope.rs (80): H27 · Ms9 · Me22 · A22

| Test | V | Row |
|---|---|---|
| const_string_identifier_resolves | H | 1 (SITE-06) |
| const_object_identifier_resolves | A | whole-object SPEC |
| chained_identifiers_resolve_transitively | A | whole-object use; chain D10 |
| chained_css_raw_spreads_resolve_transitively | A | css.raw SPEC |
| css_raw_spread_in_cva_base_folds | A | css.raw + cva SPEC |
| css_raw_spread_in_arbitrary_selectors_folds | A | css.raw SPEC |
| let_unmutated_resolves | Ms | 2 |
| let_mutated_drops_resolution | Me | D2, App. B |
| var_unmutated_resolves | Ms | 2 |
| shorthand_property_resolves_via_resolver | Ms | 1 |
| static_member_access_resolves | Me | 5 |
| missing_member_drops_call | Ms | warns "Dynamic non-literal", unpinned |
| computed_string_key_resolves | A | 8 |
| computed_identifier_key_resolves | A | 8 |
| computed_style_object_key_resolves | A | 9 |
| computed_style_object_key_resolves_inside_condition | A | 9 |
| array_numeric_index_resolves | A | 8 |
| inline_array_literal_numeric_index_resolves | A | 8 |
| inline_array_literal_indexed_by_identifier_resolves | A | 8 |
| array_string_numeric_index_resolves | A | 8 |
| inline_object_literal_element_access_resolves | A | 8 |
| element_access_with_concatenated_key_resolves | A | 8 |
| element_access_with_template_key_resolves | A | 8 |
| element_access_with_key_from_another_object_resolves | A | 8 |
| object_destructure_resolves_member | Me | 10 |
| object_destructure_with_rename_resolves | Me | 10 |
| object_destructure_rest_resolves | Me | 10 (rest; use is A) |
| object_destructure_computed_key_resolves | Me | 10 + 9 |
| array_destructure_resolves_index | Me | 10 |
| object_spread_of_local_identifier_resolves | H | 37 (SITE-11) |
| object_alias_chain_resolves_whole_object | A | whole-object use; chain D10 |
| function_parameter_shadows_css_import | H | 11 (SITE-10) |
| arrow_parameter_shadows_css_import | H | 11 (SITE-10) |
| block_scoped_const_shadows_outer | Ms | 12 |
| shadowed_call_does_not_block_outer_call | H | 11 (SITE-10) |
| jsx_attribute_resolves_identifier | H | 4 (SITE-06) |
| jsx_spread_of_local_identifier_resolves | H | SITE-11 input covers JSX spread |
| jsx_tag_shadowed_by_param_is_not_extracted | Me | 14 (absence candidate) |
| self_referential_const_does_not_panic | Ms | D9 |
| cyclic_idents_drop_safely | Ms | D9 |
| binary_with_identifier_operand_folds | Me | 21 |
| template_literal_with_identifier_interpolation_folds | A | 26 (O8) |
| template_literal_with_member_interpolation_folds | A | 26 (O8) |
| local_function_call_return_folds | Me | 50 |
| iife_folds | Me | 50 |
| local_function_declaration_call_folds | Me | 50 |
| pure_helper_param_template_folds_as_computed_key | Me | 51 |
| pure_helper_array_index_folds | Me | 50 |
| pure_helper_boolean_index_does_not_fold | H | 52 blanket |
| impure_math_random_helper_does_not_fold | H | 52 blanket |
| pure_helper_object_return_spreads_into_css | Me | 50 |
| pure_helper_object_return_spreads_into_jsx | Me | 50 |
| pure_helper_body_object_spread_does_not_fold | H | 52 blanket |
| pure_helper_default_and_multi_args_fold | Me | 50 |
| pure_helper_local_alias_does_not_fold | H | 52 blanket |
| nested_pure_call_in_body_does_not_fold | H | 52 blanket |
| object_entries_factory_does_not_fold | H | 52 blanket |
| rest_param_helper_does_not_fold | H | 52 blanket |
| member_callee_pure_helper_does_not_fold | H | 52 blanket |
| optional_pure_call_does_not_fold | H | 52 blanket (D12) |
| spread_args_pure_call_does_not_fold | H | 52 blanket |
| async_pure_helper_does_not_fold | H | 52 blanket |
| destructured_param_helper_does_not_fold | H | 52 blanket |
| multi_statement_body_helper_does_not_fold | H | 52 blanket |
| mutated_pure_helper_binding_does_not_fold | H | 52 blanket |
| function_expression_iife_folds | Me | 50 |
| class_static_method_reference_does_not_fold | H | 52 blanket |
| generator_helper_does_not_fold | H | 52 blanket |
| for_loop_helper_does_not_fold | H | 52 blanket |
| while_loop_helper_does_not_fold | H | 52 blanket |
| array_map_method_helper_does_not_fold | H | 52 blanket |
| array_reduce_method_helper_does_not_fold | H | 52 blanket |
| pure_helper_folds_inside_cva_base | Me | 50 (host A) |
| pure_helper_folds_inside_jsx_style_prop | Me | 50 |
| conditional_with_identifier_test_folds | A | 31 (D11) |
| inner_scope_shadows_outer_same_named_const | Me | 13 |
| closure_captures_outer_const | Me | D10 |
| function_expression_initializer_drops | Ms | 53 |
| identifier_without_initializer_drops | Ms | D2 |
| chained_element_access_on_resolved_object | A | 8 |

### calls.rs (79): H22 · Ms11 · Me21 · A25

| Test | V | Row |
|---|---|---|
| duplicate_object_keys_keep_first_position_with_last_value | H | 43 (MERGE-01) |
| string_value_whitespace_is_collapsed_outside_quotes | Me | 68 |
| template_literal_value_whitespace_is_collapsed_outside_quotes | Me | 25 + 68 |
| spread_overwrite_keeps_spread_position | H | 43 (MERGE-01) |
| empty_object_arg | Ms | 60 |
| literal_string_value | H | 60 (SITE-02) |
| named_raw_css_call_normalizes_to_imported_name | A | css.raw SPEC |
| aliased_raw_css_cva_and_sva_calls_normalize_to_imported_names | A | raw/cva/sva SPEC |
| zero_arg_pattern_call_emits_base_styles | A | patterns SPEC |
| namespace_raw_pattern_call_normalizes_to_property_name | A | patterns/raw SPEC |
| mixed_value_types | H | 60 + CSS-05 |
| nested_object_value | H | COND stations |
| array_value | H | 45 (LEAF-05) |
| aliased_local_binding | H | 61 (SITE-15) |
| multiple_calls_in_one_source | H | SITE-02 input |
| ignores_unmatched_callees | H | 63 (SITE-04) |
| skips_non_literal_arguments | Ms | ident/member A; `css(cond?a:b)` unpinned |
| skips_unextractable_call_diagnostic_when_jsx_framework_is_configured | A | v2-internal gating |
| keeps_no_arg_recipe_calls | A | recipe-invocation tracking (we compile definitions) |
| unresolvable_spread_is_skipped_keeping_static_props | H | 38 (SITE-05) |
| finds_calls_inside_jsx | H | 60 |
| finds_panda_call_nested_in_non_panda_call_args | Ms | 60 |
| finds_calls_inside_function_body | H | 60 (SITE-10 descent) |
| computed_keys_skip_extraction | H | 9 (O4, keeps siblings) |
| parse_error_surfaces_diagnostic | H | 65 (DIAG-03) |
| multi_arg_call_extracts_all_literal_args | A | styled() SPEC |
| non_literal_args_are_omitted_from_data | A | patterns SPEC |
| jsx_factory_property_call_extracts_recipe_config | A | jsx-factory SPEC |
| jsx_factory_call_tagged_template_does_not_extract | A | styled() SPEC |
| js_parity_namespace_css_aliases | H | 61 (css; cva/sva A) |
| js_parity_namespace_pattern | A | patterns SPEC |
| js_parity_namespace_recipe | A | recipe-invocation |
| namespace_property_outside_name_allowlist_is_skipped | Ms | 62 |
| called_namespace_alias_without_property_is_skipped | Ms | 62 |
| parenthesized_argument_unwraps | Me | 16 (silent) |
| ts_as_const_unwraps | Me | 16 (silent) |
| ts_satisfies_unwraps | Me | 16 (silent) |
| ts_non_null_unwraps | Me | 16 (silent) |
| ts_old_style_type_assertion_unwraps | Me | 17 (silent) |
| unary_negation_on_numeric_literal | Ms | 18 |
| unary_plus_on_numeric_literal | Ms | 19 |
| unary_logical_not_on_literal | Me | 20 (wrong value) |
| binary_string_concatenation | Me | 21 |
| binary_numeric_arithmetic | Me | 22 |
| template_literal_without_interpolation | Ms | 25 |
| template_literal_with_interpolation_is_skipped | A | 26 (O8) |
| literal_object_spread_inside_arg | H | 36 (SITE-05) |
| literal_array_spread_inside_arg | Me | 48 (silent mis-index) |
| computed_key_from_string_literal | A | 9 |
| computed_key_from_numeric_literal | A | 9 |
| computed_key_from_concatenation | A | 9 |
| string_coercion_on_addition | Me | 21 |
| numeric_coercion_in_arithmetic | Me | 22 |
| non_numeric_string_in_arithmetic_drops | H | 23 blanket |
| template_literal_with_literal_interpolations | A | 26 (O8) |
| conditional_with_literal_test | A | 31 (D11) |
| conditional_with_non_literal_test_emits_branches | H | 30 |
| logical_and_or_coalesce_with_literals | Me | 29 |
| strict_equality_on_literals | Me | 24 |
| loose_equality_with_coercion | Me | 24 |
| numeric_comparison | Me | 24 |
| string_comparison_is_lexicographic | Me | 24 |
| equality_inside_conditional_test | A | 31 (D11) |
| nested_unwraps_and_folding | Me | 15 H-part + 22 + 9 |
| no_args_call_does_not_extract | Ms | 66 |
| multi_arg_call_string_then_object | Ms | 64 |
| multi_arg_call_preserves_position_for_unresolvable_middle | A | whole-object slot |
| merge_two_inline_object_spreads_second_wins | H | 43 (MERGE-01) |
| raw_inside_raw_folds | A | css.raw SPEC |
| multiple_raw_spreads_in_one_object_merge | A | css.raw SPEC |
| raw_spread_inside_nested_selector | A | css.raw SPEC |
| conditional_spread_with_literal_test_folds_branch | A | 42 (D11) |
| array_value_preserves_null_elements | H | 46 (CSS-05) |
| array_unresolvable_element_becomes_null_slot | H | 46 (omit + warn) |
| array_value_preserves_elision_holes | Ms | 46 (arm exists) |
| multiline_template_literal_with_interpolation_folds | A | 26 (O8) |
| satisfies_operator_is_transparent_for_call_args | Me | 16 (silent) |
| non_null_assertion_unwraps_through_member_access | Me | 7 |
| css_tagged_template_does_not_extract | H | 67 (SITE-12) |

### conditional_output.rs (30): H20 · Ms4 · Me2 · A4

| Test | V | Row |
|---|---|---|
| ternary_with_non_literal_test_emits_both_branches | H | 30 |
| ternary_with_literal_test_still_picks_one_branch | A | 31 (D11) |
| ternary_with_one_unresolvable_branch_keeps_the_resolvable_one | H | 32 |
| ternary_with_unresolvable_alternate_keeps_the_consequent | H | 32 |
| ternary_with_equal_branches_collapses_to_a_single_value | H | 33 |
| ternary_in_jsx_attribute_emits_conditional | H | 30 (NEO-SITE-01 N1/N2/N7) |
| logical_and_with_unresolvable_left_emits_right_operand | H | 27 |
| logical_and_with_both_literal_emits_conditional | H | 30 (tests `?:`) |
| logical_or_with_literal_left_short_circuits | H | 28 |
| logical_or_with_unresolvable_left_emits_right_operand | H | 27 |
| nullish_coalesce_with_unresolvable_left_emits_right_operand | H | 27 |
| logical_and_spread_merges_the_right_operand_object | H | 39 (SITE-05/08) |
| logical_or_spread_merges_the_right_operand_object | H | 39 (SITE-05) |
| ternary_spread_with_same_key_emits_conditional_value | H | 40 (SITE-05) |
| ternary_spread_with_distinct_keys_merges_both_branches | H | 40 (SITE-05) |
| ternary_spread_colliding_with_static_parent_unions_all_values | Ms | 41 → SITE-24 |
| ternary_spread_before_a_colliding_static_key_still_unions_all_values | Ms | 41 → SITE-24 |
| nested_conditional_inside_object | H | 30 |
| constant_comparison_test_folds_to_chosen_branch | A | 31 (D11) |
| nested_ternary_with_static_tests_folds_to_one_branch | A | 31 (D11) |
| nested_ternary_emits_nested_conditional | H | 34 |
| nullish_coalesce_with_null_left_picks_right | H | 28 (guard) |
| logical_or_with_null_left_picks_right | H | 28 (guard) |
| ternary_with_mixed_type_branches_emits_conditional | H | 30 |
| multiple_conditionals_with_inline_spread_flatten_in_order | H | 30 |
| conditional_inside_cva_recipe_base | A | cva SPEC |
| ternary_with_object_branches | Ms | 35 → SITE-27 |
| nested_const_spread_keeps_conditional_encode_data | Me | 44 |
| array_mid_slot_ternary_projects_conditional_at_index | Ms | 47 → SITE-27 |
| member_hop_projects_nested_conditional | Me | 6 → SITE-29 |

### polish.rs (17): H5 · Ms0 · Me9 · A3

| Test | V | Row |
|---|---|---|
| enum_member_access_resolves | Me | 57 (propose absence) |
| numeric_enum_member_resolves | Me | 57 (propose absence) |
| enum_member_without_initializer_drops_that_path | Me | 57 (drop unpinned) |
| function_param_with_type_literal_resolves_member | Me | 58 (propose absence) |
| function_param_without_annotation_still_drops | H | 59 blanket |
| destructured_param_type_literal_binds_the_member_not_the_wrapper | Me | 58 (propose absence) |
| optional_type_literal_member_does_not_fold | H | 59 blanket |
| unfoldable_type_literal_member_leaves_siblings_unresolved | H | 59 blanket |
| function_param_with_non_literal_type_drops | H | 59 blanket |
| jsx_factory_names_are_explicitly_configured | A | factories SPEC (analog: jsxElements SITE-11/12) |
| custom_jsx_factory_extracts_member_chain | A | factories SPEC |
| custom_jsx_factory_excludes_default_styled | A | factories SPEC |
| destructure_default_kicks_in_when_key_missing | Me | 10 |
| destructure_default_skipped_when_key_present | Me | 10 |
| destructure_default_with_object_literal_value | Me | 10 |
| an_undefined_property_does_not_block_the_object | H | 3 (CSS-05) |
| a_local_binding_named_undefined_stays_open | Me | D11 (absence candidate) |

### local_bindings.rs (13): A13

All 13 (`collects_plain_calls_for_cva_binding`,
`shadowed_binding_is_not_collected_as_call`,
`rename_marks_other_references`, `member_raw_call_is_other_reference`,
`mutated_let_binding_is_skipped`, `extract_hot_path_keeps_local_bindings_empty`,
`collects_raw_calls_on_a_local_cva_binding`,
`a_bare_raw_reference_is_not_a_raw_call`,
`a_non_raw_member_call_is_not_a_raw_call`,
`an_optional_chained_raw_call_is_opaque`,
`raw_passed_as_a_value_is_opaque`, `a_direct_raw_call_is_not_opaque`,
`a_non_raw_member_access_is_not_opaque_raw`) — **ABSENCE**
(transform-only `extract_for_transform` over `cva`; D13).

### optional_chaining.rs (4): H1 · Ms0 · Me2 · A1

| Test | V | Row |
|---|---|---|
| optional_static_member_resolves_on_known_object | Me | 54 → SITE-34 |
| optional_computed_member_resolves | A | 56 (element access governs) |
| optional_chain_on_unresolvable_base_drops | H | 55 blanket |
| nested_optional_chain_resolves | Me | 54 → SITE-34 |

---

## Appendix B — engine soundness notes (verified in source, not implemented)

All read-only findings for the follow-up cooks; each names the
file and line.

**B1. Mutated `let` resolves its stale initializer.**
`collect_local_constants` records every `VariableDeclarator`
with an identifier binding and an init, with no kind check and
no mutation analysis (`collect.rs:34-46`; `grep -rni mutat
extract/` is empty). `let color = 'red'; color = 'blue';
css({ color })` emits the `'red'` atom with zero diagnostics —
v2 drops (`let_mutated_drops_resolution`). Fix direction: record
`let`/`var` only until an assignment, or drop them (proposed
ATM-SITE-28 files the decision either way).

**B2. `handle_unary` fallthrough mis-folds.**
`walk.rs:312-335`: `void` omits, `-<numlit>` negates, and
*everything else walks the argument* — so `!true` pushes want
`true`, `-space` (const `'2r'`) pushes the positive value,
`typeof x`/`~x` walk `x` as if the operator were absent.
`ast_value.rs:284` correctly returns `None` for the same
shapes, so wants and authored plans can also disagree here.
Fix direction: refuse with a diagnostic (proposed ATM-SITE-38);
folding real `!`/`~`/`typeof` is optional.

**B3. Array spreads silently mis-index.**
`ArrayExpressionElement::SpreadElement` yields `None` from
`as_expression()` (oxc `inherit_variants!`: only inherited
`Expression` variants return `Some`), so both
`responsive.rs:28-37` and `css/mod.rs:55-59` skip spreads
silently — while `enumerate` still consumes the slot. In
`padding: [1, ...[2,3], 4]`, `4` lands one breakpoint early
with no diagnostic, and the plan path (`ast_value.rs:93-105`)
collapses the whole array to `None`, leaving wants without
plans. Fix direction: refuse-with-diagnostic (proposed
ATM-SITE-37); v2 flattens literal spreads instead.

**B4. Inner-scope union over-emits.**
`insert_scalar` unions leaves across same-named bindings
(`index.rs:27`) and collection is scope-blind, so the shadowed
outer value emits an atom and a plan that can never match
(row 13). Bloat, not mispaint. Fix with row 29's scoping or
accept and document.

**B5. Shadowed `undefined` is silently nulled.**
`walk.rs:300`, `ast_value.rs:267`, `collect.rs`' leaf paths
treat any ident spelled `undefined` as null/omit with no
shadow check — `function paint(undefined) {
css({ color: undefined }) }` extracts nothing *correctly by
accident* (v2: stays open, D11) but for the wrong reason, and
a const overlapping the name would confuse plans. Absurd
code; absence candidate (D11).

**B6. Call-arg silent skip (row 16 restated).**
`handle_css_arg`'s `_ => {}` (`css/mod.rs:37`) silently drops
not only unwrapped args but *any* non-object/array/ternary
arg — including, notably, nothing else common. The fix
(unwrap-then-match) is one row (ATM-SITE-26); no broader
arg-language change is proposed.

---

## Appendix C — lib/Book grep evidence (residue #6)

All run 2026-09-18 from the workspace root against
`packages/reference-lib/src`:

| Shape | Grep | Result |
|---|---|---|
| TS enums | `grep -rn '^enum \|^export enum \| enum [A-Z]'` over `src/` + `components/` | **0 matches** — lib declares no enums |
| Param type-literals | `grep -rn 'props: {' src/` | **0 matches** |
| Const-destructure-for-styles | `grep -rn 'const { [a-zA-Z]*(color\|padding\|margin\|bg\|width\|size\|space\|theme\|token)'` | **0 matches** |
| Destructure in stories | `grep -rn 'const {'` over `*.book.tsx` | **0 matches** |
| `css()` calls in lib | `grep -rln 'css(' src/` | **0 files** — lib authors `css={{…}}` props + StyleProps, never `css()` |
| Destructure defaults (any) | hook-destructure defaults; component prop defaults | Hook defaults: 0. Prop-param defaults exist (`disabled = false` in `Accordion.tsx:25`; `color = 'reference.highlight', ...styleProps` in `MonoText.tsx:17`) — component props, not style consts; v2's destructure tests are const-object forms |
| `?.` in styles | `grep -rn --include='*.tsx' --include='*.ts' '?.'` (excluding tests/stories/e2e) | Only runtime logic (`context?.orientation`, `onChange?.()`, `targetTab?.focus()` in `Tabs.tsx`) — never a style position |
| Ternary/condition props (already HAVE) | `cursor={isDisabled ? …}` (`Tree.tsx:169`), `_focusVisible={combobox ? {…} : {…}}` (`Listbox.tsx:165`), `opacity: isActive ? 0.75 : 0.65`, `_hover={{…}}` in Tree/Calendar/Combobox.book | Everyday lib idiom — covered by ATM-SITE-21/23 + NEO-SITE-01/15/17 |

Conclusion: enums, param type-literals, and const-destructuring
are absent from everything lib/Book authors. Per the brief's
residue-#6 rule ("only if lib/Book actually writes them, grep to
prove"), no cases are proposed for ENUM/TYPELITERAL — the
recommendation is approved absence via the dialect agent — and
DESTRUCT stays a single low-priority grouped row (ATM-SITE-35).
