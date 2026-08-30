# Overlay

Proof: [TESTS.md](./TESTS.md).

One React primitive for content that sits above the application.

Dialog, drawer, sheet, lightbox, popover, tooltip, and combobox popup are
not separate overlay runtimes. They are different answers to three
independent questions on this component:

1. **Where is it bound?** Geometry — nothing, a trigger/anchor, or a
   viewport edge.
2. **How isolated is the rest of the page?** Isolation — focus lock,
   inert, scroll lock: all on, all off, or patched.
3. **How does it open and close?** Interaction — controlled `open`,
   optional `Overlay.Trigger`, dismiss handlers, optional edge drag.

Semantic role, copy, and appearance stay in application markup. Overlay
does not infer `role="dialog"` from isolation, and it does not become a
Dialog, Drawer, or Popover component.

`vendor/floating-ui` core + DOM (`computePosition`, middleware,
`autoUpdate`) is source to lift — not a runtime import, and not
`@floating-ui/react`. That React tree (`useDismiss`, `FloatingTree`,
`FloatingFocusManager`) is a second overlay runtime and stays leave.

`vendor/vaul` is the viewport-edge kernel: bind Content to an edge, drag
from `Overlay.Handle` to dismiss, nested-layer displacement, iOS
`position: fixed`. Snap points and iOS scale-behind stay leave.

`vendor/sonner` is not a toast Overlay. Toast still owns the queue. What
Overlay lifts from Sonner is viewport-attached stacking language: swipe
progress, `--reference-overlay-index` / `--reference-overlay-count` for
nested layers, and the fact that an isolating top layer pauses toast
timers (Toast already reacts; Overlay publishes that it is the top
isolating layer).

Popover and Tooltip remain named **policy** on this kernel. They do not
run a second `computePosition`. Popover is Overlay with isolation off,
plus hover grace, impatient click, and delay defaults. Tooltip is
non-interactive description policy (slot trigger, skip-delay group,
`aria-describedby`, no Presence exit). Combobox.Popover and Menu.Content
are wrapped `Overlay.Content`.

---

## Anatomy

`Overlay` itself renders no node. Authored parts stay where they belong:
Trigger and Handle live in the React source tree; Backdrop, Content, and
Arrow portal.

### Dialog — isolating, unbound, optional Trigger

```tsx
<Overlay open={open} onOpen={() => setOpen(true)} onDismiss={close}>
  <Overlay.Trigger>Delete project</Overlay.Trigger>
  <Overlay.Backdrop />
  <Overlay.Content
    role="dialog"
    aria-modal="true"
    aria-labelledby="overlay-title"
  >
    <h2 id="overlay-title">Delete project?</h2>
    {children}
    <button type="button" onClick={close}>
      Cancel
    </button>
  </Overlay.Content>
</Overlay>
```

Omitted Trigger is valid. The application opens from any other control
or from state. Isolation defaults on.

### Drawer / sheet — isolating, viewport edge

```tsx
<Overlay
  open={open}
  onOpen={() => setOpen(true)}
  onDismiss={close}
  edge="bottom"
>
  <Overlay.Trigger>Filters</Overlay.Trigger>
  <Overlay.Backdrop />
  <Overlay.Content role="dialog" aria-modal="true">
    <Overlay.Handle />
    {children}
  </Overlay.Content>
</Overlay>
```

`edge` is Overlay geometry, not CSS fighting `computePosition`. Presence
`data-state` still drives enter/exit transforms. Handle is the drag
affordance; the rest of Content may scroll.

### Anchored — Floating UI port, still this component

```tsx
<Overlay
  open={open}
  onOpen={() => setOpen(true)}
  onDismiss={close}
  isolation={false}
>
  <Overlay.Trigger>Open filters</Overlay.Trigger>
  <Overlay.Content placement="bottom-start" offset={8}>
    <Overlay.Arrow />
    {children}
  </Overlay.Content>
</Overlay>
```

That shape is a popover. Popover is the named policy that also owns
hover. Overlay already has the Trigger, the living position, the layer
stack, and the Tab-order bridge (because isolation is off).

Virtual anchor when the application owns the hit target:

