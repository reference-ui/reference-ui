# Measure SPEC

Frozen contract, cases, and proof for the `src/core/measure` kernel and its
public `useMeasure` hook. Design narrative: [Measure.md](./Measure.md).
Case catalog (checklist form): [TESTS.md](./TESTS.md).

Unit proof: `src/core/measure/measure.test.ts` · `use-measure.test.tsx` ·
`use-measure-ssr.test.tsx`
Tracking-seam proof: `src/components/Overlay/geometry/auto-update.test.ts`
Browser proof: `matrix/lib/tests/e2e/measure.spec.ts`
Fixture: `matrix/lib/src/measure.tsx` · Page: `/measure`
Book: `src/core/measure/Measure.book.tsx`

---

## Measure is two faces of one kernel

`useMeasure` is the **width** face — the settled layout box of an element you
own. But the kernel underneath is also the **tracking** face — the living
geometry Overlay follows while a layer is open. Both faces read the same rect,
dedupe with the same epsilon, and share one frame scheduler. They differ in
*when* they read and *when* they stop.

| Primitive | Face | Role | Consumer |
| :--- | :--- | :--- | :--- |
| `readClientRect` / `snapshotRects` | both | Copy a plain box out of a live `DOMRect`; skip nulls, keep order | `useMeasure`, poll, `observeMove` |
| `rectsDiffer` / `RECT_JITTER_EPSILON` | both | Did the box move past `0.1px`? | settle, poll, `observeMove` |
| `createMeasureSettled` | **measurement** | Mark a box authoritative only after a `20ms` quiet window | `useMeasure` |
| `observeElementResize` / `RESIZE_OBSERVER_BOX` | **measurement** | Observe `{ box: 'border-box' }`, content-box fallback | `useMeasure` |
| `useMeasure` | **measurement** | Public ref hook: settled border box, no host node | applications |
| `createFrameScheduler` | **tracking** | At most one pending rAF; each request cancels the last | poll, Overlay |
| `createDirtyPoll` | **tracking** | Sleeping rAF poll: `onChange` only on real motion, sleep after idle | Overlay `autoUpdate` (`animationFrame`) |
| `isLayoutProperty` / `LAYOUT_PROPERTIES` | **tracking** | Which `transition`/`animation` names move layout vs paint | Overlay wake filter |

**The rule that separates them:** measurement stops (settles, sleeps, holds
zero frames) the instant the box is stable. Tracking stops the instant motion
ends *and* nobody woke it. Neither face ever runs an always-on rAF loop — that
is the `vendor useRealtimeUpdate` anti-pattern we deliberately leave behind.

### Why they are not the same read

ResizeObserver reports the **untransformed layout border box**.
`getBoundingClientRect` reports the **visually transformed box**. A
`transform: scale()` moves `getBoundingClientRect` but never fires
ResizeObserver. So:

- **Measurement** (`useMeasure`) is RO-driven. It answers *"what size did
  layout give this element?"* Transform-driven visual change is not a
  measurement and must not churn `rect` or reset `isSettled`.
- **Tracking** (poll / `autoUpdate`) is `getBoundingClientRect`-driven. It
  answers *"where is this element on screen right now?"* Transform motion is
  exactly what it must follow.

This divergence is the reason the kernel is split, not one hook.

---

## Freeze

Frozen decisions. Changing any of these is a breaking change and needs a new
case, not a silent edit.

1. **Border box.** `useMeasure` observes `{ box: 'border-box' }` so the
   published `width`/`height` match `getBoundingClientRect`. Engines that
   reject the option fall back to a content-box observe; the box then tracks
   content-box, and that is documented, not silently wrong.
2. **Settled, not live.** `rect` is published on the first sample with
   `isSettled=false`, and becomes settled only after
   `MEASUREMENT_SETTLE_TIMEOUT_MS` (`20ms`) with no differing sample.
   Intermediate widths on a slow machine are not a size.
3. **Epsilon `0.1px`.** Sub-pixel jitter (DPR zoom, fractional layout) never
   resets settle, never wakes the poll, and never publishes a new `rect`
   identity.
