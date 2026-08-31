# Toast test contract

Playwright: `matrix/lib/tests/e2e/toast.spec.ts`  
Unit: `matrix/lib/tests/unit/toast.test.ts`
Page: `/toast`  
Fixture root: `ReferenceLibrary`

Toast owns imperative identity, visible queue order, timers, updates, dismissal,
positions, and announcement requests. It is never an Overlay.

## API freeze decisions

- `limit` is global to one ReferenceLibrary toaster. Excess toasts wait in FIFO
  order and their durations do not start until visible. This avoids Sonner's
  hidden-but-expiring toast behavior and follows Spectrum/Zag queue semantics.
- Updating with an explicitly changed resolved duration restarts that full
  duration at update time. Content-only updates preserve elapsed/remaining
  time. Updates while paused remain paused.
- `toast.show` with an active ID updates that instance in place; `toast.update`
  with an unknown ID is a no-op with a development diagnostic.

## Runtime freeze decisions

1. ReferenceLibrary renders one `div[data-reference-toast-host]`. Every
   occupied position gets one `div[data-reference-toast-position]`; every
   visible item gets one `div[data-reference-toast-id][data-state]` wrapper.
   Items expose `--reference-toast-index`/`--reference-toast-count`; arbitrary
   render output stays untouched inside.
2. Item wrappers use Presence with `data-state="open"|"closed"`; no-motion
   dismissal is immediate.
3. Library defaults are duration 5000ms, position `bottom-end`, and global
   limit 4.
4. Server imports/definitions are safe, but imperative show/update/dismiss/
   announce calls are request-safe no-ops with development diagnostics.
5. Global operations accept explicit target `document`; ambiguous untargeted
   multi-document calls mutate neither host.

## Source evidence

- `vendor/sonner/test/tests/basic.spec.ts` — default timeout, hover pause,
  infinite duration, update, pre-mount replay, reused/dismissed IDs, StrictMode
  recreate race, and history cleanup.
- `vendor/sonner/src/state.ts` — stable IDs, same-ID merge, pending dismissals,
  dismiss-all, and subscriber replay.
- `vendor/base-ui/packages/react/src/toast/createToastManager.test.tsx` and
  `vendor/base-ui/packages/react/src/toast/store.test.ts` — add/update/close,
  pause flags, remaining-time accumulation, last-toast races, dynamic limit,
  and unknown IDs.
- React Spectrum Toast/live-announcer tests — polite/assertive regions, timer
  pause, focus-order contrast, and top-layer exceptions.
- Zag toast queue/dismissable branch — waiting limits and dialog coordination.

## Required cases

### Definition and rendering

- [x] `TO-DOM-01` `[reference]` `[browser]` —
  **Toast should separate visual and assistive DOM when ReferenceLibrary hosts
  notifications.** Mount one library, show ID `"visual"`, and separately call
  `announce("Saved", {politeness: "polite", document})`. Assert exactly one
  `div[data-reference-toast-host]` contains the visual item and has no
  live-region role or `aria-live`, while `"Saved"` appears only in the
  document's announcement path, preventing arbitrary JSX from becoming an
  accidental AT message.
- [x] `TO-DOM-02` `[reference]` `[browser]` —
  **Toast should render one stable stack when a position becomes occupied.**
  Show two `"top-start"` toasts and one `"bottom-end"` toast, capture their
  parent nodes, then update content and dismiss every item in one position.
  Assert one `div[data-reference-toast-position="top-start"]` and one
  `"bottom-end"` stack are reused across updates and that an empty stack is
  removed, giving applications deterministic hooks without six permanent
  containers.
- [x] `TO-DOM-03` `[reference]` `[browser]` —
  **Toast should expose one authoritative item wrapper when an instance is
  visible or exiting.** Show ID `"upload:42"` at `"top-center"` and dismiss it
  through an explicit 120ms exit transition. Assert one `div` exposes
  `data-reference-toast-id="upload:42"`,
  `data-reference-toast-position="top-center"`, and `data-state="open"` then
  `"closed"` around the same untouched render output, freezing observable
  identity through Presence.
- [x] `TO-DOM-04` `[reference]` `[browser]` —
  **Toast should preserve arbitrary render output when a definition returns
  non-element shapes.** Define separate toasts that return `"Saved"`, a
  Fragment, and two sibling elements including an existing
  `role="status"`, then show each. Assert every result appears unchanged inside
  only the item wrapper and Toast adds no role, label, clone, or guessed text
  semantics, keeping content and accessibility ownership with the application.
- [x] `TO-DOM-05` `[reference]` `[browser]` —
  **Toast should preserve wrapper identity and application styles when queue
  metadata changes.** Show IDs `"a"`, `"b"`, and `"c"` in one stack, record the
  stack/item elements and a child's `style={{transform: "scale(2)"}}`, then
  update `"b"` and dismiss `"a"`. Assert surviving nodes are identical,
  `--reference-toast-index` becomes zero-based `"0"`/`"1"` and
  `--reference-toast-count` becomes `"2"`, while the child transform and
  unrelated classes/styles remain untouched.
