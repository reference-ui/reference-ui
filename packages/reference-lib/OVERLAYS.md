# OVERLAYS.md — Overlay System Status

Where we are, what is actually proven, and the remaining production gates.
This document is the canonical status for the five interlocking primitives:

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

> **Verdict (2026-09-08): Overlay kernel in progress; siblings stay thin.**
>
> Overlay is the control point: one stack, one dismiss, one isolation, one
> geometry engine. Popover, Tooltip, and Dialog/Drawer must not grow second
> runtimes. Toast is not Overlay; it pauses from the overlay stack.
>
> Per-component `SPEC.md` is the freeze. Overlay SPEC **Next agent** is
> current kernel work. Gates 3–6 are FocusLock / Popover polygon / Tooltip
> store / Toast stack-pause — not more Overlay titles.
>
> Specs: [Overlay](src/components/Overlay/SPEC.md) ·
> [FocusLock](src/components/FocusLock/SPEC.md) ·
> [Popover](src/components/Popover/SPEC.md) ·
> [Tooltip](src/components/Tooltip/SPEC.md) ·
> [Toast](src/components/Toast/SPEC.md).

---

## 0. Production Verdict

**Happy-path ≠ production.** Overlay Gate 1 defects are closed in source.
Nested stack E2E lives in `@matrix/overlays`. Overlay is still not production
until its SPEC work order is done. Siblings are thinner than their case counts
look: most `PO-POS-*` / `TT-POS-*` belong to Overlay.

| Primitive | Role | Production? | Next |
| :--- | :--- | :--- | :--- |
| **Overlay** | Kernel | **No** — SPEC Must/Should open | Overlay SPEC work order, then stop |
| **FocusLock** | Containment solver | **No** | Gate 3: Presence restore, deleted trigger, nest, portalled shard |
| **Popover** | Hover policy on Overlay | **No** | Gate 4: safe polygon (`PO-HOVER-02` must be a real diagonal) |
| **Tooltip** | Description policy on Overlay | **No** | Gate 5: unify skip-delay store, Escape-vs-parent, scroll-close |
| **Toast** | Queue runtime | **No** | Gate 6: pause from overlay stack + remaining APIs |

**Architectural decision still holds:** Dialog, Drawer, Sheet, and Modal are
not separate runtimes. They are compositions of `Overlay`. Popover/Tooltip are
named policy. Toast is a separate runtime with one Overlay seam. One
`computePosition` engine, one layer stack, one dismiss system.

### Covered today (do not redo on siblings)

Desktop isolating dialog, nested Overlay stack in `@matrix/overlays`,
anchored flip/shift/arrow smokes, tooltip describedby, toast show/update,
FocusLock sibling shard. Do not copy Overlay geometry or layer matrices onto
Popover or Tooltip.

`matrix/lib` still does not mount skip-delay groups or portalled shards.
`@matrix/overlays` now mounts nested stacks and edge sheets — Overlay SPEC is
the remaining Overlay gate, not “the kernel is missing.”

### The remaining mountain

Not “check every remaining SPEC box.” Overlay SPEC parks iframe, extension
overlays, SSR, and the full Floating UI functional matrix.

1. **Overlay SPEC work order** — same-tick open, modeless outside, isolation
   patch, Trigger, Presence restore *timing*, iOS visualViewport, virtual
   anchor, `closeOnScroll`. Gate 1 source defects (Handle, composedPath,
   cascade, iOS lock) are closed.
2. **FocusLock Gate 3** — restore after Presence, deleted-trigger walk,
   nested locks, portalled shard, tabbable catalog. Overlay registers shards
   and owns dismiss; FocusLock solves containment.
3. **Popover safe-polygon** — timers are not grace. Diagonal travel still
   closes. Do not expand `PO-POS-*`.
4. **Tooltip skip-delay store split** — unify `tooltipGroup`; then
   Escape-vs-parent Overlay and scroll-close *policy*.
5. **Toast Gate 6** — pause from overlay stack (not `[aria-modal]`), swipe /
   limit E2E, hotkey, `dismissible`, `onAutoClose`, `unwrap()`.
6. **Unit tests** for overlay stack, gesture, tabbable, toast queue math.

Until that list is green, do not call this set production-grade.

---

## 1. System Architecture at a Glance

