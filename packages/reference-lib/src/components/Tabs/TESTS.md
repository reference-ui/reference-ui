# Tabs test contract

Playwright: `matrix/lib/tests/e2e/tabs.spec.ts`  
Page: `/tabs`

Tabs owns controlled selection, automatic/manual activation, and tab/panel ARIA
linkage. RovingFocus owns the movement kernel and typeahead remains off.

## Freeze defaults

Omitted `orientation` is horizontal and omitted `activation` is automatic,
matching APG/vendor convergence.

## Source evidence

- `vendor/react-spectrum/packages/react-aria-components/test/Tabs.test.js` —
  ARIA/DOM props, disabled selection, orientation/RTL, manual activation,
  dynamic and nested tabs, panel ID updates, and composed popups.
- `vendor/radix-primitives/packages/react/tabs/src/tabs.test.tsx` — focus/blur
  ordering and regressions where Space/Enter from nested or portalled editable
  descendants incorrectly activate a tab.
- React Aria `useTab.ts`, Radix `activationMode`, and Zag `activationMode`
  converge on automatic vs manual behavior.

Universal `PART-TYPE-01` and `PART-STYLE-01` cover each rendered
`ReferencePartProps` native/StyleProps intersection, including omission of
colliding Tabs behavior keys before their controlled types are declared. The
cases below therefore test only Tabs-specific behavior/style coexistence and
do not repeat the generic StyleProps matrix.

## Required cases

### DOM, state, and linkage

- [ ] `TB-DOM-01` `[reference]` `[browser]` —
  **Tabs should render only its documented parts when a complete instance mounts.**
  Render values `general` and `billing`, then assert that `Tabs` contributes no
  host while List is `div[role="tablist"]`, each Tab is
  `button[role="tab"]`, and each Panel is `div[role="tabpanel"]`.
  Assert that no wrapper or hidden helper is present so transparent-root and
  fixed-anatomy consumers can rely on the exact DOM.
- [ ] `TB-DOM-02` `[vendor]` `[browser]` —
  **Tabs should expose the controlled orientation when orientation changes.**
  Start horizontal, rerender with `orientation="vertical"`, and assert that the
  same List changes both `aria-orientation` and `data-orientation` from
  `horizontal` to `vertical` without changing selection.
  This ports `vendor/react-spectrum/packages/react-aria-components/test/Tabs.test.js`
  “should support orientation” while keeping state on Reference UI's List.
- [ ] `TB-DOM-03` `[vendor]` `[browser]` —
  **Tabs should distinguish controlled selection from the current roving tab stop when values render.**
  Render `value="general"` with three enabled Tabs and assert `general` has
  `aria-selected="true"`, `data-state="active"`, and initially `tabIndex=0`,
  while the others are false/inactive and exactly one enabled current Tab is
  the sole `tabIndex=0`.
  This ports `vendor/react-spectrum/packages/react-aria-components/test/Tabs.test.js`
  “should support selected state” and prevents selection state from being
  inferred from focus after manual navigation.
- [ ] `TB-DOM-04` `[convergence]` `[browser]` —
  **Tabs should link only the selected Tab to a Panel when selection changes.**
  With `general` selected, assert only that Tab has `aria-controls` equal to the
  `general` Panel ID; accept `onChange("billing")`, rerender, and assert the
  attribute moves atomically to `billing` while `general` omits it.
  This freezes React Aria `useTab.ts` selected-only linkage rather than Radix's
  every-trigger linkage so hidden panels are not advertised as controlled.
- [ ] `TB-DOM-05` `[vendor]` `[browser]` —
  **Tabs should keep every Panel stably linked when the selected value changes.**
  Render Panels for `general`, `billing`, and `security`, record their IDs, then
  change `value` from `general` to `billing` and assert every ID is unchanged,
  every `aria-labelledby` names its matching Tab, only `billing` is visible,
  and the other mounted Panels have `hidden`.
  This ports `vendor/react-spectrum/packages/react-aria-components/test/Tabs.test.js`
  “should update TabPanel ID when current tab is changed” while freezing
  Reference UI's mounted-inactive-panel policy.
