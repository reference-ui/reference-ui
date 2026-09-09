# Overlay SPEC

Current freeze, cases, and proof. Design narrative: [Overlay.md](./Overlay.md).
System orchestration: [OVERLAYS.md](../../../OVERLAYS.md).

Playwright: `matrix/overlays/tests/e2e/overlay.spec.ts` · `overlay-exotica.spec.ts`
Fixtures: `matrix/overlays/src/fixtures/*`
Pages: `/overlay/*`

---

## Next agent — Overlay is done

**Overlay kernel is shipped.** Gate 1 defects, Must/Should production blockers, the resilience pass, and the exotic environment pass are proven in `@matrix/overlays`.

Do not add Overlay titles. Next production work is sibling gates, in order:

- [FocusLock SPEC](../FocusLock/SPEC.md) — Gate 3 containment solver
- [Popover SPEC](../Popover/SPEC.md) — Gate 4 safe polygon only
- [Tooltip SPEC](../Tooltip/SPEC.md) — Gate 5 skip-delay store
- [Toast SPEC](../Toast/SPEC.md) — Gate 6 overlay-stack pause

TalkBack virtual-modality skip stays FocusLock. Do not copy FocusLock / Portal / Popover catalogs into Overlay.

### What Overlay supports (the surface)

Three independent axes. Each axis and the seams between them are proven.

| Axis | Public surface | Proven |
| :--- | :--- | :--- |
| Geometry | Unbound · anchored (element / virtual) · `edge` | Unbound, defaults, flip/shift/arrow, four edges, Handle, virtual anchor, `closeOnScroll`, available-size vars, Trigger vs edge/virtual, nested `--index`, mixed-geometry diagnostic, RTL tokens, shadow destination, SSR skip |
| Isolation | `true` · `false` · `{ focus, inert, scroll }` patch | Default modal bundle, patch object, inert siblings / authored restore / nested shadow / a11y snapshot, pointer teardown, desktop + iOS scroll lock, RTL gutter, pinch-zoom, SSR mount gate |
| Interaction | `open` / `defaultOpen`, Trigger, Escape, outside, Handle | Controlled, nested Escape, same-tick open, modeless outside, touch defer, focus≠dismiss, Trigger activate + trap/bridge, iframe / two-root stacks |

Seams Overlay owns (not the child primitive): nested Overlay.Content is a FocusLock **shard** (`OV-FOCUS-07`); restore runs **after Presence** (`OV-RESTORE-*` timing only); `Overlay.Portal` moves Backdrop/Content, Trigger never portals.

### OS overlay coverage (do not skip)

These are the nasty cases. Cover them on Overlay. Do not invent extra IDs that restate a proven kernel test.

| OS / platform pattern | Overlay mapping | Proof |
| :--- | :--- | :--- |
| Modal dialog (Win/macOS) | Unbound + isolation default | Proven (`OV-DOM-*`, Escape, trap, inert, scroll) |
| Nested menu / popover in a dialog | One stack, child is inside + shard | Layer proven; **shard wiring** `OV-FOCUS-07` |
| Alert / destructive | App `preventDefault` on `onEscape` | Proven `OV-ESC-06` — do not add `OV-COMP-02` |
| Modeless popover / flyout | `isolation={false}`, no Backdrop | Proven `OV-ISO-02`; **geometric outside** `OV-OUT-11` |
| Context menu at a point | Virtual `anchor` + optional Trigger | `OV-POS-09` + `OV-TRG-06` (one fixture) |
| iOS/Android sheet | `edge` + Handle-only drag, inner scroll | Proven bind/threshold; **Handle vs body scroll** `OV-HND-03` |
| Stacked sheets | `--reference-overlay-index` / `-count` | `OV-EDGE-04` |
| Keyboard over a sheet (iOS Safari) | visualViewport + edge `position: fixed` | **One WebKit fixture:** `OV-EDGE-06` + `OV-SCROLL-07` |
| Click the opener that mounts the layer | Same-tick pointerdown | `OV-OUT-04` |
| Touch delayed click | Defer until click; cancel if back inside | `OV-OUT-06` |
| Focus move is not a click-outside | Focus ≠ dismiss | `OV-FOCUS-09` |
| Drawer that must not lock scroll | `isolation={{ scroll: false }}` | `OV-ISO-03` |
| Tooltip / combobox scroll-close | `closeOnScroll` | `OV-SCRL-01` + `OV-SCRL-02` (one fixture) |
| Scrollbar gap when a modal opens | Scroll-lock compensation | `OV-SCROLL-02` |
| Opener removed while closing | Presence then FocusLock fallback | `OV-RESTORE-03` timing only — **walk is `FL-RESTORE-03/04`** |

Out of Overlay kernel (owned elsewhere): TalkBack virtual-modality skip is FocusLock.

### Do not duplicate

| If you are about to write… | Stop. It lives here |
| :--- | :--- |
| Tab loop, tabbable catalog, proximity restore walk, shard Tab order | `FocusLock` `FL-TAB-*` / `FL-CAND-*` / `FL-SHARD-*` / `FL-RESTORE-03/04` |
| Nested lock pause/resume without Overlay | `FL-NEST-*` (`OV-FOCUS-06` already wires Overlay nesting) |
| Portal container element vs ref vs function | `Portal` — Overlay smokes **one** container (`OV-DOM-04`) |
| Handle without `edge` | Already `OV-DOM-09` |
| AlertDialog composition | `OV-ESC-06` |
| Cascade restore only outer origin | `OV-LAYER-06` |
| Dialog / popover-without-hover “composition smokes” | Overlay.md examples; proven kernel + Trigger cases |
| Hover polygon, delays, impatient click | `Popover` |
| Skip-delay, `aria-describedby` | `Tooltip` |
| Flip/shift/arrow defaults | Proven `OV-POS-02`–`05` (do not copy `PO-FLIP/SHIFT/ARROW`) |
| Omitted `isolation` / omitted Trigger | Isolating dialog fixtures already do this |

