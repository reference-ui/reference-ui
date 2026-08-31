# Popover test contract

Playwright: `matrix/lib/tests/e2e/popover.spec.ts`  
Unit: `matrix/lib/tests/unit/popover-position.test.ts`
Page: `/popover`

Popover is Overlay with isolation frozen off, plus hover policy.
`Popover.Trigger` is Overlay.Trigger. Geometry, Tab-order bridge,
`closeOnScroll`, and Trigger activation are Overlay's. Popover cases
below prove consumption plus hover grace and impatient click. Shared
layer-stack behavior is Overlay; exit detection is Presence.

## API freeze decisions

1. Content publishes Overlay's `--reference-overlay-available-width`/`-height`,
   `--reference-overlay-anchor-width`/`-height`, and
   `--reference-overlay-transform-origin`; hide state uses
   `data-anchor-hidden`/`data-escaped`. Engine cases live in Overlay
   `OV-POS-*`; Popover cases below prove Trigger-as-default-anchor and
   hover/`closeOnScroll` consumption.
2. Unprevented native Trigger activation requests open/dismiss after the
   consumer handler; `openOnHover` adds hover intent.
3. Popover freezes Overlay `isolation={false}` and never owns inerting or
   focus lock; isolating content uses Overlay directly.
4. `Popover.Arrow` uses numeric `edgePadding`, default 4, for collision math;
   ordinary `padding` remains a token-aware visual StyleProp on its div.
5. Content positioning owns `position`/`top`/`left`; arbitrary consumer
   transforms/transitions remain untouched.
6. Hover defaults are 700ms open, 300ms close, 300ms impatient-click threshold,
   and 5px safe-area padding.
7. `closeOnScroll` is false by default. When true, a composed overflow
   ancestor that moves the anchor requests one close; unrelated and text-field
   self-scroll do not.

Omitted positioning means `placement="bottom-start"`, `offset=8`, collision
padding 8, flip/shift enabled, absolute strategy, and a body portal. Hover
opening remains opt-in; ordinary Trigger click/keyboard activation remains
built in.

## Source evidence

- `vendor/floating-ui/packages/{core,dom}` and
  `packages/dom/test/functional/{flip,shift,offset,arrow,size,hide,autoUpdate,scroll,iframe,shadow-dom,top-layer,virtual-element,zoom}.test.ts`
  — positioning engine and browser edge cases.
- `vendor/base-ui/packages/react/src/floating-ui-react/safePolygon.test.ts` and
  Popover tests — hover grace, impatient click, virtual anchors, and current
  positioning props.
- Radix `e2e/popover.spec.ts` and DismissableLayer tests — nested registration,
  deferred outside events, and focus restoration; combined cases move to
  Overlay.
- React Aria `useSafeArea.ts` and Zag hover-card/popover machines — hull grace
  and open/close timers.

## Part contract

`Popover.Trigger` is a fixed `ReferencePartProps<"button">` part;
`Popover.Content` and `Popover.Arrow` are fixed
`ReferencePartProps<"div">` parts. `Popover` and `Popover.Portal` are
transparent; all five run the applicable shared `PART-*` type, DOM, StyleProps,
ref, event, state, control, and default checks from `TESTING.md`. Cases below
add only Popover-specific anatomy and behavior/style conflicts.

## Required cases

### DOM, trigger state, and portal

- [x] `PO-DOM-01` `[reference]` `[browser]` —
  **Popover should render only its documented native parts when it uses the
  default body portal.**
  Mount an open Popover with Trigger, Content, Arrow, and transparent Portal
  configuration. Assert Popover and Portal add no host, Trigger is the one
  authored `button`, Content and Arrow are `div` elements, and the Content
  subtree is under `document.body`.
- [x] `PO-DOM-02` `[reference]` `[browser]` —
  **Popover should expose controlled trigger state when its Content mounts and
  unmounts.**
  Toggle controlled `open` while retaining the same Trigger and Content
  instances across rerenders. Assert `aria-expanded` reflects the prop,
  `aria-controls` stably names mounted Content, and open/closed data hooks
  update atomically; generic native-prop coverage belongs to `PART-PROP-01`.
- [x] `PO-DOM-03` `[reference]` `[browser]` —
  **Popover should keep ID relationships correct when authored or generated
  Trigger and Content IDs change.**
  Mount multiple instances with omitted IDs, then parameterize explicit IDs,
  rerendered IDs, and Content removal. Assert authored IDs win, generated IDs
  are stable and unique, Trigger references update atomically with Content,
  and unmount removes only Popover-owned ARIA tokens.
- [x] `PO-DOM-04` `[reference]` `[browser]` —
  **Popover should publish all positioning state when live geometry resolves
  or changes.**
  Open Content, force placement, clipping, size, and anchor visibility changes,
  and sample its public attributes and computed custom properties. Assert
  authoritative `data-state`, resolved `data-side`/`data-align`,
  `data-anchor-hidden`/`data-escaped`, and all five documented
  `--reference-overlay-*` available-size, anchor-size, and transform-origin
  values without stale output.
- [x] `PO-DOM-05` `[reference]` `[browser]` —
  **Popover should apply exact Arrow collision insets when `edgePadding` is
  omitted, zero, or positive.**
  Render the decorative Arrow against a constrained cross axis with omitted
  `edgePadding`, `edgePadding={0}`, and a concrete positive value. Assert the
  one `aria-hidden` div clamps to four pixels by default, may reach the
  available edge at zero, and stays exactly the supplied positive distance
  from each tested Content edge without truthiness fallback.
