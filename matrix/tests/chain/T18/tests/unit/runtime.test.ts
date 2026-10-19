import { describe, expect, it } from 'vitest'
import * as React from 'react'
import { Index, matrixChainT18Marker } from '../../src/index'
import { AcmeButtonProbe } from '../../src/acme-button'
import { BarrelButtonProbe } from '../../src/barrel-button'
import { ChipProbe } from '../../src/chip'
import { IconProbe } from '../../src/icon'
import { LibButtonProbe } from '../../src/lib-button'
import { NamespaceButtonProbe } from '../../src/namespace-button'
import { TileProbe } from '../../src/tile'
import { WrapperButtonProbe } from '../../src/wrapper-button'

describe('chain T18 runtime', () => {
  it('exports the matrix marker', () => {
    expect(matrixChainT18Marker).toBe('reference-ui-matrix-chain-t18')
  })

  it('renders the expected root test id', () => {
    const element = Index()
    expect(element.props['data-testid']).toBe('chain-t18-root')
  })

  it('mounts one probe per import shape', () => {
    // Structural only, as in T17: the prebuilt bundles resolve their own React
    // copies under vitest, so a full render would reject their elements. The
    // element tree pins which probe file lands in the entry; pixels and
    // backing stay with the e2e contract.
    const children = React.Children.toArray(Index().props.children).filter(React.isValidElement)
    expect(children.map((child) => child.type)).toEqual(
      expect.arrayContaining([
        LibButtonProbe,
        NamespaceButtonProbe,
        IconProbe,
        ChipProbe,
        AcmeButtonProbe,
        BarrelButtonProbe,
        WrapperButtonProbe,
        TileProbe,
      ])
    )
  })
})
