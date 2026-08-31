# Tree test contract

Playwright: `matrix/lib/tests/e2e/tree.spec.ts`  
Unit: `matrix/lib/tests/unit/tree.test.ts`
Page: `/tree`

Tree owns one minimal APG tree: visible-hierarchy traversal, controlled
expansion, controlled single selection, and visible-only typeahead.

## Combobox adapter contract

When nested in Combobox, Tree automatically registers its visible item set
through the shared `VirtualFocusAdapter` bridge. Tree retains expansion and
navigation ownership while Combobox retains DOM focus and sole commit
authority.

## Freeze anatomy

APG child treeitems live in explicit `Tree.Group` native divs. Branches expose
a native-button `Tree.Expander`: `tabIndex=-1` inside the roving treeitem,
`type=button` by default, and expansion-only pointer behavior. These are parts,
not new top-level components.

## Freeze defaults

Omitted `value` and `expanded` mean controlled `null` selection and `[]`
expansion. Interaction emits requests but never creates hidden uncontrolled
Tree state.

## Source evidence

- Zag `packages/machines/tree-view` — APG tree roles, `visibleNodes`, disabled
  navigation, selection, expand/collapse key map, RTL, and typeahead.
- `vendor/zag/packages/utilities/collection/tests/tree-collection.test.ts` —
  nesting, parent/child traversal, mutation, and disabled-node skipping.
- `vendor/react-spectrum/packages/react-aria-components/test/Tree.test.tsx` —
  dynamic trees, visible-row Up/Down/Home/End, typeahead, collapse-to-parent,
  and editable-descendant event boundaries.
- React Aria `TreeCollection` expansion filtering is useful; its public
  `role=treegrid` widget, multi-selection, virtualization, and DnD are contrast.

## Required cases

### DOM and hierarchical metadata

- [x] `TR-DOM-01` `[reference]` `[browser]` —
  **Tree should render its root, items, and nested groups with the exact APG anatomy.**
  Render a two-level branch and leaf fixture, then inspect every authored host
  before interaction. Assert one `div[role=tree]`, each item as
  `div[role=treeitem]`, and every nested child set inside its authored
  `div[role=group]`, with no synthetic row or wrapper; hierarchy must be
  present in the public DOM.
- [x] `TR-DOM-02` `[vendor]` `[browser]` —
  **Tree should derive one-based levels from authored nesting at every depth.**
  Render top-level, second-level, and third-level items, then move one branch
  programmatically to a different parent. Assert `aria-level` values begin at
  `1`, increment exactly once per Group, and update for the moved descendants;
  this ports the vendor hierarchy metadata regression.
- [x] `TR-DOM-03` `[vendor]` `[browser]` —
  **Tree should expose expansion state only on items that currently own children.**
  Render a collapsed branch, an expanded branch, and a leaf, then change the
  leaf into a branch and the first branch into a leaf. Assert only current
  branches have `aria-expanded="true"|"false"` and every current leaf omits
  the attribute; assistive technology must not receive false hierarchy.
- [x] `TR-DOM-04` `[vendor]` `[browser]` —
  **Tree items should mirror controlled selection and disabled state independently.**
  Render selected enabled, selected disabled, and ordinary items, then
  programmatically change `value` and `disabled`. Assert every item has
  controlled `aria-selected`, disabled items additionally have
  `aria-disabled="true"` and `data-disabled`, and no callback fires; the two
  state axes must not overwrite each other.
- [x] `TR-DOM-05` `[convergence]` `[browser]` —
  **Tree should report each item's position within its actual sibling set.**
  Author three top-level items and two nested items with headings, expanders,
  and decorative nodes interleaved, then inspect and reorder them. Assert
  one-based `aria-posinset` and sibling-local `aria-setsize` count only
  treeitems and update at each level; authored non-item content must not
  corrupt set metadata.
