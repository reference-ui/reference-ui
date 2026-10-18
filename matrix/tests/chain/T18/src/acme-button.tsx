import * as React from 'react'
import { Button } from '@fixtures/primitive-named-library'

/**
 * Package import of a primitive name from a third-party package (plan probe 1).
 * The fixture bundles its own runtime, so this `Button` mints
 * `primitive-named-library__c_*`; the name alone must not make it an own host.
 */
export function AcmeButtonProbe(): React.ReactElement {
  return (
    <Button data-testid="t18-acme-button" color="t18AcmeInk">
      third-party primitive
    </Button>
  )
}
