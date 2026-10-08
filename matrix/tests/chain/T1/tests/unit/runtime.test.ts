import { describe, expect, it } from 'vitest'
import { Index, matrixChainT1Marker } from '../../src/index'

describe('chain T1 runtime', () => {
  it('exports the matrix marker', () => {
    expect(matrixChainT1Marker).toBe('reference-ui-matrix-chain-t1')
  })

  it('renders the fixture entrypoint', () => {
    const element = Index()
    expect(element).toBeTruthy()
  })

  it('renders the expected root test id', () => {
    const element = Index()
    expect(element.props['data-testid']).toBe('chain-t1-root')
  })
})
