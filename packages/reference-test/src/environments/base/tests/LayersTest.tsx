import { Div, Span } from '@reference-ui/react'

/**
 * Uses a foundational token from @reference-ui/lib baseSystem via layers mode.
 * Only works when ui.config has layers: [baseSystem] (tokens via [data-layer]).
 * Token is not in TypeScript—use CSS var via color prop.
 */
export default function LayersTest() {
  return (
    <Div>
      <Span
        data-testid="layers-outside"
        color="var(--colors-teal-500)"
      >
        Outside layer: var has no value
      </Span>
      <Div layer="reference-ui">
        <Span
          data-testid="layers-test"
          color="var(--colors-teal-500)"
        >
          Inside layer: teal.500 via data-layer
        </Span>
      </Div>
    </Div>
  )
}
