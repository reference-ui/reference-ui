# Tooltip

Proof: [TESTS.md](./TESTS.md).

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

---

## Problems we own

Tooltip is a policy layer on Popover positioning, not a modal Overlay. No FocusLock, no inert, no trap. It must still be dismissible, hoverable, and persistent enough to read (WCAG 1.4.13).

### Open / close delays

Too short flickers; too long fails WCAG. Keyboard focus should open immediately (focus-visible); hover is delayed. Leave cancels a pending open.

**Vendor.** Radix default 700ms. Aria 1500 / close 500. Zag machine `opening`/`closing` (400 / 150) — clearest states. Floating UI `useHover` `delay` / `restMs`; touch → 0.

**Lift** Zag-style state machine. Defaults are product; freeze them in tests.

### Skip-delay across neighbours

After one tooltip shows, moving to the next opens **instantly** for a short window. Only one visible. Opening another closes the current, often without animation.

**Vendor.** Radix Provider `skipDelayDuration` 300. Aria `globalWarmedUp` + `tooltips` map. Zag `setGlobalId`. Floating UI `FloatingDelayGroup`.

**Lift** the algorithm onto a module-level group mounted with `ReferenceLibrary`. **Leave** `Tooltip.Provider` as a public API (`components.md`).

### WCAG 1.4.13

Escape dismisses without moving pointer/focus. If content is hoverable, the pointer may enter it. Default Tooltip is **non-interactive** — no buttons, no links. Interactive hover is Popover `openOnHover`.

**Vendor.** Radix `DismissableLayer` + optional `TooltipContentHoverable` / `disableHoverableContent`. Aria Escape in `useTooltipTrigger`. Zag `closeOnEscape` + `interactive` flag.

**Lift** Escape + light dismiss (pointerdown outside). Hoverable hull is opt-in; prefer sending interaction to Popover.

### Close on scroll vs reposition

Popover **repositions** (`autoUpdate`). Tooltip usually **closes** — a stale description beside a scrolled-away trigger is worse. Ignore scroll inside `input`/`textarea`.

**Vendor.** Radix capture-phase scroll if target contains trigger. Aria `useCloseOnScroll.ts`. Zag `closeOnScroll` default true.

**Lift** close-on-scroll for Tooltip. Do not default Tooltip onto Popover’s living position.

### Pointer vs keyboard modality

Synthetic hover after keyboard can reopen. Press should close. Hover only if modality is pointer; focus opens when focus-visible.

**Vendor.** Aria `getInteractionModality` / `isFocusVisible`. Zag `trackFocusVisible`.

**Lift.**

### Positioning

Same Floating UI flip/shift/arrow as Popover. Usually no `size`/scrollable body. Hide-vs-close on clip: close.

---

## Convergence

**Positioning:** Floating UI core (shared with Popover). **Behaviour:** Radix/Aria/Zag tooltip machines for delay, skip-delay, Escape, scroll-close. **Leave:** public Provider, HoverCard-as-Tooltip, Floating UI React `useHover` as the overlay runtime.