Do not add `OV-*` cases. Extend existing `@matrix/overlays` fixtures. Run `pnpm agent playwright overlays -g "OV-…"`. `[x]` for new work means the test asserts the **prose**. Combined titles are fine when one fixture covers two IDs that are the same OS case.

### Status (2026-09-09)

| | |
| :--- | :--- |
| Engine | Shipped |
| Production | **Yes** — Overlay-owned Must / Should / resilience / exotica are proven. TalkBack is FocusLock. |
| Named proven | Kernel + Must + resilience + exotic environment pass |
| Unit tests | Stack cascade, `resolveIsolation`, Handle thresholds, composedPath, RTL coords, document isolation, SSR `renderToString` |

`OVERLAYS.md` Gates 3–6 are the remaining overlay-*system* work, not more Overlay titles.

### Work order

**Stop Overlay work.** Siblings stay thin:

- [FocusLock SPEC](../FocusLock/SPEC.md) — containment solver
- [Popover SPEC](../Popover/SPEC.md) — hover polygon + impatient click only
- [Tooltip SPEC](../Tooltip/SPEC.md) — skip-delay + describedby + scroll-close policy
- [Toast SPEC](../Toast/SPEC.md) — queue runtime; one Overlay-stack pause seam

### Done when

- Overlay-owned rows in this file are `[x]` with prose-level asserts.
- No new Overlay SPEC cases.
- Next agent starts at FocusLock Gate 3.

---

## Freeze

Omitted `isolation` is `true` (focus + inert + scroll). `isolation={false}` turns all three off. An object patches the `true` bundle. There is no `modal` prop. Semantic role remains application markup: dialog, alertdialog, drawer, sheet, lightbox, and popover-without-hover are compositions. Popover/Tooltip remain named policy (hover, skip-delay).

Geometry is one of unbound, anchored, or `edge`. Unbound writes no coordinates. Trigger is the default floating reference only when `isolation={false}`; omitted isolation plus Trigger stays unbound. Explicit `anchor` is anchored regardless of isolation. Explicit `edge` is viewport-bound regardless of isolation. Anchored Content is the floating element with ported defaults: `placement="bottom-start"`, `offset=8`, `collisionPadding=8`, absolute strategy, flip/shift enabled. `Overlay.Arrow` participates only while anchored. `edge` binds Content to a viewport edge; flip/arrow/anchor are inert. `edge` plus `anchor` is a diagnostic.

`Overlay.Trigger` is optional, never portalled, and requests `onOpen` / `onDismiss`. Handle-only drag applies only with `edge`.

AlertDialog's non-dismissible Escape policy is authored by preventing `onEscape`; Overlay does not infer behavior from a role string.

## Legend

- `[x]` Playwright title contains this case ID **and** the test asserts the prose (production bar). Older `[x]` entries may only match the ID; do not weaken them.
- `[ ]` Specified; not proven. Engine may still exist in source.

## Part contract

`Overlay.Trigger` is a fixed `ReferencePartProps<"button">` part. `Overlay.Backdrop`, `Overlay.Content`, `Overlay.Arrow`, and `Overlay.Handle` are fixed `ReferencePartProps<"div">` parts. Arrow participates only while anchored; Handle participates only with `edge`. `Overlay` and `Overlay.Portal` are transparent. Shared `PART-*` checks live in `TESTING.md`.

## Source evidence

- Radix `dismissable-layer` tests + `e2e/{dialog,popover,dropdown-menu}.spec.ts`
- React Aria `usePreventScroll` / `ariaHideOutside` / `useInteractOutside`
- `vendor/react-remove-scroll`, `aria-hidden`, FocusLock, a11y-dialog
- Zag layer-stack cascade + recently-removed focus race
- `vendor/floating-ui` core + DOM (`@floating-ui/react` remains leave)

---

## Production blockers

Full freeze text. These are the only Overlay cases to implement or prove next.

### Must 1 — Dismiss races

- [x] `OV-OUT-04` `[vendor]` `[browser]` —
  **Overlay should not immediately dismiss when the pointerdown that opens it
  is also outside its newly mounted Content.**
  Start closed and have a source control set `open={true}` from its primary
  `pointerdown`, allowing document listeners to settle normally. Assert that
  the opening event produces no `onOutsidePress` or `onDismiss`, Content stays
  open, and only a later independent outside sequence can request close.
- [x] `OV-OUT-11` `[reference]` `[browser]` —
  **Overlay should retain cancelable geometric outside dismissal when no
  Backdrop part is authored.**
  Mount valid open Content without Backdrop, place a background control beyond
  its bounding rect, and perform a primary pointer sequence in that outside
  region with and without `onOutsidePress.preventDefault()`. Assert the normal
  path calls granular then high-level dismissal, the prevented path skips
  `onDismiss`, and the actual background control remains inert and unactivated.
- [x] `OV-OUT-06` `[vendor]` `[touch]` —
  **Overlay should cancel stale outside dismissal when a deferred touch
  sequence returns inside or is canceled before click.**
  Touch Backdrop and verify no callback at `pointerdown`, then either complete
  the matching click, move down inside Content first, or cancel before click.
  Assert only the uninterrupted outside sequence requests one dismissal and
  the other paths stay silent, matching Radix `dismissable-layer.test.tsx`
  (“defers touch pointer down outside dismissal until click” and “cancels
  pending touch outside dismissal when pointer down moves back inside”).
