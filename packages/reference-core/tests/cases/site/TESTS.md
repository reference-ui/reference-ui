# SITE ledger

| id | claim | status | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| CORE-SITE-01 | Literal ternary: both arms compile; the runtime-chosen arm paints; the other atom exists unused | done | ATM-SITE-05 + RS-14 | — | computed + sheet count | Panda v1 parser output tests; ATM-SITE-05; JSX const/runtime ternaries fold here |
| CORE-SITE-02 | Local `const` member `theme.primary` passed to `css()` compiles | done | ATM-SITE-06 + RS-14 | — | computed | Panda v1 extractor unbox tests; ATM-SITE-06 |
| CORE-SITE-03 | Identifier spread `...rest` unpacks known keys | done | ATM-SITE-11 + RS-14 | — | computed both | Panda v1 extractor unbox tests; ATM-SITE-11 |
| CORE-SITE-04 | Import alias `css as c` and namespace `ui.css` are sites | done | ATM-SITE-15 | — | computed | Panda v1 parser and namespace tests |
| CORE-SITE-05 | A local function named `css` is not a site | done | ATM-SITE-10 | — | no utility; no diagnostic noise | contrast Panda `cssParser` |
| CORE-SITE-06 | Dynamic call value `color: pick()` mints no ghost and emits a located diagnostic (warning), sync succeeds | done | ATM-LEAF-07, ATM-FORBID-02 | `sync` succeeds; warning proven via frozen-request recompile (sync persists no diagnostics) | utility count; warning text | Panda v1 extractor tests |
| CORE-SITE-07 | Cross-file `const` from `styles.ts` resolves | done | ATM-SITE-16 | `compile-files.ts` include | computed | Panda v1 parser raw-spread tests |
| CORE-SITE-08 | Logical `...(ok && extra)` with const `ok` lands `extra` | done | ATM-SITE-05 | — | computed | Panda v1 extractor tests (logical) |
| CORE-SITE-09 | String `@media (min-width: 400px)` key is an at-rule, not a selector | done | ATM-COND-11 | — | `setViewportSize` | ATM-COND-11 |
| CORE-SITE-10 | `css={{}}` on a primitive equals `css()` | done | ATM-SITE-14 | — | class equality | ATM-SITE-14 |
| CORE-SITE-11 | Configured `jsxElements: ['Chart']` makes `<Chart p="1r">` a host | done | ATM-SITE-08 | `jsx-elements.ts` (+ RS-1 frozen `jsxHosts`) | computed | Core config |
| CORE-SITE-12 | Unlisted PascalCase `<Random fontSize>` and lowercase `<div color>` are **not** hosts | done | ATM-SITE-08 | — | no utilities | anti-goal in Panda v1 output tests |
| CORE-SITE-13 | Boolean attr `<Div border />` compiles the boolean macro form | done | ATM-SITE-09 + ATM-SITE-18 (RS-19) | — (no change: engine lowers `border: true` to width + style utilities with one plan) | computed 1px solid border; both classes on the probe; bare control | ATM-SITE-09, SITE-18 |
| CORE-SITE-14 | With no hosts resolvable, the hostless tag yields zero utilities, and the emptied-hosts recompile fails closed with the located SITE-13 diagnostic | done | ATM-SITE-13 (RS-5) | — (no change: SITE-06 frozen-recompile precedent) | zero sheet utilities; recompile carries the located `no StyleProps hosts resolvable` error + zero wants/plans | ATM-SITE-13 |
| CORE-SITE-15 | Object ternary arms in a `_hover` prop: both arms compile, the hovered arm paints | done | ATM-SITE-21 (RS-34) | — | twin paints via `data-hover`; real hover paints; sheet carries exactly the two arm atoms | ATM-SITE-21; reference-lib `Tabs.tsx` |
| CORE-SITE-16 | Member tags (`<NS.Panel />`) extract under concatenated hosts; unhosted twins stay silent | done | ATM-SITE-22 (RS-36) | — | member paints both props; twin transparent; sheet carries exactly the member utilities | ATM-SITE-22; reference-lib `Menu.tsx`, `Showcase.book.tsx` |
| CORE-SITE-17 | Component-body const ternary feeding `borderBottomColor` extracts both arms; dark paints ink, light reload paints mist | done | ATM-SITE-23 (RS-37) | — | computed both themes; sheet carries exactly the two arm atoms | ATM-SITE-23; reference-lib `BookShell.tsx` chrome dividers |
| CORE-SITE-27 | Param shadowing a cross-file const: `function Card({ color })` over `a.ts`'s `export const color` diagnoses and paints nothing; an unshadowed imported const still paints | done | ATM-SITE-53 | — | no utility + located warning; twin paints | Panda v2 scope tests |
| CORE-SITE-20 | Wrapped `css()` args (`as const`, parens, `satisfies`, `!`, `.ts` `<T>`) paint exactly like the bare arg with zero diagnostics | done | ATM-SITE-26 | — | computed every wrap; sheet carries each utility; recompile carries zero diagnostics | /07; Panda v2 call tests |
| CORE-SITE-24 | Whole-object args lower beside live siblings while refused positions diagnose: `css(styles, {…})`, arg-level `cond && {…}`, and live `` css`…` `` | done | ATM-SITE-50 | — | sibling paints ocean, twin cherry, logical plum; tag paints nothing; sheet carries exactly the three utilities; recompile carries the two positioned warnings |  Panda v2 call and atomic tests |
| CORE-SITE-22 | Runtime-`ok` `...(ok && extra)` merges the right operand and paints beside its sibling | done | ATM-SITE-05 | — | computed both; sheet carries exactly the two utilities | Panda v2 conditional-output tests |
| CORE-SITE-18 | Static key plus spread ternary on the same key unions all values and paints the runtime winner | done | ATM-SITE-24 | — | computed winner; sheet carries exactly the three union utilities; recompile carries zero diagnostics | Panda v2 conditional-output tests |
| CORE-SITE-19 | Call-form `css([...])` merges object elements, skips the `false` hole, and paints last-wins | done | ATM-SITE-25 | — | computed last; sheet carries exactly the two merge utilities; recompile carries zero diagnostics | Panda v2 atomic tests |
| CORE-SITE-21 | Impure-helper leaves (`Math.random`, async call) refuse while static margin siblings paint; fenced pure-helper arm paints | done | ATM-SITE-32, ATM-SITE-31 | — | siblings paint; refused colors paint nothing; pure arm paints blue; sheet carries exactly the four utilities; recompile carries the two positioned warnings | /39-F1; Panda v2 scope tests |
| CORE-SITE-26 | Interpolated templates over foldable parts fold and paint; the dynamic part diagnoses naming `dyn` while its background sibling paints | done | ATM-SITE-51 | — | folded cherry, 4px width, live-arm plum, ocean-only refused node; sheet carries exactly the five utilities; recompile carries the one positioned part warning | Panda v2 scope and call tests |
| CORE-SITE-25 | Folded binary/logical/conditional arms and multi-hop reads paint; the dead arm is absent and the `|` refusal diagnoses | done | ATM-SITE-33, ATM-SITE-29 | — | arith, `&&`/`||`, `??`, folded ternaries, multi-hop reads paint; sheet carries exactly the fourteen utilities; recompile carries the located refusal warning | /11/12/19/31/66; Panda v2 call and scope tests |
| CORE-SITE-23 | Folded element reads, folded computed keys, and flattened spreads paint; a dynamic index refuses beside its sibling | done | ATM-SITE-48, ATM-SITE-49, ATM-SITE-37 | — | computed every fold; narrow/wide container paints base/lg; merge paints last-wins; sheet carries exactly the eleven utilities; recompile carries the positioned index warning | Panda v2 scope and call tests |
| CORE-SITE-28 | `css()` imported through a consumer wrapper (direct + two-hop chain) paints; the shadow-wrapper imposter paints nothing | done | ATM-SITE-55 | — | live cherry, chain ocean; miss transparent; sheet carries exactly the two utilities; recompile carries zero diagnostics | Panda v2 import-map tests (replaced, not copied) |

