import * as React from 'react'
import { Button } from './ui'

/**
 * Package primitive reached through a relative barrel (plan probe 2): lib's
 * runtime renders it, so the backing rule must be `reference-ui__c_*`.
 */
export function BarrelButtonProbe(): React.ReactElement {
  return (
    <Button data-testid="t18-barrel-button" color="t18BarrelInk">
      barrel primitive
    </Button>
  )
}
