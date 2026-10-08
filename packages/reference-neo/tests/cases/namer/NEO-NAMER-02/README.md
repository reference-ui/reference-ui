# NEO-NAMER-02 — the browser corpus paints exactly the pre-cutover class lists

The world exercises one element per naming shape — holes, responsive
arrays, per-prop objects, `_hover`, `md`, trailing-`!`, and the `font`,
`size`, `border`, radius-pair, and `flex` macros — and the spec requires
every element's class list to equal the pre-cutover plan-derived golden
plus matching computed styles. The runtime namer reproduces the same
lists; the compiler namer wrote the golden.

It also pins the bare-weight family-scoping seam against the static
`ATM-COND-05` oracle: every family × keyword pair (`sans`/`serif`/`mono` ×
six keywords) scopes to the family scale, lone keywords keep the CSS
keyword, two families decline, a conditional weight falls back to the base
family, and the static sheet backs the scoped rule (computed `font-weight`
proves it paints). The dynamic-value boundary is pinned too: the runtime
scopes a variable-held `thin` that the static pass cannot see. The F3
responsive shapes (weight array, object+object, font-object + string) are
pinned as KNOWN-DIVERGENT interim behavior.

Evidence: `[atm]` NAME (`packages/reference-rs/modules/atomic/tests/cases/ATM-NAME-08`) and the ATM-COND-05 weight pins; world macros lean on `NEO-CSS-10`.

> Search terms: browser corpus, naming shapes, responsive array, per-prop object, hover condition, breakpoint condition, important bang, font macro, size macro, border trio, radius pair, flex rewrite, class list golden, computed styles, bare weight family scoping, weight keywords, dynamic weight boundary, responsive weight divergence
