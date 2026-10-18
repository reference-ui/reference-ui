# NEO-PGEN-04 — the 9 html-table probes nest inside a real table and Caption paints

The world renders one probe per html-table family member nested as a real
table: caption, colgroup with its void col, head, body, and foot sections
each with rows and header or data cells. The Caption probe is the
special-family guest the table needs to be complete. Every probe paints
`color="brand"`. The spec asserts each probe's element name, marker, layer
stamp, brand paint, and styling-key absence, then proves the nesting is a
real table: sections parent the table, cells resolve their table ancestor,
the col renders childless, and the caption paints brand. Related:
NEO-PGEN-11 (the caption override ref), NEO-PGEN-01 (the flow slice).
