# Menu test contract

Playwright: `matrix/lib/tests/e2e/menu.spec.ts`  
Unit: `matrix/lib/tests/unit/menu-intent.test.ts`
Page: `/menu`

Menu owns APG menu navigation, command activation, and controlled submenu
orchestration. Popover supplies dropdown/context positioning; Overlay owns the
shared layer stack.

## Freeze decisions

1. Omitted nested Menu `open` is controlled false, never local ephemeral state.
2. Item `onSelect` receives a cancelable event; if unprevented, it bubbles one
   deepest-first dismissal request through the containing Menu/Popover layers.
3. Menu.Content uses Overlay placement/offset/collision props, defaults to
   right-start (left-start in RTL), inherits the root popup destination, and
   owns stable ARIA IDs.
4. A root Menu adopts its containing Popover's layer;
   each open submenu adds exactly one child layer. Menu plus Popover must not
   double-register Escape/outside dismissal.
5. Submenu pointer intent uses fixed 100ms open, 300ms close, and 5px
   grace-polygon padding; the API intentionally exposes no per-submenu timing
   controls.
6. Item and LinkItem default `closeOnSelect=true`; CheckboxItem and RadioItem
   default it false. Choice state requests precede dismissal when explicitly
   closing, and rejected controlled props remain authoritative.
7. LinkItem retains native anchor navigation for unmodified primary click,
   Enter, and Menu-owned Space. Cancellation prevents both Menu defaults and
   navigation, while modifier, middle-button, context-menu, `target`, and
   `download` behavior remain native.

Omitted root `orientation` means vertical.

These are anatomy/API details, not reasons for another top-level MenuButton or
ContextMenu component.

## Source evidence

- `vendor/radix-primitives/e2e/{dropdown-menu,context-menu,menubar}.spec.ts` —
  repeated pointer-intent, submenu keyboard, active-menu typeahead, item close,
  and RTL cases consolidated here.
- `vendor/base-ui/packages/react/src/menu` tests — event cancellation, Space
  during typeahead, submenu ARIA/focus, detached/nested contrast, checkbox/
  radio state, links, close-on-click policy, and current callback behavior.
- `vendor/react-spectrum/packages/react-aria-components/test/Menu.test.tsx` —
  roles, disabled items, checkbox/radio selection, native links, action,
  context trigger, nested submenu restore, and focus/press modalities.
- Zag Menu `intentPolygon` and React Aria `useSafelyMouseToSubmenu` — diagonal
  grace geometry.

## Required cases

### DOM, roles, and state

- [ ] `MN-DOM-01` `[reference]` `[browser]` —
  **Menu should render every public part with its documented native role and no extra host.**
  Render Item, CheckboxItem, RadioGroup/RadioItem, LinkItem, Separator, and a
  controlled nested Menu with Menu.Trigger/Menu.Content, then inspect portal and source
  DOM. Assert nested Menu contributes no node, root Menu and Menu.Content are
  `div[role=menu]`, Item/Menu.Trigger are
  `div[role=menuitem]`, CheckboxItem is `div[role=menuitemcheckbox]`,
  RadioGroup is `div[role=group]`, RadioItem is
  `div[role=menuitemradio]`, LinkItem is `a[role=menuitem]`, and Separator is
  `div[role=separator]`, with no extra wrapper or duplicate popup; all command
  kinds stay under one Menu owner.
- [ ] `MN-DOM-02` `[vendor]` `[browser]` —
  **Menu should expose root orientation while keeping submenus vertical and disabled entries inert.**
  Render a horizontal root with a vertical Menu.Content, disabled Item, and
  disabled Menu.Trigger, then Tab and arrow through both levels and attempt
  activation. Assert root/submenu orientation semantics, disabled
  `aria-disabled`/`data-disabled`, no disabled focus or action, and no open or
  dismissal request; this deliberately converges away from Base UI's
  focusable-disabled menu behavior.
- [ ] `MN-DOM-03` `[vendor]` `[browser]` —
  **Menu.Trigger should expose controlled expansion and a stable relationship to Menu.Content.**
  Render a closed controlled nested Menu with explicit and generated ID variants, then
  accept open and close requests. Assert `aria-haspopup="menu"`,
  `aria-expanded` matches the prop, and `aria-controls` always resolves to the
  one stable unique Menu.Content ID while mounted; this ports vendor submenu ARIA
  regressions.
- [ ] `MN-DOM-04` `[reference]` `[browser]` —
  **Menu parts should preserve their fixed native element contracts through interaction.**
  Pass native attributes, `data-*`, class, style, ordinary handlers, and
  object/callback refs to every div part and LinkItem's anchor, then open,
  navigate, toggle, and follow a link. Assert each prop/ref reaches its
  documented native element, anchor `href`/`target`/`download` remain native,
  consumer transforms/styles survive positioning, and no polymorphic `as`
  host appears; internal orchestration must stay transparent.
- [ ] `MN-DOM-05` `[reference]` `[browser]` —
  **Menu typeahead should prefer explicit textValue over current meaningful rendered text.**
  Render every actionable Item kind and Menu.Trigger with nested icons,
  accessible names, and one `textValue="Zulu"`, then type old, current,
  decorative, and explicit prefixes before and after rerendering labels.
  Assert focus crosses plain, choice, radio, and link commands by current
  accessible/rendered text unless `textValue` overrides it, while RadioGroup
  and decorative content never match; stale or structural text must not
  pollute search.
- [ ] `MN-DOM-06` `[reference]` `[browser]` —
  **Menu should represent empty content and separators without inventing roving items.**
  Render an empty Menu and another containing only Separators between two
  enabled Items, then open, Tab, arrow, and type matching separator text.
  Assert the empty root keeps `role=menu` with no fake item or tab stop, and
  separators never receive focus or enter typeahead; structural content cannot
  become a command.
- [ ] `MN-DOM-07` `[reference]` `[browser]` —
  **Menu should generate collision-free stable IDs across nested portals and React roots.**
  Render equal labels in two root menus and two nested submenu levels across
  independent React roots, open all, rerender, and hydrate one copy. Assert
  every root/Menu.Content ID is unique and stable, every control reference
  resolves within the correct menu tree, and no duplicate ID or hydration
  warning occurs; labels are not identities.
