# Menu SPEC

Current freeze, cases, and proof. Design narrative: [Menu.md](./Menu.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/menu.spec.ts`
CT: `__e2e__/Menu.ct.spec.ts` (30 tests, React 17/18/19)
Colocated: `Menu.test.tsx` (7 tests) + `menu-intent.test.ts` (1 test)
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

### Status (2026-09-25 quarantine landing)

| | |
| :--- | :--- |
| Engine | Trigger/Content/Item/Separator + own Overlay + RovingFocus typeahead. |
| Production | **Root menu only.** No nested submenus / choice / link parts. |
| Named `[x]` | 31 / 91 (root-level adaptations; see deviations) |
| CT | 30 (2 frozen originals + 28 parity re-targets), React 17/18/19 green |
| Vitest | 8 (5 original + ENV-01/ENV-02 + INTENT-09) |

Landing ports (zero paint, uncontrolled API preserved): cancelable
`onSelect(event)` (Menu.md already specified `(event: Event) => void`),
`textValue` (Menu.md specified), RovingFocus `typeahead`, Tab
trigger-relative continuation, live-trigger focus restore,
close-transition focus restore, stable content id + `aria-controls`,
forwardRef on all parts, `menu-intent.ts` verbatim (unwired — submenu
follow-up fuel, not exported from index).

### Gaps & incoherence

- Missing CheckboxItem / RadioGroup / RadioItem / LinkItem.
- Own Overlay root + `defaultOpen` / `onOpenChange` instead of Popover +
  nested Menu model.
- No submenu nesting, intent polygon, typeahead-vs-Space gate, choice ARIA.
- `onSelect` is `() => void`, not cancelable event-first.
- `MN-DOM-02` is a visual focus-ring title, not catalog.

### Vendor

**Lift:** Radix `packages/react/menu` + e2e; Zag `packages/machines/menu`
(intent polygon); `@react-aria/menu`; Base UI `packages/react/src/menu`
(typeahead / Space).

**Leave:** public Sub*; Zag/Base overlay runtime; NavigationMenu mega-menu.

### Case index

Proven by passing CT/unit titles (root-level adaptations of TESTS.md):

- `[x]` `MN-DOM-01` `MN-DOM-02` `MN-DOM-03` `MN-DOM-04` `MN-DOM-05`
  `MN-DOM-06` `MN-DOM-07` `MN-DOM-09`
- `[x]` `MN-FOCUS-01` `MN-FOCUS-02` `MN-FOCUS-03` `MN-FOCUS-05`
- `[x]` `MN-TYPE-01` `MN-TYPE-04`
- `[x]` `MN-ACT-01` `MN-ACT-02` `MN-ACT-03` `MN-ACT-06` `MN-ACT-08`
- `[x]` `MN-CHOICE-08` (plain-item close policy only)
- `[x]` `MN-INTENT-09` (unit) `MN-INTENT-10`
- `[x]` `MN-CLOSE-01` `MN-CLOSE-04` `MN-CLOSE-05` `MN-CLOSE-08`
- `[x]` `MN-DYNAMIC-01` `MN-DYNAMIC-03`
- `[x]` `MN-ENV-01` `MN-ENV-02` (unit) `MN-ENV-04` (via `--react all`)
- `[x]` `MN-A11Y-01` (explicit asserts; no axe in repo)
- `[ ]` `MN-DOM-08` `MN-DOM-10` (Popover engine / submenu placement)
- `[ ]` `MN-FOCUS-04` `MN-FOCUS-06` (horizontal prop / submenus)
- `[ ]` `MN-TYPE-02` `MN-TYPE-03` (Space-buffer gate needs RovingFocus
  order change — child handlers run first; submenu buffers)
- `[ ]` `MN-ACT-04` `MN-ACT-05` `MN-ACT-07` (submenu tree / press-drag)
- `[ ]` `MN-CHOICE-*` except `-08`, all `MN-LINK-*` (parts do not exist)
- `[ ]` all `MN-SUBKEY-*`, `MN-INTENT-01..08` (no submenus)
- `[ ]` `MN-CLOSE-02` `MN-CLOSE-03` `MN-CLOSE-06` (submenu portion)
  `MN-CLOSE-07` `MN-CLOSE-09` (dup of CLOSE-01 single-level)
  `MN-CLOSE-10`
- `[ ]` `MN-DYNAMIC-02` `MN-DYNAMIC-04` (submenu ownership)
- `[x]` `MN-ENV-03` (shadow; Overlay FEATURES #1 automatic rule + Menu owning-root adoption; Tab traversal stays document-scoped per Tree-deferred precedent)
- `[ ]` all `MN-COMP-*` (need Popover-root/nested model)

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

### Work order

1. Anatomy: Popover root + recursive nested Menu (no second overlay).
2. Item activation + closeOnSelect; cancelable `onSelect`.
3. Choice items + LinkItem.
4. Intent polygon (`MN-INTENT-*`).
5. Escape / layer policy composes Overlay — do not reimplement.
6. ID’d cases.

### Won't do

Visual polish. ContextMenu / Menubar as freeze primitives. Overlay kernel
rewrite.

### Done when

Public API matches Menu.md. Every TESTS.md ID is `[x]` here.
