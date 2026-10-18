// Same-file `css` wrapper for the CORE-CHAIN-15 world. It takes the prebuilt package's `Button`, wraps it in `Wrap`, which
// hands its `css` prop straight through, and emits one call site that styles the wrapper with the consumer-only token.
// The call-site `css` reaches the package's runtime, so it must compile as the package's, not the app's.
import type { ReactElement, ReactNode } from 'react'
import { Button } from '@fixture/chain15'

const Wrap = ({ css, children }: { css?: Record<string, string>; children?: ReactNode }) => (
  <Button css={css} data-testid="chain15-wrapper">
    {children}
  </Button>
)

export function Wrapped(): ReactElement {
  return <Wrap css={{ color: 'chain15Ink' }}>wrapped button</Wrap>
}
