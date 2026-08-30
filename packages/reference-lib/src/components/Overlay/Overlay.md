# Overlay

Proof: [TESTS.md](./TESTS.md).

A controlled foundation for temporary content displayed above the application.

Overlay is the public frontend of the Floating UI port. `vendor/floating-ui`
core + DOM (`computePosition`, middleware, `autoUpdate`) is source material
to lift into this component — not a runtime dependency, and not
`@floating-ui/react`. That React tree is a second overlay runtime
(`useDismiss`, `FloatingTree`, `FloatingFocusManager`) and stays leave.

Floating and overlay are the same job: a layer, optional isolation, and
optional anchored geometry. Overlay owns all three.

- **Layer:** portal, stack, nesting, Escape/outside-press, Presence exit.
- **Isolation:** FocusLock, background inerting, scroll lock, restore.
- **Geometry:** when `anchor` is set, Content is the floating element and
  Overlay runs the ported positioning engine. When `anchor` is omitted,
  Content is an unanchored layer and application CSS places it (centered
  dialog, edge drawer). Placement props are then no-ops.

Overlay does not provide a trigger. Dialog, Drawer, Sheet, and Lightbox
decide “who opened this” in application code. Popover is the anchored
non-modal policy on top of this same engine: it supplies `Popover.Trigger`
as the default reference and turns isolation off.

```tsx
<Overlay open={open} onDismiss={close}>
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

Anchored — Floating UI port, still this component:

```tsx
<Overlay
  open={open}
  onDismiss={close}
  anchor={buttonRef}
>
  <Overlay.Content placement="bottom-start" offset={8}>
    {children}
  </Overlay.Content>
</Overlay>
```

```tsx
<Overlay
  open={open}
  onDismiss={close}
  anchor={{ x: pointerX, y: pointerY }}
>
  <Overlay.Content placement="bottom-start">
    <Overlay.Arrow />
    {children}
  </Overlay.Content>
</Overlay>
```

Overlay portals internally by default. `Overlay.Portal` is an optional configuration part; it does not wrap or own the overlay content.

```tsx
<Overlay open={open} onDismiss={close}>
  <Overlay.Portal container={portalContainer} />
  <Overlay.Backdrop />
  <Overlay.Content>{children}</Overlay.Content>
</Overlay>
```

Dismissal requests do not change application state. Granular handlers run first; `onDismiss` fires if they do not `preventDefault()`:

```text
onEscape(event)       → if (!event.defaultPrevented) → onDismiss()
onOutsidePress(event) → if (!event.defaultPrevented) → onDismiss()
```

`Overlay.Content` accepts `initialFocus`. When omitted, Overlay focuses the
first tabbable descendant. A target ref/resolver focuses that element; `false`
skips the move. Omitted `restoreFocus` returns to the pre-open target after
exit. An explicit target redirects that completed return, and `false` leaves
focus where the application put it.

`open={false}` does not unmount immediately. Overlay keeps Backdrop and Content mounted through the exit cycle via Presence, and sets `data-state="open" | "closed"` on both.

Overlay, Popover, and Menu share one layer stack. Escape dismisses only the
topmost layer. An outside press whose target is inside a nested popup does not
dismiss the parent. If a press is outside both parent and child, that physical
event is consumed by the topmost child only; parent closure is a separate
controlled action or an explicit parent cascade, never a replay of the same
event.

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

type VirtualAnchor =
  | Element
  | DOMRect
  | { getBoundingClientRect(): DOMRect }
  | { x: number; y: number; width?: number; height?: number }

interface OverlayDismissHandlers {
  onDismiss?: () => void
  onEscape?: (event: KeyboardEvent) => void
  onOutsidePress?: (event: PointerEvent) => void
}

interface OverlayProps extends OverlayDismissHandlers {
  children?: React.ReactNode
  open: boolean
  anchor?: VirtualAnchor
}

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
```

`Overlay` renders no node. `Overlay.Backdrop`, `Overlay.Content`, and
`Overlay.Arrow` render `div`. `Overlay.Portal` renders nothing.

Without `anchor`, Overlay does not write `position` / `top` / `left`.
Content and Backdrop remain application-laid-out. Placement, offset,
collision, strategy, flip, shift, and Arrow are inert.

