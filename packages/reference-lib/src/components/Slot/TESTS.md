# Slot test contract

Vitest: `matrix/lib/tests/unit/slot.test.ts`
Browser smoke: `matrix/lib/tests/e2e/slot.spec.ts`
Page: `/slot`

Slot is the prop/ref merge kernel. Unit tests own the complete matrix; the
browser smoke proves the resulting native event and ref behavior.

## Source evidence

- `vendor/radix-primitives/packages/react/slot/src/slot.test.tsx` — prop/ref
  merging, child-first events, ARIA-token normalization, empty/error cases,
  lazy children, nested Slottable, and stable composed-ref regressions.
- `vendor/react-spectrum/packages/react-aria/test/utils/mergeProps.test.jsx` —
  callbacks, classes, IDs, and ARIA references.
- `vendor/react-spectrum/packages/react-aria/test/utils/mergeRefs.test.tsx` —
  object/callback refs and React 19 ref cleanup.

Radix runs the Slot handler even after the child prevents default. Reference UI
does not: `defaultPrevented` is the explicit cancellation channel.

## Required cases

### Public type and anatomy

- [ ] `SL-TYPE-01` `[reference]` `[unit]` —
  **Slot should expose strict child typing when its public props extend `ReferenceSlotPartProps`.**
  Compile Slot with representative base and responsive StyleProps, native
  attributes, handlers, and exactly one React element, `null`, `false`, or an
  omitted child. Assert that text, numbers, and child arrays fail type checking
  despite the open merge-prop index signature, while Fragment rejection
  remains the runtime anatomy assertion in `SL-CHILD-04` rather than a
  duplicate universal PART case.

### Transparent child and ordinary props

- [ ] `SL-DOM-01` `[reference]` `[unit]` —
  **Slot should preserve the authored native element when it receives one native child.**
  Render Slot around a marked `<button>` and retain the child node returned by
  the renderer. Assert that the result is that same button with the same tag
  and that no Slot wrapper or additional DOM node exists.
- [ ] `SL-PROP-01` `[vendor]` `[unit]` —
  **Slot should forward its ordinary attributes when the child does not define them.**
  Render a button with Slot-only `name`, `data-owner`, and `aria-label`
  values. Assert that each exact value appears on the button and that Slot
  adds no other host element to receive them.
- [ ] `SL-PROP-02` `[vendor]` `[unit]` —
  **Slot should preserve child precedence when Slot and its child define the same ordinary prop.**
  Give Slot and its button different `id`, `title`, `tabIndex`, `disabled`,
  and non-composite ARIA values. Assert that every rendered value is the
  child's value while no conflicting Slot value leaks into the DOM.
- [ ] `SL-PROP-03` `[convergence]` `[unit]` —
  **Slot should respect an explicit child `undefined` when Slot supplies a value for the same prop.**
  Set a Slot prop such as `title="slot"` and include `title={undefined}` on
  the child. Assert that the rendered child has no `title` rather than
  restoring the Slot value, because key ownership must not depend on
  truthiness.
- [ ] `SL-PROP-04` `[vendor]` `[unit]` —
  **Slot should retain all disjoint props when Slot and its child contribute different keys.**
  Put `data-slot="yes"` and `aria-describedby="help"` on Slot, and `name` and
  `title` on the child. Assert that all four values coexist unchanged on the
  one rendered child.
- [ ] `SL-PROP-05` `[reference]` `[unit]` —
  **Slot should expose only current props when Slot or child values change across rerenders.**
  Render distinct Slot-only and child-only attributes, then remove some keys
  and replace the others with concrete new values. Assert that removed DOM
  attributes disappear and every surviving attribute reflects the latest
  render with no stale value.
- [ ] `SL-PROP-06` `[reference]` `[unit]` —
  **Slot should reach the eventual native node when its only child is a ref-forwarding custom component.**
  Render Slot around a custom component that forwards received props and its
  ref to an `<a>`, without an `as` prop or wrapper contract. Assert that the
  merged attributes are present on that link and no intermediate authored or
  Slot host is introduced.

### Classes and styles

