# Overlay test contract

Playwright: `matrix/lib/tests/e2e/overlay.spec.ts`  
Page: `/overlay`

Overlay owns the modal layer kernel **and** the Floating UI geometry port:
portal, one shared layer stack, controlled dismissal, FocusLock, branch/shard
registration, background inerting, scroll lock, Presence, restore-after-exit,
and anchored `computePosition` / `autoUpdate` when `anchor` is set.

## Freeze decision

Overlay is always modal/isolating. Its API has no `modal` flag. Popover covers
non-modal floating content by consuming Overlay geometry without Overlay
isolation. Semantic role remains application markup: dialog, alertdialog,
drawer, sheet, and lightbox are compositions.

Without `anchor`, Overlay writes no coordinates. With `anchor`, Content is
the floating element and geometry defaults match the ported engine:
`placement="bottom-start"`, `offset=8`, `collisionPadding=8`, absolute
strategy, flip/shift enabled. `Overlay.Arrow` participates only while
anchored.

AlertDialog's non-dismissible Escape policy is authored by preventing
`onEscape`; Overlay does not infer behavior from a role string.

## Source evidence

- `vendor/radix-primitives/packages/react/dismissable-layer/src/dismissable-layer.test.tsx`
  — outside/inside/branch detection, cancellation, touch deferral, shadow
  paths, extension overlays, child-before-parent races, and latest callbacks.
- `vendor/radix-primitives/e2e/{dialog,popover,dropdown-menu,context-menu,select,menubar}.spec.ts`
  — topmost Escape, nested outside press, focus trap/removal, pointer-events
  teardown, and repeated copies consolidated here.
- React Aria overlay tests — `usePreventScroll`, `ariaHideOutside`,
  `useInteractOutside`, Shadow DOM, nested/out-of-order modals, and dynamic DOM.
- `vendor/react-remove-scroll`, `aria-hidden`, `inert`, FocusLock sources/tests,
  and a11y-dialog — scroll, background isolation, focus, and vanilla dialog
  behavior.
- Zag dismissable/layer-stack — parent cascade and recently-removed focus race.
- `vendor/floating-ui/packages/{core,dom}` and
  `packages/dom/test/functional/{flip,shift,offset,arrow,size,hide,autoUpdate,scroll,iframe,shadow-dom,top-layer,virtual-element,zoom}.test.ts`
  — the geometry engine Overlay ports. `@floating-ui/react` remains leave.

## Part contract

`Overlay.Backdrop` and `Overlay.Content` are fixed
`ReferencePartProps<"div">` parts. `Overlay.Arrow` is a fixed
`ReferencePartProps<"div">` part that only participates while anchored.
`Overlay` and `Overlay.Portal` are
transparent; all five run the applicable shared `PART-*` type, DOM, StyleProps,
ref, event, state, control, and default checks from `TESTING.md`. Cases below
add only Overlay-specific anatomy and behavior/style conflicts.

## Required cases

### DOM, portal, and controlled state

- [ ] `OV-DOM-01` `[reference]` `[browser]` —
  **Overlay should render only its authored Backdrop and Content nodes when it
  uses the default portal.**
  Mount an open Overlay with its transparent root and Portal configuration,
  one Backdrop, and one Content. Assert that Backdrop and Content are separate
  sibling `div` elements under `document.body` and that Overlay and Portal add
  no host nodes; this freezes the public anatomy before interaction behavior.
- [ ] `OV-DOM-02` `[reference]` `[browser]` —
  **Overlay should leave dialog semantics and presentation to the application
  when unanchored Content is rendered without semantic props.**
  Mount an open Overlay with otherwise bare Backdrop and Content parts, no
  `anchor`, and inspect the public DOM. Assert that it invents no trigger,
  role, label, `aria-modal`, heading, close button, coordinates, or
  appearance, because dialog, alertdialog, drawer, sheet, and lightbox remain
  compositions and unanchored geometry stays application CSS.
- [ ] `OV-DOM-03` `[reference]` `[browser]` —
  **Overlay should keep lifecycle state authoritative when Backdrop and Content
  also use token-aware visual StyleProps.**
  Give both fixed `ReferencePartProps<"div">` parts unrelated base and
  responsive StyleProps, then drive controlled open and Presence exit. Assert
  synchronized `data-state="open"|"closed"` on both parts while their computed
  visual styles remain intact; generic prop, ref, event, and StyleProps coverage
  belongs to the shared `PART-*` matrix.
- [ ] `OV-DOM-04` `[reference]` `[browser]` —
  **Overlay should use the requested Portal destination without a wrapper when
  an element, ref, or function container is supplied.**
  Parameterize `Overlay.Portal` over a direct element, mutable ref, and
  destination function, then open the Overlay after each target is available.
  Assert Backdrop and Content move through Portal into the resolved container
  and no configuration host appears in either source or destination DOM.
- [ ] `OV-DOM-05` `[reference]` `[browser]` —
  **Overlay should render no modal parts when it initially mounts closed
  without an active exit.**
  Mount `open={false}` with authored Backdrop and Content and no preceding open
  lifecycle. Assert that neither part nor a portal payload is present and that
  no focus lock, inerting, layer registration, or scroll lock is observable.
- [ ] `OV-DOM-06` `[reference]` `[browser]` —
  **Overlay should follow only the controlled prop when the application opens
  or closes it programmatically.**
  Rerender the same fixture from `open={false}` to `true` and back to `false`,
  completing any owned exit without keyboard or pointer input. Assert the DOM
  and `data-state` follow each prop value while `onEscape`, `onOutsidePress`,
  and `onDismiss` are never called.
- [ ] `OV-DOM-07` `[reference]` `[browser]` —
  **Overlay should remain fully modal when the parent rejects a dismissal
  request.**
  Open a controlled Overlay, trigger one permitted Escape or outside-press
  request, log the callbacks, and deliberately keep `open={true}`. Assert open
  DOM, focus containment, background inerting, layer order, and scroll lock all
  remain active; a callback request must not impersonate accepted state.
- [ ] `OV-DOM-08` `[reference]` `[browser]` —
  **Overlay should fail atomically when one instance defines duplicate
  Backdrop or Content parts.**
  Mount separate fixtures with two Backdrops and with two Contents and capture
  the development diagnostic. Assert a descriptive single-part error names
  the duplicated anatomy and that no portal payload, layer entry, focus lock,
  inert state, or scroll lock is partially activated.
