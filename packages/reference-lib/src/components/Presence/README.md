# Presence

Keeps unmounting elements in the DOM until their exit effects complete —
CSS animations, CSS transitions, finite GSAP tweens — then removes them and
fires `onExitComplete` exactly once. Overlay, Popover, Collapsible, and
Toast all close through this kernel.

Contract: [Presence.md](./Presence.md). Cases: [TESTS.md](./TESTS.md).

The root holds the public surface (`Presence.tsx`, `types.ts`, `index.ts`)
and the private subtree scoping (`context.ts`); every other concern gets a
module folder. `hooks/use-presence` is the lifecycle kernel, composing four
decidable domains: `exit/` detects finite closing effects and watches for
their completion, `nesting/` holds a closing parent until its descendants
report back, `coordination/` holds Overlay's sibling parts until the slowest
finishes, and `shared/` carries the nameless plumbing (ref reads, ref
assignment, ids). Each domain owns isolated submodules with colocated unit
tests proving them without a browser; the component tests prove the
composition end to end.

Up: [Components](../components.md).
