# ATM-SITE-58

Wipe-state discovery: `PrimitiveProps`-family wrappers (`Omit<...>` and bare shapes) trace with `jsxHosts` absent while the fixture's `@reference-ui/react` self-link dangles (no `.reference-ui` dir, exactly the in-sync wipe shape), and `tracedJsxHosts` carries both names.
Random (bare `div`, the NEO-SITE-12 antihost shape) is not traced and its use site stays silent.
Contract: [SPEC.md](../../../SPEC.md). Siblings: ATM-SITE-56 (StyleProps discovery), ATM-SITE-57 (parse-failure isolation).

> Search terms: discovery, tracedJsxHosts, wipe-state, dangling, PrimitiveProps, surface-type, engine surface
