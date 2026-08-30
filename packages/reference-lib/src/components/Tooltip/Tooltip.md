# Tooltip

Transient informative descriptions linked from the trigger with `aria-describedby`. Content is non-interactive. Hover intent delays, skip-delay across neighbouring tooltips, keyboard focus display, non-modal Escape dismissal (WCAG 2.1 SC 1.4.13). Interactive hover content is a `Popover` with `openOnHover`.

```tsx
<Tooltip
  open={open}
  onOpen={() => setOpen(true)}
  onDismiss={() => setOpen(false)}
>
  <Tooltip.Trigger aria-describedby="save-tip">Save</Tooltip.Trigger>
  <Tooltip.Content id="save-tip" placement="top">
    Save the document
  </Tooltip.Content>
</Tooltip>
```

If `id` is omitted on Content, Tooltip generates one and wires `aria-describedby` onto the trigger. `Tooltip.Trigger` slots onto a single child (no `as` prop).

## Proposed API

```ts
interface TooltipProps extends OverlayDismissHandlers {
  children?: React.ReactNode
  open: boolean
  onOpen?: () => void
  openDelay?: number
  closeDelay?: number
}

interface TooltipTriggerProps {
  children?: React.ReactNode
}

interface TooltipContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  placement?: PopoverPlacement
  offset?: number
}
```

`Tooltip` renders no node. `Tooltip.Content` renders `div` with `role="tooltip"`.
