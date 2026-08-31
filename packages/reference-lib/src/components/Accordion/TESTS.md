# Accordion test contract

Playwright: `matrix/lib/tests/e2e/accordion.spec.ts`  
Page: `/accordion`

Accordion owns collection policy over Collapsible plus optional APG header
arrow traversal. It does not fork disclosure or Presence behavior. Header
buttons all remain in the native Tab sequence; Accordion must not apply a
one-tab-stop roving composite model.

The current value shape makes single accordions collapsible: activating the
already-open item requests `null`. Multiple values are emitted in current DOM
order for deterministic controlled state.

## Freeze defaults

`expansion`, `value`, and `keyboard` are optional with the documented omitted
behavior: controlled single expansion, `value=null`, and APG header traversal
enabled. Applications can opt out with `keyboard="none"`.

## Source evidence

- `vendor/radix-primitives/packages/react/accordion/src/accordion.test.tsx` —
  single/multiple policy, disabled items, orientation key matrices, wrapping,
  Home/End, and accessibility checks.
- `vendor/base-ui/packages/react/src/accordion/root/AccordionRoot.test.tsx` —
  controlled values, generated/manual trigger-panel IDs, cancellation,
  disabled items, multiple expansion, and keyboard activation.
- `vendor/react-spectrum/packages/react-aria-components/test/Disclosure.test.js`
  — one-vs-many disclosure groups, controlled expanded keys, nested groups.
- Zag Accordion's next/previous/first/last events are a second opinion on the
  header traversal policy.

## Required cases

### DOM and collection identity

- [x] `AC-DOM-01` `[reference]` `[browser]` —
  **Accordion should render one root while preserving each Collapsible's
  transparent disclosure anatomy.** Render two items between identifiable
  siblings and inspect the complete element tree. Assert Accordion contributes
  one native `div`, each child contributes only its native Trigger `button`
  and mounted Content `div`, and no item, header, policy, or registration
  wrapper is inserted; Accordion must remain collection policy rather than a
  second disclosure runtime.
- [x] `AC-DOM-02` `[reference]` `[browser]` —
  **Accordion should forward its native root contract to the rendered div.**
  Supply root `id`, `aria-*`, `data-*`, class, style, click and key handlers,
  an object ref, and a callback ref, then interact and rerender. Assert every
  non-consumed `HTMLDivElement` prop reaches that same node, handlers run once,
  refs use supported React cleanup semantics, and no child state attribute
  overwrites root styling; only behavioral `onChange` is intentionally not a
  native div event.
- [x] `AC-DOM-03` `[vendor]` `[browser]` —
  **Accordion item identity should stay separate from Collapsible's generated
  trigger-to-content linkage.** Render items with
  `id="billing"` and `id="team"` and no explicit part IDs, then open both in
  multiple mode. Assert item IDs drive only Accordion value policy, each
  Trigger's `aria-controls` matches its own unique Content ID, and no generated
  ID equals or collides with an item identity. This adapts Base UI
  `AccordionRoot.test.tsx` / “renders correct ARIA attributes” while leaving
  linkage with Collapsible.
- [x] `AC-DOM-04` `[reference]` `[browser]` —
  **Accordion should track dynamic items by stable ID rather than render
  position.** Start with controlled value `"b"` over items A/B/C, insert X
  before B, move B after C, remove A, and finally remove B. Assert B remains
  the sole expanded item with the same surviving Trigger/Content nodes through
  insertion and reorder, then no mounted item is expanded after B's removal
  and no stale registration or Content remains; array indices must never
  become identity.
- [x] `AC-DOM-05` `[reference]` `[browser]` —
  **Accordion should reject missing, empty, or duplicate item identities
  instead of assigning positions.** In development fixtures, render an
  Accordion-owned Collapsible with no `id`, with `id=""`, and two children
  with `id="billing"`. Assert each invalid shape produces one descriptive
  identity error naming Accordion and the offending condition, registers no
  ambiguous item, and does not leave partial ARIA linkage; dynamic collection
  policy requires durable application identity.
- [x] `AC-DOM-06` `[reference]` `[browser]` —
  **Accordion should tolerate controlled values for currently unmounted items
  without correcting application state.** Render single `value="missing"` and
  multiple `value={["missing","also-missing"]}` over mounted A/B, then insert
  the matching item later. Assert initially no Trigger reports expanded and
  `onChange` is untouched, while insertion makes the controlled matching item
  open without a corrective callback; temporary collection absence must not
  mutate parent state.