- [x] `TO-DEF-01` `[reference]` `[unit]` —
  **Toast should create a reusable typed definition when `toast.define` is
  called outside a host.** Define
  `{duration: 4000, render: ({name}: {name: string}) => name}` twice at module
  scope and inspect the returned values without mounting ReferenceLibrary.
  Assert each call returns the reusable definition with its generic prop
  contract and neither invokes `render`, allocates an ID, accesses the DOM, nor
  mutates any document queue.
- [x] `TO-DEF-02` `[reference]` `[browser]` —
  **Toast should pass exact props and instance controls when a definition is
  shown.** Call
  `toast.show(ProjectSaved, {project: {id: 42, name: "Draft"}}, {id: "save:42"})`
  and log both render arguments by identity. Assert the first argument is the
  exact invocation object and the second is `{id: "save:42", close}` where
  `close` is callable, while `toast.show` returns `"save:42"`, making callback
  arguments implementable without inspecting internals.
- [x] `TO-DEF-03` `[vendor]` `[browser]` —
  **Toast should render application-owned JSX when a definition supplies
  custom content.** Return a form containing a heading, input, and custom
  dismiss button, then show it through the public definition API. Assert the
  JSX renders once with no injected semantic variant, icon, title, action, or
  role; this ports `vendor/sonner/test/tests/basic.spec.ts` “render custom jsx
  in toast” while leaving its visual variants and anatomy behind.
- [x] `TO-DEF-04` `[reference]` `[browser]` —
  **Toast should preserve native interaction when custom content receives
  focus and events.** Show content with an input and two buttons whose
  `onInput`, `onClick`, and `onKeyDown` handlers log concrete event values,
  then Tab, type `"abc"`, press Space, and Shift+Tab through them. Assert the
  input value and callback log match native order and focus follows document
  tab order without wrapping, trapping, or roving, proving Toast owns no
  widget interaction model.
- [x] `TO-DEF-05` `[reference]` `[browser]` —
  **Toast should close only the render instance whose control is invoked when
  IDs are later reused.** Show `"same"`, retain its `controls.close`, dismiss it
  fully, reuse `"same"` for a fresh instance, and invoke both the fresh and
  stale close functions in separate runs. Assert the fresh function closes
  its current generation and the stale function cannot close the reused
  generation or another toast, so a public ID is not mistaken for lifetime
  identity.
- [x] `TO-DEF-06` `[reference]` `[react:all]` —
  **Toast should avoid duplicate records when StrictMode replays definition
  rendering and updates.** In React 17, 18, and 19, mount a StrictMode caller
  that shows ID `"strict"` and updates its definition from `"Saving"` to
  `"Saved"` during effect replay. Assert one queue record, one item wrapper,
  one current render output, and one timer survive with no render-phase queue
  mutation, protecting the imperative store from React development replays.

### Identity, show, and update

- [x] `TO-ID-01` `[vendor]` `[unit]` —
  **Toast should generate distinct stable string IDs when callers omit
  identity.** Show definitions for `"first"` and `"second"` without `id`,
  retain both return values through updates, and expose the queue order.
  Assert two nonempty unequal strings remain unchanged and records stay
  insertion-ordered, porting
  `vendor/base-ui/packages/react/src/toast/createToastManager.test.tsx`
  “returns a toast id” without its Provider.
- [x] `TO-ID-02` `[vendor]` `[unit]` —
  **Toast should preserve caller identity when an explicit string ID is
  supplied.** Show instances with `"upload:42"` and `""`, then update and
  dismiss each by the same value. Assert `toast.show` returns the exact string,
  the queue and `data-reference-toast-id` preserve it without truthiness
  fallback, and only that record changes; this strengthens
  `vendor/sonner/test/tests/basic.spec.ts` “cancel button dismisses the custom
  toast with empty id,” whose source otherwise regenerates an empty ID.
- [x] `TO-ID-03` `[convergence]` `[browser]` —
  **Toast should update in place when `toast.show` receives an already-active
  ID.** Show `"save"` as `"Saving"` at `"bottom-end"` for 5000ms, then show
  `"save"` with a new definition, `{label: "Saved"}`, and
  `{duration: 1000, position: "top-end"}`. Assert the returned ID, queue slot,
  item element, and generation remain single while content/options update,
  converging Sonner same-ID merge and
  `vendor/base-ui/packages/react/src/toast/createToastManager.test.tsx`
  “upserts a toast when adding with an existing id.”
- [x] `TO-ID-04` `[vendor]` `[browser]` —
  **Toast should replace definition props when `toast.update` targets an active
  instance.** Show ID `"draft"` with definition A and
  `{title: "Old", stale: true}`, then call
  `toast.update("draft", DefinitionB, {title: "New"})`. Assert one original
  wrapper and queue slot now render only Definition B with exactly the new
  props and no stale field, porting
  `vendor/base-ui/packages/react/src/toast/createToastManager.test.tsx`
  “updates a toast” while keeping Reference UI's complete-props callback
  contract.
- [x] `TO-ID-05` `[reference]` `[browser]` —
  **Toast should move one instance when an update changes its position.** Show
  `"move"` in `"bottom-end"` beside another item, capture its wrapper, then
  update only its position to `"top-start"`. Assert the same
  `data-reference-toast-id="move"` element is adopted by the new stable stack,
  appears nowhere in the old stack, and retains content, queue identity, and
  timer state, preventing a positional move from becoming close-plus-add.
