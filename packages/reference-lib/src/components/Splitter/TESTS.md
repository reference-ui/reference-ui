# Splitter test contract

Playwright: `matrix/lib/tests/e2e/splitter.spec.ts`  
Unit: `matrix/lib/tests/unit/splitter.test.ts`
Page: `/splitter`

Splitter owns adjacent-panel resize constraints, separator ARIA, pointer/touch
drag sessions, keyboard resize, collapse/restore, controlled layout values,
and one interaction-end request.

## Freeze decisions

The required public details are:

1. `value: number[]` is percentages summing to 100 in current Panel order.
2. Numeric `min`/`max` are percentages; strings are measured CSS lengths
   converted against current group size.
3. A Panel opts into collapse with `collapsible`; `collapsedSize` defaults to
   0 and Enter restores its last expanded size.
4. The separator's primary pane is the preceding logical Panel (left in LTR,
   right in RTL, above vertically), linked by generated `aria-controls`.
5. Keyboard increments are 1 percentage point per Arrow and 10 with Shift.
6. Each Panel exposes its resolved percentage as
   `--reference-splitter-panel-size`; root/Panel/Handle expose exact
   orientation/resizing/collapsed/disabled data state without overwriting
   consumer flex/grid/transform styles.
7. Arrays are positional. Dynamic reorder/insert/remove must update Panel order
   and the corresponding controlled value entries atomically; React keys are
   not a public value-to-Panel mapping. Stable Panel IDs key only constraints
   and remembered collapse sizes.
8. Handle exposes `disabled`; Panel exposes `collapsible`/`collapsedSize`.
9. `onChange` requests each changed layout candidate. `onChangeEnd` receives
   the last requested complete array once after successful pointer release or
   keyboard keyup. Canceled sessions, no-op input, and programmatic updates do
   not emit it.

These require API detail, not another top-level component.

Omitted orientation is horizontal.

## Source evidence

- `vendor/react-resizable-panels/lib` tests for
  `calculatePanelConstraints`, `adjustLayoutByDelta`, keyboard handling,
  separator ARIA, dynamic panels, nested groups, and global pointer sessions.
- `vendor/zag/packages/machines/splitter/tests/splitter.utils.test.ts` and
  Splitter machine — value normalization, collapse/expand, user-select, cursor,
  and orientation behavior.

Universal `PART-TYPE-01` and `PART-STYLE-01` cover each rendered
`ReferencePartProps` native/StyleProps intersection, including omission of
colliding Splitter behavior keys before their controlled types are declared.
The cases below therefore test only Splitter-specific behavior/style
coexistence and do not repeat the generic StyleProps matrix.

## Required cases

### Public type contract

- [ ] `SP-TYPE-01` `[reference]` `[unit]` —
  **Splitter should preserve exact resize callback and constraint types when
  its fixed parts also accept ReferencePartProps.**
  Compile Root with `value: number[]`,
  `onChange={(value: number[]) => ...}`, and
  `onChangeEnd={(value: number[]) => ...}` plus orientation StyleProps;
  compile Panel numeric/CSS-string constraints and Handle `disabled`; reject
  scalar values, event-shaped callbacks, invalid orientation literals, and
  behavior props on the wrong part. Assert generic native/StyleProps/ref
  coverage remains delegated to the universal `PART-*` matrix.

### DOM, identity, and ARIA

- [ ] `SP-DOM-01` `[reference]` `[browser]` —
  **Splitter should render only documented non-form parts when a complete group mounts.**
  Put a two-Panel Splitter in a form and assert Root and Panels are `div`,
  Handle is the only `div[role="separator"]`, and no wrapper, visual bar,
  hidden input, or other form control is generated.
  Submit and reset the form and assert `FormData`, controlled `[40,60]`, Panel
  geometry, and callback logs are unchanged because Splitter owns resize
  behavior rather than form state.
- [ ] `SP-DOM-02` `[reference]` `[browser]` —
  **Splitter should reject structural anatomy when Panels and Handles do not alternate.**
  Render leading, trailing, and consecutive Handles, consecutive Panels
  without their required Handle, and two Panels with a one- or three-entry
  `value`; assert each reports a descriptive anatomy/count error before any
  separator ARIA, pointer capture, or document listener remains.
  A partial resize surface cannot safely infer which positional values are
  adjacent.
- [ ] `SP-DOM-03` `[vendor]` `[browser]` —
  **Splitter should expose valid constrained ARIA values when every Handle in a multi-Panel group is inspected.**
  Render `[20,30,50]` with distinct min/max constraints, then assert each
  Handle's `aria-valuemin <= aria-valuenow <= aria-valuemax`, `aria-valuenow`
  equals its own primary Panel's current percentage, and min/max reflect all
  feasible redistribution on the correct boundary.
  This extends the separator ARIA tests in
  `vendor/react-resizable-panels/lib/components/separator/Separator.test.tsx`
  to the three-Panel indexing regression that two-Panel fixtures cannot catch.