- [x] `AC-DOM-07` `[reference]` `[browser]` —
  **Accordion should default omitted policy to controlled single-null state
  with header traversal enabled.** Omit `expansion`, `value`, and `keyboard`,
  focus A, press ArrowDown, and activate focused B while recording
  `onChange` but not updating props. Assert focus moves to B, one `"b"`
  request is emitted, every item remains closed, and all enabled Triggers keep
  native `tabIndex=0`; omission must not create uncontrolled expansion or a
  roving tab stop.
- [x] `AC-DOM-08` `[reference]` `[browser]` —
  **Accordion should remain the sole expansion authority when a child
  Collapsible supplies competing controlled props.** In development, render
  an item with child `open=true` and child `onChange` alongside root
  `value=null` and root `onChange`, then activate its Trigger. Assert one
  descriptive competing-authority diagnostic identifies `open`/`onChange`,
  rendered state follows the root value, only root `onChange("a")` can be
  requested, and the child callback never runs; two controlled sources cannot
  be reconciled safely.

### Single expansion

- [x] `AC-SINGLE-01` `[vendor]` `[browser]` —
  **A single Accordion should request the newly activated item before changing
  which disclosure is open.** Render controlled `value="a"`, click B, inspect
  before the parent update, then rerender with `value="b"`. Assert the callback
  log is exactly `["b"]`, A alone remains expanded before acceptance, and only
  after the prop update does B become expanded while A enters closed Presence
  exit. This ports Radix `accordion.test.tsx` / “then clicking another
  trigger” to request-only controlled state.
- [x] `AC-SINGLE-02` `[convergence]` `[browser]` —
  **A single Accordion should allow its currently open item to request the
  all-collapsed value.** Render `value="a"` and activate A once by pointer,
  then repeat with native Space and Enter in reset fixtures. Assert each
  gesture requests `onChange(null)` exactly once and A remains open until the
  parent accepts `null`; this follows React Spectrum DisclosureGroup's
  collapsible behavior rather than Radix's non-collapsible single default.
- [x] `AC-SINGLE-03` `[reference]` `[browser]` —
  **A single Accordion should preserve its controlled open item when the
  parent rejects opening or closing requests.** With A open, first activate B
  and then A without changing `value="a"`. Assert callbacks request `"b"` then
  `null`, but A's Trigger, Content, linkage, `data-state`, focusability, and
  visibility remain authoritative throughout; neither request may create
  optimistic policy state.
- [x] `AC-SINGLE-04` `[vendor]` `[browser]` —
  **A single Accordion should follow programmatic value changes without
  echoing user requests.** Without activating a Trigger, rerender
  `"a" → "b" → null → "a"` and let each Presence exit finish. Assert
  Collapsible ARIA/state and mounted Content follow each value, exactly one
  item is logically expanded at a time, and `onChange` remains empty. This
  adapts Base UI `AccordionRoot.test.tsx` / controlled “open state.”
- [x] `AC-SINGLE-05` `[vendor]` `[browser]` —
  **A disabled Accordion item should not request policy changes or displace
  the current item.** Render A open and B disabled, attempt primary click,
  Space, and Enter on B's Trigger, and inspect both disclosures. Assert B is a
  native disabled button with `data-disabled`, root `onChange` is never
  called, and A stays open. This ports Base UI
  `AccordionRoot.test.tsx` / “does not toggle or fire callbacks when the item
  is disabled.”
- [x] `AC-SINGLE-06` `[reference]` `[browser]` —
  **Accordion should honor a consumer-canceled Trigger activation before
  computing a single-value request.** Give closed A a consumer `onClick` that
  logs and calls `preventDefault()`, then primary-click it while the root logs
  `onChange`. Assert only the consumer log runs, root `onChange` is absent, and
  A remains closed; Slot event order must cancel both Collapsible activation
  and the collection policy built on it.

### Multiple expansion

- [x] `AC-MULTI-01` `[vendor]` `[browser]` —
  **A multiple Accordion should request a one-item array when opening from an
  empty value.** Render `expansion="multiple" value={[]}`, activate A once,
  and leave the controlled prop unchanged. Assert `onChange` is called once
  with a fresh `["a"]` array while every item stays closed until acceptance.
  This ports Radix `accordion.test.tsx` / multiple “should call
  onValueChange” without uncontrolled state.
