import { defineRecipe } from '@pandacss/dev'
import { baseTypography } from './base.typography'

export const strongStyle = defineRecipe({
  className: 'r_strong',
  base: {
    ...baseTypography,
    fontWeight: 'bold',
  },
})
