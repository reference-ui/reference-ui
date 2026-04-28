import { describe, expect, it } from 'vitest'

import { Index, matrixResponsiveMarker } from '../../src/index'
import { responsiveCardRecipe, responsiveMatrixClasses } from '../../src/styles'

describe('responsive matrix runtime', () => {
  it('exports the matrix marker', () => {
    expect(matrixResponsiveMarker).toBe('reference-ui-matrix-responsive')
  })

  it('exports the css() responsive class', () => {
    expect(responsiveMatrixClasses.sidebarCss).toBeTruthy()
  })

  it('returns a stable recipe class', () => {
    expect(responsiveCardRecipe()).toBe(responsiveCardRecipe())
  })

  it('renders the fixture entrypoint', () => {
    const element = Index()

    expect(element).toBeTruthy()
  })

  it('renders the expected root test id', () => {
    const element = Index()

    expect(element.props['data-testid']).toBe('responsive-root')
  })
})