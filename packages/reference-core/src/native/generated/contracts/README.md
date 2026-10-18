# generated/contracts (placeholder)

This shelf is reserved for the vendored wire-format declarations: a
committed copy of the RS dist contracts closure, shadowing the live
`node_modules` entries Neo typechecks against today. It is empty on
purpose — nothing here yet is generated, and no shim pretends otherwise.

The future shape mirrors the tasty shelf: a second vendor tool with its
own entry set over `dist/contracts/types.d.ts`, tsconfig mappings onto
the vendored tops, and `--check` freshness wiring as a prerequisite, not
an afterthought. Vendoring without the check would repeat the tags drift:
a committed copy silently trailing its source with no gate to catch it.

Until then the contracts stay live and types-only, and the structural
carries the dist types trail live in the native contract beside this
shelf — which is also what the streams seam types against.