- [ ] `TB-DOM-06` `[reference]` `[browser]` —
  **Tabs should honor explicit IDs when either side of a relationship is renamed.**
  Render `Tab id="tab-general"` and `Panel id="panel-general"`, then rerender
  each ID as `tab-profile` and `panel-profile`; after each render assert the
  explicit ID wins and `aria-controls`/`aria-labelledby` update together with
  no frame containing an old or dangling reference.
  Atomic linkage matters because independently patched IDs can briefly expose
  an invalid accessibility tree.
- [ ] `TB-DOM-07` `[reference]` `[browser]` —
  **Tabs should generate unique stable IDs when separate instances reuse values and labels.**
  Mount two instances that both contain `general` and `billing`, record every
  generated Tab and Panel ID, rerender both, and assert all IDs remain stable,
  are unique across instances, and each ARIA reference resolves inside its own
  instance.
  This guards the multi-root identity boundary rather than treating a value or
  visible label as a document-global key.
- [ ] `TB-DOM-08` `[vendor]` `[browser]` —
  **Tabs should keep a disabled Tab inert when selection and focus are requested.**
  Render `general`, disabled `billing`, and `security`; assert `billing` has
  native `disabled` and `data-disabled`, then click it and move with ArrowRight
  from `general` to prove it is skipped and emits no request, while a later
  controlled `value="billing"` may mark it selected and show its Panel without
  making it focusable.
  This ports `vendor/react-spectrum/packages/react-aria-components/test/Tabs.test.js`
  “should support isDisabled prop on tab” and “finds the first non-disabled
  tab,” adapted to the documented native button.
- [ ] `TB-DOM-09` `[reference]` `[browser]` —
  **Tabs should preserve native customization when consumers configure every fixed part.**
  Pass a `data-owner`, ARIA attribute, class, inline color, click handler, and
  object/callback ref to List, Tab, and Panel; assert each reaches its documented
  native element, each handler sees that element as `currentTarget`, and refs
  receive and clean up that same node.
  Assert no `as` host is required and internal state attributes remain
  authoritative while unrelated classes and styles survive.
- [ ] `TB-DOM-10` `[reference]` `[browser]` —
  **Tabs should reject duplicate value identities when Tabs or Panels collide.**
  Attempt separate fixtures with two `Tab value="general"` parts and two
  `Panel value="general"` parts, and assert each throws a descriptive duplicate
  identity error before interaction listeners or ambiguous ARIA links remain.
  Value identity must be singular because labels and React keys are not the
  public Tab-to-Panel mapping.
- [ ] `TB-DOM-11` `[reference]` `[browser]` —
  **Tabs should expose no interactive tab stop when every Tab is disabled.**
  Render three disabled Tabs with controlled `value="billing"` and assert none
  has `tabIndex=0`, Tab skips the list, pointer/keyboard actions emit no
  `onChange`, and the `billing` Panel may remain visible with its Tab still
  natively disabled.
  This deliberately rejects the upstream
  `vendor/react-spectrum/packages/react-aria-components/test/Tabs.test.js`
  “selects first tab if all tabs are disabled” focus fallback because a
  disabled button cannot be made interactive.
- [ ] `TB-DOM-12` `[reference]` `[browser]` —
  **Tabs should use horizontal automatic activation when behavior props are omitted.**
  Omit `orientation` and `activation` with `value="general"`, focus `general`,
  and press ArrowRight; assert focus and the sole roving `tabIndex=0` move to
  `billing` and exactly one `onChange("billing")` request is logged.
  Concrete omitted-value coverage prevents `undefined` from drifting into a
  manual or vertical truthiness fallback.
