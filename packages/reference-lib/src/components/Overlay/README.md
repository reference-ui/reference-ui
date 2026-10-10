# Overlay

A controlled foundation for temporary content above the application: where
Content binds (unbound, anchored, or edge), how isolated the page becomes,
and how the layer opens and closes. Dialogs, drawers, sheets, popovers,
menus, and tooltips are all compositions of this kernel — role, copy, and
chrome stay in application markup.

Contract: [Overlay.md](./Overlay.md). Proof: [`__e2e__/`](./__e2e__)
plus colocated `*.test.ts` beside each isolated domain.

The root holds the public surface (`Overlay.tsx`, `types.ts`, `index.ts`)
and the private subtree scoping (`context/`); every other concern gets a
module folder. `stack/` is the document layer registry every popup shares,
so Escape and outside-press always resolve against one ordering.
`geometry/` binds Content to its anchor, edge, or viewport; `dismiss/`
turns Escape and outside presses into dismissal requests; `isolation/`
locks focus, scroll, and pointer to the top layer; `gesture/` reads Handle
swipes as dismiss-or-snap-back. `hooks/` and `parts/` compose those domains
into the six public parts, and `shared/` carries the nameless plumbing they
agree on.
