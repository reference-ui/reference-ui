# Portal features

## 1. Shadow-portal event contract (from DECISIONS gap #1)

What it does: placement of Portal children into a ShadowRoot already works
(PT-DOM-05, PT-ENV-03, PT-COMP-03), but key/pointer event delivery across the
shadow boundary is unowned — native targets retarget to the host under React
container delegation, so item handlers never fire (ENV-03 skips in tree, menu,
date-field DF-COMP-04/ENV-01, combobox CB-COMP-04 modal+shadow).

API: undecided — either Portal attaches shadow-root listeners / a retargeting
shim for the event half, or the contract is documented as unsupported and
consumers stay in light DOM.

Maintainer take: HQ must assign ownership (Portal vs Overlay vs per-consumer) before any shadow consumer ships.