- [ ] `OV-DOM-09` `[reference]` `[browser]` —
  **Overlay should validate its complete anatomy when an open instance has
  missing or duplicate structural parts.**
  Exercise exactly one Content with zero or one Backdrop and zero or one Portal
  as valid shapes, then omit Content or duplicate Content, Backdrop, or Portal.
  Assert valid shapes activate one modal system, while every invalid shape
  reports the missing or duplicate part and leaves no partially managed layer.

### Escape ordering and cancellation

- [ ] `OV-ESC-01` `[vendor]` `[browser:all]` —
  **Overlay should request one dismissal after its granular callback when
  Escape reaches the active layer.**
  Open one controlled Overlay, focus a control in Content, press the physical
  Escape key, and record callback order and event identity. Assert exactly
  `onEscape(event)` followed by `onDismiss()` once, with focus and controlled
  DOM unchanged until the parent accepts the request.
- [ ] `OV-ESC-02` `[vendor]` `[browser]` —
  **Overlay should remain open when its granular Escape callback prevents the
  default dismissal.**
  Open a controlled Overlay whose `onEscape` calls `event.preventDefault()`,
  focus inside Content, and press Escape. Assert `onEscape` receives the
  keyboard event once, `onDismiss` is not called, and the controlled layer,
  focus lock, inerting, and scroll lock remain active.
- [ ] `OV-ESC-03` `[vendor]` `[browser]` —
  **Overlay should use current callbacks when Escape occurs after a rerender.**
  Rerender an open Overlay from an unblocked handler to a latest closure that
  reads updated state and prevents Escape, then press Escape. Assert only the
  current closure observes the key and `onDismiss` stays at zero, matching
  Radix `dismissable-layer.test.tsx` (“calls the latest escape key handler
  after re-rendering” and “observes the latest state when preventing escape
  dismissal”).
- [ ] `OV-ESC-04` `[vendor]` `[browser]` —
  **Overlay should route Escape to only the top layer when controlled layers
  are nested.**
  Open a parent Overlay and a registered child layer, press Escape inside the
  child, accept only the child's request, and then press Escape again after it
  closes. Assert the first key calls only the child's granular and dismissal
  callbacks and the second reaches the parent, as in Radix
  `e2e/dialog.spec.ts` (“pressing Escape closes only the dropdown”).
- [ ] `OV-ESC-05` `[reference]` `[browser]` —
  **Overlay should ignore inactive and foreign-document layers when Escape is
  pressed in the active document.**
  Keep one layer closed or exiting in the main document and another open in a
  same-origin iframe, then activate a live main-document Overlay and press
  Escape there. Assert only that document's top live layer receives callbacks;
  exiting and iframe stacks do not intercept or reorder the event.
- [ ] `OV-ESC-06` `[reference]` `[browser]` —
  **Overlay should support a non-dismissible AlertDialog when the application
  prevents Escape.**
  Compose Content as `role="alertdialog"`, explicitly focus its destructive
  control, make `onEscape` call `preventDefault()`, and press Escape. Assert the
  granular callback runs once, `onDismiss` does not run, focus stays contained,
  and the dialog remains open without Overlay inferring policy from the role.
- [ ] `OV-ESC-07` `[convergence]` `[browser]` —
  **Overlay should wait to handle Escape when a native top-layer popover
  consumes the first key.**
  Open an Overlay containing an active element using the browser's native
  popover top layer, focus within that top layer, and press Escape twice.
  Assert the first key closes only the native popover with no Overlay callback
  and the later key requests Overlay dismissal, preserving browser top-layer
  precedence.

### Outside press

- [ ] `OV-OUT-01` `[vendor]` `[browser:all]` —
  **Overlay should request dismissal in granular-first order when a primary
  pointer sequence lands on its Backdrop.**
  Open one controlled Overlay and perform a real primary mouse sequence on
  that Overlay's registered Backdrop. Assert exactly one
  `onOutsidePress(pointerEvent)` followed by one `onDismiss()`, while the
  background control receives no activation and controlled state changes only
  if the parent accepts.
- [ ] `OV-OUT-02` `[vendor]` `[browser]` —
  **Overlay should not request dismissal when pointer interaction stays inside
  Content.**
  Open the Overlay and perform primary pointer sequences on Content itself and
  on ordinary nested buttons, text, and non-portalled descendants. Assert
  `onOutsidePress` and `onDismiss` remain uncalled and the layer stays active,
  matching Radix `dismissable-layer.test.tsx` (“does not dismiss on pointer
  down inside”).
- [ ] `OV-OUT-03` `[vendor]` `[browser]` —
  **Overlay should skip high-level dismissal when the application prevents an
  outside-press event.**
  Open a controlled Overlay whose `onOutsidePress` records the public pointer
  event and calls `preventDefault()`, then press its Backdrop. Assert the
  granular callback runs once with intact pointer metadata, `onDismiss` does
  not run, and modal state remains active, matching Radix
  `dismissable-layer.test.tsx` (“does not dismiss when pointer down outside is
  prevented”).
- [ ] `OV-OUT-04` `[vendor]` `[browser]` —
  **Overlay should not immediately dismiss when the pointerdown that opens it
  is also outside its newly mounted Content.**
  Start closed and have a source control set `open={true}` from its primary
  `pointerdown`, allowing document listeners to settle normally. Assert that
  the opening event produces no `onOutsidePress` or `onDismiss`, Content stays
  open, and only a later independent outside sequence can request close.
- [ ] `OV-OUT-05` `[vendor]` `[browser]` —
  **Overlay should ignore dismissal when a non-primary mouse or pen barrel
  button interacts with Backdrop.**
  Right-click the Backdrop and repeat with a pen barrel-button sequence,
  including the later `contextmenu` event. Assert no `onOutsidePress` or
  `onDismiss` callback and no delayed duplicate; this frozen policy conflicts
  with current Radix `dismissable-layer.test.tsx` (“dismisses immediately on
  non-primary mouse pointer down outside” and its pen equivalent).
- [ ] `OV-OUT-06` `[vendor]` `[touch]` —
  **Overlay should cancel stale outside dismissal when a deferred touch
  sequence returns inside or is canceled before click.**
  Touch Backdrop and verify no callback at `pointerdown`, then either complete
  the matching click, move down inside Content first, or cancel before click.
  Assert only the uninterrupted outside sequence requests one dismissal and
  the other paths stay silent, matching Radix `dismissable-layer.test.tsx`
  (“defers touch pointer down outside dismissal until click” and “cancels
  pending touch outside dismissal when pointer down moves back inside”).
