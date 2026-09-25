import { css } from '@reference-ui/react'

declare const flag: boolean
declare const run: () => string

const part = { color: flag ? 'white' : run() }
export const spread = css({ ...part })