- [x] `TO-ID-06` `[reference]` `[unit]` —
  **Toast should ignore an update when its ID is unknown or fully dismissed.**
  Snapshot queue records and timers, call `toast.update("missing", ...)`, then
  fully dismiss `"gone"` and update `"gone"`. Assert no definition render,
  queue/timer mutation, announcement, or resurrection occurs and each call
  emits only one development diagnostic naming its ID, matching
  `vendor/base-ui/packages/react/src/toast/store.test.ts` “ignores mutations
  that target an unknown toast.”
- [x] `TO-ID-07` `[vendor]` `[browser]` —
  **Toast should create clean state when a fully dismissed ID is reused.**
  Show `"reuse"` with definition A, `{action: "Undo"}`,
  `duration: false`, `"top-start"`, and announcement `"Old"`, dismiss through
  exit completion, then show definition B with only `{label: "New"}` using the
  same ID. Assert a fresh wrapper/generation uses resolved defaults, has no old
  action, props, timing, position, announcement, or closed state, porting
  `vendor/sonner/test/tests/basic.spec.ts` “a new toast reusing the id of a
  dismissed toast does not inherit its props.”
- [x] `TO-ID-08` `[vendor]` `[browser]` —
  **Toast should preserve a recreated instance when dismissal and same-ID show
  happen in one frame.** Show `"race"`, call `toast.dismiss("race")`, and
  synchronously call `toast.show(Fresh, {}, {id: "race"})` before React
  commits or an exit event fires. Assert one fresh open wrapper remains after
  the stale animation frame and exit completion, porting
  `vendor/sonner/test/tests/basic.spec.ts` “toast recreated right after being
  dismissed stays on screen.”
- [x] `TO-ID-09` `[vendor]` `[unit]` —
  **Toast should bound retained work when one ID passes through repeated
  lifecycle cycles.** Run at least 1,000 show/update/dismiss/exit-complete
  cycles across generated and reused IDs while counting queue entries,
  generation records, subscriptions, and scheduled timers. Assert active work
  and retained props return to the pre-run baseline rather than growing with
  completed cycles, extending
  `vendor/sonner/test/tests/basic.spec.ts` “dismissed toasts do not pile up in
  the history” beyond its 100-entry implementation detail.

### Option precedence

- [x] `TO-OPT-01` `[reference]` `[unit]` —
  **Toast should resolve each option independently when several precedence
  layers provide defaults.** Combine invocation
  `{duration: 1000}`, definition `{duration: 2000, position: "top-center"}`,
  ReferenceLibrary `{defaultDuration: 3000, defaultPosition: "top-start"}`,
  and library defaults, leaving a different layer absent for each record.
  Assert duration and position independently follow invocation → definition →
  ReferenceLibrary → library rather than selecting one winning options object,
  making partial overrides predictable.
- [x] `TO-OPT-02` `[reference]` `[unit]` —
  **Toast should preserve falsey durations when each precedence layer resolves
  timing.** Parameterize invocation, definition, and ReferenceLibrary duration
  values over `2500`, `0`, `false`, and `undefined`, with lower layers set to
  distinguish fallback. Assert `2500`, `0`, and `false` win exactly while only
  `undefined` falls through, proving zero-delay and untimed states are never
  conflated by `||`.
- [x] `TO-OPT-03` `[reference]` `[unit]` —
  **Toast should preserve every position when each precedence layer resolves
  placement.** For `"top-start"`, `"top-center"`, `"top-end"`,
  `"bottom-start"`, `"bottom-center"`, and `"bottom-end"`, place the value once
  at invocation, definition, and ReferenceLibrary levels with conflicting
  lower defaults. Assert the exact string wins at its layer and reaches both
  stack and item position attributes, covering the complete closed union
  without truthiness or enum-order assumptions.
- [x] `TO-OPT-04` `[reference]` `[browser]` —
  **Toast should retain resolved options when an update changes only render
  props.** Show `"stable-options"` for 5000ms at `"bottom-center"`, advance
  1200ms, update its props only, then issue a second update with
  `{duration: 900, position: "top-start"}`. Assert the first update keeps
  `"bottom-center"` and 3800ms remaining while the explicit update moves the
  same instance and starts the new 900ms duration at update time.
- [x] `TO-OPT-05` `[reference]` `[browser]` —
  **Toast should use a replacement definition's defaults when update options
  omit those fields.** Show `"swap"` from definition A with
  5000ms/`"bottom-end"`, then update to definition B with
  1200ms/`"top-center"` while explicitly passing only
  `{position: "top-start"}`. Assert B's 1200ms default replaces A's duration
  and the invocation's `"top-start"` replaces B's position, while unrelated
  library defaults remain fallback-only.
- [x] `TO-OPT-06` `[reference]` `[browser]` —
  **Toast should use frozen library defaults when all public option layers omit
  values.** Mount ReferenceLibrary without `toaster`, define no duration or
  position, and show five optionless records while instrumenting timers.
  Assert 5000ms, `"bottom-end"`, and a global visible limit of four, with the
  fifth queued and untimed, freezing omission rather than relying on
  environment or truthiness defaults.

### Queue, positions, and limit

