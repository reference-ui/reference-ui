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

      <Div data-testid="spacing-padding-right-override" padding="1r 2r 3r 4r" paddingRight="5r">
        Rhythm right override
      </Div>

      <Div data-testid="spacing-margin-left-override" margin="2r" marginLeft="3r">
        Rhythm left override
      </Div>

      <Div data-testid="spacing-margin-top-override" margin="1r 2r 3r 4r" marginTop="6r">
        Rhythm top override
      </Div>

      <Div data-testid="spacing-radius" borderRadius="1r" borderWidth="1px" borderStyle="solid">
        Rhythm radius
      </Div>

      <Div data-testid="spacing-radius-2r" borderRadius="2r" borderWidth="1px" borderStyle="solid">
        Rhythm radius 2r
      </Div>

      <Div data-testid="spacing-radius-literal" borderRadius="12px" borderWidth="1px" borderStyle="solid">
        Literal radius
      </Div>

      <Div data-testid="spacing-radius-token" borderRadius="lg" borderWidth="1px" borderStyle="solid">
        Token radius
      </Div>

      <Div data-testid="spacing-radius-top-pair" borderTopRadius="2r" borderWidth="1px" borderStyle="solid">
        Top pair radius
      </Div>

      <Div data-testid="spacing-radius-bottom-pair" borderBottomRadius="2r" borderWidth="1px" borderStyle="solid">
        Bottom pair radius
      </Div>

      <Div data-testid="spacing-radius-left-pair" borderLeftRadius="2r" borderWidth="1px" borderStyle="solid">
        Left pair radius
      </Div>

      <Div data-testid="spacing-radius-right-pair" borderRightRadius="2r" borderWidth="1px" borderStyle="solid">
        Right pair radius
      </Div>

      <Div data-testid="spacing-radius-start-pair" borderStartRadius="2r" borderWidth="1px" borderStyle="solid">
        Start pair radius
      </Div>

      <Div data-testid="spacing-radius-end-pair" borderEndRadius="2r" borderWidth="1px" borderStyle="solid">
        End pair radius
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