- [ ] `OV-OUT-07` `[vendor]` `[browser]` —
  **Overlay should stay open when an unregistered extension overlay stops the
  later events of a deferred outside sequence.**
  Open an extension/password-style sibling overlay outside Content whose
  `mousedown`, `mouseup`, and `click` handlers stop propagation, then activate
  its control. Assert no deferred `onOutsidePress` or `onDismiss` occurs,
  preserving Radix `e2e/dialog.spec.ts` (“keeps the dialog open when an outside
  overlay stops later mouse events”).
- [ ] `OV-OUT-08` `[vendor]` `[browser]` —
  **Overlay should still dismiss when its registered Backdrop stops a later
  click from propagating.**
  Register Backdrop as the layer's dismiss surface, stop propagation from its
  click handler, and perform a complete primary sequence there. Assert one
  granular outside callback and one dismissal request despite the stopped
  click, matching Radix `dismissable-layer.test.tsx` (“dismisses when a
  registered dismiss surface stops propagation”).
- [ ] `OV-OUT-09` `[vendor]` `[shadow]` —
  **Overlay should classify composed shadow events by their real path when
  shadow trees are inside or outside Content.**
  Put one open ShadowRoot under Content and a sibling ShadowRoot behind the
  layer, then dispatch real composed primary pointer sequences from each.
  Assert the inner path triggers no dismissal, while the sibling path follows
  outside policy and remains isolated from background activation, as in Radix
  `dismissable-layer.test.tsx` (“treats a shadow tree inside the layer as
  inside”).
- [ ] `OV-OUT-10` `[reference]` `[browser]` —
  **Overlay should avoid a second dismissal path when focus moves during a
  deferred stopped pointer interaction.**
  Begin an outside deferred pointer sequence on an unregistered control that
  stops later mouse and click events, move focus to it before release, and
  complete the sequence. Assert neither focus movement nor the blocked pointer
  path calls `onDismiss`, matching Radix `dismissable-layer.test.tsx` (“does
  not dismiss when focus moves outside during a deferred stopped
  interaction”).
- [ ] `OV-OUT-11` `[reference]` `[browser]` —
  **Overlay should retain cancelable geometric outside dismissal when no
  Backdrop part is authored.**
  Mount valid open Content without Backdrop, place a background control beyond
  its bounding rect, and perform a primary pointer sequence in that outside
  region with and without `onOutsidePress.preventDefault()`. Assert the normal
  path calls granular then high-level dismissal, the prevented path skips
  `onDismiss`, and the actual background control remains inert and unactivated.

### Shared layer stack and branches

- [ ] `OV-LAYER-01` `[vendor]` `[browser]` —
  **Overlay should treat portalled child popup content as inside when a nested
  Popover or Menu is used.**
  Open a parent Overlay and a registered child popup whose Content portals
  outside the parent's DOM subtree, then interact inside the child. Assert
  neither child nor parent receives an outside or dismissal request merely
  because `Node.contains` is false; the node is one dismiss branch and
  FocusLock shard.
- [ ] `OV-LAYER-02` `[vendor]` `[browser]` —
  **Overlay should dismiss only the child layer when a press is inside the
  parent but outside that child.**
  Open nested parent and child layers, then press a parent Content control that
  is outside the child's portalled Content. Assert the child receives
  `onOutsidePress` then `onDismiss` once and the parent receives neither,
  matching Radix `e2e/dialog.spec.ts` (“dismissing the dropdown does not close
  the dialog”).
- [ ] `OV-LAYER-03` `[convergence]` `[browser]` —
  **Overlay should let only the child handle one outside event when a press is
  outside both parent and non-modal child.**
  Open a modal parent with a non-modal registered child and press once beyond
  both layer regions. Assert child granular and dismissal callbacks run first
  while the parent receives no stale request from that event. Reference UI
  freezes one physical event to one topmost layer; closing a parent may
  explicitly cascade descendants, but accepting a child request must not
  reinterpret the already-consumed event for its parent. This intentionally
  differs from Radix `e2e/popover.spec.ts` “dismisses both the popover and the
  dialog when clicking outside both layers.”
- [ ] `OV-LAYER-04` `[vendor]` `[touch]` —
  **Overlay should not dismiss a deferred modal parent when the same outside
  touch already dismissed its child.**
  Open a deferred modal parent and live child layer, then perform one complete
  outside touch tap and accept the child's close. Assert one child request and
  no later parent request from the delayed click, matching Radix
  `dismissable-layer.test.tsx` (“does not dismiss a deferred modal parent when
  a nested layer is dismissed by an outside touch tap”).
- [ ] `OV-LAYER-05` `[vendor]` `[browser]` —
  **Overlay should clear deferred parent state when a child layer dismisses
  first during an outside interaction.**
  Open a deferred parent and immediate child, perform one outside mouse
  sequence, and remove the child after accepting its request. Assert the
  parent's pending interaction is canceled and never fires after child
  removal, matching Radix `dismissable-layer.test.tsx` (“does not dismiss a
  deferred parent when a child layer dismisses first”).
- [ ] `OV-LAYER-06` `[convergence]` `[browser]` —
  **Overlay should tear down descendants deepest-first when a controlled parent
  closes.**
  Open a parent with multiple nested layers, change the parent to closed, and
  observe descendant dismissal/removal and focus events through final exit.
  Assert descendant requests or removals occur deepest-first, only the outer
  restoration survives, and focus from a recently removed child cannot
  outside-dismiss another ancestor.
- [ ] `OV-LAYER-07` `[reference]` `[browser]` —
  **Overlay should share top-layer ordering when sibling instances live in
  independent React roots.**
  Mount one open Overlay in each of two roots in the same document, activate
  them in a known order, and send Escape and outside presses. Assert only the
  most recently active live layer receives each event and the older layer
  resumes after the newer one closes.
- [ ] `OV-LAYER-08` `[reference]` `[browser]` —
  **Overlay should retain a valid stack when layers are removed out of
  registration order.**
  Open three related and sibling layers, unmount the middle and then another
  non-top layer, and inspect behavior after each removal. Assert dead layers
  and branch registrations cannot receive events, the remaining order is
  stable, and the next live top layer resumes Escape and outside handling.
