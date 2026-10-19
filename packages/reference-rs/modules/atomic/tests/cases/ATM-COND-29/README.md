# ATM-COND-29 — Stacked pseudo-compound reorder

Stacked pseudo-class under a pseudo-element parent reorders before the
element (`'&::before'` + `'&:focus'` → `:focus::before`), in raw keys and
the `_before`/`_focus` dialect, at every stack depth.
Contract: SPEC.
