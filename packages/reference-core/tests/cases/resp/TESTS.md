# RESP ledger

`CORE-CSS-02` lives in `css/` and is listed here once as a done
cross-reference; RESP owns rows CORE-RESP-01..10 (append-only, never
renumbered). All reference-rs cases below were confirmed (`ls` + README) in
`packages/reference-rs/modules/atomic/tests/cases/`; no row is
`blocked-on-rs` and no `RS-n` was added.

| id | claim | status | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| CORE-CSS-02 | `css()` container-query form and `r` sugar resolve to the same compiled class and paint per container (lives in `css/`) | done | ATM-COND-01 | `lowerResponsiveStyles.ts` | class equality node-side + computed colour in wide vs narrow containers | ATM-COND-01 |
| CORE-RESP-01 | `width: ['50px', '60px']` maps index → base, first breakpoint (`@container`) | done | ATM-LEAF-05, ATM-COND-01 | `lowerResponsiveStyles.ts` | resize the container element; computed width flips | Panda v1 test "responsive array" |
| CORE-RESP-02 | `['50px', null, '60px']` skips the middle breakpoint | done | ATM-LEAF-05 | `lowerResponsiveStyles.ts` | at `sm` width unchanged; at `md` changes | Panda v1 test "array with gaps" |
| CORE-RESP-03 | `base` key is the unprefixed class | done | ATM-COND-01, ATM-COND-17 | — | computed at narrow width | Panda v1 test "skip `_` notation" |
| CORE-RESP-04 | Nested `sm: { md: … }` requires both queries | done | ATM-COND-01 | — | three widths | Panda v1 complex-rule tests |
| CORE-RESP-05 | Range conditions `mdDown`, `mdOnly`, `smToLg` bound the query and never overlap at the boundary | done | ATM-COND-13 | — | computed at boundary±1px | Panda v1 breakpoints tests (epsilon); smOnly≡smToMd identical query (K3) |
| CORE-RESP-06 | Queries are ordered mobile-first: min-width ascending, then max-width descending | done | ATM-ORDER-01 | — | sheet order + cascade at overlapping widths | Panda v1 sort-mq tests |
| CORE-RESP-07 | Without a container-type ancestor, container utilities do **not** apply; with `container: true` on the root they do | done | ATM-COND-15, ATM-COND-16 | — | two worlds or two subtrees | reference-lib `body { container-type: inline-size }` |
| CORE-RESP-08 | Numeric custom key `r={{ 300: … }}` lowers to a concrete `@container (min-width: 300px)` | done | ATM-COND-07 | `lowerResponsiveStyles.ts` (no change; numeric lowering already shipped) | resize across 300px; computed width flips both ways; r sugar == direct form node-side | ATM-COND-07; `CORE-CSS-02` |
| CORE-RESP-09 | `css()` at runtime and build time lower the same responsive sugar to the same class | done | ATM-COND-01 | `css.ts` (no change; verbatim nesting already shipped) | runtime call == extracted call == exact class string; DOM equality; resize paints per container | `CORE-CSS-02`; ATM-COND-01 |
| CORE-RESP-10 | Viewport contract: css width @800px, recipe height @700px, mixed container+viewport on one class | done | none (P2 census; no engine gap) | — | all 8 oracle legs incl. the 4 mixed cells | `[matrix]` `viewport-contract.spec.ts` whole file; P-resp-1 |

RS pointer: CORE-RESP-03 waits on RS-9 (per-prop `{ base, <bp> }` objects;
full input/expected-CSS in `tests/cases/css/TESTS.md`). A probe of
`css({ width: { base: '50px', md: '60px' } })` through `compile()` warns
`Dynamic non-literal expression encountered for prop 'width'` and emits no
width wants, plans, or rules — the same gap RS-9 tickets. No new RS row;
no case folder until the compilation half lands
(run via core Vitest against `compileSync`).

RS-9's per-prop half is covered by ATM-COND-17 and CORE-CSS-03, which prove
it green. A re-probe comes first: if `base`-key lowering still gaps, a fresh RS
row is filed rather than reopening RS-9.
