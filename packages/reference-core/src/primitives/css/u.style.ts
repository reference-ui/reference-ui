import { defineRecipe } from '@pandacss/dev'
import { baseTypography } from './base.typography'

export const uStyle = defineRecipe({
  className: 'r_u',
  base: {
    ...baseTypography,
    textDecoration: 'underline',
    textUnderlineOffset: '0.15em',
    textDecorationThickness: '0.08em',
  },
})
