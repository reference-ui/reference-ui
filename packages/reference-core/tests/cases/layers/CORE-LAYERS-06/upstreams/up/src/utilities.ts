// Utility source for the CORE-LAYERS-06 upstream. It takes one css() call on the
// upstream token and emits the colour utility into the upstream's published
// streams, the entry the consumer layers or extends.
import { css } from '@reference-ui/react'

export const upInkClass = css({ color: 'upInk' })