- [ ] `SL-CLASS-01` `[vendor]` `[unit]` —
  **Slot should combine both class names when Slot and its child each provide one.**
  Render `className="slot"` on Slot and `className="child"` on the button.
  Assert that the button's exact class string is `slot child`, with each token
  present once and in Slot-then-child order.
- [ ] `SL-CLASS-02` `[convergence]` `[unit]` —
  **Slot should emit only meaningful class tokens when either class name is missing or empty.**
  Parameterize Slot and child class names across `undefined`, `null`, `""`,
  and one conditional token. Assert that the resulting class is absent or
  contains only the real token, never literal `undefined`/`null`, blank
  tokens, or extra whitespace.
- [ ] `SL-STYLE-01` `[vendor]` `[unit]` —
  **Slot should preserve both style objects when their declarations are disjoint.**
  Give Slot `{ color: "red" }` and the child `{ marginTop: 4 }`. Assert on the
  child's inline style or computed declarations that both values survive and
  no wrapper receives either style.
- [ ] `SL-STYLE-02` `[vendor]` `[unit]` —
  **Slot should let the child override only conflicting style properties when both sides provide styles.**
  Give Slot `color: red` and `padding: 4px`, then give the child `color: blue`
  and `margin: 2px`. Assert that the child renders blue while retaining the
  Slot-only padding and child-only margin.
- [ ] `SL-STYLE-03` `[reference]` `[unit]` —
  **Slot should remove stale inline declarations when merged styles change on rerender.**
  Initially render Slot and child styles, then remove one declaration from
  each side and change a remaining value. Assert that the removed
  declarations are absent and the changed declaration has only its current
  value on the same child node.

### Event composition and cancellation

- [ ] `SL-EVENT-01` `[vendor]` `[unit]` —
  **Slot should run the child handler before its own handler when both handle the same event.**
  Attach logging click handlers to Slot and its button, dispatch one click,
  and retain each received event object. Assert the exact log
  `["child", "slot"]`, one call per handler, and strict identity of the event
  passed to both.
- [ ] `SL-EVENT-02` `[reference]` `[unit]` —
  **Slot should skip its handler when the child prevents the shared event's default.**
  Have the child click handler log and call `preventDefault()` while Slot also
  has a click handler. Dispatch one cancelable click and assert that only the
  child log appears, `defaultPrevented` is true, and the Slot handler has no
  call.
- [ ] `SL-EVENT-03` `[reference]` `[unit]` —
  **Slot should still run its handler when the child only stops propagation.**
  Have the child click handler call `stopPropagation()` without preventing
  default, and log both child and Slot handlers. Assert child-then-Slot order
  on the slotted node while an ancestor listener receives nothing, proving
  Slot cancellation depends only on `defaultPrevented`.
- [ ] `SL-EVENT-04` `[vendor]` `[unit]` —
  **Slot should invoke every defined handler once when only one side supplies the event callback.**
  Parameterize only-child, only-Slot, child-with-Slot-`undefined`, and
  Slot-with-child-`undefined` click handlers. Dispatch one click per fixture
  and assert that the sole defined callback runs exactly once with no call or
  exception for the undefined side.
- [ ] `SL-EVENT-05` `[reference]` `[unit]` —
  **Slot should apply the same composition rules when different React event props are merged.**
  Parameterize click, keydown, pointerdown, focus, blur, input, and change,
  including each capture form, with handlers on Slot and child. Dispatch the
  matching event and assert one child-then-Slot sequence with the same event,
  plus Slot suppression whenever the child prevents default.
- [ ] `SL-EVENT-06` `[reference]` `[unit]` —
  **Slot should call the latest closures when event handlers change across rerenders.**
  Render child and Slot handlers that capture `"old"`, rerender the same node
  with handlers capturing `"new"`, and dispatch one click. Assert that only
  the new child-then-Slot log appears and neither stale callback runs.
- [ ] `SL-EVENT-07` `[reference]` `[browser]` —
  **Slot should produce one composed activation sequence when a real button is clicked or keyboard-activated.**
  On a native button, record child and Slot click handlers for a pointer click,
  Enter, and Space using real browser input. Assert exactly one
  child-then-Slot sequence per native activation and no synthetic duplicate
  sequence.

