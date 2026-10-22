// Utility source for the CORE-WATCH-32 world. It takes css() and emits two classes that read the big
// upstream's tokens, so every resync compiles real styles against the extended system.

import { css } from '@reference-ui/react'

export const ink = css({ color: 'big0', padding: '2r' })
export const paper = css({ backgroundColor: 'big1', margin: '1r' })
