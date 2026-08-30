# Collapsible

Coordinates a single disclosure trigger and content region: `aria-expanded`, `aria-controls`, controlled visibility.

```tsx
<Collapsible open={open} onChange={setOpen}>
  <Collapsible.Trigger>Details</Collapsible.Trigger>
  <Collapsible.Content>{children}</Collapsible.Content>
</Collapsible>
```

Inside Accordion, identity is `id` and expansion is driven by the Accordion value. Do not pass `open` when nested.

## Proposed API

```ts
interface CollapsibleProps {
  children?: React.ReactNode
  open?: boolean
  onChange?: (open: boolean) => void
  id?: string
  disabled?: boolean
}

interface CollapsibleTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

interface CollapsibleContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}
```

`Collapsible` renders no node. `Collapsible.Trigger` renders `button`. `Collapsible.Content` renders `div`.
