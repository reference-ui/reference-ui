# STT-BAR-03 — Compound-member aliases such as Tabs.Panel = Panel mint dotted names for style-bearing targets, local or imported, and an alias onto a style-less component mints none

Compound-member aliases (`Tabs.Panel = Panel`) mint dotted hosts so member-form use sites (`<Tabs.Panel>`) collect. Covers local targets, an imported cross-module target (`Tabs.Section`), and the negative: the alias onto style-less `Plain` emits no host.
Expected names: Item, Panel, Section, Tabs.Item, Tabs.Panel, Tabs.Section.

> Search terms: member alias, compound component, dotted host, Tabs.Panel, cross-module alias