- [ ] `TB-DOM-13` `[reference]` `[browser]` —
  **Tabs should diagnose incomplete anatomy when structural parts do not pair by value.**
  Render separate fixtures with no List, two Lists, a missing Tab, a missing
  Panel, and an orphan `security` part; assert each reports the exact
  structural/value mismatch and leaves no `aria-controls` or
  `aria-labelledby` that resolves to a missing element.
  Requiring one List and one Tab/Panel pair per value prevents partially usable
  trees from silently reaching assistive technology.
- [ ] `TB-DOM-14` `[reference]` `[browser]` —
  **Tabs should avoid native form submission when Tab type is omitted.**
  Put automatic Tabs in a form with a submit spy, click `billing`, and activate
  it with Space and Enter; assert every Tab is `button[type="button"]`,
  selection requests still occur as applicable, and the submit spy remains at
  zero, then explicitly set `type="submit"` and assert native submission is
  possible.
  This freezes the safe button default without blocking an application's
  deliberate native-button override.

### Controlled pointer selection

- [ ] `TB-SELECT-01` `[vendor]` `[browser:all]` —
  **Tabs should request an enabled unselected value when a primary pointer activates its Tab.**
  With `value="general"`, press and release the primary pointer on `billing`;
  assert exactly one ordered `onChange("billing")` request, no request for any
  other value, and focus remaining on the `billing` button in Chromium,
  Firefox, and WebKit.
  This ports the mouse row of
  `vendor/react-spectrum/packages/react-aria-components/test/Tabs.test.js`
  “should support changing the selected tab regardless of interaction type.”
- [ ] `TB-SELECT-02` `[reference]` `[browser]` —
  **Tabs should retain controlled selection when the parent rejects a pointer request.**
  Render `value="general"` with an `onChange` logger that does not rerender,
  click `billing`, and assert one `onChange("billing")` while `general` remains
  selected, its Panel remains visible, and `billing` may hold focus/current
  roving `tabIndex` without becoming selected.
  This distinguishes a request from a mutation and prevents optimistic UI from
  overriding the controlled prop.
- [ ] `TB-SELECT-03` `[vendor]` `[browser]` —
  **Tabs should follow a programmatic controlled value when focus is outside the widget.**
  Focus an external button, rerender `value` from `general` to `security`, and
  assert focus stays external while selected ARIA/data state, preferred
  `tabIndex=0`, `aria-controls`, and visible Panel all move to `security`
  without `onChange`.
  This is the controlled counterpart to
  `vendor/react-spectrum/packages/react-aria-components/test/Tabs.test.js`
  “should update TabPanel ID when current tab is changed.”
- [ ] `TB-SELECT-04` `[vendor]` `[browser]` —
  **Tabs should suppress redundant requests when a pointer targets selected or disabled Tabs.**
  With `general` selected and `billing` disabled, click `general` twice and
  `billing` once; assert `onChange` stays empty, selection/visible Panel remain
  `general`, and disabled `billing` never receives focus.
  This preserves the no-op behavior covered by React Aria's disabled and
  selected-state tests instead of reporting unchanged controlled values.
- [ ] `TB-SELECT-05` `[convergence]` `[browser]` —
  **Tabs should allow a consumer click handler to cancel pointer selection when it prevents default.**
  Give `billing` an `onClick` that logs `consumer` and calls
  `preventDefault()`, then click it and assert the log contains only
  `consumer`, no `onChange` fires, and selected ARIA/Panel state remains
  `general`.
  Consumer-first ordering makes cancellation observable without replacing
  native propagation or the Tab's fixed host.
- [ ] `TB-SELECT-06` `[vendor]` `[browser]` —
  **Tabs should blur content focus when pointer selection settles on another Tab.**
  Focus an input inside the visible `general` Panel, click `billing`, and log
  input `blur`, Tab `focus`, and `onChange`; assert blur occurs once before the
  new Tab focus/request and the accepted rerender shows `billing`.
  This ports `vendor/radix-primitives/packages/react/tabs/src/tabs.test.tsx`
  “fires onBlur on an input inside the active tab when clicking another
  trigger.”
