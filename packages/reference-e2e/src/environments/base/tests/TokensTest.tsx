import { Div, css } from '@reference-ui/react'

export default function TokensTest() {
  return (
    <div id="tokens-test" data-testid="tokens-test">
      <Div
        data-testid="tokens-primitive"
        color="test.primary"
        padding="test-md"
        borderRadius="test-round"
      >
        Tokens: primitive
      </Div>

      <Div
        data-testid="tokens-css"
        className={css({
          color: 'test.primary',
          padding: 'test-md',
          borderRadius: 'test-round',
          bg: 'test.muted',
        })}
      >
        Tokens: css()
      </Div>

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
        <Div data-testid="tokens-docs-preview-light" color="test.colorMode">
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
    </div>
  )
}
