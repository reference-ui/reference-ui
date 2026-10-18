// Utility source for the CORE-LAYERS-14 twin upstream. It takes one css() call on its colour
// and emits the utility into the upstream's published streams.

import { css } from '@reference-ui/react'

export const twinInkClass = css({ color: 'twinInk' })
