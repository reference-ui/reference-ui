# RESP ledger

`NEO-CSS-02` lives in `css/` per D18 and is listed here once as a done
cross-reference; RESP owns rows NEO-RESP-01..09 (append-only, never
renumbered). All engine stations below were confirmed (`ls` + README) in
`packages/reference-rs/modules/atomic/tests/cases/`; no row is
`blocked-on-rs` and no `RS-n` was added.

| id | claim | status | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| NEO-CSS-02 | `css()` container-query form and `r` sugar resolve to the same compiled class and paint per container (lives in `css/`) | done | ATM-COND-01 | `lowerResponsiveStyles.ts` | class equality node-side + computed colour in wide vs narrow containers | `[atm]` COND-01 |
| NEO-RESP-01 | `width: ['50px', '60px']` maps index → base, first breakpoint (`@container`) | done | ATM-LEAF-05, ATM-COND-01 | `lowerResponsiveStyles.ts` | resize the container element; computed width flips | `[panda-v1]` `core/__tests__/atomic-rule.test.ts` "responsive array" |
| NEO-RESP-02 | `['50px', null, '60px']` skips the middle breakpoint | done | ATM-LEAF-05 | `lowerResponsiveStyles.ts` | at `sm` width unchanged; at `md` changes | `[panda-v1]` `atomic-rule.test.ts` "array with gaps"; `[atm]` P1 #10; `[decision D10]` |
| NEO-RESP-03 | `base` key is the unprefixed class | done | ATM-COND-01, ATM-COND-17 | — | computed at narrow width | `[panda-v1]` `atomic-rule.test.ts` "skip `_` notation" |
| NEO-RESP-04 | Nested `sm: { md: … }` requires both queries | done | ATM-COND-01 | — | three widths | `[panda-v1]` `complex-rule.test.ts` |
| NEO-RESP-05 | Range conditions `mdDown`, `mdOnly`, `smToLg` bound the query and never overlap at the boundary | done | ATM-COND-13 | — | computed at boundary±1px | `[panda-v1]` `breakpoints.test.ts` epsilon; `[atm]` P1 #11 |
| NEO-RESP-06 | Queries are ordered mobile-first: min-width ascending, then max-width descending | done | ATM-ORDER-01 | — | sheet order + cascade at overlapping widths | `[panda-v1]` `sort-mq.test.ts` |
| NEO-RESP-07 | Without a container-type ancestor, container utilities do **not** apply; with `container: true` on the root they do | done | ATM-COND-15, ATM-COND-16 | — | two worlds or two subtrees | `[atm]` P0 #2; `[lib]` `body { container-type: inline-size }`; `[decision D8]` |
| NEO-RESP-08 | Numeric custom key `r={{ 300: … }}` lowers to a concrete `@container (min-width: 300px)` | done | ATM-COND-07 | `lowerResponsiveStyles.ts` (no change; numeric lowering already shipped) | resize across 300px; computed width flips both ways; r sugar == direct form node-side | `[atm]` COND-07; `NEO-CSS-02` |
| NEO-RESP-09 | `css()` at runtime and build time lower the same responsive sugar to the same class | done | ATM-COND-01 | `css.ts` (no change; verbatim nesting already shipped) | runtime call == extracted call == exact class string; DOM equality; resize paints per container | `NEO-CSS-02`; `[atm]` COND-01 |

RS pointer: NEO-RESP-03 waits on RS-9 (per-prop `{ base, <bp> }` objects;
full input/expected-CSS in `tests/cases/css/TESTS.md`). R1 2026-09-17:
`css({ width: { base: '50px', md: '60px' } })` through `compile()` warns
`Dynamic non-literal expression encountered for prop 'width'` and emits no
width wants, plans, or rules — the same gap RS-9 tickets. No new RS row;
no case folder until the compilation half lands. Probe: `/tmp/resp-r1.probe.test.ts`
(run via neo Vitest against `compileSync`; `r1b`/`r1c` follow-ups beside it).

Resume 2026-09-17 (captain): RS-9 landed as ATM-COND-17 and NEO-CSS-03
proves the per-prop half green, so the block is cleared and the row returns
to `open` for T8. R1 re-probes first: if `base`-key lowering still gaps, the
cook files a fresh RS row rather than reopening RS-9.
