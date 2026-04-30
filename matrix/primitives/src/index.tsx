import { Div, H1, Main, P } from '@reference-ui/react'

export const matrixPrimitivesMarker = 'reference-ui-matrix-primitives'

export function Index() {
  return (
    <Main data-testid="primitives-root" p="4" gap="4">
      <H1>Reference UI Primitives matrix</H1>
      <P>Primitive mounting and style props are exercised against emitted design-system CSS.</P>
      <Div data-testid="primitive-basic" p="3">
        Basic primitive
      </Div>
      <Div
        data-testid="primitive-style-props"
        color="red.600"
        backgroundColor="yellow.100"
        padding="1rem"
        borderColor="blue.600"
        borderStyle="solid"
        borderWidth="2px"
        borderRadius="12px"
      >
        Styled primitive
      </Div>
      <Div
        data-testid="primitive-inline-border"
        borderColor="green.600"
        borderStyle="solid"
        borderWidth="3px"
        borderRadius="8px"
      >
        Inline border primitive
      </Div>
      <Div
        data-testid="primitive-css-prop"
        padding="0.5rem"
        css={{
          position: 'relative',
          top: '4px',
          left: '8px',
        }}
      >
        CSS prop primitive
      </Div>
      <Div data-testid="primitive-font-sans" font="sans">
        Sans primitive
      </Div>
      <Div data-testid="primitive-font-bold" font="sans" weight="bold">
        Bold primitive
      </Div>
      <Div data-testid="primitive-font-token" font="sans" weight="sans.bold">
        Token bold primitive
      </Div>
      <Div data-testid="primitive-container-anon" container>
        Anonymous container primitive
      </Div>
      <Div data-testid="primitive-container-named" container="sidebar">
        Named container primitive
      </Div>
      <Div data-testid="primitive-size-square" size="2r">
        Size primitive
      </Div>
      <Div data-testid="primitive-responsive-narrow-shell" container="sidebar" width="320px">
        <Div
          data-testid="primitive-responsive-narrow"
          padding="0.25rem"
          fontSize="1rem"
          r={{
            400: {
              padding: '1rem',
              fontSize: '1.125rem',
            },
          }}
        >
          Narrow responsive primitive
        </Div>
      </Div>
      <Div data-testid="primitive-responsive-wide-shell" container="sidebar" width="480px">
        <Div
          data-testid="primitive-responsive-wide"
          padding="0.25rem"
          fontSize="1rem"
          r={{
            400: {
              padding: '1rem',
              fontSize: '1.125rem',
            },
          }}
        >
          Wide responsive primitive
        </Div>
      </Div>

      <Div data-testid="primitive-combined-custom-props-narrow-shell" container="card" width="320px">
        <Div
          data-testid="primitive-combined-custom-props-narrow"
          font="sans"
          weight="sans.bold"
          size="2r"
          fontSize="1rem"
          r={{
            400: {
              fontSize: '1.125rem',
            },
          }}
        >
          Narrow combined custom props primitive
        </Div>
      </Div>

      <Div data-testid="primitive-combined-custom-props-wide-shell" container="card" width="480px">
        <Div
          data-testid="primitive-combined-custom-props-wide"
          font="sans"
          weight="sans.bold"
          size="2r"
          fontSize="1rem"
          r={{
            400: {
              fontSize: '1.125rem',
            },
          }}
        >
          Wide combined custom props primitive
        </Div>
      </Div>
    </Main>
  )
}