# ATM-SITE-85

A host's own declared props shadow StyleProps on that host: Button's `size` never reaches the resolver (no want, no warning), while Div still folds the `size` macro and Button's inherited `color` still extracts.
Symbols: `owned_props`, `host_owns`, `is_style_attr_name`, `collect_declared_prop_names`, `TraceOutcome`.
Siblings: `ATM-SITE-07`/`ATM-SITE-08` (DOM namespace), `ATM-SITE-56`/`ATM-SITE-57` (host discovery), `ATM-TOKEN-16` (§11 silence).
Contract: [SPEC.md](../../../SPEC.md).

> Search terms: owned props, host shadow, declared props, size variant, is_style_attr_name, host_owns, StyleSurface
