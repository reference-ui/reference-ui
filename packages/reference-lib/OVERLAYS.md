# OVERLAYS.md — Feature Parity & System Status

Where we are, where we're going, and what the best libraries do — all in one
place. This document covers the five interlocking primitives that make up the
Reference UI overlay system:

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

---

## 1. System Architecture at a Glance

| Primitive | Role | Isolation | Geometry | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Overlay** | Universal kernel — layer stack, dismiss, portal, presence | Configurable | Unbound / Anchored / Edge | ✅ Implemented |
| **Popover** | Policy wrapper — `Overlay` with `isolation={false}`, hover | Off | Anchored | ✅ Implemented |
| **Tooltip** | Policy wrapper — non-interactive, `aria-describedby`, skip-delay | Off | Anchored | ✅ Implemented |
| **Toast** | Separate runtime — queue, host, timers, announce | None (not Overlay) | Viewport-attached | ✅ Implemented |
| **FocusLock** | Focus containment — Tab loop, shards, restore | N/A | N/A | ✅ Implemented |

**Key architectural decision:** Dialog, Drawer, Sheet, Modal are *not* separate
runtime components. They are semantic/visual compositions of `Overlay` with
different `isolation` / `edge` / `role` configurations. There is one
`computePosition` engine, one layer stack, one dismiss system.

---

## 2. Feature Parity Matrix — Overlay & Popover

Comparing our `Overlay` + `Popover` against **react-tiny-popover** (v8.1.6)
and the broader ecosystem (Radix, Floating UI, Base UI).

### 2.1 Positioning Engine

| Feature | react-tiny-popover | Reference UI | Status |
| :--- | :--- | :--- | :---: |
| 4 cardinal placements | `positions: ['top','bottom','left','right']` | 12 placements (cardinal + start/end) | ✅ Exceeds |
| Alignment axis | `align: 'start' \| 'center' \| 'end'` | Built into placement (`bottom-start`, etc.) | ✅ Parity |
| Offset / padding | `padding: number` (px between anchor & floating) | `offset: number` on `Overlay.Content` | ✅ Parity |
| Collision detection & flip | Iterates `positions[]`, first non-colliding wins | Flip middleware with hysteresis (no jitter) | ✅ Exceeds |
| Shift / nudge into bounds | Nudges along orthogonal axis, reports `nudgedLeft/Top` | Shift middleware with boundary clamping | ✅ Exceeds |
| Boundary element | `boundaryElement` prop (default viewport) | `collisionPadding` + viewport boundary | ✅ Parity |
| Boundary inset | `boundaryInset: number` | `collisionPadding: number` | ✅ Parity |
| Arrow auto-tracking | `ArrowContainer` clamped to popover edge | `Overlay.Arrow` with `edgePadding` | ✅ Parity |
| Custom parent portal | `parentElement` (default `document.body`) | `Overlay.Portal` with `container` prop | ✅ Parity |
| Scout element for stacking contexts | `.react-tiny-popover-scout` measures offsets | In-tree floating engine handles directly | ✅ Parity |
| Virtual anchor | Not supported | `anchor: { x, y }` / `DOMRect` / `getBoundingClientRect` | ✅ Exceeds |
| Strategy (absolute / fixed) | Absolute only | `strategy: 'absolute' \| 'fixed'` | ✅ Exceeds |
| `autoUpdate` (live repositioning) | Not built-in (measures on render only) | Full `autoUpdate`: resize, scroll, ResizeObserver | ✅ Exceeds |
| Size middleware (available height) | Not supported | `--reference-overlay-available-width/height` | ✅ Exceeds |
| Hide when clipped | Not supported | `data-anchor-hidden` / `data-escaped` | ✅ Exceeds |
| `positionTransform` (custom offset) | `positionTransform` absolute/relative modes | Not exposed (use `offset`) | ⚪ N/A |

### 2.2 Interaction & Dismiss

