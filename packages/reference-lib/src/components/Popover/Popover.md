# Popover

Controlled, anchored floating content.

Owns positioning, collision handling, keyboard and pointer interaction, accessible state, outside dismissal, focus restoration, and registration on the shared layer stack with Overlay and Menu.

By default, `Popover.Trigger` is both the interaction source and the positioning anchor. An optional virtual `anchor` (element, rect, or point) is the positioning reference when the application already owns the interaction. When both are present, the trigger remains the interaction and accessibility source; `anchor` wins for positioning.

```tsx
<Popover open={open} onDismiss={close}>
  <Popover.Trigger onClick={() => setOpen((prev) => !prev)}>
    Open filters
  </Popover.Trigger>

  <Popover.Content placement="bottom-start" offset={8}>
    {children}
  </Popover.Content>
</Popover>
```

```tsx
<Popover
  open={open}
  onDismiss={close}
  anchor={{ x: pointerX, y: pointerY }}
>
  <Popover.Content placement="bottom-start">
    {children}
  </Popover.Content>
</Popover>
```

```tsx
<Popover open={open} onDismiss={close}>
  <Popover.Trigger onClick={() => setOpen((prev) => !prev)}>
    More information
  </Popover.Trigger>
  <Popover.Portal container={portalContainer} />
  <Popover.Content placement="top">
    <Popover.Arrow />
    {children}
  </Popover.Content>
</Popover>
```

`open={false}` does not unmount Content until exit animations complete (`data-state`).

Hover-opened interactive content uses `openOnHover`. Tooltip is the non-interactive case. HoverCard is this composition, not a separate primitive.

```tsx
<Popover
  open={open}
  onOpen={() => setOpen(true)}
  onDismiss={close}
  openOnHover
>
  <Popover.Trigger>Preview</Popover.Trigger>
  <Popover.Content>{children}</Popover.Content>
</Popover>
```

## Proposed API

```ts
type PopoverPlacement =
  | "top"
  | "top-start"
  | "top-end"
  | "right"
  | "right-start"
  | "right-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"

type VirtualAnchor =
  | Element
  | DOMRect
  | { getBoundingClientRect(): DOMRect }
  | { x: number; y: number; width?: number; height?: number }

interface PopoverProps extends OverlayDismissHandlers {
  children?: React.ReactNode
  open: boolean
  onOpen?: () => void
  anchor?: VirtualAnchor
  openOnHover?: boolean
  openDelay?: number
  closeDelay?: number
}

interface PopoverTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

interface PopoverPortalProps {
  container?: PortalProps["container"]
}

interface PopoverContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  placement?: PopoverPlacement
  offset?: number
  collisionPadding?: number
}
```

`Popover` renders no node. `Popover.Trigger` renders `button`. `Popover.Content` and `Popover.Arrow` render `div`. `Popover.Portal` renders nothing.
