# Portal

Moves content to another location in the DOM while preserving its position in the React tree. Does not add a wrapper or manage stacking, focus, dismissal, or modality.

The default container is `document.body`.

```tsx
<Portal>{children}</Portal>
```

```tsx
<Portal container={portalContainer}>
  {children}
</Portal>
```

The container may be an element, a ref, or a function.

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