- [ ] `MN-DOM-08` `[reference]` `[browser]` —
  **Menu.Content should use the shared Popover engine relative to its Menu.Trigger.**
  Open a controlled nested Menu near a collision boundary and inspect the portalled
  Menu.Content before and after viewport change. Assert it is positioned from
  the Menu.Trigger, exposes the resolved side and open/closed state hooks, keeps
  one stable ID, and contributes no second Menu positioning runtime; submenu
  geometry belongs to Popover.
- [ ] `MN-DOM-09` `[reference]` `[browser]` —
  **Menu should default omitted root orientation to vertical at every menu level.**
  Omit root `orientation`, open the root and Menu.Content, and press vertical and
  horizontal keys. Assert root and submenu expose vertical semantics,
  Up/Down perform roving, and horizontal keys retain only submenu open/close
  meaning; an omitted prop must not depend on layout CSS.
- [ ] `MN-DOM-10` `[reference]` `[browser]` —
  **Menu.Content should apply one mirrored default placement while preserving explicit geometry props.**
  Open the same nested Menu at LTR and RTL boundaries, then supply explicit placement,
  offset, and collision padding plus a consumer transform. Assert defaults
  resolve from `right-start` in LTR and `left-start` in RTL, explicit values
  reach Popover once, collision output is observable, and consumer transform
  remains intact; double middleware would corrupt submenu intent geometry.

### Entry, roving focus, and typeahead

- [ ] `MN-FOCUS-01` `[vendor]` `[browser]` —
  **Menu should choose its entry item from the keyboard command that opened it.**
  Open a MenuButton with Enter, Space, and ArrowUp in separate fixtures, and
  open a ContextMenu from its documented keyboard gesture, with disabled
  boundary Items present. Assert Enter/Space/context entry focuses the first
  enabled Item, ArrowUp entry focuses the last enabled Item, and exactly one
  root tab stop exists; this ports vendor menu-entry behavior.
- [ ] `MN-FOCUS-02` `[convergence]` `[browser]` —
  **Menu should focus the first enabled root item after pointer opening but not after submenu hover opening.**
  Open a MenuButton by primary click and a ContextMenu by right click, then
  hover a Menu.Trigger to open its controlled Menu.Content. Assert root focus moves
  only after the mounted menu exists and lands on its first enabled Item,
  while hover-opened Menu.Content leaves focus on the parent item and does not
  focus its first child; modality controls submenu intent.
- [ ] `MN-FOCUS-03` `[vendor]` `[browser:all]` —
  **Vertical Menu should provide complete wrapped roving focus over enabled commands.**
  Open a vertical menu containing enabled Items, disabled Items, Menu.Trigger
  parts,
  and Separators, then exercise Up, Down, Home, End, and both boundaries.
  Assert expected wrapped focus, disabled/Separator skip, exactly one
  `tabindex="0"`, and no action/open request from movement; this ports the APG
  vendor matrix through RovingFocus.
- [ ] `MN-FOCUS-04` `[vendor]` `[browser:all]` —
  **Horizontal Menu should rove with mirrored Left and Right while reserving cross-axis keys for submenus.**
  Render a horizontal root in LTR and RTL with one Menu.Trigger, focus a middle
  Item, and press both axes. Assert Left/Right rove with RTL reversal,
  Up/Down do not become root roving keys, and the documented cross-axis
  submenu commands still open/close exactly once; orientation cannot erase
  hierarchy semantics.
- [ ] `MN-FOCUS-05` `[reference]` `[browser]` —
  **Menu should leave focus at its source when no enabled entry item exists.**
  Open empty and all-disabled MenuButton and ContextMenu fixtures, then press
  arrows, Home, End, and typeahead. Assert focus remains on the root Trigger
  or prior context target, no fake tab stop or callback appears, and every
  handled search terminates without looping; an empty collection needs a safe
  focus boundary.
- [ ] `MN-FOCUS-06` `[vendor]` `[browser]` —
  **Menu should not open a closed submenu merely because roving focus reaches
  its Menu.Trigger.**
  Open a root Menu and move focus onto an enabled closed Menu.Trigger with arrow
  navigation and with ordinary Tab entry in separate fixtures, without
  pointer hover or an activation key. Assert the Menu.Trigger becomes the sole
  current tab stop while `aria-expanded` remains false, `onOpen` is empty, and
  Menu.Content stays absent. This ports Radix `e2e/dropdown-menu.spec.ts`
  “should not open submenu when moving focus to trigger.”
- [ ] `MN-TYPE-01` `[vendor]` `[browser]` —
  **Menu typeahead should search and wrap only within the currently active menu level.**
  Open two submenu levels containing repeated prefixes also present in their
  ancestors, focus the deepest Item, and type a matching prefix repeatedly.
  Assert focus wraps among enabled matches in only that Menu.Content and never
  moves an ancestor Item; this ports Radix's “scope typeahead behaviour to the
  active menu” regression.
- [ ] `MN-TYPE-02` `[vendor]` `[browser]` —
  **Menu should treat Space as search text rather than activation during an active typeahead buffer.**
  Focus an Item or Menu.Trigger, type a printable prefix followed immediately by
  Space, then repeat Space after the buffer timeout. Assert the first Space
  only extends/no-matches search with no `onSelect` or `onOpen`, while the
  later Space activates once; this protects the Base UI typeahead-versus-Space
  regression.
- [ ] `MN-TYPE-03` `[reference]` `[browser]` —
  **Menu should reset and scope typeahead buffers as submenu ownership changes.**
  Start a root prefix, open a Menu.Content, type matching characters there, close
  it, and continue typing at the restored Menu.Trigger. Assert each level uses
  only its own current buffer, inactive ancestors never move focus, and closed
  submenu text cannot influence the root; buffers follow active-menu
  lifetime.
