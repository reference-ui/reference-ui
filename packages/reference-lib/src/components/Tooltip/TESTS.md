# Tooltip test contract

Playwright: `matrix/lib/tests/e2e/tooltip.spec.ts`  
Page: `/tooltip`
Fixture root: `ReferenceLibrary`

Tooltip owns transient description policy: delayed pointer hover, immediate
keyboard focus, document-level warm/skip delay, controlled dismissal, and
non-interactive content. Popover owns positioning math.

## API freeze decisions

`Tooltip.Content` accepts arbitrary React children, so "non-interactive" cannot
be guaranteed by TypeScript. The runtime must not add a focus model; development
builds should diagnose focusable descendants. Interactive hover content uses
`Popover openOnHover`.

ReferenceLibrary owns configurable document-level `skipDelay`; an individual
Tooltip may override only open/close delay. Defaults are 700ms open, 300ms
close, 300ms skip, top placement, and 8px offset.

Tooltip exposes a transparent Portal configuration part. Default Content
targets document body or the Trigger's containing open ShadowRoot so IDREF
scope remains valid.

## Source evidence

- `vendor/radix-primitives/packages/react/tooltip/src/tooltip.test.tsx` —
  trigger/content rendering, existing `aria-describedby` token merge,
  generated/custom IDs, click dismissal, sibling rerender isolation, and
  skip-delay timing.
- `vendor/react-spectrum/packages/react-aria/test/tooltip/useTooltip.test.js`
  and `react-aria-components/test/Tooltip.test.js` — delayed hover,
  focus-open, hoverable description, scroll close, custom triggers, and portal
  roots.
- `vendor/base-ui/packages/react/src/tooltip/{root,provider}/*.test.tsx` —
  nested trigger suppression, current delay props, one-open group, touch/mouse
  modality, and instant adjacent tooltips.
- Zag Tooltip machine — opening/closing delay states and Escape/scroll policy.

## Part contract

`Tooltip.Trigger` is a Slot-like `ReferenceSlotPartProps` part and
`Tooltip.Content` is a fixed `ReferencePartProps<"div">` part. `Tooltip` and
`Tooltip.Portal` are transparent; all four run the applicable shared `PART-*`
type, DOM, StyleProps, ref, event, state, control, and default checks from
`TESTING.md`. Cases below add only Tooltip-specific anatomy and conflicts such
as owned `aria-describedby` token merging.

## Required cases

### DOM, role, IDs, and Slot

- [ ] `TT-DOM-01` `[reference]` `[browser]` —
  **Tooltip should render only its slotted Trigger and tooltip Content when its
  standard anatomy is valid.**
  Mount one Tooltip with a single authored native Trigger child and open
  Content. Assert Tooltip adds no root, Trigger adds no wrapper around the one
  native element, and Content is exactly one `div[role="tooltip"]`.
- [ ] `TT-DOM-02` `[vendor]` `[browser]` —
  **Tooltip should create and link a stable unique description ID when Content
  has no authored ID.**
  Open, rerender, close, and reopen an ID-less Content while recording Trigger
  and Content attributes. Assert one stable generated ID per Tooltip is
  appended to Trigger `aria-describedby` only while Content is rendered and is
  never shared with another instance.
- [ ] `TT-DOM-03` `[vendor]` `[browser]` —
  **Tooltip should preserve application descriptions when it adds its own ID
  to a Trigger with existing tokens.**
  Start with whitespace-varied and duplicate `aria-describedby` application
  tokens, including the eventual Tooltip ID, then open Content. Assert the
  result is normalized and deduplicated with application tokens in first-seen
  order followed by one Tooltip token, matching Radix `tooltip.test.tsx`
  (“normalizes and deduplicates aria-describedby ids when the tooltip opens”).
- [ ] `TT-DOM-04` `[vendor]` `[browser]` —
  **Tooltip should use the authored Content ID without duplicating content when
  that ID or accessible label changes.**
  Open Content with an explicit ID and children, rerender to a second ID and an
  `aria-label`, and count matching nodes and child mounts throughout. Assert
  the one `div[role="tooltip"]` owns the current ID, Trigger switches its token
  atomically, visible children mount once, and no hidden duplicate is created,
  preserving the Radix issue-3034 regression in Reference UI's one-node
  anatomy.
