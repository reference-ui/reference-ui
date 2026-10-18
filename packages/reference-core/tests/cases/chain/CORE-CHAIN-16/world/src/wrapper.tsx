// Same-file `css` wrapper for the CORE-CHAIN-16 world. It takes the installed package's `Button`, wraps it in `Wrap`, which
// hands its `css` prop straight through, and emits one call site that styles the wrapper. The warning belongs to that
// call site, where the style is written; the forwarding `<Button css={css}>` inside the wrapper must stay silent.
import type { ReactElement, ReactNode } from 'react'
import { Button } from '@fixture/chain16'

const Wrap = ({ css, children }: { css?: Record<string, string>; children?: ReactNode }) => (
  <Button css={css}>{children}</Button>
)

export function Wrapped(): ReactElement {
  return <Wrap css={{ color: 'chain16Ink' }}>wrapped button</Wrap>
}
