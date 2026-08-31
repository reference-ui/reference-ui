# Collapsible test contract

Playwright: `matrix/lib/tests/e2e/collapsible.spec.ts`  
Page: `/collapsible`

Collapsible owns one controlled disclosure relationship and its Presence
integration. Accordion owns collection policy.

Content exposes measured
`--reference-collapsible-content-height`/`-width` values for unstyled
application exit CSS. Internal measurement never overwrites consumer layout or
transform styles.

## Source evidence

- `vendor/radix-primitives/packages/react/collapsible/src/collapsible.test.tsx`
  — controlled state, trigger/content linkage, disabled behavior, and native
  part forwarding.
- `vendor/base-ui/packages/react/src/collapsible/panel/CollapsiblePanel.test.tsx`
  — interrupted transitions, measured close, initially-open motion, and stale
  animation races.
- `vendor/react-spectrum/packages/react-aria-components/test/Disclosure.test.js`
  — controlled expansion, click/keyboard activation, disabled and nested
  disclosures.
- Ariakit `disclosure` and Zag `collapsible` are equivalent-state references.

## Required cases

### DOM, linkage, and state

- [x] `CO-DOM-01` `[reference]` `[browser]` —
  **Collapsible should add no wrapper around its fixed trigger and content
  elements.** Render one open disclosure between identifiable siblings.
  Assert that Collapsible contributes no root node, Trigger is the authored
  native `button`, Content is the authored native `div`, and the siblings stay
  adjacent; this freezes the transparent-root anatomy.
- [x] `CO-DOM-02` `[vendor]` `[browser]` —
  **Collapsible should link an open trigger to its mounted content.** Render
  `open=true` with no explicit Content ID and inspect both parts before any
  interaction. Assert Trigger has `aria-expanded="true"` and `aria-controls`
  exactly equal to Content's nonempty unique `id`. This ports Radix
  `collapsible.test.tsx` / “should reference the rendered content while open.”
- [x] `CO-DOM-03` `[vendor]` `[browser]` —
  **Collapsible should keep its relationship valid throughout a closed exit
  and remove it after unmount.** Close an open controlled disclosure whose
  Content has a 100 ms exit transition, then inspect the trigger and the
  original Content before and after `transitionend`. Assert
  `aria-expanded="false"` immediately, the same `aria-controls` target remains
  mounted with `data-state="closed"` during exit, and Content plus the now
  dangling `aria-controls` are absent after exit; this converges Radix
  “should not reference a non-existent element while closed” with Presence.
- [x] `CO-DOM-04` `[reference]` `[browser]` —
  **Collapsible should expose authoritative open, closed, and disabled state
  on its rendered parts.** Rerender one disclosure through open, closing-exit,
  reopened, and root-disabled states while also supplying conflicting
  consumer `data-state` and `data-disabled` values. Assert Trigger and mounted
  Content report the controlled `data-state`, disabled Trigger reports
  `data-disabled`, and unrelated consumer data attributes remain untouched;
  internal state must not be forgeable through native props.
- [x] `CO-DOM-05` `[reference]` `[browser]` —
  **Collapsible should honor an explicit Content ID as the control target.**
  Render open Content with `id="billing-details"` and a Trigger with no
  generated assumptions. Assert Content keeps that exact ID and Trigger's
  sole `aria-controls` token is `billing-details`; explicit application
  identity must win over generated identity.
- [x] `CO-DOM-06` `[reference]` `[browser]` —
  **Collapsible should update generated linkage atomically when an explicit
  Content ID changes or disappears.** Rerender one open disclosure from no
  Content ID, to `id="first-panel"`, to `id="second-panel"`, and back to no
  ID. After each commit, assert `aria-controls` equals the currently mounted
  Content ID, old IDs are absent from the document and ARIA tokens, and the
  restored generated ID is stable on later rerenders; this prevents stale
  references during dynamic authoring.
- [x] `CO-DOM-07` `[reference]` `[browser]` —
  **Collapsible should generate instance-safe linkage for disclosures with
  identical content.** Render two open Collapsibles with the same Trigger and
  Content text, including one in a second React root. Assert the two Content
  IDs differ and each Trigger resolves only to its own Content; labels and
  root boundaries must never collide generated relationships.