- [ ] `TT-DOM-05` `[reference]` `[browser]` —
  **Tooltip should remove only its own description token when Content closes
  or unmounts.**
  Give Trigger multiple authored description IDs, open generated or explicit
  Tooltip Content, and then close or directly unmount it. Assert the
  Tooltip-owned token disappears with Content while every application token,
  its order, and its referenced element remain unchanged.
- [ ] `TT-DOM-06` `[reference]` `[browser]` —
  **Tooltip should keep equal-labeled instances distinct when only one is
  opened.**
  Render two Triggers with the same accessible label and ID-less Contents,
  then open each separately and together under controlled test state. Assert
  generated IDs are unique and each Trigger's descriptor resolves only to its
  own mounted Content, never the equal-labeled sibling.
- [ ] `TT-DOM-07` `[vendor]` `[browser]` —
  **Tooltip should preserve application Slot behavior when its owned
  description and interaction handlers share one Trigger.**
  Slot onto a ref-capable button with an existing `aria-describedby` token and
  consumer pointer/focus handlers, then hover and keyboard-focus it while
  recording the native node. Assert consumer handlers run once before Tooltip
  requests, the Tooltip token appends without replacing the application token,
  and the same button ref remains attached; unrelated prop/ref permutations
  stay in the shared `PART-*` matrix.
- [ ] `TT-DOM-08` `[reference]` `[browser]` —
  **Tooltip should leave no Content or owned descriptor when a closed
  lifecycle has no documented active exit.**
  Initially mount `open={false}`, then open and close through the currently
  documented immediate lifecycle. Assert closed Content is absent, Trigger has
  no stale Tooltip ID in `aria-describedby`, and no portal, positioning, timer,
  or dismissal registration remains.
- [ ] `TT-DOM-09` `[reference]` `[browser]` —
  **Tooltip should expose lifecycle and resolved placement on Content when it
  is open.**
  Open near unconstrained space and then force a collision that changes side or
  alignment. Assert the same one Content `div` has
  `data-state="open"` plus current resolved side/alignment hooks and that no
  positioning or state wrapper is inserted.
- [ ] `TT-DOM-10` `[reference]` `[browser]` —
  **Tooltip should diagnose unsupported interactive anatomy when Content
  contains a focusable descendant.**
  In development, open Contents containing a link, button, input, and authored
  `tabIndex={0}` descendant and capture diagnostics. Assert a descriptive
  non-interactive-Content warning identifies the problem while Tooltip adds no
  trap, roving state, focus movement, or hidden guards; interactive hover
  remains Popover's responsibility.
- [ ] `TT-DOM-11` `[reference]` `[browser]` —
  **Tooltip should fail atomically when required parts are missing, duplicated,
  or Trigger cannot be slotted.**
  Mount fixtures with zero or two Triggers, zero or two Contents, fragments or
  multiple native Trigger children, and one valid control. Assert each invalid
  shape reports the exact anatomy error and creates no partial ID link, timer,
  portal, positioning observer, or group registration, while the valid shape
  wires once.
- [ ] `TT-DOM-12` `[reference]` `[browser]` —
  **Tooltip should apply frozen defaults when timing, positioning, and portal
  props are omitted.**
  Mount under a cold document group with all optional values omitted, hover and
  leave at measured boundaries, and inspect unconstrained placement and
  destination. Assert 700-millisecond open, 300-millisecond close,
  top placement, eight-pixel offset, and Trigger-root destination, with
  explicit zero values never replaced by defaults.
- [ ] `TT-DOM-13` `[reference]` `[browser]` —
  **Tooltip should keep its IDREF in scope when Portal uses explicit targets or
  Trigger lives in an open ShadowRoot.**
  Parameterize Portal over direct, ref, and function containers and then omit
  Portal for a Trigger inside an open ShadowRoot. Assert Content moves without
  a configuration host for explicit targets and defaults into the Trigger's
  containing root—body for ordinary DOM or that ShadowRoot—so
  `aria-describedby` resolves locally.

### Controlled hover open/close

- [ ] `TT-HOVER-01` `[vendor]` `[browser:all]` —
  **Tooltip should remain closed when mouse hover has not reached
  `openDelay`.**
  Enter a cold Trigger with a real mouse and sample callback log and DOM at zero
  and just before the configured delay in each engine. Assert `onOpen` has not
  run and no Content or Tooltip-owned `aria-describedby` token exists.
