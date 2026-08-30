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
interface AccordionCommonProps
  extends Omit<ReferencePartProps<"div">, "onChange"> {
  children?: React.ReactNode
  keyboard?: "headers" | "none"
}

interface AccordionSingleProps extends AccordionCommonProps {
  expansion?: "single"
  value?: string | null
  onChange?: (value: string | null) => void
}

interface AccordionMultipleProps extends AccordionCommonProps {
  expansion: "multiple"
  value?: string[]
  onChange?: (value: string[]) => void
}

type AccordionProps = AccordionSingleProps | AccordionMultipleProps
```

`Accordion` renders `div`. Nested Collapsible parts keep their native elements.
Omitted expansion/value/keyboard means controlled single/null state with APG
header arrow traversal. All enabled header buttons remain in the native Tab
sequence.

---

## Problems we own

Accordion is policy, not a second disclosure runtime. Nested Collapsibles stay Collapsibles.

### Single vs multiple

Single: opening one closes the others, and activating the open item always
permits the controlled `null` all-collapsed state. Reference UI has no separate
Radix-style `collapsible` prop. Multiple: independent ids in a `string[]`.

**Vendor.** Radix `type` single/multiple. Zag `multiple`. Base UI Accordion-on-Collapsible.

**Lift.** Our name is `expansion`.

### Keyboard between headers

Arrow/Home/End move among triggers, while every enabled header button remains
in the normal Tab sequence as required by the APG accordion pattern. Reuse the
shared collection ordering/disabled-skip helpers, but do not apply
RovingFocus's one-tab-stop behavior.

**Vendor.** Radix accordion key handler. Zag `GOTO.NEXT/PREV/FIRST/LAST`.

**Lift** behind `keyboard="headers"`. `keyboard="none"` leaves arrow traversal
to the application.

### Nested `open` vs Accordion `value`

When nested, expansion is the Accordion value. Passing `open` on the child fights the collection. Document that; do not invent a third state.

---

## Convergence

**radix accordion** + Base UI’s Accordion-on-Collapsible composition. Header
traversal shares collection utilities but preserves native Tab stops.