- [x] `TR-DOM-06` `[reference]` `[browser]` —
  **Tree data-state hooks should stay synchronized with their authoritative ARIA state.**
  Render nested selected and expanded values, then programmatically change
  selection, expansion, and branch depth. Assert `data-selected`,
  `data-expanded`, and `data-level` appear or change on exactly the same items
  and values as `aria-selected`, `aria-expanded`, and `aria-level`; styling
  hooks cannot become a second state source.
- [x] `TR-DOM-07` `[reference]` `[browser]` —
  **Tree parts should preserve all fixed native element contracts without polymorphic hosts.**
  Pass native attributes, `data-*`, classes, styles, ordinary handlers, and
  object/callback refs to Root, Item, Group, and Expander, then rerender and
  interact. Assert each prop and stable native ref reaches its documented
  `div` or `button`, with no `as` replacement or ref loop; internal hierarchy
  registration must remain transparent.
- [x] `TR-DOM-08` `[reference]` `[browser]` —
  **Tree should reject duplicate item values while preserving path-like and
  zero-like strings as opaque identities.**
  Render values `"src/index"`, `"src::index"`, `""`, and `"0"`, select and
  expand eligible zero-like items, then introduce a second `"src/index"` at
  another depth. Assert all distinct strings register without path parsing or
  truthiness coercion and the duplicate throws a descriptive identity error
  before focus or selection becomes ambiguous. This includes React Spectrum
  Components Tree's falsy-key regression within the string-only API.
- [x] `TR-DOM-09` `[convergence]` `[browser]` —
  **Empty Tree should expose its role without inventing a sequential focus target.**
  Render an empty Tree between two buttons, Tab through it, and separately
  remove the last focused item. Assert the ordinary empty Tree has no fake
  item or internal tab stop and is skipped, while removal recovery may focus
  the root only through `tabindex="-1"` without adding it to future Tab order;
  fallback focus must not change the public empty state. This intentionally
  differs from React Spectrum's focusable empty treegrid because Reference
  UI's APG tree has no interactive row and accepts an explicit root
  `tabIndex` when an application needs an empty-state stop.
- [x] `TR-DOM-10` `[reference]` `[browser]` —
  **Tree should default omitted value and expanded props to controlled null and empty state.**
  Omit `value` and `expanded`, attempt to select and expand a branch, and have
  the parent record but ignore both requests. Assert one scalar selection and
  one expanded-array request, while all items remain unselected, the branch
  stays collapsed, and descendants stay absent; omission cannot create hidden
  state.
- [x] `TR-DOM-11` `[reference]` `[browser]` —
  **Tree Expander should be a named non-tab-stop button linked to its branch Group.**
  Render a branch with an explicitly named Expander and stable Group, Tab to
  the treeitem, and inspect/click the button. Assert
  `button[type=button][tabindex="-1"]`, consumer accessible name,
  synchronized `aria-expanded`, `aria-controls` resolving to the Group ID,
  and no second composite tab stop; pointer expansion needs native semantics
  without splitting focus ownership.
- [x] `TR-DOM-12` `[reference]` `[browser]` —
  **Tree should remove collapsed descendants from the rendered accessibility and focus tree.**
  Start with a three-level branch expanded, focus a descendant, then
  programmatically collapse and re-expand its ancestor. Assert the Group and
  descendant treeitems are absent while collapsed, cannot be queried or
  reached, and return with the exact authored nesting and stable IDs when
  expanded; CSS hiding alone is insufficient for visible-only traversal.

### Controlled selection

- [x] `TR-SELECT-01` `[vendor]` `[browser:all]` —
  **Tree should request one controlled selection for each supported item activation.**
  Render value `alpha`, then click, press Space, and press Enter on enabled
  focused `bravo` in separate fresh fixtures. Assert exactly one
  `onChange("bravo")` per action, focus remains on `bravo`, and controlled
  selected ARIA stays on `alpha` until rerender; pointer and keyboard converge
  on one selection path.