- [ ] `TT-HOVER-02` `[vendor]` `[browser:all]` —
  **Tooltip should request open once when mouse remains over Trigger through
  `openDelay`.**
  Keep the real pointer on a cold Trigger until the exact delay expires, then
  continue hovering and advance additional time. Assert one `onOpen()` request
  at the boundary and no repeats; Content appears only if the controlled parent
  accepts, matching React Aria `useTooltip.test.js` (“opens tooltip on hover
  after delay”).
- [ ] `TT-HOVER-03` `[vendor]` `[browser]` —
  **Tooltip should cancel pending open when mouse leaves Trigger before the
  delay.**
  Enter Trigger, leave one millisecond before `openDelay`, and advance beyond
  every pending timer without reentry. Assert `onOpen` remains uncalled,
  Content stays absent, and the canceled intent cannot fire later.
- [ ] `TT-HOVER-04` `[reference]` `[browser]` —
  **Tooltip should honor controlled rejection when the parent ignores a hover
  open request.**
  Hover through `openDelay`, record `onOpen`, keep `open={false}`, and leave the
  pointer over Trigger for several more delay intervals. Assert Content stays
  closed, no owned descriptor appears, and the same continuous intent does not
  spam additional requests.
- [ ] `TT-HOVER-05` `[vendor]` `[browser:all]` —
  **Tooltip should request one delayed dismissal when mouse leaves an accepted
  open Trigger.**
  Start with controlled `open={true}`, move the pointer from Trigger outside
  both Trigger and Content, and sample before and at `closeDelay`. Assert no
  early callback, then exactly one `onDismiss()` at the boundary with
  controlled Content unchanged until acceptance.
- [ ] `TT-HOVER-06` `[vendor]` `[browser]` —
  **Tooltip should stay open when mouse moves from Trigger into Content.**
  With controlled Content visible, leave Trigger and enter Content through the
  gap before close completes, then remain over Content. Assert pending
  dismissal is canceled and Content plus its descriptor stay present, matching
  React Aria `useTooltip.test.js` (“keeps tooltip open when it gets hovered”)
  and WCAG 1.4.13 hoverability.
- [ ] `TT-HOVER-07` `[vendor]` `[browser]` —
  **Tooltip should preserve one announcement when mouse returns from Content to
  Trigger before close delay.**
  Move Trigger → Content → Trigger while controlled Content remains open and
  advance beyond the original close deadline. Assert dismissal is canceled,
  no new `onOpen` fires, the Content node and ID stay stable, and assistive
  description is not reannounced, matching React Aria's “keeps tooltip open
  when hover returns to trigger from the tooltip.”
- [ ] `TT-HOVER-08` `[vendor]` `[browser]` —
  **Tooltip should cancel delayed close when mouse leaves both regions but
  returns before the deadline.**
  Move outside Trigger and Content, wait less than `closeDelay`, and reenter
  either region before advancing past the deadline. Assert the original timer
  produces no `onDismiss`, Content remains mounted, and no redundant open
  request occurs.
- [ ] `TT-HOVER-09` `[reference]` `[browser]` —
  **Tooltip should emit no inverse request when the application changes
  controlled open state programmatically.**
  Rerender an idle Tooltip from closed to open and back to closed without user
  hover, focus, press, scroll, or Escape. Assert Content and its descriptor
  follow the prop while `onOpen`, `onDismiss`, `onEscape`, and
  `onOutsidePress` remain silent.
- [ ] `TT-HOVER-10` `[reference]` `[browser]` —
  **Tooltip should let consumer pointer handlers cancel hover defaults when
  they prevent the initiating event.**
  Attach consumer pointer enter/move/leave handlers to the slotted Trigger,
  compare normal events with handlers that call `preventDefault()`, and advance
  timers. Assert consumer handlers run first once, prevention suppresses the
  corresponding Tooltip open/close default, and ordinary unprevented hover
  retains documented timing.
- [ ] `TT-HOVER-11` `[vendor]` `[browser]` —
  **Tooltip should use current delay policy when timing props change during a
  pending hover transition.**
  Start an open or close timer, rerender `openDelay` or `closeDelay` to a
  concrete new value and replace callbacks before completion, then advance
  time. Assert one timer follows the latest policy, invokes only current
  closure once, and leaves no duplicate old completion.

