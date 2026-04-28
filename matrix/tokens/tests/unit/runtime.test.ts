import { describe, expect, it } from 'vitest'

import { Index, matrixTokensMarker } from '../../src/index'
import { tokensMatrixClasses, tokensMatrixConstants } from '../../src/styles'

describe('tokens matrix runtime', () => {
  it('exports the matrix marker', () => {
    expect(matrixTokensMarker).toBe('reference-ui-matrix-tokens')
  })

  it('exports the primary token name', () => {
    expect(tokensMatrixConstants.primaryToken).toBe('matrixPrimaryToken')
  })

  it('exports the css() token class', () => {
    expect(tokensMatrixClasses.card).toBeTruthy()
  })

  it('renders the fixture entrypoint', () => {
    const element = Index()

    expect(element).toBeTruthy()
  })

  it('renders the expected root test id', () => {
    const element = Index()

    expect(element.props['data-testid']).toBe('tokens-root')
  })
})