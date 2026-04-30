import { Div, H1, Main, P } from '@reference-ui/react'

import {
  responsiveCardRecipe,
  responsiveMatrixClasses,
  responsiveSharedRecipe,
  responsiveViewportConstants,
  responsiveViewportRecipe,
} from './styles'

export const matrixResponsiveMarker = 'reference-ui-matrix-responsive'

export function Index() {
  return (
    <Main data-testid="responsive-root" p="4" gap="4">
      <H1>Reference UI responsive matrix</H1>
      <P>Responsive behaviour is exercised across primitive r props, css(), and recipe().</P>

      <Div container data-testid="responsive-primitive-shell-narrow" style={{ width: '180px' }}>
        <Div data-testid="responsive-primitive-target-narrow" r={{ 400: { padding: '20px', backgroundColor: '#dbeafe' } }}>
          Primitive narrow
        </Div>
      </Div>

      <Div container data-testid="responsive-primitive-shell-wide" style={{ width: '520px' }}>
        <Div data-testid="responsive-primitive-target-wide" r={{ 400: { padding: '20px', backgroundColor: '#dbeafe' } }}>
          Primitive wide
        </Div>
      </Div>

      <Div container="sidebar" data-testid="responsive-css-shell-narrow" style={{ width: '180px' }}>
        <Div data-testid="responsive-css-target-narrow" className={responsiveMatrixClasses.sidebarCss}>
          CSS narrow
        </Div>
      </Div>

      <Div container="sidebar" data-testid="responsive-css-shell-wide" style={{ width: '240px' }}>
        <Div data-testid="responsive-css-target-wide" className={responsiveMatrixClasses.sidebarCss}>
          CSS wide
        </Div>
      </Div>

      <Div container="card" data-testid="responsive-recipe-shell-narrow" style={{ width: '260px' }}>
        <Div p="6">
          <Div data-testid="responsive-recipe-target-narrow" className={responsiveCardRecipe()}>
            Recipe narrow
          </Div>
        </Div>
      </Div>

      <Div container="card" data-testid="responsive-recipe-shell-wide" style={{ width: '360px' }}>
        <Div p="6">
          <Div data-testid="responsive-recipe-target-wide" className={responsiveCardRecipe()}>
            Recipe wide
          </Div>
        </Div>
      </Div>

      <Div data-testid="responsive-viewport-css-target" className={responsiveMatrixClasses.viewportCss}>
        Viewport CSS
      </Div>

      <Div data-testid="responsive-viewport-recipe-target" className={responsiveViewportRecipe()}>
        Viewport recipe
      </Div>

      <Div container="mixed" data-testid="responsive-mixed-shell-narrow" style={{ width: '220px' }}>
        <Div data-testid="responsive-mixed-target-narrow" className={responsiveMatrixClasses.mixedCss}>
          Mixed narrow
        </Div>
      </Div>

      <Div container="mixed" data-testid="responsive-mixed-shell-wide" style={{ width: '320px' }}>
        <Div data-testid="responsive-mixed-target-wide" className={responsiveMatrixClasses.mixedCss}>
          Mixed wide
        </Div>
      </Div>

      <Div container data-testid="responsive-shared-shell-narrow" style={{ width: '320px' }}>
        <Div
          data-testid="responsive-shared-primitive-narrow"
          r={{
            [responsiveViewportConstants.sharedContainerBreakpoint]: {
              padding: responsiveViewportConstants.sharedPrimitivePadding,
              backgroundColor: responsiveViewportConstants.sharedPrimitiveBackground,
            },
          }}
        >
          Shared primitive narrow
        </Div>
        <Div data-testid="responsive-shared-css-narrow" className={responsiveMatrixClasses.sharedCss}>
          Shared css narrow
        </Div>
        <Div data-testid="responsive-shared-recipe-narrow" className={responsiveSharedRecipe()}>
          Shared recipe narrow
        </Div>
      </Div>

      <Div container data-testid="responsive-shared-shell-wide" style={{ width: '420px' }}>
        <Div
          data-testid="responsive-shared-primitive-wide"
          r={{
            [responsiveViewportConstants.sharedContainerBreakpoint]: {
              padding: responsiveViewportConstants.sharedPrimitivePadding,
              backgroundColor: responsiveViewportConstants.sharedPrimitiveBackground,
            },
          }}
        >
          Shared primitive wide
        </Div>
        <Div data-testid="responsive-shared-css-wide" className={responsiveMatrixClasses.sharedCss}>
          Shared css wide
        </Div>
        <Div data-testid="responsive-shared-recipe-wide" className={responsiveSharedRecipe()}>
          Shared recipe wide
        </Div>
      </Div>
    </Main>
  )
}