- [x] `TO-QUEUE-01` `[reference]` `[browser]` —
  **Toast should keep visible items FIFO when several instances occupy one
  position.** Show IDs `"a"`, `"b"`, and `"c"` at `"top-end"` in that order,
  then update `"b"` without changing position. Assert the stable
  `data-reference-toast-position="top-end"` stack contains `a, b, c` in DOM
  order before and after update and exposes deterministic item index/count
  hooks, so content changes cannot reorder a visual history.
- [x] `TO-QUEUE-02` `[reference]` `[browser]` —
  **Toast should keep excess instances out of rendered DOM when the global
  limit is reached.** Configure `limit: 2`, show `"a"` at `"top-start"`, `"b"`
  at `"bottom-end"`, and `"c"` at `"top-center"`, and inspect visual,
  focusable, and live-region descendants. Assert only `"a"` and `"b"` have
  wrappers or interactive content, `"c"` has no DOM or announcement and no
  running duration, and exactly two open or exiting item wrappers remain until
  one slot is released.
- [x] `TO-QUEUE-03` `[convergence]` `[unit]` —
  **Toast should promote the oldest waiting instance when a visible slot is
  released.** With `limit: 1`, show visible `"a"` for 1000ms and queued `"b"`
  for 500ms, advance 400ms, then exercise both explicit dismissal and expiry
  runs and complete `"a"`'s removal. Assert `"b"` becomes visible only after
  the slot is released and remains for its full 500ms from promotion, adopting
  Spectrum/Zag waiting-queue semantics instead of Sonner's hidden-but-expiring
  items.
- [x] `TO-QUEUE-04` `[reference]` `[unit]` —
  **Toast should mutate a waiting record without briefly rendering stale
  content when callers update or dismiss it.** With `"a"` visible and `"b"`,
  `"c"` queued, update `"b"` from `"Old"` to `"New"` and dismiss `"c"` before
  releasing `"a"`. Assert the FIFO slot for `"b"` is unchanged, `"c"` and its
  timer are removed, and promotion renders only `"New"` with no transient old
  output or announcement.
- [x] `TO-QUEUE-05` `[reference]` `[unit]` —
  **Toast should update a queued identity in place when `show` reuses its ID.**
  With `limit: 1`, queue IDs `"b"` then `"c"` behind visible `"a"`, and call
  `toast.show(NewB, {}, {id: "b", duration: 700})`. Assert the returned ID and
  queue index for `"b"` remain unchanged ahead of `"c"`, no timer starts, and
  the new definition/options appear only when `"b"` is later promoted,
  preventing upsert from becoming priority escalation.
- [x] `TO-QUEUE-06` `[vendor]` `[browser]` —
  **Toast should preserve FIFO records when a mounted library lowers and
  raises its limit.** Show `"a"` through `"e"` under `limit: 4`, consume known
  timer amounts, lower the limit to two, and then raise it to four. Assert the
  newest excess visible records `"c"` and `"d"` are demoted ahead of already
  queued `"e"`, disappear from interactive/AT DOM with remaining time paused,
  and reappear FIFO with that remainder, porting
  `vendor/base-ui/packages/react/src/toast/store.test.ts` “recomputes limited
  flags when the limit changes” to a waiting queue.
- [x] `TO-QUEUE-07` `[reference]` `[browser]` —
  **Toast should share one global limit when records target different
  positions.** Under `limit: 2`, interleave `"a"` at `"top-start"`, `"b"` at
  `"bottom-end"`, `"c"` at `"top-start"`, and `"d"` at `"bottom-end"`, then
  release slots in sequence. Assert at most two total records are visible,
  promotion follows global FIFO, and each position stack independently orders
  only its visible members without moving identity between positions.
- [x] `TO-QUEUE-08` `[reference]` `[browser]` —
  **Toast should clear all queue work when `toast.dismiss()` omits an ID.**
  Create timed, untimed, pointer-paused, exiting, and queued records across
  positions, then call `toast.dismiss(undefined, {document})` in a no-motion
  fixture. Assert every visible and queued record, stack, scheduled callback,
  pause source, and retained remaining-time entry is removed while the empty
  host remains, proving dismiss-all leaves no work that can later resurrect.

### Timers

- [x] `TO-TIME-01` `[vendor]` `[browser:all]` —
  **Toast should begin dismissal at the resolved deadline when a timed item is
  continuously visible.** In Chromium, Firefox, and WebKit, show a 1000ms toast
  in a zero-motion fixture and observe its wrapper at 999ms and after the next
  millisecond. Assert it remains `data-state="open"` before the deadline and is
  removed at or after 1000ms, porting
  `vendor/sonner/test/tests/basic.spec.ts` “toast is rendered and disappears
  after the default timeout” without an early browser timer.
- [x] `TO-TIME-02` `[vendor]` `[browser]` —
  **Toast should remain untimed when its resolved duration is false.** Show a
  `duration: false` toast, instrument timer registration, and advance 60
  seconds through pointer, focus, and visibility changes before dismissing it
  explicitly. Assert no auto-dismiss callback is scheduled and the wrapper
  stays open, carrying the intent of
  `vendor/sonner/test/tests/basic.spec.ts` “toast is not removed if duration is
  set to infinity” through Reference UI's `number | false` API.