### Focus and input modality

- [ ] `TT-FOCUS-01` `[vendor]` `[browser:all]` —
  **Tooltip should request open immediately when keyboard Tab gives Trigger
  focus.**
  Begin from a preceding control, press Tab onto Trigger without pointer
  movement, and inspect callbacks before advancing any hover delay. Assert one
  immediate `onOpen()` request and, after controlled acceptance, linked Content,
  matching React Aria Components `Tooltip.test.js` (“shows on focus”).
- [ ] `TT-FOCUS-02` `[vendor]` `[browser]` —
  **Tooltip should request dismissal when Trigger blurs to an ordinary outside
  target without making Content interactive.**
  Keyboard-open Tooltip, move focus to a normal outside control, then
  deliberately focus an invalid focusable descendant inside Content in a
  diagnostic fixture. Assert ordinary blur requests close once, while entering
  Content does not create a supported focus region, trap, roving model, or
  contract that keeps interactive Tooltip open.
- [ ] `TT-FOCUS-03` `[convergence]` `[browser]` —
  **Tooltip should retain hover delay when pointer input causes Trigger focus.**
  Mouse- or pen-press a focusable Trigger from pointer modality and sample
  before `openDelay`. Assert focus alone does not produce the immediate
  keyboard-focus request, and any opening follows the one pointer-hover timer
  without duplicate focus and hover callbacks.
- [ ] `TT-FOCUS-04` `[vendor]` `[touch]` —
  **Tooltip should stay closed when touch produces pointer entry or synthetic
  hover.**
  Tap, drag across, and release on Trigger while recording native touch,
  pointer, and compatibility mouse events, then advance every delay. Assert no
  `onOpen`, Content, or owned descriptor appears from touch-derived hover.
- [ ] `TT-FOCUS-05` `[vendor]` `[touch]` —
  **Tooltip should recover mouse hover when real mouse input follows a touch
  interaction.**
  Complete a touch sequence that does not open Tooltip, then move a genuine
  mouse away and onto Trigger and wait `openDelay`. Assert pointer modality is
  no longer stuck on touch and one normal mouse `onOpen` request occurs.
- [ ] `TT-FOCUS-06` `[reference]` `[browser]` —
  **Tooltip should not open a disabled native Trigger when it becomes the
  current pointer target.**
  Keep one sibling Tooltip controlled open, move to a disabled native Trigger,
  attempt keyboard focus and mouse hover, and advance all timers. Assert the
  disabled Trigger cannot focus or request its own open, while group policy
  requests the previous active Tooltip close rather than leaving a stale
  description.
- [ ] `TT-FOCUS-07` `[vendor]` `[browser]` —
  **Tooltip should request closure once when its currently described Trigger
  becomes disabled.**
  Open Tooltip from an enabled native Trigger, rerender that same control as
  disabled, and first reject and then accept the close request in separate
  runs. Assert one `onDismiss`, no repeated request from ensuing pointer/focus
  cleanup, controlled Content and `aria-describedby` remain until acceptance,
  and acceptance removes the descriptor/content without moving focus back to
  the disabled Trigger. This ports Base UI `TooltipRoot.test.tsx` “should close
  if open when becoming disabled.”

### Dismissal and WCAG persistence

- [ ] `TT-CLOSE-01` `[vendor]` `[browser:all]` —
  **Tooltip should request one dismissal when Escape is pressed while it is
  open.**
  Open by keyboard focus and separately by hover, record active element and
  pointer position, then press Escape in each browser engine. Assert one
  dismissal request, no synthetic pointer movement or focus transfer, and
  controlled Content remains until the parent accepts.
- [ ] `TT-CLOSE-02` `[reference]` `[browser]` —
  **Tooltip should remain open when its granular Escape callback prevents
  dismissal.**
  Open controlled Content, have `onEscape` record the keyboard event and call
  `preventDefault()`, then press Escape. Assert `onEscape(event)` runs before
  any high-level action, `onDismiss` stays uncalled, event metadata remains
  available, and Content plus descriptor remain open.
