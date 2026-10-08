import { css } from '@reference-ui/react'

declare const flag: boolean
declare const u: boolean

export const midSlot = css({ padding: [2, flag ? 2 : 3, 4] })
export const elision = css({ padding: [1, , 3] })
export const argTernary = css(u ? { color: 'red' } : { color: 'blue' })
