import { describe, expect, it } from 'vitest'

import { Index, matrixResponsiveMarker } from '../../src/index'
import {
  responsiveCardRecipe,
  responsiveMatrixClasses,
  responsiveViewportConstants,
  responsiveViewportRecipe,
} from '../../src/styles'

describe('responsive matrix runtime', () => {
  it('exports the matrix marker', () => {
    expect(matrixResponsiveMarker).toBe('reference-ui-matrix-responsive')
  })

  it('exports the css() responsive class', () => {
    expect(responsiveMatrixClasses.sidebarCss).toBeTruthy()
  })

  it('exports the viewport css() responsive class', () => {
    expect(responsiveMatrixClasses.viewportCss).toBeTruthy()
  })

  it('returns a stable recipe class', () => {
    expect(responsiveCardRecipe()).toBe(responsiveCardRecipe())
  })

  it('returns a stable viewport recipe class', () => {
    expect(responsiveViewportRecipe()).toBe(responsiveViewportRecipe())
  })

  it('exports the viewport width breakpoint', () => {
    expect(responsiveViewportConstants.cssBreakpointWidth).toBe(800)
  })

  it('exports the viewport height breakpoint', () => {
    expect(responsiveViewportConstants.recipeBreakpointHeight).toBe(700)
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