- [x] `TR-SELECT-02` `[reference]` `[browser]` —
  **Tree should select a branch without implicitly changing its expansion.**
  Render collapsed branch `src`, focus it, and activate its item by Space or
  click outside the Expander. Assert one `onChange("src")`, no
  `onExpandedChange`, unchanged `aria-expanded="false"`, and absent children;
  selection and hierarchy are separate controlled authorities.
- [x] `TR-SELECT-03` `[reference]` `[browser]` —
  **Tree should treat activation of the already-selected item as idempotent.**
  Render selected value `alpha`, focus it, and activate it by pointer, Space,
  and Enter in separate runs. Assert no `onChange(null)` or redundant
  `onChange("alpha")`, stable selected ARIA, and unchanged focus; this is
  single selection rather than a toggle.
- [x] `TR-SELECT-04` `[reference]` `[browser]` —
  **Tree should preserve controlled selection when the parent rejects a request.**
  Render value `alpha`, arrow to `bravo`, activate it, and leave the prop
  unchanged. Assert focus remains permitted on `bravo`, exactly one
  `onChange("bravo")` is logged, and selected ARIA/data remain on `alpha`;
  focus movement cannot impersonate accepted state.
- [x] `TR-SELECT-05` `[vendor]` `[browser]` —
  **Tree should apply programmatic selection without moving focus or firing callbacks.**
  Focus `alpha`, rerender controlled value from `alpha` to mounted `charlie`,
  and inspect the tree without another user action. Assert selection ARIA/data
  moves to `charlie`, DOM focus stays on `alpha`, and `onChange` is uncalled;
  this ports the vendor controlled-selection update regression.
- [x] `TR-SELECT-06` `[vendor]` `[browser]` —
  **Tree should prevent disabled items from being selected by any modality.**
  Render disabled `bravo` between enabled items and target it with pointer,
  programmatic focus plus Space/Enter, arrows, and matching typeahead. Assert
  no `onChange`, no durable focus on `bravo`, and unchanged selected state;
  disabled skip must apply consistently to selection and search.
- [x] `TR-SELECT-07` `[reference]` `[browser]` —
  **Tree should retain a controlled selected descendant while its ancestor is collapsed.**
  Select nested value `src/index`, then programmatically collapse `src` and
  later expand it again. Assert no corrective callback, no rendered/focusable
  descendant while collapsed, and immediate selected ARIA on `src/index` when
  it returns; visibility does not own application selection.
- [x] `TR-SELECT-08` `[reference]` `[browser]` —
  **Tree Expander pointer activation should change only expansion.**
  Render an unselected collapsed branch, click its nested Expander, and accept
  the expanded-array request. Assert one `onExpandedChange(["src"])`, no
  `onChange`, unchanged item selection, and focus ownership remaining with the
  composite treeitem; button bubbling must not enter the item activation path.

### Controlled expansion

- [x] `TR-EXPAND-01` `[vendor]` `[browser]` —
  **Tree should request addition of a collapsed branch when its Expander is activated.**
  Render expanded `[]`, click the `src` Expander, and leave the parent
  controlled value unchanged. Assert one
  `onExpandedChange(["src"])`, unchanged `aria-expanded="false"`, and no
  rendered Group until rerender; this ports branch expansion without hidden
  state.
- [x] `TR-EXPAND-02` `[vendor]` `[browser]` —
  **Tree should request removal of an expanded branch when its Expander is activated.**
  Render expanded `["src", "src/lib"]`, click the `src` Expander, and record
  the request. Assert one `onExpandedChange(["src/lib"])`, no selection
  callback, and still-rendered descendants until the controlled prop changes;
  collapse requests must preserve unrelated expanded values.
- [x] `TR-EXPAND-03` `[reference]` `[browser]` —
  **Tree should leave branch DOM and ARIA unchanged when expansion is rejected.**
  Render collapsed `src`, activate its Expander and ArrowRight while the
  parent ignores requests, then repeat from an expanded controlled fixture
  with collapse actions. Assert the branch and descendants always match the
  supplied prop, callbacks log requests only, and focus never moves into
  nonexistent children; controlled rejection must be honest.
