import { Div } from '@reference-ui/react'

/**
 * Uses a foundational token from @reference-ui/lib baseSystem via extends.
 * Token is on :root. Works when ui.config has extends: [baseSystem].
 * Uses var() so it also works when testing layers (token on data-layer).
 */
export default function ExtendsTest() {
  return (
    <Div>
      <span
        data-testid="extends-test"
        style={{ color: 'var(--colors-teal-500)' }}
      >
        ExtendsTest: teal.500
      </span>
    </Div>
  )
}