- [ ] `TB-SELECT-07` `[reference]` `[browser]` —
  **Tabs should rescue focus when a programmatic selection hides its current Panel.**
  Focus an input in the selected `general` Panel, rerender with
  `value="billing"`, and assert focus moves to the enabled `billing` Tab—or the
  documented nearest enabled roving fallback if it is disabled—rather than
  remaining under `hidden` or falling to `body`, with no `onChange`.
  Programmatic control has no pointer focus transfer, so Tabs must prevent a
  focused node from becoming hidden.
- [ ] `TB-SELECT-08` `[vendor]` `[browser]` —
  **Tabs should settle pointer selection when primary press occurs before the click completes.**
  In manual mode with `value="general"`, dispatch primary `pointerdown` and
  `mousedown` on `billing` without `pointerup`; assert one
  `onChange("billing")` is already requested, then finish the click and assert
  no second request.
  This ports `vendor/radix-primitives/packages/react/tabs/src/tabs.test.tsx`
  “still activates a tab on mousedown (before the click completes)” and freezes
  the event boundary needed for deterministic blur ordering.

### Automatic activation

- [ ] `TB-AUTO-01` `[vendor]` `[browser:all]` —
  **Tabs should move and request selection when horizontal LTR arrows run in automatic mode.**
  Focus selected `billing` in `general,billing,security`, press ArrowRight and
  then ArrowLeft, and after each accepted rerender assert focus, sole
  `tabIndex=0`, selected ARIA, and visible Panel move to `security` then
  `billing`, with one matching request per key in all engines.
  This instantiates the horizontal automatic behavior exercised by the React
  Aria Tabs interaction matrix.
- [ ] `TB-AUTO-02` `[vendor]` `[rtl]` —
  **Tabs should reverse horizontal arrow movement when inherited direction is RTL.**
  Under `dir="rtl"`, focus selected `billing`, press ArrowRight then ArrowLeft,
  and assert requests/focus move to `general` then `billing` while panel
  linkage follows each accepted value.
  This applies the shared RovingFocus/Radix horizontal RTL map; React Spectrum's
  separately titled vertical-RTL regression belongs to `TB-AUTO-03`.
- [ ] `TB-AUTO-03` `[vendor]` `[browser:all]` —
  **Tabs should use only vertical arrows when orientation is vertical.**
  Focus selected `billing`, press ArrowDown and ArrowUp to request/focus
  `security` then `billing`, then press ArrowLeft and ArrowRight in both LTR and
  RTL and assert no focus, `tabIndex`, selection, Panel, or callback change.
  This ports the vertical orientation coverage in
  `vendor/react-spectrum/packages/react-aria-components/test/Tabs.test.js`
  while explicitly rejecting its legacy horizontal-key behavior for vertical
  RTL tabs.
- [ ] `TB-AUTO-04` `[vendor]` `[browser]` —
  **Tabs should wrap and skip disabled values when automatic navigation reaches an edge.**
  Render enabled `general`, disabled `billing`, and enabled `security`; from
  `general` press ArrowRight, ArrowRight, Home, and End, asserting focus and
  requests visit `security`, wrap to `general`, remain/go to `general`, and end
  at `security` with exactly one callback for each actual value change.
  This combines React Aria's “should support isDisabled prop on tab” and “finds
  the first non-disabled tab” with RovingFocus's owned wrap/Home/End kernel.
- [ ] `TB-AUTO-05` `[reference]` `[browser]` —
  **Tabs should preserve controlled selection when automatic navigation requests are rejected.**
  Keep controlled `value="general"`, focus it, and press ArrowRight twice;
  assert at most one `onChange` per movement, selected ARIA and visible Panel
  remain `general`, while each newly focused enabled Tab becomes the sole
  current `tabIndex=0`.
  This proves rejected automatic activation does not snap focus backward or
  leak extra requests from roving-state reconciliation.
