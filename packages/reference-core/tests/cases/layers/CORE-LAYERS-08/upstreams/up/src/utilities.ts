// Utility source for the CORE-LAYERS-08 layered upstream. It takes one css() call on its
// ink token, so the layer ships utility CSS alongside its tokens and global rules.

import { css } from '@reference-ui/react'

export const upInkClass = css({ color: 'upInk' })
