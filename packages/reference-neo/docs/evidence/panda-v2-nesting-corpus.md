# Panda v2 nesting corpus probe (`nested_selector_parity.rs` + `atomic.rs` skim)

Corpus: `vendor/panda/crates/pandacss_stylesheet/tests/nested_selector_parity.rs` (61 snapshot tests) + author-language skim of `tests/atomic.rs` (16 of 53) + `pandacss_encoder/tests/encode.rs` Conditional arms (5 of 22) as IR reference.
Lib-sheet spot-check: `packages/reference-lib/.reference-ui/styled/styles.css` (1454 lines; identical `react/` twin). Book: **zero** `&` nesting keys — "lib or Book writes" below means lib `src` only.
Mission: `docs/missions/panda-v2-parity.md` §Further-agents item 2 (combinator agent). Read-only; no ledger rows filed.

Verdicts: **HAVE** (cited) / **IN-DIALECT-MISSING** (lib writes it, we don't pin it) / **ABSENCE-or-unused** (neither lib nor Book writes it — dropped per the brief's rule).

---

## 1. Executive summary

**Counts: 61 shapes → 20 HAVE / 1 IN-DIALECT-MISSING / 40 ABSENCE-or-unused.**

Lib authors a tiny `&` vocabulary (28 keys, all **one level deep**, in 6 files): `&:focus[:hover]` chains, `&[data-*]` (+ `:focus` suffixes), `& > …` / `& …` flat comma groups with `:not(:only-child)` / `:first-child` / `:last-child`, one `&:focus-visible > [data-slot]` (Tree), and one functional-pseudo nest — `&:where(:has(> …))` (button.ts:29). Everything v2 snapshots beyond that (self-`&` inside `:is()`/`:not()`/`:has()`, `&&`/`&&&`, tag/class compounds, no-space combinators, 3-deep stacks, `:is()`-wrapped re-nesting) has **zero** lib/Book authorship and is dropped, not cased.

The single missing shape is the one lib line the engine never proves: css()-nested **`&:where(:has(> [data-slot="icon"]:only-child, > svg:only-child))`** (icon-only button collapse). `:where(` output is HAVE (NEO-COND-11 twins, PARITY P3 theme pin) and `:has(` is HAVE in globalCss (NEO-GLOBAL-10) — but the authored `&`-nested `&:where(:has())` substitution has no Atomic station and no Neo browser case. Proposed: one ATM-COND-2x station first, one NEO-COND-1x paint case second (§6).

Nesting depth finding: v2's 3-deep stacks and `:is()`-wrapped re-nesting (`nested_multi_ampersand_under_descendant_parent_uses_is`, `nested_sibling_ampersands_under_child_parent_uses_is`) encode a real semantic — re-`&` under a combinator parent must distribute — but no lib author nests past one level and ATM-COND-14 pins two. Absence until an author asks.

`atomic.rs` skim: value ternary / `&&` / `??`, multi-arg `css(a,b)`, and scalar dedupe are all HAVE; the live residue (union-on-colliding-spread, call-site `css([...])` merge list, array-in-conditional staying a merge list) belongs to the **fold-table agent's** slice — pointers in §4, not proposed here. `encode.rs` Conditional expansion (both arms, condition kept, per-arm `!important`) matches our SITE-01/17 + SEAM-03 behavior; keep as IR reference.

---

## 2. File map

| Path | n used | Family | One-line |
|---|---|---:|---|
| `pandacss_stylesheet/tests/nested_selector_parity.rs` | 61/61 | COND / CSS-CORE | `css({ '<selector>': { color } })` → one `@layer utilities` snapshot each; the combinator dictionary |
| `pandacss_stylesheet/tests/atomic.rs` (skim) | 16/53 | SITE / LEAF / UNIT / NAME | Value ternary/`&&`/`??`, `css(a,b)` merge, scalar dedupe, vendor-prefix names. Skipped per brief: `@property`/polyfill, token/category, breakpoint/range, recipe-dedupe, sort/minify |
| `pandacss_encoder/tests/encode.rs` (IR ref) | 5/22 | SITE | `Literal::Conditional` → both arms as atoms, surrounding condition kept, per-arm `important` |