| Feature | react-tiny-popover | Reference UI | Status |
| :--- | :--- | :--- | :---: |
| Controlled state | Strictly controlled `isOpen` | Controlled `open` + `onOpen` / `onDismiss` | ✅ Parity |
| Uncontrolled mode | Not supported | Not supported (by design) | ✅ Aligned |
| Click-outside dismiss | `onClickOutside` callback, consumer toggles | `onOutsidePress` + auto-dismiss, `preventDefault` cancels | ✅ Exceeds |
| Capture phase outside click | `clickOutsideCapture: true` default | Deferred pointer sequence (Radix model) | ✅ Exceeds |
| Escape dismiss | Not built-in | Built-in with `onEscape` handler | ✅ Exceeds |
| Nested layer stack | Not supported | Document-scoped Zustand stack, Escape = topmost only | ✅ Exceeds |
| Hover trigger | Not built-in | `Popover` policy: `openOnHover`, `openDelay`, `closeDelay` | ✅ Exceeds |
| Hover grace polygon | Not built-in | Popover safe-polygon keeping popup open | 🟡 Specced |
| Backdrop dismiss | N/A (no isolation) | `Overlay.Backdrop` as isolating dismiss surface | ✅ Exceeds |

### 2.3 DOM & Rendering

| Feature | react-tiny-popover | Reference UI | Status |
| :--- | :--- | :--- | :---: |
| No wrapper on trigger | `React.cloneElement` (requires `forwardRef`) | `Slot` composition (no `forwardRef` needed on R19) | ✅ Parity |
| Portal rendering | Appended to `parentElement` | `ReactDOM.createPortal` via `Overlay.Portal` | ✅ Parity |
| Compound anatomy | `<Popover>` + `<ArrowContainer>` | `Overlay.{Trigger,Portal,Backdrop,Content,Arrow,Handle}` | ✅ Exceeds |
| Headless hooks | `usePopover` + `useArrowContainer` | `useOverlay()` context hook | ✅ Parity |
| Content render callback | `content={(state) => JSX}` with geometry state | CSS custom properties + data attributes | ✅ Different approach |
| Multiple simultaneous popovers | Class-based container (v8.1+) | Each `Overlay` is independent | ✅ Parity |
| Presence / exit animation | **Not supported** (immediate unmount) | Full `Presence` system: CSS transitions, keyframes, WAAPI, GSAP | ✅ Exceeds |
| Color mode in portals | Not handled | `OverlayPortaledSurface` bridges `colorMode` | ✅ Exceeds |

---

## 3. Feature Parity Matrix — Toast

Comparing our `Toast` against **Sonner** (emilkowalski/sonner).

### 3.1 Core API

| Feature | Sonner | Reference UI | Status |
| :--- | :--- | :--- | :---: |
| Imperative `toast()` | `toast('msg')`, `toast.success()`, etc. | `toast.show(Definition, props, opts)` | ✅ Parity (different shape) |
| Toast definitions | Not concept (inline JSX or string) | `toast.define({ render, duration, position })` — typed, reusable | ✅ Exceeds |
| Update in-place | Pass same `id` to any `toast()` call | `toast.update(id, newDef, newProps)` | ✅ Parity |
| Dismiss specific | `toast.dismiss(id)` | `toast.dismiss(id)` | ✅ Parity |
| Dismiss all | `toast.dismiss()` (no args) | `toast.dismiss()` (no args) | ✅ Parity |
| Custom render | `toast.custom((id) => JSX)` | `toast.define({ render })` — always custom | ✅ Parity |
| Promise lifecycle | `toast.promise(p, { loading, success, error })` | Swap definitions via `toast.update()` | 🔵 Different model |
| Semantic variants | `toast.success/error/warning/info/loading` | **Deliberately omitted** — apps model via definitions | 🔵 By design |
| `toast.loading()` | Built-in spinner, non-auto-closing | Via `toast.define({ duration: false })` | ✅ Equivalent |
| Awaitable `.unwrap()` | `const { unwrap } = toast.promise(...)` | Not built-in | ⚪ Not planned |

