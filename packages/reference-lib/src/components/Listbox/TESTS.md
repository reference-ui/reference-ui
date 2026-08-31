# Listbox test contract

Playwright: `matrix/lib/tests/e2e/listbox.spec.ts`  
Unit: `matrix/lib/tests/unit/listbox.test.ts`
Page: `/listbox`

Listbox owns option registration and controlled single/multiple selection. A
standalone Listbox uses DOM roving focus; Combobox adapts the same collection
to virtual focus and owns `aria-activedescendant`.

## Virtualization contract

The public `VirtualFocusAdapter` supplied as
`virtual={{items, scrollToIndex}}` provides complete ordered logical metadata
(`value`, `textValue`, `disabled`) without rendering it. Each mounted Option
supplies its zero-based `index`; Listbox validates that it matches the logical
item, derives set metadata, requests scroll for unmounted targets, and exposes
focus only after the target mounts. This is an adapter to an application
virtualizer, not another top-level component.

## Native grouping contract

Application-authored `div[role=group]` regions may contain Options at any
supported nesting depth and use ordinary `aria-label` or `aria-labelledby`.
Listbox preserves those regions while flattening registered Options in current
composed DOM order for roving focus, typeahead, and selection; group labels and
other non-options never enter the option set.

## Freeze defaults

Omitted `selection`, `value`, and `orientation` mean controlled single
selection with `null` value and vertical navigation. Omission never creates an
uncontrolled selection store.

## Source evidence

- `vendor/react-spectrum/packages/react-aria-components/test/ListBox.test.js`
  and `ListBox.browser.test.tsx` — roles/data, single/multiple interaction,
  disabled options, orientation, dynamic collections, and virtualization.
- `vendor/react-spectrum/packages/react-aria/test/selection/useSelectableCollection.test.js`
  and `react-aria/src/selection/{ListKeyboardDelegate,useTypeSelect}.ts` —
  focus entry, movement, wrapping, and typeahead.
- React Aria `useOption.ts` — `aria-setsize`/`aria-posinset` for virtualized
  collections.
- Zag collection/listbox and `vendor/tanstack-virtual/packages/virtual-core` —
  disabled navigation and scroll-to-index.

## Required cases

### DOM, roles, and collection

- [x] `LB-DOM-01` `[reference]` `[browser]` —
  **Listbox should render only its documented listbox and option hosts.**
  Render one top-level Option and two Options nested in an authored
  `div[role=group]`, then inspect the light DOM before interaction. Assert one
  `div[role=listbox]`, three authored `div[role=option]` hosts at their original
  depths, the unchanged native group, and no hidden select, hidden input,
  synthetic option, or popup wrapper; grouping must not imply direct-child
  anatomy or another owner.
- [x] `LB-DOM-02` `[vendor]` `[browser]` —
  **Listbox should expose multiselectability only in multiple-selection mode.**
  Render otherwise identical controlled single and multiple fixtures, then
  inspect the roots. Assert that single mode omits `aria-multiselectable` and
  multiple mode sets `aria-multiselectable="true"`, preserving the mode
  distinction tested by the React Aria ListBox role regressions.
- [x] `LB-DOM-03` `[vendor]` `[browser]` —
  **Listbox options should mirror controlled selection in ARIA and data state.**
  Render enabled values `alpha`, `bravo`, and `charlie` with controlled value
  `bravo`, then programmatically change it to `charlie`. Assert every option
  always has `aria-selected="true"` or `"false"`, only the controlled option
  has `data-selected`, and no `onChange` fires; this prevents visual state from
  diverging from the accessibility tree.
- [x] `LB-DOM-04` `[vendor]` `[browser]` —
  **Listbox should keep disabled options out of every interactive path.**
  Render enabled `alpha` and `charlie` around disabled `bravo`, Tab into the
  Listbox, and attempt pointer, Space, Enter, arrow, and typeahead activation
  of `bravo`. Assert `bravo` has `aria-disabled="true"` and `data-disabled`,
  never receives `tabindex="0"` or DOM focus, and produces no `onChange`;
  this ports the vendor disabled-item navigation regression.
- [x] `LB-DOM-05` `[reference]` `[browser]` —
  **Listbox should preserve native root and option contracts for each orientation.**
  Render vertical and horizontal roots with native `data-*`, class, style,
  event, and ref props on both Listbox and Option. Assert documented
  orientation and `aria-orientation`, exact native `HTMLDivElement` refs, and
  unchanged consumer props after keyboard interaction; this prevents the
  collection engine from replacing its fixed hosts.
