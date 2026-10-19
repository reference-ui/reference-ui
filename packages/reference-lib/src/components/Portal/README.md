# Portal

Transparent relocation: children keep their place in the React tree while
their DOM nodes land somewhere else — with no wrapper, no stacking, no
focus, and no dismissal. That restraint is the whole design, and the
folders below are the three questions relocation asks, in order.

Contract: [Portal.md](./Portal.md). Proof: [TESTS.md](./TESTS.md).

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

`Portal.tsx` composes the three answers into a single conditional around
a single `createPortal`; `types.ts` is the vocabulary they share; and
`index.ts` re-exports both as the public surface `Overlay` and `Popover`
configure against. There is no `parts/` folder because Portal renders no
parts — children-only output is the contract — and no `context.ts`
because Portal creates no context of its own; it only resets the layer
scope owned by `@reference-ui/react`.

Up: [Components](../components.md).
