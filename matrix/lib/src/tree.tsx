import * as React from 'react'
import { Tree } from '@reference-ui/lib'

export function TreeFixture() {
  const [value, setValue] = React.useState<string | null>('doc-1')
  const [expanded, setExpanded] = React.useState<string[]>(['folder-1'])

  return (
    <div data-testid="tree-fixture-root">
      <h1>Tree Fixture</h1>

      <div style={{ width: 260, margin: '16px 0' }}>
        <Tree
          data-testid="test-tree"
          value={value}
          onChange={setValue}
          expanded={expanded}
          onExpandedChange={setExpanded}
        >
          <Tree.Item id="folder-1" isBranch data-testid="tree-item-folder-1">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Tree.Expander itemId="folder-1" data-testid="expander-folder-1" />
              <span>📁 Documents</span>
            </div>
            {expanded.includes('folder-1') && (
              <Tree.Group data-testid="tree-group-folder-1">
                <Tree.Item id="doc-1" data-testid="tree-item-doc-1">
                  <span>📄 Resume.pdf</span>
                </Tree.Item>
                <Tree.Item id="doc-2" data-testid="tree-item-doc-2">
                  <span>📄 Budget.xlsx</span>
                </Tree.Item>
              </Tree.Group>
            )}
          </Tree.Item>
          <Tree.Item id="file-readme" data-testid="tree-item-readme">
            <span>📄 README.md</span>
          </Tree.Item>
        </Tree>
      </div>

      <p data-testid="tree-value-display">
        Selected: {value ?? 'None'}
      </p>
    </div>
  )
}
