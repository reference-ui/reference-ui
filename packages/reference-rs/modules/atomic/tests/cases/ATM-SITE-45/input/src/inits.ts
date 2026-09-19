const early = token('colors.gray.800')

import { css, token } from '@reference-ui/react'

const brand = token('colors.red.500')
const ghost = token('colors.nope.997', '#111')

export const a = css({ color: brand })
export const b = css({ color: ghost, margin: '2r' })
export const c = css({ color: early })
