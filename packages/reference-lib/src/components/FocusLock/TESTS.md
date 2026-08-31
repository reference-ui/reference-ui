# FocusLock test contract

Playwright: `matrix/lib/tests/e2e/focus-lock.spec.ts`  
Unit: `matrix/lib/tests/unit/focus-lock.test.ts`
Page: `/focus-lock`

FocusLock owns one focus solver: tabbable discovery, activation, containment,
Tab loop, shards, nested-lock pause, and restoration. It slots onto one child
and adds no wrapper.

## Source evidence

- `vendor/radix-primitives/packages/react/focus-scope/src/focus-scope.test.tsx`
  — Tab loop, negative/hidden skip, branch containment, blur ordering, stable
  refs, and focusable-container fallback.
- `vendor/tabbable/test/e2e/{tabbable,isTabbable,isFocusable,shadow-dom}.cy.js`
  — native candidate catalog, radio groups, fieldsets, details, inert, CSS
  visibility, and Shadow DOM.
- `vendor/focus-lock/__tests__/{focusMerge.unit,return-focus,shadow-dom}.spec.ts`
  — radio order, proximity restoration, removed nodes, and shadow traversal.
- `vendor/focus-trap/test/suites` — `initialFocus:false`, stacked traps,
  dynamic containers, and lifecycle timing.
- `vendor/react-focus-lock` — shards and last-lock-wins behavior; wrappers,
  sidecars, groups, and whitelist APIs are excluded.

## Required cases

### Public type and anatomy

- [x] `FL-TYPE-01` `[reference]` `[unit]` —
  **FocusLock should expose its focus options and strict child shape when its props extend `ReferenceSlotPartProps`.**
  Compile FocusLock with representative StyleProps plus one React element,
  `null`, `false`, or an omitted child, and with
  `initialFocus`/`restoreFocus` ref and resolver targets. Assert that strings,
  numbers, child arrays, non-HTMLElement target resolvers, and values outside
  the documented boolean/`FocusTarget` unions fail type checking without
  repeating the universal PART runtime matrix.

### Transparent container

- [x] `FL-DOM-01` `[reference]` `[browser]` —
  **FocusLock should preserve one authored container when it activates without wrapper or local guard nodes.**
  Render FocusLock around a marked `<section>` with a consumer ref and inspect
  the surrounding DOM before and after activation. Assert the same section
  receives the ref and lock behavior, with no FocusLock host, sentinel, or
  required sibling inserted.
- [x] `FL-DOM-02` `[reference]` `[browser]` —
  **FocusLock should add only its fallback focusability when the authored container otherwise has no focus target.**
  Compare an empty container without `tabIndex`, one with a consumer
  `tabIndex`, and one containing a tabbable button while also supplying
  unrelated props, styles, and events. Assert fallback `tabIndex=-1` only in
  the first fixture, exact preservation of the consumer value and unrelated
  surface elsewhere, and one working authored container in every fixture.
- [x] `FL-DOM-03` `[reference]` `[browser]` —
  **FocusLock should enforce Slot's child-shape invariant when its transparent child is empty or invalid.**
  Render an omitted child, `null`, and `false`, then bypass type checking for
  text, a number, a nonempty Fragment, and multiple active element children in
  separate fixtures. Assert that empty forms render nothing without error,
  while every invalid shape throws the documented single-element error and
  commits no partial lock DOM, listeners, or focus registration.
- [x] `FL-DOM-04` `[vendor]` `[react:all]` —
  **FocusLock should keep composed listener and observer refs stable when attachment triggers a rerender.**
  Give the slotted child a callback ref that schedules state during attachment
  and rerender it under each supported React version. Assert a finite settled
  render count, one authored container, one effective listener/observer set,
  and no repeated detach/attach loop.

### Activation and initial focus

- [x] `FL-INIT-01` `[convergence]` `[browser:all]` —
  **FocusLock should focus the first enabled tabbable descendant when activation omits `initialFocus`.**
  Keep focus on a control before a disabled-first lock containing two enabled
  candidates, then activate the lock. Assert `document.activeElement` becomes
  the first enabled tabbable in composed DOM order, with one blur from the
  outside control and no focus on the disabled candidate.
