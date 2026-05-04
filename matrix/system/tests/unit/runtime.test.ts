import { describe, expect, it } from 'vitest'

import { matrixSystemMarker, Index } from '../../src/index'
import { systemMatrixConstants } from '../../src/system/styles'

describe('system matrix runtime', () => {
  it('exports the matrix marker', () => {
    expect(matrixSystemMarker).toBe('reference-ui-matrix-system')
  })

  it('exports the system token name', () => {
    expect(systemMatrixConstants.accentToken).toBe('systemMatrixAccent')
  })

  it('exports the global css variable name', () => {
    expect(systemMatrixConstants.globalVarName).toBe('--system-matrix-global-var')
  })

  it('exports the keyframes animation name', () => {
    expect(systemMatrixConstants.animationName).toBe('systemMatrixFadeIn')
  })

  it('renders the fixture entrypoint', () => {
    const element = Index()

    expect(element).toBeTruthy()
  })

  it('renders the expected root test id', () => {
    const element = Index()

    expect(element.props['data-testid']).toBe('system-root')
  })
})