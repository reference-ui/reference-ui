import * as React from 'react'
import { Button } from '@reference-ui/lib/primitives'

/**
 * Package import of a primitive name: lib's `./primitives` subpath is lib's
 * generated runtime bound to `reference-ui`, so this `Button` mints
 * `reference-ui__c_*`. The import lands in lib's installed directory, which
 * published its system, so provenance keeps the tag lib's, not the app's. (It
 * once stayed external only because a foreign-runtime allowlist named
 * `@reference-ui/lib`; that list is gone.)
 */
export function LibButtonProbe(): React.ReactElement {
  return (
    <Button data-testid="t18-lib-button" color="t18LibInk">
      lib primitive
    </Button>
  )
}
