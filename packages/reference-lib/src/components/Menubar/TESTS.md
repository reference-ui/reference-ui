# Menubar test contract

Driver: [SPEC.md](./SPEC.md). This file is the case catalog (setup / action / assert). `[x]` here means the case is **specified**. Proof is `[x]` in SPEC.md only when a passing test title contains the ID.

Unit: `menubar-nav.test.ts` + `Menubar.test.tsx`
Page: CT stories in `Menubar.story.tsx` (`Basic`, `Submenu`, `Controlled`, `Loop`, `Rtl`, `Disabled`)

Menubar owns APG menubar coordination across independent Menu roots: one
open menu per single value, Left/Right across triggers and across open
menus, one-level Escape. Menu owns everything inside one menu (roving,
typeahead, submenus, selection); Popover/Overlay own layers and outside
dismiss. Menubar adds no second overlay runtime.

## Freeze decisions

1. One `value` names the open menu; `null` means none. Each `Menubar.Menu`
   is open exactly when the value names it — open-one-closes-others by
   construction, never by effect.
2. `onChange` fires on user-driven changes, never redundantly
   (identical requests are dropped before emit). The bar is
   controlled-only: `value` + `onChange` are required, there is no
   `defaultValue`.
3. Trigger arrows move focus always (RovingFocus); the newly focused
   trigger's menu opens too only while a menu is open. Closed bars move
   focus only. Home/End move focus only, never switch.
4. Content arrows at the root menu level switch to the adjacent menu; the
   open-direction arrow on a submenu parent opens it instead (Menu-owned).
   Arrows inside a nested submenu never switch menus (Menu-owned one level).
5. Escape is Menu-owned at every level: one level per press with focus
   return. Menubar adds no Escape handler of its own.
6. Tab rides Menu (closes, trigger-relative continuation). It is not
   menubar-aware: see SPEC.md deviations.
7. There is no hover-to-switch and no trigger-row typeahead (APG-optional;
   follow-ups, not freeze gaps).

These are coordination details, not reasons for another MenuButton or
ContextMenu component.

## Source evidence

- `vendor/radix-primitives` menubar anatomy + keyboard table — single
  `value`, `Menu`/`Trigger`/`Content`, Left/Right switch, Esc closes the
  current menu + focus to Trigger. (Fetched for prior art; see
  `.agents/missions/playtest/prior-art.md`.)
- APG menu-and-menubar pattern — Left/Right across the bar and across open
  menus, Tab closes all + moves out, Esc closes only the menu containing
  focus (one level per press). APG contradicts "Esc closes all".
- `../Menu/TESTS.md` — submenu keyboard/intent/choice contracts Menubar
  composes without re-proving; this catalog covers the coordination seam.

## Required cases

### DOM, roles, and value

- [x] `MB-DOM-01` `[reference]` `[browser]` —
  **Menubar should render a menubar row of menuitem triggers with one tab stop.**
  Render three menus closed. Assert root is `div[role=menubar]`, each
  trigger is `button[role=menuitem][aria-haspopup=menu]`,
  `aria-expanded="false"`, `data-state="closed"`, exactly one trigger has
  `tabindex="0"` (the first), and no menu content is mounted.
- [x] `MB-DOM-02` `[reference]` `[browser]` —
  **Menubar should expose controlled expansion on exactly the open menu.**
  Open File by click. Assert File trigger `aria-expanded="true"` +
  `data-state="open"` with `aria-controls` resolving to the mounted
  `role=menu`, while Edit/View stay `false`/`closed` with no controls.
- [x] `MB-DOM-03` `[reference]` `[browser]` —
  **Menubar parts should preserve native contracts through interaction.**
  Pass `data-*`, class, style, ordinary handlers, and object/callback refs
  to root, trigger, and content, then open, switch, and close. Assert each
  prop/ref reaches its documented host (`div`/`button`/Popover host),
  consumer transforms survive positioning, and no polymorphic `as` host
  appears.
