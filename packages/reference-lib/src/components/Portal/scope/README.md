# scope

The boundary every portalled subtree crosses. Moving children across the
DOM severs CSS inheritance from their logical ancestors, so the scope
reset drops `LayerScopeContext` to `false` — letting the first Reference
primitive at the destination re-establish `data-layer` instead of
borrowing a scope it no longer sits inside — while publishing the
destination's document for theme reads that follow the physical tree.
Logical React context still flows through untouched; only the physical
claims are re-anchored. Like Portal itself, this layer renders no DOM of
its own.