4. **Zero rAF while idle.** The default measurement path is ResizeObserver +
   timeout. No `requestAnimationFrame`. A settled hook and a sleeping poll
   both hold **zero** pending frames and issue **zero** `getBoundingClientRect`
   reads until something changes.
5. **No `80ms` living-position debounce.** `vendor useEventEnd` debounces
   scroll/resize by `80ms`; Overlay living position cannot lag that far, so we
   lift only the rAF-collapse half (`createFrameScheduler`) and update
   synchronously.
6. **No host node.** `useMeasure` returns a callback `ref`. There is no
   `<Measure>` wrapper and no extra DOM. This is not a JSX primitive and not
   the `react-use` `useMeasure` wrapper.
7. **Exclusive idle vs hot.** `paused` disconnects the observer entirely. The
   `animationFrame` tracking poll does **not** ResizeObserver the reference
   (Floating UI). The two modes never run at once.
8. **Position writes never wake the poll.** The tracking poll snapshots the
   *reference* (and boundary), never the floating element, because writing the
   floating element's `left`/`top` every frame would always "differ" and the
   poll could never sleep.
9. **SSR-null.** With no `ResizeObserver`, `setTimeout`, or
   `requestAnimationFrame`, every primitive is inert and `rect` is `null`,
   `isSettled` is `false`. No global access at import or first render.

---

## Legend

- `[x]` — a test asserts the prose at the production bar (not just the ID).
- `[ ]` — specified; not yet proven. The engine may already exist in source.
- `[reference]` original Reference UI contract · `[vendor]` ported from
  `vendor/design-system/resizable` · `[floating-ui]` ported from Floating UI
  `autoUpdate` / `observeMove`.
- `[unit]` jsdom/happy-dom · `[ssr]` `renderToString` · `[browser]` real
  ResizeObserver in Playwright · `[react:all]` React 17/18/19 + StrictMode.

---

## Source evidence

- `vendor/design-system/resizable/shared/useBoundingClientRect/`
  - `useBoundingClientRect.ts` — the adaptive `isAnimating` switch we split.
  - `useRealtimeUpdate.ts` — always-on 60fps rAF, `!==` compare incl.
    `right`/`bottom`, never sleeps. **Anti-pattern; left behind.**
  - `useLayoutUpdate.ts` — RO + window scroll/resize + filtered
    `transitionend`, collapsed by `useEventEnd`. Idle source of truth.
  - `useMeasureSettled.ts` / `.spec.ts` — the `20ms` quiet window, resets on
    change, ignores `right`/`bottom`/`x`/`y`, disabled while animating.
  - `useEventEnd.ts` / `.spec.ts` — one rAF pending, cancels the previous,
    `80ms` debounce, cleanup on unmount.