- [x] `MB-DOM-04` `[reference]` `[unit]` —
  **Menubar should dev-warn on duplicate menu values.**
  Render two menus with `value="file"`. Assert one console error naming
  the duplicate value. Warn-only misuse: both menus named by the value open.
- [x] `MB-DOM-05` `[reference]` `[unit]` —
  **Menubar.Menu should default an omitted value to a stable generated id.**
  Render two value-less menus, open one by click, rerender. Assert each
  opens alone, the generated values are unique and stable, and no warning
  fires.

### Open coordination

- [x] `MB-OPEN-01` `[reference]` `[browser]` —
  **Menubar should keep at most one menu open across trigger clicks.**
  Click File (opens), click Edit (File closes, Edit opens), click View.
  Assert exactly one `role=menu` mounted after every click and the
  `aria-expanded` matrix matches the single open menu.
- [x] `MB-OPEN-02` `[reference]` `[browser]` —
  **Menubar should toggle the open menu closed on trigger re-click.**
  Open File by click, click File again. Assert no menu mounted,
  `aria-expanded="false"`, and focus on the File trigger.
- [x] `MB-OPEN-03` `[reference]` `[browser]` —
  **Menubar should remain visibly controlled when value updates are rejected.**
  Control `value="file"` with a parent that logs but ignores
  `onChange`, then click Edit. Assert one `onChange("edit")`,
  File stays open, Edit never mounts, and trigger focus/ARIA stay
  consistent with the held value.
- [x] `MB-OPEN-04` `[reference]` `[unit]` —
  **Menubar should never emit redundant identical values.**
  Controlled open/toggle/reopen cycle plus a same-value request. Assert
  the emitted sequence is exactly the change sequence
  (e.g. `["file", null, "edit"]`) with no adjacent duplicates.
- [x] `MB-OPEN-05` `[reference]` `[browser]` —
  **Menubar should close the open menu on outside press.**
  Open File, press an outside button. Assert no menu mounted and
  `aria-expanded="false"` (Overlay-owned dismiss through the single value).
- [x] `MB-OPEN-06` `[reference]` `[browser]` —
  **Menubar should close the whole bar and restore the trigger after selection.**
  Open File, click an enabled item. Assert `onSelect` once, no menu
  mounted, and focus on the File trigger (Menu-owned tree dismiss).

### Trigger keys

- [x] `MB-KEY-01` `[vendor]` `[browser]` —
  **Menubar triggers should open on Down/Enter/Space (first item) and Up (last item).**
  Focus the File trigger and press each key in fresh fixtures. Assert the
  menu opens with focus on the first enabled item (Down/Enter/Space) or
  the last enabled item (Up); this ports Menu entry behavior to the bar.
- [x] `MB-KEY-02` `[vendor]` `[browser]` —
  **Menubar should move trigger focus only when no menu is open.**
  With all menus closed, press Left/Right across the row. Assert focus
  visits each trigger in DOM order (RTL-mirrored per MB-RTL-01) and no
  menu ever mounts, with no `onChange`.
- [x] `MB-KEY-03` `[vendor]` `[browser]` —
  **Menubar should move trigger focus and switch the open menu when a menu is open.**
  Open File, focus its trigger, press Right. Assert focus on the Edit
  trigger (transiently), File closes, Edit opens, and focus lands inside
  the Edit menu; repeat across the row.
- [x] `MB-KEY-04` `[reference]` `[browser]` —
  **Menubar Home/End should move trigger focus without switching menus.**
  Open File, focus its trigger, press End then Home. Assert focus jumps to
  the last/first trigger while File stays the open menu.
- [x] `MB-KEY-05` `[reference]` `[browser]` —
  **Menubar should clamp trigger arrows at the edges unless loop is set.**
  With `loop` omitted, press Left on the first trigger and Right on the
  last (closed and open). Assert focus stays, no menu opens/switches. With
  `loop`, assert wrap-around focus and wrap-around switching.

