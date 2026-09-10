# Menu SPEC

Current freeze, cases, and proof. Design narrative: [Menu.md](./Menu.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/menu.spec.ts`
Colocated: `Menu.test.tsx` (5 tests; **no case IDs**)
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

### Status (2026-09-10)

| | |
| :--- | :--- |
| Engine | Prototype Trigger/Content/Item/Separator + own Overlay. |
| Production | **No.** |
| Named `[x]` | 1 / 91 (`MN-DOM-01`) |
| Playwright | 2 (`MN-DOM-02` is visual) |
| Vitest | 5 tests, 0 IDs |

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

- `[x]` `MN-DOM-01`
- `[ ]` remaining `MN-DOM-*`, `MN-FOCUS-*`, `MN-TYPE-*`, `MN-ACT-*`,
  `MN-CHOICE-*`, `MN-LINK-*`, `MN-SUBKEY-*`, `MN-INTENT-*`, `MN-CLOSE-*`,
  `MN-DYNAMIC-*`, `MN-ENV-*`, `MN-A11Y-01`, `MN-COMP-*`

Not catalog: `MN-DOM-02` visual. Drop or rehome.

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