- Floating UI `autoUpdate.ts` (`observeMove`, reference-resize reobserve
  dance / issue #1740), `observe-dom` (samthor.au IntersectionObserver trick).

---

## Adaptive split (what we lift, what we leave)

| Mode | Vendor | Here | Owned by |
| :--- | :--- | :--- | :--- |
| Idle | `useLayoutUpdate`: RO + window scroll/resize + `transitionend`, `useEventEnd` (1 rAF/frame, `80ms` debounce) | `useMeasure`: RO + `20ms` settle, zero rAF. Overlay owns scroll/resize for living position, synchronously | measurement / Overlay |
| Hot | `useRealtimeUpdate`: rAF every frame while active, `setState` per rect, no sleep | `createDirtyPoll`: measure per frame, `onChange` only past `0.1px`, sleep after `MAX_IDLE_FRAMES` | tracking |
| Settle | `useMeasureSettled`: `20ms` quiet window, off while animating | `createMeasureSettled` + `paused` | measurement |
| Collapse | `useEventEnd`: rAF-collapse **+ `80ms` debounce** | `createFrameScheduler`: rAF-collapse **only** | tracking |
| Exclusive | idle listeners off while hot, and the reverse | `paused` disconnects RO; `animationFrame` does not RO the reference | both |

Lift: settle, pause, epsilon, exclusive idle/hot, rAF-collapse, event-driven
default. Leave: the wrapper `<Measure>` / `react-use` host, the always-on
`useRealtimeUpdate` chase, and the `80ms` living-position debounce.

---

## Sharp edges (the nasty cases — cover them, do not skip)

These are the real-world traps. Each maps to a case ID below.

| Sharp edge | Why it bites | Case |
| :--- | :--- | :--- |
| `transform: scale()` moves `getBoundingClientRect` but not RO | Measurement must not churn on visual-only transform; tracking must follow it | `MS-SCALE-01` |
| RO callback writes layout that resizes the observed element | Infinite RO feedback / "loop completed with undelivered notifications" | `MS-LOOP-01` |
| Element lives in an iframe / foreign `Document` | Global `ResizeObserver` and coordinates belong to the wrong window | `MS-DOC-01` |
| `display:none` / detached element | `getBoundingClientRect` is all-zero; must publish zero box and re-measure on reappear, not settle a phantom | `MS-HIDDEN-01` |
| Tab backgrounded (`document.hidden`) | rAF throttles; poll must pause explicitly, not spin | `MS-TRACK-07` |
| SVG / non-HTML element | `{ box: 'border-box' }` is rejected by some engines | `MS-BOX-02` |
| DPR / browser-zoom fractional jitter | Fractional `gBCR` deltas thrash settle and poll | `MS-SETTLE-01`, `MS-PERF-03` |
| StrictMode / React 17–19 double-invoke | Two observers, double cleanup, leaked timers | `MS-ENV-01` |
| `onChange` throws inside a poll tick | A leaked pending frame keeps CPU hot forever | `MS-THROW-01` |
| Floating `left`/`top` rewritten every frame | Poll can never sleep if it watches its own output | `MS-TRACK-06` |
| `target` appears on a later commit | A node not present at mount never attaches | `MS-TARGET-02` |
| `settleTimeoutMs` / element identity changes mid-life | Stale observer / stale timer | `MS-SETTLE-01`, `MS-REF-01` |

---

## Cases

### Hook — measurement face

- [x] `MS-REF-01` `[reference]` `[unit]` —
  **`useMeasure` observes the authored element and adds no wrapper node.**
  Attach `ref` to a `div[data-host]`. Assert the React container has that one
  child and the ResizeObserver's only target is it. Re-reads `target`/`node`
  after every commit; when neither element nor `settleTimeoutMs` changed, the
  session is reused with no reconnect.
- [x] `MS-SETTLE-01` `[reference]` `[unit]` —
  **`useMeasure` treats layout as unsettled until the quiet window.**
  First sample publishes width/height with `isSettled=false`; after
  `MEASUREMENT_SETTLE_TIMEOUT_MS` with no differing sample it is `true`. A
  later real size change resets it; sub-epsilon jitter (`120.04`) does not.
- [x] `MS-PAUSE-01` `[reference]` `[unit]` —
  **`useMeasure` does not observe while paused and never starts a rAF loop.**
  Render `paused`: no RO targets, `requestAnimationFrame` uncalled. Unpausing
  observes. Spy rAF across mount.
- [x] `MS-PAUSE-02` `[reference]` `[unit]` —
  **`useMeasure` keeps the last rect while paused.**
  Settle a box, then pause. `rect` is unchanged and `isSettled` is `false`.
  Resume re-observes.
- [x] `MS-TARGET-01` `[reference]` `[unit]` —
  **`useMeasure` observes `target.current` when no callback ref attached.**
  Pass an already-filled `RefObject`. RO's target is that node and the
  authored host is still the only child.
- [x] `MS-TARGET-02` `[reference]` `[unit]` —
  **`useMeasure` observes a `target` that appears on a later commit.**
  Mount with the host omitted, then render it onto the same `RefObject`. RO
  attaches to that node on the later commit.
- [x] `MS-BOX-01` `[reference]` `[unit]` —
  **`useMeasure` observes `{ box: 'border-box' }`.**
  The mock `observe` call options equal `{ box: 'border-box' }`.
- [x] `MS-UNMOUNT-01` `[reference]` `[unit]` —
  **`useMeasure` disconnects on unmount.**
  The observer's observed set is empty after unmount; the settle timer is
  disposed.
- [x] `MS-SSR-01` `[reference]` `[ssr]` —
  **`useMeasure` server-renders the authored host with a null box.**
  `renderToString` a host that uses the hook: one `div`, `rect === null`,
  `isSettled` false, no extra markup.

### Kernel — settle

- [x] `MS-SETTLE-02` `[vendor]` `[unit]` —
  **`createMeasureSettled` ignores identical samples and settles on the
  original timer.** Sample, advance just under the timeout, sample the same
  rect, advance the remainder: `onSettled` fires once, `settled` is `true`.
- [x] `MS-SETTLE-03` `[reference]` `[unit]` —
  **`createMeasureSettled` does not settle without a clock (SSR).**
  Construct with `clock: null`, sample: `settled` stays `false`.
- [x] `MS-SETTLE-04` `[reference]` `[unit]` —
  **`createMeasureSettled.reset` clears a pending settle so a later sample can
  settle again.** After `reset`, advancing the timeout does not settle; a new
  differing sample settles normally. `dispose` cancels a pending callback.

### Kernel — rects

- [x] `MS-RECT-01` `[reference]` `[unit]` —
  **`readClientRect` / `snapshotRects` copy plain boxes and skip null
  targets.** The snapshot is a plain object, not the live `DOMRect` (mutating
  the source afterward does not change it); null/undefined entries are omitted
  without reordering the rest.
- [x] `MS-RECT-02` `[reference]` `[unit]` —
  **`rectsDiffer` treats a missing previous as a change and honors epsilon.**
  `null` previous → `true`; a `RECT_JITTER_EPSILON/2` move → `false`; a `1px`
  move or a width change → `true`.

### Kernel — frame scheduler (tracking)

- [x] `MS-FRAME-01` `[vendor]` `[unit]` —
  **`createFrameScheduler` collapses N requests in one turn to one callback.**
  Schedule N before flush: one pending frame, only the latest callback runs.
  This is the rAF half of `useEventEnd` without the `80ms` lag.
- [x] `MS-FRAME-02` `[reference]` `[unit]` —
  **`createFrameScheduler` cancels cleanly, re-arms after flush, and is SSR
  inert.** `cancel` stops the pending callback and a second `cancel` is a
  no-op; it re-arms after a flush; with `clock: null` nothing fires or throws.

### Kernel — layout-property filter (tracking)

- [x] `MS-LAYOUT-01` `[reference]` `[unit]` —
  **`isLayoutProperty` accepts geometry names and rejects paint-only names.**
  `width`, `transform`, `margin-left`, `scale`, `flex-basis`, `gap` → `true`;
  `opacity`, `color`, `background-color`, `''` → `false`. Longhand
  `margin*`/`padding*`/`inset*` prefixes are accepted.

### Kernel — sleeping poll (tracking)

- [x] `MS-POLL-01` `[reference]` `[unit]` —
  **`createDirtyPoll.stop` from inside `onChange` does not leak a pending
  frame.** Wake, move, `stop()` inside `onChange`: `running` is `false` and
  the frame clock is empty.
- [x] `MS-POLL-02` `[reference]` `[unit]` —
  **`createDirtyPoll.wake` is idempotent while running and restarts after
  sleep.** Repeated `wake` keeps a single pending frame; after sleeping, a
  later `wake` starts a fresh run; `stop` halts it.
- [x] `MS-POLL-03` `[reference]` `[unit]` —
  **`createDirtyPoll` pauses immediately when `isHidden` returns true.**
  Wake, flip `isHidden` to `true`, flush: `running` is `false`, clock empty.
- [x] `MS-POLL-04` `[reference]` `[unit]` —
  **`createDirtyPoll` is inert without a clock (SSR).**
  `wake`/`stop` with `clock: null` neither throws nor runs.
- [x] `MS-THROW-01` `[reference]` `[unit]` —
  **`createDirtyPoll` releases its pending frame even if `onChange` throws.**
  Wake and move so `onChange` throws once. Assert no frame is left pending
  (the poll is not wedged hot); the throw propagates but the scheduler is
  clean. A hot poll that survives a thrown consumer callback is a silent CPU
  leak.

### Tracking face — poll consumed by Overlay `autoUpdate`

Proof lives in `Overlay/geometry/auto-update.test.ts`. These prove the kernel
under its real tracking consumer; do not duplicate the harness here.

- [x] `MS-TRACK-01` `[floating-ui]` `[unit]` —
  **The `animationFrame` poll attaches no window `pointermove`/`touchmove` and
  cancels on teardown.** Enabling `animationFrame` adds neither listener and
  leaves exactly one pending frame; cleanup drains it so a later flush is a
  no-op.
- [x] `MS-TRACK-02` `[reference]` `[unit]` —
  **The poll sleeps after `MAX_IDLE_FRAMES` and wakes on a related
  `animationstart`.** Flushing idles out in exactly `MAX_IDLE_FRAMES` steps
  with no update; an `animationstart` from the reference re-arms one frame.
- [x] `MS-TRACK-03` `[reference]` `[unit]` —
  **The poll does not wake on a paint-only transition.**
  A `transitionstart` with `propertyName: 'opacity'` leaves it asleep; one
  with `'transform'` re-arms a frame (`isLayoutProperty`).
- [x] `MS-TRACK-04` `[floating-ui]` `[unit]` —
  **The poll does not ResizeObserver the reference when `animationFrame` is
  on.** The RO observes the floating element but not the reference (exclusive
  hot mode).
- [x] `MS-TRACK-05` `[floating-ui]` `[unit]` —
  **Event-driven tracking unobserves floating for one frame when the reference
  resizes (Floating UI #1740).** On a reference-target RO entry, floating is
  unobserved, `update` runs once, one frame is scheduled, and floating is
  re-observed after the flush — no RO feedback loop.
- [x] `MS-TRACK-06` `[reference]` `[unit]` —
  **The poll snapshots the reference (and boundary), never the floating
  element, so position writes cannot keep it awake.** Drive `update` to
  rewrite the floating element's `left`/`top` every frame while the reference
  is still. Assert the poll still idles out in `MAX_IDLE_FRAMES` and sleeps.
  This is the freeze rule that a self-watching poll would violate.
- [x] `MS-TRACK-07` `[reference]` `[unit]` —
  **The poll wake is gated on `document.hidden`.**
  With `doc.hidden` true, a wake trigger (`animationstart`/`visibilitychange`)
  does not arm a frame; flipping visible re-arms once.

### Tracking face — layout-shift observer (`observeMove`)

`observeMove` (Overlay `geometry/observe-move.ts`) is the third tracking
primitive: an IntersectionObserver layout-shift detector, not a rAF loop. It
consumes `readClientRect` + `rectsDiffer`.

- [x] `MS-MOVE-01` `[floating-ui]` `[unit]` —
  **`observeMove` fires `onMove` on layout shift and bails on a zero-size
  box.** A `0×0` element registers no observer and never fires; a moved box
  (past `0.5px`) refreshes and calls `onMove`; teardown disconnects the
  observer and clears the pending offscreen timeout. Not a rAF loop.

### CPU budgets

Call-count contracts, not wall-clock benches. They encode `useBoundingClient-
Rect`: idle is event-driven, hot work sleeps, settle does not thrash React.

- [x] `MS-PERF-01` `[reference]` `[unit]` —
  **`createDirtyPoll` holds zero frames and zero `measure()` calls after it
  sleeps.** Wake (`1` sample), idle out (`+idleFrames` samples), then flush
  many extra ticks: `running` false, clock empty, `measure` uncalled again.
- [x] `MS-PERF-02` `[reference]` `[unit]` —
  **`createDirtyPoll` keeps a single pending frame under wake spam.**
  Many `wake` calls in one turn and mid-run keep the clock size at `1`.
- [x] `MS-PERF-03` `[vendor]` `[unit]` —
  **`createDirtyPoll` ignores sub-epsilon jitter and still sleeps.**
  After a real move, feed `< RECT_JITTER_EPSILON` deltas past `idleFrames`
  ticks: `onChange` stays at one call and the poll sleeps.
  `useRealtimeUpdate` compared with `!==` and never slept.
- [x] `MS-PERF-04` `[vendor]` `[unit]` —
  **`createMeasureSettled` fires `onSettled` once across a slow-machine ramp.**
  Sample 20 increasing widths under the timeout each time, then wait one full
  timeout: a single `onSettled`. Ports `useMeasureSettled.spec` "prevents
  excessive updates / thrashing".
- [x] `MS-PERF-05` `[vendor]` `[unit]` —
  **`createFrameScheduler` collapses a burst to one callback.**
  (Alias of `MS-FRAME-01`; kept in the budget group for the vendor mapping of
  100 scroll events → one frame, minus the `80ms` living-position lag.)
- [x] `MS-PERF-06` `[reference]` `[unit]` —
  **`useMeasure` does not publish a new rect identity for sub-epsilon
  jitter.** After settle, a `0.04px` RO fire keeps the same `rect` reference;
  a `10px` change publishes a new object and resets settle.
- [x] `MS-PERF-07` `[reference]` `[unit]` —
  **`createDirtyPoll.wake` samples once for a baseline, then once per awake
  frame.** `measure` count is `1 + N` across wake + N flushes, and `onChange`
  is not called for the baseline sample.

### Browser proofs (real ResizeObserver)

- [x] `MS-DOM-01` `[reference]` `[browser]` —
  **`useMeasure` publishes the authored host border box with no wrapper
  node.** `data-width` equals rounded `getBoundingClientRect().width` (`100`).
- [x] `MS-BOX-B-01` `[reference]` `[browser]` —
  **A padding-only change updates the published width (border box).**
  `box-sizing: content-box`, width `100`, then padding `20`: `data-width`
  becomes `140`. A content-box observation would stay `100`. *(Renamed from
  the old browser `MS-BOX-01` to end the collision with the unit case.)*
- [x] `MS-SETTLE-B-01` `[reference]` `[browser]` —
  **A width change resets settle then settles again.**
  Toggle `100 → 200`: `data-settled` is `yes` at `200`.
- [x] `MS-PAUSE-B-01` `[reference]` `[browser]` —
  **Paused keeps the last width through a size change.**
  Pause, toggle width: `data-width` stays `100`, `data-settled` stays `no`.
- [x] `MS-PERF-B-01` `[reference]` `[browser]` —
  **`useMeasure` does not read layout while idle after settle.**
  Spy `getBoundingClientRect` after settle, wait `120ms`: zero reads. A real
  resize reads.

### Resilience / sharp edges

- [x] `MS-SCALE-01` `[reference]` `[browser]` —
  **`useMeasure` reports the layout border box and does not churn on a
  transform-only change.** Settle a box, then apply `transform: scale(1.5)`.
  Assert `rect.width` stays the layout width (RO does not fire) and
  `isSettled` stays `true`, while `getBoundingClientRect().width` visibly
  differs. This freezes the measurement/tracking boundary: transform is
  tracking (poll / `autoUpdate`), not measurement.
- [x] `MS-LOOP-01` `[reference]` `[browser]` —
  **`useMeasure` does not feed a ResizeObserver loop when its own `rect`
  drives layout.** Wire a consumer that sizes the observed element from
  `rect` (e.g. clamps its own width). Assert it converges to a stable box
  within a bounded number of RO callbacks and emits no "ResizeObserver loop"
  error — the epsilon dedupe and the stable-identity `rect` (`MS-PERF-06`)
  break the feedback.
- [x] `MS-DOC-01` `[reference]` `[browser]` —
  **`useMeasure` observes an element in a foreign `Document` with that
  document's `ResizeObserver`.** Attach the host inside a same-origin iframe.
  Assert observation uses `element.ownerDocument.defaultView.ResizeObserver`
  (`resizeObserverFor`) and the published box uses that document's viewport
  coordinates, not the top window's.
- [x] `MS-HIDDEN-01` `[reference]` `[browser]` —
  **`useMeasure` publishes a zero box for a detached/`display:none` element
  and re-measures on reappear.** Toggle the host to `display:none`, then back.
  Assert the box goes `0×0` and `isSettled` re-settles at zero, then a real
  box is published and re-settles when it reappears. No phantom settle at a
  stale size.
- [x] `MS-ENV-01` `[reference]` `[react:all]` —
  **`useMeasure` runs one observer and one cleanup under StrictMode and React
  17/18/19.** Mount the same fixture across versions with StrictMode replay.
  Assert exactly one live ResizeObserver per element, one settle timer, and
  one disconnect on unmount — no leaked observer or double-fired settle.
  Unit proof is StrictMode observer/timer count; `[react:all]` native proof
  is the matrix runner axis (the `/measure` fixture is already StrictMode-wrapped).

---

## Contract (public surface)

| Field | Meaning |
| :--- | :--- |
| `ref` | Stable callback ref (`useCallback([])`). Attach to the node to measure. Composable. |
| `rect` | Border box `{ width, height, top, left }`, or `null` until the first sample (including SSR). |
| `isSettled` | `true` only after the quiet window with no differing sample. |
| `paused` | Disconnects observation; keeps the last rect; `isSettled` false. Use during drag/animation. |
| `target` | Optional existing `RefObject` when you already own the node. Re-read every commit. Callback `ref` wins when both resolve. |
| `settleTimeoutMs` | Quiet window in ms. Default `20`. Changing it recreates the session. |

Kernel exports (`index.ts`): `createMeasureSettled`, `createDirtyPoll`,
`createFrameScheduler`, `observeElementResize`, `resizeObserverFor`,
`rectsDiffer`, `readClientRect`, `snapshotRects`, `isLayoutProperty`, plus
`MEASUREMENT_SETTLE_TIMEOUT_MS`, `MAX_IDLE_FRAMES`, `RECT_JITTER_EPSILON`,
`RESIZE_OBSERVER_BOX`, `LAYOUT_PROPERTIES`.

---

## Out of scope (intentional)

- `top` / `left` in `rect` are the **last layout sample**, not Overlay living
  position. Scroll/transform following is Overlay `autoUpdate`.
- No `<Measure>` wrapper component, no `react-use` host, no public Provider.
- No always-on `useRealtimeUpdate` 60fps chase.
- No `80ms` `useEventEnd` living-position debounce on Overlay scroll.
- Splitter must not use `createDirtyPoll` for its drag loop (`SP-PERF-05`);
  pass `paused` while a pointer is down if measuring a panel it resizes.
- FocusLock candidate geometry stays `getClientRects`, not this hook.
- `visualViewport` / iOS keyboard geometry is Overlay's edge policy, not the
  measure kernel.

---

## Status

| | |
| :--- | :--- |
| Kernel | Shipped — settle, poll, frame scheduler, rects, layout filter, observe. |
| Hook | Shipped — `useMeasure` measurement face proven in unit + browser. |
| Tracking seam | Proven via Overlay `auto-update.test.ts` (`MS-TRACK-01..07`) and `observe-move.test.ts` (`MS-MOVE-01`). |
| Named proven | Hook contract, kernel primitives, CPU budgets, tracking, sharp edges, browser proofs. |
| Next production work | None. Sharp-edge rows are proven. |

### Done when

- Every `[ ]` sharp-edge row above is `[x]` with a prose-level assert.
- The `MS-BOX-01` ID collision is retired (unit keeps `MS-BOX-01`, browser is
  `MS-BOX-B-01`) in `TESTS.md` and the Playwright titles.
- `pnpm agent verify Measure` is green (typecheck → vitest → build → the
  `matrix/lib` Playwright spec).