## Reference-rs gaps

**RS-37** is covered by reference-rs case ATM-SITE-23.

`collect_local_constants` scanned only top-level statements and recorded only
literal initializers, so `borderBottomColor={subtleBorder}` after
`const subtleBorder = isDark ? 'gray.800' : 'gray.200'` in a component body
compiled zero wants with a `Dynamic non-literal identifier` warning: the
Book chrome dividers fell back to `currentColor` (white) while width and
style applied. RS-14 covered the inline ternary/member/spread shapes; the
const-identifier indirection died one step earlier, at collection. Landing
collects `const` declarators at every depth and records branching
initializers as multi-leaf scalars (both ternary arms, non-guard logical
operands); identifier resolution emits one want plus one authored leaf per
leaf, so every arm gets its utility and its runtime plan. Fully dynamic
identifiers keep warning.

- Input: the `BookShell.tsx` chrome shape beside top-level ternary, nested
  ternary, and logical `css()` controls plus a fully dynamic identifier.
- Expected: one want and one plan per leaf, `border-bottom-color`
  utilities for every shade, exactly the fail-closed warning.
- Waiting Core case: CORE-SITE-17 (done).

**RS-34** is covered by reference-rs case ATM-SITE-21.

JSX `walk_style_attr` matched only object/array values and silently dropped
anything else, so `_hover={on ? {...} : {...}}` — and any `css={ternary}` —
compiled zero wants with zero diagnostics, while the `css()` object path
already compiled both arms (P6 probe green). Landing surfaced it as
`css(): no compiled class` warnings under `Tabs.tsx`'s nested
`guard ? (line ? { color, borderColor } : { color, bg }) : undefined` hover.
Fix walks conditional arms (both) and parenthesized values through
`walk_style_attr`; every other shape keeps its existing silence, and the
`undefined` arm stays quiet by construction.

- Input: `<Div _hover={on ? { backgroundColor: 'red' } : { backgroundColor: 'blue' }} />`
  beside the nested Tabs shape and a `css={pick ? {...} : {...}}` control.
