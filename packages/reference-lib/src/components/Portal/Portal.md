# Portal

Proof: [TESTS.md](./TESTS.md).

Moves content to another location in the DOM while preserving its position in the React tree. Does not add a wrapper or manage stacking, focus, dismissal, or modality.

The default container is `document.body`. Consumers may provide another container for scoped themes, microfrontends, Shadow DOM, fullscreen, tests, or an application overlay root.

```tsx
<Portal>{children}</Portal>
```

```tsx
<Portal container={portalContainer}>
  {children}
</Portal>
```

The container may be an element, a ref, or a function — resolved later in the application lifecycle.

## Proposed API

```ts
type PortalContainer = Element | DocumentFragment

type PortalContainerRef = {
  current: PortalContainer | null
}

interface PortalProps {
  children?: React.ReactNode
  container?:
    | PortalContainer
    | PortalContainerRef
    | (() => PortalContainer | null)
    | null
}
```

Portal renders no wrapper.

Omitted or directly `null` container uses `document.body` after mount. A
supplied ref/function that currently resolves null is unresolved and renders no
transient body copy until its target exists.

---

## Problems we own

### SSR / hydration

Portalling to `document.body` on the server crashes. First paint must render nothing, then attach on the client.

**Vendor.** Radix Portal: `mounted` false until layout effect, then `document.body` (`vendor/radix-primitives/packages/react/portal`).

**Lift** the mount gate. Overlay and Popover inherit this by using Portal internally.

### No wrapper node

Radix Portal always wraps in `Primitive.div` unless `asChild`. An extra node breaks selectors, CSS containment, and the “transparent relocate” model.

**Lift** children-only into the container. ShadowRoot works as a `DocumentFragment`. Late-resolved containers (ref / function) are our addition — Radix only accepts `Element | DocumentFragment | null`.

### Overlay / Popover configuration part

`Overlay.Portal` and `Popover.Portal` configure the destination. They do not wrap content. That is a different shape from Radix’s `<Portal><Content/></Portal>` nesting.

**Leave** Radix’s host-node props (`className` on the portal wrapper). There is no wrapper to style.

---

## Convergence

Primary: Radix portal **mount gate**, not its wrapper. Container resolution is broader than Radix (ref + function) because agents and apps resolve overlay roots after mount.
