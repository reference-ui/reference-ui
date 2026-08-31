# RovingFocus test contract

Playwright: `matrix/lib/tests/e2e/roving-focus.spec.ts`  
Unit: `matrix/lib/tests/unit/roving-focus.test.ts`
Page: `/roving-focus`

RovingFocus owns the composite keyboard kernel. Root and Item are transparent;
Item slots `tabIndex`, focus, and keyboard behavior onto its one child.

For `orientation="both"`, rows and columns are the rendered visual geometry:
Up/Down choose the nearest enabled item in the adjacent visual row, and
Left/Right move within the row. This keeps the public API layout-agnostic and
makes CSS reflow observable.

Omitted behavior means horizontal orientation, no boundary loop, and
typeahead off.

## Source evidence

- `vendor/radix-primitives/packages/react/roving-focus/src/roving-focus-group.tsx`
  — one tab stop, orientation, loop, disabled skip, RTL, focus entry.
- `vendor/radix-primitives/packages/react/accordion/src/accordion.test.tsx` —
  next/previous/Home/End ordering evidence only; Accordion is a negative
  composition because its headers remain separate native Tab stops.
- `vendor/react-spectrum/packages/react-aria/src/selection/useTypeSelect.ts` and
  `ListKeyboardDelegate.ts`, plus React Aria Components `ListBox.test.js` grid
  boundary regressions — typeahead, capture-phase Space, safe boundary
  termination, and grid navigation.
- `vendor/ariakit/packages/ariakit-components/src/composite/composite-store.test.ts`
  and `ariakit-react-components/src/composite/composite-typeahead.tsx` —
  two-dimensional and Unicode-aware composite behavior.

## Required cases

### Public type and anatomy

- [x] `RF-API-01` `[reference]` `[unit]` —
  **RovingFocus should expose strict Root and Item intersections when both parts extend `ReferenceSlotPartProps`.**
  Compile Root and Item with representative StyleProps, exactly one React
  element, and their documented orientation, loop, typeahead, disabled, and
  `textValue` options. Assert that omitted, `null`, `false`, text, number,
  array, and invalid-orientation children/values fail type checking without
  repeating universal PART rendering or ref conformance.

### Transparent DOM and registration

- [x] `RF-DOM-01` `[reference]` `[browser]` —
  **RovingFocus should preserve authored container and item tags when Root and Item are transparent.**
  Render Root around an application `<div role="toolbar">` containing Items
  whose children are a button and a link. Assert that those exact authored
  tags and relationships remain, with no Root host or Item wrapper in the DOM.
- [x] `RF-DOM-02` `[reference]` `[browser]` —
  **RovingFocus should combine Item behavior with `ReferenceSlotPartProps` when an Item augments its single child.**
  Give Item one token-aware StyleProp, a consumer handler and ref, and a native
  button child, then move roving focus to and activate it. Assert the generated
  style, authoritative `tabIndex`, handler call, and ref share that one native
  node; the full merge and universal StyleProps matrices remain owned by Slot
  and PART conformance.
- [x] `RF-DOM-03` `[reference]` `[browser]` —
  **RovingFocus should render an empty composite safely when Root has no Items.**
  Mount a marked authored container beneath Root with an empty collection and
  press Tab and arrow keys around it. Assert no synthetic tab stop or item,
  unchanged authored DOM, no focus capture, and no exception.
- [x] `RF-DOM-04` `[reference]` `[browser]` —
  **RovingFocus should track current DOM order when keyed Items are inserted, reordered, or removed.**
  Start with keyed items A, B, and C, then insert D, reorder the nodes, and
  remove B before using next/previous navigation. Assert focus and
  `tabIndex=0` follow each current DOM order exactly, with no removed or stale
  node selected.
- [x] `RF-DOM-05` `[reference]` `[react:all]` —
  **RovingFocus should register each mounted Item once when StrictMode and ref-driven rerenders replay work.**
  Mount keyed Items under StrictMode with a callback ref that schedules one
  state update, then navigate across the collection. Assert a finite settled
  render count, one effective registration per mounted node, one sole tab
  stop, and no duplicate navigation target.