- [x] `TO-TIME-03` `[convergence]` `[browser]` —
  **Toast should render once when its resolved duration is zero.** Show
  `duration: 0`, synchronously inspect the committed host, and then allow the
  next zero-delay timer turn in a no-motion fixture. Assert the open wrapper
  and render callback are observable for one commit, then exactly one
  dismissal removes it, distinguishing zero from both `false` and a
  pre-render cancellation.
- [x] `TO-TIME-04` `[vendor]` `[browser]` —
  **Toast should pause only the entered item when a pointer remains over custom
  content.** Show `"hovered"` and `"other"` with 1000ms durations, advance
  200ms, move a real mouse pointer into `"hovered"`, and wait another 1000ms
  without leaving. Assert `"hovered"` remains open with 800ms while
  `"other"` dismisses, porting `vendor/sonner/test/tests/basic.spec.ts` “toast
  is not removed when hovered” without pausing the whole queue.
- [x] `TO-TIME-05` `[vendor]` `[browser]` —
  **Toast should resume exact remaining time when the pointer leaves an item.**
  Show a 1000ms toast, consume 300ms, hover it for 5 seconds, and issue a real
  `pointerleave`. Assert it remains open for 699ms after leave and starts
  dismissal on the next millisecond, refining
  `vendor/react-spectrum/packages/react-aria-components/test/Toast.test.js`
  “pauses timers when hovering” so hover cannot reset a full duration.
- [x] `TO-TIME-06` `[vendor]` `[unit]` —
  **Toast should accumulate active elapsed time when a timer is paused and
  resumed repeatedly.** Start a 5000ms model timer and run two cycles of
  1000ms active, 1000ms paused, then resume before advancing 2999ms and one
  final millisecond. Assert no dismissal during paused time or at 4999ms of
  active time and one dismissal at 5000ms, porting
  `vendor/base-ui/packages/react/src/toast/store.test.ts` “does not extend the
  remaining time across repeated pause/resume cycles.”
- [x] `TO-TIME-07` `[vendor]` `[browser]` —
  **Toast should pause remaining time when its owner document becomes hidden.**
  Show a 5000ms toast, consume 1000ms, change that document's visibility to
  hidden for 7 seconds, then restore visible and advance 3999ms plus one
  millisecond. Assert it stays open while hidden and through the first 3999ms,
  then dismisses once at the remaining 4000ms boundary, preserving
  `vendor/sonner/src/index.tsx` `document.hidden` behavior per owner document
  rather than global window.
- [x] `TO-TIME-08` `[reference]` `[browser]` —
  **Toast should leave a waiting item untimed when the visible limit keeps it
  queued.** With `limit: 1`, show a long-lived visible item and queue another
  with `duration: 500`, then advance 30 seconds before releasing the slot.
  Assert the queued definition has no wrapper or scheduled timer during the
  wait and remains open for its full 500ms after promotion, preventing unseen
  expiration.
- [x] `TO-TIME-09` `[reference]` `[unit]` —
  **Toast should preserve elapsed time when an update changes content but not
  resolved duration.** Start ID `"content"` at 5000ms, consume 1200ms, and
  update its definition props without passing duration or changing the
  definition's duration default. Assert the render output changes while
  exactly 3800ms remains and no timer is restarted, so ordinary progress text
  cannot extend notification lifetime.
- [x] `TO-TIME-10` `[convergence]` `[unit]` —
  **Toast should replace timer state when an update explicitly changes
  duration modes.** After consuming 1000ms of a 5000ms toast, update duration
  to 900 and assert dismissal at 900ms from update; in separate runs change a
  timed toast to `false` and a false toast to `750`. Assert a changed numeric
  duration starts one full replacement timer, `false` cancels all timers, and
  false-to-number starts one fresh 750ms timer, freezing Reference UI's policy
  where vendor reset rules differ.
- [x] `TO-TIME-11` `[vendor]` `[unit]` —
  **Toast should retain one current timer when two updates occur before React
  commits.** Show an untimed `"loading"` record, synchronously update it to
  `"success"` with `duration: 1000`, and immediately update props again without
  duration before subscribers rerender. Assert the final content appears and
  exactly one 1000ms timer dismisses it, porting
  `vendor/base-ui/packages/react/src/toast/createToastManager.test.tsx` “does
  not clear the auto-dismiss timer when updated twice before a re-render.”
- [x] `TO-TIME-12` `[vendor]` `[unit]` —
  **Toast should clear stale pause bookkeeping when the last timed item closes
  beside untimed or exiting records.** Pause a 100ms timed toast while an
  untimed `"loading"` toast and a closed Presence wrapper remain, close the
  timed item, add another 100ms toast, and pause it before advancing 200ms.
  Assert the new item remains open while paused and later dismisses after
  resume, porting `vendor/base-ui/packages/react/src/toast/store.test.ts`
  “re-pauses timers after the last timed toast closes while untimed toasts
  remain.”
- [x] `TO-TIME-13` `[reference]` `[browser]` —
  **Toast should keep replacement timers paused when an update occurs under an
  active pause source.** In separate runs, pause a 5000ms toast by pointer and
  by a top modal Overlay, update it to `duration: 800`, and advance 2 seconds
  before removing the same pause source. Assert it stays open while paused and
  then receives the full changed 800ms from resume, while removing one of two
  simultaneous pause sources does not resume it early.
