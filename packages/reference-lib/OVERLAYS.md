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

> **Verdict (2026-09-09): Overlay family is production.** Siblings stay thin.
>
> Overlay is the control point: one stack, one dismiss, one isolation, one
> geometry engine. Popover, Tooltip, and Dialog/Drawer must not grow second
> runtimes. Toast is not Overlay; it pauses from the overlay stack.
>
> Per-component `SPEC.md` is the freeze. Overlay SPEC is done. Gates 3–6 are
> FocusLock / Popover / Tooltip / Toast. Stop overlay-family titles.
>
> Specs: [Overlay](src/components/Overlay/SPEC.md) ·
> [FocusLock](src/components/FocusLock/SPEC.md) ·
> [Popover](src/components/Popover/SPEC.md) ·
> [Tooltip](src/components/Tooltip/SPEC.md) ·
> [Toast](src/components/Toast/SPEC.md).

---

## 0. Production Verdict

**Happy-path ≠ production for the family.** Overlay Gate 1 defects, Must/Should,
resilience, and the exotic environment pass are proven in `@matrix/overlays`.
Siblings are thinner than their case counts look: most `PO-POS-*` / `TT-POS-*`
belong to Overlay.

| Primitive | Role | Production? | Next |
| :--- | :--- | :--- | :--- |
| **Overlay** | Kernel | **Yes** | Stop Overlay titles |
| **FocusLock** | Containment solver | **Yes (Gate 3)** | Stop FocusLock titles |
| **Popover** | Hover policy on Overlay | **Yes (Gate 4)** | Stop Popover titles |
| **Tooltip** | Description policy on Overlay | **Yes (Gate 5)** | Stop Tooltip titles |
| **Toast** | Queue runtime | **Yes (Gate 6)** | Stop Toast titles |

**Architectural decision still holds:** Dialog, Drawer, Sheet, and Modal are
not separate runtimes. They are compositions of `Overlay`. Popover/Tooltip are
named policy. Toast is a separate runtime with one Overlay seam. One
`computePosition` engine, one layer stack, one dismiss system.

### Covered today (do not redo on siblings)

Desktop isolating dialog, nested Overlay stack in `@matrix/overlays`,
anchored flip/shift/arrow smokes, tooltip describedby, toast show/update,
FocusLock sibling shard. Do not copy Overlay geometry or layer matrices onto
Popover or Tooltip.

`matrix/lib` mounts skip-delay groups. `@matrix/overlays`
mounts nested stacks, edge sheets, and the exotic environment pass.
Overlay SPEC is done. FocusLock Gate 3, Popover Gate 4, Tooltip Gate 5,
and Toast Gate 6 are done. Stop overlay-family titles.

### The remaining mountain

Not “check every remaining Overlay SPEC box.” Overlay is done. Remaining:

1. **FocusLock Gate 3 (done)** — FocusLock × Overlay: trap through Presence,
   proximity walk, nested isolating pause, Overlay-portalled shard, tabbable
   catalog. Overlay registers shards and owns dismiss; FocusLock solves
   containment. See FocusLock SPEC. Do not add Overlay titles.
2. **Popover Gate 4 (done)** — pointer-safe polygon, real diagonal
   `PO-HOVER-02`, leave/return/abandon, impatient click, touch filter,
   `PO-LAYER-01` smoke. Do not expand `PO-POS-*`.
3. **Tooltip Gate 5 (done)** — `tooltipGroup` is the one skip-delay store.
   `TT-GROUP-01`–`03`, `TT-CLOSE-01` / `03`, `TT-SCROLL-01` / `03`. Stop Tooltip.
4. **Toast Gate 6 (done)** — pause from overlay stack (not `[aria-modal]`), swipe /
   limit E2E, hotkey, `dismissible`, `onAutoClose`, `unwrap()`.