### 3.2 Toaster Configuration

| Feature | Sonner | Reference UI | Status |
| :--- | :--- | :--- | :---: |
| Mount once at root | `<Toaster />` in layout | `<ReferenceLibrary toaster={...}>` | ✅ Parity |
| Position | 6 positions (`top-left` thru `bottom-right`) | 6 positions (`top-start` thru `bottom-end`) | ✅ Parity |
| Default duration | `duration={4000}` | `defaultDuration: 5000` | ✅ Parity |
| Visible limit | `visibleToasts={3}` | `limit: 4` + FIFO waiting queue | ✅ Exceeds |
| Gap between toasts | `gap={14}` | CSS custom properties on wrappers | ✅ Parity |
| Rich colors | `richColors` prop | Application-owned via definitions | 🔵 By design |
| Theme support | `theme="light\|dark\|system"` | Inherits from `ReferenceLibrary` color mode | ✅ Parity |
| RTL direction | `dir="rtl\|ltr\|auto"` | Inherits from document/provider | ✅ Parity |
| Custom icons | `icons={{ success?, error?, ... }}` | Application-owned via `render()` | 🔵 By design |
| Hotkey focus | `hotkey={['altKey','KeyT']}` | Not built-in | 🟡 Gap |
| Pause on tab hidden | `pauseWhenPageIsHidden` | Not built-in (could add) | 🟡 Gap |
| Offset from edge | `offset={32}` | CSS custom properties | ✅ Parity |
| Container aria-label | `containerAriaLabel="Notifications"` | `data-reference-toast-host` with label | ✅ Parity |
| Global `toastOptions` | `toastOptions={{...}}` on `<Toaster>` | Toaster defaults on `ReferenceLibrary` | ✅ Parity |

### 3.3 Per-Toast Features

| Feature | Sonner | Reference UI | Status |
| :--- | :--- | :--- | :---: |
| Description text | `description` prop | Part of custom `render()` | 🔵 By design |
| Action button | `action: { label, onClick }` | Part of custom `render()` with `controls.close` | 🔵 By design |
| Cancel button | `cancel: { label, onClick }` | Part of custom `render()` | 🔵 By design |
| `onDismiss` callback | Per-toast callback | Part of custom `render()` logic | 🔵 By design |
| `onAutoClose` callback | Per-toast callback | Not built-in | 🟡 Gap |
| `dismissible` toggle | `dismissible={false}` | Not built-in as prop | 🟡 Gap |
| `important` flag | Boosts to assertive | Via `announce` option politeness | ✅ Parity |
| `unstyled` mode | `unstyled={true}` | Always unstyled — apps own rendering | ✅ Exceeds |
| `classNames` granular | Per-part class targets | N/A — apps own all markup | 🔵 By design |
| Infinite duration | `duration: Infinity` | `duration: false` | ✅ Parity |

### 3.4 Animation & Stacking

| Feature | Sonner | Reference UI | Status |
| :--- | :--- | :--- | :---: |
| Collapsed stack (scale + offset) | CSS vars: `--index`, `--scale`, `--offset` | `--reference-toast-index` / `--reference-toast-count` | ✅ Parity |
| Expand on hover | Auto-expand to full heights on `mouseenter` | Not built-in | 🟡 Gap |
| Dynamic height measurement | Real-time DOM height registry | Presence-based wrappers | ✅ Partial |
| Swipe-to-dismiss | Pointer events, velocity + distance threshold | Not built-in | 🟡 Gap |
| Interruptible transitions | CSS transitions (not keyframes) | Presence system handles transitions | ✅ Parity |
| Exit timing | Hardcoded `TIME_BEFORE_UNMOUNT = 200ms` | Presence waits for actual transition/animation end | ✅ Exceeds |