- [x] `LB-DOM-06` `[reference]` `[browser]` —
  **Listbox should preserve empty and zero-like string identities while
  diagnosing actual duplicates.**
  Render options valued `""`, `"0"`, and `"alpha"`, select and deselect each
  zero-like value through controlled updates, then rerender a second
  `"alpha"` under the same root. Assert `""` and `"0"` remain distinct,
  register, navigate, and select normally without truthiness coercion, while
  the duplicate throws a descriptive identity error naming `"alpha"` before
  ambiguous focus or selection state is exposed. This includes React Aria
  `ListBox.test.js` “selection with falsy keys.”
- [x] `LB-DOM-07` `[reference]` `[browser]` —
  **Listbox should remain semantically empty without inventing a focus target.**
  Render a Listbox with an empty collection between two native buttons and Tab
  through the page, then rerender it with consumer `tabIndex={0}`. Assert the
  empty root keeps `role=listbox` but contains no option or hidden item, is
  skipped initially, and becomes focusable only with that explicit tab index;
  this preserves application ownership of empty-state focus.
- [x] `LB-DOM-08` `[reference]` `[browser]` —
  **Listbox should choose one deterministic mounted option for initial Tab entry.**
  Render `alpha`, disabled `bravo`, and `charlie`, first with controlled value
  `charlie` and then with `null`, and Tab into each fresh fixture. Assert only
  `charlie` has `tabindex="0"` when selected and only `alpha` does otherwise,
  with DOM focus landing on that option; this prevents two roving tab stops.
- [x] `LB-DOM-09` `[reference]` `[browser]` —
  **Listbox typeahead should use explicit text before current meaningful rendered text.**
  Render one option with `textValue="Zulu"` and decorative nested text, plus
  one option whose accessible name is `Bravo`, then type `z` and `b`. Assert
  focus follows `Zulu` and `Bravo` respectively, ignores decorative markup,
  and does not change selection; this makes the collection's searchable name
  stable and author-controllable.
- [x] `LB-DOM-10` `[reference]` `[browser]` —
  **Listbox should apply controlled single-null-vertical defaults when behavior props are omitted.**
  Omit `selection`, `value`, and `orientation`, focus the first option, and
  press Space while the parent records but ignores requests. Assert vertical
  single-selection ARIA, one `onChange("alpha")`, and continued
  `aria-selected="false"` for every option; omission must not create hidden
  uncontrolled state.
- [x] `LB-DOM-11` `[reference]` `[browser]` —
  **Listbox should represent a controlled selected-disabled option without making it interactive.**
  Render controlled value `bravo` where `bravo` is disabled, then Tab, type
  `b`, click it, and press Enter against it programmatically. Assert `bravo`
  simultaneously has selected and disabled ARIA/data state but never receives
  focus or produces `onChange`; controlled representation must not override
  disabled ownership.
- [x] `LB-DOM-12` `[vendor]` `[browser]` —
  **Listbox should deliver native scroll events from its fixed root without
  interpreting them as selection or navigation.**
  Give the Listbox an overflowing authored size and `onScroll`, scroll it by
  user input and code, and observe the handler plus collection state. Assert
  each native event reaches the root with that div as `currentTarget`, while
  focus, current tab stop, controlled selection, and `onChange` remain
  unchanged. This ports React Aria Components `ListBox.test.js` “should support
  onScroll” and proves native event pass-through on the actual host.

### Native authored groups

- [x] `LB-GROUP-01` `[vendor]` `[browser]` —
  **Listbox should preserve native group roles and accessible labels around nested Options.**
  Render one `div[role=group][aria-label="Warm colors"]` and another named by
  `aria-labelledby`, each containing Options plus headings and decorative
  content. Assert both native regions and names remain unchanged, every nested
  Option retains `role=option`, and no public Group wrapper or extra
  registration host appears; this ports React Aria's named-section semantics
  onto ordinary authored markup.
- [x] `LB-GROUP-02` `[convergence]` `[browser:all]` —
  **Listbox should flatten grouped and ungrouped Options in current composed DOM order for keyboard navigation.**
  Interleave top-level `alpha`, grouped `bravo/charlie`, a nested-group
  `delta`, and top-level `echo`, with `charlie` disabled, then use Tab, arrows,
  Home, and End in both directions. Assert one roving tab stop and focus order
  `alpha, bravo, delta, echo` with wrapping and disabled skip, while group
  containers/headings never receive focus or change selection; authored
  hierarchy must not partition one listbox.