- [ ] `OV-LAYER-09` `[reference]` `[browser]` —
  **Overlay should update dismissal and focus membership together when a
  registered branch mounts, reparents, or unmounts.**
  While a parent is open, dynamically add a portalled child branch, move its
  node between valid containers, and remove it while sending focus and pointer
  input. Assert each live location is simultaneously inside for outside-press
  and FocusLock, and the removed location is simultaneously stale for neither.
- [ ] `OV-LAYER-10` `[reference]` `[browser]` —
  **Overlay should keep layer stacks independent when open instances belong to
  different Documents.**
  Open layers in the main document and a same-origin iframe document, activate
  each, and send Escape/outside input within both contexts. Assert callbacks
  route only through the source document's ordering and closing either stack
  does not unregister or promote entries in the other.

### Modal pointer isolation

- [ ] `OV-POINTER-01` `[vendor]` `[browser:all]` —
  **Overlay should block background pointer activation when a modal layer is
  open.**
  Put clickable and editable controls behind Backdrop/Content, open Overlay,
  and attempt real mouse, pen, and touch activation at those coordinates.
  Assert no background click, focus, value, or counter change while Content
  remains interactive, covering Radix `e2e/dialog.spec.ts` (“can be open/closed
  with a pointer”).
- [ ] `OV-POINTER-02` `[vendor]` `[browser]` —
  **Overlay should restore exact consumer pointer styles when the final modal
  closes.**
  Start with non-default inline and stylesheet-driven `pointer-events` on body
  and the application root, open and fully close an Overlay, then repeat with
  an exit. Assert the original authored values and priorities are preserved
  during management and restored byte-for-byte afterward rather than replaced
  with a guessed empty value.
- [ ] `OV-POINTER-03` `[vendor]` `[browser]` —
  **Overlay should keep background isolated when nested modals close out of
  order.**
  Open two modal layers, close the parent first in one run and the child first
  in another, and try the background between exits. Assert a document-level
  reference count keeps background pointer behavior disabled until the final
  modal Presence exit completes and restores it exactly once.
- [ ] `OV-POINTER-04` `[reference]` `[browser]` —
  **Overlay should make only the top modal Content interactive when layers
  overlap.**
  Open two modal siblings or nested Overlays and attempt real pointer
  activation on exposed coordinates of the lower Content and on the top
  Content. Assert the lower handler and focus target are unreachable while the
  top responds normally, without treating lower Content as background to
  dismiss both.
- [ ] `OV-POINTER-05` `[reference]` `[browser]` —
  **Overlay should retain modal pointer isolation when a controlled close is
  still exiting.**
  Close an open Overlay whose Backdrop and Content have explicit transition
  durations, probe the background before and after the final owned end event,
  and finish Presence. Assert isolation persists through the entire exit and
  original pointer behavior is restored once only after both parts unmount.
- [ ] `OV-POINTER-06` `[reference]` `[browser]` —
  **Overlay should cancel pointer teardown when it reopens during exit.**
  Begin an animated close, reopen before completion, and dispatch both stale
  and current transition end events while continuously probing a background
  button. Assert the button never receives an interactive frame while Overlay
  is open and stale exit work cannot restore body/root pointer behavior.

### Initial focus and containment integration

- [ ] `OV-FOCUS-01` `[convergence]` `[browser:all]` —
  **Overlay should focus its first tabbable Content descendant when it opens
  from a trigger without `initialFocus`.**
  Focus an authored trigger, open Content containing multiple ordered
  tabbables, and omit `initialFocus`. Assert the first eligible descendant
  becomes `document.activeElement` after mount, the original trigger is saved
  for restore, and no hidden focus guard becomes the public target.
- [ ] `OV-FOCUS-02` `[reference]` `[browser]` —
  **Overlay should honor either FocusTarget form when `initialFocus` resolves
  inside Content at activation.**
  Open separate fixtures with `initialFocus` as a ref and as a resolver
  returning a later valid Content descendant, then smoke an invalid resolver
  returning a detached node. Assert each valid target receives focus after
  portal mount and the invalid target falls back to the first tabbable without
  escaping the lock; FocusLock owns the complete validity and candidate matrix.
- [ ] `OV-FOCUS-03` `[vendor]` `[browser]` —
  **Overlay should skip only the initial focus move when
  `initialFocus={false}` is set.**
  Keep focus on the opening trigger, open Overlay with
  `initialFocus={false}`, and then attempt Tab and programmatic focus outside.
  Assert opening does not move focus, but once focus enters the active Content
  the lock still contains later navigation and reclaims disallowed outside
  focus.
- [ ] `OV-FOCUS-04` `[vendor]` `[browser:all]` —
  **Overlay should contain sequential and programmatic focus when its modal
  Content is active.**
  Open Content with first and last tabbables, press Tab and Shift+Tab across
  both boundaries, then call `focus()` on a background control. Assert
  sequential focus loops within Content and the programmatic escape is
  reclaimed to the appropriate live candidate without duplicate focus events.
- [ ] `OV-FOCUS-05` `[vendor]` `[browser]` —
  **Overlay should preserve containment when its currently focused descendant
  is removed, disabled, or hidden.**
  Focus a middle Content control, dynamically remove it, then repeat by
  disabling and hiding it before the next Tab. Assert focus lands on another
  eligible candidate or Content itself and never reaches background or
  detached DOM, covering Radix `e2e/dialog.spec.ts` (“keeps focus trapped even
  if focused element is removed”).
- [ ] `OV-FOCUS-06` `[vendor]` `[browser]` —
  **Overlay should pause the parent focus lock when a nested modal becomes
  active.**
  Open a parent, focus within it, open a child modal, and attempt focus movement
  between child, parent, and background before and after child close. Assert
  only the child contains focus while active, then the parent resumes without
  competing reclaim loops, oscillation, or duplicate restoration.
- [ ] `OV-FOCUS-07` `[reference]` `[browser]` —
  **Overlay should permit focus in a portalled child popup when that Content is
  registered as a shard.**
  Open a parent Overlay with a nested Popover or Menu whose Content portals
  elsewhere, then Tab or programmatically focus its first control. Assert focus
  remains in child Content without parent reclaim and returns to the parent
  policy after the branch unmounts.
