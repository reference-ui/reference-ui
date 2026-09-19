# SITE ledger

| id | claim | status | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| NEO-SITE-01 | Literal ternary: both arms compile; the runtime-chosen arm paints; the other atom exists unused | done | ATM-SITE-05 + RS-14 | — | computed + sheet count | `[decision D11]`; `[panda-v1]` `parser/__tests__/output.test.ts` L878; `[atm]` SITE-05; JSX const/runtime ternaries fold here (N1/N2/N7) |
| NEO-SITE-02 | Local `const` member `theme.primary` passed to `css()` compiles | done | ATM-SITE-06 + RS-14 | — | computed | `[panda-v1]` `extractor/__tests__/unbox.test.ts` L4304; `[atm]` SITE-06 |
| NEO-SITE-03 | Identifier spread `...rest` unpacks known keys | done | ATM-SITE-11 + RS-14 | — | computed both | `[panda-v1]` `unbox.test.ts` L4328; `[atm]` SITE-11 |
| NEO-SITE-04 | Import alias `css as c` and namespace `ui.css` are sites | done | ATM-SITE-15 | — | computed | `[panda-v1]` `css-2.test.ts` L310, `namespace.test.ts` |
| NEO-SITE-05 | A local function named `css` is not a site | done | ATM-SITE-10 | — | no utility; no diagnostic noise | contrast Panda `cssParser` |
| NEO-SITE-06 | Dynamic call value `color: pick()` mints no ghost and emits a located diagnostic (warning), sync succeeds | done | ATM-LEAF-07, ATM-FORBID-02 | `sync` succeeds; warning proven via frozen-request recompile (sync persists no diagnostics — see batch-2 report) | utility count; warning text | `[decision D11]`; `[panda-v1]` `extract.test.ts` L3223 |
| NEO-SITE-07 | Cross-file `const` from `styles.ts` resolves | done | ATM-SITE-16 | `compile-files.ts` include | computed | `[panda-v1]` `css-raw-spread.test.ts` L423 |
| NEO-SITE-08 | Logical `...(ok && extra)` with const `ok` lands `extra` | done | ATM-SITE-05 | — | computed | `[panda-v1]` `extract.test.ts` logical |
| NEO-SITE-09 | String `@media (min-width: 400px)` key is an at-rule, not a selector | done | ATM-COND-11 | — | `setViewportSize` | `[atm]` COND-11 |
| NEO-SITE-10 | `css={{}}` on a primitive equals `css()` | done | ATM-SITE-14 | — | class equality | `[atm]` SITE-14 |
| NEO-SITE-11 | Configured `jsxElements: ['Chart']` makes `<Chart p="1r">` a host | done | ATM-SITE-08 | `jsx-elements.ts` (+ RS-1 frozen `jsxHosts`) | computed | `[decision D12]`; Neo config |
| NEO-SITE-12 | Unlisted PascalCase `<Random fontSize>` and lowercase `<div color>` are **not** hosts | done | ATM-SITE-08 | — | no utilities | anti-goal `output.test.ts` L3057 |
| NEO-SITE-13 | Boolean attr `<Div border />` compiles the boolean macro form | done | ATM-SITE-09 + ATM-SITE-18 (RS-19 landed) | — (no change: engine lowers `border: true` to width + style utilities with one plan) | computed 1px solid border; both classes on the probe; bare control | `[atm]` SITE-09, SITE-18 |
| NEO-SITE-14 | With no hosts resolvable, the hostless tag yields zero utilities, and the emptied-hosts recompile fails closed with the located SITE-13 diagnostic | done | ATM-SITE-13 (RS-5 landed) | — (no change: SITE-06 frozen-recompile precedent) | zero sheet utilities; recompile carries the located `no StyleProps hosts resolvable` error + zero wants/plans | `[atm]` SITE-13 |
| NEO-SITE-15 | Object ternary arms in a `_hover` prop: both arms compile, the hovered arm paints | done | ATM-SITE-21 (RS-34) | — | twin paints via `data-hover`; real hover paints; sheet carries exactly the two arm atoms | `[atm]` SITE-21; `[lib]` `Tabs.tsx`; `[decision D11]` |
| NEO-SITE-16 | Member tags (`<NS.Panel />`) extract under concatenated hosts; unhosted twins stay silent | done | ATM-SITE-22 (RS-36) | — | member paints both props; twin transparent; sheet carries exactly the member utilities | `[atm]` SITE-22; `[lib]` `Menu.tsx`, `Showcase.book.tsx` |
| NEO-SITE-17 | Component-body const ternary feeding `borderBottomColor` extracts both arms; dark paints ink, light reload paints mist | done | ATM-SITE-23 (RS-37) | — | computed both themes; sheet carries exactly the two arm atoms | `[atm]` SITE-23; `[lib]` `BookShell.tsx` chrome dividers |
| NEO-SITE-27 | Param shadowing a cross-file const: `function Card({ color })` over `a.ts`'s `export const color` diagnoses and paints nothing; an unshadowed imported const still paints | done | ATM-SITE-53 | — | no utility + located warning; twin paints | `[overmatch]` SPEC-V2-75; `[panda-v2]` `scope.rs:1349`, `:1369` |
| NEO-SITE-20 | Wrapped `css()` args (`as const`, parens, `satisfies`, `!`, `.ts` `<T>`) paint exactly like the bare arg with zero diagnostics | done | ATM-SITE-26 | — | computed every wrap; sheet carries each utility; recompile carries zero diagnostics | `[overmatch]` SPEC-V2-06/07; `[panda-v2]` `calls.rs:1001`, `:1017`, `:1033`, `:1052`, `:1068` |
| NEO-SITE-24 | Whole-object args lower beside live siblings while refused positions diagnose: `css(styles, {…})`, arg-level `cond && {…}`, and live `` css`…` `` | done | ATM-SITE-50 | — | sibling paints ocean, twin cherry, logical plum; tag paints nothing; sheet carries exactly the three utilities; recompile carries the two positioned warnings | `[overmatch]` SPEC-V2-65 Ph3; `[panda-v2]` `calls.rs:548`, `:1719`, `atomic.rs:1626` |
| NEO-SITE-22 | Runtime-`ok` `...(ok && extra)` merges the right operand and paints beside its sibling | done | ATM-SITE-05 | — | computed both; sheet carries exactly the two utilities | `[overmatch]` SPEC-V2-21; `[panda-v2]` `conditional_output.rs:274` |
| NEO-SITE-18 | Static key plus spread ternary on the same key unions all values and paints the runtime winner | done | ATM-SITE-24 | — | computed winner; sheet carries exactly the three union utilities; recompile carries zero diagnostics | `[overmatch]` SPEC-V2-22; `[panda-v2]` `conditional_output.rs:363` |
| NEO-SITE-19 | Call-form `css([...])` merges object elements, skips the `false` hole, and paints last-wins | done | ATM-SITE-25 | — | computed last; sheet carries exactly the two merge utilities; recompile carries zero diagnostics | `[overmatch]` SPEC-V2-29; `[panda-v2]` `atomic.rs:1474` |
| NEO-SITE-21 | Impure-helper leaves (`Math.random`, async call) refuse while static margin siblings paint; fenced pure-helper arm paints | done | ATM-SITE-32, ATM-SITE-31 | — | siblings paint; refused colors paint nothing; pure arm paints blue; sheet carries exactly the four utilities; recompile carries the two positioned warnings | `[overmatch]` SPEC-V2-42/39-F1; `[panda-v2]` `scope.rs:1020`, `:1164` |
| NEO-SITE-26 | Interpolated templates over foldable parts fold and paint; the dynamic part diagnoses naming `dyn` while its background sibling paints | done | ATM-SITE-51 | — | folded cherry, 4px width, live-arm plum, ocean-only refused node; sheet carries exactly the five utilities; recompile carries the one positioned part warning | `[overmatch]` SPEC-V2-67; `[panda-v2]` `scope.rs:868`, `:887`, `calls.rs:1420`, `:1972` |
| NEO-SITE-25 | Folded binary/logical/conditional arms and multi-hop reads paint; the dead arm is absent and the `|` refusal diagnoses | done | ATM-SITE-33, ATM-SITE-29 | — | arith, `&&`/`||`, `??`, folded ternaries, multi-hop reads paint; sheet carries exactly the fourteen utilities; recompile carries the located refusal warning | `[overmatch]` SPEC-V2-10/11/12/19/31/66; `[panda-v2]` `calls.rs:1148`, `:1168`, `:1535`, `:1499`, `scope.rs:286` |
| NEO-SITE-23 | Folded element reads, folded computed keys, and flattened spreads paint; a dynamic index refuses beside its sibling | done | ATM-SITE-48, ATM-SITE-49, ATM-SITE-37 | — | computed every fold; narrow/wide container paints base/lg; merge paints last-wins; sheet carries exactly the eleven utilities; recompile carries the positioned index warning | `[overmatch]` SPEC-V2-63/64/28-Ph3; `[panda-v2]` `scope.rs:321`, `:340`, `:393`, `calls.rs:1265`, `:1288` |
| NEO-SITE-28 | `css()` imported through a consumer wrapper (direct + two-hop chain) paints; the shadow-wrapper imposter paints nothing | done | ATM-SITE-55 | — | live cherry, chain ocean; miss transparent; sheet carries exactly the two utilities; recompile carries zero diagnostics | `[overmatch]` SPEC-V2-76 rider S12; `[panda-v2]` `import_map.rs` (replaced, not copied) |

