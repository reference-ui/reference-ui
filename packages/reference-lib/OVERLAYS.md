# Overlay system

Overlay is the shared kernel behind Reference UI's floating surfaces. Five primitives make up the family: Overlay, Popover, Tooltip, Toast, and FocusLock. This document describes how they fit together and the contracts each one keeps.

```
┌──────────────────────────────────────────────────┐
│                   Overlay                        │
│  (kernel: layer stack, isolation, geometry)       │
│                                                  │
│  ┌──────────┐  ┌─────────┐  ┌────────────────┐  │
│  │ Popover  │  │ Tooltip │  │ Dialog/Drawer  │  │
│  │ (policy) │  │ (policy)│  │  (composition) │  │
│  └──────────┘  └─────────┘  └────────────────┘  │
├──────────────────────────────────────────────────┤
│  FocusLock        │  Toast (separate runtime)    │
│  (containment)    │  (queue + host + announce)   │
└───────────────────┴──────────────────────────────┘
```

## Principles

- **One stack, one dismiss, one isolation, one geometry engine.** Overlay is the control point. Popover, Tooltip, and Dialog/Drawer do not grow second runtimes.
- **Dialog, Drawer, Sheet, and Modal are compositions of `Overlay`.** They are not separate runtimes.
- **Popover and Tooltip are named policies** on top of `Overlay`.
- **Toast is not Overlay.** It is a separate runtime with one seam into the overlay stack: it pauses while an isolating overlay is open.

## Parts

| Primitive | Role | Isolation | Geometry |
| :--- | :--- | :---: | :---: |
| **Overlay** | Universal kernel: layer stack, dismiss, portal, presence | Configurable | Unbound, anchored, or edge |
| **Popover** | Policy wrapper: `Overlay` with `isolation={false}`, plus hover | Off | Anchored |
| **Tooltip** | Policy wrapper: non-interactive, `aria-describedby`, skip-delay | Off | Anchored |
| **Toast** | Separate runtime: queue, host, timers, announce | None (not Overlay) | Viewport-attached |
| **FocusLock** | Focus containment: Tab loop, shards, restore | N/A | N/A |

`ReferenceLibrary` is a composing shell. It elects a document host and mounts `ToastHost` and `AnnouncerHost`. The Toast store, the Tooltip group store, and the Announcer each live in their own file.

Both Overlay and Popover support uncontrolled `defaultOpen` as well as controlled `open`.

## Overlay kernel

### Layer stack and dismissal

- Layers form one stack. Escape dismisses the topmost layer only.
- Outside press is detected with `composedPath()`, so a shadow tree inside Content counts as inside.
- The backdrop dismisses only the topmost layer. A nested backdrop never closes its parent.
- A parent's close cascades to its children child-first and deterministically, with a guard against focus races.

### Isolation and scroll

- An isolating Overlay makes the rest of the page `inert`. The walk covers siblings and honors authored hidden-tree boundaries and nested shadow roots.
- Scroll lock compensates for `visualViewport` and prevents touch-move scrolling with non-passive listeners.

### Edge sheets (`Overlay.Handle`)

- `Overlay.Handle` drags on all four `edge` values. The bottom and top edges drag on Y, and the left and right edges drag on X.
- Drag is handle-only: dragging elsewhere on the sheet does not move it.
- A drag dismisses the sheet when it passes 25% of the distance or reaches the release-velocity threshold.
- In RTL, the `left` and `right` edges are physical.

### Geometry

- One `computePosition` engine places every overlay. It supports 12 placements: the four cardinal sides, each with start and end alignments.
- Offset, flip with hysteresis, shift with collision padding, and arrow tracking (`Overlay.Arrow`, with `edgePadding`).
- The anchor can be an element, a virtual point `{ x, y }`, a `DOMRect`, or a ref.
- `strategy` is `absolute` or `fixed`.
- `autoUpdate` re-measures on resize, on scroll, and when the ResizeObserver fires.
- Size CSS variables: `--reference-overlay-available-width` and `--reference-overlay-available-height`.
- Clipped content is hidden with `data-anchor-hidden` and `data-escaped`.
- `positionTransform` is not exposed.

### Presence and portal

- Exit motion goes through Presence. Tooltip opts out.
- `Overlay.Portal` takes the `container` to portal into.
- Portaled content carries the color-mode attribute (`data-color-mode`). See [LIB_PORTAL_COLOR_MODE.md](src/components/Overlay/LIB_PORTAL_COLOR_MODE.md).

## Popover

- Controlled `open` with `onOpen`, `onDismiss`, and `onOpenChange`. `defaultOpen` gives uncontrolled behavior.
- Outside press auto-dismisses. Calling `preventDefault` on the dismiss event cancels it.
- `openOnHover` opens on pointer hover, with open and close delays.
- The hover grace is a pointer-safe polygon: a cursor triangle (Floating UI style) and the trough between trigger and content, with 5px padded rects. Slow movement, reversal, or movement toward the opposite side abandons the grace.
- Impatient click (300ms).
- Touch input does not start mouse hover timers.
- A diagonal pointer path through empty space keeps the popover open. The grace is not a fixed delay.

## Tooltip