- [ ] `OV-FOCUS-08` `[reference]` `[browser]` —
  **Overlay should resolve initial focus after Content mounts when its public
  ref and internal FocusLock ref are composed.**
  Open custom-portalled Content with a consumer callback ref and an
  `initialFocus` resolver that reads a descendant from that mounted node, then
  rerender unrelated StyleProps. Assert the Content ref attaches before one
  resolver-driven focus move and the rerender causes neither ref churn nor a
  second move; generic ref stability remains covered by `PART-REF-*`.
- [ ] `OV-FOCUS-09` `[convergence]` `[browser]` —
  **Overlay should never treat focus movement by itself as an outside-dismiss
  command.**
  Open with `initialFocus={false}` while focus remains on the source, then in a
  second fixture enter Content and programmatically focus an outside element
  without a pointer sequence. Assert the first state causes no immediate
  dismissal and the second is reclaimed by FocusLock, with
  `onOutsidePress`/`onDismiss` empty in both. Modal focus containment and
  pointer dismissal are separate policies; Reference UI deliberately does not
  copy Radix focus-outside dismissal.

### Focus restoration and Presence order

- [ ] `OV-RESTORE-01` `[reference]` `[browser:all]` —
  **Overlay should restore its captured origin only when an animated close with
  omitted or true `restoreFocus` has fully exited.**
  In separate omitted and `restoreFocus={true}` Content fixtures, focus a
  trigger, open, move focus inside, and close through explicit Backdrop and
  Content exits. Assert focus containment and modal isolation persist until
  both parts unmount, then the captured trigger receives one return move and
  all modal systems release.
- [ ] `OV-RESTORE-02` `[reference]` `[browser]` —
  **Overlay should restore focus and release modal systems in the completed
  close turn when exit duration is zero.**
  Open from a focused trigger and close with no effective transition or
  animation on either part. Assert Backdrop/Content unmount, focus restores,
  and focus lock, inerting, pointer isolation, scroll lock, and layer
  registration tear down in that completed close turn without an unexplained
  timer frame.
- [ ] `OV-RESTORE-03` `[vendor]` `[browser]` —
  **Overlay should fall back through the captured origin when an explicit
  restore target is invalid at Presence completion.**
  Open from a trigger beside one valid proximity candidate, close with
  `restoreFocus` resolving to a detached or disabled target, and invalidate the
  captured trigger before the owned exit ends. Assert no return occurs during
  exit and completion focuses one live captured-origin proximity fallback,
  never either invalid node; FocusLock owns the right/left/ancestor solver
  matrix.
- [ ] `OV-RESTORE-04` `[reference]` `[browser]` —
  **Overlay should preserve deliberate application focus when animated close
  uses `restoreFocus={false}`.**
  Start an animated close with `restoreFocus={false}` and move focus to a valid
  outside target as part of the application close workflow. Assert Presence
  completion tears down modal systems without focusing the captured origin or
  any fallback, leaving the deliberate target active.
- [ ] `OV-RESTORE-05` `[reference]` `[browser]` —
  **Overlay should cancel pending focus restoration when it reopens during
  exit.**
  Open from a trigger, begin close, reopen before exit completion, and dispatch
  stale end events from both parts. Assert focus stays in the live Overlay,
  trigger restore and all modal teardown are canceled, and only a subsequent
  current close may release them.
- [ ] `OV-RESTORE-06` `[reference]` `[browser]` —
  **Overlay should restore only the outer origin when closing a parent cascades
  through nested layers.**
  Open a parent from an outer trigger, open descendants from controls that will
  disappear with the parent, and close the parent. Assert deepest-first
  teardown never focuses removed child triggers and final exit produces one
  restoration to the outer original trigger.
- [ ] `OV-RESTORE-07` `[reference]` `[browser]` —
  **Overlay should focus an explicit return target when `restoreFocus` is a
  valid FocusTarget and Presence has completed.**
  Open from trigger A with Content `restoreFocus` pointing by ref to connected
  button B, move focus inside, and close through a finite exit. Assert neither A
  nor B receives focus while Content remains mounted, then B receives exactly
  one return move after the final owned exit instead of the captured origin.
- [ ] `OV-RESTORE-08` `[reference]` `[browser]` —
  **Overlay should resolve the latest return target when a `restoreFocus`
  resolver changes its result during exit.**
  Begin an animated close with a resolver returning button A, switch its current
  result to button B while Content remains mounted, and complete Presence.
  Assert no early return occurs and the resolver is evaluated at completed
  teardown so B, not stale A or the captured origin, receives focus once.

### Presence and state

- [ ] `OV-PRES-01` `[reference]` `[browser:all]` —
  **Overlay should keep both modal parts mounted when their closed state starts
  an owned CSS exit.**
  Open Backdrop and Content with explicit transition and keyframe fixtures,
  then set `open={false}`. Assert each receives `data-state="closed"` before
  style sampling, both remain mounted through their own effective exits, and
  unmount occurs only after every owned transition or animation completes.
- [ ] `OV-PRES-02` `[reference]` `[browser]` —
  **Overlay should wait for the slower part when Backdrop and Content have
  different exit durations.**
  Give Backdrop and Content distinct nonzero exit durations, close once, and
  fire the shorter part's end event before the longer part's. Assert neither
  portal nor modal systems tear down early and the final owned event completes
  both parts without requiring an authored nested Presence.
- [ ] `OV-PRES-03` `[reference]` `[browser]` —
  **Overlay should ignore bubbled child animation events when Content itself is
  still exiting.**
  Put an animated descendant inside Content, close Overlay, and finish the
  descendant before Content and Backdrop. Assert the bubbled event leaves both
  parts mounted and modal behavior active until events whose targets and names
  match the owned exits arrive.
- [ ] `OV-PRES-04` `[reference]` `[browser]` —
  **Overlay should complete close immediately when effective motion cannot
  produce an exit event.**
  Close fixtures under reduced motion, a hidden document, and computed
  zero/no-transition and zero/no-animation styles. Assert closed state is
  observable for the lifecycle but unmount, restore, and modal teardown
  complete without waiting for nonexistent events or fallback sleeps.
- [ ] `OV-PRES-05` `[reference]` `[browser]` —
  **Overlay should maintain one current lifecycle when close, reopen, and close
  happen rapidly.**
  Drive `true → false → true → false`, mixing stale and current end events and
  destination checks. Assert one portal payload, one live layer entry, one
  inert/pointer/scroll lock reference, and one final restoration/teardown, with
  no stale lifecycle able to remove current state.

