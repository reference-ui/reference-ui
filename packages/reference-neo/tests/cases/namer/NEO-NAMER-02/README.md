# NEO-NAMER-02 — the browser corpus paints exactly the pre-cutover class lists

The world exercises one element per naming shape — holes, responsive
arrays, per-prop objects, `_hover`, `md`, trailing-`!`, and the `font`,
`size`, `border`, radius-pair, and `flex` macros — and the spec requires
every element's class list to equal the pre-cutover plan-derived golden
plus matching computed styles. The runtime namer reproduces the same
lists; the compiler namer wrote the golden.

Evidence: `[atm]` NAME (`packages/reference-rs/modules/atomic/tests/cases/ATM-NAME-08`); world macros lean on `NEO-CSS-10`.

> Search terms: browser corpus, naming shapes, responsive array, per-prop object, hover condition, breakpoint condition, important bang, font macro, size macro, border trio, radius pair, flex rewrite, class list golden, computed styles
