# NEO-RESP-09 — runtime and build time lower named responsive sugar to the same class

The world calls css() once with width plus sm: { width }. The spec checks the sheet carries the base utility plus the sm container rule, a fresh runtime call resolves the exact extracted classes node-side, the DOM probes carry that same string, and wide versus narrow containers paint per container.

Evidence: [atm] ATM-COND-01; NEO-CSS-02.

> Search terms: static, compile, publish, precompiled, equality, static dynamic match, responsive/sugar, build/runtime-parity, NEO-RESP-08