- [x] `RF-DOM-06` `[reference]` `[browser]` —
  **RovingFocus should reject invalid transparent child shapes when Root or Item cannot augment one element.**
  Bypass type checking to render Root or Item with an omitted, `null`, `false`,
  text, number, nonempty Fragment, or multiple-element child while behavior is
  enabled. Assert a descriptive single-element anatomy error, no partial DOM
  or stale Item registration, and no silent loss of StyleProps or keyboard
  behavior.

### One tab stop and focus entry

- [x] `RF-TAB-01` `[vendor]` `[browser:all]` —
  **RovingFocus should expose one initial tab stop when enabled and hidden Items are mixed.**
  First-render a collection whose leading entries are disabled or hidden,
  followed by two enabled visible Items. Assert that only the first enabled
  visible child has `tabIndex=0` and every other registered child has
  `tabIndex=-1`.
- [x] `RF-TAB-02` `[vendor]` `[browser]` —
  **RovingFocus should enter and leave through the current Item when Tab moves forward.**
  Place native controls before and after the composite, press Tab from the
  preceding control, then press Tab again from the focused current Item.
  Assert focus first lands on the sole `tabIndex=0` child and then reaches the
  following control through ordinary browser Tab behavior.
- [x] `RF-TAB-03` `[vendor]` `[browser]` —
  **RovingFocus should enter and leave through the current Item when Shift+Tab moves backward.**
  Focus a native control after the composite, press Shift+Tab, and press
  Shift+Tab again from the current Item. Assert focus first lands on the sole
  current child and then reaches the preceding control without an internal
  focus loop.
- [x] `RF-TAB-04` `[convergence]` `[browser]` —
  **RovingFocus should remember a newly focused Item when focus or a pointer press changes the current child.**
  Move focus from initial item A to item C once by `.focus()` and once by real
  pointer press, then Tab out and back in. Assert C becomes the only
  `tabIndex=0` item after either action and receives focus again on re-entry.
- [x] `RF-TAB-05` `[reference]` `[browser]` —
  **RovingFocus should preserve its current Item when unrelated rerenders keep the collection nodes.**
  Make item B current, rerender Root and Items because unrelated parent state
  changes, and retain all keys and native nodes. Assert B remains focused when
  applicable and remains the sole `tabIndex=0` item, with no reset to the
  first item.
- [x] `RF-TAB-06` `[convergence]` `[browser]` —
  **RovingFocus should choose the nearest valid Item when the current Item becomes unavailable.**
  In separate runs, disable, hide, or remove current item B from A-B-C and
  inspect the settled tab stops. Assert C becomes the sole `tabIndex=0` target
  when available, otherwise A does, with no stale stop left on B.
- [x] `RF-TAB-07` `[reference]` `[browser]` —
  **RovingFocus should expose no tab stop when every Item is disabled or hidden.**
  Disable or hide all registered items after one was current, then send
  arrows, Home, End, and printable keys to the authored container. Assert no
  child has `tabIndex=0`, focus does not move into an unavailable item, and no
  handler throws.
- [x] `RF-TAB-08` `[reference]` `[browser]` —
  **RovingFocus should remain authoritative when consumers put conflicting `tabIndex` values on Items.**
  Give several Item children consumer `tabIndex` values including `0`, `2`,
  and `-1`, then change the current item through navigation. Assert exactly
  one rendered `tabIndex=0` at every step and `-1` on every other registered
  item, regardless of consumer values.

### One-dimensional keys

- [x] `RF-KEY-01` `[vendor]` `[browser]` —
  **RovingFocus should use horizontal LTR arrow semantics when orientation is horizontal.**
  Focus the middle Item in an LTR horizontal collection and press Right,
  Left, Up, and Down in separate resets while logging `defaultPrevented`.
  Assert Right focuses next, Left focuses previous, and Up/Down leave focus
  and default handling untouched.
