import { Div, H1, Main, P } from '@reference-ui/react'

import { spacingMatrixClasses } from './styles'

export const matrixSpacingMarker = 'reference-ui-matrix-spacing'

export function Index() {
  return (
    <Main data-testid="spacing-root" p="4" gap="4">
      <H1>Reference UI spacing matrix</H1>
      <P>Rhythm props and size custom props are exercised against emitted design-system CSS.</P>

      <Div data-testid="spacing-rhythm-block" padding="2r">
        Rhythm block
      </Div>

      <Div data-testid="spacing-rhythm-shorthand" padding="1r 2r">
        Rhythm shorthand
      </Div>

      <Div data-testid="spacing-padding-bottom-override" padding="1r 2r" paddingBottom="4r">
        Rhythm bottom override
      </Div>

      <Div data-testid="spacing-margin-left-override" margin="2r" marginLeft="3r">
        Rhythm left override
      </Div>

      <Div data-testid="spacing-radius" borderRadius="1r" borderWidth="1px" borderStyle="solid">
        Rhythm radius
      </Div>

      <Div data-testid="spacing-size-box" className={spacingMatrixClasses.sizeBox}>
        Size box
      </Div>

      <Div data-testid="spacing-size-width-override" size="2r" width="3r">
        Size width override
      </Div>

      <Div data-testid="spacing-size-height-override" size="2r" height="4r">
        Size height override
      </Div>
    </Main>
  )
}