- [x] `FL-INIT-02` `[convergence]` `[browser]` —
  **FocusLock should focus its authored container when activation finds no tabbable descendant.**
  Activate an empty slotted container from an outside button, then deactivate
  and Tab forward past it. Assert the container receives focus through
  fallback `tabIndex=-1` while active but does not become a forward sequential
  Tab stop once focus navigation proceeds outside the active lock.
- [x] `FL-INIT-03` `[vendor]` `[browser]` —
  **FocusLock should honor a valid `FocusTarget` when `initialFocus` points past the first candidate.**
  Pass `initialFocus` first as a ref to the second enabled button and then as a
  resolver returning it, and activate from an outside control. Assert both
  forms focus that button directly, skip the first candidate, and remain
  contained within the lock.
- [x] `FL-INIT-04` `[convergence]` `[browser]` —
  **FocusLock should allow explicit programmatic initial focus when the referenced descendant has `tabIndex=-1`.**
  Point a ref and resolver `initialFocus` fixture at an enabled visible
  descendant with `tabIndex={-1}` and activate the lock. Assert that node
  becomes active for either target form even though ordinary Tab skips it, and
  subsequent Tab movement uses the normal sequential candidate list.
- [x] `FL-INIT-05` `[reference]` `[browser]` —
  **FocusLock should fall back safely when `initialFocus` does not resolve a valid focus target inside the lock.**
  Parameterize refs and resolvers yielding `null`, disabled, hidden, inert,
  and outside elements, with one valid tabbable descendant and an
  empty-container variant. Assert no exception, focus on the first valid
  descendant when present, and otherwise focus on the authored container.
- [x] `FL-INIT-06` `[vendor]` `[browser]` —
  **FocusLock should skip only the activation focus move when `initialFocus` is false.**
  Keep focus on an outside button, activate with `initialFocus={false}`, and
  then programmatically focus a different outside button after moving focus
  inside once. Assert activation causes no initial blur or focus move, while
  the later escape attempt is reclaimed to the most recent inside target.
- [x] `FL-INIT-07` `[reference]` `[browser]` —
  **FocusLock should preserve current focus when activation begins with focus already inside its container.**
  Focus the second descendant before enabling the lock while the first
  descendant is also tabbable. Assert activation leaves the second node
  active, emits no extra blur/focus pair, and does not reset to the first
  candidate.
- [x] `FL-INIT-08` `[reference]` `[browser]` —
  **FocusLock should remain inert when it mounts or updates with `disabled` true.**
  Mount with `disabled={true}`, an `initialFocus` ref, inside candidates, and
  focus outside; then Tab and programmatically move focus in and out. Assert
  no activation move, reclaim, explicit Tab wrapping, or restoration, and
  ordinary browser focus behavior remains available.

### Tab loop

- [x] `FL-TAB-01` `[vendor]` `[browser:all]` —
  **FocusLock should move Tab through enabled candidates in composed document order when focus is inside.**
  Activate a lock containing mixed native candidates and disabled controls,
  then press Tab from each enabled stop. Assert focus advances through the
  enabled composed order exactly once per key and never lands on a disabled or
  excluded node.
- [x] `FL-TAB-02` `[vendor]` `[browser:all]` —
  **FocusLock should wrap forward focus when Tab is pressed on the last candidate.**
  Focus the last enabled tabbable in an active lock and press Tab once using
  native browser input. Assert default escape is contained and focus becomes
  the first enabled candidate, with no outside node receiving settled focus.
- [x] `FL-TAB-03` `[vendor]` `[browser:all]` —
  **FocusLock should wrap backward focus when Shift+Tab is pressed on the first candidate.**
  Focus the first enabled tabbable in an active lock and press Shift+Tab once.
  Assert focus becomes the last enabled candidate and does not settle on a
  control before the lock.
