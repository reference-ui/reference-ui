import { describe, expect, it } from 'vitest'
import { Div } from '@reference-ui/react'

import { Index, matrixPlaywrightMarker } from '../../src/index'

describe('playwright matrix runtime', () => {
  it('exposes the shared marker and component entrypoint for unit coverage', () => {
    expect(matrixPlaywrightMarker).toBe('reference-ui-matrix-playwright')

    const element = Index()

    expect(element).toBeTruthy()
    expect(element.props['data-testid']).toBe('playwright-root')
  })

  it('can resolve Reference UI runtime packages in Vitest', () => {
    expect(Div).toBeTruthy()
  })
})