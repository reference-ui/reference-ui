import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Tooltip } from './Tooltip'

describe('Tooltip SSR', () => {
  it('server-renders a closed Trigger without tooltip Content', () => {
    const html = renderToString(
      <Tooltip>
        <Tooltip.Trigger>
          <button type="button">Save</button>
        </Tooltip.Trigger>
        <Tooltip.Content>Help</Tooltip.Content>
      </Tooltip>
    )
    expect(html).toContain('Save')
    expect(html).not.toContain('Help')
    expect(html).not.toContain('role="tooltip"')
    expect(html).not.toContain('data-reference-overlay-content')
  })
})
