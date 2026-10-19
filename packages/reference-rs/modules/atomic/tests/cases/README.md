# Atomic cases

Each folder is one `compile()` case and one `SPEC.md` ID. The folder
name is the ID (`ATM-COND-04`), not a slug. `spec.ts` exports that `id`
only. `README.md` in the folder is the local note; the contract lives in
[`SPEC.md`](../../SPEC.md).

The engine takes `input/` and emits `output/{styles.css,css.json,diagnostics.json}`.
The executor adds standing gauges on every (not extra case IDs):
the six-layer preamble (`ATM-LAYER-01`) and zero ghost classes (`ATM-GHOST-01`).

Add a folder here for a new ID. Do not hang a `*.test.ts` off `tests/`
itself: new suites go in `suites/`. Remaining `[ ]` IDs in SPEC are
folders-not-yet.

Goldens are the system’s outputs. `--update-goldens` rewrites them after a
real emission change.

Up: [atomic](../../README.md).