- [x] `OV-FOCUS-09` `[convergence]` `[browser]` —
  **Overlay should never treat focus movement by itself as an outside-dismiss
  command.**
  Open with `initialFocus={false}` while focus remains on the source, then in a
  second fixture enter Content and programmatically focus an outside element
  without a pointer sequence. Assert the first state causes no immediate
  dismissal and the second is reclaimed by FocusLock, with
  `onOutsidePress`/`onDismiss` empty in both. Modal focus containment and
  pointer dismissal are separate policies; Reference UI deliberately does not
  copy Radix focus-outside dismissal.

### Must 2 — Isolation API

- [x] `OV-ISO-03` `[reference]` `[browser]` —
  **Overlay should patch the isolating bundle when `isolation` is an
  object.**
  Open Overlay with `isolation={{ scroll: false }}` then with
  `{ focus: false, inert: true, scroll: true }`. Assert omitted keys stay
  on in the first fixture, and only the named combination runs in the
  second; iOS position-fixed follows `scroll` on edge overlays only.
- [x] `OV-ISO-04` `[reference]` `[browser]` —
  **Overlay should defer outside-press only while inert isolation is on.**
  Compare omitted isolation with `isolation={false}` on an outside
  pointerdown that is not a Backdrop. Assert the isolating path waits for
  the deferred click (no dismiss at pointerdown) and the non-isolating
  path dismisses on the initial outside event. Do not block this case
  on a full password-manager extension fixture (`OV-OUT-07` is Parked).

### Must 3 — Trigger

- [x] `OV-TRG-03` `[reference]` `[browser]` —
  **Overlay.Trigger should request open and dismiss from unprevented
  activation.**
  Click, Enter, and Space a closed then open Trigger. Assert `onOpen` while
  closed and `onDismiss` while open, consumer handlers run first, and
  `preventDefault()` cancels the built-in request. Repeat with `disabled`:
  no requests.
- [x] `OV-TRG-04` `[reference]` `[browser]` —
  **Overlay.Trigger should remain outside the focus lock when isolation
  focus is on.**
  Open isolating Overlay from Trigger. Assert focus moves into Content,
  Tab cycles inside Content, and Trigger is not a trap stop. Restore-after-
  Presence is already `OV-RESTORE-01` — do not re-assert it here.
- [x] `OV-TRG-05` `[reference]` `[browser]` —
  **Overlay should bridge Tab from Trigger into Content when isolation
  focus is off.**
  Open `isolation={false}` Overlay from Trigger with two focusable Content
  controls. Tab from Trigger into Content, then Tab past the last control.
  Assert focus enters Content, then advances relative to Trigger and one
  `onDismiss` fires; this is the former Popover tab-order bridge.

### Must 4 — Focus + restore

- [x] `OV-FOCUS-07` `[reference]` `[browser]` —
  **Overlay should register portalled child Content as a FocusLock shard.**
  Open a parent Overlay with a nested Popover or Menu whose Content portals
  elsewhere, then Tab or programmatically focus its first control. Assert
  Overlay wired that node as a shard so focus stays in the child without
  parent reclaim, then parent policy resumes after unmount. Do not re-prove
  shard Tab order, overlap, or shadow catalogs (`FL-SHARD-*`).
- [x] `OV-RESTORE-03` `[vendor]` `[browser]` —
  **Overlay should restore only after Presence when the opener is gone.**
  Open from a trigger, start close, remove or disable the trigger before the
  owned exit ends. Assert no restore during exit, then after Presence one live
  candidate receives focus (not a detached node). The right/left/ancestor
  walk is `FL-RESTORE-03` / `FL-RESTORE-04` — do not copy that matrix here.
- [x] `OV-RESTORE-04` `[reference]` `[browser]` —
  **Overlay should not steal focus after Presence when `restoreFocus={false}`.**
  Start an animated close with `restoreFocus={false}` and move focus to a valid
  outside target as part of the close workflow. Assert Presence tears down
  isolation without restoring the opener. Skip-restore itself is
  `FL-RESTORE-02` — Overlay only proves it does not override that after exit.
- [x] `OV-RESTORE-05` `[reference]` `[browser]` —
  **Overlay should cancel pending focus restoration when it reopens during
  exit.**
  Same Presence reopen as proven `OV-POINTER-06`: begin close, reopen before
  exit, dispatch stale end events. Assert focus stays in the live Overlay and
  trigger restore is canceled (pointer teardown is already proven there).
  Extend that fixture; do not duplicate the reopen harness.

### Must 5 — Edge / iOS

- [x] `OV-HND-03` `[reference]` `[touch]` —
  **Overlay should keep overflowing Content scrollable while Handle
  drags.**
  Mount edge Content with a tall scrollable body and a Handle. Scroll the
  body, then drag Handle. Assert body scroll does not request dismiss and
  Handle drag does not scroll the body. This freezes Handle-only against
  Vaul drag-anywhere.
- [x] `OV-EDGE-06` `[vendor]` `[touch]` —
  **Overlay should apply iOS position-fixed when edge isolation scroll is
  on.**
  One WebKit fixture with `OV-SCROLL-07`: open isolating `edge="bottom"`
  at a nonzero offset, focus an inner input, resize `visualViewport`. Assert
  body `position: fixed` restore, nested edge overlays skip a second fixed
  lock, Content does not jump, and page offset restores after teardown.
  This ports Vaul `use-position-fixed.ts` plus Aria visualViewport. Do not
  split into two iOS keyboard tests.
- [x] `OV-SCROLL-07` `[vendor]` `[touch]` —
  **Overlay should keep page position stable when Mobile Safari changes
  visualViewport around a focused input.**
  Covered in the `OV-EDGE-06` WebKit fixture (keyboard / address-bar /
  visualViewport). If proving an unbound dialog instead of a sheet, the
  same visualViewport asserts apply without a second `position: fixed`.

