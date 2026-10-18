/**
 * Same-file `css` wrappers for ATM-SITE-98. `Wrap` threads its `css` into
 * lib's `Button` (a package tag), so the call-site `css` is external;
 * `OwnWrap` threads into Reference's `Div`, so its call-site `css` stays own.
 */
import { Div } from '@reference-ui/react'
import { Button } from '@reference-ui/lib/primitives'

const Wrap = ({ css }: { css?: object }) => <Button css={css} />
const OwnWrap = ({ css }: { css?: object }) => <Div css={css} />

export function App() {
  return (
    <>
      <Wrap css={{ color: 'blue' }} />
      <OwnWrap css={{ bg: 'red' }} />
    </>
  )
}
