# Presence test contract

Playwright: `matrix/lib/tests/e2e/presence.spec.ts`  
Unit: `matrix/lib/tests/unit/presence.test.ts`
Page: `/presence`

Presence owns exit-lifecycle detection for CSS transitions and animations. It
renders no host and does not set `data-state`; the consumer sets closed state
before Presence decides when to remove the child.

## Source evidence

- `vendor/radix-primitives/packages/react/presence/src/presence.test.tsx` —
  mount/unmount behavior and stable/unstable ref regressions.
- `vendor/radix-primitives/packages/react/presence/src/presence.tsx` — mounted,
  suspended, and unmounted state machine; animation-name change detection.
- `vendor/base-ui/packages/react/src/internals/useAnimationsFinished.test.tsx`
  and `collapsible/panel/CollapsiblePanel.test.tsx` — transitions, interrupted
  close/reopen, zero-size exits, and stale completion races.
- `vendor/headlessui/packages/@headlessui-react/src/components/transition` —
  `getAnimations()` transition completion and nested-transition contrast.
- `vendor/zag/packages/machines/presence` — zero-duration and hidden-document
  completion.

## Required cases

### Mount and transparent DOM

- [x] `PR-DOM-01` `[vendor]` `[browser]` —
  **Presence should render the exact authored child immediately when `present` is true.**
  Mount Presence around a marked native element with `present={true}` and
  retain the authored node reference. Assert that the same element is present
  in the first committed DOM and that Presence adds no wrapper or sibling.
- [x] `PR-DOM-02` `[vendor]` `[browser]` —
  **Presence should omit its child when it first mounts with `present` false.**
  Mount a marked child beneath `present={false}` with a ref callback and
  lifecycle log. Assert that no child or Presence host enters the DOM and the
  ref never receives a native node.
- [x] `PR-DOM-03` `[reference]` `[browser]` —
  **Presence should render no host when its child is empty or falsy.**
  Parameterize `null`, `false`, and an empty Fragment under both `present`
  values. Assert an unchanged empty container with no wrapper, no attached
  ref, and no render or console error.
- [x] `PR-DOM-04` `[reference]` `[browser]` —
  **Presence should leave consumer props and behavior untouched when it observes a present child.**
  Give the child native attributes, a class, style, click handler, and
  consumer-owned `data-state="open"`, then mount and click it. Assert every
  value is unchanged, the handler fires once, and Presence contributes no
  public attribute or host of its own.
- [x] `PR-DOM-05` `[reference]` `[browser]` —
  **Presence should observe only the current keyed child when a present child is replaced.**
  While `present` stays true, replace keyed child A with keyed child B and log
  refs, then dispatch A's previously captured exit event. Assert one cleanup
  for A, one attachment for B, B still mounted, and no stale event-driven
  removal or duplicate node.
- [x] `PR-DOM-06` `[reference]` `[browser]` —
  **Presence should reject child shapes that cannot expose one observable element when they are nonempty.**
  Render text, `0`, a nonempty Fragment, and multiple active element children
  in separate fixtures. Assert the documented descriptive
  single-observable-element error for each and verify that no partial child or
  wrapper is committed.
- [x] `PR-DOM-07` `[reference]` `[react:all]` —
  **Presence should observe one eventual native node when its child is ref-forwarding or lazy.**
  Render a forwarding custom child and a Suspense-wrapped lazy forwarding
  child, each resolving to one marked button with a consumer ref. Assert one
  unwrapped native node, one ref attachment after resolution, working child
  events, and a finite settled render count without a ref loop.
- [x] `PR-DOM-08` `[reference]` `[react:all]` —
  **Presence should fail descriptively when a custom child does not expose one observable native node.**
  Pass a non-ref-forwarding custom child, then request an animated exit that
  would require observing its DOM node. Assert a documented ref/anatomy error
  rather than immediate silent removal, a stranded child, or lifecycle
  observation attached to the wrong node.

### Immediate removal

- [x] `PR-INSTANT-01` `[vendor]` `[browser]` —
  **Presence should remove its child in the same committed update when no CSS effect can delay exit.**
  Mount a child with no transition or animation, then rerender with
  `present={false}` and log its ref cleanup. Assert that the child is absent
  immediately after that commit, cleanup has run once, and no later event or
  timer is required.
- [x] `PR-INSTANT-02` `[convergence]` `[browser]` —
  **Presence should remove immediately when the closed state has a zero-duration transition.**
  Give the child a property change with computed
  `transition-duration: 0s`, toggle `present` false, and inspect the same
  committed update. Assert that the child and its ref are removed without
  waiting a frame or for `transitionend`.