- [x] `AC-MULTI-02` `[vendor]` `[browser]` —
  **A multiple Accordion should append a newly opened item in current DOM
  order while retaining existing items.** Render A/B/C with
  `value={["a"]}`, activate B, inspect the request, then accept it. Assert the
  sole request is `["a","b"]` and both A and B report expanded only after the
  controlled update, with C closed. This ports Radix multiple / “should not
  hide the previous content.”
- [x] `AC-MULTI-03` `[vendor]` `[browser]` —
  **A multiple Accordion should remove only the activated open item.** Render
  `value={["a","b"]}`, activate A, and then accept the emitted value. Assert
  the request is exactly `["b"]`, B remains open throughout, and only A enters
  closed Presence exit. This ports Radix multiple / “then clicking the trigger
  again” and protects independent expansion.
- [x] `AC-MULTI-04` `[reference]` `[browser]` —
  **A multiple Accordion should canonicalize its next request by current item
  order without losing unknown controlled IDs.** Render A/B/C as
  `value={["ghost-2","c","a","c","ghost-1"]}`, reorder mounted items to C/B/A,
  and activate B. Assert the emitted array is
  `["c","b","a","ghost-2","ghost-1"]`: known IDs are deduplicated in new DOM
  order and unknown IDs move to the tail in their incoming relative order;
  deterministic output must not silently delete temporarily unmounted state.
- [x] `AC-MULTI-05` `[reference]` `[browser]` —
  **A multiple Accordion should not optimistically open or close items after a
  rejected array request.** With `value={["a"]}`, activate B and then A while
  keeping the prop unchanged. Assert callbacks request `["a","b"]` then `[]`,
  but only A stays expanded and no transient B Content or A closed state is
  committed; the controlled array is the sole rendered authority.
- [x] `AC-MULTI-06` `[reference]` `[browser]` —
  **Accordion should reject an expansion-mode change whose controlled value
  has the wrong shape.** Rerender `expansion="single" value="a"` directly as
  `expansion="multiple"` with the still-string value, and separately rerender
  a multiple array into single mode. Assert one descriptive development error
  names the incompatible mode/value pair, no `onChange` fires, and the invalid
  commit does not guess an item or reinterpret characters as IDs; runtime
  validation must match the discriminated public type.
- [x] `AC-MULTI-07` `[reference]` `[browser]` —
  **A multiple Accordion should default an omitted value to a controlled empty
  array.** Render `expansion="multiple"` without `value`, activate A with and
  without an `onChange` callback in separate fixtures, and do not rerender
  state. Assert the callback fixture requests `["a"]` once, both fixtures keep
  every item closed, and no hidden array store appears; omitted value and
  uncontrolled state are not synonyms.

### Header keyboard policy

- [x] `AC-KEY-01` `[vendor]` `[browser:all]` —
  **Accordion header traversal should move ArrowDown to the next enabled
  Trigger and wrap at the end.** With `keyboard="headers"` and enabled A/B/C,
  focus A and press ArrowDown, then focus C and press ArrowDown. Assert focus
  moves A→B and C→A, each handled event is prevented from scrolling, and no
  expansion callback runs. This ports Radix `accordion.test.tsx` /
  “on `ArrowDown` should move focus to the next trigger” and its end wrap.
- [x] `AC-KEY-02` `[vendor]` `[browser:all]` —
  **Accordion header traversal should move ArrowUp to the previous enabled
  Trigger and wrap at the beginning.** Focus C and press ArrowUp, then focus A
  and press ArrowUp under `keyboard="headers"`. Assert focus moves C→B and
  A→C, the page does not scroll, and controlled expansion is unchanged. This
  ports Radix `accordion.test.tsx` / the two `ArrowUp` cases.
- [x] `AC-KEY-03` `[vendor]` `[browser]` —
  **Accordion header traversal should send Home and End to the enabled
  boundaries.** With A/B/C/D and B disabled, focus C, press Home, restore
  focus to C, and press End. Assert Home focuses A and End focuses D without
  changing any expanded state or callback log. This ports Radix
  `accordion.test.tsx` / “on `Home`” and “on `End`.”
- [x] `AC-KEY-04` `[vendor]` `[browser]` —
  **Accordion header traversal should skip every disabled item, including a
  trigger disabled after it held focus.** Render A enabled, B/C disabled, and
  D enabled; verify A ArrowDown reaches D and D ArrowUp reaches A, then focus
  B before rerendering it disabled and dispatch ArrowDown from that retained
  node. Assert the final focus is D, no disabled Trigger becomes the target,
  and no policy request occurs; disabled collection entries cannot strand
  traversal.