- [x] `TO-TIME-14` `[convergence]` `[browser]` —
  **Toast should preserve remaining action time when keyboard focus enters and
  leaves interactive content.** Show a 5000ms toast with an input and button,
  consume 1000ms, Tab into the input for 7 seconds, then move focus to the
  outside invoking control and advance 3999ms plus one millisecond. Assert only
  that toast pauses while focus is within its wrapper and dismisses after the
  exact remaining 4000ms, adapting
  `vendor/react-spectrum/packages/react-aria-components/test/Toast.test.js`
  “pauses timers when focusing” without its F6 region.

### Dismissal

- [x] `TO-CLOSE-01` `[vendor]` `[browser]` —
  **Toast should dismiss only the named instance when `toast.dismiss` receives
  an ID.** Show visible `"a"` and `"b"` plus queued `"c"`, dismiss each target
  in separate runs with `{document}`, and repeat the same call after removal.
  Assert only the matching visible or queued record, timer, and wrapper are
  removed and the repeat is a no-op, porting
  `vendor/base-ui/packages/react/src/toast/createToastManager.test.tsx`
  “closes a toast” to both queue states.
- [x] `TO-CLOSE-02` `[vendor]` `[browser]` —
  **Toast should dismiss every instance when `toast.dismiss` omits an ID.**
  Populate multiple positions with visible, queued, paused, and untimed
  records, then call `toast.dismiss(undefined, {document})`. Assert all records
  enter at most one close lifecycle, all queue slots and timers clear, and no
  item promotes afterward, porting
  `vendor/base-ui/packages/react/src/toast/createToastManager.test.tsx`
  “closes all toasts” without a manager object.
- [x] `TO-CLOSE-03` `[reference]` `[browser]` —
  **Toast should perform one close lifecycle when two requests target an
  instance in the same frame.** Invoke an item's `controls.close()` and
  `toast.dismiss(id, {document})` synchronously before React commits, while
  logging state mutations, timer cancellation, and Presence completion.
  Assert one open-to-closed transition, one timer cancellation, one removal,
  and no later stale callback or queue promotion occurs.
- [x] `TO-CLOSE-04` `[reference]` `[browser]` —
  **Toast should retain or remove its wrapper according to actual motion when
  dismissal begins.** Dismiss one item styled with a 120ms opacity transition,
  one with an animation, and one with computed zero duration while observing
  `data-state` and real end events. Assert animated wrappers become `"closed"`
  once and remain until their relevant transition/animation completes, with
  interruption and multiple properties delegated to Presence, while the
  no-motion wrapper is removed immediately without a fixed fallback timeout.
- [x] `TO-CLOSE-05` `[reference]` `[browser]` —
  **Toast should ignore a stale exit event when an ID is recreated during
  dismissal.** Begin the animated exit of `"same"`, synchronously show a fresh
  `"same"` generation, and dispatch the old wrapper's transition or animation
  completion after the new item opens. Assert only one fresh
  `data-state="open"` instance remains with its own timer and the stale event
  cannot close, remove, or mutate it.

### Announcements

- [x] `TO-ANN-01` `[reference]` `[browser]` —
  **Toast should create one polite AT message when `announce` is called without
  assertive politeness.** With one active document host, observe live-region
  mutations and call `announce("Project saved", {document})`. Assert
  `"Project saved"` is inserted once into the dedicated
  `aria-live="polite"` path and no `data-reference-toast-id` item or visual
  content is created, keeping announcements independent from toast rendering.
- [x] `TO-ANN-02` `[reference]` `[browser]` —
  **Toast should preserve both messages when polite and assertive announcements
  occur in the same turn.** Synchronously call
  `announce("Background sync complete", {politeness: "polite", document})` and
  `announce("Session expired", {politeness: "assertive", document})`. Assert
  each string causes one mutation in separate polite and assertive/alert paths
  with the matching `aria-live` value and neither replaces the other, so
  urgency does not become last-write-wins.
- [x] `TO-ANN-03` `[reference]` `[browser]` —
  **Toast should send the supplied announcement when `toast.show` also renders
  custom visual content.** Show a form definition with
  `{id: "saved", announce: "Draft was saved", document}` and observe both
  runtime paths. Assert the untouched form renders once under the visual
  wrapper and the exact string mutates the same polite announcer used by
  `announce()`, with no text flattening or duplicate semantic wrapper.
- [x] `TO-ANN-04` `[reference]` `[browser]` —
  **Toast should remain silent to the live announcer when show options omit
  `announce`.** Render JSX containing visible `"Payment failed"`, nested
  elements, and an application-owned role, then show it without an
  announcement option. Assert no polite or assertive live-region mutation
  contains or derives that text while the visual output remains unchanged,
  preserving application ownership of accessible wording.
- [x] `TO-ANN-05` `[convergence]` `[browser]` —
  **Toast should produce two observable mutations when the same message is
  announced twice.** Attach a `MutationObserver`, call
  `announce("Saved", {document})`, wait for its insertion boundary, and call
  the identical function again. Assert the announcer clears and reinserts
  `"Saved"` so two distinct AT-observable insertions occur, converging React
  Aria and Radix live-announcer replay behavior rather than deduplicating equal
  strings.