- [x] `PO-DOM-06` `[reference]` `[browser]` —
  **Popover should move its floating subtree without a wrapper when Portal
  receives a direct, ref, or function destination.**
  Parameterize `Popover.Portal` over an element, mutable ref, and destination
  function, including a target that becomes available after mount. Assert
  Content and Arrow move together through shared Portal semantics and no
  configuration node appears at the declaration site or destination.
- [x] `PO-DOM-07` `[reference]` `[browser]` —
  **Popover should create no trigger semantics when positioning uses only a
  virtual anchor.**
  Mount an open Popover with `anchor={{x: 40, y: 60}}`, Content, and no Trigger,
  then inspect DOM and accessibility output. Assert there is no hidden button,
  guessed `aria-expanded`/`aria-controls` source, focus-restore target, or
  extra host; only authored Content is positioned from the point.
- [x] `PO-DOM-08` `[reference]` `[browser]` —
  **Popover should keep visual Arrow padding independent when `edgePadding`
  controls collision geometry on the same part.**
  Hold `edgePadding={12}` and all anchor/Content rects fixed while changing the
  token-aware `padding` StyleProp from `"1r"` to `"2r"`, then change only
  `edgePadding`. Assert computed padding changes on the Arrow div without
  moving its owned coordinate or Content, while the behavioral prop changes
  the geometric inset without replacing the visual padding.
- [x] `PO-DOM-09` `[reference]` `[browser]` —
  **Popover should preserve opaque consumer transforms when live positioning
  coordinates update.**
  Give Content authored `transform`, `transition`, and `transform-origin`
  animation styles, then scroll, resize, and flip it while open. Assert
  positioning changes only owned `position`/`top`/`left` and the documented
  transform-origin custom property, never erasing, parsing, or concatenating
  the consumer's transform-related declarations.
- [x] `PO-DOM-10` `[reference]` `[browser]` —
  **Popover should use every frozen default when optional positioning, hover,
  and portal props are omitted.**
  Mount a closed instance with only Trigger and Content, activate Trigger, and
  place the anchor in unconstrained geometry. Assert built-in activation
  requests open and resolved configuration is `bottom-start`, eight-pixel
  offset, eight-pixel collision padding, flip and shift enabled, absolute
  strategy, body portal, and hover opening disabled.
- [x] `PO-DOM-11` `[reference]` `[browser]` —
  **Popover should avoid accidental form submission when Trigger omits its
  native button type.**
  Place a default Trigger, a MenuButton composition, and an explicitly
  `type="submit"` Trigger in separate forms with submit logs, then activate
  each. Assert omitted type renders `button[type="button"]` and never submits,
  while the explicit submit opt-in retains native form behavior in addition to
  the documented Popover request.

### Controlled open and dismissal

- [x] `PO-CTRL-01` `[reference]` `[browser]` —
  **Popover should request the controlled state transition after consumer
  handlers when Trigger receives native activation.**
  Activate a closed and then open Trigger by mouse click, Enter, and Space
  while recording consumer button handlers and Popover callbacks. Assert each
  consumer handler runs first, followed by exactly `onOpen()` when closed or
  `onDismiss()` when open, and neither request mutates controlled DOM without a
  parent rerender.
- [x] `PO-CTRL-02` `[reference]` `[browser]` —
  **Popover should change lifecycle state without callbacks when the parent
  updates `open` programmatically.**
  Rerender from `open={false}` to `true`, verify live positioning, then set
  `open={false}` and complete any exit. Assert Content mounts, positions, enters
  closed Presence state, and unmounts according to the prop while `onOpen`,
  `onEscape`, `onOutsidePress`, and `onDismiss` stay silent.
- [x] `PO-CTRL-03` `[reference]` `[browser]` —
  **Popover should preserve controlled DOM when the parent rejects an open or
  dismiss request.**
  Keep `open={false}` after a hover `onOpen` request and keep `open={true}`
  after Trigger or outside `onDismiss`, then continue the same intent briefly.
  Assert Content remains respectively absent or open and each intent emits
  only its one documented request rather than spamming callbacks or inventing
  internal state.
- [x] `PO-CTRL-04` `[reference]` `[browser]` —
  **Popover should cancel built-in Trigger activation when the consumer click
  handler prevents default.**
  On closed and open fixtures, compare a Trigger handler that calls
  `preventDefault()` with one that only calls `stopPropagation()`, then click
  each. Assert both consumer handlers run first, prevention suppresses
  `onOpen`/`onDismiss`, and propagation stopping alone still permits the
  internal controlled request.
- [x] `PO-CLOSE-01` `[vendor]` `[browser:all]` —
  **Popover should request dismissal after its granular callback when Escape
  reaches the top Popover.**
  Open a controlled Popover as the top shared layer, focus a Content control,
  and press Escape while logging callback order. Assert exactly
  `onEscape(keyboardEvent)` then `onDismiss()` when unprevented, with controlled
  Content unchanged until the parent accepts.
- [x] `PO-CLOSE-02` `[vendor]` `[browser]` —
  **Popover should distinguish outside presses from interaction in Trigger,
  Content, or Arrow when it is open.**
  Perform complete primary pointer sequences on each inside part and then on
  an ordinary outside control. Assert inside sequences call neither dismissal
  callback, while the outside sequence calls `onOutsidePress(pointerEvent)`
  then `onDismiss()` once.
- [x] `PO-CLOSE-03` `[reference]` `[browser]` —
  **Popover should remain open when either granular dismissal callback prevents
  its default.**
  In separate open fixtures, call `preventDefault()` from `onEscape` and
  `onOutsidePress`, then send real key and pointer input. Assert each granular
  callback receives intact browser metadata exactly once, `onDismiss` is
  skipped, and the controlled layer remains registered and interactive.
