import { Div, H1, Main, P } from '@reference-ui/react'

import { recipeMatrixButton } from './styles'

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
        className={recipeMatrixButton({ visual: 'outline', tone: 'pink', size: 'lg', capsule: 'true' })}
      >
        Outline pink capsule compound branch
      </button>
    </Main>
  )
}