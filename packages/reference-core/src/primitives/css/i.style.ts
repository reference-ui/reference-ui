import { defineRecipe } from '@pandacss/dev'
import { baseTypography } from './base.typography'

export const iStyle = defineRecipe({
  className: 'r_i',
  base: {
    ...baseTypography,
    fontStyle: 'italic',
  },
})
