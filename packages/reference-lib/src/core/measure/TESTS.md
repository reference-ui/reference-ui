# Measure tests

Hook and kernel. Proof lives next to the source in `src/core/measure/`.

## Hook

- [x] `MS-REF-01` `[reference]` `[unit]` —
  **useMeasure should observe the authored element and add no wrapper node.**
  Attach `ref` to a `div[data-host]`. Assert the React container has that one
  child and ResizeObserver's target is it.
- [x] `MS-SETTLE-01` `[reference]` `[unit]` —
  **useMeasure should treat layout as unsettled until the quiet window.**
  First sample publishes width/height with `isSettled=false`. After
  `MEASUREMENT_SETTLE_TIMEOUT_MS` with no further change, `isSettled` is
  true. A later real size change resets it; sub-epsilon jitter does not.
- [x] `MS-PAUSE-01` `[reference]` `[unit]` —
  **useMeasure should not observe while paused and must not start a rAF loop.**
  Render with `paused`. Assert no ResizeObserver targets and
  `requestAnimationFrame` is not called. Unpause observes. Spy rAF around
  mount.
- [x] `MS-PAUSE-02` `[reference]` `[unit]` —
  **useMeasure should keep the last rect while paused.**
  Settle a box, then pause. Assert `rect` is unchanged and `isSettled` is
  false. Resume observes again.
- [x] `MS-TARGET-01` `[reference]` `[unit]` —
  **useMeasure should observe `target.current` when no callback ref has attached.**
  Pass an already-filled `RefObject`. Assert ResizeObserver's target is that
  node and the authored host is still the only child.
- [x] `MS-TARGET-02` `[reference]` `[unit]` —
  **useMeasure should observe a `target` that appears on a later commit.**
  Mount with the host omitted, then render the host onto the same
  `RefObject`. Assert ResizeObserver attaches to that node.
- [x] `MS-BOX-01` `[reference]` `[unit]` —
  **useMeasure should observe `{ box: 'border-box' }`.**
  Assert the mock `observe` call includes `box: 'border-box'`.
- [x] `MS-UNMOUNT-01` `[reference]` `[unit]` —
  **useMeasure should disconnect on unmount.**
  Assert the observer's observed set is empty after unmount.
- [x] `MS-SSR-01` `[reference]` `[ssr]` —
  **useMeasure should server-render the authored host with a null box.**
  `renderToString` a host that uses the hook. Assert one `div`,
  `rect === null`, `isSettled` false, no extra markup.

## Kernel

- [x] `MS-SETTLE-02` `[reference]` `[unit]` —
  **createMeasureSettled should ignore identical samples and settle on the original timer.**
  Sample once, advance just under the timeout, sample the same rect, then
  advance the remainder. Assert `onSettled` fires once and `settled` is true.
- [x] `MS-SETTLE-03` `[reference]` `[unit]` —
  **createMeasureSettled should not settle without a clock (SSR).**
  Construct with `clock: null`, sample, and assert `settled` stays false.
- [x] `MS-RECT-01` `[reference]` `[unit]` —
  **readClientRect / snapshotRects should copy boxes and skip null targets.**
  Assert the snapshot is a plain object (not the live DOMRect), and null
  entries are omitted without changing order of the rest.
- [x] `MS-POLL-01` `[reference]` `[unit]` —
  **createDirtyPoll.stop from onChange should not leak a pending frame.**
  Wake, move, and stop inside `onChange`. Assert `running` is false and the
  frame clock is empty.
- [x] `MS-THROW-01` `[reference]` `[unit]` —
  **createDirtyPoll should release its pending frame even if onChange throws.**
  Wake, move so `onChange` throws once. Assert the throw propagates, `running`
  is false, and the frame clock is empty. A later `wake` can start a fresh run.

## CPU budgets

These are call-count contracts, not wall-clock benches. They encode
`vendor/design-system/resizable/shared/useBoundingClientRect`: idle is event
driven, hot work sleeps, settle does not thrash React.

- [x] `MS-PERF-01` `[reference]` `[unit]` —
  **createDirtyPoll should hold zero frames and zero measure() calls after it sleeps.**
  Wake, let it idle out, then flush many extra ticks. Assert `running` is
  false, the frame clock is empty, and `measure` is not called again.
- [x] `MS-PERF-02` `[reference]` `[unit]` —
  **createDirtyPoll should keep a single pending frame under wake spam.**
  Call `wake` many times in one turn and during a run. Assert the clock
  size stays 1.
- [x] `MS-PERF-03` `[reference]` `[unit]` —
  **createDirtyPoll should not call onChange for sub-epsilon jitter, and jitter must not prevent sleep.**
  After a real move, feed jitter below `RECT_JITTER_EPSILON` for more than
  `idleFrames` ticks. Assert `onChange` stayed at one call and the poll
  sleeps. Vendor `useRealtimeUpdate` compared rects with `!==` and never
  slept while active.