- [ ] `TT-CLOSE-03` `[vendor]` `[browser]` —
  **Tooltip should dismiss and suppress hover reopening when its open Trigger
  is pressed or clicked.**
  Hover-open Tooltip, press/click Trigger while the pointer remains over it,
  accept the close, and advance beyond `openDelay` without leaving. Assert one
  dismissal request and no immediate `onOpen` or remounted Content until a real
  pointer leave and reentry, covering Radix `tooltip.test.tsx` (“renders tooltip
  content is dismissed when trigger is clicked”).
- [ ] `TT-CLOSE-04` `[reference]` `[browser]` —
  **Tooltip should follow granular cancellation when an outside pointer press
  occurs while open.**
  Press an ordinary outside control in normal and
  `onOutsidePress.preventDefault()` fixtures while logging callback order.
  Assert the normal path calls granular then `onDismiss` once, the prevented
  path skips high-level dismissal, and the Tooltip never blocks the outside
  control's native non-modal interaction.
- [ ] `TT-CLOSE-05` `[reference]` `[browser]` —
  **Tooltip should remain visible without a maximum timeout when hover or focus
  continues.**
  Keep an accepted Tooltip hovered and separately keyboard-focused for a
  duration far beyond every open, close, and skip delay. Assert no timer-driven
  `onDismiss` or remount occurs until an actual close condition such as leave,
  blur, Escape, press, outside press, or relevant scroll.
- [ ] `TT-CLOSE-06` `[reference]` `[browser]` —
  **Tooltip should preserve ordinary page interaction when one instance
  closes.**
  Open and close Tooltip while focus and scrollable controls surround Trigger,
  then continue Tab and page scrolling. Assert close causes no focus move,
  inert/`aria-hidden` mutation, pointer isolation, scroll lock, or change to
  natural sequential order beyond removing the descriptor.
- [ ] `TT-CLOSE-07` `[reference]` `[browser]` —
  **Tooltip should preserve native click without opening when a closed Trigger
  is pressed.**
  Click and keyboard-activate a closed slotted Trigger with consumer handlers
  while the pointer rests over it, then advance hover timers. Assert native
  consumer behavior runs, Tooltip makes no click-driven `onOpen` request, and
  press acts only as a dismissal/suppression modality until pointer leaves.

### Warm/skip-delay group

- [ ] `TT-GROUP-01` `[vendor]` `[browser]` —
  **Tooltip should request a neighbor immediately when pointer intent moves
  within the document's warm skip window.**
  Hover the first Trigger through its full cold delay, accept open and close,
  then enter a neighboring Trigger before 300 milliseconds expires. Assert the
  neighbor requests `onOpen` in the same interaction turn without its own
  delay, matching Radix `tooltip.test.tsx` (“skips the delay when moving
  between triggers within skipDelayDuration”).
- [ ] `TT-GROUP-02` `[vendor]` `[browser]` —
  **Tooltip should close the current instance before requesting its neighbor
  when a warm handoff occurs.**
  Keep Tooltip A controlled open and move intent to B during the instant phase
  while logging both parents' callbacks and rendered Contents. Assert A
  receives dismissal first, B remains pending until A's accepted close is
  observed, then B receives one open request so accepted state never displays
  two tooltips.
- [ ] `TT-GROUP-03` `[vendor]` `[browser]` —
  **Tooltip should return to cold delay when the document skip window has
  expired.**
  Close a shown Tooltip, wait beyond the configured skip duration, then enter a
  neighboring Trigger and sample before its `openDelay`. Assert no immediate
  request occurs and exactly one `onOpen` arrives only after the full cold
  delay.
- [ ] `TT-GROUP-04` `[vendor]` `[browser]` —
  **Tooltip should never enter an instant phase when document `skipDelay` is
  configured to zero.**
  Show and close Tooltip A, enter B immediately, and advance just before and to
  B's full open delay. Assert B stays closed before the boundary and requests
  once at it, matching Radix `tooltip.test.tsx` (“does not skip the delay when
  skipDelayDuration is 0”).
- [ ] `TT-GROUP-05` `[reference]` `[browser]` —
  **Tooltip should apply Trigger-level `openDelay` only when the group is
  outside an active instant phase.**
  Give neighboring Triggers distinct concrete delays, enter each from a cold
  group, then repeat the second handoff within the warm window. Assert cold
  openings honor each local override, while warm opening is immediate and is
  not delayed by the Trigger-level value.
