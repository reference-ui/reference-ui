# hooks

Root and Content lifecycle, composed by `Overlay.tsx` and `parts/Content`.

- `use-open-state` — controlled / uncontrolled `open`
- `use-part-registry` — one of each part; mixed `edge` + `anchor` is a diagnostic
- `use-overlay-layer` — push / pop the document stack
- `use-layer-node` — publish Content's node to its stack layer; Presence
  keeps Content mounted through exit, so the layer drops only when closed
- `use-child-shards` — live child-layer nodes for FocusLock sharding
