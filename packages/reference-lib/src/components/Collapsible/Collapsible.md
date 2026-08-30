# Collapsible

Proof: [TESTS.md](./TESTS.md).

Coordinates a single disclosure trigger and content region: `aria-expanded`, `aria-controls`, controlled visibility.

```tsx
<Collapsible open={open} onChange={setOpen}>
  <Collapsible.Trigger>Details</Collapsible.Trigger>
  <Collapsible.Content>{children}</Collapsible.Content>
</Collapsible>
```

Inside Accordion, identity is `id` and expansion is driven by Accordion
`value`/`onChange`. Do not pass child `open` or `onChange` when nested;
Accordion is the sole state/request authority.

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
  extends ReferencePartProps<"button"> {}

interface CollapsibleContentProps
  extends ReferencePartProps<"div"> {}
```

`Collapsible` renders no node. `Collapsible.Trigger` renders `button`. `Collapsible.Content` renders `div`.
Outside Accordion, omitted `open` is controlled false.

---

## Problems we own

Native `<details>` exists; this primitive exists for controlled state, Accordion composition, and Presence exit (height animation without unmounting mid-transition).

### Presence + measure before close

Content must stay mounted through exit. Height animation needs the measured size **before** `open={false}` collapses — typically CSS variables on the content node.

**Vendor.** Radix Collapsible: Presence + `--radix-collapsible-content-height/width`. Zag collapsible machine. Base UI Accordion builds on Collapsible.

**Lift** Radix Presence+measure mapped to our Presence / `data-state`.
Content publishes
`--reference-collapsible-content-height` and
`--reference-collapsible-content-width`; applications own the CSS that consumes
them.

### `aria-expanded` / `aria-controls`

Trigger points at content id. Controlled `open` is application state. Ariakit `disclosure.ts` is a useful non-Radix reading of the same contract.

---

## Convergence

**radix collapsible** (Presence). Accordion is a collection policy on top, not a fork of this runtime.
