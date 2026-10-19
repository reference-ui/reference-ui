import { useState } from 'react'
import { Div, Span, css } from '@reference-ui/react'
import { Splitter } from '@reference-ui/lib'

const frame = css({
  width: '100%',
  height: '40r',
  border: '1px solid',
  borderColor: 'docsBorder',
  borderRadius: 'md',
  overflow: 'hidden',
})
const panel = css({ padding: '3r' })

/** A two-panel horizontal split; sizes are percentages that sum to 100. */
export function SplitterDemo() {
  const [sizes, setSizes] = useState([40, 60])
  return (
    <Div className={frame}>
      <Splitter value={sizes} onChange={setSizes}>
        <Splitter.Panel min="20r" className={panel}>
          <Span>Sidebar ({Math.round(sizes[0])}%)</Span>
        </Splitter.Panel>
        <Splitter.Handle aria-label="Resize sidebar" />
        <Splitter.Panel className={panel}>
          <Span>Main ({Math.round(sizes[1])}%)</Span>
        </Splitter.Panel>
      </Splitter>
    </Div>
  )
}

/** A collapsible sidebar next to a vertical split: two nested Splitters. */
export function SplitterNestedDemo() {
  const [columns, setColumns] = useState([30, 70])
  const [rows, setRows] = useState([60, 40])
  return (
    <Div className={frame}>
      <Splitter value={columns} onChange={setColumns}>
        <Splitter.Panel min={20} collapsible className={panel}>
          <Span>Sidebar</Span>
        </Splitter.Panel>
        <Splitter.Handle aria-label="Resize sidebar" />
        <Splitter.Panel>
          <Splitter orientation="vertical" value={rows} onChange={setRows}>
            <Splitter.Panel min="10r" className={panel}>
              <Span>Editor</Span>
            </Splitter.Panel>
            <Splitter.Handle aria-label="Resize console" />
            <Splitter.Panel min="10r" className={panel}>
              <Span>Console</Span>
            </Splitter.Panel>
          </Splitter>
        </Splitter.Panel>
      </Splitter>
    </Div>
  )
}
