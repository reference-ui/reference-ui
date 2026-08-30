# FocusLock

Contains keyboard focus inside a subtree: Tab cycles, programmatic focus is reclaimed, focus is restored when the lock deactivates. Overlay uses this internally. Distinct from `RovingFocus`, which moves `tabindex` among items inside a composite widget.

Does not add a wrapper node. Slots onto a single child. Overlay.Content is the lock container for dialogs; this primitive exists so that containment is not Overlay-only.

```tsx
<FocusLock>
  <Div role="dialog" aria-modal="true">
    {children}
  </Div>
</FocusLock>
```

`initialFocus` matches Overlay.Content: omitted focuses the first tabbable descendant; a ref focuses that element; `false` skips the move.

`shards` are elements that belong to the lock but live outside the child's DOM (a nested portalled popover). Focus may enter a shard without being pulled back.

```tsx
<FocusLock
  initialFocus={confirmRef}
  shards={[popoverContent]}
>
  <Div role="dialog" aria-modal="true">
    {children}
  </Div>
</FocusLock>
```

Disabled while the overlay is closed but still mounted for Presence exit. Restoration runs after Presence reports the exit complete.

## Proposed API

```ts
interface FocusLockProps {
  children?: React.ReactNode
  disabled?: boolean
  restoreFocus?: boolean
  initialFocus?: React.RefObject<HTMLElement | null> | false
  shards?: Array<HTMLElement | React.RefObject<HTMLElement | null>>
}
```

FocusLock renders no extra node.

Used by Overlay. Not used by Popover, Tooltip, or Toast (those are not isolated).