- [x] `FL-TAB-04` `[vendor]` `[browser]` —
  **FocusLock should preserve native blur-before-focus order when Tab wraps at a boundary.**
  Log blur and focus events while wrapping forward from last to first and
  backward from first to last. Assert exactly one blur on the old candidate
  precedes exactly one focus on the new candidate for each movement, with no
  duplicate intermediate focus.
- [x] `FL-TAB-05` `[convergence]` `[browser]` —
  **FocusLock should keep deterministic DOM order when candidates carry positive `tabIndex` values.**
  Render candidates in A-B-C DOM order with positive values that would
  otherwise rank C before A, activate, and Tab through them. Assert FocusLock's
  sequence remains A-B-C and wraps from C to A rather than applying positive
  `tabIndex` sorting.
- [x] `FL-TAB-06` `[reference]` `[browser]` —
  **FocusLock should suppress its Tab move when a consumer prevents the key before internal handling.**
  Have the active candidate's keydown handler run first and call
  `preventDefault()` for one Tab, then attempt programmatic focus outside.
  Assert the prevented key leaves focus in place with no explicit lock move,
  while the later outside focus is still reclaimed inside.
- [x] `FL-TAB-07` `[reference]` `[browser]` —
  **FocusLock should keep focus on its container when Tab is pressed without any tabbable descendants.**
  Activate an empty authored container and press Tab and Shift+Tab from its
  fallback-focused `tabIndex=-1` node. Assert focus remains on that container
  after either key, no outside candidate receives focus, and no loop or error
  occurs.
- [x] `FL-TAB-08` `[reference]` `[browser]` —
  **FocusLock should use the live candidate order when tabbables are inserted, removed, or reordered.**
  Focus candidate B, then insert D after it, reorder existing keyed nodes, and
  remove the pending next candidate before separate Tab presses. Assert each
  next focus target reflects the current composed DOM immediately and no stale
  or detached node receives focus.
- [x] `FL-TAB-09` `[vendor]` `[browser]` —
  **FocusLock should not wrap or trap a Tab key carrying an application or
  operating-system modifier.**
  Focus a boundary candidate and dispatch Ctrl+Tab, Alt+Tab, and Meta+Tab in
  separate supported-browser fixtures, while retaining Shift+Tab as the normal
  reverse command. Assert modified events remain unprevented and produce no
  lock-authored focus move or reclaim loop, whereas unmodified Shift+Tab still
  follows the frozen boundary behavior. This ports React Aria
  `FocusScope.test.js` “should do nothing if a modifier key is pressed.”

### Tabbable catalog

- [x] `FL-CAND-01` `[vendor]` `[browser:all]` —
  **FocusLock should include every supported native tabbable kind when each candidate is enabled and rendered.**
  Place an enabled button, input, select, textarea, `a[href]`, controlled
  audio/video, first summary of open details, truthy contenteditable, and
  explicit nonnegative-`tabIndex` element in one lock. Assert Tab visits each
  once in the contract's composed DOM order and wrap includes the same set.
- [x] `FL-CAND-02` `[vendor]` `[browser:all]` —
  **FocusLock should exclude nodes from sequential navigation when native semantics make them non-tabbable.**
  Include disabled controls, a `tabIndex=-1` node, anchor without `href`,
  media without controls, and `contenteditable="false"` among valid
  candidates. Assert Tab skips every excluded node, while the explicit
  negative node remains available only to an otherwise valid
  `initialFocus` ref.
- [x] `FL-CAND-03` `[vendor]` `[browser:all]` —
  **FocusLock should exclude candidates when they or their ancestors are hidden or inert.**
  Place focusable descendants beneath separate `display:none`,
  `visibility:hidden`, `visibility:collapse`, `hidden`, and `inert`
  boundaries, alongside one visible candidate. Assert activation and Tab skip
  every concealed subtree and settle only on the visible candidate.