- [ ] `MN-TYPE-04` `[reference]` `[browser]` —
  **Menu should integrate repeated, timed, Unicode, disabled, and descendant typeahead edges.**
  Exercise repeated characters, multi-character timeout/reset,
  Unicode/diacritic labels, disabled matches, no-match text, and typing inside
  an editable descendant. Assert the documented enabled current-level focus
  result, no action on no-match, and untouched native editing in descendants;
  the Menu adapter must not fork RovingFocus behavior.

### Item activation

- [ ] `MN-ACT-01` `[vendor]` `[browser:all]` —
  **Menu should invoke one cancelable item selection for a primary pointer click.**
  Open a controlled root, click enabled Item `rename` once, and log the event
  without preventing it. Assert one `onSelect` with the originating pointer
  event and `defaultPrevented=false`, followed by one dismissal sequence and
  no synthetic duplicate; this ports the vendor pointer action path.
- [ ] `MN-ACT-02` `[vendor]` `[browser:all]` —
  **Menu should invoke one item selection for either Enter or Space with keyboard metadata.**
  Focus enabled Item `rename` and press Enter or Space in separate fresh
  fixtures. Assert exactly one `onSelect` per key, observable keyboard-derived
  event metadata including the original key/detail, no pointer metadata
  substitution, and one dismissal sequence; activation modality must remain
  inspectable.
- [ ] `MN-ACT-03` `[reference]` `[browser]` —
  **Menu should let an item's native consumer handler cancel selection and all resulting dismissal.**
  Attach a logging native click/keydown handler that calls
  `preventDefault()`, then activate the Item by pointer and keyboard. Assert
  the native handler runs before `onSelect`, neither selection nor any
  nested Menu or root Popover dismissal callback follows, and focus/open DOM stay intact;
  cancellation must stop at the action owner.
- [ ] `MN-ACT-04` `[convergence]` `[browser]` —
  **Menu should dismiss an uncanceled selected path exactly once from deepest submenu to root.**
  Open two controlled submenu levels, activate a deepest Item without
  preventing its selection event, and record all nested Menu and root Popover
  callbacks. Assert `onSelect` first, then one dismissal request per open level
  in deepest-first order with no duplicate root call; one command must unwind
  one layer tree deterministically.
- [ ] `MN-ACT-05` `[vendor]` `[browser]` —
  **Menu should close the complete tree and restore only the root trigger after submenu selection.**
  Open a two-level submenu, click a deepest enabled Item, and accept each
  controlled close request. Assert every Menu.Content unmounts, the action
  callback fires once, focus restores once to the root MenuButton trigger
  rather than intermediate Menu.Trigger parts, and no stale child layer remains;
  this ports vendor nested-menu closure.
- [ ] `MN-ACT-06` `[vendor]` `[browser]` —
  **Menu should keep disabled items entirely outside action and dismissal paths.**
  Target a disabled Item by pointer, programmatic focus plus Enter/Space,
  arrows, and matching typeahead while a submenu tree is open. Assert no
  `onSelect`, no dismissal callback, no durable disabled focus, and unchanged
  layer/open state; disabled commands cannot close an otherwise valid menu.
- [ ] `MN-ACT-07` `[reference]` `[browser]` —
  **Menu should select once when a primary press drags from its source onto an
  enabled item and should cancel when release lands outside.**
  Press the root trigger, drag into an enabled Item, and release there; then
  press an Item, drag outside the menu tree, and release in a fresh fixture.
  Assert the first path invokes one `onSelect` and one dismissal with the
  release modality preserved, the canceled path selects nothing, and neither
  down/up/click sequence emits a synthetic duplicate. This ports Base UI
  `MenuRoot.test.tsx` “triggers a menu item and closes the menu on click, drag,
  release” without exposing another press state machine.
- [ ] `MN-ACT-08` `[reference]` `[browser]` —
  **Menu should use current item callbacks and disabled membership after rerender.**
  Open a Menu, replace an Item's `onSelect`, toggle it disabled, then remove it
  while retaining a stale element reference and attempt activation at each
  stage. Assert only the latest live enabled callback can run, removed or
  disabled items cannot select or dismiss, and no stale registration remains;
  dynamic menus must not close over old authority.

### Choice items and close policy

- [ ] `MN-CHOICE-01` `[vendor]` `[browser]` —
  **Menu choice items should expose exact checkbox, radio-group, and radio-item roles from controlled state.**
  Render CheckboxItems with `checked={false}`, `true`, and `"mixed"`, plus a
  named RadioGroup whose controlled value selects `date`. Assert
  `role=menuitemcheckbox` with `aria-checked="false"|"true"|"mixed"`,
  `role=group` with its authored accessible name, and
  `role=menuitemradio` with exactly `date` reporting `aria-checked="true"`;
  vendor selection anatomy must remain visible without a second menu runtime.
- [ ] `MN-CHOICE-02` `[vendor]` `[browser:all]` —
  **Menu CheckboxItem should request the opposite boolean once from pointer, Enter, or Space.**
  Activate controlled unchecked, checked, and mixed CheckboxItems by primary
  click, Enter, and Space in fresh fixtures. Assert one `onChange(true)` for
  false or mixed and one `onChange(false)` for true, one `onSelect` event with
  observable modality metadata, unchanged controlled `aria-checked` before
  rerender, and no duplicate synthetic click; this ports vendor checkbox
  activation across engines.
- [ ] `MN-CHOICE-03` `[reference]` `[browser]` —
  **Menu CheckboxItem should keep controlled checked state authoritative across rejection and programmatic updates.**
  Activate `checked={false}` while the parent ignores `onChange`, then
  programmatically rerender `checked={true}` and later `"mixed"`. Assert the
  rejected request leaves `aria-checked="false"`, prop updates change ARIA/data
  without `onChange` or `onSelect`, focus remains valid, and no hidden toggle
  state survives; callback intent is not acceptance.
- [ ] `MN-CHOICE-04` `[vendor]` `[browser:all]` —
  **Menu RadioItem should request its value once while RadioGroup remains controlled.**
  Render RadioGroup value `name`, then activate `date` by primary click, Enter,
  and Space in separate fixtures and activate selected `name` once. Assert one
  `onChange` carrying the activated value for every action, including
  `onChange("name")` for the already selected item, one modality-bearing
  `onSelect`, and unchanged radio ARIA until the parent updates; one group owns
  mutually exclusive choice without interpreting parent acceptance.
