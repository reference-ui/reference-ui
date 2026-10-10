import { describe, expect, it } from 'vitest'
import * as React from 'react'
import { CheckIcon, Field } from '@reference-ui/lib'
import { ContentCopyIcon } from '@reference-ui/icons'
import { CheckBadge } from '@fixtures/aliased-host-library'
import { Index, matrixChainT17Marker } from '../../src/index'

describe('chain T17 runtime', () => {
  it('exports the matrix marker', () => {
    expect(matrixChainT17Marker).toBe('reference-ui-matrix-chain-t17')
  })

  it('renders the fixture entrypoint', () => {
    const element = Index()
    expect(element).toBeTruthy()
  })

  it('renders the expected root test id', () => {
    const element = Index()
    expect(element.props['data-testid']).toBe('chain-t17-root')
  })

  it('mounts every prebuilt probe with the expected wiring', () => {
    // Structural only, deliberately not a full React render: under vitest the
    // prebuilt lib/icons/fixture bundles resolve their own React copies, so
    // renderToStaticMarkup rejects their elements as foreign children.
    // Asserting the element tree pins the composition wiring (which component
    // lands on which testid) without a DOM; pixels and style backing stay with
    // the e2e contract.
    const children = React.Children.toArray(Index().props.children)
    const probes = children.filter(
      (child): child is React.ReactElement<{ 'data-testid'?: string }> =>
        React.isValidElement(child) &&
        typeof child.props['data-testid'] === 'string' &&
        child.props['data-testid'].startsWith('t17-')
    )
    expect(probes.map((probe) => probe.props['data-testid']).sort()).toEqual(
      [
        't17-controls-icon',
        't17-css-icon',
        't17-direct-icon',
        't17-field',
        't17-hover-icon',
        't17-lib-icon',
        't17-override-badge',
        't17-raw-icon',
      ].sort()
    )
    const byTestId = new Map(probes.map((probe) => [probe.props['data-testid'], probe.type]))
    expect(byTestId.get('t17-direct-icon')).toBe(ContentCopyIcon)
    expect(byTestId.get('t17-lib-icon')).toBe(CheckIcon)
    expect(byTestId.get('t17-field')).toBe(Field)
    expect(byTestId.get('t17-override-badge')).toBe(CheckBadge)
    expect(byTestId.get('t17-raw-icon')).toBe(ContentCopyIcon)
    expect(byTestId.get('t17-css-icon')).toBe(ContentCopyIcon)
    expect(byTestId.get('t17-hover-icon')).toBe(ContentCopyIcon)
  })
})
