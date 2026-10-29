// Live Tree demo for the Tree component page.
// It takes nothing and emits the tree specimen. Colocated with the page that embeds it.
import { useState } from 'react'
import { Span } from '@reference-ui/react'
import { Tree } from '@reference-ui/lib'
import { listSurface } from './demo-surface'

/** A small file tree with controlled selection and expansion. */
export function TreeDemo() {
  const [selected, setSelected] = useState<string | null>('src/index')
  const [expanded, setExpanded] = useState<string[]>(['src'])
  return (
    <Tree
      aria-label="Files"
      value={selected}
      onChange={setSelected}
      expanded={expanded}
      onExpandedChange={setExpanded}
      className={listSurface}
    >
      <Tree.Item value="src">
        <Tree.Expander />
        <Span weight="sans.semibold">src</Span>
        <Tree.Group>
          <Tree.Item value="src/index">index.ts</Tree.Item>
          <Tree.Item value="src/tree">tree.ts</Tree.Item>
          <Tree.Item value="src/parts">
            <Tree.Expander />
            <Span weight="sans.semibold">parts</Span>
            <Tree.Group>
              <Tree.Item value="src/parts/item">item.ts</Tree.Item>
              <Tree.Item value="src/parts/group">group.ts</Tree.Item>
            </Tree.Group>
          </Tree.Item>
        </Tree.Group>
      </Tree.Item>
      <Tree.Item value="dist" disabled>
        dist
      </Tree.Item>
      <Tree.Item value="readme">README.md</Tree.Item>
    </Tree>
  )
}
