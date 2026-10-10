# Tree

Single-select hierarchical tree with roving focus, APG keyboard
traversal, character typeahead, and controlled expansion. It also
serves as a Combobox dropdown body: nested in a Combobox it yields
commits and DOM focus to the source while owning expansion itself.

Contract: [Tree.md](./Tree.md). Cases: [TESTS.md](./TESTS.md).

The root is composition only: a session hook owns every ref and state
cell, behavior hooks add expansion, selection, focus, and keyboard
decisions, and the item scope they provide feeds the Item, Group, and
Expander parts. Beneath the hooks, each problem owns a folder.
Expansion emits deterministic payloads. Siblings keep posinset/setsize
honest. Typeahead names each row's search label. Navigation resolves
reading direction for arrow mirroring. Shared holds the development
diagnostic. Pure decisions carry colocated unit tests; browser behavior
proves out in CT.

| Folder | Role |
| :--- | :--- |
| [`parts/`](./parts) | Item row, Group container, Expander chevron |
| [`hooks/`](./hooks) | Session, expansion, selection, focus, keyboard, item wiring |
| [`expansion/`](./expansion) | Deterministic emission reducer |
| [`siblings/`](./siblings) | Sibling-set metadata refresh |
| [`typeahead/`](./typeahead) | Row search-label extraction |
| [`navigation/`](./navigation) | Shadow-crossing direction resolution |
| [`shared/`](./shared) | Development diagnostic |

`context.ts` scopes the private item subtree (the Law 3 allowance):
items read selection, expansion, focus, and keyboard commands from the
root scope, groups and expanders read identity from the item scope, and
groups bump the level scope — while Combobox nesting is read from the
Combobox context directly.
