import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Switch } from './Switch'

describe('Switch SSR', () => {
  it('SW-ENV-01: server-renders checked and unchecked markup with exactly one thumb', () => {
    const htmlTrue = renderToString(<Switch checked={true} />)
    expect(htmlTrue).toContain('role="switch"')
    expect(htmlTrue).toContain('aria-checked="true"')
    expect(htmlTrue).toContain('data-state="checked"')
    expect(htmlTrue).toContain('data-reference-switch-thumb')

    const htmlFalse = renderToString(<Switch checked={false} />)
    expect(htmlFalse).toContain('aria-checked="false"')
    expect(htmlFalse).toContain('data-state="unchecked"')

    const htmlAuthored = renderToString(
      <Switch checked={true}>
        <Switch.Thumb className="my-authored-thumb" />
      </Switch>
    )
    expect(htmlAuthored).toContain('my-authored-thumb')
    expect(htmlAuthored.match(/data-reference-switch-thumb=""/g)?.length).toBe(1)
  })
})
