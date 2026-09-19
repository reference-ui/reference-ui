import { css } from '@reference-ui/react'

declare function getColor(): string

const s = s
export const selfInit = css({ color: s, margin: '1r' })

const c1 = c2
const c2 = c1
export const cycle = css({ color: c1, margin: '2r' })

let shade: string
export const noInit = css({ color: shade, margin: '3r' })

export const bareFn = css({ color: getColor, margin: '4r' })

const theme = { primary: 'red' }
export const missingMember = css({ color: theme.colors.blue, margin: '5r' })