- [x] `TO-ANN-06` `[reference]` `[browser]` —
  **Toast should announce only an explicit new message when an active instance
  updates or dismisses.** Show `"job"` with announcement `"Started"`, update
  its content with no announce option, update again with
  `{announce: "Finished"}`, and dismiss it. Assert the mutation log is exactly
  `["Started", "Finished"]` in order and content-only update and dismissal
  produce no AT message, preventing visual lifecycle operations from being
  guessed as speech.
- [x] `TO-ANN-07` `[reference]` `[browser]` —
  **Toast should ignore blank messages and clear old announcement text when its
  AT-safe retention delay ends.** Call `announce` with `""`, `"   "`, and
  `"\n\t"`, then announce `"Complete"` and advance to just before and through
  the frozen clearing delay. Assert blanks create no mutation, `"Complete"`
  appears once and remains through the safe interval, and the region is then
  cleared without replay, avoiding both meaningless speech and stale text.
- [x] `TO-ANN-08` `[vendor]` `[browser]` —
  **Toast should replay one visual and one AT request when both target a
  document before its library mounts.** Before any host exists, call
  `toast.show(Saved, {}, {id: "pre", announce: "Saved", document})` and a
  separate `announce("Ready", {document})`, then mount ReferenceLibrary.
  Assert one `"pre"` wrapper and one insertion of each message appear after
  activation with no pre-mount DOM, extending
  `vendor/sonner/test/tests/basic.spec.ts` “toast created before the Toaster
  mounts is still shown” to the separate announcer path.

### Focus lifecycle

- [x] `TO-FOCUS-01` `[vendor]` `[browser]` —
  **Toast should restore the invoking control when focused custom content
  dismisses itself.** Focus `button#show`, activate it to show a toast, move
  focus to the toast's `button#dismiss`, and activate that button while
  `#show` remains connected, enabled, rendered, and non-inert. Assert removal
  returns `document.activeElement` to `#show` rather than `body`, porting
  `vendor/sonner/test/tests/basic.spec.ts` “return focus to the previous
  focused element” without a Toast focus region.
- [x] `TO-FOCUS-02` `[reference]` `[browser]` —
  **Toast should choose the shared proximity fallback when its prior outside
  focus target becomes invalid.** In separate runs remove, disable, hide, or
  inert `button#show` after focus enters the toast, leaving
  `button#fallback-right` as its nearest valid sibling, and then dismiss from
  inside. Assert focus lands once on `#fallback-right`, never on the invalid or
  detached node, and no toast reopens or traps focus, reusing the FocusLock
  proximity solver rather than defining a second catalog.

### Overlay coordination

- [x] `TO-OV-01` `[reference]` `[browser]` —
  **Toast should pause visible timers when a modal Overlay becomes the top
  layer.** Under `limit: 2`, consume 1000ms from two 5000ms visible toasts,
  queue a third, and open a modal Overlay for 10 seconds. Assert both visible
  records retain 4000ms, the queued record still has no timer, and no wrapper
  closes while the modal owns top-layer modality, limiting Toast ownership to
  reaction rather than Overlay mechanics.
- [x] `TO-OV-02` `[reference]` `[browser]` —
  **Toast should resume remaining time when the final top modal stops being
  active.** Consume 1200ms from a 5000ms toast, open modal A and nested modal B,
  close B through Presence, then close A through Presence before advancing
  3799ms plus one millisecond. Assert B's close does not resume the timer, A's
  completed deactivation resumes exactly 3800ms, and one dismissal follows,
  so nested layer ownership cannot release a pause early.
- [x] `TO-OV-03` `[convergence]` `[browser]` —
  **Toast should remain exposed to assistive technology when modal background
  isolation is active.** Show visual custom content and announce `"Saved"`,
  then open a modal whose Overlay kernel inerts and hides ordinary background
  roots. Assert the toast host, item, polite/assertive live paths, and required
  ancestors are exempt from `inert` and `aria-hidden` while unrelated
  background is isolated, converging Spectrum's top-layer exemption with Zag
  dismissable-branch coordination.
- [x] `TO-OV-04` `[convergence]` `[browser]` —
  **Toast should act as an Overlay interaction branch when custom content is
  clicked or focused.** Open a controlled modal Overlay with
  `onOpenChange` logging requested booleans, show a toast containing an input
  and button, then focus, type in, and pointer-click those controls. Assert the
  controls work and no `onOpenChange(false)` or outside-dismiss request is
  logged, adopting Zag's dismissable-branch behavior without making Toast an
  Overlay layer.
- [x] `TO-OV-05` `[reference]` `[browser]` —
  **Toast should leave modality untouched when it appears without an Overlay.**
  Focus an outside input, show an interactive toast, press Tab and Escape,
  attempt background pointer interaction, and inspect page scroll and
  `inert`/`aria-hidden` state. Assert showing the toast does not move focus,
  trap Tab, handle Escape, lock scroll, inert or hide siblings, or block
  background events, proving Toast itself registers no layer.

### Mounts and environments

