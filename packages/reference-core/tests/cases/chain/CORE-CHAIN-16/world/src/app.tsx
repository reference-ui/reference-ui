// Entry for the CORE-CHAIN-16 app. It takes the three package import shapes (direct, barrel, `css` wrapper) and a local
// `Div` control and emits them as one site. The control is the app's own primitive styled with the same token, so it
// compiles under the app's name and must never warn: the warning is about package ownership, not about style props.
import type { ReactElement } from 'react'
import { Div } from '@reference-ui/react'
import { Barrel } from './barrel.js'
import { Direct } from './direct.js'
import { Wrapped } from './wrapper.js'

export function Site(): ReactElement {
  return (
    <main>
      <Div color="chain16Ink">local control</Div>
      <Direct />
      <Barrel />
      <Wrapped />
    </main>
  )
}