- [ ] `SP-DOM-04` `[convergence]` `[browser]` —
  **Splitter should expose perpendicular separator orientation when the Panel layout axis changes.**
  Render a horizontal group and assert Handle
  `aria-orientation="vertical"`, then rerender vertical and assert
  `"horizontal"` while Root/part `data-orientation` follows the Panel layout
  and values remain unchanged.
  The ARIA value describes the separator's movement axis, whereas styling hooks
  describe the group's layout axis.
- [ ] `SP-DOM-05` `[reference]` `[browser]` —
  **Splitter should link each Handle to its logical primary Panel when IDs are generated or explicit.**
  In LTR, render an explicit `Panel id="sidebar"` before the Handle and a
  generated-ID main Panel, assert `aria-controls="sidebar"` and a stable
  generated ID, then switch to RTL and assert the same Handle controls the
  right logical primary Panel without dangling references.
  Explicit IDs win, but stable generated IDs are still required so ordinary
  compositions satisfy window-splitter ARIA.
- [ ] `SP-DOM-06` `[reference]` `[browser]` —
  **Splitter should update state hooks without overwriting application styling when resize state changes.**
  Add classes plus flex/grid/transform styles to Root, both Panels, and Handle,
  then start/end a drag, collapse the primary Panel, and disable the Handle;
  assert documented orientation, resizing, collapsed, and disabled data hooks
  update on the proper nodes while every unrelated class/style remains exact.
  The behavior kernel publishes state and percentage variables rather than
  taking ownership of product layout chrome.
- [ ] `SP-DOM-07` `[reference]` `[browser]` —
  **Splitter should preserve native div props, handlers, and refs when every public part is customized.**
  Pass IDs, `data-owner`, ARIA labeling, classes, styles, click handlers, and
  object/callback refs to Root, Panel, and Handle; assert they reach each fixed
  native `div`, handlers observe that node as `currentTarget`, and refs receive
  and clean up the same nodes.
  Internal registration and geometry refs must compose stably without an `as`
  escape hatch or ref-triggered render loop.
- [ ] `SP-DOM-08` `[reference]` `[browser]` —
  **Splitter should expose each feasible Handle as a named keyboard separator when tabbing in DOM order.**
  Render three Panels with two labeled Handles, Tab through and assert both
  have `tabIndex=0` in DOM order; then disable one explicitly and constrain the
  other so no delta is feasible, asserting each exposes `aria-disabled="true"`
  and neither requests resize while focus behavior remains deterministic.
  An application supplies the accessible name, while Splitter owns whether the
  separator can act.
- [ ] `SP-DOM-09` `[reference]` `[browser]` —
  **Splitter should publish each controlled Panel percentage when its frozen geometry hook is read.**
  Render `[25,75]` and assert exact
  `--reference-splitter-panel-size: 25%`/`75%`, then rerender `[40,60]` and
  assert both properties and Handle ARIA update atomically without changing
  consumer flex basis, grid placement, transform, or unrelated custom
  properties.
  Applications consume one non-conflicting size signal instead of relying on
  private inline layout writes.
- [ ] `SP-DOM-10` `[reference]` `[browser]` —
  **Splitter should use horizontal Panel geometry and vertical separator behavior when orientation is omitted.**
  Omit `orientation` with controlled `[40,60]`, assert horizontal Root/Panel
  hooks and `aria-orientation="vertical"`, then press ArrowRight and assert one
  `[41,59]` request under LTR.
  This explicit omitted-value case prevents `undefined` from selecting the
  vertical key or measurement axis.
- [ ] `SP-DOM-11` `[reference]` `[browser]` —
  **Splitter should keep Panels non-collapsible and Handles enabled when optional behavior props are omitted.**
  Omit `collapsible`, `collapsedSize`, and `disabled`, focus the Handle, and
  assert ArrowRight requests `[51,49]` while Enter is not consumed and emits
  nothing; then opt the primary Panel into collapse and assert the omitted
  `collapsedSize` resolves to `0`.
  This distinguishes omitted/false behavior from a truthy fallback and keeps
  collapse an explicit Panel capability.
- [ ] `SP-A11Y-01` `[reference]` `[browser]` —
  **Splitter should pass accessibility checks when each frozen layout variant is rendered.**
  Run the checker over horizontal, vertical, three-Panel, mixed-constraint, and
  collapsed fixtures, first asserting accessible Handle names, perpendicular
  orientation, valid value ranges, primary `aria-controls`, and disabled state.
  Automated checks supplement the pointer/keyboard/focus tests and must include
  every Handle, not only the first boundary.

### Layout and constraints

- [ ] `SP-MATH-01` `[reference]` `[unit]` —
  **Splitter should accept values only when finite nonnegative positional percentages total 100.**
  Accept `[40,60]` and `[33.333333,33.333333,33.333334]` within the documented
  tolerance, then reject wrong length, `[-1,101]`, entries containing
  `NaN`/infinity, and totals `99` or `101` with a descriptive layout
  diagnostic.
  Controlled input is already normalized by contract, so the model must not
  silently rescale an invalid parent array as Zag and react-resizable-panels
  may do.
