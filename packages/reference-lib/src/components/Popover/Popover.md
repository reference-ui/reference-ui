# Popover

Proof: [TESTS.md](./TESTS.md).

Controlled, anchored, **non-modal** floating content.

Geometry is Overlay's: the Floating UI port lives on `Overlay.Content` /
`Overlay.Arrow` / `Overlay.anchor`. Popover consumes that API. It does not
run a second `computePosition`.

Popover owns the rest: `Popover.Trigger` as the default reference and
interaction source, `onOpen`, hover grace (`openOnHover`), the Tab-order
bridge into portalled Content, and `closeOnScroll`. Overlay still supplies
outside-dismiss ordering, nesting, and the shared layer stack; Presence
supplies exit detection. Isolation (FocusLock, inert, scroll lock) stays
on Overlay — Popover is not modal.

By default, `Popover.Trigger` is both the interaction source and the
positioning anchor. An optional virtual `anchor` is the Overlay reference
when the application already owns the interaction — context menu, selection,
canvas, table cell. When both are present, the trigger remains the
interaction and accessibility source; `anchor` wins for Overlay geometry.

```tsx
<Popover
  open={open}
  onOpen={() => setOpen(true)}
  onDismiss={close}
>
  <Popover.Trigger>Open filters</Popover.Trigger>

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
<Popover
  open={open}
  onOpen={() => setOpen(true)}
  onDismiss={close}
>
  <Popover.Trigger>More information</Popover.Trigger>
  <Popover.Portal container={portalContainer} />
  <Popover.Content placement="top">
    <Popover.Arrow />
    {children}
  </Popover.Content>
</Popover>
```

`open={false}` does not unmount Content until exit animations complete
(`data-state`). Closed exiting Content is inert/noninteractive and no longer an
active dismissal layer, while positioning and the parent FocusLock branch stay
alive until exit/focus restoration completes.

Unprevented native click, Enter, or Space activation on Trigger requests
`onOpen` while closed and `onDismiss` while open. The consumer handler runs
first, so `preventDefault()` cancels the built-in request.

Hover-opened **interactive** content uses `openOnHover`; keyboard focus follows
the same accessible opening policy. Tooltip is the non-interactive case.
HoverCard is this composition, not a separate primitive.

Because Content portals, Popover bridges logical keyboard order: Tab from an
open Trigger enters the first Content control, and leaving the last control
advances relative to the Trigger's source position while requesting dismissal.
This is not a trap; outside programmatic focus remains outside.

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
type PopoverPlacement = OverlayPlacement

interface PopoverProps extends OverlayDismissHandlers {
  children?: React.ReactNode
  open: boolean
  onOpen?: () => void
  anchor?: VirtualAnchor
  openOnHover?: boolean
  openDelay?: number
  closeDelay?: number
  closeOnScroll?: boolean
}

interface PopoverTriggerProps
  extends ReferencePartProps<"button"> {}

interface PopoverPortalProps {
  container?: PortalProps["container"]
}

interface PopoverContentProps extends OverlayContentProps {}

interface PopoverArrowProps extends OverlayArrowProps {}
```

`Popover` renders no node. `Popover.Trigger` renders `button`.
`Popover.Content` is wrapped `Overlay.Content`. `Popover.Arrow` is wrapped
`Overlay.Arrow`. `Popover.Portal` renders nothing.

Geometry defaults, CSS variables (`--reference-overlay-*`), hide hooks, and
`autoUpdate` are Overlay's. Hover mode defaults to 700ms open, 300ms close, a
300ms impatient-click threshold, and 5px safe-area padding.

`closeOnScroll` defaults to `false`: ordinary interactive Popovers remain open
and reposition as their anchor's composed overflow ancestors scroll. When it
is true, scrolling an ancestor that moves the anchor requests one controlled
dismissal; unrelated regions and self-scroll inside an input or textarea do
not. Combobox enables this policy for `Combobox.Popover`. Tooltip uses Overlay
geometry but owns an always-on scroll-close policy.

---

## Problems we own

Popover is non-modal anchored policy on Overlay. Overlay owns the Floating UI
port. Do not take `@floating-ui/react` as a second overlay runtime
(`useDismiss`, `FloatingTree`, `FloatingFocusManager`).

### Flip / shift / offset / arrow / size / hide / autoUpdate / virtual anchors

**Owned by Overlay.** Popover.Content and Popover.Arrow are wrapped Overlay
parts. See Overlay.md.

### Safe polygon / grace travel (`openOnHover`)

The hard part of hover-opened interactive content is not the open delay. It is pointer travel from trigger into content without dismissing.

**Vendor.** Floating UI `packages/react/src/safePolygon.ts` — cursor triangle + trough, speed intent, opposite-side leave. Aria `useSafeArea.ts` — convex hull of both padded rects (placement-agnostic). Radix HoverCard is **delay-only** (no polygon) — weaker diagonal travel. Zag `rect/src/polygon.ts` is submenu intent (reusable math). Radix Tooltip hoverable uses a hull with padding 5.

**Lift** a first-class placement-aware safe polygon into Popover
`openOnHover`: pad Trigger and Content by 5px, protect direct diagonal travel
through their gap, and abandon grace when movement is slow, reversed, or
crosses the side opposite Content. **Leave** FloatingTree `parentId` coupling
and Base UI’s vendored `floating-ui-react` as runtime.

`closeOnScroll` is Popover policy on Overlay's autoUpdate: when true, a
composed overflow ancestor that moves the anchor requests one close instead
of living reposition. Combobox and Tooltip must not add independent document
listeners.

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

**Positioning engine:** Overlay's Floating UI port.

**Behaviour:** Radix popover e2e and dismissable-layer (not Radix popper).

**HoverCard:** Popover + `openOnHover` + grace polygon. Not a primitive.

**Leave:** `@floating-ui/react` overlay runtime, a second geometry engine on
Popover, Spectrum positioner, Radix popper, a separate HoverCard.