- [x] `LB-GROUP-03` `[vendor]` `[browser]` —
  **Listbox typeahead should cross native group boundaries while excluding group labels and non-options.**
  Name a group `Zulu region`, place `Apple` and `Zulu option` in different
  groups, add decorative text `Bravo`, and type `z`, `b`, and repeated `a`
  prefixes. Assert typeahead focuses only enabled Options by current
  `textValue` or meaningful option text, wraps across groups, never matches a
  group label/decorative node, and emits no `onChange`; this preserves one
  searchable option collection.
- [x] `LB-GROUP-04` `[reference]` `[browser]` —
  **Listbox should recompute flattened order when Options move between native groups.**
  Focus and select `bravo`, then insert a group, move `bravo` into it, reorder
  the groups, remove its preceding Option, and press ArrowUp after each
  rerender. Assert focus and controlled selection follow value identity,
  navigation follows the latest composed DOM order, removed registrations
  disappear, and no programmatic move fires `onChange`; dynamic grouping
  cannot leave stale collection paths.
- [x] `LB-GROUP-05` `[reference]` `[browser]` —
  **Listbox should ignore empty, disabled-looking, and deeply nested group markup when deriving option state.**
  Render empty groups, nested groups with consumer `aria-disabled`, and
  non-option interactive content around enabled and disabled Options, then
  navigate and typeahead from the Listbox. Assert only each Option's own
  disabled/value/text state controls registration, group attributes are
  preserved but not inherited, and non-options are excluded; native region
  semantics must not silently rewrite widget policy.
- [x] `LB-GROUP-06` `[reference]` `[browser]` —
  **Virtual Listbox should keep logical position metadata independent of authored group depth.**
  Mount virtual indices 20–23 across two nested native groups within a
  50-item adapter, then reorder only the group DOM while retaining logical
  indices. Assert group labels remain, each Option still reports
  `aria-setsize="50"` and its index-derived `aria-posinset`, and navigation
  follows the logical virtual adapter rather than group position; windowed
  metadata has a different authority from authored regions.

### Controlled single selection

- [x] `LB-SINGLE-01` `[vendor]` `[browser:all]` —
  **Listbox should request one single selection when an enabled option is clicked.**
  Render controlled value `alpha`, click enabled unselected option `bravo`
  with the primary mouse button, and leave the parent value unchanged. Assert
  one `onChange("bravo")`, DOM focus on `bravo`, and unchanged selected ARIA on
  `alpha`; this separates a request from controlled mutation in every browser.
- [x] `LB-SINGLE-02` `[vendor]` `[browser:all]` —
  **Listbox should request one single selection when Space activates the focused option.**
  Render controlled value `alpha`, focus enabled `bravo`, and press Space once.
  Assert one `onChange("bravo")`, focus remains on `bravo`, the page does not
  scroll, and controlled ARIA remains on `alpha` until rerender; this ports the
  keyboard selection path independently of pointer behavior.
- [x] `LB-SINGLE-03` `[vendor]` `[browser:all]` —
  **Listbox should request the same single selection when Enter activates an option.**
  Render controlled value `alpha`, focus `bravo`, and press Enter once. Assert
  exactly one `onChange("bravo")`, focus remains on `bravo`, and no synthetic
  click creates a second request; Space and Enter must share one activation
  authority.
- [x] `LB-SINGLE-04` `[reference]` `[browser]` —
  **Listbox should not select merely because arrows or typeahead move focus.**
  Render controlled value `alpha`, focus it, press ArrowDown, then type `c` to
  focus `charlie`. Assert DOM focus moves in collection order, `onChange`
  remains uncalled, and only `alpha` stays selected; standalone roving focus is
  not implicit selection.
- [x] `LB-SINGLE-05` `[reference]` `[browser]` —
  **Listbox should treat activation of the already-selected option as a no-op.**
  Render controlled value `alpha`, focus `alpha`, and activate it by click,
  Space, and Enter in separate runs. Assert no `onChange` call, no clearing
  request, stable `aria-selected="true"`, and stable focus; single selection is
  idempotent.
- [x] `LB-SINGLE-06` `[reference]` `[browser]` —
  **Listbox should preserve controlled selection when its parent rejects a request.**
  Render value `alpha`, click `bravo`, and have `onChange` log without updating
  the prop. Assert focus may move to `bravo` but `alpha` remains selected,
  `bravo` remains unselected, and only one request is logged; callbacks cannot
  become a shadow selection store.