With `anchor`, Content is the floating element. Defaults are
`placement="bottom-start"`, `offset=8`, `collisionPadding=8`, absolute
strategy, and flip/shift enabled. Positioning owns `position` / `top` /
`left` but never consumer `transform`. Content publishes
`--reference-overlay-available-width`,
`--reference-overlay-available-height`,
`--reference-overlay-anchor-width`,
`--reference-overlay-anchor-height`, and
`--reference-overlay-transform-origin`, plus `data-anchor-hidden` and
`data-escaped`. Arrow `edgePadding` defaults to 4px; ordinary `padding`
remains the token-aware visual StyleProp. While open, Overlay runs the
ported `autoUpdate` against both reference and floating.

Popover, Tooltip, Combobox.Popover, and Menu.Content consume this geometry
API. They do not own a second `computePosition` runtime.

---

## Problems we own

This is the overlay kernel: isolation **and** the Floating UI port. The
ecosystem has already solved both. We resynthesize that work; we do not
invent a second runtime and we do not hide positioning on Popover.

### Nested layer stack

Escape must close a Menu or Popover inside a Dialog without closing the Dialog. A global Escape listener that does not know about nesting closes everything.

**Vendor.** Radix `DismissableLayer` (`isHighestLayer`, capture `keydown`) in `vendor/radix-primitives/packages/react/dismissable-layer`. Zag `layerStack.isTopMost` in `vendor/zag/packages/utilities/dismissable`. Base UI `useDismiss({ escapeKey: isTopmost })`. a11y-dialog uses a DOM `aria-modal` heuristic — weaker than an explicit stack. Radix e2e: `e2e/dialog.spec.ts` (“Escape closes only the dropdown”).

**Lift** the Radix/Zag stack model. Overlay, Popover, and Menu register on the same stack. Do not keep private dismissal worlds.

### Outside-press that hits a nested popup

Clicking a portalled Menu looks “outside” the Dialog’s DOM. Naive `contains` dismisses the parent (or both).