| Primitive | Role | Isolation | Geometry | Engine |
| :--- | :--- | :---: | :---: | :---: |
| **Overlay** | Universal kernel — layer stack, dismiss, portal, presence | Configurable | Unbound / Anchored / Edge | Shipped |
| **Popover** | Policy wrapper — `Overlay` with `isolation={false}`, hover | Off | Anchored | Shipped |
| **Tooltip** | Policy wrapper — non-interactive, `aria-describedby`, skip-delay | Off | Anchored | Shipped |
| **Toast** | Separate runtime — queue, host, timers, announce | None (not Overlay) | Viewport-attached | Shipped |
| **FocusLock** | Focus containment — Tab loop, shards, restore | N/A | N/A | Shipped |

`ReferenceLibrary` is now a composing shell: it elects a document host and
mounts `ToastHost` + `AnnouncerHost`. Toast store, Tooltip group store, and
Announcer live in their own files. Phase 1 of the old roadmap is **done**.

Both Overlay and Popover support **uncontrolled** `defaultOpen` as well as
controlled `open`. Older copies of this file said uncontrolled was omitted;
that is no longer true.

---

## 2. Final Gates

These are the production gates, in order. Toast polish (hotkey, `dismissible`,
`onAutoClose`, `.unwrap()`, swipe/limit/pause proof) is **Gate 6**, not a
post-ship extra. Overlay kernel still comes first because Toast pause-on-modal
depends on a correct layer stack.

### Gate 1 — Overlay kernel defects (blocks every overlay)

| Defect | Evidence | Required bar |
| :--- | :--- | :--- |
| iOS / mobile scroll lock is `overflow: hidden` only | `scroll-lock.ts` | `visualViewport` compensation + non-passive touch-move prevention (React Aria / react-remove-scroll) |
| `Overlay.Handle` only tracks `clientY` and only `deltaY > 0` | `OverlayHandle` | All four `edge` values: bottom/top Y, left/right X, 25% distance **or** velocity |
| Backdrop click does not consult the layer stack | `OverlayBackdrop` always `setIsOpen(false)` | Topmost layer only; nested backdrops must not close parents |
| Outside press uses `event.target`, not `composedPath()` | `OverlayContent` pointerdown | Shadow trees inside Content count as inside |
| Parent-close cascade is a `setTimeout` over stale `state.layers` | `stack/store.ts` `removeLayer` | Deterministic child-then-parent cascade with focus-race guard |

### Gate 2 — Overlay isolation + nested-stack E2E

Contract exists in [Overlay SPEC](src/components/Overlay/SPEC.md). None of these IDs have a Playwright test, and `matrix/lib/src/overlay.tsx` has no nested / edge / inert fixtures to run them against:

- `OV-ESC-01` / `OV-ESC-02` — Escape is topmost-only
- `OV-LAYER-01`..`OV-LAYER-05` — nested / portalled child is inside; one event, one layer
- `OV-INERT-01` — sibling `inert` + live-region / toast exceptions
- `OV-SCROLL-01` — body does not scroll under an isolating overlay
- `OV-EDGE-01`..`OV-EDGE-04` — handle drag + velocity dismiss

### Gate 3 — FocusLock restore and nesting

- Restore must wait for Presence exit (Overlay.md freeze). Current restore runs on FocusLock unmount, which is inside Presence — prove it, then prove the deleted-trigger path (`FL-RESTORE-03` / `FL-RESTORE-04`).
- Nested lock stack (`FL-NEST-01`): inner deactivation resumes outer without reclaim fight.
- `FL-SHARD-01` is already proven. Add a **portalled** shard (popover/menu inside a lock), not just a sibling node.

### Gate 4 — Popover hover grace

Hover currently uses enter/leave timers on Trigger and Content. There is **no
safe-polygon**. `PO-HOVER-01` / `PO-HOVER-02` pass because delay covers a
straight move onto Content. Diagonal travel across empty space still closes.

Ship a pointer-safe polygon (Floating UI / Base UI model) and keep
`PO-HOVER-02` as the proof.

### Gate 5 — Tooltip skip-delay is split across two stores

| Store | Who writes | Who reads |
| :--- | :--- | :--- |
| `tooltipWarmup.ts` | `ReferenceLibrary tooltip.skipDelay` | **Nobody in Tooltip** |
| `tooltipGroup.ts` | Tooltip itself | Tooltip open/close |

