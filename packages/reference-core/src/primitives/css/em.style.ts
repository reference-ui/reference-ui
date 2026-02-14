import { defineRecipe } from '@pandacss/dev'
import { baseTypography } from './base.typography'

export const emStyle = defineRecipe({
  className: 'r_em',
  base: {
    ...baseTypography,
    fontStyle: 'italic',
  },
})