- [x] `FL-CAND-04` `[vendor]` `[browser:all]` —
  **FocusLock should expose only the native disclosure stop when candidates are inside closed details.**
  Render closed `<details>` with two direct summaries and focusable content,
  then open it in a second phase. Assert only the first direct summary is a
  stop while closed, non-summary descendants and later summaries are skipped,
  and opening adds eligible descendants to current navigation.
- [x] `FL-CAND-05` `[vendor]` `[browser:all]` —
  **FocusLock should follow native legend exceptions when candidates live in a disabled fieldset.**
  Put controls in the first legend, a later legend, and ordinary content of a
  disabled fieldset, including a nested disabled-fieldset variant. Assert only
  controls protected by the first valid legend remain candidates and all
  others are skipped during activation and Tab.
- [x] `FL-CAND-06` `[vendor]` `[browser:all]` —
  **FocusLock should follow native named-radio tabbability when a group has a checked radio or no selection.**
  Create named groups with a checked enabled radio and with no checked radio,
  plus equal names in separate forms or roots, then Tab through the lock.
  Assert the selected group contributes only its checked enabled radio, the
  unchecked group keeps all enabled radios tabbable, and separate form/root
  groups remain independent.
- [x] `FL-CAND-07` `[vendor]` `[browser:all]` —
  **FocusLock should skip non-rendered zero-area candidates when visible fixed or positioned controls also exist.**
  Mix controls with no client rect or zero width and height with visibly
  rendered fixed, absolute, and ordinary controls. Assert activation and Tab
  exclude the zero-area/non-rendered nodes while retaining every positioned
  control that has rendered geometry.
- [x] `FL-CAND-08` `[convergence]` `[shadow]` —
  **FocusLock should traverse open shadow roots and assigned slots when composed focus order crosses DOM boundaries.**
  Build nested open roots with slotted light-DOM controls and focus candidates
  before, inside, and after each boundary, then Tab and inspect focus. Assert
  composed-order traversal and wrapping use the slotted positions and the
  deepest active element rather than stopping at a shadow host.
- [x] `FL-CAND-09` `[reference]` `[browser]` —
  **FocusLock should recalculate candidates when runtime state changes their native tabbability.**
  While the lock is active, toggle `disabled`, radio `checked`, details
  `open`, `inert`, and CSS visibility on pending candidates before each Tab.
  Assert the very next movement uses the new eligible set and never focuses a
  stale candidate.
- [x] `FL-CAND-10` `[vendor]` `[browser:all]` —
  **FocusLock should retain rendered candidates when visual styling hides pixels without removing native focusability.**
  Include focusable controls with `opacity:0`, clipping, transparent color,
  and offscreen positioning that still have rendered boxes, alongside
  `display:none` and `visibility:hidden` controls. Assert Tab keeps the former
  rendered candidates and excludes only the latter non-visible candidates.
- [x] `FL-CAND-11` `[reference]` `[browser]` —
  **FocusLock should preserve native tabbability when only `aria-hidden` is set and exclude the same subtree when it becomes inert.**
  Tab through a rendered button beneath `aria-hidden="true"`, then add
  `inert` to the button or an ancestor without remounting. Assert the
  ARIA-hidden button remains a native candidate initially and is absent from
  the next candidate set after inerting.
- [x] `FL-CAND-12` `[vendor]` `[browser:all]` —
  **FocusLock should treat a focusable iframe as one opaque stop when other candidates cross shadow boundaries.**
  Place a cross-origin iframe element between ordinary candidates and add
  controls inside open and closed shadow roots elsewhere in the lock. Assert
  Tab includes the iframe host once without descendant inspection, traverses
  open-root controls, treats closed-root internals as opaque, and wraps
  consistently.
- [x] `FL-CAND-13` `[vendor]` `[shadow]` —
  **FocusLock should respect shadow-host and slot tabindex when composed order
  includes open and closed web components.**
  Interleave ordinary controls with an open-root component containing assigned
  slots, a closed-root component, and hosts whose `tabIndex` is `-1`, `0`, or
  positive; also vary tabindex on slotted children. Assert open-root assigned
  elements appear at their rendered slot positions, a `tabIndex=-1` host
  contributes no sequential stop or hidden descendants, and closed-root
  internals remain opaque while an eligible host appears only once in
  deterministic composed order. This ports tabbable `shadow-dom.cy.js` and
  focus-lock's web-component/tab-order regressions.
