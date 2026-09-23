# generated/primitives (placeholder)

This shelf is reserved for the RS-emitted primitive roster: generated
tag tables with the canon as source. It is empty on purpose — no RS
emitter exists yet, and no re-export shim fakes generatedness.

Today the hand copy in `primitives/tags.ts` (101 names) stays
authoritative, and per-system emission is untouched. The canon
(`ELEMENTS`, 125 entries in `reference-rs/modules/canon`) is the future
source, but the NIGHT-5 waves that emit it are morning work, gated on the
11 AM picks: the rank-1 home, 125-vs-101, and SVG scoping. See NIGHT-5 in
the mission log. The cutover migrates the request builder's
`primitiveNames` argument onto this shelf; until then the builder takes
the hand copy as a plain param.