- [ ] `TT-GROUP-06` `[vendor]` `[browser]` —
  **Tooltip should leave unrelated siblings untouched when hover has not begun
  a group handoff.**
  Profile several sibling Tooltip roots, hover only A through open, and record
  renders and callbacks for B and C. Assert A may update, but B and C neither
  rerender nor receive callbacks until intent actually transfers, matching
  Radix `tooltip.test.tsx` (“hovering one tooltip does not re-render sibling
  tooltips”).
- [ ] `TT-GROUP-07` `[vendor]` `[browser]` —
  **Tooltip should suppress ancestor hover intent when pointer is over a nested
  Tooltip Trigger.**
  Nest one Trigger inside the authored area of another, enter the child and
  advance both delays, then move to a parent-only region. Assert only the child
  may request open while nested, and entering non-nested parent area starts the
  parent's own delay rather than inheriting the child's elapsed time.
- [ ] `TT-GROUP-08` `[reference]` `[shadow]` —
  **Tooltip should preserve nested suppression and one-open policy when event
  paths cross an open ShadowRoot.**
  Put nested Triggers across light and open-shadow boundaries, move pointer
  intent between child, parent-only area, and a sibling, and accept handoffs.
  Assert classification uses composed paths, ancestor open is suppressed over
  the child, and at most one controlled Content is visible.
- [ ] `TT-GROUP-09` `[reference]` `[browser]` —
  **Tooltip should preserve group invariants when the active ReferenceLibrary
  host fails over across React roots or Documents differ.**
  Mount Tooltip roots under two same-document hosts, warm the group, unmount
  the active host, and hand off; then repeat in a same-origin iframe. Assert
  same-document failover retains one-open and current warm timing without
  duplicate callbacks, while each Document keeps independent warm state.
- [ ] `TT-GROUP-10` `[reference]` `[browser]` —
  **Tooltip should keep a neighbor pending when the current parent rejects a
  handoff dismissal.**
  Keep A controlled open after its dismissal request, maintain intent on B,
  then either accept A later or end B's pointer/focus intent. Assert B stays
  closed without a fake group-state transition or two visible Contents,
  requests open only after accepted A close while intent remains, and cancels
  permanently when that intent ends.

### Scroll and positioning integration

- [ ] `TT-SCROLL-01` `[vendor]` `[browser]` —
  **Tooltip should request close once when an ancestor scroll moves its
  Trigger.**
  Open Tooltip inside a scrollable ancestor, change that ancestor's real scroll
  offset several times, and keep controlled state open after the first request.
  Assert one `onDismiss` for the scroll intent and no repeated request spam,
  covering React Aria Components `Tooltip.test.js` (“should hide tooltip on
  scroll”).
- [ ] `TT-SCROLL-02` `[vendor]` `[browser]` —
  **Tooltip should remain open when an unrelated adjacent container scrolls.**
  Open beside two independent scroll regions, scroll the one that is neither an
  ancestor of Trigger nor part of its path, and inspect callbacks and Content.
  Assert no dismissal request, descriptor change, or unnecessary remount
  occurs.
- [ ] `TT-SCROLL-03` `[vendor]` `[browser]` —
  **Tooltip should remain open when scrolling occurs inside an input or
  textarea Trigger itself.**
  Slot Trigger onto overflowing input and textarea controls, open Tooltip, and
  scroll their internal text/caret content without moving the elements'
  bounding rects. Assert no `onDismiss` and no descriptor change, distinguishing
  internal editing scroll from ancestor movement.
- [ ] `TT-SCROLL-04` `[reference]` `[shadow]` —
  **Tooltip should detect relevant ancestor scrolling when Trigger is reached
  through open ShadowRoots.**
  Place Trigger under nested open-shadow scrolling ancestors and an unrelated
  shadow sibling, then scroll each while open. Assert composed ancestors
  request close once and unrelated shadow scroll stays silent despite event
  retargeting.
- [ ] `TT-POS-01` `[reference]` `[browser:all]` —
  **Tooltip should reuse Popover collision math when preferred top placement
  cannot fit.**
  Open a top-placement Tooltip near viewport edges in Chromium, Firefox, and
  WebKit so flip and shift are required. Assert Content remains within the
  clipping rect, preserves the eight-pixel offset, and updates resolved
  side/alignment hooks to its actual placement; the full matrix remains owned
  by Popover.