- [ ] `MN-CHOICE-05` `[reference]` `[browser]` —
  **Menu RadioGroup should preserve controlled value through rejection, dynamic reorder, and programmatic selection.**
  Ignore a request from `name` to `date`, reorder both RadioItems, then
  programmatically set value to `date` and later to an absent value. Assert
  rejection keeps `name` checked, reorder follows value identity, the prop
  update checks `date` without callbacks, and an absent value leaves every
  mounted radio unchecked; RadioGroup must not normalize parent state.
- [ ] `MN-CHOICE-06` `[reference]` `[browser]` —
  **Menu choice activation should order native handlers, selection, state request, and optional dismissal predictably.**
  Give a CheckboxItem and RadioItem logging native click/keydown, `onSelect`,
  `onChange`, nested Menu dismissal, and root dismissal callbacks, with
  `closeOnSelect=true`. Assert the order is native handler, cancelable
  `onSelect`, one checked/value request, then one deepest-first complete-tree
  dismissal sequence; state ownership must settle before layers close.
- [ ] `MN-CHOICE-07` `[convergence]` `[browser]` —
  **Menu choice items should let cancellation stop both state requests and dismissal.**
  In separate pointer and keyboard fixtures, call `preventDefault()` from the
  choice's native handler or `onSelect` before activating it. Assert earlier
  consumer logs remain observable, `onChange` and every dismissal callback are
  absent, controlled ARIA/focus/open DOM stay unchanged, and unrelated event
  propagation follows the authored handler; cancellation cannot partially
  toggle a choice.
- [ ] `MN-CHOICE-08` `[reference]` `[browser]` —
  **Menu should apply closeOnSelect defaults by item kind and honor explicit overrides.**
  Activate plain Item, LinkItem, CheckboxItem, and RadioItem with
  `closeOnSelect` omitted, then repeat each with the opposite explicit boolean.
  Assert omitted plain/link commands request complete-tree dismissal after
  selection, omitted choices remain open after their state request, explicit
  false suppresses only dismissal, and explicit true closes choices after
  `onChange`; close policy must not change action semantics.
- [ ] `MN-CHOICE-09` `[vendor]` `[browser]` —
  **Menu roving focus and typeahead should treat choice items as commands while skipping structural RadioGroup and disabled choices.**
  Interleave plain, checkbox, radio-group/radio, disabled radio, link, and
  Separator parts, then use arrows, Home/End, and repeated prefix search.
  Assert one tab stop traverses enabled actionable parts in composed menu
  order, typeahead crosses item kinds, RadioGroup/Separator never receive
  focus, disabled choices are skipped, and no state request occurs from
  movement; all commands share one RovingFocus collection.
- [ ] `MN-CHOICE-10` `[reference]` `[browser]` —
  **Menu should cleanly update dynamic choice values, checked state, handlers, and group membership.**
  While open, add/remove/reorder CheckboxItems and RadioItems, move a radio
  between groups, replace its `value`/label/handler, and disable the currently
  focused choice. Assert roles and ARIA follow current props/group authority,
  focus recovers to the nearest enabled command, typeahead uses current text,
  old handlers/values never fire, and no rejected state is silently corrected;
  dynamic collections cannot retain stale choice registrations.

### Native LinkItem behavior

- [ ] `MN-LINK-01` `[vendor]` `[browser]` —
  **Menu LinkItem should remain a native anchor with menuitem semantics and complete authored attributes.**
  Render LinkItems with relative/absolute `href`, `target`, `download`,
  `rel`, native data/style props, and object/callback refs, then open the Menu
  without activation. Assert each is an `HTMLAnchorElement[role=menuitem]`,
  retains exact native attributes and StyleProps, participates once in roving
  focus/typeahead, and adds no hidden anchor or wrapper; menu semantics must
  not replace link semantics.
- [ ] `MN-LINK-02` `[vendor]` `[browser:all]` —
  **Menu LinkItem should run an unmodified primary click once, preserve navigation, and then dismiss by default.**
  Click enabled `/help` with the primary button while logging native
  click/capture, `onSelect`, and controlled dismissal and observing the
  browser navigation request. Assert consumer click handlers and cancelable
  `onSelect` each run once in order, native anchor navigation remains
  unprevented, and one complete-tree dismissal follows without a synthetic
  duplicate; LinkItem defaults `closeOnSelect=true`.
- [ ] `MN-LINK-03` `[vendor]` `[browser:all]` —
  **Menu LinkItem should preserve native Enter activation and provide one Menu-owned Space activation.**
  Focus `/help`, press Enter, then repeat with Space in a fresh fixture while
  recording click/selection/navigation and scroll. Assert each key produces
  one consumer click and `onSelect`, one native navigation and default
  dismissal, Space does not scroll the page, and neither path fires twice;
  keyboard Menu behavior must still honor anchor activation.
- [ ] `MN-LINK-04` `[convergence]` `[browser]` —
  **Menu LinkItem should let preventDefault cancel both navigation and Menu dismissal.**
  Prevent an unmodified primary click, Enter, and Space from the native handler
  or `onSelect` in separate fixtures. Assert the consumer cancellation is
  observable, the browser performs no navigation/download, no Menu/Popover
  dismissal request follows, and focus/open DOM remain; splitting cancellation
  would navigate a command the application rejected.
- [ ] `MN-LINK-05` `[vendor]` `[browser:all]` —
  **Menu LinkItem should leave modified clicks, middle clicks, and the browser context menu native without selecting or dismissing.**
  Activate `/help` with Meta/Ctrl/Shift/Alt-primary clicks, auxiliary button 1,
  and a right-click/contextmenu event in separate fixtures. Assert the browser
  retains its new-tab/window/context behavior and event metadata, while
  `onSelect`, choice callbacks, and Menu dismissal remain absent and the
  current menu stays open; alternate link gestures must not masquerade as a
  plain command.
