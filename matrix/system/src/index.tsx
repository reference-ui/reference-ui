import { Div, H1, Main, P } from '@reference-ui/react'
import './system/styles'
import { systemMatrixConstants } from './system/styles'

export const matrixSystemMarker = 'reference-ui-matrix-system'

export function Index() {
  return (
    <Main data-testid="system-root" p="4" gap="4">
      <H1>Reference UI system matrix</H1>
      <P>tokens(), globalCss(), and keyframes() are exercised through real generated CSS.</P>

      <Div data-testid="system-token-text" color={systemMatrixConstants.accentToken}>
        System token text
      </Div>

      <Div data-testid="system-token-background" backgroundColor={systemMatrixConstants.accentToken} color="white" p="3">
        System token background
      </Div>

      <Div data-testid="system-animated" style={{ animation: `${systemMatrixConstants.animationName} 1s ease` }}>
        System animated
      </Div>

      <Div data-testid="system-global-var-probe" style={{ width: `var(${systemMatrixConstants.globalVarName})` }}>
        System global var probe
      </Div>
    </Main>
  )
}