- [x] `TR-EXPAND-04` `[vendor]` `[browser]` —
  **Tree should reveal and hide Groups from programmatic expansion updates without side effects.**
  Focus one top-level item, rerender expanded values from `[]` to
  `["src", "src/lib"]` and back, while holding selection constant. Assert the
  correct Groups and ARIA appear/disappear, focus remains valid, and neither
  expansion nor selection callback fires; this ports dynamic controlled
  hierarchy updates.
- [x] `TR-EXPAND-05` `[reference]` `[browser]` —
  **Tree should never offer or request expansion for a leaf.**
  Render leaf `readme`, focus it, and press both horizontal expansion keys
  before clicking its authored non-expander content. Assert no Expander,
  `aria-expanded`, Group, or `onExpandedChange` involving `readme`; only
  structural branches can enter expanded state through Tree.
- [x] `TR-EXPAND-06` `[reference]` `[browser]` —
  **Tree should emit deterministic deduplicated expanded arrays in current traversal order.**
  Render branches in order `a, b, c` with controlled
  `["unknown-2", "c", "a", "c", "unknown-1"]`, then expand `b`. Assert the
  request is `["a", "b", "c", "unknown-2", "unknown-1"]`; known branches
  follow current tree order while unknown application values retain incoming
  relative order.
- [x] `TR-EXPAND-07` `[reference]` `[browser]` —
  **Tree should move focus to a branch before collapsing its focused descendant.**
  Expand `src`, focus nested `src/index`, and programmatically remove `src`
  from `expanded`. Assert focus lands on the still-mounted `src` treeitem, its
  Group disappears, selection is unchanged, and no selection callback fires;
  collapse must not strand focus in detached DOM.
- [x] `TR-EXPAND-08` `[reference]` `[browser]` —
  **Tree should let the Expander's consumer handler cancel its expansion default.**
  Attach a logging Expander `onClick` that calls `preventDefault()`, then click
  a collapsed branch button. Assert the consumer handler runs first, no
  `onExpandedChange` follows, `aria-expanded` and Group DOM remain unchanged,
  and unrelated native event propagation follows the authored handler.
- [x] `TR-EXPAND-09` `[reference]` `[browser]` —
  **Tree should keep a disabled branch expansion-controlled while allowing independently enabled descendants.**
  Render disabled `src` first collapsed and then externally expanded with an
  enabled child, and attempt Expander and arrow actions on the branch. Assert
  no expansion/collapse request from disabled `src`, but its controlled Group
  and child render, the child can participate in visible navigation, and
  parent disabled state is not inherited implicitly.

### Visible-set keyboard navigation

- [x] `TR-KEY-01` `[vendor]` `[browser:all]` —
  **Tree should move Up and Down through enabled visible items in depth-first order.**
  Expand a three-level fixture with disabled leaves and a collapsed sibling
  branch, focus the first item, and traverse both directions across every
  boundary. Assert focus follows enabled visible depth-first order, skips
  disabled and collapsed descendants, keeps one tab stop, and does not select;
  this ports the vendor visible-node traversal matrix.
- [x] `TR-KEY-02` `[vendor]` `[browser]` —
  **Tree should make Home and End target the first and last enabled visible items.**
  In a nested fixture with disabled boundary items and collapsed descendants,
  focus a middle treeitem and press Home then End. Assert focus lands on the
  first and last enabled members of the current visible set, not hidden
  structural extremes, with no callback; visible hierarchy defines keyboard
  boundaries.
- [x] `TR-KEY-03` `[vendor]` `[browser]` —
  **LTR Tree should request expansion on Right while keeping focus on a controlled collapsed branch.**
  Focus collapsed branch `src` under LTR and press ArrowRight while the parent
  delays its expanded update. Assert one request adding `"src"`, focus and
  `tabindex="0"` remain on `src`, `aria-expanded` stays false, and no child is
  exposed until rerender; this avoids premature focus into absent DOM.