- [x] `PO-CLOSE-04` `[vendor]` `[touch]` —
  **Popover should avoid cascading dismissal when one outside touch traverses
  nested parent and child layers.**
  Open a child Popover over a parent layer, begin an outside touch, verify
  dismissal waits for the safe click sequence, and accept the child's request.
  Assert that tap emits one child dismissal and cannot later dismiss the parent
  from the deferred click, preserving the shared Overlay regression contract.
- [x] `PO-CLOSE-05` `[reference]` `[browser]` —
  **Popover should ignore its opening pointer event and use current handlers
  when later outside input occurs.**
  Open from Trigger `pointerdown`, rerender dismissal handlers and captured
  state before the next independent outside sequence, and then press outside.
  Assert the opening event cannot immediately close Content and the later
  event invokes only the latest granular and high-level closures once.
- [x] `PO-CLOSE-06` `[reference]` `[browser]` —
  **Popover should remain non-modal when it is open over ordinary application
  content.**
  Open Content with focusable and scrollable controls before and after it in
  source order, then focus, Tab, click, and scroll outside. Assert Popover adds
  no focus trap, inert or `aria-hidden` background state, body pointer lock, or
  document scroll lock; only its documented close policy may request state.
- [x] `PO-CLOSE-07` `[vendor]` `[browser]` —
  **Popover should request dismissal when an unregistered extension overlay
  receives the outside interaction and stops later mouse events.**
  Open a non-modal Popover, interact with a password-manager-style sibling
  overlay whose later `mousedown`, `mouseup`, and `click` handlers stop
  propagation, and keep controlled state open after the request. Assert the
  initial outside path produces one `onOutsidePress` then one `onDismiss`,
  with no duplicate from blocked later events. This ports Radix
  `e2e/dropdown-menu.spec.ts`; modal Overlay deliberately keeps the inverse
  policy in `OV-OUT-07`.

### Focus restore

- [x] `PO-FOCUS-01` `[convergence]` `[browser]` —
  **Popover should restore Trigger focus when dismissal follows focus entering
  Content and the owned exit completes.**
  Open from a focused Trigger, move focus to a Content control, request
  dismissal, accept `open={false}`, and run a visible exit. Assert focus remains
  valid during exit and returns once to the original Trigger only after Content
  unmounts.
- [x] `PO-FOCUS-02` `[reference]` `[browser]` —
  **Popover should not steal focus when focus never entered Content or the
  application deliberately moved it elsewhere.**
  Dismiss one instance while focus remains on Trigger and another after
  application code focuses an unrelated valid target. Assert exit completion
  preserves the current target in both cases and does not perform unconditional
  Trigger restoration.
- [x] `PO-FOCUS-03` `[vendor]` `[browser]` —
  **Popover should choose a live proximity fallback when Trigger is removed or
  disabled before restoration.**
  Open from Trigger, focus Content, remove or disable Trigger, then dismiss and
  complete exit. Assert focus moves to the documented nearest eligible
  source-order target, never detached or disabled Trigger DOM, and no exception
  or body-focus regression occurs.
- [x] `PO-FOCUS-04` `[reference]` `[browser]` —
  **Popover should remain inside its parent modal's focus boundary when it is
  portalled from an Overlay.**
  Open Overlay, then a nested Popover whose Content portals outside Overlay
  Content, and move focus into the child. Assert Popover Content is registered
  as the same shard and dismissal branch, parent FocusLock does not reclaim
  focus, and membership disappears only at the documented exit boundary.
- [x] `PO-FOCUS-05` `[convergence]` `[browser]` —
  **Popover should bridge forward and reverse Tab order when Content is
  portalled away from Trigger.**
  Put source-order controls around Trigger and multiple tabbables in
  body-portalled Content, then Tab from Trigger and Shift+Tab from the first
  Content control. Assert forward focus reaches the first Content descendant
  and reverse focus returns to Trigger despite physical portal order, without
  trapping focus.
- [x] `PO-FOCUS-06` `[convergence]` `[browser]` —
  **Popover should resume source document order when Tab leaves its last
  Content control.**
  Tab from the last Content descendant, then separately Shift+Tab from Trigger
  with tabbables before and after Trigger in source DOM. Assert forward
  traversal requests dismissal once and lands after Trigger, reverse traversal
  lands before Trigger, and neither path follows the portal's body position.
- [x] `PO-FOCUS-07` `[reference]` `[browser]` —
  **Popover should skip non-tabbable Content when sequential focus reaches an
  open popup.**
  Open Content containing no tabbable descendant and press Tab and Shift+Tab
  from Trigger in fixtures with surrounding source-order controls. Assert each
  direction requests one dismissal, skips the popup to the correct outside
  target, and encounters no focus trap or hidden guard stop.
- [x] `PO-FOCUS-08` `[reference]` `[browser]` —
  **Popover should respect consumer focus navigation when a Tab bridge or
  programmatic focus-leave is deliberately handled.**
  Prevent default in a consumer Content key handler before the explicit Tab
  bridge, then in a separate run move focus outside programmatically while
  open. Assert prevention leaves focus and open state for the application,
  while focus-leave requests close once and exit never steals the new outside
  focus.
- [x] `PO-FOCUS-09` `[reference]` `[browser]` —
  **Popover should leave outside focus in place when a controlled
  focus-leave dismissal is rejected.**
  Move focus from Content to an ordinary outside control, record the dismissal
  request, and keep `open={true}`. Assert Content remains controlled-open,
  outside focus stays on that control, and Popover performs neither a reclaim
  loop nor repeated dismissal requests from the unchanged focus state.

