# Menubar

Controlled-only menu bar: one value names the open menu, one `onChange`
carries every user-driven switch. Each `Menu` owns a Popover that is open
exactly when the bar value names it, so opening one menu closes the
others by construction — there is no open-set to reconcile.

Cases: [TESTS.md](./TESTS.md). Item semantics live with
[Menu](../Menu/Menu.md).

The root is composition only: a state hook owns the controlled value
requests, the trigger registry, and adjacent-menu moves, while the JSX is
a context provider over a horizontal `RovingFocus` row. Beneath it the
bar splits by job. Parts render the menu scope, the roving trigger, and
the popover panel hosting a `Menu`. The state hook answers which menu is
open and which comes next; the nav kernel computes the move itself as a
pure function of keys and ordered values. Shared holds the dev diagnostic
every part warns through. Pure moves carry colocated unit tests; mounted
behavior proves out in colocated Vitest and CT.

| Folder | Role |
| :--- | :--- |
| [`parts/`](./parts) | Menu scope, Trigger, Content |
| [`hooks/`](./hooks) | Bar state: value, registry, adjacency |
| [`nav/`](./nav) | Pure arrow/adjacency move computation |
| [`shared/`](./shared) | Dev warning channel |
