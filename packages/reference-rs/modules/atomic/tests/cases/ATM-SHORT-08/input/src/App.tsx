import { css } from '@reference-ui/react'

export const a = css({ textGradient: 'linear-gradient({colors.red.200}, {colors.blue.300})' })
export const b = css({ '&:hover': { textGradient: 'linear-gradient({colors.red.500}, {colors.blue.500})' } })
