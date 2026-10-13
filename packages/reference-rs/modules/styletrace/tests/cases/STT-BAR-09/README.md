# STT-BAR-09 — Compound dotted names use the exported alias, not the local binding

`TabsRoot.Item = Item` onto a local compound, followed by `export const Tabs = TabsRoot`, mints the dotted host under the exported name: Tabs.Item.
The unexported local binding TabsRoot mints no host of its own, so the name TabsRoot.Item never appears.