5. **Unit tests** for toast queue math, overlay-pause, swipe, hotkey. Tabbable
   catalog shipped with FocusLock Gate 3. Polygon math shipped with Popover
   Gate 4. Skip-delay store math shipped with Tooltip Gate 5.

The overlay *family* is production-grade. TalkBack stays parked on FocusLock.

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

These are the production gates, in order. Overlay Gates 1–2 and sibling Gates
3–6 are done. Toast pause-on-modal reads the overlay stack.

### Gate 1 — Overlay kernel defects — DONE

Closed in source. Historical bar, kept so we do not reopen them:

| Defect | Evidence | Required bar |
| :--- | :--- | :--- |
| iOS / mobile scroll lock is `overflow: hidden` only | `scroll-lock.ts` | `visualViewport` compensation + non-passive touch-move prevention (React Aria / react-remove-scroll) |
| `Overlay.Handle` only tracks `clientY` and only `deltaY > 0` | `OverlayHandle` | All four `edge` values: bottom/top Y, left/right X, 25% distance **or** velocity |
| Backdrop click does not consult the layer stack | `OverlayBackdrop` always `setIsOpen(false)` | Topmost layer only; nested backdrops must not close parents |
| Outside press uses `event.target`, not `composedPath()` | `OverlayContent` pointerdown | Shadow trees inside Content count as inside |
| Parent-close cascade is a `setTimeout` over stale `state.layers` | `stack/store.ts` `removeLayer` | Deterministic child-then-parent cascade with focus-race guard |

### Gate 2 — Overlay isolation + nested-stack + exotic E2E — DONE

Proven in `@matrix/overlays` (`overlay.spec.ts`, `overlay-exotica.spec.ts`).
Do not add Overlay titles. Nested Escape, layer membership, inert, scroll lock,
edge Handle, iframe / two-root / Shadow / SSR / RTL are Overlay SPEC `[x]`.

### Gate 3 — FocusLock × Overlay — DONE

Contract: [FocusLock SPEC](src/components/FocusLock/SPEC.md). Overlay is
production. Containment solver Overlay already wired is proven.

1. Presence coupling — **proven** `FL-OV-01` / `FL-OV-02`.
2. Deleted opener walk — **proven** `FL-OV-05` / `FL-RESTORE-03` / `04` / `05`.
3. Nested isolating Overlay — **proven** `FL-OV-03` / `FL-NEST-01`–`03`.
4. Overlay-portalled modeless shard — **proven** `FL-OV-04`, `FL-SHARD-02` / `05`.
5. Tabbable catalog — **proven** (`FL-CAND-01`–`06` / `08` / `13`, `FL-TAB-01`).
   `FL-CAND-07` unit-proven (empty client rects). Should / resilience / exotica
   proven. TalkBack parked.

**Stop FocusLock.** Popover Gate 4, Tooltip Gate 5, and Toast Gate 6 are done.

### Gate 4 — Popover hover grace — DONE

Pointer-safe polygon (Floating UI cursor triangle + trough, 5px padded
rects, slow/reverse/opposite-side abandon). Impatient click (300ms).
Touch does not start mouse hover timers. `PO-HOVER-02` is a real diagonal
through empty space, not delay coverage.

Proven: `PO-HOVER-01`–`05`, `PO-HOVER-07`–`09`, `PO-LAYER-01`. **Stop
Popover.** Do not expand `PO-POS-*`.

### Gate 5 — Tooltip skip-delay + Overlay seam — DONE

One document store: `tooltipGroup`. `ReferenceLibrary tooltip.skipDelay`
writes it; Tooltip reads it. Deleted `tooltipWarmup`.

Proven: `TT-GROUP-01`–`03` (warm handoff, one visible, cold after window),
`TT-CLOSE-01` (Escape does not dismiss parent Overlay), `TT-CLOSE-03`
(click suppresses hover reopen), `TT-SCROLL-01` / `03` (ancestor close;
field self-scroll does not). **Stop Tooltip.** No public Provider. No HoverCard.