- [x] `LB-SINGLE-07` `[vendor]` `[browser]` —
  **Listbox should adopt a programmatically selected mounted option without emitting a request.**
  Render value `alpha`, move focus outside, rerender with value `charlie`, and
  Tab back into the Listbox. Assert ARIA/data selection moves to `charlie`,
  `onChange` is silent, and `charlie` is the sole preferred tab-entry option;
  external state updates must preserve value identity.
- [x] `LB-SINGLE-08` `[reference]` `[browser]` —
  **Listbox should let consumer handlers cancel option selection before its default runs.**
  Attach logging `onClick` and `onKeyDown` handlers that call
  `preventDefault()`, then click and press Enter on unselected `bravo`. Assert
  each consumer log occurs first, `onChange` is never called, focus/controlled
  ARIA remain coherent, and only the documented Listbox default is canceled.

### Controlled multiple selection

- [x] `LB-MULTI-01` `[vendor]` `[browser]` —
  **Listbox should append an activated unselected value in multiple mode.**
  Render controlled values `["alpha"]` and activate unselected `charlie` by
  pointer or keyboard. Assert one `onChange(["alpha", "charlie"])`, focus on
  `charlie`, and unchanged controlled selected ARIA until rerender; this ports
  toggle-selection without an internal set.
- [x] `LB-MULTI-02` `[vendor]` `[browser]` —
  **Listbox should remove only the activated selected value in multiple mode.**
  Render controlled values `["alpha", "charlie"]` and activate selected
  `alpha`. Assert one `onChange(["charlie"])`, no request involving unrelated
  values, focus on `alpha`, and unchanged controlled ARIA until the parent
  updates; multiple toggling must be surgical.
- [x] `LB-MULTI-03` `[reference]` `[browser]` —
  **Listbox should emit a deterministic deduplicated multiple-selection array.**
  Render logical order `alpha, bravo, charlie` with incoming controlled values
  `["unknown-2", "charlie", "alpha", "charlie", "unknown-1"]`, then activate
  `bravo`. Assert the request orders known values as
  `["alpha", "bravo", "charlie"]` and appends unknown values as
  `["unknown-2", "unknown-1"]`; this preserves collection order without
  deleting application-owned state.
- [x] `LB-MULTI-04` `[reference]` `[browser]` —
  **Listbox should keep multiple selection unchanged during every focus-only movement.**
  Render values `["alpha", "charlie"]`, then use arrows, Home, End, and
  typeahead to traverse all enabled options. Assert focus follows each command
  while `onChange` stays silent and selected ARIA remains on exactly those two
  values; navigation and selection are independent policies.
- [x] `LB-MULTI-05` `[reference]` `[browser]` —
  **Listbox should not invent range or select-all behavior for modifier keys.**
  Render five options with `["bravo"]`, then press Shift+ArrowDown,
  Control/Meta+ArrowDown, Shift+Home/End, and platform Mod+A. Assert no range,
  select-all, replacement, or extension request and no changed selection ARIA;
  the intentionally small API must not inherit vendor-only extended selection.
- [x] `LB-MULTI-06` `[reference]` `[browser]` —
  **Listbox should keep multiple selection fully controlled across rejection and programmatic updates.**
  Start with `["alpha"]`, ignore an activation request for `bravo`, then
  programmatically rerender with `["charlie"]`. Assert the rejected request
  never changes ARIA, the rerender updates it without firing `onChange`, and
  focus remains independently stable; array state follows the same authority
  rule as single mode.
- [x] `LB-MULTI-07` `[reference]` `[browser]` —
  **Listbox should retain controlled disabled and unmounted values without activating them.**
  Supply `["disabled", "offscreen"]` while only a disabled `disabled` option
  and enabled mounted options render, then attempt every activation modality.
  Assert application values are not normalized away, the disabled option stays
  selected-but-noninteractive, and no hidden option is created for
  `offscreen`; collection visibility does not own parent state.
- [x] `LB-MULTI-08` `[reference]` `[browser]` —
  **Listbox should default omitted multiple value to a controlled empty array.**
  Set `selection="multiple"` without `value`, activate `alpha`, and ignore the
  callback. Assert one `onChange(["alpha"])` request but no selected ARIA/data
  state after the action; an omitted value is deterministic empty state, not
  an uncontrolled mode.

### Keyboard, orientation, and typeahead integration

- [x] `LB-KEY-01` `[vendor]` `[browser:all]` —
  **Vertical Listbox should integrate complete roving navigation without selecting.**
  Render `alpha`, disabled `bravo`, and `charlie` vertically, then Tab in and
  exercise Up, Down, Home, End, and boundary wrapping. Assert one
  `tabindex="0"`, disabled skip, expected DOM focus after each key, and no
  `onChange`; this ports the vendor vertical keyboard matrix through the
  RovingFocus owner.
