import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { Tree } from './index'

export default {
  FileExplorer: () => {
    const [selected, setSelected] = React.useState<string | null>('file-switch')
    return (
      <Div maxW="80r" display="flex" flexDirection="column" gap="3r">
        <Tree
          value={selected}
          onChange={setSelected}
          defaultExpanded={['folder-switch', 'folder-tabs']}
        >
          <Tree.Item id="folder-switch" isBranch>
            <Tree.Expander itemId="folder-switch" />
            <Span fontWeight="600">Switch/</Span>
            <Tree.Group>
              <Tree.Item id="file-switch">Switch.tsx</Tree.Item>
              <Tree.Item id="file-switch-fixture">Switch.fixture.tsx</Tree.Item>
            </Tree.Group>
          </Tree.Item>
          <Tree.Item id="folder-tabs" isBranch>
            <Tree.Expander itemId="folder-tabs" />
            <Span fontWeight="600">Tabs/</Span>
            <Tree.Group>
              <Tree.Item id="file-tabs">Tabs.tsx</Tree.Item>
              <Tree.Item id="file-tabs-fixture">Tabs.fixture.tsx</Tree.Item>
            </Tree.Group>
          </Tree.Item>
          <Tree.Item id="file-readme">README.md</Tree.Item>
        </Tree>
        <Span fontSize="3r" color="design.text.light">Selected: {selected ?? 'None'}</Span>
      </Div>
    )
  },
  CollapsedByDefault: () => (
    <Div maxW="60r">
      <Tree defaultValue="item-a">
        <Tree.Item id="branch-1" isBranch>
          <Div display="flex" alignItems="center" gap="1r">
            <Tree.Expander itemId="branch-1" />
            <Span fontSize="3r">Expandable branch</Span>
          </Div>
          <Tree.Group>
            <Tree.Item id="item-a">
              <Span fontSize="3r">Hidden until expanded</Span>
            </Tree.Item>
          </Tree.Group>
        </Tree.Item>
      </Tree>
    </Div>
  ),
}