Lib-sheet counts this session (`styled/styles.css`, occurrences): `:is(` 123 · `:where(` 10 · `:has(` 9 · `:not(` 86 · `::before` 5 · `::after` 3 · `>` 17 · `+` 1 (a `calc()`, no sibling combinator) · `~` 0 · comma 748. Emitted sheet carries no `&` (nesting already resolved); `&` usage below is grepped from lib `src` author keys.

---

## 3. Parity table by family

Proof tags mirror the v1 corpus: **rust** (Atomic station) / **browser** (Neo Playwright) / **sheet** (stylesheet text pin). "lib" = author key in lib `src`, or emitted-sheet evidence where noted.

### 3.1 Pseudo single + comma (v2 tests 1–2)

| Shape (v2 test) | Input → expected | lib writes? | Ours | Verdict |
|---|---|---|---|---|
| `&:hover` (`…_with_pseudo`) | `&:hover` → `.cls:hover` | yes (`&:focus`, inputs.ts ×6) | NEO-COND-01, ATM-COND-02/10 | **HAVE** — **browser**/**rust** |
| `&:hover, &:active` (`…_comma_list_pseudos`) | comma → two selectors, one class | yes (comma groups button.ts, Listbox) | NEO-COND-09, ATM-COND-14 | **HAVE** — **browser**/**rust** |

### 3.2 BEM / ancestor sandwich (v2 tests 3–4)

| Shape (v2 test) | Input → expected | lib writes? | Ours | Verdict |
|---|---|---|---|---|
| `&_elem` (`…_bem_elem_shorthand`) | `&_elem` → `.cls_elem` | no | — | **ABSENCE-or-unused** |
| `body &:hover b` (`…_ancestor_and_pseudo`) | ancestor + `&` + descendant | no | (ancestor-only tail is HAVE via COND-20; sandwich unused) | **ABSENCE-or-unused** |

### 3.3 Sibling combinators (v2 tests 5–6, 20–21, 32)

| Shape (v2 test) | Input → expected | lib writes? | Ours | Verdict |
|---|---|---|---|---|
| `& + &` (`…_adjacent_sibling_ampersands`) | `.cls + .cls` | no (sheet: zero sibling `+`) | NEO-PARITY P2 **paints** (world `css({ '& + &': … })` ×4 parity worlds) | **HAVE** — **browser** (engine emits; author-absent but proven) |
| `& ~ .sibling` (`…_general_sibling`) | `.cls ~ .sibling` | no (sheet: zero `~`) | ATM-LAYER-09 (`:is()`-wrap under comma parents), ATM-UNIT-03 (`& ~ &` numerics) — both globalCss | **HAVE** — **rust** (css() spelling unpinned; same substitution) |
| `& ~ &` (`…_between_ampersands`) | `.cls ~ .cls` | no | same as above | **HAVE** — **rust** |
| `&&+&` (`…_chained_adjacent…`) | `.cls.cls+.cls` | no | — | **ABSENCE-or-unused** |
| `&+&` (`…_no_spaces`) | no-space ≡ spaced | no (lib writes spaced `& > …` only) | spaced form HAVE; normalization unpinned | **ABSENCE-or-unused** |

### 3.4 Tail `&` / parent keys (v2 tests 7–8, 46)

| Shape (v2 test) | Input → expected | lib writes? | Ours | Verdict |
|---|---|---|---|---|
| `.b &` (`…_one_level`) | `.b .cls` | no (condition-form `_groupHover` instead) | ATM-COND-20, NEO-COND-05 (`input:hover &`) | **HAVE** — **browser**/**rust** |
| `.something > &` (`…_with_child_combinator`) | `.something > .cls` | no | ATM-COND-20, NEO-COND-10 (`:focus > &`) | **HAVE** — **browser**/**rust** |
| 3-level `&:hover`→`& .b`→`.c &` (`…_three_levels`) | `.c .cls:hover .b` | no (lib max depth 1) | ATM-COND-14 pins 2 levels | **ABSENCE-or-unused** |

### 3.5 Two-level pseudo/descendant stacks (v2 tests 9–13)