- [x] `LB-KEY-02` `[vendor]` `[browser:all]` —
  **Horizontal LTR Listbox should move with Left and Right while preserving native vertical keys.**
  Render a horizontal LTR fixture, focus the middle option, and press Left,
  Right, Up, and Down. Assert Left/Right move and wrap among enabled options,
  Up/Down leave focus and `defaultPrevented` unchanged, and no selection
  request occurs; orientation must not capture the cross axis.
- [x] `LB-KEY-03` `[vendor]` `[rtl]` —
  **Horizontal RTL Listbox should reverse its Left and Right movement.**
  Place the same horizontal fixture under `dir=rtl`, focus the middle option,
  and press Left then Right before dynamically switching to LTR. Assert RTL
  Left moves to the next visual/logical option and Right to the previous, with
  the next key honoring the new direction and no selection request.
- [x] `LB-KEY-04` `[vendor]` `[browser]` —
  **Listbox typeahead should wrap to the next enabled matching option without selecting it.**
  Render `Apple`, disabled `Apricot`, `Avocado`, and `Banana`, focus `Apple`,
  and type `a` repeatedly across the boundary. Assert DOM focus cycles only
  through enabled A matches, wraps to `Apple`, and leaves controlled selection
  and `onChange` untouched; this ports the vendor type-select behavior.
- [x] `LB-KEY-05` `[vendor]` `[browser]` —
  **Listbox should treat Space as typeahead text only while a search buffer is active.**
  Focus an option, type a printable prefix followed immediately by Space, then
  wait beyond the documented buffer timeout and press Space again. Assert the
  first Space extends/no-matches the search without selecting or scrolling,
  while the later Space emits exactly one selection request for the focused
  option; this guards the capture-phase typeahead regression.
- [x] `LB-KEY-06` `[reference]` `[browser]` —
  **Listbox should leave unsupported navigation keys and modifiers to the browser or application.**
  Focus the middle option and press Escape, Tab, PageUp, PageDown, Alt+Arrow,
  and unsupported Control/Meta combinations in separate fixtures. Assert
  Listbox emits no selection request, does not repurpose page or Escape keys,
  and allows native Tab movement; this prevents accidental growth into an
  extended-selection widget.
- [x] `LB-KEY-07` `[reference]` `[browser]` —
  **Listbox should ignore composite keyboard commands originating in interactive descendants.**
  Put an input and button inside an option, focus each descendant, and type
  text plus ArrowDown, Home, Space, and Enter. Assert native editing/button
  behavior remains available, option focus and selection do not change, and
  `onChange` stays silent; descendants retain ownership of their keystrokes.

### Pointer, touch, and disabled behavior

- [x] `LB-POINTER-01` `[vendor]` `[browser:all]` —
  **Listbox should issue one request for a primary mouse press without duplicating it on release.**
  Press the primary button on unselected `bravo`, drag outside its bounds, and
  release, then repeat a clean click in a fresh fixture. Assert exactly one
  `onChange("bravo")` at primary press in either path, no release-time
  duplicate after dragging away, and coherent focus; this ports the vendor
  press-down/drag regression.
- [x] `LB-POINTER-02` `[convergence]` `[touch]` —
  **Listbox should select once from direct touch activation without a hover prerequisite.**
  In a fresh controlled fixture, tap unselected `bravo` without first moving
  pointer or keyboard focus over it. Assert one `onChange("bravo")`, no
  synthetic mouse duplicate, and no required hover state; touch must not
  inherit desktop hover sequencing.
- [x] `LB-POINTER-03` `[reference]` `[browser]` —
  **Listbox should leave focus and selection unchanged when an option is only hovered.**
  Focus `alpha`, move a mouse and then a pen over `bravo`, and leave the
  Listbox without pressing. Assert DOM focus and the sole tab stop remain on
  `alpha`, `onChange` is uncalled, and selected ARIA is unchanged; hover is
  styling input rather than collection state.
- [x] `LB-POINTER-04` `[vendor]` `[browser]` —
  **Disabled Listbox options should remain inert across all input modalities while preserving authored props.**
  Give disabled `bravo` a class, style, `data-*`, and consumer handlers, then
  target it with mouse, touch, Enter, Space, arrows, and typeahead. Assert its
  non-interaction props remain in the DOM while no consumer activation,
  `onChange`, focus, or selected-state mutation occurs; disabled semantics must
  not strip unrelated authoring output.

### Dynamic collections

