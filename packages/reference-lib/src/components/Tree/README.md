# Tree

Single-select hierarchical tree with roving focus, APG keyboard
traversal, character typeahead, and controlled expansion. It also
serves as a Combobox dropdown body: nested in a Combobox it yields
commits and DOM focus to the source while owning expansion itself.

Contract: the Tree contract. Cases: the Tree test catalog.

The root is composition only: a session hook owns every ref and state
cell, behavior hooks add expansion, selection, focus, and keyboard
decisions, and the item scope they provide feeds the Item, Group, and
Expander parts. Beneath the hooks, each problem owns a folder.
Expansion emits deterministic payloads. Siblings keep posinset/setsize
honest. Typeahead names each row's search label. Navigation resolves
reading direction for arrow mirroring. Diagnostics decides which
controlled ids name no item, and shared holds the development channel that
reports them. Pure decisions carry colocated unit tests; browser behavior
proves out in CT.

`context` scopes the private item subtree (the Law 3 allowance):
items read selection, expansion, focus, and keyboard commands from the
root scope, groups and expanders read identity from the item scope, and
groups bump the level scope — while Combobox nesting is read from the
Combobox context directly.

An item learns it owns a group by scanning its children at render time:
no registration can inform that branch/leaf decision under
`renderToString`, and `TR-ENV-01` pins branch-path server HTML. The
Combobox virtual-focus bridge is Combobox-owned; Tree implements its
side with no new props. Shadow roots ride the Portal event contract
with owning-root reads only — no Tree event fork.
