# Menu SPEC

Current freeze, cases, and proof. Design narrative: [Menu.md](./Menu.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/menu.spec.ts`
CT: `__e2e__/Menu.ct.spec.ts` (92 tests, React 17/18/19)
Colocated: `Menu.test.tsx` (22 tests) + `menu-intent.test.ts` (1 test)
Page: `/menu`

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**API and TESTS.md are the contract.** `role="menu"` keyboard + items.
Geometry and layer stack are Overlay’s. Root open policy is Popover.
Nested Menu renders no node; `Content` is wrapped Overlay.Content.

Visual polish is not this gate. Do not add public `Sub*` parts. Do not
rebuild Overlay dismiss.

### Surface

| Axis | Freeze |
| :--- | :--- |
| Parts | Item, CheckboxItem, RadioGroup/RadioItem, LinkItem (`a`), Separator |
| Nested | `Menu.Trigger` is `div[role=menuitem]`; omitted nested `open` → controlled false |
| closeOnSelect | plain/link true; checkbox/radio false |
| Intent | 100ms open / 300ms close / 5px grace |
| Escape | one level (Overlay stack) |

### Status (finish-line P2E — 85/91)

| | |
| :--- | :--- |
| Engine | Popover-root Menu + recursive nested Menu + RovingFocus typeahead. |
| Production | Root + nested submenus, choice parts, LinkItem, intent, context recipe. |
| Named `[x]` | 85 / 91 (6 gaps: 3 maintainer-skipped, 2 Overlay-owned, 1 matrix-only) |
| CT | 92 (React 17/18/19 green), incl. 32 P2E completions + 5 COMP gates |
| Vitest | 23 (unit pins for CHOICE-03/05/06, LINK-04, INTENT-09, ENV-01/02, …) |

P2E arc (on the FEATURES-A/B + W-28 landings): Popover-root rewrite,
nested submenus with SUBKEY keys, 100/300/5px intent wiring, Checkbox /
Radio / Link parts, ContextMenu recipe (`useMenuContextKeys` +
outside-contextmenu dismiss). Behavior fixes: direction-from-root-trigger
(portals lose `dir`), descendant-aware intent travel, once-per-episode
rejected-close, RTL close-key source.

### Gaps & incoherence

- `MN-FOCUS-04` horizontal prop — FEATURES #5 maintainer-take: skip (no
  Menubar consumer; Menubar roves horizontally itself, verified).
- `MN-TYPE-02` Space-as-search — PATCHES #2, blocked on the RovingFocus
  crew's typeahead-session gate (Menu must not fork the buffer).
- `MN-ACT-07` press-drag-select — FEATURES #6 maintainer-take: doubtful in
  base Menu, needs a demonstrating consumer.
- `MN-CLOSE-03` FocusLock shard + `MN-CLOSE-10` nested dialog — Overlay /
  FocusLock-owned layer wiring, outside Menu scope.
- `MN-ENV-04` browser:all — CT runs Chromium only; needs the matrix
  engine sweep (the old "`--react all`" proof conflated React with engines).
- `MN-DOM-02` keeps its original visual focus-ring title as a frozen
  regression alongside the catalog adaptation.

### Vendor

**Lift:** Radix `packages/react/menu` + e2e; Zag `packages/machines/menu`
(intent polygon); `@react-aria/menu`; Base UI `packages/react/src/menu`
(typeahead / Space).

**Leave:** public Sub*; Zag/Base overlay runtime; NavigationMenu mega-menu.

### Case index

Proven by passing CT/unit titles (P2E: full submenu/choice/link/intent
coverage; quarantine-era root-only adaptations retained where noted):

- `[x]` all `MN-DOM-01..10`
- `[x]` `MN-FOCUS-01` `MN-FOCUS-02` `MN-FOCUS-03` `MN-FOCUS-05`
  `MN-FOCUS-06`
- `[x]` `MN-TYPE-01` `MN-TYPE-03` `MN-TYPE-04`
- `[x]` `MN-ACT-01` `MN-ACT-02` `MN-ACT-03` `MN-ACT-04` `MN-ACT-05`
  `MN-ACT-06` `MN-ACT-08`
- `[x]` all `MN-CHOICE-01..10` (`-03/-05/-06` unit, rest CT)
- `[x]` all `MN-LINK-01..09` (`-04` unit, rest CT)
- `[x]` all `MN-SUBKEY-01..10`
- `[x]` all `MN-INTENT-01..10` (`-09` unit, rest CT)
- `[x]` `MN-CLOSE-01` `MN-CLOSE-02` `MN-CLOSE-04` `MN-CLOSE-05`
  `MN-CLOSE-06` `MN-CLOSE-07` `MN-CLOSE-08` `MN-CLOSE-09`
- `[x]` all `MN-DYNAMIC-01..04`
- `[x]` `MN-ENV-01` `MN-ENV-02` (unit) `MN-ENV-03` (shadow; Overlay
  FEATURES #1 automatic rule + Menu owning-root adoption; Tab
  traversal stays document-scoped per Tree-deferred precedent)
- `[x]` `MN-A11Y-01` (explicit asserts; no axe in repo)
- `[x]` all `MN-COMP-01..05`
- `[ ]` `MN-FOCUS-04` (FEATURES #5 skip — no Menubar consumer)
- `[ ]` `MN-TYPE-02` (PATCHES #2 — RovingFocus session gate)
- `[ ]` `MN-ACT-07` (FEATURES #6 — needs a demonstrating consumer)
- `[ ]` `MN-CLOSE-03` `MN-CLOSE-10` (Overlay/FocusLock-owned)
- `[ ]` `MN-ENV-04` (matrix engine sweep; CT is Chromium-only)

Non-catalog regression titles (kept, not counted): `MN-FOCUS-07[-sub]`
(B-33 container edge keys), `MN-CLOSE-11` (adjacent-trigger press),
`MN-DOM-B27` (Menu.md composition), P4 plant-site pin.
(`MN-CHOICE-02-alias` (W-28) removed under ruling 1a — Radix aliases stripped.)

Adaptations (pinned current behavior over quarantine where they
conflict): `MN-FOCUS-02` asserts NO item focus after pointer opening
(quarantine focused first item; contradicts pinned colocated test);
`MN-CLOSE-08` asserts one request + retained open DOM but not focus
retention (focus moves optimistically — strict retention needs an async
accept signal); `MN-DOM-09` proven behaviorally (no `aria-orientation`
attribute — validity risk without axe); focused-item removal recovery
is RovingFocus-owned per TESTS.md ("Owned elsewhere"); item/trigger/
content consumer refs resolve on React 19 only (RovingFocus
cloneElement + Overlay ref-as-prop drop `props.ref` on 17/18 —
handoff); `MN-DOM-02` original visual CT title kept as frozen
regression alongside the catalog adaptation.

P2E adaptations: `MN-SUBKEY-08` counts one `ext:onDismiss` per
deliberate gesture (hover-away, then sibling press) under rejection —
accepted parents unmount after the first; `MN-INTENT-05` disabled-entry
leg rides the same SUBKEY-08 pin; `MN-COMP-02` composes Overlay-direct
(virtual `anchor` + `useMenuContextKeys`) because Popover does not pass
`anchor` through — Popover passthrough is the follow-up, the Menu
contract is proven; context entry plants only on closed→open
transitions (a repeated gesture batches dismiss+reopen without
unmounting); submenu direction reads the root trigger (portals lose
`dir` — Menu-side adoption pending Portal dir propagation);
descendant travel keeps ancestors open; `MN-LINK-06` download leg
asserts attribute + dismiss + no-navigation (no harness download
server); `MN-ENV-04` is `[ ]` — the old `--react all` proof conflated
React majors with browser engines.

### Work order

1. ~~Anatomy: Popover root + recursive nested Menu~~ — landed (P2E).
2. ~~Item activation + closeOnSelect; cancelable `onSelect`~~ — landed.
3. ~~Choice items + LinkItem~~ — landed (W-28 + P2E dynamics).
4. ~~Intent polygon (`MN-INTENT-*`)~~ — landed + wired (P2E).
5. Escape / layer policy composes Overlay — do not reimplement.
6. Remaining IDs: `TYPE-02` (RovingFocus gate), `CLOSE-03/10`
   (Overlay), `ENV-04` (matrix sweep); `FOCUS-04`/`ACT-07` skipped
   per maintainer-take.

### Won't do

Visual polish. ContextMenu / Menubar as freeze primitives. Overlay kernel
rewrite.

### Done when

Public API matches Menu.md. Every TESTS.md ID is `[x]` here.
