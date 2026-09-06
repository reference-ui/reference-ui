import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { Tree } from './index'

export default {
  FileExplorer: () => {
    const [selected, setSelected] = React.useState<string | null>('file-switch')
    const [expanded, setExpanded] = React.useState<string[]>(['folder-switch', 'folder-tabs'])

    return (
      <Div maxW="80r" display="flex" flexDirection="column" gap="3r">
        <Tree
          value={selected}
          onChange={setSelected}
          expanded={expanded}
          onExpandedChange={setExpanded}
          border="1px solid"
          borderColor="ui.field.border"
          borderRadius="md"
          p="1.5r"
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
  StatelessExpander: () => {
    const [isOpen, setIsOpen] = React.useState(false)
    return (
      <Div maxW="60r" display="flex" flexDirection="column" gap="3r">
        <Div
          display="flex"
          alignItems="center"
          gap="1.5r"
          p="1.5r"
          borderRadius="sm"
          border="1px solid"
          borderColor="ui.field.border"
        >
          <Tree.Expander
            expanded={isOpen}
            onClick={() => setIsOpen((prev) => !prev)}
          />
          <Span fontSize="3.5r" fontWeight="600">
            Stateless Expander ({isOpen ? 'Expanded' : 'Collapsed'})
          </Span>
        </Div>
      </Div>
    )
  },
  CollapsedByDefault: () => (
    <Div maxW="60r">
      <Tree
        defaultValue="item-a"
        border="1px solid"
        borderColor="ui.field.border"
        borderRadius="md"
        p="1.5r"
      >
        <Tree.Item id="branch-1" isBranch>
          <Tree.Expander itemId="branch-1" />
          <Span fontSize="3.5r">Expandable branch</Span>
          <Tree.Group>
            <Tree.Item id="item-a">
              <Span fontSize="3.5r">Hidden until expanded</Span>
            </Tree.Item>
          </Tree.Group>
        </Tree.Item>
      </Tree>
    </Div>
  ),
}