### Must 6 — Geometry policy

- [x] `OV-POS-09` `[vendor]` `[browser]` —
  **Overlay should accept virtual anchors as positioning references.**
  One fixture with `OV-TRG-06`: `anchor` as `{x, y}` (and a sized rect or
  mutating `getBoundingClientRect` if cheap). Assert point anchors have
  implicit zero size, coordinates follow the virtual rect, and Trigger
  remains the interaction source (`aria-expanded`, open request) when
  present. Do not port the entire Floating UI `virtual-element.test.ts`
  matrix onto Overlay.
- [x] `OV-SCRL-02` `[reference]` `[browser]` —
  **Overlay should request one dismiss when `closeOnScroll` is true and a
  composed ancestor moves the reference.**
  One fixture with `OV-SCRL-01`: omitted `closeOnScroll` updates coordinates
  with no `onDismiss`; `closeOnScroll` requests one dismiss from that ancestor
  scroll, none from unrelated regions or from scrolling an inner
  `input`/`textarea`.

### Should — same Overlay pass

Do these while already in Overlay source. Do not open a new epic for them.

- [x] `OV-DOM-04` `[reference]` `[browser]` —
  **Overlay should honor Overlay.Portal's container and never portal Trigger.**
  Open Overlay with Trigger, one `Overlay.Portal container={element}`,
  Backdrop, and Content. Assert Backdrop and Content are in that container
  with no Overlay wrapper host, and Trigger stays in source DOM.
  Element vs ref vs function is `Portal`'s contract — do not parameterize
  all three here. Absorbs `OV-TRG-07`.
- [x] `OV-TRG-06` `[reference]` `[browser]` —
  **Overlay should keep Trigger as the interaction source when `anchor`
  wins geometry.**
  Covered by the `OV-POS-09` fixture. Do not write a second test.
- [x] `OV-EDGE-03` `[reference]` `[browser]` —
  **Overlay should treat Trigger as an opener, not a floating reference,
  when `edge` is set.**
  Open `edge="bottom"` Overlay from Trigger. Assert Trigger remains in
  source DOM and Content binds to the viewport bottom rather than the
  button rect.
- [x] `OV-EDGE-04` `[vendor]` `[browser]` —
  **Overlay should publish nested edge stack CSS variables.**
  Open two nested `edge="bottom"` Overlays. Assert `--reference-overlay-index`
  and `--reference-overlay-count` on each Content distinguish topmost from
  parent so CSS can displace. This ports Vaul nested displacement and
  Sonner `--index` language, not the toast queue.
- [x] `OV-SCROLL-02` `[vendor]` `[browser]` —
  **Overlay should avoid layout shift when locking a page that has a visible
  scrollbar and authored root styles.**
  Record fixed element rects and existing html/body overflow, padding, margin,
  and `scrollbar-gutter`, then open and fully close Overlay. Assert scrollbar
  width is compensated without rect shift and every authored value and
  priority restores exactly, rather than overwriting a zero or pre-existing
  declaration.
- [x] `OV-POS-06` `[vendor]` `[browser]` —
  **Overlay should publish available and anchor geometry for scrolling
  popups.**
  Anchor a tall Content near a short viewport and read
  `--reference-overlay-available-height` / `-width` plus anchor size and
  transform origin. Assert finite values that match the engine's size
  middleware after shift, with no ResizeObserver loop. This ports
  `size.test.ts` and Floating UI #1740.
- [x] `OV-SCRL-01` `[reference]` `[browser]` —
  **Overlay should keep a living anchored position when `closeOnScroll`
  is omitted.**
  Covered by the `OV-SCRL-02` fixture (omitted vs true). Do not write a
  second test.
- [x] `OV-EDGE-02` `[reference]` `[browser]` —
  **Overlay should reject `edge` combined with `anchor`.**
  Mount Overlay with both `edge="bottom"` and a virtual `anchor`. Assert a
  development diagnostic and that neither Floating UI coordinates nor an
  edge binding is partially applied.
- [x] `OV-INERT-02` `[vendor]` `[browser]` —
  **Overlay should preserve pre-existing isolation attributes when it closes.**
  Mark separate background nodes `inert` and `aria-hidden="true"` before
  opening, add ordinary siblings for Overlay to manage, then complete close.
  Assert authored attributes remain exactly as supplied and only
  Overlay-owned additions are removed, covering React Aria
  `ariaHideOutside.test.js` (“should not overwrite an existing aria-hidden
  prop”).

### Absorbed — do not implement as Overlay E2E

- [x] `OV-HND-04` — Handle without `edge`: already `OV-DOM-09`.
- [x] `OV-TRG-07` — Trigger never portals: part of `OV-DOM-04`.
- [x] `OV-COMP-05` `[reference]` `[browser]` —
  **Overlay should express a labeled dialog from Overlay.Trigger without a
  Popover root.**
  Overlay.md example, not a new contract. Proven kernel + `OV-TRG-03` /
  `OV-TRG-04` / `OV-ESC-*`. Do not add a composition suite.
- [x] `OV-COMP-06` `[reference]` `[browser]` —
  **Overlay should express a non-isolating anchored panel from Trigger
  without hover policy.**
  Overlay.md example. Proven `OV-ISO-02` + `OV-TRG-05` + living position.
  Hover policy stays `Popover`.

---

## Proven kernel — do not redo

Engine + named Playwright coverage. Do not rewrite these tests. If a Must case needs a fixture, extend; do not duplicate.

### DOM, portal, controlled state

