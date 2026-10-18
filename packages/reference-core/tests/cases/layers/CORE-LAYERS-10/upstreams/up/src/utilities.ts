// Utility source for the CORE-LAYERS-10 layered upstream. It takes one css() call and emits the
// probeInk utility into the layer's published streams, so the rule the upstream's published
// component names exists in the consumer's sheet.

import { css } from '@reference-ui/react'

export const probeInkClass = css({ color: 'probeInk' })