### 3.5 Accessibility

| Feature | Sonner | Reference UI | Status |
| :--- | :--- | :--- | :---: |
| ARIA live region | `aria-live="polite"` / `"assertive"` for errors | Separate `announce()` live region path | ✅ Parity |
| Semantic landmark | `<section aria-label>` + `<ol>` | `data-reference-toast-host` with label | ✅ Parity |
| Keyboard tab navigation | Tab through action/close buttons | Application-owned via render | ✅ Parity |
| Timer pause on hover/focus | Pauses on hover/focus | Pauses on pointer/keyboard focus inside toast | ✅ Parity |
| Timer pause on modal overlay | Not built-in | Pauses when modal Overlay is top layer | ✅ Exceeds |

### 3.6 State Management

| Feature | Sonner | Reference UI | Status |
| :--- | :--- | :--- | :---: |
| Observer / pub-sub | Singleton `ToastState` class | Document-scoped Zustand store | ✅ Parity |
| Decoupled from React tree | `toast()` callable anywhere | `toast.show()` callable anywhere | ✅ Parity |
| Replay on late mount | Replays active toasts on `subscribe` | Replay-on-subscribe | ✅ Parity |
| Remaining-time pause | Hover pauses remaining time | Remaining-time math with pause/resume | ✅ Parity |
| StrictMode safety | RAF-deferred dismiss | Controlled via Zustand | ✅ Parity |
| FIFO queue for excess | Hides with `opacity:0` + `pointer-events:none` | Proper FIFO waiting queue (unmounted, no timers) | ✅ Exceeds |

---

## 4. Feature Parity Matrix — FocusLock

Comparing our `FocusLock` against **react-focus-lock** (theKashey) and
**focus-trap-react** (focus-trap).

### 4.1 Core Trapping

| Feature | react-focus-lock | focus-trap-react | Reference UI | Status |
| :--- | :--- | :--- | :--- | :---: |
| Tab/Shift+Tab cycling | Focus guards (`data-focus-guard`) + `focusin` redirect | `keydown` interception + `preventDefault` | `keydown` loop (Aria/Radix model) | ✅ Implemented |
| Tabbable resolver | `focus-lock/focusables.ts` (simpler) | `tabbable` library (strict) | Lifted from `tabbable` (strict catalog) | ✅ Implemented |
| No DOM injection | Injects 2-3 guard divs | Zero injected elements | No wrapper, slots onto child | ✅ Exceeds |
| Controlled enable/disable | `disabled` prop | `active` / `paused` props | `disabled` prop | ✅ Parity |

### 4.2 Shards / Multi-Container

| Feature | react-focus-lock | focus-trap-react | Reference UI | Status |
| :--- | :--- | :--- | :--- | :---: |
| Shard refs | `shards={[ref1, ref2]}` | `containerElements={[el1, el2]}` | `shards={[ref/el, ...]}` | ✅ Implemented |
| Named groups | `group="name"` string | N/A | Not planned | ⚪ By design |
| `whiteList` filter | `whiteList={(el) => bool}` | `allowOutsideClick` | Not planned | ⚪ By design |
| `FreeFocusInside` zone | `<FreeFocusInside>` / `data-no-focus-lock` | N/A | Not planned | ⚪ By design |
| `InFocusGuard` for shards | `<InFocusGuard />` standalone guard | N/A | Not needed (no guards) | ⚪ N/A |
| Branch registry context | N/A | N/A | Radix-style branches under `shards` name | ✅ Specced |

### 4.3 Initial Focus

| Feature | react-focus-lock | focus-trap-react | Reference UI | Status |
| :--- | :--- | :--- | :--- | :---: |
| Auto-focus first tabbable | `autoFocus={true}` (default) | Omit `initialFocus` | Omit `initialFocus` | ✅ Parity |
| Focus specific element | `<AutoFocusInside>` / `data-autofocus` | `initialFocus` selector/element/fn | `initialFocus` ref/fn | ✅ Parity |
| Skip focus move (`false`) | **Blurs to `document.body`** ⚠️ | **Does not move focus** ✅ | **Does not move focus** ✅ | ✅ Better than focus-lock |
| Fallback focus | N/A (warns if no candidates) | `fallbackFocus` (required if empty) | Container itself if no candidates | ✅ Parity |