- [x] `LB-DYNAMIC-01` `[vendor]` `[browser]` —
  **Listbox should follow option identity through insertion and reorder while navigating current order.**
  Render `alpha, bravo, charlie` with `bravo` focused and selected, insert
  `delta` before it, then reorder `charlie` ahead of `bravo` and press
  ArrowUp. Assert selection and focus stay with value `bravo` through
  rerenders, while the key moves to its new previous neighbor `charlie`; this
  ports the dynamic-collection identity regression.
- [x] `LB-DYNAMIC-02` `[reference]` `[browser]` —
  **Listbox should recover deterministically when its focused option is removed.**
  Focus `bravo` in `alpha, bravo, disabled-charlie, delta`, remove `bravo`,
  and repeat with no following enabled option. Assert focus and
  `tabindex="0"` move first to nearest enabled `delta`, otherwise to previous
  `alpha`, with no selection request; removal must not strand focus on
  detached DOM.
- [x] `LB-DYNAMIC-03` `[reference]` `[browser]` —
  **Listbox should not correct a controlled value when its selected option is removed.**
  Render value `bravo`, remove the `bravo` Option while focus is elsewhere,
  and later mount it again. Assert `onChange` never fires, no remaining option
  becomes selected, and remounted `bravo` immediately regains selected ARIA;
  collection membership cannot rewrite application state.
- [x] `LB-DYNAMIC-04` `[vendor]` `[browser]` —
  **Listbox should remove a newly disabled option from navigation without clearing controlled selection.**
  Focus and select `bravo`, rerender it as disabled, then press ArrowDown and
  attempt pointer activation. Assert `bravo` gains disabled state and loses
  the tab stop immediately, focus recovers to an enabled neighbor, controlled
  selected state remains, and no corrective `onChange` fires.
- [x] `LB-DYNAMIC-05` `[reference]` `[browser]` —
  **Listbox should replace an option registration when its value changes.**
  Render an Option as `bravo`, rerender the same React position as `delta`,
  then navigate, select, and finally collide it with another `delta`. Assert
  old value/ARIA registration disappears, requests use only `"delta"`, and
  duplicate validation reruns with a descriptive error; stale identities must
  not survive prop changes.
- [x] `LB-DYNAMIC-06` `[vendor]` `[browser]` —
  **Listbox should use current option labels and text values after descendants rerender.**
  Render value `alpha` with label `Apple` and no `textValue`, change the
  rendered label to `Zulu`, then set `textValue="Bravo"` and type each old and
  new prefix. Assert typeahead ignores stale `Apple`, follows `Zulu`, then
  follows explicit `Bravo`, while accessible text and selection remain
  correct; this ports React Aria's “update collection if render function
  changes” regression.

### Virtualized collection

- [x] `LB-VIRT-01` `[vendor]` `[unit]` —
  **Virtual Listbox should reject inconsistent logical and mounted registrations.**
  Build ten logical items and validate duplicate values, negative/out-of-range
  mounted indices, duplicate indices, and mounted value or disabled-state
  mismatches. Assert every invalid fixture returns a descriptive diagnostic
  while a unique zero-based mapping succeeds; logical identity must be trusted
  before focus can cross an unmounted window.
- [x] `LB-VIRT-02` `[vendor]` `[browser]` —
  **Virtual Listbox options should expose position metadata for the complete logical set.**
  Supply 50 logical items while mounting indices 20 through 25 in DOM order,
  then inspect every mounted Option. Assert `aria-setsize="50"` and
  `aria-posinset` values `21` through `26` regardless of the first DOM child;
  this ports React Aria's virtualizer set-metadata regression for assistive
  technologies.
- [x] `LB-VIRT-03` `[reference]` `[browser]` —
  **Virtual Listbox should scroll before focusing the next unmounted logical option.**
  Mount indices 0 through 4 with index 4 focused, keep index 5 enabled but
  unmounted, and press ArrowDown. Assert exactly one `scrollToIndex(5)`, no
  detached/stale focus or premature active exposure, then focus on index 5
  only after the parent mounts it; mount timing is part of the virtual-focus
  contract.
- [x] `LB-VIRT-04` `[reference]` `[browser]` —
  **Virtual Listbox should make Home and End target logical boundaries outside the window.**
  Mount middle indices 20 through 25 with disabled logical items at 0 and 49,
  then press Home and End in separate runs. Assert one scroll request to the
  first/last enabled logical indices 1 and 48, followed by DOM focus only after
  each target mounts and no selection request; boundaries belong to the full
  collection.