- [x] `FL-CAND-14` `[vendor]` `[browser]` —
  **FocusLock should accept click focus entering an iframe element inside the
  lock without attempting cross-document traversal.**
  Click a control in a same-origin iframe whose element is a live candidate
  inside the lock, then repeat with a cross-origin iframe and with an iframe
  outside the lock. Assert the containing iframe remains the outer document's
  active candidate and is not reclaimed when it belongs to the lock, the
  library never queries cross-origin descendants, and an outside iframe is
  treated as an escape. This ports React Aria `FocusScope.test.js` “focus
  properly moves into child iframe on click” while preserving the
  document-scoped lock boundary.

### Programmatic containment and removal

- [x] `FL-TRAP-01` `[vendor]` `[browser:all]` —
  **FocusLock should reclaim the most recently focused inside node when code focuses outside an active lock.**
  Focus inside candidate B, call `.focus()` on a connected outside button,
  and wait for settled containment. Assert B becomes active again, the outside
  node does not retain focus, and one reclaim occurs without falling back to
  the first candidate.
- [x] `FL-TRAP-02` `[reference]` `[browser]` —
  **FocusLock should reclaim outside focus without suppressing pointer interaction when a pointer focuses an outside control.**
  Click a focusable outside button while the lock is active and log
  pointerdown, click, and focus events on that button. Assert the pointer and
  click handlers each run normally, temporary outside focus is reclaimed
  inside, and FocusLock does not prevent the pointer event like a modal
  Overlay.
- [x] `FL-TRAP-03` `[vendor]` `[browser]` —
  **FocusLock should avoid a synchronous reclaim loop when focusout has a null related target.**
  Dispatch or induce a real focusout from the current inside candidate with
  `relatedTarget === null` and instrument focus-call and render counts. Assert
  no recursive focus storm, bounded CPU/render work, no exception, and later
  concrete focus movement still uses normal containment.
- [x] `FL-TRAP-04` `[vendor]` `[browser]` —
  **FocusLock should move focus to a valid fallback when the currently focused node is removed.**
  Focus a middle candidate, remove it from the active lock, and let mutation
  observation settle with another candidate and an empty-lock variant.
  Assert focus moves once to a valid remaining candidate or the authored
  container, never to the detached node or outside the lock.
- [x] `FL-TRAP-05` `[reference]` `[browser]` —
  **FocusLock should move focus once when the current node becomes disabled, hidden, or inert.**
  In separate runs, focus candidate B and then disable it, hide it, or inert it
  while candidate C remains valid. Assert settled focus on one valid
  candidate, no return to B, and no repeated oscillation or duplicate
  focus/blur cycle.
- [x] `FL-TRAP-06` `[reference]` `[browser]` —
  **FocusLock should cancel pending containment when the lock disables or unmounts before reclaim completes.**
  Trigger outside focus to queue a reclaim, immediately disable or unmount the
  lock, and then explicitly focus another application control. Assert no stale
  work steals that later focus, all lock listeners/observers clean up, and no
  delayed focus call occurs.
- [x] `FL-TRAP-07` `[vendor]` `[browser]` —
  **FocusLock should restore its last live inside target when focus returns to
  the document after the browser temporarily loses focus.**
  Focus candidate B, move focus to the browser/window so the document reports
  no concrete related target, then re-enter the document through an outside
  control while the lock remains active. Assert one settled move back to B, or
  the current valid fallback if B changed, with no synchronous storm and no
  use of the pre-activation restore target. This ports React Aria
  `FocusScope.test.js` “restore focus to the last focused element in the scope
  when re-entering the browser.”

### Shards

