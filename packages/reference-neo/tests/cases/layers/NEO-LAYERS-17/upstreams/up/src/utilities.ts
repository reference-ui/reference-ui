// Utility source for the NEO-LAYERS-17 layered upstream. It takes one css() call per colour token its published
// component paints, so the rules those class names point at are emitted into the upstream's own layer.

import { css } from '@reference-ui/react'

export const upInkClass = css({ color: 'upInk' })
export const upSoftClass = css({ color: 'upSoft' })
