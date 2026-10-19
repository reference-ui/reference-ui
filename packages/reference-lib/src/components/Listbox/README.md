# Listbox

Single- and multi-select listbox with roving tabindex, character
typeahead, and a virtualization contract for windowed rows. It also
serves as the Combobox dropdown body: nested in a Combobox it yields
commit authority, renders check slots, and follows the active option.

Contract: the Listbox contract. Cases: the Listbox test catalog.

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

`context` scopes the private option subtree (the Law 3 allowance):
options read selection, focus, registration, typeahead, and navigation
from it, and read the Combobox context directly when nested.

Up: components.