- [x] `FL-SHARD-01` `[vendor]` `[browser]` —
  **FocusLock should permit focus in an outside element when that element is passed directly as a shard.**
  Register a portalled outside container element in `shards`, then focus and
  click its descendant while the lock is active. Assert programmatic and
  pointer focus remain in the shard, its click runs once, and containment does
  not reclaim to the main container.
- [x] `FL-SHARD-02` `[vendor]` `[browser]` —
  **FocusLock should use a ref shard when that ref resolves to a current element after mount.**
  Mount with a shard ref whose `.current` is null, try focusing its future
  location, then attach the shard, rerender, and focus its descendant again.
  Assert null is ignored and outside focus reclaimed initially, while the
  resolved current shard joins containment without remounting the lock.
- [x] `FL-SHARD-03` `[reference]` `[browser]` —
  **FocusLock should traverse main content and shards as one tab sequence when both contain candidates.**
  Interleave a lock container and two shard containers in composed document
  order, then press Tab and Shift+Tab through every candidate. Assert focus
  follows the combined order in both directions and wraps from the combined
  last to first and first to last.
- [x] `FL-SHARD-04` `[reference]` `[browser]` —
  **FocusLock should deduplicate candidates when shard registrations overlap or nest.**
  Register a parent shard, its nested child shard, and the same element twice,
  while leaving a focusable sibling unregistered. Assert each registered
  candidate appears once in Tab order, no duplicate focus step occurs, and
  focus on the unregistered sibling is reclaimed.
- [x] `FL-SHARD-05` `[reference]` `[browser]` —
  **FocusLock should reclaim inside focus when the currently focused shard is removed.**
  Focus a candidate in a registered shard after previously focusing main
  candidate B, then remove the shard from the DOM and registration. Assert
  focus returns once to the most recent still-valid candidate inside the lock,
  with no attempt to refocus the detached shard.
- [x] `FL-SHARD-06` `[reference]` `[shadow]` —
  **FocusLock should include portalled and open-shadow shards when composed paths place them outside the main subtree.**
  Register one portalled shard and one shard inside an open ShadowRoot, focus
  and Tab through both, and click their descendants. Assert each participates
  in containment and composed Tab order, deepest shadow focus is recognized,
  and neither valid shard triggers reclaim.

### Nested locks

- [x] `FL-NEST-01` `[vendor]` `[browser]` —
  **FocusLock should pause its parent when a nested FocusLock becomes active.**
  Activate a parent lock, focus one of its candidates, then mount and activate
  a child lock while logging focus calls from both. Assert initial focus moves
  into the child and only one reclaimer responds to outside focus, with no
  parent-child focus fight or oscillation.
- [x] `FL-NEST-02` `[vendor]` `[browser]` —
  **FocusLock should contain Tab and programmatic focus inside the active child when locks are nested.**
  With parent and child locks active, Tab across the child boundary and
  programmatically focus a parent-only candidate. Assert Tab wraps within the
  child and the parent candidate is reclaimed to the child's latest focus,
  while the paused parent does not run competing movement.
- [x] `FL-NEST-03` `[convergence]` `[browser]` —
  **FocusLock should restore into and resume its parent when the active child deactivates.**
  Focus the child lock, deactivate it with restoration enabled, and then
  attempt to focus a node outside the parent. Assert focus first restores to a
  valid parent target, parent containment resumes, and the later outside
  attempt is reclaimed by the parent once.
- [x] `FL-NEST-04` `[reference]` `[browser]` —
  **FocusLock should preserve the top live lock when nested locks deactivate out of activation order.**
  Activate locks A, B, and C, then disable or unmount B before C and later
  remove C. Assert C remains the sole active reclaimer after B disappears and
  A resumes only when C is gone, with no restoration to dead B.
- [x] `FL-NEST-05` `[reference]` `[browser]` —
  **FocusLock should keep its parent active when a portalled non-modal child is registered as a shard.**
  Open interactive portalled content from inside the lock, register it in
  `shards`, and move focus between main and portalled candidates. Assert one
  continuous lock and activation stack, valid focus in the shard, and no
  parent pause or second initial-focus/restore cycle.
