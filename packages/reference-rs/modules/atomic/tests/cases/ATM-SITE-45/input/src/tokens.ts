import { css, token } from '@reference-ui/react'
import { token as t } from '@reference-ui/system'

const path = 'colors.gray.800'
const fallback = '#fff'

export const a = css({ color: token('colors.red.500') })
export const b = css({ color: token.var('colors.red.500') })
export const c = css({ color: t('colors.gray.800') })
export const d = css({ color: token('colors.nope.999', '#000') })
export const e = css({ color: token('colors.red.500', '#000') })
export const f = css({ color: token(path) })
export const g = css({ color: token('colors.nope.998', fallback) })
export const h = css({ backgroundColor: token('colors.red.500'), margin: '1r' })
export const i = css({ color: token(`colors.gray.800`) })
