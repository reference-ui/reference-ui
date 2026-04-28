import { Div, H1, Main, P } from '@reference-ui/react'

import { tokensMatrixClasses, tokensMatrixConstants } from './styles'

export const matrixTokensMarker = 'reference-ui-matrix-tokens'

export function Index() {
  return (
    <Main data-testid="tokens-root" p="4" gap="4">
      <H1>Reference UI tokens matrix</H1>
      <P>Token generation and runtime CSS variable consumption are exercised together.</P>

      <Div data-testid="tokens-primitive" color={tokensMatrixConstants.primaryToken}>
        Primitive token probe
      </Div>

      <Div data-testid="tokens-css" className={tokensMatrixClasses.card}>
        CSS token probe
      </Div>
    </Main>
  )
}