# Overlay

A controlled foundation for temporary content displayed above and isolated from the application.

Overlay handles portal rendering, layer-stack registration, nesting, dismissal ordering, focus containment (`FocusLock`), background inerting, scroll locking, and focus restoration.

It does not provide a trigger or prescribe the content's semantic role, structure, placement, dimensions, animation, or appearance.

```tsx
<Overlay open={open} onDismiss={close}>
  <Overlay.Backdrop />

  <Overlay.Content
    role="dialog"
    aria-modal="true"
    aria-labelledby="overlay-title"
  >
    <h2 id="overlay-title">Delete project?</h2>
    {children}

    <button type="button" onClick={close}>
      Cancel
    </button>
  </Overlay.Content>
</Overlay>
```

Overlay portals internally by default. `Overlay.Portal` is an optional configuration part; it does not wrap or own the overlay content.

```tsx
<Overlay open={open} onDismiss={close}>
  <Overlay.Portal container={portalContainer} />
  <Overlay.Backdrop />
  <Overlay.Content>{children}</Overlay.Content>
</Overlay>
```

Dismissal requests do not change application state. Granular handlers run first; `onDismiss` fires if they do not `preventDefault()`:

```text
onEscape(event)       → if (!event.defaultPrevented) → onDismiss()
onOutsidePress(event) → if (!event.defaultPrevented) → onDismiss()
```

`Overlay.Content` accepts `initialFocus`. When omitted, Overlay focuses the first tabbable descendant. A ref focuses that element. `false` skips the move.

`open={false}` does not unmount immediately. Overlay keeps Backdrop and Content mounted through the exit cycle via Presence, and sets `data-state="open" | "closed"` on both.

Overlay, Popover, and Menu share one layer stack. Escape dismisses only the topmost layer. An outside-press whose target is inside a nested popup does not dismiss the parent.

## Proposed API

```ts
interface OverlayDismissHandlers {
  onDismiss?: () => void
  onEscape?: (event: KeyboardEvent) => void
  onOutsidePress?: (event: PointerEvent) => void
}

interface OverlayProps extends OverlayDismissHandlers {
  children?: React.ReactNode
  open: boolean
}

interface OverlayPortalProps {
  container?: PortalProps["container"]
}

interface OverlayBackdropProps
  extends React.HTMLAttributes<HTMLDivElement> {}

interface OverlayContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  initialFocus?: React.RefObject<HTMLElement | null> | false
}
```

`Overlay` renders no node. `Overlay.Backdrop` and `Overlay.Content` render `div`. `Overlay.Portal` renders nothing.
