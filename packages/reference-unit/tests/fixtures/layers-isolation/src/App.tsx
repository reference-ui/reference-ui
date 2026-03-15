import { Div } from '@reference-ui/react'

import './system/styles'

export default function App() {
  return (
    <Div data-testid="fixture-root" padding="1rem" backgroundColor="fixtureAccent">
      <Div data-testid="fixture-layer-scope" padding="1rem">
        <Div
          data-testid="fixture-layer-target"
          color="var(--colors-fixture-accent)"
          padding="var(--spacing-1r)"
        >
          Layer target (consumer tokens)
        </Div>
      </Div>

      <Div data-testid="fixture-unlayered-target" color="var(--colors-fixture-accent)">
        Same scope (consumer tokens)
      </Div>
    </Div>
  )
}
