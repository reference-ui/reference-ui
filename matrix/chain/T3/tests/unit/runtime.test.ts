import { describe, expect, it } from 'vitest'
import { Index, matrixChainT3Marker } from '../../src/index'

describe('chain T3 runtime', () => {
  it('exports the matrix marker', () => {
    expect(matrixChainT3Marker).toBe('reference-ui-matrix-chain-t3')
  })

  it('renders the fixture entrypoint', () => {
    const element = Index()
    expect(element).toBeTruthy()
  })

  it('renders the expected root test id', () => {
    const element = Index()
    expect(element.props['data-testid']).toBe('chain-t3-root')
  })
})