Unify onto `tooltipGroup` (or delete `tooltipWarmup`). Then E2E `TT-SKIP-01`,
`TT-ESC-01` (Escape does not dismiss parent overlay), `TT-SCROLL-01`.

### Gate 6 — Toast runtime + polish (required)

Swipe, expand-on-hover, and `visibilitychange` pause **are implemented**.
`toast.success` / `error` / `warning` / `info` / `loading` / `promise` shipped.
Older “Out of scope” / “deliberately omitted” notes in Toast are stale — Gate 6 is required. See [Toast SPEC](src/components/Toast/SPEC.md).

This gate is production, not polish-later. Required bar:

| Item | In tree? | Required bar |
| :--- | :---: | :--- |
| Pause on isolating Overlay | 🟡 queries `[aria-modal="true"]` | Read overlay stack (`isolation.inert` / `isModal`) |
| Swipe-to-dismiss | 🟢 physics exist | E2E `TO-SWIPE-01` (distance **or** velocity) |
| FIFO `limit` | 🟢 queue exists | E2E: excess wait unmounted, timers start on promote |
| Pause on hover / focus | 🟢 | E2E `TO-PAUSE-01` |
| Pause when tab hidden | 🟢 `visibilitychange` | E2E |
| Hotkey to focus toaster | No | Configurable shortcut (Sonner default `Alt+T`), moves focus into the front toast / host |
| `dismissible` per toast | No | `false` blocks swipe and close; timer may still fire unless duration is `false` |
| `onAutoClose` | No | Fires only when the timer expires, not on manual dismiss / swipe / `toast.dismiss` |
| `toast.promise().unwrap()` | No | Return `{ unwrap }` (or equivalent) so callers can await the original promise |

Android TalkBack remains a FocusLock gap, not this gate.

---

## 3. Feature Parity — Overlay & Popover

Compared with **react-tiny-popover** (v8.1.6), Radix, Floating UI, Base UI.

Legend: ✅ engine + proof · 🟢 engine, no E2E · 🟡 partial / defective · ⚪ N/A

### 3.1 Positioning Engine

| Feature | react-tiny-popover | Reference UI | Status |
| :--- | :--- | :--- | :---: |
| 12 placements (cardinal + start/end) | 4 cardinal + `align` | Built into placement | ✅ |
| Offset | `padding` | `offset` on Content | ✅ |
| Flip with hysteresis | Iterates `positions[]` | Flip middleware | ✅ `PO-FLIP-01` |
| Shift / nudge | Orthogonal nudge | Shift + collision padding | ✅ `PO-SHIFT-01` |
| Arrow tracking | `ArrowContainer` | `Overlay.Arrow` `edgePadding` | ✅ `PO-ARROW-01` |
| Portal `container` | `parentElement` | `Overlay.Portal` | 🟢 |
| Virtual anchor | No | `anchor: { x, y }` / `DOMRect` / ref | 🟢 |
| `strategy` absolute / fixed | Absolute only | Both | 🟢 |
| `autoUpdate` | Measure on render | Resize / scroll / ResizeObserver | 🟢 |
| Size CSS vars | No | `--reference-overlay-available-width/height` | 🟢 |
| Hide when clipped | No | `data-anchor-hidden` / `data-escaped` | 🟢 |
| `positionTransform` | Yes | Not exposed | ⚪ |

### 3.2 Interaction & Dismiss

| Feature | react-tiny-popover | Reference UI | Status |
| :--- | :--- | :--- | :---: |
| Controlled `open` | Strictly controlled | `open` + `onOpen` / `onDismiss` / `onOpenChange` | ✅ |
| Uncontrolled `defaultOpen` | No | Yes | 🟢 |
| Click-outside | Callback, consumer toggles | Auto-dismiss, `preventDefault` cancels | 🟡 top-layer only; no `composedPath` |
| Escape | Not built-in | Built-in, topmost layer | 🟡 no nested E2E |
| Nested layer stack | No | Zustand stack | 🟡 cascade / backdrop defects |
| Hover trigger | No | `openOnHover` + delays | 🟢 `PO-HOVER-01` |
| Hover grace polygon | No | **Not implemented** (timers only) | 🟡 Gate 4 |
| Backdrop dismiss | N/A | `Overlay.Backdrop` | 🟡 ignores stack |

### 3.3 DOM & Rendering