- [ ] `MN-LINK-06` `[vendor]` `[browser]` —
  **Menu LinkItem should preserve target and download effects while applying default dismissal only to the originating menu.**
  Activate `_blank` and `download="report.csv"` LinkItems by unmodified primary
  click and Enter inside a nested submenu. Assert the browser receives the
  exact target/download request, consumer handlers observe the native event,
  and only the containing Menu tree dismisses once deepest-first without
  canceling the external effect; native destination policy remains
  application-owned.
- [ ] `MN-LINK-07` `[vendor]` `[browser]` —
  **Disabled Menu LinkItem should be non-navigable and absent from focus, typeahead, and dismissal paths.**
  Render disabled `/help` between enabled commands and target it by Tab,
  arrows, matching typeahead, primary/middle/right click, Enter, and Space.
  Assert `aria-disabled="true"`/`data-disabled`, no roving tab stop or active
  focus, no browser navigation, `onSelect`, or dismissal, and preserved
  noninteraction attributes; disabling an anchor must close every activation
  route.
- [ ] `MN-LINK-08` `[reference]` `[browser]` —
  **Menu LinkItem should preserve navigation but suppress dismissal when closeOnSelect is false.**
  Set `closeOnSelect=false` on `/help`, activate it by unmodified primary click
  and Enter, and prevent the test harness from leaving the page only after
  recording navigation. Assert native handlers, `onSelect`, and navigation
  still occur once, no dismissal callback fires, and the controlled Menu
  remains open with valid focus; close policy cannot become a navigation
  policy.
- [ ] `MN-LINK-09` `[reference]` `[browser]` —
  **Menu LinkItem should use current href, label, disabled state, handlers, and close policy after dynamic rerender.**
  While open, change `/old` to `/new`, replace text/textValue and callbacks,
  toggle disabled and `closeOnSelect`, then reorder/remove the LinkItem before
  using typeahead and activation. Assert only current text focuses it, only the
  current live anchor can navigate `/new` and invoke current handlers, current
  close policy controls dismissal, and stale/removed DOM cannot act; dynamic
  links must not retain initial closures.

### Controlled submenu keyboard

- [ ] `MN-SUBKEY-01` `[vendor]` `[browser:all]` —
  **LTR Menu should open an enabled submenu with Right and focus its first enabled item after mount.**
  Focus a closed Menu.Trigger in LTR, press ArrowRight, delay then accept the
  controlled open update, and include a disabled first child. Assert one
  `onOpen`, unchanged closed ARIA/DOM and trigger focus before rerender, then
  mounted Menu.Content with focus on its first enabled Item; this prevents focus
  from racing controlled mount timing.
- [ ] `MN-SUBKEY-02` `[vendor]` `[browser:all]` —
  **Menu should give Enter and Space the same controlled submenu open-and-focus behavior.**
  Focus a closed Menu.Trigger and press Enter or Space in separate fixtures,
  then accept the open request. Assert one `onOpen` per activation, no Item
  `onSelect` or ancestor dismissal, and focus on the first enabled Menu.Content
  Item only after mount; Menu.Trigger activation is expansion, not command
  selection.
- [ ] `MN-SUBKEY-03` `[vendor]` `[browser:all]` —
  **LTR Menu should close only the current submenu with Left and restore its Menu.Trigger.**
  Open two submenu levels, focus an Item in the deepest LTR Menu.Content, and
  press ArrowLeft before accepting that nested Menu's close. Assert one deepest
  `onDismiss`, no ancestor close, focus restored to its own Menu.Trigger after
  unmount, and parent/root content still visible; this ports vendor
  level-local close behavior.
- [ ] `MN-SUBKEY-04` `[vendor]` `[rtl]` —
  **RTL Menu should mirror submenu open and close arrows without changing activation or vertical movement.**
  Place the same nested fixture under `dir=rtl`, press Left on a closed
  Menu.Trigger and Right inside its Menu.Content, then use Enter, Space, Up, and
  Down. Assert mirrored one-level open/close requests and focus restoration,
  while activation and vertical roving match LTR; dynamic direction must be
  read from the current DOM.
- [ ] `MN-SUBKEY-05` `[vendor]` `[browser]` —
  **Menu should let Escape close one submenu level and restore its trigger before the next Escape escapes upward.**
  Open a two-level tree, focus a deepest Item, press Escape and accept only the
  deepest close, then press Escape again. Assert the first request targets one
  nested Menu and restores its Menu.Trigger while ancestors remain open, and the second
  reaches the parent level/layer exactly once; this adopts level-by-level
  ownership rather than Radix's one-key full-tree Escape.
- [ ] `MN-SUBKEY-06` `[reference]` `[browser]` —
  **Menu should remain visibly controlled when submenu open or close requests are rejected.**
  Press an opening key on a closed nested Menu and a closing key inside an open nested Menu
  while the parent logs but ignores both. Assert closed ARIA/DOM/focus remain
  closed in the first fixture and open ARIA/DOM/current focus remain open in
  the second, with one request each; callbacks cannot pretend mount state
  changed.
- [ ] `MN-SUBKEY-07` `[reference]` `[browser]` —
  **Menu should honor consumer key cancellation before submenu or roving defaults.**
  Attach a Menu.Trigger/Item `onKeyDown` that calls `preventDefault()`, then try
  open, close, and roving keys. Assert the consumer log is first, no
  `onOpen`/`onDismiss`, no focus movement or ARIA change, and unrelated native
  propagation remains authored; cancellation belongs to the node handling the
  key.
- [ ] `MN-SUBKEY-08` `[reference]` `[browser]` —
  **Menu should keep a disabled Menu.Trigger inert even when its nested Menu is externally open.**
  Render the disabled nested Menu first closed and then controlled open, attempt
  pointer/keyboard open and close, and traverse the parent menu. Assert the
  trigger is skipped and emits no request, while externally open Menu.Content
  and ARIA remain represented but noninteractive with no automatic focus;
  controlled representation cannot override disabled input policy.
- [ ] `MN-SUBKEY-09` `[reference]` `[browser]` —
  **Nested Menu should default omitted open to controlled false.**
  Omit `open`, focus the Menu.Trigger, and activate it once while recording but
  ignoring `onOpen`. Assert exactly one true/open request, continued
  `aria-expanded="false"`, no Menu.Content or child layer, and focus on the
  trigger; omission must not create ephemeral local submenu state.