- [x] `TO-ENV-01` `[reference]` `[ssr]` —
  **Toast should remain request-safe when imperative APIs run during server
  rendering.** In two isolated development Node request renders with throwing
  DOM getters, import the module, call `toast.define`, then call show/update/
  dismiss/dismiss-all/announce with supplied ID `"ssr"` and once without an ID
  while capturing diagnostics. Assert definitions cause no access or queue
  work, every imperative mutation is a diagnosed no-op, show returns `"ssr"`
  or a generated string, and neither request's records, timers, messages, or
  IDs appear in the other request or a later client mount.
- [x] `TO-ENV-02` `[reference]` `[react:all]` —
  **Toast should preserve one lifecycle when supported React versions mount
  and replay effects.** In React 17, 18, and 19, mount ReferenceLibrary under
  StrictMode, use one button action to show ID `"compat"` for 1000ms with
  announcement `"Ready"`, then update and dismiss it once. Assert one queue
  record, item wrapper, current render, timer, announcement mutation, close
  transition, and removal occur despite version-specific ref/effect cleanup
  behavior.
- [x] `TO-ENV-03` `[reference]` `[shadow]` —
  **Toast should keep visual and live DOM in an elected ShadowRoot when global
  APIs target its document.** Mount the first ReferenceLibrary in an open
  ShadowRoot, call targeted show/update/announce/dismiss operations from light-
  DOM code, and inspect both trees. Assert all toast stacks, items, and
  announcement nodes remain descendants of the shadow React root, no
  duplicate light-DOM host appears, and imperative identity and timers behave
  normally.
- [x] `TO-ENV-04` `[reference]` `[browser:all]` —
  **Toast should preserve timer and generation races when each browser engine
  runs the public contract.** In Chromium, Firefox, and WebKit, run a 1000ms
  timeout boundary, a 300ms-consumed hover with 700ms remaining, an explicit
  duration update, and same-frame dismiss/recreate for ID `"race"`. Assert
  identical open/closed state order, one surviving timer, and one fresh
  instance in every engine, catching differences in timers, Pointer Events,
  and transition completion.
- [x] `TO-ENV-05` `[reference]` `[browser]` —
  **Toast should isolate imperative identity when two live Documents are
  eligible.** Mount ReferenceLibrary in the top document and a same-origin
  iframe, show ID `"same"` independently in both, and target show/update/
  dismiss/dismiss-all/announce operations with each exact `Document` before
  repeating them untargeted. Assert targeted calls and timers affect only
  their owner host, both documents may retain `"same"`, and every ambiguous
  untargeted mutation emits one development diagnostic and changes neither
  queue.
- [x] `TO-A11Y-01` `[reference]` `[browser]` —
  **Toast should pass automated accessibility checks when public
  compositions exercise its semantic boundaries.** Scan fixtures containing
  application-owned interactive JSX, all six positions, a global queue limit,
  polite/assertive announcements, and modal Overlay coordination in both
  directions. Assert no violations while retaining the explicit keyboard,
  focus, timer, and mutation assertions above, because an automated scan
  cannot substitute for owned behavioral proof.

## Composition gates

- [x] `TO-COMP-01` `[reference]` `[browser]` —
  **Toast should complete a timed custom notification when visual and polite
  content are authored separately.** Define a 4000ms project-saved toast with
  an application button, show it with
  `{id: "project:42", announce: "Draft was saved"}`, and exercise its button
  before the deadline. Assert untouched JSX, one polite mutation, native focus
  and events, exact remaining-time pause, and final removal all work through
  the public ReferenceLibrary mount.
- [x] `TO-COMP-02` `[reference]` `[browser]` —
  **Toast should preserve identity when an indefinite progress definition
  becomes a timed completion definition.** Show
  `UploadingToast` as ID `"upload:report.pdf"` with `duration: false`, update
  progress props, then call `toast.update` with `UploadedToast`,
  `{fileName: "report.pdf"}`, `duration: 1500`, and announcement
  `"report.pdf was uploaded"`. Assert one wrapper/queue slot changes content
  in place, starts one 1500ms timer, announces once, and dismisses without
  inheriting loading props or untimed state.
- [x] `TO-COMP-03` `[reference]` `[browser]` —
  **Toast should preserve a limited multi-position queue when nested modal
  Overlays pause and resume it.** With global `limit: 2`, interleave five timed
  toasts across `"top-start"` and `"bottom-end"`, consume known time, and open
  nested modals before closing them in order. Assert two visible timers pause
  until the final modal deactivates, queued timers never start, positions keep
  independent FIFO DOM order, and later promotions receive full or preserved
  remaining time as appropriate.

## Owned elsewhere

- Runtime host election and pre-mount replay transport: `ReferenceLibrary`.
- Modal/layer/inert mechanics: `Overlay`; this file owns only Toast's reaction.
- Tabbable/proximity focus fallback: the shared solver proved by `FocusLock`.

## Out of scope

- Success/error/loading/promise variants, styles/icons, swipe physics, action
  layouts, hotkeys/F6 regions, reverse-tab management, or multiple toaster IDs.
- React Spectrum `useToast.ts`'s layout-effect `aria-hidden` workaround for
  visual `role=alert` content. `TO-DOM-01` deliberately separates untouched
  visual JSX from the mounted announcement path, so Reference UI has no
  duplicate visual live region to hide and reveal.
