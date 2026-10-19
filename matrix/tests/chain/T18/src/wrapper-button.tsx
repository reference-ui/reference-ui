/**
 * A same-file `css` wrapper around a package primitive (plan probe 3). The
 * call-site `css` threads into lib's `Button`, whose runtime mints
 * `reference-ui__c_*`, so the threaded want is external, never own.
 */

import * as React from 'react'
import { Button } from '@reference-ui/lib/primitives'

type WrapProps = {
  css?: React.ComponentProps<typeof Button>['css']
}

function Wrap({ css }: WrapProps): React.ReactElement {
  return (
    <Button data-testid="t18-wrapper-button" css={css}>
      wrapped primitive
    </Button>
  )
}

export function WrapperButtonProbe(): React.ReactElement {
  return <Wrap css={{ color: 't18WrapInk' }} />
}
