import { defineRecipe } from '@pandacss/dev'
import { baseTypography } from './base.typography'

export const citeStyle = defineRecipe({
  className: 'r_cite',
  base: {
    ...baseTypography,
    fontStyle: 'italic',
    color: 'gray.500',
  },
})