## RS lane (added by the SITE batch-1 cook)

**RS-37 — landed** as station ATM-SITE-23 (waiting Neo case NEO-SITE-17, done).

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
- Waiting Neo case: NEO-SITE-17 (done).

**RS-34 — landed** as station ATM-SITE-21 (waiting Neo case NEO-SITE-15, done).

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
- Waiting Neo case: NEO-SITE-15 (done).

**RS-36 — landed** as station ATM-SITE-22 (waiting Neo case NEO-SITE-16, done).

Member-expression tags formatted with their dot (`Overlay.Content`) never
matched the concatenated host names (`OverlayContent`) core's discovery
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
- Waiting Neo case: NEO-SITE-16 (done).

**RS-10** (unblocks NEO-SITE-01, NEO-SITE-02, NEO-SITE-03; would become a
station near ATM-MERGE/ATM-SEAM: runtime plans for every want). Wants whose
value reaches the call through a ternary arm, a member access, or an
identifier spread emit utilities plus `css.classes` entries but **no**
`stylePlans`, so the Neo runtime `css()` — which resolves only through the
plan index — returns `''` and nothing paints. Direct literals and direct
const identifiers do get plans. Observed via frozen `NativeCompileRequest`
against `@reference-ui/rust/atomic` `compile()` plus real Neo syncs:

- Input: `css({ color: flag ? 'cherry' : 'ocean' })` (flag unresolvable).
  Today: wants `color=cherry, color=ocean`, both utilities in the sheet,
  `stylePlans: []`. Real sync: sheet carries both arms, computed stays black.
- Input: `const theme = { primary: 'cherry' }; css({ color: theme.primary })`.
  Today: want plus utility, no plan; computed stays black. (Direct
  `const space = 'gap'; css({ mt: space })` DOES get a plan and paints.)
- Input: `const rest = { mt: 'gap' }; css({ color: 'cherry', ...rest })`.
  Today: both wants and utilities; plan only for the literal sibling `color`.
  The spread `mt` never paints.
- Expected: one style plan per want — `(color, cherry)` and `(color, ocean)`
  for the ternary, `(color, cherry)` for the member access, `(mt, gap)` for
  the spread value — each pointing at its already-emitted utility class.
  Sheet output is already correct; only `runtime.stylePlans` is missing.
- Waiting Neo cases: NEO-SITE-01, NEO-SITE-02, NEO-SITE-03 (worlds +
  specs were proven green on the sheet half and removed pending the fix;
  see the batch-1 completion report for the exact world shapes).

**RS-14** (filed by the SITE batch-2 cook; re-files the batch-1 RS-lane
text above under a fresh number because the RS-10 name landed as the
unrelated include-scoping slice ATM-SCAN-01, which stays green and does
not emit the missing plans). Wants whose value reaches the call through
a ternary arm, a member access, or an identifier spread emit utilities
but **no** `stylePlans`, so the Neo runtime `css()` — which resolves
only through the plan index (`src/runtime/css/css.ts`) — returns `''`
and nothing paints. Reconfirmed 2026-09-17 via frozen-request probes
against `@reference-ui/rust/atomic` `compile()`:

- Input: `css({ color: flag ? 'cherry' : 'ocean' })` (flag unresolvable).
  Today: both utilities, `stylePlans: []`.