- [x] `RF-KEY-02` `[vendor]` `[rtl]` —
  **RovingFocus should reverse horizontal arrows when the horizontal composite inherits RTL direction.**
  Focus the middle Item beneath `dir="rtl"` and press Left, Right, Up, and
  Down in separate resets. Assert Left focuses the next DOM item, Right the
  previous, and Up/Down remain unconsumed with focus unchanged.
- [x] `RF-KEY-03` `[vendor]` `[browser]` —
  **RovingFocus should use only vertical arrows when orientation is vertical.**
  Focus the middle Item in both LTR and RTL vertical fixtures, then press Down,
  Up, Left, and Right separately. Assert Down focuses next and Up previous in
  both directions, while Left/Right do not prevent default or move focus.
- [x] `RF-KEY-04` `[vendor]` `[browser]` —
  **RovingFocus should target collection endpoints when Home or End is pressed in any orientation.**
  In horizontal, vertical, and both-orientation fixtures containing disabled
  and hidden edge items, press Home and End from a middle Item. Assert focus
  and sole `tabIndex=0` move to the first and last enabled visible Items in the
  whole current collection.
- [x] `RF-KEY-05` `[vendor]` `[browser]` —
  **RovingFocus should keep focus at one-dimensional boundaries when looping is false.**
  With `loop={false}`, press the previous-direction arrow on the first valid
  Item and the next-direction arrow on the last valid Item. Assert focus and
  the sole tab stop remain on the boundary item with no wrap or extra callback.
- [x] `RF-KEY-06` `[vendor]` `[browser]` —
  **RovingFocus should wrap across one-dimensional boundaries when looping is true.**
  With `loop={true}`, press the next-direction arrow from the last valid Item
  and the previous-direction arrow from the first valid Item. Assert focus and
  `tabIndex=0` wrap to first and last respectively, skipping unavailable
  entries.
- [x] `RF-KEY-07` `[vendor]` `[browser]` —
  **RovingFocus should skip unavailable Items when arrows, Home, or End choose a destination.**
  Place runs of disabled, hidden, and conditionally unrendered items between
  enabled Items and at both collection edges. Assert each navigation key
  lands on the appropriate enabled visible node in current DOM order and
  never focuses or makes an unavailable node current.
- [x] `RF-KEY-08` `[reference]` `[browser]` —
  **RovingFocus should honor consumer cancellation when an Item key handler runs before internal movement.**
  First have the focused Item's key handler call `preventDefault()`, then in a
  separate run call only `stopPropagation()`, and press a supported arrow.
  Assert consumer-first order, no movement for prevention, and normal local
  movement for propagation stopping despite no ancestor event.
- [x] `RF-KEY-09` `[reference]` `[browser]` —
  **RovingFocus should preserve application shortcuts when navigation keys carry Alt, Meta, or Control.**
  Focus a middle Item and press every supported arrow plus Home and End with
  each modifier in turn. Assert focus and tab-stop state remain unchanged,
  `defaultPrevented` stays false, and the consumer handler receives every
  modified key.
- [x] `RF-KEY-10` `[reference]` `[rtl]` —
  **RovingFocus should use the latest inherited direction when `dir` changes without remounting.**
  Focus item B in an LTR horizontal composite, rerender the ancestor as RTL
  while retaining nodes and keys, and press Left. Assert Left now moves to the
  next DOM item under RTL while node identity and the prior current item were
  preserved until the key.
- [x] `RF-KEY-11` `[reference]` `[browser]` —
  **RovingFocus should use horizontal bounded non-typeahead behavior when optional behavior props are omitted.**
  Omit `orientation`, `loop`, and `typeahead`, focus a boundary Item, and send
  horizontal, vertical, and printable keys. Assert horizontal LTR movement
  within bounds, no wrap at the edge, no vertical movement, and no printable
  key consumption or focus change.
