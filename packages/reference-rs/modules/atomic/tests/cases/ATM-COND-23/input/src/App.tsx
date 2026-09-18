import { css } from '@reference-ui/react'

export const comma = css({ '&:not(:first-child), :only-child': { display: 'none' } })
export const nested = css({
  '&:not(:first-child), :only-child': { '& .left-border': { display: 'none' } },
})
export const mixed = css({ '& .one, .two': { color: 'red.500' } })
