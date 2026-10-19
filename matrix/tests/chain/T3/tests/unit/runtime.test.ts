/**
 * Chain T3 runtime suite (`describe('chain T3 runtime')`). Mounts the fixture
 * entrypoint in node, without a browser, and asserts the matrix marker export
 * plus the expected root test id. Fast pre-check ahead of the Playwright
 * contract in `../e2e/`; runs under the chain-t3 sync output.
 */

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
