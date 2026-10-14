import * as React from 'react'
import { Div } from '@reference-ui/react'
import type { TileProps } from './types'

// The props type reaches this component only through the forwardRef generic, so the
// destructure in the inner function is where `size` and `tone` are pulled out by name.
export const Tile = React.forwardRef<HTMLDivElement, TileProps>(function Tile(
  { size, tone, ...rest },
  ref
) {
  void size
  void tone
  return <Div ref={ref} {...rest} />
})