- [x] `OV-DOM-01` — Default portal: Backdrop and Content are sibling `div`s under `document.body`; Overlay and Portal add no host nodes.
- [x] `OV-DOM-02` — Unbound Content invents no trigger, role, label, `aria-modal`, coordinates, or appearance.
- [x] `OV-DOM-05` — Initially closed with no exit: no parts, portal payload, focus lock, inert, layer, or scroll lock.
- [x] `OV-DOM-06` — Controlled `open` only; programmatic open/close never calls `onEscape` / `onOutsidePress` / `onDismiss`.
- [x] `OV-DOM-07` — Parent rejects dismiss: DOM, focus, inert, layer, and scroll lock stay active.
- [x] `OV-DOM-08` — Duplicate Backdrop/Content/Trigger/Handle fails atomically; no partial layer.
- [x] `OV-DOM-09` — Missing Content or Handle-without-`edge` is invalid; valid shapes activate one layer.
- [x] `OV-THEME-01` — Portaled dark `colorMode`: `data-layer` + `data-panda-theme="dark"`, token background resolves.
- [x] `OV-THEME-02` — Light-mode sibling of `OV-THEME-01` (same Playwright test).

### Escape, outside press, layer stack, pointer isolation

- [x] `OV-ESC-01` — Escape → `onEscape(event)` then `onDismiss()` once.
- [x] `OV-ESC-02` — `onEscape.preventDefault()` skips `onDismiss`; isolation stays.
- [x] `OV-ESC-03` — Latest callback after rerender.
- [x] `OV-ESC-04` — Nested: first Escape is child-only; next is parent.
- [x] `OV-ESC-06` — AlertDialog via prevented `onEscape`; Overlay does not read `role`.
- [x] `OV-OUT-01` — Backdrop primary sequence: `onOutsidePress` then `onDismiss`.
- [x] `OV-OUT-02` — Inside Content: no dismiss.
- [x] `OV-OUT-03` — `onOutsidePress.preventDefault()` skips `onDismiss`.
- [x] `OV-OUT-05` — Non-primary / pen barrel: no dismiss (frozen vs current Radix).
- [x] `OV-OUT-08` — Backdrop that `stopPropagation`s click still dismisses.
- [x] `OV-OUT-09` — `composedPath`: inner shadow is inside; sibling shadow is outside.
- [x] `OV-LAYER-01` — Portalled child popup is inside the parent (branch + shard).
- [x] `OV-LAYER-02` — Press in parent, outside child: child only.
- [x] `OV-LAYER-03` — One physical outside event → topmost child only (not Radix close-both).
- [x] `OV-LAYER-04` — Deferred modal parent does not close from the child's outside touch.
- [x] `OV-LAYER-05` — Child dismiss clears parent's pending outside interaction.
- [x] `OV-LAYER-06` — Parent close cascades deepest-first; recently-removed child cannot outside-dismiss an ancestor.
- [x] `OV-POINTER-01` — Background pointer activation blocked while modal.
- [x] `OV-POINTER-02` — Consumer `pointer-events` restored byte-for-byte.
- [x] `OV-POINTER-03` — Nested modals: refcount until final Presence exit.
- [x] `OV-POINTER-04` — Only top modal Content is interactive.
- [x] `OV-POINTER-05` — Isolation through animated exit.
- [x] `OV-POINTER-06` — Reopen during exit cancels pointer teardown.

### Focus, restore, Presence

- [x] `OV-FOCUS-01` — Default initial focus: first tabbable.
- [x] `OV-FOCUS-02` — `initialFocus` ref / resolver; invalid falls back inside the lock.
- [x] `OV-FOCUS-03` — `initialFocus={false}` skips the move; trap still runs once inside.
- [x] `OV-FOCUS-04` — Tab / Shift+Tab loop; programmatic outside focus reclaimed.
- [x] `OV-FOCUS-05` — Focused descendant removed / disabled / hidden stays contained.
- [x] `OV-FOCUS-06` — Nested modal pauses parent lock and resumes without reclaim fight.
- [x] `OV-RESTORE-01` — Restore only after animated Presence exit.
- [x] `OV-RESTORE-02` — Zero-duration close restores in the completed close turn.
- [x] `OV-RESTORE-07` — Explicit `restoreFocus` target after Presence.
- [x] `OV-PRES-01` — Closed `data-state` while both parts finish owned CSS exit.
- [x] `OV-PRES-02` — Waits for the slower of Backdrop / Content.
- [x] `OV-PRES-03` — Ignores bubbled child animation events.
- [x] `OV-PRES-04` — Reduced motion / zero motion completes without fallback sleep.
- [x] `OV-PRES-05` — Rapid close/reopen/close: one current lifecycle.

### Isolation, scroll, edge, geometry, trigger

- [x] `OV-INERT-01` — Unrelated siblings inert / a11y-hidden; Content reachable.
- [x] `OV-INERT-05` — Live regions, toast host, registered child branch stay accessible.
- [x] `OV-SCROLL-01` — Document offset preserved against background wheel/touch/keys.
- [x] `OV-SCROLL-03` — Inner scroller consumes until edge; excess does not chain to the document.
- [x] `OV-ISO-02` — `isolation={false}`: no FocusLock, inert, or scroll lock; immediate light-dismiss.
- [x] `OV-EDGE-01` — All four `edge` bindings; flip/arrow inert; orthogonal available-size vars.
- [x] `OV-HND-01` — Handle dismiss at 25% or velocity flick.
- [x] `OV-HND-02` — Sub-threshold drag snaps back; no `onDismiss`.
- [x] `OV-POS-01` — Unbound writes no `position`/`top`/`left` or geometry CSS vars.
- [x] `OV-POS-02` — Anchored defaults: `bottom-start`, offset 8, collisionPadding 8, absolute, flip/shift, `--reference-overlay-*`.
- [x] `OV-POS-03` — Flip/shift vs `flip={false}` / `shift={false}`.
- [x] `OV-POS-04` — Explicit offset, collisionPadding, `strategy="fixed"`; consumer `transform` untouched.
- [x] `OV-POS-05` — Arrow `edgePadding` in the same position pass; visual `padding` stays a StyleProp.
- [x] `OV-TRG-02` — Trigger is in-source `button[type=button]`, default floating reference when `isolation={false}`.