- [x] `TR-KEY-04` `[vendor]` `[browser]` —
  **LTR Tree should enter an expanded branch's first enabled child on Right and ignore Right on leaves.**
  Expand `src` with disabled first child and enabled second child, focus
  `src`, and press ArrowRight, then press it again on a leaf. Assert focus
  moves to the first enabled child only, no expansion or selection callback
  fires, and the leaf action is unhandled; Right has structural meaning only
  where hierarchy permits it.
- [x] `TR-KEY-05` `[vendor]` `[browser]` —
  **LTR Tree should collapse an expanded branch or move a collapsed item to its parent on Left.**
  Press ArrowLeft first on expanded `src`, then after controlled collapse on a
  focused nested collapsed branch and leaf. Assert the first action requests
  removal of `src` while retaining focus, and later actions move focus to the
  visible parent without callbacks; collapse and parent navigation are
  circumstance-dependent.
- [x] `TR-KEY-06` `[vendor]` `[rtl]` —
  **RTL Tree should mirror horizontal hierarchy keys without changing vertical traversal.**
  Place the nested fixture under `dir=rtl`, use Left to expand/enter and Right
  to collapse/move parent, then exercise Up/Down. Assert horizontal results
  mirror LTR, vertical focus order is identical, and a dynamic direction
  change affects the next key; this ports the vendor RTL key map.
- [x] `TR-KEY-07` `[reference]` `[browser]` —
  **Tree navigation should skip each disabled item without implicitly disabling its descendants.**
  Externally expand a disabled branch containing an enabled child and place a
  disabled leaf among enabled siblings, then traverse with arrows and
  Home/End. Assert focus skips both disabled treeitems but can reach the
  enabled visible child, with no inherited disabled ARIA or callback; disabled
  state belongs to each value.
- [x] `TR-KEY-08` `[reference]` `[browser]` —
  **Tree should exclude every collapsed descendant from all keyboard and search paths.**
  Collapse `src` while its descendants have matching labels and prior roving
  registrations, then use arrows, Home, End, Tab, and typeahead. Assert no
  descendant DOM/tab stop/focus target is reachable and no implicit expansion
  occurs; stale registration must not leak hidden items into the visible set.
- [x] `TR-KEY-09` `[reference]` `[browser]` —
  **Tree arrow navigation should move focus without changing controlled selection.**
  Render selected value `alpha`, focus it, and arrow through expanded branches
  and leaves. Assert DOM focus and the sole tab stop follow navigation while
  selected ARIA remains only on `alpha` and both callbacks stay silent; Tree
  uses focus-follows-navigation, not selection-follows-focus.
- [x] `TR-KEY-10` `[vendor]` `[browser]` —
  **Tree should preserve keyboard ownership for editable and interactive item descendants.**
  Put an input and button inside a treeitem, focus each descendant, and type
  text plus arrows, Home/End, Space, and Enter. Assert native editing/button
  behavior remains available and Tree does not navigate, select, expand, or
  start typeahead; this ports the React Aria editable-descendant boundary.
- [x] `TR-KEY-11` `[reference]` `[browser]` —
  **Tree should honor consumer key cancellation and leave unsupported modified keys untouched.**
  Add an Item `onKeyDown` that logs and prevents ArrowDown, then try
  Alt/Control/Meta-modified arrows and unsupported keys without cancellation.
  Assert the consumer handler runs first, prevented Tree movement emits no
  callback, unsupported combinations retain native `defaultPrevented=false`,
  and focus/state remain stable.

### Visible-only typeahead