- [ ] `MN-SUBKEY-10` `[vendor]` `[browser]` —
  **Menu should focus the first enabled submenu item when an open-by-pointer
  Menu.Trigger is subsequently activated with its directional key.**
  Hover-open a controlled nested Menu without moving focus into it, keep focus on its
  Menu.Trigger, and press ArrowRight in LTR or ArrowLeft in RTL. Assert no second
  `onOpen`, focus moves once to the first enabled mounted Menu.Content item, and
  parent/root state remains open. This ports Radix
  `e2e/dropdown-menu.spec.ts` “focus first item when pressing right arrow after
  opening submenu with mouse.”

### Pointer submenu intent

- [ ] `MN-INTENT-01` `[vendor]` `[browser:all]` —
  **Menu should request hover opening after 100ms without moving focus into the submenu.**
  Move a mouse pointer onto a closed enabled Menu.Trigger, advance to 99ms and
  then 100ms, and accept the controlled request. Assert no request before the
  boundary, exactly one `onOpen` at 100ms, Menu.Content mount after rerender, and
  unchanged focus rather than focus on its first Item; this ports vendor
  hover-entry intent.
- [ ] `MN-INTENT-02` `[vendor]` `[browser]` —
  **Menu should keep a submenu open during diagonal pointer travel toward its content.**
  Open a nested Menu, move from its Menu.Trigger through points inside the 5px
  grace polygon toward the Menu.Content, and cross parent Items along that path.
  Assert no `onDismiss`, no parent focus/hover takeover, stable trigger
  expanded state, and reachable Menu.Content; the polygon protects intentional
  diagonal travel.
- [ ] `MN-INTENT-03` `[vendor]` `[browser]` —
  **Menu should request submenu closure 300ms after pointer travel clearly moves away.**
  Open a nested Menu, move from its trigger through points outside the grace polygon
  away from Menu.Content, and advance time to 299ms then 300ms. Assert no early
  close, exactly one `onDismiss` at the timeout, and controlled Menu.Content
  remains until the parent rerenders; fixed delay distinguishes intent from
  jitter.
- [ ] `MN-INTENT-04` `[vendor]` `[browser]` —
  **Menu should remain open without duplicate callbacks when pointer returns through its associated submenu path.**
  Move Menu.Trigger to Menu.Content and back to the same Menu.Trigger, then open a
  nested Menu and return to its associated root trigger. Assert the associated
  nested Menu stays open with no repeated `onOpen`/`onDismiss`, while unrelated deeper
  Submenus close once; this ports Radix's return-to-trigger and unassociated-
  submenu regressions.
- [ ] `MN-INTENT-05` `[vendor]` `[browser]` —
  **Menu should close an open submenu when pointer intent switches to another parent entry.**
  Open a nested Menu and move the pointer to another parent Item, disabled Item,
  enabled Menu.Trigger, and disabled Menu.Trigger in separate runs. Assert the old
  nested Menu requests one close in every case, the new enabled entry receives current
  hover/focus behavior without action, and disabled entries remain inert; this
  ports Radix's “any item in parent menu” matrix.
- [ ] `MN-INTENT-06` `[vendor]` `[browser]` —
  **Menu should calculate pointer grace from a submenu's resolved collision side.**
  Force a preferred right submenu to flip left at a narrow viewport, then move
  pointer first toward and then away from the rendered Menu.Content. Assert
  toward travel keeps it open and away travel requests close according to the
  left-side polygon, with resolved side hooks matching geometry; preferred
  placement cannot drive stale intent math.
- [ ] `MN-INTENT-07` `[vendor]` `[rtl]` —
  **RTL Menu should mirror toward-and-away submenu intent geometry.**
  Under `dir=rtl`, open default left-side and collision-flipped right-side
  submenus, then replay diagonal paths in both directions. Assert keep/close
  decisions mirror LTR around the actual resolved side, callbacks occur once,
  and a dynamic direction change affects new samples; this ports the Radix RTL
  pointer matrix.
- [ ] `MN-INTENT-08` `[reference]` `[touch]` —
  **Menu should never start hover-intent timers for touch and should activate a Menu.Trigger once on tap.**
  Send touch pointer enter/move/leave over a closed Menu.Trigger, advance past
  300ms, then tap it once. Assert no hover-timer callback, exactly one
  activation-driven `onOpen`, no synthetic mouse duplicate, and controlled
  focus/ARIA behavior; touch has no hover trajectory.
- [ ] `MN-INTENT-09` `[convergence]` `[unit]` —
  **Menu's intent polygon should return deterministic decisions for geometric and temporal edge inputs.**
  Evaluate points exactly on the 5px boundary, slow and fast samples, reversed
  travel, each resolved side, zero-size rectangles, and stale/out-of-order
  pointer timestamps. Assert a frozen keep/close result for every vector and
  no NaN, loop, or retained stale sample; deterministic pure geometry is
  required before browser timing can be trusted.
- [ ] `MN-INTENT-10` `[convergence]` `[browser]` —
  **Menu should not open an activation-owned root merely because the pointer
  hovers its source.**
  Move a mouse and hover-capable pen across closed MenuButton and ContextMenu
  source fixtures, advance beyond all submenu intent delays, and compare with
  an explicit click, context press, or keyboard command. Assert hover alone
  produces no root `onOpen`, layer, or focus move, while the documented
  activation opens once. Menubar/NavigationMenu hover-open is a higher-level
  product policy and Radix menubar evidence must not leak into base Menu.

### Tree dismissal and focus

- [ ] `MN-CLOSE-01` `[vendor]` `[browser]` —
  **Menu should unwind every open level once when a press occurs outside the root subtree.**
  Open a root and two controlled Submenus, press an unrelated body control,
  and record all granular/root dismissal callbacks before accepting them.
  Assert one deepest-first request per level, no ancestor called twice by the
  same event, all content gone after updates, and focus restored according to
  root modality; this ports vendor outside-tree closure.
