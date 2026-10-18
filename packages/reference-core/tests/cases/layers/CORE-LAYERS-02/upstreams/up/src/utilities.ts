// Utility source for the CORE-LAYERS-02 upstream. It takes one css() call on its ink
// token and emits the utility into the upstream's published streams, which is the CSS
// the consumer receives under both layers and extends.

import { css } from '@reference-ui/react'

export const upInkClass = css({ color: 'upInk' })