- [x] `TR-TYPE-01` `[vendor]` `[browser]` —
  **Tree typeahead should wrap through enabled visible items in depth-first order.**
  Expand selected branches, collapse another matching branch, focus a middle
  item, and type a prefix shared by several labels. Assert focus advances
  through enabled visible matches, wraps at the end, ignores disabled/hidden
  matches, and emits no state callback; this ports visible-node typeahead.
- [x] `TR-TYPE-02` `[reference]` `[browser]` —
  **Tree typeahead should ignore a matching descendant when its ancestor is collapsed.**
  Collapse `src` whose child is the only `Zulu` label, focus another top-level
  item, and type `z`. Assert focus does not move, no expansion or selection
  request fires, and the child remains absent; search must never reveal
  hierarchy as a side effect.
- [x] `TR-TYPE-03` `[reference]` `[browser]` —
  **Tree typeahead should use the current visible set when expansion changes mid-buffer.**
  Type `a` to start a buffer, programmatically expand a branch containing an
  `Alpine` child and search again, then collapse it before the timeout and
  continue typing. Assert newly visible matches are immediately eligible and
  removed matches immediately ineligible, with no stale focus target; the
  buffer cannot snapshot old hierarchy.
- [x] `TR-TYPE-04` `[vendor]` `[browser]` —
  **Tree should integrate the full RovingFocus typeahead session for visible items.**
  Exercise repeated characters, multi-character prefixes, timeout reset,
  Unicode/diacritic labels, a no-match string, and Space during and after an
  active buffer. Assert the documented enabled visible match after each input,
  no selection while searching, and Space activation only after timeout; this
  ports the vendor type-select edge matrix.
- [x] `TR-TYPE-05` `[reference]` `[browser]` —
  **Tree typeahead should prefer current explicit textValue over nested or decorative text.**
  Render an item labeled `Apple` with a nested Expander label, change it to
  `Zulu`, then set `textValue="Bravo"` and search each prefix. Assert stale and
  decorative text never match, current rendered `Zulu` does before the
  override, and explicit `Bravo` wins afterward; dynamic labels must invalidate
  collection caches.

### Dynamic hierarchy

- [x] `TR-DYNAMIC-01` `[vendor]` `[unit]` —
  **Tree's hierarchy model should recompute metadata and traversal after structural edits.**
  Insert, remove, and reorder both leaves and branches at root and nested
  levels, including empty and single-branch trees. Assert parent lookup,
  one-based level/sibling position, set size, first/last node, and depth-first
  next/previous traversal after each mutation; this ports Zag's tree
  collection traversal/remove/replace cases.
- [x] `TR-DYNAMIC-02` `[vendor]` `[unit]` —
  **Tree's hierarchy model should preserve value identity when moving a branch with descendants.**
  Move a multi-level branch within its parent and then to another parent while
  retaining the same values. Assert every descendant's parent path, level,
  sibling position, and traversal order updates while lookups by value still
  resolve the same nodes; this ports Zag's “moves branch with children”
  regression.
- [x] `TR-DYNAMIC-03` `[reference]` `[browser]` —
  **Tree should recover focus predictably when the focused item is removed.**
  Remove a focused middle item, then repeat with the last child, only child,
  and last item in the Tree. Assert focus chooses the next visible enabled
  item, otherwise previous, otherwise nearest visible parent, and finally the
  root via `tabindex="-1"` without adding a Tab stop; detached focus must not
  fall unpredictably to `body`.
- [x] `TR-DYNAMIC-04` `[reference]` `[browser]` —
  **Tree should preserve controlled selected and expanded values after their items unmount.**
  Render selected/expanded nested values, remove their items or whole branch,
  and later restore them with the same identities. Assert no corrective
  callback or substitute state, no selected/expanded DOM for absent items, and
  immediate controlled ARIA/Groups on restoration; collection lifetime does
  not own parent arrays.
