// Utility source for the NEO-LAYERS-15 layered upstream. It takes two css() calls, an ink
// colour and a paper background. The spec removes the paper call mid-run to prove the
// removed rule leaves the consumer's sheet on re-sync.

import { css } from '@reference-ui/react'

export const lcInkClass = css({ color: 'lcInk' })
export const lcPaperClass = css({ backgroundColor: 'lcPaper' })