- [ ] `SP-MATH-02` `[vendor]` `[unit]` —
  **Splitter should transfer an applied delta exactly when two adjacent Panels resize.**
  Starting at `[40,60]`, apply `+10` across the only Handle and assert
  `[50,50]`; apply `-15` from the same baseline and assert `[25,75]`, with the
  total exactly `100` and no nonadjacent entry.
  This ports the basic `[1++,2]`/`[1--,2]` cases in
  `vendor/react-resizable-panels/lib/global/utils/adjustLayoutByDelta.test.ts`.
- [ ] `SP-MATH-03` `[vendor]` `[unit]` —
  **Splitter should apply only the feasible portion of a delta when either adjacent constraint binds.**
  From `[50,50]` with first Panel `min=20,max=60` and second
  `min=10,max=80`, assert requested `+50` yields `[60,40]` and `-50` yields
  `[20,80]`, and further motion is an exact no-op.
  These are the constrained two-Panel expectations in react-resizable-panels
  `adjustLayoutByDelta.test.ts`.
- [ ] `SP-MATH-04` `[vendor]` `[unit]` —
  **Splitter should redistribute overflow through farther Panels when nearer Panels reach bounds.**
  For `[25,25,25,25]`, grow Panel 1 by `50` across its following boundary and
  assert Panels are consumed nearest-first to `[75,0,0,25]`; add
  `min=10` to Panels 2–4, request `100`, and assert `[70,10,10,10]`.
  This ports the four-Panel `[1++,2,3,4]` matrices in
  `vendor/react-resizable-panels/lib/global/utils/adjustLayoutByDelta.test.ts`
  and prevents nondeterministic jumping.
- [ ] `SP-MATH-05` `[vendor]` `[unit]` —
  **Splitter should retain the previous valid layout when constraints make a requested result impossible.**
  Use previous `[20,30,30,20]`, transient `[5,15,40,40]`, and the exact
  min/max set from react-resizable-panels issue 311; request `+16` and assert
  the solver returns the previous layout, emits a diagnostic/no change, and
  never returns a negative value or `NaN`.
  This ports `adjustLayoutByDelta.test.ts` “should fallback to the previous
  layout if an intermediate layout is invalid.”
- [ ] `SP-MATH-06` `[reference]` `[unit]` —
  **Splitter should recompute measured length constraints when group size changes without mutating controlled percentages.**
  With a 500px horizontal group, resolve `min="120px"` to `24` and
  `max="450px"` to `90`; resize the group to 1000px and assert `12`/`45`,
  updated Handle ARIA limits, unchanged controlled `[40,60]`, and no
  `onChange`.
  Measurement changes feasibility for future input, not the parent's current
  array by itself.
- [ ] `SP-MATH-07` `[reference]` `[unit]` —
  **Splitter should combine percentage and measured constraints when preserving a 100-point total.**
  In a 400px group solve three Panels using numeric `min=12.5`, string
  `max="160px"` (`40` points), and decimal controlled values
  `[33.3,33.3,33.4]`; apply a `7.7`-point delta and assert deterministic
  rounding within tolerance, every constraint, and a total of exactly `100`.
  Mixed units must enter one percentage solver rather than independent pixel
  and percent layouts.
- [ ] `SP-MATH-08` `[vendor]` `[unit]` —
  **Splitter should defer constraint interaction when its measured group size is zero.**
  Resolve a group rect with width/height `0`, string constraints, and
  controlled `[40,60]`; assert no division result, callback, listener, or ARIA
  value contains infinity/`NaN`, then provide 500px and assert the next solve
  uses valid measured percentages.
  This corresponds to react-resizable-panels `Group.test.tsx` “should work
  within a hidden subtree.”
- [ ] `SP-MATH-09` `[reference]` `[rtl]` —
  **Splitter should reverse logical adjacency when horizontal direction becomes RTL.**
  Render keyed Panels A/B/C with values `[20,30,50]`, switch LTR to RTL, and
  assert the same entries still size A/B/C in DOM order while each Handle's
  primary/adjacent interpretation and physical delta reverse; no automatic
  array reorder or callback occurs.
  React keys preserve constraint/restore metadata only—the controlled fixture
  remains responsible for positional value pairing.
- [ ] `SP-MATH-10` `[reference]` `[unit]` —
  **Splitter should reject Panel constraints when they are invalid or jointly impossible before interaction.**
  Reject negative/non-finite numeric constraints, invalid measured lengths,
  `min=70,max=60`, `collapsedSize=-1` or `101`, collapsed size above max, and
  a three-Panel set whose minima exceed `100`; assert a property-specific
  diagnostic, unchanged layout, and no drag listener.
  Validation must still allow an opted-in collapsed size below that Panel's
  ordinary minimum.

### Controlled values

