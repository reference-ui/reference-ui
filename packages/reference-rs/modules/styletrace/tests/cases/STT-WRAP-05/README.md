# STT-WRAP-05 — Wrappers that forward props only into plain-React package components, with no Reference primitive downstream, are not traced

Keeps wrappers around non-Reference UI out of the style-bearing surface.
Converted from the old atlas-project fixture components: UserBadge, AppCard, and
Button forward props into a mock fixture-demo-ui package (committed with the case,
remapped to node_modules at compile) that has no Reference
connection, so the forwarding chains end unconnected.
Sibling: `STT-WRAP-07` (chains that do reach a Reference primitive).
