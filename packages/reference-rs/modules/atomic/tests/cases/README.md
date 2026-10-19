# Atomic cases

Each folder is one `compile()` case and one `SPEC` ID. The folder
name is the ID (`ATM-COND-04`), not a slug. `spec` exports that `id`
only. The folder `README` is the local note; the contract lives in
`SPEC`.

The engine takes case input and emits the style sheet, CSS JSON, and diagnostics JSON.
The executor adds standing gauges on every (not extra case IDs):
the six-layer preamble (`ATM-LAYER-01`) and zero ghost classes (`ATM-GHOST-01`).

Add a folder here for a new ID. Do not hang a colocated test file off
the suite root itself: new suites go beside these cases. Remaining `[ ]`
IDs in SPEC are folders-not-yet.

Goldens are the system’s outputs. `--update-goldens` rewrites them after a
real emission change.

Up: atomic.