### Background inert and accessibility tree

- [ ] `OV-INERT-01` `[vendor]` `[browser:all]` —
  **Overlay should remove unrelated application content from interaction and
  the accessibility tree when it is open.**
  Open Content beside multiple body and root siblings containing controls,
  while retaining the portal ancestry needed to reach Content. Assert every
  unrelated sibling is effectively inert and accessibility-hidden, Content
  remains reachable, and role queries cannot find background controls, as in
  React Aria `ariaHideOutside.test.js` (“should hide everything except the
  provided element [button]”).
- [ ] `OV-INERT-02` `[vendor]` `[browser]` —
  **Overlay should preserve pre-existing isolation attributes when it closes.**
  Mark separate background nodes `inert` and `aria-hidden="true"` before
  opening, add ordinary siblings for Overlay to manage, then complete close.
  Assert authored attributes remain exactly as supplied and only
  Overlay-owned additions are removed, covering React Aria
  `ariaHideOutside.test.js` (“should not overwrite an existing aria-hidden
  prop”).
- [ ] `OV-INERT-03` `[vendor]` `[browser]` —
  **Overlay should keep background hidden when nested instances close in any
  order.**
  Open two nested or sibling modals and complete their exits in both parent-
  first and child-first order. Assert reference-counted inert and ARIA hiding
  never releases any shared background node while one modal remains and
  restores each owned attribute once after the last exit, matching React Aria
  `ariaHideOutside.test.js` (“work when called multiple times and restored out
  of order”).
- [ ] `OV-INERT-04` `[vendor]` `[browser]` —
  **Overlay should classify dynamic nodes correctly when they are inserted or
  reparented during an active modal.**
  Add controls outside Content, add descendants inside Content, and reparent
  nodes across that boundary while the observer is active. Assert outside
  nodes become effectively inert/hidden, inside nodes remain available, and
  stale ownership is cleaned, covering React Aria `ariaHideOutside.test.js`
  (“should handle when a new element is added and then reparented”).
- [ ] `OV-INERT-05` `[vendor]` `[browser]` —
  **Overlay should keep live regions and registered child branches accessible
  when surrounding background is hidden.**
  Open Overlay beside Toast and live-announcer hosts and then mount a
  registered portalled child layer among otherwise unrelated siblings. Assert
  those exempt hosts and the full child branch remain accessibility-visible
  while adjacent background controls are inert/hidden, including dynamically
  added top-layer hosts.
- [ ] `OV-INERT-06` `[vendor]` `[shadow]` —
  **Overlay should hide the correct siblings when Content is reached through
  nested open ShadowRoots.**
  Portal Content into a deeply nested open ShadowRoot with unrelated siblings
  at inner, outer-shadow, and document levels, then open it. Assert those
  siblings are effectively hidden while every direct shadow host ancestor
  needed to reach Content remains visible, matching React Aria
  `ariaHideOutside.test.js` (“should handle a modal inside nested Shadow DOM
  structures and hide sibling content in the outer shadow root”).
- [ ] `OV-INERT-07` `[reference]` `[browser]` —
  **Overlay should restore background attributes once when animated exit
  completes and cancel that restoration when it reopens.**
  Record authored inert/ARIA state, close through a multi-part exit, and in a
  second run reopen before completion while firing stale end events. Assert
  normal final exit removes only Overlay-owned attributes once, while reopen
  leaves current isolation untouched.
- [ ] `OV-INERT-08` `[reference]` `[browser]` —
  **Overlay should expose only the dialog subtree when an accessibility check
  runs during its modal state.**
  Compose labeled `role="dialog"` Content over named background controls and
  take role queries, an accessibility snapshot, and the configured automated
  check while open. Assert background controls are absent, the dialog and its
  computed name are present, and Content descendants retain expected roles;
  this checks public accessibility output rather than attributes alone.
- [ ] `OV-INERT-09` `[vendor]` `[browser]` —
  **Overlay should treat an already aria-hidden ancestor as one opaque
  background boundary instead of traversing and rewriting its descendants.**
  Place a large subtree beneath an authored `aria-hidden="true"` container,
  instrument descendant attribute mutations, and open and close Overlay beside
  it. Assert the ancestor remains exactly authored, no descendant receives
  duplicate Overlay-owned hiding, ordinary visible siblings are still managed
  once, and cleanup performs no descendant churn. This ports React Aria
  `ariaHideOutside.test.js` “should not traverse into an already hidden
  container.”
- [ ] `OV-INERT-10` `[vendor]` `[browser]` —
  **Overlay should preserve isolation when a dynamic node is reparented into
  an already managed hidden subtree.**
  Insert a focusable background node during an active modal, let Overlay hide
  it, then move it beneath a pre-hidden or currently managed background
  ancestor and later back to an ordinary sibling. Assert it never becomes
  accessibility- or pointer-reachable during either move, ownership remains
  deduplicated, and final teardown restores only attributes Overlay actually
  added. This ports React Aria's add-then-reparent hidden-container regression.

### Scroll lock

- [ ] `OV-SCROLL-01` `[vendor]` `[browser:all]` —
  **Overlay should preserve document position when user scrolling targets the
  locked page.**
  Start at a nonzero page offset, open Overlay, and send real wheel,
  one-finger touch, Space/PageDown, and arrow-key scrolling against background
  and document targets. Assert `scrollX`/`scrollY` do not change for user input
  while an explicit application `scrollTo` remains outside the claimed
  contract.
- [ ] `OV-SCROLL-02` `[vendor]` `[browser]` —
  **Overlay should avoid layout shift when locking a page that has a visible
  scrollbar and authored root styles.**
  Record fixed element rects and existing html/body overflow, padding, margin,
  and `scrollbar-gutter`, then open and fully close Overlay. Assert scrollbar
  width is compensated without rect shift and every authored value and
  priority restores exactly, rather than overwriting a zero or pre-existing
  declaration.
- [ ] `OV-SCROLL-03` `[vendor]` `[browser:all]` —
  **Overlay should allow an internal scrollable to move when it can consume
  wheel or touch input.**
  Put a bounded overflow region inside Content, send wheel and touch gestures
  through its middle and then beyond each edge, and monitor both region and
  page offsets. Assert the region scrolls normally until its boundary and
  excess movement never chains to the locked document.
