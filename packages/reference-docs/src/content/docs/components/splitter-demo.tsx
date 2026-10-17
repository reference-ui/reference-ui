import { useState } from 'react'
import { Div, Span, css } from '@reference-ui/react'
import { Splitter } from '@reference-ui/lib'

const fill = css({ height: '100%' })
const panel = css({ padding: '3r' })

/** A two-panel horizontal split; sizes are percentages that sum to 100. */
export function SplitterDemo() {
  const [sizes, setSizes] = useState([40, 60])
  return (
    <Div
      width="100%"
      height="40r"
      border="1px solid"
      borderColor="docsBorder"
      borderRadius="md"
      overflow="hidden"
    >
      <Splitter value={sizes} onChange={setSizes} className={fill}>
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
