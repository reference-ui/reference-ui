import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Splitter } from './index'

export const Basic = () => {
  const [value, setValue] = React.useState<number[]>([40, 60])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-fixture-root">
        <Div
          width="100r"
          height="50r"
          border="1px solid"
          borderColor="ui.field.border"
          borderRadius="md"
          overflow="hidden"
          mb="4r"
        >
          <Splitter
            data-testid="test-splitter"
            value={value}
            onChange={setValue}
            height="100%"
          >
            <Splitter.Panel
              index={0}
              data-testid="splitter-panel-0"
              p="3r"
              bg="ui.table.row.mutedBackground"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                Left Pane ({Math.round(value[0])}%)
              </Span>
            </Splitter.Panel>
            <Splitter.Handle index={0} data-testid="splitter-handle-0" />
            <Splitter.Panel
              index={1}
              data-testid="splitter-panel-1"
              p="3r"
              bg="ui.field.background"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                Right Pane ({Math.round(value[1])}%)
              </Span>
            </Splitter.Panel>
          </Splitter>
        </Div>

        <Span data-testid="splitter-value-display" fontSize="3.5r" color="design.text.base">
          Layout: {value[0]}% / {value[1]}%
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const Constrained = () => {
  const [value, setValue] = React.useState<number[]>([40, 60])
  const [changeCount, setChangeCount] = React.useState(0)
  const [changeEndCount, setChangeEndCount] = React.useState(0)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-constrained-root">
        <Div
          width="100r"
          height="50r"
          border="1px solid"
          borderColor="ui.field.border"
          borderRadius="md"
          overflow="hidden"
          mb="4r"
        >
          <Splitter
            data-testid="test-splitter-constrained"
            value={value}
            onChange={(next) => {
              setChangeCount((c) => c + 1)
              setValue(next)
            }}
            onChangeEnd={() => setChangeEndCount((c) => c + 1)}
            height="100%"
          >
            <Splitter.Panel
              index={0}
              data-testid="constrained-panel-0"
              minSize={20}
              maxSize={60}
              p="3r"
              bg="ui.table.row.mutedBackground"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                Left ({Math.round(value[0])}%)
              </Span>
            </Splitter.Panel>
            <Splitter.Handle index={0} data-testid="constrained-handle-0" />
            <Splitter.Panel
              index={1}
              data-testid="constrained-panel-1"
              p="3r"
              bg="ui.field.background"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                Right ({Math.round(value[1])}%)
              </Span>
            </Splitter.Panel>
          </Splitter>
        </Div>

        <Span data-testid="constrained-value-display" fontSize="3.5r" color="design.text.base">
          Layout: {value[0]}% / {value[1]}%
        </Span>
        <Div display="flex" gap="4r" mt="2r">
          <Span data-testid="change-count" fontSize="3r" color="design.text.base">
            {changeCount}
          </Span>
          <Span data-testid="change-end-count" fontSize="3r" color="design.text.base">
            {changeEndCount}
          </Span>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const CollapsibleDemo = () => {
  const [value, setValue] = React.useState<number[]>([40, 60])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-collapsible-root">
        <Div
          width="100r"
          height="50r"
          border="1px solid"
          borderColor="ui.field.border"
          borderRadius="md"
          overflow="hidden"
          mb="4r"
        >
          <Splitter data-testid="test-splitter-collapsible" value={value} onChange={setValue} height="100%">
            <Splitter.Panel
              index={0}
              data-testid="collapsible-panel-0"
              minSize={20}
              collapsible
              collapsedSize={5}
              p="3r"
              bg="ui.table.row.mutedBackground"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                Left ({Math.round(value[0])}%)
              </Span>
            </Splitter.Panel>
            <Splitter.Handle index={0} data-testid="collapsible-handle-0" />
            <Splitter.Panel
              index={1}
              data-testid="collapsible-panel-1"
              p="3r"
              bg="ui.field.background"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                Right ({Math.round(value[1])}%)
              </Span>
            </Splitter.Panel>
          </Splitter>
        </Div>

        <Span data-testid="collapsible-value-display" fontSize="3.5r" color="design.text.base">
          Layout: {value[0]}% / {value[1]}%
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const Vertical = () => {
  const [value, setValue] = React.useState<number[]>([50, 50])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-vertical-root">
        <Div
          width="80r"
          height="60r"
          border="1px solid"
          borderColor="ui.field.border"
          borderRadius="md"
          overflow="hidden"
        >
          <Splitter
            orientation="vertical"
            value={value}
            onChange={setValue}
            height="100%"
          >
            <Splitter.Panel
              index={0}
              p="3r"
              bg="ui.table.row.mutedBackground"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">Top ({value[0]}%)</Span>
            </Splitter.Panel>
            <Splitter.Handle index={0} data-testid="splitter-vertical-handle" />
            <Splitter.Panel
              index={1}
              p="3r"
              bg="ui.field.background"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">Bottom ({value[1]}%)</Span>
            </Splitter.Panel>
          </Splitter>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}
