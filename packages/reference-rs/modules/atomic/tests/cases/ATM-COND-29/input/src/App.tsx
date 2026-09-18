import { css } from '@reference-ui/react'

export const beforeFocus = css({ '&::before': { '&:focus': { color: 'red.500' } } })
export const afterHover = css({ '&::after': { '&:hover': { color: 'blue.500' } } })
export const dialect = css({ _before: { _focus: { color: 'green.500' } } })
export const deep = css({
  '&::before': { '&:hover': { '&:focus': { color: 'red.500' } } },
})
export const outerControl = css({ '&:hover': { '&::before': { color: 'blue.500' } } })
export const descendantControl = css({
  '&::before': { '& .kid': { color: 'green.500' } },
})