### Content keys

- [x] `MB-KEY-06` `[vendor]` `[browser]` —
  **Menubar should switch menus on Left/Right from a root-level item.**
  Open File, focus a plain item, press Right. Assert File closes, Edit
  opens, and focus lands inside the Edit menu (container or first item —
  never the old menu, never the void). Mirror with Left.
- [x] `MB-KEY-07` `[vendor]` `[browser]` —
  **Menubar should let the open-direction arrow open a submenu parent instead of switching.**
  Focus the Share submenu trigger at File root level, press Right (LTR).
  Assert one submenu open, File still the open menu, no `onChange`,
  focus per Menu contract.
- [x] `MB-KEY-08` `[reference]` `[browser]` —
  **Menubar should never switch menus from inside a nested submenu.**
  Focus an item in an open nested submenu, press Left then Right. Assert
  Menu-owned one-level behavior only (close/restore or nothing), the bar
  value unchanged, no menu switch.
- [x] `MB-KEY-09` `[reference]` `[browser]` —
  **Menubar moves should skip disabled menus.**
  Render File, disabled Help, Edit. Arrow across triggers and across open
  menus. Assert focus and switches jump File↔Edit, Help never focuses,
  never opens, and emits nothing.

### Escape (one level per press)

- [x] `MB-ESC-01` `[vendor]` `[browser]` —
  **Menubar should close the root menu and restore its trigger on Escape.**
  Focus a File root item, press Escape. Assert no menu mounted and focus
  on the File trigger.
- [x] `MB-ESC-02` `[vendor]` `[browser]` —
  **Menubar should close one submenu level per Escape with trigger restore.**
  Open File > Share, focus a Share item, press Escape. Assert only Share
  closes, focus on the Share trigger, File still open. Press Escape again:
  File closes, focus on the File menubar trigger. This adopts APG
  level-by-level ownership and rejects "Esc closes all".

### Focus

- [x] `MB-FOCUS-01` `[reference]` `[browser]` —
  **Menubar switches should land focus inside the newly opened menu.**
  Switch menus by trigger arrow and by content arrow. Assert after each
  switch the active element is inside the new menu (container or item),
  never on the old trigger, never on closed content, never body.

### Env, direction, and a11y

- [x] `MB-ENV-01` `[reference]` `[unit]` —
  **Menubar should SSR closed triggers and hydrate into a working bar.**
  `renderToString` a three-menu bar: assert menubar role, three triggers,
  no menu items in HTML. Hydrate, click File: assert the menu opens with
  `aria-expanded="true"` and `aria-controls` resolving to the `role=menu`.
- [x] `MB-ENV-02` `[reference]` `[unit]` —
  **Menubar should keep one action and one value request across StrictMode replay.**
  StrictMode render, click File, click an item. Assert `onSelect` once and
  `onChange` exactly `["file", null]`.
- [x] `MB-NAV-01` `[reference]` `[unit]` —
  **Menubar nav helpers should resolve adjacent values.**
  Pure `menubar-nav` cases: advance/retreat, clamped edges without loop,
  wrap with loop, empty registry, null/unknown anchors, and RTL arrow
  mapping. No DOM.
- [x] `MB-RTL-01` `[vendor]` `[browser]` —
  **Menubar should mirror Left/Right under RTL.**
  Render the bar under `dir=rtl`. Assert ArrowLeft advances focus and
  switches forward while ArrowRight retreats, on triggers and in content;
  Up/Down/Enter/Space/Escape match LTR.
- [x] `MB-A11Y-01` `[reference]` `[browser]` —
  **Menubar should keep expansion and control relationships correct in every state.**
  Across closed/open/switch/close states assert `role=menubar`, trigger
  `role=menuitem` + `aria-haspopup=menu`, `aria-expanded` matching the
  value, `aria-controls` resolving only while open, and owned `role=menu`
  content; no axe in repo, so explicit asserts.