- [ ] `SP-CTRL-01` `[reference]` `[browser]` —
  **Splitter should request one complete normalized array when pointer or keyboard resize occurs.**
  From `[40,30,30]`, drag the first Handle `+10` points and press ArrowLeft on
  the second in separate runs; assert one callback per action containing all
  three positional percentages, each entry finite/nonnegative, and total
  `100`.
  Consumers should never receive only the adjacent pair or a vendor-specific
  object layout.
- [ ] `SP-CTRL-02` `[reference]` `[browser]` —
  **Splitter should retain controlled Panel geometry and Handle ARIA when the parent rejects a resize request.**
  Keep `value={[40,60]}`, drag 50px right in a 500px group, and assert one
  `[50,50]` request while Panel CSS properties remain `40%`/`60%` and Handle
  `aria-valuenow` remains `40`; move again and assert requests derive from the
  current pointer/controlled props without an optimistic visual jump.
  This separates the in-progress request calculation from rendered controlled
  authority.
- [ ] `SP-CTRL-03` `[vendor]` `[browser]` —
  **Splitter should follow programmatic controlled values when no user interaction occurred.**
  Focus the Handle, rerender `[40,60]` as `[25,75]`, and assert Panel size
  hooks plus separator now/min/max update on the same nodes while focus stays
  put and no `onChange`, pointer, or keyboard handler fires.
  This adapts react-resizable-panels `Group.test.tsx` “should update when
  resized via Group imperative API” to Reference UI's controlled prop.
- [ ] `SP-CTRL-04` `[reference]` `[browser]` —
  **Splitter should emit no request when the constraint solver produces an unchanged layout.**
  Put `[60,40]` at the first Panel's `max=60`, drag/ArrowRight farther, and
  assert no callback, no ARIA or Panel-hook change, focus retention, and a
  bound-appropriate cursor/state.
  This ports react-resizable-panels `Group.test.tsx` “move the pointer a bit,
  but not enough to impact the layout” without an empty change event.
- [ ] `SP-CTRL-05` `[reference]` `[browser]` —
  **Splitter should use current values, constraints, and callback when they change during a drag.**
  Begin dragging `[40,60]` in a 500px group, then rerender `[45,55]`, first
  Panel `max=50`, and handler B; on the next move assert only B receives a
  request clamped at `[50,50]`, Panel rendering stays at current controlled
  values until accepted, and there is no cached-origin jump or call to handler
  A.
  Active global tracking must read live controlled inputs rather than a stale
  closure.
- [ ] `SP-CTRL-06` `[reference]` `[browser]` —
  **Splitter should let a consumer Handle handler cancel resize when it prevents the matching default.**
  In separate fixtures, make Handle `onPointerDown` or `onKeyDown` log first
  and call `preventDefault()`, then press/drag or ArrowRight; assert no focus
  transfer/capture for the pointer case, no internal key resize, no
  `onChange`, and unchanged ARIA/Panel percentages.
  Consumer-first ordering is the public cancellation boundary for both input
  modalities.

### Interaction completion

- [ ] `SP-END-01` `[vendor]` `[browser:all]` —
  **Splitter should summarize a changed drag once when its owned pointer is
  successfully released.**
  Drag `[40,60]` through accepted requests `[45,55]`, `[50,50]`, and
  `[55,45]`, then release over and outside the Handle in separate runs.
  Assert every changed candidate reaches `onChange`, one
  `onChangeEnd([55,45])` follows the final request, the complete positional
  array sums to 100, and compatibility mouse/click events add no duplicate.
  This ports react-resizable-panels drag-stop and Zag resize-end behavior
  without exposing either vendor's imperative state.
- [ ] `SP-END-02` `[vendor]` `[browser:all]` —
  **Splitter should treat a repeated keyboard resize as one interaction ending
  on the matching keyup.**
  Focus an enabled Handle, dispatch ArrowRight once and three native
  `repeat=true` keydowns while accepting each candidate, then release the key.
  Assert each effective step reaches `onChange` and exactly one
  `onChangeEnd` carries the final complete layout. Repeat with Shift+Arrow,
  Home/End, and Enter collapse/restore; an unchanged bound key and duplicate
  keyup emit no end.
- [ ] `SP-END-03` `[reference]` `[browser]` —
  **Splitter should not report successful completion when an active resize is
  canceled or invalidated.**
  After at least one changed request, separately trigger `pointercancel`,
  lost capture, `buttons=0`, window blur, Handle disable/removal, and Root
  unmount before release; also remove focus, disable, or unmount during a
  changed keyboard session before keyup. Assert no `onChangeEnd`, no later
  request, and one cleanup of capture, global listeners, selection lock,
  cursor, and resizing state.
- [ ] `SP-END-04` `[reference]` `[browser]` —
  **Splitter should report current controlled intent without inventing an
  accepted layout or calling stale handlers.**
  Reject changed drag requests from `[40,60]`, replace constraints and the end
  handler during capture, and release successfully. Assert rendered Panel
  percentages and Handle ARIA stay controlled while only the latest handler
  receives the last requested normalized array once. Then rerender `value`
  programmatically and perform a constrained no-op, asserting neither
  `onChange` nor `onChangeEnd` runs.

