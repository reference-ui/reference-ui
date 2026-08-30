# Tree

Proof: [TESTS.md](./TESTS.md).

A minimal APG `role="tree"`. Nested collapse, roving focus among **visible** items, single selection, typeahead. Built on `RovingFocus`.

This is not a file explorer, not a data grid, and not a virtualized list. Descendants of a collapsed item are not in the roving set. Multi-select, drag-and-drop, and windowed rows are out of this freeze.

```tsx
<Tree
  value={selected}
  onChange={setSelected}
  expanded={expanded}
  onExpandedChange={setExpanded}
>
  <Tree.Item value="src">
    <Tree.Expander aria-label="Toggle src" />
    src
    <Tree.Group>
      <Tree.Item value="src/index">index.ts</Tree.Item>
      <Tree.Item value="src/tree">tree.ts</Tree.Item>
    </Tree.Group>
  </Tree.Item>
  <Tree.Item value="readme">README.md</Tree.Item>
</Tree>
```

Keyboard (APG tree):

- Up / Down — previous / next visible item
- Right — expand, or move to first child if already expanded
- Left — collapse, or move to parent if already collapsed
- Home / End — first / last visible item
- Enter / Space — select the focused item
- Typeahead — same contract as Listbox / Menu

`aria-level` is derived from nesting. `aria-expanded` is set only on items that have children. `aria-selected` follows `value`.

## Proposed API

```ts
interface TreeProps
  extends Omit<ReferencePartProps<"div">, "onChange"> {
  children?: React.ReactNode
  value?: string | null
  onChange?: (value: string | null) => void
  expanded?: string[]
  onExpandedChange?: (expanded: string[]) => void
}

interface TreeItemProps extends ReferencePartProps<"div"> {
  value: string
  disabled?: boolean
  textValue?: string
}

interface TreeGroupProps extends ReferencePartProps<"div"> {}

interface TreeExpanderProps
  extends ReferencePartProps<"button"> {}
```

`Tree` renders `div` with `role="tree"`. `Tree.Item` renders
`div[role="treeitem"]`; nested items are authored inside
`Tree.Group` (`div[role="group"]`). A branch's `Tree.Expander` is a native
`button[type="button"][tabindex="-1"]`: pointer activation changes expansion
without selecting the item, while the focused treeitem retains APG arrow-key
expansion.

Omitted value/expanded means controlled null/empty state.

---

## Problems we own

The defining invariant is collapsed descendants **absent from the roving
set**, proved through at least two nesting levels. When nested in Combobox,
Tree automatically
exposes its visible item registry through the shared virtual-focus bridge:
input focus remains put, Tree still owns expansion/navigation, and Combobox is
the sole selection commit callback. The mounted Item named by the Combobox
source also publishes `data-active`; this preview hook remains independent from
Tree's controlled selected state.

### Visible-only roving set

Walking children of a collapsed node puts hidden items in Tab/arrow order. AT and keyboard both lie.

**Vendor.** Zag `visibleNodes` + `skip` on visit (`packages/machines/tree-view`). Aria `TreeCollection` only visits children if `expandedKeys.has` — useful algorithm, but Aria `useTree.ts` renders **`role="treegrid"`** via GridList.

**Lift** Zag (and Aria collection filter as a second opinion). **Leave** Aria `useTree` as the widget — it is treegrid, not APG tree.

### Expand / collapse keys + RTL

Right expands or enters; Left collapses or moves to parent. RTL swaps.

**Lift** Zag key map.

### Single select + typeahead

Multi-select and virtualized rows are application-owned (`components.md` omissions). Typeahead is RovingFocus with Tree’s visible set.

---

## Convergence

**zag tree-view** for APG `tree` / `treeitem` and `visibleNodes`. Contrast Aria only for expansion filtering. Do not grow this into a file explorer.
