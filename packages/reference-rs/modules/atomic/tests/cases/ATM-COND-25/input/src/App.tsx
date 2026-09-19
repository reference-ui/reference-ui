import { css } from '@reference-ui/react'

export const notCompound = css({ '&:not(&.no)': { color: 'red.500' } })
export const hasList = css({ '&:has(&, :not(&))': { color: 'blue.500' } })
export const descendantNotSibling = css({ '&.b :not(& + &)': { color: 'green.500' } })
export const compoundNotSibling = css({ '&.b:not(& + &)': { color: 'amber.500' } })
export const descendantIs = css({ '&.b :is(&)': { color: 'violet.500' } })
export const compoundIs = css({ '&.b:is(&)': { color: 'cyan.500' } })
export const isInnerCompound = css({ '&:is(.bar, &.baz)': { color: 'pink.500' } })
export const notSelf = css({ '&:not(&)': { color: 'orange.500' } })
