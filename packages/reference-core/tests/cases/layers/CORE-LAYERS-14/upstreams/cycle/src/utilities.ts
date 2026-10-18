// Utility source for the CORE-LAYERS-14 cycle upstream. It takes one css() call on its
// colour and emits the utility into the upstream's published streams.

import { css } from '@reference-ui/react'

export const cycleInkClass = css({ color: 'cycleInk' })
