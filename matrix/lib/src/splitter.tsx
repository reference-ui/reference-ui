import * as React from 'react'
import { Splitter } from '@reference-ui/lib'

export function SplitterFixture() {
  const [value, setValue] = React.useState<number[]>([40, 60])

  return (
    <div data-testid="splitter-fixture-root">
      <h1>Splitter Fixture</h1>

      <div style={{ width: 400, height: 200, border: '1px solid #ccc', margin: '16px 0' }}>
        <Splitter
          data-testid="test-splitter"
          value={value}
          onChange={setValue}
        >
          <Splitter.Panel index={0} data-testid="splitter-panel-0">
            <div style={{ padding: 8 }}>Left Pane ({value[0]}%)</div>
          </Splitter.Panel>
          <Splitter.Handle index={0} data-testid="splitter-handle-0" />
          <Splitter.Panel index={1} data-testid="splitter-panel-1">
            <div style={{ padding: 8 }}>Right Pane ({value[1]}%)</div>
          </Splitter.Panel>
        </Splitter>
      </div>

      <p data-testid="splitter-value-display">
        Layout: {value[0]}% / {value[1]}%
      </p>
    </div>
  )
}
