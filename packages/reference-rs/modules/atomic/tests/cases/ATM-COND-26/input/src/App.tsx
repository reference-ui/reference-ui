import { css } from '@reference-ui/react'

export const chainedSibling = css({ '&&+&': { color: 'red.500' } })
export const double = css({ '&&': { color: 'blue.500' } })
export const triple = css({ '&&&': { color: 'green.500' } })
export const compoundDescendant = css({ '&.b &': { color: 'amber.500' } })
export const compoundSandwich = css({ '&.b&': { color: 'violet.500' } })
export const siblingTight = css({ '&+&': { color: 'cyan.500' } })
export const multiBar = css({ '& .bar & .baz & .qux': { color: 'pink.500' } })