- [x] `TR-DYNAMIC-05` `[vendor]` `[browser]` —
  **Tree should update semantics and keys when an item changes between leaf and branch.**
  Rerender `alpha` from leaf to collapsed branch with a Group, expand it, then
  rerender it back to a leaf. Assert Expander/Group and `aria-expanded`
  appear/disappear correctly, horizontal keys change behavior immediately,
  and no stale expanded request or selection mutation survives; this ports
  vendor dynamic-tree regressions.
- [x] `TR-DYNAMIC-06` `[vendor]` `[browser]` —
  **Tree should remove stale navigation targets when current or ancestor disabled state changes.**
  Focus a nested item, disable it, then disable/enable its ancestor while the
  branch remains externally expanded and navigate. Assert focus recovers to a
  valid enabled visible item, one tab stop remains, enabled descendants follow
  the frozen per-item policy, and no stale disabled registration is reached.

### Combobox adapter and environments

- [x] `TR-CB-01` `[reference]` `[browser]` —
  **Tree should provide visible-only virtual navigation inside an editable Combobox.**
  Open a Combobox Tree popup with expanded and collapsed branches, keep DOM
  focus on the input, and press Up/Down across the hierarchy. Assert
  `document.activeElement` remains the input, its `aria-activedescendant`
  always names a mounted enabled visible treeitem, TreeItems have no tab stop,
  and hidden descendants are never referenced; Tree owns the visible set while
  Combobox owns focus.
- [x] `TR-CB-02` `[reference]` `[browser]` —
  **Tree should request horizontal expansion under Combobox virtual focus without moving DOM focus.**
  With the input focused and collapsed `src` active, press the direction-
  appropriate expand key, accept the controlled update, and press it again.
  Assert one expanded-array request, input focus throughout, active descendant
  retained on `src` until mount and then moved to its first enabled child, and
  no selection commit; virtual focus must preserve Tree's hierarchy commands.
- [x] `TR-CB-03` `[reference]` `[browser]` —
  **Tree should register its Combobox bridge automatically without adapter props or duplicate collection roles.**
  Nest a controlled Tree directly in Combobox.Popover with no `virtualFocus`
  prop, then open editable and select-only variants and inspect source,
  Combobox.Popover, and Tree. Assert source `aria-haspopup="tree"` and
  controls linkage, one Tree-owned `role=tree`, no role invented on
  Combobox.Popover, generated active IDs only
  for mounted TreeItems, and no registration wrapper; built-in hierarchy must
  not require application adapter plumbing.
- [x] `TR-CB-04` `[reference]` `[browser:all]` —
  **Tree activation inside Combobox should route one scalar commit only through the Combobox root.**
  Activate an enabled visible TreeItem by pointer, Enter, and Space in separate
  fixtures while Input stays focused, then reject the controlled value request.
  Assert one `Combobox.onChange(itemValue)` per action, no Tree `onChange`,
  unchanged selected ARIA until the root value prop updates, and no duplicate
  callback or focus move; automatic registration does not transfer commit
  authority.
- [x] `TR-CB-05` `[reference]` `[browser]` —
  **Tree should refresh the automatic Combobox registry when expansion or dynamic hierarchy changes visibility.**
  Make an active child disappear by controlled collapse, then reorder branches,
  replace its value, remove the active branch, and expand a newly mounted
  descendant. Assert every source active-descendant names only the current
  mounted visible TreeItem, stale IDs/values never reactivate or commit, Tree
  navigation uses the latest hierarchy, and focus stays on the Combobox source;
  the bridge must follow Tree registration rather than snapshot it.
- [x] `TR-CB-06` `[reference]` `[browser]` —
  **Tree should publish local active styling state when Combobox virtually
  focuses one visible mounted Item.**
  Keep Tree's controlled selection on `readme`, move virtual keyboard and
  pointer activity to visible `src/index`, then collapse `src` and activate a
  sibling. Assert only the real Item named by the Combobox source has
  `data-active`, selected state remains independently on `readme`, collapse
  clears the hidden child's hook and active descendant atomically, and no Item
  receives DOM focus. Preview styling must not require application-owned
  active state.
