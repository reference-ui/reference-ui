import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FocusLock } from './FocusLock'

describe('FocusLock SSR', () => {
  it('FL-ENV-01: server-renders the authored child with no extra markup or document access', () => {
    const html = renderToString(
      <FocusLock>
        <section data-testid="ssr-lock">
          <button type="button">Go</button>
        </section>
      </FocusLock>
    )
    expect(html).toContain('data-testid="ssr-lock"')
    expect(html).toContain('Go')
    expect(html.match(/<section/g)?.length).toBe(1)
    expect(html).not.toContain('data-focus-guard')
    expect(html).not.toContain('data-focus-lock')
  })
})
