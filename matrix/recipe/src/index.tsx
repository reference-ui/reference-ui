import { Div, H1, Main, P } from '@reference-ui/react'

import { recipeMatrixButton, recipeMatrixResponsiveCard } from './styles'

export const matrixRecipeMarker = 'reference-ui-matrix-recipe'

export function Index() {
  return (
    <Main data-testid="recipe-root" p="4" gap="4">
      <H1>Reference UI recipe matrix</H1>
      <P>recipe() variants and compound branches are exercised against emitted design-system CSS.</P>

      <button type="button" data-testid="recipe-default" className={recipeMatrixButton()}>
        Default recipe branch
      </button>

      <button
        type="button"
        data-testid="recipe-solid-large"
        className={recipeMatrixButton({ visual: 'solid', tone: 'teal', size: 'lg' })}
      >
        Solid large recipe branch
      </button>

      <button
        type="button"
        data-testid="recipe-outline-teal"
        className={recipeMatrixButton({ visual: 'outline', tone: 'teal', size: 'sm' })}
      >
        Outline teal recipe branch
      </button>

      <button
        type="button"
        data-testid="recipe-outline-pink"
        className={recipeMatrixButton({ visual: 'outline', tone: 'pink', size: 'lg' })}
      >
        Outline pink compound branch
      </button>

      <button
        type="button"
        data-testid="recipe-outline-pink-capsule"
        className={recipeMatrixButton({ visual: 'outline', tone: 'pink', size: 'lg', capsule: true })}
      >
        Outline pink capsule compound branch
      </button>

      <P>Responsive recipe branches are exercised across viewport media queries and container queries.</P>

      <Div data-testid="recipe-responsive-viewport-target" className={recipeMatrixResponsiveCard({ tone: 'alert' })}>
        Responsive viewport recipe branch
      </Div>

      <Div container data-testid="recipe-responsive-container-shell-narrow" style={{ width: '280px' }}>
        <Div data-testid="recipe-responsive-container-target-narrow" className={recipeMatrixResponsiveCard({ tone: 'alert' })}>
          Responsive container recipe branch
        </Div>
      </Div>

      <Div container data-testid="recipe-responsive-container-shell-wide" style={{ width: '400px' }}>
        <Div data-testid="recipe-responsive-container-target-wide" className={recipeMatrixResponsiveCard({ tone: 'alert' })}>
          Responsive container recipe branch
        </Div>
      </Div>
    </Main>
  )
}