### Base placement and offset

- [x] `PO-POS-01` `[vendor]` `[unit]` —
  **Popover should compute correct coordinates when any supported placement is
  requested.**
  Feed fixed reference and floating rectangles through all 12
  top/right/bottom/left plus start/end placements with collision middleware
  disabled. Assert exact main-axis side and cross-axis alignment coordinates
  for every case, including unequal dimensions, without consulting DOM state.
- [x] `PO-POS-02` `[vendor]` `[unit]` —
  **Popover should preserve alignment when positive, zero, or negative
  main-axis offset is applied.**
  Compute representative centered, start, and end placements with concrete
  positive, `0`, and negative offsets. Assert only the placement's main-axis
  distance changes by that signed value and start/end anchoring remains exact,
  proving zero is not replaced by the eight-pixel default.
- [x] `PO-POS-03` `[vendor]` `[browser]` —
  **Popover should mirror logical alignment when inherited direction changes
  to RTL.**
  Position start- and end-aligned Content on each physical side under LTR,
  inherited RTL, and a dynamic direction change. Assert start/end coordinates
  swap on the logical cross axis while physical top, right, bottom, and left
  side selection and offset remain unchanged.
- [x] `PO-POS-04` `[reference]` `[browser]` —
  **Popover should keep placement finite and stable when geometry contains
  subpixels or fractional zoom.**
  Use fractional anchor/Content rects, device scale, and browser zoom, then
  sample several auto-update frames without other movement. Assert `top` and
  `left` remain finite, preserve the intended geometric relationship within
  tolerance, and do not alternate by a pixel across frames.
- [x] `PO-POS-05` `[vendor]` `[unit]` —
  **Popover should terminate positioning when middleware requests repeated
  resets.**
  Run a chain in which flip and arrow alignment can each request rect or
  placement resets and instrument each middleware pass. Assert a reset restarts
  the chain with current data, stops at the frozen bound of 50, and cannot
  produce an infinite flip/arrow loop or stale final coordinates.

### Flip, shift, and clipping

- [x] `PO-FLIP-01` `[vendor]` `[browser:all]` —
  **Popover should flip to the opposite side when its preferred side overflows
  and the opposite side fits.**
  Open Content near each viewport edge with a preferred side that cannot fit
  and enough room opposite it. Assert its bounding rect fits within collision
  padding, resolved `data-side` changes to the opposite physical side, and
  `data-align`/offset remain correct in all engines.
- [x] `PO-FLIP-02` `[vendor]` `[unit]` —
  **Popover should select the least-overflowing fallback when no placement
  fully fits.**
  Compute collisions with expanded fallback placements, including opposite
  alignments and perpendicular sides, under a boundary too small for Content.
  Assert the documented fallback order is evaluated and `bestFit` chooses the
  candidate with minimum measured overflow, covering Floating UI
  `flip.test.ts` (“fallbackPlacements: all” and `fallbackStrategy: "bestFit"`).
- [x] `PO-FLIP-03` `[vendor]` `[browser]` —
  **Popover should flip only alignment when start overflows but end fits on the
  same side.**
  Request a start-aligned placement whose side has room but whose start edge
  crosses the clipping boundary. Assert Content remains on the requested
  physical side, resolves to `data-align="end"`, and fits without an unnecessary
  opposite-side flip.
- [x] `PO-SHIFT-01` `[vendor]` `[browser:all]` —
  **Popover should shift within collision padding when Content partially
  overflows the viewport.**
  Open oversized or edge-adjacent Content that needs cross-axis correction but
  still overlaps its anchor, with the limiter enabled. Assert every Content
  edge stays inside the padded clipping rect and movement never detaches it
  beyond the limiter's allowed anchor relationship.
- [x] `PO-SHIFT-02` `[vendor]` `[browser]` —
  **Popover should include every clipping ancestor when nested overflow
  containers and scrollbars constrain it.**
  Place Trigger and portalled Content within nested scroll/clip ancestors that
  have borders and scrollbars, then move each ancestor. Assert resolved
  coordinates fit the intersection of their client clipping rects rather than
  only the viewport or border boxes.
- [x] `PO-SHIFT-03` `[reference]` `[browser]` —
  **Popover should honor each collision-padding edge when custom padding,
  including zero, is supplied.**
  Exercise top, right, bottom, and left collisions with concrete nonzero
  padding and repeat with `collisionPadding={0}`. Assert each Content edge
  clamps to the corresponding boundary plus its supplied value and zero is not
  replaced by the eight-pixel default.
- [x] `PO-HIDE-01` `[vendor]` `[browser]` —
  **Popover should report a hidden anchor without changing controlled open
  state when clipping fully obscures the reference.**
  Open Content, scroll or clip the entire Trigger/anchor out of its clipping
  rect, and then reveal it. Assert `data-anchor-hidden` appears while
  `open={true}` and Content remains mounted, then clears when visible without
  an unsolicited dismissal callback.
- [x] `PO-HIDE-02` `[vendor]` `[browser]` —
  **Popover should report escaped Content only when its floating rect has left
  the clipping context.**
  Move the floating element outside its clipping boundary independently of the
  anchor, sample `data-escaped`, and restore valid geometry. Assert the flag is
  present only for escaped geometry and clears on the next update rather than
  retaining stale middleware data.

### Arrow

- [x] `PO-ARROW-01` `[vendor]` `[browser:all]` —
  **Popover should center Arrow on its anchor when Content has enough usable
  cross-axis space.**
  Render varied anchor and Content sizes across all 12 placements with Arrow
  `edgePadding` that permits centering. Assert Arrow's cross-axis center matches
  the anchor center within tolerance, its owned coordinate is on the correct
  physical side, and the opposite coordinate is unset, covering Floating UI
  `arrow.test.ts` (“arrow should be centered to the reference …”).