- Input: `css({ color: theme.primary })` (`theme` a local const).
  Today: utility, `stylePlans: []`. (Direct `const space = 'gap';
  css({ mt: space })` DOES get a plan.)
- Input: `css({ color: 'cherry', ...rest })` (`rest` a local const).
  Today: both utilities; plan only for the literal sibling `color`.
- Input: `css(styles)` (whole local const object). Today: NO utility
  and NO plan at all — a wider gap than the sibling shapes above; the
  RS-14 liaison should confirm whether whole-object form is in scope.
- Expected: one style plan per want, each pointing at its
  already-emitted utility class. Sheet output is already correct; only
  `runtime.stylePlans` is missing.
- Waiting Neo cases: NEO-SITE-01, NEO-SITE-02, NEO-SITE-03.

N0 update 2026-09-17 (captain): engine core cleared — ternary/member/spread
emit one plan per want on both request paths (n0-rs-reverify §3 RS-14).
SITE-01/02/03 return to `open` for R2 (R1 re-confirms first; residual gaps
file a fresh row, never reopen RS-14). Liaison remainder: adopt
`site_plan_tests.rs` into a real station. Whole-object `css(styles)` ruled
out-of-dialect (site SPEC absence); its silence is documented there for a
future row.

**RS-19 — LANDED as ATM-SITE-18 (NEO-SITE-13 done; gap text below kept for provenance).** Filed by the T8 mop cook. The
`<Div border />` boolean form extracts (ATM-SITE-09 pins the
`Bool(true)` want) but lowers to nothing: R1 2026-09-17 via
`compileSync` shows the want with zero classes, zero plans, and a
`` `border` value `true` is not valid CSS`` warning — and
`test_bool_want_emits_no_atom` in `resolve/mod.rs` pins that refusal as
deliberate. Only `container: true` lowers today (to
`container-type: inline-size`). No browser proof of a painted border is
possible until the macro half lands.

- Input: `<Div border />` (valueless known style attribute).
- Expected CSS (proposal at the liaison's call, mirroring the
  `container`-bool precedent and Tailwind's bare `border`): one
  utility, e.g. `.<sys>__b { border-width: 1px; border-style: solid; }`,
  plus its style plan so the runtime resolves the attr.
- Should become: a lowering slice near ATM-SITE-09 (`border: true`
  macro; warn-and-skip stays for genuinely non-CSS bools).
- Waiting Neo case: NEO-SITE-13 (no case folder until the macro half
  lands).

N2 update 2026-09-17 (cook): RS-19 landed as ATM-SITE-18 — `<Div border />`
lowers to `border-width: 1px` + `border-style: solid` utilities with one
two-declaration plan (R1 `/tmp/n2cook-r1.mjs` green, zero bool warnings).
NEO-SITE-13 done (computed border + plan shape + bare control).

**RS-5** (lane drafted by the captain at N1 from N0 re-verify; blocks
NEO-SITE-14). With no hosts resolvable the engine must fail closed, but
today the empty styletrace graph scans every tag: input `<Foo mt="4r" />`
with no `@reference-ui/react` import extracts 1 want, class
`@reference-ui/lib__mt_4r`, 1 plan, and 0 diagnostics (N0 RS-5;
importless `<Div mt>`/`<Button color>` likewise extract 2/2/2).

- Input: hostless world (style attrs, zero host imports).
- Expected: zero wants plus a missing-graph diagnostic naming the file.
- Should become: station ATM-SITE-13 (`atomic/SPEC.md:265-267`, open).
- Waiting Neo case: NEO-SITE-14 (diagnostic present; no stray utilities).

N2 update 2026-09-17 (cook): RS-5 landed as ATM-SITE-13 — the empty-host
request fails closed with the located `no StyleProps hosts resolvable`
error and zero wants/plans (R1 `/tmp/n2cook-r1.mjs` +
`/tmp/n2cook-site14d.mjs` green). Real `sync()` always admits the 101
primitives on the frozen request, so the hostless world syncs green with
zero utilities and NEO-SITE-14 proves the diagnostic via the SITE-06
frozen-recompile precedent (emptied `jsxHosts`); any host import or
admitted host quiets it back to the silent unlisted-tag skip. Done.
