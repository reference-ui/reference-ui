import { Div, H1, Main, P } from '@reference-ui/react'

import './font/styles'

export const matrixFontMarker = 'reference-ui-matrix-font'

export function Index() {
  return (
    <Main data-testid="font-root" p="4">
      <H1>Reference UI font matrix</H1>
      <P>
        font() registrations are exercised through generated CSS, typed font
        registries, and browser-applied primitives.
      </P>

      <Div data-testid="font-sans-default" font="sans">
        Sans default
      </Div>

      <Div data-testid="font-serif-default" font="serif">
        Serif default
      </Div>

      <Div data-testid="font-mono-bold" font="mono" weight="bold">
        Mono bold
      </Div>

      <Div data-testid="font-sans-compound" font="sans" weight="sans.bold">
        Sans compound bold
      </Div>
    </Main>
  )
}