- [x] `PO-ARROW-02` `[vendor]` `[browser]` —
  **Popover should clamp Arrow away from Content edges when `edgePadding`
  limits its centered position.**
  Use a small Content box, off-center anchor, rounded visual edges, and
  explicit positive `edgePadding` on horizontal and vertical sides. Assert the
  Arrow remains at least that inset from both cross-axis edges and reports the
  resulting nonzero center offset rather than overflowing.
- [x] `PO-ARROW-03` `[vendor]` `[unit]` —
  **Popover should terminate arrow alignment when its offset nudges Content
  during flip evaluation.**
  Compute an aligned placement where Arrow cannot center without moving
  Content and track middleware resets. Assert the alignment offset is applied
  once, subsequent flip logic recognizes it, and the chain produces stable
  finite coordinates instead of a flip-reset loop or doubled offset.
- [x] `PO-ARROW-04` `[reference]` `[browser]` —
  **Popover should omit Arrow coordinates when valid centering cannot be
  represented.**
  Supply degenerate, detached, or temporarily zero-size geometry that makes
  the Arrow coordinate or center offset non-finite, then recover valid rects.
  Assert invalid owned side styles are hidden or unset and never contain
  `NaNpx`/infinite values, while a later update restores valid positioning.

### Available size

- [x] `PO-SIZE-01` `[vendor]` `[unit]` —
  **Popover should compute available dimensions when preceding placement
  middleware has changed geometry.**
  Run concrete rects through offset, collision padding, flip, shift, and size
  in the frozen order, including overflow on both sides. Assert exact
  nonnegative available width and height from the final placement/clipping
  state, covering Floating UI `size.test.ts` (“fits the boundary when
  overflowing both sides …”).
- [x] `PO-SIZE-02` `[vendor]` `[browser]` —
  **Popover should update documented available-size properties when viewport or
  anchor geometry changes.**
  Open Content, record
  `--reference-overlay-available-width`/`-height`, then resize the viewport and
  move/resize the anchor. Assert both computed CSS properties track current
  finite pixel dimensions after each update and never retain values from the
  previous geometry.
- [x] `PO-SIZE-03` `[reference]` `[browser]` —
  **Popover should constrain a long Menu or Listbox when available height is
  smaller than its content.**
  Compose a long Menu/Listbox inside Content near a clipping edge and size its
  scroll region from the published available-height property. Assert Content
  remains inside the clipping viewport, the list scrolls internally to its
  final item, and document scrolling or item semantics are not broken.
- [x] `PO-SIZE-04` `[vendor]` `[browser]` —
  **Popover should settle without an observer loop when size middleware changes
  Content dimensions.**
  Make Content respond to the available-size CSS properties in a way that
  changes its measured rect and instrument ResizeObserver and position updates.
  Assert geometry converges, callbacks stop after the necessary frames, and no
  browser loop-limit error or continuous layout churn occurs.

### Virtual anchors

- [x] `PO-VIRTUAL-01` `[vendor]` `[browser]` —
  **Popover should position from a zero-size point when virtual anchor supplies
  only `x` and `y`.**
  Open Triggerless Content with a concrete `{x: 120, y: 80}` anchor and test
  representative sides and alignments. Assert the reference rect has implicit
  zero width/height and Content's placement and offset originate from that
  exact point.
- [x] `PO-VIRTUAL-02` `[vendor]` `[browser]` —
  **Popover should use full virtual geometry when anchor supplies dimensions or
  a DOMRect.**
  Position Content from `{x, y, width, height}` and an equivalent `DOMRect`
  across side and start/end placements. Assert offsets and alignment derive
  from all four rect edges, producing the same public coordinates for
  equivalent inputs rather than collapsing them to a point.
- [x] `PO-VIRTUAL-03` `[vendor]` `[browser]` —
  **Popover should read current virtual geometry when
  `getBoundingClientRect()` changes while open.**
  Supply a virtual object whose method returns one rect, mutate it to a second
  rect, and trigger auto-update. Assert Content moves to the second finite
  placement without remounting and never reuses stale coordinates from the
  first result.
- [x] `PO-VIRTUAL-04` `[vendor]` `[browser]` —
  **Popover should follow the correct environment when an Element is used as
  the anchor.**
  Anchor Content to an Element inside nested scrollers and then to one in a
  same-origin document context, scrolling its ancestors while open. Assert
  position updates use that Element's owner window, document, and overflow
  ancestors rather than the React root or global document.
- [x] `PO-VIRTUAL-05` `[reference]` `[browser]` —
  **Popover should split interaction from geometry when both Trigger and
  `anchor` are supplied.**
  Render a button Trigger and a spatially separate virtual anchor, activate by
  click/keyboard, focus Content, and dismiss. Assert Trigger owns
  `aria-expanded`/`aria-controls`, callbacks, source-order bridge, and focus
  restore, while Content coordinates follow only the virtual anchor.
- [x] `PO-VIRTUAL-06` `[reference]` `[browser]` —
  **Popover should discard stale virtual geometry when anchor is replaced or
  removed while open.**
  Rerender from one valid virtual anchor to another and then to no valid anchor
  while Content remains controlled open. Assert each valid replacement drives
  the next position, removal follows the documented unavailable-anchor state
  without throwing or emitting stale coordinates, and old observers detach.

### Scroll-close policy