---

## Resilience pass

These items were unparked to harden the Overlay kernel against real-world race conditions, React lifecycles, and ecosystem interference. Proven. Do not redo.

### Lifecycle & Teardown Safety

- [x] `OV-LAYER-08` `[reference]` `[browser]` —
  **Overlay should retain a valid stack when layers are removed out of
  registration order.**
  Open three related and sibling layers, unmount the middle and then another
  non-top layer, and inspect behavior after each removal. Assert dead layers
  and branch registrations cannot receive events, the remaining order is
  stable, and the next live top layer resumes Escape and outside handling.
- [x] `OV-INERT-03` `[vendor]` `[browser]` —
  **Overlay should keep background hidden when nested instances close in any
  order.**
  Open two nested or sibling modals and complete their exits in both parent-
  first and child-first order. Assert reference-counted inert and ARIA hiding
  never releases any shared background node while one modal remains and
  restores each owned attribute once after the last exit, matching React Aria
  `ariaHideOutside.test.js` (“work when called multiple times and restored out
  of order”).
- [x] `OV-SCROLL-05` `[vendor]` `[browser]` —
  **Overlay should retain one document scroll lock when nested modals exit out
  of order.**
  Open two modals, close and finish them in each possible order, and attempt
  document scrolling between every step. Assert one reference-counted lock
  survives until the final modal exit and releases afterward, covering React
  Aria `usePreventScroll.test.js` (“should work with nested/multiple modals
  regardless of unmount order”).
- [x] `OV-INERT-07` `[reference]` `[browser]` —
  **Overlay should restore background attributes once when animated exit
  completes and cancel that restoration when it reopens.**
  Record authored inert/ARIA state, close through a multi-part exit, and in a
  second run reopen before completion while firing stale end events. Assert
  normal final exit removes only Overlay-owned attributes once, while reopen
  leaves current isolation untouched.
- [x] `OV-SCROLL-10` `[reference]` `[browser]` —
  **Overlay should clean scroll-lock effects exactly once when lifecycle
  teardown is interrupted or exceptional.**
  Exercise animated close/reopen, direct unmount, and a child render that
  throws after lock activation while instrumenting non-passive listeners and
  html/body inline styles. Assert stale listeners are removed, current ones
  remain as needed, and final cleanup restores every owned style/listener once
  with no leak or double removal.
- [x] `OV-ENV-04` `[reference]` `[react:all]` —
  **Overlay should perform one modal side effect when React version or
  StrictMode replays lifecycle work.**
  Run the same open, Escape/outside request, and close fixture under React 17,
  18, and 19 with available StrictMode replay. Assert one portal payload, one
  live stack entry, one observer/listener set, and one callback per physical
  event, followed by one cleanup.

### Dynamic Ecosystem Resilience

- [x] `OV-OUT-07` `[vendor]` `[browser]` —
  **Overlay should stay open when an unregistered extension overlay stops the
  later events of a deferred outside sequence.**
  Open an extension/password-style sibling overlay outside Content whose
  `mousedown`, `mouseup`, and `click` handlers stop propagation, then activate
  its control. Assert no deferred `onOutsidePress` or `onDismiss` occurs,
  preserving Radix `e2e/dialog.spec.ts` (“keeps the dialog open when an outside
  overlay stops later mouse events”).
- [x] `OV-ESC-07` `[convergence]` `[browser]` —
  **Overlay should wait to handle Escape when a native top-layer popover
  consumes the first key.**
  Open an Overlay containing an active element using the browser's native
  popover top layer, focus within that top layer, and press Escape twice.
  Assert the first key closes only the native popover with no Overlay callback
  and the later key requests Overlay dismissal, preserving browser top-layer
  precedence.
- [x] `OV-INERT-04` `[vendor]` `[browser]` —
  **Overlay should classify dynamic nodes correctly when they are inserted or
  reparented during an active modal.**
  Add controls outside Content, add descendants inside Content, and reparent
  nodes across that boundary while the observer is active. Assert outside
  nodes become effectively inert/hidden, inside nodes remain available, and
  stale ownership is cleaned, covering React Aria `ariaHideOutside.test.js`
  (“should handle when a new element is added and then reparented”).

### Living Geometry & Shards

- [x] `OV-SCROLL-04` `[vendor]` `[browser]` —
  **Overlay should apply the same edge-aware scrolling rules when the
  scrollable is in a registered portalled shard.**
  Register child popup Content outside the parent DOM, give it a bounded
  scroll region, and wheel/touch through middle and edge positions. Assert the
  shard consumes available movement, document position stays fixed at its
  edges, and unregistered background scrollers remain blocked.
- [x] `OV-POS-07` `[vendor]` `[browser]` —
  **Overlay should expose clip flags without closing itself.**
  Scroll an anchored reference until it is clipped and until Content escapes
  its clipping context. Assert `data-anchor-hidden` / `data-escaped` follow
  hide middleware while `open` stays true and no `onDismiss` fires; close-on-
  clip is product policy. This ports `hide.test.ts`.