- [x] `LB-VIRT-05` `[reference]` `[browser]` —
  **Virtual Listbox typeahead should resolve and mount an offscreen logical match before focusing it.**
  Mount indices 0 through 4 while logical index 37 has text `Zulu`, focus
  index 1, and type `z`. Assert one `scrollToIndex(37)`, no focus or selection
  on an absent node, then focus index 37 after mount with `onChange` silent;
  typeahead cannot be limited to rendered rows.
- [x] `LB-VIRT-06` `[convergence]` `[browser]` —
  **Virtual Listbox should coalesce rapid navigation while a requested window is rendering.**
  From focused index 4, press ArrowDown three times before the parent fulfills
  the first scroll request, then mount the final requested window. Assert a
  deterministic latest target, no focus on stale intermediate indices, no
  duplicate callback for the same index, and exactly one mounted tab stop;
  asynchronous windows must not reorder key intent.
- [x] `LB-VIRT-07` `[reference]` `[browser]` —
  **Virtual Listbox should preserve an offscreen controlled selection until its option mounts.**
  Set controlled value to logical index 37 while only indices 0 through 4
  render, then scroll and mount index 37 programmatically. Assert no hidden
  option or `onChange` before mount and immediate selected ARIA/data state on
  the real mounted option; windowing cannot normalize controlled state.
- [x] `LB-VIRT-08` `[reference]` `[browser:all]` —
  **Virtual Listbox should preserve logical metadata and active visibility through resize and variable row heights.**
  Focus a mounted logical item in a variable-height window, resize the
  viewport so that item leaves view, and let the application recalculate the
  window. Assert stable `aria-posinset`/`aria-setsize`, the same logical active
  value, and a scroll request that returns its real element to view without
  page scrolling; geometry changes must not corrupt identity.
- [x] `LB-VIRT-09` `[reference]` `[browser]` —
  **Virtual Listbox should atomically replace logical metadata and its scroll callback.**
  Reorder/replace the logical items and `scrollToIndex` function while a
  window is mounted, first introducing duplicate and mismatched registrations
  and then fixing them before navigation/typeahead. Assert descriptive
  diagnostics for invalid mappings and that the next command consults only
  the newest order and callback, never a stale closure.
- [x] `LB-VIRT-10` `[vendor]` `[browser]` —
  **Virtual Listbox should cancel an unresolved focus target when it unmounts
  during scroll-to-index work.**
  Navigate toward an unmounted logical item so `scrollToIndex` schedules an
  application window update, then unmount Listbox before that update or the
  virtualizer's animation frame completes. Assert no detached focus call,
  callback, warning, or late registration occurs, all pending intent is
  discarded, and a separately mounted Listbox remains unaffected. This adapts
  TanStack Virtual `index.test.ts` “should not throw when component unmounts
  during scrollToIndex rAF loop” to the public adapter boundary.

### Combobox adapter and environments

- [x] `LB-CB-01` `[reference]` `[browser]` —
  **Listbox should switch to Combobox virtual focus without changing option selection semantics.**
  Open an editable Combobox over a mounted Listbox, focus its input, and move
  from `alpha` to `bravo` before committing. Assert no Option has a DOM tab
  stop or receives focus, the input's `aria-activedescendant` tracks the real
  option ID, and commit produces the same scalar value once; Combobox owns
  focus while Listbox still owns option semantics.
- [x] `LB-CB-02` `[reference]` `[browser]` —
  **Listbox should withhold an active descendant until a virtual Combobox option mounts.**
  In a windowed Combobox Listbox, navigate from mounted index 4 toward
  unmounted index 5 and delay the window update. Assert `scrollToIndex(5)`
  occurs first, the focused input never references an absent ID, and only
  after index 5 mounts does `aria-activedescendant` expose its stable ID; this
  protects assistive technology from broken references.
- [x] `LB-CB-03` `[reference]` `[browser]` —
  **Listbox should yield commit callback authority to its containing Combobox.**
  Compose a scalar Combobox with a Listbox, activate `bravo`, and test both the
  valid no-Listbox-callback shape and an invalid nested `onChange`. Assert the
  valid shape calls only Combobox `onChange("bravo")` once, while the invalid
  shape emits a descriptive two-authority diagnostic and invokes neither
  callback in parallel; one action must have one state owner.
- [x] `LB-CB-04` `[reference]` `[browser]` —
  **Listbox should publish local active styling state when Combobox virtually
  focuses one mounted Option.**
  Keep controlled selection on `alpha`, move keyboard and pointer activity to
  mounted `bravo`, then clear or move activity and unmount that option. Assert
  only the real option named by `aria-activedescendant` has `data-active`,
  `alpha` independently retains selected ARIA/data, no Option gains a tab stop,
  and stale active data clears in the same commit as the source reference.
  Applications must be able to style preview without creating a second active
  state owner.
