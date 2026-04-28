import { describe, expect, it } from 'vitest'

import { Index, matrixRecipeMarker } from '../../src/index'
import { recipeMatrixButton } from '../../src/styles'

describe('recipe matrix runtime', () => {
  it('exports the matrix marker', () => {
    expect(matrixRecipeMarker).toBe('reference-ui-matrix-recipe')
  })

  it('returns stable classes for repeated calls', () => {
    expect(recipeMatrixButton()).toBe(recipeMatrixButton())
  })

  it('renders the fixture entrypoint', () => {
    const element = Index()

    expect(element).toBeTruthy()
  })

  it('renders the expected root test id', () => {
    const element = Index()

    expect(element.props['data-testid']).toBe('recipe-root')
  })
})