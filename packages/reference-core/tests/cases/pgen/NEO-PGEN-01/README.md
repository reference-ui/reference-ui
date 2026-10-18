# NEO-PGEN-01 — the 27 html-flow probes render their own tags, paint both style paths, and stamp markers

The world renders one probe per html-flow family member inside a plain census
root: 27 primitives, each carrying `color="brand"` plus its tag id, with the
Article probe adding a `css` background. The spec reads the root's children in
a single DOM pass and asserts the count is 27, each probe's element name
matches its tag, every probe paints brand, the css background paints ink, each
carries its `ref-<tag>` marker and the system layer, and no styling key lands
as an attribute. Related: NEO-PRIM-09 (the full 101 census this family slice
refines), NEO-PRIM-02 (the css-prop conflict precedent), NEO-PGEN-02 (the
text slice with the same paint contract).
