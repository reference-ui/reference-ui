# Slot

Named-region registration for declarative component APIs. A part
registers an element into a slot id; the host reads the shared registry
and renders that element in the matching region. Authors compose parts
in any order; the host never collects them through layout props.

Contract: the Slot contract. Cases: the Slot test catalog.

Slot renders no node — there is no `<Slot>` host and no root component
file, only the factory, the store, and the hooks — so this root holds
`index` (barrel), `types` (shared vocabulary), and `context`
(the factory that mints one isolated slot universe per compound).

The architecture splits along the kernel's central discipline:
structural change versus live content. The `registry/` store counts
structural set changes in its version and notifies subscribers only for
those; the `registration/` live container keeps element, meta, and
visibility fresh through getters without ever moving the version. The
`hooks/` factories bind both sides to React — one hook registers the
container and manages its lifecycle, two hooks subscribe to the version
and select at snapshot time — while `visibility/` collapses display
flags to a verdict that travels as data, never as structure. Hosts
finish the picture with the pure helpers in `host/`, and the id
sequence all fillers share lives in `shared/`.

Data flows one way: fillers write through `useSlotRegistration` into
the store, hosts read through `useSlot` / `useSlots`, and nothing but
an explicit register or unregister bends the version that wakes hosts
up. The colocated suites prove each module alone — store, visibility,
host helpers, live container, ids, hooks — and the browser
gates prove the composed compound: regions render, content refreshes
in place without remount, prefix selection reacts, and visibility
toggles without unregistering.

Up: Components.
