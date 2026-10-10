import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { useIsomorphicLayoutEffect } from './effects'

describe('useIsomorphicLayoutEffect', () => {
  it('selects the plain effect where no document exists', () => {
    // Default vitest environment is node: no document, so the server
    // branch wins and no layout-effect warning can fire. The browser
    // branch (useLayoutEffect) is exercised by every happy-dom Switch
    // suite through the authored-thumb reconciliation effect.
    expect(typeof document).toBe('undefined')
    expect(useIsomorphicLayoutEffect).toBe(React.useEffect)
  })
})