- [ ] `TB-AUTO-06` `[reference]` `[rtl]` —
  **Tabs should use the latest inherited direction when direction changes at runtime.**
  Focus `billing` in a horizontal automatic list under `dir="ltr"`, rerender
  the same ancestor as `dir="rtl"`, and press ArrowRight; assert focus and one
  request move to `general` under the new map while values, IDs, and
  registrations remain stable.
  Dynamic direction is required because caching the initial computed direction
  leaves a mounted RovingFocus collection with stale keyboard behavior.

### Manual activation

- [ ] `TB-MANUAL-01` `[vendor]` `[browser:all]` —
  **Tabs should move only focus when navigation keys run in manual mode.**
  With `activation="manual"` and `value="general"`, use ArrowRight, End, Home,
  and ArrowLeft; assert focus and the sole roving `tabIndex=0` follow each
  enabled destination while `onChange` remains empty, `general` stays
  `aria-selected="true"`, and its Panel remains visible.
  This ports `vendor/react-spectrum/packages/react-aria-components/test/Tabs.test.js`
  “should support keyboardActivation=manual.”
- [ ] `TB-MANUAL-02` `[vendor]` `[browser:all]` —
  **Tabs should request the focused value when Space activates an unselected manual Tab.**
  Move focus from selected `general` to `billing`, press and hold Space to
  assert no request before release, then release and assert exactly one
  `onChange("billing")`, focus on `billing`, and accepted selection/Panel state
  in all engines.
  This follows native button Space timing and the manual-activation path in
  `vendor/react-spectrum/packages/react-aria-components/test/Tabs.test.js`
  “should support press events on items when using keyboard.”
- [ ] `TB-MANUAL-03` `[vendor]` `[browser:all]` —
  **Tabs should request the focused value when Enter activates an unselected manual Tab.**
  Move focus from selected `general` to `billing`, press Enter, and assert one
  `onChange("billing")` on keydown/click, no duplicate on keyup, focus remaining
  on `billing`, and accepted selected/Panel state in all engines.
  This ports the trigger-focused half of
  `vendor/radix-primitives/packages/react/tabs/src/tabs.test.tsx` “still
  activates the tab via Space/Enter when the trigger itself is focused.”
- [ ] `TB-MANUAL-04` `[reference]` `[browser]` —
  **Tabs should emit no redundant request when manual activation targets the selected Tab.**
  Focus the already selected `general` Tab and activate it once with Space and
  once with Enter; assert no `onChange`, no Panel visibility change, and focus
  and the sole `tabIndex=0` remain on `general`.
  Suppressing no-op requests keeps controlled parents from receiving false
  selection transitions.
- [ ] `TB-MANUAL-05` `[reference]` `[browser]` —
  **Tabs should cancel manual movement or activation when consumer keydown prevents default.**
  On separate runs, prevent default on `billing` for ArrowRight, Space, and
  Enter; assert the consumer handler logs first and the corresponding focus
  movement or `onChange` never occurs, with selected ARIA and visible Panel
  unchanged.
  This freezes consumer-first event composition for both the RovingFocus
  movement default and Tabs' activation default.
- [ ] `TB-MANUAL-06` `[vendor]` `[rtl]` —
  **Manual vertical Tabs should keep Up and Down navigation independent from
  RTL while requiring explicit activation.**
  Render vertical manual Tabs under LTR and RTL, focus selected `billing`, use
  Down/Up and Home/End to move among enabled values, then press Space or Enter
  on an unselected Tab. Assert direction does not change vertical
  destinations, horizontal arrows remain unhandled, movement alone leaves the
  controlled Panel selected, and explicit activation requests the focused
  value once. This completes the React Spectrum vertical-RTL and manual
  activation matrix rather than assuming automatic coverage transfers.

### Event scope and dynamic collections

- [ ] `TB-EVENT-01` `[vendor]` `[browser]` —
  **Tabs should ignore activation keys when they originate in an editable descendant of a Tab.**
  In manual mode, focus an input nested beneath the unselected `billing` Tab,
  type a Space and Enter into it, and assert its text/native editing behavior
  remains intact while `onChange`, selected ARIA, and visible Panel do not
  change.
  This ports `vendor/radix-primitives/packages/react/tabs/src/tabs.test.tsx`
  “does not activate a tab from Space typed into a nested editable input” and
  protects the event-target guard rather than stopping bubbling globally.