- [x] `PO-SCROLL-01` `[reference]` `[browser:all]` —
  **Popover should reposition instead of dismissing on ancestor scroll when
  closeOnScroll is omitted or false.**
  Open omitted and explicit-false fixtures beneath scrolling ancestors of both
  Trigger and Content, move each ancestor, and inspect geometry and callback
  logs. Assert Content tracks the live anchor through `autoUpdate`, no
  dismissal callback runs, and the two forms are equivalent. Living position
  is the general interactive-Popover default.
- [x] `PO-SCROLL-02` `[vendor]` `[browser]` —
  **Popover should request one dismissal when a relevant anchor ancestor
  scrolls and closeOnScroll is true.**
  Open with `closeOnScroll`, scroll the Trigger's nearest and outer overflow
  ancestors repeatedly, and reject the controlled close request. Assert one
  granular scroll-owned dismissal intent followed by one `onDismiss`, no
  callback spam from the same scroll sequence, and no stale position update
  after acceptance. This centralizes React Aria's close-on-scroll behavior for
  Combobox and other anchored consumers.
- [x] `PO-SCROLL-03` `[vendor]` `[browser]` —
  **Popover closeOnScroll should ignore unrelated scrolling and text-field
  self-scroll that does not move the anchor.**
  Open beside an unrelated scroll region and from an overflowing input or
  textarea Trigger, then scroll each region and the field's own text content.
  Assert no dismissal, descriptor/relationship change, or remount until a
  composed ancestor that moves the anchor scrolls. This preserves native
  editing while distinguishing geometry movement from any `scroll` event.
- [x] `PO-SCROLL-04` `[vendor]` `[shadow]` —
  **Popover closeOnScroll should discover relevant overflow ancestors across
  open ShadowRoots.**
  Place Trigger beneath nested shadow scrolling ancestors, portal Content to
  its documented root, and also scroll an unrelated shadow sibling. Assert
  each composed Trigger ancestor requests one close through current handlers,
  unrelated scrolling remains silent, and retargeting cannot hide or duplicate
  the source. Tooltip and Combobox need only integration smokes for this
  engine-owned path.

### Auto-update environments

- [x] `PO-AUTO-01` `[vendor]` `[browser:all]` —
  **Popover should track its anchor when any reference or floating overflow
  ancestor scrolls.**
  Put Trigger and Content under distinct nested overflow ancestors, scroll each
  independently in all engines, and record rect relationships and callbacks.
  Assert Content recomputes against the anchor after every scroll without
  dismissal or stale side hooks, covering Floating UI `autoUpdate.test.ts`
  `ancestorScroll` cases.
- [x] `PO-AUTO-02` `[vendor]` `[browser:all]` —
  **Popover should recompute when viewport, anchor, or Content dimensions
  change.**
  Resize the window, resize an overflow ancestor, and trigger ResizeObserver
  changes on both reference and Content while open. Assert coordinates,
  resolved placement, available size, and Arrow update after each change with
  one current observer path.
- [x] `PO-AUTO-03` `[vendor]` `[browser]` —
  **Popover should follow anchor layout shifts only when Content is live.**
  Move, insert around, and remove content before the anchor without scrolling,
  then close Popover and repeat the mutation. Assert open Content tracks the
  final anchor promptly, including two moves during one refresh, while closed
  state performs no further position updates, covering Floating UI
  `autoUpdate.test.ts` `layoutShift` cases.
- [x] `PO-AUTO-04` `[vendor]` `[browser:all]` —
  **Popover should retain finite geometric alignment when browser zoom or the
  visual viewport changes.**
  Open near an edge, change browser zoom where supported, then resize and offset
  the visual viewport. Assert Content remains aligned to the visible anchor
  within tolerance, stays in clipping bounds, and never emits `NaN`,
  infinity, or coordinates from the layout viewport alone.
- [x] `PO-AUTO-05` `[vendor]` `[shadow]` —
  **Popover should discover composed overflow ancestry when anchor or Content
  crosses an open ShadowRoot.**
  Place anchor and custom-portalled Content inside the same and then different
  open shadow trees, with scrolling ancestors on both sides. Assert every
  relevant composed ancestor triggers updates and geometry uses the correct
  owner window despite retargeted nodes.
- [x] `PO-AUTO-06` `[vendor]` `[browser]` —
  **Popover should calculate in the correct coordinate space when anchor or
  portal is in a same-origin iframe.**
  Exercise an iframe anchor with local and outer scrolling and a destination
  in the supported document context. Assert Content rect, clipping, offset
  parent, listeners, and callbacks belong to the intended owner document and
  do not mix frame-relative with top-window coordinates.
- [x] `PO-AUTO-07` `[vendor]` `[browser]` —
  **Popover should preserve clipping and offset calculations when a native
  top-layer popover is an ancestor.**
  Open Reference UI Content from an anchor inside an active native popover/top
  layer and move both near clipping edges. Assert resolved side and rect remain
  anchored in the visible coordinate space without a transformed or missing
  offset parent corrupting placement.
- [x] `PO-AUTO-08` `[reference]` `[browser]` —
  **Popover should replace auto-update resources when it closes, unmounts, or
  reopens.**
  Instrument scroll/resize listeners, ResizeObserver, IntersectionObserver, and
  animation-frame work across open, close, direct unmount, and reopen. Assert
  every old resource detaches at its documented boundary, closed mutations do
  nothing, and reopen creates exactly one current listener/observer set.
- [x] `PO-AUTO-09` `[vendor]` `[browser]` —
  **Popover should use the correct containing-block chain when fixed content
  is nested inside a modal and transformed ancestors.**
  Place an anchor inside a transformed or filtered outer containing block and
  a native or Reference UI dialog, position fixed Content from it, then move
  both ancestors. Assert finite coordinates remain aligned in the actual
  containing block, clipping and resolved side stay correct, and no offset is
  counted twice. This ports Floating UI `top-layer.test.ts` “fixed inside
  dialog with outer containing block” and its inverse inner-floating case.

