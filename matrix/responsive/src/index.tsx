import { Div, H1, Main, P } from '@reference-ui/react'

import { responsiveCardRecipe, responsiveMatrixClasses } from './styles'

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
    </Main>
  )
}