// Utility source for the NEO-LAYERS-01 extends upstream. It takes the css()
// call and emits one colour utility into the upstream's published streams:
// the extends entry the consumer ranks below its layered upstream.

import { css } from '@reference-ui/react'

export const extInkClass = css({ color: 'extInk' })