### 4.4 Focus Restoration

| Feature | react-focus-lock | focus-trap-react | Reference UI | Status |
| :--- | :--- | :--- | :--- | :---: |
| Return focus on deactivation | `returnFocus` (default **false**) | `returnFocusOnDeactivate` (default **true**) | `restoreFocus` (default **true**) | ✅ Parity |
| Explicit return target | Callback `(node) => boolean \| FocusOptions` | `setReturnFocus` element/fn | `restoreFocus` accepts `FocusTarget` | ✅ Parity |
| Proximity fallback | `captureFocusRestore` walks siblings | Not built-in | Proximity restore (lifted from focus-lock) | ✅ Parity |
| Async return (animation gate) | Microtask defer | `checkCanReturnFocus` Promise | Waits for Presence exit completion | ✅ Exceeds |
| `preventScroll` on restore | Via `FocusOptions` | `preventScroll: true` | Via FocusOptions | ✅ Parity |

### 4.5 Nesting & Stacking

| Feature | react-focus-lock | focus-trap-react | Reference UI | Status |
| :--- | :--- | :--- | :--- | :---: |
| Nested lock stacking | "Last trap wins" (implicit) | Explicit `trapStack` with pause/unpause | Stack pause aligned with Overlay layer stack | ✅ Implemented |
| Lifecycle callbacks | `onActivation` / `onDeactivation` | Full lifecycle (`onActivate` thru `onPostDeactivate`) | Overlay lifecycle hooks | ✅ Parity |

### 4.6 Edge Cases

| Feature | react-focus-lock | focus-trap-react | Reference UI | Status |
| :--- | :--- | :--- | :--- | :---: |
| Shadow DOM traversal | `shadowRoot` + `contains` checks | `tabbable` Shadow DOM v1 support | Lifted from `tabbable` | ✅ Specced |
| `composedPath` for events | Partial | `composedPath()` on events | Lifted | ✅ Specced |
| Iframe support | `crossFrame` prop | Separate `document` option | Same-document only (by design) | ⚪ By design |
| Empty container handling | Console warning, no action | Throws unless `fallbackFocus` | Container as fallback | ✅ Parity |
| Android TalkBack workaround | Not handled | Not handled | Not yet (React Aria has one) | 🟡 Gap |
| Screen reader isolation (`inert`) | Not built-in (delegates to `react-focus-on`) | `isolateSubtrees: 'inert' \| 'aria-hidden'` | Overlay owns `inert` on siblings | ✅ Parity |

### 4.7 Utility Components

| react-focus-lock | Reference UI Equivalent | Status |
| :--- | :--- | :---: |
| `<AutoFocusInside>` | `initialFocus` ref/fn on FocusLock | ✅ Different approach |
| `<MoveFocusInside>` | `initialFocus` ref/fn | ✅ Different approach |
| `<FreeFocusInside>` | Not planned | ⚪ By design |
| `<InFocusGuard>` | Not needed (no guards) | ⚪ N/A |
| `useFocusInside(ref)` | Not exposed | ⚪ Internal |
| `useFocusScope()` | Not exposed (RovingFocus owns navigation) | ⚪ By design |
| `useFocusState()` | Not exposed | ⚪ Internal |

---

## 5. Gaps Summary — What's Left to Build

### 🔴 Critical (blocks production readiness)