- [ ] `OV-SCROLL-04` `[vendor]` `[browser]` —
  **Overlay should apply the same edge-aware scrolling rules when the
  scrollable is in a registered portalled shard.**
  Register child popup Content outside the parent DOM, give it a bounded
  scroll region, and wheel/touch through middle and edge positions. Assert the
  shard consumes available movement, document position stays fixed at its
  edges, and unregistered background scrollers remain blocked.
- [ ] `OV-SCROLL-05` `[vendor]` `[browser]` —
  **Overlay should retain one document scroll lock when nested modals exit out
  of order.**
  Open two modals, close and finish them in each possible order, and attempt
  document scrolling between every step. Assert one reference-counted lock
  survives until the final modal exit and releases afterward, covering React
  Aria `usePreventScroll.test.js` (“should work with nested/multiple modals
  regardless of unmount order”).
- [ ] `OV-SCROLL-06` `[reference]` `[browser]` —
  **Overlay should allow pinch zoom when ordinary one-finger background touch
  scrolling is locked.**
  Open Overlay on a touch-capable fixture, send a one-finger drag over
  background and a two-contact pinch gesture, and observe page offset and
  viewport scale. Assert the drag cannot scroll the page while pinch zoom is
  not canceled, separating accessibility zoom from background scrolling.
- [ ] `OV-SCROLL-07` `[vendor]` `[touch]` —
  **Overlay should keep fixed Content and page position stable when Mobile
  Safari changes its visual viewport around a focused input.**
  On Mobile Safari, open at a nonzero offset, focus an input in fixed Content,
  exercise keyboard appearance, visualViewport resize/offset, and address-bar
  movement, then close. Assert Content does not jump, the page does not
  user-scroll, and the exact original position restores after teardown.
- [ ] `OV-SCROLL-08` `[reference]` `[rtl]` —
  **Overlay should compensate the logical scrollbar side when a locked
  document is RTL.**
  Open a scrollbar-bearing `dir="rtl"` page with measurable edge-aligned
  content and pre-existing logical padding/margins. Assert compensation appears
  on the browser's actual logical scrollbar side, no content rect shifts, and
  authored styles restore after close.
- [ ] `OV-SCROLL-09` `[reference]` `[shadow]` —
  **Overlay should distinguish allowed Content scrolling from background
  scrolling when event paths cross Shadow DOM.**
  Place an internal scroller and a background scroller in separate open
  ShadowRoots, open Overlay, and send composed wheel/touch paths at middle and
  edge positions. Assert Content movement follows edge rules while background
  and document offsets remain fixed despite event retargeting.
- [ ] `OV-SCROLL-10` `[reference]` `[browser]` —
  **Overlay should clean scroll-lock effects exactly once when lifecycle
  teardown is interrupted or exceptional.**
  Exercise animated close/reopen, direct unmount, and a child render that
  throws after lock activation while instrumenting non-passive listeners and
  html/body inline styles. Assert stale listeners are removed, current ones
  remain as needed, and final cleanup restores every owned style/listener once
  with no leak or double removal.

### SSR, roots, and browser matrix

- [ ] `OV-ENV-01` `[reference]` `[ssr]` —
  **Overlay should server-render safely when it is closed and no DOM globals
  exist.**
  Render `open={false}` in an environment without `window` or `document`,
  hydrate the same authored IDs in a browser, and open afterward. Assert no
  server access error or hydration warning, stable IDs, and normal portal and
  modal activation only after the controlled open.
- [ ] `OV-ENV-02` `[reference]` `[ssr]` —
  **Overlay should defer modal activation when `open={true}` is rendered on the
  server.**
  Server-render an initially open fixture through Portal's mount gate and
  hydrate it on the client. Assert server markup and first hydration frame
  produce no portal mismatch or DOM-global access, then exactly one portal,
  layer entry, focus lock, inert pass, and scroll lock activate after mount.
- [ ] `OV-ENV-03` `[reference]` `[shadow]` —
  **Overlay should retain its full modal contract when a custom portal targets
  a ShadowRoot.**
  Portal Backdrop and Content into an open ShadowRoot and exercise focus
  containment, inside/outside composed pointer paths, nested inert traversal,
  and internal-versus-background scrolling. Assert each public behavior matches
  ordinary document portals and cleanup leaves no host or document residue.
- [ ] `OV-ENV-04` `[reference]` `[react:all]` —
  **Overlay should perform one modal side effect when React version or
  StrictMode replays lifecycle work.**
  Run the same open, Escape/outside request, and close fixture under React 17,
  18, and 19 with available StrictMode replay. Assert one portal payload, one
  live stack entry, one observer/listener set, and one callback per physical
  event, followed by one cleanup.
- [ ] `OV-ENV-05` `[reference]` `[browser:all]` —
  **Overlay should preserve its kernel invariants when the browser engine
  changes.**
  Run representative Escape and outside ordering, Tab containment, animated
  Presence teardown, background inerting, and document/internal scrolling in
  Chromium, Firefox, and WebKit. Assert the same public callback order, focus,
  DOM state, accessibility visibility, and scroll positions in every engine.

### Anchored geometry (Floating UI port)

- [ ] `OV-POS-01` `[reference]` `[browser]` —
  **Overlay should write no coordinates when `anchor` is omitted.**
  Open Overlay with Content `placement`, `offset`, flip/shift props, and an
  Arrow, but no `anchor`. Assert Overlay adds no `position`/`top`/`left`, no
  `--reference-overlay-*` custom properties, and no hide data attributes, while
  isolation and the layer stack still run; unanchored dialog/drawer CSS must
  not fight the engine.
- [ ] `OV-POS-02` `[vendor]` `[browser]` —
  **Overlay should position Content from `anchor` with frozen defaults.**
  Open Overlay anchored to a visible element and omit Content geometry props.
  Assert `bottom-start` placement, 8px offset and collision padding, absolute
  strategy, flip/shift on, owned `position`/`top`/`left`, and published
  `--reference-overlay-*` variables. This is the ported Floating UI default
  path, not Popover-specific API.
- [ ] `OV-POS-03` `[vendor]` `[browser]` —
  **Overlay should flip and shift anchored Content instead of overflowing.**
  Anchor Content near a viewport edge with `placement="bottom"` and allow
  flip/shift, then repeat with `flip={false}` and `shift={false}`. Assert the
  enabled path chooses a collision-safe side and clamped coordinates, while
  the disabled path keeps the preferred side even when clipped; this ports
  `flip.test.ts` / `shift.test.ts`.