- Expected: every arm's leaves emit hover/plain utilities + `css.classes`
  entries with zero diagnostics.
- Waiting Core case: CORE-SITE-15 (done).

**RS-36** is covered by reference-rs case ATM-SITE-22.

Member-expression tags formatted with their dot (`Overlay.Content`) never
matched the concatenated host names (`OverlayContent`) the retired reference-core's discovery
emits, so `<Overlay.Content minW="40r" …>` (Menu) and the twelve modal
style props (Showcase) compiled zero wants with zero diagnostics — the
modal rendered unpositioned and the Menu lost its min-width. Landing
surfaced it as a 160px modal offset plus a `minW: "40r"` miss warning.
Fix matches dotted tags against dot-stripped hosts at the `allows_jsx_tag`
gate; shadowing still compares the full dotted name.

- Input: `<Overlay.Content minW="40r" bg="red" />` with `OverlayContent`
  hosted beside unhosted `<Accordion.Content p="4r" />`.
- Expected: the member's leaves emit utilities
  (`min-width: calc(40 * var(--spacing-root))`) with zero diagnostics; the
  unhosted member stays silent.
- Waiting Core case: CORE-SITE-16 (done).

**RS-10** (runtime plans for every want): wants whose value reaches the call
through a ternary arm, a member access, or an identifier spread each get a
style plan, so the runtime `css()` (which resolves only through the plan
index) paints them. CORE-SITE-01, CORE-SITE-02 and CORE-SITE-03 prove it through
paint.

**RS-14**: wants whose value reaches the call through a ternary arm, a member
access, or an identifier spread emit utilities and one style plan per want, so
the runtime `css()` resolves them and paints. The CORE-SITE-01, -02 and -03
specs prove the current shapes:

- Input: `css({ color: flag ? 'cherry' : 'ocean' })` (flag unresolvable).
  Both arm utilities sit in the sheet; the runtime-chosen arm paints
  (CORE-SITE-01).
- Input: `css({ color: theme.primary })` (`theme` a local const). The utility
  and its plan paint (CORE-SITE-02). A direct `const space = 'gap'` with
  `css({ mt: space })` gets a plan and paints.
- Input: `css({ color: 'cherry', ...rest })` (`rest` a local const). The
  sibling and the spread both get utilities and plans, and both declarations
  paint (CORE-SITE-03).
- Input: `css(styles)` (whole local const object). Emits nothing and
  diagnoses; the whole-object form is out of dialect (site SPEC).

Ternary, member and spread forms emit one plan per want on both request paths.
A re-probe comes first: residual gaps file a fresh row, never reopen RS-14.
`site_plan_tests.rs` is not yet a reference-rs case.

**RS-19** is covered by ATM-SITE-18. The
`<Div border />` boolean form extracts (ATM-SITE-09 pins the `Bool(true)` want) and must lower to width and style utilities: `compileSync` must not return zero classes, zero plans, or the `` `border` value `true` is not valid CSS`` warning — and
`test_bool_want_emits_no_atom` in `resolve/mod.rs` pins that refusal as
deliberate. Only `container: true` lowers today (to
`container-type: inline-size`). No browser proof of a painted border is
possible until the macro half lands.

- Input: `<Div border />` (valueless known style attribute).
- Expected CSS (proposal, mirroring the
  `container`-bool precedent and Tailwind's bare `border`): one
  utility, e.g. `.<sys>__b { border-width: 1px; border-style: solid; }`,
  plus its style plan so the runtime resolves the attr.
- Should become: a lowering slice near ATM-SITE-09 (`border: true`
  macro; warn-and-skip stays for genuinely non-CSS bools).
- Waiting Core case: CORE-SITE-13 (no case folder until the macro half
  lands).

RS-19 covered by ATM-SITE-18 — `<Div border />`
lowers to `border-width: 1px` + `border-style: solid` utilities with one
two-declaration plan (zero bool warnings).
CORE-SITE-13 done (computed border + plan shape + bare control).

**RS-5** (blocks CORE-SITE-14). With no hosts resolvable the engine must fail closed: the empty styletrace graph must not scan every tag. Input `<Foo mt="4r" />` with no `@reference-ui/react` import must yield zero wants and a missing-graph diagnostic; importless `<Div mt>` and `<Button color>` likewise yield none.

- Input: hostless world (style attrs, zero host imports).
- Expected: zero wants plus a missing-graph diagnostic naming the file.
- Should become: reference-rs case ATM-SITE-13 (`packages/reference-rs/modules/atomic/SPEC.md:265-267`, open).
- Waiting Core case: CORE-SITE-14 (diagnostic present; no stray utilities).

RS-5 covered by ATM-SITE-13 — the empty-host
request fails closed with the located `no StyleProps hosts resolvable`
error and zero wants/plans. Real `sync()` always admits the 101
primitives on the frozen request, so the hostless world syncs green with
zero utilities and CORE-SITE-14 proves the diagnostic via the SITE-06
frozen-recompile precedent (emptied `jsxHosts`); any host import or
admitted host quiets it back to the silent unlisted-tag skip. Done.
