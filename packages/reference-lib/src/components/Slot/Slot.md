# Slot

Merges props, event handlers, and refs onto a single child without wrapping DOM layers. Available to user-authored design-system components. Does not make Reference UI primitives polymorphic.

```tsx
<Slot onClick={onClick} className="toolbar-item">
  <Button>Bold</Button>
</Slot>
```

Merge rules:

- Child props win over Slot props, except styles, classes, and handlers.
- Handlers: child first; Slot second if `!event.defaultPrevented`.
- `className` concatenated. `style` merged shallowly; child wins per property.
- Refs composed. Composite ARIA ids (`aria-describedby`) concatenate tokens.
- Single-child invariant when active.

## Proposed API

```ts
interface SlotProps {
  children?: React.ReactNode
  [key: string]: unknown
}
```

Slot renders no node.
