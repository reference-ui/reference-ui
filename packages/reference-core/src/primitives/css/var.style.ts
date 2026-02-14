import { defineRecipe } from '@pandacss/dev'
import { baseTypography } from './base.typography'

export const varStyle = defineRecipe({
  className: 'r_var',
  base: {
    ...baseTypography,
    fontFamily: 'serif',
    letterSpacing: 'normal',
    fontStyle: 'italic',
    color: 'blue.600',
  },
})
