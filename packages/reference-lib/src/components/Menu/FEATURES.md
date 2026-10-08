# Menu features (needs design)

Status: companion to DECISIONS.md — every item here needs a product, UX, or API design call before anyone builds it.

## Status (finish-line P2E)

#1 nested submenus, #2 choice parts, #3 LinkItem, #4 Popover-root are
**LANDED** (SPEC 85/91; SUBKEY/INTENT/CLOSE-tree/CHOICE/LINK/COMP pins
green on React 17/18/19). #5 skipped per its maintainer-take (verified:
Menubar roves horizontally itself). #6 stays doubtful (no consumer).
#7/#8 unchanged.

## 1. Nested submenu model (from DECISIONS candidate #1) — LANDED

**What it does:** Recursive submenus — a nested `Menu` renders a submenu level with its own trigger item and positioned content, keyboardable with Left/Right and one-level Escape.

**API:**

```tsx
<Menu open onOpen onDismiss>       {/* nested: renders no node */}
  <Menu.Trigger />                 {/* div[role=menuitem], valid only when nested */}
  <Menu.Content />                 {/* wrapped Overlay.Content, default right-start, left-start in RTL */}
</Menu>
```

Omitted nested `open` is controlled false; one child layer per open submenu; Left/Right (+RTL mirror) open/close; Escape closes one level.

**Maintainer take:** Yes — the missing ~60/91 cases hang off this; build it as a designed arc (anatomy, then SUBKEY keys, then intent, then layer policy).

## 2. CheckboxItem + RadioGroup/RadioItem parts (from DECISIONS candidate #2) — LANDED

**What it does:** Stateful choice rows for settings-style menus — checkboxes and radio groups that live in the same roving/typeahead owner as plain items but don't dismiss on select by default.

**API:**

```tsx
<Menu.CheckboxItem checked={bool | "mixed"} onChange />  {/* role=menuitemcheckbox */}
<Menu.RadioGroup value onChange aria-label>              {/* role=group */}
  <Menu.RadioItem value />                               {/* role=menuitemradio */}
</Menu.RadioGroup>
```

Both default `closeOnSelect={false}`; checkbox requests the opposite boolean (`mixed`→true), radio requests its value; controlled ARIA changes only after the parent prop change; state request precedes dismissal when explicitly closing.

**Maintainer take:** Yes once a settings-menu consumer names it; let it ride the submenu arc and gate on `MN-COMP-04`.

## 3. LinkItem part (from DECISIONS candidate #3) — LANDED

**What it does:** Real-anchor menu rows for docs/nav menus — native navigation preserved, then dismissed by default, with modified/middle/right clicks staying fully native.

**API:**

```tsx
<Menu.LinkItem href onSelect closeOnSelect />  {/* real HTMLAnchorElement[role=menuitem] */}
```

Unmodified primary click / Enter / Menu-owned Space run handlers, preserve native navigation, then dismiss by default (`closeOnSelect=true`); `preventDefault` cancels both navigation and dismissal; modified/middle/right clicks stay fully native (no select, no dismiss); `target`/`download` keep native effect; disabled is non-navigable and outside roving/typeahead.

**Maintainer take:** Yes for docs/nav menus, but as its own arc — the navigation-vs-dismissal interleave is the subtlest activation contract in the suite; gate on `MN-COMP-05`.

## 4. Popover-root anatomy (from DECISIONS candidate #5) — LANDED

**What it does:** Root `Menu` stops owning its own overlay and renders `div[role=menu]` inside a consumer-wrapped `Popover`, which owns open state, placement, portal, and Presence exit — one overlay runtime, not two.

**API:**

```tsx
<Popover /* open state, placement, portal, Presence exit */>
  <Menu>                         {/* div[role=menu], adopts the Popover layer */}
    <Menu.Item />
  </Menu>
</Popover>
```

Replaces the current own-`Overlay` root + `defaultOpen`/`onOpenChange` + button `Trigger`; nested `Menu.Content` as wrapped `Overlay.Content` cannot coexist with a root that owns a second overlay.

**Maintainer take:** Decide this before anything else — it is the one breaking rewrite here, so weigh the major-version/codemod cost now, not mid-submenu-arc.

## 5. Horizontal root orientation prop (from DECISIONS candidate #6)

**What it does:** Lets a root menu rove horizontally for Menubar-style always-visible trigger rows, while every `Menu.Content` stays vertical.

**API:**

```tsx
<Menu orientation="vertical" | "horizontal" />  {/* default "vertical" */}
```

Horizontal root roves with Left/Right (RTL-mirrored) while Up/Down stay out of root roving; cross-axis submenu open/close still fire exactly once.

**Maintainer take:** Only if a Menubar composition names it as a consumer; otherwise it is spec completeness, not product need — skip.

## 6. Press-drag-select activation (from DECISIONS candidate #7)

**What it does:** Base UI-style gesture — press the root trigger, drag into an enabled item, release to select; release outside cancels.

**API:** No new props — behavior only: primary press on root trigger, pointer drag into an enabled item, release there invokes one `onSelect` + one dismissal with release modality preserved; release outside selects nothing; no synthetic duplicates across down/up/click.

**Maintainer take:** Doubtful in base Menu — smells like MenuButton-composition policy, so require a consumer demonstrating the gesture before designing press ownership and touch-vs-mouse mapping.

## 7. CLOSE-08 strict form: focus retention on rejected Tab-close (from DECISIONS candidate #9)

**What it does:** When the parent rejects a Tab/Shift+Tab close request (open prop unchanged), focus stays on the current item and no background tabbable steals it — instead of today's optimistic focus move before the rejection is known.

**API:** No new props — behavior only: rejected Tab/Shift+Tab close retains focus on the current item with the open DOM retained.

**Maintainer take:** Worth it only as a Popover/Overlay-wide controlled-accept handshake (defer Tab default? restore-on-reject? sync predicate?) — don't one-off it in Menu.

## 8. Configurable intent timing props (from DECISIONS gap #3)

**What it does:** Per-menu tuning of submenu hover intent timing for product menus where the frozen 100/300/5px defaults fail real users.

**API (sketch of the ask):**

```tsx
<Menu openDelay={100} closeDelay={300} gracePadding={5} />
```

TESTS.md freeze decision 5 currently answers that the API intentionally exposes no per-submenu timing controls.

**Maintainer take:** No — frozen timing is what makes intent deterministic and testable; reopen only on motor-accessibility research, never on taste, and then as one escape hatch with frozen defaults.
