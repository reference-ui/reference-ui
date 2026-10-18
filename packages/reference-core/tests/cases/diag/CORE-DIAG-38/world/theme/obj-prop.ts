import { css } from '@reference-ui/react'

declare const pick: () => string

const dyn = { color: pick(), padding: '4px' }
export const spread = css({ ...dyn })
