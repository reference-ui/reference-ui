# generated/primitives

This shelf is Neo's committed copy of the RS-emitted primitive roster: the element
vocabulary as data plus the raw system-unbound component types. Its source of truth
is the primitives generator in reference-rs, which joins canon's tag tables with
typegen's prop definitions and prints committed artifacts; nothing on this shelf is
hand-authored, and nothing here is the authority for anything.

What lives here is exactly what crosses the cut as files. The JSON vocabulary is the
machine contract the per-system emitter and the PGEN station parity cases read: the
101 HTML elements with their JSX names and station families, the exact style-prop key
set, the named conditions, the alias map, the reserved keys, and the two host-element
overrides. The declaration file is the matching raw types: the exact style-prop union,
the per-tag props, and the shared generics, byte-identical to the generator output
apart from the provenance header this shelf stamps.

What does not live here is deliberate. The executable roster and its runtime trio ship
live from the workspace package and are never copied, so this shelf cannot drift from
the code that renders. The per-system bake — layer name, splitter list, css binding —
stays Neo-side at publish time, since only sync sees the system being built.

Freshness has three layers, and this shelf is the middle one. The vendor tool keeps
the bytes equal to the generator output and fails loudly otherwise; the station parity
cases fail on semantic drift against the live canon and typegen tables; the RS golden
pins the generator output itself. When the generator moves, re-run it, re-run the
vendor tool from the Neo package directory, and let the quality gate confirm the
shelf is fresh before anything else lands.
