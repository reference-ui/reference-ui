# Measure

Settled border-box measurement through a ref hook. `useMeasure` is not
a host component: there is no wrapper and no extra DOM node. Attach
the returned `ref` to an element already owned.

```tsx
const { ref, rect, isSettled } = useMeasure<HTMLDivElement>()

<Div ref={ref}>
  {isSettled ? `${rect.width}×${rect.height}` : '…'}
</Div>
```

A sample counts only after content and CSS stop changing: the layout
box from `getBoundingClientRect`, settled after a 20ms quiet window
(`MEASUREMENT_SETTLE_TIMEOUT_MS`). Sub-pixel jitter (`0.1px`) does not
reset settle. `paused` disconnects observation during drag or
animation — the last rect is kept, `isSettled` goes false, the
observer goes off. There is no per-frame ResizeObserver plus rAF
chase: zero rAF in the idle path, and a sleeping poll holds zero
pending frames and never samples.

## Contract

| Field | Meaning |
| :--- | :--- |
| `ref` | Callback ref. Observe this node; canonical attach. |
| `rect` | Border box, or `null` until the first sample (including SSR). |
| `isSettled` | True only after the quiet window with no differing sample. |
| `paused` | Disconnects observation. Use during animation/drag. |
| `target` | Optional existing ref object when the node is already owned. |
| `settleTimeoutMs` | Quiet window. Default 20. |

Observation is ResizeObserver with `border-box` (content-box fallback
where the engine rejects the option). `target` is re-read after every
commit, so a node appearing on a later render of the same owner still
attaches.

This is layout-box sampling, not living position: scroll and transform
follow belong to the overlay `autoUpdate` path, and drag loops must
not poll with rAF (`SP-PERF-05`) — pass `paused` while a pointer is down.