- Non-interactive. `aria-describedby` links the trigger to the tooltip.
- Skip-delay: `tooltipGroup` is the one document store for the skip delay. The `ReferenceLibrary` `tooltip.skipDelay` setting writes it, and Tooltip reads it.
- Warm handoff: moving to another tooltip inside the skip window shows it without the open delay. After the window, the next open is cold. Only one tooltip is visible at a time.
- Escape does not dismiss the parent Overlay.
- A click suppresses hover reopen.
- Ancestor scroll closes the tooltip. Scrolling inside the tooltip's own field does not.
- There is no public Provider, and HoverCard is not provided.

## Toast

- A separate runtime: queue, host, timers, and announcements.
- API: `toast()` and `toast.show()`. `toast.define({ render })` gives a reusable, typed definition. `update`, `dismiss`, and `dismissAll` manage live toasts. `toast.success`, `toast.error`, `toast.warning`, `toast.info`, and `toast.loading` set the variant. `toast.promise()` returns the promise, and `.unwrap()` awaits the original. `toast.custom` renders custom content.
- The host is mounted once, through `<ReferenceLibrary toaster={...}>`. Six positions are available, from `top-start` to `bottom-end`. There is no `toasterId`.
- `limit` applies a FIFO queue. Toasts waiting for a slot are not mounted until they are promoted.
- Gestures: swipe to dismiss by distance or velocity, and expand on hover.
- Timers pause on hover and focus, and while the page is hidden (`visibilitychange`).
- Timers also pause while an isolating overlay is open. The pause reads the overlay stack (`isToastPausedByOverlay`), not `[aria-modal]`.
- Hotkey: a configurable shortcut (default `Alt+T`) focuses the toaster. It can be suppressed.
- `dismissible: false` blocks swipe and close. The timer may still fire.
- `onAutoClose` fires only when the timer expires.
- Rendering: default chrome, enter, stack, and exit motion, reduced motion, focus restore, theme, offset, `dir`, and drop-in `style` and `classNames`.

## FocusLock

- Containment: Tab and Shift+Tab loop inside the lock. The lock slots onto its child, with no wrapper or guard elements.
- `initialFocus` accepts a ref, a function, or `false`. `false` skips the activation move, and the lock still traps focus.
- `restoreFocus` returns focus to the trigger. If the trigger was removed, focus restores to the right sibling (a proximity walk).
- Overlay coupling: focus stays trapped through the Presence exit, and focus is restored once after Presence.
- Nested locks form a global stack (`activeLocks`). A nested isolating Overlay pauses the outer lock.
- Shards add regions that stay reachable: sibling shards, and Overlay-portalled modeless shards.
- The tabbable catalog (`catalog/`) decides which elements are tabbable, including shadow DOM, slots, `contenteditable`, and `details`.
- Not provided: `group`, `whiteList`, `FreeFocusInside`, `InFocusGuard`, cross-frame trapping, and a public `useFocusScope`.
- Known gap: the Android TalkBack virtual-modality skip is not implemented.

## Coverage

- Component CT suites prove the cases: `Overlay/__e2e__/` (`Overlay.ct.spec.ts`, `OverlayExotica.ct.spec.ts`, `OverlayFocus.ct.spec.ts`), `Popover/__e2e__/`, `Tooltip/__e2e__/`, `Toast/__e2e__/`, and `FocusLock/__e2e__/`. Run one with `pnpm agentct <Component> --e2e`.
- Test titles carry the case IDs, for example `OV-ESC-01` and `TT-GROUP-01`.
- Unit tests cover overlay geometry, the FocusLock catalog, and the Popover polygon.

Case-ID prefixes by component:

- Overlay: `OV-DOM-*`, `OV-POS-*`, `OV-TRG-*`, `OV-THEME-*`, `OV-ESC-*`, `OV-OUT-*`, `OV-LAYER-*`, `OV-INERT-*`, `OV-SCROLL-*`, `OV-EDGE-*`, `OV-HND-*`, `OV-ISO-*`
- Popover: `PO-DOM-*`, `PO-POS-*`, `PO-FLIP-*`, `PO-SHIFT-*`, `PO-ARROW-*`, `PO-HOVER-*`, `PO-LAYER-*`, `PO-ENV-*`
- Tooltip: `TT-DOM-*`, `TT-POS-*`, `TT-GROUP-*`, `TT-CLOSE-*`, `TT-SCROLL-*`
- Toast: `TO-DOM-*`, `TO-DEF-*`, `TO-STACK-*`, `TO-OV-*`, `TO-QUEUE-*`, `TO-SWIPE-*`, `TO-TIME-*`, `TO-HOTKEY-*`, `TO-DISMISSIBLE-*`, `TO-AUTOCLOSE-*`, `TO-UNWRAP-*`, `TO-RIVAL-*`
- FocusLock: `FL-INIT-*`, `FL-TAB-*`, `FL-TRAP-*`, `FL-SHARD-*`, `FL-RESTORE-*`, `FL-OV-*`, `FL-NEST-*`

See also: [Overlay](src/components/Overlay/Overlay.md) · [Popover](src/components/Popover/Popover.md) · [Tooltip](src/components/Tooltip/Tooltip.md) · [Toast](src/components/Toast/Toast.md) · [FocusLock](src/components/FocusLock/FocusLock.md).
