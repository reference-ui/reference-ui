# Overlay

Proof: [TESTS.md](./TESTS.md).

A controlled foundation for temporary content displayed above and isolated from the application.

Overlay handles portal rendering, layer-stack registration, nesting, dismissal ordering, focus containment (`FocusLock`), background inerting, scroll locking, and focus restoration.

It does not provide a trigger or prescribe the content's semantic role, structure, placement, dimensions, animation, or appearance. Dialog, Modal, AlertDialog, Drawer, Sheet, and Lightbox are compositions of Overlay, not separate primitives.

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
interface OverlayDismissHandlers {
  onDismiss?: () => void
  onEscape?: (event: KeyboardEvent) => void
  onOutsidePress?: (event: PointerEvent) => void
}

interface OverlayProps extends OverlayDismissHandlers {
  children?: React.ReactNode
  open: boolean
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
}
```

`Overlay` renders no node. `Overlay.Backdrop` and `Overlay.Content` render `div`. `Overlay.Portal` renders nothing.

---

## Problems we own

This is the overlay kernel. The ecosystem has already solved these problems in several places. We resynthesize that work; we do not invent a second runtime.

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

---

## Convergence

| Kernel | Primary | Contrast |
| --- | --- | --- |
| Layer stack, outside-press, Escape | Radix dismissable-layer + Zag cascade/race | a11y-dialog DOM heuristic |
| Focus | FocusLock (see that doc) | Floating UI `FloatingFocusManager` — leave |
| Scroll lock | react-remove-scroll + Aria iOS | Vaul’s stale Aria copy |
| Inert | native `inert` + aria-hidden tests | RemoveScroll inert PE mode |
| Presence / portal | our Presence + Portal | Radix Portal wrapper node |
| Vanilla smoke | a11y-dialog `src/a11y-dialog.ts` | their markup conventions |

**Leave.** Styles, public `<Provider>`, `as`, native `<dialog>` as a second modal runtime, Vaul scale-behind, snap points, Base UI’s vendored `floating-ui-react` tree.

When vendors disagree, write the freeze-gate test first, then pick the behaviour that matches `components.md`.
