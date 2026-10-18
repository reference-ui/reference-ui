// Utility source for the NEO-LAYERS-01 layered upstream. It takes two css()
// calls, one colour and one background, and emits them into the layer's
// published streams for the consumer to paint or rank against.

import { css } from '@reference-ui/react'

export const layInkClass = css({ color: 'layInk' })
export const layPaperClass = css({ backgroundColor: 'layPaper' })