```tsx
<Overlay
  open={open}
  onDismiss={close}
  isolation={false}
  anchor={{ x: pointerX, y: pointerY }}
>
  <Overlay.Content placement="bottom-start">
    {children}
  </Overlay.Content>
</Overlay>
```

When both Trigger and `anchor` are present, Trigger stays the
interaction and accessibility source; `anchor` wins for geometry.

### Portal

Overlay portals Backdrop, Content, and Arrow internally by default.
`Overlay.Portal` is an optional configuration part; it does not wrap or
own the overlay content. Trigger never portals.

```tsx
<Overlay open={open} onDismiss={close}>
  <Overlay.Portal container={portalContainer} />
  <Overlay.Backdrop />
  <Overlay.Content>{children}</Overlay.Content>
</Overlay>
```

---

## Geometry

Three mutually exclusive bindings. Mixing `edge` with `anchor`, or `edge`
with a Trigger used as a floating reference, is a diagnostic. Trigger
may still open an edge overlay; it is not the floating reference then.

**Unbound.** No `anchor`, no `edge`, and Trigger is not used as a
reference. Overlay writes no `position` / `top` / `left`. Placement,
offset, collision, strategy, flip, shift, and Arrow are inert. A
centered dialog is application CSS against Presence `data-state`.

**Anchored.** `anchor` is set, or Trigger is present without `edge`.
Content is the floating element. Overlay runs the ported engine.
Defaults are `placement="bottom-start"`, `offset=8`,
`collisionPadding=8`, absolute strategy, flip and shift enabled.
Positioning owns `position` / `top` / `left` but never consumer
`transform`. Content publishes `--reference-overlay-available-width`,
`--reference-overlay-available-height`, `--reference-overlay-anchor-width`,
`--reference-overlay-anchor-height`, and
`--reference-overlay-transform-origin`, plus `data-anchor-hidden` and
`data-escaped`. Arrow `edgePadding` defaults to 4px; ordinary `padding`
remains the visual StyleProp. While open, Overlay runs ported
`autoUpdate` against reference and floating.

**Edge.** `edge` is `top` | `right` | `bottom` | `left`. Content is
bound to that viewport edge. Overlay writes the binding so drawer CSS
does not invent coordinates. Flip, shift, Arrow, and `anchor` are inert.
Size still publishes available dimension on the orthogonal axis
(`--reference-overlay-available-height` for left/right,
`--reference-overlay-available-width` for top/bottom). `offset` is gap
from the edge. Nested edge layers publish `--reference-overlay-index`
(0 = topmost) and `--reference-overlay-count` so CSS can displace
without a second primitive.

`closeOnScroll` is Overlay policy on autoUpdate. Default `false`:
anchored Content lives and repositions. `true` requests one controlled
dismissal when a composed overflow ancestor moves the reference.
Unrelated regions and self-scroll inside an input or textarea do not.
Tooltip and Combobox.Popover turn this on; ordinary dialogs do not.

---

## Isolation

Isolation is three systems, not a `modal` boolean hiding them:

- **focus** — FocusLock on Content, restore after Presence exit
- **inert** — background not reachable to pointer or AT; live regions
  and the toast host stay reachable
- **scroll** — document scroll lock, including iOS `position: fixed`

```ts
isolation?: boolean | {
  focus?: boolean
  inert?: boolean
  scroll?: boolean
}
```

Omitted `isolation` is `true`: all three on. That is the dialog/drawer
default. `isolation={false}` turns all three off: popover, tooltip,
menu, combobox popup. An object **patches** the `true` bundle:
`isolation={{ scroll: false }}` keeps focus and inert, drops scroll
lock.

Do not infer isolation from Trigger, `anchor`, or `edge`. A
trigger-opened dialog stays isolated. An edge drawer stays isolated
unless the application patches it. A programmatically opened panel can
be non-isolating.

Outside-press follows isolation, not a second flag:

- Isolating (`inert` on): Backdrop is the dismiss surface. Geometric
  outside press uses the deferred pointer sequence so password-manager
  overlays do not close the dialog.
- Not isolating: light dismiss on the immediate outside path, same as
  today's Popover/Menu.

Granular handlers still win. `onEscape` / `onOutsidePress` run first;
`onDismiss` fires if they do not `preventDefault()`. AlertDialog is
composition: prevent `onEscape`. Overlay does not read `role`.

