# NEO-PRIM-09 — every one of the 101 tags renders its own element name

The world renders one self-closing probe per tag inside a plain census root:
101 primitives, no style props, each carrying only its tag id. The spec reads
the root's children in a single DOM pass and asserts the count is 101 and each
probe's element name matches its tag. Lowercased comparison absorbs the SVG
case split (`svg` reports lowercase, HTML reports uppercase).

Evidence: `[core]` `packages/reference-core/src/system/primitives/tags.ts`
(the 101-tag set plus the `Obj`/`Var` map rule).

> Search terms: intrinsic elements, host components, jsx tags, element registry, complete roster, prim/tags, prim/intrinsic-set, NEO-PRIM-10