- [x] `AC-KEY-05` `[reference]` `[browser]` —
  **Accordion arrow and boundary keys should move focus without activating an
  item.** Start with A open, use ArrowDown, ArrowUp, Home, and End to visit
  other enabled Triggers, and inspect state after each key. Assert
  `value="a"`, all `aria-expanded` values, Content mounting, and `onChange`
  remain unchanged until a primary click, Space, or Enter activates the
  focused Trigger; optional traversal is navigation only.
- [x] `AC-KEY-06` `[vendor]` `[browser]` —
  **Accordion should apply single or multiple expansion policy exactly once
  for native Space and Enter activation.** In reset single and multiple
  fixtures, focus B, hold and release Space and then Enter while recording
  native key, click, and root callback order. Assert Space requests only on its
  native keyup click, Enter follows native button click timing, and each
  completed gesture yields exactly one correct `"b"` or `["b"]` request with
  no synthetic duplicate. This adapts Base UI `AccordionRoot.test.tsx` /
  “opens and closes on Space keyup” to fixed native buttons.
- [x] `AC-KEY-07` `[vendor]` `[browser]` —
  **Accordion should ignore traversal keys originating inside item Content.**
  Open A with a text input, link, and nested button inside Content, focus each
  and press ArrowUp, ArrowDown, Home, End, Space, and Enter where native.
  Assert focus and native editing/activation remain with that descendant, no
  header receives focus, and root `onChange` is untouched; header policy must
  be scoped to Trigger events.
- [x] `AC-KEY-08` `[reference]` `[browser]` —
  **Accordion should leave header navigation entirely native when keyboard
  traversal is disabled.** Render `keyboard="none"`, focus B, and press every
  Arrow key, Home, and End before activating B by Space, Enter, and primary
  click in reset fixtures. Assert navigation keys are not
  `defaultPrevented` and do not move focus, while each native activation still
  emits exactly one expansion-policy request; opting out removes only optional
  traversal.
- [x] `AC-KEY-09` `[reference]` `[browser]` —
  **Accordion should let consumer key cancellation run before header
  navigation or native activation.** On B's Trigger, log `onKeyDown` and call
  `preventDefault()` for ArrowDown, Home, Space, and Enter in separate reset
  fixtures. Assert the consumer handler is first, focus stays on B, no native
  click or root `onChange` follows canceled activation keys, and unrelated
  keys remain native; this freezes Slot cancellation order.
- [x] `AC-KEY-10` `[reference]` `[browser]` —
  **Accordion should recompute header order after dynamic collection changes
  without remounting surviving Triggers.** Capture A/B/C node identities,
  insert X between A and B, remove B, and reorder to C/X/A, using ArrowDown
  after each commit. Assert movement follows A→X, then X→C, then C→X in the
  current DOM order, surviving node references remain identical, and removed
  B receives no stale focus or listener; navigation must follow live
  registration.
- [x] `AC-KEY-11` `[convergence]` `[browser]` —
  **Accordion should keep every enabled header in the browser's native Tab
  sequence even after arrow focus moves.** Place a link before the Accordion,
  enabled headers A/B/C with a focusable control inside open B Content, and a
  link after it; arrow-focus C, then traverse the whole fixture with Tab and
  Shift+Tab. Assert each enabled header is visited at `tabIndex=0` in document
  order, disabled headers are skipped, open Content descendants keep their
  native position, and arrow history changes none of those tab indices. This
  deliberately follows APG/React Spectrum disclosure tabbing rather than
  Radix's one-tab-stop RovingFocus implementation.

### Nesting, Presence, and environments

- [x] `AC-NEST-01` `[vendor]` `[browser]` —
  **A nested Accordion should keep its collection, values, and header keys
  independent from its parent.** Open outer A containing an inner Accordion,
  activate inner X, and use ArrowDown/Home within the inner headers before
  activating outer B. Assert inner requests go only to the inner callback,
  outer requests only to the outer callback, key traversal never crosses
  collection boundaries, and duplicate item IDs across levels do not collide.
  This ports React Spectrum `Disclosure.test.js` / “should support nested
  DisclosureGroups.”