### Pointer, pen, and touch drag

- [ ] `SP-DRAG-01` `[vendor]` `[browser:all]` —
  **Splitter should start one focused resize session when the primary pointer presses an enabled Handle.**
  In a 500px horizontal group, press pointer `7` at Handle x=`200` and assert
  focus on that Handle, one captured/global session with the origin and
  `[40,60]`, and documented resizing state before any movement or callback in
  all engines.
  This follows Zag's `POINTER_DOWN` transition and react-resizable-panels'
  global session setup.
- [ ] `SP-DRAG-02` `[vendor]` `[browser:all]` —
  **Splitter should map horizontal physical drag to logical Panel growth when direction is LTR or RTL.**
  Starting at `[40,60]` in a 500px group, drag the Handle 50px right/left and
  assert LTR requests `[50,50]`/`[30,70]`; under RTL assert the physical effect
  reverses while the right logical primary Panel and its value identity remain
  correct.
  This ports react-resizable-panels' pointer delta math and freezes inherited
  direction rather than a vendor provider.
- [ ] `SP-DRAG-03` `[vendor]` `[browser:all]` —
  **Splitter should map vertical drag to the Panel above when direction varies.**
  In a 500px-tall vertical group at `[40,60]`, drag 50px down and up and assert
  requests `[50,50]` and `[30,70]` in both LTR and RTL, with the above Panel
  remaining primary and separator `aria-orientation="horizontal"`.
  Vertical geometry has no horizontal-direction reversal.
- [ ] `SP-DRAG-04` `[vendor]` `[browser:all]` —
  **Splitter should continue a captured resize when the pointer leaves the Handle, group, and viewport.**
  Start pointer `7` on a Handle, move over `document.body` and beyond both
  group edges, and assert continued nearest-feasible requests clamped by all
  Panel constraints until pointerup, with no second session.
  This ports the document/global tracking behavior exercised by
  react-resizable-panels `moveSeparator` and Zag `trackPointerMove`.
- [ ] `SP-DRAG-05` `[vendor]` `[touch]` —
  **Splitter should resize from one active touch when duplicate mouse events and unrelated scrolling are possible.**
  Drag touch identifier `1` along the resize axis while identifier `2` and a
  perpendicular scroll gesture occur elsewhere; assert only identifier `1`
  requests values, active-axis scrolling is suppressed only during its
  session, and touchend produces no compatibility-mouse duplicate and restores
  scrolling.
  This preserves native page movement outside the gesture while preventing
  accidental scroll during resize.
- [ ] `SP-DRAG-06` `[reference]` `[browser]` —
  **Splitter should accept only primary input when pen and non-primary pointer buttons are tried.**
  Use a primary pen to drag 50px and assert one focused/captured resize request,
  then try mouse button `2`, a non-primary pointer, and an auxiliary pen button
  and assert none starts state, focus, capture, or callbacks.
  The Pointer Events contract is modality-neutral only for the primary
  activation.
- [ ] `SP-DRAG-07` `[vendor]` `[browser]` —
  **Splitter should suppress text selection and show the resize cursor when a drag is active.**
  Start horizontal and vertical drags over selectable text, attempt
  `selectionchange`/`dragstart`, and assert page selection and native drag are
  prevented while a document-wide `col-resize` or `row-resize` cursor and
  resizing hook are active.
  This ports Zag's global cursor/user-select behavior and
  react-resizable-panels' drag selection prevention.
- [ ] `SP-DRAG-08` `[vendor]` `[browser]` —
  **Splitter should release every session resource when pointerup ends a drag.**
  Move pointer `7`, release it over `document.body`, and assert capture/global
  listeners, selection suppression, cursor, and resizing data state clear once
  while Handle focus remains and later pointer movement produces no request.
  End-of-gesture cleanup must not depend on pointerup occurring over the small
  visible Handle.
- [ ] `SP-DRAG-09` `[vendor]` `[browser]` —
  **Splitter should cleanly abort when an active drag is canceled or its Handle disappears.**
  In separate sessions trigger `pointercancel`, lost capture, a move with no
  buttons, window blur, Root unmount, and Handle disable/removal; assert one
  cleanup, no later callbacks, no stuck resize cursor/selection style, and no
  listener or `NaN` leak.
  This covers the same invalidation paths that react-resizable-panels' global
  machinery and Zag's state exit must release.
- [ ] `SP-DRAG-10` `[reference]` `[browser]` —
  **Splitter should let only the first active pointer own a group when concurrent pointers try to resize.**
  Hold pointer `1` on the first Handle, then press/move pointer `2` on that
  Handle and on a second Handle; assert only pointer `1` changes values, the
  active Handle/state never transfers, and pointer `2` release cannot end the
  session.
  A group-wide single owner prevents two independent deltas from corrupting
  one positional array.
