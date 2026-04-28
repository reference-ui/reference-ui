import { describe, expect, it } from 'vitest'

import { Index, matrixVirtualMarker } from '../../src/index'

describe('virtual matrix runtime', () => {
  it('exports the matrix marker', () => {
    expect(matrixVirtualMarker).toBe('reference-ui-matrix-virtual')
  })

  it('renders the fixture entrypoint', () => {
    const element = Index()

    expect(element).toBeTruthy()
  })

  it('renders the expected root test id', () => {
    const element = Index()

    expect(element.props['data-testid']).toBe('virtual-root')
  })
})