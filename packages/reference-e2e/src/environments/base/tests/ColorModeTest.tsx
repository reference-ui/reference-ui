import { Div } from '@reference-ui/react'

export default function ColorModeTest() {
  return (
    <div id="color-mode-test" data-testid="color-mode-test">
      <div data-testid="tokens-light-scope" data-panda-theme="light">
        <Div data-testid="tokens-mode-outer-light" color="test.colorMode">
          Tokens: light scope
        </Div>
        <Div data-testid="tokens-mode-inner-dark" colorMode="dark" color="test.colorMode">
          Tokens: nested dark scope
        </Div>
      </div>

      <div data-testid="tokens-dark-scope" data-panda-theme="dark">
        <Div data-testid="tokens-docs-preview-dark" colorMode="dark" color="test.colorMode">
          Tokens: docs-style dark preview
        </Div>
        <Div data-testid="tokens-docs-preview-light" colorMode="light" color="test.colorMode">
          Tokens: docs-style light preview
        </Div>
      </div>

      <div data-testid="tokens-docs-light-host" data-panda-theme="light">
        <Div data-testid="tokens-docs-light-host-token" color="test.colorMode">
          Tokens: docs-style light host
        </Div>
        <Div
          data-testid="tokens-docs-dark-island-token"
          colorMode="dark"
          color="test.colorMode"
        >
          Tokens: docs-style dark island
        </Div>
      </div>

      <div data-testid="tokens-cascade-dark-host" data-panda-theme="dark">
        <Div data-testid="tokens-cascade-light-scope" colorMode="light">
          <Div data-testid="tokens-cascade-light-child" color="test.colorMode">
            Tokens: cascade light child
          </Div>
        </Div>
        <Div data-testid="tokens-cascade-dark-scope" colorMode="dark">
          <Div data-testid="tokens-cascade-dark-child" color="test.colorMode">
            Tokens: cascade dark child
          </Div>
        </Div>
      </div>
    </div>
  )
}
