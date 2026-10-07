import { describe, expect, it } from 'vitest'
import * as React from 'react'
import { CheckIcon } from '@reference-ui/lib'
import { ContentCopyIcon } from '@reference-ui/icons'
import { CheckBadge, CopyBadge } from '@fixtures/aliased-host-library'
import { Index, matrixChainT16Marker } from '../../src/index'

describe('chain T16 runtime', () => {
  it('exports the matrix marker', () => {
    expect(matrixChainT16Marker).toBe('reference-ui-matrix-chain-t16')
  })

  it('renders the fixture entrypoint', () => {
    const element = Index()
    expect(element).toBeTruthy()
  })

  it('renders the expected root test id', () => {
    const element = Index()
    expect(element.props['data-testid']).toBe('chain-t16-root')
  })

  it('mounts the four aliased-host shells with the expected wiring', () => {
    // Structural only, deliberately not a full React render: under vitest
    // the prebuilt lib/icons/fixture bundles resolve their own React
    // copies, so renderToStaticMarkup rejects their elements as foreign
    // children. Asserting the element tree pins the composition wiring
    // (which component lands on which testid, on which path) without a
    // DOM; pixels and style backing stay with the e2e contract.
    const children = React.Children.toArray(Index().props.children)
    const shells = children.filter(
      (child): child is React.ReactElement<{ 'data-testid'?: string }> =>
        React.isValidElement(child) &&
        typeof child.props['data-testid'] === 'string' &&
        child.props['data-testid'].startsWith('t16-')
    )
    expect(shells.map((shell) => shell.props['data-testid']).sort()).toEqual(
      [
        't16-direct-icon',
        't16-fixture-check-badge',
        't16-fixture-copy-badge',
        't16-lib-icon',
      ].sort()
    )
    const byTestId = new Map(shells.map((shell) => [shell.props['data-testid'], shell.type]))
    // Transitive layers path (through lib) in both import shapes, plus the
    // direct layers path (fixture badges).
    expect(byTestId.get('t16-lib-icon')).toBe(CheckIcon)
    expect(byTestId.get('t16-direct-icon')).toBe(ContentCopyIcon)
    expect(byTestId.get('t16-fixture-check-badge')).toBe(CheckBadge)
    expect(byTestId.get('t16-fixture-copy-badge')).toBe(CopyBadge)
  })
})