- [x] `PR-INSTANT-03` `[vendor]` `[browser]` —
  **Presence should remove immediately when the closed state has no effective CSS animation.**
  Parameterize `animation-name: none` and a named animation with computed
  `animation-duration: 0s`, then toggle `present` false. Assert immediate DOM
  removal and one ref cleanup with no dependency on `animationstart`,
  `animationend`, or `animationcancel`.
- [x] `PR-INSTANT-04` `[convergence]` `[browser]` —
  **Presence should avoid suspension when every comma-separated CSS effect has zero total duration.**
  Configure multiple transition and animation entries whose computed
  durations are all `0s`, including nonzero property changes, and close the
  child. Assert removal in the close commit, no retained frame, and no stale
  listener waiting for an event that cannot fire.
- [x] `PR-INSTANT-05` `[reference]` `[browser]` —
  **Presence should remove immediately when reduced-motion CSS computes every exit duration to zero.**
  Emulate `prefers-reduced-motion: reduce`, apply CSS that changes the named
  exit effects to `0s`, and set `present` false. Assert same-commit removal
  from computed style alone, with no JavaScript media-query branch or delayed
  cleanup.
- [x] `PR-INSTANT-06` `[vendor]` `[browser]` —
  **Presence should not strand an exiting child when the owner document is hidden.**
  In a fixture whose `document.visibilityState` is `"hidden"`, start an exit
  that otherwise has a concrete nonzero duration. Assert that the child is
  removed and its ref cleans up without waiting for throttled end events, and
  that no late event recreates or removes anything again.
- [x] `PR-INSTANT-07` `[convergence]` `[browser]` —
  **Presence should remove immediately when the closed state sets the observed child to `display:none`.**
  Start from a visible child, apply closed styling with `display: none` plus a
  nominal nonzero transition or animation, and set `present` false. Assert
  immediate removal and cleanup rather than waiting for an event the hidden
  element cannot dispatch.

### CSS transition exits

- [x] `PR-TRANSITION-01` `[convergence]` `[browser:all]` —
  **Presence should retain a closing child when its own transform transition is still running.**
  Toggle `present` false while closed CSS changes `transform` over a concrete
  duration, and observe the child through the next animation frame before
  allowing the native event to finish. Assert closed styling while retained,
  no early ref cleanup, and removal exactly once after the child's
  `transitionend`.
- [x] `PR-TRANSITION-02` `[convergence]` `[browser:all]` —
  **Presence should wait for both transition delay and duration when the closed effect is delayed.**
  Close a child with a known `100ms` delay and `200ms` duration, recording DOM
  presence and cleanup around both boundaries. Assert that the child remains
  through the delay and active duration and is removed only when the resulting
  transition completes.
- [x] `PR-TRANSITION-03` `[convergence]` `[browser:all]` —
  **Presence should wait for the last property when a closing child transitions multiple properties.**
  Close a child whose opacity and transform transitions have different finite
  totals, and record each native completion. Assert that the first
  `transitionend` leaves the closed child and ref intact, while the final
  property completion removes and cleans it up exactly once.
- [x] `PR-TRANSITION-04` `[convergence]` `[browser]` —
  **Presence should ignore descendant transition events when it observes a transitioning parent child.**
  Close an observed element while a nested descendant also transitions, then
  let the descendant dispatch `transitionend` first. Assert that the observed
  child remains until its own event, after which the full subtree is removed
  once.
- [x] `PR-TRANSITION-05` `[convergence]` `[browser:all]` —
  **Presence should complete a suspended exit when the observed transition is canceled.**
  Start a finite close transition and cancel it through a property/style
  change that yields native `transitioncancel`. Assert that cancellation
  removes the child and cleans its ref exactly once, and that any later stale
  end event has no effect.
- [x] `PR-TRANSITION-06` `[reference]` `[browser]` —
  **Presence should ignore unrelated perpetual transitions when only a finite close-state change defines the exit.**
  Keep an always-declared long-running transition on an unchanged property
  while closing changes a different property with a short finite transition.
  Assert that Presence retains the child for the close-created transition
  only, removes it at that completion, and never waits for the unrelated
  declaration.

### CSS animation exits

- [x] `PR-ANIMATION-01` `[vendor]` `[browser:all]` —
  **Presence should retain a closing child when its own newly named exit animation is still running.**
  Change the observed child's computed animation name from its open state to a
  finite `fade-out` when setting `present` false. Assert that the closed child
  and ref remain through `animationstart` and are removed exactly once only
  after that child's matching `animationend`.
- [x] `PR-ANIMATION-02` `[vendor]` `[browser:all]` —
  **Presence should avoid a final-frame flash when an exit animation has delay, iterations, and fill mode.**
  Close a child with a concrete delay, two finite iterations, and an authored
  fill mode while recording computed closed styles frame by frame. Assert the
  child remains through the full delayed iteration total, preserves its final
  closed visual state without a one-frame flash, and is removed only after
  completion without permanently overwriting the consumer fill mode.
