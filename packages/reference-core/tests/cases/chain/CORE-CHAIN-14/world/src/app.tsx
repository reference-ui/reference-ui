// Entry for the CORE-CHAIN-14 app. It takes the upstream's Tile by name only, as an installed package's export reaches an
// app, and emits two call sites: Tile with a size of its own, and a Div control with a real size token. The app never sees
// Tile's source, so it can learn that Tile owns `size` only from the base system the upstream published.
import type { ReactElement } from 'react'
import { Div } from '@reference-ui/react'

declare function Tile(props: { size?: 'sm' | 'md' | 'lg' }): ReactElement

export function Site(): ReactElement {
  return (
    <>
      <Tile size="lg" />
      <Div size="2r" />
    </>
  )
}
