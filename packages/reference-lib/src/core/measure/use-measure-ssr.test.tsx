import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { useMeasure } from './use-measure'

function ServerProbe() {
  const measure = useMeasure<HTMLDivElement>()
  return (
    <div ref={measure.ref} data-settled={measure.isSettled ? 'yes' : 'no'} data-has-rect={measure.rect ? 'yes' : 'no'}>
      {measure.rect?.width ?? 'none'}
    </div>
  )
}

describe('useMeasure SSR', () => {
  it('renders the authored host with no box and no extra markup', () => {
    const html = renderToString(<ServerProbe />)
    expect(html).toContain('data-settled="no"')
    expect(html).toContain('data-has-rect="no"')
    expect(html).toContain('none')
    expect(html.match(/<div/g)?.length).toBe(1)
  })
})