- [ ] `MN-CLOSE-02` `[vendor]` `[browser]` —
  **Menu should treat interaction in any portalled descendant as inside its root subtree.**
  Open nested portalled Menu.Content, then click/right-click its background,
  Menu.Trigger, and non-item chrome without selecting. Assert no root or
  ancestor outside-dismiss callback, all open levels remain, and only actual
  Item activation can trigger command dismissal; composed branch membership
  must cross portal boundaries.
- [ ] `MN-CLOSE-03` `[reference]` `[browser]` —
  **Menu should allow focus into nested portalled Menu.Content as a parent FocusLock shard.**
  Open a Menu inside a locked Overlay, then keyboard-open a portalled nested Menu and
  Tab/focus among its Items. Assert focus enters and remains in the Menu
  subtree without containment bounce, background nodes stay excluded, and the
  parent lock still owns restoration; child portals are branches, not escapes.
- [ ] `MN-CLOSE-04` `[reference]` `[browser]` —
  **Menu should cascade a programmatic root close deepest-first and restore only the root trigger.**
  With two Submenus open and focus in the deepest Item, programmatically set
  root Popover closed and accept the resulting child requests. Assert one
  `onDismiss` per open nested Menu in deepest-first order, no duplicate root dismissal,
  child layers/DOM leave in that order, and focus restores once to the root
  MenuButton rather than each intermediate Menu.Trigger; root closure owns final
  restoration.
- [ ] `MN-CLOSE-05` `[reference]` `[browser]` —
  **Menu should close on Tab or Shift+Tab and continue relative to the root trigger rather than portal order.**
  Portal an open Menu away from its MenuButton, focus a middle Item, and press
  Tab or Shift+Tab in separate fixtures before accepting the controlled root
  close. Assert one close request, then native focus on the next or previous
  tabbable adjacent to the source trigger, no portal-order jump, and no focus
  trap; this intentionally differs from vendor menus that retain focus on Tab.
- [ ] `MN-CLOSE-06` `[vendor]` `[browser]` —
  **Menu should choose a live focus fallback when a submenu trigger disappears or becomes disabled before close.**
  Open a nested Menu, focus a child, remove or disable its Menu.Trigger, and then close
  that level with Escape/programmatic state. Assert focus never targets
  detached or disabled DOM and falls to the nearest enabled parent Item, root
  trigger, or documented root fallback, with one close request; this ports
  vendor stale-restore regressions.
- [ ] `MN-CLOSE-07` `[reference]` `[browser]` —
  **Menu should bind one layer to each root popup and each open submenu.**
  Open equivalent MenuButton and ContextMenu roots with two nested Menu levels, then
  press Escape and outside in separate runs while logging layer callbacks.
  Assert one adopted root Popover/Menu layer plus one child per open nested Menu and
  exactly one request for the top affected level per event, with no duplicate
  Menu and Popover registrations; layer authority must be singular.
- [ ] `MN-CLOSE-08` `[reference]` `[browser]` —
  **Menu should retain open DOM and current focus when its parent rejects a Tab-close request.**
  Focus an Item in a controlled open root, press Tab or Shift+Tab, and leave
  the open prop unchanged. Assert one root close request, unchanged
  open Menu/layer ARIA, focus retained on the current Item, and no background
  tabbable receives focus; rejected dismissal cannot expose inert content.
- [ ] `MN-CLOSE-09` `[vendor]` `[browser]` —
  **Menu should close when an unregistered extension overlay receives an
  outside interaction and stops later mouse events.**
  Open a MenuButton root, interact with a password-manager-style sibling
  overlay whose `mousedown`, `mouseup`, and `click` handlers stop propagation,
  and accept the Menu close request. Assert the initial outside path requests
  one complete-tree dismissal, later blocked events add no duplicate, all
  Submenus close deepest-first, and focus follows the root policy. This ports
  Radix `e2e/dropdown-menu.spec.ts`; modal Overlay intentionally remains open
  for the corresponding `OV-OUT-07` fixture.
- [ ] `MN-CLOSE-10` `[vendor]` `[browser]` —
  **Menu should keep its tree open when Shift+Tab moves within a nested dialog
  that is registered as its child layer and focus branch.**
  Open a Menu, launch a nested modal dialog from one Item, focus a dialog
  control, and press Shift+Tab among the dialog's candidates. Assert the dialog
  lock handles focus, no Menu outside or Tab-close request runs, every menu
  level remains controlled open, and closing the dialog restores into a live
  menu target once. This ports Base UI `MenuRoot.test.tsx` “keeps the menu and
  dialog open when pressing Shift+Tab inside a nested dialog.”

### Dynamic menus and environments

- [ ] `MN-DYNAMIC-01` `[vendor]` `[browser]` —
  **Menu should update roving order and typeahead when items change while open.**
  Open with `alpha, bravo, charlie`, focus `bravo`, then insert, reorder, and
  remove Items including the focused one before typing a changed label.
  Assert navigation follows current DOM/collection order, typeahead uses
  current text, removed focus falls to the nearest enabled Item, and one tab
  stop remains; this ports dynamic collection behavior.
- [ ] `MN-DYNAMIC-02` `[reference]` `[browser]` —
  **Menu should clean every ownership registration when an open submenu is removed or reparented.**
  Open a nested Menu with active hover timers and nested layer/branch state, then
  remove it or move it under another Menu while a separate root remains open.
  Assert its timer, polygon, branch, focus-shard, and layer effects disappear,
  no stale callback or dismissal touches the unrelated root, and the moved nested Menu
  registers once with its new parent.
- [ ] `MN-DYNAMIC-03` `[reference]` `[browser]` —
  **Menu should use current labels, disabled state, orientation, and direction on the next interaction.**
  While open, rename and disable the focused Item, switch root orientation,
  and flip inherited `dir`, then type and press each arrow. Assert stale text
  no longer matches, disabled focus recovers, and navigation/submenu keys use
  the new orientation/direction without remount or duplicate callback; event
  handlers cannot capture initial props.