- [x] `AC-NEST-02` `[reference]` `[browser]` —
  **A standalone Collapsible inside Accordion Content should not become an
  Accordion item.** Open parent item A whose Content contains an independently
  controlled Collapsible `id="details"`, then toggle that nested Trigger
  twice. Assert only the nested Collapsible callback receives `true` and
  `false`, parent Accordion value remains `"a"`, and its header navigation
  registry still contains only authored top-level items; DOM nesting alone
  must not imply collection membership.
- [x] `AC-PRES-01` `[vendor]` `[browser]` —
  **A single Accordion should expose only the new item as expanded while the
  old Content completes its exit.** Render A open with 100 ms exits on both A
  and B, activate B, record the root request, and accept `value="b"`. Assert
  callback order is Trigger click → `onChange("b")` → parent commit, B becomes
  `aria-expanded="true"` immediately, A becomes false while its same inert
  `data-state="closed"` Content remains for Presence, and only A's completion
  removes it. This adapts Base UI Collapsible transition regressions to
  Accordion's policy boundary.
- [x] `AC-ENV-01` `[reference]` `[ssr]` —
  **Accordion should hydrate controlled single and multiple collections
  without changing IDs or correcting state.** Server-render single
  `value="a"` and multiple `value={["a","b"]}` fixtures with generated part
  IDs, hydrate them, and compare relationships before any interaction. Assert
  no warning or `onChange`, identical item expansion, stable
  Trigger/Content IDs, and no duplicated registration; controlled state must
  be deterministic across the hydration boundary.
- [x] `AC-ENV-02` `[reference]` `[react:all]` —
  **Accordion should register each item and emit each activation request once
  across supported React and StrictMode behavior.** In React 17, 18, and 19,
  mount dynamic A/B/C under available StrictMode, capture refs, and activate B
  once by pointer and once by keyboard in reset fixtures. Assert one current
  registration per ID, exactly one correct request per gesture, stable
  surviving Trigger nodes on no-op rerender, and version-appropriate ref
  cleanup only on removal; effect replay cannot multiply policy.
- [x] `AC-A11Y-01` `[vendor]` `[browser]` —
  **Accordion should remain accessibility-clean across every supported
  expansion and disabled-state shape.** Run the configured accessibility
  checker on all closed, controlled single-open, multiple-open, and mixed
  disabled/open fixtures after Presence settles. Assert no violations plus
  valid expanded/control relationships, unique IDs, native disabled buttons,
  and reachable enabled headers; this extends Radix
  `accordion.test.tsx` / “should have no accessibility violations” beyond its
  default states.

## Composition gates

- [x] `AC-COMP-01` `[reference]` `[browser]` —
  **A single Accordion should implement a collapsible FAQ with native header
  tabbing.** Build three FAQ items under controlled single/null state, accept
  open and close requests, and exercise pointer, Space, Enter, arrows, Home,
  End, Tab, and Shift+Tab. Assert only one answer is open, activating it again
  closes all, arrow keys move focus only, and every enabled question remains
  a native Tab stop; this proves the primary APG composition.
- [x] `AC-COMP-02` `[reference]` `[browser]` —
  **A multiple Accordion should keep animated settings sections independently
  controllable.** Build three controlled settings sections with focusable
  Content and distinct height/keyframe exits, open A and C, close A during C's
  resize, and reorder C before B. Assert emitted arrays follow live DOM order,
  C remains expanded and interactive, A exits inertly using its own measured
  lifecycle, and surviving IDs/focus stay stable; this combines policy,
  measurement, and Presence without a second panel runtime.
- [x] `AC-COMP-03` `[reference]` `[browser]` —
  **Accordion should scope header traversal to the outer group that enables
  it in nested disclosure compositions.** Build an outer
  `keyboard="headers"` Accordion
  containing an inner `keyboard="none"` Accordion and a standalone
  Collapsible in one panel, with independent controlled values. Assert outer
  arrows visit only outer headers, inner arrows remain native, each activation
  reaches only its owning callback, all enabled headers remain in Tab order,
  and every Trigger/Content relationship is unique; this proves nested
  collection and standalone authority boundaries together.

## Owned elsewhere

- Trigger/content ARIA and exit mounting: `Collapsible`.
- Header ordering/disabled-skip helpers may share internal collection code with
  `RovingFocus`, but Accordion deliberately does not inherit its one-tab-stop
  contract.
- Transition/animation event matrix: `Presence`.

## Out of scope

- A second Accordion-specific disclosure implementation.
- Uncontrolled/default values, Provider APIs, horizontal orientation, or
  vendor heading wrappers not present in the public API.