- [x] `CO-DOM-08` `[reference]` `[browser]` —
  **Collapsible should forward native props and refs to the fixed Trigger and
  Content elements.** Give both parts native attributes, `aria-*`, `data-*`,
  classes, styles, ordinary handlers, object refs, and callback refs, then
  click each element and rerender once. Assert every prop lands on the
  documented native element, both handlers run once, refs receive that element
  with supported React cleanup semantics, and internal ARIA/CSS properties
  coexist with unrelated consumer styling.
- [x] `CO-DOM-09` `[reference]` `[browser]` —
  **Collapsible should tolerate either authored part being absent without
  inventing markup.** Render Trigger-only, Content-only with `open=true`, and
  an empty Collapsible, then rerender among those shapes. Assert no exception,
  hidden substitute trigger, substitute content, dangling `aria-controls`, or
  extra host appears; this keeps missing author markup from becoming secret
  runtime anatomy.
- [x] `CO-DOM-10` `[reference]` `[browser]` —
  **Collapsible should keep its trigger non-submitting unless the application
  explicitly chooses submission.** Put a closed Collapsible inside a form
  with a submit spy, first omit Trigger `type`, then rerender it with
  `type="submit"` and activate it. Assert the default is
  `button[type="button"]` and toggling does not submit, while the explicit
  submit type preserves native submission in addition to the controlled
  request; this avoids accidental form submits without suppressing authored
  browser behavior.

### Controlled activation

- [x] `CO-ACT-01` `[vendor]` `[browser:all]` —
  **Collapsible should request opening once when an enabled closed trigger is
  clicked.** Render `open=false` with an `onChange` log and perform one primary
  mouse click on Trigger. Assert the log is exactly `[true]` and the controlled
  DOM remains closed until the parent supplies `open=true`. This ports Radix
  `collapsible.test.tsx` / the closed Trigger “should open the content” path
  while preserving Reference UI's request-only authority.
- [x] `CO-ACT-02` `[vendor]` `[browser:all]` —
  **Collapsible should request closing once when an enabled open trigger is
  clicked.** Render `open=true`, click Trigger once with the primary mouse
  button, and leave the prop unchanged. Assert `onChange` receives exactly
  `false` once and Content remains observably open because the parent rejected
  the request. This ports Radix “given an open controlled Collapsible” /
  “should call `onOpenChange` prop with `false` value.”
- [x] `CO-ACT-03` `[vendor]` `[browser:all]` —
  **Collapsible should use native button keyboard activation without duplicate
  toggle requests.** Focus a closed Trigger, perform a complete Space
  press/release and, after resetting the log, a complete Enter press/release;
  also send repeated keydown events before each single keyup. Assert each
  physical key gesture produces one `onChange(true)`, Space does not activate
  before keyup, and no synthetic key handler adds a second click. This adapts
  React Spectrum `Disclosure.test.js` / “should not expand or collapse on
  repeat keydown events” to the fixed native button.
- [x] `CO-ACT-04` `[reference]` `[browser]` —
  **Collapsible should leave controlled rendering unchanged when its parent
  ignores a toggle request.** Exercise a closed and an open fixture, click
  each Trigger, and record callbacks without changing either `open` prop.
  Assert the requests are `true` and `false` respectively while all ARIA,
  `data-state`, Content mounting, and visibility continue to reflect the
  supplied props; callbacks are requests, not hidden state mutations.
- [x] `CO-ACT-05` `[reference]` `[browser]` —
  **Collapsible should follow programmatic controlled state without echoing a
  change request.** Rerender the same disclosure
  `false → true → false → true` without activating Trigger. Assert
  `aria-expanded`, linkage, part `data-state`, Content visibility, and Presence
  lifecycle follow each prop commit while `onChange` stays empty; parent
  updates must not be mistaken for user intent.