---

## Trigger, focus, and keyboard order

`Overlay.Trigger` renders `button[type=button]`. Unprevented click,
Enter, or Space requests `onOpen` while closed and `onDismiss` while
open. Consumer handlers run first; `preventDefault()` cancels the
built-in request. Disabled Trigger requests nothing. Overlay sets
`aria-expanded` from `open`. It does not invent `aria-haspopup` or
`aria-controls`.

`onOpen` exists so Trigger can request open. Overlay never flips `open`
itself.

When isolation `focus` is on, Tab is trapped in Content. Trigger stays
outside the lock — it is the restore target, not a tab stop inside the
dialog.

When isolation `focus` is off and Trigger exists, Overlay bridges
logical keyboard order: Tab from an open Trigger enters the first
Content control; leaving the last control advances relative to the
Trigger and requests dismissal. This is not a trap. That bridge used to
live only on Popover; it is Overlay's, because Overlay now owns Trigger.

`Overlay.Content` `initialFocus` / `restoreFocus` are unchanged. Omitted
`initialFocus` focuses the first tabbable descendant. `false` skips the
move. Omitted `restoreFocus` returns to the pre-open target after
Presence exit.

---

## Handle (edge drag)

`Overlay.Handle` is valid only with `edge`. It renders `div`. Drag is
axis-locked to that edge. Overlay publishes
`--reference-overlay-swipe-progress` from 0 to 1 and `data-dragging`
during an active gesture.

Dismiss is requested when the pointer travels at least 25% of the
surface on that axis, or when release velocity crosses the ported Vaul
threshold — even if distance is short. Below both, Content returns and
no `onDismiss` fires. Consumer `onDismiss` rejection leaves the drawer
open.

Drag starts on Handle, not on the rest of Content. Scrollable body
stays scroll. Vaul's default “drag anywhere” fights overflow; freeze
Handle-only.

Handle without `edge` is a diagnostic. `edge` without Handle is valid:
the drawer opens and dismisses from Trigger, Backdrop, and Escape, with
no gesture.

---

## Presence and the layer stack

`open={false}` does not unmount Backdrop and Content until Presence
completes. Both carry `data-state="open" | "closed"`. Applications style
against `data-state`; they do not wrap Overlay in Presence.

Isolating teardown (lock, inert, scroll, pointer-events stacking)
survives until Presence reports exit complete. A rapid reopen cancels
teardown.

Non-isolating closed Content is inert and leaves the active dismissal
stack immediately. Anchored geometry and a parent FocusLock shard stay
alive until exit and restore complete.

Overlay, Popover, Menu, and wrapped Overlay.Content (Combobox.Popover,
Menu.Content) share one document-scoped Zustand stack. Escape dismisses
only the topmost layer. An outside press whose target is inside a nested
popup does not dismiss the parent. If a press is outside both parent and
child, that physical event is consumed by the topmost child only;
parent closure is a separate controlled action, never a replay of the
same event. Closing a parent cascades to nested layers.

---

## Proposed API

```ts
type OverlayPlacement =
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

type OverlayEdge = "top" | "right" | "bottom" | "left"

type VirtualAnchor =
  | Element
  | DOMRect
  | { getBoundingClientRect(): DOMRect }
  | { x: number; y: number; width?: number; height?: number }

type OverlayIsolation =
  | boolean
  | {
      focus?: boolean
      inert?: boolean
      scroll?: boolean
    }

interface OverlayDismissHandlers {
  onDismiss?: () => void
  onEscape?: (event: KeyboardEvent) => void
  onOutsidePress?: (event: PointerEvent) => void
}

interface OverlayProps extends OverlayDismissHandlers {
  children?: React.ReactNode
  open: boolean
  onOpen?: () => void
  anchor?: VirtualAnchor
  edge?: OverlayEdge
  isolation?: OverlayIsolation
  closeOnScroll?: boolean
}

interface OverlayTriggerProps
  extends ReferencePartProps<"button"> {}

interface OverlayPortalProps {
  container?: PortalProps["container"]
}

interface OverlayBackdropProps
  extends ReferencePartProps<"div"> {}

interface OverlayContentProps
  extends ReferencePartProps<"div"> {
  initialFocus?: FocusTarget | false
  restoreFocus?: boolean | FocusTarget
  placement?: OverlayPlacement
  offset?: number
  collisionPadding?: number
  strategy?: "absolute" | "fixed"
  flip?: boolean
  shift?: boolean
}

interface OverlayArrowProps
  extends ReferencePartProps<"div"> {
  edgePadding?: number
}

interface OverlayHandleProps
  extends ReferencePartProps<"div"> {}
```