- [ ] `TT-POS-02` `[reference]` `[browser]` —
  **Tooltip should request close when clipping fully hides its Trigger.**
  Open Content, clip or scroll the entire Trigger out of the relevant
  intersection without first firing a covered ancestor-scroll close, and
  observe controlled callbacks. Assert one dismissal request rather than an
  orphaned visible description, while rejected controlled state does not cause
  callback repetition.

### Environments

- [ ] `TT-ENV-01` `[reference]` `[ssr]` —
  **Tooltip should server-render a closed Trigger safely when timers and DOM
  globals are unavailable.**
  Render closed anatomy on the server, hydrate the same tree, then keyboard-
  and hover-open after mount. Assert no server timer/document access or
  hydration warning, stable Trigger identity, and one correctly linked Content
  ID only after controlled acceptance.
- [ ] `TT-ENV-02` `[reference]` `[react:all]` —
  **Tooltip should create one current effect when React version or StrictMode
  replays lifecycle work.**
  Run delayed hover, keyboard open, controlled close, and ID cleanup under
  React 17, 18, and 19 with applicable StrictMode replay. Assert one timer, one
  callback request, one Content node, and one owned descriptor token per
  action, followed by one cleanup.
- [ ] `TT-ENV-03` `[reference]` `[browser:all]` —
  **Tooltip should preserve timing and dismissal policy when the browser engine
  changes.**
  Run cold and warm hover boundaries, immediate focus-open, Escape, controlled
  group handoff, and relevant ancestor-scroll close in Chromium, Firefox, and
  WebKit. Assert equivalent callback counts/order, timer boundaries, DOM/ID
  state, focus preservation, and close outcomes.
- [ ] `TT-A11Y-01` `[reference]` `[browser]` —
  **Tooltip should expose valid non-interactive descriptions when IDs, keyboard
  focus, and hoverable Content vary.**
  Run accessibility checks for generated and explicit Content IDs,
  keyboard-focused Trigger, and static Content hovered under pointer. Assert
  each rendered `role="tooltip"` is named by its children or authored label,
  each Trigger resolves the correct description once, and no interactive-role,
  duplicate-ID, or stale-reference violation appears.

## Composition gates

- [ ] `TT-COMP-01` `[reference]` `[browser]` —
  **Tooltip should provide a delayed description when mouse hovers an icon-only
  button.**
  Build an icon button with a stable accessible name and ID-less Tooltip
  Content, enter with mouse, sample before and after 700 milliseconds, hover
  Content, and leave both. Assert delayed open and 300-millisecond close each
  request once, the generated descriptor resolves during display, native button
  behavior remains, and Content contains no interaction.
- [ ] `TT-COMP-02` `[reference]` `[browser]` —
  **Tooltip should append its description when keyboard focuses a Trigger that
  already has application descriptions.**
  Give a Trigger normalized and duplicate-prone existing
  `aria-describedby` tokens, Tab to it, then blur or press Escape and accept
  close. Assert Tooltip opens immediately, appends one owned token after
  preserved application tokens, exposes one matching `role="tooltip"`, and
  removes only its token on close without moving focus.
- [ ] `TT-COMP-03` `[reference]` `[shadow]` —
  **Tooltip should maintain one-open warm-group behavior when neighboring and
  nested Triggers span ordinary and Shadow DOM.**
  Show a cold Tooltip, hand off within the skip window to a neighbor across an
  open ShadowRoot, then enter a nested child and parent-only region. Assert
  composed-path suppression prevents ancestor opening over the child, accepted
  handoffs display at most one Content, warm timing survives same-document root
  boundaries, and all IDs resolve in their Trigger roots.

## Owned elsewhere

- Full flip/shift/offset/arrow/auto-update and composed overflow-ancestor
  detection matrix: `Popover`; `TT-SCROLL-*` prove only Tooltip's always-on
  close policy over that shared engine.
- Safe-polygon interactive HoverCard: `Popover openOnHover`.
- Runtime mount and group failover: `ReferenceLibrary`.

## Out of scope

- Interactive links/buttons/forms in Content, focus containment, cursor
  tracking, public Tooltip Provider, detached trigger registries, or viewport
  morphing.
