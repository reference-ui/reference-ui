# CORE-RESP-03 — the `base` key is the unprefixed class

The world calls `css({ width: { base: '50px', md: '60px' } })`. The spec
checks the sheet carries the bare base utility plus the `md` container
rule, the call resolves to `w_50px` plus `md:w_60px` with no `base:` prefix
anywhere, and narrow/wide containers paint 50px/60px.

Evidence: Panda v1 test "skip `_`
notation"; ATM-COND-01, ATM-COND-17.

> Search terms: object syntax, breakpoint object, default, fallback, unconditional, object form, keyed form, responsive/object, CORE-RESP-04