`Overlay` renders no node. `Overlay.Trigger` renders `button`.
`Overlay.Backdrop`, `Overlay.Content`, `Overlay.Arrow`, and
`Overlay.Handle` render `div`. `Overlay.Portal` renders nothing.

Omitted `isolation` is `true`. Omitted `closeOnScroll` is `false`.
Omitted nested object keys leave that system on.

Popover, Tooltip, Combobox.Popover, and Menu.Content consume this API.
They do not own a second `computePosition` runtime.

---

## Problems we own

This is the overlay kernel: layer, isolation, anchored geometry, and
viewport-edge gesture. The ecosystem split those across Floating UI,
Radix dialog/popover, Vaul, and Sonner. We resynthesize them. We do not
invent a second runtime, hide positioning on Popover, or ship a Dialog
component.

### Nested layer stack

Escape must close a Menu or Popover inside a Dialog without closing the Dialog. A global Escape listener that does not know about nesting closes everything.

**Vendor.** Radix `DismissableLayer` (`isHighestLayer`, capture `keydown`) in `vendor/radix-primitives/packages/react/dismissable-layer`. Zag `layerStack.isTopMost` in `vendor/zag/packages/utilities/dismissable`. Base UI `useDismiss({ escapeKey: isTopmost })`. a11y-dialog uses a DOM `aria-modal` heuristic — weaker than an explicit stack. Radix e2e: `e2e/dialog.spec.ts` (“Escape closes only the dropdown”).

**Lift** the Radix/Zag stack model. Overlay, Popover, and Menu register on the same stack. Do not keep private dismissal worlds.

### Outside-press that hits a nested popup

Clicking a portalled Menu looks “outside” the Dialog’s DOM. Naive `contains` dismisses the parent (or both).

