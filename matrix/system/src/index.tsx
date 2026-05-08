import { Div, H1, Main, P } from '@reference-ui/react'
import './system/styles'
import { systemLayeredRecipe, systemMatrixConstants, systemTokenCssClass } from './system/styles'

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

      <Div data-testid="system-token-color-mode-light" color={systemMatrixConstants.colorModeToken}>
        System token light mode color
      </Div>

      <div data-panda-theme="dark">
        <Div data-testid="system-token-color-mode-dark" color={systemMatrixConstants.colorModeToken}>
          System token dark mode color
        </Div>

        <Div data-testid="system-token-color-mode-light-preview" colorMode="light" color={systemMatrixConstants.colorModeToken}>
          System token light preview color
        </Div>

        <Div data-testid="system-token-color-mode-light-scope" colorMode="light">
          <Div data-testid="system-token-color-mode-light-island" color={systemMatrixConstants.colorModeToken}>
            System token light island color
          </Div>
        </Div>
      </div>

      <Div data-testid="system-token-spacing" padding="system-matrix-spacing">
        System token spacing
      </Div>

      <Div data-testid="system-token-radius" borderRadius="system-matrix-radius" borderWidth="1px" borderStyle="solid">
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

      <Div data-testid="system-token-css" className={systemTokenCssClass}>
        System token css class
      </Div>

      <div data-panda-theme="dark">
        <Div data-testid="system-token-css-dark" className={systemTokenCssClass}>
          System token css dark class
        </Div>

        <Div data-testid="system-token-css-light-preview" colorMode="light" className={systemTokenCssClass}>
          System token css light preview class
        </Div>

        <Div data-testid="system-token-css-light-scope" colorMode="light">
          <Div data-testid="system-token-css-light-island" className={systemTokenCssClass}>
            System token css light island class
          </Div>
        </Div>
      </div>

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