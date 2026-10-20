# Portal

Transparent relocation: children keep their place in the React tree while
their DOM nodes land somewhere else — with no wrapper, no stacking, no
focus, and no dismissal. That restraint is the whole design, and the
folders below are the three questions relocation asks, in order.

Contract: the Portal contract. Proof: the Portal test catalog.

`destination/` answers *where*: pure resolution math mapping every
accepted `container` form onto a node or null, plus the owner-document
derivation the scope reset needs. `hooks/` answers *when*: the client
mount gate that keeps the server and first paint empty, the commit-time
re-resolution that moves the subtree exactly once on a container swap,
and the frame check that catches late-attaching ref targets. `scope/`
answers *under what claims*: the layer-scope reset and destination
document that re-anchor the physical tree while logical context flows
through. `shared/` holds the one shape guard resolution and lifecycle
agree on.

`Portal` composes the three answers into a single conditional around
a single `createPortal`; `types` is the vocabulary they share; and
`index` re-exports both as the public surface `Overlay` and `Popover`
configure against. There is no `parts/` folder because Portal renders no
parts — children-only output is the contract — and no `context`
because Portal creates no context of its own; it only resets the layer
scope owned by `@reference-ui/react`.

Portal owns the shadow event contract: listeners attach per container
on mount, so shadow-root events dispatch with the true target and no
retargeting shim exists. Handlers on React ancestors at or above the
shadow host fire twice per shadow event (true target, then retargeted
to the host) — consumers keep common-ancestor handlers idempotent.
Placement lands children directly in the root in order with no
wrapper; a late-resolving destination gets exactly one copy, never a
transient body copy; content handlers fire exactly once in logical
bubble order.

Portal owns the theme contract too. The reset re-anchors the physical
tree so the first primitive child emits `data-layer` and the canonical
`data-color-mode`; resolution is explicit prop, then logical context,
then the destination document, then unstamped — never an invented
default. No surface grows its own color-mode bridge, DOM sniffer,
wrapper, or dark fallback.