- [x] `OV-POS-08` `[vendor]` `[browser]` —
  **Overlay should keep a living position while open.**
  Anchor Content, then scroll ancestors of reference and floating, resize,
  zoom, and move `visualViewport`. Assert one live autoUpdate subscription,
  Content coordinates follow, and listeners drop after Presence exit. This
  ports `autoUpdate.ts` functional tests. (`OV-SCRL-01` is the Overlay policy
  half; this is the full Floating UI autoUpdate matrix.)

### Focus Robustness

- [x] `OV-RESTORE-06` `[reference]` `[browser]` —
  **Overlay should restore only the outer origin when closing a parent cascades
  through nested layers.**
  Open a parent from an outer trigger, open descendants from controls that will
  disappear with the parent, and close the parent. Assert deepest-first
  teardown never focuses removed child triggers and final exit produces one
  restoration to the outer original trigger. (`OV-LAYER-06` already covers the
  cascade; only reopen this if restore lands on a child trigger.)
- [x] `OV-FOCUS-08` `[reference]` `[browser]` —
  **Overlay should resolve initial focus after Content mounts when its public
  ref and internal FocusLock ref are composed.**
  Open custom-portalled Content with a consumer callback ref and an
  `initialFocus` resolver that reads a descendant from that mounted node, then
  rerender unrelated StyleProps. Assert the Content ref attaches before one
  resolver-driven focus move and the rerender causes neither ref churn nor a
  second move; generic ref stability remains covered by `PART-REF-*`.

## Exotic environment pass

Same-document kernel leftovers plus iframe / two-root / Shadow / SSR / RTL. Proven 2026-09-09. Do not reopen unless a production bug names the ID.

### Dismiss / layer / focus leftovers

- [x] `OV-ESC-05` `[reference]` `[browser]` —
  **Overlay should ignore inactive and foreign-document layers when Escape is
  pressed in the active document.**
  Keep one layer closed or exiting in the main document and another open in a
  same-origin iframe, then activate a live main-document Overlay and press
  Escape there. Assert only that document's top live layer receives callbacks;
  exiting and iframe stacks do not intercept or reorder the event.

- [x] `OV-OUT-10` `[reference]` `[browser]` —
  **Overlay should avoid a second dismissal path when focus moves during a
  deferred stopped pointer interaction.**
  Begin an outside deferred pointer sequence on an unregistered control that
  stops later mouse and click events, move focus to it before release, and
  complete the sequence. Assert neither focus movement nor the blocked pointer
  path calls `onDismiss`, matching Radix `dismissable-layer.test.tsx` (“does
  not dismiss when focus moves outside during a deferred stopped
  interaction”).
- [x] `OV-LAYER-07` `[reference]` `[browser]` —
  **Overlay should share top-layer ordering when sibling instances live in
  independent React roots.**
  Mount one open Overlay in each of two roots in the same document, activate
  them in a known order, and send Escape and outside presses. Assert only the
  most recently active live layer receives each event and the older layer
  resumes after the newer one closes.

- [x] `OV-LAYER-09` `[reference]` `[browser]` —
  **Overlay should update dismissal and focus membership together when a
  registered branch mounts, reparents, or unmounts.**
  While a parent is open, dynamically add a portalled child branch, move its
  node between valid containers, and remove it while sending focus and pointer
  input. Assert each live location is simultaneously inside for outside-press
  and FocusLock, and the removed location is simultaneously stale for neither.
- [x] `OV-LAYER-10` `[reference]` `[browser]` —
  **Overlay should keep layer stacks independent when open instances belong to
  different Documents.**
  Open layers in the main document and a same-origin iframe document, activate
  each, and send Escape/outside input within both contexts. Assert callbacks
  route only through the source document's ordering and closing either stack
  does not unregister or promote entries in the other.

- [x] `OV-RESTORE-08` `[reference]` `[browser]` —
  **Overlay should resolve the latest return target when a `restoreFocus`
  resolver changes its result during exit.**
  Begin an animated close with a resolver returning button A, switch its current
  result to button B while Content remains mounted, and complete Presence.
  Assert no early return occurs and the resolver is evaluated at completed
  teardown so B, not stale A or the captured origin, receives focus once.
- [x] `OV-DOM-03` `[reference]` `[browser]` —
  **Overlay should keep lifecycle state authoritative when Backdrop and Content
  also use token-aware visual StyleProps.**
  Give both fixed `ReferencePartProps<"div">` parts unrelated base and
  responsive StyleProps, then drive controlled open and Presence exit. Assert
  synchronized `data-state="open"|"closed"` on both parts while their computed
  visual styles remain intact; generic prop, ref, event, and StyleProps coverage
  belongs to the shared `PART-*` matrix.


### Inert leftovers

- [x] `OV-INERT-06` `[vendor]` `[shadow]` —
  **Overlay should hide the correct siblings when Content is reached through
  nested open ShadowRoots.**
  Portal Content into a deeply nested open ShadowRoot with unrelated siblings
  at inner, outer-shadow, and document levels, then open it. Assert those
  siblings are effectively hidden while every direct shadow host ancestor
  needed to reach Content remains visible, matching React Aria
  `ariaHideOutside.test.js` (“should handle a modal inside nested Shadow DOM
  structures and hide sibling content in the outer shadow root”).

- [x] `OV-INERT-08` `[reference]` `[browser]` —
  **Overlay should expose only the dialog subtree when an accessibility check
  runs during its modal state.**
  Compose labeled `role="dialog"` Content over named background controls and
  take role queries, an accessibility snapshot, and the configured automated
  check while open. Assert background controls are absent, the dialog and its
  computed name are present, and Content descendants retain expected roles;
  this checks public accessibility output rather than attributes alone.
