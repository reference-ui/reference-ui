# Portal test contract

Playwright: `matrix/lib/tests/e2e/portal.spec.ts`  
Page: `/portal`

Portal owns relocation only. It renders no host node.

## Source evidence

- `vendor/radix-primitives/packages/react/portal/src/portal.test.tsx` —
  “spreads them onto the element it renders inside a given `container`”.
- `vendor/radix-primitives/packages/react/portal/src/portal.tsx` — delays the
  default `document.body` lookup until mount.
- Radix's default wrapper and `asChild` tests are contrast: Reference UI always
  has children-only output.

## Required cases

### Destination and DOM

- [x] `PT-DOM-01` `[reference]` `[browser]` —
  **Portal should place every child directly in `document.body` when `container` is omitted.**
  Render two marked sibling elements through Portal after client mount.
  Assert that both are direct body children in authored order, the original
  React host contains neither child, and no Portal wrapper exists between
  body and either element.
- [x] `PT-DOM-02` `[reference]` `[browser]` —
  **Portal should preserve child shape and order when relocating mixed React children.**
  Portal a Fragment containing a text node followed by a nested application
  element with a marked descendant. Assert the same text and element nodes,
  nesting, and sibling order at the destination, with only their DOM parent
  changed and no added host.
- [x] `PT-DOM-03` `[vendor]` `[browser]` —
  **Portal should relocate all children into the supplied element when `container` is an `Element`.**
  Create a `<section>` destination and render multiple marked children through
  Portal from a separate React host. Assert that each child appears exactly
  once as a direct section child and nowhere beneath the original DOM parent
  or `document.body` outside that section.
- [x] `PT-DOM-04` `[reference]` `[browser]` —
  **Portal should retain children in a detached destination when `container` is a `DocumentFragment`.**
  Portal marked children into a detached fragment, verify their parent is the
  fragment, and then append that fragment to a connected host. Assert that
  the same child nodes become visible under the host in order, without a copy,
  remount, or wrapper.
- [x] `PT-DOM-05` `[reference]` `[shadow]` —
  **Portal should render children directly inside an open ShadowRoot when that root is the destination.**
  Attach an open ShadowRoot, pass it as `container`, and portal two marked
  children. Assert that both are direct shadow children in order, absent from
  light DOM, and not enclosed by a generated wrapper.
- [x] `PT-DOM-06` `[reference]` `[browser]` —
  **Portal should add nothing to its destination when its children are empty or falsy.**
  Render separate Portal fixtures with `null`, `false`, and an empty Fragment
  into a marked destination. Assert that the destination's child-node count
  does not change and that no render or console error occurs.
- [x] `PT-DOM-07` `[convergence]` `[browser]` —
  **Portal should update and fully remove destination content when its children rerender or unmount.**
  Portal a keyed element, change its text and attributes, add then remove a
  sibling, and finally unmount Portal. Assert that the keyed node updates in
  place, each current child has one copy, and the destination contains no
  orphaned portal nodes after unmount.

### Container resolution

- [x] `PT-CONTAINER-01` `[reference]` `[browser]` —
  **Portal should use an already resolved object ref when `container.current` holds an element.**
  Put a destination element in an object ref before rendering and pass the ref
  as `container`. Assert the same relocation result as a direct element:
  children exist once inside that destination, not in place or in the default
  body location.
- [x] `PT-CONTAINER-02` `[reference]` `[browser]` —
  **Portal should wait for an object-ref destination when the ref is null at mount.**
  Mount Portal with `container.current === null`, then assign a target and
  rerender the fixture. Assert no child appears in place or in
  `document.body` while unresolved, followed by exactly one copy in the
  resolved target and no transient default-body copy.
- [x] `PT-CONTAINER-03` `[reference]` `[browser]` —
  **Portal should wait for a resolver function when it initially returns null.**
  Pass a stable resolver that first returns `null`, later returns a marked
  element, and trigger a rerender after changing its result. Assert absent
  output while unresolved and one child in the returned element after
  resolution, never a fallback body or in-place copy.
- [x] `PT-CONTAINER-04` `[reference]` `[browser]` —
  **Portal should use the default body destination when `container` is explicitly null.**
  Render a marked child with `container={null}` and wait through the client
  mount gate. Assert that the child becomes a direct `document.body` child,
  remains absent from its logical DOM parent, and has no Portal wrapper.
- [x] `PT-CONTAINER-05` `[reference]` `[browser]` —
  **Portal should move its subtree exactly once when a resolved destination changes.**
  Start with target A, switch `container` to target B, and retain ref/effect
  logs on the portalled child. Assert A is empty, B contains one copy of each
  child, the old subtree detaches once, and the new subtree attaches once.
- [x] `PT-CONTAINER-06` `[reference]` `[browser]` —
  **Portal should preserve one mounted subtree when rerenders resolve to the same destination.**
  Keep a direct, ref-based, or function-based container resolving to the same
  element while unrelated parent state rerenders several times. Assert one
  child copy, stable child node identity and state, and no ref cleanup or
  effect remount.

