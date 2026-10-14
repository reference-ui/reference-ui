// Tile for the NEO-CHAIN-14 upstream package. It takes style props and a size of its own, and emits a Div that carries
// the style props. The props type reaches the component only through the forwardRef generic, so `size` is pulled out by
// name in the unannotated inner function and never forwarded: it is Tile's own prop, not the style prop `size`.
import * as React from 'react'
import { Div, type StyleProps } from '@reference-ui/react'

export type TileProps = StyleProps & {
  size?: 'sm' | 'md' | 'lg'
}

export const Tile = React.forwardRef<HTMLDivElement, TileProps>(function Tile({ size, ...rest }, ref) {
  return <Div ref={ref} data-size={size} {...rest} />
})
