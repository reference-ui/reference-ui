import { Div, H1, Main, P } from '@reference-ui/react'
import { watchCssClass } from './watch/css'
import { watchPrimitiveColor } from './watch/primitive'
import { watchRecipe } from './watch/recipe'

export const matrixWatchMarker = 'reference-ui-matrix-watch'

export function Index() {
  return (
    <Main data-testid="watch-root" p="4" gap="4">
      <H1>Reference UI Watch matrix</H1>
      <P>Watch mode stays alive while the suite edits source files and waits for runtime-ready output.</P>
      <div data-testid="watch-css" className={watchCssClass}>
        watch css
      </div>
      <Div data-testid="watch-primitive" color={watchPrimitiveColor} p="3">
        watch primitive
      </Div>
      <Div data-testid="watch-token" color="watch-sync.primary" p="2">
        watch token
      </Div>
      <div data-testid="watch-recipe" className={watchRecipe({ tone: 'solid' })}>
        watch recipe
      </div>
    </Main>
  )
}