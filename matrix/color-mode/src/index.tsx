import { Div, H1, Main, P } from '@reference-ui/react'

import { colorModeMatrixConstants } from './styles'

export const matrixColorModeMarker = 'reference-ui-matrix-color-mode'

export function Index() {
  return (
    <Main data-testid="color-mode-root" p="4" gap="4">
      <H1>Reference UI color-mode matrix</H1>
      <P>Color-mode tokens are exercised through real `data-panda-theme` and `colorMode` behaviour.</P>

      <div data-testid="color-mode-light-scope" data-panda-theme="light">
        <Div data-testid="color-mode-outer-light" color={colorModeMatrixConstants.tokenName}>
          Outer light token
        </Div>
        <Div data-testid="color-mode-inner-dark" colorMode="dark" color={colorModeMatrixConstants.tokenName}>
          Inner dark token
        </Div>
      </div>

      <div data-testid="color-mode-dark-scope" data-panda-theme="dark">
        <Div data-testid="color-mode-preview-dark" colorMode="dark" color={colorModeMatrixConstants.tokenName}>
          Preview dark token
        </Div>
        <Div data-testid="color-mode-preview-light" colorMode="light" color={colorModeMatrixConstants.tokenName}>
          Preview light token
        </Div>
      </div>

      <div data-testid="color-mode-light-host" data-panda-theme="light">
        <Div data-testid="color-mode-light-host-token" color={colorModeMatrixConstants.tokenName}>
          Light host token
        </Div>
        <Div data-testid="color-mode-dark-island-token" colorMode="dark" color={colorModeMatrixConstants.tokenName}>
          Dark island token
        </Div>
      </div>

      <div data-testid="color-mode-cascade-dark-host" data-panda-theme="dark">
        <Div data-testid="color-mode-cascade-light-scope" colorMode="light">
          <Div data-testid="color-mode-cascade-light-child" color={colorModeMatrixConstants.tokenName}>
            Cascade light child
          </Div>
        </Div>
        <Div data-testid="color-mode-cascade-dark-scope" colorMode="dark">
          <Div data-testid="color-mode-cascade-dark-child" color={colorModeMatrixConstants.tokenName}>
            Cascade dark child
          </Div>
        </Div>
      </div>
    </Main>
  )
}