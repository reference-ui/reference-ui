import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { FocusLock } from './FocusLock'

function refWarningCalls(errorSpy: { mock: { calls: unknown[][] } }): unknown[][] {
  return errorSpy.mock.calls.filter(args =>
    args.some(arg => typeof arg === 'string' && /element\.ref|ref was removed/i.test(arg))
  )
}

describe('FL-REF-01', () => {
  it('reads the child ref without a React ref warning', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      // React 19.2+ arms the element.ref deprecation getter only when the
      // element carries a ref, so the ref-carrying child is the biting case.
      const consumerRef = React.createRef<HTMLElement>()
      const html = renderToString(
        <FocusLock>
          <section data-testid="lock-with-ref" ref={consumerRef}>
            <button type="button">Go</button>
          </section>
        </FocusLock>
      )
      expect(html).toContain('data-testid="lock-with-ref"')
      const plain = renderToString(
        <FocusLock>
          <section data-testid="lock-no-ref">
            <button type="button">Go</button>
          </section>
        </FocusLock>
      )
      expect(plain).toContain('data-testid="lock-no-ref"')
      expect(refWarningCalls(errorSpy)).toEqual([])
    } finally {
      errorSpy.mockRestore()
    }
  })
})
