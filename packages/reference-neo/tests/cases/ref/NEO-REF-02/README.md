# NEO-REF-02 — reference symbol queries

Ports of the matrix `reference-output` unit tests that query symbols through the tasty API: local interface
members, indexed-access readability, StyleProps projection, extends flattening, and direct-alias identity.
The world carries the oracle fixture corpus verbatim (docs, JSDoc tags, API barrel); both specs await the
background manifest explicitly, then open a fresh API per section like the matrix helpers do.

> Search terms: symbol queries, tasty api, StyleProps projection, indexed access, extends flattening, pinned alias, composed alias, reference-output, NEO-REF-03, NEO-REF-09

## Oracle mapping

`01-symbols.spec.ts` carries matrix tests 1 (local half), 2, 1 (composed half), 4, and 5 with identical
expectations: `[label, disabled, variant]` members, the `indexed_access` raw shape with its `solid | ghost`
description, composed projection across the intersection, interface-extends-alias flattening to
`[label, size, tone, hasMenu]`, and the pinned alias keeping `DocsReferencePinnedTarget` identity with
`[label, disabled]` display members.

`02-style-projection.spec.ts` carries matrix tests 1 and 3 (style halves): exactly one `StyleProps` resolves,
it projects the style surface (`accentColor`, `container`, 90+ members), and both extending fixtures inherit
the surface plus their locals (`localTone`, `localFlag`).

## Known deltas

- **D-OPEN-1 (RESOLVED):** the closure indexed generated `index.d.ts`, so a second top-level `StyleProps` made the bare lookup throw ambiguous — the RS scoped-external-ref fix plus the single-root closure change (`style-props.d.ts` alone) resolved it; `02-style-projection.spec.ts` green, 26/26.
- **Generator inventory (not reference parity):** the oracle asserts a `WebkitAppearance` member and 100+
  counts, but the neo styled generator emits a smaller vendor set (no `Appearance` member anywhere). The
  specs pin `accentColor`/`container` plus 90+ counts instead — the projection mechanism is the reference
  parity; the vendor inventory belongs to the styled generator's own voyage concern.
- The fixture imports `SystemStyleObject` from `@reference-ui/styled/types` (ambient-typed pre-sync, linked
  post-sync) where matrix imports from `@reference-ui/system`: the neo generated system package carries no
  style surface. Same resolved type, honest seam.