| Shape (v2 test) | Input → expected | lib writes? | Ours | Verdict |
|---|---|---|---|---|
| `&:hover`→`&::before` (`…_hover_before`) | `.cls:hover::before` | no raw; `_before`+`_hover` is the dialect | NEO-COND-08 (before/after + sort after pseudo-classes) | **HAVE** — **browser** |
| `&:last-child`→`& .divider` (`…_descendant_space`) | `.cls:last-child .divider` | flat halves only | ATM-COND-14 **exact input** | **HAVE** — **rust** |
| `&:last-child`→`& > .divider` (`…_descendant_child`) | `.cls:last-child > .divider` | flat halves only | ATM-COND-14 family + NEO-COND-06 (`& > p`) | **HAVE** — **rust**/**browser** |
| `&:hover`→`& .child` (`…_hover_child`) | `.cls:hover .child` | flat halves only | same family | **HAVE** — **rust** |
| `& .divider`→`&:last-child` reversed (`…_reversed_author_order`) | `.cls .divider:last-child` (author order kept) | no | ATM-COND-14 author-order contract | **HAVE** — **rust** |

### 3.6 Comma descendant lists (v2 tests 15–16)

| Shape (v2 test) | Input → expected | lib writes? | Ours | Verdict |
|---|---|---|---|---|
| `& .one, & .two` (`…_comma_descendant_list`) | two selectors, one class | yes (button.ts `& > …, & > …`; Listbox `& […], & […] *`) | ATM-COND-14 comma scoping | **HAVE** — **rust** |
| `& .child` (`…_plain_selector…`) | `.cls .child` | yes (Listbox `& .ref-span`, `& [data-slot="description"]`) | ATM-COND-14; NEO-COND-06 (`>` twin) | **HAVE** — **rust** |

### 3.7 `&` inside attribute strings (v2 tests 17–18, 51 + atomic.rs cousin)

| Shape (v2 test) | Input → expected | lib writes? | Ours | Verdict |
|---|---|---|---|---|
| `&[data-category="sound & vision"]` (dquote) | `&` literal in value; class escapes it | values carry `&`? no; attr keys yes (`&[data-state="open"]`, disclosureChrome) | ATM-COND-14 attr-literal arm (`'&[data-x="a & b"]'`) | **HAVE** — **rust** |
| `&[data-category='Sound & Vision']` (squote) | same, single quotes | — | same arm | **HAVE** — **rust** |
| `& b[a="a&b"]` (`…_descendant_attr…`) | literal under descendant | — | same arm | **HAVE** — **rust** |

v2 also pins this at the atomic level (`atomic.rs: configured_condition_ignores_ampersand_inside_attribute_value`); ours is the COND-14 arm. Plain `&[data-…]` keys are HAVE twice over (ATM-COND-09 flat, NEO-COND-07 quoted round-trip).

### 3.8 `:not()` with `&` (v2 tests 14, 26–27, 37)

| Shape (v2 test) | Input → expected | lib writes? | Ours | Verdict |
|---|---|---|---|---|
| `&:not(&.no)` (`…_not_with_ampersand`) | self-`&` substituted *inside* `:not()` | no (`:not(:only-child)` written, never `:not(&…)`) | plain `&:not(:first-child)` HAVE (ATM-COND-14 comma input); self-substitution unpinned | **ABSENCE-or-unused** (self-`&` form) |
| `&.b :not(& + &)` / `&.b:not(& + &)` | combinator `&`s inside `:not()` | no | — | **ABSENCE-or-unused** |
| `&:not(&)` (`…_not_root_ampersand`) | `.cls:not(.cls)` | no | — | **ABSENCE-or-unused** |

Note: sheet carries `:not(` ×86, all without `&` — substitution-inside-`:not()` is engine behavior no author triggers.

### 3.9 `:is()` with `&` (v2 tests 29, 31, 36, 48)

| Shape (v2 test) | Input → expected | lib writes? | Ours | Verdict |
|---|---|---|---|---|
| `&.b :is(&)` / `&.b:is(&)` / `&:is(.bar, &.baz)` | self-`&` substituted inside `:is()` | no (field.ts writes `:is(` in **global** selectors, never `&`-nested) | emitted `:is()` twins HAVE (NEO-COND-01/03, ATM-COND-02); global `:is(` passthrough HAVE (PARITY F12 census); authored-nested form unpinned | **ABSENCE-or-unused** (authored form) |
| `&:last-child`→`& :is(.a, .b)` (`…_pseudo_then_descendant`) | `.cls:last-child :is(.a, .b)` | no | same coverage as above; would ride a §6 station if ever authored | **ABSENCE-or-unused** |

### 3.10 `:where()` / `:has()` with `&` (v2 tests 19, 34) — the missing shape

| Shape (v2 test) | Input → expected | lib writes? | Ours | Verdict |
|---|---|---|---|---|
| `&:where(h1)` (`nested_where`) | `.cls:where(h1)` | **yes, the `:has()` form** — button.ts:29 | emitted `:where(` HAVE (NEO-COND-11 group/peer twins; PARITY P3 theme pin) but **no** css()-nested authored `&:where(` station | **IN-DIALECT-MISSING** — see §6 R1/R2 |
| `&:has(&, :not(&))` (`…_has_with_not…`) | self-`&` inside `:has()` | no (`:has(` written in global + once nested **without** self-`&`) | `:has(` globalCss HAVE (NEO-GLOBAL-10 bezel, PARITY P-worlds); self-`&` form unpinned | **ABSENCE-or-unused** (self-`&` form) |

Full input/expected for the missing shape (lib's actual line, `packages/reference-lib/src/core/theme/primitives/forms/button.ts:29`):

Input:
```ts
css({
  '&:where(:has(> [data-slot="icon"]:only-child, > svg:only-child))': {
    paddingInline: '0', aspectRatio: '1 / 1', width: 'auto',
  },
})
```
Expected (emitted sheet today, styles.css L63 — the rule exists via the theme path; the css()-nested authoring is what lacks a station):
```css
.ref-button:where(:has(> [data-slot="icon"]:only-child, > svg:only-child)) {
  padding-inline: 0; aspect-ratio: 1 / 1; width: auto;
}
```
Family tag: **COND** (nested functional pseudo) — proof **rust** first (substitution inside `:where(`/`:has(` + `>` + `:only-child` + comma scoping inside the functional arg), then **browser**.

### 3.11 `&&` compounds (v2 tests 22–23, 30)

| Shape (v2 test) | Input → expected | lib writes? | Ours | Verdict |
|---|---|---|---|---|
| `&&` / `&&&` / `&.b&` | specificity stacking `.cls.cls…` | no (zero `&&` in src/Book) | — | **ABSENCE-or-unused** |

### 3.12 Tag / class / body compounds (v2 tests 24–25, 28, 33, 52–55)

| Shape (v2 test) | Input → expected | lib writes? | Ours | Verdict |
|---|---|---|---|---|
| `&html` / `html&` / `body&` / `.foo&` | `.clshtml` / `html.cls` / … | no | — | **ABSENCE-or-unused** |
| `&.b &` (`…_then_descendant_ampersand`) | `.cls.b .cls` | no | — | **ABSENCE-or-unused** |
| `&h1, &h2` / `&+.baz, &.qux` / `&>.bar` | compound + comma / no-space `&+` `&>` | no (lib commas are spaced `& >`/`& `) | comma scoping HAVE (COND-14); compound/no-space unused | **ABSENCE-or-unused** |

### 3.13 Multi-`&` in one selector (v2 test 35)

| Shape (v2 test) | Input → expected | lib writes? | Ours | Verdict |
|---|---|---|---|---|
| `& .bar & .baz & .qux` | three substitutions | no | — | **ABSENCE-or-unused** |

### 3.14 Pseudo-elements (v2 tests 38–45)

| Shape (v2 test) | Input → expected | lib writes? | Ours | Verdict |
|---|---|---|---|---|
| `&::after` (`…_compound_after`) | `.cls::after` | no raw `&::` key (`_after` is the dialect; sheet `::after` ×3) | NEO-COND-08 (`_before`/`_after` paint + sort) | **HAVE** — **browser** (raw spelling unpinned; same lowering) |
| `&::before`→`&:focus` / `&::after`→`&:hover` | pseudo-class reorders before pseudo-element (`:focus::before`) | no | NEO-COND-08 sort semantics | **HAVE** — **browser** |
| `&::before, &::after` | comma pseudo-element list | no | NEO-COND-08 both arms + COND-09 comma family | **HAVE** — **browser** |
| `& ::after` (`…_descendant_after`) | `.cls ::after` (descendants' markers!) | no — and semantically ≠ `_after` | — | **ABSENCE-or-unused** (genuinely different selector; no author) |
| `::before&` / `:before&` / `::before &` | suffix/descendant pseudo-element parents | no | — | **ABSENCE-or-unused** |

### 3.15 Misc singletons (v2 tests 47, 56)

| Shape (v2 test) | Input → expected | lib writes? | Ours | Verdict |
|---|---|---|---|---|
| `&(:focus)` (`…_host_functional_pseudo`) | `.cls(:focus)` (custom-element `:host()`-ish) | no | — | **ABSENCE-or-unused** |
| `&` standalone (`…_standalone_ampersand`) | `.cls` (self) | no | — | **ABSENCE-or-unused** (trivially self; no author) |

### 3.16 Comma groups with bare members + nested comma (v2 tests 57–59)

| Shape (v2 test) | Input → expected | lib writes? | Ours | Verdict |
|---|---|---|---|---|
| `&:not(:first-child), :only-child` → second member scopes as **descendant** (`.cls :only-child`) | bare-member scoping rule | no (every lib comma member carries `&`) | ATM-COND-14 pins all-`&` scoping only | **ABSENCE-or-unused** (nearest engine-behavior gap; cheap pin if HQ wants it — not proposed, no author) |
| above → nested `& .left-border` (comma × nesting distributive) | cross-product selectors | no | — | **ABSENCE-or-unused** |
| `& .one, .two` (mixed) | `.cls .one, .cls .two` | no | — | **ABSENCE-or-unused** |

### 3.17 Deep stacks (v2 tests 49–50)

| Shape (v2 test) | Input → expected | lib writes? | Ours | Verdict |
|---|---|---|---|---|
| `& .b`→`& .c`→`& .d` (3-deep unwrap) | `.cls .b .c .d` | no (depth ≤ 1) | COND-14 pins 2 levels | **ABSENCE-or-unused** |
| `& > .row`→`& > .cell` (child stack) | `.cls > .row > .cell` | no | — | **ABSENCE-or-unused** |

### 3.18 `:is()`-wrapped re-nesting under combinator parents (v2 tests 60–61)

| Shape (v2 test) | Input → expected | lib writes? | Ours | Verdict |
|---|---|---|---|---|
| `& .divider` → `& .bar & .baz` ⇒ `:is(.cls .divider) .bar :is(.cls .divider) .baz` | v2 wraps combinator parents in `:is()` on re-substitution | no | Our `:is(`-wrap precedent is globalCss-only (ATM-LAYER-09); css() re-nesting unpinned | **ABSENCE-or-unused** (real semantic; zero authors; absence until one asks) |
| `& > .row` → `& + &` ⇒ `:is(.cls > .row) + :is(.cls > .row)` | same | no | same | **ABSENCE-or-unused** |

---

## 4. `atomic.rs` author-language skim (16 tests)

Not nesting, but the brief's skim list. Residue that is really fold-language is pointer-only — the fold-table agent owns those rows.

| Shape (v2 test) | Input → expected | Ours | Verdict |
|---|---|---|---|
| value ternary both arms (`value_level_ternary…`) | `margin: cond ? '3' : '5'` → `.m_3` + `.m_5` | NEO-SITE-01, ATM-SITE-17, ATM-SEAM-03 | **HAVE** — **browser**/**rust** |
| value `&&` right operand (`value_level_logical_and…`) | `margin: cond && '3'` → `.m_3` only | NEO-SITE-08 (`...(ok && extra)`), ATM-LEAF-04/08 falsy guards | **HAVE** |
| value `??` fallback (`value_level_nullish…`) | `margin: maybe ?? '3'` → `.m_3` | ATM-LEAF-04 (`css-fallback.ts`, `or-nullish.tsx`: "`||` and `??` collect both arms") | **HAVE** — **rust** |
| `css(a, b)` merge (`multi_arg_css…`) | two args → both atom sets (runtime last-wins) | ATM-SITE-02 (multi-arg traversal) | **HAVE** — **rust** |
| 4-arg `css` (`four_args_css…`, no 3-cap) | all four emit | ATM-SITE-02 (no cap stated) | **HAVE** — **rust** |
| arg-level `&&` (`arg_level_logical_and…`) | `css({...}, cond && {...})` → right object merged | ATM-SITE-02 (conditional args both branches) + ATM-SITE-05 spreads | **HAVE** — **rust** |
| conditional spread (`conditional_spread…`) | `...(c ? {p:'2'} : {p:'3'})` → `.p_2` + `.p_3` beside statics | ATM-SITE-05 (spread unpack + conditional spreads) | **HAVE** — **rust** |
| conditional-spread **key collision union** (same test's sharper reading; mission residue #2) | `color:'a'` + spread-ternary `color:'b'/'c'` → **all three** atoms, order-independent | no station names the union | fold-table slice — pointer only, not proposed here |
| array `css([...])` merge list (`array_css_arg_is_a_merge_list…`) | `css([{m:'1'},{m:'3'},false])` → `.m_1` + `.m_3`, no `@media`, falsy skipped | ATM-SITE-19 covers JSX `css={[...]}`; call-site `css([...])` thin (mission residue #3) | fold-table slice — pointer only |
| array-in-conditional stays merge list (`array_nested_in_a_conditional…`) | `css(c ? [a,b] : d)` → all unconditional | same family as above | fold-table slice — pointer only |
| conditional element in array (`array_css_arg_with_conditional_element…`) | flatten array, expand ternary element | same family | fold-table slice — pointer only |
| scalar dedupe (`numeric_and_string_scalars…`) | `padding: 1` + `padding: '1'` → one `.p_1`; `lineHeight: 2/'2'` → one rule | ATM-UNIT-02 (canonicalise to one atom) | **HAVE** — **rust** |
| token scalar dedupe (`numeric_and_string_token_values…`) | `margin: 4/'4'` → token wins over px, one rule | ATM-UNIT-02 + UNIT-03 ("tokens still win on the stem") | **HAVE** — **rust** |
| JS-number-string coerce (`js_number_string_forms…`) | `'1e3'`/`'.5'` → `Number()` → px, dedupe with bare | **Approved divergence**: ATM-UNIT-02 *refuses* non-canonical numerics (`01`, `Infinity`, `NaN`, `0x10`) with a diagnostic — fail-closed, not coerce | **ABSENCE** (deliberate; do not "fix" toward v2) |
| vendor-prefix names (`vendor_prefixed_property…`) | `WebkitBackgroundClip` → `.-webkit-background-clip_text` | NEO-PARITY P18 ("vendor hyphenation passes through, lowercase-w Neo spelling") | **HAVE** w/ divergence note — **browser** |

Skipped per brief: `@property` pruning / polyfill, token-category/semantic/opacity, breakpoints/ranges, recipe-dedupe, sort/minify, `escapes_*` name-grammar (ours: ATM-NAME-*).

---

## 5. `encode.rs` Conditional expansion — IR reference

Five tests (`value_level_conditional_expands_both_branches`, `nested_conditional_expands_every_branch`, `conditional_under_a_condition_keeps_the_condition_on_both_branches`, `conditional_branch_important_is_preserved`, `fused_walker_also_expands_conditionals`) pin v2's IR contract:

- open ternary → **one atom per arm** (nested ternary → all leaves);
- a surrounding `_hover` stays on **every** arm's condition list;
- `!important` is **per-arm** metadata (`important: true` on the red arm only);
- the fused walker expands identically (no second semantics).

Ours matches behaviorally: SITE-01/17 (both arms, browser), SEAM-03 (one plan per arm), CSS-08 (`!` spellings incl. per-arm importance). Keep this section as the IR reference when the fold-table agent writes the Conditional rows — no new case from this probe.

---

## 6. Proposed rows (unfiled — read-only probe)

World/assertion shape mirrors §4 of the v1 core corpus. File only after the dialect agent (mission item 3) confirms `&`-nested functional pseudos stay in-dialect (expected: yes — lib already ships the line).

| ID (next free) | README first line | World | Assertion | Panda evidence |
|---|---|---|---|---|
| ATM-COND-2x | css()-nested `&:where(:has(> …))` substitutes inside the functional arg | `css({ '&:where(:has(> [data-slot="icon"]:only-child, > svg:only-child))': { paddingInline: '0' } })` (button.ts:29 verbatim) | sheet carries `.cls:where(:has(> [data-slot="icon"]:only-child, > svg:only-child))`; class stem escapes parens/commas/`>` per NAME grammar; zero diagnostics | `nested_selector_parity.rs: nested_where` + `nested_has_with_not_ampersand_list` (arg-position substitution); `[lib]` button.ts:29, styles.css L63 |
| NEO-COND-1x | icon-only `:where(:has())` collapse paints | icon-only button vs labelled button, both with the nested key | icon-only computes `padding-inline: 0` + square ratio; labelled keeps text padding; sheet has one `:where(:has(` rule | ATM-COND-2x above; `[lib]` button.ts:29 |

Explicitly **not** proposed (rule-pure absences): `&&`/`&&&`, tag/class/body compounds, no-space `&+`/`&>`, self-`&` inside `:is()`/`:not()`/`:has()`, `& ::after` descendant markers, `::before&` family, `&(:focus)`, standalone `&`, bare-member comma scoping, 3-deep stacks, `:is()`-wrapped css() re-nesting. If HQ ever wants the cheapest engine-behavior pin among them, it is bare-member comma scoping (§3.16) — one station, no author needed.

Fold-table handoffs (not mine to row): colliding-spread union (§4), call-site `css([...])` merge list + array-in-conditional (§4).

---

## 7. Out of scope (not parity)

| Feature | Why Reference will not chase it | Corpus tests |
|---|---|---|
| `&&` / `&&&` specificity stacking | Zero lib/Book authorship; zero-count shape | `…_double/triple_ampersand_compound`, `…_double_compound_ampersand`, `…_chained_adjacent…` |
| Tag/class/body `&` compounds (`&html`, `html&`, `.foo&`, `&h1`) | Zero authorship; not Reference dialect | `…_compound_tag_suffix/prefix/list`, `…_compound_body/class_suffix…` |
| Self-`&` inside `:is()` / `:not()` / `:has()` | Zero authorship; engine emits these functionals but never nests self-`&` in them | `…_not/is/has…ampersand…` (7 tests) |
| No-space combinators (`&+&`, `&>.bar`, `&+.baz`) | Lib writes spaced forms only; spaced forms proven | `…_no_spaces`, `…_no_space`, `…_compound_combinator_list` |
| `&`-sandwich / both-sides parents (`body &… b`, `&.b &`) | Zero authorship; one-sided tails proven (COND-20/05/10) | `…_ancestor_and_pseudo`, `…_compound_then_descendant…` |
| Descendant pseudo-element `& ::after`, `::before&` family | Zero authorship; `_before`/`_after` cover the dialect spelling | `…_descendant_after/before`, `…_compound_suffix…` (×2) |
| `&(:focus)` host-functional | Zero authorship; custom-element shape | `…_host_functional_pseudo` |
| Standalone `&`, BEM `&_elem` | Zero authorship; trivially self / BEM sugar | `…_standalone_ampersand`, `…_bem_elem_shorthand` |
| Bare-member comma scoping + nested comma cross-products | Zero authorship (all lib comma members carry `&`); all-`&` scoping proven (COND-14) | `…_scopes_member_without…`, `…_with_descendant_nesting`, `…_mixed_ampersand_and_class` |
| 3-deep `&` stacks, `:is()`-wrapped css() re-nesting | Lib nests ≤ 1 level; 2 levels proven (COND-14) | `…_three_levels`, `…_deep_unwrap_stack`, `…_child_combinator_stack`, `…_uses_is` (×2) |
| `firstThatWorks` / `viewTransition` / polyfill / transform | Per mission brief: dialect decision / out; not walked | (other files; untouched) |
| JS-number-string coerce (`'1e3'` → px) | Approved divergence: UNIT-02 refuses non-canonical numerics (fail-closed) | `atomic.rs: js_number_string_forms…` |
