# Popover

Proof: [TESTS.md](./TESTS.md).

Controlled, anchored, **non-isolating** floating content with hover policy.

Overlay is the kernel: Trigger, `onOpen`, isolation (off here), geometry,
Tab-order bridge, `closeOnScroll`, dismiss stack, Presence. Popover does
not run a second `computePosition`. It adds what Overlay must not own:
hover grace (`openOnHover`), impatient click, and delay defaults.

`Popover.Trigger` is `Overlay.Trigger`. `Popover.Content` / `Arrow` wrap
Overlay parts. Isolation is frozen off; `edge` and Handle are not Popover.

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

Because Content portals, Overlay bridges logical keyboard order when
isolation focus is off: Tab from an open Trigger enters the first Content
control, and leaving the last control advances relative to the Trigger's
source position while requesting dismissal. This is not a trap; outside
programmatic focus remains outside. Popover inherits that Overlay bridge.

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

interface PopoverProps
  extends Omit<OverlayProps, "isolation" | "edge"> {
  openOnHover?: boolean
  openDelay?: number
  closeDelay?: number
}

interface PopoverTriggerProps extends OverlayTriggerProps {}

interface PopoverPortalProps {
  container?: PortalProps["container"]
}

interface PopoverContentProps extends OverlayContentProps {}

interface PopoverArrowProps extends OverlayArrowProps {}
```

`Popover` renders no node. `Popover.Trigger` is `Overlay.Trigger`.
`Popover.Content` is wrapped `Overlay.Content`. `Popover.Arrow` is wrapped
`Overlay.Arrow`. `Popover.Portal` renders nothing. Isolation is frozen
off. There is no Handle.

Geometry defaults, CSS variables (`--reference-overlay-*`), hide hooks, the
Tab bridge, Trigger activation, and `autoUpdate` are Overlay's. Hover mode
defaults to 700ms open, 300ms close, a 300ms impatient-click threshold, and
5px safe-area padding.

`closeOnScroll` is Overlay's, default `false` here: ordinary interactive
Popovers remain open and reposition. Combobox enables it for
`Combobox.Popover`. Tooltip uses Overlay geometry with always-on
scroll-close.

---

## Problems we own

Popover is Overlay with isolation frozen off, plus hover policy. Overlay owns
the Floating UI port, Trigger, Tab bridge, and `closeOnScroll`. Do not take
`@floating-ui/react` as a second overlay runtime (`useDismiss`,
`FloatingTree`, `FloatingFocusManager`).

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

`closeOnScroll` is Overlay policy on autoUpdate: when true, a composed
overflow ancestor that moves the anchor requests one close instead of living
reposition. Combobox and Tooltip must not add independent document listeners.

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
