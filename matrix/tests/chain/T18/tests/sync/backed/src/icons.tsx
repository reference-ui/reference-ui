import * as React from 'react'
import { CheckIcon, ContentCopyIcon } from '@reference-ui/icons'

/** Composed leg: the styled icon is backed under `reference-icons__`. */
export function BackedIcons(): React.ReactElement {
  return (
    <div>
      <ContentCopyIcon color="t18BackedInk" />
      <CheckIcon />
    </div>
  )
}