**Vendor.** Radix `DismissableLayerBranch` / FocusScope `branches` (issue #3423). Zag `isInBranch` / `trackDismissableBranch`. React Aria `useInteractOutside` + `shouldCloseOnInteractOutside`. Radix e2e: `e2e/popover.spec.ts`, `e2e/dialog.spec.ts`.

**Lift** branch/shard registration. The same nodes are FocusLock `shards` and scroll-lock exceptions. Portalled nested content is inside the parent for dismiss, focus, and scroll.

When an event is outside both an isolating parent and a non-isolating child, Reference
UI freezes child-only handling. Radix currently closes both in one Popover e2e
path, but replaying an already consumed physical event after a controlled child
unmount makes parent behavior timing-dependent.

### Deferred outside-press (pointerdown → click)

Dismissing on `pointerdown` races password-manager overlays and other extensions that `stopPropagation` on later mouse events. Touch also has a delayed click that can fire after pointer-events are restored.

**Vendor.** Radix `deferPointerDownOutside` + intercept of pointerup/mousedown/click (`dismissable-layer.tsx`, issues #2055, #2171, #3346). React Aria pairs pointerdown with **click** (Android Chrome pointerup bug). e2e: `dialog--with-extension-overlay`.

**Lift** Radix defer for isolating Overlay. Backdrop is a dedicated dismiss surface that may still dismiss even when later events are intercepted.

An unregistered extension overlay therefore keeps an isolating Overlay open when it
intercepts the deferred sequence. `isolation={false}` and Menu intentionally
close from their initial outside path; their contracts test that inverse
explicitly.

### Same-tick open race

Opening on pointerdown registers a document listener that sees the same event and immediately dismisses.

**Vendor.** Radix `setTimeout(0)` before attaching `pointerdown`. Zag `defer: true`.

**Lift.**

### React-tree vs DOM-tree “inside”

Portalled content is outside the layer’s DOM ancestor but inside the React subtree. `node.contains(event.target)` lies.

**Vendor.** Radix capture flags (`isPointerInsideReactTreeRef`). Aria `event.composedPath()`. Ariakit composed path + mark-tree.

**Lift** capture-flag or `composedPath`. Required because Overlay portals by default.

### Body pointer-events while isolating, teardown during Presence

Isolating overlays often set `body { pointer-events: none }` and re-enable the top layer. Leaving that on after `open={false}` while Presence still has the node mounted bricks the page. Nested isolating layers need a refcount of which layer is interactive.

**Vendor.** Radix `layersWithOutsidePointerEventsDisabled` (issue #3645). Zag `disablePointerEventsOutside` + MutationObserver. react-remove-scroll’s `inert` PE mode is documented as dangerous with portals — do not default it (`VENDOR.md`).

**Lift** Radix/Zag PE stacking. Keep isolation through the owned Presence
exit and tear it down once that exit completes; a rapid reopen cancels teardown.
Prefer native `inert` for AT; PE stacking is pointer UX.

### Cascade when a parent closes

Closing a Dialog must close the nested Menu. Focus moving during nested teardown can falsely dismiss parents.

**Vendor.** Zag `layerStack.remove` → `requestDismiss` on nested layers, plus `recentlyRemoved` suppressing focus-outside for ~2 frames. Radix is unmount-driven (children go with the parent, no preventable cascade event).

**Lift** Zag cascade semantics + focus-race guard. Public API stays controlled props, not Zag’s machine.

### Isolating outside: any outside vs own backdrop

Radix dismisses on any outside press (with body PE none). Base UI only dismisses if the target is **this** dialog’s backdrop (issue #1320). Wrong rule closes the wrong sibling modal.

**Freeze.** Backdrop is the explicit dismiss affordance for isolating Overlay.
Without a Backdrop, geometric outside press follows the same cancelable
policy. Nested popups use registered branch rules, not “click anywhere,” and
all React roots in one `Document` share one top-layer order; only the current
eligible layer handles a physical event.

### Scroll lock: gap, nested scrollables, overscroll

Hiding the scrollbar shifts layout. Wheel/touch on the locked page still scrolls the body. Nested scrollables that hit their edge chain to the document.

**Vendor.** `vendor/react-remove-scroll` (`handleScroll.ts`, `SideEffect.tsx`) — non-passive wheel/touch, shards, RTL, shadow DOM, pinch zoom. React Aria `usePreventScroll` — overflow hidden + scrollbar-gutter or padding. Zag scroller html vs body. Base UI gutter probe.

**Lift** Kashey remove-scroll + Aria/Zag gap compensation. Allow scroll inside Overlay content and shards until the edge. Runs only when isolation `scroll` is on.

### iOS / Mobile Safari

`overflow: hidden` does not stop Safari. Focusing an input scrolls the window and jumps `position: fixed` UI. `visualViewport` ≠ layout viewport.

**Vendor.** React Aria `preventScrollMobileWebKit` in `vendor/react-spectrum/packages/react-aria/src/overlays` — overscroll-behavior, touchmove prevent, `HTMLElement.prototype.focus` patch, visualViewport `scrollIntoView`. That path has evolved past Vaul’s copy in `vendor/vaul/src/use-prevent-scroll.ts`. Vaul `use-position-fixed.ts` — Safari `body { position: fixed }` with scroll restore; skip nested/PWA.

**Lift** Aria iOS prevent-scroll as canonical. Lift Vaul `use-position-fixed` for isolating edge Overlay (drawer/sheet). **Leave** `use-scale-background.ts` and `use-snap-points.ts`.

### Inert / hide the rest of the page

AT must not reach background content. Double-hide breaks restore. Live regions and toasts must stay reachable. Dynamic DOM needs a MutationObserver. Shadow roots need a TreeWalker.

**Vendor.** `vendor/aria-hidden` — `hideOthers` / `inertOthers`, refcount, preserve pre-hidden, keep `[aria-live]`. Aria `ariaHideOutside.ts` — TreeWalker + MutationObserver, keep `[data-live-announcer]`, `role=row` VoiceOver special case. `vendor/inert` — polyfill edge cases; prefer native `inert` in Overlay, steal tests not the polyfill (`VENDOR.md`).

**Lift** sibling-walk + refcount + live-region exceptions. Prefer native `inert` on Overlay. Do not require an OverlayProvider as a public app wrapper. The shared layer stack is a document-scoped Zustand store ([hooks.md](../../core/hooks/hooks.md)).

An already `aria-hidden` subtree is an opaque traversal boundary. Dynamic nodes
reparented into a pre-hidden or Overlay-managed subtree stay isolated without
duplicating ownership on every descendant.

### Focus restore after Presence

Restoring focus while the exit animation still has focus inside feels wrong. Restoring into an unmounted trigger fails. Overlay restores **after Presence reports exit complete** — stricter than Radix FocusScope’s `setTimeout(0)` on unmount.

**Vendor.** Radix restore on FocusScope cleanup. Base UI `onOpenChangeComplete`. a11y-dialog restores immediately. None of them know Presence.

**Lift** our documented order. FocusLock stays enabled while closed-state
Content is still mounted for exit, then deactivates/restores after Presence
completes. See `FocusLock.md`.

### AlertDialog Escape policy

Escape must not close `role="alertdialog"`. An open native `:popover-open` should steal Escape first.

**Vendor.** a11y-dialog skips Escape for alertdialog. Zag `closeOnInteractOutside: modal && !alertDialog`. Aria `isKeyboardDismissDisabled`.

**Lift** as composition policy on Overlay handlers, not a second primitive.

### Shadow DOM / composedPath

`event.target` is the shadow host. False outside-dismiss and missed focusables follow.

**Vendor.** a11y-dialog `composedPath` + custom `closest`. Aria interact-outside and ariaHideOutside. remove-scroll shadow parent bubbling.

**Lift.**

### Flip / shift / offset

Preferred placement overflows. Middleware must try opposite / expanded /
opposite-axis, then `bestFit`. Shift clamps into view without detaching from
the reference (`limitShift`). Flip's `reset` restarts the middleware chain
(max 50) — arrow `alignmentOffset` must short-circuit or you thrash.

**Vendor.** `vendor/floating-ui/packages/core/src/computePosition.ts` plus
`middleware/{flip,shift,offset}.ts`, `detectOverflow.ts`. Functional tests
in `packages/dom/test/functional/`. Spectrum `calculatePosition.ts` —
**leave**. Radix `popper` — **leave**.

**Lift** core middleware + Playwright cases (not PNG snapshots) onto
anchored Overlay.Content. This is Overlay's engine, not Popover's.

### Arrow

Arrow `edgePadding` can nudge the floating element. That reset must not
re-trigger flip (`middlewareData.arrow?.alignmentOffset`).

**Vendor.** `middleware/arrow.ts` + `dom/test/functional/arrow.test.ts`.

**Lift** the math onto `Overlay.Arrow`. **Leave** `FloatingArrow` chrome.

### Available height for list popups

Select, Combobox, and Menu need available height so the popup scrolls
instead of overflowing. Size middleware depends on whether shift already
ran. ResizeObserver + size can loop (`autoUpdate` unobserves floating for a
frame — Floating UI #1740).

**Vendor.** `middleware/size.ts`, `dom/src/autoUpdate.ts`.

**Lift** size middleware onto Overlay.Content. CSS custom properties are
`--reference-overlay-*`.

### Virtual anchors

Context menus are a point. Selection menus are a rect. Canvas/table cells
are a `getBoundingClientRect`. autoUpdate must follow `contextElement`
scroll/resize even when the reference is virtual.

**Vendor.** Floating UI `VirtualElement` (`packages/dom/src/types.ts`),
`virtual-element.test.ts`. Base UI `PopoverPositioner` `anchor`. Aria
`targetRect`. `useClientPoint.ts` is the cursor-follow factory — steal the
virtual-element idea, not the React hook package.

**Lift** into Overlay `anchor`. Virtual anchors stay positioning math.
Trigger, if present, remains the interaction source.

### Living position while open

Scroll ancestors of **both** reference and floating, resize, layout shift,
visualViewport, iframe, shadow, zoom.

**Vendor.** `vendor/floating-ui/packages/dom/src/autoUpdate.ts` and its
functional tests (`scroll`, `iframe`, `shadow-dom`, `top-layer`, `zoom`).

**Lift** the whole `autoUpdate` + tests onto anchored Overlay.
`closeOnScroll` is Overlay policy on this engine, not a second document
listener. Popover/Tooltip/Combobox choose the boolean; they do not
reimplement the listener.

### Hide when clipped

A floating layer can stay logically open while visually orphaned.

**Vendor.** `middleware/hide.ts` (`referenceHidden` / `escaped`).

**Lift** `data-anchor-hidden` / `data-escaped`. Policy (close vs hide
visually) is product. Tooltip usually **closes** on scroll.

### Unbound vs anchored vs edge

A dialog does not need `computePosition`. Running the engine without a
reference invents coordinates and fights drawer CSS. Running flip on an
edge drawer is the same class of bug.

**Freeze.** Unbound writes no `position`/`top`/`left` and no geometry
custom properties. Edge writes a viewport binding and available-size
vars, not flip/arrow. Anchored runs the Floating UI port. Presence,
the layer stack, and isolation still run in every binding.

### Trigger vs portalled Content

Trigger must remain in source DOM as the restore target and expanded
control. Portalling it with Content loses the page location and breaks
the Tab bridge.

**Vendor.** Radix Dialog/Popover `Trigger` stays in place; Content
portals. Vaul uses Radix Dialog.Trigger the same way.

**Lift** that split. Overlay.Trigger never portals. Overlay.Portal
configures Backdrop/Content/Arrow only.

### Isolation as three systems

`modal={false}` in Radix/Vaul/FloatingFocusManager turns off trap,
inert, and scroll together, then smuggles light-dismiss in the same
flag. Applications that need an isolating drawer without scroll lock,
or a focus-trapped panel that does not inert the page, cannot say so.

**Freeze.** `isolation` is `true` | `false` | a patch object. Outside-
press deferral follows `inert`. FocusLock follows `focus`. iOS
position-fixed follows `scroll` on edge overlays. No `modal` prop.

### Edge drag vs overflowing Content

Vaul defaults to dragging the whole surface, then uses `scrollLockTimeout`
to recover from inner scroll. That races every drawer with a list.

**Vendor.** Vaul `handleOnly`, `onDrag` / `onRelease`,
`CLOSE_THRESHOLD` 0.25, `VELOCITY_THRESHOLD`. Sonner swipe directions
and `--index` while dragging.

**Lift** Handle-only drag, 25% distance, velocity flick, swipe-progress
CSS, nested `--reference-overlay-index` / `-count`. **Leave** snap
points, fade-from-index, scale-behind, and drag-anywhere.

---

## Convergence

| Kernel | Primary | Contrast |
| --- | --- | --- |
| Layer stack, outside-press, Escape | Radix dismissable-layer + Zag cascade/race | a11y-dialog DOM heuristic |
| Focus | FocusLock (see that doc) | Floating UI `FloatingFocusManager` — leave |
| Scroll lock | react-remove-scroll + Aria iOS | Vaul’s stale Aria copy |
| Inert | native `inert` + aria-hidden tests | RemoveScroll inert PE mode |
| Presence / portal | our Presence + Portal | Radix Portal wrapper node |
| Anchored geometry | Floating UI core + DOM `autoUpdate` | `@floating-ui/react`, Spectrum positioner, Radix popper |
| Viewport edge + Handle | Vaul direction, Handle, velocity/distance | Vaul snap points, scale-behind |
| Nested stack CSS | Sonner `--index` / `--count` as Overlay vars | Sonner toast queue |
| Vanilla smoke | a11y-dialog `src/a11y-dialog.ts` | their markup conventions |

**Leave.** Styles, public `<Provider>`, `as`, native `<dialog>` as a second
modal runtime, Vaul scale-behind, snap points, `@floating-ui/react`
(`useDismiss`, `FloatingTree`, `FloatingFocusManager`, `FloatingPortal`).
Hover grace, impatient click, and tooltip skip-delay stay Popover/Tooltip.
Toast queue stays Toast. Overlay is the port frontend; it is not a nested
consumer of Popover positioning.

When vendors disagree, write the freeze-gate test first, then pick the behaviour that matches `components.md`.