- [x] `CO-ACT-06` `[convergence]` `[browser]` —
  **Collapsible should run the consumer Trigger click handler before deciding
  whether to request a toggle.** Log a consumer `onClick` and `onChange`, click
  once normally, then click with the consumer handler calling
  `preventDefault()`. Assert normal order is `onClick` then `onChange(true)`,
  the prevented click logs only `onClick`, and controlled state stays closed;
  this applies Slot's cancellation order to the disclosure default.
- [x] `CO-ACT-07` `[vendor]` `[browser]` —
  **Collapsible should block activation without overriding a controlled open
  value when disabled.** Render `disabled open={true}`, attempt primary click,
  Space, and Enter on Trigger, then programmatically keep `open=true`. Assert
  the native Trigger is disabled, no `onChange` request occurs, and Content
  remains open with its linkage and state intact. This ports React Spectrum
  `Disclosure.test.js` / “should expand a disabled disclosure via
  isExpanded.”
- [x] `CO-ACT-08` `[reference]` `[browser]` —
  **Collapsible should ignore input that is not native trigger activation.**
  With `open=false`, send ArrowDown, Escape, and printable keys to Trigger,
  use secondary and auxiliary pointer buttons on it, and primary-click both
  Content and an outside button. Assert `onChange` remains empty and native
  key/click propagation is not prevented; Collapsible owns only native primary
  button activation.
- [x] `CO-ACT-09` `[reference]` `[browser]` —
  **Collapsible should activate against the latest controlled value and
  callback after rerender.** Render closed with callback A, rerender open with
  callback B without replacing Trigger, and click the surviving button; then
  rerender closed with callback C and click again. Assert only B receives
  `false` and only C receives `true`, with A untouched; this prevents stale
  closure and registration bugs.
- [x] `CO-ACT-10` `[reference]` `[browser]` —
  **Standalone Collapsible should default omitted state to controlled closed
  without creating an internal store.** Outside Accordion, omit `open`, first
  provide an `onChange` spy and activate Trigger, then rerender with
  `onChange` omitted and activate again. Assert the first gesture requests
  `true`, neither gesture mounts Content or changes `aria-expanded="false"`,
  and the missing callback is safe; omitted props must not imply uncontrolled
  behavior.

### Presence lifecycle

- [x] `CO-PRES-01` `[vendor]` `[browser:all]` —
  **Collapsible should keep transitioning Content mounted until its own exit
  completes.** Open Content with a 100 ms height transition, commit
  `open=false`, and observe the close commit, next frame, and
  `transitionend`. Assert measured pixel variables are captured before
  `data-state="closed"` starts the transition, the same inert Content remains
  mounted while `aria-expanded` is already false, and it unmounts only after
  its own completion event. This ports Base UI
  `CollapsiblePanel.test.tsx` / “restores a measured height before applying
  closing transition styles.”
- [x] `CO-PRES-02` `[vendor]` `[browser:all]` —
  **Collapsible should keep keyframe-exiting Content mounted until the exit
  animation finishes.** Apply a named 100 ms keyframe only to closed Content,
  close the controlled disclosure, and dispatch both a descendant
  `animationend` and the Content node's own completion. Assert closed state and
  measured pixels precede waiting, the descendant event does not remove
  Content, and the node event unmounts it once. This ports Base UI
  “restores measured dimensions before applying a closing keyframe animation”
  through the shared Presence owner.
- [x] `CO-PRES-03` `[convergence]` `[browser]` —
  **Collapsible should remove closed Content immediately when no finite exit
  motion exists.** Close separate open fixtures with no animation, with
  computed transition/animation durations of `0s`, and with a
  `prefers-reduced-motion` rule that reduces both to zero. Assert Content is
  absent in the close commit with no awaited event or stranded isolation;
  Collapsible must inherit Presence's deterministic zero-motion path.
- [x] `CO-PRES-04` `[vendor]` `[browser]` —
  **Collapsible should cancel an in-flight exit when controlled state reopens.**
  Start a 100 ms close transition, capture the Content element, rerender
  `open=true` before completion, and then fire the old transition's end event.
  Assert the same node survives, becomes interactive
  `data-state="open"`, retains current measurements, and cannot be removed by
  the stale event. This ports Base UI “keeps exit transitions working after a
  close is interrupted by reopening.”
