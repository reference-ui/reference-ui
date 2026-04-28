import { describe, expect, it } from 'vitest'
import { Div } from '@reference-ui/react'

import { Index, matrixPrimitivesMarker } from '../../src/index'

describe('primitives matrix runtime', () => {
  it('exports the matrix marker', () => {
    expect(matrixPrimitivesMarker).toBe('reference-ui-matrix-primitives')
  })

  it('renders the fixture entrypoint', () => {
    const element = Index()

    expect(element).toBeTruthy()
  })

  it('renders the expected root test id', () => {
    const element = Index()

    expect(element.props['data-testid']).toBe('primitives-root')
  })

  it('resolves Reference UI runtime packages in Vitest', () => {
    expect(Div).toBeTruthy()
  })
})