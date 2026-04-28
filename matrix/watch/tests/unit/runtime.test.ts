import { describe, expect, it } from 'vitest'
import { Div } from '@reference-ui/react'

import { Index, matrixWatchMarker } from '../../src/index'

describe('watch matrix runtime', () => {
  it('exposes the shared marker and root fixture entrypoint', () => {
    expect(matrixWatchMarker).toBe('reference-ui-matrix-watch')

    const element = Index()

    expect(element).toBeTruthy()
    expect(element.props['data-testid']).toBe('watch-root')
  })

  it('can resolve Reference UI runtime packages in Vitest', () => {
    expect(Div).toBeTruthy()
  })
})