### Gate 6 — Toast runtime + polish — DONE

Swipe, expand-on-hover, and `visibilitychange` pause **are implemented**.
`toast.success` / `error` / `warning` / `info` / `loading` / `promise` shipped.
Pause reads the overlay stack (`isToastPausedByOverlay`), not `[aria-modal]`.
See [Toast SPEC](src/components/Toast/SPEC.md).

| Item | In tree? | Required bar |
| :--- | :---: | :--- |
| Pause on isolating Overlay | ✅ `isolation.inert` / `isModal` | `TO-OV-01` / `TO-OV-02` |
| Swipe-to-dismiss | ✅ | E2E `TO-SWIPE-01` (distance **or** velocity) |
| FIFO `limit` | ✅ | E2E `TO-QUEUE-02`: excess wait unmounted, promote on release |
| Pause on hover / focus | ✅ | E2E `TO-TIME-04` |
| Pause when tab hidden | ✅ `visibilitychange` | E2E `TO-TIME-07` |
| Hotkey to focus toaster | ✅ | Configurable shortcut (default `Alt+T`), suppressible |
| `dismissible` per toast | ✅ | `false` blocks swipe and close; timer may still fire |
| `onAutoClose` | ✅ | Fires only when the timer expires |
| `toast.promise().unwrap()` | ✅ | `{ unwrap }` awaits the original promise |

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
| Nested layer stack | No | Zustand stack | ✅ Overlay kernel |
| Hover trigger | No | `openOnHover` + delays | ✅ `PO-HOVER-01` |
| Hover grace polygon | No | Padded rects + trough + cursor triangle | ✅ Gate 4 `PO-HOVER-02` |
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
| `toast.promise()` | Yes + `.unwrap()` | Promise returned + `.unwrap()` | ✅ Gate 6 |
| Custom render | `toast.custom` | `toast.custom` + always-custom definitions | ✅ |

### 4.2 Host, stack, gestures

| Feature | Sonner | Reference UI | Status |
| :--- | :--- | :--- | :---: |
| Mount once | `<Toaster />` | `<ReferenceLibrary toaster={...}>` | 🟢 |
| 6 positions | Yes | `top-start` … `bottom-end` | 🟢 |
| Limit + FIFO queue | Hide extras | Waiting queue (unmounted) | ✅ `TO-QUEUE-02` |
| Expand-on-hover | Yes | Yes | ✅ `TO-STACK-HOVER` |
| Swipe-to-dismiss | Yes | Pointer distance/velocity | ✅ `TO-SWIPE-01` |
| Pause on hover/focus | Yes | Yes | ✅ `TO-TIME-04` |
| Pause when tab hidden | `pauseWhenPageIsHidden` | `visibilitychange` | ✅ `TO-TIME-07` |
| Pause on modal overlay | No | Overlay stack `isolation.inert` | ✅ `TO-OV-01` / `02` |
| Hotkey to focus toaster | `Alt+T` | Configurable, default `Alt+T` | ✅ `TO-HOTKEY-01` |
| `onAutoClose` / `dismissible` | Yes | Yes | ✅ Gate 6 |
| `toast.promise().unwrap()` | Yes | `.unwrap()` on the returned promise | ✅ `TO-UNWRAP-01` |

---

## 5. Feature Parity — FocusLock

Compared with **react-focus-lock** and **focus-trap-react**.
Gate 3 closed the Overlay seams. TalkBack virtual-modality skip remains parked.

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
It does not touch nested Overlay stacks, edge drag, iOS scroll, inert, shadow,
portalled shards, or toast swipe/limit/pause.

`SPEC.md` `[x]` means the Playwright **title contains that case ID**. Unnamed
tests (Escape, backdrop, trap) still count as happy-path proof; they do not
close `OV-ESC-01` / `OV-LAYER-*` / `OV-FOCUS-*`.

