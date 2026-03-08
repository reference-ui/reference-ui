import { Div } from '@reference-ui/react'

import './system/styles'

export default function App() {
  return (
    <Div data-testid="fixture-root" padding="1rem" backgroundColor="fixtureAccent">
      <Div data-testid="fixture-layer-scope" layer="reference-app" padding="1rem">
        <Div
          data-testid="fixture-layer-target"
          color="var(--colors-reference-app-token)"
          backgroundColor="var(--colors-ref-lib-canary)"
          padding="var(--spacing-1r)"
        >
          Layer target
        </Div>
      </Div>

      <Div data-testid="fixture-unlayered-target" color="var(--colors-reference-app-token)">
        Unlayered target
      </Div>
    </Div>
  )
}
