import { Div, Span } from '@reference-ui/react'

/**
 * Uses a foundational token from @fixtures/layer-library via layers mode.
 * When ui.config has layers: [layerBaseSystem], upstream CSS is appended.
 * Primitives automatically get data-layer from ui.config.name (reference-e2e);
 * consumer tokens resolve under that scope. Non-primitive elements outside
 * any primitive have no data-layer and do not see the token.
 */
export default function LayersTest() {
  return (
    <>
      <span data-testid="consumer-layer-outside" style={{ color: 'var(--colors-test-primary)' }}>
        Outside primitive: var has no value
      </span>
      <Div data-testid="consumer-layer-scope-root">
        <Div
          data-testid="consumer-layer-host"
          id="consumer-layer-id"
        >
          <span
            data-testid="consumer-layer-raw-child"
            style={{ color: 'var(--colors-test-primary)' }}
          >
            Raw DOM inside consumer layer host inherits the scoped token
          </span>
          <Span
            data-testid="consumer-layer-text"
            color="var(--colors-test-primary)"
          >
            Inside consumer layer: test.primary via data-layer
          </Span>
          <Span
            data-testid="consumer-layer-color-mode-light"
            color="test.colorMode"
          >
            Consumer color mode token in default scope
          </Span>
          <Div
            data-testid="consumer-layer-dark-island"
            colorMode="dark"
          >
            <Span
              data-testid="consumer-layer-color-mode-dark"
              color="test.colorMode"
            >
              Consumer color mode token in dark scope
            </Span>
          </Div>
        </Div>
        <Div data-testid="layers-outside">
          <Span
            data-testid="layers-test"
            color="var(--colors-lightDarkDemoBg)"
          >
            Upstream token (layer-library) only in upstream layer CSS; consumer primitives use reference-e2e scope
          </Span>
        </Div>
      </Div>
    </>
  )
}
