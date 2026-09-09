import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Popover } from './Popover'

describe('Popover SSR', () => {
  it('PO-ENV-01: server-renders a closed Trigger without layout globals or extra hosts', () => {
    const html = renderToString(
      <Popover>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Body</Popover.Content>
      </Popover>
    )
    expect(html).toContain('Open')
    expect(html).not.toContain('Body')
    expect(html).not.toContain('data-reference-overlay-content')
    expect(html.match(/<button/g)?.length).toBe(1)
  })
})