| Feature | react-tiny-popover | Reference UI | Status |
| :--- | :--- | :--- | :---: |
| Slot trigger | `cloneElement` + `forwardRef` | Slot / button part | ✅ |
| Compound anatomy | Popover + Arrow | Trigger, Portal, Backdrop, Content, Arrow, Handle | 🟢 |
| Presence exit | Immediate unmount | Presence (Tooltip opts out) | 🟢 |
| Portal color mode | No | `data-layer` + `data-panda-theme` | ✅ `OV-THEME-01/02` |

---

## 4. Feature Parity — Toast vs Sonner

Toast has moved **toward** Sonner since the last revision of this file.
`toast.success/error/warning/info/loading/promise` exist. `toast.define()`
remains the typed reusable path.

### 4.1 Core API

| Feature | Sonner | Reference UI | Status |
| :--- | :--- | :--- | :---: |
| Imperative `toast()` | `toast('msg')` | `toast()` / `toast.show()` | ✅ |
| Definitions | Inline JSX | `toast.define({ render })` | ✅ |
| Update / dismiss / dismiss all | Yes | `update` / `dismiss` / `dismissAll` | ✅ |
| Semantic variants | Built-in | `toast.success/error/warning/info/loading` | ✅ (was “omitted”) |
| `toast.promise()` | Yes + `.unwrap()` | Promise returned, no `.unwrap()` | 🟡 Gate 6 |
| Custom render | `toast.custom` | `toast.custom` + always-custom definitions | ✅ |

### 4.2 Host, stack, gestures

| Feature | Sonner | Reference UI | Status |
| :--- | :--- | :--- | :---: |
| Mount once | `<Toaster />` | `<ReferenceLibrary toaster={...}>` | 🟢 |
| 6 positions | Yes | `top-start` … `bottom-end` | 🟢 |
| Limit + FIFO queue | Hide extras | Waiting queue (unmounted) | 🟡 no E2E |
| Expand-on-hover | Yes | Yes | ✅ `TO-STACK-HOVER` |
| Swipe-to-dismiss | Yes | Pointer distance/velocity | 🟢 no E2E |
| Pause on hover/focus | Yes | Yes | 🟢 |
| Pause when tab hidden | `pauseWhenPageIsHidden` | `visibilitychange` | 🟢 |
| Pause on modal overlay | No | Intended; broken coupling | 🟡 Gate 6 |
| Hotkey to focus toaster | `Alt+T` | Not built-in | 🟡 Gate 6 |
| `onAutoClose` / `dismissible` | Yes | Not props | 🟡 Gate 6 |
| `toast.promise().unwrap()` | Yes | Promise returned, no `.unwrap()` | 🟡 Gate 6 |

---

## 5. Feature Parity — FocusLock

Compared with **react-focus-lock** and **focus-trap-react**.

| Feature | Status | Notes |
| :--- | :---: | :--- |
| Tab / Shift+Tab loop | ✅ | `FL-TAB-02/03` |
| No wrapper / no guards | 🟢 | Slots onto child |
| `shards` | ✅ sibling shard; 🟡 portalled shard unproven | `FL-SHARD-01` |
| `initialFocus` ref/fn/`false` | 🟢 | `false` does not blur to body |
| `restoreFocus` + proximity walk | 🟡 | Algorithm exists; deleted-trigger unproven |
| Nested lock stack | 🟡 | Global `activeLocks`; no `FL-NEST-01` |
| Shadow / `composedPath` / slots | 🟡 | Specced, not lifted |
| Android TalkBack virtual modality | 🟡 | Not implemented |
| Wait for Presence exit | 🟡 | Restore on FocusLock unmount — prove with Overlay Presence |

Deliberate omissions unchanged: `group`, `whiteList`, `FreeFocusInside`,
`InFocusGuard`, cross-frame trapping, public `useFocusScope`.

---

## 6. Testing Proof Status

Happy-path is covered. The hard surface is not. Do not read “31 tests” as
“almost done.”

`matrix/lib` is the only proof location (`tests/e2e/*.spec.ts` +
`tests/unit/*`). Overlay (9) and Popover (9) are among the **largest** lib
suites — Listbox/Menu/Tabs are 1–2 tests. That happy-path density is real.
It does not touch nested stacks, edge drag, iOS scroll, inert, shadow,
portalled shards, tooltip groups, or toast swipe/limit/pause.

