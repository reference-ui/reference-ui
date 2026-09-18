import { css } from '@reference-ui/react'

export const multi = css({ '& .divider': { '& .bar & .baz': { color: 'red.500' } } })
export const sibling = css({ '& > .row': { '& + &': { color: 'red.500' } } })
export const control = css({ '& > p': { '&:hover': { color: 'red.500' } } })
