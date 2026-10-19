/** Uncomposed leg: the styled icon warns, the unstyled one stays silent. */

import * as React from 'react'
import { CheckIcon, ContentCopyIcon } from '@reference-ui/icons'

export function UnbackedIcons(): React.ReactElement {
  return (
    <div>
      <ContentCopyIcon color="t18UnbackedInk" />
      <CheckIcon />
    </div>
  )
}
