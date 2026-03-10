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
      <Span
        data-testid="consumer-layer-outside"
        color="var(--colors-test-primary)"
      >
        Outside consumer layer: var has no value
      </Span>
      <Div
        data-testid="consumer-layer-host"
        id="consumer-layer-id"
        layer="reference-test"
      >
        <Span
          data-testid="consumer-layer-text"
          color="var(--colors-test-primary)"
        >
          Inside consumer layer: test.primary via data-layer
        </Span>
      </Div>
      <Div
        data-testid="consumer-layer-mismatch-host"
        layer="reference-ui"
      >
        <Span
          data-testid="consumer-layer-mismatch"
          color="var(--colors-test-primary)"
        >
          Mismatched layer: test.primary should stay unset
        </Span>
        <Div
          data-testid="consumer-layer-nested-host"
          layer="reference-test"
        >
          <Span
            data-testid="consumer-layer-nested"
            color="var(--colors-test-primary)"
          >
            Nested matching layer restores test.primary
          </Span>
        </Div>
      </Div>
    </Div>
  )
}