- [x] `PR-ANIMATION-03` `[convergence]` `[browser]` —
  **Presence should wait for all finite animations when a closing child runs more than one.**
  Apply two named finite exit animations with different completion times and
  set `present` false. Assert that the first `animationend` does not remove or
  clean up the child and the last finite animation removes it exactly once.
- [x] `PR-ANIMATION-04` `[vendor]` `[browser]` —
  **Presence should remove immediately when the animation name does not change for the closed state.**
  Mount with an enter or ambient animation name, keep that same computed name
  while toggling `present` false, and capture DOM/ref state. Assert that
  Presence does not suspend on the preexisting animation and removes the child
  in the close commit.
- [x] `PR-ANIMATION-05` `[vendor]` `[browser:all]` —
  **Presence should complete a suspended exit when the observed animation is canceled.**
  Begin a finite named exit, cancel it through a style change that produces
  native `animationcancel`, and retain any stale end event. Assert one child
  removal and ref cleanup on cancellation and no second effect from the late
  event.
- [x] `PR-ANIMATION-06` `[convergence]` `[browser]` —
  **Presence should ignore a descendant animation completion when the observed child is still exiting.**
  Close an observed parent whose nested element completes a named animation
  before the parent's own exit. Assert that the bubbled descendant
  `animationend` leaves the parent mounted and only the parent's matching
  completion removes the subtree.
- [x] `PR-ANIMATION-07` `[reference]` `[browser]` —
  **Presence should ignore infinite animations when a closing child also has finite exit effects.**
  Keep an infinite ambient animation on the observed node and optionally add a
  finite transition or animation that starts on close. Assert immediate
  removal when infinity is the only effect, or retention only until every
  finite close effect completes, never an indefinitely stranded child.

### Mixed and interrupted lifecycles

- [x] `PR-RACE-01` `[convergence]` `[browser:all]` —
  **Presence should wait for both effect types when a closing child runs a transition and an animation.**
  Close a child with one finite transition and one finite animation whose end
  times differ, and record both native completions. Assert that either first
  completion leaves the child mounted and only completion of both effects
  removes it and cleans its ref once.
- [x] `PR-RACE-02` `[vendor]` `[browser]` —
  **Presence should preserve the same child when `present` returns true before exit completion.**
  Start a finite exit, capture the native node, toggle `present` true before
  completion, and then deliver the old end/cancel events. Assert unchanged
  node identity and state, no ref cleanup or remount, and no removal from any
  stale completion.
- [x] `PR-RACE-03` `[vendor]` `[browser]` —
  **Presence should create a fresh completion set when a child closes again after reopening.**
  Begin exit A, reopen before it finishes, then close again with exit B and
  deliver A's stale events before B completes. Assert that A cannot remove the
  child, B waits for its own finite effects, and B causes exactly one final
  removal and cleanup.
- [x] `PR-RACE-04` `[convergence]` `[browser]` —
  **Presence should ignore an entering animation's completion when it races with a close commit.**
  Mount during a named enter animation, switch to a distinct exit animation,
  and let the canceled or finishing enter event arrive after `present` becomes
  false. Assert that the child remains for the exit effect and only a
  completion matching the current close state removes it.
- [x] `PR-RACE-05` `[convergence]` `[browser]` —
  **Presence should release lifecycle work when its observed child disappears externally during a suspended exit.**
  Start a finite exit, remove or replace the child outside Presence's normal
  completion path, and then dispatch captured stale events. Assert immediate
  listener/observer and ref cleanup, no orphaned node, no console warning, and
  no late state update that affects the replacement.
- [x] `PR-RACE-06` `[reference]` `[browser]` —
  **Presence should clean up immediately when Presence itself unmounts during an exit.**
  Begin a suspended finite exit and unmount the parent containing Presence
  before completion, then deliver any captured end event. Assert that the
  child is removed, its ref and lifecycle listeners clean up once, no orphan
  remains, and no late update or warning occurs.

### Nested exit coordination

- [x] `PR-NEST-01` `[convergence]` `[browser:all]` —
  **Presence should keep a closing parent mounted when a descendant exit lasts longer than the parent's own effect.**
  Close nested parent and child Presence instances together with a `100ms`
  parent transition and `300ms` child animation, then let the parent effect
  finish first. Assert that both authored nodes remain until the child's final
  completion and that the parent subtree and both refs clean up exactly once
  afterward.
- [x] `PR-NEST-02` `[convergence]` `[browser]` —
  **Presence should release a descendant wait when that descendant returns to present during the parent's exit.**
  Close both instances, finish the parent's effect, and toggle only the child
  back to `present={true}` before its longer exit completes. Assert that the
  parent is no longer stranded by the canceled descendant exit, the subtree
  removes once under the still-closed parent, and stale child end events cause
  no second removal.