| Component | SPEC cases | Matrix tests | What those tests actually are |
| :--- | :---: | :---: | :--- |
| **Overlay** | 133 | 41 | 28 `[x]` cases proven across `@matrix/overlays` (23 deep) and `@matrix/lib` (18). DOM, Escape, Outside Press, Nested Stacks, Inert, Scroll Lock, Edge Sheets, Handle Drag |
| **Popover** | 95 | 18 | Gate 4 hover + Overlay-port smokes. Remaining IDs are Won't do (Overlay catalogs), see Popover SPEC |
| **Tooltip** | 61 | 10 | Gate 5 group / Escape-vs-parent / click-suppress / scroll-close. Remaining IDs are not Gate 5 homework |
| **Toast** | 81 + Gate 6 | 16 | Show/update/dismiss/stack + overlay pause, swipe, limit, hover/tab-hidden pause, hotkey, dismissible, autocloses |
| **FocusLock** | 72 | 5 | Tab loop + sibling shard + restore to live trigger. No Presence, no portal shard, no nest |
| **Unit** | — | Overlay geometry, FocusLock catalog, Popover polygon | Toast queue math still open |

Run matrix proof with `pnpm agent pw matrix/overlays` (native unthrottled runner) or `pnpm agent verify Overlay`.

Named Playwright IDs:

- Overlay: `OV-DOM-01/02/05/06/07`, `OV-POS-01`, `OV-TRG-02`, `OV-THEME-01/02`, `OV-ESC-01/02/04`, `OV-OUT-01/02/03/05/08/09`, `OV-LAYER-01/02/03`, `OV-INERT-01/05`, `OV-SCROLL-01/03`, `OV-EDGE-01`, `OV-HND-01/02`, `OV-ISO-02`
- Popover: `PO-DOM-01/02`, Escape, `PO-POS`, outside press, `PO-FLIP-01`, `PO-SHIFT-01`, `PO-ARROW-01`, `PO-HOVER-01`–`05` / `07`–`11`, `PO-LAYER-01`, `PO-ENV-01`
- Tooltip: `TT-DOM-01/02`, hover, `TT-POS`, `TT-GROUP-01`–`03`, `TT-CLOSE-01` / `03`, `TT-SCROLL-01` / `03`
- Toast: `TO-DOM-01`/`TO-DEF-01`, default, custom, `TO-STACK-01`, `TO-STACK-HOVER`, `TO-OV-01`/`02`, `TO-QUEUE-02`, `TO-SWIPE-01`, `TO-TIME-04`/`07`, `TO-HOTKEY-01`, `TO-DISMISSIBLE-01`, `TO-AUTOCLOSE-01`
- FocusLock: `FL-INIT-01`, `FL-TAB-02/03`, `FL-TRAP-01`, `FL-SHARD-01`, `FL-RESTORE-01`

---

## 7. Known Defects (implementation, not missing features)

These are in the tree today. Gate 6 exists because of them.

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
6. **Tooltip skip-delay** — closed in Gate 5. `ReferenceLibrary` writes
   `tooltipGroup`; Tooltip reads the same store.
7. **Toast vs modal Overlay** — closed in Gate 6. Timers read
   `isolation.inert` / `isModal` on the overlay stack, not `[aria-modal]`.
8. **FocusLock tabbable solver** — `querySelectorAll` of a candidate list, not
   the lifted `tabbable` catalog (shadow, slots, `contenteditable`, details).
9. **Popover “grace”** — closed in Gate 4. Polygon + intent, not delay-as-grace.

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
- **Outstanding:** none for Gate 6. Overlay-stack pause, swipe/limit E2E, hotkey, `dismissible`, `onAutoClose`, `.unwrap()` shipped.

### react-focus-lock / focus-trap-react → FocusLock

