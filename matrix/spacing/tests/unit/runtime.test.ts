import { describe, expect, it } from 'vitest'

import { Index, matrixSpacingMarker } from '../../src/index'
import { spacingMatrixClasses } from '../../src/styles'

describe('spacing matrix runtime', () => {
  it('exports the matrix marker', () => {
    expect(matrixSpacingMarker).toBe('reference-ui-matrix-spacing')
  })

  it('exports the size utility class', () => {
    expect(spacingMatrixClasses.sizeBox).toContain('size_')
  })

  it('renders the fixture entrypoint', () => {
    const element = Index()

    expect(element).toBeTruthy()
  })

  it('renders the expected root test id', () => {
    const element = Index()

    expect(element.props['data-testid']).toBe('spacing-root')
  })
})