import * as React from 'react'
import { ContentCopyIcon } from '@reference-ui/icons'

/**
 * A style prop on an icon while `@reference-ui/icons/baseSystem` is composed
 * (here in `layers`; plan §9.5). Icons' runtime mints `reference-icons__c_*`
 * and the composed system backs it, so the prop paints.
 */
export function IconProbe(): React.ReactElement {
  return <ContentCopyIcon data-testid="t18-icon" color="t18IconInk" />
}