### Composite ARIA ID references

- [ ] `SL-ARIA-01` `[vendor]` `[unit]` —
  **Slot should normalize and deduplicate `aria-describedby` when Slot and child reference overlapping IDs.**
  Give the child `"child shared\tchild"` and Slot
  `" shared  slot "` as `aria-describedby` values. Assert the exact rendered
  token list `child shared slot`, preserving child-first order with one space
  and one occurrence per ID.
- [ ] `SL-ARIA-02` `[reference]` `[unit]` —
  **Slot should compose every documented multi-ID ARIA reference when both sides provide tokens.**
  Repeat the overlapping child/Slot fixture for `aria-labelledby`,
  `aria-controls`, and `aria-owns`. Assert that each attribute is normalized
  to child-first unique ID tokens using the same ordering rule as
  `aria-describedby`.
- [ ] `SL-ARIA-03` `[reference]` `[unit]` —
  **Slot should omit empty ARIA references when one or both sides provide no valid ID token.**
  Parameterize each composite ARIA attribute with only-child, only-Slot,
  whitespace-only, and empty-string values. Assert that valid one-sided IDs
  survive unchanged and an all-empty result removes the attribute instead of
  emitting a blank token list.
- [ ] `SL-ARIA-04` `[reference]` `[unit]` —
  **Slot should update composite ARIA references when an ID changes or disappears on rerender.**
  Render overlapping child and Slot IDs, then rename one ID and remove
  another without replacing the child. Assert that the merged attribute
  contains only the current deduplicated tokens and no stale reference.
- [ ] `SL-ARIA-05` `[vendor]` `[unit]` —
  **Slot should preserve the child's ordinary `id` when both Slot and child define one.**
  Render `id="slot-id"` on Slot and `id="child-id"` on the child. Assert that
  the native node's exact ID is `child-id`, never a concatenated or duplicated
  identifier.

### Ref composition

- [ ] `SL-REF-01` `[vendor]` `[react:all]` —
  **Slot should attach both object refs to the same native child when Slot and child each provide one.**
  Give Slot and its button separate `createRef` objects and mount once. Assert
  that both `.current` values are strictly the rendered button and neither
  points to an intermediate node.
- [ ] `SL-REF-02` `[vendor]` `[react:all]` —
  **Slot should attach mixed callback and object refs once when the slotted child mounts.**
  Test object-plus-callback and callback-plus-callback combinations while
  logging callback order. Assert one attachment per supplied ref, the same
  native child argument for all refs, and deterministic Slot-then-child
  attachment order.
- [ ] `SL-REF-03` `[vendor]` `[react:all]` —
  **Slot should keep its composed ref callback stable when ref inputs do not change across rerenders.**
  Have a forwarding child record every received ref identity, then rerender
  Slot multiple times with the same refs and child key. Assert one unique
  composed callback identity, one mounted node, and no detach/reattach calls.
- [ ] `SL-REF-04` `[vendor]` `[react:all]` —
  **Slot should settle without a ref loop when a callback ref schedules a render during attachment.**
  Pass Slot a stable callback ref that updates state whenever it receives the
  non-null button. Assert that rendering completes below a finite render-count
  guard, the button remains mounted once, and the callback is not repeatedly
  detached and attached.
- [ ] `SL-REF-05` `[vendor]` `[react:all]` —
  **Slot should clean up both refs when its native child is replaced or unmounted.**
  Attach Slot and child callback refs, replace the keyed button with a link,
  then remove it. Assert each old ref receives its React-version-appropriate
  cleanup callback or `null` exactly once, each current ref attaches to the
  replacement once, and both end detached.
- [ ] `SL-REF-06` `[reference]` `[react:all]` —
  **Slot should transfer one changed ref without disturbing the unchanged ref when refs update.**
  Mount with a stable child ref and Slot ref A, then rerender the same native
  node with Slot ref B. Assert A cleans up, B receives the existing node, and
  the child ref neither detaches nor changes its node.
- [ ] `SL-REF-07` `[reference]` `[react:all]` —
  **Slot should resolve every composed ref to the deepest native node when Slots are nested.**
  Nest two Slot layers around one button with a ref at every level, then
  unmount the tree. Assert that all refs receive the exact same button and
  each performs one React-version-appropriate cleanup with no wrapper node.