- [x] `RF-KEY-12` `[vendor]` `[browser]` —
  **RovingFocus should send PageUp and PageDown to the first and last enabled
  visible Items without changing ordinary Tab behavior.**
  Focus a middle Item in horizontal, vertical, and both-orientation fixtures
  with unavailable collection edges, then press PageUp and PageDown. Assert
  focus and the sole tab stop move to the same first/last valid destinations
  as Home/End, handled events are prevented once, and an unrelated page scroll
  does not occur. This ports the key map in Radix
  `roving-focus-group.tsx`; consumer components need only policy integration
  cases.

### Two-dimensional geometry

- [x] `RF-GRID-01` `[convergence]` `[browser:all]` —
  **RovingFocus should follow visual rows and columns when `orientation="both"` forms a regular grid.**
  Render nine equal-size Items in a measured 3×3 CSS grid, focus the center,
  and press each arrow from a fresh reset. Assert Left/Right move within its
  rendered row and Up/Down choose the adjacent row's item with the nearest
  horizontal center.
- [x] `RF-GRID-02` `[convergence]` `[browser]` —
  **RovingFocus should choose the nearest horizontal center when vertical movement crosses ragged rows.**
  Render measured rows with unequal cell counts and widths, including two
  equidistant candidates, then press Up and Down from chosen cells. Assert the
  geometrically nearest enabled center wins and an exact tie resolves to the
  earliest candidate in DOM order.
- [x] `RF-GRID-03` `[convergence]` `[browser]` —
  **RovingFocus should skip disabled grid cells when another target exists on the relevant visual row or axis.**
  Disable the direct horizontal and vertical neighbors of a focused cell while
  leaving another valid target in the intended row or direction. Assert each
  arrow chooses the nearest valid target on that axis/adjacent row and does
  not jump to an unrelated row while a valid candidate exists.
- [x] `RF-GRID-04` `[reference]` `[browser]` —
  **RovingFocus should keep grid focus in place when a requested edge has no target and looping is false.**
  Focus cells at missing horizontal and vertical edges in a ragged
  `orientation="both"` layout with `loop={false}` and press outward arrows.
  Assert the active element and sole `tabIndex=0` remain unchanged and no
  unrelated row receives focus.
- [x] `RF-GRID-05` `[reference]` `[browser]` —
  **RovingFocus should wrap within grid geometry when looping is true and an axis reaches its edge.**
  In a ragged grid with `loop={true}`, press horizontally outward at a row
  edge and vertically outward at the top or bottom row. Assert horizontal
  focus wraps to that row's opposite valid edge and vertical focus wraps to
  the opposite edge row's enabled item with the nearest horizontal center.
- [x] `RF-GRID-06` `[reference]` `[rtl]` —
  **RovingFocus should reverse only the horizontal grid axis when the composite inherits RTL.**
  In a measured ragged RTL grid, press all four arrows from a middle cell.
  Assert Left/Right destinations are reversed from LTR while Up/Down still use
  the same visual row geometry and DOM-order tie breaking.
- [x] `RF-GRID-07` `[reference]` `[browser]` —
  **RovingFocus should use current visual geometry when CSS reflow changes row wrapping.**
  Focus a stable keyed Item, resize the container so unchanged nodes wrap into
  different measured rows, and press a vertical arrow without rerendering the
  collection. Assert the destination follows the post-resize rectangles and
  no stale registration order or old-row geometry is used.
- [x] `RF-GRID-08` `[reference]` `[browser]` —
  **RovingFocus should treat Home and End as whole-composite commands when focus is inside a grid.**
  From a middle row in a ragged `orientation="both"` fixture, press Home and
  End with unavailable cells at collection edges. Assert focus and the sole
  tab stop move to the first and last enabled visible Items in global DOM
  order, not merely the current row's endpoints.

### Typeahead

- [x] `RF-TYPE-01` `[reference]` `[browser]` —
  **RovingFocus should leave printable keys and Space untouched when typeahead is false or omitted.**
  In separate omitted and `typeahead={false}` fixtures, focus an Item and type
  a letter and Space while logging keyboard defaults and clicks. Assert no
  focus/tab-stop change, no prevented key, and no typeahead-caused activation.
