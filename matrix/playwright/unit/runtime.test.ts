import { describe, expect, it } from 'vitest'
import { Div } from '@reference-ui/react'

import { matrixPlaywrightMarker, renderPlaywrightMatrixLabel } from '../src/index'

describe('playwright matrix runtime', () => {
  it('exposes the shared marker and runtime helpers for unit coverage', () => {
    expect(matrixPlaywrightMarker).toBe('reference-ui-matrix-playwright')
    expect(renderPlaywrightMatrixLabel()).toBe('Reference UI Playwright matrix')
  })

  it('can resolve Reference UI runtime packages in Vitest', () => {
    expect(Div).toBeTruthy()
  })
})