### Child invariants and nesting

- [ ] `SL-CHILD-01` `[vendor]` `[unit]` —
  **Slot should render nothing without error when its child is empty or falsy.**
  Parameterize no child, `null`, `undefined`, and `false` while Slot carries a
  marker prop. Assert an empty container, no leaked host for the marker, and
  no thrown error or console error.
- [ ] `SL-CHILD-02` `[vendor]` `[unit]` —
  **Slot should reject non-element content when its only active child is text or a number.**
  Render Slot separately with `"hello"` and `0`. Assert that each render
  throws the documented descriptive single-element error and leaves no
  partially rendered text or host node.
- [ ] `SL-CHILD-03` `[vendor]` `[unit]` —
  **Slot should reject multiple element children when more than one slot target is active.**
  Render two marked buttons as direct Slot children and capture the failure.
  Assert the same documented single-element error used for invalid scalar
  content and verify that neither button is partially committed.
- [ ] `SL-CHILD-04` `[reference]` `[unit]` —
  **Slot should fail loudly when a Fragment cannot accept the props that must be merged.**
  Give Slot a class, handler, and ref around a nonempty Fragment target.
  Assert a descriptive anatomy error, no silently unstyled fragment children,
  no handler attachment, and no ref attachment.
- [ ] `SL-CHILD-05` `[reference]` `[unit]` —
  **Slot should recursively merge every layer when nested Slots share one deepest child.**
  Nest outer and inner Slot props around one button with conflicting ordinary
  props, classes, styles, handlers, and refs, then activate it once. Assert
  deepest-child ordinary precedence, accumulated classes/styles, all refs on
  the button, and handler order from deepest to outer stopping at the first
  `preventDefault()`.
- [ ] `SL-CHILD-06` `[vendor]` `[react:all]` —
  **Slot should attach merged props and refs when a lazy forwarding child resolves under Suspense.**
  Render a lazy button in Slot with a marked fallback, Slot props, a handler,
  and a ref; resolve the lazy module and activate the button. Assert that the
  fallback never receives the merged props/ref, while the resolved button
  receives them once and runs the handler once.
- [ ] `SL-CHILD-07` `[reference]` `[unit]` —
  **Slot should attach current props and refs when its child changes between empty and one element.**
  Rerender one Slot from `null` to a button, update its props, return to empty,
  and mount the button again. Assert current attributes on each mount,
  correct attach/cleanup calls, and no stale cloned node or previous value.

## Composition gates

- [ ] `SL-COMP-01` `[reference]` `[browser]` —
  **Slot should preserve native button behavior when an authoring component merges onto it.**
  Compose Slot-owned classes, styles, ARIA references, a click handler, and a
  ref onto a consumer button, then activate it with pointer and keyboard.
  Assert one unwrapped button, the full merged surface, one shared native node
  for refs, and child-then-Slot activation order.
- [ ] `SL-COMP-02` `[reference]` `[browser]` —
  **Slot should merge two nested authoring components onto one link when both are transparent.**
  Wrap one consumer link in two Slot-based components with disjoint and
  conflicting props, handlers, styles, classes, and refs. Assert one link in
  the DOM with deepest-child precedence, accumulated composite values, every
  ref on that link, and deepest-to-outer handlers until cancellation.
- [ ] `SL-COMP-03` `[reference]` `[browser]` `[react:all]` —
  **Slot should preserve cancellation and ref ownership when a Suspense child resolves lazily.**
  Render a lazy forwarding child with a fallback beneath nested Slot behavior,
  then resolve it and have its consumer handler call `preventDefault()`.
  Assert that no merged surface touches the fallback, all refs attach to the
  resolved child, and the prevented event skips every outer Slot default.

`Tooltip.Trigger`, `RovingFocus.Item`, and `FocusLock` each get one integration
smoke proving they use Slot. Any merge-matrix regression is fixed here first.

## Out of scope

- `as` or polymorphic Reference UI primitives.
- A public Radix-style `Slottable` marker API.
- Merging multiple rendered descendants or choosing a target by selector.