- [ ] `SP-DRAG-11` `[vendor]` `[browser]` —
  **Splitter should resize only the owning nested or outer group when its Handle starts the session.**
  Put a two-Panel vertical Splitter inside the main Panel of a horizontal
  Splitter, drag the inner Handle and then the outer one, and assert only the
  corresponding callback, Panel hooks, Handle ARIA, cursor axis, and resizing
  state change each time.
  Nested group event bubbling must not create a second global resize session.
- [ ] `SP-DRAG-12` `[vendor]` `[browser]` —
  **Splitter should terminate the active primary drag when a secondary click interrupts it.**
  Hold the left button, move a two-Panel Handle from `[50,50]` to `[60,40]`,
  then press/release the right button before releasing left; assert resizing
  becomes inactive, the accepted layout remains `[60,40]`, and later left
  movement/release is a no-op with all resources restored.
  This exactly ports `vendor/react-resizable-panels/lib/components/group/Group.test.tsx`
  “should not break if right click occurs while left click is active.”

### Keyboard resize

- [ ] `SP-KEY-01` `[vendor]` `[browser:all]` —
  **Splitter should request one percentage point when an unmodified Arrow runs along the resize axis.**
  At `[40,60]`, focus an LTR horizontal Handle and assert ArrowRight/ArrowLeft
  request `[41,59]`/`[39,61]`; on a vertical Handle assert
  ArrowDown/ArrowUp request the same growth/shrink results, one callback per
  keydown in all engines.
  This freezes the APG-compatible one-point default documented by
  react-resizable-panels and Zag.
- [ ] `SP-KEY-02` `[reference]` `[browser]` —
  **Splitter should leave Arrow keys available to the application when they target the cross axis.**
  Press Up/Down on a horizontal Handle and Left/Right on a vertical Handle;
  assert the consumer key handler receives unprevented events while
  `onChange`, ARIA values, Panel percentages, focus, and resize state remain
  unchanged.
  Splitter owns only movement along its separator's operable axis.
- [ ] `SP-KEY-03` `[vendor]` `[browser]` —
  **Splitter should request ten percentage points when Shift modifies an axis Arrow.**
  From `[40,60]`, press Shift+ArrowRight to request `[50,50]`, then repeat near
  a `max=55` boundary and assert `[55,45]`; use the same constraint solver,
  callback count, and focus behavior as an unmodified Arrow.
  This ports Zag's `event.shiftKey ? 10 : 1` mapping and the
  react-resizable-panels window-splitter default.
- [ ] `SP-KEY-04` `[vendor]` `[browser]` —
  **Splitter should send Home and End to feasible bounds when its primary Panel is resizable.**
  With primary size `40`, `min=20`, `max=70`, press Home and End in fresh
  controlled runs and assert complete requests `[20,80]` and `[70,30]`,
  Handle now/min/max consistency, focus retention, and no overshoot.
  This applies APG window-splitter bound keys through the same redistribution
  solver as pointer drag.
- [ ] `SP-KEY-05` `[reference]` `[rtl]` —
  **Splitter should reverse horizontal Arrow direction and primary pane when inherited direction is RTL.**
  For DOM-order A/B at `[40,60]`, focus the Handle under `dir="rtl"` and assert
  ArrowRight/ArrowLeft apply the reverse physical delta to logical primary B,
  while vertical Up/Down results are identical in LTR and RTL and values stay
  paired with A/B.
  Direction changes adjacency and key interpretation, not the public array's
  order.
- [ ] `SP-KEY-06` `[reference]` `[browser]` —
  **Splitter should keep focus and ARIA stable when a disabled or blocked Handle receives a resize key.**
  Try axis Arrows, Home, End, and Enter on an explicitly disabled Handle and on
  an enabled Handle whose adjacent Panels are both fixed at their current
  min/max; assert no callback or default consumption and unchanged focus,
  Panel hooks, and valid ARIA.
  `aria-disabled` must correspond to actual infeasibility rather than only a
  styling token.
- [ ] `SP-KEY-07` `[reference]` `[browser]` —
  **Splitter should preserve shortcuts for application handling when their key combinations are unsupported.**
  Press Ctrl/Alt/Meta+axis Arrow, PageUp/PageDown, Escape, F6, and printable
  keys; assert consumer handlers receive them without internal
  `preventDefault`, no `onChange` fires, and Handle focus/ARIA and Panel sizes
  remain unchanged.
  The public contract includes only Arrow, Shift+Arrow, Home, End, and
  collapse Enter, so vendor-only focus cycling is excluded.
- [ ] `SP-KEY-08` `[reference]` `[rtl]` —
  **Splitter should use the latest inherited direction when direction changes around a focused Handle.**
  Focus a horizontal Handle under `dir="ltr"`, rerender the ancestor
  `dir="rtl"` without remounting parts, and press ArrowRight; assert primary
  `aria-controls` and the requested logical delta use RTL immediately while
  controlled Panel identities, refs, and registrations remain stable.
  Dynamic direction prevents a cached LTR key map from disagreeing with
  current pointer geometry.

