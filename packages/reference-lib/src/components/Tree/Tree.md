# Tree

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
    src
    <Tree.Item value="src/index">index.ts</Tree.Item>
    <Tree.Item value="src/tree">tree.ts</Tree.Item>
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
interface TreeProps {
  children?: React.ReactNode
  value?: string | null
  onChange?: (value: string | null) => void
  expanded?: string[]
  onExpandedChange?: (expanded: string[]) => void
}

interface TreeItemProps {
  children?: React.ReactNode
  value: string
  disabled?: boolean
}
```

`Tree` renders `div` with `role="tree"`. `Tree.Item` renders `div` with `role="treeitem"`.
