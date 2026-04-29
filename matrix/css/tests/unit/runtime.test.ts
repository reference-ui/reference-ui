import { describe, expect, it } from 'vitest'

import { cssMatrixConstants } from '../../src/constants'
import { matrixCssMarker, Index } from '../../src/index'
import { cssMatrixClasses } from '../../src/styles'

describe('css matrix runtime', () => {
  it('exports the matrix marker', () => {
    expect(matrixCssMarker).toBe('reference-ui-matrix-css')
  })

  it('renders the fixture entrypoint', () => {
    const element = Index()

    expect(element).toBeTruthy()
  })

  it('renders the expected root test id', () => {
    const element = Index()

    expect(element.props['data-testid']).toBe('css-root')
  })

  it('defines the card css class', () => {
    expect(cssMatrixClasses.card).toBeTruthy()
  })

  it('defines the positioned css class', () => {
    expect(cssMatrixClasses.positioned).toBeTruthy()
  })

  it('defines the hoverable css class', () => {
    expect(cssMatrixClasses.hoverable).toBeTruthy()
  })

  it('defines the nested css class', () => {
    expect(cssMatrixClasses.nestedParent).toBeTruthy()
  })

  it('defines the stateful css class', () => {
    expect(cssMatrixClasses.stateful).toBeTruthy()
  })

  it('defines the compound selector css class', () => {
    expect(cssMatrixClasses.compoundSelector).toBeTruthy()
  })

  it('defines the container css class', () => {
    expect(cssMatrixClasses.containerProbe).toBeTruthy()
  })

  it('exports the configured css layer name', () => {
    expect(cssMatrixConstants.layerName).toBe('css')
  })

  it('exports the configured css layer name again for direct constants access', () => {
    expect(cssMatrixConstants.layerName).toBe('css')
  })
})