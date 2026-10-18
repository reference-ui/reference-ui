import * as React from 'react'
import { Button } from '@reference-ui/lib/primitives'

/**
 * Package import of a primitive name: lib's `./primitives` subpath is lib's
 * generated runtime bound to `reference-ui`, so this `Button` mints
 * `reference-ui__c_*`. External on today's compiler (the foreign-runtime
 * allowlist names `@reference-ui/lib`); provenance must keep it external once
 * that allowlist is deleted.
 */
export function LibButtonProbe(): React.ReactElement {
  return (
    <Button data-testid="t18-lib-button" color="t18LibInk">
      lib primitive
    </Button>
  )
}