- [x] `MS-PERF-04` `[reference]` `[unit]` —
  **createMeasureSettled should fire onSettled once across a slow-machine layout ramp.**
  Sample 20 increasing widths, advancing less than the timeout each time,
  then wait the full timeout once. Assert a single `onSettled`. Vendor
  `useMeasureSettled.spec` `prevents excessive updates / thrashing`.
- [x] `MS-PERF-05` `[reference]` `[unit]` —
  **createFrameScheduler should collapse a burst of requests in one turn to one callback.**
  Schedule N requests before flush. Assert one pending frame and the latest
  callback only. This is the rAF half of vendor `useEventEnd` (100 scroll
  events → one frame), without the 80ms living-position lag Overlay cannot
  take.
- [x] `MS-PERF-06` `[reference]` `[unit]` —
  **useMeasure should not publish a new rect identity for sub-epsilon jitter.**
  After settle, fire ResizeObserver with a 0.04px width change. Assert the
  `rect` object is the same reference. A 10px change publishes a new object
  and resets settle.
- [x] `MS-PERF-07` `[reference]` `[unit]` —
  **createDirtyPoll.wake should sample at most once for a baseline, then once per frame while awake.**
  Count `measure` calls across wake + N flushes. Assert `1 + N` while
  running, and that `onChange` is not called for the baseline sample.

## Browser

Proof lives in `matrix/lib/tests/e2e/measure.spec.ts` against a real
`ResizeObserver`.

- [x] `MS-DOM-01` `[reference]` `[browser]` —
  **useMeasure should publish the authored host border box with no wrapper node.**
  Assert `data-width` equals rounded `getBoundingClientRect().width` (100).
- [x] `MS-BOX-B-01` `[reference]` `[browser]` —
  **useMeasure should update published width on a padding-only change.**
  `box-sizing: content-box`, width 100, then padding 20. Assert `data-width`
  becomes 140. Content-box observation would stay 100.
- [x] `MS-SETTLE-B-01` `[reference]` `[browser]` —
  **useMeasure should settle after a real width change.**
  Toggle width 100 → 200. Assert `data-settled` is `yes` at 200.
- [x] `MS-PAUSE-B-01` `[reference]` `[browser]` —
  **useMeasure should keep the last width while paused.**
  Pause, then toggle width. Assert `data-width` stays 100 and
  `data-settled` stays `no`.
- [x] `MS-PERF-B-01` `[reference]` `[browser]` —
  **useMeasure should not read layout while idle after settle.**
  Spy `getBoundingClientRect` on the host after settle. Wait 120ms.
  Assert zero additional reads. A real resize may read.
- [x] `MS-SCALE-01` `[reference]` `[browser]` —
  **useMeasure should not churn on a transform-only change.**
  Settle, then `transform: scale(1.5)`. Assert published width stays the layout
  width and `isSettled` stays true, while `getBoundingClientRect().width`
  differs.
- [x] `MS-LOOP-01` `[reference]` `[browser]` —
  **useMeasure should converge when rect drives the observed width.**
  Clamp the host width from `rect`. Assert it settles at the clamp and emits
  no ResizeObserver loop error.
- [x] `MS-DOC-01` `[reference]` `[browser]` —
  **useMeasure should observe an iframe host with that document's box.**
  Mount inside a same-origin iframe offset in the parent. Assert published
  width matches the iframe host and `top` is iframe-local, not the iframe's
  offset in the parent window. Constructor source is `resizeObserverFor`.
- [x] `MS-HIDDEN-01` `[reference]` `[browser]` —
  **useMeasure should publish a zero box for `display:none` and re-measure on
  reappear.** Hide, assert `0×0` settled, show, assert the real box settles
  again.
- [x] `MS-ENV-01` `[reference]` `[react:all]` —
  **useMeasure should run one observer and one cleanup under StrictMode.**
  Unit: one live observer, one settle, disconnect on unmount. Browser: the
  `/measure` fixture is StrictMode-wrapped; unmount/remount settles once.

## Tracking

Proof lives in `Overlay/geometry/auto-update.test.ts` and `observe-move.test.ts`.

- [x] `MS-TRACK-06` `[reference]` `[unit]` —
  **The animationFrame poll should snapshot the reference, never the floating
  element.** Rewrite floating `left`/`top` every read while the reference is
  still. Assert the poll idles out in `MAX_IDLE_FRAMES`.
- [x] `MS-TRACK-07` `[reference]` `[unit]` —
  **The poll wake should be gated on `document.hidden`.**
  Hidden: `animationstart` / `visibilitychange` do not arm a frame.
  Visible: `visibilitychange` re-arms once.
- [x] `MS-MOVE-01` `[floating-ui]` `[unit]` —
  **observeMove should fire on layout shift and bail on a zero-size box.**
  `0×0` registers no observer. A move past `0.5px` calls `onMove`. Teardown
  disconnects and clears the offscreen timeout. Not a rAF loop.
