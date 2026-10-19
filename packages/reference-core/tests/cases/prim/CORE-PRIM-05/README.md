# CORE-PRIM-05 — first primitive stamps `data-layer`, nested inherits, inner tree restamps

The world renders a settled tree (outer `colorMode="light"` plus a nested
Div) and mounts a second React tree on a host nested inside it, standing in
for a second system's boundary: separate trees share no scope context. The
spec checks the outer stamps the layer, the middle inherits it without
restamping, and the inner tree stamps it again, while the inner probe still
paints through the shared runtime.

Evidence: `shouldEmitLayerScope`, portal-boundary restamp; the Core context coverage.

> Search terms: inheritance, scoping, isolation, multi-tree, scope cascade, prim/layer-scope, prim/nested-trees