- [x] `RF-TYPE-02` `[vendor]` `[unit]` —
  **RovingFocus should choose the next case-insensitive prefix match when typeahead receives one printable character.**
  Seed the typeahead model with current item B and labels before and after it,
  including a lowercase match reachable only by wrapping once, then enter
  `"A"`. Assert the next matching item after B wins case-insensitively, one
  wrap is allowed, and search never loops a second time.
- [x] `RF-TYPE-03` `[vendor]` `[unit]` —
  **RovingFocus should build a multi-character prefix when different printable keys arrive consecutively.**
  Enter `"b"` then `"l"` within the timeout against labels such as Banana and
  Blueberry, tracking current target after each key. Assert the buffer becomes
  `"bl"`, focus changes only to a matching prefix, and remains on the prior
  item when no current prefix matches.
- [x] `RF-TYPE-04` `[vendor]` `[unit]` —
  **RovingFocus should cycle same-letter matches when one printable character repeats within the buffer window.**
  Provide several labels beginning with A, make one current, and enter `"a"`
  three times without timing out. Assert successive targets cycle through the
  A-prefixed Items in collection order and the query is treated as `"a"`,
  never the literal prefix `"aaa"`.
- [x] `RF-TYPE-05` `[vendor]` `[unit]` —
  **RovingFocus should start a new search when one second of typeahead inactivity has elapsed.**
  Use deterministic timers to enter `"b"`, advance exactly beyond the
  documented 1000ms idle timeout, and then enter `"a"`. Assert the old buffer
  is cleared, the new query is `"a"` rather than `"ba"`, and the next A match
  becomes current.
- [x] `RF-TYPE-06` `[vendor]` `[browser]` —
  **RovingFocus should treat Space as typeahead input when a nonempty search buffer is active.**
  Focus a native button Item, type a character that starts a buffer, then
  press Space where a label containing that prefix plus a space can match.
  Assert Space is appended and matching runs during capture, focus may move to
  that match, and neither the original nor matched button activates.
- [x] `RF-TYPE-07` `[convergence]` `[unit]` —
  **RovingFocus should match Unicode case and canonically equivalent diacritics when typeahead compares labels.**
  Search mixed-case non-ASCII labels and precomposed/decomposed forms such as
  `É` and `E\u0301` through the configured `Intl.Collator`. Assert equivalent
  prefixes match without ASCII transliteration while genuinely distinct
  locale-sensitive labels remain distinct.
- [x] `RF-TYPE-08` `[vendor]` `[unit]` —
  **RovingFocus should skip unavailable matches when typeahead searches the collection.**
  Place disabled and hidden matching labels before an enabled match, then run
  a second query for which no enabled visible match exists. Assert the first
  search chooses the enabled match and the no-match search preserves the
  current item rather than focusing an unavailable one.
- [x] `RF-TYPE-09` `[reference]` `[browser]` —
  **RovingFocus should use the highest-priority current text source when an Item's searchable label changes.**
  Give one Item conflicting explicit `textValue`, child `aria-label`, and
  rendered text, verify searches use that priority, then remove or change each
  winning source across rerenders. Assert each new winning value becomes
  searchable immediately and every superseded value stops matching.
- [x] `RF-TYPE-10` `[reference]` `[browser]` —
  **RovingFocus should ignore text-entry and shortcut keystrokes when typeahead does not own the input.**
  While typeahead is enabled, send composing/IME key events, Alt/Meta/Control
  shortcuts, and printable keys targeted at an input or contenteditable
  descendant. Assert no buffer update, prevented default, focus/tab-stop
  change, or interference with the editable descendant.
- [x] `RF-TYPE-11` `[reference]` `[browser]` —
  **RovingFocus should search the live collection when a buffered match is disabled or unmounted.**
  Start a prefix buffer whose next candidate is item B, disable or remove B
  before entering the next character, and continue typing within one second.
  Assert matching uses current nodes and state, never focuses B, and either
  chooses the next current match or preserves focus when none exists.