### Presence

- [x] `PO-PRES-01` `[reference]` `[browser:all]` —
  **Popover should keep its floating subtree positioned when controlled close
  starts an exit.**
  Open Content and Arrow with explicit transitions, set `open={false}`, and
  sample state and geometry before final end events. Assert both receive closed
  state, retain their last valid positioning throughout owned exit, and unmount
  only after completion in each browser engine.
- [x] `PO-PRES-02` `[reference]` `[browser]` —
  **Popover should resume the current lifecycle when it reopens during exit.**
  Begin an animated close, capture Content and Arrow identities, reopen before
  completion, then fire stale and current end events while moving the anchor.
  Assert the same nodes return to open state, auto-update resumes, and stale
  completion cannot unmount or unregister the live Popover.
- [x] `PO-PRES-03` `[reference]` `[browser]` —
  **Popover should close immediately when reduced motion or zero duration means
  no exit event will occur.**
  Set `open={false}` under zero effective CSS motion and under
  `prefers-reduced-motion`, then observe one completed update turn. Assert
  Content/Arrow unmount and positioning listeners plus active layer
  registration clean without waiting for a phantom event.
- [x] `PO-PRES-04` `[reference]` `[browser]` —
  **Popover should separate logical dismissal from delayed focus and branch
  cleanup when Content exits.**
  Focus Content, accept a dismissal into an animated exit, and finish an
  unrelated descendant animation before the owned Content transition. Assert
  the active dismissal-layer entry disappears at logical close, while focus
  restore and parent FocusLock branch removal wait for the owned exit and occur
  once.
- [x] `PO-PRES-05` `[reference]` `[browser]` —
  **Popover should make exiting Content non-interactive when it remains mounted
  for animation.**
  Start a long exit and attempt pointer activation, sequential/programmatic
  focus, accessibility queries, repeated Escape/outside input, and interaction
  with a newly live lower layer. Assert exiting Content remains geometrically
  positioned but inert, pointer-inactive, accessibility-hidden and untabbable,
  emits no second dismissal, and cannot block the next layer.

### Interactive hover (`openOnHover`)

- [x] `PO-HOVER-01` `[convergence]` `[browser]` —
  **Popover should issue one delayed open request when a mouse remains over an
  `openOnHover` Trigger.**
  Enter Trigger with a real mouse, sample before and at concrete `openDelay`,
  and repeat while leaving before the deadline. Assert the sustained path calls
  `onOpen` once only after the delay and the early leave permanently cancels
  its pending timer.
- [x] `PO-HOVER-02` `[convergence]` `[browser]` —
  **Popover should stay open when the pointer travels diagonally from Trigger
  toward interactive Content.**
  With controlled open Content separated from Trigger, sample a diagonal mouse
  path through the documented padded safe polygon and end inside Content.
  Assert no close timer or `onDismiss` starts at any point, preserving access
  across the physical portal gap.
- [x] `PO-HOVER-03` `[convergence]` `[browser]` —
  **Popover should request delayed close when the pointer leaves the safe
  region and should cancel it on reentry.**
  Move from an open Trigger along a path outside the Trigger/Content polygon,
  sample before and after `closeDelay`, and repeat with reentry before expiry.
  Assert the sustained-away path calls `onDismiss` once after the delay while
  reentry cancels the timer without reopening or another callback.
- [x] `PO-HOVER-04` `[vendor]` `[browser]` —
  **Popover should preserve one open interaction when the pointer moves from
  Content back to Trigger through their padded gap.**
  Traverse Content → padded corridor → Trigger and sample node identity,
  callback logs, and coordinates throughout. Assert no close/open request,
  remount, or positioning restart occurs while the pointer remains inside the
  combined interactive region.
- [x] `PO-HOVER-05` `[vendor]` `[browser]` —
  **Popover should leave hover grace when pointer travel is slow, reversed, or
  crosses the side opposite Content.**
  From Trigger, sample each away-intent path while Content is open and advance
  the close timer. Assert every path exits grace and requests one delayed close
  rather than indefinitely treating arbitrary space as safe, matching the
  away-corridor cases in Base UI `safePolygon.test.ts`.
- [x] `PO-HOVER-06` `[reference]` `[rtl]` —
  **Popover should mirror safe hover geometry when placement, alignment,
  collision, or direction changes.**
  Parameterize every physical side, start/end alignment, a collision-flipped
  result, and inherited RTL, then sample a path toward Content and its mirrored
  away path. Assert the toward path remains open and the away path requests
  close in every resolved geometry, using `data-side` rather than stale
  preferred placement.
- [x] `PO-HOVER-07` `[vendor]` `[browser]` —
  **Popover should remain open when Trigger is clicked within the
  300-millisecond impatient window after hover-open.**
  Hover through `openDelay`, accept controlled open, and click Trigger before
  the frozen impatient-click threshold elapses. Assert native consumer click
  still runs but no `onDismiss` request toggles the just-opened Popover, which
  protects the user's likely intent to open.
- [x] `PO-HOVER-08` `[reference]` `[browser]` —
  **Popover should use normal Trigger dismissal when a deliberate click occurs
  after the patient threshold.**
  Hover-open and keep controlled Content open beyond 300 milliseconds, then
  click Trigger. Assert consumer click runs first followed by exactly one
  `onDismiss`, and controlled state remains open until the parent accepts.
