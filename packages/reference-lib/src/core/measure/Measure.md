# Measure

`useMeasure` is a **ref hook**, not a host component. There is no
`<Measure>` wrapper and no extra DOM node. Attach the returned `ref` to an
element you already own.

```tsx
const { ref, rect, isSettled } = useMeasure<HTMLDivElement>()

<Div ref={ref}>
  {isSettled ? `${rect.width}×${rect.height}` : '…'}
</Div>
```

This lives in `src/core/measure`, next to the frame scheduler, settle window,
and sleeping poll Overlay uses. It is not a 25th inventory component, and it
is not `core/hooks` (Zustand adapters).

This exists so agents do not invent ResizeObserver + rAF polling +
`getBoundingClientRect` on every frame. Resizable taught the expensive
lessons: intermediate layout on a slow machine is not a size, and a 60fps
rect chase is not measurement.

## What it is

- **Layout box** after content/CSS stop changing (`width` / `height` /
  `top` / `left` from `getBoundingClientRect`).
- **Settled** after a 20ms quiet window (`MEASUREMENT_SETTLE_TIMEOUT_MS`).
- **Paused** during drag or animation: last rect kept, `isSettled` false,
  observer off.

## What it is not

- Not a JSX primitive. RovingFocus slots onto a child; Measure does not even
  do that. The host stays yours.
- Not Overlay living position. Scroll/transform follow is Overlay
  `autoUpdate`. `top` / `left` here are the last sampled layout, not a
  scroll-tracking viewport position.
- Not Splitter's drag loop. Splitter must not poll with rAF (`SP-PERF-05`).
  Pass `paused` while a pointer is down if you measure a panel Splitter is
  resizing.
- Not `vendor/design-system/resizable` `useRealtimeUpdate`. That always-on
  RAF handle chase is leave.

## Adaptive split (vendor `useBoundingClientRect`)

Resizable switched modes with `isAnimating`:

| Mode | Vendor | Here |
| :--- | :--- | :--- |
| Idle | `useLayoutUpdate`: ResizeObserver + window scroll/resize + layout `transitionend`, collapsed with `useEventEnd` (one rAF per frame, 80ms debounce) | `useMeasure`: ResizeObserver + 20ms settle. Zero rAF. Overlay `autoUpdate` owns scroll/resize for living position, synchronously, because an 80ms debounce would lag the layer. |
| Hot | `useRealtimeUpdate`: rAF every frame while `isActive`, `setState` of the rect, no sleep | `createDirtyPoll`: measure each frame, `onChange` only when the rect moves past 0.1px, sleep after `MAX_IDLE_FRAMES`. Overlay opts in with `animationFrame`. Splitter must not. |
| Settle | `useMeasureSettled` 20ms quiet window, disabled while animating | `createMeasureSettled` + `paused`. Intermediate widths on a slow machine are not a size. |
| Exclusive | idle listeners off while hot, and the reverse | `paused` disconnects the observer. `animationFrame` does not ResizeObserver the reference (Floating UI). |

Lift settle, pause, epsilon, exclusive idle vs hot, and event-driven default.
Leave the wrapper `<Measure>` / `react-use` `useMeasure` host and the always-on
`useRealtimeUpdate` chase.

## Contract

| Field | Meaning |
| :--- | :--- |
| `ref` | Callback ref. Observe this node. |
| `rect` | Border box, or `null` until the first sample (including SSR). |
| `isSettled` | True only after the quiet window with no differing sample. |
| `paused` | Disconnects observation. Use during animation/drag. |
| `target` | Optional existing `RefObject` if you already own the node. |
| `settleTimeoutMs` | Quiet window. Default 20. |

Zero rAF loop. ResizeObserver with `{ box: 'border-box' }` (content-box
fallback if the engine rejects the option). Sub-pixel jitter (`0.1px`)
does not reset settle. A sleeping poll that is not currently awake holds
**zero** pending animation frames and does not call `getBoundingClientRect`.

`target` is re-read after every commit. A node that appears on a later render
of the same hook owner still attaches. Callback `ref` is the canonical
attach when you can put it on the host.