- [ ] `MN-DYNAMIC-04` `[vendor]` `[browser]` —
  **Menu should update submenu control relationships atomically when its
  Menu.Trigger ID changes.**
  Open a controlled nested Menu, change the mounted Menu.Trigger's explicit ID while
  retaining Menu.Content, then close and reopen it. Assert the trigger keeps
  `aria-expanded`, Menu.Content's current relationship resolves only to the new
  ID, no stale duplicate ID remains, focus restoration targets the same live
  trigger node, and no callback runs from the ID update. This ports Base UI
  `MenuSubmenuTrigger.test.tsx` “follows a submenu trigger id change.”
- [ ] `MN-ENV-01` `[reference]` `[ssr]` —
  **Menu should hydrate closed compositions and open them with stable generated relationships.**
  Server-render closed MenuButton, ContextMenu, and nested Menu shapes, hydrate,
  then open each by its native modality. Assert no server access to browser
  globals, no hydration warning or changed/duplicate ID, controls resolve
  after mount, and focus/callbacks begin only from user action; portals cannot
  destabilize closed SSR.
- [ ] `MN-ENV-02` `[reference]` `[react:all]` —
  **Menu should keep one registration, timer, action, and close request across React versions and StrictMode.**
  Mount nested controlled menus under StrictMode in React 17, 18, and 19,
  hover-open a nested Menu, select an Item, and dynamically remove it. Assert one live
  registration and intent timer, one `onSelect`, one close per level, and no
  stale callback after cleanup; effect replay must remain unobservable.
- [ ] `MN-ENV-03` `[reference]` `[shadow]` —
  **Menu should preserve composed-path ownership and submenu behavior from a ShadowRoot.**
  Mount root source/content in an open ShadowRoot with Menu.Content portalled to
  its documented destination, then open, typeahead, focus, and press inside and
  outside. Assert composed inside paths do not dismiss, actual outside paths
  do once, focus/search use the owning root, and portal branches/layers clean
  up correctly.
- [ ] `MN-ENV-04` `[reference]` `[browser:all]` —
  **Menu should produce the same frozen interaction results in Chromium, Firefox, and WebKit.**
  Run root entry/roving, pointer and keyboard activation, controlled submenu
  keys, timed grace-polygon travel, collision flip, and RTL fixtures in every
  engine. Assert identical public DOM/focus/callback order and timing
  boundaries within tolerance, with no engine-specific duplicate event path;
  these are browser contracts, not jsdom approximations.
- [ ] `MN-A11Y-01` `[reference]` `[browser]` —
  **Menu should pass accessibility checks for every frozen root and submenu shape.**
  Scan named empty, disabled, Separator, MenuButton, ContextMenu, and nested
  nested Menu fixtures after opening and closing relevant levels. Assert no violations
  plus exact roles, names, orientation, disabled state, expansion, controls,
  and one current tab stop; automation supplements the explicit focus and
  layer assertions.

## Composition gates

- [ ] `MN-COMP-01` `[reference]` `[browser]` —
  **MenuButton should compose Button, Popover, and Menu with one root interaction authority.**
  Build a controlled Button-triggered Popover containing a Menu with disabled
  and dynamic commands, then open by pointer, Enter, Space, and ArrowUp before
  selecting or tabbing away. Assert command-appropriate entry focus, exact
  selection-to-dismiss order, one adopted root layer, trigger-relative focus
  restoration, and no duplicate Popover toggle.
- [ ] `MN-COMP-02` `[reference]` `[touch]` —
  **ContextMenu should compose a virtual pointer anchor with Menu and no trigger relationship markup.**
  Right-click a target at concrete client coordinates, verify primary click
  does not open, interact inside, then right-click outside and repeat from the
  documented keyboard gesture and a long touch. With a Submenu open, long-
  touch the original target again. Assert the Menu positions at the pointer or
  touch anchor, root focus enters its first enabled Item, internal context
  presses stay inside, the repeated source gesture closes stale Submenus and
  reopens only the root, outside dismissal occurs once while native context
  behavior remains available, and no MenuButton-only
  `aria-expanded`/`aria-controls` is added to the target. This includes Radix
  `context-menu.spec.ts` long-touch root and submenu regressions.
- [ ] `MN-COMP-03` `[reference]` `[browser]` `[rtl]` —
  **Nested Menu should preserve two-level keyboard, intent, collision, and RTL ownership.**
  Build two controlled nested Menu levels near a viewport edge, force collision flip,
  switch `dir`, and exercise keyboard open/close, diagonal pointer travel,
  Item selection, Escape, outside press, and trigger removal. Assert resolved-
  side grace geometry, one child layer per nested Menu, deepest-first callbacks,
  mounted focus targets, and one final root restoration; this is the submenu
  freeze composition.
- [ ] `MN-COMP-04` `[reference]` `[browser]` —
  **Settings Menu should compose controlled checkbox and radio choices with per-item close policy.**
  Build a MenuButton containing mixed/boolean CheckboxItems and two named
  RadioGroups with disabled and dynamically reordered RadioItems, then use
  pointer, keyboard, typeahead, rejection, and explicit `closeOnSelect`
  overrides. Assert exact choice roles/ARIA, one current state request,
  controlled rejection, shared roving order, request-before-dismiss ordering,
  and default open retention for choices; this proves stateful commands need no
  second selection owner.
- [ ] `MN-COMP-05` `[reference]` `[browser]` —
  **A mixed link-and-command Menu should compose native links and commands
  without stealing browser link gestures.**
  Mix Item and enabled/disabled LinkItem destinations with
  `target`/`download` and dynamic hrefs inside root and submenu layers, then
  exercise primary, keyboard, modified, middle, and context activations plus
  cancellation and `closeOnSelect=false`. Assert native navigation effects and
  event metadata, no action for disabled links, one default dismissal only for
  plain activation, no dismissal for alternate/canceled/preserved-open paths,
  and one final focus restoration.

## Owned elsewhere

- Shared Escape/outside/branch/cascade across Overlay/Popover/Menu: `Overlay`.
- Popup placement, available height, and portal integration: `Popover`; exit
  detection: `Presence`.
- Generic roving/typeahead: `RovingFocus`.

## Out of scope

- Sections beyond RadioGroup, subdialogs, loading/virtualization, Menubar
  hover policy, NavigationMenu, or a second Menu-owned overlay runtime.