### Collapse and restore

- [ ] `SP-COLLAPSE-01` `[convergence]` `[browser]` —
  **Splitter should request collapsed size when Enter targets an expanded collapsible primary Panel.**
  Render `[30,70]` with primary `collapsible`, `min=20`, and
  `collapsedSize=5`, focus the Handle, and press Enter; assert one complete
  `[5,95]` request after constraint redistribution, unchanged controlled
  rendering until accepted, and Enter consumed.
  This converges Zag's `collapseOrExpandPanel` with APG window-splitter Enter
  behavior.
- [ ] `SP-COLLAPSE-02` `[vendor]` `[browser]` —
  **Splitter should restore the last feasible expanded size when Enter targets a collapsed primary Panel.**
  Accept collapse from `30` to `5`, change constraints so the feasible maximum
  is `25`, press Enter again, and assert a `[25,75]` request rather than the
  stale `30`; after constraints allow it, a later collapse/restore remembers
  the newest feasible expanded size.
  This ports Zag's stored `panelSizeBeforeCollapse` expansion logic.
- [ ] `SP-COLLAPSE-03` `[reference]` `[browser]` —
  **Splitter should ignore Enter when the logical primary Panel has not opted into collapse.**
  Focus a Handle beside a default non-collapsible `[40,60]` Panel and press
  Enter; assert the event remains unprevented for the application, no callback
  or state hook changes, and Handle ARIA/Panel percentages stay exact.
  Collapse is a Panel capability, not an implicit separator action.
- [ ] `SP-COLLAPSE-04` `[reference]` `[browser]` —
  **Splitter should mark a collapsed Panel expanded and refresh its restore size when resize moves it away from collapsed size.**
  From accepted `[5,95]` with `min=20`, use a pointer drag to reach
  `[30,70]` and separately use an Arrow that snaps from `5` to at least `20`;
  assert collapsed hooks clear and a later Enter collapse/restore requests the
  newest accepted expanded size (`30` or `20`).
  This protects restore memory from remaining stuck on a pre-interaction size.
- [ ] `SP-COLLAPSE-05` `[reference]` `[browser]` —
  **Splitter should reflect collapse and expansion without requests when controlled values change programmatically.**
  Rerender `[30,70]` as `[5,95]` and back, and assert Panel collapsed state,
  size hook, and Handle now/min/max update on the same nodes while focus is
  preserved and `onChange` stays empty.
  Controlled props remain authoritative even when they cross the collapse
  boundary without user input.
- [ ] `SP-COLLAPSE-06` `[reference]` `[browser]` —
  **Splitter should keep remembered restore size with a stable Panel ID when collapsed Panels reorder or disappear.**
  Collapse keyed Panel A after it was `30`, reorder A/B/C with matching
  positional values, remove A, and insert D at that position; assert neither B
  nor D restores to `30`, while reinserting A with its stable ID may recover
  only A's remembered feasible size.
  React array position is value mapping, but Panel ID is the explicit key for
  constraint and restore metadata.
- [ ] `SP-COLLAPSE-07` `[reference]` `[unit]` —
  **Splitter should bypass ordinary minimum only when an opted-in Panel is explicitly collapsed.**
  With `collapsible`, `min=20`, and `collapsedSize=5`, accept exact sizes `5`
  and any expanded size `>=20`, reject ordinary sizes `6..19`, and assert
  expansion from `5` resolves to a currently feasible size at least `20`.
  This freezes the intentional discontinuity without allowing all constraints
  to be bypassed.
- [ ] `SP-COLLAPSE-08` `[vendor]` `[unit]` —
  **Splitter should use the midpoint threshold when pointer resize crosses the gap between minimum and collapsed size.**
  With `min=20` and `collapsedSize=10`, solve proposed primary sizes `15` and
  `14`; assert the midpoint value stays/returns expanded at `20`, while the
  below-midpoint value collapses to `10`, mirrored for either adjacent side and
  with total `100`.
  This ports `vendor/react-resizable-panels/lib/global/utils/validatePanelGroupLayout.test.ts`
  “should collapse a panel once it drops below the halfway point between
  collapsed and minimum percentage sizes” and the threshold matrices in
  `adjustLayoutByDelta.test.ts`.

### Dynamic panels and environments

- [ ] `SP-DYNAMIC-01` `[vendor]` `[browser]` —
  **Splitter should preserve keyed metadata when Panels, Handles, and positional values change atomically.**
  Insert, remove, and reorder A/B/C plus alternating Handles while updating
  `[20,30,50]` entries in the same controlled render; assert rendered sizes
  follow new position, constraints/restore history stay with stable Panel IDs,
  Handle adjacency/ARIA is rebuilt, and no stale listener or unsolicited
  callback occurs.
  This adapts react-resizable-panels `Group.test.tsx` “should be called when
  panels change” while explicitly rejecting object/key-based public layout
  mapping.
