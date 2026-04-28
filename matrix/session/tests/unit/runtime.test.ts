import { describe, expect, it } from 'vitest'

import { Index, matrixSessionMarker } from '../../src/index'

describe('session matrix runtime', () => {
  it('exports the matrix marker', () => {
    expect(matrixSessionMarker).toBe('reference-ui-matrix-session')
  })

  it('renders the fixture entrypoint', () => {
    const element = Index()

    expect(element).toBeTruthy()
  })

  it('renders the expected root test id', () => {
    const element = Index()

    expect(element.props['data-testid']).toBe('session-root')
  })
})