- [ ] `TB-EVENT-02` `[vendor]` `[browser]` —
  **Tabs should ignore activation keys when they come from a portalled focusable logical descendant of a Tab.**
  Render an input as a React portal child of the `billing` Tab, focus the
  portalled input, and press Space then Enter; assert its value/focus remain
  intact and no `onChange`, selected-state, or Panel change occurs.
  This ports `vendor/radix-primitives/packages/react/tabs/src/tabs.test.tsx`
  “does not activate a tab from Space/Enter typed into a portaled focusable
  descendant.”
- [ ] `TB-EVENT-03` `[reference]` `[browser]` —
  **Tabs should leave focus and selection unchanged when printable typeahead characters are pressed.**
  Focus selected `general`, press `b`, `s`, and a quick `se` sequence, and
  assert no focus/`tabIndex` movement, no `onChange`, and no selected or visible
  Panel change.
  Tabs deliberately leaves RovingFocus typeahead off, so labels must not become
  an undocumented selection mechanism.
- [ ] `TB-DYNAMIC-01` `[vendor]` `[browser]` —
  **Tabs should preserve value identity when surviving Tabs are inserted or reordered.**
  Start with selected `billing`, insert `profile` before it and then reorder
  `billing` after `security`; assert `billing` stays selected and linked to the
  same keyed Panel, generated IDs for surviving parts stay stable, focus stays
  on the same value when present, and no `onChange` fires.
  This ports `vendor/react-spectrum/packages/react-aria-components/test/Tabs.test.js`
  “can add tabs and keep the current selected key.”
- [ ] `TB-DYNAMIC-02` `[reference]` `[browser]` —
  **Tabs should avoid fallback selection when the controlled selected value is removed.**
  Remove both `billing` parts while controlled `value` remains `billing` and
  assert no other Tab becomes selected, no Panel is shown as its replacement,
  no `onChange` fires, and a development diagnostic names the unmatched value
  without leaving dangling ARIA.
  Silent fallback would violate controlled authority and disguise an
  application collection bug.
- [ ] `TB-DYNAMIC-03` `[reference]` `[browser]` —
  **Tabs should choose the nearest enabled roving target when the focused manual Tab disappears or disables.**
  In manual mode with `general` selected and focus on unselected `billing`,
  first disable and then remove `billing`; assert focus/current `tabIndex`
  moves deterministically to nearest enabled `security` (or the preceding
  enabled value on a tie), while selection and visible `general` Panel remain
  unchanged and no request fires.
  This prevents stale registrations from leaving focus on a disabled or
  detached node.
- [ ] `TB-NEST-01` `[vendor]` `[browser]` —
  **Tabs should isolate keyboard movement when one Tabs instance is nested in another Panel.**
  Focus `inner-two` inside the outer `general` Panel and press ArrowLeft and
  ArrowRight; assert only inner focus/value/callback/Panel state changes while
  outer selected `general`, outer focus bookkeeping, and outer callback log
  remain unchanged.
  This ports `vendor/react-spectrum/packages/react-aria-components/test/Tabs.test.js`
  “supports nested tabs.”
- [ ] `TB-NEST-02` `[vendor]` `[browser]` —
  **Tabs should preserve selection when popup triggers inside a Panel are operated.**
  In the selected `general` Panel, open and close Menu, Select/Combobox,
  Tooltip, and Overlay triggers with pointer and keyboard; assert each popup's
  documented focus/DOM state works while Tabs focus bookkeeping, selected
  value, visible Panel, and `onChange` log remain unchanged.
  This consolidates the upstream titles “supports Menu inside Tabs,” “supports
  Select inside Tabs,” “supports ComboBox inside Tabs,” “supports tooltips,”
  and “supports DialogTrigger inside Tabs” from
  `vendor/react-spectrum/packages/react-aria-components/test/Tabs.test.js`.

