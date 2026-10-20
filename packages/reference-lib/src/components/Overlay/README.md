# Overlay

A controlled foundation for temporary content above the application: where
Content binds (unbound, anchored, or edge), how isolated the page becomes,
and how the layer opens and closes. Dialogs, drawers, sheets, popovers,
menus, and tooltips are all compositions of this kernel — role, copy, and
chrome stay in application markup.

Contract: the Overlay contract. Proof: the component browser suite
plus colocated unit tests beside each isolated domain.

The root holds the public surface (`Overlay`, `types`, `index`)
and the private subtree scoping (`context/`); every other concern gets a
module folder. `stack/` is the document layer registry every popup shares,
so Escape and outside-press always resolve against one ordering.
`geometry/` binds Content to its anchor, edge, or viewport; `dismiss/`
turns Escape and outside presses into dismissal requests; `isolation/`
locks focus, scroll, and pointer to the top layer; `gesture/` reads Handle
swipes as dismiss-or-snap-back. `hooks/` and `parts/` compose those domains
into the six public parts, and `shared/` carries the nameless plumbing they
agree on.

One kernel, named policies: Popover and Tooltip are policy wrappers on
this runtime (isolation off, anchored geometry), and Dialog, Drawer,
Sheet, and Modal are compositions of it — never second runtimes. Toast
is not Overlay: a separate queue/host/timers runtime whose one seam
into the stack is pausing while an isolating overlay is open.
