# plain_react_wrappers

Keeps wrappers around non-Reference UI out of the style-bearing surface.
Converted from fixtures/atlas-project components: UserBadge, AppCard, and
Button forward props into a mock fixture-demo-ui package (committed under
input/packages, remapped to node_modules at compile) that has no Reference
connection, so the forwarding chains end unconnected.
Sibling: `wrapper_chain` (chains that do reach a Reference primitive).