- [x] `TR-ENV-01` `[reference]` `[ssr]` —
  **Tree should hydrate nested hierarchy and generated relationships without mismatch.**
  Server-render selected and expanded three-level content, hydrate it, and
  navigate after hydration. Assert stable Group/Expander IDs and controls,
  identical levels/set metadata/ARIA, no duplicate IDs or hydration warning,
  and no callback before user action; hierarchy cannot depend on browser-only
  registration timing.
- [x] `TR-ENV-02` `[reference]` `[react:all]` —
  **Tree should register and invoke once across React versions and StrictMode.**
  Mount a dynamic nested fixture under StrictMode in React 17, 18, and 19,
  then select, expand, move, and remove items. Assert one live registration per
  value, one corresponding callback per action, current traversal after
  mutation, and no ref/effect replay leak; runtime differences must remain
  unobservable.
- [x] `TR-ENV-03` `[reference]` `[shadow]` —
  **Tree should discover focus and traverse visible hierarchy inside a ShadowRoot.**
  Mount the nested fixture in an open ShadowRoot, focus a treeitem, and use
  vertical, horizontal, Home/End, and typeahead commands. Assert focus is read
  from the owning root, traversal and callback results match light DOM, and no
  `document.activeElement` assumption produces a stale target.
- [x] `TR-A11Y-01` `[reference]` `[browser]` —
  **Tree should pass accessibility checks across every frozen hierarchy state.**
  Render named empty, nested, collapsed, expanded, selected, selected-hidden,
  and disabled fixtures and scan after relevant state transitions. Assert no
  violations plus exact tree/treeitem/group names, levels, positions,
  expansion, selection, and controls; automation supplements the keyboard and
  focus proofs.

## Composition gates

- [x] `TR-COMP-01` `[reference]` `[browser]` `[rtl]` —
  **Tree should support a controlled two-level navigation composition with mixed leaves and branches.**
  Build named top-level leaves plus collapsed/expanded branches using explicit
  Groups and Expander buttons, then exercise pointer selection, expansion, and
  the complete LTR/RTL key map. Assert exact hierarchy ARIA, one roving tab
  stop, independent callback logs, disabled skip, and deterministic focus
  recovery; this proves the baseline APG composition.
- [x] `TR-COMP-02` `[reference]` `[browser]` —
  **Tree should keep collapsed descendants out of a three-level composition's visible set.**
  Build at least three levels with repeated labels under expanded and
  collapsed ancestors, then use arrows, Home/End, typeahead, dynamic collapse,
  and removal. Assert only rendered enabled visible items participate in
  focus/search, collapsed Groups are absent, and controlled hidden selection
  survives; this is the visible-hierarchy freeze gate.
- [x] `TR-COMP-03` `[reference]` `[browser]` —
  **Tree should compose with Combobox through one virtual-focus and commit authority.**
  Place the three-level Tree directly in an editable Combobox.Popover without an
  adapter prop, navigate, dynamically expand/reorder while the input retains
  DOM focus, then commit a visible leaf. Assert `aria-haspopup="tree"`,
  mounted-only active descendant IDs, one Tree expansion request, one Combobox
  scalar commit, no nested Tree selection callback, and one popup layer; this
  proves the automatic shared bridge without adding Tree props or a second
  collection runtime.

## Owned elsewhere

- Generic one-tab-stop/typeahead behavior: `RovingFocus`.
- Input focus and active-descendant lifecycle: `Combobox`.

## Out of scope

- Treegrid rows/cells, multi-selection, virtualization, DnD, load-more,
  checkboxes, application links/actions inside rows, and file-explorer
  semantics. The Tree-owned `Tree.Expander` remains the branch expansion
  control.
  React Spectrum Components `Tree.test.tsx` load-more, row links and
  interactive descendants, `escapeKeyBehavior`, drag/drop, and multi-select
  suites are deliberately classified here rather than weakened into the
  minimal single-select APG Tree.
