import { css } from '@reference-ui/react'

export const descendantPseudo = css({ '& ::after': { color: 'red.500' } })
export const compoundBefore = css({ '::before&': { color: 'blue.500' } })
export const singleColonBefore = css({ ':before&': { color: 'green.500' } })
export const ancestorBefore = css({ '::before &': { color: 'amber.500' } })
export const lastChildIs = css({
  '&:last-child': { '& :is(.a, .b)': { display: 'none' } },
})
export const deepStack = css({
  '& .b': { '& .c': { '& .d': { color: 'violet.500' } } },
})
export const childStack = css({
  '& > .row': { '& > .cell': { color: 'cyan.500' } },
})