- [ ] `SP-DYNAMIC-02` `[vendor]` `[browser]` —
  **Splitter should recompute measured constraints and Handle ARIA when group geometry changes.**
  Keep controlled `[40,60]` while resizing a group from 500px to 1000px with
  `min="120px"`/`max="450px"`; assert the size hooks stay `40%`/`60%`,
  measured ARIA limits change from `24..90` to `12..45` as applicable, and no
  `onChange` occurs until the next user action.
  This uses the resize-observer behavior in Zag's `ROOT.RESIZE` path without
  adopting its optional pixel-preservation mode.
- [ ] `SP-DYNAMIC-03` `[reference]` `[browser]` —
  **Splitter should avoid invalid math and global leaks when a Panel is hidden and shown.**
  Hide the middle Panel of A/Handle/B/Handle/C so anatomy is transiently
  invalid, attempt a drag, then restore all parts with matching values; assert
  the diagnostic contains the mismatch, no capture/cursor/listener or `NaN`
  survives, and the restored next drag uses current geometry once.
  Dynamic product layouts must fail locally rather than strand document-wide
  resize state.
- [ ] `SP-ENV-01` `[reference]` `[ssr]` —
  **Splitter should hydrate controlled percentages when length constraints cannot yet be measured.**
  Server-render `[40,60]` with `min="120px"` and exact Panel size hooks/initial
  safe Handle ARIA without reading layout, hydrate first at zero size and then
  measure 500px, and assert no warning, first-frame style mismatch, callback,
  or stale server geometry.
  Client measurement may refine feasible ARIA limits but must not rewrite the
  controlled layout merely to correct SSR.
- [ ] `SP-ENV-02` `[reference]` `[react:all]` —
  **Splitter should register each part and resize session once when run across supported React versions.**
  Under StrictMode in React 17, 18, and 19, mount/reorder a three-Panel group,
  drag one Handle, and unmount; assert stable refs/IDs, one registration per
  live part, one capture/global session and request per physical action, and
  complete cleanup.
  This catches effect replay without weakening dynamic anatomy.
- [ ] `SP-ENV-03` `[reference]` `[shadow]` —
  **Splitter should keep focus and global drag cleanup correct when rendered in a ShadowRoot.**
  Mount a nested horizontal Splitter in an open ShadowRoot, focus and drag its
  Handle outside the host, and assert `shadowRoot.activeElement`, callbacks,
  Panel hooks, selection suppression, cursor, pointer release, and cleanup all
  belong to that instance.
  Shadow event retargeting must not strand document styles or activate an outer
  group.
- [ ] `SP-ENV-04` `[reference]` `[browser:all]` —
  **Splitter should preserve its two-Panel contract when run in every supported browser engine.**
  In Chromium, Firefox, and WebKit run one constrained drag, one Arrow/Shift
  resize, and one Enter collapse/restore; assert identical arrays, focus,
  separator ARIA, state/size hooks, capture lifecycle, and callback counts.
  This targeted smoke catches Pointer Events and keyboard differences without
  expanding the entire matrix.

## Composition gates

- [ ] `SP-COMP-01` `[reference]` `[browser]` `[rtl]` —
  **Splitter should resize and restore a collapsible sidebar when application direction is LTR or RTL.**
  Build sidebar/main Panels at `[30,70]` with sidebar
  `min=20,collapsible,collapsedSize=5`, drag and Enter-collapse/restore in LTR,
  then switch to RTL and assert logical primary control, reversed physical
  delta, arrays, Handle ARIA, size/collapsed hooks, and remembered sidebar size
  remain correct.
  This composition proves direction changes semantics without moving value
  entries or collapse metadata to the main Panel.
- [ ] `SP-COMP-02` `[reference]` `[browser]` —
  **Splitter should honor measured constraints when a vertical editor and console composition resizes.**
  Build a 600px vertical editor/console at `[70,30]` with console
  `min="120px"` and editor `min=40`, drag upward and use Shift+Arrow/Home/End,
  asserting feasible complete arrays, above-Panel primary ARIA, row-resize
  cursor, exact percentage hooks, and no selection leak.
  This proves mixed units, vertical geometry, and keyboard defaults share one
  solver.
- [ ] `SP-COMP-03` `[reference]` `[browser]` —
  **Splitter should isolate resize state when a three-Panel workspace contains a nested Splitter.**
  Build navigation/editor/preview Panels with an inner vertical
  editor/console Splitter, operate inner and outer Handles concurrently in
  sequence, and assert only the owning callback/ARIA/size hooks change, totals
  remain `100` per group, focus/cursor axes are correct, and cleanup leaves no
  global session.
  This adversarial composition proves nested groups do not confuse positional
  arrays, Handle adjacency, or document-wide drag resources.

## Out of scope

- Persistence/localStorage, imperative layout methods, product skins, public
  hit-region APIs, drag handles detached from adjacent Panels, or snap points.
