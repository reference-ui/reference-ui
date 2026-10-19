# CORE-SITE-28 — `css()` identity flows through a consumer re-export

The world keeps `export { css } from '@reference-ui/react'` in
`src/ui.ts` and a two-hop `export { css } from './ui.js'` in
`src/chain.ts`, while `src/shadow.ts` exports a same-named imposter.
The entry styles one node through each. The spec asserts the wrapper
and chain nodes paint cherry and ocean while the miss paints nothing
with zero recompile diagnostics — so site identity follows bindings
through re-exports with zero config, replacing Panda's `importMap`.

Evidence: ATM-SITE-55 (re-export identity); Panda v2 import-map tests
(13 tests, replaced not copied).

> Search terms: re-export identity, wrapper module, importMap replacement, binding walk, site identity, zero config, CORE-SITE-04, ATM-SITE-55

Design note: the dependent-invalidation rider this case's binding walk
motivates lives in the
[SITE SPEC appendix](../SPEC.md#appendix-dependent-invalidation-design-from-core-site-28).