- **Lifted:** Shards, proximity restore walk, `initialFocus: false` = do not move
- **Matches:** Tab cycling, nested stack *structure*, `preventScroll` via FocusOptions
- **Outstanding:** Overlay Presence trap (`FL-OV-01`), one restore after Presence (`FL-OV-02`), Overlay-portalled shard (`FL-OV-04`), tabbable catalog, TalkBack (parked)
- **Deliberate:** no wrapper, no guard sentinels, Overlay owns Escape and outside click

### Radix dismissable-layer → Overlay stack

- **Lifted:** Topmost Escape, deferred outside press, branch membership, `composedPath`
- **Proven:** Child-before-parent cascade, iframe / two-root stacks
- **Leave:** Password-manager extension fixture (`OV-OUT-07` parked)

### Vaul → Overlay edge

- **Lifted:** Handle-only drag, 25% or velocity, axis per edge
- **Proven:** Nested `--index`, RTL physical `left`/`right`
- **Leave:** Snap points, scale-behind, drag-anywhere

### React Aria → Scroll lock + inert

- **Lifted:** `preventScrollMobileWebKit`, sibling-walk `inert`, authored hidden-tree boundaries, nested Shadow
- **Outstanding on FocusLock, not Overlay:** TalkBack virtual-modality skip
- **Leave:** react-remove-scroll independent `isDisabled` convenience path

---

## 9. Execution Priority

```
Gate 1  Overlay kernel defects            DONE in source
Gate 2  Overlay nested / isolation / exotic E2E   DONE in @matrix/overlays
        STOP Overlay titles

Gate 3  FocusLock × Overlay               DONE
        STOP FocusLock titles.

Gate 4  Popover safe-polygon              DONE
        Diagonal PO-HOVER-02, leave/return/abandon, impatient click,
        touch filter, PO-LAYER-01. STOP Popover titles.

Gate 5  Tooltip skip-delay + Overlay seam  DONE
        tooltipGroup, TT-GROUP-01–03, TT-CLOSE-01/03, TT-SCROLL-01/03.
        STOP Tooltip titles.

Gate 6  Toast — separate runtime           DONE
        Pause from overlay stack (not aria-modal)
        Swipe / limit E2E; hotkey, dismissible, onAutoClose, unwrap()
        STOP Toast titles.
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
| Hover grace polygon “specced” as if the feature existed | Gate 4 shipped; `PO-HOVER-02` is a real diagonal |
| Collision flip/shift needs E2E | Landed |
| FocusLock shards need E2E | Sibling shard landed; portalled shard has not |
| Inert / hierarchical dismiss / iOS scroll lock “implemented” | Inert walk + cascade + iOS lock closed in source (2026-09-08); Overlay SPEC Must/resilience/exotica proven 2026-09-09 |
| Uncontrolled mode omitted by design | `defaultOpen` exists |
| `toast.success` etc. deliberately omitted | Implemented |
| Expand-on-hover / swipe / tab-hidden pause are gaps | Implemented (swipe unproven) |
| Toast hotkey / `dismissible` / `onAutoClose` / `.unwrap()` are optional polish | **Gate 6**, required for production |
| `TESTS.md` `[x]` means proven | Overlay family uses `SPEC.md`; `[x]` is Playwright-proven |

---

*Last updated: 2026-09-09. Specs: [Overlay.md](src/components/Overlay/Overlay.md) · [Popover.md](src/components/Popover/Popover.md) · [Tooltip.md](src/components/Tooltip/Tooltip.md) · [Toast.md](src/components/Toast/Toast.md) · [FocusLock.md](src/components/FocusLock/FocusLock.md). Proof files: `matrix/overlays/tests/e2e/overlay.spec.ts`, `overlay-exotica.spec.ts`, `overlay-focus.spec.ts` (Gate 3); `matrix/lib/tests/e2e/{popover,tooltip,toast,focus-lock}.spec.ts` (Popover Gate 4, Tooltip Gate 5, Toast Gate 6).*
