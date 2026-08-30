# Popover

Proof: [TESTS.md](./TESTS.md).

Controlled, anchored floating content.

Owns positioning, collision handling, keyboard and pointer interaction, accessible state, outside dismissal, focus restoration, and registration on the shared layer stack with Overlay and Menu.

By default, `Popover.Trigger` is both the interaction source and the positioning anchor. An optional virtual `anchor` (element, rect, or point) is the positioning reference when the application already owns the interaction — context menu, selection, canvas, table cell. When both are present, the trigger remains the interaction and accessibility source; `anchor` wins for positioning.

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

Hover-opened **interactive** content uses `openOnHover`. Tooltip is the non-interactive case. HoverCard is this composition, not a separate primitive.

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

---

## Problems we own

Positioning is math. Dismiss, nesting, and Presence are the Overlay kernel. Do not take Floating UI React as a second overlay runtime (`useDismiss`, `FloatingTree`, `FloatingFocusManager`).

### Flip / shift / offset

Preferred placement overflows. Middleware must try opposite / expanded / opposite-axis, then `bestFit`. Shift clamps into view without detaching from the reference (`limitShift`). Flip’s `reset` restarts the middleware chain (max 50) — arrow `alignmentOffset` must short-circuit or you thrash.

**Vendor.** `vendor/floating-ui/packages/core/src/computePosition.ts` plus `middleware/{flip,shift,offset}.ts`, `detectOverflow.ts`. Functional tests in `packages/dom/test/functional/`. Spectrum has a parallel `calculatePosition.ts` — **leave**. Radix `popper` — **leave**.

**Lift** core middleware + Playwright cases (not PNG snapshots).

### Arrow

Arrow padding can nudge the floating element. That reset must not re-trigger flip (`middlewareData.arrow?.alignmentOffset`).

**Vendor.** `middleware/arrow.ts` + interaction in flip/offset. `dom/test/functional/arrow.test.ts`.

**Lift** the math. **Leave** `FloatingArrow` chrome.

### Available height for list popups

Select, Combobox, and Menu need `availableHeight` so the popup scrolls instead of overflowing. Size middleware depends on whether shift already ran. ResizeObserver + size can loop (`autoUpdate` unobserves floating for a frame — Floating UI #1740).

**Vendor.** `middleware/size.ts`, `dom/src/autoUpdate.ts`. Radix exposes `--radix-*-available-height` via popper — lift the **idea**, not the CSS-var names.

**Lift** size middleware onto `Popover.Content`. That is positioning math, not a second primitive.

### Virtual anchors

Context menus are a point. Selection menus are a rect. Canvas/table cells are a `getBoundingClientRect`. autoUpdate must follow `contextElement` scroll/resize even when the reference is virtual.

**Vendor.** Floating UI `VirtualElement` (`packages/dom/src/types.ts`), `virtual-element.test.ts`. Base UI `PopoverPositioner` `anchor`. Aria `targetRect` / `getTargetRect`. `useClientPoint.ts` is the cursor-follow factory — steal the virtual-element idea, not the React hook package.

**Lift** into Popover `anchor`. Virtual anchors stay positioning math.

### Living position while open

Scroll ancestors of **both** reference and floating, resize, layout shift, visualViewport, iframe, shadow, zoom.

**Vendor.** `vendor/floating-ui/packages/dom/src/autoUpdate.ts` and its functional tests (`scroll`, `iframe`, `shadow-dom`, `top-layer`, `zoom`).

**Lift** the whole `autoUpdate` + tests.

### Hide when clipped

A popover can stay logically open while visually orphaned (scrolled out of the clipping context).

**Vendor.** `middleware/hide.ts` (`referenceHidden` / `escaped`).

**Lift** the flags. Policy (close vs hide visually) is product. Tooltip usually **closes** on scroll instead — different primitive.

### Safe polygon / grace travel (`openOnHover`)

The hard part of hover-opened interactive content is not the open delay. It is pointer travel from trigger into content without dismissing.

**Vendor.** Floating UI `packages/react/src/safePolygon.ts` — cursor triangle + trough, speed intent, opposite-side leave. Aria `useSafeArea.ts` — convex hull of both padded rects (placement-agnostic). Radix HoverCard is **delay-only** (no polygon) — weaker diagonal travel. Zag `rect/src/polygon.ts` is submenu intent (reusable math). Radix Tooltip hoverable uses a hull with padding 5.

**Lift** a first-class grace algorithm into Popover `openOnHover`. Freeze-gate Aria hull vs Floating UI triangle. **Leave** FloatingTree `parentId` coupling and Base UI’s vendored `floating-ui-react` as runtime.

### Impatient click after hover-open

Hover opens; the user clicks within ~500ms intending to “open,” but click dismisses.

**Vendor.** Base UI `stickIfOpen` / `PATIENT_CLICK_THRESHOLD` in Popover store.

**Lift** the behaviour. **Leave** the store API.

### Nested with Overlay

Same layer stack: Escape closes the popover first. Outside-press inside a nested popup does not dismiss the parent. Portalled popover registers as a FocusLock shard / dismissable branch.

**Vendor.** Radix popover + dismissable-layer + `useFocusScopeBranch`. e2e `popover.spec.ts` (modal vs non-modal in dialog).

**Lift** into the shared stack. **Leave** `FloatingFocusManager`.

Popover is not isolated: no FocusLock, no page inert. Modal Overlay behind it still owns those.

---

## Convergence

**Positioning engine:** Floating UI core + DOM `autoUpdate` + tests.

**Behaviour:** Radix popover e2e and dismissable-layer (not Radix popper).

**HoverCard:** Popover + `openOnHover` + grace polygon. Not a primitive.

**Leave:** `@floating-ui/react` overlay runtime, Spectrum positioner, Radix popper, a separate HoverCard.
