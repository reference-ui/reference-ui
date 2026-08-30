# Accordion

Coordinates a collection of Collapsibles: single/multiple expansion and optional keyboard traversal between headers.

```tsx
<Accordion expansion="single" value={value} onChange={setValue}>
  <Collapsible id="billing">
    <Collapsible.Trigger>Billing</Collapsible.Trigger>
    <Collapsible.Content>{children}</Collapsible.Content>
  </Collapsible>
  <Collapsible id="team">
    <Collapsible.Trigger>Team</Collapsible.Trigger>
    <Collapsible.Content>{children}</Collapsible.Content>
  </Collapsible>
</Accordion>
```

`expansion="multiple"` takes `string[]`.

## Proposed API

```ts
type AccordionValue = string | string[] | null

interface AccordionProps {
  children?: React.ReactNode
  expansion?: "single" | "multiple"
  value?: AccordionValue
  onChange?: (value: AccordionValue) => void
  keyboard?: "headers" | "none"
}
```

`Accordion` renders `div`. Nested Collapsible parts keep their native elements.
