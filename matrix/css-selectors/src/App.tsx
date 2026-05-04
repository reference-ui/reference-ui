import React from 'react'
import { Button, Div, H1, Main, P } from '@reference-ui/react'

import {
  adjacentSiblingSelectorClass,
  descendantSelectorClass,
  directChildSelectorClass,
  focusVisibleSelectorClass,
  generalSiblingSelectorClass,
  hoverSelectorClass,
  selectorRecipe,
  selfAttributeHoverSelectorClass,
  selfAttributeQuotedSelectorClass,
  selfAttributeSelectorClass,
  selfAttributeStateSelectorClass,
  topLevelConstantControlClass,
} from './styles'

export function Index() {
  return (
    <Main data-testid="css-selectors-root" p="4" gap="4">
      <H1>Reference UI css selectors matrix</H1>
      <P>Selector behavior is verified in the browser against rendered results.</P>

      <Div className={descendantSelectorClass} data-testid="css-selectors-descendant-parent">
        <Div data-slot="inner" data-testid="css-selectors-descendant-inner">
          Descendant selector target
        </Div>
      </Div>

      <Div className={directChildSelectorClass} data-testid="css-selectors-direct-parent">
        <Div data-slot="child" data-testid="css-selectors-direct-child">
          Direct child selector target
        </Div>
      </Div>

      <>
        <Div className={adjacentSiblingSelectorClass} data-testid="css-selectors-adjacent-leader">
          Adjacent selector leader
        </Div>
        <Div data-slot="peer" data-testid="css-selectors-adjacent-peer">
          Adjacent selector peer
        </Div>
      </>

      <>
        <Div className={generalSiblingSelectorClass} data-testid="css-selectors-general-leader">
          General selector leader
        </Div>
        <Div data-slot="spacer">Spacer</Div>
        <Div data-slot="overlay" data-testid="css-selectors-general-overlay">
          General selector overlay
        </Div>
      </>

      <Div className={hoverSelectorClass} data-testid="css-selectors-hover-target">
        Hover selector target
      </Div>

      <Button className={focusVisibleSelectorClass} data-testid="css-selectors-focus-visible-target">
        Focus visible selector target
      </Button>

      <Div className={topLevelConstantControlClass} data-testid="css-selectors-top-level-control">
        Top-level selector control
      </Div>

      <Div className={selfAttributeSelectorClass} data-component="card" data-testid="css-selectors-self-attribute-card">
        Self attribute card target
      </Div>
      <Div className={selfAttributeSelectorClass} data-component="panel" data-testid="css-selectors-self-attribute-panel">
        Self attribute panel control
      </Div>

      <Div
        className={selfAttributeHoverSelectorClass}
        data-component="card"
        data-testid="css-selectors-self-attribute-hover-card"
      >
        Self attribute hover card target
      </Div>
      <Div
        className={selfAttributeHoverSelectorClass}
        data-component="panel"
        data-testid="css-selectors-self-attribute-hover-panel"
      >
        Self attribute hover panel control
      </Div>

      <Div
        className={selfAttributeQuotedSelectorClass}
        data-component="card"
        data-testid="css-selectors-self-attribute-quoted-card"
      >
        Self attribute quoted card target
      </Div>

      <Div
        className={selfAttributeStateSelectorClass}
        data-component="card"
        data-state="open"
        data-testid="css-selectors-self-attribute-state-open"
      >
        Self attribute state open target
      </Div>
      <Div
        className={selfAttributeStateSelectorClass}
        data-component="card"
        data-state="closed"
        data-testid="css-selectors-self-attribute-state-closed"
      >
        Self attribute state closed control
      </Div>

      <Div className={selectorRecipe()} data-testid="css-selectors-recipe-default" data-component="recipe-card">
        <Div data-slot="recipe-inner" data-testid="css-selectors-recipe-inner">
          Recipe descendant target
        </Div>
        <Div data-slot="recipe-child" data-testid="css-selectors-recipe-child">
          Recipe direct child target
        </Div>
      </Div>

      <Div
        className={selectorRecipe({ tone: 'quiet' })}
        data-component="recipe-card"
        data-testid="css-selectors-recipe-quiet"
      >
        Recipe quiet target
      </Div>

      <Div
        className={selectorRecipe({ state: 'open' })}
        data-component="recipe-card"
        data-state="open"
        data-testid="css-selectors-recipe-state-open"
      >
        Recipe open state target
      </Div>

      <Div
        className={selectorRecipe({ tone: 'interactive', emphasis: 'strong' })}
        data-component="recipe-card"
        data-testid="css-selectors-recipe-compound"
      >
        Recipe compound target
      </Div>
    </Main>
  )
}