# Slot

Proof: [TESTS.md](./TESTS.md).

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
interface SlotProps
  extends Omit<ReferenceSlotPartProps, "children"> {
  children?: React.ReactElement | null | false
  [key: string]: unknown
}
```

Slot renders no node.

---

## Problems we own

Slot is the merge kernel. Getting it wrong silently breaks every composite that uses it (RovingFocus, Tooltip.Trigger, FocusLock).

### Handler order and `preventDefault`

Child handler runs first. If the child calls `event.preventDefault()`, the Slot handler **must not** run. This matches Overlay’s granular-then-`onDismiss` contract.

**Vendor.** Radix Slot (`vendor/radix-primitives/packages/react/slot`) runs child then slot **always** — it does **not** skip on `defaultPrevented`.

**Do not copy Radix merge verbatim.** Lift class/style/ref/aria-describedby composition; add the preventDefault short-circuit from `components.md`.

### Composite ARIA ids

`aria-describedby` / `aria-labelledby` concatenate valid tokens and dedupe. Child tokens first.

**Vendor.** Radix Slot does this. Lift.

### Nested slots and single-child

Nested Slot must merge onto the deep element, not a wrapper. Multiple children or a text node throw when Slot is active. Empty/`null`/`false` pass through.

**Vendor.** Radix `Slottable`. Lift the invariant through Slot's frozen nested
merge behavior; a public `Slottable` component remains explicitly excluded.

### Refs

Unstable composed refs loop (Radix Presence #3664 is the same class of bug). The merged ref callback must be stable.

---

## Convergence

Primary: Radix Slot **except** preventDefault skip. That skip is a Reference UI contract, not a Radix bug — Overlay dismissal depends on it.