`SPEC.md` `[x]` means the Playwright **title contains that case ID**. Unnamed
tests (Escape, backdrop, trap) still count as happy-path proof; they do not
close `OV-ESC-01` / `OV-LAYER-*` / `OV-FOCUS-*`.

| Component | SPEC cases | Matrix tests | What those tests actually are |
| :--- | :---: | :---: | :--- |
| **Overlay** | 133 | 41 | 28 `[x]` cases proven across `@matrix/overlays` (23 deep) and `@matrix/lib` (18). DOM, Escape, Outside Press, Nested Stacks, Inert, Scroll Lock, Edge Sheets, Handle Drag |
| **Popover** | 95 | 9 | Click/flip/shift/arrow/hover-delay. No polygon, no nested layer |
| **Tooltip** | 61 | 3 | Focus/hover + describedby. No skip-delay, no Escape-vs-parent, no scroll-close |
| **Toast** | 81 + 4 Gate 6 | 5 | Show/update/dismiss/stack. No swipe, limit, pause, hotkey, dismissible |
| **FocusLock** | 72 | 5 | Tab loop + sibling shard + restore to live trigger. No Presence, no portal shard, no nest |
| **Unit** | — | **0** for these five | Only Slot and Presence have `tests/unit/` |

Run matrix proof with `pnpm agent pw matrix/overlays` (native unthrottled runner) or `pnpm agent verify Overlay`.

Named Playwright IDs:

- Overlay: `OV-DOM-01/02/05/06/07`, `OV-POS-01`, `OV-TRG-02`, `OV-THEME-01/02`, `OV-ESC-01/02/04`, `OV-OUT-01/02/03/05/08/09`, `OV-LAYER-01/02/03`, `OV-INERT-01/05`, `OV-SCROLL-01/03`, `OV-EDGE-01`, `OV-HND-01/02`, `OV-ISO-02`
- Popover: `PO-DOM-01/02`, Escape, `PO-POS`, outside press, `PO-FLIP-01`, `PO-SHIFT-01`, `PO-ARROW-01`, `PO-HOVER-01/02`
- Tooltip: `TT-DOM-01/02`, hover, `TT-POS`
- Toast: `TO-DOM-01`/`TO-DEF-01`, default, custom, `TO-STACK-01`, `TO-STACK-HOVER`
- FocusLock: `FL-INIT-01`, `FL-TAB-02/03`, `FL-TRAP-01`, `FL-SHARD-01`, `FL-RESTORE-01`

---

## 7. Known Defects (implementation, not missing features)

These are in the tree today. Gates 1, 5, and 6 exist because of them.

1. **`scroll-lock.ts`** — body `overflow: hidden` + scrollbar padding. No
   `visualViewport`, no touch-move prevention, no iOS `position: fixed` restore.
2. **`Overlay.Handle`** — Y-down only. `edge="top|left|right"` bind CSS, then
   drag still `translateY` with `deltaY > 0`.
3. **`Overlay.Backdrop`** — dismisses its own overlay regardless of stack top.
4. **Outside press** — `Node.contains(event.target)`. Shadow hosts look
   outside. No Radix deferred pointer-up / click activation guard beyond a
   `setTimeout(0)` attach.
5. **`stack.removeLayer`** — `setTimeout` cascades `dismiss()` on a
   snapshot of children; re-entrant `addLayer`/`removeLayer` is racy.
6. **Tooltip skip-delay** — `ReferenceLibrary` writes `tooltipWarmup`;
   `Tooltip` reads `tooltipGroup`. Config is a no-op.
7. **Toast vs modal Overlay** — pause looks for `aria-modal="true"`. Overlay
   isolation does not set that attribute. Isolating overlays do not pause toasts.
8. **FocusLock tabbable solver** — `querySelectorAll` of a candidate list, not
   the lifted `tabbable` catalog (shadow, slots, `contenteditable`, details).
9. **Popover “grace”** — `closeDelay` on pointerleave, not a polygon.

---

## 8. Vendor Inspiration Map

What we lift, what we already match, and what is still outstanding.

### react-tiny-popover → Overlay positioning

- **Lifted:** Collision iteration model, boundary inset, scout-free in-tree engine
- **Matches:** 12 placements, `autoUpdate`, virtual anchors, size middleware, hide, Presence
- **Outstanding:** none for geometry; proof beyond flip/shift/arrow is thin

### Sonner → Toast runtime

