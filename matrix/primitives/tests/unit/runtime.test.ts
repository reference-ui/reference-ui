import { describe, expect, it } from 'vitest'
import { Div } from '@reference-ui/react'

import { Index, matrixPrimitivesMarker } from '../../src/index'

describe('primitives matrix runtime', () => {
  it('exposes the shared marker and fixture entrypoint', () => {
    expect(matrixPrimitivesMarker).toBe('reference-ui-matrix-primitives')

    const element = Index()

    expect(element).toBeTruthy()
    expect(element.props['data-testid']).toBe('primitives-root')
  })

  it('can resolve Reference UI runtime packages in Vitest', () => {
    expect(Div).toBeTruthy()
  })
})