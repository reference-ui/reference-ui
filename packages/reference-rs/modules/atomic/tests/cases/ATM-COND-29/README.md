# ATM-COND-29 — Stacked pseudo-compound reorder station (ATM-COND-29, SPEC-V2-80)

Stacked pseudo-class under a pseudo-element parent reorders before the
element (`'&::before'` + `'&:focus'` → `:focus::before`), in raw keys and
the `_before`/`_focus` dialect, at every stack depth.
Contract: [SPEC.md](../../../SPEC.md) (SPEC-V2-80).