**Vendor.** Radix `DismissableLayerBranch` / FocusScope `branches` (issue #3423). Zag `isInBranch` / `trackDismissableBranch`. React Aria `useInteractOutside` + `shouldCloseOnInteractOutside`. Radix e2e: `e2e/popover.spec.ts`, `e2e/dialog.spec.ts`.

**Lift** branch/shard registration. The same nodes are FocusLock `shards` and scroll-lock exceptions. Portalled nested content is inside the parent for dismiss, focus, and scroll.

When an event is outside both a modal parent and a non-modal child, Reference
UI freezes child-only handling. Radix currently closes both in one Popover e2e
path, but replaying an already consumed physical event after a controlled child
unmount makes parent behavior timing-dependent.

### Deferred outside-press (pointerdown → click)

Dismissing on `pointerdown` races password-manager overlays and other extensions that `stopPropagation` on later mouse events. Touch also has a delayed click that can fire after pointer-events are restored.

**Vendor.** Radix `deferPointerDownOutside` + intercept of pointerup/mousedown/click (`dismissable-layer.tsx`, issues #2055, #2171, #3346). React Aria pairs pointerdown with **click** (Android Chrome pointerup bug). e2e: `dialog--with-extension-overlay`.

**Lift** Radix defer. Backdrop is a dedicated dismiss surface that may still dismiss even when later events are intercepted.

An unregistered extension overlay therefore keeps a modal Overlay open when it
intercepts the deferred sequence. Non-modal Popover and Menu intentionally
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

### Body pointer-events while modal, teardown during Presence

Modal overlays often set `body { pointer-events: none }` and re-enable the top layer. Leaving that on after `open={false}` while Presence still has the node mounted bricks the page. Nested modals need a refcount of which layer is interactive.

**Vendor.** Radix `layersWithOutsidePointerEventsDisabled` (issue #3645). Zag `disablePointerEventsOutside` + MutationObserver. react-remove-scroll’s `inert` PE mode is documented as dangerous with portals — do not default it (`VENDOR.md`).

**Lift** Radix/Zag PE stacking. Keep modal isolation through the owned Presence
exit and tear it down once that exit completes; a rapid reopen cancels teardown.
Prefer native `inert` for AT; PE stacking is pointer UX.

### Cascade when a parent closes

Closing a Dialog must close the nested Menu. Focus moving during nested teardown can falsely dismiss parents.

**Vendor.** Zag `layerStack.remove` → `requestDismiss` on nested layers, plus `recentlyRemoved` suppressing focus-outside for ~2 frames. Radix is unmount-driven (children go with the parent, no preventable cascade event).

**Lift** Zag cascade semantics + focus-race guard. Public API stays controlled props, not Zag’s machine.

### Modal outside: any outside vs own backdrop

Radix dismisses on any outside press (with body PE none). Base UI only dismisses if the target is **this** dialog’s backdrop (issue #1320). Wrong rule closes the wrong sibling modal.

**Freeze.** Backdrop is the explicit dismiss affordance for modal Overlay.
Without a Backdrop, geometric outside press follows the same cancelable
policy. Nested popups use registered branch rules, not “click anywhere,” and
all React roots in one `Document` share one top-layer order; only the current
eligible layer handles a physical event.

### Scroll lock: gap, nested scrollables, overscroll

Hiding the scrollbar shifts layout. Wheel/touch on the locked page still scrolls the body. Nested scrollables that hit their edge chain to the document.

**Vendor.** `vendor/react-remove-scroll` (`handleScroll.ts`, `SideEffect.tsx`) — non-passive wheel/touch, shards, RTL, shadow DOM, pinch zoom. React Aria `usePreventScroll` — overflow hidden + scrollbar-gutter or padding. Zag scroller html vs body. Base UI gutter probe.

**Lift** Kashey remove-scroll + Aria/Zag gap compensation. Allow scroll inside Overlay content and shards until the edge.

### iOS / Mobile Safari

`overflow: hidden` does not stop Safari. Focusing an input scrolls the window and jumps `position: fixed` UI. `visualViewport` ≠ layout viewport.

**Vendor.** React Aria `preventScrollMobileWebKit` in `vendor/react-spectrum/packages/react-aria/src/overlays` — overscroll-behavior, touchmove prevent, `HTMLElement.prototype.focus` patch, visualViewport `scrollIntoView`. That path has evolved past Vaul’s copy in `vendor/vaul/src/use-prevent-scroll.ts`. Vaul `use-position-fixed.ts` — Safari `body { position: fixed }` with scroll restore; skip nested/PWA.

**Lift** Aria iOS prevent-scroll as canonical. Lift Vaul `use-position-fixed` only if Drawer/Sheet freeze tests need it. **Leave** `use-scale-background.ts` (iOS shrink-behind) and `use-snap-points.ts` — product chrome, not Overlay (`components.md` omissions).

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

### Living position while open

Scroll ancestors of **both** reference and floating, resize, layout shift,
visualViewport, iframe, shadow, zoom.

**Vendor.** `vendor/floating-ui/packages/dom/src/autoUpdate.ts` and its
functional tests (`scroll`, `iframe`, `shadow-dom`, `top-layer`, `zoom`).

**Lift** the whole `autoUpdate` + tests onto anchored Overlay.
`closeOnScroll` is Popover/Tooltip policy on top of this engine, not a
second document listener.

### Hide when clipped

A floating layer can stay logically open while visually orphaned.

**Vendor.** `middleware/hide.ts` (`referenceHidden` / `escaped`).

**Lift** `data-anchor-hidden` / `data-escaped`. Policy (close vs hide
visually) is product. Tooltip usually **closes** on scroll.

### Unanchored vs anchored

A dialog does not need `computePosition`. Running the engine without a
reference invents coordinates and fights drawer CSS.

**Freeze.** No `anchor` means no Overlay-written `position`/`top`/`left`
and no geometry custom properties. Presence, isolation, and the layer stack
still run.

---

## Convergence

| Kernel | Primary | Contrast |
| --- | --- | --- |
| Layer stack, outside-press, Escape | Radix dismissable-layer + Zag cascade/race | a11y-dialog DOM heuristic |
| Focus | FocusLock (see that doc) | Floating UI `FloatingFocusManager` — leave |
| Scroll lock | react-remove-scroll + Aria iOS | Vaul’s stale Aria copy |
| Inert | native `inert` + aria-hidden tests | RemoveScroll inert PE mode |
| Presence / portal | our Presence + Portal | Radix Portal wrapper node |
| Geometry | Floating UI core + DOM `autoUpdate` | `@floating-ui/react`, Spectrum positioner, Radix popper |
| Vanilla smoke | a11y-dialog `src/a11y-dialog.ts` | their markup conventions |

**Leave.** Styles, public `<Provider>`, `as`, native `<dialog>` as a second
modal runtime, Vaul scale-behind, snap points, `@floating-ui/react`
(`useDismiss`, `FloatingTree`, `FloatingFocusManager`, `FloatingPortal`).
Popover trigger, hover grace, and tab-order bridge stay Popover. Overlay is
the port frontend; it is not a nested consumer of Popover positioning.

When vendors disagree, write the freeze-gate test first, then pick the behaviour that matches `components.md`.
