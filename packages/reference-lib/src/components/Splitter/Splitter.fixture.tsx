import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { Splitter } from './index'

export default {
  Horizontal: () => {
    const [sizes, setSizes] = React.useState([40, 60])
    return (
      <Div display="flex" flexDirection="column" gap="3r">
        <Div
          height="30r"
          border="1px solid"
          borderColor="ui.field.border"
          borderRadius="md"
          overflow="hidden"
        >
          <Splitter value={sizes} onChange={setSizes} height="100%">
            <Splitter.Panel index={0} p="3r" bg="colors.gray.100">
              <Span fontSize="3r" fontWeight="500">
                Sidebar ({Math.round(sizes[0])}%)
              </Span>
            </Splitter.Panel>
            <Splitter.Handle index={0} />
            <Splitter.Panel index={1} p="3r" bg="colors.gray.50">
              <Span fontSize="3r" fontWeight="500">
                Main content ({Math.round(sizes[1])}%)
              </Span>
            </Splitter.Panel>
          </Splitter>
        </Div>
        <Span fontSize="3r" color="design.text.light">
          Drag the handle or use arrow keys to resize.
        </Span>
      </Div>
    )
  },
  Vertical: () => (
    <Div
      width="50r"
      height="40r"
      border="1px solid"
      borderColor="ui.field.border"
      borderRadius="md"
      overflow="hidden"
    >
      <Splitter orientation="vertical" defaultValue={[60, 40]} height="100%">
        <Splitter.Panel index={0} p="3r" bg="colors.gray.100">
          <Span fontSize="3r" fontWeight="500">Editor</Span>
        </Splitter.Panel>
        <Splitter.Handle index={0} />
        <Splitter.Panel index={1} p="3r" bg="colors.gray.50">
          <Span fontSize="3r" fontWeight="500">Console</Span>
        </Splitter.Panel>
      </Splitter>
    </Div>
  ),
  ThreePanels: () => (
    <Div
      height="25r"
      border="1px solid"
      borderColor="ui.field.border"
      borderRadius="md"
      overflow="hidden"
    >
      <Splitter defaultValue={[25, 50, 25]} height="100%">
        <Splitter.Panel index={0} p="2r" bg="colors.gray.100">
          <Span fontSize="3r">Nav</Span>
        </Splitter.Panel>
        <Splitter.Handle index={0} />
        <Splitter.Panel index={1} p="2r" bg="colors.gray.50">
          <Span fontSize="3r">Canvas</Span>
        </Splitter.Panel>
        <Splitter.Handle index={1} />
        <Splitter.Panel index={2} p="2r" bg="colors.gray.100">
          <Span fontSize="3r">Inspector</Span>
        </Splitter.Panel>
      </Splitter>
    </Div>
  ),
}