- [x] `FL-NEST-06` `[reference]` `[browser]` —
  **FocusLock should share activation only when locks belong to the same Document.**
  Activate locks from two independent React roots in one document and another
  lock in a same-origin iframe document, then attempt focus escapes in each.
  Assert same-document locks use one last-active stack, while the iframe lock
  neither pauses nor reclaims for the outer document and contains only its own
  document focus.

### Restore focus

- [x] `FL-RESTORE-01` `[vendor]` `[browser:all]` —
  **FocusLock should restore the pre-activation element when `restoreFocus` is omitted or true.**
  In separate omitted and explicit-true fixtures, focus outside trigger A,
  activate and use the lock, then deactivate it. Assert A becomes active
  exactly once after deactivation and no other proximity target is chosen
  while A remains connected and focusable.
- [x] `FL-RESTORE-02` `[reference]` `[browser]` —
  **FocusLock should leave deliberate application focus untouched when deactivation uses `restoreFocus=false`.**
  In one controlled action, move focus to a connected outside target and
  deactivate the lock before a queued reclaim, with
  `restoreFocus={false}`. Assert that target keeps focus after all pending
  work settles and the pre-activation element is not refocused.
- [x] `FL-RESTORE-03` `[vendor]` `[browser]` —
  **FocusLock should restore by sibling proximity when the original focused node was removed.**
  Activate from a focusable node between connected left and right siblings,
  remove the original while locked, and deactivate; repeat without the right
  sibling. Assert focus chooses the nearest focusable replacement to the right
  first and then the nearest focusable left sibling when no right candidate
  remains.
- [x] `FL-RESTORE-04` `[vendor]` `[browser]` —
  **FocusLock should walk ancestor proximity when no valid sibling can replace a removed restore target.**
  Remove the original target and leave no focusable sibling in its immediate
  parent, but provide a focusable candidate near an ancestor; then repeat with
  none anywhere. Assert restoration chooses the ancestor-proximity candidate
  when available and otherwise completes without throwing or focusing a
  detached node.
- [x] `FL-RESTORE-05` `[vendor]` `[browser]` —
  **FocusLock should use proximity restoration when the original target becomes disabled, hidden, or inert.**
  Activate from a target, make it disabled, CSS-hidden, or inert while the lock
  is active, and deactivate with valid nearby siblings. Assert the invalid
  original is never focused and the same right-then-left/ancestor proximity
  algorithm selects one valid connected replacement.
- [x] `FL-RESTORE-06` `[reference]` `[browser]` —
  **FocusLock should run only the current restoration when lifecycle replay or rapid state changes queue stale work.**
  Exercise StrictMode replay, rapid disable-enable-disable, and unmount while
  logging focus, then explicitly focus a newer application target before stale
  deferred callbacks run. Assert at most one valid restoration for the current
  deactivation and no stale callback overwrites the newer explicit focus.
- [x] `FL-RESTORE-07` `[reference]` `[browser]` —
  **FocusLock should perform its return move when a standalone lock deactivates.**
  Focus a trigger, activate a standalone lock, and disable or unmount that
  lock while its captured origin remains valid. Assert one return move during
  FocusLock deactivation; Overlay's later Presence-coupled timing is exercised
  only in Overlay's owned contract.
- [x] `FL-RESTORE-08` `[reference]` `[browser]` —
  **FocusLock should prefer an explicit return target when `restoreFocus` resolves a valid element at deactivation.**
  Activate from origin A while `restoreFocus` is separately supplied as a ref
  to target B and as a resolver returning B, then deactivate in each fixture.
  Assert B receives focus exactly once, A is not restored, and both public
  `FocusTarget` forms produce the same result.
- [x] `FL-RESTORE-09` `[reference]` `[browser]` —
  **FocusLock should fall back to its captured origin when an explicit return target is invalid at deactivation.**
  Parameterize a `restoreFocus` ref or resolver that yields `null`, a removed
  node, or a disabled, hidden, or inert element while the captured origin
  remains connected and focusable. Assert one restoration to the captured
  origin, no focus attempt on the invalid target, and normal proximity fallback
  if that origin has also become invalid.
