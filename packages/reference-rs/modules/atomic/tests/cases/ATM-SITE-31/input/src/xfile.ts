import { css } from '@reference-ui/react'
import { xaccent, xconfig, xroll, xtone, xwidth } from './helpers'

// Imported helpers fold through the descriptor export (SPEC-V2-57, Ph4).
export const x1 = css({ color: xtone('orange') })
export const x2 = css({ color: xaccent(), width: xwidth(4) })
export const x3 = css({ ...xconfig(), padding: '4px' })
export const x4 = css({ color: xroll(), margin: '14r' })
