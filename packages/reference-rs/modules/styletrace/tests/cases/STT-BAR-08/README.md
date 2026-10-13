# STT-BAR-08 — An Object.assign compound mints a dotted name for each style-bearing member

`export const Tabs = Object.assign(TabsRoot, { Item, Panel, Plain })` assigns each member onto the compound the same way `Tabs.Item = Item` does, so each style-bearing member mints a dotted host under the exported name Tabs.
Item and Panel trace under their own names and as Tabs.Item and Tabs.Panel.
The style-less Plain mints nothing, and the unexported TabsRoot emits nothing.
