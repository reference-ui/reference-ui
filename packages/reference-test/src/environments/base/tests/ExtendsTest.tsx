import { Div } from '@reference-ui/react'

/**
 * Uses refLibCanary from @reference-ui/lib baseSystem via extends.
 * Token is on :root. Works when ui.config has extends: [baseSystem].
 * Uses var() so it also works when testing layers (token on data-layer).
 */
export default function ExtendsTest() {
  return (
    <Div>
      <span
        data-testid="extends-test"
        style={{ color: 'var(--colors-ref-lib-canary)' }}
      >
        ExtendsTest: refLibCanary
      </span>
    </Div>
  )
}
