import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Tree } from './index'

export const Basic = () => {
  const [value, setValue] = React.useState<string | null>('doc-1')
  const [expanded, setExpanded] = React.useState<string[]>(['folder-1'])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="tree-fixture-root" maxW="80r">
        <Div
          border="1px solid"
          borderColor="ui.field.border"
          borderRadius="md"
          p="2r"
          mb="4r"
        >
          <Tree
            data-testid="test-tree"
            value={value}
            onChange={setValue}
            expanded={expanded}
            onExpandedChange={setExpanded}
          >
            <Tree.Item id="folder-1" isBranch data-testid="tree-item-folder-1">
              <Div display="flex" alignItems="center" gap="1.5r">
                <Tree.Expander itemId="folder-1" data-testid="expander-folder-1" />
                <Span fontWeight="600">📁 Documents</Span>
              </Div>
              <Tree.Group data-testid="tree-group-folder-1">
                <Tree.Item id="doc-1" data-testid="tree-item-doc-1">
                  <Span>📄 Resume.pdf</Span>
                </Tree.Item>
                <Tree.Item id="doc-2" data-testid="tree-item-doc-2">
                  <Span>📄 Budget.xlsx</Span>
                </Tree.Item>
              </Tree.Group>
            </Tree.Item>
            <Tree.Item id="file-readme" data-testid="tree-item-readme">
              <Span>📄 README.md</Span>
            </Tree.Item>
          </Tree>
        </Div>

        <Span data-testid="tree-value-display" fontSize="3.5r" color="design.text.base">
          Selected: {value ?? 'None'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const MultiLevel = () => {
  const [selected, setSelected] = React.useState<string | null>('file-switch')
  const [expanded, setExpanded] = React.useState<string[]>([
    'folder-packages',
    'folder-components',
  ])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="tree-multi-root" maxW="90r">
        <Div
          border="1px solid"
          borderColor="ui.field.border"
          borderRadius="md"
          p="2r"
        >
          <Tree
            data-testid="tree-multi"
            value={selected}
            onChange={setSelected}
            expanded={expanded}
            onExpandedChange={setExpanded}
          >
            <Tree.Item id="folder-packages" isBranch data-testid="tree-folder-packages">
              <Div display="flex" alignItems="center" gap="1.5r">
                <Tree.Expander itemId="folder-packages" />
                <Span fontWeight="600">📦 packages</Span>
              </Div>
              <Tree.Group>
                <Tree.Item id="folder-components" isBranch data-testid="tree-folder-components">
                  <Div display="flex" alignItems="center" gap="1.5r">
                    <Tree.Expander itemId="folder-components" />
                    <Span fontWeight="600">📁 components</Span>
                  </Div>
                  <Tree.Group>
                    <Tree.Item id="file-switch" data-testid="tree-file-switch">
                      <Span>📄 Switch.tsx</Span>
                    </Tree.Item>
                    <Tree.Item id="file-tabs" data-testid="tree-file-tabs">
                      <Span>📄 Tabs.tsx</Span>
                    </Tree.Item>
                  </Tree.Group>
                </Tree.Item>
                <Tree.Item id="file-package-json" data-testid="tree-file-pkg">
                  <Span>📄 package.json</Span>
                </Tree.Item>
              </Tree.Group>
            </Tree.Item>
          </Tree>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}
