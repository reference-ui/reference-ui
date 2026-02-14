import { defineRecipe } from '@pandacss/dev'
import { baseTypography } from './base.typography'

export const bStyle = defineRecipe({
  className: 'r_b',
  base: {
    ...baseTypography,
    fontWeight: 'bold',
  },
})
