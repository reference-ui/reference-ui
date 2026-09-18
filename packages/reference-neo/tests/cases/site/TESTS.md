# SITE ledger

| id | claim | status | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| NEO-SITE-01 | Literal ternary: both arms compile; the runtime-chosen arm paints; the other atom exists unused | blocked-on-rs (RS-14) | ATM-SITE-05 + RS-14 | — | computed + sheet count | `[decision D11]`; `[panda-v1]` `parser/__tests__/output.test.ts` L878 |
| NEO-SITE-02 | Local `const` style object passed to `css()` compiles | blocked-on-rs (RS-14) | ATM-SITE-06 + RS-14 | — | computed | `[panda-v1]` `extractor/__tests__/unbox.test.ts` L4304 |
| NEO-SITE-03 | Identifier spread `...rest` unpacks known keys | blocked-on-rs (RS-14) | ATM-SITE-11 + RS-14 | — | computed both | `[panda-v1]` `unbox.test.ts` L4328 |
| NEO-SITE-04 | Import alias `css as c` and namespace `ui.css` are sites | done | ATM-SITE-15 | — | computed | `[panda-v1]` `css-2.test.ts` L310, `namespace.test.ts` |
| NEO-SITE-05 | A local function named `css` is not a site | done | ATM-SITE-10 | — | no utility; no diagnostic noise | contrast Panda `cssParser` |
| NEO-SITE-06 | Dynamic call value `color: pick()` mints no ghost and emits a located diagnostic (warning), sync succeeds | done | ATM-LEAF-07, ATM-FORBID-02 | `sync` succeeds; warning proven via frozen-request recompile (sync persists no diagnostics — see batch-2 report) | utility count; warning text | `[decision D11]`; `[panda-v1]` `extract.test.ts` L3223 |
| NEO-SITE-07 | Cross-file `const` from `styles.ts` resolves | done | ATM-SITE-16 | `compile-files.ts` include | computed | `[panda-v1]` `css-raw-spread.test.ts` L423 |
| NEO-SITE-08 | Logical `...(ok && extra)` with const `ok` lands `extra` | done | ATM-SITE-05 | — | computed | `[panda-v1]` `extract.test.ts` logical |
| NEO-SITE-09 | String `@media (min-width: 400px)` key is an at-rule, not a selector | done | ATM-COND-11 | — | `setViewportSize` | `[atm]` COND-11 |
| NEO-SITE-10 | `css={{}}` on a primitive equals `css()` | done | ATM-SITE-14 | — | class equality | `[atm]` SITE-14 |
| NEO-SITE-11 | Configured `jsxElements: ['Chart']` makes `<Chart p="1r">` a host | done | ATM-SITE-08 | `jsx-elements.ts` (+ RS-1 frozen `jsxHosts`) | computed | `[decision D12]`; Neo config |
| NEO-SITE-12 | Unlisted PascalCase `<Random fontSize>` and lowercase `<div color>` are **not** hosts | done | ATM-SITE-08 | — | no utilities | anti-goal `output.test.ts` L3057 |
| NEO-SITE-13 | Boolean attr `<Div border />` compiles the boolean macro form | blocked-on-rs (RS-19) | ATM-SITE-09 + RS-19 | — | computed border | `[atm]` SITE-09 |
| NEO-SITE-14 | With no hosts resolvable, sync emits the SITE-13 diagnostic instead of scanning every tag | blocked-on-rs (RS-5) | RS-5 | `sync` | diagnostic present; no stray utilities | `[atm]` SITE-13 open |

## RS lane (added by the SITE batch-1 cook)

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

**RS-19** (filed by the T8 mop cook; blocks NEO-SITE-13). The
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
