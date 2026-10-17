# Tree

Proof: [case.json](./case.json) indexes the cases, [TESTS.md](./TESTS.md) holds each case's setup, action, and assert rows, and a case is proven when a passing test title contains its ID (`pnpm agentct Tree --e2e`).

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
  value: string | null
  onChange: (value: string | null) => void
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

Selection is fully controlled: `value` and `onChange` are required
(`null` is the empty value); omitting either fails fast. Omitted
`expanded` means `[]` via `defaultExpanded` (still uncontrolled —
pending a decision on sibling default props).

**Unmatched ids.** A standalone `value` or `expanded` id that names no item is kept and passed through unchanged: selection stays controlled, and emitted arrays keep unknown ids. In development the Tree reports each unmatched id once with `console.error`, such as `[reference-ui] Tree: value "ghost" matches no item (registered ids: folder, a, b).`, listing the registered ids in document order. The check decides only when the whole tree is mounted (at least one item registered and every registered branch expanded), because a collapsed Group unmounts its children; while any branch is collapsed it stays silent, even for a truly unknown id. Inside Combobox the value check is skipped because Combobox owns that value, but unknown expanded ids are still reported. The report waits for the tree to settle: it is made only after 50ms with no registration, unregistration, expansion or value change, and only for ids still unmatched then, so a child that registers inside that window is not reported. A child that mounts later than that under an already-expanded branch, such as one loaded asynchronously, is reported until it registers.

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

**Prior art.** Zag `visibleNodes` + `skip` on visit (`packages/machines/tree-view`). Aria `TreeCollection` only visits children if `expandedKeys.has` — useful algorithm, but Aria `useTree.ts` renders **`role="treegrid"`** via GridList.

**Lift** Zag (and Aria collection filter as a second opinion). **Leave** Aria `useTree` as the widget — it is treegrid, not APG tree.

### Expand / collapse keys + RTL

Right expands or enters; Left collapses or moves to parent. RTL swaps.

**Lift** Zag key map.

### Single select + typeahead

Multi-select and virtualized rows are application-owned (`components.md` omissions). Typeahead is RovingFocus with Tree’s visible set.

---

## Convergence

**zag tree-view** for APG `tree` / `treeitem` and `visibleNodes`. Contrast Aria only for expansion filtering. Do not grow this into a file explorer.