- **Lifted:** Stack CSS vars, expand-on-hover, swipe physics, `visibilitychange` pause
- **Matches:** Identity/update/dismiss-all, imperative API, remaining-time pause, FIFO intent
- **Outstanding:** Overlay-stack pause coupling; swipe/limit E2E. Semantic variants **did** land.

### react-focus-lock / focus-trap-react → FocusLock

- **Lifted:** Shards, proximity restore walk, `initialFocus: false` = do not move
- **Matches:** Tab cycling, nested stack *structure*, `preventScroll` via FocusOptions
- **Outstanding:** Presence-gated restore proof, portalled shards, shadow/slot solver, TalkBack
- **Deliberate:** no wrapper, no guard sentinels, Overlay owns Escape and outside click

### Radix dismissable-layer → Overlay stack

- **Lifted in spirit:** Topmost Escape, deferred outside press, branches
- **Outstanding:** Real branch registry, capture-phase / `composedPath`, child-before-parent races

### Vaul → Overlay edge

- **Lifted in spirit:** Handle-only drag, 25% or velocity
- **Outstanding:** Axis per edge, iOS `position: fixed` + scroll restore
- **Leave:** Snap points, scale-behind, drag-anywhere

### React Aria → Scroll lock + inert

- **Specified:** `preventScrollMobileWebKit`, `ariaHideOutside`, TalkBack skip
- **Partially lifted:** Sibling-walk `inert` + refcount + live-region / toast exceptions
- **Outstanding:** Real iOS scroll lock; TalkBack

---

## 9. Execution Priority

```
Gate 1  Overlay kernel defects            DONE in source
Gate 2  Overlay nested / isolation E2E   largely in @matrix/overlays
        Remaining: Overlay SPEC work order, then STOP Overlay titles

Gate 3  FocusLock
        Presence restore, deleted trigger, nest, portalled shard
        Overlay registers shards; FocusLock solves Tab/restore

Gate 4  Popover safe-polygon only
        Implement + PO-HOVER-02 as a real diagonal. Do not expand PO-POS.

Gate 5  Tooltip skip-delay store
        Unify tooltipGroup. Then Escape-vs-parent Overlay, scroll-close policy.

Gate 6  Toast — separate runtime
        Pause from overlay stack (not aria-modal)
        Swipe / limit E2E; hotkey, dismissible, onAutoClose, unwrap()
```

Still not a production blocker: Android TalkBack virtual-modality skip on FocusLock.

---

## 10. What this file used to get wrong

Corrected 2026-09-08 against source + `matrix/lib/tests/e2e/*`:

| Old claim | Reality |
| :--- | :--- |
| Phase 1 (extract Toast/Tooltip/Announcer from ReferenceLibrary) is current work | Done |
| Overlay 132 contracts / 7 E2E | 100 / 9 |
| Popover 4 E2E; flip/shift/hover unproven | 9 E2E including `PO-FLIP-01`, `PO-SHIFT-01`, `PO-ARROW-01`, `PO-HOVER-01/02` |
| Hover grace polygon “specced” as if the feature existed | Timers only |
| Collision flip/shift needs E2E | Landed |
| FocusLock shards need E2E | Sibling shard landed; portalled shard has not |
| Inert / hierarchical dismiss / iOS scroll lock “implemented” | Inert walk + cascade + iOS lock closed in source (2026-09-08); Overlay SPEC Must still open |
| Uncontrolled mode omitted by design | `defaultOpen` exists |
| `toast.success` etc. deliberately omitted | Implemented |
| Expand-on-hover / swipe / tab-hidden pause are gaps | Implemented (swipe unproven) |
| Toast hotkey / `dismissible` / `onAutoClose` / `.unwrap()` are optional polish | **Gate 6**, required for production |
| `TESTS.md` `[x]` means proven | Overlay family uses `SPEC.md`; `[x]` is Playwright-proven |

---

*Last updated: 2026-09-08. Specs: [Overlay.md](src/components/Overlay/Overlay.md) · [Popover.md](src/components/Popover/Popover.md) · [Tooltip.md](src/components/Tooltip/Tooltip.md) · [Toast.md](src/components/Toast/Toast.md) · [FocusLock.md](src/components/FocusLock/FocusLock.md). Proof files: `matrix/lib/tests/e2e/{overlay,popover,tooltip,toast,focus-lock}.spec.ts`.*