- [x] `FL-RESTORE-10` `[reference]` `[browser]` —
  **FocusLock should resolve the latest return target when that target is replaced during deactivation.**
  Begin with `restoreFocus` resolving target B, replace B with connected
  focusable target C in the same controlled update that deactivates the lock,
  and retain stale ref and focus logs for B. Assert C receives the sole return
  focus, B is never focused after removal, and deferred stale work cannot
  overwrite C.

### Environments

- [x] `FL-ENV-01` `[reference]` `[ssr]` —
  **FocusLock should hydrate transparently when server rendering cannot access document focus state.**
  Server-render an enabled FocusLock with marked children while `document` and
  `activeElement` are unavailable, then hydrate and activate on the client.
  Assert no server global access, extra markup, or hydration warning, followed
  by the documented client initial-focus behavior.
- [x] `FL-ENV-02` `[reference]` `[react:all]` —
  **FocusLock should preserve its core lifecycle when running under React 17, 18, and 19.**
  For each supported React version, run activation, forward/backward Tab wrap,
  nested-lock pause/resume, unmount, ref cleanup, and restoration smokes.
  Assert equivalent active elements and event order with only the documented
  version-specific callback-ref cleanup form differing.
- [x] `FL-ENV-03` `[reference]` `[shadow]` —
  **FocusLock should contain and restore focus when candidates span nested open ShadowRoots.**
  Activate from outside nested open roots, use an inner candidate for explicit
  initial focus, Tab across slots, attempt programmatic escape, and deactivate.
  Assert deepest active-element tracking, composed-order wrap, reclaim inside
  the roots, and restoration to the original outer target.
- [x] `FL-ENV-04` `[reference]` `[browser:all]` —
  **FocusLock should keep core containment behavior consistent when run in Chromium, Firefox, and WebKit.**
  In all three engines, activate a mixed-candidate lock, wrap Tab both ways,
  attempt programmatic and pointer escape, and deactivate. Assert the same
  included candidates, settled active elements, pointer non-cancellation,
  reclaim behavior, and final restoration.

## Composition gates

- [x] `FL-COMP-01` `[reference]` `[browser]` —
  **FocusLock should contain a plain composition when mixed native controls and radio groups define its tab order.**
  Compose a form with text controls, links, media, one checked radio group,
  disabled and hidden candidates, and outside controls. Assert omitted
  initial focus, deterministic composed-DOM Tab order, one radio stop,
  forward/backward wrap, programmatic reclaim, and restoration to the trigger.
- [x] `FL-COMP-02` `[reference]` `[shadow]` —
  **FocusLock should treat portalled and open-shadow content as one lock when both are registered as shards.**
  Compose main dialog content with a portalled picker shard and an open-shadow
  shard, then pointer-focus and Tab across all three regions. Assert combined
  composed order and wrap, valid persistent shard focus, deepest shadow focus
  tracking, and reclaim from an unregistered sibling.
- [x] `FL-COMP-03` `[reference]` `[browser]` —
  **FocusLock should resume nested containment and restore by proximity when the original target disappears.**
  Activate a parent lock from a trigger, open a child lock, remove the child's
  and then parent's original restore targets, and close the locks in stack
  order. Assert child restoration into the live parent, parent resume without
  competing reclaim, and final right-then-left/ancestor proximity restoration
  exactly once.

## Owned elsewhere

- Dialog dismissal, inerting, scroll lock, and resolving return focus only
  after Presence exit completion: `Overlay`.
- Prop/ref merge matrix: `Slot`.

## Deferred

- Traversing or trapping inside iframe content from an outer lock
  (`crossFrame`); each Document owns its own lock.

## Out of scope

- `as`, wrapper selection, public focus guards, sidecars, focus-lock groups,
  whitelist callbacks, and combining multiple trap engines.
