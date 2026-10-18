// Utility source for the NEO-LAYERS-09 layered upstream. It takes one css() call and
// emits the ink utility into the layer's published streams, so the rule the upstream's
// published component names exists in the consumer's sheet.

import { css } from '@reference-ui/react'

export const upInkClass = css({ color: 'upInk' })