- [x] `PO-HOVER-09` `[reference]` `[touch]` —
  **Popover should avoid mouse-intent timers when touch or non-hover pen input
  synthesizes pointer entry.**
  Send touch pointer enter/move and pen sequences with and without hover
  capability over a closed `openOnHover` Trigger, then advance all delays.
  Assert touch and non-hover pen emit no `onOpen`, while any supported pen-hover
  policy is determined by pointer capability rather than a synthetic mouse
  event.
- [x] `PO-HOVER-10` `[reference]` `[browser]` —
  **Popover should stay open when pointer or focus remains in interactive hover
  Content.**
  Put links, buttons, and inputs in Content, move the pointer there, then move
  keyboard focus among controls while pointer and focus alternately leave one
  region but not both. Assert no hover dismissal while either modality remains
  inside Trigger/Content and native control interaction continues normally.
- [x] `PO-HOVER-11` `[convergence]` `[browser]` —
  **Popover should share one open intent when keyboard focus drives an
  `openOnHover` instance.**
  Tab to Trigger without mouse entry, accept its immediate open request, move
  focus into Content, then move focus outside both and optionally click
  Trigger. Assert focus opens without hover delay, Content focus keeps it open,
  leaving both requests one close, and overlapping focus/click signals do not
  duplicate requests.

### Layer smoke and SSR

- [x] `PO-LAYER-01` `[reference]` `[browser]` —
  **Popover should register once when it is a child layer and focus branch of
  Overlay or Menu.**
  Open a Popover from each parent, inspect behavior through focus entry, one
  top-layer Escape/outside request, and exit. Assert one shared layer entry and
  one parent FocusLock branch exist for the live Content, then clean at their
  documented points; the complete ordering matrix remains owned by Overlay.
- [x] `PO-ENV-01` `[reference]` `[ssr]` —
  **Popover should server-render safely when closed and open later after
  hydration.**
  Render a closed Trigger/Content declaration without DOM or layout globals,
  hydrate in a browser, and activate Trigger. Assert no server access or
  hydration warning, stable generated ID relationships, and positioning,
  portal, and observer work only after client open.
- [x] `PO-ENV-02` `[reference]` `[react:all]` —
  **Popover should perform one current side effect when React version or
  StrictMode replays lifecycle work.**
  Run click, hover timer, auto-update, dismissal, and exit fixtures under React
  17, 18, and 19 with applicable StrictMode replay. Assert one portal subtree,
  observer set, live layer registration, timer, and callback per physical
  action, followed by one cleanup.
- [x] `PO-ENV-03` `[reference]` `[browser:all]` —
  **Popover should preserve positioning and interaction contracts when the
  browser engine changes.**
  Run representative flip/shift/Arrow, scroll/resize auto-update, outside
  dismissal, animated Presence, and diagonal hover-grace fixtures in Chromium,
  Firefox, and WebKit. Assert equivalent public rect relationships, state
  hooks, callback order, node lifecycle, and timer outcomes in all engines.
- [x] `PO-A11Y-01` `[reference]` `[browser]` —
  **Popover should pass accessibility checks when used with triggered,
  interactive, virtual-anchor, and custom-portal compositions.**
  Check controlled Trigger state and interactive Content, then a no-Trigger
  virtual-anchor fixture and one using a custom destination. Assert every
  authored role/name and ID relationship is valid, no hidden Trigger is
  invented, portal relocation introduces no duplicate IDs, and automated
  checks report no new violations.

## Composition gates

- [x] `PO-COMP-01` `[reference]` `[browser]` —
  **Popover should preserve form interaction when a Triggered filters popup
  contains multiple controls.**
  Build a filters Popover with text input, checkboxes, apply/cancel buttons,
  and source-order controls around Trigger, then open, Tab through, edit, and
  dismiss. Assert native values and handlers work, Tab bridges into and out of
  portalled Content, controlled dismissal restores appropriately, and no modal
  lock is introduced.
- [x] `PO-COMP-02` `[reference]` `[browser]` —
  **Popover should position and dismiss correctly when a context or selection
  popup uses a virtual anchor without Trigger.**
  Open Content from a pointer point and then a changing selection `DOMRect`,
  move the virtual geometry, and dismiss by Escape/outside input. Assert no
  trigger DOM or guessed ARIA appears, coordinates follow the latest full rect,
  callbacks run once in order, and no nonexistent Trigger receives focus
  restore.
- [x] `PO-COMP-03` `[reference]` `[browser]` —
  **Popover should keep a HoverCard usable when collision flips Content during
  diagonal pointer travel.**
  Build `openOnHover` interactive preview Content near a clipping edge, hover
  through delay, force an opposite-side flip, and move diagonally through the
  resolved safe corridor into a control. Assert `data-side` reflects the flip,
  the path emits no close/reopen churn, interaction works, and an away path
  requests delayed close once.

## Owned elsewhere

- Shared layer Escape/outside/cascade matrix: `Overlay`; the isolating extension-
  overlay case stays there while `PO-CLOSE-07` freezes Popover's non-isolating
  inverse.
- Trigger activation, Tab-order bridge, `closeOnScroll` kernel: `Overlay`
  `OV-TRG-*` / `OV-SCRL-*`.
- Geometry engine (flip/shift/offset/arrow/size/hide/autoUpdate/virtual
  element): `Overlay` `OV-POS-*`.
- Portal destination matrix: `Portal`.
- Exit detection: `Presence`.
- Non-interactive hover description policy: `Tooltip`.

## Out of scope

- Floating UI React's `useDismiss`, `FloatingTree`, or focus manager; modal
  Popover; focus trap/inert/scroll lock; cursor-follow APIs; visual snapshots.