- [x] `CO-PRES-05` `[vendor]` `[browser]` —
  **Collapsible should give each exit a fresh lifecycle without replaying
  mount-only motion.** Mount `open=true` with open and closed keyframes, verify
  the initial Content runs no entrance animation, then close, reopen, and
  close again while logging animation events. Assert reopen can run its normal
  entrance once, the second close waits for its own exit and unmounts once, and
  stale first-exit completion cannot restart entry or remove it. This combines
  Base UI “does not run the mount animation when initially open” and “does not
  restart the entrance transition when a close animation finishes after
  reopening.”
- [x] `CO-PRES-06` `[reference]` `[browser]` —
  **Collapsible should clean up immediately when the whole disclosure
  disappears during exit.** Begin a nonzero Content transition, then unmount
  Collapsible from its parent before completion and fire a late end event on
  the detached node. Assert Content is detached, refs receive cleanup, no
  listener causes another callback or state update, and no console warning is
  emitted; owner removal outranks suspended Presence.
- [x] `CO-PRES-07` `[reference]` `[browser]` —
  **Collapsible should evacuate focus before closing Content becomes inert.**
  Focus an input inside open Content and programmatically close it, then repeat
  after removing or disabling Trigger. Assert the enabled Trigger receives
  focus before Content isolation in the first fixture, while the second leaves
  focus on the connected `document.body` fallback outside Content, with no
  focus bounce back or Tab trap; logically closed descendants must not retain
  active focus.
- [x] `CO-PRES-08` `[reference]` `[browser]` —
  **Collapsible should isolate visually exiting closed Content and restore
  only isolation it owns.** Close Content containing a link and button under a
  100 ms visual exit, attempt pointer, programmatic focus, Tab, and
  accessibility-tree queries during that interval, then reopen before it
  ends. Assert closed Content is inert/noninteractive, `aria-hidden`, absent
  from sequential focus and accessibility queries, and emits no child
  handlers; reopening removes Collapsible-added isolation while preserving
  any consumer-authored `inert` or `aria-hidden` values.

### Measured-size styling

- [x] `CO-SIZE-01` `[vendor]` `[browser]` —
  **Collapsible should publish finite pixel measurements for open Content's
  border box.** Render open Content with a `120px × 48px` content box,
  `3px` padding on each side, and `2px` borders, then read its bounding rect
  and computed custom properties after layout. Assert
  `--reference-collapsible-content-width` and
  `--reference-collapsible-content-height` are `"130px"` and `"58px"` within
  one device pixel and match the rect, including padding and borders. This
  lifts Radix's `--radix-collapsible-content-*` measurement contract while
  freezing Reference UI's border-box values.
- [x] `CO-SIZE-02` `[vendor]` `[browser]` —
  **Collapsible should snapshot the last open size before closed CSS can
  collapse the box.** Give open Content a `160px × 64px` border box and closed
  CSS that immediately targets height and width `0`, then commit
  `open=false` while recording mutation and transition events. Assert both
  custom properties still expose `160px` and `64px` before
  `data-state="closed"` is observable and retain those values throughout exit,
  rather than becoming `0px` or `auto`. This ports Base UI “restores a
  measured height before applying closing transition styles.”
- [x] `CO-SIZE-03` `[reference]` `[browser]` —
  **Collapsible should refresh open measurements without taking ownership of
  application layout or motion styles.** Resize open Content from
  `100px × 40px` to `180px × 70px`, wait for its resize observation, and
  include consumer width, height, transform, transition, and
  `--product-density` declarations. Assert the two Reference UI variables
  update once to the new border-box pixels, no resize loop warning occurs, and
  every consumer declaration and unrelated custom property is byte-for-byte
  preserved; measurement is output, not styling authority.
- [x] `CO-SIZE-04` `[reference]` `[ssr]` —
  **Collapsible should defer layout measurements until after hydration.**
  Server-render `open=true` Content at a known client size, hydrate the exact
  markup, and inspect inline styles before hydration and after the first layout
  effect. Assert server and first hydration markup omit both measured
  variables, hydration emits no warning or structural mismatch, and the
  client subsequently adds finite matching `px` values without calling
  `onChange`; layout data must never make SSR nondeterministic.

