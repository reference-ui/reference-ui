# NEO-PGEN-12 — the live roster, the vendored vocabulary, and canon agree on 101 names.

The test-time freshness gate for the element roster: the live E2 roster from
the workspace RS build, the vendored E1 elements on Neo's shelf, and canon's
live HTML partition must carry the same 101 JSX names with no SVG-namespace
children anywhere. Any drift — a tag added in canon but not regenerated, a
stale vendor copy, an E2 export gained or lost — fails the case naming the
member. Related: NEO-PGEN-13 (the prop-name twin), NEO-PRIM-09 (re-anchored
census), NEO-PRIM-10 (re-anchored surface).

The three legs read independently so no two can drift together silently. The
roster leg imports the E2 module live and subtracts the seven pinned helper
exports; the shelf leg parses the committed E1 JSON; the canon leg parses the
current 125-row html.rs tables plus the overlay namespace partition with the
generator's own discipline, since canon has no napi export. The retired SVG
list itself is pinned against the live SVG partition, so a 25th SVG child
fails loud. The case then proves its own diff trips: Div dropped from a
roster copy and Box added to an E1 copy must both surface by name, or the
gate is decoration and the case fails.
