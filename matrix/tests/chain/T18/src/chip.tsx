import * as React from 'react'
import { Chip } from '@fixtures/primitive-named-library'

/**
 * A package wrapper that owns `size` (published in `jsxOwned`). The chip
 * consumes `size` itself, so the consumer styles nothing and no runtime class
 * or `no compiled class` miss may appear for it.
 */
export function ChipProbe(): React.ReactElement {
  return (
    <Chip data-testid="t18-chip" size="lg">
      owned size
    </Chip>
  )
}
