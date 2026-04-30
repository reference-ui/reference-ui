import { Div, H1, Main, P } from '@reference-ui/react'
import './system/styles'
import { systemLayeredRecipe, systemMatrixConstants } from './system/styles'

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

      <Div data-testid="system-token-spacing" padding={systemMatrixConstants.spacingToken}>
        System token spacing
      </Div>

      <Div data-testid="system-token-radius" borderRadius={systemMatrixConstants.radiusToken} borderWidth="1px" borderStyle="solid">
        System token radius
      </Div>

      <Div data-testid="system-font-probe" font={systemMatrixConstants.fontName} weight={systemMatrixConstants.fontWeight}>
        System font probe
      </Div>

      <Div data-testid="system-animated" style={{ animation: `${systemMatrixConstants.animationName} 1s ease` }}>
        System animated
      </Div>

      <Div data-testid="system-global-var-probe" style={{ width: `var(${systemMatrixConstants.globalVarName})` }}>
        System global var probe
      </Div>

      <Div
        data-testid="system-layered-target"
        className={systemLayeredRecipe()}
        color={systemMatrixConstants.accentToken}
      >
        System layered target
      </Div>
    </Main>
  )
}