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

      <div
        data-testid="tokens-css"
        className={css({
          color: 'test.primary',
          padding: 'test-md',
          borderRadius: 'test-round',
          bg: 'test.muted',
        })}
      >
        Tokens: css()
      </div>
    </div>
  )
}
