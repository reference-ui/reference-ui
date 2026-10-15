# Listbox

Single- and multi-select listbox with roving tabindex, character
typeahead, and a virtualization contract for windowed rows. It also
serves as the Combobox dropdown body: nested in a Combobox it yields
commit authority, renders check slots, and follows the active option.

Contract: [Listbox.md](./Listbox.md). Cases: [TESTS.md](./TESTS.md).

The root is composition only: a session hook owns every ref and state
cell, behavior hooks add registry, roving focus, selection, navigation,
and typeahead decisions, and the option scope they provide feeds one
row part plus presentational grouping parts. Beneath the hooks, each
problem owns a folder. Selection reduces multi-toggles to collection
order. Virtual validates mounted rows against logical items. Typeahead
searches the wrapping buffer query. Navigation resolves arrow targets.
Shared tells the option's own events apart from in-row interactivity.
Pure decisions carry colocated unit tests; browser behavior proves out
in CT.

| Folder | Role |
| :--- | :--- |
| [`parts/`](./parts) | Option row, Section, Header, Empty |
| [`hooks/`](./hooks) | Session, registry, focus, selection, navigation, typeahead, option wiring |
| [`selection/`](./selection) | Multi-toggle reducer |
| [`virtual/`](./virtual) | Adapter validation contract |
| [`typeahead/`](./typeahead) | Buffer advance and wrapping match order |
| [`navigation/`](./navigation) | Arrow-target index resolution |
| [`shared/`](./shared) | Interactive-descendant press guard and dev warn channel |

`context.ts` scopes the private option subtree (the Law 3 allowance):
options read selection, focus, registration, typeahead, and navigation
from it, and read the Combobox context directly when nested.