- [x] `OV-INERT-09` `[vendor]` `[browser]` —
  **Overlay should treat an already aria-hidden ancestor as one opaque
  background boundary instead of traversing and rewriting its descendants.**
  Place a large subtree beneath an authored `aria-hidden="true"` container,
  instrument descendant attribute mutations, and open and close Overlay beside
  it. Assert the ancestor remains exactly authored, no descendant receives
  duplicate Overlay-owned hiding, ordinary visible siblings are still managed
  once, and cleanup performs no descendant churn. This ports React Aria
  `ariaHideOutside.test.js` “should not traverse into an already hidden
  container.”
- [x] `OV-INERT-10` `[vendor]` `[browser]` —
  **Overlay should preserve isolation when a dynamic node is reparented into
  an already managed hidden subtree.**
  Insert a focusable background node during an active modal, let Overlay hide
  it, then move it beneath a pre-hidden or currently managed background
  ancestor and later back to an ordinary sibling. Assert it never becomes
  accessibility- or pointer-reachable during either move, ownership remains
  deduplicated, and final teardown restores only attributes Overlay actually
  added. This ports React Aria's add-then-reparent hidden-container regression.

### Scroll / env leftovers


- [x] `OV-SCROLL-06` `[reference]` `[browser]` —
  **Overlay should allow pinch zoom when ordinary one-finger background touch
  scrolling is locked.**
  Open Overlay on a touch-capable fixture, send a one-finger drag over
  background and a two-contact pinch gesture, and observe page offset and
  viewport scale. Assert the drag cannot scroll the page while pinch zoom is
  not canceled, separating accessibility zoom from background scrolling.
- [x] `OV-SCROLL-08` `[reference]` `[rtl]` —
  **Overlay should compensate the logical scrollbar side when a locked
  document is RTL.**
  Open a scrollbar-bearing `dir="rtl"` page with measurable edge-aligned
  content and pre-existing logical padding/margins. Assert compensation appears
  on the browser's actual logical scrollbar side, no content rect shifts, and
  authored styles restore after close.
- [x] `OV-SCROLL-09` `[reference]` `[shadow]` —
  **Overlay should distinguish allowed Content scrolling from background
  scrolling when event paths cross Shadow DOM.**
  Place an internal scroller and a background scroller in separate open
  ShadowRoots, open Overlay, and send composed wheel/touch paths at middle and
  edge positions. Assert Content movement follows edge rules while background
  and document offsets remain fixed despite event retargeting.

- [x] `OV-ENV-01` `[reference]` `[ssr]` —
  **Overlay should server-render safely when it is closed and no DOM globals
  exist.**
  Render `open={false}` in an environment without `window` or `document`,
  hydrate the same authored IDs in a browser, and open afterward. Assert no
  server access error or hydration warning, stable IDs, and normal portal and
  modal activation only after the controlled open.
- [x] `OV-ENV-02` `[reference]` `[ssr]` —
  **Overlay should defer modal activation when `open={true}` is rendered on the
  server.**
  Server-render an initially open fixture through Portal's mount gate and
  hydrate it on the client. Assert server markup and first hydration frame
  produce no portal mismatch or DOM-global access, then exactly one portal,
  layer entry, focus lock, inert pass, and scroll lock activate after mount.
- [x] `OV-ENV-03` `[reference]` `[shadow]` —
  **Overlay should retain its full modal contract when a custom portal targets
  a ShadowRoot.**
  Portal Backdrop and Content into an open ShadowRoot and exercise focus
  containment, inside/outside composed pointer paths, nested inert traversal,
  and internal-versus-background scrolling. Assert each public behavior matches
  ordinary document portals and cleanup leaves no host or document residue.


### Geometry / edge leftovers

- [x] `OV-POS-10` `[reference]` `[browser]` `[rtl]` —
  **Overlay should keep physical placement tokens in RTL.**
  Anchor Content with `placement="bottom-start"` under `dir="rtl"`. Assert
  the engine still uses that token, alignment follows the ported RTL rules,
  and no extra Overlay transform is applied.
- [x] `OV-POS-11` `[reference]` `[ssr]` —
  **Overlay should skip geometry on the server and attach after hydration.**
  Server-render an anchored open Overlay, hydrate, then wait for client
  autoUpdate. Assert no `window` access during SSR, no hydration mismatch,
  and coordinates appear only after mount.
- [x] `OV-POS-12` `[reference]` `[shadow]` —
  **Overlay should position inside an open ShadowRoot destination.**
  Portal anchored Content into an open ShadowRoot and scroll a shadow
  ancestor. Assert coordinates resolve against that root, not light DOM,
  and autoUpdate still tracks.
- [x] `OV-EDGE-05` `[reference]` `[browser]` `[rtl]` —
  **Overlay should keep physical `left` / `right` edges in RTL.**
  Open `edge="left"` under `dir="rtl"`. Assert the binding stays the
  physical left side; RTL does not swap `edge` tokens.

## Owned elsewhere

- FocusTarget validity, tabbable/shard behavior, and restore-proximity solver matrix: `FocusLock`.
- Transition/animation detection: `Presence`.
- Portal destination semantics: `Portal`.
- Hover grace, impatient click, and hover delays: `Popover`.
- Skip-delay group, describedby, non-interactive content: `Tooltip`.
- Toast timer reaction to top isolating Overlay: `Toast`.
- Menu submenu intent: `Menu`.

## Out of scope

- Native `<dialog>` as a second runtime, semantic Dialog/Drawer/Popover
  components, visual styles, snap points, iOS scale-behind, a public
  Provider, drag-anywhere on Content, or `@floating-ui/react` as runtime.
- react-remove-scroll's independent `isDisabled` convenience path: an open
  Overlay with isolation `scroll` always owns an active scroll lock through
  Presence exit, so there is no second public switch that can desynchronize
  isolation.
