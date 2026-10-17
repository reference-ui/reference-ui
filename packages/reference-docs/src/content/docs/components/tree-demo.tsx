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
        <Tree.Expander aria-label="Toggle src" />
        <Span fontWeight="600">src</Span>
        <Tree.Group>
          <Tree.Item value="src/index">index.ts</Tree.Item>
          <Tree.Item value="src/tree">tree.ts</Tree.Item>
        </Tree.Group>
      </Tree.Item>
      <Tree.Item value="readme">README.md</Tree.Item>
    </Tree>
  )
}