### React-tree semantics

- [x] `PT-REACT-01` `[convergence]` `[react:all]` —
  **Portal should preserve logical context when its DOM destination belongs to a different React branch.**
  Provide context value `"logical"` above Portal and a different provider
  around the destination's DOM-owning branch, then read context in a
  portalled child. Assert that the child renders `"logical"` from its React
  ancestors rather than the destination branch's value.
- [x] `PT-REACT-02` `[convergence]` `[react:all]` —
  **Portal should bubble React events through logical ancestors when the child lives elsewhere in the DOM.**
  Put click logs on a portalled button, its logical React parent, and the DOM
  destination, then click the button once. Assert one child call and one
  logical-parent React call in bubbling order, with no duplicate logical call
  caused by relocation.
- [x] `PT-REACT-03` `[reference]` `[react:all]` —
  **Portal should preserve keyed child state when parents rerender without changing the destination.**
  Increment state inside a keyed portalled child, then rerender its logical
  parent with unrelated state while retaining the same key and container.
  Assert the child keeps its state and native node identity and does not run
  ref/effect cleanup.
- [x] `PT-REACT-04` `[reference]` `[react:all]` —
  **Portal should leave one visible subtree when StrictMode replays effects.**
  Mount a marked portalled child under StrictMode, record its lifecycle, and
  then unmount the application. Assert one visible child copy after replay,
  no orphan or duplicate at any settled point, and complete destination and
  ref/effect cleanup on final unmount.
- [x] `PT-REACT-05` `[reference]` `[react:all]` —
  **Portal should perform one documented subtree replacement when its destination changes from A to B.**
  Give a stateful child ref and mount/effect logs, switch the container from A
  to B once, and then unmount. Assert one cleanup in A, one attachment in B,
  exactly one visible copy throughout settled states, and no promise that the
  child's local state or node identity survives the new container.

### SSR and document boundaries

- [x] `PT-ENV-01` `[vendor]` `[ssr]` —
  **Portal should render safely when server execution has no `window` or `document`.**
  Server-render a Portal with a marked child and no explicit container while
  browser globals are unavailable. Assert no exception or global access and
  no portal-only child or wrapper markup in the server HTML.
- [x] `PT-ENV-02` `[reference]` `[ssr]` —
  **Portal should attach to `document.body` after hydration when the server emitted no portal content.**
  Hydrate the server result from `PT-ENV-01`, capture hydration diagnostics,
  and wait for the client mount gate. Assert no mismatch warning, no in-place
  first-frame child, and exactly one marked child directly under body after
  mount.
- [x] `PT-ENV-03` `[reference]` `[shadow]` —
  **Portal should resolve a ShadowRoot destination after hydration when that target is unavailable on the server.**
  Hydrate with an unresolved ref or resolver, attach an open ShadowRoot on the
  client, and rerender to resolve it. Assert no hydration warning or transient
  body copy and exactly one direct shadow child after resolution.
- [x] `PT-ENV-04` `[convergence]` `[browser:all]` —
  **Portal should honor the target's owner document when portalling into a same-origin iframe.**
  Pass an element from a same-origin iframe document, click a portalled button,
  and then unmount the logical parent. Assert that content is created only in
  the iframe target, React bubbling reaches the outer logical ancestor once,
  and refs/effects and DOM nodes clean up from the iframe document rather than
  the global document.

## Composition gates

- [x] `PT-COMP-01` `[reference]` `[browser]` —
  **Portal should relocate application content to the body when a composition uses the default destination.**
  Render a multi-node application layer through Portal without `container`,
  update it, and unmount it. Assert direct body placement with no wrapper,
  preserved React context/events during updates, and complete cleanup.
- [x] `PT-COMP-02` `[reference]` `[browser]` —
  **Portal should keep content inside a scoped overlay root when a theme or microfrontend supplies that destination.**
  Resolve a marked overlay root after mount, portal styled interactive content
  into it, and switch an unrelated parent state. Assert no transient body
  copy, one stable subtree in the scoped root, inherited scoped styling, and
  logical React event bubbling.
- [x] `PT-COMP-03` `[reference]` `[shadow]` —
  **Portal should preserve transparent relocation when a composition targets an open ShadowRoot.**
  Portal multiple interactive children into a ShadowRoot, activate one, then
  remove the composition. Assert direct shadow children in authored order,
  one logical React event sequence, no light-DOM wrapper, and full shadow
  cleanup.

`Overlay.Portal` and `Popover.Portal` each get one pass-through integration
case in their owner's spec. They do not copy this matrix.

## Out of scope

- Wrapper `className`, `style`, native props, or an `as` option: Portal has no
  wrapper.
- Stacking, focus, dismissal, inerting, and modality: `Overlay`.
- Positioning: `Popover`.