- [ ] `OV-POS-04` `[vendor]` `[browser]` —
  **Overlay should honor explicit offset, collision padding, and strategy
  without a second middleware chain.**
  Parameterize `offset`, `collisionPadding`, and `strategy="fixed"` on
  anchored Content. Assert each value reaches one `computePosition` pass,
  `fixed` uses the containing viewport, and consumer `transform` is
  untouched. This ports `offset.test.ts` plus strategy selection.
- [ ] `OV-POS-05` `[vendor]` `[browser]` —
  **Overlay.Arrow should participate in the same position pass as Content.**
  Render anchored Content with Arrow `edgePadding={4}` and `{12}` near an
  alignment edge. Assert Arrow coordinates stay inside Content, alignment
  offset does not retrigger flip, and visual `padding` StyleProps remain
  distinct from `edgePadding`. This ports `arrow.test.ts`.
- [ ] `OV-POS-06` `[vendor]` `[browser]` —
  **Overlay should publish available and anchor geometry for scrolling
  popups.**
  Anchor a tall Content near a short viewport and read
  `--reference-overlay-available-height` / `-width` plus anchor size and
  transform origin. Assert finite values that match the engine's size
  middleware after shift, with no ResizeObserver loop. This ports
  `size.test.ts` and Floating UI #1740.
- [ ] `OV-POS-07` `[vendor]` `[browser]` —
  **Overlay should expose clip flags without closing itself.**
  Scroll an anchored reference until it is clipped and until Content escapes
  its clipping context. Assert `data-anchor-hidden` / `data-escaped` follow
  hide middleware while `open` stays true and no `onDismiss` fires; close-on-
  clip is product policy. This ports `hide.test.ts`.
- [ ] `OV-POS-08` `[vendor]` `[browser]` —
  **Overlay should keep a living position while open.**
  Anchor Content, then scroll ancestors of reference and floating, resize,
  zoom, and move `visualViewport`. Assert one live autoUpdate subscription,
  Content coordinates follow, and listeners drop after Presence exit. This
  ports `autoUpdate.ts` functional tests.
- [ ] `OV-POS-09` `[vendor]` `[browser]` —
  **Overlay should accept virtual anchors as positioning references.**
  Parameterize `anchor` over a point `{x, y}`, a sized rect / `DOMRect`, a
  `getBoundingClientRect()` object that mutates, and an Element in nested
  scrollers. Assert point anchors have implicit zero size, sized rects
  align to all four edges, mutations update without remount, and Element
  anchors use that node's owner window. This ports `virtual-element.test.ts`.
- [ ] `OV-POS-10` `[reference]` `[browser]` `[rtl]` —
  **Overlay should keep physical placement tokens in RTL.**
  Anchor Content with `placement="bottom-start"` under `dir="rtl"`. Assert
  the engine still uses that token, alignment follows the ported RTL rules,
  and no extra Overlay transform is applied.
- [ ] `OV-POS-11` `[reference]` `[ssr]` —
  **Overlay should skip geometry on the server and attach after hydration.**
  Server-render an anchored open Overlay, hydrate, then wait for client
  autoUpdate. Assert no `window` access during SSR, no hydration mismatch,
  and coordinates appear only after mount.
- [ ] `OV-POS-12` `[reference]` `[shadow]` —
  **Overlay should position inside an open ShadowRoot destination.**
  Portal anchored Content into an open ShadowRoot and scroll a shadow
  ancestor. Assert coordinates resolve against that root, not light DOM,
  and autoUpdate still tracks.

## Composition gates

- [ ] `OV-COMP-01` `[reference]` `[browser]` —
  **Overlay should preserve modal dialog behavior when a labeled dialog
  composes nested Popover and Menu layers.**
  Build `role="dialog"` Content with `aria-modal="true"`, a visible accessible
  name, and portalled Popover and Menu children, then exercise focus and
  Escape/outside input at each depth. Assert the name and dialog remain
  accessible, child branches accept focus, and each event reaches only the
  intended top layer before the parent resumes.
- [ ] `OV-COMP-02` `[reference]` `[browser]` —
  **Overlay should remain open when an alertdialog composition prevents Escape
  and explicitly focuses its destructive action.**
  Build labeled `role="alertdialog"` Content with `initialFocus` targeting the
  destructive control and an `onEscape` that prevents default, then open and
  press Escape. Assert the destructive control receives initial focus,
  `onEscape` runs once, `onDismiss` stays silent, and all modal isolation
  remains active.
- [ ] `OV-COMP-03` `[reference]` `[touch]` —
  **Overlay should maintain drawer isolation when an edge Drawer uses a
  transform exit and custom portal on Mobile Safari.**
  Compose custom-portalled edge Content with an authored transform transition,
  a focusable input, and a scrollable body, then open, focus, resize the visual
  viewport, scroll internally, and close. Assert consumer transforms animate
  intact, page position and fixed geometry remain stable, internal scrolling
  works, and restore/teardown occur only after exit.
- [ ] `OV-COMP-04` `[reference]` `[browser]` —
  **Overlay should keep modal isolation when an anchored dialog uses the
  geometry engine.**
  Build labeled `role="dialog"` Content with `aria-modal="true"`, `anchor`
  on a toolbar button, `placement="bottom-start"`, and a nested Popover
  inside Content. Open, Tab, Escape the child, then Escape the dialog.
  Assert coordinates follow the button, isolation remains modal, and each
  Escape closes only the top layer; anchored is not a second Overlay kind.

## Owned elsewhere

- FocusTarget validity, tabbable/shard behavior, and restore-proximity solver
  matrix: `FocusLock`.
- Transition/animation detection: `Presence`.
- Portal destination semantics: `Portal`.
- Trigger, hover grace, impatient click, tab-order bridge, `closeOnScroll`:
  `Popover`.
- Toast timer reaction to top modal: `Toast`.
- Menu submenu intent: `Menu`.

## Out of scope

- Non-modal Overlay, native `<dialog>` as a second runtime, semantic Dialog/
  Drawer components, visual styles, snap points, iOS scale-behind, a public
  Provider, or `@floating-ui/react` as runtime.
- react-remove-scroll's independent `isDisabled` convenience path: an open
  modal Overlay always owns an active scroll lock through Presence exit, so
  there is no second public switch that can desynchronize modal isolation.