| Gap | Component | Spec'd? | Notes |
| :--- | :--- | :---: | :--- |
| Edge/sheet drag gestures | Overlay | ✅ Yes | Handle-only drag, velocity threshold, 25% distance — ported from Vaul |
| iOS body scroll lock | Overlay | ✅ Yes | `visualViewport` + touch-move prevention — from React Aria |
| Inert background (full) | Overlay | ✅ Yes | Sibling-walk + refcount + live-region exceptions |
| Hierarchical dismiss cascade | Overlay | ✅ Yes | Parent close cascades to nested, focus-race guard |
| Hover grace polygon | Popover | ✅ Yes | Safe-area polygon from trigger to content |
| Collision flip & shift (E2E proof) | Popover | ✅ Yes | Engine exists, needs browser E2E proof |
| Shard integration E2E | FocusLock | ✅ Yes | Shards exist, needs portalled popover proof |
| Proximity restore E2E | FocusLock | ✅ Yes | Algorithm exists, needs trigger-deleted proof |

### 🟠 Architecture / Tech Debt

| Gap | Component | Spec'd? | Notes |
| :--- | :--- | :---: | :--- |
| Decouple subsystems from `ReferenceLibrary` | ReferenceLibrary | 🟡 No | `ReferenceLibrary.tsx` is currently a kitchen sink managing Toast, Tooltip warmup, and Announcer state. Extract `ToastHost`, `ToastItemWrapper`, and stores into their respective components (e.g. `Toast.tsx`). |

### 🟡 Important (enhances parity with best libraries)

| Gap | Component | Inspiration | Notes |
| :--- | :--- | :--- | :--- |
| Swipe-to-dismiss on toasts | Toast | Sonner | Pointer events, velocity + distance |
| Expand-on-hover stack | Toast | Sonner | Dynamic height measurement, cumulative offset |
| `onAutoClose` callback | Toast | Sonner | Notify when timer expires vs manual dismiss |
| `dismissible` per-toast toggle | Toast | Sonner | Prevent swipe/close-button on specific toasts |
| Hotkey to focus toaster | Toast | Sonner | `Alt+T` or configurable shortcut |
| Pause timers on tab hidden | Toast | Sonner | `document.visibilitychange` |
| Android TalkBack workaround | FocusLock | React Aria | Skip aggressive reclaim on virtual modality |

### ⚪ Not Planned (deliberate omissions)

| Feature | Why | Library that has it |
| :--- | :--- | :--- |
| `toast.success/error/warning/info` | Apps model lifecycle via definitions, not built-in chrome | Sonner |
| `toast.promise()` with `.unwrap()` | Use `toast.update()` with definition swapping | Sonner |
| `FocusLock` wrapper `div` / `as` prop | Slots onto child, no DOM injection | react-focus-lock |
| FocusLock `group` / `whiteList` / sidecar | Complexity without clear value | react-focus-lock |
| `FreeFocusInside` / `InFocusGuard` | No guard DOM means no guard utilities needed | react-focus-lock |
| Cross-frame focus trapping | Each document owns its own lock | react-focus-lock |
| `positionTransform` custom offsets | Use standard `offset` prop | react-tiny-popover |
| Snap points / scale-behind | Drawer composition territory, not kernel | Vaul |

---

## 6. Testing Proof Status

| Component | Contract Cases | Automated E2E | Ratio | Priority |
| :--- | :---: | :---: | :---: | :--- |
| **Overlay** | 132 | 7 | 5% | 🔴 Highest |
| **Popover** | 95 | 4 | 4% | 🔴 High |
| **Tooltip** | ~60 | ~3 | 5% | 🟡 Medium |
| **Toast** | ~80 | ~5 | 6% | 🟡 Medium |
| **FocusLock** | 72 | 5 | 7% | 🔴 High |

> [!IMPORTANT]
> The engines and APIs are built. The gap is **proof**: browser E2E tests that
> exercise the behavioral contracts documented in each component's `TESTS.md`.
> All matrix tests run via `pnpm pipeline test --packages=@matrix/lib`.

---

## 7. Vendor Inspiration Map