- [x] `PR-NEST-03` `[reference]` `[browser]` —
  **Presence should release a descendant registration when the exiting child is removed before completion.**
  Start parent and child exits, externally remove the nested Presence while
  its finite effect is pending, and then finish the parent's own effect.
  Assert child listeners and refs clean up immediately, the parent removes
  once without waiting for a nonexistent completion, and a captured stale
  child event has no effect.
- [x] `PR-NEST-04` `[reference]` `[react:all]` —
  **Presence should coordinate one descendant exit when StrictMode replays nested registration and cleanup.**
  Mount nested finite-exit instances under StrictMode, close both, and record
  registration-visible outcomes through replay, child completion, and final
  unmount. Assert one effective descendant wait, no premature parent removal,
  one final subtree cleanup, and no duplicate listener, ref, or late-update
  warning in React 17, 18, or 19.

### Refs, React, and SSR

- [x] `PR-REF-01` `[vendor]` `[react:all]` —
  **Presence should forward an object ref to the exact observed child when that child is present.**
  Mount a native button with a consumer object ref beneath Presence. Assert
  `.current` is strictly that rendered button, not a wrapper or clone-visible
  host, and becomes null when the child is finally removed.
- [x] `PR-REF-02` `[vendor]` `[react:all]` —
  **Presence should settle without an infinite loop when an inline callback ref schedules a render on attach.**
  Give the child a newly created callback ref each render that updates state
  after receiving its non-null node. Assert rendering stays below a finite
  guard, one child remains visible, and attach/detach calls do not repeat
  indefinitely.
- [x] `PR-REF-03` `[vendor]` `[react:all]` —
  **Presence should keep its composed ref identity stable when inputs remain unchanged across rerenders.**
  Have a forwarding child record the observation ref it receives while
  unrelated parent state rerenders with stable child/ref inputs. Assert one
  unique ref callback identity, no detach/reattach, and uninterrupted
  lifecycle observation of the same native node.
- [x] `PR-REF-04` `[reference]` `[react:all]` —
  **Presence should apply the supported React cleanup contract when its child is finally removed.**
  Mount with a callback ref that may return cleanup, complete an immediate and
  an animated removal under React 17, 18, and 19, and record calls. Assert one
  attachment and exactly the version-appropriate cleanup callback or `null`
  notification, never both twice.
- [x] `PR-ENV-01` `[reference]` `[ssr]` —
  **Presence should hydrate matching child markup when `present` is true on the server and client.**
  Server-render a marked present child, hydrate it with the same props, and
  capture diagnostics and node identity. Assert identical initial markup, no
  wrapper or hydration warning, and reuse of the server child rather than a
  duplicate.
- [x] `PR-ENV-02` `[reference]` `[ssr]` —
  **Presence should emit no child markup when `present` is false during server rendering.**
  Server-render an absent child with browser globals unavailable, then inspect
  the HTML and diagnostics. Assert empty Presence output, no wrapper, no
  `window`/`document` access, and no exception.
- [x] `PR-ENV-03` `[reference]` `[react:all]` —
  **Presence should maintain one observed child when StrictMode replays effects.**
  Mount a finite-exit fixture under StrictMode, record native listener calls
  through replay, and then close it once. Assert one visible child and one
  effective lifecycle-listener set after settling, followed by one removal and
  cleanup rather than duplicate completions.

## Composition gates

- [x] `PR-COMP-01` `[reference]` `[browser]` —
  **Presence should retain a fading composition when it exits through CSS keyframes.**
  Toggle a consumer-owned `data-state` from open to closed while a finite fade
  animation runs, and observe the authored node and final-frame style.
  Assert no wrapper or flash, retained closed markup until the matching
  animation completes, and one final removal.
- [x] `PR-COMP-02` `[reference]` `[browser]` —
  **Presence should retain a drawer composition when its closed state uses a transform transition.**
  Close a drawer whose consumer CSS transitions transform with a concrete
  delay and duration, while a nested descendant also animates. Assert that the
  drawer remains in its closed position until its own transition completes,
  ignores descendant events, and then cleans up exactly once.
- [x] `PR-COMP-03` `[reference]` `[browser]` —
  **Presence should preserve a reopened composition when reduced motion makes an interrupted exit instantaneous.**
  Apply reduced-motion CSS with zero durations, request close and reopen
  around the same lifecycle window, then close once more. Assert no stranded
  or duplicated node, current `present` state winning over stale work, and
  immediate final cleanup when the zero-duration close remains current.

Overlay and Popover prove only that they wire `data-state` and teardown to this
kernel. Collapsible proves measured-height integration.

## Out of scope

- Enter/leave class orchestration, render-prop state, `appear`, and
  `forceMount`.
- Product teardown order for focus, inerting, and scroll lock: `Overlay`.
