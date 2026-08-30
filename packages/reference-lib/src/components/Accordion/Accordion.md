# Accordion

Proof: [TESTS.md](./TESTS.md).

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

---

## Problems we own

Accordion is policy, not a second disclosure runtime. Nested Collapsibles stay Collapsibles.

### Single vs multiple

Single: opening one closes the others (optional “all collapsed” — Radix `collapsible` on type=single). Multiple: independent ids in a `string[]`.

**Vendor.** Radix `type` single/multiple. Zag `multiple`. Base UI Accordion-on-Collapsible.

**Lift.** Our name is `expansion`.

### Keyboard between headers

Arrow/Home/End among triggers. This is RovingFocus over header buttons, not a reason to fork Collapsible.

**Vendor.** Radix accordion key handler. Zag `GOTO.NEXT/PREV/FIRST/LAST`.

**Lift** via `keyboard="headers"` composing RovingFocus. `keyboard="none"` when the application already owns traversal.

### Nested `open` vs Accordion `value`

When nested, expansion is the Accordion value. Passing `open` on the child fights the collection. Document that; do not invent a third state.

---

## Convergence

**radix accordion** + Base UI’s Accordion-on-Collapsible composition. Header roving is RovingFocus, not a unique Accordion kernel.
