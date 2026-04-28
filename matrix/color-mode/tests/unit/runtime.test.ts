import { describe, expect, it } from 'vitest'

import { Index, matrixColorModeMarker } from '../../src/index'
import { colorModeMatrixConstants } from '../../src/styles'

describe('color-mode matrix runtime', () => {
  it('exports the matrix marker', () => {
    expect(matrixColorModeMarker).toBe('reference-ui-matrix-color-mode')
  })

  it('exports the color-mode token name', () => {
    expect(colorModeMatrixConstants.tokenName).toBe('matrixColorModeToken')
  })

  it('renders the fixture entrypoint', () => {
    const element = Index()

    expect(element).toBeTruthy()
  })

  it('renders the expected root test id', () => {
    const element = Index()

    expect(element.props['data-testid']).toBe('color-mode-root')
  })
})