- [x] `RF-TYPE-12` `[reference]` `[browser]` —
  **RovingFocus should derive stable searchable text when Item content contains decorative glyphs and irregular whitespace.**
  Render a label with an `aria-hidden` icon, decorative glyphs, nested text,
  tabs, line breaks, and repeated spaces, then type expected and decorative
  prefixes. Assert only non-decorative text contributes and whitespace
  collapses to a deterministic single-space match string.

### Nested and environment behavior

- [x] `RF-NEST-01` `[convergence]` `[browser]` —
  **RovingFocus should move only the inner composite when a nested composite handles a supported key.**
  Nest a horizontal RovingFocus inside an outer Item, focus an inner middle
  child, and press Right while logging both levels. Assert only inner focus
  and its sole tab stop move, the event is handled once, and outer current
  state remains unchanged.
- [x] `RF-NEST-02` `[reference]` `[browser]` —
  **RovingFocus should allow outer handling when the inner orientation does not support a key.**
  Nest a horizontal inner composite inside a vertical outer composite, focus
  an inner child, and press Down. Assert the inner level leaves the event
  unprevented, the bubbled key moves outer focus to its next Item, and no inner
  horizontal state changes.
- [x] `RF-ENV-01` `[reference]` `[ssr]` —
  **RovingFocus should hydrate the same sole tab stop when server and client collections match.**
  Server-render a mixed enabled/disabled collection and hydrate it with the
  same keys and props while capturing diagnostics. Assert identical authored
  DOM with exactly the same `tabIndex=0` assignment, no generated wrapper, no
  duplicate registration, and no hydration warning.
- [x] `RF-ENV-02` `[reference]` `[shadow]` —
  **RovingFocus should navigate by shadow-local focus and DOM order when the composite lives in a ShadowRoot.**
  Render a reordered collection in an open ShadowRoot, focus an Item, and send
  entry, arrow, Home, and End keys. Assert destinations follow composed shadow
  order, the deepest shadow active element is recognized, and exactly one
  shadow child remains the tab stop.
- [x] `RF-ENV-03` `[reference]` `[browser:all]` —
  **RovingFocus should keep core one-dimensional and grid behavior consistent when run across browser engines.**
  In Chromium, Firefox, and WebKit, run one horizontal loop/disabled fixture
  and one measured ragged-grid fixture. Assert the same focused nodes, sole
  tab-stop updates, key cancellation, and geometry-based destinations in all
  three engines.

## Composition gates

- [x] `RF-COMP-01` `[reference]` `[browser]` —
  **RovingFocus should provide one looping tab stop when a horizontal toolbar contains a disabled control.**
  Compose a labeled toolbar from native buttons, enable looping, and disable a
  middle control before entering with Tab and navigating both directions.
  Assert one current tab stop, correct LTR wrapping, disabled skipping, normal
  Tab exit, and unchanged button activation semantics.
- [x] `RF-COMP-02` `[reference]` `[browser]` —
  **RovingFocus should remain bounded when a vertical tag-action list does not loop.**
  Compose removable tag actions in a vertical list, move with Up/Down and
  Home/End, remove the current keyed action, and press at both boundaries.
  Assert current DOM-order navigation, deterministic next-then-previous
  fallback, one tab stop, and no boundary wrap.
- [x] `RF-COMP-03` `[reference]` `[browser]` `[rtl]` —
  **RovingFocus should combine live geometry, RTL, and typeahead when a responsive picker grid becomes ragged.**
  Compose a labeled picker grid, resize it into unequal rows, switch inherited
  direction to RTL, and search a Unicode item before using all arrow axes.
  Assert one tab stop, current text matching, reversed horizontal movement,
  unchanged vertical geometry, and destinations based on post-resize
  rectangles.

Listbox, Menu, Tabs, and Tree run only integration cases for their
activation/selection policies. Accordion may reuse collection-order helpers,
but its APG contract keeps every header in the native Tab sequence and is not a
RovingFocus composition.

## Out of scope

- Selection state or item actions.
- A public virtual-focus/`aria-activedescendant` mode; `Combobox` owns it.
- Toolbar, ToggleGroup, or grid as additional runtime components.
