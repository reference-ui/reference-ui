import { describe, expect, it } from 'vitest'
import { Index, matrixChainT2Marker } from '../../src/index'

describe('chain T2 runtime', () => {
  it('exports the matrix marker', () => {
    expect(matrixChainT2Marker).toBe('reference-ui-matrix-chain-t2')
  })

  it('renders the fixture entrypoint', () => {
    const element = Index()
    expect(element).toBeTruthy()
  })

  it('renders the expected root test id', () => {
    const element = Index()
    expect(element.props['data-testid']).toBe('chain-t2-root')
  })
})