- [x] `LB-ENV-01` `[reference]` `[ssr]` —
  **Listbox should hydrate stable roles, selection, and IDs without requesting state.**
  Server-render a selected and disabled Listbox, hydrate it, and then Tab into
  the first enabled option. Assert byte-stable role/ARIA relationships, no
  duplicate or changed IDs, no hydration warning, and no `onChange`; server
  setup cannot masquerade as interaction.
- [x] `LB-ENV-02` `[reference]` `[react:all]` —
  **Listbox should register and request exactly once across React versions and StrictMode.**
  Mount the same three-option controlled fixture under StrictMode in React 17,
  18, and 19, then activate and dynamically remove one option. Assert one
  live registration per value, one `onChange` for the action, no stale option
  after removal, and no ref/render loop; effect replay must stay invisible.
- [x] `LB-ENV-03` `[reference]` `[shadow]` —
  **Listbox should preserve roving, typeahead, and virtual scrolling inside a ShadowRoot.**
  Mount standalone and windowed fixtures in an open ShadowRoot, then Tab,
  arrow, type a prefix, and navigate beyond the window. Assert composed active
  element discovery, correct option focus, one current `scrollToIndex`, and no
  stale light-DOM lookup; the collection must use its owning root.
- [x] `LB-A11Y-01` `[reference]` `[browser]` —
  **Listbox should pass accessibility checks across every frozen semantic shape.**
  Render named single, multiple, disabled, empty, horizontal, and virtualized
  fixtures and run the configured accessibility scanner after their relevant
  state changes. Assert no violations plus the case-specific roles, names,
  states, and relationships; automated checks supplement rather than replace
  focus and callback assertions.

## Composition gates

- [x] `LB-COMP-01` `[reference]` `[browser]` —
  **Standalone Listbox should support a complete controlled single-select composition.**
  Build a labeled vertical list with enabled, disabled, initially selected,
  and dynamically removed options, then exercise Tab, arrows, typeahead,
  pointer, Space, and Enter. Assert one tab stop, controlled ARIA, exact
  callback requests, deterministic focus recovery, and no popup or form
  markup; this proves the primitive works without Combobox.
- [x] `LB-COMP-02` `[reference]` `[browser]` `[rtl]` —
  **Standalone Listbox should support controlled multiple selection in horizontal RTL.**
  Build a horizontal `dir=rtl` list with two controlled selections and a
  disabled middle option, then use mirrored arrows, pointer, Space, and
  unsupported range modifiers. Assert current-order toggle arrays, stable
  selected ARIA, disabled skip, RTL focus movement, and no undocumented
  select-all/range behavior.
- [x] `LB-COMP-03` `[reference]` `[browser]` —
  **Windowed Listbox should coordinate logical navigation with an application virtualizer.**
  Supply 100 logical items, mount a variable-height middle window, and use
  arrows, Home/End, typeahead, resize, reorder, and programmatic selection.
  Assert accurate set metadata, current callback/index requests, focus only on
  mounted targets, preserved offscreen selection, and no stale IDs; this is the
  virtualization freeze gate.
- [x] `LB-COMP-04` `[reference]` `[browser]` —
  **Grouped Listbox should preserve authored regions while behaving as one flattened option collection.**
  Compose labeled and nested native `role=group` regions with top-level,
  disabled, selected, and dynamically moved Options, then exercise every
  navigation, typeahead, pointer, and controlled-selection path. Assert group
  names/DOM remain authored, option focus follows composed order, selection
  follows value identity, and non-options never enter the widget; no
  `Listbox.Group` component is required.

## Owned elsewhere

- Generic movement and typeahead algorithms: `RovingFocus`.
- Focus staying in an input and active-descendant commit/revert: `Combobox`.
- Popup positioning/available height: `Popover`.

## Out of scope

- Range selection, select-all, drag/drop, load-more, links, actions, or a
  public Virtualizer.
- React Spectrum Components `ListBox.test.js` long-press touch selection and
  drag/drop suites remain in those omitted interaction models. Its grid
  boundary/no-throw regressions are assigned to `RF-GRID-*`, because visual
  two-dimensional movement is owned by `RovingFocus`.
- A public Listbox Group/Section wrapper; grouping uses ordinary authored
  `div[role=group]` regions.
- Popup chrome or Radix Select's overlay runtime.
