# NEO-RESP-03 — the `base` key is the unprefixed class

The world calls `css({ width: { base: '50px', md: '60px' } })`. The spec
checks the sheet carries the bare base utility plus the `md` container
rule, the call resolves to `w_50px` plus `md:w_60px` with no `base:` prefix
anywhere, and narrow/wide containers paint 50px/60px.

Evidence: `[panda-v1]` `core/__tests__/atomic-rule.test.ts` "skip `_`
notation"; `[atm]` ATM-COND-01, ATM-COND-17.
