// @vitest-environment happy-dom
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { Tree, getDeterministicExpanded } from './Tree'

describe('Tree Unit Proofs', () => {
  it('TR-EXPAND-06: Tree should emit deterministic deduplicated expanded arrays in current traversal order', () => {
    const allKnownBranches = ['a', 'b', 'c']
    const incoming = ['unknown-2', 'c', 'a', 'c', 'unknown-1']

    // Expand 'b'
    const resultExpand = getDeterministicExpanded(incoming, 'b', allKnownBranches, true)
    expect(resultExpand).toEqual(['a', 'b', 'c', 'unknown-2', 'unknown-1'])

    // Collapse 'c'
    const resultCollapse = getDeterministicExpanded(resultExpand, 'c', allKnownBranches, false)
    expect(resultCollapse).toEqual(['a', 'b', 'unknown-2', 'unknown-1'])
  })

  it('TR-ENV-01: Tree should hydrate nested hierarchy and generated relationships without mismatch', () => {
    const html = renderToString(
      <Tree value="src/index" expanded={['src']}>
        <Tree.Item value="src">
          <Tree.Expander aria-label="Toggle src" />
          <span>src</span>
          <Tree.Group>
            <Tree.Item value="src/index">index.ts</Tree.Item>
            <Tree.Item value="src/tree">tree.ts</Tree.Item>
          </Tree.Group>
        </Tree.Item>
        <Tree.Item value="readme">README.md</Tree.Item>
      </Tree>
    )

    expect(html).toContain('role="tree"')
    expect(html).toContain('role="treeitem"')
    expect(html).toContain('role="group"')
    expect(html).toContain('aria-selected="true"')
    expect(html).toContain('aria-expanded="true"')
    expect(html).toContain('aria-controls=')
    expect(html).toContain('aria-level="1"')
    expect(html).toContain('aria-level="2"')
  })

  it('TR-ENV-02: Tree should register and invoke once across React versions and StrictMode', () => {
    const onChange = vi.fn()
    const onExpandedChange = vi.fn()

    const html = renderToString(
      <React.StrictMode>
        <Tree
          value="a"
          onChange={onChange}
          expanded={['branch-1']}
          onExpandedChange={onExpandedChange}
        >
          <Tree.Item value="branch-1">
            <Tree.Expander />
            <span>Branch</span>
            <Tree.Group>
              <Tree.Item value="a">A</Tree.Item>
            </Tree.Group>
          </Tree.Item>
        </Tree>
      </React.StrictMode>
    )

    expect(html).toContain('role="tree"')
    expect(onChange).not.toHaveBeenCalled()
    expect(onExpandedChange).not.toHaveBeenCalled()
  })
})