What we lift from each library and where it lands in Reference UI.

### react-tiny-popover → Overlay positioning
- **Lift:** Collision iteration model, boundary inset concept, scout offset calibration
- **Already exceeds:** 12 placements, `autoUpdate`, virtual anchors, size middleware, hide detection, Presence exit animations

### Sonner → Toast runtime
- **Lift:** Swipe-to-dismiss gesture physics, expand-on-hover stack mechanics, `visibilitychange` pause, hotkey focus
- **Already matches:** Identity/update/dismiss-all, imperative API decoupled from React tree, remaining-time pause, replay-on-subscribe, FIFO queue
- **Deliberate divergence:** No built-in semantic variants — apps own rendering via `toast.define()`

### react-focus-lock → FocusLock
- **Lift:** `shards` concept (under Radix `branches` semantics), proximity restore algorithm (`captureFocusRestore`)
- **Already matches:** Tab cycling, initial focus resolution, nested stack coordination
- **Deliberate divergence:** No wrapper div, no guard sentinels, `initialFocus={false}` skips (doesn't blur to body)

### focus-trap-react → FocusLock
- **Lift:** `initialFocus: false` = don't move focus, `checkCanReturnFocus` async gate concept
- **Already matches:** Stack pause/unpause, `preventScroll` support
- **Deliberate divergence:** No `escapeDeactivates` (Overlay owns Escape), no `clickOutsideDeactivates` (Overlay owns dismiss)

### Radix Primitives → Overlay layer stack
- **Lift:** `DismissableLayer` stack model, `FocusScope` branches registry, document-edge guards, deferred outside-press
- **Already matches:** Nested dismiss ordering, portalled branch awareness, Presence integration

### Vaul → Overlay edge gestures
- **Lift:** Handle-only drag, velocity threshold, iOS `position: fixed` + scroll restore
- **Leave:** Snap points, scale-behind, fade-from-index, drag-anywhere

### React Aria → Scroll lock + edge cases
- **Lift:** iOS `preventScrollMobileWebKit`, `visualViewport` handling, Android TalkBack virtual modality detection
- **Leave:** `FocusScope` (we have our own), `useOverlayTrigger` (we have Overlay.Trigger)

---

## 8. Execution Priority

```
Phase 1: Architecture Refactor                ← CURRENT
  - Extract Toast store, ToastHost, and PositionStack from ReferenceLibrary to Toast component
  - Extract Tooltip warmup state from ReferenceLibrary to Tooltip component
  - Extract Announcer (Live Regions) to separate utility
  - Keep ReferenceLibrary as a clean composing shell

Phase 2: Overlay E2E Proof
  - Edge drag gestures (OV-EDGE-01..04)
  - Nested dismiss stack (OV-STACK-01)
  - Scroll lock (OV-SCROLL-01)
  - Inert background (OV-INERT-01)

Phase 3: FocusLock E2E Proof
  - Shard integration (FL-SHARD-01..02)
  - Nested lock stacking (FL-NEST-01)
  - Proximity restore (FL-RESTORE-*)

Phase 4: Popover E2E Proof
  - Hover grace polygon (PO-HOVER-01..02)
  - Collision flip/shift (PO-COLL-01)
  - Arrow tracking (PO-ARROW-01)

Phase 5: Toast Enhancements
  - Swipe-to-dismiss
  - Expand-on-hover
  - Hotkey focus
  - Tab-hidden pause

Phase 6: Tooltip E2E Proof
  - Skip-delay group
  - Scroll-close
  - WCAG 1.4.13 compliance
```

---

*Last updated: 2026-09-07. Source specs: [Overlay.md](src/components/Overlay/Overlay.md) · [Popover.md](src/components/Popover/Popover.md) · [Tooltip.md](src/components/Tooltip/Tooltip.md) · [Toast.md](src/components/Toast/Toast.md) · [FocusLock.md](src/components/FocusLock/FocusLock.md)*