### Nesting and environments

- [x] `CO-NEST-01` `[vendor]` `[browser]` —
  **Nested standalone Collapsibles should keep state, callbacks, and linkage
  independent.** Open an outer Collapsible containing a closed inner one,
  click the inner Trigger twice, and then click non-trigger content around it.
  Assert only the inner log receives `true` then `false`, the outer remains
  open, and each Trigger retains its own Content ID. This ports React Spectrum
  `Disclosure.test.js` / “should support nested Disclosures.”
- [x] `CO-NEST-02` `[reference]` `[browser]` —
  **A Collapsible inside Accordion should defer expansion authority to the
  Accordion root while preserving disclosure anatomy.** Render an Accordion
  item whose Collapsible supplies only `id`, Trigger, and Content, activate it,
  reject the first root request, then accept the second through Accordion
  `value`. Assert only Accordion `onChange` receives the item ID, no child
  request store exists, rejection leaves it closed, acceptance updates the
  same Trigger/Content ARIA, state, measurement, and Presence contract; this
  proves collection policy composes over one disclosure runtime.
- [x] `CO-ENV-01` `[reference]` `[ssr]` —
  **Collapsible should hydrate open and closed disclosure relationships without
  changing identity.** Server-render one `open=true` and one `open=false`
  fixture with generated IDs, capture their markup, and hydrate both before
  any interaction. Assert no hydration warning, the open Trigger still
  controls its same mounted Content, the closed Trigger has no dangling target,
  and later opening reuses a stable generated pair; SSR must not fork ID
  allocation.
- [x] `CO-ENV-02` `[reference]` `[react:all]` —
  **Collapsible should keep one registration and request across supported
  React versions and StrictMode replay.** In React 17, 18, and 19 fixtures,
  mount under each available StrictMode behavior, attach object and callback
  refs, and perform one primary click. Assert exactly one `onChange` request,
  one current Trigger/Content pair, stable node identity across a no-op
  rerender, and version-appropriate ref cleanup only on removal; effect replay
  must not duplicate behavior.

## Composition gates

- [x] `CO-COMP-01` `[reference]` `[browser]` —
  **A plain Collapsible should provide a complete controlled disclosure without
  requiring motion CSS.** Build a product-details disclosure with native
  Trigger and Content, no transition or animation, and a parent that accepts
  each request. Assert click, Space, and Enter update controlled ARIA/linkage,
  closed Content removes immediately, and form-adjacent Tab order stays native;
  this proves the minimum composition needs no escape hatch.
- [x] `CO-COMP-02` `[reference]` `[browser]` —
  **An animated Collapsible should survive a close that is interrupted by
  reopening.** Build a measured height-transition disclosure containing a
  focused link, close it, reopen before the 100 ms exit completes, and close it
  again. Assert focus evacuation and exit isolation occur only while logically
  closed, the same Content survives the interruption with current pixel
  variables, and the second exit alone removes it; this exercises Presence,
  focus, and measurement together.
- [x] `CO-COMP-03` `[reference]` `[browser]` —
  **Collapsible should remain the disclosure runtime when composed as a nested
  Accordion item.** Build an outer controlled Accordion item whose Content
  contains an independently controlled Collapsible, with animation on both
  panels and header traversal enabled only on the Accordion. Assert the root
  alone controls the item Collapsible, the nested standalone callback receives
  only its own toggles, all relationships stay unique, and each exit completes
  independently; this proves policy composition without duplicated state.

## Owned elsewhere

- Transition/animation detection matrix: `Presence`.
- Single/multiple expansion and header traversal: `Accordion`.

## Out of scope

- Uncontrolled-only `<details>`, `defaultOpen`, or a second disclosure runtime.
- A prescribed animation recipe or visual treatment; measured
  `--reference-collapsible-content-height` and `-width` are in-scope public
  geometry hooks.
- Focus management beyond evacuating logically closed Content.