### Environments

- [ ] `TB-ENV-01` `[reference]` `[ssr]` —
  **Tabs should hydrate without correction when controlled state is server rendered.**
  Server-render `value="billing"` with generated IDs, hydrate the same tree,
  and assert byte-equivalent Tab/Panel IDs and ARIA references, `billing`
  selected, inactive Panels still hidden, no hydration warning, and no
  `onChange`.
  Stable first-frame linkage prevents accessibility references from changing
  merely because client ID generation starts.
- [ ] `TB-ENV-02` `[reference]` `[react:all]` —
  **Tabs should register once and request once per action when run across supported React versions.**
  Under StrictMode in React 17, 18, and 19, mount/reorder the same keyed
  three-value fixture, click `billing`, and press ArrowRight; assert stable
  generated IDs/refs and one matching `onChange` for each action with no stale
  duplicate registration.
  This catches effect replay and ref-cleanup differences without weakening the
  controlled contract.
- [ ] `TB-ENV-03` `[reference]` `[shadow]` —
  **Tabs should keep focus and linkage local when rendered in a ShadowRoot.**
  Mount manual Tabs in an open ShadowRoot, move from `general` to `billing` and
  activate it, then assert `shadowRoot.activeElement` is the Tab, all
  `aria-controls`/`aria-labelledby` targets resolve in that root, and exactly
  one request is logged.
  Shadow focus retargeting must not make document-level lookup or event scope
  select an outer instance.
- [ ] `TB-A11Y-01` `[reference]` `[browser]` —
  **Tabs should pass accessibility checks when each frozen behavior fixture is rendered.**
  Run the checker on horizontal automatic, vertical manual, one-disabled, and
  all-disabled fixtures in both selected states; also assert every named
  tablist, Tab, and Panel relationship before expecting zero violations.
  Automated results supplement rather than replace the keyboard, focus, and
  hidden-panel assertions above.

## Composition gates

- [ ] `TB-COMP-01` `[reference]` `[browser]` —
  **Tabs should coordinate automatic selection when a horizontal settings composition is used.**
  Build `Profile`, `Billing`, and `Security` settings Tabs with controlled
  `value="profile"`, arrow to `billing`, accept `onChange("billing")`, and
  assert focus, one tab stop, selected state, linkage, and only the Billing form
  visible without submitting it.
  This proves the common composition uses Tabs and RovingFocus contracts
  without application selection glue.
- [ ] `TB-COMP-02` `[reference]` `[browser]` —
  **Tabs should separate focus from selection when a manual vertical editor composition contains disabled and editable content.**
  Build vertical `Preview`, disabled `History`, and `Source` Tabs with an input
  in the selected Preview Panel; ArrowDown must skip to focused Source without
  hiding Preview, then Enter must request `source`, blur the input once, and
  reveal the Source Panel after the controlled rerender.
  This composition jointly proves manual policy, disabled skip, editable-panel
  blur, and vertical keyboard defaults.
- [ ] `TB-COMP-03` `[reference]` `[browser]` —
  **Tabs should isolate nested selection when a workspace composition contains popup triggers.**
  Put manual inner Tabs plus Menu, Combobox, and Tooltip triggers inside the
  selected Panel of automatic outer Tabs; operate every inner control and then
  arrow the outer list, asserting independent callback logs, correct active
  elements, one visible Panel per instance, and unchanged popup ownership.
  This adversarial composition proves events from nested/portalled controls do
  not leak into the wrong Tabs or duplicate Overlay/Popover behavior.

## Owned elsewhere

- One-tab-stop, wrap, disabled skip, orientation, RTL, and Home/End mechanics:
  `RovingFocus`.
- Popup layer behavior in panels: `Overlay`/`Popover`.

## Out of scope

- Nullable/deselectable Tabs, uncontrolled defaults, link-navigation Tabs,
  panel-size transition helpers, indicators, or a Provider API.
